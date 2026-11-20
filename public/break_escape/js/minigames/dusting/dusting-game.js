/**
 * Fingerprint dusting minigame.
 *
 * Five steps on one 128 x 128 canvas: find the latent print with a low torch, choose a powder, dust it so the
 * ridges appear, lift it with tape, then compare the lift with reference cards. Nothing here can fail: no timer,
 * no lockout, and the worst outcome is a lower-quality lift. Wrong choices show on the canvas and in one plain
 * sentence on why.
 *
 * Completes with `complete(true, { quality, rating, pattern, identified, surface, powder, objectId, roomId })`
 * once the lift is mounted (closing after the peel keeps the lift as unidentified). Closing earlier completes
 * with `{ cancelled: true }`; "Use normally" with `{ cancelled: true, useNormally: true }`.
 */
import { MinigameScene } from '../framework/base-minigame.js';
import { generatePrint, hashString, mulberry32, patternForOwner, PATTERNS, whorlShapeFor, WHORL_SHAPES } from './fingerprint-generator.js';
import {
    SURFACES, POWDERS, TOOLS, DIFFICULTY, DustField, TapeGrid, surfaceForObject, contrastFactor, findSheen, findGlint, findFloorScale,
    liftQuality, ratingFor, brushFeel, packProgress, upsampleInto, saveProgress, loadProgress, clearProgress, hintNudgeDue, NUDGE_TEXT, NUDGE_MISSES, NUDGE_IDLE_MS, developedDensity, wrongPowderReason, decoyPatterns, nextNearState, zoomScale, zoomPlan, zoomBudgetH, ZOOM_MAX_H_SHORT,
    zoomPlanBeside, ZOOM_STATUS_MAX_H, ZOOM_CHROME_H
} from './dusting-model.js';
import { pickLiftMarks, pickDecoyMarks, compareFeatures, featuresOf, mismatchReason, REF_WORDS, pairMarkTags, cropAround, cropSide, fitCropToMarks, markGlyph, describeMarks, uprightMarks, rotateUpright } from './print-features.js';
import { ART_SLOTS, SURFACE_SLOT, preloadArt, onArtLoaded, drawSlot, artRect, hasArt, slotCanvas, refreshSlotCanvases } from './dusting-art.js';
import { displayNameForOwner, bestLiftFromObject } from '../../systems/biometric-samples.js';
import { displayDashes } from '../../utils/display-dashes.js';
import { resolveObjectField } from '../../utils/conditional-text.js';

// Load dusting-specific CSS
if (!document.getElementById('dusting-css')) {
    const dustingCSS = document.createElement('link');
    dustingCSS.rel = 'stylesheet';
    dustingCSS.href = '/break_escape/css/dusting.css';
    dustingCSS.id = 'dusting-css';
    document.head.appendChild(dustingCSS);
}

const N = 128;

// The footer row when _placeFoot has moved it out of the panel (phone portrait: into the body; short landscape compare: into the root).
const MOVED_FOOT = '.dusting-body > .dusting-foot, .dusting-root > .dusting-foot';

// Button labels with a long and a short form. Parts: a plain string (always shown), {x} (long mode only: display:none
// in short landscape), {s} (short landscape only: visually hidden detail read after the visible text) or {v:[long, short]}
// (swapped by _applyLabels). The accessible name therefore begins with the exact visible text and may add detail
// after it (WCAG 2.5.3): "Fine (F), fine brush". Long mode shows and reads the same words. Parts are fixed strings and numbers only.
const lblHtml = parts => parts.map(q => (typeof q === 'string' ? q
    : q.x !== undefined ? `<span class="dusting-lx">${q.x}</span>`
    : q.s !== undefined ? `<span class="dusting-ls">${q.s}</span>`
    : `<span class="dusting-lv" data-long="${q.v[0]}" data-short="${q.v[1]}">${q.v[0]}</span>`)).join('');
const lblPlain = parts => parts.map(q => (typeof q === 'string' ? q : q.x !== undefined ? q.x : q.s !== undefined ? '' : q.v[0])).join('');
const lblSpan = parts => `<span class="dusting-lbl">${lblHtml(parts)}</span>`;
const LIFT_LOCKED = pct => ['Lift (', { x: 'needs ' }, pct, { x: ' coverage' }, ')', { s: `, needs ${pct} coverage` }];
const LIFT_READY = ['Lift (L)'];

/** Phone on its side: at or under this height the kit uses two columns (see dusting.css). */
export const SHORT_LANDSCAPE_MAX_H = 500;
/** Height the title, frame padding and canvas border take in the two-column layout. */
export const SHORT_LANDSCAPE_CHROME = 100;
// Does the dusting panel fit the window height? Unused by the game now (the cards are always 1x beside the
// magnified pair); kept exported for the compare-fit test.
export function refCardsFit(root, viewportHeight, pad = 24) {
    if (!root || typeof root.getBoundingClientRect !== 'function' || !viewportHeight) return true;
    return root.getBoundingClientRect().height + pad <= viewportHeight;
}
/** Next card for the V key: lift (null) -> 0 -> 1 -> ... -> count-1 -> lift. */
export function nextView(current, count) {
    if (!count) return null;
    if (current === null || current === undefined) return 0;
    return current + 1 < count ? current + 1 : null;
}
const STEPS = ['find', 'powder', 'dust', 'lift', 'compare'];
const STEP_NAMES = { find: 'Find', powder: 'Powder', dust: 'Dust', lift: 'Lift', compare: 'Compare' };
const NEAR_TEXT = 'Faint ridges catch the light here.';
const KEY_TICK_MS = 70;
const STORE_HC = 'breakEscape.dusting.highContrast';
const STORE_STEADY = 'breakEscape.dusting.steadyHand';
const TAPE_RADIUS = 9;
const PUFF_RADIUS = 30;
// A held Space ticks in place (about 14 a second): gentler per tick than a moving stroke (see BRUSH_FEEL in the model).
const KEY_HOLD_GENTLE = 0.4;
// UI-side only: extra haze drawn over fogged furrows so over-brushing is visible (the model's scores are unchanged).
const FOG_HAZE = 1.4;

// m05 blind B #7: the fine brush lays a ~5 px strip per pass (the feather ~14 px), so sweeps a
// little apart leave stripes and coverage stalls at 23 to 36% against easy's 40%. It is the
// default tool for black and silver. After this many fine strokes below the lift threshold the
// coach suggests the feather brush.
export const FINE_SWITCH_AFTER_STROKES = 6;

/**
 * Coach line for heavy powder. Lift only unlocks at minCoverage, so "or lift now" is offered only once
 * it has; below that the line says what to do (Puff the heavy spots, keep brushing lightly) and when Lift unlocks.
 */
export function foggyCoach(coverage, minCoverage) {
    if (coverage >= minCoverage) {
        return 'Powder is filling the furrows between ridges in places and the lines are blurring. Use Puff to clear it, or lift now.';
    }
    return `Powder is building up in places and starting to blur the lines. Use Puff to clear the heavy spots, then keep brushing lightly until Lift unlocks at ${Math.round(minCoverage * 100)}%.`;
}

/** True when the coach should suggest swapping the fine brush for the feather brush. */
export function shouldSuggestFeather({ tool, strokes, coverage, minCoverage, tools }) {
    return tool === 'fine' && Array.isArray(tools) && tools.includes('broad')
        && strokes >= FINE_SWITCH_AFTER_STROKES && coverage < minCoverage;
}
export const FEATHER_SUGGESTION = 'The fine brush lays a narrow line, so gaps stay between your strokes. Try the feather brush (B) to cover the print, then the fine brush for any gaps.';

const FORENSIC = {
    examine: 'Latent prints are left by sweat and skin oils. A light held low across the surface makes the residue catch the light.',
    find: 'Latent prints are left by sweat and skin oils. A light held low across the surface makes the residue catch the light.',
    powder: 'Powder sticks to that residue. Examiners pick a powder that contrasts with the surface: dark on pale, light on dark, magnetic on textured plastic.',
    dust: 'Over-brushing fills the furrows between ridges and destroys the detail. Less is more.',
    lift: 'Lifting tape moves the powdered print onto a backing card, so it can be kept as evidence.',
    compare: 'About 60 to 65% of prints are loops, 30 to 35% whorls and around 5% arches. Examiners check the class first (the pattern, and which way a loop opens), then the minutiae: where ridges end or split.'
};
const FORENSIC_MATCH = 'England and Wales dropped the fixed 16-point standard in 2001; examiners now judge the whole comparison.';

const PATTERN_INFO = {
    loop: { label: 'Loop', desc: 'Ridges enter and leave on the same side. One delta.', why: 'A loop has one delta and ridges that turn back on themselves.' },
    whorl: { label: 'Whorl', desc: 'Ridges circle round a centre. Two deltas.', why: 'A whorl has two deltas and ridges that circle a centre.' },
    arch: { label: 'Arch', desc: 'Ridges rise like a hill and run out the other side. No deltas.', why: 'An arch has no delta: the ridges just rise and fall like a hill.' }
};

const PATTERN_SVG = {
    loop: '<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 44V26a13 13 0 0 1 26 0v10"/><path d="M12 44V27a7 7 0 0 1 14 0v8"/><path d="M19 44V28"/></g><path d="M36 44l5-7 5 7z" fill="currentColor"/></svg>',
    whorl: '<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="24" cy="22" r="17"/><circle cx="24" cy="22" r="11"/><circle cx="24" cy="22" r="5"/></g><path d="M3 47l4-6 4 6zM37 47l4-6 4 6z" fill="currentColor"/></svg>',
    arch: '<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 38Q24 8 45 38"/><path d="M3 44Q24 20 45 44"/><path d="M3 32Q24 0 45 32"/></g></svg>'
};

/**
 * Whorl layout for a decoy card. A whorl decoy beside a whorl lift is the hard case: two whorls from the same
 * jittered layout read as one print (m09 confirm). On easy and medium the decoy always uses a layout other than the
 * lift's (cores and deltas moved 5 to 10 px, visible at card size); on hard it takes the lift's own layout, so only
 * the minutiae tell them apart. Any other pairing keeps the person's own layout. Returns null for "use the owner's".
 * @returns {number|null}
 */
export function decoyWhorlShape(decoyName, decoyPattern, liftPattern, liftOwner, rule, k = 0) {
    if (decoyPattern !== 'whorl' || liftPattern !== 'whorl') return null;
    const liftShape = whorlShapeFor(liftOwner);
    if (rule === 'all') return liftShape;
    const own = whorlShapeFor(decoyName);
    if (own !== liftShape) return null;
    return (liftShape + 1 + (k % (WHORL_SHAPES.length - 1))) % WHORL_SHAPES.length;
}

const printCache = new Map();
function cachedPrint(opts) {
    const key = `${opts.owner}|${opts.pattern || ''}|${opts.variant ?? ''}|${opts.partial ? 1 : 0}|${opts.whorlShape ?? ''}`;
    if (!printCache.has(key)) {
        if (printCache.size > 24) printCache.clear();
        printCache.set(key, generatePrint({ size: N, ...opts }));
    }
    return printCache.get(key);
}

/** The one phone-width rule, same as the CSS (max-width: 760px): exactly 760 is phone. innerWidth is the fallback without matchMedia. */
function isPhoneWidth() {
    return window.matchMedia ? window.matchMedia('(max-width: 760px)').matches : window.innerWidth <= 760;
}

function readStore(key) { try { return window.localStorage.getItem(key) === '1'; } catch (e) { return false; } }
function writeStore(key, on) { try { window.localStorage.setItem(key, on ? '1' : '0'); } catch (e) { /* ignore */ } }

function hexToRgb(h) {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(h);
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0];
}

function escapeHtml(s) {
    return displayDashes(String(s ?? '')).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Copy a print's arrays shifted by (sx, sy) so the print sits somewhere different on the surface. */
function shiftPrint(p, sx, sy) {
    const ridges = new Float32Array(N * N), mask = new Float32Array(N * N);
    for (let y = 0; y < N; y++) {
        const yy = y - sy;
        if (yy < 0 || yy >= N) continue;
        for (let x = 0; x < N; x++) {
            const xx = x - sx;
            if (xx < 0 || xx >= N) continue;
            ridges[y * N + x] = p.ridges[yy * N + xx];
            mask[y * N + x] = p.mask[yy * N + xx];
        }
    }
    const mv = o => ({ ...o, x: o.x + sx, y: o.y + sy });
    return {
        ...p, ridges, mask,
        cores: p.cores.map(mv), deltas: p.deltas.map(mv), minutiae: p.minutiae.map(mv),
        centre: p.centre ? mv(p.centre) : p.centre,
        bounds: { x: p.bounds.x + sx, y: p.bounds.y + sy, w: p.bounds.w, h: p.bounds.h }
    };
}

/** Feathered copy of a mask (two box-blur passes each way), so drawn fog fades out at the print's edge. */
function softenMask(mask, rad) {
    let a = Float32Array.from(mask), b = new Float32Array(N * N);
    for (let pass = 0; pass < 2; pass++) {
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
            let t = 0, n = 0;
            for (let k = -rad; k <= rad; k++) { const xx = x + k; if (xx >= 0 && xx < N) { t += a[y * N + xx]; n++; } }
            b[y * N + x] = t / n;
        }
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
            let t = 0, n = 0;
            for (let k = -rad; k <= rad; k++) { const yy = y + k; if (yy >= 0 && yy < N) { t += b[yy * N + x]; n++; } }
            a[y * N + x] = t / n;
        }
    }
    return a;
}

/** Box-blurred copy of the fog field, so heavy brushing smears out past the stroke edge instead of ending on it. */
function softenField(field, rad) {
    const a = new Float32Array(N * N), b = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++) a[i] = field.fog(i);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        let t = 0;
        for (let k = -rad; k <= rad; k++) { const xx = x + k; if (xx >= 0 && xx < N) t += a[y * N + xx]; }
        b[y * N + x] = t / (2 * rad + 1);
    }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        let t = 0;
        for (let k = -rad; k <= rad; k++) { const yy = y + k; if (yy >= 0 && yy < N) t += b[yy * N + x]; }
        a[y * N + x] = Math.min(0.35, t / (2 * rad + 1) * 1.25);
    }
    return a;
}

export class DustingMinigame extends MinigameScene {
    // The X sits inside the kit's frame (critique A14), and closes it with Esc: the steps
    // have no Close button of their own any more (A16)
    static closeInsideFrame = true;

    closeAnchor() {
        return this.gameContainer?.querySelector?.('.dusting-root') || this.gameContainer;
    }

