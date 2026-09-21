import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import fuzzy from 'fuzzy';
import {
  Button,
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
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  TableSelectRow,
  Tile,
} from '@carbon/react';
import { isDesktop, showSnackbar, useDebounce, useLayoutType, useSession } from '@openmrs/esm-framework';
import { type LineItem, type MappedBill, PaymentStatus } from '../types';
import styles from './invoice-table.scss';
import { Document, TrashCan } from '@carbon/react/icons';
import useBillableServices from '../hooks/useBillableServices';
import { useAppointmentProviderOptions } from '../payment-points/payment-points.resource';
import { launchBillingWorkspace } from '../workspaces';
import { formatBillAmount, formatInvoiceDate } from '../helpers';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [activeEditorKey, setActiveEditorKey] = useState<ActiveEditorKey>(null);
  const nextDraftId = useRef(1);
  const [savingDraftIds, setSavingDraftIds] = useState<string[]>([]);
  const [draftIds, setDraftIds] = useState<string[]>(() => (lineItems.length ? [] : ['draft-0']));
  const draftBillUuid = useRef(bill.uuid);
  useEffect(() => {
    if (draftBillUuid.current !== bill.uuid) {
      draftBillUuid.current = bill.uuid;
      setDraftIds(lineItems.length ? [] : [`draft-${nextDraftId.current++}`]);
      setActiveEditorKey(null);
    }
  }, [bill.uuid, lineItems.length]);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<Array<LineItemColumnKey>>(() =>
    readLineItemColumnVisibilityPreference(),
  );
  const [blockedDeleteLineItem, setBlockedDeleteLineItem] = useState<LineItem | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [tableContainerWidth, setTableContainerWidth] = useState(0);
  const debouncedSearchTerm = useDebounce(searchTerm);
  const selectedLineItemUuids = useMemo(() => new Set(selectedLineItems.map((item) => item.uuid)), [selectedLineItems]);
  const visibleColumnKeySet = useMemo(() => new Set(visibleColumnKeys), [visibleColumnKeys]);
  const visibleColumnDefinitions = useMemo(
    () => getLineItemColumnDefinitions().filter((column) => visibleColumnKeySet.has(column.key)),
    [visibleColumnKeySet],
  );
  const shortNamesByServiceUuid = useMemo(
    () => new Map(billableServices.map((service) => [service.uuid, `${service.shortName ?? ''}`.trim()])),
    [billableServices],
  );
  const providerNamesByUuid = useMemo(
    () => new Map(allProviderOptions.map((provider) => [provider.uuid, provider.label])),
    [allProviderOptions],
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
          const providerName = getLineItemProviderName(lineItem, providerNamesByUuid);
          return `${lineItem.billableService || ''} ${lineItem.item || ''} ${providerName} ${shortName} ${
            lineItem.dateCreated || lineItem.auditInfo?.dateCreated || ''
          }`;
        },
      })
      .sort((r1, r2) => r1.score - r2.score)
      .map((result) => result.original);
  }, [debouncedSearchTerm, lineItems, providerNamesByUuid, shortNamesByServiceUuid]);
  const shouldRenderSelectionColumn = filteredLineItems.length > 1 && isSelectable;
  const selectableLineItems = useMemo(
    () =>
      filteredLineItems.filter(
        (item) => item.paymentStatus !== PaymentStatus.PAID && item.paymentStatus !== PaymentStatus.EXEMPTED,
      ),
    [filteredLineItems],
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
      filteredLineItems?.map((item, index) => {
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
              <Button
                size="sm"
                hasIconOnly
                renderIcon={(props) => <Document size={16} {...props} />}
                iconDescription={t('costs', 'Costs')}
                kind="ghost"
                onClick={() => handleCostsWorkspaceLaunch(item)}
              />
              {bill.status !== PaymentStatus.PAID && (
                <Button
                  size="sm"
                  hasIconOnly
                  data-testid={`cancel-button-${item.uuid}`}
                  renderIcon={(props) => <TrashCan size={16} {...props} />}
                  iconDescription={t('cancelItem', 'Cancel item')}
                  kind="ghost"
                  onClick={() => handleCancelLineItem(item)}
                />
              )}
            </div>
          ),
        };
      }) ?? []
    );
  }, [bill, filteredLineItems, providerNamesByUuid, t, handleCancelLineItem, handleCostsWorkspaceLaunch]);

  const handleLineItemCommit: EditableLineItemCommit = useCallback(
    async (lineItem, updates, optimisticLineItem) => {
      try {
        const response = await updateBillLineItem(lineItem.uuid, updates);
        if (!response.ok) {
          throw new Error('Line item update failed');
        }
        onLineItemUpdated?.(optimisticLineItem);
        onRefreshBill?.();
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
    const matchingRow = filteredLineItems.find((item) => item.uuid === row.id);
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
    <div className={styles.invoiceContainer} ref={tableContainerRef}>
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
                  <LineItemColumnSelector
                    onOpen={() => setActiveEditorKey(null)}
                    onVisibilityChange={handleColumnVisibilityChange}
                    visibleColumnKeys={visibleColumnKeys}
                  />
                </TableToolbarContent>
              </TableToolbar>
            </div>
            <Table
              {...getTableProps()}
              {...({ style: { minInlineSize: `${columnLayout.totalMinWidth}px` } } as any)}
              aria-label="Invoice line items"
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
                  const matchingItem = filteredLineItems?.find((item) => `${item.uuid}` === row.id);
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
                              onAdded={() => setDraftIds((current) => current.filter((id) => id !== draftId))}
                              onSavingChange={(isSaving) =>
                                setSavingDraftIds((current) =>
                                  isSaving ? [...current, draftId] : current.filter((id) => id !== draftId),
                                )
                              }
                            />
                          ) : column.key === 'actionButton' ? (
                            <div className={styles.actionButtons}>
                              <Button
                                size="sm"
                                hasIconOnly
                                renderIcon={TrashCan}
                                iconDescription={t('removeEmptyRow', 'Remove empty row')}
                                kind="ghost"
                                disabled={savingDraftIds.includes(draftId)}
                                onClick={() => {
                                  setActiveEditorKey((current) => (current === `${draftId}:billItem` ? null : current));
                                  setDraftIds((current) => current.filter((id) => id !== draftId));
                                }}
                              />
                            </div>
                          ) : null}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                {!bill.closed ? (
                  <TableRow className={styles.addItemRow} data-testid="invoice-table-add-item-row">
                    <TableCell className={styles.addItemCell} colSpan={columnLayout.columns.length}>
                      <Button
                        aria-label={t('addItem', 'Add item')}
                        className={styles.addItemButton}
                        kind="ghost"
                        onClick={() => {
                          const draftId = `draft-${nextDraftId.current++}`;
                          setActiveEditorKey(null);
                          setDraftIds((current) => [...current, draftId]);
                        }}
                        size="sm"
                        type="button">
                        <span aria-hidden="true" className={styles.addItemButtonPrefix}>
                          +
                        </span>
                        {t('addItem', 'Add item')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>
      {filteredLineItems?.length === 0 && (bill.closed || Boolean(debouncedSearchTerm)) && (
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
