// One password submission is one attempt, however many times Enter/Submit fire while
// the server check is pending (m02 playtest M2/M7).
// Run with: node --test test/js/password-minigame-submit.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../../public/break_escape/js/minigames/password/password-minigame.js');
// Mirror the real layout (js/minigames/password, js/config.js, js/utils) with stubs.
const root = mkdtempSync(join(tmpdir(), 'password-minigame-'));
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
globalThis.window = { ApiClient: {}, breakEscapeConfig: { gameId: 1 } };
const { PasswordMinigame } = await import(pathToFileURL(join(dir, 'password', 'password-minigame.mjs')).href);

function makeGame() {
    const g = Object.create(PasswordMinigame.prototype);
    Object.assign(g, {
        gameState: { isActive: true },
        gameData: { attempts: 0, maxAttempts: 3 },
        passwordField: { value: 'Hospital1987' },
        attemptsDisplay: { textContent: '' },
        checkPending: false,
    });
    g.calls = 0;
    g.validatePasswordWithServer = () => { g.calls++; return new Promise(r => setTimeout(r, 20)); };
    g.showFailure = () => {};
    return g;
}

test('Enter plus Submit during one pending check count one attempt', async () => {
    const g = makeGame();
    await Promise.all([g.submitPassword(), g.submitPassword()]);
    assert.equal(g.calls, 1);
    assert.equal(g.gameData.attempts, 1);
});

test('a later submit after the check finishes counts again', async () => {
    const g = makeGame();
    await g.submitPassword();
    await g.submitPassword();
    assert.equal(g.gameData.attempts, 2);
    assert.equal(g.checkPending, false);
});
