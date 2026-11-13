// A3 R2 n4 (for A4): the thread's text comes back from a reload (exportPhoneState through JSON, then
// restorePhoneState) and the next open after a ringer call must still find the home knot's lines in
// it: no second hub line. The home knot prints, and one of its lines is narration ("Narrator:" in
// the ink, stored stripped as type narrator, as m07's dead_air). Real NPCManager, real ringer, real
// ink and PhoneChatConversation.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld, endCall } from './phone-ring-harness.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'reload-home-hub-'));
const copy = (src, name, fix = (s) => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
copy('systems/ink/ink-engine.js', 'ink-engine.mjs');
copy('minigames/phone-chat/phone-chat-conversation.js', 'phone-chat-conversation.mjs',
    (s) => s.replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
globalThis.inkjs = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
const { default: InkEngine } = await import(pathToFileURL(join(dir, 'ink-engine.mjs')).href);
const { default: PhoneChatConversation } = await import(pathToFileURL(join(dir, 'phone-chat-conversation.mjs')).href);
const { classifyPhoneLine } = await import(pathToFileURL(join(dir, 'phone-chat-speaker.mjs')).href);
const json = JSON.parse(readFileSync(join(here, 'fixtures/ring_home_hub.json'), 'utf8').replace(/^﻿/, ''));

const npc = { id: 'caller', displayName: 'Caller One', currentKnot: 'printing_home', homeKnot: 'printing_home' };
const ringConfig = { handlerIndex: 0, knot: 'ring_call', conversationMode: 'phone-chat', ring: true, once: true, cooldown: 0 };

/** The player opens the thread on its home knot: its lines go in as the minigame stores them. */
async function liveThread(w) {
    const conv = new PhoneChatConversation('caller', w.nm, new InkEngine('caller'));
    await conv.loadStory(json);
    conv.goToKnot('printing_home');
    let steps = 0;
    while (conv.engine.story.canContinue && steps++ < 20) {
        const line = conv.engine.story.Continue().trim();
        if (!line) continue;
        const c = classifyPhoneLine('npc', line);
        w.nm.addMessage('caller', c.type, c.text);
    }
}

test('A3 R2 n4: after a reload, a ring, an answer and End, the thread\'s next open shows no second hub line (narration included)', async () => {
    const a = makeWorld({ npcs: [{ ...npc }] });
    let b;
    try {
        await liveThread(a);
        const types = a.nm.getConversationHistory('caller').map((m) => m.type);
        assert.deepEqual(types, ['npc', 'narrator'], 'the live thread stores the narration stripped, as narrator');
        const saved = JSON.parse(JSON.stringify(a.nm.exportPhoneState()));

        b = makeWorld({ npcs: [{ ...npc }] });
        b.nm.restorePhoneState(saved);
        b.dispatcher.emit('game_loaded', {});
        await b.advance(50);
        b.nm._handleEventMapping('caller', 'room_entered', ringConfig, {});
        await b.advance(300);
        b.click('.incoming-call-answer');
        await b.advance(800);
        endCall(b);
        await b.advance(300);

        // the call's own story, then the reset to the home knot, then the read-ahead the next open runs
        const conv = new PhoneChatConversation('caller', b.nm, new InkEngine('caller'));
        await conv.loadStory(json);
        conv.callKnots = new Set(['ring_call', 'return_contact']);
        conv.goToKnot('ring_call');
        conv.continue();
        conv.goToKnot('printing_home');
        assert.equal(conv.engine.story.canContinue, true, 'the bug: the hub line would print again');
        const history = b.nm.getConversationHistory('caller');
        assert.ok(history.some((m) => m.type === 'narrator'), 'the reloaded thread kept the narration');
        assert.equal(conv.settleOnSeenLines(history), true, 'the reloaded text matches the home knot');
        assert.equal(conv.engine.story.canContinue, false, 'nothing is left to print');
        assert.deepEqual(conv.engine.story.currentChoices.map((c) => c.text), ['Anything?']);
    } finally { a.restore(); b?.restore(); }
});
