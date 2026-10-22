// Awareness episodes: the flip view (11 N2, packet P7-B; the page and call flips, P7-P).
//
// renderFlipView(container, { message, page, call, missed, strings, onContinue }) -> { destroy, getState }
//
// Shows what the learner just made from the other side, then lists its tells, each with its
// canonical red-flag sentence:
//   message  the sent email: the `message` of resolvePlayerSent(...), drawn in the read-only
//            mail reader;
//   page     a built look-alike page (E5): { url, padlock, heading, fields, button, tells },
//            drawn as the triage `page` card the defender will see;
//   call     a pretext call (E3): { callerId, claims, transcript, notes }, drawn as the
//            triage `call` card the helpdesk agent sees (the learner's own lines and the
//            facts they claimed), then the helpdesk side's notes on what would have caught it.
// A page may come with a message (E5 sends the email that links to it). With none of them,
// the view shows flipMissed when `missed` is true (something was sent but did not land, so
// there is nothing to replay) and flipNoSend otherwise.
// getState() -> { shown: 'message' | 'page' | 'call' | 'missed' | 'noSend', parts: string[], tells: string[] }
// (`shown` is the first part shown; `parts` lists every part; `tells` the sentences on screen).
// Every string goes in with textContent.

import { MailReader } from '../mail-client/mail-reader.js';
import { redFlagString } from '../inbox-triage/triage-flags.js';
import { renderKindSurface } from '../inbox-triage/triage-kinds.js';

const DEFAULTS = Object.freeze({
    flipHeading: 'Your message, from the other side',
    flipIntro: 'This is the message you just wrote, as the person who receives it would see it.',
    flipPageIntro: 'This is the page you built, as the person who follows the link would see it.',
    flipCallIntro: 'This is your call from the other end of the line. Here is what would have caught it.',
    flipDefenderLine: 'People who fall for messages like this are not stupid. This one was built to look right.',
    flipNoSend: 'You did not send a message this time, so there is nothing to flip. On to the next step.',
    flipMissed: 'Your attempt did not land this time, so there is nothing to show from the other side. The defence is the same either way. On to the next step.',
    continue: 'Continue'
});

const SECTION = Object.freeze({ message: 'The message', page: 'The page it links to' });

// The landing-page tells a built page stores (07 TELL_IDS) have no library sentence yet.
const PAGE_TELLS = Object.freeze({
    domain: 'The address bar shows a look-alike of the real address.',
    formOrigin: 'The sign-in form sends what you type to a different site.',
    hoverMismatch: 'The link text and where the link really goes are different.',
    padlock: 'The padlock only means the connection is encrypted, not that the site is genuine.',
    brand: 'The logo or name is a close copy of the real one.',
    wording: 'The wording pushes you to act before you think.',
    form: 'The page asks for more than a sign-in needs.'
});

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (strings, key) => (strings && typeof strings[key] === 'string' && strings[key]) ? strings[key] : DEFAULTS[key];

const UNKNOWN_TELL = 'Something about this one did not add up.';

/** The sentence for a tell id: the library's, else the page tells', else a neutral phrase (never the raw id). */
export function tellSentence(id, message) {
    const s = redFlagString(id, message);
    if (s !== id) return s;
    return PAGE_TELLS[id] || UNKNOWN_TELL;
}

