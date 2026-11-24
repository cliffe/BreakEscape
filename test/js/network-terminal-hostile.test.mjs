// Hostile text in every field the Terminal can draw (Ops S6 unit 17), driven with the real scene and both renderers.
//
// Every scenario-authored and server-sent text field of one fixture (names, host names, labels, product, version,
// summary, falseBecause, need labels, technique names and notes, session accounts, observations, the view's message,
// the unplug refusal's message, and the same fields in every answer) is `<img src=x onerror=alert(1)>` followed by a
// carriage return, U+001B, U+2028 and U+202E. The fixture goes through the sequence of the text test in both skins:
// each offer with a fake answer and a refetch, one refusal per code, one `already` per ops route, an unplug refused
// and a request with no reply. After every step:
//   the Terminal's root holds only div, form, span, code, button, input and label, the log holds only line
//   containers of spans, no element has an attribute starting `on`, there is no `img`, no control character reaches
//   the text, each hostile string shows as literal text with its control characters as U+FFFD, and a hostile run adds
//   no log line that a run with plain text does not;
//   Panels hold the strings escaped: no tag the plain run lacks, no `img` more than the plain run's icons, no `on`
//   attribute, no raw `<img src=x` in the markup, the text literal.
// Run with: node test/js/network-terminal-hostile.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mount, settle, imp, model } from './support/network-view-harness.mjs';

const NV = 'minigames/network-view/';
const choice = await imp(`${NV}skin-choice.js`);
const here = dirname(fileURLToPath(import.meta.url));
const CODES = JSON.parse(readFileSync(join(here, '../fixtures/files/ops_refusal_codes.json'), 'utf8'));

const clone = (v) => JSON.parse(JSON.stringify(v));

export const HOSTILE = '<img src=x onerror=alert(1)>\r\u001B\u2028\u202E';
// What the Terminal shows of it: each control character (CR, ESC, U+2028, U+202E) as U+FFFD
const SAFE = '<img src=x onerror=alert(1)>\uFFFD\uFFFD\uFFFD\uFFFD';
const CONTROL = /[\u0000-\u001F\u007F-\u009F\u2028\u2029\u202A-\u202E\u2066-\u2069]/;

let counter = 0;
const plain = (field) => `Mk${++counter}${field}`;
// A host's hostname must differ from its name, as the plain run's does: the sweep prints a Hostname line only then
const hostile = (field) => (/host/i.test(field) ? `${HOSTILE}h` : HOSTILE);

// ---------------------------------------------------------------------------------------------
// The fixture
// ---------------------------------------------------------------------------------------------

