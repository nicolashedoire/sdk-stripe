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

export function useCheckout(options: UseCheckoutOptions) {
  const [state, setState] = useState<CheckoutState>({
    isLoading: false,
    error: null,
  });

  /**
   * Redirect to a Stripe Checkout session.
   * Pass the sessionId returned from your server (createCheckoutSession).
   */
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
  }, [options]);

  /**
   * Open a Stripe Customer Portal session.
   * Pass the portal URL returned from your server (createPortalSession).
   */
  const redirectToPortal = useCallback((portalUrl: string) => {
    window.location.href = portalUrl;
  }, []);

  return {
    ...state,
    redirectToCheckout,
    redirectToPortal,
  };
}
