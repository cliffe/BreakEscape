// A pixel "SCROLL >" cue for wide tables that scroll sideways on phones (sweep 3, K10 B).
// The cue is an in-flow line of its own, placed directly before the scroller in the same parent
// and aligned right, so it never covers table content. While more columns lie to the right it is
// visible; at the scroll end it is visibility:hidden (it keeps its height, so nothing jumps); when
// the table does not overflow, or the viewport is not touch-size (the framework's phone rule, so a
// landscape phone counts), it is display:none and takes no space. Text is set with textContent.

export const SCROLL_CUE_PHONE_QUERY = '(max-width: 600px), (max-height: 500px)';
const END_SLACK_PX = 2;

// Pure show/hide rule: phone viewport and at least END_SLACK_PX of content still to the right.
export function shouldShowScrollCue({ isPhone, scrollLeft, clientWidth, scrollWidth }) {
    if (!isPhone) return false;
    return (scrollWidth - clientWidth - scrollLeft) > END_SLACK_PX;
}

const CUE_STYLE = {
    display: 'none',
    flex: '0 0 auto',
    width: 'fit-content',
    marginLeft: 'auto',
    marginBottom: '4px',
    pointerEvents: 'none',
    fontFamily: "'VT323', monospace",
    fontSize: '16px',
    lineHeight: '16px',
    padding: '2px 6px',
    border: '2px solid #ffffff',
    background: '#000000',
    color: '#ffffff',
    boxSizing: 'border-box',
    whiteSpace: 'nowrap'
};

// Attach a cue for `scroller` (an overflow-x:auto element). Returns { update, destroy, cue }.
// opts.group: an array shared by side-by-side scrollers. When any member overflows every member's
// cue takes its line (the others visibility:hidden), so paired panels keep their headers level.
// opts.insetToPadding: right margin = the scroller's own padding-right, so a cue that sits outside
// a padded scroller lines up with the content inside it.
export function attachScrollCue(scroller, opts = {}) {
    const doc = opts.document || scroller.ownerDocument || document;
    const win = opts.window || doc.defaultView || globalThis;
    const host = scroller.parentElement;
    if (!host) return { update() {}, destroy() {}, cue: null };

    const cue = doc.createElement('div');
    cue.className = 'scroll-cue';
    cue.setAttribute('aria-hidden', 'true');
    cue.textContent = 'SCROLL >';
    Object.assign(cue.style, CUE_STYLE);
    host.insertBefore(cue, scroller);

    const isPhone = () => !!(win.matchMedia && win.matchMedia(SCROLL_CUE_PHONE_QUERY).matches);

    const overflowsNow = (el) => (el.scrollWidth - el.clientWidth) > END_SLACK_PX;
    const group = Array.isArray(opts.group) ? opts.group : null;
    if (group) group.push(scroller);

    function update() {
        const phone = isPhone();
        const overflows = group ? group.some(overflowsNow) : overflowsNow(scroller);
        if (opts.insetToPadding && typeof win.getComputedStyle === 'function') {
            const pr = parseFloat(win.getComputedStyle(scroller).paddingRight);
            cue.style.marginRight = (pr > 0 ? pr : 0) + 'px';
        }
        const more = shouldShowScrollCue({
            isPhone: phone,
            scrollLeft: scroller.scrollLeft,
            clientWidth: scroller.clientWidth,
            scrollWidth: scroller.scrollWidth
        });
        // No overflow (or not a phone): no space. Overflow: always takes its line, hidden at the end.
        cue.style.display = (phone && overflows) ? 'block' : 'none';
        cue.style.visibility = more ? 'visible' : 'hidden';
    }

    // Scroll events can fire many times a frame: do the measuring once per animation frame.
    let pendingFrame = 0;
    const cancelFrame = (id) => { if (win.cancelAnimationFrame) win.cancelAnimationFrame(id); };
    function onScroll() {
        if (pendingFrame) return;
        if (typeof win.requestAnimationFrame !== 'function') { update(); return; }
        pendingFrame = win.requestAnimationFrame(() => { pendingFrame = 0; update(); });
    }

    scroller.addEventListener('scroll', onScroll);
    win.addEventListener('resize', update);
    let observer = null;
    if (typeof win.ResizeObserver === 'function') {
        observer = new win.ResizeObserver(update);
        observer.observe(scroller);
    }
    let mutations = null;
    if (typeof win.MutationObserver === 'function') {
        mutations = new win.MutationObserver(update);
        mutations.observe(scroller, { childList: true, subtree: true });
    }
    update();

    return {
        cue,
        update,
        destroy() {
            scroller.removeEventListener('scroll', onScroll);
            win.removeEventListener('resize', update);
            if (pendingFrame) { cancelFrame(pendingFrame); pendingFrame = 0; }
            if (observer) observer.disconnect();
            if (mutations) mutations.disconnect();
            if (group) { const i = group.indexOf(scroller); if (i >= 0) group.splice(i, 1); }
            cue.remove();
        }
    };
}