/** The world: a view with one of everything an offer can be made on, the held techniques, and the answers. */
function world(gen) {
    const t = {};
    const text = (name) => { t[name] = gen(name); return t[name]; };
    // Every served `cli` field (unit 24): a service's protocol, service word and banner; a finding's title, module, script,
    // each advisory and each output line; a host's address; a block's range.
    const svc = (name, port) => ({
        name, label: text(`svcLabel_${name}`), port, product: text(`product_${name}`), version: text(`version_${name}`),
        cli: { protocol: text(`cliProtocol_${name}`), service: text(`cliService_${name}`), banner: text(`cliBanner_${name}`) }
    });
    const findingCli = (alias) => ({
        title: text(`cliTitle_${alias}`), module: text(`cliModule_${alias}`), script: text(`cliScript_${alias}`),
        advisories: [text(`cliAdvisoryA_${alias}`), text(`cliAdvisoryB_${alias}`)], output: [text(`cliOutputA_${alias}`), text(`cliOutputB_${alias}`)]
    });
    const finding = (id, alias, service, status, extra = {}) => ({
        id, alias, hostId: 'dev_b', service, class: 'default_creds', severity: 'high',
        summary: text(`summary_${alias}`), status, needs: [], cli: findingCli(alias), ...extra
    });
    const rows = [
        { id: 'pc_a', kind: 'pc', name: text('pcA'), host: text('hostA'), sprite: 'pc_desktop', headless: false, remoteSignIn: true, address: text('addressA') },
        { id: 'pc_b', kind: 'pc', name: text('pcB'), host: text('hostB'), sprite: 'pc_desktop', headless: false, remoteSignIn: true,
            session: { displayName: text('whoB'), username: text('userB'), access: 'admin', via: 'technique' } },
        { id: 'pc_c', kind: 'pc', name: text('pcC'), host: text('hostC'), sprite: 'pc_desktop', headless: false, remoteSignIn: true,
            session: { displayName: text('whoC'), username: text('userC'), locked: true, via: 'login' } },
        { id: 'pc_d', kind: 'pc', name: text('pcD'), host: text('hostD'), sprite: 'pc_desktop', headless: false, remoteSignIn: false },
        { id: 'pc_e', kind: 'pc', name: text('pcE'), host: text('hostE'), sprite: 'pc_desktop', headless: false, remoteSignIn: true, responding: false },
        { id: 'dev_a', kind: 'device', name: text('devA'), sprite: 'pnw_portable_printer1' },
        {
            id: 'dev_b', kind: 'device', name: text('devB'), sprite: 'pnw_portable_printer1', scanned: true, address: text('addressB'),
            services: [svc('web', 80), svc('ftp', 21)],
            findings: [
                finding('dev_b.web.one', 'f1', 'web', 'unconfirmed'),
                finding('dev_b.web.two', 'f2', 'web', 'confirmed', { needs: [{ kind: 'fact', label: text('needMet'), met: true }, { kind: 'item', label: text('needUnmet'), met: false }] }),
                finding('dev_b.ftp.three', 'f3', 'ftp', 'false', { falseBecause: text('falseBecause') }),
                finding('dev_b.ftp.four', 'f4', 'ftp', 'confirmed', { fixed: true, needs: [] })
            ]
        },
        { id: 'share_open', kind: 'file_share', name: text('shareOpen'), host: text('shareHost'), open: true },
        { id: 'share_locked', kind: 'file_share', name: text('shareLocked'), host: text('shareHost2'), open: false },
        { id: 'printer_a', kind: 'printer', name: text('printerA'), observations: text('observationsA') },
        { id: 'phone_a', kind: 'phone', name: text('phoneA') }
    ];
    const far = [];
    const entry = {
        id: 'jack_a', via: 'jack', name: text('footholdName'), itemId: 'netlink_jack_a', sourceId: 'port_a',
        network: { id: 'lab_net', name: text('networkName') },
        hosts: rows,
        networks: [
            { id: 'lab_net', name: text('blockName'), route: 'up', via: null, cli: { range: text('cliRange') }, hosts: rows, swept: true, ops: true },
            { id: 'far_net', name: text('farName'), route: 'up', via: { hostId: 'pc_b', host: text('viaHost'), locked: true }, hosts: far, swept: false, ops: true },
            { id: 'dead_net', name: text('deadName'), route: 'down', hosts: [{ id: 'dead_pc', kind: 'pc', name: text('deadPc'), host: text('deadHost') }] }
        ]
    };
    const card = (id, name) => ({ name: text(`card_${name}`), summary: text(`cardSummary_${name}`), worksOn: { class: 'default_creds', product: text(`cardProduct_${name}`), versions: [text(`cardVersion_${name}`)] }, itemId: `card_${id}` });
    const body = { footholds: [entry], techniques: { t1: card('t1', 'one'), t2: card('t2', 'two') } };
    const message = text('message');
    const grantWho = text('grantWho');
    const needLabel = text('needLabel');
    const unplugMessage = text('unplugMessage');
    const found = { id: 'dev_b.web.five', alias: 'f5', hostId: 'dev_b', service: 'web', class: 'misconfig', severity: 'low', summary: text('summary_f5'), status: 'unconfirmed', needs: [], cli: findingCli('f5') };
    const answers = {
        sweep: { success: true, network: { id: 'far_net', swept: true, hosts: [
            { id: 'far_pc', kind: 'pc', name: text('farPc'), host: text('farHost'), sprite: 'pc_desktop', headless: false, remoteSignIn: true, address: text('addressFar') },
            { id: 'far_dev', kind: 'device', name: text('farDev'), sprite: 'pnw_portable_printer1' }
        ] } },
        scan: { success: true, host: { id: 'dev_a', kind: 'device', name: t.devA, sprite: 'pnw_portable_printer1', scanned: true, services: [svc('smb', 445)] } },
        check: { success: true, hostId: 'dev_b', service: 'web', findings: [found] },
        confirm: { success: true, finding: { ...rows[6].findings[0], status: 'confirmed', needs: [{ kind: 'fact', label: text('confirmNeed'), met: false }] } },
        useSession: { success: true, grant: 'session', session: { displayName: grantWho, username: text('grantUser'), access: 'admin', via: 'technique' }, already: false, endedPcIds: [] },
        useCredential: { success: true, grant: 'credential', keyringChanged: false }
    };
    return { body, t, rows, message, needLabel, unplugMessage, answers };
}


