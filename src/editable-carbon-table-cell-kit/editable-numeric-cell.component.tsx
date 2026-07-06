import React, { useRef } from 'react';
import { TextInput } from '@carbon/react';
import EditableCellPopover from './editable-cell-popover.component';
import { type EditableNumericCellProps } from './types';
import styles from './editable-carbon-table-cell-kit.scss';

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

const EditableNumericCell: React.FC<EditableNumericCellProps> = ({
  activeMode,
  className,
  error,
  inlineMode = 'inline',
  inputId,
  inputLabelText,
  inputMode = 'decimal',
  inputValue,
  isActive,
  isEditable,
  onBlur,
  onInlineOpen,
  onInputChange,
  onInputKeyDown,
  popover,
  sizingValue,
  value,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);
  const isInlineActive = isActive && activeMode === inlineMode;

  React.useEffect(() => {
    if (isInlineActive) {
      const input = editorRef.current?.querySelector('input');
      input?.focus();
      input?.select();
    }
  }, [isInlineActive]);

  if (!isEditable) {
    return (
      <span
        className={cx(styles.editableCell, styles.numeric, styles.staticValue, className)}
        data-testid="editable-numeric-cell">
        <span
          className={cx(styles.editableCellContent, styles.numericContent)}
          data-testid="editable-numeric-content">
          {value}
        </span>
      </span>
    );
  }

  return (
    <div
      className={cx(styles.editableCell, styles.numeric, className)}
      data-testid="editable-numeric-cell"
      onBlur={onBlur}
      ref={cellRef}>
      <span
        className={cx(styles.floatingAffordance, styles.numericAffordance)}
        data-testid="editable-numeric-affordance"
        aria-hidden={isInlineActive}>
        {!isInlineActive && popover ? (
          <EditableCellPopover
            anchorRef={cellRef}
            trigger={
              <button
                type="button"
                className={cx(styles.optionsButton, popover.isOpen && styles.optionsButtonOpen, popover.buttonClassName)}
                aria-label={popover.triggerLabel}
                onClick={popover.onOpen}>
                {popover.trigger}
              </button>
            }
            isOpen={popover.isOpen}
            onClose={popover.onClose}
            align={popover.align ?? 'left'}>
            <div
              className={cx(styles.popover, popover.className)}
              role="dialog"
              aria-label={popover.ariaLabel}>
              {popover.content}
            </div>
          </EditableCellPopover>
        ) : null}
      </span>
      {isInlineActive ? (
        <span
          className={cx(styles.editableCellContent, styles.numericContent)}
          data-testid="editable-numeric-content">
          <span className={styles.inlineNumericSizingValue} aria-hidden="true">
            {sizingValue ?? value}
          </span>
          <div
            ref={editorRef}
            className={cx(styles.numericEditor, styles.inlineNumericEditor)}
            data-testid="editable-inline-numeric-editor">
            <TextInput
              className={styles.inlineNumericInput}
              id={inputId}
              hideLabel
              inputMode={inputMode}
              labelText={inputLabelText}
              size="sm"
              value={inputValue}
              invalid={!!error}
              invalidText={error}
              onChange={(event) => onInputChange(event.target.value, event)}
              onKeyDown={onInputKeyDown}
            />
          </div>
        </span>
      ) : (
        <button
          type="button"
          className={cx(styles.editableCellContent, styles.numericContent, styles.cellSurfaceButton)}
          data-testid="editable-numeric-content"
          onClick={onInlineOpen}>
          {value}
        </button>
      )}
    </div>
  );
};

export default EditableNumericCell;
