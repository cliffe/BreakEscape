// The end-of-mission check asked before a choice is taken (PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md
// 8a), every "End the mission now" and the tag #ending_confirmed saved as __ending_confirmed (8b,
// review R2 n13), and the lint rule for #ending_check after a choice's bracket (8c).
// Run with: node test/js/ending-check-before-choice.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
['log', 'info', 'warn', 'debug'].forEach((k) => { console[k] = () => {}; });
window.gameState = { globalVariables: {} };
globalThis.inkjs = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));

// ending-check.js in a temp dir with its one import, so it registers window.endingCheck
const dir = mkdtempSync(join(tmpdir(), 'ending-check-choice-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['systems/ending-check.js', 'utils/display-dashes.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}
const E = await import(pathToFileURL(join(dir, 'systems/ending-check.js')).href);
const H = await import(pathToFileURL(join(js, 'minigames/helpers/chat-helpers.js')).href);
const { default: InkEngine } = await import(pathToFileURL(join(js, 'systems/ink/ink-engine.js')).href);
const { structureFindings } = await import(pathToFileURL(join(root, 'scripts/ink_runtime_check/dialoguelint.mjs')).href);

/** An objectives manager with optional tasks `ids` open in one active aim. */
function manager(ids) {
    return { aims: [{ status: 'active', tasks: ids.map((id) => ({ taskId: id, title: id, optional: true, status: 'active' })) }] };
}
const clickButton = (id) => document.getElementById(id).dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const tick = () => new Promise((r) => setTimeout(r, 0));
const fresh = () => { E._resetEndingCheck(); window.gameState = { globalVariables: {} }; };

// ---- the vendored runtime and InkEngine carry a choice's own tags ----

test('a tag inside the brackets is on the choice, not in its text, and InkEngine passes it on', () => {
    const eng = new InkEngine('t');
    eng.loadStory(readFileSync(join(here, 'fixtures/ending_check_choice.json'), 'utf8'));
    let r = eng.continue();
    while (r.canContinue) r = eng.continue();
    assert.equal(r.choices.length, 2);
    assert.equal(r.choices[0].text, 'Walk me through it.');
    assert.deepEqual(r.choices[0].tags, ['ending_check']);
    assert.deepEqual(r.choices[1].tags, []);
    assert.deepEqual(eng.currentChoices[0].tags, ['ending_check']);
    // Taken, the tag does not run again on the reply
    eng.choose(0);
    const after = eng.continue();
    assert.ok(!after.tags.includes('ending_check'));
    assert.match(after.text, /front door/);
});

// ---- the shared helper ----

test('choiceAsksEnding reads the choice tags', () => {
    assert.equal(H.choiceAsksEnding(['ending_check']), true);
    assert.equal(H.choiceAsksEnding([' Ending_Check ']), true);
    assert.equal(H.choiceAsksEnding(['set_global:x:true']), false);
    assert.equal(H.choiceAsksEnding(undefined), false);
});

test('confirmEndingBeforeChoice: no tag, nothing open or no module: true at once, nothing asked', async () => {
    let asked = 0;
    const checker = { needsAnswer: () => true, confirm: async () => { asked++; return false; } };
    assert.equal(await H.confirmEndingBeforeChoice([], checker), true);
    assert.equal(await H.confirmEndingBeforeChoice(['ending_check'], { ...checker, needsAnswer: () => false }), true);
    assert.equal(await H.confirmEndingBeforeChoice(['ending_check'], null), true);
    assert.equal(asked, 0);
    assert.equal(await H.confirmEndingBeforeChoice(['ending_check'], checker), false);
    assert.equal(asked, 1);
});

test('the real popup: Keep going resolves false, End the mission now true and saves the ids', async () => {
    fresh();
    window.objectivesManager = manager(['opt_a', 'opt_b']);
    let p = H.confirmEndingBeforeChoice(['ending_check']);
    await tick();
    assert.ok(document.getElementById(E.ENDING_CHECK_ID), 'the popup is up');
    clickButton('ending-check-keep');
    assert.equal(await p, false);
    assert.equal(window.gameState.globalVariables.__ending_confirmed, undefined, 'Keep going saves nothing');
    p = H.confirmEndingBeforeChoice(['ending_check']);
    await tick();
    clickButton('ending-check-end');
    assert.equal(await p, true);
    assert.deepEqual(window.gameState.globalVariables.__ending_confirmed, ['opt_a', 'opt_b']);
    // A second ask does not show the popup
    assert.equal(window.endingCheck.needsAnswer(), false);
});

// ---- person chat: the choice is not taken on Keep going ----

const pc = readFileSync(join(js, 'minigames/person-chat/person-chat-minigame.js'), 'utf8');
const m = pc.match(/\n    _askEndingBeforeChoice\(choiceIndex\) \{\n([\s\S]*?)\n    \}\n/);
assert.ok(m, 'person chat _askEndingBeforeChoice found');
const askEnding = new Function('choiceAsksEnding', 'confirmEndingBeforeChoice', 'window',
    `return function (choiceIndex) {\n${m[1]}\n};`)(H.choiceAsksEnding, H.confirmEndingBeforeChoice, window);

/** A person chat whose handleChoice runs the real gate and records the choices taken. */
function personChat(choices) {
    const taken = [];
    const chat = { taken, conversation: {}, lastResult: { choices }, _askEndingBeforeChoice: askEnding };
    chat.handleChoice = function (i, { endingAnswered = false } = {}) {
        if (!endingAnswered && this._askEndingBeforeChoice(i)) return;
        taken.push(i);
    };
    return chat;
}
const tagged = [{ text: 'Walk me through it.', tags: ['ending_check'] }, { text: 'Not yet.', tags: [] }];

test('person chat: Keep going takes nothing; End the mission now takes the choice; nothing open asks nothing', async () => {
    fresh();
    window.objectivesManager = manager(['opt_a']);
    const chat = personChat(tagged);
    chat.handleChoice(0);
    await tick();
    chat.handleChoice(1);                 // a second click while the question is up
    assert.deepEqual(chat.taken, []);
    clickButton('ending-check-keep');
    await tick(); await tick();
    assert.deepEqual(chat.taken, [], 'Keep going: the story is not moved');
    chat.handleChoice(0);
    await tick();
    clickButton('ending-check-end');
    await tick(); await tick();
    assert.deepEqual(chat.taken, [0]);
    // Nothing optional open: taken at once, with no popup
    fresh();
    window.objectivesManager = manager([]);
    const c2 = personChat(tagged);
    c2.handleChoice(0);
    assert.deepEqual(c2.taken, [0]);
    assert.equal(document.getElementById(E.ENDING_CHECK_ID), null);
    // An untagged choice never asks
    fresh();
    window.objectivesManager = manager(['opt_a']);
    const c3 = personChat(tagged);
    c3.handleChoice(1);
    assert.deepEqual(c3.taken, [1]);
});

test('phone chat: asks before showing the player line or calling makeChoice', async () => {
    const src = readFileSync(join(js, 'minigames/phone-chat/phone-chat-minigame.js'), 'utf8');
    assert.match(pc, /if \(!endingAnswered && this\._askEndingBeforeChoice\?\.\(choiceIndex\)\) return;/);
    const body = src.slice(src.indexOf('    async handleChoice(choiceIndex) {'));
    const ask = body.indexOf('await this._askEndingBeforeChoice(choiceIndex)');
    assert.ok(ask > 0);
    assert.ok(ask < body.indexOf("this.ui.addMessage('player', choiceText)"));
    assert.ok(ask < body.indexOf('conversation.makeChoice(choiceIndex)'));
    // The phone's gate on the real popup
    const pm = src.match(/\n    async _askEndingBeforeChoice\(choiceIndex\) \{\n([\s\S]*?)\n    \}\n/);
    assert.ok(pm);
    const gate = new Function('choiceAsksEnding', 'confirmEndingBeforeChoice',
        `return async function (choiceIndex) {\n${pm[1]}\n};`)(H.choiceAsksEnding, H.confirmEndingBeforeChoice);
    fresh();
    window.objectivesManager = manager(['opt_a']);
    const phone = { isConversationActive: true, conversation: { engine: { story: { currentChoices: [{ tags: ['ending_check'] }, { tags: [] }] } } } };
    assert.equal(await gate.call(phone, 1), true, 'untagged: taken');
    let p = gate.call(phone, 0);
    await tick();
    clickButton('ending-check-keep');
    assert.equal(await p, false, 'Keep going: not taken');
    p = gate.call(phone, 0);
    await tick();
    clickButton('ending-check-end');
    assert.equal(await p, true, 'End the mission now: taken');
});

// ---- saved across a reload ----

test('End the mission now (any trigger) is saved: after a simulated reload the credits do not ask again', async () => {
    fresh();
    window.objectivesManager = manager(['opt_a']);
    const p = E.confirmEnding({ reason: 'credits' });
    await tick();
    clickButton('ending-check-end');
    assert.equal(await p, true);
    const saved = JSON.parse(JSON.stringify(window.gameState.globalVariables));
    assert.deepEqual(saved.__ending_confirmed, ['opt_a']);
    // Reload: the module's memory is gone, the saved globals come back
    E._resetEndingCheck();
    window.gameState = { globalVariables: saved };
    assert.equal(E.endingNeedsAnswer({ manager: manager(['opt_a']) }), false);
    assert.equal(await E.confirmEnding({ reason: 'credits' }, { manager: manager(['opt_a']) }), true);
    assert.equal(document.getElementById(E.ENDING_CHECK_ID), null);
    // An objective that opens later is still asked about
    assert.equal(E.endingNeedsAnswer({ manager: manager(['opt_a', 'opt_late']) }), true);
});

test('#ending_confirmed records the open objectives, survives a reload, and not one that opens later', async () => {
    fresh();
    window.objectivesManager = manager(['opt_a', 'opt_b']);
    window.NPCGameBridge = {};
    const results = await H.processGameActionTags(['ending_confirmed'], { showNotification() {} });
    assert.equal(results[0].success, true);
    assert.deepEqual(window.gameState.globalVariables.__ending_confirmed, ['opt_a', 'opt_b']);
    assert.equal(window.endingCheck.needsAnswer(), false, 'the credits and aim triggers would not ask');
    const saved = JSON.parse(JSON.stringify(window.gameState.globalVariables));
    E._resetEndingCheck();
    window.gameState = { globalVariables: saved };
    assert.equal(E.endingNeedsAnswer({ manager: manager(['opt_a', 'opt_b']) }), false);
    assert.equal(E.endingNeedsAnswer({ manager: manager(['opt_a', 'opt_b', 'opt_c']) }), true);
});

// ---- the lint rule ----

test('dialoguelint: #ending_check after the bracket with a divert on is reported; the other placements are not', () => {
    const rule = (src) => structureFindings(src).filter((f) => f.rule === 'ending-check-after-bracket');
    const bad = '=== hub ===\n+ [Walk me through it.] #ending_check\n    -> debrief\n=== debrief ===\nRuth: Go on.\n-> END\n';
    const found = rule(bad);
    assert.equal(found.length, 1);
    assert.equal(found[0].line, 2);
    assert.match(found[0].note, /Keep going cannot stop this debrief; put the tag inside the choice's brackets\./);
    // Inside the brackets: fine
    assert.equal(rule('=== hub ===\n+ [Walk me through it. #ending_check]\n    -> debrief\n=== debrief ===\nRuth: Go on.\n-> END\n').length, 0);
    // Followed by a tag that Keep going skips (the m01 and tesseract pattern): fine
    assert.equal(rule('=== hub ===\n+ [Debrief me.] #ending_check #set_global:start_debrief:true\n    -> debrief\n=== debrief ===\nOk.\n-> END\n').length, 0);
    assert.equal(rule('=== hub ===\n+ [Debrief me.] #ending_check\n    #set_global:start_debrief:true\n    -> debrief\n=== debrief ===\nOk.\n-> END\n').length, 0);
    // Nothing after it: fine
    assert.equal(rule('=== hub ===\n+ [Done.] #ending_check\n    -> END\n').length, 0);
});
