// The one HTML escape for author, scenario and server text: & < > " ' become entities,
// so the result is safe in element content and in a quoted attribute. null and undefined
// become an empty string; any other value goes through String() (so 0 stays "0").
const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);
}
