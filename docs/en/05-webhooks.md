# Webhooks

Receive real-time notifications for all Stripe events. Webhooks are **essential** for keeping your database in sync.

---

## Why Webhooks Are Critical

- A payment may succeed after the customer has left your site (3D Secure)
- Subscriptions are renewed automatically by Stripe
- Refunds and disputes are handled outside of your app
- Payments can fail during renewal

**Golden rule**: NEVER trust the client. Always validate via webhooks.

---

## Next.js App Router (recommended)

```ts
// app/api/webhooks/stripe/route.ts
import '@/lib/stripe';
import { createNextWebhookHandler } from '@stripe-sdk/core/webhooks';

export const POST = createNextWebhookHandler({
  handlers: {
    // ── Payments ──
    'payment_intent.succeeded': async (event) => {
      const paymentIntent = event.data.object as any;
      console.log(`Payment succeeded: ${paymentIntent.id} - ${paymentIntent.amount / 100} ${paymentIntent.currency}`);
      // await db.orders.update({ paymentIntentId: paymentIntent.id }, { status: 'paid' });
    },

    'payment_intent.payment_failed': async (event) => {
      const paymentIntent = event.data.object as any;
      console.log(`Payment failed: ${paymentIntent.id}`);
      // Send a follow-up email
    },

    // ── Checkout ──
    'checkout.session.completed': async (event) => {
      const session = event.data.object as any;
      console.log(`Checkout completed: ${session.id}`);
      // Provision access / deliver the product
    },

    // ── Subscriptions ──
    'customer.subscription.created': async (event) => {
      const sub = event.data.object as any;
      // Activate the plan in your DB
    },

    'customer.subscription.updated': async (event) => {
      const sub = event.data.object as any;
      // Update the plan (upgrade/downgrade)
    },

    'customer.subscription.deleted': async (event) => {
      const sub = event.data.object as any;
      // Revoke access
    },

    'customer.subscription.trial_will_end': async (event) => {
      // Trial ends in 3 days - send an email
    },

    // ── Invoices ──
    'invoice.payment_succeeded': async (event) => {
      const invoice = event.data.object as any;
      // Extend the subscription in your DB
    },

    'invoice.payment_failed': async (event) => {
      const invoice = event.data.object as any;
      // Send an email: "Your payment has failed"
    },

    // ── Refunds ──
    'charge.refunded': async (event) => {
      const charge = event.data.object as any;
      // Update your DB
    },

    // ── Disputes ──
    'charge.dispute.created': async (event) => {
      const dispute = event.data.object as any;
      // Alert the team - respond within 7-21 days
    },

    // ── Connect ──
    'account.updated': async (event) => {
      const account = event.data.object as any;
      // Check the verification status
    },
  },

  // Global error handling
  onError: (error, event) => {
    console.error(`Webhook error [${event?.type}]:`, error.message);
    // Send to Sentry, DataDog, etc.
  },

  // Unhandled events
  onUnhandledEvent: (event) => {
    console.log(`Unhandled event: ${event.type}`);
  },
});
```

---

## Next.js Pages Router

```ts
// pages/api/webhooks/stripe.ts
import '@/lib/stripe';
import { createPagesWebhookHandler } from '@stripe-sdk/core/webhooks';

// IMPORTANT: Disable the body parser to receive the raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

export default createPagesWebhookHandler({
  handlers: {
    'payment_intent.succeeded': async (event) => {
      // ...
    },
  },
});
```

---

## Custom Webhook Handler

If you need more control:

```ts
import '@/lib/stripe';
import { createWebhookHandler } from '@stripe-sdk/core/webhooks';

const handleWebhook = createWebhookHandler({
  secret: 'whsec_custom_secret', // Optional, falls back to the global secret
  handlers: {
    'payment_intent.succeeded': async (event) => {
      // ...
    },
  },
});

// Use manually
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  try {
    const result = await handleWebhook(body, signature);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: 'Invalid webhook' }, { status: 400 });
  }
}
```

---

## Testing Webhooks Locally

### With Stripe CLI

```bash
# 1. Install Stripe CLI
brew install stripe/stripe-cli/stripe

# 2. Log in
stripe login

# 3. Listen for webhooks and forward them to your local app
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# 4. The CLI displays a temporary webhook secret:
# > Ready! Your webhook signing secret is whsec_xxxxx
# Use this secret in your .env.local

# 5. Trigger a test event
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
stripe trigger invoice.payment_failed
```

### Useful Events for Testing

```bash
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
stripe trigger charge.refunded
stripe trigger charge.dispute.created
```

---

## Best Practices

### 1. Idempotency

The same event may be delivered more than once. Your handler must be idempotent:

```ts
'payment_intent.succeeded': async (event) => {
  const pi = event.data.object as any;

  // Check if already processed
  // const existing = await db.orders.findOne({ paymentIntentId: pi.id });
  // if (existing?.status === 'paid') return; // Already processed

  // Process the payment
  // await db.orders.update({ paymentIntentId: pi.id }, { status: 'paid' });
},
```

### 2. Respond Quickly

Stripe expects a 2xx response within 20 seconds. For long-running tasks, use a queue:

```ts
'payment_intent.succeeded': async (event) => {
  // Quick: record the event
  // await queue.add('process-payment', { eventId: event.id, data: event.data });

  // Do NOT perform heavy processing here
},
```

### 3. Always Verify Signatures

The SDK does this automatically. NEVER disable signature verification.

### 4. Log All Events

```ts
onError: (error, event) => {
  // Log for debugging
  console.error({
    webhook_error: true,
    event_type: event?.type,
    event_id: event?.id,
    error: error.message,
  });
},
```

---

## Important Events Reference

| Event | When It Fires |
|---|---|
| `payment_intent.succeeded` | Payment succeeded |
| `payment_intent.payment_failed` | Payment failed |
| `checkout.session.completed` | Checkout completed |
| `customer.subscription.created` | New subscription created |
| `customer.subscription.updated` | Plan changed |
| `customer.subscription.deleted` | Subscription canceled |
| `customer.subscription.trial_will_end` | Trial ends in 3 days |
| `invoice.payment_succeeded` | Invoice paid |
| `invoice.payment_failed` | Invoice payment failed |
| `charge.refunded` | Refund issued |
| `charge.dispute.created` | Dispute opened |
| `account.updated` | Connect account updated |
