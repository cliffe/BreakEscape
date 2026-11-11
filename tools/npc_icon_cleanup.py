#!/usr/bin/env python3
"""Hand clean-up of the 18 PixelLab NPC need/action icons (16x16).

The user picked these icons from PixelLab candidates (commit 8064c229c; avoid
and closed in d7825e5f0, set per icon with 'pick'). The
generator left noisy, half-dark outlines, specks and doubled edges. This script
re-applies the hand edits so they can be reviewed and redone.

Each icon is a 16x16 edit grid, one character per pixel:
  '.'  transparent
  'O'  the shared outline colour (OUTLINE below)
  '='  keep the original pixel (after the icon's optional shift)
  any other character: a colour from that icon's palette, sampled from the
       original icon unless the comment says otherwise

No resampling anywhere: pixels are copied or set one by one.

Usage:
  python3 tools/npc_icon_cleanup.py                 # originals from git, write assets
  python3 tools/npc_icon_cleanup.py --src DIR       # originals from DIR/npc-<name>.png
  python3 tools/npc_icon_cleanup.py --diff          # also print every changed pixel
  python3 tools/npc_icon_cleanup.py --sheet OUT.png # contact sheet (8x previews)
  python3 tools/npc_icon_cleanup.py --dry-run       # check only, write nothing
"""
import argparse
import io
import os
import subprocess
import sys

from PIL import Image, ImageDraw

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICON_DIR = os.path.join(REPO, 'public', 'break_escape', 'assets', 'icons')
PICK_COMMIT = '8064c229c'   # the user's untouched picks (an icon's 'pick' overrides)
BACKING = (0x1b, 0x2a, 0x41)  # in-game navy behind the icons

# One dark outline for the whole set, close to the near-black outlines of the
# hand-made icons (talk, mark-question, mark-exclamation, mail-new).
OUTLINE = '#16141e'

ICONS = {}

# caffeine: coffee mug. Repainted inside the original silhouette: the old edge
# mixed brown, black and grey; the coffee surface was black like the outline;
# the handle was a 3-px smear with no hole; specks under the base (row 15)
# removed. Moved down a row so the steam fits above. The two 2-px steam wisps
# are deliberately unoutlined (like steam in most 16-px icons).
ICONS['caffeine'] = dict(
    pal={'e': '#dde5ec', '9': '#c6c5bc', '4': '#916f4f', 'j': '#5a371b',
         '0': '#d2ac77', '7': '#e4c68d', '1': '#b88f5f', '6': '#a07458'},
    unoutlined={(5, 1), (8, 1), (4, 2), (7, 2)},
    grid=[
        '................',
        '.....e..e.......',
        '....9..9........',
        '.OOOOOOOOOO.....',
        '.O4jjjjjj4O.....',
        '.O07000016OOOO..',
        '.O07000016O116O.',
        '.O07000016O1O6O.',
        '.O07000016O1O6O.',
        '.O07000016O1O6O.',
        '.O07000016O116O.',
        '.O07000016OOOO..',
        '.O07000016O.....',
        '.O11111116O.....',
        '..OOOOOOOO......',
        '................',
    ])

# thirst: glass of water. Fill kept as is; the pale blue-grey outline replaced
# with the shared dark one (a 1-px stepped taper); grey wall pixels left inside
# the rim at (3,2), (3,5), (12,2) and a near-outline dark pixel at (10,13)
# recoloured to the neighbouring glass/water shades.
ICONS['thirst'] = dict(
    pal={'a': '#c2f9fd', 'b': '#83c8e4', 'c': '#1087f6'},
    grid=[
        '................',
        '...OOOOOOOOOO...',
        '..Oa========bO..',
        '..O==========O..',
        '..O==========O..',
        '..Oa=========O..',
        '...O========O...',
        '...O========O...',
        '...O========O...',
        '...O========O...',
        '....O======O....',
        '....O======O....',
        '....O======O....',
        '....O=====cO....',
        '.....OOOOOO.....',
        '................',
    ])

