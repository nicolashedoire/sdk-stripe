import type Stripe from 'stripe';
import type { SDKResult } from '../types';

export function handleStripeError<T>(error: unknown): SDKResult<T> {
  if ((error as Stripe.errors.StripeError)?.type) {
    const stripeError = error as Stripe.errors.StripeError;
    return {
      data: null,
      error: {
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        statusCode: stripeError.statusCode,
      },
    };
  }

  return {
    data: null,
    error: {
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      type: 'sdk_error',
    },
  };
}

export function success<T>(data: T): SDKResult<T> {
  return { data, error: null };
}
