import type Stripe from 'stripe';
import { getStripe } from '../stripe-client';
import { handleStripeError, success } from '../../utils/errors';
import type {
  CreateConnectAccountInput,
  CreateAccountLinkInput,
  CreateTransferInput,
  PaginationInput,
  SDKResult,
} from '../../types';

// ─── Connected Accounts ──────────────────────────────────────────────

export async function createConnectAccount(
  input: CreateConnectAccountInput
): Promise<SDKResult<Stripe.Account>> {
  try {
    const stripe = getStripe();
    const account = await stripe.accounts.create({
      type: input.type,
      country: input.country,
      email: input.email,
      capabilities: input.capabilities,
      business_type: input.businessType,
      metadata: input.metadata,
    });
    return success(account);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function retrieveConnectAccount(
  accountId: string
): Promise<SDKResult<Stripe.Account>> {
  try {
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(accountId);
    return success(account);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function deleteConnectAccount(
  accountId: string
): Promise<SDKResult<Stripe.DeletedAccount>> {
  try {
    const stripe = getStripe();
    const deleted = await stripe.accounts.del(accountId);
    return success(deleted);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function listConnectAccounts(
  input?: PaginationInput
): Promise<SDKResult<Stripe.ApiList<Stripe.Account>>> {
  try {
    const stripe = getStripe();
    const accounts = await stripe.accounts.list({
      limit: input?.limit ?? 10,
      starting_after: input?.startingAfter,
      ending_before: input?.endingBefore,
    });
    return success(accounts);
  } catch (error) {
    return handleStripeError(error);
  }
}

// ─── Account Links (Onboarding) ─────────────────────────────────────

export async function createAccountLink(
  input: CreateAccountLinkInput
): Promise<SDKResult<Stripe.AccountLink>> {
  try {
    const stripe = getStripe();
    const accountLink = await stripe.accountLinks.create({
      account: input.accountId,
      refresh_url: input.refreshUrl,
      return_url: input.returnUrl,
      type: input.type,
    });
    return success(accountLink);
  } catch (error) {
    return handleStripeError(error);
  }
}

// ─── Transfers ───────────────────────────────────────────────────────

export async function createTransfer(
  input: CreateTransferInput
): Promise<SDKResult<Stripe.Transfer>> {
  try {
    const stripe = getStripe();
    const transfer = await stripe.transfers.create({
      amount: input.amount,
      currency: input.currency,
      destination: input.destinationAccountId,
      description: input.description,
      metadata: input.metadata,
      source_transaction: input.sourceTransaction,
    });
    return success(transfer);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function listTransfers(
  input?: PaginationInput & { destinationAccountId?: string }
): Promise<SDKResult<Stripe.ApiList<Stripe.Transfer>>> {
  try {
    const stripe = getStripe();
    const transfers = await stripe.transfers.list({
      limit: input?.limit ?? 10,
      starting_after: input?.startingAfter,
      ending_before: input?.endingBefore,
      destination: input?.destinationAccountId,
    });
    return success(transfers);
  } catch (error) {
    return handleStripeError(error);
  }
}

// ─── Payouts ─────────────────────────────────────────────────────────

export async function createPayout(
  amount: number,
  currency: string,
  metadata?: Record<string, string>
): Promise<SDKResult<Stripe.Payout>> {
  try {
    const stripe = getStripe();
    const payout = await stripe.payouts.create({
      amount,
      currency,
      metadata,
    });
    return success(payout);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function listPayouts(
  input?: PaginationInput & { status?: 'paid' | 'pending' | 'in_transit' | 'canceled' | 'failed' }
): Promise<SDKResult<Stripe.ApiList<Stripe.Payout>>> {
  try {
    const stripe = getStripe();
    const payouts = await stripe.payouts.list({
      limit: input?.limit ?? 10,
      starting_after: input?.startingAfter,
      ending_before: input?.endingBefore,
      status: input?.status,
    });
    return success(payouts);
  } catch (error) {
    return handleStripeError(error);
  }
}

// ─── Balance ─────────────────────────────────────────────────────────

export async function getBalance(): Promise<SDKResult<Stripe.Balance>> {
  try {
    const stripe = getStripe();
    const balance = await stripe.balance.retrieve();
    return success(balance);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function listBalanceTransactions(
  input?: PaginationInput & { type?: 'charge' | 'refund' | 'adjustment' | 'application_fee' | 'transfer' | 'payout' | 'stripe_fee' }
): Promise<SDKResult<Stripe.ApiList<Stripe.BalanceTransaction>>> {
  try {
    const stripe = getStripe();
    const transactions = await stripe.balanceTransactions.list({
      limit: input?.limit ?? 10,
      starting_after: input?.startingAfter,
      ending_before: input?.endingBefore,
      type: input?.type,
    });
    return success(transactions);
  } catch (error) {
    return handleStripeError(error);
  }
}
