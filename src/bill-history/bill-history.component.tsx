import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DataTableSkeleton,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
  Pagination,
  Button,
  InlineLoading,
} from '@carbon/react';
import { Add, TaskComplete } from '@carbon/react/icons';
import { isDesktop, useLayoutType, usePagination, useConfig } from '@openmrs/esm-framework';
import { ErrorState, usePaginationInfo, CardHeader, EmptyState } from '@openmrs/esm-patient-common-lib';
import { getActiveBillingRecords } from '../billing-voided-utils';
import { useBill, useBills } from '../billing.resource';
import BillDetails from '../invoice/bill-details.component';
import { convertToCurrency } from '../helpers';
import styles from './bill-history.scss';
import dayjs from 'dayjs';
import { type BillingConfig } from '../config-schema';
import { type MappedBill, PaymentStatus } from '../types';
import {
  launchBillingWorkspace,
  mergePatientChartBillingFormProps,
  useLaunchBillingWorkspaceRequiringVisit,
} from '../workspaces';

interface BillHistoryProps {
  patientUuid: string;
}

const BILL_HISTORY_SELECTED_BILL_PARAM = 'billUuid';
const BILL_HISTORY_ROUTING_EVENT = 'single-spa:routing-event';
const DEFAULT_BILL_HISTORY_START_DATE = '2020-01-01';

const getBillHistoryStartDate = (configuredStartDate?: string) => {
  const parsedStartDate = dayjs(configuredStartDate || DEFAULT_BILL_HISTORY_START_DATE);
  const resolvedStartDate = parsedStartDate.isValid() ? parsedStartDate : dayjs(DEFAULT_BILL_HISTORY_START_DATE);

  return resolvedStartDate.startOf('day').toDate();
};

const getColumnClassName = (columnKey: string) => {
  return columnKey === 'billedItems' ? styles.billedItemsColumn : undefined;
};

