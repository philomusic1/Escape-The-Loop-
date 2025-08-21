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

// Entities
let keys = [{x:3,y:1},{x:6,y:5}];
let doors = [{x:8,y:1,solved:false}];
let enemies = [{x:10,y:3,dir:1}];
let powerups = [{x:2,y:6,type:"time"},{x:7,y:3,type:"score"}];
let exit = {x:14, y:13};

// Effects
let enemyPulse = 0;
let scoreFlash = 0;
let particles = [];
let shakeOffset = {x:0, y:0};
let shakeIntensity = 0;

// === GAME LOOP ===
setInterval(()=>{
    if(!gameOver && !victory){
        timeLeft--;
        if(timeLeft<=0){
            gameOver = true;
        }
    }
},1000);

function drawMaze(){
    // Camera shake
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

    // Draw maze
    for(let y=0;y<maze.length;y++){
        for(let x=0;x<maze[y].length;x++){
            if(maze[y][x]===1){
                ctx.fillStyle="#444";
                ctx.fillRect(x*tileSize,y*tileSize,tileSize,tileSize);
            } else {
                ctx.fillStyle="#222";
                ctx.fillRect(x*tileSize,y*tileSize,tileSize,tileSize);
            }
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
    keys.forEach((k,i)=>{
        let cx = k.x*tileSize+tileSize/2;
        let cy = k.y*tileSize+tileSize/2;
        ctx.fillStyle="yellow";
        ctx.beginPath();
        ctx.arc(cx,cy,8,0,2*Math.PI);
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
        ctx.arc(p.x*tileSize+tileSize/2,p.y*tileSize+tileSize/2,10,0,2*Math.PI);
        ctx.fill();
    });

    // Enemies
    enemies.forEach(e=>{
        ctx.fillStyle="red";
        ctx.beginPath();
        ctx.arc(e.x*tileSize+tileSize/2,e.y*tileSize+tileSize/2,15,0,2*Math.PI);
        ctx.fill();
    });

    // Player
    ctx.fillStyle="lime";
    ctx.beginPath();
    ctx.arc(player.x*tileSize+tileSize/2, player.y*tileSize+tileSize/2,15,0,2*Math.PI);
    ctx.fill();

    // HUD bar
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

    // Mini-map (with blinking player)
    drawMiniMap();

    // End screens
    if(gameOver||victory){
        endScreenAlpha=Math.min(endScreenAlpha+0.02,1);
        ctx.fillStyle=`rgba(0,0,0,${0.7*endScreenAlpha})`;
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.font="bold 60px monospace";
        ctx.textAlign="center"; ctx.textBaseline="middle";
        if(gameOver){
            ctx.fillStyle="red";
            ctx.fillText("GAME OVER",canvas.width/2,canvas.height/2);
        }
        if(victory){
            ctx.fillStyle="lime";
            ctx.fillText("ESCAPE SUCCESS!",canvas.width/2,canvas.height/2);
        }
        ctx.textAlign="left";
        ctx.font="20px monospace";
        ctx.fillStyle="white";
        ctx.fillText("Press R to Restart",canvas.width/2-80,canvas.height/2+60);
    }

    ctx.restore();

    // Announcement update
    announcement.textContent = `You are at square (X:${player.x}, Y:${player.y})`;
}

// === MINI MAP ===
function drawMiniMap(){
    const mapSize = 150;
    const scaleX = mapSize/maze[0].length;
    const scaleY = mapSize/maze.length;
    const offsetX = canvas.width-mapSize-10;
    const offsetY = 50;

    ctx.fillStyle="rgba(0,0,0,0.6)";
    ctx.fillRect(offsetX-5,offsetY-5,mapSize+10,mapSize+10);

    for(let y=0;y<maze.length;y++){
        for(let x=0;x<maze[y].length;x++){
            if(maze[y][x]===1){
                ctx.fillStyle="#333";
                ctx.fillRect(offsetX+x*scaleX, offsetY+y*scaleY, scaleX, scaleY);
            } else {
                ctx.fillStyle="#111";
                ctx.fillRect(offsetX+x*scaleX, offsetY+y*scaleY, scaleX, scaleY);
            }
        }
    }

    // Exit
    ctx.fillStyle="blue";
    ctx.fillRect(offsetX+exit.x*scaleX, offsetY+exit.y*scaleY, scaleX, scaleY);

    // Keys
    ctx.fillStyle="yellow";
    keys.forEach(k=>{
        ctx.fillRect(offsetX+k.x*scaleX, offsetY+k.y*scaleY, scaleX, scaleY);
    });

    // Enemies
    ctx.fillStyle="red";
    enemies.forEach(e=>{
        ctx.fillRect(offsetX+e.x*scaleX, offsetY+e.y*scaleY, scaleX, scaleY);
    });

    // Player (blink + pulse ring)
    const px = offsetX + player.x*scaleX;
    const py = offsetY + player.y*scaleY;
    const cx = px + scaleX/2;
    const cy = py + scaleY/2;
    const t = (Math.sin(enemyPulse*8)+1)/2;               // 0..1
    const alpha = 0.35 + 0.65*t;                          // blink
    const ringR = Math.max(scaleX,scaleY)*0.55*(0.8+0.5*t);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "lime";
    ctx.fillRect(px, py, scaleX, scaleY);
    ctx.globalAlpha = 0.6 * t;
    ctx.strokeStyle = "lime";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();
}

function moveEnemies(){
    enemies.forEach(e=>{
        e.x+=e.dir;
        if(maze[e.y][e.x]===1){
            e.dir*=-1;
            e.x+=e.dir;
        }
        if(e.x===player.x && e.y===player.y){
            score=Math.max(0,score-10);
            player.x=1; player.y=1;
            shakeIntensity=8;
        }
    });
}

function checkCollectibles(){
    let keyIndex = keys.findIndex(k=>k.x===player.x&&k.y===player.y);
    if(keyIndex>=0){
        collectedKeys++;
        keys.splice(keyIndex,1);
        score+=5;
        // pickup particles
        for(let i=0;i<10;i++){
            particles.push({
                x: player.x*tileSize+tileSize/2,
                y: player.y*tileSize+tileSize/2,
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
    if(player.x===exit.x && player.y===exit.y && collectedKeys>=2){
        victory=true;
    }
}

// Movement (Arrow keys; prevent scroll)
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
    if(e.key==="r"||e.key==="R"){
        if(gameOver||victory) restartGame();
    }
});

function restartGame(){
    player={x:1,y:1};
    collectedKeys=0; score=0; timeLeft=60;
    gameOver=false; victory=false; endScreenAlpha=0;
    keys=[{x:3,y:1},{x:6,y:5}];
    powerups=[{x:2,y:6,type:"time"},{x:7,y:3,type:"score"}];
    doors.forEach(d=>d.solved=false);
}

// Main loop
function gameLoop(){
    enemyPulse+=0.05;
    if(!gameOver&&!victory) moveEnemies();
    drawMaze();
    requestAnimationFrame(gameLoop);
}
gameLoop();
