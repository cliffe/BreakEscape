// A pixel "SCROLL >" cue for wide tables that scroll sideways on phones (sweep 3, K10 B).
// Shown at the right edge of the scroller while more columns lie to the right, hidden at the
// scroll end and whenever the viewport is not touch-size (the framework's phone rule, so a
// landscape phone counts). Text is set with textContent.
//
// opts.viewport: an outer element that scrolls vertically around the scroller; the cue then
// stays inside the visible part of the scroller instead of scrolling away with the outer pane.

export const SCROLL_CUE_PHONE_QUERY = '(max-width: 600px), (max-height: 500px)';
const END_SLACK_PX = 2;

// Pure show/hide rule: phone viewport and at least END_SLACK_PX of content still to the right.
export function shouldShowScrollCue({ isPhone, scrollLeft, clientWidth, scrollWidth, inView = true }) {
    if (!isPhone || !inView) return false;
    return (scrollWidth - clientWidth - scrollLeft) > END_SLACK_PX;
}

const CUE_STYLE = {
    position: 'absolute',
    zIndex: '5',
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
export function attachScrollCue(scroller, opts = {}) {
    const doc = opts.document || scroller.ownerDocument || document;
    const win = opts.window || doc.defaultView || globalThis;
    const host = scroller.parentElement;
    if (!host) return { update() {}, destroy() {}, cue: null };

    const cue = doc.createElement('div');
    cue.className = 'scroll-cue';
    cue.setAttribute('aria-hidden', 'true');
    cue.textContent = 'SCROLL >';
    Object.assign(cue.style, CUE_STYLE, { display: 'none' });
    host.appendChild(cue);

    const isPhone = () => !!(win.matchMedia && win.matchMedia(SCROLL_CUE_PHONE_QUERY).matches);

    const viewport = opts.viewport || null;
    const CUE_HEIGHT_PX = 24;

    function update() {
        // With an outer vertical scroller, pin the cue to the visible top of the scroller.
        let top = scroller.offsetTop + 4;
        let inView = true;
        if (viewport && scroller.getBoundingClientRect && viewport.getBoundingClientRect && host.getBoundingClientRect) {
            const hr = host.getBoundingClientRect();
            const vr = viewport.getBoundingClientRect();
            const sr = scroller.getBoundingClientRect();
            const visTop = Math.max(sr.top, vr.top);
            const visBottom = Math.min(sr.bottom, vr.bottom);
            inView = (visBottom - visTop) >= CUE_HEIGHT_PX + 8;
            top = visTop - hr.top + 4;
        }
        const show = shouldShowScrollCue({
            isPhone: isPhone(),
            scrollLeft: scroller.scrollLeft,
            clientWidth: scroller.clientWidth,
            scrollWidth: scroller.scrollWidth,
            inView
        });
        if (show) {
            if (win.getComputedStyle && win.getComputedStyle(host).position === 'static') {
                host.style.position = 'relative';
            }
            const bar = scroller.offsetWidth - scroller.clientWidth;
            cue.style.top = top + 'px';
            cue.style.right = Math.max(0, host.clientWidth - scroller.offsetLeft - scroller.offsetWidth + bar + 4) + 'px';
        }
        cue.style.display = show ? 'block' : 'none';
    }

    scroller.addEventListener('scroll', update);
    win.addEventListener('resize', update);
    if (viewport) viewport.addEventListener('scroll', update);
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
            scroller.removeEventListener('scroll', update);
            win.removeEventListener('resize', update);
            if (viewport) viewport.removeEventListener('scroll', update);
            if (observer) observer.disconnect();
            if (mutations) mutations.disconnect();
            cue.remove();
        }
    };
}
