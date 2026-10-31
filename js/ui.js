// SVG rendering
const SVG_NS = 'http://www.w3.org/2000/svg';
const arena = document.getElementById('arena');

function buildScene(balls) {
  arena.innerHTML = '';
  
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', 0);
  rect.setAttribute('y', 0);
  rect.setAttribute('width', 100);
  rect.setAttribute('height', 100);
  rect.setAttribute('fill', '#10141f');
  rect.setAttribute('stroke', '#2a3550');
  rect.setAttribute('stroke-width', '0.5');
  arena.appendChild(rect);

  for (const ball of balls) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('data-id', ball.id);

    const img = document.createElementNS(SVG_NS, 'image');
    img.setAttribute('href', ball.def.texture);
    img.setAttribute('width', RADIUS * 2);
    img.setAttribute('height', RADIUS * 2);
    img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    img.setAttribute('x', ball.x - RADIUS);
    img.setAttribute('y', ball.y - RADIUS);
    g.appendChild(img);

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
}

function updateScene(balls, projectiles, traps) {
  arena.querySelectorAll('.dynamic-element').forEach(el => el.remove());

  const firstBallG = arena.querySelector('g[data-id]');

  // 渲染蛛丝
  for (const ball of balls) {
    if (ball.type === 'spider_web' && ball.webs && ball.alive) {
      for (const web of ball.webs) {
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', ball.x);
        line.setAttribute('y1', ball.y);
        line.setAttribute('x2', web.x);
        line.setAttribute('y2', web.y);
        line.setAttribute('stroke', '#FFF');
        line.setAttribute('stroke-width', web.cooldown > 0 ? '0.3' : '0.6');
        line.setAttribute('stroke-opacity', web.cooldown > 0 ? '0.5' : '1');
        line.setAttribute('class', 'dynamic-element');
        
        if (firstBallG) arena.insertBefore(line, firstBallG);
        else arena.appendChild(line);
      }
    }
  }

  // 渲染荆棘
  for (const ball of balls) {
    if (ball.type === 'thorns' && ball.thornPoints && ball.alive) {
      for (let i = 0; i < ball.thornPoints.length - 1; i++) {
        const p1 = ball.thornPoints[i];
        const p2 = ball.thornPoints[i + 1];
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', p1.x);
        line.setAttribute('y1', p1.y);
        line.setAttribute('x2', p2.x);
        line.setAttribute('y2', p2.y);
        line.setAttribute('stroke', '#00FF00'); // 绿色
        const isCoolingDown = ball.thornCooldowns && ball.thornCooldowns[i] > 0;
        line.setAttribute('stroke-width', isCoolingDown ? '0.3' : '0.6');
        line.setAttribute('stroke-opacity', isCoolingDown ? '0.5' : '1');
        line.setAttribute('class', 'dynamic-element');
        
        if (firstBallG) arena.insertBefore(line, firstBallG);
        else arena.appendChild(line);
      }
    }
  }

  // 渲染陷阱
  for (const trap of traps) {
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', trap.x);
    circle.setAttribute('cy', trap.y);
    circle.setAttribute('r', trap.radius);
    circle.setAttribute('fill', '#D00');
    circle.setAttribute('opacity', (trap.timer / 1.0) * 0.6);
    circle.setAttribute('class', 'dynamic-element');
    
    if (firstBallG) arena.insertBefore(circle, firstBallG);
    else arena.appendChild(circle);
  }

  // 渲染子弹
  for (const p of projectiles) {
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', p.x);
    circle.setAttribute('cy', p.y);
    circle.setAttribute('r', p.radius);
    circle.setAttribute('fill', '#9b59b6'); 
    circle.setAttribute('class', 'dynamic-element');
    if (firstBallG) arena.insertBefore(circle, firstBallG);
    else arena.appendChild(circle);
  }

  // 渲染球及状态
  for (const ball of balls) {
    const g = arena.querySelector(`g[data-id="${ball.id}"]`);
    if (!g) continue;
    if (!ball.alive) {
      g.style.display = 'none';
      continue;
    }
    
    const img = g.querySelector('image');
    if (img) {
      img.setAttribute('x', ball.x - RADIUS);
      img.setAttribute('y', ball.y - RADIUS);
      
      const expectedTexture = ball.cryingTimer > 0 ? 'res/crying.png' : ball.def.texture;
      if (img.getAttribute('href') !== expectedTexture) {
        img.setAttribute('href', expectedTexture);
      }
    }

    const text = g.querySelector('text');
    text.setAttribute('x', ball.x);
    text.setAttribute('y', ball.y);
    text.textContent = Math.ceil(ball.hp);
  }
}
