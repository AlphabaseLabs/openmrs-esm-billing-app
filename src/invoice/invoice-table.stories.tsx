import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import InvoiceTable from './invoice-table.component';
import { type LineItem, type MappedBill, PaymentStatus } from '../types';

const createLineItem = (overrides: Partial<LineItem>): LineItem =>
  ({
    uuid: 'line-item',
    display: 'Line item',
    dateCreated: '2026-06-16T10:30:00.000Z',
    auditInfo: {
      dateCreated: '2026-06-16T10:30:00.000Z',
    },
    voided: false,
    voidReason: null,
    item: 'service-consultation:Consultation',
    billableService: 'service-consultation:Consultation',
    quantity: 1,
    price: 2000,
    priceName: 'Default',
    priceUuid: 'price-consultation',
    lineItemOrder: 0,
    resourceVersion: '1.9',
    paymentStatus: PaymentStatus.PENDING,
    itemOrServiceConceptUuid: 'concept-consultation',
    serviceTypeUuid: 'service-type-clinical',
    order: {} as LineItem['order'],
    discounts: [],
    taxes: [],
    ...overrides,
  }) as LineItem;

const openLineItems: Array<LineItem> = [
  createLineItem({
    uuid: 'line-item-consultation',
    display: 'Consultation',
    item: 'service-consultation:Consultation',
    billableService: 'service-consultation:Consultation',
    quantity: 1,
    price: 2000,
    priceUuid: 'price-consultation',
    lineItemOrder: 0,
    paymentStatus: PaymentStatus.PENDING,
    discounts: [
      {
        amount: 200,
        baseAmount: 2000,
        description: 'Practice discount',
        sponsor: 'Practice & doctor',
      },
    ],
    taxes: [
      {
        amount: 50,
        baseAmount: 1800,
        concept: 'Sales tax',
      },
    ],
  }),
  createLineItem({
    uuid: 'line-item-clear-aligner',
    display: 'Clear Aligner',
    item: 'service-clear-aligner:Clear Aligner',
    billableService: 'service-clear-aligner:Clear Aligner',
    quantity: 1,
    price: 249999,
    priceUuid: 'price-clear-aligner',
    lineItemOrder: 1,
    paymentStatus: PaymentStatus.PENDING,
  }),
  createLineItem({
    uuid: 'line-item-registration',
    display: 'Registration',
    item: 'service-registration:Registration',
    billableService: 'service-registration:Registration',
    quantity: 2,
    price: 2500,
    priceUuid: 'price-registration',
    lineItemOrder: 2,
    paymentStatus: PaymentStatus.PENDING,
    discounts: [
      {
        amount: 500,
        baseAmount: 5000,
        rate: 10,
        description: 'Registration package discount',
        sponsor: 'Practice',
      },
    ],
    taxes: [
      {
        amount: 250,
        baseAmount: 4500,
        rate: 5,
        concept: 'Sales tax',
      },
    ],
  }),
];

const mixedStatusLineItems: Array<LineItem> = [
  createLineItem({
    uuid: 'line-item-paid-consultation',
    display: 'Consultation',
    item: 'service-consultation:Consultation',
    billableService: 'service-consultation:Consultation',
    quantity: 1,
    price: 2000,
    priceUuid: 'price-consultation',
    lineItemOrder: 0,
    paymentStatus: PaymentStatus.PAID,
  }),
  createLineItem({
    uuid: 'line-item-pending-aligner',
    display: 'Clear Aligner',
    item: 'service-clear-aligner:Clear Aligner',
    billableService: 'service-clear-aligner:Clear Aligner',
    quantity: 1,
    price: 249999,
    priceUuid: 'price-clear-aligner',
    lineItemOrder: 1,
    paymentStatus: PaymentStatus.PENDING,
    discounts: [
      {
        amount: 2000,
        baseAmount: 249999,
        description: 'Clinical adjustment',
        sponsor: 'Practice & doctor',
      },
    ],
  }),
  createLineItem({
    uuid: 'line-item-exempted-registration',
    display: 'Registration',
    item: 'service-registration:Registration',
    billableService: 'service-registration:Registration',
    quantity: 1,
    price: 2500,
    priceUuid: 'price-registration',
    lineItemOrder: 2,
    paymentStatus: PaymentStatus.EXEMPTED,
  }),
];

const baseBill: MappedBill = {
  uuid: 'bill-open-pending',
  id: 26061600537,
  patientUuid: 'patient-hurmain-arif',
  patientName: 'Hurmain Arif',
  cashPointUuid: 'cash-point-main',
  cashPointName: 'Main cashier',
  cashPointLocation: 'Alphabase Clinic',
  cashier: {
    uuid: 'cashier-bilal',
    display: 'Bilal Admin',
    links: [],
  },
  receiptNumber: '2606160053-7',
  status: PaymentStatus.PENDING,
  identifier: '10001A8',
  dateCreated: '16-Jun-2026',
  dateCreatedUnformatted: '2026-06-16T10:30:00.000Z',
  lineItems: openLineItems,
  billingService: 'service-consultation:Consultation',
  payments: [],
  totalAmount: 256599,
  tenderedAmount: 0,
  totalPayments: 0,
  balance: 256599,
  closed: false,
  totalTax: 300,
  totalDiscounts: 700,
  billLineItemDiscounts: 700,
  totalAmountWithoutTaxAndDiscount: 256999,
};

const mixedStatusBill: MappedBill = {
  ...baseBill,
  uuid: 'bill-mixed-status',
  lineItems: mixedStatusLineItems,
  totalAmount: 252499,
  totalDiscounts: 2000,
};

const closedBill: MappedBill = {
  ...baseBill,
  uuid: 'bill-closed',
  closed: true,
};

type InvoiceTableStoryArgs = React.ComponentProps<typeof InvoiceTable>;

const StatefulInvoiceTable = (args: InvoiceTableStoryArgs) => {
  const [selectedLineItems, setSelectedLineItems] = useState<Array<LineItem>>(args.selectedLineItems ?? []);

  return <InvoiceTable {...args} selectedLineItems={selectedLineItems} onSelectItem={setSelectedLineItems} />;
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
    bill: baseBill,
    isSelectable: true,
    isLoadingBill: false,
    selectedLineItems: [],
  },
  render: StatefulInvoiceTable,
};

export const MixedStatusRows: Story = {
  args: {
    bill: mixedStatusBill,
    isSelectable: true,
    isLoadingBill: false,
    selectedLineItems: [],
  },
  render: StatefulInvoiceTable,
};

export const SelectedRows: Story = {
  args: {
    bill: baseBill,
    isSelectable: true,
    isLoadingBill: false,
    selectedLineItems: [openLineItems[1]],
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
    bill: baseBill,
    isSelectable: true,
    isLoadingBill: true,
    selectedLineItems: [],
  },
};
