// B11 round-1 fixes: headings that sat at 17-19px stay above 16px body text (GNF draws one weight,
// so size is the cue), CTA buttons match their VT323 neighbours, and the touched line heights are
// whole pixels. Comments are stripped before matching.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const css = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/css');
const read = (f) => readFileSync(join(css, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
// Declaration value of `prop` in the first rule whose selector list is exactly `sel`
function decl(file, sel, prop) {
    const src = read(file);
    const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = src.match(new RegExp(`(?:^|[},\\s])${esc}\\s*\\{([^}]*)\\}`));
    if (!m) return null;
    const d = m[1].match(new RegExp(`(?:^|[;\\s])${prop}:\\s*([^;]+)`));
    return d ? d[1].trim() : null;
}

// Every declaration value of `prop` in every rule (all @media blocks too) that names `sel` as the
// last compound of one of its selectors. A media override cannot slip past a first-rule read.
function all(file, sel, prop) {
    const src = read(file);
    const out = [];
    for (const m of src.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const names = m[1].split(',').map((x) => x.trim());
        if (!names.some((n) => n === sel || n.endsWith(' ' + sel))) continue;
        const d = m[2].match(new RegExp(`(?:^|[;\\s])${prop}:\\s*([^;]+)`));
        if (d) out.push(d[1].trim());
    }
    return out;
}
function everyIs(file, sel, prop, want) {
    const v = all(file, sel, prop);
    assert.ok(v.length > 0, `${sel} declares ${prop}`);
    assert.ok(v.every((x) => x === want), `${sel} ${prop} in every rule is ${want}, got ${v.join(' | ')}`);
}

const HEADINGS = [
    ['awareness-skin.css', '.aw-flip-section'],
    ['osint-browser-minigame.css', '.ob-heading'],
    ['inbox-triage-minigame.css', '.tri-compare-title'],
    ['intel-board-minigame.css', '.ib-name'],
    ['sort-drill-minigame.css', '.sd-score'],
    ['privacy-panel-minigame.css', '.pp-section'],
];

test('M1: former 17-19px headings are GNF 24, above the 16px body', () => {
    for (const [file, sel] of HEADINGS) {
        everyIs(file, sel, 'font-size', '24px');
        everyIs(file, sel, 'line-height', '32px'); // .ib-name sets its own: nothing above it sets a line height
    }
});

// m3: a section heading at 24 would match its page heading, so the page headings take GNF 32
const PAGE_HEADINGS = [
    ['awareness-skin.css', '.aw-heading'],
    ['episode-runner.css', '.epr-heading'],
    ['osint-browser-minigame.css', '.ob-page-title'],
    ['privacy-panel-minigame.css', '.pp-heading'],
    ['sort-drill-minigame.css', '.sd-heading'],
];
test('m3: page headings are GNF 32 on a 40px line, above their 24px section headings', () => {
    for (const [file, sel] of PAGE_HEADINGS) {
        everyIs(file, sel, 'font-size', '32px');
        everyIs(file, sel, 'line-height', '40px');
    }
    for (const [file, sel] of PAGE_HEADINGS.filter((p) => p[1] !== '.epr-heading')) {
        assert.ok(all(file, sel, 'overflow-wrap').includes('anywhere'), `${sel} wraps an unbroken word at 32px`);
    }
});

// AC1: the site name leads, so the masthead is not smaller than the page title under it
test('m3: the OSINT site name is GNF 32 on a 40px line, not smaller than the page title', () => {
    everyIs('osint-browser-minigame.css', '.ob-site-title', 'font-size', '32px');
    everyIs('osint-browser-minigame.css', '.ob-site-title', 'line-height', '40px');
    assert.ok(all('osint-browser-minigame.css', '.ob-site-title', 'overflow-wrap').includes('anywhere'), 'wraps an unbroken word');
});

test('M1: the defender exposure card wraps long text instead of overflowing', () => {
    const f = 'intel-board-minigame.css';
    for (const sel of ['.ib-name', '.ib-reduce', '.ib-ask', '.ib-option']) {
        assert.ok(all(f, sel, 'overflow-wrap').includes('anywhere'), `${sel} has overflow-wrap: anywhere`);
    }
    assert.ok(all(f, '.ib-name', 'min-width').includes('0'), '.ib-name has min-width 0');
});

// R4 m2 + touch rule: the defender option buttons sit on a whole-pixel line and are at least 44px tall
test('R4 m2: .ib-option has a 24px line and a 44px minimum height', () => {
    everyIs('intel-board-minigame.css', '.ib-option', 'line-height', '24px');
    everyIs('intel-board-minigame.css', '.ib-option', 'min-height', '44px');
});

test('m1: CTA letter-spacing is a whole pixel', () => {
    everyIs('ncsc-brief-minigame.css', '.ncsc-open-btn', 'letter-spacing', '1px');
    everyIs('coverage-decision-form-minigame.css', '.cdf-submit-btn', 'letter-spacing', '1px');
});

test('m1: NCSC and coverage CTA buttons are GNF 24', () => {
    assert.ok(decl('ncsc-brief-minigame.css', '.ncsc-open-btn', 'font-size') === '24px', 'ncsc open button 24px');
    assert.ok(decl('coverage-decision-form-minigame.css', '.cdf-submit-btn', 'font-size') === '24px', 'coverage submit button 24px');
});

test('m2: the authenticator label keeps a visible gap above the request line (margin, not size)', () => {
    const m = decl('authenticator-minigame.css', '.auth-card-app', 'margin');
    assert.ok(m === '0 0 6px', `auth-card-app margin is 0 0 6px, not ${m}`);
    for (const sel of ['.lpb-root .cc-title', '.lpb-inspect-title', '.lpb-pretext-title']) {
        assert.ok(/ 10px$/.test(decl('landing-page-builder-minigame.css', sel, 'margin') || ''), `${sel} bottom margin is 10px`);
    }
});

test('m6: touched line heights are whole pixels', () => {
    assert.ok(decl('intel-board-minigame.css', '.ib-brief', 'line-height') === '24px', '.ib-brief 24px');
    assert.ok(decl('network-segmentation-map-minigame.css', '.nsm-modal-body', 'line-height') === '26px', '.nsm-modal-body 26px');
});

test('m4: the backup-recovery outcome header rule is declared once (the media copy was dead)', () => {
    const src = read('backup-recovery-minigame.css');
    const n = (src.match(/\.backup-recovery-shell--outcome \.backup-recovery-header\s*\{/g) || []).length;
    assert.ok(n === 1, `declared ${n} times`);
});
