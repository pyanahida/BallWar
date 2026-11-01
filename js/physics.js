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
  if (ball.cryingTimer > 0) return;

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  let bounced = false;
  let bounceX = 0, bounceY = 0;

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
  if (!a.alive || !b.alive) return;

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const minDist = RADIUS * 2;
  if (dist >= minDist || dist < 1e-6) return;

  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = minDist - dist;
  a.x -= nx * overlap / 2;
  a.y -= ny * overlap / 2;
  b.x += nx * overlap / 2;
  b.y += ny * overlap / 2;

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

  let dmgToB = a.def.getDamage ? a.def.getDamage(a, b) : a.damage;
  let dmgToA = b.def.getDamage ? b.def.getDamage(b, a) : b.damage;

  if (b.type === 'one_way_mirror') dmgToB = 0;
  if (a.type === 'one_way_mirror') dmgToA = 0;

  b.hp -= dmgToB;
  a.hp -= dmgToA;

  if (a.def.onHit) a.def.onHit(a);
  if (b.def.onHit) b.def.onHit(b);

  if (a.hp <= 0) { a.hp = 0; a.alive = false; }
  if (b.hp <= 0) { b.hp = 0; b.alive = false; }
}

function distToSegmentSquared(px, py, x1, y1, x2, y2) {
  const l2 = (x1 - x2) ** 2 + (y1 - y2) ** 2;
  if (l2 === 0) return (px - x1) ** 2 + (py - y1) ** 2;
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return (px - (x1 + t * (x2 - x1))) ** 2 + (py - (y1 + t * (y2 - y1))) ** 2;
}

