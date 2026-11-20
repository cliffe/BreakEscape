/**
 * Ink-driven plain email: the pure helpers (docs/agents/MAIL_PLAIN_AND_DM_DESIGN.md (a);
 * README_scenario_design.md "Ink-driven email").
 *
 * A contact with an `npc` id is an ink correspondent: one ink story per correspondent, and
 * that story is the email thread. This file holds what both the mail runner and the mail
 * client need without touching ink or the DOM:
 *
 *   - thread keys (`npc:<npcId>:<accountId>`, never colliding with `<character>:<account>`);
 *   - contact lookups and the reply delay rule;
 *   - the mail-only ink tags (`subject`, `attach`, `forward`, `reply_after`, `speaker`,
 *     `mail_later`, `compose_reply`, `send_email`) split from the game tags;
 *   - splitPlainRun: where the player's message ends and the NPC's reply begins;
 *   - queuePlainEmail: start an NPC-sent thread (timedEmails, the `sendEmail` mapping, the
 *     `# send_email` tag all call it);
 *   - installTimedEmails: schedule each contact's `timedEmails`, once.
 *
 * No imports, so node tests load it directly. window is read only through injectable options.
 */

const isStr = (v) => typeof v === 'string' && v.length > 0;
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const arr = (v) => (Array.isArray(v) ? v : []);

export const PLAIN_PREFIX = 'npc:';
/** Default reply delay when neither `# reply_after` nor the contact says (same as judged mail). */
export const DEFAULT_PLAIN_DELAY_SECONDS = 20;
/** The tag names this module reserves for mail runs (never forwarded to the game-tag processor). */
export const MAIL_ONLY_TAGS = ['subject', 'attach', 'forward', 'reply_after', 'speaker', 'mail_later', 'compose_reply', 'send_email'];

// ───────────────────────────────────────────────── thread keys

export function plainThreadKey(npcId, accountId) {
    return `${PLAIN_PREFIX}${npcId}:${accountId}`;
}

/** { npcId, accountId } for a plain thread key, else null. Ids hold no colon. */
export function parsePlainThreadKey(key) {
    if (!isStr(key) || !key.startsWith(PLAIN_PREFIX)) return null;
    const rest = key.slice(PLAIN_PREFIX.length);
    const colon = rest.lastIndexOf(':');
    if (colon <= 0 || colon === rest.length - 1) return null;
    return { npcId: rest.slice(0, colon), accountId: rest.slice(colon + 1) };
}

export const isPlainThreadKey = (key) => parsePlainThreadKey(key) !== null;

// ───────────────────────────────────────────────── contacts

/** The contact that names `npcId` as its ink correspondent, or null. */
export function contactForNpc(config, npcId) {
    return arr(config && config.contacts).find((c) => isObject(c) && isStr(c.npc) && c.npc === npcId) || null;
}

/** True for a contact driven by an ink story (`npc` set). */
export const isInkContact = (contact) => isObject(contact) && isStr(contact.npc);

/** True for a contact that can also be phished (`targetId` set). */
export const isJudgedContact = (contact) => isObject(contact) && isStr(contact.targetId);

/**
 * Is the judged "Write your own message" door open on a contact that is both ink and judged?
 * `judgedWhen` names a global that must be true; absent, the door is always open (so a contact
 * that gained an `npc` keeps the judged path it had). A judged-only contact is always judged.
 */
export function judgedDoorOpen(contact, globals = {}) {
    if (!isJudgedContact(contact)) return false;
    if (!isInkContact(contact)) return true;
    if (!isStr(contact.judgedWhen)) return true;
    return !!(globals && globals[contact.judgedWhen]);
}

/**
 * Which composer a contact gets: 'judged' (the existing composer), 'ink' (suggested replies,
 * no judging) or 'both' (suggested replies with a "Write your own message" door into the
 * judged composer). 'none' for a contact that is neither (the unjudged, contentless send the
 * composer has always allowed).
 */
export function contactMode(contact, globals = {}) {
    const ink = isInkContact(contact);
    const judged = isJudgedContact(contact);
    if (ink && judged) return judgedDoorOpen(contact, globals) ? 'both' : 'ink';
    if (ink) return 'ink';
    if (judged) return 'judged';
    return 'none';
}

