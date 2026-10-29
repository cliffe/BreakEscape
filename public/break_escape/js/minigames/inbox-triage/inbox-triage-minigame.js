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
import { scoreTriage, weakestFactor, bandFor, verdictPoints, verdictPointsOverride, FULL_VERDICT_POINTS, CRITICAL_PENALTY, criticalWhat,
    genuineFeedback, genuineFeedbackText, dedupeSentences, missedPhishText } from './triage-scoring.js';
import { buildTriageMessages } from './triage-messages.js';
import { buildHeaderPanel } from './header-panel.js';
import {
    FACTOR_ORDER, NONE_ID, chipIdsFor, chipLabel, redFlagString, skillName
} from './triage-flags.js';
import {
    kindOf, isNonEmail, actionsFor, actionById, kindVerdictLine, renderKindSurface, kindLabel, kindLabelFor, verdictAction, emailHiddenReveal,
    shortTitle, realNounFor, choiceOptions, choiceOptionFor, choiceText, verdictFeedbackOverride
} from './triage-kinds.js';
import { comparisonFor, comparisonText } from './triage-comparison.js';

const ICON = '/break_escape/assets/icons/';
const NARROW_QUERY = '(max-width: 767px)';
const STEPS = [['brief', '1 Brief'], ['sort', '2 Sort'], ['review', '3 Review'], ['result', '4 Result']];
const STAGE_LABEL = { pre: 'Pre-assessment', post: 'Follow-up assessment', training: 'Training round', mission: 'Inbox check' };
const REPORT_THANKS = 'Thanks for reporting. That warns everyone else.';
// P5-6: a report on a real item warns nobody of a phish, so it gets a neutral thank-you.
const REPORT_THANKS_REAL = 'Thanks for reporting. A colleague will check it and let it through.';

/**
 * "Weakest skill: Links (caught 0 of 1)." — or, when several skills tie on both counts, every
 * one of them: "Weakest skills: Greeting and Attachments (caught 0 of 1 each)." (P4-10: the
 * first zero used to win with no word about the others.)
 */
