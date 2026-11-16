/**
 * Player poses (docs/achitechture/NPC_POSES.md, "Player poses"): the same one-frame drink, use
 * and phone frames the NPCs show, played on the player when the player's atlas has them
 * (`pose_<name>_<compass>_frame_000`, which core/player.js turns into the animations
 * `pose_<name>_<compass>`). With no such frames nothing changes.
 *
 * Triggers (each a call on window.playerPoses, so the callers need no import):
 *   - drink: consumables.js useConsumable, for a drink (coffee, tea, energy drink ...), DRINK_MS
 *   - use: interactions.js handleObjectInteraction, a world object (not an inventory item),
 *     USE_MS, after the caller has turned the player to face it; never delays the interaction
 *   - phone lead-in: openWithPhoneLead(open) at the calls the player starts (interactions.js,
 *     npc-barks.js), phoneLead() where a wait already exists (ringer answer, scripted calls)
 *   - phone: minigame-manager.js, when a phone-style minigame opens (PHONE_SCENES: phone chat,
 *     its calls, and a person-chat video call) the phone pose shows and holds while it is open,
 *     then PHONE_CLOSE_MS after it closes
 * Skipped while seated, walking, knocked out, in a fight (a punch, jab, hit or death animation,
 * or an NPC chasing), or with `"officeVisuals": false`. Walking or any other animation ends a
 * pose at once; when it times out the idle for the current direction comes back.
 *
 * Client only: nothing is synced or stored in player_state.
 * Breathing: a held pose breathes like an NPC's (systems/sprite-breath.js).
 *
 * One static import, sprite-breath.js (no imports of its own): a test harness that copies this
 * file must copy that one too. core/game.js imports this module dynamically.
 */

import { updateBreath, endBreath } from './sprite-breath.js';

export const USE_MS = 500;
export const DRINK_MS = 1600;
export const PHONE_CLOSE_MS = 600;
export const PHONE_LEAD_MS = 300;       // the phone pose shows this long before a player-opened phone minigame
const SCRIPTED_CALL_START_MS = 500;      // the wait the ringer and event calls already have before opening

const COMPASS = Object.freeze({
    right: 'east', left: 'west', up: 'north', down: 'south',
    'up-right': 'north-east', 'up-left': 'north-west', 'down-right': 'south-east', 'down-left': 'south-west'
});
const FIGHT_ANIM_RE = /(punch|jab|-hit|hit_|death)/;

const win = () => (typeof window !== 'undefined' ? window : globalThis);

/** Is this minigame phone-style (the player holds a phone for it)? */
export function isPhoneScene(sceneType, params = {}) {
    if (sceneType === 'phone-chat') return true;                       // texts, voice calls, ringing calls
    if (sceneType === 'person-chat' && params?.videoCall === true) return true;   // a video call
    return false;
}

/** The player animation key for a pose at a player direction ('down', 'up-left', ...). */
export function playerPoseKey(name, direction) {
    return `pose_${name}_${COMPASS[direction] || 'south'}`;
}

export class PlayerPoses {
    constructor(scene) {
        this.scene = scene;
        this.cur = null;        // { name, key, until, hold }
        this.holder = {};       // sprite-breath.js holder
        this.phoneScene = null; // the open phone-style minigame instance
        this.phoneWanted = false; // a phone-style minigame is open: keep trying to show the phone
        this.phoneShown = false;  // the phone pose showed while it was open
        this.leadPending = false; // openWithPhoneLead is waiting to open
        this.leadOpen = null;     // the open it will run (the newest call's)
        this.dead = false;        // the scene shut down
        this.timer = (fn, ms) => setTimeout(fn, ms);
        this.log = [];          // [{ t, pose }] on and off, newest last (tests, debug)
    }

    _now() {
        const t = this.scene?.time?.now;
        return Number.isFinite(t) ? t : Date.now();
    }

    _player() {
        const p = win().player;
        return p && !p.destroyed && p.active !== false ? p : null;
    }

    _note(pose) {
        this.log.push({ t: this._now(), pose });
        if (this.log.length > 100) this.log.shift();
    }

    /** Has the player's atlas this pose for the current direction? */
    has(name) {
        const p = this._player();
        if (!p) return false;
        const anims = this.scene?.anims || p.scene?.anims;
        return (anims?.get?.(playerPoseKey(name, p.direction || 'down'))?.frames?.length || 0) > 0;
    }

    /** Why no pose may start now (a string), or null. */
    blocked() {
        const w = win();
        const p = this._player();
        if (!p) return 'no player';
        if (w.gameScenario?.officeVisuals === false) return 'office visuals off';
        if (w.seating?.isSeated?.()) return 'seated';
        const v = p.body?.velocity;
        if (p.isMoving || (v && (Math.abs(v.x) > 1 || Math.abs(v.y) > 1))) return 'walking';
        if (w.playerIsKnockedOut?.() || w.playerHealth?.isKO?.()) return 'knocked out';
        const cur = p.anims?.currentAnim?.key || '';
        if (FIGHT_ANIM_RE.test(cur) && p.anims?.isPlaying) return 'fighting';
        const behaviours = w.npcBehaviorManager?.behaviors;
        if (behaviours instanceof Map) {
            for (const b of behaviours.values()) if (b?.currentState === 'chase') return 'fighting';
        }
        return null;
    }

