import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import BillingDashboard from './billing-dashboard.component';
import { launchCreateBillWorkspace } from '../workspaces';

jest.mock('../workspaces', () => ({
  launchCreateBillWorkspace: jest.fn(),
}));

jest.mock('../billing-header/billing-header.component', () => ({ title, showDateFilter }) => (
  <div title="billing module illustration">
    <span data-testid="billing-header-title">{title}</span>
    <span data-testid="billing-header-date-filter">{showDateFilter ? 'shown' : 'hidden'}</span>
  </div>
));
jest.mock('../all-bills-table/all-bills-table.component', () => ({ actions }) => (
  <div>
    <div>{actions}</div>
    <div>All Bills Table</div>
  </div>
));
jest.mock('../billable-services/billing-history/billing-history.component', () => ({
  BillingHistory: () => <div>Billing History</div>,
}));
jest.mock('../billable-services/bill-manager/bill-manager.component', () => () => <div>Bill Manager</div>);
jest.mock('../billable-services/dashboard/dashboard.component', () => ({
  ChargeItemsDashboard: () => <div>Charge Items</div>,
}));
jest.mock('../invoice/invoice.component', () => ({ showPatientHeader = true }) => (
  <div>Invoice Overview {showPatientHeader ? 'with patient header' : 'without patient header'}</div>
));
jest.mock('@openmrs/esm-framework', () => {
  const originalModule = jest.requireActual('@openmrs/esm-framework');
  return {
    ...originalModule,
    ExtensionSlot: ({ state }) => (
      <button
        type="button"
        onClick={() => {
          state?.onSelectAction?.('billing-history', 'Billing History');
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
  expect(screen.getByTestId('billing-header-date-filter')).toHaveTextContent('shown');
  expect(screen.queryByRole('button', { name: /show more/i })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /create bill/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /billing options/i })).toBeInTheDocument();
  expect(screen.getByText('All Bills Table')).toBeInTheDocument();
});

test('launches the create bill workspace flow from the billing home', async () => {
  const user = userEvent.setup();
  renderBillingDashboard();

  await user.click(screen.getByRole('button', { name: /create bill/i }));

  expect(launchCreateBillWorkspace).toHaveBeenCalledTimes(1);
});

test('renders the selected billing action inline and shows a back button', async () => {
  renderBillingDashboard('/billing-history');

  expect(screen.getByTestId('billing-header-title')).toHaveTextContent('Billing History');
  expect(screen.getByTestId('billing-header-date-filter')).toHaveTextContent('hidden');
  expect(screen.getByRole('button', { name: /back/i })).toHaveTextContent('Back');
  expect(screen.getAllByText('Billing History')).toHaveLength(2);
});

test('renders the selected billing action inline without route navigation', async () => {
  const user = userEvent.setup();
  renderBillingDashboard();

  await user.click(screen.getByRole('button', { name: /billing options/i }));
  expect(screen.getByRole('menu', { name: /billing options/i })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /billing actions slot/i }));
  expect(screen.queryByRole('menu', { name: /billing options/i })).not.toBeInTheDocument();
  expect(screen.getByTestId('billing-header-title')).toHaveTextContent('Billing History');
  expect(screen.getByTestId('billing-header-date-filter')).toHaveTextContent('hidden');
  expect(screen.getByRole('button', { name: /back/i })).toHaveTextContent('Back');
  expect(screen.getAllByText('Billing History')).toHaveLength(2);
});

test('renders the invoice overview with the patient header for patient bill routes', () => {
  renderBillingDashboard('/patient/patient-uuid/bill-uuid');

  expect(screen.getByText('Invoice Overview with patient header')).toBeInTheDocument();
  expect(screen.queryByTestId('billing-header-title')).not.toBeInTheDocument();
  expect(screen.queryByTestId('billing-header-date-filter')).not.toBeInTheDocument();
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