function stepAll(balls, dt) {
  // Crying 状态计时
  for (const b of balls) {
    if (b.cryingTimer > 0) {
      b.cryingTimer -= dt;
      if (b.cryingTimer < 0) b.cryingTimer = 0;
    }
  }

  // 洋葱球发射
  for (const b of balls) {
    if (b.alive && b.type === 'onion') {
      b.shootTimer -= dt;
      if (b.shootTimer <= 0) {
        b.shootTimer = 3;
        const enemies = balls.filter(e => e.alive && e !== b);
        if (enemies.length > 0) {
          const target = enemies[0];
          const angle = Math.atan2(target.y - b.y, target.x - b.x);
          window.projectiles.push({
            x: b.x, y: b.y,
            vx: Math.cos(angle) * 35,
            vy: Math.sin(angle) * 35,
            radius: 3,
            ownerId: b.id
          });
        }
      }
    }
  }

  // 公文包发射射线
  for (const b of balls) {
    if (b.alive && b.type === 'briefcase') {
      b.laserTimer -= dt;
      if (b.laserTimer <= 0) {
        b.laserTimer = 5;
        
        // 生成 X 型射线
        // 方向: (1,1), (1,-1), (-1,1), (-1,-1)
        const dirs = [
          { dx: 1, dy: 1 }, { dx: 1, dy: -1 },
          { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
        ];
        
        for (const dir of dirs) {
          // 计算射线与墙壁的交点 (最远100)
          let endX = b.x, endY = b.y;
          if (dir.dx > 0) endX = FIELD.size;
          if (dir.dx < 0) endX = 0;
          if (dir.dy > 0) endY = FIELD.size;
          if (dir.dy < 0) endY = 0;
          
          // 确保射线延伸到边界
          const distX = Math.abs(endX - b.x);
          const distY = Math.abs(endY - b.y);
          const maxDist = Math.max(distX, distY);
          endX = b.x + dir.dx * maxDist;
          endY = b.y + dir.dy * maxDist;

          window.lasers.push({
            x1: b.x, y1: b.y, x2: endX, y2: endY,
            timer: 2.0, ownerId: b.id, type: 'X'
          });

          // 瞬间命中判定
          for (const enemy of balls) {
            if (!enemy.alive) continue;
            const distSq = distToSegmentSquared(enemy.x, enemy.y, b.x, b.y, endX, endY);
            if (distSq < RADIUS * RADIUS) {
              enemy.hp -= 6;
              if (enemy.hp <= 0) { enemy.hp = 0; enemy.alive = false; }
            }
          }
        }
      }
    }
  }

  // 陷阱球生成
  for (const b of balls) {
    if (b.alive && b.type === 'trap') {
      b.trapTimer -= dt;
      if (b.trapTimer <= 0) {
        b.trapTimer = 4;
        const margin = 20;
        const randomX = margin + Math.random() * (FIELD.size - margin * 2);
        const randomY = margin + Math.random() * (FIELD.size - margin * 2);
        window.traps.push({ x: randomX, y: randomY, radius: 20, timer: 1.0, ownerId: b.id });
      }
    }
  }

  // 子弹更新
  for (let i = window.projectiles.length - 1; i >= 0; i--) {
    const p = window.projectiles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    
    if (p.x - p.radius < 0 || p.x + p.radius > FIELD.size || p.y - p.radius < 0 || p.y + p.radius > FIELD.size) {
      window.projectiles.splice(i, 1);
      continue;
    }
    
    let hit = false;
    for (const b of balls) {
      if (!b.alive) continue;
      if (p.ownerId === b.id) continue;
      const dist = Math.hypot(p.x - b.x, p.y - b.y);
      if (dist < RADIUS + p.radius) {
        b.hp -= 2;
        b.cryingTimer = 2;
        if (b.hp <= 0) { b.hp = 0; b.alive = false; }
        hit = true;
        break;
      }
    }
    if (hit) window.projectiles.splice(i, 1);
  }

  // 射线更新
  for (let i = window.lasers.length - 1; i >= 0; i--) {
    const laser = window.lasers[i];
    laser.timer -= dt;
    if (laser.timer <= 0) {
      window.lasers.splice(i, 1);
      continue;
    }

    // 碰撞与镜面反弹判定
    for (const b of balls) {
      if (!b.alive || b.id === laser.ownerId) continue;
      // 避免和生成射线时的瞬间判定重复，这里加个极短的冷却或者只让移动中的球触发
      const distSq = distToSegmentSquared(b.x, b.y, laser.x1, laser.y1, laser.x2, laser.y2);
      if (distSq < RADIUS * RADIUS) {
        // 造成伤害
        b.hp -= 3;
        if (b.hp <= 0) { b.hp = 0; b.alive = false; }

        // 镜面反弹计算
        const dx = laser.x2 - laser.x1;
        const dy = laser.y2 - laser.y1;
        const len = Math.hypot(dx, dy);
        const nx = -dy / len; // 射线的法线
        const ny = dx / len;
        const dot = b.vx * nx + b.vy * ny;
        
        b.vx = b.vx - 2 * dot * nx;
        b.vy = b.vy - 2 * dot * ny;

        // 把球推离射线，防止下一帧连续触发
        const pushDist = RADIUS + 0.5;
        const sign = Math.sign(dot) || 1;
        b.x += nx * pushDist * sign;
        b.y += ny * pushDist * sign;
      }
    }
  }

  // 陷阱更新
  for (let i = window.traps.length - 1; i >= 0; i--) {
    const trap = window.traps[i];
    trap.timer -= dt;
    if (trap.timer <= 0) { window.traps.splice(i, 1); continue; }

    let triggered = false;
    for (const b of balls) {
      if (!b.alive) continue;
      if (b.id !== trap.ownerId) {
        const dist = Math.hypot(trap.x - b.x, trap.y - b.y);
        if (dist < trap.radius + RADIUS) {
          b.hp -= 10;
          if (b.hp <= 0) { b.hp = 0; b.alive = false; }
          triggered = true;
          break;
        }
      }
    }
    if (triggered) window.traps.splice(i, 1);
  }

  for (const b of balls) stepBall(b, dt);

  // 蛛丝/荆棘更新 (保持原样)
  for (const b of balls) {
    if (b.type === 'spider_web' && b.webs) {
      for (let i = b.webs.length - 1; i >= 0; i--) {
        const web = b.webs[i];
        if (web.cooldown > 0) web.cooldown -= dt * 1000;
        for (const enemy of balls) {
          if (enemy === b || !enemy.alive) continue;
          const distSq = distToSegmentSquared(enemy.x, enemy.y, b.x, b.y, web.x, web.y);
          if (distSq < (RADIUS + 0.5) ** 2) {
            if (web.cooldown <= 0) {
              enemy.hp -= 1;
              web.hp -= 1;
              web.cooldown = 1000;
              if (enemy.hp <= 0) { enemy.hp = 0; enemy.alive = false; }
              if (web.hp <= 0) { b.webs.splice(i, 1); break; }
            }
          }
        }
      }
    }
  }

  for (const b of balls) {
    if (b.type === 'thorns' && b.thornPoints) {
      for (let i = 0; i < b.thornCooldowns.length; i++) {
        if (b.thornCooldowns[i] > 0) {
          b.thornCooldowns[i] -= dt;
          if (b.thornCooldowns[i] < 0) b.thornCooldowns[i] = 0;
        }
      }
      for (let i = 0; i < b.thornPoints.length - 1; i++) {
        const p1 = b.thornPoints[i];
        const p2 = b.thornPoints[i + 1];
        for (const enemy of balls) {
          if (enemy === b || !enemy.alive) continue;
          const distSq = distToSegmentSquared(enemy.x, enemy.y, p1.x, p1.y, p2.x, p2.y);
          if (distSq < (RADIUS + 0.5) ** 2) {
            if (!b.thornCooldowns[i] || b.thornCooldowns[i] <= 0) {
              enemy.hp -= 2;
              if (enemy.hp <= 0) { enemy.hp = 0; enemy.alive = false; }
              b.thornCooldowns[i] = 0.4;
            }
          }
        }
      }
    }
  }

  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      resolveBallCollision(balls[i], balls[j]);
    }
  }
}
