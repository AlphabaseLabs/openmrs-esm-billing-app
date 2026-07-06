## Context

The invoice line-item table now has a reusable editable Carbon table cell kit for the existing editable Bill Item, Price, and Discount cells. Quantity remains static even though it directly affects each line item's subtotal, tax, discount, and invoice totals.

The current implementation must preserve the production Carbon table layout. Previous editable-cell work established that editor affordances and inline editors must not allocate extra table column width or cause table scroll. Quantity is the next adapter use case for the extracted kit and should validate that the package can be reused without duplicating cell mechanics.

## Goals / Non-Goals

**Goals:**
- Add inline editing for the Quantity column using `EditableNumericCell`.
- Keep Quantity-specific validation and billing update logic in the billing app adapter.
- Accept only positive whole-number quantities.
- Commit valid quantity changes through the same line-item update and recalculation path used by existing editable cells.
- Preserve current Quantity column placement and table geometry before, during, and after editing.
- Add tests and Storybook coverage proving Quantity editing works without changing Price, Discount, Tax, Total, or Action column positions.

**Non-Goals:**
- Do not add a Quantity popover.
- Do not publish or change the reusable package's registry setup.
- Do not change Price, Discount, or Bill Item behavior except where shared adapter wiring is necessary.
- Do not redesign the invoice table or alter Carbon table structure.
- Do not allow decimal, zero, negative, or empty Quantity commits.

## Decisions

### Use the shared numeric cell kit instead of a new custom component

Quantity SHALL be implemented as a billing adapter around `EditableNumericCell`.

Rationale: The extracted kit owns the table-safe editable-cell mechanics: active surface, hidden sizing value, inline editor geometry, hover/focus affordance, keyboard handling, and disabled state. Reusing it prevents another divergent editable-cell implementation.

Alternative considered: implement Quantity directly in the table cell with a local `TextInput`. This would duplicate the same geometry problems already solved for Price and Discount.

### Keep billing logic in an `EditableQuantityCell` adapter

The adapter SHALL own parsing, validation, commit payload creation, and invoice recalculation.

Rationale: The package must remain billing-agnostic. It should not know `LineItem`, invoice totals, update payloads, or payment status rules.

### Use inline-only editing

Quantity SHALL use inline editor mode only and SHALL NOT pass popover configuration to `EditableNumericCell`.

Rationale: Quantity has no option list or secondary metadata. A popover would add unnecessary interaction complexity.

### Validate positive integers only

Quantity SHALL commit only positive whole numbers. Empty, zero, negative, decimal, and non-numeric input SHALL not be committed.

Rationale: Quantity represents a billable item count. Invalid values must not corrupt invoice totals or create ambiguous billing state.

Recommended behavior:
- `Enter` commits if valid.
- `Blur` commits if valid.
- `Escape` cancels and restores the prior value.
- Invalid blur restores the prior value and does not call the billing commit handler.

### Preserve existing table geometry

Quantity editing SHALL not resize or shift the table columns.

Rationale: The Quantity column sits between Status and Price. If its active editor changes intrinsic table width, downstream monetary columns move and the invoice becomes visually unstable.

Implementation direction:
- Keep the active editor constrained by the Quantity cell's existing available width.
- Reuse the kit's hidden sizing value and inline editor overlay mechanics.
- Do not add persistent icon lanes or extra inline elements that participate in table layout.

## Risks / Trade-offs

- [Risk] Quantity values can affect existing discounts/taxes in ways that existing helpers may already define differently than expected. -> Mitigation: reuse existing line-item recalculation helpers and add adapter tests around resulting totals.
- [Risk] Centered Quantity display may not match the default right-aligned numeric kit style. -> Mitigation: use a Quantity-specific alignment/class option while still using the shared numeric mechanics.
- [Risk] Invalid input behavior can feel silent if the value simply reverts. -> Mitigation: keep behavior consistent with current inline cells and cover invalid cases in tests.
- [Risk] Editable Quantity might be allowed for rows that should remain read-only. -> Mitigation: reuse the same row editability predicate used by Price, Discount, and Bill Item adapters.

## Migration Plan

- Add `EditableQuantityCell` as a billing adapter.
- Replace the static Quantity table cell rendering with the adapter for editable rows.
- Preserve static rendering for non-editable rows.
- Add focused tests for valid commit, invalid rejection, cancel, disabled rows, recalculation payloads, and geometry stability.
- Validate production Storybook BillDetails and InvoiceTable stories after the adapter is wired.

Rollback strategy: revert the Quantity table cell to static rendering while leaving the reusable editable-cell kit unchanged.

## Open Questions

- None. The initial implementation will use positive whole-number quantities only, inline-only editing, and no popover.