# hunger: burger. The original was a jumble of near-black specks through the
# patty and lettuce with no clear layers or edge. Repainted in its own colours
# as clean layers (bun, lettuce frill one pixel wider each side, tomato, patty,
# bottom bun) inside a symmetric version of the old silhouette. This one is
# closest to a redraw.
ICONS['hunger'] = dict(
    pal={'0': '#f6d393', '1': '#fdd78d', 'c': '#f4b470', 'm': '#ea8f58',
         'p': '#df7737', 'g': '#5ef706', 'G': '#3fdd09', 'r': '#b8392b',
         'R': '#dd4e0e', 'n': '#ab5223', 'a': '#9d4824', 'q': '#f1bb7c',
         'k': '#ce7c3f'},
    grid=[
        '................',
        '.......OOO......',
        '.....OO011OO....',
        '...OO0000011OO..',
        '..Oc000000011cO.',
        '..Oc000000001cO.',
        '..OpmmmmmmmmmpO.',
        '.OgGgGgGgGgGgGgO',
        '..OrrRrrRrrRrrO.',
        '..OnnnnnnnnnnnO.',
        '..OaaaaaaaaaaaO.',
        '...Oq0000000qO..',
        '....OkccccckO...',
        '.....OOOOOOO....',
        '................',
        '................',
    ])

# rest: "Zz". The original big Z had no edge on most sides, a purple smear
# for a shadow and loose dark specks; the small z was a cluster of noise.
# Repainted as two separately outlined letters (big Z 2-px strokes, small z
# 1-px strokes, its outline following the letter rather than a box) in the original cyan with its purple top highlight. Two
# letters means two closed outlines.
ICONS['rest'] = dict(
    pal={'5': '#6bf2f9', '2': '#1ed4ea', '9': '#27c6fa', '6': '#868fef',
         'c': '#8fd8fb', 'x': '#3fd8fa', '4': '#0dc3ea', '7': '#00b5dd',
         'd': '#03afcc'},
    grid=[
        '...........OOOO.',
        '..........O5555O',
        '...........OO2O.',
        '...........O2OO.',
        '..........O9999O',
        '...........OOOO.',
        'OOOOOOOOO.......',
        'O6666666O.......',
        'OcccccccO.......',
        'OOOOOx4OO.......',
        '...Ox4O.........',
        '..Ox4O..........',
        'OOx4OOOOO.......',
        'O7777777O.......',
        'OdddddddO.......',
        'OOOOOOOOO.......',
    ])

# social: two speech bubbles. The original's edges were a mix of black, grey
# and blue, the "..." dots bled into the outline and both tails were loose
# pixels. Repainted: white bubble (three dots) in front, blue bubble behind,
# each with a closed outline and a 2-px tail.
ICONS['social'] = dict(
    pal={'w': '#f9f5e6', 's': '#eee5d5', 'g': '#cfd1de', 'b': '#78c7e9',
         'q': '#c5d4ed', 'B': '#79b4d2'},
    grid=[
        '................',
        '................',
        '......OOOOOOO...',
        '.....OwwwwwwgO..',
        '.....OwwwwwwgO..',
        '..OOOOwwwwwwgO..',
        '.ObqbOwOwOwOgO..',
        '.ObbbOwwwwwwgO..',
        '.ObbbOssssssgO..',
        '.ObbbOOOOOwwO...',
        '.ObbbbbbO.OwO...',
        '.OBBBBBBO..O....',
        '.OBBOOOO........',
        '.OBO............',
        '..O.............',
        '................',
    ])

