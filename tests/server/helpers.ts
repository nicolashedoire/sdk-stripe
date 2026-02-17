import { vi } from 'vitest';
import { createMockStripeInstance, type MockStripeInstance } from '../setup';

/**
 * Initializes a mock Stripe instance and injects it into the SDK.
 * Returns the mock so tests can configure return values.
 */
export function setupMockStripe(): MockStripeInstance {
  const mockStripe = createMockStripeInstance();

  // Mock the stripe-client module to return our mock
  vi.doMock('../../src/server/stripe-client', () => ({
    getStripe: () => mockStripe,
    getConfig: () => ({
      secretKey: 'sk_test_mock',
      publishableKey: 'pk_test_mock',
      webhookSecret: 'whsec_test_mock',
    }),
    initStripe: vi.fn(() => mockStripe),
  }));

  return mockStripe;
}
