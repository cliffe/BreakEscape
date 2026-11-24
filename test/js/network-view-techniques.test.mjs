// The network view's technique cards, S3 (ops core plan 5.5, 11.3): the Techniques panel, select a
// finding then a card then Use through `perform`, a drag sending the same request, every refusal's
// words from REFUSAL_TEXT, `hostAction` and `openHere`, the access tag, the compromise bolt on a host
// row, the session handover and the keyring refetch, hostile strings, getTestState. The real view,
// base minigame and network-links.js run against jsdom; the API client is a stub that records calls.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'network-view-tech-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
for (const f of ['utils/escape-html.js', 'utils/more-below.js', 'utils/author-html.js', 'utils/conditional-text.js',
    'systems/global-writer.js', 'utils/remote-host-text.js', 'utils/sync-before-fetch.js', 'systems/network-links.js',
    'minigames/framework/base-minigame.js', 'minigames/network-view/ops-model.js',
    'minigames/network-view/network-view-minigame.js', 'utils/compromise-bolt.js']) copy(f);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const V = await imp('minigames/network-view/network-view-minigame.js');
const { NetworkViewMinigame } = V;
const M = await imp('minigames/network-view/ops-model.js');
const { NetworkLinks } = await imp('systems/network-links.js');

const settle = async (n = 6) => { for (let i = 0; i < n; i++) await new Promise(r => setTimeout(r, 0)); };

const net = { id: 'lab_net', name: 'Lab network' };
const foothold = { id: 'jack_a', via: 'jack', name: 'Drop box: lab', itemId: 'netlink_jack_a', sourceId: 'port_a', network: net };
const PRINTER = { id: 'print01', kind: 'device', name: 'Second floor printer', sprite: 'pnw_portable_printer1' };
const SWEPT_PRINTER = { ...PRINTER, scanned: true,
    services: [{ name: 'web', label: 'web', port: 80, product: 'Brackley PrintPanel', version: '2.0' }] };
const PC = { id: 'desk_pc', kind: 'pc', name: 'Desk PC', host: 'LAB-01', sprite: 'pc_desktop', headless: false, remoteSignIn: true };

const heldCopies = new Set();
let calls, answer, events, scanImpl, checkImpl, confirmImpl, techImpl, jacks, opened, noted, keyringCalls;
const view = () => window.MinigameFramework.currentMinigame;
const q = (sel) => document.querySelector(sel);
const sweepBtn = () => q('[data-network-id] [data-action="sweep"]');
const scanBtn = (id) => q(`[data-host-id="${id}"] [data-action="scan"]`);
const named = (n) => events.filter(([e]) => e === n).map(([, d]) => d);

function framework() {
    return {
        currentMinigame: null, mainGameScene: {},
        startMinigame(type, container, params) {
            if (this.currentMinigame) this.endMinigame(false, null);
            const el = document.createElement('div');
            document.body.appendChild(el);
            const m = new NetworkViewMinigame(el, params);
            m._sceneType = type;
            this.currentMinigame = m;
            m.init(); m.start();
            return m;
        },
        endMinigame(success, result) {
            const m = this.currentMinigame;
            if (!m || m._ending) return;
            m._ending = true;
            m.cleanup();
            m.params?.onComplete?.(success, result);
            if (this.currentMinigame === m) this.currentMinigame = null;
            m.container?.remove?.();
        }
    };
}

// `entry` is the foothold's GET /network entry fields beyond the foothold itself, EXCEPT `techniques`:
// the server sends that map at the TOP LEVEL of the body, beside `footholds` (network_ops.rb
// network_view; plan line 1294), so it is lifted out of `entry` into the body here. The view is then
// fed by the real NetworkLinks.refresh, which is what carries the map on to the stored view (B1).
function setup(entry = {}, { unplug = false } = {}) {
    const { techniques, ...entryFields } = entry;
    window.MinigameFramework?.endMinigame?.(false, null);
    calls = []; events = []; scanImpl = null; checkImpl = null; confirmImpl = null; techImpl = null; opened = []; noted = []; keyringCalls = 0;
    answer = { footholds: [{ ...foothold, hosts: [], networks: [], ...entryFields }], ...(techniques ? { techniques } : {}) };
    assert.equal('techniques' in answer.footholds[0], false, 'the fixture is the server body shape: no techniques on the entry');
    document.body.innerHTML = '';
    window.eventDispatcher = { emit: (n, d) => events.push([n, d]) };
    window.gameAlert = () => {};
    window.gameState = { globalVariables: {} };
    window.applyInventoryDelta = () => {};
    window.inventory = { items: [] };
    window.ApiClient = {
        network: async (id) => { calls.push(['network', id]); return JSON.parse(JSON.stringify(answer)); },
        networkScan: async (fid, params) => {
            calls.push(['scan', fid, params]);
            if (scanImpl) return scanImpl(fid, params);
            throw Object.assign(new Error('unset'), { status: 500 });
        },
        networkCheck: async (fid, params) => {
            calls.push(['check', fid, params]);
            if (checkImpl) return checkImpl(fid, params);
            throw Object.assign(new Error('unset'), { status: 500 });
        },
        networkConfirm: async (fid, params) => {
            calls.push(['confirm', fid, params]);
            if (confirmImpl) return confirmImpl(fid, params);
            throw Object.assign(new Error('unset'), { status: 500 });
        },
        networkTechnique: async (fid, params) => {
            calls.push(['technique', fid, params]);
            if (techImpl) return techImpl(fid, params);
            throw Object.assign(new Error('unset'), { status: 500 });
        },
        networkUnplug: async (jackId) => { calls.push(['unplug', jackId]); return { success: true, added: [], removed: ['netlink_jack_a'], endedPcIds: [] }; }
    };
    window.pcSessions = { noteTechniqueSession: (...a) => noted.push(a), remoteViewFoothold: (id) => (heldCopies.has(id) ? 'jack_a' : null) };
    heldCopies.clear();
    window.keyring = { refresh: () => { keyringCalls++; return Promise.resolve(); } };
    window.openRemoteDesktop = (pcId, fid) => opened.push([pcId, fid]);
    window.MinigameFramework = framework();
    window.startNetworkViewMinigame = (footholdId, { unplugJack = null } = {}) =>
        window.MinigameFramework.startMinigame('network-view', null, { title: 'Link', footholdId, unplugJack });
    window.networkLinks = new NetworkLinks();
    window.networkLinks.load([foothold], ['port_a']);
    if (unplug) window.networkLinks.trip = { footholdId: 'jack_a', atJack: 'port_a' };
}
async function open(unplugJack = null) {
    window.startNetworkViewMinigame('jack_a', { unplugJack });
    await settle();
}
after(() => { window.MinigameFramework?.endMinigame?.(false, null); });
const deferred = () => { let resolve, reject; const p = new Promise((a, b) => { resolve = a; reject = b; }); return { p, resolve, reject }; };


