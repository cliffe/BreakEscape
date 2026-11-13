// The sort drill overlay (ENG-11): a bank of situation cards, each put into one of two to four
// bins, with the reason on screen after every drop. Reusable: the bins, the cards, the wording
// and whether it is scored all come from the config; nothing here names a product.
//
// Params:
//   config      the drill config (see sort-drill-model.js: bins, cards, scored, answerKeyProfile,
//               alwaysScoresBin, drawRules, drawCount, strings)
//   episode     alternatively, an object whose `sortDrill` is the config (the episode runner)
//   overrides   optional per-card changes from a deployment ({ <cardId>: { answer?, reason?,
//               confirmed? } }); a locked card ignores them
//   rng         optional () => number in [0, 1) for the draw (tests)
//   skin        'awareness' picks up the neutral skin's colours (--aw-*)
//
// Steps: Intro, Sort (one card at a time: choose a bin, read the reason, Next), Summary (every
// card in the bin it went to). Keys 1 to 4 choose the first to fourth bin. Close and Esc before
// the Summary end the run as { aborted: true } after one "keep going?" check (one Esc closes one
// layer); on the Summary they are a normal exit with the result.
//
// Result (gameResult / closeResult at the Summary): scoreDrill()'s record. An unscored drill's
// result holds the placements only, no points and no mark. A scored drill with wrong placements
// also carries `recap`: [{ id, situation, chosen, right, reason }], one per card in a wrong bin.
//
// Every string the learner reads goes in with textContent.

import { SocialOverlayScene } from '../framework/social-overlay.js';
import {
    normaliseConfig, drawCards, scoreCard, scoreDrill, sortText, answersOf
} from './sort-drill-model.js';

