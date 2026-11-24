// Parity of the two skins of the network view (Ops S6 unit 16).
//
// Everything here drives the real scene (network-view-minigame.js), the real Panels renderer and the real Terminal
// renderer, through the unit 01 harness. There is no stand-in renderer. The claim under test: whatever a player does in
// either skin, the same offers go out as the same requests, the same events come back, and nothing is sent twice.
//
// The paths (PATHS):
//   button  Panels: a `[data-action]` button or `[data-unplug]`
//   select  Panels: select a finding, select a card, press Use (once by pointer, once by keyboard)
//   drag    Panels: the drag events on a card and a finding
//   typed   Terminal: a line and Enter (the offer's own command, the plain game verb, and the framework steps)
//   quick   Terminal: a quick command (two presses for a use)
//
// jsdom does not turn Enter on a focused button into a click, so the keyboard press sends the keydown and then the
// click a browser makes from it (a click with `detail` 0). A disabled button swallows a press, as in a browser.
// A drag is sent in the order a browser sends it (dragstart, dragover, drop, dragend); `DRAG_EVENTS` is the set.
//
// Run with: node test/js/network-skin-parity.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mount, loadFixture, fixtureNames, VARIANTS, settle, imp } from './support/network-view-harness.mjs';

const NV = 'minigames/network-view/';
const { TerminalRenderer } = await imp(`${NV}network-view-terminal.js`);
const { PanelsRenderer, DRAG_EVENTS } = await imp(`${NV}network-view-panels.js`);
const MODEL = await imp(`${NV}ops-model.js`);
const GRAMMAR = await imp(`${NV}terminal-grammar.js`);
const FMT = await imp(`${NV}terminal-format.js`);
const TEXTS = await imp(`${NV}view-texts.js`);
const choice = await imp(`${NV}skin-choice.js`);

const here = dirname(fileURLToPath(import.meta.url));
const REFUSAL_CODES = JSON.parse(readFileSync(join(here, '../fixtures/files/ops_refusal_codes.json'), 'utf8'));

export const PATHS = Object.freeze(['button', 'select', 'drag', 'typed', 'quick']);

const clone = (v) => JSON.parse(JSON.stringify(v));
const J = (v) => JSON.stringify(v);

// What each renderer's showResult is handed (the scene must hand each answer to the mounted skin once)
const shown = { gui: 0, cli: 0 };
for (const [cls, key] of [[PanelsRenderer, 'gui'], [TerminalRenderer, 'cli']]) {
    const real = cls.prototype.showResult;
    cls.prototype.showResult = function (...a) { shown[key] += 1; return real.apply(this, a); };
}

test.beforeEach(() => { choice.forgetPress(); delete window.gameScenario; shown.gui = 0; shown.cli = 0; });

// ---------------------------------------------------------------------------------------------
// Bodies
// ---------------------------------------------------------------------------------------------

const CARDS = loadFixture('techniques').techniques; // phish, phish_sms
const FOUR = loadFixture('findings_states').footholds[0].hosts[0].findings; // f1 unconfirmed, f2 confirmed, f3 false, f4 fixed
const SHARES = loadFixture('shares').footholds[0].hosts.filter(r => r.id !== 'locked_share'); // open_share, queue

/**
 * One view that offers every move: an unswept network (Sweep), a pc (Sign in, Scan), a scanned printer with a service
 * (Check) and four findings (Confirm on the unconfirmed one), an unscanned printer (Scan), two resources (Open, Look),
 * and two held cards (Use on every finding).
 */
function richBody() {
    const b = clone(loadFixture('swept_hosts'));
    const fh = b.footholds[0];
    fh.networks[0].swept = false;
    for (const list of [fh.hosts, fh.networks[0].hosts]) {
        list.find(r => r.id === 'print01').findings = clone(FOUR);
        list.push(...clone(SHARES));
    }
    b.techniques = clone(CARDS);
    return b;
}

const BODIES = Object.freeze({
    ...Object.fromEntries(fixtureNames().map(n => [n, () => clone(loadFixture(n))])),
    rich: richBody
});
const ALL_VARIANTS = Object.freeze([
    ...VARIANTS.map(v => ({ name: v.name, body: BODIES[v.fixture], unplug: v.unplug })),
    { name: 'rich', body: richBody, unplug: false },
    { name: 'rich.at_jack', body: richBody, unplug: true }
]);

// ---------------------------------------------------------------------------------------------
// Driving the two skins
// ---------------------------------------------------------------------------------------------

const root = (h) => h.view().container;
const q = (h, sel) => root(h).querySelector(sel);
const qa = (h, sel) => [...root(h).querySelectorAll(sel)];
const text = (h) => FMT.logFor(h.view().footholdId)?.lines.map(l => l.map(s => s.text).join('')) ?? [];
/** The newest line of the log, by identity: it changes with every line written, even when the log is full and drops its oldest. */
const lastLine = (h) => { const l = FMT.logFor(h.view().footholdId)?.lines; return l?.length ? l[l.length - 1] : null; };
const switchTo = async (h) => { q(h, '[data-skin-switch]').click(); await settle(2); };
const mountedSkin = (h) => h.view().mounted;
const hasOps = (h) => h.view().hasOps();

