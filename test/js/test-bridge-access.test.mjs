// window.__test.access (access model plan, step 6): the read-only access block of the
// test bridge, over a stub window with a real WorkstationState.
// Run with: bin/test-js test/js/test-bridge-access.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'test-bridge-access-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
mkdirSync(join(dir, 'systems/test-bridge'), { recursive: true });
writeFileSync(join(dir, 'systems/test-bridge/access.js'), readFileSync(join(js, 'systems/test-bridge/access.js'), 'utf8'));
writeFileSync(join(dir, 'systems/workstation-state.js'), readFileSync(join(js, 'systems/workstation-state.js'), 'utf8'));
writeFileSync(join(dir, 'systems/screen-states.js'), readFileSync(join(js, 'systems/screen-states.js'), 'utf8'));

globalThis.window = {};
const { accessBridge } = await import(pathToFileURL(join(dir, 'systems/test-bridge/access.js')));
const { WorkstationState } = await import(pathToFileURL(join(dir, 'systems/workstation-state.js')));

function installWorkstations(objects, npcs, extraEnv = {}) {
  const events = [];
  const env = {
    objects: () => objects, npcs: () => npcs, globals: () => ({}),
    on: () => {}, emit: (n, d) => events.push([n, d]), setGlobal: () => {}, roll: () => 0.9, ...extraEnv
  };
  window.workstationState = new WorkstationState(env);
  return { ws: window.workstationState, events };
}

test('the bridge exposes the access block', () => {
  const src = readFileSync(join(js, 'systems/test-bridge/index.js'), 'utf8');
  assert.match(src, /import \{ accessBridge \} from '\.\/access\.js';/);
  assert.match(src, /\baccess: accessBridge,/);
  assert.deepEqual(Object.keys(accessBridge).sort(), ['footholds', 'networkView', 'reports', 'savedCards', 'screenTransitions', 'sessions', 'work', 'workstation']);
});

test('sessions() is empty without pc-sessions.js, and reads its list() or sessions map', () => {
  delete window.pcSessions;
  assert.deepEqual(accessBridge.sessions(), []);
  const s = { npcId: 'jake', username: 'jbrooks', displayName: 'Jake Brooks', via: 'password' };
  window.pcSessions = { list: () => [{ pcId: 'jake_pc', ...s }] };
  assert.deepEqual(accessBridge.sessions(), [{ pcId: 'jake_pc', ...s }]);
  window.pcSessions = { sessions: new Map([['jake_pc', s]]) };
  assert.deepEqual(accessBridge.sessions(), [{ pcId: 'jake_pc', ...s }]);
  delete window.pcSessions;
});

test('workstation() reports owner, presence, the away record and the screen', () => {
  const pc = { id: 'jake_pc', lockChance: 0.5 };
  const { ws } = installWorkstations([pc, { id: 'lamp' }], [{ id: 'jake', needsHome: 'jake_pc' }]);
  let r = accessBridge.workstation('jake_pc');
  assert.deepEqual(r, { ok: true, id: 'jake_pc', workstation: true, owner: 'jake', present: true,
                        away: null, screenLocked: null, lockAt: null, texture: null, displayWidth: null, displayHeight: null, lockedLook: false });

  ws.onLeft('jake'); // roll 0.9 >= 0.5: left open
  r = accessBridge.workstation('jake_pc');
  assert.equal(r.present, false);
  assert.deepEqual(r.away, { away: true, leaves: 1, leftAt: 0, expectedAwayMs: null });
  assert.equal(r.screenLocked, false);

  ws.onReturned('jake');
  r = accessBridge.workstation('jake_pc');
  assert.equal(r.present, true);
  assert.deepEqual(r.away, { away: false, leaves: 1, leftAt: 0, expectedAwayMs: null });

  r = accessBridge.workstation('lamp');
  assert.equal(r.workstation, false);
  assert.equal(r.owner, null);
  assert.equal(r.present, null);

  assert.deepEqual(accessBridge.workstation('nope'), { ok: false, reason: 'unknown-object', id: 'nope' });
});

