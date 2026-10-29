// Awareness episodes: the flip view (11 N2, packet P7-B; the page and call flips, P7-P).
//
// renderFlipView(container, { message, page, call, missed, strings, onContinue }) -> { destroy, getState }
//
// Shows what the learner just made from the other side, then lists its tells, each with its
// canonical red-flag sentence:
//   message  the sent email: the `message` of resolvePlayerSent(...), drawn in the read-only
//            mail reader;
//   page     a built look-alike page (E5): { url, padlock, heading, fields, button, tells,
//            pageDef?, choices? }. With pageDef and choices it is drawn by the builder's renderer
//            (renderLandingPage), so the flip matches the page built; otherwise as the triage
//            `page` card;
//   call     a pretext call (E3): { callerId, claims, transcript, notes }, drawn as the
//            triage `call` card the helpdesk agent sees (the learner's own lines and the
//            facts they claimed), then the helpdesk side's notes on what would have caught it;
//   aftermath  ENG-01, optional: the victim's seat after a landed message or page.
//            { heading?, victimName?, intro?, items: [{ id, kind, note?, ... }], line? }. An
//            `email` item is one read-only sent-items row (folder, to, subject, time, note;
//            no body, no link); any other non-email kind is drawn with renderKindSurface.
//            Drawn after the message, page and call and before the defender line, only when
//            there is a message or page and at least one valid item.
// A page may come with a message (E5 sends the email that links to it). With none of them,
// the view shows flipMissed when `missed` is true (something was sent but did not land, so
// there is nothing to replay), flipLandedNoTells when `landedNoTells` is true (it landed but
// carries no tells to replay; falls back to flipMissed), and flipNoSend otherwise. With nothing
// to replay the heading is flipMissedHeading, not the "it lands on you" heading (P3 N-6).
// The defender line under the replay is choice-aware (aw2): with a `templateId` (the learner's
// chosen pretext, state.sent.templateId) and a matching strings.flipDefenderLineByChoice entry, the
// per-branch line shows (in the .aw-defender-line node); otherwise the single
// strings.flipDefenderLine (see defenderLine()).
// Montage mode (ENG-04, a consequence episode with flip.mode "montage"): the runner passes
// { montage: true, beats: [{ id, situation, optionId, taken, safe, line }], flipBeat } instead. The view
// draws flipHeading, an optional flipMontageIntro, then one .aw-montage-beat per beat, the flipBeat first
// (marked .aw-montage-headline) and the rest in authored order, each a situation and the line for the
// option shown. A learner's own option is marked .aw-montage-taken. The framing ("Your choice", "the
// version where it was taken instead") is in the authored lines. flipDefenderLine is shown only when authored.
// getState() -> { shown: 'message' | 'page' | 'call' | 'missed' | 'landedNoTells' | 'noSend' | 'montage', parts,
// tells } (`shown` is the first part shown; `parts` lists every part; `tells` the sentences on screen).
// Every string goes in with textContent.

import { MailReader } from '../mail-client/mail-reader.js';
import { redFlagString } from '../inbox-triage/triage-flags.js';
import { renderKindSurface, isNonEmail } from '../inbox-triage/triage-kinds.js';
import { renderLandingPage } from '../landing-page-builder/landing-page-render.js';

