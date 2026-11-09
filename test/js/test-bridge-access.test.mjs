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
  assert.deepEqual(Object.keys(accessBridge).sort(), ['savedCards', 'sessions', 'workstation']);
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
                        away: null, screenLocked: null, lockAt: null });

  ws.onLeft('jake'); // roll 0.9 >= 0.5: left open
  r = accessBridge.workstation('jake_pc');
  assert.equal(r.present, false);
  assert.deepEqual(r.away, { away: true, leaves: 1 });
  assert.equal(r.screenLocked, false);

  ws.onReturned('jake');
  r = accessBridge.workstation('jake_pc');
  assert.equal(r.present, true);
  assert.deepEqual(r.away, { away: false, leaves: 1 });

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
