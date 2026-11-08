/**
 * Behind-the-wall fade (planning_notes/behind_wall_fade/DESIGN.md).
 *
 * The view fakes depth: a south room S's top two tile rows (its back wall) overlap the bottom two
 * rows of the room to its north, and the player can walk into that strip, "behind" S's wall. While
 * they stand there S's wall and the objects drawn in those rows fade to 50%.
 *
 * Detection (roomsBehindWallAt) says which rooms' back walls the player's body is behind. The
 * controller (createBehindWallFade) then steps one factor k per south room (1 -> 0.5 in 150 ms,
 * back in 200 ms), fades one visible tile per cell of the strip, and fades the sprites that room
 * owns whose drawn rect reaches into the strip. Doors, NPCs and the player never fade.
 *
 * Hook placement: update(now) runs in core/game.js update() after every writer of room-object
 * alpha (reveals, the needs system, door gates, scenario timers) and before lightingSystem.update.
 * A writer added later in the frame would win for one frame and be re-based on the next tick.
 * Pass this.time.now: the scene Clock has no delta.
 *
 * No imports, so the node tests can load this file on its own.
 */

const TILE = 32;
const BACK_WALL_ROWS = 2;   // utils/constants.js VISUAL_TOP_TILES
const DOOR_HALF_WIDTH = 16; // a door sprite is 32 px wide
// The bottom 12 px of every room tileset's wall tile are the south-wall cap: 2 px grey, 8 px white,
// 2 px grey (tools/survey_wall_cap.py: 1075 of 1075 bottom-row frames in the 148 room maps, 107
// tilesets). The north room's cap shows through a faded wall as a white stripe, so S's face tiles
// get this much of their bottom redrawn opaque (DESIGN.md section 5).
export const WALL_CAP_PX = 12;

export const FADE_ALPHA = 0.5; // the faded k and the full-blend point of the strip light

let doorwayProvider = null;
/** door-gaps.js registers (roomId) => [{ to, direction, x, y }], the provider interaction-walls.js uses. */
export function setFadeDoorways(fn) { doorwayProvider = typeof fn === 'function' ? fn : null; }

/** World rect of a room's back-wall rows, or null if the room has no map or position yet. */
export function backWallStrip(room) {
    const pos = room?.position, map = room?.map;
    if (!pos || !map) return null;
    const w = map.widthInPixels;
    if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y) || !Number.isFinite(w)) return null;
    return { left: pos.x, right: pos.x + w, top: pos.y, bottom: pos.y + BACK_WALL_ROWS * TILE };
}

/**
 * Is the doorway `d` (an entry of S's provider list) open? It is unless S's or d.to's doorSprites
 * hold an active sprite for the pair, at that x, that isn't open. That is interaction-walls.js
 * doorClosed with an x match, for rooms joined by more than one door. It covers a door opened
 * from either side (the opener is inactive, the far sprite is gone) and a gate door (sprite
 * active, doorProperties.open toggles).
 */
export function doorwayOpen(rooms, S, d) {
    for (const [id, other] of [[S, d.to], [d.to, S]]) {
        for (const sprite of Object.values(rooms?.[id]?.doorSprites || {})) {
            const props = sprite?.doorProperties;
            if (!props || sprite.active === false || props.open) continue;
            if (props.connectedRoom !== other) continue;
            if (Math.abs((props.worldX ?? NaN) - d.x) <= 1) return false;
        }
    }
    return true;
}

/** The open north doorways of room S, as [{ to, x }]. Empty without a provider. */
export function openNorthDoorways(rooms, S, doorways = doorwayProvider) {
    if (!doorways) return [];
    let list;
    try { list = doorways(S) || []; } catch (e) { return []; }
    return list.filter(d => d && d.direction === 'north' && Number.isFinite(d.x) && doorwayOpen(rooms, S, d));
}

/**
 * Ids of the rooms whose back wall the player's body is behind.
 *   body: { left, right, feetY } with left = player.body.x, right = left + player.body.width,
 *         feetY = player.body.y + player.body.height (the bottom edge updatePlayerRoom uses).
 * S is included when the body's x-range overlaps its strip and strip.top + margin < feetY <
 * strip.bottom (the strip is open at the bottom: feet on S's floor never count). It is dropped
 * while the body is over an open north doorway of S, within 16 + half the body's width of its x.
 * A result with two ids means the body is over the seam of two side-by-side south rooms.
 */
