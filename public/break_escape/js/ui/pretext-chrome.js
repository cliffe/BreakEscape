// Chat influence header, tells panel and render-only phone bubbles
// (06 N4, §4.4; 00 §8 "How the bar reads it"; plan packet P4-E).
//
// The bar itself is ui/influence-bar.js. This module only decides where a
// chat puts it, and turns a PretextSession log into the lines the player reads.
// A hidden bar (influence.display.bar false) leaves the tells and the judge alone.
//
// Phone tells are also drawn as system bubbles. Those nodes are render-only:
// nothing here writes the contact's history, so they never affect unread counts
// or restartOnRetalk. The session log is the store.

import { createInfluenceBar } from './influence-bar.js';

const BAND_WORD = ['CALM', 'WARY', 'REFUSING', 'REPORTED', 'LOCKED'];
const MARK = { repair: '✓', fail: '✗', unknown: '?', technique: '!', pass: '✓' };
const KIND_ORDER = ['repair', 'fail', 'unknown', 'technique', 'pass'];

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Portrait tint for an influence band. 0 and the player portrait stay untinted. */
export function influenceTintFilter(band, isPlayer = false) {
    const n = typeof band === 'number' ? band : 0;
    if (isPlayer || n <= 0) return 'none';
    if (n === 1) return 'sepia(0.55) saturate(1.6)';
    return 'sepia(0.45) hue-rotate(-40deg) saturate(2.2)';
}

/**
 * social.characters id for an NPC id (the character id itself, or a channel id).
 * Null when the NPC is not a social character.
 */
export function characterIdFor(npcId, scenario) {
    if (typeof npcId !== 'string' || !npcId) return null;
    const chars = scenario?.social?.characters;
    if (!isObject(chars)) return null;
    if (isObject(chars[npcId])) return npcId;
    for (const [id, raw] of Object.entries(chars)) {
        const channels = raw?.channels;
        if (!isObject(channels)) continue;
        for (const value of Object.values(channels)) {
            if (value === npcId) return id;
        }
    }
    return null;
}

function signed(n) {
    if (typeof n !== 'number' || Number.isNaN(n)) return '0';
    return n > 0 ? `+${n}` : String(n);
}

function sumDelta(entries) {
    return (entries || []).reduce((n, e) => n + (typeof e?.delta === 'number' ? e.delta : 0), 0);
}

function classify(entry, spec) {
    const tells = (spec && spec.tells) || {};
    const reason = entry?.reason;
    const line = typeof entry?.line === 'string' ? entry.line : '';
    if (line && line === tells.repair) return 'repair';
    if (reason && isObject(tells.techniques) && Object.prototype.hasOwnProperty.call(tells.techniques, reason)) {
        return 'technique';
    }
    const fact = reason && tells[reason];
    if (isObject(fact)) {
        if (line && line === fact.unknown) return 'unknown';
        if (line && (line === fact.fail || line === fact.failCategory)) return 'fail';
        if (typeof entry.delta === 'number' && entry.delta < 0) return 'fail';
        return 'pass';
    }
    if (typeof entry.delta === 'number' && entry.delta < 0) return 'fail';
    return 'pass';
}

function leadingKind(entries, spec) {
    const kinds = new Set((entries || []).map((e) => classify(e, spec)));
    for (const kind of KIND_ORDER) if (kinds.has(kind)) return kind;
    return 'pass';
}

function reasonText(entries, spec, kind) {
    const lines = [];
    for (const e of entries || []) {
        if (classify(e, spec) !== kind) continue;
        if (typeof e.line === 'string' && e.line && !lines.includes(e.line)) lines.push(e.line);
    }
    return lines.join(' ');
}

function formatSay(row, spec) {
    const entries = Array.isArray(row.entries) ? row.entries : [];
    const kind = leadingKind(entries, spec);
    const band = BAND_WORD[row.band] || BAND_WORD[0];
    const text = reasonText(entries, spec, kind);
    const head = `${signed(sumDelta(entries))}  ${band}  ${MARK[kind]}`;
    return text ? `${head} ${text}` : head;
}

