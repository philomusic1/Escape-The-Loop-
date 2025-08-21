const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const announcement = document.getElementById("announcement");

// === GAME STATE ===
let tileSize = 40;
let player = { x: 1, y: 1 };
let collectedKeys = 0;
let score = 0;
let timeLeft = 60;

let gameOver = false;
let victory = false;
let endScreenAlpha = 0;

// Maze layout (0=empty,1=wall)
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

// === ENTITIES ===
let keys = [
  {x:3,y:1},{x:6,y:5},{x:12,y:9}
];
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

// Effects
let enemyPulse = 0;
let particles = [];
let shakeOffset = {x:0, y:0};
let shakeIntensity = 0;

// === TIMER ===
setInterval(()=>{
    if(!gameOver && !victory){
        timeLeft--;
        if(timeLeft<=0) gameOver = true;
    }
},1000);

// === DRAWING ===
function drawMaze(){
    if(shakeIntensity>0){
        shakeOffset.x = (Math.random()-0.5)*shakeIntensity;
        shakeOffset.y = (Math.random()-0.5)*shakeIntensity;
        shakeIntensity *= 0.9;
    } else {
        shakeOffset.x = shakeOffset.y = 0;
    }
    ctx.save();
    ctx.translate(shakeOffset.x,shakeOffset.y);

    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Maze walls + floor
    for(let y=0;y<maze.length;y++){
        for(let x=0;x<maze[y].length;x++){
            ctx.fillStyle = maze[y][x]===1 ? "#444" : "#222";
            ctx.fillRect(x*tileSize,y*tileSize,tileSize,tileSize);
        }
    }

    // Exit portal
    let centerX = exit.x*tileSize + tileSize/2;
    let centerY = exit.y*tileSize + tileSize/2;
    let radius = 15 + Math.sin(enemyPulse*4)*3;
    ctx.beginPath();
    ctx.fillStyle = "rgba(100,100,255,0.1)";
    ctx.arc(centerX,centerY,25,0,2*Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "rgba(100,100,255,0.6)";
    ctx.arc(centerX,centerY,radius,0,2*Math.PI);
    ctx.fill();

    // Keys
    ctx.fillStyle="yellow";
    keys.forEach(k=>{
        ctx.beginPath();
        ctx.arc(k.x*tileSize+20,k.y*tileSize+20,8,0,2*Math.PI);
        ctx.fill();
    });

    // Doors
    doors.forEach(d=>{
        ctx.fillStyle=d.solved?"#44ff44":"#ff8800";
        ctx.fillRect(d.x*tileSize+6,d.y*tileSize+6,28,28);
    });

    // Powerups
    powerups.forEach(p=>{
        ctx.fillStyle=p.type==="time"?"#00aaff":"#00ff55";
        ctx.beginPath();
        ctx.arc(p.x*tileSize+20,p.y*tileSize+20,10,0,2*Math.PI);
        ctx.fill();
    });

    // Enemies
    ctx.fillStyle="red";
    enemies.forEach(e=>{
        ctx.beginPath();
        ctx.arc(e.x*tileSize+20,e.y*tileSize+20,15,0,2*Math.PI);
        ctx.fill();
    });

    // Player
    ctx.fillStyle="lime";
    ctx.beginPath();
    ctx.arc(player.x*tileSize+20, player.y*tileSize+20,15,0,2*Math.PI);
    ctx.fill();

    // HUD
    ctx.fillStyle="rgba(0,0,0,0.6)";
    ctx.fillRect(0,0,canvas.width,40);
    ctx.font="20px monospace";
    ctx.textBaseline="middle";
    ctx.fillStyle="gold";
    ctx.fillText(`🔑 ${collectedKeys}`,20,20);
    ctx.fillStyle="#00ffcc";
    ctx.fillText(`💎 ${score}`,180,20);
    ctx.fillStyle="#00aaff";
    ctx.fillText(`⏳ ${timeLeft}`,340,20);

    // Particles
    particles.forEach((p,i)=>{
        ctx.fillStyle=`rgba(255,255,100,${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.size,0,2*Math.PI);
        ctx.fill();
        p.x+=p.dx; p.y+=p.dy; p.alpha-=0.02;
        if(p.alpha<=0) particles.splice(i,1);
    });

    ctx.restore();

    // Announcer
    announcement.textContent = `You are at square (X:${player.x}, Y:${player.y})`;
}

// === ENEMY MOVEMENT ===
function moveEnemies(){
    enemies.forEach(e=>{
        e.progress += e.speed;
        if(e.progress >= 1){
            e.progress = 0;
            if(e.axis==="x"){
                e.x += e.dir;
                if(maze[e.y][e.x]===1){
                    e.dir *= -1;
                    e.x += e.dir;
                }
            } else {
                e.y += e.dir;
                if(maze[e.y][e.x]===1){
                    e.dir *= -1;
                    e.y += e.dir;
                }
            }
        }
        if(e.x===player.x && e.y===player.y){
            score=Math.max(0,score-10);
            player.x=1; player.y=1;
            shakeIntensity=8;
        }
    });
}

// === COLLECTIBLES ===
function checkCollectibles(){
    let keyIndex = keys.findIndex(k=>k.x===player.x&&k.y===player.y);
    if(keyIndex>=0){
        collectedKeys++;
        keys.splice(keyIndex,1);
        score+=5;
        for(let i=0;i<10;i++){
            particles.push({
                x: player.x*tileSize+20,
                y: player.y*tileSize+20,
                dx:(Math.random()-0.5)*2,
                dy:-Math.random()*2-1,
                alpha:1,
                size:2+Math.random()*2
            });
        }
    }
    let powerIndex = powerups.findIndex(p=>p.x===player.x&&p.y===player.y);
    if(powerIndex>=0){
        let p=powerups[powerIndex];
        if(p.type==="time") timeLeft+=10;
        else score+=20;
        powerups.splice(powerIndex,1);
    }
    if(player.x===exit.x && player.y===exit.y && collectedKeys>=3){
        victory=true;
    }
}

// === INPUT ===
document.addEventListener("keydown",e=>{
    if(gameOver||victory) return;
    let nx=player.x, ny=player.y;
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault();
    if(e.key==="ArrowUp") ny--;
    if(e.key==="ArrowDown") ny++;
    if(e.key==="ArrowLeft") nx--;
    if(e.key==="ArrowRight") nx++;
    if(maze[ny] && maze[ny][nx]===0){
        player.x=nx; player.y=ny;
        checkCollectibles();
    }
});

// Restart
document.addEventListener("keydown",e=>{
    if(e.key==="r"||e.key==="R") restartGame();
});

function restartGame(){
    player={x:1,y:1};
    collectedKeys=0; score=0; timeLeft=60;
    gameOver=false; victory=false; endScreenAlpha=0;
    keys=[{x:3,y:1},{x:6,y:5},{x:12,y:9}];
    powerups=[{x:2,y:6,type:"time"},{x:7,y:3,type:"score"},{x:11,y:9,type:"time"}];
    enemies=[
      {x:10,y:3,dir:1,axis:"x",speed:0.02,progress:0},
      {x:7,y:7,dir:-1,axis:"y",speed:0.015,progress:0},
      {x:12,y:11,dir:1,axis:"x",speed:0.01,progress:0},
      {x:4,y:9,dir:1,axis:"y",speed:0.02,progress:0}
    ];
}

// === LOOP ===
function gameLoop(){
    enemyPulse+=0.05;
    if(!gameOver&&!victory) moveEnemies();
    drawMaze();
    requestAnimationFrame(gameLoop);
}
gameLoop();
