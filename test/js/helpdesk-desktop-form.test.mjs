// S8b unit 22: the IT request form on a PC's desktop. `front_pc` of test_ops_helpdesk holds the
// item `front_form` (type helpdesk_form, desk it_desk). Signed in at the PC, the desktop draws it
// as an icon named "IT request form"; a click opens the real request form with the PC's id as
// pcId; Close lands back on the desktop. Real container-minigame.js, pc-sessions.js,
// helpdesk-client.js and request scene; only the network is answered, from the shared fixture.
// Run with: bin/test-js test/js/helpdesk-desktop-form.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';
import { answer } from './helpers/helpdesk-answers.mjs';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const sc = JSON.parse(readFileSync(join(here, '../../scenarios/test_ops_helpdesk/scenario.json.erb'), 'utf8'));
const frontPc = Object.values(sc.rooms).flatMap((r) => r.objects || []).find((o) => o.id === 'front_pc');

const root = mkdtempSync(join(tmpdir(), 'helpdesk-desktop-'));
const dir = join(root, 'app');
process.on('exit', () => rmSync(root, { recursive: true, force: true }));
mkdirSync(join(root, 'js/core'), { recursive: true });
writeFileSync(join(root, 'js/core/player.js'), 'export function setPlayerInput() {}\n');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('utils/helpers.js', 'export function makeDraggable() {}\n');
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
put('utils/conditional-text.js', 'export function resolveObjectField(o, f, d) { return (o && o[f] != null) ? o[f] : d; }\n');
put('systems/inventory.js',
    'export const adds = [];\n' +
    'export async function addToInventory(sprite) { adds.push(sprite); return { ok: true, reason: "added" }; }\n' +
    'export function removeFromInventory() {}\n' +
    'export function inventoryImageKey(d) { return (typeof d?.sprite === "string" && d.sprite) || d?.type; }\n');
for (const rel of ['utils/escape-html.js', 'utils/more-below.js', 'utils/computer-keywords.js', 'utils/pc-monitor.js',
    'utils/npc-headshot.js', 'utils/pc-taskbar.js', 'utils/author-html.js', 'utils/remote-host-text.js', 'utils/compromise-bolt.js',
    'utils/sync-before-fetch.js', 'minigames/container/container-item-image.js', 'minigames/framework/base-minigame.js',
    'minigames/framework/social-overlay.js', 'minigames/container/container-minigame.js', 'minigames/container/cached-accounts-panel.js', 'minigames/network-view/ops-model.js', 'systems/pc-sessions.js',
    'systems/mfa-client.js', 'systems/helpdesk-client.js', 'systems/minigame-registry.js', 'systems/exercise-station-starter.js',
    'systems/global-writer.js', 'minigames/framework/minigame-manager.js',
    'minigames/helpdesk-request/helpdesk-request-minigame.js', 'ui/modal-stack.js']) copy(rel);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
window.requestAnimationFrame = globalThis.requestAnimationFrame;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { ContainerMinigame, returnToContainerAfterNotes, startContainerMinigame } = await imp('minigames/container/container-minigame.js');
const { MinigameFramework: FW } = await imp('minigames/framework/minigame-manager.js');
const { HelpdeskRequestMinigame } = await imp('minigames/helpdesk-request/helpdesk-request-minigame.js');
const { socialOverlayParams } = await imp('minigames/framework/social-overlay.js');
const { PcSessions } = await imp('systems/pc-sessions.js');
const { adds } = await imp('systems/inventory.js');

// The real starter from minigame-starters.js (that file's imports are the whole game, so the one
// function is lifted out, as helpdesk-request.test.mjs does).
const starterSrc = readFileSync(join(js, 'systems/minigame-starters.js'), 'utf8');
const body = starterSrc.slice(starterSrc.indexOf('export function startHelpdeskRequest'));
const startHelpdeskRequest = new Function('window', 'socialOverlayParams',
    body.slice(0, body.indexOf('window.startHelpdeskRequest')).replace('export function', 'function') + '\nreturn startHelpdeskRequest;')(window, socialOverlayParams);

const settle = (ms = 30) => new Promise((r) => setTimeout(r, ms));
const FORMS = answer('bootstrap.helpdesk_forms').body;
let posts, fetches, sessions;

