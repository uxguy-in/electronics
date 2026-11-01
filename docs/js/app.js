import { store, DEFAULT_START } from './store.js';
import * as G from './game.js';
import { runScene, SCENE_NAMES } from './scenes.js';
import { startBackground, powerOn, burst, blip, toast, prefersCalm } from './fx.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad2 = n => String(n).padStart(2, '0');
const hrs = m => (m / 60).toFixed(m % 60 ? 1 : 0);

let WEEKS = G.buildWeeks(store.state.start);
let stopScenes = [];
const S = () => store.state;
const sceneTitle = w => SCENE_NAMES[w.scene] + (w.blockLen > 1 ? ` · variation ${w.weekInBlock + 1}` : '');
const calm = () => store.config.motion === 'calm' || prefersCalm();

function phaseColor(id) { return (G.phases.find(p => p.id === id) || G.phases[0]).color; }
function activePhaseId() {
  const cur = Math.min(G.TOTAL_WEEKS, G.currentLevel(S()));
  return WEEKS[cur - 1].phaseId;
}
function sceneParams(w) {
  const c = w.phase.color;
  const alt = { 1: '#ffb547', 2: '#ff5ea8', 3: '#2ee6ff', 4: '#ffe066', 5: '#39ff9f', 6: '#b48cff' }[w.phaseId];
  return { c, c2: alt, k: w.weekInBlock, seed: w.n };
}

// ---------------------------------------------------------------------------
// HUD
function renderHUD() {
  const st = S();
  const xp = G.xpBreakdown(st, WEEKS);
  const rank = G.rankFor(xp.total);
  const day = G.dayOfJourney(st.start);
  const sw = G.scheduleWeek(st.start);
  const wk = WEEKS[sw - 1];
  const weekMin = day >= 1 ? G.minutesBetween(st, wk.start, wk.end) : 0;
  const charge = Math.min(1, weekMin / 1200);
  const accent = phaseColor(activePhaseId());
  document.documentElement.style.setProperty('--accent', accent);
  $('#hud').innerHTML = `
    <div class="hud__rank" title="${esc(rank.blurb)}">
      <span class="rank-sym">${esc(rank.sym)}</span>
      <span class="hud__rank-text"><b>${esc(rank.name)}</b><small>Rank ${rank.index + 1} of ${G.RANKS.length}</small></span>
    </div>
    <div class="hud__xp" title="${xp.total} XP${rank.next ? ` · ${rank.next.xp - xp.total} XP to ${rank.next.name}` : ''}">
      <div class="hud__label">XP <b>${xp.total.toLocaleString()}</b>${rank.next ? `<span> / ${rank.next.xp.toLocaleString()}</span>` : ''}</div>
      <div class="bar"><i style="width:${(rank.pct * 100).toFixed(1)}%"></i></div>
    </div>
    <div class="hud__stat"><div class="hud__label">Day</div><b>${day < 1 ? `T−${1 - day}` : Math.min(day, 731)}</b><small>/ 731</small></div>
    <div class="hud__stat"><div class="hud__label">Streak</div><b>${G.streak(st)}</b><small>days</small></div>
    <div class="hud__cap" title="This week: ${hrs(weekMin)} h of 20 h target">
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <line x1="20" y1="2" x2="20" y2="12"/><line x1="8" y1="14" x2="32" y2="14"/>
        <path d="M8 24 Q20 18 32 24" fill="none"/><line x1="20" y1="24" x2="20" y2="38"/>
        <rect class="cap-fill" x="9" y="${14 + 8 * (1 - charge)}" width="22" height="${Math.max(0.01, 8 * charge)}" />
      </svg>
      <div><div class="hud__label">Week charge</div><b>${hrs(weekMin)}</b><small>/ 20 h</small></div>
    </div>`;
  renderSync();
}

function renderSync() {
  const pl = $('#progress-link'); if (pl) pl.href = `https://github.com/${store.config.owner}/${store.config.repo}/blob/${store.config.branch}/${store.config.path}`;
  const el = $('#sync');
  const s = store.status;
  const label = { local: 'Local only', syncing: 'Syncing…', saved: 'Saved to GitHub', dirty: 'Saving soon', error: 'Sync error', readonly: 'Read-only' }[s] || s;
  el.className = `sync sync--${s}`;
  el.innerHTML = `<span class="sync__led"></span><span class="sync__txt">${label}</span>`;
  el.title = store.statusMsg || label;
}

