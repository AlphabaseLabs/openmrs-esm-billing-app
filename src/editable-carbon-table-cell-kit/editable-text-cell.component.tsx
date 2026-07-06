import React, { useRef } from 'react';
import EditableCellPopover from './editable-cell-popover.component';
import { type EditableTextCellProps } from './types';
import styles from './editable-carbon-table-cell-kit.scss';

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

const EditableTextCell: React.FC<EditableTextCellProps> = ({
  activeContent,
  className,
  isActive,
  isEditable,
  isOpen,
  onActivate,
  popover,
  value,
}) => {
  const cellRef = useRef<HTMLSpanElement>(null);

  if (!isEditable) {
    return (
      <span className={cx(styles.editableCell, styles.textEditableCell, styles.staticValue, className)}>
        <span className={cx(styles.editableCellContent, styles.textContent)} data-testid="editable-text-content">
          {value}
        </span>
      </span>
    );
  }

  const { className: triggerClassName, ...triggerButtonProps } = popover?.buttonProps ?? {};

  return (
    <span
      className={cx(styles.editableCell, styles.textEditableCell, className)}
      data-testid="editable-text-cell"
      ref={cellRef}>
      {isActive && isOpen && activeContent ? (
        activeContent
      ) : (
        <button
          type="button"
          className={cx(styles.editableCellContent, styles.textContent, styles.cellSurfaceButton)}
          data-testid="editable-text-content"
          onClick={onActivate}>
          {value}
        </button>
      )}
      <span className={cx(styles.floatingAffordance, styles.textAffordance)} data-testid="editable-text-affordance">
        {popover ? (
          <EditableCellPopover
            anchorRef={cellRef}
            trigger={
              <button
                {...triggerButtonProps}
                type="button"
                className={cx(styles.optionsButton, popover.isOpen && styles.optionsButtonOpen, triggerClassName)}>
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
    </span>
  );
};

export default EditableTextCell;
