// Phone chat: ink lines written as the player's ("You: …", "Player: …" or tagged
// #speaker:player) show and are stored as the player's, not the NPC's (approval log U3).
// Run with: node --test test/js/phone-player-lines.test.mjs
//
// The browser modules are copied to a temp dir as .mjs, as in
// phone-reopen-and-persistence.test.mjs.

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'phone-player-lines-test-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
const speakerImport = s => s.replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'")
    .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'");
copy('systems/npc-los.js', 'npc-los.mjs');
copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
copy('systems/npc-manager.js', 'npc-manager.mjs', s => speakerImport(s.replace("'./npc-los.js'", "'./npc-los.mjs'")));
copy('systems/ink/ink-engine.js', 'ink-engine.mjs');
copy('minigames/phone-chat/phone-chat-conversation.js', 'phone-chat-conversation.mjs', speakerImport);

globalThis.window = { gameState: { globalVariables: {} } };
globalThis.inkjs = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
const { classifyPhoneLine, tagsSayPlayer, tagsSayNarrator, phoneStepLines, stripContactPrefix, displayPhoneLine, phoneBarkText } =
    await import(pathToFileURL(join(dir, 'phone-chat-speaker.mjs')).href);
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);
const { default: InkEngine } = await import(pathToFileURL(join(dir, 'ink-engine.mjs')).href);
const { default: PhoneChatConversation } = await import(pathToFileURL(join(dir, 'phone-chat-conversation.mjs')).href);

const storyJson = JSON.parse(readFileSync(join(here, 'fixtures/phone_player_lines.json'), 'utf8').replace(/^﻿/, ''));

const quiet = fn => async (...a) => {
    const log = console.log; console.log = () => {};
    try { return await fn(...a); } finally { console.log = log; }
};

function makeDispatcher() {
    const listeners = new Map();
    return {
        on(name, cb) { listeners.set(name, [...(listeners.get(name) || []), cb]); },
        off(name, cb) { listeners.set(name, (listeners.get(name) || []).filter(f => f !== cb)); },
        emit(name, data) { (listeners.get(name) || []).slice().forEach(cb => cb(data)); }
    };
}

function resetWindow(globals = {}) {
    globalThis.window = { gameState: { globalVariables: { ...globals } } };
}

const syncGlobals = story => {
    for (const [k, v] of Object.entries(window.gameState.globalVariables)) {
        if (story.variablesState.GlobalVariableExistsWithName(k)) story.variablesState[k] = v;
    }
};

// ---------------------------------------------------------------- the helper

test('a "You:" or "Player:" line is the player\'s, prefix stripped; other lines keep their type', () => {
    assert.deepEqual(classifyPhoneLine('npc', 'You: Just checking in.'), { type: 'player', text: 'Just checking in.' });
    assert.deepEqual(classifyPhoneLine('npc', '  you :  Hi.'), { type: 'player', text: 'Hi.' });
    assert.deepEqual(classifyPhoneLine('npc', 'Player: Hello.'), { type: 'player', text: 'Hello.' });
    assert.deepEqual(classifyPhoneLine('npc', 'Did You: see it?'), { type: 'npc', text: 'Did You: see it?' });
    assert.deepEqual(classifyPhoneLine('npc', 'Your call.'), { type: 'npc', text: 'Your call.' });
    assert.deepEqual(classifyPhoneLine('npc', 'You:'), { type: 'npc', text: 'You:' }, 'an empty line is left alone');
    assert.deepEqual(classifyPhoneLine('npc', 'voice: You: hello'), { type: 'npc', text: 'voice: You: hello' });
    assert.deepEqual(classifyPhoneLine('player', 'You: as typed'), { type: 'player', text: 'You: as typed' },
        'a choice the player picked is shown as written');
});

