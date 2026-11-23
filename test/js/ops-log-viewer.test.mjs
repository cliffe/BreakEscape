// Ops log viewer (OPS_LOG_ROWS_PLAN.md 5.2, 7, 11): the ops-log minigame, its row helpers and the
// paths a reader is opened through. Run with: bin/test-js test/js/ops-log-viewer.test.mjs
// Harness copy list: ops-log/ops-log-rows.js and ops-log/ops-log-minigame.js, with the base class
// and ApiClient replaced by stubs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const read = (p) => readFileSync(join(js, p), 'utf8');

class FakeEl {
    constructor(tag) {
        this.tag = tag; this.children = []; this.parent = null; this.listeners = {}; this.attrs = {};
        this.classes = new Set(); this.style = {}; this.scrollTop = 0; this._text = ''; this.value = ''; this.innerHTMLSets = [];
        const self = this;
        this.classList = {
            add: (...c) => c.forEach(x => self.classes.add(x)),
            remove: (...c) => c.forEach(x => self.classes.delete(x)),
            contains: (c) => self.classes.has(c)
        };
    }
    set className(v) { this.classes = new Set(String(v).split(' ').filter(Boolean)); }
    set textContent(v) { this._text = String(v); this.children = []; this.scrollTop = 0; /* a browser resets the scroll of an emptied box */ }
    get textContent() { return this._text + this.children.map(c => c.textContent).join(''); }
    set innerHTML(v) { this.innerHTMLSets.push(v); this.children = []; this._text = ''; }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    getAttribute(k) { return this.attrs[k] ?? null; }
    focus() { globalThis.__focused = this; }
    appendChild(c) { c.parent = this; this.children.push(c); return c; }
    addEventListener(n, cb) { (this.listeners[n] ||= []).push(cb); }
    fire(n, ev = {}) { (this.listeners[n] || []).forEach(cb => cb({ preventDefault() {}, ...ev })); }
    click() { this.fire('click'); }
    matches(sel) {
        const a = /^\[([\w-]+)="([^"]*)"\]$/.exec(sel);
        if (a) return this.attrs[a[1]] === a[2];
        if (sel.startsWith('.')) return this.classes.has(sel.slice(1));
        return this.tag === sel;
    }
    all(sel) { const out = []; const walk = (n) => n.children.forEach(c => { if (c.matches(sel)) out.push(c); walk(c); }); walk(this); return out; }
    querySelectorAll(sel) { return this.all(sel); }
    querySelector(sel) { return this.all(sel)[0] || null; }
}
globalThis.document = { createElement: (t) => new FakeEl(t), head: null, getElementById: () => null, get activeElement() { return globalThis.__focused || null; } };
globalThis.window = { gameClock: null };

// A clock that prints like game-clock.js: day-less "HH:MM" or "Tue 07:42"
const pad2 = (n) => String(n).padStart(2, '0');
const clockWith = (day) => ({
    timeParts: (ms) => { const t = Math.floor(ms / 60000); return { day, hours: Math.floor(t / 60) % 24, minutes: t % 60 }; },
    formatStamp(ms) { const p = this.timeParts(ms); const hm = `${pad2(p.hours)}:${pad2(p.minutes)}`; return p.day ? `${p.day} ${hm}` : hm; }
});

// Scripted ApiClient: each call takes the next queued answer (or throws it when it is an Error)
const calls = [];
let queue = [];
globalThis.__api = { logRows: async (id, opts) => { calls.push({ id, opts }); const a = queue.shift(); if (a instanceof Error) throw a; return a; } };

const dir = mkdtempSync(join(tmpdir(), 'ops-log-viewer-'));
writeFileSync(join(dir, 'ops-log-rows.js'), read('minigames/ops-log/ops-log-rows.js'));
writeFileSync(join(dir, 'base.mjs'), `export class MinigameScene { constructor(c, p) { this.container = c; this.params = p; this.gameContainer = c; } start() {} cleanup() {} }`);
writeFileSync(join(dir, 'api.mjs'), `export const ApiClient = globalThis.__api;`);
writeFileSync(join(dir, 'ops-log-minigame.js'), read('minigames/ops-log/ops-log-minigame.js')
    .split(`'../framework/base-minigame.js'`).join(`'./base.mjs'`)
    .split(`'../../api-client.js'`).join(`'./api.mjs'`));
const rows = await import(pathToFileURL(join(dir, 'ops-log-rows.js')).href);
const { OpsLogMinigame, clearOpsLogCache } = await import(pathToFileURL(join(dir, 'ops-log-minigame.js')).href);

const play = (id, ms, extra = {}) => ({ id, elapsedMs: ms, event: 'SIGN_IN', as: 'j.price', where: 'Reception PC', result: 'OK', detail: '-', ...extra });
const seed = (id, at, extra = {}) => ({ id, at, event: 'BADGE', as: 'Maya Okafor', where: 'Lobby door', result: 'OK', detail: '-', ...extra });
const H = 3600000;
const answer = (rowList, extra = {}) => ({ rev: 'abc123', title: 'Door controller', rows: rowList, ...extra });

function open({ answers, data = {}, sprite = {}, clock = clockWith('Tue') } = {}) {
    queue = answers;
    calls.length = 0;
    window.gameClock = clock;
    const m = new OpsLogMinigame(new FakeEl('div'), { sprite: { scenarioData: { id: 'security_log_pc', type: 'ops_log_terminal', name: 'Security office PC', minigameData: { logSource: 'door_controller', ...data } }, ...sprite } });
    m.start();
    return m;
}
const settle = () => new Promise(r => setTimeout(r, 0));
const root = (m) => m.gameContainer;
const bodyRows = (m) => root(m).all('tr').filter(r => r.attrs['data-row-id']);
const cells = (tr) => tr.all('td').map(td => td.textContent);
const filterEl = (m, k) => root(m).all('select').concat(root(m).all('input')).find(e => e.attrs['data-filter'] === k);
const choose = (m, k, v) => { const e = filterEl(m, k); e.value = v; e.fire(k === 'as' ? 'input' : 'change'); };

test('columns: TIME, EVENT, IDENTITY, LOCATION, RESULT, DETAIL, and the cells read in that order', async () => {
    clearOpsLogCache();
    const m = await open({ answers: [answer([play('a1', 7 * H + 42 * 60000, { detail: 'method: password' })])] });
    await settle();
    assert.deepEqual(root(m).all('th').map(t => t.textContent), ['TIME', 'EVENT', 'IDENTITY', 'LOCATION', 'RESULT', 'DETAIL']);
    assert.deepEqual(cells(bodyRows(m)[0]), ['Tue 07:42', 'SIGN_IN', 'j.price', 'Reception PC', 'OK', 'method: password']);
    assert.equal(root(m).querySelector('.ol-caption').textContent, 'Door controller');
    assert.equal(m.consoleTitle(), 'Security office PC');
    assert.equal(OpsLogMinigame.consoleWindow, true);
});

