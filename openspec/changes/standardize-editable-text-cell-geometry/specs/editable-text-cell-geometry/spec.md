## ADDED Requirements

### Requirement: Text editable cells use stable lanes
The system SHALL render editable text invoice cells with a stable two-lane structure containing a content lane and an affordance lane.

#### Scenario: Text editable cell always contains both lanes
- **WHEN** an editable text invoice table cell is rendered in any row state
- **THEN** the cell provides a dedicated affordance lane and a dedicated content lane in all states

### Requirement: Text lane orientation is value-first for text cells
The system SHALL place the content lane before the affordance lane for editable text cells so reading and editing align to the text start edge.

#### Scenario: Text value is in content-first order
- **WHEN** the bill-item text cell is rendered
- **THEN** the display value/editor is in the leading content lane and the chevron affordance is in the trailing lane

### Requirement: Text affordance lane is geometry-preserving
The system SHALL preserve the affordance lane width when the chevron is hidden, disabled, visible, or not interactable.

#### Scenario: Text affordance state does not resize cell
- **WHEN** a row toggles between editable and non-editable states
- **THEN** the trailing affordance lane keeps its reserved width and does not alter text lane geometry

### Requirement: Text editor replaces only content lane
The system SHALL replace only the content lane when entering edit mode.

#### Scenario: Edit mode swap stays lane-local
- **WHEN** a bill-item text cell enters editor mode
- **THEN** the original content lane is replaced by the editor component without changing lane structure or header alignment

### Requirement: Text editable popover is in production component path
The system SHALL use production invoice editable-cell components and existing production overlay pattern for text cell popovers.

#### Scenario: Storybook and production render same implementation path
- **WHEN** storybook and runtime render editable text cells
- **THEN** they use the same production text editable cell components and geometry classes, not Storybook-only wrappers
