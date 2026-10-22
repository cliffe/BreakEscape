// Awareness episodes: the role swap (SE design 11 N15, packet P7-P). Pure: no DOM, no globals.
//
// In E3 the learner first rings a helpdesk as an impostor, then sits in the helpdesk agent's
// seat. The calls they take are authored in the episode as `defend.calls[]`:
//
//   { id, genuine, callerId, claims: [{ fact, value }], tells: [...], transcript: [{ who, text }], notes }
//
// and become `call` messages in the episode's own triage set, so the existing triage starter
// scores them and writes episode_<id>_defend_done (N16: one writer). The conversion:
//
//   truth = notes, then isPhish = !genuine and flags = tells (perFlagNote, whyFine, ifTrusted...
//                                     as the P7-X lint and P7-S's scoring assume)
//   claims                            kept on the message, so the call card can list them:
//                                     the facts the learner used in the attack are the ones
//                                     they now check. A claim's value is a 06 `knows` value id
//                                     (gordon_staffid); the card shows its label (QH-20719),
//                                     found in the intelFacts `provides` that carry that value.
//
// In the merged round the calls come first, then the set's own messages (E3: four calls,
// then the push).
//
// Scoring is unchanged: each call action scores through a verdict row (triage-kinds.js), so
// refusing a genuine caller scores as Delete, and the review card says what the safe route was.
//
//   valueLabels(social)           -> { <value id>: label } from social.intelFacts provides
//   callToMessage(call, labels)   -> a triage message (kind 'call'), or null for a bad entry
//   mergeCalls(set, calls, labels) -> a new set, the calls first (ids already in the set skipped)
//   episodeDefendSet(episode, social) -> the defend set with the episode's calls merged in, or null

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;

/**
 * Labels for 06 `knows` value ids, from every social.intelFacts entry's `provides`
 * ({ about, value, label }). intelFacts may be an object keyed by id or an array.
 */
export function valueLabels(social) {
    const raw = social?.intelFacts;
    const facts = Array.isArray(raw) ? raw : (isObj(raw) ? Object.values(raw) : []);
    const out = {};
    for (const f of facts) {
        for (const p of Array.isArray(f?.provides) ? f.provides : []) {
            if (isObj(p) && isStr(p.value) && isStr(p.label) && !(p.value in out)) out[p.value] = p.label;
        }
    }
    return out;
}

/** One defend.calls[] entry as a `call` triage message. */
export function callToMessage(call, labels = {}) {
    if (!isObj(call) || !isStr(call.id) || typeof call.genuine !== 'boolean') return null;
    const notes = isObj(call.notes) ? call.notes : {};
    const truth = { ...notes };
    truth.isPhish = call.genuine !== true;
    truth.flags = Array.isArray(call.tells) ? call.tells.filter(isStr) : [];
    const label = (v) => {
        const id = String(v ?? '');
        return isObj(labels) && isStr(labels[id]) ? labels[id] : id;
    };
    const msg = {
        id: call.id,
        kind: 'call',
        transcript: Array.isArray(call.transcript) ? call.transcript.filter(isObj).map((l) => ({ ...l })) : [],
        claims: Array.isArray(call.claims)
            ? call.claims.filter((c) => isObj(c) && isStr(c.fact))
                .map((c) => ({ fact: c.fact, value: label(c.value), valueId: String(c.value ?? '') }))
            : [],
        truth
    };
    if (isStr(call.callerId)) msg.callerId = call.callerId;
    if (isStr(call.time)) msg.time = call.time;
    return msg;
}

/**
 * The set with `calls` as call messages before its own messages. The set object is not
 * changed. A call whose id is already a message id in the set is left out (the lint reports
 * it), so a reopen that merges twice gives the same set.
 */
export function mergeCalls(set, calls, labels = {}) {
    if (!isObj(set)) return null;
    const messages = Array.isArray(set.messages) ? set.messages : [];
    if (!Array.isArray(calls) || !calls.length) return set;
    const taken = new Set(messages.filter(isObj).map((m) => m.id));
    const added = [];
    for (const c of calls) {
        const m = callToMessage(c, labels);
        if (!m || taken.has(m.id)) continue;
        taken.add(m.id);
        added.push(m);
    }
    if (!added.length) return set;
    return { ...set, messages: [...added, ...messages] };
}

/** The episode's defend set from social.triageSets, with defend.calls merged in. */
export function episodeDefendSet(episode, social) {
    const id = episode?.defend?.setId;
    const sets = Array.isArray(social?.triageSets) ? social.triageSets : [];
    const set = sets.find((s) => isObj(s) && s.id === id) || null;
    if (!set) return null;
    return mergeCalls(set, episode?.defend?.calls, valueLabels(social));
}
