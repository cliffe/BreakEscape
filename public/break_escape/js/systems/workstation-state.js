/**
 * Workstation screen state: is an unattended workstation's screen locked or left open?
 *
 * A workstation is a scenario object with `workstation: true`, or with `locksScreenOnLeave` or
 * `lockChance` set. Its owner is `screenOwner` (an NPC id), else the NPC whose `needsHome` is
 * the object's id. Config on the object:
 *
 *   locksScreenOnLeave  true | false (default true): the screen locks when the owner leaves
 *   lockChance          0..1: overrides locksScreenOnLeave. Rolled on each leave from the needs
 *                       system's seeded per-NPC RNG (NPCNeedsSystem.roll), so a fixed seed gives
 *                       the same locked/open sequence every play
 *
 * Driven by the needs system's `npc_left_post:<ownerId>` and `npc_returned_post:<ownerId>`:
 *
 *   owner leaves    -> ownerAway = true, screenLocked = (config or roll)
 *   owner returns   -> ownerAway = false, screenLocked = false (occupied: nobody can sit down)
 *
 * State lives on `sprite.scenarioData.screenLocked` and is mirrored to globals so text variants
 * can key on it (their conditions read globals only):
 *
 *   <objId>_screen_locked   bool    for textVariants / observationVariants / revealOnGlobal
 *   <objId>_owner_away      bool
 *
 * Player interaction (interactions.js calls window.workstationState.onInteract):
 *
 *   owner away, screen open   -> emits `workstation_accessed:<objId>` and sets the global
 *                                `<objId>_accessed` = true. WHAT that access yields is the
 *                                scenario's: map `workstation_accessed:<objId>` to something.
 *   owner away, screen locked -> emits `workstation_locked_attempt:<objId>`; the on-object hint
 *                                is a textVariants/observationVariants entry on
 *                                `globalVars.<objId>_screen_locked`
 *   owner present             -> nothing
 *
 * Lock habits and auto-lock (OFFICE_LIFE_PLAN 12.2, slice 16):
 *
 *   NPC `screenHabit: { lockChance, lockIfAwayOverSeconds }`: the person's habit, used only when
 *     the object has neither lockChance nor locksScreenOnLeave (the object wins). A trip expected
 *     (npc_left_post expectedAwayMs) to last at most lockIfAwayOverSeconds stays open; a longer one
 *     (or one with no estimate) rolls lockChance (implied 1 when only the threshold is set), salt
 *     `habit:<objectId>:<leaves>`, so the object's `screen:` sequence never shifts.
 *   Object `autoLockSeconds`: the machine's idle lock. The clock starts at the leave, restarts on
 *     workstation_accessed and while a minigame is open on the object, runs on the needs clock
 *     (tick(nowMs), called after every needs tick) and locks an open screen once.
 *
 *   workstation_screen_changed:<objId> { objectId, ownerId, locked, how } on every change of the
 *   locked state: how "leave" | "auto" | "return", or "late" for a station whose state is first
 *   decided when the player clicks it after its owner left (no cue plays for "late").
 *
 * Generic: this module knows nothing of what a workstation holds. State is not saved across a
 * reload (the needs system restarts with the NPCs at their posts), so it resets to "owner
 * present, screen open", and install() writes both globals false for every workstation so a
 * save taken during an absence does not keep the "away" or "locked" text (stations in rooms not
loaded yet included, found by name: every saved `<id>_owner_away` / `<id>_screen_locked` pair).
Objects are found on demand (live room sprites first, then the
 * scenario), because rooms and their objects load lazily.
 */

const win = () => (typeof window !== 'undefined' ? window : {});

/** Whether an object's config makes it a workstation. */
export function isWorkstation(data) {
    return !!data && typeof data === 'object' && !!data.id &&
        (data.workstation === true || data.locksScreenOnLeave !== undefined || data.lockChance !== undefined);
}