# work: laptop. Screen and bezel kept as drawn (moved down a row); the grey
# edge and the dark left column became the shared outline; the keyboard base
# (dark smears and stray pixels in row 15) repainted as key row, trackpad row
# and front edge in the original base colours.
ICONS['work'] = dict(
    shift=(0, 1),
    pal={'n': '#c1b694', 'o': '#d6ccaa', 'h': '#b9ab8d', 'I': '#e8dabc',
         '8': '#99908d'},
    grid=[
        '................',
        '..OOOOOOOOOOOO..',
        '..O==========O..',
        '..O==========O..',
        '..O==========O..',
        '..O==========O..',
        '..O==========O..',
        '..O==========O..',
        '..O==========O..',
        '..O==========O..',
        '..OOOOOOOOOOOO..',
        '..OnononononoO..',
        '.OhhhhhIIhhhhhO.',
        '.O888888888888O.',
        '..OOOOOOOOOOOO..',
        '................',
    ])

# curiosity: magnifying glass. The lens rim was a lumpy two-pixel ring of
# assorted greys and blacks. Repainted as a round 11-px outline, a 1-px grey
# rim, the light-blue lens with a two-pixel glint and a shaded lower right, a
# grey collar pixel where the handle joins, and a clean 2-px diagonal handle.
ICONS['curiosity'] = dict(
    pal={'r': '#4b5259', 'R': '#565c63', 'L': '#96d9ff', 'p': '#d2efff',
         'm': '#78c9f6', 'g': '#545159', 'h': '#69351d', 'z': '#8b5324'},
    grid=[
        '................',
        '....OOOOO.......',
        '..OORRRRrOO.....',
        '..ORpLLLLrO.....',
        '.ORpLLLLLLrO....',
        '.ORLLLLLLLrO....',
        '.ORLLLLLLLrO....',
        '.OrLLLLLLmrO....',
        '.OrLLLLLmmrO....',
        '..OrLLLmmrO.....',
        '..OOrrrrrOgOO...',
        '....OOOOO.OhzO..',
        '...........OhzO.',
        '............OhzO',
        '.............OO.',
        '................',
    ])

# post: tied parcel sack. Fill kept; the ragged edge (dark browns and
# near-blacks, notches on both sides) became a symmetric round outline; dark
# specks just inside it recoloured to the neighbouring browns (see fixes).
ICONS['post'] = dict(
    pal={'b': '#8d6340', 'B': '#764f34', 'l': '#c19766', 'L': '#b98d5d',
         'o': '#996c48'},
    grid=[
        '................',
        '......OOOOO.....',
        '....OO=====OO...',
        '...O=========O..',
        '..O===========O.',
        '.O=============O',
        '.O=============O',
        '.O=============O',
        '.O=============O',
        '.O=============O',
        '.O=============O',
        '..O===========O.',
        '...O=========O..',
        '....OO=====OO...',
        '......OOOOO.....',
        '................',
    ])

# printout: sheet of paper. The grey-and-black edge and the noisy dog-ear
# replaced with one outline and a clean diagonal cut over a grey flap; the
# blotchy grey stripes became four tidy text lines; bottom grey band kept as
# the sheet's lower edge.
ICONS['printout'] = dict(
    pal={'w': '#f6f6f3', 's': '#dfdfdf', 'F': '#989aa3', 't': '#ababad',
         'b': '#838080'},
    grid=[
        '................',
        '...OOOOOOOOO....',
        '..OwwwwwwwwFO...',
        '..OwwwwwwwwFFO..',
        '..OwwwwwwwwwwsO.',
        '..OwttttttttwsO.',
        '..OwwwwwwwwwwsO.',
        '..OwtttttttwwsO.',
        '..OwwwwwwwwwwsO.',
        '..OwttttttttwsO.',
        '..OwwwwwwwwwwsO.',
        '..OwtttttwwwwsO.',
        '..OwwwwwwwwwwsO.',
        '..ObbbbbbbbbbbO.',
        '...OOOOOOOOOOO..',
        '................',
    ])

