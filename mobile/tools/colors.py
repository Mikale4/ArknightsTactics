# Sample dominant colours per body region from each operator sprite (needs ImageMagick `convert`)
# and store them in mobile/src/a5b_opfig.js, which colours the battle figures.
import os, re, subprocess, colorsys
HERE = os.path.dirname(os.path.abspath(__file__))
SP = os.path.join(HERE, '..', '..', 'assets', 'sprites')
OPFIG = os.path.join(HERE, '..', 'src', 'a5b_opfig.js')
pat = re.compile(r'^(\d+),(\d+): \((\d+),(\d+),(\d+),(\d+)\)')
def pixels(path):
    out = subprocess.run(['convert', path, '-resize', 'x72', '-depth', '8', 'txt:-'], capture_output=True, text=True).stdout
    px = []
    for ln in out.splitlines()[1:]:
        m = pat.match(ln)
        if m:
            x, y, r, g, b, a = map(int, m.groups())
            if a > 200: px.append((x, y, r, g, b))
    return px
def skinlike(r, g, b):
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    return r > 150 and r >= g >= b - 10 and l > .6 and .08 < s < .75 and (h < .11 or h > .97)
def dom(px, excl=None, minsat=None):
    buckets = {}
    for r, g, b in px:
        if excl and excl(r, g, b): continue
        if minsat is not None:
            h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
            if s < minsat or l < .2 or l > .85: continue
        k = (r >> 5, g >> 5, b >> 5)
        buckets.setdefault(k, []).append((r, g, b))
    if not buckets: return None
    best = max(buckets.values(), key=len)
    n = len(best)
    return '#%02x%02x%02x' % tuple(sum(c[i] for c in best) // n for i in range(3))
rows = []
for f in sorted(os.listdir(SP)):
    slug = f[:-5]
    px = pixels(os.path.join(SP, f))
    if not px: continue
    W = max(p[0] for p in px) + 1; H = max(p[1] for p in px) + 1
    xs = sorted(p[0] for p in px); cx = xs[len(xs) // 2]
    def reg(y0, y1, half=.22):
        return [(r, g, b) for x, y, r, g, b in px if y0 * H <= y < y1 * H and abs(x - cx) <= max(3, half * W)]
    hair = dom(reg(0, .11), excl=skinlike) or '#3a2a2a'
    skin = dom([c for c in reg(.05, .18, .15) if skinlike(*c)]) or '#f3dccb'
    top = dom(reg(.2, .45), excl=skinlike) or '#4a5060'
    bot = dom(reg(.5, .78), excl=skinlike) or top
    boot = dom(reg(.86, 1.0, .3), excl=skinlike) or '#2a2a30'
    acc = dom([(r, g, b) for x, y, r, g, b in px], minsat=.45) or '#5fd4ff'
    rows.append('|'.join([slug, hair, skin, top, bot, boot, acc]))
# rewrite the embedded colour table in a5b_opfig.js, then rebuild with mobile/src/build.sh
js = open(OPFIG).read()
a = js.index('const OPCOL_RAW = `') + len('const OPCOL_RAW = `'); b = js.index('`;', a)
js = js[:a] + '\n'.join(r.replace('#', '') for r in rows) + js[b:]
open(OPFIG, 'w').write(js)
print(len(rows), 'operators written to', OPFIG)
