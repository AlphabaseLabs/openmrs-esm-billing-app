import React, { useEffect, useMemo, useState } from 'react';
import { restBaseUrl, showSnackbar } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { mutate } from 'swr';
import { updateBillAdditionalDiscount } from '../billing.resource';
import { EditableNumericCell, editableCellStyles } from '../editable-carbon-table-cell-kit';
import { convertToCurrency, formatBillAmount } from '../helpers';
import { type MappedBill } from '../types';
import { extractErrorMessagesFromResponse } from '../utils';
import { parseEditableNumber } from './editable-line-item-cells';
import styles from './invoice.scss';

type AdditionalDiscountControlProps = {
  bill: MappedBill;
  onAdditionalDiscountUpdated?: (additionalDiscount: number) => void;
};

type EditorMode = 'inline' | 'form' | null;

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

const AdditionalDiscountControl: React.FC<AdditionalDiscountControlProps> = ({ bill, onAdditionalDiscountUpdated }) => {
  const { t } = useTranslation();
  const currentAdditionalDiscount = bill.additionalDiscount ?? 0;
  const discountableAmount = useMemo(
    () => Math.max(0, Number(bill.balance ?? 0) + currentAdditionalDiscount),
    [bill.balance, currentAdditionalDiscount],
  );
  const [mode, setMode] = useState<EditorMode>(null);
  const [amount, setAmount] = useState(formatDiscountAmountDraft(currentAdditionalDiscount));
  const [percent, setPercent] = useState(
    formatDiscountPercent(discountableAmount ? (currentAdditionalDiscount / discountableAmount) * 100 : 0),
  );
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const isEditable = !bill.closed;
  const isActive = mode !== null;
  const amountDisplay =
    currentAdditionalDiscount > 0 ? `- ${convertToCurrency(currentAdditionalDiscount)}` : convertToCurrency(0);

  useEffect(() => {
    if (!isActive) {
      setAmount(formatDiscountAmountDraft(currentAdditionalDiscount));
      setPercent(
        formatDiscountPercent(discountableAmount ? (currentAdditionalDiscount / discountableAmount) * 100 : 0),
      );
      setError('');
    }
  }, [currentAdditionalDiscount, discountableAmount, isActive]);

  const refreshBillData = () =>
    mutate((key) => typeof key === 'string' && key.startsWith(`${restBaseUrl}/cashier/bill`), undefined, {
      revalidate: true,
    });

  const close = () => {
    setMode(null);
    setAmount(formatDiscountAmountDraft(currentAdditionalDiscount));
    setPercent(formatDiscountPercent(discountableAmount ? (currentAdditionalDiscount / discountableAmount) * 100 : 0));
    setError('');
  };

  const validateAmount = (nextAmount: number) => {
    const roundedAmount = roundDiscountAmount(nextAmount);

    if (roundedAmount < 0 || roundedAmount > discountableAmount) {
      setError(
        t('additionalDiscountValidationError', 'Enter a discount between 0 and {{amount}}', {
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

  const commitAdditionalDiscount = async (nextAmount: number, options: { closeOnCommit?: boolean } = {}) => {
    const validatedAmount = validateAmount(nextAmount);

    if (validatedAmount === null) {
      return false;
    }

    syncDraftAmount(validatedAmount);

    if (validatedAmount === currentAdditionalDiscount) {
      if (options.closeOnCommit ?? true) {
        close();
      }
      return true;
    }

    setIsSaving(true);

    try {
      await updateBillAdditionalDiscount(bill.uuid, validatedAmount);
      onAdditionalDiscountUpdated?.(validatedAmount);
      await refreshBillData();
      showSnackbar({
        title: t('additionalDiscountSaved', 'Additional discount saved'),
        subtitle: t('additionalDiscountSavedSubtitle', 'Invoice additional discount was updated successfully'),
        kind: 'success',
        timeoutInMs: 3000,
      });

      if (options.closeOnCommit ?? true) {
        setMode(null);
      }

      return true;
    } catch (error: any) {
      setAmount(formatDiscountAmountDraft(currentAdditionalDiscount));
      setPercent(
        formatDiscountPercent(discountableAmount ? (currentAdditionalDiscount / discountableAmount) * 100 : 0),
      );
      showSnackbar({
        title: t('additionalDiscountSaveFailed', 'Additional discount update failed'),
        subtitle: error?.responseBody
          ? extractErrorMessagesFromResponse(error.responseBody)
          : (error?.message ?? t('additionalDiscountSaveFailedFallback', 'Unable to update additional discount')),
        kind: 'error',
        timeoutInMs: 5000,
        isLowContrast: true,
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const commitAmountDraft = () => {
    const parsedAmount = parseEditableNumber(amount);

    if (parsedAmount === null) {
      setError(
        t('additionalDiscountValidationError', 'Enter a discount between 0 and {{amount}}', {
          amount: convertToCurrency(discountableAmount),
        }),
      );
      return;
    }

    void commitAdditionalDiscount(parsedAmount);
  };

  const openInlineEditor = () => {
    if (!isEditable) {
      return;
    }

    setAmount(formatDiscountAmountDraft(currentAdditionalDiscount));
    setMode('inline');
  };

  const openPercentForm = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!isEditable) {
      return;
    }

    setAmount(formatDiscountAmountDraft(currentAdditionalDiscount));
    setPercent(formatDiscountPercent(discountableAmount ? (currentAdditionalDiscount / discountableAmount) * 100 : 0));
    setError('');
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

  const normalizePercentInput = () => {
    const parsedPercent = parseEditableNumber(percent);

    if (parsedPercent === null) {
      setPercent(
        formatDiscountPercent(discountableAmount ? (currentAdditionalDiscount / discountableAmount) * 100 : 0),
      );
      return;
    }

    setPercent(formatDiscountPercent(clamp(normalizeNumber(parsedPercent), 0, 100)));
  };

  const clearDiscount = () => {
    setAmount(formatDiscountAmountDraft(0));
    setPercent(formatDiscountPercent(0));
    setError('');
    void commitAdditionalDiscount(0, { closeOnCommit: false });
  };

  return (
    <div className={styles.additionalDiscountRow}>
      <div className={styles.additionalDiscountControl} aria-busy={isSaving}>
        <span className={styles.additionalDiscountLabel}>{t('additionalDiscount', 'Additional discount')}:</span>
        <div className={styles.additionalDiscountEditorShell}>
          <EditableNumericCell
            activeMode={mode}
            className={`${editableCellStyles.discountEditableCell} ${
              isActive && mode === 'form' ? editableCellStyles.activeEditableCell : ''
            } ${styles.additionalDiscountEditor}`}
            error={error}
            inputId={`${bill.uuid}-additional-discount`}
            inputLabelText={t('additionalDiscount', 'Additional discount')}
            inputMode="decimal"
            inputValue={amount}
            isActive={isActive}
            isEditable={isEditable}
            onInlineOpen={openInlineEditor}
            onInputChange={setAmount}
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
              ariaLabel: t('additionalDiscountPercentForm', 'Additional discount percent form'),
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
                        onBlur={normalizePercentInput}
                        onChange={(event) => {
                          const nextAmount = resolvePercentInput(event.target.value);
                          if (nextAmount !== null) {
                            void commitAdditionalDiscount(nextAmount, { closeOnCommit: false });
                          }
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
              triggerLabel: t('openAdditionalDiscountEditor', 'Open additional discount editor'),
            }}
            sizingValue={amountDisplay}
            value={amountDisplay}
          />
        </div>
      </div>
    </div>
  );
};

export default AdditionalDiscountControl;