/** Seconds the contact's reply takes when the ink gives no `# reply_after`. */
export function replyDelaySeconds(contact) {
    const own = contact && contact.replyDelaySeconds;
    if (Number.isFinite(own) && own >= 0) return own;
    const rec = contact && isObject(contact.emailRecord) ? contact.emailRecord.replyDelaySeconds : undefined;
    if (Number.isFinite(rec) && rec >= 0) return rec;
    return DEFAULT_PLAIN_DELAY_SECONDS;
}

/** The account an NPC writes to: the contact's first accountIds entry, else the first account. */
export function defaultAccountFor(config, contact) {
    const listed = arr(contact && contact.accountIds).find(isStr);
    if (listed) return listed;
    const first = arr(config && config.accounts).find((a) => isObject(a) && isStr(a.id));
    return first ? first.id : null;
}

export function contactAddress(contact) {
    return arr(contact && contact.addresses).find(isStr) || '';
}

// ───────────────────────────────────────────────── labels

/**
 * The few words the plain (ink) composer and the suggested-reply chips show. A scenario
 * overrides any of them with `social.mailClient.labels`; nothing here mentions judging or red
 * flags, which the plain composer never shows.
 */
export const PLAIN_LABELS = Object.freeze({
    suggestedReplies: 'Suggested replies',
    loading: 'Loading suggestions...',
    waiting: 'Message sent. Waiting for a reply.',
    nothing: 'Nothing to write to them about yet.',
    chooseAnother: 'Choose another reply',
    writeYourOwn: 'Write your own message',
    backToSuggestions: 'Back to suggested replies',
    from: 'From',
    subject: 'Subject',
    attachments: 'Attachments',
    send: 'Send',
    sending: 'Sending...',
    sentNote: 'Message sent.',
    unavailable: 'That reply is no longer available.',
    forwardMissing: 'The message you meant to forward is not in this inbox.'
});

export function plainLabels(config) {
    const own = config && isObject(config.labels) ? config.labels : {};
    const out = { ...PLAIN_LABELS };
    for (const key of Object.keys(PLAIN_LABELS)) if (isStr(own[key])) out[key] = own[key];
    return out;
}

// ───────────────────────────────────────────────── tags

/** { action, param } for one raw tag ("reply_after:20" -> reply_after / "20"). */
export function parseTag(raw) {
    const tag = String(raw == null ? '' : raw).trim();
    const colon = tag.indexOf(':');
    return {
        action: (colon === -1 ? tag : tag.slice(0, colon)).trim().toLowerCase(),
        param: colon === -1 ? '' : tag.slice(colon + 1).trim()
    };
}

/**
 * Split raw tags into the mail-only ones (subject, attach, forward, reply_after, speaker,
 * mail_later, compose_reply, send_email) and the game tags the tag processor runs.
 * @returns {{subject, attach, forward, replyAfter, player, mailLater, composeReply, sendEmail, gameTags}}
 */
export function splitMailTags(tags) {
    const out = {
        subject: null, attach: [], forward: null, replyAfter: null, player: false,
        mailLater: null, composeReply: null, sendEmail: [], gameTags: []
    };
    for (const raw of arr(tags)) {
        const { action, param } = parseTag(raw);
        if (!action) continue;
        switch (action) {
            case 'subject': if (isStr(param)) out.subject = param; break;
            case 'attach': if (isStr(param) && !out.attach.includes(param)) out.attach.push(param); break;
            case 'forward': if (isStr(param) && !out.forward) out.forward = param; break;
            case 'reply_after': {
                const n = Number(param);
                if (out.replyAfter === null) out.replyAfter = Number.isFinite(n) && n >= 0 ? n : 0;
                break;
            }
            case 'speaker': if (param.toLowerCase() === 'player') out.player = true; break;
            case 'mail_later': {
                const sep = param.indexOf(':');
                const seconds = Number(sep === -1 ? param : param.slice(0, sep));
                const knot = sep === -1 ? '' : param.slice(sep + 1).trim();
                if (!out.mailLater && isStr(knot)) out.mailLater = { seconds: Number.isFinite(seconds) ? seconds : 0, knot };
                break;
            }
            case 'compose_reply': if (isStr(param)) out.composeReply = param; break;
            case 'send_email': {
                // send_email:<npc>:<knot>[:<seconds>]
                const bits = param.split(':').map((b) => b.trim());
                if (isStr(bits[0]) && isStr(bits[1])) {
                    const seconds = bits[2] !== undefined && bits[2] !== '' ? Number(bits[2]) : 0;
                    out.sendEmail.push({ npcId: bits[0], knot: bits[1], seconds: Number.isFinite(seconds) ? seconds : 0 });
                }
                break;
            }
            default: out.gameTags.push(raw);
        }
    }
    return out;
}

