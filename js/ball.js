// Ball definitions & state
const FIELD = { size: 100 };
const V_BASE = 18; // base speed, units per second
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
    // custom: bounce stacking
    onBounce(ball) {
      ball.speed += 0.3 * V_BASE;
      ball.damage += 1;
    },
    onHit(ball) {
      // after dealing damage, reset
      ball.speed = V_BASE;
      ball.damage = 1;
    },
  },
  void: {
    hp: 100,
    damage: 1,
    texture: 'res/void.png',
  },
};

let ballSeq = 0;

function createBall(typeKey, x, y, angle) {
  const def = BALL_TYPES[typeKey];
  return {
    id: ballSeq++,
    type: typeKey,
    def,
    x, y,
    vx: Math.cos(angle) * V_BASE,
    vy: Math.sin(angle) * V_BASE,
    speed: V_BASE,
    hp: def.hp,
    maxHp: def.hp,
    damage: def.damage,
    alive: true,
  };
}

function randomBall(typeKey) {
  const margin = RADIUS + 1;
  const x = margin + Math.random() * (FIELD.size - margin * 2);
  const y = margin + Math.random() * (FIELD.size - margin * 2);
  const angle = Math.random() * Math.PI * 2;
  return createBall(typeKey, x, y, angle);
}
