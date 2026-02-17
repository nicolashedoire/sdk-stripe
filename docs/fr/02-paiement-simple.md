# Paiement Simple (One-time)

Acceptez un paiement unique avec un formulaire integre ou une page Stripe.

---

## Option A : Formulaire integre (PaymentElement)

Le formulaire s'affiche directement dans votre app. Supporte 100+ moyens de paiement.

### Etape 1 : API Route (serveur)

```ts
// app/api/create-payment/route.ts
import '@/lib/stripe';
import { createPaymentIntent } from '@stripe-sdk/core/server';

export async function POST(req: Request) {
  const { amount, currency, metadata } = await req.json();

  // IMPORTANT : Toujours valider le montant cote serveur
  if (!amount || amount < 50) {
    return Response.json({ error: 'Montant invalide' }, { status: 400 });
  }

  const result = await createPaymentIntent({
    amount,           // en centimes : 2000 = 20.00 EUR
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

### Etape 2 : Page de paiement (client)

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

  if (error) return <p>Erreur : {error}</p>;
  if (!clientSecret) return <p>Chargement...</p>;

  return (
    <StripeElementsProvider
      publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      clientSecret={clientSecret}
    >
      <CheckoutForm
        submitLabel="Payer 20,00 EUR"
        showEmail
        onSuccess={(paymentIntentId) => {
          // Rediriger vers une page de confirmation
          window.location.href = `/success?pi=${paymentIntentId}`;
        }}
        onError={(message) => {
          console.error('Erreur de paiement:', message);
        }}
      />
    </StripeElementsProvider>
  );
}
```

### Personnalisation du formulaire

```tsx
<CheckoutForm
  submitLabel="Confirmer le paiement"
  showEmail                    // Affiche le champ email (Link integration)
  layout="accordion"           // 'tabs' | 'accordion' | 'auto'
  returnUrl="https://monsite.com/success"  // URL de retour apres 3DS
  className="my-form"          // Classes CSS sur le <form>
  buttonClassName="btn-primary" // Classes CSS sur le bouton
  errorClassName="text-red-500" // Classes CSS sur les erreurs
/>
```

### Personnalisation de l'apparence (theme)

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

## Option B : Checkout Session (page Stripe)

Redirigez vers une page de paiement Stripe hebergee. Moins de code, plus de 40 moyens de paiement.

### Etape 1 : API Route

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

### Etape 2 : Bouton d'achat

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
      {isLoading ? 'Redirection...' : 'Acheter maintenant'}
    </button>
  );
}
```

---

## Option C : Payment Link (sans code)

Creez un lien de paiement partageable par email, SMS ou QR code.

```ts
// Exemple dans un script ou une API route
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
    redirectUrl: 'https://monsite.com/merci',
  },
  allowPromotionCodes: true,
});

console.log(result.data.url);
// -> https://buy.stripe.com/xxxxxxxxx
// Partagez ce lien par email, SMS, ou integrez-le dans un bouton
```

---

## Verifier un paiement (page de succes)

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
      return <h1>Merci pour votre achat !</h1>;
    }
  }

  if (searchParams.pi) {
    const result = await retrievePaymentIntent(searchParams.pi);
    if (result.data?.status === 'succeeded') {
      return <h1>Paiement confirme !</h1>;
    }
  }

  return <h1>Paiement en cours de verification...</h1>;
}
```

---

## Quand utiliser quoi ?

| Methode | Quand l'utiliser |
|---|---|
| **CheckoutForm** (PaymentElement) | UI custom integree dans votre app |
| **Checkout Session** | Rapidite, page Stripe hebergee, conformite PCI simplifiee |
| **Payment Link** | Pas de code, partage par email/SMS/QR |