/** A press as a user makes it. A disabled button takes none. */
function activate(btn, how = 'pointer') {
    if (!btn || btn.disabled) return false;
    if (how === 'keyboard') {
        btn.focus();
        btn.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, detail: 0 }));
    } else {
        for (const t of ['pointerdown', 'mousedown', 'pointerup', 'mouseup']) btn.dispatchEvent(new window.Event(t, { bubbles: true }));
        btn.click();
    }
    return true;
}

const aliasOf = (view, findingId) => MODEL.findFinding(view, findingId)?.finding.alias ?? null;

/** The key an offer and the control for it share: the action and what it names. */
function offerKey(o, view) {
    const i = o.ids || {};
    switch (o.action) {
        case 'sweep': return `sweep|${i.networkId}`;
        case 'check': return `check|${i.hostId}|${i.service}`;
        case 'confirm': return `confirm|${i.findingId}`;
        case 'open': return `open|${i.hostId ?? i.resourceId}`;
        case 'observe': return `observe|${i.resourceId}`;
        case 'unplug': return 'unplug';
        case 'use': return `use|${i.techniqueId}|${i.findingId}`;
        default: return `${o.action}|${i.hostId}`;
    }
}
function buttonKey(btn, view) {
    const action = btn.hasAttribute('data-unplug') ? 'unplug' : btn.dataset.action;
    const host = btn.closest('[data-host-id]')?.dataset.hostId;
    const res = btn.closest('[data-resource-id]')?.dataset.resourceId;
    switch (action) {
        case 'sweep': return `sweep|${btn.closest('[data-network-id]')?.dataset.networkId}`;
        case 'check': return `check|${host}|${btn.closest('[data-service]')?.dataset.service}`;
        case 'confirm': return `confirm|${MODEL.findFinding(view, btn.closest('[data-finding]')?.dataset.finding)?.finding.id}`;
        case 'open': return `open|${host ?? res}`;
        case 'observe': return `observe|${res}`;
        case 'unplug': return 'unplug';
        default: return `${action}|${host}`;
    }
}
const buttonFor = (h, offer) => [...root(h).querySelectorAll('[data-action], [data-unplug]')]
    .find(b => !['select-finding', 'select-technique', 'use'].includes(b.dataset.action) && buttonKey(b, h.view().view) === offerKey(offer, h.view().view)) || null;

/** The offers as the scene hands them to the renderer now (with their Terminal lines). */
const offersOf = (h) => h.view().currentOffers();
const findOffer = (h, key) => offersOf(h).find(o => offerKey(o, h.view().view) === key) || null;

async function typeLine(h, line) {
    const input = q(h, '.network-term-input');
    input.value = line;
    input.form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await settle(2);
}

/** Panels: pick the card and the finding (only what is not picked already), then Use. */
function panelsSelect(h, offer, how) {
    const st = h.view();
    const alias = aliasOf(st.view, offer.ids.findingId);
    if (st.selectedTechnique !== offer.ids.techniqueId) activate(q(h, `[data-technique="${offer.ids.techniqueId}"] [data-action="select-technique"]`));
    if (st.selectedFinding !== offer.ids.findingId) activate(q(h, `[data-finding="${alias}"] [data-action="select-finding"]`));
    return activate(q(h, '[data-techniques] [data-action="use"]'), how);
}

/** Panels: a card dragged onto a finding, the events in the order a browser sends them. */
function panelsDrag(h, offer) {
    const alias = aliasOf(h.view().view, offer.ids.findingId);
    const card = q(h, `[data-technique="${offer.ids.techniqueId}"]`);
    const target = q(h, `[data-finding="${alias}"]`);
    if (!card || !target) return false;
    const fire = (el, name) => el.dispatchEvent(new window.Event(name, { bubbles: true, cancelable: true }));
    for (const name of ['dragstart', 'dragover', 'drop', 'dragend']) fire(name === 'dragstart' ? card : (name === 'dragend' ? card : target), name);
    return true;
}

/** Terminal: the card's quick command, then the finding's. */
function terminalQuickUse(h, offer) {
    const alias = aliasOf(h.view().view, offer.ids.findingId);
    activate(q(h, `[data-technique="${offer.ids.techniqueId}"] [data-action="select-technique"]`));
    return activate(q(h, `[data-technique="${offer.ids.techniqueId}"][data-finding="${alias}"] [data-action="use"]`));
}