function formatAsk(row, spec, at) {
    const result = row.result;
    let label = 'ASK REFUSED';
    let key = 'refused';
    if (result === 1 || result === 'granted') { label = 'ASK OK'; key = 'accepted'; }
    else if (result === 2 || result === 'pending') { label = 'ASK PENDING'; key = 'pending'; }
    const ask = spec?.asks?.[row.id] || {};
    const bits = [];
    // "floor" alone did not read as a rule to a student (R2 F5); spell it out as the
    // influence the ask needs to be granted.
    if (typeof ask.floor === 'number') bits.push(`needs ${ask.floor} or better`);
    bits.push(`now at ${typeof at === 'number' ? at : 0}`);
    const sentence = spec?.tells?.ask?.[key];
    const tail = typeof sentence === 'string' && sentence ? ` ${sentence}` : '';
    return `${label}  ${bits.join(', ')}.${tail}`;
}

/**
 * One line per session log row, oldest first (06 §4.4).
 * `influenceNow` is the character's influence after the last row. Each row's
 * "now at" is walked back from that, so a reload shows the same numbers.
 */
export function formatPretextTells(session, spec, influenceNow) {
    const log = Array.isArray(session?.log) ? session.log : [];
    const after = new Array(log.length);
    let cursor = typeof influenceNow === 'number' && Number.isFinite(influenceNow) ? influenceNow : 0;
    for (let i = log.length - 1; i >= 0; i--) {
        after[i] = cursor;
        cursor -= sumDelta(log[i].entries);
    }
    return log.map((row, i) => (row?.kind === 'ask' ? formatAsk(row, spec, after[i]) : formatSay(row, spec)));
}

/**
 * The slot a chat header uses for the bar and the tells list.
 * `place: 'start'` puts it above the speaker name (person-chat).
 * The default appends it (phone conversation header, after the name).
 * A character with bar: false gets no .influence-bar; the slot is still
 * returned when it already exists, so tells can sit in the same header.
 */
export function mountChatHeader(parent, opts = {}) {
    if (!parent) return { bar: null, header: null };
    let slot = parent.querySelector('.se-chat-header');
    const characterId = opts.characterId;
    const bar = characterId ? createInfluenceBar({
        characterId,
        scenario: opts.scenario,
        getGlobals: opts.getGlobals,
        dispatcher: opts.dispatcher,
        mount: opts.mount || 'chat'
    }) : null;
    if (!slot && !bar && !opts.keepSlot) return { bar: null, header: null };
    if (!slot) {
        slot = document.createElement('div');
        slot.className = 'se-chat-header';
        if (opts.headerClass) slot.classList.add(opts.headerClass);
        if (opts.place === 'start' && parent.firstChild) parent.insertBefore(slot, parent.firstChild);
        else parent.appendChild(slot);
    }
    slot.querySelector('.influence-bar')?.remove();
    if (bar) slot.appendChild(bar.el);
    return { bar, header: slot };
}

/** Replace the tells list inside a chat header. Text only. */
export function renderTells(header, lines) {
    if (!header) return null;
    let list = header.querySelector('.pretext-tells');
    if (!list) {
        list = document.createElement('ol');
        list.className = 'pretext-tells';
        list.setAttribute('aria-label', 'What the line did');
        header.appendChild(list);
    }
    list.replaceChildren();
    for (const text of lines || []) {
        const li = document.createElement('li');
        li.textContent = text;
        list.appendChild(li);
    }
    return list;
}

/**
 * A phone system bubble for one tell. Render-only: the caller appends it to
 * the thread and does not pass it to the contact history.
 */
export function tellBubble(text) {
    const node = document.createElement('div');
    node.className = 'message-bubble system pretext-tell';
    node.dataset.renderOnly = 'true';
    node.setAttribute('role', 'note');
    const p = document.createElement('p');
    p.className = 'message-text';
    p.textContent = text;
    node.appendChild(p);
    return node;
}

/** Append tell bubbles that are not already in the thread. Never removes dialogue. */
export function appendTellBubbles(container, lines) {
    if (!container) return;
    const have = container.querySelectorAll('.pretext-tell').length;
    const list = lines || [];
    for (let i = have; i < list.length; i++) container.appendChild(tellBubble(list[i]));
}

/**
 * One chat's influence header: the bar, the tells list, and (for phone) the
 * render-only bubbles. Both person-chat and phone-chat hold one of these.
 *
 * `parent()` is the header element. `messages()` is the phone thread, or null.
 * `onBand(band)` is the portrait tint. A character with no social entry mounts
 * nothing, so m01 to m08 gain no extra DOM.
 */
export class ChatInfluence {
    constructor({ parent, messages = null, mount = 'chat', place = 'end', headerClass = '', onBand = null } = {}) {
        this.parent = parent;
        this.messages = messages;
        this.mount = mount;
        this.place = place;
        this.headerClass = headerClass;
        this.onBand = onBand;
        this.characterId = null;
        this.bar = null;
        this.header = null;
        this.session = null;
        this.spec = null;
        this.lines = [];
        this.band = 0;
        this._unsub = null;
    }

