// Weekly animated scenes. Every level gets its own scene: the topic picks the
// scene type, and the week number tunes its parameters so no two weeks look alike.

const TAU = Math.PI * 2;

function rng(seed) {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function graticule(ctx, W, H, color = 'rgba(120,255,200,0.08)', div = 10) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 1;
  const dx = W / div, dy = H / 8;
  for (let i = 0; i <= div; i++) { ctx.beginPath(); ctx.moveTo(i * dx, 0); ctx.lineTo(i * dx, H); ctx.stroke(); }
  for (let j = 0; j <= 8; j++) { ctx.beginPath(); ctx.moveTo(0, j * dy); ctx.lineTo(W, j * dy); ctx.stroke(); }
  ctx.strokeStyle = color.replace(/[\d.]+\)$/, '0.22)');
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
  ctx.restore();
}

function glowLine(ctx, pts, color, width = 2, blur = 14) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.shadowColor = color; ctx.shadowBlur = blur;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.restore();
}

function label(ctx, text, x, y, color = 'rgba(220,255,240,0.7)', size = 11, align = 'left') {
  ctx.save();
  ctx.font = `${size}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.fillStyle = color; ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function dot(ctx, x, y, r, color, blur = 12) {
  ctx.save(); ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = blur;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
}

// --- scene implementations -----------------------------------------------
const S = {};

// Oscilloscope with triggered waveform; variant changes waveform type.
S.scope = (ctx, W, H, t, P) => {
  graticule(ctx, W, H);
  const kinds = ['sine', 'square', 'tri', 'am'];
  const kind = kinds[P.k % kinds.length];
  const f = 2 + P.k, ph = t * 2.2;
  const wave = x => {
    const a = TAU * f * x - ph;
    if (kind === 'sine') return Math.sin(a);
    if (kind === 'square') return Math.sign(Math.sin(a)) * 0.8;
    if (kind === 'tri') return (2 / Math.PI) * Math.asin(Math.sin(a));
    return Math.sin(a * 4) * (0.6 + 0.4 * Math.sin(a / 3));
  };
  const pts = [];
  for (let x = 0; x <= W; x += 2) pts.push([x, H / 2 - wave(x / W) * H * 0.32]);
  glowLine(ctx, pts, P.c, 2.2);
  const pts2 = [];
  for (let x = 0; x <= W; x += 2) pts2.push([x, H / 2 - Math.sin(TAU * f * 2 * x / W - ph * 1.3) * H * 0.12 + H * 0.25]);
  glowLine(ctx, pts2, P.c2, 1.4, 8);
  label(ctx, `CH1 ${kind.toUpperCase()}  ${(f * 1.0).toFixed(1)} kHz`, 12, 20, P.c);
  label(ctx, 'CH2 1.00V/div   T: 100µs/div   TRIG ↑', 12, H - 12, P.c2);
};

// RC charge / discharge and RLC ringing.
S.rc = (ctx, W, H, t, P) => {
  graticule(ctx, W, H);
  const tau = 0.08 + 0.04 * P.k;
  const per = 0.5;
  const pts = [], sq = [];
  for (let x = 0; x <= W; x += 2) {
    const tt = (x / W + t * 0.15) % 1;
    const cyc = tt % per, high = Math.floor(tt / per) % 2 === 0;
    const v = high ? 1 - Math.exp(-cyc / tau) : Math.exp(-cyc / tau);
    pts.push([x, H * 0.82 - v * H * 0.6]);
    sq.push([x, H * 0.82 - (high ? 1 : 0) * H * 0.6]);
  }
  glowLine(ctx, sq, hexA(P.c2, 0.5), 1, 4);
  glowLine(ctx, pts, P.c, 2.4);
  // RLC ringing
  const zeta = 0.08 + 0.05 * P.k, wn = 40;
  const r = [];
  for (let x = 0; x <= W; x += 2) {
    const tt = ((x / W) + t * 0.1) % 1;
    const v = 1 - Math.exp(-zeta * wn * tt) * Math.cos(wn * Math.sqrt(1 - zeta * zeta) * tt);
    r.push([x, H * 0.35 - (v - 1) * H * 0.2]);
  }
  glowLine(ctx, r, P.c2, 1.4, 8);
  label(ctx, `τ = RC = ${(tau * 10).toFixed(2)} ms`, 12, 20, P.c);
  label(ctx, `RLC  ζ = ${zeta.toFixed(2)}`, W - 12, 20, P.c2, 11, 'right');
};

// Transistor I-V family with a moving operating point on the load line.
S.iv = (ctx, W, H, t, P) => {
  graticule(ctx, W, H, 'rgba(255,200,120,0.06)');
  const curves = 6;
  const mos = P.k % 2 === 0;
  for (let i = 1; i <= curves; i++) {
    const pts = [];
    const lvl = i / curves;
    for (let x = 0; x <= W; x += 3) {
      const v = x / W;
      const sat = mos ? lvl * lvl : lvl;
      const id = sat * (1 - Math.exp(-v * (mos ? 9 : 25))) * (1 + 0.15 * v);
      pts.push([x, H * 0.9 - id * H * 0.75]);
    }
    const on = Math.abs(((t * 0.4) % 1) * curves - (i - 0.5)) < 0.5;
    glowLine(ctx, pts, on ? P.c : hexA(P.c, 0.35), on ? 2.4 : 1.2, on ? 14 : 0);
  }
  glowLine(ctx, [[0, H * 0.15], [W, H * 0.9]], hexA(P.c2, 0.8), 1.2, 6);
  const q = 0.5 + 0.3 * Math.sin(t * 1.4);
  dot(ctx, q * W, H * 0.15 + q * H * 0.75, 6, P.c2);
  label(ctx, mos ? 'NMOS  I_D vs V_DS  (V_GS sweep)' : 'BJT  I_C vs V_CE  (I_B sweep)', 12, 20, P.c);
  label(ctx, 'Q-point on load line', W - 12, H - 12, P.c2, 11, 'right');
};

// Bode plot sweep for filters.
S.bode = (ctx, W, H, t, P) => {
  graticule(ctx, W, H);
  const order = 2 + P.k * 2;
  const fc = 0.45;
  const types = ['lowpass', 'bandpass', 'highpass'];
  const type = types[P.k % 3];
  const mag = x => {
    const f = Math.pow(10, (x - fc) * 3);
    if (type === 'lowpass') return -10 * Math.log10(1 + Math.pow(f, 2 * order));
    if (type === 'highpass') return -10 * Math.log10(1 + Math.pow(1 / f, 2 * order));
    const Q = 3; const d = Q * (f - 1 / f); return -10 * Math.log10(1 + d * d);
  };
  const pts = [];
  const sweep = (t * 0.25) % 1.2;
  for (let x = 0; x <= Math.min(1, sweep) * W; x += 2) {
    const m = Math.max(-80, mag(x / W));
    pts.push([x, H * 0.18 - m / 80 * H * 0.7]);
  }
  glowLine(ctx, pts, P.c, 2.4);
  if (pts.length) dot(ctx, pts[pts.length - 1][0], pts[pts.length - 1][1], 5, P.c2);
  glowLine(ctx, [[0, H * 0.18 + 3 / 80 * H * 0.7], [W, H * 0.18 + 3 / 80 * H * 0.7]], hexA(P.c2, 0.4), 1, 0);
  label(ctx, `${type.toUpperCase()}  order ${order}  slope ${order * 20} dB/dec`, 12, 20, P.c);
  label(ctx, '−3 dB', W - 12, H * 0.18 + 3 / 80 * H * 0.7 - 6, P.c2, 10, 'right');
};

// Clock, counter bits and a 7-segment display.
S.logic = (ctx, W, H, t, P) => {
  const bits = 4;
  const count = Math.floor(t * (2 + P.k * 0.5)) % 10;
  const rows = bits + 1, rh = (H * 0.8) / rows;
  const span = 16;
  for (let r = 0; r < rows; r++) {
    const y0 = H * 0.1 + r * rh + rh * 0.75, amp = rh * 0.5;
    const pts = [];
    for (let i = 0; i <= span; i++) {
      const tick = Math.floor(t * (2 + P.k * 0.5)) - span + i;
      const v = r === 0 ? 1 : (((((tick % 10) + 10) % 10) >> (r - 1)) & 1);
      const x0 = W * 0.08 + (i / span) * W * 0.6, x1 = W * 0.08 + ((i + 1) / span) * W * 0.6;
      if (r === 0) { pts.push([x0, y0 - amp], [(x0 + x1) / 2, y0 - amp], [(x0 + x1) / 2, y0], [x1, y0]); }
      else { pts.push([x0, y0 - v * amp], [x1, y0 - v * amp]); }
    }
    glowLine(ctx, pts, r === 0 ? P.c2 : P.c, 1.8, 8);
    label(ctx, r === 0 ? 'CLK' : `Q${r - 1}`, 6, y0 - 2, r === 0 ? P.c2 : P.c, 10);
  }
  // 7-seg
  const seg = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abfgcd' }[count];
  const cx = W * 0.84, cy = H / 2, sw = Math.min(W * 0.1, H * 0.18), sh = sw * 1.9;
  const S7 = { a: [[-1, -1], [1, -1]], b: [[1, -1], [1, 0]], c: [[1, 0], [1, 1]], d: [[-1, 1], [1, 1]], e: [[-1, 0], [-1, 1]], f: [[-1, -1], [-1, 0]], g: [[-1, 0], [1, 0]] };
  for (const [k, [[x1, y1], [x2, y2]]] of Object.entries(S7)) {
    const on = seg.includes(k);
    ctx.save();
    ctx.strokeStyle = on ? '#ff3b3b' : 'rgba(255,60,60,0.08)'; ctx.lineWidth = sw * 0.22; ctx.lineCap = 'round';
    if (on) { ctx.shadowColor = '#ff3b3b'; ctx.shadowBlur = 18; }
    ctx.beginPath(); ctx.moveTo(cx + x1 * sw / 2 * 0.9, cy + y1 * sh / 2 * 0.9); ctx.lineTo(cx + x2 * sw / 2 * 0.9, cy + y2 * sh / 2 * 0.9); ctx.stroke();
    ctx.restore();
  }
  label(ctx, 'BCD COUNTER · VERILOG', W * 0.84, H - 12, P.c, 10, 'center');
};

// PWM duty cycle and LED brightness.
S.pwm = (ctx, W, H, t, P) => {
  const duty = 0.5 + 0.45 * Math.sin(t * (0.8 + P.k * 0.2));
  const per = W / (6 + P.k * 2);
  const pts = [];
  for (let x = 0; x <= W * 0.7; x += 1) {
    const ph = ((x + t * 60) % per) / per;
    pts.push([x, ph < duty ? H * 0.35 : H * 0.65]);
  }
  glowLine(ctx, pts, P.c, 2, 10);
  const avg = H * 0.65 - duty * H * 0.3;
  glowLine(ctx, [[0, avg], [W * 0.7, avg]], hexA(P.c2, 0.7), 1, 4);
  const g = ctx.createRadialGradient(W * 0.85, H / 2, 2, W * 0.85, H / 2, H * 0.45 * duty + 10);
  g.addColorStop(0, hexA(P.c2, 0.95)); g.addColorStop(1, hexA(P.c2, 0));
  ctx.fillStyle = g; ctx.fillRect(W * 0.7, 0, W * 0.3, H);
  dot(ctx, W * 0.85, H / 2, 12, P.c2, 30 * duty);
  label(ctx, `PWM duty ${(duty * 100).toFixed(0)}%  · TIM2 CH1`, 12, 20, P.c);
};

// RTOS task timeline + radio packets.
S.rtos = (ctx, W, H, t, P) => {
  const tasks = ['ISR', 'WiFi', 'MQTT', 'Sensor', 'Idle'];
  const r = rng(7 + P.k);
  const slots = 40, sw = (W * 0.62) / slots;
  const seq = Array.from({ length: 200 }, () => Math.floor(r() * tasks.length));
  const off = Math.floor(t * 6);
  tasks.forEach((name, i) => label(ctx, name, 8, H * 0.15 + i * H * 0.16 + 4, i ? P.c : P.c2, 10));
  for (let s = 0; s < slots; s++) {
    const ti = seq[(s + off) % seq.length];
    ctx.fillStyle = ti === 0 ? P.c2 : hexA(P.c, 0.3 + 0.15 * (4 - ti));
    ctx.fillRect(W * 0.12 + s * sw, H * 0.15 + ti * H * 0.16 - 8, sw - 1, 12);
  }
  // antenna
  const ax = W * 0.86, ay = H * 0.6;
  glowLine(ctx, [[ax, ay], [ax, ay - H * 0.3]], P.c, 2, 6);
  for (let i = 0; i < 4; i++) {
    const rr = ((t * 40 + i * 30) % 120);
    ctx.save(); ctx.strokeStyle = hexA(P.c2, 1 - rr / 120); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ax, ay - H * 0.3, rr, -Math.PI * 0.8, -Math.PI * 0.2); ctx.stroke(); ctx.restore();
  }
  label(ctx, 'FreeRTOS scheduler · core 0/1', W * 0.12, H - 10, P.c, 10);
};

// Register bit grid being written.
S.registers = (ctx, W, H, t, P) => {
  const regs = ['RCC_AHB1ENR', 'GPIOA_MODER', 'USART2_BRR', 'USART2_CR1', 'TIM2_ARR', 'DMA2_S0CR'];
  const r = rng(11 + P.k);
  const rows = regs.length, bits = 32;
  const bw = (W * 0.7) / bits, bh = (H * 0.8) / rows;
  const active = Math.floor(t * 1.5) % rows;
  regs.forEach((name, i) => {
    const y = H * 0.1 + i * bh;
    label(ctx, name, 6, y + bh * 0.6, i === active ? P.c2 : hexA(P.c, 0.7), 10);
    let val = 0;
    for (let b = 0; b < bits; b++) {
      const on = (r() > 0.6) !== (i === active && Math.sin(t * 8 + b) > 0.7);
      if (on) val |= (1 << (31 - b));
      ctx.fillStyle = on ? (i === active ? P.c2 : P.c) : 'rgba(255,255,255,0.05)';
      if (on && i === active) { ctx.shadowColor = P.c2; ctx.shadowBlur = 8; } else ctx.shadowBlur = 0;
      ctx.fillRect(W * 0.26 + b * bw * 0.98, y + bh * 0.25, bw * 0.8, bh * 0.5);
    }
    ctx.shadowBlur = 0;
  });
  label(ctx, `*(volatile uint32_t*)0x4002_3830 |= (1<<0);`, W * 0.26, H - 8, P.c, 10);
};

// PCB autorouter.
S.pcb = (ctx, W, H, t, P) => {
  const r = rng(21 + P.k);
  const g = 24;
  ctx.fillStyle = 'rgba(10,60,30,0.35)'; ctx.fillRect(0, 0, W, H);
  // chip
  const cx = W / 2 - 50, cy = H / 2 - 40;
  ctx.fillStyle = '#111'; ctx.fillRect(cx, cy, 100, 80);
  ctx.strokeStyle = '#555'; ctx.strokeRect(cx, cy, 100, 80);
  label(ctx, 'STM32F401', cx + 50, cy + 44, '#bbb', 10, 'center');
  const traces = 14;
  const prog = (t * 0.25) % 1.4;
  for (let i = 0; i < traces; i++) {
    const side = i % 4;
    const sx = side === 0 ? cx : side === 1 ? cx + 100 : cx + 10 + r() * 80;
    const sy = side < 2 ? cy + 10 + r() * 60 : side === 2 ? cy : cy + 80;
    const ex = Math.round(r() * W / g) * g, ey = Math.round(r() * H / g) * g;
    const mx = side < 2 ? ex : sx, my = side < 2 ? sy : ey;
    const pts = [[sx, sy], [mx, my], [ex, ey]];
    const len = Math.min(1, Math.max(0, prog * 1.6 - i / traces * 0.6));
    const seg = [[sx, sy]];
    if (len > 0) seg.push([sx + (mx - sx) * Math.min(1, len * 2), sy + (my - sy) * Math.min(1, len * 2)]);
    if (len > 0.5) seg.push([mx + (ex - mx) * (len - 0.5) * 2, my + (ey - my) * (len - 0.5) * 2]);
    glowLine(ctx, seg, '#d9a441', 3, 6);
    if (len >= 1) { dot(ctx, ex, ey, 5, '#e8c070', 4); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(ex, ey, 2, 0, TAU); ctx.fill(); }
    void pts;
  }
  label(ctx, 'KiCad · route → DRC → Gerbers', 10, H - 10, P.c, 10);
};

// FFT bars (audio spectrum analyser).
S.fft = (ctx, W, H, t, P) => {
  const n = 48, bw = W / n;
  for (let i = 0; i < n; i++) {
    const f = i / n;
    const v = Math.abs(Math.sin(t * (1.5 + f * 3) + i * 0.5 + P.k)) * Math.exp(-f * (2 - P.k * 0.2)) * 0.9
      + 0.08 * Math.abs(Math.sin(t * 7 + i));
    const h = v * H * 0.8;
    const grd = ctx.createLinearGradient(0, H, 0, H - h);
    grd.addColorStop(0, hexA(P.c, 0.9)); grd.addColorStop(1, hexA(P.c2, 0.9));
    ctx.fillStyle = grd;
    ctx.fillRect(i * bw + 1, H - h - 14, bw - 3, h);
    dot(ctx, i * bw + bw / 2, H - h - 18, 1.6, P.c2, 6);
  }
  label(ctx, '1024-pt FFT · 44.1 kHz · CMSIS-DSP', 10, 18, P.c, 10);
};

// Fourier epicycles building a square wave.
S.fourier = (ctx, W, H, t, P) => {
  const terms = 2 + P.k * 2;
  let x = W * 0.22, y = H / 2;
  const R = H * 0.22;
  for (let i = 0; i < terms; i++) {
    const n = 2 * i + 1, r = R * 4 / (n * Math.PI);
    ctx.strokeStyle = hexA(P.c, 0.25); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    const nx = x + r * Math.cos(n * t * 1.5), ny = y + r * Math.sin(n * t * 1.5);
    glowLine(ctx, [[x, y], [nx, ny]], P.c, 1.2, 4);
    x = nx; y = ny;
  }
  dot(ctx, x, y, 4, P.c2);
  S._trail = S._trail || {};
  const key = 'f' + P.k;
  const tr = (S._trail[key] = S._trail[key] || []);
  tr.unshift(y); if (tr.length > 300) tr.pop();
  const ox = W * 0.45;
  glowLine(ctx, [[x, y], [ox, tr[0]]], hexA(P.c2, 0.4), 1, 0);
  glowLine(ctx, tr.map((v, i) => [ox + i * (W * 0.55 / 300), v]), P.c2, 2);
  label(ctx, `Σ ${terms} odd harmonics → square wave`, 10, 18, P.c, 10);
};

// FIR filter: noisy in, clean out.
S.fir = (ctx, W, H, t, P) => {
  const r = rng(3 + P.k);
  const noise = Array.from({ length: 400 }, () => r() * 2 - 1);
  const sig = x => Math.sin(TAU * 2 * x + t * 2);
  const a = [], b = [];
  const taps = 8 + P.k * 4;
  for (let i = 0; i < 200; i++) {
    const x = i / 200;
    const n = noise[(i + Math.floor(t * 30)) % 400];
    a.push([i / 200 * W, H * 0.3 - (sig(x) + 0.5 * n) * H * 0.12]);
    let acc = 0; for (let k = 0; k < taps; k++) acc += 0.5 * noise[(i - k + Math.floor(t * 30) + 400) % 400] / taps;
    b.push([i / 200 * W, H * 0.72 - (sig(x) + acc) * H * 0.12]);
  }
  glowLine(ctx, a, hexA(P.c2, 0.8), 1.2, 4);
  glowLine(ctx, b, P.c, 2.2, 12);
  label(ctx, 'x[n] noisy input', 10, 18, P.c2, 10);
  label(ctx, `y[n] = Σ h[k]x[n−k]   (${taps} taps, Q15)`, 10, H * 0.5 + 12, P.c, 10);
};

// QAM constellation with noise.
S.constellation = (ctx, W, H, t, P) => {
  const M = [4, 16, 64, 16][P.k % 4];
  const m = Math.sqrt(M);
  const cx = W * 0.32, cy = H / 2, s = Math.min(W, H) * 0.36;
  graticule(ctx, W, H, 'rgba(255,190,90,0.05)');
  const r = rng(Math.floor(t * 20) + P.k);
  const snr = 0.04 + 0.03 * (Math.sin(t * 0.5) + 1);
  for (let i = 0; i < 220; i++) {
    const a = Math.floor(r() * m), b = Math.floor(r() * m);
    const x = cx + ((a / (m - 1)) * 2 - 1) * s + (r() - 0.5) * snr * s * 3;
    const y = cy + ((b / (m - 1)) * 2 - 1) * s + (r() - 0.5) * snr * s * 3;
    dot(ctx, x, y, 1.6, P.c, 6);
  }
  // OFDM subcarriers
  const ox = W * 0.66, ow = W * 0.3;
  for (let k = 0; k < 7; k++) {
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const f = (i / 120) * 8 - 1 - k;
      const v = Math.abs(f) < 1e-6 ? 1 : Math.sin(Math.PI * f) / (Math.PI * f);
      pts.push([ox + (i / 120) * ow, H * 0.75 - v * H * 0.4 * (0.8 + 0.2 * Math.sin(t * 2 + k))]);
    }
    glowLine(ctx, pts, k % 2 ? P.c2 : P.c, 1.2, 4);
  }
  label(ctx, `${M}-QAM  SNR wobble`, 10, 18, P.c, 10);
  label(ctx, 'OFDM orthogonal subcarriers', ox, H - 10, P.c2, 10);
};

// SDR waterfall.
S.waterfall = (ctx, W, H, t, P, mem) => {
  const cols = 120, rows = 70;
  mem.rows = mem.rows || [];
  const r = rng(Math.floor(t * 30));
  if (!mem.last || t - mem.last > 0.05) {
    mem.last = t;
    const row = [];
    for (let i = 0; i < cols; i++) {
      let v = r() * 0.25;
      const ch = [0.2 + 0.05 * P.k, 0.5, 0.78];
      for (const c of ch) v += Math.exp(-Math.pow((i / cols - c) * 60, 2)) * (0.6 + 0.4 * Math.sin(t * 3 + c * 10));
      if (Math.sin(t * 0.7) > 0.6) v += Math.exp(-Math.pow((i / cols - 0.62) * 40, 2));
      row.push(Math.min(1, v));
    }
    mem.rows.unshift(row); if (mem.rows.length > rows) mem.rows.pop();
  }
  const cw = W / cols, rh = (H * 0.72) / rows;
  mem.rows.forEach((row, y) => row.forEach((v, x) => {
    ctx.fillStyle = `hsl(${220 - v * 200}, 90%, ${8 + v * 55}%)`;
    ctx.fillRect(x * cw, H * 0.26 + y * rh, cw + 0.5, rh + 0.5);
  }));
  const top = mem.rows[0] || [];
  glowLine(ctx, top.map((v, i) => [i * cw, H * 0.24 - v * H * 0.18]), P.c, 1.6, 8);
  label(ctx, `RTL-SDR · ${[100.1, 1090, 137.1, 144.39, 162.5][P.k % 5]} MHz`, 10, 16, P.c, 10);
};

// ROS2 node graph with messages flowing.
S.rosgraph = (ctx, W, H, t, P) => {
  const nodes = [['/camera', 0.12, 0.25], ['/lidar', 0.12, 0.75], ['/slam', 0.42, 0.5], ['/nav2', 0.7, 0.3], ['/moveit', 0.7, 0.75], ['/base', 0.9, 0.5]];
  const edges = [[0, 2], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5], [0, 4]];
  edges.forEach(([a, b], i) => {
    const [, x1, y1] = nodes[a], [, x2, y2] = nodes[b];
    glowLine(ctx, [[x1 * W, y1 * H], [x2 * W, y2 * H]], hexA(P.c, 0.35), 1.2, 0);
    for (let j = 0; j < 2; j++) {
      const f = ((t * (0.4 + 0.1 * P.k) + i * 0.17 + j * 0.5) % 1);
      dot(ctx, (x1 + (x2 - x1) * f) * W, (y1 + (y2 - y1) * f) * H, 3, P.c2, 10);
    }
  });
  nodes.forEach(([n, x, y]) => {
    ctx.fillStyle = '#0b1714'; ctx.strokeStyle = P.c; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(x * W, y * H, 42, 16, 0, 0, TAU); ctx.fill(); ctx.stroke();
    label(ctx, n, x * W, y * H + 4, P.c, 10, 'center');
  });
};

// 2-link arm doing inverse kinematics to a moving target.
S.arm = (ctx, W, H, t, P) => {
  graticule(ctx, W, H, 'rgba(255,100,170,0.05)');
  const bx = W * 0.35, by = H * 0.85, L1 = H * 0.38, L2 = H * 0.3;
  const tx = bx + Math.cos(t * 0.7 + P.k) * H * 0.4 + H * 0.15, ty = by - H * 0.35 - Math.sin(t * 1.1) * H * 0.2;
  const dx = tx - bx, dy = ty - by;
  const d = Math.min(L1 + L2 - 1, Math.hypot(dx, dy));
  const c2 = (d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2);
  const q2 = -Math.acos(Math.max(-1, Math.min(1, c2)));
  const q1 = Math.atan2(dy, dx) - Math.atan2(L2 * Math.sin(q2), L1 + L2 * Math.cos(q2));
  const ex = bx + L1 * Math.cos(q1), ey = by + L1 * Math.sin(q1);
  const hx = ex + L2 * Math.cos(q1 + q2), hy = ey + L2 * Math.sin(q1 + q2);
  ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = hexA(P.c2, 0.6);
  ctx.beginPath(); ctx.arc(tx, ty, 10, 0, TAU); ctx.stroke(); ctx.restore();
  glowLine(ctx, [[bx, by], [ex, ey], [hx, hy]], P.c, 8, 16);
  dot(ctx, bx, by, 9, '#fff', 6); dot(ctx, ex, ey, 7, P.c2, 10); dot(ctx, hx, hy, 5, P.c2, 14);
  label(ctx, `θ1 ${(q1 * 57.3).toFixed(0)}°  θ2 ${(q2 * 57.3).toFixed(0)}°`, 10, 18, P.c, 11);
  label(ctx, 'J = ∂(x,y)/∂(θ1,θ2)', W - 10, 18, P.c2, 11, 'right');
};

// Lidar sweep mapping a room.
S.lidar = (ctx, W, H, t, P, mem) => {
  const cx = W / 2, cy = H / 2;
  const room = a => {
    // rectangle room + a pillar
    const rx = W * 0.42, ry = H * 0.42;
    const c = Math.cos(a), s = Math.sin(a);
    let d = Math.min(Math.abs(rx / (c || 1e-6)), Math.abs(ry / (s || 1e-6)));
    const px = W * (0.12 + 0.03 * P.k), py = -H * 0.12, pr = 18;
    const b = px * c + py * s, disc = b * b - (px * px + py * py - pr * pr);
    if (disc > 0) { const d2 = b - Math.sqrt(disc); if (d2 > 0) d = Math.min(d, d2); }
    return d;
  };
  mem.pts = mem.pts || [];
  const ang = t * 2.5;
  for (let i = 0; i < 6; i++) {
    const a = ang + i * 0.01;
    const d = room(a);
    mem.pts.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d, t]);
  }
  if (mem.pts.length > 1800) mem.pts.splice(0, mem.pts.length - 1800);
  for (const [x, y, ts] of mem.pts) { ctx.fillStyle = hexA(P.c, Math.max(0.15, 1 - (t - ts) / 4)); ctx.fillRect(x - 1, y - 1, 2.5, 2.5); }
  const g = ctx.createConicGradient ? ctx.createConicGradient(ang - 0.6, cx, cy) : null;
  if (g) {
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.095, hexA(P.c2, 0.25)); g.addColorStop(0.1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, Math.max(W, H), 0, TAU); ctx.fill();
  }
  glowLine(ctx, [[cx, cy], [cx + Math.cos(ang) * room(ang), cy + Math.sin(ang) * room(ang)]], P.c2, 1.5, 10);
  dot(ctx, cx, cy, 8, '#fff', 10);
  label(ctx, 'RPLidar A1 · SLAM', 10, 18, P.c, 10);
};

// BLDC field-oriented control: three phases + rotating vector.
S.motor = (ctx, W, H, t, P) => {
  const cx = W * 0.22, cy = H / 2, R = H * 0.32;
  const th = t * (2 + P.k * 0.5);
  ctx.strokeStyle = hexA(P.c, 0.3); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
  const cols = [P.c, P.c2, '#7df9ff'];
  for (let i = 0; i < 3; i++) {
    const a = i * TAU / 3, v = Math.cos(th - a);
    glowLine(ctx, [[cx, cy], [cx + Math.cos(a) * R * v, cy - Math.sin(a) * R * v]], cols[i], 2, 6);
  }
  glowLine(ctx, [[cx, cy], [cx + Math.cos(th) * R * 1.4, cy - Math.sin(th) * R * 1.4]], '#fff', 3, 16);
  for (let i = 0; i < 3; i++) {
    const pts = [];
    for (let x = 0; x <= W * 0.5; x += 2) {
      const tt = th - (W * 0.5 - x) / 40;
      pts.push([W * 0.45 + x, H * (0.25 + i * 0.25) - Math.cos(tt - i * TAU / 3) * H * 0.09]);
    }
    glowLine(ctx, pts, cols[i], 1.6, 6);
    label(ctx, 'ABC'[i], W * 0.43, H * (0.25 + i * 0.25) + 4, cols[i], 10, 'right');
  }
  label(ctx, 'FOC · Clarke/Park · i_q torque vector', 10, 18, P.c, 10);
};

// Gait cycle stick leg + knee angle curve.
S.gait = (ctx, W, H, t, P) => {
  const ph = (t * (0.6 + 0.05 * P.k)) % 1;
  const hip = [W * 0.25, H * 0.25];
  const hipA = Math.sin(ph * TAU) * 0.45;
  const kneeA = (Math.max(0, Math.sin(ph * TAU - 0.6)) * 1.0 + 0.15 * Math.max(0, Math.sin(ph * TAU * 2))) ;
  const L = H * 0.28;
  const knee = [hip[0] + Math.sin(hipA) * L, hip[1] + Math.cos(hipA) * L];
  const ank = [knee[0] + Math.sin(hipA - kneeA) * L, knee[1] + Math.cos(hipA - kneeA) * L];
  glowLine(ctx, [[hip[0], hip[1] - H * 0.15], hip], hexA(P.c, 0.6), 6, 0);
  glowLine(ctx, [hip, knee, ank, [ank[0] + 22, ank[1]]], P.c, 7, 14);
  dot(ctx, hip[0], hip[1], 6, P.c2); dot(ctx, knee[0], knee[1], 6, P.c2); dot(ctx, ank[0], ank[1], 5, P.c2);
  glowLine(ctx, [[0, H * 0.92], [W * 0.45, H * 0.92]], 'rgba(255,255,255,0.2)', 1, 0);
  const pts = [];
  for (let i = 0; i <= 100; i++) {
    const p = i / 100;
    const k = Math.max(0, Math.sin(p * TAU - 0.6)) + 0.15 * Math.max(0, Math.sin(p * TAU * 2));
    pts.push([W * 0.52 + p * W * 0.44, H * 0.8 - k * H * 0.5]);
  }
  glowLine(ctx, pts, hexA(P.c2, 0.7), 1.6, 6);
  const kx = W * 0.52 + ph * W * 0.44;
  dot(ctx, kx, H * 0.8 - kneeA * H * 0.5, 5, P.c2);
  label(ctx, 'knee flexion over one gait cycle', W * 0.52, H - 8, P.c2, 10);
  label(ctx, ph < 0.6 ? 'STANCE' : 'SWING', 10, 18, P.c, 11);
};

// ECG / biopotential with mains hum being removed.
S.ecg = (ctx, W, H, t, P) => {
  graticule(ctx, W, H, 'rgba(255,90,140,0.07)', 20);
  const beat = x => {
    const p = x % 1;
    return 0.1 * Math.exp(-Math.pow((p - 0.15) * 30, 2)) - 0.12 * Math.exp(-Math.pow((p - 0.29) * 90, 2))
      + 1.0 * Math.exp(-Math.pow((p - 0.32) * 80, 2)) - 0.25 * Math.exp(-Math.pow((p - 0.35) * 70, 2))
      + 0.25 * Math.exp(-Math.pow((p - 0.6) * 18, 2));
  };
  const a = [], b = [];
  for (let x = 0; x <= W; x += 2) {
    const tt = x / W * 3 + t * 0.8;
    a.push([x, H * 0.3 - (beat(tt) * 0.6 + 0.25 * Math.sin(tt * 50 * 0.6 + P.k)) * H * 0.25]);
    b.push([x, H * 0.78 - beat(tt) * H * 0.3]);
  }
  glowLine(ctx, a, hexA(P.c2, 0.7), 1.2, 4);
  glowLine(ctx, b, P.c, 2.2, 14);
  label(ctx, 'raw: 50 Hz hum + baseline', 10, 16, P.c2, 10);
  label(ctx, 'INA128 → notch → RLD  · CMRR > 80 dB', 10, H * 0.52, P.c, 10);
};

// EMG bursts + gesture classifier bars.
S.emg = (ctx, W, H, t, P) => {
  const r = rng(Math.floor(t * 60));
  const gest = ['fist', 'open', 'pinch', 'point', 'rest'];
  const g = Math.floor(t / 2.2 + P.k) % gest.length;
  const env = x => g === 4 ? 0.08 : 0.15 + 0.85 * Math.max(0, Math.sin(Math.PI * ((x * 3 + t * 0.4) % 1)));
  for (let ch = 0; ch < 4; ch++) {
    const pts = [];
    for (let x = 0; x <= W * 0.6; x += 2) pts.push([x, H * (0.15 + ch * 0.22) + (r() - 0.5) * env(x / W + ch * 0.1) * H * 0.16 * (1 + ((g + ch) % 3) * 0.3)]);
    glowLine(ctx, pts, ch % 2 ? P.c2 : P.c, 1, 4);
  }
  gest.forEach((name, i) => {
    const p = i === g ? 0.75 + 0.2 * Math.sin(t * 3) : 0.05 + 0.08 * Math.abs(Math.sin(t + i));
    const y = H * 0.12 + i * H * 0.17;
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(W * 0.7, y, W * 0.26, 12);
    ctx.fillStyle = i === g ? P.c2 : hexA(P.c, 0.5); ctx.fillRect(W * 0.7, y, W * 0.26 * p, 12);
    label(ctx, `${name} ${(p * 100).toFixed(0)}%`, W * 0.7, y - 3, i === g ? P.c2 : P.c, 10);
  });
};

// Prosthetic hand fingers curling.
S.hand = (ctx, W, H, t, P) => {
  const base = [W * 0.4, H * 0.9];
  const palmW = H * 0.32;
  ctx.fillStyle = hexA(P.c, 0.12); ctx.strokeStyle = P.c; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(base[0] - palmW / 2, base[1] - palmW * 1.1, palmW, palmW, 12); ctx.fill(); ctx.stroke();
  const grip = (Math.sin(t * (1.2 + 0.1 * P.k)) + 1) / 2;
  for (let f = 0; f < 4; f++) {
    let x = base[0] - palmW / 2 + palmW * (0.12 + f * 0.25), y = base[1] - palmW * 1.1;
    let a = -Math.PI / 2;
    const segs = [H * 0.13, H * 0.1, H * 0.08].map(s => s * (f === 0 || f === 3 ? 0.85 : 1));
    const pts = [[x, y]];
    for (let s = 0; s < 3; s++) {
      a += grip * (0.7 + f * 0.05) * (s === 0 ? 0.9 : 1.1);
      x += Math.cos(a) * segs[s]; y += Math.sin(a) * segs[s];
      pts.push([x, y]);
    }
    glowLine(ctx, pts, P.c, 9, 10);
    pts.forEach(([px, py]) => dot(ctx, px, py, 3, P.c2, 6));
    dot(ctx, x, y, 4, grip > 0.7 ? '#ff4d6d' : P.c2, grip > 0.7 ? 18 : 6);
  }
  // thumb
  const tx = base[0] - palmW / 2, ty = base[1] - palmW * 0.4;
  const ta = Math.PI + 0.6 - grip * 1.2;
  glowLine(ctx, [[tx, ty], [tx + Math.cos(ta) * H * 0.12, ty + Math.sin(ta) * H * 0.12 - 10], [tx + Math.cos(ta + grip * 0.9) * H * 0.2, ty + Math.sin(ta + grip * 0.9) * H * 0.2 - 10]], P.c, 9, 10);
  label(ctx, `tendon pull ${(grip * 100).toFixed(0)}%   FSR ${grip > 0.7 ? 'CONTACT' : '—'}`, W * 0.62, H * 0.3, P.c2, 11);
  label(ctx, 'underactuated finger · vibrotactile feedback', W * 0.62, H * 0.3 + 18, P.c, 10);
};

// Neural net with pulses.
S.neural = (ctx, W, H, t, P) => {
  const layers = [6, 8, 8, 5].map((n, i) => (i === 1 || i === 2 ? n - P.k % 3 : n));
  const pos = layers.map((n, l) => Array.from({ length: n }, (_, i) => [W * (0.12 + l * 0.25), H * ((i + 1) / (n + 1))]));
  for (let l = 0; l < layers.length - 1; l++) {
    pos[l].forEach((a, i) => pos[l + 1].forEach((b, j) => {
      const w = Math.sin(i * 3.1 + j * 1.7 + l);
      ctx.strokeStyle = w > 0 ? hexA(P.c, 0.12 + w * 0.2) : hexA(P.c2, 0.08 - w * 0.12);
      ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      const f = (t * 0.8 - l * 0.33 + (i + j) * 0.05) % 1;
      if (((i * 7 + j * 3 + l) % 5) === 0 && f > 0) dot(ctx, a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, 2, P.c2, 8);
    }));
  }
  pos.forEach((L, l) => L.forEach(([x, y], i) => {
    const act = (Math.sin(t * 2 - l + i) + 1) / 2;
    dot(ctx, x, y, 6, hexA(l === 3 ? P.c2 : P.c, 0.3 + act * 0.7), act * 16);
  }));
  label(ctx, 'int8 quantised · 18 KB · 42 ms inference', 10, H - 8, P.c, 10);
};

// Spectrum anomaly: waterfall + autoencoder reconstruction error.
S.anomaly = (ctx, W, H, t, P, mem) => {
  S.waterfall(ctx, W, H * 0.7, t, { ...P, k: P.k + 1 }, mem);
  const pts = [];
  for (let x = 0; x <= W; x += 3) {
    const tt = x / W * 6 + t;
    const spike = Math.exp(-Math.pow(((tt % 6) - 4.2) * 3, 2));
    pts.push([x, H * 0.95 - (0.08 + 0.05 * Math.sin(tt * 4) + spike * 0.8) * H * 0.22]);
  }
  glowLine(ctx, pts, '#ff4d6d', 1.8, 10);
  glowLine(ctx, [[0, H * 0.95 - 0.4 * H * 0.22], [W, H * 0.95 - 0.4 * H * 0.22]], hexA(P.c2, 0.5), 1, 0);
  label(ctx, 'autoencoder reconstruction error · threshold', 10, H * 0.74, '#ff8fa3', 10);
};

// Capstone: EMG → classifier → hand.
S.capstone = (ctx, W, H, t, P, mem) => {
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W * 0.5, H); ctx.clip();
  S.emg(ctx, W * 0.75, H, t, P); ctx.restore();
  ctx.save(); ctx.translate(W * 0.38, 0); S.hand(ctx, W * 0.62, H, t, P); ctx.restore();
  const f = (t * 0.7) % 1;
  dot(ctx, W * (0.45 + f * 0.1), H * 0.5, 4, P.c2, 14);
  label(ctx, 'ADS1299 → STM32H7 → TFLite Micro → servos   < 150 ms', 10, 14, P.c, 10);
  void mem;
};

// Broadcast / publish: concentric signal from a camera + paper.
S.broadcast = (ctx, W, H, t, P) => {
  const cx = W / 2, cy = H * 0.55;
  for (let i = 0; i < 7; i++) {
    const r = ((t * 50 + i * 40) % 280);
    ctx.strokeStyle = hexA(i % 2 ? P.c : P.c2, Math.max(0, 1 - r / 280)); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
  }
  // film frames
  for (let i = 0; i < 9; i++) {
    const x = ((i * 90 + t * 40) % (W + 90)) - 90;
    ctx.strokeStyle = hexA(P.c, 0.5); ctx.strokeRect(x, H * 0.06, 70, 44);
    for (let h = 0; h < 5; h++) { ctx.fillStyle = hexA(P.c, 0.4); ctx.fillRect(x + 4 + h * 14, H * 0.035, 6, 4); }
  }
  dot(ctx, cx, cy, 14, '#fff', 30);
  label(ctx, 'IEEE paper · 30 projects · 5-min film', cx, H - 12, P.c2, 11, 'center');
};

export const SCENE_NAMES = {
  scope: 'Oscilloscope awakening', rc: 'RC and RLC transients', iv: 'Transistor curves', bode: 'Filter sweep',
  logic: 'Counting in Verilog', pwm: 'Pulse-width glow', rtos: 'Tasks and radio', registers: 'Register writes',
  pcb: 'Copper routing', fft: 'Spectrum dance', fourier: 'Circles into squares', fir: 'Filtering the noise',
  constellation: 'Constellations', waterfall: 'Radio waterfall', rosgraph: 'Robot nervous system', arm: 'Reaching arm',
  lidar: 'Mapping the room', motor: 'Rotating fields', gait: 'One step', ecg: 'Hearing the heart',
  emg: 'Reading the muscle', hand: 'The grip', neural: 'Tiny neurons', anomaly: 'Something in the noise',
  capstone: 'Thought into motion', broadcast: 'Signal to the world',
};

// Runs a scene in a canvas; returns a stop() function.
export function runScene(canvas, name, params, { calm = false } = {}) {
  const ctx = canvas.getContext('2d');
  const fn = S[name] || S.scope;
  const mem = {};
  let raf = 0, alive = true, visible = true;
  const t0 = performance.now();
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && alive && !raf) loop(); });
  io.observe(canvas);
  function size() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    if (canvas.width !== Math.round(r.width * dpr) || canvas.height !== Math.round(r.height * dpr)) {
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return [r.width, r.height];
  }
  function frame(now) {
    const [W, H] = size();
    if (!W || !H) return;
    ctx.clearRect(0, 0, W, H);
    const t = calm ? 2.5 : (now - t0) / 1000;
    try { fn(ctx, W, H, t, params, mem); } catch (e) { console.warn('scene', name, e); }
  }
  function loop() {
    raf = 0;
    if (!alive || !visible) return;
    frame(performance.now());
    if (!calm) raf = requestAnimationFrame(loop);
  }
  loop();
  return () => { alive = false; cancelAnimationFrame(raf); io.disconnect(); };
}
