/**
 * NPC needs debug overlay: a small panel above each needs NPC with one bar per need
 * (initial letter, fill = level) and a line for the current job. Off by default.
 *
 * On when the scenario has `"needsDebugOverlay": true`, or from the console / a test:
 * window.__test.needs.overlay(true | false | null)   (null = back to the scenario flag).
 *
 * Bar colour: green above the need's urgentAt, amber at or below it, red when starved
 * (unmet for maxUnmetMin). Reads window.npcNeedsSystem; writes nothing back.
 * Cheap: positions follow the sprite each frame, bars and text are redrawn at REDRAW_MS,
 * graphics are made once per NPC and destroyed when the NPC's sprite goes (room unload,
 * NPC removed) or the needs state disappears. No physics, no input, fixed depth above
 * the world, so it changes no collisions, world depth sorting or clicks.
 */

// Phaser 3.60 measures a Text's ascent and descent once, when its style is made, and
// updateText() reuses them. A text made before VT323 arrived would keep the fallback
// font's line height, so the redraw asks the style to measure again first (code review R2
// m2). A text with no style (a test stub) is just redrawn.
export function refreshCanvasText(text) {
    if (text?.style && typeof text.style.update === 'function') return text.style.update(true);
    return text?.updateText?.();
}

export const REDRAW_MS = 200;
export const BAR = { w: 32, h: 4, gap: 3, letterW: 7, pad: 2 };
export const DEPTH = 5001;   // just above the action icon (5000)
export const COLOURS = { ok: 0x4caf50, urgent: 0xffb300, starved: 0xe53935, track: 0x263238, panel: 0x000000 };

/** Pure: colour key for one need. `cfg` is the normalised need { urgentAt, maxUnmetMin }. */
export function barColour(level, cfg = {}, unmetMs = 0) {
    if (cfg.maxUnmetMin && unmetMs >= cfg.maxUnmetMin * 60000) return 'starved';
    return level <= (cfg.urgentAt ?? 0) ? 'urgent' : 'ok';
}

/**
 * Pure: bar rows for an NPC, top to bottom in need-name order. Coordinates are local to
 * the panel's top-left. `needs` = { name: cfg }, `levels` = { name: 0-100 },
 * `lastSatisfiedAt` = { name: clockMs }.
 */
export const FRUSTRATION_COLOUR = 0xc0392b;

export function barLayout({ needs = {}, levels = {}, lastSatisfiedAt = {}, clockMs = 0, frustration = null } = {}, b = BAR) {
    const rows = Object.keys(needs).sort().map((name, i) => {
        const level = Math.max(0, Math.min(100, Number(levels[name]) || 0));
        return {
            need: name,
            letter: name.charAt(0).toUpperCase(),
            x: b.pad + b.letterW,
            y: b.pad + i * (b.h + b.gap),
            w: b.w,
            h: b.h,
            fillW: Math.round(b.w * level / 100),
            colour: barColour(level, needs[name], clockMs - (lastSatisfiedAt[name] ?? clockMs))
        };
    });
    // Access slice 9.2 A (plan 5.4): an F bar for the frustration the server holds, last
    if (Number.isFinite(frustration)) {
        const level = Math.max(0, Math.min(100, frustration));
        rows.push({ need: 'frustration', letter: 'F', x: b.pad + b.letterW, y: b.pad + rows.length * (b.h + b.gap), w: b.w, h: b.h,
            fillW: Math.round(b.w * level / 100), colour: FRUSTRATION_COLOUR });
    }
    return rows;
}

/**
 * Pure: the job line, e.g. "goto amara_pc", "using 4s office_coffee", "frozen", "idle".
 * " leashed" is added when a room rule (needsRooms, needsAvoidRooms, needsPrivateTo) removed an
 * option: on the job it chose (job.leashed), or while idle with an urgent need it left with
 * nothing (leashNoted). " private" is added the same way when only other owners' private
 * objects were passed over (job.privateSkipped, privateNoted): expected, so not "leashed".
 */
