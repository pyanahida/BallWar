// Ball definitions & state
const FIELD = { size: 100 };
window.V_BASE = 18;
const RADIUS = 7.5;
const GUARD_RADIUS = 4; // 卫兵半径

window.BALL_TYPES = {}; 
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
    cryingTimer: 0,
    invincible: false
  };
  
  if (typeKey === 'spider_web') ball.webs = [];
  if (typeKey === 'onion') ball.shootTimer = 3;
  if (typeKey === 'trap') ball.trapTimer = 4;
  if (typeKey === 'thorns') {
    ball.thornPoints = [];
    ball.thornCooldowns = [];
  }
  if (typeKey === 'briefcase') ball.laserTimer = 5;
  if (typeKey === 'heavy_hammer') {
    ball.hhPhase = 'move';
    ball.hhTimer = 4;
  }
  if (typeKey === 'king') {
    ball.summonTimer = 5; // 国王召唤倒计时
    ball.kingId = ball.id; // 记录自己的 ID
  }
  if (typeKey === 'guard') {
    ball.radius = GUARD_RADIUS; // 卫兵独立半径
    ball.shields = 3;           // 3 个护盾
    ball.kingId = arguments[3]; // 记录国王的 ID
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

window.loadBallData = function(data) {
  for (const key in data) {
    BALL_TYPES[key] = { ...data[key] };
    if (EFFECTS[`${key}_onBounce`]) BALL_TYPES[key].onBounce = EFFECTS[`${key}_onBounce`];
    if (EFFECTS[`${key}_onHit`]) BALL_TYPES[key].onHit = EFFECTS[`${key}_onHit`];
    if (EFFECTS[`${key}_getDamage`]) BALL_TYPES[key].getDamage = EFFECTS[`${key}_getDamage`];
  }
};
