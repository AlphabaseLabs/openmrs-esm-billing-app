## ADDED Requirements

### Requirement: Popover option labels render without vertical clipping
Editable-cell popover option labels SHALL render visible text glyphs without clipping the top or bottom of the glyphs. This includes labels with descenders and lower antialiasing.

#### Scenario: Bill-item option label descenders are visible
- **WHEN** the bill-item options menu is open
- **THEN** option labels render without cropping the bottom of glyphs

#### Scenario: Price option label descenders are visible
- **WHEN** the price options menu is open
- **THEN** option labels render without cropping the bottom of glyphs

### Requirement: Horizontal truncation is preserved
Editable-cell popover option labels that are constrained to one line SHALL preserve horizontal truncation behavior while avoiding vertical glyph clipping.

#### Scenario: Long option label remains single-line truncated
- **WHEN** an option label is too long for the available menu width
- **THEN** the label remains constrained to one line with horizontal truncation
- **AND** visible glyphs are not clipped vertically

### Requirement: Option menu behavior and visual surface remain unchanged
The clipping fix SHALL NOT change option selection behavior, option ordering, selected-state color, hover-state color, menu width, row count, or popover positioning.

#### Scenario: Existing menu visuals are preserved
- **WHEN** the clipping fix is applied
- **THEN** existing option menu colors, widths, and positioning remain unchanged except for fully visible option label text

#### Scenario: Existing editor behavior is preserved
- **WHEN** a user selects an option after the clipping fix
- **THEN** the existing selection and commit behavior remains unchanged
