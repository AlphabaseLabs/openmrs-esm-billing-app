import { type LineItem, type MappedBill, PaymentStatus } from '../../types';

const getResourceUuid = (resourceReference?: string) => resourceReference?.split(':').at(0) ?? '';

const getRefundMatchKey = (lineItem: LineItem) => {
  const itemUuid = getResourceUuid(lineItem.item);
  const billableServiceUuid = getResourceUuid(lineItem.billableService);
  const resourceKey = itemUuid ? `item:${itemUuid}` : `service:${billableServiceUuid}`;

  return [resourceKey, lineItem.priceUuid ?? '', lineItem.quantity, Math.abs(lineItem.price)].join('|');
};

const isRefundLineItem = (lineItem: LineItem) => Math.sign(lineItem.price) === -1;

export const isLineItemRefunded = (bill: MappedBill, lineItem: LineItem) => {
  if (isRefundLineItem(lineItem)) {
    return true;
  }

  const matchingPaidLineItems = bill.lineItems.filter(
    (item) =>
      !isRefundLineItem(item) &&
      item.paymentStatus === PaymentStatus.PAID &&
      getRefundMatchKey(item) === getRefundMatchKey(lineItem),
  );
  const matchingRefundLineItems = bill.lineItems.filter(
    (item) => isRefundLineItem(item) && getRefundMatchKey(item) === getRefundMatchKey(lineItem),
  );

  const lineItemIndex = matchingPaidLineItems.findIndex((item) => item.uuid === lineItem.uuid);

  return lineItemIndex >= 0 && lineItemIndex < matchingRefundLineItems.length;
};
