
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
   BEYBLADE: LET IT RIP! — an unofficial, non-commercial fan game based on the original Beyblade anime
   (Bakuten Shoot Beyblade, V-Force and G-Revolution). Beyblade belongs to Takara Tomy, Hasbro, Aoki Takao and
   Nelvana / d-rights. Every Beyblade, Bit-Beast and Blader here is drawn procedurally on canvas; no official assets are used.
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
const today = () => new Date().toISOString().slice(0, 10);

// ---------- Beyblade types + rarity ----------
// Every Beyblade is one of the four types from the toys and the show. Internally the type lives in the `el` field (it
// drives matchups, colours and badges, like an element) and also picks the base stats (`cls`).
//  Attack beats Endurance (it knocks a long spinner out before it can outlast you), Endurance beats Defense (it simply
//  spins longer), Defense beats Attack (heavy, round rings shrug off the hits). Balance has no weakness and no edge.
const ELS = ["Attack", "Defense", "Endurance", "Balance"];
const ELC = { Attack: "#ff5a4a", Defense: "#4aa8ff", Endurance: "#f2c14e", Balance: "#b07bff" };
const BEATS = { Attack: "Endurance", Endurance: "Defense", Defense: "Attack" };
const RARE_ELS = [];
const elName = el => el + " type";
const elShort = el => el === "Endurance" ? "Endur." : el;
function elementRel(a, t) { if (BEATS[a] === t) return "adv"; if (BEATS[t] === a) return "dis"; return "neu"; }
const elKey = el => el.toLowerCase();
const weakTo = el => Object.keys(BEATS).find(k => BEATS[k] === el);
// Type traits (each type's built-in edge in battle)
const TYPE_TRAIT = {
  Attack: { n: "Smash Attack", d: "Deals 12% more damage and 15% more knockback." },
  Defense: { n: "Iron Wall", d: "Takes 8% less damage and holds its ground against knockback. The first time its Spin drops below half, it shakes off every debuff." },
  Endurance: { n: "Long Spin", d: "Loses Spin to friction 40% more slowly, so it outlasts other types." },
  Balance: { n: "Bit Charge", d: "Builds Bit Power over time twice as fast while it's in the dish. Its Bit-Beast attacks deal 20% more damage." },
};
const ATK_SMASH = .12, DEF_GUARD = .08, END_SPIN = .05, BAL_CHARGE = 8, BAL_BIT = .2;
// Seasons of the original anime: each Blader's Beyblades are versions from one of them
const SEASONS = { 1: "Season 1", 2: "V-Force", 3: "G-Revolution" };
const RC = { 1: "#c9d1de", 2: "#7fdc8a", 3: "#8fd8ff", 4: "#c39bff", 5: "#f1d07a", 6: "#ff9a3c" };
// Engine classes are the four types (base stats, recommended parts, default leader skill)
const CLASSES = ["Attack", "Defense", "Endurance", "Balance"];
const clsName = c => c + " type";

