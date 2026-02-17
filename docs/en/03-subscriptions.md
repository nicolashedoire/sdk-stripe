# Subscriptions & Recurring Billing

Manage subscriptions end to end: creation, upgrades, cancellation, resumption, and free trials.

---

## Creating a Subscription

### Method 1: Via Checkout Session (recommended for getting started)

```ts
// app/api/subscribe/route.ts
import '@/lib/stripe';
import { createCheckoutSession } from '@stripe-sdk/core/server';

export async function POST(req: Request) {
  const { priceId, customerId } = await req.json();

  const result = await createCheckoutSession({
    mode: 'subscription',
    lineItems: [{ priceId, quantity: 1 }],
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/account?subscribed=true`,
    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    customerId,
    trialPeriodDays: 14,               // 14-day free trial
    allowPromotionCodes: true,          // Accept promo codes
    billingAddressCollection: 'required',
  });

  if (result.error) {
    return Response.json({ error: result.error.message }, { status: 400 });
  }

  return Response.json({ url: result.data.url });
}
```

### Method 2: Embedded Form (full control)

```ts
// app/api/create-subscription/route.ts
import '@/lib/stripe';
import { createSubscription } from '@stripe-sdk/core/server';

export async function POST(req: Request) {
  const { customerId, priceId } = await req.json();

  const result = await createSubscription({
    customerId,
    priceId,
    paymentBehavior: 'default_incomplete', // Wait for payment confirmation
    trialPeriodDays: 14,
  });

  if (result.error) {
    return Response.json({ error: result.error.message }, { status: 400 });
  }

  const subscription = result.data;
  const latestInvoice = subscription.latest_invoice as any;
  const clientSecret = latestInvoice?.payment_intent?.client_secret;

  return Response.json({
    subscriptionId: subscription.id,
    clientSecret, // Use with StripeElementsProvider to confirm
  });
}
```

```tsx
// app/subscribe/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { StripeElementsProvider, CheckoutForm } from '@stripe-sdk/core/client';

export default function SubscribePage() {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    fetch('/api/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 'cus_xxx', // Logged-in customer ID
        priceId: 'price_pro_monthly',
      }),
    })
      .then((r) => r.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, []);

  if (!clientSecret) return <p>Loading...</p>;

  return (
    <StripeElementsProvider
      publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      clientSecret={clientSecret}
    >
      <CheckoutForm
        submitLabel="Subscribe - 29 EUR/month"
        onSuccess={() => window.location.href = '/account'}
      />
    </StripeElementsProvider>
  );
}
```

---

## Pricing Table (PricingTable)

```tsx
// app/pricing/page.tsx
'use client';
import { PricingTable, type PricingPlan } from '@stripe-sdk/core/client';

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started for free',
    priceId: 'price_free',
    amount: 0,
    currency: 'eur',
    interval: 'month',
    features: [
      '1 project',
      '100 MB storage',
      'Community support',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'For small teams',
    priceId: 'price_starter',
    amount: 900,
    currency: 'eur',
    interval: 'month',
    features: [
      '5 projects',
      '1 GB storage',
      'Email support',
      'Basic analytics',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For businesses',
    priceId: 'price_pro',
    amount: 2900,
    currency: 'eur',
    interval: 'month',
    features: [
      'Unlimited projects',
      '100 GB storage',
      'Priority support',
      'Advanced analytics',
      'API access',
    ],
    highlighted: true,
    badge: 'Popular',
    trialDays: 14,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions',
    priceId: 'price_enterprise',
    amount: 9900,
    currency: 'eur',
    interval: 'month',
    features: [
      'Everything in Pro',
      'Unlimited storage',
      '99.99% SLA',
      'Dedicated account manager',
      'SSO / SAML',
    ],
  },
];

export default function PricingPage() {
  const handleSelectPlan = async (plan: PricingPlan) => {
    if (plan.amount === 0) {
      window.location.href = '/signup';
      return;
    }

    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId: plan.priceId }),
    });
    const { url } = await res.json();
    window.location.href = url;
  };

  return (
    <div>
      <h1>Pricing</h1>
      <PricingTable
        plans={plans}
        onSelectPlan={handleSelectPlan}
        currentPlanId="starter"         // User's current plan
        buttonLabel="Choose"
        currentPlanLabel="Current plan"
      />
    </div>
  );
}
```

---

## Changing Plans (upgrade / downgrade)

```ts
// app/api/change-plan/route.ts
import '@/lib/stripe';
import { updateSubscription } from '@stripe-sdk/core/server';

