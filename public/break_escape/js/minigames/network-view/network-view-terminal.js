/**
 * NETWORK VIEW: THE TERMINAL RENDERER (Ops S6 unit 14)
 * ====================================================
 *
 * The command-line look of the network view (skin `cli`, shown as "Terminal"). It draws the same
 * offers as the Panels renderer and sends them through the same `ctx.perform`: it offers nothing
 * the Panels do not. The scene's hooks write what a sent offer and its answer look like into the
 * foothold's log (terminal-format.js); this renderer draws that log, reads typed lines with the
 * grammar, and writes only the lines of commands that send nothing (a local command, a typo).
 *
 *   mount(root, ctx)             `root` is the framework's game area; `ctx` holds `perform(offer, echo)`,
 *                                `requestClose()` and `requestSkin(name)` and nothing else.
 *   render(view, offers, scene)  draws the quick commands and any new log lines. `scene` is
 *                                `{ notice, unplugNotice, message, stale, status, hint, lastGrant }`
 *                                and, for the log's key, `footholdId` (else the view's `id`).
 *   showResult(offer, answer, scene)
 *                                a redraw and a scroll; it writes no log line (the scene's hooks did).
 *   noteChange(scene, part)      with no `part`, the rows changed under the player: one line is added.
 *                                `'notice'` and `'unplug'` (Panels lines) are ignored: the log holds them.
 *   testState()                  `{ skin: 'cli', log, folded, mode }`.
 *   unmount()                    removes every listener and drops the local mode.
 *
 * Everything drawn from scenario or server text goes in with `textContent`. Local state that is part
 * of no offer (the prompt mode, the half-typed line, the history, the fold) lives here and ends in
 * one call of `ctx.perform` with one complete offer, or in nothing.
 */

import {
    pendingKey, findFinding, techniqueList, openWho, isHostRow
} from './ops-model.js';
import {
    SWEEPING_TEXT, SCANNING_TEXT, CHECKING_TEXT, CONFIRMING_TEXT, USING_TEXT, UNPLUGGING_TEXT
} from './view-texts.js';
import { CONTROLS } from './view-controls.js';
import { parse, complete } from './terminal-grammar.js';
import {
    logFor, appendLine, localLines, cleanText, STRIP_LABEL, CHANGE_LINE_TEXT, PROMPT_LABEL
} from './terminal-format.js';
import { promptMark } from './cli-gen/framework-console.js';

export const HISTORY_MAX = 20;
export const BACK_LABEL = 'Back to all commands';
const BACK_MARK = 'X';
const PROMPT_AT_START = /^(\$|msf(?: \([^)]*\))? >)(?: |$)/;

// The label a control wears while its request is out (the same words as the Panels)
const PENDING_LABELS = Object.freeze({
    sweep: SWEEPING_TEXT, scan: SCANNING_TEXT, check: CHECKING_TEXT, confirm: CONFIRMING_TEXT,
    use: USING_TEXT, unplug: UNPLUGGING_TEXT
});

const isObj = (o) => o !== null && typeof o === 'object';
const freshMode = () => ({ prompt: 'shell', module: null, technique: null });
const span = (text, cls) => (cls ? { text: String(text), cls } : { text: String(text) });

let counter = 0;

export class TerminalRenderer {
    constructor() {
        this.root = null;
        this.ctx = null;
        this.view = null;
        this.offers = [];
        this.scene = {};
        this.mode = freshMode();
        this.folded = false;
        this.useStep = null;
        this.history = [];
        this.historyAt = null;
        this.draft = '';
        this._listeners = [];
        this._drawn = [];
        this._cleared = null;
        this._logKey = null;
        this._id = `network-term-${(counter += 1)}`;
    }

    // -----------------------------------------------------------------------------------------
    // Mounting
    // -----------------------------------------------------------------------------------------