# print: printer with paper in and a printout coming out. The body edge was
# four different greys and blacks, the right side ran off to the canvas edge
# and the green light was a 2x2 smudge. Repainted symmetric: paper in the top
# slot, light band, grey body with one green LED, output slot and a cream
# printout with a text line.
ICONS['print'] = dict(
    pal={'w': '#ffffff', 'W': '#e2e3e3', 't': '#929297', 'L': '#d5dbdb',
         '0': '#838891', 's': '#6e737e', 'y': '#13f43e', 'c': '#f2edd6',
         'g': '#ded4c6'},
    grid=[
        '.....OOOOOO.....',
        '....OwwwwwWO....',
        '....OwwwwwWO....',
        '....OwwwwwWO....',
        '..OOOwwwwwWOOO..',
        '.OtttOOOOOOtttO.',
        '.OLLLLLLLLLLLLO.',
        '.O00000000000sO.',
        '.O0000000000ysO.',
        '.O00000000000sO.',
        '.O00OOOOOOOO0sO.',
        '.O00OccccccO0sO.',
        '..OOOcggggcOOO..',
        '....OccccccO....',
        '.....OOOOOO.....',
        '................',
    ])

# queue: hourglass. Already close: fill and sand kept; the outline (eight
# near-blacks plus a stray pixel at (14,1)) replaced with the shared one,
# made symmetric, with the glass edge stepping one pixel per row.
ICONS['queue'] = dict(
    pal={},
    grid=[
        '................',
        '...OOOOOOOOOOO..',
        '...O=========O..',
        '....O=======O...',
        '....O=======O...',
        '.....O=====O....',
        '......O===O.....',
        '.......O=O......',
        '......O===O.....',
        '.....O=====O....',
        '....O=======O...',
        '....O=======O...',
        '...O=========O..',
        '...OOOOOOOOOOO..',
        '................',
        '................',
    ])

# file: folder. Brown edge replaced with the shared outline, tab given a
# clean step, top-right and bottom corners rounded by one pixel, the tan tab
# top and grey-brown flecks along the top edge removed; flat yellow fill kept
# with the original left highlight and a slightly darker bottom row.
# Moved down a row to centre it.
ICONS['file'] = dict(
    pal={'0': '#fdd549', 'f': '#fddf68', '2': '#f5d853', '9': '#edcf47'},
    grid=[
        '................',
        '................',
        '...OOOO.........',
        '..OffffOOOOOOO..',
        '..O20000000000O.',
        '..O20000000000O.',
        '..O20000000000O.',
        '..O20000000000O.',
        '..O20000000000O.',
        '..O20000000000O.',
        '..O20000000000O.',
        '..O99999999999O.',
        '...OOOOOOOOOOO..',
        '................',
        '................',
        '................',
    ])

# blocked: no-entry sign. The circle was lumpy with a patchy grey ring and
# pink smears. Repainted as a round 14-px outline, a 1-px grey ring (lighter
# top-left, darker bottom-right), red disc shaded the same way and an 8x2
# white bar.
ICONS['blocked'] = dict(
    pal={'m': '#928b8c', 'M': '#777e89', 'h': '#e74044', 'r': '#cd151c',
         'R': '#b21f2e', 'w': '#fbfcfb'},
    grid=[
        '................',
        '.....OOOOOO.....',
        '...OOmmmmmmOO...',
        '..OmmhhrrrrMMO..',
        '..OmhrrrrrrrMO..',
        '.OmhrrrrrrrrrMO.',
        '.OmrrrrrrrrrrMO.',
        '.OmrwwwwwwwwrMO.',
        '.OmrwwwwwwwwrMO.',
        '.OmrrrrrrrrrRMO.',
        '.OmrrrrrrrrRRMO.',
        '..OmrrrrrrRRMO..',
        '..OMMrrrRRRMMO..',
        '...OOMMMMMMOO...',
        '.....OOOOOO.....',
        '................',
    ])