export function renderFlipView(container, { message = null, page = null, call = null, missed = false, strings = {}, onContinue } = {}) {
    const root = el('section', 'aw-flip');
    const heading = el('h2', 'aw-heading', str(strings, 'flipHeading'));
    heading.tabIndex = -1;
    root.appendChild(heading);

    let reader = null;
    const parts = [];
    const tells = [];
    const hasMessage = isObj(message);
    const hasPage = isObj(page) && typeof page.url === 'string' && !!page.url;
    const callNotes = isObj(call) && Array.isArray(call.notes) ? call.notes.filter((n) => typeof n === 'string' && n) : [];
    const callLines = isObj(call) && Array.isArray(call.transcript) ? call.transcript.filter(isObj) : [];
    const hasCall = callNotes.length > 0 || callLines.length > 0;
    const both = hasMessage && hasPage;
    const movedToPage = [];

    const tellList = (ids, msg, label) => {
        const list = el('ul', 'aw-tells');
        list.setAttribute('aria-label', label);
        for (const id of ids) {
            const sentence = tellSentence(id, msg);
            tells.push(sentence);
            const li = el('li', 'aw-tell', sentence);
            li.dataset.flag = id;
            list.appendChild(li);
        }
        if (ids.length) root.appendChild(list);
    };

    if (hasMessage) {
        parts.push('message');
        if (both) root.appendChild(el('h3', 'aw-flip-section', SECTION.message));
        root.appendChild(el('p', 'aw-lead', str(strings, 'flipIntro')));
        const readerHost = el('div', 'aw-flip-reader');
        root.appendChild(readerHost);
        reader = new MailReader(readerHost, { influence: false, noDetails: true, emptyText: '' });
        reader.setMessages([message], 'inbox');
        if (message.id) reader.select(message.id);
        const all = [...new Set(Array.isArray(message.truth?.flags) ? message.truth.flags : [])];
        // With a page as well, the page's own tells (the look-alike address, where the form
        // posts) are listed under the page; the link's hover mismatch stays with the message.
        const onPage = (id) => both && id in PAGE_TELLS && id !== 'hoverMismatch';
        movedToPage.push(...all.filter(onPage));
        tellList(all.filter((id) => !onPage(id)), message, 'What gave it away');
    }

    if (hasPage) {
        parts.push('page');
        if (both) root.appendChild(el('h3', 'aw-flip-section', SECTION.page));
        root.appendChild(el('p', 'aw-lead', str(strings, 'flipPageIntro')));
        const note = el('p', 'aw-flip-note');
        note.setAttribute('aria-live', 'polite');
        const rec = {
            id: 'flip_page', kind: 'page',
            page: {
                url: page.url, padlock: page.padlock === true,
                heading: typeof page.heading === 'string' ? page.heading : '',
                fields: Array.isArray(page.fields) ? page.fields.filter((f) => typeof f === 'string') : [],
                button: typeof page.button === 'string' ? page.button : 'Sign in'
            }
        };
        const surface = renderKindSurface(rec, {
            showNote: (t) => { note.textContent = t; },
            showLink: (t) => { note.textContent = t; },
            bodyNode: () => el('div')
        });
        const host = el('div', 'aw-flip-page');
        if (surface) host.appendChild(surface);
        root.append(host, note);
        const ids = [...new Set([...(Array.isArray(page.tells) ? page.tells.filter((t) => typeof t === 'string') : []), ...movedToPage])];
        tellList(ids, null, 'What gives the page away');
    }

    if (hasCall) {
        parts.push('call');
        root.appendChild(el('p', 'aw-lead', str(strings, 'flipCallIntro')));
        if (callLines.length) {
            const surface = renderKindSurface({
                id: 'flip_call', kind: 'call',
                callerId: typeof call.callerId === 'string' && call.callerId ? call.callerId : 'Caller',
                claims: Array.isArray(call.claims) ? call.claims.filter(isObj) : [],
                transcript: callLines
            }, { showNote() {}, showLink() {}, bodyNode: () => el('div') });
            const host = el('div', 'aw-flip-call');
            if (surface) host.appendChild(surface);
            root.appendChild(host);
        }
        if (callNotes.length) {
            const list = el('ul', 'aw-tells aw-call-notes');
            list.setAttribute('aria-label', 'What would have caught it');
            for (const n of callNotes) {
                tells.push(n);
                list.appendChild(el('li', 'aw-tell', n));
            }
            root.appendChild(list);
        }
    }

    if (parts.length) {
        root.appendChild(el('p', 'aw-defender-line', str(strings, 'flipDefenderLine')));
    } else if (missed) {
        parts.push('missed');
        root.appendChild(el('p', 'aw-lead aw-missed', str(strings, 'flipMissed')));
    } else {
        parts.push('noSend');
        root.appendChild(el('p', 'aw-lead aw-no-send', str(strings, 'flipNoSend')));
    }

    const next = el('button', 'aw-button aw-continue', str(strings, 'continue'));
    next.type = 'button';
    next.addEventListener('click', () => { if (typeof onContinue === 'function') onContinue(); });
    root.appendChild(next);
    container.appendChild(root);

    return {
        destroy() { reader?.destroy?.(); root.remove(); },
        getState() { return { shown: parts[0], parts: [...parts], tells: [...tells] }; }
    };
}
