import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import fuzzy from 'fuzzy';
import {
  Button,
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
} from '@carbon/react';
import { isDesktop, useDebounce, useLayoutType, EditIcon } from '@openmrs/esm-framework';
import { type LineItem, type MappedBill, PaymentStatus } from '../types';
import styles from './invoice-table.scss';
import { Add, Document, TrashCan } from '@carbon/react/icons';
import { launchBillingWorkspace } from '../workspaces';
import { formatBillAmount } from '../helpers';

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
  const filteredLineItems = useMemo(() => {
    if (!debouncedSearchTerm) {
      return lineItems;
    }

    return fuzzy
      .filter(debouncedSearchTerm, lineItems, {
        extract: (lineItem: LineItem) =>
          `${lineItem.billableService || ''} ${lineItem.item || ''} ${lineItem.dateCreated || lineItem.auditInfo?.dateCreated || ''}`,
      })
      .sort((r1, r2) => r1.score - r2.score)
      .map((result) => result.original);
  }, [debouncedSearchTerm, lineItems]);

  const tableHeaders = useMemo(() => {
    const headers = [
      { header: t('number', 'Number'), key: 'no' },
      { header: t('billItem', 'Bill item'), key: 'billItem' },
      { header: t('status', 'Status'), key: 'status' },
      { header: t('quantity', 'Quantity'), key: 'quantity' },
      { header: t('price', 'Price'), key: 'price' },
      { header: t('discount', 'Discount'), key: 'discount' },
      { header: t('tax', 'Tax'), key: 'tax' },
      { header: t('total', 'Total'), key: 'total' },
      { header: t('action', 'Action'), key: 'actionButton' },
    ];

    return headers;
  }, [t]);

  const handleCancelLineItem = useCallback(
    (row: LineItem) => {
      launchBillingWorkspace('cancel-bill-workspace', {
        bill,
        lineItem: row,
      });
    },
    [bill],
  );

  const handleEditLineItem = useCallback(
    (row: LineItem) => {
      // Create a bill object without the computed status to avoid triggering rounding logic
      // The status is calculated in mapBillProperties and may differ from the backend status
      const { status, ...billWithoutStatus } = bill;
      launchBillingWorkspace('edit-bill-form', {
        lineItem: row,
        bill: billWithoutStatus,
      });
    },
    [bill],
  );

  const handleCostsWorkspaceLaunch = useCallback(
    (row: LineItem) => {
      launchBillingWorkspace('costs-workspace', {
        bill: bill,
        lineItemUuid: row.uuid,
        lineItem: row,
      });
    },
    [bill],
  );

  const handleAddBillItem = useCallback(() => {
    launchBillingWorkspace('billing-form', {
      patientUuid: bill.patientUuid,
      workspaceTitle: t('addBillItem', 'Add bill item'),
    });
  }, [bill.patientUuid, t]);

  const tableRows = useMemo(() => {
    const processBillItem = (item) => (item?.item || item?.billableService)?.split(':')[1];
    const getLineItemDiscount = (item: LineItem) =>
      (item?.discounts ?? []).reduce((sum, discount) => sum + (discount?.amount ?? 0), 0);
    const getLineItemTax = (item: LineItem) => (item?.taxes ?? []).reduce((sum, tax) => sum + (tax?.amount ?? 0), 0);

    return (
      filteredLineItems?.map((item, index) => {
        const lineItemDiscount = getLineItemDiscount(item);
        const lineItemTax = getLineItemTax(item);
        const lineItemTotal = item.price * item.quantity + lineItemTax - lineItemDiscount;
        return {
          no: `${index + 1}`,
          id: `${item.uuid}`,
          billItem: processBillItem(item),
          status: item.paymentStatus,
          quantity: item.quantity,
          price: formatBillAmount(item.price),
          discount: formatBillAmount(lineItemDiscount),
          tax: formatBillAmount(lineItemTax),
          total: formatBillAmount(lineItemTotal),
          actionButton: (
            <div className={styles.actionButtons}>
              {bill.status !== PaymentStatus.PAID && (
                <>
                  <IconButton
                    size="sm"
                    data-testid={`edit-button-${item.uuid}`}
                    label={t('editItem', 'Edit item')}
                    kind="ghost"
                    onClick={() => handleEditLineItem(item)}
                    disabled={item.paymentStatus !== PaymentStatus.PENDING}>
                    <EditIcon size={16} />
                  </IconButton>
                  <Button
                    size="sm"
                    hasIconOnly
                    data-testid={`cancel-button-${item.uuid}`}
                    renderIcon={(props) => <TrashCan size={16} {...props} />}
                    iconDescription={t('cancelItem', 'Cancel item')}
                    kind="ghost"
                    onClick={() => handleCancelLineItem(item)}
                    disabled={item.paymentStatus !== PaymentStatus.PENDING}
                  />
                </>
              )}
              <Button
                size="sm"
                hasIconOnly
                renderIcon={(props) => <Document size={16} {...props} />}
                iconDescription={t('costs', 'Costs')}
                kind="ghost"
                onClick={() => handleCostsWorkspaceLaunch(item)}
              />
            </div>
          ),
        };
      }) ?? []
    );
  }, [bill, filteredLineItems, t, handleEditLineItem, handleCancelLineItem, handleCostsWorkspaceLaunch]);

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
    onSelectItem?.(newSelectedLineItems);
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
                  {!bill.closed ? (
                    <Button
                      className={styles.addBillItemButton}
                      kind="ghost"
                      size="sm"
                      renderIcon={Add}
                      onClick={handleAddBillItem}>
                      {t('addBillItem', 'Add bill item')}
                    </Button>
                  ) : null}
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
                          disabled={paymentStatus === PaymentStatus.PAID || paymentStatus === PaymentStatus.EXEMPTED}
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
