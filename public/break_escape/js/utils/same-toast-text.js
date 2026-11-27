// An observation identical to the text is one piece of writing: shown once.
// Exact match after trimming outer whitespace; run on the raw strings, before dashes and escaping.
// (systems/interactions.js keeps its own copy of this one-liner: it is loaded by ~40 test harnesses.)
export function sameToastText(observations, text) {
    return String(observations || '').trim() === String(text || '').trim();
}
