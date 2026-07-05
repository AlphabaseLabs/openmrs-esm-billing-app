## Why

The recent editable-cell surface work correctly expanded the clickable area, but it regressed numeric cell geometry: price, discount, tax, and total-style numeric values must remain visually pinned to the right edge of their cell. Numeric cells should behave like spreadsheet/table numeric columns: the full cell surface can be interactive, but the value itself stays right-aligned in both display and inline-edit states.

## What Changes

- Restore explicit right alignment for editable numeric display surfaces that are also full-width buttons.
- Preserve full-cell hit targets for editable numeric cells.
- Preserve borderless inline editor behavior and right-aligned input text.
- Preserve floating edit icon behavior and ensure icons still do not allocate layout space inside numeric cells.
- Preserve text editable-cell left alignment; this change is numeric-cell specific.
- Add focused regression coverage so `cellSurfaceButton` cannot override numeric right alignment again.

## Capabilities

### New Capabilities

- `editable-numeric-cell-alignment`: Defines the alignment contract for editable numeric cells when full-cell interactive surfaces are used.

### Modified Capabilities

- None.

## Impact

- Affected production code:
  - `src/invoice/editable-line-item-cells/editable-line-item-cells.scss`
  - Potentially focused editable numeric cell components only if class composition must be adjusted.
- Affected tests:
  - Editable price and discount cell tests should assert that full-surface numeric display controls keep the numeric alignment contract.
- No backend API changes.
- No dependency changes.
