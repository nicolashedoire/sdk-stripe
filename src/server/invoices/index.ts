import type Stripe from 'stripe';
import { getStripe } from '../stripe-client';
import { handleStripeError, success } from '../../utils/errors';
import type {
  CreateInvoiceInput,
  CreateInvoiceItemInput,
  PaginationInput,
  SDKResult,
} from '../../types';

export async function createInvoice(
  input: CreateInvoiceInput
): Promise<SDKResult<Stripe.Invoice>> {
  try {
    const stripe = getStripe();
    const invoice = await stripe.invoices.create({
      customer: input.customerId,
      collection_method: input.collectionMethod ?? 'charge_automatically',
      days_until_due: input.daysUntilDue,
      metadata: input.metadata,
      description: input.description,
      auto_advance: input.autoAdvance,
    });
    return success(invoice);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function retrieveInvoice(
  invoiceId: string
): Promise<SDKResult<Stripe.Invoice>> {
  try {
    const stripe = getStripe();
    const invoice = await stripe.invoices.retrieve(invoiceId);
    return success(invoice);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function finalizeInvoice(
  invoiceId: string
): Promise<SDKResult<Stripe.Invoice>> {
  try {
    const stripe = getStripe();
    const invoice = await stripe.invoices.finalizeInvoice(invoiceId);
    return success(invoice);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function sendInvoice(
  invoiceId: string
): Promise<SDKResult<Stripe.Invoice>> {
  try {
    const stripe = getStripe();
    const invoice = await stripe.invoices.sendInvoice(invoiceId);
    return success(invoice);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function payInvoice(
  invoiceId: string
): Promise<SDKResult<Stripe.Invoice>> {
  try {
    const stripe = getStripe();
    const invoice = await stripe.invoices.pay(invoiceId);
    return success(invoice);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function voidInvoice(
  invoiceId: string
): Promise<SDKResult<Stripe.Invoice>> {
  try {
    const stripe = getStripe();
    const invoice = await stripe.invoices.voidInvoice(invoiceId);
    return success(invoice);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function listInvoices(
  input?: PaginationInput & { customerId?: string; status?: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void' }
): Promise<SDKResult<Stripe.ApiList<Stripe.Invoice>>> {
  try {
    const stripe = getStripe();
    const invoices = await stripe.invoices.list({
      limit: input?.limit ?? 10,
      starting_after: input?.startingAfter,
      ending_before: input?.endingBefore,
      customer: input?.customerId,
      status: input?.status as Stripe.InvoiceListParams.Status,
    });
    return success(invoices);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function getUpcomingInvoice(
  customerId: string,
  subscriptionId?: string
): Promise<SDKResult<Stripe.UpcomingInvoice>> {
  try {
    const stripe = getStripe();
    const invoice = await stripe.invoices.retrieveUpcoming({
      customer: customerId,
      subscription: subscriptionId,
    });
    return success(invoice);
  } catch (error) {
    return handleStripeError(error);
  }
}

// ─── Invoice Items ───────────────────────────────────────────────────

export async function createInvoiceItem(
  input: CreateInvoiceItemInput
): Promise<SDKResult<Stripe.InvoiceItem>> {
  try {
    const stripe = getStripe();
    const invoiceItem = await stripe.invoiceItems.create({
      customer: input.customerId,
      invoice: input.invoiceId,
      price: input.priceId,
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      quantity: input.quantity,
      metadata: input.metadata,
    });
    return success(invoiceItem);
  } catch (error) {
    return handleStripeError(error);
  }
}
