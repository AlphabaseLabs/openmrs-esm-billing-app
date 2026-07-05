## Context

The billing app line-item table now uses production editable cells for Bill item, Price, and Discount. Previous work established borderless inline numeric editing, floating edit affordances, and portal-based overlays that escape table overflow. The remaining gap is interaction and visual geometry: the popovers still look like detached cards instead of cell-attached editors, and Discount still needs a clear no-button auto-commit model.

This change standardizes the editor pattern around the table cell as the geometric source of truth. The active cell owns the visual state, the popover is positioned against the cell rectangle, and each editor has a precise commit model.

## Goals / Non-Goals

**Goals:**

- Make Bill item, Price, and Discount popovers appear welded to the active cell with zero visual gap.
- Keep popovers portaled out of the table so they do not introduce table scrollbars or clipping.
- Use the active table cell as the anchor for positioning, not the floating edit icon.
- Remove Save and Cancel actions from these popovers.
- Commit Bill item and Price list selections immediately.
- Auto-commit valid Discount form edits while preserving invalid drafts locally until corrected or dismissed.
- Provide an inline Discount reset action that commits a zero discount without closing the popover.
- Preserve direct borderless inline editing for numeric values.
- Preserve locked-row behavior with no edit affordance.

**Non-Goals:**

- Replacing the DataTable structure or changing the broader invoice layout.
- Introducing Storybook-only mock implementations of these editors.
- Changing backend billing API contracts.
- Redesigning row-level action icons outside the editable cells.
- Adding Save or Cancel buttons to the new popovers.

## Decisions

1. Anchor popovers to the active cell rectangle.

   The editor should feel like a cell extension, so positioning SHALL use the active cell bounds rather than the icon bounds. Bill item uses bottom-start alignment. Price and Discount use bottom-end alignment. The popover uses zero offset and a border that visually continues from the active cell.

   Alternative considered: anchor to the icon. This keeps implementation simpler but produces detached geometry and unstable alignment because the icon floats over content and is intentionally not part of the cell layout.

2. Keep portal-based rendering for every popover.

   The popover content remains outside the table DOM overflow chain while measuring and tracking the cell anchor. This preserves the earlier overflow fix: opening an editor must not make the table scroll horizontally or vertically.

   Alternative considered: render popovers inside table cells. This reintroduces clipping, row-height pressure, and scrollbars.

3. Treat the active cell as a highlighted editor surface.

   When a popover is open, the cell receives a subtle active fill and border. The popover aligns to the cell edge so the active state and popover read as one surface. The popover uses a thin border and minimal shadow, not a heavy floating-card treatment.

4. Use editor-specific commit models.

   Bill item and Price are list editors and commit immediately on option selection. Discount is a form editor and commits each valid field change. Inline numeric value edits commit on Enter or blur, cancel on Escape, and keep invalid drafts local without writing.

   Alternative considered: one uniform Save/Cancel model for all popovers. This conflicts with the requested workflow and makes simple list selection slower than production table editing needs.

5. Preserve manual price overrides when Bill item changes.

   Changing the Bill item refreshes price tier options. The Price resets to the new item default only when the existing price was derived from the previous item default or selected tier. If the user manually typed a custom price, that manual override is preserved unless the implementation can determine that preserving it would create invalid billing data.

   This avoids silently destroying explicit user input while still keeping default-tier behavior intuitive.

6. Discount reset is inline and immediate.

   The Discount popover includes an inline reset control. Activating it sets amount and percent to zero, clears discount-specific sponsor/comment metadata when applicable, commits immediately, recomputes totals, and keeps the popover open.

7. Runtime side effects stay production-scoped.

   Stories may provide fixtures and runtime mocks required to render production components, but editor logic must live in production components and shared utilities, not Storybook-only mock components.

## Risks / Trade-offs

- Auto-commit could issue too many writes if wired directly to an API call on every keystroke. Mitigation: commit valid local state immediately for UI recompute while using the existing update path's batching/debouncing if needed.
- Preserving custom prices after Bill item changes can create edge cases if a price is invalid for the new item. Mitigation: preserve custom prices only when they remain valid under current billing rules; otherwise fall back to the new item default.
- Portal positioning can drift if the page scrolls or resizes. Mitigation: reuse the existing overlay positioning path and ensure scroll/resize/reflow updates are wired for the active cell anchor.
- Removing Save/Cancel means Discount edits are harder to abandon after valid input. Mitigation: provide inline reset and keep Escape semantics for borderless inline numeric editing.
