import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './nav.scss';

type BillingActionConfig = {
  actionKey: string;
  route: string;
  title: string;
};

type BillingActionProps = {
  onSelect?: () => void;
  onSelectAction?: (actionKey: string, title?: string) => void;
};

const isModifiedEvent = (event: React.MouseEvent<HTMLAnchorElement>) =>
  event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
const getBillingActionHref = (route: string) =>
  `${window.getOpenmrsSpaBase()}home/billing${route}`.replaceAll('//', '/');

const createBillingActionItem = (config: BillingActionConfig) => {
  return ({ onSelect, onSelectAction }: BillingActionProps) => {
    const { t } = useTranslation();
    const title = t(config.title, config.title);

    return (
      <a
        href={getBillingActionHref(config.route)}
        className={styles.menuItemButton}
        onClick={(event) => {
          if (event.button !== 0 || isModifiedEvent(event)) {
            onSelect?.();
            return;
          }

          event.preventDefault();
          onSelectAction?.(config.actionKey, title);
          onSelect?.();
        }}>
        {title}
      </a>
    );
  };
};

export default createBillingActionItem;
