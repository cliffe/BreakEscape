// Read-only mail reader: a message list and a reading pane (SE design 01 N5).
//
// Factored out of the mail client from the start so the triage defender (05)
// can sit on the same component. It owns no state beyond which message is
// selected: the caller hands it records (00 §10a) and is told when one is
// opened. It never writes a record; the caller marks mail read in onOpen.
//
// Every string the player reads or compares (names, addresses, subjects,
// bodies, file names, link text) goes in with textContent, never through
// displayDashes. The CSS sets them in the pixel font var(--se-font-readable), and
// addresses in var(--se-font-address).

import { splitBody, linkDestination } from './mail-data.js';
import { createInfluenceBar } from '../../ui/influence-bar.js';

const ICON = '/break_escape/assets/icons/';
const ATTACH_ICONS = new Set(['document', 'pdf', 'spreadsheet', 'archive', 'image', 'link']);

// Whether a link chip's visible label is itself a web/email address (a URL, a bare domain with a
// path, or an email) rather than prose like "Click here". Such a label is set in the address font,
// like every other address (E15, E17-n3). Prose labels keep the readable face.
const ADDRESS_LIKE = /^(https?:\/\/\S+|www\.\S+|[^\s@]+@[^\s@]+\.[^\s@]+|[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?)$/i;
function labelIsAddress(text) {
    return ADDRESS_LIKE.test(String(text ?? '').trim());
}

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function icon(name, alt = '') {
    const img = el('img', 'mail-icon');
    img.src = `${ICON}${name}.png`;
    img.alt = alt;
    return img;
}

function fromLine(rec) {
    const name = rec?.from?.name || '';
    const address = rec?.from?.address || '';
    return { name, address };
}

/**
 * Split `text` into plain runs and highlighted runs (01 N16, 00 §10a "Highlights
 * and saved evidence"). Each highlight's `text` is an exact substring of the body
 * (the validator checks it). The first, non-overlapping occurrence of each is
 * marked; overlaps and misses are left as plain text. Pure, exported for tests.
 * @returns {Array<{text:string}|{text:string, highlight:object}>}
 */
export function markHighlights(text, highlights) {
    const body = typeof text === 'string' ? text : '';
    const spans = [];
    for (const h of Array.isArray(highlights) ? highlights : []) {
        if (!h || typeof h.text !== 'string' || !h.text) continue;
        const idx = body.indexOf(h.text);
        if (idx === -1) continue;
        const end = idx + h.text.length;
        if (spans.some((s) => idx < s.end && end > s.start)) continue; // no overlaps
        spans.push({ start: idx, end, highlight: h });
    }
    spans.sort((a, b) => a.start - b.start);
    const out = [];
    let pos = 0;
    for (const s of spans) {
        if (s.start > pos) out.push({ text: body.slice(pos, s.start) });
        out.push({ text: body.slice(s.start, s.end), highlight: s.highlight });
        pos = s.end;
    }
    if (pos < body.length) out.push({ text: body.slice(pos) });
    return out.length ? out : [{ text: body }];
}

export class MailReader {
    /**
     * @param {HTMLElement} parent
     * @param {object} [opts]
     * @param {(record: object) => void} [opts.onOpen]      called when a message is opened
     * @param {(close: Function, name?: string) => Function} [opts.pushLayer]  Esc layer hook
     * @param {(record: object) => boolean} [opts.judgedVisible]  whether a sent record's judged line shows
     * @param {string} [opts.emptyText]
     * @param {(record: object) => string|null} [opts.influenceCharacter]  the social character whose
     *        influence bar shows with a message (default: the character in `thread`, else `targetId`)
     * @param {object} [opts.scenario]  scenario holding `social` for the bar (default window.gameScenario)
     *
     * Triage (05 N2) adds these; every one is off by default so the mail client is unchanged:
     * @param {boolean} [opts.influence]  false: never show an influence bar
     * @param {string} [opts.linkPrefix]  the pinned link line's lead ("This would go to: ")
     * @param {{show:string, hide:string}} [opts.detailsLabels]  the details toggle's two labels
     * @param {boolean} [opts.noDetails]  no details toggle or panel at all
     * @param {boolean} [opts.hiddenReveal]  false: do not render the rec.hiddenText "Show hidden text"
     *        reveal (the host draws its own, e.g. the triage card's _afterBody). Default: render it.
     * @param {boolean} [opts.detailsAlwaysOpen]  show the details panel with no toggle and no Esc layer
     * @param {(record: object) => Node|null} [opts.detailsRenderer]  builds the details panel (the header panel)
     * @param {(record: object, pane: HTMLElement) => void} [opts.afterBody]  appends controls under the message
     * @param {(record: object) => string|null} [opts.rowBadge]  a short word shown in the list row
     * @param {(record: object) => string|null} [opts.rowTag]  a kind word shown before the row's subject
     * @param {(record: object, h: object) => Node|null} [opts.paneRenderer]  draws a non-email message
     *        in place of the subject, headers, details and body; h is { bodyNode, showLink, showNote }.
     *        null keeps the email layout. The status line and afterBody still follow.
     */
    constructor(parent, opts = {}) {
        this.opts = opts;
        this.folder = 'inbox';
        this.records = [];
        this.selectedId = null;
        this.detailsOpen = false;
        this._popLayer = null;
        this.linkNote = '';
        this.influenceBar = null;

        this.root = el('div', 'mail-reader');
        this.listPane = el('div', 'mail-list-pane');
        this.list = el('div', 'mail-list');
        this.list.setAttribute('role', 'group');
        this.list.setAttribute('aria-label', 'Messages');
        this.listPane.appendChild(this.list);
        this.readPane = el('div', 'mail-read-pane');
        this.root.append(this.listPane, this.readPane);
        parent.appendChild(this.root);
        this.render();
    }

    setMessages(records, folder = this.folder) {
        this.folder = folder === 'sent' ? 'sent' : 'inbox';
        this.records = Array.isArray(records) ? records : [];
        if (this.selectedId && !this.records.some((r) => r.id === this.selectedId)) this.selectedId = null;
        this.render();
    }

    selected() {
        return this.records.find((r) => r.id === this.selectedId) || null;
    }

    select(id) {
        const rec = this.records.find((r) => r.id === id);
        if (!rec) return false;
        this._closeDetails();
        this.selectedId = id;
        this.linkNote = '';
        this.opts.onOpen?.(rec);
        this.render();
        // A new message opens at its top, not at the scroll position of the one before it.
        if (this.readPane) this.readPane.scrollTop = 0;
        const heading = this.readPane.querySelector?.('.mail-subject');
        if (heading) { heading.tabIndex = -1; heading.focus?.(); }
        return true;
    }

    /** Back to the list (the narrow layout's Back button); also clears the selection on wide screens. */
    back() {
        const from = this.selectedId;
        this._closeDetails();
        this.selectedId = null;
        this.linkNote = '';
        this.render();
        // Render rebuilt the list; focus returns to the row the player just left.
        const row = [...(this.list.querySelectorAll?.('.mail-row') || [])].find((r) => r.dataset.id === from)
            || this.list.querySelector?.('.mail-row');
        row?.focus?.();
    }

    render() {
        this.root.classList.toggle('has-selection', !!this.selectedId);
        this.root.dataset.folder = this.folder;
        this._renderList();
        this._renderPane();
    }

    _renderList() {
        this.list.textContent = '';
        if (!this.records.length) {
            this.list.appendChild(el('p', 'mail-empty',
                this.opts.emptyText || (this.folder === 'sent' ? 'Nothing sent yet.' : 'No messages.')));
            return;
        }
        for (const rec of this.records) {
            const unread = this.folder === 'inbox' && rec.read !== true;
            const row = el('button', 'mail-row');
            row.type = 'button';
            row.dataset.id = rec.id;
            row.dataset.unread = unread ? 'true' : 'false';
            if (rec.id === this.selectedId) {
                row.classList.add('selected');
                row.setAttribute('aria-current', 'true');
            }
            const mark = el('span', 'mail-row-mark');
            if (unread) {
                mark.appendChild(icon('mail-unread-dot'));
                mark.appendChild(el('span', 'mail-sr-only', 'Unread. '));
            }
            const sender = fromLine(rec);
            const who = this.folder === 'sent'
                ? `To: ${rec.to || ''}`
                : (sender.name || sender.address);
            // Address text (a bare address with no display name, or a page host) is set in the
            // address font so look-alike characters read as they would in a browser bar.
            const whoIsAddress = this.folder !== 'sent' && (rec.whoIsAddress === true || (!sender.name && !!sender.address));
            const top = el('span', 'mail-row-top');
            top.append(el('span', whoIsAddress ? 'mail-row-who mail-row-address' : 'mail-row-who', who), el('span', 'mail-row-time', rec.time || ''));
            const sub = el('span', 'mail-row-subject', rec.subject || '(no subject)');
            const tag = this.opts.rowTag ? this.opts.rowTag(rec) : null;
            if (tag) sub.prepend(el('span', 'mail-row-tag', tag), document.createTextNode(' '));
            const body = el('span', 'mail-row-body');
            body.append(top, sub);
            row.append(mark, body);
            const badge = this.opts.rowBadge ? this.opts.rowBadge(rec) : null;
            // A badge may be a plain word (the mail/triage default: a success tick) or an object
            // { word, tone?, mark? } so a wrong triage verdict shows a cross, never a success tick
            // (F-E19-7). tone adds a .mail-row-badge-<tone> class; mark names the icon, or null for
            // none. A bare string keeps the old mark-tick output exactly.
            const info = typeof badge === 'string' ? { word: badge }
                : (badge && typeof badge === 'object' ? badge : null);
            if (info && info.word) {
                const b = el('span', 'mail-row-badge');
                if (info.tone) b.classList.add(`mail-row-badge-${info.tone}`);
                const markName = Object.prototype.hasOwnProperty.call(info, 'mark') ? info.mark : 'mark-tick';
                if (markName) b.appendChild(icon(markName));
                b.appendChild(el('span', 'mail-row-badge-word', info.word));
                body.appendChild(b);
            }
            if (Array.isArray(rec.attachments) && rec.attachments.length) {
                row.appendChild(icon('attach-document', 'Has an attachment'));
            }
            row.addEventListener('click', () => this.select(rec.id));
            this.list.appendChild(row);
        }
    }

    /** The social character a message belongs to, for the influence bar (01 N7). */
    _influenceCharacter(rec) {
        if (this.opts.influence === false) return null;
        if (this.opts.influenceCharacter) return this.opts.influenceCharacter(rec) || null;
        if (typeof rec.thread === 'string' && rec.thread.includes(':')) return rec.thread.split(':')[0];
        return rec.targetId || null;
    }

    _destroyInfluenceBar() {
        if (this.influenceBar) { this.influenceBar.destroy(); this.influenceBar = null; }
    }

    _renderPane() {
        const pane = this.readPane;
        const rec = this.selected();
        const nextCharacter = rec ? this._influenceCharacter(rec) : null;
        // Keep the live influence bar across a pane rebuild when the character is
        // unchanged. A reply delivered while a message is open refreshes the pane
        // (the mail client's _refresh); destroying and rebuilding the bar would
        // drop its "Last change" line and the live announcement that has already
        // fired (F-2). Detach it before clearing so textContent = '' leaves it alone.
        const keptBar = this.influenceBar && nextCharacter && this.influenceBar.config.id === nextCharacter
            ? this.influenceBar : null;
        if (keptBar) keptBar.el.remove?.();
        else this._destroyInfluenceBar();
        pane.textContent = '';
        if (!rec) {
            pane.appendChild(el('p', 'mail-placeholder', 'Select a message to read it.'));
            return;
        }

        const back = el('button', 'mail-back minigame-button', 'Back to list');
        back.type = 'button';
        back.addEventListener('click', () => this.back());
        pane.appendChild(back);

        const custom = this.opts.paneRenderer ? this.opts.paneRenderer(rec, {
            bodyNode: (r) => this._bodyNode(r),
            showLink: (dest) => this._showLink(dest),
            showNote: (text) => { this.linkNote = text; if (this.linkStatus) this.linkStatus.textContent = text; }
        }) : null;
        if (custom) {
            pane.appendChild(custom);
            const note = el('p', 'mail-link-status');
            note.setAttribute('aria-live', 'polite');
            note.textContent = this.linkNote;
            pane.appendChild(note);
            this.linkStatus = note;
            if (this.opts.afterBody) this.opts.afterBody(rec, pane);
            return;
        }

        pane.appendChild(el('h2', 'mail-subject', rec.subject || '(no subject)'));

        const head = el('dl', 'mail-headers');
        const { name, address } = fromLine(rec);
        const addRow = (label, nodes) => {
            const dt = el('dt', null, label);
            const dd = el('dd');
            nodes.forEach((n) => dd.appendChild(n));
            head.append(dt, dd);
        };
        addRow('From', [el('span', 'mail-from-name', name), document.createTextNode(' '),
            el('span', 'mail-from-address', address ? `<${address}>` : '')]);
        addRow('To', [el('span', 'mail-to', rec.to || '')]);
        if (rec.time) addRow('Time', [el('span', 'mail-time', rec.time)]);
        pane.appendChild(head);

        // The influence bar (01 N7, 00 S4): shown for a social character, read from gameState,
        // and nothing when the character's influence.display has bar: false.
        const characterId = nextCharacter;
        const bar = keptBar
            || (characterId ? createInfluenceBar({ characterId, scenario: this.opts.scenario, mount: 'reading-pane' }) : null);
        if (bar) {
            this.influenceBar = bar;
            pane.appendChild(bar.el);
            if (keptBar) bar.update(); // re-read gameState; the kept bar keeps its change line
        }

        const always = this.opts.detailsAlwaysOpen === true;
        const noDetails = this.opts.noDetails === true;
        if (!always && !noDetails) {
            const labels = this.opts.detailsLabels || { show: 'Message details', hide: 'Hide message details' };
            const detailsBtn = el('button', 'mail-details-toggle minigame-button',
                this.detailsOpen ? labels.hide : labels.show);
            detailsBtn.type = 'button';
            detailsBtn.setAttribute('aria-expanded', this.detailsOpen ? 'true' : 'false');
            detailsBtn.addEventListener('click', () => this._toggleDetails());
            pane.appendChild(detailsBtn);
        }
        if (!noDetails && (always || this.detailsOpen)) pane.appendChild(this._detailsPanel(rec));

        const attachments = Array.isArray(rec.attachments) ? rec.attachments.slice() : [];
        if (rec.attachment && !attachments.length) attachments.push(rec.attachment);
        if (attachments.length) {
            const chips = el('div', 'mail-chips');
            for (const a of attachments) {
                const chip = el('span', 'mail-chip mail-chip-attachment');
                const kind = ATTACH_ICONS.has(a.kind) ? a.kind : 'document';
                chip.append(icon(`attach-${kind}`), el('span', 'mail-chip-label', a.label || a.kitId || 'Attachment'),
                    el('span', 'mail-sr-only', ` (${kind} attachment)`));
                chips.appendChild(chip);
            }
            pane.appendChild(chips);
        }

        // A sent record's landing-page link (01 N4): an abstract chip, never a real URL.
        if (rec.link && (rec.link.destination || rec.link.linkText || rec.link.kitId)) {
            const chips = el('div', 'mail-chips');
            const chip = el('span', 'mail-chip mail-chip-attachment');
            const labelText = rec.link.destination || rec.link.linkText || rec.link.kitId;
            chip.append(icon('attach-link'), el('span', `mail-chip-label${labelText === rec.link.destination ? ' mail-chip-address' : ''}`, labelText),
                el('span', 'mail-sr-only', ' (link attachment)'));
            chips.appendChild(chip);
            pane.appendChild(chips);
        }

        pane.appendChild(this._bodyNode(rec));

        // A planted line meant for a reader that is not the recipient (E13's AI-assistant
        // injection) is concealed behind a "Show hidden text" reveal, as the triage card does
        // (tri-hidden). Guarded by rec.hiddenText, so ordinary mail — and every mission's mail —
        // is unchanged. The same `tri-hidden` classes carry the existing reveal styling.
        const hidden = this._hiddenReveal(rec);
        if (hidden) pane.appendChild(hidden);

        const status = el('p', 'mail-link-status');
        status.setAttribute('aria-live', 'polite');
        status.textContent = this.linkNote;
        pane.appendChild(status);
        this.linkStatus = status;

        // "Add selection to notepad" (01 N16): offered whenever the host wired it.
        if (typeof this.opts.onSaveSelection === 'function') pane.appendChild(this._selectionControl());

        if (this.folder === 'sent') pane.appendChild(this._sentNote(rec));
        if (this.opts.afterBody) this.opts.afterBody(rec, pane);
    }

    /**
     * The "Show hidden text" reveal for a message that carries a line planted for a reader other
     * than the recipient (E13 AI-assistant injection), or null when the message authors no
     * `hiddenText` (so every other message is unchanged). Mirrors the triage card's reveal
     * (triage-kinds.js emailHiddenReveal): the same `tri-hidden` classes, text set via textContent,
     * the button toggling `aria-expanded`. `rec.hiddenTextLabel` overrides the button label.
     */
    _hiddenReveal(rec) {
        if (this.opts.hiddenReveal === false) return null; // the host renders its own (triage's _afterBody)
        if (!rec || typeof rec.hiddenText !== 'string' || !rec.hiddenText) return null;
        const box = el('div', 'tri-hidden');
        const btn = el('button', 'tri-hidden-btn minigame-button',
            typeof rec.hiddenTextLabel === 'string' && rec.hiddenTextLabel ? rec.hiddenTextLabel : 'Show hidden text');
        btn.type = 'button';
        btn.setAttribute('aria-expanded', 'false');
        const text = el('p', 'tri-hidden-text', rec.hiddenText);
        text.hidden = true;
        btn.addEventListener('click', () => { text.hidden = false; btn.setAttribute('aria-expanded', 'true'); });
        box.append(btn, text);
        return box;
    }

    _bodyNode(rec) {
        const body = el('div', 'mail-body');
        const links = new Map((Array.isArray(rec.links) ? rec.links : []).map((l) => [l.id, l]));
        for (const part of splitBody(rec.body)) {
            if (part.text !== undefined) {
                this._appendTextRuns(body, part.text, rec);
                continue;
            }
            const link = links.get(part.link);
            if (!link) { body.appendChild(document.createTextNode('[link]')); continue; }
            const dest = linkDestination(link);
            const chip = el('button', 'mail-chip mail-chip-link');
            chip.type = 'button';
            chip.dataset.linkId = link.id;
            chip.title = `${this._linkPrefix()}${dest}`;
            const labelText = link.linkText || dest;
            const asAddress = !link.linkText || labelIsAddress(labelText);
            chip.append(icon('attach-link'), el('span', `mail-chip-label${asAddress ? ' mail-chip-address' : ''}`, labelText));
            const show = () => this._showLink(dest);
            chip.addEventListener('mouseenter', show);
            chip.addEventListener('focus', show);
            chip.addEventListener('click', show); // tap: pinned, nothing is hover-only
            body.appendChild(chip);
        }
        return body;
    }

    /**
     * Append a run of body text, marking the author's highlight spans (01 N16, 00
     * §10a) as clickable "Save as evidence" chips when the host wired onHighlight.
     * Plain text otherwise, so the mail client's ordinary mail and the triage reader
     * are unchanged.
     */
    _appendTextRuns(container, text, rec) {
        const highlights = Array.isArray(rec.highlights) ? rec.highlights : [];
        if (!highlights.length || typeof this.opts.onHighlight !== 'function') {
            this._appendBodyText(container, text);
            return;
        }
        for (const run of markHighlights(text, highlights)) {
            if (!run.highlight) { this._appendBodyText(container, run.text); continue; }
            const mark = el('button', 'mail-highlight');
            mark.type = 'button';
            mark.dataset.highlightId = run.highlight.id || '';
            mark.textContent = run.text;
            mark.title = 'Save as evidence';
            mark.setAttribute('aria-label', `Highlighted: ${run.text}. Save as evidence.`);
            mark.addEventListener('click', () => {
                try { this.opts.onHighlight(run.highlight, rec); } catch (e) { console.error('mail onHighlight failed:', e); }
            });
            container.appendChild(mark);
        }
    }

    /**
     * Append body text, setting any web/email address in the address font (--se-font-address) so
     * look-alike characters read as they would in a browser bar, as every other address in the game
     * does (E17-n3, E8 F15). Prose stays in the readable body face. Trailing sentence punctuation is
     * left outside the address span. Bodies with no address append a single text node, unchanged.
     */
    _appendBodyText(container, text) {
        const str = typeof text === 'string' ? text : '';
        if (!str) { return; }
        const re = /(https?:\/\/[^\s]+|www\.[^\s]+|[^\s@]+@[^\s@]+\.[^\s@]+)/g;
        let last = 0;
        let m;
        while ((m = re.exec(str)) !== null) {
            let token = m[0];
            const start = m.index;
            const trail = (token.match(/[.,;:!?)\]}>'"]+$/) || [''])[0];
            if (trail) token = token.slice(0, token.length - trail.length);
            if (!token) continue; // nothing but punctuation (cannot happen with these patterns)
            if (start > last) container.appendChild(document.createTextNode(str.slice(last, start)));
            container.appendChild(el('span', 'mail-body-url', token));
            if (trail) container.appendChild(document.createTextNode(trail));
            last = start + m[0].length;
        }
        if (last === 0) { container.appendChild(document.createTextNode(str)); return; }
        if (last < str.length) container.appendChild(document.createTextNode(str.slice(last)));
    }

    /** "Add selection to notepad" (01 N16): sends the current text selection to the notes API. */
    _selectionControl() {
        const btn = el('button', 'mail-save-selection minigame-button', 'Add selection to notepad');
        btn.type = 'button';
        btn.addEventListener('click', () => {
            let text = '';
            try { text = (typeof window !== 'undefined' && window.getSelection) ? String(window.getSelection() || '').trim() : ''; }
            catch (e) { text = ''; }
            if (!text) { this._showLink('Select some text in the message first.'); return; }
            try { this.opts.onSaveSelection(text); } catch (e) { console.error('mail onSaveSelection failed:', e); }
            this._showLink('Saved to your notepad.');
        });
        return btn;
    }

    _linkPrefix() {
        return this.opts.linkPrefix || 'This would go to: ';
    }

    _showLink(dest) {
        this.linkNote = `${this._linkPrefix()}${dest}`;
        if (this.linkStatus) this.linkStatus.textContent = this.linkNote;
    }

    _detailsPanel(rec) {
        if (this.opts.detailsRenderer) {
            const node = this.opts.detailsRenderer(rec);
            if (node) return node;
        }
        const box = el('dl', 'mail-details');
        const add = (k, v) => { box.append(el('dt', null, k), el('dd', null, v)); };
        add('Shown as from', `${rec.from?.name || ''} <${rec.from?.address || ''}>`);
        if (rec.fromAccount) add('Sent from account', rec.fromAccount);
        add('To', rec.to || '');
        add('Folder', rec.folder === 'sent' ? 'Sent' : 'Inbox');
        if (rec.time) add('Time', rec.time);
        return box;
    }

    _toggleDetails() {
        if (this.detailsOpen) { this._closeDetails(); this.render(); this._focusDetailsToggle(); return; }
        this.detailsOpen = true;
        this._popLayer = this.opts.pushLayer?.(() => { this._closeDetails(); this.render(); this._focusDetailsToggle(); }, 'message-details') || null;
        this.render();
        this._focusDetailsToggle();
    }

    _focusDetailsToggle() {
        this.readPane.querySelector?.('.mail-details-toggle')?.focus?.();
    }

    _closeDetails() {
        this.detailsOpen = false;
        if (this._popLayer) { this._popLayer(); this._popLayer = null; }
    }

    /** The "judged" line under a sent message. Hidden while a delivery job is pending (withReply). */
    _sentNote(rec) {
        const note = el('div', 'mail-sent-note');
        if (rec.kind === 'quickReply') return note;
        const hidden = this.opts.judgedVisible ? this.opts.judgedVisible(rec) === false : rec.judgePending === true;
        if (hidden) {
            note.appendChild(el('p', 'mail-judged mail-judged-waiting', 'Sent. Waiting for a reply.'));
            return note;
        }
        if (rec.landed === true || rec.landed === false) {
            const ok = rec.landed === true;
            const line = el('p', `mail-judged ${ok ? 'landed' : 'not-landed'}`);
            line.append(icon(ok ? 'mark-tick' : 'mark-cross'),
                el('span', null, ok ? 'Judged: landed' : 'Judged: did not land'));
            note.appendChild(line);
        }
        return note;
    }

    getState() {
        return {
            folder: this.folder,
            selectedId: this.selectedId,
            detailsOpen: this.detailsOpen,
            linkNote: this.linkNote,
            // Highlight chips rendered in the open message (01 N16), for the bridge check.
            highlights: [...(this.readPane?.querySelectorAll?.('.mail-highlight') || [])].map((b) => b.dataset.highlightId),
            influence: this.influenceBar ? this.influenceBar.getState() : null,
            messages: this.records.map((r) => ({
                id: r.id,
                who: this.folder === 'sent' ? (r.to || '') : (r.from?.name || r.from?.address || ''),
                subject: r.subject || '',
                time: r.time || '',
                unread: this.folder === 'inbox' && r.read !== true
            }))
        };
    }

    destroy() {
        this._closeDetails();
        this._destroyInfluenceBar();
        this.root.remove?.();
    }
}
