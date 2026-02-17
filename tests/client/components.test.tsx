import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock @stripe/react-stripe-js components
vi.mock('@stripe/react-stripe-js', () => ({
  PaymentElement: ({ options }: { options?: unknown }) => (
    <div data-testid="payment-element" data-options={JSON.stringify(options)}>
      MockPaymentElement
    </div>
  ),
  LinkAuthenticationElement: () => (
    <div data-testid="link-auth-element">MockLinkAuth</div>
  ),
  useStripe: () => ({
    confirmPayment: vi.fn().mockResolvedValue({
      error: null,
      paymentIntent: { id: 'pi_123', status: 'succeeded' },
    }),
    confirmSetup: vi.fn().mockResolvedValue({
      error: null,
      setupIntent: { id: 'seti_123', status: 'succeeded', payment_method: 'pm_abc' },
    }),
  }),
  useElements: () => ({}),
}));

import { CheckoutForm } from '../../src/client/components/CheckoutForm';
import { SetupForm } from '../../src/client/components/SetupForm';
import { PricingTable, type PricingPlan } from '../../src/client/components/PricingTable';
import { SubscriptionManager } from '../../src/client/components/SubscriptionManager';

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── CheckoutForm ────────────────────────────────────────────────────

describe('CheckoutForm', () => {
  it('should render PaymentElement and submit button', () => {
    render(<CheckoutForm />);

    expect(screen.getByTestId('payment-element')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Pay now' })).toBeDefined();
  });

  it('should render custom submit label', () => {
    render(<CheckoutForm submitLabel="Payer 20 EUR" />);

    expect(screen.getByRole('button', { name: 'Payer 20 EUR' })).toBeDefined();
  });

  it('should render email field when showEmail is true', () => {
    render(<CheckoutForm showEmail />);

    expect(screen.getByTestId('link-auth-element')).toBeDefined();
  });

  it('should not render email field by default', () => {
    render(<CheckoutForm />);

    expect(screen.queryByTestId('link-auth-element')).toBeNull();
  });

  it('should call onSuccess on form submit', async () => {
    const onSuccess = vi.fn();
    render(<CheckoutForm onSuccess={onSuccess} />);

    const button = screen.getByRole('button', { name: 'Pay now' });
    fireEvent.click(button);

    // Wait for async processing
    await vi.waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('pi_123');
    });
  });
});

// ─── SetupForm ───────────────────────────────────────────────────────

