'use client';

import { useState, useCallback } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';

interface SetupState {
  isProcessing: boolean;
  isSuccess: boolean;
  error: string | null;
  setupIntentId: string | null;
  paymentMethodId: string | null;
}

interface UseSetupIntentOptions {
  onSuccess?: (setupIntentId: string, paymentMethodId: string) => void;
  onError?: (error: string) => void;
  returnUrl?: string;
}

export function useSetupIntent(options?: UseSetupIntentOptions) {
  const stripe = useStripe();
  const elements = useElements();

  const [state, setState] = useState<SetupState>({
    isProcessing: false,
    isSuccess: false,
    error: null,
    setupIntentId: null,
    paymentMethodId: null,
  });

  const confirmSetup = useCallback(async (
    overrides?: { returnUrl?: string }
  ) => {
    if (!stripe || !elements) {
      setState((s) => ({ ...s, error: 'Stripe not loaded yet' }));
      return { success: false, error: 'Stripe not loaded yet' };
    }

    setState({ isProcessing: true, isSuccess: false, error: null, setupIntentId: null, paymentMethodId: null });

    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: overrides?.returnUrl ?? options?.returnUrl ?? (typeof window !== 'undefined' ? window.location.href : ''),
      },
      redirect: 'if_required',
    });

    if (error) {
      const message = error.message ?? 'Setup failed';
      setState({ isProcessing: false, isSuccess: false, error: message, setupIntentId: null, paymentMethodId: null });
      options?.onError?.(message);
      return { success: false, error: message };
    }

    if (setupIntent?.status === 'succeeded') {
      const pmId = typeof setupIntent.payment_method === 'string'
        ? setupIntent.payment_method
        : setupIntent.payment_method?.id ?? null;
      setState({ isProcessing: false, isSuccess: true, error: null, setupIntentId: setupIntent.id, paymentMethodId: pmId });
      if (pmId) options?.onSuccess?.(setupIntent.id, pmId);
      return { success: true, setupIntentId: setupIntent.id, paymentMethodId: pmId };
    }

    setState({ isProcessing: false, isSuccess: false, error: null, setupIntentId: setupIntent?.id ?? null, paymentMethodId: null });
    return { success: false, status: setupIntent?.status };
  }, [stripe, elements, options]);

  const reset = useCallback(() => {
    setState({ isProcessing: false, isSuccess: false, error: null, setupIntentId: null, paymentMethodId: null });
  }, []);

  return {
    ...state,
    confirmSetup,
    reset,
    isReady: !!stripe && !!elements,
  };
}
