/**
 * NPC poses (docs/achitechture/NPC_POSES.md): one-frame standing poses shown while an
 * office-life NPC uses something. drink (a mug at the mouth), use (hands at a machine) and
 * phone (a handset at the ear), each a single frame in 8 directions, made by the pipeline's
 * `--pose-from name=<state>` as atlas frames `pose_<name>_<compass>_frame_000`, which
 * npc-sprites.js turns into the animations `npc-<id>-pose_<name>-<direction>`.
 *
 * Runs on the scene's `postupdate`, after the needs system and NPC behaviour have moved,
 * faced and animated the NPC, so it never trails a frame. With no pose animation for the
 * NPC's atlas (every atlas without pose frames) it touches nothing: the normal idle shows.
 *
 * What gets which pose (wantedPose, below):
 *   - a desk-phone call (s.call), or a colleague answering a ringing desk phone: phone
 *   - using an object that satisfies caffeine or thirst: drink; at a machine, use for the
 *     first USE_LEAD_MS of the use, then drink
 *   - using any other machine (copier, printer, microwave, vending, keypad, socket, boiler): use
 *   - anything else (eating, visits, the own desk, social media, sitting): none
 * An object's `affordance.pose` ("drink", "use", "phone" or false) overrides the mapping.
 * Machines: `affordance.machine` (true or false) when given, else the object's type,
 * officeType or texture key matched against MACHINE_RE.
 * Per NPC: `"poses": false` on the NPC turns them off; a list such as ["phone"] allows only those.
 *
 * Seated wins: a seated NPC (seating.js, behavior._seat) keeps its sit frame. The pose holds
 * under a world speech bubble (chatter at the cooler, a phone call's lines) and drops for a
 * conversation with the player, face-player, hostility, a knock-out, a hit or attack
 * animation, or any movement; the idle comes back when it drops.
 *
 * No static imports (so no test harness copy lists change); core/game.js imports it.
 */

export const POSE_NAMES = Object.freeze(['drink', 'use', 'phone']);
export const DRINK_NEEDS = Object.freeze(['caffeine', 'thirst']);
/** ms of `use` at a drinks machine before the drink pose (needs clock). */
export const USE_LEAD_MS = 3000;
/** Object type, officeType or texture key that reads as a machine operated by hand. */
export const MACHINE_RE = /(coffee|kettle|cooler|boiler|copier|printer|microwave|vending|keypad|socket)/i;

const BLOCKING_STATES = new Set(['face_player', 'maintain_space', 'chase', 'flee']);
const BLOCKING_ANIM_RE = /(attack|punch|-jab-|-hit-|death)/;

const win = () => (typeof window !== 'undefined' ? window : globalThis);
const asList = (v) => (Array.isArray(v) ? v : (v === undefined || v === null ? [] : [v]));

/** Is this needs-world object (getObject's shape: { affordance, _sprite }) a machine? */
export function isMachine(obj) {
    if (!obj) return false;
    const aff = obj.affordance || {};
    if (typeof aff.machine === 'boolean') return aff.machine;
    const sd = obj._sprite?.scenarioData || obj.scenarioData || {};
    const names = [sd.type, sd.officeType, obj._sprite?.texture?.key, obj.type];
    return names.some(n => typeof n === 'string' && MACHINE_RE.test(n));
}

/** Does this NPC's record allow this pose? (`poses`: false none; a list only those.) */
export function npcAllows(npcRecord, name) {
    const p = npcRecord?.poses;
    if (p === false) return false;
    if (Array.isArray(p)) return p.includes(name);
    return true;
}

/**
 * The pose a needs NPC wants now, or null. Pure: s is the needs state ({ job, call }),
 * obj the job's target (getObject), usingMs how long the current use has run (needs clock),
 * seated whether it sits, npc its scenario record.
 */
export function wantedPose({ s, obj = null, usingMs = 0, seated = false, npc = null }) {
    if (!s || seated) return null;
    const pick = (name) => (name && POSE_NAMES.includes(name) && npcAllows(npc, name) ? name : null);
    const job = s.job;
    // A desk-phone call: the owner at its desk, or a colleague who picked up a ringing phone
    if (s.call || (job?.phone && job.phase === 'using')) return pick('phone');
    if (!job || job.phase !== 'using') return null;
    if (job.kind === 'visit' || job.kind === 'self' || job.socialDesk || job.errand) return null;
    const aff = obj?.affordance;
    if (!aff) return null;
    if (Object.prototype.hasOwnProperty.call(aff, 'pose')) return aff.pose ? pick(aff.pose) : null;
    const machine = isMachine(obj);
    const satisfies = asList(aff.satisfies);
    if (DRINK_NEEDS.includes(job.need) && satisfies.includes(job.need)) {
        if (machine && usingMs < USE_LEAD_MS) return pick('use') || pick('drink');
        return pick('drink');
    }
    return machine ? pick('use') : null;
}

