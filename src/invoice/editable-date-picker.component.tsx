import { Tooltip } from '@carbon/react';
import dayjs from 'dayjs';
import React, { useRef } from 'react';

type EditableDatePickerProps = {
  readonly ariaLabel: string;
  readonly className?: string;
  readonly disabled?: boolean;
  readonly displayValue?: string;
  readonly id: string;
  readonly tooltip?: string;
  readonly value?: string | number | Date | null;
  readonly onChange: (selectedDates: Array<Date | string>) => void | Promise<void>;
};

const datePickerContainerStyle: React.CSSProperties = {
  position: 'relative',
};

const datePickerButtonStyle: React.CSSProperties = {
  appearance: 'none',
  background: 'transparent',
  border: 0,
  color: 'inherit',
  cursor: 'pointer',
  font: 'inherit',
  margin: 0,
  padding: 0,
  textAlign: 'inherit',
};

const hiddenDateInputStyle: React.CSSProperties = {
  blockSize: 1,
  inlineSize: 1,
  insetBlockStart: '50%',
  insetInlineStart: 0,
  opacity: 0,
  pointerEvents: 'none',
  position: 'absolute',
};

export const getDateWithCurrentTime = (selectedDate: Date | string, currentDate?: string | number | Date | null) => {
  const selectedDateValue = dayjs(selectedDate);
  const currentDateValue = currentDate ? dayjs(currentDate) : dayjs();

  return selectedDateValue
    .hour(currentDateValue.hour())
    .minute(currentDateValue.minute())
    .second(currentDateValue.second())
    .millisecond(currentDateValue.millisecond())
    .valueOf();
};

export function EditableDatePicker({
  ariaLabel,
  className,
  disabled,
  displayValue,
  id,
  tooltip,
  value,
  onChange,
}: EditableDatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dateValue = value ? dayjs(value) : null;
  const inputValue = dateValue?.isValid() ? dateValue.format('YYYY-MM-DD') : '';
  const renderedValue = displayValue ?? (dateValue?.isValid() ? dateValue.format('DD-MMM-YYYY') : '');

  const openDatePicker = () => {
    if (disabled) {
      return;
    }

    const input = inputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    input?.focus();
    if (input?.showPicker) {
      input.showPicker();
    } else {
      input?.click();
    }
  };

  const dateButton = (
    <button
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={openDatePicker}
      style={{ ...datePickerButtonStyle, cursor: disabled ? 'default' : 'pointer' }}
      type="button">
      {renderedValue}
    </button>
  );

  return (
    <span className={className} style={datePickerContainerStyle}>
      {tooltip ? (
        <Tooltip label={tooltip} enterDelayMs={0}>
          {dateButton}
        </Tooltip>
      ) : (
        dateButton
      )}
      <input
        aria-label={`${ariaLabel} input`}
        disabled={disabled}
        id={id}
        max={dayjs().format('YYYY-MM-DD')}
        onChange={(event) => {
          if (event.target.value) {
            onChange([event.target.value]);
          }
        }}
        ref={inputRef}
        style={hiddenDateInputStyle}
        tabIndex={-1}
        type="date"
        value={inputValue}
      />
    </span>
  );
}
