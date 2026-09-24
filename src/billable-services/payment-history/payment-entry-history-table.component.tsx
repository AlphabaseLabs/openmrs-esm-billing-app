import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  DataTable,
  Pagination,
  Search,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@carbon/react';
import { Download } from '@carbon/react/icons';
import { navigate, useDebounce, useLayoutType } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { exportToExcel } from '../../helpers/excelExport';
import { getInvoiceUrl } from '../../helpers';
import { formatCurrency } from '../../helpers/currency';
import amountStyles from '../../helpers/table.scss';
import { type PaymentHistoryEntry } from '../billing-history/history.resource';
import {
  createHistorySortRow,
  getHistoryColumnStyle,
  getHistoryResponsiveSize,
  historyControlSize,
  historyPageSizes,
  historyTableSize,
  paymentHistoryColumnStyles,
  paymentHistoryAmountKeys as amountKeys,
} from '../billing-history/history-table.utils';
import { matchesPaymentHistoryEntrySearch } from './usePaymentHistoryEntries';
import styles from './payment-history.scss';

type PaymentEntryHistoryTableProps = {
  headers: Array<{
    key: string;
    header: string;
  }>;
  rows: Array<PaymentHistoryEntry>;
  totalCount: number;
  page: number;
  pageSize: number;
  isRefreshing: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onExport: (search: string) => Promise<Array<PaymentHistoryEntry>>;
};

export const PaymentEntryHistoryTable = ({
  headers,
  rows,
  totalCount,
  page,
  pageSize,
  isRefreshing,
  onPageChange,
  onExport,
}: PaymentEntryHistoryTableProps) => {
  const { t } = useTranslation();
  const responsiveSize = getHistoryResponsiveSize(useLayoutType());
  const [searchString, setSearchString] = useState('');
  const debouncedSearchString = useDebounce(searchString, 300);

  useEffect(() => {
    setSearchString('');
  }, [page, pageSize]);

  const filteredEntries = useMemo(
    () => rows.filter((row) => matchesPaymentHistoryEntrySearch(row, debouncedSearchString)),
    [debouncedSearchString, rows],
  );

  const rowLookup = useMemo(() => new Map(filteredEntries.map((row) => [row.id, row])), [filteredEntries]);
  const sortRow = createHistorySortRow('paymentDate', amountKeys);

  const handleRowClick = (billUuid: string, patientUuid: string) => {
    navigate({ to: getInvoiceUrl(patientUuid, billUuid) });
  };

  const handleExport = async () => {
    const exportRows = await onExport(debouncedSearchString);
    const data = exportRows.map((row) => ({
      'Payment date': row.paymentDate,
      'Invoice #': row.invoiceId,
      'Patient name': row.patientName,
      Identifier: row.identifier,
      'Payment amount': Number(row.paymentAmount.toFixed(2)),
      'Payment method': row.paymentMethod,
      'Reference codes': row.referenceId,
    }));

    exportToExcel(data, {
      fileName: `Payment History - ${dayjs().format('DDD-MMM-YYYY:HH-mm-ss')}`,
      sheetName: t('paymentHistory', 'Payment History'),
    });
  };

  return (
    <div>
      <div className={styles.tableToolbar}>
        <Search
          className={styles.tableSearch}
          size={historyControlSize}
          placeholder={t(
            'searchPaymentHistoryPage',
            'Search this page by patient, identifier, invoice, payment method, or reference',
          )}
          labelText={t('searchPaymentHistory', 'Search payment history table')}
          closeButtonLabelText={t('clearSearch', 'Clear search input')}
          id="search-payment-history"
          value={searchString}
          onChange={(event) => setSearchString(event.target.value)}
          onClear={() => setSearchString('')}
        />

        <Button
          className={styles.toolbarAction}
          size={historyControlSize}
          renderIcon={Download}
          iconDescription={t('download', 'Download')}
          disabled={isRefreshing}
          onClick={() => {
            void handleExport();
          }}>
          {t('download', 'Download')}
        </Button>
      </div>
      <DataTable
        useZebraStyles
        isSortable
        size={historyTableSize}
        rows={filteredEntries}
        headers={headers}
        sortRow={sortRow}>
        {({ rows: tableRows, headers, getHeaderProps, getRowProps, getTableProps, getTableContainerProps }) => (
          <TableContainer {...getTableContainerProps()}>
            <Table {...getTableProps()} size={historyTableSize} aria-label={t('paymentHistory', 'Payment History')}>
              <TableHead>
                <TableRow>
                  {headers.map((header) => (
                    <TableHeader
                      key={header.key}
                      {...getHeaderProps({ header })}
                      className={amountKeys.includes(header.key) ? amountStyles.numericCell : undefined}
                      style={getHistoryColumnStyle(paymentHistoryColumnStyles, header.key)}>
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.map((row) => {
                  const paymentData = rowLookup.get(row.id);
                  return (
                    <TableRow
                      key={row.id}
                      {...getRowProps({ row })}
                      onClick={() => paymentData && handleRowClick(paymentData.billUuid, paymentData.patientUuid)}
                      className={styles.clickableRow}>
                      {row.cells.map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={
                            amountKeys.includes(cell.info.header)
                              ? `${amountStyles.numericCell} ${amountStyles.sortableNumericCell}`
                              : undefined
                          }
                          style={getHistoryColumnStyle(paymentHistoryColumnStyles, cell.info.header)}>
                          {amountKeys.includes(cell.info.header)
                            ? formatCurrency(cell.value, { style: 'decimal', maximumFractionDigits: 2 })
                            : cell.value}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>
      {totalCount > 0 ? (
        <Pagination
          forwardText={t('nextPage', 'Next page')}
          backwardText={t('previousPage', 'Previous page')}
          page={page}
          pageSize={pageSize}
          pageSizes={historyPageSizes}
          totalItems={totalCount}
          size={responsiveSize}
          onChange={({ page: nextPage, pageSize: nextPageSize }) => onPageChange(nextPage, nextPageSize)}
        />
      ) : null}
    </div>
  );
};
