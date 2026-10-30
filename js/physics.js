// Physics step, collisions, wall bounce
const WALL_MIN = RADIUS;
const WALL_MAX = FIELD.size - RADIUS;

function normalizeVelocity(ball) {
  const mag = Math.hypot(ball.vx, ball.vy);
  if (mag < 1e-6) return;
  ball.vx = (ball.vx / mag) * ball.speed;
  ball.vy = (ball.vy / mag) * ball.speed;
}

function stepBall(ball, dt) {
  if (!ball.alive) return;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  // wall bounce + spear stacking
  let bounced = false;
  if (ball.x < WALL_MIN) { ball.x = WALL_MIN; ball.vx = Math.abs(ball.vx); bounced = true; }
  if (ball.x > WALL_MAX) { ball.x = WALL_MAX; ball.vx = -Math.abs(ball.vx); bounced = true; }
  if (ball.y < WALL_MIN) { ball.y = WALL_MIN; ball.vy = Math.abs(ball.vy); bounced = true; }
  if (ball.y > WALL_MAX) { ball.y = WALL_MAX; ball.vy = -Math.abs(ball.vy); bounced = true; }

  if (bounced && ball.def.onBounce) {
    ball.def.onBounce(ball);
    normalizeVelocity(ball);
  }
}

function resolveBallCollision(a, b) {
  if (!a.alive || !b.alive) return;

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const minDist = RADIUS * 2;
  if (dist >= minDist || dist < 1e-6) return;

  // separate
  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = minDist - dist;
  a.x -= nx * overlap / 2;
  a.y -= ny * overlap / 2;
  b.x += nx * overlap / 2;
  b.y += ny * overlap / 2;

  // equal-mass elastic bounce along normal
  const rvx = b.vx - a.vx;
  const rvy = b.vy - a.vy;
  const velAlongNormal = rvx * nx + rvy * ny;
  if (velAlongNormal > 0) return;

  const impulse = -velAlongNormal;
  a.vx -= impulse * nx;
  a.vy -= impulse * ny;
  b.vx += impulse * nx;
  b.vy += impulse * ny;

  normalizeVelocity(a);
  normalizeVelocity(b);

  // apply damage (support dynamic getDamage like steel_coil)
  const dmgToB = a.def.getDamage ? a.def.getDamage(a, b) : a.damage;
  const dmgToA = b.def.getDamage ? b.def.getDamage(b, a) : b.damage;

  b.hp -= dmgToB;
  a.hp -= dmgToA;

  if (a.def.onHit) a.def.onHit(a);
  if (b.def.onHit) b.def.onHit(b);

  if (a.hp <= 0) { a.hp = 0; a.alive = false; }
  if (b.hp <= 0) { b.hp = 0; b.alive = false; }
}

function stepAll(balls, dt) {
  for (const b of balls) stepBall(b, dt);
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      resolveBallCollision(balls[i], balls[j]);
    }
  }
}
