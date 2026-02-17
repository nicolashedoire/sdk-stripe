# Produits & Prix

Gerez votre catalogue de produits et vos modeles de tarification.

---

## Creer un produit

```ts
import '@/lib/stripe';
import { createProduct } from '@stripe-sdk/core/server';

// Produit simple
const { data: product } = await createProduct({
  name: 'Plan Pro',
  description: 'Acces complet a toutes les fonctionnalites',
  images: ['https://monsite.com/images/pro-plan.png'],
  metadata: { tier: 'pro' },
});

// Produit avec prix par defaut
const { data: productWithPrice } = await createProduct({
  name: 'E-book React Avance',
  description: 'Guide complet de 200 pages',
  defaultPriceData: {
    unitAmount: 2900, // 29.00 EUR
    currency: 'eur',
  },
});

// Produit avec prix recurrent
const { data: subProduct } = await createProduct({
  name: 'Plan Starter',
  defaultPriceData: {
    unitAmount: 900,
    currency: 'eur',
    recurring: { interval: 'month' },
  },
});
```

---

## Creer des prix

```ts
import { createPrice } from '@stripe-sdk/core/server';

// Prix unique (one-time)
await createPrice({
  productId: 'prod_xxx',
  unitAmount: 4900, // 49.00 EUR
  currency: 'eur',
  nickname: 'Licence standard',
});

// Prix mensuel
await createPrice({
  productId: 'prod_xxx',
  unitAmount: 2900,
  currency: 'eur',
  recurring: { interval: 'month' },
  lookupKey: 'pro_monthly',
});

// Prix annuel (avec reduction implicite)
await createPrice({
  productId: 'prod_xxx',
  unitAmount: 29000, // 290 EUR/an au lieu de 348 EUR (12 x 29)
  currency: 'eur',
  recurring: { interval: 'year' },
  lookupKey: 'pro_annual',
});

// Prix avec facturation trimestrielle
await createPrice({
  productId: 'prod_xxx',
  unitAmount: 7900,
  currency: 'eur',
  recurring: {
    interval: 'month',
    intervalCount: 3, // Tous les 3 mois
  },
});
```

---

## Tarification par paliers (tiered)

```ts
import { createPrice } from '@stripe-sdk/core/server';

// Tarification progressive (graduated) - API calls par exemple
await createPrice({
  productId: 'prod_api',
  unitAmount: 0,
  currency: 'eur',
  billingScheme: 'tiered',
  tiersMode: 'graduated',
  tiers: [
    { upTo: 1000, unitAmount: 0 },        // 0-1000 : gratuit
    { upTo: 10000, unitAmount: 10 },       // 1001-10000 : 0.10 EUR / appel
    { upTo: 'inf' as any, unitAmount: 5 }, // 10001+ : 0.05 EUR / appel
  ],
  recurring: { interval: 'month' },
});

// Tarification par volume - le prix s'applique a toute la quantite
await createPrice({
  productId: 'prod_seats',
  unitAmount: 0,
  currency: 'eur',
  billingScheme: 'tiered',
  tiersMode: 'volume',
  tiers: [
    { upTo: 5, unitAmount: 1000 },          // 1-5 sieges : 10 EUR/siege
    { upTo: 20, unitAmount: 800 },           // 6-20 sieges : 8 EUR/siege
    { upTo: 'inf' as any, unitAmount: 500 }, // 21+ sieges : 5 EUR/siege
  ],
  recurring: { interval: 'month' },
});
```

---

## Lister les produits et prix

```ts
import { listProducts, listPrices } from '@stripe-sdk/core/server';

// Tous les produits actifs
const { data: products } = await listProducts({ active: true, limit: 100 });

// Prix d'un produit specifique
const { data: prices } = await listPrices({
  productId: 'prod_xxx',
  active: true,
});

// Uniquement les prix recurrents
const { data: recurringPrices } = await listPrices({
  type: 'recurring',
  active: true,
});

// Uniquement les prix uniques
const { data: oneTimePrices } = await listPrices({
  type: 'one_time',
  active: true,
});
```

---

## Mettre a jour / Archiver

```ts
import { updateProduct, archiveProduct, archivePrice } from '@stripe-sdk/core/server';

// Mettre a jour un produit
await updateProduct({
  productId: 'prod_xxx',
  name: 'Plan Pro (nouveau)',
  description: 'Description mise a jour',
});

// Archiver un produit (le rend inactif)
await archiveProduct('prod_xxx');

// Archiver un prix (les prix ne peuvent pas etre supprimes)
await archivePrice('price_xxx');
```

---

## Pattern : Page de tarification dynamique

```tsx
// app/pricing/page.tsx (Server Component)
import '@/lib/stripe';
import { listProducts, listPrices } from '@stripe-sdk/core/server';
import { PricingTable, type PricingPlan } from '@stripe-sdk/core/client';

export default async function PricingPage() {
  // Recuperer les produits et prix depuis Stripe
  const { data: products } = await listProducts({ active: true });
  const { data: prices } = await listPrices({ active: true, type: 'recurring' });

  // Transformer en format PricingPlan
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

> **Astuce** : Stockez les features dans les metadata du produit (`features: "Feature 1,Feature 2,Feature 3"`) pour les gerer depuis le Dashboard Stripe.
