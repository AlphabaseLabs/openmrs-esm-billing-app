import {
  SkeletonText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@carbon/react';
import { ErrorState } from '@openmrs/esm-framework';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import EmptyPatientBill from '../../past-patient-bills/patient-bills-dashboard/empty-patient-bill.component';
import { PaymentEntryHistoryTable } from './payment-entry-history-table.component';
import { type PaymentHistoryEntry } from './payment-history.utils';

type Header = {
  header: string;
  key: string;
};

const getColumnStyle = (columnKey: string) =>
  columnKey === 'paymentDate'
    ? ({ inlineSize: '12rem', whiteSpace: 'nowrap' } as const)
    : columnKey === 'invoiceId'
      ? ({ inlineSize: '9rem', whiteSpace: 'nowrap' } as const)
      : columnKey === 'paymentAmount'
        ? ({ inlineSize: '9rem', whiteSpace: 'nowrap' } as const)
        : undefined;

const PaymentEntryHistoryTableSkeleton = ({ headers, title }: { headers: Array<Header>; title: string }) => (
  <TableContainer>
    <Table size="sm" aria-label={title}>
      <TableHead>
        <TableRow>
          {headers.map((header) => (
            <TableHeader key={header.key} style={getColumnStyle(header.key)}>
              {header.header}
            </TableHeader>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: 5 }).map((_, rowIndex) => (
          <TableRow key={`payment-history-skeleton-row-${rowIndex}`}>
            {headers.map((header) => (
              <TableCell key={`${header.key}-${rowIndex}`} style={getColumnStyle(header.key)}>
                <SkeletonText
                  heading={false}
                  width={header.key === 'paymentDate' || header.key === 'invoiceId' ? '70%' : '90%'}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

interface PaymentEntryHistoryViewerContentProps {
  entries: Array<PaymentHistoryEntry>;
  isLoading: boolean;
  error: unknown;
}

export const PaymentEntryHistoryViewerContent = ({
  entries,
  isLoading,
  error,
}: PaymentEntryHistoryViewerContentProps) => {
  const { t } = useTranslation();

  const headers = useMemo(
    () => [
      { header: t('paymentDate', 'Payment date'), key: 'paymentDate' },
      { header: t('patientName', 'Patient name'), key: 'patientName' },
      { header: t('identifier', 'Patient identifier'), key: 'identifier' },
      { header: t('invoiceId', 'Invoice ID'), key: 'invoiceId' },
      { header: t('paymentAmount', 'Payment amount'), key: 'paymentAmount' },
      { header: t('paymentMethod', 'Payment method'), key: 'paymentMethod' },
      { header: t('referenceId', 'Reference ID'), key: 'referenceId' },
    ],
    [t],
  );

  if (error) {
    return <ErrorState error={error} headerTitle={t('paymentHistory', 'Payment History')} />;
  }

  if (isLoading) {
    return <PaymentEntryHistoryTableSkeleton headers={headers} title={t('paymentHistory', 'Payment History')} />;
  }

  if (entries.length === 0) {
    return (
      <EmptyPatientBill
        title={t('noPaymentHistory', 'No payment history')}
        subTitle={t('noPaymentHistorySubtitle', 'No payment history loaded for the selected filters')}
      />
    );
  }

  return <PaymentEntryHistoryTable headers={headers} rows={entries} />;
};
