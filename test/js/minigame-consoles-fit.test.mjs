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

test('review round 4: a second ANNOTATE press does not stack a second SCADA report, and one Cancel clears it (M1, m1)', async () => {
    assert.match(css('scada-historian-minigame.css'), /\.sh-modal-overlay \{[^}]*overscroll-behavior: contain/);
    const dir = mkdtempSync(join(tmpdir(), 'scada-annotate-'));
    try {
        writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
        for (const rel of ['minigames/framework/base-minigame.js', 'utils/display-dashes.js', 'utils/escape-html.js',
            'minigames/scada-historian/scada-historian-data.js', 'minigames/scada-historian/scada-historian-minigame.js']) {
            mkdirSync(dirname(join(dir, rel)), { recursive: true });
            writeFileSync(join(dir, rel), readFileSync(join(root, 'js', rel), 'utf8'));
        }
        const el = () => {
            const node = { children: [], style: {}, className: '', textContent: '', parent: null,
                appendChild(c) { c.parent = node; node.children.push(c); return c; },
                addEventListener() {},
                remove() { if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1); } };
            return node;
        };
        const charts = el();
        const savedDoc = globalThis.document, savedWin = globalThis.window;
        globalThis.document = { createElement: el, querySelector: (q) => (q === '.sh-charts' ? charts : null),
            addEventListener() {}, removeEventListener() {}, getElementById: () => null };
        globalThis.window = globalThis;
        try {
            const mod = await import(pathToFileURL(join(dir, 'minigames/scada-historian/scada-historian-minigame.js')).href);
            const Scene = Object.values(mod).find(v => typeof v === 'function' && v.prototype?._openAnnotateModal);
            assert.ok(Scene, 'the module exports the historian scene');
            const fake = Object.assign(Object.create(Scene.prototype), {
                _annotateOverlay: null, container: null, _cfg: { racks: [{ id: 'A1' }] }, _sd: {},
                _racksConfig: [{ id: 'A1', label: 'Rack A1' }], _focusRackId: 'A1', _anomalyFor: () => null,
            });
            fake._openAnnotateModal();
            fake._openAnnotateModal();
            assert.equal(charts.children.length, 1, 'double press: one report');
            fake._closeAnnotateModal();
            assert.equal(charts.children.length, 0, 'one Cancel clears it');
        } finally { globalThis.document = savedDoc; globalThis.window = savedWin; }
    } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('final proof: segmentation map labels let taps through to the rule lines under them', () => {
    assert.match(css('network-segmentation-map-minigame.css'), /\.nsm-svg text \{\s*pointer-events: none;/);
});
