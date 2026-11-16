// The pocket rogue AP's console (physical pentest devices plan 4.1 step 4, 4.4; section 7 JS list
// for A1): scan rows by textContent, the out-of-scope refusal, the globals each clone writes
// (re-clone, guest after staff, template switch), each template's preview and field labels, the
// chosen marks, the Log lines from globals with headshots, the result callback, X and Esc.
// Run with: node --max-old-space-size=2048 test/js/rogue-ap.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'rogue-ap-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, code) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), code); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));

copy('utils/display-dashes.js');
copy('utils/escape-html.js');
copy('utils/npc-headshot.js');
copy('utils/more-below.js');
copy('systems/global-writer.js');
copy('minigames/framework/base-minigame.js');
copy('minigames/landing-page-builder/landing-page-model.js');
copy('minigames/landing-page-builder/landing-page-render.js');
copy('minigames/rogue-ap/rogue-ap-model.js');
copy('minigames/rogue-ap/rogue-ap-minigame.js');
// A minimal framework: one minigame at a time, as capture-log.test.mjs's
put('minigames/framework/minigame-manager.js', `
export const MinigameFramework = {
    mainGameScene: {}, currentMinigame: null, registeredScenes: {}, ended: [],
    init() {},
    registerScene(type, Cls) { this.registeredScenes[type] = Cls; },
    startMinigame(type, _c, params = {}) {
        if (this.currentMinigame) this.endMinigame(false, null);
        const container = document.createElement('div');
        container.className = 'minigame-container';
        container.dataset.minigame = type;
        document.body.appendChild(container);
        const scene = new this.registeredScenes[type](container, params);
        this.currentMinigame = scene;
        scene.init();
        scene.start();
        return scene;
    },
    endMinigame(success, result) {
        const ending = this.currentMinigame;
        if (!ending) return;
        ending.cleanup();
        ending.container.remove();
        this.currentMinigame = null;
        this.ended.push({ success, result });
        ending.params?.onComplete?.(success, result);
    }
};`);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);

const url = (rel) => pathToFileURL(join(dir, rel)).href;
const { MinigameFramework: MF } = await import(url('minigames/framework/minigame-manager.js'));
const ap = await import(url('minigames/rogue-ap/rogue-ap-minigame.js'));
const model = await import(url('minigames/rogue-ap/rogue-ap-model.js'));
const headshots = await import(url('utils/npc-headshot.js'));

// ---- fixtures, in the shapes of the A1 minigame contract --------------------------------

const HOSTILE = '<img src=x onerror="window.__pwned=1">';
const page = (wording, fields, fieldLabels) => ({
    brands: [{ id: 'ledgerwell', name: 'Ledgerwell', domains: [{ id: 'd_wifi', domain: 'wifi-login.example' }] }],
    wordings: [{ id: 'w', text: wording }],
    fields,
    fieldLabels,
    choices: { brand: 'ledgerwell', domainId: 'd_wifi', wording: 'w', fields, logo: 'none', padlock: false }
});
const apPortal = {
    templates: [
        { id: 'key', label: 'Key page', setGlobals: { ap_portal_account: false },
          page: page('Ledgerwell-Staff: the router has been updated. Enter the Wi-Fi key to reconnect.', ['password'], { password: 'Wi-Fi key' }) },
        { id: 'signin', label: 'Sign-in page', setGlobals: { ap_portal_account: true },
          page: page('Ledgerwell-Staff: sign in with your Ledgerwell account to get back online.', ['email', 'password'], { email: 'Ledgerwell username' }) }
    ]
};
const apScan = [
    { ssid: 'Ledgerwell-Staff', security: 'WPA2', signal: 4, clients: 3, inScope: true,
      cloneGlobals: { ap_twin_staff: true, ap_twin_wrong: false },
      cloneLog: { key: 'Copy of Ledgerwell-Staff up (open), showing the Wi-Fi key page.', signin: 'Copy of Ledgerwell-Staff up (open), showing the staff sign-in page.' },
      knownClients: [{ npcId: 'kieran', label: "Kieran's laptop" }] },
    { ssid: 'Ledgerwell-Guest', security: 'WPA2', signal: 3, clients: 1, inScope: true,
      cloneGlobals: { ap_twin_wrong: true, ap_twin_staff: false },
      cloneLog: 'Copy of Ledgerwell-Guest up. Staff laptops hold the staff network, not this one.' },
    { ssid: 'BT-Hub-4F2A', security: 'WPA2', signal: 1, clients: 2, inScope: false, refusal: 'Out of scope. This hub is not the client.' },
    { ssid: 'Corrigan-Dental', security: 'WPA2', signal: 2, clients: 4, inScope: false, refusal: 'Out of scope. Corrigan Dental is not the client.' }
];
const apCaptureLog = [
    { global: 'kp_twin_captured', text: "Kieran's laptop joined the copy; Wi-Fi key page submitted.", npcId: 'kieran' },
    { global: 'kp_twin_account_captured', text: "Kieran's laptop joined the copy; staff sign-in page submitted.", npcId: 'kieran' }
];
const sprite = (over = {}) => ({ scenarioData: { id: 'planted_rogue_ap', name: 'Pocket rogue AP', apScan, apPortal, apCaptureLog, ...over } });

