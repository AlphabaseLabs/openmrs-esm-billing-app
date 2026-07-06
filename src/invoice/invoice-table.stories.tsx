import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, within } from 'storybook/test';
import InvoiceTable from './invoice-table.component';
import { type LineItem, type MappedBill } from '../types';
import {
  closedBill,
  discountedPendingBill,
  openPendingBill,
  selectedUnpaidLineItems,
  shortValuePendingBill,
} from './invoice-story.fixtures';
import { recomputeBillWithLineItem } from './editable-line-item-cells';

type InvoiceTableStoryArgs = React.ComponentProps<typeof InvoiceTable>;

const StatefulInvoiceTable = (args: InvoiceTableStoryArgs) => {
  const [bill, setBill] = useState<MappedBill>(args.bill);
  const [selectedLineItems, setSelectedLineItems] = useState<Array<LineItem>>(args.selectedLineItems ?? []);

  useEffect(() => {
    setBill(args.bill);
    setSelectedLineItems(args.selectedLineItems ?? []);
  }, [args.bill, args.selectedLineItems]);

  return (
    <InvoiceTable
      {...args}
      bill={bill}
      selectedLineItems={selectedLineItems}
      onSelectItem={setSelectedLineItems}
      onLineItemUpdated={(lineItem) => setBill((currentBill) => recomputeBillWithLineItem(currentBill, lineItem))}
    />
  );
};

const meta: Meta<typeof InvoiceTable> = {
  title: 'Billing/InvoiceTable',
  component: InvoiceTable,
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

type Story = StoryObj<typeof InvoiceTable>;

export const Default: Story = {
  args: {
    bill: openPendingBill,
    isSelectable: true,
    isLoadingBill: false,
    selectedLineItems: [],
  },
  render: StatefulInvoiceTable,
};

export const MixedStatusRows: Story = {
  args: {
    bill: discountedPendingBill,
    isSelectable: true,
    isLoadingBill: false,
    selectedLineItems: [],
  },
  render: StatefulInvoiceTable,
};

export const StableGeometryShortValues: Story = {
  args: {
    bill: shortValuePendingBill,
    isSelectable: true,
    isLoadingBill: false,
    selectedLineItems: [],
  },
  render: StatefulInvoiceTable,
};

export const StableGeometryLongValues: Story = {
  args: {
    bill: openPendingBill,
    isSelectable: true,
    isLoadingBill: false,
    selectedLineItems: [],
  },
  render: StatefulInvoiceTable,
};

export const SelectedRows: Story = {
  args: {
    bill: discountedPendingBill,
    isSelectable: true,
    isLoadingBill: false,
    selectedLineItems: selectedUnpaidLineItems,
  },
  render: StatefulInvoiceTable,
};

export const ClosedBill: Story = {
  args: {
    bill: closedBill,
    isSelectable: true,
    isLoadingBill: false,
    selectedLineItems: [],
  },
  render: StatefulInvoiceTable,
};

export const Loading: Story = {
  args: {
    bill: openPendingBill,
    isSelectable: true,
    isLoadingBill: true,
    selectedLineItems: [],
  },
};

export const PricePickerOpen: Story = {
  args: {
    bill: openPendingBill,
    isSelectable: true,
    isLoadingBill: false,
    selectedLineItems: [],
  },
  render: StatefulInvoiceTable,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByLabelText(/select price option/i));
    await expect(
      await within(canvasElement.ownerDocument.body).findByRole('dialog', { name: /price options/i }),
    ).toBeInTheDocument();
  },
};

export const DiscountFormOpen: Story = {
  args: {
    bill: openPendingBill,
    isSelectable: true,
    isLoadingBill: false,
    selectedLineItems: [],
  },
  render: StatefulInvoiceTable,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByLabelText(/open discount editor/i));
    await expect(
      await within(canvasElement.ownerDocument.body).findByRole('dialog', { name: /discount form/i }),
    ).toBeInTheDocument();
  },
};

export const BillItemPopoverOpen: Story = {
  args: {
    bill: openPendingBill,
    isSelectable: true,
    isLoadingBill: false,
    selectedLineItems: [],
  },
  render: StatefulInvoiceTable,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: /clear aligner/i }));
    await expect(
      await within(canvasElement.ownerDocument.body).findByRole('dialog', { name: /bill item options/i }),
    ).toBeInTheDocument();
  },
};

export const InvalidPriceInlineEdit: Story = {
  args: {
    bill: openPendingBill,
    isSelectable: true,
    isLoadingBill: false,
    selectedLineItems: [],
  },
  render: StatefulInvoiceTable,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: /249,999/i }));
    const input = await canvas.findByRole('textbox', { name: /price/i });
    await userEvent.clear(input);
    await userEvent.type(input, '-1{Enter}');
    await expect(await canvas.findByText(/enter a valid price/i)).toBeInTheDocument();
  },
};

export const ConstrainedOverflow: Story = {
  args: {
    bill: openPendingBill,
    isSelectable: true,
    isLoadingBill: false,
    selectedLineItems: [],
  },
  decorators: [
    (Story) => (
      <div style={{ background: '#f4f4f4', height: '24rem', overflow: 'auto', padding: '2rem', width: '44rem' }}>
        <Story />
      </div>
    ),
  ],
  render: StatefulInvoiceTable,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByLabelText(/select price option/i));
    await expect(
      await within(canvasElement.ownerDocument.body).findByRole('dialog', { name: /price options/i }),
    ).toBeInTheDocument();
  },
};
