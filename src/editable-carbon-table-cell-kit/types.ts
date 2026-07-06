import React from 'react';

export type EditableCellPopoverAlign = 'left' | 'right' | 'bottom-left' | 'bottom-right';

export type EditableCellCommitReason = 'enter' | 'blur' | 'selection' | 'outside-click';

export type EditableCellInteractionState<TMode extends string = string> = {
  isActive: boolean;
  mode: TMode | null;
};

export type EditableCellController<TMode extends string = string> = EditableCellInteractionState<TMode> & {
  close: () => void;
  open: (mode: TMode) => void;
  setMode: React.Dispatch<React.SetStateAction<TMode | null>>;
};

export type EditableCellPopoverProps = {
  anchorRef?: React.RefObject<HTMLElement>;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  trigger: React.ReactNode;
  align?: EditableCellPopoverAlign;
  dataTestId?: string;
};

export type EditableNumericCellPopoverConfig = {
  align?: EditableCellPopoverAlign;
  ariaLabel: string;
  buttonClassName?: string;
  className?: string;
  content: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onOpen: (event: React.MouseEvent<HTMLButtonElement>) => void;
  trigger: React.ReactNode;
  triggerLabel: string;
};

export type EditableNumericCellProps = {
  activeMode: string | null;
  className?: string;
  error?: string;
  inlineMode?: string;
  inputId: string;
  inputLabelText: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  inputValue: string;
  isActive: boolean;
  isEditable: boolean;
  onBlur?: React.FocusEventHandler<HTMLDivElement>;
  onInlineOpen: () => void;
  onInputChange: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  onInputKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  popover?: EditableNumericCellPopoverConfig;
  sizingValue?: React.ReactNode;
  value: React.ReactNode;
};

export type EditableTextCellPopoverConfig = {
  align?: EditableCellPopoverAlign;
  ariaLabel: string;
  buttonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  className?: string;
  content: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  trigger: React.ReactNode;
};

export type EditableTextCellProps = {
  activeContent?: React.ReactNode;
  className?: string;
  isActive: boolean;
  isEditable: boolean;
  isOpen: boolean;
  onActivate: () => void;
  popover?: EditableTextCellPopoverConfig;
  value: React.ReactNode;
};
