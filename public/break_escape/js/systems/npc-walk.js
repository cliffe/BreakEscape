/**
 * NPC walk-in / walk-out (docs/agents/NPC_WALK_IN_OUT_PLAN.md).
 *
 * An NPC who appears mid-scene walks in from out of view; one who leaves walks out of
 * frame and is hidden once nobody can see it. A fade is only the fallback.
 *
 * core/game.js installs this on the behaviour manager with a dynamic import, so no test
 * harness copy list has to carry it:
 *   manager.walkNPCIn(npcId, opts)  -> Promise<how>   how: 'walked' | 'faded' | 'instant' | 'already' | 'cancelled'
 *   manager.walkNPCOut(npcId, opts) -> Promise<how>   how: 'walked' | 'faded' | 'instant' | 'noop'
 *   manager.isWalkingOut(npcId)     -> bool
 *   manager.walks                   Map npcId -> walk
 *   manager._walkTick(time, playerPos)   (NPCBehaviorManager.update calls it)
 * A promise that settled at the call carries `.immediate = true` (npc-manager.js speaks at once).
 *
 * Events: a walk-in ends with npc_arrived:<id> { npcId, x, y, owner: 'walk', walk: 'in', how };
 * a walk-out ends with npc_left:<id> { npcId, to, how } after the NPC is hidden, never npc_arrived.
 *
 * The only import is constants.js (no imports of its own), so node tests load this file
 * straight from the repo.
 */
import { TILE_SIZE, PATHFINDING_STEP } from '../utils/constants.js';

export const WALK_DEFAULT_TIMEOUT_MS = 20000;
export const WALK_FADE_MS = 400;
export const WALK_VIEW_MARGIN = TILE_SIZE;
export const WALK_LOAD_WAIT_MS = 3000;
export const WALK_STALL_MS = 3000;       // no movement for this long: re-plan, then fall back to the fade
export const WALK_MAX_REPLANS = 4;        // walk-out re-plans after arriving in view
export const WALK_RESPAWN_GAP_PX = 48;     // a stall re-spawn lands at least this far from the spawns already tried
export const WALK_ARRIVE_PX = 10;         // a walk-in ends within this of its position (goToAndStay stops at 1 tile otherwise)
// Walk-out exit cells: prefer one this far clear of the view edge (beyond WALK_VIEW_MARGIN). Best
// effort, never a requirement: with no such cell the deepest out-of-view cell is used. The nearest
// out-of-view cell sits on the view edge, so a walker stopping WALK_ARRIVE_PX short of it, or a
// camera that moves a few px, put it back in view (case e: 4 re-plans, then a fade).
export const WALK_PICK_DEPTH_PX = 2 * TILE_SIZE;
const PLAYER_DOOR_PX = 2 * TILE_SIZE;   // never step out of the door the player stands in
const DOOR_OPEN_PX = 1.5 * TILE_SIZE;   // a walker this close to a closed door opens it
export const DOOR_PASS_HOOK_TIMEOUT_MS = 2000;

// ── Door-pass hook (CA0: gate rules decide whether a walker may pass) ───────
//
// setNpcDoorPassHook(fn): before a walk plans the locked-door fade for a door on its route
// (a locked door, or a gate without the NPC on openFor), it calls
//   fn({ roomId, connectedRoom, direction, npcId })
// true, or a promise that resolves true, makes the door passable: the walker opens it with
// openDoorForNpc(sprite, npcId, { passedByHook: true }) and walks through. Anything else is
// false (today's fade): a throw, a rejection, a non-true value or no answer within
// DOOR_PASS_HOOK_TIMEOUT_MS. One hook at a time: a second registration replaces the first
// with a console.warn; null clears it. The answer is never cached: every plan asks again.
// Also on window.npcWalk.setDoorPassHook.

let doorPassHook = null;

export function setNpcDoorPassHook(fn) {
    if (fn != null && typeof fn !== 'function') {
        console.warn('⚠️ [npc-walk] setNpcDoorPassHook: not a function, ignored');
        return;
    }
    if (fn && doorPassHook && doorPassHook !== fn) {
        console.warn('⚠️ [npc-walk] setNpcDoorPassHook: a door-pass hook was already set; replacing it');
    }
    doorPassHook = fn || null;
}

export function getNpcDoorPassHook() { return doorPassHook; }

/** Ask the hook about a door: resolves true only for true (or a promise of true) in time. */
export function askDoorPassHook(info, timeoutMs = DOOR_PASS_HOOK_TIMEOUT_MS) {
    const fn = doorPassHook;
    if (!fn) return Promise.resolve(false);
    let r;
    try { r = fn(info); } catch (e) {
        console.warn('⚠️ [npc-walk] door-pass hook threw; treating the door as shut', e);
        return Promise.resolve(false);
    }
    if (r === true) return Promise.resolve(true);
    if (!r || typeof r.then !== 'function') return Promise.resolve(false);
    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            console.warn(`⚠️ [npc-walk] door-pass hook gave no answer in ${timeoutMs} ms; treating the door as shut`);
            resolve(false);
        }, timeoutMs);
        Promise.resolve(r).then(
            (v) => { clearTimeout(timer); resolve(v === true); },
            (e) => { clearTimeout(timer); console.warn('⚠️ [npc-walk] door-pass hook rejected; treating the door as shut', e); resolve(false); }
        );
    });
}

if (typeof window !== 'undefined') {
    window.npcWalk = Object.assign(window.npcWalk || {}, { setDoorPassHook: setNpcDoorPassHook });
}

// ── Pure helpers ────────────────────────────────────────────────────────────

