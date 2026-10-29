// Builds the message list an inbox-triage round shows (05 "Scenario-authored data",
// "playerSent messages: the defender flip"; N9). Pure: no DOM, no globals written.
//
//   buildTriageMessages(set, { mailState, social, globals, now })
//       -> { messages, skipped: [{ id, reason }] }
//
// Authored messages are normalised to the persisted record shape of 00 section 10a
// (`read = !unread`, `folder: 'inbox'`), keeping their `auth` and `truth`. A
// `playerSent` entry is replaced by the student's own sent record, replayed as the
// recipient saw it, or left out of the round when no sent record to its target
// has a tell. Authentication results are authored literals from `playerSentAuth`;
// nothing here computes them from anything the player typed.

import { resolveAccounts, domainOf } from '../mail-client/mail-data.js';
import { isNonEmail, defaultSubject, hostOf, kindLabel } from './triage-kinds.js';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;

/** The list row's sender for a non-email message that names none. */
function defaultWho(msg, labels) {
    if (msg.kind === 'page' && isObj(msg.page) && isStr(msg.page.url)) return hostOf(msg.page.url);
    if (msg.kind === 'push' && isObj(msg.push) && isStr(msg.push.app)) return msg.push.app;
    if (msg.kind === 'call' && isStr(msg.callerId)) return msg.callerId;
    if (msg.kind === 'qr' && isObj(msg.qr) && isStr(msg.qr.location)) return msg.qr.location;
    return kindLabel(msg.kind, labels);
}

/** The two tells only a spoofing account can raise (00 section 10a, 05 N9). */
export const SPOOF_TELLS = Object.freeze(['senderTrust', 'senderAuth']);

/**
 * An authored triage message as a reader record. `text` on a link is accepted as
 * `linkText` (05's sample uses `text`; the reader reads `linkText`).
 */
export function normaliseTriageMessage(msg, labels = null) {
    const from = isObj(msg.from)
        ? { name: String(msg.from.name ?? ''), address: String(msg.from.address ?? '') }
        : { name: String(msg.from ?? ''), address: '' };
    const nonEmail = isNonEmail(msg.kind || 'email');
    // A non-email kind may have no sender or subject of its own (a printed notice, a web
    // page): the list row then shows a sensible stand-in instead of a blank line.
    // The page host stands in as the sender: it is an address, so the list row sets it in the
    // address font (a 1/l swap in a look-alike domain must show).
    const whoIsAddress = nonEmail && !from.name && !from.address && msg.kind === 'page'
        && isObj(msg.page) && isStr(msg.page.url);
    if (nonEmail && !from.name && !from.address) from.name = defaultWho(msg, labels);
    const links = (Array.isArray(msg.links) ? msg.links : []).filter(isObj).map((l) => ({
        ...l, linkText: l.linkText ?? l.text ?? l.destination ?? ''
    }));
    return {
        ...msg,
        kind: msg.kind || 'email',
        from,
        ...(whoIsAddress ? { whoIsAddress: true } : {}),
        to: msg.to ?? '',
        subject: msg.subject || (nonEmail ? defaultSubject(msg, labels) : (msg.subject ?? '')),
        time: msg.time ?? '',
        body: msg.body ?? '',
        links,
        attachments: Array.isArray(msg.attachments) ? msg.attachments.filter(isObj) : [],
        folder: 'inbox',
        read: msg.unread === false,
        truth: isObj(msg.truth) ? msg.truth : { isPhish: false, flags: [] }
    };
}

function localPart(address) {
    const at = typeof address === 'string' ? address.lastIndexOf('@') : -1;
    return at === -1 ? '' : address.slice(0, at);
}

/** Replace the two permitted tokens in a string; anything else is left as written. */
function substitute(value, tokens) {
    if (typeof value !== 'string') return value;
    return value.replace(/\{(account_address|domain)\}/g, (m, key) => (isStr(tokens[key]) ? tokens[key] : m));
}

function substituteRow(row, tokens) {
    const out = {};
    for (const [k, v] of Object.entries(row || {})) out[k] = substitute(v, tokens);
    return out;
}

/**
 * Sent records to one target, split by whether they carry tells.
 * A record with no tells is never replayed (05). `tellless` is true when at
 * least one real sent record exists and none of them have tells, so the skip
 * reason can say that instead of pretending there was no send.
 */