// ---------------------------------------------------------------------------------------------
// Driving a skin
// ---------------------------------------------------------------------------------------------

const attrOf = (el, a) => el?.getAttribute?.(a) ?? null;

/** The control for an offer in the mounted skin, or null. */
function controlFor(h, offer, w) {
    const root = h.view().container;
    const ids = offer.ids || {};
    const action = offer.action;
    const alias = (fid) => { for (const r of w.rows) for (const f of r.findings || []) if (f.id === fid) return f.alias; return null; };
    const all = [...root.querySelectorAll(action === 'unplug' ? '[data-unplug]' : `[data-action="${action}"]`)];
    if (action === 'unplug') return [...h.view().container.parentNode.querySelectorAll('[data-unplug]')][0] || all[0] || null;
    const want = [];
    if (ids.hostId) want.push(['data-host-id', ids.hostId]);
    if (ids.service) want.push(['data-service', ids.service]);
    if (ids.networkId) want.push(['data-network-id', ids.networkId]);
    if (ids.resourceId) want.push(['data-resource-id', ids.resourceId]);
    if (action === 'confirm') want.push(['data-finding', alias(ids.findingId)]);
    return all.find(b => want.every(([a, v]) => attrOf(b.closest(`[${a}]`), a) === v)) || null;
}

/** Press an offer in the mounted skin. A use is the skin's own two-step. */
function press(h, offer, w) {
    const view = h.view();
    if (offer.action === 'use') {
        const alias = [...w.rows].flatMap(r => r.findings || []).concat([w.answers.check.findings[0]]).find(f => f.id === offer.ids.findingId)?.alias;
        if (view.mounted === 'gui') {
            view.selectFinding(alias);
            view.selectTechnique(offer.ids.techniqueId);
            view.useSelected();
        } else {
            const root = view.container;
            root.querySelector(`[data-technique="${offer.ids.techniqueId}"] [data-action="select-technique"]`).click();
            root.querySelector(`[data-technique="${offer.ids.techniqueId}"][data-finding="${alias}"] [data-action="use"]`).click();
        }
        return true;
    }
    const b = controlFor(h, offer, w);
    if (!b) return false;
    b.click();
    return true;
}

const term = (h) => h.view().container.querySelector('.network-term');

const submit = async (h, line) => {
    const input = term(h).querySelector('.network-term-input');
    input.value = line;
    input.form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await settle();
};

/** The links stub that answers an unplug with what `resolve` is given, held until then. */
function stubUnplug() {
    const state = { resolve: null };
    window.networkLinks.unplugFromView = () => new Promise(r => { state.resolve = (v) => r(v); });
    return state;
}

// ---------------------------------------------------------------------------------------------
// What a skin's DOM holds
// ---------------------------------------------------------------------------------------------

const TERMINAL_TAGS = new Set(['div', 'form', 'span', 'code', 'button', 'input', 'label']);
const onAttrs = (root) => [...root.querySelectorAll('*')].flatMap(el => [...el.attributes].filter(a => /^on/i.test(a.name)).map(a => `${el.tagName.toLowerCase()}[${a.name}]`));
const tagsOf = (root) => new Set([...root.querySelectorAll('*')].map(el => el.tagName.toLowerCase()));

/** The facts about the mounted skin's DOM that the checks read. */
function facts(h) {
    const view = h.view();
    const cli = view.mounted === 'cli';
    const root = cli ? term(h) : view.gameContainer;
    const header = cli ? null : view.container.querySelector('.network-view-header');
    const out = {
        cli, tags: tagsOf(root), on: onAttrs(root), imgs: root.querySelectorAll('img').length,
        text: root.textContent, html: root.innerHTML
    };
    if (header) {
        out.text += header.textContent; out.html += header.innerHTML; out.on.push(...onAttrs(header));
        for (const t of tagsOf(header)) out.tags.add(t);
        out.imgs += header.querySelectorAll('img').length;
    }
    if (cli) {
        const logEl = root.querySelector('.network-term-log');
        out.lines = logEl.children.length;
        // Where a control character sits: in the log, the quick commands, or elsewhere in the Terminal
        out.regions = {
            log: logEl.textContent,
            strip: root.querySelector('.network-term-list').textContent,
            other: [...root.querySelectorAll('.network-term-label, .network-term-mark, .network-term-fold')].map(e => e.textContent).join('')
        };
        out.logShape = [...logEl.children].every(l => l.tagName === 'DIV' && l.className === 'network-term-line-out'
            && [...l.children].every(c => c.tagName === 'SPAN' && c.children.length === 0));
    }
    return out;
}