test('LOADING first, then rows; a refusal shows NO ACCESS and nothing else', async () => {
    clearOpsLogCache();
    const m = open({ answers: [answer([play('a1', H)])] });
    assert.equal(root(m).querySelector('.ol-message').textContent, 'LOADING');
    assert.equal(bodyRows(m).length, 0);
    await settle();
    assert.equal(bodyRows(m).length, 1);

    clearOpsLogCache();
    const err = Object.assign(new Error('API Error: 404'), { status: 404 });
    const d = await open({ answers: [err] });
    await settle();
    assert.equal(root(d).querySelector('.ol-message').textContent, 'NO ACCESS');
    assert.equal(bodyRows(d).length, 0);
    assert.equal(root(d).all('select').length, 0, 'no filters on a refusal');
    assert.equal(root(d).querySelector('.ol-caption').textContent, '');
    assert.equal(root(d).querySelector('[data-ops-log="count"]').textContent, '');
});

test('unchanged keeps the rows; a reopen sends the last rev; REFRESH fetches again', async () => {
    clearOpsLogCache();
    const m = await open({ answers: [answer([play('a1', H), play('a2', 2 * H)])] });
    await settle();
    assert.equal(calls[0].opts.rev, undefined);
    queue = [{ rev: 'abc123', unchanged: true }];
    root(m).querySelector('[data-action="refresh"]').click();
    await settle();
    assert.equal(calls[1].opts.rev, 'abc123');
    assert.equal(bodyRows(m).length, 2);
    m.cleanup();
    const again = await open({ answers: [{ rev: 'abc123', unchanged: true }] });
    assert.equal(bodyRows(again).length, 2, 'the cached rows show at once');
    await settle();
    assert.equal(calls[0].opts.rev, 'abc123');
    assert.equal(bodyRows(again).length, 2);
});

test('filters are built from the rows present; TIME ranges read HH:MM and Tue 07:42 stamps', async () => {
    clearOpsLogCache();
    const list = [
        seed('s1', 'Mon 23:58'),
        seed('s2', '07:12', { event: 'SIGN_IN_FAIL', result: 'FAIL', where: 'Reception PC', as: 'j.price' }),
        play('a1', 13 * H, { event: 'LOCKOUT', result: 'BLOCKED' }),
        play('a2', 19 * H + 5 * 60000, { where: 'Server room' })
    ];
    const m = await open({ answers: [answer(list)] });
    await settle();
    const opts = (k) => filterEl(m, k).all('option').map(o => o.value);
    assert.deepEqual(opts('event'), ['', 'BADGE', 'SIGN_IN_FAIL', 'LOCKOUT', 'SIGN_IN']);
    assert.deepEqual(opts('result'), ['', 'OK', 'FAIL', 'BLOCKED']);
    assert.deepEqual(opts('where'), ['', 'Lobby door', 'Reception PC', 'Server room']);
    assert.equal(filterEl(m, 'as').tag, 'input');
    assert.deepEqual(opts('time'), ['', 'night', 'morning', 'afternoon', 'evening']);

    const ids = () => bodyRows(m).map(r => r.attrs['data-row-id']);
    choose(m, 'time', 'evening'); assert.deepEqual(ids(), ['s1', 'a2']);     // Mon 23:58 and Tue 19:05
    choose(m, 'time', 'morning'); assert.deepEqual(ids(), ['s2']);           // 07:12
    choose(m, 'time', 'afternoon'); assert.deepEqual(ids(), ['a1']);
    choose(m, 'time', '');
    choose(m, 'event', 'LOCKOUT'); assert.deepEqual(ids(), ['a1']);
    choose(m, 'event', '');
    choose(m, 'as', 'J.PR'); assert.deepEqual(ids(), ['s2', 'a1', 'a2']);    // text, case-insensitive
    choose(m, 'where', 'Server room'); assert.deepEqual(ids(), ['a2']);
    choose(m, 'as', ''); choose(m, 'where', ''); choose(m, 'result', 'FAIL'); assert.deepEqual(ids(), ['s2']);
    choose(m, 'event', 'LOCKOUT'); assert.equal(root(m).querySelector('.ol-message').textContent, 'NO MATCHING ROWS');
    assert.match(root(m).querySelector('[data-ops-log="count"]').textContent, /^0 of 4 rows$/);
});

test('time helpers: a day-less clock, parse of authored stamps, hour 24 never leaks', () => {
    assert.deepEqual(rows.parseAt('Mon 23:58'), { day: 'Mon', hours: 23, minutes: 58 });
    assert.deepEqual(rows.parseAt('07:12'), { day: '', hours: 7, minutes: 12 });
    assert.equal(rows.parseAt('25:00'), null);
    assert.equal(rows.parseAt('soon'), null);
    assert.equal(rows.timeRangeOf(seed('s', 'nonsense'), null), null);
    assert.equal(rows.timeText(play('p', 7 * H + 42 * 60000), clockWith('')), '07:42');
    assert.equal(rows.rowHour(play('p', 31 * H), null), 7, 'no clock: wraps to the day');
});

test('selection keys on the row id and survives a refresh; a row that is gone clears it', async () => {
    clearOpsLogCache();
    const m = await open({ answers: [answer([play('a1', H), play('a2', 2 * H)])] });
    await settle();
    bodyRows(m)[1].click();
    assert.equal(bodyRows(m)[1].attrs['aria-selected'], 'true');
    assert.equal(root(m).querySelector('[data-ops-log="detail-grid"]').all('div').filter(d => d.attrs['data-field'] === 'EVENT')[0].textContent, 'SIGN_IN');
    // a refresh that puts a new row first keeps a2 selected
    queue = [answer([play('a0', 0), play('a1', H), play('a2', 2 * H)], { rev: 'def456' })];
    root(m).querySelector('[data-action="refresh"]').click();
    await settle();
    const sel = bodyRows(m).filter(r => r.attrs['aria-selected'] === 'true');
    assert.deepEqual(sel.map(r => r.attrs['data-row-id']), ['a2']);
    queue = [answer([play('a0', 0)], { rev: 'zzz999' })];
    root(m).querySelector('[data-action="refresh"]').click();
    await settle();
    assert.equal(bodyRows(m).filter(r => r.attrs['aria-selected'] === 'true').length, 0);
    assert.ok(root(m).querySelector('.ol-detail').classes.has('ol-hidden'));
});

