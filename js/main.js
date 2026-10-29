// Game loop, switch control
let balls = [];
let lastTime = 0;
let rafId = null;

const switchA = document.getElementById('switchA');
const switchB = document.getElementById('switchB');
const resetBtn = document.getElementById('resetBtn');

// Ball A is common, Ball B is spear. The two switches control whether each ball exists.
// (Third ball 'void' was defined but switches only 2 — we use A=common, B=spear.)

function spawnBalls() {
  balls = [];
  if (switchA.checked) {
    balls.push(randomBall('common'));
  }
  if (switchB.checked) {
    balls.push(randomBall('spear'));
  }
  buildScene(balls);
}

function loop(t) {
  if (lastTime === 0) lastTime = t;
  let dt = (t - lastTime) / 1000;
  lastTime = t;
  // clamp dt to avoid big jumps
  if (dt > 0.05) dt = 0.05;

  stepAll(balls, dt);
  updateScene(balls);

  rafId = requestAnimationFrame(loop);
}

function start() {
  if (rafId) cancelAnimationFrame(rafId);
  lastTime = 0;
  rafId = requestAnimationFrame(loop);
}

switchA.addEventListener('change', () => { spawnBalls(); });
switchB.addEventListener('change', () => { spawnBalls(); });
resetBtn.addEventListener('click', () => { spawnBalls(); });

// init
spawnBalls();
start();
