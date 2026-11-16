// The playtest harness's --capture-responses option (access model plan, step 6):
// response-capture.js writes one line per JSON response from the game server,
// tagged with the session log line of the command that was running. Driven with
// stub responses, so no browser is launched.
// Run with: bin/test-js test/js/playtest-session-capture.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const require = createRequire(import.meta.url);
const scripts = join(root, '.claude/skills/playtest-scenario/scripts');
const { createResponseCapture } = require(join(scripts, 'response-capture.js'));

const ORIGIN = 'http://127.0.0.1:3001';

/** A stub Playwright response. `delay` holds the body back, to test ordering. */
function res(path, { method = 'GET', status = 200, type = 'application/json; charset=utf-8', body = {}, raw, delay = 0, fail, origin = ORIGIN, postData = null } = {}) {
  return {
    url: () => origin + path,
    status: () => status,
    headers: () => (type ? { 'content-type': type } : {}),
    request: () => ({ method: () => method, postData: typeof postData === 'function' ? postData : () => postData }),
    text: () => new Promise((resolve, reject) => setTimeout(() => {
      if (fail) reject(new Error(fail));
      else resolve(raw !== undefined ? raw : JSON.stringify(body));
    }, delay))
  };
}

function fresh() {
  const dir = mkdtempSync(join(tmpdir(), 'capture-'));
  const file = join(dir, 'sub', 'responses.jsonl');
  return { file, cap: createResponseCapture({ file, origin: ORIGIN }) };
}

const lines = (file) => readFileSync(file, 'utf8').trim().split('\n').map(l => JSON.parse(l));

test('one line per JSON response, with the running command\'s log line', async () => {
  const { file, cap } = fresh();
  cap.onResponse(res('/break_escape/games/7/scenario', { body: { startRoom: 'lobby' } }));
  cap.startCommand(12, 'enter');
  cap.onResponse(res('/break_escape/games/7/room/finance', { body: { room: { id: 'finance' } } }));
  cap.onResponse(res('/break_escape/games/7/unlock', { method: 'POST', status: 422, body: { success: false } }));
  cap.endCommand();
  cap.onResponse(res('/break_escape/games/7/sync_state', { method: 'PUT', body: { success: true } }));
  cap.startCommand(15, 'interact');
  cap.onResponse(res('/break_escape/games/7/login_accounts?pc_id=jake_pc', { body: { loginAccounts: [] } }));
  await cap.flush();

  const got = lines(file);
  assert.equal(got.length, 5);
  assert.equal(cap.count, 5);
  assert.deepEqual(got.map(l => l.n), [1, 2, 3, 4, 5]);
  for (const l of got) assert.match(l.t, /^\d{4}-\d\d-\d\dT/);

  assert.equal(got[0].path, '/break_escape/games/7/scenario');
  assert.equal(got[0].cmdSeq, null, 'a response before the first command has no command');
  assert.equal(got[0].cmdActive, false);
  assert.deepEqual(got[0].body, { startRoom: 'lobby' });

  assert.equal(got[1].cmdSeq, 12);
  assert.equal(got[1].cmd, 'enter');
  assert.equal(got[1].cmdActive, true);
  assert.equal(got[1].method, 'GET');

  assert.equal(got[2].method, 'POST');
  assert.equal(got[2].status, 422, 'refusals are kept');
  assert.equal(got[2].cmdSeq, 12);

  assert.equal(got[3].cmdSeq, 12, 'between commands the last command is named');
  assert.equal(got[3].cmdActive, false);

  assert.equal(got[4].path, '/break_escape/games/7/login_accounts');
  assert.equal(got[4].query, 'pc_id=jake_pc');
  assert.equal(got[4].cmdSeq, 15);
});

test('static files, other origins, redirects and non-JSON responses are not recorded', async () => {
  const { file, cap } = fresh();
  cap.onResponse(res('/break_escape/js/main.js', { type: 'application/javascript', raw: 'x' }));
  cap.onResponse(res('/break_escape/assets/rooms/office.json', { body: { layers: [] } }));
  cap.onResponse(res('/break_escape/games/7/scenario', { origin: 'http://127.0.0.1:9999' }));
  cap.onResponse(res('/break_escape/games/7', { status: 302 }));
  cap.onResponse(res('/break_escape/games/7/tts', { method: 'POST', type: 'audio/mpeg', raw: 'mp3' }));
  cap.onResponse(res('/break_escape/games/7', { type: 'text/html', raw: '<html>' }));
  cap.onResponse(res('/break_escape/games/7/ink', { body: { inkVersion: 21 } }));
  await cap.flush();
  const got = lines(file);
  assert.equal(got.length, 1);
  assert.equal(got[0].path, '/break_escape/games/7/ink');
});

