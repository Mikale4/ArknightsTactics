"""Copy Arknights sound effects and operator voice lines into assets/ from PseudoMon/arknights-audio.

    python mobile/tools/fetch_audio.py [path-to-clone]

Without a path it makes a sparse, blob-less clone of the repo's `global-server-voices` branch
(English voices) in mobile/tools/.audio_repo and checks out only the files the game uses.
Battle WAVs become small MP3s and voice lines are re-encoded at 40 kbps (needs ffmpeg). Voice lines land in assets/voice/<slug>/CN_0xx.mp3,
and the list of voiced operators is written into mobile/src/a8c_sfx.js (the `@voice-list` line).
Rebuild afterwards: sh mobile/src/build.sh
"""
import json, os, re, shutil, subprocess, sys

ok = lambda p: os.path.exists(p) and os.path.getsize(p) > 0  # upstream has a few empty placeholder files

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SFX_JS = os.path.join(ROOT, "mobile", "src", "a8c_sfx.js")
REPO = "https://github.com/PseudoMon/arknights-audio.git"
BRANCH = "global-server-voices"
FOLDERS = {"b_": "battle/{0}/", "p_": "player/{0}/", "e_": "enemy/{0}/"}


def sfx_names():
    """Sample names from SFX_FILES in a8c_sfx.js."""
    src = open(SFX_JS, encoding="utf-8").read()
    block = src[src.index("const SFX_FILES"):src.index("};", src.index("const SFX_FILES"))]
    return sorted(set(re.findall(r'"([bpe]_[a-z0-9_]+)"', block)))


def sfx_path(name):
    """battle/b_ui/b_ui_win.wav, player/p_atk/p_atk_arrow_n.mp3, enemy/e_imp/e_imp_blade_n.mp3"""
    group = "_".join(name.split("_")[:2])
    ext = ".wav" if name.startswith("b_") else ".mp3"
    return FOLDERS[name[:2]].format(group) + name + ext


def voice_lines():
    src = open(SFX_JS, encoding="utf-8").read()
    block = src[src.index("const VO = "):src.index("};", src.index("const VO = "))]
    return sorted(set(re.findall(r'"(\d{3})"', block)))


def wanted(vmap):
    paths = [sfx_path(n) for n in sfx_names()]
    for slug, (vdir, cid) in sorted(vmap.items()):
        paths += [f"{vdir}/{cid}/CN_{line}.mp3" for line in voice_lines()]
    return paths


def clone(dest, paths):
    if not os.path.isdir(os.path.join(dest, ".git")):
        subprocess.check_call(["git", "clone", "--filter=blob:none", "--no-checkout", "--single-branch", "-b", BRANCH, REPO, dest])
    subprocess.check_call(["git", "-C", dest, "sparse-checkout", "init", "--no-cone"])
    subprocess.run(["git", "-C", dest, "sparse-checkout", "set", "--stdin"], input="\n".join("/" + p for p in paths).encode(), check=True)
    subprocess.check_call(["git", "-C", dest, "checkout", BRANCH])


def main():
    vmap = json.load(open(os.path.join(HERE, "voice_map.json"), encoding="utf-8"))
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, ".audio_repo")
    if len(sys.argv) < 2:
        clone(src, wanted(vmap))
    # sound effects
    out = os.path.join(ROOT, "assets", "sfx"); os.makedirs(out, exist_ok=True)
    missing = []
    for name in sfx_names():
        f = os.path.join(src, sfx_path(name)); dst = os.path.join(out, name + ".mp3")
        if not ok(f): missing.append(name); continue
        if f.endswith(".wav"):
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f, "-ac", "1", "-ar", "32000", "-b:a", "64k", dst], check=True)
        else:
            shutil.copyfile(f, dst)
    # voices: an operator counts as voiced only with every line present
    voiced, miss = [], {}
    for slug, (vdir, cid) in sorted(vmap.items()):
        files = {line: os.path.join(src, vdir, cid, f"CN_{line}.mp3") for line in voice_lines()}
        if not all(ok(p) for p in files.values()):
            have = sum(ok(p) for p in files.values())
            if have < len(files) - 3: continue  # a few missing lines just stay silent
        d = os.path.join(ROOT, "assets", "voice", slug); os.makedirs(d, exist_ok=True)
        for line, p in files.items():
            # speech stays clear at 40 kbps mono and the folder shrinks by half
            if ok(p): subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", p, "-ac", "1", "-ar", "32000", "-b:a", "40k", os.path.join(d, f"CN_{line}.mp3")], check=True)
        voiced.append(slug)
        gone = [line for line, p in files.items() if not ok(p)]
        if gone: miss[slug] = " ".join(gone)
    js = open(SFX_JS, encoding="utf-8").read()
    js = re.sub(r'const VOICE_LIST = ".*?"; // @voice-list', f'const VOICE_LIST = "{" ".join(voiced)}"; // @voice-list', js)
    js = re.sub(r'const VOICE_MISS = \{.*?\}; // @voice-miss', "const VOICE_MISS = " + json.dumps(miss, separators=(",", ":")) + "; // @voice-miss", js)
    open(SFX_JS, "w", encoding="utf-8", newline="\n").write(js)
    print(f"sfx: {len(sfx_names()) - len(missing)} copied, missing {missing}")
    print(f"voices: {len(voiced)} operators x {len(voice_lines())} lines")


if __name__ == "__main__":
    main()