    mount(root, ctx) {
        this.root = root;
        this.ctx = ctx;
        if (!root) return;
        const doc = root.ownerDocument;
        const make = (tag, cls, attrs = {}) => {
            const el = doc.createElement(tag);
            if (cls) el.className = cls;
            for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
            return el;
        };
        root.textContent = '';
        this.wrap = make('div', 'network-term');
        const body = make('div', 'network-term-body');
        this.logEl = make('div', 'network-term-log pixel-scroll', { role: 'log', 'aria-live': 'off' });
        this.stripEl = make('div', 'network-term-strip');
        this.toggle = make('button', 'minigame-button network-term-fold', { type: 'button', 'aria-expanded': 'true', 'aria-controls': `${this._id}-list` });
        this.toggle.textContent = STRIP_LABEL;
        this.listEl = make('div', 'network-term-list', { id: `${this._id}-list` });
        this.stripEl.append(this.toggle, this.listEl);
        body.append(this.logEl, this.stripEl);

        this.form = make('form', 'network-term-form');
        this.label = make('label', 'network-term-label', { for: `${this._id}-input` });
        this.label.textContent = PROMPT_LABEL;
        const line = make('div', 'network-term-line');
        this.markEl = make('span', 'network-term-mark prompt', { 'aria-hidden': 'true' });
        this.input = make('input', 'network-term-input', {
            type: 'text', id: `${this._id}-input`, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false'
        });
        line.append(this.markEl, this.input);
        this.form.append(this.label, line);
        this.wrap.append(body, this.form);
        root.appendChild(this.wrap);

        this._on(this.toggle, 'click', () => this.fold(!this.folded));
        this._on(this.form, 'submit', (e) => { e.preventDefault(); this._enter(); });
        this._on(this.input, 'keydown', (e) => this._onKey(e));
        this._on(this.input, 'input', () => this._tabAttr());
        this._on(this.input, 'focus', () => this._soft(this.input));
        this._drawMark();
        this._tabAttr();
        try { window.pauseKeyboardInput?.(); } catch (e) { /* a page with no key pause has nothing to pause */ }
        this.focusPrompt();
    }

    unmount() {
        for (const [el, name, fn] of this._listeners) el.removeEventListener(name, fn);
        this._listeners = [];
        this.ctx = null;
        this.mode = freshMode();
        this.useStep = null;
        this.draft = '';
        this.historyAt = null;
        this._drawn = [];
        this._cleared = null;
        if (this.wrap?.parentNode) this.wrap.parentNode.removeChild(this.wrap);
        this.wrap = null;
        this.root = null;
    }

    _on(el, name, fn) {
        el.addEventListener(name, fn);
        this._listeners.push([el, name, fn]);
    }

    // -----------------------------------------------------------------------------------------
    // Drawing
    // -----------------------------------------------------------------------------------------

    render(view, offers, scene) {
        this.view = view || null;
        this.offers = Array.isArray(offers) ? offers : [];
        if (scene) this.scene = scene;
        if (!this.root || !this.wrap) return;
        if (this.useStep && !techniqueList(this.view).some(t => t.id === this.useStep)) this.useStep = null;
        const active = this.root.ownerDocument.activeElement;
        const hadFocus = !!this.listEl.contains(active);
        const focusKey = hadFocus ? this._focusKey(active) : null;
        this._drawStrip();
        this._drawMark();
        this._syncLog();
        // The first fill is silent: the lines already on screen are not read out again after a switch or a return
        if (this.logEl.getAttribute('aria-live') !== 'polite') this.logEl.setAttribute('aria-live', 'polite');
        if (hadFocus) {
            // keep a keyboard user on the command they were on, when the redraw still has it
            const again = focusKey ? [...this.listEl.querySelectorAll('button')].find(b => !b.disabled && this._focusKey(b) === focusKey) : null;
            if (again && again.focus) { again.focus(); this._soft(this.input); } else this.focusPrompt();
        }
    }

