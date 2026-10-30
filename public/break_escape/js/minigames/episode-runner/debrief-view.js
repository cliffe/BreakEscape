// Awareness episodes: the debrief (11 stage 6, packet P7-B).
//
// renderDebrief(container, { result, set, strings, variant, onFinish, drillRecap, sandboxRecap, assistantRecap }) -> { destroy, getState }
// `drillRecap` (optional): the scored sort-drill cards the learner put in a wrong bin, each
// { situation, chosen, right, reason }. When non-empty, a "Cards to look at again" section lists
// them with the right bin and reason. Absent or empty draws nothing (E17 B2 finding).
//
// `result` is the triage gameResult (answers, percent, reportRate, verifyCount); `set` is the
// triage set, read for each message's subject and `truth`. One card per answer, then the
// "one thing to do on Monday" card and the no-blame line. On variant "defendOnly" the
// strings.defendOnly paragraph stands in for anything about the learner's own message.
// Two optional panels sit between the cards and the Monday card: strings.conceptPanel (E2's
// macro explainer) and strings.voicePanel (E4 and E7, copied voices). Each is plain text, or
// { heading, text } of plain text; a blank line in the text starts a new paragraph.
// Three optional deployment lines (the runner resolves them from social.awareness and the
// host page's breakEscapeConfig.awareness, episode-model.js awarenessSettings):
//   reportRoute  { heading, text, configured }: the "How to report here" box under the Monday
//                card (aw1, debrief.mondayCard "slot:customer_report_route");
//   ruleOfThumb  { heading?, text }: one line shared by every debrief, above the Monday card (aw4);
//   teamSize     the number of people on the learner's team, for the team line (aw6).
// The team line (aw6) says how many phish the learner reported or checked by another route
// ("kept the team safe"); it shows only when that is at least one, and never counts misses.
// getState() -> { items: number, mondayCard: boolean, noBlame: boolean,
//                 conceptPanel: boolean, voicePanel: boolean, reportRoute: 'configured' |
//                 'generic' | null, ruleOfThumb: boolean, teamProtected: number | null,
//                 genuine: { trusted, checked, flagged } | null }.
// The real items (disc_visible) follow the cards: the real ones trusted, what made each one
// treated as a phish safe, the cost of a false alarm and why both halves matter (buildGenuine).
// Every string goes in with textContent. The wording never blames the learner.

import { redFlagString, skillName } from '../inbox-triage/triage-flags.js';
import { weakestFactor, flagUnits, unitAccepts, genuineFeedback, genuineFeedbackText, verdictPoints, verdictPointsOverride, FULL_VERDICT_POINTS, dedupeSentences } from '../inbox-triage/triage-scoring.js';
import { kindOf, isNonEmail, actionById, kindVerdictLine, defaultSubject, choiceOptionFor, choiceText, verdictFeedbackOverride } from '../inbox-triage/triage-kinds.js';

const DEFAULTS = Object.freeze({
    heading: 'What happened',
    mondayCard: "What to do on Monday: if something looks wrong, report it through your organisation's usual route. Reporting is never wrong.",
    noBlameLine: 'Nobody here is being marked down for a miss. These messages are built to look right.',
    // P5-5: after a critical miss the result has just said what it cost, so the line owns the
    // points rather than denying them.
    noBlameLineCritical: 'These messages are built to fool careful people, so a miss here says more about the attack than about you. The points only show where to look next time.',
    defendOnly: 'This round is defence only. Anything you did not read the right way is picked out below.',
    allRight: 'You read every one of these the right way. Nothing to pick over here.',
    // Nothing needs a card, but a real one was reported: "every one the right way" would sit
    // oddly above the lines on it (disc_visible).
    allPhishRight: 'Every phish was caught, with every tell named.',
    finish: 'Finish'
});

// Headings for the optional panels when the episode gives text only.
const PANEL_HEADINGS = Object.freeze({
    conceptPanel: 'How it works',
    voicePanel: 'A voice is not proof'
});

