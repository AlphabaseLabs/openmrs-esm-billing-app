## Context

Editable line-item cells currently expose cell-level editing through a pencil icon. The interaction is now closer to opening an anchored picker/editor than directly editing a freeform field, especially for bill item and price options. The visual affordance should communicate "open choices/editor" rather than "edit document".

This change is independent from the reverted rule that hid all editable-cell icons while an editor was open. The current visibility behavior should remain intact unless a later change explicitly modifies it.

## Goals / Non-Goals

**Goals:**
- Replace cell-level pencil edit icons with chevron affordances.
- Apply the replacement consistently to bill item, price, and discount editable cells.
- Present the chevron affordance as a borderless elevated chip whose edge is created by shadow rather than a hard border.
- Preserve the existing affordance container, floating position, hover/focus/open visibility, and active-cell styling.
- Keep the active chevron visible whenever current behavior would have kept the active pencil visible.

**Non-Goals:**
- Do not hide all editable-cell affordances while any editor is open.
- Do not alter popover content, positioning, sizing, or commit behavior.
- Do not change table column widths, value alignment, or cell padding.
- Do not change row-level Action column icons.
- Do not introduce a new icon dependency unless the existing icon set lacks an appropriate chevron.

## Decisions

### Use a chevron-down affordance for cell editor triggers

Use an existing Carbon/OpenMRS-compatible chevron-down icon for editable-cell trigger buttons. This matches the picker/editor behavior and the mockup direction.

Alternative considered: keep pencil icons for price/discount and use chevron only for bill item. That would keep the table visually inconsistent and continue implying different interaction models for cells that all open anchored editors.

### Preserve existing trigger geometry

The icon replacement must reuse the existing affordance button/container classes. The icon graphic changes, but the trigger dimensions, background, hit target, and floating placement remain stable.

Alternative considered: redesign the trigger as a larger dropdown pill. That would risk changing table layout and column width work that has already been stabilized.

### Use elevation instead of a hard border

The chevron trigger should use a white chip with no border, a slight radius, and a soft two-layer shadow. The shadow defines the visible edge and creates the elevated appearance shown in the reference image.

Alternative considered: retain the existing gray border and only increase shadow. That keeps the current hard outlined look and does not match the desired elevated chip direction.

### Preserve current visibility behavior

When no editor is open, hover/focus behavior remains as-is. When an editor is open, the active cell chevron remains visible if current open-state classes make it visible. This change does not implement the reverted "hide all icons while editor is open" behavior.

Alternative considered: reintroduce icon suppression while open. The user explicitly said the previous hide-all-icons change was reverted and should be forgotten for this change.

## Risks / Trade-offs

- Chevron may imply a dropdown rather than arbitrary editing → acceptable because current editors are popover/picker driven.
- Discount editing may still feel form-like → mitigate by keeping the same editor behavior and only changing the trigger glyph.
- Tests may query for pencil-specific icons or labels → mitigate by updating focused tests to assert chevron affordance semantics instead of pencil implementation details.
