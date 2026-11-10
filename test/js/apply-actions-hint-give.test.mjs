// applyActions (systems/apply-actions.js):
// - give_item names the tray picture by the item's "sprite" first, then its type, as a
//   restored item does (code review R2, E-m3: the line had no test).
// - hint lasts by the length of its text, by the same rule as the refusal hints
//   (utils/locked-hint.js hintToastMs: 300 ms a word, 6 to 12 s). It used to last 5 s
//   whatever its length (lab_physical_pentest playtest N11: a 21 word pointer was gone
//   before it could be read).
// - any action may carry a `condition` on the globals; one that does not hold is skipped, and
//   it is read when the action is reached (lab_physical_pentest T4: one toast per outcome).
//   It is read strictly: a malformed or non-string condition never runs the action.
// Run with: node test/js/apply-actions-hint-give.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = {
    gameState: { globalVariables: {} },
    lockRef: (item) => item?.opens_lock,
    eventDispatcher: { on() {}, off() {}, emit() {} }
};
const { applyActions } = await import(dataUrl(readFileSync(join(js, 'systems/apply-actions.js'), 'utf8')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split("'./global-writer.js'").join(`'${dataUrl('export function writeGlobal() {}')}'`)
    .split("'./social-intel.js'").join(`'${dataUrl('export function grantFact() {} export function readyToastText() { return ""; } export function readyToastTitle() { return ""; }')}'`)));

const quietly = async (fn) => {
    const log = console.log; console.log = () => {};
    try { return await fn(); } finally { console.log = log; }
};
const words = (n) => Array.from({ length: n }, (_, i) => `w${i}`).join(' ');

test('give_item: the stand-in names the sprite picture first, then the type', async () => {
    const given = [];
    window.addToInventory = (sprite) => { given.push(sprite); return Promise.resolve({ ok: true, reason: 'added' }); };
    await quietly(() => applyActions([
        { type: 'give_item', item: { type: 'usb', sprite: 'charging_cable', name: 'Cable' } },
        { type: 'give_item', item: { type: 'pc', name: 'Remote session' } },
        { type: 'give_item', item: { type: 'pc', sprite: '', name: 'Empty sprite name' } }
    ]));
    assert.deepEqual(given.map(s => s.texture.key), ['charging_cable', 'pc', 'pc']);
    assert.equal(given[0].name, 'usb');
    assert.equal(given[0].scenarioData.name, 'Cable');
});

test('an NPC gift builds its stand-in the same way', () => {
    const src = readFileSync(join(js, 'systems/npc-game-bridge.js'), 'utf8');
    assert.match(src, /sourceNpcId: npcId,[^\n]*\n\s*texture: \{ key: \(typeof item\.sprite === 'string' && item\.sprite\) \|\| item\.type \}/);
});

test('hint: lasts by length when the rule is loaded', async () => {
    const { hintToastMs } = await import(dataUrl(readFileSync(join(js, 'utils/locked-hint.js'), 'utf8')));
    assert.equal(window.hintToastMs, hintToastMs, 'locked-hint.js publishes the rule for apply-actions');
    const alerts = [];
    window.gameAlert = (...a) => alerts.push(a);
    const plant = 'Clipped in. Now wait for Chris\'s coffee run: he locks up, and it records his password when he comes back and unlocks.';
    await quietly(() => applyActions([
        { type: 'hint', title: 'Keylogger planted', message: plant },
        { type: 'hint', message: 'Short one.' },
        { type: 'hint', message: words(60) },
        { type: 'hint', message: '' }
    ]));
    assert.equal(alerts.length, 3, 'an empty hint shows nothing');
    assert.deepEqual(alerts[0], [plant, 'info', 'Keylogger planted', 6600]);   // 22 words
    assert.deepEqual(alerts[1], ['Short one.', 'info', 'Intelligence Received', 6000]);
    assert.equal(alerts[2][3], 12000, 'capped');
});

