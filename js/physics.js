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
  if (ball.invincible) return;

  // 卫兵有独立的半径边界处理
  const r = ball.radius || RADIUS;
  const minB = r;
  const maxB = FIELD.size - r;

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  let bounced = false;
  let bounceX = 0, bounceY = 0;

  if (ball.x < minB) { ball.x = minB; ball.vx = Math.abs(ball.vx); bounced = true; bounceX = 0; bounceY = ball.y; }
  if (ball.x > maxB) { ball.x = maxB; ball.vx = -Math.abs(ball.vx); bounced = true; bounceX = FIELD.size; bounceY = ball.y; }
  if (ball.y < minB) { ball.y = minB; ball.vy = Math.abs(ball.vy); bounced = true; bounceX = ball.x; bounceY = 0; }
  if (ball.y > maxB) { ball.y = maxB; ball.vy = -Math.abs(ball.vy); bounced = true; bounceX = ball.x; bounceY = FIELD.size; }

  if (bounced && ball.def.onBounce) {
    ball.def.onBounce(ball, bounceX, bounceY);
    normalizeVelocity(ball);
  }
}

function resolveBallCollision(a, b) {
  if (!a.alive || !b.alive) return;
  if (a.invincible || b.invincible) return;

  const rA = a.radius || RADIUS;
  const rB = b.radius || RADIUS;

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const minDist = rA + rB;
  if (dist >= minDist || dist < 1e-6) return;

  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = minDist - dist;
  
  // 质量比（国王比卫兵重，所以推开卫兵更多）
  const massA = rA * rA;
  const massB = rB * rB;
  const totalMass = massA + massB;
  
  a.x -= nx * overlap * (massB / totalMass);
  a.y -= ny * overlap * (massB / totalMass);
  b.x += nx * overlap * (massA / totalMass);
  b.y += ny * overlap * (massA / totalMass);

  const rvx = b.vx - a.vx;
  const rvy = b.vy - a.vy;
  const velAlongNormal = rvx * nx + rvy * ny;
  if (velAlongNormal > 0) return;

  const impulse = -velAlongNormal * (1.5); // 稍微加点弹性
  a.vx -= (impulse * massB / totalMass) * nx;
  a.vy -= (impulse * massB / totalMass) * ny;
  b.vx += (impulse * massA / totalMass) * nx;
  b.vy += (impulse * massA / totalMass) * ny;

  normalizeVelocity(a);
  normalizeVelocity(b);

  // 护盾机制判定
  let dmgToB = a.def.getDamage ? a.def.getDamage(a, b) : a.damage;
  let dmgToA = b.def.getDamage ? b.def.getDamage(b, a) : b.damage;

  if (b.type === 'one_way_mirror') dmgToB = 0;
  if (a.type === 'one_way_mirror') dmgToA = 0;

  // 结算 B 受伤
  if (dmgToB > 0) {
    if (b.type === 'guard' && b.shields > 0) {
      // 60% 概率抵挡
      if (Math.random() < 0.6) {
        b.shields--; // 消耗护盾
        dmgToB = 0;  // 抵挡伤害
      }
    }
    b.hp -= dmgToB;
  }

  // 结算 A 受伤
  if (dmgToA > 0) {
    if (a.type === 'guard' && a.shields > 0) {
      if (Math.random() < 0.6) {
        a.shields--;
        dmgToA = 0;
      }
    }
    a.hp -= dmgToA;
  }

  if (a.def.onHit) a.def.onHit(a, b);
  if (b.def.onHit) b.def.onHit(b, a);

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
  // 1. 状态更新与国王召唤
  for (const b of balls) {
    if (!b.alive) continue;
    if (b.cryingTimer > 0) {
      b.cryingTimer -= dt;
      if (b.cryingTimer < 0) b.cryingTimer = 0;
    }
    
    if (b.type === 'heavy_hammer') {
      // ... 重锤原有逻辑 ...
      b.hhTimer -= dt;
      if (b.hhPhase === 'move' && b.hhTimer <= 0) {
        b.hhPhase = 'idle'; b.hhTimer = 1.0; b.invincible = true; b.vx = 0; b.vy = 0;
      } else if (b.hhPhase === 'idle' && b.hhTimer <= 0) {
        b.hhPhase = 'move'; b.hhTimer = 4.0; b.invincible = false;
        const angle = Math.random() * Math.PI * 2;
        b.vx = Math.cos(angle) * b.speed; b.vy = Math.sin(angle) * b.speed;
        let hit = false;
        for (const enemy of balls) {
          if (enemy === b || !enemy.alive) continue;
          if (enemy.x >= b.x - 7.5 && enemy.x <= b.x + 7.5 && enemy.y >= b.y + 7.5) {
            enemy.hp -= 20;
            if (enemy.hp <= 0) { enemy.hp = 0; enemy.alive = false; }
            hit = true;
          }
        }
        if (hit) window.flashRed = true;
      }
    }

    // 国王召唤卫兵
    if (b.type === 'king') {
      b.summonTimer -= dt;
      if (b.summonTimer <= 0) {
        b.summonTimer = 5;
        // 在国王周围生成 5 个卫兵
        for (let i = 0; i < 5; i++) {
          const margin = GUARD_RADIUS + 1;
          let gx, gy, valid;
          // 尝试找个不跟国王重叠的位置
          do {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 15 + 10;
            gx = b.x + Math.cos(angle) * dist;
            gy = b.y + Math.sin(angle) * dist;
            valid = gx >= margin && gx <= FIELD.size - margin && gy >= margin && gy <= FIELD.size - margin;
          } while (!valid);

          // 创建卫兵
          const guard = createBall('guard', gx, gy, Math.random() * Math.PI * 2);
          guard.kingId = b.id;
          balls.push(guard); // 动态加入 balls 数组
        }
      }
    }
  }

  // 判定国王死亡（清理卫兵）
  const kingAlive = balls.some(b => b.type === 'king' && b.alive);
  if (!kingAlive) {
    for (const b of balls) {
      if (b.type === 'guard' && b.alive) b.alive = false;
    }
  }

  // 2. 发射逻辑（洋葱、公文包）
  for (const b of balls) {
    if (!b.alive) continue;
    // ... 洋葱子弹逻辑 ...
    if (b.type === 'onion') {
      b.shootTimer -= dt;
      if (b.shootTimer <= 0) {
        b.shootTimer = 3;
        const enemies = balls.filter(e => e.alive && e !== b);
        if (enemies.length > 0) {
          const target = enemies[0];
          const angle = Math.atan2(target.y - b.y, target.x - b.x);
          window.projectiles.push({ x: b.x, y: b.y, vx: Math.cos(angle)*35, vy: Math.sin(angle)*35, radius: 3, ownerId: b.id });
        }
      }
    }
    // ... 公文包射线逻辑 ...
    if (b.type === 'briefcase') {
      b.laserTimer -= dt;
      if (b.laserTimer <= 0) {
        b.laserTimer = 5;
        const dirs = [{ dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }];
        for (const dir of dirs) {
          let endX = b.x, endY = b.y;
          if (dir.dx > 0) endX = FIELD.size; if (dir.dx < 0) endX = 0;
          if (dir.dy > 0) endY = FIELD.size; if (dir.dy < 0) endY = 0;
          const maxDist = Math.max(Math.abs(endX - b.x), Math.abs(endY - b.y));
          endX = b.x + dir.dx * maxDist; endY = b.y + dir.dy * maxDist;
          window.lasers.push({ x1: b.x, y1: b.y, x2: endX, y2: endY, timer: 2.0, ownerId: b.id });
          for (const enemy of balls) {
            if (!enemy.alive) continue;
            if (distToSegmentSquared(enemy.x, enemy.y, b.x, b.y, endX, endY) < RADIUS * RADIUS) {
              enemy.hp -= 6;
              if (enemy.hp <= 0) { enemy.hp = 0; enemy.alive = false; }
            }
          }
        }
      }
    }
    // ... 陷阱生成逻辑 ...
    if (b.type === 'trap') {
      b.trapTimer -= dt;
      if (b.trapTimer <= 0) {
        b.trapTimer = 4;
        const margin = 20;
        window.traps.push({ x: margin + Math.random()*(FIELD.size - margin*2), y: margin + Math.random()*(FIELD.size - margin*2), radius: 20, timer: 1.0, ownerId: b.id });
      }
    }
  }

  // 3. 子弹、射线、陷阱、蛛丝、荆棘更新（省略重复代码，保持与上一版一致）
  // ... 子弹更新 ...
  for (let i = window.projectiles.length - 1; i >= 0; i--) {
    const p = window.projectiles[i];
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < 0 || p.x > FIELD.size || p.y < 0 || p.y > FIELD.size) { window.projectiles.splice(i, 1); continue; }
    let hit = false;
    for (const b of balls) {
      if (!b.alive || b.invincible || p.ownerId === b.id) continue;
      const r = b.radius || RADIUS;
      if (Math.hypot(p.x - b.x, p.y - b.y) < r + p.radius) {
        b.hp -= 2; b.cryingTimer = 2;
        if (b.hp <= 0) { b.hp = 0; b.alive = false; }
        hit = true; break;
      }
    }
    if (hit) window.projectiles.splice(i, 1);
  }

  // ... 射线更新 ...
  for (let i = window.lasers.length - 1; i >= 0; i--) {
    const laser = window.lasers[i];
    laser.timer -= dt;
    if (laser.timer <= 0) { window.lasers.splice(i, 1); continue; }
    for (const b of balls) {
      if (!b.alive || b.invincible || b.id === laser.ownerId) continue;
      const r = b.radius || RADIUS;
      if (distToSegmentSquared(b.x, b.y, laser.x1, laser.y1, laser.x2, laser.y2) < r * r) {
        b.hp -= 3;
        if (b.hp <= 0) { b.hp = 0; b.alive = false; }
        const dx = laser.x2 - laser.x1, dy = laser.y2 - laser.y1;
        const len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
        const dot = b.vx * nx + b.vy * ny;
        b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny;
        const sign = Math.sign(dot) || 1;
        b.x += nx * (r + 0.5) * sign; b.y += ny * (r + 0.5) * sign;
      }
    }
  }

  // ... 陷阱更新 ...
  for (let i = window.traps.length - 1; i >= 0; i--) {
    const trap = window.traps[i];
    trap.timer -= dt;
    if (trap.timer <= 0) { window.traps.splice(i, 1); continue; }
    let triggered = false;
    for (const b of balls) {
      if (!b.alive || b.invincible || b.id === trap.ownerId) continue;
      const r = b.radius || RADIUS;
      if (Math.hypot(trap.x - b.x, trap.y - b.y) < trap.radius + r) {
        b.hp -= 10;
        if (b.hp <= 0) { b.hp = 0; b.alive = false; }
        triggered = true; break;
      }
    }
    if (triggered) window.traps.splice(i, 1);
  }

  // ... 蛛丝与荆棘更新 ...
  for (const b of balls) {
    if (b.type === 'spider_web' && b.webs) {
      for (let i = b.webs.length - 1; i >= 0; i--) {
        const web = b.webs[i];
        if (web.cooldown > 0) web.cooldown -= dt * 1000;
        for (const enemy of balls) {
          if (enemy === b || !enemy.alive || enemy.invincible) continue;
          const r = enemy.radius || RADIUS;
          if (distToSegmentSquared(enemy.x, enemy.y, b.x, b.y, web.x, web.y) < (r + 0.5) ** 2) {
            if (web.cooldown <= 0) {
              enemy.hp -= 1; web.hp -= 1; web.cooldown = 1000;
              if (enemy.hp <= 0) { enemy.hp = 0; enemy.alive = false; }
              if (web.hp <= 0) { b.webs.splice(i, 1); break; }
            }
          }
        }
      }
    }
    if (b.type === 'thorns' && b.thornPoints) {
      for (let i = 0; i < b.thornCooldowns.length; i++) {
        if (b.thornCooldowns[i] > 0) b.thornCooldowns[i] = Math.max(0, b.thornCooldowns[i] - dt);
      }
      for (let i = 0; i < b.thornPoints.length - 1; i++) {
        const p1 = b.thornPoints[i], p2 = b.thornPoints[i + 1];
        for (const enemy of balls) {
          if (enemy === b || !enemy.alive || enemy.invincible) continue;
          const r = enemy.radius || RADIUS;
          if (distToSegmentSquared(enemy.x, enemy.y, p1.x, p1.y, p2.x, p2.y) < (r + 0.5) ** 2) {
            if (!b.thornCooldowns[i] || b.thornCooldowns[i] <= 0) {
              enemy.hp -= 2; b.thornCooldowns[i] = 0.4;
              if (enemy.hp <= 0) { enemy.hp = 0; enemy.alive = false; }
            }
          }
        }
      }
    }
  }

  // 4. 物理移动与碰撞
  for (const b of balls) stepBall(b, dt);

  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      resolveBallCollision(balls[i], balls[j]);
    }
  }
}
