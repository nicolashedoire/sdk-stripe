const STRIPE_ID_PREFIXES: Record<string, string> = {
  customer: 'cus_',
  paymentIntent: 'pi_',
  paymentMethod: 'pm_',
  subscription: 'sub_',
  invoice: 'in_',
  invoiceItem: 'ii_',
  product: 'prod_',
  price: 'price_',
  coupon: '', // coupons can have custom IDs
  promotionCode: 'promo_',
  refund: 're_',
  dispute: 'dp_',
  account: 'acct_',
  transfer: 'tr_',
  payout: 'po_',
  setupIntent: 'seti_',
  session: 'cs_',
  paymentLink: 'plink_',
};

export function validateStripeId(id: string, type: keyof typeof STRIPE_ID_PREFIXES): void {
  if (!id || typeof id !== 'string') {
    throw new Error(`${type} ID is required and must be a non-empty string`);
  }
  const prefix = STRIPE_ID_PREFIXES[type];
  if (prefix && !id.startsWith(prefix)) {
    throw new Error(`Invalid ${type} ID: expected prefix "${prefix}"`);
  }
}

export function validateAmount(amount: number, label = 'amount'): void {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new Error(`${label} must be a finite number`);
  }
  if (!Number.isInteger(amount)) {
    throw new Error(`${label} must be an integer (amount in smallest currency unit)`);
  }
  if (amount < 0) {
    throw new Error(`${label} must not be negative`);
  }
  if (amount > 99999999) {
    throw new Error(`${label} exceeds maximum allowed value (99999999)`);
  }
}

export function validateCurrency(currency: string): string {
  if (!currency || typeof currency !== 'string') {
    throw new Error('Currency is required');
  }
  const normalized = currency.trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(normalized)) {
    throw new Error('Currency must be a valid 3-letter ISO 4217 code');
  }
  return normalized;
}

export function validateUrl(url: string, label = 'URL'): void {
  if (!url || typeof url !== 'string') {
    throw new Error(`${label} is required`);
  }
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error(`${label} must use http or https protocol`);
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('protocol')) throw e;
    throw new Error(`${label} must be a valid URL`);
  }
}

export function validateMetadata(metadata: Record<string, string>): void {
  const keys = Object.keys(metadata);
  if (keys.length > 50) {
    throw new Error('Metadata cannot have more than 50 keys');
  }
  for (const [key, value] of Object.entries(metadata)) {
    if (key.length > 40) {
      throw new Error(`Metadata key "${key}" exceeds 40 characters`);
    }
    if (typeof value !== 'string') {
      throw new Error(`Metadata value for key "${key}" must be a string`);
    }
    if (value.length > 500) {
      throw new Error(`Metadata value for key "${key}" exceeds 500 characters`);
    }
  }
}

export function sanitizeLimit(limit: number | undefined, defaultLimit = 10): number {
  if (limit === undefined) return defaultLimit;
  return Math.min(Math.max(Math.floor(limit), 1), 100);
}
