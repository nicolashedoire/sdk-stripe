import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockStripeInstance, type MockStripeInstance } from '../setup';

let mockStripe: MockStripeInstance;

vi.mock('../../src/server/stripe-client', () => ({
  getStripe: () => mockStripe,
  getConfig: () => ({
    secretKey: 'sk_test_mock',
    publishableKey: 'pk_test_mock',
    webhookSecret: 'whsec_test_mock',
  }),
}));

import {
  createProduct,
  retrieveProduct,
  updateProduct,
  archiveProduct,
  listProducts,
  createPrice,
  retrievePrice,
  listPrices,
  archivePrice,
} from '../../src/server/products';

beforeEach(() => {
  mockStripe = createMockStripeInstance();
  vi.clearAllMocks();
});

describe('createProduct', () => {
  it('should create a product with basic info', async () => {
    const mockProduct = { id: 'prod_123', name: 'Plan Pro' };
    mockStripe.products.create.mockResolvedValue(mockProduct);

    const result = await createProduct({ name: 'Plan Pro' });

    expect(result.data).toEqual(mockProduct);
    expect(mockStripe.products.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Plan Pro' })
    );
  });

  it('should create a product with default price', async () => {
    const mockProduct = { id: 'prod_456' };
    mockStripe.products.create.mockResolvedValue(mockProduct);

    await createProduct({
      name: 'Starter',
      description: 'Plan de base',
      defaultPriceData: {
        unitAmount: 900,
        currency: 'eur',
        recurring: { interval: 'month' },
      },
    });

    expect(mockStripe.products.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Starter',
        description: 'Plan de base',
        default_price_data: {
          unit_amount: 900,
          currency: 'eur',
          recurring: { interval: 'month', interval_count: undefined },
        },
      })
    );
  });
});

describe('retrieveProduct', () => {
  it('should retrieve a product', async () => {
    const mockProduct = { id: 'prod_123' };
    mockStripe.products.retrieve.mockResolvedValue(mockProduct);

    const result = await retrieveProduct('prod_123');
    expect(result.data).toEqual(mockProduct);
  });
});

describe('updateProduct', () => {
  it('should update product fields', async () => {
    const mockProduct = { id: 'prod_123', name: 'New Name' };
    mockStripe.products.update.mockResolvedValue(mockProduct);

    const result = await updateProduct({
      productId: 'prod_123',
      name: 'New Name',
      description: 'Updated desc',
    });

    expect(result.data).toEqual(mockProduct);
    expect(mockStripe.products.update).toHaveBeenCalledWith('prod_123',
      expect.objectContaining({ name: 'New Name', description: 'Updated desc' })
    );
  });
});

describe('archiveProduct', () => {
  it('should set active to false', async () => {
    const mockProduct = { id: 'prod_123', active: false };
    mockStripe.products.update.mockResolvedValue(mockProduct);

    const result = await archiveProduct('prod_123');

    expect(result.data!.active).toBe(false);
    expect(mockStripe.products.update).toHaveBeenCalledWith('prod_123', { active: false });
  });
});

describe('listProducts', () => {
  it('should list active products', async () => {
    const mockList = { data: [{ id: 'prod_1' }], has_more: false };
    mockStripe.products.list.mockResolvedValue(mockList);

    const result = await listProducts({ active: true, limit: 20 });

    expect(result.data).toEqual(mockList);
    expect(mockStripe.products.list).toHaveBeenCalledWith(
      expect.objectContaining({ active: true, limit: 20 })
    );
  });
});

// ─── Prices ──────────────────────────────────────────────────────────

describe('createPrice', () => {
  it('should create a one-time price', async () => {
    const mockPrice = { id: 'price_123', unit_amount: 5000 };
    mockStripe.prices.create.mockResolvedValue(mockPrice);

    const result = await createPrice({
      productId: 'prod_abc',
      unitAmount: 5000,
      currency: 'eur',
    });

    expect(result.data).toEqual(mockPrice);
    expect(mockStripe.prices.create).toHaveBeenCalledWith(
      expect.objectContaining({
        product: 'prod_abc',
        unit_amount: 5000,
        currency: 'eur',
        recurring: undefined,
      })
    );
  });

  it('should create a recurring price', async () => {
    const mockPrice = { id: 'price_456' };
    mockStripe.prices.create.mockResolvedValue(mockPrice);

    await createPrice({
      productId: 'prod_abc',
      unitAmount: 2900,
      currency: 'eur',
      recurring: { interval: 'month' },
      lookupKey: 'pro_monthly',
    });

    expect(mockStripe.prices.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recurring: { interval: 'month', interval_count: undefined },
        lookup_key: 'pro_monthly',
      })
    );
  });

  it('should create a tiered price', async () => {
    const mockPrice = { id: 'price_789' };
    mockStripe.prices.create.mockResolvedValue(mockPrice);

    await createPrice({
      productId: 'prod_abc',
      unitAmount: 0,
      currency: 'eur',
      billingScheme: 'tiered',
      tiersMode: 'graduated',
      tiers: [
        { upTo: 10, unitAmount: 1000 },
        { upTo: 'inf' as unknown as number, unitAmount: 800 },
      ],
      recurring: { interval: 'month' },
    });

    expect(mockStripe.prices.create).toHaveBeenCalledWith(
      expect.objectContaining({
        billing_scheme: 'tiered',
        tiers_mode: 'graduated',
        tiers: [
          { up_to: 10, unit_amount: 1000, flat_amount: undefined },
          { up_to: 'inf', unit_amount: 800, flat_amount: undefined },
        ],
      })
    );
  });
});

describe('retrievePrice', () => {
  it('should retrieve a price', async () => {
    const mockPrice = { id: 'price_123' };
    mockStripe.prices.retrieve.mockResolvedValue(mockPrice);

    const result = await retrievePrice('price_123');
    expect(result.data).toEqual(mockPrice);
  });
});

describe('listPrices', () => {
  it('should list prices with filters', async () => {
    const mockList = { data: [], has_more: false };
    mockStripe.prices.list.mockResolvedValue(mockList);

    await listPrices({ productId: 'prod_abc', active: true, type: 'recurring' });

    expect(mockStripe.prices.list).toHaveBeenCalledWith(
      expect.objectContaining({
        product: 'prod_abc',
        active: true,
        type: 'recurring',
      })
    );
  });
});

describe('archivePrice', () => {
  it('should deactivate a price', async () => {
    const mockPrice = { id: 'price_123', active: false };
    mockStripe.prices.update.mockResolvedValue(mockPrice);

    const result = await archivePrice('price_123');

    expect(result.data!.active).toBe(false);
    expect(mockStripe.prices.update).toHaveBeenCalledWith('price_123', { active: false });
  });
});
