import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import BillingDashboard from './billing-dashboard.component';

jest.mock('../billing-header/billing-header.component', () => ({ title, actions }) => (
  <div title="billing module illustration">
    <span data-testid="billing-header-title">{title}</span>
    <div>{actions}</div>
  </div>
));
jest.mock('../all-bills-table/all-bills-table.component', () => () => <div>All Bills Table</div>);
jest.mock('../metrics-cards/metrics-cards.component', () => () => <div>Metrics Cards</div>);
jest.mock('./clock-out-strip.component', () => ({
  ClockOutStrip: () => <div>Clock Out Strip</div>,
}));
jest.mock('../billable-services/payment-history/payment-history.component', () => ({
  PaymentHistory: () => <div>Payment History</div>,
}));
jest.mock('../billable-services/bill-manager/bill-manager.component', () => () => <div>Bill Manager</div>);
jest.mock('../billable-services/dashboard/dashboard.component', () => ({
  ChargeItemsDashboard: () => <div>Charge Items</div>,
}));
jest.mock('../invoice/invoice.component', () => () => <div>Invoice Overview</div>);
jest.mock('@openmrs/esm-framework', () => {
  const originalModule = jest.requireActual('@openmrs/esm-framework');
  return {
    ...originalModule,
    ExtensionSlot: ({ state }) => (
      <button
        type="button"
        onClick={() => {
          state?.onSelectAction?.('payment-history', 'Payment History');
          state?.onSelect?.();
        }}>
        Billing Actions Slot
      </button>
    ),
    UserHasAccess: ({ children }) => <>{children}</>,
  };
});

test('renders billing home controls and the bills table by default', () => {
  renderBillingDashboard();

  expect(screen.getByTitle(/billing module illustration/i)).toBeInTheDocument();
  expect(screen.getByTestId('billing-header-title')).toHaveTextContent('Home');
  expect(screen.getByRole('button', { name: /show more/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /billing options/i })).toBeInTheDocument();
  expect(screen.getByText('All Bills Table')).toBeInTheDocument();
});

test('shows the summary section when show more is clicked', async () => {
  const user = userEvent.setup();
  renderBillingDashboard();

  await user.click(screen.getByRole('button', { name: /show more/i }));

  expect(screen.getByText('Clock Out Strip')).toBeInTheDocument();
  expect(screen.getByText('Metrics Cards')).toBeInTheDocument();
});

test('renders the selected billing action inline and shows a back button', async () => {
  renderBillingDashboard('/payment-history');

  expect(screen.getByTestId('billing-header-title')).toHaveTextContent('Payment History');
  expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  expect(screen.getAllByText('Payment History')).toHaveLength(2);
});

test('renders the selected billing action inline without route navigation', async () => {
  const user = userEvent.setup();
  renderBillingDashboard();

  await user.click(screen.getByRole('button', { name: /billing options/i }));
  expect(screen.getByRole('menu', { name: /billing options/i })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /billing actions slot/i }));
  expect(screen.queryByRole('menu', { name: /billing options/i })).not.toBeInTheDocument();
  expect(screen.getByTestId('billing-header-title')).toHaveTextContent('Payment History');
  expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  expect(screen.getAllByText('Payment History')).toHaveLength(2);
});

test('renders the invoice overview inside the billing home shell for patient bill routes', () => {
  renderBillingDashboard('/patient/patient-uuid/bill-uuid');

  expect(screen.getByText('Invoice Overview')).toBeInTheDocument();
  expect(screen.queryByText('All Bills Table')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
});

function renderBillingDashboard(route = '/') {
  render(
    <MemoryRouter initialEntries={[route]}>
      <BillingDashboard />
    </MemoryRouter>,
  );
}
