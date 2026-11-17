// Tailgate sync: the sync_state and door unlock answers carry what the server wrote during the
// request (serverGlobals, serverCompletedTasks: a creditOnPass tailgate credit). The client
// applies them at once through the shared global writer (gameState, ink, events) and the
// objectives manager, with no reload, no echo of the global on the next sync and no second
// completion POST. Server side: test/controllers/break_escape/server_writes_answer_test.rb.
// Run with: node test/js/server-writes-apply.test.mjs

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'server-writes-test-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
const toMjs = s => s.replace(/'\.\/(api-client|config)\.js'/g, "'./$1.mjs'");
copy('config.js', 'config.mjs');
copy('api-client.js', 'api-client.mjs', toMjs);
copy('state-sync.js', 'state-sync.mjs', toMjs);
copy('systems/global-writer.js', 'global-writer.mjs');
copy('systems/objectives-manager.js', 'objectives-manager.mjs');
copy('ui/objectives-panel.js', 'objectives-panel.mjs',
  s => s.split("'../utils/display-dashes.js'").join("'./display-dashes.mjs'"));
writeFileSync(join(dir, 'display-dashes.mjs'), 'export const displayDashes = (s) => s;\n');

globalThis.window = { breakEscapeConfig: { gameId: 1, apiBasePath: '/games/1', csrfToken: 't' } };
globalThis.document = { querySelector: () => null };
const quiet = { log: () => {}, warn: () => {}, error: () => {} };
const load = name => import(pathToFileURL(join(dir, name)).href);
const { StateSync } = await load('state-sync.mjs');
const { ApiClient } = await load('api-client.mjs');
const { writeGlobal } = await load('global-writer.mjs');
const { ObjectivesManager } = await load('objectives-manager.mjs');
const { ObjectivesPanel } = await load('objectives-panel.mjs');

let requests = [];
let reply = () => ({ success: true });
globalThis.fetch = async (url, init) => {
  const body = init?.body ? JSON.parse(init.body) : null;
  requests.push({ url: String(url), body });
  return { ok: true, status: 200, statusText: '', json: async () => reply(String(url), body) };
};

const task = (taskId, extra = {}) => ({ taskId, title: taskId, type: 'manual', status: 'active', ...extra });

function setup() {
  requests = [];
  reply = () => ({ success: true });
  const broadcasts = [];
  const events = [];
  // An ink story that declares the credit global, open in the chat (Ruth's debrief)
  const inkVars = { kp_badge_tailgated: false };
  const story = {
    variablesState: {
      _defaultGlobalVariables: new Map([['kp_badge_tailgated', false]]),
      $: (n, v) => (v === undefined ? inkVars[n] : (inkVars[n] = v))
    }
  };
  Object.assign(globalThis.window, {
    gameState: { globalVariables: { courier_ready: true, kp_badge_tailgated: false } },
    currentPlayerRoom: 'secure_area',
    currentRoom: null,
    npcConversationStateManager: {
      isGlobalVariable: () => true,
      broadcastGlobalVariableChange: (name, value) => broadcasts.push([name, value])
    },
    MinigameFramework: { currentMinigame: { inkEngine: { story }, npcId: 'ruth' } },
    eventDispatcher: { emit: (name, data) => events.push([name, data]), on() {} },
    gameAlert: () => {}
  });
  const dispatcher = { emitted: [], on() {}, emit(name) { this.emitted.push(name); } };
  const m = new ObjectivesManager(dispatcher);
  m.initialize([{ aimId: 'get_in', title: 'Get in', status: 'active', order: 0,
                  tasks: [task('tailgate_in'), task('find_file')] }]);
  window.objectivesManager = m;
  const sync = new StateSync();
  sync.writeGlobal = writeGlobal;
  Object.assign(console, quiet);
  return { sync, m, dispatcher, broadcasts, events, inkVars };
}

function render(m) {
  const panel = Object.create(ObjectivesPanel.prototype);
  Object.assign(panel, { content: { innerHTML: '', querySelector: () => null },
                         aimCollapsed: {}, aimStatus: {}, manager: m });
  panel.escapeHtml = (s) => String(s);
  panel.render(m.getActiveAims());
  return panel.content.innerHTML;
}

