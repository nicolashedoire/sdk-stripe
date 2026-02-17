import type Stripe from 'stripe';
import { getStripe } from '../stripe-client';
import { handleStripeError, success } from '../../utils/errors';
import { validateStripeId, validateMetadata, sanitizeLimit } from '../../utils/validators';
import type {
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  CancelSubscriptionInput,
  PaginationInput,
  SDKResult,
} from '../../types';

export async function createSubscription(
  input: CreateSubscriptionInput,
  options?: { idempotencyKey?: string }
): Promise<SDKResult<Stripe.Subscription>> {
  try {
    validateStripeId(input.customerId, 'customer');
    if (input.metadata) validateMetadata(input.metadata);

    const stripe = getStripe();

    const items = input.items
      ? input.items.map((item) => ({ price: item.priceId, quantity: item.quantity }))
      : [{ price: input.priceId, quantity: input.quantity ?? 1 }];

    const subscription = await stripe.subscriptions.create(
      {
        customer: input.customerId,
        items,
        metadata: input.metadata,
        trial_period_days: input.trialPeriodDays,
        coupon: input.couponId,
        promotion_code: input.promotionCodeId,
        payment_behavior: input.paymentBehavior ?? 'default_incomplete',
        cancel_at_period_end: input.cancelAtPeriodEnd,
        billing_cycle_anchor: input.billingCycleAnchor,
        proration_behavior: input.prorationBehavior,
        expand: ['latest_invoice.payment_intent'],
      },
      options?.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined
    );
    return success(subscription);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function retrieveSubscription(
  subscriptionId: string
): Promise<SDKResult<Stripe.Subscription>> {
  try {
    validateStripeId(subscriptionId, 'subscription');
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['latest_invoice.payment_intent', 'default_payment_method'],
    });
    return success(subscription);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function updateSubscription(
  input: UpdateSubscriptionInput
): Promise<SDKResult<Stripe.Subscription>> {
  try {
    validateStripeId(input.subscriptionId, 'subscription');
    if (input.metadata) validateMetadata(input.metadata);

    const stripe = getStripe();

    const params: Stripe.SubscriptionUpdateParams = {
      metadata: input.metadata,
      cancel_at_period_end: input.cancelAtPeriodEnd,
      proration_behavior: input.prorationBehavior,
      coupon: input.couponId,
    };

    if (input.items) {
      params.items = input.items.map((item) => ({
        id: item.id,
        price: item.priceId,
        quantity: item.quantity,
      }));
    }

    const subscription = await stripe.subscriptions.update(input.subscriptionId, params);
    return success(subscription);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function cancelSubscription(
  input: CancelSubscriptionInput
): Promise<SDKResult<Stripe.Subscription>> {
  try {
    validateStripeId(input.subscriptionId, 'subscription');
    const stripe = getStripe();

    if (input.cancelAtPeriodEnd) {
      const subscription = await stripe.subscriptions.update(input.subscriptionId, {
        cancel_at_period_end: true,
        cancellation_details: input.cancellationDetails
          ? {
              comment: input.cancellationDetails.comment,
              feedback: input.cancellationDetails.feedback,
            }
          : undefined,
      });
      return success(subscription);
    }

    const subscription = await stripe.subscriptions.cancel(input.subscriptionId, {
      cancellation_details: input.cancellationDetails
        ? {
            comment: input.cancellationDetails.comment,
            feedback: input.cancellationDetails.feedback,
          }
        : undefined,
    });
    return success(subscription);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function resumeSubscription(
  subscriptionId: string
): Promise<SDKResult<Stripe.Subscription>> {
  try {
    validateStripeId(subscriptionId, 'subscription');
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
    return success(subscription);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function listSubscriptions(
  input?: PaginationInput & { customerId?: string; status?: Stripe.SubscriptionListParams.Status }
): Promise<SDKResult<Stripe.ApiList<Stripe.Subscription>>> {
  try {
    if (input?.customerId) validateStripeId(input.customerId, 'customer');
    const stripe = getStripe();
    const subscriptions = await stripe.subscriptions.list({
      limit: sanitizeLimit(input?.limit),
      starting_after: input?.startingAfter,
      ending_before: input?.endingBefore,
      customer: input?.customerId,
      status: input?.status,
    });
    return success(subscriptions);
  } catch (error) {
    return handleStripeError(error);
  }
}
