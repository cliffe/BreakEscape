// Access model step 8 (docs/achitechture/ACCESS_MODEL_PLAN.md 5.3): the password
// minigame's sign-in mode. It has no attempt limit of its own: it shows the server's
// message and attemptsLeft, and stops only on a lockout; it shows no letter-case hint;
// it signs in through pc-sessions.js. A square talk-sheet portrait shows its top-left
// frame; a failed portrait falls back to the avatar, then the display name's initials.
// The real password-minigame.js and base-minigame.js run against jsdom.
// Run with: node test/js/password-signin-mode.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'password-signin-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('config.js', 'export const ASSETS_PATH = "/break_escape/assets";\n');
put('utils/helpers.js', 'export function makeDraggable() {}\n');
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
copy('utils/escape-html.js');
copy('utils/lock-scope-refusal.js');
copy('utils/author-html.js');
copy('minigames/framework/base-minigame.js');
copy('minigames/password/password-minigame.js');

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const {
    PasswordMinigame, applyTilePortrait, isTalkSheetSize, tileInitials, portraitUrl, signInRefusalMessage, signInErrorMessage, capturedSignIns
} = await import(pathToFileURL(join(dir, 'minigames/password/password-minigame.js')));

const TILES = [
    { username: 'sokafor', displayName: 'Sam Okafor', portrait: 'assets/characters/sam_talk.png', avatar: null },
    { username: 'ishaw', displayName: 'Ian Shaw', portrait: null, avatar: null }
];

let ended, signIns, nextResult, alerts;
function open({ picker = 'accounts', tiles = TILES, postitNote = 'Sam: sokafor / x' } = {}) {
    ended = []; signIns = []; alerts = [];
    document.body.innerHTML = '<div id="mg"></div>';
    window.MinigameFramework = { currentMinigame: null, endMinigame: (success, result) => ended.push([success, result]) };
    window.gameAlert = (...a) => alerts.push(a);
    window.playUISound = () => {};
    window.pcSessions = {
        signIn: async (pcId, username, password) => {
            signIns.push([pcId, username, password]);
            return typeof nextResult === 'function' ? nextResult(username, password) : nextResult;
        }
    };
    const mg = new PasswordMinigame(document.getElementById('mg'), {
        title: 'Hot desk PC', lockable: { scenarioData: { id: 'hot_desk' } }, type: 'item',
        signIn: { pcId: 'hot_desk', pcName: 'Hot desk PC', picker, tiles, current: null },
        postitNote, showPostit: true
    });
    window.MinigameFramework.currentMinigame = mg;
    mg.init();
    mg.start();
    return mg;
}
const q = (sel) => document.querySelector(sel);
const visible = (el) => !!el && el.style.display !== 'none';
const messageText = () => q('#signin-message').textContent;
const wrong = (attemptsLeft) => ({ ok: false, reason: 'wrong', message: 'Incorrect username or password', attemptsLeft });

test('tiles for each account plus Other user; choosing a tile shows only the password field', () => {
    const mg = open();
    const tiles = [...document.querySelectorAll('.signin-tile')];
    assert.deepEqual(tiles.map(t => t.querySelector('.signin-name').textContent), ['Sam Okafor', 'Ian Shaw', 'Other user']);
    assert.equal(visible(q('#signin-form')), false, 'no form until an account is chosen');
    tiles[0].click();
    assert.equal(visible(q('#signin-form')), true);
    assert.equal(visible(q('#signin-username-row')), false);
    assert.equal(mg.getTestState().signIn.selected, 'sokafor');
    tiles[2].click();
    assert.equal(visible(q('#signin-username-row')), true, 'Other user types a username');
    assert.equal(mg.getTestState().signIn.otherUser, true);
    assert.ok(q('.postit-note').textContent.includes('Sam: sokafor'), "the PC's own post-it");
    assert.equal(q('.attempts-counter'), null, 'no attempts counter of its own');
});

test('the post-it never breaks a word across lines: each word is a keep-whole span (UX access R1 finding 7)', () => {
    open({ postitNote: 'Omar: ohaddad / Cedar-Omar-58 <b>' });
    const words = [...document.querySelectorAll('.postit-note .keep-whole')].map(el => el.textContent);
    assert.deepEqual(words, ['Omar:', 'ohaddad', '/', 'Cedar-Omar-58', '<b>']);
    assert.equal(q('.postit-note b'), null, 'still escaped');
});

