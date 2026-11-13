/**
 * The one PC monitor frame (UX slice 2c): every view of a PC (the sign-in screen, a
 * computer's password screen, the desktop, a share's folder window, a remote sign-in) sits
 * in this frame, with one bezel look (css/pc-monitor.css) and one sizing rule
 * (pcMonitorMetrics). The size depends only on the space the minigame window has and the
 * PC's post-it, so moving from a PC's sign-in screen to its desktop neither resizes nor
 * moves the monitor.
 *
 * The monitor is the whole window: the X sits in the bezel's top strip, the footer buttons
 * (Add Postit to notepad) in its chin, and the PC's post-it is stuck on the chin just under the
 * screen. The chin grows to hold the note's measured height (R1 M1), and that height is
 * kept per PC for the current window size, so a view of the same PC without the note (a share window)
 * keeps the same frame.
 *
 * The screen's content is drawn at a whole-number scale (R1 M2, `uiScale`): x2 once the
 * screen has room for twice the 560x350 base layout, so a large window gets larger pixel
 * text and boxes instead of a small block in an empty screen.
 *
 * Pure apart from mountPcMonitor, which builds the DOM.
 */

/** A landscape monitor's screen: 16:10. */
export const PC_SCREEN_ASPECT = 16 / 10;

/** The tallest a portrait monitor gets (a phone held upright): 10:16 (R1 m10). */
export const PC_PORTRAIT_ASPECT = 10 / 16;

/** The screen stops growing here, so a large window does not get a wall-sized monitor. */
export const PC_SCREEN_MAX = Object.freeze({ width: 1120, height: 700 });

/** The smallest screen worth drawing, when the window has the room for it. */
export const PC_SCREEN_MIN = Object.freeze({ width: 280, height: 200 });

/** Below this width the frame is narrow, below this height short; either uses the compact bezel. */
export const PC_COMPACT_BELOW = 560;

/** The layout the screen's content is drawn for at x1; the scale is how many times it fits. */
export const PC_UI_BASE = Object.freeze({ width: 560, height: 350 });

/**
 * Bezel strips in CSS pixels. `top` holds the PC name and the X (30px), `chin` the
 * footer buttons and the post-it (grown to the note's height when it needs more). `gutter`
 * is the gap to the window edge, `hang` the room kept under the monitor for the note's
 * 4px offset shadow.
 */
export const PC_BEZEL = Object.freeze({
    full: Object.freeze({ side: 20, top: 38, chin: 44, gutter: 16, hang: 4 }),
    compact: Object.freeze({ side: 12, top: 34, chin: 44, gutter: 8, hang: 4 })
});

/** The post-it's inset from the monitor's left edge, past the side bezel, and its gap under the screen. */
export const PC_POSTIT_INSET = Object.freeze({ full: 24, compact: 12 });
export const PC_POSTIT_GAP = 4;

/**
 * The fallback for the chin's right part kept clear of the note (the page measures it, see
 * update(), and keeps the measurement for the next pass): the "Add Postit to notepad" button
 * (212px wide on one line in the full bezel; stacked on two lines in a compact or narrow
 * frame, 125px, measured in a browser), the power light, the padding to the bezel's edge and
 * a gap to the note. A narrow frame (a phone) hides the light, which gives that room back.
 */
export const PC_CHIN_BUTTON_ROOM = Object.freeze({ full: 254, compact: 159, narrow: 145 });

/** The narrowest the note's column gets when the chin is short of room (the note wraps instead). */
export const PC_POSTIT_MIN_WIDTH = 96;

/** The chin button's label: it adds the post-it, so it is not the file reader's "Add to Notepad". */
export const PC_POSTIT_BUTTON_LABEL = 'Add Postit to notepad';

/**
 * The chin button's inner HTML (icon and label), the one wording for every PC view. The label
 * is two spans (the text reads as one line), so a compact or narrow frame can stack them
 * ("Add Postit" over "to notepad", css/pc-monitor.css) and leave the note more room.
 */
export function pcPostitButtonHtml() {
    const [first, second] = [PC_POSTIT_BUTTON_LABEL.slice(0, 10), PC_POSTIT_BUTTON_LABEL.slice(11)];
    return `<img src="/break_escape/assets/icons/notes.png" alt="Notepad" class="icon-small notepad-btn-icon"> `
        + `<span class="pc-postit-label"><span>${first}</span> <span>${second}</span></span>`;
}

