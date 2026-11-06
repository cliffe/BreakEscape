// Log filter minigame: lookups follow the selected row (sis01 decoy bug, 2026-10-03).
// Run with: node --test test/js/log-filter-selected-row.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

// Minimal DOM: enough for the minigame's render paths
class FakeEl {
    constructor(tag) {
        this.tag = tag; this.children = []; this.parent = null; this.listeners = {};
        this.classes = new Set(); this.style = {}; this._text = '';
        const self = this;
        this.classList = {
            add: (...c) => c.forEach(x => self.classes.add(x)),
            remove: (...c) => c.forEach(x => self.classes.delete(x)),
            toggle: (c, on) => { (on === undefined ? !self.classes.has(c) : on) ? self.classes.add(c) : self.classes.delete(c); },
            contains: (c) => self.classes.has(c)
        };
    }
    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() { return this._text + this.children.map(c => c.textContent).join(' '); }
    set innerHTML(v) { this.children = []; this._text = ''; }
    appendChild(c) { if (c.parent) c.remove(); c.parent = this; this.children.push(c); return c; }
    insertBefore(c, ref) { if (c.parent) c.remove(); c.parent = this; const i = this.children.indexOf(ref); this.children.splice(i < 0 ? this.children.length : i, 0, c); return c; }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); this.parent = null; }
    addEventListener(n, cb) { (this.listeners[n] ||= []).push(cb); }
    click() { (this.listeners.click || []).forEach(cb => cb()); }
    matches(sel) { return sel.split(',').map(s => s.trim()).some(s => s.startsWith('.') && this.classes.has(s.slice(1))); }
    querySelectorAll(sel) { const out = []; const walk = (n) => n.children.forEach(c => { if (c.matches(sel)) out.push(c); walk(c); }); walk(this); return out; }
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}
globalThis.document = { createElement: (t) => new FakeEl(t), createTextNode: (t) => { const e = new FakeEl('#text'); e._text = t; return e; } };
globalThis.window = { gameState: { globalVariables: {} } };

const base = dataUrl('export class MinigameScene { constructor(c, p) { this.container = c; this.params = p; } start() {} cleanup() {} complete() {} }');
let src = readFileSync(join(js, 'minigames/log-filter/log-filter-minigame.js'), 'utf8');
src = src.split(`'../framework/base-minigame.js'`).join(`'${base}'`)
         .split(`'../../utils/display-dashes.js'`).join(`'${dataUrl('export const displayDashes = (s) => s;')}'`);
const { LogFilterMinigame } = await import(dataUrl(src));

const vpnData = () => ({
    logType: 'vpn', entryCount: 30,
    anomaly: { user: 'm.blake', ip: '185.220.101.47', country: 'RO', mfa: 'NO', result: 'ACCEPT', timestamp: '2025-11-03 08:52', position: 21 },
    noise: [{ user: 'w.price', ip: '91.108.14.4', country: 'UK', mfa: 'NO', result: 'ACCEPT', timestamp: '2025-11-03 08:44' }],
    threatIntel: { ip: '185.220.101.47', asn: 'AS1', type: 'Tor Exit Node', location: 'Bucharest', lastFlagged: 'x', knownBad: true },
    accountHistory: { account: 'm.blake', fullName: 'Marcus Blake', contractor: 'NetSol', role: 'Eng', accessLevel: 'C', status: 'ACTIVE', lastLegitimateSession: 'a', currentSession: 'b', anomalyBadge: 'IMPOSSIBLE TRAVEL' },
    flagConfirmBody: 'Flag it?',
    completionActions: [{ type: 'set_global', key: 'done', value: true }],
    progressActions: [
        { trigger: 'threat_intel_opened', type: 'set_global', key: 'intel_seen', value: true },
        { trigger: 'account_history_opened', type: 'set_global', key: 'acct_seen', value: true }
    ]
});

function open(data) {
    globalThis.window.gameState.globalVariables = {};
    const g = window.gameState.globalVariables;
    globalThis.window.npcManager = { setGlobalVariable: (k, v) => { g[k] = v; } };
    const m = new LogFilterMinigame(new FakeEl('div'), { sprite: { scenarioData: { minigameData: data } } });
    m._dom.body = new FakeEl('div');
    m._dom.logPane = new FakeEl('div');
    m._renderLogTable(m._dom.logPane);
    m.g = g;
    return m;
}
const rowFor = (m, user) => m._logEntries.find(e => e.user === user && e.country !== 'UK') || m._logEntries.find(e => e.user === user);
const select = (m, entry) => { m._selectEntry(entry); };
const btn = (m, label) => m._dom.logPane.querySelector('.lf-session-detail').querySelectorAll('.lf-detail-btn').find(b => b.textContent.includes(label));
const overlayText = (m) => m._dom.body.querySelector('.lf-overlay')?.textContent || '';

