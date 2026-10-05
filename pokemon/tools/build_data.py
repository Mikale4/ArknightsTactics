#!/usr/bin/env python3
"""Generate pokemon/src/a3a_dex.js: the 151 Kanto Pokémon, their Gen 1 moves and three-move kits.

Source: PokeAPI's CSV dump (https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv), downloaded on demand
into pokemon/tools/.pokeapi/ (gitignored). Run from anywhere:  python3 pokemon/tools/build_data.py

What it decides:
  * typings as they were in Red/Blue (no Fairy or Steel: Clefairy is Normal, Magnemite is pure Electric)
  * evolutions inside the first 151 only (level, evolution stone, or trade -> Linking Cord)
  * learnsets from Red/Blue/Yellow (level-up and TM/HM moves)
  * one Ability per Pokemon: the first of its abilities that has a battle effect in this game
  * a kit of three moves: S1 a cheap move (no cooldown), S2 a utility or coverage move, S3 its strongest move.
    KITS below overrides the automatic pick; every override is checked against the Gen 1 learnset.
  * rarity for the Safari Zone (3 to 5 stars); legendaries and Mew are never in the Safari Zone.
"""
import csv, json, os, subprocess, sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
CSV_DIR = os.environ.get("POKEAPI_CSV") or os.path.join(HERE, ".pokeapi")
OUT = os.path.join(HERE, "..", "src", "a3a_dex.js")
FILES = ["pokemon_species", "pokemon_species_names", "pokemon", "pokemon_types", "types", "pokemon_stats", "pokemon_abilities",
         "abilities", "pokemon_evolution", "pokemon_moves", "moves", "move_names", "move_meta", "move_meta_stat_changes",
         "move_flag_map", "pokemon_species_names"]


def rows(name):
    path = os.path.join(CSV_DIR, name + ".csv")
    if not os.path.exists(path):
        os.makedirs(CSV_DIR, exist_ok=True)
        url = f"https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/{name}.csv"
        subprocess.run(["curl", "-sf", "--retry", "3", "-o", path, url], check=True)
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))


TYPE = {r["id"]: r["identifier"] for r in rows("types")}
cap = lambda s: s[0].upper() + s[1:]

# ---------- species ----------
species = {int(r["id"]): r for r in rows("pokemon_species") if int(r["id"]) <= 151}
names, genus = {}, {}
for r in rows("pokemon_species_names"):
    sid = int(r["pokemon_species_id"])
    if sid <= 151 and r["local_language_id"] == "9":
        names[sid] = r["name"]
        genus[sid] = r["genus"].replace(" Pokémon", "")
poke = {int(r["id"]): r for r in rows("pokemon") if int(r["id"]) <= 151}
types = defaultdict(list)
for r in sorted(rows("pokemon_types"), key=lambda r: int(r["slot"])):
    if int(r["pokemon_id"]) <= 151:
        types[int(r["pokemon_id"])].append(cap(TYPE[r["type_id"]]))
# Red/Blue typings (Fairy and Steel arrived later)
GEN1_TYPES = {35: ["Normal"], 36: ["Normal"], 39: ["Normal"], 40: ["Normal"], 122: ["Psychic"], 81: ["Electric"], 82: ["Electric"]}
types.update(GEN1_TYPES)
STAT = {"1": "hp", "2": "atk", "3": "def", "4": "spa", "5": "sdf", "6": "spe"}
base = defaultdict(dict)
for r in rows("pokemon_stats"):
    if int(r["pokemon_id"]) <= 151:
        base[int(r["pokemon_id"])][STAT[r["stat_id"]]] = int(r["base_stat"])
sid_key = {}
for sid, r in species.items():
    sid_key[sid] = r["identifier"].replace("-", "")  # Showdown ids: mrmime, nidoranf, farfetchd

