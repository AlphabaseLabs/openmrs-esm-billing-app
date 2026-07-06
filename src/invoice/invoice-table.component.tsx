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
import { isDesktop, showSnackbar, useDebounce, useLayoutType, EditIcon } from '@openmrs/esm-framework';
import { type LineItem, type MappedBill, PaymentStatus } from '../types';
import styles from './invoice-table.scss';
import { Add, Document, TrashCan } from '@carbon/react/icons';
import useBillableServices from '../hooks/useBillableServices';
import { launchBillingWorkspace } from '../workspaces';
import { formatBillAmount } from '../helpers';
import { updateBillLineItem } from '../billing.resource';
import {
  canEditLineItem,
  EditableBillItemCell,
  EditableDiscountCell,
  EditablePriceCell,
  EditableQuantityCell,
  getLineItemDiscountAmount,
  getLineItemLabel,
  getLineItemTaxAmount,
  getLineItemTotal,
  type ActiveEditorKey,
  type EditableLineItemCommit,
} from './editable-line-item-cells';

type InvoiceTableProps = {
  bill: MappedBill;
  isSelectable?: boolean;
  isLoadingBill?: boolean;
  selectedLineItems?: Array<LineItem>;
  onSelectItem?: (selectedLineItems: LineItem[]) => void;
  onLineItemUpdated?: (lineItem: LineItem) => void;
};

