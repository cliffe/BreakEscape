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
const PLAYER_DOOR_PX = 2 * TILE_SIZE;   // never step out of the door the player stands in
const DOOR_OPEN_PX = 1.5 * TILE_SIZE;   // a walker this close to a closed door opens it

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
 */
export function bfsOutOfView({ grid, gridBounds, start, roomBounds = null, isOutOfView, slackPx = 2 * TILE_SIZE, maxCells = 40000 }) {
    if (!grid || !gridBounds || !start || typeof isOutOfView !== 'function') return null;
    const step = gridBounds.step || PATHFINDING_STEP;
    const cols = gridBounds.cols;
    const rows = gridBounds.rows;
    const toWorld = (cx, cy) => ({ x: gridBounds.minX + cx * step + step / 2, y: gridBounds.minY + cy * step + step / 2 });
    const walkable = (cx, cy) => cx >= 0 && cy >= 0 && cx < cols && cy < rows && grid[cy]?.[cx] === 0;
    const inRoom = (p) => !roomBounds || inRoomBounds(roomBounds, p.x, p.y);
    const allowed = (p) => inRoom(p) || (Math.abs(p.x - start.x) <= slackPx && Math.abs(p.y - start.y) <= slackPx);
    const sx = Math.floor((start.x - gridBounds.minX) / step);
    const sy = Math.floor((start.y - gridBounds.minY) / step);
    if (sx < 0 || sy < 0 || sx >= cols || sy >= rows) return null;
    const seen = new Set([sy * cols + sx]);
    const queue = [[sx, sy]];
    for (let qi = 0; qi < queue.length && qi < maxCells; qi++) {
        const [cx, cy] = queue[qi];
        const p = toWorld(cx, cy);
        if (walkable(cx, cy) && inRoom(p) && isOutOfView(p.x, p.y)) return p;
        if (qi > 0 && !walkable(cx, cy)) continue;   // the start cell may sit on a door edge
        for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
            const key = ny * cols + nx;
            if (seen.has(key) || !walkable(nx, ny)) continue;
            if (!allowed(toWorld(nx, ny))) continue;
            seen.add(key);
            queue.push([nx, ny]);
        }
    }
    return null;
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

/** Move a sprite so its body centre (feet) is at (x, y). Enables the body. */
export function placeBody(sprite, x, y) {
    const body = sprite?.body;
    if (!body || typeof body.reset !== 'function') {
        sprite?.setPosition?.(x, y);
        return;
    }
    body.enable = true;
    body.reset(sprite.x, sprite.y);
    const dx = sprite.x - (body.center?.x ?? sprite.x);
    const dy = sprite.y - (body.center?.y ?? sprite.y);
    body.reset(x + dx, y + dy);
}

// ── Environment (overridable for node tests) ────────────────────────────────

