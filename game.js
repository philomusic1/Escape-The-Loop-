const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const announcement = document.getElementById("announcement");

// STATE
let tileSize = 40;
let player = { x: 1, y: 1, px: 1*40+20, py: 1*40+20 }; // add pixel position
let collectedKeys = 0;
let score = 0;
let timeLeft = 60;
let gameOver = false;
let victory = false;
let gameStarted = false;
let beingPulled = false; // portal pull state

// MAZE (1 = wall, 0 = path)
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
  {x:10,y:3,dir:1,axis:"x",speed:0.01,progress:0},
  {x:7,y:7,dir:-1,axis:"y",speed:0.008,progress:0},
  {x:12,y:11,dir:1,axis:"x",speed:0.01,progress:0},
  {x:4,y:9,dir:1,axis:"y",speed:0.009,progress:0}
];
let powerups = [
  {x:2,y:6,type:"time"},
  {x:7,y:3,type:"score"},
  {x:11,y:9,type:"time"}
];
let exit = {x:14, y:13};

// EFFECTS
let portalParticles = [];
for (let i = 0; i < 40; i++) {
  portalParticles.push({
    angle: Math.random() * Math.PI * 2,
    radius: Math.random() * 18 + 5,
    speed: 0.02 + Math.random() * 0.02
  });
}

// TIMER
setInterval(()=>{
    if(gameStarted && !gameOver && !victory){
        timeLeft--;
        if(timeLeft<=0) gameOver=true;
    }
},1000);

// ----------------- FUNCTIONS -----------------
function movePlayer(dx, dy){
    if(gameOver || victory || beingPulled) return;
    let nx = Math.round(player.x + dx);
    let ny = Math.round(player.y + dy);
    if(maze[ny] && maze[ny][nx] === 0){
        player.x = nx;
        player.y = ny;
        player.px = nx*tileSize+20;
        player.py = ny*tileSize+20;
        checkCollectibles();
    }
}

function moveEnemies(){
  enemies.forEach(e=>{
    e.progress+=e.speed*e.dir;
    if(e.progress>1||e.progress<0){
      e.dir*=-1;
      e.progress=Math.max(0,Math.min(1,e.progress));
    }
    let nx=Math.round(e.x+(e.axis==="x"?e.dir*e.speed:0));
    let ny=Math.round(e.y+(e.axis==="y"?e.dir*e.speed:0));
    if(maze[ny]&&maze[ny][nx]===0){ e.x=nx; e.y=ny; }
    if(Math.abs(e.x-player.x)<0.5 && Math.abs(e.y-player.y)<0.5){ gameOver=true; }
  });
}

function checkCollectibles(){
  keys=keys.filter(k=>{
    if(k.x===player.x&&k.y===player.y){ collectedKeys++; score+=50; return false; }
    return true;
  });
  powerups=powerups.filter(p=>{
    if(p.x===player.x&&p.y===player.y){
      if(p.type==="time") timeLeft+=10;
      if(p.type==="score") score+=100;
      return false;
    }
    return true;
  });
  doors.forEach(d=>{
    if(!d.solved&&d.x===player.x&&d.y===player.y&&collectedKeys>0){
      d.solved=true; collectedKeys--; score+=200;
    }
  });
}

function restartGame(){
  player={x:1,y:1,px:1*40+20,py:1*40+20};
  collectedKeys=0; score=0; timeLeft=60;
  gameOver=false; victory=false; gameStarted=false; beingPulled=false;
  keys=[{x:3,y:1},{x:6,y:5},{x:12,y:9}];
  doors=[{x:8,y:1,solved:false}];
  enemies=[
    {x:10,y:3,dir:1,axis:"x",speed:0.01,progress:0},
    {x:7,y:7,dir:-1,axis:"y",speed:0.008,progress:0},
    {x:12,y:11,dir:1,axis:"x",speed:0.01,progress:0},
    {x:4,y:9,dir:1,axis:"y",speed:0.009,progress:0}
  ];
  powerups=[{x:2,y:6,type:"time"},{x:7,y:3,type:"score"},{x:11,y:9,type:"time"}];
}

// ----------------- INPUT -----------------
document.addEventListener("keydown", e=>{
  if(!gameStarted && e.key==="Enter") gameStarted=true;
  if(gameOver||victory||!gameStarted) return;

  let dx=0, dy=0;
  if(e.key==="ArrowUp") dy=-1;
  if(e.key==="ArrowDown") dy=1;
  if(e.key==="ArrowLeft") dx=-1;
  if(e.key==="ArrowRight") dx=1;
  if(dx!==0||dy!==0) movePlayer(dx,dy);

  if(e.key==="r"||e.key==="R") restartGame();
});