test('workstation() uses ownerPresent and lockAt when the module has them, and copies, never shares', () => {
  const pc = { id: 'jake_pc', locksScreenOnLeave: false, lockAt: 300000 };
  const { ws } = installWorkstations([pc], [{ id: 'jake', needsHome: 'jake_pc' }], { ownerPresent: () => false });
  const r = accessBridge.workstation('jake_pc');
  assert.equal(r.present, false, 'ownerPresent wins over the away map');
  assert.equal(r.lockAt, 300000);
  ws.onLeft('jake');
  const before = accessBridge.workstation('jake_pc');
  before.away.away = 'changed';
  assert.equal(ws.away.get('jake').away, true, 'the returned record is a copy');
});

test('workstation() without the module says so', () => {
  delete window.workstationState;
  assert.deepEqual(accessBridge.workstation('jake_pc'), { ok: false, reason: 'no-workstation-state' });
});

test('savedCards() lists the copier\'s card ids', () => {
  window.inventory = { items: [] };
  assert.deepEqual(accessBridge.savedCards(), []);
  window.lockRef = (d) => d.key_id || null;
  window.inventory.items = [
    { scenarioData: { type: 'keycard', card_id: 'HELD' } },
    { scenarioData: { type: 'rfid_cloner', saved_cards: [{ card_id: '4F00A1C2', name: 'x' }, { key_id: 'legacy' }, {}] } }
  ];
  assert.deepEqual(accessBridge.savedCards(), ['4F00A1C2', 'legacy', null]);
});

test('workstation() reports the live sprite\'s texture, display size and locked look; screenTransitions() copies the module\'s record', () => {
  const pc = { id: 'jake_pc', workstation: true };
  installWorkstations([pc], [{ id: 'jake', needsHome: 'jake_pc' }]);
  const sprite = { scenarioData: pc, texture: { key: 'pc_desktop' }, displayWidth: 36, displayHeight: 24 };
  window.rooms = { office: { objects: { o1: sprite } } };
  let r = accessBridge.workstation('jake_pc');
  assert.equal(r.texture, 'pc_desktop');
  assert.deepEqual([r.displayWidth, r.displayHeight], [36, 24]);
  assert.equal(r.lockedLook, false);
  sprite.texture = { key: 'pc_desktop_locked' }; sprite._screenLocked = true;
  r = accessBridge.workstation('jake_pc');
  assert.equal(r.texture, 'pc_desktop_locked');
  assert.equal(r.lockedLook, true);
  assert.deepEqual([r.displayWidth, r.displayHeight], [36, 24]);

  delete window.screenStates;
  assert.deepEqual(accessBridge.screenTransitions(), []);
  const transitions = [{ objectId: 'jake_pc', locked: true, sound: 'lockpick_set', at: 5 }];
  window.screenStates = { transitions };
  const out = accessBridge.screenTransitions();
  assert.deepEqual(out, transitions);
  out[0].locked = false;
  assert.equal(transitions[0].locked, true);
  delete window.rooms; delete window.screenStates;
});

// Networks (ACCESS_MODEL_SLICE_9_3_PLAN.md, step 6): the client's footholds and last views.
test('footholds() is empty without network-links.js, and reads its list() or footholds', () => {
  delete window.networkLinks;
  assert.deepEqual(accessBridge.footholds(), []);
  const f = { via: 'jack', name: 'Drop box: comms room', itemId: 'netlink_jack_comms_port', sourceId: 'comms_port',
              network: { id: 'office_lan', name: 'Harbour office LAN' } };
  window.networkLinks = { list: () => [{ id: 'jack_comms_port', ...f }] };
  assert.deepEqual(accessBridge.footholds(), [{ id: 'jack_comms_port', ...f }]);
  window.networkLinks = { footholds: new Map([['jack_comms_port', f]]) };
  assert.deepEqual(accessBridge.footholds(), [{ id: 'jack_comms_port', ...f }]);
  window.networkLinks = { footholds: { jack_comms_port: f } };
  assert.deepEqual(accessBridge.footholds(), [{ id: 'jack_comms_port', ...f }]);
  const held = [{ id: 'jack_comms_port', ...f }];
  window.networkLinks = { footholds: held };
  const out = accessBridge.footholds();
  out[0].name = 'changed';
  assert.equal(held[0].name, 'Drop box: comms room', 'the returned list is a copy');
  delete window.networkLinks;
});

