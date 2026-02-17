# Stripe Connect (Marketplace)

Build a marketplace or platform that accepts payments on behalf of sellers.

---

## Key concepts

- **Platform**: Your application (you)
- **Connected account**: The sellers/service providers on your marketplace
- **Account types**:
  - `express`: Simplified onboarding handled by Stripe (recommended)
  - `standard`: The seller has their own Stripe Dashboard
  - `custom`: White-label, you control everything

---

## Create a seller account

```ts
import '@/lib/stripe';
import { createConnectAccount, createAccountLink } from '@stripe-sdk/core/server';

// 1. Create the account
const { data: account } = await createConnectAccount({
  type: 'express',
  email: 'seller@example.com',
  country: 'FR',
  capabilities: {
    cardPayments: { requested: true },
    transfers: { requested: true },
  },
  businessType: 'individual',
  metadata: {
    sellerId: 'seller_123',
  },
});

// 2. Generate the onboarding link
const { data: link } = await createAccountLink({
  accountId: account.id,
  refreshUrl: 'https://mysite.com/onboarding/refresh',
  returnUrl: 'https://mysite.com/onboarding/complete',
  type: 'account_onboarding',
});

// 3. Redirect the seller to link.url
console.log(link.url);
```

---

## API routes for onboarding

```ts
// app/api/connect/create-account/route.ts
import '@/lib/stripe';
import { createConnectAccount, createAccountLink } from '@stripe-sdk/core/server';

export async function POST(req: Request) {
  const { email, country } = await req.json();

  // Create the account
  const accountResult = await createConnectAccount({
    type: 'express',
    email,
    country,
    capabilities: {
      cardPayments: { requested: true },
      transfers: { requested: true },
    },
  });

  if (accountResult.error) {
    return Response.json({ error: accountResult.error.message }, { status: 400 });
  }

  // Generate the onboarding link
  const linkResult = await createAccountLink({
    accountId: accountResult.data.id,
    refreshUrl: `${process.env.NEXT_PUBLIC_APP_URL}/seller/onboarding?refresh=true`,
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/seller/dashboard`,
    type: 'account_onboarding',
  });

  if (linkResult.error) {
    return Response.json({ error: linkResult.error.message }, { status: 400 });
  }

  return Response.json({
    accountId: accountResult.data.id,
    onboardingUrl: linkResult.data.url,
  });
}
```

---

## Transfer funds to sellers

```ts
import { createTransfer } from '@stripe-sdk/core/server';

// After a successful payment, transfer the seller's share
await createTransfer({
  amount: 8000,                        // 80 EUR for the seller
  currency: 'eur',
  destinationAccountId: 'acct_xxx',    // Seller's account
  description: 'Sale #12345',
  metadata: {
    orderId: 'order_12345',
    commission: '2000', // 20 EUR platform commission
  },
});
```

---

## Payouts (Bank transfers to sellers)

```ts
import { createPayout, listPayouts } from '@stripe-sdk/core/server';

// Trigger a payout
const { data: payout } = await createPayout(50000, 'eur', {
  sellerId: 'seller_123',
});

// List payouts
const { data: payouts } = await listPayouts({
  status: 'paid',
  limit: 20,
});
```

---

## Check the balance

```ts
import { getBalance, listBalanceTransactions } from '@stripe-sdk/core/server';

// Current balance
const { data: balance } = await getBalance();

balance.available.forEach((b) => {
  console.log(`Available: ${b.amount / 100} ${b.currency}`);
});

balance.pending.forEach((b) => {
  console.log(`Pending: ${b.amount / 100} ${b.currency}`);
});

// Transaction history
const { data: transactions } = await listBalanceTransactions({
  limit: 50,
  type: 'charge', // 'charge' | 'refund' | 'transfer' | 'payout'
});
```

---

## Manage connected accounts

```ts
import {
  retrieveConnectAccount,
  listConnectAccounts,
  deleteConnectAccount,
} from '@stripe-sdk/core/server';

// Check a seller's status
const { data: account } = await retrieveConnectAccount('acct_xxx');
console.log('Charges enabled:', account.charges_enabled);
console.log('Payouts enabled:', account.payouts_enabled);
console.log('Verification:', account.requirements?.currently_due);

// List all connected accounts
const { data: accounts } = await listConnectAccounts({ limit: 50 });

// Delete a connected account
await deleteConnectAccount('acct_xxx');
```

---

## Connect webhooks

```ts
'account.updated': async (event) => {
  const account = event.data.object;

  if (account.charges_enabled && account.payouts_enabled) {
    // The seller is ready to receive payments
    // Activate their profile on your marketplace
  }

  if (account.requirements?.currently_due?.length > 0) {
    // The seller needs to provide additional information
    // Send them a reminder email
  }
},

'payout.paid': async (event) => {
  const payout = event.data.object;
  // The payout to the seller has been completed
},

'payout.failed': async (event) => {
  const payout = event.data.object;
  // The payout failed - verify the bank account details
},
```

---

## Marketplace payment flow

```
Customer ──> Payment 100 EUR ──> Your platform
                                    |
                           ┌────────┴────────┐
                           |                 |
                      Commission         Transfer
                       20 EUR              80 EUR
                         |                    |
                   Your account        Seller account
```

```ts
// 1. Create the payment
const { data: pi } = await createPaymentIntent({
  amount: 10000,  // 100 EUR
  currency: 'eur',
  metadata: { orderId: 'order_123', sellerId: 'seller_456' },
});

// 2. After the payment_intent.succeeded webhook:
await createTransfer({
  amount: 8000,  // 80 EUR to the seller (you keep 20 EUR)
  currency: 'eur',
  destinationAccountId: 'acct_seller_456',
  sourceTransaction: 'ch_xxx', // Optional: link to the charge
});
```
