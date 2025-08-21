// ==== Escape The Loop - Final Polished Build ====

document.title = "Escape The Loop";

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Config & State ---
const tileSize = 40;
let score = 0;
let timer = 60;
let puzzleActive = false;

// Smooth movement
let playerPos = { x: 1, y: 1, offsetX: 0, offsetY: 0 };
let moveTarget = null;

// Anim clocks
let scoreFlash = 0;
let enemyPulse = 0;
let stepCycle = 0;

// End screens
let gameOver = false;
let victory = false;
let endScreenAlpha = 0;

// Camera shake
let shakeOffset = { x: 0, y: 0 };
let shakeIntensity = 0;

// Particles
let particles = [];

// Intervals
let timerInterval = null;
let enemyInterval = null;

// --- Maze (0 empty, 1 wall) ---
const maze = [
 [1,1,1,1,1,1,1,1,1,1],
 [1,0,0,0,1,0,0,0,0,1],
 [1,0,1,0,1,0,1,1,0,1],
 [1,0,1,0,0,0,0,1,0,1],
 [1,0,1,1,1,1,0,1,0,1],
 [1,0,0,0,0,1,0,0,0,1],
 [1,1,1,1,0,1,1,1,0,1],
 [1,0,0,1,0,0,0,1,0,1],
 [1,0,0,0,0,1,0,0,0,1],
 [1,1,1,1,1,1,1,1,1,1]
];

// Entities
let player = { x: 1, y: 1, keys: 0 };
let exit = { x: 8, y: 8 };
let keys = [{ x: 3, y: 1 }, { x: 6, y: 5 }];
let powerups = [{ x: 2, y: 6, type: 'time' }, { x: 7, y: 3, type: 'key' }];
let enemies = [{ x: 4, y: 1, dx: 0, dy: 0 }, { x: 5, y: 7, dx: 0, dy: 0 }];

// Puzzle doors
let doors = [
  { x: 4, y: 3, solved: false },
  { x: 6, y: 7, solved: false }
];