/** The room left between the note's bottom and the bezel's outline. */
export const PC_POSTIT_CLEAR = 2;

/** The bezel's outline and the screen's rim, both 2px (css/pc-monitor.css). */
export const PC_FRAME_EDGE = 2;

const even = (v) => Math.max(0, Math.floor(v / 2) * 2);

/**
 * The notepad entry for a PC's post-it, added from a view of the PC that is not its own
 * desktop (a share window or a file opened from the desktop, R4 m2): the note is stuck on
 * the monitor, so it can be noted from any of the PC's views.
 *   -> { title, content, observations }
 */
export function postitNotebookEntry(pcName, note) {
    const name = String(pcName || 'PC');
    return {
        title: `Postit Note - ${name}`,
        content: `Postit Note:\n${'-'.repeat(20)}\n\n${String(note || '')}`,
        observations: `Postit note found on ${name}.`
    };
}

/**
 * The monitor's geometry for a window of viewW x viewH CSS pixels: the screen, the whole
 * monitor, its place in the window (whole pixels), the post-it's place on the frame and the
 * content scale. `postitHeight` is the note's measured height (0 for no note): the chin
 * grows to hold it, so the note never hangs below the monitor.
 *   -> { compact, narrow, short, uiScale, bezel, screen: { width, height }, width, height,
 *        left, top, postit: { left, top, maxWidth } }
 * `postit` is relative to the monitor's own top-left corner.
 */
export function pcMonitorMetrics(viewW, viewH, { postitHeight = 0, chinRoom = 0 } = {}) {
    const vw = Math.max(0, Math.floor(Number(viewW) || 0));
    const vh = Math.max(0, Math.floor(Number(viewH) || 0));
    const narrow = vw < PC_COMPACT_BELOW;
    const short = vh < PC_COMPACT_BELOW;
    const compact = narrow || short;
    const base = compact ? PC_BEZEL.compact : PC_BEZEL.full;
    const noteH = Math.max(0, Math.ceil(Number(postitHeight) || 0));
    const chin = noteH ? Math.max(base.chin, PC_POSTIT_GAP + noteH + PC_POSTIT_CLEAR) : base.chin;
    const bezel = { ...base, chin };
    const edges = 4 * PC_FRAME_EDGE;
    const availW = Math.max(0, vw - 2 * bezel.gutter - 2 * bezel.side - edges);
    const availH = Math.max(0, vh - 2 * bezel.gutter - bezel.top - bezel.chin - bezel.hang - edges);

    // Landscape space: a 16:10 screen. Portrait space (a phone held upright): a portrait
    // monitor that follows the space, no taller than 10:16.
    const spaceRatio = availH > 0 ? availW / availH : PC_SCREEN_ASPECT;
    const ratio = spaceRatio >= 1 ? PC_SCREEN_ASPECT : Math.max(PC_PORTRAIT_ASPECT, spaceRatio);

    let width = Math.min(availW, availH * ratio, PC_SCREEN_MAX.width);
    if (width / ratio > PC_SCREEN_MAX.height) width = PC_SCREEN_MAX.height * ratio;
    // The minimum only where the window has the room: the frame never overflows
    width = Math.min(Math.max(width, PC_SCREEN_MIN.width), availW);
    let height = Math.min(Math.max(width / ratio, PC_SCREEN_MIN.height), availH);
    width = even(width);
    height = even(height);

    // The bezel's 2px outline and the screen's 2px rim on each side (css/pc-monitor.css)
    const outerW = width + 2 * bezel.side + 4 * PC_FRAME_EDGE;
    const outerH = height + bezel.top + bezel.chin + 4 * PC_FRAME_EDGE;
    const left = Math.max(0, Math.floor((vw - outerW) / 2));
    const top = Math.max(0, Math.floor((vh - outerH - bezel.hang) / 2));
    const inset = compact ? PC_POSTIT_INSET.compact : PC_POSTIT_INSET.full;
    // The screen's bottom edge on the frame: the bezel's 2px outline, the strip, the rim,
    // the screen and the rim again
    const screenBottom = 3 * PC_FRAME_EDGE + bezel.top + height;
    // As wide as the chin allows left of Add Postit to notepad (with the light and the
    // padding), so the note takes fewer lines and the chin stays low
    // `chinRoom` is the room the chin's right part really takes (measured in the page); with
    // none, the stored estimate for the frame's size stands in (tests, the first pass)
    const reserve = chinRoom > 0 ? chinRoom : (narrow ? PC_CHIN_BUTTON_ROOM.narrow : compact ? PC_CHIN_BUTTON_ROOM.compact : PC_CHIN_BUTTON_ROOM.full);
    const postit = {
        left: bezel.side + inset,
        top: screenBottom + PC_POSTIT_GAP,
        maxWidth: Math.max(PC_POSTIT_MIN_WIDTH, Math.min(340, outerW - (bezel.side + inset) - reserve))
    };
    const uiScale = Math.max(1, Math.floor(Math.min(width / PC_UI_BASE.width, height / PC_UI_BASE.height)));
    return { compact, narrow, short, uiScale, bezel, screen: { width, height }, width: outerW, height: outerH, left, top, postit };
}

