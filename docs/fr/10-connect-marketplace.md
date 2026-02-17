# Stripe Connect (Marketplace)

Construisez une marketplace ou une plateforme qui accepte des paiements pour le compte de vendeurs.

---

## Concepts cles

- **Plateforme** : Votre application (vous)
- **Compte connecte** : Les vendeurs/prestataires de votre marketplace
- **Types de comptes** :
  - `express` : Onboarding simplifie par Stripe (recommande)
  - `standard` : Le vendeur a son propre Dashboard Stripe
  - `custom` : White-label, vous controlez tout

---

## Creer un compte vendeur

```ts
import '@/lib/stripe';
import { createConnectAccount, createAccountLink } from '@stripe-sdk/core/server';

// 1. Creer le compte
const { data: account } = await createConnectAccount({
  type: 'express',
  email: 'vendeur@example.com',
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

// 2. Generer le lien d'onboarding
const { data: link } = await createAccountLink({
  accountId: account.id,
  refreshUrl: 'https://monsite.com/onboarding/refresh',
  returnUrl: 'https://monsite.com/onboarding/complete',
  type: 'account_onboarding',
});

// 3. Rediriger le vendeur vers link.url
console.log(link.url);
```

---

## API Routes pour l'onboarding

```ts
// app/api/connect/create-account/route.ts
import '@/lib/stripe';
import { createConnectAccount, createAccountLink } from '@stripe-sdk/core/server';

export async function POST(req: Request) {
  const { email, country } = await req.json();

  // Creer le compte
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

  // Generer le lien d'onboarding
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

## Transferer des fonds aux vendeurs

```ts
import { createTransfer } from '@stripe-sdk/core/server';

// Apres un paiement reussi, transferer la part du vendeur
await createTransfer({
  amount: 8000,                        // 80 EUR pour le vendeur
  currency: 'eur',
  destinationAccountId: 'acct_xxx',    // Compte du vendeur
  description: 'Vente #12345',
  metadata: {
    orderId: 'order_12345',
    commission: '2000', // 20 EUR de commission plateforme
  },
});
```

---

## Payouts (Virements aux vendeurs)

```ts
import { createPayout, listPayouts } from '@stripe-sdk/core/server';

// Declencher un virement
const { data: payout } = await createPayout(50000, 'eur', {
  sellerId: 'seller_123',
});

// Lister les virements
const { data: payouts } = await listPayouts({
  status: 'paid',
  limit: 20,
});
```

---

## Consulter le solde

```ts
import { getBalance, listBalanceTransactions } from '@stripe-sdk/core/server';

// Solde actuel
const { data: balance } = await getBalance();

balance.available.forEach((b) => {
  console.log(`Disponible: ${b.amount / 100} ${b.currency}`);
});

balance.pending.forEach((b) => {
  console.log(`En attente: ${b.amount / 100} ${b.currency}`);
});

// Historique des transactions
const { data: transactions } = await listBalanceTransactions({
  limit: 50,
  type: 'charge', // 'charge' | 'refund' | 'transfer' | 'payout'
});
```

---

## Gerer les comptes connectes

```ts
import {
  retrieveConnectAccount,
  listConnectAccounts,
  deleteConnectAccount,
} from '@stripe-sdk/core/server';

// Verifier le statut d'un vendeur
const { data: account } = await retrieveConnectAccount('acct_xxx');
console.log('Charges activees:', account.charges_enabled);
console.log('Payouts actives:', account.payouts_enabled);
console.log('Verification:', account.requirements?.currently_due);

// Lister tous les comptes connectes
const { data: accounts } = await listConnectAccounts({ limit: 50 });

// Supprimer un compte connecte
await deleteConnectAccount('acct_xxx');
```

---

## Webhooks Connect

```ts
'account.updated': async (event) => {
  const account = event.data.object;

  if (account.charges_enabled && account.payouts_enabled) {
    // Le vendeur est pret a recevoir des paiements
    // Activer son profil sur votre marketplace
  }

  if (account.requirements?.currently_due?.length > 0) {
    // Le vendeur doit completer des informations
    // Lui envoyer un email de rappel
  }
},

'payout.paid': async (event) => {
  const payout = event.data.object;
  // Le virement au vendeur a ete effectue
},

'payout.failed': async (event) => {
  const payout = event.data.object;
  // Le virement a echoue - verifier les coordonnees bancaires
},
```

---

## Flux de paiement marketplace

```
Client ──> Paiement 100 EUR ──> Votre plateforme
                                    |
                           ┌────────┴────────┐
                           |                 |
                     Commission          Transfert
                      20 EUR              80 EUR
                        |                    |
                  Votre compte        Compte vendeur
```

```ts
// 1. Creer le paiement
const { data: pi } = await createPaymentIntent({
  amount: 10000,  // 100 EUR
  currency: 'eur',
  metadata: { orderId: 'order_123', sellerId: 'seller_456' },
});

// 2. Apres le webhook payment_intent.succeeded :
await createTransfer({
  amount: 8000,  // 80 EUR au vendeur (vous gardez 20 EUR)
  currency: 'eur',
  destinationAccountId: 'acct_seller_456',
  sourceTransaction: 'ch_xxx', // Optionnel : lier au charge
});
```
