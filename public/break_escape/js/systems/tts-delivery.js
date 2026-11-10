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
 * same tag the same way (TtsService.delivery_from_tags) to key, validate and pre-generate
 * the clip, so the rules here and there must match: the last `delivery:` tag on the line
 * wins, whitespace is collapsed, and an empty note counts as none.
 *
 * No imports, so node tests can load it directly.
 */

const DELIVERY_TAG = /^\s*delivery\s*:\s*([\s\S]*)$/i;

/** True for a `#delivery:` tag. */
export function isDeliveryTag(tag) {
    return typeof tag === 'string' && DELIVERY_TAG.test(tag);
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
        const note = m[1].replace(/\s+/g, ' ').trim();
        if (note) return note;
    }
    return null;
}
