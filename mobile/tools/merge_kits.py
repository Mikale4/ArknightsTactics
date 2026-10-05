"""Real-kit pipeline for Arknights Tactics Mobile.

  python mobile/tools/merge_kits.py build                      write mobile/src/a3b_real.js from kits/*.json + real.json
  python mobile/tools/merge_kits.py check <kits.json>          validate one file of translated kits
  python mobile/tools/merge_kits.py prep <out_dir> [size]      split untranslated operators into batches for translating

real.json is the extracted game data (made by extract_kits.py). Translated kits live in mobile/tools/kits/*.json,
in the format described in kits/KIT_FORMAT.md. Rebuild the game afterwards: sh mobile/src/build.sh
"""
import json, math, os, sys, glob, statistics

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
KITS = os.path.join(HERE, "kits")
REAL = os.path.join(HERE, "real.json")

# ---------- conversions from Arknights numbers to turns ----------
def cooldown(sk):
    """SP cost -> cooldown turns; initial SP -> starting cooldown."""
    L = sk["lv7"]; cost, init, t = L["spCost"], L["initSp"], sk["spType"]
    if t == "none" or sk["skillType"] == "PASSIVE": return 0, 0
    if t == "offensive": cd = math.floor(cost / 4) + 1
    elif t == "defensive": cd = math.floor(cost / 8) + 1
    else: cd = math.ceil(cost / 12) + 1
    cd = max(2, min(7, cd))
    cd0 = round(cd * max(0.0, 1 - init / cost)) if cost else 0
    return cd, max(0, min(cd, cd0))

def turns_for(sk):
    d = sk["lv7"]["duration"]
    if d < 0: return 99
    if d <= 0: return 0
    return max(1, min(5, math.floor(d / 8 + 0.5)))

# ---------- schema ----------
BUFFS = {"ATK_UP", "DEF_UP", "SPD_UP", "CRIT_RATE_UP", "RES_UP", "IMMUNITY", "HOT", "INVINCIBLE", "COUNTER", "TAUNT",
         "STEALTH", "DODGE", "DMG_REDUCE", "INSPIRE"}
DEBUFFS = {"DEF_BREAK", "ATK_DOWN", "RES_DOWN", "FRAGILE", "SLOW", "COLD", "BIND", "STUN", "SLEEP", "FREEZE", "LEVITATE",
           "SILENCE", "HEAL_BLOCK", "DOT", "FEAR"}
STATS = {"atk", "def", "hp", "spd", "cr", "cdmg", "ares", "aresPct", "res", "dodge", "dmgTaken", "heal"}
STATE_KEYS = STATS - {"aresPct"} | {"turns", "regen", "lifesteal", "taunt", "stealth", "counter", "reflect", "reflectDmg",
                                    "immune", "invincible", "drain", "onEnd", "basic"}
BASIC_KEYS = {"hits", "mult", "n", "aoe", "spread", "falloff", "front", "dmg", "ignoreDef", "ignoreRes", "heal", "healN", "reach", "effects"}
SKILL_KEYS = {"name", "desc", "auto", "target", "n", "spread", "hits", "mult", "dmg", "ignoreDef", "ignoreRes", "heal", "effects",
              "state", "passive", "basic"}
TARGETS = {"enemy", "enemies", "aoe_enemies", "ally_single", "self", "team", "allies"}
EFF_ON = {"target", "self", "team", "allies", "enemies", "lowest", "attacker", "random_enemy", "random_ally"}
EFF_TYPES = {"buff": {"what", "turns", "v"}, "debuff": {"what", "turns", "v"}, "dmg": {"mult", "dmg", "hits"},
             "heal": {"amount"}, "healPct": {"amount"}, "shield": {"amount", "pctHP", "turns"}, "atkbar+": {"amount"},
             "atkbar-": {"amount"}, "cleanse": {"amount"}, "strip": {"amount"}, "revive": {"amount"}, "cdReduce": {"amount"},
             "elem": {"kind", "amount"}, "bonusIf": {"cond", "bonusDmg", "bonusCrit"}, "bonusPerDebuff": {"per", "cap"},
             "retreat": set()}
TRIG = {"start", "wave", "turn", "attack", "hit", "hurt", "kill", "skill", "allyDeath", "lowhp"}
CONDS = {"hpBelow", "hpAbove", "targetHpBelow", "targetHpAbove", "targetHas", "targetDebuffed", "targetBoss", "selfHas",
         "skillActive", "attackerRanged", "attackerMelee", "alliesAlive", "enemiesAlive"}