window.HTMLCanvasElement.prototype.getContext = function () {
    return { fillStyle: '', fillRect() { (globalThis.__rects ||= []).push(1); } };
};

const SVC = { name: 'web', label: 'web', port: 80, product: 'Brackley PrintPanel', version: '2.0' };
const mkFinding = (over = {}) => ({ id: 'print01.web.factory_login', alias: 'f1', hostId: 'print01', service: 'web', class: 'default_creds',
    severity: 'high', summary: 'A factory sign-in still works.', status: 'confirmed',
    needs: [{ kind: 'credential', label: 'An account on this host', met: true }], ...over });
const F1 = mkFinding();
const F2 = mkFinding({ id: 'print01.web.old_banner', alias: 'f2', class: 'unpatched', status: 'unconfirmed', needs: undefined });
const CARD_A = { name: 'Factory defaults page', summary: 'A page of factory sign-ins.', worksOn: { class: 'default_creds' }, itemId: 'card_a_item' };
const CARD_B = { name: 'Old firmware note', summary: 'Notes on out of date firmware.', worksOn: { class: 'unpatched', product: 'Brackley PrintPanel', versions: ['1.9', '2.0'] }, itemId: 'card_b_item' };
const printerRow = (over = {}) => ({ ...PRINTER, scanned: true, services: [SVC], findings: [F1, F2], ...over });
const ENTRY = (over = {}, rowOver = {}) => {
    const hosts = [printerRow(rowOver)];
    return { hosts, networks: [{ id: 'lab_net', name: 'Lab network', route: 'up', via: null, hosts, swept: true, ops: true }],
        techniques: { factory_defaults: CARD_A, old_firmware: CARD_B }, ...over };
};
const pick = async (alias, card) => {
    q(`[data-finding="${alias}"] [data-action="select-finding"]`).click();
    q(`[data-technique="${card}"] [data-action="select-technique"]`).click();
};
const useBtn = () => q('[data-techniques] [data-action="use"]');
const techCalls = () => calls.filter(c => c[0] === 'technique');

test('a view with no techniques map has no panel, no select or use control, and no new state keys', async () => {
    setup({ hosts: [PC], networks: [{ id: 'lab_net', name: 'Lab network', route: 'up', via: null, hosts: [PC] }] });
    await open();
    assert.equal(document.querySelectorAll('[data-techniques], [data-technique], [data-action="use"], [data-action="select-technique"]').length, 0);
    const st = view().getTestState();
    for (const k of ['techniques', 'selectedFinding', 'selectedTechnique', 'use', 'canUse', 'grant']) assert.equal(k in st, false, k);
    assert.deepEqual(Object.keys(st.rows[0]).sort(), ['action', 'host', 'id', 'kind', 'name', 'selector', 'session']);
});

test('the panel lists held cards with name, summary and works-on line, and nothing says which card fits which finding', async () => {
    setup(ENTRY());
    await open();
    const cards = [...document.querySelectorAll('[data-technique]')];
    assert.deepEqual(cards.map(c => c.dataset.technique), ['factory_defaults', 'old_firmware']);
    const a = q('[data-technique="factory_defaults"]');
    assert.equal(a.querySelector('.network-technique-select').textContent, 'Factory defaults page');
    assert.equal(a.querySelector('.network-technique-summary').textContent, 'A page of factory sign-ins.');
    assert.equal(a.querySelector('.network-technique-works').textContent, 'Default login');
    assert.equal(q('[data-technique="old_firmware"] .network-technique-works').textContent, 'Out of date · Brackley PrintPanel · versions 1.9, 2.0');
    assert.equal(q('[data-techniques]').querySelector('.network-technique-use [data-action="use"]').disabled, true, 'Use waits for a pair');
    // fit is not in the DOM before Use: no finding or card element names the other
    const findingHtml = q('[data-finding="f1"]').outerHTML;
    assert.ok(!findingHtml.includes('factory_defaults') && !findingHtml.includes('card_a_item'));
    const st = view().getTestState();
    assert.deepEqual(st.techniques.map(t => t.id), ['factory_defaults', 'old_firmware']);
    assert.equal(st.techniques[0].itemId, 'card_a_item');
    const json = JSON.stringify(st);
    for (const t of st.techniques) assert.ok(!('fits' in t) && !('finding' in t));
    for (const f of st.rows.find(r => r.id === 'print01').findings) assert.ok(!JSON.stringify(f).includes('factory_defaults'), json.length > 0);
    assert.equal(st.selectedFinding, null);
});

