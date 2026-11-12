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
