/**
 * Pictures for the container minigame, kept free of imports so node tests can load them.
 *
 * - takeStandIn: the sprite-like object handed to addToInventory for an item taken
 *   out of a container. It names its tray picture the way a restored or given item
 *   does (the scenario object's "sprite" first, then its type), so the picture is
 *   the same when taken and after a reload (code review R2, E-m1: m10's Spare
 *   Power-Room Card showed keycard.png when taken and keycard-maintenance.png
 *   after a reload).
 * - containerImageUrl: the header picture of an open container. A world container
 *   is a Phaser sprite with a texture key; a container opened from the inventory
 *   tray (a remote session, a bag) is the tray's own <img>, which has no texture,
 *   and the header used to ask for "null" and show a broken image with its alt
 *   text (lab_physical_pentest playtest N12). It now uses the tray picture.
 */

// Phaser texture keys whose file name differs from the key
const KEY_TO_FILE = {
    'safe':         'safe1',
    'pc':           'pc1',
    'notes':        'notes1',
    'phone':        'phone1',
    'suitcase':     'suitcase-1',
    'photo':        'picture1',
    'book':         'book1',
    'fingerprint':  'fingerprint_small',
    'spoofing_kit': 'office-misc-headphones',
};

const objectUrl = (file) => `/break_escape/assets/objects/${file}.png`;

/** The folder picture for a network share (until a share icon of its own is approved). */
export const SHARE_ICON = '/break_escape/assets/objects/m09_folder1.png';

/**
 * A share's short name and UNC path. The server labels a mapped share "Name (\\HOST\Name)"
 * (network_access.rb mapped_share_stubs) and the network view does the same (shareLockable).
 * The label shows the name only; the UNC path goes in the tooltip and the folder title bar
 * (UX feedback slice 2a, main3-05). A name with no path gives { name, unc: null }.
 */
export function shareLabelParts(name) {
    const text = String(name ?? '');
    const m = text.match(/^(.*\S)\s+\((\\\\[^()]+)\)$/);
    return m ? { name: m[1], unc: m[2] } : { name: text, unc: null };
}

/**
 * @param {object} containerItem - a world sprite or an inventory tray <img>
 * @param {(itemData: object) => string} imageKey - inventory.js inventoryImageKey
 * @returns {string|null} null when there is nothing to show (the caller omits the image)
 */
export function containerImageUrl(containerItem, imageKey) {
    // A share has no sprite of its own: "network_share" names no picture file, and its
    // header showed a broken image with the alt text (UX feedback slice 2a, main3-08)
    const data = containerItem?.scenarioData;
    if ((data?.type === 'network_share' || data?.type === 'folder') && !containerItem?.texture?.key) return data.iconImage || SHARE_ICON;
    const key = containerItem?.texture?.key;
    if (key) return objectUrl(KEY_TO_FILE[key] || key);
    // Opened from the tray: show the picture the tray shows
    const traySrc = typeof containerItem?.getAttribute === 'function' ? containerItem.getAttribute('src') : null;
    if (traySrc) return traySrc;
    const named = typeof imageKey === 'function' ? imageKey(containerItem?.scenarioData) : containerItem?.scenarioData?.type;
    return named ? objectUrl(named) : null;
}

/** The header's <img>, or nothing when there is no picture to show. */
export function containerImageHtml(url, alt, extraClass = '') {
    if (!url) return '';
    // The URL comes from a texture key, the scenario type or a tray src: both values are
    // escaped for an attribute, with the same five characters as the other minigame helpers
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    const cls = extraClass ? `container-image ${esc(extraClass)}` : 'container-image';
    return `<img src="${esc(url)}" alt="${esc(alt)}" class="${cls}">`;
}

/**
 * Draw a pixel-art picture at the largest whole-number scale that fits a square box (never a
 * fraction, as object-fit: contain gives), capped at maxScale. With pad, the picture is centred
 * in the box by padding, so a bordered box keeps its size (slice 2a review R1 M1 and M2).
 * Runs when the picture has loaded; until then the CSS size stands.
 */
export function fitWholeScale(img, box, { maxScale = Infinity, pad = false, onlyIfFits = false } = {}) {
    if (!img) return;
    const apply = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) return;
        // onlyIfFits: a picture bigger than the box keeps its CSS sizing (it is drawn down)
        if (onlyIfFits && Math.max(w, h) > box) return;
        const scale = Math.max(1, Math.min(maxScale, Math.floor(box / Math.max(w, h))));
        img.style.width = `${w * scale}px`;
        img.style.height = `${h * scale}px`;
        img.dataset.scale = String(scale);
        if (pad) {
            const padX = Math.max(0, box - w * scale);
            const padY = Math.max(0, box - h * scale);
            const top = Math.floor(padY / 2);
            const left = Math.floor(padX / 2);
            img.style.padding = `${top}px ${padX - left}px ${padY - top}px ${left}px`;
        }
    };
    if (img.complete && img.naturalWidth) apply();
    else img.addEventListener?.('load', apply, { once: true });
}

/**
 * @param {object} item - the container item's scenario data
 * @param {(itemData: object) => string} imageKey - inventory.js inventoryImageKey
 * @param {object} [extras] - extra fields for the stand-in (sourcePcId, transfer)
 */
export function takeStandIn(item, imageKey, extras = {}) {
    return {
        scenarioData: item,
        name: item.type,
        objectId: `temp_${Date.now()}`,
        texture: { key: typeof imageKey === 'function' ? imageKey(item) : item.type },
        ...extras,
        // addToInventory hides the world sprite it was given; this one has none
        setVisible() { return this; }
    };
}
