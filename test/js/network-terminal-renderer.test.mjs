// The Terminal renderer (Ops S6 unit 14): the log, the prompt, the quick commands and the use strip.
// Run with: node test/js/network-terminal-renderer.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, readdirSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mount as mountPanels, loadFixture, fixtureNames, settle } from './support/network-view-harness.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const NVSRC = join(js, 'minigames/network-view');

// The renderer and the pure modules it imports, copied beside a package.json (the repository folder is not an ES module package)
const tmp = mkdtempSync(join(tmpdir(), 'network-terminal-renderer-'));
process.on('exit', () => rmSync(tmp, { recursive: true, force: true }));
writeFileSync(join(tmp, 'package.json'), '{"type":"module"}\n');
const copyFolder = (rel) => {
    for (const name of readdirSync(join(js, rel))) {
        const sub = `${rel}/${name}`;
        if (statSync(join(js, sub)).isDirectory()) copyFolder(sub);
        else if (name.endsWith('.js')) { mkdirSync(dirname(join(tmp, sub)), { recursive: true }); writeFileSync(join(tmp, sub), readFileSync(join(js, sub), 'utf8')); }
    }
};
copyFolder('minigames/network-view');
const load = (f) => import(pathToFileURL(join(tmp, 'minigames/network-view', f)).href);
const { TerminalRenderer, HISTORY_MAX } = await load('network-view-terminal.js');
const { offers: offersOf } = await load('view-controls.js');
const { commandFor } = await load('terminal-grammar.js');
const FMT = await load('terminal-format.js');
const OM = await load('ops-model.js');

const clone = (v) => JSON.parse(JSON.stringify(v));
const viewOf = (name) => {
    const d = loadFixture(name);
    return clone({ ...d.footholds[0], techniques: d.techniques || loadFixture('techniques').techniques });
};
let n = 0;

/** A mounted Terminal on a view, with a recording ctx. */
function setup(view, { pending = [], unplugJack = null, keys = true } = {}) {
    document.body.innerHTML = '';
    const root = document.createElement('div');
    document.body.appendChild(root);
    const paused = [];
    window.pauseKeyboardInput = () => paused.push(1);
    const t = { calls: [], closed: 0, skins: [], paused, root };
    const footholdId = `term_${(n += 1)}`;
    t.footholdId = footholdId;
    t.log = FMT.logFor(footholdId, { create: true });
    t.ctx = {
        perform: (offer, echo) => { t.calls.push([offer, echo]); return undefined; },
        requestClose: () => { t.closed += 1; },
        requestSkin: (name) => { t.skins.push(name); return false; }
    };
    t.view = view;
    t.pendingSet = new Set(pending);
    t.offers = () => offersOf(t.view, { pending: t.pendingSet, unplugJack }).map(o => ({ ...o, command: commandFor(o, t.view) }));
    t.r = new TerminalRenderer();
    t.r.mount(root, t.ctx);
    t.draw = () => t.r.render(t.view, t.offers(), { footholdId });
    t.draw();
    t.input = root.querySelector('input');
    t.type = (text) => { t.input.value = text; t.input.dispatchEvent(new window.Event('input', { bubbles: true })); };
    t.enter = (text) => { if (text !== undefined) t.type(text); t.input.form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })); };
    t.key = (key, extra = {}) => {
        const e = new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extra });
        t.input.dispatchEvent(e);
        return e;
    };
    t.logText = () => [...root.querySelectorAll('.network-term-line-out')].map(e => e.textContent);
    t.buttons = () => [...root.querySelectorAll('.network-term-list button')];
    return t;
}

const attrKey = (btn) => {
    const own = btn.closest('[data-host-id], [data-resource-id], [data-network-id]');
    const parts = [btn.hasAttribute('data-unplug') ? 'unplug' : btn.dataset.action];
    if (own) parts.push(own.dataset.hostId || own.dataset.resourceId || own.dataset.networkId);
    for (const a of ['service', 'finding', 'technique']) {
        const el = btn.closest(`[data-${a}]`);
        if (el) parts.push(el.dataset[a]);
    }
    return parts.join('|');
};
const scanOffer = (t) => t.offers().find(o => o.action === 'scan');

