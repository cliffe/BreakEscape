/**
 * Procedural fingerprint generator (pure; the only DOM use is drawPrint).
 *
 * Method: a zero-pole orientation field (loop / whorl) or a tented-arch field,
 * then ~8 passes of oriented Gabor filtering over seeded white noise, so ridges
 * organise themselves along the field and form endings and forks naturally.
 * A soft-edged egg-shaped mask with low-frequency "pressure" noise gives the
 * touch its outline. Minutiae come from Zhang-Suen thinning and crossing number.
 *
 * The ridges are grown once in a canonical (upright, full) frame from the seed
 * (owner + pattern). A variant then rotates / offsets / cuts that frame, so two
 * surfaces carrying the same person's print are two touches of the SAME finger:
 * the minutiae agree (`ux`, `uy` are the canonical coordinates and match across
 * variants and the upright reference card).
 *
 * Works in browsers and in node (ES module, no dependencies).
 * @module fingerprint-generator
 */

/** The three supported pattern classes. */
export const PATTERNS = ['loop', 'whorl', 'arch'];

/**
 * 32-bit FNV-1a hash of a string.
 * @param {string} str
 * @returns {number} unsigned 32-bit integer
 */
export function hashString(str) {
    let h = 0x811c9dc5;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}

/**
 * Small, fast seeded PRNG.
 * @param {number} seed integer seed
 * @returns {() => number} function returning floats in [0, 1)
 */
export function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Pattern class for a person, in roughly real proportions
 * (about 60% loops, 32% whorls, 8% arches). Deterministic per owner string.
 * @param {string} owner
 * @returns {'loop'|'whorl'|'arch'}
 */
export function patternForOwner(owner) {
    const r = mulberry32(hashString('pattern:' + owner))();
    if (r < 0.60) return 'loop';
    if (r < 0.92) return 'whorl';
    return 'arch';
}

const smoothstep = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
};

/** Seeded low-frequency value noise, returns f(x, y) in [0, 1] for x, y in 0..1. */
function makeValueNoise(rng, cells) {
    const n = cells + 1;
    const g = new Float32Array(n * n);
    for (let i = 0; i < g.length; i++) g[i] = rng();
    return (x, y) => {
        const fx = Math.min(Math.max(x, 0), 0.9999) * cells;
        const fy = Math.min(Math.max(y, 0), 0.9999) * cells;
        const ix = Math.floor(fx), iy = Math.floor(fy);
        const tx = smoothstep(0, 1, fx - ix), ty = smoothstep(0, 1, fy - iy);
        const a = g[iy * n + ix], b = g[iy * n + ix + 1];
        const c = g[(iy + 1) * n + ix], d = g[(iy + 1) * n + ix + 1];
        return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
    };
}

/** Singular points (canonical frame, pixels) for a pattern. */
function singularPoints(pattern, size, rng) {
    const N = size;
    const j = () => (rng() - 0.5) * 0.05 * N;
    if (pattern === 'loop') {
        const side = rng() < 0.5 ? -1 : 1; // which way the delta sits
        return {
            cores: [{ x: 0.5 * N - side * 0.03 * N + j(), y: 0.42 * N + j() }],
            deltas: [{ x: 0.5 * N + side * 0.16 * N + j(), y: 0.72 * N + j() }]
        };
    }
    if (pattern === 'whorl') {
        return {
            cores: [
                { x: 0.5 * N - 0.06 * N + j(), y: 0.46 * N + j() },
                { x: 0.5 * N + 0.06 * N + j(), y: 0.52 * N + j() }
            ],
            deltas: [
                { x: 0.5 * N - 0.18 * N + j(), y: 0.74 * N + j() },
                { x: 0.5 * N + 0.18 * N + j(), y: 0.74 * N + j() }
            ]
        };
    }
    return { cores: [], deltas: [] };
}

/** Orientation field theta[i] (ridge direction, radians, mod pi) in the canonical frame. */
function buildOrientation(pattern, size, sp, rng) {
    const N = size;
    const theta = new Float32Array(N * N);
    if (pattern === 'arch') {
        const cx = 0.5 * N + (rng() - 0.5) * 0.06 * N;
        const cy = 0.52 * N;
        const w = 0.3 * N, h = 0.3 * N;
        const k = 1.1 + rng() * 0.5;
        for (let y = 0; y < N; y++) {
            for (let x = 0; x < N; x++) {
                const e = Math.exp(-(((y - cy) / h) ** 2));
                theta[y * N + x] = Math.atan(k * ((x - cx) / w) * e);
            }
        }
        return theta;
    }
    const theta0 = 0; // far-field ridges run horizontally
    for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
            let s = 0;
            for (const d of sp.deltas) s -= Math.atan2(y - d.y, x - d.x);
            for (const c of sp.cores) s += Math.atan2(y - c.y, x - c.x);
            theta[y * N + x] = theta0 + 0.5 * s;
        }
    }
    return theta;
}

