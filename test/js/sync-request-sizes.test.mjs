// Request-size guard for the player-state sync-delta work (SYNC_DELTAS_PLAN 10.1).
//
// The q77 rule: synced player state must stay bounded and change by delta. These
// cases measure the real request bodies where the client builds them, never in a
// Rails test that builds its own body, and fail if a body grows past its bound.
//
// Each builder case writes the body it built to test/fixtures/files/sync_bodies/*.json
// through the --write-fixtures switch, and otherwise asserts the committed fixture
// still matches what the builder now produces, so the Rails answer-size test
// (sync_payload_size_test.rb, 10.2) posts exactly what the real client sends.
//
//   node --test test/js/sync-request-sizes.test.mjs              # check
//   node test/js/sync-request-sizes.test.mjs --write-fixtures    # regenerate fixtures
//
// The browser modules are copied to a temp dir as .mjs (the repo has no
// "type": "module"), as the other sync tests do.

import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const fixturesDir = join(here, '../fixtures/files/sync_bodies');
const WRITE = process.argv.includes('--write-fixtures') || process.env.SYNC_WRITE_FIXTURES === '1';

const quiet = { log: () => {}, warn: () => {}, error: () => {}, info: () => {}, debug: () => {} };
const bytes = v => Buffer.byteLength(JSON.stringify(v), 'utf8');

// Compare the body a builder just produced against the committed fixture, or write
// it when --write-fixtures is set. Keeps the Rails test posting the real client body.
function fixture(name, body) {
  const path = join(fixturesDir, `${name}.json`);
  if (WRITE) {
    mkdirSync(fixturesDir, { recursive: true });
    writeFileSync(path, JSON.stringify(body, null, 2) + '\n');
    return;
  }
  assert.ok(existsSync(path), `fixture ${name}.json is missing; run with --write-fixtures`);
  const saved = JSON.parse(readFileSync(path, 'utf8'));
  assert.deepEqual(body, saved,
    `the ${name} body differs from the committed fixture; rerun with --write-fixtures if the builder changed on purpose`);
}

// ---- 1 & 2: StateSync.buildChanges after seedFromBootstrap -----------------------------

const syncDir = mkdtempSync(join(tmpdir(), 'sync-sizes-state-'));
{
  const copy = (src, name, fix = s => s) => writeFileSync(join(syncDir, name), fix(readFileSync(join(js, src), 'utf8')));
  const toMjs = s => s.replace(/'\.\/(api-client|config)\.js'/g, "'./$1.mjs'");
  copy('config.js', 'config.mjs');
  copy('api-client.js', 'api-client.mjs', toMjs);
  copy('state-sync.js', 'state-sync.mjs', toMjs);
}
globalThis.window = { breakEscapeConfig: { gameId: 1, apiBasePath: '/games/1', csrfToken: 't' } };
globalThis.document = { querySelector: () => null };
const { StateSync, stableJson } = await import(pathToFileURL(join(syncDir, 'state-sync.mjs')).href);
Object.assign(console, quiet);

// A loaded page with globals, notes, a phone thread, the clock and timed texts.
function loadedGame() {
  const phone = { hax: { history: [{ type: 'npc', text: 'hi', read: true }] } };
  const sent = new Map();
  Object.assign(globalThis.window, {
    gameState: { globalVariables: { briefing_played: true, intel_count: 3 }, notes: [{ id: 'n1', title: 'Lobby', text: 'A keypad by the door', sprite: {} }] },
    currentRoom: { name: 'lobby' },
    gameClock: { exportState: () => ({ elapsedMs: 600000 }) },
    scenarioTimerDispatcher: { exportState: () => ({ elapsedMs: 600000, fired: [], cancelled: [], started: {} }) },
    npcManager: {
      phone,
      exportPhoneState({ onlyChanged, keyOf = JSON.stringify }) {
        const out = {};
        for (const [id, e] of Object.entries(phone)) {
          if (onlyChanged && sent.get(id) === keyOf(e)) continue;
          out[id] = JSON.parse(JSON.stringify(e));
        }
        return out;
      },
      markPhoneStateSynced(exported, { keyOf = JSON.stringify } = {}) {
        for (const [id, e] of Object.entries(exported || {})) sent.set(id, keyOf(e));
      },
      exportTriggeredEvents: () => ({ 'hax:start:0': 1 }),
      exportNpcVisibility: () => ({}),
      exportTimedMessages: () => ({ pending: [], delivered: [] })
    }
  });
  const sync = new StateSync();
  // The page marks the restored phone threads on load, as restorePhoneState does.
  window.npcManager.markPhoneStateSynced(window.npcManager.exportPhoneState({ onlyChanged: false, keyOf: stableJson }), { keyOf: stableJson });
  return sync;
}