    _scenario() {
        return (typeof window !== 'undefined' ? window.gameScenario : null) || null;
    }

    _listen() {
        if (this._unsub) return;
        const dispatcher = (typeof window !== 'undefined') ? window.eventDispatcher : null;
        if (!dispatcher || typeof dispatcher.on !== 'function') return;
        const fn = (data) => {
            if (data && data.character !== undefined && data.character !== this.characterId) return;
            this._applyBand();
        };
        dispatcher.on('npc_influence_changed', fn);
        this._unsub = () => { try { dispatcher.off?.('npc_influence_changed', fn); } catch (e) { /* gone */ } };
    }

    _applyBand() {
        const svc = (typeof window !== 'undefined') ? window.socialInfluence : null;
        const band = (this.characterId && svc && typeof svc.getBand === 'function') ? svc.getBand(this.characterId) : this.band;
        if (typeof band === 'number') {
            this.band = band;
            if (typeof this.onBand === 'function') this.onBand(band);
        }
    }

    /** Mount or clear the bar for the NPC the chat is open on. */
    mountBar(npcId) {
        this.bar?.destroy?.();
        this.bar = null;
        // A new conversation starts with no call. mountPretext fills the tells
        // again when this open is a pretext call, so a previous call's lines
        // do not stay on the next contact.
        this.session = null;
        this.spec = null;
        this.lines = [];
        const scenario = this._scenario();
        const characterId = characterIdFor(npcId, scenario);
        this.characterId = characterId;
        const parent = typeof this.parent === 'function' ? this.parent() : this.parent;
        if (!characterId || !parent) {
            this.header?.remove?.();
            this.header = null;
            return null;
        }
        const mounted = mountChatHeader(parent, {
            characterId,
            scenario,
            mount: this.mount,
            place: this.place,
            headerClass: this.headerClass
        });
        this.bar = mounted.bar;
        this.header = mounted.header;
        this.header?.querySelector('.pretext-tells')?.remove();
        this._listen();
        this._applyBand();
        return this.bar;
    }

    /** A pretext call: keep the session and draw the tells into the same header. */
    mountPretext({ session, spec, characterId } = {}) {
        this.session = session || null;
        this.spec = spec || null;
        if (characterId) this.characterId = characterId;
        if (!this.header) {
            const parent = typeof this.parent === 'function' ? this.parent() : this.parent;
            if (parent) {
                const mounted = mountChatHeader(parent, {
                    characterId: this.characterId,
                    scenario: this._scenario(),
                    mount: this.mount,
                    place: this.place,
                    headerClass: this.headerClass,
                    keepSlot: true
                });
                this.bar = this.bar || mounted.bar;
                this.header = mounted.header;
            }
        }
        this._listen();
        this.refresh();
    }

    refresh() {
        if (!this.session) return this.lines;
        const svc = (typeof window !== 'undefined') ? window.socialInfluence : null;
        const influence = (this.characterId && svc && typeof svc.getInfluence === 'function')
            ? svc.getInfluence(this.characterId) : undefined;
        this.lines = formatPretextTells(this.session, this.spec, influence);
        if (this.header) renderTells(this.header, this.lines);
        const box = typeof this.messages === 'function' ? this.messages() : this.messages;
        appendTellBubbles(box, this.lines);
        const last = this.session.log?.[this.session.log.length - 1];
        if (last) {
            // The bar's "Last change" is otherwise driven by the per-entry live events,
            // so a multi-entry line shows only its last entry while the tells row shows
            // the sum. Hand the bar the turn's entries so the two agree (lab R6 F1).
            if (this.bar && typeof this.bar.setChangeFromTurn === 'function') this.bar.setChangeFromTurn(last.entries, { kind: last.kind });
            if (typeof last.band === 'number') {
                this.band = last.band;
                if (typeof this.onBand === 'function') this.onBand(last.band);
            }
        }
        return this.lines;
    }

    state() {
        return {
            characterId: this.characterId,
            bar: this.bar ? this.bar.getState() : null,
            tells: [...this.lines],
            band: this.band
        };
    }

    destroy() {
        if (this._unsub) { this._unsub(); this._unsub = null; }
        this.bar?.destroy?.();
        this.bar = null;
        this.header = null;
        this.session = null;
    }
}