test('hostile card names, summaries, works-on products and grant names are shown as text only', async () => {
    const evil = '<img src=x onerror="window.__pwn=1"><b>x</b>';
    setup(ENTRY({ techniques: { evil_card: { name: evil, summary: evil, worksOn: { class: 'unpatched', product: evil, versions: [evil] }, itemId: 'i1' } } }));
    await open();
    const card = q('[data-technique="evil_card"]');
    assert.equal(card.querySelector('img'), null);
    assert.equal(card.querySelector('b'), null);
    assert.equal(card.querySelector('.network-technique-select').textContent, evil);
    assert.equal(card.querySelector('.network-technique-summary').textContent, evil);
    assert.ok(card.querySelector('.network-technique-works').textContent.includes(evil));
    assert.equal(window.__pwn, undefined);
    // a session grant names the host and the account: also text
    techImpl = async () => ({ success: true, grant: 'session', session: { npcId: 'n', displayName: evil, via: 'technique', access: 'admin' } });
    window.openRemoteDesktop = undefined;
    await pick('f1', 'evil_card');
    useBtn().click();
    await settle();
    assert.equal(q('.network-technique-grant img'), null);
    assert.ok(q('.network-technique-grant').textContent.includes(evil));
    assert.equal(q('.network-view-notice img'), null);
});

test('select a finding, select a card, Use: one request through perform with the held item id and the built finding id', async () => {
    setup(ENTRY());
    await open();
    techImpl = async () => ({ success: true, grant: 'credential', keyringChanged: true });
    useBtn().click();
    await settle();
    assert.equal(techCalls().length, 0, 'Use with nothing picked sends nothing');
    q('[data-finding="f1"] [data-action="select-finding"]').click();
    assert.equal(view().getTestState().selectedFinding, 'f1');
    assert.equal(useBtn().disabled, true, 'a finding alone is not a pair');
    q('[data-technique="factory_defaults"] [data-action="select-technique"]').click();
    assert.equal(useBtn().disabled, false);
    assert.equal(view().getTestState().canUse, true);
    assert.equal(q('[data-finding="f1"]').dataset.selected, 'true');
    assert.equal(q('[data-technique="factory_defaults"]').dataset.selected, 'true');
    useBtn().click();
    assert.equal(useBtn().disabled, true, 'disabled in the same tick as the press');
    assert.deepEqual(view().getTestState().pending, ['use:factory_defaults|print01.web.factory_login']);
    assert.equal(useBtn().textContent, V.USING_TEXT);
    useBtn().click();
    await settle();
    assert.deepEqual(techCalls(), [['technique', 'jack_a', { findingId: 'print01.web.factory_login', itemId: 'card_a_item' }]]);
    assert.deepEqual(named('network_technique_used'), [{ findingId: 'print01.web.factory_login', techniqueId: 'factory_defaults', grant: 'credential' }]);
    assert.equal(events.filter(([e]) => e === 'network_technique_used:print01.web.factory_login').length, 1);
    assert.ok(calls.filter(c => c[0] === 'network').length >= 2, 'the refetch ran after the success');
    assert.equal(useBtn().disabled, false, 'picked pair stays so the card can be used again');
});

test('the keyboard path: every control of the path is a focusable button and Enter on each works', async () => {
    setup(ENTRY());
    await open();
    for (const sel of ['[data-finding="f2"] [data-action="select-finding"]', '[data-technique="old_firmware"] [data-action="select-technique"]', '[data-techniques] [data-action="use"]']) {
        const el = q(sel);
        assert.equal(el.tagName, 'BUTTON', sel);
        assert.equal(el.getAttribute('type'), 'button');
    }
    const st = view().getTestState();
    q(st.rows.find(r => r.id === 'print01').findings[1].select).focus();
    assert.equal(document.activeElement.dataset.action, 'select-finding');
    q(st.rows.find(r => r.id === 'print01').findings[1].select).click();
    assert.equal(document.activeElement.dataset.action, 'select-finding', 'focus stays on the control after the redraw');
    q(st.techniques[1].select).focus();
    q(st.techniques[1].select).click();
    assert.equal(document.activeElement.dataset.action, 'select-technique');
    assert.equal(document.activeElement.closest('[data-technique]').dataset.technique, 'old_firmware');
    assert.equal(view().getTestState().selectedTechnique, 'old_firmware');
    q(st.techniques[1].select).click();
    assert.equal(view().getTestState().selectedTechnique, null, 'picking again lets it go');
});

