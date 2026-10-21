// Mail bridge: the send path of the mail client (SE design 01 §3, N6, N17;
// contract 00 §10, §10a; rules in systems/phish-rules.js). Packet P1-F.
//
// The composer builds a message and hands it to the shell on Send. This module
// turns that into the judged outcome the player sees and the state the mission
// reads: it applies the target's boostIfGlobal / strictIfGlobal hooks, judges
// the message, renders the stored body, writes the Sent record and (for a
// data-only target) the delivery job to the mail scheduler, updates the metrics
// and the phish_<id>_attempts global, and builds the checklist DOM and the
// §3 gameResult transform.
//
// Phase 1a scope: attachments only (no link kind), and NO ink job — a target
// with a `character` is judged and recorded here, but its reply waits for the
// mail runner in Phase 1b (plan "Mail client" row: "judge, sent record, text
// job; no ink job, no victim record yet"). There is no victim record and no
// landing-page handling in 1a.
//
// The judging logic stays in phish-rules.js (pure). This module reads window
// only through writeGlobal; everything it needs is passed in, so the helpers
// are unit-testable without a DOM.

import { evaluateMessage, CANONICAL } from '../../systems/phish-rules.js';
import { writeGlobal } from '../../systems/global-writer.js';
import { heldFactIds, heldProvides } from './mail-composer.js';

const BODY_PARTS = ['greeting', 'pretext', 'ask'];
const isStr = (v) => typeof v === 'string' && v.length > 0;
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const arr = (v) => (Array.isArray(v) ? v : []);

/** phishTargets is an array in 00; accept a map keyed by id too. */
export function resolveTarget(social, targetId) {
    if (!isStr(targetId)) return null;
    const list = social && social.phishTargets;
    const targets = Array.isArray(list) ? list : Object.values(list || {});
    return targets.find((t) => t && t.id === targetId) || null;
}

/**
 * Apply boostIfGlobal / strictIfGlobal (00 §7): boost relaxes a factor
 * (demote to advisory, so it no longer gates), strict tightens one (promote to
 * required). Returns a modified COPY so the stored target is never mutated, or
 * the original when no hook is set (the judge stays pure, 01 §3).
 */
export function applyFactorBias(target, globals = {}) {
    if (!isObject(target)) return target;
    const boost = isObject(target.boostIfGlobal) ? target.boostIfGlobal : null;
    const strict = isObject(target.strictIfGlobal) ? target.strictIfGlobal : null;
    if (!boost && !strict) return target;

    const req = new Set();
    const adv = new Set();
    if (Array.isArray(target.factors)) {
        for (const f of target.factors) {
            if (!f || !isStr(f.id)) continue;
            (f.mode === 'required' ? req : adv).add(f.id);
        }
    } else {
        for (const id of arr(target.requiredFactors)) req.add(id);
        for (const id of arr(target.advisoryFactors)) adv.add(id);
    }
    let changed = false;
    if (boost) {
        for (const [globalName, factor] of Object.entries(boost)) {
            if (globals[globalName] && req.has(factor)) { req.delete(factor); adv.add(factor); changed = true; }
        }
    }
    if (strict) {
        for (const [globalName, factor] of Object.entries(strict)) {
            if (globals[globalName] && !req.has(factor)) { req.add(factor); adv.delete(factor); changed = true; }
        }
    }
    if (!changed) return target;
    const copy = { ...target, requiredFactors: [...req], advisoryFactors: [...adv] };
    delete copy.factors;
    return copy;
}

/**
 * value-id -> display label, so a rendered body and a From line read in words.
 * Built from the player's held facts' `provides` (the same source the composer
 * offers), plus each person's own address for an `<id>_address` value id.
 */
