/**
 * SKIN CHOICE (Ops S6 unit 05)
 * ============================
 *
 * Which look the network view uses: `gui` (shown as "Panels") or `cli` (shown as "Terminal").
 * `chooseSkin` is pure. Storage and the page URL are read only inside the functions below, never
 * at import, and only through what the caller passes in.
 *
 * Order, first that applies: a press of the switch on this page; `?net_skin=gui|cli` in the page
 * URL; the player's stored pick; the scenario's `networkView.defaultSkin`; `gui`. A view with no
 * ops block is always `gui`.
 */

export const SKINS = Object.freeze(['gui', 'cli']);
export const STORAGE_KEY = 'be_network_skin';
export const URL_PARAM = 'net_skin';

let pressedSkin = null;

const valid = (name) => (SKINS.includes(name) ? name : null);

export function chooseSkin({ hasOps, pressed, urlValue, stored, scenarioDefault } = {}) {
    if (!hasOps) return 'gui';
    return valid(pressed) || valid(urlValue) || valid(stored) || valid(scenarioDefault) || 'gui';
}

export function readPick(storage) {
    try {
        return valid(storage && storage.getItem(STORAGE_KEY));
    } catch (e) {
        return null;
    }
}

export function writePick(storage, name) {
    if (!valid(name)) return false;
    try {
        storage.setItem(STORAGE_KEY, name);
        return true;
    } catch (e) {
        return false;
    }
}

export function readUrlValue(search) {
    try {
        const text = typeof search === 'string' ? search : '';
        return valid(new URLSearchParams(text).get(URL_PARAM));
    } catch (e) {
        return null;
    }
}

// Records a press of the switch for this page. The pick is saved only when no URL value is
// present, so a preview link never changes a saved pick.
export function rememberPress(name, { urlValue, storage } = {}) {
    if (!valid(name)) return false;
    pressedSkin = name;
    if (!valid(urlValue)) writePick(storage, name);
    return true;
}

export function pressed() {
    return pressedSkin;
}

export function forgetPress() {
    pressedSkin = null;
}
