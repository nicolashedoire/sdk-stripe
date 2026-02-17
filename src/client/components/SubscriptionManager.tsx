'use client';

import React, { useState } from 'react';
import type { ReactNode, CSSProperties } from 'react';

export interface SubscriptionInfo {
  id: string;
  status: string;
  planName: string;
  amount: number;
  currency: string;
  interval: string;
  currentPeriodEnd: string | Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string | Date | null;
}

export interface SubscriptionManagerProps {
  subscription: SubscriptionInfo;
  onCancel: (subscriptionId: string) => Promise<void>;
  onResume?: (subscriptionId: string) => Promise<void>;
  onChangePlan?: (subscriptionId: string) => void;
  onManageBilling?: () => void;
  className?: string;
  formatPrice?: (amount: number, currency: string) => string;
  cancelLabel?: string;
  resumeLabel?: string;
  changePlanLabel?: string;
  manageBillingLabel?: string;
  children?: ReactNode;
}

function defaultFormatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount / 100);
}

const statusColors: Record<string, string> = {
  active: '#10b981',
  trialing: '#6366f1',
  past_due: '#f59e0b',
  canceled: '#ef4444',
  incomplete: '#f59e0b',
  unpaid: '#ef4444',
  paused: '#6b7280',
};

export function SubscriptionManager({
  subscription,
  onCancel,
  onResume,
  onChangePlan,
  onManageBilling,
  className,
  formatPrice = defaultFormatPrice,
  cancelLabel = 'Cancel subscription',
  resumeLabel = 'Resume subscription',
  changePlanLabel = 'Change plan',
  manageBillingLabel = 'Manage billing',
}: SubscriptionManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const endDate = new Date(subscription.currentPeriodEnd).toLocaleDateString();
  const trialEndDate = subscription.trialEnd
    ? new Date(subscription.trialEnd).toLocaleDateString()
    : null;

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      await onCancel(subscription.id);
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
    }
  };

  const handleResume = async () => {
    if (!onResume) return;
    setIsLoading(true);
    try {
      await onResume(subscription.id);
    } finally {
      setIsLoading(false);
    }
  };

  const styles: Record<string, CSSProperties> = {
    container: { border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
    planName: { fontSize: '1.25rem', fontWeight: 700, margin: 0 },
    status: {
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      color: '#fff',
      background: statusColors[subscription.status] ?? '#6b7280',
    },
    price: { fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem' },
    detail: { color: '#6b7280', fontSize: '0.875rem', margin: '0.25rem 0' },
    actions: { display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' as const },
    button: {
      padding: '0.5rem 1rem',
      borderRadius: '0.375rem',
      border: '1px solid #d1d5db',
      background: '#fff',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: 500,
    },
    dangerButton: {
      padding: '0.5rem 1rem',
      borderRadius: '0.375rem',
      border: '1px solid #fca5a5',
      background: '#fef2f2',
      color: '#dc2626',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: 500,
    },
    confirm: {
      background: '#fef2f2',
      border: '1px solid #fca5a5',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginTop: '1rem',
    },
  };

  return (
    <div className={className} style={!className ? styles.container : undefined}>
      <div style={styles.header}>
        <h3 style={styles.planName}>{subscription.planName}</h3>
        <span style={styles.status}>{subscription.status}</span>
      </div>

      <p style={styles.price}>
        {formatPrice(subscription.amount, subscription.currency)}
        <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#6b7280' }}>
          {' '}/ {subscription.interval}
        </span>
      </p>

      {trialEndDate && subscription.status === 'trialing' && (
        <p style={styles.detail}>Trial ends on {trialEndDate}</p>
      )}

      {subscription.cancelAtPeriodEnd ? (
        <p style={{ ...styles.detail, color: '#dc2626' }}>
          Cancels on {endDate}
        </p>
      ) : (
        <p style={styles.detail}>Renews on {endDate}</p>
      )}

      <div style={styles.actions}>
        {onChangePlan && subscription.status === 'active' && (
          <button onClick={() => onChangePlan(subscription.id)} style={styles.button}>
            {changePlanLabel}
          </button>
        )}

        {onManageBilling && (
          <button onClick={onManageBilling} style={styles.button}>
            {manageBillingLabel}
          </button>
        )}

        {subscription.cancelAtPeriodEnd && onResume ? (
          <button onClick={handleResume} disabled={isLoading} style={styles.button}>
            {isLoading ? 'Loading...' : resumeLabel}
          </button>
        ) : (
          subscription.status === 'active' && (
            <button onClick={() => setShowConfirm(true)} style={styles.dangerButton}>
              {cancelLabel}
            </button>
          )
        )}
      </div>

      {showConfirm && (
        <div style={styles.confirm}>
          <p style={{ margin: '0 0 0.75rem', fontWeight: 500 }}>
            Are you sure you want to cancel?
          </p>
          <p style={{ ...styles.detail, marginBottom: '0.75rem' }}>
            You will still have access until {endDate}.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleCancel} disabled={isLoading} style={styles.dangerButton}>
              {isLoading ? 'Cancelling...' : 'Confirm cancellation'}
            </button>
            <button onClick={() => setShowConfirm(false)} style={styles.button}>
              Keep subscription
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
