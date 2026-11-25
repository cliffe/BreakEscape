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
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const require = createRequire(import.meta.url);
const scripts = join(root, '.claude/skills/playtest-scenario/scripts');
const { createResponseCapture, inventoryTag, pcTag, hashTag } = require(join(scripts, 'response-capture.js'));

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
  cap.onResponse(res(INV, { method: 'POST', postData: JSON.stringify({ action_type: 'remove', item: { id: 'kit_rogue_ap' }, used_on: 'reception_planter' }) }));
  cap.onResponse(res(INV, { method: 'POST', postData: JSON.stringify({ actionType: 'remove', item: { id: 'usb_1' }, usedOn: 'desk' }) }));
  cap.onResponse(res(INV, { method: 'POST', postData: JSON.stringify({ action_type: 'remove', item: { id: 'coffee' } }) }));
  cap.onResponse(res(INV, { method: 'POST', postData: JSON.stringify({ action_type: 'add', item: { id: 'key_1', type: 'key' } }) }));
  cap.onResponse(res('/break_escape/games/7/unlock', { method: 'POST', postData: JSON.stringify({ action_type: 'remove', item: { id: 'x' } }) }));
  cap.onResponse(res(INV, { method: 'GET' }));
  await cap.flush();
  const got = lines(file);
  assert.deepEqual(got[0].inv, { action: 'remove', itemId: 'kit_rogue_ap', usedOn: 'reception_planter' });
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
  const body = JSON.stringify({ action_type: 'remove', item: { id: 'kit_rogue_ap' }, used_on: 'reception_planter' });
  const INV = '/break_escape/games/7/inventory';
  for (const q of ['?used_on=elsewhere', '?usedOn=x', '?item%5Bid%5D=other', '?item=other', '?action_type=add', '?actionType=add', '?x=1;used_on=y']) {
    cap.onResponse(res(INV + q, { method: 'POST', postData: body }));
  }
  cap.onResponse(res(INV + '?itemCount=2', { method: 'POST', postData: body }));
  await cap.flush();
  const got = lines(file);
  assert.deepEqual(got.slice(0, 7).map(l => l.inv), Array(7).fill(null));
  assert.deepEqual(got[7].inv, { action: 'remove', itemId: 'kit_rogue_ap', usedOn: 'reception_planter' }, 'an unrelated query name does not decline');
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

test('R1 t2: an empty action_type is kept as Rails keeps it, not replaced by actionType', async () => {
  const { file, cap } = fresh();
  const INV = '/break_escape/games/7/inventory';
  cap.onResponse(res(INV, { method: 'POST', postData: JSON.stringify({ action_type: '', actionType: 'remove', item: { id: 'kit' }, used_on: '', usedOn: 'desk' }) }));
  cap.onResponse(res(INV, { method: 'POST', postData: JSON.stringify({ action_type: null, actionType: 'remove', item: { id: 'kit' }, usedOn: 'desk' }) }));
  await cap.flush();
  const got = lines(file);
  assert.deepEqual(got[0].inv, { action: null, itemId: 'kit', usedOn: null });
  assert.deepEqual(got[1].inv, { action: 'remove', itemId: 'kit', usedOn: 'desk' }, 'null falls through, as Ruby || does');
});

const hideReq = (body) => ({ postData: () => JSON.stringify(body) });

test('inventoryTag carries hiddenIn for a hide row, from either spelling, and omits it otherwise', () => {
  assert.deepEqual(
    inventoryTag(hideReq({ action_type: 'hide', item: { id: 'kit' }, hidden_in: 'pot_a' })),
    { action: 'hide', itemId: 'kit', usedOn: null, hiddenIn: 'pot_a' });
  assert.deepEqual(
    inventoryTag(hideReq({ actionType: 'hide', item: { id: 'kit' }, hiddenIn: 'pot_b' })),
    { action: 'hide', itemId: 'kit', usedOn: null, hiddenIn: 'pot_b' });
  assert.deepEqual(
    inventoryTag(hideReq({ action_type: 'remove', item: { id: 'kit' }, used_on: 'desk' })),
    { action: 'remove', itemId: 'kit', usedOn: 'desk' });
});

test('inventoryTag declines a URL query that names hidden_in or hiddenIn', () => {
  for (const q of ['?hidden_in=x', '?a=1&hiddenIn=x']) {
    assert.equal(inventoryTag(hideReq({ action_type: 'hide', item: { id: 'kit' }, hidden_in: 'pot_a' }), new URL('http://h/inventory' + q)), null);
  }
});

