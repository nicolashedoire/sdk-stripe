import type Stripe from 'stripe';
import { getStripe } from '../stripe-client';
import { handleStripeError, success } from '../../utils/errors';
import { validateStripeId, validateAmount, validateCurrency, validateUrl, validateMetadata, sanitizeLimit } from '../../utils/validators';
import type {
  CreatePaymentIntentInput,
  ConfirmPaymentInput,
  CreateCheckoutSessionInput,
  CreatePaymentLinkInput,
  CreateSetupIntentInput,
  PaginationInput,
  SDKResult,
} from '../../types';

// ─── Payment Intents ─────────────────────────────────────────────────

export async function createPaymentIntent(
  input: CreatePaymentIntentInput,
  options?: { idempotencyKey?: string }
): Promise<SDKResult<Stripe.PaymentIntent>> {
  try {
    validateAmount(input.amount);
    const currency = validateCurrency(input.currency);
    if (input.customerId) validateStripeId(input.customerId, 'customer');
    if (input.paymentMethodId) validateStripeId(input.paymentMethodId, 'paymentMethod');
    if (input.returnUrl) validateUrl(input.returnUrl, 'returnUrl');
    if (input.metadata) validateMetadata(input.metadata);

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: input.amount,
        currency,
        customer: input.customerId,
        payment_method: input.paymentMethodId,
        metadata: input.metadata,
        description: input.description,
        receipt_email: input.receiptEmail,
        setup_future_usage: input.setupFutureUsage,
        automatic_payment_methods:
          input.automaticPaymentMethods === false || input.paymentMethodId
            ? undefined
            : { enabled: true },
        return_url: input.returnUrl,
      },
      options?.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined
    );
    return success(paymentIntent);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function retrievePaymentIntent(
  paymentIntentId: string
): Promise<SDKResult<Stripe.PaymentIntent>> {
  try {
    validateStripeId(paymentIntentId, 'paymentIntent');
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return success(paymentIntent);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function confirmPaymentIntent(
  input: ConfirmPaymentInput
): Promise<SDKResult<Stripe.PaymentIntent>> {
  try {
    validateStripeId(input.paymentIntentId, 'paymentIntent');
    if (input.paymentMethodId) validateStripeId(input.paymentMethodId, 'paymentMethod');
    if (input.returnUrl) validateUrl(input.returnUrl, 'returnUrl');

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.confirm(input.paymentIntentId, {
      payment_method: input.paymentMethodId,
      return_url: input.returnUrl,
    });
    return success(paymentIntent);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function cancelPaymentIntent(
  paymentIntentId: string
): Promise<SDKResult<Stripe.PaymentIntent>> {
  try {
    validateStripeId(paymentIntentId, 'paymentIntent');
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    return success(paymentIntent);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function listPaymentIntents(
  input?: PaginationInput & { customerId?: string }
): Promise<SDKResult<Stripe.ApiList<Stripe.PaymentIntent>>> {
  try {
    if (input?.customerId) validateStripeId(input.customerId, 'customer');
    const stripe = getStripe();
    const paymentIntents = await stripe.paymentIntents.list({
      limit: sanitizeLimit(input?.limit),
      starting_after: input?.startingAfter,
      ending_before: input?.endingBefore,
      customer: input?.customerId,
    });
    return success(paymentIntents);
  } catch (error) {
    return handleStripeError(error);
  }
}

// ─── Checkout Sessions ───────────────────────────────────────────────

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
  options?: { idempotencyKey?: string }
): Promise<SDKResult<Stripe.Checkout.Session>> {
  try {
    validateUrl(input.successUrl, 'successUrl');
    validateUrl(input.cancelUrl, 'cancelUrl');
    if (input.customerId) validateStripeId(input.customerId, 'customer');
    if (input.metadata) validateMetadata(input.metadata);

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create(
      {
        mode: input.mode,
        line_items: input.lineItems.map((item) => ({
          price: item.priceId,
          quantity: item.quantity,
        })),
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        customer: input.customerId,
        customer_email: input.customerEmail,
        metadata: input.metadata,
        allow_promotion_codes: input.allowPromotionCodes,
        shipping_address_collection: input.shippingAddressCollection
          ? { allowed_countries: input.shippingAddressCollection.allowedCountries as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] }
          : undefined,
        billing_address_collection: input.billingAddressCollection,
        subscription_data: input.trialPeriodDays
          ? { trial_period_days: input.trialPeriodDays }
          : undefined,
        tax_id_collection: input.taxIdCollection ? { enabled: true } : undefined,
        automatic_tax: input.automaticTax ? { enabled: true } : undefined,
        locale: input.locale as Stripe.Checkout.SessionCreateParams.Locale,
      },
      options?.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined
    );
    return success(session);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function retrieveCheckoutSession(
  sessionId: string
): Promise<SDKResult<Stripe.Checkout.Session>> {
  try {
    validateStripeId(sessionId, 'session');
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent', 'subscription'],
    });
    return success(session);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function listCheckoutSessions(
  input?: PaginationInput
): Promise<SDKResult<Stripe.ApiList<Stripe.Checkout.Session>>> {
  try {
    const stripe = getStripe();
    const sessions = await stripe.checkout.sessions.list({
      limit: sanitizeLimit(input?.limit),
      starting_after: input?.startingAfter,
      ending_before: input?.endingBefore,
    });
    return success(sessions);
  } catch (error) {
    return handleStripeError(error);
  }
}

// ─── Payment Links ───────────────────────────────────────────────────

export async function createPaymentLink(
  input: CreatePaymentLinkInput,
  options?: { idempotencyKey?: string }
): Promise<SDKResult<Stripe.PaymentLink>> {
  try {
    if (input.afterCompletion?.redirectUrl) {
      validateUrl(input.afterCompletion.redirectUrl, 'afterCompletion.redirectUrl');
    }
    if (input.metadata) validateMetadata(input.metadata);

    const stripe = getStripe();
    const paymentLink = await stripe.paymentLinks.create(
      {
        line_items: input.lineItems.map((item) => ({
          price: item.priceId,
          quantity: item.quantity,
          adjustable_quantity: item.adjustableQuantity
            ? {
                enabled: item.adjustableQuantity.enabled,
                minimum: item.adjustableQuantity.minimum,
                maximum: item.adjustableQuantity.maximum,
              }
            : undefined,
        })),
        metadata: input.metadata,
        after_completion: input.afterCompletion
          ? {
              type: input.afterCompletion.type,
              redirect: input.afterCompletion.redirectUrl
                ? { url: input.afterCompletion.redirectUrl }
                : undefined,
            }
          : undefined,
        allow_promotion_codes: input.allowPromotionCodes,
        automatic_tax: input.automaticTax ? { enabled: true } : undefined,
        billing_address_collection: input.billingAddressCollection,
        shipping_address_collection: input.shippingAddressCollection
          ? { allowed_countries: input.shippingAddressCollection.allowedCountries as Stripe.PaymentLinkCreateParams.ShippingAddressCollection.AllowedCountry[] }
          : undefined,
      },
      options?.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined
    );
    return success(paymentLink);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function retrievePaymentLink(
  paymentLinkId: string
): Promise<SDKResult<Stripe.PaymentLink>> {
  try {
    validateStripeId(paymentLinkId, 'paymentLink');
    const stripe = getStripe();
    const paymentLink = await stripe.paymentLinks.retrieve(paymentLinkId);
    return success(paymentLink);
  } catch (error) {
    return handleStripeError(error);
  }
}

// ─── Setup Intents ───────────────────────────────────────────────────

export async function createSetupIntent(
  input: CreateSetupIntentInput,
  options?: { idempotencyKey?: string }
): Promise<SDKResult<Stripe.SetupIntent>> {
  try {
    if (input.customerId) validateStripeId(input.customerId, 'customer');
    if (input.metadata) validateMetadata(input.metadata);

    const stripe = getStripe();
    const setupIntent = await stripe.setupIntents.create(
      {
        customer: input.customerId,
        payment_method_types: input.paymentMethodTypes,
        usage: input.usage,
        metadata: input.metadata,
      },
      options?.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined
    );
    return success(setupIntent);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function retrieveSetupIntent(
  setupIntentId: string
): Promise<SDKResult<Stripe.SetupIntent>> {
  try {
    validateStripeId(setupIntentId, 'setupIntent');
    const stripe = getStripe();
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    return success(setupIntent);
  } catch (error) {
    return handleStripeError(error);
  }
}

// ─── Payment Methods ─────────────────────────────────────────────────

export async function listPaymentMethods(
  customerId: string,
  type?: Stripe.PaymentMethodListParams.Type
): Promise<SDKResult<Stripe.ApiList<Stripe.PaymentMethod>>> {
  try {
    validateStripeId(customerId, 'customer');
    const stripe = getStripe();
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: type ?? 'card',
    });
    return success(paymentMethods);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function attachPaymentMethod(
  paymentMethodId: string,
  customerId: string
): Promise<SDKResult<Stripe.PaymentMethod>> {
  try {
    validateStripeId(paymentMethodId, 'paymentMethod');
    validateStripeId(customerId, 'customer');
    const stripe = getStripe();
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    return success(paymentMethod);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function detachPaymentMethod(
  paymentMethodId: string
): Promise<SDKResult<Stripe.PaymentMethod>> {
  try {
    validateStripeId(paymentMethodId, 'paymentMethod');
    const stripe = getStripe();
    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
    return success(paymentMethod);
  } catch (error) {
    return handleStripeError(error);
  }
}
