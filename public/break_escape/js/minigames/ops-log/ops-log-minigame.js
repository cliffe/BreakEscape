/**
 * OpsLogMinigame: the viewer for an in-game log terminal (object type ops_log_terminal).
 * Plan: docs/achitechture/OPS_LOG_ROWS_PLAN.md 5.2, 6, 7.
 *
 * Reads GET /log_rows through ApiClient.logRows(objectId, { rev, signal, foothold|from }) and
 * shows the rows the server built. Every cell goes in through textContent; no row is ever
 * tinted or marked before a right flag. A reader with an anomaly (minigameData.anomaly.rowId)
 * offers a flag control on the selected row's detail: FLAG, then CONFIRM or CANCEL. The flag is
 * checked here, best effort, as log-filter checks its own: the picked row's id against
 * anomaly.rowId, then flagActions and completionActions run once through the same
 * global-setting path (its _executeActions). "Already flagged" is read from the action's global
 * (the first set_global true of flagActions, else of completionActions), which the normal sync
 * saves, so a reopened terminal after a reload shows it with no state of its own (L2b).
 *
 * The reader's id is sprite.scenarioData.id (never sprite.objectId, which is a throwaway when
 * the terminal is opened from a desktop). The route the screen was reached by arrives as
 * sprite.sourceRoute ({ foothold } or { from }).
 */

import { MinigameScene } from '../framework/base-minigame.js';
import { ApiClient } from '../../api-client.js';
import {
    COLUMNS, TIME_RANGES, EMPTY_FILTERS, buildFilterOptions, applyFilters, cellText,
    countText, detailFields, cleanRows, pruneFilters
} from './ops-log-rows.js';

// Stylesheet: the page links it with a version stamp (show.html.erb, id ops-log-css); this is
// only the fallback for a page that does not
if (typeof document !== 'undefined' && document.head && !document.getElementById('ops-log-css')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/break_escape/css/ops-log-minigame.css';
    link.id = 'ops-log-css';
    document.head.appendChild(link);
}

// Last answer per reader and route, so a reopen sends its rev and an unchanged answer keeps the rows
const answerCache = new Map();
const FLAG_LABEL = 'FLAG AS ANOMALY';
export function clearOpsLogCache() { answerCache.clear(); }

export class OpsLogMinigame extends MinigameScene {
    static consoleWindow = true;
    static consoleWindowFill = true;

    consoleTitle() {
        return this._frameTitle;
    }

    constructor(container, params) {
        super(container, params);
        const sd = params?.sprite?.scenarioData || {};
        this._objectId = typeof sd.id === 'string' ? sd.id : '';
        this._frameTitle = sd.name || params?.title || 'Log terminal';
        const route = params?.sprite?.sourceRoute;
        this._route = route && typeof route === 'object' ? route : null;
        const data = sd.minigameData && typeof sd.minigameData === 'object' ? sd.minigameData : {};
        this._flaggable = !!data.anomaly && typeof data.anomaly === 'object';
        this._anomalyId = this._flaggable && typeof data.anomaly.rowId === 'string' ? data.anomaly.rowId : null;
        this._flagActions = Array.isArray(data.flagActions) ? data.flagActions : [];
        this._completionActions = Array.isArray(data.completionActions) ? data.completionActions : [];
        const doneAction = [...this._flagActions, ...this._completionActions]
            .find(a => a && a.type === 'set_global' && typeof a.key === 'string' && a.value === true);
        this._doneGlobal = doneAction ? doneAction.key : null;
        this._flagLabel = typeof data.flagActionLabel === 'string' && data.flagActionLabel.trim() && data.flagActionLabel.length <= 40
            ? data.flagActionLabel.trim() : FLAG_LABEL;
        this._flagState = 'idle';         // 'idle' | 'confirm' | 'wrong'
        this._flaggedId = null;           // the anomaly's row, set only by a right flag or a set done-global
        // A reopen after a reload: the action's global is already true, so the flag is done
        if (this._flaggable && this._anomalyId && this._doneGlobal && window.gameState?.globalVariables?.[this._doneGlobal] === true) {
            this._flaggedId = this._anomalyId;
            // Only the task entries run again (a no-op for a done task), so a task whose request once failed still completes
            for (const action of [...this._flagActions, ...this._completionActions]) {
                if (action && action.type === 'complete_task') window.objectivesManager?.completeTask(action.taskId);
            }
        }
        this._closed = false;
        this._cacheKey = `${this._objectId}|${this._route?.foothold || ''}|${this._route?.from || ''}|${this._route?.relay === true ? 'relay' : ''}`;

        this._state = 'loading';          // 'loading' | 'ready' | 'denied' | 'nosignal'
        this._note = '';                  // a failed refresh that was not a refusal (rows stay held)
        this._rowEls = new Map();         // row id -> its tr, for the visible rows
        this._rowOrder = [];              // the visible rows' ids, in order (roving tabindex)
        this._selects = {};               // filter key -> its control, built once
        this._optionSig = {};
        this._rows = [];
        this._title = '';
        this._rev = null;
        this._filters = { ...EMPTY_FILTERS };
        this._selectedId = null;
        this._epoch = 0;
        this._abort = null;
        this._dom = {};
    }

