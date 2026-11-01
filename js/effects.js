// 技能注册表
window.EFFECTS = {
  spear_onBounce: function(ball) {
    ball.speed += 0.3 * window.V_BASE;
    ball.damage += 1;
  },
  spear_onHit: function(ball) {
    ball.speed = window.V_BASE;
    ball.damage = 1;
  },
  steel_coil_getDamage: function(ball, enemy) {
    const distToLeft = enemy.x;
    const distToRight = FIELD.size - enemy.x;
    const distToTop = enemy.y;
    const distToBottom = FIELD.size - enemy.y;
    const minDistToEdge = Math.min(distToLeft, distToRight, distToTop, distToBottom);
    return minDistToEdge < 30 ? 3 : 1;
  },
  one_way_mirror_onBounce: function(ball) {
    ball.hp -= 1;
    if (ball.hp <= 0) { ball.hp = 0; ball.alive = false; }
  },
  spider_web_onBounce: function(ball, bounceX, bounceY) {
    if (!ball.webs) ball.webs = [];
    ball.webs.push({ x: bounceX, y: bounceY, hp: 3, cooldown: 0 });
  },
  thorns_onBounce: function(ball, bounceX, bounceY) {
    if (!ball.thornPoints) ball.thornPoints = [];
    ball.thornPoints.push({ x: bounceX, y: bounceY });
    if (ball.thornPoints.length > 5) ball.thornPoints.shift();
    if (!ball.thornCooldowns) ball.thornCooldowns = [];
    ball.thornCooldowns.push(0); 
    if (ball.thornCooldowns.length > 4) ball.thornCooldowns.shift();
  },
  
  // 吸血鬼：50%概率吸血，50%概率普通伤害
  vampire_onHit: function(ball, enemy) {
    if (Math.random() < 0.5) {
      // 抵消原有的1点伤害，重新结算
      enemy.hp -= 2; // 原本的1点已经在 physics 里扣了，这里再扣2点，总共3点
      ball.hp = Math.min(ball.maxHp, ball.hp + 3);
      if (enemy.hp <= 0) { enemy.hp = 0; enemy.alive = false; }
    }
  },

  // 重锤：通过状态机在 physics 的 stepAll 里统一处理
  heavy_hammer_onBounce: function(ball) {
    // 正常碰撞反弹，不需要特殊处理
  }
};
