import React from 'react';
import { render, screen } from '@testing-library/react';
import MetricsCards from './metrics-cards.component';

jest.mock('@openmrs/esm-patient-common-lib', () => ({
  ErrorState: ({ headerTitle }) => <div>{headerTitle}</div>,
}));

describe('MetricsCards', () => {
  test('renders metrics for the provided bills', () => {
    render(
      <MetricsCards
        bills={[
          {
            id: 1,
            uuid: 'paid-bill',
            patientUuid: 'patient-1',
            patientName: 'Jane Doe',
            cashPointUuid: 'cash-point',
            cashPointName: 'Main Cash Point',
            cashPointLocation: 'Main Facility',
            cashier: { uuid: 'cashier-1', display: 'Cashier 1', links: [] },
            receiptNumber: 'REC-001',
            status: 'PAID' as any,
            identifier: 'PAT-001',
            dateCreated: '01-Jan-2026, 08:00 AM',
            dateCreatedUnformatted: '2026-01-01T08:00:00.000Z',
            lineItems: [],
            billingService: 'Consultation',
            payments: [
              {
                uuid: 'payment-cash',
                instanceType: { uuid: 'cash', name: 'Cash', description: '', retired: false },
                attributes: [],
                amount: 30,
                amountTendered: 30,
                dateCreated: Date.now(),
                voided: false,
                resourceVersion: '1',
              },
            ],
            totalAmount: 100,
            totalWaived: 10,
            totalActualPayments: 100,
            totalTax: 5,
          },
          {
            id: 2,
            uuid: 'pending-bill',
            patientUuid: 'patient-2',
            patientName: 'John Doe',
            cashPointUuid: 'cash-point',
            cashPointName: 'Main Cash Point',
            cashPointLocation: 'Main Facility',
            cashier: { uuid: 'cashier-2', display: 'Cashier 2', links: [] },
            receiptNumber: 'REC-002',
            status: 'PENDING' as any,
            identifier: 'PAT-002',
            dateCreated: '02-Jan-2026, 09:00 AM',
            dateCreatedUnformatted: '2026-01-02T09:00:00.000Z',
            lineItems: [],
            billingService: 'Laboratory',
            payments: [],
            totalAmount: 50,
            totalWaived: 0,
            totalActualPayments: 0,
            totalTax: 0,
            balance: 50,
          },
        ]}
      />,
    );

    expect(screen.getByText('Total Bills')).toBeInTheDocument();
    expect(screen.getByText('Pending Bills')).toBeInTheDocument();
    expect(screen.getByText('Collection')).toBeInTheDocument();
    expect(screen.getByText('Waived/Discounts Bills')).toBeInTheDocument();
    expect(screen.getByText('Tax Collection')).toBeInTheDocument();
    expect(screen.getByText('Total Bills').closest('.cds--tile')).toHaveTextContent('150.00');
    expect(screen.getByText('Pending Bills').closest('.cds--tile')).toHaveTextContent('50.00');
    expect(screen.getByText('Collection').closest('.cds--tile')).toHaveTextContent('30.00');
    expect(screen.getByText('Waived/Discounts Bills').closest('.cds--tile')).toHaveTextContent('10.00');
    expect(screen.getByText('Tax Collection').closest('.cds--tile')).toHaveTextContent('5.00');
  });

  test('shows a loading state while metrics are being calculated', () => {
    render(<MetricsCards bills={[]} isLoading />);

    expect(screen.getByText('Loading bill metrics...')).toBeInTheDocument();
  });

  test('shows an error state when metrics cannot be loaded', () => {
    render(<MetricsCards bills={[]} error={new Error('Unable to load')} />);

    expect(screen.getByText('Bill metrics')).toBeInTheDocument();
  });
});
