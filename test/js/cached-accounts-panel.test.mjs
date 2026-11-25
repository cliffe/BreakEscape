// Ops S5bc unit 21: the collect panel on a sign-in desktop (cached-accounts-panel.js, mounted by
// container-minigame.js). Every server answer comes from the recorded answers fixture
// (support/privilege-answers.mjs). Run with: node test/js/cached-accounts-panel.test.mjs
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';
import { privilegeAnswer, privilegeStatus } from './support/privilege-answers.mjs';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'cached-panel-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('utils/constants.js', 'export const DOOR_ALIGN_OVERLAP = 64;\n');
put('core/rooms.js', 'export const rooms = {};\n');
put('systems/doors.js', 'export function unlockDoor() {}\n');
put('systems/minigame-starters.js', ['startLockpickingMinigame', 'startKeySelectionMinigame', 'startPinMinigame', 'startPasswordMinigame',
    'startRansomwareDisplayMinigame', 'startBackupRecoveryMinigame', 'startInfusionPumpMinigame'].map(n => `export function ${n}() {}`).join('\n'));
put('systems/ui-sounds.js', 'export function playUISound() {}\n');
put('minigames/biometrics/fingerprint-reader-minigame.js', 'export function startFingerprintReader() {}\n');
put('systems/lockpick-catch.js', 'export function catchLockpickInView() { return false; } export function anyKeyMightFitLock() { return true; } export function lockKeyPinsOf() { return undefined; }\n');
put('utils/helpers.js', 'export function makeDraggable() {}\n');
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
copy('utils/escape-html.js');
copy('utils/lock-scope-refusal.js'); // unlock-system.js now imports unlockWithRouteRoomRetry from here (GATED_DOOR §3.6)
copy('utils/dispense-on-unlock.js'); // unlock-system.js imports it (dispenses containers)
copy('utils/more-below.js');
copy('utils/computer-keywords.js');
copy('utils/pc-monitor.js');
copy('utils/npc-headshot.js');
copy('utils/pc-taskbar.js');
copy('utils/author-html.js');
put('systems/inventory.js',
    'export async function addToInventory() { return { ok: true }; }\n' +
    'export function removeFromInventory() {}\n' +
    'export function inventoryImageKey(d) { return (typeof d?.sprite === "string" && d.sprite) || d?.type; }\n');
for (const rel of ['utils/locked-hint.js', 'utils/conditional-text.js', 'systems/global-writer.js', 'systems/captures.js',
    'utils/remote-host-text.js', 'utils/compromise-bolt.js',
    'systems/unlock-system.js', 'systems/pc-sessions.js', 'systems/mfa-client.js', 'utils/sync-before-fetch.js', 'systems/keyring.js', 'systems/network-links.js',
    'minigames/framework/base-minigame.js', 'minigames/container/container-item-image.js',
    'minigames/container/container-minigame.js', 'minigames/container/cached-accounts-panel.js', 'minigames/network-view/ops-model.js']) copy(rel);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { openLoginDesktop, openRelayDesktop } = await imp('systems/unlock-system.js');
const { PcSessions } = await imp('systems/pc-sessions.js');
const { ContainerMinigame } = await imp('minigames/container/container-minigame.js');
const { cachedAccountsQuery } = await imp('minigames/container/cached-accounts-panel.js');


const settle = async (n = 6) => { for (let i = 0; i < n; i++) await new Promise(r => setTimeout(r, 0)); };
// The admin cases run at desk_a (the recorded admin desktop, sign-in and collect answers); a user session is the recorded one at bay_pc.
const BAY_PC = { id: 'bay_pc', type: 'pc', name: 'Bay PC', host: 'BAY01', lockType: 'login', locked: true, loginPicker: 'accounts' };
const DESK_B = { id: 'desk_b', type: 'pc', name: 'Desk PC B', host: 'DESKB', lockType: 'login', locked: true, loginPicker: 'accounts' };
const DESK_A = { id: 'desk_a', type: 'pc', name: 'Desk PC A', host: 'DESKA', lockType: 'login', locked: true, loginPicker: 'accounts' };
const HOT_DESK = { id: 'hot_desk', type: 'pc', name: 'Hot desk', host: 'HOT01', lockType: 'login', locked: true, loginPicker: 'accounts' };

let started, requests, answers, keyringRefreshes, sessions;

