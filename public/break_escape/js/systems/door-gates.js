/**
 * GATE DOORS
 * ==========
 *
 * A gate door opens for listed NPCs as they near it, holds open for a while (the
 * tailgate window), then shuts and relocks. Opt-in per door in the scenario, on the
 * door entry that leads INTO the locked room (its connectedRoom is the secured room):
 *
 *   "doors": [{ "connectedRoom": "vault", "direction": "north",
 *               "gate": { "openFor": ["guard"], "openRadius": 56, "holdMs": 2500,
 *                         "playerMayPassIf": "disguised" } }]
 *
 * `noHold` (written by the server's loader from the guards' holdsDoors habit, slice 9.1
 * step 5; never with playerMayPassIf) lists the careful guards: a gate is careful while
 * every guard that counts is in it (those it opened for, lastGuards, while open; those
 * near, while shut). A careful gate bars the player as a false playerMayPassIf does.
 *
 * North and south doors only. register() declines a gate on an east or west door with
 * one console warning, and the door stays an ordinary locked door (a side doorway is two
 * sprites a tile apart, so the far one would never join the gate). The validator warns.
 *
 * - Opens when any `openFor` NPC's centre is within `openRadius` of the door centre.
 * - Stays open while one is, and for `holdMs` after the last one leaves.
 * - The body rule (blocksPlayer): a gate's door bodies block the player while it is
 *   shut, and while it is open but not open to him (openToPlayer) and he is outside the
 *   secured room. One writer, _applyBodies(), sets every body of the doorway; it never
 *   switches a body on under the player (the overlap exception): it waits until he has
 *   stepped off. So a guard holding the door does not hold it for a barred player: he
 *   is stopped at the strip, as at a shut door. The animation and the path grid follow
 *   `open` alone, so the guard sees and walks an open door.
 * - Never closes on a player crossing a doorway the gate lets him through
 *   (playerHoldsDoorway: he overlaps the door's body, +4px, and that body is off), nor
 *   while an `openFor` NPC stands in the doorway, nor (after holdMs) while an `openFor`
 *   NPC's remaining path still crosses the doorway. A barred player pressing on a solid
 *   body does not hold it open.
 * - When the gate opens, each `openFor` NPC is told (gateOpened), so one waiting on
 *   a path through it asks again at once. A routed guard who has been moved away
 *   from the door (pushed by the player, or ending a leg out of reach) walks back
 *   to it: npc-behavior.js asks approachPoint() when a route leg is unreachable.
 * - The barred rule (_playerBarred, computed once per gate per tick and read by both
 *   branches of update()): the room test comes first, so a player inside the secured
 *   room is never barred. Outside, `playerMayPassIf` names a global; while it is false,
 *   a player within `openRadius` keeps the shut gate shut, guard or no guard, and shuts
 *   the open gate as soon as nobody holds the doorway.
 * - A guard held at the shut gate (barred player or force-shut) for
 *   GUARD_TURN_BACK_MS while his route wants him across turns back: door-gates calls
 *   his behaviour's turnBackFromGate(), he resumes his route on his own side and
 *   tries again next cycle. Event door_gate_guard_turned_back { ..., npcId }.
 * - A bare player click never opens a gate from outside: doors.js handleDoorInteraction
 *   routes a gate click here and emits door_gate_denied. This holds regardless of the
 *   underlying room's server lock state (an NPC route may have server-unlocked the
 *   room only so its cross-room path could load; that must not grant the player
 *   passage): the gate is a client-side access control in its own right. Walking
 *   into an open gate that bars him is answered the same way (the bump, doors.js),
 *   at most once every BUMP_INTERVAL_MS.
 * - Leaving: a player inside the secured room is never blocked by an open gate and
 *   never keeps it shut. His click on a shut gate opens it for one holdMs window
 *   (exitOpen, door_gate_exit_opened); on an open gate it does nothing (he walks out).
 *   Neither asks for a credential, refuses, or emits the player-open event.
 * - Clone-as-entry: a player outside who presents a credential satisfying the locked
 *   room's `requires` (doors.js checks it, reusing the rfid clone path) calls
 *   playerOpen(), which opens the gate for one holdMs window independent of
 *   `playerMayPassIf` and emits door_gate_player_opened. Each gate learns its
 *   `requires` from the door's doorProperties at register time (see register()).
 *
 * Open and close only toggle the door bodies and the pathfinding grid; they never go
 * through doors.js openDoor (which destroys the sprite) and never reload a room. Both
 * rooms create a sprite for one doorway, so sprites are grouped by position and
 * toggled together; the far room's sprite joins whichever loads first (pending).
 * Events: door_gate_opened / door_gate_closed / door_gate_denied, each with
 * { roomId, connectedRoom, direction }.
 *
 * Sound: a gate whose door has an RFID lock plays the door release (`rfid_unlock`, the
 * same sound as any RFID lock) each time it opens, whoever it opens for, and when a
 * clone is presented at a gate that is already open. Heard only from the doorway's two
 * rooms, at gateSoundVolume of the player's distance. `"sound": "<key>"` in the gate
 * config plays another key; `"sound": false` silences it. Nothing sounds on close.
 *
 * A gate keeps a player out of a room; it does not keep a secret. The room's data is in
 * the browser once a guard's route has loaded it.
 */