    /** Show a pose for ms (hold: until released). Returns true when it shows. */
    show(name, ms, { hold = false } = {}) {
        const p = this._player();
        if (!p || this.blocked() || !this.has(name)) return false;
        const key = playerPoseKey(name, p.direction || 'down');
        if (p.anims?.currentAnim?.key !== key) p.anims.play(key, true);
        this.cur = { name, key, until: this._now() + ms, hold };
        this._note(name);
        return true;
    }

    /** Drop the pose: back to the idle when the player still shows it. */
    release() {
        const cur = this.cur;
        if (!cur) return;
        this.cur = null;
        const p = this._player();
        endBreath(this.holder, p);
        this._note(null);
        if (p && p.anims?.currentAnim?.key === cur.key) p.anims.play(`idle-${p.direction || 'down'}`, true);
    }

    drink() { return this.show('drink', DRINK_MS); }

    /** A world object interaction (not an inventory item, NPC, seat or container sprite): a short use. */
    use(sprite) {
        const w = win();
        if (!sprite || (w.inventory?.items || []).includes(sprite) || sprite.inInventory) return false;
        if (sprite._isNPC || sprite.isSwivelChair) return false;
        if (w.seating?.isSeat?.(sprite)) return false;
        if (String(sprite.objectId || '').startsWith('temp_')) return false;   // a container's temporary sprite
        if (w.MinigameFramework?.currentMinigame) return false;
        if (this.cur?.hold) return false;   // a phone minigame is open
        return this.show('use', USE_MS);
    }

    /**
     * Open a phone-style minigame the player started: the phone pose shows, then `open` runs
     * PHONE_LEAD_MS later. A second call during the lead replaces the pending open (the newest
     * wins, one open at the original time; returns true). The open is dropped when another
     * minigame opened during the lead, the player was knocked out or the scene went. With a
     * minigame already open at the call, no pose frames, or a pose blocked now, `open` runs at
     * once and its result is returned.
     */
    openWithPhoneLead(open) {
        if (this.leadPending) { this.leadOpen = open; return true; }
        if (win().MinigameFramework?.currentMinigame) return open();
        if (!this.show('phone', PHONE_LEAD_MS + 500)) return open();
        this.leadPending = true;
        this.leadOpen = open;
        this.timer(() => {
            this.leadPending = false;
            const run = this.leadOpen;
            this.leadOpen = null;
            const w = win();
            if (this.dead || w.playerPoses !== this || !this._player()) return;
            if (w.MinigameFramework?.currentMinigame) return;
            if (w.playerIsKnockedOut?.() || w.playerHealth?.isKO?.()) return;
            try { run(); } catch (e) { console.error('phone lead-in open failed', e); }
        }, PHONE_LEAD_MS);
        return true;
    }

    /** The phone pose for a minigame that already waits before it opens (a ringing call, a scripted call). */
    phoneLead() { return this.show('phone', SCRIPTED_CALL_START_MS + 500); }

    _wantPhone() {
        if (this.phoneWanted && !this.cur && this.has('phone') && !this.blocked()) {
            this.phoneShown = this.show('phone', 0, { hold: true }) || this.phoneShown;
        }
    }

    onMinigameStart(sceneType, params, instance) {
        if (!isPhoneScene(sceneType, params)) {
            // A use or drink pose does not stay up behind another minigame; a held phone does
            if (this.cur && !this.cur.hold) this.release();
            return false;
        }
        this.phoneScene = instance || true;
        this.phoneWanted = this.has('phone');   // no frames: no per-frame work
        this.phoneShown = this.show('phone', 0, { hold: true });
        return this.phoneShown;
    }

    onMinigameEnd(instance) {
        if (!this.phoneScene || (instance && this.phoneScene !== true && instance !== this.phoneScene)) return false;
        this.phoneScene = null;
        this.phoneWanted = false;
        const shown = this.phoneShown;
        this.phoneShown = false;
        if (this.cur?.name === 'phone') {
            this.cur.hold = false;
            this.cur.until = this._now() + PHONE_CLOSE_MS;
            return true;
        }
        return shown ? this.show('phone', PHONE_CLOSE_MS) : false;
    }

    /** Per frame (postupdate). */
    update() {
        const cur = this.cur;
        if (!cur) { this._wantPhone(); return; }
        const p = this._player();
        if (!p) { this.cur = null; return; }
        // Replaced (walking, a turn, a fight, sitting): the pose is over, the new animation stays
        if (p.anims?.currentAnim?.key !== cur.key || this.blocked()) {
            this.cur = null;
            endBreath(this.holder, p);
            this._note(null);
            if (p.anims?.currentAnim?.key === cur.key && !p.isMoving) p.anims.play(`idle-${p.direction || 'down'}`, true);
            return;
        }
        if (!cur.hold && this._now() >= cur.until) {
            this.release();
            this._wantPhone();   // a drink during a phone chat: the phone comes back
            return;
        }
        updateBreath(this.holder, p, true);
    }
}

/** Install once per scene (core/game.js, after the player). Returns the instance. */
export function installPlayerPoses(scene) {
    const w = win();
    const live = (inst) => scene?.events?.once?.('shutdown', () => { inst.dead = true; });
    if (w.playerPoses?.scene === scene) {
        // A restart of the same scene: the instance lives on, so undo what the shutdown marked
        const same = w.playerPoses;
        if (same.dead) { same.dead = false; same.leadPending = false; same.leadOpen = null; live(same); }
        return same;
    }
    const inst = new PlayerPoses(scene);
    w.playerPoses = inst;
    live(inst);
    scene?.events?.on?.('postupdate', () => { try { inst.update(); } catch (e) { /* never break a frame */ } });
    return inst;
}
