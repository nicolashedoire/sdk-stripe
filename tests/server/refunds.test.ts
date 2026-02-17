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
  createRefund,
  retrieveRefund,
  listRefunds,
  retrieveDispute,
  updateDispute,
  closeDispute,
  listDisputes,
} from '../../src/server/refunds';

beforeEach(() => {
  mockStripe = createMockStripeInstance();
  vi.clearAllMocks();
});

// ─── Refunds ─────────────────────────────────────────────────────────

describe('createRefund', () => {
  it('should create a full refund', async () => {
    const mockRefund = { id: 're_123', status: 'succeeded' };
    mockStripe.refunds.create.mockResolvedValue(mockRefund);

    const result = await createRefund({ paymentIntentId: 'pi_abc' });

    expect(result.data).toEqual(mockRefund);
    expect(mockStripe.refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent: 'pi_abc',
        amount: undefined,
      })
    );
  });

  it('should create a partial refund with reason', async () => {
    const mockRefund = { id: 're_456', amount: 500 };
    mockStripe.refunds.create.mockResolvedValue(mockRefund);

    await createRefund({
      paymentIntentId: 'pi_abc',
      amount: 500,
      reason: 'requested_by_customer',
      metadata: { ticket: 'T-123' },
    });

    expect(mockStripe.refunds.create).toHaveBeenCalledWith({
      payment_intent: 'pi_abc',
      charge: undefined,
      amount: 500,
      reason: 'requested_by_customer',
      metadata: { ticket: 'T-123' },
    });
  });

  it('should refund by charge ID', async () => {
    mockStripe.refunds.create.mockResolvedValue({ id: 're_789' });

    await createRefund({ chargeId: 'ch_abc' });

    expect(mockStripe.refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({ charge: 'ch_abc' })
    );
  });

  it('should handle refund errors', async () => {
    mockStripe.refunds.create.mockRejectedValue({
      type: 'StripeInvalidRequestError',
      message: 'Charge has already been refunded',
      statusCode: 400,
    });

    const result = await createRefund({ paymentIntentId: 'pi_abc' });

    expect(result.data).toBeNull();
    expect(result.error!.message).toBe('Charge has already been refunded');
  });
});

describe('retrieveRefund', () => {
  it('should retrieve a refund', async () => {
    const mockRefund = { id: 're_123' };
    mockStripe.refunds.retrieve.mockResolvedValue(mockRefund);

    const result = await retrieveRefund('re_123');
    expect(result.data).toEqual(mockRefund);
  });
});

describe('listRefunds', () => {
  it('should list refunds for a payment intent', async () => {
    const mockList = { data: [{ id: 're_1' }], has_more: false };
    mockStripe.refunds.list.mockResolvedValue(mockList);

    const result = await listRefunds({ paymentIntentId: 'pi_abc' });

    expect(result.data).toEqual(mockList);
    expect(mockStripe.refunds.list).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: 'pi_abc' })
    );
  });
});

// ─── Disputes ────────────────────────────────────────────────────────

describe('retrieveDispute', () => {
  it('should retrieve a dispute', async () => {
    const mockDispute = { id: 'dp_123', status: 'needs_response' };
    mockStripe.disputes.retrieve.mockResolvedValue(mockDispute);

    const result = await retrieveDispute('dp_123');
    expect(result.data).toEqual(mockDispute);
  });
});

describe('updateDispute', () => {
  it('should submit dispute evidence', async () => {
    const mockDispute = { id: 'dp_123', status: 'under_review' };
    mockStripe.disputes.update.mockResolvedValue(mockDispute);

    const result = await updateDispute({
      disputeId: 'dp_123',
      evidence: {
        customerName: 'John Doe',
        productDescription: 'SaaS subscription',
        customerEmailAddress: 'john@example.com',
      },
      submit: true,
    });

    expect(result.data).toEqual(mockDispute);
    expect(mockStripe.disputes.update).toHaveBeenCalledWith('dp_123', {
      evidence: {
        customer_name: 'John Doe',
        product_description: 'SaaS subscription',
        customer_email_address: 'john@example.com',
        customer_communication: undefined,
        shipping_documentation: undefined,
        service_documentation: undefined,
        uncategorized_text: undefined,
      },
      metadata: undefined,
      submit: true,
    });
  });
});

describe('closeDispute', () => {
  it('should close (accept) a dispute', async () => {
    const mockDispute = { id: 'dp_123', status: 'lost' };
    mockStripe.disputes.close.mockResolvedValue(mockDispute);

    const result = await closeDispute('dp_123');
    expect(result.data).toEqual(mockDispute);
  });
});

describe('listDisputes', () => {
  it('should list disputes', async () => {
    const mockList = { data: [], has_more: false };
    mockStripe.disputes.list.mockResolvedValue(mockList);

    const result = await listDisputes({ limit: 5 });
    expect(result.data).toEqual(mockList);
  });
});
