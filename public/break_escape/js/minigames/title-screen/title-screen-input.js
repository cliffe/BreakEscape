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