/** The animation key for a pose at a behaviour direction ('down', 'up-left', ...). */
export function poseAnimKey(npcId, name, direction) {
    return `npc-${npcId}-pose_${name}-${direction}`;
}

/** Is there a playable pose animation (frames present) for this key? */
export function hasPoseAnim(scene, key) {
    return (scene?.anims?.get?.(key)?.frames?.length || 0) > 0;
}

/** Something that must win over a pose: movement, combat, talking to the player. */
export function poseBlocked(b, { hostile = false, ko = false, inChat = false } = {}) {
    if (!b?.sprite || b.sprite.destroyed) return true;
    if (b._seat || b._seatMove) return true;
    if (b.isMoving) return true;
    if (BLOCKING_STATES.has(b.currentState)) return true;
    if (hostile || ko || inChat) return true;
    const cur = b.sprite.anims?.currentAnim?.key || '';
    if (BLOCKING_ANIM_RE.test(cur) && b.sprite.anims?.isPlaying) return true;
    return false;
}

export class NpcPoses {
    constructor(scene) {
        this.scene = scene;
        this.active = new Map();    // npcId -> pose anim key being shown
        this.useStart = new Map();  // npcId -> { job, at } (needs clock ms when `using` was first seen)
        this.log = [];              // [{ t, npcId, pose, key }] pose on/off, newest last (tests, debug)
    }

    _usingMs(id, s, clockMs) {
        const job = s.job;
        if (!job || job.phase !== 'using') { this.useStart.delete(id); return 0; }
        let rec = this.useStart.get(id);
        if (!rec || rec.job !== job) { rec = { job, at: clockMs }; this.useStart.set(id, rec); }
        return Math.max(0, clockMs - rec.at);
    }

    _note(npcId, pose, key) {
        this.log.push({ t: Date.now(), npcId, pose, key });
        if (this.log.length > 200) this.log.shift();
    }

    /** Drop a pose: back to the idle when the sprite still shows it. */
    release(id, b) {
        const key = this.active.get(id);
        if (!key) return;
        this.active.delete(id);
        this._note(id, null, key);
        if (!b?.sprite || b.sprite.destroyed) return;
        if (b.sprite.anims?.currentAnim?.key === key) {
            b.lastAnimationKey = null;
            b.playAnimation?.('idle', b.direction || 'down');
        }
    }

    /** Per frame (postupdate). */
    update() {
        const w = win();
        const sys = w.npcNeedsSystem;
        const mgr = w.npcBehaviorManager;
        if (!sys?.states || !mgr) return;
        const clockMs = Number(sys.clockMs) || 0;
        const seen = new Set();
        for (const [id, s] of sys.states) {
            seen.add(id);
            const b = mgr.getBehavior?.(id);
            if (!b) { this.active.delete(id); continue; }
            const usingMs = this._usingMs(id, s, clockMs);
            const blocked = poseBlocked(b, {
                hostile: !!w.npcHostileSystem?.isNPCHostile?.(id),
                ko: !!w.npcHostileSystem?.isNPCKO?.(id),
                inChat: !!sys.world?.inChatWith?.(id)
            });
            let key = null;
            let pose = null;
            if (!blocked) {
                const obj = s.job?.targetId ? sys.world?.getObject?.(s.job.targetId) : null;
                const name = wantedPose({ s, obj, usingMs, seated: false, npc: w.npcManager?.getNPC?.(id) });
                if (name) {
                    const k = poseAnimKey(id, name, b.direction || 'down');
                    if (hasPoseAnim(this.scene || b.scene, k)) { key = k; pose = name; }   // no frames: the idle stays
                }
            }
            if (!key) { this.release(id, b); continue; }
            if (b.sprite.anims?.currentAnim?.key !== key) {
                b.sprite.play(key, true);
                if (b.sprite.flipX) b.sprite.setFlipX?.(false);
                b.lastAnimationKey = key;
            }
            if (this.active.get(id) !== key) { this.active.set(id, key); this._note(id, pose, key); }
        }
        for (const id of [...this.active.keys()]) if (!seen.has(id)) this.active.delete(id);
    }
}

/** Install once per scene (core/game.js, beside the office visuals). Returns the instance. */
export function installNpcPoses(scene) {
    const w = win();
    if (w.npcPoses?.scene === scene) return w.npcPoses;
    const inst = new NpcPoses(scene);
    w.npcPoses = inst;
    scene?.events?.on?.('postupdate', () => { try { inst.update(); } catch (e) { /* never break a frame */ } });
    return inst;
}
