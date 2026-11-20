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
        assert.ok(decl(file, sel, 'font-size') === '24px', `${sel} is 24px, not ${decl(file, sel, 'font-size')}`);
    }
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
