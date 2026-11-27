// sis01 blind playtest UI minors (sweep 8): m7 and m15 confirm dialogs carry the X and the one
// affirmative button, no Cancel beside them; m8 the log-filter count says what the filter does;
// m18 a "-- HEADING --" credits line splits into decoration and words; m2 SIEM badge contrast.
// Run with: node --max-old-space-size=2048 test/js/sis01-ui-minors.test.mjs
// SIS_JS_ROOT points at a copy of the engine (used to show the tests fail on old code).
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const root = process.env.SIS_JS_ROOT ? join(process.env.SIS_JS_ROOT, '..') : join(here, '../../public/break_escape');
const js = join(root, 'js');
const css = (f) => readFileSync(join(root, 'css', f), 'utf8');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true, url: 'https://game.example/break_escape/games/1' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

// ---- m15: the SEVER confirm -------------------------------------------------------------
const { NetworkSegmentationMapMinigame } = await import(
    pathToFileURL(join(js, 'minigames/network-segmentation-map/network-segmentation-map-minigame.js')).href);

function nsm() {
    window.gameState = { globalVariables: { network_isolated: false } };
    window.eventDispatcher = { emit: () => {} };
    window.npcManager = undefined;
    window.playUISound = undefined;
    document.body.innerHTML = '<div id="mg"></div>';
    const mg = new NetworkSegmentationMapMinigame(document.getElementById('mg'), {
        title: 'MAP', severButtonLabel: 'SEVER LINK', severVar: 'network_isolated',
        auth: { itsecVar: 'a', clinicalVar: 'b', resultVar: 'c' },
        zones: [{ slot: 'external', label: 'E', devices: [] }, { slot: 'enterprise', label: 'N', devices: [] },
            { slot: 'clinical', label: 'C', devices: [] }, { slot: 'legacy', label: 'L', devices: [] }],
        rules: [{ id: 'r1', label: 'R1', title: 'Rule 1', connectionType: 'direct', fromSlot: 'enterprise', toSlot: 'clinical', consequences: [] }],
        severConsequences: []
    });
    window.MinigameFramework = { currentMinigame: mg, endMinigame: () => {} };
    mg.init();
    mg.start();
    return mg;
}

test('m15: the SEVER confirm has an X and one YES button, no NO - CANCEL', () => {
    const mg = nsm();
    mg._toggleRule('r1');
    document.querySelector('#nsm-sever-btn').click();
    const buttons = [...document.querySelectorAll('.nsm-modal-actions button')].map((b) => b.textContent.trim());
    assert.ok(buttons.length === 1, 'one action button, got ' + buttons.length);
    assert.ok(/YES/.test(buttons[0]), 'it is the affirmative one');
    assert.ok(!/CANCEL/i.test(document.querySelector('.nsm-modal').textContent), 'no CANCEL text in the dialog');
    const x = document.querySelector('.nsm-modal .minigame-close-button');
    assert.ok(x !== null, 'the dialog has its own X');
    x.click();
    assert.ok(!document.querySelector('#nsm-modal-overlay').classList.contains('nsm-modal-visible'), 'the X closes the confirm');
});

test('m15: the confirm X is the shared X look (no one-off box) with the shared 44px hit area', () => {
    const c = css('network-segmentation-map-minigame.css');
    assert.ok(/\.nsm-modal \{[^}]*position: relative/.test(c), 'modal anchors the X');
    assert.ok(/\.nsm-modal-close \{[^}]*top: \d+px/.test(c), 'X placed at the top right');
    assert.ok(!/\.nsm-modal-no\b/.test(c), 'no dead NO button style');
    const rule = c.slice(c.indexOf('.nsm-modal-close {'), c.indexOf('}', c.indexOf('.nsm-modal-close {')));
    assert.ok(!/width|height|box-sizing|border|background/.test(rule), 'no one-off drawn size or look: ' + rule);
    assert.ok(!/\.nsm-modal-close::after/.test(c), 'the hit area is the shared ::after, not overridden');
    const shared = css('minigames-framework.css');
    assert.ok(/\.minigame-close-button::after \{[^}]*inset: -14px/.test(shared), 'the shared X gives a 44px hit area');
    const x = document.createElement('div');
    x.innerHTML = '<button class="minigame-close-button nsm-modal-close"></button>';
    assert.ok(x.firstChild.classList.contains('minigame-close-button'), 'drawn as the shared close button');
    assert.ok(!/radius/.test(c.slice(c.indexOf('.nsm-modal {'), c.indexOf('.nsm-modal-icon'))), 'no radius');
    const title = c.slice(c.indexOf('.nsm-modal-title {'), c.indexOf('}', c.indexOf('.nsm-modal-title {')));
    assert.ok(/padding: 0 (5[2-9]|[6-9]\d)px/.test(title), 'the title clears the X and its 44px hit area');
});

