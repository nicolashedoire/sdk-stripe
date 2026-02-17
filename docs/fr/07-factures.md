# Facturation

Creez, envoyez et gerez des factures pour vos clients.

---

## Creer et envoyer une facture

```ts
import '@/lib/stripe';
import {
  createInvoice,
  createInvoiceItem,
  finalizeInvoice,
  sendInvoice,
} from '@stripe-sdk/core/server';

// 1. Creer la facture (brouillon)
const { data: invoice } = await createInvoice({
  customerId: 'cus_xxx',
  collectionMethod: 'send_invoice', // Envoyer par email
  daysUntilDue: 30,                 // Payable sous 30 jours
  description: 'Facture Janvier 2025',
});

// 2. Ajouter des lignes
await createInvoiceItem({
  customerId: 'cus_xxx',
  invoiceId: invoice.id,
  amount: 50000,    // 500.00 EUR
  currency: 'eur',
  description: 'Consulting - 10h a 50 EUR/h',
});

await createInvoiceItem({
  customerId: 'cus_xxx',
  invoiceId: invoice.id,
  amount: 15000,    // 150.00 EUR
  currency: 'eur',
  description: 'Developpement feature X',
});

// 3. Finaliser (genere le PDF, calcule le total)
await finalizeInvoice(invoice.id);

// 4. Envoyer par email au client
await sendInvoice(invoice.id);
```

---

## Facture avec prelevement automatique

```ts
const { data: invoice } = await createInvoice({
  customerId: 'cus_xxx',
  collectionMethod: 'charge_automatically', // Prelever automatiquement
  description: 'Service mensuel',
});

await createInvoiceItem({
  customerId: 'cus_xxx',
  invoiceId: invoice.id,
  priceId: 'price_xxx', // Utiliser un prix existant
  quantity: 1,
});

await finalizeInvoice(invoice.id);
// Le client est automatiquement debite
```

---

## Facture avec un prix existant

```ts
await createInvoiceItem({
  customerId: 'cus_xxx',
  invoiceId: invoice.id,
  priceId: 'price_consulting_hourly',
  quantity: 10, // 10 heures
});
```

---

## Consulter les factures

```ts
import { listInvoices, retrieveInvoice, getUpcomingInvoice } from '@stripe-sdk/core/server';

// Toutes les factures d'un client
const { data: invoices } = await listInvoices({
  customerId: 'cus_xxx',
  limit: 20,
});

// Filtrer par statut
const { data: unpaid } = await listInvoices({
  customerId: 'cus_xxx',
  status: 'open', // 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
});

// Detail d'une facture
const { data: invoice } = await retrieveInvoice('in_xxx');
console.log(invoice.hosted_invoice_url); // URL de la facture en ligne
console.log(invoice.invoice_pdf);         // URL du PDF

// Prochaine facture d'un abonnement (preview)
const { data: upcoming } = await getUpcomingInvoice('cus_xxx', 'sub_xxx');
console.log(`Prochaine facture : ${upcoming.amount_due / 100} EUR`);
```

---

## Annuler une facture

```ts
import { voidInvoice } from '@stripe-sdk/core/server';

// Annuler une facture (la rend void)
await voidInvoice('in_xxx');
```

---

## Marquer comme payee (paiement externe)

```ts
import { payInvoice } from '@stripe-sdk/core/server';

// Si le client a paye par virement ou cheque
await payInvoice('in_xxx');
```

---

## Webhooks pour les factures

```ts
'invoice.created': async (event) => {
  // Nouvelle facture creee
},
'invoice.finalized': async (event) => {
  // Facture finalisee, prete a etre payee
},
'invoice.payment_succeeded': async (event) => {
  const invoice = event.data.object;
  // Facture payee - mettre a jour votre DB
},
'invoice.payment_failed': async (event) => {
  const invoice = event.data.object;
  // Echec de paiement - envoyer un email de relance
},
```