export const DEFAULT_GATE_RADIUS = 56;
export const DEFAULT_GATE_HOLD_MS = 2500;
// A gate opens for an openFor guard the moment he nears, UNLESS the player is
// barred there (undisguised) or it was just force-shut: the anti-tailgate rule,
// which has no guard override (staff don't badge through with a stranger at their
// shoulder). A routed guard who wants to cross but has been held at the shut gate
// this long turns back instead: his behaviour (NPCBehavior.turnBackFromGate)
// skips the leg and carries on with his route, so his patrol never stops and he
// tries the door again on his next cycle. See NPC_NEEDS_SYSTEM.md 12.3.
export const GUARD_TURN_BACK_MS = 5000;
// The bump (doors.js): walking into an open gate that bars the player answers like a
// refused click, at most once this often per gate.
export const BUMP_INTERVAL_MS = 4000;
// How far from the door's centre a guard is sent to stand when he has to walk
// back to it (approachPoint): the tile in front of the doorway.
const APPROACH_PX = 48;
// How far inside the radius that spot is. A walker stops within 8 px of the end of
// his path (npc-behavior.js) and the spot is snapped to the centre of an 8 px grid
// cell (up to about 6 px off), so a spot only 8 px inside could leave him standing on
// the radius edge, just out of it, with nothing left to walk (seen at radius 56).
const APPROACH_MARGIN_PX = 16;
const TILE = 32;
const OPPOSITE = { north: 'south', south: 'north', east: 'west', west: 'east' };

function W() { return typeof window !== 'undefined' ? window : {}; }

/** Normalised gate config, or null when the door is not a gate. */
export function normaliseGate(raw) {
    if (!raw || typeof raw !== 'object' || raw.enabled === false) return null;
    const r = Number(raw.openRadius);
    const h = Number(raw.holdMs);
    const openFor = Array.isArray(raw.openFor) ? raw.openFor.filter(s => typeof s === 'string')
        : (typeof raw.openFor === 'string' ? [raw.openFor] : []);
    return {
        openFor,
        openRadius: Number.isFinite(r) && r > 0 ? r : DEFAULT_GATE_RADIUS,
        holdMs: Number.isFinite(h) && h >= 0 ? h : DEFAULT_GATE_HOLD_MS,
        playerMayPassIf: typeof raw.playerMayPassIf === 'string' && raw.playerMayPassIf ? raw.playerMayPassIf : null,
        // The guards who do not hold the door for the player (holdsDoors false)
        noHold: Array.isArray(raw.noHold) ? raw.noHold.filter(s => typeof s === 'string') : [],
        // The open sound: undefined plays the door release when the door has an RFID lock,
        // a string plays that sound key, false silences the gate
        sound: raw.sound === false ? false : (typeof raw.sound === 'string' && raw.sound ? raw.sound : undefined)
    };
}

// The door release a gate plays when it opens (section 2 of
// PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md): full volume near the door, falling linearly to
// silence, so Len's every-15-seconds door is the tailgate cue beside it and quiet across the room.
export const GATE_SOUND_NEAR_PX = 96;
export const GATE_SOUND_FAR_PX = 384;
export const GATE_SOUND_VOLUME = 0.9;

/** Pure: the volume of a gate's open sound for a listener `distancePx` from the door centre. */
export function gateSoundVolume(distancePx) {
    const d = Number(distancePx);
    if (!Number.isFinite(d)) return 0;
    if (d <= GATE_SOUND_NEAR_PX) return GATE_SOUND_VOLUME;
    if (d >= GATE_SOUND_FAR_PX) return 0;
    return GATE_SOUND_VOLUME * (GATE_SOUND_FAR_PX - d) / (GATE_SOUND_FAR_PX - GATE_SOUND_NEAR_PX);
}

/**
 * Pure: the sound key a gate plays on opening, or null. The gate's own `sound` wins (false is
 * silent); otherwise the door release, only for a door with an RFID lock.
 */
export function gateSoundKey(g) {
    const s = g?.cfg?.sound;
    if (s === false) return null;
    if (typeof s === 'string' && s) return s;
    return g?.lockType === 'rfid' ? 'rfid_unlock' : null;
}

