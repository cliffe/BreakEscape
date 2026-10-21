// Finale F17: voiced phone calls. A phone conversation opened with `voiced: true` speaks
// each NPC line through the server TTS as it appears, the next waits for it (or a click),
// a co-speaker is voiced in their own voice, and player lines and narration are not.
// See docs/agents/FINALE_ENGINE_VOICED_CALLS.md.
// Run with: node --test test/js/finale-voiced-calls.test.mjs
//
// phone-call-voice.js imports only phone-chat-speaker.js (no imports), so both are copied
// to a temp dir. The minigame's _showStoryLine/_speakCallLine are lifted out of the source
// and run against a fake minigame, as the full class pulls in the whole game.

import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const read = (p) => readFileSync(join(js, p), 'utf8');

const dir = mkdtempSync(join(tmpdir(), 'voiced-call-test-'));
writeFileSync(join(dir, 'phone-chat-speaker.mjs'), read('minigames/phone-chat/phone-chat-speaker.js'));
writeFileSync(join(dir, 'phone-call-voice.mjs'), read('minigames/phone-chat/phone-call-voice.js')
    .replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
const speaker = await import(pathToFileURL(join(dir, 'phone-chat-speaker.mjs')).href);
const voice = await import(pathToFileURL(join(dir, 'phone-call-voice.mjs')).href);
const { isVoicedCall, phoneLineVoice, PhoneCallVoice } = voice;

const HAX = { id: 'agent_0x99', displayName: 'Agent HaX', voice: { name: 'Aoede' } };
const DIRECTOR = { id: 'director_netherton', displayName: 'Director Netherton', voice: { name: 'Charon', fx: 'radio' } };
const MUTE = { id: 'clerk', displayName: 'Night Clerk' };
const characters = new Map([[HAX.id, HAX], [DIRECTOR.id, DIRECTOR], [MUTE.id, MUTE]]);
const shown = (raw, contact = HAX) => speaker.displayPhoneLine('npc', raw, contact);

/** A TTSManager stand-in: play() resolves with a duration (or null); end() fires 'ended'. */
class FakeTTS {
    constructor({ duration = 2000, fetchMs = 0 } = {}) {
        this.duration = duration; this.fetchMs = fetchMs;
        this.played = []; this.fx = []; this.stops = 0; this.playing = false; this.destroyed = false;
    }
    onEnded(cb) { this._ended = cb; }
    setVoiceFX(id, fx) { this.fx.push([id, fx]); }
    async play(id, text) {
        this.played.push([id, text]);
        if (this.fetchMs) await new Promise(r => setTimeout(r, this.fetchMs));
        if (!this.duration) return null;
        this.playing = true;
        return this.duration;
    }
    isPlaying() { return this.playing; }
    stop() { this.stops++; this.playing = false; }
    end() { this.playing = false; this._ended?.(); }
    destroy() { this.destroyed = true; this.stop(); }
}
const tick = () => new Promise(r => setTimeout(r, 0));

test('off by default: only voiced === true makes a voiced call', () => {
    assert.equal(isVoicedCall(undefined), false);
    assert.equal(isVoicedCall({}), false);
    assert.equal(isVoicedCall({ voiced: 'yes' }), false);
    assert.equal(isVoicedCall({ disableClose: true, resume: true }), false);
    assert.equal(isVoicedCall({ voiced: true }), true);
});

test('the contact speaks its own lines, prefixed or not, in its own voice', () => {
    assert.deepEqual(phoneLineVoice(shown("Agent HaX: Don't hang up."), HAX, characters),
        { speakerId: 'agent_0x99', text: "Don't hang up." });
    assert.deepEqual(phoneLineVoice(shown('Stay on the line.'), HAX, characters),
        { speakerId: 'agent_0x99', text: 'Stay on the line.' });
    // A leftover two-word prefix is stripped as person-chat strips it; one word stays
    assert.deepEqual(phoneLineVoice(shown('Field Office: Copy.'), HAX, characters),
        { speakerId: 'agent_0x99', text: 'Copy.' });
    assert.deepEqual(phoneLineVoice(shown('Note: two doors.'), HAX, characters),
        { speakerId: 'agent_0x99', text: 'Note: two doors.' });
});

test("a second speaker in the thread is voiced in that character's voice", () => {
    assert.deepEqual(phoneLineVoice(shown("Director Netherton: Put her on when she's done."), HAX, characters),
        { speakerId: 'director_netherton', text: "Put her on when she's done." });
    // No voice for them: read in the contact's voice, prefix dropped (person-chat does the same)
    assert.deepEqual(phoneLineVoice(shown('Night Clerk: Lobby is empty.'), HAX, characters),
        { speakerId: 'agent_0x99', text: 'Lobby is empty.' });
});

test('player lines, narration, empty lines and a voiceless contact are not voiced', () => {
    assert.equal(phoneLineVoice(shown("You: I'm here."), HAX, characters), null);
    assert.equal(phoneLineVoice(shown('Player: Here.'), HAX, characters), null);
    assert.equal(phoneLineVoice(shown('Narrator: The line crackles.'), HAX, characters), null);
    assert.equal(phoneLineVoice({ type: 'player', text: 'Hi' }, HAX, characters), null);
    assert.equal(phoneLineVoice(shown('...'), HAX, characters), null);
    assert.equal(phoneLineVoice(shown('Hello.', MUTE), MUTE, characters), null);
    // ...but a voiced co-speaker in a voiceless contact's thread still is
    assert.deepEqual(phoneLineVoice(shown('Agent HaX: Patch me in.', MUTE), MUTE, characters),
        { speakerId: 'agent_0x99', text: 'Patch me in.' });
});

test('speak() waits for the clip to end, applies the speaker FX, and resolves at once with no clip', async () => {
    const tts = new FakeTTS();
    const v = new PhoneCallVoice(tts);
    let done = null;
    v.speak('director_netherton', 'Put her on.', 'radio').then(r => { done = r; });
    await tick();
    assert.equal(done, null, 'still waiting while the clip plays');
    assert.deepEqual(tts.fx, [['director_netherton', 'radio']]);
    tts.end();
    await tick();
    assert.equal(done, 'played');

    const silent = new PhoneCallVoice(new FakeTTS({ duration: null }));
    assert.equal(await silent.speak('agent_0x99', 'No clip on a keyless server.'), 'silent');
});

test('a click skips the line; stop() releases a wait; a clip fetched after a skip is stopped', async () => {
    const tts = new FakeTTS();
    const v = new PhoneCallVoice(tts);
    const p = v.speak('agent_0x99', 'Long line.');
    await tick();
    v.skip();
    assert.equal(await p, 'skipped');
    assert.equal(tts.playing, false);

    const p2 = v.speak('agent_0x99', 'Another.');
    await tick();
    v.stop();
    assert.equal(await p2, 'skipped');

    const slow = new FakeTTS({ fetchMs: 20 });
    const v3 = new PhoneCallVoice(slow);
    const p3 = v3.speak('agent_0x99', 'Slow fetch.');
    v3.skip();   // clicked before the clip arrived
    assert.equal(await p3, 'skipped');
    assert.equal(slow.playing, false, 'the late clip was stopped');
    v3.destroy();
    assert.equal(slow.destroyed, true);
});

test("a wait ends after the clip's length plus grace if 'ended' never fires", async () => {
    const tts = new FakeTTS({ duration: 5 });
    const v = new PhoneCallVoice(tts, { graceMs: 5 });
    assert.equal(await v.speak('agent_0x99', 'Lost ended event.'), 'played');
});

// ---- The minigame's _showStoryLine / _speakCallLine, run on a fake minigame ----

const mgSrc = read('minigames/phone-chat/phone-chat-minigame.js');
function method(name) {
    const start = mgSrc.indexOf(`    async ${name}(`);
    assert.ok(start >= 0, `${name} not found`);
    const end = mgSrc.indexOf('\n    }\n', start);
    return mgSrc.slice(start, end + 6).trim();
}
const methods = new Function('deps', `
    const { classifyPhoneLine, displayPhoneLine, whenSessionOverlayClosed, isVoicedCall,
            phoneLineVoice, PhoneCallVoice, TTSManager } = deps;
    return { ${method('_showStoryLine')}, ${method('_speakCallLine')} };
`);

function fakeMinigame({ voiced, tts }) {
    const log = [];
    const clicks = [];
    const mg = Object.assign(methods({
        classifyPhoneLine: speaker.classifyPhoneLine,
        displayPhoneLine: speaker.displayPhoneLine,
        whenSessionOverlayClosed: async () => {},
        isVoicedCall, phoneLineVoice, PhoneCallVoice,
        TTSManager: function () { return tts; }
    }), {
        params: voiced ? { voiced: true, disableClose: true } : { disableClose: true },
        isConversationActive: true,
        _typeoutRun: 0,
        _pendingNpcMessages: [],
        currentNPCId: HAX.id,
        npcManager: { getNPC: id => characters.get(id), npcs: characters },
        ui: {
            elements: { messagesContainer: {} },
            showTypingIndicator() {}, hideTypingIndicator() {}, scrollToBottom() {},
            async addMessage(type, text) { log.push(['drawn', type, text]); }
        },
        history: { addMessage(type, text) { log.push(['history', type, text]); } },
        addEventListener(el, ev, fn) { clicks.push(fn); },
        // As _presentOutput / handleChoice: pending list, one line at a time, shift after each
        async present(lines) {
            this._pendingNpcMessages = lines.map(m => m.trim());
            for (const message of lines) {
                if (!(await this._showStoryLine(message, 0))) return false;
                this._pendingNpcMessages.shift();
            }
            this._pendingNpcMessages = [];
            return true;
        },
        // As _flushPendingMessages (closeConversation / cleanup): untyped lines go to the history
        flush() {
            this._typeoutRun++;
            const pending = this._pendingNpcMessages;
            this._pendingNpcMessages = [];
            pending.forEach(text => log.push(['history', 'npc', text]));
        }
    });
    return { mg, log, clicks };
}
const historyTexts = log => log.filter(e => e[0] === 'history').map(e => e[2]);

test('a voiced call: each NPC line plays as it appears and the next waits for it', async () => {
    const tts = new FakeTTS();
    const { mg, log, clicks } = fakeMinigame({ voiced: true, tts });
    const lines = ["Agent HaX: Don't hang up.", "Director Netherton: Put her on when she's done.", "You: I'm here."];
    let done = false;
    const run = mg.present(lines).then(() => { done = true; });
    await tick(); await tick();
    assert.equal(done, false, 'first line still playing');
    assert.deepEqual(tts.played, [['agent_0x99', "Don't hang up."]]);
    assert.equal(log.filter(e => e[0] === 'drawn').length, 1, 'second line not shown yet');
    assert.deepEqual(mg._pendingNpcMessages, lines.slice(1), 'the line playing is off the pending list');
    tts.end();
    await tick(); await tick(); await tick();
    assert.deepEqual(tts.played[1], ['director_netherton', "Put her on when she's done."]);
    assert.deepEqual(tts.fx, [['director_netherton', 'radio']]);
    assert.equal(clicks.length, 1, 'one click-to-skip listener on the thread');
    clicks[0]();   // the player clicks the thread: skip the Director's line
    await run;
    assert.equal(tts.played.length, 2, "the player's line is not voiced");
    assert.deepEqual(log.filter(e => e[0] === 'history').map(e => e[1]), ['npc', 'npc', 'player']);
    assert.deepEqual(mg._pendingNpcMessages, []);
});

test('closing mid-line: the playing line is in the history once and the rest is flushed', async () => {
    const tts = new FakeTTS();
    const { mg, log } = fakeMinigame({ voiced: true, tts });
    const run = mg.present(['Agent HaX: First.', 'Agent HaX: Second.']);
    await tick(); await tick();
    assert.equal(tts.playing, true);
    // closeConversation / cleanup (a hit on a forced call): flush, then stop the voice
    mg.flush();
    mg.isConversationActive = false;
    mg._callVoice.stop();
    assert.equal(await run, false);
    assert.deepEqual(historyTexts(log), ['Agent HaX: First.', 'Agent HaX: Second.']);
});

test('an ordinary phone conversation is not voiced', async () => {
    const tts = new FakeTTS();
    const { mg } = fakeMinigame({ voiced: false, tts });
    assert.equal(await mg._showStoryLine('Agent HaX: Text only.', 0), true);
    assert.equal(tts.played.length, 0);
    assert.equal(mg._callVoice, undefined);
});

test('wiring: lines redrawn on a reopen are not voiced; close stops and teardown destroys the voice', () => {
    // Only _showStoryLine voices; the history redraw (addMessages) does not go through it
    assert.match(mgSrc, /this\.history\.addMessage\(line\.type, line\.text, \{ read: true \}\);\n[\s\S]{0,200}if \(line\.type === 'npc' && isVoicedCall\(this\.params\)\) await this\._speakCallLine\(line, raw\);\n\s+return true;/);
    assert.match(mgSrc, /closeConversation\(\) \{[\s\S]{0,120}this\._flushPendingMessages\(\);\n\s+this\._callVoice\?\.stop\(\);/);
    assert.match(mgSrc, /cleanup\(\) \{[\s\S]{0,400}this\._callVoice\?\.destroy\(\);\n\s+this\._callVoice = null;/);
    assert.equal((mgSrc.match(/_speakCallLine\(/g) || []).length, 2, 'one definition, one call');
    // Same request as person-chat: TTSManager.play → ApiClient.getTTS(npc_id, text) → POST /tts
    assert.match(read('systems/tts-manager.js'), /blob = await ApiClient\.getTTS\(npcId, text\);/);
});

// npc-manager.js carries `voiced` from an eventMapping or timedConversation to the phone.
// NPC_MANAGER_SRC can point at a patched copy; the test is skipped until the live file has it.
const nmPath = process.env.NPC_MANAGER_SRC || join(js, 'systems/npc-manager.js');
const nmSrc = existsSync(nmPath) ? readFileSync(nmPath, 'utf8') : '';
const plumbed = /voiced:\s+mapping\.voiced === true/.test(nmSrc);
function makeDispatcher() {
    const listeners = new Map();
    return {
        on(name, cb) { listeners.set(name, [...(listeners.get(name) || []), cb]); },
        off(name, cb) { listeners.set(name, (listeners.get(name) || []).filter(f => f !== cb)); },
        emit(name, data) { (listeners.get(name) || []).slice().forEach(cb => cb(data)); }
    };
}

test('npc-manager passes voiced from a mapping and a timedConversation to phone-chat',
    { skip: plumbed ? false : 'npc-manager.js voiced plumbing not applied yet (see FINALE_ENGINE_VOICED_CALLS.md)' }, async () => {
    writeFileSync(join(dir, 'npc-los.mjs'), read('systems/npc-los.js'));
    writeFileSync(join(dir, 'npc-manager.mjs'), nmSrc.replace("'./npc-los.js'", "'./npc-los.mjs'")
        .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
    globalThis.window = { gameState: { globalVariables: {} } };
    const quiet = console.log;
    console.log = () => {};
    try {
        const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);
        const m = new NPCManager(makeDispatcher(), null);
        m.registerNPC({ id: 'hax', npcType: 'phone', phoneId: 'player_phone', currentKnot: 'hub',
            timedConversation: { delay: 0, targetKnot: 'call', voiced: true },
            eventMappings: [
                { eventPattern: 'ring', conversationMode: 'phone-chat', targetKnot: 'call', voiced: true, disableClose: true, resume: true, cooldown: 0 },
                { eventPattern: 'text', conversationMode: 'phone-chat', targetKnot: 'hub', cooldown: 0 }
            ] });
        m.registerNPC({ id: 'netherton', npcType: 'phone', phoneId: 'player_phone', currentKnot: 'start',
            timedConversation: { delay: 0, targetKnot: 'start' } });
        const started = [];
        window.MinigameFramework = { currentMinigame: null, startMinigame: (...a) => started.push(a), endMinigame() {} };
        const realSetTimeout = globalThis.setTimeout;
        globalThis.setTimeout = (cb) => { cb(); return 0; };
        try {
            m.eventDispatcher.emit('ring', {});
            m.eventDispatcher.emit('text', {});
            for (const c of m.timedConversations) m._deliverTimedConversation(c);
        } finally {
            globalThis.setTimeout = realSetTimeout;
        }
        assert.deepEqual(started.map(s => [s[0], s[2].npcId, s[2].voiced, s[2].disableClose]), [
            ['phone-chat', 'hax', true, true],
            ['phone-chat', 'hax', false, false],
            ['phone-chat', 'hax', true, false],
            ['phone-chat', 'netherton', false, false]
        ]);
    } finally {
        console.log = quiet;
    }
});
