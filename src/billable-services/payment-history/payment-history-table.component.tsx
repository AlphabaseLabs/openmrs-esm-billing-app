import React, { useMemo, useState } from 'react';
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
import { useDebounce, useLayoutType, usePagination, navigate } from '@openmrs/esm-framework';
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
  const layout = useLayoutType();
  const controlSize = 'sm';
  const responsiveSize = layout !== 'tablet' ? 'sm' : 'md';
  const [searchString, setSearchString] = useState('');
  const debouncedSearchString = useDebounce(searchString, 1000);

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

  const { currentPage, goTo, results } = usePagination(searchResults, pageSize);
  const { pageSizes } = usePaginationInfo(pageSize, rows.length, currentPage, results.length);

  const transformedRows = results.map((row) => {
    const totalPaid = row.payments
      .filter((payment) => payment.instanceType?.name !== 'Waiver')
      .reduce((acc, payment) => acc + payment.amountTendered, 0);
    const totalWaived = row.totalWaived ?? 0;

    return {
      ...row,
      id: `${row.id}`,
      billingService: row.lineItems.map((item) => item.billableService).join(', '),
      totalAmount: convertToCurrency(
        row.totalAmount ?? row.payments.reduce((acc, payment) => acc + payment.amountTendered, 0),
      ),
      totalPaid: convertToCurrency(totalPaid),
      totalWaived: convertToCurrency(totalWaived),
      referenceCodes: row.payments
        .map(({ attributes }) => attributes.map(({ value }) => value).join(', '))
        .filter((code) => code !== '')
        .join(', '),
    };
  });

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
      const baseAmount = row.totalAmountWithoutTaxAndDiscount ?? summary.base;
      const discountAmount = row.totalDiscounts ?? row.billLineItemDiscounts ?? summary.discount;
      const taxAmount = row.totalTax ?? summary.tax;
      const totalAmount = row.totalAmount ?? summary.total;
      const totalPaid = row.payments
        .filter((payment) => payment.instanceType?.name !== 'Waiver')
        .reduce((acc, payment) => acc + payment.amountTendered, 0);
      const totalWaived = row.totalWaived ?? 0;

      return {
        'Receipt Number': row.receiptNumber,
        'Patient ID': row.identifier,
        'Patient Name': row.patientName,
        'Base Amount': round2(baseAmount),
        'Discount Amount': round2(discountAmount),
        'Tax Amount': round2(taxAmount),
        'Total Amount': round2(totalAmount),
        'Total Paid': round2(totalPaid),
        'Total Waived': round2(totalWaived),
        'Date of Payment': row.payments[0]?.dateCreated ? dayjs(row.payments[0].dateCreated).format('DD-MM-YYYY') : '',
        'Mode of Payment': row.payments
          .map((payment: (typeof row.payments)[0]) => payment.instanceType?.name)
          .filter(Boolean)
          .join(', '),
        'Reason/Reference': row.payments
          .map(({ attributes }) => attributes.map(({ value }) => value).join(' '))
          .filter((code) => code !== '')
          .join(', '),
      };
    });

    exportToExcel(data, {
      fileName: `Transaction History - ${dayjs().format('DDD-MMM-YYYY:HH-mm-ss')}`,
      sheetName: t('paymentHistory', 'Payment History'),
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <Search
          size={controlSize}
          placeholder={t('searchTransactions', 'Search transactions table')}
          labelText={t('searchTransactions', 'Search transactions table')}
          closeButtonLabelText={t('clearSearch', 'Clear search input')}
          id="search-transactions"
          onChange={(event) => setSearchString(event.target.value)}
        />

        <Button size={controlSize} renderIcon={Download} iconDescription="Download" onClick={handleExport}>
          {t('download', 'Download')}
        </Button>
      </div>
      <DataTable useZebraStyles size="sm" rows={transformedRows} headers={headers}>
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
                      })}>
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => {
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
                        <TableCell key={cell.id}>{cell.value}</TableCell>
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
            if (newPage !== currentPage) {
              goTo(newPage);
            }
            setPageSize(pageSize);
          }}
        />
      )}
    </div>
  );
};