/**
 * The window space a minigame container offers: its own box, else the viewport. The
 * container in the PC view is `100dvh` tall (css/pc-monitor.css, R2 M3), so a phone's
 * address bar is left out by the browser. The visual viewport is not read: a pinch zoom
 * shrinks it (the frame would never grow, which is why a player pinches), and the
 * on-screen keyboard pans it, while the field is kept in view by scrollIntoView. So the
 * frame keeps one size from "before typing" to "typing".
 */
export function pcViewSpace(container, view = (typeof window !== 'undefined' ? window : null)) {
    const r = container?.getBoundingClientRect?.();
    if (r && r.width > 0 && r.height > 0) return { width: r.width, height: r.height };
    return { width: view?.innerWidth || 0, height: view?.innerHeight || 0 };
}

/**
 * The CSS zoom a box is drawn at (R2 m2): `currentCSSZoom` where the browser has it, else,
 * inside the PC monitor's zoomed screen area, the area's drawn width over its layout width
 * (the area's width is a whole number, so the ratio is the zoom). 1 anywhere else.
 */
export function cssZoomOf(el) {
    const z = Number(el?.currentCSSZoom);
    if (z > 0) return z;
    const area = el?.closest?.('.pc-monitor-area');
    const layout = Number(area?.offsetWidth) || 0;
    const drawn = Number(area?.getBoundingClientRect?.()?.width) || 0;
    if (layout > 0 && drawn > 0) {
        const ratio = Math.round((drawn / layout) * 100) / 100;
        if (ratio > 0) return ratio;
    }
    return 1;
}

// The post-it height measured per PC (R1 M1), at the window size it was measured at:
// pcId -> { sizeKey, height }. One entry per PC (R2 m1): only the current size matters for
// the frame staying put between that PC's views, so a resize replaces it.
const postitHeights = new Map();

/** The note height kept for a PC at a window size, or 0. */
export function keptPostitHeight(pcId, sizeKey) {
    const kept = pcId ? postitHeights.get(pcId) : null;
    return (kept && kept.sizeKey === sizeKey) ? kept.height : 0;
}

/** Keep a PC's note height at a window size: the new measurement replaces the old one. */
export function keepPostitHeight(pcId, sizeKey, height) {
    if (!pcId || !(height > 0)) return 0;
    const kept = Math.ceil(height);
    postitHeights.set(pcId, { sizeKey, height: kept });
    return kept;
}

/** How many PCs have a kept note height (tests). */
export function keptPostitCount() {
    return postitHeights.size;
}

/** Forget the kept note heights (tests). */
export function resetPostitHeights() {
    postitHeights.clear();
}

const flag = (el, name, on) => {
    if (!el?.dataset) return;
    if (on) el.dataset[name] = ''; else delete el.dataset[name];
};