/** One step in one skin: the facts after the move, and (Terminal) after `show` too. */
async function runSkin(skin, w, step) {
    const body = clone(w.body);
    const h = await mount(body, { unplug: true, hold: true, params: { skin, message: w.message } });
    const out = { skin, errors: [] };
    try {
        if (step.pick) {
            const offer = step.pick(h.view().currentOffers());
            if (!offer) { out.noOffer = true; return out; }
            const unplugState = offer.action === 'unplug' ? stubUnplug(h) : null;
            assert.ok(press(h, offer, w), `no control for ${offer.action} ${JSON.stringify(offer.ids)} in ${skin}`);
            await settle();
            out.pending = facts(h);
            if (['sweep', 'scan', 'check', 'confirm', 'use', 'unplug'].includes(offer.action)) {
                if (step.patch) step.patch(body, offer);
                if (unplugState) unplugState.resolve(step.answer instanceof Error ? null : step.answer);
                else await h.release(step.answer);
            }
            await settle();
        }
        out.after = facts(h);
        if (skin === 'cli') {
            await submit(h, 'show');
            out.shown = facts(h);
            await submit(h, 'help');
            out.help = facts(h);
        }
        out.toasts = h.toasts.map(([m]) => m);
    } finally { h.end(); }
    return out;
}

const OPS = ['sweep', 'scan', 'check', 'confirm', 'use'];
const rowById = (w, id) => w.rows.find(r => r.id === id);
const findingById = (w, id) => w.rows.flatMap(r => r.findings || []).find(f => f.id === id);
const answerFor = (w, offer, extra = {}) => {
    const { action, ids } = offer;
    let a;
    if (action === 'use') a = ids.techniqueId === 't1' ? w.answers.useSession : w.answers.useCredential;
    else if (action === 'scan') a = { success: true, host: { ...rowById(w, ids.hostId), scanned: true, services: w.answers.scan.host.services } };
    else if (action === 'check') a = { success: true, hostId: ids.hostId, service: ids.service, findings: [{ ...w.answers.check.findings[0], service: ids.service, id: `${ids.hostId}.${ids.service}.found`, alias: ids.service === 'web' ? 'f5' : 'f6' }] };
    else if (action === 'confirm') a = { success: true, finding: { ...findingById(w, ids.findingId), status: 'confirmed', needs: w.answers.confirm.finding.needs } };
    else a = w.answers[action];
    return a ? { ...clone(a), ...extra } : undefined;
};
const patchFor = (answer) => (body, offer) => {
    if (!answer || answer.success === false || offer.action === 'use') return;
    body.footholds[0] = model.applyOpsAnswer(body.footholds[0], offer, answer);
};
const labelOf = (o) => `${o.action} ${JSON.stringify(o.ids)}`;
const stepFor = (offer, answer) => ({ pick: (list) => list.find(o => o.action === offer.action && JSON.stringify(o.ids) === JSON.stringify(offer.ids)), answer, patch: patchFor(answer) });
const baseOffers = async (w) => {
    const h = await mount(clone(w.body), { unplug: true, params: { skin: 'gui' } });
    const list = clone(h.view().currentOffers());
    h.end();
    return list;
};

// ---------------------------------------------------------------------------------------------
// The checks
// ---------------------------------------------------------------------------------------------

