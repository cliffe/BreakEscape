// Person-chat reopen context: a conversation reopened at a hub shows the NPC's
// last line instead of a blank box, and only when the ink printed nothing.
// Run with: node --test test/js/person-chat-reopen.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../../public/break_escape/js/minigames/person-chat/person-chat-reopen.js');
const dir = mkdtempSync(join(tmpdir(), 'person-chat-reopen-'));
writeFileSync(join(dir, 'reopen.mjs'), readFileSync(src, 'utf8'));
const { rememberNpcLine, getRememberedNpcLine, forgetNpcLine, reopenContextLine,
    rememberShownText, rememberPlayerChoice, isExitTag, markClosedByExit, forgetShownText, matchesShownTail, drainReopenEcho } =
    await import(pathToFileURL(join(dir, 'reopen.mjs')).href);

const hub = { text: '', choices: [{ text: 'Ask' }, { text: 'Leave' }] };

test('remembers the last NPC line, ignoring player, system and narrator lines', () => {
    forgetNpcLine();
    rememberNpcLine('netherton', { text: 'Ask me what you need.', speaker: 'netherton' });
    rememberNpcLine('netherton', { text: 'Tell me about Cipher.', speaker: 'player' });
    rememberNpcLine('netherton', { text: 'He turns.', speaker: 'netherton', isNarrator: true });
    rememberNpcLine('netherton', { text: '(Conversation ended)', speaker: 'system' });
    rememberNpcLine('netherton', { text: '   ', speaker: 'netherton' });
    assert.deepEqual(getRememberedNpcLine('netherton'), { text: 'Ask me what you need.', speaker: 'netherton' });
    rememberNpcLine('netherton', { text: 'Brilliant, friendless.', speaker: 'netherton' });
    assert.equal(getRememberedNpcLine('netherton').text, 'Brilliant, friendless.');
    assert.equal(getRememberedNpcLine('vance'), null);
});

test('a reopen at a hub with no text gets the remembered line', () => {
    forgetNpcLine();
    rememberNpcLine('vance', { text: 'What else?', speaker: 'vance' });
    const line = reopenContextLine({ isReopen: true, result: hub, remembered: getRememberedNpcLine('vance') });
    assert.deepEqual(line, { text: 'What else?', speaker: 'vance' });
});

test('no context line when the ink prints its own re-entry line', () => {
    const line = reopenContextLine({
        isReopen: true,
        result: { text: 'Back again?', choices: hub.choices },
        remembered: { text: 'What else?', speaker: 'receptionist' }
    });
    assert.equal(line, null);
});

test('no context line on a first visit, after a reload, or without choices', () => {
    const remembered = { text: 'What else?', speaker: 'vance' };
    assert.equal(reopenContextLine({ isReopen: false, result: hub, remembered }), null);
    // After a reload the in-memory store is empty
    assert.equal(reopenContextLine({ isReopen: true, result: hub, remembered: null }), null);
    assert.equal(reopenContextLine({ isReopen: true, result: { text: '', choices: [] }, remembered }), null);
});

// ---- Reopen echo: a knot re-entered on reopen must not replay lines already shown ----
const knotChoices = [{ text: 'Emergency security consultant.' }, { text: 'The generators are burning.' }];

// A fake story that prints one scripted line per continue(), as ink does, and can be snapshotted.
function fakeStory(script) {
    let pos = 0;
    const story = { state: { ToJson: () => JSON.stringify({ pos }), LoadJson: j => { pos = JSON.parse(j).pos; } } };
    const engine = {
        calls: 0,
        continue() {
            this.calls++;
            const step = script[pos++];
            return { canContinue: pos < script.length && !step.choices, choices: [], tags: [], ...step };
        }
    };
    return { story, engine, pos: () => pos };
}
const replayScript = () => [
    { text: 'Bernie Nwosu: And you are?\n' },
    { text: 'Bernie Nwosu: Forty-seven people upstairs.\n', tags: ['speaker:npc'] },
    { text: 'Bernie Nwosu: So "I need Dr. Kim" is the start of one.\n', choices: knotChoices, canContinue: false }
];
const showReplay = () => replayScript().forEach(l => rememberShownText('receptionist', l.text, l.tags));

