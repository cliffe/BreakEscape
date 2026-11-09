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
 * Events, one per station of the owner:
 *
 *   workstation_owner_left:<objId>      { objectId, ownerId, screenLocked, reason }
 *   workstation_owner_returned:<objId>  { objectId, ownerId, wasLocked }: wasLocked is the
 *                                       screen's state just before the return cleared it, so a
 *                                       listener can tell "came back and typed a password" from
 *                                       "came back to an open screen"
 *
 * `isLocked(objId)` answers "is this screen locked right now?" (owner away and screen locked)
 * without emitting anything; systems/screen-states.js draws the locked look from it.
 *
 * State lives on `sprite.scenarioData.screenLocked` and is mirrored to globals so text variants
 * can key on it (their conditions read globals only):
 *
 *   <objId>_screen_locked   bool    for textVariants / observationVariants / revealOnGlobal
 *   <objId>_owner_away      bool
 *
 * Player interaction (interactions.js calls window.workstationState.onInteract):
 *
 *   owner present             -> 'attended', nothing emitted
 *   owner away, screen open   -> 'accessed': emits `workstation_accessed:<objId>` and sets the
 *                                global `<objId>_accessed` = true. WHAT that access yields is the
 *                                scenario's: map `workstation_accessed:<objId>` to something.
 *   owner away, screen locked -> 'locked': emits `workstation_locked_attempt:<objId>`; the
 *                                on-object hint is a textVariants/observationVariants entry on
 *                                `globalVars.<objId>_screen_locked`
 *   no owner, or an owner not present with no away record -> 'signin', nothing emitted
 *
 * One workstation rule (access model, ACCESS_MODEL_PLAN.md 5.4 and 5.5), for every workstation:
 *   - Presence: the owner is present when the needs system tracks it (getState not null), its
 *     state has atPost and NPCNeedsSystem.isAvailable (sprite there; not knocked out, hostile
 *     or hidden). An owner removed, hidden or hostile at the desk has no away record: 'signin'.
 *   - A knock-out at the desk (`npc_ko:<id>`) counts as leaving, for a tracked owner with no
 *     current away record only; the owner_left event then carries reason 'ko'.
 *   - Every `lockType: "login"` object is a workstation (owned or not).
 *   - Policy (gameScenario.policies[obj.policy || defaultPolicy]): `autoLockMin: 0` locks the
 *     screen in the leave roll itself; `autoLockMin` above 0 records lockAt (needs clock plus
 *     that many game minutes) when the roll leaves the screen open, and at lockAt the screen
 *     locks and `workstation_auto_locked:<objId>` { objectId, ownerId } fires (checked at the
 *     end of every needs tick and before onInteract answers). The owner's return clears it.
 * An env without ownerPresent (unit tests) keeps the older answers: 'attended' unless away.
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
        (data.workstation === true || data.locksScreenOnLeave !== undefined || data.lockChance !== undefined ||
         data.lockType === 'login');
}

/** The NPC id that owns a workstation: explicit screenOwner, else the NPC with needsHome === id. */
export function ownerOf(data, npcs) {
    if (typeof data.screenOwner === 'string' && data.screenOwner) return data.screenOwner;
    for (const npc of npcs || []) {
        if (npc?.needsHome === data.id) return npc.id;
    }
    return null;
}

/**
 * Decide whether the screen locks on this leave. A lockChance wins over locksScreenOnLeave and
 * is resolved through `roll(npcId, salt)` (NPCNeedsSystem.roll, seeded); without a roller it
 * falls back to the plain config so the mechanic still works in a stub world.
 */
export function decideLocked(data, ownerId, leaveCount, roll, policy = null) {
    // A policy's autoLockMin 0 locks the screen in the leave roll itself (5.5)
    if (policy && policy.autoLockMin === 0) return true;
    if (typeof data.lockChance === 'number' && Number.isFinite(data.lockChance)) {
        const chance = Math.max(0, Math.min(1, data.lockChance));
        if (chance <= 0) return false;
        if (chance >= 1) return true;
        if (typeof roll !== 'function') return data.locksScreenOnLeave !== false;
        return roll(ownerId, `screen:${data.id}:${leaveCount}`) < chance;
    }
    return data.locksScreenOnLeave !== false;
}

