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
import { generatePrint, hashString, mulberry32, patternForOwner, PATTERNS } from './fingerprint-generator.js';
import {
    SURFACES, POWDERS, TOOLS, DIFFICULTY, DustField, TapeGrid, surfaceForObject, contrastFactor,
    liftQuality, ratingFor, developedDensity, wrongPowderReason
} from './dusting-model.js';
import { ART_SLOTS, SURFACE_SLOT, preloadArt, onArtLoaded, drawSlot, slotCanvas, refreshSlotCanvases } from './dusting-art.js';
import { displayNameForOwner, bestLiftFromObject } from '../../systems/biometric-samples.js';

// Load dusting-specific CSS
if (!document.getElementById('dusting-css')) {
    const dustingCSS = document.createElement('link');
    dustingCSS.rel = 'stylesheet';
    dustingCSS.href = '/break_escape/css/dusting.css';
    dustingCSS.id = 'dusting-css';
    document.head.appendChild(dustingCSS);
}

const N = 128;
const STEPS = ['find', 'powder', 'dust', 'lift', 'compare'];
const STEP_NAMES = { find: 'Find', powder: 'Powder', dust: 'Dust', lift: 'Lift', compare: 'Compare' };
const HINT_AFTER_MS = 15000;
const KEY_TICK_MS = 70;
const STORE_HC = 'breakEscape.dusting.highContrast';
const STORE_STEADY = 'breakEscape.dusting.steadyHand';
const TAPE_RADIUS = 9;
const PUFF_RADIUS = 30;
// UI-side only: the brush lays powder a little faster, so over-brushing is reachable in a normal sitting.
const BRUSH_BOOST = 1.3;
// UI-side only: extra haze drawn over fogged furrows so over-brushing is visible (the model's scores are unchanged).
const FOG_HAZE = 1.4;

const FORENSIC = {
    examine: 'Latent prints are left by sweat and skin oils. A light held low across the surface makes the residue catch the light.',
    find: 'Latent prints are left by sweat and skin oils. A light held low across the surface makes the residue catch the light.',
    powder: 'Powder sticks to that residue. Examiners pick a powder that contrasts with the surface: dark on pale, light on dark, magnetic on textured plastic.',
    dust: 'Over-brushing fills the furrows between ridges and destroys the detail. Less is more.',
    lift: 'Lifting tape moves the powdered print onto a backing card, so it can be kept as evidence.',
    compare: 'About 60 to 65% of prints are loops, 30 to 35% whorls and around 5% arches. Examiners compare minutiae: where ridges end or split.'
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

const printCache = new Map();
function cachedPrint(opts) {
    const key = `${opts.owner}|${opts.pattern || ''}|${opts.variant ?? ''}|${opts.partial ? 1 : 0}`;
    if (!printCache.has(key)) {
        if (printCache.size > 24) printCache.clear();
        printCache.set(key, generatePrint({ size: N, ...opts }));
    }
    return printCache.get(key);
}

function readStore(key) { try { return window.localStorage.getItem(key) === '1'; } catch (e) { return false; } }
function writeStore(key, on) { try { window.localStorage.setItem(key, on ? '1' : '0'); } catch (e) { /* ignore */ } }

function hexToRgb(h) {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(h);
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0];
}