/** Soft-threshold offset: ridges slightly thinner than the furrows (share about 0.40 to 0.45). */
const RIDGE_BIAS = 0.1;

const NQ = 32; // orientation quantisation levels

/** Grow ridges: oriented Gabor passes over seeded noise. Returns continuous values (unit std). */
function growRidges(theta, size, period, rng, passes) {
    const N = size;
    const R = Math.max(3, Math.ceil(period * 0.85));
    const K = 2 * R + 1;
    const sigA = period * 0.45;
    const sigL = period * 0.75;
    // precomputed kernels per quantised orientation
    const kernels = [];
    for (let q = 0; q < NQ; q++) {
        const th = (q / NQ) * Math.PI;
        const c = Math.cos(th), s = Math.sin(th);
        const ker = new Float32Array(K * K);
        let sum = 0;
        for (let dy = -R; dy <= R; dy++) {
            for (let dx = -R; dx <= R; dx++) {
                const across = -dx * s + dy * c;
                const along = dx * c + dy * s;
                const v = Math.exp(-(across * across / (2 * sigA * sigA) + along * along / (2 * sigL * sigL)))
                    * Math.cos(2 * Math.PI * across / period);
                ker[(dy + R) * K + dx + R] = v;
                sum += v;
            }
        }
        const mean = sum / (K * K);
        let norm = 0;
        for (let i = 0; i < ker.length; i++) { ker[i] -= mean; norm += Math.abs(ker[i]); }
        for (let i = 0; i < ker.length; i++) ker[i] /= norm;
        kernels.push(ker);
    }
    const qmap = new Uint8Array(N * N);
    for (let i = 0; i < N * N; i++) {
        let t = theta[i] % Math.PI;
        if (t < 0) t += Math.PI;
        qmap[i] = Math.round(t / Math.PI * NQ) % NQ;
    }
    let cur = new Float32Array(N * N);
    let nxt = new Float32Array(N * N);
    for (let i = 0; i < cur.length; i++) cur[i] = rng() * 2 - 1;
    for (let p = 0; p < passes; p++) {
        for (let y = 0; y < N; y++) {
            for (let x = 0; x < N; x++) {
                const ker = kernels[qmap[y * N + x]];
                let acc = 0;
                for (let dy = -R; dy <= R; dy++) {
                    let yy = y + dy;
                    if (yy < 0) yy = 0; else if (yy >= N) yy = N - 1;
                    const row = yy * N;
                    const krow = (dy + R) * K + R;
                    for (let dx = -R; dx <= R; dx++) {
                        let xx = x + dx;
                        if (xx < 0) xx = 0; else if (xx >= N) xx = N - 1;
                        acc += cur[row + xx] * ker[krow + dx];
                    }
                }
                nxt[y * N + x] = acc;
            }
        }
        // normalise to zero mean, unit std
        let m = 0;
        for (let i = 0; i < nxt.length; i++) m += nxt[i];
        m /= nxt.length;
        let v = 0;
        for (let i = 0; i < nxt.length; i++) { nxt[i] -= m; v += nxt[i] * nxt[i]; }
        const sd = Math.sqrt(v / nxt.length) || 1;
        for (let i = 0; i < nxt.length; i++) nxt[i] /= sd;
        const t = cur; cur = nxt; nxt = t;
    }
    return cur;
}

/** Canonical mask: slightly egg-shaped ellipse, soft 4 px edge, uneven pressure. */
function buildMask(size, rng) {
    const N = size;
    const k = N / 128;
    const rx = 0.30 * N, ry = 0.40 * N;
    const cx = 0.5 * N, cy = 0.5 * N;
    const noise = makeValueNoise(rng, 5);
    const mask = new Float32Array(N * N);
    for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
            const dx = x - cx, dy = y - cy;
            const yn = dy / ry;
            const ws = 1 - 0.12 * yn; // wider at the top
            const r = Math.sqrt((dx / (rx * ws)) ** 2 + yn * yn);
            const dist = (1 - r) * rx * 0.9;
            let m = smoothstep(0, 4 * k, dist);
            const p = 0.8 + 0.2 * noise(x / N, y / N);
            // pressure fades a little more towards the rim
            m *= p * (0.85 + 0.15 * smoothstep(0, 14 * k, dist));
            mask[y * N + x] = m;
        }
    }
    return mask;
}

