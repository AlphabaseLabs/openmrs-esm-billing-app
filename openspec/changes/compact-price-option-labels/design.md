## Context

The editable price cell opens a production price-option popover from `EditablePriceCell`. The current row structure renders the option name and amount as separate spans and uses a multi-lane grid, so short labels such as `Cash`, `Card`, or `Default` are visually detached from their amounts.

This change is intentionally presentation-only. Price selection, auto-commit, recalculation, selected-state semantics, and the welded popover behavior remain unchanged.

## Goals / Non-Goals

**Goals:**

- Present each price option as compact text: `Name - (Amount)`.
- Remove the large interior gap between option name and amount.
- Keep the selected check indicator visually trailing and separate from the compact option text.
- Preserve existing production component behavior and focused Storybook coverage.

**Non-Goals:**

- Do not redesign the price popover shell.
- Do not change bill item search/dropdown option rendering.
- Do not change discount popovers.
- Do not change price update calculations, bill totals, or backend payload shape.
- Do not add a mock Storybook-only component.

## Decisions

### Combine option name and amount into one rendered label

The price option row should render the user-facing option text as a single phrase, for example `Cash - (15,000)`. This avoids the current grid behavior where the name occupies a flexible lane and the amount is forced to the far edge.

Alternative considered: keep separate name and amount spans and reduce the grid gap. This is weaker because the row still has two semantic visual units and can regress when popover width changes.

### Keep selected check as the only trailing lane

The selected check remains separate so selected-state affordance stays predictable and does not become part of the option text. The resulting geometry is compact label first, optional check second.

Alternative considered: include the check immediately after the text. This makes selected and unselected rows vary in text flow and can make scanning less predictable.

### Preserve existing behavior and scope

The implementation should touch only the price-option label presentation and related tests/stories. It should not change how a price option is selected, committed, or recalculated.

Alternative considered: fold this into a broader popover redesign. That would increase regression risk and obscure the small root cause.

## Risks / Trade-offs

- Long option names plus amounts may exceed the available popover width -> use the existing single-line truncation behavior on the combined label.
- Tests that currently query separate label and amount nodes may need focused updates -> update expectations to assert the combined visible text.
- If multiple active OpenSpec changes touch the same price popover styles, patch conflicts are possible -> keep this change limited to the price option row text and row grid.