test('loginPicker false: no tiles, the username field from the start', () => {
    const mg = open({ picker: false });
    assert.equal(document.querySelectorAll('.signin-tile').length, 0);
    assert.equal(visible(q('#signin-form')), true);
    assert.equal(visible(q('#signin-username-row')), true);
    assert.deepEqual(mg.getTestState().signIn.tiles, []);
});

test('no attempt limit of its own: it shows the server\'s message and attemptsLeft and stays open', async () => {
    const mg = open();
    document.querySelectorAll('.signin-tile')[0].click();
    for (const left of [4, 3, 2, 1]) {
        nextResult = wrong(left);
        q('#password-field').value = 'nope';
        await mg.submitPassword();
        assert.equal(messageText(), `Incorrect username or password. ${left} attempt${left === 1 ? '' : 's'} left.`);
        assert.equal(q('#password-field').value, '', 'the field clears');
    }
    // No limit on the PC (attemptsLeft null): ten more refusals still leave it open
    for (let i = 0; i < 10; i++) {
        nextResult = wrong(null);
        q('#password-field').value = 'nope';
        await mg.submitPassword();
    }
    assert.equal(messageText(), 'Incorrect username or password.');
    assert.equal(mg.gameState.isActive, true);
    assert.equal(ended.length, 0);
    assert.equal(signIns.length, 14);
    assert.deepEqual(signIns[0], ['hot_desk', 'sokafor', 'nope']);
});

test('it stops only on a lockout, with the server\'s message', async () => {
    const mg = open();
    document.querySelectorAll('.signin-tile')[0].click();
    nextResult = { ok: false, reason: 'locked_out', message: 'This account is locked on this PC', attemptsLeft: 0, lockedOut: true };
    q('#password-field').value = 'right';
    await mg.submitPassword();
    assert.equal(messageText(), 'This account is locked on this PC.');
    assert.deepEqual(mg.gameResult, { success: false, reason: 'locked_out' });
    // Shown once (UX access R1 finding 2): the message line only, no toast, no failure box
    assert.equal(alerts.length, 0, 'no toast');
    assert.equal(document.querySelectorAll('.minigame-failure-message').length, 0, 'no failure box');
    assert.ok(q('#password-field').disabled && q('#submit-password').disabled, 'the form is disabled');
});

test('not permitted keeps the screen open with the server\'s message, and no letter-case hint ever shows', async () => {
    const mg = open({ picker: false });
    nextResult = { ok: false, reason: 'not_permitted', message: "This account can't sign in on this PC", attemptsLeft: null, caseMismatch: true };
    q('#signin-username').value = 'sokafor';
    q('#password-field').value = 'Right';
    await mg.submitPassword();
    assert.equal(messageText(), "This account can't sign in on this PC.");
    assert.equal(mg.gameState.isActive, true);
    nextResult = { ...wrong(3), caseMismatch: true };
    q('#password-field').value = 'RIGHT';
    await mg.submitPassword();
    assert.doesNotMatch(document.body.textContent, /case/i);
    assert.deepEqual(signIns.map(s => s[1]), ['sokafor', 'sokafor'], 'the typed username is sent');
});

test('a correct password signs in through pc-sessions and completes', async () => {
    const mg = open();
    document.querySelectorAll('.signin-tile')[1].click();
    nextResult = { ok: true, session: { pcId: 'hot_desk', npcId: 'ian', username: 'ishaw', displayName: 'Ian Shaw', via: 'password' } };
    q('#password-field').value = 'right-ian';
    await mg.submitPassword();
    assert.deepEqual(signIns, [['hot_desk', 'ishaw', 'right-ian']]);
    assert.equal(mg.gameResult.success, true);
    assert.equal(mg.gameResult.signIn.npcId, 'ian');
});

test('an empty username or password asks for it without a request', async () => {
    const mg = open({ picker: false });
    await mg.submitPassword();
    assert.equal(messageText(), 'Enter a username.');
    q('#signin-username').value = 'sokafor';
    await mg.submitPassword();
    assert.equal(messageText(), 'Enter the password.');
    assert.equal(signIns.length, 0);
});

// ── portraits ────────────────────────────────────────────────────────────────
function fakeImage(sizes) {
    return class {
        set src(v) {
            this._src = v;
            const size = sizes[v];
            setTimeout(() => {
                if (size) { this.naturalWidth = size[0]; this.naturalHeight = size[1]; this.onload?.(); }
                else this.onerror?.();
            }, 0);
        }
        get src() { return this._src; }
    };
}
const settle = () => new Promise(r => setTimeout(r, 25));

