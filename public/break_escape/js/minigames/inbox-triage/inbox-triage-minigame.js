// Inbox triage overlay (SE design 05 N1; packet P3-B. Phase 7: the non-email kinds, N10's
// call and push actions and N11's pre/post comparison).
//
// The defender's seat: sort a fixed set of incoming messages into Trust, Report or
// Delete, name the red flags that made you say so, read feedback, see a score. The
// minigame holds no content. A scenario supplies `social.triageSets`; the object
// that starts a round carries only `minigameData: { triageSetId }`.
//
// Steps: 1 Brief, 2 Sort, 3 Review, 4 Result. The reading pane is the mail client's
// own MailReader (read-only: no Compose, no Send), so a fix to how the mail client
// shows a From line fixes this too. Scoring is the pure scorer in triage-scoring.js.
// Replayed player mail (`playerSent`) is built by triage-messages.js. Messages of kind
// sms, voicemail, qr, page, call and push are drawn by triage-kinds.js in their own style
// (no header panel, chips from the set's channel tells only); call and push swap the verdict
// buttons for their own actions, scored through the existing verdict rows. A post-stage
// round shows the comparison from triage-comparison.js on its result step.
//
// Starter params (P3-C passes them; all optional unless marked):
//   set               object    the triage set; else resolved from triageSetId
//   triageSetId       string    id in social.triageSets
//   stage             string    'pre' | 'post' | 'training' | 'mission' overrides set.stage
//   social            object    the social block (default window.gameScenario.social)
//   mailState         object    live mailState for playerSent (default window.mailState)
//   globals           object    global variables (default window.gameState.globalVariables)
//   storedResult      object    { percent, reportRate, headline? }: a read-only result and nothing else
//                               (the pre/post first-attempt reopen, N6)
//   persistResult     function  (result) => Promise<{ confirmed }>. Called once each time the Result
//                               step is shown for a finished round (systems/triage-starter.js). The first
//                               attempt holds Finish and leaves the note blank ('pending'). The saving
//                               notice appears only when the starter calls setSavingState('saving') on a
//                               retry (05). 'saved' or a settled confirmed:true clears it and unlocks
//                               Finish; 'failed' or confirmed:false shows that it will save the next time
//                               the round is opened. (`onResult` is accepted as an alias.)
//   setSavingState    method    ('pending' | 'saving' | 'saved' | 'failed'): the starter calls it on the open overlay.
//   onComplete        function  (success, result) as for every minigame
// Completion: Finish sets gameResult to the result (see _buildResult) and complete(true).
// Close or Esc anywhere before the Result step sets { aborted: true } and complete(false).
// requiresKeyboardInput and disableClose come from SocialOverlayScene.
//
// Every string the player reads or compares goes in with textContent.

import { SocialOverlayScene } from '../framework/social-overlay.js';
import { MailReader } from '../mail-client/mail-reader.js';
import { scoreTriage, weakestFactor, bandFor } from './triage-scoring.js';
import { buildTriageMessages } from './triage-messages.js';
import { buildHeaderPanel } from './header-panel.js';
import {
    FACTOR_ORDER, NONE_ID, chipIdsFor, chipLabel, redFlagString, skillName
} from './triage-flags.js';
import {
    kindOf, isNonEmail, actionsFor, actionById, kindVerdictLine, renderKindSurface, KIND_LABEL,
    CALL_ACTIONS, PUSH_ACTIONS
} from './triage-kinds.js';
import { comparisonFor, comparisonText } from './triage-comparison.js';

