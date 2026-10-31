#!/usr/bin/env python3
"""
Hand-drawn props for m06's HashChain Exchange rooms (room_hce_* in
generate_rooms.py): the HASHCHAIN wordmark, the price ticker, world clocks,
market screens, door plates and wall notices. Drawn pixel by pixel at native
size with the Canvas and 3x5 font from make_uni_props.py (as extended by
make_aes_props.py). Nothing is rescaled.

Writes PNGs into public/break_escape/assets/objects/; register new names with
register_object.py (--wall for wall items).

Usage: python3 scripts/room_gen/make_hce_props.py [--only name1,name2]
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_uni_props as U  # noqa: E402
import make_aes_props  # noqa: E402,F401  (extends U.FONT with digits and punctuation)
from make_uni_props import Canvas, OUTLINE, RIM, WHITE, PAPER, INK, GREY_TEXT, \
    STEEL, STEEL_LIGHT, STEEL_DARK  # noqa: E402

OBJ = Path(__file__).resolve().parents[2] / "public/break_escape/assets/objects"

U.FONT.update({
    "+": ["...", ".#.", "###", ".#.", "..."], "=": ["...", "###", "...", "###", "..."], "?": ["##.", "..#", ".#.", "...", ".#."],
    "1": [".#.", "##.", ".#.", ".#.", "###"], "2": ["##.", "..#", ".#.", "#..", "###"],
    "3": ["##.", "..#", ".#.", "..#", "##."], "4": ["#.#", "#.#", "###", "..#", "..#"],
    "$": [".##", "##.", ".#.", ".##", "##."], "%": ["#.#", "..#", ".#.", "#..", "#.#"],
    "'": [".#.", ".#.", "...", "...", "..."], ",": ["...", "...", "...", ".#.", "#.."],
})

AMBER = (232, 146, 36)
AMBER_DARK = (176, 104, 24)
GOLD = (214, 176, 80)
GOLD_DARK = (150, 116, 44)
NAVY = (22, 30, 60)
NAVY_MID = (36, 48, 88)
LED_BG = (14, 14, 20)
UP = (70, 214, 110)
DOWN = (226, 70, 64)
SCREEN_BG = (12, 20, 36)
GRID = (28, 40, 62)
CYAN = (60, 176, 206)


def hex_mark(c, x0, y0, colour, size=5):
    """Two linked hexagons, `size` px tall, from (x0, y0)."""
    shape = [".###.", "#...#", "#...#", "#...#", ".###."] if size == 5 else \
        ["..###..", ".#...#.", "#.....#", "#.....#", "#.....#", ".#...#.", "..###.."]
    w = len(shape[0])
    for k in (0, w - 1):
        for j, row in enumerate(shape):
            for i, ch in enumerate(row):
                if ch == "#":
                    c.px(x0 + k + i, y0 + j, colour)
    c.hline(x0 + 2, x0 + 2 * w - 4, y0 + len(shape) // 2, colour)


def logo_sign():
    """HASHCHAIN wordmark: gold on a navy panel with a thin gold rim; the linked-hex mark."""
    w, h = 64, 17
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (12, 16, 32))
    c.frame(1, 1, w - 2, h - 2, GOLD_DARK)
    c.rect(2, 2, w - 3, h - 3, NAVY)
    hex_mark(c, 4, 5, GOLD, size=7)
    c.text(20, 4, "HASHCHAIN", GOLD)
    c.text(20, 10, "EXCHANGE", (150, 160, 190))
    c.save(OBJ, "hce_logo_sign1")


def logo_small():
    """A small wordmark plate for corridors: HASHCHAIN in gold on navy."""
    w, h = 48, 11
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (12, 16, 32))
    c.rect(1, 1, w - 2, h - 2, NAVY)
    hex_mark(c, 3, 3, GOLD)
    c.text(12, 3, "HASHCHAIN", GOLD)
    c.save(OBJ, "hce_logo_small1")


TICKER = [("BTC", "61240", True), ("ETH", "3012", False), ("XMR", "162", True),
          ("SOL", "141", True), ("LTC", "71", False), ("HCX", "0.42", True)]


def ticker():
    """A black LED price ticker, 184x9: symbol in amber, price white, a green or red arrow."""
    w, h = 184, 9
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (40, 40, 48))
    c.rect(1, 1, w - 2, h - 2, LED_BG)
    x = 3
    for sym, price, up in TICKER:
        if x + (len(sym) + len(price)) * 4 + 10 > w - 2:
            break
        c.text(x, 2, sym, AMBER)
        x += len(sym) * 4 + 1
        c.text(x, 2, price, (230, 230, 230))
        x += len(price) * 4
        col = UP if up else DOWN
        if up:
            for j, half in enumerate((0, 1, 2)):
                c.hline(x + 2 - half, x + 2 + half, 3 + j, col)
        else:
            for j, half in enumerate((2, 1, 0)):
                c.hline(x + 2 - half, x + 2 + half, 3 + j, col)
        x += 9
    c.save(OBJ, "hce_ticker1")


def clock_face(c, cx, cy, hour_dir, min_dir):
    """A 9x9 clock: white face, dark rim, two hands given as (dx, dy) per step."""
    for y in range(cy - 4, cy + 5):
        for x in range(cx - 4, cx + 5):
            d = (x - cx) ** 2 + (y - cy) ** 2
            if d <= 16:
                c.px(x, y, (40, 40, 48) if d > 9 else WHITE)
    for k in range(1, 3):
        c.px(cx + hour_dir[0] * k, cy + hour_dir[1] * k, (30, 30, 36))
    for k in range(1, 4):
        c.px(cx + min_dir[0] * k, cy + min_dir[1] * k, (200, 60, 50))


def world_clocks():
    """Three wall clocks with city labels on a navy strip: London, New York, Tokyo."""
    w, h = 44, 19
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (12, 16, 32))
    c.rect(1, 1, w - 2, h - 2, NAVY_MID)
    # 23:40 in London, 18:40 New York, 07:40 Tokyo
    clock_face(c, 7, 7, (-1, -1), (-1, 0))
    clock_face(c, 22, 7, (1, 1), (-1, 0))
    clock_face(c, 37, 7, (1, 0), (-1, 0))
    c.text(2, 13, "LDN", (200, 206, 220))
    c.text(17, 13, "NYC", (200, 206, 220))
    c.text(32, 13, "TKY", (200, 206, 220))
    c.save(OBJ, "hce_world_clocks1")


def chart_screen(name, kind):
    """A 48x30 wall screen: a candlestick chart (kind 'candles'), an order-book depth
    chart ('depth') or a wallet-flow graph ('graph')."""
    w, h = 48, 30
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (30, 30, 36))
    c.rect(1, 1, w - 2, h - 2, SCREEN_BG)
    for y in range(6, h - 2, 6):
        c.hline(2, w - 3, y, GRID)
    if kind == "candles":
        c.text(3, 2, "BTC", AMBER)
        closes = [20, 18, 19, 16, 17, 14, 15, 12, 13, 10, 12, 9, 8, 10, 7]
        prev = 21
        for i, cl in enumerate(closes):
            x = 4 + i * 3
            up = cl < prev
            top, bot = sorted((prev, cl))
            col = UP if up else DOWN
            c.rect(x, top, x + 1, max(bot, top + 1), col)
            c.px(x, top - 2, col)
            c.px(x, top - 1, col)
            prev = cl
    elif kind == "depth":
        c.text(3, 2, "BOOK", AMBER)
        for x in range(2, w // 2):
            top = 10 + (x * 2) // 3
            for y in range(top, h - 2):
                c.px(x, y, (40, 120, 70) if y > top else UP)
        for x in range(w // 2, w - 2):
            top = 10 + ((w - x) * 2) // 3
            for y in range(top, h - 2):
                c.px(x, y, (130, 44, 40) if y > top else DOWN)
    elif kind == "graph":
        nodes = [(8, 9), (8, 18), (8, 25), (24, 16), (38, 10), (38, 22)]
        for a, b in ((0, 3), (1, 3), (2, 3), (3, 4), (3, 5)):
            (x0, y0), (x1, y1) = nodes[a], nodes[b]
            n = max(abs(x1 - x0), abs(y1 - y0))
            for k in range(n + 1):
                c.px(x0 + (x1 - x0) * k // n, y0 + (y1 - y0) * k // n, (90, 110, 150))
        for i, (x, y) in enumerate(nodes):
            col = DOWN if i < 3 else (AMBER if i == 3 else CYAN)
            c.rect(x - 1, y - 1, x + 1, y + 1, col)
    c.save(OBJ, name)


def plate(text, face, ink, name, pad=2, rim=None):
    w = len(text) * 4 - 1 + 2 * (pad + 2)
    c = Canvas(w, 11)
    c.rect(0, 0, w - 1, 10, (12, 16, 32))
    c.frame(1, 1, w - 2, 9, rim or face)
    c.rect(2, 2, w - 3, 8, face)
    c.text(pad + 2, 3, text, ink)
    c.save(OBJ, name)


def two_line_plate(l1, l2, face, ink, name, ink2=None):
    w = max(len(l1), len(l2)) * 4 - 1 + 8
    c = Canvas(w, 17)
    c.rect(0, 0, w - 1, 16, (30, 30, 36))
    c.rect(1, 1, w - 2, 15, face)
    c.text_centred(0, w - 1, 3, l1, ink)
    c.text_centred(0, w - 1, 9, l2, ink2 or ink)
    c.save(OBJ, name)


NEWS = (232, 226, 206)
NEWS_INK = (60, 58, 56)


def press_clipping():
    """The framed press clipping: a black and gold frame round a newspaper page, a
    masthead, a bold headline, a photo of Satoshi's hooded figure and columns of print."""
    w, h = 26, 30
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (20, 20, 24))
    c.frame(1, 1, w - 2, h - 2, GOLD)
    c.rect(2, 2, w - 3, h - 3, (14, 14, 18))
    c.rect(4, 4, w - 5, h - 5, NEWS)
    c.hline(5, w - 6, 5, NEWS_INK)         # masthead
    c.hline(5, w - 6, 6, NEWS_INK)
    c.hline(5, w - 6, 8, (180, 60, 40))    # headline
    c.hline(5, 16, 9, (180, 60, 40))
    # photo: a hooded figure in grey
    c.rect(5, 11, 12, 18, (150, 148, 140))
    c.rect(7, 12, 10, 15, (70, 70, 74))
    c.rect(6, 15, 11, 18, (70, 70, 74))
    c.px(8, 14, (190, 186, 176))
    c.px(9, 14, (190, 186, 176))
    for y in range(11, h - 6, 2):
        c.hline(14, w - 6, y, (140, 136, 128))
    for y in range(20, h - 6, 2):
        c.hline(5, 12, y, (140, 136, 128))
    c.save(OBJ, "hce_press_clipping1")


