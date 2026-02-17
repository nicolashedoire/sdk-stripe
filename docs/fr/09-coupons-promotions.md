# Coupons & Codes Promotionnels

Creez des remises pour vos abonnements et sessions de checkout.

---

## Creer un coupon

### Reduction en pourcentage

```ts
import '@/lib/stripe';
import { createCoupon } from '@stripe-sdk/core/server';

// -20% pendant 3 mois
const { data: coupon } = await createCoupon({
  percentOff: 20,
  duration: 'repeating',
  durationInMonths: 3,
  name: 'Lancement -20%',
});

// -50% pour toujours
const { data: halfOff } = await createCoupon({
  percentOff: 50,
  duration: 'forever',
  name: 'Partenaire -50%',
  maxRedemptions: 10,  // Maximum 10 utilisations
});

// -100% une seule fois (premier mois gratuit)
const { data: freeMonth } = await createCoupon({
  percentOff: 100,
  duration: 'once',
  name: 'Premier mois gratuit',
});
```

### Reduction en montant fixe

```ts
// -10 EUR sur le premier paiement
const { data: coupon } = await createCoupon({
  amountOff: 1000,  // 10.00 EUR
  currency: 'eur',
  duration: 'once',
  name: 'Bienvenue -10 EUR',
  redeemBy: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // Expire dans 30 jours
});
```

---

## Creer un code promo

Les codes promo sont des codes texte que vos clients saisissent. Ils sont lies a un coupon.

```ts
import { createPromotionCode } from '@stripe-sdk/core/server';

// Code simple
const { data: promo } = await createPromotionCode({
  couponId: 'coupon_xxx',
  code: 'LAUNCH20',
});

// Code avec restrictions
const { data: restrictedPromo } = await createPromotionCode({
  couponId: 'coupon_xxx',
  code: 'WELCOME10',
  maxRedemptions: 100,      // Max 100 utilisations
  expiresAt: Math.floor(new Date('2025-12-31').getTime() / 1000),
  restrictions: {
    firstTimeTransaction: true,    // Uniquement pour les nouveaux clients
    minimumAmount: 5000,           // Minimum 50 EUR d'achat
    minimumAmountCurrency: 'eur',
  },
});
```

---

## Appliquer un coupon

### Sur un abonnement

```ts
import { createSubscription, updateSubscription } from '@stripe-sdk/core/server';

// A la creation
await createSubscription({
  customerId: 'cus_xxx',
  priceId: 'price_pro',
  couponId: 'coupon_xxx', // Appliquer le coupon
});

// Sur un abonnement existant
await updateSubscription({
  subscriptionId: 'sub_xxx',
  couponId: 'coupon_xxx',
});
```

### Sur une Checkout Session

```ts
import { createCheckoutSession } from '@stripe-sdk/core/server';

await createCheckoutSession({
  mode: 'subscription',
  lineItems: [{ priceId: 'price_pro', quantity: 1 }],
  successUrl: 'https://monsite.com/success',
  cancelUrl: 'https://monsite.com/cancel',
  allowPromotionCodes: true, // Le client peut saisir un code promo
});
```

---

## Lister et gerer

```ts
import {
  listCoupons,
  retrieveCoupon,
  deleteCoupon,
  listPromotionCodes,
} from '@stripe-sdk/core/server';

// Lister les coupons
const { data: coupons } = await listCoupons({ limit: 25 });

// Detail d'un coupon
const { data: coupon } = await retrieveCoupon('coupon_xxx');
console.log(`${coupon.name}: ${coupon.percent_off}% off`);
console.log(`Utilisations: ${coupon.times_redeemed}/${coupon.max_redemptions || 'illimite'}`);

// Supprimer un coupon (les remises existantes restent actives)
await deleteCoupon('coupon_xxx');

// Lister les codes promo d'un coupon
const { data: promos } = await listPromotionCodes({
  couponId: 'coupon_xxx',
  active: true,
});
```

---

## Exemples de strategies

| Strategie | Configuration |
|---|---|
| Premier mois gratuit | `percentOff: 100, duration: 'once'` |
| -20% pendant 3 mois | `percentOff: 20, duration: 'repeating', durationInMonths: 3` |
| -10 EUR sur le 1er paiement | `amountOff: 1000, duration: 'once'` |
| Parrainage -50% a vie | `percentOff: 50, duration: 'forever'` |
| Black Friday limte | `percentOff: 30, duration: 'once', redeemBy: timestamp, maxRedemptions: 500` |