// An Image stand-in that "loads" a 32x32 headshot for kieran only
class FakeImage {
    set src(v) {
        this._src = v;
        queueMicrotask(() => {
            if (v.includes('kieran_doyle_headshot')) { this.naturalWidth = 32; this.naturalHeight = 32; this.onload?.(); }
            else this.onerror?.();
        });
    }
    get src() { return this._src; }
}

function dispatcher() {
    const handlers = new Map();
    return {
        log: [],
        on(name, fn) { if (!handlers.has(name)) handlers.set(name, []); handlers.get(name).push(fn); },
        off(name, fn) { const l = handlers.get(name) || []; const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); },
        emit(name, data) { this.log.push(name); for (const fn of [...(handlers.get(name) || [])]) fn(data); },
        count(name) { return (handlers.get(name) || []).length; }
    };
}

const BASE_GLOBALS = () => ({
    ap_planted: true, ap_twin_staff: false, ap_twin_wrong: false, ap_portal_account: false,
    kp_twin_captured: false, kp_twin_account_captured: false
});

function reset(globals = BASE_GLOBALS()) {
    while (MF.currentMinigame) MF.endMinigame(false, null);
    MF.ended.length = 0;
    document.body.innerHTML = '';
    window.gameState = { globalVariables: globals };
    window.eventDispatcher = dispatcher();
    window.MinigameFramework = MF;
    window.npcManager = { getNPC: (id) => (id === 'kieran' ? { id: 'kieran', spriteSheet: 'kieran_doyle' } : null) };
    delete window.__pwned;
    headshots.resetMissingHeadshots();
}
const open = (over, options = {}) => ap.startRogueApMinigame(sprite(over), { ImageCtor: FakeImage, ...options });
const settle = () => new Promise((r) => setTimeout(r, 0));
const G = () => window.gameState.globalVariables;
const q = (sel) => document.querySelector(sel);
const qa = (sel) => [...document.querySelectorAll(sel)];
const click = (node) => node.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const pick = (ssid, templateId) => {
    const scene = MF.currentMinigame;
    scene.showTab('clone');
    click(qa('.rogue-ap-ssid-pick').find((b) => b.dataset.ssid === ssid));
    if (templateId) click(qa('.rogue-ap-template').find((b) => b.dataset.template === templateId));
    click(q('.rogue-ap-start'));
};

// ---- registration and frame ------------------------------------------------------------

test('registers the scene and window.startRogueApMinigame (the registry contract)', () => {
    assert.equal(MF.registeredScenes['rogue-ap'], ap.RogueApMinigame);
    assert.equal(window.startRogueApMinigame, ap.startRogueApMinigame);
});

test('draws in the shared device frame with the title row, three tabs and no Cancel', () => {
    reset();
    const scene = open();
    const frame = q('.device-frame.rogue-ap');
    assert.ok(frame, 'the shared .device-frame');
    assert.equal(scene.closeAnchor(), frame, 'the X sits inside the device frame');
    assert.equal(frame.querySelector('.device-frame-title').textContent, 'Pocket rogue AP');
    assert.deepEqual(qa('.rogue-ap-tab').map((b) => b.textContent), ['Recon', 'Clone', 'Log']);
    assert.equal(q('#minigame-cancel'), null, 'X closes; no Cancel');
    assert.equal(ap.RogueApMinigame.closeInsideFrame, true);
});

