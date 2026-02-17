# Coupons & Promotion Codes

Create discounts for your subscriptions and checkout sessions.

---

## Create a coupon

### Percentage discount

```ts
import '@/lib/stripe';
import { createCoupon } from '@stripe-sdk/core/server';

// -20% for 3 months
const { data: coupon } = await createCoupon({
  percentOff: 20,
  duration: 'repeating',
  durationInMonths: 3,
  name: 'Launch -20%',
});

// -50% forever
const { data: halfOff } = await createCoupon({
  percentOff: 50,
  duration: 'forever',
  name: 'Partner -50%',
  maxRedemptions: 10,  // Maximum 10 uses
});

// -100% once (first month free)
const { data: freeMonth } = await createCoupon({
  percentOff: 100,
  duration: 'once',
  name: 'First month free',
});
```

### Fixed amount discount

```ts
// -10 EUR on the first payment
const { data: coupon } = await createCoupon({
  amountOff: 1000,  // 10.00 EUR
  currency: 'eur',
  duration: 'once',
  name: 'Welcome -10 EUR',
  redeemBy: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // Expires in 30 days
});
```

---

## Create a promotion code

Promotion codes are text codes that your customers enter. They are linked to a coupon.

```ts
import { createPromotionCode } from '@stripe-sdk/core/server';

// Simple code
const { data: promo } = await createPromotionCode({
  couponId: 'coupon_xxx',
  code: 'LAUNCH20',
});

// Code with restrictions
const { data: restrictedPromo } = await createPromotionCode({
  couponId: 'coupon_xxx',
  code: 'WELCOME10',
  maxRedemptions: 100,      // Max 100 uses
  expiresAt: Math.floor(new Date('2025-12-31').getTime() / 1000),
  restrictions: {
    firstTimeTransaction: true,    // New customers only
    minimumAmount: 5000,           // Minimum 50 EUR purchase
    minimumAmountCurrency: 'eur',
  },
});
```

---

## Apply a coupon

### On a subscription

```ts
import { createSubscription, updateSubscription } from '@stripe-sdk/core/server';

// At creation
await createSubscription({
  customerId: 'cus_xxx',
  priceId: 'price_pro',
  couponId: 'coupon_xxx', // Apply the coupon
});

// On an existing subscription
await updateSubscription({
  subscriptionId: 'sub_xxx',
  couponId: 'coupon_xxx',
});
```

### On a Checkout Session

```ts
import { createCheckoutSession } from '@stripe-sdk/core/server';

await createCheckoutSession({
  mode: 'subscription',
  lineItems: [{ priceId: 'price_pro', quantity: 1 }],
  successUrl: 'https://mysite.com/success',
  cancelUrl: 'https://mysite.com/cancel',
  allowPromotionCodes: true, // The customer can enter a promotion code
});
```

---

## List and manage

```ts
import {
  listCoupons,
  retrieveCoupon,
  deleteCoupon,
  listPromotionCodes,
} from '@stripe-sdk/core/server';

// List coupons
const { data: coupons } = await listCoupons({ limit: 25 });

// Coupon details
const { data: coupon } = await retrieveCoupon('coupon_xxx');
console.log(`${coupon.name}: ${coupon.percent_off}% off`);
console.log(`Redemptions: ${coupon.times_redeemed}/${coupon.max_redemptions || 'unlimited'}`);

// Delete a coupon (existing discounts remain active)
await deleteCoupon('coupon_xxx');

// List promotion codes for a coupon
const { data: promos } = await listPromotionCodes({
  couponId: 'coupon_xxx',
  active: true,
});
```

---

## Strategy examples

| Strategy | Configuration |
|---|---|
| First month free | `percentOff: 100, duration: 'once'` |
| -20% for 3 months | `percentOff: 20, duration: 'repeating', durationInMonths: 3` |
| -10 EUR on the 1st payment | `amountOff: 1000, duration: 'once'` |
| Referral -50% for life | `percentOff: 50, duration: 'forever'` |
| Limited Black Friday | `percentOff: 30, duration: 'once', redeemBy: timestamp, maxRedemptions: 500` |