test('the talk-sheet rule and portrait URLs', () => {
    assert.equal(isTalkSheetSize(256, 256), true);
    assert.equal(isTalkSheetSize(512, 512), true);
    assert.equal(isTalkSheetSize(128, 128), false);
    assert.equal(isTalkSheetSize(256, 128), false);
    assert.equal(isTalkSheetSize(257, 257), false);
    assert.equal(portraitUrl('assets/characters/x_talk.png'), '/break_escape/assets/characters/x_talk.png');
    assert.equal(portraitUrl('/break_escape/x.png'), '/break_escape/x.png');
    assert.equal(portraitUrl('characters/x.png'), '/break_escape/assets/characters/x.png');
    assert.equal(portraitUrl(null), null);
    assert.equal(tileInitials('Sam Okafor'), 'SO');
    assert.equal(tileInitials('ishaw'), 'I');
    assert.equal(tileInitials(''), '?');
});

test('a square talk sheet shows its top-left frame; a single image is shown whole', async () => {
    const el = document.createElement('span');
    applyTilePortrait(el, TILES[0], fakeImage({ '/break_escape/assets/characters/sam_talk.png': [256, 256] }));
    await settle();
    assert.equal(el.dataset.frame, 'talk-sheet');
    assert.equal(el.style.backgroundSize, '200% 200%');
    assert.match(el.style.backgroundPosition, /^0(px)? 0(px)?$/);
    assert.match(el.style.backgroundImage, /sam_talk\.png/);

    const single = document.createElement('span');
    applyTilePortrait(single, TILES[0], fakeImage({ '/break_escape/assets/characters/sam_talk.png': [128, 128] }));
    await settle();
    assert.equal(single.dataset.frame, 'single');
    assert.equal(single.style.backgroundSize, 'contain');
});

test('a failed portrait falls back to the avatar, then to initials', async () => {
    const tile = { username: 'sokafor', displayName: 'Sam Okafor', portrait: 'assets/characters/missing_talk.png', avatar: 'assets/npc/avatars/sam.png' };
    const withAvatar = document.createElement('span');
    applyTilePortrait(withAvatar, tile, fakeImage({ '/break_escape/assets/npc/avatars/sam.png': [64, 64] }));
    await settle();
    assert.match(withAvatar.style.backgroundImage, /avatars\/sam\.png/);
    assert.equal(withAvatar.dataset.frame, 'single');

    const none = document.createElement('span');
    applyTilePortrait(none, tile, fakeImage({}));
    await settle();
    assert.equal(none.dataset.frame, 'initials');
    assert.equal(none.textContent, 'SO');

    const noPictures = document.createElement('span');
    applyTilePortrait(noPictures, { username: 'ishaw', displayName: 'Ian Shaw' }, fakeImage({}));
    assert.equal(noPictures.textContent, 'IS');
});

// q72 and review R2 nit 1: a switched-off PC says so, in the words its row and the keyboard use
test('the error line names a switched-off PC: off at the keyboard, not responding through a foothold', () => {
    assert.equal(signInErrorMessage({ error: true, status: 403, serverReason: 'off' }), 'This PC is off.');
    assert.equal(signInErrorMessage({ error: true, status: 403, serverReason: 'not_responding' }), 'This PC is not responding.');
    assert.equal(signInErrorMessage({ error: true, status: 403, serverReason: null }), "This PC can't be reached.");
    assert.equal(signInErrorMessage({ error: true, status: 404 }), "This PC can't be reached.");
    assert.equal(signInErrorMessage({ error: true, status: null }), 'Network error. Please try again.');
});

test('the refusal line', () => {
    assert.equal(signInRefusalMessage(wrong(1)), 'Incorrect username or password. 1 attempt left.');
    assert.equal(signInRefusalMessage(wrong(null)), 'Incorrect username or password.');
    assert.equal(signInRefusalMessage({ reason: 'locked_out', message: 'This account is locked on this PC', attemptsLeft: 0 }),
        'This account is locked on this PC.');
});

// ---------------------------------------------------------------- slice 9.3a step 8 (4.4)

const CAPTURES = {
    lena: { targetId: 'lena', kind: 'credential', address: 'lfox', roleLabel: 'Finance (Lena)', at: 2 },
    portal: { targetId: 'portal', kind: 'credential', address: 'someone@example.test', roleLabel: 'Staff portal', at: 1 },
    ian: { targetId: 'ian', kind: 'credential', address: 'ishaw', at: 3 },
    dev: { targetId: 'dev', kind: 'foothold', at: 4 }
};

