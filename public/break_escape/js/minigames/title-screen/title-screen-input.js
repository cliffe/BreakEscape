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