// --- Core Draw ---
function drawMaze() {
  // Camera shake
  if (shakeIntensity > 0) {
    shakeOffset.x = (Math.random() - 0.5) * shakeIntensity;
    shakeOffset.y = (Math.random() - 0.5) * shakeIntensity;
    shakeIntensity *= 0.9;
  } else {
    shakeOffset.x = 0; shakeOffset.y = 0;
  }
  ctx.save();
  ctx.translate(shakeOffset.x, shakeOffset.y);

  // Floor
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Walls (brick outline)
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[0].length; x++) {
      if (maze[y][x] === 1) {
        ctx.fillStyle = '#2b2b2f';
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        ctx.strokeStyle = "#3b3b45";
        ctx.lineWidth = 2;
        ctx.strokeRect(x * tileSize + 2, y * tileSize + 2, tileSize - 4, tileSize - 4);
      }
    }
  }

  // Ambient glow around enemies
  enemies.forEach((e, i) => {
    let glowSize = 18 + Math.sin(enemyPulse * 3 + i) * 4;
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,50,50,0.08)';
    ctx.arc(e.x * tileSize + tileSize / 2, e.y * tileSize + tileSize / 2, glowSize, 0, 2 * Math.PI);
    ctx.fill();
  });

  // Keys (gold coin + sparkle)
  keys.forEach((k, i) => {
    const cx = k.x * tileSize + tileSize / 2;
    const cy = k.y * tileSize + tileSize / 2;
    ctx.fillStyle = 'gold';
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.fillRect(cx - 2, cy - 8, 4, 8);

    // sparkle
    const sparkleAngle = enemyPulse * 0.2 + i;
    const sparkleSize = 4 + Math.sin(enemyPulse * 5 + i) * 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(sparkleAngle);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-sparkleSize, 0); ctx.lineTo(sparkleSize, 0);
    ctx.moveTo(0, -sparkleSize); ctx.lineTo(0, sparkleSize);
    ctx.stroke();
    ctx.restore();
  });

  // Power-ups (glowing orbs)
  powerups.forEach((p, i) => {
    const cx = p.x * tileSize + tileSize / 2;
    const cy = p.y * tileSize + tileSize / 2;
    const pulse = 12 + Math.sin(enemyPulse * 3 + i) * 3;

    ctx.beginPath();
    ctx.fillStyle = p.type === 'time' ? 'rgba(0,170,255,0.25)' : 'rgba(0,255,85,0.25)';
    ctx.arc(cx, cy, pulse, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = p.type === 'time' ? '#00aaff' : '#00ff55';
    ctx.arc(cx, cy, 10, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.arc(cx - 3, cy - 3, 3, 0, 2 * Math.PI);
    ctx.fill();
  });

  // Doors (glowing unsolved)
  doors.forEach(d => {
    const cx = d.x * tileSize + tileSize / 2;
    const cy = d.y * tileSize + tileSize / 2;
    if (!d.solved) {
      const glowSize = 18 + Math.sin(enemyPulse * 3) * 3;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,140,0,0.28)';
      ctx.arc(cx, cy, glowSize, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.fillStyle = d.solved ? '#44ff44' : '#ff8800';
    ctx.fillRect(d.x * tileSize + 6, d.y * tileSize + 6, 28, 28);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeRect(d.x * tileSize + 6, d.y * tileSize + 6, 28, 28);
  });

  // Enemies (wobbling slimes)
  enemies.forEach((e, i) => {
    const wob = Math.sin(enemyPulse * 3 + i) * 4;
    const a = 12 + wob;   // x radius
    const b = 12 - wob;   // y radius
    const cx = e.x * tileSize + tileSize / 2;
    const cy = e.y * tileSize + tileSize / 2;

    ctx.fillStyle = '#ff3333';
    ctx.beginPath();
    ctx.ellipse(cx, cy, a, b, 0, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Exit (swirling glowing vortex)
  const ex = exit.x * tileSize + tileSize / 2;
  const ey = exit.y * tileSize + tileSize / 2;

  // subtle background glow
  ctx.beginPath();
  ctx.fillStyle = 'rgba(120,120,255,0.10)';
  ctx.arc(ex, ey, 26, 0, 2 * Math.PI);
  ctx.fill();

  for (let i = 0; i < 5; i++) {
    const angle = enemyPulse * 0.1 + i;
    const radius = 10 + i * 4 + Math.sin(enemyPulse * 0.3 + i) * 2;
    ctx.beginPath();
    ctx.strokeStyle = `hsl(${(enemyPulse * 20 + i * 60) % 360}, 100%, 60%)`;
    ctx.lineWidth = 2;
    ctx.arc(ex, ey, radius, angle, angle + Math.PI / 1.5);
    ctx.stroke();
  }
  let glow = Math.floor(150 + 100 * Math.sin(enemyPulse * 2));
  ctx.fillStyle = `rgb(${glow},${glow},255)`;
  ctx.beginPath();
  ctx.arc(ex, ey, 8 + Math.sin(enemyPulse * 0.5) * 2, 0, 2 * Math.PI);
  ctx.fill();

  // Player (cyan block with bounce)
  const drawX = playerPos.x * tileSize + playerPos.offsetX;
  const drawY = playerPos.y * tileSize + playerPos.offsetY;
  const bounce = Math.abs(Math.sin(stepCycle / 5)) * 4;

  ctx.fillStyle = '#00ffff';
  ctx.fillRect(drawX + 6, drawY + 6 + bounce, 28, 28 - bounce);
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.strokeRect(drawX + 6, drawY + 6 + bounce, 28, 28 - bounce);

  // Particles (key pickup)
  particles.forEach((p, idx) => {
    ctx.fillStyle = `rgba(255,255,100,${p.alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
    ctx.fill();

    p.x += p.dx;
    p.y += p.dy;
    p.alpha -= 0.02;
    if (p.alpha <= 0) particles.splice(idx, 1);
  });

  // HUD (neon bar)
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, canvas.width, 40);
  ctx.font = '20px monospace';
  ctx.textBaseline = 'middle';

  const hud = [
    { text: `🔑 ${player.keys}`, color: 'gold' },
    { text: `💎 ${score}`, color: '#00ffcc' },
    { text: `⏳ ${timer}`, color: '#00aaff' }
  ];

  hud.forEach((item, i) => {
    ctx.fillStyle = item.color;
    ctx.shadowColor = item.color;
    ctx.shadowBlur = scoreFlash > 0 ? 10 : 6;
    ctx.fillText(item.text, 20 + i * 140, 20);
  });
  ctx.shadowBlur = 0;

  // End drawing (world)
  ctx.restore();

  // End screens (draw without shake)
  if (gameOver || victory) {
    endScreenAlpha = Math.min(endScreenAlpha + 0.02, 1);
    ctx.fillStyle = `rgba(0,0,0,${0.7 * endScreenAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (gameOver) {
      ctx.fillStyle = `rgba(255,60,60,${endScreenAlpha})`;
      ctx.shadowColor = 'red';
      ctx.shadowBlur = 30;
      ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 10);
    }
    if (victory) {
      ctx.fillStyle = `rgba(60,255,120,${endScreenAlpha})`;
      ctx.shadowColor = 'lime';
      ctx.shadowBlur = 30;
      ctx.fillText("ESCAPE SUCCESS!", canvas.width / 2, canvas.height / 2 - 10);
    }

    ctx.shadowBlur = 0;
    ctx.font = '20px monospace';
    ctx.fillStyle = `rgba(255,255,255,${endScreenAlpha})`;
    ctx.fillText("Press R to Restart", canvas.width / 2, canvas.height / 2 + 36);
    ctx.textAlign = 'left';
  }
}

// --- Movement ---
function movePlayer(dx, dy) {
  if (puzzleActive || moveTarget || gameOver || victory) return;
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (maze[ny][nx] === 1) return;

  moveTarget = { x: nx, y: ny, offsetX: -dx * tileSize, offsetY: -dy * tileSize };
  player.x = nx; player.y = ny;
  stepCycle = 0; // start walk anim
}

function update() {
  // Smooth slide
  if (moveTarget) {
    playerPos.offsetX += moveTarget.offsetX * 0.2;
    playerPos.offsetY += moveTarget.offsetY * 0.2;
    if (Math.abs(playerPos.offsetX) < 0.5 && Math.abs(playerPos.offsetY) < 0.5) {
      playerPos.offsetX = 0; playerPos.offsetY = 0; moveTarget = null;
      checkCollectibles(); // settle tile triggers
    }
  }

  // Anim clocks
  enemyPulse += 0.1;
  if (scoreFlash > 0) scoreFlash -= 0.05;
  stepCycle++;

  drawMaze();
  requestAnimationFrame(update);
}

// --- Collectibles & Puzzles ---
function checkCollectibles() {
  // Keys
  const kIndex = keys.findIndex(k => k.x === player.x && k.y === player.y);
  if (kIndex >= 0) {
    player.keys++;
    keys.splice(kIndex, 1);
    score += 5;
    scoreFlash = 1;

    // particles
    for (let i = 0; i < 10; i++) {
      particles.push({
        x: player.x * tileSize + tileSize / 2,
        y: player.y * tileSize + tileSize / 2,
        dx: (Math.random() - 0.5) * 2,
        dy: -Math.random() * 2 - 1,
        alpha: 1,
        size: 2 + Math.random() * 2
      });
    }
  }

  // Powerups
  const pIndex = powerups.findIndex(p => p.x === player.x && p.y === player.y);
  if (pIndex >= 0) {
    const p = powerups[pIndex];
    if (p.type === 'time') timer += 15;
    else if (p.type === 'key') player.keys++;
    powerups.splice(pIndex, 1);
    scoreFlash = 1;
  }

  // Puzzle doors
  const door = doors.find(d => d.x === player.x && d.y === player.y && !d.solved);
  if (door) {
    puzzleActive = true;
    let solved = false;
    const type = Math.floor(Math.random() * 3);

    if (type === 0) {
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      const ans = prompt(`Escape The Loop Puzzle!\nSolve: ${a} + ${b} = ?`);
      if (parseInt(ans, 10) === a + b) solved = true;
    } else if (type === 1) {
      const num = Math.floor(Math.random() * 5) + 1;
      const ans = prompt(`Escape The Loop Puzzle!\nGuess a number 1–5`);
      if (parseInt(ans, 10) === num) solved = true;
    } else {
      const num = Math.floor(Math.random() * 20) + 1;
      const ans = (prompt(`Escape The Loop Puzzle!\nIs ${num} odd or even?`).trim() || "").toLowerCase();
      if ((num % 2 === 0 && ans === "even") || (num % 2 !== 0 && ans === "odd")) solved = true;
    }

    if (solved) {
      alert("Correct! You may pass.");
      score += 10;
      door.solved = true;
    } else {
      alert("Wrong! You cannot pass.");
      // Nudge player back one tile (no fancy calc—try 4 dirs)
      const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      for (const [dx, dy] of dirs) {
        const bx = player.x + dx, by = player.y + dy;
        if (bx >= 0 && by >= 0 && bx < maze[0].length && by < maze.length && maze[by][bx] === 0) {
          player.x = bx; player.y = by;
          break;
        }
      }
      playerPos = { x: player.x, y: player.y, offsetX: 0, offsetY: 0 };
    }
    puzzleActive = false;
  }

  // Exit
  if (player.x === exit.x && player.y === exit.y && !gameOver && !victory) {
    victory = true;
    stopIntervals();
  }
}

// --- Enemies ---
function moveEnemies() {
  if (gameOver || victory) return;
  enemies.forEach(e => {
    if (Math.random() < 0.3) {
      const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
      if (maze[e.y + dy][e.x + dx] === 0) { e.dx = dx; e.dy = dy; }
    }
    const nx = e.x + e.dx, ny = e.y + e.dy;
    if (maze[ny][nx] === 0) { e.x = nx; e.y = ny; }

    // Collision with player
    if (e.x === player.x && e.y === player.y) {
      score = Math.max(0, score - 10);
      player.x = 1; player.y = 1;
      playerPos = { x: 1, y: 1, offsetX: 0, offsetY: 0 };
      shakeIntensity = 8; // camera shake
    }
  });
}

// --- Timers ---
function startIntervals() {
  stopIntervals();
  timerInterval = setInterval(() => {
    if (!puzzleActive && !gameOver && !victory) {
      timer--;
      if (timer <= 0) {
        timer = 0;
        gameOver = true;
        stopIntervals();
      }
    }
  }, 1000);

  enemyInterval = setInterval(() => {
    moveEnemies();
  }, 500);
}

function stopIntervals() {
  if (timerInterval) clearInterval(timerInterval);
  if (enemyInterval) clearInterval(enemyInterval);
  timerInterval = enemyInterval = null;
}

// --- Controls ---
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp') movePlayer(0, -1);
  if (e.key === 'ArrowDown') movePlayer(0, 1);
  if (e.key === 'ArrowLeft') movePlayer(-1, 0);
  if (e.key === 'ArrowRight') movePlayer(1, 0);
});

// Restart key
document.addEventListener('keydown', e => {
  if ((e.key === 'r' || e.key === 'R') && (gameOver || victory)) {
    restartGame();
  }
});

// --- Restart ---
function restartGame() {
  // Reset entities
  player = { x: 1, y: 1, keys: 0 };
  playerPos = { x: 1, y: 1, offsetX: 0, offsetY: 0 };
  score = 0;
  timer = 60;
  puzzleActive = false;
  gameOver = false;
  victory = false;
  endScreenAlpha = 0;
  moveTarget = null;
  particles = [];

  keys = [{ x: 3, y: 1 }, { x: 6, y: 5 }];
  powerups = [{ x: 2, y: 6, type: 'time' }, { x: 7, y: 3, type: 'key' }];
  doors.forEach(d => d.solved = false);
  enemies = [{ x: 4, y: 1, dx: 0, dy: 0 }, { x: 5, y: 7, dx: 0, dy: 0 }];

  startIntervals();
}

// --- Boot ---
startIntervals();
update();