// ───────────────────────────────────────────────── the player/NPC split

/**
 * Where the player's message ends and the NPC's reply begins in the run of a picked choice.
 *
 * `lines` is one entry per ink Continue() after ChooseChoiceIndex: { text, tags }. Line 0 is
 * what the choice itself prints (the start text of `* Start [label] rest`), which is empty for
 * a label-only `* [label]` choice. Tags written above a line, or at the end of it, arrive with
 * that line.
 *
 * The split, first rule that applies:
 *  1. A line carrying `# reply_after:<n>` is the first line of the reply. Everything before it
 *     is the player's message. Tags on that line written before `reply_after` apply at send;
 *     tags after it belong to the reply.
 *  2. Otherwise the choice output (line 0) plus the unbroken run of lines tagged
 *     `# speaker:player` straight after it is the player's message; the rest is the reply.
 *  3. Otherwise the choice output alone is the player's message.
 * If the player part prints nothing the body is the chip text (the choice's own display text).
 *
 * @param {{text:string, tags:string[]}[]} lines
 * @param {string} chipText the choice's display text
 * @returns {{boundary:number, replyAfter:number|null, body:string, subject:string|null,
 *            attach:string[], forward:string|null, gameTags:string[], hasReply:boolean, rule:number}}
 */
export function splitPlainRun(lines, chipText = '') {
    const rows = arr(lines).map((l) => ({
        text: typeof l?.text === 'string' ? l.text.trim() : '',
        tags: arr(l?.tags).map(String)
    }));
    let boundary = -1;
    let splitAt = 0;       // index into rows[boundary].tags where the reply's tags start
    let replyAfter = null;
    let rule = 3;
    for (let i = 0; i < rows.length && boundary < 0; i++) {
        const j = rows[i].tags.findIndex((t) => parseTag(t).action === 'reply_after');
        if (j >= 0) {
            boundary = i; splitAt = j + 1; rule = 1;
            const n = Number(parseTag(rows[i].tags[j]).param);
            replyAfter = Number.isFinite(n) && n >= 0 ? n : 0;
        }
    }
    if (boundary < 0) {
        let k = Math.min(1, rows.length);
        if (rows.length > 1 && rows.slice(1).some((r) => splitMailTags(r.tags).player)) {
            while (k < rows.length && splitMailTags(rows[k].tags).player) k++;
            rule = 2;
        }
        boundary = k;
        splitAt = 0;
    }

    const sendTags = [];
    for (let i = 0; i < boundary; i++) sendTags.push(...rows[i].tags);
    if (rule === 1 && boundary < rows.length) sendTags.push(...rows[boundary].tags.slice(0, splitAt - 1));
    const split = splitMailTags(sendTags);

    const playerTexts = rows.slice(0, boundary).map((r) => r.text).filter(Boolean);
    const body = playerTexts.length ? playerTexts.join('\n\n') : String(chipText || '');
    const replyRows = rows.slice(boundary);
    const hasReply = replyRows.some((r, idx) => r.text || (idx === 0 ? r.tags.slice(splitAt).length > 0 : r.tags.length > 0));
    return {
        boundary, replyAfter, body, rule, hasReply,
        subject: split.subject, attach: split.attach, forward: split.forward, gameTags: split.gameTags
    };
}

/** The tags of the first reply line with the player's part removed (a job resumed after a send). */
export function replyTagsOfFirstLine(tags) {
    const list = arr(tags).map(String);
    const j = list.findIndex((t) => parseTag(t).action === 'reply_after');
    return j >= 0 ? list.slice(j + 1) : list;
}

// ───────────────────────────────────────────────── starting a thread

