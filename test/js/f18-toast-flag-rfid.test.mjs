// Decision F18 engine fixes (m09/m10 phase 5, struggling player):
//   1. task/objective/unlock toasts fired two or three times (a toast already read was
//      pulled back into the hold each time another panel opened)
//   2. a wrong flag read "Password Rejected / Failed to enter correct password"
//   3. a flag station's link panel listed another machine's flags under "Submitted Flags"
//   4. the RFID dictionary-attack miss flashed past
// Run with: node --test test/js/f18-toast-flag-rfid.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const js = join(root, 'public/break_escape/js');
const read = (p) => readFileSync(join(root, p), 'utf8');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

// ---- 1. toasts ------------------------------------------------------------------
globalThis.window = {};
const overlaySrc = readFileSync(join(js, 'utils/overlay-open.js'), 'utf8');
const notifSrc = readFileSync(join(js, 'systems/notifications.js'), 'utf8')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split("'../ui/modal-stack.js'").join(`'${dataUrl('export const registerModal = () => () => {};')}'`)
    .split("'../utils/overlay-open.js'").join(`'${dataUrl(overlaySrc)}'`);
const N = await import(dataUrl(notifSrc));

test('a toast the player has already read is dismissed when a panel opens, not replayed', () => {
    const now = 100_000;
    const shown = [
        { type: 'success', shownAt: now - 300 },                 // a glimpse: replay once
        { type: 'success', shownAt: now - 1200 },                // read: dismiss
        { type: 'info', shownAt: now - 100, seen: true },        // already replayed once: dismiss
        { type: 'warning', shownAt: now - 100 },                 // warnings never held
    ];
    assert.deepEqual(N.pickRecentHoldable(shown, now), [shown[0]]);
    assert.deepEqual(N.pickStaleHoldable(shown, now), [shown[1], shown[2]]);
    // no toast is both replayed and dismissed
    const both = N.pickRecentHoldable(shown, now).filter((e) => N.pickStaleHoldable(shown, now).includes(e));
    assert.equal(both.length, 0);
});

test('holdRecentNotifications replays a glimpsed toast once, and a replayed one is never pulled again', async () => {
    const container = { els: [], appendChild(n) { this.els.push(n); n.parentNode = this; }, removeChild(n) { this.els = this.els.filter((e) => e !== n); n.parentNode = null; },
        querySelectorAll() { return this.els; } };
    const el = () => ({ classList: { add() {}, remove() {}, }, style: {}, set innerHTML(v) { this.html = v; },
        querySelector: () => ({ style: {}, addEventListener() {} }) });
    globalThis.document = { getElementById: (id) => (id === 'notification-container' ? container : null), createElement: el };
    window.MinigameFramework = { currentMinigame: null };
    const shownMessages = () => container.els.map((e) => e._toast.message);

    N.showNotification('New Task: Talk to Sorensen', 'info', 'Objective Updated', 0);
    assert.deepEqual(shownMessages(), ['New Task: Talk to Sorensen']);
    // panel opens 100 ms later: pulled into the hold
    window.MinigameFramework.currentMinigame = {};
    assert.equal(N.holdRecentNotifications(Date.now() + 100), 1);
    assert.deepEqual(shownMessages(), []);
    // panel closes: it shows again, marked as already seen
    window.MinigameFramework.currentMinigame = null;
    await new Promise((r) => setTimeout(r, 400));
    assert.deepEqual(shownMessages(), ['New Task: Talk to Sorensen']);
    assert.equal(container.els[0]._toast.seen, true);
    // another panel opens straight away: dismissed, NOT held a third time
    window.MinigameFramework.currentMinigame = {};
    assert.equal(N.holdRecentNotifications(Date.now() + 50), 0);
    window.MinigameFramework.currentMinigame = null;
    await new Promise((r) => setTimeout(r, 400));
    assert.deepEqual(shownMessages(), [], 'no third copy');
});

test('the same toast raised twice while a panel is open shows once', async () => {
    const appended = [];
    const el = () => ({ classList: { add() {}, remove() {} }, style: {}, set innerHTML(v) { this.html = v; },
        querySelector: () => ({ style: {}, addEventListener() {} }) });
    globalThis.document = { getElementById: () => ({ appendChild: (n) => appended.push(n), querySelectorAll: () => [] }), createElement: el };
    window.MinigameFramework = { currentMinigame: {} };
    N.showNotification('✓ Get inside the archive', 'success', 'Task Complete', 0);
    N.showNotification('✓ Get inside the archive', 'success', 'Task Complete', 0);
    N.showNotification('✓ Another task', 'success', 'Task Complete', 0);
    window.MinigameFramework.currentMinigame = null;
    await new Promise((r) => setTimeout(r, 400));
    assert.equal(appended.length, 2);
});

// ---- 2. flag wording ------------------------------------------------------------
const F = await import(dataUrl(read('public/break_escape/js/utils/flag-wording.js')));