test('a card on an unconfirmed finding is sent as it stands, whatever the status; a different card or finding makes its own call', async () => {
    setup(ENTRY());
    await open();
    const d1 = deferred();
    techImpl = (fid, p) => (p.itemId === 'card_a_item' ? d1.p : Promise.resolve({ success: false, reason: 'not_confirmed' }));
    await pick('f2', 'factory_defaults');
    useBtn().click();
    assert.equal(techCalls().length, 1);
    assert.equal(techCalls()[0][2].findingId, 'print01.web.old_banner');
    useBtn().click();
    assert.equal(techCalls().length, 1, 'the same pair again is one call');
    q('[data-technique="old_firmware"] [data-action="select-technique"]').click();
    useBtn().click();
    await settle();
    assert.equal(techCalls().length, 2, 'another card on the same finding makes its own call');
    q('[data-finding="f1"] [data-action="select-finding"]').click();
    useBtn().click();
    await settle();
    assert.equal(techCalls().length, 3, 'the same card on another finding too');
    d1.resolve({ success: false, reason: 'not_confirmed' });
    await settle();
});

test('a drag of a card onto a finding sends the same request as select-then-Use', async () => {
    setup(ENTRY());
    await open();
    techImpl = async () => ({ success: true, grant: 'credential', keyringChanged: true });
    const card = q('[data-technique="factory_defaults"]');
    assert.equal(card.getAttribute('draggable'), 'true');
    card.dispatchEvent(new window.Event('dragstart', { bubbles: true }));
    const over = new window.Event('dragover', { bubbles: true, cancelable: true });
    q('[data-finding="f1"] .network-finding-summary').dispatchEvent(over);
    assert.equal(over.defaultPrevented, true, 'a finding accepts the drop');
    q('[data-finding="f1"] .network-finding-summary').dispatchEvent(new window.Event('drop', { bubbles: true, cancelable: true }));
    await settle();
    assert.deepEqual(techCalls(), [['technique', 'jack_a', { findingId: 'print01.web.factory_login', itemId: 'card_a_item' }]]);
    // a drop with no card dragged does nothing
    q('[data-finding="f2"]').dispatchEvent(new window.Event('drop', { bubbles: true, cancelable: true }));
    await settle();
    assert.equal(techCalls().length, 1);
});

test('every code in ops_refusal_codes.json has words; a use refusal shows them from REFUSAL_TEXT and emits the refused event', async () => {
    const codes = JSON.parse(readFileSync(join(here, '../fixtures/files/ops_refusal_codes.json'), 'utf8'));
    for (const c of codes) assert.ok(typeof M.REFUSAL_TEXT[c] === 'string' && M.REFUSAL_TEXT[c], c);
    setup(ENTRY());
    await open();
    await pick('f1', 'factory_defaults');
    for (const code of ['not_found', 'not_responding', 'not_confirmed', 'false_positive', 'no_grant', 'fixed', 'wrong_class', 'wrong_product', 'wrong_version', 'need_unmet']) {
        events.length = 0;
        techImpl = async () => { throw Object.assign(new Error('x'), { status: 422, body: { success: false, reason: code } }); };
        useBtn().click();
        await settle();
        assert.equal(view().getTestState().notice, M.REFUSAL_TEXT[code], code);
        assert.equal(q('.network-view-notice').textContent, M.REFUSAL_TEXT[code]);
        assert.deepEqual(named('network_technique_refused'), [{ findingId: 'print01.web.factory_login', reason: code }]);
        assert.equal(named('network_technique_used').length, 0);
    }
});

test('need_unmet names the missing need; an unknown code is neutral; no answer says the link did not answer', async () => {
    setup(ENTRY());
    await open();
    await pick('f1', 'factory_defaults');
    techImpl = async () => { throw Object.assign(new Error('x'), { status: 422, body: { success: false, reason: 'need_unmet', need: { kind: 'item', label: 'A <b>spanner</b>' } } }); };
    useBtn().click();
    await settle();
    assert.equal(view().getTestState().notice, `${M.REFUSAL_TEXT.need_unmet} Missing: A <b>spanner</b>`);
    assert.equal(q('.network-view-notice b'), null);
    techImpl = async () => { throw Object.assign(new Error('x'), { status: 422, body: { success: false, reason: 'something_new' } }); };
    useBtn().click();
    await settle();
    assert.equal(view().getTestState().notice, M.UNKNOWN_REFUSAL_TEXT);
    techImpl = async () => { throw new Error('down'); };
    useBtn().click();
    await settle();
    assert.equal(view().getTestState().notice, M.REFUSAL_TEXT.no_answer);
    assert.equal(named('network_technique_refused').filter(d => d.reason === 'no_answer').length, 0, 'no server refusal, no refused event');
});

test('a session grant records the session, hands over to the desktop through this foothold, and emits used', async () => {
    setup(ENTRY({}, { id: 'desk_pc', kind: 'pc', host: 'LAB-01', name: 'Desk PC', sprite: undefined }));
    answer.footholds[0].hosts = [{ ...PC, scanned: true, services: [SVC], findings: [mkFinding({ hostId: 'desk_pc', id: 'desk_pc.web.factory_login' })] }];
    answer.footholds[0].networks[0].hosts = answer.footholds[0].hosts;
    await open();
    const session = { npcId: 'sam', username: 'sam', displayName: 'Sam', via: 'technique', remote: true, footholdId: 'jack_a', host: 'desk_pc' };
    techImpl = async () => ({ success: true, grant: 'session', session, endedPcIds: ['other_pc'] });
    window.MinigameFramework.currentMinigame.__x = 1;
    window.openRemoteDesktop = (pcId, fid) => { opened.push([pcId, fid]); window.MinigameFramework.endMinigame(false, null); };
    await pick('f1', 'factory_defaults');
    const v = view();
    useBtn().click();
    await settle();
    assert.deepEqual(noted, [['desk_pc', session, ['other_pc'], null, false]]);
    assert.deepEqual(opened, [['desk_pc', 'jack_a']]);
    assert.equal(v.exitReason, 'handover');
    assert.deepEqual(named('network_technique_used'), [{ findingId: 'desk_pc.web.factory_login', techniqueId: 'factory_defaults', grant: 'session' }]);
    assert.equal(keyringCalls, 0);
});