// ---------- icons ----------
const IC = {
  sanity: '<svg viewBox="0 0 24 24"><path fill="#ffd34d" d="M13 2 5 13h6l-2 9 9-12h-6z"/><path fill="#fff3b0" d="M12 4 7 12h4z" opacity=".6"/></svg>',
  lmd: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#d8c27a"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#7a6320" stroke-width="1.5"/><path d="M8.5 7.5 12 12l3.5-4.5M12 12v5M9.5 12.5h5M9.5 15h5" stroke="#4a3a0e" stroke-width="1.7" fill="none"/></svg>',
  orundum: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#2f6fd8"/><circle cx="12" cy="12" r="7.5" fill="#5fd4ff"/><path fill="#ffffff" d="M12 5.5l2 4.4 4.6.4-3.5 3 1.1 4.6L12 15.4 7.8 17.9l1.1-4.6-3.5-3 4.6-.4z"/></svg>',
  permit: '<svg viewBox="0 0 24 24"><path fill="#ff5a4a" d="M5 3h14l-1 18H6z"/><path fill="#ffd34d" d="M5 3h14l-.3 4H5.3z"/><circle cx="12" cy="13" r="4" fill="#fff"/><circle cx="12" cy="13" r="1.6" fill="#2f6fd8"/><path d="M8 13h8M12 9v8" stroke="#2f6fd8" stroke-width=".9"/></svg>',
  cert: '<svg viewBox="0 0 24 24"><path fill="#9aa4b8" d="M10 2h4l.6 2.6 2.4 1 2.3-1.4 2.8 2.8-1.4 2.3 1 2.4L24 12v0l-2.6.6-1 2.4 1.4 2.3-2.8 2.8-2.3-1.4-2.4 1L14 22h-4l-.6-2.6-2.4-1-2.3 1.4-2.8-2.8 1.4-2.3-1-2.4L0 12l2.6-.6 1-2.4-1.4-2.3 2.8-2.8 2.3 1.4 2.4-1z" transform="scale(.9) translate(1.3 1.3)"/><circle cx="12" cy="12" r="3.6" fill="#3a3f4a"/></svg>',
  rec1: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2" fill="#3a4a6a"/><rect x="6" y="5" width="12" height="7" rx="1" fill="#5fd4ff"/><path d="M8 15h8M8 18h5" stroke="#cfe8ff" stroke-width="1.6"/></svg>',
  rec2: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2" fill="#2a5a3a"/><rect x="6" y="5" width="12" height="7" rx="1" fill="#5fdc8c"/><path d="M8 15h8M8 18h5" stroke="#d8ffe4" stroke-width="1.6"/></svg>',
  rec3: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2" fill="#5a2a6a"/><rect x="6" y="5" width="12" height="7" rx="1" fill="#c39bff"/><path d="M8 15h8M8 18h5" stroke="#f0e4ff" stroke-width="1.6"/></svg>',
  rec4: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="2" fill="#2a2e3a"/><rect x="5" y="6" width="14" height="9" rx="1" fill="#0e1a2a"/><path d="M8 13l2-3 2 2 2-4 2 5" stroke="#5fd4ff" stroke-width="1.4" fill="none"/><path d="M9 20h6M12 17v3" stroke="#9aa4b8" stroke-width="1.8"/><circle cx="17" cy="8" r="1" fill="#ff5a4a"/></svg>',
  chip: '<svg viewBox="0 0 24 24"><path fill="#9aa4b8" d="M14.5 3a5 5 0 0 0-4.6 6.9L3 16.8 7.2 21l6.9-6.9A5 5 0 0 0 21 9.5l-3 3-3.5-1-1-3.5 3-3a5 5 0 0 0-2-.5z"/><path fill="#d8dce6" d="M5 17l2 2"/></svg>',
  summ: '<svg viewBox="0 0 24 24"><path fill="#e8dcc0" d="M6 4h12v14H6z"/><rect x="4" y="2.5" width="16" height="3" rx="1.5" fill="#8a4a2a"/><rect x="4" y="17.5" width="16" height="3" rx="1.5" fill="#8a4a2a"/><path d="M9 8h6M9 11h6M9 14h4" stroke="#6a4a2a" stroke-width="1.2"/></svg>',
  tokens: '<svg viewBox="0 0 24 24"><path fill="#f2c14e" d="M7 3h10v5a5 5 0 0 1-10 0z"/><path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4" stroke="#f2c14e" stroke-width="1.6" fill="none"/><path fill="#c8902a" d="M10 13h4v4h-4z"/><rect x="7" y="17" width="10" height="3" rx="1" fill="#8a5a1a"/></svg>',
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
  tower: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 3h10v5a5 5 0 0 1-10 0zM7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6"/></svg>',
  arena: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5l4 10 4-10M21 6.5c-1-1.5-5-2-5 .8 0 3 5 2 5 5 0 2.8-4 2.5-5 .7"/><path d="M4 20h16"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11 12 3l9 8v10h-6v-6H9v6H3z"/></svg>',
  story: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6c3-2 6-2 9 0 3-2 6-2 9 0v13c-3-2-6-2-9 0-3-2-6-2-9 0z"/><path d="M12 6v13"/></svg>',
  battles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20 15 9M15 9l2-5 3 3-5 2M20 20 9 9M9 9 7 4 4 7l5 2"/></svg>',
  ops: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="10" rx="9" ry="4"/><path d="M3 10l3 4h12l3-4M9 14l3 6 3-6"/><circle cx="12" cy="9.5" r="1.6"/></svg>',
  hunt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 20V9l5-4 4 3 4-3 5 4v11z"/><path d="M8 20v-5h3v5M14 12h3v3h-3z"/></svg>',
  missions: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="m8 9 2 2 4-4M8 15h8"/></svg>',
  shop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H16M8 2c-1 1.5 1 2.5 0 4M12 2c-1 1.5 1 2.5 0 4"/></svg>',
  depot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8 12 3l9 5v9l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v9"/></svg>',
  gearIc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 4 7 12l8 8"/></svg>',
  rune: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="14" rx="9" ry="4" fill="#3a3f4a"/><ellipse cx="12" cy="11" rx="10" ry="4.5" fill="#9aa4b8"/><path fill="#2f6fd8" d="M3 10l5-3 3 2 6-3 4 3-4 3-6-1-4 2z"/><circle cx="12" cy="10" r="2" fill="#5fd4ff"/></svg>',
  prime: '<svg viewBox="0 0 24 24"><rect x="8" y="2" width="8" height="3" rx="1" fill="#ff5a4a"/><path fill="#cfe8ff" d="M7 6h10l1 15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z"/><path fill="#5fd4ff" d="M6.5 12h11l.5 9a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z"/><path d="M10 15h4" stroke="#fff" stroke-width="1.6"/></svg>',
  credit: '<svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2" fill="#ff9a3c"/><path d="M8 6v12" stroke="#7a3a0a" stroke-dasharray="2 2"/><circle cx="15" cy="12" r="3.2" fill="#fff3e0"/><circle cx="15" cy="12" r="1.2" fill="#ff5a4a"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9 18h6"/></svg>',
  gift: '<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="12" rx="1.5" fill="#c8203a"/><rect x="2" y="7" width="20" height="4" rx="1" fill="#ff4d6d"/><path d="M12 7v14" stroke="#f1dca2" stroke-width="2.4"/><path d="M12 7c-2-4-6-4-6-1.5S10 7 12 7c2 0 6-.5 6-1.5S14 3 12 7z" fill="none" stroke="#f1dca2" stroke-width="1.6"/></svg>',
  free10: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" fill="#2f6fd8"/><path fill="#ffd34d" d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3H2z"/><text x="12" y="17.5" text-anchor="middle" font-size="8" font-weight="900" fill="#fff" font-family="Arial">×10</text></svg>',
  gold5: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#1a1e28"/><circle cx="12" cy="12" r="7.6" fill="#f2c14e"/><circle cx="12" cy="12" r="5" fill="#fff3c4"/><path fill="#c8302a" d="M8 15c1-4 5-1 4-5 2 0 4 2 4 4-2 0-2 2-4 2s-2-2-4-1z"/></svg>',
  launcher: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9h10l2-3h4v6h-4l-2-2H3z"/><path d="M19 9h3M6 9v6M6 15h3"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="#43d67e" stroke-width="3"><path d="m5 12 5 5 9-10"/></svg>',
  cross: '<svg viewBox="0 0 24 24" fill="none" stroke="#5b6886" stroke-width="3"><path d="M6 6l12 12M18 6 6 18"/></svg>',
};
const ITEMS = {
  lmd: { n: "Yen", ic: IC.lmd },
  orundum: { n: "BeyPoint", ic: IC.orundum, d: "The BBA's prize currency. Spent on Random Boosters." },
  permit: { n: "Booster Ticket", ic: IC.permit, d: "Opens one Random Booster." },
  cert: { n: "Spare Part", ic: IC.cert, d: "Left over when a Booster gives you a Beyblade you already have. Spent at the hobby shop's parts counter." },
  tokens: { n: "Ranking Point", ic: IC.tokens, d: "Earned in BBA Ranked Battles." },
  prime: { n: "Sports Drink", ic: IC.prime, d: "Restores your Energy, or trades for 180 BeyPoints." },
  credit: { n: "Hobby Shop Coupon", ic: IC.credit, d: "Spent at Max's dad's hobby shop." },
  sanity: { n: "Energy", ic: IC.sanity },
  rec1: { n: "Battle Data S", ic: IC.rec1, xp: 200 },
  rec2: { n: "Battle Data M", ic: IC.rec2, xp: 400 },
  rec3: { n: "Battle Data L", ic: IC.rec3, xp: 1000 },
  rec4: { n: "Dizzi's Master Data", ic: IC.rec4, xp: 2000 },
  chip: { n: "Upgrade Kit", ic: IC.chip, d: "Metal parts and tools for a full customization. Used to Upgrade a Beyblade." },
  summ: { n: "Training Scroll", ic: IC.summ, d: "Grandpa's training notes. Used to raise a technique's level." },
  free10: { n: "Starter Booster ×10", ic: IC.free10, d: "Ten free Random Boosters. Open them at the Booster shop." },
  gold5: { n: "Legendary Bit-Chip", ic: IC.gold5, d: "A Bit-Chip with a sleeping Bit-Beast inside: it always becomes a random 5★ Beyblade." },
  part3: { n: "Pro grade part", ic: IC.rune, d: "A random Pro grade Beyblade part." },
  part4: { n: "Metal grade part", ic: IC.rune, d: "A random Metal grade Beyblade part." },
  part5: { n: "Championship part", ic: IC.rune, d: "A random Championship grade Beyblade part." },
};