test('echo: a replay of only lines already shown is drained to its choices, text and tags blanked', () => {
    forgetShownText(); showReplay();
    const { story, engine } = fakeStory(replayScript());
    const r = drainReopenEcho({ npcId: 'receptionist', engine, story });
    assert.equal(r.text, '');
    assert.deepEqual(r.tags, []);
    assert.equal(r.hasEnded, false);
    assert.equal(r.choices.length, 2);
    assert.equal(engine.calls, 6, 'three silent steps, then the same three for real');
});

test('echo: the blanked result gives the recap path the last line (display only)', () => {
    forgetShownText(); forgetNpcLine(); showReplay();
    rememberNpcLine('receptionist', { text: 'So "I need Dr. Kim" is the start of one.', speaker: 'receptionist' });
    const { story, engine } = fakeStory(replayScript());
    const r = drainReopenEcho({ npcId: 'receptionist', engine, story });
    assert.deepEqual(reopenContextLine({ isReopen: true, result: r, remembered: getRememberedNpcLine('receptionist') }),
        { text: 'So "I need Dr. Kim" is the start of one.', speaker: 'receptionist' });
});

test('echo: one new line makes it a real re-entry; the story is restored and nothing is blanked', () => {
    forgetShownText(); showReplay();
    const script = replayScript(); script[1] = { text: 'Bernie Nwosu: Back already. Go on, then.\n' };
    const { story, engine, pos } = fakeStory(script);
    assert.equal(drainReopenEcho({ npcId: 'receptionist', engine, story }), null);
    assert.equal(pos(), 0, 'snapshot restored so the normal continue() starts from the top');
});

test('echo: nothing for another NPC, an empty memory, a hub that prints nothing or an exit tag', () => {
    forgetShownText(); showReplay();
    let f = fakeStory(replayScript());
    assert.equal(drainReopenEcho({ npcId: 'someone_else', engine: f.engine, story: f.story }), null);
    assert.equal(f.engine.calls, 0, 'no memory for that NPC: the story is not touched');
    f = fakeStory([{ text: '', choices: knotChoices, canContinue: false }]);
    assert.equal(drainReopenEcho({ npcId: 'receptionist', engine: f.engine, story: f.story }), null);
    assert.equal(f.pos(), 0);
    const withExit = replayScript(); withExit[1].tags = ['exit_conversation'];
    f = fakeStory(withExit);
    assert.equal(drainReopenEcho({ npcId: 'receptionist', engine: f.engine, story: f.story }), null);
    assert.equal(f.pos(), 0);
});

test('echo: a story that ends or throws mid-replay is restored, not blanked', () => {
    forgetShownText(); showReplay();
    let f = fakeStory([{ text: 'Bernie Nwosu: And you are?\n', canContinue: false }]);
    assert.equal(drainReopenEcho({ npcId: 'receptionist', engine: f.engine, story: f.story }), null);
    assert.equal(f.pos(), 0);
    f = fakeStory(replayScript());
    f.engine.continue = () => { throw new Error('boom'); };
    assert.equal(drainReopenEcho({ npcId: 'receptionist', engine: f.engine, story: f.story }), null);
});

test('echo: shown lines ignore whitespace, accumulate in order and keep the newest 40', () => {
    forgetShownText();
    rememberShownText('r', 'Line one.');
    rememberShownText('r', '  Line   two. ');
    assert.equal(matchesShownTail('r', [{ t: 'Line two.', g: '' }]), true);
    assert.equal(matchesShownTail('r', [{ t: 'Line one.', g: '' }, { t: 'Line two.', g: '' }]), true);
    assert.equal(matchesShownTail('r', [{ t: 'Line two.', g: '' }, { t: 'Line one.', g: '' }]), false, 'order matters');
    assert.equal(matchesShownTail('r', [{ t: 'Line three.', g: '' }]), false);
    assert.equal(matchesShownTail('r', []), false);
    for (let i = 0; i < 50; i++) rememberShownText('r', `Line ${i}.`);
    assert.equal(matchesShownTail('r', [{ t: 'Line 3.', g: '' }]), false);
    assert.equal(matchesShownTail('r', [{ t: 'Line 49.', g: '' }]), true);
    forgetShownText('r');
    assert.equal(matchesShownTail('r', [{ t: 'Line 49.', g: '' }]), false);
});

