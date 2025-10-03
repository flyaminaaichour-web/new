
import { useEffect, useRef, useState, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Slider } from '@/components/ui/slider.jsx';
import './App.css';

function App() {
  const graphRef = useRef();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [newNodeId, setNewNodeId] = useState('');
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [showOGMode, setShowOGMode] = useState(false);
  const [recordedOGPositions, setRecordedOGPositions] = useState({ nodes: [], links: [] });
  const [showControls, setShowControls] = useState(true);
  const [selectedFileForLoad, setSelectedFileForLoad] = useState(null);
  const [loadedFileName, setLoadedFileName] = useState("graphData.json");
  const [isFocusMode, setIsFocusMode] = useState(false); // New state for focus mode
  const [isLinkSelectionMode, setIsLinkSelectionMode] = useState(false); // Mode for selecting nodes to create links
  const [selectedNodeForEdit, setSelectedNodeForEdit] = useState(null); // Node selected for property editing
  const [selectedLinkForEdit, setSelectedLinkForEdit] = useState(null); // Link selected for property editing

  // Sample data for testing
  useEffect(() => {
    const sampleData = {
      nodes: [
        { id: 'Node1', color: '#1A75FF', textSize: 6, x: 0, y: 0, z: 0 },
        { id: 'Node2', color: '#FF6B6B', textSize: 6, x: 50, y: 0, z: 0 },
        { id: 'Node3', color: '#4ECDC4', textSize: 6, x: 25, y: 50, z: 0 }
      ],
      links: [
        { source: 'Node1', target: 'Node2', color: '#F0F0F0', thickness: 5 },
        { source: 'Node2', target: 'Node3', color: '#F0F0F0', thickness: 1 }
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
        setLoadedFileName(selectedFileForLoad.name);
        setSelectedFileForLoad(null);
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

  const handleLoadOGFile = () => {
    if (!selectedFileForLoad) {
      alert("Please select an OG.json file first");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const ogData = JSON.parse(e.target.result);

        setGraphData(prevGraphData => {
          const newNodes = prevGraphData.nodes.map(node => {
            const ogNode = ogData.nodes.find(ogNode => ogNode.id === node.id);
            if (ogNode) {
              return {
                ...node,
                x: ogNode.x,
                y: ogNode.y,
                z: ogNode.z,
                fx: ogNode.x,
                fy: ogNode.y,
                fz: ogNode.z,
              };
            } else {
              return node;
            }
          });
          return { ...prevGraphData, nodes: newNodes, links: ogData.links || [] };
        });
        alert(`Loaded ${ogData.nodes.length} OG positions and ${ogData.links.length} links successfully!`);
        setLoadedFileName(selectedFileForLoad.name.replace(".json", "-OG.json"));
        setSelectedFileForLoad(null);
      } catch (error) {
        console.error("Error parsing OG.json file:", error);
        alert("Error parsing OG.json file. Please ensure it is valid JSON.");
      }
    };
    reader.readAsText(selectedFileForLoad);
  };

  const startLinkSelection = () => {
    setIsLinkSelectionMode(true);
    setSelectedNodes([]);
    setSelectedNodeForEdit(null); // Close property editor
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
    setIsLinkSelectionMode(false); // Exit link selection mode
  };

  const cancelLinkSelection = () => {
    setIsLinkSelectionMode(false);
    setSelectedNodes([]);
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
    link.download = loadedFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Save OG-suffixed JSON if OG mode is active and there are recorded positions
    if (showOGMode && recordedOGPositions.nodes.length > 0) {
      const ogBlob = new Blob([JSON.stringify(recordedOGPositions, null, 2)], { type: 'application/json' });
      const ogUrl = URL.createObjectURL(ogBlob);
      const ogLink = document.createElement('a');
      ogLink.href = ogUrl;
      const ogFileName = loadedFileName.replace('.json', '-OG.json');
      ogLink.download = ogFileName;
      document.body.appendChild(ogLink);
      ogLink.click();
      document.body.removeChild(ogLink);
      URL.revokeObjectURL(ogUrl);
    }
  };

  const recordOGPositions = () => {
    const fixedPositions = graphData.nodes.filter(node => node.fx !== null && node.fy !== null && node.fz !== null).map(node => ({
      id: node.id,
      x: node.fx,
      y: node.fy,
      z: node.fz,
    }));
    const recordedLinks = graphData.links.map(link => ({
      source: typeof link.source === 'object' ? link.source.id : link.source,
      target: typeof link.target === 'object' ? link.target.id : link.target,
      color: link.color,
      thickness: link.thickness,
    }));
    setRecordedOGPositions({ nodes: fixedPositions, links: recordedLinks });
    alert(`Recorded ${fixedPositions.length} fixed node positions and ${recordedLinks.length} links for OG mode!`);
  };

  const saveOGPositions = () => {
    if (recordedOGPositions.nodes.length === 0 && recordedOGPositions.links.length === 0) {
      alert("No OG positions or links to save. Please record positions first.");
      return;
    }
    const blob = new Blob([JSON.stringify(recordedOGPositions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "OG.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert("OG.json saved successfully!");
  };

  const onNodeDragEnd = useCallback(node => {
    node.fx = node.x;
    node.fy = node.y;
    node.fz = node.z;
    if (showOGMode) {
      const fixedPositions = graphData.nodes.filter(n => n.fx !== null && n.fy !== null && n.fz !== null).map(n => ({
        id: n.id,
        x: n.fx,
        y: n.fy,
        z: n.fz,
      }));
      const recordedLinks = graphData.links.map(link => ({
        source: typeof link.source === 'object' ? link.source.id : link.source,
        target: typeof link.target === 'object' ? link.target.id : link.target,
        color: link.color,
        thickness: link.thickness,
      }));
      setRecordedOGPositions({ nodes: fixedPositions, links: recordedLinks });
    }
  }, [showOGMode, graphData.nodes, graphData.links]);

  const handleNodeClick = useCallback(node => {
    if (isFocusMode) {
      // Focus on the clicked node
      const distance = 40;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

      const newPos = node.x || node.y || node.z
        ? { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }
        : { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)

      graphRef.current.cameraPosition(
        newPos, // new position
        node, // lookAt ({ x, y, z })
        3000  // ms transition duration
      );
    } else if (isLinkSelectionMode) {
      // Link selection mode: add to selectedNodes for link creation
      setSelectedNodes(prevSelected => {
        if (prevSelected.includes(node.id)) {
          return prevSelected.filter(id => id !== node.id);
        } else {
          return [...prevSelected, node.id];
        }
      });
    } else {
      // Property editing mode: open property editor for this node
      setSelectedNodeForEdit(node);
      setSelectedLinkForEdit(null); // Reset selected link
    }
  }, [isFocusMode, isLinkSelectionMode]);

  const handleZoomOut = useCallback(() => {
    // Reset camera to a default zoomed-out position
    graphRef.current.cameraPosition(
      { x: 0, y: 0, z: 500 }, // A reasonable default position
      { x: 0, y: 0, z: 0 },   // Look at the center
      3000                    // Transition duration
    );
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
                {!isLinkSelectionMode ? (
                  <Button onClick={startLinkSelection} size="sm" className="w-full">
                    Start Link Selection
                  </Button>
                ) : (
                  <>
                    <div className="text-sm text-muted-foreground">
                      Selected for link: {selectedNodes.join(", ")}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={addLink} size="sm" className="flex-1" disabled={selectedNodes.length !== 2}>
                        Create Link
                      </Button>
                      <Button onClick={cancelLinkSelection} size="sm" className="flex-1" variant="outline">
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </div>

              <Separator />

              {/* Focus Mode and Zoom Out Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={() => setIsFocusMode(prev => !prev)}
                  size="sm"
                  className="w-full"
                  variant={isFocusMode ? "default" : "outline"}
                >
                  {isFocusMode ? "Focus Mode: ON" : "Focus Mode: OFF"}
                </Button>
                <Button onClick={handleZoomOut} size="sm" className="w-full" variant="outline">
                  Zoom Out
                </Button>
              </div>

              <Separator />

              {/* OG Mode Toggle */}
              <div className="space-y-2">
                <Button onClick={() => setShowOGMode(prev => !prev)} size="sm" className="w-full">
                  {showOGMode ? "Hide OG Mode" : "Show OG Mode"}
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

      {/* OG Mode Panel */}
      {showOGMode && (
        <div className="absolute top-4 right-4 z-10 w-80">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                OG Mode
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOGMode(false)}
                >
                  Hide
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Load OG.json File</Label>
                <Input
                  type="file"
                  accept=".json"
                  onChange={(e) => setSelectedFileForLoad(e.target.files[0])}
                />
                <Button onClick={handleLoadOGFile} size="sm" className="w-full">
                  Load OG.json
                </Button>
              </div>
              <Separator />
              <div className="space-y-2">
                <Button onClick={recordOGPositions} size="sm" className="w-full">
                  Record OG Positions
                </Button>
                <Button onClick={saveOGPositions} size="sm" className="w-full">
                  Save OG.json
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Recorded OG Positions: {recordedOGPositions.nodes.length} nodes, {recordedOGPositions.links.length} links
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

      {/* Property Editor Panel */}
      {selectedNodeForEdit && (
        <div className="absolute bottom-4 right-4 z-10 w-80">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Edit Node: {selectedNodeForEdit.id}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedNodeForEdit(null);
                    setSelectedLinkForEdit(null);
                  }}
                >
                  Close
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Node Properties */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Node Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={selectedNodeForEdit.color || '#1A75FF'}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setGraphData(prev => ({
                          ...prev,
                          nodes: prev.nodes.map(n =>
                            n.id === selectedNodeForEdit.id ? { ...n, color: newColor } : n
                          )
                        }));
                        setSelectedNodeForEdit(prev => ({ ...prev, color: newColor }));
                      }}
                      className="w-20 h-10"
                    />
                    <span className="text-sm text-muted-foreground">{selectedNodeForEdit.color || '#1A75FF'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Text Size: {selectedNodeForEdit.textSize || 6}</Label>
                  <Slider
                    value={[selectedNodeForEdit.textSize || 6]}
                    onValueChange={(value) => {
                      const newSize = value[0];
                      setGraphData(prev => ({
                        ...prev,
                        nodes: prev.nodes.map(n =>
                          n.id === selectedNodeForEdit.id ? { ...n, textSize: newSize } : n
                        )
                      }));
                      setSelectedNodeForEdit(prev => ({ ...prev, textSize: newSize }));
                    }}
                    min={1}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              <Separator />

              {/* Link Properties */}
              <div className="space-y-3">
                <Label>Connected Links</Label>
                {(() => {
                  const connectedLinks = graphData.links.filter(link => {
                    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                    return sourceId === selectedNodeForEdit.id || targetId === selectedNodeForEdit.id;
                  });

                  if (connectedLinks.length === 0) {
                    return <p className="text-sm text-muted-foreground">No connected links</p>;
                  }

                  return (
                    <>
                      <Select
                        value={selectedLinkForEdit ? `${typeof selectedLinkForEdit.source === 'object' ? selectedLinkForEdit.source.id : selectedLinkForEdit.source}-${typeof selectedLinkForEdit.target === 'object' ? selectedLinkForEdit.target.id : selectedLinkForEdit.target}` : ''}
                        onValueChange={(value) => {
                          const link = connectedLinks.find(l => {
                            const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
                            const targetId = typeof l.target === 'object' ? l.target.id : l.target;
                            return `${sourceId}-${targetId}` === value;
                          });
                          setSelectedLinkForEdit(link);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a link to edit" />
                        </SelectTrigger>
                        <SelectContent>
                          {connectedLinks.map((link, index) => {
                            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                            return (
                              <SelectItem key={index} value={`${sourceId}-${targetId}`}>
                                {sourceId} → {targetId}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>

                      {selectedLinkForEdit && (
                        <div className="space-y-3 mt-3">
                          <div className="space-y-2">
                            <Label>Link Color</Label>
                            <div className="flex gap-2 items-center">
                              <Input
                                type="color"
                                value={selectedLinkForEdit.color || '#F0F0F0'}
                                onChange={(e) => {
                                  const newColor = e.target.value;
                                  setGraphData(prev => ({
                                    ...prev,
                                    links: prev.links.map(l => {
                                      const lSourceId = typeof l.source === 'object' ? l.source.id : l.source;
                                      const lTargetId = typeof l.target === 'object' ? l.target.id : l.target;
                                      const selectedSourceId = typeof selectedLinkForEdit.source === 'object' ? selectedLinkForEdit.source.id : selectedLinkForEdit.source;
                                      const selectedTargetId = typeof selectedLinkForEdit.target === 'object' ? selectedLinkForEdit.target.id : selectedLinkForEdit.target;
                                      return (lSourceId === selectedSourceId && lTargetId === selectedTargetId)
                                        ? { ...l, color: newColor }
                                        : l;
                                    })
                                  }));
                                  setSelectedLinkForEdit(prev => ({ ...prev, color: newColor }));
                                }}
                                className="w-20 h-10"
                              />
                              <span className="text-sm text-muted-foreground">{selectedLinkForEdit.color || '#F0F0F0'}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Link Thickness: {selectedLinkForEdit.thickness || 1}</Label>
                            <Slider
                              value={[selectedLinkForEdit.thickness || 1]}
                              onValueChange={(value) => {
                                const newThickness = value[0];
                                setGraphData(prev => ({
                                  ...prev,
                                  links: prev.links.map(l => {
                                    const lSourceId = typeof l.source === 'object' ? l.source.id : l.source;
                                    const lTargetId = typeof l.target === 'object' ? l.target.id : l.target;
                                    const selectedSourceId = typeof selectedLinkForEdit.source === 'object' ? selectedLinkForEdit.source.id : selectedLinkForEdit.source;
                                    const selectedTargetId = typeof selectedLinkForEdit.target === 'object' ? selectedLinkForEdit.target.id : selectedLinkForEdit.target;
                                    return (lSourceId === selectedSourceId && lTargetId === selectedTargetId)
                                      ? { ...l, thickness: newThickness }
                                      : l;
                                  })
                                }));
                                setSelectedLinkForEdit(prev => ({ ...prev, thickness: newThickness }));
                              }}
                              min={1}
                              max={10}
                              step={0.5}
                              className="w-full"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3D Graph */}      <ForceGraph3D
        ref={graphRef}
        graphData={graphData}
        nodeLabel="id"
        nodeColor={node => selectedNodes.includes(node.id) ? '#FFD700' : node.color || '#1A75FF'}
        onNodeClick={handleNodeClick}
        linkColor={link => link.color || '#F0F0F0'}
        linkOpacity={0.8}
        linkWidth={link => link.thickness || 1}
        linkThreeObjectExtend={true}
        linkThreeObject={link => {
          // Add text sprite for the link
          const sprite = new SpriteText(
            `${typeof link.source === 'object' ? link.source.id : link.source} → ${typeof link.target === 'object' ? link.target.id : link.target}`
          );
          sprite.color = link.color || '#F0F0F0';
          sprite.textHeight = 1.5;
          return sprite;
        }}
        linkPositionUpdate={(sprite, { start, end }) => {
          // Update text sprite position
          const middlePos = {
            x: start.x + (end.x - start.x) / 2,
            y: start.y + (end.y - start.y) / 2,
            z: start.z + (end.z - start.z) / 2
          };
          Object.assign(sprite.position, middlePos);
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

