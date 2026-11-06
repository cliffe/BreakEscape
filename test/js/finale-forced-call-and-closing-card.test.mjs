// Finale engine trial (F14): a resumable forced phone call, and the computed closing
// card with per-person credits. See docs/agents/FINALE_ENGINE_TRIAL_CALLS_CREDITS.md.
// Run with: node --test test/js/finale-forced-call-and-closing-card.test.mjs
//
// Browser modules with relative imports are copied to a temp dir as .mjs, as in
// phone-reopen-and-persistence.test.mjs; import-free ones load from a data: URL.

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const read = (p) => readFileSync(join(js, p), 'utf8');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

const dir = mkdtempSync(join(tmpdir(), 'finale-call-test-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(read(src)));
copy('systems/npc-los.js', 'npc-los.mjs');
copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
copy('systems/npc-manager.js', 'npc-manager.mjs', s => s.replace("'./npc-los.js'", "'./npc-los.mjs'")
    .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
copy('systems/ink/ink-engine.js', 'ink-engine.mjs');
copy('minigames/phone-chat/phone-chat-conversation.js', 'phone-chat-conversation.mjs',
    s => s.replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));

globalThis.window = { gameState: { globalVariables: {} } };
globalThis.inkjs = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
const quiet = console.log;
console.log = () => {};
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);
const { default: InkEngine } = await import(pathToFileURL(join(dir, 'ink-engine.mjs')).href);
const { default: PhoneChatConversation } = await import(pathToFileURL(join(dir, 'phone-chat-conversation.mjs')).href);
const { otherSpeaker, displayPhoneLine } = await import(pathToFileURL(join(dir, 'phone-chat-speaker.mjs')).href);
const lock = await import(dataUrl(read('minigames/phone-chat/phone-call-lock.js')));
const damage = await import(dataUrl(read('systems/player-damage-interrupt.js')));
const seq = await import(dataUrl(read('music/closing-sequence.js')));

const callJson = JSON.parse(readFileSync(join(here, 'fixtures/forced_call.json'), 'utf8').replace(/^﻿/, ''));

function makeDispatcher() {
    const listeners = new Map();
    return {
        on(name, cb) { listeners.set(name, [...(listeners.get(name) || []), cb]); },
        off(name, cb) { listeners.set(name, (listeners.get(name) || []).filter(f => f !== cb)); },
        emit(name, data) { (listeners.get(name) || []).slice().forEach(cb => cb(data)); }
    };
}

function withMinigames(fn) {
    const started = [];
    window.MinigameFramework = { currentMinigame: null, startMinigame: (...a) => started.push(a), endMinigame() {} };
    const realSetTimeout = globalThis.setTimeout;
    globalThis.setTimeout = (cb) => { cb(); return 0; };   // run the 500 ms scene delay now
    try { fn(started); } finally {
        globalThis.setTimeout = realSetTimeout;
        delete window.MinigameFramework;
    }
}

// ------------------------------------------------------------------ forced call

test('Esc on a forced call does nothing; otherwise back from a thread, close from the list', () => {
    assert.equal(lock.phoneEscapeAction('conversation', { disableClose: true }), 'none');
    assert.equal(lock.phoneEscapeAction('contacts', { disableClose: true }), 'none');
    assert.equal(lock.phoneEscapeAction('conversation', {}), 'back');
    assert.equal(lock.phoneEscapeAction('contacts', {}), 'close');
    assert.equal(lock.phoneCloseLocked({ disableClose: 'yes' }), false, 'only true locks');
});

test('phone-chat wiring: Esc, the back arrow and every story end honour disableClose', () => {
    const src = read('minigames/phone-chat/phone-chat-minigame.js');
    const keys = src.slice(src.indexOf('handleKeyPress(event)'), src.indexOf('async start()'));
    assert.match(keys, /phoneEscapeAction\(this\.ui\.getCurrentView\(\), this\.params\)/);
    assert.match(src, /backButton\.style\.display = 'none'/);
    assert.match(src, /'click', \(\) => \{\s*\n\s*if \(phoneCloseLocked\(this\.params\)\) return;\s*\n\s*this\.closeConversation\(\);/);
    // Every "story is over without an exit tag" spot releases a forced call
    const ends = src.split('this.isConversationActive = false;\n').length - 1;
    const releases = (src.match(/this\._releaseForcedCall\(\);/g) || []).length;
    assert.equal(releases, 5);
    assert.ok(ends >= releases);
    assert.match(src, /_releaseForcedCall\(\) \{\s*\n\s*if \(!phoneCloseLocked\(this\.params\)\) return;/);
});

test('a hit closes a forced call (no Esc to fight back), but leaves an ordinary phone open', () => {
    let closed = 0;
    const phone = (params) => ({ _sceneType: 'phone-chat', params, complete() { closed++; } });
    const framework = (current) => ({ currentMinigame: current, forceCloseMinigame() {} });
    assert.equal(damage.closeMinigameOnDamage(5, { framework: framework(phone({})), notify: () => {} }), false);
    assert.equal(closed, 0);
    assert.equal(damage.closeMinigameOnDamage(5, { framework: framework(phone({ disableClose: true })), notify: () => {} }), true);
    assert.equal(closed, 1);
});

test('a bark click does not replace a forced call', () => {
    const src = read('systems/npc-barks.js');
    assert.match(src, /if \(inventoryBlockedByForcedMinigame\(\)\) return;\s*\n\s*this\.openPhoneChat\(payload\);/);
});

test('re-ring: conversation_closed reopens an unfinished call without a knot, forced', () => {
    window.gameState = { globalVariables: { call_started: true, call_done: false } };
    const m = new NPCManager(makeDispatcher(), null);
    m.registerNPC({
        id: 'hax', npcType: 'phone', phoneId: 'player_phone', displayName: 'Agent HaX', currentKnot: 'hub',
        eventMappings: [{
            eventPattern: 'conversation_closed:hax',
            condition: 'globalVars.call_started && !globalVars.call_done',
            conversationMode: 'phone-chat', targetKnot: 'forced_call',
            resume: true, disableClose: true, cooldown: 0
        }]
    });
    const hax = m.getNPC('hax');
    withMinigames(started => {
        // No saved story yet: rings at the knot, like a first call
        m.eventDispatcher.emit('conversation_closed:hax', { npcId: 'hax' });
        assert.equal(started.length, 1);
        assert.equal(started[0][0], 'phone-chat');
        assert.equal(started[0][2].startKnot, 'forced_call');
        assert.equal(started[0][2].disableClose, true);

        // Saved story: no knot, so phone-chat restores it at the unanswered choice
        hax.storyState = '{"saved":true}';
        m.eventDispatcher.emit('conversation_closed:hax', { npcId: 'hax' });
        assert.equal(started.length, 2);
        assert.equal(started[1][2].startKnot, null);

        // Done: no more rings
        window.gameState.globalVariables.call_done = true;
        m.eventDispatcher.emit('conversation_closed:hax', { npcId: 'hax' });
        assert.equal(started.length, 2);
    });
});

test('re-ring on leaving a room: the room_exited payload and globals gate it', () => {
    window.gameState = { globalVariables: { call_started: true, call_done: false } };
    const m = new NPCManager(makeDispatcher(), null);
    m.registerNPC({
        id: 'hax', npcType: 'phone', phoneId: 'player_phone', currentKnot: 'hub',
        eventMappings: [{
            eventPattern: 'room_exited',
            condition: "data.roomId === 'office' && globalVars.call_started && !globalVars.call_done",
            conversationMode: 'phone-chat', resume: true, disableClose: true, cooldown: 0
        }]
    });
    m.getNPC('hax').storyState = '{"saved":true}';
    withMinigames(started => {
        m.eventDispatcher.emit('room_exited', { roomId: 'lobby', nextRoom: 'office' });
        assert.equal(started.length, 0);
        m.eventDispatcher.emit('room_exited', { roomId: 'office', nextRoom: 'lobby' });
        assert.equal(started.length, 1);
        assert.equal(started[0][2].startKnot, null);
    });
});

test('a mapping without resume still jumps to its knot (unchanged)', () => {
    window.gameState = { globalVariables: {} };
    const m = new NPCManager(makeDispatcher(), null);
    m.registerNPC({
        id: 'hax', npcType: 'phone', phoneId: 'player_phone', currentKnot: 'hub',
        eventMappings: [{ eventPattern: 'x', conversationMode: 'phone-chat', targetKnot: 'forced_call', cooldown: 0 }]
    });
    m.getNPC('hax').storyState = '{"saved":true}';
    withMinigames(started => {
        m.eventDispatcher.emit('x', {});
        assert.equal(started[0][2].startKnot, 'forced_call');
        assert.equal(started[0][2].disableClose, false);
    });
});

test('timedConversation passes disableClose to both phone and person scenes', () => {
    window.gameState = { globalVariables: {} };
    const m = new NPCManager(makeDispatcher(), null);
    m.registerNPC({ id: 'hax', npcType: 'phone', phoneId: 'player_phone', currentKnot: 'hub',
        timedConversation: { delay: 0, targetKnot: 'forced_call', disableClose: true } });
    m.registerNPC({ id: 'boss', npcType: 'person', currentKnot: 'start',
        timedConversation: { delay: 0, targetKnot: 'brief' } });
    withMinigames(started => {
        for (const c of m.timedConversations) m._deliverTimedConversation(c);
        const phone = started.find(s => s[0] === 'phone-chat');
        const person = started.find(s => s[0] === 'person-chat');
        assert.equal(phone[2].disableClose, true);
        assert.equal(person[2].disableClose, false);
    });
});

test('the saved story resumes at the unanswered choice, not the start of the call', async () => {
    window.gameState = { globalVariables: {} };
    const conv = new PhoneChatConversation('hax', { getNPC: () => null }, new InkEngine('hax'));
    await conv.loadStory(callJson);
    conv.goToKnot('forced_call');
    let r;
    do { r = conv.continue(); } while (!r.choices?.length && !r.hasEnded);
    assert.deepEqual(r.choices.map(c => c.text), ['Answer one', 'Other answer one']);
    r = conv.makeChoice(0);
    while (r.canContinue && !r.choices?.length) r = conv.continue();
    const saved = conv.saveState();   // phone-chat saves after every choice

    // The player is hit (or the call is otherwise closed) here; the re-ring restores
    const again = new PhoneChatConversation('hax', { getNPC: () => null }, new InkEngine('hax'));
    await again.loadStory(callJson);
    assert.equal(again.restoreState(saved), true);
    const now = again.getCurrentState();
    assert.deepEqual(now.choices.map(c => c.text), ['Answer two']);
    assert.equal(again.engine.story.variablesState.call_started, true);
    assert.equal(again.engine.story.variablesState.call_done, false);
});

// ---------------------------------------------------------------- second speaker

test('another character speaking in a contact thread is labelled with their name', () => {
    const hax = { id: 'agent_0x99', displayName: 'Agent HaX' };
    const names = ['Agent HaX', 'Director Netherton', 'Nightshade'];
    assert.deepEqual(otherSpeaker('Director Netherton: Put her on.', hax, names),
        { name: 'Director Netherton', text: 'Put her on.' });
    assert.deepEqual(otherSpeaker('director netherton:  Lower case still counts.', hax, names),
        { name: 'Director Netherton', text: 'Lower case still counts.' });
    assert.equal(otherSpeaker('Agent HaX: My own line.', hax, names), null, "the contact's own name is not another speaker");
    assert.equal(otherSpeaker('Note: not a character.', hax, names), null);
    assert.equal(otherSpeaker('Nightshade:', hax, names), null, 'no text after the name');
    assert.equal(otherSpeaker('Just a line.', hax, names), null);
    // displayPhoneLine still strips the contact's own prefix first
    assert.equal(displayPhoneLine('npc', 'Agent HaX: Hi.', hax).text, 'Hi.');
});

test('the phone UI draws the other speaker as a name over the bubble', () => {
    const ui = read('minigames/phone-chat/phone-chat-ui.js');
    assert.match(ui, /otherSpeaker\(trimmedText, contact, this\._knownSpeakerNames\(\)\)/);
    assert.match(ui, /sender\.className = 'message-sender'/);
    const css = readFileSync(join(here, '../../public/break_escape/css/phone-chat-minigame.css'), 'utf8');
    assert.match(css, /\.message-sender \{/);
});

// ------------------------------------------------------------ closing card, credits

const G = (globals) => (cond) => {
    // the same shape as scenario-music-events.js evaluateCondition
    const fn = new Function('globalVars', `return (${cond});`);
    return !!fn(globals);
};

test('closing card: lines whose conditions hold, in scenario order, at most five', () => {
    const globals = { a: true, b: false };
    const card = { lines: [
        { text: 'One', condition: 'globalVars.a' },
        { text: 'Not shown', condition: 'globalVars.b' },
        { text: 'Two' }, 'Three', { text: 'Four' }, { text: 'Five' }, { text: 'Six (over the cap)' },
        { text: '   ' }
    ] };
    assert.deepEqual(seq.closingCardLines(card, G(globals)), ['One', 'Two', 'Three', 'Four', 'Five']);
    assert.equal(seq.MAX_CARD_LINES, 5);
    assert.deepEqual(seq.closingCardLines(null, G(globals)), []);
});

test('teaser: off by default, on only while its global is set', () => {
    const card = { lines: ['Done.'], teaser: { lines: [{ text: 'Somewhere, a phone rings.' }] } };
    assert.deepEqual(seq.teaserLines(card, {}, G({})), []);
    assert.deepEqual(seq.teaserLines(card, { teaser_enabled: false }, G({})), []);
    assert.deepEqual(seq.teaserLines(card, { teaser_enabled: true }, G({})), ['Somewhere, a phone rings.']);
    const own = { teaser: { enabledBy: 'season2_tease', text: 'Next time.' } };
    assert.deepEqual(seq.teaserLines(own, { teaser_enabled: true }, G({})), []);
    assert.deepEqual(seq.teaserLines(own, { season2_tease: true }, G({})), ['Next time.']);
});

test('credits: one clause per person, sections drop when nothing in them prints', () => {
    const globals = { hax_ko: false, architect_caught: false, cleaner_met: false };
    const credits = [
        { text: 'MISSION COMPLETE', style: 'title' },
        { text: 'Only if caught', condition: 'globalVars.architect_caught' },
        { section: 'IN THIS OPERATION', people: [
            { name: 'AGENT HAX', clauses: [
                { text: 'Put on the floor by her own agent.', condition: 'globalVars.hax_ko', style: 'warning' },
                { text: 'On the line to the end.' },
                { text: 'Never reached: a later fallback' }
            ] },
            { name: 'THE CLEANER', clauses: [{ text: 'Met.', condition: 'globalVars.cleaner_met' }] }
        ] },
        { section: 'ELSEWHERE', lines: [
            { text: 'THE ARCHITECT: At large.', condition: '!globalVars.architect_caught', style: 'warning' }
        ] },
        { section: 'EMPTY BLOCK', lines: [{ text: 'never', condition: 'globalVars.cleaner_met' }] }
    ];
    assert.deepEqual(seq.expandCredits(credits, G(globals)), [
        { text: 'MISSION COMPLETE', style: 'title' },
        { text: 'IN THIS OPERATION', style: 'section-header' },
        { text: 'AGENT HAX: On the line to the end.', style: 'entry' },
        { text: 'ELSEWHERE', style: 'section-header' },
        { text: 'THE ARCHITECT: At large.', style: 'warning' }
    ]);
    globals.hax_ko = true;
    assert.deepEqual(seq.expandCredits(credits, G(globals))[2],
        { text: 'AGENT HAX: Put on the floor by her own agent.', style: 'warning' });
});

test('plain credit lines come out exactly as before (m01-m08 format)', () => {
    const credits = [
        { text: 'MISSION COMPLETE', style: 'title' },
        { text: '' },
        { text: 'X', style: 'entry', condition: 'globalVars.x' },
        { text: 'Y', condition: '!globalVars.x' }
    ];
    const old = credits.filter(i => !i.condition || G({})(i.condition))
        .map(i => ({ text: i.text ?? '', style: i.style ?? '' }));
    assert.deepEqual(seq.expandCredits(credits, G({})), old);
    assert.deepEqual(seq.buildEndSequence({ credits }, {}, G({})), old, 'no card: the sequence is the credits');
});

test('the full sequence: card, then teaser, then credits', () => {
    const entry = {
        closingCard: { lines: ['The grid stayed up.'], teaser: { lines: ['Somewhere, a phone rings.'] } },
        credits: [{ text: 'MISSION COMPLETE', style: 'title' }]
    };
    const out = seq.buildEndSequence(entry, { teaser_enabled: true }, G({}));
    assert.deepEqual(out.map(i => i.style), ['card', 'teaser', 'title']);
    assert.deepEqual(out[0].lines, ['The grid stayed up.']);
    assert.ok(seq.cardHoldMs(5) > seq.cardHoldMs(1));
});

test('wiring: music events build the sequence; the visualiser draws card lines together', () => {
    const events = read('music/scenario-music-events.js');
    assert.match(events, /buildEndSequence\(\s*entry,/);
    assert.match(events, /const hasEnding = !!\(entry\.credits\?\.length \|\| entry\.closingCard\);/);
    const vis = read('music/bond-visualiser.js');
    assert.match(vis, /'card':\s+`/);
    assert.match(vis, /'teaser':\s+`/);
    assert.match(vis, /holdMs = cardHoldMs\(item\.lines\.length\);/);
});

console.log = quiet;
