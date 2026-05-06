import React, { useEffect, useMemo, useState } from 'react';
import {
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Pagination,
  Search,
  TableContainer,
  Button,
} from '@carbon/react';
import { Download } from '@carbon/react/icons';
import { useTranslation } from 'react-i18next';
import { useDebounce, useLayoutType, navigate } from '@openmrs/esm-framework';
import { usePaginationInfo } from '@openmrs/esm-patient-common-lib';
import { convertToCurrency } from '../../helpers/functions';
import { type MappedBill } from '../../types';
import { exportToExcel } from '../../helpers/excelExport';
import dayjs from 'dayjs';

export const PaymentHistoryTable = ({
  headers,
  rows = [],
}: {
  headers: Array<{
    key: string;
    header: string;
  }>;
  rows: Array<MappedBill>;
}) => {
  const { t } = useTranslation();
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const layout = useLayoutType();
  const controlSize = 'sm';
  const responsiveSize = layout !== 'tablet' ? 'sm' : 'md';
  const [searchString, setSearchString] = useState('');
  const debouncedSearchString = useDebounce(searchString, 1000);
  const getColumnStyle = (columnKey: string) => {
    switch (columnKey) {
      case 'dateCreated':
        return { inlineSize: '12rem', whiteSpace: 'nowrap' } as const;
      case 'receiptNumber':
        return { inlineSize: '9rem', whiteSpace: 'nowrap' } as const;
      case 'billingService':
        return { inlineSize: '16rem' } as const;
      default:
        return undefined;
    }
  };

  const getReferenceCodes = (row: MappedBill) =>
    row.payments
      .flatMap((payment) =>
        payment.attributes
          .filter(({ value }) => value?.trim())
          .map(({ value }) => `${payment.instanceType?.name}: ${value}`),
      )
      .join(', ') || '--';

  const searchResults = useMemo(() => {
    if (rows !== undefined && rows.length > 0) {
      if (debouncedSearchString && debouncedSearchString.trim() !== '') {
        const search = debouncedSearchString.toLowerCase();
        return rows?.filter((activeBillRow) =>
          Object.entries(activeBillRow).some(([header, value]) => {
            if (header === 'patientUuid') {
              return false;
            }
            return `${value}`.toLowerCase().includes(search);
          }),
        );
      }
    }

    return rows;
  }, [debouncedSearchString, rows]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchString]);

  const transformedRows = useMemo(
    () =>
      searchResults.map((row) => {
        const totalAmount = Number(row.totalAmount ?? 0);
        const totalPaid = row.payments
          .filter((payment) => payment.instanceType?.name !== 'Waiver')
          .reduce((acc, payment) => acc + payment.amountTendered, 0);
        const totalDiscount = Number(row.billLineItemDiscounts ?? 0);
        const amountDue = row.balance ?? totalAmount - totalPaid;
        const serviceText = row.lineItems.map((item) => item.billableService).join(', ');
        const trimmedServiceText =
          serviceText.length > 60 ? `${serviceText.slice(0, 57).trimEnd()}...` : serviceText || '--';

        return {
          ...row,
          id: `${row.id}`,
          receiptNumber: row.receiptNumber ?? '--',
          totalAmount: convertToCurrency(totalAmount),
          totalDiscount: convertToCurrency(totalDiscount),
          totalPaid: convertToCurrency(totalPaid),
          amountDue: convertToCurrency(amountDue),
          billingService: <span title={serviceText}>{trimmedServiceText}</span>,
          referenceCodes: getReferenceCodes(row),
        };
      }),
    [searchResults],
  );

  const pageStart = (currentPage - 1) * pageSize;
  const currentItemsCount = Math.max(0, Math.min(pageSize, transformedRows.length - pageStart));
  const { pageSizes } = usePaginationInfo(pageSize, transformedRows.length, currentPage, currentItemsCount);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(transformedRows.length / pageSize));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, pageSize, transformedRows.length]);

  const getCellText = (value: unknown) => {
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }

    if (React.isValidElement<{ children?: React.ReactNode }>(value)) {
      const children = value.props.children;
      if (typeof children === 'string' || typeof children === 'number') {
        return String(children);
      }
      if (Array.isArray(children)) {
        return children.join('');
      }
    }

    return String(value ?? '');
  };

  const parseCurrencyValue = (value: unknown) => {
    const normalizedValue = getCellText(value).replace(/[^0-9.-]/g, '');
    return Number(normalizedValue || 0);
  };

  const parseDateValue = (value: unknown) => {
    const parsedDate = dayjs(getCellText(value), 'DD-MMM-YYYY, hh:mm A', true);
    return parsedDate.isValid() ? parsedDate.valueOf() : 0;
  };

  const sortRow = (cellA, cellB, { key, sortDirection, sortStates, compare }) => {
    const compareValues = (firstValue: number, secondValue: number) =>
      sortDirection === sortStates.ASC ? firstValue - secondValue : secondValue - firstValue;

    switch (key) {
      case 'dateCreated':
        return compareValues(parseDateValue(cellA), parseDateValue(cellB));
      case 'totalAmount':
      case 'totalDiscount':
      case 'totalPaid':
      case 'amountDue':
        return compareValues(parseCurrencyValue(cellA), parseCurrencyValue(cellB));
      default:
        return sortDirection === sortStates.ASC ? compare(cellA, cellB) : compare(cellB, cellA);
    }
  };

  const handleRowClick = (billUuid: string, patientUuid: string) => {
    const billingUrl = `${window.getOpenmrsSpaBase()}home/billing/patient/${patientUuid}/${billUuid}`;
    navigate({ to: billingUrl });
  };

  const handleExport = () => {
    const round2 = (value: number) => Number((value || 0).toFixed(2));
    const summarizeLineItems = (row: MappedBill) =>
      row.lineItems.reduce(
        (acc, item) => {
          const qty = Number(item.quantity) || 1;
          const base = item.discounts?.[0]?.baseAmount ?? (Number(item.price) || 0) * qty;
          const discount = item.discounts?.reduce((sum, d) => sum + (Number(d.amount) || 0), 0) ?? 0;
          const tax = item.taxes?.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0) ?? 0;
          const total = base - discount + tax;

          return {
            base: acc.base + base,
            discount: acc.discount + discount,
            tax: acc.tax + tax,
            total: acc.total + total,
          };
        },
        { base: 0, discount: 0, tax: 0, total: 0 },
      );

    const data = rows.map((row) => {
      const summary = summarizeLineItems(row);
      const discountAmount = row.billLineItemDiscounts ?? summary.discount;
      const totalAmount = row.totalAmount ?? summary.total;
      const totalPaid = row.payments
        .filter((payment) => payment.instanceType?.name !== 'Waiver')
        .reduce((acc, payment) => acc + payment.amountTendered, 0);
      const amountDue = row.balance ?? totalAmount - totalPaid;

      return {
        'Bill date': row.dateCreated,
        'Invoice #': row.receiptNumber,
        'Patient name': row.patientName,
        Identifier: row.identifier,
        'Total amount': round2(totalAmount),
        'Total discount': round2(discountAmount),
        'Total paid': round2(totalPaid),
        'Amount due': round2(amountDue),
        Status: row.status,
        'Billed items': row.lineItems.map((item) => item.billableService).join(', '),
        'Reference codes': getReferenceCodes(row),
      };
    });

    exportToExcel(data, {
      fileName: `Billing History - ${dayjs().format('DDD-MMM-YYYY:HH-mm-ss')}`,
      sheetName: t('billingHistory', 'Billing History'),
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <Search
          size={controlSize}
          placeholder={t('searchBillingHistory', 'Search billing history table')}
          labelText={t('searchBillingHistory', 'Search billing history table')}
          closeButtonLabelText={t('clearSearch', 'Clear search input')}
          id="search-transactions"
          onChange={(event) => setSearchString(event.target.value)}
        />

        <Button size={controlSize} renderIcon={Download} iconDescription="Download" onClick={handleExport}>
          {t('download', 'Download')}
        </Button>
      </div>
      <DataTable useZebraStyles isSortable size="sm" rows={transformedRows} headers={headers} sortRow={sortRow}>
        {({ rows, headers, getHeaderProps, getRowProps, getTableProps, getTableContainerProps }) => (
          <TableContainer {...getTableContainerProps()}>
            <Table {...getTableProps()} size="sm" aria-label="sample table">
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
                  const billData = transformedRows.find((tr) => tr.id === row.id);
                  return (
                    <TableRow
                      key={row.id}
                      {...getRowProps({
                        row,
                      })}
                      onClick={() => handleRowClick(billData?.uuid, billData?.patientUuid)}
                      style={{ cursor: 'pointer' }}>
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
      {pageSizes.length > 1 && (
        <Pagination
          forwardText={t('nextPage', 'Next page')}
          backwardText={t('previousPage', 'Previous page')}
          page={currentPage ?? 1}
          pageSize={pageSize ?? 10}
          pageSizes={pageSizes}
          totalItems={searchResults.length ?? 0}
          size={responsiveSize}
          onChange={({ page: newPage, pageSize }) => {
            setCurrentPage(newPage);
            setPageSize(pageSize);
          }}
        />
      )}
    </div>
  );
};
