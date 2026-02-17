# Installation & Configuration

## Prerequisites

- Node.js >= 18
- React >= 18
- Next.js >= 13 (optional, for Next.js features)

## Installation

```bash
npm install @stripe-sdk/core stripe @stripe/stripe-js @stripe/react-stripe-js
```

## Environment Variables

Create a `.env.local` file at the root of your project:

```env
# Public key (safe to use on the client side)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx

# Secret key (server only - NEVER expose on the client side)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx

# Webhook secret (used to verify signatures)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
```

> **Security**: NEVER commit your secret keys. Make sure `.env.local` is in your `.gitignore`.

## Initialization

Create a `lib/stripe.ts` file at the root of your project:

```ts
// lib/stripe.ts
import { initStripe } from '@stripe-sdk/core/server';

const stripe = initStripe({
  secretKey: process.env.STRIPE_SECRET_KEY!,
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
});

export default stripe;
```

**Important**: Import this file at the top of your API routes or Server Actions to initialize Stripe:

```ts
import '@/lib/stripe'; // Initialize the SDK
```

## Import Structure

```ts
// Server-side functions (API routes, Server Actions, etc.)
import { createPaymentIntent, createCustomer } from '@stripe-sdk/core/server';

// React components and hooks (client)
import { CheckoutForm, usePayment } from '@stripe-sdk/core/client';

// Webhooks
import { createNextWebhookHandler } from '@stripe-sdk/core/webhooks';

// Next.js helpers
import { actions, createPaymentIntentRoute } from '@stripe-sdk/core/next';
```

## Testing Your Configuration

```ts
// app/api/test-stripe/route.ts
import '@/lib/stripe';
import { getBalance } from '@stripe-sdk/core/server';

export async function GET() {
  const result = await getBalance();

  if (result.error) {
    return Response.json({ status: 'error', message: result.error.message }, { status: 500 });
  }

  return Response.json({ status: 'ok', balance: result.data });
}
```

Visit `/api/test-stripe` -- if you see your balance, everything is set up correctly.