// ---------------------------------------------------------------------------
// Journey board (the map)
function boardSVG() {
  const st = S();
  const cur = G.currentLevel(st);
  const sched = G.dayOfJourney(st.start) >= 1 ? G.scheduleWeek(st.start) : 0;
  const ROW = 170, TOP = 90, W = 1200;
  let out = '', traces = '', lit = '', pads = '', labels = '', chips = '';
  const pos = {};
  G.phases.forEach((p, i) => {
    const y = TOP + i * ROW;
    const even = i % 2 === 0;
    const chipX = even ? 20 : 1030;
    const first = even ? 230 : 970, last = even ? 1170 : 30;
    const ws = WEEKS.filter(w => w.phaseId === p.id);
    const step = (last - first) / (ws.length - 1);
    ws.forEach((w, k) => { pos[w.n] = [first + k * step, y]; });
    const complete = G.phaseComplete(st, WEEKS, p.id);
    const unlocked = G.phaseUnlocked(st, WEEKS, p.id);
    const cls = complete ? 'is-done' : unlocked ? 'is-live' : 'is-locked';
    const pins = Array.from({ length: 7 }, (_, j) => `<rect class="chip__pin" x="${chipX + 14 + j * 18}" y="${y - 44}" width="8" height="8"/><rect class="chip__pin" x="${chipX + 14 + j * 18}" y="${y + 36}" width="8" height="8"/>`).join('');
    chips += `<g class="chip ${cls}" style="--c:${p.color}" data-phase="${p.id}" tabindex="0" role="button" aria-label="Chapter ${p.id}: ${esc(p.name)}">
      ${pins}<rect class="chip__body" x="${chipX}" y="${y - 36}" width="150" height="72" rx="6"/>
      <circle class="chip__dot" cx="${chipX + 12}" cy="${y - 24}" r="3"/>
      <text class="chip__ref" x="${chipX + 75}" y="${y - 12}">${p.code} · ${p.chip}</text>
      <text class="chip__name" x="${chipX + 75}" y="${y + 6}"${p.name.length > 19 ? ' textLength="136" lengthAdjust="spacingAndGlyphs"' : ''}>${esc(p.name)}</text>
      <text class="chip__meta" x="${chipX + 75}" y="${y + 24}">${complete ? 'COMPLETE' : unlocked ? `${ws.filter(w => G.isCleared(st, w.n)).length}/${ws.length} LEVELS` : 'LOCKED'}</text>
    </g>`;
    // chip → first pad
    const chipEdge = even ? chipX + 150 : chipX;
    const firstLit = G.isUnlocked(st, ws[0].n);
    traces += `<path class="trace" d="M${chipEdge} ${y} H${first}"/>`;
    if (firstLit) lit += `<path class="trace-lit" style="--c:${p.color}" d="M${chipEdge} ${y} H${first}"/>`;
    // block labels
    p.blocks.forEach((b, bi) => {
      const a = pos[ws[b.from - 1].n][0], z = pos[ws[b.to - 1].n][0];
      const mid = (a + z) / 2, up = bi % 2 === 1;
      const t = b.topic.length > 28 ? b.topic.slice(0, 26) + '…' : b.topic;
      labels += `<text class="silk" x="${mid}" y="${y + (up ? -26 : 36)}"><title>${esc(b.topic)}</title>${esc(t)}</text>
        <path class="silk-bracket" d="M${a} ${y + (up ? -16 : 16)} V${y + (up ? -20 : 20)} H${z} V${y + (up ? -16 : 16)}"/>`;
    });
    // row → next chip
    if (i < G.phases.length - 1) {
      const ny = y + ROW, nChip = (i + 1) % 2 === 0 ? 20 + 75 : 1030 + 75;
      const d = `M${last} ${y} V${ny - 70} L${nChip} ${ny - 56} V${ny - 44}`;
      traces += `<path class="trace" d="${d}"/>`;
      if (G.isCleared(st, ws[ws.length - 1].n)) lit += `<path class="trace-lit" style="--c:${p.color}" d="${d}"/>`;
    }
  });
  for (let n = 1; n < G.TOTAL_WEEKS; n++) {
    const a = pos[n], b = pos[n + 1];
    if (WEEKS[n - 1].phaseId !== WEEKS[n].phaseId) continue;
    traces += `<path class="trace" d="M${a[0]} ${a[1]} H${b[0]}"/>`;
    if (G.isCleared(st, n)) lit += `<path class="trace-lit" style="--c:${WEEKS[n - 1].phase.color}" d="M${a[0]} ${a[1]} H${b[0]}"/>`;
  }
  WEEKS.forEach(w => {
    const [x, y] = pos[w.n];
    const cleared = G.isCleared(st, w.n), isCur = w.n === cur;
    const state = cleared ? 'cleared' : isCur ? 'current' : 'locked';
    pads += `<g class="pad pad--${state}${w.n === sched ? ' pad--today' : ''}" style="--c:${w.phase.color}" data-n="${w.n}" tabindex="0" role="button"
      aria-label="Level ${w.n}: ${esc(w.block.topic)} (${state})">
      ${isCur ? `<circle class="pad__ring" cx="${x}" cy="${y}" r="16"/>` : ''}
      <circle class="pad__ring2" cx="${x}" cy="${y}" r="11"/>
      <circle class="pad__copper" cx="${x}" cy="${y}" r="9"/>
      <circle class="pad__hole" cx="${x}" cy="${y}" r="3.2"/>
      <text class="pad__num" x="${x}" y="${y + (w.weekInBlock % 2 ? 26 : 27)}">${w.n}</text>
      ${w.n === sched ? `<g class="probe"><path d="M${x} ${y - 18} l-7 -12 h14 z"/><text x="${x}" y="${y - 34}">TODAY</text></g>` : ''}
    </g>`;
  });
  out = `<svg class="board" viewBox="0 0 ${W} ${TOP + G.phases.length * ROW - 40}" role="img" aria-label="Your journey board">
    <defs>
      <pattern id="mask-dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.8" fill="rgba(150,255,200,0.07)"/></pattern>
    </defs>
    <rect x="0" y="0" width="${W}" height="100%" fill="url(#mask-dots)"/>
    <g class="traces">${traces}</g><g class="lit">${lit}</g><g>${labels}</g><g>${chips}</g><g>${pads}</g>
  </svg>`;
  return out;
}

function viewJourney() {
  const st = S();
  const cur = Math.min(G.TOTAL_WEEKS, G.currentLevel(st));
  const w = WEEKS[cur - 1];
  const day = G.dayOfJourney(st.start);
  const sched = G.scheduleWeek(st.start);
  const pace = day >= 1 ? cur - sched : 0;
  const allDone = G.currentLevel(st) > G.TOTAL_WEEKS;
  const paceTxt = day < 1 ? `Your journey starts on ${G.fmt(st.start, { day: 'numeric', month: 'long', year: 'numeric' })}.`
    : pace === 0 ? 'Right on the clock.' : pace > 0 ? `${pace} level${pace > 1 ? 's' : ''} ahead of the calendar.` : `${-pace} level${pace < -1 ? 's' : ''} behind the calendar. Steady current beats a spike.`;
  const earned = G.ACHIEVEMENTS.map(a => ({ ...a, on: !!st.achievements[a.id] }));
  const p = w.phase;
  return `
  <section class="hero" style="--c:${p.color}">
    <div class="hero__text">
      <div class="kicker"><span class="led led--on"></span>${allDone ? 'Journey complete' : `Chapter ${p.id} of 6 · Level ${pad2(cur)} of ${G.TOTAL_WEEKS}`}</div>
      <h1 class="hero__title">${esc(p.title)}</h1>
      <p class="hero__story">${esc(p.story)}</p>
      <p class="hero__episode"><span class="mono">EP ${pad2(w.n)} ·</span> ${esc(w.block.episode)}</p>
      <div class="hero__cta">
        <a class="btn btn--primary btn--big" href="#/level/${cur}"><span class="btn__led"></span>${allDone ? 'Replay the final level' : `Enter level ${cur}: ${esc(w.block.topic)}`}</a>
        <span class="pace">${paceTxt}</span>
      </div>
    </div>
    <div class="hero__scope scope">
      <div class="scope__bezel"><canvas class="scene" data-week="${cur}"></canvas>
        <div class="scope__caption"><span>SCENE ${pad2(cur)}</span>${esc(sceneTitle(w))}</div></div>
      <div class="scope__knobs"><i></i><i></i><i></i><span>${G.fmt(w.start)} – ${G.fmt(w.end)}</span></div>
    </div>
  </section>

  <section class="panel panel--board">
    <header class="panel__head"><h2>The board</h2><p>Each pad is one week. Clear a level to send current down the trace and power up the next one. Each chip is a chapter of your story.</p></header>
    <div class="board-wrap">${boardSVG()}</div>
    <div class="legend"><span><i class="lg lg--cleared"></i>Cleared</span><span><i class="lg lg--current"></i>Current level</span><span><i class="lg lg--locked"></i>Locked</span><span><i class="lg lg--today"></i>Calendar week</span></div>
  </section>

  <section class="chapters">
    ${G.phases.map(ph => {
      const ws = WEEKS.filter(x => x.phaseId === ph.id);
      const done = ws.filter(x => G.isCleared(st, x.n)).length;
      const unlocked = G.phaseUnlocked(st, WEEKS, ph.id);
      return `<article class="chapter ${unlocked ? '' : 'is-locked'}" style="--c:${ph.color}">
        <div class="chapter__top"><span class="chapter__code">${ph.code}</span><span class="chapter__dates">${G.fmt(ws[0].start, { month: 'short', year: 'numeric' })} → ${G.fmt(ws[ws.length - 1].end, { month: 'short', year: 'numeric' })}</span></div>
        <h3>${esc(ph.name)}</h3>
        <p>${unlocked ? esc(ph.goal) : 'Locked. Clear the previous chapter to power this chip.'}</p>
        <div class="bar bar--thin"><i style="width:${(done / ws.length * 100).toFixed(1)}%"></i></div>
        <small class="mono">${done}/${ws.length} levels · ${G.projectsDef.filter(x => x.phase === ph.id).length} builds</small>
      </article>`;
    }).join('')}
  </section>

  <section class="panel">
    <header class="panel__head"><h2>Achievements</h2><p>${earned.filter(a => a.on).length} of ${earned.length} unlocked</p></header>
    <div class="badges">${earned.map(a => `<div class="badge ${a.on ? 'is-on' : ''}" title="${esc(a.desc)}"><span class="badge__icon">${a.on ? a.icon : '?'}</span><b>${esc(a.name)}</b><small>${a.on ? `Unlocked ${G.fmt(st.achievements[a.id])}` : esc(a.desc)}</small></div>`).join('')}</div>
  </section>`;
}

