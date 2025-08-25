let maze = [];
let player;
let enemies = [];
let keys = [];
let diamonds = [];
let portal;
let score = 0;
let level = 1;
let maxLevels = 10;
let showInstructions = true;
let levelStartTime;
let levelTimer = 0;
let gameOver = false;

function setup() {
  createCanvas(600, 600);
  textAlign(CENTER, CENTER);
  textSize(16);
  initializeLevel(level);
}

function draw() {
  background(30);

  if (gameOver) {
    fill(255);
    textSize(24);
    text("🎉 You Escaped All Mazes!", width / 2, height / 2 - 40);
    textSize(16);
    text(`Final Score: ${score}`, width / 2, height / 2);
    return;
  }

  if (showInstructions) {
    fill(255);
    textSize(24);
    text("Maze Escape", width / 2, 60);
    textSize(16);
    text("Collect 3 keys to unlock the portal.\nAvoid enemies. Grab diamonds for bonus points.\nUse arrow keys to move.", width / 2, 120);
    text("🔑 Key   💎 Diamond   👾 Enemy   🌀 Portal", width / 2, 180);
    text("Press ENTER to begin", width / 2, 240);
    return;
  }

  levelTimer = Math.floor((millis() - levelStartTime) / 1000);
  fill(255);
  text(`Level: ${level}`, 50, 20);
  text(`Score: ${score}`, 150, 20);
  text(`Time: ${levelTimer}s`, 250, 20);

  drawMaze();
  player.update();
  player.draw();

  for (let enemy of enemies) {
    enemy.update(player);
    enemy.draw();
    if (enemy.collidesWith(player)) {
      resetGame();
      return;
    }
  }

  for (let key of keys) {
    key.draw();
    if (!key.collected && player.collidesWith(key)) {
      key.collected = true;
    }
  }

  for (let diamond of diamonds) {
    diamond.draw();
    if (!diamond.collected && player.collidesWith(diamond)) {
      diamond.collected = true;
      score += 100;
    }
  }

  if (keys.every(k => k.collected)) {
    portal.active = true;
  }

  portal.draw();
  if (portal.active && player.collidesWith(portal)) {
    nextLevel();
  }
}

function keyPressed() {
  if (showInstructions && keyCode === ENTER) {
    showInstructions = false;
    levelStartTime = millis();
    return;
  }
  player.handleInput(keyCode);
}

function initializeLevel(lvl) {
  maze = generateMaze(lvl);
  player = new Player(1, 1);
  enemies = generateEnemies(lvl);
  keys = generateKeys();
  diamonds = generateDiamonds(lvl);
  portal = new Portal(maze.width - 2, maze.height - 2);
  levelStartTime = millis();
}

function nextLevel() {
  let timeBonus = Math.max(0, 1000 - levelTimer * 10);
  score += timeBonus;

  level++;
  if (level > maxLevels) {
    gameOver = true;
  } else {
    showInstructions = true;
    initializeLevel(level);
  }
}

function resetGame() {
  score = 0;
  level = 1;
  showInstructions = true;
  initializeLevel(level);
}

// --- Entity Classes ---

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  update() {}
  draw() {
    fill(0, 255, 0);
    ellipse(this.x * 30, this.y * 30, 20);
  }
  handleInput(key) {
    if (keyCode === LEFT_ARROW) this.x--;
    if (keyCode === RIGHT_ARROW) this.x++;
    if (keyCode === UP_ARROW) this.y--;
    if (keyCode === DOWN_ARROW) this.y++;
  }
  collidesWith(obj) {
    return dist(this.x, this.y, obj.x, obj.y) < 1;
  }
}

class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  update(player) {
    if (player.x > this.x) this.x += 0.05;
    if (player.x < this.x) this.x -= 0.05;
    if (player.y > this.y) this.y += 0.05;
    if (player.y < this.y) this.y -= 0.05;
  }
  draw() {
    fill(255, 0, 0);
    rect(this.x * 30, this.y * 30, 20, 20);
  }
  collidesWith(player) {
    return dist(this.x, this.y, player.x, player.y) < 1;
  }
}

class Key {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.collected = false;
  }
  draw() {
    if (!this.collected) {
      fill(255, 255, 0);
      ellipse(this.x * 30, this.y * 30, 15);
    }
  }
}

class Diamond {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.collected = false;
  }
  draw() {
    if (!this.collected) {
      fill(0, 255, 255);
      rect(this.x * 30, this.y * 30, 10, 10);
    }
  }
}

class Portal {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.active = false;
  }
  draw() {
    if (this.active) {
      fill(200, 0, 255);
      ellipse(this.x * 30, this.y * 30, 25);
    }
  }
}

// --- Generation Functions ---

function generateMaze(level) {
  return {
    width: 20 + level,
    height: 20 + level,
    tiles: [] // Add your maze generation logic here
  };
}

function generateEnemies(level) {
  let list = [];
  for (let i = 0; i < 2 + level; i++) {
    list.push(new Enemy(random(5, 15), random(5, 15)));
  }
  return list;
}

function generateKeys() {
  return [
    new Key(3, 3),
    new Key(5, 10),
    new Key(10, 5)
  ];
}

function generateDiamonds(level) {
  let list = [];
  for (let i = 0; i < 3 + level; i++) {
    list.push(new Diamond(random(2, 18), random(2, 18)));
  }
  return list;
}

function drawMaze() {
  stroke(100);
  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 20; j++) {
      noFill();
      rect(i * 30, j * 30, 30, 30);
    }
  }