const verbLine = (offer, view) => {
    const i = offer.ids || {};
    switch (offer.action) {
        case 'sweep': return `sweep ${i.networkId}`;
        case 'scan': return `scan ${i.hostId}`;
        case 'check': return `check ${i.hostId} ${i.service}`;
        case 'confirm': return `confirm ${aliasOf(view, i.findingId)}`;
        case 'use': return `use ${i.techniqueId} on ${aliasOf(view, i.findingId)}`;
        case 'sign-in': return `signin ${i.hostId}`;
        case 'open': return `open ${i.hostId ?? i.resourceId}`;
        case 'observe': return `look ${i.resourceId}`;
        default: return 'unplug';
    }
};
const frameworkLines = (offer, view) => {
    const i = offer.ids || {};
    const mod = GRAMMAR.modulesOf(view).find(m => m.findingId === i.findingId)?.module;
    if (offer.action === 'confirm') return ['msfconsole', `use ${mod}`, 'check'];
    if (offer.action === 'use') return ['msfconsole', `use ${mod}`, `set TECHNIQUE ${i.techniqueId}`, 'run'];
    // check <host> <service> is the module check inside the framework console, so the scanner line stands for it there
    return ['msfconsole', offer.action === 'check' ? offer.command : verbLine(offer, view)];
};

/** One press of an offer by one path, on a mount in the right skin. Resolves once it has settled. */
async function press(h, offer, path) {
    const view = h.view().view;
    switch (path) {
        case 'button': return activate(buttonFor(h, offer));
        case 'select': case 'select:pointer': return panelsSelect(h, offer, 'pointer');
        case 'select:keyboard': return panelsSelect(h, offer, 'keyboard');
        case 'drag': return panelsDrag(h, offer);
        case 'typed': case 'typed:command': return typeLine(h, offer.command);
        case 'typed:verb': return typeLine(h, verbLine(offer, view));
        case 'typed:framework': for (const l of frameworkLines(offer, view)) await typeLine(h, l); return true;
        case 'quick': return offer.action === 'use' ? terminalQuickUse(h, offer) : activate(buttonFor(h, offer));
        default: throw new Error(`no such path ${path}`);
    }
}
const skinOfPath = (p) => (/^(button|select|drag)/.test(p) ? 'gui' : 'cli');

/** The API calls of a press, without the refetch the scene makes after a success. */
const sent = (rec) => rec.calls.filter(c => c[0] !== 'network');
/** The one effect a press has: a request, or a screen opened, or a row's own move (its event). */
const effects = (rec) => {
    const calls = sent(rec);
    const row = rec.events.some(([n]) => n === 'network_host_opened');
    return calls.length + rec.opened.length + (!calls.length && !rec.opened.length && row ? 1 : 0);
};

/** The request an offer must send (what the core's perform sends). */
function expectedCall(offer, h) {
    const fid = h.view().footholdId;
    const i = offer.ids || {};
    switch (offer.action) {
        case 'sweep': return ['scan', fid, { networkId: i.networkId }];
        case 'scan': return ['scan', fid, { hostId: i.hostId }];
        case 'check': return ['check', fid, { hostId: i.hostId, service: i.service }];
        case 'confirm': return ['confirm', fid, { findingId: i.findingId }];
        case 'use': return ['technique', fid, { findingId: i.findingId, itemId: MODEL.techniqueItemId(h.view().view, i.techniqueId) }];
        case 'unplug': return ['unplug', h.view().unplugJack];
        default: return null;
    }
}

function same(a, b, label, nameA, nameB) {
    if (J(a) !== J(b)) assert.fail(`${label}\n    ${nameA}: ${J(a)}\n    ${nameB}: ${J(b)}`);
}

/** Mounts a variant in a skin; the Terminal only where the view has an ops block. Returns null when it cannot. */
async function open(variant, skin, extra = {}) {
    const h = await mount(variant.body(), { unplug: variant.unplug, params: { skin }, ...extra });
    if (skin === 'cli' && !hasOps(h)) { h.end(); return null; }
    return h;
}

// ---------------------------------------------------------------------------------------------
// 1 and 2: every press is one offer, and every path to an offer sends the same call
// ---------------------------------------------------------------------------------------------

