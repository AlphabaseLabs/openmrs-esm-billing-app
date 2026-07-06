## Context

The bill-item selector has been refined into a welded option surface with teal selected state, neutral highlighted state, readable row rhythm, and menu sizing that reads as an extension of the active cell. The price picker still uses the older generic popover option surface, which produces a blue selected row, blue check mark, wider detached panel, and excess empty menu area.

This change aligns the price picker visually with the bill-item option surface while keeping price selection behavior, selected price values, and line-item recalculation unchanged.

## Goals / Non-Goals

**Goals:**
- Use the same selected-state color language as the bill-item menu: light teal fill, teal left bar, and teal check.
- Use neutral grey for hover and keyboard-highlight states.
- Make price option rows fill the price menu width with the same readable rhythm as bill-item options.
- Size the price popover from the active price cell surface rather than a detached generic minimum width.
- Preserve label and amount alignment inside each price option.

**Non-Goals:**
- Do not change price option data, selected price semantics, or commit behavior.
- Do not change bill-item searchable select behavior or styling.
- Do not change discount editor behavior or styling.
- Do not change line-item calculation or payment behavior.
- Do not add a searchable price picker.

## Decisions

### Decision 1: Scope the visual alignment to price-specific classes

The implementation should use price-specific popover and option classes, or add narrowly scoped price classes if needed. Shared option classes may remain as defaults, but price-specific overrides must prevent regressions to bill-item, discount, or other editable-cell surfaces.

Rationale: The generic `selectedOption` and `optionCheck` styles are still blue and may be used by multiple menus. Price needs to align with bill-item without forcing unrelated menus into the same visual contract.

Alternative considered: Change the generic option styles to teal globally. This is rejected because it can unintentionally alter other option menus.

### Decision 2: Match the bill-item selected and highlighted state model

The selected price option should use light teal fill, 2px teal left bar, and teal check mark. Hover and keyboard highlight should use neutral grey, with selected-plus-highlighted staying selected without adding a second accent color.

Rationale: The price picker and bill-item picker are both single-select inline editors. They should share one visual language for selected and navigated states.

### Decision 3: Make the price option menu feel anchored to the price cell

The price popover should avoid the old detached 18rem-style width and excess empty surface. The menu width should be driven by the active price cell overlay surface, with only the minimum width needed to keep price label and amount readable.

Rationale: The current menu looks like a separate panel. The desired read is a compact options extension from the active price cell.

### Decision 4: Preserve price option information architecture

Price options may continue to show a label and amount. The amount should remain right-aligned in its own lane, and the check should remain on the far right. The visual alignment should not collapse option content into a single ambiguous string if the current two-lane structure is clearer.

Rationale: Matching the bill-item surface does not require removing price-specific content structure.

## Risks / Trade-offs

- A price-cell-sized menu could become too narrow for long labels or amounts -> Use a controlled minimum width only as large as needed for readable label, amount, and check lanes.
- Teal price selected styling could leak into other menus -> Scope selectors through price popover or price option classes.
- Row height changes could affect popover positioning -> Keep row rhythm compact but readable and avoid changing overlay positioning behavior.
- Matching bill-item colors could obscure disabled or unavailable price options if those appear later -> Keep this change limited to current selectable price option states.