# ---------- abilities ----------
AB = {r["id"]: r["identifier"] for r in rows("abilities")}
abil = defaultdict(list)
for r in sorted(rows("pokemon_abilities"), key=lambda r: int(r["slot"])):
    if int(r["pokemon_id"]) <= 151:
        abil[int(r["pokemon_id"])].append((AB[r["ability_id"]], r["is_hidden"] == "1"))
# abilities with a battle effect in this game (see ABILITY in a3b_kits.js)
IMPLEMENTED = set("""overgrow blaze torrent swarm static poison-point flame-body effect-spore cute-charm poison-touch stench intimidate
levitate water-absorb volt-absorb dry-skin flash-fire lightning-rod thick-fat insomnia vital-spirit limber immunity own-tempo oblivious
magma-armor water-veil inner-focus clear-body hyper-cutter keen-eye big-pecks sturdy rock-head shed-skin natural-cure hydration guts
compound-eyes shield-dust battle-armor shell-armor swift-swim chlorophyll sand-rush sand-veil snow-cloak rain-dish ice-body solar-power
synchronize download pressure damp liquid-ooze soundproof early-bird pickup technician sheer-force hustle iron-fist reckless no-guard
skill-link serene-grace adaptability magic-guard multiscale marvel-scale filter tinted-lens sniper weak-armor anger-point defiant
competitive steadfast moxie scrappy infiltrator cursed-body friend-guard imposter arena-trap rattled unnerve run-away""".split())
# abilities that only work in weather or are a weak fit, picked only when nothing better is available
WEAK = set("swift-swim chlorophyll sand-rush sand-veil snow-cloak rain-dish ice-body solar-power hydration run-away unnerve rattled".split())
ABILITY_PICK = {  # classic or more fitting choices
    "ditto": "imposter", "eevee": "adaptability", "porygon": "download", "gengar": "levitate", "dragonite": "multiscale",
    "snorlax": "thick-fat", "machamp": "no-guard", "machoke": "no-guard", "machop": "no-guard", "alakazam": "magic-guard",
    "kadabra": "synchronize", "abra": "synchronize", "gyarados": "intimidate", "tauros": "intimidate", "clefable": "magic-guard",
    "scyther": "technician", "meowth": "pickup", "persian": "technician", "kangaskhan": "scrappy", "pinsir": "moxie",
    "chansey": "serene-grace", "lapras": "water-absorb", "starmie": "natural-cure", "staryu": "natural-cure", "cloyster": "skill-link",
    "shellder": "skill-link", "vileplume": "effect-spore", "parasect": "effect-spore", "paras": "effect-spore", "magikarp": "rattled",
    "mrmime": "filter", "butterfree": "tinted-lens", "venomoth": "tinted-lens", "hitmonchan": "iron-fist", "hitmonlee": "reckless",
    "nidoking": "sheer-force", "nidoqueen": "sheer-force", "slowbro": "own-tempo", "slowpoke": "own-tempo", "electrode": "static",
    "voltorb": "static", "marowak": "rock-head", "cubone": "rock-head", "weezing": "levitate", "koffing": "levitate", "arcanine": "intimidate",
    "growlithe": "intimidate", "rhydon": "rock-head", "rhyhorn": "rock-head", "aerodactyl": "rock-head", "magneton": "sturdy",
    "magnemite": "sturdy", "golem": "sturdy", "graveler": "sturdy", "geodude": "sturdy", "onix": "sturdy", "kabutops": "battle-armor",
    "kabuto": "battle-armor", "omastar": "shell-armor", "omanyte": "shell-armor", "pidgeot": "keen-eye", "dodrio": "early-bird",
    "doduo": "early-bird", "ponyta": "flash-fire", "rapidash": "flash-fire", "golduck": "damp", "psyduck": "damp", "seadra": "sniper",
    "horsea": "sniper", "seaking": "lightning-rod", "goldeen": "lightning-rod", "rattata": "guts", "raticate": "guts", "beedrill": "sniper",
    "farfetchd": "inner-focus", "dragonair": "marvel-scale", "dratini": "marvel-scale", "gloom": "stench", "oddish": "run-away",
    "sandshrew": "sand-veil", "sandslash": "sand-veil", "diglett": "arena-trap", "dugtrio": "arena-trap", "tangela": "chlorophyll",
    "exeggutor": "chlorophyll", "exeggcute": "chlorophyll", "victreebel": "chlorophyll", "weepinbell": "chlorophyll", "bellsprout": "chlorophyll",
}
KEY_TO_SID = {}