def whiteboard(name, kind):
    """A 46x30 whiteboard: elliptic-curve maths in blue and red ('maths', Irina's) or a
    hand-drawn transaction graph with arrows ('graph', the analysts')."""
    w, h = 46, 30
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, STEEL_DARK)
    c.frame(1, 1, w - 2, h - 2, STEEL_LIGHT)
    c.rect(2, 2, w - 3, h - 4, (240, 242, 244))
    c.hline(4, w - 5, h - 3, STEEL)          # marker ledge
    c.rect(8, h - 3, 11, h - 3, (40, 80, 180))
    c.rect(14, h - 3, 17, h - 3, (190, 50, 50))
    blue, red, black = (40, 80, 180), (190, 50, 50), (40, 40, 46)
    if kind == "maths":
        c.text(4, 4, "Y", blue)
        c.px(8, 4, blue)
        c.text(10, 4, "=X", blue)
        c.px(18, 4, blue)
        c.text(20, 4, "+7", blue)
        # the curve: y^2 = x^3 + 7, drawn by hand
        import math
        for i in range(60):
            x = -1.9 + i * 0.07
            v = x ** 3 + 7
            if v < 0:
                continue
            y = math.sqrt(v)
            px = 26 + int(x * 5)
            for sy in (1, -1):
                py = 17 - int(sy * y * 1.6)
                if 10 <= py <= h - 5:
                    c.px(px, py, red)
        c.hline(18, 44, 17, (170, 170, 176))
        for y in range(11, 24, 3):
            c.hline(4, 14, y, black if y % 2 else blue)
        c.text(4, 24, "MOD P", black)
    else:
        nodes = [(7, 7), (7, 14), (7, 21), (22, 14), (36, 8), (36, 20)]
        for a, b in ((0, 3), (1, 3), (2, 3), (3, 4), (3, 5)):
            (x0, y0), (x1, y1) = nodes[a], nodes[b]
            n = max(abs(x1 - x0), abs(y1 - y0))
            for k in range(n + 1):
                c.px(x0 + (x1 - x0) * k // n, y0 + (y1 - y0) * k // n, blue)
        for i, (x, y) in enumerate(nodes):
            col = red if i < 3 else black
            c.frame(x - 2, y - 2, x + 2, y + 2, col)
        c.text(18, 19, "MIX", red)
        c.text(30, 24, "??", red)
    c.save(OBJ, name)


def whitepaper_frame():
    """The bitcoin white paper's first page, framed: a gold frame, title lines and two columns."""
    w, h = 20, 26
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, GOLD_DARK)
    c.frame(1, 1, w - 2, h - 2, GOLD)
    c.rect(3, 3, w - 4, h - 4, (244, 242, 236))
    c.hline(5, w - 6, 5, (30, 30, 34))
    c.hline(6, w - 7, 6, (30, 30, 34))
    c.hline(7, w - 8, 8, (120, 120, 124))
    for y in range(11, h - 4, 2):
        c.hline(4, 8, y, (150, 150, 154))
        c.hline(11, w - 5, y, (150, 150, 154))
    c.save(OBJ, "hce_whitepaper_frame1")


