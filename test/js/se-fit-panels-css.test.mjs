// Sweep 5 "fit": the landing-page builder panel is opaque in every state, and the concern form's
// Start button stays in view on short landscape. CSS pins; the live check measures the rects.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const css = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'break_escape', 'css');
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'break_escape');
const read = (f) => readFileSync(join(css, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

function rule(src, selector) {
    const out = [];
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(src))) {
        if (m[1].split(',').some((s) => s.trim() === selector)) out.push(m[2]);
    }
    return out;
}

// Flat list of {sel, body} for every rule, including those inside @media blocks
function allRules(src) {
    const out = [];
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(src))) out.push({ sel: m[1].trim(), body: m[2] });
    return out;
}

// The text between the braces of the block that opens with exactly `header`, by brace depth
function mediaBlock(src, header) {
    const i = src.indexOf(header + ' {');
    if (i < 0) return null;
    let depth = 0;
    const open = src.indexOf('{', i);
    for (let k = open; k < src.length; k++) {
        if (src[k] === '{') depth++;
        else if (src[k] === '}' && --depth === 0) return src.slice(open + 1, k);
    }
    return null;
}

test('every .lpb-game-container rule that sets a background is opaque (scene, invalid, captures)', () => {
    const rules = allRules(read('landing-page-builder-minigame.css')).filter((r) =>
        r.sel.split(',').some((s) => /\.lpb-game-container$/.test(s.trim())));
    assert.ok(rules.length >= 1, 'a .lpb-game-container rule exists');
    const withBg = rules.filter((r) => /(^|[;\s])background(-color)?\s*:/.test(r.body));
    assert.ok(withBg.length >= 1, 'a .lpb-game-container rule sets a background');
    for (const r of withBg) {
        const bg = /(?:^|[;\s])background(?:-color)?\s*:\s*([^;]+)/.exec(r.body)[1];
        assert.ok(/--ui-surface-opaque/.test(bg), `${r.sel} uses --ui-surface-opaque: ${bg}`);
        assert.ok(!/rgba|hsla|--ui-surface\b(?!-opaque)|transparent/.test(bg), `${r.sel} has no translucent colour: ${bg}`);
    }
});

test('concern form short landscape: exact 500px block tightens the panel and the footer', () => {
    const src = read('concern-form-minigame.css');
    const block = mediaBlock(src, '@media (max-height: 500px)');
    assert.ok(block !== null, 'has an @media (max-height: 500px) block with no extra conditions');
    assert.ok(!/font-size/.test(block), 'no font-size in the short-landscape block');
    assert.ok(/\.cf-panel\s*\{[^}]*max-width:\s*none/.test(block), 'panel uses the full width');
    assert.ok(/\.cf-foot\s*\{[^}]*padding/.test(block), 'footer padding is tightened');
});

test('concern form: Start is never positioned over the copy (no position or bottom offset on .cf-start)', () => {
    const rules = allRules(read('concern-form-minigame.css'));
    for (const r of rules.filter((x) => /cf-start|cf-foot|cf-button/.test(x.sel))) {
        assert.ok(!/(^|[;\s])(position|bottom|top|inset)\s*:/.test(r.body), `${r.sel} must not position the button: ${r.body.trim()}`);
    }
    const foot = rules.find((r) => r.sel === '.cf-foot');
    assert.ok(!!foot, '.cf-foot rule');
    assert.ok(/flex:\s*none/.test(foot.body), 'footer does not shrink or scroll');
    assert.ok(/background-color:\s*var\(--cf-surface\)/.test(foot.body), 'footer paints an opaque surface');
    assert.ok(!/(^|[;\s])overflow/.test(foot.body), 'footer is not a scroller');
    const stage = rules.find((r) => r.sel === '.cf-stage');
    assert.ok(/overflow-y:\s*auto/.test(stage.body), 'the stage is the scroller');
});

