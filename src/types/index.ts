import type Stripe from 'stripe';

// ─── SDK Configuration ───────────────────────────────────────────────
export interface StripeSDKConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret?: string;
  apiVersion?: Stripe.LatestApiVersion;
  appInfo?: Stripe.AppInfo;
  maxNetworkRetries?: number;
}

// ─── Payment Types ───────────────────────────────────────────────────
export interface CreatePaymentIntentInput {
  amount: number;
  currency: string;
  customerId?: string;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
  description?: string;
  receiptEmail?: string;
  setupFutureUsage?: 'on_session' | 'off_session';
  automaticPaymentMethods?: boolean;
  returnUrl?: string;
}

export interface ConfirmPaymentInput {
  paymentIntentId: string;
  paymentMethodId?: string;
  returnUrl?: string;
}

export interface CreateCheckoutSessionInput {
  mode: 'payment' | 'subscription' | 'setup';
  lineItems: Array<{
    priceId: string;
    quantity: number;
  }>;
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
  allowPromotionCodes?: boolean;
  shippingAddressCollection?: {
    allowedCountries: string[];
  };
  billingAddressCollection?: 'auto' | 'required';
  trialPeriodDays?: number;
  taxIdCollection?: boolean;
  automaticTax?: boolean;
  locale?: string;
}

export interface CreatePaymentLinkInput {
  lineItems: Array<{
    priceId: string;
    quantity: number;
    adjustableQuantity?: {
      enabled: boolean;
      minimum?: number;
      maximum?: number;
    };
  }>;
  metadata?: Record<string, string>;
  afterCompletion?: {
    type: 'redirect' | 'hosted_confirmation';
    redirectUrl?: string;
  };
  allowPromotionCodes?: boolean;
  automaticTax?: boolean;
  billingAddressCollection?: 'auto' | 'required';
  shippingAddressCollection?: {
    allowedCountries: string[];
  };
}

