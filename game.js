document.title = "Escape The Loop";

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const tileSize = 40;
let score = 0;
let timer = 60;
let puzzleActive = false;

// Player movement
let playerPos = {x: 1, y: 1, offsetX: 0, offsetY: 0};
let moveTarget = null;
let scoreFlash = 0;
let enemyPulse = 0;

// Maze layout: 0 = empty, 1 = wall
let maze = [ 
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

// Player, exit, keys, power-ups, enemies
let player = {x:1, y:1, keys:0};
let exit = {x:8, y:8};
let keys = [{x:3, y:1},{x:6, y:5}];
let powerups = [{x:2, y:6, type:'time'},{x:7, y:3, type:'key'}];
let enemies = [{x:4, y:1, dx:0, dy:0},{x:5, y:7, dx:0, dy:0}];

//Puzzle doors
let doors = [
    {x:4, y:3, solved:false},
    {x:6, y:7, solved:false}
];

//Draw the maze and entities
function drawMaze() {
    ctx.clearRect(0,0,canvas.clientWidth,canvas.height);

    // Walls
    for(let y=0;y<maze[0].length;x++){
        if(maze[y][x]===1){
            ctx.fillStyle='grey';
            ctx.fillRect(x*tileSize, y*tileSize, tileSize, tileSize);
        }
    }
}

// Keys
keys.forEach(k=>{
    ctx.fillStyle='gold';
    ctx.beginPath();
    ctx.arc(k.x*tileSize+tileSize/2, k.y*tileSize+tileSize/2, 10, 0, 2*Math.PI);
    ctx.fill();
});

// Power-ups
powerups.forEach(p=>{
    ctx.fillStyle = p.type==='time' ? 'blue' : 'green';
    ctx.fillRect(p.x*tileSize+10, p.y*tileSize+10, 20, 20);
});

// Enemies with pulse
enemies.forEach(e=>{
    ctx,fillStyle='red';
    let pulse = 5*Math.sin(enemyPulse + e.x + e.y);
    ctx.fillRect(e.x*tileSize+5-pulse/2, e.y*tileSize+5-pulse/2, 30+pulse, 30+pulse);
});

// Exit
ctx.fillStyle='white';
ctx.fillRect(exit.x*tileSize+5, exit.y*tileSize+5, 30, 30);

// Doors
doors.forEach(d=>{
    ctx.fillStyle = d.solved ? 'lightgreen' : 'orange';
    ctx.fillRect(d.x*tileSize+5, d.y*tileSize+5, 30, 30);
});

// Player 
let drawX = playerPos.x*tileSize + playerPos.offsetX;
let drawY = playerPos.y*tileSize + playerPos.offsetY;
ctx.fillStyle='cyan';
ctx.fillRect(drawX+5, drawY+5, 30, 30);

// Score and timer
ctx.fillStyle = scoreFlash>0 ? 'yellow' : 'white';
ctx.font='18px sans-serif';
ctx.fillText('Keys: ${player.keys} | Score: ${score} | Time: ${timer}',10,20);
}

// Move player with smooth animation
function movePlayer(dx, dy) {
    if(puzzleActive || moveTarget) return;
    let nx = player.x + dx;
    let ny = player.y + dy;
    if(maze[ny][nx]===1) return;
    moveTarget = {x:nx, y:ny, offsetX:-dx*tileSize, offsetY:-dy*tileSize};
    player.x = nx;
    player.y = ny;
}

// Update loop
function update(){ 
    // Smooth player movement
    if (moveTarget){
        playerPos.offsetX += moveTarget.offsetX * 0.2;
        playerPos.offsetY += moveTarget.offsetY * 0.2;
        if(Math.abs(playerPos.offsetX)<0.5 && Math.abs(playerPos.OffsetY)<0.5){
            playerPos.offsetX=0; playerPos.offsetY=0; moveTarget=null;
        }
    }

    enemyPulse += 0.1;
    if(scoreFlash>0) scoreFlash -= 0.05;
    
    drawMaze();
    requestAnimationFrame(update);
}

