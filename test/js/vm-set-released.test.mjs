// D144: a Hacktivity game whose VM set was handed back ("released").
// - the vm-launcher shows fixed text, never the VM's title / IP / shell URL, makes no
//   console-unlock call, and links "Back to missions" only for a same-origin menu URL
// - main.js does not POST the activate URL when the state is released
// - the flag wording shows the server's vm_released sentence
//
// Run with: node test/js/vm-set-released.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://be.example/break_escape/games/42' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;

// Same stubbed-sibling loader as vm-launcher-console-unlock.test.mjs
const root = mkdtempSync(join(tmpdir(), 'vm-released-'));
const mg = join(root, 'minigames');
mkdirSync(join(mg, 'vm-launcher'), { recursive: true });
mkdirSync(join(mg, 'framework'));
mkdirSync(join(root, 'utils'));
writeFileSync(join(root, 'package.json'), '{"type":"module"}');
writeFileSync(join(mg, 'framework', 'base-minigame.js'), 'export class MinigameScene { constructor() {} }\n');
writeFileSync(join(root, 'utils', 'helpers.js'), 'export function makeDraggable() {}\n');
writeFileSync(join(root, 'utils', 'escape-html.js'), readFileSync(join(js, 'utils/escape-html.js'), 'utf8'));
writeFileSync(join(mg, 'vm-launcher', 'vm-launcher-minigame.js'),
    readFileSync(join(js, 'minigames/vm-launcher/vm-launcher-minigame.js'), 'utf8'));
const { VmLauncherMinigame } = await import(pathToFileURL(join(mg, 'vm-launcher', 'vm-launcher-minigame.js')).href);

const HOSTILE_TITLE = '<img src=x onerror=alert(1)>kali-evil';
const HOSTILE_IP = '10.9.8.7"><script>window.pwned=1</script>';

function setConfig(cfg) {
    dom.window.breakEscapeConfig = cfg;
}

/** Run the real buildUI on a jsdom container and return {container, fetchCalls}. */
function openLauncher({ shellMenuUrl, shellReturnUrl, vmSetState = 'released', hacktivityMode = true } = {}) {
    setConfig({
        hacktivityMode, vmSetState, shellMenuUrl, shellReturnUrl,
        vmPanelUrl: '/break_escape/games/42/vm_panel'
    });
    const fetchCalls = [];
    globalThis.fetch = async (url, opts) => { fetchCalls.push({ url, opts }); return { ok: true, json: async () => ({}) }; };
    const gameContainer = document.createElement('div');
    document.body.appendChild(gameContainer);
    // The real constructor works out vmSetReleased, vmPanelUrl and vmPanelRefused from the
    // page config; the stubbed MinigameScene base does nothing, so the container is set here.
    const s = new VmLauncherMinigame(gameContainer, { vm: { title: HOSTILE_TITLE, ip: HOSTILE_IP }, hacktivityMode, gameId: 42 });
    Object.assign(s, { gameContainer, attachEventHandlers() {} });
    s.buildUI();
    return { container: gameContainer, fetchCalls, scene: s };
}

test('the constructor works out the released state from the page config', () => {
    assert.equal(openLauncher({ vmSetState: 'released' }).scene.vmSetReleased, true);
    assert.equal(openLauncher({ vmSetState: 'live' }).scene.vmSetReleased, false);
    assert.equal(openLauncher({ vmSetState: 'none' }).scene.vmSetReleased, false);
    assert.equal(openLauncher({ hacktivityMode: false, vmSetState: 'released' }).scene.vmSetReleased, false);
    assert.equal(openLauncher({}).scene.vmPanelUrl, 'https://be.example/break_escape/games/42/vm_panel');
});

test('released: the link sits in the actions row as a block button, not inline in a paragraph', () => {
    const c = openLauncher({ shellMenuUrl: '/hacktivity/events/1-break-escape' }).container;
    const a = c.querySelector('a.vm-action-btn');
    assert.ok(a);
    assert.equal(a.parentElement.className, 'vm-actions');
    assert.ok(a.closest('p') === null, 'not inside a paragraph');
    const css = readFileSync(join(js, '../css/vm-launcher-minigame.css'), 'utf8');
    assert.match(css, /a\.vm-action-btn\s*\{[^}]*display:\s*inline-block;[^}]*text-decoration:\s*none;/);
});

