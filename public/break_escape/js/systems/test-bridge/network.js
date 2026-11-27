/**
 * window.__test.network: the network view's two skins (Panels `gui` and Terminal `cli`), driven
 * the way a player drives them (docs/test-bridge.md, "Network view").
 *
 *   state()            { skin, hasSwitch, footholdId, status, offers }: equal in both skins apart
 *                      from `skin`. `offers` are the offers open now, as plain data.
 *   run(offer, opts)   performs one of those offers with real input by the named `path`, and
 *                      resolves { ok, path, sent, answer } with the server's answer. Without a
 *                      path: `select` for a use and `button` for the rest in Panels, `typed` in the
 *                      Terminal. Rejects when the path does not belong to the active skin, the offer
 *                      is not in the list, or the offer is pending; nothing is clicked or sent then.
 *   skin()             the skin on screen ('gui', 'cli'), null with no view open.
 *   setSkin(name)      presses the header switch.
 *   storePick(name)    writes the stored pick (skin-choice.js writePick) and presses nothing; it
 *                      works with or without a view open.
 *   log()              the Terminal's log as lines (empty in Panels).
 *   type(line)         types a line into the Terminal prompt and presses Enter.
 *
 * Every move ends in a click, a key press or a form submit on the mounted skin's own controls: the
 * bridge never calls the server, the core's `perform` or a renderer to make a move. The one thing it
 * reaches into the scene for is to read (the offer list, the view's own test state) and to hear the
 * answer: for the length of one `run` it wraps the scene's `onEnded` hook, then puts it back.
 * Address network-view controls by selector, label or `network.run`, never by number.
 */

import { clickElement, typeInto, sleepFrames } from './input.js';
import { writePick } from '../../minigames/network-view/skin-choice.js';

const json = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));
const PATHS = Object.freeze({ gui: ['button', 'select'], cli: ['typed', 'button'] });
const GUARDED = Object.freeze(['sweep', 'scan', 'check', 'confirm', 'use', 'unplug']);
const ANSWER_MS = 15000;

/** The open network view, or null: the running minigame when it has the scene's offer list. */
function openScene() {
    const m = window.MinigameFramework?.currentMinigame;
    return m && typeof m.currentOffers === 'function' && typeof m.getTestState === 'function' ? m : null;
}

const rootOf = (scene) => scene.container || scene.gameContainer || document;
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function offerData(o) {
    return json({ action: o.action, target: o.target, ids: o.ids || {}, label: o.label, title: o.title ?? null,
        command: o.command ?? null, pending: o.pending === true });
}

function fail(message) { throw new Error(`network: ${message}`); }

/** The row and alias of a finding id, from the view's own test state (it reads the same in both skins). */
function findingOf(scene, findingId) {
    const st = scene.getTestState();
    const rows = [...(st.rows || []), ...(st.networks || []).flatMap(b => b.rows || [])];
    for (const r of rows) {
        const f = (r.findings || []).find(x => x.id === findingId);
        if (f) return { hostId: r.id, alias: f.alias, finding: f };
    }
    return null;
}

const pick = (root, selector, test) => [...root.querySelectorAll(selector)].find(test) || null;
const attr = (el, name) => el?.closest?.(`[${name}]`)?.getAttribute(name) ?? null;

/** The control of a (non-use) offer in the mounted skin: the button in Panels, the quick command in the Terminal. */
function controlFor(scene, offer) {
    const root = rootOf(scene);
    const { action, ids = {} } = offer;
    if (action === 'unplug') return root.querySelector('[data-unplug]');
    const all = [...root.querySelectorAll(`[data-action="${action}"]`)];
    switch (action) {
        case 'sweep': return all.find(b => attr(b, 'data-network-id') === ids.networkId) || null;
        case 'scan': case 'sign-in': return all.find(b => attr(b, 'data-host-id') === ids.hostId) || null;
        case 'check': return all.find(b => attr(b, 'data-host-id') === ids.hostId && attr(b, 'data-service') === ids.service) || null;
        case 'confirm': {
            const hit = findingOf(scene, ids.findingId);
            return hit ? all.find(b => attr(b, 'data-host-id') === hit.hostId && attr(b, 'data-finding') === hit.alias) || null : null;
        }
        case 'open': return all.find(b => (ids.hostId ? attr(b, 'data-host-id') === ids.hostId : attr(b, 'data-resource-id') === ids.resourceId)) || null;
        case 'observe': return all.find(b => attr(b, 'data-resource-id') === ids.resourceId) || null;
        default: return null;
    }
}

