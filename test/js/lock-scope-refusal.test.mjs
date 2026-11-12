// Review R4 m2: a 403 from POST /unlock whose reason is off, not_responding or unreachable
// refuses the PC a lock sits on, not the code. The password, combination, cryptex and flag
// screens say why, close as cancelled and count no try, so a right code is never shown as
// wrong. A 422 is still a wrong code.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const read = (rel) => readFileSync(join(js, rel), 'utf8');

const root = mkdtempSync(join(tmpdir(), 'lock-scope-refusal-'));
const put = (rel, text) => { mkdirSync(dirname(join(root, rel)), { recursive: true }); writeFileSync(join(root, rel), text); };
put('package.json', '{"type":"module"}');
put('config.js', 'export const ASSETS_PATH = "";\n');
put('utils/helpers.js', 'export function makeDraggable() {}\n');
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
put('utils/escape-html.js', read('utils/escape-html.js'));
put('utils/lock-scope-refusal.js', read('utils/lock-scope-refusal.js'));
put('utils/computer-keywords.js', read('utils/computer-keywords.js'));
put('minigames/framework/base-minigame.js', 'export class MinigameScene { constructor() {} cleanup() {} }\n');
for (const rel of ['minigames/password/password-minigame.js', 'minigames/combination/combination-minigame.js',
    'minigames/cryptex/cryptex-minigame.js']) put(rel, read(rel));

globalThis.window = { breakEscapeConfig: { gameId: 1 } };
const load = (rel) => import(pathToFileURL(join(root, rel)).href);
const { LOCK_SCOPE_REFUSAL_TEXT, lockScopeRefusal } = await load('utils/lock-scope-refusal.js');
const { PasswordMinigame } = await load('minigames/password/password-minigame.js');
const { CombinationMinigame } = await load('minigames/combination/combination-minigame.js');
const { CryptexMinigame } = await load('minigames/cryptex/cryptex-minigame.js');

const refused = (status, reason) => () => {
    const err = new Error('refused');
    err.status = status;
    err.body = reason ? { success: false, reason, message: LOCK_SCOPE_REFUSAL_TEXT[reason] } : { success: false, message: 'Invalid attempt' };
    throw err;
};
const serverSays = (answer) => { window.ApiClient = { unlock: async () => answer() }; };
const lockable = { scenarioData: { id: 'lena_vault' } };

test('lockScopeRefusal reads only a 403 with one of the three reasons', () => {
    const e = (status, reason) => ({ status, body: { reason } });
    assert.equal(lockScopeRefusal(e(403, 'off')), 'off');
    assert.equal(lockScopeRefusal(e(403, 'not_responding')), 'not_responding');
    assert.equal(lockScopeRefusal(e(403, 'unreachable')), 'unreachable');
    assert.equal(lockScopeRefusal(e(422, 'off')), null, 'a 422 is a wrong code');
    assert.equal(lockScopeRefusal(e(403, 'toString')), null, 'no inherited keys');
    assert.equal(lockScopeRefusal(e(403, undefined)), null);
    assert.equal(lockScopeRefusal(null), null);
    assert.deepEqual(LOCK_SCOPE_REFUSAL_TEXT, {
        off: 'This PC is off.', not_responding: 'This PC is not responding.', unreachable: "This PC can't be reached."
    });
});

// ── Password ────────────────────────────────────────────────────────────────

function makePassword() {
    const g = Object.create(PasswordMinigame.prototype);
    Object.assign(g, {
        params: { type: 'object', lockable },
        gameState: { isActive: true },
        gameData: { attempts: 0, maxAttempts: 1 },
        passwordField: { value: 'right-code', focus() {} },
        attemptsDisplay: { textContent: '' },
        checkPending: false,
    });
    g.shown = [];
    g.failedEvents = 0;
    g.showFailure = (message, autoClose) => g.shown.push([message, autoClose]);
    g.showSuccess = (message) => g.shown.push(['success', message]);
    g.emitPasswordFailed = () => { g.failedEvents++; };
    return g;
}

for (const reason of ['off', 'not_responding', 'unreachable']) {
    test(`password: a 403 ${reason} says why, closes as cancelled and counts no try`, async () => {
        serverSays(refused(403, reason));
        const g = makePassword();
        await g.submitPassword();
        assert.equal(g.gameData.attempts, 0, 'no try is counted');
        assert.equal(g.attemptsDisplay.textContent, 0);
        assert.deepEqual(g.shown, [[LOCK_SCOPE_REFUSAL_TEXT[reason], true]], 'one line, then the screen closes');
        assert.equal(g.failedEvents, 0, 'no password_failed: the password was not judged');
        assert.equal(g.gameResult.success, false);
        assert.equal(g.gameResult.cancelled, true);
        assert.equal(g.gameResult.refused, reason);
        assert.notEqual(g.gameResult.reason, 'max_attempts_exceeded', 'one try allowed, not locked out');
    });
}

test('password: a 422 is still a wrong password that counts', async () => {
    serverSays(refused(422));
    const g = makePassword();
    g.gameData.maxAttempts = 3;
    await g.submitPassword();
    assert.equal(g.gameData.attempts, 1);
    assert.equal(g.failedEvents, 1);
    assert.equal(g.gameResult, undefined);
});

// ── Combination and cryptex ─────────────────────────────────────────────────

