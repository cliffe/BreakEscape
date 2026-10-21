// The influence bar (SE engine item S4; 00 §8 "How the bar reads it", README AA; packet P1-K).
// Covers: defaults, the scenario default, a per-character override, bar: false and number: false,
// reading gameState rather than an event's value, and both mounts (mail reading pane, board card).
// Real sources run in jsdom. Run with: bundle exec node --test test/js/social-influence-bar.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const board = JSON.parse(readFileSync(join(here, 'fixtures/social/intel-board-social.json'), 'utf8'));

const dir = mkdtempSync(join(tmpdir(), 'social-influence-bar-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['ui/influence-bar.js', 'systems/social-influence.js', 'systems/global-writer.js',
    'systems/npc-events.js', 'minigames/mail-client/mail-reader.js', 'minigames/mail-client/mail-data.js',
    'minigames/intel-board/intel-board-minigame.js', 'minigames/intel-board/board-model.js',
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js', 'systems/phish-rules.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
console.log = () => {};
window.stateSync = { sync() {} };
window.MinigameFramework = { currentMinigame: null, endMinigame() {} };

const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { createInfluenceBar } = await imp('ui/influence-bar.js');
const { default: Dispatcher } = await imp('systems/npc-events.js');
const { MailReader } = await imp('minigames/mail-client/mail-reader.js');
const { IntelBoardMinigame } = await imp('minigames/intel-board/intel-board-minigame.js');

const characters = () => ({
    priya: {
        displayName: 'Priya Nair',
        influence: { global: 'priya_influence', min: -100, max: 100, start: -20 },
        thresholds: [
            { id: 'trusts', at: 40, icon: 'trusts' },
            { id: 'wary', at: -40, icon: 'wary' },
            { id: 'reports', at: -70, icon: 'reports' }
        ]
    },
    pierce: {
        displayName: 'Melanie Pierce',
        influence: { global: 'pierce_influence', min: -40, max: 100, start: 0 },
        thresholds: [{ id: 'wary', at: -30, icon: 'wary' }]
    }
});
function setup(social = {}, globals = {}) {
    const scenario = { globalVariables: { priya_influence: -20, pierce_influence: 0 },
        social: { characters: characters(), ...social } };
    window.gameScenario = scenario;
    window.gameState = { globalVariables: { ...scenario.globalVariables, ...globals } };
    window.eventDispatcher = new Dispatcher();
    document.body.innerHTML = '';
    return scenario;
}
const mount = (opts) => {
    const bar = createInfluenceBar(opts);
    if (bar) document.body.appendChild(bar.el);
    return bar;
};
const numberOf = (bar) => bar.el.querySelector('.ib-infl-number')?.textContent ?? null;

test('defaults: bar and number show, read from gameState, with a marker and a worded line per threshold', () => {
    setup();
    const bar = mount({ characterId: 'priya' });
    assert.ok(bar);
    assert.equal(numberOf(bar), '-20');
    assert.equal(bar.el.querySelectorAll('.ib-infl-mark').length, 3);
    const legend = [...bar.el.querySelectorAll('.ib-infl-legend-item')].map((l) => l.textContent.replace(/\s+/g, ' '));
    assert.deepEqual(legend, ['Trusts at 40: not reached', 'Wary at -40: not reached', 'Reports at -70: not reached']);
    const track = bar.el.querySelector('.ib-infl-track');
    assert.equal(track.getAttribute('role'), 'meter');
    assert.equal(track.getAttribute('aria-valuenow'), '-20');
    assert.equal(bar.getState().percent, 40);
    // the marker sits where the threshold is on the track: (-40 - -100) / 200
    assert.equal(bar.el.querySelector('[data-threshold="wary"].ib-infl-mark').style.left, '30%');
    bar.destroy();
});

test('start value is used when the global is not set; a stranger gets no bar', () => {
    setup({}, {});
    delete window.gameState.globalVariables.priya_influence;
    const bar = mount({ characterId: 'priya' });
    assert.equal(numberOf(bar), '-20');
    assert.equal(createInfluenceBar({ characterId: 'nobody' }), null);
    assert.equal(createInfluenceBar({ characterId: 'ruth' }), null);
    bar.destroy();
});

test('it reads gameState, not the event value: a clamp that arrives after the raw value wins', () => {
    setup();
    const bar = mount({ characterId: 'pierce' });
    // the raw, unclamped value is announced; gameState already holds the clamped one
    window.gameState.globalVariables.pierce_influence = -40;
    window.eventDispatcher.emit('global_variable_changed:pierce_influence', { value: -120 });
    window.eventDispatcher.emit('npc_influence_changed', { character: 'pierce', value: -120, delta: -120, reason: 'urgency' });
    assert.equal(numberOf(bar), '-40');
    assert.equal(bar.getState().value, -40);
    assert.equal(bar.getState().percent, 0);
    assert.equal(bar.el.querySelector('.ib-infl-track').getAttribute('aria-valuenow'), '-40');
    // the change line comes from the event; the value never does
    assert.match(bar.el.querySelector('.ib-infl-change').textContent, /Last change: -120 urgency/);
    assert.equal(bar.getState().thresholds.find((t) => t.id === 'wary').reached, true);
    bar.destroy();
});

test('a change written from ink alone (global event, no influence event) moves the bar; another character does not', () => {
    setup();
    const bar = mount({ characterId: 'priya' });
    window.gameState.globalVariables.priya_influence = -75;
    window.eventDispatcher.emit('global_variable_changed:priya_influence', {});
    assert.equal(numberOf(bar), '-75');
    const reached = bar.getState().thresholds.filter((t) => t.reached).map((t) => t.id);
    assert.deepEqual(reached, ['wary', 'reports']);
    assert.match(bar.el.querySelector('.ib-infl-legend-item.is-reached').textContent, /reached/);
    // another character's event leaves the change line alone
    window.eventDispatcher.emit('npc_influence_changed', { character: 'pierce', delta: 10, reason: 'x' });
    assert.equal(bar.el.querySelector('.ib-infl-change').textContent, '');
    // a silent change (lockout lift) redraws but prints no change line
    window.gameState.globalVariables.priya_influence = -30;
    window.eventDispatcher.emit('npc_influence_changed', { character: 'priya', delta: 45, silent: true, reason: 'lift' });
    assert.equal(numberOf(bar), '-30');
    assert.equal(bar.el.querySelector('.ib-infl-change').textContent, '');
    bar.destroy();
});

test('destroy unsubscribes and removes the bar', () => {
    setup();
    const bar = mount({ characterId: 'priya' });
    const before = window.eventDispatcher.listeners.get('global_variable_changed:priya_influence')?.length;
    assert.equal(before, 1);
    bar.destroy();
    assert.equal(window.eventDispatcher.listeners.get('global_variable_changed:priya_influence')?.length || 0, 0);
    assert.equal(document.querySelector('.influence-bar'), null);
});

test('scenario default: social.influenceDisplay { number: false } drops the number for everyone', () => {
    setup({ influenceDisplay: { number: false } });
    const bar = mount({ characterId: 'priya' });
    assert.ok(bar);
    assert.equal(numberOf(bar), null);
    assert.equal(bar.getState().numberShown, false);
    assert.equal(bar.el.querySelectorAll('.ib-infl-mark').length, 3);        // the bar and marks stay
    assert.equal(bar.el.querySelector('.ib-infl-track').getAttribute('aria-valuenow'), '-20');
    bar.destroy();
});

test('per-character override beats the scenario default, key by key', () => {
    const s = setup({ influenceDisplay: { number: false } });
    s.social.characters.pierce.influence.display = { number: true };
    const pierce = mount({ characterId: 'pierce' });
    const priya = mount({ characterId: 'priya' });
    assert.equal(numberOf(pierce), '0');
    assert.equal(numberOf(priya), null);
    pierce.destroy(); priya.destroy();
});

test('bar: false renders nothing at all, number included', () => {
    const s = setup();
    s.social.characters.priya.influence.display = { bar: false, number: true };
    assert.equal(createInfluenceBar({ characterId: 'priya' }), null);
    assert.equal(document.querySelector('.influence-bar'), null);
    assert.ok(createInfluenceBar({ characterId: 'pierce' }));
});

test('number: false at the character level keeps the bar', () => {
    const s = setup();
    s.social.characters.priya.influence.display = { number: false };
    const bar = mount({ characterId: 'priya' });
    assert.ok(bar);
    assert.equal(numberOf(bar), null);
    bar.destroy();
});

// ----------------------------------------------------------------------------- mounts

const rec = (over = {}) => ({ id: 'm1', folder: 'inbox', from: { name: 'Melanie Pierce', address: 'm.pierce@ledgerwell.example' },
    to: 'guest@ledgerwell.example', subject: 'Re: Quick one', body: 'Hi.', time: '09:30', read: false, ...over });

test('mount 1, mail reading pane: the bar sits under the headers for a social character only', () => {
    setup();
    document.body.innerHTML = '<div id="host"></div>';
    const reader = new MailReader(document.getElementById('host'), {});
    reader.setMessages([rec({ thread: 'pierce:guest' }), rec({ id: 'm2', thread: 'ruth:guest', subject: 'Other' }),
        rec({ id: 'm3', targetId: 'priya', subject: 'By target' })]);
    reader.select('m1');
    let bar = reader.readPane.querySelector('.influence-bar');
    assert.ok(bar, 'bar in the pane');
    assert.equal(bar.dataset.character, 'pierce');
    assert.equal(bar.dataset.mount, 'reading-pane');
    assert.equal(reader.readPane.querySelector('.ib-infl-number').textContent, '0');
    assert.ok(reader.readPane.querySelector('.mail-headers').compareDocumentPosition(bar) & 4, 'after the headers');
    assert.equal(reader.getState().influence.character, 'pierce');

    // it follows gameState while open
    window.gameState.globalVariables.pierce_influence = -35;
    window.eventDispatcher.emit('global_variable_changed:pierce_influence', {});
    assert.equal(reader.readPane.querySelector('.ib-infl-number').textContent, '-35');

    reader.select('m2');
    assert.equal(reader.readPane.querySelector('.influence-bar'), null, 'no bar for a non-social character');
    assert.equal(reader.getState().influence, null);
    assert.equal(window.eventDispatcher.listeners.get('global_variable_changed:pierce_influence')?.length || 0, 0, 'old bar unsubscribed');

    reader.select('m3');
    assert.equal(reader.readPane.querySelector('.influence-bar').dataset.character, 'priya');
    reader.destroy();
    assert.equal(window.eventDispatcher.listeners.get('global_variable_changed:priya_influence')?.length || 0, 0);
});

test('mount 1, a reply arriving while a message is open keeps the bar and its last-change line (F-2)', () => {
    setup();
    document.body.innerHTML = '<div id="host"></div>';
    const reader = new MailReader(document.getElementById('host'), {});
    reader.setMessages([rec({ id: 'sent1', folder: 'sent', thread: 'pierce:guest', to: 'm.pierce@ledgerwell.example' })], 'sent');
    reader.select('sent1');
    const barBefore = reader.influenceBar;
    assert.ok(barBefore, 'bar built');
    // A change lands on the live bar (its last-change line and the live region fire).
    window.gameState.globalVariables.pierce_influence = 10;
    window.eventDispatcher.emit('npc_influence_changed', { character: 'pierce', delta: 10, reason: 'senderTrust' });
    assert.match(reader.readPane.querySelector('.ib-infl-change').textContent, /Last change: \+10 sender trust/);
    const subsAfterChange = window.eventDispatcher.listeners.get('global_variable_changed:pierce_influence')?.length;
    assert.equal(subsAfterChange, 1);

    // The reply is delivered: the pane refreshes (setMessages) with the same message still selected.
    reader.setMessages([
        rec({ id: 'sent1', folder: 'sent', thread: 'pierce:guest', to: 'm.pierce@ledgerwell.example' }),
        rec({ id: 'reply1', folder: 'inbox', thread: 'pierce:guest', subject: 'Re: Quick one' })
    ], 'sent');
    // Same bar instance kept, not rebuilt: subscriptions did not double and the change line survived.
    assert.equal(reader.influenceBar, barBefore, 'bar instance kept across the refresh');
    assert.equal(window.eventDispatcher.listeners.get('global_variable_changed:pierce_influence')?.length, 1);
    assert.ok(reader.readPane.querySelector('.influence-bar'), 'bar re-attached to the pane');
    assert.match(reader.readPane.querySelector('.ib-infl-change').textContent, /Last change: \+10 sender trust/);
    assert.match(reader.getState().influence.change, /Last change: \+10 sender trust/);
    assert.equal(reader.getState().influence.value, 10);

    // Selecting a different character still rebuilds the bar (and resets the change line).
    reader.setMessages([rec({ id: 'other', folder: 'sent', thread: 'priya:guest', to: 'x@y' })], 'sent');
    reader.select('other');
    assert.notEqual(reader.influenceBar, barBefore);
    assert.equal(reader.influenceBar.config.id, 'priya');
    assert.equal(reader.readPane.querySelector('.ib-infl-change').textContent, '');
    assert.equal(window.eventDispatcher.listeners.get('global_variable_changed:pierce_influence')?.length || 0, 0, 'old bar unsubscribed');
    reader.destroy();
});

test('mount 1, reading pane honours bar: false', () => {
    const s = setup();
    s.social.characters.pierce.influence.display = { bar: false };
    document.body.innerHTML = '<div id="host"></div>';
    const reader = new MailReader(document.getElementById('host'), {});
    reader.setMessages([rec({ thread: 'pierce:guest' })]);
    reader.select('m1');
    assert.equal(reader.readPane.querySelector('.influence-bar'), null);
    reader.destroy();
});

test('mount 2, intel board: a target card with a social.characters entry shows the bar; others do not', () => {
    const social = { ...board, characters: { pierce: characters().pierce } };
    setup();
    window.gameScenario = { social };
    window.gameState.globalVariables.pierce_influence = -10;
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new IntelBoardMinigame(container, {});
    scene._sceneType = 'intel-board';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    const pierce = scene.container.querySelector('.ib-person[data-person="pierce"]');
    const hampshire = scene.container.querySelector('.ib-person[data-person="hampshire"]');
    assert.ok(pierce.querySelector('.ib-influence .influence-bar'));
    assert.equal(pierce.querySelector('.influence-bar').dataset.mount, 'board');
    assert.equal(pierce.querySelector('.ib-infl-number').textContent, '-10');
    assert.equal(hampshire.querySelector('.influence-bar'), null);
    assert.equal(scene.getTestState().board.influence[0].character, 'pierce');
    // a rebuild replaces the bar rather than stacking subscriptions
    scene.rebuild();
    assert.equal(window.eventDispatcher.listeners.get('global_variable_changed:pierce_influence')?.length, 1);
    scene.cleanup();
    assert.equal(window.eventDispatcher.listeners.get('global_variable_changed:pierce_influence')?.length || 0, 0);
});

test('mount 2, board honours social.influenceDisplay { bar: false }', () => {
    const social = { ...board, characters: { pierce: characters().pierce }, influenceDisplay: { bar: false } };
    setup();
    window.gameScenario = { social };
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new IntelBoardMinigame(container, {});
    scene._sceneType = 'intel-board';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    assert.equal(scene.container.querySelector('.influence-bar'), null);
    scene.cleanup();
});
