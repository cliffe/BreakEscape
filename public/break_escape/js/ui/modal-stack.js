// Esc handling for the simple overlay dialogs (gameDisplay, gameConfirm).
//
// Each open overlay registers a close callback. A single capture-phase keydown
// listener on document closes only the topmost one and stops the event, so Esc
// never also reaches a minigame's own Esc handler or the game's key capture
// underneath. Held-down Esc (key repeat) is swallowed without closing a second
// layer. Esc closes the overlay even when a text field has focus.

const stack = [];
let listening = false;

function onKeyDown(e) {
    if (e.key !== 'Escape' || stack.length === 0) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    if (e.repeat) return;
    const top = stack[stack.length - 1];
    top.close();
}

function ensureListener() {
    if (listening || typeof document === 'undefined') return;
    document.addEventListener('keydown', onKeyDown, true);
    listening = true;
}

function dropListenerIfIdle() {
    if (stack.length > 0 || !listening) return;
    document.removeEventListener('keydown', onKeyDown, true);
    listening = false;
}

/**
 * Register an open overlay. `close` must dismiss it (and settle its promise).
 * Returns an unregister function; call it whenever the overlay goes away.
 */
export function registerModal(close) {
    const entry = { close };
    stack.push(entry);
    ensureListener();
    return () => {
        const i = stack.indexOf(entry);
        if (i !== -1) stack.splice(i, 1);
        dropListenerIfIdle();
    };
}

export function openModalCount() {
    return stack.length;
}

export { onKeyDown as _onKeyDownForTest };
