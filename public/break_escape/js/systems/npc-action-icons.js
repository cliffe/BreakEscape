/**
 * NPC current-action icon: a small marker over an NPC's head while it has an active needs job
 * (walking to, or using, an object), hidden when the NPC is idle or home. It shows what the NPC
 * is DOING or seeking right now, never its hidden next want.
 *
 * Scenario config (all optional):
 *   actionIcons          { "<key>": <icon> }. For a use job the keys are tried in the order:
 *                          target object id, "print" (a copier or printer, or a use whose onUse
 *                          has revealOutput), the job's need, the target's first `satisfies`,
 *                          object type. For a carry job: "file" (a reveal slot carried to an
 *                          onDeliver "stow" target), the item's needsTag (e.g. "post"), then
 *                          "curiosity". Then "fallback". The scenario's entries are tried for
 *                          every key before any default, so an explicit entry always wins.
 *                        With no job: "noticed" for NOTICED_MS after npc_caught_at_post, else
 *                          "blocked" while an urgent need has nothing permitted (leashed). These
 *                          two show only with showPressingNeeds or an explicit scenario entry.
 *                          "queue" is registered for slice 10 (no queue exists yet).
 *                        An <icon> is a texture or text (OFFICE_LIFE_PLAN 2.12):
 *                          "icon:talk"              assets/icons/talk.png
 *                          { "sprite": "kettle1" }  assets/objects/kettle1.png (optional "text")
 *                          "C"                      a short text glyph
 *                        Textures draw at native size (never scaled) on the dark backing; each
 *                        loads on first use and the text glyph shows until it arrives.
 *   npcWindupMs          pre-action tell length before an NPC leaves its post (npc-needs.js). Default 700, 0 = off.
 *   showPressingNeeds    false (default). true: a thought bubble beside the head shows the NPC's
 *                          most pressing need it is not acting on (getState().pressing), the
 *                          need's icon on a light rounded backing with two trailing dots; it
 *                          pulses slowly below half urgentAt (not under prefers-reduced-motion).
 *                          Same room/dark rule as the action icons (OFFICE_LIFE_PLAN 9.2).
 *                          The old name showNpcIntentBubbles is not read (the validator warns).
 *
 * Shown only for NPCs in the player's current room, and not while that room is dark (a room
 * without lighting counts as lit). A job that is winding up (npc_action_windup) pulses its icon
 * before the NPC moves. Reads window.npcNeedsSystem.getState(); changes nothing in the needs system.
 */
import { iconShown, roomIsDark, npcIconAnchor } from './npc-office-visuals.js';

// The 16x16 NPC icon set (OFFICE_LIFE_PLAN 9.1, assets/icons/npc-<name>.png), drawn at native
// size. Referenced by name only, so a swapped file needs no code change. No fallback art: text.
export const NPC_ICON_NAMES = ['caffeine', 'thirst', 'hunger', 'rest', 'social', 'work', 'curiosity',
    'post', 'printout', 'print', 'queue', 'file', 'blocked', 'noticed'];
export const DEFAULT_ICONS = Object.freeze({
    ...Object.fromEntries(NPC_ICON_NAMES.map(n => [n, `icon:npc-${n}`])),
    fallback: '•'
});

// Text shown while a default texture loads (or if it fails)
const TEXT_STANDIN = { caffeine: 'C', thirst: 'W', hunger: 'F', rest: 'Z', work: 'PC', social: 'S', curiosity: '?',
    post: 'P', printout: 'P', print: 'Pr', queue: '…', file: 'Fi', blocked: 'X', noticed: '!' };

/** Pure: is this object a copier or printer (its preset, officeType or type)? */
export function isPrinter({ type, officeType, preset } = {}) {
    return preset === 'copier' || officeType === 'copier' || /copier|printer/i.test(typeof type === 'string' ? type : '');
}