// ---- Recon -----------------------------------------------------------------------------

test('Recon lists each authored network with security, signal and client count', () => {
    reset();
    open();
    const rows = qa('.rogue-ap-scan-row');
    assert.deepEqual(rows.map((r) => r.querySelector('.rogue-ap-ssid').textContent),
        ['Ledgerwell-Staff', 'Ledgerwell-Guest', 'BT-Hub-4F2A', 'Corrigan-Dental']);
    assert.equal(rows[0].querySelector('.rogue-ap-security').textContent, 'WPA2');
    assert.equal(rows[0].querySelector('.rogue-ap-clients').textContent, '3 clients');
    assert.equal(rows[0].querySelector('.rogue-ap-signal-word').textContent, 'Strong');
    assert.equal(rows[0].querySelector('.rogue-ap-signal-icon').getAttribute('src'), ap.WIFI_ICON, 'one look for Wi-Fi');
    assert.equal(rows[0].querySelector('.rogue-ap-known-label').textContent, "Kieran's laptop");
});

test("Recon shows Kieran's headshot on his client row", async () => {
    reset();
    open();
    const box = q('.rogue-ap-scan-row .rogue-ap-headshot');
    assert.equal(box.dataset.npcId, 'kieran');
    await settle(); await settle();
    assert.match(box.style.backgroundImage, /kieran_doyle_headshot\.png/);
    assert.equal(box.dataset.frame, 'headshot');
});

test('an NPC with no headshot file gets the pixel silhouette', async () => {
    reset();
    window.npcManager = { getNPC: () => ({ id: 'x', spriteSheet: 'nobody_here' }) };
    open({ apScan: [{ ssid: 'A', knownClients: [{ npcId: 'x', label: 'X laptop' }] }] });
    await settle(); await settle();
    const box = q('.rogue-ap-headshot');
    assert.ok(box.classList.contains('is-silhouette'));
    assert.match(box.style.backgroundImage, /pc-user-silhouette/);
});

// ---- Clone: globals ----------------------------------------------------------------------

test('a neighbour SSID is refused on either template and writes no global', () => {
    for (const templateId of ['key', 'signin']) {
        reset();
        const before = { ...G() };
        open();
        pick('Corrigan-Dental', templateId);
        assert.deepEqual(G(), before, 'nothing written');
        assert.equal(window.eventDispatcher.log.length, 0, 'no global events');
        const status = q('.rogue-ap-status');
        assert.equal(status.textContent, 'Out of scope. Corrigan Dental is not the client.');
        assert.ok(status.classList.contains('is-refused'));
    }
});

test('a staff clone on the key page sets ap_twin_staff, clears ap_twin_wrong, sets ap_portal_account false', () => {
    reset({ ...BASE_GLOBALS(), ap_twin_wrong: true });
    open();
    pick('Ledgerwell-Staff', 'key');
    assert.equal(G().ap_twin_staff, true);
    assert.equal(G().ap_twin_wrong, false);
    assert.equal(G().ap_portal_account, false);
    assert.equal(q('.rogue-ap-status').textContent, 'Copy of Ledgerwell-Staff up (open), showing the Wi-Fi key page.');
});

test('a staff clone on the sign-in page sets ap_portal_account true', () => {
    reset();
    open();
    pick('Ledgerwell-Staff', 'signin');
    assert.equal(G().ap_twin_staff, true);
    assert.equal(G().ap_portal_account, true);
    assert.ok(window.eventDispatcher.log.includes('global_variable_changed:ap_portal_account'));
});

test('a guest clone after a staff clone stops the staff clone', () => {
    reset();
    open();
    pick('Ledgerwell-Staff', 'key');
    pick('Ledgerwell-Guest', 'key');
    assert.equal(G().ap_twin_staff, false);
    assert.equal(G().ap_twin_wrong, true);
});