function bindJourney(root) {
  $$('.pad', root).forEach(el => {
    const go = () => { location.hash = `#/level/${el.dataset.n}`; };
    el.addEventListener('click', go);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    el.addEventListener('mouseenter', () => showTip(el));
    el.addEventListener('mouseleave', hideTip);
    el.addEventListener('focus', () => showTip(el));
    el.addEventListener('blur', hideTip);
  });
  $$('.chip', root).forEach(el => {
    const go = () => { const w = WEEKS.find(x => x.phaseId === +el.dataset.phase); location.hash = `#/level/${w.n}`; };
    el.addEventListener('click', go);
    el.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  });
}

function showTip(el) {
  const w = WEEKS[+el.dataset.n - 1];
  const st = S();
  let tip = $('#tip');
  const status = G.isCleared(st, w.n) ? `Cleared ${G.fmt(st.weeks[w.n].cleared)}` : G.isUnlocked(st, w.n) ? 'Current level' : 'Locked';
  tip.innerHTML = `<div class="mono">LEVEL ${pad2(w.n)} · ${G.fmt(w.start)} – ${G.fmt(w.end)}</div><b>${esc(w.block.topic)}</b><div>Scene: ${esc(sceneTitle(w))}</div><div class="tip__status" style="color:${w.phase.color}">${status}</div>`;
  const r = el.getBoundingClientRect();
  tip.style.left = `${Math.min(innerWidth - 260, Math.max(8, r.left + r.width / 2 - 120))}px`;
  tip.style.top = `${r.top + scrollY - 10}px`;
  tip.classList.add('is-on');
}
function hideTip() { $('#tip').classList.remove('is-on'); }

