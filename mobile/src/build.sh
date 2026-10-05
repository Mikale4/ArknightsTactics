#!/bin/sh
# Assemble Arknights Tactics Mobile from the parts in this folder (order matters: later parts use earlier globals).
#   mobile/index.html       full document; assets load from ../assets/
#   mobile/dist/index.html  body-only copy for a claude.ai artifact; assets load from assets/ (gitignored)
set -e
SRC=$(cd "$(dirname "$0")" && pwd)
OUT=$(dirname "$SRC")
mkdir -p "$OUT/dist"
cd "$SRC"   # part names below are relative, so paths with spaces work
BODY="a2_core.js a3a_roster.js a3b_real.js a3c_kits.js a4_story.js a4b_reunion.js a4c_victoria.js a4d_world.js a5_art.js a5b_opfig.js a6_state.js a6b_ladder.js a6c_lines.js a6d_meta.js a6e_people.js a7_engine.js a8a_render.js a8d_sd.js a8c_sfx.js a8b_battle.js a9a_screens.js a9b_screens.js a9e_arena.js a9f_social.js a9c_title.js a9d_demo.js a10_boot.js"
{
  printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
  printf '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">\n'
  printf '<meta name="theme-color" content="#05080f">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n'
  cat a1_head.html
  printf '</head>\n<body>\n'
  cat $BODY
  printf '</body>\n</html>\n'
} > "$OUT/index.html"
{
  cat a1_head.html
  printf '<script>window.AT_ASSET_BASE="assets/";</script>\n'
  cat $BODY
} > "$OUT/dist/index.html"
# syntax check of the assembled script
awk '/<script>/{f=1;next}/<\/script>/{f=0}f' $BODY > "$OUT/dist/check.js"
node --check "$OUT/dist/check.js" && echo "syntax ok"
# every part shares one script: a later function with the same name silently replaces an earlier one
DUPS=$(cat $BODY | grep -oE "^(async )?function [A-Za-z0-9_]+" | awk '{print $NF}' | sort | uniq -d)
if [ -n "$DUPS" ]; then echo "duplicate top-level functions: $DUPS"; exit 1; fi
wc -c "$OUT/index.html"
