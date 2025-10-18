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
  }

  if (currentMode === "end") {
    if (node === startNode) return alert("Bitiş ve başlangıç aynı olamaz!");
    if (endNode) endNode.cell.classList.remove("end");
    node.wall = false;
    node.cell.className = "cell end";
    endNode = node;
    if (pathFound) clearSolution();
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
}

// --- Heuristic (Manhattan) ---
function heuristic(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

// --- A* Animation ---
function animateAStar(start, end) {
  const openSet = [start];
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();
  const visited = [];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const n = grid[r][c];
      gScore.set(n, Infinity);
      fScore.set(n, Infinity);
    }
  }

  gScore.set(start, 0);
  fScore.set(start, heuristic(start, end));

  const visitedCount = { count: 0 };

  interval = setInterval(() => {
    if (openSet.length === 0) {
      clearInterval(interval);
      infoEl.textContent = "❌ Yol bulunamadı";
      pathFound = false;
      return;
    }

    // En düşük fScore'u bul
    let currentIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (fScore.get(openSet[i]) < fScore.get(openSet[currentIdx]))
        currentIdx = i;
    }

    const current = openSet.splice(currentIdx, 1)[0];
    visited.push(current);
    visitedCount.count++;

    if (current !== start && current !== end)
      current.cell.classList.add("visited");

    if (current === end) {
      clearInterval(interval);
      const path = [];
      let cur = current;
      while (cameFrom.has(cur)) {
        path.push(cur);
        cur = cameFrom.get(cur);
      }
      path.reverse();
      drawPathAnimated(path, visitedCount.count);
      return;
    }

    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    for (const [dr, dc] of dirs) {
      const nr = current.row + dr;
      const nc = current.col + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      const neighbor = grid[nr][nc];
      if (neighbor.wall) continue;

      const tentativeG = gScore.get(current) + 1;
      if (tentativeG < gScore.get(neighbor)) {
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeG);
        fScore.set(neighbor, tentativeG + heuristic(neighbor, end));
        if (!openSet.includes(neighbor)) openSet.push(neighbor);
      }
    }
  }, 30 / speedMultiplier);
}

function drawPathAnimated(path, visitedCount) {
  let i = 0;
  pathFound = true;
  const pathInterval = setInterval(() => {
    if (i >= path.length) {
      clearInterval(pathInterval);
      infoEl.textContent = `✅ İncelenen düğüm: ${visitedCount}, Yol uzunluğu: ${path.length}`;
      return;
    }
    const n = path[i];
    if (n !== startNode && n !== endNode) n.cell.classList.add("path");
    i++;
  }, 40 / speedMultiplier);
}
