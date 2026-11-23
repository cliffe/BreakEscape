/**
 * OpsLogMinigame: the viewer for an in-game log terminal (object type ops_log_terminal).
 * Plan: docs/achitechture/OPS_LOG_ROWS_PLAN.md 5.2, 6, 7.
 *
 * Reads GET /log_rows through ApiClient.logRows(objectId, { rev, signal, foothold|from }) and
 * shows the rows the server built. Every cell goes in through textContent; no row is ever
 * tinted or marked. No flag button yet: the anomaly flow is stage L2b.
 *
 * The reader's id is sprite.scenarioData.id (never sprite.objectId, which is a throwaway when
 * the terminal is opened from a desktop). The route the screen was reached by arrives as
 * sprite.sourceRoute ({ foothold } or { from }).
 */

import { MinigameScene } from '../framework/base-minigame.js';
import { ApiClient } from '../../api-client.js';
import {
    COLUMNS, TIME_RANGES, EMPTY_FILTERS, buildFilterOptions, applyFilters, cellText,
    countText, detailFields, cleanRows
} from './ops-log-rows.js';

// Stylesheet (the page's show.html.erb is not edited by this stage)
if (typeof document !== 'undefined' && document.head && !document.getElementById('ops-log-css')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/break_escape/css/ops-log-minigame.css';
    link.id = 'ops-log-css';
    document.head.appendChild(link);
}