const LINES = Object.freeze({
    phish: {
        report: 'Reported. That warns everyone else.',
        verify: 'You checked first. That is a sound habit.',
        delete: 'Safe, but not reported. Deleting protects you; reporting warns everyone else.',
        trust: 'This one was built to look right. Here is what to look for next time.'
    },
    real: {
        trust: 'Right call. This one was real.',
        report: "Good instinct; here is why this one was safe. Reporting when you are unsure is never wrong.",
        verify: 'Checking first is fine. This one was real.',
        // F-E13-3: the right call named for a deleted real item is Trust or Verify, so the line no
        // longer recommends reporting (which contradicted it); it names the cost of binning real mail.
        delete: 'This one was real. Deleting real mail can lose it, and the work it needed waits.'
    }
});

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;
const str = (strings, key) => (isObj(strings) && typeof strings[key] === 'string' && strings[key]) ? strings[key] : DEFAULTS[key];

function messageFor(set, id) {
    const list = Array.isArray(set?.messages) ? set.messages : [];
    return list.find((m) => isObj(m) && m.id === id) || null;
}

function titleOf(msg, id) {
    if (!isObj(msg)) return id;
    const subject = isStr(msg.subject) ? msg.subject : '';
    const who = isObj(msg.from) ? (msg.from.name || msg.from.address || '') : (typeof msg.from === 'string' ? msg.from : '');
    // A call, voicemail, text, QR notice, page or prompt has no From/subject: use the caller or
    // a kind-appropriate title, never the raw message id (D2/E3-5).
    if (isNonEmail(kindOf(msg))) {
        const caller = isStr(msg.callerId) ? msg.callerId : who;
        return caller || subject || defaultSubject(msg) || id;
    }
    if (subject && who && who !== subject && msg.kind && msg.kind !== 'email') return `${who} · ${subject}`;
    return subject || who || id;
}

/**
 * The word for what the learner did and the line that follows it, in the set's own vocabulary:
 * a call or sign-in prompt uses its action labels (Ring back, Escalate, Deny and report) and
 * its own review lines, not the email verdicts (D3).
 */
function verdictWordAndLine(answer, msg, phish, labels = null, scoring = null) {
    const kind = kindOf(msg);
    if (kind === 'choice') {
        // An authored-choice card (ENG-09a): the option's own label, then right or wrong, not the email verdicts.
        const right = wrongVerdict(answer, msg, 'awareness', scoring) === false;
        return { word: choiceOptionFor(msg, answer.action, answer.verdict)?.label || String(answer.verdict ?? ''),
            line: choiceText(right ? 'right' : 'wrong', labels) };
    }
    if (kind === 'call' || kind === 'push') {
        const action = actionById(kind, answer.action, answer.verdict, labels);
        // batch-6 (item over set): an item's own kindLine wins over the set's labels.verdictFeedback
        // here too, as it does on the email path below, so a genuine-but-report caller is not
        // described as a phish by a set-wide feedback line.
        const callKindLine = phish && answer.verdict === 'trust' && isObj(msg?.truth) && isStr(msg.truth.kindLine) ? msg.truth.kindLine : null;
        return { word: action.label,
            line: callKindLine ? `${callKindLine} Here is what to look for next time.`
                : (verdictFeedbackOverride(labels, answer.verdict, phish) || kindVerdictLine(kind, phish, answer.verdict) || '') };
    }
    // truth.kindLine (optional): what a genuine-but-report item really was, in place of "built to look right".
    const kindLine = phish && answer.verdict === 'trust' && isObj(msg?.truth) && isStr(msg.truth.kindLine) ? msg.truth.kindLine : null;
    // F-E10-2: name the verdict with the set's relabelled label (not the engine word "Delete"),
    // and let the set override the feedback line per verdict so it does not leak "Deleting".
    const word = actionById('email', answer.action, answer.verdict, labels).label || String(answer.verdict ?? '');
    const fb = verdictFeedbackOverride(labels, answer.verdict, phish);
    return { word,
        line: kindLine ? `${kindLine} Here is what to look for next time.` : (fb || LINES[phish ? 'phish' : 'real'][answer.verdict] || '') };
}

/**
 * Whether an item is worth a review card (Cut A): the learner did not get full marks on it
 * (a wrong verdict or a missed tell both drop the score below 100). Without a per-message
 * score, fall back to the verdict and the authored flags.
 */
function reviewNeeded(answer, msg) {
    if (Number.isFinite(answer?.score)) return answer.score < 100;
    const truth = isObj(msg?.truth) ? msg.truth : {};
    const phish = truth.isPhish === true;
    const v = answer?.verdict;
    const verdictRight = phish ? (v === 'report' || v === 'verify') : (v === 'trust' || v === 'verify');
    if (!verdictRight) return true;
    if (phish && Array.isArray(truth.flags)) {
        const picked = new Set(Array.isArray(answer.flags) ? answer.flags : []);
        return flagUnits(truth.flags, truth.flagAlternatives).some((u) => !unitAccepts(u).some((m) => picked.has(m)));
    }
    return false;
}

