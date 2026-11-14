// Console, SIS and network scenes fit, close and look right (UI consoles build,
// docs/achitechture/UI_CONSOLES_BUILD_LOG.md): one close control per scene (the X), the X
// inside the frame for the framed consoles, no scene-owned fixed heights that push a frame
// off a short window, phone layouts that stack, and the pixel-art rules in the console sheets.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
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

// X8: every console, SIS and network scene draws in the one shared console window, except the
// scenes that are physical devices (their diegetic frame stays; UI_CONSOLES2_BUILD_LOG.md)
const CONSOLE_SCENES = {
    'concern-form': 'concern-form/concern-form-minigame.js',
    'coverage-decision-form': 'coverage-decision-form/coverage-decision-form-minigame.js',
    'drug-library-integrity': 'drug-library-integrity/drug-library-integrity-minigame.js',
    'forensic-data-platform': 'forensic-data-platform/forensic-data-platform-minigame.js',
    'ncsc-brief': 'ncsc-brief/ncsc-brief-minigame.js',
    'network-architecture': 'network-architecture/network-architecture-minigame.js',
    'scada-historian': 'scada-historian/scada-historian-minigame.js',
    'blockchain-explorer': 'blockchain-explorer/blockchain-explorer-minigame.js',
    'capture-log': 'capture-log/capture-log-minigame.js',
    'warranty-checklist': 'warranty-checklist/warranty-checklist-minigame.js',
    'log-filter': 'log-filter/log-filter-minigame.js',
    'claims-management-system': 'claims-management-system/claims-management-system-minigame.js',
    'backup-recovery': 'backup-recovery/backup-recovery-minigame.js',
    'command-board': 'command-board/command-board-minigame.js',
    'ehr-terminal': 'ehr-terminal/ehr-terminal-minigame.js',
    'sis-config-threshold': 'sis-config-threshold/sis-config-threshold-minigame.js',
    'ransomware-display': 'ransomware-display/ransomware-display-minigame.js',
    'siem': 'siem/siem-dashboard-minigame.js',
    'network-segmentation-map': 'network-segmentation-map/network-segmentation-map-minigame.js'
};
const DEVICE_SCENES = {
    'esd-pushbutton': ['esd-pushbutton/esd-pushbutton-minigame.js', '.esd-panel'],
    'infusion-pump': ['infusion-pump/infusion-pump-minigame.js', null]
};