# noticed: red exclamation mark. Outline made one colour and 1 px; the bar's
# tail and the dot touched (two dark rows between them), so the bar is one
# row shorter, leaving a clear gap; dot made round.
ICONS['noticed'] = dict(
    pal={'r': '#cd0c0c', 'R': '#bd0007', 'e': '#dd1112', 'b': '#fea694',
         'c': '#f3b09a', 'd': '#9b0012'},
    grid=[
        '................',
        '......OOOO......',
        '.....OeerRO.....',
        '.....ObrrRO.....',
        '.....OcrrRO.....',
        '.....OerrRO.....',
        '.....OerrRO.....',
        '......OerO......',
        '......OrRO......',
        '.......OO.......',
        '................',
        '.......OO.......',
        '......OerO......',
        '......OrdO......',
        '.......OO.......',
        '................',
    ])

# avoid: storm cloud with a lightning bolt ("doesn't want to be near
# someone"). The cloud's edge mixed near-blacks with dark greys (a doubled
# edge top right, grey pixels on the edge at (1,8) and (14,6)); outline
# replaced with one symmetric shared one. Fill repainted in the original greys
# (highlight top left, darker right) with a dark speck at (10,6) removed;
# the dark underside row kept. Bolt colours kept; its ragged dark-red edge
# became a closed 1-px outline hanging from the cloud's base.
ICONS['avoid'] = dict(
    pick='d7825e5f0',
    pal={'t': '#797d83', 's': '#70747a', 'v': '#868a8f', 'C': '#aab1b6',
         'E': '#b1bcc0', 'F': '#bfc7c6'},
    grid=[
        '................',
        '.....OOOOOO.....',
        '....OtCEttsO....',
        '..OOvCFtttssOO..',
        '.OtvCttttttsssO.',
        'OtttttttttstsssO',
        'OsstttttttttttsO',
        'O==============O',
        '.OOOOOOOOOOOOOO.',
        '......O==OO.....',
        '.....O=====O....',
        '......OO==O.....',
        '.......O=O......',
        '......O=O.......',
        '.......O........',
        '................',
    ])

# closed: arched door with a padlock ("no source reachable"). The original
# sat one pixel right of centre, its edge a muddle of dark browns and greys,
# with a dark frame and base band that would double any outline, and a
# padlock that was a grey smudge. The frame is gone, so the door itself is
# now the silhouette: 12 px wide (frame width dropped) with a round arch,
# centred, in the shared outline. Planks repainted in the original browns
# (darker seams, light left edge, darker right edge, lighter arch top) over a
# one-row dark sill. Padlock given its own outline, a dark shackle with a
# hole and a keyhole, so it reads against the brown.
ICONS['closed'] = dict(
    pick='d7825e5f0',
    pal={'w': '#9e5c3e', 'q': '#934727', 'h': '#763e31', 'k': '#7f422f',
         '4': '#4a393b', 'A': '#746d5a', 'y': '#706253'},
    grid=[
        '................',
        '......OOOO......',
        '....OOwwwwOO....',
        '...OwqhqqhqkO...',
        '..OwqqhqqhqqkO..',
        '..OwqqhqqhqqkO..',
        '..OwqqhqOOOqkO..',
        '..OwqqhqOqOqkO..',
        '..OwqqhOOOOOkO..',
        '..OwqqhOAAyOkO..',
        '..OwqqhOAOyOkO..',
        '..OwqqhOOOOOkO..',
        '..OwqqhqqhqqkO..',
        '..O4444444444O..',
        '..OOOOOOOOOOOO..',
        '................',
    ])

# workaround: a red arrow hopping a striped barrier (access slice 9.2, an NPC
# performing a workaround; user pick, commit f373df648). The shape and fill are
# kept; the outline was 29 near-black shades (#00101b to #361018), all set to
# the shared outline. One pixel added: (5,10), outline over the arrow's tail,
# which had none. No pixel moved.
ICONS['workaround'] = dict(
    pick='f373df648',
    pal={},
    grid=[
        '................',
        '...........OO...',
        '........OOO==O..',
        '.......O======O.',
        '......O==OO==O..',
        '......O=O.O=O...',
        '.OOOOOO=OOOOOOO.',
        '.O====O=O=====O.',
        '.O====O=O=====O.',
        '.OOOOOO=OOOOOOO.',
        '..O=OOO=O..O=O..',
        '..O=O==O...O=O..',
        '..O=OOO....O=O..',
        '..O=O......O=O..',
        '..OOO......OOO..',
        '................',
    ])

