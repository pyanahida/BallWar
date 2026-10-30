// Game loop, button control
let balls = [];
let lastTime = 0;
let rafId = null;

const typeA = document.getElementById('typeA');
const typeB = document.getElementById('typeB');
const enableA = document.getElementById('enableA');
const enableB = document.getElementById('enableB');
const startBtn = document.getElementById('startBtn');
const speedInput = document.getElementById('speedMultiplier');

function spawnBalls() {
  balls = [];
  
  let multiplier = parseFloat(speedInput.value);
  if (isNaN(multiplier) || multiplier <= 0) {
    multiplier = 1; 
  }
  window.V_BASE = 18 * multiplier; 

  if (enableA.checked) {
    const ball = randomBall(typeA.value);
    // randomBall 中已经使用了最新的 window.V_BASE 计算速度
    balls.push(ball);
  }
  
  if (enableB.checked) {
    const ball = randomBall(typeB.value);
    balls.push(ball);
  }

  buildScene(balls);
}

function loop(t) {
  if (lastTime === 0) lastTime = t;
  let dt = (t - lastTime) / 1000;
  lastTime = t;
  
  if (dt > 0.05) dt = 0.05;

  stepAll(balls, dt);
  updateScene(balls);

  rafId = requestAnimationFrame(loop);
}

function startGame() {
  if (rafId) cancelAnimationFrame(rafId);
  spawnBalls();
  lastTime = 0;
  rafId = requestAnimationFrame(loop);
}

startBtn.addEventListener('click', startGame);

// 初始化第一把场景
spawnBalls();
