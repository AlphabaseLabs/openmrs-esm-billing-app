import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ComboBox, ComposedModal, ModalBody, ModalFooter, ModalHeader, TextArea } from '@carbon/react';
import { showSnackbar, useSession } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { updateBillLineItem } from '../billing.resource';
import { EditableNumericCell, editableCellStyles } from '../editable-carbon-table-cell-kit';
import { convertToCurrency } from '../helpers';
import { type ProviderOption, useProviderOptions } from '../payment-points/payment-points.resource';
import { type LineItem, type MappedBill } from '../types';
import { extractErrorMessagesFromResponse } from '../utils';
import {
  applyBulkDiscountDraft,
  type BulkDiscountDraft,
  getBulkDiscountMaximum,
  getBulkDiscountTotal,
  getLineItemDiscountAmount,
} from './editable-line-item-cells';
import {
  formatDiscountAmount,
  formatDiscountPercent,
  validateFixedDiscountInput,
  validatePercentDiscountInput,
} from './editable-line-item-cells/discount-amount-validation';
import styles from './invoice.scss';

type BulkDiscountControlProps = {
  bill: MappedBill;
  disabled?: boolean;
  onBulkDiscountUpdated?: (discounts: number, updatedBill?: MappedBill) => void | Promise<void>;
};

type EditorMode = 'inline' | 'form' | null;

type CommitOptions = {
  closeOnCommit?: boolean;
  skipSponsorConfirmation?: boolean;
};

type PendingCommit = {
  amount: number;
  options: CommitOptions;
  draft: BulkDiscountDraft;
  sponsorConflict: SponsorConflict;
};

type SponsorConflict = {
  lineItem: LineItem;
  sponsorLabel: string;
};

const formatDiscountAmountDraft = formatDiscountAmount;

type CurrentProvider =
  | {
      uuid?: string;
      display?: string;
      person?: {
        display?: string;
      };
    }
  | null
  | undefined;

const getCurrentProviderOption = (currentProvider: CurrentProvider): ProviderOption | null => {
  if (!currentProvider?.uuid) {
    return null;
  }

  return {
    id: currentProvider.uuid,
    uuid: currentProvider.uuid,
    label: currentProvider.display || currentProvider.person?.display || currentProvider.uuid,
  };
};

const getProviderSponsorOptions = (
  providerOptions: Array<ProviderOption>,
  currentProviderOption: ProviderOption | null,
) => {
  if (!currentProviderOption || providerOptions.some((provider) => provider.uuid === currentProviderOption.uuid)) {
    return providerOptions;
  }

  return [currentProviderOption, ...providerOptions];
};

const getLineItemLabel = (lineItem: LineItem) =>
  lineItem.display || lineItem.item || lineItem.billableService || lineItem.uuid;

const getSponsorLabel = (sponsor: ProviderOption | null) => sponsor?.label || sponsor?.uuid || 'No sponsor';

