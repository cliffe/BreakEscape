// The X's hit area must not cover the first control row of rogue-ap, patch-panel or vm-launcher.
// Rather than pinning margin numbers, this works the geometry out from the shipped CSS: where the
// X sits (frame top + border + 4, as placeCloseButton puts it), how far its ::after reaches, and
// where the first row starts once the cascade of every device sheet has been applied (title
// padding, line-height and margin, frame padding, the row's own margin-top). A margin override
// anywhere in those sheets, or a negative margin on the row, moves the result and fails the test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const jsDir = join(here, '..', '..', 'public/break_escape/js');
const cssDir = process.env.DEVICE_FRAME_CSS_DIR || join(here, '..', '..', 'public/break_escape/css');
const read = (f) => readFileSync(join(cssDir, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

// ---- a small CSS reader: rules, one level of @media (min/max-width), class-only selectors ----
function parseSheet(css, startOrder) {
    const rules = [];
    let order = startOrder;
    const walk = (text, media) => {
        let i = 0;
        while (i < text.length) {
            const open = text.indexOf('{', i);
            if (open < 0) break;
            const head = text.slice(i, open).trim();
            let depth = 1, j = open + 1;
            while (j < text.length && depth > 0) { if (text[j] === '{') depth++; else if (text[j] === '}') depth--; j++; }
            const body = text.slice(open + 1, j - 1);
            if (head.startsWith('@media')) walk(body, head.slice(6).trim());
            else if (!head.startsWith('@')) {
                const decls = {};
                for (const d of body.split(';')) {
                    const k = d.indexOf(':');
                    if (k > 0) decls[d.slice(0, k).trim()] = d.slice(k + 1).replace(/!important/, '').trim();
                }
                for (const sel of head.split(',')) rules.push({ sel: sel.trim(), decls, media, order: order++ });
            }
            i = j;
        }
    };
    walk(css, null);
    return rules;
}
const mediaOk = (media, w) => {
    if (!media) return true;
    const conds = [...media.matchAll(/\((min|max)-width:\s*(\d+)px\)/g)];
    if (!conds.length || media.replace(/\((min|max)-width:\s*\d+px\)/g, '').replace(/\band\b/g, '').trim() !== '') return false;
    return conds.every(([, k, n]) => (k === 'min' ? w >= Number(n) : w <= Number(n)));
};
// compounds of classes joined by > or a space; anything else (tags, attributes, pseudo) never matches
function parseSel(sel) {
    if (sel.includes('::')) return null; // pseudo-elements never style the element itself
    // a pseudo-class only narrows when a rule applies; the conservative reading is that it applies
    sel = sel.replace(/:[\w-]+(\([^)]*\))?/g, '');
    if (/[\[*#+~:]/.test(sel)) return null;
    const parts = sel.replace(/\s*>\s*/g, ' > ').split(/\s+/);
    const out = [];
    for (let k = 0; k < parts.length; k++) {
        if (parts[k] === '>') { out[out.length - 1].child = true; continue; }
        const cls = parts[k].split('.').filter(Boolean);
        if (!cls.length || !/^\.[\w.-]+$/.test(parts[k])) return null;
        out.push({ cls, child: false });
    }
    return out;
}
// chain: classes of each ancestor from the root down to the element. The last compound must match
// the element; each combinator before it must hold against the ancestors.
function matches(sel, chain) {
    const comps = parseSel(sel);
    if (!comps) return null;
    const has = (c, el) => c.cls.every((x) => el.includes(x));
    if (!has(comps[comps.length - 1], chain[chain.length - 1])) return null;
    let at = chain.length - 1;
    for (let k = comps.length - 2; k >= 0; k--) {
        const direct = comps[k].child;
        if (direct) { at--; if (at < 0 || !has(comps[k], chain[at])) return null; }
        else { let f = false; for (at--; at >= 0; at--) if (has(comps[k], chain[at])) { f = true; break; } if (!f) return null; }
    }
    const classes = comps.reduce((n, c) => n + c.cls.length, 0);
    return classes;
}
const px = (v, vars = { '--device-frame-gap': 6 }) => {
    v = v.trim();
    const m = /^var\((--[\w-]+)\)$/.exec(v);
    if (m) return vars[m[1]];
    const c = /^calc\((.*)\)$/.exec(v);
    if (c) { // sums and differences of px terms only; anything else must not slip through unread
        const expr = c[1].replace(/var\((--[\w-]+)\)/g, (_, k) => `${vars[k]}px`).replace(/\s+/g, '');
        assert.ok(/^[-+]?\d+(\.\d+)?(px)?([-+]\d+(\.\d+)?(px)?)*$/.test(expr), `unreadable calc() value: ${v}`);
        return [...expr.matchAll(/[-+]?\d+(\.\d+)?/g)].reduce((n, t) => n + parseFloat(t[0]), 0);
    }
    return parseFloat(v);
};
const side = (v, which) => { // which: 0 top, 2 bottom of a 1 to 4 value shorthand
    const a = v.trim().split(/\s+/);
    const i = a.length === 1 ? 0 : a.length === 2 ? [0, 0, 1, 1][which] : [0, 1, 2, 1][which];
    return px(a[which === 0 ? 0 : (a.length === 1 ? 0 : a.length === 2 ? 0 : 2)]) ?? px(a[i]);
};
// per-property cascade: the highest specificity wins, ties go to the later rule
function computed(rules, chain, w, prop, shorthand, whichSide, fallback = 0) {
    let best = null;
    for (const r of rules) {
        if (!mediaOk(r.media, w)) continue;
        const spec = matches(r.sel, chain);
        if (spec === null) continue;
        for (const [k, v] of Object.entries(r.decls)) {
            let val = null;
            if (k === prop) val = px(v);
            else if (k === shorthand) val = side(v, whichSide);
            if (val === null || Number.isNaN(val)) continue;
            if (!best || spec > best.spec || (spec === best.spec && r.order >= best.order)) best = { spec, order: r.order, val };
        }
    }
    return best ? best.val : fallback;
}

const sheets = ['device-frame.css', 'rogue-ap.css', 'patch-panel-minigame.css', 'vm-launcher-minigame.css'];
let order = 0;
const rules = [];
for (const f of sheets) { const r = parseSheet(read(f), order); order += r.length + 1; rules.push(...r); }
const frameworkCss = read('minigames-framework.css');
const frameCss = read('device-frame.css');

// ---- constants read from the shipped files ----
const gap = Number(/const gap = (\d+);/.exec(readFileSync(join(jsDir, 'minigames/framework/base-minigame.js'), 'utf8'))?.[1]);
const bezel = Number(/\.device-frame \{[^}]*?border:\s*(\d+)px solid transparent/.exec(frameCss)?.[1]);
const xSize = Number(/\.minigame-close-button \{[^}]*?width:\s*(\d+)px/.exec(frameworkCss)?.[1]);
const vmXSize = Number(/\.vm-launcher-minigame > \.minigame-close-button \{[^}]*?width:\s*(\d+)px/.exec(read('vm-launcher-minigame.css'))?.[1]);
const reachRule = /\.minigame-container:has\(\.device-frame\)\s*>\s*\.minigame-close-button\.minigame-close-in-frame::after\s*\{([^}]*)\}/.exec(frameCss);
const inset = (reachRule ? /inset:\s*([^;]+)/.exec(reachRule[1])?.[1] : /\.minigame-close-button::after \{[^}]*?inset:\s*([^;]+)/.exec(frameworkCss)?.[1]).trim().split(/\s+/).map(parseFloat);
const [insTop, , insBottom] = inset.length === 1 ? [inset[0], 0, inset[0]] : [inset[0], 0, inset[2]];
const borders = [4, 6]; // the unthemed X border and the themed --ui-small-button-px

const frames = {
    'rogue-ap': { frame: ['device-frame', 'rogue-ap'], title: ['device-frame-title', 'rogue-ap-title'], row: ['rogue-ap-tabs'], x: xSize, lead: () => 0 },
    'patch-panel': { frame: ['device-frame', 'patch-panel'], title: ['device-frame-title'], row: ['patch-panel-scroll'], x: xSize, lead: (w) => (w < 344 ? 0 : w < 560 ? 16 : 0) }, // 4x6 rows carry a 16px range label on phones; under 344px it is 6x4 with none
    'vm-launcher': { frame: ['device-frame', 'vm-launcher-frame'], title: ['device-frame-title', 'vm-launcher-title-row'], row: ['vm-launcher'], x: vmXSize, lead: () => 0 },
};

function geometry(name, w) {
    const f = frames[name];
    const c = (chain, p, sh, s) => computed(rules, chain, w, p, sh, s);
    const framePad = c([f.frame], 'padding-top', 'padding', 0);
    const titleChain = [f.frame, f.title];
    const rowTop = bezel + framePad + c(titleChain, 'padding-top', 'padding', 0) + c(titleChain, 'line-height', 'line-height-none', 0, 0)
        + c(titleChain, 'margin-bottom', 'margin', 2) + c([f.frame, f.row], 'margin-top', 'margin', 0) + f.lead(w);
    const xTop = bezel + gap;
    return { rowTop, xTop, drawnBottom: xTop + f.x };
}
const reach = (name, b) => {
    const { xTop } = geometry(name, 1280);
    const size = frames[name].x;
    return { top: xTop + b + insTop, bottom: xTop + size - b - insBottom };
};

test('the constants were read from the shipped files', () => {
    assert.ok(gap === 4 && bezel === 16 && xSize === 30 && vmXSize === 32, `gap ${gap} bezel ${bezel} X ${xSize}/${vmXSize}`);
    assert.ok(inset.length === 4 && inset.every((n) => !Number.isNaN(n)), 'a device-frame reach rule with four insets exists');
});

test('the X hit area is at least 44px tall and stays inside the viewport', () => {
    for (const name of Object.keys(frames)) {
        for (const b of borders) {
            const r = reach(name, b);
            assert.ok(r.bottom - r.top >= 44, `${name} border ${b}: hit area ${r.bottom - r.top}px tall`);
            assert.ok(r.top >= -gap - bezel, `${name} border ${b}: hit area top ${r.top}px above the frame is off screen`);
        }
    }
});

for (const w of [320, 390, 1280]) {
    for (const name of Object.keys(frames)) {
        test(`${name} at ${w}px: the first row clears the X hit area by at least 2px and the drawn X`, () => {
            const g = geometry(name, w);
            for (const b of borders) {
                const r = reach(name, b);
                assert.ok(g.rowTop >= r.bottom + 2, `${name} ${w}px border ${b}: first row at ${g.rowTop}px, hit area ends at ${r.bottom}px`);
            }
            assert.ok(g.rowTop >= g.drawnBottom, `${name} ${w}px: first row at ${g.rowTop}px sits under the drawn X (bottom ${g.drawnBottom}px)`);
        });
    }
}

test('the cascade reader sees the shared title margin (guards the test itself)', () => {
    const g = geometry('rogue-ap', 1280);
    assert.ok(g.rowTop === 58, `rogue-ap desktop row top ${g.rowTop}, expected 58 from 16 + 6 + 24 + 12`);
    // K3: phone titles stay 16px on a 24px line with the same 12px margin as desktop (a single-line title; a wrapped one only pushes the row lower)
    assert.ok(geometry('rogue-ap', 390).rowTop === 58, `rogue-ap phone row top ${geometry('rogue-ap', 390).rowTop}, expected 58 from 16 + 6 + 24 + 12`);
    assert.ok(geometry('vm-launcher', 390).rowTop === 58, `vm-launcher phone row top ${geometry('vm-launcher', 390).rowTop}, expected 58 from 16 + 6 + 24 + 12`);
    assert.ok(geometry('patch-panel', 1280).rowTop === 52, 'patch-panel desktop row top 52 from 16 + 24 + 12');
});

test('the rogue-ap title comment describes the upward reach, not a downward one', () => {
    const raw = readFileSync(join(cssDir, 'rogue-ap.css'), 'utf8');
    assert.ok(!/hit area hangs/.test(raw), 'no comment says the hit area hangs below the title row');
    assert.ok(/reaches up into the bezel/.test(raw), 'the comment says the reach goes up into the bezel');
});
