// The password keypad says passwords are case-sensitive on a near miss (the server
// flags caseMismatch), and every wrong password emits password_failed, plus
// door_unlock_failed through onRefused at a door (pass 5, approved item 7.4b; m07 E4).
// Run with: node --test test/js/password-case-hint.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../../public/break_escape/js/minigames/password/password-minigame.js');
const root = mkdtempSync(join(tmpdir(), 'password-case-'));
const dir = join(root, 'minigames');
mkdirSync(join(dir, 'password'), { recursive: true });
mkdirSync(join(dir, 'framework'));
mkdirSync(join(root, 'utils'));
writeFileSync(join(root, 'package.json'), '{"type":"module"}');
writeFileSync(join(root, 'config.js'), 'export const ASSETS_PATH = "";\n');
writeFileSync(join(root, 'utils', 'helpers.js'), 'export function makeDraggable() {}\n');
writeFileSync(join(root, 'utils', 'display-dashes.js'), 'export function displayDashes(s) { return s; }\n');
writeFileSync(join(dir, 'framework', 'base-minigame.js'), 'export class MinigameScene { constructor() {} }\n');
writeFileSync(join(dir, 'password', 'password-minigame.mjs'), readFileSync(src, 'utf8'));

const events = [];
globalThis.window = {
    breakEscapeConfig: { gameId: 1 },
    eventDispatcher: { emit: (name, data) => events.push([name, data]) },
};
const { PasswordMinigame, incorrectPasswordMessage } =
    await import(pathToFileURL(join(dir, 'password', 'password-minigame.mjs')).href);

function makeGame({ type = 'door', unlockError, refused } = {}) {
    const g = Object.create(PasswordMinigame.prototype);
    const lockable = type === 'door'
        ? { doorProperties: { connectedRoom: 'control_room' } }
        : { scenarioData: { id: 'director_pc', name: "Director's PC" } };
    Object.assign(g, {
        params: { type, lockable, onRefused: refused },
        gameState: { isActive: true },
        gameData: { attempts: 0, maxAttempts: 3 },
        passwordField: { value: 'cascadewindow19', focus() {} },
        attemptsDisplay: { textContent: '' },
        checkPending: false,
    });
    g.messages = [];
    g.showFailure = (msg) => g.messages.push(msg);
    g.cleanup = () => {};
    window.ApiClient = { unlock: async () => { throw unlockError; } };
    return g;
}

function err422(body) {
    const e = new Error('Invalid attempt');
    e.status = 422;
    e.body = body;
    return e;
}

test('message wording', () => {
    assert.equal(incorrectPasswordMessage(2), 'Incorrect password. 2 attempts remaining.');
    assert.equal(incorrectPasswordMessage(1, true),
        'Incorrect password. Passwords are case-sensitive. 1 attempt remaining.');
});

test('a near miss at a door says case-sensitive and emits both failure events', async () => {
    events.length = 0;
    const reasons = [];
    const g = makeGame({ unlockError: err422({ success: false, caseMismatch: true }), refused: (r) => reasons.push(r) });
    await g.submitPassword();
    assert.match(g.messages.at(-1), /Passwords are case-sensitive\. 2 attempts remaining\./);
    assert.deepEqual(reasons, ['wrong_password_case']);
    const names = events.map(e => e[0]);
    assert.deepEqual(names, ['password_failed', 'password_failed:control_room']);
    assert.equal(events[0][1].caseMismatch, true);
    assert.equal(events[0][1].attemptsRemaining, 2);
    assert.equal(events[0][1].targetType, 'door');
});

test('a plain wrong password on an object says nothing about case', async () => {
    events.length = 0;
    const g = makeGame({ type: 'object', unlockError: err422({ success: false }) });
    await g.submitPassword();
    assert.equal(g.messages.at(-1), 'Incorrect password. 2 attempts remaining.');
    assert.deepEqual(events.map(e => e[0]), ['password_failed', 'password_failed:director_pc']);
    assert.equal(events[0][1].caseMismatch, false);
    assert.equal(events[0][1].name, "Director's PC");
});

test('a network error is not a failed password', async () => {
    events.length = 0;
    const g = makeGame({ unlockError: new Error('offline') });
    await g.submitPassword();
    assert.equal(events.length, 0);
    assert.equal(g.gameData.attempts, 0);
});

test('the door path passes door_unlock_failed in as onRefused', () => {
    const us = readFileSync(join(here, '../../public/break_escape/js/systems/unlock-system.js'), 'utf8');
    const pw = us.slice(us.indexOf("case 'password':"), us.indexOf("case 'ransomware_display':"));
    assert.match(pw, /onRefused: emitDoorUnlockFailed/);
    const starters = readFileSync(join(here, '../../public/break_escape/js/systems/minigame-starters.js'), 'utf8');
    assert.match(starters, /onRefused: options\.onRefused/);
});