/**
 * Whether the learner's verdict on an item fell short of full marks: a phish trusted or
 * deleted, a real one deleted, a genuine caller complied with unchecked. A missed tick alone
 * is not a wrong verdict.
 */
function wrongVerdict(answer, msg, profile, scoring = null) {
    if (!isStr(answer?.verdict)) return false;
    const phish = answer.isPhish === true || (isObj(msg?.truth) && msg.truth.isPhish === true);
    const kind = kindOf(msg);
    try {
        return verdictPoints(profile, phish, answer.verdict, kind, verdictPointsOverride(msg?.truth, kind, scoring, phish)) < FULL_VERDICT_POINTS;
    } catch (e) {
        return false;
    }
}

function buildCard(answer, msg, set = null) {
    const truth = isObj(msg?.truth) ? msg.truth : { isPhish: false, flags: [] };
    const phish = truth.isPhish === true;
    const verdict = answer.verdict;
    const card = el('article', 'aw-card');
    card.dataset.messageId = answer.id;
    const title = el('h3', 'aw-card-title', titleOf(msg, answer.id));
    title.tabIndex = -1;
    card.appendChild(title);
    const { word, line } = verdictWordAndLine(answer, msg, phish, set?.labels, set?.scoring);
    card.appendChild(el('p', 'aw-card-verdict', `You chose ${word}. ${line}`.trim()));

    const picked = new Set(Array.isArray(answer.flags) ? answer.flags : []);
    const notes = isObj(truth.perFlagNote) ? truth.perFlagNote : {};
    if (phish && Array.isArray(truth.flags) && truth.flags.length) {
        const ul = el('ul', 'aw-flags');
        // One line per tell: an either-tick group (truth.flagAlternatives) is listed once, under
        // the member the learner ticked, else its first member, as the message feedback does (P3 N6).
        for (const unit of flagUnits(truth.flags, truth.flagAlternatives)) {
            const hit = unitAccepts(unit).find((m) => picked.has(m));
            const caught = !!hit;
            const id = hit && unit.members.includes(hit) ? hit : unit.note;
            const li = el('li', `aw-flag ${caught ? 'aw-flag-caught' : 'aw-flag-missed'}`);
            li.dataset.flag = id;
            const sentence = redFlagString(id, msg, set);
            li.append(el('span', 'aw-flag-word', caught ? 'Spotted: ' : 'Look for: '),
                el('span', 'aw-flag-text', typeof notes[id] === 'string' && notes[id] ? `${sentence} (${notes[id]})` : sentence));
            ul.appendChild(li);
        }
        card.appendChild(ul);
    }
    if (!phish && isObj(truth.whyFine)) {
        let lines = Object.entries(truth.whyFine)
            .filter(([k, v]) => k !== 'default' && typeof v === 'string' && v).map(([, v]) => v);
        if (typeof truth.whyFine.default === 'string' && truth.whyFine.default) lines.push(truth.whyFine.default);
        lines = dedupeSentences(lines); // P5-9: each sentence once
        if (lines.length) {
            const ul = el('ul', 'aw-why-fine');
            ul.setAttribute('aria-label', 'Why this one was fine');
            for (const l of lines) ul.appendChild(el('li', null, l));
            card.appendChild(ul);
        }
    }
    if (kindOf(msg) === 'choice') {
        // The right pick shows why (reportReply); a wrong one shows the better option and what could go wrong.
        const right = wrongVerdict(answer, msg, 'awareness', set?.scoring) === false;
        const labels = set?.labels;
        if (right && typeof truth.reportReply === 'string' && truth.reportReply) {
            card.appendChild(el('p', 'aw-if-trusted', `${choiceText('whyRight', labels)}: ${truth.reportReply}`));
        } else if (!right) {
            const best = (Array.isArray(msg?.choice?.options) ? msg.choice.options : [])
                .find((o) => isObj(o) && o.verdict === truth.correct);
            if (best && isStr(best.label)) card.appendChild(el('p', 'aw-choice-better', `${choiceText('better', labels)}: ${best.label}`));
            if (typeof truth.ifTrusted === 'string' && truth.ifTrusted) {
                card.appendChild(el('p', 'aw-if-trusted', `${choiceText('ifWrong', labels)}: ${truth.ifTrusted}`));
            }
        }
    } else if (phish && (verdict === 'trust' || verdict === 'delete') && typeof truth.ifTrusted === 'string' && truth.ifTrusted) {
        // E12 B2 finding 14: show "what they were after" only when the verdict actually let the
        // attacker in. Trust on a phish always does; a Delete / Turn away does only when it did
        // not earn full verdict points (E12 scores a desk visitor turned away at the full 60, so
        // the attacker was stopped and the line would read oddly).
        const kind = kindOf(msg) || 'email';
        const profile = set?.scoringProfile === 'analyst' ? 'analyst' : 'awareness';
        const deletePts = verdictPoints(profile, true, 'delete', kind, verdictPointsOverride(truth, kind, set?.scoring, true));
        const attackerIn = verdict === 'trust' || deletePts < FULL_VERDICT_POINTS;
        if (attackerIn) {
            const lead = verdict === 'trust' ? 'What could have happened'
                : (kind === 'call' ? 'What this caller was after' : 'What this one was after');
            card.appendChild(el('p', 'aw-if-trusted', `${lead}: ${truth.ifTrusted}`));
        }
    }
    if (Number.isFinite(answer.score)) card.appendChild(el('p', 'aw-card-score', `Score for this message: ${answer.score} of 100`));
    return card;
}

