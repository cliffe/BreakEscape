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
copy('utils/computer-keywords.js');
copy('utils/author-html.js');
copy('minigames/framework/base-minigame.js');
copy('minigames/password/password-minigame.js');

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const {
    PasswordMinigame, applyTilePortrait, isTalkSheetSize, tileInitials, portraitUrl, signInRefusalMessage, signInErrorMessage, capturedSignIns,
    passwordScreenKind, headCropOffset, wholePixelOffset, SHORT_PORTRAIT_PX,
    TILE_PORTRAIT_PX, PORTRAIT_CROP_OVERRIDES, portraitCropOverride, snapInnerBoxes, unsnapInnerBoxes
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
    // Code review R1 m2: the screen stays open until the player closes it
    await new Promise((r) => setTimeout(r, 3000));
    assert.equal(ended.length, 0, 'not closed by itself');
    assert.equal(mg.gameState.isActive, true);
    assert.equal(messageText(), 'This account is locked on this PC.', 'the reason is still on screen');
    // There is no Cancel button (the user's UX notes): the X closes it
    assert.equal(q('#minigame-cancel'), null, 'no Cancel button');
    const close = q('#minigame-close');
    assert.equal(close.disabled, false);
    close.click();
    assert.equal(ended.length, 1, 'the X ends it');
    assert.equal(ended[0][0], false);
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

test('a square talk sheet shows a crop of its top-left frame; an odd-sized image is not fitted', async () => {
    const el = document.createElement('span');
    applyTilePortrait(el, TILES[0], fakeImage({ '/break_escape/assets/characters/sam_talk.png': [256, 256] }));
    await settle();
    assert.equal(el.dataset.frame, 'talk-sheet');
    assert.equal(el.style.backgroundSize, '256px 256px', 'the sheet at scale 1');
    assert.equal(el.style.backgroundPosition, '-32px 0px', 'unreadable alpha: the top centre of the frame');
    assert.match(el.style.backgroundImage, /sam_talk\.png/);

    // R4 n3: a 128x128 picture (no talk sheet, no 32 or 64 headshot) would have to shrink
    const single = document.createElement('span');
    applyTilePortrait(single, TILES[0], fakeImage({ '/break_escape/assets/characters/sam_talk.png': [128, 128] }));
    await settle();
    assert.equal(single.dataset.frame, 'initials');
    assert.equal(single.textContent, 'SO');
    assert.equal(single.style.backgroundSize, '');
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

test('UX access R2: a Wi-Fi key and a non-computer lock get the plain prompt; a computer keeps its screen', () => {
    assert.equal(passwordScreenKind({ join: { apId: 'guest_ap', apName: 'Guest Wi-Fi' } }), 'prompt');
    assert.equal(passwordScreenKind({ lockable: { scenarioData: { type: 'zip_archive' } } }), 'prompt');
    assert.equal(passwordScreenKind({ lockable: { scenarioData: { type: 'safe' } } }), 'prompt');
    assert.equal(passwordScreenKind({}), 'prompt');
    for (const type of ['pc', 'pc3', 'laptop', 'workstation', 'lab-workstation', 'osint-workstation', 'kiosk', 'tablet', 'mail_terminal', 'smartscreen']) {
        assert.equal(passwordScreenKind({ lockable: { scenarioData: { type } } }), 'screen', type);
    }
    // Code review R1 m3: the container's desktop keywords, as whole segments of the type
    for (const type of ['security_console', 'mainframe', 'ipad', 'monitor', 'smartboard', 'display2']) {
        assert.equal(passwordScreenKind({ lockable: { scenarioData: { type } } }), 'screen', type);
    }
    // a door or a room named for a server room, a room type, a word with pc inside: the plain panel
    for (const type of ['door', 'room_servers', 'npc', 'spcial_case', 'monitoring']) {
        assert.equal(passwordScreenKind({ lockable: { scenarioData: { type, name: 'Server Room' } } }), 'prompt', type);
    }
    // a launch that passes only the sprite: its texture key counts
    assert.equal(passwordScreenKind({ lockable: { texture: { key: 'laptop2' } } }), 'screen');
});

test('no Cancel button in sign-in mode: the X and Esc close it; Add to Notepad has its own row', () => {
    open();
    assert.equal(q('#minigame-cancel'), null, 'no Cancel button');
    assert.ok(q('#minigame-close'), 'the X stays');
    const rows = document.querySelectorAll('.minigame-controls');
    assert.equal(rows.length, 1, 'one controls row, for the notepad button');
    assert.deepEqual([...rows[0].children].map(b => b.id), ['minigame-notebook-postit']);
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.ok(ended.length >= 1, 'Esc closes it');
});

test('no Cancel button and no empty controls row on the plain and prompt screens', () => {
    for (const params of [
        { title: 'Office PC', lockable: { scenarioData: { id: 'pc1', type: 'pc' } }, type: 'object', correctPassword: 'x' },
        { title: 'Archive', lockable: { scenarioData: { id: 'zip', type: 'zip_file' } }, type: 'item', correctPassword: 'x' }
    ]) {
        document.body.innerHTML = '<div id="mg"></div>';
        window.MinigameFramework = { currentMinigame: null, endMinigame: () => {} };
        const mg = new PasswordMinigame(document.getElementById('mg'), params);
        window.MinigameFramework.currentMinigame = mg;
        mg.init();
        assert.equal(!!q('.password-minigame-area.prompt-mode'), params.title === 'Archive', `${params.title}: the screen kind`);
        assert.equal(q('#minigame-cancel'), null, `${params.title}: no Cancel button`);
        assert.ok(q('#minigame-close'), `${params.title}: the X stays`);
        assert.equal(document.querySelectorAll('.minigame-controls').length, 0, `${params.title}: no empty controls row`);
        mg.cleanup?.();
    }
});

// UX slice 2a R2 m1: Esc behaves as the X wherever the focus is: at once, closedByPlayer true,
// no "cancelled" message and no 800 ms wait.
test('R2 m1: Esc in the password field, the username field or the page ends exactly as the X', () => {
    const ends = {};
    const run = (label, act) => {
        const mg = open();
        if (label !== 'page' && label !== 'X') document.querySelectorAll('.signin-tile')[label === 'username' ? 2 : 0].click();
        act(mg);
        ends[label] = { ended: JSON.stringify(ended), byPlayer: mg.closedByPlayer === true,
            message: document.querySelector('.minigame-failure-message')?.textContent || null };
    };
    run('X', () => q('#minigame-close').click());
    const esc = (el) => el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    run('password', () => esc(q('#password-field')));
    run('username', () => esc(q('#signin-username')));
    run('page', () => esc(document));
    for (const label of ['password', 'username', 'page']) {
        assert.deepEqual(ends[label], ends.X, `Esc (${label}) matches the X`);
    }
    assert.equal(ends.X.byPlayer, true);
    assert.equal(ends.X.message, null, 'no "Sign-in cancelled." message');
    assert.equal(JSON.parse(ends.X.ended).length, 1, 'ended once, at once (no timer)');
});

test('R2 m1: Esc in the plain and prompt fields ends exactly as the X, at once', () => {
    for (const params of [
        { title: 'Office PC', lockable: { scenarioData: { id: 'pc1', type: 'pc' } }, type: 'object', correctPassword: 'x' },
        { title: 'Archive', lockable: { scenarioData: { id: 'zip', type: 'zip_archive' } }, type: 'item', correctPassword: 'x', showKeyboard: true },
        { title: 'Guest Wi-Fi', join: { apId: 'guest_ap', apName: 'Guest Wi-Fi' }, type: 'item' }
    ]) {
        const out = [];
        for (const how of ['X', 'Esc', 'key']) {
            const calls = [];
            document.body.innerHTML = '<div id="mg"></div>';
            window.MinigameFramework = { currentMinigame: null, endMinigame: (s, r) => calls.push([s, r]) };
            const mg = new PasswordMinigame(document.getElementById('mg'), params);
            window.MinigameFramework.currentMinigame = mg;
            mg.init(); mg.start();
            if (how === 'X') q('#minigame-close').click();
            else if (how === 'Esc') q('#password-field').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            else {
                const key = q('.key[data-key="Escape"]');
                if (!key) { out.push(out[0]); continue; }
                assert.equal(key.textContent, 'Esc', 'the on-screen key is Esc, not Cancel');
                key.click();
            }
            out.push(JSON.stringify({ calls, byPlayer: mg.closedByPlayer === true, msg: !!q('.minigame-failure-message') }));
            mg.cleanup?.();
        }
        assert.equal(out[1], out[0], `${params.title}: Esc in the field matches the X`);
        assert.equal(out[2], out[0], `${params.title}: the on-screen Esc key matches the X`);
        assert.match(out[0], /"byPlayer":true/, params.title);
        assert.match(out[0], /"msg":false/, params.title);
    }
});

// UX slice 2a R2 m3: the controls row (Add to Notepad) sits inside the frame, after the game area
test('R2 m3: Add to Notepad is inside the frame, after the game area, on the sign-in and plain screens', () => {
    open();
    const frame = q('.password-frame');
    const row = q('.minigame-controls');
    assert.equal(row.parentElement, frame, 'sign-in: the row is a child of the frame');
    assert.equal(frame.lastElementChild === row || row.previousElementSibling?.classList.contains('minigame-game-container') || !!frame.querySelector(':scope > .minigame-game-container ~ .minigame-controls'), true, 'after the game area');
    document.body.innerHTML = '<div id="mg"></div>';
    window.MinigameFramework = { currentMinigame: null, endMinigame: () => {} };
    const mg = new PasswordMinigame(document.getElementById('mg'), { title: 'Office PC', lockable: { scenarioData: { id: 'pc1', type: 'pc' } }, type: 'object', correctPassword: 'x', postitNote: 'pw: x', showPostit: true });
    window.MinigameFramework.currentMinigame = mg;
    mg.init();
    assert.ok(q('.password-frame > .minigame-game-container ~ .minigame-controls #minigame-notebook-postit'), 'plain: inside the frame, after the area');
    mg.cleanup?.();
});

// UX slice 2a R2 M2: in a short window the result line and Submit scroll into view
test('R2 M2: choosing a tile reveals Submit; a wrong password and a lockout reveal the message line', async () => {
    const revealed = [];
    const proto = window.HTMLElement.prototype;
    const had = proto.scrollIntoView;
    proto.scrollIntoView = function (opts) { revealed.push([this.id || this.className, opts?.block]); };
    try {
        const mg = open();
        document.querySelectorAll('.signin-tile')[0].click();
        assert.deepEqual(revealed.at(-1), ['submit-password', 'nearest'], 'Submit, after a tile is chosen');
        nextResult = wrong(2);
        q('#password-field').value = 'nope';
        await mg.submitPassword();
        assert.deepEqual(revealed.at(-1), ['signin-message', 'nearest'], 'the attempts-left line');
        nextResult = { ok: false, reason: 'locked_out', message: 'Locked out' };
        q('#password-field').value = 'nope';
        await mg.submitPassword();
        assert.deepEqual(revealed.at(-1), ['signin-message', 'nearest'], 'the lockout line');
    } finally {
        if (had) proto.scrollIntoView = had; else delete proto.scrollIntoView;
    }
});

// ── UX slice 2a R3 ───────────────────────────────────────────────────────────

function openPlain(extra = {}) {
    const calls = [];
    document.body.innerHTML = '<div id="mg"></div>';
    window.MinigameFramework = { currentMinigame: null, endMinigame: (s, r) => calls.push([s, r]) };
    window.playUISound = () => {};
    const mg = new PasswordMinigame(document.getElementById('mg'), {
        title: 'Office PC', lockable: { scenarioData: { id: 'pc1', type: 'pc' } }, type: 'object',
        correctPassword: 'x', postitNote: 'pw: x', showPostit: true, maxAttempts: 3, ...extra
    });
    window.MinigameFramework.currentMinigame = mg;
    mg.init(); mg.start();
    return { mg, calls };
}

// m1: the frame lands on whole pixels
test('R3 m1: wholePixelOffset moves a box onto whole device pixels', () => {
    assert.deepEqual(wholePixelOffset({ left: 135.5, top: 210.25 }), { x: 0.5, y: -0.25 });
    assert.deepEqual(wholePixelOffset({ left: 100, top: 47 }), { x: 0, y: 0 });
    assert.deepEqual(wholePixelOffset({ left: 10.25, top: 3.75 }, 2), { x: 0.25, y: 0.25 });
    assert.deepEqual(wholePixelOffset({ left: 100.0000001, top: 0 }), { x: 0, y: 0 }, 'float noise is 0');
});

test('R3 m1: the frame is snapped by top/left, again on resize, and the snap stops when the screen ends', () => {
    let rect = { left: 135.5, top: 118.5 };
    const proto = window.HTMLElement.prototype;
    const had = proto.getBoundingClientRect;
    proto.getBoundingClientRect = function () {
        if (!this.classList?.contains('password-frame')) return had.call(this);
        const dx = parseFloat(this.style.left) || 0, dy = parseFloat(this.style.top) || 0;
        return { left: rect.left + dx, top: rect.top + dy, right: 0, bottom: 0, width: 0, height: 0 };
    };
    try {
        const { mg } = openPlain();
        const frame = q('.password-frame');
        assert.equal(frame.style.left, '0.5px');
        assert.equal(frame.style.top, '0.5px');
        rect = { left: 140, top: 104.25 };
        window.dispatchEvent(new window.Event('resize'));
        assert.equal(frame.style.left, '', 'already whole: no offset');
        assert.equal(frame.style.top, '-0.25px');
        mg.complete(false);
        rect = { left: 1.5, top: 1.5 };
        window.dispatchEvent(new window.Event('resize'));
        assert.equal(frame.style.left, '', 'no snap after the screen ended');
    } finally {
        proto.getBoundingClientRect = had;
    }
});

test('R3 m1: tile text has whole-pixel line heights', () => {
    const css = readFileSync(join(here, '../../public/break_escape/css/password-minigame.css'), 'utf8');
    const rule = (sel) => css.slice(css.indexOf(`${sel} {`), css.indexOf('}', css.indexOf(`${sel} {`)));
    assert.match(rule('.signin-name'), /line-height:\s*17px/);
    assert.match(rule('.signin-username'), /line-height:\s*15px/);
    assert.match(rule('.password-message'), /line-height:\s*20px/);
    assert.doesNotMatch(css, /line-height:\s*1\.1\b/);
});

// m2: the plain screen's message goes on a line inside the screen, not the floating box
test('R3 m2: a wrong password on the plain screen is written on a line inside the screen, with no box', async () => {
    const { mg, calls } = openPlain();
    const line = q('#password-message');
    assert.ok(line.closest('.monitor-screen'), 'inside the screen');
    assert.equal(line.hidden, true, 'hidden until there is something to say');
    window.breakEscapeConfig = { gameId: 7 };
    window.ApiClient = { unlock: async () => { const e = new Error('422'); e.status = 422; e.body = {}; throw e; } };
    window.eventDispatcher = { emit: () => {} };
    q('#password-field').value = 'nope';
    await mg.submitPassword();
    assert.equal(line.hidden, false);
    assert.equal(line.textContent, 'Incorrect password. 2 attempts remaining.');
    assert.equal(line.dataset.kind, 'error');
    assert.equal(document.querySelectorAll('.minigame-failure-message').length, 0, 'no floating box');
    // the next try clears it while it waits
    window.ApiClient = { unlock: () => new Promise(() => {}) };
    q('#password-field').value = 'again';
    mg.submitPassword();
    await settle();
    assert.equal(line.hidden, true);
    assert.equal(calls.length, 0);
    delete window.ApiClient; delete window.breakEscapeConfig;
});

test('R3 m2: running out of tries says so on the line, then the screen closes as a failure', async () => {
    const { mg, calls } = openPlain({ maxAttempts: 1 });
    window.breakEscapeConfig = { gameId: 7 };
    window.ApiClient = { unlock: async () => { const e = new Error('422'); e.status = 422; e.body = {}; throw e; } };
    window.eventDispatcher = { emit: () => {} };
    q('#password-field').value = 'nope';
    const realTimeout = globalThis.setTimeout;
    const timers = [];
    globalThis.setTimeout = (fn, ms) => { timers.push(ms); return realTimeout(fn, 0); };
    try {
        await mg.submitPassword();
    } finally {
        globalThis.setTimeout = realTimeout;
    }
    assert.equal(q('#password-message').textContent, 'Maximum attempts exceeded. Access denied.');
    assert.equal(document.querySelectorAll('.minigame-failure-message').length, 0);
    assert.ok(timers.includes(1500));
    await settle();
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], false);
    assert.equal(calls[0][1].reason, 'max_attempts_exceeded');
    assert.notEqual(calls[0][1].closedByPlayer, true);
    delete window.ApiClient; delete window.breakEscapeConfig;
});

test('R3 m2: the plain note sits below the message line (the same pull-up as the sign-in note)', () => {
    const css = readFileSync(join(here, '../../public/break_escape/css/password-minigame.css'), 'utf8');
    assert.match(css, /\.password-minigame-area\.signin-mode \.postit-note,\s*\.password-minigame-area \.monitor-bezel:has\(\.password-message:not\(\[hidden\]\)\) \+ \.postit-note \{\s*margin-top: -40px;/);
    assert.match(css, /\.password-frame \.password-minigame-area\.signin-mode \.postit-note,\s*\.password-frame \.password-minigame-area \.monitor-bezel:has\(\.password-message:not\(\[hidden\]\)\) \+ \.postit-note \{\s*margin-top: -24px;/);
});

// m3: the player's own close has its own result; cancelPassword is gone
test("R3 m3: the X, Esc and the on-screen Esc key end with the player's own close result", () => {
    for (const how of ['X', 'Esc', 'key']) {
        const { mg, calls } = openPlain({ showKeyboard: true });
        if (how === 'X') q('#minigame-close').click();
        else if (how === 'Esc') q('#password-field').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        else q('.key[data-key="Escape"]').click();
        assert.equal(calls.length, 1, how);
        assert.deepEqual(calls[0], [false, { success: false, reason: 'closed', cancelled: true, closedByPlayer: true, attempts: 0 }], how);
        assert.equal(mg.closedByPlayer, true);
    }
    assert.equal(typeof PasswordMinigame.prototype.cancelPassword, 'undefined', 'cancelPassword is retired');
});

test('R3 m3: a lockout keeps its own result when the player then closes', async () => {
    const mg = open();
    document.querySelectorAll('.signin-tile')[0].click();
    nextResult = { ok: false, reason: 'locked_out', message: 'Locked out' };
    q('#password-field').value = 'nope';
    await mg.submitPassword();
    q('#minigame-close').click();
    assert.deepEqual(ended.at(-1), [false, { success: false, reason: 'locked_out' }]);
});

// m4: in a short window the tile row folds away once an account is chosen
test('R3 m4: choosing an account marks the screen chosen; Change goes back to the tiles', () => {
    const mg = open();
    const area = q('.signin-mode');
    assert.equal(area.classList.contains('signin-chosen'), false);
    document.querySelectorAll('.signin-tile')[0].click();
    assert.equal(area.classList.contains('signin-chosen'), true);
    assert.equal(q('#signin-selected').textContent, 'Sam Okafor (sokafor)', 'the name line is unchanged');
    q('#password-field').value = 'half typed';
    q('#signin-change').click();
    assert.equal(area.classList.contains('signin-chosen'), false);
    assert.equal(visible(q('#signin-form')), false, 'the tiles again, no form');
    assert.equal(q('#password-field').value, '', 'the field is cleared');
    assert.equal(messageText(), 'Choose an account.');
    assert.equal(mg.signInState.selected, null);
    document.querySelectorAll('.signin-tile')[2].click();
    assert.equal(area.classList.contains('signin-chosen'), true, 'Other user counts as chosen');
    // a remote screen has no tiles to fold
    const remote = open({ picker: false, tiles: [] });
    assert.equal(q('.signin-mode').classList.contains('signin-chosen'), false);
    remote.cleanup?.();
});

test('R3 m4: the short-window rule hides the tiles once chosen and shows Change only there', () => {
    const css = readFileSync(join(here, '../../public/break_escape/css/password-minigame.css'), 'utf8');
    const short = css.slice(css.indexOf('@media (max-height: 640px)'));
    assert.match(short, /\.password-frame \.signin-mode\.signin-chosen \.signin-tiles \{\s*display: none;/);
    assert.match(short, /\.password-frame \.signin-mode\.signin-chosen \.signin-change \{\s*display: inline-block;/);
    const base = css.slice(css.indexOf('.signin-change {'), css.indexOf('}', css.indexOf('.signin-change {')));
    assert.match(base, /display: none/);
    assert.match(base, /border: 2px solid/);
});

// n1: the 32px portrait is never the 128px frame scaled down
test('R3 n1: headCropOffset centres a 32x32 box on the head, 4px below its top', () => {
    // a 128 frame with a head from x 50 to 77 starting at row 6, shoulders wider lower down
    const alpha = (x, y) => ((y >= 6 && y < 40 && x >= 50 && x <= 77) || (y >= 40 && x >= 20 && x <= 108)) ? 255 : 0;
    assert.deepEqual(headCropOffset(alpha, 128), { left: 48, top: 10 });
    assert.deepEqual(headCropOffset(() => 0, 128), { left: 48, top: 0 }, 'blank: top centre');
    const edge = (x, y) => (y >= 120 && x < 4) ? 255 : 0;
    assert.deepEqual(headCropOffset(edge, 128), { left: 0, top: 96 }, 'kept inside the frame');
    assert.equal(SHORT_PORTRAIT_PX, 32);
});

test('R3 n1: a talk sheet gives the short window a head crop at scale 1; a 32x32 avatar comes first', async () => {
    const head = (x, y) => (y >= 2 && x >= 40 && x <= 70) ? 255 : 0;
    const el = document.createElement('span');
    applyTilePortrait(el, TILES[0], fakeImage({ '/break_escape/assets/characters/sam_talk.png': [256, 256] }), () => head);
    await settle();
    assert.equal(el.dataset.short, 'head-crop');
    assert.equal(el.style.getPropertyValue('--signin-short-size'), '256px 256px', 'the whole sheet at scale 1');
    assert.equal(el.style.getPropertyValue('--signin-short-position'), '-39px -6px');
    assert.match(el.style.getPropertyValue('--signin-short-image'), /sam_talk\.png/);
    assert.equal(el.style.backgroundSize, '256px 256px', 'the 64px tile keeps its own crop');
    assert.equal(el.style.backgroundPosition, '-23px -6px');

    const unreadable = document.createElement('span');
    applyTilePortrait(unreadable, TILES[0], fakeImage({ '/break_escape/assets/characters/sam_talk.png': [256, 256] }), () => null);
    await settle();
    assert.equal(unreadable.style.getPropertyValue('--signin-short-position'), '-48px 0px', 'top centre of the frame');

    const withAvatar = document.createElement('span');
    const tile = { ...TILES[0], avatar: 'assets/characters/sam_headshot.png' };
    applyTilePortrait(withAvatar, tile, fakeImage({
        '/break_escape/assets/characters/sam_talk.png': [256, 256],
        '/break_escape/assets/characters/sam_headshot.png': [32, 32]
    }), () => head);
    await settle(); await settle();
    assert.equal(withAvatar.dataset.short, 'avatar');
    assert.equal(withAvatar.style.getPropertyValue('--signin-short-size'), '32px 32px');
    assert.equal(withAvatar.style.getPropertyValue('--signin-short-position'), '0px 0px');
    assert.equal(withAvatar.dataset.frame, 'talk-sheet', 'the 64px tile still shows the talk frame');

    const bigAvatar = document.createElement('span');
    applyTilePortrait(bigAvatar, { ...TILES[0], avatar: 'assets/npc/avatars/sam.png' }, fakeImage({
        '/break_escape/assets/characters/sam_talk.png': [256, 256],
        '/break_escape/assets/npc/avatars/sam.png': [64, 64]
    }), () => head);
    await settle(); await settle();
    assert.equal(bigAvatar.dataset.short, 'head-crop', 'a 64px avatar would need a downscale: the crop stays');
});

test('R3 n1: the short-window portrait rule reads the crop properties; no 1/4 frame rule is left', () => {
    const css = readFileSync(join(here, '../../public/break_escape/css/password-minigame.css'), 'utf8');
    const short = css.slice(css.indexOf('@media (max-height: 640px)'));
    assert.match(short, /\.password-frame \.signin-portrait\[data-short\] \{\s*background-image: var\(--signin-short-image\) !important;\s*background-size: var\(--signin-short-size\) !important;\s*background-position: var\(--signin-short-position\) !important;/);
    assert.doesNotMatch(short, /quarter of a 128px/);
});

// n2: the Firefox scrollbar guard is slice 1's
test('R3 n2: the scrollbar guard tests the feature, and the scroller resets the inherited properties', () => {
    const css = readFileSync(join(here, '../../public/break_escape/css/password-minigame.css'), 'utf8');
    assert.match(css, /@supports not selector\(::-webkit-scrollbar\) \{\s*\.password-frame > \.minigame-game-container \{\s*scrollbar-color: #555 #101010;\s*scrollbar-width: auto;/);
    assert.match(css, /\.password-frame > \.minigame-game-container \{\s*scrollbar-color: auto;\s*scrollbar-width: auto;\s*\}/);
    assert.doesNotMatch(css, /-moz-appearance/);
    assert.match(css, /`\.pixel-scroll`/, 'the comment names the shared rule');
});

// R4 m1 and n3: every portrait is at a whole scale, in the 64px box as well as the 32px one
const sizeScale = (size, w, h) => {
    const m = /^(\d+)px (\d+)px$/.exec(size || '');
    if (!m) return null;
    const k = Number(m[1]) / w;
    return Number.isInteger(k) && k >= 1 && Number(m[2]) === h * k ? k : null;
};

test('R4 m1: the 64px tile is a 64x64 head crop of the talk frame at scale 1', async () => {
    assert.equal(TILE_PORTRAIT_PX, 64);
    const head = (x, y) => (y >= 2 && x >= 40 && x <= 70) ? 255 : 0;
    const el = document.createElement('span');
    applyTilePortrait(el, TILES[0], fakeImage({ '/break_escape/assets/characters/sam_talk.png': [256, 256] }), () => head);
    await settle();
    assert.equal(el.style.backgroundSize, '256px 256px');
    assert.equal(el.style.backgroundPosition, '-23px -6px', 'centred on the head, 4px below its top');
    // the same finder as the 32px crop, with a 64px box (the R4 review's o64 = o32 - 16)
    const alpha = (x, y) => ((y >= 6 && y < 40 && x >= 50 && x <= 77) || (y >= 40 && x >= 20 && x <= 108)) ? 255 : 0;
    assert.deepEqual(headCropOffset(alpha, 128, 64), { left: 32, top: 10 });
    assert.deepEqual(headCropOffset(alpha, 128), { left: 48, top: 10 });
});

test('R4 m1: no portrait box ever gets a background size that is not a whole multiple of the image', async () => {
    const head = (x, y) => (y >= 2 && x >= 20 && x <= 44) ? 255 : 0;
    const cases = [
        ['talk sheet', { portrait: 'assets/characters/sam_talk.png' }, { '/break_escape/assets/characters/sam_talk.png': [256, 256] }, [256, 256], 'talk-sheet'],
        ['big talk sheet', { portrait: 'assets/characters/sam_talk.png' }, { '/break_escape/assets/characters/sam_talk.png': [512, 512] }, [512, 512], 'talk-sheet'],
        ['64 avatar', { avatar: 'assets/npc/avatars/sam.png' }, { '/break_escape/assets/npc/avatars/sam.png': [64, 64] }, [64, 64], 'single'],
        ['32 headshot', { avatar: 'assets/characters/sam_headshot.png' }, { '/break_escape/assets/characters/sam_headshot.png': [32, 32] }, [32, 32], 'single'],
        ['override sheet', { portrait: 'assets/characters/mr_ahmed_talk.png' }, { '/break_escape/assets/characters/mr_ahmed_talk.png': [256, 256] }, [256, 256], 'talk-sheet'],
        ['120 picture', { portrait: 'assets/characters/male_hacker_hood_talk.png' }, { '/break_escape/assets/characters/male_hacker_hood_talk.png': [120, 120] }, null, 'initials'],
        ['128 picture', { portrait: 'assets/characters/x.png' }, { '/break_escape/assets/characters/x.png': [128, 128] }, null, 'initials']
    ];
    for (const [name, pics, sizes, natural, frame] of cases) {
        const el = document.createElement('span');
        applyTilePortrait(el, { username: 'sokafor', displayName: 'Sam Okafor', ...pics }, fakeImage(sizes), () => head);
        await settle(); await settle();
        assert.equal(el.dataset.frame, frame, name);
        assert.doesNotMatch(el.style.backgroundSize, /%|contain|cover/, name);
        if (!natural) {
            assert.equal(el.style.backgroundSize, '', `${name}: no picture`);
            assert.equal(el.textContent, 'SO', `${name}: initials in the pixel font`);
            assert.equal(el.dataset.short, undefined, name);
            continue;
        }
        assert.ok(sizeScale(el.style.backgroundSize, ...natural), `${name}: 64px box at ${el.style.backgroundSize}`);
        assert.equal(sizeScale(el.style.getPropertyValue('--signin-short-size'), ...natural), 1, `${name}: 32px box at scale 1`);
        assert.match(el.style.backgroundPosition, /^-?\d+px -?\d+px$/, `${name}: whole-pixel offset`);
    }
    // the 32x32 headshot fills the 64px box at x2, the only upscale
    const small = document.createElement('span');
    applyTilePortrait(small, { displayName: 'Sam', avatar: 'assets/characters/sam_headshot.png' }, fakeImage({ '/break_escape/assets/characters/sam_headshot.png': [32, 32] }));
    await settle();
    assert.equal(small.style.backgroundSize, '64px 64px');
    // the CSS has no fitted portrait rule left
    const css = readFileSync(join(here, '../../public/break_escape/css/password-minigame.css'), 'utf8');
    const rule = css.slice(css.indexOf('.signin-portrait {'), css.indexOf('}', css.indexOf('.signin-portrait {')));
    assert.doesNotMatch(rule, /background-size/);
});

test('R4 n3: bedside portraits use their own crops; an odd sheet falls through to the avatar or initials', async () => {
    for (const [file, crop] of Object.entries(PORTRAIT_CROP_OVERRIDES)) {
        for (const [box, o] of [[64, crop.tile], [32, crop.short]]) {
            assert.ok(o.left >= 0 && o.top >= 0 && o.left + box <= 128 && o.top + box <= 128, `${file} ${box} inside the frame`);
        }
    }
    assert.deepEqual(Object.keys(PORTRAIT_CROP_OVERRIDES).sort(),
        ['mr_ahmed_talk.png', 'mr_pryce_talk.png', 'mrs_kowalski_talk.png', 'ms_okafor_talk.png']);
    assert.equal(portraitCropOverride('/break_escape/assets/characters/mr_pryce_talk.png?v=2'), PORTRAIT_CROP_OVERRIDES['mr_pryce_talk.png']);
    assert.equal(portraitCropOverride('/break_escape/assets/characters/sam_talk.png'), null);

    const el = document.createElement('span');
    applyTilePortrait(el, { displayName: 'Mr Ahmed', portrait: 'assets/characters/mr_ahmed_talk.png' },
        fakeImage({ '/break_escape/assets/characters/mr_ahmed_talk.png': [256, 256] }), () => () => 255);
    await settle();
    assert.equal(el.style.backgroundPosition, '-36px -18px', 'the override, not the finder');
    assert.equal(el.style.getPropertyValue('--signin-short-position'), '-46px -32px');

    const odd = document.createElement('span');
    applyTilePortrait(odd, { displayName: 'Hood', portrait: 'assets/characters/male_hacker_hood_talk.png', avatar: 'assets/characters/male_hacker_hood_headshot.png' },
        fakeImage({ '/break_escape/assets/characters/male_hacker_hood_talk.png': [120, 120], '/break_escape/assets/characters/male_hacker_hood_headshot.png': [32, 32] }));
    await settle(); await settle();
    assert.equal(odd.dataset.frame, 'single', 'the headshot, not the 120px picture');
    assert.match(odd.style.backgroundImage, /headshot/);
});

// R4 m2: the boxes inside the frame are on whole pixels too
function mockRects(base) {
    const proto = window.HTMLElement.prototype;
    const had = proto.getBoundingClientRect;
    proto.getBoundingClientRect = function () {
        const hit = base.find(([sel]) => this.matches(sel));
        if (!hit) return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
        let dx = 0, dy = 0;
        for (let n = this; n?.style; n = n.parentElement) {
            dx += parseFloat(n.style.left) || 0;
            dy += parseFloat(n.style.top) || 0;
            const t = String(n.style.translate || '').split(' ');
            dx += parseFloat(t[0]) || 0;
            dy += parseFloat(t[1]) || 0;
        }
        return { left: hit[1].left + dx, top: hit[1].top + dy, right: 0, bottom: 0, width: 10, height: 10 };
    };
    return () => { proto.getBoundingClientRect = had; };
}
const whole = (el) => { const r = el.getBoundingClientRect(); return Number.isInteger(r.left) && Number.isInteger(r.top); };

test('R4 m2: odd boxes inside the frame are moved onto whole pixels, a positioned one by translate', async () => {
    const restore = mockRects([
        ['.password-input-container', { left: 557.5, top: 300 }],
        ['.toggle-password-btn', { left: 700, top: 520.5 }],
        ['#minigame-notebook-postit', { left: 590.5, top: 296.5 }],
        ['#password-message', { left: 613.5, top: 250 }]
    ]);
    try {
        const { mg } = openPlain();
        q('.toggle-password-btn').style.position = 'absolute';
        mg.resnapFrame();
        for (const sel of ['.password-input-container', '.toggle-password-btn', '#minigame-notebook-postit']) {
            assert.ok(whole(q(sel)), sel);
        }
        assert.equal(q('.password-input-container').style.position, 'relative');
        assert.equal(q('.password-input-container').style.left, '0.5px');
        assert.equal(q('.toggle-password-btn').style.left, '', 'a positioned box keeps its anchors');
        assert.equal(q('.toggle-password-btn').style.position, 'absolute');
        assert.match(q('.toggle-password-btn').style.translate, /px/);
        // a second snap starts from the layout, so offsets never add up
        mg.resnapFrame();
        assert.equal(q('.password-input-container').style.left, '0.5px');
        assert.ok(whole(q('.toggle-password-btn')));
        // a new message is snapped without a resize (the content observer)
        q('#password-field').value = '';
        await mg.submitPassword();
        await settle();
        assert.equal(q('#password-message').hidden, false);
        assert.ok(whole(q('#password-message')), 'the message line');
        mg.complete(false);
    } finally {
        restore();
    }
});

test('R4 m2: the offset keeps Chrome\'s 1/64px layout step; a late image or font re-snaps', () => {
    assert.deepEqual(wholePixelOffset({ left: 0, top: 702.984375 }), { x: 0, y: 0.015625 });
    const src = readFileSync(join(js, 'minigames/password/password-minigame.js'), 'utf8');
    assert.match(src, /frame\.addEventListener\('load', snap, true\)/);
    assert.match(src, /addEventListener\('loadingdone', snap\)/);
});

test('R4 n2: the short-window sign-in screen has 4px gaps', () => {
    const css = readFileSync(join(here, '../../public/break_escape/css/password-minigame.css'), 'utf8');
    const short = css.slice(css.indexOf('@media (max-height: 640px)'));
    assert.match(short, /\.password-frame \.signin-mode \.signin-screen \{\s*gap: 4px;\s*padding: 8px;/);
});

test('R4 m2: unsnapInnerBoxes puts back the inline values; nothing to move gives nothing', () => {
    const restore = mockRects([['.b', { left: 3.5, top: 4.5 }]]);
    try {
        document.body.innerHTML = '<div class="a"><span class="b" style="left: 2px"></span><span class="c"></span></div>';
        const moved = snapInnerBoxes(q('.a'), 1, window);
        assert.equal(moved.length, 1);
        assert.ok(whole(q('.b')));
        unsnapInnerBoxes(moved);
        assert.equal(q('.b').style.left, '2px');
        assert.equal(q('.b').style.position, '');
        assert.deepEqual(snapInnerBoxes(q('.c'), 1, window), []);
    } finally {
        restore();
    }
    const css = readFileSync(join(here, '../../public/break_escape/css/password-minigame.css'), 'utf8');
    assert.doesNotMatch(css, /transition:\s*all/, 'a snapped left/top must not animate');
});

test('R4 n1: an empty Submit brings the post-it into view first, then the line', async () => {
    const { mg } = openPlain();
    const order = [];
    q('.postit-note').scrollIntoView = () => order.push('postit');
    q('#password-message').scrollIntoView = () => order.push('line');
    q('#password-field').value = '';
    await mg.submitPassword();
    assert.deepEqual(order, ['postit', 'line']);
    assert.equal(q('#password-message').textContent, 'Please enter a password');
});

test('R4 n4: showScreenMessage has no duration option, and no caller passes one', () => {
    const src = readFileSync(join(js, 'minigames/password/password-minigame.js'), 'utf8');
    assert.match(src, /showScreenMessage\(text, \{ kind = 'error', closeAfterMs = 0 \} = \{\}\)/);
    assert.doesNotMatch(src, /showScreenMessage\([^;]*duration/);
});