function answerFor(url, init) {
  if (/\/harvest_credentials/.test(url)) {
    requests.push({ url, init });
    const a = answers.collect;
    return { status: privilegeStatus(a), body: privilegeAnswer(a) };
  }
  const m = /\/container\/([^?]+)/.exec(url);
  const name = m && m[1] === 'desk_a' ? 'desktop_admin_desk_a' : m && m[1] === 'desk_b' ? 'desktop_deskadmin_desk_b' : m && m[1] === 'bay_pc' ? 'desktop_user_bay' : 'relay_desktop_hot_desk';
  return { status: privilegeStatus(name), body: privilegeAnswer(name) };
}

function setup() {
  started = []; requests = []; keyringRefreshes = 0;
  answers = { collect: 'collect_desk_a_deskadmin' };
  document.body.innerHTML = '';
  window.breakEscapeConfig = { gameId: 5, csrfToken: 'tok' };
  window.gameId = 5;
  window.gameState = { globalVariables: {} };
  window.gameScenario = { rooms: { bay: { objects: [BAY_PC, DESK_A, DESK_B, HOT_DESK] } } };
  window.eventDispatcher = { emit: () => {}, on: () => {} };
  window.gameAlert = () => {};
  window.playUISound = () => {};
  window.ApiClient = {
    login: async (pcId, body) => privilegeAnswer(pcId === 'desk_b' ? 'signin_deskadmin_desk_b' : body.username === 'adelwick' ? 'signin_admin_desk_a' : 'signin_user_bay'),
    loginWithCredential: async () => privilegeAnswer('relay_signin_adel_hot_desk'),
    logout: async () => ({ success: true }),
    get: async () => ({ secrets: {}, accounts: {} })
  };
  window.fetch = globalThis.fetch = async (url, init) => {
    const a = answerFor(String(url), init);
    return { ok: a.status >= 200 && a.status < 300, status: a.status, json: async () => a.body };
  };
  window.keyring = { refresh: async () => { keyringRefreshes++; return null; } };
  sessions = new PcSessions();
  window.pcSessions = sessions;
  window.networkLinks = null;
  window.openLoginSignIn = () => {};
  window.MinigameFramework = {
    mainGameScene: {}, currentMinigame: null,
    startMinigame(type, c, params) {
      started.push([type, params]);
      if (type !== 'container') return { _sceneType: type, params, cleanup() {} };
      if (this.currentMinigame) this.endMinigame(false, null);
      const el = document.createElement('div');
      document.body.appendChild(el);
      const m = new ContainerMinigame(el, params);
      this.currentMinigame = m; m._sceneType = type; m.init(); m.start();
      return m;
    },
    endMinigame() {
      const m = this.currentMinigame; if (!m) return;
      m.cleanup(); this.currentMinigame = null; m.container?.remove?.();
    }
  };
  window.startContainerMinigame = (item, contents, takeable, desktop, extra = {}) =>
    window.MinigameFramework.startMinigame('container', null, { title: item.scenarioData.name, containerItem: item, contents, isTakeable: takeable, desktopMode: desktop, cancelText: 'Close', showCancel: true, ...extra });
}

async function keyboardDesktop(username) {
  const admin = username === 'adelwick';
  const pc = admin ? DESK_A : BAY_PC;
  const r = await sessions.signIn(pc.id, username, 'pw');
  assert.equal(r.ok, true);
  openLoginDesktop({ scenarioData: { ...pc } });
  await settle();
}
const btn = () => document.querySelector('#cached-accounts-btn');
const rows = () => [...document.querySelectorAll('.cached-account-row')];
const status = () => document.querySelector('.cached-accounts-status')?.textContent;
async function press() { btn().click(); await settle(); }

test('no control for a user session', async () => {
  setup();
  await keyboardDesktop('umaquay');
  assert.equal(sessions.sessionAdmin('bay_pc'), false);
  assert.equal(btn(), null);
  assert.equal(document.querySelector('.cached-accounts'), null);
});

test('an admin session shows the button; the first collect lists held rows and refreshes the keyring', async () => {
  setup();
  await keyboardDesktop('adelwick');
  assert.ok(btn(), 'the control is shown');
  assert.equal(btn().textContent, 'Cached accounts');
  assert.equal(rows().length, 0, 'nothing is listed before the press');
  await press();
  assert.equal(requests.length, 1);
  assert.match(requests[0].url, /\/games\/5\/harvest_credentials$/);
  assert.equal(requests[0].init.method, 'POST');
  assert.equal(requests[0].init.headers['X-CSRF-Token'], 'tok');
  assert.deepEqual(JSON.parse(requests[0].init.body), { pc_id: 'desk_a' });
  const want = privilegeAnswer('collect_desk_a_deskadmin').held;
  assert.equal(rows().length, want.length);
  for (const [i, row] of rows().entries()) {
    assert.equal(row.dataset.hashId, want[i].hashId);
    assert.equal(row.querySelector('.cached-account-name').textContent, want[i].displayName);
    assert.equal(row.querySelector('.cached-account-username').textContent, want[i].username);
    assert.equal(row.querySelector('.cached-account-tag').textContent, 'hash');
    assert.equal(row.querySelector('button.cached-account-crack').textContent, 'Crack');
    assert.ok(row.querySelector('.cached-account-headshot'));
  }
  assert.match(document.querySelector('.cached-accounts-note').textContent, /password comes from cracking/);
  assert.equal(document.querySelector('.cached-accounts-note').hidden, false);
  assert.equal(status(), '', 'something new: no nothing-new line');
  assert.equal(keyringRefreshes, 1);
  assert.equal(btn().disabled, false);
});

