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

import { CANONICAL, FACTOR_ORDER, CHANNEL_TELLS } from '../../systems/phish-rules.js';

export { FACTOR_ORDER };

/** 00 section 2 channel tells: id -> canonical tell string (defined beside CANONICAL in phish-rules.js). */
export { CHANNEL_TELLS };

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

// Tells that cannot apply to a kind of message, so offering them as ticks let a learner tick
// something that could never be right (N6; P3 N-4 extended it past calls, voicemails and prompts):
//   - email-structural: the reply-to header and a document's enable-content prompt;
//   - web-structural: the padlock myth (only a page has an address bar);
//   - text-message tells: a shortened link sent by SMS and the "Reply STOP" trick;
//   - a QR code (an email or a printed notice can carry one; a text, a call or a page cannot);
//   - an unrequested MFA prompt (only a sign-in prompt is one);
//   - a caller putting you off ringing back (a call or a voicemail; an email can say "don't
//     ring me" too, so email keeps it);
//   - a look-alike domain (anything with an address or a link, so not a call, voicemail or prompt).
// A tell the message is actually scored on is always kept (see chipIdsFor), so no authored flag
// is ever hidden. A scenario-local tell (a flagChips label the table does not know) is never
// filtered.
const VOICE = ['reply_to_differs', 'lookalike_domain', 'enable_content_prompt', 'padlock_myth',
    'smish_shortlink_urgency', 'reply_stop_trick', 'unexpected_qr', 'unrequested_mfa_push'];
const EMAIL_EXCLUDE = ['padlock_myth', 'smish_shortlink_urgency', 'reply_stop_trick', 'unrequested_mfa_push'];
const KIND_TELL_EXCLUDE = Object.freeze({
    email: EMAIL_EXCLUDE,
    playerSent: EMAIL_EXCLUDE,
    sms: ['reply_to_differs', 'enable_content_prompt', 'padlock_myth', 'unexpected_qr', 'unrequested_mfa_push',
        'vish_callback_pressure'],
    qr: ['reply_to_differs', 'enable_content_prompt', 'padlock_myth', 'smish_shortlink_urgency', 'reply_stop_trick',
        'unrequested_mfa_push', 'vish_callback_pressure'],
    page: ['reply_to_differs', 'enable_content_prompt', 'smish_shortlink_urgency', 'reply_stop_trick', 'unexpected_qr',
        'unrequested_mfa_push', 'vish_callback_pressure'],
    call: VOICE,
    voicemail: VOICE,
    // A sign-in prompt carries an app, an account, a time and a place: nothing on it can invoke
    // someone senior, ask for secrecy or change bank details (P4-6).
    push: ['reply_to_differs', 'lookalike_domain', 'enable_content_prompt', 'padlock_myth',
        'smish_shortlink_urgency', 'reply_stop_trick', 'unexpected_qr', 'vish_callback_pressure',
        'secrecy_or_bypass', 'borrowed_authority', 'changed_bank_details']
});

// An email can put you off ringing back ("reply here rather than calling"). P4-6 offered the tick
// only on an email that talks about calling at all; P5-10 narrows it to one whose words actually
// discourage a call or steer you to reply (EMAIL_TELL_NEEDS below).

// P5-10: emails still offered 9 to 11 ticks, some of which the message could never carry.
// Each tell below is offered on an email only when the email's own words (or attachments)
// could carry it. The tests read every message alike, real or fake, so a tick's presence never
// hints at the verdict, and a tell the message is scored on is always kept (chipIdsFor).
//   vish_callback_pressure  only an email that puts you off ringing or steers you to reply;
//   changed_bank_details    only an email about money or bank details;
//   unexpected_qr           only an email that mentions a QR code or scanning;
//   enable_content_prompt   only an email with an attachment, or that talks about enabling.
const CALL_DISCOURAGE = /\b(?:(?:don'?t|do not|no need to|please don'?t|can'?t|cannot|won'?t be able to|not able to|unable to)\s+(?:\w+\s+){0,2}(?:call|ring|phone|reach)|(?:rather than|instead of)\s+(?:a\s+)?(?:call(?:ing)?|ring(?:ing)?|phon(?:e|ing))|reply (?:here|to this|by email)|just (?:reply|email)|(?:not|no) (?:a )?callback|in (?:a )?meetings?|on (?:a|the) (?:plane|flight|train)|about to board|no signal|unreachable)\b/i;
const MONEY_WORDS = /\b(bank|sort code|iban|account (?:number|details)|payee|payment|pay|paid|invoice|transfer|remit|salary|payroll|refund|card|supplier details)\b/i;
const QR_WORDS = /\b(qr|scan(?:ning)?)\b/i;
const ENABLE_WORDS = /\b(enable|macros?|editing|content)\b/i;
const EMAIL_TELL_NEEDS = Object.freeze({
    vish_callback_pressure: (m) => CALL_DISCOURAGE.test(messageText(m)),
    changed_bank_details: (m) => MONEY_WORDS.test(messageText(m)),
    unexpected_qr: (m) => QR_WORDS.test(messageText(m)),
    enable_content_prompt: (m) => (Array.isArray(m?.attachments) && m.attachments.length > 0) || ENABLE_WORDS.test(messageText(m))
});
function messageText(message) {
    return [message?.subject, message?.body, message?.preview]
        .map((v) => (typeof v === 'string' ? v : (Array.isArray(v) ? v.join(' ') : ''))).join(' ');
}