// ---------------------------------------------------------------------------
// Level view
function viewLevel(n) {
  const st = S();
  n = Math.max(1, Math.min(G.TOTAL_WEEKS, n));
  const w = WEEKS[n - 1];
  const unlocked = G.isUnlocked(st, n);
  const cleared = G.isCleared(st, n);
  const prog = G.weekProgress(st, w);
  const wk = st.weeks[n] || {};
  const weekMin = G.minutesBetween(st, w.start, w.end);
  const logs = st.log.filter(l => l.date >= w.start && l.date <= w.end).sort((a, b) => b.date.localeCompare(a.date));
  const phaseProjects = G.projectsDef.filter(p => p.phase === w.phaseId);
  const isLastOfBlock = w.weekInBlock === w.blockLen - 1;
  return `
  <section class="level ${unlocked ? '' : 'is-locked'} ${cleared ? 'is-cleared' : ''}" style="--c:${w.phase.color}">
    <div class="level__nav">
      ${n > 1 ? `<a class="btn btn--ghost" href="#/level/${n - 1}">← ${pad2(n - 1)}</a>` : '<span></span>'}
      <div class="level__crumbs mono">${w.phase.code} · ${esc(w.phase.name).toUpperCase()} · WEEK ${w.local} OF ${w.phase.weeks}</div>
      ${n < G.TOTAL_WEEKS ? `<a class="btn btn--ghost" href="#/level/${n + 1}">${pad2(n + 1)} →</a>` : '<span></span>'}
    </div>
    <div class="level__grid">
      <div class="level__main">
        <div class="kicker"><span class="led ${cleared ? 'led--done' : unlocked ? 'led--on' : ''}"></span>
          LEVEL ${pad2(n)} / ${G.TOTAL_WEEKS} · ${G.fmt(w.start)} – ${G.fmt(w.end, { day: 'numeric', month: 'short', year: 'numeric' })}
          ${cleared ? `<span class="pill pill--done">Cleared ${G.fmt(wk.cleared)}</span>` : unlocked ? '<span class="pill pill--live">Powered</span>' : '<span class="pill">Locked</span>'}
        </div>
        <h1 class="level__title">${esc(w.block.topic)}${w.blockLen > 1 ? ` <span class="level__part">part ${w.weekInBlock + 1}/${w.blockLen}</span>` : ''}</h1>
        <p class="level__episode">${esc(w.block.episode)}</p>
        <div class="scope scope--big">
          <div class="scope__bezel"><canvas class="scene" data-week="${n}"></canvas>
            ${unlocked ? '' : `<div class="scope__locked"><div class="lock-ico"></div><b>NO SIGNAL</b><span>Clear level ${n - 1} to power this scene</span></div>`}
            <div class="scope__caption"><span>SCENE ${pad2(n)}</span>${esc(sceneTitle(w))}</div></div>
          <div class="scope__knobs"><i></i><i></i><i></i><span>${esc(w.block.details.split('.')[0])}</span></div>
        </div>
      </div>

      <aside class="level__side">
        <div class="panel panel--quests">
          <header class="panel__head"><h2>Quests</h2><p class="mono"><span id="qcount">${prog.done}/${prog.total}</span> complete · +25 XP each</p></header>
          <ul class="quests">
            ${w.quests.map(q => {
              const done = G.questDone(st, w, q);
              const tag = { study: 'THEORY', lab: 'BENCH', reflect: 'LOG' }[q.kind];
              if (q.kind === 'reflect') return `<li class="quest quest--reflect ${done ? 'is-done' : ''}" data-q="${q.id}">
                <span class="switch ${done ? 'is-on' : ''}" aria-hidden="true"><i></i></span>
                <div><span class="quest__tag">${tag}</span><span class="quest__text">${esc(q.text)}</span>
                <textarea id="reflection" rows="3" placeholder="What clicked this week? What didn't?" ${unlocked ? '' : 'disabled'}>${esc(wk.reflection || '')}</textarea></div></li>`;
              return `<li class="quest ${done ? 'is-done' : ''}" data-q="${q.id}">
                <button class="switch ${done ? 'is-on' : ''}" role="switch" aria-checked="${done}" ${unlocked ? '' : 'disabled'} aria-label="${esc(q.text)}"><i></i></button>
                <div><span class="quest__tag">${tag}</span><span class="quest__text">${esc(q.text)}</span></div></li>`;
            }).join('')}
          </ul>
          ${isLastOfBlock && phaseProjects.length ? `<p class="hint">Builds for this chapter live in <a href="#/builds">Builds</a>. Finishing them earns big XP.</p>` : ''}
          <button id="clear-level" class="btn btn--primary btn--wide ${prog.ready && unlocked && !cleared ? 'is-ready' : ''}" ${prog.ready && unlocked && !cleared ? '' : 'disabled'}>
            <span class="btn__led"></span>${cleared ? 'Level cleared' : !unlocked ? 'Locked' : prog.ready ? (n === G.TOTAL_WEEKS ? 'Complete the journey' : `Power up level ${n + 1}`) : `Finish ${prog.total - prog.done} more quest${prog.total - prog.done > 1 ? 's' : ''} to unlock`}
          </button>
        </div>

        <div class="panel">
          <header class="panel__head"><h2>Bench time this week</h2><p class="mono">${hrs(weekMin)} h of 20 h · +10 XP per hour</p></header>
          <div class="charge"><div class="charge__fill" style="--w:${Math.min(100, weekMin / 12)}%"></div><span>${Math.round(Math.min(100, weekMin / 12))}%</span></div>
          ${quickLogForm(w)}
          ${logs.length ? `<ul class="minilog">${logs.map(l => `<li><span class="mono">${G.fmt(l.date)}</span> ${esc(l.topic || l.category)} <b>${hrs(l.minutes)} h</b></li>`).join('')}</ul>` : ''}
        </div>
      </aside>
    </div>
  </section>`;
}

function quickLogForm(w) {
  const t = G.today();
  const def = t >= w.start && t <= w.end ? t : (t > w.end ? w.end : w.start);
  return `<form class="quicklog" data-topic="${esc(w.block.topic)}">
    <label>Date<input type="date" name="date" value="${def}" required></label>
    <label>Hours<input type="number" name="hours" min="0.25" max="16" step="0.25" value="1" required></label>
    <label>Type<select name="category">${CATS.map(c => `<option>${c}</option>`).join('')}</select></label>
    <button class="btn">Log</button>
  </form>`;
}
const CATS = ['Theory', 'Lab', 'Simulation', 'Project', 'Reading', 'Video', 'Ham radio'];

function bindLevel(root, n) {
  const w = WEEKS[n - 1];
  $$('.quest button.switch', root).forEach(btn => btn.addEventListener('click', () => {
    const id = btn.closest('.quest').dataset.q;
    store.update(s => {
      const wk = (s.weeks[n] = s.weeks[n] || { quests: {} });
      wk.quests = wk.quests || {};
      wk.quests[id] = !wk.quests[id];
    });
    blip('tick', store.config.sound);
  }));
  const ta = $('#reflection', root);
  if (ta) {
    let t;
    ta.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const before = G.questDone(S(), w, w.quests.find(q => q.id === 'reflect'));
        store.update(s => { const wk = (s.weeks[n] = s.weeks[n] || { quests: {} }); wk.reflection = ta.value; }, { silent: true });
        const after = G.questDone(S(), w, w.quests.find(q => q.id === 'reflect'));
        if (before !== after) { const pos = ta.selectionStart; render(); const nt = $('#reflection'); if (nt) { nt.focus(); nt.setSelectionRange(pos, pos); } }
        else renderHUD();
      }, 400);
    });
  }
  const clr = $('#clear-level', root);
  if (clr) clr.addEventListener('click', () => clearLevel(n, clr));
  bindQuickLog(root);
}

function bindQuickLog(root) {
  $$('.quicklog', root).forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(f);
    const minutes = Math.round(parseFloat(d.get('hours')) * 60);
    if (!minutes) return;
    store.update(s => s.log.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), date: d.get('date'), minutes, category: d.get('category'), topic: f.dataset.topic, notes: '', project: null }));
    toast(`Logged ${hrs(minutes)} h · +${Math.floor(minutes / 6)} XP`, 'ok');
    const r = f.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, phaseColor(activePhaseId()), 24);
  }));
}