function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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

        this.step = 'examine';
        this.powder = null;
        this.tool = null;
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
            <div class="dusting-root" data-step="examine">
                <div class="dusting-title"><h2>Fingerprint kit</h2><span class="dusting-object"></span></div>
                <ol class="dusting-steps" aria-label="Steps">
                    ${STEPS.map((s, i) => `<li data-step="${s}"><span class="dusting-step-num">${i + 1}</span> ${STEP_NAMES[s]}</li>`).join('')}
                </ol>
                <div class="dusting-main">
                    <div class="dusting-stage">
                        <canvas class="dusting-canvas" width="${N}" height="${N}" tabindex="0" role="img" aria-label=""></canvas>
                    </div>
                    <div class="dusting-panel"></div>
                </div>
                <p class="dusting-forensic"></p>
                <div class="dusting-status" role="status" aria-live="polite"></div>
                <div class="dusting-options">
                    <label><input type="checkbox" class="dusting-opt-hc"> High contrast</label>
                    <label><input type="checkbox" class="dusting-opt-steady"> Steady hand (gentler powder)</label>
                    <span class="dusting-keys">Keys: arrows move, Space acts, Shift = big steps</span>
                </div>
            </div>`;
        this.root = this.gameContainer.querySelector('.dusting-root');
        this.canvas = this.root.querySelector('.dusting-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.panel = this.root.querySelector('.dusting-panel');
        this.statusEl = this.root.querySelector('.dusting-status');
        this.forensicEl = this.root.querySelector('.dusting-forensic');
        this.root.querySelector('.dusting-object').textContent = this.data.name || 'Surface';
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
        this.addEventListener(cv, 'pointerleave', () => { if (!this.pointerDown) { this.pointerInside = false; this.dirty = true; } });
        this.addEventListener(this.panel, 'click', e => {
            const el = e.target.closest('[data-action]');
            if (el && !el.disabled) this._action(el.dataset.action, el.dataset);
        });
        this.addEventListener(document, 'keydown', e => this._onKeyDown(e));
        this.addEventListener(document, 'keyup', e => this._onKeyUp(e));
        this.addEventListener(window, 'resize', () => this._layout());
        this.addEventListener(this.hcBox, 'change', () => {
            this.highContrast = this.hcBox.checked; writeStore(STORE_HC, this.highContrast);
            this.root.classList.toggle('dusting-hc', this.highContrast); this.dirty = true;
        });
        this.addEventListener(this.steadyBox, 'change', () => {
            this.steady = this.steadyBox.checked; writeStore(STORE_STEADY, this.steady);
            this.field.fogRate = this.steady ? 0.5 : 1;
            this.announce(this.steady ? 'Steady hand on: powder fogs half as fast.' : 'Steady hand off.');
        });
    }

    _layout() {
        const maxPx = Math.min(window.innerHeight * 0.52, window.innerWidth * 0.86, 512);
        this.scale = Math.max(1, Math.min(this.step === 'compare' ? 3 : 4, Math.floor(maxPx / N)));
        this.canvas.style.width = `${N * this.scale}px`;
        this.canvas.style.height = `${N * this.scale}px`;
        this.wide = window.innerWidth >= 760;
    }

    _later(fn, ms) {
        const t = setTimeout(() => { this._timers = this._timers.filter(x => x !== t); fn(); }, ms);
        this._timers.push(t);
    }

    cleanup() {
        this._timers.forEach(clearTimeout);
        this._timers = [];
        clearInterval(this._keyTimer);
        cancelAnimationFrame(this._raf);
        if (this._unsubArt) this._unsubArt();
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
        this._renderPanel();
        this._updateAria();
        this.dirty = true;
        if (['find', 'dust', 'lift'].includes(step)) this.canvas.focus({ preventScroll: true });
        this.announce({
            examine: 'Examine the surface.',
            find: 'Step 1, find the print. Sweep the light across the surface and mark the sheen.',
            powder: 'Step 2, choose a powder.',
            dust: 'Step 3, dust. Brush over the print to bring up the ridges.',
            lift: 'Step 4, lift. Press the tape down, then peel and mount.',
            compare: 'Step 5, compare. Name the pattern, then pick the matching card.'
        }[step]);
    }

    _renderPanel() {
        const p = this.panel;
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
        if (this.step === 'compare' && this.patternOk) this._drawReferences();
        this._refreshDynamic();
    }

    _htmlExamine() {
        const d = this.data;
        const best = this.objectId ? bestLiftFromObject(this.objectId) : null;
        const prior = best ? `<p class="dusting-note">Lifted before: ${Math.round(best.quality * 100)}%. Dust again for a cleaner lift?</p>` : '';
        return `
            <h3>${escapeHtml(d.name || 'Surface')}</h3>
            ${d.observations ? `<p>${escapeHtml(d.observations)}</p>` : ''}
            ${d.text ? `<p class="dusting-quote">${escapeHtml(d.text)}</p>` : ''}
            <p class="dusting-surface-line"><strong>Surface:</strong> ${escapeHtml(this.surface.description)}</p>
            ${prior}
            <div class="dusting-buttons">
                <button class="dusting-btn dusting-primary" data-action="start">Dust for prints</button>
                <button class="dusting-btn" data-action="use-normally">Use normally</button>
                <button class="dusting-btn" data-action="close">Close</button>
            </div>`;
    }

    _htmlFind() {
        return `
            <h3>Find the print</h3>
            <p>Hold the light low across the surface. Where residue catches the light you will see a streaky sheen.
            Click on it, or move the light with the arrow keys and press Space.</p>
            <p class="dusting-feedback" data-dyn="feedback"></p>
            <div class="dusting-buttons">
                <button class="dusting-btn dusting-hint" data-action="hint" ${this.hintReady ? '' : 'hidden'}>Hint</button>
                <button class="dusting-btn" data-action="close">Close</button>
            </div>`;
    }

    _htmlPowder() {
        const jars = Object.values(POWDERS).map((pw, i) => `
            <button class="dusting-jar" data-action="powder" data-powder="${pw.id}" aria-pressed="${this.powder === pw.id}" title="Press ${i + 1}">
                <span data-slot="jar-${pw.id}" data-scale="2"></span>
                <span class="dusting-jar-text"><strong>${i + 1}. ${escapeHtml(pw.label)}</strong><br>${escapeHtml(pw.kitLabel)}</span>
            </button>`).join('');
        return `
            <h3>Choose a powder</h3>
            <p><strong>Surface:</strong> ${escapeHtml(this.surface.description)}</p>
            <p>Pick the powder whose label fits. If it does not show well you can change it.</p>
            <div class="dusting-jars">${jars}</div>
            <div class="dusting-buttons"><button class="dusting-btn" data-action="close">Close</button></div>`;
    }

    _brushButtons() {
        const pw = POWDERS[this.powder];
        return pw.tools.map(t => {
            const key = t === 'fine' ? 'F' : t === 'broad' ? 'B' : 'W';
            const slot = t === 'fine' ? 'brush-fine' : t === 'broad' ? 'brush-feather' : 'wand';
            const label = t === 'fine' ? 'Fine brush' : t === 'broad' ? 'Feather brush' : 'Magnetic wand';
            return `<button class="dusting-btn dusting-tool" data-action="tool" data-tool="${t}" aria-pressed="${this.tool === t}" title="Press ${key}">
                <span data-slot="${slot}" data-scale="1"></span> ${label} (${key})</button>`;
        }).join('');
    }

    _htmlDust() {
        const pw = POWDERS[this.powder];
        return `
            <h3>Dust the print</h3>
            <p>Drag over the print with the ${this.powder === 'magnetic' ? 'wand' : 'brush'} (keys: hold Space and use the arrows, or Enter to keep brushing). Ridges appear stroke by stroke.</p>
            <div class="dusting-tools">${this._brushButtons()}</div>
            <p class="dusting-powder-line">Powder: <strong>${escapeHtml(pw.label)}</strong></p>
            <div class="dusting-meters">
                <div class="dusting-meter"><label>Coverage <b data-dyn="cov-text"></b></label><div class="dusting-bar"><i data-dyn="cov-bar"></i><u data-dyn="cov-min"></u></div></div>
                <div class="dusting-meter"><label>Clarity <b data-dyn="clar-text"></b></label><div class="dusting-bar"><i data-dyn="clar-bar"></i></div></div>
                <p class="dusting-estimate" data-dyn="estimate"></p>
            </div>
            <p class="dusting-feedback" data-dyn="feedback"></p>
            <div class="dusting-buttons">
                <button class="dusting-btn dusting-primary" data-action="to-lift" data-dyn="lift-btn">Lift (L)</button>
                <button class="dusting-btn" data-action="puff" aria-pressed="${this.puffMode}" title="Press T">Puff off excess (T)</button>
                <button class="dusting-btn" data-action="change-powder" title="Press C">Change powder (C)</button>
                <button class="dusting-btn" data-action="close">Close</button>
            </div>`;
    }

    _htmlLift() {
        return `
            <h3>Lift with tape</h3>
            <p>The tape is laid over the print with air bubbles under it. Rub over it (drag, or hold Space and use the arrows) to press the bubbles out. Bubbles left in leave holes in the lift.</p>
            <div class="dusting-meters">
                <div class="dusting-meter"><label>Tape pressed <b data-dyn="tape-text"></b></label><div class="dusting-bar"><i data-dyn="tape-bar"></i></div></div>
                <p class="dusting-estimate" data-dyn="estimate"></p>
            </div>
            <p class="dusting-feedback" data-dyn="feedback"></p>
            <div class="dusting-buttons">
                <button class="dusting-btn dusting-primary" data-action="peel" title="Press P"><span data-slot="tape-roll" data-scale="1"></span> Peel and mount (P)</button>
                <button class="dusting-btn" data-action="back-dust">Back to dusting</button>
                <button class="dusting-btn" data-action="close">Close</button>
            </div>`;
    }

    _htmlCompare() {
        const q = this.final ? Math.round(this.final.quality * 100) : 0;
        const head = `<h3>Compare and identify</h3>
            <p class="dusting-result">Lift mounted: <strong>${q}% (${escapeHtml(this.final ? this.final.rating : '')})</strong>.</p>`;
        if (!this.patternOk) {
            const btns = PATTERNS.map(pt => `
                <button class="dusting-pattern" data-action="pattern" data-pattern="${pt}">
                    <span class="dusting-pattern-art">${PATTERN_SVG[pt]}</span>
                    <span><strong>${PATTERN_INFO[pt].label}</strong><br>${PATTERN_INFO[pt].desc}</span>
                </button>`).join('');
            return `${head}<p>What pattern is your lift? Look for the core (middle) and the triangles where ridges meet.</p>
                <div class="dusting-patterns">${btns}</div>
                <p class="dusting-feedback" data-dyn="feedback"></p>
                <div class="dusting-buttons">
                    <button class="dusting-btn" data-action="unidentified">Log as unidentified</button>
                </div>`;
        }
        if (this.identified) {
            return `${head}<p class="dusting-feedback good">Match: ridge detail agrees at the ${this.print.pattern === 'arch' ? 'ridge flow' : this.print.deltas.length > 1 ? 'core and both deltas' : 'core and the delta'}. The numbered tags mark the same ridge detail on both cards.</p>
                <p>This is ${escapeHtml(this.ownerName)}'s print.</p>
                <div class="dusting-refs">${this._refButtons(true)}</div>
                <div class="dusting-buttons"><button class="dusting-btn dusting-primary" data-action="finish">Log the print</button></div>`;
        }
        return `${head}<p>That is ${/^[aeiou]/i.test(this.print.pattern) ? 'an' : 'a'} ${PATTERN_INFO[this.print.pattern].label.toLowerCase()}, marked on the card. Now pick the reference card that matches your lift.</p>
            <div class="dusting-refs">${this._refButtons(false)}</div>
            <p class="dusting-feedback" data-dyn="feedback"></p>
            <div class="dusting-buttons"><button class="dusting-btn" data-action="unidentified">Log as unidentified</button></div>`;
    }

    _refButtons(done) {
        return this.candidates.map(c => `
            <button class="dusting-ref" data-action="ref" data-index="${c.index}" ${c.rejected || done ? 'disabled' : ''} ${c.rejected ? 'data-rejected="1"' : ''} aria-label="Reference card ${c.index + 1}: ${escapeHtml(c.label)}${c.rejected ? ', not a match' : ''}">
                <canvas class="dusting-ref-canvas" data-ref="${c.index}" width="${N}" height="${N}"></canvas>
                <span>${c.index + 1}. ${escapeHtml(c.label)}${c.rejected ? ' (not a match)' : ''}${done && c.correct ? ' (match)' : ''}</span>
            </button>`).join('');
    }

    // ------------------------------------------------------------------ actions

    _action(action, ds = {}) {
        switch (action) {
            case 'start': this._setStep('find'); break;
            case 'use-normally': this.gameResult = { cancelled: true, useNormally: true }; this._resultSent = true; super.complete(false); break;
            case 'close': this.complete(false); break;
            case 'hint': this.hintOn = true; this.dirty = true; this.announce('The ring marks where the print is.'); break;
            case 'powder': this._choosePowder(ds.powder); break;
            case 'tool': this._chooseTool(ds.tool); break;
            case 'to-lift': this._toLift(); break;
            case 'puff': this.puffMode = !this.puffMode; this._renderPanel(); this.announce(this.puffMode ? 'Puff on: sweep over blotchy areas to clear the excess.' : 'Puff off.'); break;
            case 'change-powder': this._changePowder(); break;
            case 'back-dust': this._setStep('dust'); break;
            case 'peel': this._peel(); break;
            case 'pattern': this._choosePattern(ds.pattern); break;
            case 'ref': this._chooseRef(Number(ds.index)); break;
            case 'unidentified': this.identified = false; this._finish(); break;
            case 'finish': this._finish(); break;
            default: break;
        }
    }

    _choosePowder(id) {
        if (!POWDERS[id]) return;
        if (this.powder !== id) { this.field.clear(); this.lastBand = 0; }
        this.powder = id;
        this.tool = POWDERS[id].tools[0];
        this.puffMode = false;
        this._setStep('dust');
        this._refreshMetrics(true);
        const why = wrongPowderReason(this.powder, this.surfaceId);
        if (why) this.announce(`${why} You can change powder.`);
    }

    _chooseTool(t) {
        if (!TOOLS[t] || !POWDERS[this.powder].tools.includes(t)) return;
        this.tool = t; this.puffMode = false;
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
            this._buildCandidates();
            this._renderPanel();
            this._drawCard();
            this.announce(`Correct: ${/^[aeiou]/.test(actual) ? 'an' : 'a'} ${PATTERN_INFO[actual].label.toLowerCase()}. Core and delta marked. Now pick the matching reference card.`);
            return;
        }
        this.message = `Not ${/^[aeiou]/.test(pt) ? 'an' : 'a'} ${PATTERN_INFO[pt].label.toLowerCase()}. ${PATTERN_INFO[pt].why} Look at the core and the triangles on your lift, then try again.`;
        this._refreshDynamic();
        this.announce(this.message);
    }

    _chooseRef(i) {
        const c = this.candidates[i];
        if (!c || c.rejected) return;
        if (c.correct) {
            this.identified = true;
            this._renderPanel();
            this._drawCard();
            this.forensicEl.textContent = `${FORENSIC.compare} ${FORENSIC_MATCH}`;
            this.announce(`Match. This is ${this.ownerName}'s print. The numbered tags mark the same ridge detail on both cards.`);
        } else {
            c.rejected = true;
            const lp = this.print.pattern;
            const an = w => (/^[aeiou]/.test(w) ? 'an ' : 'a ') + w;
            this.message = c.pattern !== lp
                ? `No match: that card is ${an(PATTERN_INFO[c.pattern].label.toLowerCase())} and your lift is ${an(PATTERN_INFO[lp].label.toLowerCase())}.`
                : 'No match: the ridge endings and forks near the core sit in different places. Compare them card by card.';
            this._renderPanel();
            this.announce(this.message);
        }
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
        this.gameResult = this._buildResult();
        this._resultSent = true;
        super.complete(true);
    }

    /** Closing after the peel keeps the lift (as unidentified); closing earlier is a plain cancel. */
    complete(success) {
        if (this._resultSent) return super.complete(success);
        if (!success && this.mounted && this.final) {
            this.gameResult = this._buildResult();
            this._resultSent = true;
            return super.complete(true);
        }
        if (!success && !this.gameResult) this.gameResult = { cancelled: true };
        this._resultSent = true;
        return super.complete(success);
    }

    // ------------------------------------------------------------------ compare data

    _buildCandidates() {
        const lp = this.print.pattern;
        const n = this.diff.candidates;
        const names = [];
        const cand = Array.isArray(this.data.fingerprintCandidates) ? this.data.fingerprintCandidates : null;
        const ownerLc = String(this.ownerName).toLowerCase(), ownerRaw = String(this.owner).toLowerCase();
        if (cand && cand.length) names.push(...cand);
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
        }
        const decoyNames = [];
        for (let k = 0; k < n - 1; k++) decoyNames.push(pool[k] || fallback[k]);

        const others = PATTERNS.filter(p => p !== lp);
        const decoys = decoyNames.map((nm, k) => {
            let pattern;
            if (this.diff.decoySamePattern === 'all') pattern = lp;
            else if (this.diff.decoySamePattern === 'one') pattern = k === 0 ? lp : others[(seed + k) % others.length];
            else pattern = others[(seed + k) % others.length];
            return { label: nm, pattern, print: cachedPrint({ owner: nm, pattern }), correct: false };
        });
        const correct = { label: this.ownerName, pattern: lp, print: cachedPrint({ owner: this.owner, pattern: lp }), correct: true };
        const at = seed % n;
        const list = [...decoys];
        list.splice(at, 0, correct);
        this.candidates = list.map((c, i) => ({ ...c, index: i, rejected: false }));
        this.correctIndex = at;
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
        const pos = this._canvasPos(e);
        this.reticle = pos; this.pointerInside = true; this.pointerDown = true;
        try { this.canvas.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointers can't be captured */ }
        this.canvas.focus({ preventScroll: true });
        this._act(pos, null);
        this.lastPt = pos;
        this.dirty = true;
    }

    _onPointerMove(e) {
        const pos = this._canvasPos(e);
        this.pointerInside = true;
        const prev = this.reticle;
        this.reticle = pos;
        if (this.pointerDown) this._act(pos, this.lastPt || prev);
        this.lastPt = this.pointerDown ? pos : null;
        this.dirty = true;
    }

    _onPointerUp() {
        this.pointerDown = false;
        this.lastPt = null;
    }

    /** One brush/press/mark at pos; with `from`, a continuous stroke from there. */
    _act(pos, from) {
        if (this.step === 'find') { if (!from) this._attemptFind(pos); return; }
        if (this.step === 'dust') {
            if (this.puffMode) { this.field.puff(pos.x, pos.y, PUFF_RADIUS); this.field.puff(pos.x, pos.y, PUFF_RADIUS); }
            else {
                const base = TOOLS[this.tool];
                const tool = { ...base, strength: base.strength * BRUSH_BOOST };
                if (from) this.field.brushLine(from.x, from.y, pos.x, pos.y, tool); else this.field.brush(pos.x, pos.y, tool);
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
            return;
        }
        if ((k === ' ' || k === 'Enter') && !nativeControl && canvasStep) {
            e.preventDefault();
            if (this.step === 'find') { if (!e.repeat) this._attemptFind(this.reticle); return; }
            if (this.step === 'dust' && k === 'Enter') {
                if (!e.repeat) { this.stickyBrush = !this.stickyBrush; this.announce(this.stickyBrush ? 'Brushing on. Arrow keys now brush. Press Enter to stop.' : 'Brushing off.'); }
                return;
            }
            if (this.step === 'dust' || this.step === 'lift') {
                if (!this.spaceHeld) {
                    this.spaceHeld = true;
                    this._act(this.reticle, null);
                    clearInterval(this._keyTimer);
                    this._keyTimer = setInterval(() => this._act(this.reticle, null), KEY_TICK_MS);
                }
            }
            return;
        }
        if (tag === 'INPUT' && t.type === 'text') return;
        const lower = k.length === 1 ? k.toLowerCase() : k;
        if (this.step === 'powder' && ['1', '2', '3'].includes(lower)) { this._choosePowder(Object.keys(POWDERS)[Number(lower) - 1]); return; }
        if (this.step === 'compare' && this.patternOk && !this.identified && ['1', '2', '3'].includes(lower)) {
            e.preventDefault();
            this._chooseRef(Number(lower) - 1);
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
            this.message = 'Nothing there. Keep the light low and look for a streaky sheen.';
            this._refreshDynamic();
            this.announce(this.message);
            return;
        }
        this.found = true;
        this.foundAt = performance.now();
        this.message = 'Found it: a latent print.';
        this._refreshDynamic();
        this.announce('Found the print.');
        this.dirty = true;
        this._later(() => this._setStep('powder'), this.reduceMotion ? 0 : 450);
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

    _refreshDynamic() {
        const m = this.metrics;
        const pct = v => `${Math.round(v * 100)}%`;
        const word = v => (v >= 0.85 ? 'good' : v >= 0.6 ? 'fair' : v >= 0.3 ? 'faint' : 'low');
        if (this.step === 'find' || this.step === 'compare') {
            this._setDyn('feedback', el => { el.textContent = this.message; });
            return;
        }
        if (this.step === 'dust') {
            this._setDyn('cov-text', el => { el.textContent = `${pct(m.coverage)} (${word(m.coverage)})`; });
            this._setDyn('cov-bar', el => { el.style.width = pct(Math.min(1, m.coverage)); });
            this._setDyn('cov-min', el => { el.style.left = pct(this.diff.minCoverage); el.title = `Lift unlocks at ${pct(this.diff.minCoverage)}`; });
            this._setDyn('clar-text', el => { el.textContent = `${pct(m.clarity)} (${word(m.clarity)})`; });
            this._setDyn('clar-bar', el => { el.style.width = pct(Math.min(1, m.clarity)); });
            const q = this._currentQuality(1);
            this._setDyn('estimate', el => { el.textContent = m.coverage > 0.02 ? `Lift would score about ${Math.round(q * 100)}% (${ratingFor(q)}).` : 'Brush over the print to begin.'; });
            const canLift = m.coverage >= this.diff.minCoverage;
            this._setDyn('lift-btn', el => {
                el.disabled = !canLift;
                el.textContent = canLift ? 'Lift (L)' : `Lift (needs ${pct(this.diff.minCoverage)} coverage)`;
            });
            this._setDyn('feedback', el => { el.textContent = this.message || this._coach(); });
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
        const why = wrongPowderReason(this.powder, this.surfaceId);
        if (why && m.coverage > 0.03) return `${why} Change powder to see the difference.`;
        if (m.foggy > 0.08) return 'Powder is filling the furrows between ridges in places and the lines are blurring. Use Puff to clear it, or lift now.';
        if (m.coverage < 0.03) return 'Brush over the print. Ridges appear where the powder clings.';
        if (m.coverage < this.diff.minCoverage) return 'Ridges are coming up. Keep sweeping across the print.';
        if (m.clarity < 0.75) return 'Good start. Cover the rest of the print with light strokes, then lift.';
        return 'The ridges are clear. Lift when you are happy, or fill any gaps first.';
    }

    announce(msg) {
        if (!msg || !this.statusEl) return;
        this.statusEl.textContent = '';
        // a changed text node is what a screen reader notices
        this.statusEl.textContent = msg;
    }

    _updateAria() {
        if (!this.canvas) return;
        const pct = Math.round(this.metrics.coverage * 100);
        const label = {
            examine: `Close-up of ${this.surface.name}.`,
            find: `Close-up of ${this.surface.name} lit from a low angle. ${this.found ? 'Print found.' : 'The print has not been found yet.'}`,
            powder: `Close-up of ${this.surface.name}.`,
            dust: `Print about ${pct}% developed.${this.metrics.coverage < 0.5 ? ' Large parts are still faint.' : ''}`,
            lift: `Tape over the print, ${Math.round(this.tape.coverage() * 100)}% pressed down.`,
            compare: `Lifted print on a backing card, ${PATTERN_INFO[this.print.pattern].label.toLowerCase()} pattern.`
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
        const glint = this.surfaceLight ? [110, 135, 165] : [255, 255, 255];
        const easy = this.diff.findHintVisible;
        for (let y = 0; y < N; y++) {
            for (let x = 0; x < N; x++) {
                const i = y * N + x, j = i * 4;
                const q = ((x - rx) ** 2 + (y - ry) ** 2) / (R * R);
                const lit = q < 1 && this.pointerInside ? 1 - q : 0;
                let r = sp[j], g = sp[j + 1], b = sp[j + 2];
                const dim = 0.5 + 0.5 * Math.min(1, lit * 2.2);
                r *= dim; g *= dim; b *= dim;
                let s = lit > 0 ? p.ridges[i] * p.mask[i] * res * lit * 0.8 : 0;
                if (easy && ((x + y) & 1) === 0) s = Math.max(s, p.mask[i] * 0.16);
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
    }

    _outlineMask(d, ink) {
        const m = this.print.mask;
        for (let y = 1; y < N - 1; y++) {
            for (let x = 1; x < N - 1; x++) {
                const i = y * N + x;
                const inside = m[i] > 0.5;
                if (inside && (m[i - 1] <= 0.5 || m[i + 1] <= 0.5 || m[i - N] <= 0.5 || m[i + N] <= 0.5) && ((x + y) & 3) < 2) {
                    const j = i * 4;
                    d[j] = 128; d[j + 1] = 128; d[j + 2] = 128;
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
        const rad = this.step === 'lift' ? TAPE_RADIUS : this.puffMode ? PUFF_RADIUS : TOOLS[this.tool] ? TOOLS[this.tool].radius : 5;
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
        drawSlot(c, 'backing-card');
        const pw = POWDERS[this.powder];
        if (pw.backing !== '#f2f0ea') {
            c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = pw.backing; c.fillRect(0, 0, N, N); c.restore();
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
        c.drawImage(this.cardCanvas, 0, 0);
        const dark = this.cardDark;
        const mark = dark ? '#00ff41' : '#0a6b2d';
        if (this.patternOk) {
            c.save(); c.strokeStyle = mark; c.fillStyle = mark; c.lineWidth = 1.5;
            for (const k of this.print.cores) { c.beginPath(); c.arc(k.x, k.y, 4, 0, Math.PI * 2); c.stroke(); }
            for (const t of this.print.deltas) {
                if (t.x < 0 || t.y < 0 || t.x >= N || t.y >= N) continue;
                c.beginPath(); c.moveTo(t.x, t.y - 4); c.lineTo(t.x + 4, t.y + 3); c.lineTo(t.x - 4, t.y + 3); c.closePath(); c.stroke();
            }
            c.restore();
        }
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

    _drawReferences() {
        this.panel.querySelectorAll('.dusting-ref-canvas').forEach(cv => {
            const cand = this.candidates[Number(cv.dataset.ref)];
            const c = cv.getContext('2d');
            const d = c.createImageData(N, N);
            const bgc = [242, 240, 234], ink = [27, 27, 27];
            const p = cand.print;
            for (let i = 0; i < N * N; i++) {
                const a = p.ridges[i] * p.mask[i], j = i * 4;
                d.data[j] = bgc[0] + (ink[0] - bgc[0]) * a; d.data[j + 1] = bgc[1] + (ink[1] - bgc[1]) * a; d.data[j + 2] = bgc[2] + (ink[2] - bgc[2]) * a; d.data[j + 3] = 255;
            }
            c.putImageData(d, 0, 0);
            if (this.identified && cand.correct) this._drawMatchTags(c, p, this._matches().map(m => m.ref), '#b00020', false);
            const s = this.wide && this.candidates.length <= 2 ? 2 : 1;
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
            patternChosen: this.patternOk,
            identified: this.identified,
            highContrast: this.highContrast,
            steadyHand: this.steady,
            reducedMotion: this.reduceMotion,
            message: this.message,
            candidates: this.patternOk ? this.candidates.map(c => ({ index: c.index, label: c.label, rejected: c.rejected })) : [],
            debug: {
                pattern: this.print.pattern,
                correctCandidate: this.correctIndex >= 0 ? this.correctIndex : (this.patternOk ? this.correctIndex : null),
                printCentre: { ...this.printCentre }
            }
        };
    }
}

// Keep the hint timer outside the constructor so it only runs while the find step is open.
const baseSetStep = DustingMinigame.prototype._setStep;
DustingMinigame.prototype._setStep = function (step) {
    baseSetStep.call(this, step);
    if (step === 'find' && !this.hintReady && !this._hintTimer) {
        this._hintTimer = true;
        this._later(() => { this.hintReady = true; if (this.step === 'find') this._renderPanel(); }, HINT_AFTER_MS);
    }
};

export { ART_SLOTS };
