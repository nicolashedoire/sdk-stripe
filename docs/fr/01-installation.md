# Installation & Configuration

## Pre-requis

- Node.js >= 18
- React >= 18
- Next.js >= 13 (optionnel, pour les features Next.js)

## Installation

```bash
npm install @stripe-sdk/core stripe @stripe/stripe-js @stripe/react-stripe-js
```

## Variables d'environnement

Creez un fichier `.env.local` a la racine de votre projet :

```env
# Cle publique (utilisable cote client)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx

# Cle secrete (serveur uniquement - JAMAIS cote client)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx

# Secret webhook (pour verifier les signatures)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
```

> **Securite** : Ne commitez JAMAIS vos cles secretes. Ajoutez `.env.local` a votre `.gitignore`.

## Initialisation

Creez un fichier `lib/stripe.ts` a la racine de votre projet :

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

**Important** : Importez ce fichier au debut de vos API routes ou Server Actions pour initialiser Stripe :

```ts
import '@/lib/stripe'; // Initialise le SDK
```

## Structure des imports

```ts
// Fonctions serveur (API routes, Server Actions, etc.)
import { createPaymentIntent, createCustomer } from '@stripe-sdk/core/server';

// Composants et hooks React (client)
import { CheckoutForm, usePayment } from '@stripe-sdk/core/client';

// Webhooks
import { createNextWebhookHandler } from '@stripe-sdk/core/webhooks';

// Helpers Next.js
import { actions, createPaymentIntentRoute } from '@stripe-sdk/core/next';
```

## Test de la configuration

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

Visitez `/api/test-stripe` - si vous voyez votre solde, tout est configure.
