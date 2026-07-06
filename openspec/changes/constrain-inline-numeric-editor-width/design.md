## Context

Invoice line-item numeric cells render a compact display state until clicked. When clicked, price and discount cells replace that display state with an inline Carbon `TextInput` editor. Carbon input wrappers can introduce intrinsic width and minimum width that differ from the display value, so the browser's table auto-layout can recalculate column widths after the click.

This change implements option 1 from the diagnosis: keep the inline editor in the same cell shell, but constrain every wrapper in the editor subtree so the active state fits inside the existing cell width.

## Goals / Non-Goals

**Goals:**
- Prevent price and discount column width changes when inline numeric editing starts.
- Keep the inline editor inside the existing cell geometry.
- Constrain our editor shell and Carbon `TextInput` wrappers to `width: 100%`, `max-width: 100%`, and `min-width: 0`.
- Preserve right alignment for numeric display values and active numeric input text.
- Preserve current inline editing behavior, validation, commit timing, and keyboard handling.

**Non-Goals:**
- Do not move inline numeric editors into a portal or overlay.
- Do not alter rich popover editors for price options or discount form.
- Do not change column definitions, table layout mode, row action icons, or chevron affordances.
- Do not redesign editable-cell spacing, backgrounds, or active-state styling.

## Decisions

### Constrain the inline editor subtree, not the table

The fix should target the active editor subtree because the table layout changes only when the inline `TextInput` appears. The table should not need fixed column widths or a global `table-layout: fixed` change.

Alternative considered: force fixed table layout. That would be broader, riskier, and could alter existing production column distribution.

### Keep display and edit states inside the same full-width shell

The active inline editor should occupy the same `editableCellContent` lane as the display button. The editor shell must be `box-sizing: border-box`, `min-width: 0`, `max-width: 100%`, and `width: 100%`.

Alternative considered: render the editor as a portal/overlay. That would remove it from table layout, but it is a different interaction architecture and is not required for this focused fix.

### Override Carbon wrapper intrinsic width locally

The local editable-cell stylesheet must constrain Carbon text input wrapper classes only under the inline numeric editor class. This keeps the fix scoped and avoids global Carbon input side effects.

The intended local contract is:

```scss
.inlineNumericEditor,
.inlineNumericEditor :global(.cds--text-input-wrapper),
.inlineNumericEditor :global(.cds--text-input__field-wrapper),
.inlineNumericEditor :global(.cds--text-input) {
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
  width: 100%;
}
```

The input text remains right-aligned:

```scss
.inlineNumericEditor :global(.cds--text-input) {
  text-align: right;
}
```

## Risks / Trade-offs

- Carbon class names may differ by version → mitigate by scoping selectors to the classes currently emitted by the installed Carbon `TextInput`.
- Very narrow cells may compress the input → acceptable because the editor must not expand the table; validation text can use existing Carbon behavior.
- Other inline editors could later introduce similar layout shifts → mitigate by keeping this contract reusable inside editable-cell styles.
