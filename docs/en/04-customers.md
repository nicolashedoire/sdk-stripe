# Customer Management

Create, manage, and search your Stripe customers. Link them to your own users.

---

## Creating a Customer

```ts
import '@/lib/stripe';
import { createCustomer } from '@stripe-sdk/core/server';

// Basic
const result = await createCustomer({
  email: 'john@example.com',
  name: 'John Doe',
});

// Full details
const result2 = await createCustomer({
  email: 'jane@example.com',
  name: 'Jane Doe',
  phone: '+33612345678',
  description: 'Premium customer',
  metadata: {
    userId: 'usr_123',       // Link to your own system
    plan: 'pro',
    source: 'website',
  },
  address: {
    line1: '10 rue de la Paix',
    line2: 'Apt 5',
    city: 'Paris',
    postalCode: '75002',
    country: 'FR',
  },
  paymentMethodId: 'pm_xxx', // Optional: attach a payment method
});

if (result2.error) {
  console.error(result2.error.message);
} else {
  console.log('Customer created:', result2.data.id);
  // Save result2.data.id to your database
}
```

---

## Retrieving a Customer

```ts
import { retrieveCustomer } from '@stripe-sdk/core/server';

const result = await retrieveCustomer('cus_xxxx');

if (result.data) {
  console.log(result.data.email);
  console.log(result.data.subscriptions); // Subscriptions (expanded)
}
```

---

## Updating a Customer

```ts
import { updateCustomer } from '@stripe-sdk/core/server';

await updateCustomer({
  customerId: 'cus_xxxx',
  name: 'Jane Doe-Smith',
  email: 'jane.new@example.com',
  metadata: { plan: 'enterprise' },
  defaultPaymentMethodId: 'pm_new_xxx',
  address: {
    line1: '20 avenue des Champs-Elysees',
    city: 'Paris',
    postalCode: '75008',
    country: 'FR',
  },
});
```

---

## Deleting a Customer

```ts
import { deleteCustomer } from '@stripe-sdk/core/server';

const result = await deleteCustomer('cus_xxxx');
// result.data.deleted === true
```

---

## Listing Customers

```ts
import { listCustomers } from '@stripe-sdk/core/server';

// First 10 customers
const { data: customers } = await listCustomers();

// With pagination
const { data: page2 } = await listCustomers({
  limit: 20,
  startingAfter: 'cus_last_id', // Cursor-based pagination
});

// Filter by email
const { data: filtered } = await listCustomers({
  email: 'john@example.com',
});
```

---

## Searching Customers

```ts
import { searchCustomers } from '@stripe-sdk/core/server';

// By email
const { data: results } = await searchCustomers("email:'john@example.com'");

// By metadata
const { data: proUsers } = await searchCustomers("metadata['plan']:'pro'");

// By name
const { data: johns } = await searchCustomers("name:'John'");

// Combined query
const { data: combined } = await searchCustomers(
  "email:'@example.com' AND metadata['plan']:'pro'"
);
```

---

## Customer Portal (self-service)

Give your customers self-service access to manage their subscriptions and payment methods.

### Setup

1. Enable the portal in [Stripe Dashboard > Settings > Customer Portal](https://dashboard.stripe.com/settings/billing/portal)
2. Configure the available options (cancellation, plan changes, etc.)

### Implementation

```ts
// app/api/portal/route.ts
import '@/lib/stripe';
import { createPortalSession } from '@stripe-sdk/core/server';

export async function POST(req: Request) {
  const { customerId } = await req.json();

  const result = await createPortalSession({
    customerId,
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
  });

  if (result.error) {
    return Response.json({ error: result.error.message }, { status: 400 });
  }

  return Response.json({ url: result.data.url });
}
```

```tsx
// components/ManageBillingButton.tsx
'use client';

export function ManageBillingButton({ customerId }: { customerId: string }) {
  const handleClick = async () => {
    const res = await fetch('/api/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId }),
    });
    const { url } = await res.json();
    window.location.href = url; // Redirect to the Stripe portal
  };

  return (
    <button onClick={handleClick}>
      Manage my subscription
    </button>
  );
}
```

---

## Saving a Payment Method

Save a card for future payments without the customer being present.

### Step 1: Create a SetupIntent

```ts
// app/api/setup-payment-method/route.ts
import '@/lib/stripe';
import { createSetupIntent } from '@stripe-sdk/core/server';

export async function POST(req: Request) {
  const { customerId } = await req.json();

  const result = await createSetupIntent({
    customerId,
    usage: 'off_session', // Future payments without the customer present
  });

  if (result.error) {
    return Response.json({ error: result.error.message }, { status: 400 });
  }

  return Response.json({ clientSecret: result.data.client_secret });
}
```

### Step 2: Form (SetupForm)

```tsx
'use client';
import { StripeElementsProvider, SetupForm } from '@stripe-sdk/core/client';

export function AddPaymentMethod({ clientSecret }: { clientSecret: string }) {
  return (
    <StripeElementsProvider
      publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      clientSecret={clientSecret}
    >
      <SetupForm
        submitLabel="Save card"
        onSuccess={(setupIntentId, paymentMethodId) => {
          console.log('Card saved:', paymentMethodId);
          // Update your UI
        }}
      />
    </StripeElementsProvider>
  );
}
```

### Listing Payment Methods

```ts
import { listPaymentMethods } from '@stripe-sdk/core/server';

// List cards
const { data: cards } = await listPaymentMethods('cus_xxx', 'card');

// List SEPA direct debits
const { data: sepa } = await listPaymentMethods('cus_xxx', 'sepa_debit');

cards.data.forEach((pm) => {
  console.log(`${pm.card?.brand} **** ${pm.card?.last4} - exp ${pm.card?.exp_month}/${pm.card?.exp_year}`);
});
```

### Attaching / Detaching a Payment Method

```ts
import { attachPaymentMethod, detachPaymentMethod } from '@stripe-sdk/core/server';

// Attach a card to a customer
await attachPaymentMethod('pm_xxx', 'cus_xxx');

// Detach (remove from the customer)
await detachPaymentMethod('pm_xxx');
```

---

## Full Pattern: Registration with Stripe

```ts
// app/api/register/route.ts
import '@/lib/stripe';
import { createCustomer } from '@stripe-sdk/core/server';

export async function POST(req: Request) {
  const { email, name, password } = await req.json();

  // 1. Create the user in your DB
  // const user = await db.users.create({ email, name, password });

  // 2. Create the Stripe customer
  const result = await createCustomer({
    email,
    name,
    metadata: {
      userId: 'user.id', // Link both systems
    },
  });

  if (result.error) {
    return Response.json({ error: result.error.message }, { status: 400 });
  }

  // 3. Save the Stripe ID in your DB
  // await db.users.update(user.id, { stripeCustomerId: result.data.id });

  return Response.json({ success: true });
}
```
