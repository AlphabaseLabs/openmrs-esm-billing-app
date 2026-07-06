## Context

The discount editable cell already has an `optionsButton` trigger that opens the discount editor and renders a `%` glyph through the discount percent affordance element. Other editable-cell triggers now read as intentional affordances because the chevron sits inside a fixed-size rounded control. The discount `%` trigger should gain the same deliberate geometry without introducing another filled surface.

The implementation should be a scoped styling change only. It should target the discount editable cell's percent affordance and avoid changing shared `optionsButton` styling globally, because the shared class is also used by bill-item and price editable-cell triggers.

## Goals / Non-Goals

**Goals:**

- Render the discount `%` trigger as a fixed-size box matching the existing chevron affordance size and radius.
- Keep the discount `%` box background transparent.
- Add a light grey border so the `%` affordance reads as a control.
- Center the `%` glyph optically inside the box.
- Preserve the current discount trigger visibility, hover, focus, and open behavior.

**Non-Goals:**

- Do not change the discount editor popover layout or behavior.
- Do not change discount calculations, auto-commit behavior, or payment totals.
- Do not change bill-item, price, or action-column affordances.
- Do not change shared affordance geometry globally unless the selector is scoped to the discount cell.

## Decisions

1. Scope the change to the discount cell.

   Use selectors rooted at the discount editable cell or the discount percent affordance class. This prevents the transparent background requirement from leaking into chevron affordances that intentionally use an elevated white surface.

2. Treat the `%` glyph container as the visible box.

   The existing trigger button can keep handling click, focus, open state, and hover visibility. The visible `%` affordance should provide the fixed-size transparent bordered box, matching the chevron affordance's dimensions and radius.

3. Keep behavior unchanged.

   The change is visual only. The same button opens the same discount editor and preserves existing keyboard and pointer behavior.

## Risks / Trade-offs

- Shared selector leakage could regress chevron affordances -> Mitigate by scoping all new rules to the discount editable cell or percent affordance class.
- A transparent box can be too subtle against row backgrounds -> Mitigate with a light grey border and centered glyph while avoiding a white fill.
- Changing button layout could disturb numeric alignment -> Mitigate by preserving existing trigger positioning and only styling the visible affordance box.
