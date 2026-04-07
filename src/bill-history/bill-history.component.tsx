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
  OverflowMenu,
  OverflowMenuItem,
} from '@carbon/react';
import { Add, TaskComplete } from '@carbon/react/icons';
import {
  ConfigurableLink,
  isDesktop,
  restBaseUrl,
  showModal,
  useLayoutType,
  usePagination,
  useConfig,
} from '@openmrs/esm-framework';
import { ErrorState, usePaginationInfo, CardHeader, EmptyState } from '@openmrs/esm-patient-common-lib';
import { useBill, useBills } from '../billing.resource';
import BillDetails from '../invoice/bill-details.component';
import { convertToCurrency } from '../helpers';
import styles from './bill-history.scss';
import dayjs from 'dayjs';
import { type BillingConfig } from '../config-schema';
import { type MappedBill, PaymentStatus } from '../types';
import { launchBillingWorkspace, useLaunchBillingWorkspaceRequiringVisit } from '../workspaces';

interface BillHistoryProps {
  patientUuid: string;
}

const BillHistory: React.FC<BillHistoryProps> = ({ patientUuid }) => {
  const { t } = useTranslation();
  const config = useConfig<BillingConfig>();
  const shouldRequireVisit = config.visitRequired ?? true;
  const { bills, isLoading, error, mutate } = useBills(
    patientUuid,
    '',
    dayjs().subtract(config.billHistoryDays, 'day').startOf('day').toDate(),
    dayjs().endOf('day').toDate(),
  );
  const launchPatientWorkspaceRequiringVisit = useLaunchBillingWorkspaceRequiringVisit<{
    patientUuid: string;
  }>(patientUuid, 'billing-form');
  const layout = useLayoutType();
  const [pageSize, setPageSize] = React.useState(10);
  const [selectedBillUuid, setSelectedBillUuid] = React.useState<string | null>(null);
  const responsiveSize = isDesktop(layout) ? 'sm' : 'lg';
  const { paginated, goTo, results, currentPage } = usePagination(bills, pageSize);
  const { pageSizes } = usePaginationInfo(pageSize, bills?.length, currentPage, results?.length);
  const cumulativeBillTotal = React.useMemo(
    () => bills.reduce((sum, bill) => sum + Number(bill.totalAmount ?? 0), 0),
    [bills],
  );

  const handleLaunchBillForm = () => {
    if (shouldRequireVisit) {
      launchPatientWorkspaceRequiringVisit({ patientUuid });
      return;
    }

    launchBillingWorkspace('billing-form', { patientUuid });
  };

  const handleDiscardSelectedBill = React.useCallback(async () => {
    await mutate();
    setSelectedBillUuid(null);
  }, [mutate]);

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
    {
      header: t('print', 'Print'),
      key: 'print',
    },
  ];

  const setBilledItems = (bill) =>
    bill.lineItems?.reduce(
      (acc, item) => acc + (acc ? ' & ' : '') + (item.billableService?.split(':')[1] || item.item?.split(':')[1] || ''),
      '',
    );
  const billingUrl = '${openmrsSpaBase}/home/billing/patient/${patientUuid}/${billUuid}';

  const rowData = results?.map((bill) => ({
    id: bill.uuid,
    billTotal: bill.totalAmount,
    billDate: <span className={styles.billDateCell}>{bill.dateCreated}</span>,
    invoiceNumber: (
      <ConfigurableLink
        style={{ textDecoration: 'none' }}
        to={billingUrl}
        templateParams={{ patientUuid, billUuid: bill.uuid }}>
        {bill.receiptNumber ?? '--'}
      </ConfigurableLink>
    ),
    billedItems: setBilledItems(bill),
    status:
      bill.status === PaymentStatus.PENDING || bill.status === PaymentStatus.POSTED ? (
        <div className={styles.billingActionContainer}>
          <Button
            className={styles.billingActionButton}
            kind="tertiary"
            size="sm"
            renderIcon={TaskComplete}
            onClick={() => setSelectedBillUuid(bill.uuid)}
            aria-label={t('viewBillStatusForInvoice', 'View bill details for invoice {{invoiceNumber}}', {
              invoiceNumber: bill.receiptNumber ?? bill.uuid,
            })}>
            {bill.status}
          </Button>
        </div>
      ) : (
        bill.status
      ),
    print: <BillHistoryPrintActions bill={bill} />,
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
                <TableContainer {...getTableContainerProps}>
                  <Table {...getTableProps()} aria-label="Bill list">
                    <TableHead>
                      <TableRow>
                        {headers.map((header, i) => (
                          <TableHeader
                            key={i}
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
                            <TableCell key={cell.id}>{cell.value}</TableCell>
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
                {t('cumulativeBillTotal', 'Cumulative total: {{total}}', {
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

const BillHistoryPrintActions: React.FC<{ bill: MappedBill }> = ({ bill }) => {
  const { t } = useTranslation();
  const canPrintReceipt = bill?.status === PaymentStatus.PAID || Number(bill?.tenderedAmount ?? 0) > 0;

  const openPrintPreview = (documentUrl: string, title: string) => {
    const dispose = showModal('print-preview-modal', {
      onClose: () => dispose(),
      title,
      documentUrl,
    });
  };

  return (
    <OverflowMenu
      aria-label={t('print', 'Print')}
      iconDescription={t('print', 'Print')}
      className={styles.printMenuTrigger}
      flipped
      size="sm">
      <OverflowMenuItem
        itemText={t('printBill', 'Print bill')}
        onClick={() =>
          openPrintPreview(
            `/openmrs${restBaseUrl}/cashier/print?documentType=invoice&billId=${bill?.id}`,
            `${t('invoice', 'Invoice')} ${bill?.receiptNumber ?? ''}`.trim(),
          )
        }
      />
      <OverflowMenuItem
        itemText={t('printReceipt', 'Print receipt')}
        disabled={!canPrintReceipt}
        onClick={() =>
          openPrintPreview(
            `/openmrs${restBaseUrl}/cashier/receipt?billId=${bill?.id}`,
            `${t('receipt', 'Receipt')} ${bill?.receiptNumber ?? ''}`.trim(),
          )
        }
      />
      <OverflowMenuItem
        itemText={t('printStatement', 'Print Statement')}
        onClick={() =>
          openPrintPreview(
            `/openmrs${restBaseUrl}/cashier/print?documentType=billstatement&billId=${bill?.id}`,
            `${t('billStatement', 'Bill Statement')} ${bill?.receiptNumber ?? ''}`.trim(),
          )
        }
      />
    </OverflowMenu>
  );
};

const BillHistorySelectedBill: React.FC<{ billUuid: string; onDiscard: () => void | Promise<void> }> = ({
  billUuid,
  onDiscard,
}) => {
  const { t } = useTranslation();
  const { bill, isLoading, error } = useBill(billUuid);

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
