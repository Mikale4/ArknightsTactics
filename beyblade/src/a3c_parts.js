// =====================================================================
//  BEYBLADE PARTS — every Beyblade is built from four parts, like the toys:
//  Attack Ring (how it hits), Weight Disk (how heavy it is), Spin Gear (which way it spins) and
//  Blade Base (how it moves). The Bit-Chip is the Bit-Beast itself and never changes.
//  A slot with nothing fitted uses the Beyblade's stock part. Fitted parts have a grade (Plastic to
//  Championship) and a tune-up level (+0 to +15) that scale their stat bonuses; the model sets the physics.
// =====================================================================
const PART_SLOTS = ["ar", "wd", "sg", "bb"];
const SLOT_NAME = { ar: "Attack Ring", wd: "Weight Disk", sg: "Spin Gear", bb: "Blade Base" };
// stat: bonuses scaled by grade and level (atk/def/hp are %, spd/cr/res are flat). Physical traits (fixed per model):
//  weight (heavier: knocked back less, accelerates slower) · speed (top speed) · drive (how hard it steers) ·
//  aggro (how much it homes in on the rival) · center (stays near the middle) · stamina (Spin lasts longer; negative burns
//  faster) · smash (knockback dealt) · guard (knockback taken reduced) · recoil (Spin it loses when it smashes) ·
//  spin: R, L or D (Dual: every clash counts as against the spin) · burst (Engine Gear: a speed and power burst
//  the first time its Spin falls below half) · absorb (steals Spin with every hit)
const PART_MODELS = {
  // ---- Attack Rings ----
  wing:      { slot: "ar", n: "Wing Attack Ring", d: "All-round blades: good damage and knockback.", stat: { atk: .08, cr: .03 }, smash: 1.1 },
  spike:     { slot: "ar", n: "Spike Attack Ring", d: "Sharp points that bite into the rival. Hard hits, more recoil.", stat: { atk: .12, cr: .05 }, smash: 1.15, recoil: 1.2 },
  upper:     { slot: "ar", n: "Upper Attack Ring", d: "Sloped blades that lift the rival off the floor: the strongest knockback.", stat: { atk: .06 }, smash: 1.4, recoil: 1.1 },
  smash:     { slot: "ar", n: "Smash Attack Ring", d: "Heavy, flat-faced blades for raw damage.", stat: { atk: .15 }, smash: 1.2, recoil: 1.25, weight: .05 },
  defring:   { slot: "ar", n: "Defense Ring", d: "A round guard ring that deflects hits and takes little recoil.", stat: { def: .12 }, smash: .8, guard: .15, recoil: .6 },
  survivor:  { slot: "ar", n: "Survivor Ring", d: "A smooth ring that loses very little Spin in clashes.", stat: { hp: .06, def: .05 }, smash: .85, stamina: .1, recoil: .7 },
  absorb:    { slot: "ar", n: "Spin Absorb Ring", d: "Rubber contact points that steal Spin with every hit.", stat: { hp: .05 }, smash: .9, absorb: .08 },
  metal:     { slot: "ar", n: "Metal Attack Ring", d: "Hard Metal System ring: heavy, tough and devastating.", stat: { atk: .12, def: .06 }, smash: 1.25, weight: .1, recoil: .9 },
  // ---- Weight Disks ----
  tenwide:   { slot: "wd", n: "Ten Wide", d: "Weight on the outer edge for a steadier, longer spin.", stat: { hp: .1 }, weight: 1.0, stamina: .15, guard: .05 },
  eightheavy:{ slot: "wd", n: "Eight Heavy", d: "Very heavy: hard to push around, slow to speed up.", stat: { def: .1, hp: .05 }, weight: 1.35, speed: -.12, guard: .15 },
  tenbal:    { slot: "wd", n: "Ten Balance", d: "Even weight that suits any style.", stat: { atk: .04, def: .04, hp: .04 }, weight: 1.1 },
  sixatk:    { slot: "wd", n: "Six Attack", d: "Light and aggressive: fast, but easier to knock away.", stat: { atk: .08 }, weight: .85, speed: .1 },
  widedef:   { slot: "wd", n: "Wide Defense", d: "A broad, heavy disk that anchors the Beyblade in place.", stat: { def: .14 }, weight: 1.25, guard: .25, speed: -.08 },
  magne:     { slot: "wd", n: "Magne Weight Disk", d: "Magnacore weight that pulls toward the centre of the dish.", stat: { hp: .08 }, weight: 1.1, center: .35 },
  // ---- Spin Gears ----
  rsg:       { slot: "sg", n: "Right Spin Gear", d: "Spins right.", stat: { hp: .06 }, spin: "R" },
  lsg:       { slot: "sg", n: "Left Spin Gear", d: "Spins left, like Dragoon.", stat: { hp: .06 }, spin: "L" },
  neor:      { slot: "sg", n: "Neo Right Spin Gear", d: "Magnacore gear: spins right and settles toward the centre.", stat: { hp: .05, def: .03 }, spin: "R", center: .15, stamina: .05 },
  neol:      { slot: "sg", n: "Neo Left Spin Gear", d: "Magnacore gear: spins left and settles toward the centre.", stat: { hp: .05, def: .03 }, spin: "L", center: .15, stamina: .05 },
  egr:       { slot: "sg", n: "Engine Gear (Right)", d: "A wound-up spring: the first time Spin drops below half, it releases a burst of speed and power.", stat: { atk: .04 }, spin: "R", burst: 1 },
  egl:       { slot: "sg", n: "Engine Gear (Left)", d: "A wound-up spring: the first time Spin drops below half, it releases a burst of speed and power.", stat: { atk: .04 }, spin: "L", burst: 1 },
  dual:      { slot: "sg", n: "Dual Spin Gear", d: "Hard Metal System: it can launch either way, so every clash is against the spin.", stat: { hp: .04, atk: .04 }, spin: "D" },
  // ---- Blade Bases (movement) ----
  flat:      { slot: "bb", n: "Flat Base", d: "A wide flat tip: fast and aggressive, but it burns Spin.", stat: { spd: 6 }, speed: .3, drive: 1.2, aggro: .55, stamina: -.2 },
  grip:      { slot: "bb", n: "Grip Base", d: "A rubber tip that grips the floor: the fastest, wildest movement.", stat: { atk: .04 }, speed: .42, drive: 1.5, aggro: .7, stamina: -.3, smash: .1 },
  semiflat:  { slot: "bb", n: "Semi-Flat Base", d: "Between flat and sharp: steady circling around the dish.", stat: { spd: 3 }, speed: 0, drive: 1, aggro: .35 },
  sharp:     { slot: "bb", n: "Sharp Base", d: "A pointed tip that holds the centre and spins for ages.", stat: { hp: .04 }, speed: -.4, drive: .6, aggro: .1, center: .45, stamina: .35, guard: -.1 },
  ball:      { slot: "bb", n: "Metal Ball Base", d: "A rounded metal tip: hard to move, keeps its ground.", stat: { def: .08 }, speed: -.25, drive: .8, aggro: .2, center: .25, guard: .25, stamina: .1 },
  bearing:   { slot: "bb", n: "Bearing Base", d: "A free-spinning tip: barely loses Spin, barely moves.", stat: { hp: .06 }, speed: -.5, drive: .5, aggro: .05, center: .55, stamina: .55, guard: -.15 },
  instant:   { slot: "bb", n: "Instant Release Base", d: "Engine Gear base: it moves quickly and doubles the Engine Gear's burst.", stat: { spd: 4 }, speed: .1, drive: 1.1, aggro: .45, burst: .5 },
};
const MODELS_BY_SLOT = Object.fromEntries(PART_SLOTS.map(s => [s, Object.keys(PART_MODELS).filter(m => PART_MODELS[m].slot === s)]));
// grades: 0 is the stock part every Beyblade comes with
const PART_GRADE = ["Stock", "Plastic", "Custom", "Pro", "Metal", "Championship"];
const PART_GC = ["#7a869c", "#9aa4b8", "#4fd17f", "#3fa7ff", "#b26bff", "#ff9a3c"];
const PART_Q = [.55, .65, .8, .95, 1.1, 1.25];
const partScale = (rar, lvl = 0) => PART_Q[rar] * (1 + .045 * lvl);
const STATN2 = { atk: "ATK", def: "DEF", hp: "Spin", spd: "SPD", cr: "Crit Rate", res: "Resistance" };
function partStatText(m, rar, lvl) {
  const st = PART_MODELS[m].stat, f = partScale(rar, lvl);
  return Object.entries(st).map(([k, v]) => k === "spd" ? `SPD +${Math.round(v * f)}` : `${STATN2[k]} +${Math.round(v * f * 100)}%`).join(", ");
}
// plain-language summary of a model's physics for the parts screen
function partTraitText(m) {
  const P = PART_MODELS[m], out = [];
  if (P.spin) out.push(P.spin === "D" ? "Dual spin" : P.spin === "L" ? "Left spin" : "Right spin");
  if (P.weight) out.push(`Weight ${P.weight.toFixed(2)}`);
  if (P.speed) out.push(`Speed ${P.speed > 0 ? "+" : ""}${Math.round(P.speed * 100)}%`);
  if (P.smash) out.push(`Knockback ×${P.smash.toFixed(2)}`);
  if (P.guard) out.push(`Holds ground ${P.guard > 0 ? "+" : ""}${Math.round(P.guard * 100)}%`);
  if (P.stamina) out.push(`Stamina ${P.stamina > 0 ? "+" : ""}${Math.round(P.stamina * 100)}%`);
  if (P.center) out.push("Stays central");
  if (P.aggro >= .5) out.push("Hunts the rival");
  if (P.absorb) out.push(`Steals ${Math.round(P.absorb * 100)}% of damage as Spin`);
  if (P.burst) out.push(P.slot === "sg" ? "Engine burst" : "Bigger engine burst");
  if (P.recoil && P.recoil !== 1) out.push(P.recoil < 1 ? "Low recoil" : "High recoil");
  return out.join(" · ");
}