test('a re-clone of the same SSID switches the template; the last clone wins', () => {
    reset();
    open();
    pick('Ledgerwell-Staff', 'key');
    assert.equal(G().ap_portal_account, false);
    pick('Ledgerwell-Staff', 'signin');
    assert.equal(G().ap_portal_account, true);
    assert.equal(G().ap_twin_staff, true);
    pick('Ledgerwell-Staff', 'key');
    assert.equal(G().ap_portal_account, false);
});

test('a refused SSID after a sign-in clone leaves the template global as it was', () => {
    reset();
    open();
    pick('Ledgerwell-Staff', 'signin');
    pick('BT-Hub-4F2A', 'key');
    assert.equal(G().ap_portal_account, true, 'the refusal touched no template global');
    assert.equal(G().ap_twin_staff, true);
});

// ---- Clone: preview and marks ------------------------------------------------------------

test('each template preview holds no form controls and shows its own field labels', () => {
    reset();
    open();
    MF.currentMinigame.showTab('clone');
    click(qa('.rogue-ap-template').find((b) => b.dataset.template === 'key'));
    let preview = q('.rogue-ap-preview');
    assert.equal(preview.querySelectorAll('input, select, textarea, form').length, 0);
    assert.deepEqual([...preview.querySelectorAll('.lpb-field-label')].map((n) => n.textContent), ['Wi-Fi key']);
    assert.match(preview.textContent, /Enter the Wi-Fi key to reconnect/);
    assert.match(preview.textContent, /wifi-login\.example/);

    click(qa('.rogue-ap-template').find((b) => b.dataset.template === 'signin'));
    preview = q('.rogue-ap-preview');
    assert.equal(preview.querySelectorAll('input, select, textarea, form').length, 0);
    assert.deepEqual([...preview.querySelectorAll('.lpb-field-label')].map((n) => n.textContent), ['Ledgerwell username', 'Password']);
});

test('the chosen template and SSID are marked by class and the word Chosen', () => {
    reset();
    open();
    MF.currentMinigame.showTab('clone');
    click(qa('.rogue-ap-template').find((b) => b.dataset.template === 'signin'));
    const [key, signin] = qa('.rogue-ap-template');
    assert.ok(signin.classList.contains('is-chosen'));
    assert.equal(signin.getAttribute('aria-pressed'), 'true');
    assert.equal(signin.querySelector('.rogue-ap-chosen').textContent, ap.CHOSEN_TEXT);
    assert.ok(!key.classList.contains('is-chosen'));
    assert.equal(key.querySelector('.rogue-ap-chosen'), null);
    assert.equal(qa('.rogue-ap-ssid-pick .rogue-ap-chosen').length, 1);
});

test('on reopen the running clone and its template are the ones marked Chosen', () => {
    reset({ ...BASE_GLOBALS(), ap_twin_staff: true, ap_portal_account: true });
    open({}, {});
    MF.currentMinigame.showTab('clone');
    assert.equal(q('.rogue-ap-template.is-chosen').dataset.template, 'signin');
    assert.equal(q('.rogue-ap-ssid-pick.is-chosen').dataset.ssid, 'Ledgerwell-Staff');
});

// ---- Log ---------------------------------------------------------------------------------

test('the Log is empty before any clone, then shows the clone line', () => {
    reset();
    open();
    MF.currentMinigame.showTab('log');
    assert.equal(q('.rogue-ap-empty').textContent, ap.EMPTY_LOG_TEXT);
    pick('Ledgerwell-Staff', 'signin');
    MF.currentMinigame.showTab('log');
    assert.deepEqual(qa('.rogue-ap-log-text').map((n) => n.textContent), ['Copy of Ledgerwell-Staff up (open), showing the staff sign-in page.']);
});

test('each apCaptureLog line shows only once its global is true, with the headshot', async () => {
    reset({ ...BASE_GLOBALS(), ap_twin_staff: true });
    open();
    MF.currentMinigame.showTab('log');
    assert.equal(qa('.rogue-ap-log-capture').length, 0);
    G().kp_twin_captured = true;
    window.eventDispatcher.emit('global_variable_changed:kp_twin_captured', { value: true });
    assert.deepEqual(qa('.rogue-ap-log-capture .rogue-ap-log-text').map((n) => n.textContent), [apCaptureLog[0].text]);
    G().kp_twin_account_captured = true;
    window.eventDispatcher.emit('global_variable_changed:kp_twin_account_captured', { value: true });
    const lines = qa('.rogue-ap-log-capture');
    assert.deepEqual(lines.map((n) => n.dataset.global), ['kp_twin_captured', 'kp_twin_account_captured']);
    await settle(); await settle();
    for (const line of lines) {
        const box = line.querySelector('.rogue-ap-headshot');
        assert.equal(box.dataset.npcId, 'kieran');
        assert.match(box.style.backgroundImage, /kieran_doyle_headshot\.png/);
    }
});

