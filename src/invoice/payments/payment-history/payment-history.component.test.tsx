import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { PaymentStatus, type MappedBill } from '../../../types';
import { launchBillingWorkspace } from '../../../workspaces';
import PaymentHistory from './payment-history.component';

jest.mock('@openmrs/esm-framework', () => ({
  formatDate: jest.fn(() => '01-Jan-2026'),
  getCoreTranslation: jest.fn((_key: string, fallback: string) => fallback),
  UserHasAccess: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../../workspaces', () => ({
  launchBillingWorkspace: jest.fn(),
}));

const mockLaunchBillingWorkspace = launchBillingWorkspace as jest.MockedFunction<typeof launchBillingWorkspace>;

const payment = {
  uuid: 'payment-1',
  amount: 100,
  amountTendered: 100,
  dateCreated: '2026-01-01T00:00:00.000Z',
  instanceType: {
    uuid: 'cash',
    name: 'Cash',
  },
  attributes: [],
  allocations: [],
  voided: false,
  voidReason: null,
};

const bill: MappedBill = {
  uuid: 'bill-1',
  id: 1,
  patientUuid: 'patient-1',
  patientName: 'Test Patient',
  cashPointUuid: 'cash-point-1',
  cashPointName: 'Cash Point',
  cashPointLocation: 'Main',
  cashier: { uuid: 'provider-1', display: 'Provider', links: [] },
  receiptNumber: 'INV-1',
  status: PaymentStatus.PAID,
  identifier: 'ABC123',
  dateCreated: '2026-01-01T00:00:00.000Z',
  dateCreatedUnformatted: '2026-01-01T00:00:00.000Z',
  lineItems: [],
  billingService: 'Billing',
  payments: [payment as any],
  closed: false,
};

describe('PaymentHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the delete payment action for a paid bill that is still open', async () => {
    const user = userEvent.setup();
    render(<PaymentHistory bill={bill} />);

    const deleteButton = screen.getByTestId('delete-payment-button-payment-1');
    expect(deleteButton).toBeInTheDocument();

    await user.click(deleteButton);

    expect(mockLaunchBillingWorkspace).toHaveBeenCalledWith('delete-payment-workspace', {
      bill,
      payment,
    });
  });

  it('hides the delete payment action for a closed bill', () => {
    render(<PaymentHistory bill={{ ...bill, closed: true }} />);

    expect(screen.queryByTestId('delete-payment-button-payment-1')).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Actions' })).not.toBeInTheDocument();
  });

  it('shows voided payments as read-only muted rows at the bottom', async () => {
    const user = userEvent.setup();
    const activePayment = {
      ...payment,
      uuid: 'payment-active',
      dateCreated: '2026-01-01T00:00:00.000Z',
      instanceType: {
        uuid: 'card',
        name: 'Card',
      },
    };
    const voidedPayment = {
      ...payment,
      uuid: 'payment-voided',
      dateCreated: '2026-01-02T00:00:00.000Z',
      voided: true,
    };

    render(<PaymentHistory bill={{ ...bill, payments: [voidedPayment as any, activePayment as any] }} />);

    const activeRow = screen.getByTestId('delete-payment-button-payment-active').closest('tr');
    const voidedRow = screen.getByTestId('delete-payment-button-payment-voided').closest('tr');

    expect(voidedRow).toHaveClass('voidedPaymentRow');
    expect(activeRow.compareDocumentPosition(voidedRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(screen.queryByTestId('voided-payment-tooltip-payment-voided')).not.toBeInTheDocument();

    await user.hover(voidedRow);
    expect(screen.getAllByTestId('voided-payment-tooltip-payment-voided')).toHaveLength(1);
    expect(
      await screen.findByText('Deleted payments are retained for record-keeping and cannot be modified.'),
    ).toBeInTheDocument();

    const deleteButton = screen.getByTestId('delete-payment-button-payment-voided');
    expect(deleteButton).toBeDisabled();

    await user.click(deleteButton);

    expect(mockLaunchBillingWorkspace).not.toHaveBeenCalled();
  });
});
