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
  createWebhookHandler,
  createNextWebhookHandler,
} from '../../src/server/webhooks';

beforeEach(() => {
  mockStripe = createMockStripeInstance();
  vi.clearAllMocks();
});

describe('createWebhookHandler', () => {
  it('should verify signature and call the correct handler', async () => {
    const mockEvent = {
      id: 'evt_123',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_123' } },
    };
    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

    const handler = vi.fn();
    const webhookHandler = createWebhookHandler({
      handlers: {
        'payment_intent.succeeded': handler,
      },
    });

    const result = await webhookHandler('raw_body', 'sig_header');

    expect(result).toEqual({ received: true, type: 'payment_intent.succeeded' });
    expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
      'raw_body',
      'sig_header',
      'whsec_test_mock'
    );
    expect(handler).toHaveBeenCalledWith(mockEvent);
  });

  it('should call onUnhandledEvent for unknown event types', async () => {
    const mockEvent = { id: 'evt_456', type: 'unknown.event', data: {} };
    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

    const onUnhandledEvent = vi.fn();
    const webhookHandler = createWebhookHandler({
      handlers: {},
      onUnhandledEvent,
    });

    await webhookHandler('raw_body', 'sig_header');

    expect(onUnhandledEvent).toHaveBeenCalledWith(mockEvent);
  });

  it('should call onError when handler throws', async () => {
    const mockEvent = {
      id: 'evt_789',
      type: 'payment_intent.succeeded',
      data: {},
    };
    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

    const error = new Error('DB connection failed');
    const onError = vi.fn();
    const webhookHandler = createWebhookHandler({
      handlers: {
        'payment_intent.succeeded': () => { throw error; },
      },
      onError,
    });

    await webhookHandler('raw_body', 'sig_header');

    expect(onError).toHaveBeenCalledWith(error, mockEvent);
  });

  it('should throw when handler throws and no onError', async () => {
    const mockEvent = { id: 'evt_000', type: 'invoice.paid', data: {} };
    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

    const webhookHandler = createWebhookHandler({
      handlers: {
        'invoice.paid': () => { throw new Error('fail'); },
      },
    });

    await expect(webhookHandler('body', 'sig')).rejects.toThrow('fail');
  });

  it('should throw on invalid signature', async () => {
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const webhookHandler = createWebhookHandler({
      handlers: {},
    });

    await expect(webhookHandler('body', 'bad_sig')).rejects.toThrow('Invalid signature');
  });

  it('should use custom secret over config secret', async () => {
    const mockEvent = { id: 'evt_x', type: 'test', data: {} };
    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

    const webhookHandler = createWebhookHandler({
      secret: 'whsec_custom',
      handlers: {},
    });

    await webhookHandler('body', 'sig');

    expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
      'body',
      'sig',
      'whsec_custom'
    );
  });
});

describe('createNextWebhookHandler', () => {
  it('should return 200 for valid webhook', async () => {
    const mockEvent = {
      id: 'evt_123',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_123' } },
    };
    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

    const handler = vi.fn();
    const POST = createNextWebhookHandler({
      handlers: { 'checkout.session.completed': handler },
    });

    const request = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: 'raw_body',
      headers: { 'stripe-signature': 'sig_123' },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ received: true, type: 'checkout.session.completed' });
    expect(handler).toHaveBeenCalledWith(mockEvent);
  });

  it('should return 400 for missing signature', async () => {
    const POST = createNextWebhookHandler({
      handlers: {},
    });

    const request = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: 'raw_body',
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Missing stripe-signature header');
  });

  it('should return 400 for invalid signature', async () => {
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Webhook signature verification failed');
    });

    const onError = vi.fn();
    const POST = createNextWebhookHandler({
      handlers: {},
      onError,
    });

    const request = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: 'raw_body',
      headers: { 'stripe-signature': 'bad_sig' },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(onError).toHaveBeenCalled();
  });
});
