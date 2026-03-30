import { type OpenmrsResource } from '@openmrs/esm-framework';

export const BILLABLE_SERVICE_SELECT_ID = 'billing-service';

export type BillableServicePrice = {
  paymentMode?: { uuid?: string };
  price?: string;
  uuid?: string;
};

export function getBillableServiceDisplayName(item: OpenmrsResource | null | undefined): string {
  if (!item) {
    return '';
  }
  return (item as OpenmrsResource & { name?: string }).name ?? '';
}

export function resolvePriceForPaymentMode(
  servicePrices: BillableServicePrice[] | undefined,
  paymentMethodUuid: string,
): BillableServicePrice | undefined {
  return servicePrices?.find((p) => p.paymentMode?.uuid === paymentMethodUuid) ?? servicePrices?.[0];
}

export function mapBillableSelectionToLineItems(
  selectedItems: OpenmrsResource[],
  paymentMethodUuid: string,
  billStatus: string,
) {
  return selectedItems.map((item, index) => {
    const servicePrices = item.servicePrices as BillableServicePrice[] | undefined;
    const priceRow = resolvePriceForPaymentMode(servicePrices, paymentMethodUuid);
    return {
      billableService: item.uuid,
      quantity: 1,
      price: priceRow ? priceRow.price : '0.000',
      priceName: 'Default',
      priceUuid: priceRow ? priceRow.uuid : '',
      lineItemOrder: index,
      paymentStatus: billStatus,
    };
  });
}
