/**
 * An NPC's headshot (UX slice 2c): the character's own `<key>_headshot.png` (32x32) in
 * assets/characters, wherever the PC flow shows an identity (sign-in tiles, the desktop's
 * signed-in account). The talk portrait is cropped only when no headshot file exists, and
 * that key is logged once.
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

/** The headshot keys to try for { avatar, spriteSheet, portrait }, most specific first, no repeats. */
export function headshotKeys({ avatar = null, spriteSheet = null, portrait = null } = {}) {
    const keys = [];
    const add = (k) => { if (k && !keys.includes(k)) keys.push(k); };
    if (typeof avatar === 'string' && /_headshot\.png$/i.test(avatar.split(/[?#]/)[0])) add(characterKey(avatar));
    if (typeof spriteSheet === 'string' && spriteSheet) add(characterKey(spriteSheet));
    if (typeof portrait === 'string' && portrait) {
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

/**
 * Log a character with no headshot file, once per key. Returns true when it logged.
 * `log` is injectable for tests.
 */
export function noteMissingHeadshot(key, log = (msg) => console.warn(msg)) {
    if (!key || warned.has(key)) return false;
    warned.add(key);
    log(`[headshot] no ${key}_headshot.png in assets/characters; falling back to the talk portrait crop`);
    return true;
}

/** Forget the logged keys (tests). */
export function resetMissingHeadshots() {
    warned.clear();
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

/**
 * Show a headshot in an <img>: tries the candidates in order and calls onMissing(key) when
 * none loads (the img is then hidden). `ImageCtor` is not needed: the img itself loads.
 */
export function applyHeadshotImg(img, source, { onMissing = null } = {}) {
    if (!img) return;
    const urls = headshotCandidates(source);
    const keys = headshotKeys(source);
    const tryAt = (i) => {
        if (i >= urls.length) {
            img.hidden = true;
            img.removeAttribute?.('src');
            const key = keys[keys.length - 1] || null;
            noteMissingHeadshot(key);
            onMissing?.(key);
            return;
        }
        img.onerror = () => tryAt(i + 1);
        img.onload = () => { img.hidden = false; img.dataset.headshot = keys[i]; };
        img.src = urls[i];
    };
    tryAt(0);
}
