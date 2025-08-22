const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const announcement = document.getElementById("announcement");

// STATE
let tileSize = 40;
let player = { x: 1, y: 1 };
let collectedKeys = 0;
let score = 0;
let timeLeft = 60;
let gameOver = false;
let victory = false;
let victoryTimer = 0;
let gameStarted = false;

// MAZE
const maze = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1],
  [1,1,1,0,1,1,1,1,1,1,0,1,0,1,1,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,1,0,1,1,1,1,1,0,1],
  [1,0,0,0,1,0,0,1,0,0,0,0,0,1,0,1],
  [1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1],
  [1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// ENTITIES
let keys = [{x:3,y:1},{x:6,y:5},{x:12,y:9}];
let doors = [{x:8,y:1,solved:false}];
let enemies = [
  {x:10,y:3,dir:1,axis:"x",speed:0.02,progress:0},
  {x:7,y:7,dir:-1,axis:"y",speed:0.015,progress:0},
  {x:12,y:11,dir:1,axis:"x",speed:0.01,progress:0},
  {x:4,y:9,dir:1,axis:"y",speed:0.02,progress:0}
];
let powerups = [
  {x:2,y:6,type:"time"},
  {x:7,y:3,type:"score"},
  {x:11,y:9,type:"time"}
];
let exit = {x:14, y:13};

// EFFECTS
let enemyPulse = 0;
let particles = [];
let portalParticles = [];
let playerTrail = [];
let victoryParticles = [];
let shakeOffset = {x:0, y:0};
let shakeIntensity = 0;

// TIMER
setInterval(()=>{
    if(gameStarted && !gameOver && !victory){
        timeLeft--;
        if(timeLeft<=0) gameOver=true;
    }
},1000);

// --- PORTAL, ENEMIES, COLLECTIBLES, DRAW FUNCTIONS ---
// [Use the same full code from previous polished version here]
// This includes: drawPortal, portalPull, moveEnemies, checkCollectibles, movePlayer, restartGame

// --- INPUT ---
// Keyboard
document.addEventListener("keydown",e=>{
    if(!gameStarted && e.key==="Enter") gameStarted=true;
    if(gameOver||victory||!gameStarted) return;
    let nx=Math.round(player.x), ny=Math.round(player.y);
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault();
    if(e.key==="ArrowUp") ny--;
    if(e.key==="ArrowDown") ny++;
    if(e.key==="ArrowLeft") nx--;
    if(e.key==="ArrowRight") nx++;
    if(maze[ny] && maze[ny][nx]===0){ player.x=nx; player.y=ny; checkCollectibles(); }
    if(e.key==="r"||e.key==="R") restartGame();
});

// Touch buttons
document.getElementById("up").addEventListener("touchstart",()=>movePlayer(0,-1));
document.getElementById("down").addEventListener("touchstart",()=>movePlayer(0,1));
document.getElementById("left").addEventListener("touchstart",()=>movePlayer(-1,0));
document.getElementById("right").addEventListener("touchstart",()=>movePlayer(1,0));

// Swipe
let touchStartX=0, touchStartY=0, swipeThreshold=30;
canvas.addEventListener("touchstart",e=>{ const t=e.touches[0]; touchStartX=t.clientX; touchStartY=t.clientY; });
canvas.addEventListener("touchend",e=>{
    if(!gameStarted) { gameStarted=true; return; }
    const t=e.changedTouches[0]; let dx=t.clientX-touchStartX; let dy=t.clientY-touchStartY;
    if(Math.abs(dx)>Math.abs(dy)){
        if(dx>swipeThreshold) movePlayer(1,0);
        else if(dx<-swipeThreshold) movePlayer(-1,0);
    } else {
        if(dy>swipeThreshold) movePlayer(0,1);
        else if(dy<-swipeThreshold) movePlayer(0,-1);
    }
});

// --- DRAW ---
function drawMaze(){
    if(!gameStarted){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle="#0ff"; ctx.font="50px monospace"; ctx.textAlign="center";
        ctx.fillText("ESCAPE THE LOOP",canvas.width/2,canvas.height/2-40);
        ctx.font="24px monospace"; ctx.fillText("Press Enter or Tap to Start",canvas.width/2,canvas.height/2+20);
        return;
    }
    if(gameOver && !victory){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle="#ff5555"; ctx.font="50px monospace"; ctx.textAlign="center";
        ctx.fillText("GAME OVER",canvas.width/2,canvas.height/2-20);
        ctx.font="24px monospace"; ctx.fillText("Press R to Restart",canvas.width/2,canvas.height/2+30);
        return;
    }
    // Rest of drawMaze from previous polished version goes here
}

// --- GAME LOOP ---
function gameLoop(){ enemyPulse+=0.05; if(gameStarted && !gameOver && !victory){ moveEnemies(); portalPull(); spawnPortalParticles(); } drawMaze(); requestAnimationFrame(gameLoop); }
gameLoop();
