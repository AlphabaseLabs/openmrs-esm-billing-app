## Context

The current discount cell has two editing surfaces: the inline table cell and a welded popover. The inline cell is the primary actual discount amount editor. The popover should not duplicate that amount editor; it should provide an alternate percent-based path for users who think in percentages, while keeping sponsor and comment metadata close to the discount.

The current implementation also risks showing raw floating point values when converting between amount and percent. The corrected design keeps a single source of truth: the discount amount stored on the line item. Percent is a derived/editing representation calculated from the line item price, not the quantity-adjusted subtotal.

## Goals / Non-Goals

**Goals:**
- Preserve inline editing of the actual discount amount in the table cell.
- Simplify the popover to one percent input, one sponsor selector, one comment textarea, and a bottom `Clear` action.
- Keep the table cell displaying the actual discount amount after percent edits.
- Convert between amount and percent using the line item price as the percentage base.
- Round displayed percent values so raw float tails are never visible.
- Use `%` as the discount cell's hover/open affordance instead of the generic chevron.
- Keep the welded popover visual language already used by the editable cell system.

**Non-Goals:**
- Do not change price editor behavior.
- Do not change bill-item editor behavior.
- Do not introduce Save/Cancel staging.
- Do not change the line item discount data model or billing API payload shape.

## Decisions

### Decision: keep amount as the stored/displayed value

The discount amount remains the source of truth in the table and in line item updates. Percent is derived from the amount and the line item price for display in the popover:

```text
priceBase = price
percent = priceBase > 0 ? discountAmount / priceBase * 100 : 0
```

When the popover percent changes, the implementation computes the new amount:

```text
discountAmount = roundCurrency(priceBase * percent / 100)
```

Quantity is not part of the percent conversion base. Alternative considered: use `quantity * price` as the base. That was rejected because the billing behavior applies the line item discount percentage to price, not subtotal.

### Decision: simplify the popover content

The popover will contain only:
- percent input
- discount sponsor selector
- comment textarea
- bottom `Clear` action

The amount input, heading, per-item readout, formula line, and top reset link are removed because they duplicate the table cell or add hierarchy not needed for the simplified flow.

Alternative considered: keep amount and percent fields side by side. That was rejected because it duplicates the inline amount editor and makes the popover heavier than the task requires.

### Decision: live apply with explicit clear

The current editor family uses live updates. This change preserves that behavior:
- editing the inline amount updates the line item discount amount immediately
- editing the popover percent updates the line item discount amount immediately
- closing the popover keeps the latest live value
- `Clear` resets the discount amount, percent, sponsor, and comment according to the existing discount clearing semantics

Alternative considered: stage changes in the popover and add Save/Cancel. That is out of scope and would make this editor inconsistent with the current live-edit behavior.

### Decision: discount affordance uses `%`

The discount cell affordance should communicate the alternate percent editor. On hover and open, the existing options affordance in the discount cell will render `%` instead of the shared chevron. The position and quiet visual treatment should remain aligned with the current editable cell affordance styling.

Alternative considered: keep the chevron for all editable cells. That hides the key distinction that this popover edits percent while the table cell edits amount.

## Risks / Trade-offs

- [Rounding can create minor amount/percent round-trip differences] → Use one explicit display precision for percent and whole-currency rounding for amount updates.
- [Price can be zero or missing] → Display percent as `0` and prevent divide-by-zero output.
- [Live apply means close is a commit] → Keep `Clear` as the explicit revert path for removing the discount, and do not introduce Save/Cancel in this change.
- [Sponsor/comment behavior depends on current line item discount metadata shape] → Reuse the existing discount update helper and metadata fields rather than adding a new model.