test('keyboard: rows take focus and Enter or Space select them', async () => {
    clearOpsLogCache();
    const m = await open({ answers: [answer([play('a1', H)])] });
    await settle();
    const tr = bodyRows(m)[0];
    assert.equal(tr.attrs.tabindex, '0');
    tr.fire('keydown', { key: 'Enter' });
    assert.equal(bodyRows(m)[0].attrs['aria-selected'], 'true');
    assert.equal(globalThis.__focused.attrs['data-row-id'], 'a1');
    assert.equal(root(m).querySelector('table').attrs.role, 'grid');
});

test('keyboard (m6): one row is in the tab order and Up and Down move it', async () => {
    clearOpsLogCache();
    const m = await open({ answers: [answer([play('a1', H), play('a2', 2 * H), play('a3', 3 * H)])] });
    await settle();
    const tabs = () => bodyRows(m).map(r => r.attrs.tabindex).join();
    assert.equal(tabs(), '0,-1,-1');
    bodyRows(m)[0].fire('keydown', { key: 'ArrowDown' });
    assert.equal(tabs(), '-1,0,-1');
    assert.equal(globalThis.__focused.attrs['data-row-id'], 'a2');
    bodyRows(m)[1].fire('keydown', { key: 'ArrowUp' });
    bodyRows(m)[0].fire('keydown', { key: 'ArrowUp' });
    assert.equal(tabs(), '0,-1,-1', 'Up from the first row stays on it');
    bodyRows(m)[2].click();
    assert.equal(tabs(), '-1,-1,0', 'the selected row is the tab stop, also after a refresh');
});

const wrapOf = (m) => root(m).querySelector('[data-ops-log="table-wrap"]');
const refreshBtn = (m) => root(m).querySelector('[data-action="refresh"]');

test('F3: an unchanged answer and a row click do not rebuild the list; scroll, focus and REFRESH are kept', async () => {
    clearOpsLogCache();
    const m = await open({ answers: [answer([play('a1', H), play('a2', 2 * H), play('a3', 3 * H)])] });
    await settle();
    const before = bodyRows(m);
    const btn = refreshBtn(m);
    const sel = filterEl(m, 'event');
    wrapOf(m).scrollTop = 120;
    globalThis.__focused = btn;
    queue = [{ rev: 'abc123', unchanged: true }];
    btn.click();
    await settle();
    assert.deepEqual(bodyRows(m).map((r, i) => r === before[i]), [true, true, true], 'the same row elements');
    assert.equal(refreshBtn(m), btn, 'the same REFRESH button');
    assert.equal(wrapOf(m).scrollTop, 120);
    assert.equal(globalThis.__focused, btn, 'focus stays on REFRESH');

    // a click moves the mark between the two existing rows
    before[2].click();
    assert.deepEqual(bodyRows(m).map((r, i) => r === before[i]), [true, true, true]);
    assert.deepEqual(before.map(r => r.attrs['aria-selected']), ['false', 'false', 'true']);
    assert.equal(wrapOf(m).scrollTop, 120);
    assert.equal(globalThis.__focused, before[2]);
    before[0].click();
    assert.deepEqual(before.map(r => r.attrs['aria-selected']), ['true', 'false', 'false']);
    assert.equal(before[2].classes.has('ol-row-selected'), false);
    assert.equal(root(m).querySelector('[data-ops-log="detail-grid"]').all('div').find(d => d.attrs['data-field'] === 'TIME').textContent, 'Tue 01:00');

    // a changed answer rebuilds the rows but keeps the scroll, the focused row, the button and the filter control
    before[1].click();
    queue = [answer([play('a1', H), play('a2', 2 * H), play('a3', 3 * H), play('a4', 4 * H)], { rev: 'def456' })];
    btn.click();
    await settle();
    assert.equal(bodyRows(m).length, 4);
    assert.equal(wrapOf(m).scrollTop, 120, 'scroll restored');
    assert.equal(globalThis.__focused.attrs['data-row-id'], 'a2', 'focus back on the same row');
    assert.equal(bodyRows(m)[1], globalThis.__focused);
    assert.equal(refreshBtn(m), btn);
    assert.equal(filterEl(m, 'event'), sel, 'the filter control is kept');
});

test('F4 and m9: RESULT filters on the word, so a growing count keeps the filter and the rows', async () => {
    clearOpsLogCache();
    const list = (n) => [play('a1', H, { result: 'OK' }), play('a2', 2 * H, { event: 'SIGN_IN_FAIL', result: `FAIL x${n}` }), play('a3', 3 * H, { result: 'DENIED x10+' }), play('a4', 4 * H, { result: 'BLOCKED+' }), play('a5', 5 * H, { result: 'FAIL' })];
    const m = await open({ answers: [answer(list(2))] });
    await settle();
    const ids = () => bodyRows(m).map(r => r.attrs['data-row-id']);
    choose(m, 'result', 'FAIL');
    assert.deepEqual(ids(), ['a2', 'a5'], 'FAIL finds FAIL x2 and a bare FAIL');
    choose(m, 'result', 'DENIED'); assert.deepEqual(ids(), ['a3']);
    choose(m, 'result', 'BLOCKED'); assert.deepEqual(ids(), ['a4']);
    choose(m, 'result', 'FAIL');
    queue = [answer(list(3), { rev: 'r2' })];
    refreshBtn(m).click();
    await settle();
    assert.equal(filterEl(m, 'result').value, 'FAIL');
    assert.deepEqual(ids(), ['a2', 'a5']);
    assert.equal(bodyRows(m)[0].all('td')[4].textContent, 'FAIL x3');
    assert.deepEqual(filterEl(m, 'result').all('option').map(o => o.value), ['', 'OK', 'FAIL', 'DENIED', 'BLOCKED']);
});

test('F4: a filter whose value left the list is cleared and shown as cleared, not left invisible', async () => {
    clearOpsLogCache();
    const m = await open({ answers: [answer([play('a1', H), play('a2', 2 * H, { event: 'LOCKOUT', where: 'Server room', result: 'BLOCKED' })])] });
    await settle();
    choose(m, 'event', 'LOCKOUT');
    choose(m, 'where', 'Server room');
    choose(m, 'result', 'BLOCKED');
    choose(m, 'time', 'night');
    assert.equal(bodyRows(m).length, 1);
    queue = [answer([play('a1', H), play('a3', 3 * H)], { rev: 'r2' })];
    refreshBtn(m).click();
    await settle();
    assert.equal(m._filters.event, '');
    assert.equal(m._filters.where, '');
    assert.equal(m._filters.result, '');
    assert.equal(filterEl(m, 'event').value, '', 'the select reads ALL');
    assert.equal(filterEl(m, 'where').value, '');
    assert.equal(filterEl(m, 'result').value, '');
    assert.equal(filterEl(m, 'time').value, 'night', 'a filter whose value is still valid is kept');
    assert.equal(bodyRows(m).length, 2, 'the rows the cleared filters hid are back (both are at night)');
});

