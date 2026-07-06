import React, { useEffect, useMemo, useState } from 'react';
import { ComboBox } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { formatBillAmount } from '../../helpers';
import { type LineItem } from '../../types';
import { type ProviderOption } from '../../payment-points/payment-points.resource';
import { EditableNumericCell, editableCellStyles as styles } from '../../editable-carbon-table-cell-kit';
import { type ActiveEditorKey, type EditableLineItemCommit, getEditorKey } from './types';
import { createDiscountUpdate, getLineItemDiscountAmount, parseEditableNumber, recalculateLineItem } from './utils';

type EditableDiscountCellProps = {
  lineItem: LineItem;
  isEditable: boolean;
  activeEditorKey: ActiveEditorKey;
  setActiveEditorKey: (key: ActiveEditorKey) => void;
  onCommit: EditableLineItemCommit;
  providerOptions?: Array<ProviderOption>;
  isLoadingProviders?: boolean;
  currentProvider?: CurrentProvider;
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

const normalizeNumber = (value: number) => (Number.isFinite(value) ? value : 0);
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const formatDiscountAmount = (value: number) => formatBillAmount(Math.round(normalizeNumber(value)));
const percentPrecision = 4;
const minimumVisiblePercent = 1 / 10 ** percentPrecision;
const formatDiscountPercent = (value: number) => {
  const percent = clamp(normalizeNumber(value), 0, 100);

  if (percent > 0 && percent < minimumVisiblePercent) {
    return `<${minimumVisiblePercent.toFixed(percentPrecision)}`;
  }

  return percent.toFixed(percentPrecision).replace(/\.?0+$/, '');
};

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
}) => {
  const { t } = useTranslation();
  const editorKey = getEditorKey(lineItem.uuid, 'discount');
  const isActive = activeEditorKey === editorKey;
  const currentDiscount = useMemo(() => getLineItemDiscountAmount(lineItem), [lineItem]);
  const priceBase = useMemo(() => Math.max(0, Number(lineItem.price ?? 0) || 0), [lineItem.price]);
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
  const [percent, setPercent] = useState(formatDiscountPercent(priceBase ? (currentDiscount / priceBase) * 100 : 0));
  const [sponsor, setSponsor] = useState(currentSponsor);
  const [comment, setComment] = useState(currentComment);
  const [error, setError] = useState('');

  const getPercentFromAmount = (nextAmount: number) => (priceBase ? (nextAmount / priceBase) * 100 : 0);
  const getAmountFromPercent = (nextPercent: number) => (priceBase * nextPercent) / 100;
  const clampDiscountAmount = (nextAmount: number) => clamp(Math.round(normalizeNumber(nextAmount)), 0, priceBase);
  const clampPercent = (nextPercent: number) => clamp(normalizeNumber(nextPercent), 0, 100);
  const getCurrentDraftAmount = () => {
    const parsedAmount = parseEditableNumber(amount);
    return parsedAmount === null ? null : clampDiscountAmount(parsedAmount);
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
      setPercent(formatDiscountPercent(priceBase ? (nextDraft.amount / priceBase) * 100 : 0));
      setSponsor(nextDraft.sponsor);
      setComment(nextDraft.comment);
      setError('');
    }
  }, [currentComment, currentDiscount, currentSponsor, isActive, priceBase]);

  useEffect(() => {
    if (isActive && !sponsor && currentSponsor) {
      setSponsor(currentSponsor);
    }
  }, [currentSponsor, isActive, sponsor]);

  const syncDraftAmount = (nextAmount: number, options: { syncPercent?: boolean } = {}) => {
    const clampedAmount = clampDiscountAmount(nextAmount);
    setAmount(formatDiscountAmount(clampedAmount));
    if (options.syncPercent ?? true) {
      setPercent(formatDiscountPercent(getPercentFromAmount(clampedAmount)));
    }
    return clampedAmount;
  };

  const resolvePercentInput = (nextValue: string) => {
    const parsedPercent = parseEditableNumber(nextValue);
    setPercent(nextValue);

    if (parsedPercent === null) {
      setError(t('discountPercentValidationError', 'Enter a discount percent between 0 and 100'));
      return null;
    }

    const nextPercent = clampPercent(parsedPercent);
    const nextAmount = syncDraftAmount(getAmountFromPercent(nextPercent), { syncPercent: false });
    setError('');
    return nextAmount;
  };

  const normalizePercentInput = () => {
    const parsedPercent = parseEditableNumber(percent);

    if (parsedPercent === null) {
      setPercent(formatDiscountPercent(getPercentFromAmount(currentDiscount)));
      return;
    }

    setPercent(formatDiscountPercent(clampPercent(parsedPercent)));
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
    const discountAmount = clampDiscountAmount(nextAmount);
    const nextSponsor = options.sponsorValue ?? selectedSponsor;
    const nextComment = options.commentValue ?? comment;
    const discounts =
      createDiscountUpdate(
        lineItem,
        discountAmount,
        getPercentFromAmount(discountAmount) / 100,
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
          const nextAmount = parseEditableNumber(amount);
          if (nextAmount !== null) {
            void commitDiscount(nextAmount);
          } else {
            setError(t('discountValidationError', 'Enter a discount between 0 and the line item price'));
          }
        }
        if (event.key === 'Escape') {
          close();
        }
      }}
      onBlur={(event) => {
        if (mode === 'inline' && !event.currentTarget.contains(event.relatedTarget as Node)) {
          const nextAmount = parseEditableNumber(amount);
          if (nextAmount !== null) {
            void commitDiscount(nextAmount);
          } else {
            setError(t('discountValidationError', 'Enter a discount between 0 and the line subtotal'));
          }
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