def pick_ability(sid):
    key = sid_key[sid]
    if key in ABILITY_PICK:
        return ABILITY_PICK[key]
    opts = abil[sid]
    for want_hidden in (False, True):
        for a, hidden in opts:
            if hidden == want_hidden and a in IMPLEMENTED and a not in WEAK:
                return a
    for a, hidden in opts:
        if a in IMPLEMENTED:
            return a
    return opts[0][0]


# ---------- evolutions (inside the 151) ----------
ITEM = {"81": "moonstone", "82": "firestone", "83": "thunderstone", "84": "waterstone", "85": "leafstone"}
evos = defaultdict(list)
prev = {}
for r in rows("pokemon_evolution"):
    to = int(r["evolved_species_id"])
    if to > 151:
        continue
    frm = int(species[to]["evolves_from_species_id"] or 0)
    if not frm or frm > 151:
        continue
    trig = r["evolution_trigger_id"]
    e = {"to": sid_key[to]}
    if trig == "1" and r["minimum_level"]:
        e["lv"] = int(r["minimum_level"])
    elif trig == "3" and r["trigger_item_id"] in ITEM:
        e["item"] = ITEM[r["trigger_item_id"]]
    elif trig == "2" and not r["held_item_id"] and not r["trade_species_id"]:
        e["item"] = "linkcord"  # trade evolutions: the Linking Cord stands in for a trade
    else:
        continue
    if not any(x["to"] == e["to"] for x in evos[frm]):
        evos[frm].append(e)
        prev[to] = sid_key[frm]

# ---------- moves ----------
MV = {}
for r in rows("moves"):
    if r["generation_id"] == "1":
        MV[int(r["id"])] = r
mname = {int(r["move_id"]): r["name"] for r in rows("move_names") if r["local_language_id"] == "9"}
meta = {int(r["move_id"]): r for r in rows("move_meta")}
stch = defaultdict(list)
for r in rows("move_meta_stat_changes"):
    stch[int(r["move_id"])].append((int(r["stat_id"]), int(r["change"])))
flags = defaultdict(set)
FLAG = {"1": "contact", "8": "punch", "9": "sound", "15": "powder", "16": "bite"}
for r in rows("move_flag_map"):
    if r["move_flag_id"] in FLAG:
        flags[int(r["move_id"])].add(FLAG[r["move_flag_id"]])
ST = {1: "hp", 2: "atk", 3: "def", 4: "spa", 5: "sdf", 6: "spe", 7: "acc", 8: "eva"}
AIL = {"1": "PAR", "2": "SLP", "3": "FRZ", "4": "BRN", "5": "PSN", "6": "CNF", "7": "INFAT", "8": "TRAP", "13": "DISABLE", "18": "SEED"}
# moves whose effect is handled by name in the engine
SPECIAL = {"transform", "metronome", "splash", "haze", "rest", "reflect", "light-screen", "substitute", "mist", "focus-energy",
           "dream-eater", "pay-day", "super-fang", "dragon-rage", "sonic-boom", "night-shade", "seismic-toss", "psywave", "fissure",
           "horn-drill", "guillotine", "self-destruct", "explosion", "hyper-beam", "roar", "whirlwind", "toxic", "teleport", "conversion",
           "counter", "bide", "mimic", "mirror-move", "rage", "disable", "recover", "soft-boiled", "leech-seed"}
