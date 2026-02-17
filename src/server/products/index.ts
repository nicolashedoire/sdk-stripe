import type Stripe from 'stripe';
import { getStripe } from '../stripe-client';
import { handleStripeError, success } from '../../utils/errors';
import type {
  CreateProductInput,
  UpdateProductInput,
  CreatePriceInput,
  PaginationInput,
  SDKResult,
} from '../../types';

// ─── Products ────────────────────────────────────────────────────────

export async function createProduct(
  input: CreateProductInput
): Promise<SDKResult<Stripe.Product>> {
  try {
    const stripe = getStripe();
    const product = await stripe.products.create({
      name: input.name,
      description: input.description,
      images: input.images,
      metadata: input.metadata,
      active: input.active,
      default_price_data: input.defaultPriceData
        ? {
            unit_amount: input.defaultPriceData.unitAmount,
            currency: input.defaultPriceData.currency,
            recurring: input.defaultPriceData.recurring
              ? {
                  interval: input.defaultPriceData.recurring.interval,
                  interval_count: input.defaultPriceData.recurring.intervalCount,
                }
              : undefined,
          }
        : undefined,
    });
    return success(product);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function retrieveProduct(
  productId: string
): Promise<SDKResult<Stripe.Product>> {
  try {
    const stripe = getStripe();
    const product = await stripe.products.retrieve(productId);
    return success(product);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function updateProduct(
  input: UpdateProductInput
): Promise<SDKResult<Stripe.Product>> {
  try {
    const stripe = getStripe();
    const product = await stripe.products.update(input.productId, {
      name: input.name,
      description: input.description,
      images: input.images,
      metadata: input.metadata,
      active: input.active,
    });
    return success(product);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function archiveProduct(
  productId: string
): Promise<SDKResult<Stripe.Product>> {
  try {
    const stripe = getStripe();
    const product = await stripe.products.update(productId, { active: false });
    return success(product);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function listProducts(
  input?: PaginationInput & { active?: boolean }
): Promise<SDKResult<Stripe.ApiList<Stripe.Product>>> {
  try {
    const stripe = getStripe();
    const products = await stripe.products.list({
      limit: input?.limit ?? 10,
      starting_after: input?.startingAfter,
      ending_before: input?.endingBefore,
      active: input?.active,
    });
    return success(products);
  } catch (error) {
    return handleStripeError(error);
  }
}

// ─── Prices ──────────────────────────────────────────────────────────

export async function createPrice(
  input: CreatePriceInput
): Promise<SDKResult<Stripe.Price>> {
  try {
    const stripe = getStripe();

    const params: Stripe.PriceCreateParams = {
      product: input.productId,
      currency: input.currency,
      metadata: input.metadata,
      active: input.active,
      nickname: input.nickname,
      lookup_key: input.lookupKey,
      billing_scheme: input.billingScheme,
      recurring: input.recurring
        ? {
            interval: input.recurring.interval,
            interval_count: input.recurring.intervalCount,
          }
        : undefined,
    };

    if (input.billingScheme === 'tiered' && input.tiers) {
      if (!input.tiersMode) {
        throw new Error('tiersMode is required when billingScheme is "tiered"');
      }
      params.tiers = input.tiers.map((tier) => ({
        up_to: tier.upTo,
        unit_amount: tier.unitAmount,
        flat_amount: tier.flatAmount,
      }));
      params.tiers_mode = input.tiersMode;
    } else {
      params.unit_amount = input.unitAmount;
    }

    const price = await stripe.prices.create(params);
    return success(price);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function retrievePrice(
  priceId: string
): Promise<SDKResult<Stripe.Price>> {
  try {
    const stripe = getStripe();
    const price = await stripe.prices.retrieve(priceId);
    return success(price);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function listPrices(
  input?: PaginationInput & { productId?: string; active?: boolean; type?: 'one_time' | 'recurring' }
): Promise<SDKResult<Stripe.ApiList<Stripe.Price>>> {
  try {
    const stripe = getStripe();
    const prices = await stripe.prices.list({
      limit: input?.limit ?? 10,
      starting_after: input?.startingAfter,
      ending_before: input?.endingBefore,
      product: input?.productId,
      active: input?.active,
      type: input?.type,
    });
    return success(prices);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function archivePrice(
  priceId: string
): Promise<SDKResult<Stripe.Price>> {
  try {
    const stripe = getStripe();
    const price = await stripe.prices.update(priceId, { active: false });
    return success(price);
  } catch (error) {
    return handleStripeError(error);
  }
}