// Text glyph size (px). The backing is sized from this, not from the text's measured height:
// an emoji glyph ("☕", the lab's coffee entry) measures about twice its font size, which made a
// 34 px box that stood well clear of the head and read as an object on the desk behind.
export const ICON_TEXT_PX = 16;

/** Pure: the backing's { w, h } for what the icon shows. */
export function backingSize(kind, { width = 0, height = 0 } = {}) {
    if (kind === 'sprite') return { w: width + 6, h: height + 4 };
    return { w: Math.max(width, ICON_TEXT_PX) + 8, h: Math.min(height || ICON_TEXT_PX, ICON_TEXT_PX + 4) + 2 };
}

const usable = v => (typeof v === 'string' && v) || (v && typeof v === 'object' && typeof v.sprite === 'string' && v.sprite);

/**
 * Pure: the first usable entry for `keys`: the scenario's own entries for every key first, then
 * the defaults (so a scenario's "work" beats the default "print"). An unusable scenario value is
 * skipped. Ends with "fallback" unless `fallback` is false.
 */
export function firstIcon(keys, actionIcons = {}, { fallback = true } = {}) {
    const own = actionIcons || {};
    for (const src of [own, DEFAULT_ICONS]) {
        for (const key of keys) if (key && usable(src[key])) return { key, value: src[key] };
    }
    if (!fallback) return null;
    return { key: 'fallback', value: usable(own.fallback) ? own.fallback : DEFAULT_ICONS.fallback };
}

/**
 * Pure: { key, value } of the icon for a job. `target` is { id, type, satisfies, print } or null.
 * `job.prints` (a use whose onUse has revealOutput) and `job.files` (a slot carried to a stow
 * target) come from the needs system's getState.
 */
export function pickIconEntry(job, actionIcons = {}, target = null) {
    if (!job) return null;
    const keys = (job.kind === 'carry' || job.itemId)
        ? [job.files ? 'file' : null, job.tag, 'curiosity']
        : (target ? [target.id, (job.prints || target.print) ? 'print' : null, job.need, target.satisfies, target.type]
            : [job.prints ? 'print' : null, job.need]);
    return firstIcon(keys, actionIcons);
}

/**
 * Pure: the action-slot icon for an NPC with no job: "noticed" (just caught someone at its desk),
 * else "blocked" (an urgent need with nothing permitted). Shown only with showPressingNeeds or an
 * explicit scenario entry for that key, so a scenario that has not opted in looks as before.
 */
export function stateIconEntry(st, actionIcons = {}, optIn = false) {
    if (!st || st.job) return null;
    const key = st.noticed ? 'noticed' : (st.blockedNeed ? 'blocked' : null);
    if (!key) return null;
    if (!optIn && !usable((actionIcons || {})[key])) return null;
    return firstIcon([key], actionIcons, { fallback: false });
}

export const PRESSING_PULSE_BELOW = 0.5;

/**
 * Pure: the thought bubble for getState() `st`, or null: { need, ratio, pulse, key, value }.
 * Off unless `on` (showPressingNeeds). Never the need the current job is for (the action icon
 * shows that one).
 */
export function pressingBubble(st, actionIcons = {}, on = false) {
    const p = on ? st?.pressing : null;
    if (!p || !p.need || (st.job && st.job.need === p.need)) return null;
    const entry = firstIcon([p.need], actionIcons);
    return { need: p.need, ratio: p.ratio, pulse: p.ratio < PRESSING_PULSE_BELOW, key: entry.key === 'fallback' ? p.need : entry.key, value: entry.value };
}

/** Pure: the icon value (texture spec or glyph) for a job. */
export function pickIcon(job, actionIcons = {}, target = null) {
    return pickIconEntry(job, actionIcons, target)?.value ?? null;
}

/**
 * Pure: how to draw an icon value. { kind: 'sprite', key, path, glyph } for "icon:<name>" and
 * { sprite }, else { kind: 'text', glyph }. `glyph` is the text stand-in.
 */