test('#speaker:player marks a step as the player\'s; the last speaker tag wins', () => {
    assert.equal(tagsSayPlayer(['speaker:player']), true);
    assert.equal(tagsSayPlayer(['player']), true);
    assert.equal(tagsSayPlayer(['speaker:player', 'speaker:npc']), false);
    assert.equal(tagsSayPlayer(['speaker:npc:guard', 'speaker:player', 'give_item:x']), true);
    assert.equal(tagsSayPlayer(['give_item:x']), false);
    assert.deepEqual(phoneStepLines('Sent it.\nYou: Twice.\n', ['speaker:player']), ['You: Sent it.', 'You: Twice.']);
    assert.deepEqual(phoneStepLines('Got it.', ['complete_task:x']), ['Got it.']);
    assert.deepEqual(phoneStepLines('  ', ['speaker:player']), []);
});

// ---------------------------------------------------------------- history and unread

test('npcManager stores a "You:" line as a read player message, so it is not unread', () => {
    resetWindow();
    const m = new NPCManager(makeDispatcher(), null);
    m.registerNPC({ id: 'patricia', npcType: 'phone', phoneId: 'player_phone', storyPath: 'p.json' });
    m.addMessage('patricia', 'npc', 'Anything?');
    m.addMessage('patricia', 'npc', 'You: Just checking in.', { read: false });
    assert.deepEqual(m.getConversationHistory('patricia').map(x => [x.type, x.text, x.read]),
        [['npc', 'Anything?', false], ['player', 'Just checking in.', true]]);
    assert.equal(m.getTotalUnreadCount('player_phone'), 1);
});

test('the preload stores a "You:" line in the opening as the player\'s and counts only NPC lines as unread', quiet(async () => {
    resetWindow();
    const m = new NPCManager(makeDispatcher(), null);
    m.registerNPC({ id: 'patricia', npcType: 'phone', phoneId: 'player_phone', storyJSON: storyJson, currentKnot: 'start' });
    const n = await PhoneChatConversation.preloadOpening(m.getNPC('patricia'), m, new InkEngine('patricia'));
    assert.equal(n, 2);
    assert.deepEqual(m.getConversationHistory('patricia').map(x => [x.type, x.text, x.read, !!x.preloaded]),
        [['npc', 'Morning. Anything?', false, true], ['player', 'Morning.', true, true]]);
    assert.equal(m.getTotalUnreadCount('player_phone'), 1);
}));

test('a player line survives a reload as the player\'s; a thread saved before the fix is corrected', () => {
    resetWindow();
    const before = new NPCManager(makeDispatcher(), null);
    before.registerNPC({ id: 'patricia', npcType: 'phone', phoneId: 'player_phone', storyPath: 'p.json' });
    before.addMessage('patricia', 'npc', 'You: Just checking in.');
    before.addMessage('patricia', 'npc', 'Noted.', { read: true });
    const saved = JSON.parse(JSON.stringify(before.exportPhoneState()));
    assert.deepEqual(saved.patricia.history.map(x => [x.type, x.text]),
        [['player', 'Just checking in.'], ['npc', 'Noted.']], 'sent to the server as type "player"');

    // An old save: the line was stored as an unread NPC message with its prefix
    saved.hax = { history: [{ type: 'npc', text: 'You: Morning.', read: false, timestamp: 1 }] };
    const after = new NPCManager(makeDispatcher(), null);
    after.restorePhoneState(saved);
    after.registerNPC({ id: 'patricia', npcType: 'phone', phoneId: 'player_phone', storyPath: 'p.json' });
    after.registerNPC({ id: 'hax', npcType: 'phone', phoneId: 'player_phone', storyPath: 'h.json' });
    assert.deepEqual(after.getConversationHistory('patricia').map(x => [x.type, x.text, x.read]),
        [['player', 'Just checking in.', true], ['npc', 'Noted.', true]]);
    assert.deepEqual(after.getConversationHistory('hax').map(x => [x.type, x.text, x.read]),
        [['player', 'Morning.', true]]);
    assert.equal(after.getTotalUnreadCount('player_phone'), 0);
});

test('the server keeps a player message as sent (type "player" passes the sanitiser)', () => {
    const src = readFileSync(join(here, '../../app/models/break_escape/game.rb'), 'utf8');
    assert.match(src, /when 'type' then value\.length <= 20/);
});

// ---------------------------------------------------------------- live run and reopen