// The bootstrap's saved blocks, in jsonb key order (keys sorted by length then bytes),
// matching the loaded page, so a correct seed leaves nothing to send.
const savedBootstrap = (over = {}) => ({
  savedGlobalVariables: { intel_count: 3, briefing_played: true },
  savedNotes: [{ id: 'n1', text: 'A keypad by the door', title: 'Lobby' }],
  savedPhoneState: { hax: { history: [{ read: true, type: 'npc', text: 'hi' }] } },
  savedTriggeredEvents: { 'hax:start:0': 1 },
  savedCurrentRoom: 'lobby',
  savedScenarioClock: { elapsedMs: 600000, timers: { fired: [], cancelled: [], started: {} } },
  savedTimedMessages: { delivered: [], pending: [] },
  ...over
});

test('first sync after a matching load sends nothing (size 0)', () => {
  const sync = loadedGame();
  sync.seedFromBootstrap(savedBootstrap());
  const changes = sync.buildChanges();
  assert.equal(changes, null, 'a load whose saved state equals the page sends no first sync');
});

test('first sync in a different room sends only currentRoom and its riders, under 1000 bytes', () => {
  const sync = loadedGame();
  sync.seedFromBootstrap(savedBootstrap({ savedCurrentRoom: 'vault' }));
  const changes = sync.buildChanges();
  assert.ok(changes, 'a different saved room makes a first sync');
  const body = changes.body;
  assert.equal(body.currentRoom, 'lobby');
  assert.equal(body.globalVariables, undefined, 'no unchanged globals ride along');
  assert.equal(body.notes, undefined);
  assert.equal(body.phoneState, undefined, 'an unchanged thread never rides the first sync');
  assert.equal(body.triggeredEvents, undefined);
  // 3.4: currentRoom plus the clock and timed texts only.
  const allowed = new Set(['currentRoom', 'scenarioClock', 'timedMessages', 'clientTs']);
  for (const k of Object.keys(body)) assert.ok(allowed.has(k), `unexpected key ${k} in the first sync`);
  const size = bytes(body);
  assert.ok(size < 1000, `first-sync body ${size} bytes, expected < 1000`);
  fixture('buildchanges_room_only', body);
});

// ---- 3: NPCManager.exportPhoneState after a jsonb-ordered restore ----------------------

