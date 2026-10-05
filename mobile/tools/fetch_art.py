"""Download story portraits and enemy icons listed in art_manifest.json and convert them for the game.

    python mobile/tools/fetch_art.py

Sources (Hypergryph game assets, like the operator art in assets/sprites):
  portraits  github.com/Aceship/Arknight-Images            avg/characters/*.png (1024x1024)
  icons      github.com/yuanyan3060/ArknightsGameResource  enemy/*.png (158x158)
Downloads are cached in mobile/tools/.art_cache (gitignored). Output:
  assets/story/<key>.webp     trimmed portrait, 640 px tall (same height as operator sprites)
  assets/enemies/<key>.webp   enemy icon
and the lists of available art are written into mobile/src/a5_art.js (the @art-* lines). Rebuild afterwards.
Needs Pillow.
"""
import json, os, re, sys, urllib.parse, urllib.request
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
CACHE = os.path.join(HERE, ".art_cache")
ART_JS = os.path.join(ROOT, "mobile", "src", "a5_art.js")


def get(url, name):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, name)
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        req = urllib.request.Request(url, headers={"User-Agent": "ArknightsTactics-fetch_art"})
        with urllib.request.urlopen(req, timeout=60) as r, open(path, "wb") as f:
            f.write(r.read())
    return path


def portrait(src, dst):
    im = Image.open(src).convert("RGBA")
    box = im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    if box: im = im.crop(box)
    h = 640
    if im.height > h: im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
    im.save(dst, "WEBP", quality=84, method=6)


def icon(src, dst):
    Image.open(src).convert("RGBA").save(dst, "WEBP", quality=88, method=6)


def main():
    M = json.load(open(os.path.join(HERE, "art_manifest.json"), encoding="utf-8"))
    out_s = os.path.join(ROOT, "assets", "story"); os.makedirs(out_s, exist_ok=True)
    out_e = os.path.join(ROOT, "assets", "enemies"); os.makedirs(out_e, exist_ok=True)
    fails = []
    for key, f in M["story"].items():
        try: portrait(get(M["portrait_base"] + urllib.parse.quote(f), "p_" + f.replace("#", "_").replace("$", "_")), os.path.join(out_s, key + ".webp"))
        except Exception as e: fails.append((key, f, str(e)))
    for key, eid in M["enemies"].items():
        try: icon(get(M["icon_base"] + eid + ".png", eid + ".png"), os.path.join(out_e, key + ".webp"))
        except Exception as e: fails.append((key, eid, str(e)))
    # icons for enemies that later episodes may map; cached only
    for eid in M.get("icon_cache", []):
        try: get(M["icon_base"] + eid + ".png", eid + ".png")
        except Exception as e: fails.append(("cache", eid, str(e)))
    have_s = sorted(k for k in M["story"] if os.path.exists(os.path.join(out_s, k + ".webp")))
    have_e = sorted(k for k in M["enemies"] if os.path.exists(os.path.join(out_e, k + ".webp")))
    js = open(ART_JS, encoding="utf-8").read()
    js = re.sub(r'const ART_STORY = new Set\(".*?"\.split\(" "\)\); // @art-story', f'const ART_STORY = new Set("{" ".join(have_s)}".split(" ")); // @art-story', js)
    js = re.sub(r'const ART_ENEMY = new Set\(".*?"\.split\(" "\)\); // @art-enemy', f'const ART_ENEMY = new Set("{" ".join(have_e)}".split(" ")); // @art-enemy', js)
    js = re.sub(r'const ENEMY_PORTRAIT = \{.*?\}; // @art-enemy-portrait', "const ENEMY_PORTRAIT = " + json.dumps(M.get("enemy_portrait", {}), separators=(",", ":")) + "; // @art-enemy-portrait", js)
    open(ART_JS, "w", encoding="utf-8", newline="\n").write(js)
    print(f"portraits {len(have_s)}, enemy icons {len(have_e)}, failed {fails}")


if __name__ == "__main__":
    main()
