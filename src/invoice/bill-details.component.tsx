import { Button, Tooltip } from '@carbon/react';
import { Printer } from '@carbon/react/icons';
import { restBaseUrl, showModal } from '@openmrs/esm-framework';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { convertToCurrency, formatBillDateTime, formatInvoiceDate } from '../helpers';
import { type LineItem, type MappedBill } from '../types';
import { InvoiceActions } from './invoice-actions.component';
import InvoiceTable from './invoice-table.component';
import Payments from './payments/payments.component';
import styles from './invoice.scss';

interface BillDetailsProps {
  readonly bill: MappedBill;
  readonly isLoadingBill?: boolean;
  readonly showDiscardButton?: boolean;
  readonly discardDestination?: string;
  readonly onDiscard?: () => void | Promise<void>;
}

const BillDetails: React.FC<BillDetailsProps> = ({
  bill,
  isLoadingBill = false,
  showDiscardButton = true,
  discardDestination,
  onDiscard,
}) => {
  const { t } = useTranslation();
  const [selectedLineItems, setSelectedLineItems] = useState<Array<LineItem>>([]);
  const paidLineItems = useMemo(
    () => bill?.lineItems?.filter((item) => item.paymentStatus === 'PAID') ?? [],
    [bill?.lineItems],
  );

  useEffect(() => {
    setSelectedLineItems(paidLineItems);
  }, [paidLineItems]);

  const handleSelectItem = (lineItems: Array<LineItem>) => {
    const uniqueLineItems = [...new Set([...lineItems, ...paidLineItems])];
    setSelectedLineItems(uniqueLineItems);
  };

  const openPrintPreview = (documentUrl: string, title: string) => {
    const dispose = showModal('print-preview-modal', {
      onClose: () => dispose(),
      title,
      documentUrl,
    });
  };

  const invoiceDetails = {
    [t('totalAmount', 'Total amount')]: convertToCurrency(bill?.totalAmount ?? 0),
    [t('amountTendered', 'Amount tendered')]: convertToCurrency(bill?.tenderedAmount ?? 0),
    [t('invoiceNumber', 'Invoice #')]: bill?.receiptNumber,
    [t('dateAndTime', 'Date and time')]: formatInvoiceDate(bill?.dateCreatedUnformatted),
    [t('invoiceStatus', 'Invoice status')]: bill?.status,
  };
  const dateTimeLabel = t('dateAndTime', 'Date and time');
  const dateTimeTooltip = formatBillDateTime(bill?.dateCreatedUnformatted);

  return (
    <>
      <div className={styles.detailsContainer}>
        <section className={styles.details}>
          {Object.entries(invoiceDetails).map(([key, value]) => (
            <InvoiceDetails
              key={key}
              label={key}
              value={value}
              tooltip={key === dateTimeLabel ? dateTimeTooltip : undefined}
            />
          ))}
        </section>
        <div className={styles.actionsContainer}>
          {(bill?.status === 'PAID' || bill?.tenderedAmount > 0) && (
            <Button
              kind="secondary"
              renderIcon={Printer}
              onClick={() =>
                openPrintPreview(
                  `/openmrs${restBaseUrl}/cashier/receipt?billId=${bill?.id}`,
                  `${t('receipt', 'Receipt')} ${bill?.receiptNumber}`,
                )
              }>
              {t('printReceipt', 'Print receipt')}
            </Button>
          )}
          <Button
            kind="primary"
            renderIcon={Printer}
            onClick={() =>
              openPrintPreview(
                `/openmrs${restBaseUrl}/cashier/print?documentType=invoice&billId=${bill?.id}`,
                `${t('invoice', 'Invoice')} ${bill?.receiptNumber}`,
              )
            }>
            {t('printBill', 'Print bill')}
          </Button>
          <InvoiceActions bill={bill} />
        </div>
      </div>
      <div className={styles.invoiceContent}>
        <InvoiceTable bill={bill} isLoadingBill={isLoadingBill} onSelectItem={handleSelectItem} />
        <Payments
          bill={bill}
          selectedLineItems={selectedLineItems}
          showDiscardButton={showDiscardButton}
          discardDestination={discardDestination}
          onDiscard={onDiscard}
        />
      </div>
    </>
  );
};

function InvoiceDetails({
  label,
  value,
  tooltip,
}: {
  readonly label: string;
  readonly value: string | number;
  readonly tooltip?: string;
}) {
  const valueContent = <span className={styles.value}>{value}</span>;

  return (
    <div>
      <h1 className={styles.label}>{label}</h1>
      {tooltip ? (
        <Tooltip label={tooltip} enterDelayMs={0}>
          {valueContent}
        </Tooltip>
      ) : (
        valueContent
      )}
    </div>
  );
}

export default BillDetails;