function openRemote(captured = []) {
    ended = []; signIns = []; alerts = [];
    document.body.innerHTML = '<div id="mg"></div>';
    window.MinigameFramework = { currentMinigame: null, endMinigame: (success, result) => ended.push([success, result]) };
    window.pcSessions = {
        signIn: async (...a) => { signIns.push(a); return typeof nextResult === 'function' ? nextResult() : nextResult; }
    };
    const mg = new PasswordMinigame(document.getElementById('mg'), {
        title: "Lena's PC", type: 'item',
        signIn: { pcId: 'lena_pc', pcName: "Lena's PC (HB-FIN-02)", picker: false, tiles: [], current: null,
            remote: { footholdId: 'jack_comms_port', linkName: 'Drop box: comms room' }, captured },
        postitNote: '', showPostit: false
    });
    window.MinigameFramework.currentMinigame = mg;
    mg.init();
    mg.start();
    return mg;
}

test('9.3a: the captured list shows only targets in accounts; the password only when secrets has it', () => {
    const list = capturedSignIns(CAPTURES, { lena: 'lfox', ian: 'ishaw', dev: 'x' }, { lena: 'Ledger-Lena-9' });
    assert.deepEqual(list, [
        { targetId: 'lena', label: 'Finance (Lena)', username: 'lfox', password: 'Ledger-Lena-9' },
        { targetId: 'ian', label: 'ishaw', username: 'ishaw', password: null }
    ], 'a landing-page capture and a foothold are never offered');
    assert.deepEqual(capturedSignIns({}, { lena: 'lfox' }, {}), [], 'empty with no captures');
    assert.deepEqual(capturedSignIns(CAPTURES, undefined, undefined), [], 'a missing accounts map is {}');
});

test('9.3a: the remote screen has no tiles, says how it is reached, and a capture fills the form', () => {
    const mg = openRemote(capturedSignIns(CAPTURES, { lena: 'lfox', ian: 'ishaw' }, { lena: 'Ledger-Lena-9' }));
    assert.equal(document.querySelectorAll('.signin-tile').length, 0);
    assert.match(q('.signin-remote').textContent, /Remote sign-in through Drop box: comms room/);
    const items = [...document.querySelectorAll('.signin-captured-item')];
    assert.deepEqual(items.map(b => b.textContent), ['Finance (Lena) (lfox)', 'ishaw (ishaw)']);
    items[1].click();
    assert.equal(q('#signin-username').value, 'ishaw', 'the username always');
    assert.equal(q('#password-field').value, '', 'no password the server has not served');
    items[0].click();
    assert.equal(q('#signin-username').value, 'lfox');
    assert.equal(q('#password-field').value, 'Ledger-Lena-9');
    assert.deepEqual(mg.getTestState().signIn.captured.map(c => [c.username, c.fillsPassword]), [['lfox', true], ['ishaw', false]]);
    assert.equal(JSON.stringify(mg.getTestState()).includes('Ledger-Lena-9'), false, 'the test state carries no password');
});

test('9.3a: with no captures the list says so', () => {
    openRemote([]);
    assert.equal(document.querySelectorAll('.signin-captured-item').length, 0);
    assert.match(q('#signin-captured').textContent, /None yet/);
});

test('9.3a: the captured list fills in after the screen has opened (review R1 minor 1)', () => {
    const mg = openRemote([]);
    mg.signIn.capturedLoading = true;
    mg.setCapturedSignIns([]);
    assert.match(q('#signin-captured').textContent, /None yet/);
    mg.signIn.capturedLoading = true;
    q('#signin-captured').innerHTML = mg.capturedListHtml();
    assert.match(q('#signin-captured').textContent, /Checking/);
    mg.setCapturedSignIns(capturedSignIns(CAPTURES, { lena: 'lfox' }, { lena: 'Ledger-Lena-9' }));
    const items = [...document.querySelectorAll('.signin-captured-item')];
    assert.deepEqual(items.map(b => b.textContent), ['Finance (Lena) (lfox)']);
    items[0].click();
    assert.equal(q('#password-field').value, 'Ledger-Lena-9');
    assert.equal(mg.getTestState().signIn.capturedLoading, false);
});

test('9.3a: a remote sign-in sends the foothold through pc-sessions', async () => {
    nextResult = { ok: false, reason: 'remote_blocked', message: 'Remote sign-in is turned off on this PC', attemptsLeft: null };
    const mg = openRemote([]);
    q('#signin-username').value = 'lfox';
    q('#password-field').value = 'Ledger-Lena-9';
    await mg.submitPassword();
    assert.deepEqual(signIns, [['lena_pc', 'lfox', 'Ledger-Lena-9', { foothold: 'jack_comms_port' }]]);
    assert.equal(messageText(), 'Remote sign-in is turned off on this PC.');
});
