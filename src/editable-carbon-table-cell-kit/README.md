# Editable Carbon Table Cell Kit

`@alphabase/editable-carbon-table-cell-kit` is a local package boundary for reusable editable Carbon table cell mechanics.

The package owns:

- editable cell geometry;
- hover, focus, and open affordance behavior;
- inline numeric editor overlay behavior;
- hidden sizing values that preserve Carbon table column widths;
- popover anchoring and table-overflow escape;
- keyboard and outside-click close behavior;
- reusable tests for geometry and interaction contracts.

The consuming app owns:

- invoice and line item models;
- service price option mapping;
- discount amount, percent, sponsor, comment, and reset behavior;
- bill item search and selection;
- API update payloads;
- invoice recalculation.

## Adapter pattern

Use package primitives inside app-specific adapters.

```tsx
import { EditableNumericCell } from '../editable-carbon-table-cell-kit';

function BillingQuantityCell({ lineItem, onCommit }) {
  return (
    <EditableNumericCell
      activeMode={mode}
      inputId={`quantity-${lineItem.uuid}`}
      inputLabelText="Quantity"
      inputMode="numeric"
      inputValue={draft}
      isActive={isActive}
      isEditable={isEditable}
      onInlineOpen={openInlineEditor}
      onInputChange={setDraft}
      onInputKeyDown={handleKeyDown}
      sizingValue={String(lineItem.quantity)}
      value={lineItem.quantity}
    />
  );
}
```

## Publishing plan

This change intentionally does not publish the package.

Publish privately only after a new consumer, such as Quantity, proves the local API shape.

Future private package setup:

```ini
@alphabase:registry=https://npm.pkg.github.com
```

Future package name:

```text
@alphabase/editable-carbon-table-cell-kit
```

Future consuming app setup:

```bash
yarn add @alphabase/editable-carbon-table-cell-kit
```
