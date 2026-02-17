import Stripe from 'stripe';
import type { StripeSDKConfig } from '../types';

let stripeInstance: Stripe | null = null;
let currentConfig: StripeSDKConfig | null = null;

export function initStripe(config: StripeSDKConfig): Stripe {
  if (stripeInstance) {
    console.warn('[@stripe-sdk/core] Stripe is already initialized. Re-initializing with new config.');
  }
  currentConfig = config;
  stripeInstance = new Stripe(config.secretKey, {
    apiVersion: config.apiVersion ?? '2025-01-27.acacia' as Stripe.LatestApiVersion,
    maxNetworkRetries: config.maxNetworkRetries ?? 2,
    appInfo: config.appInfo ?? {
      name: '@stripe-sdk/core',
      version: '1.0.1',
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

export function getConfig(): Omit<StripeSDKConfig, 'secretKey'> {
  if (!currentConfig) {
    throw new Error(
      '[@stripe-sdk/core] Stripe not initialized. Call initStripe({ secretKey, publishableKey }) first.'
    );
  }
  const { secretKey: _sk, ...safeConfig } = currentConfig;
  return safeConfig;
}