export class WorkstationState {
    /**
     * @param {Object} env - { objects() -> scenarioData[], npcs() -> npc[], on(pattern, cb),
     *                         emit(name, data), setGlobal(k, v), roll(npcId, salt) }, and
     *                         optionally ownerPresent(id), ownerTracked(id), policyFor(data),
     *                         clockMs(), onTick(fn) (step 9; the live env has all of them)
     */
    constructor(env) {
        this.env = env;
        this.away = new Map(); // ownerId -> { away, leaves }
        this.leftAt = new Map(); // ownerId -> needs clock ms of the current leave (auto lock)
        this.pendingLocks = new Map(); // objectId -> data, open screens with a lockAt
    }

    install() {
        this.env.on('npc_left_post:*', (d) => this.onLeft(d?.npcId));
        this.env.on('npc_returned_post:*', (d) => this.onReturned(d?.npcId));
        this.env.on('npc_ko:*', (d) => this.onKnockedOut(d?.npcId));
        if (typeof this.env.onTick === 'function') this.env.onTick(() => this.checkAutoLocks());
        this.resetGlobals();
        return this;
    }

    _clock() {
        const v = typeof this.env.clockMs === 'function' ? Number(this.env.clockMs()) : 0;
        return Number.isFinite(v) ? v : 0;
    }

    _policy(data) {
        return typeof this.env.policyFor === 'function' ? (this.env.policyFor(data) || null) : null;
    }

    _tracked(npcId) {
        return typeof this.env.ownerTracked === 'function' ? !!this.env.ownerTracked(npcId) : true;
    }

    /** The owner and whether they are present (env.ownerPresent; null without it). */
    presence(objectId) {
        const data = this._find(objectId);
        if (!data) return { ownerId: null, present: null };
        const ownerId = ownerOf(data, this.env.npcs());
        const present = ownerId && typeof this.env.ownerPresent === 'function' ? !!this.env.ownerPresent(ownerId) : null;
        return { ownerId, present };
    }

    /** Roll the screen for a leave and, for an open one under autoLockMin above 0, set lockAt. */
    _rollScreen(data, ownerId, rec) {
        const policy = this._policy(data);
        data.screenLocked = decideLocked(data, ownerId, rec.leaves, this.env.roll, policy);
        delete data.lockAt;
        this.pendingLocks.delete(data.id);
        const min = policy?.autoLockMin;
        if (!data.screenLocked && typeof min === 'number' && Number.isFinite(min) && min > 0) {
            const left = this.leftAt.get(ownerId);
            const from = Number.isFinite(left) ? left : this._clock();
            data.lockAt = from + min * 60000;
            this.pendingLocks.set(data.id, data);
        }
    }

    /**
     * A station discovered after its owner left (its room loaded late, so screenLocked is still
     * undefined) takes its state now. The roll is keyed by owner, station and leave count, so
     * the answer is the same whoever asks first (isLocked or onInteract).
     */
    _lateRoll(data, ownerId, rec) {
        if (data.screenLocked !== undefined) return;
        this._rollScreen(data, ownerId, rec);
        this._publish(data);
    }

    /**
     * Whether a workstation's screen is locked right now: its owner has an away record and the
     * screen is locked. Emits no event (a late-found station is rolled and its globals written).
     */
    isLocked(objectId) {
        const data = this._find(objectId);
        if (!data) return false;
        const ownerId = ownerOf(data, this.env.npcs());
        const rec = ownerId ? this.away.get(ownerId) : null;
        if (!rec?.away) return false;
        this._lateRoll(data, ownerId, rec);
        return !!data.screenLocked;
    }

    /** Lock one open screen whose lockAt has passed while its owner is still away. */
    _checkAutoLock(data) {
        if (!data || data.lockAt === undefined || data.screenLocked) return false;
        const ownerId = ownerOf(data, this.env.npcs());
        if (!this.away.get(ownerId)?.away) return false;
        if (this._clock() < data.lockAt) return false;
        data.screenLocked = true;
        delete data.lockAt;
        this.pendingLocks.delete(data.id);
        this._publish(data);
        this.env.emit(`workstation_auto_locked:${data.id}`, { objectId: data.id, ownerId });
        return true;
    }