/**
 * The door's collision body (doors.js): the 8px strip at the bottom of the N/S door's
 * 1x2-tile sprite. Only this blocks the player, so only overlapping it means
 * "switching it on, or shutting now, would trap him".
 */
function doorBodyRect(g) {
    return { left: g.x - TILE / 2, right: g.x + TILE / 2, top: g.y + TILE - 8, bottom: g.y + TILE };
}

/** The doorway's footprint: the 1x2-tile N/S sprite. */
function doorRect(g) {
    return { left: g.x - TILE / 2, right: g.x + TILE / 2, top: g.y - TILE, bottom: g.y + TILE };
}

function overlaps(a, b, pad = 0) {
    return a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + pad && a.bottom > b.top - pad;
}

function npcSprite(npcId) {
    const w = W();
    const npc = w.npcManager?.npcs?.get?.(npcId) || w.npcManager?.getNPC?.(npcId);
    const s = npc?._sprite || npc?.sprite || w.npcBehaviorManager?.getBehavior?.(npcId)?.sprite;
    return s && !s.destroyed && s.active !== false ? s : null;
}

function centreOf(s) {
    const bc = s.body?.center;
    if (bc && Number.isFinite(bc.x) && Number.isFinite(bc.y)) return { x: bc.x, y: bc.y };
    if (typeof s.getCenter === 'function') { const c = s.getCenter(); return { x: c.x, y: c.y }; }
    return { x: s.x, y: s.y };
}

function playerRect() {
    const p = W().player;
    if (!p) return null;
    const b = p.body;
    if (b && Number.isFinite(b.left)) return { left: b.left, right: b.right, top: b.top, bottom: b.bottom };
    return { left: p.x - 9, right: p.x + 9, top: p.y - 5, bottom: p.y + 5 };
}

function currentPlayerRoom() {
    const w = W();
    return w.currentPlayerRoom || w.lastPlayerRoom || null;
}

function gone(s) {
    return !s || s.destroyed || s.scene === null || s.active === false;
}

export class DoorGates {
    constructor() {
        this.groups = new Map();   // key -> group
        // key -> Set of unconfigured N/S sprites whose doorway has no gate yet (the far
        // room's sprite, created before the configured one). They join when it registers.
        this.pending = new Map();
    }

    reset() { this.groups.clear(); this.pending.clear(); }

    _key(x, y) { return `${Math.round(x / 8)},${Math.round(y / 8)}`; }

    /**
     * Register a door sprite as a gate (doors.js, on creation). `rawGate` may be null
     * for the second room's sprite of a doorway; if the doorway has no gate yet, that
     * sprite waits in `pending` and joins when the configured sprite registers. A gate
     * on an east or west door is declined with a console warning (see the header).
     * @returns {boolean} whether the sprite is a gate now
     */
    register(sprite, rawGate, now = Date.now()) {
        const props = sprite?.doorProperties;
        if (!props) return false;
        const cfg = normaliseGate(rawGate);
        if (props.isSideDoor) {
            if (cfg) {
                console.warn(`door-gates: gate declined on the ${props.direction} door ${props.roomId} -> ${props.connectedRoom}: ` +
                    'gates work on north and south doors only, so this stays an ordinary locked door');
            }
            return false;
        }
        const key = this._key(props.worldX ?? sprite.x, props.worldY ?? sprite.y);
        let g = this.groups.get(key);
        if (!g) {
            if (!cfg) {
                if (!this.pending.has(key)) this.pending.set(key, new Set());
                this.pending.get(key).add(sprite);
                return false;
            }
            g = {
                key, cfg, sprites: new Set(), open: false, lastNpcNear: -Infinity, forcedUntil: 0,
                guardBlockedSince: -1, playerHoldUntil: 0, exitHoldUntil: 0, lastBumpAt: -Infinity,
                // The guards this open period belongs to (noHold): set by open(), added to
                // each tick while open, cleared by close()
                lastGuards: new Set(),
                // A new gate is shut, so its bodies are on
                bodyOff: false,
                requires: props.requires ?? null,
                lockType: props.lockType ?? null,
                x: props.worldX ?? sprite.x, y: props.worldY ?? sprite.y,
                roomId: props.roomId, connectedRoom: props.connectedRoom, direction: props.direction,
                // The room the gate guards: the connectedRoom of the door entry carrying the
                // config (the validator puts it on the entry into the locked room). Fixed here
                // and never read from `locked`, so it means the same after a reload.
                securedRoom: props.connectedRoom
            };
            this.groups.set(key, g);
        } else if (cfg && !g.cfg) {
            g.cfg = cfg;
        }
        const joining = [sprite];
        const waiting = this.pending.get(key);
        if (waiting) {
            this.pending.delete(key);
            for (const s of waiting) if (s !== sprite && !gone(s)) joining.push(s);
        }
        for (const s of joining) this._join(g, s);
        // An adopted sprite registered as no gate, so doors.js marked the doorway walkable
        // for it; a shut gate unmarks it, as close() does
        if (joining.length > 1 && !g.open) {
            const pm = W().pathfindingManager;
            if (pm) {
                pm.unmarkDoor?.(g.x, g.y, g.direction);
                pm.rebuildWorldGrid?.();
            }
        }
        this._applyBodies(g, now);
        return true;
    }