function classifySent(mailState, targetId, fromMailbox) {
    const withTells = [];
    let tellless = false;
    let order = 0;
    const boxes = isObj(mailState?.mailboxes) ? mailState.mailboxes : {};
    for (const [boxId, box] of Object.entries(boxes)) {
        if (fromMailbox && boxId !== fromMailbox) continue;
        for (const rec of Array.isArray(box?.messages) ? box.messages : []) {
            order += 1;
            if (!isObj(rec) || rec.folder !== 'sent' || rec.seeded === true) continue;
            if (rec.kind === 'quickReply' || rec.targetId !== targetId) continue;
            const tells = Array.isArray(rec.tells) ? rec.tells.filter(isStr) : [];
            if (!tells.length) { tellless = true; continue; }
            withTells.push({ rec, order, tells, time: Number.isFinite(rec.gameTime) ? rec.gameTime : 0 });
        }
    }
    return { withTells, tellless };
}

/** Sent records across the mailboxes in `mailState`, with a position for tie-breaking. */
function sentCandidates(mailState, targetId, fromMailbox) {
    return classifySent(mailState, targetId, fromMailbox).withTells;
}

const later = (a, b) => (a.time - b.time) || (a.order - b.order);

/** The record a playerSent entry replays: latest with a spoof tell, else the latest with any tell. */
export function pickSentRecord(mailState, entry) {
    const all = sentCandidates(mailState, entry?.targetId, entry?.fromMailbox || null);
    if (!all.length) return null;
    const spoof = all.filter((c) => c.tells.some((t) => SPOOF_TELLS.includes(t)));
    const pool = spoof.length ? spoof : all;
    return pool.sort(later)[pool.length - 1];
}

/** The domain option a record's link points at. `link.domain` (when the record carries it) wins, else the page definition's menu. */
export function lookupDomain(link, social) {
    if (!isObj(link) || !isStr(link.domainId)) return null;
    if (isStr(link.domain)) return { domain: link.domain, browserDomain: link.browserDomain || null };
    const pages = Array.isArray(social?.landingPages) ? social.landingPages : [];
    for (const page of pages) {
        if (!isObj(page) || (isStr(link.pageId) && page.id !== link.pageId)) continue;
        const menu = [page.domainMenu, page.domains, page.domainOptions].find(Array.isArray) || [];
        const opt = menu.find((o) => isObj(o) && o.id === link.domainId);
        if (opt && isStr(opt.domain)) return { domain: opt.domain, browserDomain: opt.browserDomain || null };
    }
    return null;
}

function pageLinkText(link, target, social, domain) {
    const pages = Array.isArray(social?.landingPages) ? social.landingPages : [];
    const page = pages.find((p) => isObj(p) && p.id === link?.pageId);
    if (page && isStr(page.linkText)) return page.linkText;
    if (isStr(link?.linkText)) return link.linkText;
    if (isStr(target?.expectedLink?.realDomain)) return target.expectedLink.realDomain;
    return domain;
}

function kitItem(social, kitId) {
    const kit = social?.mailClient?.payloadKit;
    return Array.isArray(kit) ? kit.find((k) => isObj(k) && k.id === kitId) || null : null;
}

/**
 * Build the replayed message for one playerSent entry.
 * Returns { message } or { skipped: reason }.
 */