test('decoy row: IP lookup shows its own IP with no match, not the attacker', () => {
    const m = open(vpnData());
    select(m, rowFor(m, 'w.price'));
    btn(m, 'LOOK UP IP').click();
    const t = overlayText(m);
    assert.match(t, /91\.108\.14\.4/);
    assert.match(t, /No match/);
    assert.doesNotMatch(t, /185\.220\.101\.47|Tor/);
    assert.equal(m.g.intel_seen, undefined, 'lookup of a non-anomaly IP must not count as progress');
});

test('decoy row: account view is its own account, built from the log', () => {
    const m = open(vpnData());
    select(m, rowFor(m, 'w.price'));
    btn(m, 'INVESTIGATE').click();
    const t = overlayText(m);
    assert.match(t, /w\.price/);
    assert.match(t, /Not used on 1 of 1/);
    assert.doesNotMatch(t, /Blake|m\.blake|IMPOSSIBLE/i);
    assert.equal(m.g.acct_seen, undefined);
});

test('anomaly row: real intel and account history, progress fires', () => {
    const m = open(vpnData());
    select(m, rowFor(m, 'm.blake'));
    btn(m, 'LOOK UP IP').click();
    assert.match(overlayText(m), /185\.220\.101\.47[\s\S]*Tor Exit Node/);
    assert.equal(m.g.intel_seen, true);
    btn(m, 'INVESTIGATE').click();
    assert.match(overlayText(m), /Marcus Blake/);
    assert.equal(m.g.acct_seen, true);
});

test('only one Session Detail card, including after a filter change', () => {
    const m = open(vpnData());
    select(m, rowFor(m, 'w.price'));
    select(m, rowFor(m, 'm.blake'));
    assert.equal(m._dom.logPane.querySelectorAll('.lf-session-detail').length, 1);
    m._dom.filterPane = new FakeEl('div');
    m._renderFilterPane = () => {};
    m._onFiltersChanged();
    assert.equal(m._dom.logPane.querySelectorAll('.lf-session-detail').length, 1);
});

test('flagging a non-anomalous row gives feedback and does not complete', () => {
    const m = open(vpnData());
    select(m, rowFor(m, 'w.price'));
    const flag = btn(m, 'FLAG');
    assert.ok(flag, 'flag button is offered on every row');
    flag.click();
    assert.equal(m._overlayMode, 'flag_rejected');
    assert.match(overlayText(m), /NOT THIS ONE/);
    assert.equal(m._sessionFlagged, false);
    assert.equal(m.g.done, undefined);
    // minigame still works afterwards
    m._closeOverlay();
    select(m, rowFor(m, 'm.blake'));
    assert.equal(m._dom.logPane.querySelectorAll('.lf-session-detail').length, 1);
});

test('m.blake prior (UK) row is not the anomaly; the RO row flags and completes', () => {
    const m = open(vpnData());
    const prior = m._logEntries.find(e => e.user === 'm.blake' && e.country === 'UK');
    assert.equal(m._isAnomalyEntry(prior), false);
    m._closeTimer = null;
    const real = rowFor(m, 'm.blake');
    assert.equal(m._isAnomalyEntry(real), true);
    select(m, real);
    btn(m, 'FLAG').click();
    assert.equal(m._overlayMode, 'flag_confirm');
    m.complete = () => {};
    m._onFlagConfirmed();
    assert.equal(m.g.done, true);
    clearTimeout(m._closeTimer);
});

test('ics_rdp config (sis02 shape): anomaly row keeps intel, other rows get no match', () => {
    const entries = [
        { timestamp: 't1', sessionId: 'S1', account: 'j.nakamura', sourceIp: '10.4.22.8', duration: '00:47', status: 'CLOSED', accessLevel: 'ENGINEER' },
        { timestamp: 't2', sessionId: 'S2', account: 'c.ellison', sourceIp: '185.220.101.45', duration: '04:46+', status: 'ACTIVE', accessLevel: 'CONTRACTOR' }
    ];
    const m = open({
        logType: 'ics_rdp', logEntries: entries,
        anomaly: { account: 'c.ellison', sourceIp: '185.220.101.45', status: 'ACTIVE' },
        threatIntel: { ip: '185.220.101.45', type: 'Tor Exit Node', knownBad: true },
        accountHistory: { account: 'c.ellison', fullName: 'C. Ellison', status: 'DEPROVISIONED' }
    });
    select(m, entries[0]);
    btn(m, 'LOOK UP IP').click();
    assert.match(overlayText(m), /10\.4\.22\.8[\s\S]*No match/);
    btn(m, 'INVESTIGATE').click();
    assert.match(overlayText(m), /j\.nakamura/);
    select(m, entries[1]);
    btn(m, 'LOOK UP IP').click();
    assert.match(overlayText(m), /Tor Exit Node/);
    btn(m, 'INVESTIGATE').click();
    assert.match(overlayText(m), /C\. Ellison/);
    assert.equal(m._isAnomalyEntry(entries[1]), true);
    assert.equal(m._isAnomalyEntry(entries[0]), false);
});
