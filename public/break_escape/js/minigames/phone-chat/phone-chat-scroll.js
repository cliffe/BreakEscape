/**
 * Keep the phone thread scrolled to its last bubble (engine round 7, m06 M2).
 *
 * scrollToBottom() used to aim a smooth scroll at the thread's scrollHeight once. The
 * choices panel then filled in under the thread and took its height, so the scroll
 * ended short and the last bubble sat partly behind the choices. A window resize, or
 * the choices list changing height, left it short again.
 *
 * While the thread is "pinned" (the player hasn't scrolled up), any change in the
 * size of the thread, the choices panel or a bubble puts it back at the bottom. The
 * player scrolling up unpins it; scrolling back to the bottom pins it again. No
 * imports, so tests can load it on its own.
 */

/** Slack for sub-pixel rounding when deciding the thread is at the bottom. */
const AT_BOTTOM_SLACK = 4;
/** How long a smooth scroll's own scroll events are not read as the player's. */
const SMOOTH_SCROLL_MS = 800;

/** True when `el` is scrolled to (or within a few px of) its end. */
export function isAtBottom(el) {
    if (!el) return true;
    return el.scrollTop + el.clientHeight >= el.scrollHeight - AT_BOTTOM_SLACK;
}

/**
 * @param {HTMLElement} container - the scrolling thread (messages container)
 * @param {Object} [opts]
 * @param {Array<HTMLElement>} [opts.watch] - other elements whose size moves the thread
 *   (the choices panel, the typing indicator)
 * @param {Function} [opts.now] - clock, for tests
 * @param {Function} [opts.ResizeObserver] - for tests; defaults to the browser's
 * @param {Function} [opts.MutationObserver] - for tests; defaults to the browser's
 * @returns {{ pin: Function, isPinned: Function, destroy: Function }}
 */
export function createBottomPin(container, opts = {}) {
    const now = opts.now || (() => Date.now());
    const RO = opts.ResizeObserver || globalThis.ResizeObserver;
    const MO = opts.MutationObserver || globalThis.MutationObserver;
    let pinned = true;
    let ignoreScrollUntil = 0;

    const toBottom = () => {
        if (pinned && container) container.scrollTop = container.scrollHeight;
    };

    const onScroll = () => {
        if (isAtBottom(container)) { pinned = true; return; }
        if (now() >= ignoreScrollUntil) pinned = false;
    };
    // The wheel or a touch is always the player, even mid smooth scroll
    const onUserScroll = () => { ignoreScrollUntil = 0; };

    container?.addEventListener?.('scroll', onScroll, { passive: true });
    container?.addEventListener?.('wheel', onUserScroll, { passive: true });
    container?.addEventListener?.('touchstart', onUserScroll, { passive: true });

    const resizeObserver = RO ? new RO(toBottom) : null;
    if (resizeObserver && container) {
        resizeObserver.observe(container);
        for (const el of opts.watch || []) if (el) resizeObserver.observe(el);
        for (const child of container.children || []) resizeObserver.observe(child);
    }
    // Bubbles added later are watched too: a font or portrait loading can grow one
    const mutationObserver = (MO && resizeObserver && container) ? new MO(records => {
        for (const r of records) for (const n of r.addedNodes || []) {
            if (n && n.nodeType === 1) resizeObserver.observe(n);
        }
    }) : null;
    mutationObserver?.observe(container, { childList: true });

    return {
        /** Scroll to the last bubble and keep it there until the player scrolls up. */
        pin(smooth = true) {
            pinned = true;
            if (!container) return;
            if (smooth && typeof container.scrollTo === 'function') {
                ignoreScrollUntil = now() + SMOOTH_SCROLL_MS;
                container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
            } else {
                ignoreScrollUntil = 0;
                container.scrollTop = container.scrollHeight;
            }
        },
        isPinned: () => pinned,
        /** Called by the size observers; exposed for tests. */
        _onResize: toBottom,
        _onScroll: onScroll,
        destroy() {
            resizeObserver?.disconnect();
            mutationObserver?.disconnect();
            container?.removeEventListener?.('scroll', onScroll);
            container?.removeEventListener?.('wheel', onUserScroll);
            container?.removeEventListener?.('touchstart', onUserScroll);
        }
    };
}