test('closing drops the global listeners', () => {
    reset();
    open();
    assert.equal(window.eventDispatcher.count('global_variable_changed:kp_twin_captured'), 1);
    MF.currentMinigame.closeByPlayer();
    assert.equal(window.eventDispatcher.count('global_variable_changed:kp_twin_captured'), 0);
});

// ---- result callback, X and Esc ------------------------------------------------------------

test('X with nothing cloned reports onComplete(false, { closed: true })', () => {
    reset();
    const seen = [];
    open({}, { onComplete: (s, r) => seen.push([s, r]) });
    click(q('#minigame-close'));
    assert.equal(MF.currentMinigame, null);
    assert.deepEqual(seen, [[false, { closed: true }]]);
});

test('a refusal alone does not count as a clone', () => {
    reset();
    const seen = [];
    open({}, { onComplete: (s, r) => seen.push([s, r]) });
    pick('Corrigan-Dental', 'key');
    click(q('#minigame-close'));
    assert.deepEqual(seen, [[false, { closed: true }]]);
});

test('Esc after clones reports the last clone: onComplete(true, { ssid, templateId })', () => {
    reset();
    const seen = [];
    open({}, { onComplete: (s, r) => seen.push([s, r]) });
    pick('Ledgerwell-Staff', 'key');
    pick('Ledgerwell-Staff', 'signin');
    pick('BT-Hub-4F2A', 'key');
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
    assert.equal(MF.currentMinigame, null);
    assert.deepEqual(seen, [[true, { ssid: 'Ledgerwell-Staff', templateId: 'signin' }]]);
});

// ---- escaping ----------------------------------------------------------------------------

test('authored strings are text, never markup', () => {
    reset({ ...BASE_GLOBALS(), hx: true, ap_twin_staff: false });
    const evil = {
        name: HOSTILE,
        apScan: [
            { ssid: HOSTILE, security: HOSTILE, signal: HOSTILE, inScope: false, refusal: HOSTILE,
              knownClients: [{ npcId: 'kieran', label: HOSTILE }] },
            { ssid: 'ok', cloneGlobals: { hx: true }, cloneLog: HOSTILE }
        ],
        apPortal: { templates: [{ id: 't', label: HOSTILE, setGlobals: {}, page: page(HOSTILE, ['email'], { email: HOSTILE }) }] },
        apCaptureLog: [{ global: 'hx', text: HOSTILE, npcId: 'kieran' }]
    };
    open(evil);
    const scene = MF.currentMinigame;
    assert.equal(q('.device-frame-title').textContent, HOSTILE);
    assert.equal(q('.rogue-ap-ssid').textContent, HOSTILE);
    assert.equal(q('.rogue-ap-known-label').textContent, HOSTILE);
    pick(HOSTILE, 't');
    assert.equal(q('.rogue-ap-status').textContent, HOSTILE);
    assert.equal(q('.rogue-ap-template-label').textContent, HOSTILE);
    scene.showTab('log');
    assert.deepEqual(qa('.rogue-ap-log-text').map((n) => n.textContent), [HOSTILE, HOSTILE]);
    assert.equal(document.querySelectorAll('img[src="x"]').length, 0, 'no injected element');
    assert.equal(window.__pwned, undefined);
});

// ---- the model ---------------------------------------------------------------------------

test('model: cloneEffects orders row globals before template globals; refusal writes none', () => {
    const rows = model.scanRows(apScan);
    const templates = model.portalTemplates(apPortal);
    assert.deepEqual(model.cloneEffects(rows[0], templates[1]).writes,
        [['ap_twin_staff', true], ['ap_twin_wrong', false], ['ap_portal_account', true]]);
    assert.deepEqual(model.cloneEffects(rows[3], templates[1]), { refused: true, refusal: 'Out of scope. Corrigan Dental is not the client.', writes: [] });
});

