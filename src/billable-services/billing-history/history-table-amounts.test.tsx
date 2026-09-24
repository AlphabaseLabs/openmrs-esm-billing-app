import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLayoutType } from '@openmrs/esm-framework';
import { BillHistoryViewerContent } from './bill-history-viewer.component';
import { PaymentEntryHistoryViewerContent } from '../payment-history/payment-entry-history-viewer.component';
import { PaymentMethodSummaryTable } from './payment-method-summary-table.component';
import { type BillingHistoryRow, type PaymentHistoryEntry } from './history.resource';

jest.mock('@openmrs/esm-framework', () => ({
  useLayoutType: jest.fn(() => 'large-desktop'),
  useDebounce: (value: string) => value,
  navigate: jest.fn(),
}));

jest.mock('./useBillingHistoryBills', () => ({ matchesBillingHistoryRowSearch: () => true }));
jest.mock('../payment-history/usePaymentHistoryEntries', () => ({ matchesPaymentHistoryEntrySearch: () => true }));
jest.mock('./useBillingHistoryFilterContext', () => ({}));
jest.mock('../../helpers/excelExport', () => ({ exportToExcel: jest.fn() }));
jest.mock('../../past-patient-bills/patient-bills-dashboard/empty-patient-bill.component', () => () => null);

const bill: BillingHistoryRow = {
  id: 'bill-1',
  uuid: 'bill-1',
  receiptNumber: 'INV-1',
  patientUuid: 'patient-1',
  patientName: 'Patient One',
  identifier: 'P-1',
  dateCreated: '25-Sep-2026, 10:00 AM',
  dateCreatedUnformatted: 1,
  status: 'POSTED',
  totalAmount: 1250.5,
  totalDiscount: 50,
  totalPaid: 200,
  amountDue: 1000.5,
  billedItems: 'Consultation',
  referenceCodes: '',
};

const payment: PaymentHistoryEntry = {
  id: 'payment-1',
  paymentUuid: 'payment-1',
  billUuid: 'bill-1',
  patientUuid: 'patient-1',
  patientName: 'Patient One',
  identifier: 'P-1',
  invoiceId: 'INV-1',
  paymentDate: '25-Sep-2026, 10:00 AM',
  paymentDateUnformatted: 1,
  paymentAmount: 1200.5,
  paymentMethod: 'Cash',
  referenceId: '',
};

const viewProps = {
  totalCount: 2,
  isLoading: false,
  isRefreshing: false,
  error: null,
  page: 1,
  pageSize: 10,
  onPageChange: jest.fn(),
  onExport: jest.fn().mockResolvedValue([]),
};

beforeEach(() => {
  localStorage.setItem('i18nextLng', 'en');
  jest.mocked(useLayoutType).mockReturnValue('large-desktop');
});
afterEach(() => localStorage.removeItem('i18nextLng'));

test.each([
  ['en', 'PKR', '1,250.50'],
  ['de', 'KES', '1.250,50'],
])('billing history retains numeric sorting in %s', async (locale, currency, amount) => {
  localStorage.setItem('i18nextLng', locale);
  const user = userEvent.setup();
  render(
    <BillHistoryViewerContent
      {...viewProps}
      rows={[bill, { ...bill, id: 'bill-2', receiptNumber: 'INV-2', totalAmount: 90 }]}
    />,
  );

  for (const label of ['Total amount', 'Total discount', 'Total paid', 'Amount due']) {
    const header = screen.getByRole('button', { name: `${label} (${currency})` });
    expect(header.closest('th')).toHaveClass('numericCell');
    expect(header).toHaveStyle({ inlineSize: '11.5rem', minInlineSize: '11.5rem' });
  }
  expect(screen.getByRole('cell', { name: amount })).toHaveClass('numericCell');
  expect(screen.queryByRole('cell', { name: new RegExp(currency) })).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: `Total amount (${currency})` }));
  expect(within(screen.getAllByRole('row')[1]).getByRole('cell', { name: 'INV-2' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: `Total amount (${currency})` }));
  expect(within(screen.getAllByRole('row')[1]).getByRole('cell', { name: 'INV-1' })).toBeInTheDocument();
});

test.each([
  ['en', 'PKR', '1,200.50'],
  ['de', 'KES', '1.200,50'],
])('payment history retains numeric sorting in %s', async (locale, currency, amount) => {
  localStorage.setItem('i18nextLng', locale);
  const user = userEvent.setup();
  render(
    <PaymentEntryHistoryViewerContent
      {...viewProps}
      entries={[payment, { ...payment, id: 'payment-2', invoiceId: 'INV-2', paymentAmount: 95 }]}
    />,
  );

  expect(screen.getByRole('button', { name: `Amount (${currency})` }).closest('th')).toHaveClass('numericCell');
  expect(screen.getByRole('button', { name: 'Mode' })).toBeInTheDocument();
  expect(screen.getByRole('cell', { name: amount })).toHaveClass('numericCell');
  expect(screen.queryByRole('cell', { name: new RegExp(currency) })).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: `Amount (${currency})` }));
  expect(within(screen.getAllByRole('row')[1]).getByRole('cell', { name: 'INV-2' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: `Amount (${currency})` }));
  expect(within(screen.getAllByRole('row')[1]).getByRole('cell', { name: 'INV-1' })).toBeInTheDocument();
});

