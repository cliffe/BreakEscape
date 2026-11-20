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
    assert.match(base, /: \{ text: headCut\(fullText, 2000\),\s*\.\.\.\(fullText\.length > 2000 \? \{ textTruncated: true, textLength: fullText\.length \} : \{\}\) \}\),/);
    assert.equal(TEXT_LIMIT, 2000, 'the base overlay writes the same limit out by hand');
});

// Chat scenes keep the TAIL (newest lines are last), with a marker.
const { TEXT_TAIL_MARK } = await import(pathToFileURL(join(js, 'utils/test-state-text.js')));

test('keep tail: the newest line survives, the text opens with the marker, size stays at the limit', () => {
    const thread = Array.from({ length: 120 }, (_, i) => `LINE ${i + 1}: message body here`).join('\n');
    assert.ok(thread.length > TEXT_LIMIT);
    const r = cappedText('text', thread, TEXT_LIMIT, 'tail');
    assert.equal(r.text.length, TEXT_LIMIT);
    assert.ok(r.text.startsWith(TEXT_TAIL_MARK));
    assert.ok(r.text.endsWith('LINE 120: message body here'));
    assert.ok(!r.text.includes('LINE 1:'));
    assert.equal(r.textTruncated, true);
    assert.equal(r.textLength, thread.length);
    assert.equal(r.textKeeps, 'tail');
});

test('keep tail on a short text is unchanged, and the default still keeps the head', () => {
    assert.deepEqual(cappedText('text', 'short', TEXT_LIMIT, 'tail'), { text: 'short' });
    const r = cappedText('text', 'a'.repeat(3000) + 'END');
    assert.ok(!r.text.endsWith('END'));
    assert.ok(!('textKeeps' in r));
});

test('only the phone and person chat scenes keep the tail, and the base overlay does it for them', () => {
    const base = readFileSync(join(js, 'minigames/framework/base-minigame.js'), 'utf8');
    assert.match(base, /this\.constructor\.keepsTextTail/);
    assert.match(base, /const TEXT_TAIL_MARK = '\[\.\.\. earlier text cut, newest lines below \.\.\.\]\\n';/);
    for (const f of ['phone-chat/phone-chat-minigame.js', 'person-chat/person-chat-minigame.js']) {
        assert.match(readFileSync(join(js, 'minigames', f), 'utf8'), /static keepsTextTail = true;/);
    }
    const marker = readFileSync(join(js, 'utils/test-state-text.js'), 'utf8').match(/TEXT_TAIL_MARK = ('[^']*')/)[1];
    assert.ok(base.includes(marker), 'base-minigame writes the same marker out by hand');
});

test('behaviour: a MinigameScene subclass with keepsTextTail returns the tail in getTestState', async () => {
    globalThis.window = globalThis.window || {};
    let MinigameScene;
    try { ({ MinigameScene } = await import(pathToFileURL(join(js, 'minigames/framework/base-minigame.js')))); }
    catch (e) { assert.fail('base-minigame.js failed to import: ' + e.message); }
    const text = Array.from({ length: 150 }, (_, i) => `MSG ${i + 1} hello there`).join('\n');
    const mk = (tail, body = text) => {
        const C = class extends MinigameScene {};
        if (tail) C.keepsTextTail = true;
        const o = Object.create(C.prototype);
        o.container = { innerText: body };
        o.params = {}; o.gameState = { isActive: true };
        o.getTestControlElements = () => []; o.getTestFieldElements = () => [];
        return o.getTestState();
    };
    const tail = mk(true), head = mk(false);
    assert.ok(tail.text.endsWith('MSG 150 hello there'));
    assert.equal(tail.textKeeps, 'tail');
    assert.ok(head.text.startsWith('MSG 1 '));
    assert.ok(!('textKeeps' in head));

    // Emoji at the cut, through the real scene (the cut lands mid-emoji on both ends).
    const emoji = 'a' + '\u{1F600}'.repeat(2000);
    const eTail = mk(true, emoji).text, eHead = mk(false, emoji).text;
    assert.ok(!/^[\uDC00-\uDFFF]/.test(eTail.slice(TEXT_TAIL_MARK.length)), 'tail starts on a whole emoji');
    assert.ok(eTail.length <= TEXT_LIMIT);
    assert.ok(!/[\uD800-\uDBFF]$/.test(eHead), 'head ends on a whole emoji');
    assert.ok(eHead.length <= TEXT_LIMIT);
});

test('a cut never splits an emoji: no lone surrogate at either end', () => {
    const tail = cappedText('text', 'a' + '\u{1F600}'.repeat(2000), TEXT_LIMIT, 'tail').text;
    assert.ok(!/^[\uDC00-\uDFFF]/.test(tail.slice(TEXT_TAIL_MARK.length)));
    const head = cappedText('text', 'a' + '\u{1F600}'.repeat(2000)).text;
    assert.ok(!/[\uD800-\uDBFF]$/.test(head));
    const base = readFileSync(join(js, 'minigames/framework/base-minigame.js'), 'utf8');
    assert.match(base, /tailCut\(fullText, 2000 - TEXT_TAIL_MARK\.length\)/);
});
