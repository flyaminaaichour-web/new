# Node Property Editor Design Document

## Overview
The Node Property Editor is a third interface panel that activates when a user clicks on a node (when not in Focus Mode). It allows real-time editing of node and link properties with immediate visual feedback.

## Architecture

### 1. State Management
- **selectedNodeForEdit**: Stores the currently selected node object for editing
- **editMode**: Boolean to distinguish between link selection mode and property editing mode

### 2. UI Components

#### Panel Layout
- Position: Bottom-right corner (complementing existing panels)
- Visibility: Only shown when a node is selected for editing
- Components:
  - Node ID display (read-only)
  - Color picker for node color
  - Slider/Input for text size (range: 1-20)
  - Dropdown for connected links
  - Color picker for selected link
  - Slider/Input for link thickness (range: 1-10)
  - Close button

### 3. Functionality Flow

#### Node Selection
1. User clicks a node (when Focus Mode is OFF)
2. System checks if click is for link creation or property editing
3. If property editing: open Property Editor panel with node data
4. Populate all fields with current node properties

#### Property Editing
1. **Node Color**: Color picker updates node.color immediately
2. **Text Size**: Slider/input updates node.textSize immediately
3. **Link Selection**: Dropdown shows all links connected to the selected node
4. **Link Color**: Color picker updates selected link.color immediately
5. **Link Thickness**: Slider/input updates selected link.thickness immediately

#### Real-time Updates
- All changes trigger immediate re-render of the 3D graph
- Use React state updates to trigger ForceGraph3D re-render
- Node and link objects are updated in-place in graphData state

### 4. Data Flow

```
User Input → State Update → graphData Modification → ForceGraph3D Re-render
```

### 5. Integration Points

#### With Existing Features
- **Link Selection Mode**: Disable property editor when selecting nodes for link creation
- **Focus Mode**: Disable property editor when Focus Mode is ON
- **Save JSON**: Existing saveGraphData() already serializes all properties
- **Load JSON**: Existing handleLoadFile() already deserializes all properties

#### Node Click Handler Enhancement
```javascript
const handleNodeClick = useCallback(node => {
  if (isFocusMode) {
    // Focus camera on node
  } else if (isLinkSelectionMode) {
    // Add to selectedNodes for link creation
  } else {
    // Open property editor
    setSelectedNodeForEdit(node);
  }
}, [isFocusMode, isLinkSelectionMode]);
```

### 6. UI/UX Considerations

- **Mode Indicator**: Clear visual indication of current mode (Link Selection vs Property Edit)
- **Connected Links Display**: Show link as "NodeA → NodeB" in dropdown
- **Color Pickers**: Use HTML5 color input for simplicity
- **Sliders**: Provide both slider and numeric input for precision
- **Immediate Feedback**: All changes visible instantly in 3D view
- **Close/Cancel**: Easy way to exit property editor without saving (changes are already applied)

### 7. Component Structure

```
App.jsx
├── Control Panel (existing)
├── OG Mode Panel (existing)
├── Property Editor Panel (NEW)
│   ├── Node Properties Section
│   │   ├── Node ID (display)
│   │   ├── Color Picker
│   │   └── Text Size Slider
│   └── Link Properties Section
│       ├── Link Dropdown
│       ├── Link Color Picker
│       └── Link Thickness Slider
└── ForceGraph3D
```

## Implementation Steps

1. Add new state variables for property editor
2. Create Property Editor Panel component structure
3. Implement node property controls with real-time updates
4. Implement link selection and property controls
5. Enhance handleNodeClick to support property editing mode
6. Add mode toggle/indicator for Link Selection vs Property Edit
7. Test all interactions and edge cases
8. Verify JSON serialization includes all properties

## Edge Cases

- No connected links: Hide link properties section
- Node with many links: Scrollable dropdown
- Simultaneous edits: Only one node editable at a time
- Mode conflicts: Clear priority (Focus > Link Selection > Property Edit)
