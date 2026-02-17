'use client';

import { useState, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';

interface CheckoutState {
  isLoading: boolean;
  error: string | null;
}

interface UseCheckoutOptions {
  publishableKey: string;
  onError?: (error: string) => void;
}

function isValidStripeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith('.stripe.com') && parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function useCheckout(options: UseCheckoutOptions) {
  const [state, setState] = useState<CheckoutState>({
    isLoading: false,
    error: null,
  });

  const redirectToCheckout = useCallback(async (sessionId: string) => {
    setState({ isLoading: true, error: null });

    try {
      const stripe = await loadStripe(options.publishableKey);
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        const message = error.message ?? 'Redirect to checkout failed';
        setState({ isLoading: false, error: message });
        options.onError?.(message);
        return { success: false, error: message };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setState({ isLoading: false, error: message });
      options.onError?.(message);
      return { success: false, error: message };
    }
  }, [options.publishableKey, options.onError]);

  const redirectToPortal = useCallback((portalUrl: string) => {
    if (!isValidStripeUrl(portalUrl)) {
      throw new Error('Invalid portal URL: must be a valid stripe.com HTTPS URL');
    }
    window.location.href = portalUrl;
  }, []);

  return {
    ...state,
    redirectToCheckout,
    redirectToPortal,
  };
}
