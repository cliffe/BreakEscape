/**
 * A small markdown subset for notebook pages. Returns HTML; every character of
 * the source is escaped first, so scenario text can never inject markup.
 *
 *   # Heading / ## Heading / ### Heading
 *   **bold**, *italic*, `code`
 *   - item / * item          (shown with a bullet; two or more lines in a row)
 *   | a | b |                (a table: header row, then a |---|---| row,
 *   |---|--:|                 then body rows; colons set alignment)
 *   ```                      (fenced block, kept exactly as typed)
 *   \| \* \` \\ \#           (a literal character)
 *
 * Everything else stays as typed: the page keeps white-space: pre-wrap, so
 * plain notes, aligned columns and blank lines look the same as before.
 * Single underscores are never emphasis (file names like fn12_mojibake).
 */

const ESCAPABLE = '\\|*`#_-';

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Backslash escapes and code spans are swapped for private-use placeholders
// before emphasis runs, then put back, so nothing inside them is formatted.
function renderInline(text) {
    const held = [];
    const hold = (html) => `${held.push(html) - 1}`;

    let out = text.replace(/\\(.)/g, (m, ch) => (ESCAPABLE.includes(ch) ? hold(escapeHtml(ch)) : m));
    out = out.replace(/`([^`]+)`/g, (m, code) => hold(`<code>${escapeHtml(code)}</code>`));
    out = escapeHtml(out);
    out = out.replace(/\*\*(?![\s*])(.+?)(?<![\s*])\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[^\w*])\*(?![\s*])([^*]+?)(?<![\s*])\*(?![\w*])/g, '$1<em>$2</em>');
    return out.replace(/(\d+)/g, (m, i) => held[Number(i)]);
}

// Split a table row on unescaped pipes, dropping the outer ones.
function splitRow(line) {
    const cells = [];
    let cell = '';
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '\\' && i + 1 < line.length) {
            cell += ch + line[i + 1];
            i++;
        } else if (ch === '|') {
            cells.push(cell);
            cell = '';
        } else {
            cell += ch;
        }
    }
    cells.push(cell);
    const trimmed = line.trim();
    if (trimmed.startsWith('|')) cells.shift();
    if (trimmed.endsWith('|') && !trimmed.endsWith('\\|')) cells.pop();
    return cells.map(c => c.trim());
}

const BULLET = /^(\s*)[-*]\s+(.*)$/;
const TABLE_ROW = /^\s*\|.*\|\s*$/;
const TABLE_RULE = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;

function renderTable(header, rule, rows) {
    const aligns = splitRow(rule).map(c => {
        const left = c.startsWith(':');
        const right = c.endsWith(':');
        if (left && right) return 'center';
        if (right) return 'right';
        if (left) return 'left';
        return '';
    });
    const cell = (tag, text, i) => {
        const align = aligns[i] ? ` style="text-align:${aligns[i]}"` : '';
        return `<${tag}${align}>${renderInline(text)}</${tag}>`;
    };
    const head = splitRow(header).map((c, i) => cell('th', c, i)).join('');
    const body = rows
        .map(r => `<tr>${splitRow(r).map((c, i) => cell('td', c, i)).join('')}</tr>`)
        .join('');
    return `<table class="note-md-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

export function renderNoteMarkdown(text) {
    if (typeof text !== 'string' || text === '') return '';
    const lines = text.split('\n');
    // Each part is a run of text lines (joined with newlines, shown pre-wrap)
    // or a block element (table, heading, code) that makes its own line break.
    const parts = [];
    let run = [];
    const flush = () => {
        if (run.length) parts.push(run.join('\n'));
        run = [];
    };
    const block = (html) => {
        // A blank line next to a block would show as an extra gap: the block's
        // margin already spaces it.
        if (run.length && run[run.length - 1].trim() === '') run.pop();
        flush();
        parts.push(html);
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (/^\s*```/.test(line)) {
            const code = [];
            let j = i + 1;
            while (j < lines.length && !/^\s*```/.test(lines[j])) code.push(lines[j++]);
            block(`<pre class="note-md-code">${escapeHtml(code.join('\n'))}</pre>`);
            i = j;
            if (lines[i + 1]?.trim() === '') i++;
            continue;
        }

        if (TABLE_ROW.test(line) && i + 1 < lines.length && TABLE_RULE.test(lines[i + 1])) {
            const rows = [];
            let j = i + 2;
            while (j < lines.length && TABLE_ROW.test(lines[j])) rows.push(lines[j++]);
            block(renderTable(line, lines[i + 1], rows));
            i = j - 1;
            if (lines[i + 1]?.trim() === '') i++;
            continue;
        }

        const heading = line.match(/^(#{1,3})\s+(.+?)\s*#*\s*$/);
        if (heading) {
            block(`<div class="note-md-h${heading[1].length}">${renderInline(heading[2])}</div>`);
            if (lines[i + 1]?.trim() === '') i++;
            continue;
        }

        // A bullet needs a neighbouring bullet, so a lone sign-off ("- H.") stays as typed.
        const bullet = line.match(BULLET);
        if (bullet && (BULLET.test(lines[i - 1] ?? '') || BULLET.test(lines[i + 1] ?? ''))) {
            run.push(`${bullet[1]}• ${renderInline(bullet[2])}`);
            continue;
        }

        run.push(renderInline(line));
    }
    flush();

    return parts.map(p => (p.startsWith('<table') || p.startsWith('<div class="note-md-h') || p.startsWith('<pre')
        ? p
        : `<div class="note-md-text">${p}</div>`)).join('');
}