/**
 * An optional plain-text panel (strings.conceptPanel, strings.voicePanel), or null. `raw` is the
 * panel's value when given (ENG-09b: one entry of a conceptPanel array), else strings[key].
 */
function buildPanel(strings, key, raw = isObj(strings) ? strings[key] : null) {
    const text = typeof raw === 'string' ? raw : (isObj(raw) && typeof raw.text === 'string' ? raw.text : '');
    if (!text.trim()) return null;
    const heading = isObj(raw) && typeof raw.heading === 'string' && raw.heading.trim() ? raw.heading : PANEL_HEADINGS[key];
    const cls = key === 'voicePanel' ? 'aw-voice-panel' : 'aw-concept-panel';
    const panel = el('aside', `aw-panel ${cls}`);
    panel.setAttribute('aria-label', heading);
    panel.appendChild(el('h3', 'aw-panel-heading', heading));
    for (const para of text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)) {
        panel.appendChild(el('p', 'aw-panel-text', para));
    }
    return panel;
}

/**
 * aw6: phish reported or checked by another route this round. A stored `teamProtected` (the
 * debrief reopened from the state global) wins; else the result's reportCount + phishVerified.
 */
function teamProtectedOf(result) {
    const n = (v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : null);
    if (!isObj(result)) return null;
    if (n(result.teamProtected) !== null) return n(result.teamProtected);
    if (n(result.reportCount) === null) return null;
    return n(result.reportCount) + (n(result.phishVerified) ?? 0);
}

/**
 * The team line (aw6), or '' when there is nothing to thank the learner for. `template` is the
 * optional strings.teamLine override (aw-ux2): `{n}` becomes the count and `{team}` the team size.
 * A template that uses {team} when no team size is set falls back to the default wording.
 */
export function teamLine(count, teamSize, template = null) {
    if (!Number.isFinite(count) || count < 1) return '';
    const sized = Number.isInteger(teamSize) && teamSize >= 2;
    if (typeof template === 'string' && template.trim() && (sized || !template.includes('{team}'))) {
        return template.replace(/\{n\}/g, String(count)).replace(/\{team\}/g, String(teamSize));
    }
    const what = count === 1 ? 'one phish' : `${count} phish`;
    return sized
        ? `Your reports and checks this round kept ${what} away from the ${teamSize} people on your team.`
        : `Your reports and checks this round kept ${what} away from the rest of your team.`;
}

/**
 * The real items (FUN_DECISIONS disc_visible): which real ones the learner trusted, what made each
 * one they treated as a phish safe, the cost of a false alarm and why both halves matter. An item
 * with a card above points at it rather than repeating its "why this one was fine" lines. Three or
 * more items fold into a <details>. Returns { node, trusted, flagged } or null.
 */