/** A sprite rectangle with its feet (body centre) at (x, y): the frame's height above. */
export function npcRectAt(x, y, w = TILE_SIZE, h = 2 * TILE_SIZE) {
    return { x: x - w / 2, y: y - h, w, h };
}

/** True when rect overlaps the view grown by margin. No view (no camera): out of view. */
export function rectInView(rect, view, margin = WALK_VIEW_MARGIN) {
    if (!rect || !view) return false;
    const vx = view.x - margin;
    const vy = view.y - margin;
    const vw = view.width + 2 * margin;
    const vh = view.height + 2 * margin;
    return rect.x < vx + vw && rect.x + rect.w > vx && rect.y < vy + vh && rect.y + rect.h > vy;
}

/**
 * How far rect lies outside the view grown by margin: the largest gap on any side, in px.
 * 0 or less: in view (touching counts as in). No view: Infinity.
 */
export function viewGap(rect, view, margin = WALK_VIEW_MARGIN) {
    if (!rect) return -Infinity;
    if (!view) return Infinity;
    const vx = view.x - margin, vy = view.y - margin;
    const vr = view.x + view.width + margin, vb = view.y + view.height + margin;
    return Math.max(vx - (rect.x + rect.w), rect.x - vr, vy - (rect.y + rect.h), rect.y - vb);
}

/** Is a point inside a pathfinding roomBounds entry (worldX/worldY px, mapWidth/mapHeight tiles)? */
export function inRoomBounds(b, x, y) {
    if (!b) return false;
    return x >= b.worldX && x <= b.worldX + b.mapWidth * TILE_SIZE
        && y >= b.worldY && y <= b.worldY + b.mapHeight * TILE_SIZE;
}

/** The room id whose bounds hold (x, y), or null. roomBounds: Map id -> bounds. */
export function roomAt(roomBounds, x, y) {
    if (!roomBounds?.entries) return null;
    for (const [id, b] of roomBounds) if (inRoomBounds(b, x, y)) return id;
    return null;
}

/**
 * Breadth-first search over the world grid (grid[cy][cx] === 0 is walkable) from start,
 * through walkable cells inside roomBounds (plus a doorway slack round start, so a search
 * seeded on the near side of a door can step through it), for the first cell inside
 * roomBounds that isOutOfView(x, y) accepts. The cell is connected to start by
 * construction. Returns the cell centre { x, y } or null.
 * With depthOf(x, y) (px clear of the view edge) and preferDepth: the nearest out-of-view cell
 * at least preferDepth clear, else the out-of-view cell furthest clear (nearest on a tie).
 * clear (cells): only accept a cell whose neighbours within that many cells are walkable too, so
 * the NPC's whole body fits there (the body is wider than one grid cell). skip(x, y): refuse cells
 * it returns true for (spawns already tried).
 */
export function bfsOutOfView({ grid, gridBounds, start, roomBounds = null, isOutOfView, depthOf = null, preferDepth = 0, clear = 0, skip = null, slackPx = 2 * TILE_SIZE, maxCells = 40000 }) {
    if (!grid || !gridBounds || !start || typeof isOutOfView !== 'function') return null;
    const step = gridBounds.step || PATHFINDING_STEP;
    const cols = gridBounds.cols;
    const rows = gridBounds.rows;
    const toWorld = (cx, cy) => ({ x: gridBounds.minX + cx * step + step / 2, y: gridBounds.minY + cy * step + step / 2 });
    const walkable = (cx, cy) => cx >= 0 && cy >= 0 && cx < cols && cy < rows && grid[cy]?.[cx] === 0;
    const fits = (cx, cy) => {
        for (let dy = -clear; dy <= clear; dy++) for (let dx = -clear; dx <= clear; dx++) if (!walkable(cx + dx, cy + dy)) return false;
        return true;
    };
    const inRoom = (p) => !roomBounds || inRoomBounds(roomBounds, p.x, p.y);
    const allowed = (p) => inRoom(p) || (Math.abs(p.x - start.x) <= slackPx && Math.abs(p.y - start.y) <= slackPx);
    const sx = Math.floor((start.x - gridBounds.minX) / step);
    const sy = Math.floor((start.y - gridBounds.minY) / step);
    if (sx < 0 || sy < 0 || sx >= cols || sy >= rows) return null;
    const seen = new Set([sy * cols + sx]);
    const queue = [[sx, sy]];
    let best = null, bestDepth = -Infinity;
    for (let qi = 0; qi < queue.length && qi < maxCells; qi++) {
        const [cx, cy] = queue[qi];
        const p = toWorld(cx, cy);
        if (walkable(cx, cy) && inRoom(p) && isOutOfView(p.x, p.y) && (!clear || fits(cx, cy)) && !(skip && skip(p.x, p.y))) {
            if (typeof depthOf !== 'function') return p;
            const d = depthOf(p.x, p.y);
            if (d >= preferDepth) return p;
            if (d > bestDepth) { best = p; bestDepth = d; }
        }
        if (qi > 0 && !walkable(cx, cy)) continue;   // the start cell may sit on a door edge
        for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
            const key = ny * cols + nx;
            if (seen.has(key) || !walkable(nx, ny)) continue;
            if (!allowed(toWorld(nx, ny))) continue;
            seen.add(key);
            queue.push([nx, ny]);
        }
    }
    return best;
}

/**
 * Doors of a room: each { sprite, props, far } from the room's own doorSprites and from
 * any loaded room's doors that lead into it, one per far room (own side first).
 */
