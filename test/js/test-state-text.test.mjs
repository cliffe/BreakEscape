// Text in a minigame's test-bridge state (utils/test-state-text.js, base-minigame.js,
// notes-minigame.js). lab_physical_pentest playtests, finding E7: getState().text and
// noteContent both stopped at 2000 characters with no mark, so the rules of engagement
// board's last three paragraphs read as missing.
// Run with: node test/js/test-state-text.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const { cappedText, TEXT_LIMIT, NOTE_LIMIT } = await import(pathToFileURL(join(js, 'utils/test-state-text.js')));

test('a short text is returned whole with no truncation mark', () => {
    assert.deepEqual(cappedText('text', 'Rules of Engagement'), { text: 'Rules of Engagement' });
    assert.deepEqual(cappedText('text', null), { text: '' });
});

test('a long text is cut at the limit and says so, with the full length', () => {
    const long = 'x'.repeat(TEXT_LIMIT + 500);
    const r = cappedText('text', long);
    assert.equal(r.text.length, TEXT_LIMIT);
    assert.equal(r.textTruncated, true);
    assert.equal(r.textLength, TEXT_LIMIT + 500);
});

test('a note keeps far more than the overlay text: a 3,800 character board comes back whole', () => {
    assert.ok(NOTE_LIMIT >= 20000);
    const board = Array.from({ length: 9 }, (_, i) => `PARAGRAPH ${i + 1}: ` + 'words '.repeat(68)).join('\n\n');
    assert.ok(board.length > 3500);
    const r = cappedText('noteContent', board, NOTE_LIMIT);
    assert.equal(r.noteContent, board);
    assert.ok(r.noteContent.includes('PARAGRAPH 9:'));
    assert.ok(!('noteContentTruncated' in r));
});

test('the notes overlay uses the note limit, and the base overlay marks its cut', () => {
    const notes = readFileSync(join(js, 'minigames/notes/notes-minigame.js'), 'utf8');
    assert.match(notes, /\.\.\.cappedText\('noteContent', this\.noteContent \|\| '', NOTE_LIMIT\),/);
    const base = readFileSync(join(js, 'minigames/framework/base-minigame.js'), 'utf8');
    assert.match(base, /text: fullText\.slice\(0, 2000\),\s*\.\.\.\(fullText\.length > 2000 \? \{ textTruncated: true, textLength: fullText\.length \} : \{\}\),/);
    assert.equal(TEXT_LIMIT, 2000, 'the base overlay writes the same limit out by hand');
});