    /** One sprite joins its doorway's gate: the shared fields, the config and the animation. */
    _join(g, sprite) {
        const props = sprite.doorProperties;
        const key = g.key;
        // The locked room's credential (clone-as-entry). Any sprite of the doorway may
        // carry it (the far room's door derives `requires` from the connected room too).
        if (g.requires == null && props.requires != null) g.requires = props.requires;
        if (g.lockType == null && props.lockType != null) g.lockType = props.lockType;
        // Likewise the locked room's lockedHint: only the sprite on the approach side of the
        // locked room carries it, but a click may land on either sprite of the doorway.
        if (!g.lockedHint && typeof props.lockedHint === 'string' && props.lockedHint) g.lockedHint = props.lockedHint;
        // And the locked room's door sign (a sprite's door_sign is the room it leads into),
        // which titles the refusal toast: taken from the sprite that carries the lock
        if (!g.doorSign && props.requires != null && typeof props.door_sign === 'string' && props.door_sign) g.doorSign = props.door_sign;
        g.sprites.add(sprite);
        props.gate = g.cfg;
        props.gateKey = key;
        // A sprite created while its doorway is open (the far room loaded mid-hold)
        if (g.open) this._applySprite(sprite, true);
    }

    _prunePending() {
        for (const [key, set] of this.pending) {
            for (const s of [...set]) if (gone(s)) set.delete(s);
            if (!set.size) this.pending.delete(key);
        }
    }

    isGate(sprite) { return !!sprite?.doorProperties?.gateKey && this.groups.has(sprite.doorProperties.gateKey); }

    /**
     * The gate group whose doorway sits at (x, y), or null. Robust to a door sprite
     * that never registered as a gate (a room reload dropped the `gate` field, or the
     * far room's sprite is still pending): doors.js uses it
     * so a gate click is still caught and denied even when `doorProperties.gate` is
     * absent, keeping player access decoupled from the room's server lock state.
     */
    groupAtPosition(x, y) { return this.groups.get(this._key(x, y)) || null; }

    /** The gate groups for a door named by the room it leads to (or comes from). */
    groupsFor(roomId) {
        const all = [...this.groups.values()];
        const into = all.filter(g => g.connectedRoom === roomId || g.roomId === roomId);
        return into;
    }

    /** State of the gate(s) into `roomId`, for tests and playtests (window.doorGates.state). */
    state(roomId) {
        return this.groupsFor(roomId).map(g => ({
            key: g.key, open: g.open, x: g.x, y: g.y, roomId: g.roomId, connectedRoom: g.connectedRoom,
            direction: g.direction, sprites: g.sprites.size, forcedUntil: g.forcedUntil,
            playerHoldUntil: g.playerHoldUntil || 0, requires: g.requires ?? null,
            securedRoom: g.securedRoom ?? null, exitHoldUntil: g.exitHoldUntil || 0, bodyOff: !!g.bodyOff
        }));
    }

    _prune(g) {
        for (const s of [...g.sprites]) {
            if (gone(s)) g.sprites.delete(s);
        }
    }

    /**
     * The body rule: whether the gate's door bodies should block the player. Shut, they
     * do; open, they do unless the gate is open to him (openToPlayer) or he is inside the
     * secured room. `playerRoom` defaults to the room the game has him in.
     */
    blocksPlayer(g, { playerRoom = currentPlayerRoom(), now = Date.now() } = {}) {
        if (!g.open) return true;
        return !this.openToPlayer(g, now) && playerRoom !== g.securedRoom;
    }

    /**
     * The one writer of a gate's door bodies. Follows blocksPlayer, except that it never
     * switches the bodies on under the player (the overlap exception): that would trap
     * him, or Phaser would push him out, maybe into the secured room. They switch on at
     * the first call after he has stepped off.
     */
    _applyBodies(g, now = Date.now()) {
        const want = this.blocksPlayer(g, { now });
        if (!(want && g.bodyOff && this.playerInDoorway(g))) g.bodyOff = !want;
        for (const s of g.sprites) {
            if (s.body) s.body.enable = !g.bodyOff;
        }
    }

