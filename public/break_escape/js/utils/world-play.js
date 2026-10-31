/**
 * World-play placement for an awareness episode's attack (ENG-05a, E12).
 *
 * `enterWorld(world)` moves the learner into `world.room` (the lobby) and puts the costume on;
 * `leaveWorld(world)` puts them back where they stood and takes the costume off. Both are safe
 * to call at any time: `leaveWorld` with nobody displaced does nothing, so every exit path
 * (the call ending, the prep card closed, a watcher giving up) can call it without checking.
 *
 * `window.loadRoom` only builds and reveals a room; it does not move the player. All rooms sit
 * on one world map, so the move here is a placement (the same call core/game.js uses to spawn
 * the player), with any walk-to-point cancelled first.
 *
 * `world` is the cleaned block from episode-model.js `worldFor`:
 *   { room, startRoom, spawn: { x, y } | null, costume: { sprite, talk? } | null }
 * `spawn` is in tiles from the room's top-left; without it the player lands at the room's centre.
 *
 * Test seams: the second argument may replace `loadRoom`, `rooms`, `player`, `scenario`,
 * `applyCostume`, `removeCostume` and `cancelPath`.
 */
import { TILE_SIZE } from './constants.js';
import { applyCostume, removeCostume } from './player-costume.js';

const win = () => (typeof window !== 'undefined' ? window : {});

// Where the learner stood before the attack, or null while nobody is displaced.
let origin = null;

/** Whether the learner is currently away from where the attack started. */
export function worldActive() {
    return origin !== null;
}

function placeAt(player, x, y, deps) {
    try { (deps.cancelPath ?? win().cancelClickToMove)?.(); } catch (e) { /* no path to cancel */ }
    player.setPosition(x, y);
    player.body?.reset?.(x, y);
}

function roomTarget(room, spawn) {
    const pos = room.position || { x: 0, y: 0 };
    if (spawn && Number.isFinite(spawn.x) && Number.isFinite(spawn.y)) {
        return { x: pos.x + spawn.x * TILE_SIZE, y: pos.y + spawn.y * TILE_SIZE };
    }
    const w = room.map?.widthInPixels ?? 320;
    const h = room.map?.heightInPixels ?? 288;
    return { x: pos.x + w / 2, y: pos.y + h / 2 };
}

/**
 * Load `world.room`, place the player in it and apply the costume. Returns true when the
 * player is in the room. On a failure nothing stays half done: the player is put back.
 */
export async function enterWorld(world, deps = {}) {
    const w = win();
    const player = deps.player ?? w.player;
    if (!world || !world.room || !player) return false;
    const load = deps.loadRoom ?? w.loadRoom;
    const rooms = () => deps.rooms ?? w.rooms ?? {};

    if (!origin) origin = { x: player.x, y: player.y };
    try {
        if (!rooms()[world.room] && typeof load === 'function') await load(world.room);
        const room = rooms()[world.room];
        if (!room) throw new Error(`room "${world.room}" did not load`);
        const at = roomTarget(room, world.spawn);
        placeAt(player, at.x, at.y, deps);
        if (world.costume) await (deps.applyCostume ?? applyCostume)(world.costume, deps.costumeDeps);
        return true;
    } catch (e) {
        console.error('[episode] could not enter the world room:', e);
        await leaveWorld(world, deps);
        return false;
    }
}

/**
 * Put the player back where they stood and take the costume off. Returns true when someone was
 * displaced. The costume comes off even if the placement cannot be made.
 */
export async function leaveWorld(world, deps = {}) {
    if (!origin) return false;
    const w = win();
    const player = deps.player ?? w.player;
    const back = origin;
    origin = null;
    try {
        if (player) placeAt(player, back.x, back.y, deps);
    } catch (e) {
        console.error('[episode] could not return the player to the start room:', e);
    }
    try {
        await (deps.removeCostume ?? removeCostume)(deps.costumeDeps);
    } catch (e) {
        console.error('[episode] could not remove the costume:', e);
    }
    return true;
}
