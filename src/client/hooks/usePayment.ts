'use client';

import { useState, useCallback } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';

interface PaymentState {
  isProcessing: boolean;
  isSuccess: boolean;
  error: string | null;
  paymentIntentId: string | null;
}

interface UsePaymentOptions {
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
  returnUrl?: string;
}

export function usePayment(options?: UsePaymentOptions) {
  const stripe = useStripe();
  const elements = useElements();

  const [state, setState] = useState<PaymentState>({
    isProcessing: false,
    isSuccess: false,
    error: null,
    paymentIntentId: null,
  });

  const processPayment = useCallback(async (
    overrides?: { returnUrl?: string }
  ) => {
    if (!stripe || !elements) {
      setState((s) => ({ ...s, error: 'Stripe not loaded yet' }));
      return { success: false, error: 'Stripe not loaded yet' };
    }

    setState({ isProcessing: true, isSuccess: false, error: null, paymentIntentId: null });

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: overrides?.returnUrl ?? options?.returnUrl ?? (typeof window !== 'undefined' ? window.location.href : ''),
      },
      redirect: 'if_required',
    });

    if (error) {
      const message = error.message ?? 'Payment failed';
      setState({ isProcessing: false, isSuccess: false, error: message, paymentIntentId: null });
      options?.onError?.(message);
      return { success: false, error: message };
    }

    if (paymentIntent?.status === 'succeeded') {
      setState({ isProcessing: false, isSuccess: true, error: null, paymentIntentId: paymentIntent.id });
      options?.onSuccess?.(paymentIntent.id);
      return { success: true, paymentIntentId: paymentIntent.id };
    }

    setState({ isProcessing: false, isSuccess: false, error: null, paymentIntentId: paymentIntent?.id ?? null });
    return { success: false, status: paymentIntent?.status };
  }, [stripe, elements, options]);

  const reset = useCallback(() => {
    setState({ isProcessing: false, isSuccess: false, error: null, paymentIntentId: null });
  }, []);

  return {
    ...state,
    processPayment,
    reset,
    isReady: !!stripe && !!elements,
  };
}