const DEFAULTS = Object.freeze({
    flipHeading: 'Your message, from the other side',
    flipIntro: 'This is the message you just wrote, as the person who receives it would see it.',
    flipPageIntro: 'This is the page you built, as the person who follows the link would see it.',
    flipCallIntro: 'This is your call from the other end of the line. Here is what would have caught it.',
    flipDefenderLine: 'People who fall for messages like this are not stupid. This one was built to look right.',
    flipMontageHeading: 'Where each choice led',
    flipMontageIntro: 'Here is where each of those choices led.',
    flipNoSend: 'You did not send a message this time, so there is nothing to flip. On to the next step.',
    flipMissed: 'Your attempt did not land this time, so there is nothing to show from the other side. The defence is the same either way. On to the next step.',
    flipMissedHeading: 'Nothing to replay this time',
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
const isStr = (v) => typeof v === 'string' && v.length > 0;
const str = (strings, key) => (strings && typeof strings[key] === 'string' && strings[key]) ? strings[key] : DEFAULTS[key];

/**
 * The defender line for the flip (aw2). When the learner's chosen pretext (state.sent.templateId)
 * has an entry in strings.flipDefenderLineByChoice, that choice-aware line is shown, so the flip
 * quotes back the lever the learner pulled; otherwise the single flipDefenderLine (then DEFAULT).
 * The map is keyed by template id, so one episode can carry a line per pretext branch.
 */
export function defenderLine(strings, templateId) {
    const byChoice = isObj(strings) ? strings.flipDefenderLineByChoice : null;
    if (isObj(byChoice) && isStr(templateId) && isStr(byChoice[templateId])) return byChoice[templateId];
    return str(strings, 'flipDefenderLine');
}

/** The valid items of a flipAftermath block: an `email` row or a non-email kind, each with an id. */
function aftermathItems(block) {
    if (!isObj(block) || !Array.isArray(block.items)) return [];
    return block.items.filter((it) => isObj(it) && isStr(it.id) && (it.kind === 'email' || isNonEmail(it.kind)));
}

/** One sent-items row for an aftermath `email` item: textContent only, no body and no link. */
function aftermathEmailRow(it) {
    const row = el('div', 'aw-aftermath-email');
    const dl = el('dl', 'aw-aftermath-fields');
    // Addresses use the address font, like the flip's own From/To lines.
    const add = (k, v, cls = null) => { if (isStr(v)) dl.append(el('dt', null, k), el('dd', cls, v)); };
    add('Folder', isStr(it.folder) ? it.folder.charAt(0).toUpperCase() + it.folder.slice(1) : 'Sent');
    add('From', it.from, 'aw-aftermath-address');
    add('To', it.to, 'aw-aftermath-address');
    add('Subject', it.subject);
    add('Time', it.time);
    row.appendChild(dl);
    return row;
}

const UNKNOWN_TELL = 'Something about this one did not add up.';

/** The sentence for a tell id: the library's, else the page tells', else a neutral phrase (never the raw id). */
export function tellSentence(id, message) {
    const s = redFlagString(id, message);
    if (s !== id) return s;
    return PAGE_TELLS[id] || UNKNOWN_TELL;
}

/** The montage: the flipBeat first, then the rest in order. Returns the beat ids shown. */
function renderMontage(root, container, { beats, flipBeat, strings, onContinue }) {
    const list = Array.isArray(beats) ? beats.filter((b) => isObj(b) && isStr(b.id)) : [];
    const head = list.find((b) => b.id === flipBeat);
    const ordered = head ? [head, ...list.filter((b) => b !== head)] : list;
    root.appendChild(el('p', 'aw-lead aw-montage-intro', str(strings, 'flipMontageIntro')));
    const wrap = el('ol', 'aw-montage');
    wrap.setAttribute('aria-label', 'Where each choice led');
    for (const b of ordered) {
        const item = el('li', 'aw-montage-beat');
        item.dataset.beat = b.id;
        if (b === head) item.classList.add('aw-montage-headline');
        if (b.taken) item.classList.add('aw-montage-taken');
        if (isStr(b.optionId)) item.dataset.option = b.optionId;
        if (isStr(b.situation)) item.appendChild(el('p', 'aw-montage-situation', b.situation));
        if (isStr(b.line)) item.appendChild(el('p', 'aw-montage-line', b.line));
        wrap.appendChild(item);
    }
    root.appendChild(wrap);
    if (isStr(strings?.flipDefenderLine)) root.appendChild(el('p', 'aw-defender-line', strings.flipDefenderLine));
    const next = el('button', 'aw-button aw-continue', str(strings, 'continue'));
    next.type = 'button';
    next.addEventListener('click', () => { if (typeof onContinue === 'function') onContinue(); });
    root.appendChild(next);
    container.appendChild(root);
    const ids = ordered.map((b) => b.id);
    return {
        destroy() { root.remove(); },
        getState() { return { shown: 'montage', parts: ['montage'], tells: [], beats: [...ids] }; }
    };
}

export function renderFlipView(container, { message = null, page = null, call = null, aftermath = null, missed = false, landedNoTells = false, templateId = null, montage = false, beats = null, flipBeat = null, strings = {}, onContinue } = {}) {
    const root = el('section', 'aw-flip');
    if (montage === true) {
        const own = isStr(strings?.flipHeading) ? strings.flipHeading : DEFAULTS.flipMontageHeading;
        const h = el('h2', 'aw-heading', own);
        h.tabIndex = -1;
        root.appendChild(h);
        return renderMontage(root, container, { beats, flipBeat, strings, onContinue });
    }
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
        // A page that carries its definition and the learner's choices is drawn with the
        // builder's own renderer, so the flip shows the page that was built and scored: the same
        // logo, wording and button face (P4-1). Without them, the triage page card stands in.
        let surface = null;
        if (isObj(page.pageDef) && isObj(page.choices)) {
            try {
                const drawn = renderLandingPage({ pageDef: page.pageDef, choices: page.choices, mode: 'build', doc: root.ownerDocument });
                if (drawn && !drawn.blocked) { surface = drawn.root; surface.classList.add('aw-flip-built'); }
            } catch (e) { surface = null; }
        }
        if (!surface) {
            surface = renderKindSurface(rec, {
                showNote: (t) => { note.textContent = t; },
                showLink: (t) => { note.textContent = t; },
                bodyNode: () => el('div')
            });
        }
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

    // ENG-01: the victim's seat, after the replay and before the defender line. Only with
    // something replayed from a landed attack (a missed or no-send flip never reaches it).
    const aftermathList = (hasMessage || hasPage) && !missed && !landedNoTells ? aftermathItems(aftermath) : [];
    if (aftermathList.length) {
        parts.push('aftermath');
        const sec = el('section', 'aw-flip-aftermath');
        if (isStr(aftermath.heading)) sec.appendChild(el('h3', 'aw-flip-section', aftermath.heading));
        if (isStr(aftermath.intro)) sec.appendChild(el('p', 'aw-lead', aftermath.intro));
        if (isStr(aftermath.victimName)) sec.dataset.victim = aftermath.victimName;
        for (const it of aftermathList) {
            const item = el('div', 'aw-aftermath-item');
            item.dataset.id = it.id;
            item.dataset.kind = it.kind;
            const note = el('p', 'aw-aftermath-note');
            const setNote = (t) => { note.textContent = t; };
            if (it.kind === 'email') {
                item.appendChild(aftermathEmailRow(it));
            } else {
                const surface = renderKindSurface(it, { showNote: setNote, showLink: setNote, bodyNode: () => el('div') });
                if (surface) item.appendChild(surface);
            }
            if (isStr(it.note)) { note.textContent = it.note; item.appendChild(note); }
            sec.appendChild(item);
        }
        if (isStr(aftermath.line)) sec.appendChild(el('p', 'aw-aftermath-line', aftermath.line));
        root.appendChild(sec);
    }

    if (parts.length) {
        root.appendChild(el('p', 'aw-defender-line', defenderLine(strings, templateId)));
    } else if (missed || landedNoTells) {
        const landed = !missed && landedNoTells;
        parts.push(landed ? 'landedNoTells' : 'missed');
        heading.textContent = str(strings, 'flipMissedHeading');
        const line = landed && isStr(strings?.flipLandedNoTells) ? strings.flipLandedNoTells : str(strings, 'flipMissed');
        root.appendChild(el('p', `aw-lead aw-missed${landed ? ' aw-landed-no-tells' : ''}`, line));
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
