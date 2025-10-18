const gridEl = document.getElementById("grid");
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const wallBtn = document.getElementById("wallBtn");
const solveBtn = document.getElementById("solveBtn");
const clearSolutionBtn = document.getElementById("clearSolutionBtn");
const clearBtn = document.getElementById("clearBtn");
const infoEl = document.getElementById("info");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const speedSlider = document.getElementById("speedSlider");
const speedValue = document.getElementById("speedValue");
const rowSize = document.getElementById("rowsInput");
const colSize = document.getElementById("colsInput");
const resizeGridBtn = document.getElementById("resizeGridBtn");

const altBtn = document.getElementById("altBtn");

let ROWS = 20;
let COLS = 20;

let grid = [];
let startNode = null;
let endNode = null;
let currentMode = null;
let pathFound = false;
let interval = null;
let isMouseDown = false;
let speedMultiplier = 1;

// Alternative paths variables
let allOptimalPaths = [];
let currentPathIndex = 0;
let visitedNodes = [];

// Speed control
speedSlider.addEventListener("input", () => {
  speedMultiplier = parseInt(speedSlider.value);
  speedValue.textContent = `${speedMultiplier}x`;
});

// --- Grid Creation ---
function createGrid(rows = 20, cols = 20) {
  gridEl.innerHTML = "";
  grid = [];

  // Update CSS grid (no inline size styling)
  gridEl.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = r;
      cell.dataset.col = c;

      cell.addEventListener("mousedown", () => {
        isMouseDown = true;
        handleCellClick(r, c);
      });
      cell.addEventListener("mouseenter", () => {
        if (isMouseDown && currentMode === "wall") handleCellClick(r, c);
      });
      cell.addEventListener("mouseup", () => (isMouseDown = false));

      gridEl.appendChild(cell);
      grid[r][c] = { row: r, col: c, wall: false, cell };
    }
  }

  document.body.addEventListener("mouseup", () => (isMouseDown = false));
}

createGrid(ROWS, COLS); // default 20x20 grid

// --- Mode Selection ---
function setMode(mode) {
  currentMode = mode;
  [startBtn, endBtn, wallBtn].forEach((b) =>
    b.classList.toggle("active", b.id === mode + "Btn")
  );
}

startBtn.onclick = () => setMode("start");
endBtn.onclick = () => setMode("end");
wallBtn.onclick = () => setMode("wall");

// --- Button Actions ---
solveBtn.onclick = () => {
  clearSolution();
  if (!startNode || !endNode) {
    alert("Lütfen başlangıç ve bitiş noktalarını seçin!");
    return;
  }
  animateAStar(startNode, endNode);
};

clearSolutionBtn.onclick = clearSolution;
clearBtn.onclick = clearAll;

// Alternative path button
altBtn.onclick = () => {
  if (allOptimalPaths.length > 0) {
    currentPathIndex = (currentPathIndex + 1) % allOptimalPaths.length;
    showPath(currentPathIndex);
  }
};

// Theme toggle
themeToggleBtn.onclick = () => {
  document.body.classList.toggle("dark");
  themeToggleBtn.textContent = document.body.classList.contains("dark")
    ? "☀️ Gündüz Modu"
    : "🌙 Gece Modu";
};

// --- Resize Grid ---
resizeGridBtn.onclick = () => {
  const newRows = parseInt(rowSize.value);
  const newCols = parseInt(colSize.value);

  if (isNaN(newRows) || isNaN(newCols) || newRows < 5 || newCols < 5) {
    alert("Geçerli bir boyut girin (5-50 arası)!");
    return;
  }

  ROWS = newRows;
  COLS = newCols;

  clearInterval(interval);
  startNode = null;
  endNode = null;
  pathFound = false;
  infoEl.textContent = "";
  createGrid(ROWS, COLS);
  resetAlternativePaths();
};

// --- Cell Interaction ---
function handleCellClick(r, c) {
  const node = grid[r][c];
  if (!currentMode) return;

  if (currentMode === "start") {
    if (node === endNode) return alert("Başlangıç ve bitiş aynı olamaz!");
    if (startNode) startNode.cell.classList.remove("start");
    node.wall = false;
    node.cell.className = "cell start";
    startNode = node;
    if (pathFound) clearSolution();
    resetAlternativePaths();
  }

  if (currentMode === "end") {
    if (node === startNode) return alert("Bitiş ve başlangıç aynı olamaz!");
    if (endNode) endNode.cell.classList.remove("end");
    node.wall = false;
    node.cell.className = "cell end";
    endNode = node;
    if (pathFound) clearSolution();
    resetAlternativePaths();
  }

  if (currentMode === "wall") {
    if (node === startNode || node === endNode) return;
    node.wall = !node.wall;
    node.cell.classList.toggle("wall", node.wall);
    if (
      pathFound &&
      (node.cell.classList.contains("path") || node.cell.classList.contains("visited"))
    )
      clearSolution();
    resetAlternativePaths();
  }
}

// --- Clear Functions ---
function clearSolution() {
  clearInterval(interval);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      grid[r][c].cell.classList.remove("path", "visited");
    }
  }
  infoEl.textContent = "";
  pathFound = false;
  resetAlternativePaths();
}

function clearAll() {
  clearInterval(interval);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      grid[r][c].wall = false;
      grid[r][c].cell.className = "cell";
    }
  }
  startNode = null;
  endNode = null;
  currentMode = null;
  infoEl.textContent = "";
  pathFound = false;
  resetAlternativePaths();
}

// --- Alternative Path Functions ---
function resetAlternativePaths() {
  allOptimalPaths = [];
  currentPathIndex = 0;
  visitedNodes = [];
  altBtn.disabled = true;
}

