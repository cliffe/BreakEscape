/**
 * Dusting model for the fingerprint minigame (pure; no DOM).
 *
 * The work surface is a logical grid (128 x 128 by default). A DustField holds the
 * powder passes each pixel has received. Powder clings to ridges far more than to the
 * bare surface, so ridges appear as the player brushes; over-brushing fills the
 * furrows ("fog") and blurs the detail. Nothing here can fail the attempt: the worst
 * outcome is a lower-quality lift.
 *
 * @module dusting-model
 */

/** Maximum brush ticks per second the UI should feed the field. */
export const MAX_TICKS_PER_SECOND = 30;

/** Fog saturates at this density (gentle: it never fully hides the ridges). */
const FOG_MAX = 0.35;
/** Fog ramp divisor: fog = (FP - Pfog) / FOG_RAMP. */
const FOG_RAMP = 16;
/** Puff leaves passes above this value halved towards it. */
const PUFF_FLOOR = 2.5;

/**
 * Surface classes. `smooth` surfaces take granular powders; `textured` ones need the magnetic wand.
 * @type {Object<string, {id:string, label:string, name:string, description:string, colours:string[], bestPowder:string, smooth:boolean}>}
 */
export const SURFACES = {
    glossy_light: {
        id: 'glossy_light',
        label: 'Pale, glossy',
        name: 'a pale glossy surface',
        description: 'Glazed white ceramic: pale, smooth, non-porous.',
        colours: ['#e8e6df', '#d9d6cc'],
        bestPowder: 'black',
        smooth: true
    },
    glossy_dark: {
        id: 'glossy_dark',
        label: 'Dark, glossy',
        name: 'a dark glossy surface',
        description: 'Black glass and gloss plastic: dark, smooth, shiny.',
        colours: ['#1c2128', '#2a313a'],
        bestPowder: 'silver',
        smooth: true
    },
    textured: {
        id: 'textured',
        label: 'Textured plastic',
        name: 'textured plastic',
        description: 'Grained plastic: dull, finely textured, hard to brush.',
        colours: ['#4a4d52', '#3d4046'],
        bestPowder: 'magnetic',
        smooth: false
    }
};

/**
 * Brushes and wand. `radius` is in logical pixels, `strength` is added per tick at the centre,
 * `fogRate` scales how fast furrows fill (fine 1x, broad 1.2x, wand 0.5x).
 * @type {Object<string, {id:string, label:string, radius:number, strength:number, fogRate:number, powders:string[]}>}
 */
export const TOOLS = {
    fine: { id: 'fine', label: 'Fine brush (fibreglass)', radius: 5, strength: 0.35, fogRate: 1, powders: ['black', 'silver'] },
    broad: { id: 'broad', label: 'Broad brush (feather)', radius: 11, strength: 0.5, fogRate: 1.2, powders: ['black', 'silver'] },
    wand: { id: 'wand', label: 'Magnetic wand', radius: 8, strength: 0.4, fogRate: 0.5, powders: ['magnetic'] }
};

/**
 * Powders. `colour` is the developed powder tint, `kitLabel` the one-line label on the kit jar,
 * `tools` the tool ids that apply, `backing` the lift card colour that gives the best contrast.
 * @type {Object<string, {id:string, label:string, kitLabel:string, colour:string, tools:string[], backing:string, bestOn:string}>}
 */
export const POWDERS = {
    black: {
        id: 'black', label: 'Black granular', kitLabel: 'Pale, smooth surfaces',
        colour: '#15171a', tools: ['fine', 'broad'], backing: '#f2f0ea', bestOn: 'glossy_light'
    },
    silver: {
        id: 'silver', label: 'Silver (aluminium)', kitLabel: 'Dark or shiny surfaces',
        colour: '#c9d1d9', tools: ['fine', 'broad'], backing: '#101214', bestOn: 'glossy_dark'
    },
    magnetic: {
        id: 'magnetic', label: 'Magnetic black', kitLabel: 'Textured plastics. Gentle: no bristles touch the print.',
        colour: '#1d1f23', tools: ['wand'], backing: '#f2f0ea', bestOn: 'textured'
    }
};