WHO = {"team", "allies", "random_ally", "melee", "ranged", "enemies"}
SPECIALS = {"UNDYING", "REVIVE_ONCE", "LIFESTEAL", "NO_ALLY_HEAL", "IMMUNE_LIST", "TRUESIGHT"}
TALENT_KEYS = {"name", "desc", "stats", "aura", "while", "whileStats", "dmgBonus", "dmgReduce", "on", "cond", "chance", "once",
               "every", "effects", "triggers", "special", "amount", "turns", "list"}
ELEMS = {"burn", "necrosis", "nervous", "corrosion"}

class Bad(Exception): pass

def num(v, where, lo=-50, hi=100):
    if not isinstance(v, (int, float)) or isinstance(v, bool) or not (lo <= v <= hi): raise Bad(f"{where}: bad number {v!r}")

def check_stats(d, where, allowed=STATS):
    if not isinstance(d, dict): raise Bad(f"{where}: stats must be an object")
    for k, v in d.items():
        if k not in allowed: raise Bad(f"{where}: unknown stat {k}")
        num(v, f"{where}.{k}")

def check_cond(c, where):
    if not isinstance(c, dict): raise Bad(f"{where}: cond must be an object")
    for k, v in c.items():
        if k not in CONDS: raise Bad(f"{where}: unknown condition {k}")
        if k in ("targetHas", "selfHas") and v not in BUFFS | DEBUFFS: raise Bad(f"{where}: unknown status {v}")

def check_effects(lst, where, in_skill):
    if not isinstance(lst, list): raise Bad(f"{where}: effects must be a list")
    for i, e in enumerate(lst):
        w = f"{where}[{i}]"
        t = e.get("type")
        if t not in EFF_TYPES: raise Bad(f"{w}: unknown effect type {t!r}")
        if t in ("bonusIf", "bonusPerDebuff") and not in_skill: raise Bad(f"{w}: {t} only works in skills (use dmgBonus in talents)")
        allowed = EFF_TYPES[t] | {"on", "type", "chance", "onKill"}
        for k in e:
            if k not in allowed: raise Bad(f"{w}: unknown key {k} for {t}")
        if t not in ("bonusIf", "bonusPerDebuff") and e.get("on") not in EFF_ON: raise Bad(f"{w}: bad 'on' {e.get('on')!r}")
        if t == "buff" and e.get("what") not in BUFFS: raise Bad(f"{w}: unknown buff {e.get('what')!r}")
        if t == "debuff" and e.get("what") not in DEBUFFS: raise Bad(f"{w}: unknown debuff {e.get('what')!r}")
        if t == "bonusIf" and e.get("cond") not in BUFFS | DEBUFFS: raise Bad(f"{w}: bonusIf cond must be a status id")
        if t == "elem" and e.get("kind") not in ELEMS: raise Bad(f"{w}: unknown element {e.get('kind')!r}")
        if t == "dmg" and e.get("dmg", "phys") not in ("phys", "arts", "true"): raise Bad(f"{w}: bad dmg type")
        if t == "retreat" and e.get("on") != "self": raise Bad(f"{w}: retreat must be on self")
        for k in ("chance",):
            if k in e: num(e[k], f"{w}.{k}", 0, 1)
        if "turns" in e: num(e["turns"], f"{w}.turns", 1, 99)

def check_talent(t, where, named=True):
    for k in t:
        if k not in TALENT_KEYS: raise Bad(f"{where}: unknown key {k}")
    if named and not t.get("desc"): raise Bad(f"{where}: missing desc")
    if "stats" in t: check_stats(t["stats"], where + ".stats")
    if "aura" in t:
        a = t["aura"]; who = a.get("who", "")
        if not (who in WHO or (who.startswith("class:") and who[6:] in ("Vanguard", "Guard", "Defender", "Sniper", "Caster", "Medic", "Supporter", "Specialist"))):
            raise Bad(f"{where}.aura: bad who {who!r}")
        check_stats(a.get("stats", {}), where + ".aura.stats")
    if "while" in t: check_cond(t["while"], where + ".while"); check_stats(t.get("whileStats", {}), where + ".whileStats")
    for key in ("dmgBonus", "dmgReduce"):
        for i, b in enumerate(t.get(key, [])): check_cond(b.get("cond", {}), f"{where}.{key}[{i}]"); num(b.get("v"), f"{where}.{key}[{i}].v", -1, 5)
    trig = [t] if "on" in t else []
    trig += t.get("triggers", [])
    for i, g in enumerate(trig):
        if g.get("on") not in TRIG: raise Bad(f"{where}: bad trigger {g.get('on')!r}")
        if "cond" in g: check_cond(g["cond"], where + ".cond")
        check_effects(g.get("effects", []), f"{where}.trigger{i}.effects", False)
    if "on" not in t and "effects" in t: raise Bad(f"{where}: effects without 'on' trigger")
    if t.get("special") and t["special"] not in SPECIALS: raise Bad(f"{where}: unknown special {t['special']}")
    if t.get("special") == "IMMUNE_LIST":
        for s in t.get("list", []):
            if s not in DEBUFFS: raise Bad(f"{where}: IMMUNE_LIST bad status {s}")