test('a session grant with no desktop to open keeps the view, says so, and draws the level in the panel', async () => {
    setup(ENTRY());
    await open();
    window.openRemoteDesktop = undefined;
    techImpl = async () => ({ success: true, grant: 'session', session: { npcId: 'sam', displayName: 'Sam', via: 'technique', access: 'admin' } });
    await pick('f1', 'factory_defaults');
    useBtn().click();
    await settle();
    assert.equal(view().exitReason, 'close');
    assert.equal(q('.network-technique-grant .network-access-tag').textContent, 'admin');
    assert.ok(q('.network-technique-grant').textContent.startsWith('You now hold a session on'));
    assert.deepEqual(view().getTestState().grant, { hostId: 'print01', who: 'Sam', access: 'admin' });
    // a user-level grant draws no tag
    techImpl = async () => ({ success: true, grant: 'session', session: { npcId: 'sam', displayName: 'Sam', via: 'technique' } });
    useBtn().click();
    await settle();
    assert.equal(q('.network-technique-grant .network-access-tag'), null);
    assert.equal('access' in view().getTestState().grant, false);
});

test('a credential grant asks the keyring to refetch once and hands nothing over; a repeat that changed nothing does not', async () => {
    setup(ENTRY());
    await open();
    techImpl = async () => ({ success: true, grant: 'credential', keyringChanged: true });
    await pick('f1', 'factory_defaults');
    useBtn().click();
    await settle();
    assert.equal(keyringCalls, 1);
    assert.deepEqual(opened, []);
    assert.equal(view().getTestState().notice, V.CREDENTIAL_GRANT_TEXT);
    techImpl = async () => ({ success: true, already: true, grant: 'credential', keyringChanged: false });
    useBtn().click();
    await settle();
    assert.equal(keyringCalls, 1);
});

test('hostAction: a blocked host is off unless its session is openHere; a powered-down row stays not responding; others unchanged', () => {
    const sess = { via: 'technique', displayName: 'Sam' };
    assert.equal(V.hostAction({ remoteSignIn: false }), 'off');
    assert.equal(V.hostAction({ remoteSignIn: false, session: sess }), 'off', 'no openHere key: off, as today');
    assert.equal(V.hostAction({ remoteSignIn: false, session: { ...sess, openHere: false } }), 'off');
    assert.equal(V.hostAction({ remoteSignIn: false, session: { ...sess, openHere: true } }), 'open');
    assert.equal(V.hostAction({ remoteSignIn: false, session: { ...sess, openHere: true, locked: true } }), 'locked');
    assert.equal(V.hostAction({ responding: false, remoteSignIn: false, session: { ...sess, openHere: true } }), 'not_responding');
    assert.equal(V.hostAction({ responding: false }), 'not_responding');
    assert.equal(V.hostAction({ remoteSignIn: true }), 'sign-in');
    assert.equal(V.hostAction({ session: { via: 'password' } }), 'open');
    assert.equal(V.hostAction({ session: { via: 'claim' } }), 'sign-in');
});

test('a blocked host row with an openHere technique session shows Open, the admin tag and the bolt; without openHere it shows nothing to click', async () => {
    const mk = (session) => ({ ...PC, remoteSignIn: false, ...(session ? { session } : {}) });
    setup({ hosts: [mk({ via: 'technique', displayName: 'Sam', access: 'admin', openHere: true })], networks: [] });
    await open();
    const row = q('[data-host-id="desk_pc"]');
    assert.equal(row.querySelector('[data-action="open"]').textContent.startsWith('Open'), true);
    assert.equal(row.querySelector('.network-access-tag').textContent, 'admin');
    assert.ok(row.querySelector('.network-row-bolt'));
    await settle();
    assert.ok(row.querySelector('.network-row-bolt canvas'), 'the bolt canvas is drawn beside the icon');
    const st = view().getTestState().rows[0];
    assert.equal(st.action, 'open');
    assert.equal(st.access, 'admin');
    assert.equal(st.bolt, true);
    setup({ hosts: [mk(null)], networks: [] });
    await open();
    assert.equal(q('[data-host-id="desk_pc"] [data-action]'), null);
    assert.equal(q('.network-row-bolt'), null);
    setup({ hosts: [mk({ via: 'technique', displayName: 'Sam' })], networks: [] });
    await open();
    assert.equal(q('[data-host-id="desk_pc"] [data-action]'), null, 'an absent openHere is off');
});

