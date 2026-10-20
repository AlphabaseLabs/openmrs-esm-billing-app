import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { showSnackbar } from '@openmrs/esm-framework';
import React from 'react';
import { PaymentStatus, type MappedBill, type PendingPayment } from '../../../types';
import {
  updatePaymentAttributes,
  updatePaymentDate,
  updatePendingPaymentReference,
  updatePendingPaymentStatus,
} from '../../../billing.resource';
import { editableCellStyles } from '../../../editable-carbon-table-cell-kit';
import { launchBillingWorkspace } from '../../../workspaces';
import PaymentHistory from './payment-history.component';
import styles from './payment-history.scss';

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
  updatePendingPaymentReference: jest.fn(),
  updatePendingPaymentStatus: jest.fn(),
}));

jest.mock('../../../workspaces', () => ({
  launchBillingWorkspace: jest.fn(),
}));

const mockShowSnackbar = showSnackbar as jest.MockedFunction<typeof showSnackbar>;
const mockUpdatePaymentAttributes = updatePaymentAttributes as jest.MockedFunction<typeof updatePaymentAttributes>;
const mockUpdatePaymentDate = updatePaymentDate as jest.MockedFunction<typeof updatePaymentDate>;
const mockUpdatePendingPaymentReference = updatePendingPaymentReference as jest.MockedFunction<
  typeof updatePendingPaymentReference
>;
const mockUpdatePendingPaymentStatus = updatePendingPaymentStatus as jest.MockedFunction<
  typeof updatePendingPaymentStatus
>;
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

const pendingPayment: PendingPayment = {
  uuid: 'request-1',
  bill: { uuid: bill.uuid },
  paymentMode: { uuid: 'insurance', name: 'Insurance', description: '', retired: false },
  amount: 100,
  amountTendered: 100,
  referenceCode: 'POLICY-123',
  status: 'PENDING',
  dateCreated: '2026-01-02T00:00:00.000Z',
};

