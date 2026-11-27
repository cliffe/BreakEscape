/**
 * Auto-advance pacing for person-chat.
 *
 * A voiced line holds for its audio length (plus a small buffer). A line with no audio
 * (no TTS key, the fetch failed, or the audio would not load) holds for an estimate of the
 * time it takes to read: a base for noticing the line, a rate per word (about 230 wpm),
 * floored and capped.
 */
export const READ_MIN_MS = 2000;
export const READ_MAX_MS = 12000;
export const READ_BASE_MS = 1200;
export const READ_MS_PER_WORD = 260;
export const AUDIO_BUFFER_MS = 500;

/** Reading-time estimate in ms for a line of text. */
export function readingTimeMs(text) {
    const words = String(text ?? '').trim().split(/\s+/).filter(Boolean).length;
    const ms = READ_BASE_MS + words * READ_MS_PER_WORD;
    return Math.min(READ_MAX_MS, Math.max(READ_MIN_MS, ms));
}

/**
 * How long to hold a line before auto-advancing.
 * @param {string} text - the line as shown
 * @param {number|null|undefined} audioDurationMs - audio length, or null/NaN/0 if none
 */
export function advanceDelayMs(text, audioDurationMs) {
    if (Number.isFinite(audioDurationMs) && audioDurationMs > 0) {
        return audioDurationMs + AUDIO_BUFFER_MS;
    }
    return readingTimeMs(text);
}
