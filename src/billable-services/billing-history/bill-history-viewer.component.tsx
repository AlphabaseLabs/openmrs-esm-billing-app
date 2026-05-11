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
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import EmptyPatientBill from '../../past-patient-bills/patient-bills-dashboard/empty-patient-bill.component';
import { type MappedBill } from '../../types';
import { BillHistoryTable } from './bill-history-table.component';
import { useBillingHistoryFilterContext } from './useBillingHistoryFilterContext';
import { useBillingHistoryBills } from './useBillingHistoryBills';

interface BillHistoryViewerContentProps {
  bills: Array<MappedBill>;
  isLoading: boolean;
}

type Header = {
  header: string;
  key: string;
};

const getColumnStyle = (columnKey: string) =>
  columnKey === 'dateCreated'
    ? ({ inlineSize: '12rem', whiteSpace: 'nowrap' } as const)
    : columnKey === 'receiptNumber'
      ? ({ inlineSize: '9rem', whiteSpace: 'nowrap' } as const)
      : columnKey === 'billingService'
        ? ({ inlineSize: '16rem' } as const)
        : undefined;

const BillHistoryTableSkeleton = ({ headers, title }: { headers: Array<Header>; title: string }) => (
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
          <TableRow key={`skeleton-row-${rowIndex}`}>
            {headers.map((header) => (
              <TableCell key={`${header.key}-${rowIndex}`} style={getColumnStyle(header.key)}>
                <SkeletonText
                  heading={false}
                  width={header.key === 'dateCreated' || header.key === 'receiptNumber' ? '70%' : '90%'}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export const BillHistoryViewerContent = ({ bills: filteredBills, isLoading }: BillHistoryViewerContentProps) => {
  const { t } = useTranslation();

  const headers = useMemo(
    () => [
      { header: t('billDate', 'Bill date'), key: 'dateCreated' },
      { header: t('invoiceNumberShort', 'Invoice #'), key: 'receiptNumber' },
      { header: t('patientName', 'Patient name'), key: 'patientName' },
      { header: t('identifier', 'Identifier'), key: 'identifier' },
      { header: t('totalAmount', 'Total amount'), key: 'totalAmount' },
      { header: t('billingHistoryTotalDiscount', 'Total discount'), key: 'totalDiscount' },
      { header: t('totalPaid', 'Total paid'), key: 'totalPaid' },
      { header: t('billingHistoryAmountDue', 'Amount due'), key: 'amountDue' },
      { header: t('billingHistoryStatus', 'Status'), key: 'status' },
      { header: t('billingHistoryLineItems', 'Billed items'), key: 'billingService' },
      { header: t('referenceCodes', 'Reference codes'), key: 'referenceCodes' },
    ],
    [t],
  );
  return (
    <>
      {isLoading ? (
        <BillHistoryTableSkeleton headers={headers} title={t('billingHistory', 'Billing History')} />
      ) : filteredBills.length > 0 ? (
        <BillHistoryTable headers={headers} rows={filteredBills} />
      ) : (
        <EmptyPatientBill
          title={t('noBillingHistory', 'No billing history')}
          subTitle={t('noBillingHistorySubtitle', 'No billing history loaded for the selected filters')}
        />
      )}
    </>
  );
};

export const BillHistoryViewer = () => {
  const { filters } = useBillingHistoryFilterContext();
  const { bills, isLoading } = useBillingHistoryBills(filters);

  return <BillHistoryViewerContent bills={bills} isLoading={isLoading} />;
};
