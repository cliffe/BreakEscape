// test_ops_helpdesk: every click path of the S8b brief (section 4.5) has its authored hook in the scenario.
// Reads the scenario file and its compiled ink as written; the file has no ERB, so it parses as JSON.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const dir = join(root, 'scenarios/test_ops_helpdesk');
const raw = readFileSync(join(dir, 'scenario.json.erb'), 'utf8');
assert.ok(!raw.includes('<%'), 'the scenario has no ERB, so the test can read it as JSON');
const sc = JSON.parse(raw);
const ink = (id) => readFileSync(join(dir, 'ink', `${id}.json`), 'utf8');
const inkSrc = (id) => readFileSync(join(dir, 'ink', `${id}.ink`), 'utf8');

const rooms = Object.entries(sc.rooms);
const objects = rooms.flatMap(([room, r]) => (r.objects || []).map((o) => ({ ...o, room })));
const npcs = rooms.flatMap(([room, r]) => (r.npcs || []).map((n) => ({ ...n, room })));
const obj = (id) => objects.find((o) => o.id === id);
const npc = (id) => npcs.find((n) => n.id === id);

test('form in person: the desk NPC\'s own story carries the tag, and Ria sits in the Service Desk', () => {
  for (const [deskId, desk] of Object.entries(sc.helpdesks)) {
    const who = npc(desk.npc);
    assert.ok(who, `desk ${deskId} names a room NPC`);
    assert.ok(ink(desk.npc).includes(`helpdesk_request:${deskId}`), `${desk.npc}'s compiled story has the tag for ${deskId}`);
    assert.ok(inkSrc(desk.npc).includes(`helpdesk_request:${deskId}`));
    assert.ok(inkSrc(desk.npc).includes('Ask for an account reset'), 'the one choice the click path names');
    assert.ok(inkSrc(desk.npc).includes(`helpdesk_${deskId}_result`), 'the story reads the result global');
    assert.equal(who.storyPath, `scenarios/test_ops_helpdesk/ink/${desk.npc}.json`);
  }
  assert.equal(npc('ria').room, 'service_desk');
  assert.equal(sc.helpdesks.id_desk.npc, 'omar');
  for (const name of ['helpdesk_it_desk_result', 'helpdesk_id_desk_result']) assert.ok(name in sc.globalVariables);
});

test('form over a PC: the IT request form is in front_pc, the note beside it holds the login', () => {
  const pc = obj('front_pc');
  assert.equal(pc.lockType, 'login');
  const form = pc.contents.find((c) => c.type === 'helpdesk_form');
  assert.deepEqual([form.id, form.name, form.desk], ['front_form', 'IT request form', 'it_desk']);
  const sam = npc('sam');
  assert.deepEqual(pc.access.people, ['sam']);
  const note = obj('note_sam');
  assert.equal(note.room, pc.room);
  assert.ok(note.readable && note.text.includes(sam.creds.username) && note.text.includes(sam.creds.password));
});

test('form from a call: the IT service line is on the player\'s phone with one ask naming it_desk', () => {
  const line = npc('it_line');
  assert.equal(line.npcType, 'phone');
  assert.equal(line.displayName, 'IT service line');
  const start = sc.startItemsInInventory.find((i) => i.type === 'phone' && i.phoneId === line.phoneId);
  assert.ok(start && start.npcIds.includes('it_line'));
  const call = sc.social.pretextNpcs.find((c) => c.character === 'it_line');
  assert.deepEqual(Object.keys(call.asks), ['reset_request']);
  assert.equal(call.asks.reset_request.helpdesk, 'it_desk');
  assert.deepEqual(call.asks.reset_request.verification, []);
  assert.ok(inkSrc('it_line').includes('Request a reset'));
});

test('My phone on the code pane: Vera\'s PC asks for a code, her device is loose in Records, her phone is handed over', () => {
  const vault = obj('vault_pc');
  assert.equal(sc.policies[vault.policy].mfa, 'code');
  assert.deepEqual(vault.access.people, ['vera']);
  const device = obj('vera_device');
  assert.equal(device.type, 'code_device');
  assert.equal(device.owner, 'vera');
  assert.ok(device.takeable);
  assert.equal(device.room, vault.room);
  const phone = npc('vera').itemsHeld.find((i) => i.type === 'phone_friendface');
  assert.equal(phone.owner, 'vera');
  assert.ok(inkSrc('vera').includes('#give_item:phone_friendface'));
});

