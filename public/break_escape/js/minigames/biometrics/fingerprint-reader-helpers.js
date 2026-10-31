/**
 * FINGERPRINT READER HELPERS
 * ==========================
 *
 * Pure text helpers shared by the reader overlay and the kit panel. No imports and no
 * DOM, so node tests can load this file directly.
 */

export const READER_FORENSIC_LINE =
    'Many fingerprint readers can be fooled by a lifted print. In 2013 the Chaos Computer Club ' +
    'unlocked an iPhone 5s Touch ID with a fingerprint photographed from a glass surface.';

export const FIELD_NOTES = [
    { pattern: 'loop', text: 'Ridges enter and leave on the same side; one delta.' },
    { pattern: 'whorl', text: 'Circular or spiral ridges; two deltas.' },
    { pattern: 'arch', text: 'Ridges flow across with a rise in the middle; no delta.' }
];

export const NO_SAMPLES_MESSAGE =
    "This reader needs a fingerprint. You haven't lifted any prints yet.";

export function percent(quality) {
    return Math.round((Number(quality) || 0) * 100);
}

/**
 * Name shown for a lift. Identified lifts use the person's name; others are described by
 * where they came from. Never the raw owner string unless it has been identified.
 */
export function labelForSample(sample, { withPattern = false } = {}) {
    if (!sample) return 'Unknown print';
    if (sample.identified && sample.ownerName) return sample.ownerName;
    const source = sample.sourceName || 'an unknown surface';
    const label = `Print from ${source}`;
    return withPattern && sample.pattern ? `${label}, ${sample.pattern}` : label;
}

/** Heading and symbol for each answer, so the meaning never rests on colour alone. */
export function headingForOutcome(result) {
    switch (result) {
        case 'accepted': return { glyph: '\u2714', title: 'Accepted' };
        case 'low_quality': return { glyph: '\u25D0', title: 'Partial read' };
        case 'no_match': return { glyph: '\u2716', title: 'No match' };
        case 'no_samples': return { glyph: '\u2716', title: 'No prints' };
        default: return { glyph: '', title: '' };
    }
}

/**
 * Line shown (and announced) for a reader outcome. A wrong-person reply names the owner
 * of the lift once the player has identified it, and says how to find out otherwise.
 */
export function messageForOutcome(result, { sample = null, threshold = 0.4, signText = '' } = {}) {
    switch (result) {
        case 'accepted':
            return `Accepted. The reader read ${percent(sample?.quality)}% of the ridge detail and needed ${percent(threshold)}%. Door unlocking.`;
        case 'low_quality': {
            const where = sample?.sourceName ? ` Dust ${sample.sourceName} again with a lighter touch.` : '';
            return `Partial read. This reader needs ${percent(threshold)}%; this lift is ` +
                `${percent(sample?.quality)}%. A cleaner lift of the same print will do.${where}`;
        }
        case 'no_match': {
            const sign = signText ? ` The sign says: "${signText}".` : '';
            if (sample?.identified && sample.ownerName) {
                return `No match. That is ${sample.ownerName}'s print, and this reader is enrolled to someone else.${sign} Try another lift.`;
            }
            return `No match. This reader is enrolled to someone else.${sign} Matching a lift against the references in the dusting panel tells you whose it is. Try another lift.`;
        }
        case 'no_samples':
            return NO_SAMPLES_MESSAGE;
        default:
            return '';
    }
}

/** Reason sent with door_unlock_failed for a refused attempt. */
export function failureReasonForOutcome(result) {
    return result === 'low_quality' ? 'biometric_quality' : 'biometric_missing';
}