test('m2: a failure that is not a refusal keeps the rows and says so; a refusal still reads NO ACCESS', async () => {
    clearOpsLogCache();
    const m = await open({ answers: [answer([play('a1', H)])] });
    await settle();
    for (const err of [new Error('network down'), Object.assign(new Error('API Error: 500'), { status: 500 }), Object.assign(new Error('API Error: 401'), { status: 401 })]) {
        queue = [err];
        refreshBtn(m).click();
        await settle();
        assert.equal(bodyRows(m).length, 1, 'rows still held');
        assert.match(root(m).querySelector('[data-ops-log="count"]').textContent, /NO SIGNAL - REFRESH/);
    }
    queue = [{ rev: 'abc123', unchanged: true }];
    refreshBtn(m).click();
    await settle();
    assert.doesNotMatch(root(m).querySelector('[data-ops-log="count"]').textContent, /NO SIGNAL/);
    for (const status of [400, 403, 404]) {
        clearOpsLogCache();
        const d = await open({ answers: [Object.assign(new Error('x'), { status })] });
        await settle();
        assert.equal(root(d).querySelector('.ol-message').textContent, 'NO ACCESS', String(status));
    }
    clearOpsLogCache();
    const first = await open({ answers: [new Error('offline')] });
    await settle();
    assert.equal(root(first).querySelector('.ol-message').textContent, 'NO SIGNAL - REFRESH');
});

test('lifecycle (m8): an answer after close changes nothing; a stale answer never overwrites a newer one; close aborts the request', async () => {
    clearOpsLogCache();
    let release;
    globalThis.__api.logRows = (id, opts) => { calls.push({ id, opts }); return new Promise(r => { release = r; }); };
    try {
        calls.length = 0;
        window.gameClock = clockWith('Tue');
        const m = new OpsLogMinigame(new FakeEl('div'), { sprite: { scenarioData: { id: 'security_log_pc' } } });
        m.start();
        const signal = calls[0].opts.signal;
        assert.equal(signal.aborted, false);
        const lateRelease = release;
        m.cleanup();
        assert.equal(signal.aborted, true, 'close aborts the request');
        lateRelease(answer([play('a1', H)]));
        await settle();
        assert.equal(bodyRows(m).length, 0, 'no render after close');
        const reopened = new OpsLogMinigame(new FakeEl('div'), { sprite: { scenarioData: { id: 'security_log_pc' } } });
        reopened.start();
        assert.equal(calls.at(-1).opts.rev, undefined, 'nothing was written to the cache');
        reopened.cleanup();

        // two fetches in flight: the first answers last and is dropped
        clearOpsLogCache();
        const n = new OpsLogMinigame(new FakeEl('div'), { sprite: { scenarioData: { id: 'security_log_pc' } } });
        n.start();
        const first = release;
        refreshBtn(n).click();
        const second = release;
        second(answer([play('b1', H)], { rev: 'new' }));
        await settle();
        first(answer([play('a1', H)], { rev: 'old' }));
        await settle();
        assert.deepEqual(bodyRows(n).map(r => r.attrs['data-row-id']), ['b1']);
        assert.equal(n._rev, 'new');
    } finally {
        globalThis.__api.logRows = async (id, opts) => { calls.push({ id, opts }); const a = queue.shift(); if (a instanceof Error) throw a; return a; };
    }
});

test('m5: a row id with a quote or a bracket is selectable (no selector is built from it)', async () => {
    clearOpsLogCache();
    const m = await open({ answers: [answer([play('a"]b', H), play('x\\y', 2 * H)])] });
    await settle();
    bodyRows(m)[0].click();
    assert.equal(bodyRows(m)[0].attrs['aria-selected'], 'true');
    assert.equal(globalThis.__focused.attrs['data-row-id'], 'a"]b');
});

test('no row is tinted or marked, with or without an anomaly, before a right flag', async () => {
    clearOpsLogCache();
    const m = await open({ answers: [answer([seed('s1', '07:12'), play('a1', H)])], data: { anomaly: { rowId: 's1' }, flagActionLabel: 'FLAG', flagActions: [{ type: 'set_global', key: 'k', value: true }] } });
    await settle();
    const classesOf = (tr) => [...tr.classes].sort().join(' ');
    assert.equal(classesOf(bodyRows(m)[0]), classesOf(bodyRows(m)[1]));
    assert.ok(bodyRows(m).every(r => ![...r.classes].some(c => /anomal|flag|alert|warn|tint/.test(c))));
    assert.ok(bodyRows(m).every(r => r.attrs['data-flagged'] === undefined));
    bodyRows(m)[0].click();
    assert.equal(root(m).all('button').map(b => b.attrs['data-action']).join(), 'flag,refresh');
    const css = read('../css/ops-log-minigame.css');
    assert.doesNotMatch(css, /anomal|border-radius:\s*[1-9]|blur|box-shadow/);
});