# barrier: the plain striped barrier (access slice 9.2, a use that failed:
# the station refused it, a resource down or out of reach; user pick, commit
# f373df648). As workaround: the near-black outline shades set to the shared
# outline, fill kept.
ICONS['barrier'] = dict(
    pick='f373df648',
    pal={},
    grid=[
        '................',
        '................',
        '................',
        '................',
        '................',
        '.OOOOOOOOOOOOOO.',
        '.O============O.',
        '.O============O.',
        '.O============O.',
        '.OOOOOOOOOOOOOO.',
        '..O=O......O=O..',
        '..O=O......O=O..',
        '.O==O......O==O.',
        '.OOOO......OOOO.',
        '................',
        '................',
    ])

# Single-pixel touch-ups applied after the grid, (x, y): colour. Used for
# dark specks the generator left just inside the new outline of icons whose
# fill is otherwise kept.
FIXES = {
    'post': {
        (6, 3): '#764f34', (7, 3): '#764f34', (8, 3): '#764f34',   # knot: dark brown, not outline-black
        (6, 4): '#c19766',
        (6, 2): '#8d6340', (10, 2): '#b08158', (12, 3): '#c99b62', (10, 4): '#815438',
        (4, 12): '#8d6340', (12, 12): '#b98d5d', (6, 13): '#996c48', (10, 13): '#996c48',
    },
}

ORDER = ['caffeine', 'thirst', 'hunger', 'rest', 'social', 'work', 'curiosity',
         'post', 'printout', 'print', 'queue', 'file', 'blocked', 'noticed', 'avoid', 'closed',
         'workaround', 'barrier']


def hex_rgba(h):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)


def load_original(name, src):
    rel = 'public/break_escape/assets/icons/npc-%s.png' % name
    if src:
        im = Image.open(os.path.join(src, 'npc-%s.png' % name))
    else:
        blob = subprocess.check_output(['git', '-C', REPO, 'show',
                                        '%s:%s' % (ICONS[name].get('pick', PICK_COMMIT), rel)])
        im = Image.open(io.BytesIO(blob))
    im = im.convert('RGBA')
    assert im.size == (16, 16), (name, im.size)
    return im


def clean(name, orig):
    spec = ICONS[name]
    grid = spec['grid']
    assert len(grid) == 16 and all(len(r) == 16 for r in grid), name
    pal = {k: hex_rgba(v) for k, v in spec['pal'].items()}
    dx, dy = spec.get('shift', (0, 0))
    op = orig.load()
    out = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    px = out.load()
    for y, row in enumerate(grid):
        for x, ch in enumerate(row):
            if ch == '.':
                continue
            if ch == 'O':
                px[x, y] = hex_rgba(OUTLINE)
            elif ch == '=':
                c = op[x - dx, y - dy]
                assert c[3] == 255, '%s: kept pixel (%d,%d) is not opaque' % (name, x, y)
                px[x, y] = c
            else:
                px[x, y] = pal[ch]
    for (x, y), c in FIXES.get(name, {}).items():
        assert px[x, y][3] == 255, '%s: fix at (%d,%d) on a transparent pixel' % (name, x, y)
        px[x, y] = hex_rgba(c)
    return out


