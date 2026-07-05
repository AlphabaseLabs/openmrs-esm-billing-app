import { type LineItem, type MappedBill, type Payment, type PaymentMethod, PaymentStatus } from '../types';

export const storyPaymentModes = [
  {
    uuid: 'payment-mode-cash',
    name: 'Cash',
    description: 'Cash',
    retired: false,
    retireReason: null,
    attributeTypes: [],
  },
  {
    uuid: 'payment-mode-card',
    name: 'Card',
    description: 'Card',
    retired: false,
    retireReason: null,
    attributeTypes: [
      {
        uuid: 'payment-reference-number',
        name: 'Reference Number',
        description: 'Reference Number',
        retired: false,
        required: false,
      },
    ],
  },
] as Array<PaymentMethod>;

export const createLineItem = (overrides: Partial<LineItem>): LineItem =>
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
    totalAllocated: 0,
    ...overrides,
  }) as LineItem;

export const paidConsultationLineItem = createLineItem({
  uuid: 'line-item-paid-consultation',
  display: 'Consultation',
  item: 'service-consultation:Consultation',
  billableService: 'service-consultation:Consultation',
  quantity: 1,
  price: 2000,
  priceUuid: 'price-consultation',
  lineItemOrder: 0,
  paymentStatus: PaymentStatus.PAID,
  discounts: [
    {
      amount: 2000,
      baseAmount: 2000,
      description: 'value',
      sponsor: 'provider-storybook',
    },
  ],
  taxes: [],
  totalAllocated: 0,
  total: 0,
});

export const clearAlignerPendingLineItem = createLineItem({
  uuid: 'line-item-clear-aligner',
  display: 'Clear Aligner',
  item: 'service-clear-aligner:Clear Aligner',
  billableService: 'service-clear-aligner:Clear Aligner',
  quantity: 1,
  price: 249999,
  priceUuid: 'price-clear-aligner',
  lineItemOrder: 1,
  paymentStatus: PaymentStatus.PENDING,
  total: 249999,
});

export const registrationPendingLineItem = createLineItem({
  uuid: 'line-item-registration',
  display: 'Registration',
  item: 'service-registration:Registration',
  billableService: 'service-registration:Registration',
  quantity: 1,
  price: 5000,
  priceUuid: 'price-registration',
  lineItemOrder: 2,
  paymentStatus: PaymentStatus.PENDING,
  discounts: [
    {
      amount: 500,
      baseAmount: 5000,
      rate: 0.1,
      description: 'percentage',
      sponsor: 'provider-storybook',
    },
  ],
  taxes: [
    {
      amount: 250,
      baseAmount: 4500,
      rate: 0.05,
      concept: 'Sales tax',
    },
  ],
  total: 4750,
});

export const paidRegistrationLineItem = {
  ...registrationPendingLineItem,
  uuid: 'line-item-paid-registration',
  paymentStatus: PaymentStatus.PAID,
  totalAllocated: 4750,
} as LineItem;

export const storyPayment = {
  uuid: 'payment-cash-1',
  instanceType: {
    uuid: 'payment-mode-cash',
    name: 'Cash',
    description: 'Cash',
    retired: false,
  },
  attributes: [],
  amount: 249999,
  amountTendered: 249999,
  dateCreated: Date.parse('2026-06-16T12:30:00.000Z'),
  voided: false,
  resourceVersion: '1.9',
} as Payment;

export const storyPartialCashPayment = {
  uuid: 'payment-cash-partial',
  instanceType: {
    uuid: 'payment-mode-cash',
    name: 'Cash',
    description: 'Cash',
    retired: false,
  },
  attributes: [],
  amount: 100,
  amountTendered: 100,
  dateCreated: Date.parse('2026-07-03T08:37:00.000Z'),
  voided: false,
  resourceVersion: '1.9',
} as Payment;

