// Flag chips, red-flag strings and header-panel wording for inbox triage
// (05 N3). Pure: no DOM, no globals.
//
// The factor ids and the canonical red-flag strings are 00 section 2's, imported
// from systems/phish-rules.js (CANONICAL, FACTOR_ORDER) so attack and defence
// cannot disagree about a tell. The channel tells are 00 section 2's table. This
// file adds only what 05 owns: the chip label tables and the header-panel text.
//
// Red-flag resolution (00 section 2): a per-message `factorStrings[id].redFlag`
// if the author set one, otherwise the canonical string. Never null, never empty.

import { CANONICAL, FACTOR_ORDER } from '../../systems/phish-rules.js';

export { FACTOR_ORDER };

/** 00 section 2 channel tells: id -> canonical tell string. */
export const CHANNEL_TELLS = Object.freeze({
    lookalike_domain: 'Link or sender domain is a look-alike of the real one',
    changed_bank_details: 'Payment or bank details changed at the last minute',
    unexpected_qr: 'A QR code where you\'d expect a normal link',
    unrequested_mfa_push: 'An MFA prompt you didn\'t trigger',
    smish_shortlink_urgency: 'Unsolicited SMS with a shortened link and pressure',
    vish_callback_pressure: 'Caller discourages you from calling back the official number',
    secrecy_or_bypass: 'Asked to keep it secret or to skip the normal process',
    borrowed_authority: 'Someone senior is invoked to skip a check',
    reply_to_differs: 'The reply-to address differs from the From address',
    reply_stop_trick: '\'Reply STOP\' to opt out, which confirms your number is live',
    padlock_myth: 'A padlock shows the connection is private to the address owner, not that the site is safe',
    enable_content_prompt: 'A document asks you to enable editing or content before it will show anything'
});

export const NONE_ID = 'none';
export const NONE_LABEL = 'Nothing looks wrong';

/** Built-in chip labels. 05's own wording (plain), and the technical table for the lab. */
export const CHIP_LABELS = Object.freeze({
    plain: Object.freeze({
        senderTrust: "The sender's address doesn't match who it says it is",
        senderAuth: "The header checks failed or don't line up",
        addressedTo: "It doesn't use my name",
        pretextRelevant: "There's no good reason I'd get this",
        attachmentPlausible: "The attachment doesn't fit",
        urgencyCalibrated: "It's pushing me to hurry",
        linkCredible: 'The link goes somewhere else',
        enable_content_prompt: 'It asks me to turn on editing or content to see it'
    }),
    technical: Object.freeze({
        senderTrust: 'Sender trust: display name and real address differ',
        senderAuth: 'Authentication: SPF, DKIM or DMARC fails or does not align',
        addressedTo: 'Generic greeting, not addressed to me',
        pretextRelevant: 'Pretext: no plausible reason for this to reach me',
        attachmentPlausible: 'Attachment: wrong type, or claimed but missing',
        urgencyCalibrated: 'Urgency: pressure to act fast',
        linkCredible: 'Link: text and real destination differ',
        enable_content_prompt: 'Document: asks to enable editing or content (macros)'
    })
});

/** Short skill names for the Result step's breakdown. */
export const SKILL_NAMES = Object.freeze({
    senderTrust: 'Sender address',
    senderAuth: 'Header checks',
    addressedTo: 'Greeting',
    pretextRelevant: 'Relevance',
    attachmentPlausible: 'Attachments',
    urgencyCalibrated: 'Pressure',
    linkCredible: 'Links',
    lookalike_domain: 'Look-alike domains',
    changed_bank_details: 'Changed bank details',
    unexpected_qr: 'QR codes',
    unrequested_mfa_push: 'MFA prompts',
    smish_shortlink_urgency: 'Text messages',
    vish_callback_pressure: 'Callback pressure',
    secrecy_or_bypass: 'Secrecy',
    borrowed_authority: 'Borrowed authority',
    reply_to_differs: 'Reply-to address',
    reply_stop_trick: 'Reply STOP',
    padlock_myth: 'Padlock myth',
    enable_content_prompt: 'Enable-content prompts'
});

const isStr = (v) => typeof v === 'string' && v.length > 0;
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

const NON_EMAIL = ['sms', 'voicemail', 'qr', 'page', 'call', 'push'];

/**
 * The ids a set shows as chips, in the fixed order. An email (the default kind) gets the
 * seven factors, then the enabled channel tells. A non-email kind gets only the enabled
 * channel tells, because the email factors do not apply to it (05 OQ7). A scenario-local
 * tell counts as enabled when the set gives it a `flagChips` label (00 section 2).
 */
export function chipIdsFor(set, kind = 'email') {
    const local = (id) => isObj(set?.flagChips) && isStr(set.flagChips[id]) && !FACTOR_ORDER.includes(id);
    const tells = (Array.isArray(set?.channelTells) ? set.channelTells : []).filter((id) => CHANNEL_TELLS[id] || local(id));
    return NON_EMAIL.includes(kind) ? tells : [...FACTOR_ORDER, ...tells];
}

/** The chip label for one id: the set's `flagChips` override, else the built-in table for its `chipStyle`. */
export function chipLabel(set, id) {
    if (id === NONE_ID) return (isObj(set?.flagChips) && isStr(set.flagChips.none)) ? set.flagChips.none : NONE_LABEL;
    if (isObj(set?.flagChips) && isStr(set.flagChips[id])) return set.flagChips[id];
    const table = set?.chipStyle === 'technical' ? CHIP_LABELS.technical : CHIP_LABELS.plain;
    return table[id] || CHANNEL_TELLS[id] || id;
}

