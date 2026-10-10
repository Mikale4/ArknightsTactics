#!/bin/sh
# Assemble Dragon Ball Z: Legend of the Z Fighters from the parts in this folder (order matters: later parts use earlier globals).
#   dragonball/index.html       full document
#   dragonball/dist/index.html  body-only copy for a claude.ai artifact (gitignored)
set -e
SRC=$(cd "$(dirname "$0")" && pwd)
OUT=$(dirname "$SRC")
mkdir -p "$OUT/dist"
BODY="$SRC/a2_core.js $SRC/a3a_roster.js $SRC/a3b_kits.js $SRC/a4_story.js $SRC/a5_art.js $SRC/a5b_dbz.js $SRC/a6_state.js $SRC/a7_engine.js $SRC/a8a_render.js $SRC/a8c_sfx.js $SRC/a8b_battle.js $SRC/a8d_field.js $SRC/a9a_screens.js $SRC/a9b_screens.js $SRC/a9c_meta.js $SRC/a9d_demo.js $SRC/a10_boot.js"
{
  printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
  printf '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">\n'
  printf '<meta name="theme-color" content="#06081a">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n'
  cat "$SRC/a1_head.html"
  printf '</head>\n<body>\n'
  cat $BODY
  printf '</body>\n</html>\n'
} > "$OUT/index.html"
cat "$SRC/a1_head.html" $BODY > "$OUT/dist/index.html"
awk '/<script>/{f=1;next}/<\/script>/{f=0}f' $BODY > "$OUT/dist/check.js"
node --check "$OUT/dist/check.js" && echo "syntax ok"
wc -c "$OUT/index.html"
