# Git Push Instructions

## Steps to Push Your 3D Node Visualization to GitHub

### 1. Initialize Git Repository (if not already done)
```bash
cd /home/ubuntu/node-visualization
git init
```

### 2. Configure Git (replace with your details)
```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### 3. Add Remote Repository
```bash
git remote add origin https://github.com/flyaminaaichour-web/new.git
```

### 4. Add All Files
```bash
git add .
```

### 5. Create Initial Commit
```bash
git commit -m "Add 3D Node Graph Visualization with dynamic link positioning

Features:
- Dynamic link positioning that moves with nodes
- Load JSON files with dedicated Load File button
- Interactive 3D visualization with drag and drop
- Add/remove nodes functionality
- Save graph data to JSON
- Real-time link redrawing using linkPositionUpdate
- Sample data included for testing"
```

### 6. Push to GitHub
```bash
git push -u origin main
```

If you encounter authentication issues, you may need to use your personal access token:
```bash
git remote set-url origin https://flyaminaaichour-web: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@github.com/flyaminaaichour-web/new.git
git push -u origin main
```

### Alternative: Using GitHub CLI (if installed)
```bash
gh auth login
gh repo create flyaminaaichour-web/new --public
git push -u origin main
```

## Project Structure Being Pushed

```
node-visualization/
├── public/
├── src/
│   ├── components/ui/     # shadcn/ui components
│   ├── App.jsx           # Main application with 3D visualization
│   ├── App.css           # Styles
│   └── main.jsx          # Entry point
├── sample-graph.json     # Sample data for testing
├── README.md            # Documentation
├── package.json         # Dependencies
└── git-push-instructions.md  # This file
```

## Key Features Implemented

✅ **Dynamic Link Positioning**: Links automatically redraw when nodes move
✅ **Load File Button**: Dedicated button to load JSON graph data
✅ **3D Visualization**: Interactive 3D graph with drag and drop
✅ **Node Management**: Add new nodes with custom IDs
✅ **Data Export**: Save current graph state to JSON
✅ **Sample Data**: Included sample JSON file for testing

The core innovation is the `linkPositionUpdate` function that ensures links are redrawn in real-time as nodes are repositioned, rather than using fixed coordinates.