export function weakestText(weak, one, many, set = null) {
    const ids = Array.isArray(weak.ties) && weak.ties.length ? weak.ties : [weak.id];
    const counts = `caught ${weak.caught} of ${weak.caught + weak.missed}`;
    if (ids.length === 1) return `${one}: ${skillName(ids[0], set)} (${counts}).`;
    const names = ids.map((id) => skillName(id, set));
    return `${many}: ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} (${counts} each).`;
}
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
const isStr = (v) => typeof v === 'string' && v.length > 0;
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
        this.headerSeen = new Set();
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

    /** The set's wording overrides (`set.labels`, see triage-kinds.js), or null. */
    get labels() {
        const base = isObj(this.set?.labels) ? this.set.labels : null;
        // ENG-03a: fold the `verdictLabels` shorthand ({ trust, report, delete, verify }) into
        // labels.verdict.<v>.label, so the existing label mechanism relabels the buttons and the
        // review-card wording with no second code path. Absent, returns `base` unchanged.
        const vl = this.set?.verdictLabels;
        if (!isObj(vl)) return base;
        const verdict = { ...(isObj(base?.verdict) ? base.verdict : {}) };
        for (const v of ['trust', 'report', 'delete', 'verify']) {
            if (typeof vl[v] === 'string' && vl[v]) verdict[v] = { ...(isObj(verdict[v]) ? verdict[v] : {}), label: vl[v] };
        }
        return { ...(base || {}), verdict };
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
        this.headerSeen = new Set();
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
        root.setAttribute('aria-label', this._headerNoun());
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
        // aw6: the awareness skin's "team kept safe" tally: phish reported or checked by another
        // route so far. Shown only with immediate feedback, where each verdict's truth is already
        // on screen, so the count gives nothing away. Private and positive: no denominator.
        this.teamEl = null;
        if (this.awarenessSkin && this.feedbackMode === 'immediate') {
            this.teamEl = el('p', 'aw-team-tally');
            this.teamEl.setAttribute('aria-live', 'polite');
            this.sortEl.appendChild(this.teamEl);
            this._renderTeamTally(false);
        }
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
            paneRenderer: (rec, h) => (isNonEmail(rec) ? renderKindSurface(rec, h, this.labels) : null),
            // The kind tag, unless the row's subject already opens with it ("Voicemail (0:24)"
            // read "Voicemail Voicemail (0:24)", P3 N-16).
            rowTag: (rec) => {
                if (!isNonEmail(rec)) return null;
                const tag = kindLabelFor(rec, this.labels);
                return String(rec.subject || '').toLowerCase().startsWith(String(tag).toLowerCase()) ? null : tag;
            },
            rowBadge: (rec) => {
                const a = this.answers.get(rec.id);
                if (!a) return null;
                // Carry the verdict's tone so the list never shows a success tick on a wrong call
                // (F-E19-7): a right or acceptable call keeps the tick, a wrong one shows a cross.
                const right = this._isRight(rec, a.verdict);
                if (kindOf(rec) === 'choice') {
                    return { word: choiceText('answered', this.labels), tone: right ? 'right' : 'wrong',
                        mark: right ? 'mark-tick' : 'mark-cross' };
                }
                const word = actionById(isNonEmail(rec) ? kindOf(rec) : 'email', a.action, a.verdict, this.labels).past;
                const tone = this._verdictTone(rec, a.verdict); // 'right' | 'acceptable' | 'wrong'
                return { word, tone, mark: tone === 'wrong' ? 'mark-cross' : 'mark-tick' };
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
        this.titleEl = el('h2', 'tri-title', this._headerNoun());
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

    /** The announcement for a message's locked verdict (also what keeps it on screen while that message stays open). */
    _lockedLine(id) {
        const rec = this.messages.find((m) => m.id === id);
        const a = this.answers.get(id);
        return rec && a ? `Verdict locked: ${this._actionLabel(rec, a)}.` : null;
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

    /**
     * How to word the round for the kind of queue it is (E3-4/E5-7/D4/D5, Cut C). An email or
     * mixed-with-email queue keeps the inbox wording; a queue that is all calls, prompts or
     * voicemails gets its own label, item noun, "real X" noun and report-line wording, and drops
     * the generic Trust/Report/Delete/Verify legend (the per-message buttons already explain
     * themselves, and the email verbs do not apply to those kinds).
     */
    _queueInfo() {
        const kinds = this.messages.map((m) => kindOf(m));
        const every = (allow) => kinds.length > 0 && kinds.every((k) => allow.includes(k));
        // set.labels.queue[key] is layered over the entry for that key (see triage-kinds.js).
        const pick = (key, info) => {
            const out = { ...info };
            let itemSet = false;
            const own = this.labels?.queue?.[key];
            if (isObj(own)) {
                if (typeof own.label === 'string' && own.label) out.label = own.label;
                if (Array.isArray(own.item) && own.item.length === 2 && own.item.every((w) => typeof w === 'string' && w)) { out.item = [...own.item]; itemSet = true; }
                if (typeof own.real === 'string' && own.real) out.real = own.real;
                if (typeof own.reportLabel === 'string' && own.reportLabel) out.reportLabel = own.reportLabel;
            }
            // labels.itemNoun (batch-5 F-E10-8 / F-E12-6): a blanket item-noun override for a set
            // whose kind the derived noun names wrongly ("visitor" on a reception desk, not "call").
            // A string gives [noun, noun+'s']; a [singular, plural] pair is taken as-is. A per-queue
            // labels.queue.<key>.item wins over it. Absent, the derived default stands.
            if (!itemSet) {
                const n = this.labels?.itemNoun;
                if (typeof n === 'string' && n.trim()) out.item = [n.trim(), `${n.trim()}s`];
                else if (Array.isArray(n) && n.length === 2 && n.every((w) => typeof w === 'string' && w)) out.item = [...n];
            }
            return out;
        };
        if (kinds.some((k) => k === 'email' || k === 'playerSent')) {
            return pick('inbox', { label: 'Inbox check', item: ['message', 'messages'], real: realNounFor(kinds, this.set),
                reportLabel: 'Reported rather than just deleted', dropLegend: false });
        }
        if (every(['choice'])) return pick('choice', { label: 'Decisions', item: ['decision', 'decisions'], real: 'Sound choices',
            reportLabel: 'Reported rather than just deleted', dropLegend: true });
        if (every(['call'])) return pick('call', { label: 'Service desk queue', item: ['call', 'calls'], real: 'Real callers',
            reportLabel: 'Escalated rather than just refused', dropLegend: true });
        if (every(['push'])) return pick('push', { label: 'Sign-in prompts', item: ['prompt', 'prompts'], real: 'Expected sign-ins',
            reportLabel: 'Reported rather than just denied', dropLegend: true });
        if (every(['call', 'push'])) return pick('callPush', { label: 'Service desk queue', item: ['item', 'items'], real: 'Real callers',
            reportLabel: 'Escalated or reported rather than just refused', dropLegend: true });
        if (every(['voicemail'])) return pick('voicemail', { label: 'Voicemail', item: ['voicemail', 'voicemails'], real: 'Real voicemails',
            reportLabel: 'Reported rather than just deleted', dropLegend: true });
        if (every(['page'])) {
            // E20: a page queue may hold Wi-Fi network lists (page.state "wifiList"). Name the queue
            // for what is in it so the brief and title don't call networks "pages".
            const isWifi = (m) => kindOf(m) === 'page' && isObj(m.page) && m.page.state === 'wifiList';
            if (this.messages.every(isWifi)) {
                return pick('page', { label: 'Wi-Fi networks', item: ['network', 'networks'], real: 'Safe networks',
                    reportLabel: 'Reported rather than just deleted', dropLegend: false });
            }
            if (this.messages.some(isWifi)) {
                return pick('page', { label: 'Pages and networks', item: ['item', 'items'], real: 'Safe ones',
                    reportLabel: 'Reported rather than just deleted', dropLegend: false });
            }
            return pick('page', { label: 'Pages to check', item: ['page', 'pages'], real: 'Real pages',
                reportLabel: 'Reported rather than just deleted', dropLegend: false });
        }
        if (every(['sms', 'qr'])) return pick('sms', { label: 'Messages', item: ['message', 'messages'], real: 'Real messages',
            reportLabel: 'Reported rather than just deleted', dropLegend: false });
        return pick('other', { label: 'Messages to check', item: ['message', 'messages'], real: 'Real messages',
            reportLabel: 'Reported rather than just deleted', dropLegend: false });
    }

    /**
     * The noun for the overlay title and region label. A set may name it with `set.title`; otherwise
     * it follows the kinds present (the queue label), so a set of pages or Wi-Fi lists is not called
     * "Inbox check". An email or email-mixed set still defaults to "Inbox check".
     */
    _headerNoun() {
        return (isStr(this.set?.title) && this.set.title) ? this.set.title : this._queueInfo().label;
    }

    _renderBrief() {
        const p = this.briefEl;
        p.textContent = '';
        const n = this.messages.length;
        const info = this._queueInfo();
        // A pre/post/training round keeps its assessment label; otherwise the queue's own label.
        const stageLabel = ['pre', 'post', 'training'].includes(this.stage) ? STAGE_LABEL[this.stage] : null;
        const label = stageLabel || info.label;
        p.appendChild(el('h3', 'tri-brief-title', `${label}: ${plural(n, info.item[0], info.item[1])}`));
        if (typeof this.set.brief === 'string' && this.set.brief) p.appendChild(el('p', 'tri-brief-text', this.set.brief));

        // The email verdict legend is dropped on a call/prompt/voicemail queue (Cut C/D5): those
        // kinds show their own action buttons (or self-describing verdict buttons) during the sort.
        if (!info.dropLegend) {
            const dl = el('dl', 'tri-brief-buttons');
            const verdicts = ['trust', 'report', 'delete', ...(this.verifyEnabled ? ['verify'] : [])];
            for (const v of verdicts) dl.append(el('dt', null, verdictAction(v, this.labels).label), el('dd', null, verdictAction(v, this.labels).hint));
            p.appendChild(dl);
        }
        // Calls and sign-in prompts have their own buttons (05 N10); say so before the round.
        const kinds = new Set(this.messages.map((m) => kindOf(m)));
        for (const [kind, lead] of [['call', 'On a call'], ['push', 'On a sign-in prompt']]) {
            if (!kinds.has(kind)) continue;
            const shown = actionsFor(kind, this.verifyEnabled, this.labels);
            p.appendChild(el('p', `tri-brief-kind tri-brief-${kind}`,
                `${lead}: ${shown.map((a) => `${a.label} (${a.hint.replace(/\.$/, '').toLowerCase()})`).join('; ')}.`));
        }

        if (kinds.has('choice')) {
            p.appendChild(el('p', 'tri-brief-kind tri-brief-choice', choiceText('brief', this.labels)));
        }

        // A pre/post check is completion-scored (finishing it is what counts; the breakdown is
        // formative feedback), so the "right call is most of the score" weighting is only true of a
        // scored round (a training round or an episode's defend phase), not the checks (N: checks).
        if (['pre', 'post'].includes(this.stage)) {
            p.appendChild(el('p', 'tri-brief-score', 'Finishing the check is what counts here; the flags you tick shape your feedback.'));
        } else {
            // labels.scoreLine (optional) overrides this, for a set where "flags" collides with the
            // compose meter's "Red flags" (weak-line #5). Absent, the default reads as before.
            p.appendChild(el('p', 'tri-brief-score', isStr(this.labels?.scoreLine)
                ? this.labels.scoreLine
                : 'Right call is most of the score; naming the flags is the rest.'));
        }
        // The set's own brief often already says "You'll see how you did at the end"; the engine
        // line then says it once, not twice (P3 N13/N-9). An end-of-round set shows each item
        // marked on the Review step and a short item list on the Result step, so "right and
        // wrong" is true.
        const briefSaysEnd = typeof this.set.brief === 'string' && /\bat the end\b/i.test(this.set.brief);
        const endLine = "You'll see what you got right and wrong at the end.";
        const noun = info.item[0];
        let when;
        if (this.stage === 'pre') when = briefSaysEnd ? 'This one is just to see where you are.' : `This one is just to see where you are. ${endLine}`;
        else if (this.feedbackMode === 'end') when = briefSaysEnd ? '' : endLine;
        else when = `You'll get feedback after each ${noun}.`;
        if (when) p.appendChild(el('p', 'tri-brief-when', when));
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
        this._renderTeamTally(false);
        this.reader.render();
    }

    /** aw6: phish answered Report or Verify so far (a call's Escalate is Report, Ring back Verify). */
    teamProtectedCount() {
        let n = 0;
        for (const m of this.messages) {
            const a = this.answers.get(m.id);
            if (a && kindOf(m) !== 'choice' && m.truth?.isPhish === true && (a.verdict === 'report' || a.verdict === 'verify')) n += 1;
        }
        return n;
    }

    _renderTeamTally(pop) {
        if (!this.teamEl) return;
        const n = this.teamProtectedCount();
        this.teamEl.textContent = '';
        // aw-ux2: set.labels.teamBadge ({n}) and set.labels.teamBadgeTitle override the wording for
        // sets whose reported items are not all phish; unset keeps the phish wording.
        const own = this.labels;
        const badge = typeof own?.teamBadge === 'string' && own.teamBadge.trim()
            ? own.teamBadge.replace(/\{n\}/g, String(n)) : `Phish stopped for the team: ${n}`;
        this.teamEl.append(icon('mark-tick'), el('span', 'aw-team-tally-text', badge));
        this.teamEl.title = typeof own?.teamBadgeTitle === 'string' && own.teamBadgeTitle.trim()
            ? own.teamBadgeTitle : 'Phish you reported or checked by another route this round';
        this.teamEl.classList.remove('aw-team-pop');
        if (pop) {
            void this.teamEl.offsetWidth; // restart the animation
            this.teamEl.classList.add('aw-team-pop');
        }
    }

    _onOpen(rec) {
        // The "Verdict locked" line is about the message just sorted; opening another must not leave it
        // reading as that message's verdict (lab R18 F-d).
        if (this._live && this._live !== this._lockedLine(rec.id)) this._announce('');
        rec.read = true;
        this.openedAt.set(rec.id, Date.now());
    }

    _headerPanel(rec) {
        const mode = this.set.headerPanel;
        if (mode === 'off') return el('p', 'tri-header-off', 'Header details are not part of this round.');
        // The details are on screen for this message, so its header tells can now be ticked (F7).
        if (rec?.id) this.headerSeen.add(rec.id);
        return buildHeaderPanel(rec, this.view, {
            glossary: this.set.glossary || 'closed',
            onToggleGlossary: () => { this.view.glossaryOpen = !this.view.glossaryOpen; this._rerender('[data-glossary="toggle"]'); },
            onToggleExplain: (mech) => {
                this.view.explain = this.view.explain === mech ? null : mech;
                this._rerender(`[data-explain="${mech}"]`);
            }
        }, { plain: this.profile === 'awareness' || this.awarenessSkin });
    }

    /** Rebuild the reading pane and return focus to the control the player just used. */
    _rerender(focusSelector) {
        this.reader.render();
        if (focusSelector) this.reader.readPane.querySelector?.(focusSelector)?.focus?.();
    }

    _afterBody(rec, pane) {
        // ENG-06: an email that carries a white-text "note for AI assistants" line shows a
        // "show hidden text" reveal on its surface, in any step. Guarded by rec.hiddenText, so
        // every other email card (every mission and the lab) is unchanged.
        if (!isNonEmail(rec)) {
            const reveal = emailHiddenReveal(rec);
            if (reveal) pane.appendChild(reveal);
        }
        if (this.step !== 'sort') return;
        const ans = this.answers.get(rec.id);
        const box = el('div', 'tri-actions');
        if (!ans && kindOf(rec) === 'choice') {
            // ENG-09a: one decision, so the card's own options replace the verdict row. Each option
            // is scored as the built verdict it maps to, with no "What made you say that?" sheet
            // (a choice card authors no flags). The verdict is not on the button: a colour or icon
            // would give the right option away.
            const group = el('div', 'tri-verdicts tri-choice-options');
            group.setAttribute('role', 'group');
            group.setAttribute('aria-label', choiceText('group', this.labels));
            for (const o of choiceOptions(rec)) {
                const btn = el('button', 'tri-choice-option minigame-button');
                btn.type = 'button';
                btn.dataset.action = o.id;
                btn.dataset.verdict = o.verdict;
                btn.appendChild(el('span', 'tri-choice-label', o.label));
                this.addEventListener(btn, 'click', () => this._pickChoice(rec, o));
                group.appendChild(btn);
            }
            box.appendChild(group);
        } else if (!ans) {
            box.classList.add('tri-actions-open');
            const group = el('div', 'tri-verdicts');
            group.setAttribute('role', 'group');
            group.setAttribute('aria-label', 'Your verdict');
            // Email and most kinds: Trust, Report, Delete (and Verify). A call or a push has its
            // own actions, each scored through one of those verdict rows (05 N10).
            for (const a of actionsFor(kindOf(rec), this.verifyEnabled, this.labels)) {
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
            // The report's positive beat plays once, on the render right after the report was locked.
            const isReport = this.awarenessSkin && ans.verdict === 'report' && kindOf(rec) !== 'choice';
            const win = isReport && this._reportWin === rec.id;
            if (this.feedbackMode === 'immediate') {
                // F-E19-3: in immediate mode the review card's verdict line is the single
                // confirmation. The separate "Your verdict: … Locked in." lock line and the
                // standalone thanks line are dropped (three near-identical lines → one); the card
                // verdict line carries the report-win pop and thanks beat via the same classes.
                const card = this._card(rec);
                if (isReport) {
                    const vEl = card.querySelector?.('.tri-card-verdict');
                    if (vEl) {
                        vEl.classList.add('aw-report-thanks');
                        if (win) { vEl.classList.add('aw-report-win'); this._reportWin = null; }
                    }
                }
                box.appendChild(card);
                const next = el('button', 'tri-next minigame-button');
                next.type = 'button';
                const nextRec = this._nextUnanswered(rec.id);
                // labels.next (batch-5 F-E10-8 / F-E12-6) overrides the "Next message" button; the
                // default follows the queue's item noun ("Next call", "Next visitor"), so a non-email
                // set no longer reads "Next message". Unchanged for an email set (noun 'message').
                next.textContent = nextRec
                    ? (isStr(this.labels?.next) ? this.labels.next : `Next ${this._queueInfo().item[0]}`)
                    : 'See result';
                next.addEventListener('click', () => {
                    if (nextRec) this.reader.select(nextRec.id);
                    else this._finishSort();
                });
                box.appendChild(next);
            } else {
                // End mode keeps the lock line: there is no review card during the sort, so this is
                // the only confirmation until the Review step.
                const lock = el('p', 'tri-locked');
                lock.append(icon('mark-tick'), el('span', null, `Your verdict: ${this._actionLabel(rec, ans)}. Locked in.`));
                box.appendChild(lock);
                if (isReport) {
                    const thanks = el('p', `aw-report-thanks${win ? ' aw-report-win' : ''}`,
                        rec.truth?.isPhish === true ? REPORT_THANKS : REPORT_THANKS_REAL);
                    if (win) {
                        lock.classList.add('aw-report-win');
                        this._reportWin = null;
                    }
                    box.appendChild(thanks);
                }
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

    /** The awareness round hides header tells until this message's header details are open (F7). */
    _hideHeaderTells(rec) {
        if (!(this.profile === 'awareness' || this.awarenessSkin)) return false;
        if (isNonEmail(rec)) return false;
        const mode = this.set.headerPanel;
        if (mode === 'open') return false;
        return mode === 'off' || !this.headerSeen.has(rec.id);
    }

    _chipIds(rec) {
        // The awareness round lists the set's own tells and the kind's channel tells before the generic
        // email ones (E8 F4); set.chipOrder "default" keeps the old order.
        const relevantFirst = this.set.chipOrder === 'relevantFirst' || (this.awarenessSkin && this.set.chipOrder !== 'default');
        return chipIdsFor(this.set, kindOf(rec), rec, { hideHeaderTells: this._hideHeaderTells(rec), relevantFirst });
    }

    /** The word for what the player did: the call or push action's label, else the verdict's. */
    _actionLabel(rec, ans) {
        if (!ans) return '';
        if (kindOf(rec) === 'choice') return choiceOptionFor(rec, ans.action, ans.verdict)?.label || '';
        return actionById(isNonEmail(rec) ? kindOf(rec) : 'email', ans.action, ans.verdict, this.labels).label;
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

        // A div group, not a fieldset: a fieldset will not reliably clip its own scroll area, and
        // the tick list must scroll above the Confirm/Back bar (lab R16 N8).
        const fs = el('div', 'tri-chips');
        fs.setAttribute('role', 'group');
        fs.setAttribute('aria-label', 'What made you say that?');
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
        // "Nothing looks wrong" sits below the scrolling list so it is always in view.
        addChip(NONE_ID);
        const noneLabel = fs.querySelector('.tri-chip-none');
        if (noneLabel) noneLabel.remove();
        if (this._hideHeaderTells(rec) && this.set.headerPanel !== 'off') {
            fs.appendChild(el('p', 'tri-chip-header-note',
                "Header checks are under 'Show details'. Go back and open them to tick a header tell."));
        }
        for (const [id, input] of inputs) {
            this.addEventListener(input, 'change', () => {
                if (!input.checked) return;
                for (const [other, o] of inputs) {
                    if (other !== id && ((id === NONE_ID) || other === NONE_ID)) o.checked = false;
                }
            });
        }
        sheet.appendChild(fs);
        if (noneLabel) sheet.appendChild(noneLabel);

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
        // E8 F11: Confirm is allowed with nothing ticked (naming a flag is never required), but mark
        // it so the immediate review card can nudge the learner to tick next time. Choosing
        // "Nothing looks wrong" is a deliberate answer and is not nudged.
        if (!flags.length && !s.inputs.get(NONE_ID)?.checked) answer.unflagged = true;
        this._lockAnswer(s.messageId, answer);
    }

    /** The one-line nudge shown when Confirm is pressed with nothing ticked (E8 F11); overridable. */
    _nudgeLine() {
        return isStr(this.set?.sheetNudge) ? this.set.sheetNudge
            : 'Tick what made you decide, or choose ‘Nothing looks wrong’. Then Confirm again.';
    }

    /** A choice card's option is the whole answer: no flags, no sheet (ENG-09a). */
    _pickChoice(rec, option) {
        if (this.sheet || this.answers.has(rec.id)) return;
        const opened = this.openedAt.get(rec.id);
        const ms = Number.isFinite(opened) ? Math.max(0, Date.now() - opened) : 0;
        this._lockAnswer(rec.id, { id: rec.id, verdict: option.verdict, flags: [], ms, action: option.id });
    }

    /** Record an answer, close the sheet if one is open, and move the round on. */
    _lockAnswer(messageId, answer) {
        const teamBefore = this.teamEl ? this.teamProtectedCount() : 0;
        this.answers.set(messageId, answer);
        const answered = this.messages.find((m) => m.id === messageId);
        if (this.awarenessSkin && answer.verdict === 'report' && kindOf(answered) !== 'choice') {
            this._reportWin = messageId;
            // The report sting (11 §4.3, §8): a short positive sound with the pop animation.
            try { window.soundManager?.play?.('ui_confirm'); } catch (e) { /* sound is optional */ }
        }
        this._closeSheet(false);
        const rec = this.messages.find((m) => m.id === messageId);
        if (this.teamEl) this._renderTeamTally(this.teamProtectedCount() > teamBefore);
        this._announce(this._lockedLine(rec.id));
        this.progressEl.textContent = `${this.answers.size} of ${this.messages.length} sorted`;

        if (this.answers.size >= this.messages.length) {
            if (this.feedbackMode === 'end') { this._showStep('review'); return; }
            // immediate: the last message's review card stays, with "See result".
        }
        this.reader.render();
        const focus = this.reader.readPane.querySelector?.('.tri-card-title') || this.reader.readPane.querySelector?.('.tri-next');
        if (focus) { focus.tabIndex = focus.tabIndex < 0 ? -1 : focus.tabIndex; focus.focus?.(); }
        else this.reader.readPane.querySelector?.('.tri-next')?.focus?.();
        this._scrollToFeedback();
    }

    /**
     * After Confirm, bring the "Your verdict" line and the feedback card under it to the top of the
     * reading pane, so the card and Next are not left below the fold. Instant when the player
     * prefers reduced motion.
     */
    _scrollToFeedback() {
        const pane = this.reader?.readPane;
        // Immediate mode drops the .tri-locked line (F-E19-3), so fall back to the review card's
        // verdict line, which is now the single confirmation.
        const target = pane?.querySelector?.('.tri-locked') || pane?.querySelector?.('.tri-card-verdict');
        if (!target || typeof target.scrollIntoView !== 'function') return;
        let reduce = false;
        try { reduce = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* default */ }
        target.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    }

    // ── review cards ───────────────────────────────────────────────────────────

    _scoreOne(rec) {
        const ans = this.answers.get(rec.id);
        if (!ans) return null;
        return scoreTriage({ messages: [rec], answers: [ans], profile: this.profile, scoring: this.set?.scoring }).perMessage[0];
    }

    _verdictLine(rec, verdict) {
        const phish = rec.truth.isPhish === true;
        const aware = this.profile === 'awareness';
        // A set may override the per-verdict feedback line (F-E10-2) so a relabelled verdict does
        // not leak the engine word; a per-item truth.reportLine / verifyLine still wins (below).
        const fb = verdictFeedbackOverride(this.labels, verdict, phish);
        const kind = kindOf(rec);
        // batch-6 (item over set, C5): an item's own feedback line always wins, for every kind.
        // A per-item reportLine / verifyLine, or a kindLine that says what a genuine-but-report
        // item really was, beats both the set's labels.verdictFeedback and the kind's built line.
        if (phish) {
            if (verdict === 'report' && isStr(rec.truth.reportLine)) return rec.truth.reportLine;
            if (verdict === 'verify' && isStr(rec.truth.verifyLine)) return rec.truth.verifyLine;
            if (verdict === 'trust' && isStr(rec.truth.kindLine)) return `Not this time. ${rec.truth.kindLine}`;
        }
        // The call and push kinds carry their own built lines (phone wording: "ring back on the
        // number you hold"); a set that relabels them for another setting (E12's reception desk)
        // overrides them through the same labels.verdictFeedback (batch-5 E12 follow-up, 844177620).
        const own = (fb && (kind === 'call' || kind === 'push')) ? fb : kindVerdictLine(kind, phish, verdict);
        if (own) return own;
        if (phish) {
            // truth.kindLine (optional) says what this item really was, for a genuine message the
            // learner should still report, where "This one was a phish" would be false.
            const what = isStr(rec.truth.kindLine) ? rec.truth.kindLine : 'This one was a phish.';
            // The item's own reportLine/verifyLine/kindLine were handled above; here only the set
            // override (fb) and the generic defaults remain.
            const verify = `Checking first is a sound habit. ${what}`;
            return {
                report: fb || 'Right call: reported. A report warns everyone else.',
                delete: fb || 'Safe, but not reported. Deleting protects you; reporting warns everyone else.',
                trust: fb || `Not this time. ${what}`,
                verify: fb || verify
            }[verdict];
        }
        return fb || {
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

    /**
     * The sentence that names the right call, added to a card whose verdict fell short: the actions
     * that earn full verdict marks on this item, in this set's own words, at most two.
     */
    _rightCallLine(rec) {
        const phish = rec.truth.isPhish === true;
        const kind = kindOf(rec);
        const override = verdictPointsOverride(rec.truth, kind, this.set?.scoring, phish);
        const full = actionsFor(kind, this.verifyEnabled, this.labels)
            .filter((a) => verdictPoints(this.profile, phish, a.verdict, kind, override) >= FULL_VERDICT_POINTS);
        const order = phish ? ['report', 'verify'] : ['trust', 'verify', 'report'];
        const rank = (a) => { const i = order.indexOf(a.verdict); return i < 0 ? 99 : i; };
        const sorted = [...full].sort((a, b) => rank(a) - rank(b));
        const names = [...new Set(sorted.map((a) => a.label))].slice(0, 2);
        if (!names.length) return '';
        return ` The right call was ${names.join(' or ')}.`;
    }

    /** Right means full verdict marks under the set's profile, the same rule the result grid uses. */
    _isRight(rec, verdict) {
        const kind = kindOf(rec);
        return verdictPoints(this.profile, rec.truth.isPhish === true, verdict, kind,
            verdictPointsOverride(rec.truth, kind, this.set?.scoring, rec.truth.isPhish === true)) >= FULL_VERDICT_POINTS;
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
        // A subject cut short with trailing dots (a text's body preview) loses them (P7-7).
        const subject = String(rec.subject || '(no subject)').replace(/\s*(?:\.{3,}|\u2026)\s*$/, '') || '(no subject)';
        const who = rec.from?.name || rec.from?.address || '';
        return isNonEmail(rec) && who && who !== subject ? `${who} · ${subject}` : subject;
    }

    /** One review card (05 step 3): verdict line, caught and missed flags, false flags, what would have happened. */
    _card(rec) {
        const ans = this.answers.get(rec.id);
        const per = this._scoreOne(rec);
        const truth = rec.truth;
        const card = el('article', 'tri-review-card');
        const isChoice = kindOf(rec) === 'choice';
        card.dataset.messageId = rec.id;
        card.dataset.kind = kindOf(rec);
        const title = el('h3', 'tri-card-title', this._cardTitle(rec));
        title.tabIndex = -1;
        card.appendChild(title);

        const tone = this._verdictTone(rec, ans.verdict);
        const verdict = el('p', `tri-card-verdict ${tone}`);
        verdict.append(icon(tone === 'wrong' ? 'mark-cross' : 'mark-tick'),
            el('span', null, `You chose ${this._actionLabel(rec, ans)}. ${isChoice
                ? choiceText(this._isRight(rec, ans.verdict) ? 'right' : 'wrong', this.labels)
                : this._verdictLine(rec, ans.verdict) + (tone === 'wrong' ? this._rightCallLine(rec) : '')}`));
        card.appendChild(verdict);
        if (isChoice) return this._choiceCard(card, rec, ans, per);

        // lab3 (opt-in): mark the player's own sends on the flip, so the attack-to-defence mirror
        // lands in the mandatory review and not only in an NPC's optional topic. Shown only when the
        // triage set authors `flagPlayerSent` (a string, or true for a plain default); off elsewhere.
        if (rec.playerSent === true && this.set && this.set.flagPlayerSent) {
            const sentLine = typeof this.set.flagPlayerSent === 'string' ? this.set.flagPlayerSent : 'You sent this one.';
            card.appendChild(el('p', 'tri-player-sent', sentLine));
        }

        const notes = isObj(truth.perFlagNote) ? truth.perFlagNote : {};
        if (truth.isPhish) {
            // One row per tell: an either-tick group is one row, shown under the member the
            // learner ticked (its own note), or under its first member when missed.
            const ul = el('ul', 'tri-flags');
            const units = Array.isArray(per.units) ? per.units : [];
            // F-E9-6: when the verdict itself was right (full marks), an un-ticked tell is not a
            // "Missed:" failure — the player handled the item correctly, they just did not name
            // this sign. Soften those rows to "Also worth noticing:" so a correct call does not
            // read as a mistake. A wrong verdict keeps "Missed:".
            const softMiss = this._isRight(rec, ans.verdict);
            for (const u of units) if (u.caught) ul.appendChild(this._flagRow(rec, u.shown, true, notes[u.shown] || notes[u.note]));
            for (const u of units) if (!u.caught) ul.appendChild(this._flagRow(rec, u.note, false, notes[u.note], softMiss));
            card.appendChild(ul);
        }
        // whyFine sentences already printed on a "Not a flag here" line, so the "why this one was
        // fine" list below does not print the same sentence a second time (P4-5).
        const shownWhy = new Set();
        if (per.falseClaims.length) {
            const why = isObj(truth.whyFine) ? truth.whyFine : {};
            const ul = el('ul', 'tri-false-flags');
            for (const id of per.falseClaims) {
                const li = el('li', 'tri-false-flag');
                li.dataset.flag = id;
                // E19 m-5: use a flag-specific reason when the author gave one; otherwise the short
                // generic line. The message's general whyFine.default is no longer pulled onto the
                // false-flag row (it read as "Not a flag here: <chip>. <whole-message explanation>",
                // the chip label and the explanation running together); it stays in the why-fine
                // list below. The chip label and its reason are separate spans so they do not read
                // as one run-on sentence.
                const reason = isStr(why[id]) ? why[id] : "It wasn't one of this message's tells.";
                if (isStr(why[id])) shownWhy.add(String(why[id]).trim());
                li.append(icon('mark-question'), el('span', 'tri-flag-word', 'Not a flag here:'),
                    el('span', 'tri-flag-label', `${chipLabel(this.set, id)}.`),
                    el('span', 'tri-flag-text', reason));
                ul.appendChild(li);
            }
            card.appendChild(ul);
        }
        if (truth.isPhish && (ans.verdict === 'trust' || ans.verdict === 'delete') && truth.ifTrusted) {
            // After Trust it is what the learner let happen; after a safe Delete/Refuse nothing
            // happened, so name it as what the attacker was after (E1-E4 P4-6).
            const lead = ans.verdict === 'trust' ? 'What would have happened'
                : (kindOf(rec) === 'call' ? 'What this caller was after' : 'What this one was after');
            card.appendChild(el('p', 'tri-if-trusted', `${lead}: ${truth.ifTrusted}`));
        }
        if (!truth.isPhish) {
            const why = isObj(truth.whyFine) ? truth.whyFine : {};
            let lines = Object.entries(why).filter(([k, v]) => k !== 'default' && typeof v === 'string' && v)
                .map(([, v]) => v);
            if (typeof why.default === 'string' && why.default) lines.push(why.default);
            // Each sentence once: not again after a "Not a flag here" line, and not twice in the list.
            // P5-9: and no sentence twice across lines (a reworded subject still counts).
            lines = dedupeSentences(lines, [...shownWhy]);
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
            if (reply) card.appendChild(el('p', 'tri-it-reply', `${this._replyFrom()}: ${reply}`));
        }
        // E8 F11: the learner confirmed without ticking anything (and did not choose "Nothing looks
        // wrong"), so a one-line nudge invites naming what they noticed next time. Allowed, never
        // blocked; shown only on the immediate review card, only when truly nothing was ticked.
        if (ans.unflagged === true) card.appendChild(el('p', 'tri-card-nudge', this._nudgeLine()));
        card.appendChild(el('p', 'tri-card-score', `Score for this message: ${per.score} of 100`));
        return card;
    }

    /**
     * The rest of an authored-choice review card (ENG-09a). There are no tells to list: the right
     * pick shows why (truth.reportReply), a wrong one names the better option and what could go
     * wrong (truth.ifTrusted). A real item's whyFine lines still show.
     */
    _choiceCard(card, rec, ans, per) {
        const truth = rec.truth;
        const right = this._isRight(rec, ans.verdict);
        if (right && typeof truth.reportReply === 'string' && truth.reportReply) {
            card.appendChild(el('p', 'tri-choice-why', `${choiceText('whyRight', this.labels)}: ${truth.reportReply}`));
        }
        if (!right) {
            const best = choiceOptions(rec).find((o) => o.verdict === truth.correct);
            if (best) card.appendChild(el('p', 'tri-choice-better', `${choiceText('better', this.labels)}: ${best.label}`));
            if (typeof truth.ifTrusted === 'string' && truth.ifTrusted) {
                card.appendChild(el('p', 'tri-if-trusted', `${choiceText('ifWrong', this.labels)}: ${truth.ifTrusted}`));
            }
        }
        if (!truth.isPhish) {
            const why = isObj(truth.whyFine) ? truth.whyFine : {};
            const lines = dedupeSentences(Object.values(why).filter((v) => typeof v === 'string' && v));
            if (lines.length) {
                const ul = el('ul', 'tri-why-fine');
                ul.setAttribute('aria-label', 'Why this one was fine');
                for (const l of lines) ul.appendChild(el('li', null, l));
                card.appendChild(ul);
            }
        }
        card.appendChild(el('p', 'tri-card-score', `Score for this message: ${per.score} of 100`));
        return card;
    }

    _flagRow(rec, id, caught, note, softMiss = false) {
        // softMiss (F-E9-6): the verdict was right, so an un-ticked tell is "Also worth noticing:",
        // a neutral question mark, not a danger-red "Missed:" cross.
        const soft = !caught && softMiss;
        const li = el('li', `tri-flag ${caught ? 'caught' : 'missed'}${soft ? ' tri-flag-soft' : ''}`);
        li.dataset.flag = id;
        li.append(icon(caught ? 'mark-tick' : (soft ? 'mark-question' : 'mark-cross')),
            el('span', 'tri-flag-word', caught ? 'Caught:' : (soft ? 'Also worth noticing:' : 'Missed:')),
            el('span', 'tri-flag-text', note ? `${redFlagString(id, rec, this.set)} (${note})` : redFlagString(id, rec, this.set)));
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

    /**
     * The result screen's pointer lines. A lab set (analyst profile, no skin) sends the
     * student to the mail client and the lab sheet; the awareness product (the episode
     * runner's skin, or an awareness-profile set) has neither, so it points at the
     * learner's own inbox and their security team instead.
     */
    _resultCopy(several = false) {
        // `several`: the weakest line names tied skills, so the nudge says "them", not "it".
        const it = several ? 'them' : 'it';
        const copy = this._defaultResultCopy(it);
        // set.resultCopy { weakest, noFlags } replaces either line; {it} in `weakest` becomes it/them.
        const own = isObj(this.set?.resultCopy) ? this.set.resultCopy : {};
        if (typeof own.weakest === 'string' && own.weakest) copy.weakest = own.weakest.split('{it}').join(it);
        if (typeof own.noFlags === 'string' && own.noFlags) copy.noFlags = own.noFlags;
        if (typeof own.noFlagsLead === 'string' && own.noFlagsLead) copy.noFlagsLead = own.noFlagsLead;
        return copy;
    }

    _defaultResultCopy(it) {
        // noFlagsLead (batch-5 E17): the sentence before noFlags, overridable for a non-phishing set
        // where "name any flags" reads wrongly. Default unchanged.
        const noFlagsLead = "You didn't name any flags on these messages, so there's nothing to grade skill by skill.";
        if (this.awarenessSkin || this.profile === 'awareness') {
            return {
                weakest: this._awarenessWeakestLine(it),
                noFlags: 'Next time, tick what looks off. The review cards show what gave each fake one away.',
                noFlagsLead
            };
        }
        return {
            weakest: `Practise ${it} in the mail client, then look ${it} up in your lab sheet.`,
            noFlags: 'Tick what looks off next time, then check your lab sheet.',
            noFlagsLead
        };
    }

    /** The prefix on the reply after a report: set.reportReplyFrom, else "IT Security". */
    _replyFrom() {
        const from = this.set?.reportReplyFrom;
        return typeof from === 'string' && from ? from : 'IT Security';
    }

    /**
     * The "where to look next" line, worded for the kind of thing this round checked (E5-7): an
     * inbox talks about the next messages at work, a page set about reading the address bar, a
     * call/prompt queue about checking through a channel you trust. All point at the IT/security
     * team. A mixed set falls back to the inbox wording.
     */
    _awarenessWeakestLine(it = 'it') {
        const kinds = this.messages.map((m) => kindOf(m));
        const every = (allow) => kinds.length > 0 && kinds.every((k) => allow.includes(k));
        const ask = 'and if you are not sure, ask your IT or security team.';
        if (kinds.some((k) => k === 'email' || k === 'playerSent')) {
            return `Look for ${it} in the next messages you get at work, ${ask}`;
        }
        if (every(['page'])) return `Read the address bar before you sign in to any page, ${ask}`;
        if (every(['call', 'push', 'voicemail'])) {
            return `If a caller, prompt or voicemail pushes you to act, stop and check through a channel you already trust, ${ask}`;
        }
        if (every(['choice'])) return `Think back to the choices you missed the next time they come up at work, ${ask}`;
        if (every(['sms', 'qr'])) return `Be wary of links and codes you did not ask for, ${ask}`;
        return `Look for ${it} in the next messages you get at work, ${ask}`;
    }

    _score() {
        return scoreTriage({
            messages: this.messages, answers: this._answerList(), profile: this.profile,
            bands: this.set.bands, passPercent: this.passPercent, scoring: this.set.scoring
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
            realHandledRight: s.realHandledRight,
            realTotal: s.realTotal,
            criticalMisses: s.criticalMisses,
            criticalKinds: s.criticalKinds,
            criticalLabels: s.criticalLabels,
            phishVerified: s.phishVerified,
            total: this.messages.length,
            skipped: this.skipped.map((x) => x.id),
            // Per-answer ms stays in memory (05): the starter writes only the four globals.
            answers: s.perMessage.map((pm) => {
                const a = this.answers.get(pm.id) || {};
                // isPhish rides along for the measurement store's discrimination figure (aw3).
                const out = { id: pm.id, verdict: pm.verdict, flags: a.flags || [], score: pm.score, ms: a.ms ?? 0, isPhish: pm.isPhish === true };
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
            const info = this._queueInfo();
            // A genuine item is handled right when its verdict earned full marks, the same rule
            // the review card uses: Trust, Verify / Ring back, and (under awareness) Report, which
            // is "never wrong" (D4, P3 N-2). Comply on an unchecked genuine caller is not. The
            // noun follows the queue's kind.
            // labels.phishCaughtLabel (optional) overrides the counter label, for a non-phishing set
            // (E17 acceptable-use) where "Phish caught" is wrong; default unchanged (E17-M2).
            addNum(isStr(this.labels?.phishCaughtLabel) ? this.labels.phishCaughtLabel : 'Phish caught',
                `${result.phishCaught} of ${result.phishTotal}`, 'phishCaught');
            // A phish checked by another route (Verify, Ring back) was caught, not missed: say so
            // on the same line, so "1 of 4" beside two correct Ring backs is not read as a miss (N7).
            addNum(info.reportLabel, `${result.reportCount} of ${result.phishTotal}` +
                (result.phishVerified ? `, and ${result.phishVerified} more checked by another route` : ''), 'reported');
            addNum(`${info.real} handled right`, `${result.realHandledRight} of ${result.realTotal}`, 'realTrusted');
            if (this.profile === 'analyst') addNum('False alarms', String(result.falseAlarms), 'falseAlarms');
            if (this.verifyEnabled && result.verifyCount) addNum('Checked by another route', String(result.verifyCount), 'verify');
        }
        p.appendChild(nums);

        if (!stored && result.criticalMisses?.length) {
            // When every critical miss carries its own truth.missLabel (a genuine item that should
            // still be reported), the line does not claim an attacker was let in.
            const labels = Array.isArray(result.criticalLabels) ? result.criticalLabels : [];
            const allLabelled = labels.length === result.criticalMisses.length && labels.every((l) => isStr(l));
            // Name the item(s) that actually cost the points, so the line is not read against a
            // correct Trust on a genuine item listed below it (F-E15-1). criticalMisses are message ids.
            const missItems = result.criticalMisses
                .map((id) => this.messages.find((m) => m.id === id))
                .filter(Boolean)
                .map((m) => shortTitle(m) || this._cardTitle(m));
            const nameLine = missItems.length
                ? ` ${missItems.length === 1 ? 'The item was' : 'The items were'} ${missItems.map((t) => `'${t}'`).join(missItems.length === 2 ? ' and ' : ', ')}.`
                : '';
            p.appendChild(el('p', 'tri-critical',
                `${result.criticalMisses.length === 1 ? 'One answer' : `${result.criticalMisses.length} answers`} ${allLabelled ? 'missed something that needed reporting' : 'let an attacker straight in'} ` +
                `(${criticalWhat(result.criticalKinds, labels, this.set?.criticalWhat) || "approving a sign-in you didn't start, or doing what an impostor asked on a call"}).` + nameLine + ` ` +
                `That costs ${CRITICAL_PENALTY} points off the round${result.criticalMisses.length === 1 ? "" : " each"}, on top of the item itself.`));
        }
        // The genuine items (FUN_DECISIONS disc_visible): which real ones the learner trusted, what
        // made each flagged one safe and why both halves matter. End-of-round feedback puts the
        // "what made it safe" lines under the item list; immediate feedback names the items only,
        // because each card already said why.
        const genuine = stored ? null : this._genuineFeedback();
        if (!stored && this.feedbackMode === 'end') p.appendChild(this._itemList(genuine));
        const genuineBox = genuine ? this._genuineSummary(genuine) : null;
        if (genuineBox) p.appendChild(genuineBox);
        // Opt-in (lab R20 F20-1): name the phish that were trusted, beside the real ones above.
        if (!stored && this.set?.missedPhishLine === true) {
            const line = missedPhishText(result.answers, this.messages, (m) => shortTitle(m) || this._cardTitle(m));
            if (line) p.appendChild(el('p', 'tri-missed-phish', line));
        }

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
                        const li = el('li', 'tri-skill', `${skillName(id, this.set)}: caught ${c.caught} of ${c.caught + c.missed}`);
                        li.dataset.factor = id;
                        ul.appendChild(li);
                    }
                    p.appendChild(ul);
                    const weak = weakestFactor(result.perFactor);
                    if (weak) {
                        const nudges = isObj(this.set.nudges) ? this.set.nudges : {};
                        p.appendChild(el('p', 'tri-weakest',
                            `${weakestText(weak, 'Weakest skill', 'Weakest skills', this.set)} ` +
                            (nudges[weak.id] || this._resultCopy(Array.isArray(weak.ties) && weak.ties.length > 1).weakest)));
                    }
                } else {
                    const copy = this._resultCopy();
                    p.appendChild(el('p', 'tri-weakest', `${copy.noFlagsLead} ${copy.noFlags}`));
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

        // The text scrolls in its own body and the action bar sits below it, so the skill breakdown
        // is never underneath Finish (E8 F5).
        const body = el('div', 'tri-result-body');
        while (p.firstChild) body.appendChild(p.firstChild);
        p.appendChild(body);

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

    /**
     * A short item-by-item list for an end-of-round set (a pre/post check): each item's title, what
     * the learner did and a plain right / worth-another-look mark, so the brief's "right and wrong
     * at the end" holds on the last screen too (P3 N-9). Same rule as the review cards; the
     * wording never blames.
     */
    _itemList(genuine = null) {
        // disc_visible: a real item treated as a phish gets what made it safe under its own line.
        // Three or more fold away, so the list stays short.
        const fold = (genuine?.flagged?.length || 0) > 2;
        const box = el('section', 'tri-items');
        box.setAttribute('aria-label', 'Item by item');
        box.appendChild(el('h4', 'tri-items-title', 'Item by item'));
        const ol = el('ol', 'tri-item-list');
        for (const m of this.messages) {
            const ans = this.answers.get(m.id);
            if (!ans) continue;
            const right = this._isRight(m, ans.verdict) || this._verdictTone(m, ans.verdict) === 'acceptable';
            const li = el('li', `tri-item ${right ? 'right' : 'review'}`);
            li.dataset.messageId = m.id;
            li.append(icon(right ? 'mark-tick' : 'mark-question'),
                el('span', 'tri-item-title', this._cardTitle(m)),
                el('span', 'tri-item-verdict', ` · ${this._actionLabel(m, ans)}: ${right ? 'right call' : 'worth another look'}`));
            const why = genuine?.flagged.find((f) => f.id === m.id);
            if (why) {
                const line = why.why ? `It was real. What made it safe: ${why.why}${why.cost ? ` ${why.cost}` : ''}`
                    : `It was real.${why.cost ? ` ${why.cost}` : ''}`;
                if (fold) {
                    const d = el('details', 'tri-item-why');
                    d.append(el('summary', null, 'It was real: what made it safe'), el('p', null, line.replace(/^It was real\. What made it safe: /, '')));
                    li.appendChild(d);
                } else {
                    li.appendChild(el('p', 'tri-item-why', line));
                }
            }
            ol.appendChild(li);
        }
        box.appendChild(ol);
        return box;
    }

    /** genuineFeedback() for this round, or null (no answered real item, or the set opts out). */
    _genuineFeedback() {
        if (this.set?.genuineFeedback === false) return null;
        return genuineFeedback({
            messages: this.messages, answers: this._answerList(), profile: this.profile,
            titleOf: (m) => shortTitle(m) || this._cardTitle(m), actionLabel: (m, a) => this._actionLabel(m, a),
            actionPast: (m, a) => actionById(isNonEmail(m) ? kindOf(m) : 'email', a.action, a.verdict, this.labels).past
        });
    }

    /**
     * The result screen's few lines on the real items: who was trusted, which were treated as a
     * phish (named here under immediate feedback; under end-of-round feedback the item list above
     * carries what made each safe), the cost of a false alarm and why both halves matter. When an
     * episode debrief follows (params.debriefFollows), the cost and why lines are left to it.
     */
    _genuineSummary(genuine) {
        const text = genuineFeedbackText(genuine, { detail: false, strings: this.set?.genuineCopy });
        if (!text) return null;
        const box = el('section', 'tri-genuine');
        box.setAttribute('aria-label', 'The real ones');
        const later = this.params.debriefFollows === true;
        if (text.trusted) box.appendChild(el('p', 'tri-genuine-trusted', text.trusted));
        if (text.flaggedLead && this.feedbackMode !== 'end') box.appendChild(el('p', 'tri-genuine-flagged', text.flaggedLead));
        if (text.cost && !later) box.appendChild(el('p', 'tri-genuine-cost', text.cost));
        if (text.why && !later) box.appendChild(el('p', 'tri-genuine-why', text.why));
        return box.childNodes.length ? box : null;
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
        if (this.finishBtn) {
            this.finishBtn.disabled = this.saving;
            // Say why Finish is held: the first save can take a while under load (P3 new).
            this.finishBtn.textContent = this.saving ? 'Saving…' : 'Finish';
            this.finishBtn.setAttribute('aria-busy', this.saving ? 'true' : 'false');
        }
    }

    _restart(set) {
        this._closeSheet(false);
        this._loadSet(set);
        this.stored = null;
        this.saving = false;
        this.saveFailed = false;
        this.titleEl.textContent = this._headerNoun();
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

    /**
     * Close or Esc partway through a round, with at least one answer given, asks first (N-19):
     * the round is not kept, so reopening starts it again. "Keep going" (or Esc) returns to the
     * round; "Close anyway" (or Close pressed again) leaves as before. A round with no answers
     * yet, and the Result step, close at once.
     */
    requestClose() {
        if (this.closeMode === 'abort' && !this.stored && this.answers.size > 0) {
            if (this._closeAsk) { this._dropCloseAsk(); this.abort(); return; }
            this._askClose();
            return;
        }
        super.requestClose();
    }

    _askClose() {
        const box = el('div', 'tri-close-ask');
        box.setAttribute('role', 'alertdialog');
        box.setAttribute('aria-label', 'Close this round?');
        const n = this.answers.size;
        box.appendChild(el('p', 'tri-close-ask-text',
            `Close now and the ${n === 1 ? 'answer' : `${n} answers`} you've given so far won't be kept. ` +
            'The round starts again from the first item next time.'));
        const keep = el('button', 'tri-close-keep minigame-button', 'Keep going');
        keep.type = 'button';
        const leave = el('button', 'tri-close-leave minigame-button', 'Close anyway');
        leave.type = 'button';
        this.addEventListener(keep, 'click', () => this._dropCloseAsk(true));
        this.addEventListener(leave, 'click', () => { this._dropCloseAsk(); this.abort(); });
        const row = el('div', 'tri-close-ask-actions');
        row.append(keep, leave);
        box.appendChild(row);
        (this.toolbar?.parentNode || this.container).insertBefore(box, this.toolbar?.nextSibling || null);
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
                teamTally: this.teamEl ? this.teamProtectedCount() : null,
                callClaims: [...(this.reader?.readPane?.querySelectorAll?.('.tri-call-claim') || [])]
                    .map((c) => ({ fact: c.dataset.fact, value: c.querySelector('.tri-claim-value')?.textContent || '' })),
                actionButtons: [...(this.reader?.readPane?.querySelectorAll?.('.tri-verdict, .tri-choice-option') || [])]
                    .map((b) => b.dataset.action),
                comparison: this.step === 'result' && this.comparison ? JSON.parse(JSON.stringify(this.comparison)) : null,
                // The real-items lines on the result screen (disc_visible): what is drawn, by class.
                genuine: this.step === 'result' && this.resultEl ? {
                    trusted: this.resultEl.querySelector('.tri-genuine-trusted')?.textContent || '',
                    flagged: this.resultEl.querySelector('.tri-genuine-flagged')?.textContent || '',
                    itemWhy: [...this.resultEl.querySelectorAll('.tri-item-why')].map((n) => n.textContent),
                    cost: this.resultEl.querySelector('.tri-genuine-cost')?.textContent || '',
                    why: this.resultEl.querySelector('.tri-genuine-why')?.textContent || ''
                } : null,
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
