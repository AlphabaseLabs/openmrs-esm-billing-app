import React from 'react';
import { render, screen } from '@testing-library/react';
import { PaymentEntryHistoryTable } from './payment-entry-history-table.component';

jest.mock('@openmrs/esm-framework', () => ({
  navigate: jest.fn(),
  useDebounce: (value: string) => value,
  useLayoutType: () => 'desktop',
}));

const headers = [
  { header: 'Payment date', key: 'paymentDate' },
  { header: 'Invoice #', key: 'invoiceId' },
  { header: 'Patient name', key: 'patientName' },
  { header: 'Identifier', key: 'identifier' },
  { header: 'Amount (PKR)', key: 'paymentAmount' },
  { header: 'Mode', key: 'paymentMethod' },
  { header: 'Reference codes', key: 'referenceId' },
  { header: 'Status', key: 'reviewStatus' },
];

const pendingEntry = {
  id: 'pending-request-1',
  billUuid: 'bill-1',
  paymentUuid: '',
  patientUuid: 'patient-1',
  patientName: 'Test Patient',
  identifier: 'ID-001',
  invoiceId: 'INV-001',
  paymentDate: '08-Oct-2026, 08:03 AM',
  paymentDateUnformatted: Date.parse('2026-10-08T08:03:00.000Z'),
  paymentAmount: 500,
  paymentMethod: 'Insurance',
  referenceId: 'abc',
  reviewStatus: 'PENDING',
  source: 'PENDING_PAYMENT',
};

test('shows pending review status without offering an edit control', () => {
  render(
    <PaymentEntryHistoryTable
      headers={headers}
      rows={[pendingEntry]}
      totalCount={1}
      page={1}
      pageSize={10}
      isRefreshing={false}
      onPageChange={jest.fn()}
      onExport={jest.fn().mockResolvedValue([])}
    />,
  );

  expect(screen.getByText('Pending')).toBeInTheDocument();
  expect(screen.queryByRole('combobox', { name: 'Payment review status' })).not.toBeInTheDocument();
});
