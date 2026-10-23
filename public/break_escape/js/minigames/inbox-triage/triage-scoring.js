/**
 * Inbox triage scorer (05 "The rules / scoring"; N4 scorer, N8 scoring profiles).
 *
 * Pure: no DOM, no imports, no randomness, no model call. The same answers always give the
 * same score. The minigame, the reopen screen and the tests all call scoreTriage().
 *
 *   scoreTriage({ messages, answers, profile, bands?, passPercent? }) -> result
 *
 * messages  the set's messages; only `id` and `truth.isPhish` / `truth.flags` are read.
 * answers   [{ id, verdict, flags: [factor or channel-tell ids], ms? }]. `id` is the message id
 *           (`messageId` is accepted too). `verdict` is 'trust' | 'report' | 'delete' | 'verify'.
 *           `flags` may hold 'none' ("Nothing looks wrong"), which is ignored. `ms` is never scored.
 * profile   'analyst' | 'awareness' (default 'awareness', the mission default in 05).
 *           'verify' is awareness only; an analyst set that sends it throws.
 *
 * phishCaught counts phish answered Report, Delete or Verify; reportCount (and reportRate)
 * counts Report only.
 *
 * Each message is worth 100: 60 for the verdict, 40 for the reasons. Per-message scores are
 * rounded to whole points (halves up) and the round percent is the mean of those, halves up,
 * less CRITICAL_PENALTY for each critical miss (an approved attacker's sign-in prompt, a call
 * complied with for an impostor, or a trusted phish email; awareness only), floored at 0.
 */

export const PROFILES = ['analyst', 'awareness'];
export const VERDICTS = ['trust', 'report', 'delete', 'verify'];
export const NONE_CHIP = 'none';

/** 05 "Round score and bands". Authored bands on the set replace these. */
export const DEFAULT_BANDS = [
    { min: 85, headline: 'Sharp: you caught the phish and knew why' },
    { min: 60, headline: 'Getting there: a few tells slipped past' },
    { min: 0, headline: "Worth practising: here's where to look first" },
];

/**
 * Per-kind exceptions to VERDICT_POINTS (awareness only). A call's Comply on a genuine caller
 * scores as Trust would, but the lesson of the call queue is "check before you act" (11 N15: the
 * taught action is the callback, which also serves the genuine caller). Doing what an unchecked
 * caller asks is the same act that lets the impostor in, so it is not full marks: 30, the same as
 * hanging up on them (P3 N16).
 */
const KIND_VERDICT_POINTS = {
    call: { real: { trust: 30 } },
};

/**
 * Approving a sign-in prompt you did not start, or doing what an impostor asks on a call, hands
 * the attacker the account outright. Each such answer takes CRITICAL_PENALTY points off the
 * round percent on top of the item's own zero, and the round can never reach the top band
 * (P3 N17: one approved overnight prompt still read "Sharp" territory at 84%).
 */
export const CRITICAL_KINDS = Object.freeze(['push', 'call', 'email']);
export const CRITICAL_PENALTY = 15;
// P4-3: trusting a phish email (paying the invoice, sending the passport scans, signing in through
// its link) hands over as much as an approved prompt, so Trust on a phish email is a critical
// miss too, at the same cost. A message can opt in or out with `truth.critical` (true / false):
// a phish whose Trust gives nothing away can say false, and another kind (a page, a voicemail)
// whose Trust hands over credentials or money can say true.

/** Which kinds a critical miss names in the result line, in this order. */
export const CRITICAL_WHAT = Object.freeze({
    push: "approving a sign-in you didn't start",
    call: 'doing what an impostor asked on a call',
    email: 'trusting a phish email'
});

/** Verdict points (out of 60) by profile, truth and verdict. Verify scores like Report. */
const VERDICT_POINTS = {
    analyst: {
        phish: { report: 60, delete: 30, trust: 0 },
        real: { report: 20, delete: 0, trust: 60 },
    },
    awareness: {
        phish: { report: 60, verify: 60, delete: 30, trust: 0 },
        real: { report: 60, verify: 60, delete: 30, trust: 60 },
    },
};

const clamp01 = (n) => Math.min(1, Math.max(0, n));
const roundHalfUp = (n) => Math.floor(n + 0.5);

/**
 * Verdict points for one message. Throws on an unknown profile or verdict. `kind` (optional,
 * the message's kind) applies KIND_VERDICT_POINTS under the awareness profile.
 */
