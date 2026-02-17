import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock @stripe/react-stripe-js
const mockConfirmPayment = vi.fn();
const mockConfirmSetup = vi.fn();

vi.mock('@stripe/react-stripe-js', () => ({
  useStripe: () => ({
    confirmPayment: mockConfirmPayment,
    confirmSetup: mockConfirmSetup,
  }),
  useElements: () => ({}),
}));

// Mock @stripe/stripe-js
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn().mockResolvedValue({
    redirectToCheckout: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

import { usePayment } from '../../src/client/hooks/usePayment';
import { useSetupIntent } from '../../src/client/hooks/useSetupIntent';
import { useCheckout } from '../../src/client/hooks/useCheckout';

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── usePayment ──────────────────────────────────────────────────────

describe('usePayment', () => {
  it('should initialize with correct defaults', () => {
    const { result } = renderHook(() => usePayment());

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.paymentIntentId).toBeNull();
    expect(result.current.isReady).toBe(true);
  });

  it('should handle successful payment', async () => {
    const onSuccess = vi.fn();
    mockConfirmPayment.mockResolvedValue({
      error: null,
      paymentIntent: { id: 'pi_123', status: 'succeeded' },
    });

    const { result } = renderHook(() => usePayment({ onSuccess }));

    let paymentResult: unknown;
    await act(async () => {
      paymentResult = await result.current.processPayment();
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.paymentIntentId).toBe('pi_123');
    expect(result.current.error).toBeNull();
    expect(onSuccess).toHaveBeenCalledWith('pi_123');
    expect((paymentResult as { success: boolean }).success).toBe(true);
  });

  it('should handle payment error', async () => {
    const onError = vi.fn();
    mockConfirmPayment.mockResolvedValue({
      error: { message: 'Your card was declined.' },
      paymentIntent: null,
    });

    const { result } = renderHook(() => usePayment({ onError }));

    await act(async () => {
      await result.current.processPayment();
    });

    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBe('Your card was declined.');
    expect(onError).toHaveBeenCalledWith('Your card was declined.');
  });

  it('should handle requires_action status', async () => {
    mockConfirmPayment.mockResolvedValue({
      error: null,
      paymentIntent: { id: 'pi_456', status: 'requires_action' },
    });

    const { result } = renderHook(() => usePayment());

    let paymentResult: unknown;
    await act(async () => {
      paymentResult = await result.current.processPayment();
    });

    expect(result.current.isSuccess).toBe(false);
    expect((paymentResult as { status: string }).status).toBe('requires_action');
  });

  it('should reset state', async () => {
    mockConfirmPayment.mockResolvedValue({
      error: { message: 'Error' },
      paymentIntent: null,
    });

    const { result } = renderHook(() => usePayment());

    await act(async () => {
      await result.current.processPayment();
    });

    expect(result.current.error).toBe('Error');

    act(() => {
      result.current.reset();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isProcessing).toBe(false);
  });

  it('should pass returnUrl to confirmPayment', async () => {
    mockConfirmPayment.mockResolvedValue({
      error: null,
      paymentIntent: { id: 'pi_789', status: 'succeeded' },
    });

    const { result } = renderHook(() =>
      usePayment({ returnUrl: 'https://example.com/return' })
    );

    await act(async () => {
      await result.current.processPayment();
    });

    expect(mockConfirmPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmParams: { return_url: 'https://example.com/return' },
      })
    );
  });
});

// ─── useSetupIntent ──────────────────────────────────────────────────

describe('useSetupIntent', () => {
  it('should initialize with correct defaults', () => {
    const { result } = renderHook(() => useSetupIntent());

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.setupIntentId).toBeNull();
    expect(result.current.paymentMethodId).toBeNull();
  });

  it('should handle successful setup', async () => {
    const onSuccess = vi.fn();
    mockConfirmSetup.mockResolvedValue({
      error: null,
      setupIntent: { id: 'seti_123', status: 'succeeded', payment_method: 'pm_abc' },
    });

    const { result } = renderHook(() => useSetupIntent({ onSuccess }));

    await act(async () => {
      await result.current.confirmSetup();
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.setupIntentId).toBe('seti_123');
    expect(result.current.paymentMethodId).toBe('pm_abc');
    expect(onSuccess).toHaveBeenCalledWith('seti_123', 'pm_abc');
  });

  it('should handle setup error', async () => {
    const onError = vi.fn();
    mockConfirmSetup.mockResolvedValue({
      error: { message: 'Setup failed' },
      setupIntent: null,
    });

    const { result } = renderHook(() => useSetupIntent({ onError }));

    await act(async () => {
      await result.current.confirmSetup();
    });

    expect(result.current.error).toBe('Setup failed');
    expect(onError).toHaveBeenCalledWith('Setup failed');
  });

  it('should handle payment_method as object', async () => {
    mockConfirmSetup.mockResolvedValue({
      error: null,
      setupIntent: {
        id: 'seti_456',
        status: 'succeeded',
        payment_method: { id: 'pm_xyz' },
      },
    });

    const { result } = renderHook(() => useSetupIntent());

    await act(async () => {
      await result.current.confirmSetup();
    });

    expect(result.current.paymentMethodId).toBe('pm_xyz');
  });
});

// ─── useCheckout ─────────────────────────────────────────────────────

describe('useCheckout', () => {
  it('should initialize with correct defaults', () => {
    const { result } = renderHook(() =>
      useCheckout({ publishableKey: 'pk_test_123' })
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should have redirectToCheckout function', () => {
    const { result } = renderHook(() =>
      useCheckout({ publishableKey: 'pk_test_123' })
    );

    expect(typeof result.current.redirectToCheckout).toBe('function');
  });

  it('should have redirectToPortal function', () => {
    const { result } = renderHook(() =>
      useCheckout({ publishableKey: 'pk_test_123' })
    );

    expect(typeof result.current.redirectToPortal).toBe('function');
  });
});
