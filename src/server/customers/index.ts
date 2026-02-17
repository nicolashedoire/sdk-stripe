import type Stripe from 'stripe';
import { getStripe } from '../stripe-client';
import { handleStripeError, success } from '../../utils/errors';
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  ListCustomersInput,
  CreatePortalSessionInput,
  SDKResult,
} from '../../types';

export async function createCustomer(
  input: CreateCustomerInput
): Promise<SDKResult<Stripe.Customer>> {
  try {
    const stripe = getStripe();
    const customer = await stripe.customers.create({
      email: input.email,
      name: input.name,
      phone: input.phone,
      description: input.description,
      metadata: input.metadata,
      payment_method: input.paymentMethodId,
      invoice_settings: input.paymentMethodId
        ? { default_payment_method: input.paymentMethodId }
        : undefined,
      address: input.address
        ? {
            line1: input.address.line1,
            line2: input.address.line2,
            city: input.address.city,
            state: input.address.state,
            postal_code: input.address.postalCode,
            country: input.address.country,
          }
        : undefined,
    });
    return success(customer);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function retrieveCustomer(
  customerId: string
): Promise<SDKResult<Stripe.Customer>> {
  try {
    const stripe = getStripe();
    const customer = await stripe.customers.retrieve(customerId, {
      expand: ['subscriptions', 'sources'],
    });
    if (customer.deleted) {
      return {
        data: null,
        error: { message: 'Customer has been deleted', type: 'invalid_request_error' },
      };
    }
    return success(customer as Stripe.Customer);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function updateCustomer(
  input: UpdateCustomerInput
): Promise<SDKResult<Stripe.Customer>> {
  try {
    const stripe = getStripe();
    const customer = await stripe.customers.update(input.customerId, {
      email: input.email,
      name: input.name,
      phone: input.phone,
      description: input.description,
      metadata: input.metadata,
      invoice_settings: input.defaultPaymentMethodId
        ? { default_payment_method: input.defaultPaymentMethodId }
        : undefined,
      address: input.address
        ? {
            line1: input.address.line1,
            line2: input.address.line2,
            city: input.address.city,
            state: input.address.state,
            postal_code: input.address.postalCode,
            country: input.address.country,
          }
        : undefined,
    });
    return success(customer);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function deleteCustomer(
  customerId: string
): Promise<SDKResult<Stripe.DeletedCustomer>> {
  try {
    const stripe = getStripe();
    const deleted = await stripe.customers.del(customerId);
    return success(deleted);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function listCustomers(
  input?: ListCustomersInput
): Promise<SDKResult<Stripe.ApiList<Stripe.Customer>>> {
  try {
    const stripe = getStripe();
    const customers = await stripe.customers.list({
      limit: input?.limit ?? 10,
      starting_after: input?.startingAfter,
      ending_before: input?.endingBefore,
      email: input?.email,
    });
    return success(customers);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function searchCustomers(
  query: string,
  limit?: number
): Promise<SDKResult<Stripe.ApiSearchResult<Stripe.Customer>>> {
  try {
    const stripe = getStripe();
    const customers = await stripe.customers.search({
      query,
      limit: limit ?? 10,
    });
    return success(customers);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function createPortalSession(
  input: CreatePortalSessionInput
): Promise<SDKResult<Stripe.BillingPortal.Session>> {
  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: input.customerId,
      return_url: input.returnUrl,
      configuration: input.configuration,
    });
    return success(session);
  } catch (error) {
    return handleStripeError(error);
  }
}
