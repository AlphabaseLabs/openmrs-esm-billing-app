import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import Payments from './payments.component';
import {
  discountedPendingBill,
  openPendingBill,
  paidBill,
  pendingBillWithCashPayment,
  partiallyPaidBill,
  selectedUnpaidLineItems,
} from '../invoice-story.fixtures';

const meta: Meta<typeof Payments> = {
  title: 'Billing/Payments',
  component: Payments,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ background: '#f4f4f4', minHeight: '100vh', padding: '2rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof Payments>;

export const DefaultPendingBill: Story = {
  args: {
    bill: pendingBillWithCashPayment,
    selectedLineItems: [],
    showDiscardButton: true,
  },
};

export const SelectedLineItems: Story = {
  args: {
    bill: discountedPendingBill,
    selectedLineItems: selectedUnpaidLineItems,
    showDiscardButton: true,
  },
};

export const ExistingDiscountAndTaxSummary: Story = {
  args: {
    bill: discountedPendingBill,
    selectedLineItems: selectedUnpaidLineItems,
    showDiscardButton: true,
  },
};

export const PartiallyPaidAmountDue: Story = {
  args: {
    bill: partiallyPaidBill,
    selectedLineItems: selectedUnpaidLineItems,
    showDiscardButton: true,
  },
};

export const PaidBill: Story = {
  args: {
    bill: paidBill,
    selectedLineItems: [],
    showDiscardButton: true,
  },
};
