import React, { useMemo } from 'react';
import {
  DataTable,
  DataTableSkeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@carbon/react';
import { useLayoutType } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { convertToCurrency } from '../../helpers';
import EmptyPatientBill from '../../past-patient-bills/patient-bills-dashboard/empty-patient-bill.component';
import { summarizePaymentHistoryEntries, type PaymentHistoryEntry } from './payment-history.utils';

interface PaymentEntryModeSummaryProps {
  entries: Array<PaymentHistoryEntry>;
  isLoading: boolean;
}

export const PaymentEntryModeSummary = ({ entries, isLoading }: PaymentEntryModeSummaryProps) => {
  const { t } = useTranslation();
  const responsiveSize = useLayoutType() !== 'tablet' ? 'sm' : 'md';

  const rows = useMemo(
    () =>
      summarizePaymentHistoryEntries(entries).paymentMethodTotals.map(({ paymentMethod, total }, index) => ({
        id: index.toString(),
        paymentMode: paymentMethod,
        total: convertToCurrency(total),
      })),
    [entries],
  );

  const headers = useMemo(
    () => [
      {
        key: 'paymentMode',
        header: t('paymentMode', 'Payment mode'),
      },
      {
        key: 'total',
        header: t('total', 'Total'),
      },
    ],
    [t],
  );

  if (isLoading) {
    return <DataTableSkeleton headers={headers} aria-label={t('paymentModeSummary', 'Payment Mode Summary')} />;
  }

  if (rows.length === 0) {
    return (
      <EmptyPatientBill
        title={t('noPaymentModes', 'No payment modes found')}
        subTitle={t('noPaymentModesSubtitle', 'No payment modes found for the selected filters')}
      />
    );
  }

  return (
    <DataTable useZebraStyles size={responsiveSize} rows={rows} headers={headers}>
      {({ rows, headers, getHeaderProps, getRowProps, getTableProps, getTableContainerProps }) => (
        <TableContainer {...getTableContainerProps()}>
          <Table {...getTableProps()} aria-label={t('paymentModeSummary', 'Payment Mode Summary')}>
            <TableHead>
              <TableRow>
                {headers.map((header) => (
                  <TableHeader
                    key={header.key}
                    {...getHeaderProps({
                      header,
                    })}>
                    {header.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  {...getRowProps({
                    row,
                  })}>
                  {row.cells.map((cell) => (
                    <TableCell key={cell.id}>{cell.value}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </DataTable>
  );
};