// ---- B1: a cycling return greeting is not swallowed ----
test('B1: a hub greeting that wrapped round is new, not an echo of an older copy of the same text', () => {
    forgetShownText();
    ['Back already. What is broken now?', 'What else?', 'Go on. And come back if you need me.'].forEach(t => rememberShownText('b', t));
    const f = fakeStory([{ text: 'Back already. What is broken now?\n', choices: knotChoices, canContinue: false }]);
    assert.equal(drainReopenEcho({ npcId: 'b', engine: f.engine, story: f.story }), null);
    assert.equal(f.pos(), 0, 'story put back');
});

test('B1: a chat closed by an exit_conversation reply never echoes, even if the lines match', () => {
    forgetShownText();
    rememberShownText('b', 'Back already.');
    rememberShownText('b', 'Go on, then.', ['speaker:npc', 'exit_conversation']);
    // the new visit prints a greeting equal to the last line shown before the farewell
    rememberShownText('c', 'Back already.', ['exit_conversation']);
    const f = fakeStory([{ text: 'Back already.\n', choices: knotChoices, canContinue: false }]);
    assert.equal(drainReopenEcho({ npcId: 'c', engine: f.engine, story: f.story }), null);
    // a later line clears the mark
    rememberShownText('c', 'Back already.');
    assert.ok(drainReopenEcho({ npcId: 'c', engine: f.engine, story: f.story }));
    // a tags-only exit step marks it too
    markClosedByExit('c');
    const g = fakeStory([{ text: 'Back already.\n', choices: knotChoices, canContinue: false }]);
    assert.equal(drainReopenEcho({ npcId: 'c', engine: g.engine, story: g.story }), null);
});

// ---- M1: the dry run touches no observer and no effectful external; the replay does, once ----
test('M1: the dry run has the observer detached and externals stubbed; the replay for real puts both back', () => {
    forgetShownText(); showReplay();
    const f = fakeStory(replayScript());
    const events = [];
    const observer = (n, v) => events.push(['observer', n]);
    f.story.variablesState = { variableChangedEvent: observer };
    f.engine.withEffectfulExternalsStubbed = fn => { events.push(['stub-on']); try { return fn(); } finally { events.push(['stub-off']); } };
    const origContinue = f.engine.continue.bind(f.engine);
    f.engine.continue = function () {
        events.push([this._mode || 'dry', f.story.variablesState.variableChangedEvent === null ? 'detached' : 'attached']);
        return origContinue();
    };
    const real = () => { events.push(['real-step', f.story.variablesState.variableChangedEvent === observer ? 'attached' : 'detached']); return origContinue(); };
    const r = drainReopenEcho({ npcId: 'receptionist', engine: f.engine, story: f.story, step: real });
    assert.ok(r && r.choices.length === 2);
    assert.deepEqual(events.filter(e => e[0] === 'dry').map(e => e[1]), ['detached', 'detached', 'detached']);
    assert.deepEqual(events.filter(e => e[0] === 'real-step').map(e => e[1]), ['attached', 'attached', 'attached']);
    assert.equal(events.findIndex(e => e[0] === 'stub-on') < events.findIndex(e => e[0] === 'real-step'), true);
    assert.equal(events.findIndex(e => e[0] === 'stub-off') < events.findIndex(e => e[0] === 'real-step'), true, 'externals live again for the replay');
    assert.equal(f.story.variablesState.variableChangedEvent, observer);
});

test('M1: not an echo leaves the observer attached and the story as it was', () => {
    forgetShownText(); showReplay();
    const script = replayScript(); script[2] = { text: 'Something new.\n', choices: knotChoices, canContinue: false };
    const f = fakeStory(script);
    const observer = () => {};
    f.story.variablesState = { variableChangedEvent: observer };
    assert.equal(drainReopenEcho({ npcId: 'receptionist', engine: f.engine, story: f.story }), null);
    assert.equal(f.story.variablesState.variableChangedEvent, observer);
    assert.equal(f.pos(), 0);
    // a variablesState with no own observer ends with none (restored with delete)
    const g = fakeStory(script); g.story.variablesState = {};
    drainReopenEcho({ npcId: 'receptionist', engine: g.engine, story: g.story });
    assert.equal(Object.prototype.hasOwnProperty.call(g.story.variablesState, 'variableChangedEvent'), false);
});