async function clearLevel(n, btn) {
  const before = S();
  const w = WEEKS[n - 1];
  const wasPhaseDone = G.phaseComplete(before, WEEKS, w.phaseId);
  store.update(s => { const wk = (s.weeks[n] = s.weeks[n] || { quests: {} }); wk.cleared = G.today(); s.seen.levels = [...new Set([...(s.seen.levels || []), n + 1])]; }, { silent: true });
  const r = btn.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, w.phase.color, 50);
  const st = S();
  const sound = store.config.sound;
  if (!wasPhaseDone && G.phaseComplete(st, WEEKS, w.phaseId)) {
    const ph = w.phase, next = G.phases.find(p => p.id === ph.id + 1);
    await powerOn({
      kind: 'phase', color: ph.color, sound,
      kicker: `CHAPTER ${ph.id} COMPLETE · +1000 XP`,
      title: next ? next.title : 'The journey is complete',
      sub: next ? next.story : 'Two years, six chapters, one bench that became a body of work. Time to tell the story.',
      lines: [`> ${ph.chip}: all ${ph.weeks} levels verified`, `> builds unlocked: ${G.projectsDef.filter(p => p.phase === ph.id).map(p => '#' + p.id).join(' ')}`, next ? `> powering ${next.code} · ${next.chip} … OK` : '> system: MASTER ENGINEER mode'],
      cta: next ? `Begin chapter ${next.id}` : 'See the board',
    });
  } else if (n < G.TOTAL_WEEKS) {
    const nw = WEEKS[n];
    await powerOn({
      color: nw.phase.color, sound,
      kicker: `LEVEL ${pad2(n + 1)} UNLOCKED · +150 XP`,
      title: nw.block.topic + (nw.blockLen > 1 ? ` · part ${nw.weekInBlock + 1}/${nw.blockLen}` : ''),
      sub: nw.weekInBlock ? `New scene, new variation. ${nw.quests.filter(q => q.kind === 'study').map(q => q.text).join(' · ')}` : nw.block.episode,
      lines: [`> clear week_${pad2(n)} … OK`, `> flash week_${pad2(n + 1)}.bin  [${'█'.repeat(16)}] 100%`, `> scene loaded: ${sceneTitle(nw)}`, `> ${nw.quests.length} quests armed. Dates ${G.fmt(nw.start)} – ${G.fmt(nw.end)}`],
      cta: `Enter level ${n + 1}`,
    });
  }
  store.dispatchEvent(new Event('change'));
  location.hash = `#/level/${Math.min(G.TOTAL_WEEKS, n + 1)}`;
}

// ---------------------------------------------------------------------------
// Builds (projects)
function diffLeds(d) { const n = { Beginner: 1, Intermediate: 2, Advanced: 3 }[d] || 1; return `<span class="leds" title="${d}">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`; }

function viewBuilds() {
  const st = S();
  const doneCount = Object.values(st.projects).filter(p => p.status === 'done').length;
  return `
  <section class="page-head"><div class="kicker"><span class="led led--on"></span>BOSS LEVELS</div><h1>Builds</h1>
    <p>30 real projects, one per milestone. Each one you finish becomes a chapter in your portfolio. <b>${doneCount}/30</b> complete.</p></section>
  ${G.phases.map(ph => {
    const unlocked = G.phaseUnlocked(st, WEEKS, ph.id);
    return `<section class="build-group" style="--c:${ph.color}">
      <h2><span class="chapter__code">${ph.code}</span> ${esc(ph.name)} ${unlocked ? '' : '<span class="pill">Locked</span>'}</h2>
      <div class="builds">${G.projectsDef.filter(p => p.phase === ph.id).map(p => {
        const ps = st.projects[p.id] || {};
        const status = ps.status || 'not_started';
        return `<article class="build build--${status} ${unlocked ? '' : 'is-locked'}" data-id="${p.id}">
          <div class="build__top"><span class="build__ref">#${pad2(p.id)}</span>${diffLeds(p.difficulty)}<span class="build__xp">+${G.projectXP(p)} XP</span></div>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.description)}</p>
          ${ps.notes ? `<p class="build__notes">“${esc(ps.notes)}”</p>` : ''}
          <div class="build__foot">
            <span class="pill pill--${status}">${{ not_started: 'Not started', in_progress: 'In progress', done: 'Done' }[status]}</span>
            ${ps.url ? `<a href="${esc(ps.url)}" target="_blank" rel="noopener">Repo ↗</a>` : ''}
            <button class="btn btn--ghost btn--sm" data-edit="${p.id}" ${unlocked ? '' : 'disabled'}>Update</button>
          </div>
        </article>`;
      }).join('')}</div></section>`;
  }).join('')}`;
}

function bindBuilds(root) {
  $$('[data-edit]', root).forEach(b => b.addEventListener('click', () => openBuild(+b.dataset.edit)));
}

function openBuild(id) {
  const p = G.projectsDef.find(x => x.id === id);
  const ps = S().projects[id] || {};
  modal(`<h2>#${pad2(p.id)} ${esc(p.title)}</h2><p class="muted">${esc(p.description)}</p>
    <form id="build-form" class="form">
      <label>Status<select name="status">${[['not_started', 'Not started'], ['in_progress', 'In progress'], ['done', 'Done']].map(([v, l]) => `<option value="${v}" ${ps.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label>Repo or write-up link<input name="url" type="url" placeholder="https://github.com/uxguy-in/…" value="${esc(ps.url || '')}"></label>
      <label>Build notes<textarea name="notes" rows="4" placeholder="What you built, what broke, what you measured">${esc(ps.notes || '')}</textarea></label>
      <div class="form__row"><button class="btn btn--primary">Save build</button></div>
    </form>`, root => {
    $('#build-form', root).addEventListener('submit', async e => {
      e.preventDefault();
      const d = new FormData(e.target);
      const wasDone = ps.status === 'done';
      store.update(s => {
        const cur = s.projects[id] || {};
        const status = d.get('status');
        s.projects[id] = { ...cur, status, url: d.get('url'), notes: d.get('notes'),
          started: cur.started || (status !== 'not_started' ? G.today() : null),
          completed: status === 'done' ? (cur.completed || G.today()) : null };
      }, { silent: true });
      closeModal();
      if (!wasDone && d.get('status') === 'done') {
        await powerOn({ kind: 'rank', color: phaseColor(p.phase), sound: store.config.sound, kicker: `BUILD COMPLETE · +${G.projectXP(p)} XP`, title: p.title,
          sub: 'Another real thing that exists in the world because you made it.', lines: [`> project #${pad2(p.id)} … PASS`, '> add photos, scope captures and a short README while it is fresh'], cta: 'Back to builds' });
      }
      store.dispatchEvent(new Event('change'));
    });
  });
}

