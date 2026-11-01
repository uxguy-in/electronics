// Game model: turns the curriculum + your progress into levels, quests, XP, ranks and achievements.
import { CURRICULUM } from './curriculum.js';

const DAY = 86400000;
export const parseDate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const today = () => iso(new Date());
export const fmt = (d, opts = { day: 'numeric', month: 'short' }) => (typeof d === 'string' ? parseDate(d) : d).toLocaleDateString('en-GB', opts);

export const phases = CURRICULUM.phases;
export const projectsDef = CURRICULUM.projects;
export const resourcesDef = CURRICULUM.resources;
export const TOTAL_WEEKS = phases.reduce((a, p) => a + p.weeks, 0);

function splitDetails(details) {
  return details
    .split(/\.\s+(?=[A-Z0-9])/)
    .map(s => s.replace(/\.$/, '').trim())
    .filter(Boolean);
}

// Flat list of the 102 weeks ("levels").
export function buildWeeks(start) {
  const s = parseDate(start);
  const weeks = [];
  let n = 0;
  for (const p of phases) {
    p.blocks.forEach((b, bi) => {
      const len = b.to - b.from + 1;
      const items = splitDetails(b.details);
      const buckets = Array.from({ length: len }, () => []);
      items.forEach((it, i) => buckets[i % len].push(it));
      for (let k = 0; k < len; k++) {
        n++;
        const startDate = new Date(s.getTime() + (n - 1) * 7 * DAY);
        const endDate = new Date(startDate.getTime() + 6 * DAY);
        let topicQuests = buckets[k];
        if (!topicQuests.length) topicQuests = [`Consolidate: revisit the hardest idea in "${b.topic}" and explain it out loud`];
        const quests = [
          ...topicQuests.map((t, i) => ({ id: `t${i}`, kind: 'study', text: t })),
          { id: 'lab', kind: 'lab', text: 'Bench or sim: build or simulate one thing from this week and capture a photo or screenshot' },
          { id: 'reflect', kind: 'reflect', text: 'Log entry: write what clicked, what didn\'t, and one question for next week' },
        ];
        weeks.push({
          n, phaseId: p.id, phase: p, local: b.from + k, block: b, blockIdx: bi,
          weekInBlock: k, blockLen: len,
          start: iso(startDate), end: iso(endDate),
          scene: b.scene, quests,
        });
      }
    });
  }
  return weeks;
}

export function scheduleWeek(start, on = today()) {
  const diff = Math.floor((parseDate(on) - parseDate(start)) / DAY);
  return Math.max(1, Math.min(TOTAL_WEEKS, Math.floor(diff / 7) + 1));
}
export function dayOfJourney(start, on = today()) {
  return Math.floor((parseDate(on) - parseDate(start)) / DAY) + 1;
}

// ---- Level state ----
export function isCleared(state, n) { return !!(state.weeks[n] && state.weeks[n].cleared); }
export function isUnlocked(state, n) { return n === 1 || isCleared(state, n - 1); }
export function currentLevel(state) {
  for (let n = 1; n <= TOTAL_WEEKS; n++) if (!isCleared(state, n)) return n;
  return TOTAL_WEEKS + 1;
}
export function questDone(state, week, q) {
  const w = state.weeks[week.n] || {};
  if (q.id === 'reflect') return !!(w.reflection && w.reflection.trim().length >= 10);
  return !!(w.quests && w.quests[q.id]);
}
export function weekProgress(state, week) {
  const done = week.quests.filter(q => questDone(state, week, q)).length;
  return { done, total: week.quests.length, ready: done === week.quests.length };
}
export function phaseComplete(state, weeks, phaseId) {
  return weeks.filter(w => w.phaseId === phaseId).every(w => isCleared(state, w.n));
}
export function phaseUnlocked(state, weeks, phaseId) {
  const first = weeks.find(w => w.phaseId === phaseId);
  return isUnlocked(state, first.n);
}

