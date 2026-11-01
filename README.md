# Back to Electronics ⚡

A two-year, gamified journey from a 20-year-old ECE degree back to B.Tech level, then M.Tech and beyond.
6 chapters · 102 weekly levels · 30 real builds · started **1 November 2026**, finishing **31 October 2028**.

**Live site:** https://uxguy-in.github.io/electronics/

## How it plays

- **The board** is a PCB. Each pad is one week (a level); each chip is a chapter of the story.
- **Clear a level** by finishing its quests (theory, bench work and a logbook reflection). Current flows down the trace and the next level powers on with its own animated scene.
- **Builds** are the boss levels: 30 hands-on projects, from an RLC filter to a thinking prosthetic hand.
- **XP and ranks**: 10 XP per logged hour, 25 per quest, 150 per level, 1000 per chapter, 300–2000 per build. Ranks climb from Electron to Master Engineer.
- **Achievements** for streaks, hours, chapters and milestone builds.

## Where progress lives

Progress is saved in your browser and, once connected, committed to [`progress/progress.json`](progress/progress.json) in this repo.
To connect a device: open the site → **Setup** → paste a fine-grained GitHub token with **Contents: Read and write** on this repo only.
The token stays in that browser's local storage and is never committed. Without a token, the site shows your saved progress read-only.

## Structure

```
docs/                 GitHub Pages site (no build step)
  index.html
  css/style.css
  js/curriculum.js    phases, weekly topics, 30 builds, library (from the original plan)
  js/game.js          levels, quests, XP, ranks, achievements
  js/scenes.js        26 animated weekly scenes (oscilloscope, Fourier, Lidar, EMG…)
  js/fx.js            circuit background, power-on cinematics, sound
  js/store.js         localStorage + GitHub sync
  js/app.js           views
progress/progress.json   your progress (written by the site)
```

Run locally: `cd docs && python3 -m http.server` then open http://localhost:8000.