// ---- C2: pc and hash tags ----
// Answer bodies are real rows from the fixtures. No crack answer exists as a fixture row, so the
// crack rows reuse a login answer body; the tag never depends on the answer.
const fixtureRows = (name) => readFileSync(join(root, 'test/fixtures/files', name), 'utf8').trim().split('\n').map(l => JSON.parse(l));
const privRows = fixtureRows('ops_privilege_browser_run_1.jsonl');
const mfaRows = fixtureRows('ops_mfa_real_capture_rows.jsonl');
const answerOf = (rows, suffix) => rows.find(r => r.method === 'POST' && r.path.endsWith(suffix)).body;
const G = '/break_escape/games/7';
const PC_ROUTES = [
  ['/login', answerOf(privRows, '/login')],
  ['/logout', answerOf(privRows, '/logout')],
  ['/lock_session', answerOf(privRows, '/lock_session')],
  ['/mfa/verify', answerOf(mfaRows, '/mfa/verify')],
  ['/mfa/prompt', answerOf(mfaRows, '/mfa/verify')], // no prompt row in the fixtures
  ['/mfa/approve', answerOf(mfaRows, '/mfa/verify')] // no approve row in the fixtures
];
const CRACK_ANSWER = answerOf(privRows, '/login');

async function one(path, opts) {
  const { file, cap } = fresh();
  cap.onResponse(res(G + path, opts));
  await cap.flush();
  return { row: lines(file)[0], file };
}

test('C2 each PC route gets pc: { pcId }', async () => {
  for (const [route, body] of PC_ROUTES) {
    const { row } = await one(route, { method: 'POST', body, postData: JSON.stringify({ pc_id: 'jake_pc', username: 'u' }) });
    assert.deepEqual(row.pc, { pcId: 'jake_pc' }, route);
    assert.ok(!('hash' in row), route);
  }
});

test('C2 POST /crack gets hash: { hashId }', async () => {
  const { row } = await one('/crack', { method: 'POST', body: CRACK_ANSWER, postData: JSON.stringify({ hash_id: 'h1', facts: { a: 1 } }) });
  assert.deepEqual(row.hash, { hashId: 'h1' });
  assert.ok(!('pc' in row));
});

test('C2 nothing but the id is written', async () => {
  const { file } = await one('/login', { method: 'POST', body: { success: true }, postData: JSON.stringify({ pc_id: 'p1', username: 'MARKUSER', password: 'MARKPASS', credential: { k: 'MARKCRED' }, number: 424242, facts: ['MARKFACT'] }) });
  const text = readFileSync(file, 'utf8');
  for (const m of ['MARKUSER', 'MARKPASS', 'MARKCRED', '424242', 'MARKFACT']) assert.ok(!text.includes(m), m);
  const c = await one('/crack', { method: 'POST', body: { success: true }, postData: JSON.stringify({ hash_id: 'h1', facts: ['MARKFACT'], password: 'MARKPASS' }) });
  const t2 = readFileSync(c.file, 'utf8');
  assert.ok(!t2.includes('MARKFACT') && !t2.includes('MARKPASS'));
});

const BAD_BODIES = [
  ['postData null', null], ['empty', ''], ['form-encoded', 'pc_id=x&hash_id=y'],
  ['JSON string', '"x"'], ['JSON null', 'null'], ['array', '[{"pc_id":"x","hash_id":"x"}]'],
  ['throwing', () => { throw new Error('gone'); }],
  ['missing id', '{}'], ['empty id', '{"pc_id":"","hash_id":""}'],
  ['number id', '{"pc_id":5,"hash_id":5}'], ['object id', '{"pc_id":{"a":"b"},"hash_id":{"a":"b"}}'],
  ['201 chars', JSON.stringify({ pc_id: 'a'.repeat(201), hash_id: 'a'.repeat(201) })],
  ['target_type', '{"pc_id":"x","target_type":"npc"}'], ['target_id', '{"pc_id":"x","target_id":"t"}']
];

test('C2 unreadable requests give null with the key present', async () => {
  for (const [name, pd] of BAD_BODIES) {
    const a = await one('/login', { method: 'POST', postData: pd });
    assert.ok('pc' in a.row && a.row.pc === null, 'pc ' + name);
    if (name === 'target_type' || name === 'target_id') continue;
    const b = await one('/crack', { method: 'POST', postData: pd });
    assert.ok('hash' in b.row && b.row.hash === null, 'hash ' + name);
  }
  const edge = await one('/login', { method: 'POST', postData: JSON.stringify({ pc_id: 'a'.repeat(200) }) });
  assert.deepEqual(edge.row.pc, { pcId: 'a'.repeat(200) });
});

