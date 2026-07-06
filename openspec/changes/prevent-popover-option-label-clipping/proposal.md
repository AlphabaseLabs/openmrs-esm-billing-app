## Why

Popover option text is visibly clipped along the bottom edge, especially around glyph descenders and lower antialiasing. This reduces readability and makes the option menus look visually broken after the recent compact option-row styling.

## What Changes

- Ensure editable-cell popover option labels have enough vertical text rendering space so glyphs are not cropped.
- Apply the fix only to option text wrappers that use horizontal truncation/ellipsis in editable-cell popovers.
- Preserve existing option menu colors, widths, selection behavior, hover behavior, row order, and commit behavior.
- Do not redesign the popover, change option row colors, change menu width, or change editor behavior.

## Capabilities

### New Capabilities
- `popover-option-label-rendering`: Defines the minimum text-rendering requirement for editable-cell popover option labels so visible glyphs are not vertically clipped.

### Modified Capabilities

## Impact

- Affects only editable-cell popover option label styling where label text is horizontally constrained.
- No data model, API, calculation, selection behavior, payment, bill-item search, price option behavior, or discount behavior changes.
