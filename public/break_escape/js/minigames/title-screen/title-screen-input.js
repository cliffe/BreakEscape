/**
 * Continue controls for the title screen: a click anywhere on it, Space or Enter.
 * The prompt used to listen for clicks only, so after a reload or Restart players
 * pressing Space or Enter thought the game had hung (m02 playtests B1/M11/CF-J).
 *
 * Kept free of imports so it can be tested in isolation.
 */

/** True for the keys that continue: Space and Enter (including numpad Enter). */
export function isContinueKey(event) {
    if (!event) return false;
    if (event.repeat) return false;
    const key = event.key;
    const code = event.code;
    return key === 'Enter' || key === ' ' || key === 'Spacebar' ||
        code === 'Space' || code === 'Enter' || code === 'NumpadEnter';
}

/**
 * Listen for a click on `container` and Space/Enter on `doc`; call onContinue once.
 * @returns {Function} detach, which removes both listeners
 */
export function attachContinueHandlers(container, doc, onContinue) {
    let done = false;
    const fire = (event) => {
        if (done) return;
        done = true;
        detach();
        onContinue(event);
    };
    const onClick = (event) => fire(event);
    const onKey = (event) => {
        if (!isContinueKey(event)) return;
        if (typeof event.preventDefault === 'function') event.preventDefault();
        fire(event);
    };
    const detach = () => {
        container?.removeEventListener?.('click', onClick);
        doc?.removeEventListener?.('keydown', onKey);
    };
    container?.addEventListener?.('click', onClick);
    doc?.addEventListener?.('keydown', onKey);
    return detach;
}

/** How long the desktop app holds the finished mission name on screen so it can be read. */
export const DESKTOP_HOLD_MS = 1200;

/**
 * Desktop app: no "Continue?" wait. Call onProceed once, after holdMs or as soon as the player
 * clicks / presses Space or Enter, whichever comes first.
 * @returns {Function} cancel, which clears the timer and removes the listeners
 */
export function startDesktopHold(container, doc, holdMs, onProceed, timers = globalThis) {
    let done = false;
    let timer = null;
    let detach = () => {};
    const cancel = () => {
        done = true;
        if (timer !== null) { timers.clearTimeout(timer); timer = null; }
        detach();
    };
    const proceed = () => {
        if (done) return;
        cancel();
        onProceed();
    };
    detach = attachContinueHandlers(container, doc, proceed);
    timer = timers.setTimeout(proceed, holdMs);
    return cancel;
}

/**
 * The name the title screen types. A scenario may set a top-level `titleScreenName` (the server
 * passes it as breakEscapeConfig.missionTitleName); without it the mission's display_name is used,
 * so every existing mission is unchanged. Awareness episodes use it to show the episode's own name
 * while listings keep the longer display_name.
 */
export function titleScreenName(config) {
    const own = typeof config?.missionTitleName === 'string' ? config.missionTitleName.trim() : '';
    if (own) return own;
    return config?.missionDisplayName ?? '';
}

/**
 * The painted backdrop for the title screen, or '' for none (every mission without mission.json
 * "title_art"). The server passes the URL as breakEscapeConfig.missionTitleArt. Only a same-site
 * image path is accepted, since the value is used inside a CSS url().
 */
export function titleScreenArt(config) {
    const url = typeof config?.missionTitleArt === 'string' ? config.missionTitleArt.trim() : '';
    return /^\/(?!\/)[A-Za-z0-9_\-\/.]+\.(?:jpe?g|png|webp)$/.test(url) && !url.includes('..') ? url : '';
}

/**
 * Which loading screen this mission gets: 'ca' for the Cyber Aware bands-and-seam-bar screen
 * (mission.json "title_style": "ca", passed as breakEscapeConfig.missionTitleStyle), else
 * 'default' (the SAFETYNET logo-and-typed-name screen). Anything but the exact string 'ca'
 * gives 'default', so every other mission is unchanged.
 */
export function titleScreenStyle(config) {
    return config?.missionTitleStyle === 'ca' ? 'ca' : 'default';
}

/** The company line of the CA screen: plain text, control characters dropped, at most 80 characters. */
export function titleScreenCompany(config) {
    const raw = typeof config?.missionCompany === 'string' ? config.missionCompany : '';
    return raw.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 80);
}