/** Zhang-Suen thinning of a binary image (Uint8Array, 1 = ridge), in place. */
function thin(img, N) {
    const idx = (x, y) => y * N + x;
    let changed = true;
    const toClear = [];
    let guard = 0;
    while (changed && guard++ < 12) {
        changed = false;
        for (let step = 0; step < 2; step++) {
            toClear.length = 0;
            for (let y = 1; y < N - 1; y++) {
                for (let x = 1; x < N - 1; x++) {
                    if (!img[idx(x, y)]) continue;
                    const p2 = img[idx(x, y - 1)], p3 = img[idx(x + 1, y - 1)], p4 = img[idx(x + 1, y)],
                        p5 = img[idx(x + 1, y + 1)], p6 = img[idx(x, y + 1)], p7 = img[idx(x - 1, y + 1)],
                        p8 = img[idx(x - 1, y)], p9 = img[idx(x - 1, y - 1)];
                    const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
                    if (B < 2 || B > 6) continue;
                    const A = (!p2 && p3) + (!p3 && p4) + (!p4 && p5) + (!p5 && p6)
                        + (!p6 && p7) + (!p7 && p8) + (!p8 && p9) + (!p9 && p2);
                    if (A !== 1) continue;
                    if (step === 0) {
                        if (p2 * p4 * p6 !== 0 || p4 * p6 * p8 !== 0) continue;
                    } else if (p2 * p4 * p8 !== 0 || p2 * p6 * p8 !== 0) continue;
                    toClear.push(idx(x, y));
                }
            }
            if (toClear.length) changed = true;
            for (const i of toClear) img[i] = 0;
        }
    }
}

/** Minutiae (canonical frame) from thinned ridges: crossing number 1 = ending, 3 = bifurcation. */
function findMinutiae(ridgesCont, maskCanon, N) {
    const k = N / 128;
    const bin = new Uint8Array(N * N);
    for (let i = 0; i < bin.length; i++) bin[i] = (ridgesCont[i] > RIDGE_BIAS && maskCanon[i] > 0.5) ? 1 : 0;
    thin(bin, N);
    const out = [];
    const at = (x, y) => (x < 0 || y < 0 || x >= N || y >= N) ? 0 : bin[y * N + x];
    const ring = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
    const edgeR = 4 * k;
    for (let y = 2; y < N - 2; y++) {
        for (let x = 2; x < N - 2; x++) {
            if (!bin[y * N + x]) continue;
            let cn = 0;
            for (let r = 0; r < 8; r++) {
                const a = at(x + ring[r][0], y + ring[r][1]);
                const b = at(x + ring[(r + 1) % 8][0], y + ring[(r + 1) % 8][1]);
                if (!a && b) cn++;
            }
            if (cn !== 1 && cn !== 3) continue;
            // keep clear of the mask edge
            let ok = true;
            for (let a = 0; a < 8 && ok; a++) {
                const px = Math.round(x + Math.cos(a * Math.PI / 4) * edgeR);
                const py = Math.round(y + Math.sin(a * Math.PI / 4) * edgeR);
                if (px < 0 || py < 0 || px >= N || py >= N || maskCanon[py * N + px] < 0.5) ok = false;
            }
            if (!ok) continue;
            out.push({ x, y, type: cn === 1 ? 'ending' : 'bifurcation' });
        }
    }
    // drop near-duplicates (spur clusters)
    const kept = [];
    for (const m of out) {
        if (!kept.some(q => Math.hypot(q.x - m.x, q.y - m.y) < 3 * k)) kept.push(m);
    }
    return kept;
}

/** Resolve a variant spec into a transform { rotation (radians), dx, dy, cutAngle, cutOffset }. */
function resolveVariant(variant, size, partial) {
    const t = { rotation: 0, dx: 0, dy: 0, cutAngle: null, cutOffset: 0 };
    if (variant === null || variant === undefined) return t;
    if (typeof variant === 'object') {
        t.rotation = (variant.rotation || 0) * Math.PI / 180;
        t.dx = variant.dx || 0;
        t.dy = variant.dy || 0;
        if (variant.cutAngle !== undefined && variant.cutAngle !== null) {
            t.cutAngle = variant.cutAngle; t.cutOffset = variant.cutOffset || 0;
        }
        return t;
    }
    const r = mulberry32(hashString('variant:' + variant));
    t.rotation = (r() * 40 - 20) * Math.PI / 180;
    t.dx = (r() - 0.5) * 0.1 * size;
    t.dy = (r() - 0.5) * 0.1 * size;
    const ca = r() * Math.PI * 2, co = (0.12 + r() * 0.08) * size;
    if (partial) { t.cutAngle = ca; t.cutOffset = co; }
    return t;
}

