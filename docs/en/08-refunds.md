# Refunds & Disputes

Manage refunds and respond to chargebacks.

---

## Refunds

### Full refund

```ts
import '@/lib/stripe';
import { createRefund } from '@stripe-sdk/core/server';

const { data: refund } = await createRefund({
  paymentIntentId: 'pi_xxx',
});

console.log(refund.status); // 'succeeded' | 'pending' | 'failed'
```

### Partial refund

```ts
const { data: refund } = await createRefund({
  paymentIntentId: 'pi_xxx',
  amount: 500, // Refund 5.00 EUR from the total
  reason: 'requested_by_customer',
  metadata: {
    ticketId: 'TICKET-456',
    agent: 'support@mysite.com',
  },
});
```

### Possible reasons

| Reason | Usage |
|---|---|
| `requested_by_customer` | The customer requests a refund |
| `duplicate` | Duplicate charge |
| `fraudulent` | Fraudulent transaction |

### List refunds

```ts
import { listRefunds } from '@stripe-sdk/core/server';

// All refunds for a payment
const { data: refunds } = await listRefunds({
  paymentIntentId: 'pi_xxx',
});

// All recent refunds
const { data: allRefunds } = await listRefunds({ limit: 50 });
```

---

## Disputes (Chargebacks)

### Retrieve a dispute

```ts
import { retrieveDispute } from '@stripe-sdk/core/server';

const { data: dispute } = await retrieveDispute('dp_xxx');

console.log(dispute.status);  // 'needs_response' | 'under_review' | 'won' | 'lost'
console.log(dispute.amount);  // Disputed amount
console.log(dispute.reason);  // 'fraudulent' | 'product_not_received' | etc.
```

### Respond to a dispute

```ts
import { updateDispute } from '@stripe-sdk/core/server';

const { data: dispute } = await updateDispute({
  disputeId: 'dp_xxx',
  evidence: {
    customerName: 'John Doe',
    customerEmailAddress: 'john@example.com',
    productDescription: 'Monthly SaaS subscription - Pro Plan',
    customerCommunication: 'file_xxx', // ID of a file uploaded via the Stripe API
    serviceDocumentation: 'file_yyy',
    uncategorizedText: 'The customer used the service for 3 months without any issues.',
  },
  submit: true, // true = final submission, false = save as draft
});
```

### Accept a dispute

```ts
import { closeDispute } from '@stripe-sdk/core/server';

// Accept the dispute (you lose the disputed amount)
await closeDispute('dp_xxx');
```

### List disputes

```ts
import { listDisputes } from '@stripe-sdk/core/server';

const { data: disputes } = await listDisputes({ limit: 20 });

disputes.data.forEach((d) => {
  console.log(`${d.id}: ${d.status} - ${d.amount / 100} ${d.currency}`);
});
```

---

## Webhooks for refunds and disputes

```ts
'charge.refunded': async (event) => {
  const charge = event.data.object;
  // Update the order status
  // Send a refund confirmation email
},

'charge.dispute.created': async (event) => {
  const dispute = event.data.object;
  // URGENT: You have 7-21 days to respond
  // Alert the support team
  // Automatically prepare evidence if possible
},

'charge.dispute.updated': async (event) => {
  const dispute = event.data.object;
  // Dispute updated
},

'charge.dispute.closed': async (event) => {
  const dispute = event.data.object;
  // Final result: dispute.status === 'won' or 'lost'
},
```

---

## Anti-fraud best practices

1. **Keep your evidence**: emails, access logs, delivery tracking
2. **Respond quickly**: The deadline is 7 to 21 days
3. **Monitor your rate**: A dispute rate above 0.75% puts your account at risk
4. **Use Radar**: Enabled by default, it blocks fraudulent payments
5. **Refund proactively**: When in doubt, a refund costs less than a dispute
