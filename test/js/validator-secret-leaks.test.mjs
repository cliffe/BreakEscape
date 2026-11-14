// scripts/validate_secret_leaks.rb check_secret_leaks (SCENARIO_FORMAT_HARDENING_PLAN step 3):
// a lock answer, flag, account password, PSK or capture secret copied to a place the browser gets
// at game start (globalVariables, minigameData, scenarioData) is an error, unless an
// acknowledgedClues marker covers it. Also the `requires`-with-no-lockType rule and the
// can-never-be-served usePayload warning. One fixture per leak, lock-type and clue case.
// The double-render drop for random values needs an .erb template, so it is covered by the Ruby
// corpus run, not these static fixtures.
// Run with: node test/js/validator-secret-leaks.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

// globalCluesAllowed=false redefines the one validator constant, to show the global: clue form
// becomes an error when the switch is off.
function issues(scenario, { globalCluesAllowed = true } = {}) {
  const flip = globalCluesAllowed ? '' :
    'SecretLeaks.send(:remove_const, :GLOBAL_CLUES_ALLOWED); SecretLeaks.const_set(:GLOBAL_CLUES_ALLOWED, false)';
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_secret_leaks.rb'))}
    ${flip}
    puts JSON.generate(check_secret_leaks(JSON.parse(STDIN.read)))`;
  const r = spawnSync('ruby', ['-e', script], {
    input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
  });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}
const errors = (l) => l.filter((s) => s.startsWith('❌'));
const warnings = (l) => l.filter((s) => s.startsWith('⚠️'));
const infos = (l) => l.filter((s) => s.startsWith('ℹ️'));
const has = (l, frag) => l.some((s) => s.includes(frag));
const assertHas = (l, frag) => assert.ok(has(l, frag), `expected "${frag}" in:\n${l.join('\n')}`);
const assertNot = (l, frag) => assert.ok(!has(l, frag), `did not expect "${frag}" in:\n${l.join('\n')}`);

// A room with one locked lock and one object carrying minigameData, used across the leak cases.
const withLock = (lock, { globals = {}, mg = null, extraObjects = [] } = {}) => {
  const objects = [lock];
  if (mg) objects.push({ id: 'term', minigameData: mg });
  objects.push(...extraObjects);
  const sc = { rooms: { r: { objects } } };
  if (Object.keys(globals).length) sc.globalVariables = globals;
  return sc;
};
const pinLock = { id: 'safe', locked: true, lockType: 'pin', requires: '4821' };

// ── leaks ──────────────────────────────────────────────────────────────────────────────────

test('a PIN copied into a global is an error (string and number)', { skip }, () => {
  assertHas(errors(issues(withLock(pinLock, { globals: { hint: '4821' } }))), 'pin answer at');
  assertHas(errors(issues(withLock(pinLock, { globals: { hint: 4821 } }))), 'the browser receives at game start');
});

test('a PIN copied into minigameData is an error', { skip }, () => {
  assertHas(errors(issues(withLock(pinLock, { mg: { shown: '4821' } }))), 'minigame of term');
});

test('a password as a whole word inside a longer minigameData string is an error', { skip }, () => {
  const sc = withLock({ id: 'pwbox', locked: true, lockType: 'password', requires: 'Satchel42' },
    { mg: { lines: ['remember, the code is Satchel42 now'] } });
  assertHas(errors(issues(sc)), 'password answer at');
});

test('a short password is not matched as a substring of an unrelated word', { skip }, () => {
  // "pass" (4 chars, under the 6-char whole-word threshold) must not fire on "passport".
  const sc = withLock({ id: 'pwbox', locked: true, lockType: 'password', requires: 'pass' },
    { mg: { lines: ['bring your passport'] } });
  assert.deepEqual(errors(issues(sc)), []);
});

test('a flag answer in a global is an error', { skip }, () => {
  const sc = { flags: { flag_1: { ans: 'CTF{found_it_here}' } }, globalVariables: { leak: 'CTF{found_it_here}' } };
  assertHas(errors(issues(sc)), 'flag answer at');
});

test('a combination in the common string form is caught in a global', { skip }, () => {
  const sc = withLock({ id: 'combo', locked: true, lockType: 'combination', requires: [12, 30, 5] },
    { globals: { hint: '12-30-5' } });
  assertHas(errors(issues(sc)), 'combination answer at');
  // A stray number that is not the whole combination does not fire.
  assertNot(issues(withLock({ id: 'combo', locked: true, lockType: 'combination', requires: [12, 30, 5] },
    { globals: { hint: '5' } })), 'combination answer at');
});

test('a cryptex answer in a different case is an error', { skip }, () => {
  const sc = withLock({ id: 'cr', locked: true, lockType: 'cryptex', requires: 'wolf' }, { mg: { x: 'WOLF' } });
  assertHas(errors(issues(sc)), 'cryptex answer at');
});

test('an answer reached inside a give_item action is still collected', { skip }, () => {
  // The lock sits in a timer's give_item item; its PIN copied to a global is caught, proving the
  // answer walk reaches lock-typed hashes anywhere in the tree.
  const sc = {
    rooms: { r: { objects: [] } },
    timers: [{ id: 't', afterMs: 1, actions: [{ type: 'give_item',
      item: { id: 'lap', locked: true, lockType: 'pin', requires: '7788' } }] }],
    globalVariables: { note: '7788' }
  };
  assertHas(errors(issues(sc)), 'pin answer at');
});

test('a clean scenario raises no leak', { skip }, () => {
  assert.deepEqual(errors(issues(withLock(pinLock, { globals: { msg: 'welcome' } }))), []);
});

// ── lock-type rules ──────────────────────────────────────────────────────────────────────────

test('a requires with no lockType errors when locked, warns when unlocked', { skip }, () => {
  assertHas(errors(issues({ rooms: { r: { objects: [{ id: 'x', locked: true, requires: '4821' }] } } })),
    'no `lockType`, so the server never strips it');
  const w = warnings(issues({ rooms: { r: { objects: [{ id: 'x', requires: 'password' }] } } }));
  assertHas(w, 'the field is inert (delete it)');
});

test('a door entry whose connected room is rfid raises nothing', { skip }, () => {
  const sc = { rooms: {
    office: { connections: { north: 'secure' }, objects: [],
      doors: [{ connectedRoom: 'secure', direction: 'north', requires: 'badge01' }] },
    secure: { locked: true, lockType: 'rfid', requires: 'badge01', connections: {}, objects: [] }
  } };
  assert.deepEqual(issues(sc), []);
});

test('a resolved door-entry PIN copied into a global is a leak', { skip }, () => {
  const sc = { rooms: {
    office: { connections: { north: 'vault' }, objects: [],
      doors: [{ connectedRoom: 'vault', direction: 'north', requires: '7781' }] },
    vault: { locked: true, lockType: 'pin', requires: '9999', connections: {}, objects: [] }
  }, globalVariables: { tip: '7781' } };
  assertHas(errors(issues(sc)), 'pin answer at');
});

test('a requires in a social block and a clue on a note text raise nothing', { skip }, () => {
  const social = { rooms: { r: { objects: [{ id: 'safe', locked: true, lockType: 'pin', requires: '4821' },
    { id: 'note', type: 'notes', text: 'the code is 4821' }] } },
    social: { facts: [{ requires: 'something' }] } };
  // The pin 4821 sits only in a plain note `text`, not under minigameData/global, so no leak; the
  // social `requires` is not a lock.
  assert.deepEqual(errors(issues(social)), []);
});

// ── acknowledged clues ─────────────────────────────────────────────────────────────────────

const clueScenario = (clue, { contents = false } = {}) => {
  if (contents) {
    return { rooms: { r: { objects: [{ id: 'console', locked: true, lockType: 'pin', requires: '5386',
      contents: [{ id: 'inner', minigameData: { slots: [5386] } }] }] } },
    acknowledgedClues: clue ? [clue] : [] };
  }
  return { rooms: { r: { objects: [
    { id: 'console', locked: true, lockType: 'pin', requires: '5386' },
    { id: 'server', minigameData: { slots: [5386] } }] } },
  acknowledgedClues: clue ? [clue] : [] };
};

test('a valid acknowledged clue turns the leak into an info line', { skip }, () => {
  const l = issues(clueScenario({ lock: 'console', in: 'server', reason: 'reading the slots is the puzzle', approved: 'h' }));
  assert.deepEqual(errors(l), []);
  assertHas(infos(l), 'acknowledged clue: console in server');
});

test('a stale marker is a warning and does not silence the real leak', { skip }, () => {
  const l = issues(clueScenario({ lock: 'console', in: 'nowhere', reason: 'x', approved: 'h' }));
  assertHas(errors(l), 'pin answer at');
  assertHas(warnings(l), 'matches no shown value (stale)');
});

test('a marker naming the lock itself, or an object in its contents, is an error', { skip }, () => {
  const self = { rooms: { r: { objects: [{ id: 'console', locked: true, lockType: 'pin', requires: '5386',
    minigameData: { slots: [5386] } }] } },
  acknowledgedClues: [{ lock: 'console', in: 'console', reason: 'x', approved: 'h' }] };
  assertHas(errors(issues(self)), 'is the lock itself or inside its contents');
  assertHas(errors(issues(clueScenario({ lock: 'console', in: 'inner', reason: 'x', approved: 'h' }, { contents: true }))),
    'is the lock itself or inside its contents');
});

test('the global clue form is a warning, and an error when the switch is off', { skip }, () => {
  const sc = { rooms: { r: { objects: [{ id: 'room_lock', locked: true, lockType: 'pin', requires: '5386' }] } },
    globalVariables: { suite_code: '5386' },
    acknowledgedClues: [{ lock: 'room_lock', in: 'global:suite_code', reason: 'spoken aloud', approved: 'h' }] };
  const on = issues(sc);
  assert.deepEqual(errors(on), []);
  assertHas(warnings(on), 'acknowledged clue in a global ships at game start');

  const off = issues(sc, { globalCluesAllowed: false });
  assertHas(errors(off), 'acknowledged clue in a global is not allowed');
});

// ── the usePayload warning ───────────────────────────────────────────────────────────────────

test('a usePayload secret with no targetId and no addCapture mapping can never be served', { skip }, () => {
  const bad = { rooms: { r: { npcs: [{ id: 'bob', usePayload: { secret: 'xyz' } }] } } };
  assertHas(warnings(issues(bad)), 'can never be served');

  const withMapping = { rooms: { r: { npcs: [{ id: 'bob', usePayload: { secret: 'xyz' },
    eventMappings: [{ addCapture: { targetId: 't' } }] }] } } };
  assertNot(issues(withMapping), 'can never be served');
});
