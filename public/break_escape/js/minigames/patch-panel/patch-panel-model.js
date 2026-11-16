// The patch panel's pure rules (docs/achitechture/PHYSICAL_PENTEST_DEVICES_PLAN.md 5.4):
// the layout for a viewport and the state of each port. No DOM, no Phaser, so node tests run it.

export const PORT_COUNT = 24;

// Port art is 12 source px on a 14 px pitch; a row's strip adds 4 (the last pitch gap less the
// 3 px margins at each end, 14n - 2 + 6)
const PORT_PX = 12;
const PITCH_PX = 14;
const STRIP_EXTRA_PX = 4;

/** Source px across a row of n ports, margins included: 172 for 12, 88 for 6, 60 for 4. */
export const rowWidthSource = (perRow) => PITCH_PX * perRow + STRIP_EXTRA_PX;

/** Height of the small range label above each strip of the 4 rows of 6 (VT323 16 px, no gap). */
export const RANGE_LABEL_PX = 16;

/** True for the shape that prints a port range above each strip (4 rows of 6, 5.4). */
export const hasRangeLabels = (perRow) => perRow === 6;

/**
 * CSS px a row takes down the screen: ports, their label line and the gap (5.4), plus the range
 * label when the row has one (perRow 6).
 */
export const rowHeightPx = (scale, perRow = 12) =>
    PORT_PX * scale + (scale >= 4 ? 36 : 28) + (hasRangeLabels(perRow) ? RANGE_LABEL_PX : 0);

/** The text above a strip: "1-6", "7-12" ... for the first and last port of the row. */
export const rangeLabel = (row) => (row.length ? `${row[0]}-${row[row.length - 1]}` : '');

/** Height the title bar, legend, footer and gutters take (5.4: 204 on wide screens, 214 narrow). */
export const overheadPx = (contentWidth) => (contentWidth >= 480 ? 204 : 214);

/** W, the content width: the viewport less 32 gutters, 32 frame and 16 padding. */
export const contentWidth = (vw) => vw - 80;

/** Width the scroll area's vertical scrollbar takes from W. */
export const SCROLLBAR_PX = 16;

const SHAPES = [
    { rows: 2, perRow: 12 },
    { rows: 4, perRow: 6 }
];

/** Below this W the 4 rows of 6 (at least 264 wide) are no longer offered in the scroll fallback. */
export const NARROW_W = 344;

/**
 * Pick the layout for a viewport. Rule: the largest scale in {4, 3} at which 2 rows of 12 fit
 * both W and H; else the largest at which 4 rows of 6 fit; else 6 rows of 4 at scale 3. When
 * nothing fits by height, the widest shape that fits W is drawn in a scrolling area
 * (scroll: true, which shows the "More below" cue), at its largest scale that fits W; below
 * W 344 that is 6 rows of 4 at scale 3.
 * Returns { rows, perRow, scale, width, height, scroll, W, H } with width and height in CSS px.
 */
export function chooseLayout(vw, vh) {
    const W = contentWidth(vw);
    const H = vh - overheadPx(W);
    const make = (rows, perRow, scale, scroll) => ({
        rows, perRow, scale, scroll, W, H,
        width: rowWidthSource(perRow) * scale,
        height: rows * rowHeightPx(scale, perRow)
    });
    for (const { rows, perRow } of SHAPES) {
        for (const scale of [4, 3]) {
            const fit = make(rows, perRow, scale, false);
            if (fit.width <= W && fit.height <= H) return fit;
        }
    }
    const last = make(6, 4, 3, false);
    if (last.width <= W && last.height <= H) return last;
    if (W >= NARROW_W) {
        for (const { rows, perRow } of SHAPES) {
            for (const scale of [4, 3]) {
                const fit = make(rows, perRow, scale, true);
                if (fit.width <= W - SCROLLBAR_PX) return fit;
            }
        }
    }
    return { ...last, scroll: true };
}

/** Port numbers (1-based) of each row of a layout. */
export function rowsOf(layout) {
    const out = [];
    for (let r = 0; r < layout.rows; r++) {
        const row = [];
        for (let c = 0; c < layout.perRow; c++) row.push(r * layout.perRow + c + 1);
        out.push(row);
    }
    return out;
}

/** The entry for each of the 24 ports (null where the panel lists none). */
export function entriesByPort(panelPorts) {
    const out = new Array(PORT_COUNT + 1).fill(null);
    if (!Array.isArray(panelPorts)) return out;
    for (const entry of panelPorts) {
        const port = Number(entry?.port);
        if (Number.isInteger(port) && port >= 1 && port <= PORT_COUNT && !out[port]) out[port] = entry;
    }
    return out;
}

/**
 * The state of one port:
 *   empty     the panel lists nothing for it
 *   unpatched an entry with no jack (or a jack the scenario does not hold)
 *   held      the player's box is in it (heldFoothold from networkLinks.heldAt)
 *   managed   the jack has port security
 *   patched   any other jack
 */
export function portState(entry, jack, heldFoothold) {
    if (!entry) return 'empty';
    if (!entry.jack || !jack) return 'unpatched';
    if (heldFoothold) return 'held';
    if (jack.portSecurity) return 'managed';
    return 'patched';
}

/** What a port shows as its label: the entry's label (3 characters at most), else the 2-digit number. */
export function portLabel(entry, port) {
    const text = typeof entry?.label === 'string' ? entry.label.trim().slice(0, 3) : '';
    return text || String(port).padStart(2, '0');
}

/** The VLAN letter class (second cue only) from a label's first letter: d, v, g, m, else none. */
export function vlanClass(label) {
    const c = String(label || '').charAt(0).toLowerCase();
    return 'dvgm'.includes(c) && c ? c : '';
}

/**
 * Find a jack's object data by id, from where the live engine keeps it (the bootstrap scenario
 * holds no room objects, so scenario.rooms is only a last resort for tests and older callers):
 *   1. rooms[*].panelJacks[id]            panelOf jacks, stored by core/rooms.js (no sprite)
 *   2. rooms[*].objects[*].scenarioData   world jacks, which keep their sprites
 *   3. scenario.rooms[*].objects[]        a full scenario, when one is supplied
 * Returns null when the jack is held nowhere.
 */
export function findJack(jackId, { rooms = null, scenario = null } = {}) {
    if (!jackId) return null;
    for (const room of Object.values(rooms || {})) {
        const stored = room?.panelJacks?.[jackId];
        if (stored) return stored;
    }
    for (const room of Object.values(rooms || {})) {
        for (const obj of Object.values(room?.objects || {})) {
            if (obj?.scenarioData?.id === jackId) return obj.scenarioData;
        }
    }
    for (const room of Object.values(scenario?.rooms || {})) {
        if (!Array.isArray(room?.objects)) continue;
        for (const obj of room.objects) if (obj?.id === jackId) return obj;
    }
    return null;
}
