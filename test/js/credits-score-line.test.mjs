// The ending shows the score the server returns from the conclude request, as the last credit line.
// Run with: node test/js/credits-score-line.test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const read = (p) => readFileSync(join(js, p), 'utf8');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const cm = await import(dataUrl(read('music/conclude-mission.js')));

test('withScoreLine appends the rounded score after a blank line, without touching the input', () => {
    const credits = [{ text: 'MISSION COMPLETE', style: 'title' }];
    const out = cm.withScoreLine(credits, 88.6);
    assert.equal(credits.length, 1);
    assert.deepEqual(out.slice(0, 1), credits);
    assert.deepEqual(out[1], { text: '' });
    assert.deepEqual(out[2], { text: 'MISSION SCORE: 89 / 100', style: 'entry' });
});

test('withScoreLine leaves the credits alone with no usable score', () => {
    const credits = [{ text: 'A' }];
    for (const bad of [null, undefined, NaN, '89']) assert.equal(cm.withScoreLine(credits, bad), credits);
    assert.deepEqual(cm.withScoreLine(undefined, 50).length, 2);
});

test('postConclude returns the score from the server answer, null when absent', async () => {
    const reply = (body) => ({ fetch: async () => ({ ok: true, json: async () => body }), csrf: 'x' });
    assert.equal((await cm.postConclude(1, reply({ success: true, score: 89 }))).score, 89);
    assert.equal((await cm.postConclude(1, reply({ success: true }))).score, null);
    assert.equal((await cm.postConclude(1, reply({ alreadyConcluded: true, score: 0 }))).score, 0);
});

test('the music event passes the concluded score into the credits, and offline passes none', () => {
    const src = read('music/scenario-music-events.js');
    assert.match(src, /credits:\s+withScoreLine\(filteredLines, score\)/);
    assert.match(src, /openCredits\(undefined, result\.score\)/);
    assert.match(src, /openCredits\(offlineEndingOptions\)/);
});

test('scoreStatusNote gives the STATUS text, and nothing without a score', () => {
    assert.equal(cm.scoreStatusNote(88.6), 'COMPLETE: SCORE 89/100');
    assert.equal(cm.scoreStatusNote(null), undefined);
});

test('the visualiser keeps the end note in the STATUS row once the credits finish on a concluded mission', () => {
    const src = read('music/bond-visualiser.js');
    assert.match(src, /if \(typeof opts\.endNote === 'string' && opts\.endNote\) _endNote = opts\.endNote;/);
    assert.match(src, /if \(finished && _missionOver && _endNote\) \{[\s\S]*?status\.textContent = _endNote;/);
    assert.match(read('music/scenario-music-events.js'), /endNote:\s+scoreStatusNote\(score\)/);
});