    // Lifecycle

    start() {
        super.start();
        this._renderLayout();
        const cached = answerCache.get(this._cacheKey);
        if (cached) {
            this._rows = cached.rows;
            this._title = cached.title;
            this._rev = cached.rev;
            if (cached.flaggedId) this._flaggedId = cached.flaggedId;
            this._state = 'ready';
        }
        this._render();
        this._load();
    }

    cleanup() {
        this._closed = true;
        this._epoch += 1;
        if (this._abort) { try { this._abort.abort(); } catch (e) { /* ignore */ } }
        super.cleanup();
    }

    get _clock() { return window.gameClock || null; }

    // Fetching

    async _load() {
        if (!this._objectId) { this._deny(); return; }
        const epoch = ++this._epoch;
        if (this._abort) { try { this._abort.abort(); } catch (e) { /* ignore */ } }
        this._abort = typeof AbortController === 'function' ? new AbortController() : null;
        let answer;
        try {
            answer = await ApiClient.logRows(this._objectId, {
                rev: this._rev || undefined,
                signal: this._abort ? this._abort.signal : undefined,
                ...(this._route || {})
            });
        } catch (err) {
            if (epoch !== this._epoch) return;      // a newer fetch or a close
            // Only a refusal reads NO ACCESS; a dropped connection or a server fault keeps what is held
            if ([400, 403, 404].includes(err && err.status)) { this._deny(); return; }
            this._note = 'NO SIGNAL - REFRESH';
            if (this._state !== 'ready') this._state = 'nosignal';
            this._render();
            return;
        }
        if (epoch !== this._epoch) return;          // a stale answer never overwrites a newer one
        if (!answer || typeof answer !== 'object') { this._deny(); return; }
        if (answer.unchanged === true && this._state === 'ready') {
            // Nothing changed: the list, its scroll position and the focus are left alone
            this._rev = answer.rev || this._rev;
            if (this._note) { this._note = ''; this._renderStatus(); }
            return;
        } else if (Array.isArray(answer.rows)) {
            this._rows = cleanRows(answer.rows);
            this._title = typeof answer.title === 'string' ? answer.title : '';
            this._rev = typeof answer.rev === 'string' ? answer.rev : null;
            this._state = 'ready';
            this._note = '';
            this._cacheAnswer();
            if (this._selectedId && !this._rows.some(r => r.id === this._selectedId)) this._selectedId = null;
            // A filter whose value left the list is cleared (its select then reads ALL)
            pruneFilters(this._filters, this._rows);
        } else {
            this._deny();
            return;
        }
        this._render();
    }

    _cacheAnswer() {
        answerCache.set(this._cacheKey, { rows: this._rows, title: this._title, rev: this._rev, flaggedId: this._flaggedId });
    }

    _deny() {
        this._note = '';
        answerCache.delete(this._cacheKey);
        this._rows = [];
        this._title = '';
        this._rev = null;
        this._selectedId = null;
        this._flagState = 'idle';
        this._state = 'denied';
        this._render();
    }

    // Layout

    _el(tag, cls, attrs) {
        const el = document.createElement(tag);
        if (cls) for (const c of cls.split(' ')) if (c) el.classList.add(c);
        if (attrs) for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
        return el;
    }

