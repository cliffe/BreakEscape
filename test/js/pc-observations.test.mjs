// UI PC polish, item 1: a PC's world observations ("password locked") show in the world menu
// and the HUD label only while the PC is locked; once unlocked they go. Other objects, and
// type "pc" things that are not a locked PC (wall ports, switches, a headless controller),
// keep theirs. The real utils/pc-observations.js runs; the session store is a stand-in.
// Run with: node test/js/pc-observations.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const { isPcData, isPcLocked, worldObservations } = await import(join(js, 'utils/pc-observations.js'));

const sessions = (held = {}, locked = {}) => ({ has: (id) => !!held[id], isLocked: (id) => !!locked[id] });
const OBS = 'Derek\'s personal workstation, password locked';
const password = (locked) => ({ id: 'derek_computer', type: 'pc', lockType: 'password', locked });
const login = { id: 'sam_pc', type: 'pc', lockType: 'login', locked: true };

test('a password PC shows its observations while locked and drops them once unlocked', () => {
    assert.equal(worldObservations(password(true), OBS, sessions()), OBS);
    assert.equal(worldObservations(password(false), OBS, sessions()), null);
});

test('a sign-in PC is locked until a session is held, and again when that session is locked', () => {
    assert.equal(worldObservations(login, OBS, sessions()), OBS, 'no session: locked');
    assert.equal(worldObservations(login, OBS, sessions({ sam_pc: true })), null, 'signed in: unlocked');
    assert.equal(worldObservations(login, OBS, sessions({ sam_pc: true }, { sam_pc: true })), OBS, 'locked session: locked again');
    assert.equal(isPcLocked(login, undefined), true, 'no session store: the PC data decides');
});

test('anything that is not a locked-capable PC keeps its observations', () => {
    const port = { id: 'comms_port', type: 'pc', networkJack: true };
    const headless = { id: 'door_box', type: 'pc', lockType: 'login', headless: true };
    const noLock = { id: 'kiosk', type: 'pc' };
    const note = { id: 'sign', type: 'notes', locked: false };
    for (const data of [port, headless, noLock, note, null, undefined]) {
        assert.equal(isPcData(data), false);
        assert.equal(worldObservations(data, OBS, sessions({ sam_pc: true })), OBS);
    }
    assert.equal(isPcLocked(note, sessions()), false);
});

test('the world menu, the far-object line and the HUD label all go through it', () => {
    const game = readFileSync(join(js, 'core/game.js'), 'utf8');
    assert.match(game, /const detail = worldObservations\(data, resolveObjectField\(data, 'observations'/);
    assert.match(game, /const obs = worldObservations\(data, resolveObjectField\(data, 'observations'/);
    const label = readFileSync(join(js, 'ui/info-label.js'), 'utf8');
    assert.match(label, /worldObservations\(obj\.scenarioData, text, window\.pcSessions\)/);
});

test('the desktop and its taskbar no longer print the PC\'s observations', () => {
    const src = readFileSync(join(js, 'minigames/container/container-minigame.js'), 'utf8');
    const desktop = src.slice(src.indexOf('createMonitorDesktopUI() {'), src.indexOf('sessionNoticesHtml() {'));
    assert.doesNotMatch(desktop, /headerObservations|desktop-taskbar-note|pc-desktop-status/);
});
