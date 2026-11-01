// SVG rendering
const SVG_NS = 'http://www.w3.org/2000/svg';
const arena = document.getElementById('arena');
const damageFlash = document.getElementById('damageFlash');

function buildScene(balls) {
  arena.innerHTML = '';
  
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', 0); rect.setAttribute('y', 0);
  rect.setAttribute('width', 100); rect.setAttribute('height', 100);
  rect.setAttribute('fill', '#10141f'); rect.setAttribute('stroke', '#2a3550'); rect.setAttribute('stroke-width', '0.5');
  arena.appendChild(rect);

  // 为初始球构建 DOM
  for (const ball of balls) {
    createBallDOM(ball);
  }
}

function createBallDOM(ball) {
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('data-id', ball.id);

  if (ball.type === 'guard') {
    // 卫兵直接画红色圆圈
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('r', GUARD_RADIUS);
    circle.setAttribute('fill', '#ff0000');
    circle.setAttribute('stroke', '#ffffff');
    circle.setAttribute('stroke-width', '0.5');
    circle.setAttribute('cx', ball.x);
    circle.setAttribute('cy', ball.y);
    g.appendChild(circle);
    
    // 护盾提示圈
    if (ball.shields > 0) {
      const shieldRing = document.createElementNS(SVG_NS, 'circle');
      shieldRing.setAttribute('r', GUARD_RADIUS + 1);
      shieldRing.setAttribute('fill', 'none');
      shieldRing.setAttribute('stroke', '#00ffff');
      shieldRing.setAttribute('stroke-width', '0.5');
      shieldRing.setAttribute('cx', ball.x);
      shieldRing.setAttribute('cy', ball.y);
      shieldRing.setAttribute('class', 'shield-ring');
      g.appendChild(shieldRing);
    }
  } else {
    // 普通球用贴图
    const img = document.createElementNS(SVG_NS, 'image');
    img.setAttribute('href', ball.def.texture);
    img.setAttribute('width', RADIUS * 2);
    img.setAttribute('height', RADIUS * 2);
    img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    img.setAttribute('x', ball.x - RADIUS);
    img.setAttribute('y', ball.y - RADIUS);
    g.appendChild(img);
  }

  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('dominant-baseline', 'central');
  text.setAttribute('font-size', '6');
  text.setAttribute('font-weight', 'bold');
  text.setAttribute('fill', '#ffffff');
  text.setAttribute('stroke', '#000000');
  text.setAttribute('stroke-width', '0.5');
  text.setAttribute('paint-order', 'stroke');
  text.setAttribute('x', ball.x);
  text.setAttribute('y', ball.y);
  text.textContent = Math.ceil(ball.hp);
  g.appendChild(text);

  arena.appendChild(g);
}

function updateScene(balls, projectiles, traps) {
  if (window.flashRed) {
    window.flashRed = false;
    damageFlash.style.opacity = '1';
    setTimeout(() => { damageFlash.style.opacity = '0'; }, 200);
  }

  arena.querySelectorAll('.dynamic-element').forEach(el => el.remove());
  const firstBallG = arena.querySelector('g[data-id]');

  // ... 渲染蛛丝、荆棘、陷阱、子弹、射线 ...（保持不变）

  // 渲染球及状态
  for (const ball of balls) {
    let g = arena.querySelector(`g[data-id="${ball.id}"]`);
    
    // 如果是新召出来的卫兵，DOM 还没建，补建
    if (!g && ball.alive) {
      createBallDOM(ball);
      g = arena.querySelector(`g[data-id="${ball.id}"]`);
    }
    
    if (!g) continue;
    if (!ball.alive) { g.style.display = 'none'; continue; }
    
    if (ball.type === 'guard') {
      const circle = g.querySelector('circle');
      circle.setAttribute('cx', ball.x);
      circle.setAttribute('cy', ball.y);
      
      // 更新护盾环
      let shieldRing = g.querySelector('.shield-ring');
      if (ball.shields > 0) {
        if (!shieldRing) {
          shieldRing = document.createElementNS(SVG_NS, 'circle');
          shieldRing.setAttribute('r', GUARD_RADIUS + 1);
          shieldRing.setAttribute('fill', 'none');
          shieldRing.setAttribute('stroke', '#00ffff');
          shieldRing.setAttribute('stroke-width', '0.5');
          shieldRing.setAttribute('class', 'shield-ring');
          g.insertBefore(shieldRing, g.querySelector('text'));
        }
        shieldRing.setAttribute('cx', ball.x);
        shieldRing.setAttribute('cy', ball.y);
      } else if (shieldRing) {
        shieldRing.remove();
      }
    } else {
      const img = g.querySelector('image');
      if (img) {
        img.setAttribute('x', ball.x - RADIUS);
        img.setAttribute('y', ball.y - RADIUS);
        const expectedTexture = ball.cryingTimer > 0 ? 'res/crying.png' : ball.def.texture;
        if (img.getAttribute('href') !== expectedTexture) img.setAttribute('href', expectedTexture);
      }
    }
    
    const text = g.querySelector('text');
    text.setAttribute('x', ball.x);
    text.setAttribute('y', ball.y);
    text.textContent = Math.ceil(ball.hp);
  }
}