const credit = { success: true, serverGlobals: { kp_badge_tailgated: true }, serverCompletedTasks: ['tailgate_in'] };

test('a sync answer with serverGlobals applies them to gameState, ink and listeners, and they are not echoed', async () => {
  const { sync, broadcasts, events, inkVars } = setup();
  await sync.sync();
  reply = url => (url.includes('sync_state') ? credit : { success: true });
  window.gameState.globalVariables.courier_ready = false; // something to send
  await sync.sync();

  assert.equal(window.gameState.globalVariables.kp_badge_tailgated, true, 'gameState holds the credit');
  assert.deepEqual(broadcasts, [['kp_badge_tailgated', true]], 'cached ink stories hear it');
  assert.equal(inkVars.kp_badge_tailgated, true, 'the open chat story (the debrief) sees it');
  assert.ok(events.some(([n]) => n === 'global_variable_changed:kp_badge_tailgated'), 'listeners hear it');

  reply = () => ({ success: true });
  window.gameState.globalVariables.courier_ready = true;
  const before = requests.length;
  await sync.sync();
  const next = requests.slice(before).find(r => r.url.includes('sync_state'));
  assert.ok(next, 'a later change still syncs');
  assert.equal(next.body.globalVariables?.kp_badge_tailgated, undefined, 'the server-written global is not sent back');
});

test('serverCompletedTasks completes the task locally with no completion POST; the panel ticks it', async () => {
  const { sync, m, dispatcher } = setup();
  reply = url => (url.includes('sync_state') ? credit : { success: true });
  await sync.sync();

  assert.equal(m.getTask('tailgate_in').status, 'completed');
  assert.ok(dispatcher.emitted.includes('objective_task_completed:tailgate_in'), 'eventMappings and ink hear it');
  assert.equal(requests.filter(r => !r.url.includes('sync_state')).length, 0, 'no second POST of the completion');
  assert.match(render(m), /tailgate_in/);
  assert.equal(m.getAim('get_in').status, 'active', 'the aim still has an open task');
});

test('a stale answer still applies what the server wrote', async () => {
  const { sync, m } = setup();
  reply = url => (url.includes('sync_state') ? { ...credit, stale: true } : { success: true });
  await sync.sync();
  assert.equal(window.gameState.globalVariables.kp_badge_tailgated, true);
  assert.equal(m.getTask('tailgate_in').status, 'completed');
});

test('a door unlock answer with server writes is applied too (viaCredential)', async () => {
  const { sync, m } = setup();
  window.stateSync = sync;
  reply = () => ({ success: true, type: 'door', roomData: {},
                   serverGlobals: { kp_records_cloned: true }, serverCompletedTasks: ['tailgate_in'] });
  const answer = await ApiClient.unlock('door', 'secure_area', null, 'rfid');
  assert.equal(answer.type, 'door', 'the answer is returned unchanged');
  assert.equal(window.gameState.globalVariables.kp_records_cloned, true);
  assert.equal(m.getTask('tailgate_in').status, 'completed');
  assert.equal(requests.length, 1, 'only the unlock request');
  delete window.stateSync;
});

test('a task already done, in flight or unknown is left alone; a server-owned global is never applied', async () => {
  const { sync, m, dispatcher } = setup();
  m.getTask('find_file').status = 'completing';
  sync.applyServerWrites({ serverGlobals: { se_captures: { x: 1 } }, serverCompletedTasks: ['find_file', 'nope', 7] });
  assert.equal(m.getTask('find_file').status, 'completing', 'its own POST finishes it');
  assert.equal(window.gameState.globalVariables.se_captures, undefined);
  assert.equal(dispatcher.emitted.length, 0);

  assert.equal(m.applyServerCompletedTask('tailgate_in'), true);
  assert.equal(m.applyServerCompletedTask('tailgate_in'), false, 'twice completes once');
  assert.equal(dispatcher.emitted.filter(n => n === 'objective_task_completed:tailgate_in').length, 1);
});
