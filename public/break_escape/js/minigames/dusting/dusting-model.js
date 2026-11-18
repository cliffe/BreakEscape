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
 * - `decoySamePattern`: 'never' (decoys use a different pattern, unless the scenario forces one with a { name, pattern } entry), 'one' (exactly one decoy shares it), 'all'.
 * - `findFloor`: strength of the dotted checker floor of the print mask in the find step, with no torch
 *   (0 on hard, so hard needs the torch unless High contrast is on). The game rescales it per surface so the
 *   luma change is about the same on dark and light surfaces (see `findFloorScale`).
 * - `partial`: 'never' | 'maybe' (about half the surfaces) | 'always' the print is cut by a straight edge.
 * - `sheenScale`: multiplier for the torch sheen's visibility radius.
 * - `marks`: minutiae marked round the core on the lift and every card in the compare step (F26), so the
 *   cards can be told apart by eye; the right card carries the same marks in the same places.
 * @type {Object<string, {pfog:number, minCoverage:number, residueStrength:number, candidates:number,
 *   decoySamePattern:'never'|'one'|'all', findFloor:number, partial:'never'|'maybe'|'always', sheenScale:number,
 *   marks:number, hintAfterMs:number, nearRadius:number}>}
 */
export const DIFFICULTY = {
    // easy: decoys have a different pattern class by default, so the compare is by class; near-identical
    // whorls on easy were not a fair comparison (m08 E16). A scenario may force a same-class decoy with a
    // { name, pattern } entry in fingerprintCandidates (m05's mug does). Medium and hard keep the minutiae test.
    easy: { pfog: 7, minCoverage: 0.40, residueStrength: 1.0, candidates: 2, decoySamePattern: 'never', findFloor: 0.24, partial: 'never', sheenScale: 1.0, hintAfterMs: 8000, nearRadius: 8, marks: 3 },
    medium: { pfog: 6, minCoverage: 0.45, residueStrength: 1.0, candidates: 3, decoySamePattern: 'one', findFloor: 0.16, partial: 'maybe', sheenScale: 1.0, hintAfterMs: 10000, nearRadius: 8, marks: 3 },
    hard: { pfog: 5, minCoverage: 0.55, residueStrength: 0.9, candidates: 3, decoySamePattern: 'all', findFloor: 0, partial: 'always', sheenScale: 0.7, hintAfterMs: 15000, nearRadius: 5, marks: 2 }
};

const PATTERN_CLASSES = ['loop', 'whorl', 'arch'];

/**
 * Pattern class for each decoy reference card, from the difficulty's `decoySamePattern` rule.
 * 'never' (easy) gives every decoy a class other than the lift's, so the cards differ by class;
 * 'one' makes the first decoy share the lift's class; 'all' makes every decoy share it.
 * A decoy that must differ keeps its own class (`ownPatterns[k]`) when that already differs, so a
 * person's card shows the same finger on every surface; otherwise the seed picks another class.
 * @param {'loop'|'whorl'|'arch'} liftPattern
 * @param {number} count number of decoys
 * @param {'never'|'one'|'all'} rule
 * @param {number} seed unsigned integer, picks among the other classes
 * @param {string[]} [ownPatterns] each decoy's own pattern class (patternForOwner)
 * @returns {string[]}
 */
export function decoyPatterns(liftPattern, count, rule, seed, ownPatterns = []) {
    const others = PATTERN_CLASSES.filter(p => p !== liftPattern);
    const out = [];
    for (let k = 0; k < count; k++) {
        const own = ownPatterns[k];
        if (rule === 'all' || (rule === 'one' && k === 0)) out.push(liftPattern);
        else if (others.includes(own)) out.push(own);
        else out.push(others[(seed + k) % others.length]);
    }
    return out;
}

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

export const FIND_BEAM_GAIN = 1.6;
export const FIND_HC_FLOOR_BONUS = 0.16;
/** Luma change the medium floor (0.16) makes on every surface; easy and High contrast scale from it. */
export const FIND_FLOOR_DELTA = 30;
const FIND_FLOOR_REF = 0.16;
const FIND_FLOOR_MAX = 0.9;
const lumaOf = c => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
/**
 * Glint colour of the find step: white on dark surfaces; on light ones a dark blue (near black with
 * High contrast), dark enough to move the pale surface visibly.
 * @param {boolean} light @param {boolean} hc @returns {number[]} rgb
 */
export function findGlint(light, hc) {
    return light ? (hc ? [0, 0, 0] : [20, 28, 45]) : [255, 255, 255];
}
/**
 * Multiplier for the floor so it moves the unlit surface by about FIND_FLOOR_DELTA luma at medium
 * whatever the surface (the old fixed blend moved pale surfaces by 2 to 5 levels).
 * Never below 1, so a dark or textured surface keeps at least the tuned blend.
 * @param {number} unlitLuma luma of the surface with no torch @param {number[]} glint rgb
 */