// ---- m7: the VPN log flag confirm -------------------------------------------------------
const base = dataUrl('export class MinigameScene { constructor(c, p) { this.container = c; this.params = p; } start() {} cleanup() {} complete() {} }');
let src = readFileSync(join(js, 'minigames/log-filter/log-filter-minigame.js'), 'utf8');
src = src.split(`'../framework/base-minigame.js'`).join(`'${base}'`)
    .split(`'../../utils/display-dashes.js'`).join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split(`'../../utils/scroll-cue.js'`).join(`'${dataUrl('export const attachScrollCue = () => ({ update() {}, destroy() {}, cue: null });')}'`);
const lf = await import(dataUrl(src));
const { LogFilterMinigame } = lf;

function lfOverlay(mode) {
    window.gameState = { globalVariables: {}, notes: [] };
    window.npcManager = { setGlobalVariable: () => {} };
    const host = document.createElement('div');
    document.body.innerHTML = '';
    document.body.appendChild(host);
    const m = new LogFilterMinigame(host, { sprite: { scenarioData: { minigameData: {
        logType: 'vpn', entryCount: 10, flagConfirmBody: 'Flag it?',
        anomaly: { user: 'm.blake', ip: '185.220.101.47', country: 'RO', mfa: 'NO', result: 'ACCEPT', timestamp: '2025-11-03 08:52', position: 5 }
    } } } });
    m.container = host;
    const body = document.createElement('div');
    host.appendChild(body);
    m._dom = { body };
    m._selectedEntry = {};
    m._overlayMode = mode;
    m._renderOverlay();
    return { m, body };
}

test('m7: the flag confirm has the X and one affirmative button, no [CANCEL]', () => {
    const { body } = lfOverlay('flag_confirm');
    const labels = [...body.querySelectorAll('button')].map((b) => b.textContent.trim());
    assert.ok(body.querySelector('.minigame-close-button') !== null, 'the pop-up has an X');
    assert.ok(labels.filter((t) => t !== '×').length === 1, 'one text button, got ' + JSON.stringify(labels));
    assert.ok(/CONFIRM/.test(labels.find((t) => t !== '×')), 'it is the confirm');
    assert.ok(!/CANCEL/i.test(body.textContent), 'no CANCEL text');
});

test('m7: the X on the flag confirm closes it without flagging', () => {
    const { m, body } = lfOverlay('flag_confirm');
    body.querySelector('.minigame-close-button').click();
    assert.ok(body.querySelector('.lf-overlay') === null, 'overlay gone');
    assert.ok(m._sessionFlagged !== true, 'nothing flagged');
});

test('m7: the not-this-one pop-up has the X and no BACK TO LOG twin', () => {
    const { body } = lfOverlay('flag_rejected');
    assert.ok(body.querySelector('.minigame-close-button') !== null, 'X present');
    assert.ok(body.querySelectorAll('button').length === 1, 'the X is the only button');
});

test('m1: the header X drops the shared top/right offsets so it sits in the header band', () => {
    const c = css('log-filter-minigame.css');
    const at = c.indexOf('.lf-overlay-header .lf-overlay-close {');
    const rule = c.slice(at, c.indexOf('}', at));
    assert.ok(at > 0, 'rule present');
    assert.ok(/top: auto/.test(rule) && /right: auto/.test(rule), 'top and right reset: ' + rule);
});

// ---- m8: the count --------------------------------------------------------------------
test('m8: the status count says matches and dimmed, with the singular', () => {
    const f = lf.logFilterCountText;
    assert.ok(typeof f === 'function', 'logFilterCountText exported');
    assert.ok(f(1, 20) === 'RESULTS: 1 match, 19 dimmed', f(1, 20));
    assert.ok(f(3, 20) === 'RESULTS: 3 matches, 17 dimmed', f(3, 20));
    assert.ok(f(0, 20) === 'RESULTS: 0 matches, 20 dimmed', f(0, 20));
    assert.ok(f(20, 20) === 'RESULTS: 20 entries', f(20, 20));
    assert.ok(f(1, 1) === 'RESULTS: 1 entry', f(1, 1));
    assert.ok(!/visible/.test(f(1, 20)), 'never claims rows are visible when the rest are only dimmed');
});

// ---- m18: credits section heading ----------------------------------------------------
const ct = await import(pathToFileURL(join(js, 'music/credits-theme.js')).href);
test('m18: a dash-wrapped heading splits into decoration and words', () => {
    const f = ct.splitSectionHeader;
    assert.ok(typeof f === 'function', 'splitSectionHeader exported');
    const p = f('── CLINICAL OUTCOMES ──');
    assert.ok(p !== null && p.title === 'CLINICAL OUTCOMES', 'title is the words only');
    assert.ok(p.lead === '──' && p.trail === '──', 'dash runs kept as decoration');
    assert.ok(f('NHS ENGLAND') === null, 'a plain heading is left alone');
    assert.ok(f('-- A --') !== null && f('-- A --').title === 'A', 'ASCII dashes too');
});

