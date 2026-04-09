import React, { useContext } from 'react';
import dayjs from 'dayjs';
import { DatePicker, DatePickerInput, IconButton } from '@carbon/react';
import { Close } from '@carbon/react/icons';
import { useTranslation } from 'react-i18next';
import BillingIllustration from './billing-illustration.component';
import SelectedDateContext from '../hooks/selectedDateContext';
import styles from './billing-header.scss';

interface BillingHeaderProps {
  title: string;
  actions?: React.ReactNode;
  showDateFilter?: boolean;
}

const BillingHeader: React.FC<BillingHeaderProps> = ({ title, actions, showDateFilter = false }) => {
  const { t } = useTranslation();
  const { selectedDate, setSelectedDate } = useContext(SelectedDateContext);
  const dateValue = selectedDate ? dayjs(selectedDate).format('DD MMM YYYY') : '';
  const handleDateChange = ([date]: Array<Date | string>) => {
    setSelectedDate(date ? dayjs(date).startOf('day').toISOString() : null);
  };
  const handleClearDate = () => {
    setSelectedDate(null);
  };

  return (
    <div className={styles.header} data-testid="billing-header">
      <div className={styles['left-justified-items']}>
        <BillingIllustration />
        <div className={styles['page-labels']}>
          <p>{t('billing', 'Billing')}</p>
          <p className={styles['page-name']}>{title}</p>
        </div>
      </div>
      <div className={styles['right-justified-items']}>
        {showDateFilter ? (
          <div className={styles.metadataContainer}>
            <DatePicker
              onChange={handleDateChange}
              value={dateValue}
              dateFormat="d-M-Y"
              datePickerType="single"
              maxDate={new Date()}>
              <DatePickerInput
                style={{ cursor: 'pointer', backgroundColor: 'transparent', border: 'none', maxWidth: '10rem' }}
                id="appointment-date-picker"
                placeholder="DD-MMM-YYYY"
                labelText=""
                type="text"
                size="sm"
              />
            </DatePicker>
            {selectedDate ? (
              <IconButton
                kind="ghost"
                aria-label={t('clearDateFilter', 'Clear date filter')}
                label={t('clearDateFilter', 'Clear date filter')}
                onClick={handleClearDate}
                size="sm"
                align="bottom-end">
                <Close />
              </IconButton>
            ) : null}
          </div>
        ) : null}
        {actions ? <div className={styles.actionsContainer}>{actions}</div> : null}
      </div>
    </div>
  );
};

export default BillingHeader;