/** The company accent: a #rrggbb colour, or '' (the value is written into a style property). */
export function titleScreenAccent(config) {
    const raw = typeof config?.missionAccent === 'string' ? config.missionAccent.trim() : '';
    return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw : '';
}

/** Segments each side of the CA seam bar. */
export const CA_BAR_SEGMENTS = 14;
/** The bar creeps up to this many segments a side while the world builds, then fills on game_loaded. */
export const CA_BAR_WAIT_MAX = 12;
export const CA_BAR_STEP_MS = 450;

/** How many segments each side of the CA seam bar are lit after elapsedMs; all of them once loaded. */
export function caBarSegments(elapsedMs, loaded) {
    if (loaded) return CA_BAR_SEGMENTS;
    const n = Math.floor(Math.max(0, elapsedMs) / CA_BAR_STEP_MS);
    return Math.min(CA_BAR_WAIT_MAX, n);
}

/**
 * Build the CA loading screen DOM into `container` (a .title-screen-container). Every
 * mission string goes in through textContent; the art url is already vetted by titleScreenArt.
 * @returns {{root, bar, status, hint}} elements the minigame updates
 */
export function buildCaTitleDom(doc, container, config, artUrl) {
    const el = (tag, cls, text) => {
        const e = doc.createElement(tag);
        if (cls) e.className = cls;
        if (text !== undefined) e.textContent = text;
        return e;
    };
    const root = el('div', 'ca-ts');
    if (artUrl) {
        const art = el('div', 'ca-ts-art');
        art.style.backgroundImage = `url('${artUrl}')`;
        root.appendChild(art);
    }
    root.appendChild(el('div', 'ca-ts-scrim'));
    for (const side of ['a', 'd']) {
        for (const edge of ['top', 'bottom']) root.appendChild(el('div', `ca-ts-band ca-ts-band-${side} ca-ts-edge-${edge}`));
        root.appendChild(el('div', `ca-ts-band ca-ts-band-${side} ca-ts-edge-side-${side}`));
    }
    for (const edge of ['top', 'bottom']) root.appendChild(el('div', `ca-ts-seam ca-ts-seam-${edge}`));
    root.appendChild(el('div', 'ca-ts-tab ca-ts-tab-a', 'ATTACKER'));
    root.appendChild(el('div', 'ca-ts-tab ca-ts-tab-d', 'DEFENDER'));

    const text = el('div', 'ca-ts-text');
    const mark = el('span', 'ca-ts-mark');
    mark.appendChild(el('i'));
    mark.appendChild(el('span', 'ca-ts-mark-text', 'CYBER AWARE'));
    text.appendChild(mark);
    text.appendChild(el('div', 'ca-ts-title', titleScreenName(config)));
    const company = titleScreenCompany(config);
    if (company) {
        const c = el('div', 'ca-ts-company', company);
        const accent = titleScreenAccent(config);
        if (accent) c.style.setProperty('--ca-accent', accent);
        text.appendChild(c);
    }
    const tag = el('div', 'ca-ts-tag');
    tag.appendChild(el('span', 'ca-ts-tag-a', 'Play the attack'));
    tag.appendChild(el('span', 'ca-ts-tag-dot', ' \u00b7 '));
    tag.appendChild(el('span', 'ca-ts-tag-b', 'Learn to stop it'));
    text.appendChild(tag);
    root.appendChild(text);

    const bar = el('div', 'ca-ts-bar');
    for (const side of ['l', 'r']) {
        const half = el('div', `ca-ts-sbar ca-ts-sbar-${side}`);
        for (let i = 0; i < CA_BAR_SEGMENTS; i++) half.appendChild(el('s'));
        bar.appendChild(half);
    }
    bar.appendChild(el('div', 'ca-ts-seam ca-ts-seam-bar'));
    root.appendChild(bar);

    const status = el('div', 'ca-ts-status', 'LOADING');
    const hint = el('div', 'ca-ts-hint', '');
    root.appendChild(status);
    root.appendChild(hint);
    container.appendChild(root);
    return { root, bar, status, hint };
}

/** Light the first n segments of each half of the CA bar. */
export function setCaBar(bar, n) {
    for (const half of bar.querySelectorAll('.ca-ts-sbar')) {
        half.querySelectorAll('s').forEach((s, i) => s.classList.toggle('on', i < n));
    }
}
