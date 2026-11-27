import { escapeHtml } from './escape-html.js';
import { displayDashes } from './display-dashes.js';

// Scenario text that is plain text with a small, deliberate formatting set:
// character entities (&mdash; &rsquo; &#10003;) and the bare tags
// <strong> <em> <b> <i> <br>, in any letter case. Everything is escaped first,
// then only those exact forms are put back, so no other tag or any attribute can
// get through. Tags are restored before entities, so an authored &lt;b&gt; stays
// literal text, and only as matched pairs (one level of nesting), so a stray or
// unclosed tag shows as text instead of restyling what follows. The " -- " dash
// display runs on the source text, before the escape, never on built HTML.
// Used by the NCSC brief, the coverage decision form and the scenario end screen.
const AUTHOR_PAIR = /&lt;(strong|em|b|i)&gt;((?:(?!&lt;\/?(?:strong|em|b|i)&gt;)[\s\S])*?)&lt;\/\1&gt;/gi;

export function authorHtml(value) {
    let html = escapeHtml(displayDashes(String(value ?? '')));
    const pairs = (s) => s.replace(AUTHOR_PAIR, (m, tag, inner) => `<${tag.toLowerCase()}>${inner}</${tag.toLowerCase()}>`);
    html = pairs(pairs(html));
    return html
        .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
        .replace(/&amp;(#\d{1,7}|#x[0-9a-fA-F]{1,6}|[a-zA-Z][a-zA-Z0-9]{1,31});/g, '&$1;');
}
