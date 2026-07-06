## Context

Invoice line items now support editable bill-item, price, and discount cells. The bill-item editor has become the clearest select-cell pattern: the active table cell is visually welded to a popover containing a short title and a selectable list with a selected-row highlight and checkmark. The price option picker already uses the same overlay infrastructure, but its content hierarchy differs by showing a separate current-price block and a price-specific list layout.

This change narrows the price picker to the same select-cell pattern as bill item while preserving the existing price editing split:

- Clicking the cell value still opens inline numeric editing.
- Clicking the chevron still opens the price option picker.
- Selecting a price option still auto-commits.

## Goals / Non-Goals

**Goals:**

- Make the price option picker visually and structurally match the bill-item select popover.
- Use a single concise popover title for price options.
- Render price options as list rows with a label lane, numeric amount lane, and selected-state checkmark.
- Preserve welded overlay anchoring and portal-based overflow behavior.
- Keep price-option selection auto-committing without save or cancel controls.

**Non-Goals:**

- Do not redesign the discount popover.
- Do not change bill-item picker behavior.
- Do not change inline numeric price editing behavior.
- Do not change table column widths or top invoice summary layout.
- Do not change pricing calculation, service-price selection semantics, or API payloads.

## Decisions

### Decision: Treat price option selection as a select-list popover

The price picker SHALL use the same interaction grammar as the bill-item picker: active cell, welded popover, title, selectable rows, selected-row highlight, and selected checkmark.

Alternative considered: keep the current current-price + select-option panel. Rejected because the active cell already shows the current value, making the extra current-price block redundant and visually inconsistent.

### Decision: Keep numeric inline editing separate

The price value click path remains an inline numeric editor. The chevron click path remains a price-option selector. This preserves the current production behavior while only standardizing the price-option popover.

Alternative considered: merge freeform price editing into the popover. Rejected because that would expand scope and change interaction semantics beyond this visual standardization.

### Decision: Add an amount lane to the shared select-row pattern

Price option rows need one extra numeric lane compared with bill-item rows. The row grammar is:

```text
label                  amount        selected check
```

The checkmark remains at the trailing edge so the selected state reads consistently with bill-item rows.

### Decision: Give price picker a stable minimum width

The price cell is narrower than the bill-item cell, so the popover needs a stable minimum width instead of shrinking to the price column. This keeps option labels, amounts, and the selected check readable without affecting table column sizing.

## Risks / Trade-offs

- Price options with long names could crowd the amount lane -> constrain label overflow inside the popover, not the table cell.
- A wider popover may overlap neighboring UI -> keep using the existing portal overlay and viewport clamping behavior.
- Removing the current-price block reduces explicit redundancy -> the active cell remains visible as the source of the current selected price, and the selected row remains highlighted in the list.
