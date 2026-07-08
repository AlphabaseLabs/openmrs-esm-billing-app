import React, { useEffect, useMemo, useState } from 'react';
import { ComboBox } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { formatBillAmount } from '../../helpers';
import { type LineItem } from '../../types';
import { type ProviderOption } from '../../payment-points/payment-points.resource';
import { EditableNumericCell, editableCellStyles as styles } from '../../editable-carbon-table-cell-kit';
import { type ActiveEditorKey, type EditableLineItemCommit, getEditorKey } from './types';
import {
  formatDiscountAmount,
  formatDiscountPercent,
  getLineDiscountMaximum,
  validateFixedDiscountInput,
  validatePercentDiscountInput,
} from './discount-amount-validation';
import { createDiscountUpdate, getLineItemDiscountAmount, recalculateLineItem } from './utils';

type EditableDiscountCellProps = {
  lineItem: LineItem;
  isEditable: boolean;
  activeEditorKey: ActiveEditorKey;
  setActiveEditorKey: (key: ActiveEditorKey) => void;
  onCommit: EditableLineItemCommit;
  providerOptions?: Array<ProviderOption>;
  isLoadingProviders?: boolean;
  currentProvider?: CurrentProvider;
  disabledHint?: string;
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

const findProviderOptionByUuid = (providerOptions: Array<ProviderOption>, uuid?: string) => {
  const normalizedUuid = uuid?.trim();
  return normalizedUuid ? (providerOptions.find((provider) => provider.uuid === normalizedUuid) ?? null) : null;
};

const EditableDiscountCell: React.FC<EditableDiscountCellProps> = ({
  lineItem,
  isEditable,
  activeEditorKey,
  setActiveEditorKey,
  onCommit,
  providerOptions = [],
  isLoadingProviders = false,
  currentProvider,
  disabledHint,
}) => {
  const { t } = useTranslation();
  const editorKey = getEditorKey(lineItem.uuid, 'discount');
  const isActive = activeEditorKey === editorKey;
  const currentDiscount = useMemo(() => getLineItemDiscountAmount(lineItem), [lineItem]);
  const discountMaximum = useMemo(() => getLineDiscountMaximum(lineItem), [lineItem]);
  const currentProviderOption = useMemo(() => getCurrentProviderOption(currentProvider), [currentProvider]);
  const sponsorOptions = useMemo(
    () => getProviderSponsorOptions(providerOptions, currentProviderOption),
    [currentProviderOption, providerOptions],
  );
  const currentSponsor = useMemo(
    () =>
      findProviderOptionByUuid(sponsorOptions, lineItem.discounts?.[0]?.sponsor) ??
      findProviderOptionByUuid(sponsorOptions, currentProviderOption?.uuid) ??
      currentProviderOption,
    [currentProviderOption, lineItem.discounts, sponsorOptions],
  );
  const currentComment = useMemo(() => lineItem.discounts?.[0]?.description ?? '', [lineItem.discounts]);
  const [mode, setMode] = useState<'inline' | 'form' | null>(null);
  const [amount, setAmount] = useState(formatDiscountAmount(currentDiscount));
  const [percent, setPercent] = useState(
    formatDiscountPercent(discountMaximum ? (currentDiscount / discountMaximum) * 100 : 0),
  );
  const [sponsor, setSponsor] = useState(currentSponsor);
  const [comment, setComment] = useState(currentComment);
  const [error, setError] = useState('');

  const getPercentFromAmount = (nextAmount: number) => (discountMaximum ? (nextAmount / discountMaximum) * 100 : 0);
  const discountValidationError = () =>
    t('discountValidationError', 'Enter a discount between 0 and {{amount}}', {
      amount: formatBillAmount(discountMaximum),
    });
  const percentValidationError = () =>
    t('discountPercentValidationError', 'Enter a discount percent between 0 and 100');
  const getCurrentDraftAmount = () => {
    const validation = validateFixedDiscountInput(amount, discountMaximum);
    return validation.valid ? validation.amount : null;
  };
  const selectedSponsor = sponsor ?? currentSponsor;

  useEffect(() => {
    if (!isActive) {
      const nextDraft = {
        amount: currentDiscount,
        sponsor: currentSponsor,
        comment: currentComment,
      };
      setMode(null);
      setAmount(formatDiscountAmount(nextDraft.amount));
      setPercent(formatDiscountPercent(discountMaximum ? (nextDraft.amount / discountMaximum) * 100 : 0));
      setSponsor(nextDraft.sponsor);
      setComment(nextDraft.comment);
      setError('');
    }
  }, [currentComment, currentDiscount, currentSponsor, discountMaximum, isActive]);

  useEffect(() => {
    if (isActive && !sponsor && currentSponsor) {
      setSponsor(currentSponsor);
    }
  }, [currentSponsor, isActive, sponsor]);

  const syncDraftAmount = (nextAmount: number, options: { syncPercent?: boolean } = {}) => {
    const validation = validateFixedDiscountInput(nextAmount, discountMaximum);
    const validatedAmount = validation.valid ? validation.amount : 0;
    setAmount(formatDiscountAmount(validatedAmount));
    if (options.syncPercent ?? true) {
      setPercent(formatDiscountPercent(getPercentFromAmount(validatedAmount)));
    }
    return validatedAmount;
  };

  const resolvePercentInput = (nextValue: string) => {
    setPercent(nextValue);
    const validation = validatePercentDiscountInput(nextValue, discountMaximum);

    if (!validation.valid) {
      setError(percentValidationError());
      return null;
    }

    const nextAmount = syncDraftAmount(validation.amount, { syncPercent: false });
    setError('');
    return nextAmount;
  };

  const normalizePercentInput = () => {
    const validation = validatePercentDiscountInput(percent, discountMaximum);

    if (!validation.valid) {
      setPercent(formatDiscountPercent(getPercentFromAmount(currentDiscount)));
      return;
    }

    setPercent(formatDiscountPercent(validation.percent));
  };

  const openInlineEditor = () => {
    if (!isEditable) {
      return;
    }

    setAmount(formatDiscountAmount(currentDiscount));
    setMode('inline');
    setActiveEditorKey(editorKey);
  };

  const openForm = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!isEditable) {
      return;
    }

    const openingDraft = {
      amount: currentDiscount,
      sponsor: currentSponsor,
      comment: currentComment,
    };
    setAmount(formatDiscountAmount(openingDraft.amount));
    setPercent(formatDiscountPercent(getPercentFromAmount(openingDraft.amount)));
    setSponsor(openingDraft.sponsor);
    setComment(openingDraft.comment);
    setError('');
    setMode('form');
    setActiveEditorKey(editorKey);
  };

  const close = () => {
    setMode(null);
    setActiveEditorKey(null);
  };

  const commitDiscount = async (
    nextAmount: number,
    options: {
      closeOnCommit?: boolean;
      commentValue?: string;
      sponsorValue?: ProviderOption | null;
    } = {},
  ) => {
    const validation = validateFixedDiscountInput(nextAmount, discountMaximum);
    if (!validation.valid) {
      setError(discountValidationError());
      return false;
    }

    const discountAmount = validation.amount;
    const nextSponsor = options.sponsorValue ?? selectedSponsor;
    const nextComment = options.commentValue ?? comment;
    const discounts =
      createDiscountUpdate(
        lineItem,
        discountAmount,
        discountMaximum ? discountAmount / discountMaximum : 0,
        nextSponsor?.uuid,
        nextComment,
      ).discounts ?? [];

    setError('');
    await onCommit(
      lineItem,
      { discounts },
      recalculateLineItem({
        ...lineItem,
        discounts,
      }),
    );
    if (options.closeOnCommit ?? true) {
      close();
    }
    return true;
  };

  const autoCommitDiscount = (nextAmount: number, nextSponsor = selectedSponsor, nextComment = comment) => {
    void commitDiscount(nextAmount, {
      closeOnCommit: false,
      commentValue: nextComment,
      sponsorValue: nextSponsor,
    });
  };

  const clearDiscount = () => {
    setAmount(formatDiscountAmount(0));
    setPercent(formatDiscountPercent(0));
    setSponsor(currentSponsor);
    setComment('');
    setError('');
    autoCommitDiscount(0, currentSponsor, '');
  };

  return (
    <EditableNumericCell
      activeMode={mode}
      className={`${styles.discountEditableCell} ${isActive && mode === 'form' ? styles.activeEditableCell : ''}`}
      disabledInteractionLabel={disabledHint}
      error={error}
      inputId={`discount-${lineItem.uuid}`}
      inputLabelText={t('discount', 'Discount')}
      inputMode="decimal"
      inputValue={amount}
      isActive={isActive}
      isEditable={isEditable}
      onInlineOpen={openInlineEditor}
      onInputChange={setAmount}
      onInputKeyDown={(event) => {
        if (event.key === 'Enter') {
          const validation = validateFixedDiscountInput(amount, discountMaximum);
          if (!validation.valid) {
            setError(discountValidationError());
            return;
          }
          void commitDiscount(validation.amount);
        }
        if (event.key === 'Escape') {
          close();
        }
      }}
      onBlur={(event) => {
        if (mode === 'inline' && !event.currentTarget.contains(event.relatedTarget as Node)) {
          const validation = validateFixedDiscountInput(amount, discountMaximum);
          if (!validation.valid) {
            setError(discountValidationError());
            return;
          }
          void commitDiscount(validation.amount);
        }
      }}
      popover={{
        align: 'bottom-left',
        ariaLabel: t('discountForm', 'Discount form'),
        buttonClassName: isActive && mode === 'form' ? styles.discountOptionsButtonHidden : undefined,
        className: styles.discountPopover,
        content: (
          <div className={styles.discountForm}>
            <div className={styles.discountValueGroup}>
              <label className={styles.discountGroupLabel} htmlFor={`discount-percent-${lineItem.uuid}`}>
                {t('enterDiscountPercent', 'Enter discount percent:')}
              </label>
              <div className={styles.discountInlineField}>
                <input
                  id={`discount-percent-${lineItem.uuid}`}
                  className={styles.discountInlineFieldInput}
                  inputMode="decimal"
                  aria-label={t('percent', 'Percent')}
                  aria-invalid={!!error}
                  aria-describedby={error ? `discount-error-${lineItem.uuid}` : undefined}
                  value={percent}
                  onChange={(event) => {
                    const nextAmount = resolvePercentInput(event.target.value);
                    if (nextAmount !== null) {
                      autoCommitDiscount(nextAmount);
                    }
                  }}
                  onBlur={normalizePercentInput}
                />
                <span className={styles.discountInlineUnit} aria-hidden="true">
                  <span className={styles.discountInlineUnitDivider}>|</span>
                  {t('percentUnit', 'percent')}
                </span>
              </div>
              {error ? (
                <p id={`discount-error-${lineItem.uuid}`} className={styles.errorText} role="alert">
                  {error}
                </p>
              ) : null}
            </div>
            <div className={styles.discountFieldGroup}>
              <ComboBox
                className={styles.discountSponsorCombobox}
                id={`discount-sponsor-${lineItem.uuid}`}
                disabled={!sponsorOptions.length}
                itemToString={(item) => item?.label ?? ''}
                items={sponsorOptions}
                onChange={({ selectedItem }) => {
                  if (!selectedItem) {
                    return;
                  }

                  const nextAmount = getCurrentDraftAmount();
                  setSponsor(selectedItem);
                  if (nextAmount !== null) {
                    autoCommitDiscount(nextAmount, selectedItem, comment);
                  }
                }}
                placeholder={
                  isLoadingProviders
                    ? t('loadingProviders', 'Loading providers...')
                    : t('selectDiscountSponsor', 'Select discount sponsor')
                }
                selectedItem={selectedSponsor}
                size="sm"
                titleText={t('discountSponsor', 'Discount sponsor')}
              />
            </div>
            <div className={styles.discountFieldGroup}>
              <label className={styles.discountFieldLabel} htmlFor={`discount-comment-${lineItem.uuid}`}>
                {t('comment', 'Comment')}
              </label>
              <textarea
                id={`discount-comment-${lineItem.uuid}`}
                className={styles.discountTextarea}
                aria-label={t('comment', 'Comment')}
                rows={3}
                value={comment}
                onChange={(event) => {
                  const nextComment = event.target.value;
                  const nextAmount = getCurrentDraftAmount();
                  setComment(nextComment);
                  if (nextAmount !== null) {
                    autoCommitDiscount(nextAmount, selectedSponsor, nextComment);
                  }
                }}
              />
            </div>
            <div className={styles.discountFormFooter}>
              <button type="button" className={styles.clearDiscountButton} onClick={clearDiscount}>
                {t('clear', 'Clear')}
              </button>
            </div>
          </div>
        ),
        isOpen: isActive && mode === 'form',
        onClose: close,
        onOpen: openForm,
        trigger: <span className={styles.discountPercentAffordance}>%</span>,
        triggerLabel: t('openDiscountEditor', 'Open discount editor'),
      }}
      sizingValue={formatBillAmount(currentDiscount)}
      value={formatBillAmount(currentDiscount)}
    />
  );
};

export default EditableDiscountCell;