test('every cell and detail field goes in by textContent: a hostile typed username stays text', async () => {
    clearOpsLogCache();
    const evil = '<img src=x onerror=alert(1)>~';
    const hostile = play('a1', H, { as: evil, where: '<b>door</b>', detail: 'k: <script>x</script>' });
    const m = await open({ answers: [answer([hostile], { title: '<i>Log</i>' })] });
    await settle();
    const tr = bodyRows(m)[0];
    assert.equal(cells(tr)[2], evil);
    assert.equal(tr.all('td')[2].children.length, 0, 'no element was made from the text');
    tr.click();
    const vals = root(m).querySelector('[data-ops-log="detail-grid"]').all('div').filter(d => d.attrs['data-field']);
    assert.equal(vals.find(v => v.attrs['data-field'] === 'IDENTITY').textContent, evil);
    assert.equal(root(m).querySelector('.ol-caption').textContent, '<i>Log</i>');
    // no filter option is made from html either
    assert.ok(filterEl(m, 'where').all('option').some(o => o.textContent === '<b>door</b>' && o.children.length === 0));
    // and the module never sets innerHTML to anything but an empty string
    const src = read('minigames/ops-log/ops-log-minigame.js');
    assert.doesNotMatch(src, /innerHTML\s*=\s*[^'\s;]/);
    assert.doesNotMatch(src, /insertAdjacentHTML|outerHTML/);
    for (const el of [root(m), ...root(m).all('div')]) assert.ok(el.innerHTMLSets.every(v => v === ''));
});

test('m4: a hostile value in every field and in the title stays text in the cells, the detail panel and the options', async () => {
    clearOpsLogCache();
    const evil = (k) => `<img src=x onerror=alert('${k}')>`;
    const row = { id: evil('id'), at: evil('at'), event: evil('event'), as: evil('as'), where: evil('where'), result: evil('result'), detail: evil('detail') };
    const m = await open({ answers: [answer([row, seed('s2', '07:12', { event: evil('e2') })], { title: evil('title') })] });
    await settle();
    const tr = bodyRows(m)[0];
    assert.equal(tr.attrs['data-row-id'], evil('id'));
    assert.deepEqual(cells(tr), [evil('at'), evil('event'), evil('as'), evil('where'), evil('result'), evil('detail')]);
    for (const td of tr.all('td')) assert.equal(td.children.length, 0, 'no element made from a cell');
    tr.click();
    const vals = root(m).querySelector('[data-ops-log="detail-grid"]').all('div').filter(d => d.attrs['data-field']);
    assert.equal(vals.length, 6);
    assert.deepEqual(vals.map(v => v.textContent), [evil('at'), evil('event'), evil('as'), evil('where'), evil('result'), evil('detail')]);
    for (const v of vals) assert.equal(v.children.length, 0);
    assert.equal(root(m).querySelector('.ol-caption').textContent, evil('title'));
    for (const k of ['event', 'where', 'result']) for (const o of filterEl(m, k).all('option')) assert.equal(o.children.length, 0);
    // no node anywhere holds an element made from the text
    assert.equal(root(m).all('img').length, 0);
});

test('merged rows show their count and a + exactly as the answer text carries it', async () => {
    clearOpsLogCache();
    const m = await open({ answers: [answer([play('a1', H, { result: 'FAIL x3' }), play('a2', 2 * H, { result: 'DENIED x10+' }), play('a3', 3 * H, { result: 'BLOCKED+' })])] });
    await settle();
    assert.deepEqual(bodyRows(m).map(r => cells(r)[4]), ['FAIL x3', 'DENIED x10+', 'BLOCKED+']);
    // filter values are the result's word, without the count or the plus (m9)
    assert.deepEqual(filterEl(m, 'result').all('option').map(o => o.value), ['', 'FAIL', 'DENIED', 'BLOCKED']);
});

test('rows keep only the answer keys: an extra field is dropped and a stray id-less row is skipped', () => {
    const out = rows.cleanRows([{ id: 'a1', elapsedMs: 5, event: 'E', as: 'x', where: 'w', result: 'OK', detail: '-', seq: 9, serverMs: 1 }, { event: 'E' }, null]);
    assert.deepEqual(Object.keys(out[0]).sort(), ['as', 'detail', 'elapsedMs', 'event', 'id', 'result', 'where']);
    assert.equal(out.length, 1);
});

test('a reader opened from a desktop asks for its own scenarioData.id with the screen route', async () => {
    clearOpsLogCache();
    const sprite = { objectId: 'temp_1763900000000', sourceRoute: { foothold: 'jack_wall' } };
    await open({ answers: [answer([])], sprite });
    assert.equal(calls[0].id, 'security_log_pc');
    assert.equal(calls[0].opts.foothold, 'jack_wall');
    clearOpsLogCache();
    await open({ answers: [answer([])], sprite: { objectId: 'temp_2', sourceRoute: { from: 'ops_pc' } } });
    assert.equal(calls[0].opts.from, 'ops_pc');
    assert.equal(calls[0].opts.foothold, undefined);
    clearOpsLogCache();
    await open({ answers: [answer([])] });
    assert.equal(calls[0].opts.foothold, undefined);
    assert.equal(calls[0].opts.from, undefined);
});

// The paths a reader is opened through: the real container and interactions code, sliced out of
// the source files and run (the same way the other source tests do)

function slice(src, startRe, endRe) {
    const a = src.search(startRe);
    assert.ok(a >= 0, `${startRe} found`);
    const rest = src.slice(a);
    const b = rest.search(endRe);
    assert.ok(b > 0, `${endRe} found`);
    return rest.slice(0, b);
}

const interactionsSrc = read('systems/interactions.js');
const containerSrc = read('minigames/container/container-minigame.js');

// Runs the real `if (sprite.scenarioData.type === '<type>') { ... }` branch of interactions.js
function runBranch(type, sprite) {
    const started = [];
    const branch = slice(interactionsSrc, new RegExp(`if \\(sprite\\.scenarioData\\.type === '${type}'\\) \\{`), /\n    \}\n/) + '\n    }\n';
    const fn = new Function('sprite', 'window', `${branch} return 'fell through';`);
    const win = { MinigameFramework: { mainGameScene: {}, startMinigame: (...a) => started.push(a) } };
    const r = fn(sprite, win);
    return { started, r };
}

// A method of the real ContainerMinigame, bound to a fake screen
function realMethod(name, scope = {}) {
    const text = slice(containerSrc, new RegExp(`\\n    ${name}\\(`), /\n    \}\n/).replace(/^\n/, '') + '\n    }\n';
    return new Function(...Object.keys(scope), `return function ${text.trim().replace(new RegExp(`^${name}`), 'f')}`)(...Object.values(scope));
}
const folderRouteQuery = new Function(`${slice(containerSrc, /export function folderRouteQuery/, /\n\}\n/).replace('export ', '')}\n}\nreturn folderRouteQuery;`)();

function screen(self) {
    const o = { mode: 'x', pcMonitor: null, ...self };
    for (const n of ['routeExtra', 'sourceExtras', 'childExtras', 'pcScreenExtras']) o[n] = realMethod(n, { isNetworkScreenContainer: () => false, folderRouteQuery }).bind(o);
    o.complete = () => {};
    return o;
}

// Opens `item` from `self` through the real handleInteractiveItem; returns the stand-in sprite it hands on
function openFrom(self, item) {
    const handed = [];
    const win = { handleObjectInteraction: (sp) => handed.push(sp), gameAlert() {}, keyring: null };
    const handle = realMethod('handleInteractiveItem', {
        window: win, notepadCount: () => 0, scrollingAncestor: () => null, iconFocusMark: () => null,
        isNetworkScreenContainer: () => false, armNetworkReturn() {}, scheduleNetworkReturnCheck() {}
    });
    handle.call(screen(self), item, null);
    assert.equal(handed.length, 1, 'one stand-in handed to handleObjectInteraction');
    return handed[0];
}

const READER = { type: 'ops_log_terminal', id: 'security_log_pc', name: 'Security office PC', minigameData: { logSource: 'door_controller' } };
const ANALYSER = { type: 'log_filter_terminal', id: 'analyser', name: 'Analyser', minigameData: { minigameId: 'log-filter' } };

const SCREENS = {
    'foothold desktop': [{ loginPcId: 'pc1', sourcePcId: 'pc1', remote: { footholdId: 'jack_wall' } }, { foothold: 'jack_wall' }],
    'from desktop': [{ loginPcId: 'pc1', sourcePcId: 'pc1', fromRoute: { fromPcId: 'ops_pc' } }, { from: 'ops_pc' }],
    'relay desktop': [{ loginPcId: 'pc1', sourcePcId: 'pc1', relay: { relay: true } }, { relay: true }],
    'walk-up desktop': [{ loginPcId: 'pc1', sourcePcId: 'pc1' }, undefined]
};