const BillHistory: React.FC<BillHistoryProps> = ({ patientUuid }) => {
  const { t } = useTranslation();
  const config = useConfig<BillingConfig>();
  const shouldRequireVisit = config.visitRequired ?? true;
  const { bills, isLoading, error, mutate } = useBills(
    patientUuid,
    '',
    getBillHistoryStartDate(config.billHistoryStartDate),
    dayjs().endOf('day').toDate(),
  );
  const launchPatientWorkspaceRequiringVisit = useLaunchBillingWorkspaceRequiringVisit(patientUuid, 'billing-form');
  const layout = useLayoutType();
  const [pageSize, setPageSize] = React.useState(10);
  const [locationSearch, setLocationSearch] = React.useState(() =>
    typeof window === 'undefined' ? '' : window.location.search,
  );
  const responsiveSize = isDesktop(layout) ? 'sm' : 'lg';
  const { paginated, goTo, results, currentPage } = usePagination(bills, pageSize);
  const { pageSizes } = usePaginationInfo(pageSize, bills?.length, currentPage, results?.length);
  const selectedBillUuid = React.useMemo(
    () => new URLSearchParams(locationSearch).get(BILL_HISTORY_SELECTED_BILL_PARAM),
    [locationSearch],
  );
  const cumulativeBillTotal = React.useMemo(
    () => bills.reduce((sum, bill) => sum + Number(bill.totalAmount ?? 0), 0),
    [bills],
  );

  React.useEffect(() => {
    const syncLocationSearch = () => setLocationSearch(window.location.search);

    window.addEventListener(BILL_HISTORY_ROUTING_EVENT, syncLocationSearch);
    window.addEventListener('popstate', syncLocationSearch);
    window.addEventListener('hashchange', syncLocationSearch);

    return () => {
      window.removeEventListener(BILL_HISTORY_ROUTING_EVENT, syncLocationSearch);
      window.removeEventListener('popstate', syncLocationSearch);
      window.removeEventListener('hashchange', syncLocationSearch);
    };
  }, []);

  const handleLaunchBillForm = () => {
    const props = mergePatientChartBillingFormProps({ patientUuid });

    if (shouldRequireVisit) {
      launchPatientWorkspaceRequiringVisit(props);
      return;
    }

    launchBillingWorkspace('billing-form', props);
  };

  const updateSelectedBillUuid = React.useCallback((billUuid: string | null, replace = false) => {
    const nextUrl = new URL(window.location.href);

    if (billUuid) {
      nextUrl.searchParams.set(BILL_HISTORY_SELECTED_BILL_PARAM, billUuid);
    } else {
      nextUrl.searchParams.delete(BILL_HISTORY_SELECTED_BILL_PARAM);
    }

    const nextRelativeUrl = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
    const historyMethod = replace ? window.history.replaceState : window.history.pushState;
    historyMethod.call(window.history, window.history.state, '', nextRelativeUrl);
    setLocationSearch(nextUrl.search);
  }, []);

  const handleDiscardSelectedBill = React.useCallback(async () => {
    await mutate();
    updateSelectedBillUuid(null, true);
  }, [mutate, updateSelectedBillUuid]);

  const handleShowBillDetails = React.useCallback(
    (billUuid: string) => {
      updateSelectedBillUuid(billUuid);
    },
    [updateSelectedBillUuid],
  );

  const headerData = [
    {
      header: t('billDate', 'Bill date'),
      key: 'billDate',
    },
    {
      header: t('invoiceNumber', 'Invoice number'),
      key: 'invoiceNumber',
    },
    {
      header: t('billedItems', 'Billed items'),
      key: 'billedItems',
    },
    {
      header: t('billTotal', 'Bill total'),
      key: 'billTotal',
    },
    {
      header: t('status', 'Status'),
      key: 'status',
    },
  ];

  const setBilledItems = (bill: MappedBill) =>
    getActiveBillingRecords(bill.lineItems ?? []).reduce(
      (acc, item) => acc + (acc ? ' & ' : '') + (item.billableService?.split(':')[1] || item.item?.split(':')[1] || ''),
      '',
    );
  const renderBillDetailsTrigger = React.useCallback(
    (label: string, billUuid: string, invoiceNumber: string) => (
      <button
        type="button"
        className={styles.invoiceLinkButton}
        onClick={() => handleShowBillDetails(billUuid)}
        aria-label={t('viewBillDetailsFromInvoiceNumber', 'View bill details from invoice number {{invoiceNumber}}', {
          invoiceNumber,
        })}>
        {label}
      </button>
    ),
    [handleShowBillDetails, t],
  );

  const rowData = results?.map((bill) => ({
    id: bill.uuid,
    billTotal: bill.totalAmount,
    billDate: <span className={styles.billDateCell}>{bill.dateCreated}</span>,
    invoiceNumber: renderBillDetailsTrigger(bill.receiptNumber ?? '--', bill.uuid, bill.receiptNumber ?? bill.uuid),
    billedItems: setBilledItems(bill),
    status: (
      <Button
        kind={bill.status === PaymentStatus.PENDING ? 'tertiary' : 'ghost'}
        size="sm"
        renderIcon={bill.status === PaymentStatus.PENDING ? TaskComplete : undefined}
        onClick={() => handleShowBillDetails(bill.uuid)}
        aria-label={t('viewBillDetailsFromStatus', 'View bill details from status for invoice {{invoiceNumber}}', {
          invoiceNumber: bill.receiptNumber ?? bill.uuid,
        })}>
        {bill.status}
      </Button>
    ),
  }));

  if (isLoading) {
    return (
      <div className={styles.loaderContainer}>
        <DataTableSkeleton showHeader={false} showToolbar={false} zebra />
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} headerTitle={t('billsList', 'Bill list')} />;
  }

  if (bills.length === 0) {
    return (
      <EmptyState
        displayText={'Patient Billing'}
        headerTitle={t('patientBillingHistory', 'Patient billing history')}
        launchForm={handleLaunchBillForm}
      />
    );
  }

  return (
    <div>
      {!selectedBillUuid ? (
        <CardHeader title={t('patientBillingHistory', 'Patient billing history')}>
          <div>
            <Button renderIcon={Add} onClick={handleLaunchBillForm} kind="ghost">
              {t('addBill', 'Add bill item(s)')}
            </Button>
          </div>
        </CardHeader>
      ) : null}
      <div className={`${styles.billHistoryContainer} ${selectedBillUuid ? styles.billHistoryContainerNoBorder : ''}`}>
        {selectedBillUuid ? (
          <div className={styles.selectedBillPanel}>
            <BillHistorySelectedBill billUuid={selectedBillUuid} onDiscard={handleDiscardSelectedBill} />
          </div>
        ) : (
          <>
            <DataTable isSortable rows={rowData} headers={headerData} size={responsiveSize} useZebraStyles>
              {({ rows, headers, getTableProps, getTableContainerProps, getHeaderProps, getRowProps }) => (
                <TableContainer {...getTableContainerProps()}>
                  <Table {...getTableProps()} aria-label="Bill list">
                    <TableHead>
                      <TableRow>
                        {headers.map((header, i) => (
                          <TableHeader
                            key={i}
                            className={getColumnClassName(header.key)}
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
                        <TableRow key={row.id} {...getRowProps({ row })}>
                          {row.cells.map((cell) => (
                            <TableCell key={cell.id} className={getColumnClassName(cell.info.header)}>
                              {cell.value}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DataTable>
            {paginated ? (
              <Pagination
                forwardText={t('nextPage', 'Next page')}
                backwardText={t('previousPage', 'Previous page')}
                page={currentPage}
                pageSize={pageSize}
                pageSizes={pageSizes}
                totalItems={bills.length}
                className={styles.pagination}
                size={responsiveSize}
                onChange={({ page: newPage, pageSize }) => {
                  if (newPage !== currentPage) {
                    goTo(newPage);
                  }
                  setPageSize(pageSize);
                }}
              />
            ) : null}
            <div className={styles.cumulativeBillTotalSummary}>
              <div className={styles.cumulativeBillTotal}>
                {t('allBillsTotal', 'All bills total: {{total}}', {
                  total: convertToCurrency(cumulativeBillTotal),
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const BillHistorySelectedBill: React.FC<{ billUuid: string; onDiscard: () => void | Promise<void> }> = ({
  billUuid,
  onDiscard,
}) => {
  const { t } = useTranslation();
  const { bill, isLoading, error } = useBill(billUuid, { syncStatusWhenZeroBalance: true });

  if (isLoading) {
    return (
      <div className={styles.expandedLoader}>
        <InlineLoading
          status="active"
          iconDescription={t('loading', 'Loading')}
          description={t('loadingBill', 'Loading bill details...')}
        />
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} headerTitle={t('invoiceError', 'Invoice error')} />;
  }

  return (
    <div className={styles.selectedBillContent}>
      <BillDetails bill={bill} onDiscard={onDiscard} />
    </div>
  );
};

export default BillHistory;
