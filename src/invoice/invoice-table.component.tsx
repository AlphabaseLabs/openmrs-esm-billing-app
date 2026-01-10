import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import fuzzy from 'fuzzy';
import {
  DataTable,
  DataTableSkeleton,
  IconButton,
  Layer,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  TableSelectRow,
  Tile,
  Button,
} from '@carbon/react';
import {
  isDesktop,
  useDebounce,
  useLayoutType,
  launchWorkspace,
  EditIcon,
  TrashCanIcon,
  useConfig,
  getCoreTranslation,
  usePatient,
  setCurrentVisit,
} from '@openmrs/esm-framework';
import { getPatientChartStore, useLaunchWorkspaceRequiringVisit } from '@openmrs/esm-patient-common-lib';
import { type LineItem, type MappedBill, PaymentStatus } from '../types';
import styles from './invoice-table.scss';
import { Add, TrashCan } from '@carbon/react/icons';

type InvoiceTableProps = {
  bill: MappedBill;
  isSelectable?: boolean;
  isLoadingBill?: boolean;
  onSelectItem?: (selectedLineItems: LineItem[]) => void;
};

const InvoiceTable: React.FC<InvoiceTableProps> = ({ bill, isSelectable = true, isLoadingBill, onSelectItem }) => {
  const { t } = useTranslation();
  const { lineItems } = bill;
  const paidLineItems = lineItems?.filter((item) => item.paymentStatus === 'PAID') ?? [];
  const layout = useLayoutType();
  const responsiveSize = isDesktop(layout) ? 'sm' : 'lg';
  const [selectedLineItems, setSelectedLineItems] = useState(paidLineItems ?? []);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm);
  const { patient, isLoading: isLoadingPatient } = usePatient(bill.patientUuid);
  const launchPatientWorkspace = useLaunchWorkspaceRequiringVisit('billing-form');
  const state = useMemo(() => ({ patient, patientUuid: bill.patientUuid }), [patient, bill.patientUuid]);
  const filteredLineItems = useMemo(() => {
    if (!debouncedSearchTerm) {
      return lineItems;
    }

    return fuzzy
      .filter(debouncedSearchTerm, lineItems, {
        extract: (lineItem: LineItem) => `${lineItem.billableService || ''} ${lineItem.item || ''}`,
      })
      .sort((r1, r2) => r1.score - r2.score)
      .map((result) => result.original);
  }, [debouncedSearchTerm, lineItems]);

  const tableHeaders = useMemo(() => {
    const headers = [
      { header: t('number', 'Number'), key: 'no' }, // Width as a percentage
      { header: t('billItem', 'Bill item'), key: 'billItem' },
      { header: t('billCode', 'Bill code'), key: 'billCode' },
      { header: t('status', 'Status'), key: 'status' },
      { header: t('quantity', 'Quantity'), key: 'quantity' },
      { header: t('price', 'Price'), key: 'price' },
      { header: t('total', 'Total'), key: 'total' },
    ];
    
    // Only add Actions column if bill is not fully paid
    if (bill.status !== PaymentStatus.PAID) {
      headers.push({ header: getCoreTranslation('actions'), key: 'actionButton' });
    }
    
    return headers;
  }, [bill.status, t]);

  const handleCancelLineItem = useCallback(
    (row: LineItem) => {
      launchWorkspace('cancel-bill-workspace', {
        workspaceTitle: t('cancelBillForm', 'Cancel Bill Form'),
        bill,
        lineItem: row,
      });
    },
    [bill, t],
  );

  const handleEditLineItem = useCallback(
    (row: LineItem) => {
      // Create a bill object without the computed status to avoid triggering rounding logic
      // The status is calculated in mapBillProperties and may differ from the backend status
      const { status, ...billWithoutStatus } = bill;
      launchWorkspace('edit-bill-form', {
        workspaceTitle: t('editBillForm', 'Edit Bill Form'),
        lineItem: row,
        bill: billWithoutStatus,
      });
    },
    [bill, t],
  );

  const handleAddNewBillItem = useCallback(() => {
    if (patient) {
      setCurrentVisit(bill.patientUuid, null);
      launchPatientWorkspace({
        workspaceTitle: t('billingForm', 'Billing Form'),
        patientUuid: bill.patientUuid,
        patient,
      });
    }
  }, [patient, bill.patientUuid, launchPatientWorkspace, t]);

  useEffect(() => {
    if (patient) {
      getPatientChartStore().setState({ ...state });
      return () => {
        getPatientChartStore().setState({});
      };
    }
  }, [state, patient]);

  const processBillItem = (item) => (item?.item || item?.billableService)?.split(':')[1];

  const tableRows = useMemo(
    () =>
      filteredLineItems?.map((item, index) => {
        return {
          no: `${index + 1}`,
          id: `${item.uuid}`,
          billItem: processBillItem(item),
          billCode: bill.receiptNumber,
          status: item.paymentStatus,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
          actionButton:
            bill.status !== PaymentStatus.PAID ? (
              <div className={styles.actionButtons}>
                {
                  <IconButton
                    size="sm"
                    data-testid={`edit-button-${item.uuid}`}
                    label={t('editItem', 'Edit item')}
                    kind="ghost"
                    onClick={() => handleEditLineItem(item)}
                    disabled={item.paymentStatus !== PaymentStatus.PENDING}>
                    <EditIcon size={16} />
                  </IconButton>
                }
                {
                  <Button
                    size="sm"
                    hasIconOnly
                    data-testid={`cancel-button-${item.uuid}`}
                    renderIcon={(props) => <TrashCan size={16} {...props} />}
                    iconDescription={t('cancelItem', 'Cancel item')}
                    kind="danger--ghost"
                    onClick={() => handleCancelLineItem(item)}
                    disabled={item.paymentStatus !== PaymentStatus.PENDING}></Button>
                }
              </div>
            ) : null,
        };
      }) ?? [],
    [bill.receiptNumber, bill.status, filteredLineItems, t, handleEditLineItem, handleCancelLineItem],
  );

  if (isLoadingBill) {
    return (
      <div className={styles.loaderContainer}>
        <DataTableSkeleton columnCount={tableHeaders.length} showHeader={false} showToolbar={false} zebra />
      </div>
    );
  }

  const handleRowSelection = (row, checked: boolean) => {
    const matchingRow = filteredLineItems.find((item) => item.uuid === row.id);
    let newSelectedLineItems;

    if (checked) {
      newSelectedLineItems = [...selectedLineItems, matchingRow];
    } else {
      newSelectedLineItems = selectedLineItems.filter((item) => item.uuid !== row.id);
    }
    setSelectedLineItems(newSelectedLineItems);
    onSelectItem(newSelectedLineItems);
  };

  return (
    <div className={styles.invoiceContainer}>
      <DataTable headers={tableHeaders} isSortable rows={tableRows} size={responsiveSize} useZebraStyles>
        {({ rows, headers, getRowProps, getSelectionProps, getTableProps, getToolbarProps }) => (
          <TableContainer
            description={
              <span className={styles.tableDescription}>
                <span>{t('itemsToBeBilled', 'Items to be billed')}</span>
              </span>
            }
            title={t('lineItems', 'Line items')}>
            <div className={styles.toolbarWrapper}>
              <TableToolbar {...getToolbarProps()} className={styles.tableToolbar} size={responsiveSize}>
                <TableToolbarContent className={styles.headerContainer}>
                  <TableToolbarSearch
                    className={styles.searchbox}
                    expanded
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    placeholder={t('searchThisTable', 'Search this table')}
                    size={responsiveSize}
                  />
                  {!bill.closed && (
                    <Button
                      kind="ghost"
                      onClick={handleAddNewBillItem}
                      renderIcon={Add}
                      size={responsiveSize}
                      className={styles.addBillItemButton}
                      disabled={isLoadingPatient || !patient}>
                      {t('addNewBillItem', 'Add New Bill Item')}
                    </Button>
                  )}
                </TableToolbarContent>
              </TableToolbar>
            </div>
            <Table {...getTableProps()} aria-label="Invoice line items" className={styles.table}>
              <TableHead>
                <TableRow>
                  {rows.length > 1 && isSelectable ? <TableHeader /> : null}
                  {headers.map((header) => (
                    <TableHeader key={header.key}>{header.header}</TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => {
                  // Find matching item to get payment status (following reference pattern)
                  const matchingItem = filteredLineItems?.find((item) => `${item.uuid}` === row.id);
                  const paymentStatus = matchingItem?.paymentStatus;
                  
                  return (
                    <TableRow
                      key={row.id}
                      {...getRowProps({
                        row,
                      })}>
                      {rows.length > 1 && isSelectable && (
                        <TableSelectRow
                          aria-label="Select row"
                          {...getSelectionProps({ row })}
                          disabled={
                            paymentStatus === PaymentStatus.PAID ||
                            paymentStatus === PaymentStatus.EXEMPTED
                          }
                          onChange={(checked: boolean) => handleRowSelection(row, checked)}
                          checked={
                            paymentStatus === PaymentStatus.PAID ||
                            paymentStatus === PaymentStatus.EXEMPTED ||
                            Boolean(selectedLineItems?.find((item) => item?.uuid === row?.id))
                          }
                        />
                      )}
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
      {filteredLineItems?.length === 0 && (
        <div className={styles.filterEmptyState}>
          <Layer>
            <Tile className={styles.filterEmptyStateTile}>
              <p className={styles.filterEmptyStateContent}>
                {t('noMatchingItemsToDisplay', 'No matching items to display')}
              </p>
              <p className={styles.filterEmptyStateHelper}>{t('checkFilters', 'Check the filters above')}</p>
            </Tile>
          </Layer>
        </div>
      )}
    </div>
  );
};

export default InvoiceTable;
