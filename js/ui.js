// SVG rendering
const SVG_NS = 'http://www.w3.org/2000/svg';
const arena = document.getElementById('arena');

// preload textures into SVG <defs> as patterns? No — use <image> per ball.
// Textures loaded as <image href>. We can reuse.
function buildScene(balls) {
  arena.innerHTML = '';
  // field border
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', 0);
  rect.setAttribute('y', 0);
  rect.setAttribute('width', 100);
  rect.setAttribute('height', 100);
  rect.setAttribute('fill', 'none');
  rect.setAttribute('stroke', '#2a3550');
  rect.setAttribute('stroke-width', '0.5');
  arena.appendChild(rect);

  for (const ball of balls) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('data-id', ball.id);

    const img = document.createElementNS(SVG_NS, 'image');
    img.setAttribute('href', ball.def.texture);
    img.setAttribute('x', ball.x - RADIUS);
    img.setAttribute('y', ball.y - RADIUS);
    img.setAttribute('width', RADIUS * 2);
    img.setAttribute('height', RADIUS * 2);
    img.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    g.appendChild(img);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', ball.x);
    text.setAttribute('y', ball.y);
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
    const img = g.querySelector('image');
    img.setAttribute('x', ball.x - RADIUS);
    img.setAttribute('y', ball.y - RADIUS);
    const text = g.querySelector('text');
    text.setAttribute('x', ball.x);
    text.setAttribute('y', ball.y);
    text.textContent = Math.ceil(ball.hp);
  }
}
