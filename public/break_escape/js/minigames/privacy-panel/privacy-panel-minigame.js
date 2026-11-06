// The privacy-settings panel overlay (ENG-13): a list of profile settings, each with a switch.
// Turning a switch to tight marks the found OSINT facts it names as closed, in this panel's view
// only. The panel reads the scenario's `social.intelFacts` and the `se_intel_*` globals and never
// writes either, so the intel board and the OSINT browser are untouched. Unscored.
//
// Params:
//   config    the privacyPanel block { settings: [{ id, label, closesFacts, hint?, section?, default? }],
//             note?, strings? } (see privacy-model.js)
//   social    scenario.social (for intelFacts); defaults to window.gameScenario.social
//   globals   the game's global variables (read-only); defaults to window.gameState.globalVariables
//   skin      'awareness' picks up the neutral skin's colours (--aw-*)
//
// Done is a normal exit with the record { done, settings, tightened, facts, closed }. Close and Esc
// are an aborted run: nothing is kept and the host offers the panel again. Every string the learner
// reads goes in with textContent.

import { SocialOverlayScene } from '../framework/social-overlay.js';
import {
    normaliseConfig, initialTight, buildView, summarise, privacyText, OPEN, TIGHT
} from './privacy-model.js';

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export class PrivacyPanelMinigame extends SocialOverlayScene {
    constructor(container, params) {
        super(container, params);
        this.config = null;
        this.tight = new Set();
        this.result = null;
        this._live = '';
    }

    get text() {
        return (key, tokens) => privacyText(key, this.config, tokens);
    }

    get _social() {
        return isObj(this.params.social) ? this.params.social : (typeof window !== 'undefined' ? window.gameScenario?.social : null) || {};
    }

    get _globals() {
        if (isObj(this.params.globals)) return this.params.globals;
        return (typeof window !== 'undefined' ? window.gameState?.globalVariables : null) || {};
    }

    init() {
        super.init();
        this.config = normaliseConfig(this.params.config);
        if (this.config) this.tight = initialTight(this.config);

        const root = el('div', 'pp-root');
        root.setAttribute('role', 'region');
        root.setAttribute('aria-label', this.text('title'));
        if (this.params.skin === 'awareness') root.classList.add('aw-skin');
        this.root = root;
        this.gameContainer.appendChild(root);

        const bar = el('div', 'pp-toolbar');
        bar.appendChild(el('h2', 'pp-title', this.text('title')));
        this.mountCloseControl(bar, 'Close');
        root.appendChild(bar);

        this.liveEl = el('p', 'pp-live');
        this.liveEl.setAttribute('aria-live', 'polite');
        root.appendChild(this.liveEl);

        this.stageEl = el('div', 'pp-stage');
        root.appendChild(this.stageEl);
        this._render();
    }

    start() {
        super.start();
        this.stageEl?.querySelector?.('[data-autofocus]')?.focus?.();
    }

    _announce(text) {
        this._live = text;
        if (this.liveEl) this.liveEl.textContent = text;
    }

    _view() {
        return buildView(this.config, this._social, this._globals, this.tight);
    }

    _render() {
        const keepFocus = this.stageEl.contains(document.activeElement) ? document.activeElement?.dataset?.setting : null;
        this.stageEl.textContent = '';
        const p = el('section', 'pp-panel');
        const h = el('h3', 'pp-heading', this.text('heading'));
        h.tabIndex = -1;
        h.dataset.autofocus = '1';
        p.appendChild(h);

        if (!this.config) {
            p.appendChild(el('p', 'pp-text pp-empty', this.text('noSettings')));
            this._doneButton(p);
            this.stageEl.appendChild(p);
            return;
        }
        p.appendChild(el('p', 'pp-text', this.text('intro')));
        if (this.config.note) p.appendChild(el('p', 'pp-note', this.config.note));

        const view = this._view();
        const counter = el('p', 'pp-counter', view.factsClosed === view.factsTotal && view.factsTotal > 0
            ? this.text('allClosed')
            : this.text('counter', { closed: view.factsClosed, total: view.factsTotal }));
        counter.dataset.closed = String(view.factsClosed);
        p.appendChild(counter);

        let section = null;
        let list = null;
        for (const s of view.settings) {
            if (!list || s.section !== section) {
                section = s.section;
                if (section) p.appendChild(el('h4', 'pp-section', section));
                list = el('ul', 'pp-settings');
                p.appendChild(list);
            }
            list.appendChild(this._settingRow(s));
        }
        this._doneButton(p);
        this.stageEl.appendChild(p);
        if (keepFocus) this.stageEl.querySelector(`[data-setting="${keepFocus}"]`)?.focus?.();
    }

    _settingRow(s) {
        const li = el('li', 'pp-setting');
        li.dataset.settingId = s.id;
        li.dataset.state = s.tight ? TIGHT : OPEN;
        const head = el('div', 'pp-setting-head');
        const sw = el('button', 'pp-switch minigame-button');
        sw.type = 'button';
        sw.setAttribute('role', 'switch');
        sw.setAttribute('aria-checked', s.tight ? 'true' : 'false');
        sw.dataset.setting = s.id;
        sw.append(el('span', 'pp-switch-label', s.label),
            el('span', 'pp-switch-state', this.text(s.tight ? 'switchTight' : 'switchOpen')));
        this.addEventListener(sw, 'click', () => this.toggle(s.id));
        head.appendChild(sw);
        li.appendChild(head);
        if (s.hint) li.appendChild(el('p', 'pp-hint', s.hint));

        const ul = el('ul', 'pp-facts');
        for (const f of s.facts) {
            const fi = el('li', `pp-fact ${f.closed ? 'pp-closed' : 'pp-open'}`);
            fi.dataset.factId = f.id;
            fi.dataset.state = f.closed ? 'closed' : 'open';
            fi.appendChild(el('span', 'pp-fact-state', this.text(f.closed ? 'factClosed' : 'factOpen')));
            fi.appendChild(el('span', 'pp-fact-text', f.text));
            if (f.onBoard) fi.appendChild(el('span', 'pp-fact-board', this.text('onBoard')));
            if (!f.closed && f.reduceNote) fi.appendChild(el('span', 'pp-fact-note', this.text('leaveOff') + f.reduceNote));
            ul.appendChild(fi);
        }
        li.appendChild(ul);
        return li;
    }

    /** Flip one setting between open and tight; the view redraws and the change is announced. */
    toggle(id) {
        if (!this.config || !this.config.settings.some((s) => s.id === id)) return;
        const before = this._view().factsClosed;
        if (this.tight.has(id)) this.tight.delete(id);
        else this.tight.add(id);
        const view = this._view();
        this._render();
        this._announce(view.factsClosed === view.factsTotal && view.factsTotal > 0
            ? this.text('allClosed')
            : this.text('counter', { closed: view.factsClosed, total: view.factsTotal }));
        return view.factsClosed - before;
    }

    _doneButton(parent) {
        const done = el('button', 'pp-done pp-button minigame-button', this.text('done'));
        done.type = 'button';
        this.addEventListener(done, 'click', () => this.finish());
        parent.appendChild(done);
    }

    // ── exit ─────────────────────────────────────────────────────────────────

    _buildResult() {
        return this.config ? summarise(this._view()) : { done: true, settings: 0, tightened: 0, facts: 0, closed: 0 };
    }

    finish() {
        if (!this.gameState.isActive) return;
        this.result = this._buildResult();
        this.gameResult = this.result;
        this.complete(true);
    }

    /** Close and Esc leave without keeping anything; only Done is a finished run. */
    get closeMode() {
        return 'abort';
    }

    closeResult() {
        return this._buildResult();
    }

    // ── test bridge ──────────────────────────────────────────────────────────

    getTestState() {
        const view = this.config ? this._view() : null;
        return {
            ...super.getTestState(),
            privacyPanel: {
                settings: (view?.settings || []).map((s) => ({
                    id: s.id, tight: s.tight, facts: s.facts.map((f) => ({ id: f.id, closed: f.closed, onBoard: f.onBoard }))
                })),
                factsTotal: view?.factsTotal ?? 0,
                factsClosed: view?.factsClosed ?? 0,
                result: this.result ? JSON.parse(JSON.stringify(this.result)) : null,
                live: this._live
            }
        };
    }
}

export default PrivacyPanelMinigame;
