// The triage header panel (05 "The header panel", N2): a simplified, fictional
// teaching rendering of a message's sender-authentication result. It shows
// authored literals only (nothing is computed from player input) and explains
// at concept level what SPF, DKIM and DMARC check and what a result does not
// tell you. It never says how to forge any of them.
//
// buildHeaderPanel(rec, view, handlers) returns a node. `view` is the open/closed
// state the minigame keeps across the reader's rebuilds: { glossaryOpen, explain }.
// Every string goes in with textContent.

import {
    MECHANISMS, EXPLAINERS, RESULT_WORD, normaliseResult, mechanismLabels, AUTH_TITLE, resultMeaning
} from './triage-flags.js';

const ICON = '/break_escape/assets/icons/';
const MARKS = { pass: 'mark-tick', fail: 'mark-cross', none: 'mark-question' };

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function mark(result) {
    const img = el('img', 'mail-icon tri-lamp-icon');
    img.src = `${ICON}${MARKS[result]}.png`;
    img.alt = '';
    return img;
}

/**
 * @param {object} rec      the reader record (from, auth, forwardedBy)
 * @param {{glossaryOpen:boolean, explain:string|null}} view
 * @param {object} handlers { glossary: 'open'|'closed'|'off', onToggleGlossary(), onToggleExplain(mech) }
 * @param {object} opts     { plain } — plain, non-jargon labels for the awareness skin (11 §7)
 */
export function buildHeaderPanel(rec, view, handlers = {}, opts = {}) {
    const LABEL = mechanismLabels(opts.plain === true);
    const MEANING = resultMeaning(opts.plain === true);
    const panel = el('div', 'tri-header-panel');
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', 'Message header details');

    if (rec.forwardedBy) {
        const who = typeof rec.forwardedBy === 'string' ? rec.forwardedBy : 'a colleague';
        panel.appendChild(el('p', 'tri-forwarded', `Forwarded by ${who}`));
    }

    const auth = rec.auth && typeof rec.auth === 'object' ? rec.auth : {};
    const fields = el('dl', 'tri-header-fields');
    const add = (k, v) => { fields.append(el('dt', null, k), el('dd', null, v)); };
    add('Display name', rec.from?.name || '');
    add('From address', rec.from?.address || '');
    if (auth.envelopeFrom) add('Sent by (envelope)', auth.envelopeFrom);
    if (auth.replyTo) add('Reply goes to', auth.replyTo);
    panel.appendChild(fields);

    panel.appendChild(el('h3', 'tri-auth-title', opts.plain === true ? AUTH_TITLE.plain : AUTH_TITLE.technical));
    const list = el('ul', 'tri-auth-list');
    for (const mech of MECHANISMS) {
        const result = normaliseResult(auth[mech]);
        const open = view.explain === mech;
        const row = el('li', `tri-auth-row result-${result}`);
        row.dataset.mechanism = mech;
        row.dataset.result = result;

        const head = el('div', 'tri-auth-head');
        const lamp = el('span', `tri-lamp lamp-${result}`);
        lamp.appendChild(mark(result));
        head.append(lamp, el('span', 'tri-auth-name', LABEL[mech]),
            el('span', 'tri-auth-word', RESULT_WORD[result]));
        const btn = el('button', 'tri-explain-btn minigame-button', open ? 'Hide explanation' : 'Explain');
        btn.type = 'button';
        btn.dataset.explain = mech;
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        btn.setAttribute('aria-label', `${open ? 'Hide' : 'Show'} what ${LABEL[mech]} ${RESULT_WORD[result].toLowerCase()} means`);
        btn.addEventListener('click', () => handlers.onToggleExplain?.(mech));
        head.appendChild(btn);
        row.appendChild(head);
        row.appendChild(el('p', 'tri-auth-meaning', MEANING[mech][result]));

        if (open) {
            const ex = EXPLAINERS[mech];
            const box = el('ul', 'tri-explainer');
            for (const line of [ex.checks, ex.reading, ex.notTell]) box.appendChild(el('li', null, line));
            row.appendChild(box);
        }
        list.appendChild(row);
    }
    panel.appendChild(list);

    if (typeof auth.summary === 'string' && auth.summary) {
        panel.appendChild(el('p', 'tri-auth-summary', auth.summary));
    }

    if (handlers.glossary && handlers.glossary !== 'off') {
        const gloss = el('div', 'tri-glossary');
        const btn = el('button', 'tri-glossary-btn minigame-button', "What's this?");
        btn.type = 'button';
        btn.dataset.glossary = 'toggle';
        btn.setAttribute('aria-expanded', view.glossaryOpen ? 'true' : 'false');
        btn.addEventListener('click', () => handlers.onToggleGlossary?.());
        gloss.appendChild(btn);
        if (view.glossaryOpen) {
            const dl = el('dl', 'tri-glossary-list');
            for (const mech of MECHANISMS) {
                const ex = EXPLAINERS[mech];
                const dd = el('dd');
                for (const line of [ex.checks, ex.reading, ex.notTell]) dd.appendChild(el('span', 'tri-glossary-line', line));
                dl.append(el('dt', null, LABEL[mech]), dd);
            }
            gloss.appendChild(dl);
        }
        panel.appendChild(gloss);
    }
    return panel;
}
