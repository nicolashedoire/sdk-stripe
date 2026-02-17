# Webhooks

Recevez des notifications en temps reel pour tous les evenements Stripe. Les webhooks sont **essentiels** pour synchroniser votre base de donnees.

---

## Pourquoi les webhooks sont indispensables

- Un paiement peut reussir apres que le client a quitte votre site (3D Secure)
- Les abonnements sont renouveles automatiquement par Stripe
- Les remboursements et litiges sont geres en dehors de votre app
- Les paiements peuvent echouer lors du renouvellement

**Regle d'or** : Ne faites JAMAIS confiance au client. Validez toujours via webhook.

---

## Next.js App Router (recommande)

```ts
// app/api/webhooks/stripe/route.ts
import '@/lib/stripe';
import { createNextWebhookHandler } from '@stripe-sdk/core/webhooks';

export const POST = createNextWebhookHandler({
  handlers: {
    // ── Paiements ──
    'payment_intent.succeeded': async (event) => {
      const paymentIntent = event.data.object as any;
      console.log(`Paiement reussi: ${paymentIntent.id} - ${paymentIntent.amount / 100} ${paymentIntent.currency}`);
      // await db.orders.update({ paymentIntentId: paymentIntent.id }, { status: 'paid' });
    },

    'payment_intent.payment_failed': async (event) => {
      const paymentIntent = event.data.object as any;
      console.log(`Paiement echoue: ${paymentIntent.id}`);
      // Envoyer un email de relance
    },

    // ── Checkout ──
    'checkout.session.completed': async (event) => {
      const session = event.data.object as any;
      console.log(`Checkout termine: ${session.id}`);
      // Provisionner l'acces / envoyer le produit
    },

    // ── Abonnements ──
    'customer.subscription.created': async (event) => {
      const sub = event.data.object as any;
      // Activer le plan dans votre DB
    },

    'customer.subscription.updated': async (event) => {
      const sub = event.data.object as any;
      // Mettre a jour le plan (upgrade/downgrade)
    },

    'customer.subscription.deleted': async (event) => {
      const sub = event.data.object as any;
      // Revoquer l'acces
    },

    'customer.subscription.trial_will_end': async (event) => {
      // Fin d'essai dans 3 jours - envoyer un email
    },

    // ── Factures ──
    'invoice.payment_succeeded': async (event) => {
      const invoice = event.data.object as any;
      // Prolonger l'abonnement dans votre DB
    },

    'invoice.payment_failed': async (event) => {
      const invoice = event.data.object as any;
      // Envoyer un email : "Votre paiement a echoue"
    },

    // ── Remboursements ──
    'charge.refunded': async (event) => {
      const charge = event.data.object as any;
      // Mettre a jour votre DB
    },

    // ── Litiges ──
    'charge.dispute.created': async (event) => {
      const dispute = event.data.object as any;
      // Alerter l'equipe - repondre sous 7-21 jours
    },

    // ── Connect ──
    'account.updated': async (event) => {
      const account = event.data.object as any;
      // Verifier le statut de verification
    },
  },

  // Gestion d'erreurs globale
  onError: (error, event) => {
    console.error(`Webhook error [${event?.type}]:`, error.message);
    // Envoyer a Sentry, DataDog, etc.
  },

  // Evenements non geres
  onUnhandledEvent: (event) => {
    console.log(`Evenement non gere: ${event.type}`);
  },
});
```

---

## Next.js Pages Router

```ts
// pages/api/webhooks/stripe.ts
import '@/lib/stripe';
import { createPagesWebhookHandler } from '@stripe-sdk/core/webhooks';

// IMPORTANT : Desactiver le body parser pour recevoir le body brut
export const config = {
  api: {
    bodyParser: false,
  },
};

export default createPagesWebhookHandler({
  handlers: {
    'payment_intent.succeeded': async (event) => {
      // ...
    },
  },
});
```

---

## Webhook handler personnalise

Si vous avez besoin de plus de controle :

```ts
import '@/lib/stripe';
import { createWebhookHandler } from '@stripe-sdk/core/webhooks';

const handleWebhook = createWebhookHandler({
  secret: 'whsec_custom_secret', // Optionnel, sinon utilise le secret global
  handlers: {
    'payment_intent.succeeded': async (event) => {
      // ...
    },
  },
});

// Utiliser manuellement
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  try {
    const result = await handleWebhook(body, signature);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: 'Invalid webhook' }, { status: 400 });
  }
}
```

---

## Tester les webhooks en local

### Avec Stripe CLI

```bash
# 1. Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# 2. Se connecter
stripe login

# 3. Ecouter les webhooks et les rediriger vers votre app locale
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# 4. La CLI affiche le webhook secret temporaire :
# > Ready! Your webhook signing secret is whsec_xxxxx
# Utilisez ce secret dans votre .env.local

# 5. Declencher un evenement de test
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
stripe trigger invoice.payment_failed
```

### Evenements utiles pour les tests

```bash
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
stripe trigger charge.refunded
stripe trigger charge.dispute.created
```

---

## Bonnes pratiques

### 1. Idempotence

Un meme evenement peut etre envoye plusieurs fois. Votre handler doit etre idempotent :

```ts
'payment_intent.succeeded': async (event) => {
  const pi = event.data.object as any;

  // Verifier si deja traite
  // const existing = await db.orders.findOne({ paymentIntentId: pi.id });
  // if (existing?.status === 'paid') return; // Deja traite

  // Traiter le paiement
  // await db.orders.update({ paymentIntentId: pi.id }, { status: 'paid' });
},
```

### 2. Repondre rapidement

Stripe attend une reponse 2xx en moins de 20 secondes. Pour les traitements longs, utilisez une file d'attente :

```ts
'payment_intent.succeeded': async (event) => {
  // Rapide : enregistrer l'evenement
  // await queue.add('process-payment', { eventId: event.id, data: event.data });

  // NE PAS faire de traitement long ici
},
```

### 3. Verifier toujours les signatures

Le SDK le fait automatiquement. Ne desactivez JAMAIS la verification de signature.

### 4. Logger tous les evenements

```ts
onError: (error, event) => {
  // Logger pour le debug
  console.error({
    webhook_error: true,
    event_type: event?.type,
    event_id: event?.id,
    error: error.message,
  });
},
```

---

## Liste des evenements importants

| Evenement | Quand |
|---|---|
| `payment_intent.succeeded` | Paiement reussi |
| `payment_intent.payment_failed` | Paiement echoue |
| `checkout.session.completed` | Checkout termine |
| `customer.subscription.created` | Nouvel abonnement |
| `customer.subscription.updated` | Changement de plan |
| `customer.subscription.deleted` | Abonnement annule |
| `customer.subscription.trial_will_end` | Fin d'essai dans 3 jours |
| `invoice.payment_succeeded` | Facture payee |
| `invoice.payment_failed` | Echec de paiement de facture |
| `charge.refunded` | Remboursement effectue |
| `charge.dispute.created` | Litige ouvert |
| `account.updated` | Compte Connect mis a jour |
