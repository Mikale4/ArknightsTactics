#!/bin/sh
# Assemble Arknights Tactics Mobile from the parts in this folder (order matters: later parts use earlier globals).
#   mobile/index.html       full document; assets load from ../assets/
#   mobile/dist/index.html  body-only copy for a claude.ai artifact; assets load from assets/ (gitignored)
set -e
SRC=$(cd "$(dirname "$0")" && pwd)
OUT=$(dirname "$SRC")
mkdir -p "$OUT/dist"
BODY="$SRC/a2_core.js $SRC/a3a_roster.js $SRC/a3b_kits.js $SRC/a4_story.js $SRC/a5_art.js $SRC/a5b_opfig.js $SRC/a6_state.js $SRC/a7_engine.js $SRC/a8a_render.js $SRC/a8c_sfx.js $SRC/a8b_battle.js $SRC/a9a_screens.js $SRC/a9b_screens.js $SRC/a10_boot.js"
{
  printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
  printf '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">\n'
  printf '<meta name="theme-color" content="#05080f">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n'
  cat "$SRC/a1_head.html"
  printf '</head>\n<body>\n'
  cat $BODY
  printf '</body>\n</html>\n'
} > "$OUT/index.html"
{
  cat "$SRC/a1_head.html"
  printf '<script>window.AT_ASSET_BASE="assets/";</script>\n'
  cat $BODY
} > "$OUT/dist/index.html"
# syntax check of the assembled script
awk '/<script>/{f=1;next}/<\/script>/{f=0}f' $BODY > "$OUT/dist/check.js"
node --check "$OUT/dist/check.js" && echo "syntax ok"
wc -c "$OUT/index.html"