test('a repeat says nothing new is cached and keeps the rows', async () => {
  setup();
  await keyboardDesktop('adelwick');
  await press();
  answers.collect = 'collect_desk_a_repeat';
  await press();
  assert.equal(status(), 'Nothing new is cached here.');
  assert.equal(rows().length, privilegeAnswer('collect_desk_a_repeat').held.length);
});

test('Crack opens the cracker for that hash', async () => {
  setup();
  await keyboardDesktop('adelwick');
  await press();
  rows()[0].querySelector('.cached-account-crack').click();
  const last = started.at(-1);
  assert.equal(last[0], 'ops-cracker');
  assert.deepEqual(last[1], { hashId: privilegeAnswer('collect_desk_a_deskadmin').held[0].hashId });
});

test('a null portrait gets the generic silhouette, never a crop', async () => {
  setup();
  const body = privilegeAnswer('collect_desk_a_deskadmin');
  body.held[0].portrait = null; body.held[0].avatar = null;
  await keyboardDesktop('adelwick');
  window.fetch = globalThis.fetch = async (url) => ({ ok: true, status: 200, json: async () => (/harvest/.test(url) ? body : answerFor(String(url)).body) });
  await press();
  const box = rows()[0].querySelector('.cached-account-headshot');
  assert.equal(box.dataset.frame, 'generic');
  assert.match(box.style.backgroundImage, /pc-user-silhouette\.png/);
});

for (const [name, answer, text] of [
  ['not_admin', 'collect_refused_not_admin', 'That needs administrator access.'],
  ['locked', 'collect_refused_locked', 'That is locked.'],
  ['not_reachable', 'collect_refused_not_reachable', 'That cannot be reached from here.']]) {
  test(`refusal ${name} shows the refusal text and lists nothing`, async () => {
    setup();
    await keyboardDesktop('adelwick');
    answers.collect = answer;
    await press();
    assert.equal(status(), text);
    assert.equal(rows().length, 0);
    assert.equal(keyringRefreshes, 0);
    assert.equal(btn().disabled, false);
  });
}

test('an unknown PC (404 with no reason) shows the generic refusal line', async () => {
  setup();
  await keyboardDesktop('adelwick');
  answers.collect = 'collect_refused_unknown_pc';
  await press();
  assert.equal(status(), 'That did not work.');
});

test('a hostile display name and username are text, never markup', async () => {
  setup();
  const body = privilegeAnswer('collect_desk_a_deskadmin');
  body.held[0].displayName = '<img src=x onerror=window.__pwned=1>';
  body.held[0].username = '<b>u</b>';
  await keyboardDesktop('adelwick');
  window.fetch = globalThis.fetch = async (url) => ({ ok: true, status: 200, json: async () => (/harvest/.test(url) ? body : answerFor(String(url)).body) });
  await press();
  const row = rows()[0];
  assert.equal(row.querySelector('.cached-account-name').textContent, '<img src=x onerror=window.__pwned=1>');
  assert.equal(row.querySelectorAll('img, b').length, 0);
  assert.equal(window.__pwned, undefined);
});

test('a relay admin entry shows the control and the request carries relay=1', async () => {
  setup();
  const r = await sessions.signInWithCredential('hot_desk', 'adel_assist', { relay: true });
  assert.equal(r.ok, true);
  assert.equal(sessions.sessionAdmin('hot_desk'), true);
  openRelayDesktop('hot_desk');
  await settle();
  assert.ok(btn(), 'the control is shown for a relay admin');
  answers.collect = 'collect_relay_admin';
  await press();
  assert.equal(requests.length, 1);
  assert.match(requests[0].url, /\/harvest_credentials\?relay=1$/);
  assert.deepEqual(JSON.parse(requests[0].init.body), { pc_id: 'hot_desk' });
  assert.equal(rows().length, privilegeAnswer('collect_relay_admin').held.length);
});