def block_screen():
    """Satoshi's wall screen, 48x30: the latest block height in big amber digits, a hash
    line, and a row of the last blocks as small boxes filling in."""
    w, h = 48, 30
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (30, 30, 36))
    c.rect(1, 1, w - 2, h - 2, SCREEN_BG)
    c.text(3, 3, "BLOCK", (150, 160, 190))
    c.text(3, 10, "861204", AMBER)
    c.text(28, 10, "+1", UP)
    for x in range(3, w - 3, 2):
        c.px(x, 17, (70, 90, 120) if (x * 7) % 5 else CYAN)
    for i in range(7):
        x = 3 + i * 6
        c.frame(x, 21, x + 4, 25, (90, 110, 150))
        if i < 6:
            c.rect(x + 1, 22, x + 3, 24, (50, 140, 90) if i < 5 else AMBER)
    c.save(OBJ, "hce_block_screen1")


def phd_frame():
    """Irina's doctorate, framed: a dark wood frame, cream certificate, a red seal and
    a ribbon, lines of script."""
    w, h = 24, 19
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (70, 44, 30))
    c.frame(1, 1, w - 2, h - 2, (110, 74, 48))
    c.rect(3, 3, w - 4, h - 4, (240, 232, 210))
    c.hline(6, w - 7, 5, (60, 50, 50))
    c.hline(8, w - 9, 7, (140, 130, 120))
    c.hline(6, w - 7, 9, (140, 130, 120))
    c.hline(7, w - 8, 11, (140, 130, 120))
    c.rect(w - 9, 12, w - 7, 14, (180, 40, 40))
    c.px(w - 9, 15, (180, 40, 40))
    c.px(w - 7, 15, (180, 40, 40))
    c.save(OBJ, "hce_phd_frame1")


