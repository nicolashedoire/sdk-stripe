# Invoicing

Create, send, and manage invoices for your customers.

---

## Create and send an invoice

```ts
import '@/lib/stripe';
import {
  createInvoice,
  createInvoiceItem,
  finalizeInvoice,
  sendInvoice,
} from '@stripe-sdk/core/server';

// 1. Create the invoice (draft)
const { data: invoice } = await createInvoice({
  customerId: 'cus_xxx',
  collectionMethod: 'send_invoice', // Send by email
  daysUntilDue: 30,                 // Due in 30 days
  description: 'Invoice January 2025',
});

// 2. Add line items
await createInvoiceItem({
  customerId: 'cus_xxx',
  invoiceId: invoice.id,
  amount: 50000,    // 500.00 EUR
  currency: 'eur',
  description: 'Consulting - 10h at 50 EUR/h',
});

await createInvoiceItem({
  customerId: 'cus_xxx',
  invoiceId: invoice.id,
  amount: 15000,    // 150.00 EUR
  currency: 'eur',
  description: 'Feature X development',
});

// 3. Finalize (generates the PDF, calculates the total)
await finalizeInvoice(invoice.id);

// 4. Send the invoice to the customer by email
await sendInvoice(invoice.id);
```

---

## Invoice with automatic charge

```ts
const { data: invoice } = await createInvoice({
  customerId: 'cus_xxx',
  collectionMethod: 'charge_automatically', // Charge automatically
  description: 'Monthly service',
});

await createInvoiceItem({
  customerId: 'cus_xxx',
  invoiceId: invoice.id,
  priceId: 'price_xxx', // Use an existing price
  quantity: 1,
});

await finalizeInvoice(invoice.id);
// The customer is automatically charged
```

---

## Invoice with an existing price

```ts
await createInvoiceItem({
  customerId: 'cus_xxx',
  invoiceId: invoice.id,
  priceId: 'price_consulting_hourly',
  quantity: 10, // 10 hours
});
```

---

## Retrieve invoices

```ts
import { listInvoices, retrieveInvoice, getUpcomingInvoice } from '@stripe-sdk/core/server';

// All invoices for a customer
const { data: invoices } = await listInvoices({
  customerId: 'cus_xxx',
  limit: 20,
});

// Filter by status
const { data: unpaid } = await listInvoices({
  customerId: 'cus_xxx',
  status: 'open', // 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
});

// Invoice details
const { data: invoice } = await retrieveInvoice('in_xxx');
console.log(invoice.hosted_invoice_url); // Online invoice URL
console.log(invoice.invoice_pdf);         // PDF URL

// Upcoming invoice for a subscription (preview)
const { data: upcoming } = await getUpcomingInvoice('cus_xxx', 'sub_xxx');
console.log(`Next invoice: ${upcoming.amount_due / 100} EUR`);
```

---

## Void an invoice

```ts
import { voidInvoice } from '@stripe-sdk/core/server';

// Void an invoice (marks it as void)
await voidInvoice('in_xxx');
```

---

## Mark as paid (external payment)

```ts
import { payInvoice } from '@stripe-sdk/core/server';

// If the customer paid by wire transfer or check
await payInvoice('in_xxx');
```

---

## Invoice webhooks

```ts
'invoice.created': async (event) => {
  // New invoice created
},
'invoice.finalized': async (event) => {
  // Invoice finalized, ready to be paid
},
'invoice.payment_succeeded': async (event) => {
  const invoice = event.data.object;
  // Invoice paid - update your database
},
'invoice.payment_failed': async (event) => {
  const invoice = event.data.object;
  // Payment failed - send a reminder email
},
```
