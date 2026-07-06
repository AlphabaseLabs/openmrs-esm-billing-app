## Why

Price, discount, and bill-item editing now share the same editable Carbon table cell mechanics: stable column geometry, hover/open affordances, inline editor sizing, popover anchoring, and production Storybook behavior. Quantity will need the same mechanics next, and copying the current implementation would duplicate the same geometry and overlay risks across another cell.

This change extracts the proven editable-cell mechanics into a reusable, spec-backed package boundary before Quantity is implemented, so the app can reuse one standard cell system instead of replicating local variants.

## What Changes

- Introduce a reusable package boundary for `@alphabase/editable-carbon-table-cell-kit`.
- Extract generic editable Carbon table cell mechanics into package-owned primitives:
  - numeric editable cells
  - text/select editable cells
  - hover/focus/open affordance behavior
  - inline editor overlay sizing
  - hidden sizing value behavior for column-width stability
  - popover anchoring and overflow escape
  - welded active-cell and popover visual surface behavior
- Convert billing Price, Discount, and Bill Item cells into app-specific adapters around the package primitives.
- Keep billing-specific behavior in the billing app:
  - invoice line item data shape
  - service price option mapping
  - discount amount/percent/sponsor/comment rules
  - bill item search and selection
  - API mutations and invoice recalculation
- Add reusable conformance tests for editable Carbon table cell geometry and interaction behavior.
- Preserve existing production Storybook stories so they render real billing adapters, not mock-only replacement components.
- Defer Quantity editing until after the package boundary is proven.
- Defer private registry publishing until the local package API is validated by at least one new consumer.

## Capabilities

### New Capabilities
- `editable-carbon-table-cell-kit`: Reusable editable Carbon table cell package behavior, including geometry stability, inline editors, popover anchoring, affordances, billing adapter boundaries, Storybook expectations, and conformance testing.

### Modified Capabilities
- None.

## Impact

- Affected code:
  - editable line-item cell components
  - billing Price, Discount, and Bill Item cell adapters
  - editable-cell SCSS
  - Storybook billing stories and package primitive stories
  - unit and geometry/conformance tests
- New package boundary:
  - `@alphabase/editable-carbon-table-cell-kit`
- Runtime dependencies:
  - React and React DOM remain peer dependencies.
  - Carbon React and Carbon icons remain peer dependencies.
- Behavioral constraints:
  - Existing billing UI behavior must remain visually unchanged.
  - Opening inline editors or popovers must not change Carbon table column widths or table scroll dimensions.
  - Package code must not import billing app modules or billing business logic.
