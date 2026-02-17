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
  createPaymentIntent,
  retrievePaymentIntent,
  confirmPaymentIntent,
  cancelPaymentIntent,
  listPaymentIntents,
  createCheckoutSession,
  retrieveCheckoutSession,
  listCheckoutSessions,
  createPaymentLink,
  retrievePaymentLink,
  createSetupIntent,
  retrieveSetupIntent,
  listPaymentMethods,
  attachPaymentMethod,
  detachPaymentMethod,
} from '../../src/server/payments';

beforeEach(() => {
  mockStripe = createMockStripeInstance();
  vi.clearAllMocks();
});

// ─── PaymentIntents ──────────────────────────────────────────────────

describe('createPaymentIntent', () => {
  it('should create a payment intent with minimum params', async () => {
    const mockPI = { id: 'pi_123', amount: 2000, currency: 'eur', client_secret: 'cs_123' };
    mockStripe.paymentIntents.create.mockResolvedValue(mockPI);

    const result = await createPaymentIntent({ amount: 2000, currency: 'eur' });

    expect(result.data).toEqual(mockPI);
    expect(result.error).toBeNull();
    expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 2000, currency: 'eur' })
    );
  });

  it('should create a payment intent with all options', async () => {
    const mockPI = { id: 'pi_456', amount: 5000, currency: 'usd' };
    mockStripe.paymentIntents.create.mockResolvedValue(mockPI);

    const result = await createPaymentIntent({
      amount: 5000,
      currency: 'usd',
      customerId: 'cus_abc',
      paymentMethodId: 'pm_abc',
      metadata: { orderId: '123' },
      description: 'Test payment',
      receiptEmail: 'test@example.com',
      setupFutureUsage: 'off_session',
    });

    expect(result.data).toEqual(mockPI);
    expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 5000,
        currency: 'usd',
        customer: 'cus_abc',
        payment_method: 'pm_abc',
        metadata: { orderId: '123' },
        description: 'Test payment',
        receipt_email: 'test@example.com',
        setup_future_usage: 'off_session',
      })
    );
  });

  it('should handle Stripe errors', async () => {
    mockStripe.paymentIntents.create.mockRejectedValue({
      type: 'StripeCardError',
      message: 'Your card was declined.',
      code: 'card_declined',
      statusCode: 402,
    });

    const result = await createPaymentIntent({ amount: 2000, currency: 'eur' });

    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      message: 'Your card was declined.',
      type: 'StripeCardError',
      code: 'card_declined',
      statusCode: 402,
    });
  });

  it('should handle unknown errors', async () => {
    mockStripe.paymentIntents.create.mockRejectedValue('unexpected error');

    const result = await createPaymentIntent({ amount: 2000, currency: 'eur' });

    expect(result.data).toBeNull();
    expect(result.error!.type).toBe('sdk_error');
  });
});

describe('retrievePaymentIntent', () => {
  it('should retrieve a payment intent', async () => {
    const mockPI = { id: 'pi_123', status: 'succeeded' };
    mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPI);

    const result = await retrievePaymentIntent('pi_123');

    expect(result.data).toEqual(mockPI);
    expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_123');
  });
});

describe('confirmPaymentIntent', () => {
  it('should confirm a payment intent', async () => {
    const mockPI = { id: 'pi_123', status: 'succeeded' };
    mockStripe.paymentIntents.confirm.mockResolvedValue(mockPI);

    const result = await confirmPaymentIntent({
      paymentIntentId: 'pi_123',
      paymentMethodId: 'pm_abc',
      returnUrl: 'https://example.com/return',
    });

    expect(result.data).toEqual(mockPI);
    expect(mockStripe.paymentIntents.confirm).toHaveBeenCalledWith('pi_123', {
      payment_method: 'pm_abc',
      return_url: 'https://example.com/return',
    });
  });
});

describe('cancelPaymentIntent', () => {
  it('should cancel a payment intent', async () => {
    const mockPI = { id: 'pi_123', status: 'canceled' };
    mockStripe.paymentIntents.cancel.mockResolvedValue(mockPI);

    const result = await cancelPaymentIntent('pi_123');

    expect(result.data).toEqual(mockPI);
    expect(mockStripe.paymentIntents.cancel).toHaveBeenCalledWith('pi_123');
  });
});

