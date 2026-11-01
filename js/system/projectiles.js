window.Systems = window.Systems || [];

// 计算点到线段的距离平方
function distToSegmentSquared(px, py, x1, y1, x2, y2) {
  const l2 = (x1 - x2) ** 2 + (y1 - y2) ** 2;
  if (l2 === 0) return (px - x1) ** 2 + (py - y1) ** 2;
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return (px - (x1 + t * (x2 - x1))) ** 2 + (py - (y1 + t * (y2 - y1))) ** 2;
}

window.Systems.push({
  update: function(balls, dt) {
    // 1. 发射逻辑
    for (const b of balls) {
      if (!b.alive) continue;

      if (b.type === 'onion') {
        b.shootTimer -= dt;
        if (b.shootTimer <= 0) {
          b.shootTimer = 3;
          const enemies = balls.filter(e => e.alive && e !== b);
          if (enemies.length > 0) {
            const target = enemies[0];
            const angle = Math.atan2(target.y - b.y, target.x - b.x);
            window.projectiles.push({
              x: b.x, y: b.y, vx: Math.cos(angle) * 35, vy: Math.sin(angle) * 35,
              radius: 3, ownerId: b.id
            });
          }
        }
      }

      if (b.type === 'briefcase') {
        b.laserTimer -= dt;
        if (b.laserTimer <= 0) {
          b.laserTimer = 5;
          const dirs = [{ dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }];
          for (const dir of dirs) {
            let endX = b.x, endY = b.y;
            if (dir.dx > 0) endX = FIELD.size;
            if (dir.dx < 0) endX = 0;
            if (dir.dy > 0) endY = FIELD.size;
            if (dir.dy < 0) endY = 0;
            const maxDist = Math.max(Math.abs(endX - b.x), Math.abs(endY - b.y));
            endX = b.x + dir.dx * maxDist; endY = b.y + dir.dy * maxDist;

            window.lasers.push({ x1: b.x, y1: b.y, x2: endX, y2: endY, timer: 2.0, ownerId: b.id });
            
            // 生成瞬间的判定
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
    }

    // 2. 子弹更新
    for (let i = window.projectiles.length - 1; i >= 0; i--) {
      const p = window.projectiles[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      
      if (p.x - p.radius < 0 || p.x + p.radius > FIELD.size || p.y - p.radius < 0 || p.y + p.radius > FIELD.size) {
        window.projectiles.splice(i, 1); continue;
      }
      let hit = false;
      for (const b of balls) {
        if (!b.alive || b.invincible || p.ownerId === b.id) continue;
        if (Math.hypot(p.x - b.x, p.y - b.y) < RADIUS + p.radius) {
          b.hp -= 2; b.cryingTimer = 2; // 命中后冰冻/流泪
          if (b.hp <= 0) { b.hp = 0; b.alive = false; }
          hit = true; break;
        }
      }
      if (hit) window.projectiles.splice(i, 1);
    }

    // 3. 激光/射线更新（镜面反射）
    for (let i = window.lasers.length - 1; i >= 0; i--) {
      const laser = window.lasers[i];
      laser.timer -= dt;
      if (laser.timer <= 0) { window.lasers.splice(i, 1); continue; }
      
      for (const b of balls) {
        if (!b.alive || b.invincible || b.id === laser.ownerId) continue;
        if (distToSegmentSquared(b.x, b.y, laser.x1, laser.y1, laser.x2, laser.y2) < RADIUS * RADIUS) {
          b.hp -= 3;
          if (b.hp <= 0) { b.hp = 0; b.alive = false; }
          
          // 计算法线和反射
          const dx = laser.x2 - laser.x1, dy = laser.y2 - laser.y1;
          const len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
          const dot = b.vx * nx + b.vy * ny;
          b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny;
          
          // 推离射线防止卡死
          const sign = Math.sign(dot) || 1;
          b.x += nx * (RADIUS + 0.5) * sign; b.y += ny * (RADIUS + 0.5) * sign;
        }
      }
    }
  }
});
