import type Stripe from 'stripe';
import { getStripe } from '../stripe-client';
import { handleStripeError, success } from '../../utils/errors';
import { validateStripeId, validateAmount, validateCurrency, validateUrl, validateMetadata, sanitizeLimit } from '../../utils/validators';
import type {
  CreateConnectAccountInput,
  CreateAccountLinkInput,
  CreateTransferInput,
  PaginationInput,
  SDKResult,
} from '../../types';

// ─── Connected Accounts ──────────────────────────────────────────────

export async function createConnectAccount(
  input: CreateConnectAccountInput,
  options?: { idempotencyKey?: string }
): Promise<SDKResult<Stripe.Account>> {
  try {
    if (input.metadata) validateMetadata(input.metadata);

    const stripe = getStripe();
    const account = await stripe.accounts.create(
      {
        type: input.type,
        country: input.country,
        email: input.email,
        capabilities: input.capabilities,
        business_type: input.businessType,
        metadata: input.metadata,
      },
      options?.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined
    );
    return success(account);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function retrieveConnectAccount(
  accountId: string
): Promise<SDKResult<Stripe.Account>> {
  try {
    validateStripeId(accountId, 'account');
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
    validateStripeId(accountId, 'account');
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
      limit: sanitizeLimit(input?.limit),
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
    validateStripeId(input.accountId, 'account');
    validateUrl(input.refreshUrl, 'refreshUrl');
    validateUrl(input.returnUrl, 'returnUrl');

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
  input: CreateTransferInput,
  options?: { idempotencyKey?: string }
): Promise<SDKResult<Stripe.Transfer>> {
  try {
    validateAmount(input.amount, 'transfer amount');
    validateCurrency(input.currency);
    validateStripeId(input.destinationAccountId, 'account');
    if (input.metadata) validateMetadata(input.metadata);

    const stripe = getStripe();
    const transfer = await stripe.transfers.create(
      {
        amount: input.amount,
        currency: input.currency,
        destination: input.destinationAccountId,
        description: input.description,
        metadata: input.metadata,
        source_transaction: input.sourceTransaction,
      },
      options?.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined
    );
    return success(transfer);
  } catch (error) {
    return handleStripeError(error);
  }
}

export async function listTransfers(
  input?: PaginationInput & { destinationAccountId?: string }
): Promise<SDKResult<Stripe.ApiList<Stripe.Transfer>>> {
  try {
    if (input?.destinationAccountId) validateStripeId(input.destinationAccountId, 'account');
    const stripe = getStripe();
    const transfers = await stripe.transfers.list({
      limit: sanitizeLimit(input?.limit),
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
  metadata?: Record<string, string>,
  options?: { idempotencyKey?: string }
): Promise<SDKResult<Stripe.Payout>> {
  try {
    validateAmount(amount, 'payout amount');
    const normalizedCurrency = validateCurrency(currency);
    if (metadata) validateMetadata(metadata);

    const stripe = getStripe();
    const payout = await stripe.payouts.create(
      {
        amount,
        currency: normalizedCurrency,
        metadata,
      },
      options?.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined
    );
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
      limit: sanitizeLimit(input?.limit),
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
      limit: sanitizeLimit(input?.limit),
      starting_after: input?.startingAfter,
      ending_before: input?.endingBefore,
      type: input?.type,
    });
    return success(transactions);
  } catch (error) {
    return handleStripeError(error);
  }
}
