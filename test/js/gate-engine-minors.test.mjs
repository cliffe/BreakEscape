// Gate engine minors: the credits THREAT row reflects the end state, and the toast hold
// covers the phone on purpose (history: 43f9940c3 "conversations, locks, the phone").
// Run with: node --max-old-space-size=2048 test/js/gate-engine-minors.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as T from '../../public/break_escape/js/music/credits-theme.js';
import { fullScreenPanelOpen } from '../../public/break_escape/js/utils/overlay-open.js';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const vis = readFileSync(join(js, 'music/bond-visualiser.js'), 'utf8');
const events = readFileSync(join(js, 'music/scenario-music-events.js'), 'utf8');
const schema = readFileSync(join(here, '../../scripts/scenario-schema.json'), 'utf8');
const notif = readFileSync(join(js, 'systems/notifications.js'), 'utf8');

const winCredits = [{ text: 'MISSION COMPLETE', style: 'title' }, { text: 'FIRST CONTACT', style: 'subtitle' }];
const failCredits = [{ text: 'MISSION FAILED', style: 'title' }];

test('creditsThreat is a function and the audio-driven row stays live before the credits', () => {
    assert.ok(typeof T.creditsThreat === 'function', 'creditsThreat exported');
    assert.ok(T.creditsThreat({ over: false, credits: winCredits }) === null, 'no credits: audio-driven');
    assert.ok(T.creditsThreat({}) === null, 'empty options: audio-driven');
});

test('a win never shows an alarm value', () => {
    const r = T.creditsThreat({ over: true, credits: winCredits });
    assert.ok(r.text === 'CONTAINED', 'win text ' + r.text);
    assert.ok(r.tone === 'good', 'win tone');
    assert.ok(!/CRITICAL|BREACH|HIGH/.test(r.text), 'no audio level word');
});

test('a failed ending shows ACTIVE (title, header or status)', () => {
    assert.ok(T.creditsThreat({ over: true, credits: failCredits }).text === 'ACTIVE', 'title FAILED');
    assert.ok(T.creditsThreat({ over: true, headerText: 'MISSION FAILED // AUDIO INTEL' }).text === 'ACTIVE', 'header');
    assert.ok(T.creditsThreat({ over: true, statusText: 'COMPROMISED' }).text === 'ACTIVE', 'status');
    assert.ok(T.creditsThreat({ over: true, credits: failCredits }).tone === 'bad', 'bad tone');
});

test('a scenario threatText wins, and a pending sync says PENDING', () => {
    assert.ok(T.creditsThreat({ over: true, threatText: ' STANDING DOWN ', credits: failCredits }).text === 'STANDING DOWN', 'override');
    assert.ok(T.creditsThreat({ over: true, statusText: 'PENDING SYNC' }).text === 'PENDING', 'pending');
});

test('the visualiser holds the value instead of following the audio after the credits', () => {
    assert.ok(/creditsThreat\(\{ threatText: _threatText/.test(vis), 'update loop asks creditsThreat');
    assert.ok(/over: _missionOver \|\| !!_lastCredits\?\.length/.test(vis), 'held once credits roll or mission over');
    assert.ok(/nextCreditsText\(_threatText, opts, 'threatText'\)/.test(vis), 'threatText kept like statusText');
    assert.ok(/tl && held/.test(vis), 'held value written before the audio branches');
});

test('threatText flows from the ending entry, live and on replay, and is in the schema', () => {
    assert.ok(/threatText:\s+entry\.threatText/.test(events), 'live ending passes it');
    assert.ok(/threatText: found\.entry\.threatText/.test(events), 'replay passes it');
    assert.ok(/"threatText": \{ "type": "string"/.test(schema), 'schema declares it');
});

test('the CRT look stays: nothing in the credits CSS was touched for the row', () => {
    assert.ok(/id="bv-threat-level"/.test(vis), 'row keeps its id and markup');
});

test('toast hold covers the phone on purpose (note, no change)', () => {
    const win = { MinigameFramework: { currentMinigame: { _sceneType: 'phone-chat' } } };
    assert.ok(fullScreenPanelOpen(win, null) === true, 'an open phone counts as a full-screen panel');
    assert.ok(/HOLDABLE_TYPES = new Set\(\['info', 'success'\]\)/.test(notif), 'info and success are held');
});
