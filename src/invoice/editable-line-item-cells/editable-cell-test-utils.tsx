import React, { useState } from 'react';
import { type ActiveEditorKey, type EditableLineItemCommit } from './types';
import { type BillableService, type LineItem, PaymentStatus } from '../../types';

export const testLineItem = {
  uuid: 'line-item-consultation',
  display: 'Consultation',
  item: 'service-consultation:Consultation',
  billableService: 'service-consultation:Consultation',
  quantity: 1,
  price: 2000,
  priceName: 'Default',
  priceUuid: 'price-consultation-default',
  lineItemOrder: 0,
  paymentStatus: PaymentStatus.PENDING,
  discounts: [],
  taxes: [],
  voided: false,
  voidReason: null,
  resourceVersion: '1.9',
  itemOrServiceConceptUuid: 'concept-consultation',
  serviceTypeUuid: 'service-type-clinical',
  order: {},
} as LineItem;

export const testDiscountedLineItem = {
  ...testLineItem,
  discounts: [
    {
      amount: 500,
      baseAmount: 2000,
      rate: 0.25,
      sponsor: 'Practice & doctor',
      description: 'Existing discount',
    },
  ],
} as LineItem;

export const testBillableServices = [
  {
    uuid: 'service-consultation',
    name: 'Consultation',
    shortName: 'Consultation',
    serviceStatus: 'ENABLED',
    servicePrices: [
      {
        uuid: 'price-consultation-default',
        name: 'Default',
        price: 2000,
      },
      {
        uuid: 'price-consultation-card',
        name: 'Card',
        price: 2300,
      },
    ],
  },
] as Array<BillableService>;

export const EditableCellHarness = ({
  children,
}: {
  children: (props: {
    activeEditorKey: ActiveEditorKey;
    setActiveEditorKey: (key: ActiveEditorKey) => void;
    onCommit: EditableLineItemCommit;
  }) => React.ReactNode;
}) => {
  const [activeEditorKey, setActiveEditorKey] = useState<ActiveEditorKey>(null);
  const onCommit: EditableLineItemCommit = jest.fn(async () => {});

  return <>{children({ activeEditorKey, setActiveEditorKey, onCommit })}</>;
};
