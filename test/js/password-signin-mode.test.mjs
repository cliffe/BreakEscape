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
copy('utils/pc-monitor.js');
copy('utils/npc-headshot.js');
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
    assert.deepEqual(words, ['Omar:', 'ohaddad\u00a0/', 'Cedar-Omar-58', '<b>']);
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

test('UI PC polish 3: a tile never crops the talk image; a headshot, else the silhouette', async () => {
    // a talk sheet and a dialogue bust exist, no headshot file: the silhouette, not a crop
    const el = document.createElement('span');
    const missing = [];
    applyTilePortrait(el, { ...TILES[0], portrait: 'assets/characters/sam_talk.png' }, fakeImage({
        '/break_escape/assets/characters/sam_talk.png': [256, 256],
        '/break_escape/assets/npc/avatars/sam.png': [64, 64]
    }), undefined, { record: null, onMissing: (k) => missing.push(k) });
    await settle(); await settle();
    assert.equal(el.dataset.frame, 'silhouette');
    assert.match(el.style.backgroundImage, /pc-user-silhouette\.png/);
    assert.equal(el.style.backgroundSize, '64px 64px', 'the 32px silhouette at x2');
    assert.equal(el.style.getPropertyValue('--signin-short-size'), '32px 32px', 'and at x1 in the short window');
    assert.doesNotMatch(el.style.backgroundImage, /talk|avatars/);
    assert.equal(el.dataset.short, 'silhouette');
    assert.equal(el.textContent, '');
    assert.equal(missing.length, 1, 'the keys tried are logged once');

    // the authored headshot comes first and is drawn at x2
    const withHead = document.createElement('span');
    applyTilePortrait(withHead, { ...TILES[0], portrait: 'assets/characters/sam_talk.png' }, fakeImage({
        '/break_escape/assets/characters/sam_talk.png': [256, 256],
        '/break_escape/assets/characters/sam_headshot.png': [32, 32]
    }), undefined, { record: null });
    await settle(); await settle();
    assert.equal(withHead.dataset.frame, 'single');
    assert.equal(withHead.dataset.headshot, 'sam');
    assert.match(withHead.style.backgroundImage, /sam_headshot\.png/);
    assert.equal(withHead.style.backgroundSize, '64px 64px');
    assert.equal(withHead.style.getPropertyValue('--signin-short-size'), '32px 32px');

    // a headshot file of the wrong size is skipped, never fitted: the silhouette
    const odd = document.createElement('span');
    applyTilePortrait(odd, { ...TILES[0], portrait: 'assets/characters/sam_talk.png' }, fakeImage({
        '/break_escape/assets/characters/sam_headshot.png': [64, 64]
    }), undefined, { record: null });
    await settle(); await settle();
    assert.equal(odd.dataset.frame, 'silhouette');
});

