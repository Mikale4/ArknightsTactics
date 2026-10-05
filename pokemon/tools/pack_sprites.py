#!/usr/bin/env python3
"""Pack Pokémon Showdown's animated Black/White sprites into sprite sheets for the build (needs ImageMagick).

  in   tools/.showdown/gen5ani/<id>.gif, tools/.showdown/gen5ani-back/<id>.gif   (fetch_sprites.sh downloads them; gitignored)
  out  sprites/front/<id>.png, sprites/back/<id>.png, sprites/icons/<id>.png, sprites/anim.json

Each GIF is coalesced into whole frames. Repeated frames are kept once, every frame is cropped to the union of the
opaque pixels (so the feet stay put), and the unique frames are laid side by side in one palette PNG.
anim.json says how to play them back:
  {"f": {"<id>": [w, h, cols, i0, cs0, i1, cs1, ...]}, "b": {...}}
w x h is one frame and cols the frames per sheet row, then (unique frame, duration in centiseconds) pairs in order.
icons/ holds each front sprite's first frame cropped to the Pokémon, so menus never have to decode the big sheets.
The sheets come to about a fifth of the GIFs' size, so all 302 animations fit in the single-file game.

  python3 pokemon/tools/pack_sprites.py
"""
import json, math, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "tools", ".showdown")
SETS = [("f", "gen5ani", "front"), ("b", "gen5ani-back", "back")]
MAX_W = 8192  # widest sheet, well inside every browser's image and canvas limits


def im(*args, data=None):
    return subprocess.run(["convert", *args], input=data, capture_output=True, check=True).stdout


def pack(src, dst):
    info = [l.split() for l in im(src, "-coalesce", "-format", "%w %h %T\n", "info:").decode().splitlines() if l.strip()]
    w, h = int(info[0][0]), int(info[0][1])
    # whole frames as RGBA; fully transparent pixels zeroed so equal frames compare equal
    raw = im(src, "-coalesce", "-background", "none", "-alpha", "background", "-depth", "8", "rgba:-")
    size = w * h * 4
    assert len(raw) == size * len(info), (src, len(raw), size, len(info))
    uniq, index, seq = [], {}, []
    for n, row in enumerate(info):
        fr = raw[n * size:(n + 1) * size]
        if fr not in index:
            index[fr] = len(uniq)
            uniq.append(fr)
        cs = int(row[2])
        cs = 10 if cs <= 1 else cs  # browsers play 0-1 cs GIF frames at 10 cs
        if seq and seq[-1][0] == index[fr]:
            seq[-1][1] += cs
        else:
            seq.append([index[fr], cs])
    if len(seq) > 1 and seq[0][0] == seq[-1][0]:  # the loop wraps onto the same frame
        seq[0][1] += seq.pop()[1]
    # union of the opaque pixels over every frame
    mask = 0
    for fr in uniq:
        mask |= int.from_bytes(fr[3::4], "big")
    box = bbox(mask.to_bytes(w * h, "big"), w, h)
    if not box:
        return None
    x0, y0, x1, y1 = box
    cw, ch = x1 - x0 + 1, y1 - y0 + 1
    # one strip, side by side: each scanline then repeats the previous frame's, which deflate packs about
    # 30% tighter than a square grid; strips wider than MAX_W wrap onto more rows
    n = len(uniq)
    cols = max(1, min(n, MAX_W // cw))
    nrows = math.ceil(n / cols)
    SW, SH = cols * cw, nrows * ch
    sheet = bytearray(SW * SH * 4)
    for i, fr in enumerate(uniq):
        ox, oy = (i % cols) * cw, (i // cols) * ch
        for y in range(ch):
            s = ((y0 + y) * w + x0) * 4
            d = ((oy + y) * SW + ox) * 4
            sheet[d:d + cw * 4] = fr[s:s + cw * 4]
    write_png(SW, SH, sheet, dst)
    # the first frame cropped to itself, for the menu icon atlas
    first = uniq[seq[0][0]]
    fx0, fy0, fx1, fy1 = bbox(first[3::4], w, h)
    iw = fx1 - fx0 + 1
    icon = b"".join(first[((fy0 + y) * w + fx0) * 4:((fy0 + y) * w + fx0 + iw) * 4] for y in range(fy1 - fy0 + 1))
    return [cw, ch, cols] + [v for p in seq for v in p], (iw, fy1 - fy0 + 1, icon)


def bbox(alpha, w, h):
    """x0, y0, x1, y1 of the non-zero bytes in a w x h alpha plane, or None if it's empty."""
    rows = [y for y in range(h) if alpha[y * w:(y + 1) * w].strip(b"\0")]
    if not rows:
        return None
    x0 = min(w - len(alpha[y * w:(y + 1) * w].lstrip(b"\0")) for y in rows)
    x1 = max(len(alpha[y * w:(y + 1) * w].rstrip(b"\0")) for y in rows) - 1
    return x0, rows[0], x1, rows[-1]


def write_png(w, h, rgba, dst):
    src = ["-size", f"{w}x{h}", "-depth", "8", "rgba:-"]
    colors = int(im(*src, "-format", "%k", "info:", data=bytes(rgba)).decode())
    fmt = "PNG8:" if colors <= 255 else "PNG32:"  # 255 colours plus transparency stay lossless in a palette
    im(*src, "-strip", "-define", "png:exclude-chunks=date,time", "-define", "png:compression-level=9", fmt + dst, data=bytes(rgba))




def main():
    out, jobs = {}, []
    for key, cache, folder in SETS:
        out[key] = {}
        src_dir, dst_dir = os.path.join(CACHE, cache), os.path.join(ROOT, "sprites", folder)
        os.makedirs(dst_dir, exist_ok=True)
        for f in sorted(os.listdir(src_dir)):
            if f.endswith(".gif"):
                jobs.append((key, f[:-4], os.path.join(src_dir, f), os.path.join(dst_dir, f[:-4] + ".png")))
    with ThreadPoolExecutor(os.cpu_count() or 4) as ex:
        res = list(ex.map(lambda j: pack(j[2], j[3]), jobs))
    icon_dir = os.path.join(ROOT, "sprites", "icons")
    os.makedirs(icon_dir, exist_ok=True)
    for (key, k, src, dst), r in zip(jobs, res):
        if r is None:
            print("empty sprite", src, file=sys.stderr)
            continue
        out[key][k] = r[0]
        if key == "f":
            write_png(*r[1], os.path.join(icon_dir, k + ".png"))
    with open(os.path.join(ROOT, "sprites", "anim.json"), "w") as fh:
        json.dump(out, fh, separators=(",", ":"), sort_keys=True)
    total = sum(os.path.getsize(j[3]) for j in jobs if os.path.exists(j[3]))
    frames = sum(len(v) // 2 - 1 for s in "fb" for v in out[s].values())
    icon_kb = sum(os.path.getsize(os.path.join(icon_dir, f)) for f in os.listdir(icon_dir)) // 1024
    print(f"{len(os.listdir(icon_dir))} menu icons, {icon_kb} KB")
    print(f"packed {len(out['f']) + len(out['b'])} sprites, {frames} playback steps, {total // 1024} KB of sheets")


if __name__ == "__main__":
    main()