for (const variant of ALL_VARIANTS) {
    test(`1+2 ${variant.name}: each Panels control is one offer's call; each path to an offer sends that same call`, async () => {
        const probe = await open(variant, 'gui');
        const controls = probe.controls().map(b => ({ action: b.hasAttribute('data-unplug') ? 'unplug' : b.dataset.action, key: buttonKey(b, probe.view().view) }));
        const offerKeys = new Set(offersOf(probe).map(o => offerKey(o, probe.view().view)));
        const offers = offersOf(probe).filter(o => o.action !== 'use').map(o => ({ key: offerKey(o, probe.view().view), action: o.action }));
        probe.end();

        // Rule 1: press each control on a fresh mount
        const byKey = new Map();
        for (let i = 0; i < controls.length; i++) {
            const c = controls[i];
            const h = await open(variant, 'gui');
            const offer = findOffer(h, c.key);
            const want = offer ? expectedCall(offer, h) : null;
            activate(h.controls()[i]);
            await settle(2);
            const rec = h.record();
            if (['select-finding', 'select-technique', 'use'].includes(c.action)) {
                assert.equal(effects(rec), 0, `${variant.name}: ${c.action} (a pick or a Use with nothing picked) sends nothing`);
            } else {
                assert.ok(offer, `${variant.name}: control ${c.key} has no offer in the list`);
                assert.equal(effects(rec), 1, `${variant.name}: ${c.key} records exactly one effect, got ${J(rec)}`);
                if (want) same(sent(rec), [want], `${variant.name}: ${c.key} sent a call no offer explains`, 'sent', 'offer');
                byKey.set(c.key, rec);
            }
            h.end();
        }
        // An offer with no control in Panels would be unreachable there
        for (const o of offers) assert.ok(byKey.has(o.key), `${variant.name}: offer ${o.key} has no Panels control`);
        assert.ok([...byKey.keys()].every(k => offerKeys.has(k)));

        // Rule 2: the Terminal paths to each offer send what the button sent
        for (const o of offers) {
            const ref = byKey.get(o.key);
            for (const path of ['typed:command', 'typed:verb', 'typed:framework', 'quick']) {
                const h = await open(variant, 'cli');
                if (!h) break;
                const offer = findOffer(h, o.key);
                assert.ok(offer, `${variant.name}: ${o.key} is offered in the Terminal`);
                assert.equal(offer.pending, undefined);
                await press(h, offer, path);
                await settle(2);
                same(h.record(), ref, `${variant.name}: ${o.key} by ${path} differs from the Panels button`, path, 'button');
                h.end();
            }
        }
    });
}

// ---------------------------------------------------------------------------------------------
// 3: every verb against every accepted token
// ---------------------------------------------------------------------------------------------

const VERBS = ['sweep', 'scan', 'check', 'confirm', 'signin', 'login', 'connect', 'open', 'look', 'use', 'run', 'exploit', 'nmap',
    'search', 'info', 'set', 'unset', 'sessions', 'show', 'ls', 'back', 'help', 'unplug', 'zz'];

function tokensOf(view) {
    const rows = [...(view.hosts || [])];
    for (const b of view.networks || []) rows.push(...(b.hosts || []));
    const t = new Set(['', 'on', '-sV', '-sn', '-sU', '--script', 'vuln', '-p', '80', '-Pn', '1', '2', '99', 'zz', '*', 'TECHNIQUE', 'options']);
    for (const r of rows) {
        t.add(r.id); if (r.address) t.add(r.address); if (r.host) t.add(r.host);
        for (const s of r.services || []) { t.add(s.name); t.add(String(s.port)); }
        for (const f of r.findings || []) { t.add(f.id); t.add(f.alias); }
    }
    for (const b of view.networks || []) { t.add(b.id); if (b.range) t.add(b.range); }
    for (const id of Object.keys(view.techniques || {})) t.add(id);
    for (const m of GRAMMAR.modulesOf(view)) t.add(m.module);
    return [...t];
}

function linesFor(view) {
    const toks = tokensOf(view);
    const out = [];
    for (const v of VERBS) {
        out.push(v);
        for (const t of toks) out.push(`${v} ${t}`);
    }
    const host = 'print01';
    out.push(`check ${host} web`, `check ${host} 80`, `check ${host} zz`, `nmap -sV --script vuln -p 80 ${host}`, `nmap -sn lab_net`,
        'use phish on f1', 'use phish f1', 'use phish on f9', 'use zz on f1', 'use phish_sms on f3', 'use phish on f4', 'use phish on f1 f2',
        'scan print01; scan print02', 'scan print02; show', 'msf > use f1; check', 'msf (f1) > check', '$ scan print02', 'scan print02 | cat');
    return out;
}

for (const mode of ['shell', 'framework']) {
    test(`3 every verb against every accepted token, in the ${mode} form: one listed call, or nothing and a message`, async () => {
        const h = await mount(richBody(), { params: { skin: 'cli' } });
        if (mode === 'framework') await typeLine(h, 'msfconsole');
        const lines = linesFor(h.view().view);
        assert.ok(lines.length > 500);
        let nSent = 0;
        let nMessage = 0;
        for (const line of lines) {
            const offersBefore = offersOf(h);
            const wanted = offersBefore.filter(o => !o.pending).map(o => expectedCall(o, h)).filter(Boolean).map(J);
            const rowIds = new Set(offersBefore.filter(o => ['sign-in', 'open', 'observe'].includes(o.action)).map(o => o.ids.hostId ?? o.ids.resourceId));
            const logBefore = lastLine(h);
            h.calls.length = 0; h.opened.length = 0; h.events.length = 0; h.toasts.length = 0;
            await typeLine(h, line);
            const rec = h.record();
            const n = effects(rec);
            assert.ok(n <= 1, `${mode}: "${line}" records ${n} effects: ${J(rec)}`);
            if (n === 1) {
                nSent += 1;
                const calls = sent(rec);
                if (calls.length) assert.ok(wanted.includes(J(calls[0])), `${mode}: "${line}" sent ${J(calls[0])}, which no offer explains`);
                else {
                    const id = rec.opened[0]?.[1]?.id ?? rec.opened[0]?.[1] ?? rec.events.find(([name]) => name === 'network_host_opened')[1].hostId;
                    assert.ok(rowIds.has(id), `${mode}: "${line}" moved row ${id}, which no offer lists`);
                }
            } else {
                nMessage += 1;
                const clearing = /^(clear|exit|quit|panels)\b/.test(line);
                if (!clearing && line.trim() !== '') assert.ok(lastLine(h) !== logBefore, `${mode}: "${line}" sent nothing and printed nothing`);
            }
            // A line that only changed the prompt mode is put back to the form under test
            if (mode === 'framework' && h.view().getTestState().mode?.prompt !== 'msf') await typeLine(h, 'msfconsole');
            if (!h.view() || h.view().status !== 'ready') assert.fail(`${mode}: "${line}" ended the view`);
        }
        assert.ok(nSent > 10 && nMessage > 100, `sent ${nSent}, printed ${nMessage}`);
        h.end();
    });
}

