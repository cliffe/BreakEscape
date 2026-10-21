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
// Attachments only (no link kind) and no victim record / landing-page handling
// yet. A data-only target's reply is the text job scheduled here; a target with a
// `character` gets an ink job scheduled through the mail runner (P1-J), whose
// on_email run writes the reply in character.
//
// The judging logic stays in phish-rules.js (pure). This module reads window
// only through writeGlobal; everything it needs is passed in, so the helpers
// are unit-testable without a DOM.

import { evaluateMessage, CANONICAL } from '../../systems/phish-rules.js';
import { writeGlobal } from '../../systems/global-writer.js';
import { heldFactIds, heldProvides } from './mail-composer.js';

// The mail runner (P1-J) is loaded lazily: only a send to a character target needs
// it, and keeping it off the module's static import graph lets the data-only bridge
// tests run without it. The import is primed when this module loads, so by the time
// any send happens the runner is resolved (core/game.js also imports it at startup,
// the same cached module) and `scheduleInkReplyLazy` can add the job synchronously
// within performSend (T2-3). Only a send before the import has settled takes the
// microtask fallback; a load failure is surfaced to the caller as a false return.
let _runnerModule = null;
let _runnerNs = null;
function primeRunner() {
    if (!_runnerModule) {
        _runnerModule = import('../../systems/mail-runner.js');
        _runnerModule.then((m) => { _runnerNs = m; }).catch(() => { /* data-only path: runner not present */ });
    }
    return _runnerModule;
}
primeRunner();

/** Schedule a character target's reply. Returns true when the job was added synchronously. */
function scheduleInkReplyLazy(scheduler, opts) {
    if (_runnerNs) {
        try { _runnerNs.scheduleInkReply(scheduler, opts); return true; }
        catch (e) { console.error('[mail-bridge] scheduleInkReply failed', e); return false; }
    }
    primeRunner().then((m) => {
        try { m.scheduleInkReply(scheduler, opts); } catch (e) { console.error('[mail-bridge] scheduleInkReply failed', e); }
    }).catch((e) => console.error('[mail-bridge] could not load mail-runner', e));
    return false;
}

const ICON = '/break_escape/assets/icons/';
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
 * SE lockout on the mail channel (00 §8, S10): a send to a social character who is
 * locked out on email is refused before evaluateMessage runs, so nothing is judged
 * or consumed (01 §3). window.socialInfluence exists only for a scenario with
 * social.characters, so shipped mail paths and the data-only bridge tests (no
 * window, no social service) are untouched. Returns true, and shows the one-line
 * refusal, when the send is refused.
 */