export function roomsBehindWallAt(body, rooms, { margin = 4, doorways = doorwayProvider } = {}) {
    const out = [];
    if (!body || !rooms) return out;
    const { left, right, feetY } = body;
    if (![left, right, feetY].every(Number.isFinite)) return out;
    const cx = (left + right) / 2, half = (right - left) / 2;
    for (const id of Object.keys(rooms)) {
        const strip = backWallStrip(rooms[id]);
        if (!strip) continue;
        if (!(right > strip.left && left < strip.right)) continue;
        if (!(feetY > strip.top + margin && feetY < strip.bottom)) continue;
        let suppressed = false;
        for (const d of openNorthDoorways(rooms, id, doorways)) {
            if (Math.abs(cx - d.x) <= DOOR_HALF_WIDTH + half) { suppressed = true; break; }
        }
        if (!suppressed) out.push(id);
    }
    return out;
}

// ---- Controller -------------------------------------------------------------------------

const FADE_OUT_MS = 150;
const FADE_IN_MS = 200;
const MAX_DT = 250;
const EPS = 1e-4;
const TABLE_BACK_EDGE_PX = 4; // core/rooms.js: the back-edge allowance table grouping uses

const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** The sprite as drawn: its rect in world px (rotated sprites use their axis-aligned bounds). */
export function drawnRect(sprite) {
    if (sprite.rotation && typeof sprite.getBounds === 'function') {
        const b = sprite.getBounds();
        return { left: b.left ?? b.x, top: b.top ?? b.y, right: b.right ?? (b.x + b.width), bottom: b.bottom ?? (b.y + b.height) };
    }
    const w = sprite.displayWidth, h = sprite.displayHeight;
    const left = sprite.x - w * (sprite.originX ?? 0.5), top = sprite.y - h * (sprite.originY ?? 0.5);
    return { left, top, right: left + w, bottom: top + h };
}

function rectReachesStrip(r, strip) {
    return r.top < strip.bottom - 0.5 && r.bottom > strip.top && r.right > strip.left && r.left < strip.right;
}

function sameValues(r) {
    return r && Number.isFinite(r.left) && Number.isFinite(r.top) && Number.isFinite(r.right) && Number.isFinite(r.bottom);
}

/**
 * env: { rooms(), player(), reducedMotion(), doorways(roomId) } (all optional but rooms and player).
 * Returns { update, debugState, setEnabled, clear, lightWeights }.
 */