/** Write the metrics onto the frame's elements (inline sizes and places, whole pixels). */
export function applyPcMonitorMetrics(parts, m) {
    if (!parts?.root?.style || !m) return;
    const { root, screen, postit } = parts;
    root.style.left = `${m.left}px`;
    root.style.top = `${m.top}px`;
    root.style.width = `${m.width}px`;
    root.style.height = `${m.height}px`;
    root.style.setProperty?.('--pc-bezel-side', `${m.bezel.side}px`);
    root.style.setProperty?.('--pc-bezel-top', `${m.bezel.top}px`);
    root.style.setProperty?.('--pc-bezel-chin', `${m.bezel.chin}px`);
    root.style.setProperty?.('--pc-ui-scale', String(m.uiScale || 1));
    flag(root, 'compact', m.compact);
    flag(root, 'narrow', m.narrow);
    flag(root, 'short', m.short);
    if (root.dataset) root.dataset.uiScale = String(m.uiScale || 1);
    if (screen?.style) {
        screen.style.left = `${m.bezel.side}px`;
        screen.style.top = `${m.bezel.top}px`;
        screen.style.width = `${m.screen.width}px`;
        screen.style.height = `${m.screen.height}px`;
    }
    // A note the player has dragged keeps its place; the rest follow the frame
    if (postit?.style && postit.dataset?.dragged !== 'true') {
        postit.style.left = `${m.postit.left}px`;
        postit.style.top = `${m.postit.top}px`;
        postit.style.maxWidth = `${m.postit.maxWidth}px`;
    }
}

/**
 * Mark the note as dragged only once it has moved (R1 m6): a press that does not move it
 * (a tap, a click on the red corner) leaves it following the frame. helpers.js
 * makeDraggable writes left/top on the press; this compares them on the release.
 */
function watchPostitDrag(postit, place) {
    const doc = postit.ownerDocument || (typeof document !== 'undefined' ? document : null);
    if (!doc) return () => {};
    let start = null;
    const release = () => {
        doc.removeEventListener('mouseup', release);
        doc.removeEventListener('touchend', release);
        if (!start) return;
        const moved = postit.style.left !== start.left || postit.style.top !== start.top;
        start = null;
        if (moved) postit.dataset.dragged = 'true';
        else place();
    };
    const press = () => {
        // Compare with the place the frame gave the note: makeDraggable's press pins the
        // note where it is drawn, which is that place until it moves
        start = { left: postit.dataset.placedLeft || postit.style.left, top: postit.dataset.placedTop || postit.style.top };
        doc.addEventListener('mouseup', release);
        doc.addEventListener('touchend', release);
    };
    postit.addEventListener('mousedown', press);
    postit.addEventListener('touchstart', press, { passive: true });
    return () => {
        postit.removeEventListener('mousedown', press);
        postit.removeEventListener('touchstart', press);
        doc.removeEventListener('mouseup', release);
        doc.removeEventListener('touchend', release);
    };
}

/**
 * Put a minigame's game area into the PC monitor frame. `scene` is a MinigameScene after
 * super.init() (it has container and gameContainer). The game area becomes the screen's
 * scroll area, the X moves into the bezel's top strip, and `postitHtml` (already escaped)
 * becomes a note stuck on the chin. `pcId` keys the note height kept for the PC. Returns
 * { root, bezel, screen, chin, controls, postit, metrics, update(), destroy() };
 * `controls` is the host for the scene's footer row.
 */
