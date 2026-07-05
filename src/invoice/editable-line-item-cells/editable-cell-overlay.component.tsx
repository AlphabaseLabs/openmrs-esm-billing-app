import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './editable-line-item-cells.scss';

type EditableCellPopoverAlign = 'left' | 'right' | 'bottom-left' | 'bottom-right';

type EditableCellOverlayProps = {
  anchorRef?: React.RefObject<HTMLElement>;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  trigger: React.ReactNode;
  align?: EditableCellPopoverAlign;
  dataTestId?: string;
};

type OverlayPosition = {
  left: number;
  minWidth: number;
  top: number;
};

const overlayOffset = 0;
const viewportMargin = 16;

const EditableCellOverlay: React.FC<EditableCellOverlayProps> = ({
  anchorRef,
  children,
  isOpen,
  onClose,
  trigger,
  align = 'left',
  dataTestId = 'editable-cell-overlay',
}) => {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<OverlayPosition | null>(null);

  const updatePosition = useCallback(() => {
    const triggerElement = triggerRef.current;
    const anchorElement = anchorRef?.current ?? triggerElement;

    if (!anchorElement || typeof window === 'undefined') {
      return;
    }

    const triggerRect = anchorElement.getBoundingClientRect();
    const overlayRect = overlayRef.current?.getBoundingClientRect();
    const overlayWidth = overlayRect?.width ?? 0;
    const overlayHeight = overlayRect?.height ?? 0;
    const shouldAlignRight = align === 'right' || align === 'bottom-right';
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const maxLeft = Math.max(viewportMargin, viewportWidth - overlayWidth - viewportMargin);
    let left = shouldAlignRight ? triggerRect.right - overlayWidth : triggerRect.left;
    let top = triggerRect.bottom + overlayOffset;

    left = Math.min(Math.max(viewportMargin, left), maxLeft);

    if (overlayHeight && top + overlayHeight > viewportHeight - viewportMargin) {
      const topPlacement = triggerRect.top - overlayHeight - overlayOffset;
      if (topPlacement >= viewportMargin) {
        top = topPlacement;
      }
    }

    setPosition({
      left,
      minWidth: triggerRect.width,
      top,
    });
  }, [align, anchorRef]);

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    } else {
      setPosition(null);
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;

      if (
        !target ||
        triggerRef.current?.contains(target) ||
        anchorRef?.current?.contains(target) ||
        overlayRef.current?.contains(target)
      ) {
        return;
      }

      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleLayoutChange = () => {
      onClose();
    };

    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('touchstart', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleLayoutChange);
    window.addEventListener('scroll', handleLayoutChange, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown, true);
      document.removeEventListener('touchstart', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleLayoutChange);
      window.removeEventListener('scroll', handleLayoutChange, true);
    };
  }, [anchorRef, isOpen, onClose]);

  const overlay =
    isOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            className={styles.overlayLayer}
            data-align={align}
            data-testid={`${dataTestId}-layer`}
            ref={overlayRef}
            style={{
              left: position?.left ?? 0,
              minWidth: position?.minWidth,
              top: position?.top ?? 0,
              visibility: position ? 'visible' : 'hidden',
            }}>
            <div className={styles.overlayContent} data-testid={dataTestId}>
              {children}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <span className={styles.overlayTrigger} ref={triggerRef}>
        {trigger}
      </span>
      {overlay}
    </>
  );
};

export default EditableCellOverlay;
