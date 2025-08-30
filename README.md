# 3D Node Graph Visualization

A dynamic 3D node graph visualization built with React and Three.js that features **dynamic link positioning** - links automatically redraw and move along with nodes when they are repositioned.

## Key Features

### Dynamic Link Positioning
- **Links move with nodes**: When nodes are dragged or repositioned, links automatically redraw to maintain connections
- **Real-time updates**: The `linkPositionUpdate` function ensures links are redrawn in real-time as nodes move
- **No fixed positions**: Links are not based on fixed coordinates but dynamically calculated based on node positions

### Interactive Controls
- Add new nodes with custom IDs
- Drag nodes in 3D space
- Load graph data from JSON files
- Real-time node and link counting

### 3D Visualization
- Full 3D navigation (rotate, zoom, pan)
- Custom node colors and text sizes
- Link labels showing connections
- Responsive design

## How Dynamic Link Positioning Works

The core functionality is implemented through the `linkPositionUpdate` callback in the ForceGraph3D component:

```javascript
linkPositionUpdate={(threeObject, { start, end }) => {
  // Update the line geometry - this redraws links when nodes move
  const positions = threeObject.geometry.attributes.position.array;
  positions[0] = start.x;
  positions[1] = start.y;
  positions[2] = start.z;
  positions[3] = end.x;
  positions[4] = end.y;
  positions[5] = end.z;
  threeObject.geometry.attributes.position.needsUpdate = true;

  // Update text sprite position
  const sprite = threeObject.children[0];
  if (sprite) {
    const middlePos = {
      x: start.x + (end.x - start.x) / 2,
      y: start.y + (end.y - start.y) / 2,
      z: start.z + (end.z - start.z) / 2
    };
    Object.assign(sprite.position, middlePos);
  }
}}
```

This function is called automatically whenever nodes move, ensuring that:
1. Link geometry is updated with new start/end positions
2. Link text labels are repositioned to the midpoint
3. All changes are applied in real-time

## Usage

1. **Start the development server**:
   ```bash
   npm run dev -- --host
   ```

2. **Add nodes**: Use the control panel to add new nodes with custom IDs

3. **Load JSON data**: Use the file input to load graph data from JSON files

4. **Interact with the graph**: 
   - Drag nodes to see links move dynamically
   - Rotate the view by dragging in empty space
   - Zoom with mouse wheel

## JSON Format

The application accepts JSON files with the following structure:

```json
{
  "nodes": [
    {
      "id": "NodeID",
      "color": "#FF6B6B",
      "textSize": 6,
      "group": 1,
      "x": 0,
      "y": 0,
      "z": 0
    }
  ],
  "links": [
    {
      "source": "SourceNodeID",
      "target": "TargetNodeID",
      "color": "#F0F0F0",
      "thickness": 1
    }
  ]
}
```

## Sample Data

A sample JSON file (`sample-graph.json`) is included to demonstrate the functionality.

## Technical Implementation

- **React**: Component-based UI
- **react-force-graph-3d**: 3D graph visualization
- **Three.js**: 3D graphics rendering
- **shadcn/ui**: Modern UI components
- **Tailwind CSS**: Styling

The key innovation is the dynamic link positioning system that ensures links are always correctly positioned relative to their connected nodes, regardless of how the nodes are moved or repositioned in 3D space.