/** What must hold of one skin's facts after one step. `base`: the same step with plain text. */
function check(label, f, base, problems) {
    const bad = (m) => problems.push(`${label}: ${m}`);
    if (f.on.length) bad(`an attribute starting on: ${f.on.join(', ')}`);
    if (f.cli) {
        const extra = [...f.tags].filter(t => !TERMINAL_TAGS.has(t));
        if (extra.length) bad(`tags outside the Terminal's list: ${extra.join(', ')}`);
        if (f.imgs) bad('an img in the Terminal');
        if (!f.logShape) bad('the log holds something other than line containers of spans');
        for (const [region, text] of Object.entries(f.regions || {})) {
            const hit = text.match(new RegExp(CONTROL.source, 'g'));
            if (hit) bad(`control characters in the Terminal's ${region}: ${JSON.stringify([...new Set(hit)])}`);
        }
        if (!f.regions && CONTROL.test(f.text)) bad(`a control character reaches the Terminal's text: ${JSON.stringify(f.text.match(CONTROL)[0])}`);
        if (f.lines !== base.lines) bad(`the log has ${f.lines} lines, the same step with plain text has ${base.lines}`);
    } else {
        const extra = [...f.tags].filter(t => !base.tags.has(t));
        if (extra.length) bad(`Panels draw a tag the plain run does not: ${extra.join(', ')}`);
        if (f.imgs !== base.imgs) bad(`Panels hold ${f.imgs} img elements, the plain run ${base.imgs}`);
        if (/<img\s+src=x/i.test(f.html) || /onerror=alert\(1\)>/.test(f.html.replace(/&lt;img src=x onerror=alert\(1\)&gt;/g, ''))) bad('the markup holds an unescaped hostile string');
    }
}

/** Runs one step in both skins, hostile and plain, and checks every moment. */
async function hostileStep(label, step, problems) {
    const wh = world(hostile);
    const wp = world(plain);
    const stepH = step(wh);
    const stepP = step(wp);
    for (const skin of ['gui', 'cli']) {
        const h = await runSkin(skin, wh, stepH);
        const p = await runSkin(skin, wp, stepP);
        if (h.noOffer || p.noOffer) { problems.push(`${label}: no offer in ${skin}`); continue; }
        for (const when of ['after', 'shown']) {
            if (!h[when]) continue;
            check(`${label} [${skin} ${when}]`, h[when], p[when], problems);
        }
        // The hostile string is literal text, with its control characters replaced in the Terminal
        const texts = [h.after.text, h.shown?.text ?? ''].join('\n');
        const collapsed = texts.replace(/\s+/g, ' ');
        if (skin === 'cli' && h.shown) {
            if (!h.shown.text.includes(SAFE)) problems.push(`${label} [cli shown]: the hostile string is not shown as literal text with U+FFFD`);
        } else if (skin === 'gui') {
            if (!collapsed.includes('<img src=x onerror=alert(1)>')) problems.push(`${label} [gui]: the hostile string is not shown as literal text`);
        }
        for (const [m] of (h.toasts || []).map(x => [x])) if (typeof m === 'string' && /<img/.test(m) && skin === 'gui') { /* a toast is set as text by the game's own alert */ }
    }
}

const failing = (list) => assert.deepEqual(list, [], `\n${list.join('\n')}`);

test.beforeEach(() => { choice.forgetPress(); delete window.gameScenario; });

test('the opening render and `show` hold the hostile text as text', async () => {
    const problems = [];
    await hostileStep('opening', () => ({}), problems);
    failing(problems);
});

test('every offer with a fake answer: nothing hostile becomes markup', async () => {
    const problems = [];
    const list = await baseOffers(world(plain));
    for (const offer of list.filter(o => o.action !== 'unplug')) {
        await hostileStep(labelOf(offer), (w) => stepFor(offer, answerFor(w, offer)), problems);
    }
    failing(problems);
});

test('one `already` answer per ops route, one refusal per code, no reply', async () => {
    const problems = [];
    const list = await baseOffers(world(plain));
    for (const action of OPS) {
        const offer = list.find(o => o.action === action);
        await hostileStep(`already ${action}`, (w) => stepFor(offer, answerFor(w, offer, { already: true })), problems);
        await hostileStep(`no reply ${action}`, () => stepFor(offer, new Error('no reply')), problems);
    }
    for (const code of CODES) {
        for (const action of code === 'need_unmet' ? ['use'] : ['scan', 'use']) {
            const offer = list.find(o => o.action === action);
            await hostileStep(`refusal ${code} on ${action}`, (w) => stepFor(offer, { success: false, reason: code, ...(code === 'need_unmet' ? { need: { label: w.needLabel } } : {}) }), problems);
        }
    }
    failing(problems);
});