// ---------------------------------------------------------------------------------------------
// 4: use pairs
// ---------------------------------------------------------------------------------------------

test('4 use: two cards and four findings, eight pairs, each by every use path, each sending that pair\'s finding and item', async () => {
    const probe = await mount(richBody(), { params: { skin: 'gui' } });
    const uses = offersOf(probe).filter(o => o.action === 'use');
    assert.equal(uses.length, 8, 'two cards of one technique are one offer: two techniques by four findings');
    assert.equal(new Set(uses.map(o => MODEL.pendingKey(o.action, o.target))).size, 8);
    assert.deepEqual([...new Set(uses.map(o => o.ids.techniqueId))].sort(), ['phish', 'phish_sms']);
    assert.deepEqual(FOUR.map(f => `${f.status}${f.fixed ? '+fixed' : ''}`), ['unconfirmed', 'confirmed', 'false', 'confirmed+fixed']);
    assert.deepEqual([...DRAG_EVENTS].sort(), ['dragend', 'dragover', 'dragstart', 'drop']);
    probe.end();
    const pairs = uses.map(o => ({ tech: o.ids.techniqueId, finding: o.ids.findingId, item: o.ids.itemId }));
    for (const p of pairs) {
        const results = {};
        for (const path of ['select:pointer', 'select:keyboard', 'drag', 'typed:command', 'typed:verb', 'typed:framework', 'quick']) {
            const h = await mount(richBody(), { params: { skin: skinOfPath(path) } });
            const offer = findOffer(h, `use|${p.tech}|${p.finding}`);
            assert.ok(offer, `${p.tech} on ${p.finding} is offered`);
            await press(h, offer, path);
            await settle(2);
            results[path] = h.record();
            same(sent(results[path]), [['technique', h.view().footholdId, { findingId: p.finding, itemId: CARDS[p.tech].itemId }]],
                `${p.tech} on ${p.finding} by ${path}`, 'sent', 'pair');
            assert.equal(p.item, CARDS[p.tech].itemId);
            h.end();
        }
        for (const [path, rec] of Object.entries(results)) same(rec, results['select:pointer'], `${p.tech} on ${p.finding}: ${path} differs`, path, 'select:pointer');
    }
});

// ---------------------------------------------------------------------------------------------
// 5: refusal words
// ---------------------------------------------------------------------------------------------

test('5 each refusal code reads the same in both skins, with one request', async () => {
    assert.ok(REFUSAL_CODES.length >= 17);
    const moves = [
        ['sweep', (o) => o.action === 'sweep'], ['scan', (o) => o.action === 'scan' && o.ids.hostId === 'print02'],
        ['check', (o) => o.action === 'check'], ['confirm', (o) => o.action === 'confirm'],
        ['use', (o) => o.action === 'use' && o.ids.techniqueId === 'phish' && o.ids.findingId.endsWith('old_banner')]
    ];
    for (const code of REFUSAL_CODES) {
        const answer = { success: false, reason: code };
        for (const [name, pick] of moves) {
            const sentence = name === 'use' ? MODEL.refusalLine(answer) : MODEL.refusalText(code);
            assert.ok(sentence && sentence !== MODEL.UNKNOWN_REFUSAL_TEXT, `${code} has words`);
            const seen = {};
            for (const skin of ['gui', 'cli']) {
                const h = await mount(richBody(), { params: { skin }, hold: true });
                const offer = offersOf(h).find(pick);
                assert.ok(offer, `${name} is offered`);
                await press(h, offer, skin === 'gui' ? (name === 'use' ? 'select' : 'button') : 'typed');
                await settle(2);
                assert.equal(h.calls.length, 1, `${skin} ${name} ${code}: one request`);
                await h.release(answer);
                assert.equal(h.calls.length, 1, `${skin} ${name} ${code}: no second request`);
                seen[skin] = skin === 'gui' ? root(h).textContent : text(h).join('\n');
                assert.ok(seen[skin].includes(sentence), `${skin} ${name} ${code} shows "${sentence}"`);
                h.end();
            }
        }
    }
});

