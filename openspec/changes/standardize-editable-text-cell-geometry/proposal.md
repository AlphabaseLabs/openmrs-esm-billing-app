## Why

The text editable bill-item cell still behaves differently from the production bill-item popover pattern: its chevron trigger and popover open behavior are visually unstable because display text, edit affordance, and active editor do not share a single lane contract. This causes alignment jitter and inconsistent click area behavior between rows and states.

This change standardizes text editable-cell geometry so text cells behave like the bill-item interaction pattern while preserving all existing commit and validation behavior.

## What Changes

- Define and apply a reusable text-cell geometry contract that standardizes display text, active editor, and chevron affordance lanes.
- Ensure the bill-item/text cell keeps a stable affordance lane on the right while value/content remains in a separate content lane.
- Ensure the chevron trigger appears and is hit-testable without changing overall cell width.
- Ensure active editors replace only the content lane in the same cell geometry.
- Keep changes in production components only; do not introduce Storybook-only editable-cell implementations.

## Capabilities

### New Capabilities

- `editable-text-cell-geometry`: Defines reusable lane-based geometry for editable text invoice cells, including reserveable chevron affordance lane, content alignment, and geometry-stable editor replacement behavior.

### Modified Capabilities

- None.

## Impact

- Affected production code:
  - `src/invoice/editable-line-item-cells/*` (as applicable)
  - `src/invoice/invoice-table.scss`
  - `src/invoice/invoice-table.component.tsx`
  - Relevant editable-cell tests
- Runtime behavior: no API, data model, or dependency changes.
- Storybook behavior: stories should continue to render real production invoice/bill cell components.
