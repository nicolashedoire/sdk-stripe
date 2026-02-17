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

function validatePublishableKey(key: string): void {
  if (!key || typeof key !== 'string') {
    throw new Error('StripeProvider requires a publishableKey');
  }
  if (key.startsWith('sk_')) {
    throw new Error(
      'StripeProvider received a secret key (sk_*). Use a publishable key (pk_*) instead. ' +
      'Secret keys must NEVER be used on the client side.'
    );
  }
  if (!key.startsWith('pk_')) {
    throw new Error('StripeProvider requires a publishable key starting with "pk_"');
  }
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
  validatePublishableKey(publishableKey);

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
  validatePublishableKey(publishableKey);

  if (!clientSecret || typeof clientSecret !== 'string') {
    throw new Error('StripeElementsProvider requires a clientSecret');
  }

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