// ---- Hours ----
export function minutesBetween(state, from, to) {
  return state.log.filter(l => l.date >= from && l.date <= to).reduce((a, l) => a + (+l.minutes || 0), 0);
}
export function totalMinutes(state) { return state.log.reduce((a, l) => a + (+l.minutes || 0), 0); }
export function streak(state) {
  const days = new Set(state.log.map(l => l.date));
  let d = new Date(); let s = 0;
  if (!days.has(iso(d))) d = new Date(d.getTime() - DAY); // today not logged yet: count from yesterday
  while (days.has(iso(d))) { s++; d = new Date(d.getTime() - DAY); }
  return s;
}
export function bestStreak(state) {
  const days = [...new Set(state.log.map(l => l.date))].sort();
  let best = 0, cur = 0, prev = null;
  for (const d of days) {
    cur = prev && (parseDate(d) - parseDate(prev)) === DAY ? cur + 1 : 1;
    best = Math.max(best, cur); prev = d;
  }
  return best;
}

// ---- XP ----
export const PROJECT_XP = { Beginner: 300, Intermediate: 500, Advanced: 800 };
export function projectXP(p) { return p.id === 30 ? 2000 : PROJECT_XP[p.difficulty] || 400; }

export function xpBreakdown(state, weeks) {
  const hours = Math.floor(totalMinutes(state) / 6);      // 10 XP per hour
  let quests = 0, clears = 0;
  for (const w of weeks) {
    quests += w.quests.filter(q => questDone(state, w, q)).length * 25;
    if (isCleared(state, w.n)) clears += 150;
  }
  const phasesXP = phases.filter(p => phaseComplete(state, weeks, p.id)).length * 1000;
  const projects = projectsDef.filter(p => (state.projects[p.id] || {}).status === 'done').reduce((a, p) => a + projectXP(p), 0);
  const library = Object.values(state.resources).filter(r => r.status === 'done').length * 40
    + state.customResources.filter(r => r.status === 'done').length * 40;
  return { hours, quests, clears, phases: phasesXP, projects, library, total: hours + quests + clears + phasesXP + projects + library };
}

export const RANKS = [
  { xp: 0, name: 'Electron', sym: 'e⁻', blurb: 'A single charge carrier, ready to move.' },
  { xp: 500, name: 'Resistor', sym: 'R', blurb: 'You push back, and you set the current.' },
  { xp: 1500, name: 'Capacitor', sym: 'C', blurb: 'Storing energy for what comes next.' },
  { xp: 3000, name: 'Inductor', sym: 'L', blurb: 'Momentum. Hard to stop once moving.' },
  { xp: 5000, name: 'Diode', sym: 'D', blurb: 'One direction only: forward.' },
  { xp: 7500, name: 'Transistor', sym: 'Q', blurb: 'Small signal in, big signal out.' },
  { xp: 10500, name: 'Op-Amp', sym: 'U', blurb: 'Gain with feedback. Precision.' },
  { xp: 14000, name: 'Logic Gate', sym: '&', blurb: 'Decisions in nanoseconds.' },
  { xp: 18000, name: 'Microcontroller', sym: 'MCU', blurb: 'Sensing, deciding, acting.' },
  { xp: 22500, name: 'FPGA', sym: 'FPGA', blurb: 'Hardware that rewires itself.' },
  { xp: 27500, name: 'Transceiver', sym: 'RF', blurb: 'Fluent in the invisible spectrum.' },
  { xp: 33000, name: 'Robot', sym: 'BOT', blurb: 'Electronics with a body.' },
  { xp: 39000, name: 'Bionic', sym: 'BIO', blurb: 'Circuits that listen to muscle.' },
  { xp: 46000, name: 'Systems Architect', sym: 'SYS', blurb: 'Every layer, one design.' },
  { xp: 54000, name: 'Master Engineer', sym: 'M.Tech+', blurb: 'From B.Tech refresh to beyond M.Tech.' },
];
export function rankFor(xp) {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1].xp) i++;
  const cur = RANKS[i], next = RANKS[i + 1];
  const pct = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1;
  return { index: i, ...cur, next, pct };
}

