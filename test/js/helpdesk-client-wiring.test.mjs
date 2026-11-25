// S8b unit 16 (extra): the game sets up the helpdesk client. systems/pc-sessions.js assigns
// window.helpdeskClient beside window.mfaClient; the real request form scene, with NO injected
// client, then reaches the real helpdesk-client.js and its answer built from the shared fixture.
// Run with: bin/test-js test/js/helpdesk-client-wiring.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';
import { answer } from './helpers/helpdesk-answers.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const read = (rel) => readFileSync(join(js, rel), 'utf8');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

const dir = mkdtempSync(join(tmpdir(), 'helpdesk-wiring-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/helpdesk-request/helpdesk-request-minigame.js',
    'systems/minigame-registry.js', 'systems/exercise-station-starter.js', 'systems/global-writer.js',
    'minigames/framework/minigame-manager.js', 'minigames/framework/base-minigame.js',
    'minigames/framework/social-overlay.js', 'utils/display-dashes.js', 'utils/escape-html.js', 'utils/author-html.js', 'ui/modal-stack.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), read(rel));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};
window.eventDispatcher = { emit() {} };
window.pauseKeyboardInput = () => {};
window.resumeKeyboardInput = () => {};

// The real boot module: pc-sessions.js, with its imports served as data URLs.
await import(dataUrl(read('systems/pc-sessions.js')
    .split("'../utils/sync-before-fetch.js'").join(`'${dataUrl(read('utils/sync-before-fetch.js'))}'`)
    .split("'./mfa-client.js'").join(`'${dataUrl(read('systems/mfa-client.js'))}'`)
    .split("'./helpdesk-client.js'").join(`'${dataUrl(read('systems/helpdesk-client.js'))}'`)));

const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const { MinigameFramework: FW } = await load('minigames/framework/minigame-manager.js');
const { HelpdeskRequestMinigame, resultLine } = await load('minigames/helpdesk-request/helpdesk-request-minigame.js');
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });
FW.registerScene('helpdesk-request', HelpdeskRequestMinigame);

test('the boot module sets window.helpdeskClient beside window.mfaClient', () => {
    assert.equal(typeof window.mfaClient?.noteRequired, 'function');
    assert.equal(typeof window.helpdeskClient?.formFor, 'function');
    assert.equal(typeof window.helpdeskClient?.send, 'function');
    assert.equal(typeof window.helpdeskClient?.configure, 'function');
});

test('the source assigns it where window.mfaClient is assigned', () => {
    const src = read('systems/pc-sessions.js');
    assert.match(src, /import \* as helpdeskClient from '\.\/helpdesk-client\.js'/);
    assert.match(src, /window\.mfaClient = mfaClient;[^\n]*window\.helpdeskClient = helpdeskClient;/);
});

test('the real scene, with no injected client, reaches a real helpdesk-client.js answer', async () => {
    window.gameScenario = { helpdeskForms: answer('bootstrap.helpdesk_forms').body };
    const posts = [];
    const granted = answer('helpdesk.granted_mfa');
    window.ApiClient = { post: async (path, payload) => { posts.push({ path, payload }); return granted.body; } };
    document.body.innerHTML = '<div id="mg"></div>';
    const container = document.getElementById('mg');
    const scene = new HelpdeskRequestMinigame(container, { deskId: 'it_desk' });
    scene.init();
    scene.start();
    assert.ok(container.querySelector('.hr-username input'), 'the form is drawn from the client forms');
    container.querySelector('.hr-username input').value = 'v.lind';
    container.querySelector('.hr-send').click();
    await new Promise((r) => setTimeout(r, 0));
    assert.equal(posts.length, 1);
    assert.equal(posts[0].path, '/helpdesk/request');
    assert.equal(posts[0].payload.desk_id, 'it_desk');
    assert.equal(container.querySelector('.hr-result-line')?.textContent, resultLine('granted', granted.body));
});