    /** The end-of-tick check: every open screen with a lockAt. */
    checkAutoLocks() {
        if (!this.pendingLocks.size) return;
        for (const data of [...this.pendingLocks.values()]) this._checkAutoLock(data);
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

    onLeft(npcId, { reason = 'needs' } = {}) {
        if (!npcId) return;
        const rec = this.away.get(npcId) || { away: false, leaves: 0 };
        rec.away = true;
        rec.leaves += 1;
        this.away.set(npcId, rec);
        this.leftAt.set(npcId, this._clock());
        for (const data of this._stationsOf(npcId)) {
            this._rollScreen(data, npcId, rec);
            this._publish(data);
            this.env.emit(`workstation_owner_left:${data.id}`, { objectId: data.id, ownerId: npcId, screenLocked: data.screenLocked, reason });
        }
    }

    /**
     * npc_ko:<id>: a knock-out at the desk counts as leaving (5.4), but only for an owner the
     * needs system tracks with no current away record. A knock-out while away changes nothing.
     */
    onKnockedOut(npcId) {
        if (!npcId) return;
        if (this.away.get(npcId)?.away) return;
        if (!this._tracked(npcId)) return;
        this.onLeft(npcId, { reason: 'ko' });
    }

    onReturned(npcId) {
        if (!npcId) return;
        const rec = this.away.get(npcId) || { away: false, leaves: 0 };
        const stations = this._stationsOf(npcId);
        // A station nobody asked about since it was found still takes this leave's roll, so
        // wasLocked does not depend on whether anything read it first
        if (rec.away) for (const data of stations) if (data.screenLocked === undefined) this._rollScreen(data, npcId, rec);
        rec.away = false;
        this.away.set(npcId, rec);
        for (const data of stations) {
            const wasLocked = !!data.screenLocked;
            data.screenLocked = false;
            delete data.lockAt;
            this.pendingLocks.delete(data.id);
            this._publish(data);
            this.env.emit(`workstation_owner_returned:${data.id}`, { objectId: data.id, ownerId: npcId, wasLocked });
        }
    }

    /**
     * The player interacted with an object.
     * Returns 'accessed' | 'locked' | 'attended' | 'signin' | null (not a workstation).
     */
    onInteract(objectId) {
        const data = this._find(objectId);
        if (!data) return null;
        const ownerId = ownerOf(data, this.env.npcs());
        if (!ownerId) return 'signin';
        const presenceKnown = typeof this.env.ownerPresent === 'function';
        if (presenceKnown && this.env.ownerPresent(ownerId)) return 'attended';
        const rec = this.away.get(ownerId);
        if (!rec?.away) return presenceKnown ? 'signin' : 'attended';
        this._lateRoll(data, ownerId, rec);
        this._checkAutoLock(data);
        if (data.screenLocked) {
            this.env.emit(`workstation_locked_attempt:${objectId}`, { objectId, ownerId });
            return 'locked';
        }
        this.env.setGlobal(`${objectId}_accessed`, true);
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
    const needs = () => w.npcNeedsSystem || null;
    const env = {
        objects, npcs,
        // Presence (5.4): tracked by the needs system, at its post, and available
        ownerTracked: (id) => !!needs()?.getState?.(id),
        ownerPresent: (id) => {
            const sys = needs();
            const st = sys?.getState?.(id);
            return !!st && st.atPost === true && !!sys.isAvailable?.(id);
        },
        // The PC's own policy, else the scenario's defaultPolicy (5.5); none: null
        policyFor: (data) => {
            const sc = w.gameScenario || {};
            const name = data?.policy || sc.defaultPolicy;
            const p = name && sc.policies && typeof sc.policies === 'object' ? sc.policies[name] : null;
            return p && typeof p === 'object' ? p : null;
        },
        clockMs: () => needs()?.clockMs ?? 0,
        onTick: (fn) => needs()?.onTick?.(fn),
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
        roll: (npcId, salt) => (w.npcNeedsSystem ? w.npcNeedsSystem.roll(npcId, salt) : 0.5)
    };
    w.workstationState = new WorkstationState(env).install();
    return w.workstationState;
}
