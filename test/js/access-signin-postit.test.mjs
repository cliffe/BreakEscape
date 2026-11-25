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
    '../utils/remote-host-text.js': dataUrl(readFileSync(join(js, 'utils/remote-host-text.js'), 'utf8')),
    '../minigames/biometrics/fingerprint-reader-minigame.js': dataUrl('export function startFingerprintReader() {}'),
    '../minigames/ble-scanner/ble-scanner-minigame.js': dataUrl('export function applyBlePairEffects() {}'),
    '../utils/lock-scope-refusal.js': dataUrl(readFileSync(join(js, 'utils/lock-scope-refusal.js'), 'utf8')),
    '../utils/dispense-on-unlock.js': dataUrl('export const wantsDispense = () => false; export const dispenseContents = async () => ({ ok: false }); export const afterContainerUnlock = async (d, o = {}) => { if (o.autoOpen !== false && o.openScreen) o.openScreen(); };'),
    './lockpick-catch.js': dataUrl('export function catchLockpickInView() { return false; } export function anyKeyMightFitLock() { return true; } export function lockKeyPinsOf() { return undefined; }')
};
let src = readFileSync(join(js, 'systems/unlock-system.js'), 'utf8');
for (const [spec, url] of Object.entries(stubs)) src = src.split(`'${spec}'`).join(`'${url}'`);

globalThis.window = {};
const { openLoginSignIn } = await import(dataUrl(src));
const { PcSessions } = await import(dataUrl(readFileSync(join(js, 'systems/pc-sessions.js'), 'utf8').split("'../utils/sync-before-fetch.js'").join(`'${dataUrl(readFileSync(join(js, 'utils/sync-before-fetch.js'), 'utf8'))}'`).split("'./mfa-client.js'").join(`'${dataUrl(readFileSync(join(js, 'systems/mfa-client.js'), 'utf8'))}'`).split("'./helpdesk-client.js'").join(`'${dataUrl(readFileSync(join(js, 'systems/helpdesk-client.js'), 'utf8'))}'`)));

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

// UX feedback slice 2a (main-01, main-12): on the sign-in screen the note is stuck on the
// bezel's lower-left, overhanging its left edge, as on the desktop. It sat off centre: it is
// the bezel's next sibling and a :nth-child(2) rule gave it a 140px left margin.
test('slice 2a: the sign-in post-it CSS pins the note to the bezel lower-left, never centred or offset by position', () => {
    const css = readFileSync(join(js, '../css/password-minigame.css'), 'utf8');
    const rule = (sel) => {
        const at = css.indexOf(`\n${sel} {`);
        assert.ok(at >= 0, `${sel} rule present`);
        return css.slice(at, css.indexOf('}', at));
    };
    const note = rule('.password-minigame-area .postit-note');
    assert.match(note, /align-self:\s*flex-start/, 'at the left of the column');
    // The exact place the user approved (review R1 n4): 14px past the bezel's left edge, as on
    // the desktop, and pulled 48px up over the frame
    assert.match(note, /\n\s*left:\s*-14px;/, 'overhangs the bezel left edge by 14px');
    assert.match(note, /margin:\s*-48px\s+0\s+0\s+0;/, 'pulled 48px up over the bezel frame');
    const desktop = readFileSync(join(js, '../css/container-minigame.css'), 'utf8');
    const deskNote = desktop.slice(desktop.indexOf('\n.container-minigame.desktop-mode > .postit-note {'));
    assert.match(deskNote.slice(0, deskNote.indexOf('}')), /left:\s*-14px;/, 'the same overhang as the desktop note');
    assert.match(note, /top:\s*auto/, 'no inherited top offset');
    assert.doesNotMatch(note, /translateX|margin-left:\s*auto|align-self:\s*center/, 'no centring');
    assert.doesNotMatch(css, /\.password-minigame-area \.postit-note:nth-child/, 'no nth-child margin moves it across');
});