    constructor(container, params) {
        super(container, { ...params, showCancel: false });
        this.item = params.item;
        this.data = (this.item && this.item.scenarioData) || {};
        this.difficultyId = DIFFICULTY[this.data.fingerprintDifficulty] ? this.data.fingerprintDifficulty : 'medium';
        this.diff = DIFFICULTY[this.difficultyId];
        this.surfaceId = surfaceForObject(this.data);
        this.surface = SURFACES[this.surfaceId];
        this.owner = this.data.fingerprintOwner || 'Unknown';
        this.ownerName = displayNameForOwner(this.owner, this.data);
        this.objectId = this.data.id || (this.item && this.item.objectId) || null;
        this.reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || params.reducedMotion === true;
        this.highContrast = readStore(STORE_HC);
        this.steady = readStore(STORE_STEADY);
        this.gameId = (window.breakEscapeConfig && window.breakEscapeConfig.gameId) || null;
        this.resume = loadProgress(this.gameId, this.objectId);   // per-viewer localStorage only; null when absent or storage fails

        this.step = 'examine';
        this.powder = null;
        this.tool = null;
        this.toolStrokes = 0;
        this.reticle = { x: N / 2, y: N / 2 };
        this.pointerInside = false;
        this.pointerDown = false;
        this.lastPt = null;
        this.stickyBrush = false;
        this.spaceHeld = false;
        this.puffMode = false;
        this.found = false;
        this.hintReady = false;
        this.hintOn = false;
        this.misses = 0;      // failed checks in the find step (drives the Hint nudge)
        this.nudged = false;
        this.message = '';
        this.coach = '';
        this.metrics = { coverage: 0, clarity: 0, foggy: 0 };
        this.lastBand = 0;
        this.dirty = true;
        this.mounted = false;
        this.identified = false;
        this.patternOk = false;
        this.final = null;
        this.candidates = [];
        this.correctIndex = -1;
        this.viewing = null; // F26 follow-up: index of the card shown at full size in place of the lift
        this.fullLiftBy = null; // 'L' when the player asked for the whole lift, 'view' when V brought it
        this.fullLift = false; // compare on a non-short screen: true brings the lift canvas back in place of the magnified pair
        this.peelStart = 0;
        this.foundAt = 0;
        this._resultSent = false;
        this._timers = [];

        this._buildPrint();
    }

    // ------------------------------------------------------------------ setup

    _buildPrint() {
        const seed = hashString(`${this.objectId}|${this.owner}`);
        const partial = this.diff.partial === 'always' || (this.diff.partial === 'maybe' && (seed & 1) === 1);
        const pattern = PATTERNS.includes(this.data.fingerprintPattern) ? this.data.fingerprintPattern : patternForOwner(this.owner);
        const raw = cachedPrint({ owner: this.owner, pattern, variant: String(this.objectId || 'surface'), partial });
        // Move the print about on the surface so the find step is a real look. Keep it fully on the canvas.
        const r = mulberry32(seed ^ 0x9e3779b9);
        const b = raw.bounds;
        const lo = (v) => Math.max(-14, v), hi = (v) => Math.min(14, v);
        const sx = Math.round(lo(4 - b.x) + r() * (hi(N - 4 - (b.x + b.w)) - lo(4 - b.x)));
        const sy = Math.round(lo(4 - b.y) + r() * (hi(N - 4 - (b.y + b.h)) - lo(4 - b.y)));
        this.print = shiftPrint(raw, sx, sy);
        this.printCentre = {
            x: Math.round(this.print.bounds.x + this.print.bounds.w / 2),
            y: Math.round(this.print.bounds.y + this.print.bounds.h / 2)
        };
        let maskN = 0;
        for (let i = 0; i < N * N; i++) if (this.print.mask[i] > 0.5) maskN++;
        this.maskCount = maskN;
        this.softMask = softenMask(this.print.mask, 7);
        this.field = new DustField(N, { pfog: this.diff.pfog, fogRate: this.steady ? 0.5 : 1 });
        this.tape = new TapeGrid(8);
        const b2 = this.print.bounds;
        const x0 = Math.max(0, b2.x - 6), y0 = Math.max(0, b2.y - 6);
        this.tapeBounds = { x: x0, y: y0, w: Math.min(N, b2.x + b2.w + 6) - x0, h: Math.min(N, b2.y + b2.h + 6) - y0 };
    }

