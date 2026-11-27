// m10 blind part 3: a pending or lost end-of-mission question must never swallow the ending
// choice for good. A click while the question is up points the player back at it (nudge); a
// question whose overlay left the page without an answer counts as "Keep going", and the next
// click asks again. The test bridge reports the question over a chat and refuses to press a
// choice into it, so a scripted run sees why nothing moved.
// Run with: node test/js/ending-check-stale-guard.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.PointerEvent = dom.window.PointerEvent || dom.window.MouseEvent;
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
window.requestAnimationFrame = globalThis.requestAnimationFrame;
['log', 'info', 'warn', 'debug'].forEach((k) => { console[k] = () => {}; });
window.gameState = { globalVariables: {} };

// ending-check.js and the bridge's minigames.js in a temp dir with their imports (copy list:
// keep in step with their import lines; state.js and log.js are stubs)
const dir = mkdtempSync(join(tmpdir(), 'ending-check-stale-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['systems/ending-check.js', 'utils/display-dashes.js', 'systems/test-bridge/minigames.js',
    'systems/test-bridge/input.js', 'utils/overlay-open.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}
writeFileSync(join(dir, 'systems/test-bridge/state.js'), 'export const activeMinigameSummary = () => null;\n');
writeFileSync(join(dir, 'systems/test-bridge/log.js'), 'export const logAction = () => {};\n');
const E = await import(pathToFileURL(join(dir, 'systems/ending-check.js')).href);
const H = await import(pathToFileURL(join(js, 'minigames/helpers/chat-helpers.js')).href);
const { minigameBridge } = await import(pathToFileURL(join(dir, 'systems/test-bridge/minigames.js')).href);

function manager(ids) {
    return { aims: [{ status: 'active', tasks: ids.map((id) => ({ taskId: id, title: id, optional: true, status: 'active' })) }] };
}
const clickButton = (id) => document.getElementById(id).dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const tick = () => new Promise((r) => setTimeout(r, 0));
const fresh = () => { E._resetEndingCheck(); window.gameState = { globalVariables: {} }; window.objectivesManager = manager(['opt_a']); };
const overlay = () => document.getElementById(E.ENDING_CHECK_ID);

// The real person chat gate, lifted from its source
const pc = readFileSync(join(js, 'minigames/person-chat/person-chat-minigame.js'), 'utf8');
const m = pc.match(/\n    _askEndingBeforeChoice\(choiceIndex\) \{\n([\s\S]*?)\n    \}\n/);
assert.ok(m, 'person chat _askEndingBeforeChoice found');
const askEnding = new Function('choiceAsksEnding', 'confirmEndingBeforeChoice', 'window',
    `return function (choiceIndex) {\n${m[1]}\n};`)(H.choiceAsksEnding, H.confirmEndingBeforeChoice, window);
function personChat() {
    const taken = [];
    const chat = { taken, conversation: {}, lastResult: { choices: [{ text: 'Fire.', tags: ['ending_check'] }, { text: 'Hold fire.', tags: ['ending_check'] }] }, _askEndingBeforeChoice: askEnding };
    chat.handleChoice = function (i, { endingAnswered = false } = {}) {
        if (!endingAnswered && this._askEndingBeforeChoice(i)) return;
        taken.push(i);
    };
    return chat;
}

test('a question whose overlay left the page without an answer counts as Keep going, and the next ask shows it again', async () => {
    fresh();
    const p = E.confirmEnding({ reason: 'choice' });
    await tick();
    assert.ok(overlay());
    overlay().remove();                      // some other code took it off the page
    assert.equal(E.endingIsAsking(), false, 'no longer asking');
    assert.equal(await p, false, 'the stale promise resolves as Keep going');
    assert.equal(E.endingNeedsAnswer(), true, 'the objectives are still open, so it still needs an answer');
    const again = E.confirmEnding({ reason: 'choice' });
    await tick();
    assert.ok(overlay(), 'asked again, on screen');
    clickButton('ending-check-end');
    assert.equal(await again, true);
});

test('person chat: a click while the question is up nudges it and takes nothing; End the mission now takes the choice', async () => {
    fresh();
    const chat = personChat();
    chat.handleChoice(1);
    await tick();
    assert.ok(overlay());
    chat.handleChoice(1);                    // clicked again under the question
    chat.handleChoice(0);
    assert.deepEqual(chat.taken, []);
    assert.ok(overlay().querySelector('.ending-check-dialog').classList.contains('ending-check-nudge'), 'nudged');
    clickButton('ending-check-end');
    await tick(); await tick();
    assert.deepEqual(chat.taken, [1], 'the first choice clicked is the one taken');
});

test('person chat: a lost question does not swallow the choice; the next click asks again', async () => {
    fresh();
    const chat = personChat();
    chat.handleChoice(1);
    await tick();
    overlay().remove();
    await tick(); await tick();
    chat.handleChoice(1);
    await tick();
    assert.ok(overlay(), 'asked again');
    clickButton('ending-check-end');
    await tick(); await tick();
    assert.deepEqual(chat.taken, [1]);
});

test('person chat: a stale asking flag with no question up is dropped, and the click asks', async () => {
    fresh();
    const chat = personChat();
    chat._endingAsking = true;               // left over, as if a promise never came back
    chat.handleChoice(0);
    await tick();
    assert.ok(overlay(), 'the question is asked');
    clickButton('ending-check-end');
    await tick(); await tick();
    assert.deepEqual(chat.taken, [0]);
});

test('phone chat: a stale asking flag is dropped; a click under an open question nudges it', async () => {
    const src = readFileSync(join(js, 'minigames/phone-chat/phone-chat-minigame.js'), 'utf8');
    const pm = src.match(/\n    async _askEndingBeforeChoice\(choiceIndex\) \{\n([\s\S]*?)\n    \}\n/);
    assert.ok(pm);
    const gate = new Function('choiceAsksEnding', 'confirmEndingBeforeChoice', 'window',
        `return async function (choiceIndex) {\n${pm[1]}\n};`)(H.choiceAsksEnding, H.confirmEndingBeforeChoice, window);
    fresh();
    const phone = { isConversationActive: true, _endingAsking: true, conversation: { engine: { story: { currentChoices: [{ tags: ['ending_check'] }] } } } };
    const p = gate.call(phone, 0);
    await tick();
    assert.ok(overlay(), 'the stale flag did not stop the question');
    assert.equal(await gate.call(phone, 0), false, 'a second click under it takes nothing');
    assert.ok(overlay().querySelector('.ending-check-dialog').classList.contains('ending-check-nudge'));
    clickButton('ending-check-end');
    assert.equal(await p, true);
});

test('confirmEndingBeforeChoice under another trigger\'s question nudges it', async () => {
    fresh();
    const credits = E.confirmEnding({ reason: 'credits' });
    await tick();
    assert.equal(await H.confirmEndingBeforeChoice(['ending_check']), false);
    assert.ok(overlay().querySelector('.ending-check-dialog').classList.contains('ending-check-nudge'));
    clickButton('ending-check-keep');
    assert.equal(await credits, false);
});

test('bridge: choose refuses to press a choice under the question and says how to answer it', async () => {
    fresh();
    const p = E.confirmEnding({ reason: 'choice' });
    await tick();
    const r = await minigameBridge._pick(1, [{}, {}]);
    assert.equal(r.ok, false);
    assert.match(r.reason || r.error || JSON.stringify(r), /ending-check-overlay-up/);
    assert.match(r.hint, /End the mission now/);
    clickButton('ending-check-keep');
    await p;
});

test('bridge: getState reports the question as blockingUi with a chat open', () => {
    const st = readFileSync(join(js, 'systems/test-bridge/state.js'), 'utf8');
    assert.match(st, /blockingUi: \(mg && !sessionOverlayShowing\(\)\) \? endingCheckOverlayUi\(\) : detectBlockingUi\(\)/);
    assert.match(st, /const endingOverlay = endingCheckOverlayUi\(\);\n\s+if \(endingOverlay\) return endingOverlay;/);
});
