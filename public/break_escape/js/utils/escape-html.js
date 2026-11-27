// The one HTML escape for author, scenario and server text: & < > " ' become entities,
// so the result is safe in element content and in a quoted attribute. null and undefined
// become an empty string; any other value goes through String() (so 0 stays "0").
const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);
}

// Escaped text whose words never break across lines: each run of non-space characters
// goes in a <span class="keep-whole"> (white-space: nowrap, main.css), so a password
// such as "Cedar-Omar-58" on a sticky note wraps only at its spaces, never at a hyphen.
// With `joinPunctuation`, a token that is only punctuation ("/", ":", "-") stays with the word
// before it (a no-break space joins them), so it never lands alone at the start of a line.
export function escapeHtmlKeepWords(value, { joinPunctuation = false } = {}) {
    const parts = String(value ?? '').split(/(\s+)/);
    if (!joinPunctuation) {
        return parts.map(part => (
            !part || /^\s+$/.test(part) ? part : `<span class="keep-whole">${escapeHtml(part)}</span>`
        )).join('');
    }
    // Words first, so a punctuation token can be merged into the span before it
    const out = [];
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;
        if (/^\s+$/.test(part)) { out.push({ space: part }); continue; }
        const prevSpace = out[out.length - 1];
        const prevWord = out[out.length - 2];
        if (/^[^\p{L}\p{N}]+$/u.test(part) && prevSpace?.space && !/[\r\n]/.test(prevSpace.space) && prevWord?.word !== undefined) {
            out.pop();
            prevWord.word += '\u00a0' + part;
            continue;
        }
        out.push({ word: part });
    }
    return out.map(o => (o.space !== undefined ? o.space : `<span class="keep-whole">${escapeHtml(o.word)}</span>`)).join('');
}