    /** What names a quick command across a redraw: its action and the Panels row attributes of its wrapper. */
    _focusKey(el) {
        const btn = el?.closest?.('button');
        if (!btn) return null;
        const wrap = btn.closest('.network-term-cmd');
        const own = btn.hasAttribute('data-unplug') ? 'unplug' : (btn.getAttribute('data-action') || (btn.classList.contains('network-term-back') ? 'back' : ''));
        const attrs = wrap ? [...wrap.attributes].filter(a => a.name.startsWith('data-')).map(a => `${a.name}=${a.value}`).sort() : [];
        return [own, ...attrs].join('|');
    }

    showResult(offer, answer, scene) {
        if (scene) this.scene = scene;
        if (!this.root) return;
        if (offer?.action === 'use') this.useStep = null;
        this.render(this.view, this.offers, this.scene);
        this._scrollLog();
        this._soft(this.input);
    }

    noteChange(scene, part) {
        if (scene) this.scene = scene;
        if (part === 'notice' || part === 'unplug') return;
        const log = this._log(true);
        if (!log) return;
        appendLine(log, [span(CHANGE_LINE_TEXT, 'note')]);
        this._syncLog();
    }

    testState() {
        return {
            skin: 'cli',
            log: this._drawn.map(d => d.spans.map(s => s.text).join('')),
            folded: this.folded,
            mode: { ...this.mode }
        };
    }

    /** The foothold's log (made when asked: a typed line is a live trip's), or null when no key is known. */
    _log(create = false) {
        const key = this.scene?.footholdId ?? this.view?.id ?? this.view?.footholdId ?? this._logKey;
        if (typeof key !== 'string' || key === '') return null;
        this._logKey = key;
        return logFor(key, { create });
    }

    /** Add the log's new lines to the screen. Lines already drawn stay; a line the log dropped at its cap goes. */
    _syncLog() {
        if (!this.logEl) return;
        const log = this._log(false);
        const lines = log ? log.lines : [];
        while (this._drawn.length && !lines.includes(this._drawn[0].spans)) this._drawn.shift().el.remove();
        let from = 0;
        if (this._drawn.length) {
            const at = lines.indexOf(this._drawn[this._drawn.length - 1].spans);
            if (at < 0) { this._drawn = []; this.logEl.textContent = ''; } else from = at + 1;
        }
        if (!this._drawn.length && this._cleared) from = Math.max(from, lines.indexOf(this._cleared) + 1);
        const doc = this.root.ownerDocument;
        let added = false;
        for (let i = from; i < lines.length; i++) {
            const el = doc.createElement('div');
            el.className = 'network-term-line-out';
            for (const s of lines[i]) {
                const part = doc.createElement('span');
                part.className = s.cls ? `network-term-span ${s.cls}` : 'network-term-span';
                part.textContent = s.text;
                el.appendChild(part);
            }
            this.logEl.appendChild(el);
            this._drawn.push({ spans: lines[i], el });
            added = true;
        }
        if (added) this._scrollLog();
    }

    _scrollLog() {
        if (this.logEl) this.logEl.scrollTop = this.logEl.scrollHeight;
    }

    _drawMark() {
        if (!this.markEl) return;
        let mark;
        try { mark = promptMark(this.mode, this.view || {}); } catch (e) { mark = '$'; }
        this.markEl.textContent = cleanText(mark);
    }

    // ----- the quick commands -----

    _pendingOf(offer) {
        if (offer.pending === true) return true;
        const key = pendingKey(offer.action, offer.target);
        return this.offers.some(o => o.pending === true && o.action === offer.action && pendingKey(o.action, o.target) === key);
    }

