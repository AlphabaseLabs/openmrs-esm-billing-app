import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { showModal, UserHasAccess } from '@openmrs/esm-framework';
import { mockBillData } from '../../__mocks__/bill.mock';
import { PaymentStatus } from '../types';
import { launchBillingWorkspace } from '../workspaces';
import { InvoiceActions } from './invoice-actions.component';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

jest.mock('@openmrs/esm-framework', () => ({
  restBaseUrl: '/ws/rest/v1',
  showModal: jest.fn(),
  UserHasAccess: jest.fn(({ children }: { children: React.ReactNode }) => children),
}));

jest.mock('../workspaces', () => ({
  launchBillingWorkspace: jest.fn(),
}));

const mockLaunchBillingWorkspace = launchBillingWorkspace as jest.MockedFunction<typeof launchBillingWorkspace>;
const mockUserHasAccess = UserHasAccess as jest.MockedFunction<typeof UserHasAccess>;

describe('InvoiceActions', () => {
  it('disables bill management actions for empty bills', () => {
    render(<InvoiceActions bill={{ ...mockBillData[0], lineItems: [] }} />);
    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    { closed: false, label: 'Close bill', action: 'close', privilege: 'Close Cashier Bills' },
    { closed: true, label: 'Reopen bill', action: 'reopen', privilege: 'Reopen Cashier Bills' },
  ])('preserves the confirmation and privilege for $label', async ({ closed, label, action, privilege }) => {
    const user = userEvent.setup();
    const bill = { ...mockBillData[0], closed, balance: 0 };
    render(<InvoiceActions bill={bill} />);

    await user.click(screen.getByRole('button', { name: label }));

    expect(mockUserHasAccess).toHaveBeenCalledWith(expect.objectContaining({ privilege }), expect.anything());
    expect(showModal).toHaveBeenCalledWith(
      'bill-action-modal',
      expect.objectContaining({ bill, action, closeModal: expect.any(Function) }),
    );
  });

  it('prevents closing an unpaid bill', () => {
    render(<InvoiceActions bill={{ ...mockBillData[0], closed: false, balance: 100 }} />);
    expect(screen.getByRole('button', { name: 'Close bill' })).toBeDisabled();
  });

  it.each([100, -100])('explains the disabled close action for balance %s using keyboard focus', async (balance) => {
    const user = userEvent.setup();
    render(<InvoiceActions bill={{ ...mockBillData[0], closed: false, balance }} />);

    await user.tab();

    const action = screen.getByRole('group', { name: 'Close bill' });
    expect(action).toHaveFocus();
    // Carbon hides floating content against JSDOM's zero-size reference rects.
    // Verify the open state and description link independently of visual geometry.
    const tooltip = await screen.findByRole('tooltip', { hidden: true });
    expect(action).toHaveAttribute('aria-describedby', tooltip.id);
    expect(tooltip).toHaveTextContent('The bill balance must be zero before it can be closed.');
    await waitFor(() => expect(tooltip).toHaveAttribute('aria-hidden', 'false'));
    expect(screen.getByRole('button', { name: 'Close bill' })).toBeDisabled();
    await user.keyboard('{Enter}');
    expect(showModal).not.toHaveBeenCalled();
  });

  it('explains why an empty bill cannot be closed', async () => {
    const user = userEvent.setup();
    render(<InvoiceActions bill={{ ...mockBillData[0], closed: false, lineItems: [], balance: 0 }} />);

    const action = screen.getByRole('group', { name: 'Close bill' });
    await user.hover(action);

    const tooltip = await screen.findByRole('tooltip', { hidden: true });
    expect(action).toHaveAttribute('aria-describedby', tooltip.id);
    expect(tooltip).toHaveTextContent('Bills without line items cannot be closed or reopened.');
    await waitFor(() => expect(tooltip).toHaveAttribute('aria-hidden', 'false'));
    expect(screen.getByRole('button', { name: 'Close bill' })).toBeDisabled();
  });

  it('keeps deletion behind the existing confirmation', async () => {
    const user = userEvent.setup();
    const bill = mockBillData[0];
    render(<InvoiceActions bill={bill} />);

    await user.click(screen.getByRole('button', { name: /delete bill/i }));

    expect(mockUserHasAccess).toHaveBeenCalledWith(
      expect.objectContaining({ privilege: 'Force Delete Cashier Bills' }),
      expect.anything(),
    );
    expect(showModal).toHaveBeenCalledWith(
      'delete-bill-modal',
      expect.objectContaining({ bill, isForceDelete: true, onClose: expect.any(Function) }),
    );
  });

  it('opens the existing waive bill workspace from the footer actions', async () => {
    const user = userEvent.setup();
    const bill = mockBillData[0];

    render(<InvoiceActions bill={bill} />);

    expect(screen.getByRole('button', { name: /waive bill/i })).toHaveClass('cds--btn--ghost');
    expect(screen.getByRole('button', { name: /delete bill/i })).toHaveClass('cds--btn--danger--ghost');
    await user.click(screen.getByRole('button', { name: /waive bill/i }));

    expect(mockUserHasAccess).toHaveBeenCalledWith(
      expect.objectContaining({ privilege: 'Manage Cashier Bills' }),
      expect.anything(),
    );
    expect(mockLaunchBillingWorkspace).toHaveBeenCalledWith('waive-bill-form', { bill });
  });

  it('shows waive bill for closed unpaid bills', async () => {
    const bill = { ...mockBillData[0], closed: true, status: PaymentStatus.PENDING };

    render(<InvoiceActions bill={bill} />);

    expect(screen.getByRole('button', { name: /waive bill/i })).toBeInTheDocument();
  });

  it('does not show waive bill for paid bills', async () => {
    const bill = { ...mockBillData[0], status: PaymentStatus.PAID };

    render(<InvoiceActions bill={bill} />);

    expect(screen.queryByRole('button', { name: /waive bill/i })).not.toBeInTheDocument();
  });
});
