// The Hacktivity desktop app is one window. Leaving a mission must navigate to the host's "/"
// (which sends the app to its game's event page) and must never close the window or go to the
// admin-only /break_escape/missions page. Covers the shared helper, the game over screen's menu
// button, the showEndScreen button and the in-game menu's app-only "Back to missions" item.
// Real sources run against jsdom; the heavy imports are stubbed.
// Run with: bin/test-js test/js/app-mode-exit.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'app-mode-exit-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel, fix = (s) => s) => put(rel, fix(readFileSync(join(js, rel), 'utf8')));

copy('utils/desktop-app.js');
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
put('systems/global-writer.js', 'export function writeGlobal() {}\n');
put('systems/social-intel.js', 'export function grantFact() {}\nexport function readyToastText() { return ""; }\n');
put('events/combat-events.js', 'export const CombatEvents = {};\n');
put('music/music-controller.js', 'export default { getState() { return {}; } };\n');
put('ui/info-label.js', 'export function setHudLabel() {}\nexport function clearHudLabel() {}\n');
put('systems/player-combat.js', 'export function attacksDisabled() { return false; }\n');
put('ui/display-settings.js',
    'export const UI_THEMES = [], SIZE_STEPS = [], HEALTH_STYLES = [];\n' +
    'export function getDisplaySettings() { return {}; }\nexport function updateDisplaySettings() {}\nexport function missionTheme() { return null; }\n');
copy('ui/game-over-screen.js');
copy('ui/game-menu.js');
copy('systems/apply-actions.js');

globalThis.window = {}; // modules touch window at load
globalThis.document = {};
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { isDesktopApp } = await imp('utils/desktop-app.js');
const { GameOverScreen } = await imp('ui/game-over-screen.js');
const { GameMenu } = await imp('ui/game-menu.js');
const { showEndScreen } = await imp('systems/apply-actions.js');
console.log = () => {};

const APP_UA = 'Mozilla/5.0 Electron/30.0.0 HacktivityApp/0.1.0 (game=licence-to-hack; edition=demo)';
const BROWSER_UA = 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36';

// A jsdom window whose location and close are recorded.
function setup(userAgent) {
    const dom = new JSDOM('<!doctype html><body><div id="music-widget-btn-anchor"></div></body>', { pretendToBeVisual: true });
    const w = dom.window;
    const log = { href: [], closed: 0, focused: 0 };
    // jsdom cannot navigate, so stand in for the members the code touches
    const stand = {
        navigator: { userAgent },
        document: w.document,
        location: { set href(v) { log.href.push(v); }, get href() { return 'http://localhost/'; } },
        close: () => { log.closed++; },
        opener: { focus: () => { log.focused++; } },
        addEventListener: w.addEventListener.bind(w),
        removeEventListener: w.removeEventListener.bind(w),
        breakEscapeConfig: { hacktivityMode: true },
    };
    globalThis.window = stand;
    globalThis.document = w.document;
    return { w: stand, log };
}

test('isDesktopApp: only the app token counts', () => {
    assert.equal(isDesktopApp({ navigator: { userAgent: APP_UA } }), true);
    assert.equal(isDesktopApp({ navigator: { userAgent: BROWSER_UA } }), false);
    assert.equal(isDesktopApp({ navigator: { userAgent: 'HacktivityApp' } }), false);
    assert.equal(isDesktopApp({}), false);
});

test('game over main menu: the app goes to /, a browser to the missions page', () => {
    let { log } = setup(APP_UA);
    GameOverScreen.prototype.mainMenu.call({});
    assert.deepEqual(log.href, ['/']);

    ({ log } = setup(BROWSER_UA));
    GameOverScreen.prototype.mainMenu.call({});
    assert.deepEqual(log.href, ['/break_escape/missions']);
});

test('end screen button: the app goes to / and never closes; a browser closes the tab', () => {
    let { log } = setup(APP_UA);
    showEndScreen({ title: 'Done' });
    document.querySelector('#scenario-end-screen button').click();
    assert.deepEqual(log.href, ['/']);
    assert.equal(log.closed, 0);
    assert.equal(log.focused, 0);

    ({ log } = setup(BROWSER_UA));
    showEndScreen({ title: 'Done' });
    document.querySelector('#scenario-end-screen button').click();
    assert.deepEqual(log.href, []);
    assert.equal(log.closed, 1);
});

test('end screen button: a shell with a return link labels it with the shell label', () => {
    let { w, log } = setup(BROWSER_UA);
    w.breakEscapeConfig = { shellReturnUrl: '/shell/debrief', shellReturnLabel: 'Debrief' };
    showEndScreen({ title: 'Done', buttonText: 'Return to Missions' });
    const btn = document.querySelector('#scenario-end-screen button');
    assert.equal(btn.textContent, 'Debrief');
    btn.click();
    assert.deepEqual(log.href, ['/shell/debrief']);

    // No return link: the scenario's own text stands, even if a label is set
    ({ w } = setup(BROWSER_UA));
    w.breakEscapeConfig = { shellMenuUrl: '/shell/menu', shellReturnLabel: 'Debrief' };
    showEndScreen({ title: 'Done', buttonText: 'Custom' });
    assert.equal(document.querySelector('#scenario-end-screen button').textContent, 'Custom');
});

test('game menu: "Back to missions" exists only in the app', () => {
    setup(BROWSER_UA);
    let menu = new GameMenu();
    assert.equal(menu.overlay.querySelector('[data-action="leave"]'), null);

    setup(APP_UA);
    menu = new GameMenu();
    assert.ok(menu.overlay.querySelector('[data-action="leave"]'));
});

