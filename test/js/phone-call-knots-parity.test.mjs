// A2b: callStartKnots (client) and the extractor's call_start_knots agree on `ring` (plan 4.2).
// The `call` entries are A5's. Old forms stay as they were: Dev, an m09 HaX mapping, m10 Victoria,
// m02 Ghost video.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'knots-parity-test-'));
writeFileSync(join(dir, 'phone-chat-speaker.mjs'),
    readFileSync(join(here, '../../public/break_escape/js/minigames/phone-chat/phone-chat-speaker.js'), 'utf8'));
const { callStartKnots } = await import(pathToFileURL(join(dir, 'phone-chat-speaker.mjs')).href);
const knots = (npc) => [...callStartKnots(npc)].sort();

test('a ring mapping written without voiced is a call knot, true or object form', () => {
    assert.deepEqual(knots({ eventMappings: [{ conversationMode: 'phone-chat', targetKnot: 'ring_call', ring: true }] }), ['ring_call']);
    assert.deepEqual(knots({ eventMappings: [{ conversationMode: 'phone-chat', knot: 'k2', ring: { untilAnswered: true } }] }), ['k2']);
});

test('ring false, null or absent is not a call; a person-chat mapping with ring is not a phone call', () => {
    assert.deepEqual(knots({ eventMappings: [{ conversationMode: 'phone-chat', targetKnot: 'a', ring: false }] }), []);
    assert.deepEqual(knots({ eventMappings: [{ conversationMode: 'phone-chat', targetKnot: 'a', ring: null }] }), []);
    assert.deepEqual(knots({ eventMappings: [{ conversationMode: 'phone-chat', targetKnot: 'a' }] }), []);
    assert.deepEqual(knots({ eventMappings: [{ conversationMode: 'person-chat', targetKnot: 'a', ring: true }] }), []);
});

test('a timedConversation with ring is a call knot unless it is a video call', () => {
    assert.deepEqual(knots({ timedConversation: { targetKnot: 'opening_call', ring: true } }), ['opening_call']);
    assert.deepEqual(knots({ timedConversation: { targetKnot: 'v', ring: true, videoCall: true } }), []);
    assert.deepEqual(knots({ timedConversation: { targetKnot: 'v', ring: true, conversationMode: 'video-call' } }), []);
});

test('old forms are unchanged', () => {
    assert.deepEqual(knots({ voiced: true, currentKnot: 'start' }), ['start']);
    assert.deepEqual(knots({ eventMappings: [{ conversationMode: 'phone-chat', voiced: true, targetKnot: 'gallery_call' }] }), ['gallery_call']);
    assert.deepEqual(knots({ timedConversation: { targetKnot: 'victoria_line', voiced: true } }), ['victoria_line']);
    assert.deepEqual(knots({ timedConversation: { targetKnot: 'on_recovery', voiced: true, videoCall: true } }), []);
    assert.deepEqual(knots({ eventMappings: [{ conversationMode: 'video-call', targetKnot: 'on_console' }] }), []);
});