test('a typed line that resolves calls perform once with the offer and the typed line', () => {
    const t = setup(viewOf('swept_hosts'));
    const want = scanOffer(t);
    assert.ok(want, 'the fixture offers a scan');
    t.enter(`scan ${want.ids.hostId}`);
    assert.equal(t.calls.length, 1);
    assert.equal(t.calls[0][0].action, 'scan');
    assert.equal(t.calls[0][0].target, want.target);
    assert.equal(t.calls[0][1], `scan ${want.ids.hostId}`);
    assert.equal(t.input.value, '');
});

test('a local line, a typo and a pending line call nothing, and log the echo then the reply', () => {
    const t = setup(viewOf('swept_hosts'));
    t.enter('help');
    assert.equal(t.calls.length, 0);
    let text = t.logText();
    assert.ok(text.some(l => l === '$ help'), 'echo');
    assert.ok(text.length > 3, 'reply');
    const before = text.length;
    t.enter('frobnicate');
    assert.equal(t.calls.length, 0);
    text = t.logText();
    assert.equal(text[before], '$ frobnicate');
    assert.ok(text.length > before + 1, 'a reply to the typo');

    const first = scanOffer(t);
    const p = setup(viewOf('swept_hosts'), { pending: [OM.pendingKey('scan', first.target)] });
    p.enter(`scan ${first.ids.hostId}`);
    assert.equal(p.calls.length, 0);
    assert.ok(p.logText().length >= 3, 'echo and the pending line');
});

test('an empty prompt does nothing', () => {
    const t = setup(viewOf('swept_hosts'));
    const before = t.logText().length;
    t.enter('   ');
    t.enter('');
    assert.equal(t.calls.length, 0);
    assert.equal(t.logText().length, before);
    assert.equal(t.r.history.length, 0);
});

test('every quick command calls perform with its offer and its command', () => {
    for (const name of ['swept_hosts', 'discovery_unswept', 'shares', 'findings_states', 'host_states']) {
        const t = setup(viewOf(name));
        const want = t.offers().filter(o => o.action !== 'use');
        const buttons = t.buttons().filter(b => !b.matches('[data-action="select-technique"]') && !b.classList.contains('network-term-fold'));
        assert.equal(buttons.length, want.length, name);
        buttons.forEach((b, i) => {
            b.click();
            const [offer, echo] = t.calls[t.calls.length - 1];
            assert.equal(offer.action, want[i].action, `${name} ${i}`);
            assert.equal(OM.pendingKey(offer.action, offer.target), OM.pendingKey(want[i].action, want[i].target));
            assert.equal(echo, want[i].command ?? undefined);
        });
        assert.equal(t.calls.length, want.length, name);
    }
});

test('the quick command holds the label in a span and the command in a code', () => {
    const t = setup(viewOf('swept_hosts'));
    const b = t.root.querySelector('[data-action="scan"]');
    assert.equal(b.querySelector('span').textContent, 'Scan');
    assert.equal(b.querySelector('code').textContent, scanOffer(t).command);
});

test('the two-press use: the first press alone calls nothing', () => {
    const t = setup(viewOf('techniques'));
    const tech = t.root.querySelector('[data-action="select-technique"]');
    assert.ok(tech, 'a held technique');
    const id = tech.closest('[data-technique]').dataset.technique;
    tech.click();
    assert.equal(t.calls.length, 0);
    assert.equal(t.input.value, `use ${id} on `);
    const uses = t.buttons().filter(b => b.dataset.action === 'use');
    assert.ok(uses.length > 0, 'the strip now holds the findings');
    assert.equal(t.buttons().filter(b => b.dataset.action === 'scan').length, 0, 'the full list is swapped out');
    const alias = uses[0].closest('[data-finding]').dataset.finding;
    assert.equal(uses[0].textContent, alias);
    uses[0].click();
    assert.equal(t.calls.length, 1);
    const [offer, echo] = t.calls[0];
    assert.equal(offer.action, 'use');
    assert.equal(offer.ids.techniqueId, id);
    assert.equal(echo, offer.command ?? undefined);
    assert.equal(t.input.value, '');
    assert.ok(t.buttons().some(b => b.dataset.action === 'select-technique'), 'back to the full list');
});