test.each([
  ['en', 'PKR'],
  ['sw', 'KES'],
])('shared payment-mode summary uses the currency for %s', (locale, currency) => {
  localStorage.setItem('i18nextLng', locale);
  render(
    <PaymentMethodSummaryTable isLoading={false} paymentMethodTotals={[{ paymentMethod: 'Cash', total: 1234.5 }]} />,
  );

  expect(screen.getByRole('columnheader', { name: `Total (${currency})` })).toHaveClass('numericCell');
  expect(screen.getByRole('cell', { name: '1,234.50' })).toHaveClass('numericCell');
  expect(screen.getByText(`Total (${currency})`)).toHaveClass('summaryAmount');
  expect(screen.getByText('1,234.50')).toHaveClass('summaryAmount');
  expect(screen.queryByRole('cell', { name: new RegExp(currency) })).not.toBeInTheDocument();
});

test.each([
  {
    name: 'Billing History',
    renderTable: (isLoading: boolean) => (
      <BillHistoryViewerContent {...viewProps} isLoading={isLoading} rows={isLoading ? [] : [bill]} />
    ),
    amountHeadings: ['Total amount (PKR)', 'Total discount (PKR)', 'Total paid (PKR)', 'Amount due (PKR)'],
    columnCount: 11,
    amountWidth: '11.5rem',
  },
  {
    name: 'Payment History',
    renderTable: (isLoading: boolean) => (
      <PaymentEntryHistoryViewerContent {...viewProps} isLoading={isLoading} entries={isLoading ? [] : [payment]} />
    ),
    amountHeadings: ['Amount (PKR)'],
    columnCount: 7,
    amountWidth: '9rem',
  },
])(
  '$name retains amount alignment and columns after loading',
  ({ name, renderTable, amountHeadings, columnCount, amountWidth }) => {
    const { rerender } = render(renderTable(true));
    const loadingTable = screen.getByRole('table', { name });
    const loadingHeaders = within(loadingTable).getAllByRole('columnheader');

    expect(loadingHeaders).toHaveLength(columnCount);
    for (const heading of amountHeadings) {
      const header = within(loadingTable).getByRole('columnheader', { name: heading });
      expect(header).toHaveClass('numericCell', 'sortableNumericCell');
      expect(header).toHaveStyle({ inlineSize: amountWidth });
    }
    for (const row of within(loadingTable).getAllByRole('row').slice(1)) {
      const cells = within(row).getAllByRole('cell');
      expect(cells).toHaveLength(columnCount);
      for (const heading of amountHeadings) {
        const index = loadingHeaders.findIndex((header) => header.textContent === heading);
        expect(cells[index]).toHaveClass('numericCell', 'sortableNumericCell');
      }
    }

    rerender(renderTable(false));
    expect(screen.getAllByRole('columnheader')).toHaveLength(columnCount);
    for (const heading of amountHeadings) {
      const button = screen.getByRole('button', { name: heading });
      expect(button.closest('th')).toHaveClass('numericCell');
      expect(button).toHaveStyle({ inlineSize: amountWidth });
    }
  },
);

test.each(['large-desktop', 'tablet'] as const)(
  'payment-mode summary keeps its two-column layout while loading on %s',
  (layout) => {
    jest.mocked(useLayoutType).mockReturnValue(layout);
    const { rerender } = render(<PaymentMethodSummaryTable isLoading paymentMethodTotals={[]} />);
    const table = screen.getByRole('table', { name: 'Payment Mode Summary' });

    expect(within(table).getAllByRole('columnheader')).toHaveLength(2);
    expect(screen.queryByRole('region', { name: 'data table toolbar' })).not.toBeInTheDocument();
    expect(table).toHaveClass('paymentMethodSummary', `cds--data-table--${layout === 'tablet' ? 'md' : 'sm'}`);
    expect(table).toHaveAttribute('aria-busy', 'true');
    expect(within(table).getByRole('columnheader', { name: 'Total (PKR)' })).toHaveClass('numericCell');
    expect(screen.getByText('Total (PKR)')).toHaveClass('summaryAmount');
    for (const row of within(table).getAllByRole('row').slice(1)) {
      const cells = within(row).getAllByRole('cell');
      expect(cells).toHaveLength(2);
      expect(cells[1]).toHaveClass('numericCell');
    }

    rerender(
      <PaymentMethodSummaryTable isLoading={false} paymentMethodTotals={[{ paymentMethod: 'Cash', total: 100 }]} />,
    );
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'false');
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    expect(screen.getByRole('cell', { name: '100.00' })).toHaveClass('numericCell');
  },
);