test('an unplug refused with a hostile message, and one with no reply', async () => {
    const problems = [];
    const list = await baseOffers(world(plain));
    const offer = list.find(o => o.action === 'unplug');
    await hostileStep('unplug refused', (w) => stepFor(offer, { action: 'error', message: w.unplugMessage }), problems);
    await hostileStep('unplug no reply', () => stepFor(offer, new Error('no reply')), problems);
    failing(problems);
});

// Every served `cli` field (unit 24) as the Terminal's log holds it: through the generators and the log's own recorders,
// with no DOM. Each field is its own hostile string (the hostile text, then the field's name), so each is found on its own:
// as literal text, with its control characters replaced.
test('every served cli field is held as literal text in the log, with its control characters replaced', async () => {
    const FMT = await imp(`${NV}terminal-format.js`);
    const FW = await imp(`${NV}cli-gen/framework-console.js`);
    const w = world((name) => `${HOSTILE}${name}`);
    const view = { ...clone(w.body.footholds[0]), techniques: clone(w.body.techniques) };
    const dev = view.hosts.find(r => r.id === 'dev_b');
    const offers = {
        sweep: { action: 'sweep', target: 'lab_net', ids: { networkId: 'lab_net' } },
        scan: { action: 'scan', target: 'dev_b', ids: { hostId: 'dev_b' } },
        check: { action: 'check', target: 'dev_b:web', ids: { hostId: 'dev_b', service: 'web' } },
        confirm: { action: 'confirm', target: 'dev_b.web.one', ids: { findingId: 'dev_b.web.one' } },
        use: { action: 'use', target: { card: 't1', finding: 'dev_b.web.one' }, ids: { findingId: 'dev_b.web.one', techniqueId: 't1', itemId: 'card_t1' } }
    };
    const answers = {
        sweep: { success: true, network: { id: 'lab_net', swept: true, hosts: clone(view.hosts) } },
        scan: { success: true, host: clone(dev) },
        check: { success: true, hostId: 'dev_b', service: 'web', findings: clone(dev.findings.filter(f => f.service === 'web')) },
        confirm: { success: true, finding: { ...clone(dev.findings[0]), status: 'confirmed', needs: [] } },
        use: w.answers.useSession
    };
    const log = FMT.logFor('hostile-cli', { create: true });
    for (const [k, offer] of Object.entries(offers)) { FMT.recordSent(log, offer, undefined, view); FMT.recordResult(log, offer, answers[k], view); }
    const mode = { prompt: 'msf', module: 'dev_b.web.one', technique: 't1' };
    for (const lines of [FW.search(view), FW.info(view, mode), FW.showOptions(view, mode)]) for (const l of lines) FMT.appendLine(log, l);
    const spans = log.lines.flat();
    for (const sp of spans) assert.doesNotMatch(sp.text, CONTROL, `control character in ${JSON.stringify(sp.text)}`);
    const text = spans.map(sp => sp.text).join('\n');
    const want = ['cliTitle_f1', 'cliModule_f1', 'cliScript_f1', 'cliAdvisoryA_f1', 'cliAdvisoryB_f1', 'cliOutputA_f1', 'cliOutputB_f1', 'cliBanner_web', 'cliService_web', 'cliProtocol_web', 'addressB', 'cliRange'];
    const missing = want.filter(name => !text.includes(`${SAFE}${name}`));
    assert.deepEqual(missing, [], `fields never shown as literal text: ${missing.join(', ')}`);
    FMT.dropLog('hostile-cli');
});

test('the checks themselves find a tag, an attribute, a control character and an extra line', () => {
    const facts0 = { cli: true, tags: new Set(['div', 'span']), on: [], imgs: 0, text: 'ok', html: '', lines: 3, logShape: true, regions: { log: 'ok', strip: 'ok', other: '' } };
    const run = (f) => { const p = []; check('x', { ...facts0, ...f }, facts0, p); return p.length; };
    assert.equal(run({}), 0);
    assert.equal(run({ tags: new Set(['div', 'img']), imgs: 1 }), 2);
    assert.equal(run({ on: ['span[onerror]'] }), 1);
    assert.equal(run({ regions: { log: 'a\u2028b', strip: 'ok', other: '' } }), 1);
    assert.equal(run({ lines: 4 }), 1);
    assert.equal(run({ logShape: false }), 1);
});
