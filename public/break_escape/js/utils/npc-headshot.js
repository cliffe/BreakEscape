/**
 * An NPC's headshot (UX slice 2c): the character's own `<key>_headshot.png` (32x32) in
 * assets/characters, wherever the PC flow shows an identity (sign-in tiles, the desktop's
 * signed-in account). Every one of them (sign-in tile, desktop account, selected account via
 * applyHeadshotBox) shows the authored file, else the pixel silhouette; none crops the talk
 * portrait. The keys tried are logged once.
 *
 * The key comes from, in order: an avatar that is already a headshot, the world sprite
 * (spriteSheet, after any lookalike swap), then the talk portrait's stem, its `_v2` sprite
 * first, since the v2 headshots match the talk art.
 */

export const CHARACTERS_URL = '/break_escape/assets/characters/';

/** The character key in a path or key: its file stem without `_talk`, `-talk`, `_headshot` or `_visemes`. */
export function characterKey(pathOrKey) {
    const file = String(pathOrKey || '').split(/[?#]/)[0].split('/').pop() || '';
    return file.replace(/\.\w+$/, '').replace(/[_-](talk|headshot|visemes)$/, '');
}

/**
 * True when a loaded Phaser texture is a plain spritesheet (numbered frames), which is what
 * furniture and object sprites are (bed2, bed_ms_chen). Character atlases name their frames
 * ("walk_south_frame_000"). A key with no loaded texture is not an object sprite as far as we
 * can tell, so it is still tried. `textures` is injectable for tests.
 */
export function isObjectSpriteKey(key, textures = (typeof window !== 'undefined' ? window.game?.textures : null)) {
    try {
        if (!key || !textures?.exists?.(key)) return false;
        const names = textures.get(key)?.getFrameNames?.() || [];
        return names.every((n) => /^\d+$/.test(String(n)));
    } catch (e) {
        return false;
    }
}

/** The headshot keys to try for { avatar, spriteSheet, portrait }, most specific first, no repeats. */
export function headshotKeys({ avatar = null, spriteSheet = null, portrait = null } = {}, { textures } = {}) {
    const keys = [];
    const add = (k) => { if (k && !keys.includes(k)) keys.push(k); };
    if (typeof avatar === 'string' && /_headshot\.png$/i.test(avatar.split(/[?#]/)[0])) add(characterKey(avatar));
    // A character who wears an object sprite (a bed patient) has no headshot by design (the
    // rule avatar_unlocks.rb applies), so neither the sprite key nor the talk stem is tried.
    const objectSprite = typeof spriteSheet === 'string' && isObjectSpriteKey(spriteSheet, textures);
    if (typeof spriteSheet === 'string' && spriteSheet && !objectSprite) add(characterKey(spriteSheet));
    if (!objectSprite && typeof portrait === 'string' && portrait) {
        const stem = characterKey(portrait);
        if (stem.endsWith('_v2')) { add(stem); add(stem.replace(/_v2$/, '')); }
        else { add(`${stem}_v2`); add(stem); }
    }
    return keys;
}

/** The URL of a key's headshot file. */
export function headshotUrl(key) {
    return `${CHARACTERS_URL}${key}_headshot.png`;
}

/** The headshot URLs to try, in order. */
export function headshotCandidates(source) {
    return headshotKeys(source).map(headshotUrl);
}

const warned = new Set();

/** Per-session outcome of each headshot URL looked up: true = loaded at 32x32, false = missed. A miss is never requested again. */
const headshotOutcome = new Map();

/**
 * Log a character with no headshot file, once per key list. `keys` is the list tried (or
 * one key): the log names every one (R1 m8), since the world sprite's key, tried first, is
 * usually the one an artist would add. Returns true when it logged. `log` is injectable.
 */
export function noteMissingHeadshot(keys, log = (msg) => console.warn(msg)) {
    const list = (Array.isArray(keys) ? keys : [keys]).filter(Boolean);
    const id = list.join(',');
    if (!id || warned.has(id)) return false;
    warned.add(id);
    const files = list.map((k) => `${k}_headshot.png`).join(', ');
    log(`[headshot] none of ${files} in assets/characters; falling back to the silhouette`);
    return true;
}

/** The short tile's and the desktop bar's picture box: a 32x32 headshot at x1. */
export const SHORT_PORTRAIT_PX = 32;

/** The sign-in tile's picture box at every other size (css/password-minigame.css, .signin-portrait). */
export const TILE_PORTRAIT_PX = 64;

/** A square image of at least 256 pixels with even sides is a 2x2 talk sheet (person-chat's _isTalkSheet). */
export function isTalkSheetSize(width, height) {
    return width >= 256 && width === height && width % 2 === 0;
}

/**
 * Head crops for posed portraits the finder cannot read (UX slice 2a R4 n3): in a bedside
 * portrait the pillow or the hair is the first opaque row, so the finder's box lands on
 * bedding. Keyed by the talk sheet's file name (one sheet per character); `tile` is the
 * 64x64 crop's top-left in the first frame, `short` the 32x32 crop's, both at scale 1.
 */
export const PORTRAIT_CROP_OVERRIDES = Object.freeze({
    'mr_ahmed_talk.png': { tile: { left: 36, top: 18 }, short: { left: 46, top: 32 } },
    'mr_pryce_talk.png': { tile: { left: 22, top: 6 }, short: { left: 38, top: 20 } },
    'mrs_kowalski_talk.png': { tile: { left: 28, top: 0 }, short: { left: 45, top: 12 } },
    'ms_okafor_talk.png': { tile: { left: 20, top: 12 }, short: { left: 36, top: 30 } }
});

/** The crop override for a portrait URL, or null. */
export function portraitCropOverride(src) {
    const name = String(src || '').split(/[?#]/)[0].split('/').pop();
    return Object.prototype.hasOwnProperty.call(PORTRAIT_CROP_OVERRIDES, name) ? PORTRAIT_CROP_OVERRIDES[name] : null;
}

/**
 * Where to cut a box x box head crop from a talk sheet's first frame (frameSize square), at
 * scale 1 (UX slice 2a R3 n1: the 32px tile showed the whole 128px frame at a quarter, a
 * downscale that lost the face). `alpha(x, y)` reads the frame's alpha. The crop starts 4px
 * below the top of the head and is centred on the head's width over its first 24 rows, so
 * the eyes, nose and mouth are in the box. A blank frame gives the top-centre box.
 */
export function headCropOffset(alpha, frameSize, box = SHORT_PORTRAIT_PX) {
    const clamp = (v) => Math.max(0, Math.min(frameSize - box, v));
    let y0 = -1;
    for (let y = 0; y < frameSize && y0 < 0; y++) {
        for (let x = 0; x < frameSize; x++) { if (alpha(x, y) > 0) { y0 = y; break; } }
    }
    if (y0 < 0) return { left: clamp(Math.round(frameSize / 2) - box / 2), top: 0 };
    let minX = Infinity, maxX = -1;
    for (let y = y0; y < Math.min(frameSize, y0 + 24); y++) {
        for (let x = 0; x < frameSize; x++) {
            if (alpha(x, y) > 0) { if (x < minX) minX = x; if (x > maxX) maxX = x; }
        }
    }
    const cx = maxX >= 0 ? (minX + maxX) / 2 : frameSize / 2;
    return { left: clamp(Math.round(cx) - box / 2), top: clamp(y0 + 4) };
}

/** The alpha reader for an image's top-left frameSize square, or null when the canvas
 *  cannot be read (no canvas, or a tainted one). */
export function frameAlphaReader(img, frameSize) {
    try {
        if (typeof document === 'undefined') return null;
        const canvas = document.createElement('canvas');
        canvas.width = frameSize;
        canvas.height = frameSize;
        const ctx = canvas.getContext && canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, frameSize, frameSize).data;
        return (x, y) => data[(y * frameSize + x) * 4 + 3];
    } catch (e) {
        return null;
    }
}

/** The 32x32 head crop's top-left in a talk sheet's first frame: the override, else the finder. */
export function shortCropOffset(img, src, readAlpha = frameAlphaReader) {
    const frameSize = (img.naturalWidth || img.width) / 2;
    const override = portraitCropOverride(src);
    if (override?.short) return override.short;
    const alpha = readAlpha ? readAlpha(img, frameSize) : null;
    return alpha ? headCropOffset(alpha, frameSize, SHORT_PORTRAIT_PX) : { left: frameSize / 2 - SHORT_PORTRAIT_PX / 2, top: 0 };
}

/** The pixel silhouette shown where an NPC has no authored headshot file. */
export const SILHOUETTE_URL = '/break_escape/assets/icons/pc-user-silhouette.png';

/**
 * A 32x32 picture of an NPC in a box element (the desktop's account bar, the sign-in screen's
 * selected account): the authored `<key>_headshot.png` at x1, with the keys tried logged when
 * none exists, else the box is hidden and `onResult` hears null so the caller draws the pixel
 * silhouette. The talk image is never cropped here (standing rule: only the authored headshot,
 * else the silhouette). `ImageCtor` is injectable for tests. `onResult` hears what was drawn
 * ({ src, width, height, left, top, kind }, offsets as background positions) or null when
 * nothing was, so a caller can keep it (the taskbar, pc-taskbar.js).
 */
export function applyHeadshotBox(el, source, { ImageCtor = (typeof Image !== 'undefined' ? Image : null),
                                               onMissing = noteMissingHeadshot, onResult = null } = {}) {
    if (!el?.style) return;
    const keys = headshotKeys(source);
    const urls = keys.map(headshotUrl);
    const show = (src, size, pos, kind) => {
        el.style.backgroundImage = `url("${src}")`;
        el.style.backgroundRepeat = 'no-repeat';
        el.style.backgroundSize = size;
        el.style.backgroundPosition = pos;
        el.dataset.frame = kind;
        el.hidden = false;
        if (onResult) {
            const [width, height] = String(size).split(' ').map(v => parseInt(v, 10) || 0);
            const [left, top] = String(pos).split(' ').map(v => parseInt(v, 10) || 0);
            onResult({ src, width, height, left, top, kind });
        }
    };
    const hide = () => { el.hidden = true; el.style.backgroundImage = ''; onResult?.(null); };
    if (!ImageCtor) { hide(); return; }
    const tryAt = (i) => {
        while (i < urls.length && headshotOutcome.get(urls[i]) === false) i++;
        if (i >= urls.length) {
            if (keys.length) {
                el.dataset.headshotMissing = keys.join(' ');
                onMissing?.(keys);
            }
            hide();
            return;
        }
        const img = new ImageCtor();
        img.onload = () => {
            const w = img.naturalWidth || img.width;
            const h = img.naturalHeight || img.height;
            if (w !== SHORT_PORTRAIT_PX || h !== SHORT_PORTRAIT_PX) { headshotOutcome.set(urls[i], false); tryAt(i + 1); return; }
            headshotOutcome.set(urls[i], true);
            el.dataset.headshot = keys[i];
            show(urls[i], `${w}px ${h}px`, '0px 0px', 'headshot');
        };
        img.onerror = () => { headshotOutcome.set(urls[i], false); tryAt(i + 1); };
        img.src = urls[i];
    };
    tryAt(0);
}

/** Forget the logged keys (tests). */
export function resetMissingHeadshots() {
    warned.clear();
    headshotOutcome.clear();
}

/**
 * The NPC record behind an account, from the NPC manager: by id, else by the account's
 * username. Null when the manager is not there or has no match.
 */
export function npcRecordFor({ npcId = null, username = null } = {}, manager = (typeof window !== 'undefined' ? window.npcManager : null)) {
    if (!manager) return null;
    if (npcId) {
        const rec = manager.getNPC?.(npcId) || manager.npcs?.get?.(npcId);
        if (rec) return rec;
    }
    if (username && manager.npcs?.values) {
        for (const rec of manager.npcs.values()) {
            if (rec?.creds?.username === username || rec?.username === username) return rec;
        }
    }
    return null;
}

/** The headshot source for an NPC record or a sign-in tile. */
export function headshotSourceFor(tile = {}, record = null) {
    return {
        avatar: tile.avatar || record?.avatar || null,
        spriteSheet: record?.spriteSheet || null,
        portrait: tile.portrait || record?.spriteTalk || null
    };
}