test('networkView() returns the last view fetched for a foothold, or null', () => {
  delete window.networkLinks;
  assert.equal(accessBridge.networkView('jack_comms_port'), null);
  const view = { id: 'jack_comms_port', via: 'jack', name: 'Drop box', network: { id: 'office_lan', name: 'LAN' },
                 hosts: [{ id: 'lena_pc', kind: 'pc', name: "Lena's PC", host: 'HB-FIN-02', remoteSignIn: true }] };
  window.networkLinks = { lastView: id => (id === 'jack_comms_port' ? view : undefined) };
  assert.deepEqual(accessBridge.networkView('jack_comms_port'), view);
  assert.equal(accessBridge.networkView('jack_other'), null);
  window.networkLinks = { views: new Map([['jack_comms_port', view]]) };
  assert.deepEqual(accessBridge.networkView('jack_comms_port'), view);
  window.networkLinks = { views: { jack_comms_port: view } };
  const out = accessBridge.networkView('jack_comms_port');
  assert.deepEqual(out, view);
  out.hosts[0].name = 'changed';
  assert.equal(view.hosts[0].name, "Lena's PC", 'the returned view is a copy');
  assert.equal(accessBridge.networkView('jack_other'), null);
  delete window.networkLinks;
});

test('the event log keeps network_* events (slice 9.3a step 8)', async () => {
  writeFileSync(join(dir, 'systems/test-bridge/wait.js'), 'export function safeJson(v) { return JSON.parse(JSON.stringify(v ?? null)); }\n');
  writeFileSync(join(dir, 'systems/test-bridge/log.js'), readFileSync(join(js, 'systems/test-bridge/log.js'), 'utf8'));
  globalThis.performance ??= { now: () => 0 };
  const emitted = [];
  window.eventDispatcher = { emit: (n, d) => emitted.push(n) };
  const log = await import(pathToFileURL(join(dir, 'systems/test-bridge/log.js')));
  assert.equal(log.installEventCapture(), true);
  window.eventDispatcher.emit('network_viewed', { networkId: 'office_lan' });
  window.eventDispatcher.emit('network_view_closed:jack_comms_port', { reason: 'closed' });
  window.eventDispatcher.emit('npc_tick_chatter_x', {});
  window.eventDispatcher.emit('some_noise', {});
  assert.deepEqual(log.peek().map(e => e.event), ['network_viewed', 'network_view_closed:jack_comms_port', 'npc_tick_chatter_x']);
  assert.equal(emitted.length, 4, 'every event still reaches the dispatcher');
});

test('slice 9.2: work(npcId) reads the plan and the needs state; reports() reads npc-reports.js', () => {
  delete window.npcReports;
  assert.deepEqual(accessBridge.reports(), { requests: 0, reports: 0, pending: 0, settled: [] });
  window.npcReports = { requests: 2, sent: 3, pending: [{}], settled: new Set(['kai']) };
  assert.deepEqual(accessBridge.reports(), { requests: 2, reports: 3, pending: 1, settled: ['kai'] });
  window.npcManager = { getNPC: id => (id === 'dana' ? { id, work: { breakDrain: 10, needs: [] } } : null) };
  window.npcNeedsSystem = { getState: id => (id === 'dana' ? { frustration: 20, tell: 1, settled: false, failed: null, parked: [] } : null) };
  assert.deepEqual(accessBridge.work('dana'), { plan: { breakDrain: 10, needs: [] }, frustration: 20, tell: 1, settled: false, failed: null, parked: [] });
  assert.equal(accessBridge.work('nobody'), null);
  delete window.npcReports; delete window.npcManager; delete window.npcNeedsSystem;
});
