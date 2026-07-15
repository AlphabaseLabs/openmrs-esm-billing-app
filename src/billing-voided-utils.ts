type VoidableRecord = {
  voided?: boolean | null;
};

export const isActiveBillingRecord = <T extends VoidableRecord>(record?: T | null) => !record?.voided;

export const getActiveBillingRecords = <T extends VoidableRecord>(records: Array<T> = []) =>
  records.filter(isActiveBillingRecord);

export const sumActivePaymentTenderedAmounts = <
  T extends VoidableRecord & {
    amountTendered?: number | string | null;
  },
>(
  payments: Array<T> = [],
) => getActiveBillingRecords(payments).reduce((total, payment) => total + (Number(payment?.amountTendered) || 0), 0);
