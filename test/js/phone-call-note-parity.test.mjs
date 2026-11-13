// A1 R1 m2: the note the client sends for each line of a voiced call (InkEngine.continue's tags,
// phoneStepLines, stepDeliveries, deliveryFromTags: the path continueStory takes) equals the note
// the extractor lists. The server half is test/unit/break_escape/tts_phone_note_parity_test.rb;
// both read test/fixtures/files/phone_note_parity/expected.json.
// Run with: node --test test/js/phone-call-note-parity.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const fix = join(here, '../fixtures/files/phone_note_parity');
const dir = mkdtempSync(join(tmpdir(), 'phone-note-parity-'));
const copy = (src, name, f = s => s) => writeFileSync(join(dir, name), f(readFileSync(join(js, src), 'utf8')));
copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
copy('minigames/phone-chat/phone-call-voice.js', 'phone-call-voice.mjs', s => s.replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
copy('systems/tts-delivery.js', 'tts-delivery.mjs');
copy('systems/ink/ink-engine.js', 'ink-engine.mjs');
globalThis.window = { gameState: { globalVariables: {} } };
globalThis.inkjs = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
const imp = n => import(pathToFileURL(join(dir, n)).href);
const { default: InkEngine } = await imp('ink-engine.mjs');
const { phoneStepLines } = await imp('phone-chat-speaker.mjs');
const { stepDeliveries } = await imp('phone-call-voice.mjs');
const { deliveryFromTags } = await imp('tts-delivery.mjs');
const log = console.log;
console.log = () => {};

test('the client sends the note the shared table gives for each line', async () => {
    const expected = JSON.parse(readFileSync(join(fix, 'expected.json'), 'utf8'));
    const engine = new InkEngine('caller');
    await engine.loadStory(JSON.parse(readFileSync(join(fix, 'call.json'), 'utf8').replace(/^﻿/, '')));
    engine.goToKnot('start');
    const sent = {};
    let r;
    do {
        r = engine.continue();
        const lines = phoneStepLines(r.text, r.tags);
        stepDeliveries(lines.length, deliveryFromTags(r.tags)).forEach((note, i) => { sent[lines[i]] = note; });
    } while (r.canContinue);
    console.log = log;
    assert.deepEqual(sent, expected.lines);
});

// R2 m5: the reopen re-run (reopenWithCurrentGlobals, its own copy of the note carry) gives each
// fresh line the note the shared table gives it. The call is played to its "Hang up" choice, then a
// global changes (x: 1 -> 2), so the knot is re-run from the saved state and the conditional line
// and the block drop out; every line it shows still carries its table note, and a note above a
// line (an empty step in between) reaches it.
test('the reopen re-run sends the note the shared table gives for each fresh line', async () => {
    console.log = () => {};
    copy('minigames/phone-chat/phone-chat-conversation.js', 'phone-chat-conversation.mjs',
        s => s.replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
    const { default: PhoneChatConversation } = await imp('phone-chat-conversation.mjs');
    const expected = JSON.parse(readFileSync(join(fix, 'expected.json'), 'utf8'));
    const storyJson = JSON.parse(readFileSync(join(fix, 'call.json'), 'utf8').replace(/^﻿/, ''));
    const syncGlobals = story => {
        for (const [k, v] of Object.entries(window.gameState.globalVariables)) {
            if (story.variablesState.GlobalVariableExistsWithName(k)) story.variablesState[k] = v;
        }
    };
    window.gameState = { globalVariables: { x: 1 } };
    const first = new PhoneChatConversation('caller', { getNPC: () => null }, new InkEngine('caller'));
    await first.loadStory(storyJson);
    syncGlobals(first.engine.story);
    first.goToKnot('start');
    let r;
    do { r = first.continue(); } while (!r.choices?.length && !r.hasEnded);
    assert.ok(r.choices?.length, 'the call is at its choice');
    const saved = first.saveState();

    window.gameState.globalVariables.x = 2;
    const second = new PhoneChatConversation('caller', { getNPC: () => null }, new InkEngine('caller'));
    await second.loadStory(storyJson);
    assert.equal(second.restoreState(saved), true);
    const out = second.reopenWithCurrentGlobals(syncGlobals);
    console.log = log;
    assert.equal(out.renavigated, true);
    const shown = out.messages.map(m => m.trim());
    assert.ok(shown.length >= 4, `fresh lines shown: ${JSON.stringify(shown)}`);
    assert.ok(!shown.includes('Conditional line.') && !shown.includes('Block line one.'), 'x=2 drops them');
    out.messages.forEach((m, i) => {
        const text = m.trim();
        if (!(text in expected.lines)) return; // the glued line is joined differently; not in the walk below
        assert.equal(deliveryFromTags(out.messageTags[i]), expected.lines[text], `note for ${text}`);
    });
    assert.ok(shown.includes('Line with a note above.'));
});