    /** The animation and doorProperties.open; the body is _applyBodies's. */
    _applySprite(sprite, open) {
        const props = sprite.doorProperties;
        if (props) props.open = open;
        try {
            if (open) {
                if (sprite.scene?.anims?.exists?.('door_open')) sprite.play('door_open');
            } else if (sprite.anims && typeof sprite.playReverse === 'function' && sprite.anims.currentAnim) {
                sprite.playReverse(sprite.anims.currentAnim.key);
                sprite.once?.('animationcomplete', () => {
                    if (!props?.open && sprite.scene && sprite.texture?.key !== 'door_32') {
                        sprite.setTexture?.('door_32', 0);
                    }
                });
            } else {
                sprite.setFrame?.(0);
            }
        } catch (e) {
            console.warn('door-gates: door animation failed', e);
        }
    }

    _afterToggle(g, eventName) {
        const w = W();
        w.npcSightOcclusion?.invalidate?.();
        w.eventDispatcher?.emit?.(eventName, {
            roomId: g.roomId, connectedRoom: g.connectedRoom, direction: g.direction
        });
    }

    /**
     * Play the gate's open sound (gateSoundKey) for a player standing in one of the doorway's
     * two rooms, at gateSoundVolume of their distance from the door. Returns
     * `{ key, volume }` when something was played, else null.
     */
    playOpenSound(g) {
        const w = W();
        const key = gateSoundKey(g);
        if (!key) return null;
        const room = w.currentPlayerRoom || w.lastPlayerRoom;
        if (!room || (room !== g.roomId && room !== g.connectedRoom)) return null;
        const p = w.player;
        if (!p) return null;
        const c = centreOf(p);
        const volume = gateSoundVolume(Math.hypot(c.x - g.x, c.y - g.y));
        if (volume <= 0) return null;
        try {
            if (typeof w.playUISound === 'function') w.playUISound('door_release', { key, volume });
            else w.soundManager?.play?.(key, { volume });
        } catch (e) { /* a sound never breaks a door */ }
        g.lastSound = { key, volume, at: Date.now() };
        return { key, volume };
    }

    open(g, now = Date.now(), eventName = 'door_gate_opened') {
        if (g.open) return false;
        this._prune(g);
        g.open = true;
        g.openedAt = now;
        g.guardBlockedSince = -1;
        // Before the body rule below reads it: who this open period belongs to
        g.lastGuards = new Set(this.nearGuardIds(g));
        for (const s of g.sprites) this._applySprite(s, true);
        // The body rule before it returns: solid at once for a player it does not let through
        this._applyBodies(g, now);
        const pm = W().pathfindingManager;
        if (pm) {
            pm.markDoorWalkable?.(g.roomId, g.x, g.y, g.direction);
            pm.markDoorWalkable?.(g.connectedRoom, g.x, g.y, OPPOSITE[g.direction]);
            // Synchronously: the NPC's next path request must see the open doorway
            pm.rebuildWorldGrid?.();
        }
        console.log(`🚪 Gate opened: ${g.roomId} ↔ ${g.connectedRoom}`);
        this.playOpenSound(g);
        // A guard waiting on a path through this door asks again now, not at the end
        // of his retry back-off (by which time the gate may have shut again).
        const bm = W().npcBehaviorManager;
        for (const id of g.cfg?.openFor || []) bm?.getBehavior?.(id)?.gateOpened?.();
        this._afterToggle(g, eventName);
        return true;
    }

    /**
     * Where an `openFor` NPC should walk to get his own shut gate to open: the spot
     * just in front of the doorway, on his side of it. npc-behavior.js asks when a
     * route leg is unreachable. Returns null when no shut gate of his joins one of
     * `roomIds` (when given), or when he is already inside the nearest one's radius
     * (it opens for him without his moving, or he turns back: update()).
     * @param {string} npcId
     * @param {{x:number,y:number}} from - the NPC's feet
     * @param {string[]} [roomIds] - only gates that join one of these rooms
     * @returns {{x:number,y:number,roomId:string,connectedRoom:string}|null}
     */
    approachPoint(npcId, from, roomIds = null) {
        if (!from || !Number.isFinite(from.x) || !Number.isFinite(from.y)) return null;
        let best = null;
        for (const g of this.groups.values()) {
            if (!g.cfg || g.open || !g.cfg.openFor.includes(npcId)) continue;
            if (Array.isArray(roomIds) && roomIds.length &&
                !roomIds.includes(g.roomId) && !roomIds.includes(g.connectedRoom)) continue;
            const d = Math.hypot(from.x - g.x, from.y - g.y);
            if (!best || d < best.d) best = { g, d };
        }
        if (!best) return null;
        const g = best.g;
        const reach = Math.min(APPROACH_PX, Math.max(g.cfg.openRadius - APPROACH_MARGIN_PX, TILE / 2));
        // Inside the radius the gate opens for him where he stands (update()), or he is
        // turned back after GUARD_TURN_BACK_MS: a guard held at his badge reader does not
        // walk up to the door.
        if (best.d <= g.cfg.openRadius) return null;
        const pt = { x: g.x, y: g.y + (from.y >= g.y ? reach : -reach) };
        return { ...pt, roomId: g.roomId, connectedRoom: g.connectedRoom };
    }