// Last answer per reader and route, so a reopen sends its rev and an unchanged answer keeps the rows
const answerCache = new Map();
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
        this._cacheKey = `${this._objectId}|${this._route?.foothold || ''}|${this._route?.from || ''}`;

        this._state = 'loading';          // 'loading' | 'ready' | 'denied'
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
            this._state = 'ready';
        }
        this._render();
        this._load();
    }

    cleanup() {
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
            this._deny();
            return;
        }
        if (epoch !== this._epoch) return;          // a stale answer never overwrites a newer one
        if (!answer || typeof answer !== 'object') { this._deny(); return; }
        if (answer.unchanged === true && this._state === 'ready') {
            this._rev = answer.rev || this._rev;
        } else if (Array.isArray(answer.rows)) {
            this._rows = cleanRows(answer.rows);
            this._title = typeof answer.title === 'string' ? answer.title : '';
            this._rev = typeof answer.rev === 'string' ? answer.rev : null;
            this._state = 'ready';
            answerCache.set(this._cacheKey, { rows: this._rows, title: this._title, rev: this._rev });
            if (this._selectedId && !this._rows.some(r => r.id === this._selectedId)) this._selectedId = null;
        } else {
            this._deny();
            return;
        }
        this._render();
    }

    _deny() {
        answerCache.delete(this._cacheKey);
        this._rows = [];
        this._title = '';
        this._rev = null;
        this._selectedId = null;
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
        const status = this._el('div', 'ol-status', { 'data-ops-log': 'status' });
        for (const n of [caption, filters, tableWrap, detail, status]) wrap.appendChild(n);
        c.appendChild(wrap);
        Object.assign(this._dom, { wrap, caption, filters, tableWrap, detail, status });
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

    _renderFilters() {
        const host = this._dom.filters;
        host.textContent = '';
        if (this._state !== 'ready') return;
        const opts = buildFilterOptions(this._rows);
        const add = (key, label, values) => {
            const wrap = this._el('label', 'ol-filter');
            const name = this._el('span', 'ol-filter-label');
            name.textContent = label;
            const sel = this._el('select', 'ol-filter-input', { 'data-filter': key, 'aria-label': `Filter by ${label}` });
            const all = this._el('option');
            all.value = '';
            all.textContent = 'ALL';
            sel.appendChild(all);
            for (const v of values) {
                const o = this._el('option');
                o.value = v.value ?? v;
                o.textContent = v.label ?? v;
                sel.appendChild(o);
            }
            sel.value = this._filters[key];
            sel.addEventListener('change', () => { this._filters[key] = sel.value; this._renderTable(); this._renderDetail(); this._renderStatus(); });
            wrap.appendChild(name);
            wrap.appendChild(sel);
            host.appendChild(wrap);
        };
        add('time', 'TIME', TIME_RANGES.map(r => ({ value: r.id, label: r.label })));
        add('event', 'EVENT', opts.event);
        const who = this._el('label', 'ol-filter');
        const whoName = this._el('span', 'ol-filter-label');
        whoName.textContent = 'IDENTITY';
        const input = this._el('input', 'ol-filter-input', { 'data-filter': 'as', type: 'text', maxlength: '32', 'aria-label': 'Filter by IDENTITY' });
        input.value = this._filters.as;
        input.addEventListener('input', () => { this._filters.as = input.value; this._renderTable(); this._renderDetail(); this._renderStatus(); });
        who.appendChild(whoName);
        who.appendChild(input);
        host.appendChild(who);
        add('where', 'LOCATION', opts.where);
        add('result', 'RESULT', opts.result);
    }

    _visibleRows() {
        return applyFilters(this._rows, this._filters, this._clock);
    }

    _renderTable() {
        const host = this._dom.tableWrap;
        host.textContent = '';
        const table = this._el('table', 'ol-table lf-log-table', { 'data-ops-log': 'table' });
        const thead = this._el('thead');
        const hr = this._el('tr');
        for (const col of COLUMNS) {
            const th = this._el('th', 'ol-th', { 'data-col': col.key, scope: 'col' });
            th.textContent = col.label;
            hr.appendChild(th);
        }
        thead.appendChild(hr);
        table.appendChild(thead);
        const tbody = this._el('tbody');
        if (this._state !== 'ready') {
            tbody.appendChild(this._messageRow(this._state === 'denied' ? 'NO ACCESS' : 'LOADING', this._state));
        } else {
            const rows = this._visibleRows();
            if (rows.length === 0) tbody.appendChild(this._messageRow(this._rows.length ? 'NO MATCHING ROWS' : 'NO ROWS', 'empty'));
            for (const row of rows) tbody.appendChild(this._rowEl(row));
        }
        table.appendChild(tbody);
        host.appendChild(table);
    }

    _messageRow(message, kind) {
        const tr = this._el('tr', 'ol-row ol-message', { 'data-state': kind });
        const td = this._el('td', 'ol-cell ol-message-cell', { colspan: String(COLUMNS.length) });
        td.textContent = message;
        tr.appendChild(td);
        return tr;
    }

    _rowEl(row) {
        const selected = row.id === this._selectedId;
        const tr = this._el('tr', `ol-row lf-log-row${selected ? ' ol-row-selected' : ''}`, {
            'data-row-id': row.id,
            tabindex: '0',
            'aria-selected': selected ? 'true' : 'false'
        });
        for (const col of COLUMNS) {
            const td = this._el('td', 'ol-cell', { 'data-col': col.key });
            td.textContent = cellText(row, col.key, this._clock);
            tr.appendChild(td);
        }
        const pick = () => this._select(row.id);
        tr.addEventListener('click', pick);
        tr.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                if (typeof e.preventDefault === 'function') e.preventDefault();
                pick();
            }
        });
        return tr;
    }

    _select(id) {
        this._selectedId = id;
        this._renderTable();
        this._renderDetail();
        // Focus stays on the chosen row for the keyboard
        const el = this._dom.tableWrap.querySelector?.(`[data-row-id="${id}"]`);
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
    }

    _renderStatus() {
        const host = this._dom.status;
        host.textContent = '';
        const count = this._el('span', 'ol-count', { 'data-ops-log': 'count' });
        count.textContent = this._state === 'ready' ? countText(this._visibleRows().length, this._rows.length) : '';
        host.appendChild(count);
        const btn = this._el('button', 'ol-btn', { type: 'button', 'data-action': 'refresh' });
        btn.textContent = 'REFRESH';
        btn.addEventListener('click', () => this._load());
        host.appendChild(btn);
    }
}