test('a relay user entry shows no control', async () => {
  setup();
  window.ApiClient.loginWithCredential = async () => privilegeAnswer('relay_signin_uma_store');
  const r = await sessions.signInWithCredential('store_pc', 'uma_assist', { relay: true });
  assert.equal(r.ok, true);
  openRelayDesktop('store_pc');
  await settle();
  assert.equal(btn(), null);
});

test('the panel goes with the desktop (cleanup) and two presses in flight send one request', async () => {
  setup();
  await keyboardDesktop('adelwick');
  btn().click(); btn().click();
  await settle();
  assert.equal(requests.length, 1);
  window.MinigameFramework.endMinigame();
  assert.equal(document.querySelector('.cached-accounts'), null);
});

test('a row whose hash the keyring lists as cracked reads "cracked" with an Open button (desk_b, recorded answers)', async () => {
  setup();
  answers.collect = 'collect_desk_b_deskadmin';
  window.keyring = { refresh: async () => { keyringRefreshes++; return privilegeAnswer('keyring_after_collect_desk_b').entries; } };
  const r = await sessions.signIn('desk_b', 'deskadmin', 'pw');
  assert.equal(r.ok, true);
  openLoginDesktop({ scenarioData: { ...DESK_B } });
  await settle();
  await press();
  assert.equal(rows().length, 1);
  assert.equal(rows()[0].dataset.hashId, 'desk_b_deskadmin');
  assert.equal(rows()[0].querySelector('.cached-account-tag').textContent, 'cracked');
  assert.equal(rows()[0].querySelector('.cached-account-crack').textContent, 'Open');
});

test('a row whose hash is not cracked keeps "hash" and "Crack" after the keyring answers', async () => {
  setup();
  window.keyring = { refresh: async () => privilegeAnswer('keyring_after_collect_desk_b').entries };
  await keyboardDesktop('adelwick');
  await press();
  assert.equal(rows()[0].dataset.hashId, 'desk_a_deskadmin');
  assert.equal(rows()[0].querySelector('.cached-account-tag').textContent, 'cracked', 'the keyring lists desk_a_deskadmin as cracked');
  setup();
  window.keyring = { refresh: async () => privilegeAnswer('keyring_after_bay_collect').entries };
  answers.collect = 'collect_desk_a_deskadmin';
  await keyboardDesktop('adelwick');
  await press();
  assert.equal(rows()[0].querySelector('.cached-account-tag').textContent, 'hash');
  assert.equal(rows()[0].querySelector('.cached-account-crack').textContent, 'Crack');
});

test('a collect answered after the desktop closed still tells the keyring and draws nothing', async () => {
  setup();
  await keyboardDesktop('adelwick');
  const pending = [];
  window.fetch = globalThis.fetch = async (url, init) => {
    const a = answerFor(String(url), init);
    if (/harvest/.test(url)) await new Promise(r => pending.push(r));
    return { ok: a.status >= 200 && a.status < 300, status: a.status, json: async () => a.body };
  };
  btn().click();
  await settle();
  window.MinigameFramework.endMinigame();
  pending.forEach(r => r());
  await settle();
  assert.equal(keyringRefreshes, 1, 'the keyring is asked');
  assert.equal(document.querySelector('.cached-accounts'), null);
  assert.equal(rows().length, 0);
});

test('cachedAccountsQuery: keyboard none, relay, foothold and from are encoded', () => {
  assert.equal(cachedAccountsQuery(null), '');
  assert.equal(cachedAccountsQuery({}), '');
  assert.equal(cachedAccountsQuery({ relay: true }), '?relay=1');
  assert.equal(cachedAccountsQuery({ foothold: 'jack office&1' }), '?foothold=jack%20office%261');
  assert.equal(cachedAccountsQuery({ from: 'store pc' }), '?from=store%20pc');
});

test('a desktop reached by foothold or from another PC sends that route', async () => {
  for (const [remote, want] of [[{ footholdId: 'jack_office_port' }, /\?foothold=jack_office_port$/], [{ fromPcId: 'store_pc', fromHost: 'RECS01' }, /\?from=store_pc$/]]) {
    setup();
    const r = await sessions.signIn('desk_a', 'adelwick', 'pw', remote.footholdId ? { foothold: remote.footholdId } : { from: remote.fromPcId });
    assert.equal(r.ok, true);
    openLoginDesktop({ scenarioData: { ...DESK_A, remote } });
    await settle();
    assert.ok(btn(), JSON.stringify(remote));
    await press();
    assert.equal(requests.length, 1);
    assert.match(requests[0].url, want);
  }
});