test('C2 a query naming the field declines; an unrelated one does not', async () => {
  const pd = JSON.stringify({ pc_id: 'p', hash_id: 'h' });
  for (const q of ['?pc_id=x', '?x=1;pc_id=y', '?target_type=a', '?target_id=a', '?pc%5Fid=x']) {
    assert.equal((await one('/login' + q, { method: 'POST', postData: pd })).row.pc, null, q);
  }
  assert.equal((await one('/crack?hash_id=z', { method: 'POST', postData: pd })).row.hash, null);
  assert.equal((await one('/crack?x=1;hash_id=z', { method: 'POST', postData: pd })).row.hash, null);
  assert.deepEqual((await one('/login?x=1', { method: 'POST', postData: pd })).row.pc, { pcId: 'p' });
  assert.deepEqual((await one('/crack?pc_id=1', { method: 'POST', postData: pd })).row.hash, { hashId: 'h' });
});

test('C2 other rows carry neither key, and inv and npcId are kept', async () => {
  const pd = JSON.stringify({ pc_id: 'p', hash_id: 'h', npc_id: 'n', action_type: 'add', item: { id: 'i' } });
  const cases = [
    ['/login', { method: 'GET' }], ['/logout', { method: 'GET' }], ['/lock_session', { method: 'GET' }],
    ['/crack', { method: 'GET' }], ['/mfa/verify', { method: 'GET' }],
    ['/login_accounts?pc_id=x', { method: 'GET' }], ['/mfa/device', { method: 'GET' }], ['/mfa/phone', { method: 'GET' }],
    ['/mfa/device', { method: 'POST' }], ['/unlock', { method: 'POST' }], ['/login_accounts', { method: 'POST' }]
  ];
  for (const [path, o] of cases) {
    const { row } = await one(path, { ...o, postData: pd });
    assert.ok(!('pc' in row) && !('hash' in row), o.method + ' ' + path);
  }
  const inv = (await one('/inventory', { method: 'POST', postData: pd })).row;
  assert.deepEqual(inv.inv, { action: 'add', itemId: 'i', usedOn: null });
  assert.ok(!('pc' in inv) && !('hash' in inv));
  const fp = (await one('/feed_post', { method: 'POST', postData: pd })).row;
  assert.equal(fp.npcId, 'n');
  assert.ok(!('pc' in fp) && !('hash' in fp));
});

test('C2 no row ever carries a login key; the tag functions never throw', async () => {
  for (const [route] of PC_ROUTES) {
    const { row } = await one(route, { method: 'POST', postData: JSON.stringify({ pc_id: 'p', login: { pcId: 'x' } }) });
    assert.ok(!('login' in row), route);
  }
  assert.equal(pcTag({ postData() { throw new Error('x'); } }), null);
  assert.equal(hashTag({ postData() { throw new Error('x'); } }, { search: '?%' }), null);
});

// R1-C2: the Rails tag tests (recorder_tags_scanner_*_test.rb) read their `pc` and `hash` tags from this fixture, a capture the
// recorder itself wrote. This test rebuilds it and fails if the recorder's output no longer matches the file.
// To refresh after a recorder change: UPDATE_RECORDER_TAGS=1 bin/test-js test/js/playtest-session-capture.test.mjs
test('R1-C2 the recorder tag fixture is what the recorder writes', async () => {
  const PCS = ['code_pc1', 'plain_pc', 'bay_pc', 'store_pc', 'lobby_cabinet'];
  const HASHES = ['dana_hash', 'farah_hash', 'sparedesk_hash', 'eli_hash'];
  const { file, cap } = fresh();
  for (const id of PCS) cap.onResponse(res(G + '/login', { method: 'POST', body: CRACK_ANSWER, postData: JSON.stringify({ pc_id: id }) }));
  for (const id of HASHES) cap.onResponse(res(G + '/crack', { method: 'POST', body: CRACK_ANSWER, postData: JSON.stringify({ hash_id: id, facts: [] }) }));
  await cap.flush();
  const rows = lines(file).map(({ pc, hash }) => (pc ? { pc } : { hash }));
  assert.equal(rows.length, PCS.length + HASHES.length);
  const text = rows.map(r => JSON.stringify(r)).join('\n') + '\n';
  const path = join(root, 'test/fixtures/files/recorder_tag_rows.jsonl');
  if (process.env.UPDATE_RECORDER_TAGS) writeFileSync(path, text);
  assert.equal(readFileSync(path, 'utf8'), text);
});
