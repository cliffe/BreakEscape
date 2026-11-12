// The minigame Cancel row (.minigame-controls) sits in the window's column under the
// game area (unlock gaps R1). The minigame sweep (2026-11-12) found the minigames
// that this broke; these checks keep their fixes in place.
// Run with: node --test test/js/minigame-controls-layout.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = (name) => readFileSync(join(here, '../../public/break_escape/css', name), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');

// Declarations of every top-level or nested rule whose selector list includes `selector`
function rules(src, selector) {
    const out = [];
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(src))) {
        const sels = m[1].split(',').map(s => s.trim().replace(/\s+/g, ' '));
        if (sels.includes(selector)) {
            const decls = {};
            for (const d of m[2].split(';')) {
                const i = d.indexOf(':');
                if (i > 0) decls[d.slice(0, i).trim()] = d.slice(i + 1).trim();
            }
            out.push(decls);
        }
    }
    return out;
}
const rule = (src, selector) => {
    const all = rules(src, selector);
    assert.ok(all.length > 0, `no rule for ${selector}`);
    return Object.assign({}, ...all);
};

const framework = css('minigames-framework.css');

test('the Cancel row is in the flow and painted above anything that spills over it', () => {
    const r = rule(framework, '.minigame-controls');
    assert.notEqual(r.position, 'absolute');
    assert.notEqual(r.position, 'fixed');
    assert.equal(r['flex-shrink'], '0');
    assert.ok(Number(r['z-index']) >= 1, 'z-index keeps Cancel above spilled content');
});

test('the game area can shrink to leave room for the Cancel row', () => {
    assert.equal(rule(framework, '.minigame-game-container')['min-height'], '0');
});

test('full-window consoles opt in to the overlaid Cancel row; no class allowlist (R2 m2)', () => {
    const r = rule(framework, '.minigame-controls-overlay .minigame-controls');
    assert.equal(r.position, 'absolute');
    assert.ok(r.bottom);
    assert.equal(rule(framework, '.minigame-controls-overlay .minigame-game-container')['min-height'], 'auto', 'overlay consoles keep their full game area (R2 n1)');
    for (const box of ['.siem-minigame-container', '.ehr-terminal-minigame-container',
        '.nad-minigame-container', '.backup-recovery-minigame-container']) {
        assert.equal(rules(framework, `${box} .minigame-controls`).length, 0, `${box} is no longer listed by class`);
    }
    const js = (p) => readFileSync(join(here, '../../public/break_escape/js/minigames', p), 'utf8');
    for (const f of ['siem/siem-dashboard-minigame.js', 'ehr-terminal/ehr-terminal-minigame.js',
        'network-architecture/network-architecture-minigame.js', 'backup-recovery/backup-recovery-minigame.js']) {
        assert.match(js(f), /static controlsOverlay = true;/, f);
    }
    const base = js('framework/base-minigame.js');
    assert.match(base, /static controlsOverlay = false;/);
    assert.match(base, /classList\?\.toggle\?\.\('minigame-controls-overlay', this\.constructor\.controlsOverlay === true\)/);
});

test('scene overrides keep the Cancel row positioned, so its z-index holds (R2 m2)', () => {
    for (const [file, sel] of [['examine-minigame.css', '.examine-minigame .minigame-controls'],
        ['forensic-data-platform-minigame.css', '.fdp-minigame-container .minigame-controls'],
        ['biometrics-minigame.css', '.fingerprint-reader-container .minigame-controls']]) {
        assert.equal(rule(css(file), sel).position, 'relative', sel);
    }
});

test('the case-lock panel has no soft focus glow (R2 m1)', () => {
    assert.equal(rule(css('password-minigame.css'), '.password-minigame-area.case-lock .password-field:focus')['box-shadow'], 'none');
});

test('the password and container panels fit inside the game area with their margins', () => {
    for (const [file, sel] of [['password-minigame.css', '.password-minigame-area'],
        ['container-minigame.css', '.container-minigame']]) {
        const r = rule(css(file), sel);
        assert.equal(r.padding, '20px', sel);
        assert.equal(r.margin, '20px auto', sel);
        // 20px margin and 20px padding top and bottom: 80px less than the area
        assert.equal(r.height, 'calc(100% - 80px)', sel);
    }
    assert.equal(rule(css('container-minigame.css'), '.container-minigame.desktop-mode').height, 'calc(100% - 40px)');
});

test('on a short landscape screen the notes Continue stays beside the notepad', () => {
    const src = css('notes.css');
    const media = src.slice(src.indexOf('@media (orientation: landscape) and (max-height: 640px)'));
    assert.ok(media.length > 0);
    const r = rule(media, '.minigame-container:has(.notes-minigame-notepad) .minigame-controls');
    assert.equal(r.position, 'absolute');
    assert.equal(r.right, '24px');
});
