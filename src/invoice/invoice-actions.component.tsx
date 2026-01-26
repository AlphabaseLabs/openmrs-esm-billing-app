import { Button, Popover, PopoverContent } from '@carbon/react';
import { Close, Printer, Wallet, FolderOpen, BaggageClaim, Scalpel, EmissionsManagement } from '@carbon/react/icons';
import {
  launchWorkspace,
  restBaseUrl,
  showModal,
  UserHasAccess,
  useFeatureFlag,
  useVisit,
  useVisitContextStore,
  defaultVisitCustomRepresentation,
  navigate,
  showSnackbar,
  showToast,
  updateVisit,
} from '@openmrs/esm-framework';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { mutate } from 'swr';
import { convertToCurrency } from '../helpers';
import { type MappedBill, type LineItem, PaymentStatus } from '../types';
import { spaBasePath } from '../constants';
// import { useCheckShareGnum } from './invoice.resource';
import styles from './invoice.scss';
import startCase from 'lodash-es/startCase';

interface InvoiceActionsProps {
  readonly bill: MappedBill;
  readonly selectedLineItems?: LineItem[];
  readonly activeVisit?: any;
}

export function InvoiceActions({ bill, selectedLineItems = [], activeVisit }: InvoiceActionsProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { billUuid, patientUuid } = useParams();
  // const { checkSHARegNum } = useCheckShareGnum();
  const { patientUuid: visitStorePatientUuid, manuallySetVisitUuid } = useVisitContextStore();

  const launchBillCloseOrReopenModal = (action: 'close' | 'reopen') => {
    const dispose = showModal('bill-action-modal', {
      closeModal: () => dispose(),
      bill: bill,
      action,
    });
  };

  const shouldCloseBill = bill.balance === 0 && !bill.closed;

  const handlePrint = (documentType: string, documentTitle: string) => {
    const dispose = showModal('print-preview-modal', {
      onClose: () => dispose(),
      title: documentTitle,
      documentUrl: `/openmrs${restBaseUrl}/cashier/print?documentType=${documentType}&billId=${bill?.id}`,
    });
  };

  const handleOpenWaiveBillWorkspace = () => {
    launchWorkspace('waive-bill-form', {
      workspaceTitle: t('waiveBillForm', 'Waive Bill Form'),
      bill: bill,
    });
  };

  const handleOpenCostsWorkspace = () => {
    launchWorkspace('costs-workspace', {
      workspaceTitle: t('costOverview', 'Cost Overview'),
      bill: bill,
    });
  };

  return (
    <div className="invoiceSummaryActions">
      <Button
        kind="ghost"
        size="sm"
        renderIcon={EmissionsManagement}
        iconDescription={t('costs', 'Costs')}
        tooltipPosition="right"
        onClick={handleOpenCostsWorkspace}>
        {t('costs', 'Costs')}
      </Button>
      <Popover isTabTip align="bottom-right" onKeyDown={() => {}} onRequestClose={() => setIsOpen(false)} open={isOpen}>
        <button
          className={styles.printButton}
          aria-expanded
          aria-label="Settings"
          onClick={() => setIsOpen(!isOpen)}
          type="button">
          <span className={styles.printButtonContent}>
            <span className={styles.printButtonText}>{t('print', 'Print')}</span>
            <Printer />
          </span>
        </button>
        <PopoverContent>
          <div className={styles.popoverContent}>
            <Button
              kind="ghost"
              size="sm"
              onClick={() =>
                handlePrint(
                  'invoice',
                  `${t('invoice', 'Invoice')} ${bill?.receiptNumber} - ${startCase(bill?.patientName)}`,
                )
              }
              renderIcon={Printer}>
              {t('printInvoice', 'Print Invoice')}
            </Button>
            <Button
              kind="ghost"
              size="sm"
              onClick={() => {
                const dispose = showModal('print-preview-modal', {
                  onClose: () => dispose(),
                  title: `${t('receipt', 'Receipt')} ${bill?.receiptNumber} - ${startCase(bill?.patientName)}`,
                  documentUrl: `/openmrs${restBaseUrl}/cashier/receipt?billId=${bill.id}`,
                });
              }}
              renderIcon={Printer}>
              {t('printReceipt', 'Print Receipt')}
            </Button>
            <Button
              kind="ghost"
              size="sm"
              onClick={() =>
                handlePrint(
                  'billstatement',
                  `${t('billStatement', 'Bill Statement')} ${bill?.receiptNumber} - ${startCase(bill?.patientName)}`,
                )
              }
              renderIcon={Printer}>
              {t('printBillStatement', 'Print Bill Statement')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {shouldCloseBill && (
        <UserHasAccess privilege="Close Cashier Bills">
          <Button
            kind="danger--ghost"
            size="sm"
            renderIcon={Close}
            iconDescription="Add"
            tooltipPosition="right"
            onClick={() => launchBillCloseOrReopenModal('close')}>
            {t('closeBill', 'Close Bill')}
          </Button>
        </UserHasAccess>
      )}
      {bill?.closed && (
        <UserHasAccess privilege="Reopen Cashier Bills">
          <Button
            kind="ghost"
            size="sm"
            renderIcon={FolderOpen}
            iconDescription="Add"
            tooltipPosition="right"
            onClick={() => launchBillCloseOrReopenModal('reopen')}>
            {t('reopen', 'Reopen')}
          </Button>
        </UserHasAccess>
      )}
      <Button
        kind="ghost"
        size="sm"
        renderIcon={Wallet}
        iconDescription="Add"
        tooltipPosition="right"
        onClick={() =>
          launchWorkspace('payment-workspace', {
            bill,
            workspaceTitle: t('additionalPayment', 'Additional Payment (Balance {{billBalance}})', {
              billBalance: convertToCurrency(bill.balance),
            }),
          })
        }>
        {t('additionalPayment', 'Additional Payment')}
      </Button>
      {bill.status !== PaymentStatus.PAID && (
        <UserHasAccess privilege="o3: Delete Bill">
          <Button
            kind="danger--ghost"
            size="sm"
            renderIcon={Scalpel}
            iconDescription={t('waiveBill', 'Waive Bill')}
            tooltipPosition="right"
            onClick={handleOpenWaiveBillWorkspace}>
            {t('waiveBill', 'Waive Bill')}
          </Button>
        </UserHasAccess>
      )}
    </div>
  );
}
