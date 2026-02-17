import Stripe from 'stripe';
import type { StripeSDKConfig } from '../types';

let stripeInstance: Stripe | null = null;
let currentConfig: StripeSDKConfig | null = null;

export function initStripe(config: StripeSDKConfig): Stripe {
  currentConfig = config;
  stripeInstance = new Stripe(config.secretKey, {
    apiVersion: config.apiVersion ?? '2025-01-27.acacia' as Stripe.LatestApiVersion,
    appInfo: config.appInfo ?? {
      name: '@stripe-sdk/core',
      version: '1.0.0',
    },
  });
  return stripeInstance;
}

export function getStripe(): Stripe {
  if (!stripeInstance) {
    throw new Error(
      '[@stripe-sdk/core] Stripe not initialized. Call initStripe({ secretKey, publishableKey }) first.'
    );
  }
  return stripeInstance;
}

export function getConfig(): StripeSDKConfig {
  if (!currentConfig) {
    throw new Error(
      '[@stripe-sdk/core] Stripe not initialized. Call initStripe({ secretKey, publishableKey }) first.'
    );
  }
  return currentConfig;
}
