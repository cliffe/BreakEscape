// A1: an id prefix on a phone line names the speaker (plan 2.10).
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const read = (p) => readFileSync(join(js, p), 'utf8');

const dir = mkdtempSync(join(tmpdir(), 'phone-ids-test-'));
writeFileSync(join(dir, 'phone-chat-speaker.mjs'), read('minigames/phone-chat/phone-chat-speaker.js'));
writeFileSync(join(dir, 'phone-call-voice.mjs'), read('minigames/phone-chat/phone-call-voice.js')
    .replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
const { otherSpeaker, displayPhoneLine } = await import(pathToFileURL(join(dir, 'phone-chat-speaker.mjs')).href);
const { phoneLineVoice } = await import(pathToFileURL(join(dir, 'phone-call-voice.mjs')).href);

const contact = { id: 'agent_0x99', displayName: 'Agent HaX', voice: { name: 'Kore' } };
const ids = new Map([
    ['agent_0x99', 'Agent HaX'], ['ghost', 'Ghost'], ['ghost_old', 'Ghost'],
    ['narrator', 'Narrator'], ['player', 'Player'], ['tomasz', 'Tomasz'],
]);
const names = Array.from(ids.values());

test('an exact id prefix names that character, with the display name', () => {
    assert.deepEqual(otherSpeaker('ghost_old: Keep moving.', contact, names, ids),
        { name: 'Ghost', id: 'ghost_old', text: 'Keep moving.' });
});

test('the id match ignores case, so plain Title Case ids count', () => {
    const r = otherSpeaker('Tomasz: Over here.', contact, [], ids);
    assert.equal(r.id, 'tomasz');
    assert.equal(r.name, 'Tomasz');
    assert.equal(r.text, 'Over here.');
});

test('never the contact own id, narrator or player', () => {
    assert.equal(otherSpeaker('agent_0x99: Hello.', contact, [], ids), null);
    assert.equal(otherSpeaker('Narrator: The line rings out.', contact, [], ids), null);
    assert.equal(otherSpeaker('player: Hello.', contact, [], ids), null);
});

test('display names are checked first, and with no id map the old behaviour holds', () => {
    assert.deepEqual(otherSpeaker('Ghost: Hi.', contact, names), { name: 'Ghost', text: 'Hi.' });
    assert.equal(otherSpeaker('ghost_old: Hi.', contact, names), null);
    assert.equal(otherSpeaker('Note: not an id', contact, names, ids), null);
});

test('an id prefix with no text after it is not a speaker', () => {
    assert.equal(otherSpeaker('ghost_old:   ', contact, names, ids), null);
});

test('phoneLineVoice voices an id-prefixed line under that record, not the first with the display name', () => {
    const characters = new Map([
        ['agent_0x99', { id: 'agent_0x99', displayName: 'Agent HaX', voice: { name: 'Kore' } }],
        ['ghost', { id: 'ghost', displayName: 'Ghost', voice: { name: 'A' } }],
        ['ghost_old', { id: 'ghost_old', displayName: 'Ghost', voice: { name: 'B' } }],
    ]);
    const r = phoneLineVoice({ type: 'npc', text: 'ghost_old: Keep moving.' }, contact, characters);
    assert.deepEqual(r, { speakerId: 'ghost_old', text: 'Keep moving.' });
    const byName = phoneLineVoice({ type: 'npc', text: 'Ghost: Keep moving.' }, contact, characters);
    assert.equal(byName.speakerId, 'ghost');
});

test('a Narrator: line goes to the narrator record by its display name, as before A1', () => {
    const characters = new Map([
        ['agent_0x99', { id: 'agent_0x99', displayName: 'Agent HaX', voice: { name: 'Kore' } }],
        ['narrator', { id: 'narrator', displayName: 'Narrator', voice: { name: 'N' } }],
    ]);
    const r = phoneLineVoice({ type: 'npc', text: 'Narrator: The number rings out.' }, contact, characters);
    assert.deepEqual(r, { speakerId: 'narrator', text: 'The number rings out.' });
});

// Plan 2.10 (A1 R1 M2): the server (TtsLineExtractor, id_names for a voiced call) agrees. The Rails
// twin is test/unit/break_escape/tts_line_resolver_test.rb "a voiced call's id prefix voices the named record".
test('same-name pair: an id prefix voices the named record even though it shares the host display name', () => {
    const characters = new Map([
        ['hax_post', { id: 'hax_post', displayName: 'Agent HaX', voice: { name: 'B' } }],
        ['agent_0x99', { id: 'agent_0x99', displayName: 'Agent HaX', voice: { name: 'Kore' } }],
    ]);
    assert.deepEqual(phoneLineVoice({ type: 'npc', text: 'hax_post: Listen up.' }, contact, characters),
        { speakerId: 'hax_post', text: 'Listen up.' });
    // The shared display name is the host's own: it stays with the host (the contact's prefix is dropped)
    assert.deepEqual(phoneLineVoice({ type: 'npc', text: 'Plain line.' }, contact, characters),
        { speakerId: 'agent_0x99', text: 'Plain line.' });
    // The host's id is never an id match
    assert.equal(phoneLineVoice({ type: 'npc', text: 'agent_0x99: Hello.' }, contact, characters).speakerId, 'agent_0x99');
});

test('an id that equals another record display name: the display name wins (client order; the validator warns)', () => {
    const clash = new Map([['ghost', 'Spectre'], ['y', 'Ghost']]);
    const r = otherSpeaker('ghost: Hi.', contact, Array.from(clash.values()), clash);
    assert.deepEqual(r, { name: 'Ghost', text: 'Hi.' });
});

test('phone-chat-ui passes the id map at both otherSpeaker call sites', () => {
    const src = read('minigames/phone-chat/phone-chat-ui.js');
    const calls = src.match(/= type === .npc. \? otherSpeaker\(.*$/gm) || [];
    assert.equal(calls.length, 2);
    for (const c of calls) assert.match(c, /_knownSpeakerIds\(\)/);
    assert.match(src, /_knownSpeakerIds\(\)\s*\{/);
});

// R2 m1: the contact's own display name is stripped before any id is read, in either record order.
// The Rails twin is tts_line_resolver_test.rb "a voiced call line prefixed with the host's own display name".
// _speakCallLine: displayPhoneLine (drops the contact's own prefix), then phoneLineVoice
const voicedAsMinigame = (text, host, characters) =>
    phoneLineVoice(displayPhoneLine('npc', text, host), host, characters);

test("the contact's own display name, id and spaced id stay with the contact even when another record's id matches", () => {
    const host = { id: 'ghost_phone', displayName: 'Ghost', voice: { name: 'Kore' } };
    const person = { id: 'ghost', displayName: 'Ghost Person', voice: { name: 'B' } };
    const other = { id: 'ghost_old', displayName: 'Ghost Old', voice: { name: 'C' } };
    for (const order of [[person, other, host], [host, other, person]]) {
        const characters = new Map(order.map(c => [c.id, c]));
        for (const text of ['Ghost: Hello there.', 'ghost phone: Hello there.', 'GHOST_PHONE: Hello there.']) {
            assert.deepEqual(voicedAsMinigame(text, host, characters),
                { speakerId: 'ghost_phone', text: 'Hello there.' }, text);
        }
        // "ghost" is the host's display name (case-insensitive) as well as an id: the host wins
        assert.equal(voicedAsMinigame('ghost: Same as its name.', host, characters).speakerId, 'ghost_phone');
        assert.equal(voicedAsMinigame('ghost_old: Named by id.', host, characters).speakerId, 'ghost_old');
    }
});