/**
 * Difficulty table, keyed by `fingerprintDifficulty` (default 'medium').
 * - `pfog`: passes a pixel tolerates before furrows fill.
 * - `minCoverage`: coverage (0..1) needed before Lift unlocks.
 * - `residueStrength`: ridge density multiplier for the latent print (0..1; hard is 0.9).
 * - `candidates`: reference cards shown in the compare step (including the correct one).
 * - `decoySamePattern`: 'never' (decoys use a different pattern), 'one' (exactly one decoy shares it), 'all'.
 * - `findHintVisible`: a faint smudge shows in the find step without the torch.
 * - `partial`: 'never' | 'maybe' (about half the surfaces) | 'always' the print is cut by a straight edge.
 * - `sheenScale`: multiplier for the torch sheen's visibility radius.
 * @type {Object<string, {pfog:number, minCoverage:number, residueStrength:number, candidates:number,
 *   decoySamePattern:'never'|'one'|'all', findHintVisible:boolean, partial:'never'|'maybe'|'always', sheenScale:number}>}
 */
export const DIFFICULTY = {
    easy: { pfog: 7, minCoverage: 0.40, residueStrength: 1.0, candidates: 2, decoySamePattern: 'one', findHintVisible: true, partial: 'never', sheenScale: 1.0 },
    medium: { pfog: 6, minCoverage: 0.45, residueStrength: 1.0, candidates: 3, decoySamePattern: 'one', findHintVisible: false, partial: 'maybe', sheenScale: 1.0 },
    hard: { pfog: 5, minCoverage: 0.55, residueStrength: 0.9, candidates: 3, decoySamePattern: 'all', findHintVisible: false, partial: 'always', sheenScale: 0.7 }
};

const DARK_TYPES = /(^|[-_])(pc|computer|laptop|monitor|screen|terminal|phone|smartphone|tablet|display|workstation)([-_]|$)/i;
const LIGHT_TYPES = /(cup|mug|glass|bottle|ceramic|plate|bowl|pot)/i;
const TEXTURED_TYPES = /(keyboard|keypad|keycard|grip|remote|mouse|handle)/i;

/**
 * Surface id for an object. Honours an explicit `fingerprintSurface`, otherwise guesses from
 * the object `type`: pc, screens, terminals and phones are glossy_dark; cups and mugs glossy_light;
 * keyboards and keypads textured; anything else glossy_light.
 * @param {Object} scenarioData The object's scenario data (or a sprite carrying `scenarioData`).
 * @returns {'glossy_light'|'glossy_dark'|'textured'}
 */
export function surfaceForObject(scenarioData) {
    const d = (scenarioData && scenarioData.scenarioData) || scenarioData || {};
    if (d.fingerprintSurface && SURFACES[d.fingerprintSurface]) return d.fingerprintSurface;
    const type = String(d.type || '');
    if (TEXTURED_TYPES.test(type)) return 'textured';
    if (DARK_TYPES.test(type)) return 'glossy_dark';
    if (LIGHT_TYPES.test(type)) return 'glossy_light';
    return 'glossy_light';
}

/**
 * Holds the powder passes for each pixel of the work surface.
 * `P` is the powder passes (drives reveal); `FP` is the fog passes (drives fog). With a tool
 * fogRate of 1 and a field fogRate of 1 they are equal.
 */
export class DustField {
    /**
     * @param {number} size Grid edge in logical pixels (square).
     * @param {Object} [opts]
     * @param {number} [opts.pfog=6] Fog passes tolerated before furrows haze (from DIFFICULTY: 7/6/5).
     * @param {number} [opts.fogRate=1] Global fog multiplier (0.5 for the steady-hand assist).
     */
    constructor(size, { pfog = 6, fogRate = 1 } = {}) {
        this.size = size;
        this.pfog = pfog;
        this.fogRate = fogRate;
        this.P = new Float32Array(size * size);
        this.FP = new Float32Array(size * size);
    }

