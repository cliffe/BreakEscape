// A phone contact with `voiced: true` (no event mapping): a call the player starts, such as the
// lab's desk-phone pretext call, voices the contact's own knot and what it reaches (F17, F20).
// Run with: node --test test/js/phone-voiced-contact.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'voiced-contact-test-'));
writeFileSync(join(dir, 'phone-chat-speaker.mjs'),
    readFileSync(join(here, '../../public/break_escape/js/minigames/phone-chat/phone-chat-speaker.js'), 'utf8'));
const { callStartKnots } = await import(pathToFileURL(join(dir, 'phone-chat-speaker.mjs')).href);

test('a voiced contact starts its call on its home knot', () => {
    assert.deepEqual([...callStartKnots({ voiced: true, currentKnot: 'start' })], ['start']);
    assert.deepEqual([...callStartKnots({ voiced: true, currentKnot: 'moved', homeKnot: 'ring' })], ['ring']);
    assert.deepEqual([...callStartKnots({ voiced: true })], ['start']);
});

test('a contact that is not voiced has no start knots unless a mapping says so', () => {
    assert.equal(callStartKnots({ currentKnot: 'start' }).size, 0);
    const mapped = { eventMappings: [{ conversationMode: 'phone-chat', voiced: true, targetKnot: 'call' }] };
    assert.deepEqual([...callStartKnots(mapped)], ['call']);
});
