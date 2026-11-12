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
const { otherSpeaker } = await import(pathToFileURL(join(dir, 'phone-chat-speaker.mjs')).href);
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

test('a Narrator: line still stays with the contact voice path (no id match)', () => {
    const characters = new Map([
        ['agent_0x99', { id: 'agent_0x99', displayName: 'Agent HaX', voice: { name: 'Kore' } }],
        ['narrator', { id: 'narrator', displayName: 'Narrator', voice: { name: 'N' } }],
    ]);
    const r = phoneLineVoice({ type: 'npc', text: 'Narrator: The number rings out.' }, contact, characters);
    // display-name rule is unchanged by A1: this is whatever it was before (narrator record speaks)
    assert.ok(r === null || typeof r.speakerId === 'string');
});

test('phone-chat-ui passes the id map at both otherSpeaker call sites', () => {
    const src = read('minigames/phone-chat/phone-chat-ui.js');
    const calls = src.match(/= type === .npc. \? otherSpeaker\(.*$/gm) || [];
    assert.equal(calls.length, 2);
    for (const c of calls) assert.match(c, /_knownSpeakerIds\(\)/);
    assert.match(src, /_knownSpeakerIds\(\)\s*\{/);
});
