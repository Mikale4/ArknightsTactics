#!/bin/sh
# Download the battle sprites from Pokémon Showdown's sprite server into pokemon/sprites/.
#   pokemon/sprites/front/<id>.png   Black/White front sprites (opponents, menus)
#   pokemon/sprites/back/<id>.png    Black/White back sprites (your side of the field)
#   pokemon/sprites/trainers/<n>.png FireRed/LeafGreen trainer sprites
# <id> is Showdown's species id: the lowercase name with everything but a-z0-9 removed (mrmime, nidoranf).
# build.sh embeds them into index.html as data URIs, so the game stays a single file.
set -e
DIR=$(cd "$(dirname "$0")/.." && pwd)
BASE=https://play.pokemonshowdown.com/sprites
mkdir -p "$DIR/sprites/front" "$DIR/sprites/back" "$DIR/sprites/trainers"
IDS=$(grep -o '"k":"[a-z0-9]*"' "$DIR/src/a3a_dex.js" | cut -d'"' -f4)
get() { [ -s "$2" ] || curl -sf --retry 3 -o "$2" "$1" || echo "missing $1"; }
for id in $IDS; do
  get "$BASE/gen5/$id.png" "$DIR/sprites/front/$id.png" &
  get "$BASE/gen5-back/$id.png" "$DIR/sprites/back/$id.png" &
  wait
done
for t in red leaf blue blue-gen3champion oak brock misty ltsurge erika koga sabrina blaine giovanni lorelei bruno agatha lance \
  teamrocketgruntm teamrocketgruntf youngster lass bugcatcher hiker camper picnicker swimmerm swimmerf fisherman sailor gentleman \
  scientist channeler blackbelt birdkeeper juggler tamer psychic beauty biker burglar cueball engineer pokemaniac supernerd rocker \
  acetrainer acetrainerf mrfuji bill daisy aromalady battlegirl dragontamer expert kindler lady ninjaboy painter parasollady pokefan \
  pokemonbreeder pokemonranger psychicf richboy tuber twins schoolkid gamer guitarist collector hexmaniac ruinmaniac; do
  case $t in *-gen3*) f=$t; n=${t%%-gen3*}champion ;; *) f=$t-gen3; n=$t ;; esac
  get "$BASE/trainers/$f.png" "$DIR/sprites/trainers/$n.png"
done
# player looks (each in its own game's style) and a few faces from around Kanto
for t in ethan lyra kris brendan may lucas dawn hilbert hilda nate rosa calem serena elio selene victor gloria nurse clerk jessiejames-gen1; do
  get "$BASE/trainers/$t.png" "$DIR/sprites/trainers/${t%%-gen1}.png"
done
ls "$DIR/sprites/front" | wc -l; ls "$DIR/sprites/back" | wc -l; ls "$DIR/sprites/trainers" | wc -l
du -sh "$DIR/sprites"
