// Ambient motion and celebration effects.

const TAU = Math.PI * 2;
export const prefersCalm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- Background: a living circuit board with current pulses ----
export function startBackground(canvas, getAccent, { calm = false } = {}) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, traces = [], pulses = [], raf = 0;
  const G = 28;
  function build() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    traces = [];
    const n = Math.floor((W * H) / 26000);
    for (let i = 0; i < n; i++) {
      let x = Math.round(Math.random() * W / G) * G, y = Math.round(Math.random() * H / G) * G;
      const pts = [[x, y]];
      let dir = Math.floor(Math.random() * 4);
      const segs = 2 + Math.floor(Math.random() * 4);
      for (let s = 0; s < segs; s++) {
        const len = G * (2 + Math.floor(Math.random() * 6));
        const d = [[1, 0], [0, 1], [-1, 0], [0, -1]][dir];
        // 45° chamfers like real PCB routing
        if (s > 0) { x += d[0] * G * 0.5 + ([[0, 1], [1, 0]][dir % 2][0]) * 0; }
        x += d[0] * len; y += d[1] * len;
        pts.push([x, y]);
        dir = (dir + (Math.random() < 0.5 ? 1 : 3)) % 4;
      }
      let total = 0;
      const lens = pts.slice(1).map((p, k) => { const l = Math.hypot(p[0] - pts[k][0], p[1] - pts[k][1]); total += l; return l; });
      traces.push({ pts, lens, total });
    }
    pulses = traces.map(tr => ({ tr, pos: Math.random() * tr.total, speed: 40 + Math.random() * 90 }));
  }
  function at(tr, d) {
    for (let k = 0; k < tr.lens.length; k++) {
      if (d <= tr.lens[k]) {
        const a = tr.pts[k], b = tr.pts[k + 1], f = d / tr.lens[k];
        return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      }
      d -= tr.lens[k];
    }
    return tr.pts[tr.pts.length - 1];
  }
  let last = performance.now();
  function draw(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(201,138,60,0.10)';
    for (const tr of traces) {
      ctx.beginPath(); tr.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      const [sx, sy] = tr.pts[0], [ex, ey] = tr.pts[tr.pts.length - 1];
      ctx.fillStyle = 'rgba(201,138,60,0.16)';
      ctx.beginPath(); ctx.arc(sx, sy, 3, 0, TAU); ctx.arc(ex, ey, 3, 0, TAU); ctx.fill();
    }
    const accent = getAccent();
    for (const p of pulses) {
      if (!calm) p.pos = (p.pos + p.speed * dt) % p.tr.total;
      const [x, y] = at(p.tr, p.pos);
      const g = ctx.createRadialGradient(x, y, 0, x, y, 10);
      g.addColorStop(0, accent); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.55; ctx.fillStyle = g; ctx.fillRect(x - 10, y - 10, 20, 20); ctx.globalAlpha = 1;
    }
    if (!calm) raf = requestAnimationFrame(draw);
  }
  build(); draw(performance.now());
  addEventListener('resize', () => { build(); if (calm) draw(performance.now()); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf); else if (!calm) { last = performance.now(); raf = requestAnimationFrame(draw); }
  });
  return { setCalm(v) { calm = v; cancelAnimationFrame(raf); if (!calm) raf = requestAnimationFrame(draw); else draw(performance.now()); } };
}

// ---- Sound: a tiny synth for unlocks ----
let actx = null;
export function blip(kind = 'unlock', enabled = true) {
  if (!enabled) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = { unlock: [523, 659, 784, 1046], tick: [880], rank: [392, 523, 659, 784, 1046, 1318], phase: [262, 330, 392, 523, 659, 784, 1046] }[kind] || [660];
    notes.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = kind === 'tick' ? 'square' : 'triangle';
      o.frequency.value = f;
      const t = actx.currentTime + i * 0.09;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(kind === 'tick' ? 0.03 : 0.08, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'tick' ? 0.06 : 0.35));
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.4);
    });
  } catch {}
}

