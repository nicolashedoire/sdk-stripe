'use client';

import React from 'react';
import type { ReactNode, CSSProperties } from 'react';

export interface PricingPlan {
  id: string;
  name: string;
  description?: string;
  priceId: string;
  amount: number;
  currency: string;
  interval?: 'month' | 'year' | 'week' | 'day';
  features: string[];
  highlighted?: boolean;
  badge?: string;
  trialDays?: number;
}

export interface PricingTableProps {
  plans: PricingPlan[];
  onSelectPlan: (plan: PricingPlan) => void;
  isLoading?: boolean;
  currentPlanId?: string;
  buttonLabel?: string;
  currentPlanLabel?: string;
  className?: string;
  planClassName?: string;
  highlightedClassName?: string;
  buttonClassName?: string;
  formatPrice?: (amount: number, currency: string) => string;
  renderFeature?: (feature: string) => ReactNode;
}

function defaultFormatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount / 100);
}

export function PricingTable({
  plans,
  onSelectPlan,
  isLoading,
  currentPlanId,
  buttonLabel = 'Get started',
  currentPlanLabel = 'Current plan',
  className,
  planClassName,
  highlightedClassName,
  buttonClassName,
  formatPrice = defaultFormatPrice,
  renderFeature,
}: PricingTableProps) {
  const defaultStyles: Record<string, CSSProperties> = {
    container: {
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.min(plans.length, 4)}, 1fr)`,
      gap: '1.5rem',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    plan: {
      border: '1px solid #e5e7eb',
      borderRadius: '0.75rem',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
    },
    highlighted: {
      border: '2px solid #6366f1',
      boxShadow: '0 4px 14px rgba(99,102,241,0.15)',
    },
    badge: {
      background: '#6366f1',
      color: '#fff',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      alignSelf: 'flex-start',
      marginBottom: '0.5rem',
    },
    name: { fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem' },
    description: { color: '#6b7280', fontSize: '0.875rem', margin: '0 0 1rem' },
    price: { fontSize: '2.5rem', fontWeight: 800, margin: '0' },
    interval: { color: '#6b7280', fontSize: '0.875rem', fontWeight: 400 },
    features: { listStyle: 'none', padding: 0, margin: '1.5rem 0', flex: 1 },
    feature: { padding: '0.375rem 0', fontSize: '0.875rem' },
    button: {
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      border: 'none',
      fontWeight: 600,
      cursor: 'pointer',
      fontSize: '0.875rem',
      background: '#6366f1',
      color: '#fff',
      width: '100%',
    },
    currentButton: {
      background: '#e5e7eb',
      color: '#374151',
      cursor: 'default',
    },
  };

  return (
    <div className={className} style={!className ? defaultStyles.container : undefined}>
      {plans.map((plan) => {
        const isCurrent = plan.id === currentPlanId;
        return (
          <div
            key={plan.id}
            className={plan.highlighted ? highlightedClassName : planClassName}
            style={
              !planClassName
                ? { ...defaultStyles.plan, ...(plan.highlighted ? defaultStyles.highlighted : {}) }
                : undefined
            }
          >
            {plan.badge && (
              <span style={!highlightedClassName ? defaultStyles.badge : undefined}>
                {plan.badge}
              </span>
            )}
            <h3 style={defaultStyles.name}>{plan.name}</h3>
            {plan.description && <p style={defaultStyles.description}>{plan.description}</p>}
            <p style={defaultStyles.price}>
              {formatPrice(plan.amount, plan.currency)}
              {plan.interval && (
                <span style={defaultStyles.interval}> / {plan.interval}</span>
              )}
            </p>
            {plan.trialDays && (
              <p style={{ ...defaultStyles.description, marginTop: '0.5rem' }}>
                {plan.trialDays}-day free trial
              </p>
            )}
            <ul style={defaultStyles.features}>
              {plan.features.map((feature, i) => (
                <li key={i} style={defaultStyles.feature}>
                  {renderFeature ? renderFeature(feature) : `✓ ${feature}`}
                </li>
              ))}
            </ul>
            <button
              onClick={() => !isCurrent && onSelectPlan(plan)}
              disabled={isLoading || isCurrent}
              className={buttonClassName}
              style={
                !buttonClassName
                  ? { ...defaultStyles.button, ...(isCurrent ? defaultStyles.currentButton : {}) }
                  : undefined
              }
            >
              {isCurrent ? currentPlanLabel : buttonLabel}
            </button>
          </div>
        );
      })}
    </div>
  );
}
