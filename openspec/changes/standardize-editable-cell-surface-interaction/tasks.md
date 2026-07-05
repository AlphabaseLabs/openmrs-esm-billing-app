## 1. Inspect current cell surface behavior

- [x] 1.1 Inspect current editable price, discount, bill-item, overlay, and shared stylesheet implementation before changing code.
- [x] 1.2 Confirm which elements currently own inline edit click handlers.
- [x] 1.3 Confirm current shell/content styles that affect vertical centering and row height.
- [x] 1.4 Confirm floating icon click handlers stop propagation before reaching inline edit surfaces.

## 2. Standardize vertical alignment surface

- [x] 2.1 Update editable cell shell/content styles so display values are vertically centered in row without forcing larger row height.
- [x] 2.2 Ensure active inline price and discount editors are vertically centered with display state.
- [x] 2.3 Ensure bill-item display content is vertically centered with numeric cells and other row content.
- [x] 2.4 Preserve out-of-flow icon positioning and no layout-space allocation.

## 3. Expand inline edit hit targets

- [x] 3.1 Move price inline-edit activation from text-only button hitbox to the full editable content surface.
- [x] 3.2 Move discount inline-edit activation from text-only button hitbox to the full editable content surface.
- [x] 3.3 Move bill-item inline action from text-only button hitbox to the full editable content surface, preserving existing behavior.
- [x] 3.4 Ensure disabled cells do not expose expanded inline edit hit targets.

## 4. Preserve rich editor icon isolation

- [x] 4.1 Ensure price floating icon opens only the rich price picker and not inline edit.
- [x] 4.2 Ensure discount floating icon opens only the rich discount form and not inline edit.
- [x] 4.3 Ensure bill-item floating icon opens only the rich bill-item picker and not the inline action.
- [x] 4.4 Preserve existing portal ownership for rich editor popovers.

## 5. Update tests

- [x] 5.1 Add price tests proving content-surface whitespace opens inline edit.
- [x] 5.2 Add discount tests proving content-surface whitespace opens inline edit.
- [x] 5.3 Add bill-item tests proving content-surface whitespace runs the same inline action as the visible value.
- [x] 5.4 Add tests proving floating icon clicks do not also trigger inline edit.
- [x] 5.5 Add or update class/DOM contract tests for vertical-centering surface behavior without overfitting visual pixels.
- [x] 5.6 Keep disabled-row tests proving no edit hit targets are exposed.

## 6. Validate production behavior

- [x] 6.1 Run focused editable line-item cell tests.
- [x] 6.2 Run TypeScript validation if component or test types changed.
- [x] 6.3 Inspect the pending bill production Storybook story at desktop width for vertical centering and full-surface click behavior.
- [x] 6.4 Inspect the pending bill production Storybook story at narrow width to confirm no row-height or column-width regression.
- [x] 6.5 Confirm no Storybook-only editable-cell implementation or invoice table redesign was introduced.
