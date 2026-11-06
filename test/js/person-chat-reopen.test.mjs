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
const { rememberNpcLine, getRememberedNpcLine, forgetNpcLine, reopenContextLine } =
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