function mailChannelLocked(target) {
    const svc = (typeof window !== 'undefined') ? window.socialInfluence : null;
    const characterId = target && target.character;
    if (!svc || typeof svc.isLockedOut !== 'function' || !isStr(characterId)) return false;
    if (!svc.isLockedOut(characterId, 'email')) return false;
    const name = svc.getCharacterConfig?.(characterId)?.displayName || '';
    const text = name ? `${name} will not read your mail right now.` : 'They will not read your mail right now.';
    (window.gameAlert || window.showNotification)?.(text, 'warning', '', 2500);
    return true;
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
            // Compare with === true (N-5): boost/strict name boolean flag globals
            // (00 §7: "reset_granted_pierce", "helpdesk_alerted"). A character's influence is the
            // separate route (00 §7: read by the on_email ink, not wired here), and it is a number
            // where 0 is falsy and a negative value is truthy, so only an explicit true flips a factor.
            if (globals[globalName] === true && req.has(factor)) { req.delete(factor); adv.add(factor); changed = true; }
        }
    }
    if (strict) {
        for (const [globalName, factor] of Object.entries(strict)) {
            if (globals[globalName] === true && !req.has(factor)) { req.add(factor); adv.delete(factor); changed = true; }
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

    // SE lockout on the mail channel (00 §8, S10): refuse before judging, so a
    // locked-out character's send is not judged, stored or counted; the draft stays.
    if (mailChannelLocked(target)) {
        return { result: null, record: null, target, gameResult: null, claimedFrom: null, lockedOut: true };
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

    // Schedule the reply. An unopened send gets no reply at all in onSend mode
    // (00 §10 "Timing and delivery", J-1): nothing made the target open it. In
    // withReply mode a job still runs after the delay so the verdict and checklist
    // are revealed (01 N17). The opened-but-failed path keeps its reply.
    const opened = result.open && result.open.opened !== false;
    let replyScheduled = false;
    if (isStr(target.character)) {
        // Character target: the on_email ink runner writes the reply (P1-J). The run
        // itself branches on email_opened, so for withReply an unopened send still
        // schedules a job (it delivers nothing but reveals the checklist on completion).
        // A reply only actually comes back when the target opened it (00 §10).
        if (opened || timing === 'withReply') {
            scheduleInkReplyLazy(scheduler, {
                target,
                message: record,
                result,
                account,
                scenario: scene.scenario || { social },
                inReplyTo: (message && message.inReplyTo) || ''
            });
            replyScheduled = opened;
        }
    } else if (opened) {
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
        replyScheduled = true;
    } else if (timing === 'withReply') {
        // Unopened, assessment timing: a silent job (empty text, no outcome) so the verdict and
        // checklist are still revealed after the usual delay (00 §10, 01 N17).
        scheduler?.scheduleTextJob({ targetId: target.id, accountId, msgId: record.id, text: '', outcomeGlobal: null, landed: false });
    }

    if (scene.refresh) scene.refresh();
    const claimed = result.claimedSender;
    // Show a readable name in the reply-to advisory, not the raw person id (A3:
    // "shah's inbox"). Resolve against social.people, falling back to the address.
    const claimedPerson = claimed ? arr(social.people).find((p) => p && p.id === claimed) : null;
    const claimedLabel = claimedPerson
        ? (claimedPerson.name || claimedPerson.forms?.full || claimedPerson.address || claimed)
        : claimed;
    const claimedFrom = (claimed && account && account.person !== claimed) ? claimedLabel : null;
    return { result, record, target, gameResult: gameResultOf(result, target.id), claimedFrom, replyScheduled };
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

/** A pass/fail mark drawn from the batch-1 icons/mark-*.png art (01 N17, "marks paired with words"). */
function markIcon(pass) {
    const img = document.createElement('img');
    img.className = 'mail-check-mark';
    img.src = `${ICON}${pass ? 'mark-tick' : 'mark-cross'}.png`;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.width = 16;
    img.height = 16;
    return img;
}

/** Strip a leading ✓/✗ glyph an authored line may carry, so the png mark is never doubled. */
function stripMark(s) {
    return String(s == null ? '' : s).replace(/^\s*[✓✔✗✘]\s*/u, '');
}

function checkRow(pass, line) {
    const row = cl('li', `mail-check-row ${pass ? 'pass' : 'fail'}`);
    row.append(markIcon(pass), cl('span', 'mail-check-text', stripMark(line)));
    return row;
}

/**
 * The teaching checklist shown after a send in training mode (01 §3, N17): the
 * open-check row, each judged factor marked with the mark-*.png art and a reason,
 * advisory lines, the landing banner, a note that a reply may land, and (once per
 * client) the reply-to note. A failed send offers "Edit & resend"; a landed send
 * offers "Done" instead (01 §3; `onEdit` dismisses the panel in both cases).
 */
export function renderChecklist(result, target, { claimedFrom = null, account = null, showReplyToNote = false, showReplyPending = false, onEdit = null } = {}) {
    const panel = cl('div', 'mail-checklist');
    panel.setAttribute('role', 'status');
    panel.setAttribute('aria-live', 'polite');

    const banner = cl('p', `mail-checklist-banner ${result.landed ? 'landed' : 'not-landed'}`);
    banner.textContent = result.landed ? 'It landed. They acted on it.' : 'It did not land.';
    panel.appendChild(banner);

    const list = cl('ul', 'mail-checklist-rows');
    list.appendChild(checkRow(result.open.opened,
        result.openLine || (result.open.opened ? 'They would open it' : 'They did not open it')));

    for (const f of arr(result.factors)) {
        if (f.mode !== 'required') continue;
        list.appendChild(checkRow(f.pass, f.line || ''));
    }
    panel.appendChild(list);

    const advisory = arr(result.factors).filter((f) => f.mode === 'advisory' && !f.pass);
    for (const f of advisory) {
        panel.appendChild(cl('p', 'mail-checklist-advisory', `Advisory: ${stripMark(f.line)}`));
    }

    // Feedback layer 3 (04 N4): the escalating hint, surfaced after a repeated failure on this
    // target. phish-rules sets result.hint only on a non-landing send once an earlier send failed,
    // so the first miss is never pre-empted and a landing never shows one.
    if (!result.landed && isStr(result.hint)) {
        const hint = cl('p', 'mail-checklist-hint');
        hint.append(cl('span', 'mail-checklist-hint-label', 'Hint: '), cl('span', 'mail-checklist-hint-text', stripMark(result.hint)));
        panel.appendChild(hint);
    }

    // Tell the player the reply is on its way, so closing the client right after a
    // send is not a dead end (P1-T T4). Only when a reply is actually scheduled.
    if (showReplyPending) {
        panel.appendChild(cl('p', 'mail-checklist-reply', 'A reply may land in your inbox in a moment.'));
    }

    if (showReplyToNote && claimedFrom && account) {
        panel.appendChild(cl('p', 'mail-checklist-replyto',
            `In real life this reply would go to ${claimedFrom}'s inbox unless you set a reply-to; here it comes to ${account.address || account.id}.`));
    }

    // After a landing there is nothing to resend, so offer "Done" rather than
    // "Edit & resend" (P1-T T9). Both just dismiss the teaching panel.
    const label = result.landed ? 'Done' : 'Edit & resend';
    const cls = result.landed ? 'mail-checklist-done' : 'mail-checklist-edit';
    const button = cl('button', `${cls} minigame-button`, label);
    button.type = 'button';
    if (typeof onEdit === 'function') button.addEventListener('click', () => onEdit());
    panel.appendChild(button);
    return panel;
}
