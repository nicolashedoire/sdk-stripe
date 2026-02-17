# One-Time Payments

Accept a single payment using an embedded form or a Stripe-hosted page.

---

## Option A: Embedded Form (PaymentElement)

The form renders directly within your app. Supports 100+ payment methods.

### Step 1: API Route (server)

```ts
// app/api/create-payment/route.ts
import '@/lib/stripe';
import { createPaymentIntent } from '@stripe-sdk/core/server';

export async function POST(req: Request) {
  const { amount, currency, metadata } = await req.json();

  // IMPORTANT: Always validate the amount on the server side
  if (!amount || amount < 50) {
    return Response.json({ error: 'Invalid amount' }, { status: 400 });
  }

  const result = await createPaymentIntent({
    amount,           // in cents: 2000 = 20.00 EUR
    currency: currency || 'eur',
    metadata,         // { orderId: '123', userId: 'abc' }
    automaticPaymentMethods: true,
  });

  if (result.error) {
    return Response.json({ error: result.error.message }, { status: 400 });
  }

  return Response.json({
    clientSecret: result.data.client_secret,
    paymentIntentId: result.data.id,
  });
}
```

### Step 2: Payment Page (client)

```tsx
// app/checkout/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { StripeElementsProvider, CheckoutForm } from '@stripe-sdk/core/client';

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 2000 }), // 20 EUR
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setClientSecret(data.clientSecret);
      });
  }, []);

  if (error) return <p>Error: {error}</p>;
  if (!clientSecret) return <p>Loading...</p>;

  return (
    <StripeElementsProvider
      publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      clientSecret={clientSecret}
    >
      <CheckoutForm
        submitLabel="Pay 20.00 EUR"
        showEmail
        onSuccess={(paymentIntentId) => {
          // Redirect to a confirmation page
          window.location.href = `/success?pi=${paymentIntentId}`;
        }}
        onError={(message) => {
          console.error('Payment error:', message);
        }}
      />
    </StripeElementsProvider>
  );
}
```

### Customizing the Form

```tsx
<CheckoutForm
  submitLabel="Confirm payment"
  showEmail                    // Show the email field (Link integration)
  layout="accordion"           // 'tabs' | 'accordion' | 'auto'
  returnUrl="https://mysite.com/success"  // Return URL after 3DS
  className="my-form"          // CSS classes on the <form>
  buttonClassName="btn-primary" // CSS classes on the button
  errorClassName="text-red-500" // CSS classes on errors
/>
```

### Customizing the Appearance (theme)

```tsx
<StripeElementsProvider
  publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
  clientSecret={clientSecret}
  appearance={{
    theme: 'stripe',  // 'stripe' | 'night' | 'flat' | 'none'
    variables: {
      colorPrimary: '#6366f1',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      borderRadius: '8px',
      fontFamily: 'Inter, sans-serif',
    },
    rules: {
      '.Input': {
        border: '1px solid #e5e7eb',
        padding: '12px',
      },
      '.Input:focus': {
        border: '1px solid #6366f1',
        boxShadow: '0 0 0 1px #6366f1',
      },
    },
  }}
>
  <CheckoutForm />
</StripeElementsProvider>
```

---

## Option B: Checkout Session (Stripe-hosted page)

Redirect to a Stripe-hosted payment page. Less code, over 40 payment methods supported.

### Step 1: API Route

```ts
// app/api/create-checkout/route.ts
import '@/lib/stripe';
import { createCheckoutSession } from '@stripe-sdk/core/server';

export async function POST(req: Request) {
  const { priceId, quantity } = await req.json();

  const result = await createCheckoutSession({
    mode: 'payment',
    lineItems: [{ priceId, quantity: quantity || 1 }],
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
    allowPromotionCodes: true,
    automaticTax: true,
  });

  if (result.error) {
    return Response.json({ error: result.error.message }, { status: 400 });
  }

  return Response.json({
    sessionId: result.data.id,
    url: result.data.url,
  });
}
```

### Step 2: Buy Button

```tsx
// components/BuyButton.tsx
'use client';

import { useCheckout } from '@stripe-sdk/core/client';

export function BuyButton({ priceId }: { priceId: string }) {
  const { redirectToCheckout, isLoading, error } = useCheckout({
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  });

  const handleClick = async () => {
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    });
    const { sessionId } = await res.json();
    await redirectToCheckout(sessionId);
  };

  return (
    <button onClick={handleClick} disabled={isLoading}>
      {isLoading ? 'Redirecting...' : 'Buy now'}
    </button>
  );
}
```

---

## Option C: Payment Link (no code required)

Create a shareable payment link you can send via email, SMS, or QR code.

```ts
// Example in a script or API route
import '@/lib/stripe';
import { createPaymentLink } from '@stripe-sdk/core/server';

const result = await createPaymentLink({
  lineItems: [
    {
      priceId: 'price_xxxxx',
      quantity: 1,
      adjustableQuantity: {
        enabled: true,
        minimum: 1,
        maximum: 10,
      },
    },
  ],
  afterCompletion: {
    type: 'redirect',
    redirectUrl: 'https://mysite.com/thank-you',
  },
  allowPromotionCodes: true,
});

console.log(result.data.url);
// -> https://buy.stripe.com/xxxxxxxxx
// Share this link via email, SMS, or embed it in a button
```

---

## Verifying a Payment (success page)

```ts
// app/success/page.tsx
import '@/lib/stripe';
import { retrieveCheckoutSession, retrievePaymentIntent } from '@stripe-sdk/core/server';

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string; pi?: string };
}) {
  if (searchParams.session_id) {
    const result = await retrieveCheckoutSession(searchParams.session_id);
    if (result.data?.payment_status === 'paid') {
      return <h1>Thank you for your purchase!</h1>;
    }
  }

  if (searchParams.pi) {
    const result = await retrievePaymentIntent(searchParams.pi);
    if (result.data?.status === 'succeeded') {
      return <h1>Payment confirmed!</h1>;
    }
  }

  return <h1>Verifying your payment...</h1>;
}
```

---

## When to Use What?

| Method | When to Use |
|---|---|
| **CheckoutForm** (PaymentElement) | Custom UI embedded directly in your app |
| **Checkout Session** | Quick setup, Stripe-hosted page, simplified PCI compliance |
| **Payment Link** | No code needed, share via email/SMS/QR |
