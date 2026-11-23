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
        this.classes = new Set(); this.style = {}; this._text = ''; this.value = ''; this.innerHTMLSets = [];
        const self = this;
        this.classList = {
            add: (...c) => c.forEach(x => self.classes.add(x)),
            remove: (...c) => c.forEach(x => self.classes.delete(x)),
            contains: (c) => self.classes.has(c)
        };
    }
    set className(v) { this.classes = new Set(String(v).split(' ').filter(Boolean)); }
    set textContent(v) { this._text = String(v); this.children = []; }
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
globalThis.document = { createElement: (t) => new FakeEl(t), head: null, getElementById: () => null };
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
});

test('no row is tinted or marked, with or without an anomaly; no flag button in this stage', async () => {
    clearOpsLogCache();
    const m = await open({ answers: [answer([seed('s1', '07:12'), play('a1', H)])], data: { anomaly: { rowId: 's1' }, flagActionLabel: 'FLAG', flagActions: [{ type: 'set_global', key: 'k', value: true }] } });
    await settle();
    const classesOf = (tr) => [...tr.classes].sort().join(' ');
    assert.equal(classesOf(bodyRows(m)[0]), classesOf(bodyRows(m)[1]));
    assert.ok(bodyRows(m).every(r => ![...r.classes].some(c => /anomal|flag|alert|warn|tint/.test(c))));
    bodyRows(m)[0].click();
    assert.equal(root(m).all('button').map(b => b.attrs['data-action']).join(), 'refresh');
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

test('merged rows show their count and a + exactly as the answer text carries it', async () => {
    clearOpsLogCache();
    const m = await open({ answers: [answer([play('a1', H, { result: 'FAIL x3' }), play('a2', 2 * H, { result: 'DENIED x10+' }), play('a3', 3 * H, { result: 'BLOCKED+' })])] });
    await settle();
    assert.deepEqual(bodyRows(m).map(r => cells(r)[4]), ['FAIL x3', 'DENIED x10+', 'BLOCKED+']);
    // filter values are the whole result text
    assert.deepEqual(filterEl(m, 'result').all('option').map(o => o.value), ['', 'FAIL x3', 'DENIED x10+', 'BLOCKED+']);
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

// The paths a reader is opened through (source reads, as the container tests do)

function slice(src, startRe, endRe) {
    const a = src.search(startRe);
    assert.ok(a >= 0, `${startRe} found`);
    const rest = src.slice(a);
    const b = rest.search(endRe);
    assert.ok(b > 0, `${endRe} found`);
    return rest.slice(0, b);
}

test('interactions.js: ops_log_terminal opens ops-log with no Cancel; log_filter_terminal still opens log-filter as before', () => {
    const src = read('systems/interactions.js');
    const run = (type, scenarioData) => {
        const started = [];
        const branch = (t) => slice(src, new RegExp(`if \\(sprite\\.scenarioData\\.type === '${t}'\\) \\{`), /\n    \}\n/) + '\n    }\n';
        const fn = new Function('sprite', 'window', `${branch(type)} return 'fell through';`);
        const win = { MinigameFramework: { mainGameScene: {}, startMinigame: (...a) => started.push(a) } };
        const r = fn({ scenarioData: { type, ...scenarioData } }, win);
        return { started, r };
    };
    const sprite = { objectId: 'temp_1', scenarioData: { type: 'ops_log_terminal', id: 'r', name: 'Security office PC' } };
    const ops = run('ops_log_terminal', { id: 'r', name: 'Security office PC' });
    assert.equal(ops.started.length, 1);
    assert.equal(ops.started[0][0], 'ops-log');
    assert.equal(ops.started[0][2].title, 'Security office PC');
    assert.equal('showCancel' in ops.started[0][2], false);
    assert.ok(sprite);
    const lf = run('log_filter_terminal', { title: 'Access Log Analyser' });
    assert.equal(lf.started[0][0], 'log-filter');
    assert.deepEqual({ ...lf.started[0][2], sprite: undefined }, { title: 'Access Log Analyser', showCancel: true, cancelText: 'Close', sprite: undefined });
    const lf2 = run('log_filter_terminal', { minigameData: { minigameId: 'custom-log' } });
    assert.equal(lf2.started[0][0], 'custom-log');
});

test('container-minigame.js: both types are interactive items; sourceExtras carries sourceRoute and its old keys', () => {
    const src = read('minigames/container/container-minigame.js');
    assert.match(src, /item\.type === 'log_filter_terminal' \|\|\s+item\.type === 'ops_log_terminal' \|\|/);
    const body = (name) => slice(src, new RegExp(`\\n    ${name}\\(\\) \\{`), /\n    \}\n/).replace(/^\n/, '') + '\n    }\n';
    const mk = (self) => {
        const o = { ...self };
        o.routeExtra = new Function(`return function ${body('routeExtra').trim().replace(/^routeExtra/, 'f')}`)().bind(o);
        o.sourceExtras = new Function(`return function ${body('sourceExtras').trim().replace(/^sourceExtras/, 'f')}`)().bind(o);
        return o;
    };
    assert.deepEqual(mk({ mode: 'npc' }).sourceExtras(), {});
    assert.deepEqual(mk({ mode: 'x', sourcePcId: 'pc1' }).sourceExtras(), { sourcePcId: 'pc1' });
    assert.deepEqual(mk({ mode: 'x', sourceResourceId: 'sh1' }).sourceExtras(), { sourceResourceId: 'sh1' });
    assert.deepEqual(mk({ mode: 'x' }).sourceExtras(), {});
    assert.deepEqual(mk({ mode: 'x', sourcePcId: 'pc1', remote: { footholdId: 'jack_a' } }).sourceExtras(), { sourcePcId: 'pc1', sourceRoute: { foothold: 'jack_a' } });
    assert.deepEqual(mk({ mode: 'x', sourcePcId: 'pc1', fromRoute: { fromPcId: 'ops_pc' } }).sourceExtras(), { sourcePcId: 'pc1', sourceRoute: { from: 'ops_pc' } });
    assert.deepEqual(mk({ mode: 'npc', remote: { footholdId: 'jack_a' } }).sourceExtras(), {});
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
    assert.deepEqual(schemas.ops_log_terminal.optional, ['title', 'anomaly', 'flagActionLabel', 'flagActions', 'completionActions']);
    assert.ok(schemas.log_filter_terminal, 'the log-filter entry is unchanged');

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
    assert.deepEqual(urls, ['/g/log_rows?object_id=security%20log&rev=ab&foothold=jack_a', '/g/log_rows?object_id=r1&from=ops_pc', '/g/log_rows?object_id=r2']);
});
