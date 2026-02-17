import type Stripe from 'stripe';
import { getStripe, getConfig } from '../stripe-client';
import type { WebhookHandlerMap, WebhookHandler } from '../../types';

const MAX_BODY_SIZE = 1024 * 1024; // 1 MB

export interface WebhookConfig {
  secret?: string;
  handlers: WebhookHandlerMap;
  onError?: (error: Error, event?: Stripe.Event) => void | Promise<void>;
  onUnhandledEvent?: (event: Stripe.Event) => void | Promise<void>;
}

export function createWebhookHandler(config: WebhookConfig) {
  const webhookSecret = config.secret ?? getConfig().webhookSecret;

  if (!webhookSecret) {
    throw new Error(
      '[@stripe-sdk/core] Webhook secret is required. Pass it via config.secret or initStripe({ webhookSecret }).'
    );
  }

  return async function handleWebhook(
    body: string | Buffer,
    signature: string
  ): Promise<{ received: true; type: string }> {
    const stripe = getStripe();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const verificationError = err instanceof Error ? err : new Error('Webhook signature verification failed');
      if (config.onError) {
        await config.onError(verificationError);
      }
      throw verificationError;
    }

    const handler: WebhookHandler | undefined = config.handlers[event.type];

    if (handler) {
      try {
        await handler(event);
      } catch (error) {
        if (config.onError) {
          await config.onError(error instanceof Error ? error : new Error(String(error)), event);
        } else {
          throw error;
        }
      }
    } else if (config.onUnhandledEvent) {
      await config.onUnhandledEvent(event);
    }

    return { received: true, type: event.type };
  };
}

/**
 * Helper for Next.js App Router webhook route
 */
export function createNextWebhookHandler(config: WebhookConfig) {
  const handler = createWebhookHandler(config);

  return async function POST(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response(null, { status: 405 });
    }

    try {
      const contentLength = request.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
        return new Response(JSON.stringify({ error: 'Webhook body too large' }), {
          status: 413,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const body = await request.text();

      if (body.length > MAX_BODY_SIZE) {
        return new Response(JSON.stringify({ error: 'Webhook body too large' }), {
          status: 413,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const signature = request.headers.get('stripe-signature');

      if (!signature) {
        return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const result = await handler(body, signature);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('[@stripe-sdk/core] Webhook error:', error instanceof Error ? error.message : 'Unknown error');

      return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}

/**
 * Helper for Next.js Pages Router webhook route
 */
export function createPagesWebhookHandler(webhookConfig: WebhookConfig) {
  const handler = createWebhookHandler(webhookConfig);

  return async function webhookRoute(
    req: { method?: string; headers: Record<string, string | string[] | undefined>; body?: unknown; on?: (event: string, cb: (...args: unknown[]) => void) => void },
    res: { status: (code: number) => { json: (data: unknown) => void; end: () => void } }
  ): Promise<void> {
    if (req.method !== 'POST') {
      res.status(405).end();
      return;
    }

    try {
      const body = await getRawBody(req);
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        res.status(400).json({ error: 'Missing stripe-signature header' });
        return;
      }

      const result = await handler(body, signature);
      res.status(200).json(result);
    } catch (error) {
      console.error('[@stripe-sdk/core] Webhook error:', error instanceof Error ? error.message : 'Unknown error');
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  };
}

function getRawBody(req: { on?: (event: string, cb: (...args: unknown[]) => void) => void; body?: unknown }): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof req.body === 'string') {
      if (req.body.length > MAX_BODY_SIZE) {
        reject(new Error('Webhook body too large'));
        return;
      }
      resolve(req.body);
      return;
    }
    if (Buffer.isBuffer(req.body)) {
      if (req.body.length > MAX_BODY_SIZE) {
        reject(new Error('Webhook body too large'));
        return;
      }
      resolve(req.body.toString('utf8'));
      return;
    }
    if (!req.on) {
      reject(new Error('Cannot read raw body from request'));
      return;
    }
    const chunks: Buffer[] = [];
    let totalLength = 0;
    let rejected = false;
    req.on('data', (chunk: unknown) => {
      if (rejected) return;
      const buf = Buffer.from(chunk as Uint8Array);
      totalLength += buf.length;
      if (totalLength > MAX_BODY_SIZE) {
        rejected = true;
        reject(new Error('Webhook body too large'));
        return;
      }
      chunks.push(buf);
    });
    req.on('end', () => {
      if (!rejected) resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', reject);
  });
}
