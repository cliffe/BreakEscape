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
        for (const re of banned) assert.doesNotMatch(src(rel), re, `${name} still has ${re}`);
    }
});

test('pop-ups that are not confirms close with the shared X; confirms keep two named buttons and no X', () => {
    const sis = src(SCENES['sis-config-threshold']);
    for (const id of ['sis-detail-close', 'sis-compare-close']) {
        assert.match(sis, new RegExp(`class="minigame-close-button sis-modal-close" id="${id}" aria-label="Close">&times;<`), `${id} is the shared X`);
    }
    assert.match(sis, /id="sis-confirm-no">Cancel</);
    assert.match(sis, /id="sis-confirm-yes">Confirm</);
    assert.match(css('sis-config-threshold-minigame.css'), /\.sis-modal-with-x h4 \{[^}]*padding-right: 40px/, 'pop-up title stops short of its X');
    const esd = src(SCENES['esd-pushbutton']);
    assert.match(esd, /id="esd-confirm">CONFIRM - INITIATE SHUTDOWN</);
    assert.match(esd, /id="esd-cancel">CANCEL</);
    // The scene X hides while a confirm or pop-up is open, so one X shows at a time
    for (const text of [sis, esd]) {
        assert.match(text, /_hideSceneX\(true\)/);
        assert.match(text, /_hideSceneX\(false\)/);
    }
    const ehr = src(SCENES['ehr-terminal']);
    assert.match(ehr, /\[UNDERSTOOD\]/, 'EHR keeps its acknowledgement');
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

test('after-shot fixes: SIEM rows never shrink and wrap the message onto its own line below 1100px; the command board field stays in its cell; scrolling panes use the pixel scrollbar', () => {
    const siem = css('siem-dashboard-minigame.css');
    assert.match(siem, /\.siem-alert-row \{[^}]*flex-shrink: 0/);
    const mid = siem.slice(siem.indexOf('@media (max-width: 1100px)'));
    assert.match(mid, /\.siem-alert-row \{[^}]*grid-template-columns: 56px 72px minmax\(0, 1fr\) auto/);
    assert.match(mid, /\.siem-description \{[^}]*grid-column: 1 \/ -1;[^}]*grid-row: 2/);
    assert.match(css('command-board-minigame.css'), /\.cb-entry-input \{[^}]*box-sizing: border-box/);
    assert.match(src('ransomware-display/ransomware-display-minigame.js'), /class="ransomware-display-body pixel-scroll"/);
    assert.match(src(SCENES['backup-recovery']), /class="backup-recovery-panel pixel-scroll"/);
    const lf = src(SCENES['log-filter']);
    for (const cls of ['lf-body', 'lf-filter-pane', 'lf-log-table-wrap', 'lf-session-detail', 'lf-overlay-panel', 'lf-audit-table-wrap']) {
        assert.match(lf, new RegExp(`'${cls} pixel-scroll'`), `${cls} scrolls with the pixel scrollbar`);
    }
});