    _renderLayout() {
        if (this.headerElement) this.headerElement.style.display = 'none';
        const c = this.gameContainer;
        c.innerHTML = '';
        const wrap = this._el('div', 'ol-wrapper', { 'data-ops-log': 'viewer' });
        const caption = this._el('div', 'ol-caption', { 'data-ops-log': 'caption' });
        const filters = this._el('div', 'ol-filters', { 'data-ops-log': 'filters' });
        const tableWrap = this._el('div', 'ol-table-wrap pixel-scroll', { 'data-ops-log': 'table-wrap' });
        const detail = this._el('div', 'ol-detail', { 'data-ops-log': 'detail' });
        // The status bar is built once: the REFRESH button keeps its focus across a refresh
        const status = this._el('div', 'ol-status', { 'data-ops-log': 'status' });
        const count = this._el('span', 'ol-count', { 'data-ops-log': 'count' });
        const btn = this._el('button', 'ol-btn', { type: 'button', 'data-action': 'refresh' });
        btn.textContent = 'REFRESH';
        btn.addEventListener('click', () => this._load());
        status.appendChild(count);
        status.appendChild(btn);
        for (const n of [caption, filters, tableWrap, detail, status]) wrap.appendChild(n);
        c.appendChild(wrap);
        Object.assign(this._dom, { wrap, caption, filters, tableWrap, detail, status, count });
    }

    _render() {
        const d = this._dom;
        if (!d.wrap) return;
        d.caption.textContent = this._state === 'ready' ? (this._title || '') : '';
        this._renderFilters();
        this._renderTable();
        this._renderDetail();
        this._renderStatus();
    }

    _afterFilter() { this._renderTable(); this._renderDetail(); this._renderStatus(); }

    // The filter controls are made once; a new answer only refreshes the options of the three
    // selects, so a focused control keeps its focus
    _renderFilters() {
        const host = this._dom.filters;
        if (this._state !== 'ready') {
            host.textContent = '';
            this._selects = {};
            this._optionSig = {};
            return;
        }
        if (!this._selects.time) this._buildFilters(host);
        const opts = buildFilterOptions(this._rows);
        for (const key of ['event', 'where', 'result']) this._syncOptions(key, opts[key]);
    }

    _labelled(label, control) {
        const wrap = this._el('label', 'ol-filter');
        const name = this._el('span', 'ol-filter-label');
        name.textContent = label;
        wrap.appendChild(name);
        wrap.appendChild(control);
        return wrap;
    }

    _buildFilters(host) {
        host.textContent = '';
        const select = (key, label) => {
            const sel = this._el('select', 'ol-filter-input', { 'data-filter': key, 'aria-label': `Filter by ${label}` });
            sel.addEventListener('change', () => { this._filters[key] = sel.value; this._afterFilter(); });
            this._selects[key] = sel;
            return this._labelled(label, sel);
        };
        host.appendChild(select('time', 'TIME'));
        const all = this._el('option');
        all.value = '';
        all.textContent = 'ALL';
        this._selects.time.appendChild(all);
        for (const r of TIME_RANGES) {
            const o = this._el('option');
            o.value = r.id;
            o.textContent = r.label;
            this._selects.time.appendChild(o);
        }
        this._selects.time.value = this._filters.time;
        host.appendChild(select('event', 'EVENT'));
        const input = this._el('input', 'ol-filter-input', { 'data-filter': 'as', type: 'text', maxlength: '32', 'aria-label': 'Filter by IDENTITY' });
        input.value = this._filters.as;
        input.addEventListener('input', () => { this._filters.as = input.value; this._afterFilter(); });
        host.appendChild(this._labelled('IDENTITY', input));
        host.appendChild(select('where', 'LOCATION'));
        host.appendChild(select('result', 'RESULT'));
    }

    _syncOptions(key, values) {
        const sel = this._selects[key];
        const sig = values.join('\u0001');
        if (this._optionSig[key] !== sig) {
            this._optionSig[key] = sig;
            sel.textContent = '';
            const all = this._el('option');
            all.value = '';
            all.textContent = 'ALL';
            sel.appendChild(all);
            for (const v of values) {
                const o = this._el('option');
                o.value = v;
                o.textContent = v;
                sel.appendChild(o);
            }
        }
        sel.value = this._filters[key];
    }

    _visibleRows() {
        return applyFilters(this._rows, this._filters, this._clock);
    }

    _focusedRowId() {
        const ae = typeof document !== 'undefined' ? document.activeElement : null;
        return ae && typeof ae.getAttribute === 'function' ? ae.getAttribute('data-row-id') : null;
    }

