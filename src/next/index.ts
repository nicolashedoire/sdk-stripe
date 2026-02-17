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
 * Authorization callback type.
 * Must return true if the request is authorized, or throw an error / return false otherwise.
 */
export type AuthorizeFn = (request: Request) => Promise<boolean | void>;

/**
 * Creates authorized server actions for Next.js App Router.
 *
 * IMPORTANT: You MUST provide an `authorize` callback that verifies
 * the current user's session/identity before any Stripe operation.
 *
 * Usage in a `use server` file:
 * ```ts
 * 'use server';
 * import { createActions } from '@stripe-sdk/core/next';
 * import { getServerSession } from 'next-auth';
 *
 * const actions = createActions({
 *   authorize: async () => {
 *     const session = await getServerSession();
 *     if (!session) throw new Error('Unauthorized');
 *   },
 * });
 *
 * export const createPayment = actions.createPaymentIntent;
 * ```
 */
export function createActions(config: { authorize: () => Promise<boolean | void> }) {
  async function checkAuth(): Promise<void> {
    const result = await config.authorize();
    if (result === false) {
      throw new Error('Unauthorized');
    }
  }

  return {
    createPaymentIntent: async (input: CreatePaymentIntentInput) => {
      await checkAuth();
      return _createPaymentIntent(input);
    },

    createCheckoutSession: async (input: CreateCheckoutSessionInput) => {
      await checkAuth();
      return _createCheckoutSession(input);
    },

    createSetupIntent: async (input: CreateSetupIntentInput) => {
      await checkAuth();
      return _createSetupIntent(input);
    },

    createCustomer: async (input: CreateCustomerInput) => {
      await checkAuth();
      return _createCustomer(input);
    },

    createPortalSession: async (input: CreatePortalSessionInput) => {
      await checkAuth();
      return _createPortalSession(input);
    },

    createSubscription: async (input: CreateSubscriptionInput) => {
      await checkAuth();
      return _createSubscription(input);
    },

    cancelSubscription: async (input: CancelSubscriptionInput) => {
      await checkAuth();
      return _cancelSubscription(input);
    },

    resumeSubscription: async (subscriptionId: string) => {
      await checkAuth();
      return _resumeSubscription(subscriptionId);
    },
  };
}

// ─── API Route Helpers ───────────────────────────────────────────────

interface RouteOptions<TInput> {
  /**
   * REQUIRED: Authorization callback. Must verify the user's identity.
   * Throw an error or return false to reject the request.
   */
  authorize: AuthorizeFn;
  /**
   * Optional hook to transform/validate input before creating the resource.
   */
  beforeCreate?: (input: TInput, request: Request) => Promise<TInput>;
}

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Creates a Next.js API route handler for creating payment intents.
 * Requires an `authorize` callback for authentication.
 *
 * Usage in app/api/create-payment-intent/route.ts:
 * ```ts
 * import { createPaymentIntentRoute } from '@stripe-sdk/core/next';
 * import { getServerSession } from 'next-auth';
 *
 * export const POST = createPaymentIntentRoute({
 *   authorize: async (request) => {
 *     const session = await getServerSession();
 *     if (!session) throw new Error('Unauthorized');
 *   },
 *   beforeCreate: async (input) => ({
 *     ...input,
 *     amount: getVerifiedAmount(input),
 *   }),
 * });
 * ```
 */
export function createPaymentIntentRoute(options: RouteOptions<CreatePaymentIntentInput>) {
  return async function POST(request: Request): Promise<Response> {
    try {
      const authResult = await options.authorize(request);
      if (authResult === false) return errorResponse('Unauthorized', 401);

      let input: CreatePaymentIntentInput = await request.json();

      if (options.beforeCreate) {
        input = await options.beforeCreate(input, request);
      }

      const result = await _createPaymentIntent(input);

      if (result.error) {
        return errorResponse(result.error.message, 400);
      }

      return new Response(
        JSON.stringify({ clientSecret: result.data.client_secret, id: result.data.id }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      const message = error instanceof Error && error.message === 'Unauthorized'
        ? 'Unauthorized' : 'Internal error';
      const status = message === 'Unauthorized' ? 401 : 500;
      return errorResponse(message, status);
    }
  };
}

/**
 * Creates a Next.js API route handler for creating checkout sessions.
 * Requires an `authorize` callback for authentication.
 */
export function createCheckoutSessionRoute(options: RouteOptions<CreateCheckoutSessionInput>) {
  return async function POST(request: Request): Promise<Response> {
    try {
      const authResult = await options.authorize(request);
      if (authResult === false) return errorResponse('Unauthorized', 401);

      let input: CreateCheckoutSessionInput = await request.json();

      if (options.beforeCreate) {
        input = await options.beforeCreate(input, request);
      }

      const result = await _createCheckoutSession(input);

      if (result.error) {
        return errorResponse(result.error.message, 400);
      }

      return new Response(
        JSON.stringify({ sessionId: result.data.id, url: result.data.url }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      const message = error instanceof Error && error.message === 'Unauthorized'
        ? 'Unauthorized' : 'Internal error';
      const status = message === 'Unauthorized' ? 401 : 500;
      return errorResponse(message, status);
    }
  };
}

/**
 * Creates a Next.js API route handler for creating portal sessions.
 * Requires an `authorize` callback for authentication.
 */
export function createPortalSessionRoute(options: RouteOptions<CreatePortalSessionInput>) {
  return async function POST(request: Request): Promise<Response> {
    try {
      const authResult = await options.authorize(request);
      if (authResult === false) return errorResponse('Unauthorized', 401);

      let input: CreatePortalSessionInput = await request.json();

      if (options.beforeCreate) {
        input = await options.beforeCreate(input, request);
      }

      const result = await _createPortalSession(input);

      if (result.error) {
        return errorResponse(result.error.message, 400);
      }

      return new Response(
        JSON.stringify({ url: result.data.url }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      const message = error instanceof Error && error.message === 'Unauthorized'
        ? 'Unauthorized' : 'Internal error';
      const status = message === 'Unauthorized' ? 401 : 500;
      return errorResponse(message, status);
    }
  };
}