const BulkDiscountControl: React.FC<BulkDiscountControlProps> = ({ bill, disabled = false, onBulkDiscountUpdated }) => {
  const { t } = useTranslation();
  const { currentProvider } = useSession();
  const { providerOptions, isLoading: isLoadingProviders } = useProviderOptions();
  const sourceBillRef = useRef<MappedBill | null>(null);
  const currentDiscounts = getBulkDiscountTotal(bill.lineItems ?? []);
  const sourceBill = sourceBillRef.current ?? bill;
  const currentProviderOption = useMemo(() => getCurrentProviderOption(currentProvider), [currentProvider]);
  const sponsorOptions = useMemo(
    () => getProviderSponsorOptions(providerOptions, currentProviderOption),
    [currentProviderOption, providerOptions],
  );
  const discountableAmount = useMemo(() => getBulkDiscountMaximum(sourceBill.lineItems ?? []), [sourceBill.lineItems]);
  const [mode, setMode] = useState<EditorMode>(null);
  const [amount, setAmount] = useState(formatDiscountAmountDraft(currentDiscounts));
  const [percent, setPercent] = useState(
    formatDiscountPercent(discountableAmount ? (currentDiscounts / discountableAmount) * 100 : 0),
  );
  const [sponsor, setSponsor] = useState<ProviderOption | null>(currentProviderOption);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [pendingCommit, setPendingCommit] = useState<PendingCommit | null>(null);
  const isEditable = !bill.closed && !disabled && !isSaving;
  const isActive = mode !== null;
  const amountDisplay = convertToCurrency(currentDiscounts);
  const bulkDiscountLabel = t('bulkDiscount', 'Bulk discount');
  const amountValidationError = () =>
    t('bulkDiscountValidationError', 'Enter Bulk discount between 0 and {{amount}}', {
      amount: convertToCurrency(discountableAmount),
    });
  const percentValidationError = () =>
    t('discountPercentValidationError', 'Enter a discount percent between 0 and 100');

  useEffect(() => {
    if (!isActive) {
      setAmount(formatDiscountAmountDraft(currentDiscounts));
      setPercent(formatDiscountPercent(discountableAmount ? (currentDiscounts / discountableAmount) * 100 : 0));
      setError('');
    }
  }, [currentDiscounts, discountableAmount, isActive]);

  useEffect(() => {
    if (!sponsor && currentProviderOption) {
      setSponsor(currentProviderOption);
    }
  }, [currentProviderOption, sponsor]);

  const getSourceDiscounts = () => getBulkDiscountTotal((sourceBillRef.current ?? bill).lineItems ?? []);

  const close = () => {
    const sourceDiscounts = getSourceDiscounts();
    setMode(null);
    sourceBillRef.current = null;
    setAmount(formatDiscountAmountDraft(sourceDiscounts));
    setPercent(formatDiscountPercent(discountableAmount ? (sourceDiscounts / discountableAmount) * 100 : 0));
    setError('');
  };

  const createDraft = (nextAmount: number) =>
    applyBulkDiscountDraft(sourceBillRef.current ?? bill, nextAmount, {
      ...(sponsor?.uuid ? { sponsor: sponsor.uuid } : {}),
      ...(comment.trim() ? { description: comment.trim() } : {}),
    });

  const findSponsorConflict = (draft: BulkDiscountDraft): SponsorConflict | null => {
    const selectedSponsorUuid = sponsor?.uuid ?? null;
    const conflictingUpdate = draft.lineItemUpdates.find(({ lineItem, updatedLineItem }) => {
      const currentDiscount = getLineItemDiscountAmount(lineItem);
      const nextDiscount = getLineItemDiscountAmount(updatedLineItem);

      return (
        nextDiscount > currentDiscount &&
        currentDiscount > 0 &&
        (lineItem.discounts ?? []).some(
          (discount) => (discount.amount ?? 0) > 0 && !!discount.sponsor && discount.sponsor !== selectedSponsorUuid,
        )
      );
    });

    return conflictingUpdate ? { lineItem: conflictingUpdate.lineItem, sponsorLabel: getSponsorLabel(sponsor) } : null;
  };

  const validateAmount = (nextAmount: number) => {
    const validation = validateFixedDiscountInput(nextAmount, discountableAmount);

    if (!validation.valid) {
      setError(amountValidationError());
      return null;
    }

    setError('');
    return validation.amount;
  };

  const syncDraftAmount = (nextAmount: number, options: { syncPercent?: boolean } = {}) => {
    const validation = validateFixedDiscountInput(nextAmount, discountableAmount);
    const validatedAmount = validation.valid ? validation.amount : 0;
    setAmount(formatDiscountAmountDraft(validatedAmount));

    if (options.syncPercent ?? true) {
      setPercent(formatDiscountPercent(discountableAmount ? (validatedAmount / discountableAmount) * 100 : 0));
    }

    return validatedAmount;
  };

  const saveBulkDiscount = async (
    validatedAmount: number,
    options: CommitOptions = {},
    draft = createDraft(validatedAmount),
  ) => {
    setIsSaving(true);

    try {
      await Promise.all(
        draft.lineItemUpdates.map(async ({ lineItem, discounts }) => {
          const response = await updateBillLineItem(lineItem.uuid, { discounts });
          if (!response.ok) {
            throw new Error('Line item update failed');
          }
        }),
      );
      await onBulkDiscountUpdated?.(validatedAmount, draft.bill);
      showSnackbar({
        title: t('bulkDiscountSaved', 'Bulk discount saved'),
        subtitle: t('bulkDiscountSavedSubtitle', 'Invoice bulk discount was applied successfully'),
        kind: 'success',
        timeoutInMs: 3000,
      });

      if (options.closeOnCommit ?? true) {
        setMode(null);
      }

      sourceBillRef.current = null;

      return true;
    } catch (error: any) {
      const sourceDiscounts = getSourceDiscounts();
      setAmount(formatDiscountAmountDraft(sourceDiscounts));
      setPercent(formatDiscountPercent(discountableAmount ? (sourceDiscounts / discountableAmount) * 100 : 0));
      showSnackbar({
        title: t('bulkDiscountSaveFailed', 'Bulk discount update failed'),
        subtitle: error?.responseBody
          ? extractErrorMessagesFromResponse(error.responseBody)
          : (error?.message ?? t('bulkDiscountSaveFailedFallback', 'Unable to update bulk discount')),
        kind: 'error',
        timeoutInMs: 5000,
        isLowContrast: true,
      });
      await onBulkDiscountUpdated?.(sourceDiscounts);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const commitBulkDiscount = async (nextAmount: number, options: CommitOptions = {}) => {
    const validatedAmount = validateAmount(nextAmount);

    if (validatedAmount === null) {
      return false;
    }

    syncDraftAmount(validatedAmount);
    const draft = createDraft(validatedAmount);

    if (validatedAmount === getSourceDiscounts()) {
      if (options.closeOnCommit ?? true) {
        close();
      }
      return true;
    }

    const sponsorConflict = findSponsorConflict(draft);
    if (!options.skipSponsorConfirmation && sponsorConflict) {
      setPendingCommit({ amount: validatedAmount, options, draft, sponsorConflict });
      return false;
    }

    return saveBulkDiscount(validatedAmount, options, draft);
  };

  const commitAmountDraft = () => {
    const validation = validateFixedDiscountInput(amount, discountableAmount);

    if (!validation.valid) {
      setError(amountValidationError());
      return;
    }

    void commitBulkDiscount(validation.amount);
  };

  const updateAmountDraft = (nextValue: string) => {
    setAmount(nextValue);
    const validation = validateFixedDiscountInput(nextValue, discountableAmount);

    if (!validation.valid) {
      return;
    }

    setPercent(formatDiscountPercent(discountableAmount ? (validation.amount / discountableAmount) * 100 : 0));
    setError('');
  };

  const openInlineEditor = () => {
    if (!isEditable) {
      return;
    }

    setAmount(formatDiscountAmountDraft(currentDiscounts));
    setSponsor(currentProviderOption);
    sourceBillRef.current = bill;
    setMode('inline');
  };

  const openPercentForm = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!isEditable) {
      return;
    }

    setAmount(formatDiscountAmountDraft(currentDiscounts));
    setPercent(formatDiscountPercent(discountableAmount ? (currentDiscounts / discountableAmount) * 100 : 0));
    setSponsor(sponsor ?? currentProviderOption);
    setError('');
    sourceBillRef.current = bill;
    setMode('form');
  };

  const resolvePercentInput = (nextValue: string) => {
    setPercent(nextValue);
    const validation = validatePercentDiscountInput(nextValue, discountableAmount);

    if (!validation.valid) {
      setError(percentValidationError());
      return null;
    }

    const nextAmount = syncDraftAmount(validation.amount, { syncPercent: false });
    setError('');
    return nextAmount;
  };

  const commitPercentDraft = () => {
    const validation = validatePercentDiscountInput(percent, discountableAmount);

    if (!validation.valid) {
      setError(percentValidationError());
      setPercent(formatDiscountPercent(discountableAmount ? (currentDiscounts / discountableAmount) * 100 : 0));
      return;
    }

    setPercent(formatDiscountPercent(validation.percent));
    const nextAmount = syncDraftAmount(validation.amount, { syncPercent: false });
    void commitBulkDiscount(nextAmount, { closeOnCommit: false });
  };

  const normalizePercentInput = () => {
    commitPercentDraft();
  };

  const clearDiscount = () => {
    setAmount(formatDiscountAmountDraft(0));
    setPercent(formatDiscountPercent(0));
    setError('');
    void commitBulkDiscount(0, { closeOnCommit: false });
  };

  const cancelSponsorConfirmation = () => {
    const sourceDiscounts = getSourceDiscounts();
    setPendingCommit(null);
    setAmount(formatDiscountAmountDraft(sourceDiscounts));
    setPercent(formatDiscountPercent(discountableAmount ? (sourceDiscounts / discountableAmount) * 100 : 0));
  };

  const confirmSponsorReplacement = () => {
    if (!pendingCommit) {
      return;
    }

    const commit = pendingCommit;
    setPendingCommit(null);
    void saveBulkDiscount(commit.amount, { ...commit.options, skipSponsorConfirmation: true }, commit.draft);
  };

  return (
    <div className={styles.bulkDiscountRow}>
      <div className={styles.bulkDiscountControl} aria-busy={isSaving}>
        <span className={styles.bulkDiscountLabel}>{bulkDiscountLabel}:</span>
        <div className={styles.bulkDiscountEditorShell}>
          <EditableNumericCell
            activeMode={mode}
            className={`${editableCellStyles.discountEditableCell} ${
              isActive && mode === 'form' ? editableCellStyles.activeEditableCell : ''
            } ${styles.bulkDiscountEditor}`}
            error={error}
            inputId={`${bill.uuid}-bulk-discount`}
            inputLabelText={bulkDiscountLabel}
            inputMode="decimal"
            inputValue={amount}
            isActive={isActive}
            isEditable={isEditable}
            onInlineOpen={openInlineEditor}
            onInputChange={updateAmountDraft}
            onInputKeyDown={(event) => {
              if (event.key === 'Enter') {
                commitAmountDraft();
              }

              if (event.key === 'Escape') {
                close();
              }
            }}
            onBlur={(event) => {
              if (mode === 'inline' && !event.currentTarget.contains(event.relatedTarget as Node)) {
                commitAmountDraft();
              }
            }}
            popover={{
              align: 'bottom-right',
              ariaLabel: t('bulkDiscountPercentForm', 'Bulk discount percent form'),
              buttonClassName: isActive && mode === 'form' ? editableCellStyles.discountOptionsButtonHidden : undefined,
              className: editableCellStyles.discountPopover,
              content: (
                <div className={editableCellStyles.discountForm}>
                  <div className={editableCellStyles.discountValueGroup}>
                    <label
                      className={editableCellStyles.discountGroupLabel}
                      htmlFor={`${bill.uuid}-bulk-discount-percent`}>
                      {t('enterDiscountPercent', 'Enter discount percent:')}
                    </label>
                    <div className={editableCellStyles.discountInlineField}>
                      <input
                        id={`${bill.uuid}-bulk-discount-percent`}
                        aria-describedby={error ? `${bill.uuid}-bulk-discount-error` : undefined}
                        aria-invalid={!!error}
                        aria-label={t('percent', 'Percent')}
                        className={editableCellStyles.discountInlineFieldInput}
                        inputMode="decimal"
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            commitPercentDraft();
                          }
                        }}
                        onBlur={normalizePercentInput}
                        onChange={(event) => {
                          resolvePercentInput(event.target.value);
                        }}
                        value={percent}
                      />
                      <span className={editableCellStyles.discountInlineUnit} aria-hidden="true">
                        <span className={editableCellStyles.discountInlineUnitDivider}>|</span>
                        {t('percentUnit', 'percent')}
                      </span>
                    </div>
                    {error ? (
                      <p id={`${bill.uuid}-bulk-discount-error`} className={editableCellStyles.errorText} role="alert">
                        {error}
                      </p>
                    ) : null}
                  </div>
                  <div className={editableCellStyles.discountFieldGroup}>
                    <ComboBox
                      className={editableCellStyles.discountSponsorCombobox}
                      id={`${bill.uuid}-bulk-discount-sponsor`}
                      disabled={isSaving || (!sponsorOptions.length && !isLoadingProviders)}
                      itemToString={(item) => item?.label ?? ''}
                      items={sponsorOptions}
                      onChange={({ selectedItem }) => setSponsor(selectedItem ?? null)}
                      selectedItem={sponsor}
                      placeholder={
                        isLoadingProviders
                          ? t('loadingDiscountSponsors', 'Loading discount sponsors')
                          : t('selectDiscountSponsor', 'Select discount sponsor')
                      }
                      titleText={t('discountSponsor', 'Discount sponsor')}
                    />
                  </div>
                  <div className={editableCellStyles.discountFieldGroup}>
                    <TextArea
                      id={`${bill.uuid}-bulk-discount-comment`}
                      className={editableCellStyles.discountTextarea}
                      labelText={t('comment', 'Comment')}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder={t('discountCommentPlaceholder', 'Add a comment')}
                      value={comment}
                    />
                  </div>
                  <div className={editableCellStyles.discountFormFooter}>
                    <button type="button" className={editableCellStyles.clearDiscountButton} onClick={clearDiscount}>
                      {t('clear', 'Clear')}
                    </button>
                  </div>
                </div>
              ),
              isOpen: isActive && mode === 'form',
              onClose: close,
              onOpen: openPercentForm,
              trigger: <span className={editableCellStyles.discountPercentAffordance}>%</span>,
              triggerLabel: t('openBulkDiscountEditor', 'Open Bulk discount editor'),
            }}
            sizingValue={amountDisplay}
            value={amountDisplay}
          />
        </div>
      </div>
      <ComposedModal open={!!pendingCommit} onClose={cancelSponsorConfirmation}>
        <ModalHeader title={t('confirmBulkDiscountSponsor', 'Confirm sponsor change')} />
        <ModalBody>
          <p>
            {t('bulkDiscountSponsorConfirmation', '{{item}} discount sponsor will set to {{sponsor}}.', {
              item: pendingCommit ? getLineItemLabel(pendingCommit.sponsorConflict.lineItem) : '',
              sponsor: pendingCommit?.sponsorConflict.sponsorLabel ?? '',
            })}
          </p>
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={cancelSponsorConfirmation}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button kind="primary" onClick={confirmSponsorReplacement}>
            {t('confirm', 'Confirm')}
          </Button>
        </ModalFooter>
      </ComposedModal>
    </div>
  );
};

export default BulkDiscountControl;
