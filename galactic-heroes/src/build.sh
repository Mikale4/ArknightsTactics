#!/bin/sh
# Assemble Galactic Heroes from the parts in this folder.
#   galactic-heroes/index.html       full document
#   galactic-heroes/dist/index.html  body-only copy for a claude.ai artifact (gitignored)
set -e
SRC=$(cd "$(dirname "$0")" && pwd)
OUT=$(dirname "$SRC")
mkdir -p "$OUT/dist"
BODY="$SRC/p2_body.html $SRC/p3_chars.js $SRC/p4_world.js $SRC/p5_figure.js $SRC/p6_state.js $SRC/p7_engine.js $SRC/p8a_render.js $SRC/p8b_battle.js $SRC/p9_screens.js $SRC/p10_boot.js"
{
  printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
  printf '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">\n'
  printf '<meta name="theme-color" content="#05080f">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n'
  printf '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style>\n'
  cat "$SRC/p1_head.html"
  printf '</head>\n<body>\n'
  cat $BODY
  printf '</body>\n</html>\n'
} > "$OUT/index.html"
cat "$SRC/p1_head.html" $BODY > "$OUT/dist/index.html"
awk '/<script>/{f=1;next}/<\/script>/{f=0}f' "$OUT/dist/index.html" > "$OUT/dist/check.js"
node --check "$OUT/dist/check.js" && echo "syntax ok"
wc -c "$OUT/index.html"