export function verdictPoints(profile, isPhish, verdict, kind = null) {
    const table = VERDICT_POINTS[profile];
    if (!table) throw new RangeError(`triage-scoring: unknown scoringProfile "${profile}"`);
    const pts = table[isPhish ? 'phish' : 'real'][verdict];
    if (pts === undefined) {
        throw new RangeError(`triage-scoring: verdict "${verdict}" is not available in the ${profile} profile`);
    }
    if (profile === 'awareness' && kind) {
        const own = KIND_VERDICT_POINTS[kind]?.[isPhish ? 'phish' : 'real']?.[verdict];
        if (own !== undefined) return own;
    }
    return pts;
}

/** The most verdict points any verdict can earn on this message (60): "handled right" means this. */
export const FULL_VERDICT_POINTS = 60;

/**
 * A critical miss (awareness only): Trust on a phish push (approved), call (complied with) or
 * email (P4-3). `critical` is the message's own `truth.critical`: true makes Trust on any phish
 * critical, false makes it never critical; anything else leaves the kind rule.
 */
export function isCriticalMiss(profile, isPhish, verdict, kind, critical = null) {
    if (profile !== 'awareness' || !isPhish || verdict !== 'trust') return false;
    if (critical === true || critical === false) return critical;
    return CRITICAL_KINDS.includes(kind || 'email');
}

/**
 * The bracketed "what counts" part of the result's critical-miss line, naming only the kinds
 * this round's critical misses were ("approving a sign-in you didn't start, or trusting a
 * phish email"). Kinds outside CRITICAL_WHAT read "trusting a phish".
 */
export function criticalWhat(kinds) {
    const seen = [];
    for (const k of kinds || []) {
        const w = CRITICAL_WHAT[k] || 'trusting a phish';
        if (!seen.includes(w)) seen.push(w);
    }
    if (!seen.length) return '';
    return seen.length === 1 ? seen[0] : `${seen.slice(0, -1).join(', ')}, or ${seen[seen.length - 1]}`;
}

/**
 * Reasons points (out of 40) for one message.
 * phish:  40 * clamp((caught - falseClaims) / F, 0, 1)   (awareness: no falseClaims term)
 * real:   analyst 40 / 20 / 0 for 0 / 1 / 2+ false claims; awareness always 40
 * F = 0 on a phish is invalid data (the validator refuses it); it scores 0 rather than dividing.
 */
export function flagPoints(profile, isPhish, { caught, falseClaims, authored }) {
    if (!PROFILES.includes(profile)) throw new RangeError(`triage-scoring: unknown scoringProfile "${profile}"`);
    if (isPhish) {
        if (authored === 0) return 0;
        const net = profile === 'analyst' ? caught - falseClaims : caught;
        return 40 * clamp01(net / authored);
    }
    if (profile === 'awareness') return 40;
    return falseClaims === 0 ? 40 : falseClaims === 1 ? 20 : 0;
}

export function bandFor(percent, bands = DEFAULT_BANDS) {
    const sorted = [...(bands && bands.length ? bands : DEFAULT_BANDS)].sort((a, b) => b.min - a.min);
    return sorted.find((b) => percent >= b.min) || sorted[sorted.length - 1];
}

/**
 * The factor the player missed most, for the Result step's pointer. A tie on misses goes to the
 * one caught least (a skill at zero before one half caught), then to the factor met first in
 * `perFactor` (P4-10). Returns null when nothing was missed. `ties` lists every factor equal
 * to it on both counts (itself included), so the pointer can name them all.
 */
export function weakestFactor(perFactor) {
    let best = null;
    const worse = (c, b) => c.missed > b.missed || (c.missed === b.missed && c.caught < b.caught);
    for (const [id, c] of Object.entries(perFactor || {})) {
        if (c.missed > 0 && (!best || worse(c, best))) best = { id, caught: c.caught, missed: c.missed };
    }
    if (!best) return null;
    best.ties = Object.entries(perFactor || {})
        .filter(([, c]) => c.missed === best.missed && c.caught === best.caught).map(([id]) => id);
    return best;
}

/** Skills ticked on at least one item and never caught (caught 0, missed 1 or more). */
export function zeroSkills(perFactor) {
    return Object.entries(perFactor || {}).filter(([, c]) => c.caught === 0 && c.missed > 0).map(([id]) => id);
}

/**
 * Three or more tells missed in skills never caught keep the round out of the top band (P4-9:
 * "Sharp: you caught the phish and knew why" at 90% beside Pressure 0 of 1 and Secrecy 0 of 2).
 * The 05 worked example (two skills at 0 of 1, 86%) stays Sharp.
 */
