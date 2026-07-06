## Context

The billing invoice line-item table now has multiple editable cells with shared interaction mechanics:

- Price uses numeric display, inline editing, and a price-option popover.
- Discount uses numeric display and a richer discount editor popover.
- Bill Item uses text/select display and a searchable selection popover.
- Quantity is planned next and needs the same editable-cell mechanics without duplicating the existing implementation.

The current implementation has already solved several table-specific issues:

- inline numeric editors must not change Carbon table column widths;
- active editors must stay within the current cell bounds;
- hidden in-flow sizing values are needed so absolute-positioned editors do not collapse the column contribution;
- popovers must render outside table layout flow so they do not create table scrolling;
- Storybook must render production adapters, not mock-only replacement UI.

The package boundary should capture these reusable mechanics while keeping invoice and billing behavior inside the billing app.

## Goals / Non-Goals

**Goals:**

- Create a local package boundary for `@alphabase/editable-carbon-table-cell-kit`.
- Extract reusable editable Carbon table cell primitives from the billing app.
- Preserve existing Price, Discount, and Bill Item production behavior.
- Replace local editable-cell mechanics with package imports plus app-specific adapters.
- Add conformance tests for geometry stability, popover overflow behavior, keyboard behavior, and adapter boundaries.
- Prepare the package for future private scoped publishing after the API is proven by a new consumer.

**Non-Goals:**

- Do not implement editable Quantity in this change.
- Do not publish the package to a private registry in this change.
- Do not redesign the Price, Discount, or Bill Item editor UI.
- Do not move billing API calls, invoice recalculation, line item models, or discount business rules into the package.
- Do not replace production Storybook stories with mock-only package demos.

## Decisions

### Decision: Package editable-cell mechanics, not billing behavior

The package will provide generic editable-cell mechanics:

- `EditableNumericCell`
- `EditableTextCell`
- `EditableCellPopover`
- `useEditableCellController`
- shared styles and conformance helpers

Billing-specific adapters will remain in the billing app:

- `BillingPriceCell`
- `BillingDiscountCell`
- `BillingBillItemCell`
- future `BillingQuantityCell`

Rationale: the reusable problem is Carbon table editing geometry and interaction. The billing problem is domain behavior and persistence. Mixing those would make the package hard to reuse across other OpenMRS apps.

Alternative considered: move the full existing billing cells into the package. This was rejected because it would leak invoice concepts into a generic table-cell package.

### Decision: Prove the package locally before publishing

The package will first live inside this repo as a local package boundary. Publishing to a private scoped registry is deferred until the API is validated by a new consumer, ideally Quantity.

Rationale: publishing too early freezes an API before we know whether it is ergonomic for the next editable cell.

Alternative considered: publish immediately as `@alphabase/editable-carbon-table-cell-kit`. This was rejected because the first priority is correctness and API shape, not distribution.

### Decision: Preserve table geometry using package-owned sizing behavior

The package will own the numeric-cell geometry contract:

- display value contributes to table sizing;
- active inline editor is removed from table sizing flow;
- hidden in-flow sizing value preserves the inactive width contribution;
- editor overlay is constrained to the active cell bounds.

Rationale: this was the root cause behind earlier column-width regressions. The behavior should be centralized so Price, Discount, and Quantity do not each solve it differently.

Alternative considered: let each adapter style its own editor width. This was rejected because it recreates the same bug class in every editable numeric cell.

### Decision: Popovers are anchored by the package but rendered with app content

The package will provide popover anchoring, overflow escape, z-index, and optional welded active-cell surface behavior. The app will provide the popover body.

Rationale: the geometry problem is reusable, but Price options, Discount editor fields, and Bill Item search results are app-specific.

Alternative considered: package specific Price/Discount/Bill Item popovers. This was rejected because it would couple the package to billing line-item rules.

### Decision: Production Storybook remains adapter-based

Package primitive stories may be added for reusable behavior, but billing production stories must continue to render the real billing adapters.

Rationale: previous Storybook issues came from stories that diverged from production behavior. Production stories are the visual safety net for this extraction.

Alternative considered: use simplified package-only stories as the main validation target. This was rejected because it would not prove the billing app still renders correctly.

## Risks / Trade-offs

- Package boundary becomes too generic too early -> Keep the first API based on existing Price, Discount, and Bill Item behavior, then validate with Quantity before publishing.
- Visual regressions during extraction -> Keep production Storybook stories and add geometry conformance tests before migrating each adapter.
- Billing logic accidentally leaks into the package -> Add import-boundary tests or static checks proving the package does not import billing app modules.
- Package styles conflict with app styles -> Export package styles explicitly and keep selectors scoped to package-owned class names.
- Local package setup adds repo complexity -> Defer registry publishing and keep the local package boundary minimal until the API is proven.

## Migration Plan

1. Create the local package source boundary for `@alphabase/editable-carbon-table-cell-kit`.
2. Move reusable editable-cell primitives and styles into the package.
3. Convert Price, Discount, and Bill Item cells into billing adapters around the package primitives.
4. Add conformance tests proving table geometry and popover behavior remain stable.
5. Keep production Storybook stories rendering real billing adapters.
6. Validate the migrated cells before implementing Quantity.
7. Use Quantity as the first new consumer to prove the package API.
8. Publish privately only after the local package API is stable.

Rollback strategy: keep adapter migration incremental. If a package primitive causes a regression, restore that adapter to the previous local implementation while keeping the package boundary for the remaining cells.

## Open Questions

- Should the local package live under `packages/editable-carbon-table-cell-kit` or a repo-specific internal source directory before publishing?
- Should conformance tests use Playwright against Storybook only, React Testing Library unit tests only, or both?
- Should the package expose only composed cells or also lower-level shell primitives for advanced app-specific cells?
