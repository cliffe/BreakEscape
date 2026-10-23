// Awareness episodes: the debrief (11 stage 6, packet P7-B).
//
// renderDebrief(container, { result, set, strings, variant, onFinish }) -> { destroy, getState }
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
//                 genuine: { trusted, flagged } | null }.
// The real items (disc_visible) follow the cards: the real ones trusted, what made each one
// treated as a phish safe, the cost of a false alarm and why both halves matter (buildGenuine).
// Every string goes in with textContent. The wording never blames the learner.

import { redFlagString, skillName } from '../inbox-triage/triage-flags.js';
import { weakestFactor, flagUnits, unitAccepts, genuineFeedback, genuineFeedbackText } from '../inbox-triage/triage-scoring.js';
import { kindOf, isNonEmail, actionById, kindVerdictLine, defaultSubject } from '../inbox-triage/triage-kinds.js';

const DEFAULTS = Object.freeze({
    heading: 'What happened',
    mondayCard: "What to do on Monday: if something looks wrong, report it through your organisation's usual route. Reporting is never wrong.",
    noBlameLine: 'Nobody here is being marked down for a miss. These messages are built to look right.',
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

const VERDICT_WORD = Object.freeze({ trust: 'Trust', report: 'Report', delete: 'Delete', verify: 'Verify' });

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
        delete: 'This one was real. If you are unsure, reporting is safer than deleting.'
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
function verdictWordAndLine(answer, msg, phish) {
    const kind = kindOf(msg);
    if (kind === 'call' || kind === 'push') {
        const action = actionById(kind, answer.action, answer.verdict);
        return { word: action.label, line: kindVerdictLine(kind, phish, answer.verdict) || '' };
    }
    return { word: VERDICT_WORD[answer.verdict] || String(answer.verdict ?? ''),
        line: LINES[phish ? 'phish' : 'real'][answer.verdict] || '' };
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

function buildCard(answer, msg) {
    const truth = isObj(msg?.truth) ? msg.truth : { isPhish: false, flags: [] };
    const phish = truth.isPhish === true;
    const verdict = answer.verdict;
    const card = el('article', 'aw-card');
    card.dataset.messageId = answer.id;
    const title = el('h3', 'aw-card-title', titleOf(msg, answer.id));
    title.tabIndex = -1;
    card.appendChild(title);
    const { word, line } = verdictWordAndLine(answer, msg, phish);
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
            const sentence = redFlagString(id, msg);
            li.append(el('span', 'aw-flag-word', caught ? 'Spotted: ' : 'Look for: '),
                el('span', 'aw-flag-text', typeof notes[id] === 'string' && notes[id] ? `${sentence} (${notes[id]})` : sentence));
            ul.appendChild(li);
        }
        card.appendChild(ul);
    }
    if (!phish && isObj(truth.whyFine)) {
        const lines = Object.entries(truth.whyFine)
            .filter(([k, v]) => k !== 'default' && typeof v === 'string' && v).map(([, v]) => v);
        if (typeof truth.whyFine.default === 'string' && truth.whyFine.default) lines.push(truth.whyFine.default);
        if (lines.length) {
            const ul = el('ul', 'aw-why-fine');
            ul.setAttribute('aria-label', 'Why this one was fine');
            for (const l of lines) ul.appendChild(el('li', null, l));
            card.appendChild(ul);
        }
    }
    if (phish && (verdict === 'trust' || verdict === 'delete') && typeof truth.ifTrusted === 'string' && truth.ifTrusted) {
        const lead = verdict === 'trust' ? 'What could have happened'
            : (kindOf(msg) === 'call' ? 'What this caller was after' : 'What this one was after');
        card.appendChild(el('p', 'aw-if-trusted', `${lead}: ${truth.ifTrusted}`));
    }
    if (Number.isFinite(answer.score)) card.appendChild(el('p', 'aw-card-score', `Score for this message: ${answer.score} of 100`));
    return card;
}

/** An optional plain-text panel (strings.conceptPanel, strings.voicePanel), or null. */
function buildPanel(strings, key) {
    const raw = isObj(strings) ? strings[key] : null;
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

/** The team line (aw6), or '' when there is nothing to thank the learner for. */
export function teamLine(count, teamSize) {
    if (!Number.isFinite(count) || count < 1) return '';
    const what = count === 1 ? 'one phish' : `${count} phish`;
    return Number.isInteger(teamSize) && teamSize >= 2
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
        messages, answers, profile,
        titleOf: (m) => titleOf(m, m.id),
        actionLabel: (m, a) => verdictWordAndLine(a, m, false).word
    });
    const text = fb ? genuineFeedbackText(fb, { detail: true }) : null;
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
    return { node: box, trusted: fb.trusted.length, flagged: fb.flagged.length };
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
    reportRoute = null, ruleOfThumb = null, teamSize = null } = {}) {
    const root = el('section', 'aw-debrief');
    const heading = el('h2', 'aw-heading', DEFAULTS.heading);
    heading.tabIndex = -1;
    root.appendChild(heading);

    if (variant === 'defendOnly') root.appendChild(el('p', 'aw-lead aw-defend-only', str(strings, 'defendOnly')));

    const summary = el('p', 'aw-summary');
    const bits = [];
    if (Number.isFinite(result?.percent)) bits.push(`Round score: ${result.percent}%`);
    if (typeof result?.headline === 'string' && result.headline) bits.push(result.headline);
    // N7: "Reported 67% of the phish" beside a 97% round read as a miss. With the counts to hand,
    // say how many phish were caught and how: reported, checked by another route (Verify, Ring
    // back) or deleted. All three are catches.
    const total = Number(result?.phishTotal);
    if (Number.isFinite(total) && total > 0 && Number.isFinite(result?.phishCaught)) {
        const reported = Number.isFinite(result.reportCount) ? result.reportCount : Math.round((result.reportRate || 0) * total);
        const checked = Number.isFinite(result.phishVerified) ? result.phishVerified : 0;
        const deleted = Math.max(0, result.phishCaught - reported - checked);
        const how = [];
        if (reported) how.push(`${reported} reported`);
        if (checked) how.push(`${checked} checked by another route`);
        if (deleted) how.push(`${deleted} deleted`);
        bits.push(`Phish caught: ${result.phishCaught} of ${total}${how.length ? ` (${how.join(', ')})` : ''}`);
    } else {
        if (Number.isFinite(result?.reportRate)) bits.push(`Reported ${Math.round(result.reportRate * 100)}% of the phish`);
        if (Number.isFinite(result?.verifyCount) && result.verifyCount > 0) bits.push(`Checked by another route: ${result.verifyCount}`);
    }
    summary.textContent = bits.join('. ');
    if (bits.length) root.appendChild(summary);

    // Cut A: the learner read the full reasoning for every item in immediate feedback, so the
    // debrief dwells only on what they got wrong. A card per missed item, then one weakest-skill
    // line; if nothing was missed, one short line says so. The score summary, panels, Monday card
    // and no-blame line stay.
    const answers = Array.isArray(result?.answers) ? result.answers.filter(isObj) : [];
    const reviewed = answers.filter((a) => reviewNeeded(a, messageFor(set, a.id)));
    const cards = el('div', 'aw-cards');
    for (const a of reviewed) cards.appendChild(buildCard(a, messageFor(set, a.id)));
    root.appendChild(cards);

    if (reviewed.length) {
        const weak = weakestFactor(isObj(result?.perFactor) ? result.perFactor : {});
        if (weak && weak.missed > 0) {
            const ids = Array.isArray(weak.ties) && weak.ties.length ? weak.ties : [weak.id];
            const counts = `caught ${weak.caught} of ${weak.caught + weak.missed}`;
            const names = ids.map(skillName);
            root.appendChild(el('p', 'aw-weakest', names.length === 1
                ? `The tell most often missed: ${names[0]} (${counts}).`
                : `The tells most often missed: ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} (${counts} each).`));
        }
    }
    // disc_visible: the real items, after the cards it may point at.
    const genuine = set?.genuineFeedback === false ? null
        : buildGenuine(set, answers, new Set(reviewed.map((a) => a.id)), set?.scoringProfile === 'analyst' ? 'analyst' : 'awareness');
    if (!reviewed.length && answers.length) {
        root.appendChild(el('p', 'aw-all-right', genuine?.flagged ? DEFAULTS.allPhishRight : str(strings, 'allRight')));
    }
    if (genuine) root.appendChild(genuine.node);

    const concept = buildPanel(strings, 'conceptPanel');
    if (concept) root.appendChild(concept);
    const voice = buildPanel(strings, 'voicePanel');
    if (voice) root.appendChild(voice);

    // aw6: a thank-you for the phish the learner kept from the team. Positive only: no
    // denominator and nothing about what was missed.
    const team = teamProtectedOf(result);
    const teamText = teamLine(team, teamSize);
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
    // ("A miss here is no reflection on you" under 100%: N-17), so it shows only with a card.
    const noBlame = reviewed.length > 0 || !answers.length;
    if (noBlame) root.appendChild(el('p', 'aw-no-blame', str(strings, 'noBlameLine')));

    const finish = el('button', 'aw-button aw-finish', DEFAULTS.finish);
    finish.type = 'button';
    finish.addEventListener('click', () => { if (typeof onFinish === 'function') onFinish(); });
    root.appendChild(finish);
    container.appendChild(root);

    return {
        destroy() { root.remove(); },
        getState() {
            return { items: reviewed.length, mondayCard: true, noBlame, conceptPanel: !!concept, voicePanel: !!voice,
                reportRoute: route ? (route.configured === true ? 'configured' : 'generic') : null,
                ruleOfThumb: !!rule, teamProtected: teamText ? team : null,
                genuine: genuine ? { trusted: genuine.trusted, flagged: genuine.flagged } : null };
        }
    };
}
