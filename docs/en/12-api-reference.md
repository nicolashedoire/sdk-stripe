# Complete API Reference

Comprehensive list of all functions available in the SDK.

---

## Server - Payments (`@stripe-sdk/core/server`)

| Function | Description |
|---|---|
| `createPaymentIntent(input)` | Create a payment |
| `retrievePaymentIntent(id)` | Retrieve a payment |
| `confirmPaymentIntent(input)` | Confirm a payment |
| `cancelPaymentIntent(id)` | Cancel a payment |
| `listPaymentIntents(input?)` | List payments |
| `createCheckoutSession(input)` | Create a Checkout session |
| `retrieveCheckoutSession(id)` | Retrieve a Checkout session |
| `listCheckoutSessions(input?)` | List Checkout sessions |
| `createPaymentLink(input)` | Create a payment link |
| `retrievePaymentLink(id)` | Retrieve a payment link |
| `createSetupIntent(input)` | Create a SetupIntent (save a card) |
| `retrieveSetupIntent(id)` | Retrieve a SetupIntent |
| `listPaymentMethods(customerId, type?)` | List payment methods |
| `attachPaymentMethod(pmId, cusId)` | Attach a payment method |
| `detachPaymentMethod(pmId)` | Detach a payment method |

## Server - Customers

| Function | Description |
|---|---|
| `createCustomer(input)` | Create a customer |
| `retrieveCustomer(id)` | Retrieve a customer |
| `updateCustomer(input)` | Update a customer |
| `deleteCustomer(id)` | Delete a customer |
| `listCustomers(input?)` | List customers |
| `searchCustomers(query, limit?)` | Search customers |
| `createPortalSession(input)` | Create a customer portal session |

## Server - Subscriptions

| Function | Description |
|---|---|
| `createSubscription(input)` | Create a subscription |
| `retrieveSubscription(id)` | Retrieve a subscription |
| `updateSubscription(input)` | Update (change plan, etc.) |
| `cancelSubscription(input)` | Cancel a subscription |
| `resumeSubscription(id)` | Resume a canceled subscription |
| `listSubscriptions(input?)` | List subscriptions |

## Server - Products & Prices

| Function | Description |
|---|---|
| `createProduct(input)` | Create a product |
| `retrieveProduct(id)` | Retrieve a product |
| `updateProduct(input)` | Update a product |
| `archiveProduct(id)` | Archive a product |
| `listProducts(input?)` | List products |
| `createPrice(input)` | Create a price |
| `retrievePrice(id)` | Retrieve a price |
| `listPrices(input?)` | List prices |
| `archivePrice(id)` | Archive a price |

## Server - Invoices

| Function | Description |
|---|---|
| `createInvoice(input)` | Create an invoice |
| `retrieveInvoice(id)` | Retrieve an invoice |
| `finalizeInvoice(id)` | Finalize an invoice |
| `sendInvoice(id)` | Send by email |
| `payInvoice(id)` | Mark as paid |
| `voidInvoice(id)` | Void an invoice |
| `listInvoices(input?)` | List invoices |
| `getUpcomingInvoice(cusId, subId?)` | Preview upcoming invoice |
| `createInvoiceItem(input)` | Add an invoice line item |

## Server - Refunds & Disputes

| Function | Description |
|---|---|
| `createRefund(input)` | Create a refund |
| `retrieveRefund(id)` | Retrieve a refund |
| `listRefunds(input?)` | List refunds |
| `retrieveDispute(id)` | Retrieve a dispute |
| `updateDispute(input)` | Submit evidence |
| `closeDispute(id)` | Accept a dispute |
| `listDisputes(input?)` | List disputes |

## Server - Connect (Marketplace)

| Function | Description |
|---|---|
| `createConnectAccount(input)` | Create a seller account |
| `retrieveConnectAccount(id)` | Retrieve an account |
| `deleteConnectAccount(id)` | Delete an account |
| `listConnectAccounts(input?)` | List accounts |
| `createAccountLink(input)` | Onboarding link |
| `createTransfer(input)` | Transfer funds |
| `listTransfers(input?)` | List transfers |
| `createPayout(amount, currency)` | Create a payout |
| `listPayouts(input?)` | List payouts |
| `getBalance()` | Account balance |
| `listBalanceTransactions(input?)` | Transaction history |

## Server - Coupons & Promotions

| Function | Description |
|---|---|
| `createCoupon(input)` | Create a coupon |
| `retrieveCoupon(id)` | Retrieve a coupon |
| `deleteCoupon(id)` | Delete a coupon |
| `listCoupons(input?)` | List coupons |
| `createPromotionCode(input)` | Create a promotion code |
| `retrievePromotionCode(id)` | Retrieve a promotion code |
| `listPromotionCodes(input?)` | List promotion codes |

---

## Client - Hooks (`@stripe-sdk/core/client`)

| Hook | Description |
|---|---|
| `usePayment(options?)` | Confirm a payment with PaymentElement |
| `useSetupIntent(options?)` | Save a payment method |
| `useCheckout(options)` | Redirect to Checkout or the portal |
| `useStripeConfig()` | Access the StripeProvider config |

## Client - Components

| Component | Description |
|---|---|
| `<StripeProvider>` | Base Stripe provider |
| `<StripeElementsProvider>` | Provider with clientSecret for forms |
| `<CheckoutForm>` | Complete payment form |
| `<SetupForm>` | Form to save a payment method |
| `<PricingTable>` | Pricing table |
| `<SubscriptionManager>` | Subscription management interface |

---

## Webhooks (`@stripe-sdk/core/webhooks`)

| Function | Description |
|---|---|
| `createWebhookHandler(config)` | Generic webhook handler |
| `createNextWebhookHandler(config)` | Handler for App Router |
| `createPagesWebhookHandler(config)` | Handler for Pages Router |

---

## Next.js (`@stripe-sdk/core/next`)

| Export | Description |
|---|---|
| `actions.createPaymentIntent` | Payment server action |
| `actions.createCheckoutSession` | Checkout server action |
| `actions.createSetupIntent` | Setup server action |
| `actions.createCustomer` | Customer server action |
| `actions.createPortalSession` | Portal server action |
| `actions.createSubscription` | Subscription server action |
| `actions.cancelSubscription` | Cancellation server action |
| `actions.resumeSubscription` | Resume server action |
| `createPaymentIntentRoute(options?)` | Pre-built API route |
| `createCheckoutSessionRoute(options?)` | Pre-built API route |
| `createPortalSessionRoute()` | Pre-built API route |