const must = (el, what) => { if (!el) fail(`no ${what} on screen`); return el; };

/** Unfold the Terminal's strip (and step back out of a half-made use) so its buttons can be pressed. */
function openStrip(scene) {
    const root = rootOf(scene);
    const fold = root.querySelector('.network-term-fold');
    if (fold && fold.getAttribute('aria-expanded') === 'false') clickElement(fold);
    const back = root.querySelector('.network-term-back');
    if (back) clickElement(back);
}

/** The presses of one offer on the mounted skin, by the named path. */
async function press(scene, skin, path, offer) {
    const root = rootOf(scene);
    if (path === 'typed') {
        const input = must(root.querySelector('.network-term-input'), 'prompt');
        const line = offer.command;
        if (typeof line !== 'string' || line === '') fail('the offer has no command to type');
        await submit(input, line);
        return;
    }
    if (offer.action !== 'use') {
        if (skin === 'cli') openStrip(scene);
        clickElement(must(controlFor(scene, offer), `${offer.action} control`));
        return;
    }
    const hit = findingOf(scene, offer.ids.findingId);
    if (!hit) fail('the finding is not listed');
    const tech = offer.ids.techniqueId;
    if (skin === 'gui') {
        const card = must(pick(root, `[data-technique="${tech}"] [data-action="select-technique"]`, () => true), 'technique card');
        if (card.getAttribute('aria-pressed') !== 'true') clickElement(card);
        const sel = must(pick(root, `[data-host-id="${hit.hostId}"] [data-finding="${hit.alias}"] [data-action="select-finding"]`, () => true), 'finding select');
        if (sel.getAttribute('aria-pressed') !== 'true') clickElement(sel);
        await sleepFrames(1);
        clickElement(must(root.querySelector('[data-techniques] [data-action="use"]'), 'Use control'));
        return;
    }
    openStrip(scene);
    clickElement(must(pick(root, `[data-technique="${tech}"] [data-action="select-technique"]`, () => true), 'technique button'));
    await sleepFrames(1);
    clickElement(must(pick(root, `[data-technique="${tech}"][data-finding="${hit.alias}"] [data-action="use"]`, () => true), 'finding button'));
}

/** Types a line into the prompt, then presses Enter: the key, then the form's own submit (a synthetic key does not submit). */
async function submit(input, line) {
    await typeInto(input, line, { perCharMs: 0 });
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));
    const form = input.form || input.closest('form');
    if (typeof form?.requestSubmit === 'function') form.requestSubmit();
    else form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

