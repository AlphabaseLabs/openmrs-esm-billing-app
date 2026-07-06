## 1. Identify Clipping Targets

- [x] 1.1 Identify editable-cell popover option label wrappers that combine one-line text with horizontal truncation.
- [x] 1.2 Confirm the clipping fix targets label text wrappers only, not popover containers, menu widths, row colors, or selection behavior.

## 2. Text Rendering Fix

- [x] 2.1 Add minimal line-height and/or vertical text breathing room so option label glyphs render fully without bottom clipping.
- [x] 2.2 Preserve one-line horizontal truncation/ellipsis for long option labels.
- [x] 2.3 Apply the fix to bill-item and price option labels where the clipping can occur.

## 3. Scope Protection

- [ ] 3.1 Verify option menu colors, widths, positioning, row order, and selected/hover states are unchanged.
- [ ] 3.2 Verify bill-item, price, discount, and payment behavior are unchanged.
- [ ] 3.3 Confirm visible option text is no longer cropped at the bottom.
