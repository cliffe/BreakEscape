/**
 * The one PC monitor frame (UX slice 2c): every view of a PC (the sign-in screen, a
 * computer's password screen, the desktop, a share's folder window, a remote sign-in) sits
 * in this frame, with one bezel look (css/pc-monitor.css) and one sizing rule
 * (pcMonitorMetrics). The size depends only on the space the minigame window has, so moving
 * from a PC's sign-in screen to its desktop neither resizes nor moves the monitor.
 *
 * The monitor is the whole window: the X sits in the bezel's top strip, the footer buttons
 * (Add to Notepad) in its chin, and the PC's post-it is stuck on the chin just under the
 * screen, placed from the frame's own metrics, never from the viewport.
 *
 * Pure apart from mountPcMonitor, which builds the DOM.
 */

/** A landscape monitor's screen: 16:10. */
export const PC_SCREEN_ASPECT = 16 / 10;

/** The tallest a portrait monitor gets (a phone held upright): 3:4. */
export const PC_PORTRAIT_ASPECT = 3 / 4;

/** The screen stops growing here, so a large window does not get a wall-sized monitor. */
export const PC_SCREEN_MAX = Object.freeze({ width: 1120, height: 700 });

/** The smallest screen worth drawing, when the window has the room for it. */
export const PC_SCREEN_MIN = Object.freeze({ width: 280, height: 200 });

/** Below this width or height the frame uses its compact bezel. */
export const PC_COMPACT_BELOW = 560;

/**
 * Bezel strips in CSS pixels. `top` holds the X (30px) with a whole-pixel gap, `chin` the
 * PC name and the footer buttons. `gutter` is the gap to the window edge, `hang` the room
 * kept under the monitor for the post-it hanging off the chin.
 */
export const PC_BEZEL = Object.freeze({
    full: Object.freeze({ side: 20, top: 38, chin: 44, gutter: 16, hang: 24 }),
    compact: Object.freeze({ side: 12, top: 34, chin: 36, gutter: 8, hang: 16 })
});

/** The post-it's inset from the monitor's left edge, past the side bezel, and its gap under the screen. */
export const PC_POSTIT_INSET = Object.freeze({ full: 24, compact: 12 });
export const PC_POSTIT_GAP = 4;

/** The bezel's outline and the screen's rim, both 2px (css/pc-monitor.css). */
export const PC_FRAME_EDGE = 2;

const even = (v) => Math.max(0, Math.floor(v / 2) * 2);

/**
 * The monitor's geometry for a window of viewW x viewH CSS pixels: the screen, the whole
 * monitor, its place in the window (whole pixels), and the post-it's place on the frame.
 *   -> { compact, bezel, screen: { width, height }, width, height, left, top,
 *        postit: { left, top, maxWidth } }
 * `postit` is relative to the monitor's own top-left corner.
 */
export function pcMonitorMetrics(viewW, viewH) {
    const vw = Math.max(0, Math.floor(Number(viewW) || 0));
    const vh = Math.max(0, Math.floor(Number(viewH) || 0));
    const compact = vw < PC_COMPACT_BELOW || vh < PC_COMPACT_BELOW;
    const bezel = compact ? PC_BEZEL.compact : PC_BEZEL.full;
    const edges = 4 * PC_FRAME_EDGE;
    const availW = Math.max(0, vw - 2 * bezel.gutter - 2 * bezel.side - edges);
    const availH = Math.max(0, vh - 2 * bezel.gutter - bezel.top - bezel.chin - bezel.hang - edges);

    // Landscape space: a 16:10 screen. Portrait space (a phone held upright): a portrait
    // monitor that follows the space, no taller than 3:4.
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
    const postit = {
        left: bezel.side + inset,
        top: screenBottom + PC_POSTIT_GAP,
        maxWidth: Math.max(120, Math.min(340, Math.floor(outerW * 0.45)))
    };
    return { compact, bezel, screen: { width, height }, width: outerW, height: outerH, left, top, postit };
}

/** The window space a minigame container offers: its own box, else the viewport. */
export function pcViewSpace(container, view = (typeof window !== 'undefined' ? window : null)) {
    const r = container?.getBoundingClientRect?.();
    if (r && r.width > 0 && r.height > 0) return { width: r.width, height: r.height };
    return { width: view?.innerWidth || 0, height: view?.innerHeight || 0 };
}

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
    if (m.compact) root.dataset.compact = ''; else delete root.dataset.compact;
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
 * Put a minigame's game area into the PC monitor frame. `scene` is a MinigameScene after
 * super.init() (it has container and gameContainer). The game area becomes the screen's
 * scroll area, the X moves into the bezel's top strip, and `postitHtml` (already escaped)
 * becomes a note stuck on the chin. Returns { root, bezel, screen, chin, controls, postit,
 * metrics, update(), destroy() }; `controls` is the host for the scene's footer row.
 */
export function mountPcMonitor(scene, { name = '', postitHtml = '', view = (typeof window !== 'undefined' ? window : null) } = {}) {
    const container = scene?.container;
    const area = scene?.gameContainer;
    if (!container || !area?.parentNode || typeof document === 'undefined') return null;

    const root = document.createElement('div');
    root.className = 'pc-monitor';
    root.innerHTML = `
        <div class="pc-monitor-bezel">
            <span class="pc-monitor-cam" aria-hidden="true"></span>
            <div class="pc-monitor-screen"></div>
            <div class="pc-monitor-chin">
                <span class="pc-monitor-name"></span>
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

    let postit = null;
    if (postitHtml) {
        postit = document.createElement('div');
        postit.className = 'postit-note pc-monitor-postit';
        postit.innerHTML = postitHtml;
        // A drag (helpers.js makeDraggable) marks the note, so a resize leaves it where it was put
        const dragged = () => { postit.dataset.dragged = 'true'; };
        postit.addEventListener?.('mousedown', dragged);
        postit.addEventListener?.('touchstart', dragged, { passive: true });
        root.appendChild(postit);
    }

    const parts = { root, bezel, screen, chin, controls, postit, metrics: null };
    const update = () => {
        const space = pcViewSpace(container, view);
        parts.metrics = pcMonitorMetrics(space.width, space.height);
        applyPcMonitorMetrics(parts, parts.metrics);
        return parts.metrics;
    };
    update();
    view?.addEventListener?.('resize', update);
    parts.update = update;
    parts.destroy = () => {
        view?.removeEventListener?.('resize', update);
        container.classList?.remove?.('pc-view');
    };
    return parts;
}