describe('listPaymentIntents', () => {
  it('should list payment intents with defaults', async () => {
    const mockList = { data: [], has_more: false };
    mockStripe.paymentIntents.list.mockResolvedValue(mockList);

    const result = await listPaymentIntents();

    expect(result.data).toEqual(mockList);
    expect(mockStripe.paymentIntents.list).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10 })
    );
  });

  it('should list payment intents with pagination and customer filter', async () => {
    const mockList = { data: [{ id: 'pi_1' }], has_more: true };
    mockStripe.paymentIntents.list.mockResolvedValue(mockList);

    const result = await listPaymentIntents({
      limit: 5,
      startingAfter: 'pi_0',
      customerId: 'cus_abc',
    });

    expect(result.data).toEqual(mockList);
    expect(mockStripe.paymentIntents.list).toHaveBeenCalledWith({
      limit: 5,
      starting_after: 'pi_0',
      ending_before: undefined,
      customer: 'cus_abc',
    });
  });
});

// ─── Checkout Sessions ───────────────────────────────────────────────

describe('createCheckoutSession', () => {
  it('should create a payment checkout session', async () => {
    const mockSession = { id: 'cs_123', url: 'https://checkout.stripe.com/xxx' };
    mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

    const result = await createCheckoutSession({
      mode: 'payment',
      lineItems: [{ priceId: 'price_abc', quantity: 1 }],
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    expect(result.data).toEqual(mockSession);
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        line_items: [{ price: 'price_abc', quantity: 1 }],
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
      })
    );
  });

  it('should create a subscription checkout session with options', async () => {
    const mockSession = { id: 'cs_456' };
    mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

    const result = await createCheckoutSession({
      mode: 'subscription',
      lineItems: [{ priceId: 'price_pro', quantity: 1 }],
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      customerId: 'cus_abc',
      allowPromotionCodes: true,
      trialPeriodDays: 14,
      automaticTax: true,
      billingAddressCollection: 'required',
    });

    expect(result.data).toEqual(mockSession);
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        customer: 'cus_abc',
        allow_promotion_codes: true,
        subscription_data: { trial_period_days: 14 },
        automatic_tax: { enabled: true },
        billing_address_collection: 'required',
      })
    );
  });

  it('should handle errors on checkout session creation', async () => {
    mockStripe.checkout.sessions.create.mockRejectedValue({
      type: 'StripeInvalidRequestError',
      message: 'Invalid price',
      statusCode: 400,
    });

    const result = await createCheckoutSession({
      mode: 'payment',
      lineItems: [{ priceId: 'invalid', quantity: 1 }],
      successUrl: 'https://x.com/s',
      cancelUrl: 'https://x.com/c',
    });

    expect(result.data).toBeNull();
    expect(result.error!.message).toBe('Invalid price');
  });
});

describe('retrieveCheckoutSession', () => {
  it('should retrieve with expanded fields', async () => {
    const mockSession = { id: 'cs_123', payment_intent: { id: 'pi_123' } };
    mockStripe.checkout.sessions.retrieve.mockResolvedValue(mockSession);

    const result = await retrieveCheckoutSession('cs_123');

    expect(result.data).toEqual(mockSession);
    expect(mockStripe.checkout.sessions.retrieve).toHaveBeenCalledWith('cs_123', {
      expand: ['line_items', 'payment_intent', 'subscription'],
    });
  });
});

describe('listCheckoutSessions', () => {
  it('should list sessions', async () => {
    const mockList = { data: [], has_more: false };
    mockStripe.checkout.sessions.list.mockResolvedValue(mockList);

    const result = await listCheckoutSessions({ limit: 25 });

    expect(result.data).toEqual(mockList);
    expect(mockStripe.checkout.sessions.list).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 25 })
    );
  });
});

// ─── Payment Links ───────────────────────────────────────────────────

