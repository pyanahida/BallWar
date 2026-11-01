window.Systems = window.Systems || [];

window.Systems.push({
  update: function(balls, dt) {
    for (const b of balls) {
      if (!b.alive) continue;
      
      // 1. 冰冻状态计时
      if (b.cryingTimer > 0) {
        b.cryingTimer -= dt;
        if (b.cryingTimer < 0) b.cryingTimer = 0;
      }
      
      // 2. 重锤状态机
      if (b.type === 'heavy_hammer') {
        b.hhTimer -= dt;
        if (b.hhPhase === 'move' && b.hhTimer <= 0) {
          b.hhPhase = 'idle';
          b.hhTimer = 1.0;
          b.invincible = true;
          b.vx = 0; b.vy = 0;
        } else if (b.hhPhase === 'idle' && b.hhTimer <= 0) {
          b.hhPhase = 'move';
          b.hhTimer = 4.0;
          b.invincible = false;
          
          const angle = Math.random() * Math.PI * 2;
          b.vx = Math.cos(angle) * b.speed;
          b.vy = Math.sin(angle) * b.speed;

          let hitSomething = false;
          for (const enemy of balls) {
            if (enemy === b || !enemy.alive) continue;
            if (enemy.x >= b.x - 7.5 && enemy.x <= b.x + 7.5 && enemy.y >= b.y + 7.5) {
              enemy.hp -= 20;
              if (enemy.hp <= 0) { enemy.hp = 0; enemy.alive = false; }
              hitSomething = true;
            }
          }
          if (hitSomething) window.flashRed = true;
        }
      }
    }
  }
});
