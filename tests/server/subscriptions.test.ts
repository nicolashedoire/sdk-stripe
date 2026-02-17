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
  createSubscription,
  retrieveSubscription,
  updateSubscription,
  cancelSubscription,
  resumeSubscription,
  listSubscriptions,
} from '../../src/server/subscriptions';

beforeEach(() => {
  mockStripe = createMockStripeInstance();
  vi.clearAllMocks();
});

describe('createSubscription', () => {
  it('should create a subscription with a single price', async () => {
    const mockSub = { id: 'sub_123', status: 'active' };
    mockStripe.subscriptions.create.mockResolvedValue(mockSub);

    const result = await createSubscription({
      customerId: 'cus_abc',
      priceId: 'price_pro',
    });

    expect(result.data).toEqual(mockSub);
    expect(mockStripe.subscriptions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_abc',
        items: [{ price: 'price_pro', quantity: 1 }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      })
    );
  });

  it('should create a subscription with trial and coupon', async () => {
    const mockSub = { id: 'sub_456', status: 'trialing' };
    mockStripe.subscriptions.create.mockResolvedValue(mockSub);

    await createSubscription({
      customerId: 'cus_abc',
      priceId: 'price_pro',
      trialPeriodDays: 14,
      couponId: 'coupon_abc',
      quantity: 3,
    });

    expect(mockStripe.subscriptions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [{ price: 'price_pro', quantity: 3 }],
        trial_period_days: 14,
        coupon: 'coupon_abc',
      })
    );
  });

  it('should create a subscription with multiple items', async () => {
    const mockSub = { id: 'sub_789' };
    mockStripe.subscriptions.create.mockResolvedValue(mockSub);

    await createSubscription({
      customerId: 'cus_abc',
      priceId: 'price_base',
      items: [
        { priceId: 'price_base', quantity: 1 },
        { priceId: 'price_addon', quantity: 5 },
      ],
    });

    expect(mockStripe.subscriptions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          { price: 'price_base', quantity: 1 },
          { price: 'price_addon', quantity: 5 },
        ],
      })
    );
  });

  it('should handle subscription creation errors', async () => {
    mockStripe.subscriptions.create.mockRejectedValue({
      type: 'StripeInvalidRequestError',
      message: 'No such customer',
      statusCode: 404,
    });

    const result = await createSubscription({
      customerId: 'cus_invalid',
      priceId: 'price_pro',
    });

    expect(result.data).toBeNull();
    expect(result.error!.message).toBe('No such customer');
  });
});

describe('retrieveSubscription', () => {
  it('should retrieve with expanded fields', async () => {
    const mockSub = { id: 'sub_123', status: 'active' };
    mockStripe.subscriptions.retrieve.mockResolvedValue(mockSub);

    const result = await retrieveSubscription('sub_123');

    expect(result.data).toEqual(mockSub);
    expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_123', {
      expand: ['latest_invoice.payment_intent', 'default_payment_method'],
    });
  });
});

describe('updateSubscription', () => {
  it('should update subscription metadata', async () => {
    const mockSub = { id: 'sub_123' };
    mockStripe.subscriptions.update.mockResolvedValue(mockSub);

    await updateSubscription({
      subscriptionId: 'sub_123',
      metadata: { plan: 'enterprise' },
    });

    expect(mockStripe.subscriptions.update).toHaveBeenCalledWith('sub_123',
      expect.objectContaining({ metadata: { plan: 'enterprise' } })
    );
  });

  it('should update subscription items (plan change)', async () => {
    const mockSub = { id: 'sub_123' };
    mockStripe.subscriptions.update.mockResolvedValue(mockSub);

    await updateSubscription({
      subscriptionId: 'sub_123',
      items: [{ id: 'si_old', priceId: 'price_new' }],
      prorationBehavior: 'create_prorations',
    });

    expect(mockStripe.subscriptions.update).toHaveBeenCalledWith('sub_123',
      expect.objectContaining({
        items: [{ id: 'si_old', price: 'price_new', quantity: undefined }],
        proration_behavior: 'create_prorations',
      })
    );
  });
});

describe('cancelSubscription', () => {
  it('should cancel at period end', async () => {
    const mockSub = { id: 'sub_123', cancel_at_period_end: true };
    mockStripe.subscriptions.update.mockResolvedValue(mockSub);

    const result = await cancelSubscription({
      subscriptionId: 'sub_123',
      cancelAtPeriodEnd: true,
      cancellationDetails: { feedback: 'too_expensive' },
    });

    expect(result.data).toEqual(mockSub);
    expect(mockStripe.subscriptions.update).toHaveBeenCalledWith('sub_123', {
      cancel_at_period_end: true,
      cancellation_details: { comment: undefined, feedback: 'too_expensive' },
    });
    // Should NOT have called .cancel()
    expect(mockStripe.subscriptions.cancel).not.toHaveBeenCalled();
  });

  it('should cancel immediately', async () => {
    const mockSub = { id: 'sub_123', status: 'canceled' };
    mockStripe.subscriptions.cancel.mockResolvedValue(mockSub);

    const result = await cancelSubscription({
      subscriptionId: 'sub_123',
    });

    expect(result.data).toEqual(mockSub);
    expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith('sub_123', {
      cancellation_details: undefined,
    });
  });
});

describe('resumeSubscription', () => {
  it('should resume a canceled-at-period-end subscription', async () => {
    const mockSub = { id: 'sub_123', cancel_at_period_end: false };
    mockStripe.subscriptions.update.mockResolvedValue(mockSub);

    const result = await resumeSubscription('sub_123');

    expect(result.data).toEqual(mockSub);
    expect(mockStripe.subscriptions.update).toHaveBeenCalledWith('sub_123', {
      cancel_at_period_end: false,
    });
  });
});

describe('listSubscriptions', () => {
  it('should list with defaults', async () => {
    const mockList = { data: [], has_more: false };
    mockStripe.subscriptions.list.mockResolvedValue(mockList);

    const result = await listSubscriptions();

    expect(result.data).toEqual(mockList);
    expect(mockStripe.subscriptions.list).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10 })
    );
  });

  it('should filter by customer and status', async () => {
    mockStripe.subscriptions.list.mockResolvedValue({ data: [], has_more: false });

    await listSubscriptions({ customerId: 'cus_abc', status: 'active' });

    expect(mockStripe.subscriptions.list).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_abc', status: 'active' })
    );
  });
});
