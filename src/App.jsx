import { useEffect, useRef, useState, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import './App.css';

function App() {
  const graphRef = useRef();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [newNodeId, setNewNodeId] = useState('');
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [showControls, setShowControls] = useState(true);
  const [selectedFileForLoad, setSelectedFileForLoad] = useState(null);

  // Sample data for testing
  useEffect(() => {
    const sampleData = {
      nodes: [
        { id: 'Node1', color: '#1A75FF', textSize: 6, x: 0, y: 0, z: 0 },
        { id: 'Node2', color: '#FF6B6B', textSize: 6, x: 50, y: 0, z: 0 },
        { id: 'Node3', color: '#4ECDC4', textSize: 6, x: 25, y: 50, z: 0 }
      ],
      links: [
        { source: 'Node1', target: 'Node2', color: '#F0F0F0' },
        { source: 'Node2', target: 'Node3', color: '#F0F0F0' }
      ]
    };
    setGraphData(sampleData);
  }, []);

  const handleLoadFile = () => {
    if (!selectedFileForLoad) {
      alert('Please select a JSON file first');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // Normalize nodes
        const nodes = data.nodes.map(node => ({
          ...node,
          color: node.color || '#1A75FF',
          textSize: node.textSize || 6,
        }));

        // Normalize links
        const links = data.links.map(link => ({
          ...link,
          source: typeof link.source === 'object' ? link.source.id : link.source,
          target: typeof link.target === 'object' ? link.target.id : link.target,
          color: link.color || '#F0F0F0',
          thickness: link.thickness || 1,
        }));

        setGraphData({ nodes, links });
        alert(`Loaded ${nodes.length} nodes and ${links.length} links successfully!`);
      } catch (error) {
        console.error('Error parsing JSON file:', error);
        alert('Error parsing JSON file. Please ensure it is valid JSON.');
      }
    };
    reader.readAsText(selectedFileForLoad);
  };

  const handleNewGraph = () => {
    setGraphData({ nodes: [], links: [] });
    setSelectedFileForLoad(null);
  };

  const addLink = () => {
    if (selectedNodes.length !== 2) {
      alert("Please select exactly two nodes to create a link.");
      return;
    }

    const [source, target] = selectedNodes;

    if (graphData.links.some(link => (link.source === source && link.target === target) || (link.source === target && link.target === source))) {
      alert("Link between these two nodes already exists.");
      return;
    }

    const newLink = {
      source,
      target,
      color: '#F0F0F0',
      thickness: 1,
    };

    setGraphData(prev => ({
      ...prev,
      links: [...prev.links, newLink],
    }));

    setSelectedNodes([]); // Clear selection after adding link
  };

  const addNode = () => {
    if (!newNodeId.trim()) {
      alert('Please enter a node ID');
      return;
    }
    if (graphData.nodes.find(node => node.id === newNodeId.trim())) {
      alert('Node with this ID already exists');
      return;
    }

    const newNode = {
      id: newNodeId.trim(),
      color: '#1A75FF',
      textSize: 6,
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100,
      z: Math.random() * 200 - 100,
    };

    setGraphData(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));

    setNewNodeId('');
  };

  const saveGraphData = () => {
    const cleanData = {
      nodes: graphData.nodes.map(({ id, color, textSize, group, x, y, z }) => ({
        id, color, textSize, group, x, y, z,
      })),
      links: graphData.links.map(({ source, target, color, thickness }) => ({
        source: typeof source === 'object' ? source.id : source,
        target: typeof target === 'object' ? target.id : target,
        color, thickness,
      })),
    };

    const blob = new Blob([JSON.stringify(cleanData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'graphData.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const onNodeDragEnd = useCallback(node => {
    node.fx = node.x;
    node.fy = node.y;
    node.fz = node.z;
  }, []);

  const handleNodeClick = useCallback(node => {
    setSelectedNodes(prevSelected => {
      if (prevSelected.includes(node.id)) {
        return prevSelected.filter(id => id !== node.id);
      } else {
        return [...prevSelected, node.id];
      }
    });
  }, []);

  return (
    <div className="w-screen h-screen m-0 relative bg-background">
      {/* Control Panel */}
      {showControls && (
        <div className="absolute top-4 left-4 z-10 w-80">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                3D Node Graph
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowControls(false)}
                >
                  Hide
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Operations */}
              <div className="space-y-2">
                <Label>Load JSON File</Label>
                <Input
                  type="file"
                  accept=".json"
                  onChange={(e) => setSelectedFileForLoad(e.target.files[0])}
                />
                <div className="flex gap-2">
                  <Button onClick={handleLoadFile} size="sm" className="flex-1">
                    Load File
                  </Button>
                  <Button onClick={saveGraphData} size="sm" className="flex-1">
                    Save JSON
                  </Button>
                </div>
                <Button onClick={handleNewGraph} variant="outline" size="sm" className="w-full">
                  New Graph
                </Button>
                {selectedFileForLoad && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedFileForLoad.name}
                  </p>
                )}
              </div>

              <Separator />

              {/* Add Node */}
              <div className="space-y-2">
                <Label>Add Node</Label>
                <Input
                  placeholder="Node ID"
                  value={newNodeId}
                  onChange={(e) => setNewNodeId(e.target.value)}
                />
                <Button onClick={addNode} size="sm" className="w-full">
                  Add Node
                </Button>
              </div>

              <Separator />

              {/* Add Link */}
              <div className="space-y-2">
                <Label>Add Link</Label>
                <div className="text-sm text-muted-foreground">
                  Selected for link: {selectedNodes.join(", ")}
                </div>
                <Button onClick={addLink} size="sm" className="w-full" disabled={selectedNodes.length !== 2}>
                  Create Link
                </Button>
              </div>

              <Separator />

              {/* Stats */}
              <div className="text-sm text-muted-foreground">
                Nodes: {graphData.nodes.length} | Links: {graphData.links.length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!showControls && (
        <Button
          className="absolute top-4 left-4 z-10"
          onClick={() => setShowControls(true)}
        >
          Show Controls
        </Button>
      )}

      {/* 3D Graph */}
      <ForceGraph3D
        ref={graphRef}
        graphData={graphData}
        nodeLabel="id"
        nodeColor={node => selectedNodes.includes(node.id) ? '#FFD700' : node.color || '#1A75FF'}
        onNodeClick={handleNodeClick}
        linkColor={() => '#F0F0F0'}
        linkThreeObjectExtend={true}
        linkThreeObject={link => {
          // Create a custom Three.js Line object for the link
          const material = new THREE.LineBasicMaterial({ 
            color: link.color || '#F0F0F0', 
            transparent: true, 
            opacity: 0.6
          });
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
          const line = new THREE.Line(geometry, material);

          // Add text sprite
          const sprite = new SpriteText(
            `${typeof link.source === 'object' ? link.source.id : link.source} → ${typeof link.target === 'object' ? link.target.id : link.target}`
          );
          sprite.color = link.color || '#F0F0F0';
          sprite.textHeight = 1.5;
          line.add(sprite);

          return line;
        }}
        linkPositionUpdate={(threeObject, { start, end }) => {
          // This is the key function that redraws links when nodes move
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
        onNodeDragEnd={onNodeDragEnd}
        nodeThreeObject={node => {
          const sprite = new SpriteText(node.id);
          sprite.material.depthWrite = false;
          sprite.color = node.color || '#1A75FF';
          sprite.textHeight = node.textSize || 6;
          return sprite;
        }}
        width={window.innerWidth}
        height={window.innerHeight}
      />
    </div>
  );
}

export default App;

