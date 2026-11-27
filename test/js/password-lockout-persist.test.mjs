// Opt-in lockoutSeconds: wrong passwords persist across closing and reopening a password lock,
// then the lock stays shut for that long (m01 blind playtest #8).
// Run with: node --test test/js/password-lockout-persist.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../../public/break_escape/js/minigames/password/password-minigame.js');
// Mirror the real layout (js/minigames/password, js/config.js, js/utils) with stubs.
const root = mkdtempSync(join(tmpdir(), 'password-lockout-'));
const dir = join(root, 'minigames');
mkdirSync(join(dir, 'password'), { recursive: true });
mkdirSync(join(dir, 'framework'));
mkdirSync(join(root, 'utils'));
writeFileSync(join(root, 'package.json'), '{"type":"module"}');
writeFileSync(join(root, 'config.js'), 'export const ASSETS_PATH = "";\n');
writeFileSync(join(root, 'utils', 'helpers.js'), 'export function makeDraggable() {}\n');
writeFileSync(join(root, 'utils', 'display-dashes.js'), 'export function displayDashes(s) { return s; }\n');
writeFileSync(join(root, 'utils', 'escape-html.js'), readFileSync(join(here, '../../public/break_escape/js/utils/escape-html.js'), 'utf8'));
writeFileSync(join(root, 'utils', 'lock-scope-refusal.js'), readFileSync(join(here, '../../public/break_escape/js/utils/lock-scope-refusal.js'), 'utf8'));
writeFileSync(join(root, 'utils', 'computer-keywords.js'), readFileSync(join(here, '../../public/break_escape/js/utils/computer-keywords.js'), 'utf8'));
writeFileSync(join(root, 'utils', 'pc-monitor.js'), readFileSync(join(here, '../../public/break_escape/js/utils/pc-monitor.js'), 'utf8'));
writeFileSync(join(root, 'utils', 'npc-headshot.js'), readFileSync(join(here, '../../public/break_escape/js/utils/npc-headshot.js'), 'utf8'));
writeFileSync(join(root, 'utils', 'remote-host-text.js'), readFileSync(join(here, '../../public/break_escape/js/utils/remote-host-text.js'), 'utf8'));
writeFileSync(join(dir, 'framework', 'base-minigame.js'), 'export class MinigameScene { constructor() {} }\n');
writeFileSync(join(dir, 'password', 'password-minigame.mjs'), readFileSync(src, 'utf8'));
globalThis.window = { ApiClient: {}, breakEscapeConfig: { gameId: 1 } };
const { PasswordMinigame } = await import(pathToFileURL(join(dir, 'password', 'password-minigame.mjs')).href);

const M = await import(pathToFileURL(join(dir, 'password', 'password-minigame.mjs')).href);
const { passwordLockStatus, notePasswordAttempts, clearPasswordLocks, passwordLockedMessage } = M;

test('attempts persist and lock at the limit, then clear after the lockout', () => {
    clearPasswordLocks();
    notePasswordAttempts('object:pc', 2, 3, 30, 1000);
    assert.deepEqual(passwordLockStatus('object:pc', 2000), { attempts: 2, lockedLeftSeconds: 0 });
    notePasswordAttempts('object:pc', 3, 3, 30, 1000);
    assert.equal(passwordLockStatus('object:pc', 11000).lockedLeftSeconds, 20);
    assert.equal(passwordLockStatus('object:pc', 11000).attempts, 3);
    assert.deepEqual(passwordLockStatus('object:pc', 31000), { attempts: 0, lockedLeftSeconds: 0 });
    assert.deepEqual(passwordLockStatus('object:pc', 31001), { attempts: 0, lockedLeftSeconds: 0 });
});

test('a correct password (0 attempts) clears the record; no key is a no-op', () => {
    clearPasswordLocks();
    notePasswordAttempts('object:a', 1, 3, 30, 0);
    notePasswordAttempts('object:a', 0, 3, 30, 0);
    assert.equal(passwordLockStatus('object:a', 1).attempts, 0);
    notePasswordAttempts(null, 2, 3, 30, 0);
    assert.equal(passwordLockStatus(null).attempts, 0);
});

test('locks are separate per key', () => {
    clearPasswordLocks();
    notePasswordAttempts('object:a', 3, 3, 30, 0);
    assert.equal(passwordLockStatus('object:b', 1).lockedLeftSeconds, 0);
});

test('message wording', () => {
    assert.match(passwordLockedMessage(1), /1 more second\./);
    assert.match(passwordLockedMessage(20), /20 more seconds\./);
});

