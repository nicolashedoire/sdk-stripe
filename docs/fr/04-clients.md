# Gestion des Clients

Creez, gerez et recherchez vos clients Stripe. Liez-les a vos utilisateurs.

---

## Creer un client

```ts
import '@/lib/stripe';
import { createCustomer } from '@stripe-sdk/core/server';

// Basique
const result = await createCustomer({
  email: 'john@example.com',
  name: 'John Doe',
});

// Complet
const result2 = await createCustomer({
  email: 'jane@example.com',
  name: 'Jane Doe',
  phone: '+33612345678',
  description: 'Client premium',
  metadata: {
    userId: 'usr_123',       // Lier a votre systeme
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
  paymentMethodId: 'pm_xxx', // Optionnel : attacher un moyen de paiement
});

if (result2.error) {
  console.error(result2.error.message);
} else {
  console.log('Client cree:', result2.data.id);
  // Sauvegarder result2.data.id dans votre base de donnees
}
```

---

## Recuperer un client

```ts
import { retrieveCustomer } from '@stripe-sdk/core/server';

const result = await retrieveCustomer('cus_xxxx');

if (result.data) {
  console.log(result.data.email);
  console.log(result.data.subscriptions); // Abonnements (expanded)
}
```

---

## Mettre a jour un client

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

## Supprimer un client

```ts
import { deleteCustomer } from '@stripe-sdk/core/server';

const result = await deleteCustomer('cus_xxxx');
// result.data.deleted === true
```

---

## Lister les clients

```ts
import { listCustomers } from '@stripe-sdk/core/server';

// Les 10 premiers
const { data: customers } = await listCustomers();

// Avec pagination
const { data: page2 } = await listCustomers({
  limit: 20,
  startingAfter: 'cus_last_id', // Pagination curseur
});

// Filtrer par email
const { data: filtered } = await listCustomers({
  email: 'john@example.com',
});
```

---

## Rechercher des clients

```ts
import { searchCustomers } from '@stripe-sdk/core/server';

// Par email
const { data: results } = await searchCustomers("email:'john@example.com'");

// Par metadata
const { data: proUsers } = await searchCustomers("metadata['plan']:'pro'");

// Par nom
const { data: johns } = await searchCustomers("name:'John'");

// Combinaison
const { data: combined } = await searchCustomers(
  "email:'@example.com' AND metadata['plan']:'pro'"
);
```

---

## Portail Client (self-service)

Donnez a vos clients un acces self-service pour gerer leurs abonnements et moyens de paiement.

### Configuration

1. Activez le portail dans le [Dashboard Stripe > Settings > Customer Portal](https://dashboard.stripe.com/settings/billing/portal)
2. Configurez les options (annulation, changement de plan, etc.)

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
    window.location.href = url; // Redirige vers le portail Stripe
  };

  return (
    <button onClick={handleClick}>
      Gerer mon abonnement
    </button>
  );
}
```

---

## Sauvegarder un moyen de paiement

Sauvegardez une carte pour des paiements futurs sans que le client soit present.

### Etape 1 : Creer un SetupIntent

```ts
// app/api/setup-payment-method/route.ts
import '@/lib/stripe';
import { createSetupIntent } from '@stripe-sdk/core/server';

export async function POST(req: Request) {
  const { customerId } = await req.json();

  const result = await createSetupIntent({
    customerId,
    usage: 'off_session', // Paiements futurs sans le client
  });

  if (result.error) {
    return Response.json({ error: result.error.message }, { status: 400 });
  }

  return Response.json({ clientSecret: result.data.client_secret });
}
```

### Etape 2 : Formulaire (SetupForm)

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
        submitLabel="Sauvegarder la carte"
        onSuccess={(setupIntentId, paymentMethodId) => {
          console.log('Carte sauvegardee:', paymentMethodId);
          // Mettre a jour votre UI
        }}
      />
    </StripeElementsProvider>
  );
}
```

### Lister les moyens de paiement

```ts
import { listPaymentMethods } from '@stripe-sdk/core/server';

// Lister les cartes
const { data: cards } = await listPaymentMethods('cus_xxx', 'card');

// Lister les SEPA
const { data: sepa } = await listPaymentMethods('cus_xxx', 'sepa_debit');

cards.data.forEach((pm) => {
  console.log(`${pm.card?.brand} **** ${pm.card?.last4} - exp ${pm.card?.exp_month}/${pm.card?.exp_year}`);
});
```

### Attacher / Detacher un moyen de paiement

```ts
import { attachPaymentMethod, detachPaymentMethod } from '@stripe-sdk/core/server';

// Attacher une carte a un client
await attachPaymentMethod('pm_xxx', 'cus_xxx');

// Detacher (supprimer du client)
await detachPaymentMethod('pm_xxx');
```

---

## Pattern complet : Inscription avec Stripe

```ts
// app/api/register/route.ts
import '@/lib/stripe';
import { createCustomer } from '@stripe-sdk/core/server';

export async function POST(req: Request) {
  const { email, name, password } = await req.json();

  // 1. Creer l'utilisateur dans votre DB
  // const user = await db.users.create({ email, name, password });

  // 2. Creer le client Stripe
  const result = await createCustomer({
    email,
    name,
    metadata: {
      userId: 'user.id', // Lier les deux systemes
    },
  });

  if (result.error) {
    return Response.json({ error: result.error.message }, { status: 400 });
  }

  // 3. Sauvegarder l'ID Stripe dans votre DB
  // await db.users.update(user.id, { stripeCustomerId: result.data.id });

  return Response.json({ success: true });
}
```
