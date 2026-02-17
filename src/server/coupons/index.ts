import type Stripe from 'stripe';
import { getStripe } from '../stripe-client';
import { handleStripeError, success } from '../../utils/errors';
import type {
  CreateCouponInput,
  CreatePromotionCodeInput,
  PaginationInput,
  SDKResult,
} from '../../types';

// ─── Coupons ─────────────────────────────────────────────────────────

export async function createCoupon(
  input: CreateCouponInput
): Promise<SDKResult<Stripe.Coupon>> {
  try {
    const stripe = getStripe();
    const coupon = await stripe.coupons.create({
      percent_off: input.percentOff,
      amount_off: input.amountOff,
      currency: input.currency,
      duration: input.duration,
      duration_in_months: input.durationInMonths,
      max_redemptions: input.maxRedemptions,
      redeem_by: input.redeemBy,
      name: input.name,
      metadata: input.metadata,
    });
    return success(coupon);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function retrieveCoupon(
  couponId: string
): Promise<SDKResult<Stripe.Coupon>> {
  try {
    const stripe = getStripe();
    const coupon = await stripe.coupons.retrieve(couponId);
    return success(coupon);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function deleteCoupon(
  couponId: string
): Promise<SDKResult<Stripe.DeletedCoupon>> {
  try {
    const stripe = getStripe();
    const deleted = await stripe.coupons.del(couponId);
    return success(deleted);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function listCoupons(
  input?: PaginationInput
): Promise<SDKResult<Stripe.ApiList<Stripe.Coupon>>> {
  try {
    const stripe = getStripe();
    const coupons = await stripe.coupons.list({
      limit: input?.limit ?? 10,
      starting_after: input?.startingAfter,
      ending_before: input?.endingBefore,
    });
    return success(coupons);
  } catch (error) {
    return handleStripeError(error);
  }
}

// ─── Promotion Codes ─────────────────────────────────────────────────

export async function createPromotionCode(
  input: CreatePromotionCodeInput
): Promise<SDKResult<Stripe.PromotionCode>> {
  try {
    const stripe = getStripe();
    const promotionCode = await stripe.promotionCodes.create({
      coupon: input.couponId,
      code: input.code,
      active: input.active,
      max_redemptions: input.maxRedemptions,
      expires_at: input.expiresAt,
      metadata: input.metadata,
      restrictions: input.restrictions
        ? {
            first_time_transaction: input.restrictions.firstTimeTransaction,
            minimum_amount: input.restrictions.minimumAmount,
            minimum_amount_currency: input.restrictions.minimumAmountCurrency,
          }
        : undefined,
    });
    return success(promotionCode);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function retrievePromotionCode(
  promotionCodeId: string
): Promise<SDKResult<Stripe.PromotionCode>> {
  try {
    const stripe = getStripe();
    const promotionCode = await stripe.promotionCodes.retrieve(promotionCodeId);
    return success(promotionCode);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function listPromotionCodes(
  input?: PaginationInput & { couponId?: string; active?: boolean; code?: string }
): Promise<SDKResult<Stripe.ApiList<Stripe.PromotionCode>>> {
  try {
    const stripe = getStripe();
    const promotionCodes = await stripe.promotionCodes.list({
      limit: input?.limit ?? 10,
      starting_after: input?.startingAfter,
      ending_before: input?.endingBefore,
      coupon: input?.couponId,
      active: input?.active,
      code: input?.code,
    });
    return success(promotionCodes);
  } catch (error) {
    return handleStripeError(error);
  }
}
