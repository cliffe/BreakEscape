// B11 live-check fixes. GNF text takes whole-pixel line boxes (a fractional box puts glyphs on
// half pixels): 16px on 24, 24px on 32, 32px on 40. The shredded-memo buttons are real 44px boxes
// at phone width, with no overflowing hit-area pseudo-element. The kiosk flip card wraps a long
// URL. Comments are stripped before matching.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const css = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/css');
const read = (f) => readFileSync(join(css, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
function all(file, sel, prop, src = read(file)) {
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
    assert.ok(v.length > 0, `${file} ${sel} declares ${prop}`);
    assert.ok(v.every((x) => x === want), `${sel} ${prop} in every rule is ${want}, got ${v.join(' | ')}`);
}

// 16px body text on a 24px line
const BODY24 = [
    ['concern-form-minigame.css', '.cf-root'],
    ['awareness-skin.css', '.aw-flip'],
    ['awareness-skin.css', '.aw-debrief'],
    ['episode-runner.css', '.epr-panel'],
    ['authenticator-minigame.css', '.auth-intro'],
    ['authenticator-minigame.css', '.auth-choice-opt'],
    ['authenticator-minigame.css', '.auth-outcome-line'],
    ['inbox-triage-minigame.css', '.tri-panel'],
    ['inbox-triage-minigame.css', '.tri-kind'],
    ['mail-client-minigame.css', '.mail-ink-body'],
    ['landing-page-builder-minigame.css', '.lpb-copy'],
    ['privacy-panel-minigame.css', '.pp-root'],
    ['sort-drill-minigame.css', '.sd-root'],
    ['password-guesser-minigame.css', '.epr-gs-root'],
    ['pretext-prep-minigame.css', '.pretext-prep'],
    ['shredded-document-minigame.css', '.sdm-strip-text'],
    ['shredded-document-minigame.css', '.sdm-success-reveal'],
    ['infusion-pump-minigame.css', '.ip-pump-screen'],
    ['sis-config-threshold-minigame.css', '.sis-modal p'],
];
test('16px GNF body text sits on a 24px line box', () => {
    for (const [f, s] of BODY24) everyIs(f, s, 'line-height', '24px');
});

// 24px headings on a 32px line (they inherited a unitless 1.4 to 1.45 from their root)
const HEAD32 = [
    ['concern-form-minigame.css', '.cf-heading'],
    ['inbox-triage-minigame.css', '.tri-panel h3'],
    ['inbox-triage-minigame.css', '.tri-sheet-title'],
    ['inbox-triage-minigame.css', '.tri-kind-title'],
    ['mail-client-minigame.css', '.mail-subject'],
    ['sort-drill-minigame.css', '.sd-situation'],
    ['pretext-prep-minigame.css', '.pretext-debrief-title'],
    ['sis-config-threshold-minigame.css', '.sis-modal h4'],
    ['engagement-report-minigame.css', '.er-h'],
    ['infusion-pump-minigame.css', '.ip-pump-display'],
    ['backup-recovery-minigame.css', '.backup-recovery-slot'],
];
test('24px GNF headings sit on a 32px line box', () => {
    for (const [f, s] of HEAD32) everyIs(f, s, 'line-height', '32px');
});

// Sweep: no rule in a sheet this branch touched pairs a px GNF size with a unitless line height that
// resolves to a fraction. VT323 and Press Start 2P rules are out of scope, as are the two VT323 sheets.
const SHEETS = [
    'authenticator', 'awareness-skin', 'backup-recovery-minigame', 'concern-form-minigame', 'episode-runner',
    'inbox-triage-minigame', 'infusion-pump-minigame', 'landing-page-builder-minigame', 'mail-client-minigame',
    'network-segmentation-map-minigame', 'password-guesser-minigame', 'pretext-prep-minigame',
    'privacy-panel-minigame', 'shredded-document-minigame', 'sis-config-threshold-minigame', 'sort-drill-minigame',
].map((n) => (n === 'authenticator' ? 'authenticator-minigame' : n) + '.css');
test('no unitless line height resolves to a fractional pixel in the touched GNF sheets', () => {
    const bad = [];
    for (const f of SHEETS) {
        for (const m of read(f).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
            const lh = m[2].match(/line-height:\s*([0-9.]+)\s*(?:;|$)/);
            const fs = m[2].match(/font-size:\s*(\d+)px/);
            const ff = (m[2].match(/font-family:\s*([^;]+)/) || [])[1] || '';
            if (!lh || !fs || /VT323|Press Start/.test(ff)) continue;
            const px = Number(lh[1]) * Number(fs[1]);
            if (Math.abs(px - Math.round(px)) > 1e-6) bad.push(`${f} ${m[1].trim()} ${lh[1]} x ${fs[1]} = ${px}`);
        }
    }
    assert.ok(bad.length === 0, 'fractional line boxes: ' + bad.join('; '));
});

test('shredded memo: phone-width Up/Down/Flip are real 44px boxes and the overflowing hit area is dropped', () => {
    const src = read('shredded-document-minigame.css');
    const phone = [...src.matchAll(/@media\s*\(max-width:\s*600px\)\s*\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g)].map((m) => m[1]).join('\n');
    assert.ok(phone.length > 0, 'a plain max-width: 600px block exists');
    for (const prop of ['min-height', 'min-width']) {
        const v = all('shredded-document-minigame.css', '.sdm-move-btn', prop, phone);
        assert.ok(v.length === 1 && v[0] === '44px', `.sdm-move-btn ${prop} 44px in the phone block, got ${v.join('|')}`);
        const w = all('shredded-document-minigame.css', '.sdm-flip-btn', prop, phone);
        assert.ok(w.length === 1 && w[0] === '44px', `.sdm-flip-btn ${prop} 44px in the phone block, got ${w.join('|')}`);
    }
    const after = all('shredded-document-minigame.css', '.sdm-move-btn::after', 'content', phone);
    assert.ok(after.length === 1 && after[0] === 'none', 'the ::after hit area is off at phone width (it counted as scroll overflow)');
});

test('kiosk flip card and its address bar wrap a long URL', () => {
    everyIs('awareness-skin.css', '.aw-flip-page', 'overflow-wrap', 'anywhere');
    everyIs('awareness-skin.css', '.aw-flip-page', 'min-width', '0');
    everyIs('awareness-skin.css', '.aw-flip-call', 'overflow-wrap', 'anywhere');
    everyIs('awareness-skin.css', '.tri-address', 'overflow-wrap', 'anywhere');
    everyIs('awareness-skin.css', '.tri-address', 'min-width', '0');
});
