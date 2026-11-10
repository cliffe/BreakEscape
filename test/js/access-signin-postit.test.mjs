// Slice 9.1 step 2 (docs/achitechture/ACCESS_MODEL_SLICE_9_1_PLAN.md 5.3): the sticky note on
// the sign-in screen. openLoginSignIn takes the note from the GET /login_accounts answer, else
// the PC's own authored postitNote, else none; it never writes the answer's note onto the
// object's data, so each open asks again; pc_signin_shown carries hasPostit.
// unlock-system.js and pc-sessions.js are imported for real, with browser-only imports stubbed.
// Run with: node test/js/access-signin-postit.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

const stubs = {
    '../utils/constants.js': dataUrl('export const DOOR_ALIGN_OVERLAP = 64;'),
    '../core/rooms.js': dataUrl('export const rooms = {};'),
    './doors.js': dataUrl('export function unlockDoor() {}'),
    './minigame-starters.js': dataUrl('export function startLockpickingMinigame() {} export function startKeySelectionMinigame() {} export function startPinMinigame() {} export function startPasswordMinigame() {} export function startRansomwareDisplayMinigame() {} export function startBackupRecoveryMinigame() {} export function startInfusionPumpMinigame() {}'),
    './ui-sounds.js': dataUrl('export function playUISound() {}'),
    '../utils/locked-hint.js': dataUrl(readFileSync(join(js, 'utils/locked-hint.js'), 'utf8')),
    '../minigames/biometrics/fingerprint-reader-minigame.js': dataUrl('export function startFingerprintReader() {}'),
    './lockpick-catch.js': dataUrl('export function catchLockpickInView() { return false; }')
};
let src = readFileSync(join(js, 'systems/unlock-system.js'), 'utf8');
for (const [spec, url] of Object.entries(stubs)) src = src.split(`'${spec}'`).join(`'${url}'`);

globalThis.window = {};
const { openLoginSignIn } = await import(dataUrl(src));
const { PcSessions } = await import(dataUrl(readFileSync(join(js, 'systems/pc-sessions.js'), 'utf8')));

const NOTE = 'ohaddad / Omar-Note-PW-7731';
const TILES = [{ username: 'ohaddad', displayName: 'Omar Haddad' }];
let started, emitted, requests;

function reset({ answer = { loginAccounts: TILES }, error = null } = {}) {
    started = []; emitted = []; requests = [];
    window.breakEscapeConfig = { gameId: 3 };
    window.gameAlert = () => {};
    window.ApiClient = {
        loginAccounts: async (pcId) => {
            requests.push(pcId);
            if (error) throw error;
            return { pc_id: pcId, ...answer };
        }
    };
    const sessions = new PcSessions();
    sessions._emit = (name, data) => emitted.push([name, data]);
    window.pcSessions = sessions;
    window.MinigameFramework = { mainGameScene: {}, startMinigame: (type, c, params) => started.push([type, params]) };
}
const pc = (extra = {}) => ({ scenarioData: { id: 'omar_pc', type: 'pc', name: "Omar's PC", locked: true, lockType: 'login', ...extra } });
const shownEvents = () => emitted.filter(([n]) => n === 'pc_signin_shown').map(([, d]) => d);

test("the screen starts with the answer's note, shown, and it is not written onto the object's data", async () => {
    reset({ answer: { loginAccounts: TILES, postitNote: NOTE } });
    const lockable = pc({ hasPostit: true });
    await openLoginSignIn(lockable);
    assert.equal(started.length, 1);
    assert.equal(started[0][1].postitNote, NOTE);
    assert.equal(started[0][1].showPostit, true);
    assert.equal(lockable.scenarioData.postitNote, undefined, 'the note stays off the object');
    assert.equal(JSON.stringify(lockable.scenarioData).includes(NOTE), false);
    assert.deepEqual(requests, ['omar_pc']);
    assert.equal(shownEvents()[0].hasPostit, true);

    // A second open whose answer has none shows none
    reset({ answer: { loginAccounts: TILES } });
    await openLoginSignIn(lockable);
    assert.equal(started[0][1].postitNote, '');
    assert.equal(started[0][1].showPostit, false);
    assert.equal(shownEvents()[0].hasPostit, false);
});

test('with no note in the answer the authored one shows; showPostit false hides it', async () => {
    reset();
    await openLoginSignIn(pc({ postitNote: 'Printer code 4410' }));
    assert.equal(started[0][1].postitNote, 'Printer code 4410');
    assert.equal(started[0][1].showPostit, true);
    assert.equal(shownEvents()[0].hasPostit, true);

    reset();
    await openLoginSignIn(pc({ postitNote: 'Printer code 4410', showPostit: false }));
    assert.equal(started[0][1].showPostit, false);
    assert.equal(shownEvents()[0].hasPostit, false);
});

test('a failed request opens with the authored note, or none', async () => {
    reset({ error: Object.assign(new Error('boom'), { status: 500 }) });
    await openLoginSignIn(pc({ postitNote: 'Printer code 4410' }));
    assert.equal(started[0][1].postitNote, 'Printer code 4410');
    assert.equal(started[0][1].showPostit, true);

    reset({ error: Object.assign(new Error('boom'), { status: 500 }) });
    await openLoginSignIn(pc());
    assert.equal(started[0][1].postitNote, '');
    assert.equal(started[0][1].showPostit, false);
    assert.equal(shownEvents()[0].hasPostit, false);
});

test('an empty or non-string note in the answer falls back to the authored note', async () => {
    reset({ answer: { loginAccounts: TILES, postitNote: '' } });
    await openLoginSignIn(pc({ postitNote: 'Printer code 4410' }));
    assert.equal(started[0][1].postitNote, 'Printer code 4410');
    reset({ answer: { loginAccounts: TILES, postitNote: 42 } });
    await openLoginSignIn(pc());
    assert.equal(started[0][1].postitNote, '');
});

test('the remote sign-in branch, if present, makes no /login_accounts request', () => {
    // Slice 9.3a's client stream adds a remote branch to openLoginSignIn. Until then there is
    // nothing to test; once it lands this checks the branch never asks for the note.
    const body = src.slice(src.indexOf('export async function openLoginSignIn'));
    const fn = body.slice(0, body.indexOf('\nexport function'));
    if (!/remote|foothold/i.test(fn)) return;
    const remote = fn.slice(fn.search(/remote|foothold/i));
    const firstLoginAccounts = remote.indexOf('loginAccounts(');
    const branchEnd = remote.indexOf('return');
    assert.ok(firstLoginAccounts < 0 || (branchEnd >= 0 && branchEnd < firstLoginAccounts),
        'the remote branch returns before asking /login_accounts');
});
