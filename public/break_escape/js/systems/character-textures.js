/**
 * Character texture loading
 *
 * Character atlases (80x80 frames, about 7 MB each once decoded) are loaded
 * only for the characters a scenario uses, rather than all of them in preload.
 * The server sends the keys in the bootstrap scenario as `characterSprites`;
 * they are queued in the same loader pass as the scenario JSON so they load
 * behind the loading screen. ensureCharacterTexture() is the fallback for
 * anything that list missed, and for the in-game player sprite switch.
 */
import { ASSETS_VERSION } from '../config.js';

// Only these NPC types get a world sprite (rooms.js createNPCSpritesForRoom).
const SPRITE_NPC_TYPES = ['person', 'both'];
// npc-sprites.js createNPCSprite falls back to this when an NPC sets no spriteSheet.
const DEFAULT_NPC_SPRITE = 'hacker';

// key -> Promise<boolean> for loads started by ensureCharacterTexture
const pendingLoads = new Map();

/**
 * Sprite sheet keys for the NPCs in a list that get a world sprite.
 * @param {Array} npcs - NPC definitions from a room
 * @returns {string[]}
 */
export function spriteKeysForNPCs(npcs) {
    if (!Array.isArray(npcs)) return [];
    return npcs
        .filter(npc => npc && SPRITE_NPC_TYPES.includes(npc.npcType))
        .map(npc => npc.spriteSheet || DEFAULT_NPC_SPRITE);
}

/**
 * The character sprite keys a scenario uses.
 * Prefers the server's `characterSprites` list (the bootstrap payload has no
 * NPC data). Falls back to walking rooms[*].npcs, which standalone mode needs
 * because it loads the full scenario file.
 * @param {object} scenario
 * @returns {string[]} unique keys
 */
export function collectCharacterSprites(scenario) {
    if (!scenario) return [];
    if (Array.isArray(scenario.characterSprites)) {
        return [...new Set(scenario.characterSprites.filter(Boolean))];
    }
    const keys = [];
    const rooms = scenario.rooms && typeof scenario.rooms === 'object' ? Object.values(scenario.rooms) : [];
    for (const room of rooms) {
        if (room && typeof room === 'object') keys.push(...spriteKeysForNPCs(room.npcs));
    }
    if (scenario.player?.spriteSheet) keys.push(scenario.player.spriteSheet);
    return [...new Set(keys.filter(Boolean))];
}

function atlasPaths(key) {
    return [
        `characters/${key}.png?v=${ASSETS_VERSION}`,
        `characters/${key}.json?v=${ASSETS_VERSION}`
    ];
}

/**
 * Queue character atlases on a scene's loader without starting it.
 * Used during preload, where Phaser starts the loader itself.
 * @param {Phaser.Scene} scene
 * @param {string[]} keys
 */
export function queueCharacterAtlases(scene, keys) {
    for (const key of new Set(keys || [])) {
        if (!key || scene.textures.exists(key)) continue;
        scene.load.atlas(key, ...atlasPaths(key));
    }
}

/**
 * Make sure a character atlas is loaded, loading it now if it isn't.
 * Concurrent callers for one key share a single load.
 * @param {Phaser.Scene} scene
 * @param {string} key
 * @param {object} [options]
 * @param {boolean} [options.expected=false] - true when an on-demand load is normal
 *   (the player picking a new character), so it isn't reported as a missed preload
 * @returns {Promise<boolean>} true once the texture exists, false if it failed to load
 */
export function ensureCharacterTexture(scene, key, { expected = false } = {}) {
    if (!key || !scene) return Promise.resolve(false);
    if (scene.textures.exists(key)) return Promise.resolve(true);
    if (pendingLoads.has(key)) return pendingLoads.get(key);

    if (expected) {
        console.log(`loading character atlas "${key}"`);
    } else {
        console.warn(`character atlas "${key}" was not preloaded; loading on demand`);
    }

    const load = new Promise(resolve => {
        const loader = scene.load;
        // The loader is shared, so wait for this file's own event rather than
        // 'complete', which fires for whichever batch finishes first.
        const completeEvent = `filecomplete-atlasjson-${key}`;
        const cleanup = () => {
            loader.off(completeEvent, onComplete);
            loader.off('loaderror', onError);
        };
        const onComplete = () => {
            cleanup();
            resolve(true);
        };
        const onError = (file) => {
            if (file?.key !== key) return;
            cleanup();
            console.warn(`character atlas "${key}" failed to load from ${file.src || file.url}`);
            resolve(false);
        };
        loader.on(completeEvent, onComplete);
        loader.on('loaderror', onError);
        loader.atlas(key, ...atlasPaths(key));
        if (!loader.isLoading()) loader.start();
    }).finally(() => pendingLoads.delete(key));

    pendingLoads.set(key, load);
    return load;
}

/**
 * ensureCharacterTexture for several keys at once.
 * @param {Phaser.Scene} scene
 * @param {string[]} keys
 * @returns {Promise<boolean[]>}
 */
export function ensureCharacterTextures(scene, keys) {
    return Promise.all([...new Set(keys || [])].map(key => ensureCharacterTexture(scene, key)));
}