export function findFloorScale(unlitLuma, glint) {
    const d = Math.abs(unlitLuma - lumaOf(glint));
    return d < 1 ? 1 : Math.max(1, (FIND_FLOOR_DELTA / FIND_FLOOR_REF) / d);
}
/**
 * Find step: how strongly one pixel of the latent print shows (0 to 1 blend towards the glint colour).
 * Two parts, both hard pixels (no blur): the torch sheen, full strength over most of the beam
 * (`lit` reaches 1 only at its centre, so it is scaled by FIND_BEAM_GAIN and capped), and a dotted
 * checkerboard floor of the print mask that shows without the torch, so the patch can be spotted by
 * looking while the torch still confirms it. The floor is a texture, so it does not rely on colour.
 * High contrast raises both (sheen gain and floor) and returns a stronger glint colour.
 * @param {{lit:number, ridge:number, mask:number, res:number, floor:number, floorScale?:number, dotted:boolean, hc:boolean}} p
 */
export function findSheen({ lit, ridge, mask, res, floor, floorScale = 1, dotted, hc }) {
    let s = lit > 0 ? ridge * mask * res * Math.min(1, lit * FIND_BEAM_GAIN) : 0;
    if (hc) s = Math.min(1, s * 1.25);
    if (dotted) s = Math.max(s, mask * Math.min(FIND_FLOOR_MAX, (floor + (hc ? FIND_HC_FLOOR_BONUS : 0)) * floorScale));
    return s;
}

/** Default Hint delay; each difficulty sets its own (DIFFICULTY.*.hintAfterMs: 8 s easy, 10 s medium, 15 s hard). */
export const HINT_AFTER_MS = 8000;
/** The torch is "near the print" within `radius` canvas px of a mask pixel (DIFFICULTY.*.nearRadius) and stays near until radius + FIND_LEAVE_MARGIN (no flicker). */
export const FIND_NEAR_RADIUS = 8;
export const FIND_LEAVE_MARGIN = 6;
export const FIND_LEAVE_RADIUS = FIND_NEAR_RADIUS + FIND_LEAVE_MARGIN;
/**
 * Is any print-mask pixel (above 0.3, as the click test uses) within `radius` px of (x, y)?
 * @param {ArrayLike<number>} mask n x n @param {number} n @param {number} x @param {number} y @param {number} radius
 */
export function torchNearPrint(mask, n, x, y, radius) {
    const r = Math.ceil(radius), px = Math.round(x), py = Math.round(y);
    for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
            if (dx * dx + dy * dy > radius * radius) continue;
            const xx = px + dx, yy = py + dy;
            if (xx >= 0 && yy >= 0 && xx < n && yy < n && mask[yy * n + xx] > 0.3) return true;
        }
    }
    return false;
}
/** Next "near" state with hysteresis: enters at `radius`, leaves only past radius + FIND_LEAVE_MARGIN. */
export function nextNearState(wasNear, mask, n, x, y, radius = FIND_NEAR_RADIUS) {
    return torchNearPrint(mask, n, x, y, wasNear ? radius + FIND_LEAVE_MARGIN : radius);
}

/**
 * Scale of the magnified compare pair: a whole number from 2 to 6 that fits `availW` per pane and, above 2x,
 * `maxH` tall (2x is the floor, so a wide crop can still be taller than maxH).
 */
export function zoomScale(side, availW, maxH) {
    return Math.max(2, Math.min(6, Math.floor(availW / side), Math.floor(maxH / side)));
}
export const ZOOM_MAX_H = 160;
/** Estimated height (px) of everything in the frame except the main row while comparing on a desktop-sized window:
 *  padding and border 20, title 32, step row 44, status line (two lines) 44, options 32. An estimate, not a measurement. */
export const ZOOM_CHROME_H = 172;
/** Height the pair may use in the stage column: the frame is the window less 24 px, less the chrome. */
export function zoomBudgetH(innerH) { return Math.max(240, innerH - 24 - ZOOM_CHROME_H); }
/**
 * The pair for the stage column (non-short screens). Panes sit side by side (width 2 (S side + 4) + 8, height S side + 26)
 * or stacked, lift above card (width S side + 4, height 2 S side + 62). The largest whole S from 2 to `maxS` that fits
 * the width `availW` and the height budget wins; side by side on a tie. If even 2x does not fit, the crop is limited to
 * what fits (stacked, 2x) and `limited` is true: a mark near the edge of a wide crop may then lose its margin.
 * @returns {{side:number, S:number, W:number, stacked:boolean, limited:boolean}}
 */
export function zoomPlan({ side, availW, budgetH, maxS = 6 }) {
    const capSbs = budgetH - 30, capStack = Math.floor((budgetH - 62) / 2);
    const best = (stacked) => {
        const cap = stacked ? capStack : capSbs;
        for (let S = maxS; S >= 2; S--) {
            const W = S * side;
            if (W > cap) continue;
            if ((stacked ? W + 4 : 2 * (W + 4) + 8) > availW) continue;
            return S;
        }
        return 0;
    };
    const a = best(false), b = best(true);
    if (a || b) {
        const stacked = b > a;
        const S = stacked ? b : a;
        return { side, S, W: S * side, stacked, limited: false };
    }
    const lim = Math.max(48, 2 * Math.floor(Math.min(capStack, availW - 4) / 4));
    const s2 = Math.min(side, lim);
    return { side: s2, S: 2, W: 2 * s2, stacked: true, limited: s2 < side };
}
export const ZOOM_MAX_H_SHORT = 128;