    // The table frame is made once; only its body is replaced, and the scroll position and the
    // focused row are put back
    _renderTable() {
        const host = this._dom.tableWrap;
        const scrollTop = host.scrollTop || 0;
        const focusId = this._focusedRowId();
        if (!this._tbody) {
            const table = this._el('table', 'ol-table', { 'data-ops-log': 'table', role: 'grid' });
            const thead = this._el('thead');
            const hr = this._el('tr', null, { role: 'row' });
            for (const col of COLUMNS) {
                const th = this._el('th', 'ol-th', { 'data-col': col.key, scope: 'col', role: 'columnheader' });
                th.textContent = col.label;
                hr.appendChild(th);
            }
            thead.appendChild(hr);
            table.appendChild(thead);
            this._tbody = this._el('tbody');
            table.appendChild(this._tbody);
            host.textContent = '';
            host.appendChild(table);
        }
        const tbody = this._tbody;
        tbody.textContent = '';
        this._rowEls = new Map();
        this._rowOrder = [];
        if (this._state !== 'ready') {
            const word = this._state === 'denied' ? 'NO ACCESS' : (this._state === 'nosignal' ? 'NO SIGNAL - REFRESH' : 'LOADING');
            tbody.appendChild(this._messageRow(word, this._state));
        } else {
            const rows = this._visibleRows();
            if (rows.length === 0) tbody.appendChild(this._messageRow(this._rows.length ? 'NO MATCHING ROWS' : 'NO ROWS', 'empty'));
            for (const row of rows) tbody.appendChild(this._rowEl(row));
            this._setTabStop(this._rowEls.get(this._selectedId) || this._rowEls.get(this._rowOrder[0]));
        }
        host.scrollTop = scrollTop;
        const back = focusId ? this._rowEls.get(focusId) : null;
        if (back && typeof back.focus === 'function') back.focus();
    }

    _messageRow(message, kind) {
        const tr = this._el('tr', 'ol-row ol-message', { 'data-state': kind, role: 'row' });
        const td = this._el('td', 'ol-cell ol-message-cell', { colspan: String(COLUMNS.length), role: 'gridcell' });
        td.textContent = message;
        tr.appendChild(td);
        return tr;
    }