const phoneDir = mkdtempSync(join(tmpdir(), 'sync-sizes-phone-'));
{
  const copy = (src, name, fix = s => s) => writeFileSync(join(phoneDir, name), fix(readFileSync(join(js, src), 'utf8')));
  copy('systems/npc-los.js', 'npc-los.mjs');
  copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
  copy('systems/npc-manager.js', 'npc-manager.mjs', s => s
    .replace("'./npc-los.js'", "'./npc-los.mjs'")
    .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
}
globalThis.inkjs = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
const { default: NPCManager } = await import(pathToFileURL(join(phoneDir, 'npc-manager.mjs')).href);

test('exportPhoneState with keyOf=stableJson returns nothing for a jsonb-reordered restore', () => {
  const nm = new NPCManager({ on() {}, off() {}, emit() {} });
  // A phone NPC with a thread (the real _phoneStateEntry reads conversationHistory).
  nm.npcs.set('hax', { id: 'hax', npcType: 'phone', storyState: null });
  nm.conversationHistory.set('hax', [{ type: 'npc', text: 'Meet me at the vault.', read: true }]);

  const entry = nm.exportPhoneState({ onlyChanged: false, keyOf: stableJson }).hax;
  assert.ok(entry, 'the thread exports an entry');
  // A reload restores the saved thread with jsonb key order (sorted). The page marks
  // it synced from that restored copy, so an unchanged thread must not resend.
  const reordered = { history: entry.history.map(m => ({ read: m.read, text: m.text, type: m.type })) };
  nm.markPhoneStateSynced({ hax: reordered }, { keyOf: stableJson });

  const changed = nm.exportPhoneState({ onlyChanged: true, keyOf: stableJson });
  assert.deepEqual(changed, {}, 'an unchanged thread, restored in jsonb order, is not resent');
});

// ---- 4: savedCardForServer and the /clone_card body -----------------------------------

const cardDir = mkdtempSync(join(tmpdir(), 'sync-sizes-card-'));
let cloneBodies = [];
{
  const toMjs = s => s.replace(/'\.\.\/\.\.\/config\.js'/g, "'../config.mjs'");
  const copy = (src, name, fix = s => s) => writeFileSync(join(cardDir, name), fix(readFileSync(join(js, src), 'utf8')));
  copy('config.js', 'config.mjs');
  // api-client that records the clone_card body instead of fetching.
  writeFileSync(join(cardDir, 'api-client.mjs'),
    'export class ApiClient {\n' +
    '  static async post(endpoint, data = {}) { globalThis.__cloneBodies.push({ endpoint, data }); return { success: true, recorded: true, saved: true }; }\n' +
    '  static async cloneCard(source, cardId, card = null) { return this.post(\'/clone_card\', { ...source, card_id: cardId, ...(card ? { card } : {}) }); }\n' +
    '}\n');
  mkdirSync(join(cardDir, 'minigames', 'rfid'), { recursive: true });
  copy('minigames/rfid/rfid-protocols.js', 'minigames/rfid/rfid-protocols.mjs');
  copy('minigames/rfid/rfid-data.js', 'minigames/rfid/rfid-data.mjs', s => s
    .replace("'./rfid-protocols.js'", "'./rfid-protocols.mjs'")
    .replace("'../../api-client.js'", "'../../api-client.mjs'"));
}
globalThis.__cloneBodies = cloneBodies;
const { RFIDDataManager } = await import(pathToFileURL(join(cardDir, 'minigames', 'rfid', 'rfid-data.mjs')).href);
const dataMgr = new RFIDDataManager();
const { ApiClient: CardApi } = await import(pathToFileURL(join(cardDir, 'api-client.mjs')).href);

test('an EM4100 clone_card body is under 600 bytes and carries one picked card', async () => {
  const card = {
    card_id: 'ceo_keycard', name: 'CEO access card', rfid_protocol: 'EM4100',
    rfid_hex: '1A2B3C4D5E', rfid_facility: 42, rfid_card_number: 1337,
    rfid_data: { cardId: 'ceo_keycard', hex: '1A2B3C4D5E', facility: 42, cardNumber: 1337, secret: 'drop-me' },
    timestamp: 1731460000000
  };
  const saved = dataMgr.savedCardForServer(card);
  assert.equal(saved.rfid_data.secret, undefined, 'only SAVED_CARD_DATA_KEYS are kept');
  cloneBodies.length = 0;
  await CardApi.cloneCard({ object_id: 'ceo_keycard' }, 'ceo_keycard', saved);
  const body = cloneBodies[0].data;
  const size = bytes(body);
  assert.ok(size < 600, `EM4100 clone_card body ${size} bytes, expected < 600`);
  fixture('clone_card_em4100', body);
});

test('a fully cracked MIFARE Classic clone_card body is under 1500 bytes', async () => {
  const sectors = {};
  for (let s = 0; s < 16; s++) sectors[s] = { keyA: 'FFFFFFFFFFFF', keyB: 'A0A1A2A3A4A5' };
  const card = {
    card_id: 'master_keycard', name: 'Master keycard', rfid_protocol: 'MIFARE_Classic_Custom_Keys',
    rfid_data: { cardId: 'master_keycard', uid: 'DEADBEEF', sectors, masterKeyKnown: true },
    timestamp: 1731460000000
  };
  const saved = dataMgr.savedCardForServer(card);
  assert.equal(Object.keys(saved.rfid_data.sectors).length, 16, 'all 16 sectors are kept');
  cloneBodies.length = 0;
  await CardApi.cloneCard({ object_id: 'master_keycard' }, 'master_keycard', saved);
  const body = cloneBodies[0].data;
  const size = bytes(body);
  assert.ok(size < 1500, `MIFARE clone_card body ${size} bytes, expected < 1500`);
  fixture('clone_card_mifare', body);
});

// ---- 5: capture-client's `captures` sync part -----------------------------------------

const capDir = mkdtempSync(join(tmpdir(), 'sync-sizes-cap-'));
{
  const toMjs = s => s.replace(/'\.\/(api-client|config)\.js'/g, "'./$1.mjs'");
  writeFileSync(join(capDir, 'package.json'), '{"type":"module"}\n');
  mkdirSync(join(capDir, 'systems'), { recursive: true });
  writeFileSync(join(capDir, 'config.mjs'), readFileSync(join(js, 'config.js'), 'utf8'));
  writeFileSync(join(capDir, 'api-client.mjs'), toMjs(readFileSync(join(js, 'api-client.js'), 'utf8')));
  writeFileSync(join(capDir, 'state-sync.mjs'), toMjs(readFileSync(join(js, 'state-sync.js'), 'utf8')));
  writeFileSync(join(capDir, 'systems', 'captures.js'), readFileSync(join(js, 'systems/captures.js'), 'utf8'));
  writeFileSync(join(capDir, 'systems', 'global-writer.js'),
    'export function writeGlobal(name, value) { if (globalThis.window?.gameState?.globalVariables) globalThis.window.gameState.globalVariables[name] = value; }\n');
  writeFileSync(join(capDir, 'systems', 'capture-client.js'), readFileSync(join(js, 'systems/capture-client.js'), 'utf8'));
}
const { installCaptureClient } = await import(pathToFileURL(join(capDir, 'systems', 'capture-client.js')).href);

// A stub state sync that keeps the registered part, so we read the body the part builds.
function captureHarness() {
  globalThis.window.gameState = { globalVariables: {} };
  globalThis.window.stateSync = undefined;
  const stub = { part: null, registerPart(_n, p) { this.part = p; }, sync() {} };
  const client = installCaptureClient(stub);
  return { stub, client };
}

test('a single credential capture (lab_social_engineering, lord) is under 300 bytes', () => {
  const { stub, client } = captureHarness();
  assert.equal(client.submitCapture({ targetId: 'lord', kind: 'credential', address: 's.lord', roleLabel: 'Payroll officer', secret: 'never-sent' }), true);
  const part = stub.part.build();
  // The secret never rides the part: the server owns it.
  assert.deepEqual(part, [{ targetId: 'lord', kind: 'credential', address: 's.lord', roleLabel: 'Payroll officer' }]);
  const size = bytes(part);
  assert.ok(size < 300, `one credential capture part ${size} bytes, expected < 300`);
  fixture('capture_sync_social', { captures: part });
});

test('a single foothold capture (lab_physical_pentest, store_controller) is under 300 bytes', () => {
  const { stub, client } = captureHarness();
  // A foothold writer: the server composes the long note from the scenario; the client
  // sends only targetId and kind.
  assert.equal(client.submitCapture({ targetId: 'store_controller', kind: 'foothold' }), true);
  const part = stub.part.build();
  assert.deepEqual(part, [{ targetId: 'store_controller', kind: 'foothold' }]);
  const size = bytes(part);
  assert.ok(size < 300, `one foothold capture part ${size} bytes, expected < 300`);
  fixture('capture_sync_physical', { captures: part });
});

// ---- 6: capture-log seen writes, one key per new row ----------------------------------

const logDir = mkdtempSync(join(tmpdir(), 'sync-sizes-log-'));
{
  const capturesUrl = pathToFileURL(join(js, 'systems/captures.js')).href;
  writeFileSync(join(logDir, 'capture-log-model.mjs'),
    readFileSync(join(js, 'minigames/capture-log/capture-log-model.js'), 'utf8')
      .replace("'../../systems/captures.js'", `'${capturesUrl}'`));
}
const { SEEN_PREFIX, buildSections, rowKeys, readSeen, newKeys } = await import(pathToFileURL(join(logDir, 'capture-log-model.mjs')).href);

test('three new capture-log rows write three seen keys, each under 60 bytes', () => {
  // A holder with three filed findings, nothing seen yet.
  const globals = {
    se_captures: {
      store_controller: { targetId: 'store_controller', kind: 'foothold', host: 'LW-DOOR01', at: 1 },
      lord: { targetId: 'lord', kind: 'credential', address: 's.lord', at: 2 },
      len: { targetId: 'len', kind: 'credential', address: 'l.okafor', at: 3 }
    }
  };
  const sections = buildSections({ holder: { id: 'tablet', holds: { captures: true } }, items: [], globals, sessionsSource: null });
  const fresh = newKeys(sections, readSeen(globals));
  assert.equal(fresh.length, 3, 'three unseen rows');
  const body = {};
  for (const k of fresh) {
    const entry = { [SEEN_PREFIX + k]: true };
    const size = bytes(entry);
    assert.ok(size < 60, `seen key ${k} is ${size} bytes, expected < 60`);
    Object.assign(body, entry);
  }
  // The whole sync global delta for three new rows: three booleans, no growing list.
  fixture('capture_log_seen', { globalVariables: body });
});