describe('createPaymentLink', () => {
  it('should create a payment link', async () => {
    const mockLink = { id: 'plink_123', url: 'https://buy.stripe.com/xxx' };
    mockStripe.paymentLinks.create.mockResolvedValue(mockLink);

    const result = await createPaymentLink({
      lineItems: [{ priceId: 'price_abc', quantity: 1 }],
    });

    expect(result.data).toEqual(mockLink);
    expect(mockStripe.paymentLinks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: 'price_abc', quantity: 1, adjustable_quantity: undefined }],
      })
    );
  });

  it('should create a payment link with adjustable quantity', async () => {
    const mockLink = { id: 'plink_456' };
    mockStripe.paymentLinks.create.mockResolvedValue(mockLink);

    await createPaymentLink({
      lineItems: [{
        priceId: 'price_abc',
        quantity: 1,
        adjustableQuantity: { enabled: true, minimum: 1, maximum: 10 },
      }],
      afterCompletion: { type: 'redirect', redirectUrl: 'https://example.com/thanks' },
      allowPromotionCodes: true,
    });

    expect(mockStripe.paymentLinks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{
          price: 'price_abc',
          quantity: 1,
          adjustable_quantity: { enabled: true, minimum: 1, maximum: 10 },
        }],
        after_completion: {
          type: 'redirect',
          redirect: { url: 'https://example.com/thanks' },
        },
        allow_promotion_codes: true,
      })
    );
  });
});

describe('retrievePaymentLink', () => {
  it('should retrieve a payment link', async () => {
    const mockLink = { id: 'plink_123' };
    mockStripe.paymentLinks.retrieve.mockResolvedValue(mockLink);

    const result = await retrievePaymentLink('plink_123');
    expect(result.data).toEqual(mockLink);
  });
});

// ─── Setup Intents ───────────────────────────────────────────────────

describe('createSetupIntent', () => {
  it('should create a setup intent', async () => {
    const mockSI = { id: 'seti_123', client_secret: 'seti_cs_123' };
    mockStripe.setupIntents.create.mockResolvedValue(mockSI);

    const result = await createSetupIntent({
      customerId: 'cus_abc',
      usage: 'off_session',
    });

    expect(result.data).toEqual(mockSI);
    expect(mockStripe.setupIntents.create).toHaveBeenCalledWith({
      customer: 'cus_abc',
      payment_method_types: undefined,
      usage: 'off_session',
      metadata: undefined,
    });
  });
});

describe('retrieveSetupIntent', () => {
  it('should retrieve a setup intent', async () => {
    const mockSI = { id: 'seti_123' };
    mockStripe.setupIntents.retrieve.mockResolvedValue(mockSI);

    const result = await retrieveSetupIntent('seti_123');
    expect(result.data).toEqual(mockSI);
  });
});

// ─── Payment Methods ─────────────────────────────────────────────────

describe('listPaymentMethods', () => {
  it('should list payment methods for a customer', async () => {
    const mockList = { data: [{ id: 'pm_123', type: 'card' }], has_more: false };
    mockStripe.paymentMethods.list.mockResolvedValue(mockList);

    const result = await listPaymentMethods('cus_abc');

    expect(result.data).toEqual(mockList);
    expect(mockStripe.paymentMethods.list).toHaveBeenCalledWith({
      customer: 'cus_abc',
      type: 'card',
    });
  });

  it('should accept custom type', async () => {
    mockStripe.paymentMethods.list.mockResolvedValue({ data: [], has_more: false });

    await listPaymentMethods('cus_abc', 'sepa_debit');

    expect(mockStripe.paymentMethods.list).toHaveBeenCalledWith({
      customer: 'cus_abc',
      type: 'sepa_debit',
    });
  });
});

describe('attachPaymentMethod', () => {
  it('should attach a payment method to a customer', async () => {
    const mockPM = { id: 'pm_123', customer: 'cus_abc' };
    mockStripe.paymentMethods.attach.mockResolvedValue(mockPM);

    const result = await attachPaymentMethod('pm_123', 'cus_abc');

    expect(result.data).toEqual(mockPM);
    expect(mockStripe.paymentMethods.attach).toHaveBeenCalledWith('pm_123', { customer: 'cus_abc' });
  });
});

describe('detachPaymentMethod', () => {
  it('should detach a payment method', async () => {
    const mockPM = { id: 'pm_123', customer: null };
    mockStripe.paymentMethods.detach.mockResolvedValue(mockPM);

    const result = await detachPaymentMethod('pm_123');

    expect(result.data).toEqual(mockPM);
    expect(mockStripe.paymentMethods.detach).toHaveBeenCalledWith('pm_123');
  });
});