def check_skill(s, where):
    for k in s:
        if k not in SKILL_KEYS: raise Bad(f"{where}: unknown key {k}")
    if not s.get("name") or not s.get("desc"): raise Bad(f"{where}: needs name and desc")
    if len(s["desc"]) > 220: raise Bad(f"{where}: desc too long ({len(s['desc'])})")
    if "passive" in s:
        check_talent(s["passive"], where + ".passive", named=False); return
    if "target" in s and s["target"] not in TARGETS: raise Bad(f"{where}: bad target {s['target']}")
    if s.get("dmg", "phys") not in ("phys", "arts", "true"): raise Bad(f"{where}: bad dmg")
    for k in ("mult", "hits", "n", "ignoreDef", "ignoreRes", "heal"):
        if k in s: num(s[k], f"{where}.{k}", 0, 30)
    if s.get("mult") and s.get("target", "enemy") not in ("enemy", "enemies", "aoe_enemies"): raise Bad(f"{where}: damage needs an enemy target")
    if s.get("heal") and s.get("target") not in ("ally_single", "team", "allies", "self"): raise Bad(f"{where}: heal needs an ally target")
    check_effects(s.get("effects", []), where + ".effects", True)
    if "state" in s:
        st = s["state"]
        for k in st:
            if k not in STATE_KEYS: raise Bad(f"{where}.state: unknown key {k}")
        num(st.get("turns", 0), where + ".state.turns", 1, 99)
        check_stats({k: v for k, v in st.items() if k in STATS}, where + ".state")
        if "onEnd" in st: check_effects(st["onEnd"], where + ".state.onEnd", False)
        if "basic" in st:
            for k in st["basic"]:
                if k not in BASIC_KEYS: raise Bad(f"{where}.state.basic: unknown key {k}")
            check_effects(st["basic"].get("effects", []), where + ".state.basic.effects", True)
    if not any(k in s for k in ("mult", "heal", "effects", "state")): raise Bad(f"{where}: does nothing")

def check_op(k, real):
    w = k.get("slug", "?")
    if w not in real: raise Bad(f"{w}: unknown slug")
    R = real[w]
    if len(k.get("skills", [])) != len(R["skills"]): raise Bad(f"{w}: has {len(k.get('skills', []))} skills, real has {len(R['skills'])}")
    if len(k.get("talents", [])) != len(R["talents"]): raise Bad(f"{w}: has {len(k.get('talents', []))} talents, real has {len(R['talents'])}")
    for i, s in enumerate(k["skills"]):
        check_skill(s, f"{w}.S{i + 1}")
        if R["server"] == "EN" and s["name"] != R["skills"][i]["name"]: raise Bad(f"{w}.S{i + 1}: name {s['name']!r} != real {R['skills'][i]['name']!r}")
        if (R["skills"][i]["skillType"] == "PASSIVE") != ("passive" in s): raise Bad(f"{w}.S{i + 1}: passive mismatch with the real skill type")
    for i, t in enumerate(k["talents"]):
        check_talent(t, f"{w}.T{i + 1}")
        if R["server"] == "EN" and t["name"] != R["talents"][i]["name"]: raise Bad(f"{w}.T{i + 1}: name {t['name']!r} != real {R['talents'][i]['name']!r}")

def load_real(p): return {o["slug"]: o for o in json.load(open(p, encoding="utf-8"))}

def load_kits():
    out = {}
    for f in sorted(glob.glob(os.path.join(KITS, "*.json"))):
        for k in json.load(open(f, encoding="utf-8")):
            out[k["slug"]] = k
    return out