export function jobLabel(st, job) {
    if (!st) return '';
    if (st.scriptSuspended) return 'suspended';
    let label = jobBase(st, job);
    const leashed = job ? job.leashed === true : Object.values(st.leashNoted || {}).some(Boolean);
    const priv = job ? job.privateSkipped === true : Object.values(st.privateNoted || {}).some(Boolean);
    if (leashed) label += ' leashed';
    if (priv) label += ' private';
    return label;
}

function jobBase(st, job) {
    if (st.mode === 'frozen') return job ? `frozen ${job.targetId || ''}`.trim() : 'frozen';
    if (!job) return st.mode === 'returning' ? 'returning' : 'idle';
    const target = job.targetId || job.itemId || '';
    if (job.windupUntil && st.clockMs < job.windupUntil) return `windup ${target}`;
    if (job.phase === 'using') return `using ${Math.max(0, Math.ceil((job.useUntil - st.clockMs) / 1000))}s ${target}`;
    return `${job.phase || 'job'} ${target}`.trim();
}

/**
 * Pure: the job line broken at spaces into lines of at most `maxChars` (a longer word keeps
 * its own line), so the label stays a narrow block centred over the NPC instead of one long
 * line running from the NPC out of the room (UX access R1 finding 8).
 */
export const LABEL_MAX_CHARS = 16;
export function wrapLabel(text, maxChars = LABEL_MAX_CHARS) {
    const lines = [];
    let line = '';
    for (const word of String(text || '').split(/\s+/).filter(Boolean)) {
        if (line && line.length + 1 + word.length > maxChars) { lines.push(line); line = word; }
        else line = line ? `${line} ${word}` : word;
    }
    if (line) lines.push(line);
    return lines.join('\n');
}

const win = () => (typeof window !== 'undefined' ? window : {});
// VT323: a pixel font, like the rest of the game's text (UX access R2, finding 13)
const FONT = { fontFamily: "'VT323', monospace", fontSize: '10px', color: '#ffffff', stroke: '#000000', strokeThickness: 2 };

export class NpcNeedsDebug {
    constructor() {
        this.panels = new Map();   // npcId -> { gfx, letters: Map, label, sprite }
        this.forced = null;        // null = follow the scenario flag
        this.sceneHooked = null;
        this._lastDraw = 0;
    }

    get enabled() {
        return this.forced !== null ? this.forced : win().gameScenario?.needsDebugOverlay === true;
    }

    setEnabled(on) {
        this.forced = on === null || on === undefined ? null : !!on;
        if (!this.enabled) this.clear();
        this._lastDraw = 0;
        return this.enabled;
    }

    clear() {
        for (const id of [...this.panels.keys()]) this._destroy(id);
    }

    _destroy(id) {
        const p = this.panels.get(id);
        if (!p) return;
        try { p.gfx.destroy(); p.label.destroy(); for (const t of p.letters.values()) t.destroy(); } catch (e) { /* scene gone */ }
        this.panels.delete(id);
    }

    _panel(id, sprite) {
        let p = this.panels.get(id);
        if (p && (p.sprite !== sprite || !p.gfx.scene)) { this._destroy(id); p = null; }
        if (p) return p;
        const scene = sprite.scene;
        const res = Math.max(2, Math.ceil(scene.scale?.displayScale ? 1 / scene.scale.displayScale.x : 4));
        const label = scene.add.text(0, 0, '', { ...FONT, align: 'center', resolution: res }).setOrigin(0.5, 1).setDepth(DEPTH);
        p = { gfx: scene.add.graphics().setDepth(DEPTH), letters: new Map(), label, sprite, res, h: 0 };
        this.panels.set(id, p);
        // VT323 is fetched at boot (utils/canvas-fonts.js); text made before it arrived
        // redraws once it has (review R1 m5)
        const made = p;
        win().canvasFontsReady?.then?.(() => {
            try { refreshCanvasText(made.label); for (const t of made.letters.values()) refreshCanvasText(t); } catch (e) { /* gone */ }
        });
        return p;
    }