export function resolveIcon(value, standIn = '•') {
    if (typeof value === 'string' && value.startsWith('icon:') && value.length > 5) {
        const name = value.slice(5);
        return { kind: 'sprite', key: `icon:${name}`, path: `icons/${name}.png`, glyph: standIn };
    }
    if (value && typeof value === 'object' && typeof value.sprite === 'string' && value.sprite) {
        return { kind: 'sprite', key: value.sprite, path: `objects/${value.sprite}.png`, glyph: typeof value.text === 'string' && value.text ? value.text : standIn };
    }
    return { kind: 'text', glyph: typeof value === 'string' && value ? value : standIn };
}

const win = () => (typeof window !== 'undefined' ? window : {});

/**
 * The job target's { id, type, satisfies }. Found by scanning every loaded room once, then cached
 * by id with its sprite; the entry is dropped when that sprite is destroyed (consumed, removed).
 * A target that is not found is not cached, so one in a room that loads later is still found.
 */
export function targetInfo(id, cache = null) {
    const hit = cache?.get(id);
    if (hit) {
        if (!hit.sp.destroyed && hit.sp.scene !== null && hit.sp.scene !== undefined) return hit.info;
        cache.delete(id);
    }
    const rooms = win().rooms || {};
    for (const room of Object.values(rooms)) {
        for (const sp of Object.values(room?.objects || {})) {
            const d = sp?.scenarioData;
            if (d && d.id === id) {
                // Through the preset resolver (office-presets.js), so a type-only object's preset
                // satisfies picks the icon
                const op = win().officePresets;
                const aff = op?.spriteAffordance ? op.spriteAffordance(sp, win().gameScenario) : d.affordance;
                const sat = aff?.satisfies;
                const preset = op?.spritePreset ? op.spritePreset(sp, win().gameScenario) : null;
                const info = { id: d.id, type: d.type, satisfies: Array.isArray(sat) ? sat[0] : sat,
                    print: isPrinter({ type: d.type, officeType: d.officeType, preset }) };
                if (cache && !sp.destroyed && sp.scene) cache.set(id, { info, sp });
                return info;
            }
        }
    }
    return null;
}

// Thought bubble (OFFICE_LIFE_PLAN 9.2): light backing so it reads apart from the dark action icon
const BUBBLE_FILL = 0xf4f1e8;
const BUBBLE_LINE = 0x1b2a41;
const BUBBLE_PAD = 3;
export const BUBBLE_GAP_X = 13;   // px right of the head anchor to the bubble's left edge
export const BUBBLE_RISE = 6;     // px above the head anchor to the bubble's bottom edge

/** Pure: the bubble container's centre for a head anchor `at` and a bubble w x h. */
export function bubblePosition(at, w, h) {
    return { x: Math.round(at.x + BUBBLE_GAP_X + w / 2), y: Math.round(at.y - BUBBLE_RISE - h / 2) };
}

/** Pure: the two trailing dots, in the bubble's own coordinates (centre 0,0), smaller one nearer the head. */
export function bubbleDots(w, h) {
    return [
        { x: -w / 2 - 2, y: h / 2 + 1, r: 2 },
        { x: -w / 2 - 7, y: h / 2 + 5, r: 1.5 }
    ];
}

let reducedQuery;
function reducedMotion() {
    try {
        if (reducedQuery === undefined) reducedQuery = win().matchMedia?.('(prefers-reduced-motion: reduce)') || null;
        return reducedQuery?.matches === true;
    } catch (e) { return false; }
}

export class NpcActionIcons {
    constructor() { this.icons = new Map(); this.bubbles = new Map(); this.windups = new Map(); this.targets = new Map(); this.sceneHooked = null; this.textures = new Map(); }

    get showPressingNeeds() { return win().gameScenario?.showPressingNeeds === true; }

