import React from 'react';
import { render, screen } from '@testing-library/react';
import { BillingHistoryDashboard } from './billing-history-dashboard.component';

jest.mock('./useBillingHistoryFilterContext', () => ({
  BillingHistoryFilterProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useBillingHistoryFilterContext: () => ({ filters: {} }),
}));

jest.mock('./useBillingHistoryBills', () => ({
  useBillingHistoryBills: () => ({ bills: [], isLoading: false, error: null }),
}));

jest.mock('./filters/billing-history-filters.component', () => ({
  BillingHistoryFilters: () => <div data-testid="payment-filters">Filters</div>,
}));

jest.mock('../../metrics-cards/metrics-cards.component', () => () => <div data-testid="payment-metrics">Metrics</div>);

jest.mock('./bill-history-viewer.component', () => ({
  BillHistoryViewerContent: () => <div data-testid="payment-history-table">History Table</div>,
}));

jest.mock('./payment-method-distribution.component', () => () => <div>Payment Summary</div>);

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

test('renders filters above payment metrics and metrics above the table content', () => {
  render(<BillingHistoryDashboard />);

  const metrics = screen.getByTestId('payment-metrics');
  const filters = screen.getByTestId('payment-filters');
  const historyTable = screen.getByTestId('payment-history-table');

  expect(filters.compareDocumentPosition(metrics) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(metrics.compareDocumentPosition(historyTable) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

test('does not show the payment history tab', () => {
  render(<BillingHistoryDashboard />);

  expect(screen.queryByRole('tab', { name: 'Payment History' })).not.toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Payment Mode Summary' })).toBeInTheDocument();
});