/** The NPC id that owns a workstation: explicit screenOwner, else the NPC with needsHome === id. */
export function ownerOf(data, npcs) {
    if (typeof data.screenOwner === 'string' && data.screenOwner) return data.screenOwner;
    for (const npc of npcs || []) {
        if (npc?.needsHome === data.id) return npc.id;
    }
    return null;
}

/** The owner's screen habit, or null. */
export function habitOf(ownerId, npcs) {
    const npc = (npcs || []).find(n => n?.id === ownerId);
    const h = npc?.screenHabit;
    return h && typeof h === 'object' ? h : null;
}

/**
 * Decide whether the screen locks on this leave. A lockChance wins over locksScreenOnLeave and
 * is resolved through `roll(npcId, salt)` (NPCNeedsSystem.roll, seeded); without a roller it
 * falls back to the plain config so the mechanic still works in a stub world. With neither
 * field on the object, the owner's `habit` (screenHabit) decides; `expectedAwayMs` is the
 * leave's estimate (null counts as a long trip). With no habit either, the screen locks.
 */
export function decideLocked(data, ownerId, leaveCount, roll, habit = null, expectedAwayMs = null) {
    if (typeof data.lockChance === 'number' && Number.isFinite(data.lockChance)) {
        const chance = Math.max(0, Math.min(1, data.lockChance));
        if (chance <= 0) return false;
        if (chance >= 1) return true;
        if (typeof roll !== 'function') return data.locksScreenOnLeave !== false;
        return roll(ownerId, `screen:${data.id}:${leaveCount}`) < chance;
    }
    if (data.locksScreenOnLeave !== undefined || !habit) return data.locksScreenOnLeave !== false;
    const over = Number(habit.lockIfAwayOverSeconds);
    const hasOver = habit.lockIfAwayOverSeconds !== undefined && Number.isFinite(over);
    if (hasOver && typeof expectedAwayMs === 'number' && expectedAwayMs <= over * 1000) return false;
    const raw = habit.lockChance;
    if (typeof raw !== 'number' || !Number.isFinite(raw)) return true;   // threshold alone, or nothing: locks
    const chance = Math.max(0, Math.min(1, raw));
    if (chance <= 0) return false;
    if (chance >= 1) return true;
    if (typeof roll !== 'function') return true;
    return roll(ownerId, `habit:${data.id}:${leaveCount}`) < chance;
}

/**
 * Is an open minigame's params about this object? The npc_caught_at_post test (an object param
 * whose scenarioData.id or objectId matches: lockable, sprite, containerItem), plus the examine
 * view's string itemId / objectId, so looking at a screen also keeps it awake.
 */
export function minigameOnObject(params, objectId) {
    if (!params || !objectId) return false;
    if (params.itemId === objectId || params.objectId === objectId) return true;
    return Object.values(params).some(v =>
        v && typeof v === 'object' && (v.scenarioData?.id === objectId || v.objectId === objectId));
}

/** The object's auto-lock delay in ms, or null. */
export function autoLockMs(data) {
    const s = Number(data?.autoLockSeconds);
    return data?.autoLockSeconds !== undefined && Number.isFinite(s) && s > 0 ? s * 1000 : null;
}

export class WorkstationState {
    /**
     * @param {Object} env - { objects() -> scenarioData[], npcs() -> npc[], on(pattern, cb),
     *                         emit(name, data), setGlobal(k, v), roll(npcId, salt),
     *                         clock() -> needs-clock ms, inMinigame(objectId) -> bool }
     */
    constructor(env) {
        this.env = env;
        this.away = new Map(); // ownerId -> { away, leaves, leftAt, expectedAwayMs }
        this.idle = new Map(); // objectId -> needs-clock ms the idle clock started (open, owner away)
    }

    _now() { return typeof this.env.clock === 'function' ? (Number(this.env.clock()) || 0) : 0; }

    _changed(data, ownerId, locked, how) {
        this.env.emit(`workstation_screen_changed:${data.id}`, { objectId: data.id, ownerId, locked, how });
    }

    install() {
        this.env.on('npc_left_post:*', (d) => this.onLeft(d?.npcId, d));
        this.env.on('npc_returned_post:*', (d) => this.onReturned(d?.npcId));
        this.resetGlobals();
        return this;
    }

