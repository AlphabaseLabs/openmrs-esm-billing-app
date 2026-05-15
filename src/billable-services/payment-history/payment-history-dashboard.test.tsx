import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { PaymentHistoryDashboard } from './payment-history-dashboard.component';

jest.mock('../billing-history/useBillingHistoryFilterContext', () => ({
  BillingHistoryFilterProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useBillingHistoryFilterContext: () => ({
    filters: {},
    dateRange: [new Date('2026-04-01T00:00:00.000Z'), new Date('2026-04-30T23:59:59.999Z')],
    appliedTimesheet: undefined,
  }),
}));

jest.mock('../billing-history/filters/billing-history-filters.component', () => ({
  BillingHistoryFilters: () => <div data-testid="payment-filters">Filters</div>,
}));

jest.mock('./usePaymentHistoryEntries', () => ({
  usePaymentHistoryMetrics: () => ({
    metrics: { paymentMethodTotals: [] },
    isLoading: false,
    error: null,
  }),
}));

jest.mock('./payment-history-metrics.component', () => ({
  PaymentHistoryMetrics: () => <div data-testid="payment-metrics">Metrics</div>,
}));

jest.mock('./payment-entry-history-viewer.component', () => ({
  PaymentEntryHistoryViewer: () => <div data-testid="payment-history-table">Payment History Table</div>,
}));

jest.mock('./payment-entry-mode-summary.component', () => ({
  PaymentEntryModeSummary: () => <div data-testid="payment-mode-summary">Payment Summary</div>,
}));

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

test('renders filters above payment metrics and metrics above the payment history table', () => {
  render(<PaymentHistoryDashboard />);

  const metrics = screen.getByTestId('payment-metrics');
  const filters = screen.getByTestId('payment-filters');
  const historyTable = screen.getByTestId('payment-history-table');

  expect(filters.compareDocumentPosition(metrics) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(metrics.compareDocumentPosition(historyTable) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

test('shows the payment mode summary tab content when selected', () => {
  render(<PaymentHistoryDashboard />);

  fireEvent.click(screen.getByRole('tab', { name: 'Payment Mode Summary' }));

  expect(screen.getByTestId('payment-mode-summary')).toBeInTheDocument();
});
