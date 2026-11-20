// scripts/validate_npc_needs.rb check_exchanges: exchange lines draw as world bubbles, so each
// holds at most CHAT_LINE_MAX (40) characters of spoken text, the same limit as pool lines.
// The "Name:" prefix does not count. A fixture story is written under the system temp dir and
// reached from the repo root by a relative path (the validator joins storyPath to REPO_ROOT).
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const skip = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

function issuesFor(lines) {
    const dir = mkdtempSync(join(tmpdir(), 'exch-len-'));
    try {
        const story = join(dir, 'story.json');
        writeFileSync(story, JSON.stringify({ inkVersion: 21, root: [['done'], 'done', { knot_a: lines.map(l => `^${l}`) }] }));
        const voice = { name: 'x' };
        const npc = (id, name, extra = {}) => ({ id, displayName: name, npcType: 'person', position: { x: 1, y: 1 }, voice, ...extra });
        const json = {
            startRoom: 'r', globalVariables: { heard_knot_a: false },
            rooms: { r: { type: 'room_office', connections: {}, objects: [], npcs: [
                npc('hodan', 'Hodan', { storyPath: relative(root, story), exchanges: [{ with: 'ernesto', knot: 'knot_a' }] }),
                npc('ernesto', 'Ernesto')
            ] } }
        };
        const script = `$stdout = File.open(File::NULL, 'w'); require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
          $stdout = STDOUT; json = JSON.parse(STDIN.read); puts JSON.generate(ValidateNpcNeeds.check(json))`;
        const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(json), encoding: 'utf8', env });
        assert.equal(r.status, 0, r.stderr);
        return JSON.parse(r.stdout.trim().split('\n').pop());
    } finally { rmSync(dir, { recursive: true, force: true }); }
}
const long = list => list.filter(s => s.includes('a bubble holds at most 40'));

test('exchange line over 40 characters is an error, counted without the Name: prefix', { skip }, () => {
    const text = 'Eleven lab runs tonight. Every result in an envelope.';
    const out = long(issuesFor([`Ernesto: ${text}`, 'Hodan: Fine.']));
    assert.equal(out.length, 1, out.join('\n'));
    assert.match(out[0], /❌ ERROR/);
    assert.match(out[0], new RegExp(`is ${text.length} characters`));
});

test('exchange lines of exactly 40 characters and the paper opener pass', { skip }, () => {
    const forty = 'x'.repeat(40);
    assert.equal(long(issuesFor([`Ernesto: ${forty}`, 'Hodan: Eleven lab runs tonight. All on paper.'])).length, 0);
    assert.equal(long(issuesFor([`Ernesto: ${forty}x`])).length, 1);
});

// check_exchanges topic type-check (review R2 m5): a topic present on an exchange pins it to one
// object's chatter pool, so it must be a non-empty string. A null or empty topic would make the
// engine skip the entry, so it is an error, not a warning.
function topicIssues(topic) {
    const dir = mkdtempSync(join(tmpdir(), 'exch-topic-'));
    try {
        const story = join(dir, 'story.json');
        writeFileSync(story, JSON.stringify({ inkVersion: 21, root: [['done'], 'done', { knot_a: ['^Ernesto: Hi.', '^Hodan: Hi.'] }] }));
        const voice = { name: 'x' };
        const npc = (id, name, extra = {}) => ({ id, displayName: name, npcType: 'person', position: { x: 1, y: 1 }, voice, ...extra });
        const ex = { with: 'ernesto', knot: 'knot_a' };
        if (topic !== undefined) ex.topic = topic;
        const json = {
            startRoom: 'r', globalVariables: { heard_knot_a: false },
            rooms: { r: { type: 'room_office', connections: {}, objects: [], npcs: [
                npc('hodan', 'Hodan', { storyPath: relative(root, story), exchanges: [ex] }),
                npc('ernesto', 'Ernesto')
            ] } }
        };
        const script = `$stdout = File.open(File::NULL, 'w'); require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
          $stdout = STDOUT; json = JSON.parse(STDIN.read); puts JSON.generate(ValidateNpcNeeds.check(json))`;
        const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(json), encoding: 'utf8', env });
        assert.equal(r.status, 0, r.stderr);
        return JSON.parse(r.stdout.trim().split('\n').pop());
    } finally { rmSync(dir, { recursive: true, force: true }); }
}
const topicErr = list => list.filter(s => s.includes('topic must be a non-empty string'));

test('an exchange topic that is not a non-empty string is an error; a string topic or no topic passes', { skip }, () => {
    assert.equal(topicErr(topicIssues(42)).length, 1, 'a number topic');
    assert.equal(topicErr(topicIssues('')).length, 1, 'an empty topic');
    assert.equal(topicErr(topicIssues('   ')).length, 1, 'a blank topic');
    assert.equal(topicErr(topicIssues('coffee')).length, 0, 'a non-empty string topic passes the type-check');
    assert.equal(topicErr(topicIssues(undefined)).length, 0, 'no topic key at all');
});
