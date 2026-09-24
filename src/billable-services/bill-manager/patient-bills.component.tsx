import React from 'react';
import {
  DataTable,
  SkeletonText,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableExpandHeader,
  TableHeader,
  TableBody,
  TableExpandRow,
  TableCell,
  TableExpandedRow,
} from '@carbon/react';
import { getActiveBillingRecords } from '../../billing-voided-utils';
import { formatCurrency, getCurrencyForLocale } from '../../helpers/currency';
import amountStyles from '../../helpers/table.scss';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@openmrs/esm-patient-common-lib';
import { type MappedBill, PaymentStatus } from '../../types';
import styles from './bill-manager.scss';
import BillLineItems from './bill-line-items.component';
import { ExtensionSlot, ConfigurableLink } from '@openmrs/esm-framework';

type PatientBillsProps = {
  bills: Array<MappedBill>;
  isLoading?: boolean;
};

const amountKeys = ['totalAmount', 'amountPaid', 'amountWaived', 'creditAmount'];

const PatientBills: React.FC<PatientBillsProps> = ({ bills, isLoading = false }) => {
  const { t } = useTranslation();
  const currency = getCurrencyForLocale();

  const hasRefundedItems = bills.some((bill) =>
    getActiveBillingRecords(bill.lineItems).some((li) => Math.sign(li.price) === -1),
  );

  const tableHeaders = [
    { header: 'Date', key: 'date' },
    { header: 'Identifier', key: 'identifier' },
    { header: t('invoice', 'Invoice'), key: 'invoiceNumber' },
    { header: 'Status', key: 'status' },
    { header: `${t('totalAmount', 'Total amount')} (${currency})`, key: 'totalAmount' },
    { header: `${t('amountPaid', 'Amount paid')} (${currency})`, key: 'amountPaid' },
    { header: `${t('amountWaived', 'Amount waived')} (${currency})`, key: 'amountWaived' },
  ];

  if (hasRefundedItems) {
    tableHeaders.splice(2, 0, {
      header: `${t('refundedAmount', 'Refunded amount')} (${currency})`,
      key: 'creditAmount',
    });
  }

  const tableRows = (isLoading ? [] : bills).map((bill) => ({
    id: `${bill.uuid}`,
    date: bill.dateCreated,
    totalAmount: formatCurrency(bill.totalAmount, { style: 'decimal', maximumFractionDigits: 2 }),
    status:
      bill.totalAmount === bill.tenderedAmount
        ? PaymentStatus.PAID
        : bill.tenderedAmount === 0
          ? PaymentStatus.PENDING
          : PaymentStatus.POSTED,
    amountPaid: formatCurrency(bill.totalActualPayments, { style: 'decimal', maximumFractionDigits: 2 }),
    amountWaived: formatCurrency(bill.totalWaived, { style: 'decimal', maximumFractionDigits: 2 }),
    ...(hasRefundedItems && {
      creditAmount: formatCurrency(
        getActiveBillingRecords(bill.lineItems)
          .filter((li) => Math.sign(li.price) === -1)
          .reduce((acc, curr) => acc + Math.abs(curr.price), 0),
        { style: 'decimal', maximumFractionDigits: 2 },
      ),
    }),
    identifier: bill?.identifier,
    invoiceNumber: bill?.receiptNumber,
  }));

  if (!isLoading && bills.length === 0) {
    return (
      <div style={{ marginTop: '1rem' }}>
        <EmptyState
          displayText={t('noBillDisplay', 'There are no bills to display for this patient')}
          headerTitle="No bills"
        />
      </div>
    );
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <DataTable
        rows={tableRows}
        headers={tableHeaders}
        size="sm"
        useZebraStyles
        render={({
          rows,
          headers,
          getHeaderProps,
          getExpandHeaderProps,
          getRowProps,
          getExpandedRowProps,
          getTableProps,
          getTableContainerProps,
        }) => (
          <TableContainer
            title={t('patientBills', 'Patient bill')}
            description={t('patientBillsDescription', 'List of patient bills')}
            {...getTableContainerProps()}>
            <Table
              {...getTableProps()}
              className={styles.patientBillsTable}
              aria-busy={isLoading}
              aria-label={t('patientBills', 'Patient bill')}>
              <TableHead>
                <TableRow>
                  <TableExpandHeader {...getExpandHeaderProps()} />
                  {headers.map((header) => (
                    <TableHeader
                      key={header.key}
                      className={
                        amountKeys.includes(header.key)
                          ? `${amountStyles.numericCell} ${styles.amountColumn}`
                          : undefined
                      }
                      {...getHeaderProps({
                        header,
                      })}>
                      {header.header}
                    </TableHeader>
                  ))}
                  <TableHeader>Action</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 3 }, (_, rowIndex) => (
                      <TableRow key={`skeleton-${rowIndex}`}>
                        <TableCell />
                        {headers.map((header) => (
                          <TableCell
                            key={header.key}
                            className={amountKeys.includes(header.key) ? amountStyles.numericCell : undefined}>
                            <SkeletonText />
                          </TableCell>
                        ))}
                        <TableCell>
                          <SkeletonText />
                        </TableCell>
                      </TableRow>
                    ))
                  : rows.map((row, index) => (
                      <React.Fragment key={row.id}>
                        <TableExpandRow
                          {...getRowProps({
                            row,
                          })}>
                          {row.cells.map((cell) => (
                            <TableCell
                              key={cell.id}
                              className={amountKeys.includes(cell.info.header) ? amountStyles.numericCell : undefined}>
                              {cell.info.header === 'invoiceNumber' ? (
                                <ConfigurableLink
                                  to="${openmrsSpaBase}/home/billing/patient/${patientUuid}/${uuid}"
                                  templateParams={{ patientUuid: bills[index].patientUuid, uuid: bills[index].uuid }}>
                                  {cell.value}
                                </ConfigurableLink>
                              ) : (
                                cell.value
                              )}
                            </TableCell>
                          ))}
                          <TableCell>
                            <ExtensionSlot
                              name="bill-actions-slot"
                              style={{ display: 'flex', gap: '0.5rem' }}
                              state={{ bill: bills[index] }}
                            />
                          </TableCell>
                        </TableExpandRow>
                        <TableExpandedRow
                          colSpan={headers.length + 2}
                          className={styles.expendableRow}
                          {...getExpandedRowProps({
                            row,
                          })}>
                          <BillLineItems bill={bills[index]} />
                        </TableExpandedRow>
                      </React.Fragment>
                    ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      />
    </div>
  );
};

export default PatientBills;