test('the X on the use strip returns to the full list and sends nothing', () => {
    const t = setup(viewOf('techniques'));
    t.root.querySelector('[data-action="select-technique"]').click();
    const x = t.root.querySelector('.network-term-back');
    assert.equal(x.textContent, 'X');
    x.click();
    assert.equal(t.calls.length, 0);
    assert.ok(t.buttons().some(b => b.dataset.action === 'select-technique'));
    assert.equal(t.root.querySelector('.network-term-back'), null);
});

test('hooks equal the Panels control for every fixture offer, and each title is the offer\'s (the Panels draw no title today)', async () => {
    let compared = 0;
    for (const name of fixtureNames()) {
        const unplug = name === 'planted_box';
        const h = await mountPanels(loadFixture(name), { unplug });
        const skip = new Set(['select-finding', 'select-technique', 'use']);
        const panels = h.controls().filter(b => !skip.has(b.dataset.action))
            .map(b => attrKey(b)).sort();
        h.end();
        const entry = loadFixture(name).footholds[0];
        const jack = unplug ? (entry.sourceId || 'port_a') : null;
        const t = setup(clone(entry), { unplugJack: jack });
        const term = t.buttons().filter(b => !skip.has(b.dataset.action) && !b.classList.contains('network-term-fold') && !b.classList.contains('network-term-back'))
            .map(b => attrKey(b)).sort();
        assert.deepEqual(term, panels, name);
        compared += term.length;
        for (const b of t.buttons().filter(x => x.dataset.action && !skip.has(x.dataset.action) && !x.classList.contains('network-term-fold') && !x.classList.contains('network-term-back'))) {
            assert.equal(b.title, t.offers().find(o => o.action === b.dataset.action).title, `${name} ${b.dataset.action}`);
        }
    }
    assert.ok(compared > 20, `compared ${compared} controls`);
});

test('a pending offer shows disabled with the Panels pending label', () => {
    const view = viewOf('swept_hosts');
    const probe = setup(view);
    const first = probe.offers().find(o => o.action === 'scan');
    const t = setup(view, { pending: [OM.pendingKey('scan', first.target)] });
    const b = t.root.querySelector(`[data-host-id="${first.ids.hostId}"] [data-action="scan"]`);
    assert.equal(b.disabled, true);
    assert.equal(b.querySelector('span').textContent, 'Scanning...');
    b.click();
    assert.equal(t.calls.length, 0);
});

test('folding uses the hidden attribute only', () => {
    const t = setup(viewOf('swept_hosts'));
    const list = t.root.querySelector('.network-term-list');
    assert.equal(list.hidden, false);
    t.root.querySelector('.network-term-fold').click();
    assert.equal(list.hasAttribute('hidden'), true);
    assert.equal(t.r.testState().folded, true);
    assert.equal(list.getAttribute('style'), null);
    t.draw();
    assert.equal(t.root.querySelector('.network-term-list').hidden, true, 'a redraw keeps the fold');
    t.root.querySelector('.network-term-fold').click();
    assert.equal(list.hasAttribute('hidden'), false);
});

test('history walks 20 entries with up and down and keeps the draft', () => {
    const t = setup(viewOf('swept_hosts'));
    for (let i = 0; i < 25; i++) t.enter(`nonsense${i}`);
    assert.equal(t.r.history.length, HISTORY_MAX);
    t.type('half');
    t.key('ArrowUp');
    assert.equal(t.input.value, 'nonsense24');
    t.key('ArrowUp'); t.key('ArrowUp');
    assert.equal(t.input.value, 'nonsense22');
    for (let i = 0; i < 40; i++) t.key('ArrowUp');
    assert.equal(t.input.value, 'nonsense5');
    t.key('ArrowDown');
    assert.equal(t.input.value, 'nonsense6');
    for (let i = 0; i < 40; i++) t.key('ArrowDown');
    assert.equal(t.input.value, 'half');
});