TARGET = {"7": "self", "10": "one", "11": "foes", "9": "foes", "8": "one", "13": "team", "4": "team", "3": "ally", "5": "ally",
          "6": "foes", "12": "field", "14": "field", "2": "one", "1": "one", "15": "team"}


def move_entry(mid):
    r, m = MV[mid], meta.get(mid, {})
    key = r["identifier"].replace("-", "")
    t = cap(TYPE[r["type_id"]])
    if r["identifier"] == "bite":
        t = "Normal"  # no Dark type in Kanto
    e = {"n": mname[mid], "t": t, "c": {"1": "X", "2": "P", "3": "S"}[r["damage_class_id"]], "p": int(r["power"] or 0),
         "a": int(r["accuracy"] or 0), "pp": int(r["pp"] or 0)}
    if int(r["priority"] or 0):
        e["pri"] = int(r["priority"])
    tg = TARGET.get(r["target_id"], "one")
    if tg != "one":
        e["tg"] = tg
    if m:
        if m.get("min_hits"):
            e["hit"] = [int(m["min_hits"]), int(m["max_hits"])]
        ail = AIL.get(m["meta_ailment_id"])
        if ail:
            e["ail"] = ail
            e["ac"] = int(m["ailment_chance"] or 0) or 100
        if r["identifier"] == "toxic":
            e["ail"] = "TOX"
        if int(m["flinch_chance"] or 0):
            e["fl"] = int(m["flinch_chance"])
        if int(m["crit_rate"] or 0):
            e["cr"] = int(m["crit_rate"])
        if int(m["drain"] or 0):
            e["dr"] = int(m["drain"])
        if int(m["healing"] or 0):
            e["hl"] = int(m["healing"])
        if stch.get(mid):
            e["st"] = [[ST[s], c] for s, c in stch[mid]]
            e["sc"] = int(m["stat_chance"] or 0) or 100
            # who the stat change applies to: status moves follow their target; damaging moves lower the target or raise the user
            if e["c"] == "X":
                e["sw"] = "self" if tg in ("self", "team") else "foes" if tg == "foes" else "target"
            else:
                e["sw"] = "self" if all(c > 0 for _, c in stch[mid]) else "target"
    fl = flags.get(mid, set())
    for f, k in (("contact", "ct"), ("punch", "pu"), ("sound", "so"), ("powder", "pw")):
        if f in fl:
            e[k] = 1
    if r["identifier"] in SPECIAL:
        e["sp"] = r["identifier"].replace("-", "")
    return key, e


MOVES = {}
by_ident = {}
for mid in MV:
    k, e = move_entry(mid)
    MOVES[k] = e
    by_ident[k] = mid

learn = defaultdict(set)
learn_lv = defaultdict(dict)
for r in rows("pokemon_moves"):
    pid = int(r["pokemon_id"])
    if pid <= 151 and r["version_group_id"] in ("1", "2") and r["pokemon_move_method_id"] in ("1", "4"):
        mid = int(r["move_id"])
        if mid in MV:
            k = MV[mid]["identifier"].replace("-", "")
            learn[pid].add(k)
            if r["pokemon_move_method_id"] == "1":
                learn_lv[pid][k] = min(learn_lv[pid].get(k, 999), int(r["level"] or 1))