    /**
     * One brush tick: adds `strength * (1 - (d/r)^2)` powder to every pixel within radius r.
     * @param {number} cx Centre x (logical px).
     * @param {number} cy Centre y.
     * @param {{radius:number, strength:number, fogRate?:number}} tool An entry of TOOLS.
     * @returns {boolean} true if any pixel changed.
     */
    brush(cx, cy, tool) {
        const N = this.size, r = tool.radius, s = tool.strength;
        const fr = (tool.fogRate === undefined ? 1 : tool.fogRate) * this.fogRate;
        const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(N - 1, Math.ceil(cx + r));
        const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(N - 1, Math.ceil(cy + r));
        let any = false;
        for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
                const dx = x - cx, dy = y - cy;
                const q = (dx * dx + dy * dy) / (r * r);
                if (q >= 1) continue;
                const add = s * (1 - q);
                const i = y * N + x;
                this.P[i] += add;
                this.FP[i] += add * fr;
                any = true;
            }
        }
        return any;
    }

    /**
     * Brush along a segment with ticks every ~radius/3 px so a fast stroke leaves no gaps.
     * Ticks fall on (start, end] so chained segments of one stroke do not double-count the join;
     * a zero-length segment gives a single tick. Callers cap tick rate with MAX_TICKS_PER_SECOND.
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     * @param {{radius:number, strength:number, fogRate?:number}} tool
     */
    brushLine(x0, y0, x1, y1, tool) {
        const dist = Math.hypot(x1 - x0, y1 - y0);
        if (dist < 1e-6) { this.brush(x1, y1, tool); return; }
        const step = Math.max(1, tool.radius / 3);
        const n = Math.max(1, Math.ceil(dist / step));
        for (let k = 1; k <= n; k++) {
            const t = k / n;
            this.brush(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, tool);
        }
    }

    /**
     * Set every pixel to the same number of passes (for tests, and for wiping to a given state).
     * @param {number} passes
     */
    fill(passes) {
        this.P.fill(passes);
        this.FP.fill(passes);
    }

    /** Remove all powder (Change powder wipes the surface). */
    clear() {
        this.P.fill(0);
        this.FP.fill(0);
    }

    /**
     * Puff off excess powder: within `radius` of (cx, cy), P and FP above 2.5 are halved towards 2.5
     * (`x = 2.5 + (x - 2.5) / 2`). Undoes over-brushing without losing developed ridges (2.5 passes
     * is still reveal 0.92). Pixels at or below 2.5 are untouched.
     * @param {number} cx
     * @param {number} cy
     * @param {number} [radius=18]
     * @returns {boolean} true if any pixel changed
     */
    puff(cx, cy, radius = 18) {
        const N = this.size;
        const x0 = Math.max(0, Math.floor(cx - radius)), x1 = Math.min(N - 1, Math.ceil(cx + radius));
        const y0 = Math.max(0, Math.floor(cy - radius)), y1 = Math.min(N - 1, Math.ceil(cy + radius));
        let any = false;
        for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
                const dx = x - cx, dy = y - cy;
                if (dx * dx + dy * dy > radius * radius) continue;
                const i = y * N + x;
                if (this.P[i] > PUFF_FLOOR) { this.P[i] = PUFF_FLOOR + (this.P[i] - PUFF_FLOOR) / 2; any = true; }
                if (this.FP[i] > PUFF_FLOOR) { this.FP[i] = PUFF_FLOOR + (this.FP[i] - PUFF_FLOOR) / 2; any = true; }
            }
        }
        return any;
    }

    /**
     * Developed amount at pixel index i: `1 - exp(-P)`.
     * @param {number} i
     * @returns {number} 0..1
     */
    reveal(i) {
        return 1 - Math.exp(-this.P[i]);
    }

    /**
     * Fog at pixel index i: `clamp((FP - Pfog) / 16, 0, 0.35)`.
     * @param {number} i
     * @returns {number} 0..0.35
     */
    fog(i) {
        const f = (this.FP[i] - this.pfog) / FOG_RAMP;
        return f < 0 ? 0 : (f > FOG_MAX ? FOG_MAX : f);
    }

    /**
     * Coverage and clarity of the development so far.
     * Coverage = share of mask pixels (mask > 0.5) with reveal > 0.7.
     * Clarity = `min(1, raw / 0.8)`, where raw is the mean over ridge pixels inside the mask
     * (ridge > 0.5 and mask > 0.5) of clamp(reveal - fog, 0, 1); undeveloped areas count as 0, and
     * developing 80% of the ridges cleanly already counts as full clarity.
     * @param {{ridges:Float32Array, mask:Float32Array}} print
     * @returns {{coverage:number, clarity:number}} both 0..1
     */
    metrics(print) {
        const n = this.size * this.size;
        let maskN = 0, covN = 0, ridgeN = 0, clar = 0;
        for (let i = 0; i < n; i++) {
            if (print.mask[i] <= 0.5) continue;
            maskN++;
            const v = 1 - Math.exp(-this.P[i]);
            if (v > 0.7) covN++;
            if (print.ridges[i] > 0.5) {
                ridgeN++;
                const f = this.fog(i);
                const c = v - f;
                clar += c < 0 ? 0 : (c > 1 ? 1 : c);
            }
        }
        return {
            coverage: maskN ? covN / maskN : 0,
            clarity: ridgeN ? Math.min(1, clar / ridgeN / 0.8) : 0
        };
    }
}