export async function POST(req: Request) {
  const { subscriptionId, subscriptionItemId, newPriceId } = await req.json();

  const result = await updateSubscription({
    subscriptionId,
    items: [
      {
        id: subscriptionItemId,  // Existing item ID (si_xxx)
        priceId: newPriceId,     // New price
      },
    ],
    prorationBehavior: 'create_prorations', // Prorate the charge
  });

  if (result.error) {
    return Response.json({ error: result.error.message }, { status: 400 });
  }

  return Response.json({ subscription: result.data });
}
```

---

## Canceling a Subscription

```ts
// app/api/cancel-subscription/route.ts
import '@/lib/stripe';
import { cancelSubscription } from '@stripe-sdk/core/server';

export async function POST(req: Request) {
  const { subscriptionId, immediate } = await req.json();

  const result = await cancelSubscription({
    subscriptionId,
    cancelAtPeriodEnd: !immediate, // true = access continues until end of billing period
    cancellationDetails: {
      feedback: 'too_expensive',   // Optional: cancellation reason
      comment: 'Too expensive for our team',
    },
  });

  if (result.error) {
    return Response.json({ error: result.error.message }, { status: 400 });
  }

  return Response.json({ subscription: result.data });
}
```

---

## Resuming a Canceled Subscription

```ts
// app/api/resume-subscription/route.ts
import '@/lib/stripe';
import { resumeSubscription } from '@stripe-sdk/core/server';

export async function POST(req: Request) {
  const { subscriptionId } = await req.json();

  // Only works if cancelAtPeriodEnd was set to true
  const result = await resumeSubscription(subscriptionId);

  if (result.error) {
    return Response.json({ error: result.error.message }, { status: 400 });
  }

  return Response.json({ subscription: result.data });
}
```

---

## Subscription Management Component

```tsx
// components/MySubscription.tsx
'use client';
import { SubscriptionManager } from '@stripe-sdk/core/client';

interface Props {
  subscription: {
    id: string;
    status: string;
    planName: string;
    amount: number;
    currency: string;
    interval: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    trialEnd?: string | null;
  };
}

export function MySubscription({ subscription }: Props) {
  const handleCancel = async (subscriptionId: string) => {
    await fetch('/api/cancel-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId }),
    });
    window.location.reload();
  };

  const handleResume = async (subscriptionId: string) => {
    await fetch('/api/resume-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId }),
    });
    window.location.reload();
  };

  const handlePortal = async () => {
    const res = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 'cus_xxx',
        returnUrl: window.location.href,
      }),
    });
    const { url } = await res.json();
    window.location.href = url;
  };

  return (
    <SubscriptionManager
      subscription={subscription}
      onCancel={handleCancel}
      onResume={handleResume}
      onChangePlan={() => window.location.href = '/pricing'}
      onManageBilling={handlePortal}
      cancelLabel="Cancel subscription"
      resumeLabel="Resume subscription"
      changePlanLabel="Change plan"
      manageBillingLabel="Manage billing"
    />
  );
}
```

---

## Essential Webhooks for Subscriptions

```ts
// app/api/webhooks/stripe/route.ts
import '@/lib/stripe';
import { createNextWebhookHandler } from '@stripe-sdk/core/webhooks';

export const POST = createNextWebhookHandler({
  handlers: {
    'customer.subscription.created': async (event) => {
      const subscription = event.data.object;
      // Grant premium access in your DB
      // await db.users.update({ stripeSubscriptionId: subscription.id }, { plan: 'pro' });
    },

    'customer.subscription.updated': async (event) => {
      const subscription = event.data.object;
      // Update the plan in your DB
    },

    'customer.subscription.deleted': async (event) => {
      const subscription = event.data.object;
      // Revoke premium access
    },

    'customer.subscription.trial_will_end': async (event) => {
      // Free trial ends in 3 days
      // Send a reminder email
    },

    'invoice.payment_failed': async (event) => {
      const invoice = event.data.object;
      // Payment failed - send an email to the customer
    },

    'invoice.payment_succeeded': async (event) => {
      const invoice = event.data.object;
      // Payment succeeded - extend access
    },
  },
});
```