# ---------- kits ----------
# hand-picked kits [S1, S2, S3] for flavour and balance; anything not listed is picked automatically
KITS = {
    "bulbasaur": ["tackle", "leechseed", "razorleaf"], "ivysaur": ["vinewhip", "sleeppowder", "razorleaf"],
    "venusaur": ["razorleaf", "sleeppowder", "solarbeam"], "charmander": ["ember", "leer", "slash"],
    "charmeleon": ["ember", "slash", "flamethrower"], "charizard": ["ember", "slash", "fireblast"],
    "squirtle": ["bubble", "withdraw", "bite"], "wartortle": ["watergun", "bite", "surf"], "blastoise": ["watergun", "bite", "hydropump"],
    "caterpie": ["tackle", "stringshot"], "metapod": ["harden"], "butterfree": ["confusion", "sleeppowder", "psybeam"],
    "weedle": ["poisonsting", "stringshot"], "kakuna": ["harden"], "beedrill": ["twineedle", "agility", "pinmissile"],
    "pidgey": ["gust", "sandattack", "quickattack"], "pidgeotto": ["gust", "quickattack", "wingattack"], "pidgeot": ["wingattack", "agility", "skyattack"],
    "rattata": ["quickattack", "focusenergy", "hyperfang"], "raticate": ["quickattack", "focusenergy", "superfang"],
    "spearow": ["peck", "leer", "furyattack"], "fearow": ["peck", "agility", "drillpeck"],
    "ekans": ["poisonsting", "glare", "acid"], "arbok": ["acid", "glare", "earthquake"] ,
    "pikachu": ["thundershock", "thunderwave", "thunderbolt"], "raichu": ["thundershock", "thunderwave", "thunder"],
    "sandshrew": ["scratch", "sandattack", "slash"], "sandslash": ["slash", "swift", "earthquake"],
    "nidoranf": ["scratch", "tailwhip", "doublekick"], "nidorina": ["bite", "growl", "doublekick"], "nidoqueen": ["doublekick", "bodyslam", "earthquake"],
    "nidoranm": ["poisonsting", "focusenergy", "hornattack"], "nidorino": ["hornattack", "focusenergy", "doublekick"], "nidoking": ["doublekick", "thunderbolt", "earthquake"],
    "clefairy": ["pound", "sing", "metronome"], "clefable": ["doubleslap", "sing", "metronome"],
    "vulpix": ["ember", "confuseray", "flamethrower"], "ninetales": ["quickattack", "roar", "fireblast"],
    "jigglypuff": ["pound", "sing", "bodyslam"], "wigglytuff": ["doubleslap", "sing", "doubleedge"],
    "zubat": ["leechlife", "supersonic", "wingattack"], "golbat": ["leechlife", "confuseray", "wingattack"],
    "oddish": ["absorb", "poisonpowder", "acid"], "gloom": ["absorb", "stunspore", "petaldance"], "vileplume": ["megadrain", "sleeppowder", "petaldance"],
    "paras": ["scratch", "stunspore", "leechlife"], "parasect": ["leechlife", "spore", "slash"],
    "venonat": ["confusion", "poisonpowder", "psybeam"], "venomoth": ["confusion", "sleeppowder", "psychic"],
    "diglett": ["scratch", "sandattack", "dig"], "dugtrio": ["slash", "sandattack", "earthquake"],
    "meowth": ["payday", "bite", "slash"], "persian": ["payday", "screech", "slash"],
    "psyduck": ["watergun", "disable", "confusion"], "golduck": ["watergun", "disable", "hydropump"],
    "mankey": ["karatechop", "leer", "lowkick"], "primeape": ["karatechop", "focusenergy", "submission"],
    "growlithe": ["ember", "roar", "takedown"], "arcanine": ["ember", "roar", "fireblast"],
    "poliwag": ["bubble", "hypnosis", "watergun"], "poliwhirl": ["watergun", "hypnosis", "bodyslam"], "poliwrath": ["watergun", "hypnosis", "submission"],
    "abra": ["psywave", "thunderwave", "psychic"], "kadabra": ["confusion", "recover", "psybeam"], "alakazam": ["confusion", "recover", "psychic"],
    "machop": ["karatechop", "focusenergy", "lowkick"], "machoke": ["karatechop", "focusenergy", "submission"], "machamp": ["karatechop", "rockslide", "submission"],
    "bellsprout": ["vinewhip", "sleeppowder", "acid"], "weepinbell": ["vinewhip", "stunspore", "razorleaf"], "victreebel": ["razorleaf", "sleeppowder", "solarbeam"],
    "tentacool": ["poisonsting", "supersonic", "bubblebeam"], "tentacruel": ["acid", "barrier", "hydropump"],
    "geodude": ["tackle", "defensecurl", "rockthrow"], "graveler": ["rockthrow", "selfdestruct", "earthquake"], "golem": ["rockthrow", "earthquake", "explosion"],
    "ponyta": ["ember", "growl", "stomp"], "rapidash": ["ember", "agility", "fireblast"],
    "slowpoke": ["confusion", "disable", "watergun"], "slowbro": ["watergun", "amnesia", "psychic"],
    "magnemite": ["thundershock", "thunderwave", "swift"], "magneton": ["thundershock", "supersonic", "thunderbolt"],
    "farfetchd": ["peck", "swordsdance", "slash"], "doduo": ["peck", "growl", "furyattack"], "dodrio": ["peck", "agility", "triattack"],
    "seel": ["headbutt", "growl", "aurorabeam"], "dewgong": ["aurorabeam", "rest", "icebeam"],
    "grimer": ["pound", "disable", "sludge"], "muk": ["pound", "minimize", "sludge"],
    "shellder": ["tackle", "withdraw", "aurorabeam"], "cloyster": ["clamp", "spikecannon", "blizzard"],
    "gastly": ["lick", "confuseray", "nightshade"], "haunter": ["lick", "hypnosis", "nightshade"], "gengar": ["nightshade", "hypnosis", "dreameater"],
    "onix": ["rockthrow", "harden", "rockslide"], "drowzee": ["pound", "hypnosis", "confusion"], "hypno": ["confusion", "hypnosis", "psychic"],
    "krabby": ["bubble", "harden", "crabhammer"], "kingler": ["vicegrip", "swordsdance", "crabhammer"],
    "voltorb": ["tackle", "screech", "selfdestruct"], "electrode": ["swift", "lightscreen", "explosion"],
    "exeggcute": ["barrage", "hypnosis", "psychic"], "exeggutor": ["barrage", "hypnosis", "psychic"],
    "cubone": ["boneclub", "growl", "bonemerang"], "marowak": ["boneclub", "focusenergy", "bonemerang"],
    "hitmonlee": ["doublekick", "meditate", "highjumpkick"], "hitmonchan": ["cometpunch", "agility", "megapunch"],
    "lickitung": ["stomp", "screech", "slam"], "koffing": ["tackle", "smog", "sludge"], "weezing": ["smog", "haze", "explosion"],
    "rhyhorn": ["hornattack", "stomp", "takedown"], "rhydon": ["hornattack", "rockslide", "earthquake"],
    "chansey": ["pound", "softboiled", "seismictoss"], "tangela": ["vinewhip", "sleeppowder", "megadrain"],
    "kangaskhan": ["cometpunch", "bite", "megapunch"], "horsea": ["bubble", "smokescreen", "watergun"], "seadra": ["watergun", "agility", "hydropump"],
    "goldeen": ["peck", "supersonic", "hornattack"], "seaking": ["peck", "supersonic", "waterfall"],
    "staryu": ["watergun", "recover", "swift"], "starmie": ["watergun", "thunderwave", "psychic"],
    "mrmime": ["confusion", "barrier", "psychic"], "scyther": ["quickattack", "swordsdance", "slash"],
    "jynx": ["pound", "lovelykiss", "icebeam"], "electabuzz": ["thundershock", "lightscreen", "thunderpunch"],
    "magmar": ["ember", "smog", "firepunch"], "pinsir": ["vicegrip", "swordsdance", "submission"],
    "tauros": ["tackle", "leer", "bodyslam"], "magikarp": ["tackle", "splash"], "gyarados": ["bite", "leer", "hydropump"],
    "lapras": ["watergun", "sing", "icebeam"], "ditto": ["transform"], "eevee": ["quickattack", "sandattack", "takedown"],
    "vaporeon": ["watergun", "acidarmor", "hydropump"], "jolteon": ["thundershock", "pinmissile", "thunder"],
    "flareon": ["ember", "smog", "flamethrower"], "porygon": ["psybeam", "recover", "triattack"],
    "omanyte": ["watergun", "withdraw", "bubblebeam"], "omastar": ["watergun", "spikecannon", "hydropump"],
    "kabuto": ["scratch", "harden", "absorb"], "kabutops": ["slash", "swordsdance", "hydropump"],
    "aerodactyl": ["wingattack", "agility", "hyperbeam"], "snorlax": ["headbutt", "rest", "bodyslam"],
    "articuno": ["peck", "mist", "blizzard"], "zapdos": ["thundershock", "agility", "drillpeck"], "moltres": ["peck", "agility", "skyattack"],
    "dratini": ["wrap", "thunderwave", "dragonrage"], "dragonair": ["slam", "thunderwave", "hyperbeam"], "dragonite": ["slam", "agility", "hyperbeam"],
    "mewtwo": ["confusion", "recover", "psychic"], "mew": ["pound", "metronome", "psychic"],
}
# some Pokemon did not learn their signature move until Gen 2; allow these few
KIT_EXTRA = {}