test('F5: handleInteractiveItem hands a reader on to interactions.js with its item, a temp_ id and the route; the branch passes the sprite on', async () => {
    for (const [name, [self, route]] of Object.entries(SCREENS)) {
        const standIn = openFrom(self, READER);
        assert.equal(standIn.scenarioData, READER, name);
        assert.match(standIn.objectId, /^temp_\d+$/, name);
        assert.deepEqual(standIn.sourceRoute, route, name);
        // the branch opens ops-log with the very same stand-in, so the viewer can read id and route
        const { started } = runBranch('ops_log_terminal', standIn);
        assert.equal(started.length, 1, name);
        assert.equal(started[0][0], 'ops-log');
        assert.equal(started[0][2].sprite, standIn, `${name}: sprite is passed on`);
        assert.equal(started[0][2].title, 'Security office PC');
        assert.equal('showCancel' in started[0][2], false);
        // and the viewer, given what the branch passed, asks for the reader's own id with that route
        clearOpsLogCache();
        queue = [answer([])];
        calls.length = 0;
        new OpsLogMinigame(new FakeEl('div'), started[0][2]).start();
        await settle();
        assert.equal(calls[0].id, 'security_log_pc', name);
        assert.equal(calls[0].opts.foothold, route?.foothold);
        assert.equal(calls[0].opts.from, route?.from);
        assert.equal(calls[0].opts.relay, route?.relay);
    }
});

test('F5: a log_filter_terminal opened from a desktop opens log-filter with the arguments a room gives it', () => {
    const inRoom = runBranch('log_filter_terminal', { scenarioData: ANALYSER, objectId: 'analyser' }).started[0];
    const standIn = openFrom(SCREENS['foothold desktop'][0], ANALYSER);
    assert.equal(standIn.scenarioData, ANALYSER);
    assert.match(standIn.objectId, /^temp_/);
    const fromDesktop = runBranch('log_filter_terminal', standIn).started[0];
    assert.equal(fromDesktop[0], 'log-filter');
    assert.equal(fromDesktop[2].sprite, standIn, 'sprite is passed on');
    assert.equal(inRoom[0], fromDesktop[0]);
    assert.deepEqual({ ...fromDesktop[2], sprite: 0 }, { ...inRoom[2], sprite: 0 });
    assert.deepEqual({ ...inRoom[2], sprite: 0 }, { title: 'Access Log Analyser', showCancel: true, cancelText: 'Close', sprite: 0 });
    const custom = runBranch('log_filter_terminal', { scenarioData: { type: 'log_filter_terminal', minigameData: { minigameId: 'custom-log' } } }).started[0];
    assert.equal(custom[0], 'custom-log');
});

test('F2: a folder under a sign-in PC names its PC session route; a reader there sends it', () => {
    const prev = globalThis.window.pcSessions;
    try {
        for (const [session, route] of [
            [{ relay: true }, { relay: true }],
            [{ remote: true, footholdId: 'jack_a' }, { foothold: 'jack_a' }],
            [{ remote: true, fromPcId: 'ops_pc' }, { from: 'ops_pc' }],
            [{}, undefined]
        ]) {
            globalThis.window.pcSessions = new Map([['pc1', session]]);
            const standIn = openFrom({ sourcePcId: 'pc1' }, READER);
            assert.deepEqual(standIn.sourceRoute, route, JSON.stringify(session));
        }
        // a share's folder window has no PC session of its own
        globalThis.window.pcSessions = new Map([['pc1', { relay: true }]]);
        assert.equal(openFrom({ sourceResourceId: 'sh1' }, READER).sourceRoute, undefined);
    } finally { globalThis.window.pcSessions = prev; }
});

test('container-minigame.js: both types are interactive items; sourceExtras keeps its old keys and gains sourceRoute', () => {
    assert.match(containerSrc, /item\.type === 'log_filter_terminal' \|\|\s+item\.type === 'ops_log_terminal' \|\|/);
    assert.deepEqual(screen({ mode: 'npc' }).sourceExtras(), {});
    assert.deepEqual(screen({ sourcePcId: 'pc1' }).sourceExtras(), { sourcePcId: 'pc1' });
    assert.deepEqual(screen({ sourceResourceId: 'sh1' }).sourceExtras(), { sourceResourceId: 'sh1' });
    assert.deepEqual(screen({}).sourceExtras(), {});
    assert.deepEqual(screen({ sourcePcId: 'pc1', remote: { footholdId: 'jack_a' } }).sourceExtras(), { sourcePcId: 'pc1', sourceRoute: { foothold: 'jack_a' } });
    assert.deepEqual(screen({ sourcePcId: 'pc1', fromRoute: { fromPcId: 'ops_pc' } }).sourceExtras(), { sourcePcId: 'pc1', sourceRoute: { from: 'ops_pc' } });
    assert.deepEqual(screen({ sourcePcId: 'pc1', loginPcId: 'pc1', relay: { relay: true } }).sourceExtras(), { sourcePcId: 'pc1', sourceRoute: { relay: true } });
    assert.deepEqual(screen({ mode: 'npc', remote: { footholdId: 'jack_a' } }).sourceExtras(), {});
});

test('F2: a reader on a relay desktop sends relay, never foothold or from, and the answer is cached apart', async () => {
    clearOpsLogCache();
    await open({ answers: [answer([play('a1', H)])], sprite: { sourceRoute: { relay: true } } });
    await settle();
    assert.equal(calls[0].opts.relay, true);
    assert.equal(calls[0].opts.foothold, undefined);
    assert.equal(calls[0].opts.from, undefined);
    // the same reader with no route does not take the relay's cached rows or rev
    const walk = await open({ answers: [answer([])] });
    assert.equal(calls[0].opts.rev, undefined);
    assert.equal(bodyRows(walk).length, 0, 'no rows drawn from the relay cache');
});

