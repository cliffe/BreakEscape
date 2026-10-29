// The concern form overlay (ENG-12): build a short report from fact chips (what, when, where, who)
// and, if you want to, a conclusion chip. The feedback favours facts over a verdict. Reusable: the
// chips, the guidance and the wording all come from the config; nothing here names a product.
//
// Params:
//   config   the form config (see concern-form-model.js: factChips, conclusionChips, guidance,
//            minFacts, strings)
//   episode  alternatively, an object whose `concernForm` is the config (the episode runner)
//   skin     'awareness' picks up the neutral skin's colours (--aw-*)
//
// Steps: Intro, Build (chips by kind, the report so far, Check my report, then the feedback and
// Done), nothing else. Changing a chip after a check clears the feedback, so the feedback always
// describes the report on screen. Close and Esc before Done end the run as { aborted: true } after
// one "keep going?" check when something is picked (one Esc closes one layer).
//
// Result (gameResult at Done): concernRecord(), counts and a tone. Teaching only, never a mark.
//
// Every string the learner reads goes in with textContent.

import { SocialOverlayScene } from '../framework/social-overlay.js';
import {
    KINDS, normaliseConfig, concernText, kindLabel, assessReport, feedbackFor, concernRecord
} from './concern-form-model.js';

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export class ConcernFormMinigame extends SocialOverlayScene {
    constructor(container, params) {
        super(container, params);
        this.config = null;
        this.picks = new Set();
        this.step = 'intro';
        this.checked = null; // the tone shown, or null when the report has changed since
        this._live = '';
        this._closeAsk = null;
    }

    get text() {
        return (key, tokens) => concernText(key, this.config, tokens);
    }

    // ── lifecycle ────────────────────────────────────────────────────────────

    init() {
        super.init();
        const raw = isObj(this.params.config) ? this.params.config : this.params.episode?.concernForm;
        this.config = normaliseConfig(raw);

        const root = el('div', 'cf-root');
        root.setAttribute('role', 'region');
        root.setAttribute('aria-label', this.text('title'));
        if (this.params.skin === 'awareness') root.classList.add('aw-skin');
        this.root = root;
        this.gameContainer.appendChild(root);

        const bar = el('div', 'cf-toolbar');
        bar.appendChild(el('h2', 'cf-title', this.text('title')));
        this.mountCloseControl(bar, 'Close');
        root.appendChild(bar);

        this.liveEl = el('p', 'cf-live');
        this.liveEl.setAttribute('aria-live', 'polite');
        root.appendChild(this.liveEl);

        this.stageEl = el('div', 'cf-stage');
        root.appendChild(this.stageEl);
        this._showStep('intro');
    }

    start() {
        super.start();
        this._focusStep();
    }

    _announce(text) {
        this._live = text;
        if (this.liveEl) this.liveEl.textContent = text;
    }

    _showStep(step) {
        this.step = step;
        this.stageEl.textContent = '';
        if (step === 'intro') this._renderIntro();
        else this._renderBuild();
        this._focusStep();
    }

    _focusStep() {
        const target = this.stageEl?.querySelector?.('[data-autofocus]');
        if (target) { target.tabIndex = target.tabIndex < 0 ? -1 : target.tabIndex; target.focus?.(); }
    }

    // ── 1 Intro ──────────────────────────────────────────────────────────────

    _renderIntro() {
        const p = el('section', 'cf-panel cf-intro');
        const h = el('h3', 'cf-heading', this.text('heading'));
        h.tabIndex = -1;
        h.dataset.autofocus = '1';
        p.appendChild(h);
        p.appendChild(el('p', 'cf-text', this.text('intro')));
        if (this.config.guidance) p.appendChild(el('p', 'cf-guidance', this.config.guidance));
        const start = el('button', 'cf-start cf-button minigame-button', this.text('start'));
        start.type = 'button';
        this.addEventListener(start, 'click', () => this._showStep('build'));
        p.appendChild(start);
        this.stageEl.appendChild(p);
    }

    // ── 2 Build ──────────────────────────────────────────────────────────────

    _renderBuild() {
        const p = el('section', 'cf-panel cf-build');
        const h = el('h3', 'cf-heading', this.text('factsHeading'));
        h.tabIndex = -1;
        h.dataset.autofocus = '1';
        p.appendChild(h);

        for (const kind of KINDS) {
            const chips = this.config.factChips.filter((c) => c.kind === kind);
            if (!chips.length) continue;
            const group = el('div', 'cf-group');
            group.dataset.kind = kind;
            group.setAttribute('role', 'group');
            const label = el('h4', 'cf-kind', kindLabel(kind, this.config));
            label.id = `cf-kind-${kind}`;
            group.setAttribute('aria-labelledby', label.id);
            group.appendChild(label);
            const row = el('div', 'cf-chips');
            for (const c of chips) row.appendChild(this._chip(c, 'fact'));
            group.appendChild(row);
            p.appendChild(group);
        }

        if (this.config.conclusionChips.length) {
            const group = el('div', 'cf-group cf-conclusions');
            group.setAttribute('role', 'group');
            const label = el('h4', 'cf-kind', this.text('conclusionsHeading'));
            label.id = 'cf-kind-conclusion';
            group.setAttribute('aria-labelledby', label.id);
            group.appendChild(label);
            const row = el('div', 'cf-chips');
            for (const c of this.config.conclusionChips) row.appendChild(this._chip(c, 'conclusion'));
            group.appendChild(row);
            p.appendChild(group);
        }

        p.appendChild(this._report());

        const check = el('button', 'cf-check cf-button minigame-button', this.text('check'));
        check.type = 'button';
        this.addEventListener(check, 'click', () => this._check());
        p.appendChild(check);

        if (this.checked) {
            p.appendChild(this._feedback(this.checked));
            if (this.checked !== 'empty') {
                const done = el('button', 'cf-finish cf-button minigame-button', this.text('done'));
                done.type = 'button';
                this.addEventListener(done, 'click', () => this.finish());
                p.appendChild(done);
            }
        }
        this.stageEl.appendChild(p);
    }

    _chip(chip, role) {
        const btn = el('button', `cf-chip cf-chip-${role} minigame-button`, chip.label);
        btn.type = 'button';
        btn.dataset.chip = chip.id;
        const on = this.picks.has(chip.id);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on) btn.classList.add('cf-on');
        this.addEventListener(btn, 'click', () => this._toggle(chip.id));
        return btn;
    }

    /** The report so far: the picked facts in the config's order, then the conclusion. */
    _report() {
        const a = assessReport(this.config, [...this.picks]);
        const box = el('section', 'cf-report');
        box.setAttribute('aria-label', this.text('reportHeading'));
        box.appendChild(el('h4', 'cf-report-title', this.text('reportHeading')));
        if (!a.facts.length && !a.conclusions.length) {
            box.appendChild(el('p', 'cf-report-empty', this.text('reportEmpty')));
            return box;
        }
        const ul = el('ul', 'cf-report-list');
        for (const c of a.facts) {
            const li = el('li', 'cf-report-fact');
            li.dataset.chip = c.id;
            li.textContent = `${this.text('reportFacts')}, ${kindLabel(c.kind, this.config).toLowerCase()}: ${c.label}`;
            ul.appendChild(li);
        }
        for (const c of a.conclusions) {
            const li = el('li', 'cf-report-conclusion');
            li.dataset.chip = c.id;
            li.textContent = `${this.text('reportConclusion')}: ${c.label}`;
            ul.appendChild(li);
        }
        box.appendChild(ul);
        return box;
    }

    _feedback(tone) {
        const fb = el('div', `cf-feedback cf-${tone}`);
        fb.setAttribute('role', 'status');
        fb.dataset.tone = tone;
        fb.appendChild(el('p', 'cf-feedback-line', feedbackFor(this.config, tone)));
        // The guidance is on the intro already. Under the feedback it shows once, and only when it is
        // not on screen already, so it does not repeat under every check (E16 MINOR-2).
        if (this.config.guidance && !this._guidanceShown && !this.stageEl?.querySelector?.('.cf-guidance')) {
            fb.appendChild(el('p', 'cf-guidance', this.config.guidance));
            this._guidanceShown = true;
        }
        return fb;
    }

    _toggle(id) {
        if (this.step !== 'build') return;
        const isConclusion = this.config.conclusionChips.some((c) => c.id === id);
        if (!isConclusion && !this.config.factChips.some((c) => c.id === id)) return;
        if (this.picks.has(id)) this.picks.delete(id);
        else {
            // One conclusion at most: picking another swaps it.
            if (isConclusion) for (const c of this.config.conclusionChips) this.picks.delete(c.id);
            this.picks.add(id);
        }
        const hadFeedback = this.checked !== null;
        this.checked = null;
        this._announce(hadFeedback ? this.text('changed') : '');
        this._showStep('build');
        this.stageEl.querySelector(`[data-chip="${id}"].cf-chip`)?.focus?.();
    }

    _check() {
        if (this.step !== 'build') return;
        const tone = assessReport(this.config, [...this.picks]).tone;
        this.checked = tone;
        this._announce(feedbackFor(this.config, tone));
        this._showStep('build');
        this.stageEl.querySelector('.cf-feedback')?.scrollIntoView?.({ block: 'nearest' });
    }

    // ── exit ─────────────────────────────────────────────────────────────────

    buildResult() {
        return concernRecord(this.config, [...this.picks]);
    }

    finish() {
        if (!this.gameState.isActive || !this.checked || this.checked === 'empty') return;
        this.gameResult = this.buildResult();
        this.complete(true);
    }

    /** Before Done, Close and Esc end the run as { aborted: true }: a half-built report is not kept. */
    get closeMode() {
        return 'abort';
    }

    closeResult() {
        return this.buildResult();
    }

    requestClose() {
        if (this.picks.size > 0) {
            if (this._closeAsk) { this._dropCloseAsk(); this.abort(); return; }
            this._askClose();
            return;
        }
        super.requestClose();
    }

    _askClose() {
        const box = el('div', 'cf-close-ask');
        box.setAttribute('role', 'alertdialog');
        box.setAttribute('aria-label', this.text('closeAsk'));
        box.appendChild(el('p', 'cf-close-ask-text', this.text('closeAsk')));
        const keep = el('button', 'cf-close-keep minigame-button', this.text('keepGoing'));
        keep.type = 'button';
        const leave = el('button', 'cf-close-leave minigame-button', this.text('closeAnyway'));
        leave.type = 'button';
        this.addEventListener(keep, 'click', () => this._dropCloseAsk(true));
        this.addEventListener(leave, 'click', () => { this._dropCloseAsk(); this.abort(); });
        const row = el('div', 'cf-close-ask-actions');
        row.append(keep, leave);
        box.appendChild(row);
        this.root.insertBefore(box, this.liveEl);
        this._closeAsk = { box, pop: this.pushLayer(() => this._dropCloseAsk(true), 'close-ask') };
        keep.focus?.();
    }

    _dropCloseAsk(restoreFocus = false) {
        const ask = this._closeAsk;
        if (!ask) return;
        this._closeAsk = null;
        ask.pop?.();
        ask.box.remove();
        if (restoreFocus) this.closeButton?.focus?.();
    }

    // ── test bridge ──────────────────────────────────────────────────────────

    getTestState() {
        const a = assessReport(this.config || normaliseConfig(null), [...this.picks]);
        return {
            ...super.getTestState(),
            concernForm: {
                step: this.step,
                factChips: (this.config?.factChips || []).map((c) => ({ id: c.id, kind: c.kind })),
                conclusionChips: (this.config?.conclusionChips || []).map((c) => c.id),
                picks: [...this.picks],
                tone: a.tone,
                checked: this.checked,
                minFacts: this.config?.minFacts ?? null,
                live: this._live
            }
        };
    }
}

export default ConcernFormMinigame;
