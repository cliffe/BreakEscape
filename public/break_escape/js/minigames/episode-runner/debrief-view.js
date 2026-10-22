// Awareness episodes: the debrief (11 stage 6, packet P7-B).
//
// renderDebrief(container, { result, set, strings, variant, onFinish }) -> { destroy, getState }
//
// `result` is the triage gameResult (answers, percent, reportRate, verifyCount); `set` is the
// triage set, read for each message's subject and `truth`. One card per answer, then the
// "one thing to do on Monday" card and the no-blame line. On variant "defendOnly" the
// strings.defendOnly paragraph stands in for anything about the learner's own message.
// getState() -> { items: number, mondayCard: boolean, noBlame: boolean }.
// Every string goes in with textContent. The wording never blames the learner.

import { redFlagString } from '../inbox-triage/triage-flags.js';

const DEFAULTS = Object.freeze({
    heading: 'What happened',
    mondayCard: "What to do on Monday: if something looks wrong, report it through your organisation's usual route. Reporting is never wrong.",
    noBlameLine: 'Nobody here is being marked down for a miss. These messages are built to look right.',
    defendOnly: 'You went straight to the inbox this time. Each message below shows what to look for and why.',
    finish: 'Finish'
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
const str = (strings, key) => (isObj(strings) && typeof strings[key] === 'string' && strings[key]) ? strings[key] : DEFAULTS[key];

function messageFor(set, id) {
    const list = Array.isArray(set?.messages) ? set.messages : [];
    return list.find((m) => isObj(m) && m.id === id) || null;
}

function titleOf(msg, id) {
    if (!msg) return id;
    const subject = msg.subject || '';
    const who = isObj(msg.from) ? (msg.from.name || msg.from.address || '') : (typeof msg.from === 'string' ? msg.from : '');
    if (subject && who && who !== subject && msg.kind && msg.kind !== 'email') return `${who} · ${subject}`;
    return subject || who || id;
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
    const word = VERDICT_WORD[verdict] || String(verdict ?? '');
    const line = LINES[phish ? 'phish' : 'real'][verdict] || '';
    card.appendChild(el('p', 'aw-card-verdict', `You chose ${word}. ${line}`.trim()));

    const picked = new Set(Array.isArray(answer.flags) ? answer.flags : []);
    const notes = isObj(truth.perFlagNote) ? truth.perFlagNote : {};
    if (phish && Array.isArray(truth.flags) && truth.flags.length) {
        const ul = el('ul', 'aw-flags');
        for (const id of [...new Set(truth.flags)]) {
            const caught = picked.has(id);
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
        card.appendChild(el('p', 'aw-if-trusted', `What could have happened: ${truth.ifTrusted}`));
    }
    if (Number.isFinite(answer.score)) card.appendChild(el('p', 'aw-card-score', `Score for this message: ${answer.score} of 100`));
    return card;
}

export function renderDebrief(container, { result, set, strings = {}, variant = 'full', onFinish } = {}) {
    const root = el('section', 'aw-debrief');
    const heading = el('h2', 'aw-heading', DEFAULTS.heading);
    heading.tabIndex = -1;
    root.appendChild(heading);

    if (variant === 'defendOnly') root.appendChild(el('p', 'aw-lead aw-defend-only', str(strings, 'defendOnly')));

    const summary = el('p', 'aw-summary');
    const bits = [];
    if (Number.isFinite(result?.percent)) bits.push(`Round score: ${result.percent}%`);
    if (typeof result?.headline === 'string' && result.headline) bits.push(result.headline);
    if (Number.isFinite(result?.reportRate)) bits.push(`Reported ${Math.round(result.reportRate * 100)}% of the phish`);
    if (Number.isFinite(result?.verifyCount) && result.verifyCount > 0) bits.push(`Checked by another route: ${result.verifyCount}`);
    summary.textContent = bits.join('. ');
    if (bits.length) root.appendChild(summary);

    const answers = Array.isArray(result?.answers) ? result.answers.filter(isObj) : [];
    const cards = el('div', 'aw-cards');
    for (const a of answers) cards.appendChild(buildCard(a, messageFor(set, a.id)));
    root.appendChild(cards);

    const monday = el('aside', 'aw-monday', str(strings, 'mondayCard'));
    monday.setAttribute('aria-label', 'One thing to do on Monday');
    root.appendChild(monday);
    root.appendChild(el('p', 'aw-no-blame', str(strings, 'noBlameLine')));

    const finish = el('button', 'aw-button aw-finish', DEFAULTS.finish);
    finish.type = 'button';
    finish.addEventListener('click', () => { if (typeof onFinish === 'function') onFinish(); });
    root.appendChild(finish);
    container.appendChild(root);

    return {
        destroy() { root.remove(); },
        getState() { return { items: answers.length, mondayCard: true, noBlame: true }; }
    };
}