/**
 * Generate a fingerprint.
 *
 * @param {Object} opts
 * @param {string} opts.owner Seeds the print (same owner + pattern gives the same finger).
 * @param {'loop'|'whorl'|'arch'} [opts.pattern] Defaults to patternForOwner(owner).
 * @param {number} [opts.size=128] Canvas size in pixels (square). Ridge period is 5 px at 128.
 * @param {string|number|Object|null} [opts.variant=null] null gives the upright reference print.
 *   A string/number derives a touch (rotation within +-20 degrees, offset) from the id; an object
 *   `{rotation (degrees), dx, dy, cutAngle (radians), cutOffset (px)}` sets it explicitly.
 * @param {boolean} [opts.partial=false] With a string/number variant, also cut the print with a straight line.
 * @returns {{size:number, owner:string, pattern:string, ridges:Float32Array, mask:Float32Array,
 *   cores:{x:number,y:number}[], deltas:{x:number,y:number}[],
 *   minutiae:{x:number,y:number,type:'ending'|'bifurcation',ux:number,uy:number}[],
 *   bounds:{x:number,y:number,w:number,h:number},
 *   transform:{rotation:number,dx:number,dy:number,cutAngle:(number|null),cutOffset:number}}}
 *   `ridges` and `mask` are row-major 0..1. `minutiae` are in this print's frame; `ux`/`uy` are the
 *   canonical coordinates, equal for the same finger across variants. `bounds` bounds mask > 0.5.
 */
export function generatePrint({ owner, pattern, size = 128, variant = null, partial = false } = {}) {
    const N = size;
    const pat = PATTERNS.includes(pattern) ? pattern : patternForOwner(owner);
    const seed = hashString(`${owner}|${pat}`);
    const rng = mulberry32(seed);
    const period = 5 * N / 128;

    const sp = singularPoints(pat, N, rng);
    const theta = buildOrientation(pat, N, sp, rng);
    const cont = growRidges(theta, N, period, rng, 8);
    const maskC = buildMask(N, rng);
    // low-frequency ink variation along the ridges, as uneven pressure gives
    const inkNoise = makeValueNoise(rng, 6);
    const inkC = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) inkC[y * N + x] = 0.78 + 0.22 * inkNoise(x / N, y / N);

    const tf = resolveVariant(variant, N, partial);
    const cx = N / 2, cy = N / 2;
    const cs = Math.cos(tf.rotation), sn = Math.sin(tf.rotation);
    // canonical -> final: p = R(u - c) + c + d ; inverse used for sampling
    const toFinal = (ux, uy) => ({
        x: cs * (ux - cx) - sn * (uy - cy) + cx + tf.dx,
        y: sn * (ux - cx) + cs * (uy - cy) + cy + tf.dy
    });
    const identity = tf.rotation === 0 && tf.dx === 0 && tf.dy === 0;

    const ridges = new Float32Array(N * N);
    const mask = new Float32Array(N * N);
    const sample = (arr, fx, fy) => {
        fx = Math.min(Math.max(fx, 0), N - 1.001);
        fy = Math.min(Math.max(fy, 0), N - 1.001);
        const ix = Math.floor(fx), iy = Math.floor(fy);
        const tx = fx - ix, ty = fy - iy;
        const i = iy * N + ix;
        return (arr[i] * (1 - tx) + arr[i + 1] * tx) * (1 - ty) + (arr[i + N] * (1 - tx) + arr[i + N + 1] * tx) * ty;
    };
    const hasCut = tf.cutAngle !== null;
    const nx = hasCut ? Math.cos(tf.cutAngle) : 0, ny = hasCut ? Math.sin(tf.cutAngle) : 0;
    for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
            const i = y * N + x;
            let v, m, ink;
            if (identity) {
                v = cont[i]; m = maskC[i]; ink = inkC[i];
            } else {
                const px = x - cx - tf.dx, py = y - cy - tf.dy;
                const ux = cs * px + sn * py + cx;
                const uy = -sn * px + cs * py + cy;
                v = sample(cont, ux, uy);
                m = sample(maskC, ux, uy);
                ink = sample(inkC, ux, uy);
            }
            ridges[i] = (0.5 + 0.5 * Math.tanh(3 * (v - RIDGE_BIAS))) * ink;
            if (hasCut) {
                const s = (x - cx) * nx + (y - cy) * ny;
                m *= Math.min(1, Math.max(0, (tf.cutOffset + 2 - s) / 4));
            }
            mask[i] = m;
        }
    }

    const cores = sp.cores.map(c => toFinal(c.x, c.y));
    const deltas = sp.deltas.map(d => toFinal(d.x, d.y));
    const edge = 4 * N / 128;
    const minutiae = [];
    for (const m of findMinutiae(cont, maskC, N)) {
        const p = toFinal(m.x, m.y);
        const px = Math.round(p.x), py = Math.round(p.y);
        if (px < 0 || py < 0 || px >= N || py >= N) continue;
        let ok = true;
        for (let a = 0; a < 8 && ok; a++) {
            const qx = Math.round(p.x + Math.cos(a * Math.PI / 4) * edge);
            const qy = Math.round(p.y + Math.sin(a * Math.PI / 4) * edge);
            if (qx < 0 || qy < 0 || qx >= N || qy >= N || mask[qy * N + qx] < 0.5) ok = false;
        }
        if (ok && mask[py * N + px] > 0.5) minutiae.push({ x: p.x, y: p.y, type: m.type, ux: m.x, uy: m.y });
    }

    let x0 = N, y0 = N, x1 = -1, y1 = -1;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        if (mask[y * N + x] > 0.5) {
            if (x < x0) x0 = x; if (x > x1) x1 = x;
            if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
    }
    const bounds = x1 < 0 ? { x: 0, y: 0, w: 0, h: 0 } : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };

    return { size: N, owner, pattern: pat, ridges, mask, cores, deltas, minutiae, bounds, transform: tf };
}