function makeEnv(manager, env) {
    const w = typeof window !== 'undefined' ? window : {};
    const scene = () => manager?.scene || w.game?.scene?.scenes?.[0] || null;
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
        openDoorForNpc: (sprite, id) => w.openDoorForNpc?.(sprite, id),
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
        try { const p = E.loadRoom(roomId); p?.catch?.(() => {}); } catch (e) { return false; }
        const t0 = E.now();
        while (E.now() - t0 < WALK_LOAD_WAIT_MS) {
            await E.wait(100);
            if (ready()) return true;
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

    async function chooseSpawn(w) {
        const { opts, behavior } = w;
        const near = w.homeRoom;
        const sprite = behavior.sprite;
        const from = opts.from;
        const target = w.target;
        const outOfView = (x, y) => !inView(x, y, sprite);
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
            const cell = target && bfsOutOfView({ grid: pfm?.worldGrid, gridBounds: pfm?.worldGridBounds, start: target, roomBounds: roomBounds(near), isOutOfView: outOfView });
            return cell ? { ...cell, how: 'walked' } : null;
        }
        const doors = candidateDoors(near, typeof from === 'string' ? from : null, target);
        let fallback = null;
        for (const d of doors) {
            if (!fallback) fallback = d;
            if (!doorUsable(d, w.id, E.doorGates())) { log(`${w.id}: door to ${d.far} not usable (locked, or a gate without the NPC)`); continue; }
            const ok = await ensureLoaded(d.far);
            if (w.done) return null;
            if (!ok) { log(`${w.id}: ${d.far} did not load in ${WALK_LOAD_WAIT_MS} ms`); continue; }
            const p2 = E.pfm();
            const cell = bfsOutOfView({ grid: p2?.worldGrid, gridBounds: p2?.worldGridBounds, start: d.mouth, roomBounds: roomBounds(d.far), isOutOfView: outOfView });
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
        behavior.goToAndStay(target.x, target.y, w.opts.speed, {
            owner: 'walk',
            arrivalData: { walk: 'in', how: w.how },
            onArrive: () => finishIn(w, w.how, true)
        });
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
                owner: 'walk', arrivalData: { walk: 'in', how: 'walked' }, onArrive: () => finishIn(w, 'walked', true)
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
            .then(spawn => beginIn(w, spawn))
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
        if (!inView(p.x, p.y, sprite)) { hideAndHome(w, how); return; }
        w.behavior.cancelMove?.();
        E.fade(sprite, 0, WALK_FADE_MS).then(() => hideAndHome(w, how));
    }

    async function chooseExit(w) {
        const { opts, behavior } = w;
        const near = behavior.roomId || w.homeRoom;
        const sprite = behavior.sprite;
        const to = opts.to;
        const here = bodyPos(behavior);
        const outOfView = (x, y) => !inView(x, y, sprite);
        if (to && typeof to === 'object') {
            const room = to.room || near;
            if (room !== near && !(await ensureLoaded(room))) return { fadeInPlace: true };
            const pt = tileToWorld(room, to);
            return pt ? { ...pt, how: 'walked', farRoom: room !== near ? room : null } : { fadeInPlace: true };
        }
        const pfm = E.pfm();
        if (to === 'offscreen') {
            const cell = bfsOutOfView({ grid: pfm?.worldGrid, gridBounds: pfm?.worldGridBounds, start: here, roomBounds: roomBounds(near), isOutOfView: outOfView });
            return cell ? { ...cell, how: 'walked', anyOutOfView: true } : { fadeInPlace: true };
        }
        const doors = candidateDoors(near, typeof to === 'string' ? to : null, here);
        let fallback = null;
        for (const d of doors) {
            if (!fallback) fallback = d;
            if (!doorUsable(d, w.id, E.doorGates())) continue;
            const ok = await ensureLoaded(d.far);
            if (w.done) return null;
            if (!ok) continue;
            const p2 = E.pfm();
            const cell = bfsOutOfView({ grid: p2?.worldGrid, gridBounds: p2?.worldGridBounds, start: d.mouth, roomBounds: roomBounds(d.far), isOutOfView: outOfView });
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
        const { behavior } = w;
        w.farRoom = exit.farRoom || null;
        w.how = exit.how;
        w.door = exit.door || null;
        w.anyOutOfView = !!exit.anyOutOfView;
        if (w.farRoom) behavior._ensureWallCollidersFor?.([w.farRoom]);
        w.phase = 'walking';
        behavior.goToAndStay(exit.x, exit.y, w.opts.speed, {
            owner: 'walk',
            silentArrival: true,
            onArrive: () => fadeOutAndEnd(w, w.how)
        });
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
        for (const rid of [w.behavior.roomId, w.farRoom, w.homeRoom]) {
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

    function tick() {
        if (!walks.size) return;
        const now = E.now();
        for (const w of [...walks.values()]) {
            if (w.done) continue;
            if (now - w.startedAt > w.timeoutMs && w.phase !== 'fading') { onTimeout(w); continue; }
            if (w.phase !== 'walking') continue;
            openDoorsNear(w);
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