/** Header-panel tells: only readable once the header details are open (P3 F7). */
export const HEADER_TELLS = Object.freeze(['senderAuth', 'reply_to_differs']);

/**
 * The ids a set shows as chips, in the fixed order. An email (the default kind) gets the
 * seven factors, then the enabled channel tells. A non-email kind gets only the enabled
 * channel tells, because the email factors do not apply to it (05 OQ7). A scenario-local
 * tell counts as enabled when the set gives it a `flagChips` label (00 section 2).
 *
 * `message` (optional) is the triage message the chips are for: a tell that cannot apply to
 * its kind is dropped (KIND_TELL_EXCLUDE), unless the message is scored on it (its
 * `truth.flags`), which keeps every authored flag tickable. Without a message nothing is
 * dropped from an email's list (the set-level view).
 *
 * `opts.hideHeaderTells` drops the header-panel tells (HEADER_TELLS) whether or not they are
 * authored: the awareness round passes it while the header details for this message are still
 * closed, so the learner is never asked to judge a header they have not opened. It is applied
 * to every message alike, so the presence of a chip never hints at the answer.
 */
export function chipIdsFor(set, kind = 'email', message = null, opts = {}) {
    const local = (id) => isObj(set?.flagChips) && isStr(set.flagChips[id]) && !FACTOR_ORDER.includes(id);
    const tells = (Array.isArray(set?.channelTells) ? set.channelTells : []).filter((id) => CHANNEL_TELLS[id] || local(id));
    const email = !NON_EMAIL.includes(kind);
    let ids = email ? [...FACTOR_ORDER, ...tells] : tells;
    const exclude = KIND_TELL_EXCLUDE[email ? 'email' : kind];
    // Kept whatever the kind: the message's authored flags and every member of its either-tick
    // groups (truth.flagAlternatives), so nothing the message is scored on is ever hidden.
    const keep = new Set(Array.isArray(message?.truth?.flags) ? message.truth.flags : []);
    for (const g of Array.isArray(message?.truth?.flagAlternatives) ? message.truth.flagAlternatives : []) {
        if (Array.isArray(g)) for (const id of g) if (isStr(id)) keep.add(id);
    }
    if (exclude && (message || !email)) {
        ids = ids.filter((id) => !exclude.includes(id) || keep.has(id));
    }
    if (email && message) {
        ids = ids.filter((id) => keep.has(id) || !EMAIL_TELL_NEEDS[id] || EMAIL_TELL_NEEDS[id](message));
    }
    // N-14: a text, notice or other channel item can author an email factor it carries (pressure on
    // a QR barrier notice: truth.flags has urgencyCalibrated). Offer it as a chip so it can be
    // ticked and scored. Only the message's own authored factors are added, never the whole list.
    if (!email && message) {
        const extra = FACTOR_ORDER.filter((id) => keep.has(id) && !ids.includes(id));
        if (extra.length) ids = [...extra, ...ids];
    }
    if (opts.hideHeaderTells) ids = ids.filter((id) => !HEADER_TELLS.includes(id));
    return ids;
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
export function redFlagString(id, message, set = null) {
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
    // A scenario-local tell: the set's own sentence (set.tellStrings), before the raw id.
    if (CHANNEL_TELLS[id]) return CHANNEL_TELLS[id];
    return isObj(set?.tellStrings) && isStr(set.tellStrings[id]) ? set.tellStrings[id] : id;
}

/** The skill name for a tell id: the built-in table, else set.skillNames for a local tell, else the id. */
export function skillName(id, set = null) {
    if (SKILL_NAMES[id]) return SKILL_NAMES[id];
    return isObj(set?.skillNames) && isStr(set.skillNames[id]) ? set.skillNames[id] : id;
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
