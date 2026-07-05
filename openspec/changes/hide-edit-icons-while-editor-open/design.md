## Context

Editable line-item cells use local visual rules to show edit icons on hover, focus-within, and active/open state. When a price, discount, or bill-item popover opens, those same rules keep edit icons visible even though the user is already editing.

The current model treats each cell independently. The required behavior needs one shared priority rule: if any editable-cell editor is open, edit affordances are suppressed for all editable cells.

## Goals / Non-Goals

**Goals:**
- Hide every editable-cell edit icon whenever any editable-cell editor popover is open.
- Make this suppression override hover, focus-within, and per-cell open icon classes.
- Preserve normal hover/focus affordance behavior when no editor is open.
- Keep the existing popover position, table layout, row action icons, and edit interactions unchanged.

**Non-Goals:**
- Do not redesign editor popovers.
- Do not change table column widths or cell alignment.
- Do not change the row-level action icons in the Action column.
- Do not change commit, reset, or validation behavior inside editors.

## Decisions

### Use `activeEditorKey` as the source of truth

Use the existing active editor state to derive `isAnyEditorOpen = activeEditorKey !== null`. This avoids introducing a second state path and keeps the behavior aligned with the existing one-open-editor model.

Alternative considered: hide only the active cell icon. This would still allow inactive cells to reveal icons on hover/focus and would not satisfy the requirement that all editable-cell edit icons are hidden while an editor is open.

### Add a suppression class or data state that wins over hover/focus

Each editable-cell edit icon must receive a suppression marker when `activeEditorKey !== null`. The SCSS rule for that marker must override:
- base hidden/visible transitions
- `.editableCell:hover .optionsButton`
- `.editableCell:focus-within .optionsButton`
- `.optionsButtonOpen`

This makes the state priority explicit:

```text
editor open > hover/focus/open-icon styling
```

Alternative considered: remove `.optionsButtonOpen`. That would hide the active icon, but hover/focus could still reveal inactive icons and future cells could reintroduce the same issue.

### Keep icon suppression visual only

The hidden affordance must also disable pointer events, but it must not unmount editor triggers or change focus management. Existing open/close behavior should continue to be handled by the editor state and popover overlay.

Alternative considered: conditionally render no icon while an editor is open. That is acceptable if simple, but a suppression class is less disruptive to tests and avoids remount churn.

## Risks / Trade-offs

- Hidden icon remains in DOM → mitigate by setting opacity/visibility and pointer-events so it is not visually interactive.
- Keyboard focus may remain on the trigger that opened the popover → mitigate by treating this as acceptable if the icon is visually suppressed and the editor remains usable.
- Future editable cells may forget the suppression rule → mitigate by centralizing the class/state in shared editable-cell styles or component patterns.
