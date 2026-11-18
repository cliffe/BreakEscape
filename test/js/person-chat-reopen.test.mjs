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
    rememberShownText, forgetShownText, linesAlreadyShown, drainReopenEcho } =
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
const showReplay = () => replayScript().forEach(l => rememberShownText('receptionist', l.text));

test('echo: a replay of only lines already shown is drained to its choices, text and tags blanked', () => {
    forgetShownText(); showReplay();
    const { story, engine } = fakeStory(replayScript());
    const r = drainReopenEcho({ npcId: 'receptionist', engine, story });
    assert.equal(r.text, '');
    assert.deepEqual(r.tags, []);
    assert.equal(r.hasEnded, false);
    assert.equal(r.choices.length, 2);
    assert.equal(engine.calls, 3);
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

test('echo: shown lines ignore whitespace, accumulate and keep the newest 40', () => {
    forgetShownText();
    rememberShownText('r', 'Line one.');
    rememberShownText('r', '  Line   two. ');
    assert.equal(linesAlreadyShown('r', 'Line two.\nLine one.'), true);
    assert.equal(linesAlreadyShown('r', 'Line three.'), false);
    assert.equal(linesAlreadyShown('r', ''), false);
    for (let i = 0; i < 50; i++) rememberShownText('r', `Line ${i}.`);
    assert.equal(linesAlreadyShown('r', 'Line 3.'), false);
    assert.equal(linesAlreadyShown('r', 'Line 49.'), true);
    forgetShownText('r');
    assert.equal(linesAlreadyShown('r', 'Line 49.'), false);
});