export function buildValueLabels(social, globals = {}) {
    const labels = {};
    const intelFacts = isObject(social && social.intelFacts) ? social.intelFacts : {};
    const entries = heldProvides(heldFactIds(intelFacts, globals), intelFacts);
    for (const e of entries) {
        if (isStr(e.value) && !(e.value in labels)) labels[e.value] = e.label || e.value;
    }
    for (const p of arr(social && social.people)) {
        if (p && isStr(p.id) && isStr(p.address)) {
            const key = `${p.id}_address`;
            if (!(key in labels)) labels[key] = p.address;
        }
    }
    return labels;
}

function fillTemplate(text, slots, slotMap, labels, account) {
    return String(text).replace(/\{([a-zA-Z0-9_]+)\}/g, (whole, key) => {
        if (key === 'account_name') return account ? (account.displayName || account.address || '') : '';
        if (key === 'account_address') return account ? (account.address || '') : '';
        const valueId = slotMap[key];
        if (!isStr(valueId)) return '';
        return labels[valueId] ?? valueId;
    });
}

/** The rendered, stored body (00 §10a): greeting, pretext and ask, blanks filled. */
export function renderBodyText(message, templates, account, labels = {}) {
    const tpls = isObject(templates) ? templates : {};
    const chosen = (message && message.templates) || {};
    const slotMap = (message && message.slots) || {};
    const lines = [];
    for (const part of BODY_PARTS) {
        const tpl = tpls[chosen[part]];
        if (!tpl || !isStr(tpl.text)) continue;
        const slots = arr(tpl.slots);
        lines.push(fillTemplate(tpl.text, slots, slotMap, labels, account));
    }
    return lines.filter((l) => l.trim().length).join('\n\n');
}

/** The claimed From as displayed (00 §10a): the account itself, or the resolved blanks. */
export function resolveHeaderDisplay(message, account, labels = {}) {
    const hf = (message && message.headerFrom) || {};
    const forced = hf.account === true || !(account && account.spoofsFrom === true);
    if (forced || !isStr(hf.name)) {
        return { name: account ? (account.displayName || account.address || '') : '',
                 address: account ? (account.address || '') : '' };
    }
    return {
        name: labels[hf.name] ?? hf.name,
        address: isStr(hf.address) ? (labels[hf.address] ?? hf.address) : ''
    };
}

/** The subject text for a chosen subject id (stored and used for the Re: reply). */
export function subjectTextOf(target, subjectId) {
    const s = arr(target && target.subjects).find((x) => x && x.id === subjectId);
    return s && isStr(s.text) ? s.text : '';
}

/** thread key: "<character>:<accountId>", or "<targetId>:<accountId>" for a data-only target (00 §13). */
export function threadKey(target, accountId) {
    const who = isStr(target && target.character) ? target.character : (target && target.id);
    return `${who}:${accountId}`;
}

/**
 * Increment the per-target metrics (00 §10a). Returns the updated entry; the
 * caller writes phish_<id>_attempts = entry.sent.
 */
export function updateMetrics(metrics, targetId, landed) {
    if (!isObject(metrics[targetId])) metrics[targetId] = { sent: 0, failed: 0, landed: 0, firstTryLanded: false };
    const m = metrics[targetId];
    const firstSend = m.sent === 0;
    m.sent += 1;
    if (landed) { m.landed += 1; if (firstSend) m.firstTryLanded = true; }
    else m.failed += 1;
    return m;
}

/** red-flag strings for the §3 gameResult transform (failed factors + tells). */
function redFlagsOf(result) {
    const out = [];
    for (const f of arr(result && result.factors)) {
        if (!f.pass && isStr(f.redFlag)) out.push(f.redFlag);
    }
    return out;
}
function tellStringsOf(result) {
    const out = [];
    for (const id of arr(result && result.tells)) {
        const rf = CANONICAL[id] && CANONICAL[id].redFlag;
        if (isStr(rf)) out.push(rf);
    }
    return out;
}