test('the access tag is drawn only from access admin; the bolt only for a technique session', async () => {
    const pcs = [
        { ...PC, id: 'a_pc', host: 'A-01', session: { via: 'technique', displayName: 'A', access: 'admin' } },
        { ...PC, id: 'b_pc', host: 'B-01', session: { via: 'technique', displayName: 'B' } },
        { ...PC, id: 'c_pc', host: 'C-01', session: { via: 'password', displayName: 'C', access: 'admin' } },
        { ...PC, id: 'd_pc', host: 'D-01', session: { via: 'password', displayName: 'D' } },
        { ...PC, id: 'e_pc', host: 'E-01', session: { via: 'technique', displayName: 'E', access: 'user' } }
    ];
    setup({ hosts: pcs, networks: [] });
    await open();
    const tag = (id) => !!q(`[data-host-id="${id}"] .network-access-tag`);
    const bolt = (id) => !!q(`[data-host-id="${id}"] .network-row-bolt`);
    assert.deepEqual(['a_pc', 'b_pc', 'c_pc', 'd_pc', 'e_pc'].map(tag), [true, false, true, false, false]);
    assert.deepEqual(['a_pc', 'b_pc', 'c_pc', 'd_pc', 'e_pc'].map(bolt), [true, true, false, false, true]);
});

test('Fixed still comes from fixed alone and a finding of any status has its select control', async () => {
    setup(ENTRY({}, { findings: [mkFinding({ fixed: true }), F2, mkFinding({ id: 'print01.web.x', alias: 'f3', status: 'false', falseBecause: 'Patched.' })] }));
    await open();
    assert.equal(document.querySelectorAll('.network-finding-fixed').length, 1);
    assert.equal(document.querySelectorAll('[data-action="select-finding"]').length, 3);
    assert.equal(document.querySelectorAll('[data-action="confirm"]').length, 1, 'one Confirm per unconfirmed finding');
});

test('a refetch that drops the picked card or finding lets the pick go; a refetch while Use is pending keeps it disabled', async () => {
    setup(ENTRY());
    await open();
    const d = deferred();
    techImpl = () => d.p;
    await pick('f1', 'factory_defaults');
    useBtn().click();
    await view().refetch({ sync: false });
    assert.equal(useBtn().disabled, true, 'still pending after a refetch');
    d.resolve({ success: false, reason: 'no_grant' });
    await settle();
    assert.equal(useBtn().disabled, false);
    answer.techniques = { old_firmware: CARD_B };
    await view().refetch({ sync: false });
    assert.equal(view().getTestState().selectedTechnique, null);
    assert.equal(q('[data-technique="factory_defaults"]'), null);
    answer.footholds[0] = { ...answer.footholds[0], hosts: [], networks: [] };
    delete answer.techniques;
    await view().refetch({ sync: false });
    assert.equal(q('[data-techniques]'), null, 'no card held: no panel');
    assert.ok(!view().getTestState().selectedFinding);
});

test('data-action is only on the ops controls and the existing ones; the offer guard turns away an alias and an unheld card', async () => {
    setup(ENTRY());
    await open();
    const allowed = new Set(['sweep', 'scan', 'check', 'confirm', 'select-finding', 'select-technique', 'use', 'open', 'sign-in', 'observe']);
    for (const el of document.querySelectorAll('[data-action]')) assert.ok(allowed.has(el.dataset.action), el.dataset.action);
    const v = view();
    assert.deepEqual(await v.perform({ action: 'use', target: { card: 'factory_defaults', finding: 'f1' } }), { sent: false }, 'an alias is not an id');
    assert.deepEqual(await v.perform({ action: 'use', target: { card: 'no_such_card', finding: F1.id } }), { sent: false });
    assert.deepEqual(await v.perform({ action: 'use', target: 'factory_defaults' }), { sent: false });
    assert.equal(techCalls().length, 0);
});

test('onSent and onEnded fire for use like any other move, onSent before the request', async () => {
    setup(ENTRY());
    await open();
    const order = [];
    const v = view();
    v.onSent = (offer, echo) => order.push(['sent', offer.action, echo, techCalls().length]);
    v.onEnded = (offer, ans) => order.push(['ended', offer.action, ans?.grant ?? null]);
    techImpl = async () => ({ success: true, grant: 'credential', keyringChanged: true });
    await v.perform({ action: 'use', target: { card: 'factory_defaults', finding: F1.id } }, { echo: 'use f1' });
    assert.deepEqual(order, [['sent', 'use', 'use f1', 0], ['ended', 'use', 'credential']]);
});

test('B1: the view lists the cards of the server body shape (top-level techniques) and the stored view carries the map', async () => {
    setup(ENTRY());
    // the body as network_technique_test.rb asserts it: `techniques` beside `footholds`, none on the entry
    assert.deepEqual(Object.keys(answer).sort(), ['footholds', 'techniques']);
    assert.equal('techniques' in answer.footholds[0], false);
    await open();
    assert.deepEqual([...document.querySelectorAll('[data-technique]')].map(c => c.dataset.technique), ['factory_defaults', 'old_firmware']);
    assert.deepEqual(Object.keys(window.networkLinks.lastView('jack_a').techniques), ['factory_defaults', 'old_firmware']);
    assert.equal(M.techniqueItemId(window.networkLinks.lastView('jack_a'), 'factory_defaults'), 'card_a_item');
    // a body with no map (no card held) draws no panel, as before
    setup(ENTRY({ techniques: undefined }));
    assert.deepEqual(Object.keys(answer), ['footholds']);
    await open();
    assert.equal(document.querySelectorAll('[data-techniques], [data-technique]').length, 0);
});

