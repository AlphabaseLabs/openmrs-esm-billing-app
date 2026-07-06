## 1. Price Popover Scope

- [x] 1.1 Identify the price picker popover, price option row, price selected state, price highlighted state, amount lane, and check mark classes.
- [x] 1.2 Add or use price-specific class hooks so visual changes do not alter bill-item selector, discount editor, or unrelated option menus.

## 2. Price Option State Colors

- [x] 2.1 Replace price selected option blue/lavender styling with light teal fill, 2px teal left bar, and teal check mark.
- [x] 2.2 Ensure price hover and keyboard-highlighted options use neutral grey styling only.
- [x] 2.3 Define selected-plus-highlighted price state so selection remains clear without introducing blue or a second accent color.

## 3. Price Menu Width and Row Rhythm

- [x] 3.1 Remove detached generic price popover width behavior and size the menu from the active price cell surface with only a controlled readable minimum.
- [x] 3.2 Ensure each price option row fills the price menu width.
- [x] 3.3 Match price option row height and padding rhythm to the bill-item option surface.
- [x] 3.4 Preserve readable label, amount, and check mark lanes inside each price option.

## 4. Behavior and Scope Protection

- [ ] 4.1 Verify selecting a price option still commits the same selected price value and recalculates the line item as before.
- [ ] 4.2 Verify bill-item searchable select visuals and behavior are unchanged.
- [ ] 4.3 Verify discount editor visuals and behavior are unchanged.
- [ ] 4.4 Verify the price popover no longer shows blue selected state or the old wide detached empty panel.