test('wiring: scene registered, texture and screen glow set, API call shape, schema entry', async () => {
    const idx = read('minigames/index.js');
    assert.match(idx, /import \{ OpsLogMinigame \} from '\.\/ops-log\/ops-log-minigame\.js'/);
    assert.match(idx, /export \{ OpsLogMinigame \} from '\.\/ops-log\/ops-log-minigame\.js'/);
    assert.match(idx, /registerScene\('ops-log', OpsLogMinigame\)/);
    assert.match(idx, /registerScene\('log-filter', LogFilterMinigame\)/);
    assert.match(read('core/game.js'), /this\.load\.image\('ops_log_terminal', 'objects\/log_filter_terminal\.png'\)/);
    assert.match(read('systems/lighting.js'), /\|log_filter_terminal\|ops_log_terminal\|/);
    const schemas = JSON.parse(readFileSync(join(here, '../../scripts/minigame-data-schemas.json'), 'utf8'));
    assert.deepEqual(schemas.ops_log_terminal.required, ['logSource']);
    assert.deepEqual(schemas.ops_log_terminal.optional, ['anomaly', 'flagActionLabel', 'flagActions', 'completionActions']);
    assert.equal(schemas.ops_log_terminal.optional.includes('title'), false, 'the title is the source\'s, from the server (m12)');
    assert.deepEqual(schemas.log_filter_terminal, {
        required: ['logEntries'],
        optional: ['minigameId', 'title', 'logType', 'anomaly', 'threatIntel', 'accountHistory', 'flagActionLabel', 'flagConfirmTitle', 'flagConfirmBody', 'flagConfirmBodyClosed', 'additionalTabs', 'requireAllTabs', 'stateOverrides', 'flagActions', 'completionActions', 'progressActions', 'nextTabPrompt', 'nextTabButton', 'completeBanner']
    }, 'the log-filter entry is unchanged');

    // ApiClient.logRows builds the URL (api-client.js run against a fake fetch)
    const urls = [];
    globalThis.fetch = async (u) => { urls.push(u); return { ok: true, json: async () => ({}) }; };
    globalThis.window = { breakEscapeConfig: { gameId: 7, apiBasePath: '/g/7' } };
    const apiSrc = read('api-client.js');
    const fn = apiSrc.match(/static async logRows[\s\S]*?\n  \}\n/)[0];
    const getSrc = apiSrc.match(/static async get\(endpoint[\s\S]*?\n  \}\n/)[0];
    const C = new Function('fetch', 'getApiBase', `return class { ${getSrc}\n${fn} };`)(globalThis.fetch, () => '/g');
    await C.logRows('security log', { rev: 'ab', foothold: 'jack_a' });
    await C.logRows('r1', { from: 'ops_pc' });
    await C.logRows('r2');
    await C.logRows('r3', { relay: true });
    await C.logRows('r4', { relay: false });
    await C.logRows('r5', { relay: true, from: 'ops_pc' });
    assert.deepEqual(urls, ['/g/log_rows?object_id=security%20log&rev=ab&foothold=jack_a', '/g/log_rows?object_id=r1&from=ops_pc', '/g/log_rows?object_id=r2', '/g/log_rows?object_id=r3&relay=1', '/g/log_rows?object_id=r4', '/g/log_rows?object_id=r5&from=ops_pc']);
});

// ---- the flag flow (L2b): checked in the browser, as log-filter checks its own anomaly ----

const flagBtn = (m, action) => root(m).all('button').find(b => b.attrs['data-action'] === action);
const flagNote = (m) => root(m).querySelector('[data-ops-log="flag-note"]');
const rowsWithAnomaly = () => [seed('s1', 'Mon 23:58'), seed('s2', 'Tue 02:14'), play('a1', H)];
const FLAG_DATA = {
    anomaly: { rowId: 's2' },
    flagActions: [{ type: 'set_global', key: 'found_night_swipe', value: true }],
    completionActions: [{ type: 'complete_task', taskId: 't_log' }, { type: 'bogus' }, null]
};
const set = [];
const done = [];
function hooks(globals = {}) {
    set.length = 0; done.length = 0;
    window.gameState = { globalVariables: { ...globals } };
    window.npcManager = { setGlobalVariable: (k, v) => { set.push([k, v]); window.gameState.globalVariables[k] = v; } };
    window.objectivesManager = { completeTask: (t) => done.push(t) };
}
function unhook() { delete window.npcManager; delete window.objectivesManager; delete window.gameState; }
async function openFlaggable(extra = {}) {
    clearOpsLogCache();
    const m = await open({ answers: [answer(rowsWithAnomaly())], data: { ...FLAG_DATA, ...(extra.data || {}) }, sprite: extra.sprite || {} });
    await settle();
    return m;
}
const flaggedIds = (m) => bodyRows(m).filter(r => r.attrs['data-flagged'] === 'true').map(r => r.attrs['data-row-id']);
const pick = (m, i) => { bodyRows(m)[i].click(); flagBtn(m, 'flag').click(); flagBtn(m, 'flag-confirm').click(); };

test('flag: the control appears only with an anomaly, and only on a selected row', async () => {
    hooks();
    clearOpsLogCache();
    const plain = await open({ answers: [answer(rowsWithAnomaly())] });
    await settle();
    bodyRows(plain)[0].click();
    assert.equal(flagBtn(plain, 'flag'), undefined, 'a reader without an anomaly shows no flag control');
    const m = await openFlaggable();
    assert.equal(flagBtn(m, 'flag'), undefined, 'no row selected, no control');
    bodyRows(m)[0].click();
    assert.equal(flagBtn(m, 'flag').textContent, 'FLAG AS ANOMALY');
    const custom = await openFlaggable({ data: { flagActionLabel: 'Report this entry' } });
    bodyRows(custom)[1].click();
    assert.equal(flagBtn(custom, 'flag').textContent, 'Report this entry');
    unhook();
});

test('flag: FLAG opens a confirm with CONFIRM and CANCEL; CANCEL returns, runs nothing, and focuses FLAG', async () => {
    hooks();
    const m = await openFlaggable();
    bodyRows(m)[1].click();
    flagBtn(m, 'flag').click();
    assert.equal(flagNote(m).attrs['data-state'], 'confirm');
    assert.ok(flagBtn(m, 'flag-confirm') && flagBtn(m, 'flag-cancel'));
    assert.equal(flagBtn(m, 'flag'), undefined);
    flagBtn(m, 'flag-cancel').click();
    assert.ok(flagBtn(m, 'flag'));
    assert.equal(globalThis.__focused, flagBtn(m, 'flag'));
    assert.deepEqual([set, done], [[], []]);
    unhook();
});

test('flag: a wrong pick says NOT THIS ONE, marks nothing, runs nothing, and clears when another row is selected', async () => {
    hooks();
    const m = await openFlaggable();
    pick(m, 0); // s1, not the anomaly
    assert.equal(flagNote(m).textContent, 'NOT THIS ONE');
    assert.ok(flagBtn(m, 'flag'), 'it can be tried again');
    assert.deepEqual(flaggedIds(m), []);
    assert.ok(bodyRows(m).every(r => !r.classes.has('ol-row-flagged')));
    assert.deepEqual([set, done], [[], []]);
    assert.equal(window.gameState.globalVariables.found_night_swipe, undefined);
    bodyRows(m)[1].click();
    assert.equal(flagNote(m), null, 'selecting another row clears the note, so it never sits under a different row');
    // a play row is never the anomaly
    pick(m, 2);
    assert.equal(flagNote(m).textContent, 'NOT THIS ONE');
    assert.deepEqual([set, done, flaggedIds(m)], [[], [], []]);
    unhook();
});