let jobSeq = 0;
export function newPlainJobId(prefix = 'plain') {
    return `${prefix}_${Date.now().toString(36)}_${(++jobSeq).toString(36)}`;
}

/**
 * Queue an NPC-started email: an ink job that runs `knot` of the contact's story and delivers
 * the lines as one email into the contact's account. Used by timedEmails, the eventMapping
 * `sendEmail` action and the `# send_email` tag. A caller may pass a fixed `jobId` so the same
 * email is never queued twice (a pending job, or the delivered message, stops it).
 * @returns {Object|null} the stored job, or null (nothing to do, with a console warning)
 */
export function queuePlainEmail(scheduler, scenario, { npcId, knot, delaySeconds = 0, accountId = null, jobId = null } = {}) {
    if (!scheduler || !isStr(npcId) || !isStr(knot)) return null;
    const config = scenario && scenario.social && scenario.social.mailClient;
    const contact = contactForNpc(config, npcId);
    if (!contact) {
        console.warn(`[mail-ink] ${npcId} is not an ink contact (no mailClient.contacts entry with npc "${npcId}"); email not sent`);
        return null;
    }
    const acct = isStr(accountId) ? accountId : defaultAccountFor(config, contact);
    if (!acct) return null;
    const id = isStr(jobId) ? jobId : newPlainJobId();
    if (isStr(jobId)) {
        const pending = arr(scheduler.state && scheduler.state.jobs).some((j) => j && j.jobId === id);
        const delivered = typeof scheduler.findMessage === 'function' && !!scheduler.findMessage(`reply_${id}`);
        if (pending || delivered) return null;
    }
    const delay = Number.isFinite(delaySeconds) && delaySeconds > 0 ? delaySeconds * 1000 : 0;
    return scheduler.addJob({
        jobId: id, kind: 'ink', plain: true, npcId, accountId: acct, knot,
        thread: plainThreadKey(npcId, acct), msgId: null
    }, delay);
}

/**
 * Schedule every ink contact's `timedEmails` once. Each entry:
 *   { knot, delaySeconds?, waitForEvent?, skipIfGlobal?, account? }
 * With no `waitForEvent` (or "game_loaded") the email is queued now, arriving after
 * `delaySeconds`. With one, it is queued when that event fires, then arrives after the delay.
 * The queued email is marked by the global `mail_timed_<npc>_<index>`, so it is never queued a
 * second time after a reload; the job id (`timed_<npc>_<index>`) also stops a duplicate if the
 * global and the mail state were saved separately.
 * @param {Object} o { scenario, scheduler, dispatcher, globals, writeGlobal }
 * @returns {number} entries scheduled or listening
 */
export function installTimedEmails({ scenario, scheduler, dispatcher = null, globals = null, writeGlobal = null } = {}) {
    const config = scenario && scenario.social && scenario.social.mailClient;
    if (!scheduler || !isObject(config)) return 0;
    const read = () => globals || (typeof window !== 'undefined' ? window.gameState?.globalVariables : null) || {};
    const write = writeGlobal || ((name, value) => { const g = read(); g[name] = value; });
    let count = 0;
    for (const contact of arr(config.contacts)) {
        if (!isInkContact(contact)) continue;
        arr(contact.timedEmails).forEach((te, index) => {
            if (!isObject(te) || !isStr(te.knot)) return;
            const flag = `mail_timed_${contact.npc}_${index}`;
            if (read()[flag] === true) return;
            const fire = () => {
                if (read()[flag] === true) return;
                write(flag, true);
                if (isStr(te.skipIfGlobal) && read()[te.skipIfGlobal]) return;
                queuePlainEmail(scheduler, scenario, {
                    npcId: contact.npc, knot: te.knot, delaySeconds: Number(te.delaySeconds) || 0,
                    accountId: isStr(te.account) ? te.account : null, jobId: `timed_${contact.npc}_${index}`
                });
            };
            count++;
            if (!isStr(te.waitForEvent) || te.waitForEvent === 'game_loaded') { fire(); return; }
            if (!dispatcher) return;
            const listener = () => { dispatcher.off?.(te.waitForEvent, listener); fire(); };
            dispatcher.on(te.waitForEvent, listener);
        });
    }
    return count;
}
