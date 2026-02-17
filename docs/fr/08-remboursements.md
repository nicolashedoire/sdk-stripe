# Remboursements & Litiges

Gerez les remboursements et repondez aux chargebacks.

---

## Remboursements

### Remboursement total

```ts
import '@/lib/stripe';
import { createRefund } from '@stripe-sdk/core/server';

const { data: refund } = await createRefund({
  paymentIntentId: 'pi_xxx',
});

console.log(refund.status); // 'succeeded' | 'pending' | 'failed'
```

### Remboursement partiel

```ts
const { data: refund } = await createRefund({
  paymentIntentId: 'pi_xxx',
  amount: 500, // Rembourser 5.00 EUR sur le total
  reason: 'requested_by_customer',
  metadata: {
    ticketId: 'TICKET-456',
    agent: 'support@monsite.com',
  },
});
```

### Raisons possibles

| Raison | Utilisation |
|---|---|
| `requested_by_customer` | Le client demande un remboursement |
| `duplicate` | Double facturation |
| `fraudulent` | Transaction frauduleuse |

### Lister les remboursements

```ts
import { listRefunds } from '@stripe-sdk/core/server';

// Tous les remboursements d'un paiement
const { data: refunds } = await listRefunds({
  paymentIntentId: 'pi_xxx',
});

// Tous les remboursements recents
const { data: allRefunds } = await listRefunds({ limit: 50 });
```

---

## Litiges (Chargebacks)

### Recuperer un litige

```ts
import { retrieveDispute } from '@stripe-sdk/core/server';

const { data: dispute } = await retrieveDispute('dp_xxx');

console.log(dispute.status);  // 'needs_response' | 'under_review' | 'won' | 'lost'
console.log(dispute.amount);  // Montant conteste
console.log(dispute.reason);  // 'fraudulent' | 'product_not_received' | etc.
```

### Repondre a un litige

```ts
import { updateDispute } from '@stripe-sdk/core/server';

const { data: dispute } = await updateDispute({
  disputeId: 'dp_xxx',
  evidence: {
    customerName: 'John Doe',
    customerEmailAddress: 'john@example.com',
    productDescription: 'Abonnement SaaS mensuel - Plan Pro',
    customerCommunication: 'file_xxx', // ID d'un fichier telecharge via l'API Stripe
    serviceDocumentation: 'file_yyy',
    uncategorizedText: 'Le client a utilise le service pendant 3 mois sans probleme.',
  },
  submit: true, // true = soumission finale, false = sauvegarde brouillon
});
```

### Accepter un litige

```ts
import { closeDispute } from '@stripe-sdk/core/server';

// Accepter la contestation (vous perdez le montant)
await closeDispute('dp_xxx');
```

### Lister les litiges

```ts
import { listDisputes } from '@stripe-sdk/core/server';

const { data: disputes } = await listDisputes({ limit: 20 });

disputes.data.forEach((d) => {
  console.log(`${d.id}: ${d.status} - ${d.amount / 100} ${d.currency}`);
});
```

---

## Webhooks pour les remboursements et litiges

```ts
'charge.refunded': async (event) => {
  const charge = event.data.object;
  // Mettre a jour le statut de la commande
  // Envoyer un email de confirmation de remboursement
},

'charge.dispute.created': async (event) => {
  const dispute = event.data.object;
  // URGENT : Vous avez 7-21 jours pour repondre
  // Alerter l'equipe support
  // Preparer les preuves automatiquement si possible
},

'charge.dispute.updated': async (event) => {
  const dispute = event.data.object;
  // Mise a jour du litige
},

'charge.dispute.closed': async (event) => {
  const dispute = event.data.object;
  // Resultat final : dispute.status === 'won' ou 'lost'
},
```

---

## Bonnes pratiques anti-fraude

1. **Conservez les preuves** : emails, logs d'acces, tracking de livraison
2. **Repondez rapidement** : Le delai est de 7 a 21 jours
3. **Surveillez votre taux** : Un taux de litiges > 0.75% met votre compte en danger
4. **Utilisez Radar** : Active par defaut, il bloque les paiements frauduleux
5. **Remboursez proactivement** : En cas de doute, un remboursement coute moins qu'un litige