// Collectibles and puzzles
function checkCollectibles(){
    // Keys
    let keyIndex = keys.findIndex(k=>k.x===player.x && k.y===player.y);
    if(keyIndex>=0){ player.keys++; keys.splice(keyIndex,1); score+=5; scoreFlash=1; }

    // Power-ups
    let powerIndex = powerups.findIndex(p=>p.x===player.x && p.y===player.y);
    if(powerIndex>=0){
        let p = powerups[powerIndex];
        if(p.type==='time') timer+=15;
        else if(p.type==='key') player.keys++;
        powerups.splice(powerIndex,1);
        scoreFlash=1;
}

// Puzzle doors
let door = doors.find(d=>d.x===player.x && d.y===player.y && !d.solved);
if (door) {
    puzzleActive = true;
     let type = Math.floor(Math.random()*3);
        let solved = false;

        if(type===0){
            let a = Math.floor(Math.random()*10)+1;
            let b = Math.floor(Math.random()*10)+1;
            let answer = prompt(`Escape The Loop Puzzle!\nSolve: ${a} + ${b} = ?`);
            if(parseInt(answer)===a+b) solved=true;
        } else if(type===1){
            let num = Math.floor(Math.random()*5)+1;
            let answer = prompt(`Escape The Loop Puzzle!\nGuess a number from 1 to 5`);
            if(parseInt(answer)===num) solved=true;
        } else if(type===2){
            let num = Math.floor(Math.random()*20)+1;
            let answer = prompt(`Escape The Loop Puzzle!\nIs ${num} odd or even? (type "odd" or "even")`);
            if((num%2===0 && answer.toLowerCase()==="even") || (num%2!==0 && answer.toLowerCase()==="odd")) solved=true;
        }

        if(solved){
            alert("Correct! You may pass.");
            score += 10;
            door.solved = true;
        } else {
            alert("Wrong! You cannot pass.");
            player.x -= moveTarget ? Math.sign(moveTarget.offsetX/ tileSize) : 0;
            player.y -= moveTarget ? Math.sign(moveTarget.offsetY/ tileSize) : 0;
            playerPos = {x:player.x, y:player.y, offsetX:0, offsetY:0};
        }
        puzzleActive = false;
    }

    // Exit
    if(player.x===exit.x && player.y===exit.y){
        alert(`You escaped! Final score: ${score}`);
        location.reload();
    }
}

// Move enemies randomly
function moveEnemies(){
    enemies.forEach(e=>{
        if(Math.random()<0.3){
            let dirs=[[1,0],[-1,0],[0,1],[0,-1]];
            let dir=dirs[Math.floor(Math.random()*dirs.length)];
            if(maze[e.y+dir[1]][e.x+dir[0]]===0){ e.dx=dir[0]; e.dy=dir[1]; }
        }
        let nx = e.x + e.dx;
        let ny = e.y + e.dy;
        if(maze[ny][nx]===0){ e.x=nx; e.y=ny; }
        if(e.x===player.x && e.y===player.y){
            score = Math.max(0, score-10);
            player.x = 1; player.y = 1;
            playerPos = {x:1,y:1,offsetX:0,offsetY:0};
        }
    });
}

// Controls
document.addEventListener('keydown', e=>{
    if(e.key==='ArrowUp') movePlayer(0,-1);
    if(e.key==='ArrowDown') movePlayer(0,1);
    if(e.key==='ArrowLeft') movePlayer(-1,0);
    if(e.key==='ArrowRight') movePlayer(1,0);
});

// Timers
setInterval(()=>{
    if(!puzzleActive){ timer--; checkCollectibles(); if(timer<=0){ alert('Time up! Game over.'); location.reload(); } }
},1000);
setInterval(()=>{ moveEnemies(); checkCollectibles(); },500);

// Start game
update();
