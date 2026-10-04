import React, { useState } from 'react';
import { ComposedModal, ModalBody } from '@carbon/react';
import styles from './generic-page-modal.scss';

interface GenericPageModalProps {
  ariaLabel: string;
  children?: React.ReactNode;
  closeLabel?: string;
  collapseLabel?: string;
  expandLabel?: string;
  onClose: () => void;
}

function ExpandModalIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16">
      <path d="M2 10h1v2.3L6.3 9 7 9.7 3.7 13H6v1H2z" />
      <path d="M10 2h4v4h-1V3.7L9.7 7 9 6.3 12.3 3H10z" />
    </svg>
  );
}

function CollapseModalIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16">
      <path d="M7 9v4H6v-2.3L2.7 14 2 13.3 5.3 10H3V9z" />
      <path d="M9 7V3h1v2.3L13.3 2l.7.7L10.7 6H13v1z" />
    </svg>
  );
}

function CloseModalIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16">
      <path d="m3.5 2.8 4.5 4.5 4.5-4.5.7.7L8.7 8l4.5 4.5-.7.7L8 8.7l-4.5 4.5-.7-.7L7.3 8 2.8 3.5z" />
    </svg>
  );
}

function GenericPageModal({
  ariaLabel,
  children,
  closeLabel = 'Close',
  collapseLabel = 'Collapse',
  expandLabel = 'Expand',
  onClose,
}: GenericPageModalProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerClassName = [styles.genericPageModal, isExpanded && styles.expandedGenericPageModal]
    .filter(Boolean)
    .join(' ');

  return (
    <ComposedModal aria-label={ariaLabel} containerClassName={containerClassName} onClose={onClose} open size="lg">
      <ModalBody className={styles.modalBody}>
        <div className={styles.toolbar}>
          <button
            aria-label={isExpanded ? collapseLabel : expandLabel}
            aria-pressed={isExpanded}
            className={styles.toolbarIconButton}
            onClick={() => setIsExpanded((current) => !current)}
            title={isExpanded ? collapseLabel : expandLabel}
            type="button">
            {isExpanded ? <CollapseModalIcon /> : <ExpandModalIcon />}
          </button>
          <button
            aria-label={closeLabel}
            className={styles.toolbarIconButton}
            onClick={onClose}
            title={closeLabel}
            type="button">
            <CloseModalIcon />
          </button>
        </div>
        <div aria-label={ariaLabel} className={styles.pageSurface} data-generic-page-modal-expanded={isExpanded}>
          {children}
        </div>
      </ModalBody>
    </ComposedModal>
  );
}

export default GenericPageModal;
