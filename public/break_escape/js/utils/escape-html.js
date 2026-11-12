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
export function escapeHtmlKeepWords(value) {
    return String(value ?? '').split(/(\s+)/).map(part => (
        !part || /^\s+$/.test(part) ? part : `<span class="keep-whole">${escapeHtml(part)}</span>`
    )).join('');
}