test('a live run returns "You:" lines and #speaker:player lines in a form the minigame shows as the player\'s', quiet(async () => {
    resetWindow({ flag: false, noted: false });
    const conv = new PhoneChatConversation('patricia', { getNPC: () => null }, new InkEngine('patricia'));
    await conv.loadStory(storyJson);
    conv.goToKnot('hub');
    let r;
    do { r = conv.continue(); } while (!r.choices?.length && !r.hasEnded);

    const lines = [];
    let res = conv.makeChoice(0);     // [Say nothing.]
    lines.push(...phoneStepLines(res.text, res.tags));
    while (res.canContinue && !res.choices?.length) { res = conv.continue(); lines.push(...phoneStepLines(res.text, res.tags)); }
    res = conv.makeChoice(1);         // [Send the photo.]
    lines.push(...phoneStepLines(res.text, res.tags));
    while (res.canContinue && !res.choices?.length) { res = conv.continue(); lines.push(...phoneStepLines(res.text, res.tags)); }

    assert.deepEqual(lines.map(l => classifyPhoneLine('npc', l)), [
        { type: 'player', text: 'Just checking in.' },
        { type: 'npc', text: 'Noted.' },
        { type: 'player', text: 'Photo of the manifest.' },
        { type: 'npc', text: 'Got it.' }
    ]);
}));

test('a reopen that re-runs the knot returns its new player line as the player\'s (E10/E13 path)', quiet(async () => {
    resetWindow({ flag: false, noted: false });
    const first = new PhoneChatConversation('patricia', { getNPC: () => null }, new InkEngine('patricia'));
    await first.loadStory(storyJson);
    syncGlobals(first.engine.story);
    first.goToKnot('hub');
    let r;
    do { r = first.continue(); } while (!r.choices?.length && !r.hasEnded);
    const saved = first.saveState();

    window.gameState.globalVariables.flag = true;
    const conv = new PhoneChatConversation('patricia', { getNPC: () => null }, new InkEngine('patricia'));
    await conv.loadStory(storyJson);
    assert.equal(conv.restoreState(saved), true);
    const out = conv.reopenWithCurrentGlobals(syncGlobals);
    assert.equal(out.renavigated, true);
    assert.deepEqual(out.messages.map(l => classifyPhoneLine('npc', l)), [
        { type: 'player', text: 'Sent you the file.' },
        { type: 'npc', text: "Thanks. That's him." }
    ]);
}));

// ---------------------------------------------------------------- the minigame and UI wiring

