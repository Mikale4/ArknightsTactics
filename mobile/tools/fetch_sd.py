"""Download the Arknights SD (battle chibi) Spine sprites the game uses.

    python mobile/tools/fetch_sd.py

Source: github.com/Aceship/Arknight-Images, spineassets/character/<charId>/{front,back}/<charId>.{skel,atlas,png}
(default skin only) and spineassets/enemy/<enemyId>.{skel,atlas,png}. Hypergryph game assets, like the rest of assets/.
Operators come from voice_map.json (slug → charId); enemies from art_manifest.json ("enemies": game key → enemy id).
Output: assets/sd/char/<charId>/{front,back}/… and assets/sd/enemy/<enemyId>.…, plus the lists of available sprites
(with each skeleton's Spine version) written into mobile/src/a8d_sd.js (the @sd-* lines). Rebuild afterwards.
"""
import json, os, re, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, "assets", "sd")
SD_JS = os.path.join(ROOT, "mobile", "src", "a8d_sd.js")
API = "https://api.github.com/repos/Aceship/Arknight-Images"
RAW = "https://raw.githubusercontent.com/Aceship/Arknight-Images/main/spineassets/"


def get(url, binary=True):
    req = urllib.request.Request(url, headers={"User-Agent": "ArknightsTactics-fetch_sd"})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = r.read()
    return data if binary else json.loads(data)


def tree(name, recursive):
    top = get(API + "/contents/spineassets", binary=False)
    sha = next(x["sha"] for x in top if x["name"] == name)
    t = get(f"{API}/git/trees/{sha}" + ("?recursive=1" if recursive else ""), binary=False)
    return {x["path"] for x in t["tree"] if x["type"] == "blob"}


def fetch(rel, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if not os.path.exists(dst) or os.path.getsize(dst) == 0:
        open(dst, "wb").write(get(RAW + rel))
    return dst


def version(path):
    m = re.search(rb"([34]\.\d+\.\d+)", open(path, "rb").read(80))
    return m.group(1).decode() if m else "?"


def main():
    vmap = json.load(open(os.path.join(HERE, "voice_map.json"), encoding="utf-8"))
    man = json.load(open(os.path.join(HERE, "art_manifest.json"), encoding="utf-8"))
    chars, enemies = tree("character", True), tree("enemy", False)
    ops, ens, fails = {}, {}, []
    for slug, (_, cid) in sorted(vmap.items()):
        views = []
        for view in ("front", "back"):
            base = f"{cid}/{view}/{cid}"
            if base + ".skel" not in chars: continue
            try:
                for ext in (".skel", ".atlas", ".png"): fetch("character/" + base + ext, os.path.join(OUT, "char", base + ext))
                views.append(view)
            except Exception as e: fails.append((slug, view, str(e)))
        if "front" in views: ops[slug] = [cid, 1 if "back" in views else 0, version(os.path.join(OUT, "char", f"{cid}/front/{cid}.skel"))]
    for key, eid in sorted(man["enemies"].items()):
        if eid + ".skel" not in enemies: continue
        try:
            for ext in (".skel", ".atlas", ".png"): fetch("enemy/" + eid + ext, os.path.join(OUT, "enemy", eid + ext))
            ens[key] = [eid, version(os.path.join(OUT, "enemy", eid + ".skel"))]
        except Exception as e: fails.append((key, str(e)))
    js = open(SD_JS, encoding="utf-8").read()
    js = re.sub(r"const SD_OPS = \{.*?\}; // @sd-ops", "const SD_OPS = " + json.dumps(ops, separators=(",", ":")) + "; // @sd-ops", js)
    js = re.sub(r"const SD_EN = \{.*?\}; // @sd-en", "const SD_EN = " + json.dumps(ens, separators=(",", ":")) + "; // @sd-en", js)
    open(SD_JS, "w", encoding="utf-8", newline="\n").write(js)
    vers = {}
    for v in [x[2] for x in ops.values()] + [x[1] for x in ens.values()]: vers[v] = vers.get(v, 0) + 1
    print(f"operators {len(ops)} ({sum(x[1] for x in ops.values())} with back), enemies {len(ens)}, versions {vers}, failed {fails}")


if __name__ == "__main__":
    main()
