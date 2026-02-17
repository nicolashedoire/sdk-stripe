# Abonnements & Facturation Recurrente

Gerez les abonnements de bout en bout : creation, mise a niveau, annulation, reprise, essai gratuit.

---

## Creer un abonnement

### Methode 1 : Via Checkout Session (recommande pour debuter)

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
    trialPeriodDays: 14,               // 14 jours d'essai gratuit
    allowPromotionCodes: true,          // Accepter les codes promo
    billingAddressCollection: 'required',
  });

  if (result.error) {
    return Response.json({ error: result.error.message }, { status: 400 });
  }

  return Response.json({ url: result.data.url });
}
```

### Methode 2 : Formulaire integre (controle total)

```ts
// app/api/create-subscription/route.ts
import '@/lib/stripe';
import { createSubscription } from '@stripe-sdk/core/server';

export async function POST(req: Request) {
  const { customerId, priceId } = await req.json();

  const result = await createSubscription({
    customerId,
    priceId,
    paymentBehavior: 'default_incomplete', // Attendre la confirmation du paiement
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
    clientSecret, // Utiliser avec StripeElementsProvider pour confirmer
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
        customerId: 'cus_xxx', // ID du client connecte
        priceId: 'price_pro_monthly',
      }),
    })
      .then((r) => r.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, []);

  if (!clientSecret) return <p>Chargement...</p>;

  return (
    <StripeElementsProvider
      publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      clientSecret={clientSecret}
    >
      <CheckoutForm
        submitLabel="S'abonner - 29 EUR/mois"
        onSuccess={() => window.location.href = '/account'}
      />
    </StripeElementsProvider>
  );
}
```

---

## Tableau de prix (PricingTable)

```tsx
// app/pricing/page.tsx
'use client';
import { PricingTable, type PricingPlan } from '@stripe-sdk/core/client';

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    description: 'Pour decouvrir',
    priceId: 'price_free',
    amount: 0,
    currency: 'eur',
    interval: 'month',
    features: [
      '1 projet',
      '100 Mo stockage',
      'Support communautaire',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Pour les petites equipes',
    priceId: 'price_starter',
    amount: 900,
    currency: 'eur',
    interval: 'month',
    features: [
      '5 projets',
      '1 Go stockage',
      'Support email',
      'Analytics de base',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Pour les entreprises',
    priceId: 'price_pro',
    amount: 2900,
    currency: 'eur',
    interval: 'month',
    features: [
      'Projets illimites',
      '100 Go stockage',
      'Support prioritaire',
      'Analytics avances',
      'API access',
    ],
    highlighted: true,
    badge: 'Populaire',
    trialDays: 14,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Solutions sur mesure',
    priceId: 'price_enterprise',
    amount: 9900,
    currency: 'eur',
    interval: 'month',
    features: [
      'Tout dans Pro',
      'Stockage illimite',
      'SLA 99.99%',
      'Account manager dedie',
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
      <h1>Nos tarifs</h1>
      <PricingTable
        plans={plans}
        onSelectPlan={handleSelectPlan}
        currentPlanId="starter"         // Plan actuel de l'utilisateur
        buttonLabel="Choisir"
        currentPlanLabel="Plan actuel"
      />
    </div>
  );
}
```

---

## Changer de plan (upgrade / downgrade)

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
        id: subscriptionItemId,  // ID de l'item existant (si_xxx)
        priceId: newPriceId,     // Nouveau prix
      },
    ],
    prorationBehavior: 'create_prorations', // Calculer au prorata
  });

  if (result.error) {
    return Response.json({ error: result.error.message }, { status: 400 });
  }

  return Response.json({ subscription: result.data });
}
```

---

## Annuler un abonnement

```ts
// app/api/cancel-subscription/route.ts
import '@/lib/stripe';
import { cancelSubscription } from '@stripe-sdk/core/server';

export async function POST(req: Request) {
  const { subscriptionId, immediate } = await req.json();

  const result = await cancelSubscription({
    subscriptionId,
    cancelAtPeriodEnd: !immediate, // true = acces jusqu'a la fin de la periode
    cancellationDetails: {
      feedback: 'too_expensive',   // Optionnel: raison de l'annulation
      comment: 'Trop cher pour notre equipe',
    },
  });

  if (result.error) {
    return Response.json({ error: result.error.message }, { status: 400 });
  }

  return Response.json({ subscription: result.data });
}
```

---

## Reprendre un abonnement annule

```ts
// app/api/resume-subscription/route.ts
import '@/lib/stripe';
import { resumeSubscription } from '@stripe-sdk/core/server';

export async function POST(req: Request) {
  const { subscriptionId } = await req.json();

  // Fonctionne uniquement si cancelAtPeriodEnd etait true
  const result = await resumeSubscription(subscriptionId);

  if (result.error) {
    return Response.json({ error: result.error.message }, { status: 400 });
  }

  return Response.json({ subscription: result.data });
}
```

---

## Composant de gestion d'abonnement

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
      cancelLabel="Annuler l'abonnement"
      resumeLabel="Reprendre l'abonnement"
      changePlanLabel="Changer de plan"
      manageBillingLabel="Gerer la facturation"
    />
  );
}
```

---

## Webhooks essentiels pour les abonnements

```ts
// app/api/webhooks/stripe/route.ts
import '@/lib/stripe';
import { createNextWebhookHandler } from '@stripe-sdk/core/webhooks';

export const POST = createNextWebhookHandler({
  handlers: {
    'customer.subscription.created': async (event) => {
      const subscription = event.data.object;
      // Activer l'acces premium dans votre DB
      // await db.users.update({ stripeSubscriptionId: subscription.id }, { plan: 'pro' });
    },

    'customer.subscription.updated': async (event) => {
      const subscription = event.data.object;
      // Mettre a jour le plan dans votre DB
    },

    'customer.subscription.deleted': async (event) => {
      const subscription = event.data.object;
      // Revoquer l'acces premium
    },

    'customer.subscription.trial_will_end': async (event) => {
      // L'essai gratuit se termine dans 3 jours
      // Envoyer un email de rappel
    },

    'invoice.payment_failed': async (event) => {
      const invoice = event.data.object;
      // Le paiement a echoue - envoyer un email au client
    },

    'invoice.payment_succeeded': async (event) => {
      const invoice = event.data.object;
      // Paiement reussi - prolonger l'acces
    },
  },
});
```
