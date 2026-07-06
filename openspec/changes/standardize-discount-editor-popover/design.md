## Context

The current discount editor popover works functionally enough to edit a discount, but it exposes raw floating-point percent values, lacks the read-only calculation context shown in the target mockup, and uses heavier/default field styling than the bill-item and price editor surfaces. The editor also currently behaves as a live-apply control with Reset and no Save/Cancel, so this proposal keeps that model but makes the revert and close semantics explicit.

The change is intentionally narrow: only the discount editor popover and discount trigger cell are in scope. Bill-item and price editor behavior must remain unchanged.

## Goals / Non-Goals

**Goals:**
- Prevent raw floating-point values from appearing in amount or percent fields.
- Make amount and percent a linked two-field editor under one group label with inline unit suffixes.
- Add live per-item and total discount read-outs using `quantity x per-item discount`.
- Convert sponsor to a real pre-filled selector and comment to a compact textarea.
- Preserve the existing live-apply model while giving users an explicit Reset path to the last saved discount.
- Match the welded/quiet visual language used by the other editable-cell editors.

**Non-Goals:**
- Do not redesign or behaviorally change the bill-item editor.
- Do not redesign or behaviorally change the price editor.
- Do not add Save/Cancel buttons to the discount popover.
- Do not introduce a new API, persistence model, or external dependency.
- Do not change invoice-level discount semantics outside this row-level discount editor.

## Decisions

### Use amount as the source for per-item discount math

Amount represents the per-item discount. The subtotal is `quantity x selected price`, and total discount is `quantity x amount`. Percent is derived as `(amount / selected price) x 100`, not from the row total, because the mockup labels the emphasized value as "Discount per item" and the requested total line is `qty x per-item = total`.

Alternative considered: treat Amount as row-total discount. That would make the total line redundant and conflict with the requested per-item read-out, so it is rejected for this change.

### Round display values at the formatter boundary

Amount displays as whole currency and percent displays to exactly 2 decimal places. Internal calculations can use numbers, but every displayed value must pass through formatting before rendering. Very small percentages such as `10 / 249999 * 100` therefore render as `0.00`, never as a raw float tail.

Alternative considered: display percent to 3 decimals to preserve tiny values. The requested acceptance allows either 2 or 3, but 2 decimals keeps the editor aligned with common percentage display conventions and avoids adding another precision pattern to the table.

### Clamp out-of-range values

Amount input clamps to `0..subtotal` and percent input clamps to `0..100`. This keeps the editor live and avoids introducing a staged invalid state or additional validation messaging inside a compact popover.

Alternative considered: allow invalid values and show an invalid state. That creates more UI surface area and is less compatible with the live-apply behavior.

### Keep live-apply with explicit Reset

Edits continue applying live to the bill summary and row totals. Reset reverts amount, percent, sponsor, and comment to the last saved/opening discount state. Closing by click-away or Esc keeps the current live-applied values.

Alternative considered: stage edits until Save. That would be a larger behavioral change, require Save/Cancel controls, and contradict the requested no Save/Cancel direction.

### Reuse welded editor styling

The discount popover should use the same quiet field language as the other editors: light field surfaces, compact spacing, clear hierarchy, one seam between trigger and popover, and a subtle popover shadow only on the menu surface. The discount trigger should use the corrected trigger pattern: transparent/borderless input surface with a bare right-aligned chevron that flips when open.

Alternative considered: use Carbon default fields directly. That produces the current heavy grey blocks and inconsistent hierarchy, so it is rejected.

## Risks / Trade-offs

- [Risk] Two-decimal percent display can round tiny non-zero discounts to `0.00`. → Mitigation: amount remains the editable currency source of truth, and the total/per-item read-outs show the actual discount amount.
- [Risk] Live-apply can make summaries change while the popover is open. → Mitigation: Reset is defined as the revert path to the last saved/opening state, and close behavior is explicit.
- [Risk] Additional read-outs can make the compact popover too tall. → Mitigation: use caption/body/emphasized hierarchy within the table scale and keep the comment textarea to 2-3 rows.
- [Risk] Sponsor options may not already be modeled as a reusable selector. → Mitigation: use the existing selector affordance/style and local sponsor option data already available to the discount editor; do not add a new API.
