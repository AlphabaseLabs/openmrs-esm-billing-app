## Context

Editable-cell popover option labels use constrained text wrappers to support horizontal truncation. Those wrappers can clip vertically when row rhythm is compact, causing the bottom of visible glyphs to be cropped. The issue is visible in option rows where text descenders or lower antialiasing intersect the wrapper's clipped box.

## Goals / Non-Goals

**Goals:**
- Ensure popover option label text renders fully from top to bottom.
- Preserve horizontal truncation/ellipsis for long labels.
- Keep current option row colors, widths, order, selection behavior, and editor behavior unchanged.

**Non-Goals:**
- Do not redesign option menus.
- Do not change selected, hover, or focus colors.
- Do not change menu width, row order, row count, or popover positioning.
- Do not change bill-item, price, discount, or payment behavior.

## Decisions

### Decision 1: Fix the text-rendering box, not the whole popover

The implementation should adjust only option label text wrappers that can clip visible glyphs. The fix should provide enough line-height and/or vertical text breathing room for normal rendered text while preserving horizontal overflow behavior.

Rationale: The visual defect is caused by the label text box clipping glyph pixels. Increasing full popover dimensions or changing menu design would be broader than necessary.

### Decision 2: Preserve horizontal truncation

Labels that need ellipsis must still truncate horizontally. The implementation must avoid replacing the constrained label wrapper with unconstrained wrapping text.

Rationale: Option menus still need stable row height and table-editor compactness.

## Risks / Trade-offs

- Too much line-height or padding could alter row rhythm -> Keep the adjustment minimal and scoped to label text rendering.
- Removing overflow handling could break ellipsis -> Preserve horizontal truncation semantics.
- Applying the fix too broadly could affect unrelated text -> Scope the change to editable-cell popover option label classes.
