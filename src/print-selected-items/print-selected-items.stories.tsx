import React from 'react';
import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, within } from 'storybook/test';
import PrintSelectedItemsModal from './print-selected-items.modal';
import { createLineItem, openPendingBill } from '../invoice/invoice-story.fixtures';

const bill = {
  ...openPendingBill,
  patientName: 'Sample Patient',
  receiptNumber: 'INV-2026-104',
  lineItems: [
    createLineItem({
      uuid: 'consultation',
      item: 'Consultation',
      paymentStatus: 'PAID',
      price: 3000,
      quantity: 1,
      total: 3000,
      dateCreated: '2026-10-04T09:00:00',
    }),
    createLineItem({
      uuid: 'filling',
      item: 'Composite Filling',
      paymentStatus: 'POSTED',
      price: 25000,
      quantity: 2,
      total: 50000,
      dateCreated: '2026-10-03T09:00:00',
    }),
    createLineItem({
      uuid: 'scaling',
      item: 'Scaling + Polishing',
      paymentStatus: 'PENDING',
      price: 20000,
      quantity: 1,
      total: 20000,
      dateCreated: '2026-10-03T09:00:00',
    }),
    createLineItem({
      uuid: 'review',
      item: 'Follow-up Review',
      paymentStatus: 'EXEMPTED',
      price: 0,
      quantity: 1,
      total: 0,
      dateCreated: '2026-10-02T09:00:00',
    }),
  ],
};

const meta: Meta<typeof PrintSelectedItemsModal> = {
  title: 'Billing/Print selected items',
  component: PrintSelectedItemsModal,
  args: { bill, onClose: () => {} },
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div
        style={
          {
            '--brand-01': '#008080',
            '--cds-button-primary': '#008080',
            '--cds-button-tertiary': '#008080',
          } as React.CSSProperties
        }>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof PrintSelectedItemsModal>;
export const Default: Story = {};
export const ConsultationSelected: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole('checkbox', { name: 'Select Consultation to print' }));
    await expect(page.getByRole('button', { name: 'Print' })).toBeEnabled();
  },
};
export const Expanded: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole('button', { name: 'Expand' }));
  },
};