def eff_power(k, sid):
    m = MOVES[k]
    if m["c"] == "X" or not m["p"]:
        return 0
    p = m["p"] * (m["a"] or 100) / 100
    if "hit" in m:
        p *= sum(m["hit"]) / 2
    if m["t"] in types[sid]:
        p *= 1.5
    b = base[sid]
    if (m["c"] == "P") != (b["atk"] >= b["spa"]):
        p *= .75
    if m.get("sp") in ("selfdestruct", "explosion"):
        p *= .4
    if m.get("dr", 0) < 0:
        p *= .9
    if m.get("sp") in ("fissure", "horndrill", "guillotine"):
        p = 0
    return p


def auto_kit(sid):
    L = sorted(learn[sid])
    dmg = [k for k in L if eff_power(k, sid) > 0]
    s1 = max([k for k in dmg if MOVES[k]["p"] * (sum(MOVES[k].get("hit", [1, 1])) / 2) <= 60 and (MOVES[k]["a"] or 100) >= 90] or dmg or ["tackle"],
             key=lambda k: eff_power(k, sid))
    s3 = max([k for k in dmg if k != s1] or [s1], key=lambda k: eff_power(k, sid))
    rest = [k for k in dmg if k not in (s1, s3)]
    s2 = max(rest, key=lambda k: eff_power(k, sid) * (1.3 if MOVES[k]["t"] != MOVES[s3]["t"] else 1)) if rest else None
    return [s1, s2, s3] if s2 else [s1, s3]


