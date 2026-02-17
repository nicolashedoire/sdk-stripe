import type Stripe from 'stripe';
import type { SDKResult } from '../types';

const SAFE_ERROR_MESSAGES: Record<string, string> = {
  card_declined: 'Your card was declined.',
  expired_card: 'Your card has expired.',
  incorrect_cvc: 'Incorrect security code.',
  processing_error: 'An error occurred while processing your card.',
  incorrect_number: 'The card number is incorrect.',
  insufficient_funds: 'Insufficient funds.',
};

export function handleStripeError<T>(error: unknown): SDKResult<T> {
  if ((error as Stripe.errors.StripeError)?.type) {
    const stripeError = error as Stripe.errors.StripeError;
    const safeMessage =
      (stripeError.code && SAFE_ERROR_MESSAGES[stripeError.code]) ||
      getSafeMessage(stripeError.type);

    return {
      data: null,
      error: {
        message: safeMessage,
        type: stripeError.type,
        code: stripeError.code,
        statusCode: stripeError.statusCode,
      },
    };
  }

  return {
    data: null,
    error: {
      message: 'An unexpected error occurred',
      type: 'sdk_error',
    },
  };
}

function getSafeMessage(type: string): string {
  switch (type) {
    case 'card_error':
      return 'A card error occurred.';
    case 'invalid_request_error':
      return 'Invalid request. Please check your input.';
    case 'authentication_error':
      return 'Authentication failed.';
    case 'rate_limit_error':
      return 'Too many requests. Please try again later.';
    case 'api_error':
      return 'A payment processing error occurred. Please try again.';
    default:
      return 'An unexpected error occurred.';
  }
}

export function success<T>(data: T): SDKResult<T> {
  return { data, error: null };
}