test('UI PC polish 3: initials only without any image machinery', async () => {
    const noImages = document.createElement('span');
    applyTilePortrait(noImages, { username: 'ishaw', displayName: 'Ian Shaw' }, null, undefined, { record: null });
    assert.equal(noImages.dataset.frame, 'initials');
    assert.equal(noImages.textContent, 'IS');
    const silhouette = document.createElement('span');
    applyTilePortrait(silhouette, { username: 'ishaw', displayName: 'Ian Shaw' }, fakeImage({}), undefined, { record: null });
    assert.equal(silhouette.dataset.frame, 'silhouette', 'no pictures at all: the silhouette');
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

function openRemote(captured = [], { loading = false, current = null, preselect } = {}) {
    ended = []; signIns = []; alerts = [];
    document.body.innerHTML = '<div id="mg"></div>';
    window.MinigameFramework = { currentMinigame: null, endMinigame: (success, result) => ended.push([success, result]) };
    window.pcSessions = {
        signIn: async (...a) => { signIns.push(a); return typeof nextResult === 'function' ? nextResult() : nextResult; }
    };
    const mg = new PasswordMinigame(document.getElementById('mg'), {
        title: "Lena's PC", type: 'item',
        signIn: { pcId: 'lena_pc', pcName: "Lena's PC (HB-FIN-02)", picker: false, tiles: [], current,
            ...(preselect ? { preselect } : {}),
            remote: { footholdId: 'jack_comms_port', linkName: 'Drop box: comms room' }, captured,
            ...(loading ? { capturedLoading: true } : {}) },
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

test('9.3a / UX 2b0: the remote screen has no tiles of its own, says how it is reached, and a captured tile fills the form', () => {
    const mg = openRemote(capturedSignIns(CAPTURES, { lena: 'lfox', ian: 'ishaw' }, { lena: 'Ledger-Lena-9' }));
    assert.equal(document.querySelectorAll('#signin-tiles').length, 0, 'none of the PC\'s own account tiles (q92)');
    assert.match(q('.signin-remote').textContent, /Remote sign-in through Drop box: comms room/);
    assert.equal(document.querySelectorAll('.signin-captured-item').length, 0, 'no plain text buttons');
    const tiles = [...document.querySelectorAll('#signin-captured .signin-captured-tile')];
    assert.deepEqual(tiles.map(b => [b.querySelector('.signin-name').textContent, b.querySelector('.signin-username').textContent]),
        [['Finance (Lena)', 'lfox'], ['ishaw', 'ishaw']], 'with no NPC record, the capture\'s label names the tile');
    assert.ok(q('#signin-captured .signin-other'), 'an Other user tile for typing');
    assert.equal(mg.signInState.other, false, 'with captures, the tiles come first, as at the keyboard');
    assert.equal(visible(q('#signin-form')), false, 'no form until an account is chosen');
    assert.equal(messageText(), 'Choose an account.');
    assert.ok(q('#signin-captured').compareDocumentPosition(q('#signin-form')) & 4, 'the tiles sit above the form');
    tiles[1].click();
    assert.equal(mg.signInState.selected, 'ishaw');
    assert.equal(visible(q('#signin-username-row')), false, 'a tile chooses the account: no Username field');
    assert.equal(q('#password-field').value, '', 'no password the server has not served');
    assert.ok(tiles[1].classList.contains('selected'));
    assert.match(q('#signin-selected').textContent, /ishaw \(ishaw\)/);
    tiles[0].click();
    assert.equal(mg.signInState.selected, 'lfox');
    assert.equal(q('#password-field').value, 'Ledger-Lena-9');
    assert.ok(q('.signin-mode').classList.contains('signin-chosen'), 'a chosen account folds the row in a short window');
    assert.deepEqual(mg.getTestState().signIn.captured.map(c => [c.username, c.fillsPassword]), [['lfox', true], ['ishaw', false]]);
    assert.deepEqual(mg.getTestState().signIn.tiles, [], 'the PC\'s own tiles stay empty in the test state');
    assert.equal(JSON.stringify(mg.getTestState()).includes('Ledger-Lena-9'), false, 'the test state carries no password');
    q('#signin-captured .signin-other').click();
    assert.equal(mg.signInState.other, true);
    assert.ok(visible(q('#signin-username-row')), 'Other user shows the typed form');
    assert.ok(q('#signin-captured .signin-other').classList.contains('selected'));
    tiles[0].click();
    q('#signin-change').click();
    assert.equal(mg.signInState.other, false, 'Change goes back to the tiles');
    assert.equal(mg.signInState.selected, null);
    assert.equal(visible(q('#signin-form')), false);
});

test('UX 2b0: a captured tile is named and pictured from the NPC record the client holds', async () => {
    const savedImage = globalThis.Image;
    globalThis.Image = fakeImage({ '/break_escape/assets/characters/female_blowse_v2_headshot.png': [32, 32] });
    const lena = { id: 'lena', displayName: 'Lena Fox', spriteSheet: 'female_blowse_v2', spriteTalk: 'assets/characters/female_blowse_talk.png', creds: { username: 'lfox' } };
    window.npcManager = { getNPC: (id) => (id === 'lena' ? lena : null), npcs: new Map([['lena', lena]]) };
    try {
        openRemote(capturedSignIns(CAPTURES, { lena: 'lfox', ian: 'ishaw' }, {}));
        await settle();
        const [lenaTile, ianTile] = [...document.querySelectorAll('.signin-captured-tile')];
        assert.equal(lenaTile.querySelector('.signin-name').textContent, 'Lena Fox');
        assert.equal(lenaTile.title, 'Lena Fox, Finance (Lena)', 'the role label stays on the tile');
        const pic = lenaTile.querySelector('.signin-portrait');
        assert.equal(pic.dataset.headshot, 'female_blowse_v2', 'the authored headshot');
        assert.match(pic.style.backgroundImage, /female_blowse_v2_headshot\.png/);
        assert.equal(ianTile.querySelector('.signin-portrait').dataset.frame, 'silhouette', 'no record and no headshot: the silhouette');
        lenaTile.click();
        await settle();
        const box = q('.signin-selected-headshot');
        if (box) assert.match(box.style.backgroundImage, /female_blowse_v2_headshot\.png/, 'the chosen line shows the same face');
    } finally {
        globalThis.Image = savedImage;
        delete window.npcManager;
    }
});

test('UX 2b0: a captured tile signs in with its own username, and a refusal keeps the tile chosen', async () => {
    const mg = openRemote(capturedSignIns(CAPTURES, { lena: 'lfox', ian: 'ishaw' }, { lena: 'Ledger-Lena-9' }));
    q('#signin-username').value = 'typed-name';
    nextResult = { ok: false, reason: 'not_permitted', message: 'This account cannot sign in here', attemptsLeft: null };
    document.querySelectorAll('.signin-captured-tile')[1].click();
    q('#password-field').value = 'guess';
    await mg.submitPassword();
    assert.deepEqual(signIns, [['lena_pc', 'ishaw', 'guess', { foothold: 'jack_comms_port' }]], 'the tile\'s username, not the typed one');
    assert.equal(mg.signInState.selected, 'ishaw');
    assert.match(messageText(), /cannot sign in here/);
    nextResult = { ok: true, session: { username: 'lfox', displayName: 'Lena Fox' } };
    document.querySelectorAll('.signin-captured-tile')[0].click();
    await mg.submitPassword();
    assert.deepEqual(signIns[1], ['lena_pc', 'lfox', 'Ledger-Lena-9', { foothold: 'jack_comms_port' }]);
});

test('9.3a / 2b0 R1 m1: with no captures the typed form shows, and one line under it says so', () => {
    openRemote([]);
    assert.equal(document.querySelectorAll('.signin-tile').length, 0, 'no Other user tile with nothing to choose between');
    assert.equal(q('.signin-captured-title').textContent, 'Captured sign-ins: none yet.');
    assert.equal(q('.signin-captured-empty'), null, 'one line, not a heading and a second line');
    assert.equal(q('#signin-captured').dataset.state, 'none');
    assert.ok(q('#signin-form').compareDocumentPosition(q('#signin-captured')) & 4, 'the line sits below the form');
    assert.ok(visible(q('#signin-username-row')));
});

test('2b0 R1 M2: while the captures load the screen shows "Checking..." with no form and no focused field', () => {
    const mg = openRemote([], { loading: true });
    const fields = () => [q('#signin-username'), q('#password-field')];
    assert.match(q('#signin-captured').textContent, /Captured sign-ins\s*Checking\.\.\./);
    assert.equal(q('#signin-captured').dataset.state, 'loading');
    assert.ok(q('#signin-captured').compareDocumentPosition(q('#signin-form')) & 4, 'above where the form will be');
    assert.equal(visible(q('#signin-form')), false, 'no form while loading');
    assert.equal(mg.signInState.other, false, 'neither tiles nor the typed form chosen yet');
    assert.ok(!fields().includes(document.activeElement), 'no field has focus while loading');
    assert.equal(messageText(), '', 'no "Choose an account." with nothing to choose yet');
    // The list arrives with captures: the tiles, and still no field focused
    mg.setCapturedSignIns(capturedSignIns(CAPTURES, { lena: 'lfox' }, {}));
    assert.equal(q('#signin-captured').dataset.state, 'tiles');
    assert.equal(visible(q('#signin-form')), false);
    assert.ok(!fields().includes(document.activeElement), 'tiles: no field has focus');
    assert.equal(messageText(), 'Choose an account.');
});

test('2b0 R1 M2: with no captures the typed form appears once the list arrives, and only then takes focus', () => {
    const mg = openRemote([], { loading: true });
    assert.notEqual(document.activeElement, q('#signin-username'));
    mg.setCapturedSignIns([]);
    assert.equal(mg.signInState.other, true);
    assert.ok(visible(q('#signin-form')) && visible(q('#signin-username-row')));
    assert.equal(document.activeElement, q('#signin-username'), 'focus once, when the form appears');
    assert.equal(q('.signin-captured-title').textContent, 'Captured sign-ins: none yet.');
    assert.ok(q('#signin-form').compareDocumentPosition(q('#signin-captured')) & 4, 'the line moves below the form');
});

test('2b0 R2 m1: at the wait cap the typed form shows and takes focus once; the late tiles never take it', () => {
    const mg = openRemote([], { loading: true });
    const fields = () => [q('#signin-username'), q('#password-field')];
    assert.ok(!fields().includes(document.activeElement), 'no focus while waiting');
    mg.setCapturedSignIns([], { pending: true });
    assert.equal(mg.signInState.other, true);
    assert.ok(visible(q('#signin-form')) && visible(q('#signin-username-row')));
    assert.equal(document.activeElement, q('#signin-username'), 'focus once, as for an empty list');
    assert.equal(q('.signin-captured-title').textContent, 'Captured sign-ins: still checking.');
    assert.equal(mg.getTestState().signIn.capturedNote, 'pending');
    // The player moves to Password with Username still empty (a full redraw would pull focus
    // back to Username); then the list arrives
    q('#password-field').focus();
    let focusCalls = 0;
    for (const el of fields()) { const f = el.focus.bind(el); el.focus = () => { focusCalls++; f(); }; }
    mg.setCapturedSignIns(capturedSignIns(CAPTURES, { lena: 'lfox' }, {}));
    assert.equal(focusCalls, 0, 'the late list moves no focus');
    assert.equal(document.activeElement, q('#password-field'));
    assert.equal(mg.signInState.other, true, 'the player keeps the typed form');
    assert.deepEqual([...document.querySelectorAll('.signin-captured-tile')].map(b => b.querySelector('.signin-username').textContent), ['lfox']);
    assert.equal(q('#signin-captured').dataset.state, 'tiles');
    assert.equal(mg.getTestState().signIn.capturedNote, null);
});

test('2b0 R2 m1: a player who left the form before the late list gets the tiles', () => {
    const mg = openRemote([], { loading: true });
    mg.setCapturedSignIns([], { pending: true });
    q('#signin-username').blur();
    mg.setCapturedSignIns(capturedSignIns(CAPTURES, { lena: 'lfox' }, {}));
    assert.equal(mg.signInState.other, false);
    assert.equal(visible(q('#signin-form')), false);
    assert.notEqual(document.activeElement, q('#signin-username'));
});

test('2b0 R2 n1: a failed /capture_secrets says the captures could not be loaded', () => {
    const mg = openRemote([], { loading: true });
    mg.setCapturedSignIns([], { failed: true });
    assert.equal(q('.signin-captured-title').textContent, 'Captured sign-ins could not be loaded.');
    assert.equal(mg.signInState.other, true);
    assert.equal(document.activeElement, q('#signin-username'));
    assert.equal(mg.getTestState().signIn.capturedNote, 'failed');
});

test('9.3a: the captured list fills in after the screen has opened (review R1 minor 1)', () => {
    const mg = openRemote([], { loading: true });
    assert.match(q('#signin-captured').textContent, /Checking/);
    mg.setCapturedSignIns(capturedSignIns(CAPTURES, { lena: 'lfox' }, { lena: 'Ledger-Lena-9' }));
    const tiles = [...document.querySelectorAll('.signin-captured-tile')];
    assert.deepEqual(tiles.map(b => b.querySelector('.signin-username').textContent), ['lfox']);
    assert.equal(mg.signInState.other, false, 'late tiles with nothing typed: the tiles come first');
    assert.equal(visible(q('#signin-form')), false);
    tiles[0].click();
    assert.equal(q('#password-field').value, 'Ledger-Lena-9');
    assert.equal(mg.getTestState().signIn.capturedLoading, false);
});

test('UX 2b0: a player already typing when the captures arrive keeps the typed form', () => {
    const mg = openRemote([]);
    assert.equal(mg.signInState.other, true, 'no captures yet: the typed form');
    q('#signin-username').value = 'lf';
    mg.setCapturedSignIns(capturedSignIns(CAPTURES, { lena: 'lfox' }, {}));
    assert.equal(mg.signInState.other, true);
    assert.ok(visible(q('#signin-username-row')));
    assert.equal(q('#signin-username').value, 'lf');
    assert.ok(q('#signin-captured .signin-other').classList.contains('selected'));
});

test('2b0 R1 M2: a player with the cursor in Username (nothing typed) keeps the typed form', () => {
    const mg = openRemote([]);
    q('#signin-username').focus();
    assert.equal(document.activeElement, q('#signin-username'));
    mg.setCapturedSignIns(capturedSignIns(CAPTURES, { lena: 'lfox' }, {}));
    assert.equal(mg.signInState.other, true, 'focus counts as typing');
    assert.ok(visible(q('#signin-username-row')));
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
    // UX slice 2c: a PC's screens sit in the PC monitor frame, and the row is in its chin,
    // under the screen that holds the game area
    open();
    const row = q('.minigame-controls');
    assert.equal(row.parentElement, q('.pc-monitor-chin .pc-monitor-controls'), 'sign-in: the row is in the monitor chin');
    assert.ok(q('.pc-monitor-screen > .minigame-game-container'), 'the game area is the screen');
    assert.ok(q('.pc-monitor-screen').compareDocumentPosition(row) & window.Node.DOCUMENT_POSITION_FOLLOWING, 'after the game area');
    document.body.innerHTML = '<div id="mg"></div>';
    window.MinigameFramework = { currentMinigame: null, endMinigame: () => {} };
    const mg = new PasswordMinigame(document.getElementById('mg'), { title: 'Office PC', lockable: { scenarioData: { id: 'pc1', type: 'pc' } }, type: 'object', correctPassword: 'x', postitNote: 'pw: x', showPostit: true });
    window.MinigameFramework.currentMinigame = mg;
    mg.init();
    assert.ok(q('.pc-monitor-chin .pc-monitor-controls #minigame-notebook-postit'), 'plain: in the monitor chin');
    assert.equal(q('.password-frame'), null, 'a PC screen has no password frame');
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
        // A lock that is not a computer keeps the password frame (a PC's sits in the monitor)
        const { mg } = openPlain({ lockable: { scenarioData: { id: 'safe1', type: 'safe' } } });
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
    assert.ok(line.closest('.pc-monitor-screen'), 'inside the screen (the PC monitor, UX slice 2c)');
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

test('R4 m1 / UI PC polish 3: every tile picture is at a whole multiple of its image, in the 64px box and the 32px one', async () => {
    const cases = [
        ['32 headshot', { portrait: 'assets/characters/sam_talk.png' }, { '/break_escape/assets/characters/sam_headshot.png': [32, 32] }, 'single'],
        ['no headshot, a 64 avatar and a talk sheet', { portrait: 'assets/characters/sam_talk.png', avatar: 'assets/npc/avatars/sam.png' },
            { '/break_escape/assets/characters/sam_talk.png': [256, 256], '/break_escape/assets/npc/avatars/sam.png': [64, 64] }, 'silhouette'],
        ['120 picture', { portrait: 'assets/characters/male_hacker_hood_talk.png' }, { '/break_escape/assets/characters/male_hacker_hood_talk.png': [120, 120] }, 'silhouette']
    ];
    for (const [name, pics, sizes, frame] of cases) {
        const el = document.createElement('span');
        applyTilePortrait(el, { username: 'sokafor', displayName: 'Sam Okafor', ...pics }, fakeImage(sizes), undefined, { record: null });
        await settle(); await settle();
        assert.equal(el.dataset.frame, frame, name);
        assert.doesNotMatch(el.style.backgroundSize, /%|contain|cover/, name);
        assert.equal(sizeScale(el.style.backgroundSize, 32, 32), 2, `${name}: 64px box at x2`);
        assert.equal(sizeScale(el.style.getPropertyValue('--signin-short-size'), 32, 32), 1, `${name}: 32px box at x1`);
        assert.equal(el.style.backgroundPosition, '0px 0px', `${name}: no crop offset`);
    }
    // the CSS has no fitted portrait rule left
    const css = readFileSync(join(here, '../../public/break_escape/css/password-minigame.css'), 'utf8');
    const rule = css.slice(css.indexOf('.signin-portrait {'), css.indexOf('}', css.indexOf('.signin-portrait {')));
    assert.doesNotMatch(rule, /background-size/);
});

test('UI PC polish 4: "Other user" and its subtitle are one line each', () => {
    const css = readFileSync(join(here, '../../public/break_escape/css/password-minigame.css'), 'utf8');
    const rule = css.slice(css.indexOf('.signin-other .signin-name,'), css.indexOf('}', css.indexOf('.signin-other .signin-name,')));
    assert.match(rule, /\.signin-other \.signin-username/);
    assert.match(rule, /white-space: nowrap/);
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

test('R4 n2: the short-window sign-in screen has 4px gaps and 6px above and below', () => {
    const css = readFileSync(join(here, '../../public/break_escape/css/password-minigame.css'), 'utf8');
    const short = css.slice(css.indexOf('@media (max-height: 640px)'));
    assert.match(short, /\.password-frame \.signin-mode \.signin-screen \{\s*gap: 4px;\s*padding: 6px 8px;/);
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
    // UX slice 2c: on a PC the post-it is stuck on the monitor's chin, outside the screen's
    // scroll area, so it is always in view and only the line is revealed
    const { mg } = openPlain();
    const order = [];
    q('.postit-note').scrollIntoView = () => order.push('postit');
    q('#password-message').scrollIntoView = () => order.push('line');
    q('#password-field').value = '';
    await mg.submitPassword();
    assert.ok(q('.pc-monitor > .postit-note.pc-monitor-postit'), 'the note is on the frame');
    assert.deepEqual(order, ['line']);
    assert.equal(q('#password-message').textContent, 'Please enter a password');
});

// UX slice 2c R2 M1: a PC's password screen is the sign-in form's twin
test('2c R2 M1: a PC\'s password screen: "Password:", no attempts badge, the keyboard beside the eye, one button look', async () => {
    const { mg } = openPlain({ title: 'Kevin\'s Workstation', showKeyboard: true });
    assert.ok(q('.pc-monitor'), 'in the PC monitor');
    assert.equal(q('.attempts-counter'), null, 'no attempts badge');
    assert.equal(q('label[for="password-field"]').textContent, 'Password:', 'the plain label, no PC name');
    const row = q('.password-field-wrapper');
    const eye = q('#toggle-password'), keys = q('#keyboard-toggle');
    assert.ok(keys && row.contains(keys) && row.contains(eye), 'the keyboard toggle is in the field row');
    assert.equal(eye.nextElementSibling, keys, 'beside the eye');
    assert.equal(q('.password-controls'), null, 'no separate keyboard tile');
    for (const b of [eye, keys, q('#submit-password')]) assert.ok(b.classList.contains('pc-os-btn'), `${b.id}: the OS button look`);
    // A wrong password: the message line carries the count, and the test state still reads it
    mg.passwordField.value = 'wrong';
    mg.gameData.attempts = 1;
    mg.passwordIncorrect();
    assert.match(q('#password-message').textContent, /2 attempts remaining/);
    assert.equal(mg.getTestState().attemptsText, '1');
    mg.cleanup?.();
    // The sign-in screen's buttons wear the same look
    document.body.innerHTML = '<div id="mg"></div>';
    window.MinigameFramework = { currentMinigame: null, endMinigame: () => {} };
    const s = new PasswordMinigame(document.getElementById('mg'), {
        title: 'Sign in', signIn: { pcId: 'hot_desk', pcName: 'Hot desk PC', picker: 'accounts', tiles: [{ username: 'sokafor', displayName: 'Sam Okafor' }] }
    });
    window.MinigameFramework.currentMinigame = s;
    s.init();
    for (const id of ['#submit-password', '#signin-change', '#toggle-password']) assert.ok(q(id).classList.contains('pc-os-btn'), `${id}: the OS button look`);
    s.cleanup?.();
    // Outside a PC the old frame keeps its badge and keyboard tile
    const { mg: safe } = openPlain({ title: 'Wall safe', lockable: { scenarioData: { id: 'safe1', type: 'safe' } }, showKeyboard: true });
    assert.ok(q('.attempts-counter'), 'a safe keeps its badge');
    assert.ok(q('.password-controls #keyboard-toggle'), 'and its keyboard tile');
    assert.equal(q('.pc-os-btn'), null);
    safe.cleanup?.();
    // CSS: the thin theme skin, and no scale on press
    const css = readFileSync(join(here, '../../public/break_escape/css/password-minigame.css'), 'utf8');
    const frame = readFileSync(join(here, '../../public/break_escape/css/pc-monitor.css'), 'utf8');
    assert.doesNotMatch(css, /scale\(0\.95\)/, 'no scale(0.95) on the keyboard tile');
    const skin = frame.slice(frame.indexOf('[data-ui-theme] .pc-monitor button.pc-os-btn {'));
    assert.match(skin.slice(0, skin.indexOf('}')), /border-image-source: var\(--ui-small-button-image\);/);
    const base = frame.slice(frame.indexOf('.pc-monitor button.pc-os-btn {'));
    assert.match(base.slice(0, base.indexOf('}')), /border: 2px solid/);
});

// UX slice 2c R1 m9: the old password frame (Wi-Fi keys, archives, safes, case locks) keeps
// its own coverage now that the PC screens moved to the monitor
test('2c R1 m9: a non-computer lock keeps the password frame, with Add to Notepad after the game area', () => {
    const { mg } = openPlain({ title: 'Wall safe', lockable: { scenarioData: { id: 'safe1', type: 'safe' } } });
    assert.equal(q('.pc-monitor'), null, 'no PC monitor for a safe');
    const frame = q('.password-frame');
    assert.ok(frame, 'the password frame');
    const row = q('.minigame-controls');
    assert.ok(row && frame.contains(row), 'the row is inside the frame');
    assert.ok(q('.password-frame > .minigame-game-container').compareDocumentPosition(row) & window.Node.DOCUMENT_POSITION_FOLLOWING, 'after the game area');
    assert.ok(row.querySelector('#minigame-notebook-postit'), 'Add to Notepad in the row');
    mg.cleanup?.();
});

test('2c R1 m9: on a non-computer lock an empty Submit brings the post-it into view first, then the line', async () => {
    const { mg } = openPlain({ title: 'Archive', lockable: { scenarioData: { id: 'zip1', type: 'zip_archive' } } });
    const order = [];
    const note = q('.password-frame .postit-note');
    assert.ok(note, 'the note is in the password frame');
    assert.equal(q('.pc-monitor-postit'), null, 'not a monitor note');
    note.scrollIntoView = () => order.push('postit');
    q('#password-message').scrollIntoView = () => order.push('line');
    q('#password-field').value = '';
    await mg.submitPassword();
    assert.deepEqual(order, ['postit', 'line']);
    mg.cleanup?.();
});

test('2c R1 M2: inside the scaled PC screen a snap move is divided by the zoom', () => {
    const restore = mockRects([]);
    try {
        document.body.innerHTML = '<div class="a"><span class="b"></span></div>';
        const b = q('.b');
        Object.defineProperty(b, 'currentCSSZoom', { value: 2 });
        // A box drawn at x2: its own left/top move it twice as far on screen
        b.getBoundingClientRect = () => {
            const left = 3.5 + 2 * (parseFloat(b.style.left) || 0);
            const top = 4.5 + 2 * (parseFloat(b.style.top) || 0);
            return { left, top, right: left + 10, bottom: top + 10, width: 10, height: 10 };
        };
        const moved = snapInnerBoxes(q('.a'), 1, window);
        assert.equal(moved.length, 1);
        // 0.5px on screen is 0.25px on a box drawn at x2
        assert.equal(q('.b').style.left, '0.25px');
        assert.equal(q('.b').style.top, '0.25px');
    } finally {
        restore();
    }
});

test('R5 m1: a scaled box (a press) and everything in it is left out of the snap; a pure translate is not', () => {
    const restore = mockRects([['.p', { left: 10.5, top: 4 }], ['.pi', { left: 12.5, top: 6 }], ['.t', { left: 30.5, top: 8.5 }]]);
    try {
        document.body.innerHTML = '<div class="a"><button class="p" style="transform: scale(0.95)"><span class="pi"></span></button>'
            + '<span class="t" style="transform: translateY(-50%)"></span></div>';
        const moved = snapInnerBoxes(q('.a'), 1, window);
        assert.equal(moved.skipped, 2, 'the pressed button and its icon');
        assert.equal(q('.p').style.left, '', 'a pressed box is not moved mid-scale');
        assert.equal(q('.pi').style.left, '');
        assert.ok(whole(q('.t')), 'a translated box is still snapped');
        assert.equal(Object.keys(moved).length, 1, 'skipped is not a listed entry');
    } finally {
        restore();
    }
    // The press's end snaps again: the transition's end, else the frame after the release
    const src = readFileSync(join(js, 'minigames/password/password-minigame.js'), 'utf8');
    assert.match(src, /\['transitionend', 'transitioncancel', 'pointerup', 'keyup'\]\) frame\.addEventListener\(type, afterPress, true\)/);
    assert.match(src, /if \(!this\._innerSnapped\?\.skipped\) return;/, 'only after a snap that left a box out');
});

test('R5 n1: the snap reads every box before it writes; a child moved with its parent is not moved again', () => {
    const restore = mockRects([['.p', { left: 10.5, top: 4.5 }], ['.c', { left: 20.5, top: 9.5 }], ['.d', { left: 40.25, top: 2 }]]);
    const proto = window.HTMLElement.prototype;
    const mocked = proto.getBoundingClientRect;
    let reads = 0;
    proto.getBoundingClientRect = function () { reads++; return mocked.call(this); };
    try {
        document.body.innerHTML = '<div class="a"><div class="p"><span class="c"></span></div><span class="d"></span></div>';
        const moved = snapInnerBoxes(q('.a'), 1, window);
        // one read pass that writes, one that checks and finds nothing: 3 boxes, 6 reads
        assert.equal(reads, 6);
        for (const sel of ['.p', '.c', '.d']) assert.ok(whole(q(sel)), sel);
        assert.equal(q('.c').style.left, '', 'the child rides on its parent\'s move');
        assert.equal(moved.length, 2);
    } finally {
        proto.getBoundingClientRect = mocked;
        restore();
    }
});

test('R5 m2, m3, n2 to n5: the CSS', () => {
    const css = readFileSync(join(here, '../../public/break_escape/css/password-minigame.css'), 'utf8');
    const rule = (sel) => { const i = css.indexOf(`${sel} {`); assert.ok(i >= 0, sel); return css.slice(i, css.indexOf('}', i)); };
    // m2: in a short window the plain screen's note is pulled up 4px less, clear of Submit
    const shortCss = css.slice(css.indexOf('@media (max-height: 640px)'));
    assert.match(shortCss, /\.password-frame \.password-minigame-area:not\(\.signin-mode\) \.postit-note \{\s*margin-top: -44px;/);
    // m3: Press Start 2P on its 8px grid
    assert.match(rule('.signin-title'), /font-size: 16px;/);
    for (const m of css.matchAll(/font-family: 'Press Start 2P'[^}]*?font-size: (\d+)px/g)) {
        assert.equal(+m[1] % 8, 0, `Press Start 2P at ${m[1]}px`);
    }
    assert.match(rule('.password-info h4'), /font-size: 16px;[\s\S]*font-weight: normal;/);
    // the frame's X (the framework gives it Press Start 2P at 18px)
    assert.match(rule('.password-frame > .minigame-close-button'), /font-size: 16px;/);
    // no synthetic bold on GNF, and no 13.33px button default
    assert.match(rule('.attempts-counter span'), /font-weight: normal;/);
    assert.match(rule('.keyboard-toggle-btn'), /font-size: 16px;/);
    assert.match(rule('.signin-tile'), /font-size: 16px;/);
    // n2: the key's label colour fades with its background
    assert.match(rule('.key'), /transition: [^;]*color 0\.2s ease/);
    // n3: the padding and border sit inside the field's 100%
    assert.match(rule('.password-field'), /box-sizing: border-box;/);
    // n4: the sign-in labels get the plain screen's dark backing
    assert.match(rule('.signin-field-row label'), /background: #101820;[\s\S]*padding: 2px 8px;/);
    // n5: a wrong archive password fits the short window
    const short = css.slice(css.indexOf('@media (max-height: 640px)'));
    assert.match(short, /\.password-frame \.prompt-mode \.monitor-bezel \{\s*padding: 6px 12px;/);
});

test('R4 n4: showScreenMessage has no duration option, and no caller passes one', () => {
    const src = readFileSync(join(js, 'minigames/password/password-minigame.js'), 'utf8');
    assert.match(src, /showScreenMessage\(text, \{ kind = 'error', closeAfterMs = 0 \} = \{\}\)/);
    assert.doesNotMatch(src, /showScreenMessage\([^;]*duration/);
});

// UI slice 6 review R3 minor 1: the locked remote sign-in screen scrolled by 21 px at 1400x1000
// and clipped the remote line; with the account already chosen it has no use for the Captured
// sign-ins strip, so it leaves it out.
test('R3 m1: a locked remote sign-in screen keeps the remote line, banner and form, and drops the Captured strip', () => {
    const captured = capturedSignIns(CAPTURES, { lena: 'lfox', ian: 'ishaw' }, { lena: 'Ledger-Lena-9' });
    const mg = openRemote(captured, { current: { username: 'lfox', displayName: 'Lena Fox', locked: true }, preselect: 'lfox' });
    assert.match(q('.signin-remote').textContent, /Remote sign-in through Drop box: comms room/, 'the remote line stays');
    assert.match(q('.signin-current-locked').textContent, /Locked: Lena Fox/);
    assert.equal(q('#signin-captured'), null, 'no Captured sign-ins strip on a locked screen');
    assert.equal(document.querySelectorAll('.signin-captured-tile').length, 0);
    assert.ok(q('#password-field'), 'the password field is there');
    assert.equal(q('#signin-username').value, 'lfox', 'the held account is filled in');
    mg.cleanup?.();
});

test('R3 m1: an unlocked remote screen still shows its Captured sign-ins', () => {
    const captured = capturedSignIns(CAPTURES, { lena: 'lfox', ian: 'ishaw' }, { lena: 'Ledger-Lena-9' });
    const mg = openRemote(captured, { current: { username: 'ishaw', displayName: 'Ian Shaw' } });
    assert.ok(q('#signin-captured'), 'the strip stays when nothing is locked');
    mg.cleanup?.();
});
