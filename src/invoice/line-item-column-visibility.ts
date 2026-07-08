export type LineItemColumnKey =
  | 'no'
  | 'billItem'
  | 'status'
  | 'quantity'
  | 'price'
  | 'discount'
  | 'tax'
  | 'total'
  | 'actionButton';

type LineItemColumnAlignment = 'text' | 'numeric' | 'action';

export type LineItemColumnDefinition = {
  key: LineItemColumnKey;
  translationKey: string;
  defaultLabel: string;
  required: boolean;
  defaultVisible: boolean;
  alignment: LineItemColumnAlignment;
  minWidth: number;
  growWeight: number;
  isFixed: boolean;
};

export type LineItemTableLayoutColumnKey = LineItemColumnKey | '__selection__';

export type LineItemTableLayoutColumn = {
  key: LineItemTableLayoutColumnKey;
  minWidth: number;
  growWeight: number;
  isFixed: boolean;
};

export type LineItemTableComputedColumn = {
  key: LineItemTableLayoutColumnKey;
  width: number;
};

export type LineItemTableColumnLayout = {
  columns: Array<LineItemTableComputedColumn>;
  totalMinWidth: number;
  layoutWidth: number;
};

export const LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY = 'openmrs-esm-billing-app.invoice-table.visible-optional-columns';

export const lineItemColumnDefinitions: Array<LineItemColumnDefinition> = [
  {
    key: 'no',
    translationKey: 'number',
    defaultLabel: 'Number',
    required: false,
    defaultVisible: true,
    alignment: 'text',
    minWidth: 80,
    growWeight: 0,
    isFixed: true,
  },
  {
    key: 'billItem',
    translationKey: 'billItem',
    defaultLabel: 'Bill item',
    required: true,
    defaultVisible: true,
    alignment: 'text',
    minWidth: 224,
    growWeight: 2.5,
    isFixed: false,
  },
  {
    key: 'status',
    translationKey: 'status',
    defaultLabel: 'Status',
    required: false,
    defaultVisible: true,
    alignment: 'text',
    minWidth: 128,
    growWeight: 0.8,
    isFixed: false,
  },
  {
    key: 'quantity',
    translationKey: 'quantity',
    defaultLabel: 'Quantity',
    required: false,
    defaultVisible: true,
    alignment: 'numeric',
    minWidth: 112,
    growWeight: 0.6,
    isFixed: false,
  },
  {
    key: 'price',
    translationKey: 'price',
    defaultLabel: 'Price',
    required: true,
    defaultVisible: true,
    alignment: 'numeric',
    minWidth: 128,
    growWeight: 1,
    isFixed: false,
  },
  {
    key: 'discount',
    translationKey: 'discount',
    defaultLabel: 'Discount',
    required: false,
    defaultVisible: true,
    alignment: 'numeric',
    minWidth: 144,
    growWeight: 1,
    isFixed: false,
  },
  {
    key: 'tax',
    translationKey: 'tax',
    defaultLabel: 'Tax',
    required: false,
    defaultVisible: false,
    alignment: 'numeric',
    minWidth: 80,
    growWeight: 0.5,
    isFixed: false,
  },
  {
    key: 'total',
    translationKey: 'total',
    defaultLabel: 'Total',
    required: true,
    defaultVisible: true,
    alignment: 'numeric',
    minWidth: 128,
    growWeight: 1,
    isFixed: false,
  },
  {
    key: 'actionButton',
    translationKey: 'action',
    defaultLabel: 'Action',
    required: true,
    defaultVisible: true,
    alignment: 'action',
    minWidth: 144,
    growWeight: 0,
    isFixed: true,
  },
];

export const lineItemSelectionColumnDefinition: LineItemTableLayoutColumn = {
  key: '__selection__',
  minWidth: 48,
  growWeight: 0,
  isFixed: true,
};

const lineItemColumnKeys = new Set(lineItemColumnDefinitions.map((column) => column.key));
const hideableLineItemColumnKeys = new Set(
  lineItemColumnDefinitions.filter((column) => !column.required).map((column) => column.key),
);

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
};

export const isLineItemColumnKey = (value: unknown): value is LineItemColumnKey =>
  typeof value === 'string' && lineItemColumnKeys.has(value as LineItemColumnKey);

export const isHideableLineItemColumnKey = (value: unknown): value is LineItemColumnKey =>
  isLineItemColumnKey(value) && hideableLineItemColumnKeys.has(value);

