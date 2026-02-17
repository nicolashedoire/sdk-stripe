import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockStripeInstance, type MockStripeInstance } from '../setup';

let mockStripe: MockStripeInstance;

vi.mock('../../src/server/stripe-client', () => ({
  getStripe: () => mockStripe,
  getConfig: () => ({
    secretKey: 'sk_test_mock',
    publishableKey: 'pk_test_mock',
    webhookSecret: 'whsec_test_mock',
  }),
}));

import {
  createPaymentIntentRoute,
  createCheckoutSessionRoute,
  createPortalSessionRoute,
  actions,
} from '../../src/next';

beforeEach(() => {
  mockStripe = createMockStripeInstance();
  vi.clearAllMocks();
});

// ─── API Route Helpers ───────────────────────────────────────────────

describe('createPaymentIntentRoute', () => {
  it('should create a payment intent and return clientSecret', async () => {
    mockStripe.paymentIntents.create.mockResolvedValue({
      id: 'pi_123',
      client_secret: 'cs_123',
    });

    const POST = createPaymentIntentRoute();
    const request = new Request('http://localhost/api/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({ amount: 2000, currency: 'eur' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.clientSecret).toBe('cs_123');
    expect(json.id).toBe('pi_123');
  });

  it('should use beforeCreate hook', async () => {
    mockStripe.paymentIntents.create.mockResolvedValue({
      id: 'pi_456',
      client_secret: 'cs_456',
    });

    const POST = createPaymentIntentRoute({
      beforeCreate: async (input) => ({
        ...input,
        currency: 'eur', // Force EUR
        metadata: { source: 'api' },
      }),
    });

    const request = new Request('http://localhost/api/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({ amount: 5000, currency: 'usd' }),
      headers: { 'Content-Type': 'application/json' },
    });

    await POST(request);

    expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 5000,
        currency: 'eur',
        metadata: { source: 'api' },
      })
    );
  });

  it('should return 400 on Stripe error', async () => {
    mockStripe.paymentIntents.create.mockRejectedValue({
      type: 'StripeInvalidRequestError',
      message: 'Amount must be positive',
      statusCode: 400,
    });

    const POST = createPaymentIntentRoute();
    const request = new Request('http://localhost/api/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({ amount: -100, currency: 'eur' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should return 500 on unexpected error', async () => {
    mockStripe.paymentIntents.create.mockRejectedValue(new Error('Network error'));

    const POST = createPaymentIntentRoute();
    const request = new Request('http://localhost/api/create-payment-intent', {
      method: 'POST',
      body: 'invalid json',
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});

describe('createCheckoutSessionRoute', () => {
  it('should create a checkout session and return sessionId and url', async () => {
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: 'cs_123',
      url: 'https://checkout.stripe.com/xxx',
    });

    const POST = createCheckoutSessionRoute();
    const request = new Request('http://localhost/api/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'payment',
        lineItems: [{ priceId: 'price_abc', quantity: 1 }],
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.sessionId).toBe('cs_123');
    expect(json.url).toBe('https://checkout.stripe.com/xxx');
  });

  it('should use beforeCreate hook', async () => {
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: 'cs_456',
      url: 'https://checkout.stripe.com/yyy',
    });

    const POST = createCheckoutSessionRoute({
      beforeCreate: async (input) => ({
        ...input,
        customerId: 'cus_forced',
      }),
    });

    const request = new Request('http://localhost/api', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'payment',
        lineItems: [{ priceId: 'price_abc', quantity: 1 }],
        successUrl: 'https://x.com/s',
        cancelUrl: 'https://x.com/c',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    await POST(request);

    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_forced' })
    );
  });
});

describe('createPortalSessionRoute', () => {
  it('should create a portal session and return url', async () => {
    mockStripe.billingPortal.sessions.create.mockResolvedValue({
      url: 'https://billing.stripe.com/xxx',
    });

    const POST = createPortalSessionRoute();
    const request = new Request('http://localhost/api/create-portal-session', {
      method: 'POST',
      body: JSON.stringify({
        customerId: 'cus_abc',
        returnUrl: 'https://example.com/account',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.url).toBe('https://billing.stripe.com/xxx');
  });
});

// ─── Server Actions ──────────────────────────────────────────────────

describe('actions', () => {
  it('should expose createPaymentIntent action', async () => {
    mockStripe.paymentIntents.create.mockResolvedValue({ id: 'pi_123' });

    const result = await actions.createPaymentIntent({ amount: 1000, currency: 'eur' });

    expect(result.data).toEqual({ id: 'pi_123' });
  });

  it('should expose createCheckoutSession action', async () => {
    mockStripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_123' });

    const result = await actions.createCheckoutSession({
      mode: 'payment',
      lineItems: [{ priceId: 'price_abc', quantity: 1 }],
      successUrl: 'https://x.com/s',
      cancelUrl: 'https://x.com/c',
    });

    expect(result.data).toEqual({ id: 'cs_123' });
  });

  it('should expose createSetupIntent action', async () => {
    mockStripe.setupIntents.create.mockResolvedValue({ id: 'seti_123' });

    const result = await actions.createSetupIntent({ customerId: 'cus_abc' });

    expect(result.data).toEqual({ id: 'seti_123' });
  });

  it('should expose createCustomer action', async () => {
    mockStripe.customers.create.mockResolvedValue({ id: 'cus_123' });

    const result = await actions.createCustomer({ email: 'test@example.com' });

    expect(result.data).toEqual({ id: 'cus_123' });
  });

  it('should expose createPortalSession action', async () => {
    mockStripe.billingPortal.sessions.create.mockResolvedValue({ url: 'https://portal.com' });

    const result = await actions.createPortalSession({
      customerId: 'cus_abc',
      returnUrl: 'https://x.com/account',
    });

    expect(result.data).toEqual({ url: 'https://portal.com' });
  });

  it('should expose createSubscription action', async () => {
    mockStripe.subscriptions.create.mockResolvedValue({ id: 'sub_123' });

    const result = await actions.createSubscription({
      customerId: 'cus_abc',
      priceId: 'price_pro',
    });

    expect(result.data).toEqual({ id: 'sub_123' });
  });

  it('should expose cancelSubscription action', async () => {
    mockStripe.subscriptions.cancel.mockResolvedValue({ id: 'sub_123', status: 'canceled' });

    const result = await actions.cancelSubscription({ subscriptionId: 'sub_123' });

    expect(result.data).toEqual({ id: 'sub_123', status: 'canceled' });
  });

  it('should expose resumeSubscription action', async () => {
    mockStripe.subscriptions.update.mockResolvedValue({ id: 'sub_123', cancel_at_period_end: false });

    const result = await actions.resumeSubscription('sub_123');

    expect(result.data).toEqual({ id: 'sub_123', cancel_at_period_end: false });
  });
});
