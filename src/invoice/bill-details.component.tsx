import { Button, Tooltip } from '@carbon/react';
import { Printer } from '@carbon/react/icons';
import { openmrsFetch, restBaseUrl, showModal, showSnackbar, useConfig, useSession } from '@openmrs/esm-framework';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type BillingConfig } from '../config-schema';
import { convertToCurrency, formatBillDateTime, formatInvoiceDate } from '../helpers';
import { type LineItem, type MappedBill } from '../types';
import AdditionalDiscountControl from './additional-discount-control.component';
import { InvoiceActions } from './invoice-actions.component';
import { recomputeBillWithLineItem } from './editable-line-item-cells';
import InvoiceTable from './invoice-table.component';
import { readLineItemColumnVisibilityPreference, type LineItemColumnKey } from './line-item-column-visibility';
import Payments from './payments/payments.component';
import styles from './invoice.scss';

type PatientPhoneResponse = {
  person?: {
    attributes?: Array<{
      value?: string;
      attributeType?: {
        display?: string;
        name?: string;
      };
    }>;
  };
};

interface BillDetailsProps {
  readonly bill: MappedBill;
  readonly isLoadingBill?: boolean;
  readonly showDiscardButton?: boolean;
  readonly discardDestination?: string;
  readonly onDiscard?: () => void | Promise<void>;
  readonly onRefreshBill?: () => unknown;
}

