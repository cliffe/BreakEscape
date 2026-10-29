// Non-email message kinds for inbox triage (SE design 05 N1 "Non-email kinds", N10 `call`
// and `push`; 11 N12 to N14 for the look of each surface).
//
// A triage message has a `kind`, default `email`. The others are `sms`, `voicemail`, `qr`,
// `page`, `call` and `push`. Each is drawn in its own style in the reading pane (a phone text
// thread, a voicemail card with a transcript, a printed notice with a QR code, a browser card,
// a call transcript, an MFA prompt) in place of the email head and body, with the same
// `truth`, notes and scoring. None of them has `auth`, so the header panel is hidden, and the
// chips are only the set's enabled channel tells (05 OQ7).
//
// `call` and `push` replace the verdict buttons with their own actions. Each action scores
// through an existing verdict row, so the scorer is unchanged:
//   call: comply = trust, escalate = report, refuse = delete, verify_callback = verify
//   push: approve = trust, deny = delete, deny_report = report
//
// Every string the player reads goes in with textContent. The QR code is a decorative
// pattern drawn from the message id: it encodes nothing and cannot be scanned.

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;

export const EMAIL_KINDS = Object.freeze(['email', 'playerSent']);
export const NON_EMAIL_KINDS = Object.freeze(['sms', 'voicemail', 'qr', 'page', 'call', 'push', 'choice']);

export function kindOf(rec) {
    return isStr(rec?.kind) ? rec.kind : 'email';
}

export function isNonEmail(recOrKind) {
    const k = typeof recOrKind === 'string' ? recOrKind : kindOf(recOrKind);
    return NON_EMAIL_KINDS.includes(k);
}

/** Short word for the kind, used in the message list and the brief. */
export const KIND_LABEL = Object.freeze({
    email: 'Email', sms: 'Text', voicemail: 'Voicemail', qr: 'QR notice',
    page: 'Web page', call: 'Call', push: 'Sign-in prompt', choice: 'Question'
});

/**
 * Set-level wording over the defaults in this file (`set.labels`), all optional:
 *   kind        { email, sms, voicemail, qr, page, call, push, choice }: the short kind words (KIND_LABEL)
 *   verdict     { trust|report|delete|verify: { label?, past?, hint? } }
 *   callActions { comply|escalate|refuse|verify_callback: { label?, past?, hint? } }
 *   pushActions { approve|deny|deny_report: { label?, past?, hint? } }
 *   smsHeading  the "Text message" heading on a text and the fallback title of an untitled one
 *   queue       { inbox|call|push|callPush|voicemail|page|sms|choice|other: { label?, item?: [one, many],
 *                 real?, reportLabel? } }: the brief's queue wording (read by the minigame)
 *   choice      { brief?, group?, answered?, right?, wrong?, better?, whyRight?, ifWrong? }: the authored-choice
 *               card's wording (see CHOICE_TEXT below)
 * Anything not given keeps the default, so a set with no `labels` reads exactly as before.
 */
export function kindLabel(kind, labels) {
    const own = labels?.kind?.[kind];
    return isStr(own) ? own : (KIND_LABEL[kind] || '');
}

export function smsHeading(labels) {
    return isStr(labels?.smsHeading) ? labels.smsHeading : 'Text message';
}

/** An action with the set's label, past and hint over it (shallow, text fields only). */
function relabel(action, over) {
    if (!isObj(over)) return action;
    const out = { ...action };
    for (const f of ['label', 'past', 'hint']) if (isStr(over[f])) out[f] = over[f];
    return out;
}

/** One of the four email verdict actions, with `labels.verdict` layered on. */
export function verdictAction(verdict, labels) {
    return relabel(VERDICT_ACTIONS[verdict] || VERDICT_ACTIONS.trust, labels?.verdict?.[verdict]);
}

const VERDICT_ACTIONS = Object.freeze({
    trust: { id: 'trust', verdict: 'trust', label: 'Trust', past: 'Trusted', hint: "This is real. I'd open it or act on it." },
    report: { id: 'report', verdict: 'report', label: 'Report', past: 'Reported', hint: 'This is a phish. Send it to security.' },
    delete: { id: 'delete', verdict: 'delete', label: 'Delete', past: 'Deleted', hint: 'This is junk. Bin it.' },
    verify: { id: 'verify', verdict: 'verify', label: 'Verify', past: 'Verified', hint: 'I would check this by ringing a number I already hold.' }
});

/** 05 N10: the four call actions, each mapped to a verdict row. */
export const CALL_ACTIONS = Object.freeze([
    { id: 'comply', verdict: 'trust', label: 'Comply', past: 'Complied', hint: 'Do what the caller asks.' },
    { id: 'escalate', verdict: 'report', label: 'Escalate', past: 'Escalated', hint: 'Pass the call to security.' },
    { id: 'refuse', verdict: 'delete', label: 'Refuse', past: 'Refused', hint: 'Say no and hang up.' },
    { id: 'verify_callback', verdict: 'verify', label: 'Ring back', past: 'Rang back', hint: 'Hang up and ring back on a number you already hold.' }
]);

