// Game loop, state control
let balls = [];
window.projectiles = [];
window.traps = [];
window.lasers = [];
window.flashRed = false;

let lastTime = 0;
let rafId = null;
let gameState = 'idle'; 

const typeA = document.getElementById('typeA');
const typeB = document.getElementById('typeB');
const enableA = document.getElementById('enableA');
const enableB = document.getElementById('enableB');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const speedInput = document.getElementById('speedMultiplier');

const pauseOverlay = document.getElementById('pauseOverlay');
const resumeBtn = document.getElementById('resumeBtn');
const quitBtn = document.getElementById('quitBtn');

const gameoverOverlay = document.getElementById('gameoverOverlay');
const winnerText = document.getElementById('winnerText');
const backToMenuBtn = document.getElementById('backToMenuBtn');

async function initGame() {
  try {
    const response = await fetch('balls.json');
    const data = await response.json();
    
    window.loadBallData(data);
    populateDropdowns(data);
    
    balls = [];
    buildScene(balls);
  } catch (err) {
    console.error("Failed to load balls.json.", err);
    alert("Failed to load game data. If running locally, please use a local server.");
  }
}

function populateDropdowns(data) {
  typeA.innerHTML = '';
  typeB.innerHTML = '';
  
  const emptyOptA = new Option('--- Select ---', '');
  emptyOptA.disabled = true; emptyOptA.selected = true;
  typeA.add(emptyOptA);

  const emptyOptB = new Option('--- Select ---', '');
  emptyOptB.disabled = true; emptyOptB.selected = true;
  typeB.add(emptyOptB);
  
  for (const key in data) {
    const name = data[key].name;
    typeA.add(new Option(name, key));
    typeB.add(new Option(name, key));
  }
  
  typeA.value = '';
  typeB.value = '';
}

function spawnBalls() {
  balls = [];
  window.projectiles = [];
  window.traps = [];
  window.lasers = [];
  window.flashRed = false;
  
  let multiplier = parseFloat(speedInput.value);
  if (isNaN(multiplier) || multiplier <= 0) multiplier = 1; 
  window.V_BASE = 18 * multiplier; 

  if (enableA.checked && typeA.value && typeA.value !== '') {
    balls.push(randomBall(typeA.value));
  }
  if (enableB.checked && typeB.value && typeB.value !== '') {
    balls.push(randomBall(typeB.value));
  }

  buildScene(balls);
}

function checkWinCondition() {
  if (balls.length <= 1) return;
  
  const aliveBalls = balls.filter(b => b.alive);
  
  // 判断主要球（排除卫兵等召唤物）是否存活
  const mainBallA = aliveBalls.find(b => b.type === typeA.value);
  const mainBallB = aliveBalls.find(b => b.type === typeB.value);

  if (!mainBallA && !mainBallB) {
    gameState = 'gameover';
    pauseBtn.style.display = 'none';
    winnerText.textContent = "Draw!";
    gameoverOverlay.classList.remove('hidden');
  } else if (!mainBallA) {
    gameState = 'gameover';
    pauseBtn.style.display = 'none';
    winnerText.textContent = `${BALL_TYPES[typeB.value].name} Wins!`;
    gameoverOverlay.classList.remove('hidden');
  } else if (!mainBallB) {
    gameState = 'gameover';
    pauseBtn.style.display = 'none';
    winnerText.textContent = `${BALL_TYPES[typeA.value].name} Wins!`;
    gameoverOverlay.classList.remove('hidden');
  }
}

function loop(t) {
  if (gameState === 'playing') {
    if (lastTime === 0) lastTime = t;
    let dt = (t - lastTime) / 1000;
    lastTime = t;
    
    if (dt > 0.05) dt = 0.05;

    stepAll(balls, dt);
    updateScene(balls, window.projectiles, window.traps);
    checkWinCondition();
  } else {
    lastTime = t;
  }

  rafId = requestAnimationFrame(loop);
}

function startGame() {
  if ((enableA.checked && !typeA.value) || (enableB.checked && !typeB.value)) {
    alert("Please select a ball type for both players before starting.");
    return;
  }

  if (rafId) cancelAnimationFrame(rafId);
  gameoverOverlay.classList.add('hidden');
  pauseOverlay.classList.add('hidden');
  
  spawnBalls();
  gameState = 'playing';
  lastTime = 0;
  rafId = requestAnimationFrame(loop);

  startBtn.style.display = 'none';
  pauseBtn.style.display = 'block';
  pauseBtn.textContent = 'Pause';
  pauseBtn.style.background = '#555';
}

function pauseGame() {
  if (gameState !== 'playing') return;
  gameState = 'paused';
  pauseOverlay.classList.remove('hidden');
}

function resumeGame() {
  if (gameState !== 'paused') return;
  gameState = 'playing';
  pauseOverlay.classList.add('hidden');
}

function quitToMenu() {
  gameState = 'idle';
  if (rafId) cancelAnimationFrame(rafId);
  
  balls = [];
  window.projectiles = [];
  window.traps = [];
  window.lasers = [];
  window.flashRed = false;
  
  buildScene(balls);
  pauseOverlay.classList.add('hidden');
  gameoverOverlay.classList.add('hidden');
  
  startBtn.style.display = 'block';
  pauseBtn.style.display = 'none';
  
  typeA.value = '';
  typeB.value = '';
}

startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', () => {
  if (gameState === 'playing') pauseGame();
});

resumeBtn.addEventListener('click', resumeGame);
quitBtn.addEventListener('click', quitToMenu);
backToMenuBtn.addEventListener('click', quitToMenu);

initGame();
