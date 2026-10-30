// Ink-driven plain email must not leak into the awareness episodes: a plain send is
// kind "plain" with no targetId, and the write stage's sent-record lookups skip it.
// Run with: bundle exec node --test test/js/social-mail-ink-isolation.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
console.log = () => {};
console.error = () => {};
globalThis.window = globalThis.window || {};

const { findSentRecord } = await import(pathToFileURL(join(js, 'minigames/episode-runner/episode-model.js')).href);
const { pickSentRecord } = await import(pathToFileURL(join(js, 'minigames/inbox-triage/triage-messages.js')).href);

const judged = { id: 'sent_judged', folder: 'sent', targetId: 'pierce', kind: undefined, tells: ['t1'], gameTime: 5 };
const plain = { id: 'sent_plain', folder: 'sent', targetId: null, kind: 'plain', tells: ['t1'], gameTime: 9 };
const mailState = { mailboxes: { guest: { messages: [judged, plain] } } };

test('findSentRecord ignores plain sends even with no target filter', () => {
    assert.equal(findSentRecord(mailState, null).id, 'sent_judged');
    assert.equal(findSentRecord({ mailboxes: { guest: { messages: [plain] } } }, null), null);
    assert.equal(findSentRecord(mailState, 'pierce').id, 'sent_judged');
});

test('findSentRecord still honours sentIds for judged sends', () => {
    assert.equal(findSentRecord(mailState, 'pierce', ['sent_judged']).id, 'sent_judged');
    assert.equal(findSentRecord(mailState, null, ['sent_plain']).id, 'sent_judged', 'a plain id in sentIds is not picked up');
});

test('the triage lookup skips plain records', () => {
    const only = { mailboxes: { guest: { messages: [plain] } } };
    const out = pickSentRecord(only, { targetId: null });
    assert.equal(out, null, 'a plain record is not offered as the replay, even with tells');
});
