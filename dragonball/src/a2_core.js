
<div id="app">
  <header id="topbar"></header>
  <main id="view"></main>
  <nav id="tabs"></nav>
</div>
<div id="battle" hidden></div>
<div id="dlg" hidden></div>
<div id="gacha" hidden></div>
<div id="modal" hidden></div>
<div id="toast"></div>
<script>
"use strict";
/* =====================================================================
   DRAGON BALL Z: LEGEND OF THE Z FIGHTERS — an unofficial, non-commercial fan game that plays like the Game Boy's
   Dragon Ball Z: Goku Gekitōden (1995): side-scrolling fields, planned command turns fought out in real time with a
   power gauge, timed guards and a ki gauge. The story runs from Raditz's arrival to Super Saiyan Goku against Frieza.
   Dragon Ball belongs to Akira Toriyama, Bird Studio, Shueisha, Toei Animation and Bandai Namco. Every fighter,
   background and effect here is drawn procedurally on canvas; no official assets are used.
   ===================================================================== */

// ---------- utils ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const R = Math.random;
const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
const pick = a => a[Math.floor(R() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M" : n >= 1e4 ? (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + "K" : Math.round(n).toLocaleString("en-US");
const fmtFull = n => Math.round(n).toLocaleString("en-US");
const pct = v => Math.round(v * 100) + "%";
function seeded(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const dur = ms => { const m = Math.floor(ms / 60000), s = Math.floor(ms % 60000 / 1000); if (m >= 60) return Math.floor(m / 60) + "h " + (m % 60) + "m"; return m + ":" + String(s).padStart(2, "0"); };
// the demo (a9d_demo.js) plays in a sandbox and moves the calendar forward a day at a time
let DAY_SHIFT = 0;
const DEMO = { on: false };
const today = () => new Date(Date.now() + DAY_SHIFT * 864e5).toISOString().slice(0, 10);

// ---------- fighting styles + rarity ----------
// Every fighter has one of four fighting styles. Internally the style lives in the `el` field (it drives matchups,
// colours and badges, like an element) and also picks the base stats (`cls`).
//  Striker beats Blaster (it closes the gap before the blasts land), Blaster beats Defender (ki goes straight through a
//  guard), Defender beats Striker (a solid guard shrugs off punches). Tactician has no weakness and no edge.
const ELS = ["Striker", "Blaster", "Defender", "Tactician"];
const ELC = { Striker: "#ff6a3a", Blaster: "#4ab0ff", Defender: "#43d67e", Tactician: "#c08bff" };
const BEATS = { Striker: "Blaster", Blaster: "Defender", Defender: "Striker" };
const elName = el => el;
const elShort = el => el === "Tactician" ? "Tactic." : el;
function elementRel(a, t) { if (BEATS[a] === t) return "adv"; if (BEATS[t] === a) return "dis"; return "neu"; }
const weakTo = el => Object.keys(BEATS).find(k => BEATS[k] === el);
// each style's built-in edge in battle
const TYPE_TRAIT = {
  Striker: { n: "Rush Master", d: "Melee attacks deal 12% more damage, and it closes the distance twice as fast." },
  Blaster: { n: "Ki Control", d: "Ki attacks deal 12% more damage and cost 15% less ki." },
  Defender: { n: "Iron Guard", d: "Takes 10% less damage. Its guard gauge drains half as fast, and its perfect-guard window is wider." },
  Tactician: { n: "Battle Sense", d: "Recovers ki 50% faster, and its techniques cost 15% less ki." },
};
const STRIKE_UP = .12, KI_UP = .12, KI_THRIFT = .15, DEF_GUARD = .1, TAC_REGEN = 1.5, TAC_THRIFT = .15;
// sagas of the anime: each fighter version comes from one of them
const SEASONS = { 0: "Legend", 1: "Saiyan Saga", 2: "Frieza Saga" };
const RC = { 1: "#c9d1de", 2: "#7fdc8a", 3: "#8fd8ff", 4: "#c39bff", 5: "#f1d07a", 6: "#ff9a3c" };
const CLASSES = ELS;
const clsName = c => c;

// ---------- icons ----------
// a Dragon Ball with n stars (used by the summon screens and the icons)
function dballSVG(n = 4, size = 24) {
  const pts = { 1: [[12, 12]], 2: [[9.5, 10], [14.5, 14]], 3: [[12, 8.6], [9, 14], [15, 14]], 4: [[9.4, 9.4], [14.6, 9.4], [9.4, 14.6], [14.6, 14.6]],
    5: [[12, 8], [8.4, 11], [15.6, 11], [9.6, 15.4], [14.4, 15.4]], 6: [[12, 7.6], [8.6, 10.4], [15.4, 10.4], [8.6, 14.2], [15.4, 14.2], [12, 16.8]],
    7: [[12, 12], [12, 7.4], [8.2, 9.6], [15.8, 9.6], [8.2, 14.4], [15.8, 14.4], [12, 16.6]] }[n] || [[12, 12]];
  const star = (x, y) => { const r = n > 4 ? 1.55 : 1.9; let d = ""; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * .45 : r; d += (k ? "L" : "M") + (x + Math.cos(a) * rr).toFixed(2) + " " + (y + Math.sin(a) * rr).toFixed(2); } return `<path d="${d}z" fill="#d8202a"/>`; };
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><defs><radialGradient id="dbg${n}" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#fff2c0"/><stop offset=".25" stop-color="#ffb02a"/><stop offset="1" stop-color="#c85a08"/></radialGradient></defs><circle cx="12" cy="12" r="10.5" fill="url(#dbg${n})"/>${pts.map(p => star(p[0], p[1])).join("")}<ellipse cx="8.5" cy="7" rx="3" ry="1.8" fill="#fff" opacity=".55" transform="rotate(-30 8.5 7)"/></svg>`;
}
const IC = {
  sanity: '<svg viewBox="0 0 24 24"><path fill="#ff9a1a" d="M13 2 5 13h6l-2 9 9-12h-6z"/><path fill="#fff1c0" d="M12 4 7 12h4z" opacity=".7"/></svg>',
  lmd: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="#e8c04a"/><circle cx="12" cy="12" r="7" fill="#f6d86a" stroke="#8a6410" stroke-width="1.2"/><path d="M8.6 8h6.8l-6.8 8h6.8M7.5 11h9M7.5 13h9" stroke="#5a3e08" stroke-width="1.7" fill="none" stroke-linejoin="round"/></svg>',
  orundum: '<svg viewBox="0 0 24 24"><path fill="#ff3a6a" d="M12 2 20 9l-8 13L4 9z"/><path fill="#ff9ab8" d="M12 2 4 9h16z"/><path fill="#c8104a" d="M12 22 4 9h8z" opacity=".55"/><path fill="#fff" d="M9 6.5 12 4l2 2.5z" opacity=".75"/></svg>',
  permit: '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" fill="#ff8a1a"/><path d="M7 5v14" stroke="#fff3d8" stroke-dasharray="1.6 1.6"/><circle cx="14.5" cy="12" r="5" fill="#ffb02a" stroke="#c85a08"/><path fill="#d8202a" d="m14.5 9.2.9 1.9 2 .2-1.5 1.3.5 2-1.9-1.1-1.9 1.1.5-2-1.5-1.3 2-.2z"/></svg>',
  cert: '<svg viewBox="0 0 24 24"><path fill="#2f6fd8" d="M7 2h4l1 6-3 1zM17 2h-4l-1 6 3 1z"/><circle cx="12" cy="15" r="7" fill="#f2c14e" stroke="#8a6410" stroke-width="1.2"/><path d="M9.4 12h5.2l-5.2 6h5.2" stroke="#5a3e08" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>',
  rec1: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="1.5" fill="#c8302a"/><path d="M3 10h18M3 14h18" stroke="#8a1a14" stroke-width="1.2"/><rect x="5" y="2.5" width="3" height="5" rx="1" fill="#f2f2f6"/><rect x="10.5" y="2.5" width="3" height="5" rx="1" fill="#f2f2f6"/><rect x="16" y="2.5" width="3" height="5" rx="1" fill="#f2f2f6"/></svg>',
  rec2: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="13" rx="9" ry="8" fill="#3a8a3a"/><path d="M12 5v16M5 9l14 8M19 9 5 17" stroke="#1e5a20" stroke-width="1.4"/><ellipse cx="12" cy="13" rx="9" ry="8" fill="none" stroke="#c8a04a" stroke-width="2"/><path d="M8 4h8" stroke="#c8a04a" stroke-width="2"/></svg>',
  rec3: '<svg viewBox="0 0 24 24"><path fill="#f2f2f6" d="M4 6 9 3h6l5 3-2 5H6z"/><path fill="#5a3ea8" d="M6 11h12l1 10H5z"/><path d="M9 3c1 2 5 2 6 0" stroke="#9aa4b8" fill="none"/><rect x="6" y="14" width="12" height="2" fill="#2a1a6a"/></svg>',
  rec4: '<svg viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="5" fill="#e8ecf4"/><rect x="7" y="11" width="10" height="11" rx="5" fill="#2f6fd8"/><rect x="6.5" y="10" width="11" height="2.4" fill="#9aa4b8"/><text x="12" y="19" text-anchor="middle" font-size="5" font-weight="800" fill="#fff" font-family="Arial">100G</text></svg>',
  chip: '<svg viewBox="0 0 24 24"><defs><linearGradient id="rzo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5a6a"/><stop offset=".33" stop-color="#ffd34d"/><stop offset=".66" stop-color="#43d67e"/><stop offset="1" stop-color="#4ab0ff"/></linearGradient></defs><circle cx="12" cy="12" r="9" fill="url(#rzo)"/><circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-opacity=".5"/><path d="M9 9h6l-6 6h6" stroke="#fff" stroke-width="1.8" fill="none"/></svg>',
  summ: '<svg viewBox="0 0 24 24"><circle cx="8" cy="14" r="5.5" fill="#2f8aff"/><circle cx="16" cy="14" r="5.5" fill="#43d67e"/><circle cx="12" cy="8" r="5.5" fill="#ff4a5a"/><path d="M10.4 6.4h3.2l-3.2 3.2h3.2" stroke="#fff" stroke-width="1.2" fill="none"/></svg>',
  tokens: '<svg viewBox="0 0 24 24"><path fill="#2a2a30" d="M3 9h5v6H3z"/><path fill="#43d67e" d="M8 6h12l-2 12H8z" opacity=".9"/><path d="M10 9h6M10 12h4" stroke="#d8ffe4" stroke-width="1.2"/><circle cx="18" cy="9" r="1.2" fill="#ff3a3a"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path fill="#f2c14e" stroke="#7a5310" stroke-width="1" d="m12 2 3 7 7 .6-5.4 4.6 1.7 7.3L12 17.6l-6.3 3.9 1.7-7.3L2 9.6 9 9z"/></svg>',
  starOff: '<svg viewBox="0 0 24 24"><path fill="#1a2238" stroke="#3a4766" stroke-width="1" d="m12 2 3 7 7 .6-5.4 4.6 1.7 7.3L12 17.6l-6.3 3.9 1.7-7.3L2 9.6 9 9z"/></svg>',
  crown: '<svg viewBox="0 0 20 14"><path fill="#f2c14e" stroke="#5b3e08" d="M1 13 2 3l5 5 3-7 3 7 5-5 1 10z"/></svg>',
  sword: '<svg viewBox="0 0 24 24"><path fill="#ffd8b8" d="M6 9a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v5a5 5 0 0 1-5 5h-3a5 5 0 0 1-5-5z"/><path d="M9 6v6M12.5 6v6M16 6v6" stroke="#b8805a" stroke-width="1.4"/><path d="M6 12h6" stroke="#b8805a" stroke-width="1.4"/><path d="M3 4 5 6M20 3l-2 2M12 1v2" stroke="#ffd34d" stroke-width="1.6"/></svg>',
  heal: '<svg viewBox="0 0 24 24"><path fill="#43d67e" d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path fill="#5fd4ff" d="M12 2 20 5v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" opacity=".85"/><path fill="#04121f" d="M12 6 16 8v3c0 3-1.8 5.5-4 6.6z"/></svg>',
  boost: '<svg viewBox="0 0 24 24"><path fill="#ffb02a" d="M12 2 19 10h-4v5H9v-5H5zM6 17h12v2H6zm0 3h12v2H6z"/></svg>',
  skull: '<svg viewBox="0 0 24 24"><path fill="#e8edf7" d="M12 2c5 0 8 3.5 8 8 0 3-1.5 4.5-3 5.5V19h-3v-2h-1v2h-2v-2h-1v2H7v-3.5C5.5 14.5 4 13 4 10c0-4.5 3-8 8-8z"/><circle cx="9" cy="10" r="2" fill="#120818"/><circle cx="15" cy="10" r="2" fill="#120818"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path fill="#ff9a3c" d="M4 4h7v16H5a1 1 0 0 1-1-1z"/><path fill="#ffd8a8" d="M13 4h7v15a1 1 0 0 1-1 1h-6z"/></svg>',
  chest: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="7" fill="#f2f2f6"/><rect x="4" y="12" width="16" height="7" rx="3.5" fill="#ffd34d"/><rect x="3.4" y="11" width="17.2" height="2.2" fill="#9aa4b8"/><text x="12" y="10" text-anchor="middle" font-size="4.2" font-weight="900" fill="#2f6fd8" font-family="Arial">CC</text></svg>',
  tower: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 20h18M5 20V11h14v9M8 11V7h8v4M10 7V4h4v3"/><path d="M9 15h6"/></svg>',
  arena: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9h5v6H3z"/><path d="M8 6h12l-2 12H8z"/><path d="M11 10h5M11 13h3"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 6 0 0 1 18 0v7H3z"/><path d="M10 19v-4h4v4M7 9V6M17 9V6"/></svg>',
  story: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6c3-2 6-2 9 0 3-2 6-2 9 0v13c-3-2-6-2-9 0-3-2-6-2-9 0z"/><path d="M12 6v13"/></svg>',
  battles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 10a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z"/><path d="M9 8v4M12 8v4M15 8v4M6 12h5M4 4l2 2M20 4l-2 2M12 2v2"/></svg>',
  ops: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="6" r="3"/><path d="M5 21v-5a7 5 0 0 1 14 0v5M9 4 7 1M15 4l2-3M12 3V0"/></svg>',
  hunt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="8"/><path d="M4 13h16M12 5c3 3 3 13 0 16M12 5c-3 3-3 13 0 16"/></svg>',
  missions: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="m8 9 2 2 4-4M8 15h8"/></svg>',
  shop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="2" width="10" height="20" rx="5"/><path d="M7 12h10"/><path d="M10 7h4"/></svg>',
  depot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8 12 3l9 5v9l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v9"/></svg>',
  gearIc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 4 7 12l8 8"/></svg>',
  prime: '<svg viewBox="0 0 24 24"><path fill="#4ac84a" d="M7 6c3-4 10-3 11 2 1 4-2 9-6 11-4 1-8-2-7-6 0-3 1-5 2-7z"/><path d="M9 8c2-2 6-2 7 1" stroke="#c8ffb8" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M8 15c2 2 5 2 7 0" stroke="#2a7a2a" stroke-width="1.2" fill="none"/></svg>',
  credit: '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="10" rx="5" fill="#f2f2f6"/><rect x="12" y="7" width="9" height="10" rx="0" fill="#ffd34d"/><path d="M16 7h1a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4h-1z" fill="#ffd34d"/><rect x="11.2" y="6.4" width="1.6" height="11.2" fill="#9aa4b8"/><text x="7.5" y="13.6" text-anchor="middle" font-size="4.4" font-weight="900" fill="#2f6fd8" font-family="Arial">CC</text></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9 18h6"/></svg>',
  gift: '<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="12" rx="1.5" fill="#ff8a1a"/><rect x="2" y="7" width="20" height="4" rx="1" fill="#ffb02a"/><path d="M12 7v14" stroke="#2f6fd8" stroke-width="2.4"/><path d="M12 7c-2-4-6-4-6-1s4 1 6 1c2 0 6 2 6-1s-4-3-6 1z" fill="none" stroke="#2f6fd8" stroke-width="1.6"/></svg>',
  free10: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" fill="#2f6fd8"/><path fill="#ff8a1a" d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3H2z"/><text x="12" y="17.5" text-anchor="middle" font-size="8" font-weight="900" fill="#fff" font-family="Arial">×10</text></svg>',
  gold5: '<svg viewBox="0 0 24 24"><path d="M3 20c2-6 4-4 6-8s4-8 8-8c3 0 4 2 4 4" stroke="#43c84a" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="19" cy="6" r="2.6" fill="#43c84a"/><circle cx="19.6" cy="5.4" r=".9" fill="#ff3a3a"/><circle cx="7" cy="18" r="3" fill="#ffb02a"/><circle cx="13" cy="16" r="2.4" fill="#ffb02a"/><circle cx="16.5" cy="12" r="2" fill="#ffb02a"/></svg>',
  launcher: dballSVG(4),
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="#43d67e" stroke-width="3"><path d="m5 12 5 5 9-10"/></svg>',
  cross: '<svg viewBox="0 0 24 24" fill="none" stroke="#5b6886" stroke-width="3"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  trM: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2" fill="#f2e6c8"/><rect x="4" y="3" width="16" height="4" fill="#ff6a3a"/><rect x="4" y="17" width="16" height="4" fill="#ff6a3a"/><path d="M9 10h6v3a3 3 0 0 1-3 3 3 3 0 0 1-3-3z" fill="#c8502a"/></svg>',
  trK: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2" fill="#f2e6c8"/><rect x="4" y="3" width="16" height="4" fill="#4ab0ff"/><rect x="4" y="17" width="16" height="4" fill="#4ab0ff"/><circle cx="12" cy="12" r="3.4" fill="#2f8aff"/><circle cx="12" cy="12" r="1.6" fill="#d8f0ff"/></svg>',
  trG: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2" fill="#f2e6c8"/><rect x="4" y="3" width="16" height="4" fill="#43d67e"/><rect x="4" y="17" width="16" height="4" fill="#43d67e"/><path d="M8 9l8 6M16 9l-8 6" stroke="#2a8a4a" stroke-width="2.4" stroke-linecap="round"/></svg>',
  dball: dballSVG(4),
};
const ITEMS = {
  lmd: { n: "Zeni", ic: IC.lmd },
  orundum: { n: "Dragon Stone", ic: IC.orundum, d: "Rare crystals. 600 make one Summon." },
  permit: { n: "Summon Ticket", ic: IC.permit, d: "Pays for one Summon." },
  cert: { n: "Z Medal", ic: IC.cert, d: "Left over when a Summon brings a fighter you already have. Spent at the Z Medal counter." },
  tokens: { n: "Ranking Point", ic: IC.tokens, d: "Earned in Scouter Rankings battles." },
  prime: { n: "Senzu Bean", ic: IC.prime, d: "One bean and you're back to full strength: restores all your Stamina, or trades for 180 Dragon Stones." },
  credit: { n: "Capsule Point", ic: IC.credit, d: "Spent at the Capsule Corp. shop." },
  sanity: { n: "Stamina", ic: IC.sanity },
  rec1: { n: "Milk Crate", ic: IC.rec1, xp: 200, d: "Master Roshi's milk-delivery run. Training EXP." },
  rec2: { n: "Turtle Shell", ic: IC.rec2, xp: 400, d: "Train with 20 kg on your back. Training EXP." },
  rec3: { n: "Weighted Clothing", ic: IC.rec3, xp: 1000, d: "Piccolo's heavy cape and turban. Training EXP." },
  rec4: { n: "Gravity Capsule", ic: IC.rec4, xp: 2000, d: "An hour in Capsule Corp.'s 100× gravity chamber. Training EXP." },
  chip: { n: "Rainbow Z Orb", ic: IC.chip, d: "A rare orb of pure fighting spirit. Used for a Zenkai Awakening." },
  summ: { n: "Z Orbs", ic: IC.summ, d: "Fighting spirit made solid. Used to raise a technique's level." },
  free10: { n: "Free Summon ×10", ic: IC.free10, d: "Ten free Summons. Use them on the Summon screen." },
  gold5: { n: "Shenron's Wish", ic: IC.gold5, d: "The Eternal Dragon grants one wish: a random 5★ fighter." },
  trM: { n: "Melee Scroll", ic: IC.trM, prof: "m", d: "Martial arts notes. Raises a fighter's Melee proficiency." },
  trK: { n: "Ki Scroll", ic: IC.trK, prof: "k", d: "Ki control exercises. Raises a fighter's Ki proficiency." },
  trG: { n: "Guard Scroll", ic: IC.trG, prof: "g", d: "Defensive drills. Raises a fighter's Guard proficiency." },
};

// ---------- status effects (battle terms) ----------
// lengths are in turns; a turn is one plan and its action phase
const FX = {
  ATK_UP:   { n: "Power Up", b: 1, s: "A↑", d: "+30% damage" },
  DEF_UP:   { n: "Iron Body", b: 1, s: "D↑", d: "Takes 30% less damage" },
  SPD_UP:   { n: "Afterimage", b: 1, s: "S↑", d: "Acts 25% faster" },
  KAIOKEN:  { n: "Kaioken", b: 1, s: "KK", d: "+40% damage and acts 25% faster, but can't guard" },
  BARRIER:  { n: "Ki Barrier", b: 1, s: "BR", d: "Absorbs damage before HP" },
  REGEN:    { n: "Regeneration", b: 1, s: "RG", d: "Recovers 6% max HP at the start of each turn" },
  RAGE:     { n: "Hidden Power", b: 1, s: "HP", d: "+50% damage" },
  ATK_DOWN: { n: "Weakened", b: 0, s: "A↓", d: "-30% damage" },
  DEF_DOWN: { n: "Guard Crush", b: 0, s: "D↓", d: "Takes 30% more damage; guarding drains twice as fast" },
  BLIND:    { n: "Blinded", b: 0, s: "BL", d: "Can't see: can't act, guard or vanish" },
  FREEZE:   { n: "Frozen", b: 0, s: "FZ", d: "Held in place: can't act, guard or vanish" },
  SLOW:     { n: "Slowed", b: 0, s: "SL", d: "Acts 30% slower" },
};
// a party is three fighters: one fights, the other two wait to switch in
const TEAM_SIZE = 3;
// technique levels 1–7 (7 is MAX)
const RANK = ["", "1", "2", "3", "4", "5", "6", "MAX"];
