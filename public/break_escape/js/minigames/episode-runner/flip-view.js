// Awareness episodes: the flip view (11 N2, packet P7-B).
//
// renderFlipView(container, { message, strings, onContinue }) -> { destroy, getState }
//
// Shows the learner's own sent message in the read-only mail reader, then lists the tells that
// were stored on it, each with its canonical red-flag sentence. `message` is the `message` of
// resolvePlayerSent(...), or null when nothing usable was sent (the view then shows flipNoSend).
// getState() -> { shown: 'message' | 'noSend', tells: string[] } (the sentences on screen).
// Every string goes in with textContent.

import { MailReader } from '../mail-client/mail-reader.js';
import { redFlagString } from '../inbox-triage/triage-flags.js';

const DEFAULTS = Object.freeze({
    flipHeading: 'Your message, from the other side',
    flipIntro: 'This is the message you just wrote, as the person who receives it would see it.',
    flipDefenderLine: 'People who fall for messages like this are not stupid. This one was built to look right.',
    flipNoSend: 'You did not send a message this time, so there is nothing to flip. On to the next step.',
    continue: 'Continue'
});

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

const str = (strings, key) => (strings && typeof strings[key] === 'string' && strings[key]) ? strings[key] : DEFAULTS[key];

export function renderFlipView(container, { message = null, strings = {}, onContinue } = {}) {
    const root = el('section', 'aw-flip');
    const heading = el('h2', 'aw-heading', str(strings, 'flipHeading'));
    heading.tabIndex = -1;
    root.appendChild(heading);

    let reader = null;
    let shown = 'noSend';
    const tells = [];
    const hasMessage = !!message && typeof message === 'object';

    if (hasMessage) {
        shown = 'message';
        root.appendChild(el('p', 'aw-lead', str(strings, 'flipIntro')));
        const readerHost = el('div', 'aw-flip-reader');
        root.appendChild(readerHost);
        reader = new MailReader(readerHost, { influence: false, noDetails: true, emptyText: '' });
        reader.setMessages([message], 'inbox');
        if (message.id) reader.select(message.id);
        const ids = [...new Set(Array.isArray(message.truth?.flags) ? message.truth.flags : [])];
        const list = el('ul', 'aw-tells');
        list.setAttribute('aria-label', 'What gave it away');
        for (const id of ids) {
            const sentence = redFlagString(id, message);
            tells.push(sentence);
            const li = el('li', 'aw-tell', sentence);
            li.dataset.flag = id;
            list.appendChild(li);
        }
        if (tells.length) root.appendChild(list);
        root.appendChild(el('p', 'aw-defender-line', str(strings, 'flipDefenderLine')));
    } else {
        root.appendChild(el('p', 'aw-lead aw-no-send', str(strings, 'flipNoSend')));
    }

    const next = el('button', 'aw-button aw-continue', DEFAULTS.continue);
    next.type = 'button';
    next.addEventListener('click', () => { if (typeof onContinue === 'function') onContinue(); });
    root.appendChild(next);
    container.appendChild(root);

    return {
        destroy() { reader?.destroy?.(); root.remove(); },
        getState() { return { shown, tells: [...tells] }; }
    };
}