test('concern form: the flex chain keeps the stage shrinking and the footer fixed', () => {
    const src = read('concern-form-minigame.css');
    const rules = allRules(src);
    const stages = rules.filter((r) => r.sel.split(',').some((s) => /\.cf-stage$/.test(s.trim())));
    assert.ok(stages.length >= 1, 'a .cf-stage rule exists');
    const stage = stages.find((r) => r.sel === '.cf-stage');
    assert.ok(!!stage, 'exact .cf-stage rule');
    assert.ok(/(^|[;\s])flex:\s*1\s*;/.test(stage.body) || /flex:\s*1 1 /.test(stage.body), '.cf-stage grows and shrinks (flex: 1)');
    assert.ok(/min-height:\s*0/.test(stage.body), '.cf-stage has min-height: 0 so it can shrink');
    for (const r of stages) {
        assert.ok(!/(^|[;\s])flex(-shrink)?:\s*(none|0)/.test(r.body), `${r.sel} must not stop shrinking: ${r.body.trim()}`);
    }
    const empty = rules.find((r) => r.sel === '.cf-foot:empty');
    assert.ok(!!empty && /display:\s*none/.test(empty.body), '.cf-foot:empty is hidden');
    for (const r of rules.filter((x) => x.sel.split(',').some((s) => /\.cf-foot$/.test(s.trim())))) {
        assert.ok(!/(^|[;\s])(overflow(-x|-y)?|max-height|height)\s*:/.test(r.body), `${r.sel} must not scroll or cap the footer: ${r.body.trim()}`);
    }
});

test('concern form: the footer lines up with the panel copy at phone width', () => {
    const block = mediaBlock(read('concern-form-minigame.css'), '@media (max-width: 767px)');
    assert.ok(block !== null, 'has the 767px block');
    const panel = /\.cf-panel\s*\{[^}]*padding:\s*\d+px\s+(\d+)px/.exec(block);
    const foot = /\.cf-foot\s*\{[^}]*padding:\s*0\s+(\d+)px/.exec(block);
    assert.ok(!!panel && !!foot, 'both .cf-panel and .cf-foot set padding in the 767px block');
    assert.ok(panel[1] === foot[1], `footer side padding ${foot && foot[1]}px matches the panel ${panel && panel[1]}px`);
});

test('concern form JS: Start goes in the footer outside the stage, the footer is a sibling of the stage', () => {
    const js = readFileSync(join(root, 'js', 'minigames', 'concern-form', 'concern-form-minigame.js'), 'utf8');
    assert.ok(/this\.footEl\.appendChild\(start\)/.test(js), 'start is appended to footEl');
    assert.ok(!/this\.stageEl\.appendChild\(start\)|p\.appendChild\(start\)/.test(js), 'start is not inside the stage panel');
    assert.ok(/root\.appendChild\(this\.stageEl\);\s*[\s\S]{0,300}root\.appendChild\(this\.footEl\)/.test(js), 'footEl follows stageEl under the root');
    assert.ok(/this\.footEl\)\s*this\.footEl\.textContent\s*=\s*''/.test(js), 'footer is cleared on each step');
});

test('concern form: the min-height 44px touch target is untouched', () => {
    const decls = rule(read('concern-form-minigame.css'), '.cf-button');
    assert.ok(decls.some((d) => /min-height:\s*44px/.test(d)), '44px');
});

// R3: the landing-page builder's invalid state wraps its content instead of keeping the scene size.
test('lpb invalid state: JS marks the frame, CSS shrinks it to content with a minimum width', () => {
    const js = readFileSync(join(root, 'js', 'minigames', 'landing-page-builder', 'landing-page-builder-minigame.js'), 'utf8');
    const fn = js.slice(js.indexOf('_buildInvalid() {'));
    const body = fn.slice(0, fn.indexOf('\n    }\n'));
    assert.match(body, /gameContainer\.classList\.add\('lpb-game-container--invalid'\)/, 'invalid build sets the class with classList');
    const src = read('landing-page-builder-minigame.css');
    const rules = rule(src, '.lpb-game-container.lpb-game-container--invalid');
    assert.equal(rules.length, 1, 'one invalid-frame rule (two classes, beats the phone 100vw rule)');
    const b = rules[0];
    assert.match(b, /width:\s*(fit-content|auto)\s*;/, 'width wraps content');
    assert.match(b, /height:\s*auto\s*;/, 'height wraps content');
    assert.match(b, /min-width:\s*min\(\s*\d+px\s*,\s*\d+vw\s*\)/, 'minimum width, capped to the viewport');
    assert.doesNotMatch(b, /font-size/, 'no font-size');
    const root2 = rule(src, '.lpb-game-container--invalid .lpb-root');
    assert.ok(root2.length === 1 && /height:\s*auto/.test(root2[0]), 'inner root stops filling 100% height');
    // the normal scene rule keeps its full size
    const base = rule(src, '.lpb-game-container')[0];
    assert.match(base, /width:\s*min\(1180px, 96vw\)/);
    assert.match(base, /height:\s*min\(92vh, 900px\)/);
});