export function doorsOfRoom(rooms, roomId) {
    const out = [];
    const seenFar = new Set();
    const add = (sprite, far) => {
        if (!far || seenFar.has(far)) return;
        seenFar.add(far);
        out.push({ sprite, props: sprite.doorProperties, far });
    };
    for (const s of rooms?.[roomId]?.doorSprites || []) {
        const p = s?.doorProperties;
        if (!p) continue;
        add(s, p.roomId === roomId ? p.connectedRoom : p.roomId);
    }
    for (const [rid, room] of Object.entries(rooms || {})) {
        if (rid === roomId) continue;
        for (const s of room?.doorSprites || []) {
            const p = s?.doorProperties;
            if (p?.connectedRoom === roomId) add(s, p.roomId);
        }
    }
    return out;
}

/** Can npcId walk through this door? A gate needs the NPC on its openFor; a plain door must be unlocked. */
export function doorUsable(door, npcId, doorGates) {
    const props = door?.props;
    if (!props) return false;
    if (doorGates?.isGate?.(door.sprite)) {
        const cfg = doorGates.groups?.get?.(props.gateKey)?.cfg;
        const openFor = cfg?.openFor || [];
        return Array.isArray(openFor) && openFor.includes(npcId);
    }
    return !props.locked;
}

/** A promise already settled at the call (npc-manager.js runs deferred speech at once). */
function settled(how) {
    const p = Promise.resolve(how);
    p.immediate = true;
    return p;
}

/**
 * Move a sprite so its body centre (feet) is at (x, y). Enables the body.
 * Phaser 3.60's body.reset() puts the body at the sprite's top-left, ignoring the body offset,
 * until the next physics step re-adds the offset. Measuring the offset from that stale body and
 * leaving it unsynced moved every spawn by the offset (live case f: (116,260) became (146,326),
 * through the lobby's south wall). So re-sync after each reset, as seating.js placeBody does.
 */
export function placeBody(sprite, x, y) {
    const body = sprite?.body;
    if (!body || typeof body.reset !== 'function') {
        sprite?.setPosition?.(x, y);
        return;
    }
    const sync = () => {
        if (typeof body.updateFromGameObject !== 'function') return;
        body.updateFromGameObject();
        body.prev?.copy?.(body.position);
        body.prevFrame?.copy?.(body.position);
        body.updateCenter?.();
    };
    body.enable = true;
    body.reset(sprite.x, sprite.y);
    sync();
    const dx = sprite.x - (body.center?.x ?? sprite.x);
    const dy = sprite.y - (body.center?.y ?? sprite.y);
    body.reset(x + dx, y + dy);
    sync();
}

// ── Environment (overridable for node tests) ────────────────────────────────

function makeEnv(manager, env) {
    const w = typeof window !== 'undefined' ? window : {};
    const scene = () => manager?.scene || w.pathfindingManager?.scene || w.game?.scene?.manager?.scenes?.[0] || w.game?.scene?.scenes?.[0] || null;
    const base = {
        rooms: () => w.rooms || {},
        pfm: () => w.pathfindingManager || manager?.pathfindingManager || null,
        view: () => scene()?.cameras?.main?.worldView || null,
        player: () => {
            const p = w.player;
            if (!p) return null;
            return { x: p.body?.center?.x ?? p.x, y: p.body?.center?.y ?? p.y };
        },
        npcManager: () => w.npcManager || null,
        dispatcher: () => w.eventDispatcher || null,
        doorGates: () => w.doorGates || null,
        hostile: () => w.npcHostileSystem || null,
        loadRoom: (id) => w.loadRoom?.(id),
        openDoorForNpc: (sprite, id, o) => w.openDoorForNpc?.(sprite, id, o),
        requestSync: () => w.stateSync?.requestSoon?.(),
        now: () => Date.now(),
        wait: (ms) => new Promise(r => setTimeout(r, ms)),
        fade: (sprite, to, ms) => new Promise((resolve) => {
            const tweens = scene()?.tweens;
            if (!sprite || !tweens?.add) { sprite?.setAlpha?.(to); resolve(); return; }
            tweens.killTweensOf?.(sprite);
            tweens.add({
                targets: sprite, alpha: to, duration: ms,
                // npc-sprite-style.js adopts an outside alpha as its base: end exactly on it
                onComplete: () => { sprite.setAlpha?.(to); resolve(); }
            });
        })
    };
    return { ...base, ...(env || {}) };
}

// ── Installer ───────────────────────────────────────────────────────────────