const BillDetails: React.FC<BillDetailsProps> = ({
  bill,
  isLoadingBill = false,
  showDiscardButton = true,
  discardDestination,
  onDiscard,
  onRefreshBill,
}) => {
  const { t } = useTranslation();
  const { sendInvoiceUrl } = useConfig<BillingConfig>();
  const { sessionLocation } = useSession();
  const [editableBill, setEditableBill] = useState<MappedBill>(bill);
  const [selectedLineItems, setSelectedLineItems] = useState<Array<LineItem>>([]);
  const [visibleLineItemColumnKeys, setVisibleLineItemColumnKeys] = useState<Array<LineItemColumnKey>>(() =>
    readLineItemColumnVisibilityPreference(),
  );
  const billToRender = editableBill ?? bill;
  const showTaxSummary = visibleLineItemColumnKeys.includes('tax');

  useEffect(() => {
    setEditableBill(bill);
  }, [bill]);

  const billLineItemsByUuid = useMemo(
    () => new Map(billToRender?.lineItems?.map((item) => [item.uuid, item]) ?? []),
    [billToRender?.lineItems],
  );
  const paidLineItems = useMemo(
    () => billToRender?.lineItems?.filter((item) => item.paymentStatus === 'PAID') ?? [],
    [billToRender?.lineItems],
  );

  useEffect(() => {
    setSelectedLineItems((currentSelectedLineItems) => {
      const nextSelectedLineItems = currentSelectedLineItems
        .flatMap((item) => {
          const billLineItem = billLineItemsByUuid.get(item.uuid);
          return billLineItem ? [billLineItem] : [];
        })
        .filter((item) => item.paymentStatus !== 'EXEMPTED');

      for (const paidLineItem of paidLineItems) {
        if (!nextSelectedLineItems.some((item) => item.uuid === paidLineItem.uuid)) {
          nextSelectedLineItems.push(paidLineItem);
        }
      }

      const currentSelectionKey = currentSelectedLineItems
        .map((item) => `${item.uuid}:${item.paymentStatus}`)
        .join('|');
      const nextSelectionKey = nextSelectedLineItems.map((item) => `${item.uuid}:${item.paymentStatus}`).join('|');

      return currentSelectionKey === nextSelectionKey ? currentSelectedLineItems : nextSelectedLineItems;
    });
  }, [billLineItemsByUuid, paidLineItems]);

  const handleSelectItem = (lineItems: Array<LineItem>) => {
    const uniqueLineItems = Array.from(
      new Map([...lineItems, ...paidLineItems].map((lineItem) => [lineItem.uuid, lineItem])).values(),
    );
    setSelectedLineItems(uniqueLineItems);
  };

  const handleLineItemUpdated = (updatedLineItem: LineItem) => {
    setEditableBill((currentBill) => recomputeBillWithLineItem(currentBill ?? bill, updatedLineItem));
  };

  const handleAdditionalDiscountUpdated = async () => {
    await onRefreshBill?.();
  };

  const openPrintPreview = (documentUrl: string, title: string) => {
    const dispose = showModal('print-preview-modal', {
      onClose: () => dispose(),
      title,
      documentUrl,
    });
  };

  const getPatientPhoneNumber = async () => {
    if (!billToRender?.patientUuid) {
      return undefined;
    }

    try {
      const response = await openmrsFetch<PatientPhoneResponse>(
        `${restBaseUrl}/patient/${billToRender.patientUuid}?v=custom:(person:(attributes:(value,attributeType:(display,name))))`,
      );
      const phoneAttribute = response.data?.person?.attributes?.find((attribute) => {
        const attributeName = `${attribute.attributeType?.display ?? ''} ${attribute.attributeType?.name ?? ''}`;
        return /phone|telephone|mobile|contact/i.test(attributeName);
      });

      return phoneAttribute?.value;
    } catch {
      return undefined;
    }
  };

  const handleSendInvoice = async () => {
    showSnackbar({
      title: t('sendingInvoice', 'Sending invoice'),
      subtitle: t('invoiceSendStarted', 'Sending invoice to {{patientName}}', {
        patientName: billToRender?.patientName,
      }),
      kind: 'info',
    });

    try {
      const response = await openmrsFetch(sendInvoiceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          clinicName: sessionLocation?.display ?? sessionLocation?.uuid,
          billType: 'OPD Bill',
          patientFirstName,
          patientPhoneNumber: await getPatientPhoneNumber(),
          billUuid: billToRender?.uuid,
          billId: billToRender?.id,
        },
      });

      if (!response.ok) {
        throw new Error('Invoice send request failed');
      }

      showSnackbar({
        title: t('invoiceSent', 'Invoice sent'),
        subtitle: t('invoiceSentToPatient', 'Invoice sent to {{patientName}}', {
          patientName: billToRender?.patientName,
        }),
        kind: 'success',
      });
    } catch {
      showSnackbar({
        title: t('invoiceNotSent', 'Invoice not sent'),
        subtitle: t(
          'invoiceSendError',
          'Sorry, we were unable to process your request. Please try again or contact support.',
        ),
        kind: 'error',
      });
    }
  };

  const invoiceDetails = {
    [t('totalAmount', 'Total amount')]: convertToCurrency(billToRender?.totalAmount ?? 0),
    [t('amountTendered', 'Amount tendered')]: convertToCurrency(billToRender?.tenderedAmount ?? 0),
    [t('invoiceNumber', 'Invoice #')]: billToRender?.receiptNumber,
    [t('dateAndTime', 'Date and time')]: formatInvoiceDate(billToRender?.dateCreatedUnformatted),
    [t('invoiceStatus', 'Invoice status')]: billToRender?.status,
  };
  const dateTimeLabel = t('dateAndTime', 'Date and time');
  const dateTimeTooltip = formatBillDateTime(billToRender?.dateCreatedUnformatted);
  const patientFirstName = billToRender?.patientName?.trim().split(/\s+/)?.[0];

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
          <Button kind="secondary" renderIcon={WhatsAppIcon} disabled={!billToRender?.uuid} onClick={handleSendInvoice}>
            {t('sendInvoice', 'Send invoice')}
          </Button>
          <Button
            kind="primary"
            renderIcon={Printer}
            onClick={() =>
              openPrintPreview(
                `/openmrs${restBaseUrl}/cashier/print?documentType=invoice&billId=${billToRender?.id}`,
                `${t('invoice', 'Invoice')} ${billToRender?.receiptNumber}`,
              )
            }>
            {t('printBill', 'Print bill')}
          </Button>
          <InvoiceActions bill={billToRender} />
        </div>
      </div>
      <div className={styles.invoiceContent}>
        <InvoiceTable
          bill={billToRender}
          isLoadingBill={isLoadingBill}
          selectedLineItems={selectedLineItems}
          onSelectItem={handleSelectItem}
          onLineItemUpdated={handleLineItemUpdated}
          onVisibleColumnsChange={setVisibleLineItemColumnKeys}
        />
        <AdditionalDiscountControl bill={billToRender} onAdditionalDiscountUpdated={handleAdditionalDiscountUpdated} />
        <Payments
          bill={billToRender}
          selectedLineItems={selectedLineItems}
          showDiscardButton={showDiscardButton}
          showTaxSummary={showTaxSummary}
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

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M16.02 3.2C9 3.2 3.3 8.81 3.3 15.72c0 2.19.58 4.34 1.69 6.24L3.2 28.8l7.03-1.78a12.92 12.92 0 0 0 5.79 1.38c7.02 0 12.73-5.62 12.73-12.52S23.04 3.2 16.02 3.2Zm0 22.96c-1.88 0-3.72-.5-5.32-1.45l-.38-.23-4.17 1.06 1.12-4.04-.25-.41a10.07 10.07 0 0 1-1.5-5.29c0-5.66 4.71-10.27 10.5-10.27s10.5 4.61 10.5 10.27-4.71 10.36-10.5 10.36Z" />
      <path d="M21.82 18.56c-.32-.16-1.88-.92-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.81 1.03-.99 1.24-.18.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.56-.94-.83-1.58-1.86-1.76-2.18-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.69-.97-2.31-.26-.6-.52-.52-.71-.53h-.6c-.21 0-.56.08-.85.4-.29.32-1.12 1.08-1.12 2.64s1.15 3.07 1.31 3.28c.16.21 2.27 3.43 5.49 4.81.77.33 1.37.53 1.84.68.77.24 1.47.21 2.02.13.62-.09 1.88-.76 2.15-1.49.26-.73.26-1.36.18-1.49-.08-.13-.29-.21-.61-.37Z" />
    </svg>
  );
}

export default BillDetails;
