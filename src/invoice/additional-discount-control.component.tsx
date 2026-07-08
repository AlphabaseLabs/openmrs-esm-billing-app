import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ComboBox, ComposedModal, ModalBody, ModalFooter, ModalHeader, TextArea } from '@carbon/react';
import { showSnackbar, useSession } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { updateBillLineItem } from '../billing.resource';
import { EditableNumericCell, editableCellStyles } from '../editable-carbon-table-cell-kit';
import { convertToCurrency, formatBillAmount } from '../helpers';
import { type ProviderOption, useProviderOptions } from '../payment-points/payment-points.resource';
import { type LineItem, type MappedBill } from '../types';
import { extractErrorMessagesFromResponse } from '../utils';
import {
  applyBulkDiscountDraft,
  type BulkDiscountDraft,
  getBulkDiscountMaximum,
  getBulkDiscountTotal,
  getLineItemDiscountAmount,
  parseEditableNumber,
} from './editable-line-item-cells';
import styles from './invoice.scss';

type AdditionalDiscountControlProps = {
  bill: MappedBill;
  disabled?: boolean;
  onAdditionalDiscountUpdated?: (discounts: number, updatedBill?: MappedBill) => void | Promise<void>;
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

const normalizeNumber = (value: number) => (Number.isFinite(value) ? value : 0);
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const percentPrecision = 4;
const minimumVisiblePercent = 1 / 10 ** percentPrecision;

const roundDiscountAmount = (value: number) => Number(normalizeNumber(value).toFixed(2));

const formatDiscountAmountDraft = (value: number) => formatBillAmount(roundDiscountAmount(value));

const formatDiscountPercent = (value: number) => {
  const percent = clamp(normalizeNumber(value), 0, 100);

  if (percent > 0 && percent < minimumVisiblePercent) {
    return `<${minimumVisiblePercent.toFixed(percentPrecision)}`;
  }

  return percent.toFixed(percentPrecision).replace(/\.?0+$/, '');
};

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

const AdditionalDiscountControl: React.FC<AdditionalDiscountControlProps> = ({
  bill,
  disabled = false,
  onAdditionalDiscountUpdated,
}) => {
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
    const roundedAmount = roundDiscountAmount(nextAmount);

    if (roundedAmount < 0 || roundedAmount > discountableAmount) {
      setError(
        t('bulkDiscountValidationError', 'Enter Bulk discount between 0 and {{amount}}', {
          amount: convertToCurrency(discountableAmount),
        }),
      );
      return null;
    }

    setError('');
    return roundedAmount;
  };

  const syncDraftAmount = (nextAmount: number, options: { syncPercent?: boolean } = {}) => {
    const roundedAmount = roundDiscountAmount(nextAmount);
    setAmount(formatDiscountAmountDraft(roundedAmount));

    if (options.syncPercent ?? true) {
      setPercent(formatDiscountPercent(discountableAmount ? (roundedAmount / discountableAmount) * 100 : 0));
    }

    return roundedAmount;
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
      await onAdditionalDiscountUpdated?.(validatedAmount, draft.bill);
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
      await onAdditionalDiscountUpdated?.(sourceDiscounts);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const commitAdditionalDiscount = async (nextAmount: number, options: CommitOptions = {}) => {
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
    const parsedAmount = amount.trim() === '' ? 0 : parseEditableNumber(amount);

    if (parsedAmount === null) {
      setError(
        t('bulkDiscountValidationError', 'Enter Bulk discount between 0 and {{amount}}', {
          amount: convertToCurrency(discountableAmount),
        }),
      );
      return;
    }

    void commitAdditionalDiscount(parsedAmount);
  };

  const updateAmountDraft = (nextValue: string) => {
    setAmount(nextValue);
    const parsedAmount = nextValue.trim() === '' ? 0 : parseEditableNumber(nextValue);

    if (parsedAmount === null) {
      return;
    }

    const roundedAmount = roundDiscountAmount(parsedAmount);
    if (roundedAmount >= 0 && roundedAmount <= discountableAmount) {
      setPercent(formatDiscountPercent(discountableAmount ? (roundedAmount / discountableAmount) * 100 : 0));
      setError('');
    }
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
    const parsedPercent = parseEditableNumber(nextValue);
    setPercent(nextValue);

    if (parsedPercent === null) {
      setError(t('discountPercentValidationError', 'Enter a discount percent between 0 and 100'));
      return null;
    }

    const nextPercent = clamp(normalizeNumber(parsedPercent), 0, 100);
    const nextAmount = syncDraftAmount((discountableAmount * nextPercent) / 100, { syncPercent: false });
    setError('');
    return nextAmount;
  };

  const commitPercentDraft = () => {
    const parsedPercent = parseEditableNumber(percent);

    if (parsedPercent === null) {
      setPercent(formatDiscountPercent(discountableAmount ? (currentDiscounts / discountableAmount) * 100 : 0));
      return;
    }

    const clampedPercent = clamp(normalizeNumber(parsedPercent), 0, 100);
    setPercent(formatDiscountPercent(clampedPercent));
    const nextAmount = syncDraftAmount((discountableAmount * clampedPercent) / 100, { syncPercent: false });
    void commitAdditionalDiscount(nextAmount, { closeOnCommit: false });
  };

  const normalizePercentInput = () => {
    commitPercentDraft();
  };

  const clearDiscount = () => {
    setAmount(formatDiscountAmountDraft(0));
    setPercent(formatDiscountPercent(0));
    setError('');
    void commitAdditionalDiscount(0, { closeOnCommit: false });
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
    <div className={styles.additionalDiscountRow}>
      <div className={styles.additionalDiscountControl} aria-busy={isSaving}>
        <span className={styles.additionalDiscountLabel}>{bulkDiscountLabel}:</span>
        <div className={styles.additionalDiscountEditorShell}>
          <EditableNumericCell
            activeMode={mode}
            className={`${editableCellStyles.discountEditableCell} ${
              isActive && mode === 'form' ? editableCellStyles.activeEditableCell : ''
            } ${styles.additionalDiscountEditor}`}
            error={error}
            inputId={`${bill.uuid}-additional-discount`}
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
                      htmlFor={`${bill.uuid}-additional-discount-percent`}>
                      {t('enterDiscountPercent', 'Enter discount percent:')}
                    </label>
                    <div className={editableCellStyles.discountInlineField}>
                      <input
                        id={`${bill.uuid}-additional-discount-percent`}
                        aria-describedby={error ? `${bill.uuid}-additional-discount-error` : undefined}
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
                      <p
                        id={`${bill.uuid}-additional-discount-error`}
                        className={editableCellStyles.errorText}
                        role="alert">
                        {error}
                      </p>
                    ) : null}
                  </div>
                  <div className={editableCellStyles.discountFieldGroup}>
                    <ComboBox
                      className={editableCellStyles.discountSponsorCombobox}
                      id={`${bill.uuid}-additional-discount-sponsor`}
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
                      id={`${bill.uuid}-additional-discount-comment`}
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

export default AdditionalDiscountControl;