def sconce():
    """A brass wall sconce with a warm glow above and below, 10x16."""
    w, h = 10, 16
    c = Canvas(w, h)
    glow = (250, 200, 120, 90)
    for y in range(0, 5):
        for x in range(2 + (4 - y) // 2, 8 - (4 - y) // 2):
            c.px(x, y, glow)
    c.rect(2, 5, 7, 9, (250, 226, 170))
    c.frame(2, 5, 7, 9, GOLD_DARK)
    c.rect(4, 10, 5, 12, GOLD_DARK)
    c.rect(3, 13, 6, 13, GOLD)
    for y in range(14, 16):
        c.hline(3, 6, y, (250, 200, 120, 60))
    c.save(OBJ, "hce_sconce1")


def art_canvas():
    """A large abstract canvas in navy, amber and white: bold blocks and a gold stroke,
    unframed with a thin dark edge, 40x26."""
    w, h = 40, 26
    c = Canvas(w, h)
    c.rect(0, 0, w - 1, h - 1, (20, 20, 26))
    c.rect(1, 1, w - 2, h - 2, (232, 228, 220))
    c.rect(2, 2, 17, h - 3, NAVY_MID)
    c.rect(18, 12, w - 3, h - 3, AMBER)
    c.rect(24, 4, 33, 10, (30, 30, 36))
    import math
    for x in range(3, w - 3):
        y = int(13 + 6 * math.sin(x / 5.0))
        c.px(x, y, GOLD)
        c.px(x, y + 1, GOLD_DARK)
    c.save(OBJ, "hce_art_canvas1")


def main():
    only = None
    if "--only" in sys.argv:
        only = set(sys.argv[sys.argv.index("--only") + 1].split(","))
    jobs = {
        "hce_logo_sign1": logo_sign,
        "hce_logo_small1": logo_small,
        "hce_ticker1": ticker,
        "hce_world_clocks1": world_clocks,
        "hce_chart_screen1": lambda: chart_screen("hce_chart_screen1", "candles"),
        "hce_chart_screen2": lambda: chart_screen("hce_chart_screen2", "depth"),
        "hce_chart_screen3": lambda: chart_screen("hce_chart_screen3", "graph"),
        "hce_press_clipping1": press_clipping,
        "hce_whiteboard_maths1": lambda: whiteboard("hce_whiteboard_maths1", "maths"),
        "hce_whiteboard_graph1": lambda: whiteboard("hce_whiteboard_graph1", "graph"),
        "hce_whitepaper_frame1": whitepaper_frame,
        "hce_custody_sign1": lambda: two_line_plate("CUSTODY VAULT", "TWO-PERSON RULE", (170, 40, 40), WHITE,
                                                    "hce_custody_sign1", ink2=(250, 220, 200)),
        "hce_exec_sign1": lambda: plate("EXECUTIVE SUITE", NAVY, GOLD, "hce_exec_sign1", rim=GOLD_DARK),
        "hce_staff_sign1": lambda: plate("STAFF ONLY", NAVY, WHITE, "hce_staff_sign1", rim=AMBER_DARK),
        "hce_server_sign1": lambda: plate("SERVER ROOM 1", (30, 64, 78), CYAN, "hce_server_sign1", rim=CYAN),
        "hce_block_screen1": block_screen,
        "hce_phd_frame1": phd_frame,
        "hce_sconce1": sconce,
        "hce_art_canvas1": art_canvas,
        "hce_lab_sign1": lambda: plate("CHAIN ANALYSIS", NAVY, AMBER, "hce_lab_sign1", rim=AMBER_DARK),
    }
    for name, fn in jobs.items():
        if only is None or name in only:
            fn()


if __name__ == "__main__":
    main()