    /**
     * Open the gate(s) leading to/from `roomId` for the PLAYER and hold them open for
     * holdMs, independent of `playerMayPassIf`. doors.js calls this when the player
     * presents a credential that satisfies the gate's `requires` (clone-as-entry — the
     * alternative to tailgating). Reuses open()/holdMs/the grid rebuild. Emits
     * door_gate_player_opened (not door_gate_opened, so NPC-proximity mappings such as
     * len_at_door are not triggered by the player's own entry).
     * @returns {boolean} true when at least one gate was opened or held
     */
    playerOpen(roomId, { now = Date.now() } = {}) {
        const groups = this.groupsFor(roomId);
        if (!groups.length) {
            console.warn(`door-gates: playerOpen "${roomId}" is not a gate door`);
            return false;
        }
        let any = false;
        for (const g of groups) {
            this._prune(g);
            if (!g.cfg) continue;
            g.playerHoldUntil = now + Math.max(g.cfg.holdMs, 0);
            if (g.open) {
                // Already open (an NPC is passing): the reader still releases for the clone,
                // and the body is off for him on the click, not a tick later
                this._applyBodies(g, now);
                this.playOpenSound(g);
                this._afterToggle(g, 'door_gate_player_opened');
            } else this.open(g, now, 'door_gate_player_opened');
            any = true;
        }
        return any;
    }

    /**
     * An open gate the player may walk through as things stand: the clone window is
     * running, or the gate has no playerMayPassIf, or that global is set. doors.js
     * asks before refusing a click, so a door that is letting the player in never
     * says "Access denied" (playtest E2). An undisguised player gets the refusal even
     * while the gate is open for a guard, and the door is solid for him (blocksPlayer).
     * exitHoldUntil is not read here: a player who steps out and turns round is outside.
     */
    openToPlayer(g, now = Date.now()) {
        if (!g?.open) return false;
        if (now < (g.playerHoldUntil || 0)) return true;
        const name = g.cfg?.playerMayPassIf;
        if (name) return !!W().gameState?.globalVariables?.[name];
        // A careful guard's open period (noHold) is not open to the player
        return !this.careful(g);
    }

    /**
     * Open one gate for a player leaving the secured room, for one holdMs window
     * (door_gate_exit_opened: not the clone's event, and not door_gate_opened, which
     * scenarios map to a guard at the door). Only the clicked gate, never every gate of
     * the room. update() holds it open until exitHoldUntil.
     */
    exitOpen(g, now = Date.now()) {
        if (!g?.cfg) return false;
        this._prune(g);
        g.exitHoldUntil = now + Math.max(g.cfg.holdMs, 0);
        if (!g.open) this.open(g, now, 'door_gate_exit_opened');
        return true;
    }

    /**
     * What a player's click on a gate door comes to (doors.js handleDoorInteraction,
     * asked once, before the credential test):
     *   'exit'    - he is inside the secured room and the gate is shut: exitOpen() now
     *   'leave'   - he is inside and the gate is open: he walks out; nothing to do
     *   'granted' - he holds a credential the gate takes; it is opened for him now
     *   'pass'    - the gate is open and he may walk through; nothing to say
     *   'denied'  - refuse, with the door's hint
     * Inside answers first, so leaving never presents a credential or refuses. Outside,
     * the credential answers first, so a clone opens (and is credited) even while the
     * gate happens to be open for a guard.
     * @param {object|null} g - the gate group clicked, when known
     * @param {{holdsCredential?: boolean, connectedRoom?: string, playerRoom?: string, now?: number}} click
     */
    clickOutcome(g, { holdsCredential = false, connectedRoom = null, playerRoom = currentPlayerRoom(), now = Date.now() } = {}) {
        if (g && playerRoom && playerRoom === g.securedRoom) {
            if (g.open) return 'leave';
            this.exitOpen(g, now);
            return 'exit';
        }
        if (holdsCredential && this.playerOpen(connectedRoom, { now })) return 'granted';
        return g && this.openToPlayer(g, now) ? 'pass' : 'denied';
    }

    /**
     * The bump (doors.js): whether walking into this open, barring gate should be answered
     * now (the refusal toast and door_gate_denied), at most once every BUMP_INTERVAL_MS.
     */
    bumpDue(g, now = Date.now()) {
        if (!g) return false;
        if (now - (g.lastBumpAt ?? -Infinity) < BUMP_INTERVAL_MS) return false;
        g.lastBumpAt = now;
        return true;
    }