test('game menu: leaving asks first, saves, then goes to /', async () => {
    const { w } = setup(APP_UA);
    const calls = [];
    w.stateSync = { syncConfirmed: async () => { calls.push('sync'); return true; } };
    const menu = new GameMenu();
    menu._navigate = (url) => calls.push(['go', url]);

    menu.overlay.querySelector('[data-action="leave"]').click();
    assert.deepEqual(calls, [], 'asks before leaving');
    const panel = menu.overlay.querySelector('.game-menu-page[data-page="leave"]');
    assert.match(panel.textContent, /saved/i);

    // Stay goes back to a normal page and does not leave
    panel.querySelector('[data-leave="no"]').click();
    assert.deepEqual(calls, []);
    menu.overlay.querySelector('[data-action="leave"]').click();

    menu.overlay.querySelector('.game-menu-page[data-page="leave"] [data-leave="yes"]').click();
    await new Promise((r) => setTimeout(r, 0));
    assert.deepEqual(calls, ['sync', ['go', '/']]);
});

test('game menu: wording says progress is saved and unfinished puzzles restart', () => {
    setup(APP_UA);
    const menu = new GameMenu();
    menu.overlay.querySelector('[data-action="leave"]').click();
    const text = menu.overlay.querySelector('.game-menu-page[data-page="leave"]').textContent;
    assert.match(text, /progress is saved/i);
    assert.match(text, /puzzle or conversation you haven't finished starts again/i);
});

test('game menu: a failed save stays, shows the error, and offers Leave anyway', async () => {
    const { w } = setup(APP_UA);
    let tries = 0;
    w.stateSync = { syncConfirmed: async () => { tries++; return false; } };
    const menu = new GameMenu();
    const urls = [];
    menu._navigate = (u) => urls.push(u);
    menu.overlay.querySelector('[data-action="leave"]').click();
    const panel = menu.overlay.querySelector('.game-menu-page[data-page="leave"]');
    const error = panel.querySelector('.game-menu-leave-error');
    assert.equal(error.hidden, true);

    panel.querySelector('[data-leave="yes"]').click();
    await new Promise((r) => setTimeout(r, 0));
    assert.deepEqual(urls, [], 'does not leave on a failed save');
    assert.equal(error.hidden, false);
    assert.match(error.textContent, /Couldn't save just now/);
    const again = panel.querySelector('[data-leave="yes"]');
    assert.equal(again.textContent, 'Leave anyway');

    again.click();
    await new Promise((r) => setTimeout(r, 0));
    assert.deepEqual(urls, ['/']);
    assert.equal(tries, 1, 'Leave anyway does not save again');
});

test('game menu: a save that throws is treated as failed', async () => {
    const { w } = setup(APP_UA);
    w.stateSync = { syncConfirmed: async () => { throw new Error('offline'); } };
    const menu = new GameMenu();
    const urls = [];
    menu._navigate = (u) => urls.push(u);
    menu.overlay.querySelector('[data-action="leave"]').click();
    menu.overlay.querySelector('[data-leave="yes"]').click();
    await new Promise((r) => setTimeout(r, 0));
    assert.deepEqual(urls, []);
    assert.equal(menu.overlay.querySelector('.game-menu-leave-error').hidden, false);
});

// A host game shell (breakEscapeConfig.shellMenuUrl / shellReturnUrl) runs the game in its own
// tab, in a browser or in the app. Its pages win over both the app's "/" and closing the tab.
const SHELL = { hacktivityMode: true, shellMenuUrl: '/hacktivities/7/play/operations?selected=3',
                shellReturnUrl: '/hacktivities/7/play/operations/3/debrief', walkthroughUrl: 'https://example.org/sheet' };

for (const ua of [BROWSER_UA, APP_UA]) {
    const where = ua === APP_UA ? 'app' : 'browser';

    test(`shell (${where}): game over main menu goes to the shell menu`, () => {
        const { w, log } = setup(ua);
        w.breakEscapeConfig = { ...SHELL };
        GameOverScreen.prototype.mainMenu.call({});
        assert.deepEqual(log.href, [SHELL.shellMenuUrl]);
    });

    test(`shell (${where}): end screen button goes to the debrief and never closes`, () => {
        const { w, log } = setup(ua);
        w.breakEscapeConfig = { ...SHELL };
        showEndScreen({ title: 'Done' });
        document.querySelector('#scenario-end-screen button').click();
        assert.deepEqual(log.href, [SHELL.shellReturnUrl]);
        assert.equal(log.closed, 0);
    });

    test(`shell (${where}): one "Save and quit to menu" item that saves, then goes to the shell menu`, async () => {
        const { w } = setup(ua);
        w.breakEscapeConfig = { ...SHELL };
        const calls = [];
        w.stateSync = { syncConfirmed: async () => { calls.push('sync'); return true; } };
        const menu = new GameMenu();
        menu._navigate = (url) => calls.push(['go', url]);
        const items = menu.overlay.querySelectorAll('[data-action="leave"]');
        assert.equal(items.length, 1);
        assert.equal(items[0].textContent, 'Save and quit to menu');
        assert.ok(menu.overlay.querySelector('[data-action="walkthrough"]'));
        items[0].click();
        assert.match(menu.overlay.querySelector('.game-menu-page[data-page="leave"] h3').textContent, /Save and quit to menu/);
        menu.overlay.querySelector('[data-leave="yes"]').click();
        await new Promise((r) => setTimeout(r, 0));
        assert.deepEqual(calls, ['sync', ['go', SHELL.shellMenuUrl]]);
    });
}
