## Context

The invoice line-item table now supports inline editing for price, discount, and bill item cells. The current numeric inline edit state uses a Carbon `NumberInput`, which introduces a boxed field, native steppers, left-aligned draft text, and focus chrome that visually reads as a form widget placed inside a table row.

The target interaction is closer to Airtable, Notion, or spreadsheet editing: the table value should appear to become editable in place. The edit state must preserve the cell's table geometry, alignment, row height, and production commit behavior. Rich editor popovers have already been moved to a portal layer and must remain outside the table overflow container.

## Goals / Non-Goals

**Goals:**

- Make inline price and discount editing visually continuous with the table cell.
- Remove native number input steppers from inline numeric editing.
- Preserve numeric right alignment while viewing and editing.
- Keep inline edit controls from changing row height.
- Ensure edit icon affordances do not allocate layout space inside table cells.
- Keep rich popover editors portaled outside table overflow.
- Preserve production `InvoiceTable`, `BillDetails`, commit, cancel, disabled-state, and Storybook production-code paths.

**Non-Goals:**

- Redesigning the invoice table.
- Replacing Carbon `DataTable`.
- Changing backend APIs or line-item update payloads.
- Adding Storybook-only editable-cell components.
- Reworking the existing rich price, discount, or bill-item popover content beyond maintaining portal ownership.
- Implementing live locale-aware accounting behavior beyond comma-tolerant numeric draft parsing.

## Decisions

### Use text-based decimal input for inline numeric editing

Inline price and discount editors will use a text-based input with `inputMode="decimal"` instead of Carbon `NumberInput`.

Rationale: the table displays comma-grouped numbers such as `2,000` and `249,999`. Native `type="number"` inputs cannot hold comma-formatted values, so editing forces a visual jump from formatted display text to raw unformatted input text. `NumberInput` also brings steppers, extra wrapper geometry, and form-control chrome that are not appropriate for free-form price and discount edits.

Alternative considered: keep `NumberInput` and hide steppers. Rejected because it still uses native number semantics and requires heavy styling overrides while preventing formatted draft strings.

Alternative considered: use a bare `<input>`. Deferred because Carbon `TextInput` gives label, invalid-state, and token integration with less custom accessibility work. A bare input remains acceptable if the Carbon wrapper proves too difficult to make visually seamless.

### Keep the cell content surface full-width

The displayed value and inline editor should both occupy the full content width of the table cell. Numeric cells right-align display text and draft text; text cells left-align display text.

Rationale: the most visible mismatch is value movement. If `249,999` becomes a left-aligned draft string or a small centered form control, the table reads as unstable. Full-width in-cell editing keeps the user oriented.

### Edit icons are semantic children, geometric overlays

Edit icon triggers remain inside the editable cell DOM for ownership, keyboard navigation, focus, and accessibility, but they must be absolutely positioned and out of normal layout flow.

Rationale: the icon belongs to the cell interaction, but it should not consume grid columns, flex lanes, gaps, padding reservations, or table width. The table should size from real cell content, not from affordance chrome.

Numeric cells place the icon at inline-start because numeric values align at inline-end. Text cells place the icon at inline-end because text values align at inline-start.

Alternative considered: portal the edit icon like the rich popover. Rejected unless clipping is proven, because the icon is small, persistent, and semantically coupled to the cell. Portaling it would complicate focus and ownership without solving the core layout problem.

Alternative considered: reserve padding to prevent overlap. Rejected for this change because the goal is zero layout allocation for the icon. Overlap is acceptable in constrained widths as long as it does not shift or resize cell content.

### Inline edit focus is quiet and inside the cell

The active inline editor should avoid a boxed form field and large outline. It should use a subtle fill, inset underline, or equivalent focus treatment that remains inside the table cell and does not alter row geometry.

Rationale: accessibility still requires a visible focus state, but a full form-control outline makes the table feel like a widget was inserted into the row.

### Rich editors remain portal-owned

Price option picker, discount form, and bill-item picker content must continue rendering through the editable-cell overlay portal outside the table overflow container.

Rationale: large popovers cross table boundaries and must not be clipped or make the table row/icon area scrollable.

## Risks / Trade-offs

- [Risk] Absolutely positioned edit icons may visually overlap long content in narrow cells. -> Mitigation: show icons primarily on hover/focus/active states, use compact icon dimensions, and accept overlap rather than shifting content.
- [Risk] Restyling Carbon `TextInput` may still require wrapper-specific CSS. -> Mitigation: keep the inline editor behind reusable editable-cell classes and switch to a bare input only if Carbon wrapper chrome cannot be made seamless.
- [Risk] Comma-formatted draft values can create parsing edge cases. -> Mitigation: centralize numeric draft parsing by stripping grouping separators before validation and commit.
- [Risk] Removing `NumberInput` changes keyboard behavior for arrow-key step increments. -> Mitigation: price and discount are free-form amounts; steppers are not a required interaction.
- [Risk] Focus treatment can become too subtle for accessibility. -> Mitigation: keep a visible inset underline/fill and preserve label/invalid text semantics through the input component.

## Migration Plan

- Replace inline numeric `NumberInput` render paths for price and discount with text-based decimal input render paths.
- Consolidate shared in-cell editor and out-of-flow affordance styles in `editable-line-item-cells.scss`.
- Keep existing line-item commit payloads and recalculation utilities unchanged unless parsing helpers need to accept comma-formatted strings.
- Update focused editable-cell tests first, then inspect Storybook production stories for visual alignment.
- Rollback is limited to reverting the editable-cell component and style changes; no data migration is required.

## Open Questions

- Should comma formatting be applied live while typing, or only preserved when the user starts editing and normalized on commit?
- Should invalid inline numeric input show Carbon invalid text inside the cell, or defer visible errors to the existing commit behavior to avoid row-height changes?