def check(name, im):
    """Return a list of problems: partial alpha, isolated pixels, fill on
    the silhouette edge, outline pixels with no fill next to them."""
    px = im.load()
    o = hex_rgba(OUTLINE)
    allow = ICONS[name].get('unoutlined', set())
    probs = []
    opaque = lambda x, y: 0 <= x < 16 and 0 <= y < 16 and px[x, y][3] == 255
    for y in range(16):
        for x in range(16):
            a = px[x, y][3]
            if a not in (0, 255):
                probs.append('alpha %d at (%d,%d)' % (a, x, y))
            if a == 0:
                continue
            n8 = [(x + i, y + j) for i in (-1, 0, 1) for j in (-1, 0, 1) if (i, j) != (0, 0)]
            if not any(opaque(*p) for p in n8):
                probs.append('isolated pixel at (%d,%d)' % (x, y))
            if px[x, y] != o:
                n4 = [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
                if any(not opaque(*p) for p in n4) and (x, y) not in allow:
                    probs.append('fill on the edge at (%d,%d)' % (x, y))
            else:
                if not any(opaque(*p) and px[p] != o for p in n8):
                    probs.append('outline pixel with no fill beside it at (%d,%d)' % (x, y))
    return probs


def contact_sheet(pairs, path):
    S, gap, label = 8, 8, 14
    cell_w = 16 * S * 2 + gap * 3
    cell_h = 16 * S + label + gap
    cols = 4
    rows = (len(pairs) + cols - 1) // cols
    strip_h = 16 * 3 + 16 + gap * 3 + label
    W = cols * cell_w
    H = rows * cell_h + strip_h + gap
    sheet = Image.new('RGBA', (W, H), BACKING + (255,))
    d = ImageDraw.Draw(sheet)
    for i, (name, orig, new) in enumerate(pairs):
        cx, cy = (i % cols) * cell_w, (i // cols) * cell_h
        d.text((cx + gap, cy + 2), '%s  (original | cleaned)' % name, fill=(230, 230, 230, 255))
        for k, im in enumerate((orig, new)):
            big = im.resize((16 * S, 16 * S), Image.NEAREST)
            sheet.alpha_composite(big, (cx + gap + k * (16 * S + gap), cy + label))
    y0 = rows * cell_h + gap
    d.text((gap, y0), 'cleaned, 1x and 3x on the in-game backing', fill=(230, 230, 230, 255))
    x = gap
    for name, _, new in pairs:
        sheet.alpha_composite(new, (x + 16, y0 + label + 4))
        x += 16 * 3 + gap
    x = gap
    for name, _, new in pairs:
        sheet.alpha_composite(new.resize((48, 48), Image.NEAREST), (x, y0 + label + 28))
        x += 16 * 3 + gap
    sheet.save(path)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--src', help='folder of original npc-<name>.png files (default: git %s, or the icon\'s pick)' % PICK_COMMIT)
    ap.add_argument('--sheet', help='write a contact sheet PNG here')
    ap.add_argument('--diff', action='store_true', help='print every changed pixel')
    ap.add_argument('--dry-run', action='store_true', help='do not write the assets')
    ap.add_argument('only', nargs='*', help='icon names (default: all)')
    args = ap.parse_args()

    names = args.only or ORDER
    pairs, bad = [], 0
    for name in names:
        orig = load_original(name, args.src)
        new = clean(name, orig)
        probs = check(name, new)
        op, np_ = orig.load(), new.load()
        changed = [(x, y) for y in range(16) for x in range(16)
                   if op[x, y] != np_[x, y] and (op[x, y][3] or np_[x, y][3])]   # clear on both sides is no change
        print('%-10s %3d pixels changed%s' % (name, len(changed), '' if not probs else '  PROBLEMS:'))
        for p in probs:
            print('    ' + p)
        bad += len(probs)
        if args.diff:
            for x, y in changed:
                c = np_[x, y]
                print('    (%2d,%2d) -> %s' % (x, y, 'clear' if c[3] == 0 else '#%02x%02x%02x' % c[:3]))
        if not args.dry_run:
            new.save(os.path.join(ICON_DIR, 'npc-%s.png' % name))
        pairs.append((name, orig, new))
    if args.sheet:
        contact_sheet(pairs, args.sheet)
        print('sheet:', args.sheet)
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