test('lines keep arrival order when bodies resolve out of order', async () => {
  const { file, cap } = fresh();
  cap.startCommand(3, 'brief');
  cap.onResponse(res('/break_escape/games/7/room/a', { delay: 40, body: { a: 1 } }));
  cap.startCommand(4, 'enter');
  cap.onResponse(res('/break_escape/games/7/room/b', { delay: 0, body: { b: 2 } }));
  await cap.flush();
  const got = lines(file);
  assert.deepEqual(got.map(l => l.path), ['/break_escape/games/7/room/a', '/break_escape/games/7/room/b']);
  assert.deepEqual(got.map(l => l.cmdSeq), [3, 4], 'each keeps the command running when it arrived');
});

test('a body that does not parse or cannot be read still gets its line', async () => {
  const { file, cap } = fresh();
  cap.onResponse(res('/break_escape/games/7/a', { raw: 'not json' }));
  cap.onResponse(res('/break_escape/games/7/b', { fail: 'Response body is unavailable' }));
  await cap.flush();
  const [a, b] = lines(file);
  assert.equal(a.bodyText, 'not json');
  assert.equal(a.body, undefined);
  assert.match(b.bodyError, /unavailable/);
});

test('the command name is recorded, never its arguments', async () => {
  const { file, cap } = fresh();
  cap.startCommand(9, 'lock');
  cap.onResponse(res('/break_escape/games/7/unlock', { method: 'POST', body: { success: true } }));
  await cap.flush();
  const [l] = lines(file);
  assert.equal(l.cmd, 'lock');
  assert.deepEqual(Object.keys(l).sort(),
    ['body', 'cmd', 'cmdActive', 'cmdSeq', 'method', 'n', 't', 'path', 'status'].sort());
});

test('a /feed_post line records the npc_id its request asked for, even when the body is lost', async () => {
  const { file, cap } = fresh();
  const FEED = '/break_escape/games/7/feed_post';
  cap.onResponse(res(FEED, { method: 'POST', postData: JSON.stringify({ npc_id: 'jake', object_id: null }), body: { npcId: 'jake' } }));
  cap.onResponse(res(FEED, { method: 'POST', postData: JSON.stringify({ npc_id: 'lena' }), fail: 'Response body is unavailable' }));
  await cap.flush();
  const [a, b] = lines(file);
  assert.equal(a.npcId, 'jake');
  assert.equal(b.npcId, 'lena', 'a lost body still names its NPC');
  assert.match(b.bodyError, /unavailable/);
});

test('npcId is left out when the request body is null, not JSON, names no NPC or throws', async () => {
  const { file, cap } = fresh();
  const FEED = '/break_escape/games/7/feed_post';
  for (const postData of [null, 'npc_id=jake', '"jake"', JSON.stringify({ npc_id: 7 }), JSON.stringify({ npc_id: '  ' }), JSON.stringify(null),
    () => { throw new Error('gone'); }]) {
    cap.onResponse(res(FEED, { method: 'POST', postData, body: {} }));
  }
  cap.onResponse(res(FEED, { method: 'POST', postData: JSON.stringify({ npc_id: 'omar' }), body: {} }));
  cap.onResponse(res('/break_escape/games/7/unlock', { method: 'POST', postData: JSON.stringify({ npc_id: 'jake' }), body: {} }));
  await cap.flush();
  const got = lines(file);
  assert.equal(got.length, 9, 'every line is still written');
  assert.deepEqual(got.filter(l => 'npcId' in l).map(l => [l.n, l.npcId]), [[8, 'omar']], 'only the valid /feed_post line is tagged');
});

test('npcId is left out when the query string names an npc_id (the server takes the query over the body)', async () => {
  const { file, cap } = fresh();
  const body = JSON.stringify({ npc_id: 'jake' });
  cap.onResponse(res('/break_escape/games/7/feed_post?npc_id=lena', { method: 'POST', postData: body, body: {} }));
  cap.onResponse(res('/break_escape/games/7/feed_post?npc_id%5B%5D=lena', { method: 'POST', postData: body, body: {} }));
  cap.onResponse(res('/break_escape/games/7/feed_post?x=1;npc_id=lena', { method: 'POST', postData: body, body: {} }));
  cap.onResponse(res('/break_escape/games/7/feed_post?x=1', { method: 'POST', postData: body, body: {} }));
  await cap.flush();
  const got = lines(file);
  assert.deepEqual(got.map(l => l.npcId ?? null), [null, null, null, 'jake'], 'Rack also splits on ;');
  assert.equal(got[0].query, 'npc_id=lena');
});