/** 05 N10: the three MFA prompt actions, each mapped to a verdict row. */
export const PUSH_ACTIONS = Object.freeze([
    { id: 'approve', verdict: 'trust', label: 'Approve', past: 'Approved', hint: 'Yes, this is me signing in.' },
    { id: 'deny', verdict: 'delete', label: 'Deny', past: 'Denied', hint: 'No, block this sign-in.' },
    { id: 'deny_report', verdict: 'report', label: 'Deny and report', past: 'Denied and reported', hint: 'Block it and tell security someone has my password.' }
]);

/**
 * The buttons under a message, in order. Email and the other kinds get the verdicts
 * (Verify only when the set enables it); `call` and `push` get their own actions.
 */
export function actionsFor(kind, verifyEnabled = false, labels = null) {
    if (kind === 'call') {
        return CALL_ACTIONS.filter((a) => verifyEnabled || a.verdict !== 'verify').map((a) => relabel(a, labels?.callActions?.[a.id]));
    }
    if (kind === 'push') return PUSH_ACTIONS.map((a) => relabel(a, labels?.pushActions?.[a.id]));
    const out = ['trust', 'report', 'delete'].map((v) => verdictAction(v, labels));
    if (verifyEnabled) out.push(verdictAction('verify', labels));
    return out;
}

/** The action a player took, by id, else the verdict's own action. */
export function actionById(kind, actionId, verdict, labels = null) {
    const all = [...CALL_ACTIONS, ...PUSH_ACTIONS, ...Object.values(VERDICT_ACTIONS)];
    const pool = kind === 'call' ? CALL_ACTIONS : kind === 'push' ? PUSH_ACTIONS : Object.values(VERDICT_ACTIONS);
    const found = pool.find((a) => a.id === actionId) || pool.find((a) => a.verdict === verdict)
        || all.find((a) => a.verdict === verdict) || VERDICT_ACTIONS.trust;
    const over = pool === CALL_ACTIONS ? labels?.callActions : pool === PUSH_ACTIONS ? labels?.pushActions : labels?.verdict;
    return relabel(found, over?.[found.id]);
}

/** Map an action id to the verdict it scores as. Throws on an action the kind does not have. */
export function verdictForAction(kind, actionId) {
    const a = actionsFor(kind, true).find((x) => x.id === actionId);
    if (!a) throw new RangeError(`triage-kinds: "${actionId}" is not an action for a ${kind} message`);
    return a.verdict;
}

/**
 * The review card's verdict line for a call or a push, where the email wording
 * ("This one was a phish") reads oddly. null for every other kind.
 */
export function kindVerdictLine(kind, isPhish, verdict) {
    if (kind === 'push') {
        return (isPhish ? {
            trust: "Approving let someone else into the account. They already have the password; the prompt was the last check.",
            delete: "Denying kept them out, but nobody was told that someone has your password.",
            report: 'Right call: denied and reported. Someone has your password, and security can now reset it.'
        } : {
            trust: 'Right call. You started this sign-in, so approving it is fine.',
            delete: "That one was yours. Denying it only means signing in again.",
            report: "That one was yours, but reporting a prompt you aren't sure about is never wrong."
        })[verdict] || null;
    }
    if (kind === 'call') {
        return (isPhish ? {
            trust: 'Not this time. The caller was not who they said.',
            report: 'Right call: escalated. Security can warn everyone else this caller might try.',
            delete: 'Safe, but nobody was warned. Escalating tells security this caller is working through the office.',
            verify: 'Right call: ringing back on a number you already hold is how you check.'
        } : {
            // Comply on a genuine caller is not full marks: the check is the lesson (P3 N16).
            trust: 'This caller was genuine, but you did what they asked without checking. An impostor sounds just the same, so ring back on the number you hold first.',
            report: 'That caller was genuine, but escalating when unsure is never wrong.',
            delete: 'That caller was genuine. Hanging up without offering a safe way to check left them stuck.',
            verify: 'Checking first is fine. This caller was genuine, and ringing back confirmed it.'
        })[verdict] || null;
    }
    return null;
}

/**
 * A short, clean name for an item inside a sentence (the result's "You trusted the real ones"
 * line). A text, call, voicemail, notice or prompt is named by who it came from; an email by its
 * subject. A title that was cut short with trailing dots loses them, so no quote closes on "..."
 * (P6-7, P5-6).
 */
export function shortTitle(msg) {
    const strip = (t) => String(t || '').replace(/\s*(?:\.{3,}|\u2026)\s*$/, '').replace(/[,;:\s]+$/, '').trim();
    const from = isObj(msg?.from) ? msg.from : null;
    const who = from ? (from.name || '') : (typeof msg?.from === 'string' ? msg.from : '');
    const subject = isStr(msg?.subject) ? msg.subject : '';
    if (isNonEmail(msg)) {
        const caller = isStr(msg?.callerId) ? msg.callerId : who;
        return strip(caller || subject || defaultSubject(msg));
    }
    return strip(subject || who);
}

// ── the authored-choice kind (`choice`, ENG-09a) ────────────────────────────────

/** The four built verdicts an option may map to. */
export const CHOICE_VERDICTS = Object.freeze(['trust', 'report', 'delete', 'verify']);

