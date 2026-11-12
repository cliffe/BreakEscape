// Code review R4 m3 and m4. The objectives panel puts aim and task ids into data
// attributes (escaped, quotes included) and finds them again with a selector that a
// quote cannot break. The inline phone fallback in npc-barks shows the NPC name and an
// ink error message as text. The real modules run against jsdom.
// Run with: bin/test-js test/js/panel-barks-author-text.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
// SWEEP_JS_ROOT points at a copy of the engine (used to show the tests fail on old code)
const js = process.env.SWEEP_JS_ROOT || join(here, '../../public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
window.gameState = { globalVariables: {} };
// tts-manager.js (imported by npc-barks.js) builds an audio context at import time
// (any method or property gives back another inert stub)
const inert = () => new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : inert()), apply: () => inert(), set: () => true });
globalThis.AudioContext = window.AudioContext = function AudioContext() { return inert(); };
const imp = (rel) => import(pathToFileURL(join(js, rel)).href);

const { ObjectivesPanel } = await imp('ui/objectives-panel.js');
const NPCBarkSystem = (await imp('systems/npc-barks.js')).default;

// Breaks out of a double-quoted attribute, and out of a quoted selector
const ID = 'x" onmouseover="window.__pwned=1" data-y="';
const tick = () => new Promise((r) => setTimeout(r, 0));

function panelFor(aims) {
    document.body.innerHTML = '';
    window.__pwned = undefined;
    const manager = { addListener() {}, getActiveAims: () => aims };
    return new ObjectivesPanel(manager);
}

test('objectives panel: a hostile aim or task id stays inside its attribute', () => {
    const aims = [{ aimId: ID, title: 'Aim', status: 'active', tasks: [{ taskId: ID, title: 'Task', status: 'active' }] }];
    panelFor(aims);
    assert.equal(document.querySelector('[onmouseover]'), null, 'no handler attribute');
    assert.equal(document.querySelector('[data-y]'), null, 'no extra attribute');
    assert.equal(document.querySelector('.objective-aim').dataset.aimId, ID, 'the id reads back as typed');
    assert.equal(document.querySelector('.objective-task').dataset.taskId, ID);
});

test('objectives panel: a hostile id is found again for the highlight, without a selector error', () => {
    const aims = [{ aimId: ID, title: 'Aim', status: 'active', tasks: [{ taskId: ID, title: 'Task', status: 'active' }] }];
    const panel = panelFor(aims);
    assert.doesNotThrow(() => panel.highlightTask(ID));
    assert.doesNotThrow(() => panel.highlightAim(ID));
    assert.ok(document.querySelector('.objective-task').className.length > 0);
});

test('objectives panel: an id with dashes is kept exactly (no dash display on ids)', () => {
    panelFor([{ aimId: 'a--b', title: 'Aim', status: 'active', tasks: [{ taskId: 't--1', title: 'T', status: 'active' }] }]);
    assert.equal(document.querySelector('.objective-aim').dataset.aimId, 'a--b');
    assert.equal(document.querySelector('.objective-task').dataset.taskId, 't--1');
});

test('npc-barks inline phone: the NPC name and an ink error are text', async () => {
    document.body.innerHTML = '';
    window.__pwned = undefined;
    const NAME = 'Rae <img src=x onerror="window.__pwned=2">';
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => { throw new Error('bad ink near <img src=x onerror="window.__pwned=3">'); };
    window.InkEngine = class {};
    try {
        const sys = Object.create(NPCBarkSystem.prototype);
        sys.createInlinePhoneUI({ npcId: 'rae', npcName: NAME, inkStoryPath: '/x.json' });
        await tick();
        await tick();
    } finally {
        globalThis.fetch = realFetch;
        delete window.InkEngine;
    }
    assert.equal(document.querySelector('img'), null, 'no injected element');
    assert.ok(document.body.textContent.includes(NAME), 'the name reads back as typed');
    const err = document.getElementById('phone-messages');
    assert.match(err.textContent, /^Error loading story: bad ink near <img/);
});