// ---------------------------------------------------------------------------------------------
// 6: lines that name nothing offered
// ---------------------------------------------------------------------------------------------

test('6 a typed line naming another fixture\'s host, finding or card, an unlisted id, or an unchecked finding sends nothing', async () => {
    const own = new Set();
    const others = new Set();
    for (const name of fixtureNames()) {
        const b = loadFixture(name);
        for (const fh of b.footholds) {
            const rows = [...(fh.hosts || [])];
            for (const n of fh.networks || []) { others.add(n.id); rows.push(...(n.hosts || [])); }
            for (const r of rows) {
                others.add(r.id);
                for (const f of r.findings || []) { others.add(f.id); others.add(f.alias); }
            }
        }
        for (const id of Object.keys(b.techniques || {})) others.add(id);
    }
    const h = await mount(clone(loadFixture('swept_hosts')), { params: { skin: 'cli' } });
    const v = h.view().view;
    const rows = [...v.hosts, ...v.networks.flatMap(n => n.hosts)];
    for (const r of rows) { own.add(r.id); own.add(r.host); own.add(r.address); }
    for (const n of v.networks) own.add(n.id);
    const foreign = [...others].filter(id => id && !own.has(id));
    assert.ok(foreign.length > 10);
    const verbs = ['sweep', 'scan', 'check', 'confirm', 'signin', 'open', 'look', 'nmap -sV', 'nmap -sn', 'use phish on', 'use phish_sms on', 'use zz on'];
    const lines = ['confirm f1', 'confirm print01.web.factory_login', 'use phish on f1', 'use phish_sms on f1', 'check print01 db', 'check print02 web',
        'msf > use f1; check', 'msf > use print01.web.factory_login; set TECHNIQUE phish; run'];
    for (const verb of verbs) for (const id of [...foreign, 'nothing_here', 'x'.repeat(40)]) lines.push(`${verb} ${id}`);
    for (const line of lines) {
        const before = lastLine(h);
        h.calls.length = 0; h.opened.length = 0; h.events.length = 0;
        await typeLine(h, line);
        assert.deepEqual(sent(h.record()), [], `"${line}" sent a request`);
        assert.deepEqual(h.record().opened, [], `"${line}" opened a screen`);
        assert.equal(effects(h.record()), 0, `"${line}" had an effect`);
        assert.ok(lastLine(h) !== before, `"${line}" printed nothing`);
        if (h.view().getTestState().mode?.prompt === 'msf') await typeLine(h, 'exit');
    }
    h.end();
});

// ---------------------------------------------------------------------------------------------
// 7: events
// ---------------------------------------------------------------------------------------------

/** The scripted moves, each as { find, answer, after }: found in the offer list, answered with `answer` (a function of the view). */
function script(body) {
    const fh = () => body.footholds[0];
    const eachList = (fn) => { for (const list of [fh().hosts, fh().networks[0].hosts]) fn(list); };
    const scanned = { scanned: true, services: [{ name: 'web', label: 'web', port: 80, product: 'Brackley PrintPanel', version: '2.0' }] };
    return [
        { name: 'sweep', find: (o) => o.action === 'sweep', answer: () => ({ success: true, network: { id: 'lab_net', swept: true, hosts: clone(fh().networks[0].hosts) } }),
            after: () => { fh().networks[0].swept = true; } },
        { name: 'scan', find: (o) => o.action === 'scan' && o.ids.hostId === 'print02',
            answer: () => ({ success: true, host: { ...clone(fh().hosts.find(r => r.id === 'print02')), ...clone(scanned) } }),
            after: () => eachList(l => Object.assign(l.find(r => r.id === 'print02'), clone(scanned))) },
        { name: 'check', find: (o) => o.action === 'check' && o.ids.hostId === 'print01',
            answer: () => ({ success: true, hostId: 'print01', service: 'web', findings: clone(FOUR) }), after: () => {} },
        { name: 'confirm', find: (o) => o.action === 'confirm',
            answer: () => ({ success: true, finding: { ...clone(FOUR[0]), status: 'confirmed', needs: [] } }),
            after: () => eachList(l => { const f = l.find(r => r.id === 'print01').findings[0]; f.status = 'confirmed'; f.needs = []; }) },
        { name: 'use', find: (o) => o.action === 'use' && o.ids.techniqueId === 'phish' && o.ids.findingId.endsWith('old_banner'),
            answer: () => ({ success: true, grant: 'credential', keyringChanged: false }), after: () => {} },
        { name: 'refused', find: (o) => o.action === 'use' && o.ids.techniqueId === 'phish_sms' && o.ids.findingId.endsWith('old_banner'),
            answer: () => ({ success: false, reason: 'wrong_class' }), after: () => {} },
        { name: 'open', find: (o) => o.action === 'sign-in' && o.ids.hostId === 'desk_pc', answer: null, after: () => {} }
    ];
}

