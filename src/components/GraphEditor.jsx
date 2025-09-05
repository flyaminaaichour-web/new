import React, { useState, useEffect, useRef } from 'react';

const GraphEditor = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedLinkIndex, setSelectedLinkIndex] = useState(null);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(null);
  const [fileInfo, setFileInfo] = useState("");
  const [showAlerts, setShowAlerts] = useState([]);

  const fileInputRef = useRef(null);
  const nodeCountRef = useRef(null);
  const linkCountRef = useRef(null);
  const fileInfoDivRef = useRef(null);
  const nodesContainerRef = useRef(null);
  const linksContainerRef = useRef(null);
  const selectedNodeIdRef = useRef(null);
  const nodeColorRef = useRef(null);
  const nodeTextSizeRef = useRef(null);
  const nodeTextSizeValueRef = useRef(null);
  const defaultColorRef = useRef(null);
  const defaultSizeRef = useRef(null);
  const sizeValueRef = useRef(null);

  const showAlert = (message, type) => {
    const id = Date.now();
    setShowAlerts((prevAlerts) => [...prevAlerts, { id, message, type }]);
    setTimeout(() => {
      setShowAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== id));
    }, 5000);
  };

  const loadGraphData = (data, fileName = "", fileSize = 0) => {
    const cleanedData = {
      nodes: data.nodes.map((node) => ({
        id: node.id,
        x: node.x || 0,
        y: node.y || 0,
        z: node.z || 0,
        color: node.color || "#1A75FF",
        textSize: node.textSize || 6,
        group: node.group || 1,
      })),
      links: data.links.map((link) => ({
        source: typeof link.source === "object" ? link.source.id : link.source,
        target: typeof link.target === "object" ? link.target.id : link.target,
        color: link.color || "#F0F0F0",
        thickness: link.thickness || 1,
      })),
    };
    setGraphData(cleanedData);
    setSelectedLinkIndex(null);
    setSelectedNodeIndex(null);
    if (selectedNodeIdRef.current) selectedNodeIdRef.current.value = "";
    if (nodeColorRef.current) nodeColorRef.current.value = "#1A75FF";
    if (nodeTextSizeRef.current) nodeTextSizeRef.current.value = 6;
    if (nodeTextSizeValueRef.current) nodeTextSizeValueRef.current.textContent = 6;

    if (fileName && fileInfoDivRef.current) {
      setFileInfo(`Loaded: ${fileName} (${(fileSize / 1024).toFixed(1)} KB)`);
      fileInfoDivRef.current.style.display = "block";
    }
  };

  const updateStats = () => {
    if (nodeCountRef.current) nodeCountRef.current.textContent = graphData.nodes.length;
    if (linkCountRef.current) linkCountRef.current.textContent = graphData.links.length;
  };

  const renderNodes = () => {
    const container = nodesContainerRef.current;
    if (!container) return;

    if (graphData.nodes.length === 0) {
      container.innerHTML = `<div class="no-data">Load a JSON file to see nodes here</div>`;
      return;
    }

    container.innerHTML = graphData.nodes
      .map(
        (node, index) => `
        <div class="list-item" onclick="selectNode(${index})" id="node-${index}">
            <div class="item-info">
                <div class="item-text">${node.id}</div>
                <div class="item-details">
                    Color: <span style="color: ${node.color}">●</span> ${node.color} | 
                    Size: ${node.textSize}
                </div>
            </div>
            <button class="delete-btn" onclick="deleteNode(${index}); event.stopPropagation();">
                🗑️ Delete
            </button>
        </div>
      `
      )
      .join("");
  };

  const selectNode = (index) => {
    document.querySelectorAll("#nodesContainer .list-item").forEach((item) => {
      item.classList.remove("selected");
    });

    const selectedItem = document.getElementById(`node-${index}`);
    if (selectedItem) selectedItem.classList.add("selected");

    setSelectedNodeIndex(index);
    if (selectedNodeIdRef.current) selectedNodeIdRef.current.value = graphData.nodes[index].id;
    if (nodeColorRef.current) nodeColorRef.current.value = graphData.nodes[index].color;
    if (nodeTextSizeRef.current) nodeTextSizeRef.current.value = graphData.nodes[index].textSize;
    if (nodeTextSizeValueRef.current) nodeTextSizeValueRef.current.textContent = graphData.nodes[index].textSize;
  };

  const updateSelectedNode = () => {
    if (selectedNodeIndex === null) {
      showAlert("Please select a node to update.", "error");
      return;
    }

    const newColor = nodeColorRef.current.value;
    const newSize = parseInt(nodeTextSizeRef.current.value);

    const updatedNodes = [...graphData.nodes];
    updatedNodes[selectedNodeIndex].color = newColor;
    updatedNodes[selectedNodeIndex].textSize = newSize;
    setGraphData((prevData) => ({ ...prevData, nodes: updatedNodes }));
    showAlert("Node updated successfully!", "success");
  };

  const deleteNode = (index) => {
    if (confirm(`Delete node "${graphData.nodes[index].id}"? This will also delete all connected links.`)) {
      const nodeIdToDelete = graphData.nodes[index].id;

      const updatedNodes = [...graphData.nodes];
      updatedNodes.splice(index, 1);

      const updatedLinks = graphData.links.filter(
        (link) =>
          (typeof link.source === "object" ? link.source.id : link.source) !== nodeIdToDelete &&
          (typeof link.target === "object" ? link.target.id : link.target) !== nodeIdToDelete
      );

      setGraphData({ nodes: updatedNodes, links: updatedLinks });
      setSelectedNodeIndex(null);
      if (selectedNodeIdRef.current) selectedNodeIdRef.current.value = "";
      showAlert("Node and connected links deleted successfully!", "success");
    }
  };

  const renderLinks = () => {
    const container = linksContainerRef.current;
    if (!container) return;

    if (graphData.links.length === 0) {
      container.innerHTML = `<div class="no-data">No links found in the current graph</div>`;
      return;
    }

    container.innerHTML = graphData.links
      .map(
        (link, index) => `
        <div class="list-item" onclick="selectLink(${index})" id="link-${index}">
            <div class="item-info">
                <div class="item-text">${typeof link.source === "object" ? link.source.id : link.source} → ${typeof link.target === "object" ? link.target.id : link.target}</div>
                <div class="item-details">
                    Color: <span style="color: ${link.color}">●</span> ${link.color} | 
                    Thickness: ${link.thickness}
                </div>
            </div>
            <button class="delete-btn" onclick="deleteLink(${index}); event.stopPropagation();">
                🗑️ Delete
            </button>
        </div>
      `
      )
      .join("");
  };

  const selectLink = (index) => {
    document.querySelectorAll("#linksContainer .list-item").forEach((item) => {
      item.classList.remove("selected");
    });

    const selectedItem = document.getElementById(`link-${index}`);
    if (selectedItem) selectedItem.classList.add("selected");
    setSelectedLinkIndex(index);
  };

  const deleteLink = (index) => {
    if (
      confirm(
        `Delete link "${typeof graphData.links[index].source === "object" ? graphData.links[index].source.id : graphData.links[index].source} → ${typeof graphData.links[index].target === "object" ? graphData.links[index].target.id : graphData.links[index].target}"?`
      )
    ) {
      const updatedLinks = [...graphData.links];
      updatedLinks.splice(index, 1);
      setGraphData((prevData) => ({ ...prevData, links: updatedLinks }));
      setSelectedLinkIndex(null);
      showAlert("Link deleted successfully!", "success");
    }
  };

  const applyToAllNodes = () => {
    const color = defaultColorRef.current.value;
    const size = parseInt(defaultSizeRef.current.value);

    const updatedNodes = graphData.nodes.map((node) => ({
      ...node,
      color: color,
      textSize: size,
    }));
    setGraphData((prevData) => ({ ...prevData, nodes: updatedNodes }));
    showAlert(`Applied color ${color} and size ${size} to all ${graphData.nodes.length} nodes!`, "success");
  };

  const saveJSON = () => {
    if (graphData.nodes.length === 0) {
      showAlert("No data to save. Please load a JSON file first.", "error");
      return;
    }

    const jsonString = JSON.stringify(graphData, null, 2);
    localStorage.setItem("graphData", jsonString);
    showAlert("Graph data saved to browser storage!", "success");
  };

  const downloadJSON = () => {
    if (graphData.nodes.length === 0) {
      showAlert("No data to download. Please load a JSON file first.", "error");
      return;
    }

    const jsonString = JSON.stringify(graphData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `graph-data-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showAlert("Graph data downloaded successfully!", "success");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          loadGraphData(data, file.name, file.size);
          showAlert("File loaded successfully!", "success");
        } catch (error) {
          showAlert("Error parsing JSON file: " + error.message, "error");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === "application/json") {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          loadGraphData(data, file.name, file.size);
          showAlert("File loaded successfully via drag & drop!", "success");
        } catch (error) {
          showAlert("Error parsing JSON file: " + error.message, "error");
        }
      };
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    updateStats();
    renderNodes();
    renderLinks();
  }, [graphData]);

  useEffect(() => {
    const savedData = localStorage.getItem("graphData");
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        loadGraphData(data);
        showAlert("Loaded previously saved data from browser storage", "success");
      } catch (error) {
        console.error("Error loading saved data:", error);
      }
    }

    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
    };
  }, []);

  return (
    <div className="container">
      <style>{`
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }

        .main-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            padding: 30px;
        }

        .panel {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 25px;
            border: 1px solid #e9ecef;
        }

        .panel h2 {
            color: #495057;
            margin-bottom: 20px;
            font-size: 1.4em;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
        }

        .file-input-group {
            margin-bottom: 20px;
        }

        .file-input-wrapper {
            position: relative;
            display: inline-block;
            width: 100%;
        }

        .file-input {
            position: absolute;
            opacity: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
        }

        .file-input-label {
            display: block;
            padding: 12px 20px;
            background: #007bff;
            color: white;
            border-radius: 8px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px dashed transparent;
        }

        .file-input-label:hover {
            background: #0056b3;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,123,255,0.3);
        }

        .file-info {
            margin-top: 10px;
            padding: 10px;
            background: #e3f2fd;
            border-radius: 5px;
            font-size: 0.9em;
            color: #1976d2;
        }

        .stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 20px 0;
        }

        .stat-card {
            background: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #dee2e6;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #007bff;
        }

        .stat-label {
            color: #6c757d;
            font-size: 0.9em;
            margin-top: 5px;
        }

        .list-container {
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            background: white;
        }

        .list-item {
            padding: 15px;
            border-bottom: 1px solid #f1f3f4;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .list-item:hover {
            background: #f8f9fa;
        }

        .list-item.selected {
            background: #e3f2fd;
            border-left: 4px solid #007bff;
        }

        .item-info {
            flex: 1;
        }

        .item-text {
            font-weight: 500;
            color: #495057;
            margin-bottom: 5px;
        }

        .item-details {
            font-size: 0.85em;
            color: #6c757d;
        }

        .delete-btn {
            background: #dc3545;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.85em;
            transition: all 0.2s ease;
        }

        .delete-btn:hover {
            background: #c82333;
            transform: scale(1.05);
        }

        .controls {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 20px;
        }

        .btn {
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1em;
            font-weight: 500;
            transition: all 0.3s ease;
            text-decoration: none;
            text-align: center;
            display: inline-block;
        }

        .btn-primary {
            background: #007bff;
            color: white;
        }

        .btn-primary:hover {
            background: #0056b3;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,123,255,0.3);
        }

        .btn-success {
            background: #28a745;
            color: white;
        }

        .btn-success:hover {
            background: #1e7e34;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(40,167,69,0.3);
        }

        .customization-panel {
            grid-column: 1 / -1;
            margin-top: 20px;
        }

        .form-group {
            margin-bottom: 15px;
        }

        .form-label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: #495057;
        }

        .form-control {
            width: 100%;
            padding: 10px;
            border: 1px solid #ced4da;
            border-radius: 5px;
            font-size: 1em;
        }

        .form-control:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }

        .color-input {
            width: 60px;
            height: 40px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }

        .range-input {
            width: 100%;
        }

        .alert {
            padding: 15px;
            margin: 15px 0;
            border-radius: 8px;
            font-weight: 500;
        }

        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .no-data {
            text-align: center;
            padding: 40px;
            color: #6c757d;
            font-style: italic;
        }

        @media (max-width: 768px) {
            .main-content {
                grid-template-columns: 1fr;
                gap: 20px;
                padding: 20px;
            }
            
            .controls {
                grid-template-columns: 1fr;
            }
            
            .stats {
                grid-template-columns: 1fr;
            }
        }
      `}</style>
      <div className="header">
        <h1>🔗 Graph Editor</h1>
        <p>Load JSON files, delete links, customize text, and save your changes</p>
      </div>

      <div className="main-content">
        {/* File Loading Panel */}
        <div className="panel">
          <h2>📁 Load Graph Data</h2>
          <div className="file-input-group">
            <div className="file-input-wrapper">
              <input type="file" id="fileInput" className="file-input" accept=".json" onChange={handleFileChange} ref={fileInputRef} />
              <label htmlFor="fileInput" className="file-input-label">
                Choose JSON File
              </label>
            </div>
            <div id="fileInfo" className="file-info" style={{ display: fileInfo ? "block" : "none" }} ref={fileInfoDivRef}>{fileInfo}</div>
          </div>

          <div className="stats">
            <div className="stat-card">
              <div className="stat-number" ref={nodeCountRef}>0</div>
              <div className="stat-label">Nodes</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" ref={linkCountRef}>0</div>
              <div className="stat-label">Links</div>
            </div>
          </div>

          <div className="controls">
            <button className="btn btn-primary" onClick={saveJSON}>💾 Save JSON</button>
            <button className="btn btn-success" onClick={downloadJSON}>⬇️ Download JSON</button>
          </div>
        </div>

        {/* Nodes Management Panel */}
        <div className="panel">
          <h2>Nodes</h2>
          <div id="nodesContainer" className="list-container" ref={nodesContainerRef}>
            <div className="no-data">
              Load a JSON file to see nodes here
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '20px' }}>
            <label className="form-label">Selected Node:</label>
            <input type="text" id="selectedNodeId" className="form-control" readOnly ref={selectedNodeIdRef} />
          </div>
          <div className="form-group">
            <label className="form-label">Node Color:</label>
            <input type="color" id="nodeColor" className="color-input" ref={nodeColorRef} />
          </div>
          <div className="form-group">
            <label className="form-label">Node Text Size:</label>
            <input type="range" id="nodeTextSize" className="range-input" min="4" max="20" defaultValue="6" onChange={(e) => nodeTextSizeValueRef.current.textContent = e.target.value} ref={nodeTextSizeRef} />
            <span id="nodeTextSizeValue" ref={nodeTextSizeValueRef}>6</span>
          </div>
          <div className="controls">
            <button className="btn btn-primary" onClick={updateSelectedNode}>Update Node</button>
            <button className="btn delete-btn" onClick={deleteNode}>Delete Node</button>
          </div>
        </div>

        {/* Links Management Panel */}
        <div className="panel">
          <h2>Links</h2>
          <div id="linksContainer" className="list-container" ref={linksContainerRef}>
            <div className="no-data">
              Load a JSON file to see links here
            </div>
          </div>
        </div>

        {/* Customization Panel */}
        <div className="panel customization-panel">
          <h2>🎨 Global Text Customization</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Default Text Color</label>
              <input type="color" id="defaultColor" className="color-input" defaultValue="#1A75FF" ref={defaultColorRef} />
            </div>
            <div className="form-group">
              <label className="form-label">Default Text Size</label>
              <input type="range" id="defaultSize" className="range-input" min="4" max="20" defaultValue="6" onChange={(e) => sizeValueRef.current.textContent = e.target.value} ref={defaultSizeRef} />
              <span id="sizeValue" ref={sizeValueRef}>6</span>
            </div>
            <div className="form-group">
              <label className="form-label">Apply to All Nodes</label>
              <button className="btn btn-primary" onClick={applyToAllNodes}>Apply Changes</button>
            </div>
          </div>
        </div>
      </div>

      <div id="alerts">
        {showAlerts.map((alert) => (
          <div key={alert.id} className={`alert alert-${alert.type}`}>
            {alert.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GraphEditor;