export function createBehindWallFade(env) {
    let enabled = env.enabled !== false;
    let lastNow = null;
    const states = new Map();   // roomId -> { k, target, cells: null | [{ face, hidden: [] }], hiddenCount }
    const records = new Map();  // sprite -> { base, applied, roomId }
    const weightPool = [];      // reused entries for lightWeights()
    const weightEntries = new Map();
    const weights = [];

    const getRooms = () => (env.rooms && env.rooms()) || {};
    const getDoorways = () => env.doorways || doorwayProvider;

    // ---- tiles (§5) ----
    // ---- opaque cap bands (§5) ----
    /** Frame of the tile's cap side in its tileset texture, cached on the texture. Null if unknown. */
    function capFrame(tile, layer, band) {
        const ts = tile.tileset || layer.gidMap?.[tile.index];
        const tex = ts?.image;
        if (!ts || !tex || typeof tex.add !== 'function') return null;
        const tw = ts.tileWidth || TILE, th = ts.tileHeight || TILE;
        const xy = ts.getTileTextureCoordinates?.(tile.index);
        if (!xy || !Number.isFinite(xy.x) || !Number.isFinite(xy.y)) return null;
        const name = `bwf_cap_${tile.index}_${band}`;
        if (!tex.has?.(name)) {
            // band: which side of the unrotated frame is the tile's bottom after rotation and flips
            const vertical = band === 'l' || band === 'r';
            const w = vertical ? WALL_CAP_PX : tw, h = vertical ? th : WALL_CAP_PX;
            const x = band === 'r' ? xy.x + tw - WALL_CAP_PX : xy.x;
            const y = band === 'b' ? xy.y + th - WALL_CAP_PX : xy.y;
            tex.add(name, 0, x, y, w, h);
        }
        return { key: tex.key, frame: name };
    }

    /** Side of the frame that ends up at the bottom of the screen, for a tile's rotation and flips. */
    function capBand(tile) {
        const quarter = ((Math.round((tile.rotation || 0) / (Math.PI / 2)) % 4) + 4) % 4;
        if (quarter === 0) return tile.flipY ? 't' : 'b';
        if (quarter === 1) return tile.flipX ? 'l' : 'r';
        if (quarter === 2) return tile.flipY ? 'b' : 't';
        return tile.flipX ? 'r' : 'l';
    }

    function northDoorXs(roomId) {
        const provider = getDoorways();
        if (!provider) return [];
        try { return (provider(roomId) || []).filter(d => d && d.direction === 'north' && Number.isFinite(d.x)).map(d => d.x); }
        catch (e) { return []; }
    }

    /** One opaque cropped image per shown row-1 face tile, outside the doorways. Made once per fade. */
    function buildCaps(roomId, state) {
        state.caps = [];
        const doorXs = northDoorXs(roomId);
        for (const cell of state.cells) {
            const { face, layer } = cell;
            if (!layer || face.y !== BACK_WALL_ROWS - 1) continue;
            const scene = layer.scene;
            if (!scene?.add || typeof scene.add.image !== 'function') continue;
            try {
                const left = layer.x + face.x * TILE, cx = left + TILE / 2;
                if (doorXs.some(x => Math.abs(cx - x) < DOOR_HALF_WIDTH)) continue;
                const f = capFrame(face, layer, capBand(face));
                if (!f) continue;
                const img = scene.add.image(cx, layer.y + (face.y + 1) * TILE - WALL_CAP_PX / 2, f.key, f.frame);
                img.setDepth((layer.depth ?? 0) + 0.01);
                if (face.rotation) img.setRotation(face.rotation);
                if (face.flipX) img.setFlipX(true);
                if (face.flipY) img.setFlipY(true);
                state.caps.push({ img, layer });
            } catch (e) { /* no cap for this cell */ }
        }
    }

    /** Follow the layer: a room still hidden (or being revealed) must not show its cap early. */
    function syncCaps(state) {
        for (const { img, layer } of state.caps) {
            const vis = layer.visible !== false, a = layer.alpha ?? 1;
            if (img.visible !== vis) img.setVisible(vis);
            if (img.alpha !== a) img.setAlpha(a);
        }
    }

    function destroyCaps(state) {
        if (!state.caps) return;
        for (const { img } of state.caps) { try { img.destroy(); } catch (e) { /* scene gone */ } }
        state.caps = null;
    }

    function buildCells(roomId, room, state) {
        const layers = Object.values(room.layers || {}).filter(l => l && typeof l.getTileAt === 'function')
            .sort((a, b) => (b.depth ?? 0) - (a.depth ?? 0));
        const cols = room.map?.width ?? Math.round((room.map?.widthInPixels ?? 0) / TILE);
        const cells = [];
        let hiddenCount = 0;
        for (let r = 0; r < BACK_WALL_ROWS; r++) {
            for (let c = 0; c < cols; c++) {
                let face = null, faceLayer = null; const hidden = [];
                for (const layer of layers) {
                    let tile = null;
                    try { tile = layer.getTileAt(c, r); } catch (e) { tile = null; }
                    if (!tile || tile.index < 0) continue;
                    if (!face) { face = tile; faceLayer = layer; } else hidden.push(tile);
                }
                if (face) { cells.push({ face, hidden, layer: faceLayer }); hiddenCount += hidden.length; }
            }
        }
        for (const cell of cells) for (const t of cell.hidden) t.visible = false;
        state.cells = cells;
        state.hiddenCount = hiddenCount;
        buildCaps(roomId, state);
    }

    function restoreTiles(state) {
        destroyCaps(state);
        if (!state.cells) return;
        for (const cell of state.cells) {
            try { cell.face.alpha = 1; for (const t of cell.hidden) t.visible = true; } catch (e) { /* tile gone */ }
        }
        state.cells = null;
        state.hiddenCount = 0;
    }

    // ---- sprites (§4, §6, §7) ----
    function release(sprite, rec) {
        try {
            if (sprite.scene && Math.abs(sprite.alpha - rec.applied) <= EPS) sprite.setAlpha(rec.base);
        } catch (e) { /* never break a frame */ }
        try { delete sprite.behindWallK; } catch (e) { /* frozen */ }
        records.delete(sprite);
    }

    function releaseRoom(roomId) {
        for (const [sprite, rec] of [...records]) if (rec.roomId === roomId) release(sprite, rec);
    }

    function usable(sprite, player) {
        return !!sprite && !!sprite.scene && sprite.active !== false && !!sprite.visible
            && !sprite._isNPC && !sprite._npcCarried && !sprite.doorProperties && sprite !== player;
    }

    /** Does another loaded room also list this sprite and claim it by roomId? Then that room owns it. */
    function ownedElsewhere(sprite, S, rooms) {
        const R = sprite.roomId;
        if (!R || R === S || !rooms[R]) return false;
        return Object.values(rooms[R].objects || {}).includes(sprite);
    }

    function onTable(member, table, tr) {
        const mr = drawnRect(member);
        if (!sameValues(mr)) return false;
        if (mr.left < tr.right && mr.right > tr.left && mr.top < tr.bottom && mr.bottom > tr.top) return true;
        return mr.right > tr.left && mr.left < tr.right && mr.bottom <= tr.top && mr.bottom >= tr.top - TABLE_BACK_EDGE_PX;
    }

    function candidates(S, room, rooms, player, taken) {
        const strip = backWallStrip(room);
        const list = new Set();
        if (!strip) return list;
        const objs = Object.values(room.objects || {});
        const owned = new Set(objs);
        const add = (sprite) => { if (!taken.has(sprite)) list.add(sprite); };
        const addWithCompanions = (sprite) => {
            add(sprite);
            if (sprite._fadeCompanions) {
                for (const c of sprite._fadeCompanions) {
                    if (c && c.scene && c.active !== false && c.visible) add(c);
                }
            }
        };
        const primaries = [];
        for (const sprite of objs) {
            if (!usable(sprite, player)) continue;
            if (sprite.roomId && sprite.roomId !== S && ownedElsewhere(sprite, S, rooms)) continue;
            const r = drawnRect(sprite);
            if (sameValues(r) && rectReachesStrip(r, strip)) primaries.push(sprite);
        }
        for (const sprite of primaries) {
            addWithCompanions(sprite);
            if (sprite._tableItems instanceof Set) {
                const tr = drawnRect(sprite);
                for (const m of sprite._tableItems) {
                    if (!owned.has(m) || !usable(m, player)) continue;
                    if (ownedElsewhere(m, S, rooms)) continue;
                    if (onTable(m, sprite, tr)) addWithCompanions(m);
                }
            }
        }
        return list;
    }

    function spritePass(S, room, rooms, k, player, taken) {
        const list = candidates(S, room, rooms, player, taken);
        for (const sprite of list) {
            taken.add(sprite);
            let rec = records.get(sprite);
            if (!rec || Math.abs(sprite.alpha - rec.applied) > EPS) {
                rec = rec || { base: 1, applied: 1, roomId: S };
                rec.base = sprite.alpha;
                rec.roomId = S;
                records.set(sprite, rec);
            }
            try {
                sprite.setAlpha(rec.base * k);
                rec.applied = sprite.alpha;
                sprite.behindWallK = k;
            } catch (e) { records.delete(sprite); }
        }
        for (const [sprite, rec] of [...records]) {
            if (rec.roomId === S && !list.has(sprite)) release(sprite, rec);
        }
    }

    function dropState(id, touch = true) {
        const state = states.get(id);
        if (touch) { releaseRoom(id); if (state) restoreTiles(state); }
        states.delete(id);
    }

    // ---- per frame ----
    function update(now) {
        if (!enabled) return;
        const rooms = getRooms();
        const player = env.player && env.player();
        let dt = 0;
        if (lastNow !== null && Number.isFinite(now) && now > lastNow) dt = Math.min(MAX_DT, now - lastNow);
        if (Number.isFinite(now)) lastNow = now;

        const behind = new Set();
        const b = player && player.body;
        if (b && Number.isFinite(b.x) && Number.isFinite(b.y)) {
            const w = b.width ?? 0, h = b.height ?? 0;
            for (const id of roomsBehindWallAt({ left: b.x, right: b.x + w, feetY: b.y + h }, rooms, { doorways: getDoorways() })) {
                behind.add(id);
            }
        }
        for (const id of behind) if (!states.has(id)) states.set(id, { k: 1, target: 1, cells: null, caps: null, room: null, hiddenCount: 0 });

        const reduced = !!(env.reducedMotion && env.reducedMotion());
        const taken = new Set();
        for (const [id, state] of [...states]) {
            const room = rooms[id];
            if (!room) { destroyCaps(state); states.delete(id); continue; } // rooms replaced: nothing stale to touch
            state.target = behind.has(id) ? FADE_ALPHA : 1;
            const before = state.k;
            if (!Number.isFinite(state.k)) {
                dropState(id);
                continue;
            }
            if (reduced) state.k = state.target;
            else if (state.k > state.target) state.k = Math.max(state.target, state.k - 0.5 * dt / FADE_OUT_MS);
            else if (state.k < state.target) state.k = Math.min(state.target, state.k + 0.5 * dt / FADE_IN_MS);
            if (!Number.isFinite(state.k)) { dropState(id); continue; }

            if (state.k >= 1 && state.target === 1) { dropState(id); continue; }

            if (state.room && state.room !== room) { // the room object was replaced: its tiles are gone with it
                destroyCaps(state);
                states.delete(id);
                continue;
            }
            state.room = room;
            if (!state.cells) buildCells(id, room, state);
            if (state.k !== before || state.justBuilt !== false) {
                for (const cell of state.cells) cell.face.alpha = state.k;
            }
            state.justBuilt = false;
            if (state.caps) syncCaps(state);
            spritePass(id, room, rooms, state.k, player, taken);
        }
    }

    function lightWeights() {
        weights.length = 0;
        if (!enabled || states.size === 0) return weights;
        const rooms = getRooms();
        for (const [id, state] of states) {
            if (!Number.isFinite(state.k)) continue;
            const weight = clamp01((1 - state.k) / (1 - FADE_ALPHA));
            if (!(weight > 0)) continue;
            let e = weightEntries.get(id);
            if (!e) { e = { roomId: id, weight: 0, gaps: [] }; weightEntries.set(id, e); }
            e.weight = weight;
            e.gaps.length = 0;
            for (const d of openNorthDoorways(rooms, id, getDoorways())) e.gaps.push(d.x);
            weights.push(e);
        }
        return weights;
    }

    function debugState() {
        const out = { enabled, rooms: {} };
        for (const [id, state] of states) {
            let n = 0;
            for (const rec of records.values()) if (rec.roomId === id) n++;
            out.rooms[id] = {
                k: state.k, target: state.target,
                weight: Number.isFinite(state.k) ? clamp01((1 - state.k) / (1 - FADE_ALPHA)) : 0,
                records: n, hiddenTiles: state.hiddenCount
            };
        }
        return out;
    }

    function setEnabled(on) {
        if (on === enabled) return;
        if (!on) {
            for (const [sprite, rec] of [...records]) release(sprite, rec);
            for (const state of states.values()) { try { restoreTiles(state); } catch (e) { /* room gone */ } }
            states.clear();
            records.clear();
        }
        enabled = !!on;
        lastNow = null;
    }

    /** Scene shutdown: forget everything. Only the cap images are destroyed; no tile or sprite is touched. */
    function clear() {
        for (const state of states.values()) destroyCaps(state);
        records.clear();
        states.clear();
        lastNow = null;
    }

    /** Test hook: put a state's k at an arbitrary value (a NaN must snap to 1 and release). */
    function _forceK(id, k) { const s = states.get(id); if (s) s.k = k; }

    return { update, debugState, setEnabled, clear, lightWeights, _forceK };
}

function urlOrStorageOff() {
    try {
        const v = new URLSearchParams(window.location.search).get('behindWallFade');
        if (v === 'off' || v === '0') return true;
    } catch (e) { /* no location */ }
    try { if (window.localStorage.getItem('breakEscapeBehindWallFade') === 'off') return true; } catch (e) { /* no storage */ }
    return false;
}

function prefersReducedMotion() {
    try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; } catch (e) { return false; }
}

/** Build the controller with window getters and publish it as window.behindWallFade. */
export function installBehindWallFade(scene) {
    const fade = createBehindWallFade({
        enabled: !urlOrStorageOff(),
        rooms: () => window.rooms,
        player: () => window.player,
        reducedMotion: prefersReducedMotion
    });
    window.behindWallFade = fade;
    try { scene.events.once('shutdown', fade.clear); } catch (e) { /* no events */ }
    return fade;
}
