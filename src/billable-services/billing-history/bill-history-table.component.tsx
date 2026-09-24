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
import { getInvoiceUrl } from '../../helpers';
import { formatCurrency } from '../../helpers/currency';
import amountStyles from '../../helpers/table.scss';
import { exportToExcel } from '../../helpers/excelExport';
import { type BillingHistoryRow } from './history.resource';
import {
  billingHistoryAmountKeys as amountKeys,
  billingHistoryColumnStyles,
  createHistorySortRow,
  getHistoryColumnStyle,
  getHistoryResponsiveSize,
  historyControlSize,
  historyPageSizes,
  historyTableSize,
} from './history-table.utils';
import { matchesBillingHistoryRowSearch } from './useBillingHistoryBills';
import styles from './billing-history.scss';

type BillHistoryTableProps = {
  headers: Array<{
    key: string;
    header: string;
  }>;
  rows: Array<BillingHistoryRow>;
  totalCount: number;
  page: number;
  pageSize: number;
  isRefreshing: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onExport: (search: string) => Promise<Array<BillingHistoryRow>>;
};

export const BillHistoryTable = ({
  headers,
  rows,
  totalCount,
  page,
  pageSize,
  isRefreshing,
  onPageChange,
  onExport,
}: BillHistoryTableProps) => {
  const { t } = useTranslation();
  const responsiveSize = getHistoryResponsiveSize(useLayoutType());
  const [searchString, setSearchString] = useState('');
  const debouncedSearchString = useDebounce(searchString, 300);

  useEffect(() => {
    setSearchString('');
  }, [page, pageSize]);

  const filteredRows = useMemo(
    () => rows.filter((row) => matchesBillingHistoryRowSearch(row, debouncedSearchString)),
    [debouncedSearchString, rows],
  );

  const rowLookup = useMemo(() => new Map(filteredRows.map((row) => [row.id, row])), [filteredRows]);
  const sortRow = createHistorySortRow('dateCreated', amountKeys);

  const handleExport = async () => {
    const exportRows = await onExport(debouncedSearchString);
    const data = exportRows.map((row) => ({
      'Bill date': row.dateCreated,
      'Invoice #': row.receiptNumber,
      'Patient name': row.patientName,
      Identifier: row.identifier,
      'Total amount': Number(row.totalAmount.toFixed(2)),
      'Total discount': Number(row.totalDiscount.toFixed(2)),
      'Total paid': Number(row.totalPaid.toFixed(2)),
      'Amount due': Number(row.amountDue.toFixed(2)),
      Status: row.status,
      'Billed items': row.billedItems,
      'Reference codes': row.referenceCodes,
    }));

    exportToExcel(data, {
      fileName: `Billing History - ${dayjs().format('DDD-MMM-YYYY:HH-mm-ss')}`,
      sheetName: t('billingHistory', 'Billing History'),
    });
  };

  return (
    <div>
      <div className={styles.tableToolbar}>
        <Search
          className={styles.tableSearch}
          size={historyControlSize}
          placeholder={t(
            'searchBillingHistoryPage',
            'Search this page by invoice, patient, identifier, line item, or reference',
          )}
          labelText={t('searchBillingHistory', 'Search billing history table')}
          closeButtonLabelText={t('clearSearch', 'Clear search input')}
          id="search-billing-history"
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
        rows={filteredRows}
        headers={headers}
        sortRow={sortRow}>
        {({ rows: tableRows, headers, getHeaderProps, getRowProps, getTableProps, getTableContainerProps }) => (
          <TableContainer {...getTableContainerProps()}>
            <Table {...getTableProps()} size={historyTableSize} aria-label={t('billingHistory', 'Billing History')}>
              <TableHead>
                <TableRow>
                  {headers.map((header) => (
                    <TableHeader
                      key={header.key}
                      {...getHeaderProps({ header })}
                      className={amountKeys.includes(header.key) ? amountStyles.numericCell : undefined}
                      style={getHistoryColumnStyle(billingHistoryColumnStyles, header.key)}>
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.map((row) => {
                  const billData = rowLookup.get(row.id);
                  return (
                    <TableRow
                      key={row.id}
                      {...getRowProps({ row })}
                      onClick={() => billData && navigate({ to: getInvoiceUrl(billData.patientUuid, billData.uuid) })}
                      className={styles.clickableRow}>
                      {row.cells.map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={
                            amountKeys.includes(cell.info.header)
                              ? `${amountStyles.numericCell} ${amountStyles.sortableNumericCell}`
                              : undefined
                          }
                          style={getHistoryColumnStyle(billingHistoryColumnStyles, cell.info.header)}>
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