test('M1: a replay that prints something else once the externals are live is handed back as content', () => {
    forgetShownText(); showReplay();
    const f = fakeStory(replayScript());
    let n = 0;
    const real = () => ({ text: n++ === 1 ? 'A different line.' : 'x', choices: [], tags: [], canContinue: true });
    const r = drainReopenEcho({ npcId: 'receptionist', engine: f.engine, story: f.story, step: real });
    assert.equal(r.text, 'x', 'first real step differs from the dry run, so it is returned unblanked');
});

// ---- M2: tags must match what ran ----
test('M2: a drained line whose tags differ from the remembered ones is new content', () => {
    forgetShownText();
    rememberShownText('g', 'Okay.', ['speaker:gary']);
    const withTask = [{ text: 'Okay.\n', tags: ['complete_task:x'], choices: knotChoices, canContinue: false }];
    let f = fakeStory(withTask);
    assert.equal(drainReopenEcho({ npcId: 'g', engine: f.engine, story: f.story }), null, 'a tag that never ran with this line');
    forgetShownText();
    rememberShownText('g', 'Okay.', ['speaker:gary', 'complete_task:x']);
    f = fakeStory(withTask);
    assert.ok(drainReopenEcho({ npcId: 'g', engine: f.engine, story: f.story }), 'same tags (speaker ignored): echo');
    f = fakeStory([{ text: 'Okay.\n', choices: knotChoices, canContinue: false }]);
    assert.equal(drainReopenEcho({ npcId: 'g', engine: f.engine, story: f.story }), null, 'a remembered tag missing now: new');
});

test('M2: an action-tag step with no line is never an echo', () => {
    forgetShownText(); rememberShownText('g', 'Okay.');
    const f = fakeStory([{ text: 'Okay.\n' }, { text: '', tags: ['give_item:key'], choices: knotChoices, canContinue: false }]);
    assert.equal(drainReopenEcho({ npcId: 'g', engine: f.engine, story: f.story }), null);
    assert.equal(f.pos(), 0);
});

// ---- R3: m1 (choice marker), m2 (real ink, live branch after the echo), m3 (null step), n1 ----
test('m1: a player choice breaks the log, so an echo cannot span it', () => {
    forgetShownText();
    rememberShownText('h', 'What else?');
    rememberPlayerChoice('h');           // the goodbye was picked, reply never displayed
    const f = fakeStory([{ text: 'What else?\n', choices: knotChoices, canContinue: false }]);
    assert.equal(drainReopenEcho({ npcId: 'h', engine: f.engine, story: f.story }), null, 'greeting after a choice is new');
    // lines shown after the choice still echo
    rememberShownText('h', 'What else?');
    const g = fakeStory([{ text: 'What else?\n', choices: knotChoices, canContinue: false }]);
    assert.ok(drainReopenEcho({ npcId: 'h', engine: g.engine, story: g.story }));
    // a multi-line replay cannot reach back over the marker either
    forgetShownText();
    rememberShownText('h', 'One.'); rememberPlayerChoice('h'); rememberShownText('h', 'Two.');
    const k = fakeStory([{ text: 'One.\n' }, { text: 'Two.\n', choices: knotChoices, canContinue: false }]);
    assert.equal(drainReopenEcho({ npcId: 'h', engine: k.engine, story: k.story }), null);
    rememberPlayerChoice('nobody'); // no record: harmless
});