test('m18: the credits draw the decoration as a span that drops on a narrow window', () => {
    const c = css('bond-visualiser.css');
    assert.ok(/\.bv-cr-deco \{ white-space: nowrap; \}/.test(c), 'decoration never wraps by itself');
    assert.ok(/@media \(max-width: 600px\) \{\s*\.bv-cr-deco \{ display: none; \}/.test(c), 'dropped at 600px and under');
    const j = readFileSync(join(js, 'music/bond-visualiser.js'), 'utf8');
    assert.ok(/splitSectionHeader\(item\.text\)/.test(j), 'the credits label uses the split');
});

// ---- m2: SIEM badge contrast ---------------------------------------------------------
function lum(hex) {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

test('m2: every SIEM severity badge text meets 4.5:1, and the flash never fades the text', () => {
    const c = css('siem-dashboard-minigame.css');
    for (const sel of ['.siem-severity', '.siem-queue-sev']) {
        for (const sev of ['LOW', 'MED', 'HIGH', 'CRIT']) {
            const i = c.indexOf(`${sel}.sev-${sev} {`);
            assert.ok(i >= 0, `${sel}.sev-${sev} exists`);
            const rule = c.slice(i, c.indexOf('}', i));
            const bg = rule.match(/background: (#[0-9a-f]{6})/)[1];
            const own = rule.match(/\n\s*color: (#[0-9a-f]{6})/);
            const fg = own ? own[1] : '#ffffff';   // the base rule sets white
            const r = ratio(fg, bg);
            assert.ok(r >= 4.5, `${sel}.sev-${sev} ${fg} on ${bg} is ${r.toFixed(2)}:1`);
        }
    }
    const k = c.slice(c.indexOf('@keyframes siem-crit-flash'), c.indexOf('}', c.indexOf('@keyframes siem-crit-flash') + 120));
    assert.ok(!/opacity/.test(k.replace(/\/\*[\s\S]*?\*\//g, '')), 'the CRIT flash does not animate opacity');
});

// ---- m2: the SIEM triage result banner ---------------------------------------------------
let siemSrc = readFileSync(join(js, 'minigames/siem/siem-dashboard-minigame.js'), 'utf8');
siemSrc = siemSrc.split(`'../framework/base-minigame.js'`).join(`'${base}'`)
    .split(`'../../utils/display-dashes.js'`).join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split(`'../../systems/game-clock.js'`).join(`'${dataUrl('export const currentClockText = () => "00:00:00";')}'`);
const siem = await import(dataUrl(siemSrc));

test('m2: the triage banner counts what was escalated, dismissed and left', () => {
    const alerts = [
        { critical: true, status: 'escalated' }, { critical: true, status: 'escalated' },
        { critical: false, status: 'dismissed' }, { critical: false, status: 'dismissed' }, { critical: false, status: 'dismissed' },
        { critical: false, status: 'pending' }
    ];
    assert.ok(siem.siemResultCounts(alerts) === '2 of 2 critical alerts escalated. 3 dismissed, 1 not triaged.', siem.siemResultCounts(alerts));
    assert.ok(siem.siemResultCounts([{ critical: true, status: 'pending' }]) === '0 of 1 critical alert escalated. 0 dismissed, 1 not triaged.', 'singular');
    assert.ok(typeof siem.siemResultCounts(null) === 'string', 'tolerates no alerts');
    const withBenign = [{ critical: true, status: 'escalated' }, { critical: false, status: 'escalated' },
        { critical: false, status: 'escalated' }, { critical: false, status: 'dismissed' }];
    assert.ok(siem.siemResultCounts(withBenign) === '1 of 1 critical alert escalated. 2 other escalated. 1 dismissed, 0 not triaged.', siem.siemResultCounts(withBenign));
});

// ---- m2 (round 1): an early close during the hold completes as success ------------------
const realBaseSrc = readFileSync(join(js, 'minigames/framework/base-minigame.js'), 'utf8')
    .split(`'../../utils/display-dashes.js'`).join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split(`'../../utils/escape-html.js'`).join(`'${dataUrl('export const escapeHtml = (s) => String(s);')}'`);
const siemReal = await import(dataUrl(siemSrc.split(`'${base}'`).join(`'${dataUrl(realBaseSrc)}'`)));

function siemHeld(allEscalated) {
    const m = new siemReal.SiemDashboardMinigame(null, {});
    m.alerts = [{ id: 'a', critical: true, status: allEscalated ? 'escalated' : 'pending' }];
    m.setScenarioGlobal = () => {};
    m.showResultBanner = () => {};
    m.clearState = () => {};
    m.renderAll = () => {};
    m.persistState = () => {};
    const events = [];
    const ended = [];
    const done = [];
    window.eventDispatcher = { emit: (n) => events.push(n) };
    window.MinigameFramework = { currentMinigame: m, endMinigame: (ok) => ended.push(ok) };
    m.params = { ...m.params, onComplete: (ok) => done.push(ok) };
    return { m, events, ended, done };
}

test('m2: the X pressed during the 2 s hold after a successful triage completes as success, once', () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
        const { m, events, ended } = siemHeld(true);
        m.finalizeOutcome();
        mock.timers.tick(500);
        m.closeByPlayer();
        assert.ok(events.includes('minigame_completed'), 'minigame_completed emitted: ' + events.join());
        assert.ok(!events.includes('minigame_failed'), 'not reported as failed');
        assert.ok(ended.length === 1 && ended[0] === true, 'ended once, as success: ' + ended.join());
        m.cleanup();
        assert.ok(m._holdTimerId === null, 'cleanup cleared the hold timer');
        mock.timers.tick(2500);
        assert.ok(ended.length === 1, 'the hold timer did not complete it a second time: ' + ended.length);
    } finally { mock.timers.reset(); }
});

test('m2: a failed triage closed early stays a failure', () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
        const { m, events, ended } = siemHeld(false);
        m.finalizeOutcome();
        m.closeByPlayer();
        assert.ok(events.includes('minigame_failed') && ended[0] === false, 'failure kept: ' + events.join());
        m.cleanup();
    } finally { mock.timers.reset(); }
});

test('m2: the scene stays open about 2 s behind the banner, and the banner is headline plus counts via textContent', async () => {
    assert.ok(siem.SIEM_RESULT_HOLD_MS >= 2000 && siem.SIEM_RESULT_HOLD_MS <= 2500, 'hold ' + siem.SIEM_RESULT_HOLD_MS);
    assert.ok(/\}, SIEM_RESULT_HOLD_MS\);/.test(siemSrc), 'finalizeOutcome closes on that hold');
    document.body.innerHTML = '<div id="b"></div>';
    const fake = { resultBannerEl: document.getElementById('b') };
    siem.SiemDashboardMinigame.prototype.showResultBanner.call(fake, 'INCIDENT TEAM NOTIFIED', true, '2 of 2 critical alerts escalated. 0 dismissed, 0 not triaged.');
    const head = fake.resultBannerEl.querySelector('.siem-result-head');
    const counts = fake.resultBannerEl.querySelector('.siem-result-counts');
    assert.ok(head && head.textContent === 'INCIDENT TEAM NOTIFIED', 'headline');
    assert.ok(counts && /2 of 2 critical alerts escalated/.test(counts.textContent), 'counts line');
    assert.ok(fake.resultBannerEl.classList.contains('success'), 'success class');
    await new Promise((r) => setTimeout(r, 10));
    assert.ok(fake.resultBannerEl.classList.contains('show'), 'shown');
    const hostile = { resultBannerEl: document.getElementById('b') };
    siem.SiemDashboardMinigame.prototype.showResultBanner.call(hostile, '<img src=x>', false, '<b>x</b>');
    assert.ok(hostile.resultBannerEl.querySelector('img') === null && hostile.resultBannerEl.querySelector('b') === null, 'text, not markup');
});

test('m2: the banner CSS wraps (auto height, no nowrap or ellipsis), is centred, no radius or blur', () => {
    const c = css('siem-dashboard-minigame.css');
    const rule = c.slice(c.indexOf('.siem-result-banner {'), c.indexOf('}', c.indexOf('.siem-result-banner {')));
    assert.ok(/height: auto/.test(rule), 'auto height');
    assert.ok(/white-space: normal/.test(rule) && !/nowrap|ellipsis/.test(rule), 'wraps');
    assert.ok(/line-height: 24px/.test(rule), 'whole-pixel line box');
    assert.ok(/font-size: 16px/.test(rule), 'Press Start 2P at 16');
    assert.ok(/padding: 16px;/.test(rule), 'symmetric padding: the headline is centred (the banner sits below the X)');
    const counts = c.slice(c.indexOf('.siem-result-counts {'), c.indexOf('}', c.indexOf('.siem-result-counts {')));
    assert.ok(/'GNF'/.test(counts) && /font-size: 16px/.test(counts), 'counts in GNF 16');
    assert.ok(!/radius|blur|gradient/.test(rule + counts), 'no radius, blur or gradient');
    assert.ok(/transform: translateY\(-100%\)/.test(rule), 'starts one banner height above the panel, whatever the wrap');
    assert.ok(/\.siem-result-banner\.show \{[^}]*translateY\(0\)/.test(c), 'show slides it in');
});
