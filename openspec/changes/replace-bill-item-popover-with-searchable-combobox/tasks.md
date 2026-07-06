## 1. Component Integration

- [x] 1.1 Import and use Carbon `ComboBox` in `EditableBillItemCell`.
- [x] 1.2 Keep the current editable cell value surface and chevron affordance in the table cell.
- [x] 1.3 Keep `EditableCellOverlay` as the portal wrapper for the bill-item editor.
- [x] 1.4 Replace the custom billable-service option button list with a ComboBox rendered inside the overlay content.

## 2. Searchable Selection Behavior

- [x] 2.1 Map `billableServices` into ComboBox items without changing the source data shape.
- [x] 2.2 Configure ComboBox item text so users can search by billable service name.
- [x] 2.3 Represent the currently matched billable service as the selected ComboBox item when the editor opens.
- [x] 2.4 Prevent free-text typed values from being committed as custom bill items.
- [x] 2.5 Preserve no-options behavior when no billable services are available.

## 3. Commit Semantics

- [x] 3.1 Auto-commit when a valid ComboBox billable service item is selected.
- [x] 3.2 Preserve the existing billable service and item field update payload.
- [x] 3.3 Preserve existing first-service-price replacement behavior when the line item already has a selected price.
- [x] 3.4 Close the editor after a successful service selection.

## 4. Overlay and Layout

- [x] 4.1 Keep ComboBox rendering inside the overlay rather than directly inside the table cell.
- [x] 4.2 Add bill-item ComboBox overlay styles only as needed to keep width and menu layout readable.
- [x] 4.3 Preserve outside-click close and Escape close behavior through the existing overlay component.
- [x] 4.4 Preserve table column widths while opening, filtering, selecting, and closing the bill-item selector.
- [x] 4.5 Avoid changing price picker, discount picker, payment behavior, invoice summary layout, or table column layout.

## 5. Tests and Stories

- [x] 5.1 Update focused bill-item editable cell tests for searchable ComboBox rendering.
- [x] 5.2 Add or update tests that verify selection commits and free text does not commit.
- [x] 5.3 Update Storybook interactions that open the bill-item selector if their selectors depend on custom option button markup.
- [x] 5.4 Run focused bill-item cell tests.
- [x] 5.5 Run Storybook outside the sandbox and inspect the bill-item selector in the default pending bill story.
