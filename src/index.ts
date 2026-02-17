// ─── Server ──────────────────────────────────────────────────────────
export { initStripe, getStripe, getConfig } from './server/stripe-client';

export {
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
} from './server/payments';

export {
  createCustomer,
  retrieveCustomer,
  updateCustomer,
  deleteCustomer,
  listCustomers,
  searchCustomers,
  createPortalSession,
} from './server/customers';

export {
  createSubscription,
  retrieveSubscription,
  updateSubscription,
  cancelSubscription,
  resumeSubscription,
  listSubscriptions,
} from './server/subscriptions';

export {
  createProduct,
  retrieveProduct,
  updateProduct,
  archiveProduct,
  listProducts,
  createPrice,
  retrievePrice,
  listPrices,
  archivePrice,
} from './server/products';

export {
  createInvoice,
  retrieveInvoice,
  finalizeInvoice,
  sendInvoice,
  payInvoice,
  voidInvoice,
  listInvoices,
  getUpcomingInvoice,
  createInvoiceItem,
} from './server/invoices';

export {
  createRefund,
  retrieveRefund,
  listRefunds,
  retrieveDispute,
  updateDispute,
  closeDispute,
  listDisputes,
} from './server/refunds';

export {
  createConnectAccount,
  retrieveConnectAccount,
  deleteConnectAccount,
  listConnectAccounts,
  createAccountLink,
  createTransfer,
  listTransfers,
  createPayout,
  listPayouts,
  getBalance,
  listBalanceTransactions,
} from './server/connect';

export {
  createCoupon,
  retrieveCoupon,
  deleteCoupon,
  listCoupons,
  createPromotionCode,
  retrievePromotionCode,
  listPromotionCodes,
} from './server/coupons';

export {
  createWebhookHandler,
  createNextWebhookHandler,
  createPagesWebhookHandler,
} from './server/webhooks';

// ─── Client ──────────────────────────────────────────────────────────
export {
  StripeProvider,
  StripeElementsProvider,
  useStripeConfig,
} from './client/providers/StripeProvider';

export { usePayment } from './client/hooks/usePayment';
export { useSetupIntent } from './client/hooks/useSetupIntent';
export { useCheckout } from './client/hooks/useCheckout';

export {
  CheckoutForm,
  SetupForm,
  PricingTable,
  SubscriptionManager,
} from './client/components';

// ─── Types ───────────────────────────────────────────────────────────
export type * from './types';