// ---------------------------------------------------------------------------
// Logbook
function viewLog() {
  const st = S();
  const total = G.totalMinutes(st);
  const sched = G.dayOfJourney(st.start) >= 1 ? G.scheduleWeek(st.start) : 1;
  const from = Math.max(1, sched - 15);
  const series = WEEKS.slice(from - 1, sched).map(w => ({ n: w.n, m: G.minutesBetween(st, w.start, w.end), c: w.phase.color }));
  const maxM = Math.max(1500, ...series.map(s => s.m));
  const cw = 640, ch = 180;
  const step = series.length > 1 ? cw / (series.length - 1) : cw;
  const pts = series.map((s, i) => [series.length > 1 ? i * step : cw / 2, ch - (s.m / maxM) * ch]);
  const target = ch - (1200 / maxM) * ch;
  const cats = CATS.map(c => ({ c, m: st.log.filter(l => l.category === c).reduce((a, l) => a + l.minutes, 0) })).filter(x => x.m);
  const maxC = Math.max(1, ...cats.map(c => c.m));
  const cur = WEEKS[Math.min(G.TOTAL_WEEKS, G.currentLevel(st)) - 1];
  const rows = [...st.log].sort((a, b) => b.date.localeCompare(a.date));
  return `
  <section class="page-head"><div class="kicker"><span class="led led--on"></span>DATA LOGGER</div><h1>Logbook</h1>
    <p>Every hour at the bench is charge in the capacitor. 10 XP per hour.</p></section>
  <div class="stats">
    <div class="stat"><small>Total</small><b>${hrs(total)}</b><span>hours</span></div>
    <div class="stat"><small>This week</small><b>${hrs(G.minutesBetween(st, WEEKS[sched - 1].start, WEEKS[sched - 1].end))}</b><span>/ 20 h</span></div>
    <div class="stat"><small>Streak</small><b>${G.streak(st)}</b><span>days · best ${G.bestStreak(st)}</span></div>
    <div class="stat"><small>Sessions</small><b>${st.log.length}</b><span>logged</span></div>
  </div>
  <div class="log-grid">
    <section class="panel">
      <header class="panel__head"><h2>Weekly hours</h2><p class="mono">CH1 hours/week · dashed = 20 h target</p></header>
      <div class="scope scope--chart"><div class="scope__bezel">
        <svg viewBox="-10 -10 ${cw + 20} ${ch + 30}" class="chart">
          ${Array.from({ length: 11 }, (_, i) => `<line class="grid" x1="${i * cw / 10}" y1="0" x2="${i * cw / 10}" y2="${ch}"/>`).join('')}
          ${Array.from({ length: 5 }, (_, i) => `<line class="grid" x1="0" y1="${i * ch / 4}" x2="${cw}" y2="${i * ch / 4}"/>`).join('')}
          <line class="target" x1="0" y1="${target}" x2="${cw}" y2="${target}"/>
          <polyline class="trace-line" points="${pts.map(p => p.join(',')).join(' ')}"/>
          ${pts.map((p, i) => `<circle class="pt" cx="${p[0]}" cy="${p[1]}" r="4" style="--c:${series[i].c}"><title>Week ${series[i].n}: ${hrs(series[i].m)} h</title></circle><text class="ax" x="${p[0]}" y="${ch + 16}">${series[i].n}</text>`).join('')}
        </svg></div></div>
    </section>
    <section class="panel">
      <header class="panel__head"><h2>Log a session</h2><p class="mono">Defaults to level ${cur.n}: ${esc(cur.block.topic)}</p></header>
      <form id="log-form" class="form">
        <div class="form__row">
          <label>Date<input type="date" name="date" value="${G.today()}" required></label>
          <label>Hours<input type="number" name="hours" min="0.25" max="16" step="0.25" value="1.5" required></label>
          <label>Type<select name="category">${CATS.map(c => `<option>${c}</option>`).join('')}</select></label>
        </div>
        <label>Topic<input name="topic" value="${esc(cur.block.topic)}"></label>
        <label>Build (optional)<select name="project"><option value="">—</option>${G.projectsDef.map(p => `<option value="${p.id}">#${pad2(p.id)} ${esc(p.title)}</option>`).join('')}</select></label>
        <label>Notes<textarea name="notes" rows="2" placeholder="What did you measure, read or break?"></textarea></label>
        <button class="btn btn--primary">Log session</button>
      </form>
      ${cats.length ? `<div class="cats">${cats.map(c => `<div class="cat"><span>${c.c}</span><div class="bar bar--thin"><i style="width:${c.m / maxC * 100}%"></i></div><b>${hrs(c.m)} h</b></div>`).join('')}</div>` : ''}
    </section>
  </div>
  <section class="panel">
    <header class="panel__head"><h2>Entries</h2><p class="mono">${rows.length} sessions</p></header>
    ${rows.length ? `<table class="table"><thead><tr><th>Date</th><th>Hours</th><th>Type</th><th>Topic</th><th>Notes</th><th></th></tr></thead><tbody>
    ${rows.map(l => `<tr><td class="mono">${G.fmt(l.date, { day: 'numeric', month: 'short', year: '2-digit' })}</td><td class="mono">${hrs(l.minutes)}</td><td>${esc(l.category)}</td><td>${esc(l.topic)}${l.project ? ` <span class="pill">#${pad2(l.project)}</span>` : ''}</td><td class="muted">${esc(l.notes)}</td><td><button class="icon-btn" data-del="${l.id}" aria-label="Delete entry">✕</button></td></tr>`).join('')}
    </tbody></table>` : '<p class="empty">No sessions yet. Your first one unlocks <b>First Light</b>.</p>'}
  </section>`;
}

function bindLog(root) {
  $('#log-form', root).addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(e.target);
    const minutes = Math.round(parseFloat(d.get('hours')) * 60);
    store.update(s => s.log.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), date: d.get('date'), minutes, category: d.get('category'), topic: d.get('topic'), notes: d.get('notes'), project: d.get('project') ? +d.get('project') : null }));
    toast(`Logged ${hrs(minutes)} h · +${Math.floor(minutes / 6)} XP`, 'ok');
  });
  $$('[data-del]', root).forEach(b => b.addEventListener('click', () => {
    if (!confirm('Delete this log entry?')) return;
    store.update(s => { s.log = s.log.filter(l => l.id !== b.dataset.del); });
  }));
}

// ---------------------------------------------------------------------------
// Library
let libFilter = { type: 'all', phase: 'all' };
function viewLibrary() {
  const st = S();
  const all = [...G.resourcesDef.map(r => ({ ...r, ...(st.resources[r.id] || {}) })), ...st.customResources.map(r => ({ ...r, custom: true }))];
  const list = all.filter(r => (libFilter.type === 'all' || r.type === libFilter.type) && (libFilter.phase === 'all' || String(r.phase) === libFilter.phase));
  const icon = { book: '📕', course: '🎓', youtube: '▶️', link: '🔗' };
  return `
  <section class="page-head"><div class="kicker"><span class="led led--on"></span>DATASHEETS</div><h1>Library</h1>
    <p>Books, courses and channels for every chapter. Finishing one is +40 XP.</p></section>
  <div class="filters">
    ${['all', 'book', 'course', 'youtube', 'link'].map(t => `<button class="chipbtn ${libFilter.type === t ? 'is-on' : ''}" data-ft="${t}">${t === 'all' ? 'All types' : t}</button>`).join('')}
    <span class="sep"></span>
    ${['all', ...G.phases.map(p => String(p.id))].map(p => `<button class="chipbtn ${libFilter.phase === p ? 'is-on' : ''}" data-fp="${p}">${p === 'all' ? 'All chapters' : 'U' + p}</button>`).join('')}
    <button class="btn btn--sm" id="add-res">+ Add resource</button>
  </div>
  <div class="library">
    ${list.map(r => `<article class="res res--${r.status || 'not_started'}" style="--c:${phaseColor(r.phase)}">
      <div class="res__top"><span>${icon[r.type] || '🔗'} ${esc(r.type)}</span><span class="mono">U${r.phase}</span></div>
      <h3>${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)} ↗</a>` : esc(r.title)}</h3>
      <p class="muted">${esc(r.author || '')}</p>
      ${r.notes ? `<p class="res__notes">${esc(r.notes)}</p>` : ''}
      <div class="res__foot">
        <select data-rs="${r.custom ? 'c' : ''}${r.id}">${[['not_started', 'Not started'], ['in_progress', 'In progress'], ['done', 'Done']].map(([v, l]) => `<option value="${v}" ${(r.status || 'not_started') === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <span class="stars" data-rr="${r.custom ? 'c' : ''}${r.id}">${[1, 2, 3, 4, 5].map(i => `<button class="${i <= (r.rating || 0) ? 'on' : ''}" data-v="${i}" aria-label="${i} stars">★</button>`).join('')}</span>
      </div>
    </article>`).join('')}
  </div>`;
}

function bindLibrary(root) {
  $$('[data-ft]', root).forEach(b => b.addEventListener('click', () => { libFilter.type = b.dataset.ft; render(); }));
  $$('[data-fp]', root).forEach(b => b.addEventListener('click', () => { libFilter.phase = b.dataset.fp; render(); }));
  const setRes = (key, patch) => store.update(s => {
    if (key.startsWith('c')) { const r = s.customResources.find(x => String(x.id) === key.slice(1)); Object.assign(r, patch); }
    else s.resources[key] = { ...(s.resources[key] || {}), ...patch };
  });
  $$('[data-rs]', root).forEach(sel => sel.addEventListener('change', () => setRes(sel.dataset.rs, { status: sel.value })));
  $$('[data-rr] button', root).forEach(b => b.addEventListener('click', () => setRes(b.parentElement.dataset.rr, { rating: +b.dataset.v })));
  $('#add-res', root).addEventListener('click', () => modal(`<h2>Add a resource</h2>
    <form id="res-form" class="form">
      <label>Title<input name="title" required></label>
      <div class="form__row"><label>Type<select name="type"><option>book</option><option>course</option><option>youtube</option><option>link</option></select></label>
      <label>Chapter<select name="phase">${G.phases.map(p => `<option value="${p.id}">U${p.id} ${esc(p.name)}</option>`).join('')}</select></label></div>
      <label>Author / channel<input name="author"></label>
      <label>Link<input name="url" type="url"></label>
      <label>Notes<textarea name="notes" rows="2"></textarea></label>
      <button class="btn btn--primary">Add</button></form>`, r => {
    $('#res-form', r).addEventListener('submit', e => {
      e.preventDefault(); const d = new FormData(e.target);
      store.update(s => s.customResources.push({ id: Date.now(), title: d.get('title'), type: d.get('type'), phase: +d.get('phase'), author: d.get('author'), url: d.get('url'), notes: d.get('notes'), status: 'not_started', rating: null }));
      closeModal();
    });
  }));
}

// ---------------------------------------------------------------------------
// Setup
function viewSetup() {
  const c = store.config, st = S();
  return `
  <section class="page-head"><div class="kicker"><span class="led led--on"></span>CONFIG REGISTERS</div><h1>Setup</h1>
    <p>Your progress is saved in this browser and, once connected, to <span class="mono">${esc(c.path)}</span> in your GitHub repo so every device sees the same journey.</p></section>
  <div class="setup-grid">
    <section class="panel">
      <header class="panel__head"><h2>Save progress to GitHub</h2><p class="mono">Status: ${esc(store.statusMsg || store.status)}</p></header>
      <ol class="steps">
        <li>Open <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">GitHub → Fine-grained tokens → Generate</a>.</li>
        <li>Repository access: <b>Only select repositories</b> → <span class="mono">${esc(c.owner)}/${esc(c.repo)}</span>.</li>
        <li>Permissions → Repository → <b>Contents: Read and write</b>. Set a long expiry.</li>
        <li>Paste it below. It stays in this browser only and is never committed.</li>
      </ol>
      <form id="sync-form" class="form">
        <div class="form__row"><label>Owner<input name="owner" value="${esc(c.owner)}"></label><label>Repo<input name="repo" value="${esc(c.repo)}"></label><label>Branch<input name="branch" value="${esc(c.branch)}"></label></div>
        <label>Token<input name="token" type="password" autocomplete="off" placeholder="github_pat_…" value="${esc(c.token)}"></label>
        <div class="form__row"><button class="btn btn--primary">Connect &amp; sync</button><button type="button" class="btn btn--ghost" id="forget">Forget token on this device</button></div>
      </form>
    </section>
    <section class="panel">
      <header class="panel__head"><h2>Calendar</h2><p class="mono">Level 1 starts ${G.fmt(st.start, { day: 'numeric', month: 'long', year: 'numeric' })}</p></header>
      <p class="muted">Each level is one calendar week. Changing the start date shifts every date but keeps your progress.</p>
      <form id="start-form" class="form form__row"><label>Start date<input type="date" name="start" value="${st.start}"></label><button class="btn">Save start date</button></form>
      <header class="panel__head"><h2>Feel</h2></header>
      <label class="toggle"><input type="checkbox" id="opt-motion" ${c.motion === 'calm' ? '' : 'checked'}> Full motion and animation</label>
      <label class="toggle"><input type="checkbox" id="opt-sound" ${c.sound ? 'checked' : ''}> Unlock sounds</label>
      <header class="panel__head"><h2>Backup</h2></header>
      <div class="form__row"><button class="btn" id="export">Download progress JSON</button><label class="btn btn--ghost">Import JSON<input type="file" id="import" accept="application/json" hidden></label></div>
      <header class="panel__head"><h2>Danger zone</h2></header>
      <button class="btn btn--danger" id="reset">Reset all progress</button>
    </section>
  </div>`;
}

function bindSetup(root) {
  $('#sync-form', root).addEventListener('submit', async e => {
    e.preventDefault(); const d = new FormData(e.target);
    store.setConfig({ owner: d.get('owner').trim(), repo: d.get('repo').trim(), branch: d.get('branch').trim() || 'main', token: d.get('token').trim() });
    await store.pull();
    toast(store.status === 'error' ? `Sync failed: ${store.statusMsg}` : 'Connected. Progress is syncing to GitHub.', store.status === 'error' ? 'err' : 'ok');
    render();
  });
  $('#forget', root).addEventListener('click', () => { store.setConfig({ token: '' }); store._setStatus('local'); render(); toast('Token removed from this device'); });
  $('#start-form', root).addEventListener('submit', e => {
    e.preventDefault(); const v = new FormData(e.target).get('start');
    if (!v) return;
    store.update(s => { s.start = v; }); WEEKS = G.buildWeeks(v); toast(`Calendar now starts ${G.fmt(v, { day: 'numeric', month: 'long', year: 'numeric' })}`, 'ok');
  });
  $('#opt-motion', root).addEventListener('change', e => { store.setConfig({ motion: e.target.checked ? 'full' : 'calm' }); bg.setCalm(calm()); render(); });
  $('#opt-sound', root).addEventListener('change', e => store.setConfig({ sound: e.target.checked }));
  $('#export', root).addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S(), null, 1)], { type: 'application/json' }));
    a.download = `electronics-progress-${G.today()}.json`; a.click();
  });
  $('#import', root).addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const j = JSON.parse(await f.text()); if (!confirm('Replace your current progress with this file?')) return; store.replaceState(j); WEEKS = G.buildWeeks(S().start); toast('Progress imported', 'ok'); }
    catch { toast('That file is not valid progress JSON', 'err'); }
  });
  $('#reset', root).addEventListener('click', () => {
    if (prompt('Type RESET to erase all progress (levels, logs, builds).') !== 'RESET') return;
    const start = S().start;
    store.replaceState({ start });
    WEEKS = G.buildWeeks(start);
    toast('Progress reset. Level 1 is waiting.');
  });
}

// ---------------------------------------------------------------------------
// Modal
function modal(html, bind) {
  closeModal();
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="modal__card" role="dialog" aria-modal="true"><button class="icon-btn modal__x" aria-label="Close">✕</button>${html}</div>`;
  document.body.appendChild(m);
  m.addEventListener('click', e => { if (e.target === m) closeModal(); });
  $('.modal__x', m).addEventListener('click', closeModal);
  addEventListener('keydown', escClose);
  bind && bind(m);
  setTimeout(() => { const f = $('input,select,textarea', m); f && f.focus(); }, 50);
}
function escClose(e) { if (e.key === 'Escape') closeModal(); }
function closeModal() { const m = $('.modal'); if (m) m.remove(); removeEventListener('keydown', escClose); }

// ---------------------------------------------------------------------------
// Router + render
function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [name, arg] = h.split('/');
  return { name: name || 'journey', arg };
}

