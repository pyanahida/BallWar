// Game loop, button control
let balls = [];
let lastTime = 0;
let rafId = null;

const typeA = document.getElementById('typeA');
const typeB = document.getElementById('typeB');
const enableA = document.getElementById('enableA');
const enableB = document.getElementById('enableB');
const startBtn = document.getElementById('startBtn');

function spawnBalls() {
  balls = [];
  if (enableA.checked) balls.push(randomBall(typeA.value));
  if (enableB.checked) balls.push(randomBall(typeB.value));
  buildScene(balls);
}

function loop(t) {
  if (lastTime === 0) lastTime = t;
  let dt = (t - lastTime) / 1000;
  lastTime = t;
  // 限制最大时间步长，防止切后台回来后球直接飞出场外
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

// 绑定开始按钮
startBtn.addEventListener('click', startGame);

// 初始化第一把场景（但不开始运动，等待用户点击）
spawnBalls();
