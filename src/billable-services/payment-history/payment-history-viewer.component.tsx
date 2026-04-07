import { DataTableSkeleton } from '@carbon/react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import EmptyPatientBill from '../../past-patient-bills/patient-bills-dashboard/empty-patient-bill.component';
import { type MappedBill } from '../../types';
import { PaymentHistoryTable } from './payment-history-table.component';
import { usePaymentFilterContext } from './usePaymentFilterContext';
import { usePaymentTransactionHistory } from './usePaymentTransactionHistory';

interface PaymentHistoryViewerContentProps {
  bills: Array<MappedBill>;
  isLoading: boolean;
}

export const PaymentHistoryViewerContent = ({ bills: filteredBills, isLoading }: PaymentHistoryViewerContentProps) => {
  const { t } = useTranslation();

  const headers = useMemo(
    () => [
      { header: t('billDate', 'Date'), key: 'dateCreated' },
      { header: t('patientName', 'Patient name'), key: 'patientName' },
      { header: t('identifier', 'Identifier'), key: 'identifier' },
      { header: t('totalAmount', 'Total amount'), key: 'totalAmount' },
      { header: t('totalWaived', 'Total waived'), key: 'totalWaived' },
      { header: t('totalPaid', 'Total paid'), key: 'totalPaid' },
      { header: t('billingService', 'Service'), key: 'billingService' },
      { header: t('referenceCodes', 'Reference codes'), key: 'referenceCodes' },
      { header: t('status', 'Status'), key: 'status' },
    ],
    [t],
  );
  return (
    <>
      {isLoading ? (
        <DataTableSkeleton headers={headers} aria-label={t('transactionHistory', 'Transaction History')} />
      ) : filteredBills.length > 0 ? (
        <PaymentHistoryTable headers={headers} rows={filteredBills} />
      ) : (
        <EmptyPatientBill
          title={t('noTransactionHistory', 'No transaction history')}
          subTitle={t('noTransactionHistorySubtitle', 'No transaction history loaded for the selected filters')}
        />
      )}
    </>
  );
};

export const PaymentHistoryViewer = () => {
  const { filters } = usePaymentFilterContext();
  const { bills, isLoading } = usePaymentTransactionHistory(filters);

  return <PaymentHistoryViewerContent bills={bills} isLoading={isLoading} />;
};
