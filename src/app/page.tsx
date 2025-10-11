'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

// Dynamically import ForceGraph3D to avoid SSR issues
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-screen bg-black text-white">Loading 3D Graph...</div>
});

export default function Home() {
  const graphRef = useRef<any>();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [newNodeId, setNewNodeId] = useState('');
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [showOGMode, setShowOGMode] = useState(false);
  const [recordedOGPositions, setRecordedOGPositions] = useState({ nodes: [], links: [] });
  const [showControls, setShowControls] = useState(true);
  const [selectedFileForLoad, setSelectedFileForLoad] = useState<File | null>(null);
  const [loadedFileName, setLoadedFileName] = useState("graphData.json");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isLinkSelectionMode, setIsLinkSelectionMode] = useState(false);
  const [selectedNodeForEdit, setSelectedNodeForEdit] = useState<any>(null);
  const [selectedLinkForEdit, setSelectedLinkForEdit] = useState<any>(null);
  const [copiedNodeStyle, setCopiedNodeStyle] = useState<any>(null);
  const [copiedLinkStyle, setCopiedLinkStyle] = useState<any>(null);
  const [pullDistance, setPullDistance] = useState(50);
  const [selectedNodeToPull, setSelectedNodeToPull] = useState<string | null>(null);
  
  // Camera control states
  const [showCameraControls, setShowCameraControls] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(1);
  const [cameraBookmarks, setCameraBookmarks] = useState<any[]>([]);
  const [bookmarkName, setBookmarkName] = useState('');
  const autoRotateRef = useRef<NodeJS.Timeout | null>(null);

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
        const data = JSON.parse(e.target?.result as string);

        // Normalize nodes
        const nodes = data.nodes.map((node: any) => ({
          ...node,
          color: node.color || '#1A75FF',
          textSize: node.textSize || 6,
        }));

        // Normalize links
        const links = data.links.map((link: any) => ({
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

  const startLinkSelection = () => {
    setIsLinkSelectionMode(true);
    setSelectedNodes([]);
    setSelectedNodeForEdit(null);
  };

  const addLink = () => {
    if (selectedNodes.length !== 2 || !selectedNodes[0] || !selectedNodes[1]) {
      alert("Please select both source and target nodes to create a link.");
      return;
    }

    const [source, target] = selectedNodes;

    if (graphData.links.some((link: any) => {
      const linkSource = typeof link.source === 'object' ? link.source.id : link.source;
      const linkTarget = typeof link.target === 'object' ? link.target.id : link.target;
      return (linkSource === source && linkTarget === target) || (linkSource === target && linkTarget === source);
    })) {
      alert("Link between these two nodes already exists.");
      return;
    }

    const newLink = {
      source,
      target,
      color: 'rgba(240, 240, 240, 1)',
      thickness: 1,
    };

    setGraphData(prev => ({
      ...prev,
      links: [...prev.links, newLink],
    }));

    setSelectedNodes([]);
  };

  const cancelLinkSelection = () => {
    setIsLinkSelectionMode(false);
    setSelectedNodes([]);
  };

  const addNode = () => {
    if (!graphRef.current) return;
    
    const camera = graphRef.current.camera();
    const cameraPos = camera.position;
    const cameraDir = camera.getWorldDirection(new THREE.Vector3());

    if (!newNodeId.trim()) {
      alert('Please enter a node ID');
      return;
    }
    if (graphData.nodes.find((node: any) => node.id === newNodeId.trim())) {
      alert('Node with this ID already exists');
      return;
    }

    let nodePosition;
    
    if (selectedNodeToPull) {
      const targetNode = graphData.nodes.find((n: any) => n.id === selectedNodeToPull);
      if (targetNode) {
        const offset = 30;
        const randomAngle = Math.random() * Math.PI * 2;
        const randomElevation = (Math.random() - 0.5) * Math.PI * 0.5;
        
        nodePosition = {
          x: targetNode.x + Math.cos(randomAngle) * Math.cos(randomElevation) * offset,
          y: targetNode.y + Math.sin(randomElevation) * offset,
          z: targetNode.z + Math.sin(randomAngle) * Math.cos(randomElevation) * offset,
        };
      } else {
        nodePosition = {
          x: cameraPos.x + cameraDir.x * 50,
          y: cameraPos.y + cameraDir.y * 50,
          z: cameraPos.z + cameraDir.z * 50,
        };
      }
    } else {
      nodePosition = {
        x: cameraPos.x + cameraDir.x * 50,
        y: cameraPos.y + cameraDir.y * 50,
        z: cameraPos.z + cameraDir.z * 50,
      };
    }

    const newNode = {
      id: newNodeId.trim(),
      color: '#1A75FF',
      textSize: 6,
      x: nodePosition.x,
      y: nodePosition.y,
      z: nodePosition.z,
      fx: nodePosition.x,
      fy: nodePosition.y,
      fz: nodePosition.z,
    };

    setGraphData(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));

    setNewNodeId('');
    
    if (selectedNodeToPull) {
      setSelectedNodeToPull(null);
    }

    setTimeout(() => {
      const distance = 40;
      const distRatio = 1 + distance / Math.hypot(newNode.x, newNode.y, newNode.z);
      const newPos = {
        x: newNode.x * distRatio,
        y: newNode.y * distRatio,
        z: newNode.z * distRatio
      };
      graphRef.current?.cameraPosition(
        newPos,
        newNode,
        1500
      );
    }, 100);
  };

  const deleteNode = (nodeId: string) => {
    if (!nodeId) {
      alert('Please select a node to delete');
      return;
    }

    setGraphData(prev => ({
      nodes: prev.nodes.filter((node: any) => node.id !== nodeId),
      links: prev.links.filter((link: any) => {
        const linkSource = typeof link.source === 'object' ? link.source.id : link.source;
        const linkTarget = typeof link.target === 'object' ? link.target.id : link.target;
        return linkSource !== nodeId && linkTarget !== nodeId;
      })
    }));

    if (selectedNodeForEdit && selectedNodeForEdit.id === nodeId) {
      setSelectedNodeForEdit(null);
    }

    if (selectedNodeToPull === nodeId) {
      setSelectedNodeToPull(null);
    }

    setSelectedNodes(prev => prev.filter(id => id !== nodeId));

    alert(`Node ${nodeId} and its connected links have been deleted successfully!`);
  };

  const saveGraphData = () => {
    const cleanData = {
      nodes: graphData.nodes.map(({ id, color, textSize, group, x, y, z }: any) => ({
        id, color, textSize, group, x, y, z,
      })),
      links: graphData.links.map(({ source, target, color, thickness }: any) => ({
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
  };

  const onNodeDragEnd = useCallback((node: any) => {
    node.fx = node.x;
    node.fy = node.y;
    node.fz = node.z;
  }, []);

  const handleNodeClick = useCallback((node: any) => {
    if (isFocusMode) {
      const distance = 40;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

      const newPos = node.x || node.y || node.z
        ? { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }
        : { x: 0, y: 0, z: distance };

      graphRef.current?.cameraPosition(
        newPos,
        node,
        3000
      );
    } else if (isLinkSelectionMode) {
      setSelectedNodes(prevSelected => {
        if (prevSelected.includes(node.id)) {
          return prevSelected.filter(id => id !== node.id);
        } else if (prevSelected.length < 2) {
          return [...prevSelected, node.id];
        } else {
          return [prevSelected[0], node.id];
        }
      });
    } else {
      setSelectedNodeForEdit(node);
      setSelectedLinkForEdit(null);
    }
  }, [isFocusMode, isLinkSelectionMode]);

  const handleLinkClick = useCallback((link: any) => {
    setSelectedLinkForEdit(link);
    setSelectedNodeForEdit(null);
  }, []);

  const handleZoomOut = useCallback(() => {
    graphRef.current?.cameraPosition(
      { x: 0, y: 0, z: 500 },
      { x: 0, y: 0, z: 0 },
      3000
    );
  }, []);

  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force('charge').strength(-120);
      graphRef.current.d3Force('link').distance((link: any) => link.distance || 50);
      graphRef.current.d3Force('center', null);
    }
  }, []);

  return (
    <div className="relative h-screen w-screen bg-black text-white">
      <ForceGraph3D
        ref={graphRef}
        graphData={graphData}
        nodeLabel="id"
        nodeAutoColorBy="group"
        nodeThreeObject={(node: any) => {
          const sprite = new SpriteText(node.id);
          sprite.color = node.color || 'white';
          sprite.textHeight = node.textSize || 6;
          return sprite;
        }}
        linkWidth={(link: any) => link.thickness || 1}
        linkColor={(link: any) => {
          const color = link.color || '#F0F0F0';
          // Force full opacity for all links
          if (color.startsWith('#')) {
            const hex = color.slice(1);
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, 1)`;
          } else if (color.startsWith('rgb(')) {
            const parts = color.match(/\d+/g);
            return `rgba(${parts![0]}, ${parts![1]}, ${parts![2]}, 1)`;
          } else if (color.startsWith('rgba(')) {
            const parts = color.match(/\d+/g);
            return `rgba(${parts![0]}, ${parts![1]}, ${parts![2]}, 1)`;
          }
          return 'rgba(240, 240, 240, 1)';
        }}
        onNodeClick={handleNodeClick}
        onLinkClick={handleLinkClick}
        onNodeDragEnd={onNodeDragEnd}
        backgroundColor="#000000"
      />

      {/* Controls Panel */}
      {showControls && (
        <div className="absolute top-4 left-4 z-10 w-80 max-h-[90vh] overflow-y-auto">
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
                  onChange={(e) => setSelectedFileForLoad(e.target.files?.[0] || null)}
                />
                <Button onClick={handleLoadFile} size="sm" className="w-full">
                  Load File
                </Button>
                {selectedFileForLoad && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedFileForLoad.name}
                  </p>
                )}
                
                <Separator className="my-3" />
                
                <Label>Save Filename</Label>
                <Input
                  type="text"
                  placeholder="Enter filename"
                  value={loadedFileName}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (value && !value.endsWith('.json')) {
                      value = value.replace(/\.[^.]*$/, '') + '.json';
                    }
                    setLoadedFileName(value || 'graphData.json');
                  }}
                />
                <Button onClick={saveGraphData} size="sm" className="w-full">
                  Save JSON
                </Button>
                
                <Button onClick={handleNewGraph} variant="outline" size="sm" className="w-full">
                  New Graph
                </Button>
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
                
                {graphData.nodes.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <Label className="text-xs">Bring closer to</Label>
                    <Select
                      value={selectedNodeToPull || ''}
                      onValueChange={(value) => setSelectedNodeToPull(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select target node" />
                      </SelectTrigger>
                      <SelectContent>
                        {graphData.nodes.map((node: any) => (
                          <SelectItem key={node.id} value={node.id}>
                            {node.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Separator />

              {/* Delete Node */}
              {graphData.nodes.length > 0 && (
                <div className="space-y-2">
                  <Label>Delete Node</Label>
                  <Select
                    value={selectedNodeForEdit?.id || ''}
                    onValueChange={(value) => {
                      const node = graphData.nodes.find((n: any) => n.id === value);
                      setSelectedNodeForEdit(node || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select node to delete" />
                    </SelectTrigger>
                    <SelectContent>
                      {graphData.nodes.map((node: any) => (
                        <SelectItem key={node.id} value={node.id}>
                          {node.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => {
                      if (selectedNodeForEdit) {
                        if (window.confirm(`Are you sure you want to delete node "${selectedNodeForEdit.id}"? This will also remove all connected links.`)) {
                          deleteNode(selectedNodeForEdit.id);
                        }
                      } else {
                        alert('Please select a node to delete');
                      }
                    }} 
                    size="sm" 
                    className="w-full"
                    variant="destructive"
                    disabled={!selectedNodeForEdit}
                  >
                    Delete Node
                  </Button>
                </div>
              )}

              {graphData.nodes.length > 0 && <Separator />}

              {/* Add Link */}
              <div className="space-y-2">
                <Label>Create Link Between Nodes</Label>
                {graphData.nodes.length < 2 ? (
                  <p className="text-sm text-muted-foreground">Need at least 2 nodes to create a link</p>
                ) : (
                  <>
                    {!isLinkSelectionMode && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-xs">From Node</Label>
                          <Select
                            value={selectedNodes[0] || ''}
                            onValueChange={(value) => {
                              setSelectedNodes(prev => [value, prev[1] || '']);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select source node" />
                            </SelectTrigger>
                            <SelectContent>
                              {graphData.nodes.map((node: any) => (
                                <SelectItem key={node.id} value={node.id}>
                                  {node.id}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">To Node</Label>
                          <Select
                            value={selectedNodes[1] || ''}
                            onValueChange={(value) => {
                              setSelectedNodes(prev => [prev[0] || '', value]);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select target node" />
                            </SelectTrigger>
                            <SelectContent>
                              {graphData.nodes
                                .filter((node: any) => node.id !== selectedNodes[0])
                                .map((node: any) => (
                                  <SelectItem key={node.id} value={node.id}>
                                    {node.id}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => {
                              if (selectedNodes.length === 2 && selectedNodes[0] && selectedNodes[1]) {
                                addLink();
                              } else {
                                alert("Please select both source and target nodes");
                              }
                            }} 
                            size="sm" 
                            className="flex-1"
                            disabled={!selectedNodes[0] || !selectedNodes[1]}
                          >
                            Create Link
                          </Button>
                          <Button 
                            onClick={startLinkSelection} 
                            size="sm" 
                            className="flex-1"
                            variant="outline"
                          >
                            Or Click Nodes
                          </Button>
                        </div>
                      </>
                    )}

                    {isLinkSelectionMode && (
                      <>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm mb-2">Click Mode Active</p>
                          <p className="text-xs text-muted-foreground mb-2">
                            Click on two nodes in the 3D graph to create a link between them.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Selected: {selectedNodes.join(' → ') || 'None'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={addLink} 
                            size="sm" 
                            className="flex-1"
                            disabled={selectedNodes.length !== 2}
                          >
                            Create Link
                          </Button>
                          <Button 
                            onClick={cancelLinkSelection} 
                            size="sm" 
                            className="flex-1"
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              <Separator />

              {/* Focus Mode */}
              <div className="space-y-2">
                <Button
                  onClick={() => setIsFocusMode(prev => !prev)}
                  size="sm"
                  className="w-full"
                  variant={isFocusMode ? "default" : "outline"}
                >
                  {isFocusMode ? "Exit Focus Mode" : "Focus Mode: OFF"}
                </Button>
                {isFocusMode && (
                  <p className="text-xs text-muted-foreground">
                    Click on any node to focus the camera on it.
                  </p>
                )}
              </div>

              <Separator />

              {/* Zoom Out */}
              <div className="space-y-2">
                <Button onClick={handleZoomOut} size="sm" className="w-full" variant="outline">
                  Zoom Out
                </Button>
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
    </div>
  );
}
