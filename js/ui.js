// SVG rendering
const SVG_NS = 'http://www.w3.org/2000/svg';
const arena = document.getElementById('arena');

function buildScene(balls) {
  arena.innerHTML = '';
  
  // 定义 <defs> 用于存放各种球的贴图
  const defs = document.createElementNS(SVG_NS, 'defs');
  arena.appendChild(defs);

  // 场边界
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', 0);
  rect.setAttribute('y', 0);
  rect.setAttribute('width', 100);
  rect.setAttribute('height', 100);
  rect.setAttribute('fill', '#10141f');
  rect.setAttribute('stroke', '#2a3550');
  rect.setAttribute('stroke-width', '0.5');
  arena.appendChild(rect);

  // 为每个球生成独立的贴图 pattern
  for (const ball of balls) {
    if (document.getElementById(`pat-${ball.id}`)) continue;
    
    const pat = document.createElementNS(SVG_NS, 'pattern');
    pat.setAttribute('id', `pat-${ball.id}`);
    pat.setAttribute('width', RADIUS * 2);
    pat.setAttribute('height', RADIUS * 2);
    pat.setAttribute('patternUnits', 'userSpaceOnUse');
    
    const img = document.createElementNS(SVG_NS, 'image');
    img.setAttribute('href', ball.def.texture);
    img.setAttribute('width', RADIUS * 2);
    img.setAttribute('height', RADIUS * 2);
    img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    
    pat.appendChild(img);
    defs.appendChild(pat);
  }

  // 生成球体元素和血量文字
  for (const ball of balls) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('data-id', ball.id);

    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('r', RADIUS);
    circle.setAttribute('fill', `url(#pat-${ball.id})`);
    g.appendChild(circle);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('font-size', '6');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', '#ffffff');
    text.setAttribute('stroke', '#000000');
    text.setAttribute('stroke-width', '0.5');
    text.setAttribute('paint-order', 'stroke');
    text.textContent = Math.ceil(ball.hp);
    g.appendChild(text);

    arena.appendChild(g);
  }
}

function updateScene(balls) {
  for (const ball of balls) {
    const g = arena.querySelector(`g[data-id="${ball.id}"]`);
    if (!g) continue;
    if (!ball.alive) {
      g.style.display = 'none';
      continue;
    }
    const circle = g.querySelector('circle');
    circle.setAttribute('cx', ball.x);
    circle.setAttribute('cy', ball.y);

    const text = g.querySelector('text');
    text.setAttribute('x', ball.x);
    text.setAttribute('y', ball.y);
    text.textContent = Math.ceil(ball.hp);
  }
}
