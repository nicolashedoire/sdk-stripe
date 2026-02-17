import { vi } from 'vitest';

// Mock Stripe constructor
const createMockStripeInstance = () => ({
  paymentIntents: {
    create: vi.fn(),
    retrieve: vi.fn(),
    confirm: vi.fn(),
    cancel: vi.fn(),
    list: vi.fn(),
  },
  checkout: {
    sessions: {
      create: vi.fn(),
      retrieve: vi.fn(),
      list: vi.fn(),
    },
  },
  paymentLinks: {
    create: vi.fn(),
    retrieve: vi.fn(),
  },
  setupIntents: {
    create: vi.fn(),
    retrieve: vi.fn(),
  },
  paymentMethods: {
    list: vi.fn(),
    attach: vi.fn(),
    detach: vi.fn(),
  },
  customers: {
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
    del: vi.fn(),
    list: vi.fn(),
    search: vi.fn(),
  },
  billingPortal: {
    sessions: {
      create: vi.fn(),
    },
  },
  subscriptions: {
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
    cancel: vi.fn(),
    list: vi.fn(),
  },
  products: {
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
    list: vi.fn(),
  },
  prices: {
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
    list: vi.fn(),
  },
  invoices: {
    create: vi.fn(),
    retrieve: vi.fn(),
    finalizeInvoice: vi.fn(),
    sendInvoice: vi.fn(),
    pay: vi.fn(),
    voidInvoice: vi.fn(),
    list: vi.fn(),
    retrieveUpcoming: vi.fn(),
  },
  invoiceItems: {
    create: vi.fn(),
  },
  refunds: {
    create: vi.fn(),
    retrieve: vi.fn(),
    list: vi.fn(),
  },
  disputes: {
    retrieve: vi.fn(),
    update: vi.fn(),
    close: vi.fn(),
    list: vi.fn(),
  },
  accounts: {
    create: vi.fn(),
    retrieve: vi.fn(),
    del: vi.fn(),
    list: vi.fn(),
  },
  accountLinks: {
    create: vi.fn(),
  },
  transfers: {
    create: vi.fn(),
    list: vi.fn(),
  },
  payouts: {
    create: vi.fn(),
    list: vi.fn(),
  },
  balance: {
    retrieve: vi.fn(),
  },
  balanceTransactions: {
    list: vi.fn(),
  },
  coupons: {
    create: vi.fn(),
    retrieve: vi.fn(),
    del: vi.fn(),
    list: vi.fn(),
  },
  promotionCodes: {
    create: vi.fn(),
    retrieve: vi.fn(),
    list: vi.fn(),
  },
  webhooks: {
    constructEvent: vi.fn(),
  },
});

export type MockStripeInstance = ReturnType<typeof createMockStripeInstance>;

// Export factory for tests
export { createMockStripeInstance };
