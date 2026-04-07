import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './nav.scss';

type BillingActionConfig = {
  actionKey: string;
  title: string;
};

type BillingActionProps = {
  onSelect?: () => void;
  onSelectAction?: (actionKey: string, title?: string) => void;
};

const createBillingActionItem = (config: BillingActionConfig) => {
  return ({ onSelect, onSelectAction }: BillingActionProps) => {
    const { t } = useTranslation();

    return (
      <button
        type="button"
        className={styles.menuItemButton}
        onClick={() => {
          onSelectAction?.(config.actionKey, t(config.title, config.title));
          onSelect?.();
        }}>
        {t(config.title, config.title)}
      </button>
    );
  };
};

export default createBillingActionItem;