describe('PaymentHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows each allocated line item and amount on hover and keyboard focus', async () => {
    const user = userEvent.setup();
    render(
      <PaymentHistory
        bill={{
          ...bill,
          payments: [
            {
              ...bill.payments[0],
              allocations: [
                { uuid: 'allocation-1', billLineItem: { uuid: 'line-1', display: 'Root canal' }, allocatedAmount: 70 },
                {
                  uuid: 'allocation-2',
                  billLineItem: { uuid: 'line-2', display: 'Consultation' },
                  allocatedAmount: 30,
                },
              ],
            },
          ],
        }}
      />,
    );

    const trigger = screen.getByRole('button', { name: '100.00' });
    expect(trigger).toHaveAttribute('type', 'button');
    expect(trigger).not.toHaveAttribute('aria-expanded', 'true');
    await user.hover(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-describedby');
    // JSDOM has no bounds for Carbon's auto-aligned popover; verify its content and open state.
    const row = within(trigger.closest('tr'));
    expect(row.getByText('Payment allocations')).toBeInTheDocument();
    expect(row.getByText('Root canal — 70.00')).toBeInTheDocument();
    expect(row.getByText('Consultation — 30.00')).toBeInTheDocument();

    await user.unhover(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    act(() => trigger.focus());
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('resolves UUID references and excludes voided, zero and invalid allocations on a closed bill', async () => {
    const user = userEvent.setup();
    render(
      <PaymentHistory
        bill={{
          ...bill,
          closed: true,
          lineItems: [{ uuid: 'line-1', display: 'Metal crown' }] as MappedBill['lineItems'],
          payments: [
            {
              ...bill.payments[0],
              allocations: [
                { billLineItem: 'line-1', allocatedAmount: 40 },
                { billLineItem: { uuid: 'missing', display: 'Archived service' }, allocatedAmount: 20 },
                { billLineItem: { uuid: 'line-2', display: 'Voided allocation' }, allocatedAmount: 50, voided: true },
                { billLineItem: { uuid: 'line-3', display: 'Zero allocation' }, allocatedAmount: 0 },
                { billLineItem: { uuid: 'line-4', display: 'Invalid allocation' }, allocatedAmount: NaN },
                { billLineItem: { uuid: 'line-5', display: 'Negative allocation' }, allocatedAmount: -1 },
              ],
            },
          ],
        }}
      />,
    );

    const trigger = screen.getByRole('button', { name: '100.00' });
    await user.hover(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const row = within(trigger.closest('tr'));
    expect(row.getByText('Metal crown — 40.00')).toBeInTheDocument();
    expect(row.getByText('Archived service — 20.00')).toBeInTheDocument();
    expect(
      row.queryByText(/Voided allocation|Zero allocation|Invalid allocation|Negative allocation/),
    ).not.toBeInTheDocument();
  });

  it.each([
    { allocations: undefined },
    { allocations: [] },
    { allocations: [{ billLineItem: 'line-1', allocatedAmount: 100, voided: true }] },
  ])('shows an explicit empty state when no active allocations are recorded (%j)', async ({ allocations }) => {
    const user = userEvent.setup();
    render(<PaymentHistory bill={{ ...bill, payments: [{ ...bill.payments[0], allocations }] }} />);
    const trigger = screen.getByRole('button', { name: '100.00' });
    await user.hover(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(within(trigger.closest('tr')).getByText('No allocations.')).toBeInTheDocument();
  });

  it('keeps allocation details scoped to each payment and handles missing line-item names', async () => {
    const user = userEvent.setup();
    render(
      <PaymentHistory
        bill={{
          ...bill,
          payments: [
            { ...bill.payments[0], allocations: [{ billLineItem: 'unknown', allocatedAmount: 75 }] },
            {
              ...bill.payments[0],
              uuid: 'payment-2',
              amountTendered: 200,
              allocations: [{ billLineItem: { uuid: 'line-2', display: 'Scaling' }, allocatedAmount: 150 }],
            },
          ],
        }}
      />,
    );
    const first = screen.getByRole('button', { name: '100.00' });
    const second = screen.getByRole('button', { name: '200.00' });
    await user.hover(first);
    expect(first).toHaveAttribute('aria-expanded', 'true');
    const firstRow = within(first.closest('tr'));
    expect(firstRow.getByText('Unknown line item — 75.00')).toBeInTheDocument();
    expect(firstRow.queryByText(/Scaling/)).not.toBeInTheDocument();
    await user.unhover(first);
    expect(first).toHaveAttribute('aria-expanded', 'false');
    await user.hover(second);
    expect(second).toHaveAttribute('aria-expanded', 'true');
    const secondRow = within(second.closest('tr'));
    expect(secondRow.getByText('Scaling — 150.00')).toBeInTheDocument();
    expect(secondRow.queryByText(/Unknown line item/)).not.toBeInTheDocument();
  });

  it('does not present allocations as active for a deleted payment', () => {
    render(
      <PaymentHistory
        bill={{
          ...bill,
          payments: [
            { ...bill.payments[0], voided: true, allocations: [{ billLineItem: 'line-1', allocatedAmount: 50 }] },
          ],
        }}
      />,
    );
    expect(screen.queryByText('Payment allocations')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '100.00' })).not.toBeInTheDocument();
  });

  it('does not display voided requests or an empty reference column for successful requests', () => {
    render(
      <PaymentHistory
        bill={{
          ...bill,
          pendingPayments: [
            { ...pendingPayment, voided: true },
            { ...pendingPayment, uuid: 'settled', status: 'SUCCESS', payment: payment as any },
          ],
        }}
      />,
    );
    expect(screen.queryByText('POLICY-123')).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Reference' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve payment' })).not.toBeInTheDocument();
  });

  it('blocks overlapping reviews across request rows until the current update completes', async () => {
    let resolveUpdate: (value: { ok: boolean }) => void;
    mockUpdatePendingPaymentStatus.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      }) as any,
    );
    render(
      <PaymentHistory
        bill={{
          ...bill,
          pendingPayments: [pendingPayment, { ...pendingPayment, uuid: 'request-2', referenceCode: 'POLICY-2' }],
        }}
      />,
    );
    const approveButtons = screen.getAllByRole('button', { name: 'Approve payment' });
    fireEvent.click(approveButtons[0]);
    fireEvent.click(approveButtons[1]);
    expect(mockUpdatePendingPaymentStatus).toHaveBeenCalledTimes(1);
    approveButtons.forEach((button) => expect(button).toBeDisabled());
    await act(async () => {
      resolveUpdate({ ok: true });
    });
    approveButtons.forEach((button) => expect(button).not.toBeDisabled());
  });

  it('does not approve while a reference edit is unsaved', async () => {
    const user = userEvent.setup();
    render(<PaymentHistory bill={{ ...bill, pendingPayments: [pendingPayment] }} />);
    await user.click(screen.getByRole('button', { name: pendingPayment.referenceCode }));
    const input = screen.getByRole('textbox', { name: /edit pending payment reference number/i });
    expect(input).toHaveAttribute('maxLength', '255');
    await user.type(input, '-NEW');
    expect(screen.getByRole('button', { name: 'Approve payment' })).toBeDisabled();
    await user.keyboard('{Escape}');
    expect(mockUpdatePendingPaymentReference).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Approve payment' })).not.toBeDisabled();
  });

  it('keeps rejection retryable on API failure and does not misreport a refresh failure after success', async () => {
    const user = userEvent.setup();
    mockUpdatePendingPaymentStatus.mockRejectedValueOnce({ responseBody: { error: { message: 'Review failed' } } });
    mockUpdatePendingPaymentStatus.mockResolvedValueOnce({ ok: true } as any);
    render(
      <PaymentHistory
        bill={{ ...bill, pendingPayments: [pendingPayment] }}
        onRefreshBill={jest.fn().mockRejectedValue(new Error('Refresh failed'))}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Reject payment' }));
    const dialog = screen.getByRole('dialog');
    const reason = within(dialog).getByLabelText('Rejection reason');
    expect(reason).toHaveAttribute('maxLength', '1024');
    await user.type(reason, 'Coverage declined');
    await user.click(within(dialog).getByRole('button', { name: /Reject payment$/ }));
    expect(reason).toHaveValue('Coverage declined');
    expect(mockShowSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'error', subtitle: 'Review failed' }),
    );
    await user.click(within(dialog).getByRole('button', { name: /Reject payment$/ }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(mockShowSnackbar).toHaveBeenLastCalledWith(expect.objectContaining({ kind: 'success' }));
  });

  it('uses the same column alignment classes for headings and payment values', () => {
    render(<PaymentHistory bill={{ ...bill, payments: [{ ...payment, amountTendered: 29999.5 } as any] }} />);

    const dateHeading = screen.getByRole('columnheader', { name: 'Date' });
    const amountHeading = screen.getByRole('columnheader', { name: 'Amount' });
    const dateCell = screen.getByText('01-Jan-2026').closest('td');
    const amountCell = screen.getByText('29,999.50').closest('td');
    const methodCell = screen.getByText('Cash').closest('td');

    expect(dateHeading).toHaveClass(styles.dateColumn);
    expect(dateCell).toHaveClass(styles.dateColumn);
    expect(amountHeading).toHaveClass(styles.amountColumn);
    expect(amountCell).toHaveClass(styles.amountColumn);
    expect(methodCell).toHaveTextContent('Cash');
    expect(methodCell).not.toHaveTextContent(/Paid|Pending|Rejected/);
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

  it('shows a pending insurance request without treating it as an actual payment', () => {
    render(
      <PaymentHistory
        bill={{
          ...bill,
          payments: [],
          pendingPayments: [
            {
              uuid: 'request-1',
              bill: { uuid: 'bill-1' },
              paymentMode: { uuid: 'insurance', name: 'Insurance', description: '', retired: false },
              amount: 300,
              amountTendered: 300,
              referenceCode: 'POLICY-123',
              status: 'PENDING',
              dateCreated: '2026-01-02T00:00:00.000Z',
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('Insurance')).toBeInTheDocument();
    expect(screen.getByText('POLICY-123')).toBeInTheDocument();
    const methodCell = screen.getByText('Insurance').closest('td');
    expect(methodCell).not.toBeNull();
    expect(within(methodCell as HTMLElement).queryByText(/Paid|Pending|Rejected/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve payment' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject payment' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveClass(styles.table);
    expect(screen.queryByRole('columnheader', { name: 'Status' })).not.toBeInTheDocument();
    expect(screen.queryByTestId(/delete-payment-button/)).not.toBeInTheDocument();
  });

  it('approves a pending request and refreshes the bill', async () => {
    const user = userEvent.setup();
    const onRefreshBill = jest.fn();
    mockUpdatePendingPaymentStatus.mockResolvedValueOnce({ ok: true } as Awaited<
      ReturnType<typeof updatePendingPaymentStatus>
    >);
    render(
      <PaymentHistory
        bill={{
          ...bill,
          pendingPayments: [
            {
              uuid: 'request-1',
              bill: { uuid: 'bill-1' },
              paymentMode: { uuid: 'insurance', name: 'Insurance', description: '', retired: false },
              amount: 300,
              amountTendered: 300,
              referenceCode: 'POLICY-123',
              status: 'PENDING',
              dateCreated: '2026-01-02T00:00:00.000Z',
            },
          ],
        }}
        onRefreshBill={onRefreshBill}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Approve payment' }));

    await waitFor(() => expect(mockUpdatePendingPaymentStatus).toHaveBeenCalledWith('request-1', 'SUCCESS', undefined));
    expect(onRefreshBill).toHaveBeenCalled();
  });

  it('requires and submits a reason when rejecting a pending request', async () => {
    const user = userEvent.setup();
    const onRefreshBill = jest.fn();
    mockUpdatePendingPaymentStatus.mockResolvedValueOnce({ ok: true } as Awaited<
      ReturnType<typeof updatePendingPaymentStatus>
    >);
    render(
      <PaymentHistory
        bill={{
          ...bill,
          pendingPayments: [
            {
              uuid: 'request-1',
              bill: { uuid: 'bill-1' },
              paymentMode: { uuid: 'insurance', name: 'Insurance', description: '', retired: false },
              amount: 300,
              amountTendered: 300,
              referenceCode: 'POLICY-123',
              status: 'PENDING',
              dateCreated: '2026-01-02T00:00:00.000Z',
            },
          ],
        }}
        onRefreshBill={onRefreshBill}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Reject payment' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Reject insurance payment' })).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /Reject payment$/ }));
    expect(await within(dialog).findByText('A rejection reason is required')).toBeInTheDocument();
    expect(mockUpdatePendingPaymentStatus).not.toHaveBeenCalled();

    await user.type(within(dialog).getByLabelText('Rejection reason'), '  Coverage was declined  ');
    await user.click(within(dialog).getByRole('button', { name: /Reject payment$/ }));

    await waitFor(() =>
      expect(mockUpdatePendingPaymentStatus).toHaveBeenCalledWith('request-1', 'REJECTED', 'Coverage was declined'),
    );
    expect(onRefreshBill).toHaveBeenCalled();
  });

  it('shows rejected requests at the bottom with their reason only in a hover or focus tooltip', async () => {
    const user = userEvent.setup();
    render(
      <PaymentHistory
        bill={{
          ...bill,
          pendingPayments: [
            {
              uuid: 'request-pending',
              bill: { uuid: 'bill-1' },
              paymentMode: { uuid: 'insurance', name: 'Insurance', description: '', retired: false },
              amount: 300,
              amountTendered: 300,
              referenceCode: 'POLICY-PENDING',
              status: 'PENDING',
              dateCreated: '2026-01-02T00:00:00.000Z',
            },
            {
              uuid: 'request-rejected',
              bill: { uuid: 'bill-1' },
              paymentMode: { uuid: 'insurance', name: 'Insurance', description: '', retired: false },
              amount: 400,
              amountTendered: 400,
              referenceCode: 'POLICY-REJECTED',
              status: 'REJECTED',
              reviewNote: 'Policy had expired',
              dateCreated: '2026-01-03T00:00:00.000Z',
            },
          ],
        }}
      />,
    );

    const pendingRow = screen.getByText('POLICY-PENDING').closest('tr');
    const rejectedRow = screen.getByText('POLICY-REJECTED').closest('tr');

    expect(rejectedRow).toHaveClass(styles.rejectedPaymentRow);
    expect(pendingRow.compareDocumentPosition(rejectedRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(rejectedRow).toHaveTextContent('Rejected');
    const rejectedTag = within(rejectedRow).getByText('Rejected').closest<HTMLElement>('.cds--tag');
    expect(rejectedTag).toHaveClass('cds--tag--sm', styles.reviewStatusTag);
    expect(rejectedTag.closest(`.${styles.paymentMethodContent}`)).toHaveTextContent('Insurance');
    expect(within(rejectedRow).queryByRole('tooltip')).not.toBeInTheDocument();
    expect(
      within(rejectedRow).getByText('Rejection reason: Policy had expired').closest('[role="tooltip"]'),
    ).toHaveAttribute('aria-hidden', 'true');
    expect(within(rejectedTag).getByText('Rejected').closest('[title]')).not.toHaveAttribute('title', 'Rejected');

    await user.hover(rejectedTag);
    expect(await within(rejectedRow).findByRole('tooltip')).toHaveTextContent('Rejection reason: Policy had expired');
    await user.unhover(rejectedTag);
    await waitFor(() => expect(within(rejectedRow).queryByRole('tooltip')).not.toBeInTheDocument());

    const trigger = rejectedTag.closest('[tabindex="0"]');
    act(() => (trigger as HTMLElement).focus());
    expect(trigger).toHaveFocus();
    expect(await within(rejectedRow).findByRole('tooltip')).toHaveTextContent('Rejection reason: Policy had expired');
    expect(trigger).toHaveAttribute('aria-describedby', within(rejectedRow).getByRole('tooltip').id);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(within(rejectedRow).queryByRole('tooltip')).not.toBeInTheDocument());
  });

  it.each([null, '   '])(
    'keeps rejected requests without a reason visible without an empty tooltip (%s)',
    (reviewNote) => {
      render(
        <PaymentHistory
          bill={{
            ...bill,
            pendingPayments: [{ ...pendingPayment, status: 'REJECTED', reviewNote }],
          }}
        />,
      );

      const rejectedRow = screen.getByText('POLICY-123').closest('tr');
      expect(within(rejectedRow).getByText('Rejected')).toBeInTheDocument();
      expect(within(rejectedRow).queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
    },
  );

  it('updates a pending insurance reference and refreshes the bill', async () => {
    const user = userEvent.setup();
    const onRefreshBill = jest.fn();
    mockUpdatePendingPaymentReference.mockResolvedValueOnce({ ok: true } as Awaited<
      ReturnType<typeof updatePendingPaymentReference>
    >);
    render(
      <PaymentHistory
        bill={{
          ...bill,
          payments: [],
          pendingPayments: [
            {
              uuid: 'request-1',
              bill: { uuid: 'bill-1' },
              paymentMode: { uuid: 'insurance', name: 'Insurance', description: '', retired: false },
              amount: 300,
              amountTendered: 300,
              referenceCode: 'POLICY-123',
              status: 'PENDING',
              dateCreated: '2026-01-02T00:00:00.000Z',
            },
          ],
        }}
        onRefreshBill={onRefreshBill}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'POLICY-123' }));
    const input = screen.getByRole('textbox', { name: /edit pending payment reference number/i });
    await user.clear(input);
    await user.type(input, '  POLICY-NEW  {Enter}');

    await waitFor(() => expect(mockUpdatePendingPaymentReference).toHaveBeenCalledWith('request-1', 'POLICY-NEW'));
    expect(onRefreshBill).toHaveBeenCalled();
    expect(mockShowSnackbar).toHaveBeenCalledWith({
      title: 'Payment reference updated',
      kind: 'success',
      subtitle: 'Payment reference updated successfully',
    });
  });

  it('shows a successful insurance request only on its linked payment row without a status badge', () => {
    render(
      <PaymentHistory
        bill={{
          ...bill,
          pendingPayments: [
            {
              uuid: 'request-1',
              bill: { uuid: 'bill-1' },
              paymentMode: { uuid: 'insurance', name: 'Insurance', description: '', retired: false },
              amount: 100,
              amountTendered: 100,
              referenceCode: 'POLICY-123',
              status: 'SUCCESS',
              payment: payment as any,
              dateCreated: '2026-01-02T00:00:00.000Z',
            },
          ],
        }}
      />,
    );

    expect(screen.queryByText(/Paid|Pending|Rejected/)).not.toBeInTheDocument();
    expect(screen.getAllByText('100.00')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Approve payment' })).not.toBeInTheDocument();
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
