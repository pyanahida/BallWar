window.Systems = window.Systems || [];

function distToSegSq(px, py, x1, y1, x2, y2) {
  const l2 = (x1 - x2) ** 2 + (y1 - y2) ** 2;
  if (l2 === 0) return (px - x1) ** 2 + (py - y1) ** 2;
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return (px - (x1 + t * (x2 - x1))) ** 2 + (py - (y1 + t * (y2 - y1))) ** 2;
}

window.Systems.push({
  update: function(balls, dt) {
    // 1. 陷阱球生成
    for (const b of balls) {
      if (b.alive && b.type === 'trap') {
        b.trapTimer -= dt;
        if (b.trapTimer <= 0) {
          b.trapTimer = 4;
          const margin = 20;
          window.traps.push({
            x: margin + Math.random() * (FIELD.size - margin * 2),
            y: margin + Math.random() * (FIELD.size - margin * 2),
            radius: 20, timer: 1.0, ownerId: b.id
          });
        }
      }
    }

    // 2. 陷阱伤害更新
    for (let i = window.traps.length - 1; i >= 0; i--) {
      const trap = window.traps[i];
      trap.timer -= dt;
      if (trap.timer <= 0) { window.traps.splice(i, 1); continue; }
      
      let triggered = false;
      for (const b of balls) {
        if (!b.alive || b.invincible || b.id === trap.ownerId) continue;
        if (Math.hypot(trap.x - b.x, trap.y - b.y) < trap.radius + RADIUS) {
          b.hp -= 10;
          if (b.hp <= 0) { b.hp = 0; b.alive = false; }
          triggered = true; break;
        }
      }
      if (triggered) window.traps.splice(i, 1);
    }

    // 3. 蛛丝与荆棘伤害
    for (const b of balls) {
      // 蛛丝
      if (b.type === 'spider_web' && b.webs) {
        for (let i = b.webs.length - 1; i >= 0; i--) {
          const web = b.webs[i];
          if (web.cooldown > 0) web.cooldown -= dt * 1000;
          
          for (const enemy of balls) {
            if (enemy === b || !enemy.alive || enemy.invincible) continue;
            if (distToSegSq(enemy.x, enemy.y, b.x, b.y, web.x, web.y) < (RADIUS + 0.5) ** 2) {
              if (web.cooldown <= 0) {
                enemy.hp -= 1; web.hp -= 1; web.cooldown = 1000;
                if (enemy.hp <= 0) { enemy.hp = 0; enemy.alive = false; }
                if (web.hp <= 0) { b.webs.splice(i, 1); break; }
              }
            }
          }
        }
      }

      // 荆棘
      if (b.type === 'thorns' && b.thornPoints) {
        for (let i = 0; i < b.thornCooldowns.length; i++) {
          if (b.thornCooldowns[i] > 0) b.thornCooldowns[i] = Math.max(0, b.thornCooldowns[i] - dt);
        }
        for (let i = 0; i < b.thornPoints.length - 1; i++) {
          const p1 = b.thornPoints[i], p2 = b.thornPoints[i + 1];
          for (const enemy of balls) {
            if (enemy === b || !enemy.alive || enemy.invincible) continue;
            if (distToSegSq(enemy.x, enemy.y, p1.x, p1.y, p2.x, p2.y) < (RADIUS + 0.5) ** 2) {
              if (!b.thornCooldowns[i] || b.thornCooldowns[i] <= 0) {
                enemy.hp -= 2; b.thornCooldowns[i] = 0.4;
                if (enemy.hp <= 0) { enemy.hp = 0; enemy.alive = false; }
              }
            }
          }
        }
      }
    }
  }
});