    _draw(p, rows, text) {
        const b = BAR;
        const h = b.pad * 2 + rows.length * (b.h + b.gap) - b.gap;
        const w = b.pad * 2 + b.letterW + b.w;
        p.h = h; p.w = w;
        p.gfx.clear();
        p.gfx.fillStyle(COLOURS.panel, 0.55).fillRect(0, 0, w, h);
        for (const r of rows) {
            p.gfx.fillStyle(COLOURS.track, 1).fillRect(r.x, r.y, r.w, r.h);
            if (r.fillW > 0) p.gfx.fillStyle(COLOURS[r.colour], 1).fillRect(r.x, r.y, r.fillW, r.h);
            let t = p.letters.get(r.need);
            if (!t) {
                t = p.gfx.scene.add.text(0, 0, r.letter, { ...FONT, fontSize: '7px', strokeThickness: 0, resolution: p.res }).setOrigin(0, 0.5).setDepth(DEPTH);
                p.letters.set(r.need, t);
            }
            t.setData('dy', r.y + r.h / 2);
        }
        const wrapped = wrapLabel(text);
        if (p.label.text !== wrapped) p.label.setText(wrapped);
    }

    _place(p) {
        const s = p.sprite;
        const top = s.getTopCenter ? s.getTopCenter() : { x: s.x, y: s.y - 40 };
        const x = Math.round(top.x - p.w / 2), y = Math.round(top.y - 14 - p.h);   // leave room for the action icon (frames have empty headroom)
        p.gfx.setPosition(x, y);
        for (const t of p.letters.values()) t.setPosition(x + BAR.pad, y + t.getData('dy'));
        p.label.setPosition(x + Math.round(p.w / 2), y - 1);
    }

    /** Per-frame. */
    update(now = Date.now()) {
        if (!this.enabled) { if (this.panels.size) this.clear(); return; }
        const sys = win().npcNeedsSystem;
        const mgr = win().npcBehaviorManager;
        if (!sys || !mgr) return;
        const redraw = now - this._lastDraw >= REDRAW_MS;
        if (redraw) this._lastDraw = now;
        for (const id of [...this.panels.keys()]) if (!sys.states.has(id)) this._destroy(id);
        for (const [id, s] of sys.states) {
            const sprite = mgr.getBehavior?.(id)?.sprite;
            if (!sprite || !sprite.active || sprite.destroyed || !sprite.scene) { this._destroy(id); continue; }
            const fresh = !this.panels.has(id) || this.panels.get(id).sprite !== sprite;
            const p = this._panel(id, sprite);
            if (redraw || fresh) {
                const judged = !!(s.needs.work && sys._judged?.(s, 'work')) || !!s.needs.social_media;
                const rows = barLayout({ needs: s.needs, levels: s.levels, lastSatisfiedAt: s.lastSatisfiedAt, clockMs: sys.clockMs,
                    frustration: judged || s.frustration > 0 ? s.frustration : null });
                this._draw(p, rows, `${id}: ${jobLabel({ ...s, clockMs: sys.clockMs }, s.job)}`);
            }
            const vis = !!sprite.visible;
            p.gfx.setVisible(vis); p.label.setVisible(vis);
            for (const t of p.letters.values()) t.setVisible(vis);
            if (vis) this._place(p);
        }
    }
}

export function installNpcNeedsDebug(scene) {
    const w = win();
    if (!w.npcNeedsDebug) w.npcNeedsDebug = new NpcNeedsDebug();
    const inst = w.npcNeedsDebug;
    if (scene?.events && inst.sceneHooked !== scene) {
        inst.sceneHooked = scene;
        scene.events.on('update', () => { try { inst.update(); } catch (e) { /* never break a frame */ } });
        scene.events.once('shutdown', () => { inst.clear(); inst.sceneHooked = null; });
    }
    return inst;
}
