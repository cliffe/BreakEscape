/**
 * Text in a minigame's test-bridge state (getTestState).
 *
 * The overlay's whole text is cut at TEXT_LIMIT so a state reply stays small, and the
 * cut is now reported: `textTruncated: true` with `textLength`, the full length. A cut
 * with no mark read as missing content (the rules of engagement board's last three
 * paragraphs, lab_physical_pentest playtests, finding E7). A note's own text is the
 * thing a tester came to read, so it gets the larger NOTE_LIMIT.
 */
export const TEXT_LIMIT = 2000;
export const NOTE_LIMIT = 20000;

/** Fields for a capped text: { [key]: text } plus the truncation mark when cut. */
export function cappedText(key, value, limit = TEXT_LIMIT) {
    const full = String(value ?? '');
    if (full.length <= limit) return { [key]: full };
    return { [key]: full.slice(0, limit), [`${key}Truncated`]: true, [`${key}Length`]: full.length };
}
