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

test('a combination copied into minigameData as an equal array is a leak', { skip }, () => {
  // collect_scalars now yields the array whole, so the array branch of answer_matches_leaf? is
  // reached; [12, 30, 5] in minigameData equals the authored combination.
  const sc = withLock({ id: 'combo', locked: true, lockType: 'combination', requires: [12, 30, 5] },
    { mg: { dials: [12, 30, 5] } });
  assertHas(errors(issues(sc)), 'combination answer at');
});

test('a non-equal array in minigameData is not a combination leak', { skip }, () => {
  const sc = withLock({ id: 'combo', locked: true, lockType: 'combination', requires: [12, 30, 5] },
    { mg: { dials: [1, 2, 3] } });
  assert.deepEqual(errors(issues(sc)), []);
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

// ── narrative leaks (always-shipped prose) ───────────────────────────────────────────────────

test('the old test_secret_leaks brief (a combination written out) is caught as a warning', { skip }, () => {
  // scenario_brief ships verbatim in GET /scenario. A combination written as its dash form is 7
  // chars, so the whole-word rule catches it as a warning; it is not an error (a clue can hint).
  const sc = withLock({ id: 'combo', locked: true, lockType: 'combination', requires: [12, 30, 5] });
  sc.scenario_brief = 'The strongbox is a combination padlock (12-30-5). Open it.';
  const l = issues(sc);
  assertHas(warnings(l), 'appears in the shipped narrative string');
  assert.deepEqual(errors(l), []);
});

test('a brief that describes the lock without the value is not caught', { skip }, () => {
  const sc = withLock({ id: 'combo', locked: true, lockType: 'combination', requires: [12, 30, 5] });
  sc.scenario_brief = 'The strongbox is a combination padlock whose code is a capture secret.';
  assertNot(issues(sc), 'appears in the shipped narrative string');
});

test('a short common answer in prose does not warn (noise control)', { skip }, () => {
  // "open" is four chars, under the six-char whole-word threshold, so it never fires as a substring
  // of ordinary prose; only an exact/trimmed-equal field would.
  const sc = withLock({ id: 'pwbox', locked: true, lockType: 'password', requires: 'open' });
  sc.scenario_brief = 'Please open the vault and read the sign.';
  assertNot(issues(sc), 'appears in the shipped narrative string');
});

test('a deliberate narrative clue is acknowledged, not warned', { skip }, () => {
  const sc = withLock({ id: 'cryptexbox', locked: true, lockType: 'cryptex', requires: 'nightjar' });
  sc.rooms.r.objects.push({ id: 'poster', name: 'Poster', observations: 'A faded poster reads NIGHTJAR.' });
  sc.acknowledgedClues = [{ lock: 'cryptexbox', in: 'poster', reason: 'the poster is the clue', approved: 'h' }];
  const l = issues(sc);
  assertNot(warnings(l), 'appears in the shipped narrative string');
  assertHas(infos(l), 'acknowledged clue in narrative: cryptexbox in poster');
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

test('a bare door entry whose connected room is a secret lock ships its requires (error)', { skip }, () => {
  // No lockType of its own, connected room is a pin lock: the server strips `requires` only from a
  // node with its own lockType, so this entry's `requires` ships. Plan item 4 makes it an error.
  const sc = { rooms: {
    office: { connections: { north: 'vault' }, objects: [],
      doors: [{ connectedRoom: 'vault', direction: 'north', requires: '4821' }] },
    vault: { locked: true, lockType: 'pin', requires: '4821', connections: {}, objects: [] }
  } };
  assertHas(errors(issues(sc)), 'ships its `requires` because the server filter reads');
});

test('a bare door entry whose connected room is rfid is not an error', { skip }, () => {
  // An rfid card id is not a secret, so a bare entry resolving to rfid raises nothing (the two
  // corpus rfid bare-requires entries must stay clean).
  const sc = { rooms: {
    lobby: { connections: { east: 'secure' }, objects: [],
      doors: [{ connectedRoom: 'secure', direction: 'east', requires: 'card07' }] },
    secure: { locked: true, lockType: 'rfid', requires: 'card07', connections: {}, objects: [] }
  } };
  assert.deepEqual(issues(sc), []);
});

test('a door entry whose requires differs from its connected room warns', { skip }, () => {
  const sc = { rooms: {
    hall: { connections: { south: 'store' }, objects: [],
      doors: [{ connectedRoom: 'store', direction: 'south', lockType: 'rfid', requires: 'card01' }] },
    store: { locked: true, lockType: 'rfid', requires: 'card99', connections: {}, objects: [] }
  } };
  assertHas(warnings(issues(sc)), 'the server checks the room');
});

test('a door entry matching its connected room raises nothing', { skip }, () => {
  const sc = { rooms: {
    hall: { connections: { south: 'store' }, objects: [],
      doors: [{ connectedRoom: 'store', direction: 'south', lockType: 'rfid', requires: 'card01' }] },
    store: { locked: true, lockType: 'rfid', requires: 'card01', connections: {}, objects: [] }
  } };
  assert.deepEqual(issues(sc), []);
});

test('an rfid card written as a string in one place and an array in the other is not a mismatch', { skip }, () => {
  // R2 m3: an rfid card id is the same card whether written as "badge" or ["badge"]; the client
  // fills and checks either, so the two shapes must not read as a mismatch warning.
  const sc = { rooms: {
    lobby: { connections: { east: 'secure' }, objects: [],
      doors: [{ connectedRoom: 'secure', direction: 'east', requires: 'badge' }] },
    secure: { locked: true, lockType: 'rfid', requires: ['badge'], connections: {}, objects: [] }
  } };
  assert.deepEqual(issues(sc), []);
});

test('an rfid card that is genuinely a different id still warns (normalise does not hide a real mismatch)', { skip }, () => {
  const sc = { rooms: {
    lobby: { connections: { east: 'secure' }, objects: [],
      doors: [{ connectedRoom: 'secure', direction: 'east', lockType: 'rfid', requires: ['badge_a'] }] },
    secure: { locked: true, lockType: 'rfid', requires: ['badge_b'], connections: {}, objects: [] }
  } };
  assertHas(warnings(issues(sc)), 'the server checks the room');
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
