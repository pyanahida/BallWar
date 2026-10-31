// Ball definitions & state
const FIELD = { size: 100 };
window.V_BASE = 18; // base speed, units per second
const RADIUS = 7.5; // diameter 15

const BALL_TYPES = {
  common: {
    hp: 100,
    damage: 1,
    texture: 'res/common.png',
  },
  spear: {
    hp: 100,
    damage: 1,
    texture: 'res/spear.png',
    onBounce(ball) {
      ball.speed += 0.3 * window.V_BASE;
      ball.damage += 1;
    },
    onHit(ball) {
      ball.speed = window.V_BASE;
      ball.damage = 1;
    },
  },
  void: {
    hp: 100,
    damage: 1,
    texture: 'res/void.png',
  },
  steel_coil: {
    hp: 100,
    damage: 1,
    texture: 'res/steel_coil.png',
    getDamage(ball, enemy) {
      const distToLeft = enemy.x;
      const distToRight = FIELD.size - enemy.x;
      const distToTop = enemy.y;
      const distToBottom = FIELD.size - enemy.y;
      const minDistToEdge = Math.min(distToLeft, distToRight, distToTop, distToBottom);
      return minDistToEdge < 30 ? 3 : 1;
    }
  },
  one_way_mirror: {
    hp: 100,
    damage: 5,
    texture: 'res/one_way_mirror.png',
    onBounce(ball) {
      ball.hp -= 1;
      if (ball.hp <= 0) {
        ball.hp = 0;
        ball.alive = false;
      }
    }
  },
  spider_web: {
    hp: 100,
    damage: 0,
    texture: 'res/spider_web.png',
    onBounce(ball, bounceX, bounceY) {
      if (!ball.webs) ball.webs = [];
      ball.webs.push({
        x: bounceX,
        y: bounceY,
        hp: 3,
        cooldown: 0
      });
    }
  },
  onion: {
    hp: 100,
    damage: 5,
    texture: 'res/onion.png'
  },
  trap: {
    hp: 100,
    damage: 1,
    texture: 'res/trap.png'
  },
  thorns: {
    hp: 100,
    damage: 1,
    texture: 'res/thorns.png',
    onBounce(ball, bounceX, bounceY) {
      if (!ball.thornPoints) ball.thornPoints = [];
      ball.thornPoints.push({ x: bounceX, y: bounceY });
      if (ball.thornPoints.length > 5) {
        ball.thornPoints.shift();
      }
      // 重新生成线段冷却计时
      if (!ball.thornCooldowns) ball.thornCooldowns = [];
      // 新增一个点意味着可能多出一条新线段，给它加个冷却
      ball.thornCooldowns.push(0); 
      if (ball.thornCooldowns.length > 4) ball.thornCooldowns.shift();
    }
  }
};

let ballSeq = 0;

function createBall(typeKey, x, y, angle) {
  const def = BALL_TYPES[typeKey];
  const ball = {
    id: ballSeq++,
    type: typeKey,
    def,
    x, y,
    vx: Math.cos(angle) * window.V_BASE,
    vy: Math.sin(angle) * window.V_BASE,
    speed: window.V_BASE,
    hp: def.hp,
    maxHp: def.hp,
    damage: def.damage,
    alive: true,
    cryingTimer: 0
  };
  if (typeKey === 'spider_web') ball.webs = [];
  if (typeKey === 'onion') ball.shootTimer = 3;
  if (typeKey === 'trap') ball.trapTimer = 4;
  if (typeKey === 'thorns') {
    ball.thornPoints = [];
    ball.thornCooldowns = [];
  }
  return ball;
}

function randomBall(typeKey) {
  const margin = RADIUS + 1;
  const x = margin + Math.random() * (FIELD.size - margin * 2);
  const y = margin + Math.random() * (FIELD.size - margin * 2);
  const angle = Math.random() * Math.PI * 2;
  return createBall(typeKey, x, y, angle);
}
