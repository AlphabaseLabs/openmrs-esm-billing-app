import React from 'react';
import { type PaymentMethodTotal } from './history.resource';
import { type MappedBill } from '../../types';
import { PaymentMethodSummaryTable } from './payment-method-summary-table.component';
import { getActiveBillingRecords } from '../../billing-voided-utils';

interface PaymentMethodDistributionProps {
  bills?: Array<MappedBill>;
  paymentMethodTotals?: Array<PaymentMethodTotal>;
  isLoading: boolean;
}

const PaymentMethodDistribution = ({ bills = [], paymentMethodTotals, isLoading }: PaymentMethodDistributionProps) => {
  const paymentModesGroupTotals = React.useMemo(() => {
    if (paymentMethodTotals) {
      return paymentMethodTotals.map((item) => ({
        paymentMethod: item.paymentMethod,
        total: item.total,
      }));
    }

    const totals = new Map<string, number>();
    bills.forEach((bill) => {
      getActiveBillingRecords(bill.payments).forEach((payment) => {
        const paymentMethod = payment.instanceType?.name || '--';
        totals.set(paymentMethod, (totals.get(paymentMethod) ?? 0) + (Number(payment.amountTendered) || 0));
      });
    });

    return Array.from(totals.entries()).map(([paymentMethod, total]) => ({ paymentMethod, total }));
  }, [bills, paymentMethodTotals]);

  return <PaymentMethodSummaryTable isLoading={isLoading} paymentMethodTotals={paymentModesGroupTotals} />;
};

export default PaymentMethodDistribution;