export const ZERO_SKILL_MISSES_CAP = 3;

/**
 * Group a message's authored flags into scoring units, honouring `truth.flagAlternatives`
 * (05 "Either tick counts"). Some messages carry one tell that two flags can name — a look-alike
 * link is `lookalike_domain` or `linkCredible`; a look-alike From address is `lookalike_domain`
 * or `senderTrust`. An alternatives group names those flags so the pair is scored as one unit:
 * credited when any member is ticked, reported missed once under its first member's note.
 *
 * Each returned unit is { members: [authored flag ids, in group order], note: members[0] }. A flag
 * in no group is its own singleton unit, so a message without the field groups one flag per unit
 * and scores exactly as before. Units come out in the order the first member appears in
 * `authoredFlags`, so an unchanged message keeps its original flag order.
 *
 * A group may also name flags that are not in `truth.flags` (P3 N-3: the sender's address on a
 * look-alike From line is senderTrust as much as lookalike_domain). Such a member is another name
 * for the same tell: ticking it credits the unit and is never a false claim, but it is never
 * reported missed on its own. The unit then carries `alternates: [those ids]` (the key is left out
 * when there are none). A group with no authored member produces no unit.
 */
export function flagUnits(authoredFlags, flagAlternatives) {
    const authored = [...new Set(authoredFlags || [])];
    const groups = (Array.isArray(flagAlternatives) ? flagAlternatives : []).filter(Array.isArray);
    const groupOf = new Map();
    for (const g of groups) {
        const members = g.filter((id) => authored.includes(id));
        if (!members.length) continue;
        const alternates = [...new Set(g.filter((id) => typeof id === 'string' && !authored.includes(id)))];
        const unit = alternates.length ? { members, alternates } : { members };
        for (const id of members) if (!groupOf.has(id)) groupOf.set(id, unit);
    }
    const seen = new Set();
    const units = [];
    for (const id of authored) {
        if (seen.has(id)) continue;
        const g = groupOf.get(id) || { members: [id] };
        for (const m of g.members) seen.add(m);
        const unit = { members: g.members, note: g.members[0] };
        if (g.alternates) unit.alternates = g.alternates;
        units.push(unit);
    }
    return units;
}

/** Every flag id that credits a unit: its authored members and any alternates. */
export function unitAccepts(unit) {
    return [...unit.members, ...(unit.alternates || [])];
}

