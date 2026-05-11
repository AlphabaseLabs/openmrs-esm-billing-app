import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import createBillingActionItem from './create-billing-action-item';

describe('createBillingActionItem', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'getOpenmrsSpaBase', {
      configurable: true,
      writable: true,
      value: () => '/openmrs/spa/',
    });
  });

  const BillingHistoryAction = createBillingActionItem({
    actionKey: 'billing-history',
    route: '/billing-history',
    title: 'Billing History',
  });

  test('renders a link with the expected href and uses SPA navigation on regular click', () => {
    const onSelect = jest.fn();
    const onSelectAction = jest.fn();

    render(<BillingHistoryAction onSelect={onSelect} onSelectAction={onSelectAction} />);

    const link = screen.getByRole('link', { name: /billing history/i });

    expect(link).toHaveAttribute('href', '/openmrs/spa/home/billing/billing-history');

    fireEvent.click(link);

    expect(onSelectAction).toHaveBeenCalledWith('billing-history', 'Billing History');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  test('does not trigger SPA navigation on modified click so the browser can open a new tab', () => {
    const onSelect = jest.fn();
    const onSelectAction = jest.fn();

    render(<BillingHistoryAction onSelect={onSelect} onSelectAction={onSelectAction} />);

    fireEvent.click(screen.getByRole('link', { name: /billing history/i }), { ctrlKey: true });

    expect(onSelectAction).not.toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
