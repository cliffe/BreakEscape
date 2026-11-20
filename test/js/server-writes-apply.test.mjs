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
  s => s.split("'../utils/display-dashes.js'").join("'./display-dashes.mjs'").split("'./modal-stack.js'").join("'./modal-stack.mjs'").split("'./hud-lanes.js'").join("'./hud-lanes.mjs'"));
copy('ui/hud-lanes.js', 'hud-lanes.mjs');
writeFileSync(join(dir, 'modal-stack.mjs'), 'export const openModalCount = () => 0;\n');
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
  const html = render(m);
  assert.equal((html.match(/task-completed/g) || []).length, 1, 'the panel ticks the credited task');
  assert.match(html, /task-completed[^]*tailgate_in/);
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

test('a reduced keepalive flush applies the server writes of its answer', async () => {
  const { sync, m } = setup();
  await sync.sync();
  reply = url => (url.includes('sync_state') ? credit : { success: true });
  window.gameState.notes = [{ id: 'big', title: 'B', text: 'x'.repeat(70000) }]; // over the flush budget
  window.gameState.globalVariables.courier_ready = false;
  const before = requests.length;
  sync.flush({ reason: 'hidden' });
  await new Promise(r => setTimeout(r, 50));
  const sent = requests.slice(before).find(r => r.url.includes('sync_state'));
  assert.ok(sent, 'the flush went up');
  assert.equal(sent.body.notes, undefined, 'it was the reduced body (notes left out)');
  assert.equal(window.gameState.globalVariables.kp_badge_tailgated, true);
  assert.equal(m.getTask('tailgate_in').status, 'completed');
  delete window.gameState.notes;
});

test('an older answer cannot overwrite a newer server write of the same global', () => {
  const { sync } = setup();
  sync.applyServerWrites({ serverGlobals: { stage: 'two' } }, 200);
  sync.applyServerWrites({ serverGlobals: { stage: 'one' } }, 100);
  assert.equal(window.gameState.globalVariables.stage, 'two', 'the late older answer is ignored');
  sync.applyServerWrites({ serverGlobals: { stage: 'three' } }, 300);
  assert.equal(window.gameState.globalVariables.stage, 'three', 'a newer one still applies');
  sync.applyServerWrites({ serverGlobals: { other: 'a' } }, 100);
  assert.equal(window.gameState.globalVariables.other, 'a', 'another name is unaffected');
});

test('a late door unlock answer cannot overwrite a newer sync answer', async () => {
  const { sync } = setup();
  window.stateSync = sync;
  let release;
  const gate = new Promise(r => { release = r; });
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), body: init?.body ? JSON.parse(init.body) : null });
    if (String(url).includes('unlock')) await gate;
    const json = String(url).includes('unlock')
      ? { success: true, type: 'door', serverGlobals: { stage: 'old' } }
      : { success: true, serverGlobals: { stage: 'new' } };
    return { ok: true, status: 200, statusText: '', json: async () => json };
  };
  const unlock = ApiClient.unlock('door', 'secure_area', null, 'rfid'); // stamped first
  window.gameState.globalVariables.courier_ready = false;
  await sync.sync(); // a newer request, answered first
  assert.equal(window.gameState.globalVariables.stage, 'new');
  release();
  await unlock;
  assert.equal(window.gameState.globalVariables.stage, 'new', 'the older unlock answer lands late and is ignored');
  delete window.stateSync;
  globalThis.fetch = async (url, init) => {
    const body = init?.body ? JSON.parse(init.body) : null;
    requests.push({ url: String(url), body });
    return { ok: true, status: 200, statusText: '', json: async () => reply(String(url), body) };
  };
});

test('a credit that concluded the mission runs the ending on the client', () => {
  const { sync, m, dispatcher } = setup();
  sync.applyServerWrites({ serverCompletedTasks: ['tailgate_in'], serverMissionConcluded: 'tailgate_in' });
  assert.ok(dispatcher.emitted.includes('mission_concluded'), 'the conclusion event fires');
  sync.applyServerWrites({ serverMissionConcluded: 'nope' }); // unknown task: ignored, no throw
  assert.equal(m.getTask('tailgate_in').status, 'completed');
});

test('a credit on a task outside the conclusion aim runs the missionConclusion aim ending', () => {
  const { sync, m } = setup();
  const concluded = [];
  m.eventDispatcher.emit = (name, data) => { if (name === 'mission_concluded') concluded.push(data.aimId); };
  m.aimIndex.finale = { aimId: 'finale', missionConclusion: true, status: 'active', tasks: [] };
  sync.applyServerWrites({ serverCompletedTasks: ['tailgate_in'], serverMissionConcluded: 'tailgate_in' });
  assert.deepEqual(concluded, ['finale'], 'the conclusion aim, not the credited task aim, concludes');
});

test('a task still completing locally that the server refuses stays completed when the server credited it', async () => {
  const { sync, m } = setup();
  window.gameState.globalVariables.x = 1;
  reply = url => {
    if (url.includes('tailgate_in')) {
      // the credit lands while this POST is in flight, then the server refuses the POST
      sync.applyServerWrites({ serverCompletedTasks: ['tailgate_in'] });
      return { success: false, error: 'Task is server-completed only' };
    }
    return { success: true };
  };
  await m.completeTask('tailgate_in');
  assert.equal(m.getTask('tailgate_in').status, 'completed', 'the server completion wins');
});

test('a refused completion with no server credit still reverts to active', async () => {
  const { m } = setup();
  reply = () => ({ success: false, error: 'Not yet' });
  await m.completeTask('find_file');
  assert.equal(m.getTask('find_file').status, 'active');
});

test('a credited task with onComplete.setGlobal announces the global once', () => {
  const { sync, events } = setup();
  window.objectivesManager.taskIndex.tailgate_in.onComplete = { setGlobal: { kp_badge_tailgated: true } };
  sync.applyServerWrites({ serverGlobals: { kp_badge_tailgated: true }, serverCompletedTasks: ['tailgate_in'] });
  const heard = events.filter(([n]) => n === 'global_variable_changed:kp_badge_tailgated');
  assert.equal(heard.length, 1, 'one global_variable_changed, not two');
});