/** Default wording of a `choice` card (`set.labels.choice` layers over each line). */
const CHOICE_TEXT = Object.freeze({
    brief: 'On a question: pick the option you think is best. There is nothing to type.', // the brief's line
    group: 'Pick one',            // the option group's accessible name
    answered: 'Answered',         // the message row's badge once picked
    right: 'Right choice.',       // review card line after the full-marks option
    wrong: 'Not the best choice here.',
    better: 'The better choice',  // names the full-marks option after a wrong pick
    whyRight: 'Why',              // leads the truth.reportReply line after the right pick
    ifWrong: 'What could go wrong' // leads the truth.ifTrusted line after a wrong pick
});

/** One line of a choice card's wording: the set's `labels.choice[key]`, else the default. */
export function choiceText(key, labels = null) {
    const own = labels?.choice?.[key];
    return isStr(own) ? own : (CHOICE_TEXT[key] || '');
}

/** The card's options as `{ id, label, verdict }`, bad entries dropped. */
export function choiceOptions(rec) {
    const list = isObj(rec?.choice) && Array.isArray(rec.choice.options) ? rec.choice.options : [];
    return list.filter((o) => isObj(o) && isStr(o.id) && isStr(o.label) && CHOICE_VERDICTS.includes(o.verdict))
        .map((o) => ({ id: o.id, label: o.label, verdict: o.verdict }));
}

/** The option a learner picked, by id, else the first option with that verdict. */
export function choiceOptionFor(rec, actionId, verdict) {
    const all = choiceOptions(rec);
    return all.find((o) => o.id === actionId) || all.find((o) => o.verdict === verdict) || null;
}

/**
 * The noun for the genuine items of a queue that holds email (P6-5). A set can name it
 * (`realLabel`). A queue that mixes email with texts, notices or other channels names what it
 * holds ("Real texts, notices and emails"); a pure mail queue keeps "Real mail".
 */