const InvoiceTable: React.FC<InvoiceTableProps> = ({
  bill,
  isSelectable = true,
  isLoadingBill,
  selectedLineItems = [],
  onSelectItem,
  onLineItemUpdated,
}) => {
  const { t } = useTranslation();
  const { lineItems } = bill;
  const { billableServices } = useBillableServices();
  const layout = useLayoutType();
  const responsiveSize = isDesktop(layout) ? 'sm' : 'lg';
  const [searchTerm, setSearchTerm] = useState('');
  const [activeEditorKey, setActiveEditorKey] = useState<ActiveEditorKey>(null);
  const debouncedSearchTerm = useDebounce(searchTerm);
  const selectedLineItemUuids = useMemo(() => new Set(selectedLineItems.map((item) => item.uuid)), [selectedLineItems]);
  const shortNamesByServiceUuid = useMemo(
    () => new Map(billableServices.map((service) => [service.uuid, `${service.shortName ?? ''}`.trim()])),
    [billableServices],
  );
  const filteredLineItems = useMemo(() => {
    if (!debouncedSearchTerm) {
      return lineItems;
    }

    return fuzzy
      .filter(debouncedSearchTerm, lineItems, {
        extract: (lineItem: LineItem) => {
          const serviceUuid = lineItem.billableService?.split(':')[0];
          const shortName = (serviceUuid && shortNamesByServiceUuid.get(serviceUuid)) || '';
          return `${lineItem.billableService || ''} ${lineItem.item || ''} ${shortName} ${
            lineItem.dateCreated || lineItem.auditInfo?.dateCreated || ''
          }`;
        },
      })
      .sort((r1, r2) => r1.score - r2.score)
      .map((result) => result.original);
  }, [debouncedSearchTerm, lineItems, shortNamesByServiceUuid]);

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
      navigateToBillAfterSave: true,
    });
  }, [bill.patientUuid, t]);

  const tableRows = useMemo(() => {
    return (
      filteredLineItems?.map((item, index) => {
        const lineItemDiscount = getLineItemDiscountAmount(item);
        const lineItemTax = getLineItemTaxAmount(item);
        const lineItemTotal = getLineItemTotal(item);
        return {
          no: `${index + 1}`,
          id: `${item.uuid}`,
          billItem: getLineItemLabel(item),
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

  const handleLineItemCommit: EditableLineItemCommit = useCallback(
    async (lineItem, updates, optimisticLineItem) => {
      try {
        const response = await updateBillLineItem(lineItem.uuid, updates);
        if (!response.ok) {
          throw new Error('Line item update failed');
        }
        onLineItemUpdated?.(optimisticLineItem);
      } catch (error) {
        showSnackbar({
          title: t('billUpdate', 'Bill update'),
          subtitle: t('billUpdateError', 'An error occurred while updating the bill'),
          kind: 'error',
          timeoutInMs: 5000,
        });
        throw error;
      }
    },
    [onLineItemUpdated, t],
  );

  if (isLoadingBill) {
    return (
      <div className={styles.loaderContainer}>
        <DataTableSkeleton columnCount={tableHeaders.length} showHeader={false} showToolbar={false} zebra />
      </div>
    );
  }

  const handleRowSelection = (row, checkedOrEvent: boolean | React.ChangeEvent<HTMLInputElement>) => {
    const checked = typeof checkedOrEvent === 'boolean' ? checkedOrEvent : checkedOrEvent.target.checked;
    const matchingRow = filteredLineItems.find((item) => item.uuid === row.id);
    let newSelectedLineItems;

    if (checked && matchingRow) {
      newSelectedLineItems = [...selectedLineItems, matchingRow];
    } else {
      newSelectedLineItems = selectedLineItems.filter((item) => item.uuid !== row.id);
    }
    onSelectItem?.(newSelectedLineItems);
  };

  const renderCellContent = (cell, matchingItem?: LineItem) => {
    if (!matchingItem) {
      return cell.value;
    }

    const isEditable = canEditLineItem(matchingItem, bill.closed || bill.status === PaymentStatus.PAID);

    switch (cell.info.header) {
      case 'billItem':
        return (
          <EditableBillItemCell
            lineItem={matchingItem}
            billableServices={billableServices}
            isEditable={isEditable}
            activeEditorKey={activeEditorKey}
            setActiveEditorKey={setActiveEditorKey}
            onCommit={handleLineItemCommit}
          />
        );
      case 'price':
        return (
          <EditablePriceCell
            lineItem={matchingItem}
            billableServices={billableServices}
            isEditable={isEditable}
            activeEditorKey={activeEditorKey}
            setActiveEditorKey={setActiveEditorKey}
            onCommit={handleLineItemCommit}
          />
        );
      case 'discount':
        return (
          <EditableDiscountCell
            lineItem={matchingItem}
            isEditable={isEditable}
            activeEditorKey={activeEditorKey}
            setActiveEditorKey={setActiveEditorKey}
            onCommit={handleLineItemCommit}
          />
        );
      case 'quantity':
        return (
          <EditableQuantityCell
            lineItem={matchingItem}
            isEditable={isEditable}
            activeEditorKey={activeEditorKey}
            setActiveEditorKey={setActiveEditorKey}
            onCommit={handleLineItemCommit}
          />
        );
      default:
        return cell.value;
    }
  };

  const getCellClassName = (cell) => {
    if (cell.info.header === 'billItem') {
      return styles.billItemCell;
    }

    if (cell.info.header === 'no') {
      return styles.numberCell;
    }

    if (cell.info.header === 'status') {
      return styles.statusCell;
    }

    if (['price', 'discount'].includes(cell.info.header)) {
      return `${styles.numericCell} ${styles.editableNumericCellColumn} ${
        cell.info.header === 'price' ? styles.priceCell : styles.discountCell
      }`;
    }

    if (cell.info.header === 'quantity') {
      return `${styles.numericCell} ${styles.quantityCell}`;
    }

    if (cell.info.header === 'tax') {
      return `${styles.numericCell} ${styles.taxCell}`;
    }

    if (cell.info.header === 'total') {
      return `${styles.numericCell} ${styles.totalCell}`;
    }

    if (cell.info.header === 'actionButton') {
      return styles.actionCell;
    }

    return undefined;
  };

  const getHeaderClassName = (header) => {
    if (header.key === 'billItem') {
      return styles.billItemHeaderCell;
    }

    if (header.key === 'no') {
      return styles.numberHeaderCell;
    }

    if (header.key === 'status') {
      return styles.statusHeaderCell;
    }

    if (['price', 'discount'].includes(header.key)) {
      return `${styles.numericHeaderCell} ${styles.editableNumericHeaderCell} ${
        header.key === 'price' ? styles.priceHeaderCell : styles.discountHeaderCell
      }`;
    }

    if (header.key === 'quantity') {
      return `${styles.numericHeaderCell} ${styles.quantityHeaderCell}`;
    }

    if (header.key === 'tax') {
      return `${styles.numericHeaderCell} ${styles.taxHeaderCell}`;
    }

    if (header.key === 'total') {
      return `${styles.numericHeaderCell} ${styles.totalHeaderCell}`;
    }

    if (header.key === 'actionButton') {
      return styles.actionHeaderCell;
    }

    return undefined;
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
                    <TableHeader key={header.key} className={getHeaderClassName(header)}>
                      {header.header}
                    </TableHeader>
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
                            selectedLineItemUuids.has(row.id)
                          }
                        />
                      )}
                      {row.cells.map((cell) => (
                        <TableCell key={cell.id} className={getCellClassName(cell)}>
                          {renderCellContent(cell, matchingItem)}
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