test('Tab completes, and data-own-tab-cycle is on the input only while it holds text', () => {
    const t = setup(viewOf('swept_hosts'));
    assert.equal(t.input.hasAttribute('data-own-tab-cycle'), false);
    t.type('sw');
    assert.equal(t.input.hasAttribute('data-own-tab-cycle'), true);
    const e = t.key('Tab');
    assert.equal(e.defaultPrevented, true);
    assert.ok(t.input.value.startsWith('sweep'), t.input.value);
    t.type('');
    assert.equal(t.input.hasAttribute('data-own-tab-cycle'), false);
    assert.equal(t.key('Tab').defaultPrevented, false, 'an empty prompt leaves Tab alone');
    t.type('x');
    t.enter();
    assert.equal(t.input.hasAttribute('data-own-tab-cycle'), false);
});

test('the prompt has a visible label, autocomplete off and no autocapitalise or spellcheck', () => {
    const t = setup(viewOf('swept_hosts'));
    assert.equal(t.input.type, 'text');
    const label = t.root.querySelector(`label[for="${t.input.id}"]`);
    assert.ok(label && label.textContent === FMT.PROMPT_LABEL);
    assert.equal(t.input.getAttribute('autocomplete'), 'off');
    assert.equal(t.input.getAttribute('autocapitalize'), 'off');
    assert.equal(t.input.getAttribute('spellcheck'), 'false');
    const log = t.root.querySelector('[role="log"]');
    assert.equal(log.getAttribute('aria-live'), 'polite');
});

test('showResult writes no log line', () => {
    const t = setup(viewOf('swept_hosts'));
    const lines = t.log.lines.length;
    const shown = t.logText().length;
    t.r.showResult(scanOffer(t), { success: true }, { footholdId: t.footholdId });
    assert.equal(t.log.lines.length, lines);
    assert.equal(t.logText().length, shown);
});

test('lines the scene writes to the log appear on the next render, and the log is not redrawn', () => {
    const t = setup(viewOf('swept_hosts'));
    const first = t.root.querySelector('.network-term-line-out');
    FMT.appendLine(t.log, [{ text: 'from the hooks', cls: 'ok' }]);
    t.draw();
    assert.equal(t.root.querySelector('.network-term-line-out'), first, 'the first line is the same element');
    assert.equal(t.logText().pop(), 'from the hooks');
    assert.equal(t.root.querySelector('.network-term-span.ok').textContent, 'from the hooks');
});

test('noteChange appends the change line once and ignores the Panels lines', () => {
    const t = setup(viewOf('swept_hosts'));
    const shown = t.logText().length;
    t.r.noteChange({ footholdId: t.footholdId }, 'notice');
    t.r.noteChange({ footholdId: t.footholdId }, 'unplug');
    assert.equal(t.logText().length, shown);
    t.r.noteChange({ footholdId: t.footholdId });
    assert.equal(t.logText().length, shown + 1);
    assert.equal(t.logText().pop(), FMT.CHANGE_LINE_TEXT);
});

test('mount pauses the game keys; exit closes; panels asks for the Panels skin; clear empties the screen only', () => {
    const t = setup(viewOf('swept_hosts'));
    assert.equal(t.paused.length, 1);
    t.enter('panels');
    assert.deepEqual(t.skins, ['gui']);
    t.enter('exit');
    assert.equal(t.closed, 1);
    t.enter('clear');
    assert.equal(t.logText().length, 0);
    assert.ok(t.log.lines.length > 1, 'the log keeps its lines');
    t.enter('help');
    assert.equal(t.logText()[0], '$ help');
    assert.equal(t.calls.length, 0);
});

test('the mode changes with msfconsole and use, shows in the mark, and is dropped on unmount', () => {
    const t = setup(viewOf('findings_states'));
    t.enter('msfconsole');
    assert.equal(t.r.testState().mode.prompt, 'msf');
    assert.ok(t.root.querySelector('.network-term-mark').textContent.startsWith('msf'));
    t.enter('search');
    assert.equal(t.calls.length, 0);
    t.enter('use 1');
    assert.ok(t.r.testState().mode.module, 'a module is selected');
    t.enter('back');
    assert.equal(t.r.testState().mode.module, null);
    t.r.unmount();
    assert.deepEqual(t.r.mode, { prompt: 'shell', module: null, technique: null });
    assert.equal(t.root.querySelector('.network-term'), null);
});

