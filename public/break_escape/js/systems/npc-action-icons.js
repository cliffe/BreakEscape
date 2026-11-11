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
 *                          While queued at a shared machine (job.phase "queued", slice 10) only
 *                          "queue" is tried (default icon:npc-queue, an hourglass).
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
 * Slice 14 (OFFICE_LIFE_PLAN 10.3), also under showPressingNeeds, in the same thought-bubble slot:
 *   - the avoidance bubble while getState().avoiding names someone (after a turn-back, or a story
 *     need going anyway): that NPC's face, cropped at native size from their own south-facing
 *     idle frame (top rows to the chin, a Phaser crop, never scaled), and icon:npc-avoid;
 *   - a parked need (getState().parked) when nothing is pressing: the need's icon greyed (alpha
 *     and a grey tint) with a badge: npc-closed for no_source, npc-queue with a red cross for
 *     queue, npc-avoid for avoid.
 *   Order: avoidance, then the pressing need, then a parked need.
 *
 * Access slice 9.2 (plan 5.5): a judged NPC with no job shows `blocked` while the server's tell is
 * 1 or 2, pulsing at 2. Once the cause of its last failure has cleared (getState().causeCleared,
 * q17) the same icon is drawn faded (FADED_ALPHA, no pulse) while the mood lingers, and goes
 * when the tell falls to 0.
 *
 * While the NPC is saying a chat line or a grumble (getState().talking, slices 8 and 14) its
 * speech bubble replaces both the action icon and the thought bubble.
 *
 * Shown only for NPCs in the player's current room, and not while that room is dark (a room
 * without lighting counts as lit). A job that is winding up (npc_action_windup) pulses its icon
 * before the NPC moves. Reads window.npcNeedsSystem.getState(); changes nothing in the needs system.
 */
import { iconShown, roomIsDark, npcIconAnchor } from './npc-office-visuals.js';

// The 16x16 NPC icon set (OFFICE_LIFE_PLAN 9.1, assets/icons/npc-<name>.png), drawn at native
// size. Referenced by name only, so a swapped file needs no code change. No fallback art: text.
export const NPC_ICON_NAMES = ['caffeine', 'thirst', 'hunger', 'rest', 'social', 'work', 'curiosity',
    'post', 'printout', 'print', 'queue', 'file', 'blocked', 'noticed', 'avoid', 'closed'];
export const DEFAULT_ICONS = Object.freeze({
    ...Object.fromEntries(NPC_ICON_NAMES.map(n => [n, `icon:npc-${n}`])),
    // Slice 19 (OFFICE_LIFE_PLAN 12.5): on a desk-phone call, the desk phone itself (20x17, native size)
    phone: Object.freeze({ sprite: 'phone1' }),
    fallback: '•'
});

// Text shown while a default texture loads (or if it fails)
const TEXT_STANDIN = { caffeine: 'C', thirst: 'W', hunger: 'F', rest: 'Z', work: 'PC', social: 'S', curiosity: '?',
    post: 'P', printout: 'P', print: 'Pr', queue: '…', file: 'Fi', blocked: 'X', noticed: '!', avoid: '~', closed: '#', phone: 'Ph' };

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
    // Waiting in a queue (slice 10): the hourglass, whatever the machine (a scenario "queue" entry wins)
    if (job.phase === 'queued') return firstIcon(['queue'], actionIcons);
    // Access slice 9.2 A (plan 5.5): a visit (a check, a workaround) shows the work picture
    if (job.kind === 'visit') return firstIcon(['work'], actionIcons);
    const keys = (job.kind === 'carry' || job.itemId)
        ? [job.files ? 'file' : null, job.tag, 'curiosity']
        : (target ? [target.id, target.phone ? 'phone' : null, (job.prints || target.print) ? 'print' : null, job.need, target.satisfies, target.type]
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
    // Access slice 9.2 A (plan 5.5): while the server's tell is 1 or 2 an NPC whose uses are judged
    // shows `blocked` (pulsing at 2), whatever showPressingNeeds says: declaring work has opted in
    const judged = !!(st.judged && (st.judged.work || st.judged.social_media));
    if (!st.noticed && judged && st.tell >= 1) {
        const e = firstIcon(['blocked'], actionIcons, { fallback: false });
        // Review R2 n4: with no blocked icon, fall through to office life's own rule
        // q17 (user decision 2026-11-11): once the cause has cleared the icon fades (no pulse) while
        // the mood lingers, fainter at tell 1 than at 2; it goes when the tell falls to 0
        if (e && st.causeCleared) return { ...e, pulse: false, fading: true, alpha: fadedAlpha(st.tell) };
        if (e) return { ...e, pulse: st.tell >= 2 };
    }
    const key = st.noticed ? 'noticed' : (st.blockedNeed ? 'blocked' : null);
    if (!key) return null;
    if (!optIn && !usable((actionIcons || {})[key])) return null;
    return firstIcon([key], actionIcons, { fallback: false });
}

