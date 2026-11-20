import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// The game's files are ES modules in a CommonJS package, so load the source as a data URL.
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js/utils/note-markdown.js'), 'utf8');
const { renderNoteMarkdown } = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));

test('plain notes keep their text, line breaks and spacing', () => {
    const html = renderNoteMarkdown('FIELD NOTE 2\n\n  1. Encode text\nfn12_mojibake  x');
    assert.equal(html, '<div class="note-md-text">FIELD NOTE 2\n\n  1. Encode text\nfn12_mojibake  x</div>');
});

test('HTML in a note is escaped, inside and outside markdown', () => {
    const html = renderNoteMarkdown('<img src=x onerror=alert(1)> **<b>** `<i>`\n| <a> |\n|---|\n| <s> |');
    assert.ok(!/<(img|b|i|a|s)[ >]/.test(html), html);
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

test('bold, italic, code and headings', () => {
    const html = renderNoteMarkdown('# Title\n\n**bold** and *it* and `**raw**`\n5 * 3 * 2');
    assert.match(html, /<div class="note-md-h1">Title<\/div>/);
    assert.match(html, /<strong>bold<\/strong> and <em>it<\/em> and <code>\*\*raw\*\*<\/code>/);
    assert.match(html, /5 \* 3 \* 2/);
    assert.ok(!html.includes('<div class="note-md-text">\n'), 'blank line after a heading is dropped');
});

test('stars that are not emphasis stay as typed', () => {
    assert.match(renderNoteMarkdown('*** CRITICAL ***'), /\*\*\* CRITICAL \*\*\*/);
    assert.match(renderNoteMarkdown('42 2A *    |  74 4A J'), /42 2A \*/);
});

test('bullets get a bullet; an italic line is not a bullet', () => {
    assert.match(renderNoteMarkdown('- one\n  * two'), /• one\n  • two/);
    assert.match(renderNoteMarkdown('*gasping* Nurse'), /<em>gasping<\/em> Nurse/);
    assert.match(renderNoteMarkdown('Reach me there.\n\n- H.'), /\n- H\.<\/div>$/);
});

test('a table needs a rule row; cells escape pipes, stars and backticks', () => {
    const html = renderNoteMarkdown('Before\n\n| Dec | Char |\n|---:|:---:|\n| 124 | \\| |\n| 96 | \\` |\n| 42 | \\* |\n\nAfter');
    assert.match(html, /^<div class="note-md-text">Before<\/div><table class="note-md-table">/);
    assert.match(html, /<th style="text-align:right">Dec<\/th><th style="text-align:center">Char<\/th>/);
    assert.match(html, /<td style="text-align:right">124<\/td><td style="text-align:center">\|<\/td>/);
    assert.match(html, /<td[^>]*>`<\/td>/);
    assert.match(html, /<td[^>]*>\*<\/td>/);
    assert.match(html, /<\/table><div class="note-md-text">After<\/div>$/);
    assert.ok(!renderNoteMarkdown('| a | b |\n| c | d |').includes('<table'), 'no rule row, no table');
});

test('fenced code is kept exactly', () => {
    const html = renderNoteMarkdown("```\nprintf '%s' **x** | xxd\n```");
    assert.equal(html, "<pre class=\"note-md-code\">printf '%s' **x** | xxd</pre>");
});