kits = {}
problems = []
for sid in range(1, 152):
    key = sid_key[sid]
    kit = KITS.get(key) or auto_kit(sid)
    for k in kit:
        if k not in MOVES:
            problems.append(f"{key}: unknown move {k}")
        elif k not in learn[sid] and k not in KIT_EXTRA.get(key, ()):
            problems.append(f"{key}: {k} is not in its Gen 1 learnset")
    kits[key] = kit
if problems:
    print("\n".join(problems))

# ---------- rarity ----------
FIVE = set("""bulbasaur ivysaur venusaur charmander charmeleon charizard squirtle wartortle blastoise eevee vaporeon jolteon flareon
dratini dragonair dragonite lapras snorlax aerodactyl omastar kabutops porygon chansey kangaskhan tauros scyther pinsir hitmonlee
hitmonchan gyarados alakazam gengar machamp golem mrmime""".split())
FOUR = set("""pikachu raichu clefairy clefable vulpix ninetales growlithe arcanine abra kadabra machoke haunter graveler poliwrath nidoking
nidoqueen wigglytuff vileplume victreebel tentacruel rapidash slowbro magneton dodrio dewgong muk cloyster onix hypno kingler electrode
exeggutor marowak lickitung weezing rhydon tangela seaking starmie jynx electabuzz magmar ditto farfetchd omanyte kabuto pidgeot golduck
primeape persian dugtrio sandslash arbok fearow venomoth butterfree beedrill raticate""".split())
LEGEND = {"articuno", "zapdos", "moltres", "mewtwo", "mew"}

