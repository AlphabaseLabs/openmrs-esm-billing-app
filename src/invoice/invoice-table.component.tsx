import { CardHeader } from '@openmrs/esm-patient-common-lib';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  IconButton,
  ComposedModal,
  DataTable,
  DataTableSkeleton,
  Layer,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableSelectAll,
  TableSelectRow,
  Tile,
  Tooltip,
} from '@carbon/react';
import { isDesktop, showSnackbar, useLayoutType, useSession } from '@openmrs/esm-framework';
import { type LineItem, type MappedBill, PaymentStatus } from '../types';
import styles from './invoice-table.scss';
import { Add, Document, TrashCan } from '@carbon/react/icons';
import useBillableServices from '../hooks/useBillableServices';
import { useAppointmentProviderOptions } from '../payment-points/payment-points.resource';
import { launchBillingWorkspace } from '../workspaces';
import { formatBillAmount, formatBillDateTime, formatInvoiceDate } from '../helpers';
import { updateBillLineItem } from '../billing.resource';
import {
  canEditLineItem,
  EditableBillItemCell,
  EditableDiscountCell,
  EditablePriceCell,
  EditableProviderCell,
  EditableQuantityCell,
  getLineItemDiscountAmount,
  getLineItemLabel,
  getLineItemTaxAmount,
  getLineItemTotal,
  type ActiveEditorKey,
  type EditableLineItemCommit,
} from './editable-line-item-cells';
import {
  getLineItemColumnDefinitions,
  getLineItemTableLayoutColumns,
  getVisibleOptionalLineItemColumnKeys,
  calculateLineItemTableColumnLayout,
  normalizeLineItemVisibleColumnKeys,
  readLineItemColumnVisibilityPreference,
  writeLineItemColumnVisibilityPreference,
  type LineItemColumnKey,
} from './line-item-column-visibility';
import AddLineItemCell from './add-line-item-cell.component';
import LineItemColumnSelector from './line-item-column-selector.component';

type InvoiceTableProps = {
  bill: MappedBill;
  isSelectable?: boolean;
  isLoadingBill?: boolean;
  selectedLineItems?: Array<LineItem>;
  onSelectItem?: (selectedLineItems: LineItem[]) => void;
  onLineItemUpdated?: (lineItem: LineItem) => void;
  onRefreshBill?: () => unknown;
  onVisibleColumnsChange?: (visibleColumnKeys: Array<LineItemColumnKey>) => void;
};

const getLineItemProviderName = (lineItem: LineItem, providerNamesByUuid: ReadonlyMap<string, string>) =>
  (lineItem.provider?.uuid && providerNamesByUuid.get(lineItem.provider.uuid)) || lineItem.provider?.display || '';

