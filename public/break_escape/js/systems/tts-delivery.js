/**
 * Per-line delivery notes for voiced lines.
 *
 * A voiced line holds only spoken words. How it should be performed goes in an ink tag
 * on that line:
 *
 *     I suppose it doesn't matter now. #delivery: quietly, almost to herself
 *
 * The note is sent with the line's TTS request (POST /tts `delivery`) and goes into the
 * voice prompt for that line only. It is never shown to the player. The server reads the
 * same tag the same way (TtsService.delivery_from_tags) to key and pre-generate the clip,
 * so the rules here and there must match: the last usable `delivery:` tag on the line wins,
 * whitespace (Unicode spaces included) is collapsed, and a note counts as none when it is
 * empty, has no ASCII letter or digit (`...`, `…`), or is over MAX_DELIVERY_LENGTH.
 * The server only uses the note to choose the ink's own note for the line; if it finds
 * none, the line is voiced untagged.
 *
 * No imports, so node tests can load it directly.
 */

const DELIVERY_TAG = /^\s*delivery\s*:\s*([\s\S]*)$/i;
// TtsService::MAX_DELIVERY_LENGTH
export const MAX_DELIVERY_LENGTH = 200;
// TtsService::DELIVERY_SPACE (JS \s already holds the Unicode spaces but not U+0085)
const DELIVERY_SPACE = /[\s\u0085]+/g;
// What TtsService.normalize_text keeps: ASCII word characters and ASCII whitespace
const NOT_KEPT = /[^A-Za-z0-9_ \t\r\n\f\v]/g;

/** A note cleaned as TtsService.clean_delivery cleans it, or null when it counts as none. */
function cleanDelivery(note) {
    const clean = String(note).replace(DELIVERY_SPACE, ' ').trim();
    if ([...clean].length > MAX_DELIVERY_LENGTH) return null; // code points, as Ruby counts
    if (!clean.replace(NOT_KEPT, '').trim()) return null;
    return clean;
}

/**
 * The delivery note in a line's tags, or null.
 * @param {string[]|null|undefined} tags - the line's ink tags
 * @returns {string|null}
 */
export function deliveryFromTags(tags) {
    if (!Array.isArray(tags)) return null;
    for (let i = tags.length - 1; i >= 0; i--) {
        const m = typeof tags[i] === 'string' ? tags[i].match(DELIVERY_TAG) : null;
        if (!m) continue;
        const note = cleanDelivery(m[1]);
        if (note) return note;
    }
    return null;
}