/**
 * Drawn powder density at pixel index i (0..1 and a little over for dense fog), to be tinted with the
 * powder colour over the surface: `ridge * mask * v * 0.95 + f * 0.85 + (1 - ridge * mask) * v * 0.08`.
 * Ridges emerge first, then the gaps fill as fog rises. The latent print's residue strength (hard
 * prints are 0.9) scales the ridge term.
 * @param {DustField} field
 * @param {{ridges:Float32Array, mask:Float32Array}} print
 * @param {number} i Pixel index.
 * @param {number} [residue=1] DIFFICULTY[...].residueStrength.
 * @returns {number} density, clamped to 0..1
 */
export function developedDensity(field, print, i, residue = 1) {
    const v = field.reveal(i);
    const f = field.fog(i);
    const rm = print.ridges[i] * print.mask[i] * residue;
    const d = rm * v * 0.95 + f * 0.85 + (1 - rm) * v * 0.08;
    return d > 1 ? 1 : d;
}

/**
 * Flattening grid for the lifting tape: an n x n grid of air bubbles over the print area.
 * Rubbing flattens bubbles; bubbles left leave holes in the lift.
 */
export class TapeGrid {
    /** @param {number} [n=8] Cells per side. */
    constructor(n = 8) {
        this.n = n;
        /** 1 where flattened. Row-major. */
        this.cells = new Uint8Array(n * n);
    }

    /**
     * Press the tape at a point: every cell whose rectangle lies within `radius` of (cx, cy) is flattened.
     * @param {number} cx Logical x.
     * @param {number} cy Logical y.
     * @param {number} radius Logical px.
     * @param {{x:number, y:number, w:number, h:number}} bounds The tape area the grid is laid over.
     * @returns {number} number of newly flattened cells
     */
    press(cx, cy, radius, bounds) {
        const n = this.n;
        const cw = bounds.w / n, ch = bounds.h / n;
        let added = 0;
        for (let gy = 0; gy < n; gy++) {
            for (let gx = 0; gx < n; gx++) {
                const i = gy * n + gx;
                if (this.cells[i]) continue;
                const rx0 = bounds.x + gx * cw, ry0 = bounds.y + gy * ch;
                const nx = Math.min(Math.max(cx, rx0), rx0 + cw);
                const ny = Math.min(Math.max(cy, ry0), ry0 + ch);
                if (Math.hypot(nx - cx, ny - cy) <= radius) { this.cells[i] = 1; added++; }
            }
        }
        return added;
    }