async function runScript(skin) {
    const body = richBody();
    const h = await mount(body, { params: { skin }, hold: true });
    for (const step of script(body)) {
        const offer = offersOf(h).find(step.find);
        assert.ok(offer, `${skin}: ${step.name} is offered`);
        await press(h, offer, skin === 'gui' ? (offer.action === 'use' ? 'select' : 'button') : 'typed');
        await settle(2);
        if (step.answer) { await h.release(step.answer()); step.after(); }
    }
    const out = { events: [...h.mountEvents, ...h.events], calls: h.calls.filter(c => c[0] !== 'network'), opened: h.opened };
    h.end();
    return out;
}

test('7 one scripted sequence emits the same eight events, with their <name>:<id> forms and payloads, in either skin', async () => {
    const gui = await runScript('gui');
    const cli = await runScript('cli');
    same(cli.events, gui.events, 'the events differ', 'cli', 'gui');
    same(cli.calls, gui.calls, 'the requests differ', 'cli', 'gui');
    same(cli.opened, gui.opened, 'the opened screens differ', 'cli', 'gui');
    const names = new Set(gui.events.map(([n]) => n.split(':')[0]));
    for (const want of ['network_viewed', 'network_swept', 'network_host_scanned', 'network_service_checked', 'network_finding_confirmed',
        'network_technique_used', 'network_technique_refused', 'network_host_opened']) assert.ok(names.has(want), `${want} was emitted`);
    for (const [n, data] of gui.events.filter(([name]) => name.includes(':'))) {
        const base = n.split(':')[0];
        assert.ok(gui.events.some(([name, d]) => name === base && J(d) === J(data)), `${n} follows its plain form with the same payload`);
    }
    assert.equal(gui.events.length % 2, 0);
});

// ---------------------------------------------------------------------------------------------
// 8: a switch
// ---------------------------------------------------------------------------------------------

test('8 a switch mid-sequence records no call and no event, and a selection is not carried across', async () => {
    const h = await mount(richBody(), { params: { skin: 'gui' } });
    const offer = findOffer(h, 'use|phish|print01.web.old_banner');
    activate(q(h, '[data-technique="phish"] [data-action="select-technique"]'));
    activate(q(h, `[data-finding="${aliasOf(h.view().view, offer.ids.findingId)}"] [data-action="select-finding"]`));
    assert.equal(h.view().selectedTechnique, 'phish');
    assert.ok(h.view().selectedFinding);
    assert.equal(q(h, '[data-techniques] [data-action="use"]').disabled, false, 'Use is ready');
    await switchTo(h);
    assert.equal(mountedSkin(h), 'cli');
    // In the Terminal: a card picked (the use step), half a line typed
    activate(q(h, '[data-technique="phish"] [data-action="select-technique"]'));
    assert.ok(q(h, '[data-technique][data-finding] [data-action="use"]'), 'the finding step is open');
    q(h, '.network-term-input').value = 'scan pr';
    await switchTo(h);
    assert.equal(mountedSkin(h), 'gui');
    assert.equal(h.view().selectedTechnique, null, 'no card carried to Panels');
    assert.equal(h.view().selectedFinding, null, 'no finding carried to Panels');
    assert.equal(q(h, '[data-techniques] [data-action="use"]').disabled, true, 'Use is not ready');
    await switchTo(h);
    assert.equal(q(h, '[data-technique][data-finding] [data-action="use"]'), null, 'the Terminal starts at the list');
    assert.equal(q(h, '.network-term-input').value, '', 'no half line carried');
    assert.deepEqual(h.calls, [], 'no request');
    assert.deepEqual(h.events, [], 'no event');
    assert.deepEqual(h.opened, []);
    h.end();
});

// ---------------------------------------------------------------------------------------------
// 10: one press, one request
// ---------------------------------------------------------------------------------------------

const WAYS = (action) => (action === 'use'
    ? [['gui', 'select'], ['gui', 'drag'], ['cli', 'typed'], ['cli', 'quick']]
    : [['gui', 'button'], ['cli', 'typed'], ['cli', 'quick']]);

const MOVES = Object.freeze({
    sweep: 'sweep|lab_net',
    scan: 'scan|print02',
    check: 'check|print01|web',
    confirm: 'confirm|print01.web.factory_login',
    use: 'use|phish|print01.web.old_banner',
    unplug: 'unplug'
});

