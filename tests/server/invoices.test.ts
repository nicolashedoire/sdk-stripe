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
  createInvoice,
  retrieveInvoice,
  finalizeInvoice,
  sendInvoice,
  payInvoice,
  voidInvoice,
  listInvoices,
  getUpcomingInvoice,
  createInvoiceItem,
} from '../../src/server/invoices';

beforeEach(() => {
  mockStripe = createMockStripeInstance();
  vi.clearAllMocks();
});

describe('createInvoice', () => {
  it('should create an invoice with auto-charge', async () => {
    const mockInvoice = { id: 'in_123', status: 'draft' };
    mockStripe.invoices.create.mockResolvedValue(mockInvoice);

    const result = await createInvoice({ customerId: 'cus_abc' });

    expect(result.data).toEqual(mockInvoice);
    expect(mockStripe.invoices.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_abc',
        collection_method: 'charge_automatically',
      })
    );
  });

  it('should create a send_invoice with due date', async () => {
    mockStripe.invoices.create.mockResolvedValue({ id: 'in_456' });

    await createInvoice({
      customerId: 'cus_abc',
      collectionMethod: 'send_invoice',
      daysUntilDue: 30,
      description: 'Consulting fees',
    });

    expect(mockStripe.invoices.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection_method: 'send_invoice',
        days_until_due: 30,
        description: 'Consulting fees',
      })
    );
  });
});

describe('retrieveInvoice', () => {
  it('should retrieve an invoice', async () => {
    const mockInvoice = { id: 'in_123' };
    mockStripe.invoices.retrieve.mockResolvedValue(mockInvoice);

    const result = await retrieveInvoice('in_123');
    expect(result.data).toEqual(mockInvoice);
  });
});

describe('finalizeInvoice', () => {
  it('should finalize an invoice', async () => {
    const mockInvoice = { id: 'in_123', status: 'open' };
    mockStripe.invoices.finalizeInvoice.mockResolvedValue(mockInvoice);

    const result = await finalizeInvoice('in_123');
    expect(result.data!.status).toBe('open');
  });
});

describe('sendInvoice', () => {
  it('should send an invoice', async () => {
    const mockInvoice = { id: 'in_123' };
    mockStripe.invoices.sendInvoice.mockResolvedValue(mockInvoice);

    const result = await sendInvoice('in_123');
    expect(result.data).toEqual(mockInvoice);
  });
});

describe('payInvoice', () => {
  it('should pay an invoice', async () => {
    const mockInvoice = { id: 'in_123', status: 'paid' };
    mockStripe.invoices.pay.mockResolvedValue(mockInvoice);

    const result = await payInvoice('in_123');
    expect(result.data!.status).toBe('paid');
  });
});

describe('voidInvoice', () => {
  it('should void an invoice', async () => {
    const mockInvoice = { id: 'in_123', status: 'void' };
    mockStripe.invoices.voidInvoice.mockResolvedValue(mockInvoice);

    const result = await voidInvoice('in_123');
    expect(result.data!.status).toBe('void');
  });
});

describe('listInvoices', () => {
  it('should list invoices with filters', async () => {
    const mockList = { data: [{ id: 'in_1' }], has_more: false };
    mockStripe.invoices.list.mockResolvedValue(mockList);

    const result = await listInvoices({ customerId: 'cus_abc', status: 'paid' });

    expect(result.data).toEqual(mockList);
    expect(mockStripe.invoices.list).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_abc', status: 'paid' })
    );
  });
});

describe('getUpcomingInvoice', () => {
  it('should get upcoming invoice for a subscription', async () => {
    const mockInvoice = { amount_due: 2900 };
    mockStripe.invoices.retrieveUpcoming.mockResolvedValue(mockInvoice);

    const result = await getUpcomingInvoice('cus_abc', 'sub_123');

    expect(result.data).toEqual(mockInvoice);
    expect(mockStripe.invoices.retrieveUpcoming).toHaveBeenCalledWith({
      customer: 'cus_abc',
      subscription: 'sub_123',
    });
  });
});

describe('createInvoiceItem', () => {
  it('should create an invoice item', async () => {
    const mockItem = { id: 'ii_123' };
    mockStripe.invoiceItems.create.mockResolvedValue(mockItem);

    const result = await createInvoiceItem({
      customerId: 'cus_abc',
      invoiceId: 'in_123',
      amount: 5000,
      currency: 'eur',
      description: 'Extra service',
    });

    expect(result.data).toEqual(mockItem);
    expect(mockStripe.invoiceItems.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_abc',
        invoice: 'in_123',
        amount: 5000,
        currency: 'eur',
        description: 'Extra service',
      })
    );
  });
});