// ---------- status effects (Beyblade battle terms) ----------
const FX = {
  ATK_UP:       { n: "Attack Up", b: 1, s: "A↑", d: "+50% ATK" },
  DEF_UP:       { n: "Defense Up", b: 1, s: "D↑", d: "+50% DEF" },
  SPD_UP:       { n: "Spin Speed Up", b: 1, s: "S↑", d: "Moves faster; techniques recharge 30% faster" },
  CRIT_RATE_UP: { n: "Focus", b: 1, s: "C↑", d: "+30% Critical Rate" },
  IMMUNITY:     { n: "Bit Shield", b: 1, s: "BS", d: "Blocks new debuffs" },
  HOT:          { n: "Spin Recovery", b: 1, s: "SR", d: "Recovers 2% max Spin per second (stacks)" },
  SHIELD:       { n: "Barrier", b: 1, s: "BR", d: "Absorbs damage before Spin" },
  INVINCIBLE:   { n: "Invincible", b: 1, s: "IV", d: "Takes no damage" },
  COUNTER:      { n: "Counter Spin", b: 1, s: "CS", d: "30% chance to hit straight back when rushed" },
  TAUNT:        { n: "Center Hold", b: 1, s: "CH", d: "Holds the centre: knockback greatly reduced, and it can't be knocked out of the dish" },
  STEALTH:      { n: "Phantom Spin", b: 1, s: "PS", d: "The next rush against it misses" },
  DEF_BREAK:    { n: "Cracked Ring", b: 0, s: "D↓", d: "DEF is 40% less effective" },
  ATK_DOWN:     { n: "Attack Down", b: 0, s: "A↓", d: "-30% ATK" },
  BRAND:        { n: "Weak Spot", b: 0, s: "WS", d: "Takes 25% more damage" },
  HEAL_BLOCK:   { n: "Spin Lock", b: 0, s: "SL", d: "Can't recover Spin" },
  STUN:         { n: "Stalled", b: 0, s: "ST", d: "Wobbles out of control: can't move or act" },
  SLOW:         { n: "Slowed", b: 0, s: "SW", d: "Moves slower; techniques recharge 25% slower" },
  GLANCING:     { n: "Off Balance", b: 0, s: "OB", d: "50% chance to land glancing hits (-30%, no crit)" },
  DOT:          { n: "Friction", b: 0, s: "FR", d: "Loses 2% max Spin per second per stack" },
  PROVOKE:      { n: "Taunted", b: 0, s: "TT", d: "Can only Attack, and charges at the taunter" },
  SILENCE:      { n: "Bit-Beast Sealed", b: 0, s: "SE", d: "Can't use S2 or the Bit-Beast attack" },
};
// battles are 1-on-1 tag matches: a team is three Beyblades, one in the dish at a time
const TEAM_SIZE = 3;
// battle time: an effect lasting one "turn" in the move data lasts T_SEC seconds; 100% "turn meter" is ATB_S seconds of cooldown
const T_SEC = 2.5, ATB_S = 6;
// technique levels 1–7 (7 is MAX)
const RANK = ["", "1", "2", "3", "4", "5", "6", "MAX"];
