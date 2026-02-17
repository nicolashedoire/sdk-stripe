/**
 * Next.js specific utilities for Stripe integration.
 *
 * Provides ready-to-use Server Actions and API route helpers.
 */

export { createNextWebhookHandler, createPagesWebhookHandler } from '../server/webhooks';

// ─── Server Action Helpers ───────────────────────────────────────────

import {
  createPaymentIntent as _createPaymentIntent,
  createCheckoutSession as _createCheckoutSession,
  createSetupIntent as _createSetupIntent,
} from '../server/payments';
import { createCustomer as _createCustomer } from '../server/customers';
import { createPortalSession as _createPortalSession } from '../server/customers';
import {
  createSubscription as _createSubscription,
  cancelSubscription as _cancelSubscription,
  resumeSubscription as _resumeSubscription,
} from '../server/subscriptions';
import type {
  CreatePaymentIntentInput,
  CreateCheckoutSessionInput,
  CreateSetupIntentInput,
  CreateCustomerInput,
  CreatePortalSessionInput,
  CreateSubscriptionInput,
  CancelSubscriptionInput,
} from '../types';

/**
 * Pre-built Server Actions for Next.js App Router.
 *
 * Usage in a Server Component or `use server` file:
 * ```ts
 * 'use server';
 * import { actions } from '@stripe-sdk/core/next';
 *
 * export const createPayment = async (amount: number, currency: string) => {
 *   const result = await actions.createPaymentIntent({ amount, currency });
 *   if (result.error) throw new Error(result.error.message);
 *   return { clientSecret: result.data.client_secret };
 * };
 * ```
 */
export const actions = {
  createPaymentIntent: async (input: CreatePaymentIntentInput) => {
    return _createPaymentIntent(input);
  },

  createCheckoutSession: async (input: CreateCheckoutSessionInput) => {
    return _createCheckoutSession(input);
  },

  createSetupIntent: async (input: CreateSetupIntentInput) => {
    return _createSetupIntent(input);
  },

  createCustomer: async (input: CreateCustomerInput) => {
    return _createCustomer(input);
  },

  createPortalSession: async (input: CreatePortalSessionInput) => {
    return _createPortalSession(input);
  },

  createSubscription: async (input: CreateSubscriptionInput) => {
    return _createSubscription(input);
  },

  cancelSubscription: async (input: CancelSubscriptionInput) => {
    return _cancelSubscription(input);
  },

  resumeSubscription: async (subscriptionId: string) => {
    return _resumeSubscription(subscriptionId);
  },
};

// ─── API Route Helpers ───────────────────────────────────────────────

/**
 * Creates a Next.js API route handler for creating payment intents.
 *
 * Usage in app/api/create-payment-intent/route.ts:
 * ```ts
 * import { createPaymentIntentRoute } from '@stripe-sdk/core/next';
 * export const POST = createPaymentIntentRoute();
 * ```
 */
export function createPaymentIntentRoute(
  options?: {
    beforeCreate?: (input: CreatePaymentIntentInput, request: Request) => Promise<CreatePaymentIntentInput>;
  }
) {
  return async function POST(request: Request): Promise<Response> {
    try {
      let input: CreatePaymentIntentInput = await request.json();

      if (options?.beforeCreate) {
        input = await options.beforeCreate(input, request);
      }

      const result = await _createPaymentIntent(input);

      if (result.error) {
        return new Response(JSON.stringify(result.error), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({ clientSecret: result.data.client_secret, id: result.data.id }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}

/**
 * Creates a Next.js API route handler for creating checkout sessions.
 *
 * Usage in app/api/create-checkout-session/route.ts:
 * ```ts
 * import { createCheckoutSessionRoute } from '@stripe-sdk/core/next';
 * export const POST = createCheckoutSessionRoute();
 * ```
 */
export function createCheckoutSessionRoute(
  options?: {
    beforeCreate?: (input: CreateCheckoutSessionInput, request: Request) => Promise<CreateCheckoutSessionInput>;
  }
) {
  return async function POST(request: Request): Promise<Response> {
    try {
      let input: CreateCheckoutSessionInput = await request.json();

      if (options?.beforeCreate) {
        input = await options.beforeCreate(input, request);
      }

      const result = await _createCheckoutSession(input);

      if (result.error) {
        return new Response(JSON.stringify(result.error), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({ sessionId: result.data.id, url: result.data.url }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}

/**
 * Creates a Next.js API route handler for creating portal sessions.
 *
 * Usage in app/api/create-portal-session/route.ts:
 * ```ts
 * import { createPortalSessionRoute } from '@stripe-sdk/core/next';
 * export const POST = createPortalSessionRoute();
 * ```
 */
export function createPortalSessionRoute() {
  return async function POST(request: Request): Promise<Response> {
    try {
      const input: CreatePortalSessionInput = await request.json();
      const result = await _createPortalSession(input);

      if (result.error) {
        return new Response(JSON.stringify(result.error), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({ url: result.data.url }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}
