
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
   ARKNIGHTS TACTICS (mobile) — an unofficial, non-commercial fan game.
   Arknights characters and art belong to Hypergryph / Yostar.
   ===================================================================== */
const ASSET = window.AT_ASSET_BASE || "../assets/";

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
const today = () => new Date().toISOString().slice(0, 10);

// ---------- elements + rarity ----------
const ELS = ["Fire", "Water", "Wind", "Light", "Dark"];
const ELC = { Fire: "#ff6a3d", Water: "#4aa3ff", Wind: "#59e08a", Light: "#ffd76b", Dark: "#b98aff" };
const BEATS = { Fire: "Wind", Wind: "Water", Water: "Fire", Light: "Dark", Dark: "Light" };
function elementRel(a, t) { if (BEATS[a] === t) return "adv"; if (BEATS[t] === a && !(a === "Light" || a === "Dark")) return "dis"; return "neu"; }
const RC = { 1: "#c9d1de", 2: "#7fdc8a", 3: "#4aa3ff", 4: "#c08bff", 5: "#f2c14e", 6: "#ff9a3c" };
const CLASSES = ["Vanguard", "Guard", "Defender", "Sniper", "Caster", "Medic", "Supporter", "Specialist"];

// ---------- icons ----------
const IC = {
  sanity: '<svg viewBox="0 0 24 24"><path fill="#5fd4ff" d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>',
  lmd: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#c9a24a"/><circle cx="12" cy="12" r="6" fill="none" stroke="#7a5b17" stroke-width="2"/><text x="12" y="15.5" text-anchor="middle" font-size="8" font-weight="800" fill="#3d2c06" font-family="Arial">L</text></svg>',
  orundum: '<svg viewBox="0 0 24 24"><path fill="#ff4f6e" d="M12 2 20 9l-8 13L4 9z"/><path fill="#ffb3c2" d="M12 2 8 9h8z"/><path fill="#b8203d" d="M12 22 16 9h4z"/></svg>',
  permit: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" fill="#f2c14e"/><path d="M8 6v12" stroke="#7a5310" stroke-dasharray="2 2"/><path fill="#7a5310" d="m15 9 1 2 2 .2-1.5 1.3.5 2-2-1.2-2 1.2.5-2L12 11.2l2-.2z"/></svg>',
  cert: '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2" fill="#f2c14e"/><circle cx="12" cy="10" r="4" fill="#7a5310"/><path d="M9 21v-5l3 2 3-2v5" fill="#c8932a"/></svg>',
  rec1: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" fill="#6b7a99"/><circle cx="12" cy="12" r="4" fill="#cfe3ff"/></svg>',
  rec2: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" fill="#3f9e66"/><circle cx="12" cy="12" r="4" fill="#d6ffe4"/></svg>',
  rec3: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" fill="#3f7ad8"/><circle cx="12" cy="12" r="4" fill="#d6e8ff"/></svg>',
  rec4: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" fill="#a05ae0"/><circle cx="12" cy="12" r="4" fill="#f2deff"/></svg>',
  chip: '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" fill="#2a3f6b" stroke="#5fd4ff"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" stroke="#5fd4ff" stroke-width="1.5"/><rect x="9" y="9" width="6" height="6" fill="#5fd4ff"/></svg>',
  summ: '<svg viewBox="0 0 24 24"><path fill="#c08bff" d="M5 3h12a2 2 0 0 1 2 2v16H7a2 2 0 0 1-2-2z"/><path d="M8 7h8M8 11h8M8 15h5" stroke="#2c1247" stroke-width="2"/></svg>',
  tokens: '<svg viewBox="0 0 24 24"><path fill="#e0a43a" d="M12 2 21 7v10l-9 5-9-5V7z"/><path fill="#4a2d05" d="M8 9h8v2h-3v6h-2v-6H8z"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path fill="#f2c14e" stroke="#7a5310" stroke-width="1" d="m12 2 3 7 7 .6-5.4 4.6 1.7 7.3L12 17.6l-6.3 3.9 1.7-7.3L2 9.6 9 9z"/></svg>',
  starOff: '<svg viewBox="0 0 24 24"><path fill="#1a2238" stroke="#3a4766" stroke-width="1" d="m12 2 3 7 7 .6-5.4 4.6 1.7 7.3L12 17.6l-6.3 3.9 1.7-7.3L2 9.6 9 9z"/></svg>',
  crown: '<svg viewBox="0 0 20 14"><path fill="#f2c14e" stroke="#5b3e08" d="M1 13 2 3l5 5 3-7 3 7 5-5 1 10z"/></svg>',
  sword: '<svg viewBox="0 0 24 24"><path d="M4 20 17 7" stroke="#e8edf7" stroke-width="3" stroke-linecap="round"/><path d="M17 7l3-3" stroke="#fff" stroke-width="2"/><path d="M3 15l6 6M5 19l-2 2" stroke="#c9a24a" stroke-width="2.5" stroke-linecap="round"/></svg>',
  bow: '<svg viewBox="0 0 24 24"><path d="M6 3c8 3 12 7 15 15" stroke="#c9a24a" stroke-width="2.4" fill="none"/><path d="M6 3 21 18" stroke="#e8edf7" stroke-width="1"/><path d="M3 21 15 9" stroke="#e8edf7" stroke-width="2"/><path d="M15 9l2-4 2 2z" fill="#fff"/></svg>',
  orb: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="#7a5ad8"/><circle cx="10" cy="10" r="3" fill="#d8c8ff"/><path d="M3 12h3M18 12h3M12 3v3M12 18v3" stroke="#b9a6ff" stroke-width="2"/></svg>',
  heal: '<svg viewBox="0 0 24 24"><path fill="#43d67e" d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path fill="#5fd4ff" d="M12 2 20 5v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" opacity=".85"/><path fill="#04121f" d="M12 6 16 8v3c0 3-1.8 5.5-4 6.6z"/></svg>',
  boost: '<svg viewBox="0 0 24 24"><path fill="#f2c14e" d="M12 2 19 10h-4v5H9v-5H5zM6 17h12v2H6zm0 3h12v2H6z"/></svg>',
  skull: '<svg viewBox="0 0 24 24"><path fill="#e8edf7" d="M12 2c5 0 8 3.5 8 8 0 3-1.5 4.5-3 5.5V19h-3v-2h-1v2h-2v-2h-1v2H7v-3.5C5.5 14.5 4 13 4 10c0-4.5 3-8 8-8z"/><circle cx="9" cy="10" r="2" fill="#05080f"/><circle cx="15" cy="10" r="2" fill="#05080f"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path fill="#5fd4ff" d="M4 4h7v16H5a1 1 0 0 1-1-1z"/><path fill="#9fe0ff" d="M13 4h7v15a1 1 0 0 1-1 1h-6z"/></svg>',
  chest: '<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="11" rx="1" fill="#8a5a2a"/><path fill="#b07a3a" d="M3 9a9 5 0 0 1 18 0z"/><rect x="10" y="11" width="4" height="4" fill="#f2c14e"/></svg>',
  claw: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 20c3-6 3-11 1-16M10 20c2-6 2-11 1-16M15 20c1-6 1-11 2-16M19 20c0-5 1-9 3-12"/></svg>',
  tower: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 21V8l5-5 5 5v13M4 21h16M10 21v-5h4v5M10 10h4"/></svg>',
  arena: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11 12 3l9 8v10h-6v-6H9v6H3z"/></svg>',
  story: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6c3-2 6-2 9 0 3-2 6-2 9 0v13c-3-2-6-2-9 0-3-2-6-2-9 0z"/><path d="M12 6v13"/></svg>',
  battles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20 15 9M15 9l2-5 3 3-5 2M20 20 9 9M9 9 7 4 4 7l5 2"/></svg>',
  ops: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.5"/><path d="M2 20c1-4 4-6 7-6s6 2 7 6"/><circle cx="17" cy="7" r="2.5"/><path d="M17 12c2.5 0 4.5 2 5 5"/></svg>',
  hunt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3 21 8v8l-9 5-9-5V8z"/><path d="M12 8v8M8 10l8 4M16 10l-8 4"/></svg>',
  missions: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="m8 9 2 2 4-4M8 15h8"/></svg>',
  shop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h16l-1 12H5z"/><path d="M8 8a4 4 0 0 1 8 0"/></svg>',
  depot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8 12 3l9 5v9l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v9"/></svg>',
  gearIc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 4 7 12l8 8"/></svg>',
  rune: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="#5fd4ff"/><rect x="6" y="8" width="7" height="8" rx="1" fill="#04121f"/><path d="M15 9h3M15 12h3M15 15h2M9.5 8v8" stroke="#04121f" stroke-width="1.6"/></svg>',
  prime: '<svg viewBox="0 0 24 24"><path fill="#ff7a2a" d="M9 2h6l3 6-6 14L6 8z"/><path fill="#ffd0a8" d="M9 2h6l-3 6z"/><path fill="#b8401a" d="M12 22 18 8h-6z"/></svg>',
  credit: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#3fb3a0"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#0f4a40" stroke-width="1.6"/><path d="M14.5 9.5a3.2 3.2 0 1 0 0 5" stroke="#0f4a40" stroke-width="2" fill="none"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="#43d67e" stroke-width="3"><path d="m5 12 5 5 9-10"/></svg>',
  cross: '<svg viewBox="0 0 24 24" fill="none" stroke="#5b6886" stroke-width="3"><path d="M6 6l12 12M18 6 6 18"/></svg>',
};
const ITEMS = {
  lmd: { n: "LMD", ic: IC.lmd },
  orundum: { n: "Orundum", ic: IC.orundum },
  permit: { n: "Headhunting Permit", ic: IC.permit },
  cert: { n: "Distinction Certificate", ic: IC.cert },
  tokens: { n: "Contract Bounty", ic: IC.tokens },
  prime: { n: "Originite Prime", ic: IC.prime, d: "Restores Sanity, or converts to 180 Orundum." },
  credit: { n: "Credits", ic: IC.credit, d: "Spent in the Credit Store." },
  sanity: { n: "Sanity", ic: IC.sanity },
  rec1: { n: "Drill Battle Record", ic: IC.rec1, xp: 200 },
  rec2: { n: "Frontline Battle Record", ic: IC.rec2, xp: 400 },
  rec3: { n: "Tactical Battle Record", ic: IC.rec3, xp: 1000 },
  rec4: { n: "Strategic Battle Record", ic: IC.rec4, xp: 2000 },
  chip: { n: "Chip Pack", ic: IC.chip, d: "Used for Elite Promotion." },
  summ: { n: "Skill Summary", ic: IC.summ, d: "Used to raise skill levels." },
};