/** Parse '#rgb', '#rrggbb', 'rgb(...)' / 'rgba(...)' to [r, g, b]. */
function parseColour(c, fallback) {
    if (!c) return fallback;
    let m = /^#([0-9a-f]{3})$/i.exec(c);
    if (m) return [...m[1]].map(h => parseInt(h + h, 16));
    m = /^#([0-9a-f]{6})/i.exec(c);
    if (m) return [0, 2, 4].map(o => parseInt(m[1].slice(o, o + 2), 16));
    m = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(c);
    if (m) return [+m[1], +m[2], +m[3]];
    return fallback;
}

/**
 * Draw a print as crisp pixels (nearest-neighbour scaling, no smoothing).
 * Pixel alpha is `ridges * mask * alpha[i]`; with no `alpha` array it is `ridges * mask`.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {ReturnType<typeof generatePrint>} print
 * @param {Object} [opts]
 * @param {number} [opts.x=0] Destination x on ctx.
 * @param {number} [opts.y=0] Destination y on ctx.
 * @param {number} [opts.scale=1] Integer scale factor.
 * @param {string} [opts.ink='#1b1b1b'] Ridge colour (#rgb, #rrggbb or rgb()).
 * @param {string|null} [opts.background=null] Fill behind the print (whole size*scale square), or null for transparent.
 * @param {Float32Array|null} [opts.alpha=null] Per-pixel development 0..1 to show a partly dusted print.
 */
export function drawPrint(ctx, print, { x = 0, y = 0, scale = 1, ink = '#1b1b1b', background = null, alpha = null } = {}) {
    const N = print.size;
    const [r, g, b] = parseColour(ink, [27, 27, 27]);
    const data = new Uint8ClampedArray(N * N * 4);
    for (let i = 0; i < N * N; i++) {
        let a = print.ridges[i] * print.mask[i];
        if (alpha) a *= alpha[i];
        data[i * 4] = r; data[i * 4 + 1] = g; data[i * 4 + 2] = b;
        data[i * 4 + 3] = Math.round(a * 255);
    }
    let off;
    if (typeof OffscreenCanvas !== 'undefined') off = new OffscreenCanvas(N, N);
    else { off = document.createElement('canvas'); off.width = N; off.height = N; }
    off.getContext('2d').putImageData(new ImageData(data, N, N), 0, 0);
    ctx.save();
    if (background) { ctx.fillStyle = background; ctx.fillRect(x, y, N * scale, N * scale); }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, x, y, N * scale, N * scale);
    ctx.restore();
}