export const getLineItemColumnDefinitions = () => lineItemColumnDefinitions;

export const getHideableLineItemColumnDefinitions = () =>
  lineItemColumnDefinitions.filter((column) => !column.required);

export const getDefaultVisibleLineItemColumnKeys = () =>
  lineItemColumnDefinitions.filter((column) => column.defaultVisible).map((column) => column.key);

export const getVisibleOptionalLineItemColumnKeys = (visibleColumnKeys: Array<LineItemColumnKey>) => {
  const visibleColumnKeySet = new Set(visibleColumnKeys);

  return lineItemColumnDefinitions
    .filter((column) => !column.required && visibleColumnKeySet.has(column.key))
    .map((column) => column.key);
};

export const normalizeLineItemVisibleColumnKeys = (visibleOptionalColumnKeys: unknown): Array<LineItemColumnKey> => {
  if (!Array.isArray(visibleOptionalColumnKeys)) {
    return getDefaultVisibleLineItemColumnKeys();
  }

  const visibleOptionalColumnKeySet = new Set(visibleOptionalColumnKeys.filter(isHideableLineItemColumnKey));

  return lineItemColumnDefinitions
    .filter((column) => column.required || visibleOptionalColumnKeySet.has(column.key))
    .map((column) => column.key);
};

export const readLineItemColumnVisibilityPreference = (storage = getStorage()) => {
  if (!storage) {
    return getDefaultVisibleLineItemColumnKeys();
  }

  try {
    const storedValue = storage.getItem(LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY);

    if (!storedValue) {
      return getDefaultVisibleLineItemColumnKeys();
    }

    return normalizeLineItemVisibleColumnKeys(JSON.parse(storedValue));
  } catch {
    return getDefaultVisibleLineItemColumnKeys();
  }
};

export const writeLineItemColumnVisibilityPreference = (
  visibleColumnKeys: Array<LineItemColumnKey>,
  storage = getStorage(),
) => {
  if (!storage) {
    return;
  }

  storage.setItem(
    LINE_ITEM_COLUMN_VISIBILITY_STORAGE_KEY,
    JSON.stringify(getVisibleOptionalLineItemColumnKeys(visibleColumnKeys)),
  );
};

export const getLineItemTableLayoutColumns = (
  visibleColumns: Array<LineItemColumnDefinition>,
  includeSelectionColumn: boolean,
): Array<LineItemTableLayoutColumn> => [
  ...(includeSelectionColumn ? [lineItemSelectionColumnDefinition] : []),
  ...visibleColumns.map(({ key, minWidth, growWeight, isFixed }) => ({ key, minWidth, growWeight, isFixed })),
];

export const calculateLineItemTableColumnLayout = (
  columns: Array<LineItemTableLayoutColumn>,
  availableWidth: number,
): LineItemTableColumnLayout => {
  const totalMinWidth = columns.reduce((sum, column) => sum + column.minWidth, 0);
  const normalizedAvailableWidth = Number.isFinite(availableWidth) && availableWidth > 0 ? availableWidth : 0;
  const layoutWidth = Math.max(totalMinWidth, Math.floor(normalizedAvailableWidth));
  const surplus = layoutWidth - totalMinWidth;
  const totalGrowWeight = columns.reduce((sum, column) => sum + (column.isFixed ? 0 : column.growWeight), 0);
  const unroundedWidths = columns.map((column) => {
    if (column.isFixed || totalGrowWeight === 0) {
      return column.minWidth;
    }

    return column.minWidth + surplus * (column.growWeight / totalGrowWeight);
  });
  const floorWidths = unroundedWidths.map(Math.floor);
  const remainders = unroundedWidths
    .map((width, index) => ({ index, remainder: width - floorWidths[index] }))
    .sort((left, right) => right.remainder - left.remainder || left.index - right.index);
  let remainderToDistribute = layoutWidth - floorWidths.reduce((sum, width) => sum + width, 0);

  while (remainderToDistribute > 0 && remainders.length > 0) {
    for (const { index } of remainders) {
      if (remainderToDistribute === 0) {
        break;
      }

      floorWidths[index] += 1;
      remainderToDistribute -= 1;
    }
  }

  return {
    columns: columns.map((column, index) => ({
      key: column.key,
      width: floorWidths[index] ?? column.minWidth,
    })),
    totalMinWidth,
    layoutWidth,
  };
};
