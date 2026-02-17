# Gestion des Erreurs

Toutes les fonctions du SDK retournent un type uniforme `SDKResult<T>` qui facilite la gestion d'erreurs.

---

## Le type SDKResult

```ts
// Succes
type SDKResponse<T> = {
  data: T;       // Les donnees Stripe
  error: null;   // Pas d'erreur
};

// Erreur
type SDKError = {
  data: null;    // Pas de donnees
  error: {
    message: string;     // Message lisible
    type: string;        // Type d'erreur Stripe
    code?: string;       // Code d'erreur (ex: 'card_declined')
    statusCode?: number; // Code HTTP (400, 402, 404...)
  };
};

type SDKResult<T> = SDKResponse<T> | SDKError;
```

---

## Utilisation basique

```ts
import { createPaymentIntent } from '@stripe-sdk/core/server';

const result = await createPaymentIntent({ amount: 2000, currency: 'eur' });

if (result.error) {
  // Gerer l'erreur
  console.error('Erreur:', result.error.message);
  console.error('Type:', result.error.type);
  console.error('Code:', result.error.code);
  return;
}

// TypeScript sait que result.data est non-null ici
console.log('ID:', result.data.id);
console.log('Client Secret:', result.data.client_secret);
```

---

## Dans une API Route

```ts
// app/api/create-payment/route.ts
import { createPaymentIntent } from '@stripe-sdk/core/server';

export async function POST(req: Request) {
  const { amount, currency } = await req.json();

  const result = await createPaymentIntent({ amount, currency });

  if (result.error) {
    // Retourner l'erreur avec le bon code HTTP
    return Response.json(
      { error: result.error.message },
      { status: result.error.statusCode || 400 }
    );
  }

  return Response.json({
    clientSecret: result.data.client_secret,
  });
}
```

---

## Types d'erreurs Stripe

| Type | Description | Que faire |
|---|---|---|
| `StripeCardError` | Carte refusee | Demander au client de reessayer avec une autre carte |
| `StripeInvalidRequestError` | Parametres invalides | Bug dans votre code, corriger les parametres |
| `StripeAPIError` | Erreur interne Stripe | Reessayer plus tard |
| `StripeConnectionError` | Probleme reseau | Reessayer |
| `StripeAuthenticationError` | Cle API invalide | Verifier vos cles API |
| `StripeRateLimitError` | Trop de requetes | Attendre et reessayer |
| `sdk_error` | Erreur interne SDK | Bug dans le SDK ou erreur inattendue |

---

## Codes d'erreur courants (cartes)

| Code | Message | Action |
|---|---|---|
| `card_declined` | Carte refusee | Essayer une autre carte |
| `expired_card` | Carte expiree | Mettre a jour la carte |
| `incorrect_cvc` | CVC incorrect | Verifier le CVC |
| `insufficient_funds` | Fonds insuffisants | Autre moyen de paiement |
| `processing_error` | Erreur de traitement | Reessayer |

---

## Gestion d'erreurs cote client

```tsx
'use client';
import { usePayment } from '@stripe-sdk/core/client';

function PaymentForm() {
  const { processPayment, error, isProcessing } = usePayment({
    onError: (message) => {
      // Afficher une notification
      toast.error(translateError(message));
    },
  });

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700">
          {translateError(error)}
        </div>
      )}
      <button onClick={() => processPayment()} disabled={isProcessing}>
        Payer
      </button>
    </div>
  );
}

// Traduction des erreurs
function translateError(message: string): string {
  const translations: Record<string, string> = {
    'Your card was declined.': 'Votre carte a ete refusee.',
    'Your card has expired.': 'Votre carte est expiree.',
    'Your card\'s security code is incorrect.': 'Le code de securite est incorrect.',
    'Your card has insufficient funds.': 'Fonds insuffisants.',
  };
  return translations[message] || message;
}
```

---

## Pattern : Retry avec backoff

```ts
async function withRetry<T>(
  fn: () => Promise<SDKResult<T>>,
  maxRetries = 3
): Promise<SDKResult<T>> {
  for (let i = 0; i < maxRetries; i++) {
    const result = await fn();

    if (!result.error) return result;

    // Ne pas retenter les erreurs client
    if (result.error.type === 'StripeCardError') return result;
    if (result.error.type === 'StripeInvalidRequestError') return result;

    // Retenter les erreurs serveur/reseau
    if (i < maxRetries - 1) {
      await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }

  return { data: null, error: { message: 'Max retries reached', type: 'sdk_error' } };
}

// Utilisation
const result = await withRetry(() =>
  createPaymentIntent({ amount: 2000, currency: 'eur' })
);
```