describe('SetupForm', () => {
  it('should render PaymentElement and submit button', () => {
    render(<SetupForm />);

    expect(screen.getByTestId('payment-element')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Save payment method' })).toBeDefined();
  });

  it('should render custom submit label', () => {
    render(<SetupForm submitLabel="Sauvegarder la carte" />);

    expect(screen.getByRole('button', { name: 'Sauvegarder la carte' })).toBeDefined();
  });
});

// ─── PricingTable ────────────────────────────────────────────────────

describe('PricingTable', () => {
  const plans: PricingPlan[] = [
    {
      id: 'starter',
      name: 'Starter',
      priceId: 'price_starter',
      amount: 900,
      currency: 'eur',
      interval: 'month',
      features: ['5 projects', '1 GB storage'],
    },
    {
      id: 'pro',
      name: 'Pro',
      priceId: 'price_pro',
      amount: 2900,
      currency: 'eur',
      interval: 'month',
      features: ['Unlimited projects', '100 GB storage', 'Priority support'],
      highlighted: true,
      badge: 'Popular',
    },
  ];

  it('should render all plans', () => {
    render(<PricingTable plans={plans} onSelectPlan={() => {}} />);

    expect(screen.getByText('Starter')).toBeDefined();
    expect(screen.getByText('Pro')).toBeDefined();
  });

  it('should render features', () => {
    render(<PricingTable plans={plans} onSelectPlan={() => {}} />);

    expect(screen.getByText(/5 projects/)).toBeDefined();
    expect(screen.getByText(/Priority support/)).toBeDefined();
  });

  it('should render badge for highlighted plan', () => {
    render(<PricingTable plans={plans} onSelectPlan={() => {}} />);

    expect(screen.getByText('Popular')).toBeDefined();
  });

  it('should call onSelectPlan when clicking a plan button', () => {
    const onSelectPlan = vi.fn();
    render(<PricingTable plans={plans} onSelectPlan={onSelectPlan} />);

    const buttons = screen.getAllByText('Get started');
    fireEvent.click(buttons[0]);

    expect(onSelectPlan).toHaveBeenCalledWith(plans[0]);
  });

  it('should show current plan label', () => {
    render(
      <PricingTable
        plans={plans}
        onSelectPlan={() => {}}
        currentPlanId="starter"
        currentPlanLabel="Plan actuel"
      />
    );

    expect(screen.getByText('Plan actuel')).toBeDefined();
  });

  it('should not call onSelectPlan for current plan', () => {
    const onSelectPlan = vi.fn();
    render(
      <PricingTable
        plans={plans}
        onSelectPlan={onSelectPlan}
        currentPlanId="starter"
      />
    );

    const currentButton = screen.getByText('Current plan');
    fireEvent.click(currentButton);

    expect(onSelectPlan).not.toHaveBeenCalled();
  });

  it('should format prices correctly', () => {
    render(<PricingTable plans={plans} onSelectPlan={() => {}} />);

    // Should display formatted EUR prices (9 EUR and 29 EUR)
    // The exact format depends on locale but should contain the amounts
    const container = document.body;
    expect(container.textContent).toContain('9');
    expect(container.textContent).toContain('29');
  });

  it('should render trial days info', () => {
    const plansWithTrial: PricingPlan[] = [{
      ...plans[0],
      trialDays: 14,
    }];

    render(<PricingTable plans={plansWithTrial} onSelectPlan={() => {}} />);

    expect(screen.getByText('14-day free trial')).toBeDefined();
  });
});

// ─── SubscriptionManager ─────────────────────────────────────────────

describe('SubscriptionManager', () => {
  const subscription = {
    id: 'sub_123',
    status: 'active',
    planName: 'Pro',
    amount: 2900,
    currency: 'eur',
    interval: 'month',
    currentPeriodEnd: '2025-03-01',
    cancelAtPeriodEnd: false,
  };

  it('should render subscription info', () => {
    render(
      <SubscriptionManager
        subscription={subscription}
        onCancel={async () => {}}
      />
    );

    expect(screen.getByText('Pro')).toBeDefined();
    expect(screen.getByText('active')).toBeDefined();
  });

  it('should show cancel button for active subscription', () => {
    render(
      <SubscriptionManager
        subscription={subscription}
        onCancel={async () => {}}
      />
    );

    expect(screen.getByText('Cancel subscription')).toBeDefined();
  });

  it('should show confirmation dialog on cancel click', () => {
    render(
      <SubscriptionManager
        subscription={subscription}
        onCancel={async () => {}}
      />
    );

    fireEvent.click(screen.getByText('Cancel subscription'));

    expect(screen.getByText('Are you sure you want to cancel?')).toBeDefined();
    expect(screen.getByText('Confirm cancellation')).toBeDefined();
    expect(screen.getByText('Keep subscription')).toBeDefined();
  });

  it('should dismiss confirmation dialog', () => {
    render(
      <SubscriptionManager
        subscription={subscription}
        onCancel={async () => {}}
      />
    );

    fireEvent.click(screen.getByText('Cancel subscription'));
    fireEvent.click(screen.getByText('Keep subscription'));

    expect(screen.queryByText('Are you sure you want to cancel?')).toBeNull();
  });

  it('should call onCancel on confirm', async () => {
    const onCancel = vi.fn().mockResolvedValue(undefined);

    render(
      <SubscriptionManager
        subscription={subscription}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByText('Cancel subscription'));
    fireEvent.click(screen.getByText('Confirm cancellation'));

    await vi.waitFor(() => {
      expect(onCancel).toHaveBeenCalledWith('sub_123');
    });
  });

  it('should show resume button for canceled-at-period-end subscription', () => {
    const canceledSub = { ...subscription, cancelAtPeriodEnd: true };

    render(
      <SubscriptionManager
        subscription={canceledSub}
        onCancel={async () => {}}
        onResume={async () => {}}
      />
    );

    expect(screen.getByText('Resume subscription')).toBeDefined();
    expect(screen.queryByText('Cancel subscription')).toBeNull();
  });

  it('should show change plan button', () => {
    render(
      <SubscriptionManager
        subscription={subscription}
        onCancel={async () => {}}
        onChangePlan={() => {}}
      />
    );

    expect(screen.getByText('Change plan')).toBeDefined();
  });

  it('should show manage billing button', () => {
    render(
      <SubscriptionManager
        subscription={subscription}
        onCancel={async () => {}}
        onManageBilling={() => {}}
      />
    );

    expect(screen.getByText('Manage billing')).toBeDefined();
  });

  it('should show cancellation date for cancelAtPeriodEnd', () => {
    const canceledSub = { ...subscription, cancelAtPeriodEnd: true };

    render(
      <SubscriptionManager
        subscription={canceledSub}
        onCancel={async () => {}}
      />
    );

    // Should show "Cancels on" with the date
    const container = document.body;
    expect(container.textContent).toContain('Cancels on');
  });

  it('should show renewal date for active subscription', () => {
    render(
      <SubscriptionManager
        subscription={subscription}
        onCancel={async () => {}}
      />
    );

    const container = document.body;
    expect(container.textContent).toContain('Renews on');
  });
});
