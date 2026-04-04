import { Tooltip } from '@carbon/react';
import React from 'react';
import styles from './invoice-breakdown.scss';

type InvoiceBreakDownProps = {
  label: string;
  value: string;
  hasBalance?: Boolean;
  tooltip?: string;
};

export const InvoiceBreakDown: React.FC<InvoiceBreakDownProps> = ({ label, value, hasBalance, tooltip }) => {
  return (
    <div className={styles.invoiceBreakdown}>
      {tooltip ? (
        <Tooltip label={tooltip} enterDelayMs={0}>
          <span className={hasBalance ? styles.extendedLabel : styles.label}>{label}: </span>
        </Tooltip>
      ) : (
        <span className={hasBalance ? styles.extendedLabel : styles.label}>{label}: </span>
      )}
      <span className={styles.value}>{value}</span>
    </div>
  );
};
