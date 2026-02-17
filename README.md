# @stripe-sdk/core

A **turnkey** Stripe SDK for your applications. Integrate payments, subscriptions, invoices, webhooks, marketplace and more in just a few lines. Compatible with React, Next.js, Vue, Angular and any JavaScript framework.

**[Documentation: English](docs/en/) | [Documentation: Francais](docs/fr/)**

## Installation

```bash
npm install @stripe-sdk/core stripe @stripe/stripe-js @stripe/react-stripe-js
```

> For server-only usage (no React), you only need: `npm install @stripe-sdk/core stripe`

## Quick Start

### 1. Environment Variables

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Server Initialization

```ts
// lib/stripe.ts
import { initStripe } from '@stripe-sdk/core/server';

export const stripe = initStripe({
  secretKey: process.env.STRIPE_SECRET_KEY!,
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
});
```

---

## Payments

### Simple Payment with Built-in Form

**Server** - Create a PaymentIntent:

```ts
// app/api/create-payment/route.ts
import '@/lib/stripe';
import { createPaymentIntent } from '@stripe-sdk/core/server';

export async function POST(req: Request) {
  const { amount } = await req.json();

  const result = await createPaymentIntent({
    amount,      // in cents (1000 = 10.00 EUR)
    currency: 'eur',
  });

  if (result.error) {
    return Response.json(result.error, { status: 400 });
  }

  return Response.json({ clientSecret: result.data.client_secret });
}
```

**Client** - Payment form:

```tsx
// app/checkout/page.tsx
'use client';
import { StripeElementsProvider, CheckoutForm } from '@stripe-sdk/core/client';

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    fetch('/api/create-payment', {
      method: 'POST',
      body: JSON.stringify({ amount: 2000 }), // 20 EUR
    })
      .then(r => r.json())
      .then(data => setClientSecret(data.clientSecret));
  }, []);

  if (!clientSecret) return <p>Loading...</p>;

  return (
    <StripeElementsProvider
      publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      clientSecret={clientSecret}
    >
      <CheckoutForm
        onSuccess={(id) => console.log('Paid!', id)}
        onError={(err) => console.error(err)}
        submitLabel="Pay 20 EUR"
        showEmail
      />
    </StripeElementsProvider>
  );
}
```

### Checkout Session (Stripe-hosted page)

```ts
import { createCheckoutSession } from '@stripe-sdk/core/server';

const result = await createCheckoutSession({
  mode: 'payment',
  lineItems: [{ priceId: 'price_xxx', quantity: 1 }],
  successUrl: 'https://mysite.com/success?session_id={CHECKOUT_SESSION_ID}',
  cancelUrl: 'https://mysite.com/cancel',
  automaticTax: true,
  allowPromotionCodes: true,
});

// Redirect the user to result.data.url
```

```tsx
// Client - redirect to Checkout
import { useCheckout } from '@stripe-sdk/core/client';

function BuyButton() {
  const { redirectToCheckout, isLoading } = useCheckout({
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  });

  const handleClick = async () => {
    const res = await fetch('/api/create-checkout-session', { method: 'POST' });
    const { sessionId } = await res.json();
    await redirectToCheckout(sessionId);
  };

  return <button onClick={handleClick} disabled={isLoading}>Buy Now</button>;
}
```

### Payment Link (no-code)

```ts
import { createPaymentLink } from '@stripe-sdk/core/server';

const result = await createPaymentLink({
  lineItems: [{ priceId: 'price_xxx', quantity: 1 }],
  allowPromotionCodes: true,
  afterCompletion: {
    type: 'redirect',
    redirectUrl: 'https://mysite.com/thank-you',
  },
});

console.log(result.data.url); // Shareable link
```

---

## Subscriptions