test('testState has the skin, the log lines, the fold and the mode', () => {
    const t = setup(viewOf('swept_hosts'));
    const s = t.r.testState();
    assert.equal(s.skin, 'cli');
    assert.deepEqual(s.log, t.logText());
    assert.equal(s.folded, false);
    assert.deepEqual(s.mode, { prompt: 'shell', module: null, technique: null });
});

test('the log is capped on screen as in the log itself', () => {
    const t = setup(viewOf('swept_hosts'));
    for (let i = 0; i < FMT.LOG_CAP + 20; i++) FMT.appendLine(t.log, [{ text: `line ${i}` }]);
    t.draw();
    assert.equal(t.logText().length, FMT.LOG_CAP);
    assert.equal(t.logText().pop(), `line ${FMT.LOG_CAP + 19}`);
});

test('hostile text from the scenario and the server goes in as text, never as markup', () => {
    const evil = '<img src=x onerror="window.__pwned=1"><script>window.__pwned=2</script>&amp;';
    const view = viewOf('findings_states');
    view.hosts[0].name = evil;
    view.hosts[0].host = evil;
    for (const f of view.hosts[0].findings || []) { f.alias = f.alias; f.summary = evil; }
    view.techniques = { phish: { name: evil, summary: evil, worksOn: [], itemId: 'card_phish' } };
    const t = setup(view);
    FMT.appendLine(t.log, [{ text: evil, cls: 'bad' }, { text: evil }]);
    t.enter(evil);
    t.enter('show');
    t.draw();
    t.r.showResult(null, null, { footholdId: t.footholdId, notice: evil, status: evil });
    assert.equal(t.root.querySelectorAll('img, script, style, iframe').length, 0);
    assert.equal(window.__pwned, undefined);
    for (const el of t.root.querySelectorAll('*')) {
        for (const a of el.attributes) assert.ok(!/^on/i.test(a.name), `attribute ${a.name}`);
    }
    assert.ok(t.logText().some(l => l.includes(evil)), 'the hostile text is shown literally');
    assert.ok(t.root.textContent.includes(evil));
});

test('control characters and an unlisted class in a log line cannot reach the screen', () => {
    const t = setup(viewOf('swept_hosts'));
    FMT.appendLine(t.log, [{ text: 'a‮b\u0007c', cls: '"><x onclick=1' }]);
    t.draw();
    const el = [...t.root.querySelectorAll('.network-term-span')].pop();
    assert.ok(!/[‮\u0007]/.test(el.textContent));
    assert.equal(el.className, 'network-term-span');
});

