import type Stripe from 'stripe';
import { getStripe } from '../stripe-client';
import { handleStripeError, success } from '../../utils/errors';
import { validateStripeId, validateUrl, validateMetadata, sanitizeLimit } from '../../utils/validators';
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  ListCustomersInput,
  CreatePortalSessionInput,
  SDKResult,
} from '../../types';

export async function createCustomer(
  input: CreateCustomerInput,
  options?: { idempotencyKey?: string }
): Promise<SDKResult<Stripe.Customer>> {
  try {
    if (input.paymentMethodId) validateStripeId(input.paymentMethodId, 'paymentMethod');
    if (input.metadata) validateMetadata(input.metadata);

    const stripe = getStripe();
    const customer = await stripe.customers.create(
      {
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
      },
      options?.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined
    );
    return success(customer);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function retrieveCustomer(
  customerId: string
): Promise<SDKResult<Stripe.Customer>> {
  try {
    validateStripeId(customerId, 'customer');
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
    validateStripeId(input.customerId, 'customer');
    if (input.defaultPaymentMethodId) validateStripeId(input.defaultPaymentMethodId, 'paymentMethod');
    if (input.metadata) validateMetadata(input.metadata);

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
    validateStripeId(customerId, 'customer');
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
      limit: sanitizeLimit(input?.limit),
      starting_after: input?.startingAfter,
      ending_before: input?.endingBefore,
      email: input?.email,
    });
    return success(customers);
  } catch (error) {
    return handleStripeError(error);
  }
}

export interface SearchCustomersInput {
  email?: string;
  name?: string;
  phone?: string;
  limit?: number;
}

export async function searchCustomers(
  input: SearchCustomersInput
): Promise<SDKResult<Stripe.ApiSearchResult<Stripe.Customer>>> {
  try {
    const clauses: string[] = [];
    if (input.email) clauses.push(`email:"${input.email.replace(/"/g, '')}"`);
    if (input.name) clauses.push(`name:"${input.name.replace(/"/g, '')}"`);
    if (input.phone) clauses.push(`phone:"${input.phone.replace(/"/g, '')}"`);

    if (clauses.length === 0) {
      return {
        data: null,
        error: { message: 'At least one search field (email, name, phone) is required', type: 'invalid_request_error' },
      };
    }

    const query = clauses.join(' AND ');
    const stripe = getStripe();
    const customers = await stripe.customers.search({
      query,
      limit: sanitizeLimit(input.limit),
    });
    return success(customers);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function createPortalSession(
  input: CreatePortalSessionInput,
  options?: { idempotencyKey?: string }
): Promise<SDKResult<Stripe.BillingPortal.Session>> {
  try {
    validateStripeId(input.customerId, 'customer');
    if (input.returnUrl) validateUrl(input.returnUrl, 'returnUrl');

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create(
      {
        customer: input.customerId,
        return_url: input.returnUrl,
        configuration: input.configuration,
      },
      options?.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined
    );
    return success(session);
  } catch (error) {
    return handleStripeError(error);
  }
}
