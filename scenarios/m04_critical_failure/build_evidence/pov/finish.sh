#!/bin/bash
# finish.sh <concept.jpg-as-png> <name> <strength> <seed> "<description>"
set -e
cd /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape
SRC=$1; NAME=$2; ST=$3; SEED=$4; DESC=$5
S=/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m04-pov/out/$NAME
mkdir -p $S
python3 -c "from PIL import Image as I; I.open('$SRC').convert('RGB').save('$S/concept.png', format='PNG')"
python3 tools/pixelate_background.py $S/concept.png $S "pixel art, $DESC, moody volumetric lighting" --strengths $ST --seed $SEED | tail -1
D=public/break_escape/assets/backgrounds/rooms
cp $S/concept.png $D/${NAME}_nonpixelart.png
cp $S/concept_px400_s${ST}_seed${SEED}.png $D/${NAME}.png
python3 tools/blend_backgrounds.py --only $NAME
python3 scripts/room_gen/pov_chat_preview.py $D/${NAME}_blended.png $S/preview.png