    /** Is a texture ready? Starts a one-off load the first time; false until it has arrived. */
    textureReady(scene, r) {
        if (scene.textures?.exists?.(r.key)) return true;
        const st = this.textures.get(r.key);
        if (st) return false;   // loading or failed
        this.textures.set(r.key, 'loading');
        try {
            scene.load.image(r.key, r.path);
            scene.load.once(`filecomplete-image-${r.key}`, () => this.textures.delete(r.key));
            scene.load.once('loaderror', (file) => { if (file?.key === r.key) this.textures.set(r.key, 'failed'); });
            if (!scene.load.isLoading?.()) scene.load.start();
        } catch (e) { this.textures.set(r.key, 'failed'); }
        return false;
    }

    _make(scene) {
        const bg = scene.add.rectangle(0, 0, 10, 10, 0x1b2a41).setOrigin(0.5, 1);
        const text = scene.add.text(0, 0, '', {
            fontFamily: 'monospace', fontSize: `${ICON_TEXT_PX}px`, fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5, 0.5);
        const img = scene.add.image(0, -2, '__DEFAULT').setOrigin(0.5, 1).setVisible(false);
        const box = scene.add.container(0, 0, [bg, text, img]).setDepth(5000);
        return { box, bg, text, img, shown: null };
    }

    /** Draw `r` into the icon; re-laid out only when what it shows changes. */
    _render(scene, ic, r) {
        const sprite = r.kind === 'sprite' && this.textureReady(scene, r);
        const sig = sprite ? `s:${r.key}` : `t:${r.glyph}`;
        if (ic.shown === sig) return;
        ic.shown = sig;
        if (sprite) {
            ic.img.setTexture(r.key).setVisible(true);
            ic.text.setVisible(false);
            const b = backingSize('sprite', { width: ic.img.width, height: ic.img.height });
            ic.bg.setSize(b.w, b.h);
        } else {
            ic.img.setVisible(false);
            ic.text.setText(r.glyph).setVisible(true);
            const b = backingSize('text', { width: ic.text.width, height: ic.text.height });
            ic.bg.setSize(b.w, b.h);
            ic.text.setPosition(0, -b.h / 2);   // centred in the box; a tall emoji line box overflows invisibly
        }
    }

    /** The thought bubble: a rounded light backing with two trailing dots, an image and a text stand-in. */
    _makeBubble(scene) {
        const g = scene.add.graphics();
        const text = scene.add.text(0, 0, '', {
            fontFamily: 'monospace', fontSize: `${ICON_TEXT_PX - 4}px`, fontStyle: 'bold', color: '#1b2a41'
        }).setOrigin(0.5, 0.5);
        const img = scene.add.image(0, 0, '__DEFAULT').setOrigin(0.5, 0.5).setVisible(false);
        const box = scene.add.container(0, 0, [g, text, img]).setDepth(5000);
        return { box, g, text, img, shown: null, w: 0, h: 0 };
    }

    /** Draw `r` into the bubble; the backing is redrawn only when its size changes. */
    _renderBubble(scene, bb, r) {
        const sprite = r.kind === 'sprite' && this.textureReady(scene, r);
        const sig = sprite ? `s:${r.key}` : `t:${r.glyph}`;
        if (bb.shown === sig) return;
        bb.shown = sig;
        let w, h;
        if (sprite) {
            bb.img.setTexture(r.key).setVisible(true);
            bb.text.setVisible(false);
            w = bb.img.width + BUBBLE_PAD * 2; h = bb.img.height + BUBBLE_PAD * 2;
        } else {
            bb.img.setVisible(false);
            bb.text.setText(r.glyph).setVisible(true);
            w = Math.max(bb.text.width || 0, ICON_TEXT_PX) + BUBBLE_PAD * 2; h = ICON_TEXT_PX + BUBBLE_PAD * 2;
        }
        if (w === bb.w && h === bb.h) return;
        bb.w = w; bb.h = h;
        const g = bb.g;
        g.clear();
        const dots = bubbleDots(w, h);
        g.fillStyle(BUBBLE_FILL, 1);
        g.lineStyle(1, BUBBLE_LINE, 1);
        g.fillRoundedRect(-w / 2, -h / 2, w, h, 5);
        g.strokeRoundedRect(-w / 2, -h / 2, w, h, 5);
        for (const d of dots) { g.fillCircle(d.x, d.y, d.r); g.strokeCircle(d.x, d.y, d.r); }
    }

    /** Per-frame: one action icon per needs NPC with a job (or a noticed/blocked state), and the pressing-need bubble. */
    update() {
        const sys = win().npcNeedsSystem;
        const mgr = win().npcBehaviorManager;
        if (!sys || !mgr) return;
        const scenario = win().gameScenario;
        const actionIcons = scenario?.actionIcons;
        const optIn = scenario?.showPressingNeeds === true;
        const playerRoom = win().currentPlayerRoom;
        for (const id of sys.states.keys()) {
            const st = sys.getState(id);
            const b = mgr.getBehavior?.(id);
            const sprite = b?.sprite;
            const roomId = b?.roomId;
            const seen = !!(st && sprite && sprite.active && sprite.visible && !sprite.destroyed)
                && iconShown({ npcRoom: roomId, playerRoom, dark: roomIsDark(roomId) });
            const bubble = seen ? pressingBubble(st, actionIcons, optIn) : null;
            let bb = this.bubbles.get(id);
            if (!bubble) { if (bb) bb.box.setVisible(false); }
            else {
                if (!bb || !bb.box.scene) { bb = this._makeBubble(sprite.scene); this.bubbles.set(id, bb); }
                this._renderBubble(sprite.scene, bb, resolveIcon(bubble.value, TEXT_STANDIN[bubble.key] || DEFAULT_ICONS.fallback));
                const at = npcIconAnchor(sprite);
                const pos = bubblePosition(at, bb.w, bb.h);
                bb.box.setPosition(pos.x, pos.y).setVisible(true);
                bb.box.setData('need', bubble.need);
                bb.box.setData('ratio', bubble.ratio);
                bb.box.setData('icon', bb.shown);
                bb.box.setScale(bubble.pulse && !reducedMotion() ? 1 + 0.12 * Math.abs(Math.sin(Date.now() / 400)) : 1);
            }
            const entry = !seen ? null
                : (st.job ? pickIconEntry(st.job, actionIcons, st.job.targetId ? targetInfo(st.job.targetId, this.targets) : null)
                    : stateIconEntry(st, actionIcons, optIn));
            let ic = this.icons.get(id);
            if (!entry) { if (ic) ic.box.setVisible(false); continue; }
            const r = resolveIcon(entry.value, TEXT_STANDIN[entry.key] || DEFAULT_ICONS.fallback);
            if (!ic || !ic.box.scene) {
                ic = this._make(sprite.scene);
                this.icons.set(id, ic);
            }
            this._render(sprite.scene, ic, r);
            // Just above the head (its first opaque row), standing or seated, not the 80 px frame's top
            const at = npcIconAnchor(sprite);
            ic.box.setPosition(at.x, at.y).setVisible(true);
            const winding = !!st.job?.windingUp;
            ic.box.setData('windup', winding);
            ic.box.setData('job', st.job?.targetId || '');
            ic.box.setData('key', entry.key);
            ic.box.setData('icon', ic.shown);
            ic.box.setScale(winding ? 1 + 0.35 * Math.abs(Math.sin(Date.now() / 120)) : 1);
        }
    }
}

export function installNpcActionIcons(scene) {
    const w = win();
    if (!w.npcActionIcons) w.npcActionIcons = new NpcActionIcons();
    const inst = w.npcActionIcons;
    if (scene?.events && inst.sceneHooked !== scene) {
        inst.sceneHooked = scene;
        scene.events.on('update', () => { try { inst.update(); } catch (e) { /* never break a frame */ } });
    }
    return inst;
}
