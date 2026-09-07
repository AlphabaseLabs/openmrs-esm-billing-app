import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { showSnackbar } from '@openmrs/esm-framework';
import React from 'react';
import { PaymentStatus, type MappedBill } from '../../../types';
import { updatePaymentAttributes, updatePaymentDate } from '../../../billing.resource';
import { editableCellStyles } from '../../../editable-carbon-table-cell-kit';
import { launchBillingWorkspace } from '../../../workspaces';
import PaymentHistory from './payment-history.component';

jest.mock('@openmrs/esm-framework', () => ({
  formatDate: jest.fn(() => '01-Jan-2026'),
  getCoreTranslation: jest.fn((_key: string, fallback: string) => fallback),
  showSnackbar: jest.fn(),
  UserHasAccess: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

jest.mock('../../../billing.resource', () => ({
  updatePaymentAttributes: jest.fn(),
  updatePaymentDate: jest.fn(),
}));

jest.mock('../../../workspaces', () => ({
  launchBillingWorkspace: jest.fn(),
}));

const mockShowSnackbar = showSnackbar as jest.MockedFunction<typeof showSnackbar>;
const mockUpdatePaymentAttributes = updatePaymentAttributes as jest.MockedFunction<typeof updatePaymentAttributes>;
const mockUpdatePaymentDate = updatePaymentDate as jest.MockedFunction<typeof updatePaymentDate>;
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

  it('updates an active payment date and refreshes the bill', async () => {
    const user = userEvent.setup();
    const onRefreshBill = jest.fn();
    mockUpdatePaymentDate.mockResolvedValueOnce({ ok: true } as Awaited<ReturnType<typeof updatePaymentDate>>);

    render(<PaymentHistory bill={bill} onRefreshBill={onRefreshBill} />);

    fireEvent.change(screen.getByLabelText(/edit payment date input/i), { target: { value: '2026-01-05' } });

    await waitFor(() => {
      expect(mockUpdatePaymentDate).toHaveBeenCalledWith(
        'bill-1',
        'payment-1',
        new Date('2026-01-05T00:00:00.000Z').getTime(),
      );
    });
    expect(onRefreshBill).toHaveBeenCalled();
    expect(mockShowSnackbar).toHaveBeenCalledWith({
      title: 'Payment date updated',
      kind: 'success',
      subtitle: 'Payment date updated successfully',
    });
  });

  it('updates an active payment reference and refreshes the bill', async () => {
    const user = userEvent.setup();
    const onRefreshBill = jest.fn();
    const paymentWithReferences = {
      ...payment,
      attributes: [
        {
          uuid: 'reference-attribute-1',
          value: '6640',
          attributeType: { uuid: 'transaction-id', name: 'Transaction Id' },
        },
        {
          uuid: 'reference-attribute-2',
          value: 'BANK-1',
          attributeType: { uuid: 'bank-id', name: 'Bank Id' },
        },
      ],
    };
    mockUpdatePaymentAttributes.mockResolvedValueOnce({
      ok: true,
    } as Awaited<ReturnType<typeof updatePaymentAttributes>>);

    render(
      <PaymentHistory bill={{ ...bill, payments: [paymentWithReferences as any] }} onRefreshBill={onRefreshBill} />,
    );

    await user.click(screen.getByRole('button', { name: '6640' }));
    const input = screen.getByRole('textbox', { name: /edit payment reference number/i });
    expect(input).toHaveClass(editableCellStyles.inlineTextEditor);
    expect(input.closest('[data-testid="editable-text-cell"]')).not.toHaveClass(editableCellStyles.activeEditableCell);
    await user.clear(input);
    await user.type(input, '6641{Enter}');

    await waitFor(() => {
      expect(mockUpdatePaymentAttributes).toHaveBeenCalledWith('bill-1', 'payment-1', [
        { uuid: 'reference-attribute-1', attributeType: 'transaction-id', value: '6641' },
        { uuid: 'reference-attribute-2', attributeType: 'bank-id', value: 'BANK-1' },
      ]);
    });
    expect(onRefreshBill).toHaveBeenCalled();
    expect(mockShowSnackbar).toHaveBeenCalledWith({
      title: 'Payment reference updated',
      kind: 'success',
      subtitle: 'Payment reference updated successfully',
    });
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
    expect(screen.queryByLabelText(/edit payment date input/i)).not.toBeInTheDocument();
  });

  it('keeps payment references read-only for closed bills', () => {
    render(
      <PaymentHistory
        bill={{
          ...bill,
          closed: true,
          payments: [
            {
              ...payment,
              attributes: [
                {
                  uuid: 'reference-attribute-1',
                  value: '6640',
                  attributeType: { uuid: 'transaction-id', name: 'Transaction Id' },
                },
              ],
            } as any,
          ],
        }}
      />,
    );

    expect(screen.queryByRole('button', { name: '6640' })).not.toBeInTheDocument();
    expect(screen.getByText('6640')).toBeInTheDocument();
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
