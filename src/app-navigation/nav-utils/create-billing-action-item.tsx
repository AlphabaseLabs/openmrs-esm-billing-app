import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './nav.scss';

type BillingActionConfig = {
  actionKey: string;
  title: string;
};

type BillingActionProps = {
  onSelect?: () => void;
  onSelectAction?: (actionKey: string) => void;
};

const createBillingActionItem = (config: BillingActionConfig) => {
  return ({ onSelect, onSelectAction }: BillingActionProps) => {
    const { t } = useTranslation();

    return (
      <button
        type="button"
        className={styles.menuItemButton}
        onClick={() => {
          onSelectAction?.(config.actionKey);
          onSelect?.();
        }}>
        {t(config.title)}
      </button>
    );
  };
};

export default createBillingActionItem;