/** q17: the faded frustration icon's alpha: 0.6 at tell 2, 0.4 at tell 1. */
export const FADED_ALPHA = Object.freeze({ 2: 0.6, 1: 0.4 });
export function fadedAlpha(tell) {
    return tell >= 2 ? FADED_ALPHA[2] : FADED_ALPHA[1];
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

export const PARKED_BADGE = Object.freeze({ no_source: 'closed', queue: 'queue', avoid: 'avoid' });
export const PARKED_ALPHA = 0.5;
export const PARKED_TINT = 0x9a9a9a;

/**
 * Pure (slice 14): the thought bubble's content for getState() `st`, or null. Avoidance first
 * ({ kind: 'avoid', npcId }), then the pressing need ({ kind: 'pressing', ...pressingBubble }), then
 * the first parked need by name ({ kind: 'parked', need, reason, badge, key, value }). Off unless `on`.
 */
export function thoughtBubble(st, actionIcons = {}, on = false) {
    if (!on || !st) return null;
    if (typeof st.avoiding === 'string' && st.avoiding) return { kind: 'avoid', npcId: st.avoiding };
    const p = pressingBubble(st, actionIcons, on);
    if (p) return { kind: 'pressing', ...p };
    // Access 9.2 (R5 n3): a reload's `held` park is silent, so it shows no bubble
    const parked = Array.isArray(st.parked) ? st.parked.find(x => x && x.need && x.reason !== 'held' && !(st.job && st.job.need === x.need)) : null;
    if (!parked) return null;
    const entry = firstIcon([parked.need], actionIcons);
    return { kind: 'parked', need: parked.need, reason: parked.reason, badge: PARKED_BADGE[parked.reason] || 'closed',
        key: entry.key === 'fallback' ? parked.need : entry.key, value: entry.value };
}

/**
 * Pure (slice 14): the head of a walk frame, from its opaque columns per row (`rows[y]` is
 * [minX, maxX] or null). From the top opaque row down to the neck: the narrowest row 8 to 22 rows
 * down that comes before the shoulders widen (3 px or more). { x, y, w, h } in frame pixels, or null.
 */
export function headCrop(rows) {
    const top = rows.findIndex(r => r);
    if (top < 0) return null;
    const w = i => (rows[i] ? rows[i][1] - rows[i][0] + 1 : 0);
    let neck = null;
    for (let i = top + 8; i <= Math.min(top + 22, rows.length - 2); i++) {
        if (!rows[i]) break;
        if (neck === null || w(i) <= w(neck)) neck = i;
        if (w(i + 1) >= w(neck) + 3) break;
    }
    const chin = neck ?? Math.min(rows.length - 1, top + 14);
    let x0 = Infinity, x1 = -Infinity;
    for (let i = top; i <= chin; i++) if (rows[i]) { x0 = Math.min(x0, rows[i][0]); x1 = Math.max(x1, rows[i][1]); }
    return { x: x0, y: top, w: x1 - x0 + 1, h: chin - top + 1 };
}

/** The south-facing idle frame of a walk atlas, else the sprite's current frame. */
export const FACE_FRAME = 'breathing-idle_south_frame_000';

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
                    print: isPrinter({ type: d.type, officeType: d.officeType, preset }),
                    ...(typeof d.phoneOwner === 'string' && d.phoneOwner ? { phone: true } : {}) };
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
    constructor() { this.icons = new Map(); this.bubbles = new Map(); this.windups = new Map(); this.targets = new Map(); this.sceneHooked = null; this.textures = new Map(); this.faces = new Map(); }

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
        // Slice 14: the avoided person's face (a crop of their frame), and a badge with its cross
        const face = scene.add.image(0, 0, '__DEFAULT').setOrigin(0, 0).setVisible(false);
        const badge = scene.add.image(0, 0, '__DEFAULT').setOrigin(0.5, 0.5).setVisible(false);
        const cross = scene.add.graphics().setVisible(false);
        const box = scene.add.container(0, 0, [g, text, img, face, badge, cross]).setDepth(5000);
        return { box, g, text, img, face, badge, cross, shown: null, w: 0, h: 0 };
    }

    /** The backing and its two trailing dots, redrawn only when the size changes. */
    _drawBacking(bb, w, h) {
        if (w === bb.w && h === bb.h) return;
        bb.w = w; bb.h = h;
        const g = bb.g;
        g.clear();
        g.fillStyle(BUBBLE_FILL, 1);
        g.lineStyle(1, BUBBLE_LINE, 1);
        g.fillRoundedRect(-w / 2, -h / 2, w, h, 5);
        g.strokeRoundedRect(-w / 2, -h / 2, w, h, 5);
        for (const d of bubbleDots(w, h)) { g.fillCircle(d.x, d.y, d.r); g.strokeCircle(d.x, d.y, d.r); }
    }

    /** Back to a plain bubble: no face, badge or cross; the icon undimmed. */
    _plain(bb) {
        bb.face.setVisible(false);
        bb.badge.setVisible(false);
        bb.cross.setVisible(false);
        bb.img.setAlpha?.(1);
        bb.img.clearTint?.();
        bb.text.setAlpha?.(1);
    }

    /**
     * { key, frame, crop } for an NPC's face: its walk texture's south idle frame (else its current
     * frame), cropped to the head from the frame's own alpha. Measured once per texture and frame.
     */
    _faceOf(scene, npcId) {
        const sp = win().npcBehaviorManager?.getBehavior?.(npcId)?.sprite;
        const key = sp?.texture?.key;
        if (!key || key === '__MISSING') return null;
        const tex = scene.textures.get(key);
        const frame = tex?.has?.(FACE_FRAME) ? FACE_FRAME : sp.frame?.name;
        const id = `${key}|${frame}`;
        if (this.faces.has(id)) return this.faces.get(id);
        const f = tex.get(frame);
        const W = f?.realWidth || f?.width || 0, H = f?.realHeight || f?.height || 0;
        const rows = [];
        for (let y = 0; y < H; y++) {
            let x0 = -1, x1 = -1;
            for (let x = 0; x < W; x++) {
                const a = scene.textures.getPixelAlpha(x, y, key, frame);
                if (a > 0) { if (x0 < 0) x0 = x; x1 = x; }
            }
            rows.push(x0 < 0 ? null : [x0, x1]);
        }
        const crop = headCrop(rows);
        const out = crop ? { key, frame, crop } : null;
        this.faces.set(id, out);
        return out;
    }

    /** Avoidance: [face][storm cloud] on the light backing. */
    _renderAvoid(scene, bb, npcId) {
        const icon = resolveIcon(DEFAULT_ICONS.avoid, TEXT_STANDIN.avoid);
        const ready = this.textureReady(scene, icon);
        const face = this._faceOf(scene, npcId);
        const sig = `a:${npcId}:${ready}:${face ? face.key : ''}`;
        if (bb.shown === sig) return;
        bb.shown = sig;
        this._plain(bb);
        const fw = face ? face.crop.w : 0, fh = face ? face.crop.h : 0;
        const iw = ready ? 16 : ICON_TEXT_PX, ih = ready ? 16 : ICON_TEXT_PX;
        const w = fw + (fw ? 2 : 0) + iw + BUBBLE_PAD * 2, h = Math.max(fh, ih) + BUBBLE_PAD * 2;
        this._drawBacking(bb, w, h);
        bb.w = w; bb.h = h;
        if (face) {
            // Native size: the crop shows only the head; the frame is shifted so the head sits at the left
            bb.face.setTexture(face.key, face.frame).setCrop(face.crop.x, face.crop.y, face.crop.w, face.crop.h)
                .setPosition(Math.round(-w / 2 + BUBBLE_PAD - face.crop.x), Math.round(-fh / 2 - face.crop.y)).setScale(1).setVisible(true);
        }
        const ix = Math.round(-w / 2 + BUBBLE_PAD + fw + (fw ? 2 : 0) + iw / 2);
        if (ready) { bb.img.setTexture(icon.key).setPosition(ix, 0).setVisible(true); bb.text.setVisible(false); }
        else { bb.img.setVisible(false); bb.text.setText(icon.glyph).setPosition(ix, 0).setVisible(true); }
    }

    /** Parked: the need's icon greyed, a badge at the lower right (the queue badge crossed out in red). */
    _renderParked(scene, bb, bubble) {
        const r = resolveIcon(bubble.value, TEXT_STANDIN[bubble.key] || DEFAULT_ICONS.fallback);
        const badge = resolveIcon(DEFAULT_ICONS[bubble.badge], TEXT_STANDIN[bubble.badge]);
        const sprite = r.kind === 'sprite' && this.textureReady(scene, r);
        const bReady = this.textureReady(scene, badge);
        const sig = `p:${sprite ? r.key : r.glyph}:${bubble.badge}:${bReady}`;
        if (bb.shown === sig) return;
        bb.shown = sig;
        this._plain(bb);
        let w, h;
        if (sprite) {
            bb.img.setTexture(r.key).setPosition(0, 0).setVisible(true).setAlpha(PARKED_ALPHA).setTint(PARKED_TINT);
            bb.text.setVisible(false);
            w = bb.img.width + BUBBLE_PAD * 2 + 6; h = bb.img.height + BUBBLE_PAD * 2 + 4;
            bb.img.setPosition(-3, -2);
        } else {
            bb.img.setVisible(false);
            bb.text.setText(r.glyph).setPosition(-3, -2).setAlpha(PARKED_ALPHA).setVisible(true);
            w = Math.max(bb.text.width || 0, ICON_TEXT_PX) + BUBBLE_PAD * 2 + 6; h = ICON_TEXT_PX + BUBBLE_PAD * 2 + 4;
        }
        this._drawBacking(bb, w, h);
        bb.w = w; bb.h = h;
        const bx = Math.round(w / 2 - 5), by = Math.round(h / 2 - 5);
        if (bReady) bb.badge.setTexture(badge.key).setPosition(bx, by).setVisible(true);
        if (bubble.badge === 'queue') {
            const c = bb.cross;
            c.clear();
            c.lineStyle(2, 0xd02020, 1);
            c.lineBetween(bx - 6, by - 6, bx + 6, by + 6);
            c.lineBetween(bx + 6, by - 6, bx - 6, by + 6);
            c.setVisible(true);
        }
    }

    /** Draw `r` into the bubble; the backing is redrawn only when its size changes. */
    _renderBubble(scene, bb, r) {
        const sprite = r.kind === 'sprite' && this.textureReady(scene, r);
        const sig = sprite ? `s:${r.key}` : `t:${r.glyph}`;
        if (bb.shown === sig) return;
        bb.shown = sig;
        this._plain(bb);
        bb.img.setPosition(0, 0);
        bb.text.setPosition(0, 0);
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
        this._drawBacking(bb, w, h);
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
            // A speech bubble (slice 8, npc-world-bubbles.js) hides both while the NPC talks
            const talking = !!st?.talking;
            const bubble = seen && !talking ? thoughtBubble(st, actionIcons, optIn) : null;
            let bb = this.bubbles.get(id);
            if (!bubble) { if (bb) bb.box.setVisible(false); }
            else {
                if (!bb || !bb.box.scene) { bb = this._makeBubble(sprite.scene); this.bubbles.set(id, bb); }
                if (bubble.kind === 'avoid') this._renderAvoid(sprite.scene, bb, bubble.npcId);
                else if (bubble.kind === 'parked') this._renderParked(sprite.scene, bb, bubble);
                else this._renderBubble(sprite.scene, bb, resolveIcon(bubble.value, TEXT_STANDIN[bubble.key] || DEFAULT_ICONS.fallback));
                const at = npcIconAnchor(sprite);
                const pos = bubblePosition(at, bb.w, bb.h);
                bb.box.setPosition(pos.x, pos.y).setVisible(true);
                bb.box.setData('kind', bubble.kind);
                bb.box.setData('need', bubble.need || null);
                bb.box.setData('ratio', bubble.ratio ?? null);
                bb.box.setData('badge', bubble.badge || null);
                bb.box.setData('avoiding', bubble.npcId || null);
                bb.box.setData('icon', bb.shown);
                bb.box.setScale(bubble.pulse && !reducedMotion() ? 1 + 0.12 * Math.abs(Math.sin(Date.now() / 400)) : 1);
            }
            // Slice 19: on a desk-phone call (the owner at its desk, or a colleague at the phone) the phone
            const entry = (!seen || talking) ? null
                : st.call ? firstIcon(['phone'], actionIcons)
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
            ic.box.setData('pulse', !!entry.pulse);
            ic.box.setData('fading', !!entry.fading);
            ic.box.setAlpha?.(entry.fading ? entry.alpha : 1);
            ic.box.setScale(winding ? 1 + 0.35 * Math.abs(Math.sin(Date.now() / 120))
                : (entry.pulse && !reducedMotion() ? 1 + 0.12 * Math.abs(Math.sin(Date.now() / 400)) : 1));
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
