import React, { useMemo } from 'react';
import {
  DataTable,
  SkeletonText,
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
import { formatCurrency, getCurrencyForLocale } from '../../helpers/currency';
import amountStyles from '../../helpers/table.scss';
import EmptyPatientBill from '../../past-patient-bills/patient-bills-dashboard/empty-patient-bill.component';
import { type PaymentMethodTotal } from './history.resource';
import { getHistoryResponsiveSize } from './history-table.utils';
import styles from './billing-history.scss';

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
  const currency = getCurrencyForLocale();
  const responsiveSize = getHistoryResponsiveSize(useLayoutType());
  const resolvedTableLabel = tableLabel ?? t('paymentModeSummary', 'Payment Mode Summary');

  const rows = useMemo(
    () =>
      paymentMethodTotals.map(({ paymentMethod, total }, index) => ({
        id: `${paymentMethod}-${index}`,
        paymentMode: paymentMethod,
        total: formatCurrency(total, { style: 'decimal', maximumFractionDigits: 2 }),
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
        header: `${t('total', 'Total')} (${currency})`,
      },
    ],
    [currency, t],
  );

  if (!isLoading && rows.length === 0) {
    return (
      <EmptyPatientBill
        title={t('noPaymentModes', 'No payment modes found')}
        subTitle={t('noPaymentModesSubtitle', 'No payment modes found for the selected filters')}
      />
    );
  }

  return (
    <DataTable useZebraStyles size={responsiveSize} rows={isLoading ? [] : rows} headers={headers}>
      {({
        rows: tableRows,
        headers: tableHeaders,
        getHeaderProps,
        getRowProps,
        getTableProps,
        getTableContainerProps,
      }) => (
        <TableContainer {...getTableContainerProps()}>
          <Table
            {...getTableProps()}
            className={styles.paymentMethodSummary}
            size={responsiveSize}
            aria-busy={isLoading}
            aria-label={resolvedTableLabel}>
            <TableHead>
              <TableRow>
                {tableHeaders.map((header) => (
                  <TableHeader
                    key={header.key}
                    {...getHeaderProps({ header })}
                    className={header.key === 'total' ? amountStyles.numericCell : undefined}>
                    {header.key === 'total' ? (
                      <span className={styles.summaryAmount}>{header.header}</span>
                    ) : (
                      header.header
                    )}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }, (_, rowIndex) => (
                    <TableRow key={`skeleton-${rowIndex}`}>
                      {tableHeaders.map((header) => (
                        <TableCell
                          key={header.key}
                          className={header.key === 'total' ? amountStyles.numericCell : undefined}>
                          <div className={header.key === 'total' ? styles.summaryAmount : undefined}>
                            <SkeletonText width="70%" />
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : null}
              {tableRows.map((row) => (
                <TableRow key={row.id} {...getRowProps({ row })}>
                  {row.cells.map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.info.header === 'total' ? amountStyles.numericCell : undefined}>
                      {cell.info.header === 'total' ? (
                        <span className={styles.summaryAmount}>{cell.value}</span>
                      ) : (
                        cell.value
                      )}
                    </TableCell>
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