test('m2: a repeat session grant (already: true) on a copy the client holds records nothing; on a copy it lacks it is recorded', async () => {
    setup(ENTRY({}, { id: 'desk_pc', kind: 'pc', host: 'LAB-01', name: 'Desk PC', sprite: undefined }));
    answer.footholds[0].hosts = [{ ...PC, scanned: true, services: [SVC], findings: [mkFinding({ hostId: 'desk_pc', id: 'desk_pc.web.factory_login' })] }];
    answer.footholds[0].networks[0].hosts = answer.footholds[0].hosts;
    await open();
    const session = { npcId: 'sam', username: 'sam', displayName: 'Sam', via: 'technique', remote: true, footholdId: 'jack_a', host: 'desk_pc' };
    techImpl = async () => ({ success: true, already: true, grant: 'session', session });
    window.openRemoteDesktop = (pcId, fid) => { opened.push([pcId, fid]); window.MinigameFramework.endMinigame(false, null); };
    heldCopies.add('desk_pc');
    await pick('f1', 'factory_defaults');
    useBtn().click();
    await settle();
    assert.deepEqual(noted, [], 'no copy re-recorded, so no sign-out or sign-in event can fire');
    assert.deepEqual(events.filter(([e]) => /^pc_signed_/.test(e)), []);
    assert.deepEqual(opened, [['desk_pc', 'jack_a']], 'the desktop still opens');
    // the same repeat with no copy held on the client (a reload) is recorded
    setup(answer.footholds[0] && ENTRY({}, { id: 'desk_pc', kind: 'pc', host: 'LAB-01', name: 'Desk PC', sprite: undefined }));
    answer.footholds[0].hosts = [{ ...PC, scanned: true, services: [SVC], findings: [mkFinding({ hostId: 'desk_pc', id: 'desk_pc.web.factory_login' })] }];
    answer.footholds[0].networks[0].hosts = answer.footholds[0].hosts;
    await open();
    techImpl = async () => ({ success: true, already: true, grant: 'session', session });
    window.openRemoteDesktop = (pcId, fid) => { opened.push([pcId, fid]); window.MinigameFramework.endMinigame(false, null); };
    await pick('f1', 'factory_defaults');
    useBtn().click();
    await settle();
    assert.equal(noted.length, 1);
});

test('m7: a session grant on a host with no row in the stored view when the answer arrives is still recorded, and opens through the foothold', async () => {
    setup(ENTRY({}, { id: 'desk_pc', kind: 'pc', host: 'LAB-01', name: 'Desk PC', sprite: undefined }));
    answer.footholds[0].hosts = [{ ...PC, scanned: true, services: [SVC], findings: [mkFinding({ hostId: 'desk_pc', id: 'desk_pc.web.factory_login' })] }];
    answer.footholds[0].networks[0].hosts = answer.footholds[0].hosts;
    await open();
    const session = { npcId: 'sam', username: 'sam', displayName: 'Sam', via: 'technique', remote: true, footholdId: 'jack_a', host: 'desk_pc' };
    techImpl = async () => {
        // the row leaves the stored view between the press and the answer
        const drop = (o) => { if (Array.isArray(o)) o.forEach(drop); else if (o && typeof o === 'object') { for (const k of Object.keys(o)) { if (k === 'hosts') o[k] = []; else drop(o[k]); } } };
        drop(view().view);
        return { success: true, grant: 'session', session, endedPcIds: ['other_pc'], tokenExpiredPcIds: ['t_pc'] };
    };
    window.openRemoteDesktop = (pcId, fid) => { opened.push([pcId, fid]); window.MinigameFramework.endMinigame(false, null); };
    await pick('f1', 'factory_defaults');
    useBtn().click();
    await settle();
    assert.deepEqual(noted, [['desk_pc', session, ['other_pc'], ['t_pc'], false]]);
    assert.deepEqual(opened, [['desk_pc', 'jack_a']], 'the desktop opens through the session\'s own foothold');
});

test('m1: a grant that ended token sessions passes tokenExpiredPcIds on to the session record', async () => {
    setup(ENTRY({}, { id: 'desk_pc', kind: 'pc', host: 'LAB-01', name: 'Desk PC', sprite: undefined }));
    answer.footholds[0].hosts = [{ ...PC, scanned: true, services: [SVC], findings: [mkFinding({ hostId: 'desk_pc', id: 'desk_pc.web.factory_login' })] }];
    answer.footholds[0].networks[0].hosts = answer.footholds[0].hosts;
    await open();
    const session = { npcId: 'sam', username: 'sam', displayName: 'Sam', via: 'technique', remote: true, footholdId: 'jack_a', host: 'desk_pc' };
    techImpl = async () => ({ success: true, grant: 'session', session, endedPcIds: ['a', 'b'], tokenExpiredPcIds: ['b'] });
    window.openRemoteDesktop = (pcId, fid) => { opened.push([pcId, fid]); window.MinigameFramework.endMinigame(false, null); };
    await pick('f1', 'factory_defaults');
    useBtn().click();
    await settle();
    assert.deepEqual(noted, [['desk_pc', session, ['a', 'b'], ['b'], false]]);
});

