import { type BillLineItemUpdate } from '../../billing.resource';
import { type LineItem } from '../../types';

export type EditableLineItemField = 'billItem' | 'price' | 'discount';

export type ActiveEditorKey = string | null;

export type EditableLineItemCommit = (
  lineItem: LineItem,
  updates: BillLineItemUpdate,
  updatedLineItem: LineItem,
) => Promise<void> | void;

export const getEditorKey = (lineItemUuid: string, field: EditableLineItemField) => `${lineItemUuid}:${field}`;
