const switchA = document.getElementById('switchA');
const switchB = document.getElementById('switchB');
const typeA = document.getElementById('typeA');
const typeB = document.getElementById('typeB');
const resetBtn = document.getElementById('resetBtn');

let balls = [];
let lastTime = 0;
let rafId = null;

function spawnBalls() {
  balls = [];
  if (switchA.checked) balls.push(randomBall(typeA.value));
  if (switchB.checked) balls.push(randomBall(typeB.value));
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

function start() {
  if (rafId) cancelAnimationFrame(rafId);
  lastTime = 0;
  rafId = requestAnimationFrame(loop);
}

switchA.addEventListener('change', spawnBalls);
switchB.addEventListener('change', spawnBalls);
typeA.addEventListener('change', spawnBalls);
typeB.addEventListener('change', spawnBalls);
resetBtn.addEventListener('click', spawnBalls);

spawnBalls();
start();
