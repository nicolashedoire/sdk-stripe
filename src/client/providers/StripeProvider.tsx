'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import type { Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import type { ReactNode } from 'react';

interface StripeContextValue {
  publishableKey: string;
}

const StripeContext = createContext<StripeContextValue | null>(null);

export function useStripeConfig(): StripeContextValue {
  const context = useContext(StripeContext);
  if (!context) {
    throw new Error('useStripeConfig must be used within a <StripeProvider>');
  }
  return context;
}

export interface StripeProviderProps {
  publishableKey: string;
  children: ReactNode;
  options?: StripeElementsOptions;
  locale?: string;
}

export function StripeProvider({
  publishableKey,
  children,
  options,
  locale,
}: StripeProviderProps) {
  const stripePromise = useMemo(
    () => loadStripe(publishableKey, locale ? { locale: locale as 'auto' } : undefined),
    [publishableKey, locale]
  );

  return (
    <StripeContext.Provider value={{ publishableKey }}>
      <Elements stripe={stripePromise} options={options}>
        {children}
      </Elements>
    </StripeContext.Provider>
  );
}

/**
 * Provider for embedding Stripe Elements with a client secret.
 * Use this to wrap payment forms after creating a PaymentIntent or SetupIntent.
 */
export interface StripeElementsProviderProps {
  publishableKey: string;
  clientSecret: string;
  children: ReactNode;
  appearance?: StripeElementsOptions['appearance'];
  locale?: string;
  loader?: 'auto' | 'always' | 'never';
}

export function StripeElementsProvider({
  publishableKey,
  clientSecret,
  children,
  appearance,
  locale,
  loader = 'auto',
}: StripeElementsProviderProps) {
  const stripePromise = useMemo(
    () => loadStripe(publishableKey, locale ? { locale: locale as 'auto' } : undefined),
    [publishableKey, locale]
  );

  const options: StripeElementsOptions = useMemo(
    () => ({
      clientSecret,
      appearance,
      loader,
    }),
    [clientSecret, appearance, loader]
  );

  return (
    <StripeContext.Provider value={{ publishableKey }}>
      <Elements stripe={stripePromise} options={options}>
        {children}
      </Elements>
    </StripeContext.Provider>
  );
}