# ---------- output ----------
dex = []
for sid in range(1, 152):
    key, s = sid_key[sid], species[sid]
    p = poke[sid]
    b = base[sid]
    d = {"id": sid, "k": key, "n": names[sid], "g": genus[sid], "t": types[sid],
         "b": [b["hp"], b["atk"], b["def"], b["spa"], b["sdf"], b["spe"]], "ab": pick_ability(sid),
         "h": int(p["height"]), "w": int(p["weight"]), "cr": int(s["capture_rate"]), "gr": int(s["growth_rate_id"]),
         "r": 5 if key in FIVE or key in LEGEND else 4 if key in FOUR else 3, "m": kits[key]}
    if key in LEGEND:
        d["leg"] = 1
    if evos.get(sid):
        d["evo"] = evos[sid]
    if sid in prev:
        d["from"] = prev[sid]
    # level each kit move is learned at (0 = TM/HM), shown on the summary screen
    d["ml"] = [learn_lv[sid].get(k, 0) for k in kits[key]]
    dex.append(d)

used = set(k for d in dex for k in d["m"])
# Metronome can call any damaging Gen 1 move
metronome = sorted(k for k, m in MOVES.items() if m["p"] and not m.get("sp") in ("selfdestruct", "explosion", "fissure", "horndrill", "guillotine"))
moves_out = {k: MOVES[k] for k in sorted(used | set(metronome))}
with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n// =====================================================================\n")
    f.write("//  POKÉDEX DATA — generated by pokemon/tools/build_data.py from PokeAPI. Do not edit by hand.\n")
    f.write("//  DEX: [{id, k (Showdown id), n, g (genus), t (types), b [HP Atk Def SpA SpD Spe], ab (Ability), h (dm), w (hg),\n")
    f.write("//         cr (catch rate), gr (growth rate), r (rarity), m [S1, S2, S3 move keys], ml (level learned, 0 = TM), evo, from, leg}]\n")
    f.write("//  MOVES: {key: {n, t (type), c (P physical / S special / X status), p (power), a (accuracy, 0 = never misses), pp, pri,\n")
    f.write("//          tg (target: one/foes/self/team/ally/field), hit [min,max], ail + ac (status + chance %), fl (flinch %),\n")
    f.write("//          cr (high crit), dr (drain %, negative = recoil), hl (heal %), st [[stat, stages]] + sc (chance %) + sw (who),\n")
    f.write("//          ct contact, pu punch, so sound, pw powder, sp (special handler)}}\n")
    f.write("// =====================================================================\n")
    f.write("const DEX = [\n" + ",\n".join(json.dumps(d, ensure_ascii=False, separators=(",", ":")) for d in dex) + "\n];\n")
    f.write("const MOVES = {\n" + ",\n".join(f"{json.dumps(k)}:{json.dumps(v, ensure_ascii=False, separators=(',', ':'))}" for k, v in moves_out.items()) + "\n};\n")
    f.write(f"const METRONOME = {json.dumps(metronome)};\n")
print(f"wrote {OUT}: {len(dex)} Pokemon, {len(moves_out)} moves")
if "-v" in sys.argv:
    for d in dex:
        print(f'{d["id"]:3} {d["n"]:11} {"/".join(d["t"]):16} r{d["r"]} {d["ab"]:14} {" | ".join(MOVES[k]["n"] for k in d["m"])}')
