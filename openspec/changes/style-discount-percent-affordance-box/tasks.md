## Implementation

- [x] 1. Locate the discount editable-cell percent affordance styling surface.
  - Confirm the `%` trigger is styled through the existing discount cell button and percent affordance class.
  - Keep the implementation scoped to the discount editable cell or percent affordance class.

- [x] 2. Style the discount `%` affordance box.
  - Match the existing chevron affordance size and border radius.
  - Use a transparent background.
  - Add a light grey border.
  - Center the `%` glyph within the box.

- [x] 3. Preserve existing behavior and scope.
  - Keep current discount editor open, hover, focus, and open-state behavior unchanged.
  - Do not change discount calculations, payment totals, bill-item affordances, price affordances, or action affordances.