test('every POST /inventory line carries inv read from the request body (E0.3 plant tagging)', async () => {
  const { file, cap } = fresh();
  const INV = '/break_escape/games/7/inventory';
  cap.onResponse(res(INV, { method: 'POST', postData: JSON.stringify({ action_type: 'remove', item: { id: 'kit_rogue_ap' }, used_on: 'rogue_ap_spot' }) }));
  cap.onResponse(res(INV, { method: 'POST', postData: JSON.stringify({ actionType: 'remove', item: { id: 'usb_1' }, usedOn: 'desk' }) }));
  cap.onResponse(res(INV, { method: 'POST', postData: JSON.stringify({ action_type: 'remove', item: { id: 'coffee' } }) }));
  cap.onResponse(res(INV, { method: 'POST', postData: JSON.stringify({ action_type: 'add', item: { id: 'key_1', type: 'key' } }) }));
  cap.onResponse(res('/break_escape/games/7/unlock', { method: 'POST', postData: JSON.stringify({ action_type: 'remove', item: { id: 'x' } }) }));
  cap.onResponse(res(INV, { method: 'GET' }));
  await cap.flush();
  const got = lines(file);
  assert.deepEqual(got[0].inv, { action: 'remove', itemId: 'kit_rogue_ap', usedOn: 'rogue_ap_spot' });
  assert.deepEqual(got[1].inv, { action: 'remove', itemId: 'usb_1', usedOn: 'desk' }, 'the camelCase names the controller also reads');
  assert.deepEqual(got[2].inv, { action: 'remove', itemId: 'coffee', usedOn: null });
  assert.deepEqual(got[3].inv, { action: 'add', itemId: 'key_1', usedOn: null });
  assert.ok(!('inv' in got[4]), 'only POST /inventory is tagged');
  assert.ok(!('inv' in got[5]), 'a GET is not tagged');
  assert.ok(!JSON.stringify(got).includes('"type":"key"'), 'the tag holds only action, item id and used_on, never the request body');
});

test('inv is null when the inventory request body cannot be read', async () => {
  const { file, cap } = fresh();
  const INV = '/break_escape/games/7/inventory';
  for (const postData of [null, '', 'action_type=remove&item[id]=kit', '"remove"', JSON.stringify(null), JSON.stringify([1]),
    () => { throw new Error('gone'); }]) {
    cap.onResponse(res(INV, { method: 'POST', postData }));
  }
  await cap.flush();
  const got = lines(file);
  assert.equal(got.length, 7);
  for (const l of got) assert.ok('inv' in l && l.inv === null, `line ${l.n} carries inv: null`);
});

test('inv is null when the query names a field the controller reads (the query beats the body)', async () => {
  const { file, cap } = fresh();
  const body = JSON.stringify({ action_type: 'remove', item: { id: 'kit_rogue_ap' }, used_on: 'rogue_ap_spot' });
  const INV = '/break_escape/games/7/inventory';
  for (const q of ['?used_on=elsewhere', '?usedOn=x', '?item%5Bid%5D=other', '?item=other', '?action_type=add', '?actionType=add', '?x=1;used_on=y']) {
    cap.onResponse(res(INV + q, { method: 'POST', postData: body }));
  }
  cap.onResponse(res(INV + '?itemCount=2', { method: 'POST', postData: body }));
  await cap.flush();
  const got = lines(file);
  assert.deepEqual(got.slice(0, 7).map(l => l.inv), Array(7).fill(null));
  assert.deepEqual(got[7].inv, { action: 'remove', itemId: 'kit_rogue_ap', usedOn: 'rogue_ap_spot' }, 'an unrelated query name does not decline');
});

test('playtest-session.js wires --capture-responses through the module', () => {
  const src = readFileSync(join(scripts, 'playtest-session.js'), 'utf8');
  assert.ok(existsSync(join(scripts, 'response-capture.js')));
  assert.match(src, /require\('\.\/response-capture'\)/);
  assert.match(src, /argv\['capture-responses'\]/);
  assert.match(src, /context\.on\('response'/, 'listens on the context, before the first navigation');
  assert.ok(src.indexOf("context.on('response'") < src.indexOf('await page.goto('), 'installed before page.goto');
  assert.match(src, /const inSeq = logLine\('in'/);
  assert.match(src, /responseCapture\.startCommand\(inSeq/);
  assert.match(src, /responseCapture\.endCommand\(\)/);
  assert.match(src, /await responseCapture\.flush\(\)/);
});
