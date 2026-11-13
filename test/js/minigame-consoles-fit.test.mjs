// Console, SIS and network scenes fit, close and look right (UI consoles build,
// docs/achitechture/UI_CONSOLES_BUILD_LOG.md): one close control per scene (the X), the X
// inside the frame for the framed consoles, no scene-owned fixed heights that push a frame
// off a short window, phone layouts that stack, and the pixel-art rules in the console sheets.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../public/break_escape');
const css = (name) => readFileSync(join(root, 'css', name), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const src = (rel) => readFileSync(join(root, 'js/minigames', rel), 'utf8');

const SCENES = {
    'backup-recovery': 'backup-recovery/backup-recovery-minigame.js',
    'claims-management-system': 'claims-management-system/claims-management-system-minigame.js',
    'command-board': 'command-board/command-board-minigame.js',
    'coverage-decision-form': 'coverage-decision-form/coverage-decision-form-minigame.js',
    'drug-library-integrity': 'drug-library-integrity/drug-library-integrity-minigame.js',
    'ehr-terminal': 'ehr-terminal/ehr-terminal-minigame.js',
    'esd-pushbutton': 'esd-pushbutton/esd-pushbutton-minigame.js',
    'sis-config-threshold': 'sis-config-threshold/sis-config-threshold-minigame.js',
    'warranty-checklist': 'warranty-checklist/warranty-checklist-minigame.js',
    'blockchain-explorer': 'blockchain-explorer/blockchain-explorer-minigame.js',
    'log-filter': 'log-filter/log-filter-minigame.js',
    'capture-log': 'capture-log/capture-log-minigame.js'
};

test('no scene draws its own Close / Close Terminal / [CLOSE] button beside the X (X5)', () => {
    const banned = [/>\s*Close\s*</, />\s*\[?\s*CLOSE( TERMINAL)?\s*\]?\s*</i, /textContent\s*=\s*'\[CLOSE\]'/,
        /cms-close-button/, /cdf-close-btn/, /wcc-close-btn/, /bce-close-btn/, /lf-close-btn/];
    for (const [name, rel] of Object.entries(SCENES)) {
        // The SIS config detail and compare pop-ups keep a Close that shuts the pop-up only,
        // not the scene; their scene X is still the one close control
        const text = name === 'sis-config-threshold' ? src(rel).replace(/id="sis-(detail|compare)-close">Close</g, '') : src(rel);
        for (const re of banned) assert.doesNotMatch(text, re, `${name} still has ${re}`);
    }
});

test('log filter draws inside the game area, so the framework X is never wiped (LF1)', () => {
    const text = src(SCENES['log-filter']);
    assert.doesNotMatch(text, /this\.container\.innerHTML\s*=/);
    assert.match(text, /const c = this\.gameContainer;/);
});

test('framed consoles put the X inside their frame (X4)', () => {
    const anchors = {
        'backup-recovery': '.backup-recovery-shell',
        'command-board': '#cb-panel',
        'ehr-terminal': '.ehr-terminal-panel',
        'esd-pushbutton': '.esd-panel',
        'sis-config-threshold': null,
        'log-filter': null,
        'capture-log': null
    };
    for (const [name, sel] of Object.entries(anchors)) {
        const text = src(SCENES[name]);
        assert.match(text, /static closeInsideFrame = true;/, `${name} opts in`);
        if (sel) assert.ok(text.includes(`'${sel}'`), `${name} anchors the X on ${sel}`);
    }
});

test('no scene-owned px minimum or viewport height pushes a frame off a short window (X2)', () => {
    const checks = [
        ['claims-management-system-minigame.css', /min-height:\s*620px/],
        ['command-board-minigame.css', /min-height:\s*540px/],
        ['esd-pushbutton-minigame.css', /min-height:\s*(620|560|520)px/],
        ['coverage-decision-form-minigame.css', /min-height:\s*500px/],
        ['scada-historian-minigame.css', /min-height:\s*500px/],
        ['ehr-terminal-minigame.css', /height:\s*100vh/],
        ['sis-config-threshold-minigame.css', /height:\s*50vh/],
        ['backup-recovery-minigame.css', /height:\s*(80|88)vh/],
        ['ransomware-display-minigame.css', /100v[wh]/]
    ];
    for (const [file, re] of checks) assert.doesNotMatch(css(file), re, `${file} ${re}`);
});

test('the command board is never scaled down (crisp text)', () => {
    assert.doesNotMatch(css('command-board-minigame.css'), /transform:\s*scale/);
});

test('console sheets keep the pixel-art rules (X6)', () => {
    const sheets = ['backup-recovery', 'claims-management-system', 'command-board', 'coverage-decision-form',
        'drug-library-integrity', 'ehr-terminal', 'esd-pushbutton', 'log-filter', 'network-segmentation-map',
        'sis-config-threshold', 'warranty-checklist', 'blockchain-explorer', 'capture-log', 'siem-dashboard'];
    for (const s of sheets) {
        const text = css(`${s}-minigame.css`);
        assert.doesNotMatch(text, /Courier New/, `${s}: Courier New`);
        assert.doesNotMatch(text, /(border|outline)(-\w+)?:\s*1px\b/, `${s}: 1px line`);
        assert.doesNotMatch(text, /border-radius:\s*[1-9]/, `${s}: radius`);
        assert.doesNotMatch(text, /font-weight:\s*(bold|[6-9]00)/, `${s}: faux bold`);
        // a gradient is allowed only as hard stops (stripes, dashes): no plain two-colour fades
        for (const m of text.matchAll(/(radial|linear)-gradient\(([^;]*)\)/g)) {
            assert.ok(/repeating-|\d+%\s+\d+%|0\s+20%/.test(m[0]) || /\b\d+px,\s*#\w+ \d+px/.test(m[0]),
                `${s}: soft gradient ${m[0].slice(0, 60)}`);
        }
    }
});

test('Press Start 2P stays on its 8px grid with a whole-pixel line height in the console sheets (X7, X9)', () => {
    const sheets = ['backup-recovery', 'claims-management-system', 'command-board', 'ehr-terminal', 'esd-pushbutton',
        'network-segmentation-map', 'ransomware-display', 'blockchain-explorer'];
    for (const s of sheets) {
        const text = css(`${s}-minigame.css`);
        for (const m of text.matchAll(/\{([^{}]*Press Start 2P[^{}]*)\}/g)) {
            const size = /font-size:\s*(\d+)px/.exec(m[1]);
            if (size) assert.ok([8, 16, 24, 32].includes(+size[1]), `${s}: Press Start at ${size[1]}px`);
            const lh = /line-height:\s*([^;]+);/.exec(m[1]);
            if (lh) assert.match(lh[1].trim(), /px$/, `${s}: line-height ${lh[1]}`);
        }
    }
});

test('multi-column consoles stack under 600px (X3)', () => {
    const phone = {
        'command-board-minigame.css': '.cb-body',
        'claims-management-system-minigame.css': '.cms-body',
        'siem-dashboard-minigame.css': '.siem-body',
        'scada-historian-minigame.css': '.sh-body',
        'log-filter-minigame.css': '.lf-body',
        'blockchain-explorer-minigame.css': '.bce-body',
        'ehr-terminal-minigame.css': '.ehr-online-layout',
        'sis-config-threshold-minigame.css': '.sis-threshold-table'
    };
    for (const [file, sel] of Object.entries(phone)) {
        const text = css(file);
        const at = text.indexOf('@media (max-width: 600px)');
        assert.ok(at >= 0, `${file} has a phone rule`);
        assert.ok(text.slice(at).includes(sel), `${file} phone rule covers ${sel}`);
    }
});