export function mountPcMonitor(scene, { name = '', postitHtml = '', pcId = null, view = (typeof window !== 'undefined' ? window : null) } = {}) {
    const container = scene?.container;
    const area = scene?.gameContainer;
    if (!container || !area?.parentNode || typeof document === 'undefined') return null;

    const root = document.createElement('div');
    root.className = 'pc-monitor';
    root.innerHTML = `
        <div class="pc-monitor-bezel">
            <span class="pc-monitor-cam" aria-hidden="true"></span>
            <span class="pc-monitor-name"></span>
            <div class="pc-monitor-screen"></div>
            <div class="pc-monitor-chin">
                <span class="pc-monitor-led" aria-hidden="true"></span>
                <div class="pc-monitor-controls"></div>
            </div>
        </div>`;
    const bezel = root.querySelector('.pc-monitor-bezel');
    const screen = root.querySelector('.pc-monitor-screen');
    const chin = root.querySelector('.pc-monitor-chin');
    const controls = root.querySelector('.pc-monitor-controls');
    const nameEl = root.querySelector('.pc-monitor-name');
    if (nameEl) nameEl.textContent = String(name || '');

    area.parentNode.insertBefore(root, area);
    screen.appendChild(area);
    area.classList?.add?.('pc-monitor-area', 'pixel-scroll');

    const cross = container.querySelector?.('#minigame-close');
    if (cross) {
        cross.style.top = '';
        cross.style.right = '';
        cross.classList?.remove?.('minigame-close-in-frame');
        cross.classList?.add?.('pc-monitor-close');
        bezel.appendChild(cross);
    }
    container.classList?.add?.('pc-view');

    const parts = { root, bezel, screen, chin, controls, postit: null, metrics: null };
    const apply = (m) => {
        parts.metrics = m;
        applyPcMonitorMetrics(parts, m);
        if (parts.postit?.dataset) {
            parts.postit.dataset.placedLeft = `${m.postit.left}px`;
            parts.postit.dataset.placedTop = `${m.postit.top}px`;
        }
        return m;
    };
    // The chin holds the note's measured height; a view of the PC with no note (or before
    // it is measured) uses the height kept for that PC at this window size
    // The room the chin's right part takes, measured: the buttons, the power light (when
    // shown), the chin's right padding and a gap to the note. 0 where nothing is laid out.
    const measureChinRoom = () => {
        const w = Math.ceil(parts.controls?.offsetWidth || 0);
        if (!(w > 0)) return 0;
        const led = chin.querySelector('.pc-monitor-led');
        const ledW = led?.offsetWidth > 0 ? led.offsetWidth + 8 : 0;
        const side = parts.metrics?.bezel?.side ?? 0;
        return w + ledW + side + 8;
    };
    // The last measured room, carried into the next update()'s first pass so the note is laid
    // out at its real width from the start (0 until something is laid out: the fallback stands in)
    let lastRoom = 0;
    const update = () => {
        const space = pcViewSpace(container, view);
        const sizeKey = `${Math.floor(space.width)}x${Math.floor(space.height)}`;
        let noteH = keptPostitHeight(pcId, sizeKey);
        let chinRoom = lastRoom;
        let m = apply(pcMonitorMetrics(space.width, space.height, { postitHeight: noteH, chinRoom }));
        if (parts.postit) {
            // The note's width follows the frame, and the frame its height: settle in a few
            // steps. The note's own measurement wins over the kept one (R2 m1: a height taken
            // before the pixel font arrived may be a line too tall); at one room the larger
            // measurement stays, so the loop cannot swing between two heights. A new room
            // changes the note's width, so a height taken at the old room is dropped.
            let measured = 0;
            let measuredRoom = chinRoom;
            for (let i = 0; i < 4; i++) {
                const h = Math.ceil(parts.postit.offsetHeight || 0);
                if (!(h > 0)) break;
                const room = measureChinRoom() || chinRoom;
                measured = measuredRoom === chinRoom ? Math.max(measured, h) : h;
                measuredRoom = chinRoom;
                if (measured === noteH && room === chinRoom) break;
                noteH = measured;
                chinRoom = room;
                lastRoom = room;
                m = apply(pcMonitorMetrics(space.width, space.height, { postitHeight: noteH, chinRoom }));
            }
            keepPostitHeight(pcId, sizeKey, noteH);
        }
        return m;
    };

    let unwatch = () => {};
    if (postitHtml) {
        const postit = document.createElement('div');
        postit.className = 'postit-note pc-monitor-postit';
        postit.innerHTML = postitHtml;
        root.appendChild(postit);
        parts.postit = postit;
        unwatch = watchPostitDrag(postit, () => applyPcMonitorMetrics(parts, parts.metrics));
    }

    update();
    // Through the scene, so its cleanup() removes them even when the manager ends the
    // minigame without complete() (R1 m4)
    const listen = (target, type) => {
        if (!target?.addEventListener) return;
        if (typeof scene.addEventListener === 'function') scene.addEventListener(target, type, update);
        else target.addEventListener(type, update);
    };
    listen(view, 'resize');
    // The button is added after the frame is mounted (and the container's views swap it):
    // a change in the chin's size re-fits the note
    let chinWatch = null;
    if (parts.postit && typeof ResizeObserver === 'function' && controls) {
        chinWatch = new ResizeObserver(() => { if (root.isConnected) update(); });
        chinWatch.observe(controls);
    }
    // A pixel font that arrives late changes the note's height
    document.fonts?.ready?.then?.(() => { if (root.isConnected) update(); });
    parts.update = update;
    parts.destroy = () => {
        view?.removeEventListener?.('resize', update);
        unwatch();
        chinWatch?.disconnect?.();
        container.classList?.remove?.('pc-view');
    };
    return parts;
}
