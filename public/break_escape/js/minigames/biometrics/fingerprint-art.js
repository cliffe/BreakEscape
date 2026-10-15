/**
 * FINGERPRINT ART SLOTS
 * =====================
 *
 * The reader overlay and the kit panel are drawn with CSS and the print generator, so they
 * need no image files. Each also has an optional art slot: drop a PNG with the slot's name into
 * assets/minigames/fingerprint/ and it is used as that element's background.
 *
 *   reader-bezel.png     the reader's housing behind the door sign and status light
 *   lift-card.png        the backing card a lifted print sits on
 *   reference-card.png   the card a reference print (field notes, compare step) sits on
 *
 * A missing file is not an error: the CSS fallback stays. Each name is probed once per page.
 */

export const ART_SLOTS = ['reader-bezel', 'lift-card', 'reference-card'];

const cache = new Map(); // name -> Promise<string|null>

export function artUrl(name) {
    const base = (typeof window !== 'undefined' && window.breakEscapeConfig?.assetsPath) || '/break_escape/assets';
    return `${base}/minigames/fingerprint/${name}.png`;
}

/** Resolves to the image URL if the PNG exists, otherwise null. */
export function loadArtSlot(name) {
    if (!ART_SLOTS.includes(name)) return Promise.resolve(null);
    if (!cache.has(name)) {
        cache.set(name, new Promise(resolve => {
            if (typeof Image === 'undefined') { resolve(null); return; }
            const url = artUrl(name);
            const img = new Image();
            img.onload = () => resolve(url);
            img.onerror = () => resolve(null);
            img.src = url;
        }));
    }
    return cache.get(name);
}

/**
 * Use the slot's PNG as the element's background if it exists. Adds `has-art` to the element
 * and sets `--fp-art`; the stylesheet decides how the art is laid out.
 */
export function applyArtSlot(el, name) {
    if (!el) return;
    loadArtSlot(name).then(url => {
        if (!url || !el.isConnected) return;
        el.style.setProperty('--fp-art', `url("${url}")`);
        el.classList.add('has-art');
    });
}

if (typeof window !== 'undefined') {
    window.fingerprintArt = { ART_SLOTS, artUrl, loadArtSlot, applyArtSlot };
}