test('hint: without the rule the toast keeps its default duration', async () => {
    const saved = window.hintToastMs;
    delete window.hintToastMs;
    const alerts = [];
    window.gameAlert = (...a) => alerts.push(a);
    await quietly(() => applyActions([{ type: 'hint', title: 'T', message: 'Some text here.' }]));
    assert.deepEqual(alerts, [['Some text here.', 'info', 'T']]);
    window.hintToastMs = saved;
});

test('an action with a condition runs only while it holds, read when the action is reached', async () => {
    const { evaluateActionCondition } = await import(dataUrl(readFileSync(join(js, 'utils/global-condition.js'), 'utf8')));
    assert.equal(window.evaluateActionCondition, evaluateActionCondition, 'global-condition.js publishes the strict evaluator for apply-actions');
    assert.match(readFileSync(join(js, 'main.js'), 'utf8'), /^import '\.\/utils\/global-condition\.js';$/m, 'main.js loads it wherever actions run');
    const alerts = [];
    window.gameAlert = (...a) => alerts.push(a[0]);
    const emitted = [];
    window.eventDispatcher.emit = (n) => {
        emitted.push(n);
        if (n === 'looked') window.gameState.globalVariables.read = true;   // what a mapping would do
    };
    const shelves = [
        { type: 'hint', condition: 'globalVars.read', message: 'already read' },
        { type: 'hint', condition: '!globalVars.read && globalVars.vest', message: 'not in the vest' },
        { type: 'hint', condition: '!globalVars.read && !globalVars.vest && !globalVars.at_door', message: 'nobody at the door' },
        { type: 'emit_event', event_name: 'looked', condition: 'globalVars.at_door && !globalVars.vest' }
    ];
    const click = async (globals) => {
        alerts.length = 0; emitted.length = 0;
        window.gameState.globalVariables = { ...globals };
        await quietly(() => applyActions(shelves));
        return { alerts: [...alerts], emitted: [...emitted] };
    };
    assert.deepEqual(await click({}), { alerts: ['nobody at the door'], emitted: [] });
    assert.deepEqual(await click({ vest: true, at_door: true }), { alerts: ['not in the vest'], emitted: [] });
    // The read itself: no toast from the click (the capture's own toast says it), though the
    // event has set the global by the time the list ends
    assert.deepEqual(await click({ at_door: true }), { alerts: [], emitted: ['looked'] });
    assert.equal(window.gameState.globalVariables.read, true);
    assert.deepEqual(await click({ read: true, at_door: true }), { alerts: ['already read'], emitted: ['looked'] });
    // Order matters: a later action sees what an earlier one changed
    window.gameState.globalVariables = { at_door: true };
    alerts.length = 0;
    await quietly(() => applyActions([...shelves].reverse()));
    assert.deepEqual(alerts, ['already read']);
    // Only an absent key means "always". An empty condition, and a condition with no
    // evaluator loaded, do not hold: the action is skipped
    alerts.length = 0;
    window.gameState.globalVariables = {};
    await quietly(() => applyActions([{ type: 'hint', message: 'a' }, { type: 'hint', condition: '  ', message: 'b' }]));
    delete window.evaluateActionCondition;
    await quietly(() => applyActions([{ type: 'hint', condition: '!globalVars.never', message: 'c' }, { type: 'hint', message: 'd' }]));
    window.evaluateActionCondition = evaluateActionCondition;
    assert.deepEqual(alerts, ['a', 'd']);
    window.eventDispatcher.emit = () => {};
});

