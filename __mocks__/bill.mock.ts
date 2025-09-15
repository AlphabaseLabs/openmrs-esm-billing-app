import { type MappedBill, PaymentStatus } from '../src/types';

export const mockBillData: Array<MappedBill> = [
  {
    id: 1,
    uuid: 'test-uuid-1',
    patientName: 'John Doe',
    identifier: 'TEST123',
    patientUuid: 'patient-uuid-1',
    status: PaymentStatus.PENDING,
    receiptNumber: '1000-1',
    cashier: {
      uuid: 'cashier-uuid-1',
      display: 'Test Cashier',
      links: [],
    },
    cashPointUuid: 'cashpoint-uuid-1',
    cashPointName: 'Test Cash Point',
    cashPointLocation: 'Test Hospital',
    dateCreated: 'Today, 12:00',
    dateCreatedUnformatted: '2024-01-01T12:00:00.000+0300',
    lineItems: [
      {
        uuid: 'lineitem-uuid-1',
        display: 'BillLineItem',
        voided: false,
        voidReason: null,
        item: 'TEST SERVICE',
        priceName: 'TEST PRICE',
        priceUuid: 'price-uuid-1',
        lineItemOrder: 1,
        billableService: 'service-uuid-1:TEST SERVICE',
        quantity: 1,
        price: 100,
        paymentStatus: 'PENDING',
        itemOrServiceConceptUuid: 'concept-uuid-1',
        serviceTypeUuid: 'servicetype-uuid-1',
        order: {
          uuid: 'order-uuid-1',
          display: 'TEST SERVICE',
          links: [],
          type: 'testorder',
        },
        resourceVersion: '1.0',
      },
    ],
    billingService: 'TEST',
    payments: [],
    display: '1000-1',
    totalAmount: 100,
    tenderedAmount: 0,
    referenceCodes: '',
    adjustmentReason: 'Test adjustment reason',
  },
];

export const mockInitialServicePrice = {
  uuid: 'price-uuid-1',
  name: 'TEST PRICE',
  paymentMode: {
    uuid: 'payment-mode-uuid-1',
    name: 'Cash',
    description: 'Cash Payment',
    retired: false,
    retireReason: null,
    attributeTypes: [],
    sortOrder: null,
    resourceVersion: '1.8',
  },
  price: 100,
};

export const mockCurrentBillableService = {
  uuid: 'service-uuid-1',
  name: 'TEST SERVICE',
  shortName: 'TEST SERVICE',
  serviceStatus: 'ENABLED' as const,
  stockItem: {
    uuid: 'stock-item-uuid-1',
    display: 'Test Stock Item',
  },
  serviceType: {
    uuid: 'servicetype-uuid-1',
    display: 'Test Service',
  },
  servicePrices: [
    {
      uuid: 'price-uuid-1',
      name: 'TEST PRICE',
      paymentMode: {
        uuid: 'payment-mode-uuid-1',
        name: 'Cash',
        description: 'Cash Payment',
        retired: false,
        retireReason: null,
        attributeTypes: [],
        sortOrder: null,
        resourceVersion: '1.8',
      },
      price: 100,
    },
  ],
  concept: {
    uuid: 'concept-uuid-1',
    display: 'TEST SERVICE',
  },
};

export const mockPaymentModes = [
  {
    uuid: 'eb6173cb-9678-4614-bbe1-0ccf7ed9d1d4',
    name: 'Cash',
    description: 'Cash payment',
    retired: false,
    retireReason: null,
    auditInfo: {
      creator: { uuid: 'creator-1', display: 'Creator', links: [] },
      dateCreated: '2024-01-01',
      changedBy: null,
      dateChanged: null,
    },
    attributeTypes: [],
    sortOrder: null,
    resourceVersion: '1.8',
  },
  {
    uuid: 'eb6173cb-9678-4614-bbe1-0ccf7ed9d1d5',
    name: 'Insurance',
    description: 'Insurance payment',
    retired: false,
    retireReason: null,
    auditInfo: {
      creator: { uuid: 'creator-1', display: 'Creator', links: [] },
      dateCreated: '2024-01-01',
      changedBy: null,
      dateChanged: null,
    },
    attributeTypes: [],
    sortOrder: null,
    resourceVersion: '1.8',
  },
];

export const mockLineItems = [
  {
    uuid: 'lineitem-uuid-1',
    display: 'BillLineItem',
    voided: false,
    voidReason: null,
    item: 'TEST SERVICE',
    priceName: 'TEST PRICE',
    priceUuid: 'price-uuid-1',
    lineItemOrder: 1,
    billableService: 'service-uuid-1:TEST SERVICE',
    quantity: 1,
    price: 100,
    paymentStatus: 'PENDING',
    itemOrServiceConceptUuid: 'concept-uuid-1',
    serviceTypeUuid: 'servicetype-uuid-1',
    order: {
      uuid: 'order-uuid-1',
      display: 'TEST SERVICE',
      links: [],
      type: 'testorder',
    },
    resourceVersion: '1.0',
  },
];

export const mockedActiveSheet = {
  uuid: 'timesheet-uuid-1',
  display: 'Timesheet Display',
  cashier: {
    uuid: 'cashier-uuid-1',
    display: 'Test Cashier',
    links: [],
  },
  cashPoint: {
    uuid: 'cashpoint-uuid-1',
    name: 'Test Cash Point',
    description: 'Test cash point description',
    retired: false,
    location: {
      uuid: 'location-uuid-1',
      display: 'Test Location',
      links: [],
    },
  },
  clockIn: '2024-01-01T08:00:00.000+0300',
  clockOut: null,
  id: 1,
};

export const mockPayments = [
  {
    uuid: 'payment-uuid-1',
    instanceType: {
      uuid: 'instance-type-uuid-1',
      name: 'Cash',
      description: 'Cash payment',
      retired: false,
    },
    attributes: [],
    amount: 100,
    amountTendered: 100,
    dateCreated: 1640995200000, // timestamp
    voided: false,
    resourceVersion: '1.8',
  },
];

export const mockBill = {
  uuid: 'test-uuid-1',
  patientName: 'John Doe',
  identifier: 'TEST123',
  patientUuid: 'patient-uuid-1',
  status: PaymentStatus.PENDING,
  receiptNumber: '1000-1',
  cashier: {
    uuid: 'cashier-uuid-1',
    display: 'Test Cashier',
    links: [],
  },
  cashPointUuid: 'cashpoint-uuid-1',
  cashPointName: 'Test Cash Point',
  cashPointLocation: 'Test Hospital',
  dateCreated: 'Today, 12:00',
  dateCreatedUnformatted: '2024-01-01T12:00:00.000+0300',
  lineItems: mockLineItems,
  billingService: 'TEST',
  payments: [],
  display: '1000-1',
  totalAmount: 100,
  tenderedAmount: 0,
  referenceCodes: '',
  adjustmentReason: 'Test adjustment reason',
};