// ---- Electron burst ----
export function burst(x, y, color = '#39ff9f', count = 60) {
  if (prefersCalm()) return;
  const c = document.createElement('canvas');
  c.className = 'fx-burst';
  c.width = innerWidth; c.height = innerHeight;
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  const parts = Array.from({ length: count }, () => {
    const a = Math.random() * TAU, s = 120 + Math.random() * 380;
    return { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6 + Math.random() * 0.8 };
  });
  let last = performance.now(), age = 0;
  (function step(now) {
    const dt = (now - last) / 1000; last = now; age += dt;
    ctx.clearRect(0, 0, c.width, c.height);
    for (const p of parts) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96;
      const a = Math.max(0, 1 - age / p.life);
      ctx.globalAlpha = a; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, TAU); ctx.fill();
      ctx.globalAlpha = a * 0.4; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); ctx.strokeStyle = color; ctx.stroke();
    }
    if (age < 1.6) requestAnimationFrame(step); else c.remove();
  })(last);
}

// ---- Full-screen "power on" cinematic for unlocks / rank-ups / chapters ----
export function powerOn({ kicker, title, sub, color = '#39ff9f', lines = [], cta = 'Continue', kind = 'unlock', sound = true }) {
  return new Promise(resolve => {
    const el = document.createElement('div');
    el.className = `poweron poweron--${kind}`;
    el.style.setProperty('--accent', color);
    el.innerHTML = `
      <div class="poweron__scan"></div>
      <svg class="poweron__circuit" viewBox="0 0 600 200" aria-hidden="true">
        <path class="po-trace" d="M0 100 H140 L170 70 H260" />
        <path class="po-trace" d="M600 100 H460 L430 130 H340" />
        <path class="po-trace po-trace--thin" d="M0 150 H90 L120 120 H200 L230 150 H260" />
        <path class="po-trace po-trace--thin" d="M600 50 H510 L480 80 H400 L370 50 H340" />
        <rect class="po-chip" x="260" y="55" width="80" height="90" rx="6" />
        ${Array.from({ length: 6 }, (_, i) => `<rect class="po-pin" x="${250}" y="${63 + i * 13}" width="10" height="5"/><rect class="po-pin" x="${340}" y="${63 + i * 13}" width="10" height="5"/>`).join('')}
        <circle class="po-led" cx="300" cy="100" r="12" />
      </svg>
      <div class="poweron__body">
        <div class="poweron__kicker">${kicker || ''}</div>
        <h2 class="poweron__title">${title}</h2>
        ${sub ? `<p class="poweron__sub">${sub}</p>` : ''}
        <pre class="poweron__term"></pre>
        <button class="btn btn--primary poweron__cta">${cta}</button>
      </div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-on'));
    setTimeout(() => blip(kind === 'rank' ? 'rank' : kind === 'phase' ? 'phase' : 'unlock', sound), 650);
    setTimeout(() => burst(innerWidth / 2, innerHeight * 0.42, color, kind === 'phase' ? 140 : 70), 900);
    const term = el.querySelector('.poweron__term');
    const all = lines.join('\n');
    let i = 0;
    const typer = setInterval(() => {
      term.textContent = all.slice(0, i) + (i < all.length ? '▌' : '');
      i += 2;
      if (i > all.length + 2) clearInterval(typer);
    }, prefersCalm() ? 1 : 18);
    const done = () => { clearInterval(typer); el.classList.remove('is-on'); el.classList.add('is-off'); setTimeout(() => { el.remove(); resolve(); }, 400); };
    el.querySelector('.poweron__cta').addEventListener('click', done);
    el.addEventListener('keydown', e => { if (e.key === 'Escape' || e.key === 'Enter') done(); });
    setTimeout(() => el.querySelector('.poweron__cta').focus(), 500);
  });
}

export function toast(msg, kind = 'info') {
  let host = document.querySelector('.toasts');
  if (!host) { host = document.createElement('div'); host.className = 'toasts'; document.body.appendChild(host); }
  const t = document.createElement('div');
  t.className = `toast toast--${kind}`;
  t.innerHTML = `<span class="toast__led"></span>${msg}`;
  host.appendChild(t);
  setTimeout(() => t.classList.add('is-out'), 3200);
  setTimeout(() => t.remove(), 3700);
}