export function scoreTriage({ messages, answers, profile = 'awareness', bands, passPercent } = {}) {
    if (!PROFILES.includes(profile)) throw new RangeError(`triage-scoring: unknown scoringProfile "${profile}"`);
    if (!Array.isArray(messages)) throw new TypeError('triage-scoring: messages must be an array');
    const byId = new Map();
    for (const a of answers || []) byId.set(a.id ?? a.messageId, a);

    const perMessage = [];
    const perFactor = {};
    const falseByFactor = {};
    const unanswered = [];
    let phishTotal = 0, phishCaught = 0, reportCount = 0, verifyCount = 0, falseAlarms = 0;
    let flagsCaught = 0, flagsAuthored = 0;
    const criticalMisses = [];
    const criticalKinds = [];
    let phishVerified = 0;

    for (const msg of messages) {
        const truth = msg.truth || {};
        const isPhish = !!truth.isPhish;
        const authoredFlags = [...new Set(truth.flags || [])];
        const a = byId.get(msg.id);
        if (!a) {
            unanswered.push(msg.id);
            perMessage.push({
                id: msg.id, isPhish, verdict: null, verdictPoints: 0, flagPoints: 0, score: 0,
                caught: [], missed: authoredFlags, falseClaims: [], answered: false,
            });
            continue;
        }
        const verdict = a.verdict;
        const kind = typeof msg.kind === 'string' && msg.kind ? msg.kind : 'email';
        const vPts = verdictPoints(profile, isPhish, verdict, kind);
        const ticked = [...new Set(a.flags || [])].filter((f) => f !== NONE_CHIP);
        const tickedSet = new Set(ticked);
        // Score by units, not raw flags: an alternatives group counts once (05 "Either tick
        // counts"). Without truth.flagAlternatives every flag is its own unit and this is
        // identical to one-flag-one-unit scoring.
        const units = flagUnits(authoredFlags, truth.flagAlternatives);
        const accepted = new Set(units.flatMap(unitAccepts));
        const unitCaught = (u) => unitAccepts(u).some((m) => tickedSet.has(m));
        const caught = ticked.filter((f) => accepted.has(f));
        const missed = units.filter((u) => !unitCaught(u)).map((u) => u.note);
        const falseClaims = ticked.filter((f) => !accepted.has(f));
        const caughtUnits = units.filter(unitCaught).length;
        const fPts = flagPoints(profile, isPhish, { caught: caughtUnits, falseClaims: falseClaims.length, authored: units.length });
        const score = roundHalfUp(vPts + fPts);
        const critical = isCriticalMiss(profile, isPhish, verdict, kind, truth.critical);
        if (critical) { criticalMisses.push(msg.id); criticalKinds.push(kind); }
        perMessage.push({
            id: msg.id, isPhish, verdict, verdictPoints: vPts, flagPoints: roundHalfUp(fPts), score,
            caught, missed, falseClaims, answered: true,
            // One line per tell for the review card and the debrief: a group shows once, under
            // the first member the learner ticked (or its note when none was ticked).
            units: units.map((u) => {
                const hit = unitAccepts(u).find((m) => tickedSet.has(m));
                return { note: u.note, caught: !!hit, shown: hit && u.members.includes(hit) ? hit : u.note };
            }),
            handledRight: vPts >= FULL_VERDICT_POINTS,
            critical,
        });

        for (const u of units) {
            const f = u.note;
            perFactor[f] = perFactor[f] || { caught: 0, missed: 0 };
            perFactor[f][unitCaught(u) ? 'caught' : 'missed'] += 1;
        }
        for (const f of falseClaims) falseByFactor[f] = (falseByFactor[f] || 0) + 1;

        if (verdict === 'verify') verifyCount += 1;
        if (isPhish) {
            phishTotal += 1;
            // Verify (or a verify-style action, such as Ring back) catches the phish: it scores
            // like Report and the card calls it sound. It is not a report, so reportCount stays
            // Report only (05 "Extensions for the awareness episodes").
            if (verdict === 'report' || verdict === 'delete' || verdict === 'verify') phishCaught += 1;
            if (verdict === 'report') reportCount += 1;
            if (verdict === 'verify') phishVerified += 1;
            flagsCaught += caughtUnits;
            flagsAuthored += units.length;
        } else if (verdict === 'report' || verdict === 'delete') {
            falseAlarms += 1;
        }
    }

    const mean = perMessage.length
        ? roundHalfUp(perMessage.reduce((s, m) => s + m.score, 0) / perMessage.length)
        : 0;
    const percent = Math.max(0, mean - CRITICAL_PENALTY * criticalMisses.length);
    let band = bandFor(percent, bands);
    const zeros = zeroSkills(perFactor);
    const zeroMisses = zeros.reduce((n, id) => n + perFactor[id].missed, 0);
    if (criticalMisses.length || zeroMisses >= ZERO_SKILL_MISSES_CAP) {
        // A critical miss, or three or more tells missed in skills never caught, caps the round below the top
        // band, whatever the percent: the top band says "you caught the phish and knew why".
        const sorted = [...(bands && bands.length ? bands : DEFAULT_BANDS)].sort((x, y) => y.min - x.min);
        if (sorted.length > 1 && band === sorted[0]) band = sorted[1];
    }

    return {
        profile,
        percent,
        headline: band.headline,
        pass: typeof passPercent === 'number' ? percent >= passPercent : null,
        perMessage,
        unanswered,
        phishCaught,
        phishTotal,
        reportCount,
        reportRate: phishTotal ? reportCount / phishTotal : 0,
        verifyCount,
        falseAlarms,
        showFalseAlarms: profile === 'analyst', // awareness records it but never shows it
        flagRecall: { caught: flagsCaught, total: flagsAuthored },
        perFactor,
        falseByFactor,
        // Real items given full verdict marks (Trust, Verify, or Report under awareness), so the
        // result grid counts exactly what the review cards call right (P3 N-2).
        realHandledRight: perMessage.filter((m) => m.answered && !m.isPhish && m.handledRight).length,
        realTotal: perMessage.filter((m) => !m.isPhish).length,
        criticalMisses,
        criticalKinds,
        criticalPenalty: CRITICAL_PENALTY * criticalMisses.length,
        // Phish answered Verify / Ring back: caught, but not reported (N7: the report line
        // read like a miss beside a near-perfect round).
        phishVerified,
        zeroSkills: zeros,
    };
}
