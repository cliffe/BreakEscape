// A1: a voiced call line's #delivery: note reaches TTSManager.play (plan 2.8).
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const read = (p) => readFileSync(join(js, p), 'utf8');

const dir = mkdtempSync(join(tmpdir(), 'phone-delivery-test-'));
writeFileSync(join(dir, 'phone-chat-speaker.mjs'), read('minigames/phone-chat/phone-chat-speaker.js'));
writeFileSync(join(dir, 'phone-call-voice.mjs'), read('minigames/phone-chat/phone-call-voice.js')
    .replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
writeFileSync(join(dir, 'tts-delivery.mjs'), read('systems/tts-delivery.js'));
const { PhoneCallVoice, stepDeliveries } = await import(pathToFileURL(join(dir, 'phone-call-voice.mjs')).href);
const { deliveryFromTags } = await import(pathToFileURL(join(dir, 'tts-delivery.mjs')).href);

class FakeTTS {
    constructor() { this.calls = []; }
    setVoiceFX() {}
    onEnded() {}
    async play(...args) { this.calls.push(args); return null; }
    isPlaying() { return false; }
    stop() {}
}

test('a note reaches TTSManager.play as { delivery }', async () => {
    const tts = new FakeTTS();
    await new PhoneCallVoice(tts).speak('agent_0x99', 'Hello.', null, { delivery: 'quietly' });
    assert.deepEqual(tts.calls, [['agent_0x99', 'Hello.', { delivery: 'quietly' }]]);
});

test('no note: the request is exactly play(speakerId, text)', async () => {
    const tts = new FakeTTS();
    const v = new PhoneCallVoice(tts);
    await v.speak('agent_0x99', 'Hello.');
    await v.speak('agent_0x99', 'Hello.', null, { delivery: null });
    await v.speak('agent_0x99', 'Hello.', null, {});
    assert.deepEqual(tts.calls, [['agent_0x99', 'Hello.', undefined], ['agent_0x99', 'Hello.', undefined], ['agent_0x99', 'Hello.', undefined]]);
    assert.equal(tts.calls[0].length, 3);
});

test('two lines and one tag in a step: the note goes to the last line', () => {
    const note = deliveryFromTags(['delivery: a beat of silence, then firmer']);
    assert.deepEqual(stepDeliveries(2, note), [null, 'a beat of silence, then firmer']);
    assert.deepEqual(stepDeliveries(1, note), ['a beat of silence, then firmer']);
    assert.deepEqual(stepDeliveries(3, null), [null, null, null]);
    assert.deepEqual(stepDeliveries(0, note), []);
});

test('unusable notes count as none, as on the server', () => {
    assert.equal(deliveryFromTags(['delivery: ...']), null);
    assert.equal(deliveryFromTags(['set_global:x:true']), null);
    assert.equal(deliveryFromTags(['delivery: first', 'delivery: last']), 'last');
});

test('wiring: both story paths pass each step note down to the speaker', () => {
    const src = read('minigames/phone-chat/phone-chat-minigame.js');
    assert.equal((src.match(/stepDeliveries\(/g) || []).length, 3, 'continue loop, first result and continue after a choice');
    assert.match(src, /_presentOutput\(accumulatedMessages, accumulatedTags, lastResult, \{ tagsApplied: true, deliveries: accumulatedDeliveries \}\)/);
    assert.match(src, /_showStoryLine\(message, TYPING_DELAY_MS, deliveries\?\.\[i\] \|\| null\)/);
    assert.match(src, /_showStoryLine\(message, TYPING_DELAY_MS, accumulatedDeliveries\[i\] \|\| null\)/);
    assert.match(src, /await this\._callVoice\?\.speak\(voice\.speakerId, voice\.text, [^\n]*\{ delivery \}\)/);
});
