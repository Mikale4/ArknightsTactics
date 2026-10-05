"""Pull each roster operator's real trait, talents, skills and E2 stats out of the Arknights game data.

Usage: python mobile/tools/extract_kits.py <gamedata_dir_en> <gamedata_dir_cn> mobile/tools/real.json
The game data dirs hold character_table.json, skill_table.json and uniequip_table.json from
Kengxxiao/ArknightsGameData_YoStar (en_US) and Kengxxiao/ArknightsGameData (zh_CN).
The output feeds merge_kits.py (cooldowns, stats, unlocks, names) and the translators; the game never loads it.
"""
import json, re, sys, os

EN, CN, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
load = lambda d, f: json.load(open(os.path.join(d, f + ".json"), encoding="utf-8"))
ct, st, ue = load(EN, "character_table"), load(EN, "skill_table"), load(EN, "uniequip_table")
cct, cst = load(CN, "character_table"), load(CN, "skill_table")

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
src = open(os.path.join(ROOT, "mobile/src/a3a_roster.js"), encoding="utf-8").read()
roster = [l.split("|") for l in src.split("`")[1].strip().split("\n")]

PROF = {"PIONEER": "Vanguard", "WARRIOR": "Guard", "TANK": "Defender", "SNIPER": "Sniper", "CASTER": "Caster",
        "MEDIC": "Medic", "SUPPORT": "Supporter", "SPECIAL": "Specialist"}
# roster names that differ from the game data, and Integrated Strategies operators that exist in several versions
ALIAS = {"Miss Christine": "char_4198_christ", "Viviana Droste": "char_4098_vvana", "Togawa Sakiko": "char_4182_oblvns",
         "Pith": "char_509_acast", "Sharp": "char_508_aguard", "Tulip": "char_513_apionr", "Shalem": "char_4025_aprot2"}
by_name = {}
for k, v in ct.items():
    if k.startswith("char_") and not v.get("isNotObtainable"):
        by_name.setdefault(v["name"].lower(), k)

def bb(lst):
    return {x["key"]: (x["value"] if x.get("valueStr") is None else x["valueStr"]) for x in (lst or [])}

def resolve(text, board):
    if not text: return ""
    low = {k.lower(): v for k, v in board.items()}
    def sub(m):
        key, fmt = m.group(1), m.group(2) or ""
        neg = key.startswith("-")
        k = key.lstrip("-").lower()
        if k not in low: return m.group(0)
        v = low[k]
        if isinstance(v, str): return v
        v = -v if neg else v
        if fmt.endswith("%"):
            v *= 100; dec = fmt[:-1].split(".")[1] if "." in fmt else ""
            return f"{v:.{len(dec)}f}%"
        if "." in fmt: return f"{v:.{len(fmt.split('.')[1])}f}"
        return f"{v:g}"
    text = re.sub(r"\{([-\w@\.\[\]]+)(?::([0-9.%]+))?\}", sub, text)
    text = re.sub(r"<[@$][^>]*>|</>", "", text)
    return text.replace("\n", "\n").strip()

def sp_type(t):
    return {"INCREASE_WITH_TIME": "auto", "INCREASE_WHEN_ATTACK": "offensive", "INCREASE_WHEN_TAKEN_DAMAGE": "defensive",
            1: "auto", 2: "offensive", 4: "defensive", 8: "none"}.get(t, str(t))

def skill_info(sid, table):
    s = table.get(sid)
    if not s: return None
    lv = s["levels"]
    def at(i):
        L = lv[min(i, len(lv) - 1)]
        b = bb(L["blackboard"]); b.setdefault("duration", L["duration"])
        return {"desc": resolve(L["description"], b), "spCost": L["spData"]["spCost"], "initSp": L["spData"]["initSp"],
                "duration": L["duration"], "blackboard": b}
    L7 = lv[min(6, len(lv) - 1)]
    out = {"name": L7["name"], "skillType": L7["skillType"], "durationType": L7["durationType"],
           "spType": sp_type(L7["spData"]["spType"]), "lv1": at(0), "lv7": at(6)}
    if len(lv) > 7: out["m3"] = at(9)
    return out

subprof = {k: v["subProfessionName"] for k, v in ue.get("subProfDict", {}).items()}

ops = []
for name, slug, rar, cls, el, asp in roster:
    cid = ALIAS.get(name) or by_name.get(name.lower())
    use_cn = cid not in ct
    C = (cct if use_cn else ct)[cid]
    skt = cst if use_cn else st
    data = C["phases"][-1]["attributesKeyFrames"][-1]["data"]
    trait_bb = bb(C["trait"]["candidates"][-1]["blackboard"]) if C.get("trait") else {}
    trait_desc = C["trait"]["candidates"][-1].get("overrideDescripton") if C.get("trait") else None
    talents = []
    for t in C.get("talents") or []:
        cands = [c for c in t["candidates"] if not c.get("isHideTalent")]
        if not cands: continue
        best = cands[-1]
        b = bb(best["blackboard"])
        talents.append({"name": best["name"], "elite": int(cands[0]["unlockCondition"]["phase"][-1]) if isinstance(cands[0]["unlockCondition"]["phase"], str) else cands[0]["unlockCondition"]["phase"],
                        "desc": resolve(best["description"], b), "blackboard": b})
    skills = []
    for i, s in enumerate(C.get("skills") or []):
        info = skill_info(s["skillId"], skt)
        if not info: continue
        ph = s["unlockCond"]["phase"]
        info["elite"] = int(ph[-1]) if isinstance(ph, str) else ph
        info["id"] = s["skillId"]
        skills.append(info)
    ops.append({
        "slug": slug, "name": name, "id": cid, "server": "CN" if use_cn else "EN",
        "rarity": int(C["rarity"].split("_")[1]) if isinstance(C["rarity"], str) else C["rarity"] + 1,
        "class": PROF[C["profession"]], "rosterClass": cls, "branch": C["subProfessionId"],
        "branchName": subprof.get(C["subProfessionId"], C["subProfessionId"]), "position": C["position"],
        "trait": resolve(trait_desc or C["description"], trait_bb),
        "stats": {"hp": data["maxHp"], "atk": data["atk"], "def": data["def"], "res": data["magicResistance"],
                  "interval": data["baseAttackTime"], "block": data["blockCnt"], "cost": data["cost"], "redeploy": data["respawnTime"]},
        "talents": talents, "skills": skills,
    })
json.dump(ops, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(ops), "operators ->", OUT)
