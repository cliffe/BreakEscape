import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, summarise } from '../../tools/overlap_survey.mjs';

test('overlap survey: arguments', () => {
    assert.match(parseArgs([]).error, /--port/);
    assert.match(parseArgs(['--port', '3468']).error, /at least one/);
    assert.match(parseArgs(['--port', '3468', '--game', 'x']).error, /name=gid/);
    const o = parseArgs(['--port', '3468', '--game', 'm01=12', '--sample', 'sims=13', '--sample-seconds', '30']);
    assert.deepEqual([o.port, o.games, o.samples, o.sampleSeconds], [3468, ['m01=12'], ['sims=13'], 30]);
    assert.match(parseArgs(['--port', '1', '--nope']).error, /unknown/);
});

test('overlap survey: summary lists pairs, unreadable sprites, hostiles and the routine sample', () => {
    const s = summarise({ name: 'm', gid: '1', totals: { rooms: 2, things: 9, pairs: 1 }, byTypePair: { 'npc+object': 1 },
        rooms: { a: { things: 5, pairs: [{ a: 'x', b: 'y', pixels: 12 }] }, b: { things: 4, pairs: [] } },
        unreadable: ['a/z'], hostileRooms: [{ room: 'b', npcs: ['guard'] }], routine: { samples: 3, samplesWithAnOverlap: 1, pairSamples: { 'g|c': 1 } } });
    assert.match(s, /2 rooms, 9 things, 1 overlapping pairs/);
    assert.match(s, /npc\+object: 1/);
    assert.match(s, /xxy\(12px\)/);
    assert.match(s, /alpha unreadable: a\/z/);
    assert.match(s, /hostile at load: b\[guard\]/);
    assert.match(s, /1\/3 samples/);
});