const InvoiceTable: React.FC<InvoiceTableProps> = ({
  bill,
  isSelectable = true,
  isLoadingBill,
  selectedLineItems = [],
  onSelectItem,
  onLineItemUpdated,
  onRefreshBill,
  onVisibleColumnsChange,
}) => {
  const { t } = useTranslation();
  const { lineItems } = bill;
  const { billableServices } = useBillableServices();
  const { allProviderOptions, providerOptions, isLoading: isLoadingProviders } = useAppointmentProviderOptions();
  const { currentProvider } = useSession();
  const layout = useLayoutType();
  const responsiveSize = isDesktop(layout) ? 'sm' : 'lg';
  const [activeEditorKey, setActiveEditorKey] = useState<ActiveEditorKey>(null);
  const nextDraftId = useRef(1);
  const [draftIds, setDraftIds] = useState<string[]>(['draft-0']);
  const draftBillUuid = useRef(bill.uuid);
  useEffect(() => {
    if (draftBillUuid.current !== bill.uuid) {
      draftBillUuid.current = bill.uuid;
      setDraftIds([`draft-${nextDraftId.current++}`]);
      setActiveEditorKey(null);
    }
  }, [bill.uuid]);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<Array<LineItemColumnKey>>(() =>
    readLineItemColumnVisibilityPreference(),
  );
  const [blockedDeleteLineItem, setBlockedDeleteLineItem] = useState<LineItem | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [tableContainerWidth, setTableContainerWidth] = useState(0);
  const selectedLineItemUuids = useMemo(() => new Set(selectedLineItems.map((item) => item.uuid)), [selectedLineItems]);
  const visibleColumnKeySet = useMemo(() => new Set(visibleColumnKeys), [visibleColumnKeys]);
  const visibleColumnDefinitions = useMemo(
    () => getLineItemColumnDefinitions().filter((column) => visibleColumnKeySet.has(column.key)),
    [visibleColumnKeySet],
  );
  const providerNamesByUuid = useMemo(
    () => new Map(allProviderOptions.map((provider) => [provider.uuid, provider.label])),
    [allProviderOptions],
  );
  const shouldRenderSelectionColumn = lineItems.length > 1 && isSelectable;
  const selectableLineItems = useMemo(
    () =>
      lineItems.filter(
        (item) => item.paymentStatus !== PaymentStatus.PAID && item.paymentStatus !== PaymentStatus.EXEMPTED,
      ),
    [lineItems],
  );
  const selectedSelectableLineItemCount = selectableLineItems.filter((item) =>
    selectedLineItemUuids.has(item.uuid),
  ).length;
  const areAllSelectableLineItemsSelected =
    selectableLineItems.length > 0 && selectedSelectableLineItemCount === selectableLineItems.length;
  const areSomeSelectableLineItemsSelected = selectedSelectableLineItemCount > 0 && !areAllSelectableLineItemsSelected;
  const renderedLayoutColumns = useMemo(
    () => getLineItemTableLayoutColumns(visibleColumnDefinitions, shouldRenderSelectionColumn),
    [shouldRenderSelectionColumn, visibleColumnDefinitions],
  );
  const columnLayout = useMemo(
    () => calculateLineItemTableColumnLayout(renderedLayoutColumns, tableContainerWidth),
    [renderedLayoutColumns, tableContainerWidth],
  );

  useEffect(() => {
    onVisibleColumnsChange?.(visibleColumnKeys);
  }, [onVisibleColumnsChange, visibleColumnKeys]);

  const tableHeaders = useMemo(() => {
    return visibleColumnDefinitions.map((column) => ({
      header: t(column.translationKey, column.defaultLabel),
      key: column.key,
    }));
  }, [t, visibleColumnDefinitions]);

  useEffect(() => {
    const element = tableContainerRef.current;

    if (!element) {
      return;
    }

    const updateContainerWidth = (width: number) => {
      const nextWidth = Math.floor(width);
      setTableContainerWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
    };

    updateContainerWidth(element.getBoundingClientRect().width);

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (entry) {
        updateContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, []);

  const handleCancelLineItem = useCallback(
    (row: LineItem) => {
      if (row.paymentStatus !== PaymentStatus.PENDING) {
        setBlockedDeleteLineItem(row);
        return;
      }

      launchBillingWorkspace('cancel-bill-workspace', {
        bill,
        lineItem: row,
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

  const handleColumnVisibilityChange = useCallback((columnKey: LineItemColumnKey, checked: boolean) => {
    setActiveEditorKey(null);
    setVisibleColumnKeys((currentVisibleColumnKeys) => {
      const nextVisibleOptionalColumnKeys = new Set(getVisibleOptionalLineItemColumnKeys(currentVisibleColumnKeys));

      if (checked) {
        nextVisibleOptionalColumnKeys.add(columnKey);
      } else {
        nextVisibleOptionalColumnKeys.delete(columnKey);
      }

      const nextVisibleColumnKeys = normalizeLineItemVisibleColumnKeys(Array.from(nextVisibleOptionalColumnKeys));
      writeLineItemColumnVisibilityPreference(nextVisibleColumnKeys);

      return nextVisibleColumnKeys;
    });
  }, []);

  const tableRows = useMemo(() => {
    return (
      lineItems?.map((item, index) => {
        const lineItemDiscount = getLineItemDiscountAmount(item);
        const lineItemTax = getLineItemTaxAmount(item);
        const lineItemTotal = getLineItemTotal(item);
        return {
          no: `${index + 1}`,
          date: formatInvoiceDate(item.dateCreated || item.auditInfo?.dateCreated),
          id: `${item.uuid}`,
          billItem: getLineItemLabel(item),
          provider: getLineItemProviderName(item, providerNamesByUuid),
          status: item.paymentStatus,
          quantity: item.quantity,
          price: formatBillAmount(item.price),
          discount: formatBillAmount(lineItemDiscount),
          tax: formatBillAmount(lineItemTax),
          total: formatBillAmount(lineItemTotal),
          actionButton: (
            <div className={styles.actionButtons}>
              <IconButton
                size="sm"
                kind="ghost"
                autoAlign
                align="top-start"
                aria-labelledby=""
                label={t('costs', 'Costs')}
                aria-label={t('costs', 'Costs')}
                onClick={() => handleCostsWorkspaceLaunch(item)}>
                <Document size={16} />
              </IconButton>
              {bill.status !== PaymentStatus.PAID && (
                <IconButton
                  size="sm"
                  kind="ghost"
                  autoAlign
                  align="top-start"
                  aria-labelledby=""
                  label={t('cancelItem', 'Cancel item')}
                  aria-label={t('cancelItem', 'Cancel item')}
                  data-testid={`cancel-button-${item.uuid}`}
                  onClick={() => handleCancelLineItem(item)}>
                  <TrashCan size={16} />
                </IconButton>
              )}
            </div>
          ),
        };
      }) ?? []
    );
  }, [bill, lineItems, providerNamesByUuid, t, handleCancelLineItem, handleCostsWorkspaceLaunch]);

  const handleLineItemCommit: EditableLineItemCommit = useCallback(
    async (lineItem, updates, optimisticLineItem) => {
      try {
        const response = await updateBillLineItem(lineItem.uuid, updates);
        if (!response.ok) {
          throw new Error('Line item update failed');
        }
        onLineItemUpdated?.(optimisticLineItem);
        // The edit is saved; a background refresh failure must not report a failed save.
        void Promise.resolve()
          .then(() => onRefreshBill?.())
          .catch(() => undefined);
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
    [onLineItemUpdated, onRefreshBill, t],
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
    const matchingRow = lineItems.find((item) => item.uuid === row.id);
    let newSelectedLineItems = selectedLineItems;

    if (checked && matchingRow && !selectedLineItemUuids.has(matchingRow.uuid)) {
      newSelectedLineItems = [...selectedLineItems, matchingRow];
    } else if (!checked) {
      newSelectedLineItems = selectedLineItems.filter((item) => item.uuid !== row.id);
    }
    onSelectItem?.(newSelectedLineItems);
  };

  const handleSelectAll = () => {
    const selectableLineItemUuids = new Set(selectableLineItems.map((item) => item.uuid));
    const nextSelectedLineItems = areAllSelectableLineItemsSelected
      ? selectedLineItems.filter((item) => !selectableLineItemUuids.has(item.uuid))
      : Array.from(
          new Map([...selectedLineItems, ...selectableLineItems].map((lineItem) => [lineItem.uuid, lineItem])).values(),
        );

    onSelectItem?.(nextSelectedLineItems);
  };

  const renderCellContent = (cell, matchingItem?: LineItem) => {
    if (!matchingItem) {
      return cell.value;
    }

    const isEditable = canEditLineItem(matchingItem, bill.closed);

    switch (cell.info.header) {
      case 'date': {
        const tooltip = formatBillDateTime(matchingItem.dateCreated || matchingItem.auditInfo?.dateCreated);
        return tooltip ? (
          <Tooltip autoAlign align="top-start" label={tooltip} enterDelayMs={0}>
            <span tabIndex={0}>{cell.value}</span>
          </Tooltip>
        ) : (
          cell.value
        );
      }
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
      case 'provider':
        return (
          <EditableProviderCell
            lineItem={matchingItem}
            providerName={getLineItemProviderName(matchingItem, providerNamesByUuid)}
            providerOptions={providerOptions}
            isLoadingProviders={isLoadingProviders}
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
            providerOptions={allProviderOptions}
            isLoadingProviders={isLoadingProviders}
            currentProvider={currentProvider}
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
    if (cell.info.header === 'no') {
      return styles.numberCell;
    }

    if (['price', 'discount'].includes(cell.info.header)) {
      return `${styles.numericCell} ${styles.editableNumericCellColumn}`;
    }

    if (cell.info.header === 'quantity') {
      return `${styles.numericCell} ${styles.quantityCell}`;
    }

    if (['tax', 'total'].includes(cell.info.header)) {
      return styles.numericCell;
    }

    if (cell.info.header === 'actionButton') {
      return styles.actionCell;
    }

    return undefined;
  };

  const getHeaderClassName = (header) => {
    if (header.key === 'no') {
      return styles.numberHeaderCell;
    }

    if (['price', 'discount'].includes(header.key)) {
      return `${styles.numericHeaderCell} ${styles.editableNumericHeaderCell}`;
    }

    if (header.key === 'quantity') {
      return `${styles.numericHeaderCell} ${styles.quantityHeaderCell}`;
    }

    if (['tax', 'total'].includes(header.key)) {
      return styles.numericHeaderCell;
    }

    if (header.key === 'actionButton') {
      return styles.actionHeaderCell;
    }

    return undefined;
  };

  return (
    <div className={styles.invoiceContainer} ref={tableContainerRef}>
      <DataTable headers={tableHeaders} isSortable rows={tableRows} size={responsiveSize} useZebraStyles>
        {({ rows, headers, getRowProps, getSelectionProps, getTableProps }) => (
          <TableContainer>
            <CardHeader title={t('lineItems', 'Line items')}>
              <div className={styles.columnSelectorActions}>
                <LineItemColumnSelector
                  onOpen={() => setActiveEditorKey(null)}
                  onVisibilityChange={handleColumnVisibilityChange}
                  visibleColumnKeys={visibleColumnKeys}
                />
              </div>
            </CardHeader>
            <Table
              {...getTableProps()}
              {...({ style: { minInlineSize: `${columnLayout.totalMinWidth}px` } } as any)}
              aria-label={t('lineItems', 'Line items')}
              className={styles.table}>
              <colgroup>
                {columnLayout.columns.map((column) => (
                  <col key={column.key} style={{ inlineSize: `${column.width}px`, width: `${column.width}px` }} />
                ))}
              </colgroup>
              <TableHead>
                <TableRow>
                  {shouldRenderSelectionColumn ? (
                    <TableSelectAll
                      {...getSelectionProps()}
                      aria-label={
                        areAllSelectableLineItemsSelected
                          ? t('unselectAllLineItems', 'Unselect all line items')
                          : t('selectAllLineItems', 'Select all line items')
                      }
                      checked={areAllSelectableLineItemsSelected}
                      disabled={selectableLineItems.length === 0}
                      indeterminate={areSomeSelectableLineItemsSelected}
                      onSelect={handleSelectAll}
                    />
                  ) : null}
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
                  const matchingItem = lineItems?.find((item) => `${item.uuid}` === row.id);
                  const paymentStatus = matchingItem?.paymentStatus;

                  return (
                    <TableRow
                      key={row.id}
                      {...getRowProps({
                        row,
                      })}>
                      {shouldRenderSelectionColumn && (
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
                {!bill.closed &&
                  draftIds.map((draftId) => (
                    <TableRow key={draftId} data-testid="invoice-table-draft-row">
                      {shouldRenderSelectionColumn ? <TableCell /> : null}
                      {visibleColumnDefinitions.map((column) => (
                        <TableCell key={column.key} className={getCellClassName({ info: { header: column.key } })}>
                          {column.key === 'billItem' ? (
                            <AddLineItemCell
                              bill={bill}
                              draftId={draftId}
                              billableServices={billableServices}
                              activeEditorKey={activeEditorKey}
                              setActiveEditorKey={setActiveEditorKey}
                              onLineItemUpdated={onLineItemUpdated}
                              onRefreshBill={onRefreshBill}
                              onAdded={() => {
                                const nextId = `draft-${nextDraftId.current++}`;
                                setDraftIds((current) => {
                                  // Ignore a save that completed after switching to another bill.
                                  if (!current.includes(draftId)) return current;
                                  const remaining = current.filter((id) => id !== draftId);
                                  return remaining.length ? remaining : [nextId];
                                });
                              }}
                            />
                          ) : null}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            {!bill.closed ? (
              <div className={styles.addItemActions} data-testid="invoice-table-add-item-footer">
                <Button
                  aria-label={t('addItem', 'Add item')}
                  kind="primary"
                  renderIcon={Add}
                  onClick={() => {
                    const draftId = `draft-${nextDraftId.current++}`;
                    setActiveEditorKey(null);
                    setDraftIds((current) => [...current, draftId]);
                  }}
                  size="sm"
                  type="button">
                  {t('addItem', 'Add item')}
                </Button>
              </div>
            ) : null}
          </TableContainer>
        )}
      </DataTable>
      {lineItems?.length === 0 && bill.closed && (
        <div className={styles.emptyState}>
          <Layer>
            <Tile className={styles.emptyStateTile}>
              <p className={styles.emptyStateContent}>{t('noLineItemsToDisplay', 'No line items to display')}</p>
            </Tile>
          </Layer>
        </div>
      )}
      <ComposedModal open={!!blockedDeleteLineItem} size="sm" onClose={() => setBlockedDeleteLineItem(null)}>
        <ModalHeader
          closeModal={() => setBlockedDeleteLineItem(null)}
          title={
            blockedDeleteLineItem
              ? t('lineItemStillInUse', '{{itemName}} is still in use', {
                  itemName: getLineItemLabel(blockedDeleteLineItem),
                })
              : ''
          }
        />
        <ModalBody>
          {t(
            'deleteLineItemStillInUseMessage',
            'To delete this item, first delete the payments and expenses or provider shares linked to it.',
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            className={styles.deleteBlockerModalPrimaryButton}
            kind="primary"
            onClick={() => setBlockedDeleteLineItem(null)}>
            {t('gotIt', 'Got it')}
          </Button>
        </ModalFooter>
      </ComposedModal>
    </div>
  );
};

export default InvoiceTable;