    init() {
        super.init();
        preloadArt();
        const c = this.container;
        c.classList.add('dusting-container');
        this.headerElement.style.display = 'none';
        this.messageContainer.style.display = 'none';
        if (this.controlsElement) this.controlsElement.style.display = 'none';
        this.gameContainer.className = 'minigame-game-container dusting-game-container';
        this.gameContainer.removeAttribute('style');

        this.gameContainer.innerHTML = `
            <div class="dusting-root pixel-scroll" data-step="examine">
                <div class="dusting-title"><h2>Fingerprint kit</h2><span class="dusting-object"></span></div>
                <ol class="dusting-steps" aria-label="Steps">
                    ${STEPS.map((s, i) => `<li data-step="${s}"><span class="dusting-step-num">${i + 1}</span> ${STEP_NAMES[s]}</li>`).join('')}
                </ol>
                <div class="dusting-body pixel-scroll" data-region="dusting-body">
                <div class="dusting-main">
                    <div class="dusting-stage">
                        <canvas class="dusting-canvas" width="${N}" height="${N}" tabindex="0" role="img" aria-label=""></canvas>
                        <div class="dusting-stage-note" hidden></div>
                    </div>
                    <div class="dusting-panel"></div>
                </div>
                <p class="dusting-forensic"></p>
                <div class="dusting-status" role="status" aria-live="polite"></div>
                <div class="dusting-options">
                    <label><input type="checkbox" class="dusting-opt-hc"> High contrast</label>
                    <label><input type="checkbox" class="dusting-opt-steady"> Steady hand (gentler powder)</label>
                    <span class="dusting-keys" data-keys>Keys: arrows move, Space acts, Shift = big steps</span>
                </div>
                </div>
            </div>`;
        this.root = this.gameContainer.querySelector('.dusting-root');
        this.canvas = this.root.querySelector('.dusting-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.panel = this.root.querySelector('.dusting-panel');
        this.stageNote = this.root.querySelector('.dusting-stage-note');
        this.statusEl = this.root.querySelector('.dusting-status');
        this.forensicEl = this.root.querySelector('.dusting-forensic');
        this.keysEl = this.root.querySelector('[data-keys]');
        this.root.querySelector('.dusting-object').textContent = displayDashes(this.data.name || 'Surface');
        this.img = this.ctx.createImageData(N, N);
        this.hcBox = this.root.querySelector('.dusting-opt-hc');
        this.steadyBox = this.root.querySelector('.dusting-opt-steady');
        this.hcBox.checked = this.highContrast;
        this.steadyBox.checked = this.steady;
        this.root.classList.toggle('dusting-hc', this.highContrast);
        this.root.classList.toggle('dusting-reduced-motion', this.reduceMotion);

        this._bind();
        this._layout();
        this._renderSurfaceCache();
        this._setStep('examine');
        this._unsubArt = onArtLoaded(() => { this._renderSurfaceCache(); refreshSlotCanvases(this.root); this.dirty = true; });
    }

    start() {
        super.start();
        this._raf = requestAnimationFrame(() => this._frame());
    }

    _bind() {
        const cv = this.canvas;
        this.addEventListener(cv, 'pointerdown', e => this._onPointerDown(e));
        this.addEventListener(cv, 'pointermove', e => this._onPointerMove(e));
        this.addEventListener(cv, 'pointerup', e => this._onPointerUp(e));
        this.addEventListener(cv, 'pointercancel', e => this._onPointerUp(e));
        // capture lost mid-stroke (element hidden, re-laid out, OS takeover) ends the stroke as pointerup would
        this.addEventListener(cv, 'lostpointercapture', e => this._onPointerUp(e));
        this.addEventListener(cv, 'pointerleave', () => { if (!this.pointerDown) { this.pointerInside = false; this.dirty = true; if (this.nearPrint) this._clearNear(); } });
        this._bindPanel();
        this.addEventListener(document, 'keydown', e => this._onKeyDown(e));
        this.addEventListener(document, 'keyup', e => this._onKeyUp(e));
        this.addEventListener(window, 'resize', () => this._layout());
        this.addEventListener(this.hcBox, 'change', () => {
            this.highContrast = this.hcBox.checked; writeStore(STORE_HC, this.highContrast);
            this.root.classList.toggle('dusting-hc', this.highContrast); this.dirty = true; this._drawKeyGlyphs();
        });
        this.addEventListener(this.steadyBox, 'change', () => {
            this.steady = this.steadyBox.checked; writeStore(STORE_STEADY, this.steady);
            this.field.fogRate = this.steady ? 0.5 : 1;
            this.announce(this.steady ? 'Steady hand on: powder fogs half as fast.' : 'Steady hand off.');
        });
    }

    /** The panel's click, hover and focus routes (split out so a test can wire them on a JSDOM panel). */
    _bindPanel() {
        const onClick = e => {
            const el = e.target.closest('[data-action]');
            // a click with detail 0 comes from the keyboard (Enter or Space on a focused button); a pointer click has detail 1 or more
            if (el && !el.disabled) this._action(el.dataset.action, el.dataset, e.detail === 0);
        };
        this.addEventListener(this.panel, 'click', onClick);
        // On phone portrait the action footer row is the last child of the scrolling body (see _placeFoot), outside the panel.
        const body = this.root && this.root.querySelector && this.root.querySelector('.dusting-body');
        if (body) this.addEventListener(body, 'click', e => { if (e.target.closest('.dusting-body > .dusting-foot')) onClick(e); });
        // Short landscape compare: the row is a direct child of the scrolling .dusting-root (a different element from the body).
        if (this.root && this.root.addEventListener) this.addEventListener(this.root, 'click', e => { if (e.target.closest('.dusting-root > .dusting-foot')) onClick(e); });
        // Compare: the magnified pair follows the card under the pointer or the keyboard focus (no re-render, so focus stays).
        const zoomTo = (e, speak) => {
            const w = e.target.closest && e.target.closest('.dusting-ref-wrap');
            const b = w && w.querySelector('[data-index]');
            const i = b ? Number(b.dataset.index) : NaN;
            if (this._refocusing || !Number.isInteger(i) || this.step !== 'compare' || this.identified || this.zoomIdx === i) return;
            this.zoomIdx = i;
            this._drawZoom();
            if (speak && this._zoomSpeech) this.announce(this._zoomSpeech);   // the card's words only; the lift was read on entering compare
        };
        this.addEventListener(this.panel, 'pointerover', e => zoomTo(e, false));
        this.addEventListener(this.panel, 'focusin', e => zoomTo(e, true));
    }

    _layout() {
        // Short landscape (a phone on its side): two columns, canvas left at the largest whole scale that fits,
        // controls right (dusting.css .dusting-short). Whole scales only, never below 1x.
        const short = window.innerHeight <= SHORT_LANDSCAPE_MAX_H && window.innerWidth > window.innerHeight;
        const was = this.root.classList.contains('dusting-short');
        this.root.classList.toggle('dusting-short', short);
        this._placeFoot();
        if (was !== short) {
            this._applyLabels();
            if (this.metrics) this._refreshDynamic();
        }
        const maxPx = short
            ? Math.min(window.innerHeight - SHORT_LANDSCAPE_CHROME, window.innerWidth * 0.45, 512)
            : Math.min(window.innerHeight * 0.52, window.innerWidth * 0.86, 512);
        const capScale = this.step !== 'compare' ? 4 : 3;
        this.scale = Math.max(1, Math.min(capScale, Math.floor(maxPx / N)));
        this.canvas.style.width = `${N * this.scale}px`;
        this.canvas.style.height = `${N * this.scale}px`;
        // Comparing on a non-short screen: the magnified pair takes the lift's place in the stage column
        // (My whole lift, View large and L bring the lift back).
        this.canvas.hidden = this._zoomInStage(short);
        this.wide = !isPhoneWidth();   // same rule as _placeFoot and the CSS
        if (this.step === 'compare' && this.patternOk && this.panel) {
            // the pair sits in the stage column, or in the panel in short landscape; moving between them re-renders
            if (this._zoomShort !== undefined && this._zoomShort !== short) this._renderPanel(); else this._drawZoom();
        }
        this._zoomShort = short;
    }

    /** True while the magnified pair stands in for the lift canvas (compare, pattern named, not short, whole lift not asked for). */
    _zoomInStage(short) {
        return this.step === 'compare' && !!this.patternOk && !short && !this.fullLift;
    }

    _later(fn, ms) {
        const t = setTimeout(() => { this._timers = this._timers.filter(x => x !== t); fn(); }, ms);
        this._timers.push(t);
        return t;
    }

    cleanup() {
        this._timers.forEach(clearTimeout);
        this._timers = [];
        clearInterval(this._keyTimer);
        cancelAnimationFrame(this._raf);
        if (this._unsubArt) this._unsubArt();
        // Closed mid-dust without a result (X, or a scripted call before the peel): keep what is on the surface for a resume.
        if (!this.final && this.step === 'dust') this._saveProgress();
        // A scripted call or conversation ends the minigame with endMinigame(false, null) and never reaches
        // complete(): a lift mounted on the compare screen is still recorded, through the opener's callback.
        if (this.mounted && this.final && !this._resultSent) {
            this._resultSent = true;
            this._clearProgress();   // the lift is logged, so the next interact shows "Lift on file", not Resume
            const forced = this.params && this.params.onForcedEnd;
            if (typeof forced === 'function') {
                try { forced({ ...this._buildResult(), viaClose: true }); } catch (e) { console.error('dusting forced-end record failed', e); }
            }
        }
        super.cleanup();
    }

    // ------------------------------------------------------------------ surface

    _renderSurfaceCache() {
        const cv = document.createElement('canvas');
        cv.width = N; cv.height = N;
        const c = cv.getContext('2d');
        drawSlot(c, SURFACE_SLOT[this.surfaceId]);
        this.surfacePixels = c.getImageData(0, 0, N, N).data;
        const luma = (0.3 * this.surfacePixels[0] + 0.59 * this.surfacePixels[1] + 0.11 * this.surfacePixels[2]);
        this.surfaceLight = luma > 150;
        let sum = 0;
        for (let k = 0; k < N * N; k++) sum += 0.3 * this.surfacePixels[k * 4] + 0.59 * this.surfacePixels[k * 4 + 1] + 0.11 * this.surfacePixels[k * 4 + 2];
        this.surfaceMeanLuma = sum / (N * N);
        // flat backgrounds for the high-contrast view
        this.hcPixels = new Uint8ClampedArray(N * N * 4);
    }

    // ------------------------------------------------------------------ steps and panel

    _setStep(step) {
        this.step = step;
        this._layout();
        this.root.dataset.step = step;
        this.root.querySelectorAll('.dusting-steps li').forEach(li => {
            const idx = STEPS.indexOf(li.dataset.step), cur = STEPS.indexOf(step === 'examine' ? 'find' : step);
            li.classList.toggle('active', li.dataset.step === step);
            li.classList.toggle('done', idx < cur && step !== 'examine');
            if (li.dataset.step === step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
        });
        this.forensicEl.textContent = FORENSIC[step] || '';
        if (step === 'compare' && this.patternOk && this.identified) this.forensicEl.textContent = `${FORENSIC.compare} ${FORENSIC_MATCH}`;
        this.message = '';
        this.advice = '';
        this._renderPanel();
        this._updateAria();
        this.dirty = true;
        if (['find', 'dust', 'lift'].includes(step)) this.canvas.focus({ preventScroll: true });
        this.announce({
            examine: 'Examine the surface.',
            find: 'Step 1, find the print. Sweep the light across the surface and mark the patch of curved ridges.',
            powder: 'Step 2, choose a powder.',
            dust: 'Step 3, dust. Brush over the print to bring up the ridges.',
            lift: 'Step 4, lift. Press the tape down, then peel and mount.',
            compare: 'Step 5, compare. Name the pattern, then pick the matching card.'
        }[step]);
    }

    /** Where the action footer row lives. A sticky box only pins within its parent's box, so the row must be a child of the scroller:
     *  - Phone portrait (the CSS max-width: 760px rule, not short): last child of the scrolling .dusting-body, because the panel
     *    ends above the forensic, status and keys blocks.
     *  - Short landscape compare: last child of .dusting-root, the scroller there (see dusting.css).
     *  - Elsewhere (desktop, short landscape examine): the end of the panel, where it always was.
     *  Also publishes the row's real height as --d-foot-h so the scroller's scroll-padding-bottom clears it, wrapped or not. */
    _placeFoot() {
        const root = this.root;
        if (!root || !root.querySelector || !this.panel) return;
        const body = root.querySelector('.dusting-body');
        const foot = root.querySelector('.dusting-foot');
        if (!body || !foot) return;
        const narrow = isPhoneWidth();
        const short = root.classList.contains('dusting-short');
        const phone = narrow && !short;
        // short landscape compare: .dusting-root is the scroller (the panel does not scroll), so the row is its last child
        const dest = phone ? body : (short && this.step === 'compare' ? root : this.panel);
        if (foot.parentNode !== dest) dest.appendChild(foot);
        const h = foot.offsetHeight;
        if (h && root.style && root.style.setProperty) root.style.setProperty('--d-foot-h', `${h + 6}px`);
    }

    /** First match for a selector in the panel or in the footer row (which sits in the body on phone portrait). */
    _findInPanel(selector) {
        const hit = this.panel && this.panel.querySelector(selector);
        if (hit) return hit;
        const foot = this.root && this.root.querySelector && this.root.querySelector(MOVED_FOOT);
        return foot ? foot.querySelector(selector) : null;
    }

    _renderPanel() {
        const p = this.panel;
        const oldFoot = this.root && this.root.querySelector && this.root.querySelector(MOVED_FOOT);
        if (oldFoot) oldFoot.remove();   // a footer moved out of the panel is not cleared by the panel's innerHTML
        p.innerHTML = '';
        const html = {
            examine: () => this._htmlExamine(), find: () => this._htmlFind(), powder: () => this._htmlPowder(),
            dust: () => this._htmlDust(), lift: () => this._htmlLift(), compare: () => this._htmlCompare()
        }[this.step]();
        p.innerHTML = html;
        // art canvases are DOM-built so a PNG can replace the fallback
        p.querySelectorAll('[data-slot]').forEach(host => {
            host.appendChild(slotCanvas(host.dataset.slot, Number(host.dataset.scale || 2)));
        });
        this._zoomShort = this.root.classList.contains('dusting-short');
        // the reference cards are DOM-built: candidate names are set with textContent, never parsed as markup
        p.querySelectorAll('.dusting-refs').forEach(host => host.appendChild(this._refCards(host.dataset.done === '1')));
        if (this.step === 'compare' && this.patternOk) this._drawReferences();
        // The pair stands in for the lift in the stage column (non-short screens); in short landscape it is in the panel.
        const inStage = this._zoomInStage(this._zoomShort);
        this.canvas.hidden = inStage;
        if (this.stageNote) {
            this.stageNote.innerHTML = inStage ? this._zoomHtml() : '';
            this.stageNote.hidden = !inStage;
        }
        this.root.classList.toggle('dusting-matched', !!this.identified);
        if (this.keysEl) {
            let keys = 'Keys: arrows move, Space acts, Shift = big steps';
            if (this.step === 'compare' && this.patternOk) {
                const n = this.candidates.length, whole = this._zoomShort ? '' : (this.identified ? 'L whole lift' : ', L whole lift');
                keys = this.identified ? `Keys: ${whole}` : `Keys: 1 to ${n} picks a card, V views it large${whole}`;
            }
            this.keysEl.textContent = keys;
            this.keysEl.hidden = keys === 'Keys: ';   // nothing to list after the match in short landscape
        }
        this._placeFoot();
        this._drawKeyGlyphs();
        if (this.step === 'compare' && this.patternOk) this._drawZoom();
        this._applyLabels();
        this._refreshDynamic();
    }

    // Short landscape shows compact labels so every button fits. {x} parts are hidden by CSS (still read aloud);
    // {v} parts swap here. Only changed text is written, since this runs on every refresh.
    _applyLabels() {
        const short = this.root.classList.contains('dusting-short');
        this.panel.querySelectorAll('.dusting-lv').forEach(span => {
            const want = short ? span.dataset.short : span.dataset.long;
            if (span.textContent !== want) span.textContent = want;
        });
    }

    _htmlExamine() {
        const d = this.data;
        const best = this.objectId ? bestLiftFromObject(this.objectId) : null;
        // textVariants / observationVariants apply here as everywhere else (m08 E5)
        const observations = resolveObjectField(d, 'observations', null);
        const text = resolveObjectField(d, 'text', null);
        const head = `
            <h3>${escapeHtml(d.name || 'Surface')}</h3>
            ${observations ? `<p>${escapeHtml(observations)}</p>` : ''}
            ${text ? `<p class="dusting-quote">${escapeHtml(text)}</p>` : ''}
            <p class="dusting-surface-line"><span class="mg-field-label">Surface:</span> ${escapeHtml(this.surface.description)}</p>`;
        if (this.resume) {
            return `${head}
            <p class="dusting-note">You were part way through dusting this. Pick up where you left off?</p>
            <div class="dusting-buttons dusting-foot">
                <button class="dusting-btn dusting-primary" data-action="resume">Resume dusting</button>
                <button class="dusting-btn" data-action="start">Start again</button>
                <button class="dusting-btn" data-action="use-normally">Use normally</button>
            </div>`;
        }
        if (best) {
            // A lift is already on file: that is the main view. Dusting again is the secondary choice.
            const who = best.identified ? ` Identified as ${escapeHtml(best.ownerName || best.owner)}.` : '';
            return `${head}
            <h3 class="dusting-lift-head">Lift on file</h3>
            <p class="dusting-note" data-lift-result>Lifted: ${Math.round(best.quality * 100)}%, ${escapeHtml(best.rating || ratingFor(best.quality))}.${who}</p>
            <p class="dusting-note">The lift is kept. Close with X, or dust again for a better one.</p>
            <div class="dusting-buttons dusting-foot">
                <button class="dusting-btn" data-action="start">Dust again</button>
                <button class="dusting-btn" data-action="use-normally">Use normally</button>
            </div>`;
        }
        return `${head}
            <div class="dusting-buttons dusting-foot">
                <button class="dusting-btn dusting-primary" data-action="start">Dust for prints</button>
                <button class="dusting-btn" data-action="use-normally">Use normally</button>
            </div>`;
    }

    /** The one-line key for the Find step: controls, what to look for (by difficulty), and when the hint arrives. */
    _findKeyLine() {
        const look = this.diff.findFloor === 0 ? 'Look for a small patch of curved ridges in the beam.' : 'Look for a dotted patch.';
        return `Move the torch with the mouse or arrow keys. ${look} Click or Space: check. H: hint (after ${Math.round(this.diff.hintAfterMs / 1000)} seconds).`;
    }

    _htmlFind() {
        return `
            <h3>Find the print</h3>
            <p>Hold the light low across the surface. Where residue catches the light you will see a small patch
            of fine curved ridges. Long straight streaks are only reflections.</p>
            <p class="dusting-keys">${this._findKeyLine()}</p>
            <p class="dusting-feedback" data-dyn="feedback"></p>
            <p class="dusting-nudge" data-dyn="nudge"></p>
            <div class="dusting-buttons">
                <button class="dusting-btn dusting-hint${this.nudged ? ' dusting-nudged' : ''}" data-action="hint" ${this.hintReady ? '' : 'hidden'}>Hint</button>
            </div>`;
    }

    _htmlPowder() {
        const jars = Object.values(POWDERS).map((pw, i) => `
            <button class="dusting-jar" data-action="powder" data-powder="${pw.id}" aria-pressed="${this.powder === pw.id}" title="Press ${i + 1}">
                <span data-slot="jar-${pw.id}" data-scale="2"></span>
                <span class="dusting-jar-text"><span class="mg-section-label">${i + 1}. ${escapeHtml(pw.label)}</span><br>${escapeHtml(pw.kitLabel)}</span>
            </button>`).join('');
        return `
            <h3>Choose a powder</h3>
            <p><span class="mg-field-label">Surface:</span> ${escapeHtml(this.surface.description)}</p>
            <p>Pick the powder whose label fits. If it does not show well you can change it.</p>
            <div class="dusting-jars">${jars}</div>
`;
    }

    _brushButtons() {
        const pw = POWDERS[this.powder];
        return pw.tools.map(t => {
            const key = t === 'fine' ? 'F' : t === 'broad' ? 'B' : 'W';
            const slot = t === 'fine' ? 'brush-fine' : t === 'broad' ? 'brush-feather' : 'wand';
            const parts = t === 'fine' ? ['Fine', { x: ' brush' }, ` (${key})`, { s: ', fine brush' }]
                : t === 'broad' ? ['Feather', { x: ' brush' }, ` (${key})`, { s: ', feather brush' }]
                : [{ x: 'Magnetic ' }, { v: ['wand', 'Wand'] }, ` (${key})`, { s: ', magnetic wand' }];
            return `<button class="dusting-btn dusting-tool" data-action="tool" data-tool="${t}" aria-pressed="${this.tool === t}" title="${lblPlain(parts)}">
                <span data-slot="${slot}" data-scale="1"></span> ${lblSpan(parts)}</button>`;
        }).join('');
    }

    _htmlDust() {
        const pw = POWDERS[this.powder];
        return `
            <h3>Dust the print</h3>
            <p class="dusting-instr"><span class="dusting-lo">Drag over the print with the ${this.powder === 'magnetic' ? 'wand' : 'brush'} (keys: hold Space and use the arrows, or Enter to keep brushing). Ridges appear stroke by stroke.</span><span class="dusting-so">Drag over the print with the ${this.powder === 'magnetic' ? 'wand' : 'brush'}, or hold Space and use the arrows. Enter keeps brushing.</span></p>
            <div class="dusting-tools">${this._brushButtons()}</div>
            <p class="dusting-powder-line"><span class="mg-field-label">Powder:</span> ${escapeHtml(pw.label)}</p>
            <div class="dusting-actions">
            <div class="dusting-meters">
                <div class="dusting-meter"><label>Coverage <span class="dusting-meter-value" data-dyn="cov-text"></span></label><div class="dusting-bar"><i data-dyn="cov-bar"></i><u data-dyn="cov-min"></u></div></div>
                <div class="dusting-meter"><label>Clarity <span class="dusting-meter-value" data-dyn="clar-text"></span></label><div class="dusting-bar"><i data-dyn="clar-bar"></i></div></div>
                <p class="dusting-estimate" data-dyn="estimate"></p>
            </div>
            <p class="dusting-feedback" data-dyn="feedback"></p>
            <div class="dusting-buttons">
                <button class="dusting-btn dusting-primary" data-action="to-lift" data-dyn="lift-btn" title="Lift (L)">${lblSpan(LIFT_READY)}</button>
                <button class="dusting-btn" data-action="puff" aria-pressed="${this.puffMode}" title="Puff off excess (T)">${lblSpan(['Puff', { x: ' off excess' }, ' (T)', { s: ', puff off excess' }])}</button>
                <button class="dusting-btn" data-action="change-powder" title="Change powder (C)">${lblSpan([{ x: 'Change ' }, { v: ['powder', 'Powder'] }, ' (C)', { s: ', change powder' }])}</button>
            </div>
            </div>`;
    }

    _htmlLift() {
        return `
            <h3>Lift with tape</h3>
            <p>The tape is laid over the print with air bubbles under it. Rub over it (drag, or hold Space and use the arrows) to press the bubbles out. Bubbles left in leave holes in the lift.</p>
            <div class="dusting-actions">
            <div class="dusting-meters">
                <div class="dusting-meter"><label>Tape pressed <span class="dusting-meter-value" data-dyn="tape-text"></span></label><div class="dusting-bar"><i data-dyn="tape-bar"></i></div></div>
                <p class="dusting-estimate" data-dyn="estimate"></p>
            </div>
            <p class="dusting-feedback" data-dyn="feedback"></p>
            <div class="dusting-buttons">
                <button class="dusting-btn dusting-primary" data-action="peel" title="Peel and mount (P)"><span data-slot="tape-roll" data-scale="1"></span> ${lblSpan([{ x: 'Peel and ' }, { v: ['mount', 'Mount'] }, ' (P)', { s: ', peel and mount' }])}</button>
                <button class="dusting-btn" data-action="back-dust" title="Back to dusting">${lblSpan(['Back', { x: ' to dusting' }, { s: ', back to dusting' }])}</button>
            </div>
            </div>`;
    }

    _htmlCompare() {
        const q = this.final ? Math.round(this.final.quality * 100) : 0;
        const head = `<h3>Compare and identify</h3>
            <p class="dusting-result">Lift mounted: <span class="dusting-result-value">${q}% (${escapeHtml(this.final ? this.final.rating : '')})</span>.</p>`;
        if (!this.patternOk) {
            const btns = PATTERNS.map(pt => `
                <button class="dusting-pattern" data-action="pattern" data-pattern="${pt}">
                    <span class="dusting-pattern-art">${PATTERN_SVG[pt]}</span>
                    <span><span class="mg-section-label">${PATTERN_INFO[pt].label}</span><br>${PATTERN_INFO[pt].desc}</span>
                </button>`).join('');
            return `${head}<p>What pattern is your lift? Look for the core (middle) and the triangles where ridges meet.</p>
                <div class="dusting-patterns">${btns}</div>
                <p class="dusting-feedback" data-dyn="feedback"></p>
                <div class="dusting-buttons dusting-foot">
                    <button class="dusting-btn" data-action="unidentified">Log as unidentified</button>
                </div>`;
        }
        if (this.identified) {
            return `${head}<p class="dusting-feedback good">Match: ridge detail agrees at the ${this.print.pattern === 'arch' ? 'ridge flow' : this.print.deltas.length > 1 ? 'core and both deltas' : 'core and the delta'}. The numbered tags mark the same ridge detail on both cards.</p>
                <p>This is ${escapeHtml(this.ownerName)}'s print.</p>
                ${this._zoomShort ? this._zoomHtml() : ''}
                <div class="dusting-refs" data-count="${this.candidates.length}" data-done="1"></div>
                <div class="dusting-buttons dusting-foot">${this._wholeLiftButton()}<button class="dusting-btn dusting-primary" data-action="finish">Log the print</button></div>`;
        }
        const opens = this.print.pattern === 'loop' && this.print.canonical && this.print.canonical.opens
            ? ` It opens to the ${this.print.canonical.opens}.` : '';
        return `${head}<p>That is ${/^[aeiou]/i.test(this.print.pattern) ? 'an' : 'a'} ${PATTERN_INFO[this.print.pattern].label.toLowerCase()}, marked on the card.${opens} Check the class first: rule out any card with a different pattern${this.print.pattern === 'loop' ? ' or a loop that opens the other way' : ''}.</p>
            <p class="dusting-feedback" data-dyn="feedback"></p>
            ${this._zoomShort ? this._zoomHtml() : ''}
            ${this._compareNote()}
            <div class="dusting-refs" data-count="${this.candidates.length}" data-done="0"></div>
            <div class="dusting-buttons dusting-foot">${this._wholeLiftButton()}<button class="dusting-btn" data-action="unidentified">Log as unidentified</button></div>`;
    }

    /** The magnified lift and card pair; it is drawn by _drawZoom. The lift pane is turned upright to the card's frame. */
    _zoomHtml() {
        return `<div class="dusting-zoom" data-zoom>
                <div class="dusting-zoom-pane"><span class="dusting-zoom-cap" title="Your lift (turned upright)">Your lift (turned upright)<span class="dusting-sr" data-zmarks></span></span><div class="dusting-zoom-box" data-zbox="lift"></div></div>
                <div class="dusting-zoom-pane"><span class="dusting-zoom-cap" data-zcap>Card</span><div class="dusting-zoom-box" data-zbox="card"></div></div>
            </div>`;
    }

    /** One sentence: what to check and the mark key (pixel glyphs, drawn by _drawKeyGlyphs). Gone once identified. */
    _compareNote() {
        if (!this.patternOk || this.identified || !this.liftMarks || !this.liftMarks.length) return '';
        return `<p class="dusting-legend">Check that each numbered mark on your lift has the same kind of mark in the same place on the card: <canvas class="dusting-key-glyph" data-key="ending" width="7" height="7" aria-hidden="true"></canvas> ridge ending, <canvas class="dusting-key-glyph" data-key="bifurcation" width="7" height="7" aria-hidden="true"></canvas> fork.</p>`;
    }

    /** Draw the mark key glyphs from markGlyph at 1x (CSS shows them at a whole-number 2x, no smoothing). */
    _drawKeyGlyphs() {
        if (!this.panel || !this.panel.querySelectorAll) return;
        this.panel.querySelectorAll('canvas[data-key]').forEach(cv => {
            const c = cv.getContext('2d');
            c.clearRect(0, 0, 7, 7);
            c.fillStyle = this.highContrast ? '#ffffff' : '#ff5a6a';
            for (const [x, y] of markGlyph(cv.dataset.key)) c.fillRect(x + 3, y + 3, 1, 1);
        });
    }

    /** "My whole lift" / "Back to the pair": only where the pair stands in for the lift (not short landscape). */
    _wholeLiftButton() {
        if (this._zoomShort) return '';
        return `<button class="dusting-btn" data-action="fulllift" aria-pressed="${!!this.fullLift}" aria-keyshortcuts="L">Whole lift (L)</button>`;
    }

    /** The reference cards as DOM (a fragment): each card's button picks, "View large" only shows the card at the lift's size
     *  in the big frame (F26 follow-up), so viewing never counts as a pick. Names go in with textContent. */
    _refCards(done) {
        const mk = (tag, cls, text) => {
            const e = document.createElement(tag);
            if (cls) e.className = cls;
            if (text !== undefined) e.textContent = text;
            return e;
        };
        const frag = document.createDocumentFragment();
        for (const c of this.candidates) {
            const viewing = !done && this.viewing === c.index;
            // The match state is drawn as text under the name (a touch screen shows no title). After the match every other card
            // reads "not a match" too, so no card is left unlabelled.
            const state = done && c.correct ? 'match' : (c.rejected || (done && this.identified)) ? 'not a match' : '';
            const wrap = mk('div', 'dusting-ref-wrap');
            const btn = mk('button', 'dusting-ref');
            btn.dataset.action = 'ref';
            btn.dataset.index = String(c.index);
            if (c.rejected || done) btn.disabled = true;
            if (c.rejected) btn.setAttribute('data-rejected', '1');
            if (viewing) btn.setAttribute('data-viewing', '1');
            if (done && c.correct) btn.setAttribute('data-match', '1');
            const label = `Reference card ${c.index + 1}: ${c.label}${state ? ', ' + state : ''}`;
            btn.setAttribute('aria-label', label);
            btn.title = label;
            const cv = mk('canvas', 'dusting-ref-canvas');
            cv.dataset.ref = String(c.index);
            cv.width = N; cv.height = N;
            const cap = mk('span', 'dusting-ref-caption');
            cap.appendChild(mk('span', 'dusting-ref-name', `${c.index + 1}. ${c.label}`));
            if (state) {
                cap.appendChild(document.createTextNode(' '));
                const tag = mk('span', 'dusting-ref-tag', `(${state})`);
                tag.dataset.state = state === 'match' ? 'match' : 'no';
                cap.appendChild(tag);
            }
            btn.append(cv, cap);
            wrap.appendChild(btn);
            if (!done) {
                const v = mk('button', 'dusting-btn dusting-view', viewing ? 'Back to my lift (V)' : 'View large (V)');
                v.dataset.action = 'view';
                v.dataset.index = String(c.index);
                v.setAttribute('aria-pressed', String(viewing));
                v.setAttribute('aria-label', viewing ? 'Back to my lift (V)' : `View large (V): card ${c.index + 1}, ${c.label}`);
                wrap.appendChild(v);
            }
            frag.appendChild(wrap);
        }
        return frag;
    }

    // ------------------------------------------------------------------ actions

    _action(action, ds = {}, viaKey = false) {
        switch (action) {
            case 'start': this._clearProgress(); this.resume = null; this._setStep('find'); break;
            case 'resume': this._resumeDusting(); break;
            case 'use-normally': this._clearProgress(); this.gameResult = { cancelled: true, useNormally: true }; this._resultSent = true; super.complete(false); break;
            case 'hint': this.hintOn = true; this.dirty = true; this.announce('The ring marks where the print is.'); break;
            case 'powder': this._choosePowder(ds.powder); break;
            case 'tool': this._chooseTool(ds.tool); break;
            case 'to-lift': this._toLift(); break;
            case 'puff': this.puffMode = !this.puffMode; this._renderPanel(); this.announce(this.puffMode ? 'Puff on: sweep over blotchy areas to clear the excess.' : 'Puff off.'); break;
            case 'change-powder': this._changePowder(); break;
            case 'back-dust': this._setStep('dust'); break;
            case 'peel': this._peel(); break;
            case 'pattern': this._choosePattern(ds.pattern); break;
            case 'ref': this._chooseRef(Number(ds.index), viaKey); break;
            case 'view': this._viewCard(Number(ds.index)); break;
            case 'fulllift': this._toggleWholeLift(); break;
            case 'unidentified': this.identified = false; this._finish(); break;
            case 'finish': this._finish(); break;
            default: break;
        }
    }

    // ------------------------------------------------------------------ resume (per viewer, localStorage only)

    /** Saves the dust step (powder, tool, quality estimate, downsampled powder and fog) so a reload can resume it. */
    _saveProgress() {
        if (this._resultSent || this.step !== 'dust' || !this.powder || !this.found || !this.field) return false;
        let quality = 0;
        try { quality = this._currentQuality(1); } catch (e) { quality = this.metrics ? this.metrics.coverage : 0; }
        const entry = packProgress({ step: 'dust', powder: this.powder, tool: this.tool, quality }, this.field);
        if (!entry.p.some(v => v > 0)) return false;   // nothing dusted yet: no resume to offer
        return saveProgress(this.gameId, this.objectId, entry);
    }

    _clearProgress() { clearProgress(this.gameId, this.objectId); }

    _resumeDusting() {
        const r = this.resume;
        this.resume = null;
        if (!r || !POWDERS[r.powder]) { this._setStep('find'); return; }
        this.found = true;
        this.powder = r.powder;
        this.tool = POWDERS[r.powder].tools.includes(r.tool) ? r.tool : POWDERS[r.powder].tools[0];
        this.toolStrokes = 0;
        upsampleInto(this.field.P, this.field.size, r.p);
        upsampleInto(this.field.FP, this.field.size, r.f);
        this._setStep('dust');
        this._refreshMetrics(true);
        this._setBrushed(true);
        this.announce('Resumed where you left off.');
    }

    _choosePowder(id) {
        if (!POWDERS[id]) return;
        if (this.powder !== id) { this.field.clear(); this.lastBand = 0; }
        this.powder = id;
        this.tool = POWDERS[id].tools[0];
        this.toolStrokes = 0;
        this.puffMode = false;
        this._setStep('dust');
        this._refreshMetrics(true);
        // after the step render and the metric refresh: both run _refreshDynamic, which would
        // otherwise set brushed again from the previous powder's coverage
        this._setBrushed(false);
        // short landscape drops the trailing sentence: the Powder (C) button sits right below the feedback line
        const short = !!(this.root && this.root.classList.contains('dusting-short'));
        const why = wrongPowderReason(this.powder, this.surfaceId, short);
        if (why) this.advise(short ? why : `${why} You can change powder.`);
    }

    _chooseTool(t) {
        if (!TOOLS[t] || !POWDERS[this.powder].tools.includes(t)) return;
        if (this.tool !== t) this.toolStrokes = 0;
        this.tool = t; this.puffMode = false; this.advice = '';
        this._brushCarry = 0;   // the old tool's carry can exceed the new, finer step
        if (this.step === 'dust') this._renderPanel();
        this.announce(`${TOOLS[t].label} selected.`);
    }

    _changePowder() {
        this.field.clear();
        this.lastBand = 0;
        this.puffMode = false;
        this._setStep('powder');
        this.announce('Surface wiped. Choose a powder.');
    }

    _toLift() {
        if (this.metrics.coverage < this.diff.minCoverage) {
            this.message = `Brush a little more first: the lift needs about ${Math.round(this.diff.minCoverage * 100)}% of the print developed.`;
            this._refreshDynamic();
            return;
        }
        this._setStep('lift');
        this._refreshMetrics(true);
    }

    _currentQuality(tapeCov) {
        const contrast = contrastFactor(this.powder, this.surfaceId);
        return liftQuality({ clarity: this.metrics.clarity, contrast, tapeCoverage: tapeCov });
    }

    _peel() {
        const m = this.field.metrics(this.print);
        this.metrics = { ...this.metrics, ...m };
        const quality = this._currentQuality(this.tape.coverage());
        this.final = { quality, rating: ratingFor(quality) };
        this.mounted = true;
        this._buildCard();
        const done = () => { this.peeling = false; this._setStep('compare'); this.announce(`Lift mounted: ${Math.round(quality * 100)}%, ${this.final.rating}.`); };
        if (this.reduceMotion) { done(); return; }
        this.peeling = true;
        this.peelStart = performance.now();
        this.announce('Peeling the tape.');
        this._later(done, 520);
    }

    _choosePattern(pt) {
        const actual = this.print.pattern;
        if (pt === actual) {
            this.patternOk = true;
            this._layout();   // the lift drops to 2x to make room for the magnified pair
            // Drop the last wrong guess's "Not a whorl..." before the candidate list opens (m05 M4)
            this.message = '';
            this._buildCandidates();
            this._renderPanel();
            this._drawCard();
            // the lift's marks are described once, here; a card's are described when it takes focus
            const liftWords = (this.liftMarks && this.liftMarks.length) ? ` Your lift, turned upright: ${describeMarks(this.liftMarks, actual, true)}.` : '';
            this.announce(`Correct: ${/^[aeiou]/.test(actual) ? 'an' : 'a'} ${PATTERN_INFO[actual].label.toLowerCase()}. Core and delta marked. Now pick the matching reference card.${liftWords}`);
            return;
        }
        this.message = `Not ${/^[aeiou]/.test(pt) ? 'an' : 'a'} ${PATTERN_INFO[pt].label.toLowerCase()}. ${PATTERN_INFO[pt].why} Look at the core and the triangles on your lift, then try again.`;
        this._refreshDynamic();
        this.announce(this.message);
    }

    /**
     * Show card i at the lift's size in the big frame, or the lift again (i null, or the card already shown).
     * Only changes what is drawn: no pick, no message.
     */
    _viewCard(i) {
        if (this.step !== 'compare' || !this.patternOk || this.identified) return;
        const c = Number.isInteger(i) ? this.candidates[i] : null;
        this.viewing = c && this.viewing !== i ? i : null;
        if (this.viewing !== null) {
            // V drives the pair too; the card shows in the big frame. Remember whether L or V brought the lift canvas back.
            this.zoomIdx = this.viewing;
            if (!this.fullLift) { this.fullLift = true; this.fullLiftBy = 'view'; }
        } else if (this.fullLiftBy === 'view') {
            this.fullLift = false; this.fullLiftBy = null;   // viewing ended: the pair returns unless the player asked for the whole lift
        }
        this._renderPanel();
        this._drawCard();
        this._updateAria();
        const v = this.viewing === null ? null : this.candidates[this.viewing];
        this.announce(v
            ? `Showing card ${v.index + 1}, ${v.label}, at full size. Press V for the next card.`
            : 'Showing your lift.');
    }

    /** Swap the magnified pair and the whole lift in the stage column (non-short screens). Showing the pair again drops any card on show. */
    _toggleWholeLift() {
        if (this.step !== 'compare' || !this.patternOk || this._zoomShort) return;
        this.fullLift = !this.fullLift;
        this.fullLiftBy = this.fullLift ? 'L' : null;
        if (!this.fullLift) this.viewing = null;
        this._renderPanel();
        this._drawCard();
        this._updateAria();
        const b = this._findInPanel('[data-action="fulllift"]');
        if (b && b.focus) b.focus({ preventScroll: true });
        this.announce(this.fullLift ? 'Showing your whole lift.' : 'Showing the magnified pair.');
    }

    /** V steps the big frame through lift, card 1, card 2, ... and back to the lift. */
    _cycleView() {
        this._viewCard(nextView(this.viewing, this.candidates.length));
    }

    _chooseRef(i, viaKey = false) {
        const c = this.candidates[i];
        if (!c || c.rejected) return;
        if (this.viewing !== null) { this.viewing = null; this.dirty = true; this._updateAria(); this._drawCard(); }
        if (this.fullLift) { this.fullLift = false; this.fullLiftBy = null; }   // the pair comes back for the result
        if (c.correct) {
            this.identified = true;
            this._renderPanel();
            this._drawCard();
            this.forensicEl.textContent = `${FORENSIC.compare} ${FORENSIC_MATCH}`;
            if (viaKey) this._refocus('[data-action="finish"]');   // focus first, so a screen reader queues the message after the focus speech
            this.announce(`Match. This is ${this.ownerName}'s print. The numbered tags mark the same ridge detail on both cards.`);
        } else {
            c.rejected = true;
            this.zoomIdx = i;   // the zoom stays on the rejected card, now with its numbers and X marks
            const diff = compareFeatures(this.liftFeatures, c.features);
            this.message = diff.match
                ? 'No match: the ridge endings and forks near the core sit in different places. Compare them card by card.'
                : mismatchReason(diff, this.liftFeatures, c.features);
            this._renderPanel();
            if (viaKey) this._refocusAfterPick(i);   // focus first, then the polite message
            this.announce(this.message);
        }
    }

    /** The re-render replaces the panel, so a keyboard player's focus would fall to the page. Put it back on a control (a mouse
     *  pick never gets here). The picked card is disabled once rejected, so focus goes to the next open card after it, else
     *  "Log as unidentified". The zoom is left alone (the rejected card stays on show) and the live message is not overwritten. */
    _refocusAfterPick(i) {
        const n = this.candidates.length;
        for (let k = 1; k <= n; k++) {
            const c = this.candidates[(i + k) % n];
            if (c && !c.rejected && this._refocus(`.dusting-ref[data-index="${c.index}"]`)) return;
        }
        this._refocus('[data-action="unidentified"]');
    }

    _refocus(selector) {
        const b = this._findInPanel(selector);
        if (!b || b.disabled || !b.focus) return false;
        this._refocusing = true;
        try { b.focus(); } finally { this._refocusing = false; }
        return true;
    }

    _buildResult() {
        return {
            quality: this.final.quality,
            rating: this.final.rating,
            pattern: this.print.pattern,
            identified: this.identified === true,
            surface: this.surfaceId,
            powder: this.powder,
            objectId: this.objectId,
            roomId: window.currentPlayerRoom || null
        };
    }

    _finish() {
        this._clearProgress();
        this.gameResult = this._buildResult();
        this._resultSent = true;
        super.complete(true);
    }

    /** Closing after the peel keeps the lift (as unidentified); closing earlier is a plain cancel. */
    complete(success) {
        if (this._resultSent) return super.complete(success);
        if (!this.final && this.step === 'dust') this._saveProgress();   // X mid-dust keeps the work for a resume
        if (!success && this.mounted && this.final) {
            this._clearProgress();
            this.gameResult = this._buildResult();
            this._resultSent = true;
            // viaClose: recordLift titles its one toast "Print Logged" (the Log the print button path keeps "Print Lifted")
            this.gameResult.viaClose = true;
            return super.complete(true);
        }
        if (!success && !this.gameResult) this.gameResult = { cancelled: true };
        this._resultSent = true;
        return super.complete(success);
    }

    // ------------------------------------------------------------------ compare data

    _buildCandidates() {
        const lp = this.print.pattern;
        // An object may ask for more (or fewer) reference cards than its difficulty gives: fingerprintCandidateCount, 2 to 4.
        const asked = Number(this.data.fingerprintCandidateCount);
        const n = Number.isInteger(asked) && asked >= 2 && asked <= 4 ? asked : this.diff.candidates;
        const names = [];
        const cand = Array.isArray(this.data.fingerprintCandidates) ? this.data.fingerprintCandidates : null;
        const ownerLc = String(this.ownerName).toLowerCase(), ownerRaw = String(this.owner).toLowerCase();
        // An entry may be a name, or { name, pattern } to fix that card's pattern class (F26).
        const forced = new Map();
        if (cand && cand.length) {
            for (const e of cand) {
                const nm = e && typeof e === 'object' ? (e.name || e.owner) : e;
                if (!nm) continue;
                names.push(nm);
                if (e && typeof e === 'object' && PATTERNS.includes(e.pattern)) forced.set(String(nm), e.pattern);
            }
        }
        else {
            const npcs = window.npcManager && window.npcManager.npcs;
            if (npcs) {
                const entries = typeof npcs.values === 'function' ? Array.from(npcs.values()) : Object.values(npcs);
                for (const e of entries) {
                    const nm = e && (e.displayName || e.name);
                    if (nm) names.push(nm);
                }
            }
        }
        const seed = hashString(`${this.objectId}|${this.owner}`);
        const pool = Array.from(new Set(names))
            .filter(nm => { const l = String(nm).toLowerCase(); return l !== ownerLc && l !== ownerRaw; })
            .sort((a, b) => hashString(a + seed) - hashString(b + seed));
        const fallback = ['Reference B', 'Reference C', 'Reference D'];
        // Where a decoy is meant to share the lift's pattern, prefer a candidate whose own pattern really is that one.
        if (this.diff.decoySamePattern !== 'never') {
            const at = pool.findIndex(nm => patternForOwner(nm) === lp);
            if (at > 0) pool.unshift(pool.splice(at, 1)[0]);
        } else {
            // easy: prefer people whose own pattern already differs, so their card is the same finger
            // on every surface in the mission (stable sort keeps the seeded order otherwise)
            pool.sort((a, b) => (patternForOwner(a) === lp) - (patternForOwner(b) === lp));
        }
        // A card the scenario fixed to a pattern class is always dealt, whatever the shuffle or sort above did.
        if (forced.size) {
            const keep = pool.filter(nm => forced.has(String(nm)));
            pool.splice(0, pool.length, ...keep, ...pool.filter(nm => !forced.has(String(nm))));
        }
        const decoyNames = [];
        for (let k = 0; k < n - 1; k++) decoyNames.push(pool[k] || fallback[k]);

        // A forced card fills its own slot and keeps its class. The rest are dealt by the difficulty rule,
        // so on medium a forced non-lift card cannot displace the same-class decoy (a forced lift-class
        // card already is that decoy, so the others then differ).
        const free = decoyNames.map((nm, k) => k).filter(k => !forced.has(String(decoyNames[k])));
        const forcedSame = decoyNames.some(nm => forced.get(String(nm)) === lp);
        const rule = this.diff.decoySamePattern === 'one' && forcedSame ? 'never' : this.diff.decoySamePattern;
        const freeClasses = decoyPatterns(lp, free.length, rule, seed, free.map(k => patternForOwner(decoyNames[k])));
        const decoyClasses = decoyNames.map(() => null);
        free.forEach((k, j) => { decoyClasses[k] = freeClasses[j]; });
        const decoys = decoyNames.map((nm, k) => {
            const pattern = forced.get(String(nm)) || decoyClasses[k];
            return { label: nm, pattern, print: cachedPrint({ owner: nm, pattern, whorlShape: decoyWhorlShape(nm, pattern, lp, this.owner, this.diff.decoySamePattern, k) }), correct: false };
        });
        const correct = { label: this.ownerName, pattern: lp, print: cachedPrint({ owner: this.owner, pattern: lp }), correct: true };
        const at = seed % n;
        const list = [...decoys];
        list.splice(at, 0, correct);
        this.candidates = list.map((c, i) => ({ ...c, index: i, rejected: false }));
        this.correctIndex = at;
        this._buildMarks();
    }

    /**
     * F26: mark a few minutiae round the core on the lift and on every card, so the cards can be
     * compared by eye. The owner's card carries the lift's marks; each decoy's marks are its own,
     * picked so it differs from the lift in at least one feature (pattern, loop side or a minutia).
     */
    _buildMarks() {
        const count = this.diff.marks ?? 3;
        const ownerCard = this.candidates[this.correctIndex];
        const { lift, card } = pickLiftMarks(this.print, ownerCard.print, count);
        this.liftMarks = lift;
        this.liftFeatures = featuresOf(this.print, lift);
        for (const c of this.candidates) {
            c.marks = c.correct ? card : pickDecoyMarks(this.liftFeatures, c.print, count);
            c.features = featuresOf(c.print, c.marks);
        }
        // One crop side for the whole step, from the upright offsets of the lift and every card, so the panes never
        // resize as the player moves between cards (the owner's pair is not the tightest crop).
        this._zoomSets = [
            { marks: uprightMarks(lift, this.print.centre), centre: this.print.centre },
            ...this.candidates.map(c => ({ marks: uprightMarks(c.marks, c.print.centre), centre: c.print.centre }))
        ];
        this.zoomSide = cropSide(this._zoomSets);
    }

    // ------------------------------------------------------------------ input

    _canvasPos(e) {
        const r = this.canvas.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * N;
        const y = ((e.clientY - r.top) / r.height) * N;
        return { x: Math.min(N - 1, Math.max(0, x)), y: Math.min(N - 1, Math.max(0, y)) };
    }

    _onPointerDown(e) {
        if (!['find', 'dust', 'lift', 'examine', 'powder'].includes(this.step)) return;
        e.preventDefault();
        if (this.pointerDown && e.pointerId !== this._pointerId) return;   // a second finger never joins or replaces the stroke
        this._pointerId = e.pointerId;
        const pos = this._canvasPos(e);
        this.reticle = pos; this.pointerInside = true; this.pointerDown = true;
        // Touch in the Find step: dragging shows the proximity cue first; the check happens on lift (m5).
        this._touchFind = e.pointerType === 'touch' && this.step === 'find';
        try { this.canvas.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointers can't be captured */ }
        this.canvas.focus({ preventScroll: true });
        this._countStroke();
        this._brushCarry = 0;   // a new stroke: spacing restarts (the tick below covers the start)
        this._act(pos, null);
        this.lastPt = pos;
        this.dirty = true;
    }

    _onPointerMove(e) {
        if (this.pointerDown && e.pointerId !== this._pointerId) return;
        const pos = this._canvasPos(e);
        this.pointerInside = true;
        const prev = this.reticle;
        this.reticle = pos;
        if (this.pointerDown) this._act(pos, this.lastPt || prev);
        this.lastPt = this.pointerDown ? pos : null;
        this.dirty = true;
        this._updateNear();
    }

    /** Find step: say once per approach that the torch is close to the print (visible text and aria-live), clear it on leaving. */
    _updateNear() {
        if (this.step !== 'find' || this.found || !this.pointerInside) return;
        const near = nextNearState(!!this.nearPrint, this.print.mask, N, this.reticle.x, this.reticle.y, this.diff.nearRadius);
        if (near === !!this.nearPrint) return;
        this.nearPrint = near;
        if (!near) { this._clearNear(); return; }
        // The status line is both the visible text and the live region. A message spoken in the last second
        // (a "Nothing there") is not cut off: the cue waits for it.
        const wait = 1000 - (performance.now() - (this._saidAt || -1e9));
        if (wait <= 0) this.announce(NEAR_TEXT);
        else if (!this._nearTimer) {
            this._nearTimer = this._later(() => {
                this._nearTimer = null;
                if (this.nearPrint && this.step === 'find' && !this.found) this.announce(NEAR_TEXT);
            }, wait);
        }
    }

    _clearNear() {
        this.nearPrint = false;
        if (this._nearTimer) { clearTimeout(this._nearTimer); this._timers = this._timers.filter(x => x !== this._nearTimer); this._nearTimer = null; }
        if (this.statusEl && this.statusEl.textContent === NEAR_TEXT) this.statusEl.textContent = '';
    }

    _onPointerUp(e) {
        if (this.pointerDown && e && e.pointerId !== this._pointerId) return;   // only the stroke's own pointer ends it
        if (!this.pointerDown && e && e.type === 'lostpointercapture') return;   // pointerup already ended it; capture release follows
        // Snapshot, then clear the stroke first: releasing capture may fire lostpointercapture synchronously, and that
        // nested call must find no stroke and do nothing (no second save, no lost touch Find attempt).
        const touchFind = this._touchFind;
        const pid = e ? e.pointerId : undefined;
        this._touchFind = false;
        this.pointerDown = false;
        this.lastPt = null;
        this._pointerId = null;
        this._brushCarry = 0;
        if (this.step === 'dust') this._saveProgress();
        if (touchFind && e && e.type === 'pointerup' && this.step === 'find') this._attemptFind(this.reticle);
        const cv = this.canvas;
        if (pid !== undefined && cv && cv.hasPointerCapture && cv.releasePointerCapture) {
            try { if (cv.hasPointerCapture(pid)) cv.releasePointerCapture(pid); } catch (err) { /* already gone */ }
        }
    }

    /** First stroke on this powder: short landscape then hides the instruction paragraph (CSS, [data-brushed]) to make room
     *  for the feedback line. The paragraph stays in the tree for screen readers. */
    _setBrushed(on) {
        this.brushed = !!on;
        if (this.root && this.root.setAttribute) { if (on) this.root.setAttribute('data-brushed', '1'); else if (this.root.removeAttribute) this.root.removeAttribute('data-brushed'); }
    }

    /** A brush stroke starts (pointer down, Space held, Enter brushing on): feeds the feather suggestion. */
    _countStroke() {
        if (this.step !== 'dust' || this.puffMode) return;
        this.toolStrokes = (this.toolStrokes || 0) + 1;
        if (this.toolStrokes === FINE_SWITCH_AFTER_STROKES && this._suggestFeather()) this.announce(FEATHER_SUGGESTION);
    }

    _suggestFeather() {
        return shouldSuggestFeather({
            tool: this.tool, strokes: this.toolStrokes || 0, coverage: this.metrics.coverage,
            minCoverage: this.diff.minCoverage, tools: POWDERS[this.powder] && POWDERS[this.powder].tools
        });
    }

    /** One brush/press/mark at pos; with `from`, a continuous stroke from there. */
    _act(pos, from, keyed = false) {
        if (this.step === 'find') { if (!from && !this._touchFind) this._attemptFind(pos); return; }
        if (this.step === 'dust') {
            if (this.puffMode) { this.field.puff(pos.x, pos.y, PUFF_RADIUS); this.field.puff(pos.x, pos.y, PUFF_RADIUS); }
            else {
                const tool = brushFeel(TOOLS[this.tool], this.difficultyId);
                // a held key ticks in place every KEY_TICK_MS, so it lays powder more gently than a moving stroke
                if (keyed) tool.strength *= KEY_HOLD_GENTLE;
                if (from) this._brushCarry = this.field.brushLine(from.x, from.y, pos.x, pos.y, tool, this._brushCarry || 0); else this.field.brush(pos.x, pos.y, tool);
            }
            this.dirty = true;
        } else if (this.step === 'lift') {
            if (from) {
                const d = Math.hypot(pos.x - from.x, pos.y - from.y), k = Math.max(1, Math.ceil(d / 4));
                for (let s = 1; s <= k; s++) this.tape.press(from.x + (pos.x - from.x) * s / k, from.y + (pos.y - from.y) * s / k, TAPE_RADIUS, this.tapeBounds);
            } else this.tape.press(pos.x, pos.y, TAPE_RADIUS, this.tapeBounds);
            this.dirty = true;
        }
    }

    _onKeyDown(e) {
        if (!this.gameState.isActive || e.ctrlKey || e.metaKey || e.altKey) return;
        const k = e.key, t = e.target;
        const tag = t && t.tagName;
        const nativeControl = tag === 'BUTTON' || tag === 'INPUT' || tag === 'A';
        const canvasStep = ['find', 'dust', 'lift', 'examine', 'powder'].includes(this.step);
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(k) && canvasStep && tag !== 'INPUT') {
            e.preventDefault();
            const d = e.shiftKey ? 12 : 4;
            const old = { ...this.reticle };
            this.reticle = {
                x: Math.min(N - 1, Math.max(0, old.x + (k === 'ArrowRight' ? d : k === 'ArrowLeft' ? -d : 0))),
                y: Math.min(N - 1, Math.max(0, old.y + (k === 'ArrowDown' ? d : k === 'ArrowUp' ? -d : 0)))
            };
            this.pointerInside = true;
            if (this.spaceHeld || this.stickyBrush) this._act(this.reticle, old);
            this.dirty = true;
            this._updateNear();
            return;
        }
        if ((k === ' ' || k === 'Enter') && !nativeControl && canvasStep) {
            e.preventDefault();
            if (this.step === 'find') { if (!e.repeat) this._attemptFind(this.reticle); return; }
            if (this.step === 'dust' && k === 'Enter') {
                if (!e.repeat) { this.stickyBrush = !this.stickyBrush; if (this.stickyBrush) { this._brushCarry = 0; this._countStroke(); } else if (this.step === 'dust') this._saveProgress(); this.announce(this.stickyBrush ? 'Brushing on. Arrow keys now brush. Press Enter to stop.' : 'Brushing off.'); if (this.metrics) this._refreshDynamic(); }
                return;
            }
            if (this.step === 'dust' || this.step === 'lift') {
                if (!this.spaceHeld) {
                    this.spaceHeld = true;
                    this._brushCarry = 0;
                    this._countStroke();
                    this._act(this.reticle, null);
                    clearInterval(this._keyTimer);
                    this._keyTimer = setInterval(() => this._act(this.reticle, null, true), KEY_TICK_MS);
                }
            }
            return;
        }
        if (tag === 'INPUT' && t.type === 'text') return;
        const lower = k.length === 1 ? k.toLowerCase() : k;
        if (this.step === 'powder' && ['1', '2', '3'].includes(lower)) { this._choosePowder(Object.keys(POWDERS)[Number(lower) - 1]); return; }
        if (this.step === 'compare' && this.patternOk && !this.identified && /^[1-9]$/.test(lower) && Number(lower) <= this.candidates.length) {
            e.preventDefault();
            const a = document.activeElement;   // the footer row sits in the body on phone portrait, so it counts as the panel
            const inPanel = !!a && ((this.panel && this.panel.contains(a)) || !!(a.closest && a.closest(MOVED_FOOT)));
            this._chooseRef(Number(lower) - 1, inPanel);
            return;
        }
        if (this.step === 'compare' && this.patternOk && lower === 'l' && !this._zoomShort) {
            e.preventDefault();
            if (e.repeat) return;   // holding L must not flicker the view
            this._toggleWholeLift();
            return;
        }
        if (this.step === 'compare' && this.patternOk && !this.identified && lower === 'v') {
            e.preventDefault();
            if (e.repeat) return;   // holding V must not spin through the cards
            this._cycleView();
            return;
        }
        if (this.step === 'dust' || this.step === 'powder') {
            if (lower === 'f') { this._pickBrush('fine'); return; }
            if (lower === 'b') { this._pickBrush('broad'); return; }
            if (lower === 'w') { this._pickBrush('wand'); return; }
        }
        if (this.step === 'dust') {
            if (lower === 'l') this._toLift();
            else if (lower === 't') this._action('puff');
            else if (lower === 'c') this._changePowder();
        } else if (this.step === 'lift' && lower === 'p') this._peel();
        else if (this.step === 'find' && lower === 'h' && this.hintReady) this._action('hint');
    }

    _pickBrush(t) {
        if (this.step === 'dust' && this.powder && POWDERS[this.powder].tools.includes(t)) this._chooseTool(t);
    }

    _onKeyUp(e) {
        if (e.key === ' ' && this.step === 'dust') this._saveProgress();
        if (e.key === ' ') { this.spaceHeld = false; clearInterval(this._keyTimer); this._keyTimer = null; }
    }

    // ------------------------------------------------------------------ find

    _attemptFind(pos) {
        if (this.found) return;
        const px = Math.round(pos.x), py = Math.round(pos.y);
        let hit = false;
        for (let dy = -3; dy <= 3 && !hit; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
                const x = px + dx, y = py + dy;
                if (x >= 0 && y >= 0 && x < N && y < N && this.print.mask[y * N + x] > 0.3) { hit = true; break; }
            }
        }
        if (!hit) {
            this.misses = (this.misses || 0) + 1;
            this._armNudge();
            if (hintNudgeDue({ misses: this.misses })) this._showNudge();
            this.message = 'Nothing there. Keep the light low and look for a small patch of curved ridges, not a straight reflection.';
            this._refreshDynamic();
            this.announce(this.message);
            return;
        }
        this.found = true;
        this._clearNear();
        this.foundAt = performance.now();
        this.message = 'Found it: a latent print.';
        this._refreshDynamic();
        this.announce('Found the print.');
        this.dirty = true;
        this._later(() => this._setStep('powder'), this.reduceMotion ? 0 : 450);
    }

    /** Idle nudge: restarts on every miss and on entering the find step; fires after NUDGE_IDLE_MS without a find. */
    _armNudge() {
        if (this._nudgeTimer) { clearTimeout(this._nudgeTimer); this._timers = (this._timers || []).filter(x => x !== this._nudgeTimer); }
        this._nudgeTimer = this._later(() => { this._nudgeTimer = null; if (this.step === 'find' && !this.found && hintNudgeDue({ idleMs: NUDGE_IDLE_MS })) this._showNudge(); }, NUDGE_IDLE_MS);
    }

    /** Shows the Hint button if it was still hidden, outlines it, and says so in words ("Stuck? Try Hint"). A UI label, not spoken text. */
    _showNudge() {
        if (this.nudged || this.step !== 'find') return;
        this.nudged = true;
        this.hintReady = true;
        this._renderPanel();
        this.announce(NUDGE_TEXT);
    }

    // ------------------------------------------------------------------ rendering

    _frame() {
        if (!this.gameState.isActive && this._resultSent) return;
        const animating = (this.step === 'find' && this.hintOn && !this.reduceMotion) || this.peeling || (this.found && this.step === 'find' && !this.reduceMotion);
        if (this.dirty || animating) {
            this.dirty = false;
            this._refreshMetrics(false);
            this._draw();
        }
        this._raf = requestAnimationFrame(() => this._frame());
    }

    _refreshMetrics(force) {
        if (!['dust', 'lift'].includes(this.step)) return;
        const now = performance.now();
        if (!force && now - (this._lastMetrics || 0) < 120) { if (this.dirty === false) this.dirty = true; return; }
        this._lastMetrics = now;
        const m = this.field.metrics(this.print);
        let fog = 0;
        for (let i = 0; i < N * N; i++) if (this.print.mask[i] > 0.5 && this.field.fog(i) > 0.12) fog++;
        this.metrics = { coverage: m.coverage, clarity: m.clarity, foggy: this.maskCount ? fog / this.maskCount : 0 };
        const band = Math.floor(m.coverage * 4);
        if (band > this.lastBand) { this.announce(`Coverage ${Math.round(m.coverage * 100)}%.`); }
        this.lastBand = band;
        this._refreshDynamic();
        this._updateAria();
    }

    _setDyn(name, fn) {
        const el = this.panel.querySelector(`[data-dyn="${name}"]`);
        if (el) fn(el);
    }

    /** Sets the feedback line; in short landscape, when the text changed, scrolls it into view above the pinned foot
     *  (the panel's scroll-padding-bottom is the foot height). Unchanged text never scrolls, so the panel does not jitter. */
    _setFeedback(text, tip) {
        this._setDyn('feedback', el => {
            if (tip !== undefined) { if (tip) el.title = tip; else if (el.removeAttribute) el.removeAttribute('title'); }
            if (el.textContent === text) return;
            el.textContent = text;
            if (this.root && this.root.classList.contains('dusting-short') && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' });
        });
    }

    _refreshDynamic() {
        const m = this.metrics;
        const pct = v => `${Math.round(v * 100)}%`;
        const pctFloor = v => `${Math.floor(v * 100 + 1e-9)}%`;   // 45% never shows while Lift (needs 45%) is still locked
        const word = v => (v >= 0.85 ? 'good' : v >= 0.6 ? 'fair' : v >= 0.3 ? 'faint' : 'low');
        if (this.step === 'find' || this.step === 'compare') {
            this._setDyn('feedback', el => { el.textContent = this.message; });
            this._setDyn('nudge', el => { el.textContent = this.nudged ? NUDGE_TEXT : ''; });
            return;
        }
        if (this.step === 'dust') {
            const shortMode = this.root.classList.contains('dusting-short');
            const belowMin = m.coverage < this.diff.minCoverage;
            // Short landscape has no room for the "needs 45% coverage" button text, so the hint rides on the Coverage line.
            this._setDyn('cov-text', el => {
                const want = shortMode && belowMin ? `${pctFloor(m.coverage)} (${word(m.coverage)}) / ${pct(this.diff.minCoverage)} to lift` : `${pctFloor(m.coverage)} (${word(m.coverage)})`;
                if (el.textContent !== want) el.textContent = want;
            });
            this._setDyn('cov-bar', el => { el.style.width = pct(Math.min(1, m.coverage)); });
            this._setDyn('cov-min', el => { el.style.left = pct(this.diff.minCoverage); el.title = `Lift unlocks at ${pct(this.diff.minCoverage)}`; });
            this._setDyn('clar-text', el => { el.textContent = `${pct(m.clarity)} (${word(m.clarity)})`; });
            this._setDyn('clar-bar', el => { el.style.width = pct(Math.min(1, m.clarity)); });
            const q = this._currentQuality(1);
            this._setDyn('estimate', el => { el.textContent = m.coverage > 0.02 ? `Lift would score about ${Math.round(q * 100)}% (${ratingFor(q)}).` : 'Brush over the print to begin.'; });
            const canLift = m.coverage >= this.diff.minCoverage;
            this._setDyn('lift-btn', el => {
                el.disabled = !canLift;
                const key = canLift ? 'ready' : 'locked';
                if (el.dataset.state !== key) {
                    const parts = canLift ? LIFT_READY : LIFT_LOCKED(pct(this.diff.minCoverage));
                    el.dataset.state = key;
                    el.title = lblPlain(parts);
                    el.querySelector('.dusting-lbl').innerHTML = lblHtml(parts);
                }
            });
            // Short landscape hides the status line and the Keys line on this step, so sticky keyboard brushing
            // shows its state on the feedback line too (R6 m1); the announcement is unchanged.
            const brushing = this.stickyBrush && this.root.classList.contains('dusting-short') ? 'Brushing on. ' : '';
            // the Enter key help: Keys line and instruction are hidden here, so it rides on the line's tooltip too
            this._setFeedback(brushing + (this.message || this.advice || this._coach()), shortMode && this.stickyBrush ? 'Enter stops brushing' : '');
            // a real ridge brushed in (coverage above 0) hides the instruction in short dust; a stray click does not
            if (!this.brushed && m.coverage > 0) this._setBrushed(true);
        } else if (this.step === 'lift') {
            const tc = this.tape.coverage();
            this._setDyn('tape-text', el => { el.textContent = `${pct(tc)} (${tc >= 0.85 ? 'good' : tc >= 0.5 ? 'fair' : 'bubbles left'})`; });
            this._setDyn('tape-bar', el => { el.style.width = pct(tc); });
            const q = this._currentQuality(tc);
            this._setDyn('estimate', el => { el.textContent = `Lift would score about ${Math.round(q * 100)}% (${ratingFor(q)}).`; });
            this._setDyn('feedback', el => {
                el.textContent = tc < 0.6 ? 'Bubbles left under the tape leave holes in the lift. Rub over the pale blisters.' : 'Good. Peel and mount when you are ready.';
            });
        }
    }

    _coach() {
        const m = this.metrics;
        const short = !!(this.root && this.root.classList.contains('dusting-short'));
        const why = wrongPowderReason(this.powder, this.surfaceId, short);
        if (why && m.coverage > 0.03) return short ? why : `${why} Change powder to see the difference.`;
        if (m.foggy > 0.08) return foggyCoach(m.coverage, this.diff.minCoverage);
        if (m.coverage < 0.03) return 'Brush over the print. Ridges appear where the powder clings.';
        if (this._suggestFeather()) return FEATHER_SUGGESTION;
        if (m.coverage < this.diff.minCoverage) return 'Ridges are coming up. Keep sweeping across the print.';
        if (m.clarity < 0.75) return 'Good start. Cover the rest of the print with light strokes, then lift.';
        return 'The ridges are clear. Lift when you are happy, or fill any gaps first.';
    }

    /** Advice that can run long (the wrong-powder reason). It is announced as usual; in short landscape the status line is
     *  visually hidden on the dust and lift steps, so the full text rides on the panel's feedback line, which is not a live
     *  region: a screen reader hears it once, from the status line. The feather tip is not stored here: a live warning about
     *  the current state (fog, over-brushing) beats stale advice, and _coach() already ranks and drops the tip. */
    advise(msg) {
        if (!msg) return;
        this.advice = this.root && this.root.classList.contains('dusting-short') ? msg : '';
        if (this.advice) this._setFeedback(this.advice);
        this.announce(msg);
    }

    announce(msg) {
        if (!msg || !this.statusEl) return;
        this._saidAt = performance.now();
        this.statusEl.textContent = '';
        // a changed text node is what a screen reader notices
        this.statusEl.textContent = msg;
    }

    _updateAria() {
        if (!this.canvas) return;
        const pct = Math.floor(this.metrics.coverage * 100 + 1e-9);
        const label = {
            examine: `Close-up of ${this.surface.name}.`,
            find: `Close-up of ${this.surface.name} lit from a low angle. ${this.found ? 'Print found.' : 'The print has not been found yet.'}`,
            powder: `Close-up of ${this.surface.name}.`,
            dust: `Print about ${pct}% developed.${this.metrics.coverage < 0.5 ? ' Large parts are still faint.' : ''}`,
            lift: `Tape over the print, ${Math.round(this.tape.coverage() * 100)}% pressed down.`,
            compare: this.viewing !== null && this.candidates[this.viewing] && !this.identified
                ? `Reference card ${this.viewing + 1}, ${this.candidates[this.viewing].label}, at full size, with its core, deltas and marked minutiae.`
                : `Lifted print on a backing card, ${PATTERN_INFO[this.print.pattern].label.toLowerCase()} pattern.`
        }[this.step];
        this.canvas.setAttribute('aria-label', label || '');
    }

    _draw() {
        const c = this.ctx;
        c.imageSmoothingEnabled = false;
        if (this.step === 'compare') { this._drawCard(); return; }
        if (this.step === 'dust' || this.step === 'lift') this._drawDust();
        else if (this.step === 'find') this._drawFind();
        else { c.putImageData(this._surfaceImage(), 0, 0); }
        if (this.step === 'lift') this._drawTape();
        this._drawReticle();
    }

    _surfaceImage() {
        const d = this.img.data;
        d.set(this.surfacePixels);
        return this.img;
    }

    _drawFind() {
        const sp = this.surfacePixels, d = this.img.data, p = this.print;
        const rx = this.reticle.x, ry = this.reticle.y;
        const R = 24 * this.diff.sheenScale;
        const res = this.diff.residueStrength;
        const hcGlint = this.highContrast;
        const glint = findGlint(this.surfaceLight, hcGlint);
        // the unlit surface is drawn at half brightness, so the floor is scaled against that
        const floorScale = findFloorScale(0.5 * (this.surfaceMeanLuma || 0), glint);
        const sp2 = { lit: 0, ridge: 0, mask: 0, res, floor: this.diff.findFloor, floorScale, dotted: false, hc: this.highContrast };
        for (let y = 0; y < N; y++) {
            for (let x = 0; x < N; x++) {
                const i = y * N + x, j = i * 4;
                const q = ((x - rx) ** 2 + (y - ry) ** 2) / (R * R);
                const lit = q < 1 && this.pointerInside ? 1 - q : 0;
                let r = sp[j], g = sp[j + 1], b = sp[j + 2];
                const dim = 0.5 + 0.5 * Math.min(1, lit * 2.2);
                r *= dim; g *= dim; b *= dim;
                // The dotted floor shows on every level, fainter as it gets harder (m04 blind run: the
                // patch was nearly invisible with the options off; m05 blind A m8, m06 A-R10 on easy)
                sp2.lit = lit; sp2.ridge = p.ridges[i]; sp2.mask = p.mask[i]; sp2.dotted = ((x + y) & 1) === 0;
                const s = findSheen(sp2);
                if (s > 0) {
                    r += (glint[0] - r) * s; g += (glint[1] - g) * s; b += (glint[2] - b) * s;
                }
                d[j] = r; d[j + 1] = g; d[j + 2] = b; d[j + 3] = 255;
            }
        }
        const c = this.ctx;
        c.putImageData(this.img, 0, 0);
        if (this.pointerInside) {
            c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1;
            c.setLineDash([2, 2]); c.beginPath(); c.arc(rx, ry, R, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
        }
        if (this.hintOn) {
            const pulse = this.reduceMotion ? 0 : (Math.sin(performance.now() / 180) * 2);
            c.strokeStyle = '#00ff41'; c.lineWidth = 2; c.setLineDash([4, 3]);
            c.beginPath(); c.arc(this.printCentre.x, this.printCentre.y, 24 + pulse, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
        }
        if (this.found && !this.reduceMotion) {
            const t = Math.min(1, (performance.now() - this.foundAt) / 450);
            c.strokeStyle = '#00ff41'; c.lineWidth = 2;
            c.beginPath(); c.arc(this.printCentre.x, this.printCentre.y, 10 + t * 50, 0, Math.PI * 2); c.stroke();
        }
    }

    /** Powder over the surface (or a flat high-contrast field). */
    _paintPrint(bg, holes) {
        const d = this.img.data, p = this.print, f = this.field;
        const pw = POWDERS[this.powder];
        const pc = hexToRgb(pw.colour);
        const contrast = contrastFactor(this.powder, this.surfaceId);
        const wrong = contrast < 0.9;
        const vis = contrast >= 1 ? 1 : contrast >= 0.9 ? 0.82 : 0.7;
        const res = this.diff.residueStrength;
        const hc = this.highContrast;
        const hcInk = pw.id === 'silver' ? [255, 255, 255] : [0, 0, 0];
        const hcBg = pw.id === 'silver' ? [0, 0, 0] : [255, 255, 255];
        // Fog is blurred outwards and held inside the print's feathered mask, so a smear has soft edges, not the stroke's bounding box.
        const smear = hc ? null : softenField(f, 6);
        for (let i = 0; i < N * N; i++) {
            const j = i * 4;
            let dens = developedDensity(f, p, i, res);
            if (!hc) {
                // Fog follows the print, fading out at its edge, instead of showing the brushed bounding box.
                const fg = f.fog(i);
                dens = Math.min(1, dens - fg * 0.85 + smear[i] * (0.85 + FOG_HAZE) * Math.min(1, this.softMask[i] * 1.3));
            }
            dens *= hc ? 1 : vis;
            if (holes && holes[i]) dens *= 0.25;
            let pr = pc[0], pg = pc[1], pb = pc[2];
            if (wrong && !hc) {
                // A poor powder still leaves a faint, dull trace: pull it away from the surface tone so it can be seen.
                const lb = 0.3 * bg[j] + 0.59 * bg[j + 1] + 0.11 * bg[j + 2];
                const lp = 0.3 * pr + 0.59 * pg + 0.11 * pb;
                if (Math.abs(lb - lp) < 90) {
                    const to = lb > 128 ? 0 : 255, k = 0.45;
                    pr += (to - pr) * k; pg += (to - pg) * k; pb += (to - pb) * k;
                }
            }
            let r, g, b;
            if (hc) {
                dens = dens > 0.3 ? 1 : 0;
                r = hcBg[0] + (hcInk[0] - hcBg[0]) * dens; g = hcBg[1] + (hcInk[1] - hcBg[1]) * dens; b = hcBg[2] + (hcInk[2] - hcBg[2]) * dens;
            } else {
                r = bg[j] + (pr - bg[j]) * dens; g = bg[j + 1] + (pg - bg[j + 1]) * dens; b = bg[j + 2] + (pb - bg[j + 2]) * dens;
            }
            d[j] = r; d[j + 1] = g; d[j + 2] = b; d[j + 3] = 255;
        }
        if (hc) this._outlineMask(d, hcInk);
        else if (holes === null) this._outlineMask(d, null, true);   // the dust step only (the lift card passes its holes)
    }

    /**
     * Dotted edge of the print. High contrast draws it solid grey. By default (`faint`) the dust step draws it half as
     * strong in the tone that stands out from the surface (light on dark, dark on light), dashed so it is a pattern and
     * not only a colour, and it stays under the powder once the ridges show (m04 blind run: nothing said where the print was).
     */
    _outlineMask(d, ink, faint = false) {
        const m = this.print.mask;
        const f = this.field;
        const FAINT = 0.55;
        for (let y = 1; y < N - 1; y++) {
            for (let x = 1; x < N - 1; x++) {
                const i = y * N + x;
                const inside = m[i] > 0.5;
                if (inside && (m[i - 1] <= 0.5 || m[i + 1] <= 0.5 || m[i - N] <= 0.5 || m[i + N] <= 0.5) && ((x + y) & 3) < 2) {
                    const j = i * 4;
                    if (!faint) { d[j] = 128; d[j + 1] = 128; d[j + 2] = 128; continue; }
                    const lum = 0.3 * d[j] + 0.59 * d[j + 1] + 0.11 * d[j + 2];
                    const to = lum > 128 ? 0 : 255;
                    const k = FAINT * (1 - Math.min(1, f.reveal(i)));
                    d[j] += (to - d[j]) * k; d[j + 1] += (to - d[j + 1]) * k; d[j + 2] += (to - d[j + 2]) * k;
                }
            }
        }
        void ink;
    }

    _drawDust() {
        this._paintPrint(this.surfacePixels, null);
        this.ctx.putImageData(this.img, 0, 0);
    }

    _drawTape() {
        const c = this.ctx, b = this.tapeBounds;
        let off = 0, alpha = 1;
        if (this.peeling) {
            const t = Math.min(1, (performance.now() - this.peelStart) / 500);
            off = -t * (b.y + b.h + 4); alpha = 1 - t * 0.6;
        }
        c.save();
        c.globalAlpha = alpha;
        c.fillStyle = 'rgba(232,218,160,0.30)';
        c.fillRect(b.x, b.y + off, b.w, b.h);
        c.strokeStyle = 'rgba(232,218,160,0.9)'; c.lineWidth = 1; c.setLineDash([3, 2]);
        c.strokeRect(b.x + 0.5, b.y + off + 0.5, b.w - 1, b.h - 1); c.setLineDash([]);
        const n = this.tape.n, cw = b.w / n, ch = b.h / n;
        for (let gy = 0; gy < n; gy++) {
            for (let gx = 0; gx < n; gx++) {
                if (this.tape.cells[gy * n + gx]) continue;
                const cx = b.x + (gx + 0.5) * cw, cy = b.y + off + (gy + 0.5) * ch;
                c.fillStyle = 'rgba(255,255,255,0.22)';
                c.beginPath(); c.ellipse(cx, cy, cw * 0.38, ch * 0.32, 0, 0, Math.PI * 2); c.fill();
                c.strokeStyle = this.highContrast ? '#ffffff' : 'rgba(255,255,255,0.85)';
                c.beginPath(); c.ellipse(cx, cy, cw * 0.38, ch * 0.32, 0, 0, Math.PI * 2); c.stroke();
                c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(Math.round(cx - cw * 0.18), Math.round(cy - ch * 0.15), 2, 1);
            }
        }
        c.restore();
    }

    _drawReticle() {
        if (!this.pointerInside || this.step === 'find') return;
        const c = this.ctx, r = this.reticle;
        const rad = this.step === 'lift' ? TAPE_RADIUS : this.puffMode ? PUFF_RADIUS : TOOLS[this.tool] ? brushFeel(TOOLS[this.tool], this.difficultyId).radius : 5;
        c.save();
        c.strokeStyle = this.highContrast ? (POWDERS[this.powder] && POWDERS[this.powder].id === 'silver' ? '#fff' : '#000') : '#00ff41';
        c.lineWidth = 1;
        c.setLineDash(this.puffMode ? [1, 2] : []);
        c.beginPath(); c.arc(r.x, r.y, rad, 0, Math.PI * 2); c.stroke();
        c.setLineDash([]);
        c.beginPath(); c.moveTo(r.x - 2, r.y); c.lineTo(r.x + 3, r.y); c.moveTo(r.x, r.y - 2); c.lineTo(r.x, r.y + 3); c.stroke();
        c.restore();
    }

    // ------------------------------------------------------------------ the lift card

    _buildCard() {
        const cv = document.createElement('canvas');
        cv.width = N; cv.height = N;
        const c = cv.getContext('2d');
        // A supplied card PNG is not square: it is contained and centred, with the dark panel colour round it.
        const cardArt = hasArt('backing-card');
        const tb = this.tapeBounds;
        const cardX = tb.x + tb.w / 2; // the print moves about the surface, so the card follows it
        const cr = artRect('backing-card', cardX);
        if (cardArt) { c.fillStyle = '#0a0f0c'; c.fillRect(0, 0, N, N); }
        drawSlot(c, 'backing-card', cardX);
        const pw = POWDERS[this.powder];
        if (pw.backing !== '#f2f0ea') {
            c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = pw.backing;
            c.fillRect(cr.x, cr.y, cr.w, cr.h); c.restore();
        }
        const bg = c.getImageData(0, 0, N, N).data;
        const holes = new Uint8Array(N * N);
        const b = this.tapeBounds, n = this.tape.n;
        for (let y = 0; y < N; y++) {
            for (let x = 0; x < N; x++) {
                if (x < b.x || y < b.y || x >= b.x + b.w || y >= b.y + b.h) continue;
                const gx = Math.min(n - 1, Math.floor((x - b.x) / (b.w / n))), gy = Math.min(n - 1, Math.floor((y - b.y) / (b.h / n)));
                if (!this.tape.cells[gy * n + gx]) holes[y * N + x] = 1;
            }
        }
        const hcSave = this.highContrast;
        this.highContrast = false;
        this._paintPrint(bg, holes);
        this.highContrast = hcSave;
        c.putImageData(this.img, 0, 0);
        this.cardCanvas = cv;
        this.cardDark = pw.backing !== '#f2f0ea';
    }

    _drawCard() {
        const c = this.ctx;
        const shown = this.patternOk && !this.identified && this.viewing !== null ? this.candidates[this.viewing] : null;
        if (shown) {
            // the card at the lift's size, with the same mark sizes, and a name tag so it is never taken for the lift
            this._paintReference(c, shown);
            c.save(); c.font = 'bold 7px monospace'; c.textBaseline = 'top';
            const tag = `CARD ${shown.index + 1}: ${String(shown.label).toUpperCase()}`;
            const w = Math.min(N - 4, c.measureText(tag).width + 6);
            c.fillStyle = 'rgba(16, 18, 20, 0.85)'; c.fillRect(2, 2, w, 10);
            c.fillStyle = '#f2f0ea'; c.fillText(tag, 5, 4, N - 10);
            c.restore();
            return;
        }
        c.drawImage(this.cardCanvas, 0, 0);
        const dark = this.cardDark;
        const mark = dark ? '#00ff41' : '#0a6b2d';
        if (this.patternOk) {
            c.save(); c.strokeStyle = mark; c.fillStyle = mark; c.lineWidth = 1.5;
            // F26: a cross for a core, so it is not mistaken for a ridge-ending ring
            for (const k of this.print.cores) { c.beginPath(); c.moveTo(k.x - 4, k.y); c.lineTo(k.x + 4, k.y); c.moveTo(k.x, k.y - 4); c.lineTo(k.x, k.y + 4); c.stroke(); }
            for (const t of this.print.deltas) {
                if (t.x < 0 || t.y < 0 || t.x >= N || t.y >= N) continue;
                c.beginPath(); c.moveTo(t.x, t.y - 4); c.lineTo(t.x + 4, t.y + 3); c.lineTo(t.x - 4, t.y + 3); c.closePath(); c.stroke();
            }
            c.restore();
        }
        if (this.patternOk && !this.identified && this.liftMarks) this._drawMarks(c, this.liftMarks, dark ? '#ffd23f' : '#b00020');
        if (this.identified) this._drawMatchTags(c, this.print, this._matches().map(m => m.lift), dark ? '#00ff41' : '#b00020', dark);
    }

    /** Pairs of minutiae (lift, reference) that share canonical coordinates. */
    _matches() {
        if (this._matchCache) return this._matchCache;
        const ref = this.candidates[this.correctIndex].print;
        const out = [];
        const used = new Set();
        const inside = (p, m) => m.x > 6 && m.y > 6 && m.x < N - 6 && m.y < N - 6 && p.mask[Math.round(m.y) * N + Math.round(m.x)] > 0.5;
        for (const m of this.print.minutiae) {
            if (!inside(this.print, m)) continue;
            let best = null, bd = 4;
            for (let k = 0; k < ref.minutiae.length; k++) {
                if (used.has(k)) continue;
                const r = ref.minutiae[k];
                const dd = Math.hypot((r.ux ?? r.x) - (m.ux ?? m.x), (r.uy ?? r.y) - (m.uy ?? m.y));
                if (dd < bd && inside(ref, r)) { bd = dd; best = k; }
            }
            if (best !== null) { used.add(best); out.push({ lift: m, ref: ref.minutiae[best] }); }
        }
        // spread them out: take up to five that are far apart
        const chosen = [];
        for (const m of out) {
            if (chosen.every(o => Math.hypot(o.lift.x - m.lift.x, o.lift.y - m.lift.y) > 18)) chosen.push(m);
            if (chosen.length === 5) break;
        }
        this._matchCache = chosen;
        return chosen;
    }

    _drawMatchTags(c, _print, pts, col, dark) {
        c.save(); c.font = 'bold 8px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
        pts.forEach((m, i) => {
            c.fillStyle = dark ? '#000' : '#fff'; c.strokeStyle = col; c.lineWidth = 1;
            c.beginPath(); c.arc(m.x, m.y, 5, 0, Math.PI * 2); c.fill(); c.stroke();
            c.fillStyle = col; c.fillText(String(i + 1), m.x, m.y + 0.5);
        });
        c.restore();
    }

    /** Marked minutiae: a ring for a ridge ending, a square for a fork. */
    _drawMarks(c, marks, col) {
        c.save(); c.strokeStyle = col; c.lineWidth = 1.5;
        for (const m of marks) {
            c.beginPath();
            if (m.type === 'bifurcation') c.rect(m.x - 3.5, m.y - 3.5, 7, 7);
            else c.arc(m.x, m.y, 4, 0, Math.PI * 2);
            c.stroke();
        }
        c.restore();
    }

    /** Core rings and delta triangles on a reference card, as on the lift, so the class can be read on both. */
    _drawCardSingulars(c, p) {
        c.save(); c.strokeStyle = '#0a6b2d'; c.lineWidth = 1.5;
        for (const k of p.cores) { c.beginPath(); c.moveTo(k.x - 4, k.y); c.lineTo(k.x + 4, k.y); c.moveTo(k.x, k.y - 4); c.lineTo(k.x, k.y + 4); c.stroke(); }
        for (const t of p.deltas) {
            if (t.x < 0 || t.y < 0 || t.x >= N || t.y >= N) continue;
            c.beginPath(); c.moveTo(t.x, t.y - 4); c.lineTo(t.x + 4, t.y + 3); c.lineTo(t.x - 4, t.y + 3); c.closePath(); c.stroke();
        }
        c.restore();
    }

    /** Which card the magnified pair shows: after the match the owner's, else the hovered/focused/viewed one (a rejected card stays), else the first open. */
    _zoomIndex() {
        if (this.identified) return this.correctIndex;
        const has = i => Number.isInteger(i) && this.candidates[i];
        if (has(this.zoomIdx)) return this.zoomIdx;
        if (has(this.viewing)) return this.viewing;
        return this.candidates.findIndex(c => !c.rejected);
    }

    /**
     * The pair's size, the same for every card: the side is fixed for the step (zoomSide), so hovering never resizes a pane.
     * Short landscape keeps the pair in the panel at 2x or more. Elsewhere zoomPlan picks side by side or stacked (lift above
     * the card) from the real width of the stage column and the height left in the window.
     */
    _zoomLayout(inPanel) {
        const side = this.zoomSide || 48;
        if (inPanel) {
            const avail = Math.floor(((this.panel.clientWidth || 340) - 12) / 2) - 4;
            const S = zoomScale(side, avail, ZOOM_MAX_H_SHORT);
            return { side, S, W: side * S, stacked: false, limited: false };
        }
        // the body's inner width (its own scrollbar is excluded) plus the root's horizontal padding, as the old root.clientWidth was
        const body = this.root.querySelector('.dusting-body');
        const rootW = (body && body.clientWidth ? body.clientWidth + (this.root.clientWidth - body.offsetWidth) : this.root.clientWidth) || (this.wide ? 960 : 360);
        const budgetH = zoomBudgetH(window.innerHeight || 720, this._zoomChrome());
        let p;
        if (this.wide) {
            // beside the panel: it keeps one row of cards plus the button row, and a 3x pair never squeezes it under 420 px
            p = zoomPlanBeside({ side, rootW, cards: this.candidates.length, budgetH });
        } else {
            p = zoomPlan({ side, availW: rootW - 16 - 4, budgetH, maxS: 2 });   // the 8 px padding either side of the content
        }
        if (p.limited) {
            // last resort: a smaller crop, its centre moved onto the marks (or the crop widened) so every mark still shows
            const fit = fitCropToMarks(this._zoomSets, p.side);
            return { ...p, side: fit.side, W: 2 * fit.side, ox: fit.ox, oy: fit.oy };
        }
        return p;
    }

    /**
     * Height of the frame outside the main row, measured (frame scroll height less the main row), with room kept for a
     * status line of up to three lines so a long mark list never grows the budget. Falls back to ZOOM_CHROME_H.
     */
    _zoomChrome() {
        const main = this.root.querySelector && this.root.querySelector('.dusting-main');
        // The frame is capped and the body scrolls inside it, so the content height is the frame's own chrome plus the body's scroll height.
        const body = this.root.querySelector('.dusting-body');
        const total = body && body.clientHeight ? this.root.clientHeight - body.clientHeight + body.scrollHeight : this.root.scrollHeight, mh = main ? main.offsetHeight : 0;
        if (!total || !mh) return ZOOM_CHROME_H;
        const sh = this.statusEl ? (this.statusEl.offsetHeight || 0) : 0;
        const chrome = total - mh + Math.max(0, ZOOM_STATUS_MAX_H - sh);
        return Math.max(120, Math.min(320, chrome));
    }

    /**
     * The lift and one card cropped round their reference point and drawn at the same whole-number scale (no
     * smoothing). The lift is turned upright (a nearest-neighbour copy rotated back about its reference point), so a mark
     * sits where its partner sits on the card. The lift's marks are numbered 1..n. The card's marks are shape only while
     * choosing; once the card is rejected (or after the match) they take the paired number, or X. Glyphs are 1x pixels
     * scaled up, tags are HTML text. Nothing here counts pairs or gives a verdict aloud.
     */
    _drawZoom() {
        const host = this.root.querySelector('[data-zoom]');
        if (!host) return;
        const cand = this.candidates[this._zoomIndex()];
        host.hidden = !cand;
        if (!cand) return;
        const reveal = cand.rejected === true || this.identified === true;
        const lm = this.liftMarks || [], cm = cand.marks || [];
        const inPanel = this.root.classList.contains('dusting-short');
        const { side, S, W, stacked, ox = 0, oy = 0 } = this._zoomLayout(inPanel);
        host.dataset.stack = stacked ? '1' : '';
        host.classList.toggle('dusting-zoom-stack', stacked);
        // upright positions (centre + the core-relative offsets), the same frame for both panes
        const liftPts = uprightMarks(lm, this.print.centre), cardPts = uprightMarks(cm, cand.print.centre);
        const tags = pairMarkTags(lm, cm);
        const ref = document.createElement('canvas');
        ref.width = N; ref.height = N;
        this._paintReference(ref.getContext('2d'), cand, true);
        const dark = this.cardDark;
        const liftBg = dark ? '#0a0f0c' : '#f2f0ea';
        const pane = (key, src, print, pts, labels, col, bg, cross) => {
            const box = host.querySelector(`[data-zbox="${key}"]`);
            box.textContent = '';
            const crop = cropAround({ x: print.centre.x + ox, y: print.centre.y + oy }, side);
            const cv = document.createElement('canvas');
            cv.className = 'dusting-zoom-canvas'; cv.width = cv.height = W;
            cv.style.width = cv.style.height = `${W}px`;
            cv.setAttribute('aria-hidden', 'true');
            const c = cv.getContext('2d');
            c.imageSmoothingEnabled = false;
            c.fillStyle = bg; c.fillRect(0, 0, W, W);
            // the crop may reach past the canvas edge: draw only the part of the source that exists
            const sx = Math.max(0, crop.x), sy = Math.max(0, crop.y), ex = Math.min(N, crop.x + side), ey = Math.min(N, crop.y + side);
            if (ex > sx && ey > sy) c.drawImage(src, sx, sy, ex - sx, ey - sy, (sx - crop.x) * S, (sy - crop.y) * S, (ex - sx) * S, (ey - sy) * S);
            // a light dashed crosshair through the reference point (2 px lines, whole pixels), so "same place" reads
            c.fillStyle = cross;
            const q = { x: Math.round((print.centre.x - crop.x) * S), y: Math.round((print.centre.y - crop.y) * S) };
            for (let t = 0; t < W; t += 8) { c.fillRect(t, q.y - 1, 4, 2); c.fillRect(q.x - 1, t, 2, 4); }
            // glyphs: 1x pixels on a side x side layer, scaled by the whole number S
            const ov = document.createElement('canvas');
            ov.width = ov.height = side;
            const oc = ov.getContext('2d');
            oc.fillStyle = col;
            for (const m of pts) {
                const gx = Math.round(m.x - crop.x), gy = Math.round(m.y - crop.y);
                for (const [ox, oy] of markGlyph(m.type)) oc.fillRect(gx + ox, gy + oy, 1, 1);
            }
            c.drawImage(ov, 0, 0, side, side, 0, 0, W, W);
            box.appendChild(cv);
            if (!labels) return;
            const placed = [];
            pts.forEach((m, i) => {
                const gx = (Math.round(m.x - crop.x)) * S, gy = (Math.round(m.y - crop.y)) * S;
                if (gx < 0 || gy < 0 || gx >= W || gy >= W) return;
                let left = Math.max(0, Math.min(W - 24, gx + 4 * S)), top = Math.max(0, gy - 3 * S - 20);
                for (let k = 0; k < 8 && placed.some(r => Math.abs(r.left - left) < 24 && Math.abs(r.top - top) < 22); k++) top = (top + 22) % Math.max(22, W - 22);
                placed.push({ left, top });
                const t = document.createElement('span');
                t.className = 'dusting-zoom-tag'; t.textContent = labels[i];
                if (labels[i] === 'X') t.dataset.none = '1';
                t.style.left = `${left}px`; t.style.top = `${top}px`;
                box.appendChild(t);
            });
        };
        pane('lift', this._uprightLift(liftBg), this.print, liftPts, tags.lift, dark ? '#ffd23f' : '#b00020', liftBg, dark ? '#00ff41' : '#0a8f3c');
        pane('card', ref, cand.print, cardPts, reveal ? tags.card : null, '#b00020', '#f2f0ea', '#0a8f3c');

        this._zoomTags = { lift: tags.lift, card: reveal ? tags.card : [] };
        this._zoomInfo = { side, S, W, stacked, ox, oy, canvases: { lift: W, card: W } };
        const cap = `Card ${cand.index + 1}: ${cand.label}`;
        const capEl = host.querySelector('[data-zcap]');
        capEl.textContent = cap;
        capEl.title = cap;   // the caption is clipped to its pane with an ellipsis: the full name is the title and the text content
        // the lift's marks again for a screen reader (spoken once on naming the pattern); textContent only
        const zm = host.querySelector('[data-zmarks]');
        if (zm) zm.textContent = lm.length ? `. Marks: ${describeMarks(lm, this.print.pattern, true)}` : '';
        // in words, marks only: no counts, no verdict. Only the card's words are spoken on a focus change.
        this._zoomSpeech = `${cap}: ${describeMarks(cm, cand.pattern, false)}.`;
    }

    /** The mounted lift turned upright about its reference point (cached per mounted card). With no rotation it is the lift itself. */
    _uprightLift(bgHex) {
        const rot = this.print.transform ? this.print.transform.rotation : 0;
        if (!rot) return this.cardCanvas;
        if (this._uprightFor === this.cardCanvas && this._uprightBg === bgHex && this._uprightCv) return this._uprightCv;
        const src = this.cardCanvas.getContext('2d').getImageData(0, 0, N, N);
        // outside the turned print: the lift's own background, which is what the lift canvas shows at its corner
        // (the dark panel colour round a card PNG), else the theme's lift colour
        const bg = src.data[3] === 255 ? [src.data[0], src.data[1], src.data[2]] : [1, 3, 5].map(i => parseInt(bgHex.slice(i, i + 2), 16));
        const out = rotateUpright(src.data, N, this.print.centre, rot, bg);
        const cv = document.createElement('canvas');
        cv.width = cv.height = N;
        cv.getContext('2d').putImageData(new ImageData(out, N, N), 0, 0);
        this._uprightFor = this.cardCanvas; this._uprightBg = bgHex; this._uprightCv = cv;
        return cv;
    }

    /** A reference card (ink on pale card) with its core, deltas and marks, on a 128 x 128 context. `bare` leaves them off (the zoom draws its own). */
    _paintReference(c, cand, bare = false) {
        const d = c.createImageData(N, N);
        const bgc = [242, 240, 234], ink = [27, 27, 27];
        const p = cand.print;
        for (let i = 0; i < N * N; i++) {
            const a = p.ridges[i] * p.mask[i], j = i * 4;
            d.data[j] = bgc[0] + (ink[0] - bgc[0]) * a; d.data[j + 1] = bgc[1] + (ink[1] - bgc[1]) * a; d.data[j + 2] = bgc[2] + (ink[2] - bgc[2]) * a; d.data[j + 3] = 255;
        }
        c.putImageData(d, 0, 0);
        if (bare) return;
        if (this.patternOk && !this.identified) this._drawCardSingulars(c, p);
        if (this.patternOk && !this.identified && cand.marks) this._drawMarks(c, cand.marks, '#b00020');
    }

    _drawReferences() {
        this.panel.querySelectorAll('.dusting-ref-canvas').forEach(cv => {
            const cand = this.candidates[Number(cv.dataset.ref)];
            const c = cv.getContext('2d');
            const p = cand.print;
            this._paintReference(c, cand);
            if (this.identified && cand.correct) this._drawMatchTags(c, p, this._matches().map(m => m.ref), '#b00020', false);
            const s = 1;   // the magnified pair shows the detail, so the cards stay at 1x
            cv.style.width = `${N * s}px`; cv.style.height = `${N * s}px`;
        });
    }

    // ------------------------------------------------------------------ test bridge

    getTestState() {
        const base = super.getTestState();
        const q = this.final ? this.final.quality : (this.powder ? this._currentQuality(this.step === 'lift' ? this.tape.coverage() : 1) : 0);
        return {
            ...base,
            step: this._resultSent ? 'done' : this.step,
            coverage: Math.round(this.metrics.coverage * 100) / 100,
            clarity: Math.round(this.metrics.clarity * 100) / 100,
            tapeCoverage: Math.round(this.tape.coverage() * 100) / 100,
            qualityEstimate: q,
            reticle: { x: Math.round(this.reticle.x), y: Math.round(this.reticle.y) },
            powder: this.powder,
            tool: this.tool,
            surface: this.surfaceId,
            difficulty: this.difficultyId,
            minCoverage: this.diff.minCoverage,
            canLift: this.metrics.coverage >= this.diff.minCoverage,
            found: this.found,
            hintVisible: this.hintReady,
            nearPrint: !!this.nearPrint,
            zoomIndex: this.patternOk && this.candidates.length ? this._zoomIndex() : null,
            zoomTags: this._zoomTags || { lift: [], card: [] },
            zoomInfo: this._zoomInfo || null,
            fullLift: this.fullLift,
            patternChosen: this.patternOk,
            identified: this.identified,
            viewing: this.viewing,
            highContrast: this.highContrast,
            steadyHand: this.steady,
            reducedMotion: this.reduceMotion,
            message: this.message,
            candidates: this.patternOk ? this.candidates.map(c => ({ index: c.index, label: c.label, rejected: c.rejected })) : [],
            debug: {
                pattern: this.print.pattern,
                correctCandidate: this.correctIndex >= 0 ? this.correctIndex : (this.patternOk ? this.correctIndex : null),
                liftMarks: (this.liftMarks || []).map(m => ({ type: m.type, x: Math.round(m.x), y: Math.round(m.y), dx: Math.round(m.dx), dy: Math.round(m.dy) })),
                cards: this.patternOk ? this.candidates.map(c => ({
                    label: c.label, pattern: c.pattern, opens: c.features ? c.features.opens : null,
                    marks: (c.marks || []).map(m => ({ type: m.type, x: Math.round(m.x), y: Math.round(m.y), dx: Math.round(m.dx), dy: Math.round(m.dy) }))
                })) : [],
                printCentre: { ...this.printCentre }
            }
        };
    }
}

// Keep the hint timer outside the constructor so it only runs while the find step is open.
const baseSetStep = DustingMinigame.prototype._setStep;
DustingMinigame.prototype._setStep = function (step) {
    baseSetStep.call(this, step);
    if (step === 'dust') this._saveProgress();
    if (step === 'find' && !this.nudged && !this.found) this._armNudge();
    if (step === 'find' && !this.hintReady && !this._hintTimer) {
        this._hintTimer = true;
        this._later(() => { this.hintReady = true; if (this.step === 'find') this._renderPanel(); }, this.diff.hintAfterMs);
    }
};

export { ART_SLOTS };