test('X8: every console scene opts into the shared console window and draws no X placement of its own', () => {
    for (const [name, rel] of Object.entries(CONSOLE_SCENES)) {
        const text = src(rel);
        assert.match(text, /static consoleWindow = true;/, `${name} opts into the shared window`);
        assert.doesNotMatch(text, /static closeInsideFrame = true;/, `${name}: the X is laid out in the shared bar, not placed`);
        assert.doesNotMatch(text, /^\s*closeAnchor\s*\(\)\s*\{/m, `${name}: the frame is the shared window`);
        assert.doesNotMatch(text, /this\.container\.innerHTML\s*=/, `${name}: never replaces the shell (it would drop the shared bar)`);
    }
});

test('X8: device scenes keep their diegetic frame with the X inside it', () => {
    for (const [name, [rel, sel]] of Object.entries(DEVICE_SCENES)) {
        const text = src(rel);
        assert.doesNotMatch(text, /static consoleWindow = true;/, `${name} is a device, not a console window`);
        assert.match(text, /static closeInsideFrame = true;/, `${name} opts in`);
        if (sel) assert.ok(text.includes(`'${sel}'`), `${name} anchors the X on ${sel}`);
    }
});

test('X8: the shared window has one title bar with the X inside it, a 9-slice frame and the size caps', () => {
    const base = src('framework/base-minigame.js');
    const block = base.slice(base.indexOf('if (isConsole) {'), base.indexOf('} else this.container.innerHTML'));
    assert.equal((block.match(/class="console-titlebar"/g) || []).length, 1, 'one title bar');
    assert.equal((block.match(/id="minigame-close"/g) || []).length, 1, 'one X');
    const bar = block.slice(block.indexOf('console-titlebar'), block.indexOf('minigame-header'));
    assert.match(bar, /id="minigame-close"/, 'the X sits inside the title bar');
    assert.match(bar, /class="console-title"/);
    assert.match(bar, /class="console-subtitle"/);
    assert.match(base, /return this\.consoleWindowEl \|\| this\.gameContainer;/, 'the window is the frame the checks measure');
    assert.match(base, /consoleWindow !== true && this\.params\.disableClose/, 'no X placement watcher for console windows');

    const fw = css('minigames-framework.css');
    const rule = (sel) => { const i = fw.indexOf(sel + ' {'); assert.ok(i >= 0, `rule ${sel}`); return fw.slice(i, fw.indexOf('}', i)); };
    const win = rule('.console-window');
    assert.match(win, /width: min\(1280px, 100%\)/);
    assert.match(win, /max-height: min\(880px, 100%\)/);
    assert.match(win, /border-image-source: var\(--ui-frame-image\)/);
    assert.doesNotMatch(win, /border-radius|gradient|box-shadow: [^n]/);
    const title = rule('.console-window .console-title');
    assert.match(title, /font-family: 'Press Start 2P'/);
    assert.match(title, /font-size: 16px/);
    assert.match(title, /line-height: 24px/);
    const sub = rule('.console-window .console-subtitle');
    assert.match(sub, /font-family: 'GNF'/);
    assert.match(sub, /font-size: 16px/);
    assert.match(rule('.console-titlebar > .minigame-close-button'), /position: static/, 'the X is laid out in the bar');
    assert.match(rule('.minigame-container.minigame-console'), /padding: 8px/, 'phones: the whole window less 8px');
    assert.match(fw, /@media \(max-width: 600px\), \(max-height: 500px\) \{\s*\.console-window \{\s*width: 100%;\s*height: 100%;/);
});

test('X8: the shared window title is escaped text and can be changed later', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'minigame-console-'));
    try {
        writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
        for (const rel of ['minigames/framework/base-minigame.js', 'utils/display-dashes.js', 'utils/escape-html.js']) {
            mkdirSync(dirname(join(dir, rel)), { recursive: true });
            writeFileSync(join(dir, rel), readFileSync(join(root, 'js', rel), 'utf8'));
        }
        const { MinigameScene } = await import(pathToFileURL(join(dir, 'minigames/framework/base-minigame.js')).href);
        class Console extends MinigameScene { static consoleWindow = true; }
        const els = {};
        const el = (cls) => (els[cls] ||= { textContent: '', hidden: false, style: {}, classList: { add() {}, toggle() {} } });
        const container = {
            innerHTML: '', classList: { toggle() {}, add() {} },
            querySelector: (sel) => ({ '.console-window': el('win'), '.console-title': el('title'), '.console-subtitle': el('sub'), '.minigame-header': el('hdr'), '.minigame-game-container': el('body') })[sel] || null
        };
        const savedDoc = globalThis.document, log = console.log;
        globalThis.document = { getElementById: () => ({ addEventListener() {} }) };
        console.log = () => {};
        try {
            const scene = new Console(container, { title: '<b>SIEM</b>', consoleSubtitle: 'Trust & co' });
            scene.init();
            assert.match(container.innerHTML, /&lt;b&gt;SIEM&lt;\/b&gt;/, 'title escaped');
            assert.match(container.innerHTML, /Trust &amp; co/, 'subtitle escaped');
            assert.equal(scene.closeAnchor(), el('win'));
            scene.setConsoleTitle('Fleet console', '');
            assert.equal(el('title').textContent, 'Fleet console');
            assert.equal(el('sub').hidden, true, 'an empty subtitle hides');
        } finally { globalThis.document = savedDoc; console.log = log; }
    } finally { rmSync(dir, { recursive: true, force: true }); }
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

test('review round 1: log filter pop-ups follow the one-close-control rule (M3)', () => {
    const lf = src(SCENES['log-filter']);
    assert.doesNotMatch(lf, /\[✕\]/, 'no text [✕] left');
    assert.match(lf, /minigame-close-button lf-overlay-close/, 'info pop-ups use the shared X');
    assert.match(lf, /_overlayMode !== 'flag_confirm' && this\._overlayMode !== 'flag_rejected'/, 'confirm-style pop-ups have no X');
    assert.match(lf, /'\[CANCEL\]'/);
    assert.match(lf, /\[CONFIRM: FLAG ACTIVE SESSION\]/);
    assert.match(lf, /_hideSceneX\(true\)/);
    assert.match(lf, /_hideSceneX\(false\)/);
});

test('review round 1: Esc is Cancel on an open pop-up or confirm and only closes the scene when none is open (m2)', () => {
    const base = src('framework/base-minigame.js');
    assert.match(base, /typeof this\.handleEscapeKey === 'function' && this\.handleEscapeKey\(e\)\) return;/);
    for (const name of ['sis-config-threshold', 'esd-pushbutton', 'log-filter']) {
        assert.match(src(SCENES[name]), /handleEscapeKey\(\) \{/, `${name} handles Esc on its pop-up`);
    }
});

test('review round 2: every scene with a pop-up or confirm handles Esc and hides the scene X while it is open (m1)', () => {
    const more = {
        'network-segmentation-map': 'network-segmentation-map/network-segmentation-map-minigame.js',
        'infusion-pump': 'infusion-pump/infusion-pump-minigame.js',
        'scada-historian': 'scada-historian/scada-historian-minigame.js'
    };
    for (const [name, rel] of Object.entries({ ...more, 'drug-library-integrity': SCENES['drug-library-integrity'] })) {
        const code = src(rel);
        assert.match(code, /handleEscapeKey\(\) \{/, `${name} handles Esc on its pop-up`);
        assert.match(code, /_hideSceneX\(true\)/, `${name} hides the scene X on open`);
        assert.match(code, /_hideSceneX\(false\)/, `${name} shows the scene X on close`);
    }
    // the segmentation map owns its X (#nsm-close), the others use the shell's
    assert.match(src(more['network-segmentation-map']), /_hideSceneX\(hidden\) \{\s*const x = this\.container\?\.querySelector\?\.\('#nsm-close'\)/);
    // the source pop-up is not a confirm: it carries the shared X in its header
    assert.match(src(SCENES['drug-library-integrity']), /minigame-close-button dli-modal-close/);
});

test('review round 1: the real base-minigame Esc handler runs the scene hook before closing (behaviour)', async () => {
    // Loads the real framework file (with its two utility imports) and fires the keydown
    // handler it registers, so reordering or dropping the hook call in base-minigame.js fails here
    const dir = mkdtempSync(join(tmpdir(), 'minigame-esc-'));
    try {
        writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
        for (const rel of ['minigames/framework/base-minigame.js', 'utils/display-dashes.js', 'utils/escape-html.js']) {
            mkdirSync(dirname(join(dir, rel)), { recursive: true });
            writeFileSync(join(dir, rel), readFileSync(join(root, 'js', rel), 'utf8'));
        }
        const keydown = [];
        const savedDoc = globalThis.document, savedWin = globalThis.window;
        globalThis.document = { addEventListener: (t, f) => { if (t === 'keydown') keydown.push(f); }, removeEventListener() {}, getElementById: () => null };
        globalThis.window = globalThis;
        let MinigameScene;
        try {
            ({ MinigameScene } = await import(pathToFileURL(join(dir, 'minigames/framework/base-minigame.js')).href));
        } finally { globalThis.document = savedDoc; globalThis.window = savedWin; }

        const run = (hook, params = {}) => {
            keydown.length = 0;
            const calls = [];
            const scene = new MinigameScene({ querySelector: () => null, addEventListener() {} }, params);
            scene.closeByPlayer = () => calls.push('close');
            if (hook) scene.handleEscapeKey = (e) => { calls.push('hook'); return hook(e); };
            const sd = globalThis.document, sw = globalThis.window, log = console.log;
            globalThis.document = { addEventListener: (t, f) => { if (t === 'keydown') keydown.push(f); }, removeEventListener() {} };
            globalThis.window = globalThis;
            const warn = console.warn;
            console.log = () => {}; console.warn = () => {};
            try { scene.start(); } finally { console.log = log; console.warn = warn; globalThis.document = sd; globalThis.window = sw; }
            assert.equal(keydown.length, params.disableClose ? 0 : 1, 'start() registers one keydown handler');
            if (keydown.length) { keydown[0]({ key: 'Escape' }); keydown[0]({ key: 'a' }); }
            return calls;
        };
        assert.deepEqual(run(() => true), ['hook'], 'pop-up open: the hook runs and the scene stays');
        assert.deepEqual(run(() => false), ['hook', 'close'], 'no pop-up: the hook runs first, then the scene closes');
        assert.deepEqual(run(null), ['close'], 'no hook: the scene closes');
        assert.deepEqual(run(() => true, { disableClose: true }), [], 'disableClose registers no Esc handler');
    } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('review round 1: buttons the framework styles in GNF are declared GNF at their size, none under the font floors (M2, m5)', () => {
    // .minigame-container button { font-family: GNF } beats a single-class Press Start rule,
    // so these button rules declare what they render, and no phone rule shrinks them to 8px
    const fw = css('minigames-framework.css');
    assert.match(fw, /\.minigame-container button[^{]*\{\s*font-family: 'GNF'/);
    const backup = css('backup-recovery-minigame.css');
    assert.match(backup, /\.backup-recovery-confirm-btn \{[^}]*font-family: 'GNF'[^}]*font-size: 16px/);
    assert.doesNotMatch(backup.slice(backup.indexOf('@media (max-width: 860px)')), /\.backup-recovery-confirm-btn \{[^}]*font-size/);
    const siem = css('siem-dashboard-minigame.css');
    assert.match(siem, /\.siem-btn \{[^}]*font-family: 'GNF'[^}]*font-size: 16px/);
    assert.doesNotMatch(siem.slice(siem.indexOf('@media (max-width: 600px)')), /\.siem-btn \{[^}]*font-size/);
    assert.match(siem, /\.siem-source-count \{[^}]*font-size: 16px/);
    assert.match(css('infusion-pump-minigame.css'), /\.ip-more-below \{[^}]*font-family: 'GNF'[^}]*font-size: 16px/);
    assert.match(css('network-segmentation-map-minigame.css'), /\.nsm-device \{[^}]*font-size: 16px/);
    // GNF/VT323 text never under 16px, Press Start never under 8px in these sheets (button rules)
    for (const s of ['backup-recovery', 'siem-dashboard', 'infusion-pump', 'network-segmentation-map']) {
        for (const m of css(`${s}-minigame.css`).matchAll(/\{([^{}]*font-family:\s*'(GNF|VT323)'[^{}]*)\}/g)) {
            const size = /font-size:\s*(\d+)px/.exec(m[1]);
            if (size) assert.ok(+size[1] >= 16, `${s}: ${m[2]} at ${size[1]}px`);
        }
    }
});

test('review round 1: segmentation map keeps its panel in view (M1), SIS title wraps (m1), X bands (m3), graph scrollbar (m4)', () => {
    const nsm = css('network-segmentation-map-minigame.css');
    assert.match(nsm, /@media \(max-width: 1180px\) \{\s*\.nsm-body \{\s*flex-direction: column/, 'map and panel stack under 1180px (840px map + 320px panel)');
    assert.match(nsm, /\.nsm-topology-area \{\s*flex: 0 0 auto;\s*(\/\*[\s\S]*?\*\/\s*)?min-height: 480px/, 'stacked map tall enough for every device');
    assert.match(css('scada-historian-minigame.css'), /\.sh-charts \{ overflow-y: auto/);
    assert.match(css('sis-config-threshold-minigame.css'), /\.sis-modal h4 \{\s*overflow-wrap: anywhere/);
    assert.match(css('warranty-checklist-minigame.css'), /\.wcc-letterhead \{[^}]*min-height: 62px/);
    assert.match(css('sis-config-threshold-minigame.css'), /\.sis-threshold-header \{\s*margin-top: 28px/);
    assert.match(src(SCENES['blockchain-explorer']), /class="bce-graph-pane pixel-scroll"/);
    assert.match(css('claims-management-system-minigame.css'), /\.cms-nav-label \{[^}]*overflow-wrap: anywhere/);
});

test('review round 2: no button rule in the console sheets declares Press Start 2P while the framework GNF button rule overrides it (m4)', () => {
    // .minigame-container button (specificity 0,1,1) wins over a single-class rule, so a
    // declaration of Press Start 2P on a button class renders GNF and misleads the next edit
    const sheets = ['backup-recovery', 'blockchain-explorer', 'capture-log', 'claims-management-system', 'command-board',
        'coverage-decision-form', 'drug-library-integrity', 'ehr-terminal', 'esd-pushbutton', 'forensic-data-platform',
        'infusion-pump', 'log-filter', 'ncsc-brief', 'network-architecture', 'network-segmentation-map', 'network-view',
        'ransomware-display', 'scada-historian', 'siem-dashboard', 'sis-config-threshold', 'warranty-checklist']
        .map((n) => `${n}-minigame.css`).filter((f) => readdirSync(join(root, 'css')).includes(f));
    assert.ok(sheets.length >= 20, 'the console sheets are found');
    const offenders = [];
    for (const f of sheets) {
        for (const m of css(f).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
            if (!/Press Start 2P/.test(m[2]) || /!important/.test(m[2])) continue;
            for (const sel of m[1].split(',').map((x) => x.trim())) {
                if (!/(btn|button)[\w-]*(:[\w-]+)*$/.test(sel) || /\.(minigame-close-button|minigame-open-new-tab-button)/.test(sel)) continue;
                const ids = (sel.match(/#[\w-]+/g) || []).length;
                const classes = (sel.match(/\.[\w-]+|:[\w-]+/g) || []).length;
                const els = (sel.match(/(^|[\s>+~])[a-z][\w-]*/gi) || []).length;
                if (ids * 100 + classes * 10 + els <= 11) offenders.push(`${f}: ${sel}`);
            }
        }
    }
    assert.deepEqual(offenders, [], 'button rules declare Press Start 2P but render GNF');
});

test('review round 2: segmentation map labels are 16px VT323 and not bold, the scene scrolls as one column on a short window (m3, M1)', () => {
    const code = src('network-segmentation-map/network-segmentation-map-minigame.js');
    assert.doesNotMatch(code, /font-weight/, 'no bold VT323');
    for (const m of code.matchAll(/'font-size',\s*(?:'(\d+)'|(\w+))/g)) assert.ok(!m[1] || +m[1] >= 16, `SVG text at ${m[1]}px`);
    assert.match(code, /_svgRuleLabel\(svg, ns, x, y, text, fontSize = 16\)/);
    const nsm = css('network-segmentation-map-minigame.css');
    assert.match(nsm, /@media \(max-height: 500px\) \{\s*\.nsm-wrapper \{[^}]*overflow-y: auto[^}]*\}\s*\.nsm-body \{\s*flex: none/);
    assert.match(code, /class="nsm-wrapper pixel-scroll"/);
});
