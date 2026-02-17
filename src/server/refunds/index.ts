import type Stripe from 'stripe';
import { getStripe } from '../stripe-client';
import { handleStripeError, success } from '../../utils/errors';
import { validateStripeId, validateAmount, validateMetadata, sanitizeLimit } from '../../utils/validators';
import type {
  CreateRefundInput,
  UpdateDisputeInput,
  PaginationInput,
  SDKResult,
} from '../../types';

// ─── Refunds ─────────────────────────────────────────────────────────

export async function createRefund(
  input: CreateRefundInput,
  options?: { idempotencyKey?: string }
): Promise<SDKResult<Stripe.Refund>> {
  try {
    if (input.paymentIntentId) validateStripeId(input.paymentIntentId, 'paymentIntent');
    if (input.amount !== undefined) validateAmount(input.amount, 'refund amount');
    if (input.metadata) validateMetadata(input.metadata);

    const stripe = getStripe();
    const refund = await stripe.refunds.create(
      {
        payment_intent: input.paymentIntentId,
        charge: input.chargeId,
        amount: input.amount,
        reason: input.reason,
        metadata: input.metadata,
      },
      options?.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined
    );
    return success(refund);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function retrieveRefund(
  refundId: string
): Promise<SDKResult<Stripe.Refund>> {
  try {
    validateStripeId(refundId, 'refund');
    const stripe = getStripe();
    const refund = await stripe.refunds.retrieve(refundId);
    return success(refund);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function listRefunds(
  input?: PaginationInput & { paymentIntentId?: string; chargeId?: string }
): Promise<SDKResult<Stripe.ApiList<Stripe.Refund>>> {
  try {
    if (input?.paymentIntentId) validateStripeId(input.paymentIntentId, 'paymentIntent');
    const stripe = getStripe();
    const refunds = await stripe.refunds.list({
      limit: sanitizeLimit(input?.limit),
      starting_after: input?.startingAfter,
      ending_before: input?.endingBefore,
      payment_intent: input?.paymentIntentId,
      charge: input?.chargeId,
    });
    return success(refunds);
  } catch (error) {
    return handleStripeError(error);
  }
}

// ─── Disputes ────────────────────────────────────────────────────────

export async function retrieveDispute(
  disputeId: string
): Promise<SDKResult<Stripe.Dispute>> {
  try {
    validateStripeId(disputeId, 'dispute');
    const stripe = getStripe();
    const dispute = await stripe.disputes.retrieve(disputeId);
    return success(dispute);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function updateDispute(
  input: UpdateDisputeInput
): Promise<SDKResult<Stripe.Dispute>> {
  try {
    validateStripeId(input.disputeId, 'dispute');
    if (input.metadata) validateMetadata(input.metadata);

    const stripe = getStripe();
    const dispute = await stripe.disputes.update(input.disputeId, {
      evidence: input.evidence
        ? {
            customer_name: input.evidence.customerName,
            customer_email_address: input.evidence.customerEmailAddress,
            customer_communication: input.evidence.customerCommunication,
            product_description: input.evidence.productDescription,
            shipping_documentation: input.evidence.shippingDocumentation,
            service_documentation: input.evidence.serviceDocumentation,
            uncategorized_text: input.evidence.uncategorizedText,
          }
        : undefined,
      metadata: input.metadata,
      submit: input.submit,
    });
    return success(dispute);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function closeDispute(
  disputeId: string
): Promise<SDKResult<Stripe.Dispute>> {
  try {
    validateStripeId(disputeId, 'dispute');
    const stripe = getStripe();
    const dispute = await stripe.disputes.close(disputeId);
    return success(dispute);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function listDisputes(
  input?: PaginationInput
): Promise<SDKResult<Stripe.ApiList<Stripe.Dispute>>> {
  try {
    const stripe = getStripe();
    const disputes = await stripe.disputes.list({
      limit: sanitizeLimit(input?.limit),
      starting_after: input?.startingAfter,
      ending_before: input?.endingBefore,
    });
    return success(disputes);
  } catch (error) {
    return handleStripeError(error);
  }
}
