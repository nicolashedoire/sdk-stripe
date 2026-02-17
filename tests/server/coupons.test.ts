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
  createCoupon,
  retrieveCoupon,
  deleteCoupon,
  listCoupons,
  createPromotionCode,
  retrievePromotionCode,
  listPromotionCodes,
} from '../../src/server/coupons';

beforeEach(() => {
  mockStripe = createMockStripeInstance();
  vi.clearAllMocks();
});

// ─── Coupons ─────────────────────────────────────────────────────────

describe('createCoupon', () => {
  it('should create a percent-off coupon', async () => {
    const mockCoupon = { id: 'coupon_123', percent_off: 20 };
    mockStripe.coupons.create.mockResolvedValue(mockCoupon);

    const result = await createCoupon({
      percentOff: 20,
      duration: 'repeating',
      durationInMonths: 3,
      name: 'Launch 20%',
    });

    expect(result.data).toEqual(mockCoupon);
    expect(mockStripe.coupons.create).toHaveBeenCalledWith({
      percent_off: 20,
      amount_off: undefined,
      currency: undefined,
      duration: 'repeating',
      duration_in_months: 3,
      max_redemptions: undefined,
      redeem_by: undefined,
      name: 'Launch 20%',
      metadata: undefined,
    });
  });

  it('should create an amount-off coupon', async () => {
    mockStripe.coupons.create.mockResolvedValue({ id: 'coupon_456' });

    await createCoupon({
      amountOff: 1000,
      currency: 'eur',
      duration: 'once',
      maxRedemptions: 50,
    });

    expect(mockStripe.coupons.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount_off: 1000,
        currency: 'eur',
        duration: 'once',
        max_redemptions: 50,
      })
    );
  });

  it('should create a forever coupon', async () => {
    mockStripe.coupons.create.mockResolvedValue({ id: 'coupon_789' });

    await createCoupon({
      percentOff: 50,
      duration: 'forever',
    });

    expect(mockStripe.coupons.create).toHaveBeenCalledWith(
      expect.objectContaining({
        percent_off: 50,
        duration: 'forever',
      })
    );
  });
});

describe('retrieveCoupon', () => {
  it('should retrieve a coupon', async () => {
    const mockCoupon = { id: 'coupon_123' };
    mockStripe.coupons.retrieve.mockResolvedValue(mockCoupon);

    const result = await retrieveCoupon('coupon_123');
    expect(result.data).toEqual(mockCoupon);
  });
});

describe('deleteCoupon', () => {
  it('should delete a coupon', async () => {
    const mockDeleted = { id: 'coupon_123', deleted: true };
    mockStripe.coupons.del.mockResolvedValue(mockDeleted);

    const result = await deleteCoupon('coupon_123');
    expect(result.data).toEqual(mockDeleted);
  });
});

describe('listCoupons', () => {
  it('should list coupons', async () => {
    const mockList = { data: [{ id: 'coupon_1' }], has_more: false };
    mockStripe.coupons.list.mockResolvedValue(mockList);

    const result = await listCoupons({ limit: 25 });
    expect(result.data).toEqual(mockList);
  });
});

// ─── Promotion Codes ─────────────────────────────────────────────────

describe('createPromotionCode', () => {
  it('should create a promotion code with restrictions', async () => {
    const mockPromo = { id: 'promo_123', code: 'LAUNCH20' };
    mockStripe.promotionCodes.create.mockResolvedValue(mockPromo);

    const result = await createPromotionCode({
      couponId: 'coupon_abc',
      code: 'LAUNCH20',
      maxRedemptions: 100,
      restrictions: {
        firstTimeTransaction: true,
        minimumAmount: 5000,
        minimumAmountCurrency: 'eur',
      },
    });

    expect(result.data).toEqual(mockPromo);
    expect(mockStripe.promotionCodes.create).toHaveBeenCalledWith({
      coupon: 'coupon_abc',
      code: 'LAUNCH20',
      active: undefined,
      max_redemptions: 100,
      expires_at: undefined,
      metadata: undefined,
      restrictions: {
        first_time_transaction: true,
        minimum_amount: 5000,
        minimum_amount_currency: 'eur',
      },
    });
  });

  it('should create a promotion code without restrictions', async () => {
    mockStripe.promotionCodes.create.mockResolvedValue({ id: 'promo_456' });

    await createPromotionCode({
      couponId: 'coupon_abc',
      code: 'WELCOME',
      active: true,
    });

    expect(mockStripe.promotionCodes.create).toHaveBeenCalledWith(
      expect.objectContaining({
        coupon: 'coupon_abc',
        code: 'WELCOME',
        active: true,
        restrictions: undefined,
      })
    );
  });
});

describe('retrievePromotionCode', () => {
  it('should retrieve a promotion code', async () => {
    mockStripe.promotionCodes.retrieve.mockResolvedValue({ id: 'promo_123' });

    const result = await retrievePromotionCode('promo_123');
    expect(result.data).toEqual({ id: 'promo_123' });
  });
});

describe('listPromotionCodes', () => {
  it('should list promotion codes with filters', async () => {
    const mockList = { data: [], has_more: false };
    mockStripe.promotionCodes.list.mockResolvedValue(mockList);

    await listPromotionCodes({ couponId: 'coupon_abc', active: true, code: 'LAUNCH' });

    expect(mockStripe.promotionCodes.list).toHaveBeenCalledWith(
      expect.objectContaining({
        coupon: 'coupon_abc',
        active: true,
        code: 'LAUNCH',
      })
    );
  });
});