# ---------- commands ----------
def prep(real_p, out_dir, size=24):
    real = load_real(real_p); done = load_kits()
    todo = sorted((o for o in real.values() if o["slug"] not in done), key=lambda o: (o["class"], o["branch"], o["name"]))
    os.makedirs(out_dir, exist_ok=True)
    n = math.ceil(len(todo) / size); per = math.ceil(len(todo) / n)
    for b in range(n):
        chunk = todo[b * per:(b + 1) * per]
        src = []
        for o in chunk:
            sk = []
            for s in o["skills"]:
                cd, cd0 = cooldown(s)
                sk.append({"name": s["name"], "unlock": f"E{s['elite']}", "type": s["skillType"], "sp": s["spType"],
                           "spCost": s["lv7"]["spCost"], "duration_s": s["lv7"]["duration"], "suggested_turns": turns_for(s),
                           "our_cooldown": cd, "desc_lv7": s["lv7"]["desc"], "values_lv7": s["lv7"]["blackboard"],
                           "desc_m3": s.get("m3", {}).get("desc")})
            src.append({"slug": o["slug"], "name": o["name"], "class": o["class"], "branch": o["branchName"], "trait": o["trait"],
                        "server": o["server"], "stats_e2": o["stats"],
                        "talents": [{"name": t["name"], "unlock": f"E{t['elite']}", "desc": t["desc"], "values": t["blackboard"]} for t in o["talents"]],
                        "skills": sk})
        json.dump(src, open(os.path.join(out_dir, f"batch_{b + 1:02d}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(f"batch_{b + 1:02d}.json", len(chunk), ", ".join(o["slug"] for o in chunk))

def check(kits_p, real_p):
    real = load_real(real_p); ok = 0; bad = 0
    for k in json.load(open(kits_p, encoding="utf-8")):
        try: check_op(k, real); ok += 1
        except Bad as e: print("ERROR", e); bad += 1
    print(f"{ok} ok, {bad} with errors")
    return bad == 0

def our_stats(real):
    """Real E2 stats -> this game's scale, relative to the class average and the rarity curve."""
    by_cls = {}
    for o in real.values(): by_cls.setdefault(o["class"], []).append(o["stats"])
    avg = {c: {k: statistics.mean(s[k] for s in v) for k in ("hp", "atk", "def", "interval")} for c, v in by_cls.items()}
    rf = {}
    for o in real.values():
        a = avg[o["class"]]
        rf.setdefault(o["rarity"], []).append(statistics.mean([o["stats"][k] / a[k] for k in ("hp", "atk", "def")]))
    rf = {r: statistics.mean(v) for r, v in rf.items()}
    BASE = {"Vanguard": (9500, 720, 520, 114), "Guard": (9200, 820, 500, 112), "Defender": (10500, 650, 650, 104),
            "Sniper": (8600, 900, 430, 113), "Caster": (8800, 840, 480, 108), "Medic": (10200, 620, 630, 110),
            "Supporter": (9300, 700, 520, 112), "Specialist": (9000, 780, 480, 117)}
    out = {}
    for slug, o in real.items():
        a, s, b, f = avg[o["class"]], o["stats"], BASE[o["class"]], rf[o["rarity"]]
        rel = lambda k, e, lo, hi: max(lo, min(hi, (s[k] / a[k] / f) ** e))
        out[slug] = {"hp": round(b[0] * rel("hp", .6, .7, 1.4)), "atk": round(b[1] * rel("atk", .6, .7, 1.4)),
                     "def": round(b[2] * rel("def", .5, .6, 1.5)),
                     "spd": round(b[3] * max(.88, min(1.12, (a["interval"] / s["interval"]) ** .15))),
                     "ares": round(s["res"]), "block": s["block"]}
    return out

def build(real_p):
    real = load_real(real_p); kits = load_kits()
    missing = [s for s in real if s not in kits]
    bad = 0
    for slug, k in kits.items():
        try: check_op(k, real)
        except Bad as e: print("ERROR", e); bad += 1
    if bad: sys.exit(f"{bad} operators have errors")
    stats = our_stats(real)
    lines = ["", "// =====================================================================",
             "//  REAL OPERATOR KITS — generated by mobile/tools/merge_kits.py from the Arknights game data",
             "//  and the translations in mobile/tools/kits/*.json. Format: mobile/tools/kits/KIT_FORMAT.md",
             "// =====================================================================",
             "const REAL = {"]
    for slug, o in real.items():
        k = kits.get(slug, {"skills": [], "talents": []})
        sk = []
        for i, s in enumerate(k["skills"]):
            R = o["skills"][i]; cd, cd0 = cooldown(R)
            s = dict(s); s["slot"] = i + 1; s["elite"] = R["elite"]
            if "passive" not in s: s["cd"] = cd; s["cd0"] = cd0
            sk.append(s)
        tl = []
        for i, t in enumerate(k["talents"]):
            t = dict(t); t["elite"] = o["talents"][i]["elite"]; tl.append(t)
        entry = {"r": o["rarity"], "c": o["class"], "b": o["branch"], "st": stats[slug], "sk": sk, "tl": tl}
        lines.append(f"  {json.dumps(slug)}: {json.dumps(entry, ensure_ascii=False, separators=(',', ':'))},")
    lines.append("};")
    open(os.path.join(ROOT, "mobile/src/a3b_real.js"), "w", encoding="utf-8").write("\n".join(lines) + "\n")
    print(f"wrote a3b_real.js: {len(kits)} translated, {len(missing)} missing", missing[:20])

if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "prep": prep(REAL, sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 24)
    elif cmd == "check": sys.exit(0 if check(sys.argv[2], REAL) else 1)
    elif cmd == "build": build(REAL)