function fakeContainer() {
    const els = {};
    return {
        els,
        querySelector(sel) {
            els[sel] ||= { disabled: false, textContent: '', className: '', classList: { add() {}, remove() {} } };
            return els[sel];
        }
    };
}

const screens = [
    ['combination', CombinationMinigame, '#comb-status', (m) => { m.dials = [1, 2, 3]; }, '_handleUnlock', 'Incorrect combination'],
    ['cryptex', CryptexMinigame, '#cryptex-status', (m) => { m.currentIndices = [0, 0]; m.alphabets = [['A'], ['B']]; }, '_handleSubmit', 'Incorrect']
];

function makeDial(Cls, setup) {
    const m = Object.create(Cls.prototype);
    Object.assign(m, { params: { type: 'object', lockable }, attemptCount: 0, maxAttempts: 1, isLocked: false,
        isSubmitting: false, gameContainer: fakeContainer() });
    setup(m);
    m.completed = [];
    m.complete = (ok) => m.completed.push(ok);
    m._handleReset = () => {};
    m._updateDialDisplay = () => {};
    m._updateDirectionIndicator = () => {};
    return m;
}

for (const [name, Cls, statusSel, setup, submit, wrongText] of screens) {
    test(`${name}: a 403 off with the right answer is not shown as wrong, counts no try and closes`, async (t) => {
        t.mock.timers.enable({ apis: ['setTimeout'] });
        serverSays(refused(403, 'off'));
        const m = makeDial(Cls, setup);
        await m[submit]();
        const status = m.gameContainer.els[statusSel].textContent;
        assert.equal(status, 'This PC is off.');
        assert.doesNotMatch(status, /Incorrect|Maximum/);
        assert.equal(m.attemptCount, 0, 'no try is counted');
        assert.equal(m.isLocked, true, 'no more turns while it closes');
        assert.deepEqual([m.gameResult.success, m.gameResult.cancelled, m.gameResult.refused], [false, true, 'off']);
        assert.notEqual(m.gameResult.maxAttemptsReached, true);
        assert.deepEqual(m.completed, []);
        t.mock.timers.tick(2000);
        assert.deepEqual(m.completed, [false], 'closes as a cancel');
    });

    test(`${name}: not_responding and unreachable read their own line`, async () => {
        for (const reason of ['not_responding', 'unreachable']) {
            serverSays(refused(403, reason));
            const m = makeDial(Cls, setup);
            await m[submit]();
            assert.equal(m.gameContainer.els[statusSel].textContent, LOCK_SCOPE_REFUSAL_TEXT[reason]);
            assert.equal(m.attemptCount, 0);
        }
    });

    test(`${name}: a 422 is still a wrong answer that counts`, async (t) => {
        t.mock.timers.enable({ apis: ['setTimeout'] });
        serverSays(refused(422));
        const m = makeDial(Cls, setup);
        m.maxAttempts = 3;
        await m[submit]();
        assert.equal(m.attemptCount, 1);
        assert.match(m.gameContainer.els[statusSel].textContent, new RegExp(wrongText));
    });
}

// ── The password starter: no "Password Rejected" toast after the screen said why ────

test('startPasswordMinigame shows no toast for a refused result, and still does for a cancel', async () => {
    const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
    const stubs = {
        './key-lock-system.js': 'export const generateKeyCutsForLock = () => {}; export const doesKeyMatchLock = () => false; export const PREDEFINED_LOCK_CONFIGS = {};',
        '../utils/key-cut-calculator.js': 'export default class KeyCutCalculator {}',
        './lockpick-catch.js': 'export const catchLockpickInView = () => {};',
        '../utils/lock-titles.js': 'export const keypadTitle = (t) => t;',
        '../utils/conditional-text.js': 'export const resolveObjectField = () => null;',
        '../minigames/framework/social-overlay.js': 'export const socialOverlayParams = () => ({});',
        './triage-starter.js': 'export const startInboxTriageMinigame = () => {};',
        '../utils/locked-hint.js': 'export const withLockedHint = (m) => m; export const appendLockedHint = (m) => m; export const lockedHintDuration = (l, d) => d;',
        '../utils/flag-wording.js': 'export const rejectionAlert = (l, t, d) => d;',
        './episode-starter.js': 'export const startEpisodeRunner = () => {};',
        './global-writer.js': 'export const writeGlobal = () => {};',
        './ink-minigame-launch.js': '',
        './mapping-minigame.js': ''
    };
    let src = read('systems/minigame-starters.js');
    for (const [spec, body] of Object.entries(stubs)) src = src.split(`'${spec}'`).join(`'${dataUrl(body)}'`);
    const alerts = [];
    let params;
    window.gameAlert = (...a) => alerts.push(a);
    window.MinigameFramework = { mainGameScene: {}, startMinigame: (type, c, p) => { params = p; } };
    window.minigameClosedByDamage = () => false;
    const { startPasswordMinigame } = await import(dataUrl(src));
    const calls = [];
    startPasswordMinigame(lockable, 'object', null, (ok, result) => calls.push([ok, result]));
    params.onComplete(false, { success: false, cancelled: true, refused: 'off' });
    assert.deepEqual(alerts, [], 'the screen already said "This PC is off."');
    assert.equal(calls.length, 1, 'the caller still hears the close');
    params.onComplete(false, { success: false, cancelled: true });
    assert.equal(alerts.length, 1, 'a plain cancel keeps its info toast');
});
