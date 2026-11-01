// State + persistence. Progress lives in localStorage on each device and,
// when a GitHub token is configured, in progress/progress.json in the private repo.

const LS_STATE = 'ej.state.v1';
const LS_CONFIG = 'ej.config.v1';
export const DEFAULT_START = '2026-11-01';

export function blankState() {
  return {
    version: 1,
    start: DEFAULT_START,
    updatedAt: null,
    weeks: {},          // n -> { quests: {id:true}, reflection: '', cleared: 'YYYY-MM-DD' }
    projects: {},       // id -> { status, notes, url, started, completed }
    resources: {},      // id -> { status, rating, notes }
    customResources: [],
    log: [],            // { id, date, minutes, topic, category, notes, project }
    achievements: {},   // id -> date unlocked
    seen: { levels: [1], rank: 0, phases: [] },
  };
}

const defaultConfig = {
  owner: 'uxguy-in',
  repo: 'electronics',
  branch: 'main',
  path: 'progress/progress.json',
  token: '',
  motion: 'full',   // full | calm
  sound: true,
};

export function loadConfig() {
  try { return { ...defaultConfig, ...JSON.parse(localStorage.getItem(LS_CONFIG) || '{}') }; }
  catch { return { ...defaultConfig }; }
}
export function saveConfig(cfg) { localStorage.setItem(LS_CONFIG, JSON.stringify(cfg)); }

function normalise(s) {
  const b = blankState();
  const out = { ...b, ...(s || {}) };
  out.seen = { ...b.seen, ...(s && s.seen || {}) };
  for (const k of ['weeks', 'projects', 'resources', 'achievements']) out[k] = out[k] || {};
  for (const k of ['log', 'customResources']) out[k] = Array.isArray(out[k]) ? out[k] : [];
  return out;
}

// ---- base64 helpers that survive UTF-8 ----
function toB64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function fromB64(b64) {
  const bin = atob(b64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

class Store extends EventTarget {
  constructor() {
    super();
    this.config = loadConfig();
    this.sha = null;
    this.status = 'local';      // local | syncing | saved | dirty | error
    this.statusMsg = '';
    this._timer = null;
    let local = null;
    try { local = JSON.parse(localStorage.getItem(LS_STATE) || 'null'); } catch {}
    this.state = normalise(local);
  }

  get remoteEnabled() { return !!(this.config.token && this.config.owner && this.config.repo); }
  get canRead() { return !!(this.config.owner && this.config.repo); }

  _setStatus(s, msg = '') { this.status = s; this.statusMsg = msg; this.dispatchEvent(new Event('status')); }

  _api(path, opts = {}) {
    const { owner, repo, token } = this.config;
    return fetch(`https://api.github.com/repos/${owner}/${repo}/${path}`, {
      ...opts,
      headers: {
        Accept: 'application/vnd.github+json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'X-GitHub-Api-Version': '2022-11-28',
        ...(opts.headers || {}),
      },
      cache: 'no-store',
    });
  }

  async pull() {
    if (!this.canRead) { this._setStatus('local'); return; }
    this._setStatus('syncing', 'Reading from GitHub');
    try {
      const { path, branch, owner, repo } = this.config;
      if (!this.remoteEnabled) {
        // read-only: raw file, no API rate limit
        const raw = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}?t=${Date.now()}`, { cache: 'no-store' });
        if (!raw.ok) { this._setStatus('local', 'No progress file on GitHub yet'); return; }
        const remote = normalise(await raw.json());
        if ((remote.updatedAt || '') >= (this.state.updatedAt || '')) {
          this.state = remote;
          localStorage.setItem(LS_STATE, JSON.stringify(this.state));
          this.dispatchEvent(new Event('change'));
        }
        this._setStatus('readonly', 'Viewing progress from GitHub. Add your token in Setup to save from this device.');
        return;
      }
      const r = await this._api(`contents/${path}?ref=${encodeURIComponent(branch)}`);
      if (r.status === 404) {
        this.sha = null;
        if (this.remoteEnabled) await this.push(); else this._setStatus('local', 'No progress file on GitHub yet');
        return;
      }
      if (!r.ok) throw new Error(`GitHub said ${r.status}`);
      const j = await r.json();
      this.sha = j.sha;
      const remote = normalise(JSON.parse(fromB64(j.content)));
      const lt = this.state.updatedAt || '', rt = remote.updatedAt || '';
      if (rt >= lt) {
        this.state = remote;
        localStorage.setItem(LS_STATE, JSON.stringify(this.state));
        this.dispatchEvent(new Event('change'));
        this._setStatus(this.remoteEnabled ? 'saved' : 'readonly', this.remoteEnabled ? 'In sync with GitHub' : 'Viewing progress from GitHub (read-only on this device)');
      } else if (this.remoteEnabled) {
        await this.push(); // local edits made offline are newer
      } else {
        this._setStatus('local', 'This device has newer local changes. Add your token to save them.');
      }
    } catch (e) {
      this._setStatus('error', e.message || 'Could not reach GitHub');
    }
  }

  async push(retry = true) {
    if (!this.remoteEnabled) return;
    this._setStatus('syncing', 'Saving to GitHub');
    const { path, branch } = this.config;
    const body = {
      message: `progress: ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
      content: toB64(JSON.stringify(this.state, null, 1)),
      branch,
    };
    if (this.sha) body.sha = this.sha;
    try {
      const r = await this._api(`contents/${path}`, { method: 'PUT', body: JSON.stringify(body) });
      if ((r.status === 409 || r.status === 422) && retry) {
        // someone (another device) wrote in between: refresh sha and write again
        const g = await this._api(`contents/${path}?ref=${encodeURIComponent(branch)}`);
        this.sha = g.ok ? (await g.json()).sha : null;
        return this.push(false);
      }
      if (!r.ok) throw new Error(`GitHub said ${r.status}`);
      const j = await r.json();
      this.sha = j.content.sha;
      this._setStatus('saved', 'Saved to GitHub');
    } catch (e) {
      this._setStatus('error', e.message || 'Could not save to GitHub');
    }
  }

  // Mutate state through this so everything persists.
  update(fn, { silent = false } = {}) {
    fn(this.state);
    this.state.updatedAt = new Date().toISOString();
    localStorage.setItem(LS_STATE, JSON.stringify(this.state));
    if (!silent) this.dispatchEvent(new Event('change'));
    if (this.remoteEnabled) {
      this._setStatus('dirty', 'Unsaved changes');
      clearTimeout(this._timer);
      this._timer = setTimeout(() => this.push(), 2000);
    }
  }

  replaceState(s) {
    this.state = normalise(s);
    this.update(() => {});
  }

  setConfig(patch) {
    this.config = { ...this.config, ...patch };
    saveConfig(this.config);
  }
}

export const store = new Store();
