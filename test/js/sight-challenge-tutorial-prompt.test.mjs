// Sight challenges (npc-sight-challenge.js) hold while the tutorial prompt is open.
// The prompt is plain DOM, not a minigame, so the watcher's minigame check missed
// it: m04's gate guard challenged on the first frame of a fresh game, on top of
// the prompt. The prompt counts as open from the call, through the settle delay,
// until the player answers.
// Run with: node --test test/js/sight-challenge-tutorial-prompt.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.Phaser = {
    Math: {
        Distance: { Between: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1) },
        Angle: { Between: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1) },
        RadToDeg: (r) => r * 180 / Math.PI
    }
};

// Just enough DOM for showTutorialPrompt: elements by id with click listeners
const elements = new Map();
function fakeElement() {
    const el = {
        className: '', listeners: {}, children: [],
        set innerHTML(html) {
            for (const [, id] of html.matchAll(/id="([^"]+)"/g)) elements.set(id, fakeElement());
        },
        addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
        click() { (this.listeners.click || []).forEach(fn => fn()); }
    };
    return el;
}
globalThis.document = {
    createElement: () => fakeElement(),
    getElementById: (id) => elements.get(id) || null,
    body: {
        children: [],
        appendChild(el) { this.children.push(el); },
        removeChild(el) { this.children = this.children.filter(c => c !== el); }
    }
};
globalThis.navigator = { userAgent: 'node' };
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.window = { innerWidth: 1280, gameState: { globalVariables: {} } };

const { TutorialManager } = await import(dataUrl(readFileSync(join(js, 'systems/tutorial-manager.js'), 'utf8')));
const losUrl = dataUrl(readFileSync(join(js, 'systems/npc-los.js'), 'utf8'));
const watcherSrc = readFileSync(join(js, 'systems/npc-sight-challenge.js'), 'utf8')
    .split("'./npc-los.js'").join(`'${losUrl}'`);
const { SightChallengeWatcher } = await import(dataUrl(watcherSrc));

// A guard at (0,0) facing right; the player stands in plain view from the start,
// as m04's gate guard sees the player on the first frame
function setup() {
    const emitted = [];
    const guard = {
        id: 'gate_guard', npcType: 'person', roomId: 'gate', x: 0, y: 0, facingDirection: 0,
        los: { enabled: true, range: 100, angle: 90, challengeOnSight: true }
    };
    window.npcManager = {
        npcs: new Map([['gate_guard', guard]]),
        eventDispatcher: { emit: (name, data) => emitted.push({ name, data }) }
    };
    window.gameState = { globalVariables: {} };
    window.currentPlayerRoom = 'gate';
    window.player = { x: 50, y: 0 };
    window.MinigameFramework = { currentMinigame: null };
    const tutorial = new TutorialManager();
    window.getTutorialManager = () => tutorial;
    elements.clear();
    return { emitted, tutorial, watcher: new SightChallengeWatcher() };
}

test('the prompt counts as open from the call, through the delay, until answered', async () => {
    const tutorial = new TutorialManager();
    assert.equal(tutorial.isPromptOpen(), false);
    elements.clear();
    const answer = tutorial.showTutorialPrompt({ delayMs: 20 });
    assert.equal(tutorial.isPromptOpen(), true, 'open during the settle delay');
    assert.equal(document.getElementById('tutorial-no'), null, 'modal not shown yet');
    await new Promise(r => setTimeout(r, 40));
    assert.equal(tutorial.isPromptOpen(), true, 'open while the modal is showing');
    document.getElementById('tutorial-yes').click();
    assert.equal(await answer, true);
    assert.equal(tutorial.isPromptOpen(), false);
});

test('a sighting waits while the prompt is up and fires once the player declines', async () => {
    const { emitted, tutorial, watcher } = setup();
    const answer = tutorial.showTutorialPrompt({ delayMs: 20 });

    // First frame, before the modal has even appeared
    assert.deepEqual(watcher.update(1000, { force: true }), []);
    await new Promise(r => setTimeout(r, 40));
    assert.deepEqual(watcher.update(2000, { force: true }), []);
    assert.equal(emitted.length, 0);

    document.getElementById('tutorial-no').click();
    assert.equal(await answer, false);
    assert.equal(window.gameState.globalVariables.engine_tutorial_declined, true, 'declined state stored as before');

    assert.deepEqual(watcher.update(3000, { force: true }), ['gate_guard']);
    assert.equal(emitted.length, 1);
    assert.equal(emitted[0].name, 'player_spotted:gate_guard');
});

test('accepting the tutorial also releases the challenge', async () => {
    const { emitted, tutorial, watcher } = setup();
    const answer = tutorial.showTutorialPrompt();
    assert.deepEqual(watcher.update(1000, { force: true }), []);
    document.getElementById('tutorial-yes').click();
    await answer;
    assert.deepEqual(watcher.update(2000, { force: true }), ['gate_guard']);
    assert.equal(emitted.length, 1);
});

test('conditions that stop holding while the prompt is open are respected after it closes', async () => {
    const { emitted, tutorial, watcher } = setup();
    window.npcManager.npcs.get('gate_guard').los.challengeOnSight = { skipIfGlobal: 'badge_shown' };
    const answer = tutorial.showTutorialPrompt();
    watcher.update(1000, { force: true });
    window.gameState.globalVariables.badge_shown = true;
    document.getElementById('tutorial-no').click();
    await answer;
    assert.deepEqual(watcher.update(2000, { force: true }), []);
    assert.equal(emitted.length, 0);
});

test('no tutorial manager on the page (or no prompt): the watcher behaves as before', () => {
    const { emitted, watcher } = setup();
    delete window.getTutorialManager;
    assert.deepEqual(watcher.update(1000, { force: true }), ['gate_guard']);
    assert.equal(emitted.length, 1);

    const s2 = setup();   // a manager that never prompted (tutorial already done)
    assert.deepEqual(s2.watcher.update(1000, { force: true }), ['gate_guard']);
});
