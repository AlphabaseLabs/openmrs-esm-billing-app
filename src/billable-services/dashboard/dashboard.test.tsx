import React from 'react';
import { screen, render } from '@testing-library/react';
import { ChargeItemsDashboard } from './dashboard.component';

jest.mock('../../billing-header/billing-header.component', () => () => (
  <div title="charge items illustration">Header</div>
));
jest.mock('../clinical-charges.component', () => () => <div>Clinical Charges</div>);

test('renders an empty state when there are no services', () => {
  renderBillingDashboard();

  expect(screen.getByTitle(/charge items illustration/i)).toBeInTheDocument();
  expect(screen.getByText('Clinical Charges')).toBeInTheDocument();
});

function renderBillingDashboard() {
  render(<ChargeItemsDashboard />);
}