const NARROW_QUERY = '(max-width: 767px)';

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export class SortDrillMinigame extends SocialOverlayScene {
    constructor(container, params) {
        super(container, params);
        this.config = null;
        this.cards = [];
        this.placements = new Map(); // card id -> bin id
        this.index = 0;
        this.step = 'intro';
        this.result = null;
        this._live = '';
        this._closeAsk = null;
    }

    // ── data ─────────────────────────────────────────────────────────────────

    get text() {
        return (key, tokens) => sortText(key, this.config, tokens);
    }

    binLabel(id) {
        return this.config.bins.find((b) => b.id === id)?.label || id;
    }

    get current() {
        return this.cards[this.index] || null;
    }

    // ── lifecycle ────────────────────────────────────────────────────────────

    init() {
        super.init();
        const raw = isObj(this.params.config) ? this.params.config : this.params.episode?.sortDrill;
        this.config = normaliseConfig(raw);
        this.cards = drawCards(this.config, { overrides: this.params.overrides, rng: this.params.rng || Math.random });

        const root = el('div', 'sd-root');
        root.setAttribute('role', 'region');
        root.setAttribute('aria-label', this.text('title'));
        if (this.params.skin === 'awareness') root.classList.add('aw-skin');
        this.root = root;
        this.gameContainer.appendChild(root);

        const bar = el('div', 'sd-toolbar');
        this.titleEl = el('h2', 'sd-title', this.text('title'));
        bar.appendChild(this.titleEl);
        this.mountCloseControl(bar, 'Close');
        root.appendChild(bar);

        this.liveEl = el('p', 'sd-live');
        this.liveEl.setAttribute('aria-live', 'polite');
        root.appendChild(this.liveEl);

        this.stageEl = el('div', 'sd-stage');
        root.appendChild(this.stageEl);
        this.addEventListener(root, 'keydown', (e) => this._onKey(e));
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
        else if (step === 'sort') this._renderSort();
        else this._renderSummary();
        this._focusStep();
    }

    _focusStep() {
        const target = this.stageEl?.querySelector?.('[data-autofocus]');
        if (target) { target.tabIndex = target.tabIndex < 0 ? -1 : target.tabIndex; target.focus?.(); }
    }

    // ── 1 Intro ──────────────────────────────────────────────────────────────

    _renderIntro() {
        const p = el('section', 'sd-panel sd-intro');
        const h = el('h3', 'sd-heading', this.text('heading'));
        h.tabIndex = -1;
        h.dataset.autofocus = '1';
        p.appendChild(h);
        if (!this.cards.length) {
            p.appendChild(el('p', 'sd-text sd-empty', this.text('noCards')));
            const done = el('button', 'sd-button minigame-button', this.text('done'));
            done.type = 'button';
            this.addEventListener(done, 'click', () => this.finish());
            p.appendChild(done);
            this.stageEl.appendChild(p);
            return;
        }
        p.appendChild(el('p', 'sd-text', this.text('intro')));
        const dl = el('dl', 'sd-bin-legend');
        this.config.bins.forEach((b, i) => {
            dl.append(el('dt', null, `${i + 1}. ${b.label}`), el('dd', null, b.hint || ''));
        });
        if (this.config.bins.some((b) => b.hint)) p.appendChild(dl);
        // Reopening after a close or reload starts the bank again (progress is not kept, by
        // design); say so once so the learner is not surprised by a fresh card set (E17-m5). An
        // explicit empty override (strings.reloadNote: '') suppresses the line.
        const reload = this.config.strings?.reloadNote === '' ? '' : this.text('reloadNote');
        if (reload) p.appendChild(el('p', 'sd-reload-note', reload));
        const start = el('button', 'sd-start sd-button minigame-button', this.text('start'));
        start.type = 'button';
        this.addEventListener(start, 'click', () => this._showStep('sort'));
        p.appendChild(start);
        this.stageEl.appendChild(p);
    }

    // ── 2 Sort ───────────────────────────────────────────────────────────────

    _renderSort() {
        const card = this.current;
        const placed = card ? this.placements.get(card.id) : null;
        const p = el('section', 'sd-panel sd-sort');
        p.appendChild(el('p', 'sd-counter', this.text('counter', { n: this.index + 1, total: this.cards.length })));

        const box = el('article', 'sd-card');
        box.dataset.cardId = card.id;
        if (card.new) box.appendChild(el('span', 'sd-new', this.text('newBadge')));
        const sit = el('h3', 'sd-situation', card.situation);
        sit.tabIndex = -1;
        if (!placed) sit.dataset.autofocus = '1';
        box.appendChild(sit);
        p.appendChild(box);

        const group = el('div', 'sd-bins');
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', this.text('pickLabel'));
        this.config.bins.forEach((b, i) => {
            const btn = el('button', 'sd-bin-btn minigame-button');
            btn.type = 'button';
            btn.dataset.bin = b.id;
            btn.append(el('span', 'sd-bin-key', String(i + 1)), el('span', 'sd-bin-word', b.label));
            if (placed) {
                btn.disabled = true;
                if (placed === b.id) btn.classList.add('sd-chosen');
            } else {
                this.addEventListener(btn, 'click', () => this._place(b.id));
            }
            group.appendChild(btn);
        });
        p.appendChild(group);

        if (placed) {
            const fb = this._feedback(card, placed);
            p.appendChild(fb);
            const last = this.index >= this.cards.length - 1;
            const next = el('button', 'sd-next sd-button minigame-button', this.text(last ? 'finish' : 'next'));
            next.type = 'button';
            next.dataset.autofocus = '1';
            this.addEventListener(next, 'click', () => this._advance());
            p.appendChild(next);
        }
        p.appendChild(this._board(false));
        this.stageEl.appendChild(p);
    }

    /** The line after a drop: right or not (scored), or the suggestion (unscored), then the reason. */
    _feedback(card, binId) {
        const fb = el('div', 'sd-feedback');
        fb.setAttribute('role', 'status');
        const answers = answersOf(card);
        const names = answers.map((a) => this.binLabel(a)).join(' or ');
        let line;
        let tone;
        if (this.config.scored) {
            const s = scoreCard(this.config, card, binId);
            tone = s.correct ? 'right' : s.caution ? 'caution' : 'wrong';
            line = this.text(s.correct ? 'right' : s.caution ? 'caution' : 'wrong', { bin: names });
        } else {
            // Teaching only: no mark, no right or wrong styling.
            tone = 'teach';
            line = answers.includes(binId) ? this.text('teachFits') : this.text('teach', { bin: names });
        }
        fb.classList.add(`sd-${tone}`);
        fb.dataset.tone = tone;
        fb.appendChild(el('p', 'sd-feedback-line', line));
        if (card.reason) fb.appendChild(el('p', 'sd-reason', card.reason));
        return fb;
    }

    _place(binId) {
        const card = this.current;
        if (this.step !== 'sort' || !card || this.placements.has(card.id)) return;
        if (!this.config.bins.some((b) => b.id === binId)) return;
        this.placements.set(card.id, binId);
        const fb = this._feedback(card, binId);
        this._announce(`${fb.querySelector('.sd-feedback-line')?.textContent || ''} ${card.reason}`.trim());
        this._showStep('sort');
    }

    _advance() {
        if (this.index >= this.cards.length - 1) {
            this.result = this._buildResult();
            this._showStep('summary');
            return;
        }
        this.index += 1;
        this._announce('');
        this._showStep('sort');
    }

    _onKey(e) {
        if (this.step !== 'sort' || this._layers.length || e.ctrlKey || e.metaKey || e.altKey) return;
        const n = Number(e.key);
        if (!Number.isInteger(n) || n < 1 || n > this.config.bins.length) return;
        e.preventDefault?.();
        this._place(this.config.bins[n - 1].id);
    }

    // ── bins board ───────────────────────────────────────────────────────────

    /**
     * One card's verdict for the summary: the learner's pick is the column it sits in, this names
     * whether that pick was right, an accepted cautious choice (neutral, never red), or wrong (with
     * the right bin). An unscored drill marks only whether the pick fits the author's answer.
     * Returns { tone, text }.
     */
    _summaryMark(card, binId) {
        const names = answersOf(card).map((a) => this.binLabel(a)).join(' or ');
        if (this.config.scored) {
            const s = scoreCard(this.config, card, binId);
            if (s.correct) return { tone: 'right', text: this.text('summaryRight') };
            if (s.caution) return { tone: 'caution', text: this.text('summaryAcceptable', { bin: names }) };
            return { tone: 'wrong', text: this.text('summaryWrong', { bin: names }) };
        }
        if (answersOf(card).includes(binId)) return { tone: 'fits', text: this.text('summaryFits') };
        return { tone: 'suggest', text: this.text('summarySuggest', { bin: names }) };
    }

    /** Every bin as a column listing the cards put in it. `detail` adds each card's reason and its verdict. */
    _board(detail) {
        const board = el('div', `sd-board${detail ? ' sd-board-detail' : ''}`);
        board.setAttribute('role', 'group');
        board.setAttribute('aria-label', detail ? this.text('summaryHeading') : this.text('binsBoardLabel'));
        for (const b of this.config.bins) {
            const col = el('section', 'sd-col');
            col.dataset.bin = b.id;
            col.appendChild(el('h4', 'sd-col-title', b.label));
            const ul = el('ul', 'sd-col-list');
            const here = this.cards.filter((c) => this.placements.get(c.id) === b.id);
            if (!here.length && !detail) ul.appendChild(el('li', 'sd-col-empty', this.text('emptyBin')));
            for (const c of here) {
                const li = el('li', 'sd-col-card');
                li.dataset.cardId = c.id;
                li.appendChild(el('span', 'sd-col-text', c.situation));
                if (detail) {
                    const mark = this._summaryMark(c, b.id);
                    li.dataset.mark = mark.tone;
                    if (mark.tone === 'wrong') li.classList.add('sd-miss');
                    li.appendChild(el('span', `sd-col-mark sd-mark-${mark.tone}`, mark.text));
                    if (c.reason) li.appendChild(el('span', 'sd-col-reason', c.reason));
                }
                ul.appendChild(li);
            }
            col.appendChild(ul);
            board.appendChild(col);
        }
        return board;
    }

    // ── 3 Summary ────────────────────────────────────────────────────────────

    _renderSummary() {
        const r = this.result || this._buildResult();
        const p = el('section', 'sd-panel sd-summary');
        const h = el('h3', 'sd-heading', this.text('summaryHeading'));
        h.tabIndex = -1;
        p.appendChild(h);
        // A scored drill says how many went right; an unscored one shows no per-card mark, but when
        // a pick did not fit the author's answer the line must not claim every card matched (F-E15-9).
        const unscoredMiss = !r.scored && Number.isFinite(r.fit) && r.fit < r.total;
        p.appendChild(el('p', 'sd-score', r.scored
            ? this.text('scoreLine', { correct: r.correct, total: r.total, points: r.points, max: r.max })
            : this.text(unscoredMiss ? 'doneMissLine' : 'doneLine', { total: r.total, fit: r.fit })));
        p.appendChild(this._board(true));
        const done = el('button', 'sd-finish sd-button minigame-button', this.text('done'));
        done.type = 'button';
        done.dataset.autofocus = '1';
        this.addEventListener(done, 'click', () => this.finish());
        p.appendChild(done);
        this.stageEl.appendChild(p);
    }

    _buildResult() {
        const result = scoreDrill(this.config, this.cards,
            this.cards.filter((c) => this.placements.has(c.id)).map((c) => ({ id: c.id, bin: this.placements.get(c.id) })));
        // A recap of the cards that went in the wrong bin (scored drills only): each with the bin it
        // went in, the bin(s) the author counts right, and the card's reason, so a caller (the
        // awareness debrief) can replay them. Generic: any game may read it or ignore it.
        if (result.scored && Array.isArray(result.placements)) {
            const recap = [];
            for (const p of result.placements) {
                if (!p || p.correct !== false) continue;
                const card = this.cards.find((c) => c.id === p.id);
                if (!card) continue;
                recap.push({
                    id: card.id,
                    situation: card.situation,
                    chosen: this.binLabel(p.bin),
                    right: answersOf(card).map((a) => this.binLabel(a)).join(' or '),
                    reason: card.reason || ''
                });
            }
            if (recap.length) result.recap = recap;
        }
        return result;
    }

    // ── exit ─────────────────────────────────────────────────────────────────

    finish() {
        if (!this.gameState.isActive) return;
        this.gameResult = this.result || this._buildResult();
        this.complete(true);
    }

    /** Before the Summary, Close and Esc end the run as { aborted: true }: a half-sorted drill is not kept. */
    get closeMode() {
        return this.step === 'summary' || !this.cards.length ? 'close' : 'abort';
    }

    closeResult() {
        return this.result || this._buildResult();
    }

    requestClose() {
        if (this.closeMode === 'abort' && this.placements.size > 0) {
            if (this._closeAsk) { this._dropCloseAsk(); this.abort(); return; }
            this._askClose();
            return;
        }
        super.requestClose();
    }

    _askClose() {
        const box = el('div', 'sd-close-ask');
        box.setAttribute('role', 'alertdialog');
        box.setAttribute('aria-label', this.text('closeAsk'));
        box.appendChild(el('p', 'sd-close-ask-text', this.text('closeAsk')));
        const keep = el('button', 'sd-close-keep minigame-button', this.text('keepGoing'));
        keep.type = 'button';
        const leave = el('button', 'sd-close-leave minigame-button', this.text('closeAnyway'));
        leave.type = 'button';
        this.addEventListener(keep, 'click', () => this._dropCloseAsk(true));
        this.addEventListener(leave, 'click', () => { this._dropCloseAsk(); this.abort(); });
        const row = el('div', 'sd-close-ask-actions');
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
        const narrow = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
            ? window.matchMedia(NARROW_QUERY).matches : false;
        const bins = {};
        for (const b of this.config?.bins || []) {
            bins[b.id] = (this.cards || []).filter((c) => this.placements.get(c.id) === b.id).map((c) => c.id);
        }
        return {
            ...super.getTestState(),
            sortDrill: {
                step: this.step,
                scored: this.config?.scored === true,
                answerKeyProfile: this.config?.answerKeyProfile ?? null,
                bins: (this.config?.bins || []).map((b) => ({ id: b.id, label: b.label })),
                cards: (this.cards || []).map((c) => c.id),
                index: this.index,
                currentId: this.current?.id ?? null,
                placements: [...this.placements.entries()].map(([id, bin]) => ({ id, bin })),
                board: bins,
                feedbackTone: this.stageEl?.querySelector?.('.sd-feedback')?.dataset.tone || null,
                result: this.result ? JSON.parse(JSON.stringify(this.result)) : null,
                live: this._live,
                narrow
            }
        };
    }
}

export default SortDrillMinigame;
