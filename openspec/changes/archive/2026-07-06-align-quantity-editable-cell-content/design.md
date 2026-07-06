## Context

Quantity became editable after Price and Discount already had stable editable numeric geometry. The current Quantity implementation introduced a dedicated centered layout, which makes the Quantity cell visually inconsistent with the other editable numeric cells in the same Carbon table.

The existing editable carbon table cell kit is the right abstraction boundary. Quantity should not create a parallel alignment model; it should reuse the kit's numeric cell geometry and only keep Quantity-specific behavior where it differs functionally, such as inline-only editing and positive whole-number validation.

## Goals / Non-Goals

**Goals:**

- Make Quantity display text align to the same left content edge as Price and Discount editable numeric cells.
- Make the Quantity hover affordance align consistently with the shared editable numeric cell geometry.
- Make the Quantity inline input text align to the same left content edge as its display text.
- Preserve table column width before, during, and after editing Quantity.
- Keep Quantity inline-only with no popover.

**Non-Goals:**

- Do not change Quantity validation or commit semantics.
- Do not change Price, Discount, or Bill Item behavior.
- Do not redesign the invoice table, column definitions, or Carbon table structure.
- Do not introduce a new editable-cell component or new dependency.

## Decisions

1. Use shared numeric alignment instead of a Quantity-specific centered layout.

   Rationale: Price, Discount, and Quantity are all numeric editable cells in the same table. Maintaining separate horizontal alignment for Quantity makes the table look inconsistent and creates another styling path that must be preserved in future kit changes.

   Alternative considered: keep Quantity centered because the table header is visually centered. Rejected because the requested standard is alignment with existing editable numeric content, not header text.

2. Keep Quantity-specific behavior limited to editing semantics.

   Rationale: Quantity differs from Price/Discount in behavior because it edits inline only and accepts positive whole numbers. It does not need a unique horizontal geometry.

   Alternative considered: add a Quantity-specific prop to the kit for alignment. Rejected because this change is a visual correction, not a new reusable variation.

3. Preserve table layout by avoiding width-affecting changes.

   Rationale: Editable cells have previously caused column width drift when active-state DOM or sizing changed intrinsic table width. This change must only alter alignment rules and must not introduce fixed widths, wider active surfaces, or additional in-flow content.

## Risks / Trade-offs

- Quantity may have existing tests that assert centered behavior -> Update them to assert shared editable numeric alignment instead.
- Removing centered overrides may expose unintended inherited kit styles -> Verify against Price and Discount geometry in Storybook or focused DOM checks.
- Alignment-only changes can be visually subtle -> Include an explicit regression check that column widths remain stable before and during Quantity edit mode.
