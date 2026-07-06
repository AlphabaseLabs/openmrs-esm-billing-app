## 1. Scope and Current Surface Audit

- [x] 1.1 Identify the bill-item searchable select component classes used for display text, active input, chevron control, menu container, option rows, selected option, and highlighted option.
- [x] 1.2 Confirm the implementation target is the bill-item searchable select only and record any shared selectors that must not affect price picker or discount editor styles.

## 2. Active Field and Chevron Refinement

- [x] 2.1 Update the bill-item active input surface so it is transparent, borderless, box-shadow-free, and inherits table-cell typography and color.
- [x] 2.2 Preserve caret and accessibility focus behavior without rendering a colored field block or boxed focus rectangle.
- [x] 2.3 Restore the elevated white chevron affordance for the bill-item select while keeping it hidden in the closed idle state.
- [x] 2.4 Ensure the chevron points down when closed and rotates up when the bill-item menu is open.

## 3. Option Menu Visual States

- [x] 3.1 Replace blue/lavender selected option styling with light teal fill, 2px teal left bar, and teal check mark.
- [x] 3.2 Ensure hover and keyboard-highlighted options use neutral grey styling only.
- [x] 3.3 Define the combined selected-plus-highlighted state so selection remains clear without introducing a second accent color.

## 4. Geometry, Seam, and Lift

- [x] 4.1 Align display text, active input text, and option-row text to the same horizontal x-position.
- [x] 4.2 Remove doubled field/menu borders so the open field and menu meet with one visible seam.
- [x] 4.3 Add a subtle menu-only shadow that lifts the menu over underlying cards without making it read as a detached card.
- [x] 4.4 Keep option rows at readable height and rhythm after visual styling changes.

## 5. Scope Protection

- [ ] 5.1 Verify price picker visuals and behavior are unchanged by the bill-item styling changes.
- [ ] 5.2 Verify discount editor visuals and behavior are unchanged by the bill-item styling changes.
- [x] 5.3 Keep all changes limited to existing bill-item visual class wiring and SCSS unless a small state/class hook is required for open-state styling.

## 6. Acceptance Review

- [ ] 6.1 Confirm closed idle bill-item cells hide the chevron, while hover/focus/open states show the elevated white chevron affordance.
- [ ] 6.2 Confirm selected option uses teal fill, teal left bar, and teal check while highlighted options remain neutral grey.
- [ ] 6.3 Confirm opening and closing the bill-item editor causes no horizontal text shift.
- [ ] 6.4 Confirm the field/menu seam is a single line and the menu has subtle lift over the Payments card.