// ---------- stock parts ----------
// what each Beyblade comes with, from its type, look and era (Spin Gear System, Magnacore, Engine Gear, Hard Metal)
function stockModels(d, key) {
  const type = d.el, shape = d.bey && d.bey.shape, season = d.season || 1, gen = key ? String(key).split("-").pop() : "";
  const ms = gen === "ms" || (d.bey && d.bey.r === 37), eg = season === 3 && (gen === "g" || gen === "gt" || gen === "v");
  const left = !!d.left;
  const ar = ms ? "metal" : type === "Attack" ? ({ spike: "spike", saw: "smash", claw: "upper" }[shape] || "wing")
    : type === "Defense" ? "defring" : type === "Endurance" ? "survivor" : shape === "claw" ? "upper" : "wing";
  const wd = type === "Attack" ? "sixatk" : type === "Defense" ? "widedef" : type === "Endurance" ? "tenwide" : season === 2 ? "magne" : "tenbal";
  const sg = ms ? "dual" : eg ? (left ? "egl" : "egr") : season === 2 ? (left ? "neol" : "neor") : (left ? "lsg" : "rsg");
  const bb = type === "Attack" ? (d.blader === "Tyson" && !eg ? "grip" : eg ? "instant" : "flat")
    : type === "Defense" ? "ball" : type === "Endurance" ? (d.rar >= 5 ? "bearing" : "sharp") : "semiflat";
  return { ar, wd, sg, bb };
}
// the models and stat scales a unit fights with: fitted parts where there are any, stock parts elsewhere
function buildOf(d, key, partIds) {
  const stock = stockModels(d, key), out = {};
  for (const s of PART_SLOTS) {
    const p = partIds && partIds[s] != null && typeof partById === "function" ? partById(partIds[s]) : null;
    out[s] = p ? { m: p.m, f: partScale(p.rar, p.lvl), part: p } : { m: stock[s], f: PART_Q[0], part: null };
  }
  return out;
}
function applyPartStats(st, build) {
  for (const s of PART_SLOTS) {
    const { m, f } = build[s], bonus = PART_MODELS[m].stat || {};
    for (const k in bonus) {
      if (k === "atk" || k === "def" || k === "hp") st[k] *= 1 + bonus[k] * f;
      else st[k] = (st[k] || 0) + bonus[k] * f;
    }
  }
}
// the physics a build gives in the dish (see the trait list above); type traits lean it further
function physOf(build, el) {
  const M = s => PART_MODELS[build[s].m];
  const ar = M("ar"), wd = M("wd"), sg = M("sg"), bb = M("bb");
  const sum = k => (ar[k] || 0) + (wd[k] || 0) + (sg[k] || 0) + (bb[k] || 0);
  const P = {
    weight: (wd.weight || 1) + (ar.weight || 0), speed: Math.max(.35, 1 + (bb.speed || 0) + (wd.speed || 0)),
    drive: bb.drive ?? 1, aggro: bb.aggro ?? .3, center: sum("center"), stamina: sum("stamina"),
    smash: (ar.smash || 1) * (1 + (bb.smash || 0)), guard: sum("guard"), recoil: ar.recoil ?? 1, absorb: ar.absorb || 0,
    spin: sg.spin || "R", burst: sg.burst ? sg.burst + (bb.burst || 0) : 0,
  };
  if (el === "Attack") P.smash *= 1.15;
  if (el === "Defense") P.guard += .2;
  if (el === "Endurance") P.stamina += .4;
  return P;
}

// ---------- owned parts ----------
// { id, m (model), rar (grade 1–5), lvl (0–15), eq: { k (Beyblade), s (slot) } or null }
function makePart(m, rar) { return { id: S.partSeq++, m, rar, lvl: 0, eq: null }; }
const partById = id => id == null ? null : (S.parts || []).find(p => p.id === id);
const partName = p => PART_MODELS[p.m].n;
const partSlot = p => PART_MODELS[p.m].slot;
const partCost = p => 400 * (p.lvl + 1) * p.rar;
const partSellValue = p => Math.round(300 * p.rar * (1 + p.lvl / 5));
const randomModel = pool => pick(pool && pool.length ? pool : Object.keys(PART_MODELS));
