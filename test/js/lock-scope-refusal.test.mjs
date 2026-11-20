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
put('utils/pc-monitor.js', read('utils/pc-monitor.js'));
put('utils/npc-headshot.js', read('utils/npc-headshot.js'));
put('minigames/framework/base-minigame.js', 'export class MinigameScene { constructor() {} cleanup() {} }\n');
// The real base class, for the hostile-label test of showFailure's plain-text path (K5 R1 m3)
put('minigames/framework/base-real.js', read('minigames/framework/base-minigame.js'));
put('minigames/pin/pin-minigame.js', read('minigames/pin/pin-minigame.js'));
for (const rel of ['utils/remote-host-text.js', 'minigames/password/password-minigame.js', 'minigames/combination/combination-minigame.js',
    'minigames/cryptex/cryptex-minigame.js']) put(rel, read(rel));

globalThis.window = { breakEscapeConfig: { gameId: 1 } };
const load = (rel) => import(pathToFileURL(join(root, rel)).href);
const { LOCK_SCOPE_REFUSAL_TEXT, lockScopeRefusal, lockScopeRefusalLine } = await load('utils/lock-scope-refusal.js');
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

// K5 (plan 10): an expired session token. The line names the token, so it is the server's.
const TOKEN_LINE = 'HB-FIN-02 sign-in token has expired.';
const expiredError = (message = TOKEN_LINE) => {
    const err = new Error('refused');
    err.status = 403;
    err.body = { success: false, reason: 'expired', message };
    return err;
};

test('K5: lockScopeRefusalLine gives the server line for expired, the table for the rest', () => {
    assert.equal(lockScopeRefusal(expiredError()), 'expired');
    assert.equal(lockScopeRefusalLine(expiredError()), TOKEN_LINE);
    assert.equal(lockScopeRefusalLine({ status: 403, body: { reason: 'off', message: 'anything' } }), 'This PC is off.',
        'the three PC lines never take the server text');
    assert.equal(lockScopeRefusalLine({ status: 422, body: { reason: 'expired', message: TOKEN_LINE } }), null);
    assert.equal(lockScopeRefusalLine({ status: 403, body: { reason: 'nope' } }), null);
    assert.equal(lockScopeRefusalLine(expiredError('')), 'This sign-in has expired.', 'an empty message falls back');
    assert.equal(lockScopeRefusalLine(expiredError({ html: 1 })), 'This sign-in has expired.', 'a non-string falls back');
    assert.equal(lockScopeRefusalLine(expiredError('x'.repeat(161))), 'This sign-in has expired.', 'an overlong message falls back');
    assert.ok(!Object.prototype.hasOwnProperty.call(LOCK_SCOPE_REFUSAL_TEXT, 'expired'), 'no generic table line for expired');
});

test('K5: password: an expired token says the server line, closes as cancelled and counts no try', async () => {
    serverSays(() => { throw expiredError(); });
    const g = makePassword();
    await g.submitPassword();
    assert.equal(g.gameData.attempts, 0);
    assert.deepEqual(g.shown, [[TOKEN_LINE, true]]);
    assert.equal(g.gameResult.refused, 'expired');
    assert.equal(g.failedEvents, 0);
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
    ['combination', CombinationMinigame, '#comb-status', (m) => { m.dials = [1, 2, 3]; }, '_handleUnlock', 'did not open it'],
    ['cryptex', CryptexMinigame, '#cryptex-status', (m) => { m.currentIndices = [0, 0]; m.alphabets = [['A'], ['B']]; }, '_handleSubmit', 'did not open it']
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

    test(`${name}: K5 an expired token reads the server's line and counts no try`, async () => {
        serverSays(() => { throw expiredError(); });
        const m = makeDial(Cls, setup);
        await m[submit]();
        assert.equal(m.gameContainer.els[statusSel].textContent, TOKEN_LINE);
        assert.equal(m.attemptCount, 0);
        assert.equal(m.gameResult.refused, 'expired');
        // A later refusal of another kind reads its own line, not the stale token line
        serverSays(refused(403, 'off'));
        const n = makeDial(Cls, setup);
        await n[submit]();
        assert.equal(n.gameContainer.els[statusSel].textContent, 'This PC is off.');
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

test('startPasswordMinigame shows no toast for a refused result or a player close, and still does for a refusal', async () => {
    const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
    const stubs = {
        './key-lock-system.js': 'export const generateKeyCutsForLock = () => {}; export const doesKeyMatchLock = () => false; export const PREDEFINED_LOCK_CONFIGS = {};',
        '../utils/key-cut-calculator.js': 'export default class KeyCutCalculator {}',
        './lockpick-catch.js': 'export const catchLockpickInView = () => {}; export function anyKeyMightFitLock() { return true; } export function lockKeyPinsOf() { return undefined; }',
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
    // UX slice 2a R3 m3: the X, Esc or the on-screen Esc key (PasswordMinigame.closeByPlayer)
    params.onComplete(false, { success: false, reason: 'closed', cancelled: true, closedByPlayer: true, attempts: 0 });
    assert.deepEqual(alerts, [], "the player's own close is not a rejection");
    assert.equal(calls.length, 2);
    params.onComplete(false, { success: false, reason: 'max_attempts_exceeded', attempts: 3 });
    assert.equal(alerts.length, 1, 'running out of tries still shows the rejection');
    assert.equal(alerts[0][1], 'error');
});

// K5 R1 m3: the expired line carries a scenario label; the password and PIN fallbacks (no message
// line on the screen) must show it as text, not markup
test('a hostile label in the expired line never becomes markup on the showFailure fallback', async () => {
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM('<!doctype html><body></body>');
    globalThis.document = dom.window.document;
    const { MinigameScene } = await load('minigames/framework/base-real.js');
    const { PinMinigame } = await load('minigames/pin/pin-minigame.js');
    const hostile = '<img src=x onerror=alert(1)> has expired.';
    const line = lockScopeRefusalLine({ status: 403, body: { reason: 'expired', message: hostile } });
    assert.equal(line, hostile, 'the helper hands the text over unchanged');
    for (const [name, Cls, call] of [
        ['password', PasswordMinigame, (m) => m.showScreenMessage(line, { closeAfterMs: 0 })],
        ['pin', PinMinigame, (m) => m.showPinMessage(line, 'wrong', 0)]
    ]) {
        const m = Object.create(Cls.prototype);
        m.messageContainer = document.createElement('div');
        m.showFailure = MinigameScene.prototype.showFailure;
        m.passwordMessageEl = null;
        m.messageLineElement = null;
        call(m);
        const box = m.messageContainer.querySelector('.minigame-failure-message');
        assert.ok(box, `${name}: the fallback box shows`);
        assert.ok(box.querySelector('img') === null, `${name}: no element came from the label`);
        assert.equal(box.textContent, hostile, `${name}: the label is text`);
    }
    delete globalThis.document;
});
