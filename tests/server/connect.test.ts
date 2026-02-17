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
  createConnectAccount,
  retrieveConnectAccount,
  deleteConnectAccount,
  listConnectAccounts,
  createAccountLink,
  createTransfer,
  listTransfers,
  createPayout,
  listPayouts,
  getBalance,
  listBalanceTransactions,
} from '../../src/server/connect';

beforeEach(() => {
  mockStripe = createMockStripeInstance();
  vi.clearAllMocks();
});

// ─── Connected Accounts ──────────────────────────────────────────────

describe('createConnectAccount', () => {
  it('should create an express account', async () => {
    const mockAccount = { id: 'acct_123', type: 'express' };
    mockStripe.accounts.create.mockResolvedValue(mockAccount);

    const result = await createConnectAccount({
      type: 'express',
      email: 'seller@example.com',
      capabilities: {
        cardPayments: { requested: true },
        transfers: { requested: true },
      },
    });

    expect(result.data).toEqual(mockAccount);
    expect(mockStripe.accounts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'express',
        email: 'seller@example.com',
      })
    );
  });

  it('should create a standard account', async () => {
    mockStripe.accounts.create.mockResolvedValue({ id: 'acct_456' });

    await createConnectAccount({ type: 'standard', country: 'FR' });

    expect(mockStripe.accounts.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'standard', country: 'FR' })
    );
  });
});

describe('retrieveConnectAccount', () => {
  it('should retrieve an account', async () => {
    const mockAccount = { id: 'acct_123' };
    mockStripe.accounts.retrieve.mockResolvedValue(mockAccount);

    const result = await retrieveConnectAccount('acct_123');
    expect(result.data).toEqual(mockAccount);
  });
});

describe('deleteConnectAccount', () => {
  it('should delete an account', async () => {
    const mockDeleted = { id: 'acct_123', deleted: true };
    mockStripe.accounts.del.mockResolvedValue(mockDeleted);

    const result = await deleteConnectAccount('acct_123');
    expect(result.data).toEqual(mockDeleted);
  });
});

describe('listConnectAccounts', () => {
  it('should list accounts', async () => {
    const mockList = { data: [{ id: 'acct_1' }], has_more: false };
    mockStripe.accounts.list.mockResolvedValue(mockList);

    const result = await listConnectAccounts({ limit: 5 });
    expect(result.data).toEqual(mockList);
  });
});

// ─── Account Links ───────────────────────────────────────────────────

describe('createAccountLink', () => {
  it('should create an onboarding link', async () => {
    const mockLink = { url: 'https://connect.stripe.com/setup/xxx' };
    mockStripe.accountLinks.create.mockResolvedValue(mockLink);

    const result = await createAccountLink({
      accountId: 'acct_123',
      refreshUrl: 'https://example.com/refresh',
      returnUrl: 'https://example.com/return',
      type: 'account_onboarding',
    });

    expect(result.data).toEqual(mockLink);
    expect(mockStripe.accountLinks.create).toHaveBeenCalledWith({
      account: 'acct_123',
      refresh_url: 'https://example.com/refresh',
      return_url: 'https://example.com/return',
      type: 'account_onboarding',
    });
  });
});

// ─── Transfers ───────────────────────────────────────────────────────

describe('createTransfer', () => {
  it('should create a transfer to connected account', async () => {
    const mockTransfer = { id: 'tr_123', amount: 8000 };
    mockStripe.transfers.create.mockResolvedValue(mockTransfer);

    const result = await createTransfer({
      amount: 8000,
      currency: 'eur',
      destinationAccountId: 'acct_abc',
      description: 'Payout for order #123',
    });

    expect(result.data).toEqual(mockTransfer);
    expect(mockStripe.transfers.create).toHaveBeenCalledWith({
      amount: 8000,
      currency: 'eur',
      destination: 'acct_abc',
      description: 'Payout for order #123',
      metadata: undefined,
      source_transaction: undefined,
    });
  });
});

describe('listTransfers', () => {
  it('should list transfers', async () => {
    const mockList = { data: [], has_more: false };
    mockStripe.transfers.list.mockResolvedValue(mockList);

    const result = await listTransfers({ destinationAccountId: 'acct_abc' });
    expect(result.data).toEqual(mockList);
  });
});

// ─── Payouts ─────────────────────────────────────────────────────────

describe('createPayout', () => {
  it('should create a payout', async () => {
    const mockPayout = { id: 'po_123', amount: 50000 };
    mockStripe.payouts.create.mockResolvedValue(mockPayout);

    const result = await createPayout(50000, 'eur');

    expect(result.data).toEqual(mockPayout);
    expect(mockStripe.payouts.create).toHaveBeenCalledWith({
      amount: 50000,
      currency: 'eur',
      metadata: undefined,
    });
  });
});

describe('listPayouts', () => {
  it('should list payouts with status filter', async () => {
    const mockList = { data: [], has_more: false };
    mockStripe.payouts.list.mockResolvedValue(mockList);

    await listPayouts({ status: 'paid' });

    expect(mockStripe.payouts.list).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'paid' })
    );
  });
});

// ─── Balance ─────────────────────────────────────────────────────────

describe('getBalance', () => {
  it('should retrieve balance', async () => {
    const mockBalance = {
      available: [{ amount: 100000, currency: 'eur' }],
      pending: [{ amount: 5000, currency: 'eur' }],
    };
    mockStripe.balance.retrieve.mockResolvedValue(mockBalance);

    const result = await getBalance();

    expect(result.data).toEqual(mockBalance);
  });
});

describe('listBalanceTransactions', () => {
  it('should list balance transactions', async () => {
    const mockList = { data: [{ id: 'txn_1', type: 'charge' }], has_more: false };
    mockStripe.balanceTransactions.list.mockResolvedValue(mockList);

    const result = await listBalanceTransactions({ type: 'charge', limit: 50 });

    expect(result.data).toEqual(mockList);
    expect(mockStripe.balanceTransactions.list).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'charge', limit: 50 })
    );
  });
});
