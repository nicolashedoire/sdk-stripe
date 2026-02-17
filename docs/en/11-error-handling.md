# Error Handling

All SDK functions return a unified `SDKResult<T>` type that makes error handling straightforward.

---

## The SDKResult type

```ts
// Success
type SDKResponse<T> = {
  data: T;       // The Stripe data
  error: null;   // No error
};

// Error
type SDKError = {
  data: null;    // No data
  error: {
    message: string;     // Human-readable message
    type: string;        // Stripe error type
    code?: string;       // Error code (e.g. 'card_declined')
    statusCode?: number; // HTTP status code (400, 402, 404...)
  };
};

type SDKResult<T> = SDKResponse<T> | SDKError;
```

---

## Basic usage

```ts
import { createPaymentIntent } from '@stripe-sdk/core/server';

const result = await createPaymentIntent({ amount: 2000, currency: 'eur' });

if (result.error) {
  // Handle the error
  console.error('Error:', result.error.message);
  console.error('Type:', result.error.type);
  console.error('Code:', result.error.code);
  return;
}

// TypeScript knows that result.data is non-null here
console.log('ID:', result.data.id);
console.log('Client Secret:', result.data.client_secret);
```

---

## In an API route

```ts
// app/api/create-payment/route.ts
import { createPaymentIntent } from '@stripe-sdk/core/server';

export async function POST(req: Request) {
  const { amount, currency } = await req.json();

  const result = await createPaymentIntent({ amount, currency });

  if (result.error) {
    // Return the error with the appropriate HTTP status code
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

## Stripe error types

| Type | Description | What to do |
|---|---|---|
| `StripeCardError` | Card declined | Ask the customer to try another card |
| `StripeInvalidRequestError` | Invalid parameters | Bug in your code, fix the parameters |
| `StripeAPIError` | Stripe internal error | Retry later |
| `StripeConnectionError` | Network issue | Retry |
| `StripeAuthenticationError` | Invalid API key | Check your API keys |
| `StripeRateLimitError` | Too many requests | Wait and retry |
| `sdk_error` | Internal SDK error | Bug in the SDK or unexpected error |

---

## Common error codes (cards)

| Code | Message | Action |
|---|---|---|
| `card_declined` | Card declined | Try another card |
| `expired_card` | Card expired | Update the card |
| `incorrect_cvc` | Incorrect CVC | Verify the CVC |
| `insufficient_funds` | Insufficient funds | Use another payment method |
| `processing_error` | Processing error | Retry |

---

## Client-side error handling

```tsx
'use client';
import { usePayment } from '@stripe-sdk/core/client';

function PaymentForm() {
  const { processPayment, error, isProcessing } = usePayment({
    onError: (message) => {
      // Display a notification
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
        Pay
      </button>
    </div>
  );
}

// Error translation
function translateError(message: string): string {
  const translations: Record<string, string> = {
    'Your card was declined.': 'Your card was declined.',
    'Your card has expired.': 'Your card has expired.',
    'Your card\'s security code is incorrect.': 'Your card\'s security code is incorrect.',
    'Your card has insufficient funds.': 'Insufficient funds.',
  };
  return translations[message] || message;
}
```

---

## Pattern: Retry with backoff

```ts
async function withRetry<T>(
  fn: () => Promise<SDKResult<T>>,
  maxRetries = 3
): Promise<SDKResult<T>> {
  for (let i = 0; i < maxRetries; i++) {
    const result = await fn();

    if (!result.error) return result;

    // Do not retry client errors
    if (result.error.type === 'StripeCardError') return result;
    if (result.error.type === 'StripeInvalidRequestError') return result;

    // Retry server/network errors
    if (i < maxRetries - 1) {
      await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }

  return { data: null, error: { message: 'Max retries reached', type: 'sdk_error' } };
}

// Usage
const result = await withRetry(() =>
  createPaymentIntent({ amount: 2000, currency: 'eur' })
);
```
