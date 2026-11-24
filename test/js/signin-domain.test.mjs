// Ops S5c unit 25: the sign-in screen names the PC's domain ("Domain: northwind") when the PC
// has one, and shows nothing when it has none. The domain is author text: a hostile value is
// drawn as text, never as markup. The real unlock-system.js (browser-only imports stubbed) hands
// the PC's domain to the real password minigame.
// Run with: node test/js/signin-domain.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const css = readFileSync(join(here, '../../public/break_escape/css/password-minigame.css'), 'utf8');
const dir = mkdtempSync(join(tmpdir(), 'signin-domain-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('config.js', 'export const ASSETS_PATH = "/break_escape/assets";\n');
put('utils/helpers.js', 'export function makeDraggable() {}\n');
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
for (const f of ['utils/escape-html.js', 'utils/lock-scope-refusal.js', 'utils/dispense-on-unlock.js',
    'minigames/container/container-item-image.js', 'utils/computer-keywords.js', 'utils/pc-monitor.js',
    'utils/npc-headshot.js', 'utils/author-html.js', 'minigames/framework/base-minigame.js',
    'utils/remote-host-text.js', 'minigames/password/password-minigame.js']) copy(f);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const { PasswordMinigame } = await import(pathToFileURL(join(dir, 'minigames/password/password-minigame.js')));

const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const stubs = {
    '../utils/constants.js': dataUrl('export const DOOR_ALIGN_OVERLAP = 64;'),
    '../core/rooms.js': dataUrl('export const rooms = {};'),
    './doors.js': dataUrl('export function unlockDoor() {}'),
    './minigame-starters.js': dataUrl('export function startLockpickingMinigame() {} export function startKeySelectionMinigame() {} export function startPinMinigame() {} export function startPasswordMinigame() {} export function startRansomwareDisplayMinigame() {} export function startBackupRecoveryMinigame() {} export function startInfusionPumpMinigame() {}'),
    './ui-sounds.js': dataUrl('export function playUISound() {}'),
    '../utils/locked-hint.js': dataUrl(readFileSync(join(js, 'utils/locked-hint.js'), 'utf8')),
    '../utils/remote-host-text.js': dataUrl(readFileSync(join(js, 'utils/remote-host-text.js'), 'utf8')),
    '../minigames/biometrics/fingerprint-reader-minigame.js': dataUrl('export function startFingerprintReader() {}'),
    '../utils/lock-scope-refusal.js': dataUrl(readFileSync(join(js, 'utils/lock-scope-refusal.js'), 'utf8')),
    '../utils/dispense-on-unlock.js': dataUrl('export const wantsDispense = () => false; export const dispenseContents = async () => ({ ok: false }); export const afterContainerUnlock = async () => {};'),
    './lockpick-catch.js': dataUrl('export function catchLockpickInView() { return false; } export function anyKeyMightFitLock() { return true; } export function lockKeyPinsOf() { return undefined; }')
};
let usrc = readFileSync(join(js, 'systems/unlock-system.js'), 'utf8');
for (const [spec, url] of Object.entries(stubs)) usrc = usrc.split(`'${spec}'`).join(`'${url}'`);
const { openLoginSignIn, domainOf } = await import(dataUrl(usrc));

// PC objects as the scenario authors them (test_ops_privilege: hot_desk and desk_a carry a domain)
const PCS = [
    { id: 'hot_desk', type: 'pc', lockType: 'login', name: 'Hot desk PC', domain: 'northwind' },
    { id: 'desk_a', type: 'pc', lockType: 'login', name: 'Desk A', domain: 'northwind' },
    { id: 'lab_pc', type: 'pc', lockType: 'login', name: 'Lab PC' }
];

function screenFor(pcData, { remote = false } = {}) {
    const started = [];
    window.breakEscapeConfig = { gameId: 3 };
    window.ApiClient = { loginAccounts: async () => ({ loginAccounts: [] }) };
    window.pcSessions = { has: () => false, get: () => null, screenShown() {} };
    window.MinigameFramework = { mainGameScene: {}, startMinigame: (type, c, params) => { started.push(params); return null; } };
    return openLoginSignIn({ scenarioData: { loginPicker: 'accounts', ...pcData } }).then(() => started[0]);
}

function render(signIn) {
    document.body.innerHTML = '<div id="mg"></div>';
    window.MinigameFramework = { currentMinigame: null, endMinigame: () => {} };
    window.gameAlert = () => {};
    window.playUISound = () => {};
    window.pcSessions = { signIn: async () => ({ ok: false }) };
    const mg = new PasswordMinigame(document.getElementById('mg'), {
        title: 'Desk', lockable: { scenarioData: { id: signIn.pcId } }, type: 'item',
        signIn: { picker: 'accounts', tiles: [], current: null, ...signIn }, showPostit: false
    });
    window.MinigameFramework.currentMinigame = mg;
    mg.init();
    mg.start();
    return mg;
}

test('domainOf: a non-blank string, trimmed, else null', () => {
    assert.equal(domainOf({ domain: 'northwind' }), 'northwind');
    assert.equal(domainOf({ domain: '  northwind ' }), 'northwind');
    for (const bad of [undefined, null, '', '   ', 7, {}, ['northwind'], true]) assert.equal(domainOf({ domain: bad }), null);
    assert.equal(domainOf(null), null);
    assert.equal(domainOf({}), null);
});

test('unlock-system hands the PC domain to the sign-in screen', async () => {
    const params = await screenFor({ id: 'desk_a', type: 'pc', name: 'Desk A', domain: 'northwind' });
    assert.equal(params.signIn.domain, 'northwind');
    const none = await screenFor({ id: 'lab_pc', type: 'pc', name: 'Lab PC' });
    assert.equal(none.signIn.domain, null);
});

test('the sign-in screen shows "Domain: northwind" for a domain PC ', () => {
    const pcs = PCS;
    const withDomain = pcs.filter(p => typeof p.domain === 'string');
    assert.equal(withDomain.length, 2);
    for (const pc of withDomain) {
        const mg = render({ pcId: pc.id, pcName: pc.name, domain: pc.domain });
        const line = document.querySelector('.signin-domain');
        assert.ok(line, `${pc.id} shows a domain line`);
        assert.equal(line.textContent, `Domain: ${pc.domain}`);
        mg.cleanup();
    }
    for (const pc of pcs.filter(p => p.domain === undefined)) {
        const mg = render({ pcId: pc.id, pcName: pc.name, domain: null });
        assert.equal(document.querySelector('.signin-domain'), null, `${pc.id} has no domain line`);
        mg.cleanup();
    }
});

test('no domain, blank domain, or a non-string: no line', () => {
    for (const domain of [undefined, null, '', '   ', 5, { a: 1 }]) {
        const mg = render({ pcId: 'p', pcName: 'P', domain });
        assert.equal(document.querySelector('.signin-domain'), null, JSON.stringify(domain));
        mg.cleanup();
    }
});

test('a hostile domain is text, not markup', () => {
    const hostile = '<img src=x onerror="window.__pwned=1"><b>x</b>';
    const mg = render({ pcId: 'p', pcName: 'P', domain: hostile });
    const line = document.querySelector('.signin-domain');
    assert.equal(line.textContent, `Domain: ${hostile}`);
    assert.equal(line.querySelector('img, b'), null, 'no element made from the value');
    assert.equal(window.__pwned, undefined);
    mg.cleanup();
});

test('a remote sign-in screen names the domain too', () => {
    const mg = render({ pcId: 'p', pcName: 'P', domain: 'northwind', picker: false, remote: { footholdId: 'f', linkName: null }, host: 'P' });
    assert.equal(document.querySelector('.signin-domain')?.textContent, 'Domain: northwind');
    mg.cleanup();
});

test('CSS: the domain line is one clipped line', () => {
    const i = css.indexOf('.signin-domain {');
    assert.ok(i >= 0);
    const r = css.slice(i, css.indexOf('}', i));
    assert.ok(/white-space:\s*nowrap/.test(r) && /text-overflow:\s*ellipsis/.test(r) && /overflow:\s*hidden/.test(r));
});