```ts
import { createSubscription, updateSubscription, cancelSubscription, resumeSubscription } from '@stripe-sdk/core/server';

// Create
const result = await createSubscription({
  customerId: 'cus_xxx',
  priceId: 'price_monthly_xxx',
  trialPeriodDays: 14,
  paymentBehavior: 'default_incomplete',
});

// Change plan
await updateSubscription({
  subscriptionId: 'sub_xxx',
  items: [{ id: 'si_xxx', priceId: 'price_annual_xxx' }],
  prorationBehavior: 'create_prorations',
});

// Cancel at period end
await cancelSubscription({
  subscriptionId: 'sub_xxx',
  cancelAtPeriodEnd: true,
});

// Resume
await resumeSubscription('sub_xxx');
```

### PricingTable Component

```tsx
import { PricingTable, type PricingPlan } from '@stripe-sdk/core/client';

const plans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceId: 'price_starter',
    amount: 900,
    currency: 'eur',
    interval: 'month',
    features: ['5 projects', '1 GB storage', 'Email support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceId: 'price_pro',
    amount: 2900,
    currency: 'eur',
    interval: 'month',
    features: ['Unlimited projects', '100 GB storage', 'Priority support', 'API access'],
    highlighted: true,
    badge: 'Popular',
  },
];

<PricingTable
  plans={plans}
  onSelectPlan={(plan) => handleSubscribe(plan.priceId)}
  currentPlanId="starter"
/>
```

---

## Customers

```ts
import {
  createCustomer, retrieveCustomer, updateCustomer,
  deleteCustomer, listCustomers, searchCustomers,
} from '@stripe-sdk/core/server';

const { data: customer } = await createCustomer({
  email: 'user@example.com',
  name: 'John Doe',
  metadata: { userId: 'usr_123' },
});

const { data: results } = await searchCustomers("email:'user@example.com'");
```

---

## Customer Portal

```ts
import { createPortalSession } from '@stripe-sdk/core/server';

const result = await createPortalSession({
  customerId: 'cus_xxx',
  returnUrl: 'https://mysite.com/account',
});
// Redirect user to result.data.url
```

---

## Save a Payment Method (SetupIntent)

```ts
import { createSetupIntent } from '@stripe-sdk/core/server';

const result = await createSetupIntent({
  customerId: 'cus_xxx',
  usage: 'off_session',
});
```

```tsx
import { StripeElementsProvider, SetupForm } from '@stripe-sdk/core/client';

<StripeElementsProvider
  publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
  clientSecret={setupClientSecret}
>
  <SetupForm
    onSuccess={(setupId, pmId) => console.log('Saved!', pmId)}
    submitLabel="Save Card"
  />
</StripeElementsProvider>
```

---

## Products & Prices

```ts
import { createProduct, createPrice, listProducts, listPrices } from '@stripe-sdk/core/server';

const { data: product } = await createProduct({
  name: 'Pro Plan',
  defaultPriceData: {
    unitAmount: 2900,
    currency: 'eur',
    recurring: { interval: 'month' },
  },
});

await createPrice({
  productId: product.id,
  unitAmount: 29000,
  currency: 'eur',
  recurring: { interval: 'year' },
  lookupKey: 'pro_annual',
});
```

---

## Invoices

```ts
import { createInvoice, createInvoiceItem, finalizeInvoice, sendInvoice } from '@stripe-sdk/core/server';

const { data: invoice } = await createInvoice({
  customerId: 'cus_xxx',
  collectionMethod: 'send_invoice',
  daysUntilDue: 30,
});

await createInvoiceItem({
  customerId: 'cus_xxx',
  invoiceId: invoice.id,
  amount: 5000,
  currency: 'eur',
  description: 'Consulting - January 2025',
});

await finalizeInvoice(invoice.id);
await sendInvoice(invoice.id);
```

---

## Refunds & Disputes

```ts
import { createRefund, updateDispute } from '@stripe-sdk/core/server';

// Full refund
await createRefund({ paymentIntentId: 'pi_xxx' });

// Partial refund
await createRefund({ paymentIntentId: 'pi_xxx', amount: 500, reason: 'requested_by_customer' });

// Respond to dispute
await updateDispute({
  disputeId: 'dp_xxx',
  evidence: { customerName: 'John Doe', productDescription: 'Monthly SaaS subscription' },
  submit: true,
});
```

---

## Coupons & Promotion Codes