    _rowEl(row) {
        const selected = row.id === this._selectedId;
        const flagged = row.id === this._flaggedId;
        const tr = this._el('tr', `ol-row${selected ? ' ol-row-selected' : ''}${flagged ? ' ol-row-flagged' : ''}`, {
            'data-row-id': row.id,
            ...(flagged ? { 'data-flagged': 'true' } : {}),
            role: 'row',
            tabindex: '-1',
            'aria-selected': selected ? 'true' : 'false'
        });
        for (const col of COLUMNS) {
            const td = this._el('td', 'ol-cell', { 'data-col': col.key, role: 'gridcell' });
            td.textContent = cellText(row, col.key, this._clock);
            tr.appendChild(td);
        }
        this._rowEls.set(row.id, tr);
        this._rowOrder.push(row.id);
        const pick = () => this._select(row.id);
        tr.addEventListener('click', pick);
        tr.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                if (typeof e.preventDefault === 'function') e.preventDefault();
                pick();
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                if (typeof e.preventDefault === 'function') e.preventDefault();
                const at = this._rowOrder.indexOf(row.id) + (e.key === 'ArrowDown' ? 1 : -1);
                const next = this._rowEls.get(this._rowOrder[at]);
                if (next) { this._setTabStop(next); if (typeof next.focus === 'function') next.focus(); }
            }
        });
        return tr;
    }

    // One row is in the tab order (roving tabindex), so REFRESH is one Tab past the table
    _setTabStop(tr) {
        for (const el of this._rowEls.values()) el.setAttribute('tabindex', el === tr ? '0' : '-1');
    }

    _mark(tr, on) {
        if (!tr) return;
        if (on) tr.classList.add('ol-row-selected'); else tr.classList.remove('ol-row-selected');
        tr.setAttribute('aria-selected', on ? 'true' : 'false');
    }

    // A click or Enter moves the mark between the two existing rows; the table is not rebuilt
    _select(id) {
        this._mark(this._rowEls.get(this._selectedId), false);
        if (id !== this._selectedId) this._flagState = 'idle';
        this._selectedId = id;
        const el = this._rowEls.get(id);
        this._mark(el, true);
        this._setTabStop(el);
        this._renderDetail();
        if (el && typeof el.focus === 'function') el.focus();
    }

    _renderDetail() {
        const host = this._dom.detail;
        host.textContent = '';
        const row = this._state === 'ready' ? this._rows.find(r => r.id === this._selectedId) : null;
        if (!row) { host.classList.add('ol-hidden'); return; }
        host.classList.remove('ol-hidden');
        const head = this._el('div', 'ol-detail-head');
        head.textContent = 'ROW DETAIL';
        host.appendChild(head);
        const grid = this._el('div', 'ol-detail-grid', { 'data-ops-log': 'detail-grid' });
        for (const [label, value] of detailFields(row, this._clock)) {
            const l = this._el('div', 'ol-detail-label');
            l.textContent = label;
            const v = this._el('div', 'ol-detail-value', { 'data-field': label });
            v.textContent = value;
            grid.appendChild(l);
            grid.appendChild(v);
        }
        host.appendChild(grid);
        this._renderFlag(host, row);
    }

    // The flag control (L2b). It is offered on whatever row is selected and marks nothing until a right pick.
    _renderFlag(host, row) {
        if (!this._flaggable) return;
        const box = this._el('div', 'ol-flag', { 'data-ops-log': 'flag' });
        const note = (word, kind) => {
            const n = this._el('div', `ol-flag-note ol-flag-${kind}`, { 'data-ops-log': 'flag-note', 'data-state': kind, role: 'status' });
            n.textContent = word;
            box.appendChild(n);
        };
        const button = (action, word, onClick) => {
            const b = this._el('button', 'ol-btn', { type: 'button', 'data-action': action });
            b.textContent = word;
            b.addEventListener('click', onClick);
            box.appendChild(b);
            return b;
        };
        if (this._flaggedId) {
            // Once flagged there is nothing more to offer
            if (row.id === this._flaggedId) note('FLAGGED', 'done');
            else return;
        } else if (this._flagState === 'confirm') {
            note('FLAG THIS ROW AS THE ANOMALY?', 'confirm');
            button('flag-confirm', 'CONFIRM', () => this._confirmFlag(row.id));
            button('flag-cancel', 'CANCEL', () => { this._flagState = 'idle'; this._renderDetail(); this._focusFlag('flag'); });
        } else {
            if (this._flagState === 'wrong') note('NOT THIS ONE', 'wrong');
            button('flag', this._flagLabel, () => { this._flagState = 'confirm'; this._renderDetail(); this._focusFlag('flag-confirm'); });
        }
        host.appendChild(box);
    }

    _focusFlag(action) {
        const b = this._dom.detail.querySelector(`[data-action="${action}"]`);
        if (b && typeof b.focus === 'function') b.focus();
    }

    // The check is local: the picked row's id against anomaly.rowId. A wrong pick marks nothing and runs
    // nothing; a right one runs flagActions then completionActions once and marks the row.
    _confirmFlag(rowId) {
        if (this._flaggedId || this._closed) return;
        if (!this._anomalyId || rowId !== this._anomalyId) {
            this._flagState = 'wrong';
            this._renderDetail();
            this._focusFlag('flag');
            return;
        }
        this._flaggedId = rowId;
        this._flagState = 'idle';
        this._cacheAnswer();
        this._runActions(this._flagActions);
        this._runActions(this._completionActions);
        this._renderTable();
        this._renderDetail();
        // Focus stays on the flagged row (the confirm button it replaced is gone)
        const tr = this._rowEls.get(rowId);
        if (tr && typeof tr.focus === 'function') tr.focus();
    }

    // The same global-setting path log-filter uses (its _executeActions): set_global and complete_task
    _runActions(actions) {
        if (!Array.isArray(actions)) return;
        for (const action of actions) {
            if (!action || typeof action !== 'object') continue;
            if (action.type === 'set_global' && typeof action.key === 'string') {
                this._setGlobalAndNotify(action.key, action.value);
            } else if (action.type === 'complete_task') {
                window.objectivesManager?.completeTask(action.taskId);
            }
        }
    }

    _setGlobalAndNotify(name, value) {
        if (window.npcManager?.setGlobalVariable) {
            window.npcManager.setGlobalVariable(name, value);
            return;
        }
        const oldValue = window.gameState?.globalVariables?.[name];
        if (window.gameState?.globalVariables) window.gameState.globalVariables[name] = value;
        window.npcConversationStateManager?.broadcastGlobalVariableChange(name, value, null);
        window.eventDispatcher?.emit(`global_variable_changed:${name}`, { name, value, oldValue });
    }

    _renderStatus() {
        const base = this._state === 'ready' ? countText(this._visibleRows().length, this._rows.length) : '';
        this._dom.count.textContent = this._note && this._state === 'ready' ? `${base}  ${this._note}` : base;
    }
}