/** The 01 §3 "Closing the client" gameResult transform for one send. */
export function gameResultOf(result, targetId) {
    if (!result) {
        return { targetId: targetId || null, landed: null, redFlags: [], tells: [], outcome: 'sent' };
    }
    return {
        targetId: targetId || null,
        landed: result.landed === true,
        redFlags: redFlagsOf(result),
        tells: tellStringsOf(result),
        outcome: result.landed === true ? 'landed' : 'failed'
    };
}

// ─────────────────────────────────────────────────────── the send orchestration

/**
 * Judge a built message and commit its record, job and metrics to the scheduler
 * (01 §3, N6/N17). `scene` supplies the live scheduler, social data, globals,
 * account and clock. Returns { result, record, target, gameResult, claimedFrom }.
 * `result` is null for a non-target recipient (kept in Sent, never judged, 01 §2).
 */
export function performSend(scene, message) {
    const scheduler = scene.scheduler;
    const social = scene.social || {};
    const globals = scene.globals || {};
    const account = scene.account;
    const config = scene.config || {};
    const mailState = scene.mailState;
    const accountId = account ? account.id : (message && message.fromAccount) || null;
    const mailboxId = account ? account.mailbox : null;
    const labels = buildValueLabels(social, globals);
    const target = resolveTarget(social, message && message.targetId);

    // A non-target recipient: stored in Sent, never judged, delivers nothing (01 §2).
    if (!target) {
        const record = buildRecord({ message, result: null, account, social, labels, subjectText: message && message.subject ? String(message.subject) : '', target: null, accountId });
        commitRecord(scheduler, mailState, mailboxId, record);
        if (scene.refresh) scene.refresh();
        return { result: null, record, target: null, gameResult: gameResultOf(null, null), claimedFrom: null };
    }

    const metrics = (mailState && mailState.metrics) || (mailState.metrics = {});
    const priorFailures = isObject(metrics[target.id]) ? (metrics[target.id].failed || 0) : 0;
    const judged = applyFactorBias(target, globals);
    const ctx = { accounts: scene.accounts || [], people: social.people, templates: social.templates,
                  payloadKit: config.payloadKit, priorFailures };
    const result = evaluateMessage(judged, message, ctx);

    const subjectText = subjectTextOf(target, message.subject);
    const record = buildRecord({ message, result, account, social, labels, subjectText, target, accountId });
    const timing = scene.checklistTiming ? scene.checklistTiming() : 'onSend';
    if (timing === 'withReply') record.judgePending = true;
    commitRecord(scheduler, mailState, mailboxId, record);

    // Metrics and the attempts global (00 §10a, §3 "The record").
    const m = updateMetrics(metrics, target.id, result.landed);
    writeGlobal(`phish_${target.id}_attempts`, m.sent);

    // A data-only target gets a text job; a character target's ink reply is Phase 1b.
    if (!isStr(target.character)) {
        const outcomeGlobal = target.outcome && target.outcome.setGlobal;
        const firstGlobal = isObject(outcomeGlobal) ? Object.keys(outcomeGlobal)[0] : (isStr(outcomeGlobal) ? outcomeGlobal : null);
        scheduler?.scheduleTextJob({
            targetId: target.id,
            accountId,
            msgId: record.id,
            text: dataOnlyText(target, result),
            outcomeGlobal: firstGlobal,
            landed: result.landed
        });
    }

    if (scene.refresh) scene.refresh();
    const claimed = result.claimedSender;
    const claimedFrom = (claimed && account && account.person !== claimed) ? claimed : null;
    return { result, record, target, gameResult: gameResultOf(result, target.id), claimedFrom };
}

/** The data-only reply text: replies.landed, else the first failed factor's line (00 §10, N7). */
function dataOnlyText(target, result) {
    if (result.landed) return (target.replies && isStr(target.replies.landed)) ? target.replies.landed : 'Thanks, received.';
    const first = arr(result.factors).find((f) => f.mode === 'required' && !f.pass);
    return first ? (first.reply || first.line || '') : (result.openLine || '');
}