// ----------------- DRAW -----------------
function drawPortal(){
  const cx = exit.x*tileSize+20;
  const cy = exit.y*tileSize+20;

  portalParticles.forEach(p=>{
    p.angle+=p.speed;
    const px = cx + Math.cos(p.angle)*p.radius;
    const py = cy + Math.sin(p.angle)*p.radius;
    ctx.fillStyle=`hsl(${(p.angle*50)%360},100%,50%)`;
    ctx.beginPath();
    ctx.arc(px,py,3,0,Math.PI*2);
    ctx.fill();
  });

  ctx.strokeStyle="white";
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.arc(cx,cy,20,0,Math.PI*2);
  ctx.stroke();
}

// ----------------- LOOP -----------------
function gameLoop(){
  if(gameStarted && !gameOver && !victory){
    moveEnemies();

    // Portal pull effect
    const portalX = exit.x*tileSize+20;
    const portalY = exit.y*tileSize+20;
    let dx = portalX - player.px;
    let dy = portalY - player.py;
    let dist = Math.sqrt(dx*dx+dy*dy);

    if(dist < 80 && !beingPulled){ beingPulled = true; }

    if(beingPulled){
      player.px += dx*0.05; // smooth pull
      player.py += dy*0.05;

      if(dist < 5){
        victory = true;
        beingPulled = false;
      }
    }
  }

  // Draw
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(!gameStarted){
    ctx.fillStyle="#0ff"; ctx.font="50px monospace"; ctx.textAlign="center";
    ctx.fillText("ESCAPE THE LOOP",canvas.width/2,canvas.height/2-40);
    ctx.font="24px monospace"; ctx.fillText("Press Enter or Tap to Start",canvas.width/2,canvas.height/2+20);
    requestAnimationFrame(gameLoop); return;
  }
  if(gameOver && !victory){
    ctx.fillStyle="#ff5555"; ctx.font="50px monospace"; ctx.textAlign="center";
    ctx.fillText("GAME OVER",canvas.width/2,canvas.height/2-20);
    ctx.font="24px monospace"; ctx.fillText("Press R to Restart",canvas.width/2,canvas.height/2+30);
    requestAnimationFrame(gameLoop); return;
  }

  // Walls & floor
  for(let y=0;y<maze.length;y++){
    for(let x=0;x<maze[0].length;x++){
      ctx.fillStyle=maze[y][x]===1?"#222":"#000";
      ctx.fillRect(x*tileSize,y*tileSize,tileSize,tileSize);
    }
  }

  // Keys
  ctx.fillStyle="yellow";
  keys.forEach(k=>ctx.fillRect(k.x*tileSize+10,k.y*tileSize+10,20,20));

  // Doors
  ctx.fillStyle="orange";
  doors.forEach(d=>{ if(!d.solved) ctx.fillRect(d.x*tileSize,d.y*tileSize,tileSize,tileSize); });

  // Powerups
  powerups.forEach(p=>{
    ctx.fillStyle=p.type==="time"?"lime":"magenta";
    ctx.beginPath(); ctx.arc(p.x*tileSize+20,p.y*tileSize+20,10,0,Math.PI*2); ctx.fill();
  });

  // Enemies
  ctx.fillStyle="red";
  enemies.forEach(e=>ctx.fillRect(e.x*tileSize+8,e.y*tileSize+8,24,24));

  // Player
  ctx.fillStyle="cyan";
  ctx.beginPath();
  ctx.arc(player.px,player.py,15,0,Math.PI*2);
  ctx.fill();

  // Exit portal
  drawPortal();

  // HUD
  ctx.fillStyle="white"; ctx.font="20px monospace"; ctx.textAlign="left";
  ctx.fillText("Time: "+timeLeft,10,20);
  ctx.fillText("Score: "+score,10,40);
  ctx.fillText("Keys: "+collectedKeys,10,60);

  if(victory){
    ctx.fillStyle="#0f0"; ctx.font="50px monospace"; ctx.textAlign="center";
    ctx.fillText("YOU ESCAPED!",canvas.width/2,canvas.height/2-20);
    ctx.font="24px monospace"; ctx.fillText("Press R to Restart",canvas.width/2,canvas.height/2+30);
  }

  requestAnimationFrame(gameLoop);
}
gameLoop();