async function signInAndOpen() {
    posts = []; fetches = []; adds.length = 0;
    document.body.innerHTML = '';
    for (const k of Object.keys(FW.registeredScenes || {})) delete FW.registeredScenes[k];
    FW.currentMinigame = null;
    FW.mainGameScene = {};
    FW.registerScene('container', ContainerMinigame);
    FW.registerScene('helpdesk-request', HelpdeskRequestMinigame);
    window.MinigameFramework = FW;
    window.pendingContainerReturn = null;
    window.breakEscapeConfig = { gameId: 5 };
    window.inventory = { items: [] };
    window.gameState = { notes: [], globalVariables: {} };
    window.gameAlert = () => {};
    window.playUISound = () => {};
    window.eventDispatcher = { emit() {}, on() {}, off() {} };
    window.pauseKeyboardInput = () => {};
    window.resumeKeyboardInput = () => {};
    window.gameScenario = { helpdeskForms: FORMS };
    window.startContainerMinigame = startContainerMinigame;
    window.returnToContainerAfterNotes = returnToContainerAfterNotes;
    window.startHelpdeskRequest = startHelpdeskRequest;
    window.helpdeskClient = await imp('systems/helpdesk-client.js');
    window.ApiClient = {
        // sam signs in at the desk PC
        login: async () => ({ success: true, npcId: 'sam', username: 's.okoro', displayName: 'Sam Okoro', via: 'password' }),
        post: async (path, payload) => { posts.push({ path, payload }); return answer('helpdesk.granted_mfa').body; }
    };
    // What the server answers for the desktop: the PC's contents as authored (the item keeps `desk`)
    window.fetch = globalThis.fetch = async (url) => {
        fetches.push(String(url));
        return { ok: true, status: 200, statusText: 'OK', json: async () => JSON.parse(JSON.stringify({ contents: frontPc.contents })) };
    };
    sessions = new PcSessions();
    window.pcSessions = sessions;
    await sessions.signIn('front_pc', 's.okoro', 'x');
    const lockable = { scenarioData: { id: 'front_pc', type: 'pc', name: frontPc.name, locked: true, lockType: 'login', observations: frontPc.observations } };
    startContainerMinigame(lockable, null, false, true);
    await settle();
}
const icons = () => [...document.querySelectorAll('.desktop-icon')];
const iconNamed = (name) => icons().find((el) => el.querySelector('.desktop-icon-label').textContent === name);

test('the authored item is what the client builds on: type, id, name and desk, no secret', () => {
    const form = frontPc.contents[0];
    assert.deepEqual(Object.keys(form).sort(), ['desk', 'id', 'name', 'type']);
    assert.equal(form.type, 'helpdesk_form');
});

test('signed in at front_pc, the desktop shows an icon named "IT request form" with the document glyph', async () => {
    await signInAndOpen();
    const icon = iconNamed('IT request form');
    assert.ok(icon, 'the icon is on the desktop');
    assert.match(icon.querySelector('img').getAttribute('src'), /objects\/text_file\.png$/);
    assert.equal(icon.getAttribute('aria-label'), 'IT request form');
});

test('a click opens the real form for it_desk with this PC\'s id; send; close; back on the desktop', async () => {
    await signInAndOpen();
    iconNamed('IT request form').click();
    await settle();
    const scene = FW.currentMinigame;
    assert.ok(scene instanceof HelpdeskRequestMinigame, 'the request form is open');
    assert.equal(scene.params.deskId, 'it_desk');
    assert.equal(scene.params.pcId, 'front_pc');
    assert.equal(scene.getTestState().helpdeskRequest.hasForm, true);
    const root = scene.container;
    root.querySelector('.hr-username input').value = 'v.holt';
    root.querySelector('.hr-send').click();
    await settle();
    assert.equal(posts.length, 1);
    assert.equal(posts[0].path, '/helpdesk/request');
    assert.equal(posts[0].payload.pc_id, 'front_pc');
    assert.equal(posts[0].payload.desk_id, 'it_desk');
    assert.equal(scene.getTestState().helpdeskRequest.result, 'granted');
    // Close
    const close = root.querySelector('button.se-overlay-close[aria-label="Close"]');
    close.click();
    await settle(60);
    assert.ok(FW.currentMinigame instanceof ContainerMinigame, 'the desktop is back');
    assert.ok(iconNamed('IT request form'), 'with its icon still there');
    assert.equal(adds.length, 0, 'nothing was taken');
});

test('the item cannot be taken, even if authored takeable', async () => {
    await signInAndOpen();
    const mg = FW.currentMinigame;
    const item = { ...frontPc.contents[0], takeable: true };
    assert.equal(mg.offersTransfer(item), false);
    assert.equal(mg.isInteractiveItem(frontPc.contents[0]), true);
    mg.contents = [item];
    mg.handleInteractiveItem(item, null);
    await settle();
    assert.equal(adds.length, 0);
    assert.ok(FW.currentMinigame instanceof HelpdeskRequestMinigame);
});
