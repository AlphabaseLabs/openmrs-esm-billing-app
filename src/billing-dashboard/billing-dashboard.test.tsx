import React from 'react';
import { screen, render } from '@testing-library/react';
import BillingDashboard from './billing-dashboard.component';

jest.mock('../billing-header/billing-header.component', () => () => (
  <div title="billing module illustration">Header</div>
));
jest.mock('../metrics-cards/metrics-cards.component', () => () => <div>Metrics Cards</div>);
jest.mock('../billing-tabs/billling-tabs.component', () => () => <div>Billing Tabs</div>);
jest.mock('./clock-out-strip.component', () => ({
  ClockOutStrip: () => <div>Clock Out Strip</div>,
}));
jest.mock('@openmrs/esm-framework', () => {
  const originalModule = jest.requireActual('@openmrs/esm-framework');
  return {
    ...originalModule,
    UserHasAccess: ({ children }) => <>{children}</>,
  };
});

test('renders an empty state when there are no billing records', () => {
  renderBillingDashboard();

  expect(screen.getByTitle(/billing module illustration/i)).toBeInTheDocument();
});

function renderBillingDashboard() {
  render(<BillingDashboard />);
}
