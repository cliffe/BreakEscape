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
export const TEXT_TAIL_MARK = '[... earlier text cut, newest lines below ...]\n';

/** Fields for a capped text: { [key]: text } plus the truncation mark when cut. */
export function cappedText(key, value, limit = TEXT_LIMIT, keep = 'head') {
    const full = String(value ?? '');
    if (full.length <= limit) return { [key]: full };
    // keep: 'tail' is for chat threads, where the newest lines are last. The text opens
    // with TEXT_TAIL_MARK and is at most `limit` long; the reply adds `${key}Keeps: 'tail'`.
    if (keep === 'tail') {
        let tail = full.slice(full.length - (limit - TEXT_TAIL_MARK.length));
        if (/^[\uDC00-\uDFFF]/.test(tail)) tail = tail.slice(1); // do not start on half an emoji
        return { [key]: TEXT_TAIL_MARK + tail,
            [`${key}Truncated`]: true, [`${key}Length`]: full.length, [`${key}Keeps`]: 'tail' };
    }
    let head = full.slice(0, limit);
    if (/[\uD800-\uDBFF]$/.test(head)) head = head.slice(0, -1); // nor end on half of one
    return { [key]: head, [`${key}Truncated`]: true, [`${key}Length`]: full.length };
}