    /** Flattened share of the grid, 0..1. */
    coverage() {
        let c = 0;
        for (let i = 0; i < this.cells.length; i++) c += this.cells[i];
        return c / this.cells.length;
    }

    /** Flatten every cell (tests, and a "press all" shortcut). */
    flattenAll() {
        this.cells.fill(1);
    }
}

/**
 * How well a powder shows on a surface: 1.0 if it suits the surface, 0.95 for magnetic on a smooth
 * surface (it still works, gently), else 0.85.
 * @param {string} powder POWDERS id.
 * @param {string} surface SURFACES id.
 * @returns {number} 1, 0.95 or 0.85
 */
export function contrastFactor(powder, surface) {
    const s = SURFACES[surface];
    if (!s || !POWDERS[powder]) return 0.85;
    if (s.bestPowder === powder) return 1.0;
    if (powder === 'magnetic' && s.smooth) return 0.95;
    return 0.85;
}

/**
 * Lift quality: `clamp(0.25 + 0.75 * clarity * contrast * tape, 0, 0.99)` rounded to 2 dp,
 * where `tape = 0.85 + 0.15 * tapeCoverage`. `clarity` is already normalised by
 * DustField#metrics (80% clean ridges counts as 1).
 * @param {{clarity:number, contrast:number, tapeCoverage:number}} p
 * @returns {number} 0..0.99
 */
export function liftQuality({ clarity, contrast, tapeCoverage }) {
    const tape = 0.85 + 0.15 * tapeCoverage;
    const q = 0.25 + 0.75 * clarity * contrast * tape;
    return Math.round(Math.min(0.99, Math.max(0, q)) * 100) / 100;
}

/**
 * Rating label, matching the biometrics panel: Perfect >= 95, Excellent >= 85, Good >= 75,
 * Fair >= 60, Acceptable >= 40, otherwise Poor.
 * @param {number} quality 0..1
 * @returns {'Perfect'|'Excellent'|'Good'|'Fair'|'Acceptable'|'Poor'}
 */
export function ratingFor(quality) {
    const q = quality * 100 + 1e-9;
    if (q >= 95) return 'Perfect';
    if (q >= 85) return 'Excellent';
    if (q >= 75) return 'Good';
    if (q >= 60) return 'Fair';
    if (q >= 40) return 'Acceptable';
    return 'Poor';
}

const POWDER_NAMES = { black: 'Black powder', silver: 'Silver powder', magnetic: 'Magnetic powder' };

/**
 * Why a powder is a poor choice for a surface, as one short UK-English sentence for the foot line
 * ("Silver powder on a pale glossy surface: low contrast. Black powder would show these ridges better.").
 * Returns null when the powder suits the surface. The lift is still usable either way.
 * @param {string} powder POWDERS id.
 * @param {string} surface SURFACES id.
 * @returns {string|null}
 */
export function wrongPowderReason(powder, surface) {
    const s = SURFACES[surface], p = POWDERS[powder];
    if (!s || !p || s.bestPowder === powder) return null;
    const better = POWDER_NAMES[s.bestPowder] || s.bestPowder;
    let why;
    if (powder === 'magnetic') why = 'it works, but it is meant for textured plastic and shows a little faint';
    else if (!s.smooth) why = 'it catches in the grain and shows faint';
    else why = 'low contrast';
    return `${POWDER_NAMES[powder]} on ${s.name}: ${why}. ${better} would show these ridges better.`;
}
