import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TextInput } from '@carbon/react';
import { EditIcon } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { formatBillAmount } from '../../helpers';
import { type LineItem } from '../../types';
import { type ActiveEditorKey, type EditableLineItemCommit, getEditorKey } from './types';
import {
  createDiscountUpdate,
  getLineItemDiscountAmount,
  getLineItemSubtotal,
  parseEditableNumber,
  recalculateLineItem,
} from './utils';
import EditableCellOverlay from './editable-cell-overlay.component';
import styles from './editable-line-item-cells.scss';

type EditableDiscountCellProps = {
  lineItem: LineItem;
  isEditable: boolean;
  activeEditorKey: ActiveEditorKey;
  setActiveEditorKey: (key: ActiveEditorKey) => void;
  onCommit: EditableLineItemCommit;
};

const EditableDiscountCell: React.FC<EditableDiscountCellProps> = ({
  lineItem,
  isEditable,
  activeEditorKey,
  setActiveEditorKey,
  onCommit,
}) => {
  const { t } = useTranslation();
  const editorKey = getEditorKey(lineItem.uuid, 'discount');
  const isActive = activeEditorKey === editorKey;
  const currentDiscount = useMemo(() => getLineItemDiscountAmount(lineItem), [lineItem]);
  const subtotal = useMemo(() => getLineItemSubtotal(lineItem), [lineItem]);
  const [mode, setMode] = useState<'inline' | 'form' | null>(null);
  const [amount, setAmount] = useState(formatBillAmount(currentDiscount));
  const [percent, setPercent] = useState(subtotal ? String((currentDiscount / subtotal) * 100) : '0');
  const [sponsor, setSponsor] = useState(lineItem.discounts?.[0]?.sponsor ?? '');
  const [comment, setComment] = useState(lineItem.discounts?.[0]?.description ?? '');
  const [error, setError] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);

  const getPercentFromAmount = (nextAmount: number) => (subtotal ? (nextAmount / subtotal) * 100 : 0);
  const getAmountFromPercent = (nextPercent: number) => (subtotal * nextPercent) / 100;

  useEffect(() => {
    if (!isActive) {
      setMode(null);
      setAmount(formatBillAmount(currentDiscount));
      setPercent(subtotal ? String((currentDiscount / subtotal) * 100) : '0');
      setSponsor(lineItem.discounts?.[0]?.sponsor ?? '');
      setComment(lineItem.discounts?.[0]?.description ?? '');
      setError('');
    }
  }, [currentDiscount, isActive, lineItem.discounts, subtotal]);

  useEffect(() => {
    if (isActive && mode === 'inline') {
      const input = editorRef.current?.querySelector('input');
      input?.focus();
      input?.select();
    }
  }, [isActive, mode]);

  const validateAmount = (nextAmount: number | null) => {
    if (nextAmount === null || nextAmount < 0 || nextAmount > subtotal) {
      setError(t('discountValidationError', 'Enter a discount between 0 and the line subtotal'));
      return false;
    }

    setError('');
    return true;
  };

  const validatePercent = (nextPercent: number | null) => {
    if (nextPercent === null || nextPercent < 0 || nextPercent > 100) {
      setError(t('discountPercentValidationError', 'Enter a discount percent between 0 and 100'));
      return false;
    }

    setError('');
    return true;
  };

  const openInlineEditor = () => {
    if (!isEditable) {
      return;
    }

    setAmount(formatBillAmount(currentDiscount));
    setMode('inline');
    setActiveEditorKey(editorKey);
  };

  const openForm = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!isEditable) {
      return;
    }

    setAmount(String(currentDiscount));
    setPercent(subtotal ? String((currentDiscount / subtotal) * 100) : '0');
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
    nextRate?: number,
    options: {
      closeOnCommit?: boolean;
      commentValue?: string;
      sponsorValue?: string;
    } = {},
  ) => {
    if (!validateAmount(nextAmount)) {
      return false;
    }

    const discounts =
      createDiscountUpdate(
        lineItem,
        nextAmount,
        nextRate,
        options.sponsorValue ?? sponsor,
        options.commentValue ?? comment,
      ).discounts ?? [];
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

  const autoCommitDiscount = (nextAmount: number, nextRate: number, nextSponsor = sponsor, nextComment = comment) => {
    void commitDiscount(nextAmount, nextRate, {
      closeOnCommit: false,
      commentValue: nextComment,
      sponsorValue: nextSponsor,
    });
  };

  const resetDiscount = () => {
    setAmount('0');
    setPercent('0');
    setSponsor('');
    setComment('');
    setError('');
    autoCommitDiscount(0, 0, '', '');
  };

  if (!isEditable) {
    return (
      <span
        className={`${styles.editableCell} ${styles.numeric} ${styles.staticValue}`}
        data-testid="editable-numeric-cell">
        <span
          className={`${styles.editableCellContent} ${styles.numericContent}`}
          data-testid="editable-numeric-content">
          {formatBillAmount(currentDiscount)}
        </span>
      </span>
    );
  }

  return (
    <div
      className={`${styles.editableCell} ${styles.numeric} ${
        isActive && mode === 'form' ? styles.activeEditableCell : ''
      }`}
      data-testid="editable-numeric-cell"
      ref={cellRef}
      onBlur={(event) => {
        if (mode === 'inline' && !event.currentTarget.contains(event.relatedTarget as Node)) {
          const nextAmount = parseEditableNumber(amount);
          if (nextAmount !== null) {
            void commitDiscount(nextAmount, getPercentFromAmount(nextAmount) / 100);
          } else {
            validateAmount(nextAmount);
          }
        }
      }}>
      <span
        className={`${styles.floatingAffordance} ${styles.numericAffordance}`}
        data-testid="editable-numeric-affordance"
        aria-hidden={mode === 'inline'}>
        {mode !== 'inline' ? (
          <EditableCellOverlay
            anchorRef={cellRef}
            trigger={
              <button
                type="button"
                className={`${styles.optionsButton} ${isActive && mode === 'form' ? styles.optionsButtonOpen : ''}`}
                aria-label={t('editDiscount', 'Edit discount')}
                onClick={openForm}>
                <EditIcon size={14} />
              </button>
            }
            isOpen={isActive && mode === 'form'}
            onClose={close}
            align="bottom-right">
            <div className={styles.popover} role="dialog" aria-label={t('discountForm', 'Discount form')}>
              <div className={styles.discountPopoverHeader}>
                <span>{t('discount', 'Discount')}</span>
                <button type="button" className={styles.inlineResetButton} onClick={resetDiscount}>
                  {t('reset', 'Reset')}
                </button>
              </div>
              <div className={styles.formGrid}>
                <TextInput
                  id={`discount-amount-${lineItem.uuid}`}
                  inputMode="decimal"
                  labelText={t('amount', 'Amount')}
                  size="sm"
                  value={amount}
                  invalid={!!error}
                  invalidText={error}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    const nextAmount = parseEditableNumber(nextValue);
                    setAmount(nextValue);
                    if (nextAmount === null || !validateAmount(nextAmount)) {
                      return;
                    }

                    const nextPercent = getPercentFromAmount(nextAmount);
                    setPercent(String(nextPercent));
                    autoCommitDiscount(nextAmount, nextPercent / 100);
                  }}
                />
                <TextInput
                  id={`discount-percent-${lineItem.uuid}`}
                  inputMode="decimal"
                  labelText={t('percent', 'Percent')}
                  size="sm"
                  value={percent}
                  invalid={!!error}
                  invalidText={error}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    const nextPercent = parseEditableNumber(nextValue);
                    setPercent(nextValue);
                    if (nextPercent === null || !validatePercent(nextPercent)) {
                      return;
                    }

                    const nextAmount = getAmountFromPercent(nextPercent);
                    setAmount(String(nextAmount));
                    autoCommitDiscount(nextAmount, nextPercent / 100);
                  }}
                />
                <TextInput
                  id={`discount-sponsor-${lineItem.uuid}`}
                  labelText={t('discountSponsor', 'Discount sponsor')}
                  value={sponsor}
                  onChange={(event) => {
                    const nextSponsor = event.target.value;
                    const nextAmount = parseEditableNumber(amount);
                    setSponsor(nextSponsor);
                    if (nextAmount !== null && validateAmount(nextAmount)) {
                      autoCommitDiscount(nextAmount, getPercentFromAmount(nextAmount) / 100, nextSponsor, comment);
                    }
                  }}
                />
                <TextInput
                  id={`discount-comment-${lineItem.uuid}`}
                  labelText={t('comment', 'Comment')}
                  value={comment}
                  onChange={(event) => {
                    const nextComment = event.target.value;
                    const nextAmount = parseEditableNumber(amount);
                    setComment(nextComment);
                    if (nextAmount !== null && validateAmount(nextAmount)) {
                      autoCommitDiscount(nextAmount, getPercentFromAmount(nextAmount) / 100, sponsor, nextComment);
                    }
                  }}
                />
              </div>
            </div>
          </EditableCellOverlay>
        ) : null}
      </span>
      {isActive && mode === 'inline' ? (
        <span
          className={`${styles.editableCellContent} ${styles.numericContent}`}
          data-testid="editable-numeric-content">
          <div ref={editorRef} className={`${styles.numericEditor} ${styles.inlineNumericEditor}`}>
            <TextInput
              id={`discount-${lineItem.uuid}`}
              hideLabel
              inputMode="decimal"
              labelText={t('discount', 'Discount')}
              size="sm"
              value={amount}
              invalid={!!error}
              invalidText={error}
              onChange={(event) => setAmount(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  const nextAmount = parseEditableNumber(amount);
                  if (nextAmount !== null) {
                    void commitDiscount(nextAmount, getPercentFromAmount(nextAmount) / 100);
                  } else {
                    validateAmount(nextAmount);
                  }
                }
                if (event.key === 'Escape') {
                  close();
                }
              }}
            />
          </div>
        </span>
      ) : (
        <button
          type="button"
          className={`${styles.editableCellContent} ${styles.numericContent} ${styles.cellSurfaceButton}`}
          data-testid="editable-numeric-content"
          onClick={openInlineEditor}>
          {formatBillAmount(currentDiscount)}
        </button>
      )}
    </div>
  );
};

export default EditableDiscountCell;