function buildRecord({ message, result, account, social, labels, subjectText, target, accountId }) {
    const header = resolveHeaderDisplay(message, account, labels);
    const record = {
        id: null,
        thread: target ? threadKey(target, accountId) : null,
        folder: 'sent',
        fromAccount: accountId,
        from: { name: header.name, address: header.address },
        to: message.to || '',
        targetId: target ? target.id : null,
        subject: subjectText || '',
        templates: { ...(message.templates || {}) },
        slots: { ...(message.slots || {}) },
        body: renderBodyText(message, social.templates, account, labels),
        attachment: isStr(message.attachment) ? { kitId: message.attachment, kind: message.attachmentKind || null } : null,
        link: null,
        landed: result ? result.landed : null,
        tells: result ? arr(result.tells).slice() : [],
        read: true
    };
    return record;
}

function commitRecord(scheduler, mailState, mailboxId, record) {
    if (scheduler && typeof scheduler.addMessage === 'function') {
        const stored = scheduler.addMessage(mailboxId, record);
        record.id = stored.id;
        record.mailbox = stored.mailbox;
        return stored;
    }
    // No scheduler (a bare test): write straight into mailState.
    if (!mailState.mailboxes[mailboxId]) mailState.mailboxes[mailboxId] = { messages: [], unread: 0 };
    record.id = record.id || `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    record.mailbox = mailboxId;
    mailState.mailboxes[mailboxId].messages.push(record);
    return record;
}

// ─────────────────────────────────────────────────────────── checklist rendering

function cl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

/**
 * The teaching checklist shown after a send in training mode (01 §3, N17): the
 * open-check row, each judged factor with ✓/✗ and a reason, advisory lines, the
 * landing banner, and (once per client) the reply-to note. `onEdit` dismisses it
 * so the player can edit and resend.
 */
export function renderChecklist(result, target, { claimedFrom = null, account = null, showReplyToNote = false, onEdit = null } = {}) {
    const panel = cl('div', 'mail-checklist');
    panel.setAttribute('role', 'status');
    panel.setAttribute('aria-live', 'polite');

    const banner = cl('p', `mail-checklist-banner ${result.landed ? 'landed' : 'not-landed'}`);
    banner.textContent = result.landed ? 'It landed. They acted on it.' : 'It did not land.';
    panel.appendChild(banner);

    const list = cl('ul', 'mail-checklist-rows');
    const openRow = cl('li', `mail-check-row ${result.open.opened ? 'pass' : 'fail'}`);
    openRow.textContent = (result.open.opened ? '✓ ' : '✗ ') + (result.openLine || (result.open.opened ? 'They would open it' : 'They did not open it'));
    list.appendChild(openRow);

    for (const f of arr(result.factors)) {
        if (f.mode !== 'required') continue;
        const row = cl('li', `mail-check-row ${f.pass ? 'pass' : 'fail'}`);
        row.textContent = (f.pass ? '✓ ' : '✗ ') + (f.line || '');
        list.appendChild(row);
    }
    panel.appendChild(list);

    const advisory = arr(result.factors).filter((f) => f.mode === 'advisory' && !f.pass);
    for (const f of advisory) {
        panel.appendChild(cl('p', 'mail-checklist-advisory', `Advisory: ${f.line || ''}`));
    }

    if (showReplyToNote && claimedFrom && account) {
        panel.appendChild(cl('p', 'mail-checklist-replyto',
            `In real life this reply would go to ${claimedFrom}'s inbox unless you set a reply-to; here it comes to ${account.address || account.id}.`));
    }

    const edit = cl('button', 'mail-checklist-edit minigame-button', 'Edit & resend');
    edit.type = 'button';
    if (typeof onEdit === 'function') edit.addEventListener('click', () => onEdit());
    panel.appendChild(edit);
    return panel;
}
