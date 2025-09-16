import { DatePicker, DatePickerInput } from '@carbon/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../payment-history.scss';
import { usePaymentFilterContext } from '../usePaymentFilterContext';

export const DateRangeFilter = () => {
  const { t } = useTranslation();
  const { dateRange, setDateRange } = usePaymentFilterContext();

  const handleDateRangeChange = ([start, end]: Array<Date>) => {
    if (start) {
      // If only start date is provided, set end date to end of that day
      const endDate = end || new Date(start.getTime());

      // Ensure start is at beginning of day and end is at end of day
      const startOfDay = new Date(start);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);

      setDateRange([startOfDay, endOfDay]);
    }
  };

  return (
    <DatePicker
      maxDate={new Date()}
      datePickerType="range"
      className={styles.dateRangePicker}
      value={[...dateRange]}
      onChange={handleDateRangeChange}>
      <DatePickerInput
        id="date-picker-input-id-start"
        placeholder="mm/dd/yyyy"
        labelText={t('startDate', 'Start date')}
        size="md"
      />
      <DatePickerInput
        id="date-picker-input-id-finish"
        placeholder="mm/dd/yyyy"
        labelText={t('endDate', 'End date')}
        size="md"
      />
    </DatePicker>
  );
};