export const networkBridge = {
    state() {
        const scene = openScene();
        if (!scene) return { skin: null, hasSwitch: false, footholdId: null, status: null, offers: [] };
        return json({
            skin: scene.mounted || 'gui',
            hasSwitch: !!rootOf(scene).querySelector('[data-skin-switch]'),
            footholdId: scene.footholdId ?? null,
            status: scene.status ?? null,
            offers: scene.currentOffers().map(offerData)
        });
    },

    skin() {
        const scene = openScene();
        return scene ? (scene.mounted || 'gui') : null;
    },

    log() {
        const scene = openScene();
        if (!scene || scene.mounted !== 'cli') return [];
        return json(scene.getTestState().log || []);
    },

    /** Perform `offer` (one of state().offers) by `opts.path`; resolves { ok, path, sent, answer }. */
    async run(offer, opts = {}) {
        const scene = openScene();
        if (!scene) fail('no network view is open');
        const skin = scene.mounted || 'gui';
        const wanted = offer && typeof offer === 'object' ? offer : null;
        if (!wanted || typeof wanted.action !== 'string') fail('run needs an offer from state().offers');
        const path = opts.path || (skin === 'cli' ? 'typed' : (wanted.action === 'use' ? 'select' : 'button'));
        if (!PATHS[skin].includes(path)) fail(`path "${path}" does not belong to the ${skin} skin (use ${PATHS[skin].join(' or ')})`);
        if (path === 'select' && wanted.action !== 'use') fail('the select path is for a use offer');
        const listed = scene.currentOffers().find(o => o.action === wanted.action
            && same(o.target, wanted.target !== undefined ? wanted.target : o.target)
            && (wanted.target !== undefined || same(o.ids, wanted.ids ?? o.ids)));
        if (!listed) fail(`the offer ${wanted.action} is not in the list`);
        if (listed.pending === true) fail(`the offer ${wanted.action} is pending`);

        // Hear the answer: wrap the scene's hooks for this one move
        const had = Object.prototype.hasOwnProperty.call(scene, 'onEnded');
        const hadSent = Object.prototype.hasOwnProperty.call(scene, 'onSent');
        const origEnded = scene.onEnded;
        const origSent = scene.onSent;
        let sent = false;
        let heard;
        const done = new Promise(resolve => { heard = resolve; });
        scene.onSent = function (o, ...rest) {
            if (o?.action === listed.action && same(o.target, listed.target)) sent = true;
            return origSent?.call(this, o, ...rest);
        };
        scene.onEnded = function (o, a, ...rest) {
            try { return origEnded?.call(this, o, a, ...rest); } finally {
                if (o?.action === listed.action && same(o.target, listed.target)) heard({ answer: a ?? null });
            }
        };
        const restore = () => {
            if (had) scene.onEnded = origEnded; else delete scene.onEnded;
            if (hadSent) scene.onSent = origSent; else delete scene.onSent;
        };
        try {
            await press(scene, skin, path, listed);
            if (!GUARDED.includes(listed.action)) {
                // Sign-in, open and look send no request of their own: the click is the whole move
                await sleepFrames(2);
                return { ok: true, path, sent: false, answer: null };
            }
            await sleepFrames(2);
            if (!sent && !scene.pending?.size) fail(`the press of ${listed.action} sent nothing (the scene turned it away)`);
            const out = await Promise.race([
                done,
                new Promise(resolve => setTimeout(() => resolve(null), opts.timeoutMs ?? ANSWER_MS))
            ]);
            if (!out) fail(`no answer to ${listed.action} within ${opts.timeoutMs ?? ANSWER_MS} ms`);
            await sleepFrames(1);
            return json({ ok: true, path, sent: true, answer: out.answer });
        } finally {
            restore();
        }
    },

    /** Press the header switch to reach `name`; resolves { ok, skin }. */
    async setSkin(name) {
        const scene = openScene();
        if (!scene) fail('no network view is open');
        if (name !== 'gui' && name !== 'cli') fail(`"${name}" is not a skin`);
        if ((scene.mounted || 'gui') === name) return { ok: true, skin: name, changed: false };
        const btn = rootOf(scene).querySelector(`[data-skin-switch="${name}"]`);
        if (!btn) fail('the view has no switch to that skin');
        clickElement(btn);
        await sleepFrames(2);
        return { ok: true, skin: scene.mounted || 'gui', changed: true };
    },

    /** Store the pick (as the switch's press would) without pressing anything. */
    storePick(name) {
        let storage = null;
        try { storage = window.localStorage; } catch (e) { storage = null; }
        return { ok: !!storage && writePick(storage, name), name };
    },

    /** Type `line` into the Terminal prompt and press Enter. */
    async type(line) {
        const scene = openScene();
        if (!scene || scene.mounted !== 'cli') fail('the Terminal is not on screen');
        const input = must(rootOf(scene).querySelector('.network-term-input'), 'prompt');
        await submit(input, String(line));
        await sleepFrames(2);
        return { ok: true, line: String(line) };
    }
};
