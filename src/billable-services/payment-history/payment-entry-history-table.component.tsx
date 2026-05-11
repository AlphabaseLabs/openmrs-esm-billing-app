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
import { usePaginationInfo } from '@openmrs/esm-patient-common-lib';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { exportToExcel } from '../../helpers/excelExport';
import { convertToCurrency, getInvoiceUrl } from '../../helpers';
import { type PaymentHistoryEntry } from './payment-history.utils';
import styles from './payment-history.scss';

type PaymentEntryHistoryTableProps = {
  headers: Array<{
    key: string;
    header: string;
  }>;
  rows: Array<PaymentHistoryEntry>;
};

type TableRowData = Omit<PaymentHistoryEntry, 'paymentAmount'> & {
  paymentAmount: string;
};

const controlSize = 'sm';
const tableSize = 'sm';
const columnStyles = {
  paymentDate: { inlineSize: '12rem', whiteSpace: 'nowrap' },
  invoiceId: { inlineSize: '9rem', whiteSpace: 'nowrap' },
  paymentAmount: { inlineSize: '9rem', whiteSpace: 'nowrap' },
} as const;

export const PaymentEntryHistoryTable = ({ headers, rows }: PaymentEntryHistoryTableProps) => {
  const { t } = useTranslation();
  const layout = useLayoutType();
  const responsiveSize = layout !== 'tablet' ? 'sm' : 'md';
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchString, setSearchString] = useState('');
  const debouncedSearchString = useDebounce(searchString, 1000);
  const getColumnStyle = (columnKey: string) => columnStyles[columnKey as keyof typeof columnStyles];

  const filteredEntries = useMemo(() => {
    if (!debouncedSearchString.trim()) {
      return rows;
    }

    const searchTerm = debouncedSearchString.trim().toLowerCase();

    return rows.filter((row) =>
      [
        row.paymentDate,
        row.patientName,
        row.identifier,
        row.invoiceId,
        row.paymentMethod,
        row.referenceId,
        `${row.paymentAmount}`,
      ].some((value) => `${value ?? ''}`.toLowerCase().includes(searchTerm)),
    );
  }, [debouncedSearchString, rows]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchString]);

  const transformedRows = useMemo<Array<TableRowData>>(
    () =>
      filteredEntries.map((row) => ({
        ...row,
        paymentAmount: convertToCurrency(row.paymentAmount),
      })),
    [filteredEntries],
  );
  const rowLookup = useMemo(() => new Map(transformedRows.map((row) => [row.id, row])), [transformedRows]);

  const pageStart = (currentPage - 1) * pageSize;
  const currentItemsCount = Math.max(0, Math.min(pageSize, transformedRows.length - pageStart));
  const { pageSizes } = usePaginationInfo(pageSize, transformedRows.length, currentPage, currentItemsCount);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(transformedRows.length / pageSize));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, pageSize, transformedRows.length]);

  const parseCurrencyValue = (value: unknown) => Number(`${value ?? ''}`.replace(/[^0-9.-]/g, '') || 0);
  const parseDateValue = (value: unknown) => {
    const parsedDate = dayjs(`${value ?? ''}`, 'DD-MMM-YYYY, hh:mm A', true);
    return parsedDate.isValid() ? parsedDate.valueOf() : 0;
  };

  const sortRow = (cellA, cellB, { key, sortDirection, sortStates, compare }) => {
    const compareValues = (firstValue: number, secondValue: number) =>
      sortDirection === sortStates.ASC ? firstValue - secondValue : secondValue - firstValue;

    switch (key) {
      case 'paymentDate':
        return compareValues(parseDateValue(cellA), parseDateValue(cellB));
      case 'paymentAmount':
        return compareValues(parseCurrencyValue(cellA), parseCurrencyValue(cellB));
      default:
        return sortDirection === sortStates.ASC ? compare(cellA, cellB) : compare(cellB, cellA);
    }
  };

  const handleRowClick = (billUuid: string, patientUuid: string) => {
    navigate({ to: getInvoiceUrl(patientUuid, billUuid) });
  };

  const handleExport = () => {
    const round2 = (value: number) => Number((value || 0).toFixed(2));
    const data = filteredEntries.map((row) => ({
      'Payment date': row.paymentDate,
      'Patient name': row.patientName,
      'Patient identifier': row.identifier,
      'Invoice ID': row.invoiceId,
      'Payment amount': round2(row.paymentAmount),
      'Payment method': row.paymentMethod,
      'Reference ID': row.referenceId,
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
          size={controlSize}
          placeholder={t('searchPaymentHistory', 'Search payment history table')}
          labelText={t('searchPaymentHistory', 'Search payment history table')}
          closeButtonLabelText={t('clearSearch', 'Clear search input')}
          id="search-payment-history"
          value={searchString}
          onChange={(event) => setSearchString(event.target.value)}
          onClear={() => setSearchString('')}
        />

        <Button
          className={styles.toolbarAction}
          size={controlSize}
          renderIcon={Download}
          iconDescription="Download"
          onClick={handleExport}>
          {t('download', 'Download')}
        </Button>
      </div>
      <DataTable useZebraStyles isSortable size={tableSize} rows={transformedRows} headers={headers} sortRow={sortRow}>
        {({ rows, headers, getHeaderProps, getRowProps, getTableProps, getTableContainerProps }) => (
          <TableContainer {...getTableContainerProps()}>
            <Table {...getTableProps()} size={tableSize} aria-label={t('paymentHistory', 'Payment History')}>
              <TableHead>
                <TableRow>
                  {headers.map((header) => (
                    <TableHeader
                      key={header.key}
                      {...getHeaderProps({
                        header,
                      })}
                      style={getColumnStyle(header.key)}>
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.slice(pageStart, pageStart + pageSize).map((row) => {
                  const paymentData = rowLookup.get(row.id);
                  return (
                    <TableRow
                      key={row.id}
                      {...getRowProps({
                        row,
                      })}
                      onClick={() => paymentData && handleRowClick(paymentData.billUuid, paymentData.patientUuid)}
                      className={styles.clickableRow}>
                      {row.cells.map((cell) => (
                        <TableCell key={cell.id} style={getColumnStyle(cell.info.header)}>
                          {cell.value}
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
      {pageSizes.length > 1 ? (
        <Pagination
          forwardText={t('nextPage', 'Next page')}
          backwardText={t('previousPage', 'Previous page')}
          page={currentPage ?? 1}
          pageSize={pageSize ?? 10}
          pageSizes={pageSizes}
          totalItems={filteredEntries.length ?? 0}
          size={responsiveSize}
          onChange={({ page: newPage, pageSize }) => {
            setCurrentPage(newPage);
            setPageSize(pageSize);
          }}
        />
      ) : null}
    </div>
  );
};
