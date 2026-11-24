// A shared harness for the network view's scene tests (Ops S6 unit 01).
//
// It copies the real scene and the modules it imports into a temporary folder, runs them against
// jsdom with a fake `networkLinks`, a fake API client and fake openers that record every call and
// a toast capture, and mounts the scene on a fixture view answer (a `GET /network` body).
//
// The copy list is the folder `minigames/network-view/` taken whole (every .js file in it, and in
// its subfolders such as `cli-gen/`, keeping the subfolder) plus the fixed helpers the scene
// imports. A module a later unit adds to that folder is therefore copied with no edit here, so the
// tests built on this file keep passing unedited through the split.
//
// Exports: `mount`, `loadFixture`, `fixtureNames`, `VARIANTS`, `SEQUENCES`, `snapshotVariant`,
// `unchangedCases`, `snapshotUnchanged`, `settle`, `scene` (the scene module), `model` (ops-model).
// The recorder that wrote the saved snapshots is not part of the repository: a snapshot is only
// ever compared, and is never re-recorded after the scene has changed.
import { readFileSync, readdirSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');
const js = join(root, 'public/break_escape/js');
export const FIXTURE_DIR = join(here, '../fixtures/network-view');
export const UNCHANGED_SOURCE_DIR = join(root, 'test/fixtures/files/ops_unchanged');

const dir = mkdtempSync(join(tmpdir(), 'network-view-harness-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
const copyFolder = (rel) => {
    for (const name of readdirSync(join(js, rel))) {
        const sub = `${rel}/${name}`;
        if (statSync(join(js, sub)).isDirectory()) copyFolder(sub);
        else if (name.endsWith('.js')) copy(sub);
    }
};
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
for (const f of ['utils/escape-html.js', 'utils/more-below.js', 'utils/author-html.js', 'utils/conditional-text.js',
    'systems/global-writer.js', 'utils/remote-host-text.js', 'utils/sync-before-fetch.js', 'systems/network-links.js',
    'minigames/framework/base-minigame.js', 'utils/compromise-bolt.js']) copy(f);
copyFolder('minigames/network-view');

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
// The compromise bolt draws on a canvas: a stand-in context, as the scene's own tests use
window.HTMLCanvasElement.prototype.getContext = function () { return { fillStyle: '', fillRect() {} }; };
export const imp = (rel) => import(pathToFileURL(join(dir, rel)));
export const scene = await imp('minigames/network-view/network-view-minigame.js');
export const model = await imp('minigames/network-view/ops-model.js');
const { NetworkLinks } = await imp('systems/network-links.js');
const { NetworkViewMinigame } = scene;

export const settle = async (n = 6) => { for (let i = 0; i < n; i++) await new Promise(r => setTimeout(r, 0)); };
const clone = (v) => JSON.parse(JSON.stringify(v));

// ---------------------------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------------------------

export function fixtureNames() {
    return readdirSync(FIXTURE_DIR).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)).sort();
}
export function loadFixture(name) {
    return JSON.parse(readFileSync(join(FIXTURE_DIR, `${name}.json`), 'utf8'));
}

/** Every view the Panels snapshot covers: each fixture on its own, and the planted box opened at its jack. */
export const VARIANTS = Object.freeze([
    ...fixtureNames().map(name => ({ name, fixture: name, unplug: false })),
    { name: 'planted_box.at_jack', fixture: 'planted_box', unplug: true }
]);

/** Control sequences recorded after the single presses: select then Use, and a card dragged onto a finding. */
export const SEQUENCES = Object.freeze([
    { name: 'select-then-use', steps: [['select-finding', 'f1'], ['select-technique', 'phish'], ['use']] },
    { name: 'drag-card', steps: [['drag', 'phish', 'f1']] }
]);

// ---------------------------------------------------------------------------------------------
// The mount
// ---------------------------------------------------------------------------------------------

const REFUSED = Object.freeze({ success: false, reason: 'not_found' });

function framework() {
    return {
        currentMinigame: null,
        mainGameScene: {},
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

/**
 * Mounts the real scene on a fixture view answer and returns a handle.
 * `unplug`: the view is opened at its jack, so the header has Unplug. `hold`: every move the view
 * sends waits for `release(answerOrError)`. The handle records `calls` (API requests), `opened`
 * (the screens a row opens), `toasts` and `events` (each as plain data). `params`: more scene params (for
 * example `{ skin: 'cli' }`, which the real starter works out); `starter`: open through the scene's own
 * `startNetworkViewMinigame`.
 */
export async function mount(body, { unplug = false, hold = false, footholdId = null, params = {}, starter = false } = {}) {
    window.MinigameFramework?.endMinigame?.(false, null);
    const h = { calls: [], opened: [], toasts: [], events: [], held: [], hold };
    const entry = (footholdId ? body.footholds.find(f => f.id === footholdId) : null) || body.footholds[0];
    const { hosts, networks, techniques, ...foothold } = entry;
    const fid = foothold.id;
    document.body.innerHTML = '';
    window.eventDispatcher = { emit: (n, d) => h.events.push([n, clone(d ?? null)]) };
    window.gameAlert = (message, type) => { h.toasts.push([String(message), type ?? null]); };
    window.gameState = { globalVariables: {} };
    window.applyInventoryDelta = () => {};
    window.inventory = { items: [] };
    window.pcSessions = { noteTechniqueSession() {}, remoteViewFoothold: () => null };
    window.keyring = { refresh: () => Promise.resolve() };
    const move = (name, args, ok = REFUSED) => {
        h.calls.push([name, ...clone(args)]);
        if (!h.hold) return Promise.resolve(clone(ok));
        return new Promise((resolve, reject) => h.held.push({ resolve, reject, ok }));
    };
    window.ApiClient = {
        network: async (id) => { h.calls.push(['network', id]); return clone(body); },
        networkScan: (id, params) => move('scan', [id, params]),
        networkCheck: (id, params) => move('check', [id, params]),
        networkConfirm: (id, params) => move('confirm', [id, params]),
        networkTechnique: (id, params) => move('technique', [id, params]),
        networkUnplug: (jackId) => move('unplug', [jackId], { success: true, added: [], removed: [foothold.itemId], endedPcIds: [] })
    };
    window.openRemoteDesktop = (pcId, from) => h.opened.push(['openRemoteDesktop', pcId, from]);
    window.openRemoteSignIn = (row, from) => h.opened.push(['openRemoteSignIn', row?.id ?? null, from]);
    window.openFromDesktop = (pcId, from) => h.opened.push(['openFromDesktop', pcId, from]);
    window.startContainerMinigame = (item, contents, takeable, desktop) =>
        h.opened.push(['startContainerMinigame', item?.scenarioData?.id ?? null, desktop === true]);
    window.MinigameFramework = framework();
    const jack = unplug ? (foothold.sourceId || 'port_a') : null;
    window.startNetworkViewMinigame = (id, { unplugJack = null } = {}) =>
        window.MinigameFramework.startMinigame('network-view', null,
            { title: 'Link', footholdId: id, unplugJack, refetchMs: 1e9, refetchIdleMs: 1e9, ...params });
    // `starter`: the scene's own starter (it works the skin out), not the stand-in above
    if (starter) window.startNetworkViewMinigame = scene.startNetworkViewMinigame;
    const links = new NetworkLinks();
    window.networkLinks = links;
    links.load([foothold], foothold.sourceId ? [foothold.sourceId] : []);
    if (unplug) links.trip = { footholdId: fid, atJack: jack };
    window.startNetworkViewMinigame(fid, { unplugJack: jack });
    await settle();
    h.mountEvents = h.events.splice(0);
    h.calls.length = 0;
    Object.assign(h, {
        view: () => window.MinigameFramework.currentMinigame,
        dom: () => window.MinigameFramework.currentMinigame.container.innerHTML,
        controls: () => [...window.MinigameFramework.currentMinigame.container.querySelectorAll('[data-action], [data-unplug]')],
        controlKeys: () => h.controls().map(attrKey),
        /** Settles the moves a held mount is waiting on: a body resolves, an Error rejects (with `status`). */
        release: async (answer) => {
            const held = h.held.splice(0);
            for (const m of held) {
                if (answer instanceof Error) m.reject(answer); else m.resolve(clone(answer ?? m.ok));
            }
            await settle();
        },
        end: () => { window.MinigameFramework?.endMinigame?.(false, null); },
        /** The records a press leaves: requests, opened screens, toasts and events, in that order. */
        record: () => clone({ calls: h.calls, opened: h.opened, toasts: h.toasts, events: h.events })
    });
    return h;
}

/** Presses control `index` of a fresh mount; resolves { record, pendingDom }. */
async function pressOne(body, opts, index) {
    const h = await mount(body, { ...opts, hold: true });
    const btn = h.controls()[index];
    const localOnly = ['select-finding', 'select-technique'].includes(btn.dataset.action);
    const disabled = btn.disabled === true;
    btn.click();
    await settle();
    const pendingDom = localOnly || disabled ? null : h.dom();
    await h.release();
    const out = { record: h.record(), pendingDom, disabled };
    h.end();
    return out;
}

function stepElement(h, step) {
    const root = h.view().container;
    if (step[0] === 'select-finding') return root.querySelector(`[data-finding="${step[1]}"] [data-action="select-finding"]`);
    if (step[0] === 'select-technique') return root.querySelector(`[data-technique="${step[1]}"] [data-action="select-technique"]`);
    if (step[0] === 'use') return root.querySelector('[data-techniques] [data-action="use"]');
    return null;
}

async function runSequence(body, opts, seq) {
    const h = await mount(body, { ...opts, hold: true });
    const done = [];
    for (const step of seq.steps) {
        if (step[0] === 'drag') {
            const card = h.view().container.querySelector(`[data-technique="${step[1]}"]`);
            const target = h.view().container.querySelector(`[data-finding="${step[2]}"]`);
            if (!card || !target) { done.push('missing'); continue; }
            card.dispatchEvent(new window.Event('dragstart', { bubbles: true }));
            target.dispatchEvent(new window.Event('dragover', { bubbles: true, cancelable: true }));
            target.dispatchEvent(new window.Event('drop', { bubbles: true, cancelable: true }));
        } else {
            const el = stepElement(h, step);
            if (!el) { done.push('missing'); continue; }
            el.click();
        }
        done.push('done');
        await settle();
    }
    const pendingDom = h.dom();
    await h.release();
    const out = { steps: done, record: h.record(), pendingDom };
    h.end();
    return out;
}

/**
 * Everything one variant saves: the mounted DOM string, the events the mount emitted, and for each
 * control (by order and key) the record its press leaves and the DOM while its answer is held; for
 * a variant with an unplug button, the DOM while the unplug is held and after it is refused; and for
 * a variant that holds techniques, the sequences.
 */
export async function snapshotVariant(variant) {
    const body = loadFixture(variant.fixture);
    const opts = { unplug: variant.unplug };
    const h = await mount(body, opts);
    const dom = h.dom();
    const keys = h.controlKeys();
    const mountEvents = h.mountEvents;
    const hasTechniques = !!h.view().container.querySelector('[data-techniques]');
    h.end();
    const controls = [];
    for (let i = 0; i < keys.length; i++) {
        const { record, pendingDom, disabled } = await pressOne(body, opts, i);
        controls.push({ index: i, key: keys[i], disabled, record, pendingDom });
    }
    const out = { variant: variant.name, mountEvents, controls };
    if (variant.unplug) {
        const held = await mount(body, { ...opts, hold: true });
        held.view().container.querySelector('[data-unplug]').click();
        await settle();
        out.unplugHeldDom = held.dom();
        await held.release(Object.assign(new Error('refused'), { status: 403 }));
        out.unplugRefusedDom = held.dom();
        out.unplugRecord = held.record();
        held.end();
    }
    if (hasTechniques) {
        out.sequences = [];
        for (const seq of SEQUENCES) out.sequences.push({ name: seq.name, ...(await runSequence(body, opts, seq)) });
    }
    return { dom, data: out };
}

// ---------------------------------------------------------------------------------------------
// The existing scenarios' recorded views
// ---------------------------------------------------------------------------------------------

/**
 * Every `GET /network` answer in each `core_*.json` of the unchanged-scenario folder that holds a
 * foothold, as { file, index, step, key, body }. The folder is listed, so a new file joins.
 */
export function unchangedCases() {
    const cases = [];
    for (const file of readdirSync(UNCHANGED_SOURCE_DIR).filter(f => /^core_.*\.json$/.test(f)).sort()) {
        const doc = JSON.parse(readFileSync(join(UNCHANGED_SOURCE_DIR, file), 'utf8'));
        const answers = doc.expected?.answers || [];
        doc.steps.forEach((step, index) => {
            if (step.method !== 'GET' || step.path !== 'network') return;
            const answer = answers[index];
            const footholds = answer?.body?.footholds;
            if (!Array.isArray(footholds) || !footholds.length) return;
            const wanted = step.params?.foothold || null;
            if (wanted && !footholds.some(f => f.id === wanted)) return;
            cases.push({ file, index, step: step.id, footholdId: wanted, key: `${file.replace(/\.json$/, '')}.${String(index).padStart(2, '0')}-${step.id}`, body: answer.body });
        });
    }
    return cases;
}

export async function snapshotUnchanged(c) {
    const h = await mount(c.body, { footholdId: c.footholdId });
    const dom = h.dom();
    h.end();
    return dom;
}

