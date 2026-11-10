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

/**
 * @param {object} containerItem - a world sprite or an inventory tray <img>
 * @param {(itemData: object) => string} imageKey - inventory.js inventoryImageKey
 * @returns {string|null} null when there is nothing to show (the caller omits the image)
 */
export function containerImageUrl(containerItem, imageKey) {
    const key = containerItem?.texture?.key;
    if (key) return objectUrl(KEY_TO_FILE[key] || key);
    // Opened from the tray: show the picture the tray shows
    const traySrc = typeof containerItem?.getAttribute === 'function' ? containerItem.getAttribute('src') : null;
    if (traySrc) return traySrc;
    const named = typeof imageKey === 'function' ? imageKey(containerItem?.scenarioData) : containerItem?.scenarioData?.type;
    return named ? objectUrl(named) : null;
}

/** The header's <img>, or nothing when there is no picture to show. */
export function containerImageHtml(url, alt) {
    if (!url) return '';
    const safeAlt = String(alt ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    return `<img src="${url}" alt="${safeAlt}" class="container-image">`;
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
