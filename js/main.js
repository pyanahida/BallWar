// Game loop, state control
let balls = [];
window.projectiles = [];
window.traps = [];
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

// 初始化游戏
async function initGame() {
  try {
    const response = await fetch('balls.json');
    const data = await response.json();
    
    // 载入数据并绑定技能
    window.loadBallData(data);
    
    // 动态填充下拉框
    populateDropdowns(data);
    
    // 初始化第一把场景
    spawnBalls();
  } catch (err) {
    console.error("Failed to load balls.json. Ensure you are running on a server.", err);
    alert("Failed to load game data. If running locally, please use a local server (e.g., Live Server).");
  }
}

function populateDropdowns(data) {
  typeA.innerHTML = '';
  typeB.innerHTML = '';
  for (const key in data) {
    const name = data[key].name;
    
    const optA = new Option(name, key);
    typeA.add(optA);
    
    const optB = new Option(name, key);
    if (key === 'spear') optB.selected = true; // 默认选择
    typeB.add(optB);
  }
}

function spawnBalls() {
  balls = [];
  window.projectiles = [];
  window.traps = [];
  
  let multiplier = parseFloat(speedInput.value);
  if (isNaN(multiplier) || multiplier <= 0) multiplier = 1; 
  window.V_BASE = 18 * multiplier; 

  if (enableA.checked && typeA.value) balls.push(randomBall(typeA.value));
  if (enableB.checked && typeB.value) balls.push(randomBall(typeB.value));

  buildScene(balls);
}

function checkWinCondition() {
  if (balls.length <= 1) return;
  
  const aliveBalls = balls.filter(b => b.alive);
  if (aliveBalls.length === 1) {
    gameState = 'gameover';
    pauseBtn.style.display = 'none';
    winnerText.textContent = `${aliveBalls[0].def.name} Wins!`;
    gameoverOverlay.classList.remove('hidden');
  } else if (aliveBalls.length === 0) {
    gameState = 'gameover';
    pauseBtn.style.display = 'none';
    winnerText.textContent = "Draw!";
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
  buildScene(balls);
  pauseOverlay.classList.add('hidden');
  gameoverOverlay.classList.add('hidden');
  
  startBtn.style.display = 'block';
  pauseBtn.style.display = 'none';
}

startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', () => {
  if (gameState === 'playing') pauseGame();
});

resumeBtn.addEventListener('click', resumeGame);
quitBtn.addEventListener('click', quitToMenu);
backToMenuBtn.addEventListener('click', quitToMenu);

// 启动！
initGame();