function enableAlternativePathsButton() {
  if (allOptimalPaths.length > 1) {
    altBtn.disabled = false;
  } else {
    altBtn.disabled = true;
  }
}

function showPath(index) {
  // Clear previous path
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c].cell.classList.contains("path")) {
        grid[r][c].cell.classList.remove("path");
      }
    }
  }
  
  // Show new path
  const path = allOptimalPaths[index];
  for (const node of path) {
    if (node !== startNode && node !== endNode) {
      node.cell.classList.add("path");
    }
  }
  
  infoEl.textContent = `✅ İncelenen düğüm: ${visitedNodes.length}, Yol uzunluğu: ${path.length} (Yol ${index + 1}/${allOptimalPaths.length})`;
}

// --- Heuristic (Manhattan) ---
function heuristic(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

// --- Animated A* Algorithm ---
function animateAStar(start, end) {
  resetAlternativePaths();
  
  const openSet = [start];
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();
  const closedSet = new Set();
  let visitedCount = 0;

  // Initialize scores
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const node = grid[r][c];
      gScore.set(node, Infinity);
      fScore.set(node, Infinity);
    }
  }

  gScore.set(start, 0);
  fScore.set(start, heuristic(start, end));

  let animationStep = 0;
  
  interval = setInterval(() => {
    if (openSet.length === 0) {
      clearInterval(interval);
      infoEl.textContent = "❌ Yol bulunamadı";
      pathFound = false;
      return;
    }

    // Find node with lowest fScore
    let currentIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (fScore.get(openSet[i]) < fScore.get(openSet[currentIdx])) {
        currentIdx = i;
      }
    }

    const current = openSet.splice(currentIdx, 1)[0];
    closedSet.add(current);
    visitedCount++;

    // Animate visited node
    if (current !== start && current !== end) {
      current.cell.classList.add("visited");
    }

    if (current === end) {
      clearInterval(interval);
      const path = reconstructPath(cameFrom, current);
      visitedNodes = Array.from(closedSet);
      allOptimalPaths.push(path);
      
      // Find alternative paths after animation completes
      setTimeout(() => {
        findAlternativePaths(start, end, path.length);
        showPath(0);
        pathFound = true;
        enableAlternativePathsButton();
      }, 100);
      return;
    }

    // Explore neighbors
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dr, dc] of dirs) {
      const nr = current.row + dr;
      const nc = current.col + dc;
      
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      
      const neighbor = grid[nr][nc];
      if (neighbor.wall || closedSet.has(neighbor)) continue;

      const tentativeG = gScore.get(current) + 1;
      
      if (tentativeG < gScore.get(neighbor)) {
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeG);
        fScore.set(neighbor, tentativeG + heuristic(neighbor, end));
        
        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        }
      }
    }
    
    animationStep++;
  }, 100 / speedMultiplier); // Speed multiplier applied here
}

function reconstructPath(cameFrom, current) {
  const path = [];
  while (cameFrom.has(current)) {
    path.push(current);
    current = cameFrom.get(current);
  }
  path.push(current);
  return path.reverse();
}

function findAlternativePaths(start, end, targetLength) {
  const originalPath = allOptimalPaths[0];
  
  // Try to find alternative paths by excluding one node from the original path at a time
  for (let i = 1; i < originalPath.length - 1; i++) {
    const nodeToBlock = originalPath[i];
    
    // Temporarily block this node
    const wasWall = nodeToBlock.wall;
    nodeToBlock.wall = true;
    
    // Run A* with this node blocked (non-animated for performance)
    const result = runQuickAStar(start, end);
    
    // Restore the node
    nodeToBlock.wall = wasWall;
    
    if (result.found && result.path.length === targetLength) {
      // Check if this is a new path
      if (!isDuplicatePath(result.path)) {
        allOptimalPaths.push(result.path);
        
        // Limit to reasonable number of alternative paths, decides how many optimal paths to store
        if (allOptimalPaths.length >= 20) break;
      }
    }
  }
}

function runQuickAStar(start, end) {
  const openSet = [start];
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();
  const closedSet = new Set();

  // Initialize scores
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const node = grid[r][c];
      gScore.set(node, Infinity);
      fScore.set(node, Infinity);
    }
  }

  gScore.set(start, 0);
  fScore.set(start, heuristic(start, end));

  while (openSet.length > 0) {
    // Find node with lowest fScore
    let currentIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (fScore.get(openSet[i]) < fScore.get(openSet[currentIdx])) {
        currentIdx = i;
      }
    }

    const current = openSet.splice(currentIdx, 1)[0];
    closedSet.add(current);

    if (current === end) {
      const path = reconstructPath(cameFrom, current);
      return { found: true, path: path, length: path.length };
    }

    // Explore neighbors
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dr, dc] of dirs) {
      const nr = current.row + dr;
      const nc = current.col + dc;
      
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      
      const neighbor = grid[nr][nc];
      if (neighbor.wall || closedSet.has(neighbor)) continue;

      const tentativeG = gScore.get(current) + 1;
      
      if (tentativeG < gScore.get(neighbor)) {
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeG);
        fScore.set(neighbor, tentativeG + heuristic(neighbor, end));
        
        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  return { found: false, path: [], length: Infinity };
}

function isDuplicatePath(newPath) {
  for (const existingPath of allOptimalPaths) {
    if (existingPath.length !== newPath.length) continue;
    
    let isSame = true;
    for (let i = 0; i < newPath.length; i++) {
      if (newPath[i] !== existingPath[i]) {
        isSame = false;
        break;
      }
    }
    
    if (isSame) return true;
  }
  return false;
}