export const storyCardPayment = {
  uuid: 'payment-card-1',
  instanceType: {
    uuid: 'payment-mode-card',
    name: 'Card',
    description: 'Card',
    retired: false,
  },
  attributes: [
    {
      uuid: 'payment-attribute-reference',
      display: 'Reference Number: CARD-260616',
      voided: false,
      voidReason: null,
      value: 'CARD-260616',
      attributeType: {
        uuid: 'payment-reference-number',
        name: 'Reference Number',
        description: 'Reference Number',
        retired: false,
        required: false,
      },
      order: 0,
      valueName: 'CARD-260616',
      resourceVersion: '1.9',
    },
  ],
  amount: 4750,
  amountTendered: 4750,
  dateCreated: Date.parse('2026-06-16T13:15:00.000Z'),
  voided: false,
  resourceVersion: '1.9',
} as Payment;

export const openPendingBill = {
  uuid: 'bill-open-pending',
  id: 26061600537,
  patientUuid: 'patient-hurmain-arif',
  patientName: 'Hurmain Arif',
  cashPointUuid: 'cash-point-main',
  cashPointName: 'Main cashier',
  cashPointLocation: 'Alphabase Clinic',
  cashier: {
    uuid: 'cashier-storybook',
    display: 'Storybook Cashier',
    links: [],
  },
  receiptNumber: '2606160053-7',
  status: PaymentStatus.PENDING,
  identifier: '10001A8',
  dateCreated: '16-Jun-2026',
  dateCreatedUnformatted: '2026-06-16T10:30:00.000Z',
  lineItems: [paidConsultationLineItem, clearAlignerPendingLineItem],
  billingService: 'Consultation Clear Aligner',
  payments: [],
  totalAmount: 249999,
  tenderedAmount: 0,
  totalPayments: 0,
  totalActualPayments: 0,
  balance: 249999,
  closed: false,
  totalTax: 0,
  billLineItemDiscounts: 2000,
  totalDiscounts: 2000,
  totalAmountWithoutTaxAndDiscount: 251999,
} as MappedBill;

export const pendingBillWithCashPayment = {
  ...openPendingBill,
  uuid: 'bill-pending-with-cash-payment',
  payments: [storyPartialCashPayment],
  tenderedAmount: 100,
  totalPayments: 100,
  totalActualPayments: 100,
  balance: 249899,
} as MappedBill;

export const discountedPendingBill = {
  ...openPendingBill,
  uuid: 'bill-discounted-pending',
  lineItems: [paidConsultationLineItem, clearAlignerPendingLineItem, registrationPendingLineItem],
  totalAmount: 254749,
  totalPayments: 0,
  totalActualPayments: 0,
  balance: 254749,
  totalTax: 250,
  billLineItemDiscounts: 2500,
  totalDiscounts: 2500,
  totalAmountWithoutTaxAndDiscount: 256999,
} as MappedBill;

export const partiallyPaidBill = {
  ...discountedPendingBill,
  uuid: 'bill-partially-paid',
  payments: [storyPayment],
  tenderedAmount: 249999,
  totalPayments: 249999,
  totalActualPayments: 249999,
  balance: 4750,
} as MappedBill;

export const paidBill = {
  ...discountedPendingBill,
  uuid: 'bill-paid',
  status: PaymentStatus.PAID,
  lineItems: [
    paidConsultationLineItem,
    { ...clearAlignerPendingLineItem, paymentStatus: PaymentStatus.PAID, totalAllocated: 249999 } as LineItem,
    paidRegistrationLineItem,
  ],
  payments: [storyPayment, storyCardPayment],
  tenderedAmount: 254749,
  totalPayments: 254749,
  totalActualPayments: 254749,
  balance: 0,
} as MappedBill;

export const closedBill = {
  ...openPendingBill,
  uuid: 'bill-closed',
  closed: true,
} as MappedBill;

export const selectedUnpaidLineItems = discountedPendingBill.lineItems.filter(
  (lineItem) => lineItem.paymentStatus !== PaymentStatus.PAID,
);