export function installNpcWalk(manager, env = {}) {
    if (!manager || manager.walks) return manager;
    const E = makeEnv(manager, env);
    const walks = new Map();
    manager.walks = walks;
    manager._walkEnv = E;

    const log = (...a) => console.log('🚶‍➡️ [npc-walk]', ...a);

    const getNpc = (id) => E.npcManager()?.getNPC?.(id) || E.npcManager()?.npcs?.get?.(id) || null;
    const roomBounds = (id) => E.pfm()?.roomBounds?.get?.(id) || null;
    const inView = (x, y, sprite) => rectInView(
        npcRectAt(x, y, sprite?.displayWidth || TILE_SIZE, sprite?.displayHeight || 2 * TILE_SIZE),
        E.view());
    // The out-of-view test and the depth preference for spawn and exit searches
    const viewOpts = (sprite) => ({
        isOutOfView: (x, y) => !inView(x, y, sprite),
        depthOf: (x, y) => viewGap(npcRectAt(x, y, sprite?.displayWidth || TILE_SIZE, sprite?.displayHeight || 2 * TILE_SIZE), E.view()),
        preferDepth: WALK_PICK_DEPTH_PX
    });
    const snap = (x, y) => E.pfm()?.findNearestWalkableWorldCell?.(x, y) || { x, y };
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const emit = (name, data) => E.dispatcher()?.emit?.(name, data);
    const bodyPos = (behavior) => behavior?.npcBodyPos?.()
        || { x: behavior?.sprite?.body?.center?.x ?? behavior?.sprite?.x ?? 0, y: behavior?.sprite?.body?.center?.y ?? behavior?.sprite?.y ?? 0 };
    const homeRoomOf = (id, behavior) => behavior?.homeRoomId || getNpc(id)?.roomId || behavior?.roomId || null;

    function tileToWorld(roomId, t) {
        const room = E.rooms()[roomId];
        if (!room?.position || typeof t?.x !== 'number' || typeof t?.y !== 'number') return null;
        return { x: room.position.x + t.x * TILE_SIZE, y: room.position.y + t.y * TILE_SIZE };
    }

    /** The NPC's scenario position in its home room (where a reload puts it). */
    function homeWorld(id, behavior) {
        const npc = getNpc(id);
        const pos = npc?.position;
        if (pos && pos.px !== undefined && pos.py !== undefined) return { x: pos.px, y: pos.py };
        const w = tileToWorld(homeRoomOf(id, behavior), pos);
        if (w) return w;
        const hp = behavior?.homePosition;
        return hp ? { x: hp.x, y: hp.y } : null;
    }

    async function ensureLoaded(roomId) {
        const ready = () => !!E.rooms()[roomId] && !!roomBounds(roomId);
        if (ready()) return true;
        // loadRoom settles when the load is over. It resolves without a room when the server
        // refuses (403 for a room the player never unlocked): stop then, do not wait out the 3 s.
        let settled = false;
        try { const p = E.loadRoom(roomId); Promise.resolve(p).catch(() => {}).then(() => { settled = true; }); } catch (e) { return false; }
        const t0 = E.now();
        while (E.now() - t0 < WALK_LOAD_WAIT_MS) {
            await E.wait(100);
            if (ready()) return true;
            if (settled) { await E.wait(0); return ready(); }
        }
        return ready();
    }

    function playerNear(door) {
        const p = E.player();
        if (!p || !door?.props) return false;
        return dist(p, { x: door.props.worldX, y: door.props.worldY }) <= PLAYER_DOOR_PX;
    }

    /** Doors of roomId, filtered to `named` (a room id) or all, ordered by distance to `from`. */
    function candidateDoors(roomId, named, from) {
        let doors = doorsOfRoom(E.rooms(), roomId);
        if (named) doors = doors.filter(d => d.far === named);
        else doors = doors.filter(d => !playerNear(d));
        if (from) doors.sort((a, b) => dist(a.props, from) - dist(b.props, from));
        return doors.map(d => ({ ...d, props: d.props, mouth: snap(d.props.worldX, d.props.worldY) }));
    }

    /**
     * true: usable by the current rule; 'hook': the door-pass hook said yes (asked afresh on
     * every plan, never cached); false: not usable, so the walk falls back to the fade.
     */
    async function doorPassable(w, d) {
        if (doorUsable(d, w.id, E.doorGates())) return true;
        if (!getNpcDoorPassHook()) return false;
        const p = d.props || {};
        const yes = await askDoorPassHook(
            { roomId: p.roomId, connectedRoom: p.connectedRoom, direction: p.direction, npcId: w.id },
            E.hookTimeoutMs ?? DOOR_PASS_HOOK_TIMEOUT_MS);
        if (yes) log(`${w.id}: door-pass hook lets the walk through the door to ${d.far}`);
        return yes ? 'hook' : false;
    }

    function openByHook(w, d) {
        if (d.props?.open) return;
        E.openDoorForNpc(d.sprite, w.id, { passedByHook: true });
    }

    function startWalk(id, dir, opts, behavior) {
        let resolve;
        const promise = new Promise(r => { resolve = r; });
        const w = {
            id, dir, opts: opts || {}, behavior, promise, resolve,
            startedAt: E.now(),
            timeoutMs: Number(opts?.timeoutMs) > 0 ? Number(opts.timeoutMs) : WALK_DEFAULT_TIMEOUT_MS,
            homeRoom: homeRoomOf(id, behavior),
            farRoom: null, how: 'walked', phase: 'choosing', done: false
        };
        walks.set(id, w);
        behavior._walk = w;
        return w;
    }

    function endWalk(w, how) {
        if (w.done) return;
        w.done = true;
        if (walks.get(w.id) === w) walks.delete(w.id);
        if (w.behavior?._walk === w) w.behavior._walk = null;
        w.resolve(how);
    }

    function setRoom(w, roomId) {
        if (!roomId) return;
        w.behavior.roomId = roomId;
        const npc = getNpc(w.id);
        if (npc) npc.roomId = roomId;
    }

    // ── Moving, through a closed door if need be ───────────────────────────

    function doorClosed(d) { return !!d?.props && d.props.open === false && !d.props.locked; }

    function openWalkerDoor(w) {
        const d = w.door;
        if (doorClosed(d)) E.openDoorForNpc(d.sprite, w.id);
    }

    /**
     * Walk to (x, y) with finalOpts. A closed door on the route blocks the path grid until it
     * is open, and a walker that has no path never gets close enough for the tick to open it
     * (m09 Dillard stalled 20 s): so go up to the door first, open it, then make the real move.
     */
    function goTo(w, x, y, finalOpts) {
        const { behavior } = w;
        const d = w.door;
        const here = bodyPos(behavior);
        // A shut gate (door-gates.js): the lock the door sprite reads is the far room's, so
        // doorClosed is false and the walk would head straight for a path that does not exist
        // until the gate opens. An openFor walker goes to the spot in front of the doorway first;
        // proximity opens the gate, then the real move is made (E1 R1 M2).
        const gates = E.doorGates();
        if (d?.sprite && gates?.isGate?.(d.sprite) && typeof gates.approachPoint === 'function') {
            const rooms = [behavior.roomId, w.farRoom].filter(Boolean);
            const spot = gates.approachPoint(w.id, here, rooms);
            if (spot) {
                const approach = snap(spot.x, spot.y);
                behavior.goToAndStay(approach.x, approach.y, w.opts.speed, {
                    owner: 'walk',
                    silentArrival: true,
                    onArrive: () => {
                        if (w.done) return;
                        behavior.goToAndStay(x, y, w.opts.speed, finalOpts);
                    }
                });
                return;
            }
        }
        if (doorClosed(d)) {
            const dc = { x: d.props.worldX, y: d.props.worldY };
            const gap = dist(here, dc);
            if (gap > DOOR_OPEN_PX) {
                const ux = (here.x - dc.x) / gap, uy = (here.y - dc.y) / gap;
                const approach = snap(dc.x + ux * TILE_SIZE, dc.y + uy * TILE_SIZE);
                behavior.goToAndStay(approach.x, approach.y, w.opts.speed, {
                    owner: 'walk',
                    silentArrival: true,
                    onArrive: () => {
                        if (w.done) return;
                        openWalkerDoor(w);
                        behavior.goToAndStay(x, y, w.opts.speed, finalOpts);
                    }
                });
                return;
            }
            openWalkerDoor(w);
        }
        behavior.goToAndStay(x, y, w.opts.speed, finalOpts);
    }

    // ── Walk-in ─────────────────────────────────────────────────────────────

    function finishIn(w, how, emitted = false) {
        if (w.done) return;
        if (!emitted) {
            const p = bodyPos(w.behavior);
            emit(`npc_arrived:${w.id}`, { npcId: w.id, x: p.x, y: p.y, owner: 'walk', walk: 'in', how });
        }
        log(`${w.id} walked in (${how})`);
        endWalk(w, how);
    }

    async function chooseSpawn(w, exclude = null, skipAt = null) {
        const { opts, behavior } = w;
        const near = w.homeRoom;
        const sprite = behavior.sprite;
        const from = opts.from;
        const target = w.target;
        // Spawns take the nearest out-of-view cell: a deep pick lands against the far wall, where
        // the body sticks (live cases a and f stalled 20 s). recheckSpawn covers a moving camera.
        const skip = skipAt?.length ? (x, y) => skipAt.some(c => dist(c, { x, y }) < WALK_RESPAWN_GAP_PX) : null;
        const vo = { isOutOfView: (x, y) => !inView(x, y, sprite), skip };
        // A cell whose whole body fits (the body is wider than a grid cell), else any walkable one.
        const pick = (args) => bfsOutOfView({ ...args, clear: 1 }) || bfsOutOfView(args);
        if (from && typeof from === 'object') {
            const room = from.room || near;
            if (room !== near && !(await ensureLoaded(room))) return null;
            const pt = tileToWorld(room, from);
            if (!pt) return null;
            const shown = inView(pt.x, pt.y, sprite);
            return { ...pt, how: shown ? 'faded' : 'walked', fade: shown, farRoom: room !== near ? room : null };
        }
        const pfm = E.pfm();
        if (from === 'offscreen') {
            const cell = target && pick({ grid: pfm?.worldGrid, gridBounds: pfm?.worldGridBounds, start: target, roomBounds: roomBounds(near), ...vo });
            return cell ? { ...cell, how: 'walked' } : null;
        }
        let doors = candidateDoors(near, typeof from === 'string' ? from : null, target).filter(d => !exclude?.has(d.far));
        if (!doors.length && skip) doors = candidateDoors(near, typeof from === 'string' ? from : null, target);   // one door: another cell behind it
        let fallback = null;
        for (const d of doors) {
            if (!fallback) fallback = d;
            const pass = await doorPassable(w, d);
            if (w.done) return null;
            if (!pass) { log(`${w.id}: door to ${d.far} not usable (locked, or a gate without the NPC)`); continue; }
            const ok = await ensureLoaded(d.far);
            if (w.done) return null;
            if (!ok) { log(`${w.id}: ${d.far} did not load in ${WALK_LOAD_WAIT_MS} ms`); continue; }
            if (pass === 'hook') openByHook(w, d);
            const p2 = E.pfm();
            const cell = pick({ grid: p2?.worldGrid, gridBounds: p2?.worldGridBounds, start: d.mouth, roomBounds: roomBounds(d.far), ...vo });
            if (cell) return { ...cell, how: 'walked', farRoom: d.far, door: d };
        }
        if (fallback) { log(`${w.id}: doorway fade at the door to ${fallback.far}`); return { ...fallback.mouth, how: 'faded', fade: true, door: fallback }; }
        return null;
    }

    function beginIn(w, spawn) {
        if (w.done) return;
        const { behavior } = w;
        const sprite = behavior.sprite;
        const target = w.target;
        if (!spawn) spawn = target ? { ...target, how: 'faded', fade: true } : null;
        if (!spawn) {   // nowhere to stand: show it where it is
            E.npcManager()?.recordNpcVisibility?.(w.id, true);
            manager.setNPCVisible(w.id, true);
            finishIn(w, 'instant');
            return;
        }
        w.farRoom = spawn.farRoom || null;
        w.how = spawn.how;
        w.triedAt = [{ x: spawn.x, y: spawn.y }];
        w.door = spawn.door || null;
        if (w.farRoom) behavior._ensureWallCollidersFor?.([w.farRoom]);
        manager.setNPCVisible(w.id, true);
        placeBody(sprite, spawn.x, spawn.y);
        setRoom(w, roomAt(E.pfm()?.roomBounds, spawn.x, spawn.y) || w.homeRoom);
        behavior.updateDepth?.();
        if (spawn.fade) {
            sprite.setAlpha?.(0);
            E.fade(sprite, 1, WALK_FADE_MS);
        }
        if (!target || dist(spawn, target) < 4) { finishIn(w, w.how); return; }
        w.phase = 'walking';
        w.resume = () => goTo(w, target.x, target.y, inGoOpts(w));
        w.resume();
    }

    /**
     * The camera follows the player, so a spawn cell picked out of view can be in view by the
     * time the NPC is shown. Look again just before showing: pick again (twice), then fade in
     * at the doorway (or the cell) rather than let the NPC pop.
     */
    async function recheckSpawn(w, spawn) {
        const sprite = w.behavior.sprite;
        for (let i = 0; spawn && spawn.how === 'walked' && !spawn.fade && inView(spawn.x, spawn.y, sprite); i++) {
            if (i >= 2) {
                log(`${w.id}: spawn cell came into view, fading in at the doorway`);
                const at = spawn.door?.mouth || spawn;
                return { ...at, how: 'faded', fade: true, farRoom: spawn.farRoom || null, door: spawn.door || null };
            }
            log(`${w.id}: spawn cell came into view, choosing again (${i + 1})`);
            spawn = await chooseSpawn(w);
            if (w.done) return null;
        }
        return spawn;
    }

    function inGoOpts(w) {
        return {
            owner: 'walk',
            arrivalData: { walk: 'in', how: w.how },
            arriveWithin: WALK_ARRIVE_PX,
            onArrive: () => finishIn(w, w.how, true)
        };
    }

    function walkNPCIn(id, opts = {}) {
        opts = (opts && typeof opts === 'object') ? opts : {};
        const behavior = manager.behaviors?.get?.(id);
        const sprite = behavior?.sprite;
        const nm = E.npcManager();
        const cur = walks.get(id);
        if (cur?.dir === 'in') return cur.promise;
        const home = homeRoomOf(id, behavior);
        if (!behavior || !sprite || !E.rooms()[home]) {
            manager.setNPCVisible(id, true);
            emit(`npc_arrived:${id}`, { npcId: id, owner: 'walk', walk: 'in', how: 'instant' });
            return settled('instant');
        }
        const target = opts.to ? tileToWorld(home, opts.to) : homeWorld(id, behavior);
        if (cur?.dir === 'out') {
            // Turn back: cancel the walk-out and walk back to `to`
            behavior.cancelMove?.();
            endWalk(cur, 'cancelled');
            nm?.recordNpcVisibility?.(id, true);
            E.fade(sprite, 1, WALK_FADE_MS / 2);   // stops a fade-out already running
            const w = startWalk(id, 'in', opts, behavior);
            w.target = target;
            w.phase = 'walking';
            if (!target) { finishIn(w, 'walked'); return w.promise; }
            behavior.goToAndStay(target.x, target.y, opts.speed, {
                owner: 'walk', arrivalData: { walk: 'in', how: 'walked' }, arriveWithin: WALK_ARRIVE_PX, onArrive: () => finishIn(w, 'walked', true)
            });
            return w.promise;
        }
        if (sprite.visible && !nm?.isHiddenByMapping?.(id) && getNpc(id)?.isVisible !== false) return settled('already');
        const w = startWalk(id, 'in', opts, behavior);
        w.target = target;
        // Recorded at the trigger (a reload mid-walk shows the NPC at its position); the
        // sprite stays hidden until the spawn is chosen
        nm?.recordNpcVisibility?.(id, true, { persistOnly: true });
        E.requestSync();
        chooseSpawn(w)
            .then(spawn => recheckSpawn(w, spawn))
            .then(spawn => { if (!w.done) beginIn(w, spawn); })
            .catch(e => { console.warn(`⚠️ walkIn ${id}: spawn search failed`, e); beginIn(w, null); });
        return w.promise;
    }

    // ── Walk-out ────────────────────────────────────────────────────────────

    function hideAndHome(w, how) {
        if (w.done) return;
        const { behavior, id } = w;
        const sprite = behavior.sprite;
        behavior.cancelMove?.();
        const home = homeWorld(id, behavior);
        if (home && sprite) placeBody(sprite, home.x, home.y);
        manager.setNPCVisible(id, false);   // records hidden in full, body off
        if (sprite?.body) sprite.body.enable = false;
        setRoom(w, w.homeRoom);
        if (home) behavior.homePosition = { x: home.x, y: home.y };
        const to = w.farRoom || (typeof w.opts.to === 'string' ? w.opts.to : null);
        log(`${id} walked out (${how})`);
        endWalk(w, how);
        emit(`npc_left:${id}`, { npcId: id, to, how });
    }

    function fadeOutAndEnd(w, how) {
        if (w.done || w.phase === 'fading') return;
        w.phase = 'fading';
        const sprite = w.behavior.sprite;
        const p = bodyPos(w.behavior);
        if (!inView(p.x, p.y, sprite)) {
            // Nobody sees it go. A walker already through its door (or anywhere, for 'offscreen')
            // left by walking, exactly as the tick's early end would have reported it.
            const past = w.anyOutOfView || (w.farRoom && inRoomBounds(roomBounds(w.farRoom), p.x, p.y));
            hideAndHome(w, past && w.how === 'walked' ? 'walked' : how);
            return;
        }
        w.behavior.cancelMove?.();
        E.fade(sprite, 0, WALK_FADE_MS).then(() => hideAndHome(w, how));
    }

    async function chooseExit(w, ov = {}) {
        const { opts, behavior } = w;
        const near = ov.near || behavior.roomId || w.homeRoom;
        const sprite = behavior.sprite;
        const to = ov.ignoreTo ? undefined : opts.to;
        const here = ov.here || bodyPos(behavior);
        const vo = viewOpts(sprite);
        if (to && typeof to === 'object') {
            const room = to.room || near;
            if (room !== near && !(await ensureLoaded(room))) return { fadeInPlace: true };
            const pt = tileToWorld(room, to);
            return pt ? { ...pt, how: 'walked', farRoom: room !== near ? room : null } : { fadeInPlace: true };
        }
        const pfm = E.pfm();
        if (to === 'offscreen') {
            const cell = bfsOutOfView({ grid: pfm?.worldGrid, gridBounds: pfm?.worldGridBounds, start: here, roomBounds: roomBounds(near), ...vo });
            return cell ? { ...cell, how: 'walked', anyOutOfView: true } : { fadeInPlace: true };
        }
        const doors = candidateDoors(near, typeof to === 'string' ? to : null, here).filter(d => !ov.exclude?.has(d.far));
        let fallback = null;
        for (const d of doors) {
            if (!fallback) fallback = d;
            const pass = await doorPassable(w, d);
            if (w.done) return null;
            if (!pass) continue;
            const ok = await ensureLoaded(d.far);
            if (w.done) return null;
            if (!ok) continue;
            if (pass === 'hook') openByHook(w, d);
            const p2 = E.pfm();
            const cell = bfsOutOfView({ grid: p2?.worldGrid, gridBounds: p2?.worldGridBounds, start: d.mouth, roomBounds: roomBounds(d.far), ...vo });
            if (cell) return { ...cell, how: 'walked', farRoom: d.far, door: d };
            // The far room is all in view: walk through the door and fade there
            return { ...d.mouth, how: 'faded', farRoom: null, door: d };
        }
        if (fallback) return { ...fallback.mouth, how: 'faded', door: fallback };
        return { fadeInPlace: true };
    }

    function beginOut(w, exit) {
        if (w.done || !exit) return;
        if (exit.fadeInPlace) { fadeOutAndEnd(w, 'faded'); return; }
        startOutLeg(w, exit);
    }

    function startOutLeg(w, exit) {
        const { behavior } = w;
        w.farRoom = exit.farRoom || null;
        w.how = exit.how;
        w.door = exit.door || null;
        w.anyOutOfView = !!exit.anyOutOfView;
        if (w.farRoom) behavior._ensureWallCollidersFor?.([w.farRoom]);
        w.phase = 'walking';
        w.lastPos = null;
        goTo(w, exit.x, exit.y, {
            owner: 'walk',
            silentArrival: true,
            arriveWithin: WALK_ARRIVE_PX,
            onArrive: () => onOutArrive(w)
        });
    }

    /** The camera follows the player, so the exit cell planned out of view may be in view now. */
    function onOutArrive(w) {
        if (w.done) return;
        const p = bodyPos(w.behavior);
        if (w.how === 'faded' || !inView(p.x, p.y, w.behavior.sprite)) { fadeOutAndEnd(w, w.how); return; }
        replanOut(w);
    }

    /**
     * Another out-of-view cell, nearest first: in the room the walker stands in, then through
     * that room's other doors (never back into the room it left). Fades, reporting 'faded',
     * only when none can be reached.
     */
    async function replanOut(w) {
        if (w.done) return;
        w.replans = (w.replans || 0) + 1;
        w.phase = 'replanning';
        if (w.replans <= WALK_MAX_REPLANS) {
            const { behavior } = w;
            const sprite = behavior.sprite;
            const p = bodyPos(behavior);
            const room = roomAt(E.pfm()?.roomBounds, p.x, p.y) || behavior.roomId || w.homeRoom;
            const pfm = E.pfm();
            const cell = bfsOutOfView({ grid: pfm?.worldGrid, gridBounds: pfm?.worldGridBounds, start: p, roomBounds: roomBounds(room), ...viewOpts(sprite) });
            if (cell && dist(cell, p) > 8) {
                log(`${w.id}: exit cell in view on arrival, re-planning to another out of view (${w.replans})`);
                startOutLeg(w, { ...cell, how: 'walked', farRoom: room !== w.homeRoom ? room : w.farRoom, anyOutOfView: room === w.homeRoom && !w.farRoom, door: null });
                return;
            }
            const exit = await chooseExit(w, { near: room, here: p, exclude: new Set(room !== w.homeRoom ? [w.homeRoom] : []), ignoreTo: true });
            if (w.done) return;
            if (exit && !exit.fadeInPlace && exit.how === 'walked') {
                log(`${w.id}: re-planning through the door to ${exit.farRoom} (${w.replans})`);
                startOutLeg(w, exit);
                return;
            }
        }
        w.phase = 'walking';
        fadeOutAndEnd(w, 'faded');
    }

    function walkNPCOut(id, opts = {}) {
        opts = (opts && typeof opts === 'object') ? opts : {};
        const behavior = manager.behaviors?.get?.(id);
        const sprite = behavior?.sprite;
        const nm = E.npcManager();
        const cur = walks.get(id);
        if (cur?.dir === 'out') return cur.promise;
        if (cur?.dir === 'in') {
            behavior?.cancelMove?.();
            endWalk(cur, 'cancelled');
        }
        const home = homeRoomOf(id, behavior);
        if (!behavior || !sprite || !E.rooms()[home] || (cur?.dir === 'in' && !sprite.visible)) {
            manager.setNPCVisible(id, false);
            emit(`npc_left:${id}`, { npcId: id, to: typeof opts.to === 'string' ? opts.to : null, how: 'instant' });
            return settled('instant');
        }
        if (!cur && (!sprite.visible || nm?.isHiddenByMapping?.(id))) return settled('noop');
        const w = startWalk(id, 'out', opts, behavior);
        // Saved hidden at the trigger; entry.isVisible stays true until the NPC is hidden
        nm?.recordNpcVisibility?.(id, false, { persistOnly: true });
        E.requestSync();
        const hs = E.hostile();
        if (hs?.isNPCHostile?.(id) && !hs?.isNPCKO?.(id)) {   // chase logic owns a hostile: fade in place
            fadeOutAndEnd(w, 'faded');
            return w.promise;
        }
        chooseExit(w)
            .then(exit => beginOut(w, exit))
            .catch(e => { console.warn(`⚠️ walkOut ${id}: exit search failed`, e); fadeOutAndEnd(w, 'faded'); });
        return w.promise;
    }

    // ── Tick ────────────────────────────────────────────────────────────────

    function openDoorsNear(w) {
        const p = bodyPos(w.behavior);
        const rooms = E.rooms();
        for (const rid of new Set([w.behavior.roomId, w.farRoom, w.homeRoom])) {
            for (const s of rooms[rid]?.doorSprites || []) {
                const props = s?.doorProperties;
                if (!props || props.open || props.locked || s.active === false) continue;
                if (E.doorGates()?.isGate?.(s)) continue;
                if (dist(p, { x: props.worldX, y: props.worldY }) > DOOR_OPEN_PX) continue;
                E.openDoorForNpc(s, w.id);
            }
        }
    }

    function onTimeout(w) {
        const { behavior } = w;
        const sprite = behavior.sprite;
        log(`${w.id}: walk-${w.dir} timed out after ${w.timeoutMs} ms`);
        if (w.dir === 'out') { behavior.cancelMove?.(); w.phase = 'timeout'; fadeOutAndEnd(w, 'faded'); return; }
        behavior.cancelMove?.();
        if (w.phase === 'choosing') manager.setNPCVisible(w.id, true);
        const t = w.target;
        if (!t) { finishIn(w, 'instant'); return; }
        const shown = inView(t.x, t.y, sprite);
        placeBody(sprite, t.x, t.y);
        setRoom(w, w.homeRoom);
        if (shown) { sprite.setAlpha?.(0); E.fade(sprite, 1, WALK_FADE_MS); }
        finishIn(w, shown ? 'faded' : 'instant');
    }

    /**
     * No movement for WALK_STALL_MS: re-plan, then try the next door, and only then the fade
     * (the timeout). Out: another exit cell or door (replanOut). In: re-issue the move (this
     * opens a closed door on the route), then, still out of view, spawn at another door.
     */
    async function onStall(w) {
        w.stalls = (w.stalls || 0) + 1;
        const { behavior } = w;
        const p = bodyPos(behavior);
        log(`${w.id}: no progress for ${WALK_STALL_MS} ms (stall ${w.stalls}), re-planning`);
        if (w.dir === 'out') { behavior.cancelMove?.(); replanOut(w); return; }
        if (w.stalls === 1 && w.resume) { behavior.cancelMove?.(); openWalkerDoor(w); w.resume(); return; }
        if (w.stalls <= 3 && w.how === 'walked' && !inView(p.x, p.y, behavior.sprite)) {
            // Still unseen: spawn again at the next clear out-of-view cell (another door first, else
            // another cell behind the same one), and fade only when none is left.
            const tried = (w.triedFar ||= new Set());
            if (w.door) tried.add(w.door.far);
            (w.triedAt ||= []).push({ x: p.x, y: p.y });
            w.phase = 'replanning';
            const spawn = await chooseSpawn(w, tried, w.triedAt);
            if (w.done) return;
            if (spawn && spawn.how === 'walked' && !inView(spawn.x, spawn.y, behavior.sprite)
                && !w.triedAt.some(c => dist(c, spawn) < WALK_RESPAWN_GAP_PX)) {
                w.triedAt.push({ x: spawn.x, y: spawn.y });
                behavior.cancelMove?.();
                w.farRoom = spawn.farRoom || null;
                w.door = spawn.door || null;
                if (w.farRoom) behavior._ensureWallCollidersFor?.([w.farRoom]);
                placeBody(behavior.sprite, spawn.x, spawn.y);
                w.phase = 'walking';
                w.lastPos = null;
                w.resume = () => goTo(w, w.target.x, w.target.y, inGoOpts(w));
                w.resume();
                return;
            }
            w.phase = 'walking';
        }
        onTimeout(w);   // the fade, reported as 'faded'
    }

    function tick() {
        if (!walks.size) return;
        const now = E.now();
        for (const w of [...walks.values()]) {
            if (w.done) continue;
            if (now - w.startedAt > w.timeoutMs && w.phase !== 'fading') { onTimeout(w); continue; }
            if (w.phase !== 'walking') continue;
            openDoorsNear(w);
            const here = bodyPos(w.behavior);
            if (!w.lastPos || dist(here, w.lastPos) > 3) { w.lastPos = here; w.lastMoveAt = now; }
            else if (now - w.lastMoveAt > WALK_STALL_MS) { w.lastMoveAt = now; onStall(w); continue; }
            if (w.dir !== 'out') continue;
            const p = bodyPos(w.behavior);
            const past = w.anyOutOfView || (w.farRoom && inRoomBounds(roomBounds(w.farRoom), p.x, p.y));
            // The camera follows the player, so the exit cell is only a cap: end as soon as
            // the walker is through the door and out of view
            if (past && !inView(p.x, p.y, w.behavior.sprite)) hideAndHome(w, w.how);
        }
    }

    manager.walkNPCIn = walkNPCIn;
    manager.walkNPCOut = walkNPCOut;
    manager.isWalkingOut = (id) => walks.get(id)?.dir === 'out';
    manager._walkTick = tick;
    return manager;
}

export default installNpcWalk;
