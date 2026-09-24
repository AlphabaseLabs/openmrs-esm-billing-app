import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockBillData } from '../../../__mocks__/bill.mock';
import { type MappedBill } from '../../types';
import PatientBills from './patient-bills.component';

jest.mock('./bill-line-items.component', () => ({
  __esModule: true,
  default: ({ bill }: { bill: MappedBill }) => <div>Line items for {bill.receiptNumber}</div>,
}));

const bill: MappedBill = {
  ...mockBillData[0],
  receiptNumber: '2609230606-2',
  dateCreated: '23-Sep-2026, 06:32 AM',
  totalAmount: 1030000,
  tenderedAmount: 40000,
  totalActualPayments: 40000,
  totalWaived: 0,
};

afterEach(() => localStorage.removeItem('i18nextLng'));

test.each([
  ['en', 'PKR'],
  ['sw', 'KES'],
])('patient bill amounts use %s currency in headings and decimal values in cells', (locale, currency) => {
  localStorage.setItem('i18nextLng', locale);
  render(<PatientBills bills={[bill]} />);

  expect(screen.getByRole('columnheader', { name: 'Invoice' })).toBeInTheDocument();
  expect(screen.queryByRole('columnheader', { name: 'Invoice number' })).not.toBeInTheDocument();
  for (const label of ['Total amount', 'Amount paid', 'Amount waived']) {
    expect(screen.getByRole('columnheader', { name: `${label} (${currency})` })).toHaveClass('numericCell');
  }
  for (const amount of ['1,030,000.00', '40,000.00', '0.00']) {
    expect(screen.getByRole('cell', { name: amount })).toHaveClass('numericCell');
  }
  expect(screen.queryByRole('cell', { name: new RegExp(currency) })).not.toBeInTheDocument();
  expect(screen.getByRole('cell', { name: bill.dateCreated })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: bill.receiptNumber })).toBeInTheDocument();
  expect(screen.queryByRole('columnheader', { name: /Refunded amount/ })).not.toBeInTheDocument();
});

test('refund amounts exclude voided items and bill details remain expandable', async () => {
  localStorage.setItem('i18nextLng', 'en');
  const user = userEvent.setup();
  render(
    <PatientBills
      bills={[
        {
          ...bill,
          lineItems: [
            ...bill.lineItems,
            { ...bill.lineItems[0], uuid: 'refund', price: -25.5 },
            { ...bill.lineItems[0], uuid: 'voided-refund', price: -100, voided: true },
          ],
        },
      ]}
    />,
  );

  expect(screen.getByRole('columnheader', { name: 'Refunded amount (PKR)' })).toHaveClass('numericCell');
  expect(screen.getByRole('cell', { name: '25.50' })).toHaveClass('numericCell');

  const row = screen.getByRole('link', { name: bill.receiptNumber }).closest('tr');
  const expandButton = within(row).getByRole('button');
  expect(expandButton).toHaveAttribute('aria-expanded', 'false');
  await user.click(expandButton);
  expect(expandButton).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByText(`Line items for ${bill.receiptNumber}`)).toBeVisible();
  expect(screen.getByText(`Line items for ${bill.receiptNumber}`).closest('td')).toHaveAttribute('colspan', '10');
});

test.each([false, true])('loading uses the same columns as results (with refunds: %s)', (hasRefund) => {
  localStorage.setItem('i18nextLng', 'en');
  const loadingBill = {
    ...bill,
    lineItems: hasRefund ? [{ ...bill.lineItems[0], price: -25.5 }] : bill.lineItems,
  };
  const { rerender } = render(<PatientBills bills={[loadingBill]} isLoading />);

  const table = screen.getByRole('table');
  expect(table).toHaveAttribute('aria-busy', 'true');
  expect(table).toHaveClass('cds--data-table--sm', 'cds--data-table--zebra');
  expect(screen.queryByRole('link', { name: bill.receiptNumber })).not.toBeInTheDocument();
  expect(screen.queryByRole('columnheader', { name: 'Billable service' })).not.toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Total amount (PKR)' })).toHaveClass('numericCell');

  const loadingHeaders = screen.getAllByRole('columnheader').map((header) => header.textContent);
  expect(loadingHeaders).toHaveLength(hasRefund ? 10 : 9);
  const loadingRows = within(table).getAllByRole('row').slice(1);
  expect(loadingRows).toHaveLength(3);
  for (const row of loadingRows) {
    expect(within(row).getAllByRole('cell')).toHaveLength(loadingHeaders.length);
    expect(within(row).queryByRole('button')).not.toBeInTheDocument();
  }

  rerender(<PatientBills bills={[loadingBill]} />);

  expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'false');
  expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(loadingHeaders);
  expect(screen.getByRole('link', { name: bill.receiptNumber })).toBeInTheDocument();
});

test('shows the empty state only after loading completes without bills', () => {
  const { rerender } = render(<PatientBills bills={[]} isLoading />);

  expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
  expect(screen.queryByRole('heading', { name: 'No bills' })).not.toBeInTheDocument();

  rerender(<PatientBills bills={[]} />);

  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'No bills' })).toBeInTheDocument();
});