export function resolvePlayerSent(entry, set, mailState, social, opts = {}) {
    const classified = classifySent(mailState, entry?.targetId, entry?.fromMailbox || null);
    const picked = pickSentRecord(mailState, entry);
    if (!picked) return { skipped: classified.tellless ? 'sent-without-tells' : 'no-sent-record' };
    const rec = picked.rec;
    const auth = isObj(set?.playerSentAuth) ? set.playerSentAuth : {};
    // The target's own factorStrings (e.g. a forged-From senderTrust.redFlag) ride along on
    // the replayed message so the flip shows the authored sentence rather than the library
    // default (C2-m1). Harmless where a target authors none, and the lab passes none here.
    const target = (Array.isArray(social?.phishTargets) ? social.phishTargets : []).find((t) => t?.id === entry.targetId);
    const factorStrings = isObj(target?.factorStrings) ? target.factorStrings : null;

    let flags = [...new Set(picked.tells)];
    const link = isObj(rec.link) ? rec.link : null;
    const hasDomain = !!link && isStr(link.domainId);
    if (!hasDomain) flags = flags.filter((f) => f !== 'linkCredible');

    const accounts = resolveAccounts(social?.mailClient, null, opts.globals || {});
    const account = accounts.find((a) => a.id === rec.fromAccount);
    const tokens = { account_address: account?.address || rec.from?.address || '' };

    let row = null;
    let from = { name: String(rec.from?.name ?? ''), address: String(rec.from?.address ?? '') };
    let domainInfo = null;
    if (hasDomain) domainInfo = lookupDomain(link, social);

    if (hasDomain && entry.domainFrom === 'landing_domain') {
        if (!domainInfo) return { skipped: 'no-domain' };
        const domainRow = isObj(auth.domains) ? auth.domains[link.domainId] : null;
        if (!isObj(domainRow)) return { skipped: 'no-auth-row' };
        tokens.domain = domainInfo.domain;
        row = substituteRow(domainRow, tokens);
        // The attacker owns the picked domain, so the panel passes; senderAuth is not a finding here.
        flags = flags.filter((f) => f !== 'senderAuth');
        from = { name: from.name, address: `${localPart(from.address)}@${domainInfo.domain}` };
    } else {
        const accountRow = isObj(auth.accounts) ? auth.accounts[rec.fromAccount] : null;
        if (!isObj(accountRow)) return { skipped: 'no-auth-row' };
        if (domainInfo) tokens.domain = domainInfo.domain;
        row = substituteRow(accountRow, tokens);
    }
    if (!flags.length) return { skipped: 'no-tells' };

    const links = [];
    let body = typeof rec.body === 'string' ? rec.body : '';
    if (hasDomain && domainInfo) {
        const token = /\{\{link:([A-Za-z0-9_-]+)\}\}/.exec(body);
        const id = token ? token[1] : 'sent_link';
        links.push({
            id,
            linkText: pageLinkText(link, target, social, domainInfo.domain),
            destination: `https://${domainInfo.domain}/`
        });
        if (!token) body = `${body}${body && !body.endsWith('\n') ? '\n' : ''}{{link:${id}}}`;
    }

    const attachments = [];
    if (isObj(rec.attachment)) {
        const item = kitItem(social, rec.attachment.kitId);
        attachments.push({
            label: item?.label || rec.attachment.label || rec.attachment.kitId || 'Attachment',
            kind: rec.attachment.kind || item?.kind || 'document'
        });
    }

    const notes = isObj(entry.notes) ? entry.notes : {};
    const message = normaliseTriageMessage({
        id: entry.id,
        kind: 'email',
        playerSent: true,
        sourceRecordId: rec.id,
        from,
        to: rec.to,
        subject: rec.subject,
        time: rec.time,
        body,
        links,
        attachments,
        auth: row,
        ...(factorStrings ? { factorStrings } : {}),
        truth: { ...notes, isPhish: true, flags }
    });
    return { message };
}

/**
 * A landed sent record that carries no scored tell, as the recipient would read it (ENG-UX2). Used
 * by the episode flip when the episode authors a per-choice defender line, so the learner sees the
 * message they sent even though there is no tell to list. No authentication row and no link: the
 * message is replayed as written, flags empty. Returns null for anything that is not a sent record.
 */
export function plainSentMessage(rec, entry = null) {
    if (!isObj(rec) || rec.folder !== 'sent') return null;
    const body = (typeof rec.body === 'string' ? rec.body : '').replace(/\{\{link:[A-Za-z0-9_-]+\}\}/g, '').trim();
    return normaliseTriageMessage({
        id: isStr(entry?.id) ? entry.id : 'episode_flip',
        kind: 'email',
        playerSent: true,
        sourceRecordId: rec.id,
        from: rec.from,
        to: rec.to,
        subject: rec.subject,
        time: rec.time,
        body,
        links: [],
        attachments: [],
        truth: { isPhish: true, flags: [] }
    });
}

/**
 * The round's messages in authored order. Authored entries are normalised; playerSent
 * entries are replaced by the replay or recorded in `skipped`. A message with no id,
 * or a playerSent with no tells, never reaches the round.
 */
export function buildTriageMessages(set, ctx = {}) {
    const messages = [];
    const skipped = [];
    for (const entry of Array.isArray(set?.messages) ? set.messages : []) {
        if (!isObj(entry) || !isStr(entry.id)) continue;
        if (entry.kind === 'playerSent') {
            const out = resolvePlayerSent(entry, set, ctx.mailState, ctx.social, { globals: ctx.globals });
            if (out.message) messages.push(out.message);
            else skipped.push({ id: entry.id, reason: out.skipped });
            continue;
        }
        messages.push(normaliseTriageMessage(entry, set?.labels));
    }
    return { messages, skipped };
}

export { domainOf };
