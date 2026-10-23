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
 * rounded to whole points (halves up) and the round percent is the mean of those, halves up.
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

/** Verdict points for one message. Throws on an unknown profile or verdict. */
export function verdictPoints(profile, isPhish, verdict) {
    const table = VERDICT_POINTS[profile];
    if (!table) throw new RangeError(`triage-scoring: unknown scoringProfile "${profile}"`);
    const pts = table[isPhish ? 'phish' : 'real'][verdict];
    if (pts === undefined) {
        throw new RangeError(`triage-scoring: verdict "${verdict}" is not available in the ${profile} profile`);
    }
    return pts;
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
 * The factor the player missed most, for the Result step's pointer (ties go to the factor met
 * first in `perFactor`). Returns null when nothing was missed.
 */
export function weakestFactor(perFactor) {
    let best = null;
    for (const [id, c] of Object.entries(perFactor || {})) {
        if (c.missed > 0 && (!best || c.missed > best.missed)) best = { id, caught: c.caught, missed: c.missed };
    }
    return best;
}

/**
 * Group a message's authored flags into scoring units, honouring `truth.flagAlternatives`
 * (05 "Either tick counts"). Some messages carry one tell that two flags can name — a look-alike
 * link is `lookalike_domain` or `linkCredible`; a look-alike From address is `lookalike_domain`
 * or `senderTrust`. An alternatives group names those flags so the pair is scored as one unit:
 * credited when any member is ticked, reported missed once under its first member's note.
 *
 * Each returned unit is { members: [authored flag ids, in group order], note: members[0] }. A flag
 * in no group is its own singleton unit, so a message without the field groups one flag per unit
 * and scores exactly as before. Only members listed in `authoredFlags` are kept; a group with no
 * authored member produces no unit. Units come out in the order the first member appears in
 * `authoredFlags`, so an unchanged message keeps its original flag order.
 */
export function flagUnits(authoredFlags, flagAlternatives) {
    const authored = [...new Set(authoredFlags || [])];
    const groups = (Array.isArray(flagAlternatives) ? flagAlternatives : []).filter(Array.isArray);
    const groupOf = new Map();
    for (const g of groups) {
        const members = g.filter((id) => authored.includes(id));
        if (members.length) for (const id of members) if (!groupOf.has(id)) groupOf.set(id, members);
    }
    const seen = new Set();
    const units = [];
    for (const id of authored) {
        if (seen.has(id)) continue;
        const members = groupOf.get(id) || [id];
        for (const m of members) seen.add(m);
        units.push({ members, note: members[0] });
    }
    return units;
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
        const vPts = verdictPoints(profile, isPhish, verdict);
        const ticked = [...new Set(a.flags || [])].filter((f) => f !== NONE_CHIP);
        const tickedSet = new Set(ticked);
        // Score by units, not raw flags: an alternatives group counts once (05 "Either tick
        // counts"). Without truth.flagAlternatives every flag is its own unit and this is
        // identical to one-flag-one-unit scoring.
        const units = flagUnits(authoredFlags, truth.flagAlternatives);
        const unitCaught = (u) => u.members.some((m) => tickedSet.has(m));
        const caught = authoredFlags.filter((f) => tickedSet.has(f));
        const missed = units.filter((u) => !unitCaught(u)).map((u) => u.note);
        const falseClaims = ticked.filter((f) => !authoredFlags.includes(f));
        const caughtUnits = units.filter(unitCaught).length;
        const fPts = flagPoints(profile, isPhish, { caught: caughtUnits, falseClaims: falseClaims.length, authored: units.length });
        const score = roundHalfUp(vPts + fPts);
        perMessage.push({
            id: msg.id, isPhish, verdict, verdictPoints: vPts, flagPoints: roundHalfUp(fPts), score,
            caught, missed, falseClaims, answered: true,
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
            flagsCaught += caughtUnits;
            flagsAuthored += units.length;
        } else if (verdict === 'report' || verdict === 'delete') {
            falseAlarms += 1;
        }
    }

    const percent = perMessage.length
        ? roundHalfUp(perMessage.reduce((s, m) => s + m.score, 0) / perMessage.length)
        : 0;
    const band = bandFor(percent, bands);

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
    };
}