test('My phone on the push pane: Wim\'s PC is a push PC, he is careful and holds no phone', () => {
  const ops = obj('ops_pc');
  assert.equal(sc.policies[ops.policy].mfa, 'push');
  assert.deepEqual(ops.access.people, ['wim']);
  const wim = npc('wim');
  assert.equal(wim.awareness, 'high');
  assert.ok(!(wim.itemsHeld || []).some((i) => i.type === 'phone_friendface'));
  const note = obj('note_wim');
  assert.ok(note.text.includes(wim.creds.password));
});

test('the locked account: strict PC, saved connection in the starting inventory, old login on a note', () => {
  const rec = obj('records_pc');
  assert.equal(sc.policies[rec.policy].maxAttempts, 3);
  assert.deepEqual(rec.access.people.sort(), ['tess', 'ugo']);
  const saved = sc.credentials.tess_saved;
  assert.deepEqual([saved.kind, saved.account, saved.connectsTo], ['saved_connection', 'tess', 'records_pc']);
  const item = sc.startItemsInInventory.find((i) => i.id === saved.proof.held);
  assert.equal(item.credential, 'tess_saved');
  assert.ok(obj('note_tess').text.includes(npc('tess').creds.password));
  assert.ok(npc('tess').creds.resetPassword && npc('ugo').creds.resetPassword);
  // The saved connection has no foothold: its only route is `from` a PC the player is signed in at,
  // so the Front PC and the Records PC must share a network (R1-CLIENT1)
  const net = (id) => sc.rooms[obj(id).room].network;
  assert.ok(net('front_pc'));
  assert.equal(net('front_pc'), net('records_pc'));
  assert.ok(Object.keys(sc.credentials.tess_saved).every((k) => !['foothold', 'routes'].includes(k)));
});

test('the sign-ins list can be opened: a capture log is in the starting inventory, and the saved file says Connect (R1-CLIENT3)', () => {
  const log = sc.startItemsInInventory.find((i) => i.type === 'capture_log');
  assert.ok(log, 'a capture log');
  assert.equal(log.holds.captures, true);
  const file = sc.startItemsInInventory.find((i) => i.id === 'tess_saved_file');
  assert.ok(/Connect/.test(file.text) && !/sign-in screen/.test(file.text));
});

test('find the answers: Tess and Wim answers are on the staff file and the team post, Ugo and Vera nowhere', () => {
  const readable = [...objects.filter((o) => o.readable || o.type === 'notes1').map((o) => o.text || ''),
    JSON.stringify(sc.social.osint), ...npcs.map((n) => ''), ...['ria', 'omar', 'vera', 'sam', 'tess', 'ugo', 'wim', 'it_line'].map(inkSrc)].join('\n').toLowerCase();
  const file = obj('staff_file').text.toLowerCase();
  const posts = JSON.stringify(sc.social.osint).toLowerCase();
  for (const who of ['tess', 'wim']) {
    const rec = npc(who).creds.recovery;
    assert.ok(file.includes(rec.staff_no.toLowerCase()), `${who} staff number is in the staff file`);
    assert.ok(posts.includes(rec.manager.toLowerCase()), `${who} manager is in the team post`);
  }
  for (const who of ['ugo', 'vera']) {
    for (const answer of Object.values(npc(who).creds.recovery)) assert.ok(!readable.includes(answer.toLowerCase()), `${who}: ${answer} is written nowhere`);
  }
  assert.equal(obj('staff_file').room, 'records');
  assert.ok(sc.startItemsInInventory.some((i) => i.type === 'phone_friendface' && !i.owner), 'the player\'s own feed phone');
});

test('no reset password and no recovery answer appears in any ink story', () => {
  const secrets = npcs.flatMap((n) => [n.creds?.resetPassword, ...Object.values(n.creds?.recovery || {})]).filter(Boolean);
  for (const id of ['ria', 'omar', 'vera', 'sam', 'tess', 'ugo', 'wim', 'it_line']) {
    for (const s of secrets) assert.ok(!ink(id).includes(s) && !inkSrc(id).includes(s), `${id} ink holds no secret`);
  }
});

test('the audit reader lists the S8b events, and the one mapping (last) is a bark on the desk NPC', () => {
  const pc = obj('audit_log_pc');
  assert.equal(pc.type, 'ops_log_terminal');
  const events = sc.logSources[pc.minigameData.logSource].events;
  for (const e of ['helpdesk_request', 'account_password_reset', 'account_mfa_reenrolled']) assert.ok(events.includes(e));
  const maps = npc('ria').eventMappings;
  assert.equal(maps[maps.length - 1].eventPattern, 'helpdesk_answered:it_desk');
  assert.equal(typeof maps[maps.length - 1].bark, 'string');
});