test('the phone minigame types every story line through the speaker check, with no NPC typing for player lines', () => {
    const src = readFileSync(join(js, 'minigames/phone-chat/phone-chat-minigame.js'), 'utf8');
    assert.equal((src.match(/this\._showStoryLine\(message, TYPING_DELAY_MS\)/g) || []).length, 2,
        'both the continue and the choice paths');
    assert.equal((src.match(/phoneStepLines\(/g) || []).length, 3, 'every place story text is collected');
    assert.doesNotMatch(src, /addMessage\('npc', message/, 'no story line is added as the NPC\'s unchecked');
    assert.match(src, /const line = classifyPhoneLine\('npc', raw\.trim\(\)\);\s*\n\s*if \(line\.type === 'npc'\) \{\s*\n\s*this\.ui\.showTypingIndicator\(\);/);
});

test('the phone UI shows a player line as a player bubble, never voices it, and labels it in the contact preview', () => {
    const src = readFileSync(join(js, 'minigames/phone-chat/phone-chat-ui.js'), 'utf8');
    assert.match(src, /\(\{ type, text \} = displayPhoneLine\(type, text\.trim\(\), contact\)\);/);
    assert.match(src, /const isVoiceMessage = type === 'npc' && /);
    assert.match(src, /line\.type === 'player' \? `You: \$\{line\.text\}` : line\.text/);
});

// ---------------------------------------------------------------- the contact's own name prefix

const patricia = { id: 'patricia_phone', displayName: 'Patricia Morgan' };
const hax = { id: 'agent_0x99_handler', displayName: 'Agent HaX' };

test("the contact's own \"Name:\" prefix is dropped; anyone else's stays", () => {
    assert.equal(stripContactPrefix('Patricia Morgan: Still here.', patricia), 'Still here.');
    assert.equal(stripContactPrefix('  patricia morgan :  Still here.', patricia), 'Still here.');
    assert.equal(stripContactPrefix('Agent HaX: Torres said: not tonight.', hax), 'Torres said: not tonight.',
        'only the leading prefix');
    assert.equal(stripContactPrefix('agent_0x99_handler: by id', hax), 'by id');
    assert.equal(stripContactPrefix('Agent 0x99 Handler: id with spaces', hax), 'id with spaces');
    assert.equal(stripContactPrefix('Narrator: The line goes dead.', patricia), 'Narrator: The line goes dead.');
    assert.equal(stripContactPrefix('Ghost: relayed.', hax), 'Ghost: relayed.', 'a relayed quote keeps its name');
    assert.equal(stripContactPrefix('Patricia Morgan:', patricia), 'Patricia Morgan:', 'an empty line is left alone');
    assert.equal(stripContactPrefix('No prefix here.', patricia), 'No prefix here.');
    assert.equal(stripContactPrefix('Patricia Morgan: x', null), 'Patricia Morgan: x');
});

test('a stored line renders without the prefix, so threads saved earlier display cleanly', () => {
    assert.deepEqual(displayPhoneLine('npc', 'Patricia Morgan: Go on, then.', patricia), { type: 'npc', text: 'Go on, then.' });
    assert.deepEqual(displayPhoneLine('npc', 'You: Morning.', patricia), { type: 'player', text: 'Morning.' });
    assert.deepEqual(displayPhoneLine('player', 'Patricia Morgan: typed by the player', patricia),
        { type: 'player', text: 'Patricia Morgan: typed by the player' }, "the player's own text is untouched");
    assert.deepEqual(displayPhoneLine('npc', 'Patricia Morgan: voice: Call me.', patricia),
        { type: 'npc', text: 'voice: Call me.' }, 'stripped before the voice: check, so TTS never reads the name');
});

test("a bark shows only the contact's words, prefix dropped, or nothing", () => {
    assert.equal(phoneBarkText('Agent HaX: Front desk first.', hax), 'Front desk first.');
    assert.equal(phoneBarkText('You: Sent it.\nPatricia Morgan: Got it.', patricia), 'Got it.');
    assert.equal(phoneBarkText('You: Hello?', patricia), '', 'a player line alone is no bark');
    assert.equal(phoneBarkText('Narrator: The line goes dead.', patricia), '', 'narration alone is no bark');
    assert.equal(phoneBarkText('Narrator: The line crackles.\nPatricia Morgan: Still here.', patricia), 'Still here.');
    assert.equal(phoneBarkText('', patricia), '');
});

async function knotBark(knot) {
    resetWindow();
    const shown = [];
    const m = new NPCManager(makeDispatcher(), { showBark: p => shown.push(p) });
    m.registerNPC({ id: 'patricia_phone', displayName: 'Patricia Morgan', npcType: 'phone',
        phoneId: 'player_phone', storyPath: 'patricia.json' });
    m.storyCache.set('patricia.json', storyJson);
    const engine = new InkEngine('patricia_phone');
    engine.loadStory(storyJson);
    m.inkEngineCache.set('patricia_phone', engine);
    await m._showBarkFromKnot('patricia_phone', m.getNPC('patricia_phone'), knot, 'item_picked_up:x');
    return { m, shown };
}

test("a mapping's bark knot that opens with the player's line barks the NPC's next line", quiet(async () => {
    const { m, shown } = await knotBark('bark_after_player');
    assert.equal(shown.length, 1);
    assert.equal(phoneBarkText(shown[0].message, m.getNPC('patricia_phone')), "Got it. That's him.");
    assert.deepEqual(m.getConversationHistory('patricia_phone').map(x => [x.type, x.text.trim(), x.read]),
        [['player', 'Sent you the photo.', true], ['npc', "Patricia Morgan: Got it. That's him.", false]]);
    assert.equal(m.getTotalUnreadCount('player_phone'), 1);
}));

test("a bark knot with only the player's line shows no bark", quiet(async () => {
    const { m, shown } = await knotBark('bark_only_player');
    assert.equal(shown.length, 0);
    assert.equal(m.getTotalUnreadCount('player_phone'), 0);
}));

test('the bark popup filters its text before showing or voicing it', () => {
    const src = readFileSync(join(js, 'systems/npc-barks.js'), 'utf8');
    const render = src.slice(src.indexOf('async _renderBark('));
    const filter = render.indexOf("const text = phoneBarkText(payload.text || payload.message || '', contact);");
    assert.ok(filter > 0, 'bark text goes through phoneBarkText');
    assert.ok(filter < render.indexOf('this._speakBark(npcId, text)'), 'before TTS');
    assert.match(render, /if \(!text\) return null;/);
});

test('the phone UI, the notepad copy and the text export all render lines through displayPhoneLine', () => {
    const ui = readFileSync(join(js, 'minigames/phone-chat/phone-chat-ui.js'), 'utf8');
    assert.match(ui, /\(\{ type, text \} = displayPhoneLine\(type, text\.trim\(\), contact\)\);/);
    assert.match(ui, /const line = displayPhoneLine\(lastMessage\.type, lastMessage\.text, npc\);/);
    const mg = readFileSync(join(js, 'minigames/phone-chat/phone-chat-minigame.js'), 'utf8');
    assert.match(mg, /displayPhoneLine\(original\.type, original\.text, npc\)/);
    const hist = readFileSync(join(js, 'minigames/phone-chat/phone-chat-history.js'), 'utf8');
    assert.match(hist, /displayPhoneLine\(original\.type, original\.text, npc\)/);
});

// ---------------------------------------------------------------- closing mid-typeout after a choice

test('both typeouts keep untyped lines for the close-time flush, and a stale typeout stops', () => {
    const src = readFileSync(join(js, 'minigames/phone-chat/phone-chat-minigame.js'), 'utf8');
    assert.equal((src.match(/this\._pendingNpcMessages = accumulatedMessages\.filter\(m => m\.trim\(\)\)\.map\(m => m\.trim\(\)\);/g) || []).length, 2,
        '_presentOutput and handleChoice');
    assert.equal((src.match(/this\._pendingNpcMessages\.shift\(\);/g) || []).length, 2);
    const choice = src.slice(src.indexOf('async handleChoice('), src.indexOf('saveStoryState() {'));
    assert.ok(choice.indexOf('this._pendingNpcMessages = accumulatedMessages') < choice.indexOf('this._showStoryLine('));
    assert.match(src, /_flushPendingMessages\(\) \{\s*\n\s*this\._typeoutRun = \(this\._typeoutRun \|\| 0\) \+ 1;/);
    assert.match(src, /const stillOurs = \(\) => this\.isConversationActive && run === this\._typeoutRun;/);
});

// ---------------------------------------------------------------- narration

test('a "Narrator:" line is narration, prefix stripped; the last speaker tag decides a tagged step', () => {
    assert.deepEqual(classifyPhoneLine('npc', 'Narrator: The line goes dead.'), { type: 'narrator', text: 'The line goes dead.' });
    assert.deepEqual(classifyPhoneLine('npc', '  NARRATOR :  Static.'), { type: 'narrator', text: 'Static.' });
    assert.deepEqual(classifyPhoneLine('npc', 'Narrator[ghost]: A pause.'), { type: 'narrator', text: 'A pause.' });
    assert.deepEqual(classifyPhoneLine('npc', 'Narrator:'), { type: 'npc', text: 'Narrator:' }, 'empty is left alone');
    assert.deepEqual(classifyPhoneLine('npc', 'The narrator: said so.'), { type: 'npc', text: 'The narrator: said so.' });
    assert.deepEqual(classifyPhoneLine('narrator', 'Static.'), { type: 'narrator', text: 'Static.' });
    assert.deepEqual(classifyPhoneLine('player', 'Narrator: typed'), { type: 'player', text: 'Narrator: typed' });
    assert.equal(tagsSayNarrator(['speaker:narrator']), true);
    assert.equal(tagsSayNarrator(['speaker:narrator', 'speaker:npc']), false);
    assert.equal(tagsSayNarrator(['give_item:x']), false);
    assert.deepEqual(phoneStepLines('The line goes dead.', ['speaker:narrator']), ['Narrator: The line goes dead.']);
    assert.deepEqual(displayPhoneLine('npc', 'Narrator: Static.', hax), { type: 'narrator', text: 'Static.' });
});

test('npcManager stores narration as a read narrator line: not unread, kept through a reload', () => {
    resetWindow();
    const m = new NPCManager(makeDispatcher(), null);
    m.registerNPC({ id: 'patricia', npcType: 'phone', phoneId: 'player_phone', storyPath: 'p.json' });
    m.addMessage('patricia', 'npc', 'Narrator: The line crackles.', { read: false });
    m.addMessage('patricia', 'npc', 'Anything?');
    assert.deepEqual(m.getConversationHistory('patricia').map(x => [x.type, x.text, x.read]),
        [['narrator', 'The line crackles.', true], ['npc', 'Anything?', false]]);
    assert.equal(m.getTotalUnreadCount('player_phone'), 1);
    const saved = JSON.parse(JSON.stringify(m.exportPhoneState()));
    assert.equal(saved.patricia.history[0].type, 'narrator');

    resetWindow();
    const after = new NPCManager(makeDispatcher(), null);
    after._savedPhoneState = new Map(Object.entries(saved));
    after.registerNPC({ id: 'patricia', npcType: 'phone', phoneId: 'player_phone', storyPath: 'p.json' });
    after._applySavedPhoneState('patricia');
    assert.equal(after.getConversationHistory('patricia')[0].type, 'narrator');

    // a thread saved before narration support holds it as an unread NPC line
    resetWindow();
    const old = new NPCManager(makeDispatcher(), null);
    old._savedPhoneState = new Map([['patricia', { history: [{ type: 'npc', text: 'Narrator: Static.', read: false, timestamp: 1 }] }]]);
    old.registerNPC({ id: 'patricia', npcType: 'phone', phoneId: 'player_phone', storyPath: 'p.json' });
    old._applySavedPhoneState('patricia');
    assert.deepEqual(old.getConversationHistory('patricia').map(x => [x.type, x.text, x.read]), [['narrator', 'Static.', true]]);
    assert.equal(old.getTotalUnreadCount('player_phone'), 0);
});

test('a bark knot that opens with narration stores it and barks the next contact line', quiet(async () => {
    resetWindow();
    const shown = [];
    const m = new NPCManager(makeDispatcher(), { showBark: p => shown.push(p) });
    m.registerNPC({ id: 'patricia_phone', displayName: 'Patricia Morgan', npcType: 'phone', phoneId: 'player_phone', storyPath: 'p.json' });
    m.storyCache.set('p.json', storyJson);
    const steps = [{ text: 'Narrator: The line crackles.', tags: [] }, { text: 'Patricia Morgan: Still here.', tags: [] }];
    m.inkEngineCache.set('patricia_phone', { goToKnot() {}, continue: () => steps.shift() });
    await m._showBarkFromKnot('patricia_phone', m.getNPC('patricia_phone'), 'k', 'e:x');
    assert.equal(shown.length, 1);
    assert.equal(phoneBarkText(shown[0].message, m.getNPC('patricia_phone')), 'Still here.');
    assert.deepEqual(m.getConversationHistory('patricia_phone').map(x => [x.type, x.read]), [['narrator', true], ['npc', false]]);
    assert.equal(m.getTotalUnreadCount('player_phone'), 1);
}));

test('the phone UI draws narration without a bubble and skips it for the contact-list preview', () => {
    const ui = readFileSync(join(js, 'minigames/phone-chat/phone-chat-ui.js'), 'utf8');
    assert.match(ui, /if \(type === 'narrator'\) \{[\s\S]*?message-narration[\s\S]*?return Promise\.resolve\(\);/);
    assert.match(ui, /displayPhoneLine\(msg\.type, msg\.text, npc\)\.type === 'narrator'/);
    const css = readFileSync(join(here, '../../public/break_escape/css/phone-chat-minigame.css'), 'utf8');
    assert.match(css, /\.message-narration \{[^}]*align-self: center;[^}]*font-style: italic;/);
});
