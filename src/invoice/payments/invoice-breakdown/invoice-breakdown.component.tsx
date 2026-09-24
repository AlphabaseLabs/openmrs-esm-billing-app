import { Tooltip } from '@carbon/react';
import React from 'react';
import styles from './invoice-breakdown.scss';
import { formatCurrency, getCurrencyForLocale } from '../../../helpers/currency';

type InvoiceBreakDownProps = {
  label: string;
  value: number;
  hasBalance?: boolean;
  tooltip?: string;
};

export const InvoiceBreakDown: React.FC<InvoiceBreakDownProps> = ({ label, value, hasBalance, tooltip }) => {
  return (
    <div className={styles.invoiceBreakdown}>
      {tooltip ? (
        <Tooltip autoAlign align="top-start" label={tooltip} enterDelayMs={0}>
          <span tabIndex={0} className={hasBalance ? styles.extendedLabel : styles.label}>
            {label}:
          </span>
        </Tooltip>
      ) : (
        <span className={hasBalance ? styles.extendedLabel : styles.label}>{label}: </span>
      )}
      <span className={styles.value}>
        <span>{getCurrencyForLocale()}</span>
        <span>{formatCurrency(value, { style: 'decimal', maximumFractionDigits: 2 })}</span>
      </span>
    </div>
  );
};
