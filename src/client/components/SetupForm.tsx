'use client';

import React from 'react';
import { PaymentElement } from '@stripe/react-stripe-js';
import { useSetupIntent } from '../hooks/useSetupIntent';
import type { ReactNode, FormEvent } from 'react';

export interface SetupFormProps {
  onSuccess?: (setupIntentId: string, paymentMethodId: string) => void;
  onError?: (error: string) => void;
  returnUrl?: string;
  submitLabel?: string;
  className?: string;
  buttonClassName?: string;
  errorClassName?: string;
  successContent?: ReactNode;
  layout?: 'tabs' | 'accordion' | 'auto';
}

export function SetupForm({
  onSuccess,
  onError,
  returnUrl,
  submitLabel = 'Save payment method',
  className,
  buttonClassName,
  errorClassName,
  successContent,
  layout = 'tabs',
}: SetupFormProps) {
  const { confirmSetup, isProcessing, isSuccess, error, isReady } = useSetupIntent({
    onSuccess,
    onError,
    returnUrl,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await confirmSetup();
  };

  if (isSuccess) {
    return (
      <div className={className}>
        {successContent ?? <p>Payment method saved!</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <PaymentElement options={{ layout }} />
      {error && <p className={errorClassName} role="alert">{error}</p>}
      <button
        type="submit"
        disabled={!isReady || isProcessing}
        className={buttonClassName}
      >
        {isProcessing ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