    /**
     * Every workstation starts attended and open: after a reload the NPCs are back at their posts
     * and the away map is empty, but saved globals may still say "away"/"locked" from the save.
     */
    resetGlobals() {
        const seen = new Set();
        for (const data of this.env.objects()) {
            if (!isWorkstation(data) || seen.has(data.id)) continue;
            seen.add(data.id);
            this._publish(data);   // the away map is empty here: both globals false
        }
        // Workstations in rooms not loaded yet: the client has no objects for them (the bootstrap
        // scenario strips room contents), but their globals came back with the save. _publish
        // always writes the pair, so a prefix with both <id>_owner_away and <id>_screen_locked
        // is a workstation's; reset it by name.
        const g = typeof this.env.globals === 'function' ? (this.env.globals() || {}) : {};
        for (const key of Object.keys(g)) {
            const m = /^(.+)_owner_away$/.exec(key);
            if (!m || seen.has(m[1]) || !(`${m[1]}_screen_locked` in g)) continue;
            seen.add(m[1]);
            this.env.setGlobal(`${m[1]}_screen_locked`, false);
            this.env.setGlobal(`${m[1]}_owner_away`, false);
        }
    }

    _stationsOf(npcId) {
        const npcs = this.env.npcs();
        const out = [];
        const seen = new Set();
        for (const data of this.env.objects()) {
            if (!isWorkstation(data) || seen.has(data.id)) continue;
            seen.add(data.id);
            if (ownerOf(data, npcs) === npcId) out.push(data);
        }
        return out;
    }

    _find(objectId) {
        const data = this.env.objects().find(d => d?.id === objectId);
        return isWorkstation(data) ? data : null;
    }

    _publish(data) {
        this.env.setGlobal(`${data.id}_screen_locked`, !!data.screenLocked);
        const owner = ownerOf(data, this.env.npcs());
        this.env.setGlobal(`${data.id}_owner_away`, !!this.away.get(owner)?.away);
    }

    onLeft(npcId, payload = {}) {
        if (!npcId) return;
        const rec = this.away.get(npcId) || { away: false, leaves: 0 };
        rec.away = true;
        rec.leaves += 1;
        rec.leftAt = this._now();
        const est = payload?.expectedAwayMs;
        rec.expectedAwayMs = typeof est === 'number' && Number.isFinite(est) ? est : null;
        this.away.set(npcId, rec);
        const habit = habitOf(npcId, this.env.npcs());
        for (const data of this._stationsOf(npcId)) {
            const was = !!data.screenLocked;
            data.screenLocked = decideLocked(data, npcId, rec.leaves, this.env.roll, habit, rec.expectedAwayMs);
            if (data.screenLocked) this.idle.delete(data.id); else this.idle.set(data.id, rec.leftAt);
            this._publish(data);
            this.env.emit(`workstation_owner_left:${data.id}`, { objectId: data.id, ownerId: npcId, screenLocked: data.screenLocked });
            if (data.screenLocked !== was) this._changed(data, npcId, data.screenLocked, 'leave');
        }
    }

    onReturned(npcId) {
        if (!npcId) return;
        const rec = this.away.get(npcId) || { away: false, leaves: 0 };
        rec.away = false;
        this.away.set(npcId, rec);
        for (const data of this._stationsOf(npcId)) {
            const was = !!data.screenLocked;
            data.screenLocked = false;
            this.idle.delete(data.id);
            this._publish(data);
            this.env.emit(`workstation_owner_returned:${data.id}`, { objectId: data.id, ownerId: npcId });
            if (was) this._changed(data, npcId, false, 'return');
        }
    }

