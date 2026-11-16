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

/** CSS px a row takes down the screen: ports, their label line and the gap (5.4). */
export const rowHeightPx = (scale) => PORT_PX * scale + (scale >= 4 ? 36 : 28);

/** Height the title bar, legend, footer and gutters take (5.4: 204 on wide screens, 214 narrow). */
export const overheadPx = (contentWidth) => (contentWidth >= 480 ? 204 : 214);

/** W, the content width: the viewport less 32 gutters, 32 frame and 16 padding. */
export const contentWidth = (vw) => vw - 80;

const SHAPES = [
    { rows: 2, perRow: 12 },
    { rows: 4, perRow: 6 }
];

/**
 * Pick the layout for a viewport. Rule: the largest scale in {4, 3} at which 2 rows of 12 fit
 * both W and H; else the largest at which 4 rows of 6 fit; else 6 rows of 4 at scale 3; else
 * the same inside a scrolling area (scroll: true, which shows the "More below" cue).
 * Returns { rows, perRow, scale, width, height, scroll, W, H } with width and height in CSS px.
 */
export function chooseLayout(vw, vh) {
    const W = contentWidth(vw);
    const H = vh - overheadPx(W);
    const make = (rows, perRow, scale, scroll) => ({
        rows, perRow, scale, scroll, W, H,
        width: rowWidthSource(perRow) * scale,
        height: rows * rowHeightPx(scale)
    });
    for (const { rows, perRow } of SHAPES) {
        for (const scale of [4, 3]) {
            const fit = make(rows, perRow, scale, false);
            if (fit.width <= W && fit.height <= H) return fit;
        }
    }
    const last = make(6, 4, 3, false);
    if (last.width <= W && last.height <= H) return last;
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

/** Find a jack's object data by id across the scenario's rooms (null when absent). */
export function findJack(scenario, jackId) {
    if (!jackId) return null;
    for (const room of Object.values(scenario?.rooms || {})) {
        for (const obj of room?.objects || []) if (obj?.id === jackId) return obj;
    }
    return null;
}
