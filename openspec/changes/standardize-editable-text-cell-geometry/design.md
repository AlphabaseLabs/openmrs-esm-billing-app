## Context

Current editable bill-item text cells are in a mixed layout with text, optional chevron, and active editor not separated into stable lanes. This causes horizontal shifts and trigger inconsistency when state changes.

We already established a portal/overlay model for editable popovers in the existing editable-cell refactor work, so this change should reuse that approach while defining consistent geometry only for the text-cell surface area.

## Goals / Non-Goals

**Goals:**

- Introduce a lane-based geometry for text editable cells with two predictable columns: content lane and affordance lane.
- Define a reusable structure that keeps chevron affordance stable while the value/editor swaps in place.
- Keep text and number semantics separate: this change focuses on text editable cells (for example bill item), while preserving previously defined numeric geometry behavior.
- Ensure geometry stays stable during hover, focus, and edit states.

**Non-Goals:**

- Changing line-item API contracts.
- Changing edit/commit validation logic.
- Redesigning Carbon table structure.
- Introducing Storybook-only implementations.

## Decisions

### Decision 1: Two-lane text-cell grid with fixed affordance width

Use a container layout with a fixed-width affordance lane and a flexible content lane.

- Layout: `grid-template-columns: 1fr minmax(2rem, 2rem)` (or equivalent fixed width tokenized variant)
- Content lane: left-aligned text/editor for text cells
- Affordance lane: chevron trigger or reserved placeholder when not visible

Alternative considered: inline-flex with spacing and opacity-hidden icon. Rejected because it does not enforce consistent reservation semantics under all render branches.

### Decision 2: Shared lane wrapper for display/edit states

Render both states using the same wrapper shape. The active editor must occupy the content lane, not replace the whole root cell layout.

Alternative considered: switching root wrappers per mode. Rejected because this increases drift and makes DOM assertions harder.

### Decision 3: Shared anchor/portal for text popover

The chevron-triggered popover should still mount through the production overlay path using a stable anchor root, so opening editor overlays does not rely on table-cell overflow behavior.

Alternative considered: inline popover render inside `td`. Rejected because it can push scroll and clip under constrained table containers.

## Risks / Trade-offs

- [Risk] Reserving an affordance lane in text-only rows may introduce extra horizontal whitespace. → Mitigation: this is intentional for predictability and reduces visual jitter.
- [Risk] Hit target for chevron can shrink on very short bill-item labels if content lane compresses too much. → Mitigation: enforce minimum cell width in header/column rules and ensure value overflow behavior is consistent with existing overflow policy.
- [Risk] Tests currently depending on previous DOM ordering may fail. → Mitigation: update tests to assert semantic roles/lane behavior and keep role and text outputs stable.
- [Risk] Reusing existing overlay path may expose z-index/position coupling with nearby containers. → Mitigation: keep overlay container anchored and confirm in production Storybook cases.

## Migration Plan

1. Apply lane classes/wrapper and popover wiring in the text editable cell implementation.
2. Update table CSS width/alignment for the editable text column only.
3. Update tests to verify lane order, stable geometry, and non-regressing editor behavior.
4. Run visual/behavior checks in production Storybook stories.
5. If any regression is detected, revert only text-lane styling first, then reapply with constrained min-width adjustments.

## Open Questions

- Should hidden chevron affordance be fully invisible (`visibility: hidden`) or visually present but disabled (`opacity: 0`) while retaining focus outlines?