test('m1: handleChoice marks the choice and a goodbye closed in the reply delay marks closed-by-exit', () => {
    const msrc = readFileSync(join(here, '../../public/break_escape/js/minigames/person-chat/person-chat-minigame.js'), 'utf8');
    assert.match(msrc, /rememberPlayerChoice\(this\.npcId\);\s*\n\s*\/\/ Make choice in conversation/);
    assert.match(msrc, /reply && !keepPending && \(reply\.tags \|\| \[\]\)\.some\(isExitTag\)\) markClosedByExit\(this\.npcId\)/);
    // the flush runs on stubs: lift the method as person-chat-pending-reply.test.mjs does
    const m = msrc.match(/\n    _flushPendingReply\(([^)]*)\) \{\n([\s\S]*?)\n    \}\n/);
    const marks = [];
    const flush = new Function('markClosedByExit', 'isExitTag', 'splitReplyTags', 'partitionSlowTags', 'tagAction', 'processGameActionTags', 'window',
        `return function (${m[1]}) {\n${m[2]}\n};`)(n => marks.push(n), isExitTag, () => ({ state: [] }), () => ({ slow: [], fast: [] }), () => '', () => {}, {});
    const mk = tags => ({ npcId: 'bernie', _pendingReply: { tags }, autoAdvanceTimer: null, pendingContinueCallback: null, _tagOptions: () => ({}) });
    flush.call(mk(['speaker:bernie', 'exit_conversation']));
    assert.deepEqual(marks, ['bernie'], 'exit tag in the pending reply');
    flush.call(mk(['complete_task:x']));
    assert.equal(marks.length, 1, 'no exit tag: no mark');
    flush.call(mk(['end_conversation']), { keepPending: true });
    assert.equal(marks.length, 1, 'pagehide may be a bfcache stash: not marked');
});

test('m2: real ink, a live branch after the echoed line comes back unchanged, not as an empty close', async () => {
    const { createRequire } = await import('node:module');
    globalThis.window = { gameState: { globalVariables: {} } };
    globalThis.inkjs = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
    writeFileSync(join(dir, 'ink-engine.mjs'), readFileSync(join(here, '../../public/break_escape/js/systems/ink/ink-engine.js'), 'utf8'));
    const { default: InkEngine } = await import(pathToFileURL(join(dir, 'ink-engine.mjs')).href);
    const json = readFileSync(join(here, 'fixtures/reopen_echo_branch.json'), 'utf8').replace(/^﻿/, '');
    const build = live => {
        const e = new InkEngine('t'); e.loadStory(json);
        e.story.ChoosePathString('k2');
        if (live !== undefined) e.story.BindExternalFunction('ext_check', () => live);
        return e;
    };
    // Case A: the live external still returns 0: a true echo
    forgetShownText(); rememberShownText('r', 'Okay.');
    let e = build(0);
    let res = drainReopenEcho({ npcId: 'r', engine: e, story: e.story });
    assert.ok(res && res.choices.length === 1 && res.text === '', 'echo');
    // Case B: the live external flips: the branch is handed back with its own tags and end
    forgetShownText(); rememberShownText('r', 'Okay.');
    e = build(1);
    res = drainReopenEcho({ npcId: 'r', engine: e, story: e.story });
    assert.ok(res, 'a step comes back, never null');
    assert.deepEqual(res.tags.slice().sort(), ['exit_conversation', 'give_item:secret'], 'tags kept');
    assert.equal(res.choices.length, 0);
    assert.notEqual(res.hasEnded, false, 'hasEnded not forced false');
    assert.equal(res.canContinue, false);
});

test('m3: a null replay step gives a closed step, never null (no second continue)', () => {
    forgetShownText(); showReplay();
    const f = fakeStory(replayScript());
    const r = drainReopenEcho({ npcId: 'receptionist', engine: f.engine, story: f.story, step: () => null });
    assert.ok(r);
    assert.equal(r.hasEnded, true);
    assert.equal(r.text, '');
});

test('m2: the replay requires choices at the end and a tags difference hands the step back', () => {
    forgetShownText(); showReplay();
    const f = fakeStory(replayScript());
    let n = 0;
    const steps = [{ text: 'x', tags: [], canContinue: true }];
    const real = () => ({ text: '', tags: ['give_item:k'], choices: [], canContinue: false });
    // dry run text matches but the live step has no text where one was expected: handed back
    const r = drainReopenEcho({ npcId: 'receptionist', engine: f.engine, story: f.story, step: real });
    assert.deepEqual(r.tags, ['give_item:k']);
    void n; void steps;
});

test('n1: the dry run stops once it has more lines than the log holds', () => {
    forgetShownText(); rememberShownText('s', 'Only one.');
    let calls = 0;
    const script = Array.from({ length: 30 }, (_, i) => ({ text: `L${i}\n`, canContinue: true }));
    const engine = { continue: () => script[calls++] };
    const story = { state: { ToJson: () => '{}', LoadJson() {} } };
    assert.equal(drainReopenEcho({ npcId: 's', engine, story }), null);
    assert.ok(calls <= 3, `stopped early (${calls} steps)`);
});
