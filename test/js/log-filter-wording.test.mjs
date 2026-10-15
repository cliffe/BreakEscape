// Log filter minigame: wording and reopen state come from the scenario (D8, 2026-10-09).
// Run with: node --test test/js/log-filter-wording.test.mjs
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


const anomaly = { user: 'm.blake', ip: '185.220.101.47', country: 'RO', mfa: 'NO', result: 'ACCEPT', timestamp: '2025-11-03 08:52', position: 5 };
const vpn = (extra = {}) => ({
    logType: 'vpn', entryCount: 10, anomaly, flagConfirmBody: 'Flag it?',
    completionActions: [{ type: 'set_global', key: 'vpn_done', value: true }],
    ...extra
});
const withTab = (extra = {}) => vpn({
    additionalTabs: [{ id: 'tool_history', type: 'audit_log', label: 'ENG TOOL HISTORY', auditEntries: [] }],
    requireAllTabs: true,
    progressActions: [{ type: 'set_global', key: 'history_seen', value: true, trigger: 'tab_viewed', tabId: 'tool_history' }],
    ...extra
});

function make(data, globals = {}) {
    globalThis.window.gameState.globalVariables = { ...globals };
    globalThis.window.npcManager = { setGlobalVariable: () => {} };
    return new LogFilterMinigame(new FakeEl('div'), { sprite: { scenarioData: { minigameData: data } } });
}

test('defaults are built from the scenario, with no mission-specific wording', () => {
    const plain = make(vpn());
    assert.equal(plain._completeBanner, '✓ INVESTIGATION COMPLETE: Session flagged.');
    const tabbed = make(withTab());
    assert.equal(tabbed._completeBanner, '✓ INVESTIGATION COMPLETE: Session flagged. ENG TOOL HISTORY reviewed.');
    assert.match(tabbed._nextTabPrompt, /Open the ENG TOOL HISTORY tab/);
    assert.equal(tabbed._nextTabButton, '[VIEW ENG TOOL HISTORY →]');
    const src = readFileSync(join(js, 'minigames/log-filter/log-filter-minigame.js'), 'utf8');
    assert.doesNotMatch(src, /SIS|sis_audit|jump_server_confirmed/, 'no sis02 names left in the engine');
});

test('scenario wording overrides the defaults', () => {
    const m = make(withTab({ completeBanner: 'Done.', nextTabPrompt: 'Go on.', nextTabButton: '[GO]' }));
    assert.deepEqual([m._completeBanner, m._nextTabPrompt, m._nextTabButton], ['Done.', 'Go on.', '[GO]']);
});

test('reopen: the completion global marks it done; tab_viewed globals mark tabs visited', () => {
    const m = make(withTab(), { vpn_done: true, history_seen: true });
    m._resumeStateFromGlobals();
    assert.equal(m._sessionFlagged, true);
    assert.equal(m._completionFired, true);
    assert.ok(m._tabsVisited.has('tool_history'));

    const fresh = make(withTab(), {});
    fresh._resumeStateFromGlobals();
    assert.equal(fresh._sessionFlagged, false);
    assert.ok(!fresh._tabsVisited.has('tool_history'));

    const explicit = make(vpn({ completedGlobal: 'other' }), { vpn_done: true });
    explicit._resumeStateFromGlobals();
    assert.equal(explicit._sessionFlagged, false, 'completedGlobal wins over the derived one');
});
