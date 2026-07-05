## Context

The editable line-item cells have been standardized around borderless inline numeric inputs and out-of-flow edit icons. However, the editable cell shell still behaves like a wrapper around a small value control instead of a full table-cell interaction surface.

The visible value can sit off-center vertically because the shell does not explicitly align content to the row center. Inline editing also starts only when the user clicks the text button containing the value. Empty space inside the editable cell does not activate inline editing, which makes the interaction feel imprecise and unlike a spreadsheet/table editor.

## Goals / Non-Goals

**Goals:**

- Vertically center display values and inline editors inside editable invoice table cells.
- Make the editable content surface open inline editing when clicked anywhere in that surface, not only on the text glyphs.
- Keep floating edit icons as separate rich-editor triggers that do not also trigger inline editing.
- Preserve out-of-flow icon geometry, borderless inline inputs, rich popover portal behavior, and production table code paths.
- Preserve disabled-row and finalized-bill behavior.

**Non-Goals:**

- Changing the numeric input primitive again.
- Redesigning the table columns, row heights, or Carbon `DataTable`.
- Moving edit icons out of the cell DOM.
- Changing rich popover content or portal ownership.
- Introducing Storybook-only editable components.

## Decisions

### Treat the editable cell as a full-height alignment shell

Editable cell shells should become the vertical alignment owner for their content. The shell should align display values, inline editors, and floating affordances to the row center without changing row height.

Rationale: the table cell's visual stability depends on the value appearing on the same vertical axis as other row content. A `min-height` wrapper alone is not enough; the shell needs an explicit centering model.

### Make the content surface the inline edit hit target

For inline-editable fields, the full content surface should open inline editing. The visible text can remain rendered as a button or be replaced by a button-like surface, but the click target must cover the usable editable cell area.

Rationale: users perceive the whole cell as editable. Requiring an exact click on the digits or label makes the table feel fragile and inconsistent with spreadsheet-style editing.

### Keep rich-editor icon clicks isolated

Floating edit icon clicks must stop propagation before they reach the content-surface inline edit handler. Numeric icons continue to open price options or discount form. Text icons continue to open bill-item selection.

Rationale: the same cell has two actions: inline edit from the content surface and rich edit from the floating icon. These must remain independent.

### Do not allocate new space for the hit target

The expanded hit target should come from making the existing cell surface interactive, not by adding padding, columns, or hidden layout lanes.

Rationale: the previous geometry work intentionally removed affordance-owned layout space. This change should not reintroduce it.

## Risks / Trade-offs

- [Risk] Full-surface click handlers can conflict with table row selection. -> Mitigation: scope the handler to editable cell content only and avoid attaching it to checkbox/action cells.
- [Risk] Floating icon clicks may accidentally trigger inline editing. -> Mitigation: stop propagation in icon trigger handlers and test the behavior.
- [Risk] Making a full-width surface focusable can create nested button issues if the visible value remains a `<button>`. -> Mitigation: choose a single interactive element per inline hit target, or use a non-button child inside the full-width button.
- [Risk] Vertical centering styles can alter row height if implemented with fixed heights. -> Mitigation: use flex alignment and inherit the existing table row height rather than forcing a larger height.

## Migration Plan

- Update editable cell shell/content styles to vertically center content.
- Move inline-edit click handling from value-only controls to the full editable content surface.
- Preserve existing icon trigger propagation handling for rich editors.
- Update tests to cover surface clicks and vertical-centering contracts.
- Validate in Storybook using the production pending bill story.