function buildGenuine(set, answers, reviewedIds, profile) {
    const messages = Array.isArray(set?.messages) ? set.messages.filter(isObj) : [];
    const fb = genuineFeedback({
        messages, answers, profile, scoring: set?.scoring,
        titleOf: (m) => titleOf(m, m.id),
        actionLabel: (m, a) => verdictWordAndLine(a, m, false, set?.labels, set?.scoring).word,
        actionPast: (m, a) => actionById(kindOf(m) === 'call' || kindOf(m) === 'push' ? kindOf(m) : 'email', a.action, a.verdict, set?.labels).past
    });
    const text = fb ? genuineFeedbackText(fb, { detail: true, strings: set?.genuineCopy }) : null;
    if (!text) return null;
    const box = el('section', 'aw-genuine');
    box.setAttribute('aria-label', 'The real ones');
    if (text.trusted) box.appendChild(el('p', 'aw-genuine-trusted', text.trusted));
    if (text.items.length) {
        const ul = el('ul', 'aw-genuine-list');
        for (const f of fb.flagged) {
            const line = reviewedIds.has(f.id)
                ? `‘${f.title}’ (you chose ${f.action}). Its card above says what made it safe.${f.cost ? ` ${f.cost}` : ''}`
                : text.items.find((it) => it.id === f.id)?.text || '';
            const li = el('li', 'aw-genuine-item', line);
            li.dataset.genuineId = f.id; // not data-message-id, which marks a card
            ul.appendChild(li);
        }
        if (fb.flagged.length > 2) {
            const d = el('details', 'aw-genuine-fold');
            d.append(el('summary', 'aw-genuine-flagged', text.flaggedLead), ul);
            box.appendChild(d);
        } else {
            box.append(el('p', 'aw-genuine-flagged', text.flaggedLead), ul);
        }
    }
    if (text.cost) box.appendChild(el('p', 'aw-genuine-cost', text.cost));
    if (text.why) box.appendChild(el('p', 'aw-genuine-why', text.why));
    return { node: box, trusted: fb.trusted.length, checked: (fb.checked || []).length, flagged: fb.flagged.length };
}

function textBox(tag, className, label, block) {
    const box = el(tag, className);
    box.setAttribute('aria-label', label);
    if (block.heading) box.appendChild(el('h3', `${className}-heading`, block.heading));
    for (const para of block.text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)) {
        box.appendChild(el('p', `${className}-text`, para));
    }
    return box;
}