// ─── Customer Types ──────────────────────────────────────────────────
export interface CreateCustomerInput {
  email?: string;
  name?: string;
  phone?: string;
  description?: string;
  metadata?: Record<string, string>;
  paymentMethodId?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface UpdateCustomerInput {
  customerId: string;
  email?: string;
  name?: string;
  phone?: string;
  description?: string;
  metadata?: Record<string, string>;
  defaultPaymentMethodId?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface ListCustomersInput {
  limit?: number;
  startingAfter?: string;
  endingBefore?: string;
  email?: string;
}

// ─── Subscription Types ──────────────────────────────────────────────
export interface CreateSubscriptionInput {
  customerId: string;
  priceId: string;
  quantity?: number;
  metadata?: Record<string, string>;
  trialPeriodDays?: number;
  couponId?: string;
  promotionCodeId?: string;
  paymentBehavior?: 'default_incomplete' | 'error_if_incomplete' | 'allow_incomplete' | 'pending_if_incomplete';
  cancelAtPeriodEnd?: boolean;
  billingCycleAnchor?: number;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
  items?: Array<{
    priceId: string;
    quantity?: number;
  }>;
}

export interface UpdateSubscriptionInput {
  subscriptionId: string;
  priceId?: string;
  quantity?: number;
  metadata?: Record<string, string>;
  cancelAtPeriodEnd?: boolean;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
  couponId?: string;
  items?: Array<{
    id?: string;
    priceId: string;
    quantity?: number;
  }>;
}

export interface CancelSubscriptionInput {
  subscriptionId: string;
  cancelAtPeriodEnd?: boolean;
  cancellationDetails?: {
    comment?: string;
    feedback?: 'customer_service' | 'low_quality' | 'missing_features' | 'other' | 'switched_service' | 'too_complex' | 'too_expensive' | 'unused';
  };
}

// ─── Product & Price Types ───────────────────────────────────────────
export interface CreateProductInput {
  name: string;
  description?: string;
  images?: string[];
  metadata?: Record<string, string>;
  active?: boolean;
  defaultPriceData?: {
    unitAmount: number;
    currency: string;
    recurring?: {
      interval: 'day' | 'week' | 'month' | 'year';
      intervalCount?: number;
    };
  };
}

export interface UpdateProductInput {
  productId: string;
  name?: string;
  description?: string;
  images?: string[];
  metadata?: Record<string, string>;
  active?: boolean;
}

export interface CreatePriceInput {
  productId: string;
  unitAmount: number;
  currency: string;
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    intervalCount?: number;
  };
  metadata?: Record<string, string>;
  active?: boolean;
  nickname?: string;
  lookupKey?: string;
  billingScheme?: 'per_unit' | 'tiered';
  tiers?: Array<{
    upTo: number | 'inf';
    unitAmount?: number;
    flatAmount?: number;
  }>;
  tiersMode?: 'graduated' | 'volume';
}

// ─── Invoice Types ───────────────────────────────────────────────────
export interface CreateInvoiceInput {
  customerId: string;
  collectionMethod?: 'charge_automatically' | 'send_invoice';
  daysUntilDue?: number;
  metadata?: Record<string, string>;
  description?: string;
  autoAdvance?: boolean;
}

export interface CreateInvoiceItemInput {
  customerId: string;
  invoiceId?: string;
  priceId?: string;
  amount?: number;
  currency?: string;
  description?: string;
  quantity?: number;
  metadata?: Record<string, string>;
}

// ─── Refund Types ────────────────────────────────────────────────────
export interface CreateRefundInput {
  paymentIntentId?: string;
  chargeId?: string;
  amount?: number;
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  metadata?: Record<string, string>;
}

// ─── Dispute Types ───────────────────────────────────────────────────
export interface UpdateDisputeInput {
  disputeId: string;
  evidence?: {
    customerName?: string;
    customerEmailAddress?: string;
    customerCommunication?: string;
    productDescription?: string;
    shippingDocumentation?: string;
    serviceDocumentation?: string;
    uncategorizedText?: string;
  };
  metadata?: Record<string, string>;
  submit?: boolean;
}

// ─── Connect Types ───────────────────────────────────────────────────
export interface CreateConnectAccountInput {
  type: 'standard' | 'express' | 'custom';
  country?: string;
  email?: string;
  capabilities?: {
    cardPayments?: { requested: boolean };
    transfers?: { requested: boolean };
  };
  businessType?: 'individual' | 'company' | 'non_profit' | 'government_entity';
  metadata?: Record<string, string>;
}

export interface CreateAccountLinkInput {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
  type: 'account_onboarding' | 'account_update';
}

export interface CreateTransferInput {
  amount: number;
  currency: string;
  destinationAccountId: string;
  description?: string;
  metadata?: Record<string, string>;
  sourceTransaction?: string;
}

// ─── Coupon Types ────────────────────────────────────────────────────
export interface CreateCouponInput {
  percentOff?: number;
  amountOff?: number;
  currency?: string;
  duration: 'forever' | 'once' | 'repeating';
  durationInMonths?: number;
  maxRedemptions?: number;
  redeemBy?: number;
  name?: string;
  metadata?: Record<string, string>;
}

export interface CreatePromotionCodeInput {
  couponId: string;
  code?: string;
  active?: boolean;
  maxRedemptions?: number;
  expiresAt?: number;
  metadata?: Record<string, string>;
  restrictions?: {
    firstTimeTransaction?: boolean;
    minimumAmount?: number;
    minimumAmountCurrency?: string;
  };
}

// ─── Setup Intent Types ──────────────────────────────────────────────
export interface CreateSetupIntentInput {
  customerId?: string;
  paymentMethodTypes?: string[];
  usage?: 'on_session' | 'off_session';
  metadata?: Record<string, string>;
}


// ─── Portal Types ────────────────────────────────────────────────────
export interface CreatePortalSessionInput {
  customerId: string;
  returnUrl: string;
  configuration?: string;
}

// ─── Webhook Types ───────────────────────────────────────────────────
export type WebhookEventType =
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'payment_intent.canceled'
  | 'payment_intent.created'
  | 'payment_intent.processing'
  | 'checkout.session.completed'
  | 'checkout.session.expired'
  | 'customer.created'
  | 'customer.updated'
  | 'customer.deleted'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'customer.subscription.trial_will_end'
  | 'customer.subscription.paused'
  | 'customer.subscription.resumed'
  | 'invoice.created'
  | 'invoice.finalized'
  | 'invoice.paid'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'invoice.upcoming'
  | 'invoice.voided'
  | 'charge.succeeded'
  | 'charge.failed'
  | 'charge.refunded'
  | 'charge.dispute.created'
  | 'charge.dispute.updated'
  | 'charge.dispute.closed'
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'price.created'
  | 'price.updated'
  | 'price.deleted'
  | 'payment_method.attached'
  | 'payment_method.detached'
  | 'payment_method.updated'
  | 'setup_intent.succeeded'
  | 'setup_intent.setup_failed'
  | 'account.updated'
  | 'payout.created'
  | 'payout.paid'
  | 'payout.failed'
  | string;

export type WebhookHandler = (event: Stripe.Event) => Promise<void> | void;

export interface WebhookHandlerMap {
  [eventType: string]: WebhookHandler;
}

// ─── List / Pagination ───────────────────────────────────────────────
export interface PaginationInput {
  limit?: number;
  startingAfter?: string;
  endingBefore?: string;
}

// ─── Generic Response ────────────────────────────────────────────────
export interface SDKResponse<T> {
  data: T;
  error: null;
}

export interface SDKError {
  data: null;
  error: {
    message: string;
    type: string;
    code?: string;
    statusCode?: number;
  };
}

export type SDKResult<T> = SDKResponse<T> | SDKError;