/**
 * The red-flag sentence for a tell on one message (00 section 2). `message` supplies
 * `factorStrings` (per-message override), its `attachments` (to pick the attachment
 * state) and nothing else.
 */
export function redFlagString(id, message) {
    const fs = isObj(message?.factorStrings) ? message.factorStrings[id] : null;
    if (id === 'attachmentPlausible') {
        const has = Array.isArray(message?.attachments) && message.attachments.length > 0;
        const state = has ? 'wrong-type' : 'missing';
        const own = isObj(fs) && isObj(fs[state]) && isStr(fs[state].redFlag) ? fs[state].redFlag
            : (isObj(fs) && isStr(fs.redFlag) ? fs.redFlag : null);
        return own || CANONICAL.attachmentPlausible[state].redFlag;
    }
    if (isObj(fs) && isStr(fs.redFlag)) return fs.redFlag;
    if (CANONICAL[id] && isStr(CANONICAL[id].redFlag)) return CANONICAL[id].redFlag;
    return CHANNEL_TELLS[id] || id;
}

export function skillName(id) {
    return SKILL_NAMES[id] || id;
}

// ── Header panel wording (05 "The header panel"; concept level, fictional) ───────────

export const MECHANISMS = Object.freeze(['spf', 'dkim', 'dmarc']);
export const MECHANISM_LABEL = Object.freeze({ spf: 'SPF', dkim: 'DKIM', dmarc: 'DMARC' });
// Plain labels for the awareness skin (11 §7: "no jargon, only 'this domain isn't theirs'").
// The lab keeps the technical names above. Chosen with MECHANISM_LABEL_FOR(plain).
export const MECHANISM_LABEL_PLAIN = Object.freeze({ spf: 'Sending server', dkim: 'Signature', dmarc: 'Domain check' });
export const AUTH_TITLE = Object.freeze({ technical: 'Authentication-Results', plain: 'Did the domain really send this?' });
/** The mechanism label map for the skin: plain words under awareness, SPF/DKIM/DMARC otherwise. */
export function mechanismLabels(plain) { return plain ? MECHANISM_LABEL_PLAIN : MECHANISM_LABEL; }

/** One-line meaning of each result. Pass lines are 05's own sample text. */
export const RESULT_MEANING = Object.freeze({
    spf: Object.freeze({
        pass: 'The server that sent this is on the list its domain publishes.',
        fail: 'The server that sent this is not on the list the sending domain publishes.',
        none: 'The sending domain publishes no list, so there is no verdict either way.'
    }),
    dkim: Object.freeze({
        pass: "The message carries a signature its domain vouches for, and it wasn't changed.",
        fail: "The signature doesn't check out: the message was changed in transit, or it isn't the key it claims.",
        none: 'The message is not signed.'
    }),
    dmarc: Object.freeze({
        pass: 'SPF or DKIM passed AND matched the From domain, so the domain\'s policy is met.',
        fail: "Neither SPF nor DKIM passed in line with the From domain, so the domain's policy is not met.",
        none: 'The From domain publishes no policy.'
    })
});

// The awareness skin's plain meaning lines (11 §7, "no jargon"). Only DMARC's default text
// names SPF and DKIM, so only it is overridden; SPF and DKIM already read in plain words.
export const RESULT_MEANING_PLAIN = Object.freeze({
    dmarc: Object.freeze({
        pass: "The From address you see lines up with who really sent it, so this domain's own check is met.",
        fail: "The From address you see doesn't line up with who really sent it, so this domain's check is not met.",
        none: 'The From domain sets no rule, so there is no verdict either way.'
    })
});
/** The result-meaning map for the skin: plain DMARC wording under awareness, the sample text otherwise. */
export function resultMeaning(plain) {
    return plain ? { ...RESULT_MEANING, dmarc: RESULT_MEANING_PLAIN.dmarc } : RESULT_MEANING;
}

/** Three-line explainer per mechanism: what it checks, how to read a result, what it does not tell you. */
export const EXPLAINERS = Object.freeze({
    spf: Object.freeze({
        checks: "SPF checks that the sending server is on the list the envelope sender's domain publishes. It does not look at the From address you see.",
        reading: 'Pass means listed. Fail means not listed. None means the domain publishes no list.',
        notTell: 'A pass does not make the sender honest, and a fail on its own is a clue, not proof: forwarding often breaks SPF.'
    }),
    dkim: Object.freeze({
        checks: 'DKIM checks a cryptographic signature the sending domain added over parts of the message.',
        reading: "Pass means the signature is valid and the signed parts are unchanged. Fail means it doesn't verify. None means unsigned.",
        notTell: 'A valid signature says which domain signed it, not that the domain is trustworthy. Mailing lists that rewrite a message often break it.'
    }),
    dmarc: Object.freeze({
        checks: 'DMARC ties SPF or DKIM to the From domain you see: one of them must pass and match that domain.',
        reading: "Pass means the domain's policy is met. Fail means it is not. The domain's policy says what receivers should do about a fail. None means no policy.",
        notTell: 'A pass proves which domain sent it, not that you should trust that domain. An attacker who owns a look-alike domain can pass all three. None is a reason for more care, not less.'
    })
});

export const RESULT_WORD = Object.freeze({ pass: 'Pass', fail: 'Fail', none: 'None' });

export function normaliseResult(v) {
    return v === 'pass' || v === 'fail' ? v : 'none';
}