function render() {
  stopScenes.forEach(f => f()); stopScenes = [];
  renderHUD();
  const { name, arg } = route();
  const root = $('#view');
  const cur = Math.min(G.TOTAL_WEEKS, G.currentLevel(S()));
  $$('.nav a').forEach(a => a.classList.toggle('is-on', a.dataset.r === name || (name === 'level' && a.dataset.r === 'level')));
  $('.nav a[data-r="level"]').setAttribute('href', `#/level/${cur}`);
  let n = 0;
  if (name === 'level') { n = +arg || cur; root.innerHTML = viewLevel(n); bindLevel(root, n); }
  else if (name === 'builds') { root.innerHTML = viewBuilds(); bindBuilds(root); }
  else if (name === 'log') { root.innerHTML = viewLog(); bindLog(root); }
  else if (name === 'library') { root.innerHTML = viewLibrary(); bindLibrary(root); }
  else if (name === 'setup') { root.innerHTML = viewSetup(); bindSetup(root); }
  else { root.innerHTML = viewJourney(); bindJourney(root); }
  $$('canvas.scene', root).forEach(cv => {
    const w = WEEKS[+cv.dataset.week - 1];
    const locked = !G.isUnlocked(S(), w.n);
    stopScenes.push(runScene(cv, w.scene, sceneParams(w), { calm: calm() || locked }));
  });
  root.classList.remove('view-in'); void root.offsetWidth; root.classList.add('view-in');
}

