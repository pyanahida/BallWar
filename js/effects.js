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
    if (ball.hp <= 0) {
      ball.hp = 0;
      ball.alive = false;
    }
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
  }
};