    _drawStrip() {
        const list = this.listEl;
        list.textContent = '';
        list.hidden = this.folded;
        this.toggle.setAttribute('aria-expanded', this.folded ? 'false' : 'true');
        if (this.useStep) { this._drawUseStrip(); return; }
        for (const offer of this.offers) {
            if (offer.action === 'use') continue;
            list.appendChild(this._quick(offer));
        }
        for (const t of techniqueList(this.view)) list.appendChild(this._techniqueButton(t));
    }

    _button(doc, cls) {
        const btn = doc.createElement('button');
        btn.type = 'button';
        btn.className = `minigame-button network-row-action ${cls}`;
        return btn;
    }

    /** One quick command: a wrapper with the Panels row attributes, holding the button with the Panels `data-action` and title. */
    _quick(offer) {
        const doc = this.root.ownerDocument;
        const ids = isObj(offer.ids) ? offer.ids : {};
        const wrap = doc.createElement('span');
        wrap.className = 'network-term-cmd';
        const set = (k, v) => { if (typeof v === 'string' && v !== '') wrap.setAttribute(k, v); };
        let who = '';
        switch (offer.action) {
            case 'sweep': set('data-network-id', ids.networkId); break;
            case 'scan': case 'sign-in': set('data-host-id', ids.hostId); break;
            case 'check': set('data-host-id', ids.hostId); set('data-service', ids.service); break;
            case 'confirm': {
                const hit = findFinding(this.view, ids.findingId);
                set('data-host-id', hit?.row?.id ?? hit?.finding?.hostId);
                set('data-service', hit?.finding?.service);
                set('data-finding', hit?.finding?.alias);
                break;
            }
            case 'open':
                if (ids.hostId) {
                    set('data-host-id', ids.hostId);
                    const row = this._rowById(ids.hostId);
                    if (row && isHostRow(row) && row.session) who = openWho(row.session);
                } else set('data-resource-id', ids.resourceId);
                break;
            case 'observe': set('data-resource-id', ids.resourceId); break;
            default: break;
        }
        const btn = this._button(doc, 'network-term-quick');
        if (offer.action === 'unplug') btn.setAttribute('data-unplug', '');
        else btn.setAttribute('data-action', offer.action);
        const title = offer.title ?? CONTROLS[offer.action]?.title;
        if (title) btn.title = cleanText(title);
        const busy = this._pendingOf(offer);
        const label = busy && PENDING_LABELS[offer.action] ? PENDING_LABELS[offer.action] : (offer.label ?? CONTROLS[offer.action]?.label ?? '');
        const name = doc.createElement('span');
        name.className = 'network-term-quick-label';
        name.textContent = cleanText(who && !busy ? `${label} (${who})` : label);
        btn.appendChild(name);
        if (typeof offer.command === 'string' && offer.command !== '') {
            const code = doc.createElement('code');
            code.textContent = cleanText(offer.command);
            btn.append(' ', code);
        }
        if (busy) btn.disabled = true;
        else btn.addEventListener('click', (e) => { e.preventDefault(); this._press(offer); });
        wrap.appendChild(btn);
        return wrap;
    }

    _rowById(id) {
        const v = this.view || {};
        const rows = [...(Array.isArray(v.hosts) ? v.hosts : [])];
        for (const b of (Array.isArray(v.networks) ? v.networks : [])) if (Array.isArray(b?.hosts)) rows.push(...b.hosts);
        return rows.find(r => r && r.id === id) || null;
    }

    _techniqueButton(t) {
        const doc = this.root.ownerDocument;
        const wrap = doc.createElement('span');
        wrap.className = 'network-term-cmd';
        wrap.setAttribute('data-technique', t.id);
        const btn = this._button(doc, 'network-term-quick');
        btn.setAttribute('data-action', 'select-technique');
        if (CONTROLS.use?.title) btn.title = cleanText(CONTROLS.use.title);
        const label = doc.createElement('span');
        label.className = 'network-term-quick-label';
        label.textContent = CONTROLS.use.label;
        const code = doc.createElement('code');
        code.textContent = cleanText(t.name);
        btn.append(label, ' ', code);
        btn.addEventListener('click', (e) => { e.preventDefault(); this._pickTechnique(t.id); });
        wrap.appendChild(btn);
        return wrap;
    }