test('flag: a right pick marks that row, runs flagActions then completionActions once, and offers nothing more', async () => {
    hooks();
    const m = await openFlaggable();
    pick(m, 1); // s2
    assert.deepEqual(set, [['found_night_swipe', true]]);
    assert.deepEqual(done, ['t_log']);
    assert.deepEqual(flaggedIds(m), ['s2']);
    assert.ok(bodyRows(m)[1].classes.has('ol-row-flagged'));
    assert.equal(flagNote(m).textContent, 'FLAGGED');
    assert.equal(flagBtn(m, 'flag'), undefined);
    assert.equal(globalThis.__focused, bodyRows(m)[1], 'focus stays on the flagged row');
    bodyRows(m)[0].click();
    assert.equal(flagBtn(m, 'flag'), undefined, 'no second flag after a right one');
    assert.equal(flagNote(m), null);
    bodyRows(m)[1].click();
    assert.equal(flagNote(m).textContent, 'FLAGGED');
    assert.deepEqual([set.length, done.length], [1, 1], 'nothing runs twice');
    unhook();
});

test('flag: reopened with the done global set (a reload), the row shows flagged and no control is offered', async () => {
    hooks({ found_night_swipe: true });
    clearOpsLogCache(); // a reload has no cache either
    const m = await openFlaggable();
    assert.deepEqual(flaggedIds(m), ['s2']);
    bodyRows(m)[0].click();
    assert.equal(flagBtn(m, 'flag'), undefined);
    bodyRows(m)[1].click();
    assert.equal(flagNote(m).textContent, 'FLAGGED');
    assert.equal(flagBtn(m, 'flag'), undefined);
    assert.deepEqual([set, done], [[], ['t_log']], 'opening done re-runs only the task completion, no set_global');
    unhook();
});

test('flag (N-2): opening done calls completeTask once per entry in both lists and nothing else; not done calls nothing', async () => {
    hooks({ found_night_swipe: true });
    const m = await openFlaggable({ data: { completionActions: [{ type: 'complete_task', taskId: 't_log' }, { type: 'set_global', key: 'other', value: true }], flagActions: [{ type: 'set_global', key: 'found_night_swipe', value: true }, { type: 'complete_task', taskId: 't_flag' }] } });
    assert.deepEqual(done, ['t_flag', 't_log']);
    assert.deepEqual(set, []);
    assert.equal(flagNote(m), null, 'no flagged-just-now message');
    hooks();
    await openFlaggable();
    assert.deepEqual([set, done], [[], []]);
    unhook();
});

test('flag: the done global is the first set_global true of flagActions, else of completionActions; none means no memory', async () => {
    hooks({ cg: true });
    const viaCompletion = await openFlaggable({ data: { flagActions: [], completionActions: [{ type: 'set_global', key: 'cg', value: true }] } });
    assert.deepEqual(flaggedIds(viaCompletion), ['s2']);
    hooks({ other: true });
    const none = await openFlaggable({ data: { flagActions: [{ type: 'set_global', key: 'x', value: false }], completionActions: [] } });
    assert.deepEqual(flaggedIds(none), []);
    // a global that is set but not to true does not count
    hooks({ found_night_swipe: 'yes' });
    assert.deepEqual(flaggedIds(await openFlaggable()), []);
    // a reader without the global's reader (no anomaly object) never marks
    hooks({ found_night_swipe: true });
    clearOpsLogCache();
    const plain = await open({ answers: [answer(rowsWithAnomaly())], data: { flagActions: FLAG_DATA.flagActions } });
    await settle();
    assert.deepEqual(flaggedIds(plain), []);
    unhook();
});

test('flag: a right flag survives a reopen in the same page, and a lost request cannot lose it (nothing is sent)', async () => {
    hooks();
    const m = await openFlaggable();
    const callsBefore = calls.length;
    pick(m, 1);
    assert.equal(calls.length, callsBefore, 'the flag sends no request');
    queue = [{ rev: 'abc123', unchanged: true }];
    const again = new OpsLogMinigame(new FakeEl('div'), { sprite: { scenarioData: { id: 'security_log_pc', type: 'ops_log_terminal', name: 'x', minigameData: { logSource: 'door_controller', ...FLAG_DATA } } } });
    again.start();
    assert.deepEqual(flaggedIds(again), ['s2']);
    await settle();
    assert.deepEqual(flaggedIds(again), ['s2']);
    unhook();
});

test('flag: an anomaly with no row id marks nothing and every pick is wrong; hostile action entries are ignored', async () => {
    hooks();
    const m = await openFlaggable({ data: { anomaly: {}, flagActions: 'rm -rf', completionActions: [1, 'x', { type: 'set_global', key: 5, value: true }] } });
    pick(m, 1);
    assert.equal(flagNote(m).textContent, 'NOT THIS ONE');
    assert.deepEqual([set, done, flaggedIds(m)], [[], [], []]);
    const odd = await openFlaggable({ data: { anomaly: { rowId: { toString: () => 's2' } }, flagActions: [{ type: 'set_global', key: 'k', value: true }] } });
    pick(odd, 1);
    assert.deepEqual([set, flaggedIds(odd)], [[], []], 'a non-string rowId never equals a row id');
    unhook();
});

test('flag: hostile strings in the label and rows only ever reach textContent', async () => {
    hooks();
    const evil = '<img src=x onerror=alert(1)>';
    clearOpsLogCache();
    const m = await open({ answers: [answer([seed('s1', 'Mon 23:58', { as: evil, where: evil }), seed('s2', 'Tue 02:14')])], data: { ...FLAG_DATA, flagActionLabel: evil } });
    await settle();
    bodyRows(m)[0].click();
    assert.equal(flagBtn(m, 'flag').textContent, evil);
    assert.ok(root(m).all('*').every(e => e.innerHTMLSets.length === 0 || e.innerHTMLSets.every(v => v === '')), 'no innerHTML with text');
    unhook();
});

test('flag: the viewer sends no request of its own and ApiClient has no flag call', () => {
    const src = read('minigames/ops-log/ops-log-minigame.js');
    assert.doesNotMatch(src, /logFlag|log_rows\/flag|fetch\(/);
    assert.doesNotMatch(read('api-client.js'), /logFlag|log_rows\/flag/);
});

test('flag: the flagged row has its own look, none before a right flag, in square pixel style', () => {
    const css = read('../css/ops-log-minigame.css');
    const rule = /\.ol-row\.ol-row-flagged \.ol-cell[^{]*\{([^}]*)\}/.exec(css);
    assert.ok(rule, 'a flagged-row rule exists');
    assert.match(rule[1], /repeating-linear-gradient/, 'it is not just a tint like a selected row');
    assert.doesNotMatch(css, /border-radius:\s*[1-9]|blur|box-shadow/);
});
