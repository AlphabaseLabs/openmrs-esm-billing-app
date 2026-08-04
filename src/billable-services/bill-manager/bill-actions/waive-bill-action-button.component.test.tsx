import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserHasAccess } from '@openmrs/esm-framework';
import { mockBillData } from '../../../../__mocks__/bill.mock';
import { PaymentStatus } from '../../../types';
import { launchBillingWorkspace } from '../../../workspaces';
import WaiveBillActionButton from './waive-bill-action-button.component';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

jest.mock('@openmrs/esm-framework', () => ({
  UserHasAccess: jest.fn(({ children }: { children: React.ReactNode }) => children),
}));

jest.mock('../../../workspaces', () => ({
  launchBillingWorkspace: jest.fn(),
}));

const mockLaunchBillingWorkspace = launchBillingWorkspace as jest.MockedFunction<typeof launchBillingWorkspace>;
const mockUserHasAccess = UserHasAccess as jest.MockedFunction<typeof UserHasAccess>;

describe('WaiveBillActionButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires Manage Cashier Bills and opens the waive bill workspace', async () => {
    const user = userEvent.setup();
    const bill = mockBillData[0];

    render(<WaiveBillActionButton bill={bill} />);

    await user.click(screen.getByRole('button', { name: /waive bill/i }));

    expect(mockUserHasAccess).toHaveBeenCalledWith(
      expect.objectContaining({ privilege: 'Manage Cashier Bills' }),
      expect.anything(),
    );
    expect(mockLaunchBillingWorkspace).toHaveBeenCalledWith('waive-bill-form', { bill });
  });

  it('shows waive bill for closed unpaid bills', () => {
    const bill = { ...mockBillData[0], closed: true, status: PaymentStatus.PENDING };

    render(<WaiveBillActionButton bill={bill} />);

    expect(screen.getByRole('button', { name: /waive bill/i })).toBeInTheDocument();
  });

  it('does not show waive bill for paid bills', () => {
    const bill = { ...mockBillData[0], status: PaymentStatus.PAID };

    render(<WaiveBillActionButton bill={bill} />);

    expect(screen.queryByRole('button', { name: /waive bill/i })).not.toBeInTheDocument();
  });
});