    _drawUseStrip() {
        const doc = this.root.ownerDocument;
        const list = this.listEl;
        const uses = this.offers.filter(o => o.action === 'use' && o.ids?.techniqueId === this.useStep);
        // While a use is out the strip shows only what the Panels show (the pending label); the way back returns with the answer
        if (!uses.some(o => this._pendingOf(o))) {
            const back = this._button(doc, 'network-term-back');
            back.setAttribute('aria-label', BACK_LABEL);
            back.textContent = BACK_MARK;
            back.addEventListener('click', (e) => { e.preventDefault(); this._backToList(); });
            list.appendChild(back);
        }
        for (const offer of uses) {
            const hit = findFinding(this.view, offer.ids.findingId);
            const wrap = doc.createElement('span');
            wrap.className = 'network-term-cmd';
            wrap.setAttribute('data-technique', this.useStep);
            if (hit?.finding?.alias) wrap.setAttribute('data-finding', hit.finding.alias);
            const btn = this._button(doc, 'network-term-quick');
            btn.setAttribute('data-action', 'use');
            const title = offer.title ?? CONTROLS.use.title;
            if (title) btn.title = cleanText(title);
            const busy = this._pendingOf(offer);
            const text = doc.createElement('span');
            text.className = 'network-term-quick-label';
            text.textContent = cleanText(busy ? USING_TEXT : (hit?.finding?.alias ?? offer.ids.findingId ?? ''));
            btn.appendChild(text);
            if (busy) btn.disabled = true;
            else btn.addEventListener('click', (e) => { e.preventDefault(); this._pressUse(offer); });
            wrap.appendChild(btn);
            list.appendChild(wrap);
        }
    }

    // -----------------------------------------------------------------------------------------
    // Presses
    // -----------------------------------------------------------------------------------------

    _press(offer) {
        if (!this.ctx) return;
        this.ctx.perform(offer, offer.command ?? undefined);
        this.focusPrompt();
    }

    _pickTechnique(id) {
        this.useStep = id;
        this.input.value = cleanText(`use ${id} on `);
        this._tabAttr();
        this._drawStrip();
        this.focusPrompt();
    }

    _backToList() {
        this.useStep = null;
        this._drawStrip();
        this.focusPrompt();
    }

    _pressUse(offer) {
        if (!this.ctx) return;
        // The strip stays on the findings while the request is out, so the held one wears "Using..."; the answer ends the step
        this.input.value = '';
        this._tabAttr();
        this.ctx.perform(offer, offer.command ?? undefined);
        // A press the scene did not hold (a refused one) ends the step now; a held one ends with its answer (showResult)
        if (!this._pendingOf(offer)) { this.useStep = null; this._drawStrip(); }
        this.focusPrompt();
    }

    /** Fold or open the quick commands, by the `hidden` attribute alone. */
    fold(folded) {
        this.folded = folded === true;
        if (this.listEl) this.listEl.hidden = this.folded;
        this.toggle?.setAttribute('aria-expanded', this.folded ? 'false' : 'true');
    }

    // -----------------------------------------------------------------------------------------
    // The prompt
    // -----------------------------------------------------------------------------------------

    _tabAttr() {
        if (!this.input) return;
        if (this.input.value !== '') this.input.setAttribute('data-own-tab-cycle', '');
        else this.input.removeAttribute('data-own-tab-cycle');
    }

    _soft(el) {
        if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' });
    }

    focusPrompt() {
        if (!this.input) return;
        this.input.focus?.();
        this._soft(this.input);
    }