test('released: shellReturnUrl is the fallback, and also only when same-origin', () => {
    const ok = openLauncher({ shellReturnUrl: '/hacktivity/events/1' }).container.querySelector('a');
    assert.equal(ok.getAttribute('href'), 'https://be.example/hacktivity/events/1');
    const menuWins = openLauncher({ shellMenuUrl: '/menu', shellReturnUrl: '/ret' }).container.querySelector('a');
    assert.equal(menuWins.getAttribute('href'), 'https://be.example/menu');
    assert.ok(openLauncher({ shellReturnUrl: 'https://evil.example/x' }).container.querySelector('a') === null);
});

test('released: fixed text only; hostile VM title and IP never reach the DOM', () => {
    const { container } = openLauncher({});
    const text = container.textContent;
    assert.match(text, /VMs released/);
    assert.match(text, /The VMs for this session have been released\. Your progress is kept\./);
    assert.ok(!text.includes('kali-evil'), 'title not shown');
    assert.ok(!text.includes('10.9.8.7'), 'ip not shown');
    assert.ok(container.querySelector('img') === null, 'no injected img');
    assert.ok(container.querySelector('script') === null, 'no injected script');
    assert.ok(container.querySelector('iframe') === null, 'no panel iframe');
    assert.equal(dom.window.pwned, undefined);
});

test('released: no console-unlock call is made', () => {
    const { fetchCalls } = openLauncher({});
    assert.equal(fetchCalls.length, 0);
});

test('released: Back to missions link only for a same-origin menu URL', () => {
    const ok = openLauncher({ shellMenuUrl: '/hacktivity/events/1-break-escape' }).container;
    const a = ok.querySelector('a');
    assert.ok(a, 'link present');
    assert.equal(a.textContent, 'Back to missions');
    assert.equal(a.getAttribute('href'), 'https://be.example/hacktivity/events/1-break-escape');

    for (const bad of ['javascript:alert(1)', 'data:text/html,<b>x', '//evil.example/x', 'https://evil.example/x',
        'https://user:pw@be.example/x', '', undefined, 42]) {
        const c = openLauncher({ shellMenuUrl: bad }).container;
        assert.ok(c.querySelector('a') === null, `no link for ${String(bad)}`);
        assert.match(c.textContent, /VMs released/);
    }
});

test('a hostile menu URL that passes the origin check is attribute-escaped', () => {
    const c = openLauncher({ shellMenuUrl: '/m?"><img src=x onerror=alert(2)>' }).container;
    assert.ok(c.querySelector('img') === null);
    assert.equal(c.querySelectorAll('a').length, 1);
});

test('live set still shows the VM and asks for the console unlock (no regression)', () => {
    const { fetchCalls } = openLauncher({ vmSetState: 'live' });
    assert.equal(fetchCalls.length, 1);
    assert.match(fetchCalls[0].url, /unlock_vm_console/);
});

test('standalone mode ignores vmSetState: never released, never calls the server', () => {
    const { container, fetchCalls } = openLauncher({ hacktivityMode: false, vmSetState: 'released' });
    assert.equal(fetchCalls.length, 0);
    assert.doesNotMatch(container.textContent, /VMs released/);
});

test('main.js skips the activate POST when the state is released (source contract)', () => {
    const src = readFileSync(join(js, 'main.js'), 'utf8');
    assert.match(src, /const activateUrl = window\.breakEscapeConfig\?\.hacktivityMode\s*&&\s*window\.breakEscapeConfig\?\.vmSetState !== 'released'\s*&&\s*window\.breakEscapeConfig\?\.vmSetActivateUrl;/);
});

test('flag wording: vm_released shows the server sentence, or the fallback', async () => {
    const F = await import(pathToFileURL(join(js, 'utils/flag-wording.js')).href);
    assert.ok(F.REJECT_REASONS.includes('vm_released'));
    assert.equal(F.flagRejectReason('whatever', 'vm_released'), 'vm_released');
    const sentence = "This session's VMs have been released. Start the mission again to get fresh VMs.";
    assert.equal(F.flagRefusalLine(sentence, { reason: 'vm_released' }), sentence);
    assert.equal(F.flagRefusalLine('', { reason: 'vm_released' }), sentence);
    assert.doesNotMatch(F.flagRefusalLine(sentence, { reason: 'vm_released', flagValue: 'abc' }), /Flags usually look like/);
});
