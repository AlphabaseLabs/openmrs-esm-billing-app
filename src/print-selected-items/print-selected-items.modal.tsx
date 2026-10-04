import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  InlineLoading,
  InlineNotification,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSelectAll,
  TableSelectRow,
} from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { type MappedBill } from '../types';
import { getActiveBillingRecords } from '../billing-voided-utils';
import { convertToCurrency, formatInvoiceDate } from '../helpers';
import { getLineItemLabel, getLineItemTotal } from '../invoice/editable-line-item-cells/utils';
import GenericPageModal from './generic-page-modal.component';
import { fetchSelectedItemsPdf } from './print-selected-items.resource';
import styles from './print-selected-items.scss';

interface PrintSelectedItemsModalProps {
  bill: MappedBill;
  onClose: () => void;
}

const PrintSelectedItemsModal: React.FC<PrintSelectedItemsModalProps> = ({ bill, onClose }) => {
  const { t } = useTranslation();
  const [selectedUuids, setSelectedUuids] = useState<Set<string>>(new Set());
  const [printUrl, setPrintUrl] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const requestRef = useRef<AbortController>();
  const printedUrlRef = useRef<string>();
  const lineItems = getActiveBillingRecords(bill.lineItems);
  const selectedItems = lineItems.filter((item) => selectedUuids.has(item.uuid));
  const allSelected = lineItems.length > 0 && selectedItems.length === lineItems.length;
  const selectedTotal = selectedItems.reduce((total, item) => total + Number(item.total ?? getLineItemTotal(item)), 0);

  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(
    () => () => {
      if (printUrl) {
        URL.revokeObjectURL(printUrl);
      }
    },
    [printUrl],
  );

  const toggleItem = (uuid: string) => {
    if (isLoading) return;
    setSelectedUuids((current) => {
      const next = new Set(current);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
    setHasError(false);
  };

  const print = async () => {
    if (!selectedItems.length || isLoading) return;
    const controller = new AbortController();
    requestRef.current?.abort();
    requestRef.current = controller;
    setPrintUrl(undefined);
    printedUrlRef.current = undefined;
    setIsLoading(true);
    setHasError(false);
    try {
      const pdf = await fetchSelectedItemsPdf(
        bill.id,
        selectedItems.map((item) => item.uuid),
        controller.signal,
      );
      if (!controller.signal.aborted) setPrintUrl(URL.createObjectURL(pdf));
    } catch {
      if (!controller.signal.aborted) {
        setHasError(true);
        setIsLoading(false);
      }
    }
  };

  const handlePrintError = () => {
    setPrintUrl(undefined);
    setHasError(true);
    setIsLoading(false);
  };

  const printDocument = (event: React.SyntheticEvent<HTMLIFrameElement>) => {
    if (!printUrl || printedUrlRef.current === printUrl) return;
    try {
      const printWindow = event.currentTarget.contentWindow;
      if (!printWindow) throw new Error('Print document is unavailable');
      printedUrlRef.current = printUrl;
      printWindow.print();
      setIsLoading(false);
      // Keep the PDF mounted until the next print or close: some browsers print asynchronously.
    } catch {
      handlePrintError();
    }
  };

  return (
    <GenericPageModal
      ariaLabel={t('printSelectedItems', 'Print selected items')}
      closeLabel={t('close', 'Close')}
      expandLabel={t('expand', 'Expand')}
      collapseLabel={t('collapse', 'Collapse')}
      onClose={onClose}>
      <div className={styles.form}>
        <div className={styles.formHeader}>
          <h2 className={styles.title}>{t('printSelectedItems', 'Print selected items')}</h2>
          <p className={styles.description}>
            {t('selectedItemsInvoiceDetails', 'Invoice {{invoice}} · {{patient}}', {
              invoice: bill.receiptNumber,
              patient: bill.patientName,
            })}
          </p>
        </div>
        <div className={styles.formBody}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('lineItems', 'Line items')}</h3>
            <p className={styles.description}>
              {t('selectItemsToPrint', 'Select the items you want to include in the printed invoice.')}
            </p>
            {lineItems.length ? (
              <div className={styles.tableContainer}>
                <Table size="lg" aria-label={t('selectItemsToPrintTable', 'Line items to print')}>
                  <TableHead>
                    <TableRow>
                      <TableSelectAll
                        id="print-select-all-items"
                        name="print-select-all-items"
                        aria-label={t('selectAllItemsToPrint', 'Select all items to print')}
                        checked={allSelected}
                        indeterminate={selectedItems.length > 0 && !allSelected}
                        disabled={isLoading}
                        onSelect={() => {
                          setSelectedUuids(allSelected ? new Set() : new Set(lineItems.map((item) => item.uuid)));
                          setHasError(false);
                        }}
                      />
                      <TableHeader>{t('billItem', 'Bill item')}</TableHeader>
                      <TableHeader>{t('date', 'Date')}</TableHeader>
                      <TableHeader className={styles.numeric}>{t('quantity', 'Quantity')}</TableHeader>
                      <TableHeader className={styles.numeric}>{t('price', 'Price')}</TableHeader>
                      <TableHeader className={styles.numeric}>{t('total', 'Total')}</TableHeader>
                      <TableHeader>{t('status', 'Status')}</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lineItems.map((item) => {
                      const label = getLineItemLabel(item);
                      return (
                        <TableRow
                          key={item.uuid}
                          className={isLoading ? undefined : styles.selectableRow}
                          isSelected={selectedUuids.has(item.uuid)}
                          onClick={() => toggleItem(item.uuid)}>
                          <TableSelectRow
                            id={`print-item-${item.uuid}`}
                            name={`print-item-${item.uuid}`}
                            aria-label={t('selectItemToPrint', 'Select {{item}} to print', { item: label })}
                            checked={selectedUuids.has(item.uuid)}
                            disabled={isLoading}
                            onSelect={(event) => {
                              event.stopPropagation();
                              toggleItem(item.uuid);
                            }}
                          />
                          <TableCell>{label}</TableCell>
                          <TableCell className={styles.date}>
                            {formatInvoiceDate(item.dateCreated ?? item.auditInfo?.dateCreated)}
                          </TableCell>
                          <TableCell className={styles.numeric}>{item.quantity}</TableCell>
                          <TableCell className={styles.numeric}>{convertToCurrency(item.price)}</TableCell>
                          <TableCell className={styles.numeric}>
                            {convertToCurrency(item.total ?? getLineItemTotal(item))}
                          </TableCell>
                          <TableCell>{t(item.paymentStatus, item.paymentStatus)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p>{t('noItemsToPrint', 'There are no line items to print.')}</p>
            )}
          </section>
          {hasError && (
            <InlineNotification
              kind="error"
              lowContrast
              hideCloseButton
              title={t('selectedItemsPrintFailed', 'Unable to print selected items')}
              subtitle={t(
                'selectedItemsPrintRetry',
                'Please try again. If the bill has changed, close this dialog and refresh the bill.',
              )}
            />
          )}
        </div>
        <div className={styles.selectionSummary} aria-live="polite">
          <span>{t('itemsSelectedToPrint', '{{count}} items selected', { count: selectedItems.length })}</span>
          <strong>
            {t('selectedItemsTotal', 'Selected total: {{amount}}', { amount: convertToCurrency(selectedTotal) })}
          </strong>
        </div>
        <div className={styles.actionBar}>
          <Button kind="secondary" size="md" onClick={onClose}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button
            className={styles.printButton}
            size="md"
            onClick={print}
            disabled={isLoading || !selectedItems.length}
            aria-busy={isLoading}>
            {t('print', 'Print')}
            {isLoading && (
              <InlineLoading
                className={styles.printSpinner}
                iconDescription={t('preparingPrint', 'Preparing to print…')}
                aria-hidden="true"
              />
            )}
          </Button>
          <span className="cds--visually-hidden" role="status">
            {isLoading ? t('preparingPrint', 'Preparing to print…') : ''}
          </span>
        </div>
        {printUrl && (
          <iframe
            key={printUrl}
            className={styles.printFrame}
            src={printUrl}
            title={t('selectedItemsPrintDocument', 'Selected items print document')}
            aria-hidden="true"
            tabIndex={-1}
            onLoad={printDocument}
            onError={handlePrintError}
          />
        )}
      </div>
    </GenericPageModal>
  );
};

export default PrintSelectedItemsModal;
