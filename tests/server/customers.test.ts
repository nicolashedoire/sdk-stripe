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
  createCustomer,
  retrieveCustomer,
  updateCustomer,
  deleteCustomer,
  listCustomers,
  searchCustomers,
  createPortalSession,
} from '../../src/server/customers';

beforeEach(() => {
  mockStripe = createMockStripeInstance();
  vi.clearAllMocks();
});

describe('createCustomer', () => {
  it('should create a customer with basic info', async () => {
    const mockCustomer = { id: 'cus_123', email: 'john@example.com', name: 'John' };
    mockStripe.customers.create.mockResolvedValue(mockCustomer);

    const result = await createCustomer({
      email: 'john@example.com',
      name: 'John',
    });

    expect(result.data).toEqual(mockCustomer);
    expect(result.error).toBeNull();
    expect(mockStripe.customers.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'john@example.com',
        name: 'John',
      })
    );
  });

  it('should create a customer with address and payment method', async () => {
    const mockCustomer = { id: 'cus_456' };
    mockStripe.customers.create.mockResolvedValue(mockCustomer);

    await createCustomer({
      email: 'jane@example.com',
      name: 'Jane',
      phone: '+33612345678',
      paymentMethodId: 'pm_abc',
      metadata: { userId: 'usr_123' },
      address: {
        line1: '10 rue de Paris',
        city: 'Paris',
        postalCode: '75001',
        country: 'FR',
      },
    });

    expect(mockStripe.customers.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'jane@example.com',
        phone: '+33612345678',
        payment_method: 'pm_abc',
        invoice_settings: { default_payment_method: 'pm_abc' },
        metadata: { userId: 'usr_123' },
        address: {
          line1: '10 rue de Paris',
          line2: undefined,
          city: 'Paris',
          state: undefined,
          postal_code: '75001',
          country: 'FR',
        },
      })
    );
  });

  it('should handle creation errors', async () => {
    mockStripe.customers.create.mockRejectedValue({
      type: 'StripeInvalidRequestError',
      message: 'Invalid email',
      statusCode: 400,
    });

    const result = await createCustomer({ email: 'invalid' });

    expect(result.data).toBeNull();
    expect(result.error!.message).toBe('Invalid email');
  });
});

describe('retrieveCustomer', () => {
  it('should retrieve a customer with expanded data', async () => {
    const mockCustomer = { id: 'cus_123', email: 'john@example.com', deleted: undefined };
    mockStripe.customers.retrieve.mockResolvedValue(mockCustomer);

    const result = await retrieveCustomer('cus_123');

    expect(result.data).toEqual(mockCustomer);
    expect(mockStripe.customers.retrieve).toHaveBeenCalledWith('cus_123', {
      expand: ['subscriptions', 'sources'],
    });
  });

  it('should return error for deleted customer', async () => {
    mockStripe.customers.retrieve.mockResolvedValue({ id: 'cus_123', deleted: true });

    const result = await retrieveCustomer('cus_123');

    expect(result.data).toBeNull();
    expect(result.error!.message).toBe('Customer has been deleted');
  });
});

describe('updateCustomer', () => {
  it('should update customer fields', async () => {
    const mockCustomer = { id: 'cus_123', name: 'Jane Doe' };
    mockStripe.customers.update.mockResolvedValue(mockCustomer);

    const result = await updateCustomer({
      customerId: 'cus_123',
      name: 'Jane Doe',
      defaultPaymentMethodId: 'pm_new',
    });

    expect(result.data).toEqual(mockCustomer);
    expect(mockStripe.customers.update).toHaveBeenCalledWith('cus_123',
      expect.objectContaining({
        name: 'Jane Doe',
        invoice_settings: { default_payment_method: 'pm_new' },
      })
    );
  });
});

describe('deleteCustomer', () => {
  it('should delete a customer', async () => {
    const mockDeleted = { id: 'cus_123', deleted: true };
    mockStripe.customers.del.mockResolvedValue(mockDeleted);

    const result = await deleteCustomer('cus_123');

    expect(result.data).toEqual(mockDeleted);
    expect(mockStripe.customers.del).toHaveBeenCalledWith('cus_123');
  });
});

describe('listCustomers', () => {
  it('should list customers with defaults', async () => {
    const mockList = { data: [{ id: 'cus_1' }], has_more: false };
    mockStripe.customers.list.mockResolvedValue(mockList);

    const result = await listCustomers();

    expect(result.data).toEqual(mockList);
    expect(mockStripe.customers.list).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10 })
    );
  });

  it('should filter by email', async () => {
    mockStripe.customers.list.mockResolvedValue({ data: [], has_more: false });

    await listCustomers({ email: 'test@example.com' });

    expect(mockStripe.customers.list).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com' })
    );
  });
});

describe('searchCustomers', () => {
  it('should search customers with query', async () => {
    const mockResults = { data: [{ id: 'cus_1' }], has_more: false };
    mockStripe.customers.search.mockResolvedValue(mockResults);

    const result = await searchCustomers("email:'test@example.com'");

    expect(result.data).toEqual(mockResults);
    expect(mockStripe.customers.search).toHaveBeenCalledWith({
      query: "email:'test@example.com'",
      limit: 10,
    });
  });
});

describe('createPortalSession', () => {
  it('should create a billing portal session', async () => {
    const mockSession = { id: 'bps_123', url: 'https://billing.stripe.com/xxx' };
    mockStripe.billingPortal.sessions.create.mockResolvedValue(mockSession);

    const result = await createPortalSession({
      customerId: 'cus_abc',
      returnUrl: 'https://example.com/account',
    });

    expect(result.data).toEqual(mockSession);
    expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: 'cus_abc',
      return_url: 'https://example.com/account',
      configuration: undefined,
    });
  });
});