for (const [action, key] of Object.entries(MOVES)) {
    test(`10 ${action}: a second press by the same or the other path, or after a switch, sends nothing more; the answer lands once`, async () => {
        const answer = action === 'unplug' ? Object.assign(new Error('refused'), { status: 403 }) : { success: false, reason: 'not_found' };
        for (const [skin1, path1] of WAYS(action)) {
            for (const [skin2, path2] of WAYS(action)) {
                const h = await mount(richBody(), { params: { skin: skin1 }, hold: true, unplug: action === 'unplug' });
                const offer = findOffer(h, key);
                assert.ok(offer, `${action} is offered`);
                await press(h, offer, path1);
                await settle(2);
                const label = `${action}: ${path1} then ${path2}${skin1 !== skin2 ? ' across a switch' : ''}`;
                assert.equal(h.calls.length, 1, `${label}: first press sends`);
                if (skin2 !== mountedSkin(h)) await switchTo(h);
                const again = findOffer(h, key);
                assert.equal(again.pending, true, `${label}: the offer is pending`);
                await press(h, again, path2);
                await settle(2);
                assert.equal(h.calls.length, 1, `${label}: no second request`);
                // An offer under another key still sends
                const other = offersOf(h).find(o => o.action !== 'use' && o.action !== 'unplug' && o.action !== action && !o.pending && ['scan', 'check', 'confirm', 'sweep'].includes(o.action));
                assert.ok(other, 'another offer');
                await press(h, other, skin2 === 'gui' ? 'button' : 'typed');
                await settle(2);
                assert.equal(h.calls.length, 2, `${label}: a different key sends`);
                shown.gui = 0; shown.cli = 0;
                const landed = mountedSkin(h);
                await h.release(answer);
                assert.equal(h.calls.length, 2, `${label}: the answers send nothing`);
                assert.equal(shown[landed], 2, `${label}: each answer reaches the mounted skin once`);
                assert.equal(shown[landed === 'gui' ? 'cli' : 'gui'], 0, `${label}: the other skin hears nothing`);
                h.end();
            }
        }
    });
}

// ---------------------------------------------------------------------------------------------
// 11: switch orders and the log
// ---------------------------------------------------------------------------------------------

const ENDINGS = Object.freeze({
    refusal: { answer: () => ({ success: false, reason: 'not_found' }), has: () => MODEL.refusalText('not_found') },
    failure: { answer: () => Object.assign(new Error('down'), { status: 500 }), has: () => MODEL.refusalText('no_answer') },
    table: {
        answer: () => ({ success: true, host: { id: 'print02', kind: 'device', name: 'Print Two', sprite: 'pnw_portable_printer1', scanned: true,
            services: [{ name: 'web', label: 'web', port: 80, product: 'Brackley PrintPanel', version: '2.0' }] } }),
        has: () => 'web'
    }
});

const ORDERS = Object.freeze([
    { name: 'press in Terminal, switch to Panels, back while pending', start: 'cli', during: ['switch', 'switch'], then: [] },
    { name: 'press in Terminal, switch, the answer lands in Panels, back', start: 'cli', during: ['switch'], then: ['switch'] },
    { name: 'press in Panels, switch to Terminal while pending, the answer lands', start: 'gui', during: ['switch'], then: [] }
]);

for (const order of ORDERS) {
    for (const [endName, ending] of Object.entries(ENDINGS)) {
        test(`11 ${order.name}: ${endName}`, async () => {
            const h = await mount(richBody(), { params: { skin: order.start }, hold: true });
            const before = text(h);
            const offer = findOffer(h, 'scan|print02');
            await press(h, offer, order.start === 'gui' ? 'button' : 'quick');
            await settle(2);
            const started = text(h);
            const echo = '$ nmap -sV print02';
            assert.equal(started.filter(l => l === echo).length, 1, 'the command is written once');
            assert.ok(started.length > before.length, 'the move wrote its start');
            const newLines = started.slice(before.length).filter(l => l !== '');
            for (const step of order.during) {
                if (step === 'switch') await switchTo(h);
                assert.deepEqual(text(h), started, 'a mount or a switch while pending adds no line');
            }
            // A redraw, a refetch and a rejected press while pending
            await h.view().refetch({ sync: false });
            await settle(2);
            assert.deepEqual(text(h), started, 'a refetch while pending adds no line');
            const again = findOffer(h, 'scan|print02');
            await press(h, again, mountedSkin(h) === 'gui' ? 'button' : 'quick');
            await settle(2);
            assert.deepEqual(text(h), started, 'a rejected press writes nothing');
            assert.equal(h.calls.filter(c => c[0] !== 'network').length, 1);
            await h.release(ending.answer());
            for (const step of order.then) { if (step === 'switch') await switchTo(h); }
            const done = text(h);
            assert.deepEqual(done.slice(0, started.length), started, 'earlier lines are untouched');
            assert.ok(done.length > started.length, 'an ending was written');
            const tail = done.slice(started.length).join('\n');
            assert.ok(tail.includes(ending.has()), `the end of the log has "${ending.has()}": ${J(done.slice(started.length))}`);
            for (const l of newLines) assert.equal(done.filter(x => x === l).length, started.filter(x => x === l).length, `"${l}" is not written twice`);
            assert.equal(done.filter(l => l === echo).length, 1);
            // Whichever skin is mounted at the end shows the same log
            if (mountedSkin(h) === 'cli') assert.deepEqual(h.view().getTestState().log, done);
            else { await switchTo(h); assert.deepEqual(h.view().getTestState().log, done, 'the Terminal drawn after the answer shows the same log'); }
            h.end();
        });
    }
}
