'use client';

import React from 'react';
import { PaymentElement, LinkAuthenticationElement } from '@stripe/react-stripe-js';
import { usePayment } from '../hooks/usePayment';
import type { ReactNode, FormEvent } from 'react';

export interface CheckoutFormProps {
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
  returnUrl?: string;
  submitLabel?: string;
  showEmail?: boolean;
  className?: string;
  buttonClassName?: string;
  errorClassName?: string;
  children?: ReactNode;
  layout?: 'tabs' | 'accordion' | 'auto';
}

export function CheckoutForm({
  onSuccess,
  onError,
  returnUrl,
  submitLabel = 'Pay now',
  showEmail = false,
  className,
  buttonClassName,
  errorClassName,
  children,
  layout = 'tabs',
}: CheckoutFormProps) {
  const { processPayment, isProcessing, isSuccess, error, isReady } = usePayment({
    onSuccess,
    onError,
    returnUrl,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await processPayment();
  };

  if (isSuccess) {
    return (
      <div className={className}>
        {children ?? <p>Payment successful!</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {showEmail && <LinkAuthenticationElement />}
      <PaymentElement options={{ layout }} />
      {error && <p className={errorClassName} role="alert">{error}</p>}
      <button
        type="submit"
        disabled={!isReady || isProcessing}
        className={buttonClassName}
      >
        {isProcessing ? 'Processing...' : submitLabel}
      </button>
    </form>
  );
}