    _onKey(e) {
        if (e.key === 'ArrowUp') { e.preventDefault(); this._walk(-1); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); this._walk(1); return; }
        if (e.key === 'Tab' && this.input.value !== '' && !e.shiftKey) {
            e.preventDefault();
            const out = complete(this.input.value, this.offers, this.view, this.mode);
            this.input.value = cleanText(out.completed);
            this._tabAttr();
        }
    }

    /** Up (-1) and down (1) through the history; down past the newest restores what was being typed. */
    _walk(step) {
        if (!this.history.length) return;
        if (this.historyAt === null) {
            if (step > 0) return;
            this.draft = this.input.value;
            this.historyAt = this.history.length - 1;
        } else {
            const next = this.historyAt + step;
            if (next < 0) return;
            if (next >= this.history.length) {
                this.historyAt = null;
                this.input.value = this.draft;
                this._tabAttr();
                return;
            }
            this.historyAt = next;
        }
        this.input.value = this.history[this.historyAt];
        this._tabAttr();
    }

    _remember(text) {
        if (this.history[this.history.length - 1] !== text) this.history.push(text);
        while (this.history.length > HISTORY_MAX) this.history.shift();
        this.historyAt = null;
        this.draft = '';
    }

    _echo(text) {
        let mark = '$';
        try { mark = promptMark(this.mode, this.view || {}); } catch (e) { /* the shell mark stands */ }
        return PROMPT_AT_START.test(text) ? [span(text)] : [span(`${mark} `, 'prompt'), span(text)];
    }

    /** Enter: an empty prompt does nothing; otherwise the line is read and acted on. */
    _enter() {
        const text = this.input.value;
        if (text.trim() === '') return;
        this._remember(text);
        this.input.value = '';
        this._tabAttr();
        const result = parse(text, this.offers, this.view, this.mode);
        const log = this._log(true);
        const before = this.mode;
        const put = (spans) => { if (log) appendLine(log, spans); };
        const putText = (t, cls) => put([span(t, cls)]);
        const logLocal = (r) => {
            if (r.mode) this.mode = { ...r.mode };
            for (const l of localLines(r, this.view, this.mode, this.scene)) put(l);
        };

        if (result.kind === 'offer') {
            // A line with earlier local output: the echo comes first, so the scene is handed an empty echo
            const lead = (result.before && result.before.length) || (result.notes && result.notes.length);
            if (lead) put(this._echo(text));
            for (const r of (result.before || [])) logLocal(r);
            for (const n of (result.notes || [])) putText(n, 'note');
            if (result.mode) this.mode = { ...result.mode };
            this._drawMark();
            this._syncLog();
            // An echo in the framework console carries its mark, so the scene's log line reads as typed there
            const echo = before.prompt === 'msf' && !PROMPT_AT_START.test(text) ? `${promptMark(before, this.view || {})} ${text}` : text;
            if (this.ctx) this.ctx.perform(result.offer, lead ? '' : echo);
            this.focusPrompt();
            return;
        }

        put(this._echo(text));
        if (result.kind === 'message') {
            for (const l of (result.lines || [])) putText(l);
        } else if (result.kind === 'local') {
            for (const r of (result.before || [])) logLocal(r);
            this._local(result, logLocal);
        }
        this._drawMark();
        this._syncLog();
        this.focusPrompt();
    }

    _local(result, logLocal) {
        switch (result.name) {
            case 'clear': this._clear(); return;
            case 'panels': this.ctx?.requestSkin('gui'); return;
            case 'exit':
                if (result.mode) this.mode = { ...result.mode };
                else this.ctx?.requestClose();
                return;
            case 'back':
                if (result.mode) this.mode = { ...result.mode };
                return;
            default: logLocal(result);
        }
    }

    /** `clear`: the screen empties; the log keeps its lines (a later skin switch draws from here on). */
    _clear() {
        const log = this._log(false);
        this._cleared = log && log.lines.length ? log.lines[log.lines.length - 1] : null;
        this._drawn = [];
        this.logEl.textContent = '';
    }
}
