// D77: scenario flag "npcThoughts": false hides every NPC action icon and thought bubble.
// Run with: bin/test-js test/js/npc-thoughts-flag.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { npcThoughtsOn, NpcActionIcons } from '../../public/break_escape/js/systems/npc-action-icons.js';

// A chainable stand-in for a Phaser game object: every setter returns itself, setVisible is recorded.
function makeObj(scene) {
    let proxy;
    const o = { visible: false, scene, width: 16, height: 16, data: {} };
    proxy = new Proxy(o, {
        get(t, k) {
            if (k in t) return t[k];
            if (typeof k === 'symbol') return undefined;
            if (k === 'setVisible') return (v) => { t.visible = v; return proxy; };
            if (k === 'setData') return (a, b) => { t.data[a] = b; return proxy; };
            return () => proxy;
        },
        set(t, k, v) { t[k] = v; return true; }
    });
    return proxy;
}
function makeScene() {
    const scene = { made: [], textures: { exists: () => true }, load: { image() {}, once() {}, start() {}, isLoading: () => false }, events: { on() {} } };
    const mk = () => { const o = makeObj(scene); scene.made.push(o); return o; };
    scene.add = { rectangle: mk, text: mk, image: mk, container: mk, graphics: mk, sprite: mk };
    return scene;
}

function setup(scenario, states) {
    const scene = makeScene();
    const sprite = { active: true, visible: true, destroyed: false, scene, x: 100, y: 100, width: 80, height: 80, displayHeight: 80, displayWidth: 80, originX: 0.5, originY: 1, texture: { key: '__MISSING' } };
    globalThis.window = {
        gameScenario: scenario, currentPlayerRoom: 'office', npcWorldBubbles: null,
        npcNeedsSystem: { states: new Map(Object.keys(states).map(k => [k, 1])), getState: (id) => states[id] },
        npcBehaviorManager: { getBehavior: () => ({ sprite, roomId: 'office' }) },
        rooms: {}
    };
    return { scene, icons: new NpcActionIcons() };
}
const visibleBoxes = (icons) => [...icons.icons.values(), ...icons.bubbles.values()].filter(x => x.box.visible).length;

const jobState = { job: { kind: 'use', need: 'caffeine', targetId: 'coffee_station', phase: 'goto_target' }, pressing: null, parked: [], avoiding: null };
const needState = { job: null, pressing: { need: 'thirst', ratio: 0.3 }, parked: [], avoiding: null };
const avoidState = { job: null, pressing: null, parked: [], avoiding: 'bob' };
const parkedState = { job: null, pressing: null, parked: [{ need: 'hunger', reason: 'no_source' }], avoiding: null };
const noticedState = { job: null, noticed: true, pressing: null, parked: [], avoiding: null };
const phoneState = { call: true, job: null, pressing: null, parked: [], avoiding: null };

test('npcThoughtsOn: on unless the scenario says false', () => {
    assert.equal(npcThoughtsOn({}), true);
    assert.equal(npcThoughtsOn(undefined), true);
    assert.equal(npcThoughtsOn({ npcThoughts: true }), true);
    assert.equal(npcThoughtsOn({ npcThoughts: false }), false);
});

const cases = [
    ['action icon (doing)', jobState, {}],
    ['pressing-need bubble', needState, { showPressingNeeds: true }],
    ['avoid bubble', avoidState, { showPressingNeeds: true }],
    ['parked bubble', parkedState, { showPressingNeeds: true }],
    ['noticed icon', noticedState, { showPressingNeeds: true }],
    ['phone icon', phoneState, {}]
];
for (const [name, st, extra] of cases) {
    test(`${name}: drawn with the flag on (default), hidden with npcThoughts false`, () => {
        const on = setup({ ...extra }, { zainab: st });
        on.icons.update();
        assert.ok(visibleBoxes(on.icons) >= 1, `${name} should draw by default`);
        const off = setup({ ...extra, npcThoughts: false }, { zainab: st });
        off.icons.update();
        assert.equal(off.icons.icons.size + off.icons.bubbles.size, 0, 'nothing is even created');
        assert.equal(visibleBoxes(off.icons), 0);
    });
}

test('flipping the flag off hides what is already showing, and back on shows it again', () => {
    const s = setup({}, { zainab: jobState });
    s.icons.update();
    assert.equal(visibleBoxes(s.icons), 1);
    window.gameScenario.npcThoughts = false;
    s.icons.update();
    assert.equal(visibleBoxes(s.icons), 0);
    window.gameScenario.npcThoughts = true;
    s.icons.update();
    assert.equal(visibleBoxes(s.icons), 1);
});

test('showPressingNeeds true does not override npcThoughts false', () => {
    const s = setup({ showPressingNeeds: true, npcThoughts: false }, { a: needState, b: jobState, c: avoidState });
    s.icons.update();
    assert.equal(visibleBoxes(s.icons), 0);
});