export function renderDebrief(container, { result, set, strings = {}, variant = 'full', onFinish,
    reportRoute = null, ruleOfThumb = null, teamSize = null, drillRecap = [], sandboxRecap = [], assistantRecap = [] } = {}) {
    const root = el('section', 'aw-debrief');
    const heading = el('h2', 'aw-heading', DEFAULTS.heading);
    heading.tabIndex = -1;
    root.appendChild(heading);

    // Cut A: the learner read the full reasoning for every item in immediate feedback, so the
    // debrief dwells only on what they got wrong. These drive the cards below and the "nothing
    // missed" line; computed up front so the defendOnly lead is not shown on a clean round.
    const answers = Array.isArray(result?.answers) ? result.answers.filter(isObj) : [];
    const reviewed = answers.filter((a) => reviewNeeded(a, messageFor(set, a.id)));

    // The defendOnly lead stands in for the write-stage recap, but its wording points at "the ones
    // you were caught out by ... shown below" (E19 m-2); on a clean round (answers, nothing to
    // review) nothing is below and the "nothing to pick over here" line carries it instead, so the
    // lead is suppressed there. With no answers at all (nothing carries it) it still shows.
    const cleanRound = reviewed.length === 0 && answers.length > 0;
    if (variant === 'defendOnly' && !cleanRound) root.appendChild(el('p', 'aw-lead aw-defend-only', str(strings, 'defendOnly')));

    const summary = el('p', 'aw-summary');
    const bits = [];
    if (Number.isFinite(result?.percent)) bits.push(`Round score: ${result.percent}%`);
    // F-E10-2: the triage result card above the debrief already shows the band headline as its
    // title, so the debrief summary does not repeat it ("Round score: N% — headline" alongside the
    // same headline read as a duplication). The summary keeps the score and the caught counts.
    // N7: "Reported 67% of the phish" beside a 97% round read as a miss. With the counts to hand,
    // say how many phish were caught and how: reported, checked by another route (Verify, Ring
    // back) or deleted. All three are catches.
    const total = Number(result?.phishTotal);
    if (Number.isFinite(total) && total > 0 && Number.isFinite(result?.phishCaught)) {
        const reported = Number.isFinite(result.reportCount) ? result.reportCount : Math.round((result.reportRate || 0) * total);
        const checked = Number.isFinite(result.phishVerified) ? result.phishVerified : 0;
        // E8 F6 / E13 F-10: a caught phish handled with a safe refuse is not a "delete" — a push
        // Deny and a call Refuse (both verdict 'delete') read as denied / turned away, never
        // "deleted". Count the delete-verdict catches by kind from the answers when they carry
        // the detail; fall back to the old residual (labelled "deleted") when they do not.
        const residual = Math.max(0, result.phishCaught - reported - checked);
        let denied = 0, refused = 0, deleted = residual;
        const deleteCatches = answers.filter((a) => a.isPhish === true && a.verdict === 'delete');
        if (deleteCatches.length) {
            denied = 0; refused = 0; deleted = 0;
            for (const a of deleteCatches) {
                const k = kindOf(messageFor(set, a.id));
                if (k === 'push') denied += 1;
                else if (k === 'call') refused += 1;
                else deleted += 1;
            }
            // Keep the sum consistent with phishCaught if the counts and residual disagree (stored
            // reopen without per-answer detail): trust the residual as the "deleted" bucket.
            if (denied + refused + deleted !== residual && !answers.some((a) => a.isPhish === true)) {
                denied = 0; refused = 0; deleted = residual;
            }
        }
        const how = [];
        if (reported) how.push(`${reported} reported`);
        if (checked) how.push(`${checked} checked by another route`);
        if (refused) how.push(`${refused} turned away`);
        if (denied) how.push(`${denied} denied`);
        if (deleted) how.push(`${deleted} deleted`);
        // batch-5 (E17): the counter label follows the set's labels.phishCaughtLabel, as the result
        // grid does, so a non-phishing set ("Requests handled") reads the same in the debrief.
        const caughtLabel = isObj(set?.labels) && isStr(set.labels.phishCaughtLabel) ? set.labels.phishCaughtLabel : 'Phish caught';
        bits.push(`${caughtLabel}: ${result.phishCaught} of ${total}${how.length ? ` (${how.join(', ')})` : ''}`);
    } else if (!(Number.isFinite(total) && total === 0)) {
        // batch-6 C3: "Reported N% of the phish" is overridable (strings.reportedPct, {pct}) and
        // hidden entirely when the set has no phish at all (total 0), where the line is meaningless.
        if (Number.isFinite(result?.reportRate)) {
            const pct = Math.round(result.reportRate * 100);
            // batch-8: the set's resultCopy.reportedPct is the single source shared with the reopened
            // result card (inbox-triage-minigame.js); the debrief's own strings.reportedPct still wins
            // where it is set, then the default. {pct} is the percentage.
            const fromSet = isObj(set?.resultCopy) && isStr(set.resultCopy.reportedPct) ? set.resultCopy.reportedPct : null;
            const tmpl = fromSet || (isObj(strings) && isStr(strings.reportedPct) ? strings.reportedPct : 'Reported {pct}% of the phish');
            bits.push(tmpl.replace(/\{pct\}/g, String(pct)));
        }
        if (Number.isFinite(result?.verifyCount) && result.verifyCount > 0) bits.push(`Checked by another route: ${result.verifyCount}`);
    }
    summary.textContent = bits.join('. ');
    if (bits.length) root.appendChild(summary);

    // A card per missed item, then one weakest-skill line; if nothing was missed, one short line
    // says so. The score summary, panels, Monday card and no-blame line stay. (`answers` and
    // `reviewed` were computed above, before the defendOnly lead.)
    const cards = el('div', 'aw-cards');
    for (const a of reviewed) cards.appendChild(buildCard(a, messageFor(set, a.id), set));
    root.appendChild(cards);

    if (reviewed.length) {
        const weak = weakestFactor(isObj(result?.perFactor) ? result.perFactor : {});
        if (weak && weak.missed > 0) {
            const ids = Array.isArray(weak.ties) && weak.ties.length ? weak.ties : [weak.id];
            const counts = `caught ${weak.caught} of ${weak.caught + weak.missed}`;
            const names = ids.map((id) => skillName(id, set));
            // batch-8: the "tell(s) most often missed" frame is overridable (strings.weakestTell /
            // weakestTells, with {names} and {counts}) for a non-phishing set where "tell" reads as
            // phishing jargon; the skill names themselves already follow set.skillNames. Default unchanged.
            const one = names.length === 1;
            const joined = one ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
            const tmpl = one
                ? (isObj(strings) && isStr(strings.weakestTell) ? strings.weakestTell : 'The tell most often missed: {names} ({counts}).')
                : (isObj(strings) && isStr(strings.weakestTells) ? strings.weakestTells : 'The tells most often missed: {names} ({counts} each).');
            root.appendChild(el('p', 'aw-weakest', tmpl.replace(/\{names\}/g, joined).replace(/\{counts\}/g, counts)));
        }
    }
    // disc_visible: the real items, after the cards it may point at.
    const genuine = set?.genuineFeedback === false ? null
        : buildGenuine(set, answers, new Set(reviewed.map((a) => a.id)), set?.scoringProfile === 'analyst' ? 'analyst' : 'awareness');
    if (!reviewed.length && answers.length) {
        root.appendChild(el('p', 'aw-all-right', genuine?.flagged ? str(strings, 'allPhishRight') : str(strings, 'allRight')));
    }
    if (genuine) root.appendChild(genuine.node);

    // E17 B2 finding: recap the scored sort-drill cards the learner put in the wrong bin, with the
    // right bin and the reason. Present only when the episode ran a scored drill with misses.
    const recapList = Array.isArray(drillRecap) ? drillRecap.filter((r) => isObj(r) && isStr(r.situation)) : [];
    if (recapList.length) {
        const box = el('section', 'aw-drill-recap');
        box.setAttribute('aria-label', 'Cards to look at again');
        box.appendChild(el('h3', 'aw-drill-recap-title',
            isObj(strings) && isStr(strings.drillRecapHeading) ? strings.drillRecapHeading : 'Cards to look at again'));
        const ul = el('ul', 'aw-drill-recap-list');
        for (const r of recapList) {
            const li = el('li', 'aw-drill-recap-item');
            li.appendChild(el('p', 'aw-drill-recap-situation', r.situation));
            if (isStr(r.chosen) && isStr(r.right) && r.chosen && r.right) {
                li.appendChild(el('p', 'aw-drill-recap-move', `You put this in ${r.chosen}. It goes in ${r.right}.`));
            }
            if (isStr(r.reason) && r.reason) li.appendChild(el('p', 'aw-drill-recap-reason', r.reason));
            ul.appendChild(li);
        }
        box.appendChild(ul);
        root.appendChild(box);
    }

    // E13 B2 finding 11 / E11 B2 finding 5: recap the other scored-or-chosen stages the learner
    // got wrong, the same shape as the drill recap, so the debrief is not only about the inbox.
    // Each list is { situation, chosen?, right?, reason? }; the move line and heading are
    // overridable, and an absent or empty list renders nothing (so defend-only, which runs
    // neither stage, is unaffected). `move` is a template with {chosen}/{right}.
    const recapSection = (list, { cls, headingKey, headingDefault, moveKey, moveDefault }) => {
        const items = Array.isArray(list) ? list.filter((r) => isObj(r) && isStr(r.situation)) : [];
        if (!items.length) return 0;
        const box = el('section', cls);
        const heading = isObj(strings) && isStr(strings[headingKey]) ? strings[headingKey] : headingDefault;
        box.setAttribute('aria-label', heading);
        box.appendChild(el('h3', `${cls}-title`, heading));
        const moveTmpl = isObj(strings) && isStr(strings[moveKey]) ? strings[moveKey] : moveDefault;
        const ul = el('ul', `${cls}-list`);
        for (const r of items) {
            const li = el('li', `${cls}-item`);
            li.appendChild(el('p', `${cls}-situation`, r.situation));
            if (isStr(r.chosen) && r.chosen && isStr(r.right) && r.right) {
                li.appendChild(el('p', `${cls}-move`, moveTmpl.split('{chosen}').join(r.chosen).split('{right}').join(r.right)));
            }
            if (isStr(r.reason) && r.reason) li.appendChild(el('p', `${cls}-reason`, r.reason));
            ul.appendChild(li);
        }
        box.appendChild(ul);
        root.appendChild(box);
        return items.length;
    };
    const sandboxShown = recapSection(sandboxRecap, {
        cls: 'aw-sandbox-recap', headingKey: 'sandboxRecapHeading', headingDefault: 'Choices worth a second look',
        moveKey: 'sandboxRecapMove', moveDefault: 'You chose ‘{chosen}’. The safer move was ‘{right}’.' });
    const assistantShown = recapSection(assistantRecap, {
        cls: 'aw-assistant-recap', headingKey: 'assistantRecapHeading', headingDefault: 'In the assistant window',
        moveKey: 'assistantRecapMove', moveDefault: 'You chose ‘{chosen}’. The safer move was ‘{right}’.' });

    // ENG-09b: conceptPanel may be an array of { heading?, text }, drawn in order; an entry with
    // no text is skipped. A string or one object draws one panel, exactly as before.
    const conceptRaw = isObj(strings) ? strings.conceptPanel : null;
    const conceptList = Array.isArray(conceptRaw)
        ? conceptRaw.map((r) => buildPanel(strings, 'conceptPanel', r)).filter(Boolean)
        : [buildPanel(strings, 'conceptPanel')].filter(Boolean);
    const concept = conceptList.length > 0;
    for (const panel of conceptList) root.appendChild(panel);
    const voice = buildPanel(strings, 'voicePanel');
    if (voice) root.appendChild(voice);

    // aw6: a thank-you for the phish the learner kept from the team. Positive only: no
    // denominator and nothing about what was missed.
    const team = teamProtectedOf(result);
    const teamText = teamLine(team, teamSize, isObj(strings) ? strings.teamLine : null);
    if (teamText) root.appendChild(el('p', 'aw-team', teamText));

    // aw4: one rule of thumb, the same in every debrief of a deployment.
    const rule = isObj(ruleOfThumb) && isStr(ruleOfThumb.text) ? ruleOfThumb : null;
    if (rule) root.appendChild(textBox('aside', 'aw-rule', rule.heading || 'The habit to keep', rule));

    const monday = el('aside', 'aw-monday', str(strings, 'mondayCard'));
    monday.setAttribute('aria-label', 'One thing to do on Monday');
    root.appendChild(monday);
    // aw1: the organisation's own route to report, or the generic "find out how" line.
    const route = isObj(reportRoute) && isStr(reportRoute.text) ? reportRoute : null;
    if (route) {
        const box = textBox('aside', 'aw-report-route', 'How to report here', { heading: route.heading || 'How to report here', text: route.text });
        box.dataset.configured = route.configured === true ? 'true' : 'false';
        root.appendChild(box);
    }
    // The no-blame line answers a miss; after a round with nothing missed it read oddly
    // ("A miss here is no reflection on you" under 100%: N-17), and after a missed tick alone it
    // read oddly at 98% (P5-15), so it shows only after a wrong verdict. After a critical miss
    // the result has just said what it cost, so a line that owns the points stands in (P5-5).
    const profile = set?.scoringProfile === 'analyst' ? 'analyst' : 'awareness';
    const noBlame = !answers.length || answers.some((a) => wrongVerdict(a, messageFor(set, a.id), profile, set?.scoring));
    const critical = Array.isArray(result?.criticalMisses) && result.criticalMisses.length > 0;
    if (noBlame) {
        root.appendChild(el('p', `aw-no-blame${critical ? ' aw-no-blame-critical' : ''}`,
            str(strings, critical ? 'noBlameLineCritical' : 'noBlameLine')));
    }

    const finish = el('button', 'aw-button aw-finish', DEFAULTS.finish);
    finish.type = 'button';
    finish.addEventListener('click', () => { if (typeof onFinish === 'function') onFinish(); });
    root.appendChild(finish);
    container.appendChild(root);

    return {
        destroy() { root.remove(); },
        getState() {
            return { items: reviewed.length, mondayCard: true, noBlame, conceptPanel: concept, voicePanel: !!voice,
                ...(recapList.length ? { drillRecap: recapList.length } : {}),
                ...(sandboxShown ? { sandboxRecap: sandboxShown } : {}),
                ...(assistantShown ? { assistantRecap: assistantShown } : {}),
                ...(Array.isArray(conceptRaw) ? { conceptPanels: conceptList.length } : {}),
                reportRoute: route ? (route.configured === true ? 'configured' : 'generic') : null,
                ruleOfThumb: !!rule, teamProtected: teamText ? team : null,
                genuine: genuine ? { trusted: genuine.trusted, checked: genuine.checked, flagged: genuine.flagged } : null };
        }
    };
}
