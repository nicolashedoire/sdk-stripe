# Products & Prices

Manage your product catalog and pricing models.

---

## Creating a Product

```ts
import '@/lib/stripe';
import { createProduct } from '@stripe-sdk/core/server';

// Simple product
const { data: product } = await createProduct({
  name: 'Pro Plan',
  description: 'Full access to all features',
  images: ['https://mysite.com/images/pro-plan.png'],
  metadata: { tier: 'pro' },
});

// Product with a default price
const { data: productWithPrice } = await createProduct({
  name: 'Advanced React E-book',
  description: 'Comprehensive 200-page guide',
  defaultPriceData: {
    unitAmount: 2900, // 29.00 EUR
    currency: 'eur',
  },
});

// Product with a recurring price
const { data: subProduct } = await createProduct({
  name: 'Starter Plan',
  defaultPriceData: {
    unitAmount: 900,
    currency: 'eur',
    recurring: { interval: 'month' },
  },
});
```

---

## Creating Prices

```ts
import { createPrice } from '@stripe-sdk/core/server';

// One-time price
await createPrice({
  productId: 'prod_xxx',
  unitAmount: 4900, // 49.00 EUR
  currency: 'eur',
  nickname: 'Standard license',
});

// Monthly price
await createPrice({
  productId: 'prod_xxx',
  unitAmount: 2900,
  currency: 'eur',
  recurring: { interval: 'month' },
  lookupKey: 'pro_monthly',
});

// Annual price (with an implied discount)
await createPrice({
  productId: 'prod_xxx',
  unitAmount: 29000, // 290 EUR/year instead of 348 EUR (12 x 29)
  currency: 'eur',
  recurring: { interval: 'year' },
  lookupKey: 'pro_annual',
});

// Quarterly billing
await createPrice({
  productId: 'prod_xxx',
  unitAmount: 7900,
  currency: 'eur',
  recurring: {
    interval: 'month',
    intervalCount: 3, // Every 3 months
  },
});
```

---

## Tiered Pricing

```ts
import { createPrice } from '@stripe-sdk/core/server';

// Graduated pricing - e.g. API calls
await createPrice({
  productId: 'prod_api',
  unitAmount: 0,
  currency: 'eur',
  billingScheme: 'tiered',
  tiersMode: 'graduated',
  tiers: [
    { upTo: 1000, unitAmount: 0 },        // 0-1,000: free
    { upTo: 10000, unitAmount: 10 },       // 1,001-10,000: 0.10 EUR per call
    { upTo: 'inf' as any, unitAmount: 5 }, // 10,001+: 0.05 EUR per call
  ],
  recurring: { interval: 'month' },
});

// Volume pricing - the price applies to the entire quantity
await createPrice({
  productId: 'prod_seats',
  unitAmount: 0,
  currency: 'eur',
  billingScheme: 'tiered',
  tiersMode: 'volume',
  tiers: [
    { upTo: 5, unitAmount: 1000 },          // 1-5 seats: 10 EUR/seat
    { upTo: 20, unitAmount: 800 },           // 6-20 seats: 8 EUR/seat
    { upTo: 'inf' as any, unitAmount: 500 }, // 21+ seats: 5 EUR/seat
  ],
  recurring: { interval: 'month' },
});
```

---

## Listing Products and Prices

```ts
import { listProducts, listPrices } from '@stripe-sdk/core/server';

// All active products
const { data: products } = await listProducts({ active: true, limit: 100 });

// Prices for a specific product
const { data: prices } = await listPrices({
  productId: 'prod_xxx',
  active: true,
});

// Only recurring prices
const { data: recurringPrices } = await listPrices({
  type: 'recurring',
  active: true,
});

// Only one-time prices
const { data: oneTimePrices } = await listPrices({
  type: 'one_time',
  active: true,
});
```

---

## Updating / Archiving

```ts
import { updateProduct, archiveProduct, archivePrice } from '@stripe-sdk/core/server';

// Update a product
await updateProduct({
  productId: 'prod_xxx',
  name: 'Pro Plan (new)',
  description: 'Updated description',
});

// Archive a product (makes it inactive)
await archiveProduct('prod_xxx');

// Archive a price (prices cannot be deleted)
await archivePrice('price_xxx');
```

---

## Pattern: Dynamic Pricing Page

```tsx
// app/pricing/page.tsx (Server Component)
import '@/lib/stripe';
import { listProducts, listPrices } from '@stripe-sdk/core/server';
import { PricingTable, type PricingPlan } from '@stripe-sdk/core/client';

export default async function PricingPage() {
  // Fetch products and prices from Stripe
  const { data: products } = await listProducts({ active: true });
  const { data: prices } = await listPrices({ active: true, type: 'recurring' });

  // Transform into PricingPlan format
  const plans: PricingPlan[] = products.data
    .map((product) => {
      const price = prices.data.find((p) => p.product === product.id);
      if (!price) return null;

      return {
        id: product.id,
        name: product.name,
        description: product.description || '',
        priceId: price.id,
        amount: price.unit_amount || 0,
        currency: price.currency,
        interval: price.recurring?.interval as 'month' | 'year',
        features: (product.metadata.features || '').split(','),
        highlighted: product.metadata.highlighted === 'true',
        badge: product.metadata.badge || undefined,
      };
    })
    .filter(Boolean) as PricingPlan[];

  return <ClientPricingTable plans={plans} />;
}
```

> **Tip**: Store features in the product metadata (`features: "Feature 1,Feature 2,Feature 3"`) so you can manage them directly from the Stripe Dashboard.
