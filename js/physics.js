const WALL_MIN = RADIUS;
const WALL_MAX = FIELD.size - RADIUS;

function normalizeVelocity(ball) {
  const mag = Math.hypot(ball.vx, ball.vy);
  if (mag < 1e-6) return;
  ball.vx = (ball.vx / mag) * ball.speed;
  ball.vy = (ball.vy / mag) * ball.speed;
}

function stepBall(ball, dt) {
  if (!ball.alive || ball.cryingTimer > 0 || ball.invincible) return;

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  let bounced = false, bounceX = 0, bounceY = 0;
  if (ball.x < WALL_MIN) { ball.x = WALL_MIN; ball.vx = Math.abs(ball.vx); bounced = true; bounceX = 0; bounceY = ball.y; }
  if (ball.x > WALL_MAX) { ball.x = WALL_MAX; ball.vx = -Math.abs(ball.vx); bounced = true; bounceX = FIELD.size; bounceY = ball.y; }
  if (ball.y < WALL_MIN) { ball.y = WALL_MIN; ball.vy = Math.abs(ball.vy); bounced = true; bounceX = ball.x; bounceY = 0; }
  if (ball.y > WALL_MAX) { ball.y = WALL_MAX; ball.vy = -Math.abs(ball.vy); bounced = true; bounceX = ball.x; bounceY = FIELD.size; }

  if (bounced && ball.def.onBounce) {
    ball.def.onBounce(ball, bounceX, bounceY);
    normalizeVelocity(ball);
  }
}

function resolveBallCollision(a, b) {
  if (!a.alive || !b.alive || a.invincible || b.invincible) return;

  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy), minDist = RADIUS * 2;
  if (dist >= minDist || dist < 1e-6) return;

  const nx = dx / dist, ny = dy / dist;
  const overlap = minDist - dist;
  a.x -= nx * overlap / 2; a.y -= ny * overlap / 2;
  b.x += nx * overlap / 2; b.y += ny * overlap / 2;

  const rvx = b.vx - a.vx, rvy = b.vy - a.vy;
  const velAlongNormal = rvx * nx + rvy * ny;
  if (velAlongNormal > 0) return;

  const impulse = -velAlongNormal;
  a.vx -= impulse * nx; a.vy -= impulse * ny;
  b.vx += impulse * nx; b.vy += impulse * ny;

  normalizeVelocity(a); normalizeVelocity(b);

  let dmgToB = a.def.getDamage ? a.def.getDamage(a, b) : a.damage;
  let dmgToA = b.def.getDamage ? b.def.getDamage(b, a) : b.damage;

  if (b.type === 'one_way_mirror') dmgToB = 0;
  if (a.type === 'one_way_mirror') dmgToA = 0;

  b.hp -= dmgToB; a.hp -= dmgToA;

  if (a.def.onHit) a.def.onHit(a, b);
  if (b.def.onHit) b.def.onHit(b, a);

  if (a.hp <= 0) { a.hp = 0; a.alive = false; }
  if (b.hp <= 0) { b.hp = 0; b.alive = false; }
}

function stepAll(balls, dt) {
  // 调用所有注册的插件系统
  if (window.Systems) {
    for (const sys of window.Systems) sys.update(balls, dt);
  }

  // 基础物理移动
  for (const b of balls) stepBall(b, dt);

  // 基础球球碰撞
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      resolveBallCollision(balls[i], balls[j]);
    }
  }
}