test('m4: a drop the guard turns away (the pair is already pending) still redraws with the new pick', async () => {
    setup(ENTRY());
    await open();
    const d = deferred();
    techImpl = () => d.p;
    await pick('f1', 'factory_defaults');
    useBtn().click();
    await settle();
    assert.equal(techCalls().length, 1);
    // drag the other card onto f1: a new pair, sent; then the SAME pair again is turned away
    const out = await view().dropCard('factory_defaults', 'f1');
    assert.equal(out.sent, false);
    // a drop on f2 of a card with no item id: turned away, and the pick moved
    const v = view();
    v.view.techniques.old_firmware.itemId = null;
    q('[data-finding="f1"]').dataset.stale = 'x';
    const before = q('[data-finding="f1"]');
    const turned = await v.dropCard('old_firmware', 'f2');
    assert.equal(turned.sent, false);
    assert.equal(v.selectedFinding, 'print01.web.old_banner');
    assert.notEqual(q('[data-finding="f1"]'), before, 'the list was redrawn');
    assert.equal(q('[data-finding="f2"]').dataset.selected, 'true');
    assert.equal(q('[data-technique="old_firmware"]').dataset.selected, 'true');
    d.resolve({ success: false, reason: 'not_found' });
    await settle();
});

test('m5: with no card held a finding carries no select control; with a card held it does', async () => {
    setup(ENTRY({ techniques: undefined }));
    await open();
    assert.equal(document.querySelectorAll('[data-action="select-finding"]').length, 0);
    assert.equal(q('[data-finding="f1"] .network-finding-alias').tagName, 'SPAN');
    assert.equal(q('[data-finding="f1"] .network-finding-alias').textContent, 'f1');
    // the state says what is drawn: no select selector while no control is
    const bare = view().getTestState().rows.find(r => r.findings?.length).findings;
    for (const f of bare) assert.equal('select' in f, false);
    setup(ENTRY());
    await open();
    assert.equal(document.querySelectorAll('[data-action="select-finding"]').length, 2);
    for (const f of view().getTestState().rows.find(r => r.findings?.length).findings) assert.ok(q(f.select), 'the named selector matches a control');
});

test('T6: onSent then onEnded for a use that is refused, one that throws and one with no reply; the key goes each time', async () => {
    setup(ENTRY());
    await open();
    const v = view();
    const order = [];
    v.onSent = (offer) => order.push(['sent', techCalls().length]);
    v.onEnded = (offer, ans) => order.push(['ended', ans === null ? 'null' : (ans?.reason ?? 'answer')]);
    const target = { card: 'factory_defaults', finding: F1.id };
    techImpl = async () => { throw Object.assign(new Error('no'), { status: 404, body: { success: false, reason: 'not_found' } }); };
    await v.perform({ action: 'use', target });
    techImpl = async () => { throw new Error('network down'); };
    await v.perform({ action: 'use', target });
    techImpl = async () => null;
    await v.perform({ action: 'use', target });
    assert.deepEqual(order, [['sent', 0], ['ended', 'not_found'], ['sent', 1], ['ended', 'null'], ['sent', 2], ['ended', 'null']]);
    assert.equal(v.pending.size, 0, 'no key left pending');
});

// Ops core tidy (client), phone width: the Use control and the message after an ops action are
// brought into view with scrollIntoView({ block: 'nearest' }), an instant jump (nothing to animate,
// so prefers-reduced-motion is respected by construction).
function stubScroll() {
    const log = [];
    window.Element.prototype.scrollIntoView = function (o) { log.push([this, o]); };
    return log;
}
test('phone width: picking a finding or a card scrolls the Use control into view; letting a pick go does not', async () => {
    setup(ENTRY());
    await open();
    const log = stubScroll();
    q('[data-finding="f1"] [data-action="select-finding"]').click();
    assert.equal(log.length, 1);
    assert.equal(log[0][0], useBtn(), 'requested on the Use control');
    assert.equal(log[0][1].block, 'nearest');
    assert.deepEqual(log[0][1], { block: 'nearest' }, 'an instant jump, no smooth');
    q('[data-technique="factory_defaults"] [data-action="select-technique"]').click();
    assert.equal(log.length, 2);
    assert.equal(log[1][0], useBtn());
    q('[data-technique="factory_defaults"] [data-action="select-technique"]').click(); // lets go
    q('[data-finding="f1"] [data-action="select-finding"]').click();                   // lets go
    assert.equal(log.length, 2, 'no scroll when a pick is let go');
});
test('phone width: the message after Use (a grant and a refusal) and after a scan is scrolled into view; an empty notice is not', async () => {
    setup(ENTRY({}, { scanned: false, services: undefined, findings: undefined }));
    await open();
    let log = stubScroll();
    scanImpl = async () => { throw Object.assign(new Error('x'), { status: 422, body: { success: false, reason: 'not_responding' } }); };
    scanBtn('print01').click();
    await settle();
    const notice = () => q('.network-view-notice');
    assert.ok(notice().textContent, 'the scan refusal is worded');
    assert.ok(log.some(([el]) => el === notice()), 'scan message');
    // Use
    setup(ENTRY());
    await open();
    await pick('f1', 'factory_defaults');
    log = stubScroll();
    techImpl = async () => ({ success: true, grant: 'credential', keyringChanged: true });
    useBtn().click();
    await settle();
    assert.ok(notice().textContent, 'the grant is worded');
    assert.ok(log.some(([el, o]) => el === notice() && o.block === 'nearest'), 'grant message');
    log.length = 0;
    techImpl = async () => { throw Object.assign(new Error('x'), { status: 422, body: { success: false, reason: 'not_found' } }); };
    useBtn().click();
    await settle();
    assert.ok(log.some(([el]) => el === notice()), 'refusal message');
    log.length = 0;
    view().showNotice(null);
    assert.equal(log.length, 0, 'clearing a notice scrolls nothing');
});