    /**
     * After every needs tick (needs-clock ms): auto-lock. An open station whose owner is away
     * locks once its idle clock passes the object's autoLockSeconds; a minigame open on it keeps
     * restarting the clock, so it never locks under a player using it.
     */
    tick(nowMs = this._now()) {
        if (!this.idle.size) return;
        for (const [objectId, since] of [...this.idle]) {
            const data = this._find(objectId);
            const ms = autoLockMs(data);
            if (!data || ms === null || data.screenLocked !== false) { this.idle.delete(objectId); continue; }
            const ownerId = ownerOf(data, this.env.npcs());
            if (!this.away.get(ownerId)?.away) { this.idle.delete(objectId); continue; }
            if (typeof this.env.inMinigame === 'function' && this.env.inMinigame(objectId)) { this.idle.set(objectId, nowMs); continue; }
            if (nowMs - since < ms) continue;
            this.idle.delete(objectId);
            data.screenLocked = true;
            this._publish(data);
            this._changed(data, ownerId, true, 'auto');
        }
    }

    /** The player interacted with an object. Returns 'accessed' | 'locked' | 'attended' | null. */
    onInteract(objectId) {
        const data = this._find(objectId);
        if (!data) return null;
        const ownerId = ownerOf(data, this.env.npcs());
        const rec = this.away.get(ownerId);
        if (!rec?.away) return 'attended';
        // A station discovered after its owner left (room loaded late) takes the state now, through
        // the habit with the leave's estimate; its idle clock counts from the leave. No cue ("late").
        if (data.screenLocked === undefined) {
            const habit = habitOf(ownerId, this.env.npcs());
            let locked = decideLocked(data, ownerId, rec.leaves, this.env.roll, habit, rec.expectedAwayMs ?? null);
            const ms = autoLockMs(data);
            if (!locked && ms !== null && this._now() - (rec.leftAt ?? this._now()) >= ms) locked = true;
            data.screenLocked = locked;   // globals as before: not republished here
            if (locked) this._changed(data, ownerId, true, 'late');
        }
        if (data.screenLocked) {
            this.env.emit(`workstation_locked_attempt:${objectId}`, { objectId, ownerId });
            return 'locked';
        }
        this.env.setGlobal(`${objectId}_accessed`, true);
        if (autoLockMs(data) !== null) this.idle.set(objectId, this._now());   // activity restarts the idle clock
        this.env.emit(`workstation_accessed:${objectId}`, { objectId, ownerId });
        return 'accessed';
    }
}

/** Build and install the live instance from the running engine. Idempotent. */
export function installWorkstationState() {
    const w = win();
    if (w.workstationState) return w.workstationState;
    const objects = () => {
        const out = [];
        for (const room of Object.values(w.rooms || {})) {
            for (const [key, sp] of Object.entries(room?.objects || {})) {
                if (sp?.scenarioData) out.push(sp.scenarioData);
            }
        }
        for (const room of Object.values(w.gameScenario?.rooms || {})) {
            for (const o of room?.objects || []) if (o && !out.some(d => d.id === o.id)) out.push(o);
        }
        return out;
    };
    const npcs = () => {
        const mgr = w.npcManager;
        const live = mgr?.npcs ? [...mgr.npcs.values()] : [];
        if (live.length) return live;
        const out = [];
        for (const room of Object.values(w.gameScenario?.rooms || {})) for (const n of room?.npcs || []) out.push(n);
        return out;
    };
    const env = {
        objects, npcs,
        globals: () => w.gameState?.globalVariables || {},
        on: (p, cb) => w.eventDispatcher?.on(p, cb),
        emit: (n, d) => w.eventDispatcher?.emit(n, d),
        setGlobal: (k, v) => {
            const g = w.gameState?.globalVariables;
            if (!g || g[k] === v) return;
            const old = g[k];
            g[k] = v;
            w.eventDispatcher?.emit(`global_variable_changed:${k}`, { name: k, value: v, oldValue: old });
        },
        roll: (npcId, salt) => (w.npcNeedsSystem ? w.npcNeedsSystem.roll(npcId, salt) : 0.5),
        clock: () => w.npcNeedsSystem?.clockMs ?? 0,
        inMinigame: (objectId) => minigameOnObject(w.MinigameFramework?.currentMinigame?.params, objectId)
    };
    w.workstationState = new WorkstationState(env).install();
    return w.workstationState;
}
