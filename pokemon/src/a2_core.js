
<div id="gb" class="gb classic">
  <div class="gb-bezel">
    <div class="gb-label"><span class="gb-led"><b></b>BATTERY</span><i></i><span class="gb-dm">DOT MATRIX WITH STEREO SOUND</span><i></i></div>
    <div id="screen">
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
    </div>
  </div>
  <div class="gb-logo"><small>Pokémon</small><b>KANTO SQUAD</b></div>
  <div class="gb-ctl">
    <div class="gb-dpad" aria-label="D-pad"><button data-gb="up" aria-label="Up"></button><button data-gb="left" aria-label="Left"></button><i></i><button data-gb="right" aria-label="Right"></button><button data-gb="down" aria-label="Down"></button></div>
    <div class="gb-ab"><span><button data-gb="b" aria-label="B button"></button><em>B</em></span><span><button data-gb="a" aria-label="A button"></button><em>A</em></span></div>
    <div class="gb-ss"><span><button data-gb="select" aria-label="Select"></button><em>SELECT</em></span><span><button data-gb="start" aria-label="Start"></button><em>START</em></span></div>
    <div class="gb-speaker"><i></i><i></i><i></i><i></i><i></i><i></i></div>
  </div>
</div>
<script>
"use strict";
/* =====================================================================
   POKÉMON KANTO SQUAD — an unofficial, non-commercial fan game.
   Pokémon and all related names belong to Nintendo, Game Freak and Creatures Inc.
   Pokémon and trainer sprites are from Pokémon Showdown's sprite collection; species
   data comes from PokeAPI.
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
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
function shade(hex, amt) {
  let c = hex.replace("#", ""); if (c.length === 3) c = c.split("").map(x => x + x).join("");
  const n = parseInt(c.slice(0, 6), 16), f = v => clamp(Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt), 0, 255);
  return "#" + [f(n >> 16 & 255), f(n >> 8 & 255), f(n & 255)].map(v => v.toString(16).padStart(2, "0")).join("");
}
function circ(g, x, y, r, col) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
const dexNo = id => "#" + String(id).padStart(3, "0");

// ---------- types ----------
// The fifteen types of Kanto, with the type chart as it has stood since Gold and Silver (Ghost beats Psychic).
const TYPES = ["Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon"];
const TC = { Normal: "#a8a77a", Fire: "#ee8130", Water: "#6390f0", Electric: "#f7d02c", Grass: "#7ac74c", Ice: "#96d9d6", Fighting: "#c22e28", Poison: "#a33ea1",
  Ground: "#e2bf65", Flying: "#a98ff3", Psychic: "#f95587", Bug: "#a6b91a", Rock: "#b6a136", Ghost: "#735797", Dragon: "#6f35fc" };
const ELC = TC; // the renderer colours units by their first type
const CHART = (() => {
  const se = { Fire: "Grass Ice Bug", Water: "Fire Ground Rock", Electric: "Water Flying", Grass: "Water Ground Rock", Ice: "Grass Ground Flying Dragon",
    Fighting: "Normal Ice Rock", Poison: "Grass", Ground: "Fire Electric Poison Rock", Flying: "Grass Fighting Bug", Psychic: "Fighting Poison",
    Bug: "Grass Psychic", Rock: "Fire Ice Flying Bug", Ghost: "Psychic Ghost", Dragon: "Dragon" };
  const nve = { Normal: "Rock", Fire: "Fire Water Rock Dragon", Water: "Water Grass Dragon", Electric: "Electric Grass Dragon", Grass: "Fire Grass Poison Flying Bug Dragon",
    Ice: "Fire Water Ice", Fighting: "Poison Flying Psychic Bug", Poison: "Poison Ground Rock Ghost", Ground: "Grass Bug", Flying: "Electric Rock", Psychic: "Psychic",
    Bug: "Fire Fighting Poison Flying Ghost", Rock: "Fighting Ground" };
  const imm = { Normal: "Ghost", Electric: "Ground", Fighting: "Ghost", Ground: "Flying", Ghost: "Normal" };
  const c = {};
  for (const a of TYPES) { c[a] = {}; for (const d of TYPES) c[a][d] = 1; }
  for (const [tab, v] of [[se, 2], [nve, .5], [imm, 0]]) for (const a in tab) for (const d of tab[a].split(" ")) c[a][d] = v;
  return c;
})();
const typeEff = (mt, defTypes) => defTypes.reduce((m, d) => m * CHART[mt][d], 1);
const typeChip = t => `<span class="ty" style="--tc:${TC[t]}">${t}</span>`;
const typeChips = ts => ts.map(typeChip).join("");
// what a type is strong and weak against, for the summary screen
const typeStrong = t => TYPES.filter(d => CHART[t][d] > 1);
const defWeak = ts => TYPES.filter(a => typeEff(a, ts) > 1);
const defResist = ts => TYPES.filter(a => typeEff(a, ts) < 1);

// ---------- weather (set by the battle location) ----------
const WEATHER = {
  sun: { n: "Harsh sunlight", start: "The sunlight is harsh!", ic: "☀" },
  rain: { n: "Rain", start: "It's raining!", ic: "☂" },
  sand: { n: "Sandstorm", start: "A sandstorm is raging!", ic: "≋" },
  hail: { n: "Hail", start: "It's hailing!", ic: "❄" },
};

// ---------- roles (Pokémon UNITE battle roles; shown on the summary screen) ----------
const CLASSES = ["Attacker", "All-Rounder", "Speedster", "Defender", "Supporter"];
const clsName = c => c;

// ---------- icons ----------
const ball = (top, band = "#222", btn = "#fff", extra = "") => `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10.5" fill="#f4f4f4" stroke="#1c1c22" stroke-width="1.6"/><path d="M1.5 12a10.5 10.5 0 0 1 21 0z" fill="${top}" stroke="#1c1c22" stroke-width="1.6"/>${extra}<path d="M1.5 12h21" stroke="${band}" stroke-width="2.2"/><circle cx="12" cy="12" r="3.4" fill="${btn}" stroke="#1c1c22" stroke-width="1.8"/></svg>`;
const IC = {
  pokeball: ball("#e3350d"),
  greatball: ball("#3b7dd8", "#222", "#fff", '<path d="M4.5 7.5 8 10M19.5 7.5 16 10" stroke="#e3350d" stroke-width="2.6" stroke-linecap="round"/>'),
  ultraball: ball("#2a2a30", "#222", "#fff", '<path d="M5 5.5v5M19 5.5v5" stroke="#f2c14e" stroke-width="3" stroke-linecap="round"/>'),
  masterball: ball("#7a3fb8", "#222", "#fff", '<circle cx="7.5" cy="7.5" r="2" fill="#e85aa8"/><circle cx="16.5" cy="7.5" r="2" fill="#e85aa8"/><text x="12" y="9.3" text-anchor="middle" font-size="4.6" font-weight="900" fill="#fff" font-family="Arial">M</text>'),
  safariball: ball("#5d8a3a", "#222", "#f4e6a8", '<circle cx="8" cy="7" r="1.6" fill="#3a5a22"/><circle cx="15" cy="6" r="1.4" fill="#3a5a22"/><circle cx="12" cy="9" r="1.2" fill="#3a5a22"/>'),
  sanity: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3" fill="#3b7dd8"/><text x="12" y="16" text-anchor="middle" font-size="9.5" font-weight="900" fill="#fff" font-family="Arial">PP</text></svg>',
  lmd: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="#f2c14e" stroke="#8a5a10" stroke-width="1.4"/><text x="12" y="16.4" text-anchor="middle" font-size="12" font-weight="900" fill="#7a4a08" font-family="Arial">₽</text></svg>',
  orundum: '<svg viewBox="0 0 24 24"><path fill="#4ad0ff" d="M12 2 20 9l-8 13L4 9z"/><path fill="#c8f2ff" d="M12 2 8.5 9h7z"/><path fill="#1f8ac0" d="M12 22l3.5-13H20z"/><path fill="#7ae2ff" d="M4 9h4.5L12 22z"/></svg>',
  permit: ball("#5d8a3a", "#222", "#f4e6a8", '<circle cx="8" cy="7" r="1.6" fill="#3a5a22"/><circle cx="15" cy="6" r="1.4" fill="#3a5a22"/><circle cx="12" cy="9" r="1.2" fill="#3a5a22"/>'),
  cert: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="#d8dde8" stroke="#6a7286" stroke-width="1.4"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#8a93a8" stroke-width="1.2"/><text x="12" y="15.6" text-anchor="middle" font-size="9" font-weight="900" fill="#4a5266" font-family="Arial">C</text></svg>',
  tokens: '<svg viewBox="0 0 24 24"><path fill="#e3350d" d="M12 2 21 7v10l-9 5-9-5V7z"/><text x="12" y="15.5" text-anchor="middle" font-size="8.5" font-weight="900" fill="#fff" font-family="Arial">BP</text></svg>',
  prime: '<svg viewBox="0 0 24 24"><path fill="#cfd6e2" d="M9 2h6v4l3 3v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9l3-3z"/><path fill="#e85aa8" d="M7 11h10v9a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z"/><path d="M12 13v6M9 16h6" stroke="#fff" stroke-width="1.8"/></svg>',
  rec1: '<svg viewBox="0 0 24 24"><path d="M3 12l3-3 3 3-3 3zM21 12l-3-3-3 3 3 3z" fill="#f2a6c8"/><ellipse cx="12" cy="12" rx="6" ry="5" fill="#f6c94e" stroke="#9a6a10" stroke-width="1.2"/><text x="12" y="14.6" text-anchor="middle" font-size="6" font-weight="900" fill="#7a4a08" font-family="Arial">S</text></svg>',
  rec2: '<svg viewBox="0 0 24 24"><path d="M2.5 12l3.5-3.5L9.5 12 6 15.5zM21.5 12 18 8.5 14.5 12l3.5 3.5z" fill="#f2a6c8"/><ellipse cx="12" cy="12" rx="6.5" ry="5.5" fill="#6ac8f2" stroke="#1a6a9a" stroke-width="1.2"/><text x="12" y="14.6" text-anchor="middle" font-size="6.5" font-weight="900" fill="#0a3a5a" font-family="Arial">M</text></svg>',
  rec3: '<svg viewBox="0 0 24 24"><path d="M2 12l4-4 4 4-4 4zM22 12l-4-4-4 4 4 4z" fill="#f2a6c8"/><ellipse cx="12" cy="12" rx="7" ry="6" fill="#a56af2" stroke="#4a1a9a" stroke-width="1.2"/><text x="12" y="14.8" text-anchor="middle" font-size="7" font-weight="900" fill="#fff" font-family="Arial">L</text></svg>',
  rec4: '<svg viewBox="0 0 24 24"><path d="M1.5 12 6 7.5l4.5 4.5L6 16.5zM22.5 12 18 7.5 13.5 12l4.5 4.5z" fill="#f2a6c8"/><ellipse cx="12" cy="12" rx="7.5" ry="6.5" fill="#f25a5a" stroke="#8a1010" stroke-width="1.2"/><text x="12" y="14.8" text-anchor="middle" font-size="6.5" font-weight="900" fill="#fff" font-family="Arial">XL</text></svg>',
  rare: '<svg viewBox="0 0 24 24"><path d="M2 12l4-4 4 4-4 4zM22 12l-4-4-4 4 4 4z" fill="#9ad0ff"/><ellipse cx="12" cy="12" rx="7" ry="6" fill="#4a7af2" stroke="#1a2a8a" stroke-width="1.2"/><path d="M12 8.5l1.1 2.3 2.4.3-1.8 1.6.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.6 2.4-.3z" fill="#fff"/></svg>',
  summ: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="14" rx="6" ry="7" fill="#c8a24a" stroke="#6a4a10" stroke-width="1.3"/><path d="M12 7c-1-3 1-5 4-5-1 2-2 4-4 5z" fill="#5ac84a"/><path d="M10 12c1 2 3 2 4 0" stroke="#6a4a10" stroke-width="1.2" fill="none"/></svg>',
  firestone: '<svg viewBox="0 0 24 24"><path d="M12 2 20 9l-3 11H7L4 9z" fill="#f28a3a" stroke="#8a3a08" stroke-width="1.2"/><path d="M12 7c2 3 3 5 1 8-1-2-3-2-3 0-2-3 0-5 2-8z" fill="#ffe46a"/></svg>',
  waterstone: '<svg viewBox="0 0 24 24"><path d="M12 2 20 9l-3 11H7L4 9z" fill="#4a9af2" stroke="#0a3a8a" stroke-width="1.2"/><path d="M12 7c2 3 3 5 3 7a3 3 0 0 1-6 0c0-2 1-4 3-7z" fill="#c8eaff"/></svg>',
  thunderstone: '<svg viewBox="0 0 24 24"><path d="M12 2 20 9l-3 11H7L4 9z" fill="#5ac87a" stroke="#0a5a2a" stroke-width="1.2"/><path d="M13 6l-4 7h3l-1 5 4-7h-3z" fill="#ffe46a"/></svg>',
  leafstone: '<svg viewBox="0 0 24 24"><path d="M12 2 20 9l-3 11H7L4 9z" fill="#7ac84c" stroke="#2a5a10" stroke-width="1.2"/><path d="M12 6c3 2 4 6 0 11-4-5-3-9 0-11zM12 7v10" stroke="#2a5a10" fill="#c8f2a8" stroke-width="1"/></svg>',
  moonstone: '<svg viewBox="0 0 24 24"><path d="M12 2 20 9l-3 11H7L4 9z" fill="#5a5a72" stroke="#1a1a2a" stroke-width="1.2"/><path d="M14 7a5 5 0 1 0 2 8 4 4 0 1 1-2-8z" fill="#f4ecd8"/></svg>',
  linkcord: '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round"><path d="M4 18c4-8 12 0 16-10" stroke="#3b7dd8" stroke-width="2.6"/><rect x="2" y="16" width="5" height="5" rx="1" fill="#e3350d"/><rect x="17" y="3" width="5" height="5" rx="1" fill="#e3350d"/></svg>',
  held: '<svg viewBox="0 0 24 24"><path d="M5 9h14l-2 12H7z" fill="#c8a06a" stroke="#6a4a20" stroke-width="1.3"/><path d="M8 9a4 4 0 0 1 8 0" stroke="#6a4a20" stroke-width="1.6" fill="none"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path fill="#f2c14e" stroke="#7a5310" stroke-width="1" d="m12 2 3 7 7 .6-5.4 4.6 1.7 7.3L12 17.6l-6.3 3.9 1.7-7.3L2 9.6 9 9z"/></svg>',
  starOff: '<svg viewBox="0 0 24 24"><path fill="#d8dce6" stroke="#a8b0c2" stroke-width="1" d="m12 2 3 7 7 .6-5.4 4.6 1.7 7.3L12 17.6l-6.3 3.9 1.7-7.3L2 9.6 9 9z"/></svg>',
  crown: '<svg viewBox="0 0 20 14"><path fill="#f2c14e" stroke="#5b3e08" d="M1 13 2 3l5 5 3-7 3 7 5-5 1 10z"/></svg>',
  heal: '<svg viewBox="0 0 24 24"><path fill="#43d67e" d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/></svg>',
  boost: '<svg viewBox="0 0 24 24"><path fill="#f2c14e" d="M12 2 19 10h-4v5H9v-5H5zM6 17h12v2H6zm0 3h12v2H6z"/></svg>',
  skull: '<svg viewBox="0 0 24 24"><path fill="#e8edf7" d="M12 2c5 0 8 3.5 8 8 0 3-1.5 4.5-3 5.5V19h-3v-2h-1v2h-2v-2h-1v2H7v-3.5C5.5 14.5 4 13 4 10c0-4.5 3-8 8-8z"/><circle cx="9" cy="10" r="2" fill="#05080f"/><circle cx="15" cy="10" r="2" fill="#05080f"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path fill="#5fd4ff" d="M4 4h7v16H5a1 1 0 0 1-1-1z"/><path fill="#9fe0ff" d="M13 4h7v15a1 1 0 0 1-1 1h-6z"/></svg>',
  chest: '<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="11" rx="1" fill="#8a5a2a"/><path fill="#b07a3a" d="M3 9a9 5 0 0 1 18 0z"/><rect x="10" y="11" width="4" height="4" fill="#f2c14e"/></svg>',
  tower: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 22V9l5-6 5 6v13M5 22h14M10 22v-5h4v5M10 11h4"/></svg>',
  arena: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h7v10H4zM13 7h7v10h-7zM11 12h2M7 17v3M17 17v3"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11 12 3l9 8v10h-6v-6H9v6H3z"/></svg>',
  story: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/></svg>',
  battles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20 15 9M15 9l2-5 3 3-5 2M20 20 9 9M9 9 7 4 4 7l5 2"/></svg>',
  ops: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h6M15 12h6"/><circle cx="12" cy="12" r="3"/></svg>',
  hunt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 20 9 8l4 6 3-4 5 10z"/><circle cx="17" cy="5" r="2"/></svg>',
  missions: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="m8 9 2 2 4-4M8 15h8"/></svg>',
  shop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l2-5h14l2 5M4 9v11h16V9M3 9h18M10 20v-6h4v6"/></svg>',
  depot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8V6a6 6 0 0 1 12 0v2"/><rect x="3" y="8" width="18" height="13" rx="3"/><path d="M3 13h18M10 13v3h4v-3"/></svg>',
  dex: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="9" cy="7" r="2.5"/><path d="M14 6h3M7 13h10M7 17h10"/></svg>',
  gearIc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 4 8 12l7 8"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/><path d="m12 6 1 2 2 .3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1L9 8.3l2-.3z" fill="currentColor"/></svg>',
  gift: '<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="12" rx="1.5" fill="#e3350d"/><rect x="2" y="7" width="20" height="4" rx="1" fill="#ff5a3a"/><path d="M12 7v14" stroke="#f2e6c8" stroke-width="2.4"/><path d="M12 7c-2-4-6-4-6-1.5S10 7 12 7c2 0 6-.5 6-1.5S14 3 12 7z" fill="none" stroke="#f2e6c8" stroke-width="1.6"/></svg>',
  free10: ball("#5d8a3a", "#222", "#f4e6a8", '<text x="12" y="9.6" text-anchor="middle" font-size="6.5" font-weight="900" fill="#fff" font-family="Arial">10</text>'),
  gold5: ball("#7a3fb8", "#222", "#fff", '<circle cx="7.5" cy="7.5" r="2" fill="#e85aa8"/><circle cx="16.5" cy="7.5" r="2" fill="#e85aa8"/><text x="12" y="9.3" text-anchor="middle" font-size="4.6" font-weight="900" fill="#fff" font-family="Arial">M</text>'),
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="#2a9a5a" stroke-width="3"><path d="m5 12 5 5 9-10"/></svg>',
  cross: '<svg viewBox="0 0 24 24" fill="none" stroke="#a8b0c2" stroke-width="3"><path d="M6 6l12 12M18 6 6 18"/></svg>',
};
// Kanto's eight Gym Badges (simple drawn shapes in their colours)
const BADGES = [
  { n: "Boulder Badge", gym: "Pewter Gym", leader: "Brock", type: "Rock", col: "#9aa0a8", stat: "atk", sn: "Attack", path: "M12 3l8 6-3 11H7L4 9z" },
  { n: "Cascade Badge", gym: "Cerulean Gym", leader: "Misty", type: "Water", col: "#4a9af2", stat: "sdf", sn: "Sp. Def", path: "M12 3c4 5 7 9 7 12a7 7 0 0 1-14 0c0-3 3-7 7-12z" },
  { n: "Thunder Badge", gym: "Vermilion Gym", leader: "Lt. Surge", type: "Electric", col: "#f2a63a", stat: "def", sn: "Defense", path: "M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" },
  { n: "Rainbow Badge", gym: "Celadon Gym", leader: "Erika", type: "Grass", col: "#c87af2", stat: "spa", sn: "Sp. Atk", path: "M12 3c2 3 6 3 8 1-1 4 0 8 2 9-4 0-6 3-6 8-1-3-3-4-4-4s-3 1-4 4c0-5-2-8-6-8 2-1 3-5 2-9 2 2 6 2 8-1z" },
  { n: "Soul Badge", gym: "Fuchsia Gym", leader: "Koga", type: "Poison", col: "#e85aa8", stat: "spe", sn: "Speed", path: "M12 21C5 15 3 11 3 8a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1c0 3-2 7-9 13z" },
  { n: "Marsh Badge", gym: "Saffron Gym", leader: "Sabrina", type: "Psychic", col: "#f2c14e", stat: "spa", sn: "Sp. Atk", path: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" },
  { n: "Volcano Badge", gym: "Cinnabar Gym", leader: "Blaine", type: "Fire", col: "#e3350d", stat: "atk", sn: "Attack", path: "M12 2c2 4 7 6 7 12a7 7 0 0 1-14 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3 1-6 2-9z" },
  { n: "Earth Badge", gym: "Viridian Gym", leader: "Giovanni", type: "Ground", col: "#5ac87a", stat: "hp", sn: "HP", path: "M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7z" },
];
const badgeSVG = (i, on = true) => `<svg viewBox="0 0 24 24"><path d="${BADGES[i].path}" fill="${on ? BADGES[i].col : "#c9cfdb"}" stroke="${on ? shade(BADGES[i].col, -.45) : "#a8b0c2"}" stroke-width="1.4" stroke-linejoin="round"/>${on ? `<path d="${BADGES[i].path}" fill="#fff" opacity=".25" transform="translate(-1.2 -1.2) scale(.92)" transform-origin="12 12"/>` : ""}</svg>`;

const ITEMS = {
  lmd: { n: "Poké Dollars", ic: IC.lmd, d: "Money. Spend it at the Poké Mart." },
  orundum: { n: "Gems", ic: IC.orundum, d: "Trade them for Safari Balls at the Safari Zone gate." },
  permit: { n: "Safari Ball", ic: IC.permit, d: "One throw in the Safari Zone." },
  cert: { n: "Coins", ic: IC.cert, d: "Game Corner Coins. Catching a Pokémon whose IVs are already perfect pays out Coins. Spend them at the Prize Corner." },
  tokens: { n: "Battle Points", ic: IC.tokens, d: "BP, earned in Link Battles. Spend them at the BP Exchange." },
  prime: { n: "Max Elixir", ic: IC.prime, d: "Restores your PP to full." },
  sanity: { n: "PP", ic: IC.sanity },
  rec1: { n: "Exp. Candy S", ic: IC.rec1, xp: 200, d: "Gives one Pokémon 200 Exp. Points." },
  rec2: { n: "Exp. Candy M", ic: IC.rec2, xp: 600, d: "Gives one Pokémon 600 Exp. Points." },
  rec3: { n: "Exp. Candy L", ic: IC.rec3, xp: 2000, d: "Gives one Pokémon 2,000 Exp. Points." },
  rec4: { n: "Exp. Candy XL", ic: IC.rec4, xp: 6000, d: "Gives one Pokémon 6,000 Exp. Points." },
  rare: { n: "Rare Candy", ic: IC.rare, d: "Raises a Pokémon's level by 1." },
  summ: { n: "Seed of Mastery", ic: IC.summ, d: "Raises the Mastery of one of a Pokémon's moves." },
  firestone: { n: "Fire Stone", ic: IC.firestone, d: "Evolves Vulpix, Growlithe and Eevee." },
  waterstone: { n: "Water Stone", ic: IC.waterstone, d: "Evolves Poliwhirl, Shellder, Staryu and Eevee." },
  thunderstone: { n: "Thunder Stone", ic: IC.thunderstone, d: "Evolves Pikachu and Eevee." },
  leafstone: { n: "Leaf Stone", ic: IC.leafstone, d: "Evolves Gloom, Weepinbell and Exeggcute." },
  moonstone: { n: "Moon Stone", ic: IC.moonstone, d: "Evolves Nidorina, Nidorino, Clefairy and Jigglypuff." },
  linkcord: { n: "Linking Cord", ic: IC.linkcord, d: "Evolves Pokémon that evolve by trading: Kadabra, Machoke, Graveler and Haunter." },
  free10: { n: "Safari Pass", ic: IC.free10, d: "Ten free throws in the Safari Zone, all at once." },
  gold5: { n: "Master Ball", ic: IC.gold5, d: "The best Poké Ball there is. It never fails: it catches one random 5★ Pokémon." },
};
const STONES = ["firestone", "waterstone", "thunderstone", "leafstone", "moonstone", "linkcord"];

// ---------- status conditions and battle effects ----------
// b: 1 = good for the holder. major: one of the five main status conditions (a Pokémon can only have one).
const FX = {
  BRN: { n: "Burn", s: "BRN", c: "#ee6a30", major: 1, d: "Loses 1/16 of its max HP every turn. Its physical moves deal half damage." },
  PSN: { n: "Poison", s: "PSN", c: "#a33ea1", major: 1, d: "Loses 1/8 of its max HP every turn." },
  TOX: { n: "Bad poison", s: "PSN", c: "#7a1a8a", major: 1, d: "Loses 1/16 of its max HP every turn, then 2/16, 3/16 and so on." },
  PAR: { n: "Paralysis", s: "PAR", c: "#e8b818", major: 1, d: "Speed is halved, and each turn there is a 25% chance it can't move." },
  SLP: { n: "Sleep", s: "SLP", c: "#8a90a0", major: 1, d: "Can't move until it wakes up." },
  FRZ: { n: "Freeze", s: "FRZ", c: "#58c8e0", major: 1, d: "Can't move. Each turn it has a 20% chance to thaw; a Fire move thaws it at once." },
  CNF: { n: "Confusion", s: "CNF", c: "#c86ab8", d: "Each turn there is a 33% chance it hurts itself in its confusion instead of moving." },
  INFAT: { n: "Infatuation", s: "LOV", c: "#f26aa8", d: "Each turn there is a 50% chance it is immobilized by love." },
  SEED: { n: "Leech Seed", s: "SED", c: "#5aa83a", d: "Loses 1/8 of its max HP every turn; the Pokémon that planted it gets the HP." },
  TRAP: { n: "Bound", s: "BND", c: "#a87a4a", d: "Squeezed every turn for 1/8 of its max HP." },
  DISABLE: { n: "Disable", s: "DIS", c: "#6a7286", d: "Can't use its S2 or S3 moves." },
  RECHARGE: { n: "Recharge", s: "RCH", c: "#6a7286", d: "Must recharge and loses its next turn." },
  SUB: { n: "Substitute", b: 1, s: "SUB", c: "#5a9a6a", d: "A decoy takes the damage until it breaks." },
  FOCUS: { n: "Focus Energy", b: 1, s: "FOC", c: "#e8a03a", d: "Getting pumped: much more likely to land critical hits." },
  MIST: { n: "Mist", b: 1, s: "MST", c: "#a8d8f2", d: "Shrouded in mist: other Pokémon can't lower its stats." },
  REFLECT: { n: "Reflect", b: 1, s: "REF", c: "#f2a6c8", d: "Physical damage taken is cut by a third." },
  LSCREEN: { n: "Light Screen", b: 1, s: "LSC", c: "#f2d86a", d: "Special damage taken is cut by a third." },
  FLASHFIRE: { n: "Flash Fire", b: 1, s: "FF", c: "#ee8130", d: "Its Fire-type moves are powered up by 50%." },
};
const MAJOR = Object.keys(FX).filter(k => FX[k].major);
// stat stages, -6 to +6
const STAGE_N = { atk: "Attack", def: "Defense", spa: "Sp. Atk", sdf: "Sp. Def", spe: "Speed", acc: "accuracy", eva: "evasiveness" };
const STAGE_S = { atk: "Atk", def: "Def", spa: "SpA", sdf: "SpD", spe: "Spe", acc: "Acc", eva: "Eva" };
const stageMult = (s, accLike) => accLike ? (s >= 0 ? (3 + s) / 3 : 3 / (3 - s)) : (s >= 0 ? (2 + s) / 2 : 2 / (2 - s));
const STAGE_WORD = n => ({ 1: "rose!", 2: "rose sharply!", 3: "rose drastically!", "-1": "fell!", "-2": "harshly fell!", "-3": "severely fell!" }[clamp(n, -3, 3)]);
// Mastery ranks for moves (raised with Seeds of Mastery)
const MAX_SK = 5;
const RANK = ["", "1", "2", "3", "4", "★"];