function mk(lockoutSeconds) {
    const lockable = { scenarioData: { id: 'derek_computer' } };
    const g = new M.PasswordMinigame({}, { lockable, type: 'object', lockoutSeconds, maxAttempts: 3 });
    g.gameState = { isActive: true };
    g.passwordField = { value: 'wrong', focus() {} };
    g.attemptsDisplay = { textContent: '' };
    g.msgs = [];
    g.showScreenMessage = (t) => g.msgs.push(t);
    g.calls = 0;
    g.validatePasswordWithServer = async () => { g.calls++; g.passwordIncorrect(); g.passwordField.value = 'wrong'; };
    g.emitPasswordFailed = () => {};
    g.cleanup = () => {};
    return g;
}

test('closing and reopening keeps the count, locks at 3 and refuses without a server call', async () => {
    clearPasswordLocks();
    const a = mk(30);
    await a.submitPassword(); await a.submitPassword();
    assert.equal(a.gameData.attempts, 2);
    const b = mk(30);                       // reopened
    assert.equal(b.gameData.attempts, 2);
    await b.submitPassword();
    assert.equal(b.gameData.attempts, 3);
    const c = mk(30);                       // reopened again, now locked
    await c.submitPassword();
    assert.equal(c.calls, 0);
    assert.match(c.msgs.at(-1), /Locked for \d+ more second/);
});

test('without lockoutSeconds the count resets on reopening, as before', async () => {
    clearPasswordLocks();
    const a = mk(0);
    await a.submitPassword(); await a.submitPassword();
    const b = mk(0);
    assert.equal(b.gameData.attempts, 0);
});

test('a door lock keys on its room, so lockoutSeconds works on doors too', async () => {
    clearPasswordLocks();
    const mkDoor = () => {
        const g = new M.PasswordMinigame({}, { lockable: { doorProperties: { connectedRoom: 'vault' } }, type: 'door', lockoutSeconds: 30, maxAttempts: 3 });
        return g;
    };
    assert.equal(mkDoor().lockKey, 'door:vault');
    notePasswordAttempts('door:vault', 2, 3, 30, Date.now());
    assert.equal(mkDoor().gameData.attempts, 2);
});

test('the max-attempts message says how long the wait is when a lockout is set', () => {
    for (const [secs, re] of [[30, /Locked for 30 seconds\./], [0, /^Maximum attempts exceeded\. Access denied\.$/]]) {
        const lockable = { scenarioData: { id: 'pc' } };
        const g = new M.PasswordMinigame({}, { lockable, type: 'object', lockoutSeconds: secs, maxAttempts: 3 });
        g.cleanup = () => {};
        g.msgs = [];
        g.showScreenMessage = (t) => g.msgs.push(t);
        g.passwordFailed();
        assert.match(g.msgs[0], re);
    }
});

test('handleUnlock passes lockoutSeconds from the lock to the password minigame', () => {
    const us = readFileSync(join(here, '../../public/break_escape/js/systems/unlock-system.js'), 'utf8');
    assert.match(us, /lockoutSeconds:\s*lockable\.lockoutSeconds \|\| lockable\.scenarioData\?\.lockoutSeconds \|\| pwDoor\.lockoutSeconds/);
    const st = readFileSync(join(here, '../../public/break_escape/js/systems/minigame-starters.js'), 'utf8');
    assert.match(st, /lockoutSeconds:\s*options\.lockoutSeconds/);
});

test('m01: Derek access task ticks on the door opening, and Derek computer sets a lockout', () => {
    const erb = readFileSync(join(here, '../../scenarios/m01_first_contact/scenario.json.erb'), 'utf8');
    const task = erb.match(/"taskId": "find_derek_access"[\s\S]*?\}/)[0];
    assert.match(task, /"type": "unlock_room"/);
    assert.match(task, /"targetRoom": "derek_office"/);
    assert.match(erb, /"id": "derek_computer"[\s\S]{0,3000}?"lockoutSeconds": 30/);
});

test('m01: the Derek-is-stalling HaX text waits for the casualty projections', () => {
    const erb = readFileSync(join(here, '../../scenarios/m01_first_contact/scenario.json.erb'), 'utf8');
    const m = erb.match(/"condition": "([^"]*)",\s*"onceOnly": true,\s*"sendTimedMessage": \{[^}]*Derek won't engage/);
    assert.ok(m, 'stalling text trigger found');
    assert.match(m[1], /globalVars\.found_casualty_projections/);
});
