// Ball definitions & state
const FIELD = { size: 100 };
window.V_BASE = 18; // base speed, units per second
const RADIUS = 7.5; // diameter 15

window.BALL_TYPES = {}; // 将会从 balls.json 加载

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
  
  // 根据球种初始化特殊属性
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

// 暴露给 main.js，用于将 JSON 数据转换为包含逻辑的 BALL_TYPES
window.loadBallData = function(data) {
  for (const key in data) {
    BALL_TYPES[key] = { ...data[key] };
    
    // 自动挂载技能函数
    if (EFFECTS[`${key}_onBounce`]) BALL_TYPES[key].onBounce = EFFECTS[`${key}_onBounce`];
    if (EFFECTS[`${key}_onHit`]) BALL_TYPES[key].onHit = EFFECTS[`${key}_onHit`];
    if (EFFECTS[`${key}_getDamage`]) BALL_TYPES[key].getDamage = EFFECTS[`${key}_getDamage`];
  }
};