let lastRoute = '';
async function afterChange() {
  const st = S();
  // achievements
  const fresh = G.newlyEarned(st, WEEKS);
  if (fresh.length) {
    store.update(s => fresh.forEach(a => { s.achievements[a.id] = G.today(); }), { silent: true });
    fresh.forEach((a, i) => setTimeout(() => toast(`${a.icon} Achievement unlocked: <b>${a.name}</b>`, 'gold'), i * 600));
  }
  // rank up
  const rank = G.rankFor(G.xpBreakdown(S(), WEEKS).total);
  if (rank.index > (S().seen.rank || 0)) {
    store.update(s => { s.seen.rank = rank.index; }, { silent: true });
    await powerOn({ kind: 'rank', color: phaseColor(activePhaseId()), sound: store.config.sound, kicker: `RANK UP · ${rank.index + 1} OF ${G.RANKS.length}`, title: `You are now a ${rank.name}`, sub: rank.blurb,
      lines: [`> component upgraded: ${G.RANKS[rank.index - 1].name} → ${rank.name}`, rank.next ? `> next: ${rank.next.name} at ${rank.next.xp.toLocaleString()} XP` : '> maximum rank reached'], cta: 'Keep going' });
  }
}

store.addEventListener('change', () => { render(); afterChange(); });
store.addEventListener('status', renderSync);
addEventListener('hashchange', () => { closeModal(); hideTip(); const r = location.hash; if (r !== lastRoute) { lastRoute = r; render(); scrollTo({ top: 0, behavior: calm() ? 'auto' : 'smooth' }); } });

const bg = startBackground($('#bg'), () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#39ff9f', { calm: calm() });

// First visit: the boot sequence.
async function boot() {
  render();
  if (!localStorage.getItem('ej.booted')) {
    localStorage.setItem('ej.booted', '1');
    const w = WEEKS[0];
    await powerOn({ kind: 'phase', color: w.phase.color, sound: false, kicker: 'SYSTEM BOOT · DAY 1 OF 731', title: 'Back to Electronics',
      sub: 'Two years. Six chapters. 102 levels. 30 builds. One bench. This is the story of how you go from a 20-year-old ECE degree to building a thinking prosthetic hand.',
      lines: ['> POST: scope OK · meter OK · iron OK', '> loading chapter 1: Reconnection', `> level 01 armed: ${w.block.topic}`, '> current flowing…'], cta: 'Power on' });
  }
  await store.pull();
  afterChange();
}
if (!S().start) store.update(s => { s.start = DEFAULT_START; }, { silent: true });
boot();