export function realNounFor(kinds, set) {
    if (isStr(set?.realLabel)) return set.realLabel;
    const others = [...new Set((kinds || []).filter((k) => k !== 'email' && k !== 'playerSent'))];
    if (!others.length) return 'Real mail';
    const word = { sms: 'texts', qr: 'notices', voicemail: 'voicemails', page: 'pages', call: 'calls', push: 'prompts' };
    const names = [...others.map((k) => word[k] || 'messages'), 'emails'];
    return `Real ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** A list subject for a kind that has none of its own. */
export function defaultSubject(msg, labels = null) {
    const kind = kindOf(msg);
    const first = (s) => {
        const t = String(s || '').replace(/\{\{link:[^}]*\}\}/g, '').replace(/\s+/g, ' ').trim();
        if (t.length <= 48) return t;
        // Cut at the end of a sentence when one fits, else at a word, so no title stops on "A..."
        // (P7-7).
        const sentence = t.slice(0, 48).search(/[.!?](?=[^.!?]*$)/);
        if (sentence >= 15) return t.slice(0, sentence + 1);
        const cut = t.slice(0, 45);
        const sp = cut.lastIndexOf(' ');
        return `${(sp >= 15 ? cut.slice(0, sp) : cut).replace(/[,;:\s]+$/, '')}...`;
    };
    switch (kind) {
    case 'sms': return first(msg.body) || smsHeading(labels);
    case 'voicemail': return isStr(msg.duration) ? `Voicemail (${msg.duration})` : 'Voicemail';
    case 'qr': return 'Printed notice';
    case 'page': return isObj(msg.page) && isStr(msg.page.heading) ? msg.page.heading : 'Web page';
    case 'call': return 'Incoming call';
    case 'push': return isObj(msg.push) && isStr(msg.push.app) ? `${msg.push.app}: sign-in request` : 'Sign-in request';
    case 'choice': return isObj(msg.choice) && isStr(msg.choice.prompt) ? first(msg.choice.prompt) : kindLabel('choice', labels);
    default: return '';
    }
}

/** The host part of a URL-ish string, without scheme, path or port. */
export function hostOf(url) {
    const s = String(url || '').trim().replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
    return s.split(/[/?#]/)[0].replace(/:\d+$/, '').toLowerCase();
}

// ── decorative patterns (pure) ──────────────────────────────────────────────────

/** A small deterministic hash of a string (FNV-1a, 32-bit). */
export function hashString(s) {
    let h = 0x811c9dc5;
    const str = String(s || '');
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
}

/**
 * A QR-looking grid (size x size booleans) with the three finder squares in place and
 * pseudo-random cells elsewhere, seeded from `seed`. It encodes nothing.
 */
export function qrPattern(seed, size = 21) {
    let x = hashString(seed) || 1;
    const next = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x; };
    const grid = Array.from({ length: size }, () => Array(size).fill(false));
    const finder = (r0, c0) => {
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 7; c++) {
                const edge = r === 0 || r === 6 || c === 0 || c === 6;
                const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
                grid[r0 + r][c0 + c] = edge || core;
            }
        }
    };
    const inFinder = (r, c) => (r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8);
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (!inFinder(r, c)) grid[r][c] = (next() & 3) === 0 || (next() & 1) === 1;
        }
    }
    finder(0, 0);
    finder(0, size - 7);
    finder(size - 7, 0);
    return grid;
}

/** Bar heights (1 to 9) for the voicemail's static waveform, seeded from `seed`. */
export function waveBars(seed, count = 28) {
    let h = hashString(seed) || 7;
    const out = [];
    for (let i = 0; i < count; i++) {
        h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
        out.push(1 + (h % 9));
    }
    return out;
}

// ── DOM surfaces ────────────────────────────────────────────────────────────────

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function heading(text) {
    // .mail-subject so the reader's select() focuses it, as it does an email's subject
    const h = el('h2', 'mail-subject tri-kind-title', text);
    return h;
}

function transcriptList(lines, className) {
    const ol = el('ol', className);
    for (const line of Array.isArray(lines) ? lines : []) {
        if (!isObj(line) || !isStr(line.text)) continue;
        // "you" in any case marks the learner's side (authored data has used both "you" and "You").
        const isYou = isStr(line.who) && line.who.trim().toLowerCase() === 'you';
        const li = el('li', `tri-line tri-line-${isYou ? 'you' : 'them'}`);
        li.append(el('span', 'tri-line-who', isStr(line.who) ? (isYou ? 'You' : line.who) : 'Caller'),
            el('span', 'tri-line-text', line.text));
        ol.appendChild(li);
    }
    return ol;
}

function senderName(rec) {
    return rec?.from?.name || rec?.from?.address || '';
}

function sms(rec, h, labels) {
    const box = el('section', 'tri-kind tri-kind-sms tri-phone tri-phone-frame');
    box.setAttribute('aria-label', smsHeading(labels));
    // 11 N14: a phone body (speaker slot, status bar) around the thread. Decoration only.
    const status = el('div', 'tri-phone-status');
    status.setAttribute('aria-hidden', 'true');
    status.append(el('span', 'tri-phone-clock', isStr(rec.time) ? rec.time : ''), el('span', 'tri-phone-speaker'),
        el('span', 'tri-phone-battery'));
    box.appendChild(status);
    const top = el('div', 'tri-phone-top');
    top.append(heading(senderName(rec) || 'Unknown sender'));
    if (rec.from?.name && rec.from?.address) top.appendChild(el('p', 'tri-phone-number', rec.from.address));
    top.appendChild(el('p', 'tri-kind-label', smsHeading(labels)));
    box.appendChild(top);
    const thread = el('div', 'tri-sms-thread');
    for (const prior of Array.isArray(rec.earlier) ? rec.earlier : []) {
        if (!isObj(prior) || !isStr(prior.text)) continue;
        const b = el('div', 'tri-sms-bubble tri-sms-earlier');
        b.appendChild(el('p', 'tri-sms-text', prior.text));
        if (isStr(prior.time)) b.appendChild(el('p', 'tri-sms-time', prior.time));
        thread.appendChild(b);
    }
    const bubble = el('div', 'tri-sms-bubble');
    const body = h.bodyNode(rec);
    body.classList.add('tri-sms-text');
    bubble.appendChild(body);
    if (rec.time) bubble.appendChild(el('p', 'tri-sms-time', rec.time));
    thread.appendChild(bubble);
    box.appendChild(thread);
    return box;
}

function voicemail(rec) {
    const box = el('section', 'tri-kind tri-kind-voicemail');
    box.setAttribute('aria-label', 'Voicemail');
    // 11 N12: `audio: { clipId }` is reserved for the voicemail player (N12-audio). It draws
    // nothing yet; the card stays transcript-only. The id is kept on the card for content checks.
    if (isObj(rec.audio) && isStr(rec.audio.clipId)) box.dataset.audioClip = rec.audio.clipId;
    box.appendChild(el('p', 'tri-kind-label', 'Voicemail'));
    box.appendChild(heading(senderName(rec) || 'Unknown caller'));
    const meta = el('p', 'tri-vm-meta');
    const bits = [];
    if (rec.from?.name && rec.from?.address) bits.push(rec.from.address);
    if (rec.time) bits.push(rec.time);
    if (isStr(rec.duration)) bits.push(rec.duration);
    meta.textContent = bits.join(' · ');
    box.appendChild(meta);
    const wave = el('div', 'tri-vm-wave');
    wave.setAttribute('aria-hidden', 'true');
    for (const n of waveBars(rec.id)) {
        const bar = el('span', 'tri-vm-bar');
        bar.style.height = `${n * 3}px`;
        wave.appendChild(bar);
    }
    box.appendChild(wave);
    box.appendChild(el('h3', 'tri-vm-heading', 'Transcript'));
    if (Array.isArray(rec.transcript) && rec.transcript.length) {
        box.appendChild(transcriptList(rec.transcript, 'tri-transcript'));
    } else {
        box.appendChild(el('p', 'tri-vm-text', rec.body || ''));
    }
    return box;
}

function qr(rec, h) {
    const q = isObj(rec.qr) ? rec.qr : {};
    const box = el('section', 'tri-kind tri-kind-qr tri-notice tri-poster');
    box.setAttribute('aria-label', 'Printed notice');
    // 11 N14: a poster on a wall (tape at the corners, a pinned look). Decoration only.
    for (const pos of ['left', 'right']) {
        const tape = el('span', `tri-poster-tape tri-poster-tape-${pos}`);
        tape.setAttribute('aria-hidden', 'true');
        box.appendChild(tape);
    }
    if (isStr(q.location)) box.appendChild(el('p', 'tri-kind-label', `Seen: ${q.location}`));
    else box.appendChild(el('p', 'tri-kind-label', 'Printed notice'));
    box.appendChild(heading(rec.subject || 'Notice'));
    if (rec.body) box.appendChild(el('p', 'tri-notice-text', rec.body));
    const code = el('div', 'tri-qr');
    code.setAttribute('role', 'img');
    code.setAttribute('aria-label', 'A QR code');
    const grid = qrPattern(rec.id);
    code.style.setProperty('--tri-qr-size', String(grid.length));
    for (const row of grid) for (const on of row) code.appendChild(el('span', on ? 'tri-qr-cell on' : 'tri-qr-cell'));
    box.appendChild(code);
    if (isStr(q.caption)) box.appendChild(el('p', 'tri-qr-caption', q.caption));
    const where = el('button', 'tri-qr-where minigame-button', 'Where does this code go?');
    where.type = 'button';
    where.addEventListener('click', () => h.showLink(q.destination || 'nowhere the notice says'));
    box.appendChild(where);
    return box;
}

// The browser chrome (padlock / "Not secure", address button, optional certificate panel),
// shared by the ordinary page and the ENG-03a web-page states. Returns { bar, certPanel }.
function browserBar(p, h) {
    const bar = el('div', 'tri-browser-bar');
    if (p.padlock === true) {
        const lock = el('button', 'tri-padlock minigame-button', 'Padlock');
        lock.type = 'button';
        lock.setAttribute('aria-label', 'Padlock: what does it mean?');
        lock.addEventListener('click', () => h.showNote(
            `The padlock means the connection to ${hostOf(p.url)} is encrypted. It says nothing about who runs ${hostOf(p.url)}.`));
        bar.appendChild(lock);
    } else {
        bar.appendChild(el('span', 'tri-no-padlock', 'Not secure'));
    }
    const addr = el('button', 'tri-address minigame-button', p.url || '');
    addr.type = 'button';
    addr.setAttribute('aria-label', `Address bar: ${p.url || ''}`);
    addr.addEventListener('click', () => h.showNote(`Full address: ${p.url || ''}. The site is ${hostOf(p.url)}.`));
    bar.appendChild(addr);
    // 11 N13: `page.certificate: { issuedTo, issuer?, note? }` adds a Certificate check to a page
    // with a padlock: who the certificate was issued to, and what it does not prove.
    const cert = isObj(p.certificate) && isStr(p.certificate.issuedTo) ? p.certificate : null;
    let certPanel = null;
    if (cert && p.padlock === true) {
        const btn = el('button', 'tri-cert-btn minigame-button', 'Certificate');
        btn.type = 'button';
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Certificate: who is this site registered to?');
        bar.appendChild(btn);
        certPanel = el('div', 'tri-cert-panel');
        certPanel.hidden = true;
        certPanel.setAttribute('role', 'region');
        certPanel.setAttribute('aria-label', 'Certificate details');
        certPanel.appendChild(el('p', 'tri-cert-issued', `Issued to: ${cert.issuedTo}`));
        if (isStr(cert.issuer)) certPanel.appendChild(el('p', 'tri-cert-issuer', `Issued by: ${cert.issuer}`));
        certPanel.appendChild(el('p', 'tri-cert-not',
            isStr(cert.note) ? cert.note
                : 'A certificate does not prove the site is honest, or that it is the one you meant to visit.'));
        btn.addEventListener('click', () => {
            certPanel.hidden = !certPanel.hidden;
            btn.setAttribute('aria-expanded', certPanel.hidden ? 'false' : 'true');
        });
    }
    return { bar, certPanel };
}

/** Append the browser chrome to a state surface's box. */
function appendBar(box, p, h) {
    const { bar, certPanel } = browserBar(p, h);
    box.appendChild(bar);
    if (certPanel) box.appendChild(certPanel);
}

function page(rec, h) {
    const p = isObj(rec.page) ? rec.page : {};
    const state = isStr(p.state) ? p.state : null;
    const box = el('section', 'tri-kind tri-kind-page tri-browser');
    box.setAttribute('aria-label', 'Web page');
    // ENG-03a: an authored browser-screen state draws its own block; absent renders the ordinary
    // E5 page below, byte-for-byte as before.
    if (state && PAGE_STATES[state]) {
        box.classList.add('tri-page-state', `tri-page-${state}`);
        PAGE_STATES[state](box, rec, p, h);
        return box;
    }
    const { bar, certPanel } = browserBar(p, h);
    box.appendChild(bar);
    if (certPanel) box.appendChild(certPanel);
    const view = el('div', 'tri-browser-view');
    view.appendChild(heading(p.heading || rec.subject || 'Web page'));
    if (rec.body) view.appendChild(el('p', 'tri-page-text', rec.body));
    const fields = Array.isArray(p.fields) ? p.fields.filter(isStr) : [];
    if (fields.length) {
        const form = el('div', 'tri-page-form');
        form.setAttribute('aria-label', 'Sign-in form (nothing can be typed)');
        for (const f of fields) {
            const row = el('div', 'tri-page-field');
            row.append(el('span', 'tri-page-field-label', f), el('span', 'tri-page-field-box'));
            form.appendChild(row);
        }
        if (isStr(p.button)) form.appendChild(el('span', 'tri-page-button', p.button));
        view.appendChild(form);
        // 11 N13: `page.autofill` is 'none' (the password manager offered nothing here) or
        // 'filled'. A password manager only offers to fill a password, so the cue exists only on a
        // form that asks for one (E5-10, accuracy). It is not printed on the page: a line on every
        // page read as the answer to every item (P3 E5-10). The learner checks for it, the way
        // they would at a real sign-in box, with "Try your password manager", which reveals it.
        const hasPassword = fields.some((f) => /pass(word|code)/i.test(f));
        if (hasPassword && (p.autofill === 'none' || p.autofill === 'filled')) {
            const filled = p.autofill === 'filled';
            const cue = el('p', `tri-autofill ${filled ? 'tri-autofill-filled' : 'tri-autofill-none'}`,
                filled ? 'Your password manager filled this in.' : 'Your password manager did not fill this in.');
            cue.hidden = true;
            const btn = el('button', 'tri-autofill-btn minigame-button', 'Try your password manager');
            btn.type = 'button';
            btn.setAttribute('aria-expanded', 'false');
            btn.addEventListener('click', () => {
                cue.hidden = false;
                btn.setAttribute('aria-expanded', 'true');
            });
            view.append(btn, cue);
        }
    }
    box.appendChild(view);
    return box;
}

// ── ENG-03a web-page states ─────────────────────────────────────────────────────
// Each draws an authored, static block. Every string goes in with textContent. Nothing runs on
// the computer and nothing is ever written to the real clipboard; the paste-and-run steps are the
// authored `rec.body` text, drawn inert, and the only "command" shown is the harmless one-line
// `page.clipboardReveal` description.

/** A reveal button that toggles one hidden authored line (the fakeCheck clipboard reveal). */
function revealLine(label, text) {
    const wrap = el('div', 'tri-page-reveal');
    const line = el('p', 'tri-page-reveal-text', isStr(text) ? text : '');
    line.hidden = true;
    const btn = el('button', 'tri-page-reveal-btn minigame-button', label);
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', () => { line.hidden = false; btn.setAttribute('aria-expanded', 'true'); });
    wrap.append(btn, line);
    return wrap;
}

function stateFakeCheck(box, rec, p, h) {
    appendBar(box, p, h);
    const view = el('div', 'tri-browser-view tri-fakecheck');
    view.appendChild(heading(p.heading || 'Verify you are human'));
    if (rec.body) view.appendChild(el('p', 'tri-page-text', rec.body));
    // The one-line description of what the page copied, behind a reveal; the command is never shown.
    view.appendChild(revealLine('What did this page copy?', p.clipboardReveal));
    box.appendChild(view);
}

function stateFakeUpdate(box, rec, p, h) {
    appendBar(box, p, h);
    const view = el('div', 'tri-browser-view tri-fake-update');
    view.appendChild(heading(p.heading || 'Update required'));
    if (rec.body) view.appendChild(el('p', 'tri-page-text', rec.body));
    // A drawn button face only: nothing to click into, no download happens.
    view.appendChild(el('span', 'tri-page-button', isStr(p.button) ? p.button : 'Download update'));
    box.appendChild(view);
}

function stateDownloadBar(box, rec, p, h) {
    appendBar(box, p, h);
    const view = el('div', 'tri-browser-view tri-download');
    view.appendChild(heading(p.heading || 'Download complete'));
    if (rec.body) view.appendChild(el('p', 'tri-page-text', rec.body));
    const bar = el('div', 'tri-download-bar');
    const name = isObj(p.download) && isStr(p.download.filename) ? p.download.filename : '';
    bar.append(el('span', 'tri-download-name', name), el('span', 'tri-download-face', 'Open file'));
    view.appendChild(bar);
    box.appendChild(view);
}

function stateBrowserWarning(box, rec, p, h) {
    appendBar(box, p, h);
    const view = el('div', 'tri-browser-view tri-browser-warning');
    view.appendChild(heading(p.heading || 'Deceptive site ahead'));
    if (rec.body) view.appendChild(el('p', 'tri-page-text', rec.body));
    // A genuine browser warning: the safe move is to go back.
    view.appendChild(el('span', 'tri-page-button tri-warning-back', 'Go back'));
    box.appendChild(view);
}

function stateRelaunchBar(box, rec, p) {
    // The browser's own menu bar, not a web page: no address bar.
    const bar = el('div', 'tri-relaunch-bar');
    bar.appendChild(el('p', 'tri-kind-label', 'Your browser'));
    bar.appendChild(heading(p.heading || 'An update is ready'));
    if (rec.body) bar.appendChild(el('p', 'tri-page-text', rec.body));
    bar.appendChild(el('span', 'tri-page-button', isStr(p.button) ? p.button : 'Relaunch'));
    box.appendChild(bar);
}

function stateExtensionPermission(box, rec, p) {
    // A store listing / permission overlay: no address bar.
    const view = el('div', 'tri-ext-permission');
    view.appendChild(heading(p.heading || 'Add this extension?'));
    if (rec.body) view.appendChild(el('p', 'tri-page-text', rec.body));
    const perms = Array.isArray(p.permissions) ? p.permissions.filter(isStr) : [];
    if (perms.length) {
        view.appendChild(el('p', 'tri-ext-perms-label', 'It can:'));
        const ul = el('ul', 'tri-ext-perms');
        for (const perm of perms) ul.appendChild(el('li', 'tri-ext-perm', perm));
        view.appendChild(ul);
    }
    box.appendChild(view);
}

function stateFullScreenAlarm(box, rec, p) {
    // A full-screen overlay: no address bar, silent, always a visible way out.
    const alarm = el('div', 'tri-alarm');
    // Honour prefers-reduced-motion: no shake or flash when it is set (and stay calm regardless).
    let reduced = false;
    try {
        reduced = !!(typeof window !== 'undefined' && window.matchMedia
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { reduced = false; }
    if (!reduced) alarm.classList.add('tri-alarm-pulse');
    alarm.appendChild(el('p', 'tri-alarm-muted', 'This page is trying to play a loud alarm. The sound is muted.'));
    alarm.appendChild(heading(p.heading || 'Your computer has been locked'));
    if (rec.body) alarm.appendChild(el('p', 'tri-page-text', rec.body));
    // A visible way out, always present.
    alarm.appendChild(el('span', 'tri-alarm-close', 'Close'));
    const hint = el('p', 'tri-alarm-hint', 'Can’t close it? Press Esc, or close the tab or the browser.');
    hint.hidden = true;
    const ms = isObj(p.alarm) && Number.isFinite(p.alarm.hintAfterMs) ? p.alarm.hintAfterMs : 30000;
    const t = setTimeout(() => { hint.hidden = false; }, ms);
    if (t && typeof t.unref === 'function') t.unref();
    alarm.appendChild(hint);
    box.appendChild(alarm);
}

// ENG-14: a Wi-Fi network list. Not a web page, so no address bar and no url. Each row is static
// (nothing to click or type, no network is joined): the network name in the address font (a name
// is an identifier whose exact letters matter, so every row uses it and none stands out), a lock in
// words as well as a drawn icon, and signal as bars plus a word. The learner's answer is the
// ordinary page verdict.
const WIFI_SIGNAL_WORDS = Object.freeze({ strong: 4, good: 3, fair: 2, weak: 1 });
const WIFI_BAR_WORDS = ['No signal', 'Weak', 'Fair', 'Good', 'Strong'];

/** Signal bars 0-4 for a number (0-4 as bars, above 4 as a percentage) or a word (strong/good/fair/weak). */
function wifiBars(signal) {
    if (typeof signal === 'number' && Number.isFinite(signal)) {
        const n = signal > 4 ? Math.ceil(signal / 25) : Math.round(signal);
        return Math.max(0, Math.min(4, n));
    }
    if (isStr(signal)) {
        const known = WIFI_SIGNAL_WORDS[signal.trim().toLowerCase()];
        if (known !== undefined) return known;
    }
    return null;
}

function wifiRow(n, labels) {
    const row = el('li', 'tri-wifi-row');
    row.appendChild(el('span', 'tri-wifi-ssid', n.ssid));
    const meta = el('div', 'tri-wifi-meta');
    if (typeof n.secured === 'boolean') {
        const lock = el('span', `tri-wifi-lock-wrap ${n.secured ? 'tri-wifi-secured' : 'tri-wifi-open'}`);
        const icon = el('span', 'tri-wifi-lock');
        icon.setAttribute('aria-hidden', 'true');
        lock.append(icon, el('span', 'tri-wifi-lock-word', n.secured ? labels.secured : labels.open));
        meta.appendChild(lock);
    }
    const bars = wifiBars(n.signal);
    const sig = el('span', 'tri-wifi-signal');
    const meter = el('span', 'tri-wifi-bars');
    meter.setAttribute('aria-hidden', 'true');
    for (let i = 1; i <= 4; i++) meter.appendChild(el('span', `tri-wifi-bar tri-wifi-bar-${i}${bars !== null && i <= bars ? ' on' : ''}`));
    const word = bars !== null ? WIFI_BAR_WORDS[bars] : (isStr(n.signal) ? n.signal : '');
    sig.append(meter, el('span', 'tri-wifi-signal-word', word ? `${word} signal` : ''));
    meta.appendChild(sig);
    row.appendChild(meta);
    if (isStr(n.note)) row.appendChild(el('p', 'tri-wifi-note', n.note));
    return row;
}

function stateWifiList(box, rec, p) {
    const labels = {
        secured: isObj(p.labels) && isStr(p.labels.secured) ? p.labels.secured : 'Secured (password needed)',
        open: isObj(p.labels) && isStr(p.labels.open) ? p.labels.open : 'Open (no password)'
    };
    box.setAttribute('aria-label', 'Wi-Fi networks');
    const view = el('div', 'tri-browser-view tri-wifi');
    view.appendChild(el('p', 'tri-kind-label', 'Wi-Fi'));
    view.appendChild(heading(p.heading || 'Wi-Fi networks nearby'));
    if (isStr(p.venueNote)) view.appendChild(el('p', 'tri-wifi-venue', p.venueNote));
    if (rec.body) view.appendChild(el('p', 'tri-page-text', rec.body));
    const list = el('ul', 'tri-wifi-list');
    list.setAttribute('aria-label', 'Networks in range (nothing here can be joined)');
    for (const n of Array.isArray(p.networks) ? p.networks : []) {
        if (isObj(n) && isStr(n.ssid)) list.appendChild(wifiRow(n, labels));
    }
    view.appendChild(list);
    box.appendChild(view);
}

const PAGE_STATES = {
    fakeCheck: stateFakeCheck,
    fakeUpdate: stateFakeUpdate,
    downloadBar: stateDownloadBar,
    browserWarning: stateBrowserWarning,
    relaunchBar: stateRelaunchBar,
    extensionPermission: stateExtensionPermission,
    fullScreenAlarm: stateFullScreenAlarm,
    wifiList: stateWifiList
};

function call(rec) {
    const box = el('section', 'tri-kind tri-kind-call');
    box.setAttribute('aria-label', 'Phone call');
    box.appendChild(el('p', 'tri-kind-label', 'Incoming call'));
    box.appendChild(heading(rec.callerId || senderName(rec) || 'Unknown caller'));
    const meta = [];
    if (rec.from?.address) meta.push(rec.from.address);
    if (rec.time) meta.push(rec.time);
    if (meta.length) box.appendChild(el('p', 'tri-call-meta', meta.join(' · ')));
    // 11 N15, the role swap: what the caller claims, fact by fact. These are the facts the
    // learner used in the attack call, so the card shows what there is to check.
    const claims = (Array.isArray(rec.claims) ? rec.claims : []).filter((c) => isObj(c) && isStr(c.fact));
    if (claims.length) {
        const wrap = el('div', 'tri-call-claims');
        wrap.appendChild(el('p', 'tri-call-claims-label', 'What the caller claims'));
        const dl = el('dl', 'tri-call-claims-list');
        for (const c of claims) {
            const row = el('div', 'tri-call-claim');
            row.dataset.fact = c.fact;
            row.append(el('dt', 'tri-claim-fact', claimLabel(c.fact)), el('dd', 'tri-claim-value', String(c.value ?? '')));
            dl.appendChild(row);
        }
        wrap.appendChild(dl);
        box.appendChild(wrap);
    }
    box.appendChild(transcriptList(rec.transcript, 'tri-transcript tri-call-transcript'));
    return box;
}

// Plain words for the 06 `knows` ids a role-swap claim names; others are spaced out.
const CLAIM_LABELS = Object.freeze({
    who: 'Name', team: 'Team', manager: 'Manager', staffId: 'Staff reference', role: 'Role',
    phone: 'Phone number', email: 'Email address', location: 'Location', employeeId: 'Employee number'
});

/** The label for a claim's fact id ('staffId' -> 'Staff reference', 'cost_centre' -> 'Cost centre'). */
export function claimLabel(fact) {
    if (CLAIM_LABELS[fact]) return CLAIM_LABELS[fact];
    const spaced = String(fact).replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function push(rec) {
    const p = isObj(rec.push) ? rec.push : {};
    const box = el('section', 'tri-kind tri-kind-push tri-phone');
    box.setAttribute('aria-label', 'Sign-in prompt');
    box.appendChild(el('p', 'tri-kind-label', p.app || 'Authenticator'));
    box.appendChild(heading(p.request || 'Are you trying to sign in?'));
    const dl = el('dl', 'tri-push-details');
    const add = (k, v) => { if (isStr(v)) dl.append(el('dt', null, k), el('dd', null, v)); };
    add('Account', p.account);
    add('Time', rec.time);
    add('Location', p.location);
    add('Device', p.device);
    box.appendChild(dl);
    return box;
}

function choice(rec, h, labels) {
    const c = isObj(rec.choice) ? rec.choice : {};
    const box = el('section', 'tri-kind tri-kind-choice');
    box.setAttribute('aria-label', kindLabel('choice', labels));
    box.appendChild(el('p', 'tri-kind-label', kindLabel('choice', labels)));
    box.appendChild(heading(isStr(c.prompt) ? c.prompt : (rec.subject || kindLabel('choice', labels))));
    if (isStr(c.note)) box.appendChild(el('p', 'tri-choice-note', c.note));
    return box;
}

const SURFACES = { sms, voicemail, qr, page, call, push, choice };

/**
 * The reading-pane surface for a non-email message, or null for email.
 * `h` holds the reader's helpers: bodyNode(rec) (the body with hover-able link chips),
 * showLink(dest) and showNote(text) (both write the pane's status line).
 */
export function renderKindSurface(rec, h, labels = null) {
    const fn = SURFACES[kindOf(rec)];
    if (!fn) return null;
    const node = fn(rec, h, labels);
    node.dataset.kindSurface = kindOf(rec);
    return node;
}