test('the renderer source names no HTML-writing call, eval, request or storage', () => {
    const src = readFileSync(join(NVSRC, 'network-view-terminal.js'), 'utf8');
    assert.doesNotMatch(src, /innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\b|new Function/);
    assert.doesNotMatch(src, /set(Timeout|Interval)\(\s*['"`]/);
    assert.doesNotMatch(src, /fetch\(|ApiClient|networkLinks|window\.open|window\.start|localStorage|window\.location/);
    assert.doesNotMatch(src, /eventDispatcher|\.emit\(|\._emit\(/);
});

test('search numbers and use numbers are one list: use <shown number> picks that hit, then check and run name its finding', async () => {
    const FW = await load('cli-gen/framework-console.js');
    const GR = await load('terminal-grammar.js');
    const view = viewOf('techniques');
    // the filtered hit is not the first module of the whole list
    const all = GR.modulesOf(view);
    const target = all.find(m => m.alias === 'f10');
    assert.ok(target && target.number > 1, 'the fixture has a later finding to search for');
    for (const row of view.hosts) for (const f of row.findings || []) if (f.alias === 'f10') f.status = 'unconfirmed';
    const t = setup(view);
    t.enter('msfconsole');
    t.enter('search f10');
    const shown = t.logText().filter(l => /f10/.test(l) && !/search/.test(l));
    assert.equal(shown.length, 1, 'one hit ' + JSON.stringify(t.logText()));
    assert.match(shown[0], new RegExp(`^${target.number}\\s`), 'the hit carries the number use counts');
    t.enter(`use ${target.number}`);
    assert.equal(t.r.testState().mode.module, target.findingId);
    t.enter('check');
    assert.equal(t.calls.length, 1);
    assert.equal(t.calls[0][0].action, 'confirm');
    assert.equal(t.calls[0][0].ids.findingId, target.findingId);
    for (const row of t.view.hosts) for (const f of row.findings || []) if (f.alias === 'f10') f.status = 'confirmed';
    t.draw();
    t.enter('set TECHNIQUE phish');
    t.enter('run');
    const last = t.calls[t.calls.length - 1][0];
    assert.equal(last.action, 'use');
    assert.equal(last.ids.findingId, target.findingId);

    // both lists keep one order even with another block placed before the own one
    const v2 = clone(view);
    const extra = clone(v2.networks[0]);
    extra.id = 'other_net';
    extra.hosts = extra.hosts.map(h => ({ ...h, id: `${h.id}_o`, findings: (h.findings || []).map(f => ({ ...f, id: `${f.id}_o`, alias: `${f.alias}o`, hostId: `${h.id}_o` })) }));
    v2.networks = [extra, ...v2.networks];
    assert.deepEqual(FW.moduleList(v2).map(m => [m.number, m.finding.id]), GR.modulesOf(v2).map(m => [m.number, m.findingId]));
});

test('R1-C7: a redraw keeps focus on the quick command that had it; the log is silent until its first fill is drawn', () => {
    const t = setup(viewOf('swept_hosts'));
    const btns = t.buttons().filter(b => !b.disabled);
    assert.ok(btns.length >= 2);
    const target = btns[btns.length - 1];
    const want = attrKey(target);
    target.focus();
    assert.equal(document.activeElement, target);
    t.draw();
    assert.notEqual(document.activeElement, t.input, 'focus did not move to the prompt');
    assert.equal(attrKey(document.activeElement), want);
    // a command that is gone: the prompt takes the focus
    t.buttons().filter(b => !b.disabled)[0].focus();
    t.view = viewOf('plain');
    t.draw();
    assert.ok(document.activeElement === t.input || t.root.contains(document.activeElement));
    // the first fill comes before the log speaks
    const fresh = document.createElement('div');
    document.body.appendChild(fresh);
    const r = new TerminalRenderer();
    r.mount(fresh, t.ctx);
    assert.equal(fresh.querySelector('[role="log"]').getAttribute('aria-live'), 'off');
    r.render(t.view, [], { footholdId: t.footholdId });
    assert.equal(fresh.querySelector('[role="log"]').getAttribute('aria-live'), 'polite');
});

test('R1-C13: a Tab that adds nothing, with several matches, lists them as one note line', () => {
    const t = setup(viewOf('swept_hosts'));
    t.type('s');          // sweep, scan, search... more than one verb starts with s
    const lines = t.logText().length;
    t.key('Tab');
    const first = t.input.value;
    t.type(first);
    const shown = t.logText().length;
    t.key('Tab');
    const after = t.logText();
    assert.ok(t.input.value === first, 'nothing more to add');
    assert.ok(after.length > shown || shown > lines, JSON.stringify(after.slice(-2)));
    const last = after[after.length - 1];
    assert.ok(/\bscan\b/.test(last) && /\bsweep\b/.test(last), last);
    // one match completes and lists nothing
    const n = t.logText().length;
    t.type('swee'); t.key('Tab');
    assert.equal(t.logText().length, n);
});

test('R2-8: a held Tab key does not grow the log: the same matches line is written once', () => {
    const t = setup(viewOf('swept_hosts'));
    t.type('s');
    t.key('Tab');
    t.type(t.input.value);
    t.key('Tab');
    const after = t.logText().length;
    for (let i = 0; i < 1000; i++) t.key('Tab');
    assert.equal(t.logText().length, after);
});
