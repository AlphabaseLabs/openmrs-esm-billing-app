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
import { LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY } from './line-item-column-visibility';

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

const renderStatefulInvoiceTable = (visibleOptionalColumns?: Array<string>) => (args: InvoiceTableStoryArgs) => {
  if (typeof window !== 'undefined') {
    if (visibleOptionalColumns) {
      window.localStorage.setItem(LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(visibleOptionalColumns));
    } else {
      window.localStorage.removeItem(LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY);
    }
  }

  return <StatefulInvoiceTable {...args} />;
};

const getInvoiceTable = (canvasElement: HTMLElement) =>
  canvasElement.querySelector('table[aria-label="Invoice line items"]') as HTMLTableElement;

const expectInvoiceTableColumnsToAlign = async (canvasElement: HTMLElement) => {
  const table = getInvoiceTable(canvasElement);
  const columnCount = table.querySelectorAll('col').length;

  await expect(columnCount).toBe(table.querySelectorAll('thead th').length);
  await expect(columnCount).toBe(table.querySelector('tbody tr')?.children.length ?? 0);
};

const expectActionColumnToRemainFixed = async (canvasElement: HTMLElement) => {
  const table = getInvoiceTable(canvasElement);
  const columns = Array.from(table.querySelectorAll('col'));

  await expect((columns[columns.length - 1] as HTMLTableColElement).style.width).toBe('144px');
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
  render: renderStatefulInvoiceTable(),
};

export const MixedStatusRows: Story = {
  args: {
    bill: discountedPendingBill,
    isSelectable: true,
    isLoadingBill: false,
    selectedLineItems: [],
  },
  render: renderStatefulInvoiceTable(),
};

export const StableGeometryShortValues: Story = {
  args: {
    bill: shortValuePendingBill,
    isSelectable: true,
    isLoadingBill: false,
    selectedLineItems: [],
  },
  render: renderStatefulInvoiceTable(),
};

export const StableGeometryLongValues: Story = {
  args: {
    bill: openPendingBill,
    isSelectable: true,
    isLoadingBill: false,
    selectedLineItems: [],
  },
  render: renderStatefulInvoiceTable(),
};

export const SelectedRows: Story = {
  args: {
    bill: discountedPendingBill,
    isSelectable: true,
    isLoadingBill: false,
    selectedLineItems: selectedUnpaidLineItems,
  },
  render: renderStatefulInvoiceTable(),
};

export const ClosedBill: Story = {
  args: {
    bill: closedBill,
    isSelectable: true,
    isLoadingBill: false,
    selectedLineItems: [],
  },
  render: renderStatefulInvoiceTable(),
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
  render: renderStatefulInvoiceTable(),
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
  render: renderStatefulInvoiceTable(),
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
  render: renderStatefulInvoiceTable(),
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
  render: renderStatefulInvoiceTable(),
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
  render: renderStatefulInvoiceTable(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByLabelText(/select price option/i));
    await expect(
      await within(canvasElement.ownerDocument.body).findByRole('dialog', { name: /price options/i }),
    ).toBeInTheDocument();
  },
};

export const CompactColumnVisibility: Story = {
  args: {
    bill: openPendingBill,
    isSelectable: true,
    isLoadingBill: false,
    selectedLineItems: [],
  },
  render: renderStatefulInvoiceTable(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: /columns/i }));
    await userEvent.click(await canvas.findByRole('checkbox', { name: /status/i }));
    await userEvent.click(await canvas.findByRole('checkbox', { name: /discount/i }));
    await userEvent.click(await canvas.findByRole('checkbox', { name: /tax/i }));
    await expect(canvas.queryByRole('columnheader', { name: /status/i })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('columnheader', { name: /discount/i })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('columnheader', { name: /tax/i })).not.toBeInTheDocument();
    await expect(canvas.getByRole('columnheader', { name: /bill item/i })).toBeInTheDocument();
    await expect(canvas.getByRole('columnheader', { name: /^price$/i })).toBeInTheDocument();
    await expect(canvas.getByRole('columnheader', { name: /^total$/i })).toBeInTheDocument();
  },
};

export const RestoredPersistedColumnPreferences: Story = {
  args: {
    bill: openPendingBill,
    isSelectable: true,
    isLoadingBill: false,
    selectedLineItems: [],
  },
  render: renderStatefulInvoiceTable(['no', 'quantity']),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('columnheader', { name: /status/i })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('columnheader', { name: /discount/i })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('columnheader', { name: /tax/i })).not.toBeInTheDocument();
    await expect(canvas.getByRole('columnheader', { name: /number/i })).toBeInTheDocument();
    await expect(canvas.getByRole('columnheader', { name: /quantity/i })).toBeInTheDocument();
  },
};

export const TaxHiddenColumnRedistribution: Story = {
  args: {
    bill: openPendingBill,
    isSelectable: true,
    isLoadingBill: false,
    selectedLineItems: [],
  },
  render: renderStatefulInvoiceTable(['no', 'status', 'quantity', 'discount']),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('columnheader', { name: /tax/i })).not.toBeInTheDocument();
    await expect(canvas.getByRole('columnheader', { name: /discount/i })).toBeInTheDocument();
    await expectInvoiceTableColumnsToAlign(canvasElement);
    await expectActionColumnToRemainFixed(canvasElement);
  },
};

export const FinancialColumnsHiddenRedistribution: Story = {
  args: {
    bill: openPendingBill,
    isSelectable: true,
    isLoadingBill: false,
    selectedLineItems: [],
  },
  render: renderStatefulInvoiceTable(['no', 'status', 'quantity']),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('columnheader', { name: /discount/i })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('columnheader', { name: /tax/i })).not.toBeInTheDocument();
    await expect(canvas.getByRole('columnheader', { name: /^price$/i })).toBeInTheDocument();
    await expectInvoiceTableColumnsToAlign(canvasElement);
    await expectActionColumnToRemainFixed(canvasElement);
  },
};

export const NarrowCompactColumnRedistribution: Story = {
  args: {
    bill: openPendingBill,
    isSelectable: true,
    isLoadingBill: false,
    selectedLineItems: [],
  },
  decorators: [
    (Story) => (
      <div style={{ background: '#f4f4f4', overflow: 'auto', padding: '2rem', width: '48rem' }}>
        <Story />
      </div>
    ),
  ],
  render: renderStatefulInvoiceTable(['no', 'quantity']),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('columnheader', { name: /status/i })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('columnheader', { name: /discount/i })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('columnheader', { name: /tax/i })).not.toBeInTheDocument();
    await expect(canvas.getByRole('columnheader', { name: /quantity/i })).toBeInTheDocument();
    await expectInvoiceTableColumnsToAlign(canvasElement);
    await expectActionColumnToRemainFixed(canvasElement);
  },
};