    close(g, now = Date.now()) {
        if (!g.open) return false;
        this._prune(g);
        g.open = false;
        g.lastGuards = new Set();
        for (const s of g.sprites) this._applySprite(s, false);
        this._applyBodies(g, now);
        const pm = W().pathfindingManager;
        if (pm) {
            pm.unmarkDoor?.(g.x, g.y, g.direction);
            pm.rebuildWorldGrid?.();
        }
        console.log(`🚪 Gate closed: ${g.roomId} ↔ ${g.connectedRoom}`);
        this._afterToggle(g, 'door_gate_closed');
        return true;
    }

    /** The player overlaps the door's body (+4px), solid or not. */
    playerInDoorway(g) {
        const pr = playerRect();
        return !!pr && overlaps(pr, doorBodyRect(g), 4);
    }

    /**
     * The player is crossing a doorway the gate lets him through: he overlaps the door's
     * body (+4px) and that body is off (he is permitted, inside, or held by the overlap
     * exception). Shutting now would trap him. A barred player pressed against a solid
     * body does not count.
     */
    playerHoldsDoorway(g) {
        return !!g.bodyOff && this.playerInDoorway(g);
    }

    /** Whether an openFor NPC's remaining path crosses the doorway. */
    npcCrossing(g) {
        const rect = doorRect(g);
        const bm = W().npcBehaviorManager;
        for (const id of g.cfg.openFor) {
            const b = bm?.getBehavior?.(id);
            const path = b?.currentPath;
            if (!Array.isArray(path) || !path.length) continue;
            const from = Math.max(0, (b.pathIndex || 0) - 1);
            for (let i = from; i < path.length; i++) {
                const p = path[i];
                if (p && p.x >= rect.left - 8 && p.x <= rect.right + 8 && p.y >= rect.top - 8 && p.y <= rect.bottom + 8) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * An openFor guard physically in the doorway (his centre inside the door's
     * footprint). Shutting now would wall him into the door, so neither the barred-
     * player close nor closeNow({force}) does it: he finishes the crossing first. A
     * path merely planned through the door does not count, or a barred player could
     * follow a guard who is still walking towards it.
     */
    npcInDoorway(g) {
        const rect = doorRect(g);
        for (const id of g.cfg.openFor) {
            const s = npcSprite(id);
            if (!s || s.visible === false) continue;
            const c = centreOf(s);
            if (c.x >= rect.left && c.x <= rect.right && c.y >= rect.top && c.y <= rect.bottom) return true;
        }
        return false;
    }

    _gateInfo(g) {
        return { roomId: g.roomId, connectedRoom: g.connectedRoom, direction: g.direction, x: g.x, y: g.y };
    }

    /** openFor guards near the shut gate whose route wants to take them across it. */
    _guardsWaiting(g) {
        const bm = W().npcBehaviorManager;
        const info = this._gateInfo(g);
        const ids = [];
        for (const id of g.cfg.openFor) {
            const s = npcSprite(id);
            if (!s || s.visible === false) continue;
            const c = centreOf(s);
            if (Math.hypot(c.x - g.x, c.y - g.y) > g.cfg.openRadius) continue;
            const b = bm?.getBehavior?.(id);
            if (b?.wantsToCrossGate?.(info)) ids.push(id);
        }
        return ids;
    }

    /**
     * The gate is shut against a guard who wants through (a barred player or a recent
     * force-shut). After GUARD_TURN_BACK_MS of that, each waiting guard turns back
     * (door_gate_guard_turned_back) and the timer restarts for his next attempt.
     */
    _holdGuards(g, now) {
        const waiting = this._guardsWaiting(g);
        if (!waiting.length) { g.guardBlockedSince = -1; return; }
        if (g.guardBlockedSince < 0) { g.guardBlockedSince = now; return; }
        if (now - g.guardBlockedSince < GUARD_TURN_BACK_MS) return;
        g.guardBlockedSince = -1;
        const bm = W().npcBehaviorManager;
        const info = this._gateInfo(g);
        for (const id of waiting) {
            if (!bm?.getBehavior?.(id)?.turnBackFromGate?.(info)) continue;
            console.log(`↩️ Gate ${g.roomId} ↔ ${g.connectedRoom} held shut: ${id} turns back`);
            W().eventDispatcher?.emit?.('door_gate_guard_turned_back', {
                roomId: g.roomId, connectedRoom: g.connectedRoom, direction: g.direction, npcId: id
            });
        }
    }

    _npcNear(g) {
        for (const id of g.cfg.openFor) {
            const s = npcSprite(id);
            if (!s || s.visible === false) continue;
            const c = centreOf(s);
            if (Math.hypot(c.x - g.x, c.y - g.y) <= g.cfg.openRadius) return true;
        }
        return false;
    }

    /** The ids of the openFor NPCs within openRadius (_npcNear says only whether there is one). */
    nearGuardIds(g) {
        const ids = [];
        for (const id of g.cfg?.openFor || []) {
            const s = npcSprite(id);
            if (!s || s.visible === false) continue;
            const c = centreOf(s);
            if (Math.hypot(c.x - g.x, c.y - g.y) <= g.cfg.openRadius) ids.push(id);
        }
        return ids;
    }

    /**
     * A careful gate (noHold, slice 9.1 step 5): no playerMayPassIf, a non-empty noHold,
     * and every guard that counts is in it: lastGuards while open, the guards near while
     * shut. One guard who holds doors among them is enough for not careful, and with
     * nobody counting (an exit opening, a clone with no guard near) it is not careful.
     */
    careful(g) {
        const cfg = g?.cfg;
        if (!cfg || cfg.playerMayPassIf || !cfg.noHold?.length) return false;
        const guards = g.open ? [...(g.lastGuards || [])] : this.nearGuardIds(g);
        return guards.length > 0 && guards.every(id => cfg.noHold.includes(id));
    }

    /**
     * Whether the player's presence keeps this gate shut, turns its guard back, and shuts
     * it at once while open. update() asks once per gate per tick and both branches read
     * the answer. The room test is first: a player inside the secured room is never
     * barred. Then only a player within openRadius. Each later clause is one reason the
     * gate does not let him through; add any new reason below the last of them.
     */
    _playerBarred(g) {
        if (currentPlayerRoom() === g.securedRoom) return false;
        const p = W().player;
        if (!p) return false;
        const c = centreOf(p);
        if (Math.hypot(c.x - g.x, c.y - g.y) > g.cfg.openRadius) return false;
        // Undisguised: the gate's playerMayPassIf global is false
        const name = g.cfg.playerMayPassIf;
        if (name && !W().gameState?.globalVariables?.[name]) return true;
        // A careful guard (noHold): she will not open with him at her shoulder
        if (this.careful(g)) return true;
        return false;
    }

    /**
     * Shut the gate(s) into `roomId` now. `force` skips the "an NPC is still crossing"
     * hold, never the doorway hold (playerHoldsDoorway). Keeps it shut for at least
     * holdMs (an NPC standing by would reopen it on the next tick otherwise).
     * @returns {boolean} true when at least one gate is shut afterwards; false if none
     *   is a gate or the player is crossing the doorway
     */
    closeNow(roomId, { force = false, now = Date.now() } = {}) {
        const groups = this.groupsFor(roomId);
        if (!groups.length) {
            console.warn(`door-gates: closeDoor "${roomId}" is not a gate door`);
            return false;
        }
        let any = false;
        for (const g of groups) {
            if (g.open) {
                this._applyBodies(g, now);
                if (this.playerHoldsDoorway(g)) continue;
                if (this.npcInDoorway(g)) continue;   // even forced: never wall the guard in
                if (!force && this.npcCrossing(g)) continue;
                this.close(g, now);
            }
            g.forcedUntil = now + Math.max(g.cfg.holdMs, 3000);
            any = true;
        }
        return any;
    }

    /** Game-loop tick. */
    update(now = Date.now()) {
        this._prunePending();
        for (const g of this.groups.values()) {
            this._prune(g);
            if (!g.sprites.size || !g.cfg) continue;
            const npcNear = this._npcNear(g);
            if (npcNear) g.lastNpcNear = now;
            if (g.open) for (const id of this.nearGuardIds(g)) g.lastGuards.add(id);
            // Once per tick; both branches below read this one value
            const barred = this._playerBarred(g);
            this._applyBodies(g, now);

            if (!g.open) {
                // A barred player close by keeps it shut, even beside the guard.
                // No override: a guard held here long enough turns back instead.
                if (npcNear && !barred && now >= g.forcedUntil) this.open(g, now);
                else if (npcNear) this._holdGuards(g, now);
                else g.guardBlockedSince = -1;
                continue;
            }
            if (this.playerHoldsDoorway(g)) continue;      // never shut on a player crossing
            if (now < (g.playerHoldUntil || 0)) continue;  // clone-as-entry: hold open through the window
            if (now < (g.exitHoldUntil || 0)) continue;    // leaving by a click: likewise
            if (this.npcInDoorway(g)) continue;            // never shut on a guard mid-crossing
            if (barred) { this.close(g, now); continue; }  // barred player: shut at once
            if (npcNear) continue;
            if (now - g.lastNpcNear < g.cfg.holdMs) continue;
            if (this.npcCrossing(g)) continue;
            this.close(g, now);
        }
    }
}

export const doorGates = new DoorGates();

if (typeof window !== 'undefined') {
    window.doorGates = doorGates;
}