test('model: cloneLog as a string or keyed by template id; signal words; client counts', () => {
    const rows = model.scanRows(apScan);
    const [key, signin] = model.portalTemplates(apPortal);
    assert.match(model.cloneLogText(rows[0], signin), /sign-in page/);
    assert.match(model.cloneLogText(rows[0], key), /Wi-Fi key page/);
    assert.match(model.cloneLogText(rows[1], key), /Ledgerwell-Guest/);
    assert.deepEqual([0, 1, 2, 3, 4].map(model.signalWord), ['Weak', 'Weak', 'Fair', 'Strong', 'Strong']);
    assert.equal(model.signalWord(undefined), '');
    assert.equal(model.clientsText(1), '1 client');
    assert.equal(model.clientsText(null), '');
});

// ---- scroll and whole-step sizes (review R1 M1, M2, t5) ------------------------------------

test('a same-tab redraw keeps the pane scroll, and Start brings the status line into view', () => {
    reset();
    const scene = open();
    scene.showTab('clone');
    let scrolledTo = null;
    const hadStub = Object.prototype.hasOwnProperty.call(window.HTMLElement.prototype, 'scrollIntoView');
    const priorStub = window.HTMLElement.prototype.scrollIntoView;
    try {
        window.HTMLElement.prototype.scrollIntoView = function (arg) { scrolledTo = { node: this, arg }; };
        scene.pane.scrollTop = 120;
        click(qa('.rogue-ap-ssid-pick').find((b) => b.dataset.ssid === 'Ledgerwell-Staff'));
        assert.equal(scene.pane.scrollTop, 120, 'choosing a network does not jump to the top');
        click(q('.rogue-ap-start'));
        assert.equal(scene.pane.scrollTop, 120, 'Start does not jump to the top');
        assert.ok(scrolledTo && scrolledTo.node.classList.contains('rogue-ap-status'), 'the status line is scrolled into view');
        assert.equal(scrolledTo.arg.block, 'nearest');
        scene.showTab('log');
        assert.equal(scene.pane.scrollTop, 0, 'a tab change starts at the top');
    } finally {
        if (hadStub) window.HTMLElement.prototype.scrollIntoView = priorStub;
        else delete window.HTMLElement.prototype.scrollIntoView;
    }
});

test('the Wi-Fi icon is drawn at whole multiples of 11x8 and headshots at multiples of 32', () => {
    const css = readFileSync(join(here, '../../public/break_escape/css/rogue-ap.css'), 'utf8');
    const rules = [];
    const re = /(@media[^{]*\{)?\s*([^{}@]+)\{([^}]*)\}/g;
    for (const m of css.matchAll(re)) rules.push({ sel: m[2].trim(), body: m[3] });
    const sizes = (sel) => rules.filter((r) => r.sel.includes(sel)).map((r) => ({
        w: (r.body.match(/(?:^|[\s;])width:\s*(\d+)px/) || [])[1],
        h: (r.body.match(/(?:^|[\s;])height:\s*(\d+)px/) || [])[1]
    })).filter((s) => s.w);
    const icons = sizes('.rogue-ap-signal-icon');
    assert.ok(icons.length >= 2, 'a size at each breakpoint');
    for (const s of icons) {
        const k = Number(s.w) / 11;
        assert.ok(Number.isInteger(k) && k >= 1, `icon width ${s.w} is a whole multiple of 11`);
        assert.equal(Number(s.h), k * 8, `icon height ${s.h} keeps the 11:8 aspect`);
    }
    assert.deepEqual(icons.map((s) => `${s.w}x${s.h}`).sort(), ['11x8', '22x16']);
    const heads = sizes('.rogue-ap-headshot');
    assert.ok(heads.length >= 1);
    for (const s of heads) {
        assert.equal(Number(s.w) % 32, 0, `headshot ${s.w} is a multiple of 32`);
        assert.equal(s.h, s.w);
    }
    assert.ok(!/border-left:\s*4px/.test(css), 'status rule is 2px');
});