test('a flag lock or station says "flag", a password lock keeps its wording', () => {
    const pw = { message: 'Failed to enter correct password.', title: 'Password Rejected' };
    assert.deepEqual(F.rejectionAlert({ scenarioData: { lockType: 'password' } }, 'item', pw), pw);
    assert.deepEqual(F.rejectionAlert({ scenarioData: { type: 'safe' } }, 'door', pw), pw);
    for (const lockable of [{ scenarioData: { lockType: 'flag' } }, { scenarioData: { type: 'flag-station' } },
        { lockType: 'flag' }, { scenarioData: { type: 'launch-device' } }]) {
        const r = F.rejectionAlert(lockable, 'item', pw);
        assert.equal(r.title, 'Flag not accepted');
        assert.match(r.message, /copied in full/);
        assert.doesNotMatch(r.message + r.title, /password/i);
    }
});

test('the station panel refuses a flag in flag words', () => {
    assert.match(F.flagRefusalLine('Invalid flag'), /^✗ Flag not accepted\. Check it was copied in full/);
    assert.match(F.flagRefusalLine(undefined), /Flag not accepted/);
    assert.match(F.flagRefusalLine('Incorrect flag'), /different machine/);
    assert.equal(F.flagRefusalLine('Flag already submitted'), '✗ Flag already submitted');
    assert.doesNotMatch(F.flagRefusalLine('Invalid flag'), /password/i);
});

test('starters use the flag wording; password and PIN pads keep theirs', () => {
    const src = read('public/break_escape/js/systems/minigame-starters.js');
    const i = src.indexOf("window.MinigameFramework.startMinigame('password'");
    assert.match(src.slice(i, i + 2500), /rejectionAlert\(lockable, type, \{ message: "Failed to enter correct password\.", title: 'Password Rejected' \}\)/);
    const p = src.indexOf("window.MinigameFramework.startMinigame('pin'");
    assert.match(src.slice(p, p + 2500), /PIN Rejected/);
    const fs = read('public/break_escape/js/minigames/flag-station/flag-station-minigame.js');
    assert.match(fs, /flagRefusalLine\(data\.message, \{ reason, ownerName \}\)/);
    assert.doesNotMatch(fs, /Incorrect decryption key/);
});

// ---- 3. per-station submitted flags --------------------------------------------
test('the station panel lists only its own flags', async () => {
    const fs = await import('node:fs');
    const os = await import('node:os');
    const { pathToFileURL } = await import('node:url');
    const tmp = fs.mkdtempSync(join(os.tmpdir(), 'f18-station-'));
    const mk = (p, c) => { fs.mkdirSync(dirname(join(tmp, p)), { recursive: true }); fs.writeFileSync(join(tmp, p), c); };
    mk('package.json', '{"type":"module"}');
    mk('minigames/framework/base-minigame.js', 'export class MinigameScene { constructor(c, params) { this.params = params; } }\n');
    mk('systems/apply-actions.js', 'export function applyActions() {}\n');
    mk('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
    mk('utils/flag-wording.js', read('public/break_escape/js/utils/flag-wording.js'));
    mk('minigames/flag-station/flag-station-minigame.js', read('public/break_escape/js/minigames/flag-station/flag-station-minigame.js'));
    globalThis.window = { gameState: { submittedFlags: ['catalogue_server_1', 'catalogue_server_2'] } };
    const { FlagStationMinigame } = await import(pathToFileURL(join(tmp, 'minigames/flag-station/flag-station-minigame.js')).href);

    // Tomb Beta: the server lists none of its flags as submitted, the game-wide list holds the catalogue's
    const beta = new FlagStationMinigame({}, { stationId: 'tomb_beta_station', submittedFlags: [] });
    assert.deepEqual(beta.submittedFlags, []);
    assert.match(beta.buildFlagHistory(), /No flags submitted yet/);
    // the drop terminal: its own two
    const drop = new FlagStationMinigame({}, { stationId: 'drop_terminal', submittedFlags: ['catalogue_server_1', 'catalogue_server_2'] });
    assert.deepEqual(drop.submittedFlags, ['catalogue_server_1', 'catalogue_server_2']);
    // no server list at all: never fall back to the game-wide list
    assert.deepEqual(new FlagStationMinigame({}, { stationId: 'tomb_beta_station' }).submittedFlags, []);
    // flags submitted this session on that station are remembered for that station only
    window.gameState.stationSubmittedFlags = { tomb_beta_station: ['tomb_beta_server_1'] };
    assert.deepEqual(new FlagStationMinigame({}, { stationId: 'tomb_beta_station', submittedFlags: [] }).submittedFlags, ['tomb_beta_server_1']);
    assert.deepEqual(new FlagStationMinigame({}, { stationId: 'drop_terminal', submittedFlags: [] }).submittedFlags, []);
    assert.match(read('public/break_escape/js/systems/interactions.js'), /submittedFlags:\s+Array\.isArray\(sprite\.scenarioData\.submittedFlags\)/);
    assert.match(read('app/controllers/break_escape/games_controller.rb'), /obj\['submittedFlags'\] = own\.filter_map/);
});

// ---- 4. RFID dictionary miss ----------------------------------------------------
test('a dictionary-attack miss is shown as a readable notice, not a 1.5 s flash', () => {
    const src = read('public/break_escape/js/minigames/rfid/rfid-minigame.js');
    const i = src.indexOf("attackType === 'dictionary'");
    const block = src.slice(i, src.indexOf("attackType === 'darkside'"));
    assert.match(block, /showError\('Dictionary attack found no keys'[\s\S]*?'notice'\)/);
    assert.match(block, /showProtocolInfo\(cardData\);\s*\n\s*\}, 3000\)/);
});