const ICON = '/break_escape/assets/icons/';
const NARROW_QUERY = '(max-width: 767px)';
const STEPS = [['brief', '1 Brief'], ['sort', '2 Sort'], ['review', '3 Review'], ['result', '4 Result']];
const STAGE_LABEL = { pre: 'Pre-assessment', post: 'Follow-up assessment', training: 'Training round', mission: 'Inbox check' };
const REPORT_THANKS = 'Thanks for reporting. That warns everyone else.';
const VERDICT_LABEL = { trust: 'Trust', report: 'Report', delete: 'Delete', verify: 'Verify' };
const VERDICT_PAST = { trust: 'Trusted', report: 'Reported', delete: 'Deleted', verify: 'Verified' };
const VERDICT_HINT = {
    trust: "This is real. I'd open it or act on it.",
    report: 'This is a phish. Send it to security.',
    delete: 'This is junk. Bin it.',
    verify: 'I would check this by ringing a number I already hold.'
};
const VERDICT_ICON = { trust: 'mark-tick', report: 'mark-exclamation', delete: 'mark-cross', verify: 'mark-question' };

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function icon(name) {
    const img = el('img', 'mail-icon tri-icon');
    img.src = `${ICON}${name}.png`;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    return img;
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export class InboxTriageMinigame extends SocialOverlayScene {
    constructor(container, params) {
        super(container, params);
        this.set = null;
        this.messages = [];
        this.skipped = [];
        this.stage = 'mission';
        this.step = 'brief';
        this.answers = new Map();
        this.openedAt = new Map();
        this.sheet = null;
        this.view = { glossaryOpen: false, explain: null };
        this.result = null;
        this.comparison = null;
        this.stored = null;
        this.saving = false;
        this.saveFailed = false;
        this._popSheet = null;
        this._live = '';
    }

    // ── data ─────────────────────────────────────────────────────────────────

    get social() {
        return this.params.social || (typeof window !== 'undefined' ? window.gameScenario?.social : null) || {};
    }

    get globals() {
        return this.params.globals || (typeof window !== 'undefined' ? window.gameState?.globalVariables : null) || {};
    }

    get mailState() {
        return this.params.mailState || (typeof window !== 'undefined' ? window.mailState : null) || {};
    }

    get profile() {
        return this.set?.scoringProfile === 'analyst' ? 'analyst' : 'awareness';
    }

    get feedbackMode() {
        return this.set?.feedbackMode === 'end' ? 'end' : 'immediate';
    }

    get verifyEnabled() {
        return this.set?.verifyVerdict === true && this.profile === 'awareness';
    }

    get passPercent() {
        const p = this.set?.outcome?.passPercent;
        return Number.isFinite(p) ? p : 0;
    }

    _findSet(id) {
        const sets = Array.isArray(this.social.triageSets) ? this.social.triageSets : [];
        return sets.find((s) => isObj(s) && s.id === id) || null;
    }

    _loadSet(set) {
        this.set = set;
        this.stage = this.params.stage || set?.stage || 'mission';
        const built = buildTriageMessages(set, { mailState: this.mailState, social: this.social, globals: this.globals });
        this.messages = built.messages;
        this.skipped = built.skipped;
        this.answers = new Map();
        this.openedAt = new Map();
        this.result = null;
        this.view = { glossaryOpen: set?.glossary === 'open', explain: null };
    }

    /** The episode runner's awareness skin is on (params.skin, set by the triage starter). */
    get awarenessSkin() {
        return this.params?.skin === 'awareness';
    }

    // ── lifecycle ────────────────────────────────────────────────────────────

    init() {
        super.init();
        this.set = isObj(this.params.set) ? this.params.set : this._findSet(this.params.triageSetId);
        if (!this.set) this.set = { id: this.params.triageSetId || 'missing', messages: [] };
        this._loadSet(this.set);
        if (isObj(this.params.storedResult)) this.stored = this.params.storedResult;

        const root = el('div', 'mail-client triage-client');
        root.setAttribute('role', 'region');
        root.setAttribute('aria-label', 'Inbox check');
        // The awareness skin (11 N8, P7-P): the episode runner passes skin 'awareness', which
        // gives the Report action its positive animation and a thank-you line.
        if (this.awarenessSkin) root.classList.add('aw-skin');
        this.root = root;
        this.gameContainer.appendChild(root);

        this._buildToolbar(root);
        this.liveEl = el('p', 'mail-notice tri-live');
        this.liveEl.setAttribute('aria-live', 'polite');
        root.appendChild(this.liveEl);

        this.stageEl = el('div', 'tri-stage');
        root.appendChild(this.stageEl);

        this.briefEl = el('section', 'tri-panel tri-brief');
        this.sortEl = el('div', 'tri-sort');
        this.progressEl = el('p', 'tri-progress');
        this.sortEl.appendChild(this.progressEl);
        this.reader = new MailReader(this.sortEl, {
            pushLayer: (close, name) => this.pushLayer(close, name),
            influence: false,
            linkPrefix: 'This would have gone to: ',
            detailsLabels: { show: 'Show details', hide: 'Hide details' },
            detailsAlwaysOpen: this.set.headerPanel === 'open',
            noDetails: this.set.headerPanel === 'off',
            detailsRenderer: (rec) => this._headerPanel(rec),
            afterBody: (rec, pane) => this._afterBody(rec, pane),
            // Non-email kinds (05 N1, N10) draw their own surface; email keeps the reader's layout.
            paneRenderer: (rec, h) => (isNonEmail(rec) ? renderKindSurface(rec, h) : null),
            rowTag: (rec) => (isNonEmail(rec) ? KIND_LABEL[kindOf(rec)] : null),
            rowBadge: (rec) => {
                const a = this.answers.get(rec.id);
                if (!a) return null;
                return isNonEmail(rec) ? actionById(kindOf(rec), a.action, a.verdict).past : VERDICT_PAST[a.verdict];
            },
            emptyText: 'There is nothing to sort in this round.',
            onOpen: (rec) => this._onOpen(rec)
        });
        // headerPanel 'off' removes the toggle too: the panel renderer returns an empty note.
        this.reviewEl = el('section', 'tri-panel tri-review');
        this.resultEl = el('section', 'tri-panel tri-result');
        this.stageEl.append(this.briefEl, this.sortEl, this.reviewEl, this.resultEl);

        this.reader.setMessages(this.messages, 'inbox');
        if (this.stored) {
            this._showStep('result');
        } else {
            this._showStep('brief');
        }
    }

    start() {
        super.start();
        this._focusStep();
    }

    cleanup() {
        this._closeSheet(false);
        this.reader?.destroy?.();
        this.reader = null;
        super.cleanup();
    }

    // ── chrome ───────────────────────────────────────────────────────────────

    _buildToolbar(root) {
        const bar = el('div', 'mail-toolbar tri-toolbar');
        this.titleEl = el('h2', 'tri-title', this.set.title || 'Inbox check');
        this.stepsEl = el('ol', 'tri-steps');
        this.stepsEl.setAttribute('aria-label', 'Steps');
        bar.append(this.titleEl, this.stepsEl);
        this.mountCloseControl(bar, 'Close');
        root.appendChild(bar);
        this.toolbar = bar;
    }

    _renderSteps() {
        this.stepsEl.textContent = '';
        const order = STEPS.map((s) => s[0]);
        const here = order.indexOf(this.step);
        STEPS.forEach(([id, label], i) => {
            const li = el('li', 'tri-step', label);
            li.dataset.step = id;
            if (i < here) li.classList.add('done');
            if (i === here) { li.classList.add('current'); li.setAttribute('aria-current', 'step'); }
            this.stepsEl.appendChild(li);
        });
    }

    _announce(text) {
        this._live = text;
        if (this.liveEl) this.liveEl.textContent = text;
    }

    _showStep(step) {
        this.step = step;
        this.briefEl.hidden = step !== 'brief';
        this.sortEl.hidden = step !== 'sort';
        this.reviewEl.hidden = step !== 'review';
        this.resultEl.hidden = step !== 'result';
        this.root.dataset.step = step;
        this._renderSteps();
        if (step === 'brief') this._renderBrief();
        if (step === 'sort') this._renderSort();
        if (step === 'review') this._renderReviewList();
        if (step === 'result') this._renderResult();
        this._focusStep();
    }

    _focusStep() {
        const target = {
            brief: () => this.briefEl.querySelector('.tri-start'),
            sort: () => this.sortEl.querySelector('.mail-row.selected') || this.sortEl.querySelector('.mail-row'),
            review: () => this.reviewEl.querySelector('.tri-review-title'),
            result: () => this.resultEl.querySelector('.tri-result-title')
        }[this.step]?.();
        if (target) { if (!target.matches?.('button, [tabindex]')) target.tabIndex = -1; target.focus?.(); }
    }

    // ── 1 Brief ──────────────────────────────────────────────────────────────

    _renderBrief() {
        const p = this.briefEl;
        p.textContent = '';
        const n = this.messages.length;
        const label = STAGE_LABEL[this.stage] || 'Inbox check';
        p.appendChild(el('h3', 'tri-brief-title', `${label}: ${plural(n, 'message', 'messages')}`));
        if (typeof this.set.brief === 'string' && this.set.brief) p.appendChild(el('p', 'tri-brief-text', this.set.brief));

        const dl = el('dl', 'tri-brief-buttons');
        const verdicts = ['trust', 'report', 'delete', ...(this.verifyEnabled ? ['verify'] : [])];
        for (const v of verdicts) dl.append(el('dt', null, VERDICT_LABEL[v]), el('dd', null, VERDICT_HINT[v]));
        p.appendChild(dl);
        // Calls and sign-in prompts have their own buttons (05 N10); say so before the round.
        const kinds = new Set(this.messages.map((m) => kindOf(m)));
        for (const [kind, lead, actions] of [['call', 'On a call', CALL_ACTIONS], ['push', 'On a sign-in prompt', PUSH_ACTIONS]]) {
            if (!kinds.has(kind)) continue;
            const shown = actions.filter((a) => kind !== 'call' || this.verifyEnabled || a.verdict !== 'verify');
            p.appendChild(el('p', `tri-brief-kind tri-brief-${kind}`,
                `${lead}: ${shown.map((a) => `${a.label} (${a.hint.replace(/\.$/, '').toLowerCase()})`).join('; ')}.`));
        }

        p.appendChild(el('p', 'tri-brief-score', 'Right call is most of the score; naming the flags is the rest.'));
        let when;
        if (this.stage === 'pre') when = "This one is just to see where you are. You'll see what you got right and wrong at the end.";
        else if (this.feedbackMode === 'end') when = "You'll see what you got right and wrong at the end.";
        else when = "You'll get feedback after each message.";
        p.appendChild(el('p', 'tri-brief-when', when));
        // F12: closing or reloading mid-round restarts it from the top (only the result is
        // ever saved), so say so here rather than leave a student puzzled by a reset.
        p.appendChild(el('p', 'tri-brief-restart', 'Closing or reloading before the end restarts this round from the first message.'));
        if (this.skipped.length) {
            p.appendChild(el('p', 'tri-brief-note', 'One or more of your own messages could not be replayed, so this round is shorter.'));
        }

        const start = el('button', 'tri-start minigame-button', 'Start');
        start.type = 'button';
        if (!n) { start.disabled = true; }
        this.addEventListener(start, 'click', () => this._start());
        p.appendChild(start);
    }

    _start() {
        this._showStep('sort');
    }

    // ── 2 Sort ───────────────────────────────────────────────────────────────

    _renderSort() {
        const done = this.answers.size;
        this.progressEl.textContent = `${done} of ${this.messages.length} sorted`;
        this.reader.render();
    }

    _onOpen(rec) {
        rec.read = true;
        this.openedAt.set(rec.id, Date.now());
    }

    _headerPanel(rec) {
        const mode = this.set.headerPanel;
        if (mode === 'off') return el('p', 'tri-header-off', 'Header details are not part of this round.');
        return buildHeaderPanel(rec, this.view, {
            glossary: this.set.glossary || 'closed',
            onToggleGlossary: () => { this.view.glossaryOpen = !this.view.glossaryOpen; this._rerender('[data-glossary="toggle"]'); },
            onToggleExplain: (mech) => {
                this.view.explain = this.view.explain === mech ? null : mech;
                this._rerender(`[data-explain="${mech}"]`);
            }
        });
    }

    /** Rebuild the reading pane and return focus to the control the player just used. */
    _rerender(focusSelector) {
        this.reader.render();
        if (focusSelector) this.reader.readPane.querySelector?.(focusSelector)?.focus?.();
    }

    _afterBody(rec, pane) {
        if (this.step !== 'sort') return;
        const ans = this.answers.get(rec.id);
        const box = el('div', 'tri-actions');
        if (!ans) {
            const group = el('div', 'tri-verdicts');
            group.setAttribute('role', 'group');
            group.setAttribute('aria-label', 'Your verdict');
            // Email and most kinds: Trust, Report, Delete (and Verify). A call or a push has its
            // own actions, each scored through one of those verdict rows (05 N10).
            for (const a of actionsFor(kindOf(rec), this.verifyEnabled)) {
                const v = a.verdict;
                const reportSkin = this.awarenessSkin && v === 'report' ? ' aw-report-btn' : '';
                const btn = el('button', `tri-verdict minigame-button verdict-${v}${reportSkin}`);
                btn.type = 'button';
                btn.dataset.verdict = v;
                btn.dataset.action = a.id;
                btn.append(icon(VERDICT_ICON[v]), el('span', 'tri-verdict-word', a.label),
                    el('span', 'tri-verdict-hint', a.hint));
                btn.addEventListener('click', () => this._openSheet(rec, v, a.id));
                group.appendChild(btn);
            }
            box.appendChild(group);
        } else {
            const lock = el('p', 'tri-locked');
            lock.append(icon('mark-tick'), el('span', null, `Your verdict: ${this._actionLabel(rec, ans)}. It is locked.`));
            box.appendChild(lock);
            if (this.awarenessSkin && ans.verdict === 'report') {
                // The positive beat for a report: it plays once, on the render right after
                // the report was locked; later renders show the line without the animation.
                const win = this._reportWin === rec.id;
                const thanks = el('p', `aw-report-thanks${win ? ' aw-report-win' : ''}`, REPORT_THANKS);
                if (win) {
                    lock.classList.add('aw-report-win');
                    this._reportWin = null;
                }
                box.appendChild(thanks);
            }
            if (this.feedbackMode === 'immediate') {
                box.appendChild(this._card(rec));
                const next = el('button', 'tri-next minigame-button');
                next.type = 'button';
                const nextRec = this._nextUnanswered(rec.id);
                next.textContent = nextRec ? 'Next message' : 'See result';
                next.addEventListener('click', () => {
                    if (nextRec) this.reader.select(nextRec.id);
                    else this._finishSort();
                });
                box.appendChild(next);
            }
        }
        pane.appendChild(box);
    }

    _nextUnanswered(afterId) {
        const i = this.messages.findIndex((m) => m.id === afterId);
        const order = [...this.messages.slice(i + 1), ...this.messages.slice(0, Math.max(i, 0))];
        return order.find((m) => !this.answers.has(m.id)) || null;
    }

    // ── the "What made you say that?" sheet ────────────────────────────────────

    _chipIds(rec) {
        return chipIdsFor(this.set, kindOf(rec));
    }

    /** The word for what the player did: the call or push action's label, else the verdict's. */
    _actionLabel(rec, ans) {
        if (!ans) return '';
        return isNonEmail(rec) ? actionById(kindOf(rec), ans.action, ans.verdict).label : VERDICT_LABEL[ans.verdict];
    }

    _openSheet(rec, verdict, action = verdict) {
        if (this.sheet || this.answers.has(rec.id)) return;
        const ids = this._chipIds(rec);
        const backdrop = el('div', 'tri-sheet-backdrop');
        const sheet = el('div', 'tri-sheet');
        sheet.setAttribute('role', 'dialog');
        sheet.setAttribute('aria-modal', 'true');
        sheet.setAttribute('aria-labelledby', 'tri-sheet-title');
        sheet.appendChild(Object.assign(el('h3', 'tri-sheet-title', 'What made you say that?'), { id: 'tri-sheet-title' }));
        sheet.appendChild(el('p', 'tri-sheet-chosen', `You chose: ${this._actionLabel(rec, { verdict, action })}. Tick anything you noticed.`));

        const fs = el('fieldset', 'tri-chips');
        fs.appendChild(el('legend', 'mail-sr-only', 'What made you say that?'));
        const inputs = new Map();
        const addChip = (id) => {
            const label = el('label', `tri-chip${id === NONE_ID ? ' tri-chip-none' : ''}`);
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.value = id;
            input.dataset.chip = id;
            label.append(input, el('span', 'tri-chip-label', chipLabel(this.set, id)));
            fs.appendChild(label);
            inputs.set(id, input);
        };
        ids.forEach(addChip);
        addChip(NONE_ID);
        for (const [id, input] of inputs) {
            this.addEventListener(input, 'change', () => {
                if (!input.checked) return;
                for (const [other, o] of inputs) {
                    if (other !== id && ((id === NONE_ID) || other === NONE_ID)) o.checked = false;
                }
            });
        }
        sheet.appendChild(fs);

        const bar = el('div', 'tri-sheet-bar');
        const confirm = el('button', 'tri-confirm minigame-button', 'Confirm');
        confirm.type = 'button';
        const cancel = el('button', 'tri-cancel minigame-button', 'Back');
        cancel.type = 'button';
        this.addEventListener(confirm, 'click', () => this._confirmSheet());
        this.addEventListener(cancel, 'click', () => this._closeSheet(true));
        bar.append(confirm, cancel);
        sheet.appendChild(bar);
        backdrop.appendChild(sheet);

        this.root.appendChild(backdrop);
        this.stageEl.inert = true;
        this.sheet = { messageId: rec.id, verdict, action, el: backdrop, inputs, returnFocus: document.activeElement };
        this._popSheet = this.pushLayer(() => this._closeSheet(true), 'chip-sheet');
        inputs.values().next().value?.focus?.();
    }

    _closeSheet(restoreFocus) {
        const s = this.sheet;
        if (!s) return;
        if (this._popSheet) { this._popSheet(); this._popSheet = null; }
        s.el.remove?.();
        this.sheet = null;
        if (this.stageEl) this.stageEl.inert = false;
        if (restoreFocus) s.returnFocus?.focus?.();
    }

    _confirmSheet() {
        const s = this.sheet;
        if (!s) return;
        const flags = [...s.inputs.entries()].filter(([id, i]) => i.checked && id !== NONE_ID).map(([id]) => id);
        const opened = this.openedAt.get(s.messageId);
        const ms = Number.isFinite(opened) ? Math.max(0, Date.now() - opened) : 0;
        const answer = { id: s.messageId, verdict: s.verdict, flags, ms };
        if (s.action && s.action !== s.verdict) answer.action = s.action;
        this.answers.set(s.messageId, answer);
        if (this.awarenessSkin && answer.verdict === 'report') this._reportWin = s.messageId;
        this._closeSheet(false);
        const rec = this.messages.find((m) => m.id === s.messageId);
        this._announce(`Verdict locked: ${this._actionLabel(rec, answer)}.`);
        this.progressEl.textContent = `${this.answers.size} of ${this.messages.length} sorted`;

        if (this.answers.size >= this.messages.length) {
            if (this.feedbackMode === 'end') { this._showStep('review'); return; }
            // immediate: the last message's review card stays, with "See result".
        }
        this.reader.render();
        const focus = this.reader.readPane.querySelector?.('.tri-card-title') || this.reader.readPane.querySelector?.('.tri-next');
        if (focus) { focus.tabIndex = focus.tabIndex < 0 ? -1 : focus.tabIndex; focus.focus?.(); }
        else this.reader.readPane.querySelector?.('.tri-next')?.focus?.();
    }

    // ── review cards ───────────────────────────────────────────────────────────

    _scoreOne(rec) {
        const ans = this.answers.get(rec.id);
        if (!ans) return null;
        return scoreTriage({ messages: [rec], answers: [ans], profile: this.profile }).perMessage[0];
    }

    _verdictLine(rec, verdict) {
        const phish = rec.truth.isPhish === true;
        const aware = this.profile === 'awareness';
        const own = kindVerdictLine(kindOf(rec), phish, verdict);
        if (own) return own;
        if (phish) {
            return {
                report: 'Right call: reported. A report warns everyone else.',
                delete: 'Safe, but not reported. Deleting protects you; reporting warns everyone else.',
                trust: 'Not this time. This one was a phish.',
                verify: 'Checking first is a sound habit. This one was a phish.'
            }[verdict];
        }
        return {
            trust: 'Right call. This one was real.',
            report: aware
                ? "Reported, and that's never wrong. For next time, here is why this one was fine."
                : "That one was real, but reporting is never wrong when you're unsure. Here's what to check next time.",
            delete: aware
                ? 'That one was real. Deleting it is cautious, but reporting an unsure message is safer for everyone.'
                : 'That one was real. Deleting real work loses it; if you are unsure, report it.',
            verify: 'Checking first is fine. This one was real.'
        }[verdict];
    }

    _isRight(rec, verdict) {
        const phish = rec.truth.isPhish === true;
        return phish ? verdict === 'report' || verdict === 'verify' : verdict === 'trust' || verdict === 'verify';
    }

    /**
     * How the review card paints a verdict. Report on real mail is not a failure:
     * the line says reporting is never wrong, and under awareness that call is
     * full marks (05). A danger-coloured cross would contradict the sentence.
     */
    _verdictTone(rec, verdict) {
        if (rec.truth.isPhish !== true && verdict === 'report') return 'acceptable';
        return this._isRight(rec, verdict) ? 'right' : 'wrong';
    }

    /** A card's title: the subject, led by the sender for a non-email kind (two calls both read "Incoming call"). */
    _cardTitle(rec) {
        const subject = rec.subject || '(no subject)';
        const who = rec.from?.name || rec.from?.address || '';
        return isNonEmail(rec) && who && who !== subject ? `${who} · ${subject}` : subject;
    }

    /** One review card (05 step 3): verdict line, caught and missed flags, false flags, what would have happened. */
    _card(rec) {
        const ans = this.answers.get(rec.id);
        const per = this._scoreOne(rec);
        const truth = rec.truth;
        const card = el('article', 'tri-review-card');
        card.dataset.messageId = rec.id;
        card.dataset.kind = kindOf(rec);
        const title = el('h3', 'tri-card-title', this._cardTitle(rec));
        title.tabIndex = -1;
        card.appendChild(title);

        const tone = this._verdictTone(rec, ans.verdict);
        const verdict = el('p', `tri-card-verdict ${tone}`);
        verdict.append(icon(tone === 'wrong' ? 'mark-cross' : 'mark-tick'),
            el('span', null, `You chose ${this._actionLabel(rec, ans)}. ${this._verdictLine(rec, ans.verdict)}`));
        card.appendChild(verdict);

        const notes = isObj(truth.perFlagNote) ? truth.perFlagNote : {};
        if (truth.isPhish) {
            const ul = el('ul', 'tri-flags');
            for (const id of per.caught) ul.appendChild(this._flagRow(rec, id, true, notes[id]));
            for (const id of per.missed) ul.appendChild(this._flagRow(rec, id, false, notes[id]));
            card.appendChild(ul);
        }
        if (per.falseClaims.length) {
            const why = isObj(truth.whyFine) ? truth.whyFine : {};
            const ul = el('ul', 'tri-false-flags');
            for (const id of per.falseClaims) {
                const li = el('li', 'tri-false-flag');
                li.dataset.flag = id;
                li.append(icon('mark-question'), el('span', 'tri-flag-word', 'Not a flag here:'),
                    el('span', 'tri-flag-text', `${chipLabel(this.set, id)}. ${why[id] || why.default || "It wasn't one of this message's tells."}`));
                ul.appendChild(li);
            }
            card.appendChild(ul);
        }
        if (truth.isPhish && (ans.verdict === 'trust' || ans.verdict === 'delete') && truth.ifTrusted) {
            card.appendChild(el('p', 'tri-if-trusted', `What would have happened: ${truth.ifTrusted}`));
        }
        if (!truth.isPhish) {
            const why = isObj(truth.whyFine) ? truth.whyFine : {};
            const lines = Object.entries(why).filter(([k, v]) => k !== 'default' && typeof v === 'string' && v)
                .map(([, v]) => v);
            if (typeof why.default === 'string' && why.default) lines.push(why.default);
            if (lines.length) {
                const ul = el('ul', 'tri-why-fine');
                ul.setAttribute('aria-label', 'Why this one was fine');
                for (const l of lines) ul.appendChild(el('li', null, l));
                card.appendChild(ul);
            }
        }
        if (typeof truth.headerNote === 'string' && truth.headerNote) {
            card.appendChild(el('p', 'tri-header-note', `Header note: ${truth.headerNote}`));
        }
        if (ans.verdict === 'report') {
            const reply = truth.isPhish
                ? (truth.reportReply || "Thanks. Confirmed as a phish, we've pulled it from the other inboxes.")
                : null;
            if (reply) card.appendChild(el('p', 'tri-it-reply', `IT Security: ${reply}`));
        }
        card.appendChild(el('p', 'tri-card-score', `Score for this message: ${per.score} of 100`));
        return card;
    }

    _flagRow(rec, id, caught, note) {
        const li = el('li', `tri-flag ${caught ? 'caught' : 'missed'}`);
        li.dataset.flag = id;
        li.append(icon(caught ? 'mark-tick' : 'mark-cross'),
            el('span', 'tri-flag-word', caught ? 'Caught:' : 'Missed:'),
            el('span', 'tri-flag-text', note ? `${redFlagString(id, rec)} (${note})` : redFlagString(id, rec)));
        return li;
    }

    // ── 3 Review (end mode) ────────────────────────────────────────────────────

    _renderReviewList() {
        const p = this.reviewEl;
        p.textContent = '';
        const title = el('h3', 'tri-review-title', 'Review: how each message went');
        title.tabIndex = -1;
        p.appendChild(title);

        const scored = this.messages.filter((m) => this.answers.has(m.id))
            .map((m, i) => ({ m, i, s: this._scoreOne(m).score }))
            .sort((a, b) => (a.s - b.s) || (a.i - b.i));

        const jump = el('div', 'tri-jump');
        const lab = el('label', null, 'Jump to a message');
        lab.htmlFor = 'tri-jump-select';
        const sel = el('select', 'tri-jump-select');
        sel.id = 'tri-jump-select';
        for (const { m } of scored) {
            const o = el('option', null, this._cardTitle(m) || m.id);
            o.value = m.id;
            sel.appendChild(o);
        }
        this.addEventListener(sel, 'change', () => {
            const card = p.querySelector(`[data-message-id="${sel.value}"]`);
            card?.scrollIntoView?.({ block: 'start' });
            card?.querySelector('.tri-card-title')?.focus?.();
        });
        jump.append(lab, sel);
        p.appendChild(jump);

        const list = el('div', 'tri-cards');
        for (const { m } of scored) list.appendChild(this._card(m));
        p.appendChild(list);

        const next = el('button', 'tri-next minigame-button', 'See result');
        next.type = 'button';
        this.addEventListener(next, 'click', () => this._finishSort());
        p.appendChild(next);
    }

    _finishSort() {
        this._showStep('result');
    }

    // ── 4 Result ─────────────────────────────────────────────────────────────

    _answerList() {
        return [...this.answers.values()];
    }

    _score() {
        return scoreTriage({
            messages: this.messages, answers: this._answerList(), profile: this.profile,
            bands: this.set.bands, passPercent: this.passPercent
        });
    }

    /** The completion result (05 "Completion"), plus the scorer's detail. */
    _buildResult() {
        const s = this._score();
        return {
            setId: this.set.id,
            stage: this.stage,
            scoringProfile: this.profile,
            percent: s.percent,
            headline: s.headline,
            pass: s.pass === true,
            passPercent: this.passPercent,
            phishCaught: s.phishCaught,
            phishTotal: s.phishTotal,
            reportCount: s.reportCount,
            reportRate: s.reportRate,
            verifyCount: s.verifyCount,
            falseAlarms: s.falseAlarms,
            flagRecall: s.flagRecall,
            perFactor: s.perFactor,
            falseByFactor: s.falseByFactor,
            total: this.messages.length,
            skipped: this.skipped.map((x) => x.id),
            // Per-answer ms stays in memory (05): the starter writes only the four globals.
            answers: s.perMessage.map((pm) => {
                const a = this.answers.get(pm.id) || {};
                const out = { id: pm.id, verdict: pm.verdict, flags: a.flags || [], score: pm.score, ms: a.ms ?? 0 };
                if (a.action) out.action = a.action;
                return out;
            })
        };
    }

    _renderResult() {
        const p = this.resultEl;
        p.textContent = '';
        const stored = this.stored;
        const result = stored ? null : this._buildResult();
        if (!stored) this.result = result;
        const percent = stored ? stored.percent : result.percent;
        const headline = stored ? (stored.headline || bandFor(percent, this.set.bands).headline) : result.headline;
        const reportRate = stored ? stored.reportRate : result.reportRate;

        const title = el('h3', 'tri-result-title', headline);
        title.tabIndex = -1;
        p.appendChild(title);
        const score = el('p', 'tri-score', `${percent}%`);
        score.setAttribute('aria-label', `Score ${percent} percent`);
        p.appendChild(score);

        const nums = el('dl', 'tri-numbers');
        const addNum = (k, v, key) => { const dd = el('dd', null, v); dd.dataset.number = key; nums.append(el('dt', null, k), dd); };
        if (stored) {
            addNum('Reported rather than just deleted', `${Math.round(reportRate * 100)}% of the phish`, 'reportRate');
        } else {
            const real = this.messages.filter((m) => m.truth.isPhish !== true);
            const trusted = real.filter((m) => this.answers.get(m.id)?.verdict === 'trust').length;
            addNum('Phish caught', `${result.phishCaught} of ${result.phishTotal}`, 'phishCaught');
            addNum('Reported rather than just deleted', `${result.reportCount} of ${result.phishTotal}`, 'reported');
            addNum('Real mail trusted', `${trusted} of ${real.length}`, 'realTrusted');
            if (this.profile === 'analyst') addNum('False alarms', String(result.falseAlarms), 'falseAlarms');
            if (this.verifyEnabled && result.verifyCount) addNum('Checked by another route', String(result.verifyCount), 'verify');
        }
        p.appendChild(nums);

        if (!stored) {
            const entries = Object.entries(result.perFactor);
            if (entries.length) {
                // The per-factor "caught 0 of N" breakdown and the "Weakest skill" pointer
                // only make sense once the student has ticked at least one flag. When they
                // named none, the skill-by-skill lines read as if they tried and failed every
                // skill (lab R5 J10 / R6 triage card), so hide the whole breakdown and print
                // only the "nothing to grade" line. Any flag ticked shows up as a catch
                // (flagRecall) or a false claim (falseByFactor).
                const namedAnyFlags = (result.flagRecall?.caught || 0) > 0
                    || Object.keys(result.falseByFactor || {}).length > 0;
                if (namedAnyFlags) {
                    const order = [...FACTOR_ORDER, ...Object.keys(result.perFactor).filter((k) => !FACTOR_ORDER.includes(k))];
                    const ul = el('ul', 'tri-skills');
                    ul.setAttribute('aria-label', 'Skill breakdown');
                    for (const id of order) {
                        const c = result.perFactor[id];
                        if (!c) continue;
                        const li = el('li', 'tri-skill', `${skillName(id)}: caught ${c.caught} of ${c.caught + c.missed}`);
                        li.dataset.factor = id;
                        ul.appendChild(li);
                    }
                    p.appendChild(ul);
                    const weak = weakestFactor(result.perFactor);
                    if (weak) {
                        const nudges = isObj(this.set.nudges) ? this.set.nudges : {};
                        p.appendChild(el('p', 'tri-weakest',
                            `Weakest skill: ${skillName(weak.id)} (caught ${weak.caught} of ${weak.caught + weak.missed}). ` +
                            (nudges[weak.id] || 'Practise it in the mail client, then look it up in your lab sheet.')));
                    }
                } else {
                    p.appendChild(el('p', 'tri-weakest',
                        'You didn\'t name any flags on these messages, so there\'s nothing to grade skill by skill. Tick what looks off next time, then check your lab sheet.'));
                }
            }
        }
        // 05 N11: after a post round, compare with the pre round's imported globals, or say
        // there is no baseline. Shown on a fresh round and on the read-only reopen alike.
        this.comparison = comparisonFor(this.set, this.stage, this.globals, { percent, reportRate });
        const cmpText = comparisonText(this.comparison);
        if (cmpText) {
            const box = el('section', `tri-compare ${this.comparison.baseline ? 'has-baseline' : 'no-baseline'}`);
            box.dataset.baseline = this.comparison.baseline ? 'true' : 'false';
            box.setAttribute('aria-label', cmpText.heading);
            box.appendChild(el('h4', 'tri-compare-title', cmpText.heading));
            for (const line of cmpText.lines) box.appendChild(el('p', 'tri-compare-line', line));
            p.appendChild(box);
        }
        if (this.stage === 'pre') p.appendChild(el('p', 'tri-come-back', 'Come back for the follow-up after your training.'));

        this.saveNote = el('p', 'tri-save-note');
        this.saveNote.setAttribute('role', 'status');
        p.appendChild(this.saveNote);

        const bar = el('div', 'tri-result-bar');
        this.finishBtn = el('button', 'tri-finish minigame-button', 'Finish');
        this.finishBtn.type = 'button';
        this.addEventListener(this.finishBtn, 'click', () => this.finish());
        bar.appendChild(this.finishBtn);
        if (!stored) {
            if (['training', 'mission'].includes(this.stage) && result.pass === false) {
                const again = el('button', 'tri-again minigame-button', 'Try again');
                again.type = 'button';
                this.addEventListener(again, 'click', () => this._restart(this.set));
                bar.appendChild(again);
            }
            if (this.stage === 'training' && this.set.pairedWith && this._findSet(this.set.pairedWith)) {
                const other = el('button', 'tri-other minigame-button', 'Try the other set');
                other.type = 'button';
                this.addEventListener(other, 'click', () => this._restart(this._findSet(this.set.pairedWith)));
                bar.appendChild(other);
            }
        }
        p.appendChild(bar);

        this._announce(`Score ${percent} percent. ${headline}`);
        if (!stored) this._notifyResult(result);
    }

    _notifyResult(result) {
        const fn = this.params.persistResult || this.params.onResult;
        if (typeof fn !== 'function') return;
        let out;
        try { out = fn(result); } catch (err) { console.error('triage persistResult failed:', err); return; }
        if (out && typeof out.then === 'function') {
            // Hold Finish quietly on the first attempt. The saving notice is for a
            // retry (05: shown while syncConfirmed is retrying), which the starter
            // reports with setSavingState('saving').
            this.setSavingState('pending');
            const settle = (state) => { if (this.result === result) this.setSavingState(state); };
            out.then((res) => settle(res === false || res?.confirmed === false ? 'failed' : 'saved'), () => settle('failed'));
        }
    }

    /** The starter reports the save: 'saving' holds Finish, 'saved' clears the note, 'failed' says it will save on the next open. */
    setSavingState(state) {
        // 'pending' holds Finish with no notice (the first attempt is in flight).
        // 'saving' is the retry notice. Both keep Finish disabled until the save confirms.
        this.saving = state === 'saving' || state === 'pending';
        this.saveFailed = state === 'failed';
        if (this.saveNote) {
            this.saveNote.textContent = state === 'saving' ? (this.params.savingNotice || 'Saving your result...')
                : state === 'failed' ? "We couldn't save your result yet. It will save the next time you open this round."
                : '';
        }
        if (this.finishBtn) this.finishBtn.disabled = this.saving;
    }

    _restart(set) {
        this._closeSheet(false);
        this._loadSet(set);
        this.stored = null;
        this.saving = false;
        this.saveFailed = false;
        this.titleEl.textContent = set.title || 'Inbox check';
        this.reader.opts.detailsAlwaysOpen = set.headerPanel === 'open';
        this.reader.opts.noDetails = set.headerPanel === 'off';
        this.reader.selectedId = null;
        this.reader.setMessages(this.messages, 'inbox');
        this._announce('');
        this._showStep('brief');
    }

    /** Finish: a normal exit with the round's result. */
    finish() {
        if (!this.gameState.isActive || this.saving) return;
        this.gameResult = this.stored
            ? { setId: this.set.id, stage: this.stage, reopened: true, percent: this.stored.percent, reportRate: this.stored.reportRate }
            : (this.result || this._buildResult());
        this.complete(true);
    }

    // ── exit ─────────────────────────────────────────────────────────────────

    /** Before the Result step, Close and Esc end the run as { aborted: true }: a half-finished round is never scored. */
    get closeMode() {
        return this.step === 'result' ? 'close' : 'abort';
    }

    closeResult() {
        if (this.stored) return { setId: this.set.id, stage: this.stage, reopened: true, percent: this.stored.percent, reportRate: this.stored.reportRate };
        return this.result || this._buildResult();
    }

    close() {
        if (this.saving) return; // the save notice is up; Finish unlocks when it settles
        super.close();
    }

    // ── test bridge ──────────────────────────────────────────────────────────

    getTestState() {
        const narrow = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
            ? window.matchMedia(NARROW_QUERY).matches : false;
        const reader = this.reader?.getState?.() || null;
        const answered = (id) => this.answers.get(id)?.verdict || null;
        return {
            ...super.getTestState(),
            triage: {
                step: this.step,
                setId: this.set?.id ?? null,
                stage: this.stage,
                scoringProfile: this.profile,
                feedbackMode: this.feedbackMode,
                headerPanel: this.set?.headerPanel || 'collapsed',
                glossary: this.set?.glossary || 'closed',
                verifyEnabled: this.verifyEnabled,
                total: this.messages.length,
                answered: this.answers.size,
                skipped: this.skipped.map((x) => ({ ...x })),
                selectedId: reader?.selectedId ?? null,
                detailsOpen: reader?.detailsOpen ?? false,
                linkNote: reader?.linkNote ?? '',
                headerState: { ...this.view },
                surface: this.reader?.readPane?.querySelector?.('[data-kind-surface]')?.dataset.kindSurface || null,
                skin: this.awarenessSkin ? 'awareness' : null,
                reportThanks: !!this.reader?.readPane?.querySelector?.('.aw-report-thanks'),
                reportWin: !!this.reader?.readPane?.querySelector?.('.aw-report-win'),
                callClaims: [...(this.reader?.readPane?.querySelectorAll?.('.tri-call-claim') || [])]
                    .map((c) => ({ fact: c.dataset.fact, value: c.querySelector('.tri-claim-value')?.textContent || '' })),
                actionButtons: [...(this.reader?.readPane?.querySelectorAll?.('.tri-verdict') || [])]
                    .map((b) => b.dataset.action),
                comparison: this.step === 'result' && this.comparison ? JSON.parse(JSON.stringify(this.comparison)) : null,
                messages: this.messages.map((m) => ({
                    id: m.id,
                    kind: kindOf(m),
                    action: this.answers.get(m.id)?.action || null,
                    who: m.from?.name || m.from?.address || '',
                    address: m.from?.address || '',
                    subject: m.subject || '',
                    time: m.time || '',
                    unread: m.read !== true,
                    playerSent: m.playerSent === true,
                    verdict: answered(m.id)
                })),
                verdictButtons: [...(this.reader?.readPane?.querySelectorAll?.('.tri-verdict') || [])]
                    .map((b) => b.dataset.verdict),
                sheet: this.sheet ? {
                    open: true,
                    messageId: this.sheet.messageId,
                    verdict: this.sheet.verdict,
                    chips: [...this.sheet.inputs.entries()].map(([id, i]) => ({
                        id, label: i.parentNode?.textContent || '', checked: i.checked
                    }))
                } : { open: false },
                review: {
                    cards: [...(this.root?.querySelectorAll?.('.tri-review-card') || [])].map((c) => ({
                        id: c.dataset.messageId,
                        caught: [...c.querySelectorAll('.tri-flag.caught')].map((x) => x.dataset.flag),
                        missed: [...c.querySelectorAll('.tri-flag.missed')].map((x) => x.dataset.flag),
                        falseClaims: [...c.querySelectorAll('.tri-false-flag')].map((x) => x.dataset.flag)
                    }))
                },
                result: this.result ? {
                    percent: this.result.percent, headline: this.result.headline, pass: this.result.pass,
                    phishCaught: this.result.phishCaught, phishTotal: this.result.phishTotal,
                    reportRate: this.result.reportRate, falseAlarms: this.result.falseAlarms,
                    perFactor: this.result.perFactor
                } : null,
                stored: this.stored ? { ...this.stored } : null,
                saving: this.saving,
                saveFailed: this.saveFailed,
                live: this._live,
                narrow
            }
        };
    }
}

export default InboxTriageMinigame;