```ts
import { createCoupon, createPromotionCode } from '@stripe-sdk/core/server';

const { data: coupon } = await createCoupon({
  percentOff: 20,
  duration: 'repeating',
  durationInMonths: 3,
  name: 'Launch 2025',
});

await createPromotionCode({
  couponId: coupon.id,
  code: 'LAUNCH20',
  maxRedemptions: 100,
  restrictions: { firstTimeTransaction: true },
});
```

---

## Stripe Connect (Marketplace)

```ts
import { createConnectAccount, createAccountLink, createTransfer, getBalance } from '@stripe-sdk/core/server';

const { data: account } = await createConnectAccount({
  type: 'express',
  email: 'seller@example.com',
  capabilities: { cardPayments: { requested: true }, transfers: { requested: true } },
});

const { data: link } = await createAccountLink({
  accountId: account.id,
  refreshUrl: 'https://mysite.com/onboarding/refresh',
  returnUrl: 'https://mysite.com/onboarding/complete',
  type: 'account_onboarding',
});

await createTransfer({ amount: 8000, currency: 'eur', destinationAccountId: account.id });
```

---

## Webhooks

### Next.js App Router

```ts
// app/api/webhooks/stripe/route.ts
import '@/lib/stripe';
import { createNextWebhookHandler } from '@stripe-sdk/core/webhooks';

export const POST = createNextWebhookHandler({
  handlers: {
    'payment_intent.succeeded': async (event) => {
      const pi = event.data.object;
      console.log('Payment succeeded:', pi.id);
    },
    'customer.subscription.created': async (event) => { /* ... */ },
    'customer.subscription.deleted': async (event) => { /* ... */ },
    'invoice.payment_failed': async (event) => { /* ... */ },
    'checkout.session.completed': async (event) => { /* ... */ },
  },
  onError: (error, event) => {
    console.error('Webhook error:', error.message, event?.type);
  },
});
```

### Next.js Pages Router

```ts
// pages/api/webhooks/stripe.ts
import '@/lib/stripe';
import { createPagesWebhookHandler } from '@stripe-sdk/core/webhooks';

export const config = { api: { bodyParser: false } };

export default createPagesWebhookHandler({
  handlers: {
    'payment_intent.succeeded': async (event) => { /* ... */ },
  },
});
```

---

## Next.js Pre-built API Routes

```ts
// app/api/create-payment-intent/route.ts
import '@/lib/stripe';
import { createPaymentIntentRoute } from '@stripe-sdk/core/next';

export const POST = createPaymentIntentRoute({
  beforeCreate: async (input, request) => {
    return { ...input, currency: 'eur' };
  },
});
```

```ts
// app/api/create-checkout-session/route.ts
import '@/lib/stripe';
import { createCheckoutSessionRoute } from '@stripe-sdk/core/next';
export const POST = createCheckoutSessionRoute();
```

```ts
// app/api/create-portal-session/route.ts
import '@/lib/stripe';
import { createPortalSessionRoute } from '@stripe-sdk/core/next';
export const POST = createPortalSessionRoute();
```

---

## Error Handling

All server functions return an `SDKResult<T>`:

```ts
type SDKResult<T> =
  | { data: T; error: null }        // Success
  | { data: null; error: SDKError } // Error

type SDKError = {
  message: string;
  type: string;
  code?: string;
  statusCode?: number;
};
```

```ts
const result = await createPaymentIntent({ amount: 2000, currency: 'eur' });

if (result.error) {
  console.error(result.error.message); // "Your card was declined"
  return;
}

console.log(result.data.id); // pi_xxx - TypeScript infers the correct type
```

---

## Imports

```ts
// Server only
import { ... } from '@stripe-sdk/core/server';

// Client only (React)
import { ... } from '@stripe-sdk/core/client';

// Webhooks
import { ... } from '@stripe-sdk/core/webhooks';

// Next.js helpers
import { ... } from '@stripe-sdk/core/next';

// Everything (watch out for tree-shaking)
import { ... } from '@stripe-sdk/core';
```

## License

MIT