test('an action condition is read strictly: a malformed or non-string one never runs the action', async () => {
    const { evaluateActionCondition, parseActionCondition } = await import(dataUrl(readFileSync(join(js, 'utils/global-condition.js'), 'utf8')));
    window.evaluateActionCondition = evaluateActionCondition;
    const alerts = [];
    window.gameAlert = (...a) => alerts.push(a[0]);
    const shown = async (condition, globals) => {
        alerts.length = 0;
        window.gameState.globalVariables = { ...globals };
        await quietly(() => applyActions([{ type: 'hint', condition, message: 'x' }]));
        return alerts.length === 1;
    };
    // Not a string: never, whatever its truthiness
    for (const bad of [false, true, null, 0, 1, {}, [], ['globalVars.a']]) {
        assert.equal(await shown(bad, { a: true }), false, `condition ${JSON.stringify(bad)}`);
    }
    // A negation with a space is a negation (the older evaluator read it as always true)
    assert.equal(await shown('! globalVars.x', { x: true }), false);
    assert.equal(await shown('! globalVars.x', {}), true);
    assert.equal(await shown('!!globalVars.x', { x: 1 }), true);
    // || is an or (the older evaluator read the first name only), binding looser than &&
    assert.equal(await shown('globalVars.a || globalVars.b', { b: true }), true);
    assert.equal(await shown('globalVars.a || globalVars.b', {}), false);
    assert.equal(await shown('globalVars.a && globalVars.c || globalVars.b', { a: true }), false);
    assert.equal(await shown('globalVars.a && globalVars.c || globalVars.b', { a: true, c: true }), true);
    // Comparisons with a literal
    assert.equal(await shown('globalVars.n >= 3 && globalVars.s === "on"', { n: 3, s: 'on' }), true);
    assert.equal(await shown("globalVars.n < 3 || globalVars.s !== 'on'", { n: 3, s: 'on' }), false);
    assert.equal(await shown('globalVars.flag !== true', {}), true);
    // Outside the grammar: never, in every state (each of these ran the action, or read
    // something else, under the older evaluator)
    const malformed = ['!globalVars.x === true', 'globalVars.x == true', 'globalVars.x === maybe', 'x', 'vars.x',
        '(globalVars.x)', 'globalVars.x &&', '|| globalVars.x', 'globalVars.x & globalVars.y', 'globalVars.x === true === true',
        'data.x === true', 'globalVars.', 'not globalVars.x', 'globalVars.x.includes("a")'];
    for (const condition of malformed) {
        assert.equal(parseActionCondition(condition), null, condition);
        for (const globals of [{}, { x: true, y: true }, { x: false }]) {
            assert.equal(await shown(condition, globals), false, `${condition} with ${JSON.stringify(globals)}`);
        }
    }
});

// A carried disguise (lab_physical_pentest kit_hivis_vest): two confirm_actions with opposite
// conditions on one item make an on/off toggle. confirm_action does not block the list, so
// both conditions are read at the click and the confirmed action cannot trip the other.
test('two confirms with opposite conditions toggle: one prompt per click, even after it is confirmed', async () => {
    const { evaluateActionCondition } = await import(dataUrl(readFileSync(join(js, 'utils/global-condition.js'), 'utf8')));
    window.evaluateActionCondition = evaluateActionCondition;
    const prompts = [];
    let settle;
    window.gameConfirm = (text) => { prompts.push(text); return new Promise((resolve) => { settle = resolve; }); };
    const hints = [];
    window.gameAlert = (message) => hints.push(message);
    const toggle = [
        { type: 'confirm_action', condition: '!globalVars.worn', text: 'Put it on?',
          onConfirm: [{ type: 'set_global', key: 'worn', value: true }] },
        { type: 'confirm_action', condition: 'globalVars.worn', text: 'Take it off?',
          onConfirm: [{ type: 'set_global', key: 'worn', value: false }] }
    ];
    // This harness stubs global-writer.js, so the test writes the global the confirmed
    // set_global would: what is under test is which prompts the click opens.
    const g = window.gameState.globalVariables;
    const click = async (answer) => {
        prompts.length = 0;
        await quietly(async () => {
            applyActions(toggle);
            const asked = prompts[0];
            if (answer) g.worn = asked === 'Put it on?';
            settle(answer);
            await new Promise(r => setTimeout(r, 0));
        });
        return [...prompts];
    };
    delete g.worn;
    assert.deepEqual(await click(true), ['Put it on?']);
    assert.deepEqual(await click(false), ['Take it off?'], 'a cancel leaves it on');
    assert.deepEqual(await click(true), ['Take it off?']);
    assert.deepEqual(await click(true), ['Put it on?'], 'and round again');
    delete g.worn;
    delete window.gameConfirm; delete window.gameAlert;
});
