// Reusability options on pretext preparation: overlay wording (prepLabels) and fact labels from
// intelFacts[id].label. Defaults keep today's wording.
// Run with: bundle exec node --test test/js/social-reuse-pretext.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const clone = (o) => JSON.parse(JSON.stringify(o));

const copies = [
    'minigames/pretext-prep/pretext-card.js', 'minigames/pretext-prep/pretext-prep-minigame.js',
    'minigames/phone-chat/phone-app.js',
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'minigames/mail-client/mail-composer.js', 'minigames/person-chat/person-chat-pretext.js',
    'systems/phish-rules.js', 'systems/global-writer.js', 'systems/social-intel.js',
    'systems/social-influence.js', 'utils/display-dashes.js', 'ui/modal-stack.js'
];
const dir = mkdtempSync(join(tmpdir(), 'social-reuse-pretext-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of copies) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true, url: 'http://localhost/' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.KeyboardEvent = dom.window.KeyboardEvent;

const { factLabel, cardFacts, callWords, readinessLines } = await import(pathToFileURL(join(dir, 'minigames/pretext-prep/pretext-card.js')));
const { PretextPrepMinigame } = await import(pathToFileURL(join(dir, 'minigames/pretext-prep/pretext-prep-minigame.js')));

const call = {
    character: 'dev', callId: 'desk_call',
    knows: { start_date: { value: 'monday' } },
    lines: { open: { blanks: { start_date: 'start_date' }, text: 'I start on {start_date}.' } }
};
const social = () => ({
    people: [],
    characters: { dev: { displayName: 'Dev' } },
    intelFacts: { start_date: { text: 'The new starter begins on Monday.', label: 'Start day',
        provides: [{ type: 'startDate', value: 'monday', label: 'Monday', kind: 'generic' }] } },
    pretextNpcs: [clone(call)]
});

window.MinigameFramework = { currentMinigame: null, startMinigame() {}, endMinigame() {} };
window.pauseKeyboardInput = () => {};
let current = null;
function open({ soc, npc = null, globals = {} }) {
    current?.cleanup();
    document.body.innerHTML = '';
    window.gameState = { globalVariables: { ...globals } };
    window.gameScenario = { social: soc };
    window.npcManager = { getNPC: (id) => (npc && npc.id === id ? npc : null) };
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new PretextPrepMinigame(container, { callId: 'desk_call', npcId: npc?.id || null, social: soc });
    scene._sceneType = 'pretext-prep';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    return scene;
}
const phone = { id: 'p', npcType: 'phone', displayName: 'Dev', currentKnot: 'start' };
const person = { id: 'q', npcType: 'person', displayName: 'Dev', currentKnot: 'start' };

test('factLabel: the id formatted, unless the fact gives a label', () => {
    assert.equal(factLabel('start_date'), 'Start date');
    assert.equal(factLabel('start_date', 'Start day'), 'Start day');
    assert.equal(factLabel('start_date', ''), 'Start date');
    assert.equal(cardFacts(call)[0].label, undefined);
    assert.equal(cardFacts(call, social())[0].label, 'Start day');
    assert.deepEqual(readinessLines(cardFacts(call, social()), {}), ['Start day: nothing held yet']);
});

test('the blank button reads the fact label; without a label it reads the formatted id', () => {
    const s = open({ soc: social(), npc: phone });
    assert.match(s.container.querySelector('[data-fact="start_date"]').textContent, /^Start day: nothing held yet$/);
    const plain = social();
    delete plain.intelFacts.start_date.label;
    const t = open({ soc: plain, npc: phone });
    assert.match(t.container.querySelector('[data-fact="start_date"]').textContent, /^Start date: nothing held yet$/);
});

test('default wording is unchanged for phone and in-person calls', () => {
    for (const npc of [phone, person, null]) {
        const s = open({ soc: social(), npc });
        assert.equal(s.container.querySelector('.pretext-title').textContent, 'Prepare the call');
        assert.equal(s.container.querySelector('.pretext-prep').getAttribute('aria-label'), 'Prepare the call');
        assert.equal(s.container.querySelector('.pretext-held-title').textContent, 'On the board');
        assert.equal(s.container.querySelector('.pretext-held-empty').textContent, 'Nothing on the board yet.');
    }
    assert.deepEqual(callWords({}, phone), { title: 'Prepare the call', heldTitle: 'On the board', heldEmpty: 'Nothing on the board yet.' });
});

test('prepLabels: title, in-person title and the held-facts heading are overridable', () => {
    const soc = social();
    soc.pretextNpcs[0].prepLabels = { title: 'Prepare the call', approachTitle: 'Prepare the approach',
        heldTitle: 'Your notes', heldEmpty: 'Nothing in your notes yet.' };
    const p = open({ soc, npc: phone });
    assert.equal(p.container.querySelector('.pretext-title').textContent, 'Prepare the call');
    assert.equal(p.container.querySelector('.pretext-held-title').textContent, 'Your notes');
    assert.equal(p.container.querySelector('.pretext-held-empty').textContent, 'Nothing in your notes yet.');
    const q = open({ soc, npc: person });
    assert.equal(q.container.querySelector('.pretext-title').textContent, 'Prepare the approach');
    assert.equal(q.container.querySelector('.pretext-prep').getAttribute('aria-label'), 'Prepare the approach');
    const soc2 = social();
    soc2.pretextNpcs[0].prepLabels = { title: 'Plan the visit' };
    assert.equal(open({ soc: soc2, npc: person }).container.querySelector('.pretext-title').textContent, 'Plan the visit');
});
