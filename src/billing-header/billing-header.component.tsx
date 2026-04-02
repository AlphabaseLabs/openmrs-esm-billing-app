import React, { useContext } from 'react';
import dayjs from 'dayjs';
import { DatePickerInput, DatePicker } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { UserFollow } from '@carbon/react/icons';
import { useSession } from '@openmrs/esm-framework';
import BillingIllustration from './billing-illustration.component';
import SelectedDateContext from '../hooks/selectedDateContext';
import styles from './billing-header.scss';

interface BillingHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

const BillingHeader: React.FC<BillingHeaderProps> = ({ title, actions }) => {
  const { t } = useTranslation();
  const session = useSession();
  const { selectedDate, setSelectedDate } = useContext(SelectedDateContext);
  const dateValue = selectedDate ? dayjs(selectedDate).format('DD MMM YYYY') : '';

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
        <div className={styles.metadataContainer}>
          <div className={styles.userContainer}>
            <p>{session?.user?.person?.display}</p>
            <UserFollow size={16} className={styles.userIcon} />
          </div>
          <span className={styles.middot}>&middot;</span>
          <DatePicker
            onChange={([date]) => setSelectedDate(date ? dayjs(date).startOf('day').toISOString() : null)}
            value={dateValue}
            dateFormat="d-M-Y"
            datePickerType="single"
            maxDate={Date.now()}>
            <DatePickerInput
              style={{ cursor: 'pointer', backgroundColor: 'transparent', border: 'none', maxWidth: '10rem' }}
              id="appointment-date-picker"
              placeholder="DD-MMM-YYYY"
              labelText=""
              type="text"
            />
          </DatePicker>
        </div>
        {actions ? <div className={styles.actionsContainer}>{actions}</div> : null}
      </div>
    </div>
  );
};

export default BillingHeader;