// ---- Achievements ----
export const ACHIEVEMENTS = [
  { id: 'first-light', name: 'First Light', icon: '💡', desc: 'Log your first study session.', test: s => s.log.length >= 1 },
  { id: 'warm-iron', name: 'Warm Iron', icon: '🔥', desc: 'Log 10 hours in total.', test: s => totalMinutes(s) >= 600 },
  { id: 'century', name: 'Century', icon: '⏱️', desc: 'Log 100 hours in total.', test: s => totalMinutes(s) >= 6000 },
  { id: 'kilohour', name: 'Kilohour', icon: '⚡', desc: 'Log 1,000 hours in total.', test: s => totalMinutes(s) >= 60000 },
  { id: 'steady-clock', name: 'Steady Clock', icon: '🕰️', desc: 'Study 7 days in a row.', test: s => bestStreak(s) >= 7 },
  { id: 'phase-locked', name: 'Phase Locked', icon: '🔒', desc: 'Study 30 days in a row.', test: s => bestStreak(s) >= 30 },
  { id: 'full-charge', name: 'Full Charge', icon: '🔋', desc: 'Hit 20 hours in a single week.', test: (s, W) => W.some(w => minutesBetween(s, w.start, w.end) >= 1200) },
  { id: 'level-up', name: 'Level Up', icon: '⬆️', desc: 'Clear your first level.', test: s => isCleared(s, 1) },
  { id: 'chapter-1', name: 'Bench Awake', icon: '🔬', desc: 'Complete Chapter 1: Reconnection.', test: (s, W) => phaseComplete(s, W, 1) },
  { id: 'chapter-2', name: 'Silicon Whisperer', icon: '🧠', desc: 'Complete Chapter 2: Embedded Systems.', test: (s, W) => phaseComplete(s, W, 2) },
  { id: 'chapter-3', name: 'Wave Catcher', icon: '📡', desc: 'Complete Chapter 3: Signals & Comms.', test: (s, W) => phaseComplete(s, W, 3) },
  { id: 'chapter-4', name: 'It Moves', icon: '🦾', desc: 'Complete Chapter 4: Robotics.', test: (s, W) => phaseComplete(s, W, 4) },
  { id: 'chapter-5', name: 'Body Electric', icon: '💪', desc: 'Complete Chapter 5: Biomechanics.', test: (s, W) => phaseComplete(s, W, 5) },
  { id: 'chapter-6', name: 'The Hand That Thinks', icon: '🖐️', desc: 'Complete the final chapter.', test: (s, W) => phaseComplete(s, W, 6) },
  { id: 'first-boss', name: 'First Build', icon: '🛠️', desc: 'Finish your first project.', test: s => Object.values(s.projects).some(p => p.status === 'done') },
  { id: 'ten-builds', name: 'Ten Builds', icon: '🧰', desc: 'Finish 10 projects.', test: s => Object.values(s.projects).filter(p => p.status === 'done').length >= 10 },
  { id: 'fab-house', name: 'Fab House', icon: '🟩', desc: 'Finish your first custom PCB (project 11).', test: s => (s.projects[11] || {}).status === 'done' },
  { id: 'on-air', name: 'On Air', icon: '📻', desc: 'Finish the APRS tracker (project 15).', test: s => (s.projects[15] || {}).status === 'done' },
  { id: 'bookworm', name: 'Bookworm', icon: '📚', desc: 'Finish 5 books, courses or channels.', test: s => Object.values(s.resources).filter(r => r.status === 'done').length >= 5 },
  { id: 'ahead', name: 'Ahead of the Clock', icon: '🏁', desc: 'Be 2 or more levels ahead of the calendar.', test: (s) => currentLevel(s) - scheduleWeek(s.start) >= 2 },
];

export function newlyEarned(state, weeks) {
  return ACHIEVEMENTS.filter(a => !state.achievements[a.id] && a.test(state, weeks));
}
