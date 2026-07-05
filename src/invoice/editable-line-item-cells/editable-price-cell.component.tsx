import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TextInput } from '@carbon/react';
import { EditIcon } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { formatBillAmount } from '../../helpers';
import { type BillableService, type LineItem } from '../../types';
import { type ActiveEditorKey, type EditableLineItemCommit, getEditorKey } from './types';
import {
  createPriceUpdate,
  findSelectedServicePrice,
  findServiceForLineItem,
  parseEditableNumber,
  recalculateLineItem,
} from './utils';
import EditableCellOverlay from './editable-cell-overlay.component';
import styles from './editable-line-item-cells.scss';

type EditablePriceCellProps = {
  lineItem: LineItem;
  billableServices: Array<BillableService>;
  isEditable: boolean;
  activeEditorKey: ActiveEditorKey;
  setActiveEditorKey: (key: ActiveEditorKey) => void;
  onCommit: EditableLineItemCommit;
};

const EditablePriceCell: React.FC<EditablePriceCellProps> = ({
  lineItem,
  billableServices,
  isEditable,
  activeEditorKey,
  setActiveEditorKey,
  onCommit,
}) => {
  const { t } = useTranslation();
  const editorKey = getEditorKey(lineItem.uuid, 'price');
  const isActive = activeEditorKey === editorKey;
  const [mode, setMode] = useState<'inline' | 'picker' | null>(null);
  const [draft, setDraft] = useState(formatBillAmount(lineItem.price));
  const [error, setError] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);
  const service = useMemo(() => findServiceForLineItem(lineItem, billableServices), [billableServices, lineItem]);
  const selectedPrice = useMemo(() => findSelectedServicePrice(lineItem, service), [lineItem, service]);

  useEffect(() => {
    if (!isActive) {
      setMode(null);
      setDraft(formatBillAmount(lineItem.price));
      setError('');
    }
  }, [isActive, lineItem.price]);

  useEffect(() => {
    if (isActive && mode === 'inline') {
      const input = editorRef.current?.querySelector('input');
      input?.focus();
      input?.select();
    }
  }, [isActive, mode]);

  const openInlineEditor = () => {
    if (!isEditable) {
      return;
    }

    setDraft(formatBillAmount(lineItem.price));
    setError('');
    setMode('inline');
    setActiveEditorKey(editorKey);
  };

  const openPicker = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!isEditable) {
      return;
    }

    setError('');
    setMode('picker');
    setActiveEditorKey(editorKey);
  };

  const close = () => {
    setMode(null);
    setActiveEditorKey(null);
  };

  const commitDraft = async () => {
    const parsedPrice = parseEditableNumber(draft);
    if (parsedPrice === null || parsedPrice < 0) {
      setError(t('priceValidationError', 'Enter a valid price greater than or equal to 0'));
      return;
    }

    if (parsedPrice === lineItem.price) {
      close();
      return;
    }

    await onCommit(lineItem, createPriceUpdate(parsedPrice), recalculateLineItem({ ...lineItem, price: parsedPrice }));
    close();
  };

  if (!isEditable) {
    return (
      <span
        className={`${styles.editableCell} ${styles.numeric} ${styles.staticValue}`}
        data-testid="editable-numeric-cell">
        <span
          className={`${styles.editableCellContent} ${styles.numericContent}`}
          data-testid="editable-numeric-content">
          {formatBillAmount(lineItem.price)}
        </span>
      </span>
    );
  }

  return (
    <div
      className={`${styles.editableCell} ${styles.numeric} ${
        isActive && mode === 'picker' ? styles.activeEditableCell : ''
      }`}
      data-testid="editable-numeric-cell"
      ref={cellRef}
      onBlur={(event) => {
        if (mode === 'inline' && !event.currentTarget.contains(event.relatedTarget as Node)) {
          void commitDraft();
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
                className={`${styles.optionsButton} ${isActive && mode === 'picker' ? styles.optionsButtonOpen : ''}`}
                aria-label={t('selectPriceOption', 'Select price option')}
                onClick={openPicker}>
                <EditIcon size={14} />
              </button>
            }
            isOpen={isActive && mode === 'picker'}
            onClose={close}
            align="bottom-right">
            <div className={styles.popover} role="dialog" aria-label={t('priceOptions', 'Price options')}>
              <p className={styles.currentPrice}>
                {t('currentPrice', 'Current price')}: {formatBillAmount(lineItem.price)}
              </p>
              <p className={styles.popoverTitle}>{t('selectAnOption', 'Select an option')}</p>
              <div className={styles.optionList}>
                {(service?.servicePrices ?? []).map((priceOption) => {
                  const isSelected =
                    selectedPrice?.uuid === priceOption.uuid || Number(priceOption.price) === Number(lineItem.price);
                  return (
                    <button
                      type="button"
                      key={priceOption.uuid ?? `${priceOption.name}-${priceOption.price}`}
                      className={`${styles.optionButton} ${isSelected ? styles.selectedOption : ''}`}
                      aria-current={isSelected ? 'true' : undefined}
                      onClick={async () => {
                        const price = Number(priceOption.price) || 0;
                        await onCommit(
                          lineItem,
                          createPriceUpdate(price, priceOption),
                          recalculateLineItem({
                            ...lineItem,
                            price,
                            priceName: priceOption.name,
                            priceUuid: priceOption.uuid ?? '',
                          }),
                        );
                        close();
                      }}>
                      <span>{priceOption.name}</span>
                      <span className={styles.optionAmount}>{formatBillAmount(Number(priceOption.price) || 0)}</span>
                      {isSelected ? (
                        <span className={styles.optionCheck} aria-hidden="true">
                          ✓
                        </span>
                      ) : null}
                    </button>
                  );
                })}
                {!service?.servicePrices?.length ? <span>{t('noPriceOptions', 'No price options')}</span> : null}
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
              id={`price-${lineItem.uuid}`}
              hideLabel
              inputMode="decimal"
              labelText={t('price', 'Price')}
              size="sm"
              value={draft}
              invalid={!!error}
              invalidText={error}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void commitDraft();
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
          {formatBillAmount(lineItem.price)}
        </button>
      )}
    </div>
  );
};

export default EditablePriceCell;