// The user's UX notes (unlock-44, unlock-53): the password screen's frame wraps its content at
// every size, with the X inside it, and the area is sized to its content (no fixed-height band)
test('the password frame wraps the area: no fixed height, the X inside the frame', () => {
    const css = readFileSync(join(js, '../css/password-minigame.css'), 'utf8');
    const rule = (sel) => {
        const at = css.indexOf(`\n${sel} {`);
        assert.ok(at >= 0, `${sel} rule present`);
        return css.slice(at, css.indexOf('}', at));
    };
    assert.match(rule('.password-minigame-area'), /height:\s*auto;/, 'the area is sized to its content');
    assert.doesNotMatch(rule('.password-minigame-area'), /calc\(100%/, 'no fixed share of the window');
    const frame = rule('.minigame-container > .password-frame');
    assert.match(frame, /border:\s*2px solid/, 'a 2px frame');
    assert.match(frame, /flex:\s*0 1 auto/, 'shrinks in a short window');
    assert.match(rule('.password-frame > .minigame-game-container'), /overflow-y:\s*auto/, 'the area scrolls inside the frame');
    assert.match(rule('.password-frame > .minigame-close-button'), /top:\s*6px;[\s\S]*right:\s*6px;/, 'the X sits inside the frame corner');
});

// UX slice 2a R2 M1, M2 and m3: no 4px overflow, a pixel-art scrollbar, smaller sign-in tiles in
// a short window, and the controls row inside the frame. The live check (scrollHeight against
// clientHeight with scrollbars shown) is in the build log's R2 fixes section.
test('R2: the bezel adds no scroll overflow; the frame scrollbar is pixel art; short-window tiles; controls in the frame', () => {
    const css = readFileSync(join(js, '../css/password-minigame.css'), 'utf8');
    const rule = (sel, from = 0) => {
        const at = css.indexOf(`\n${sel} {`, from);
        assert.ok(at >= 0, `${sel} rule present`);
        return css.slice(at, css.indexOf('}', at));
    };
    const before = rule('.monitor-bezel::before');
    for (const side of ['top', 'left', 'right', 'bottom']) {
        assert.match(before, new RegExp(`\\n\\s*${side}:\\s*0;`), `bezel ::before ${side} 0 (it overflowed 4px)`);
    }
    assert.doesNotMatch(before, /:\s*-4px;/);
    const sb = '.password-frame > .minigame-game-container::-webkit-scrollbar';
    assert.match(rule(sb), /width:\s*12px/);
    const thumb = rule(`${sb}-thumb`);
    assert.match(thumb, /border:\s*2px solid/, 'a 2px-bordered thumb');
    assert.match(thumb, /border-radius:\s*0/, 'square');
    assert.doesNotMatch(css, /scrollbar[\s\S]{0,200}border-radius:\s*[1-9]/, 'no rounded scrollbar part');
    // R3 n2: slice 1's guard, which tests the feature the fallback stands in for
    assert.match(css, /@supports not selector\(::-webkit-scrollbar\) \{\s*\.password-frame > \.minigame-game-container \{\s*scrollbar-color:[^;]+;\s*scrollbar-width:\s*auto;/,
        'only an engine with no ::-webkit-scrollbar gets scrollbar-color and scrollbar-width (Chromium would drop the pixel-art rules for them)');
    assert.match(css, /`\.pixel-scroll`/, 'names the shared rule a later slice merges this into');
    const controls = rule('.password-frame > .minigame-controls');
    assert.match(controls, /flex:\s*0 0 auto/, 'a fixed row that does not scroll');
    const short = css.indexOf('@media (max-height: 640px)');
    assert.ok(short >= 0);
    const block = css.slice(short);
    assert.match(block, /\.password-frame \.signin-portrait \{\s*width:\s*32px;\s*height:\s*32px;/, 'a 32px portrait (R3 n1: a 32x32 crop at scale 1, not the frame shrunk)');
    assert.match(block, /\.password-frame \.signin-username \{\s*display:\s*none;/, 'no username line under a tile');
    assert.match(block, /\.password-frame \.signin-tile \{\s*width:\s*84px;/);
    assert.match(css, /\n\.password-minigame-area\.signin-mode \.postit-note,[^{]*\{\s*margin-top:\s*-40px;/, 'the sign-in note clears the message line');
    assert.match(block, /\.password-frame \.password-minigame-area\.signin-mode \.postit-note,[^{]*\{\s*margin-top:\s*-24px;/, 'and in a short window');
});
