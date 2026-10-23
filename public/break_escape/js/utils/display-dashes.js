/**
 * Writers type " -- " for a dash in ink and scenario text. Shown as typed it
 * reads as two hyphens, so at display time only it becomes a spaced en dash.
 * Stored text (history, saves) and TTS input keep the original, so cached
 * audio, which is keyed on the text, stays valid.
 *
 *   "isolated -- no network"  -> "isolated – no network"
 *   "isolated--no network"    -> "isolated – no network"
 *   "I was--"                 -> "I was –"
 *
 * Runs of three or more hyphens ("---") are left alone.
 */
const EN_DASH = '–';

export function displayDashes(text) {
    if (typeof text !== 'string' || !text.includes('--')) return text;
    return text
        // spaced: " -- " (any run of whitespace either side, not part of "---")
        .replace(/(^|[^-])[ \t]+--[ \t]+(?=[^-]|$)/g, `$1 ${EN_DASH} `)
        // trailing, a broken-off line: "I was--" or "I was --" (end of line or before a closing quote)
        .replace(/([\p{L}\p{N}])[ \t]*--(?=$|[\s'"’”)])/gmu, `$1 ${EN_DASH}`)
        // bare, between words: "word--word"
        .replace(/([\p{L}\p{N}.,!?'"’”)])--(?=[\p{L}\p{N}‘“(])/gu, `$1 ${EN_DASH} `);
}
