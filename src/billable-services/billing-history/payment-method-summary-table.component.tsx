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
import { type PaymentMethodTotal } from './history.resource';
import { getHistoryResponsiveSize } from './history-table.utils';

interface PaymentMethodSummaryTableProps {
  isLoading: boolean;
  paymentMethodTotals: Array<PaymentMethodTotal>;
  tableLabel?: string;
}

export const PaymentMethodSummaryTable = ({
  isLoading,
  paymentMethodTotals,
  tableLabel,
}: PaymentMethodSummaryTableProps) => {
  const { t } = useTranslation();
  const responsiveSize = getHistoryResponsiveSize(useLayoutType());
  const resolvedTableLabel = tableLabel ?? t('paymentModeSummary', 'Payment Mode Summary');

  const rows = useMemo(
    () =>
      paymentMethodTotals.map(({ paymentMethod, total }, index) => ({
        id: `${paymentMethod}-${index}`,
        paymentMode: paymentMethod,
        total: convertToCurrency(total),
      })),
    [paymentMethodTotals],
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
    return <DataTableSkeleton headers={headers} aria-label={resolvedTableLabel} />;
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
      {({
        rows: tableRows,
        headers: tableHeaders,
        getHeaderProps,
        getRowProps,
        getTableProps,
        getTableContainerProps,
      }) => (
        <TableContainer {...getTableContainerProps()}>
          <Table {...getTableProps()} size={responsiveSize} aria-label={resolvedTableLabel}>
            <TableHead>
              <TableRow>
                {tableHeaders.map((header) => (
                  <TableHeader key={header.key} {...getHeaderProps({ header })}>
                    {header.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableRows.map((row) => (
                <TableRow key={row.id} {...getRowProps({ row })}>
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