// ---------- status effects (names follow the original game) ----------
const FX = {
  ATK_UP:       { n: "ATK Up", b: 1, s: "A↑", d: "+50% ATK" },
  DEF_UP:       { n: "DEF Up", b: 1, s: "D↑", d: "+50% DEF" },
  SPD_UP:       { n: "SPD Up", b: 1, s: "S↑", d: "+30% Speed" },
  CRIT_RATE_UP: { n: "Crit Rate Up", b: 1, s: "C↑", d: "+30% Critical Rate" },
  IMMUNITY:     { n: "Immunity", b: 1, s: "IM", d: "Blocks new debuffs" },
  HOT:          { n: "Heal over Time", b: 1, s: "HT", d: "Heals 5% Max HP at the start of each turn (stacks)" },
  SHIELD:       { n: "Shield", b: 1, s: "SH", d: "Absorbs damage before HP" },
  INVINCIBLE:   { n: "Invincible", b: 1, s: "IV", d: "Takes no damage" },
  COUNTER:      { n: "Counter", b: 1, s: "CT", d: "30% chance to counterattack when hit" },
  TAUNT:        { n: "Taunt", b: 1, s: "TA", d: "Single-target attacks must target this unit" },
  STEALTH:      { n: "Stealth", b: 1, s: "SL", d: "Can't be targeted by single-target skills" },
  DEF_BREAK:    { n: "DEF Break", b: 0, s: "DB", d: "DEF is 40% less effective" },
  ATK_DOWN:     { n: "ATK Down", b: 0, s: "A↓", d: "-30% ATK" },
  BRAND:        { n: "Brand", b: 0, s: "BR", d: "Takes 25% more damage" },
  HEAL_BLOCK:   { n: "Heal Block", b: 0, s: "HB", d: "Can't be healed" },
  STUN:         { n: "Stun", b: 0, s: "ST", d: "Loses the next turn" },
  SLOW:         { n: "Slow", b: 0, s: "SW", d: "-30% Speed" },
  GLANCING:     { n: "Glancing", b: 0, s: "GL", d: "50% chance to land glancing hits (-30%, no crit)" },
  DOT:          { n: "Burn", b: 0, s: "BN", d: "Loses 5% Max HP per stack at the start of each turn" },
  PROVOKE:      { n: "Provoke", b: 0, s: "PV", d: "Forced to use S1 on the provoker" },
  SILENCE:      { n: "Silence", b: 0, s: "SI", d: "Can't use S2 or S3" },
};
const RUNE_INFO = {
  Swift: "+25% SPD", Fatal: "+35% ATK", Blade: "+12% Crit Rate", Focus: "+20% Accuracy", Energy: "+15% HP", Guard: "+15% DEF",
  Rage: "+40% Crit Damage", Despair: "25% chance to Stun on each hit", Revenge: "15% chance to counterattack", Violent: "22% chance of an extra turn",
  Will: "Immunity for 1 turn at battle start", Shield: "Team Shield (15% of HP) at battle start", Nemesis: "Gain turn meter when damaged", Endure: "+20% Resistance",
};
const RUNE_SETS = Object.keys(RUNE_INFO);
