import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import BillDetails from './bill-details.component';
import { closedBill, discountedPendingBill, openPendingBill, paidBill } from './invoice-story.fixtures';

const meta: Meta<typeof BillDetails> = {
  title: 'Billing/BillDetails',
  component: BillDetails,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ background: '#f4f4f4', minHeight: '100vh', paddingBlock: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof BillDetails>;

export const DefaultPendingBill: Story = {
  args: {
    bill: openPendingBill,
    isLoadingBill: false,
    showDiscardButton: true,
  },
};

export const WithExistingLineItemDiscounts: Story = {
  args: {
    bill: discountedPendingBill,
    isLoadingBill: false,
    showDiscardButton: true,
  },
};

export const PaidBill: Story = {
  args: {
    bill: paidBill,
    isLoadingBill: false,
    showDiscardButton: true,
  },
};

export const ClosedBill: Story = {
  args: {
    bill: closedBill,
    isLoadingBill: false,
    showDiscardButton: true,
  },
};
