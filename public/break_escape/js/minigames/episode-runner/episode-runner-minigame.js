// Awareness episode runner (SE design 11 N1; PHASE7_PACKETS §2.1 to §2.5, packet P7-A).
//
// The scene 'episode-runner', opened by a kiosk through systems/episode-starter.js. It
// reads social.awarenessEpisode, shows the step strip and runs the stages in order:
//
//   brief    drawn here: the brief and the scope note, then Start
//   osint    opens 'osint-browser' with the episode's siteIds (launchChild, returnTo here)
//   write    opens 'mail-client' with accountIds, defaultAccount, maxSends: 1 (returnTo here);
//            on a normal close the sent record's ids are held in the state for the flip
//   flip     drawn here with renderFlipView (P7-B); Continue clears the held ids
//   defend   opens the triage starter with the defend set; its onComplete records the round
//   check    (check missions) the same, with defend.stage ('pre' or 'post')
//   debrief  drawn here with renderDebrief (P7-B); Finish closes the runner
//
// Progress lives in the declared global episode_<id>_state (ids and numbers only), written
// through the shared writer, so a reopen from the kiosk resumes at the stage it left. A
// child that ends without a normal exit (mail closed with nothing sent, triage closed
// mid-round) leaves the stage where it was and does not reopen the runner: the kiosk does.
//
// Overlay rules (00 §6): requiresKeyboardInput, its own Close, Esc through
// SocialOverlayScene. Close and Esc are a normal exit, so they never emit minigame_failed.
//
// Test seams: params.deps may replace renderStepStrip, renderFlipView, renderDebrief,
// measure (recordTriageResult), startTriage, write (writeGlobal) and now.

import { SocialOverlayScene } from '../framework/social-overlay.js';
import { writeGlobal } from '../../systems/global-writer.js';
import { recordTriageResult } from '../../systems/awareness-measure.js';
import { resolvePlayerSent } from '../inbox-triage/triage-messages.js';
import { renderStepStrip, applyBrand } from './step-strip.js';
import { renderFlipView } from './flip-view.js';
import { renderDebrief } from './debrief-view.js';
import {
    stagesFor, stateKey, readState, completeStage, childLaunch, variantOf,
    sentFromRecord, findSentRecord, flipEntry, measurementCtx, defendSummary
} from './episode-model.js';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;

// UI chrome for the stages that open another tool. Learner-facing episode lines
// (brief, flip, debrief) come from episode.strings.
const STAGE_COPY = Object.freeze({
    osint: { heading: 'Look around', text: 'Open the browser and find out what you can about the people involved. Close it when you have what you need.', button: 'Open the browser' },
    write: { heading: 'Write', text: 'Write one message using what you found. The meter gives you hints before you send. Your first Send is final.', button: 'Open the mail client' },
    defend: { heading: 'Defend', text: 'Now you are on the receiving end. Go through the inbox and decide what to do with each message.', button: 'Open the inbox' },
    check: { heading: 'Check', text: 'Go through these messages and decide what to do with each one. Your answers are recorded.', button: 'Start' }
});
const FINISHED_TEXT = 'You have finished this exercise. You can close this window.';
const LAUNCH_FAILED = 'That did not open. Close this window and try the kiosk again.';

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

const win = () => (typeof window !== 'undefined' ? window : {});

export class EpisodeRunnerMinigame extends SocialOverlayScene {
    constructor(container, params) {
        super(container, { title: 'Exercise', ...(params || {}) });
        this.deps = {
            renderStepStrip, renderFlipView, renderDebrief,
            measure: recordTriageResult,
            startTriage: (lockable, options) => win().startInboxTriageMinigame?.(lockable, options) ?? null,
            write: writeGlobal,
            now: () => Date.now(),
            ...(isObj(this.params.deps) ? this.params.deps : {})
        };
        this.strip = null;
        this.view = null;
        this.state = null;
    }

    // ── data ─────────────────────────────────────────────────────────────────

    get episode() {
        return isObj(this.params.episode) ? this.params.episode : (win().gameScenario?.social?.awarenessEpisode || {});
    }

    get social() {
        return this.params.social || win().gameScenario?.social || {};
    }

    get globals() {
        return this.params.globals || win().gameState?.globalVariables || null;
    }

    get mailState() {
        return this.params.mailState || win().mailState || {};
    }

    get strings() {
        return isObj(this.episode.strings) ? this.episode.strings : {};
    }

    get defendSet() {
        const id = this.episode.defend?.setId;
        const sets = Array.isArray(this.social.triageSets) ? this.social.triageSets : [];
        return sets.find((s) => isObj(s) && s.id === id) || null;
    }

    /** The stored state, read fresh: a child may have advanced it while the runner was closed. */
    _readState() {
        const g = this.globals;
        const key = stateKey(this.episode.id);
        const raw = g && isObj(g[key]) ? g[key] : this.params.state;
        return readState(this.episode, raw);
    }

    _saveState(state) {
        this.state = state;
        const key = stateKey(this.episode.id);
        try {
            this.deps.write(key, state, { openChat: false });
        } catch (e) {
            console.error('[episode] could not write the state global:', e);
        }
        win().stateSync?.sync?.();
    }

    // ── lifecycle ────────────────────────────────────────────────────────────

    init() {
        super.init();
        if (this.headerElement) this.headerElement.style.display = 'none';
        const root = el('div', 'er-root');
        root.setAttribute('role', 'region');
        root.setAttribute('aria-label', 'Exercise');
        applyBrand(root, this.episode.brand);
        this.root = root;

        const bar = el('div', 'er-bar');
        this.stripHost = el('div', 'er-strip');
        bar.appendChild(this.stripHost);
        this.mountCloseControl(bar, 'Close');
        root.appendChild(bar);

        this.body = el('div', 'er-body');
        root.appendChild(this.body);
        this.gameContainer.appendChild(root);

        this.state = this._readState();
        this.strip = this.deps.renderStepStrip(this.stripHost, {
            stages: stagesFor(this.episode), current: this.state.stage, done: this.state.done,
            brand: this.episode.brand
        });
        this._render();
    }

    start() {
        super.start();
        this._focus();
    }

    cleanup() {
        this._destroyView();
        this.strip?.destroy?.();
        this.strip = null;
        super.cleanup();
    }

    _destroyView() {
        try { this.view?.destroy?.(); } catch (e) { console.warn('[episode] view destroy failed:', e); }
        this.view = null;
        if (this.body) this.body.textContent = '';
    }

    _focus() {
        const target = this.body?.querySelector?.('h2, .aw-heading, button');
        try { target?.focus?.(); } catch (e) { /* focus is a nicety */ }
    }

    // ── stages ───────────────────────────────────────────────────────────────

    _render() {
        this._destroyView();
        const stage = this.state.stage;
        this.strip?.update?.({ current: stage, done: this.state.done });
        if (stage === 'brief') this._renderBrief();
        else if (stage === 'flip') this._renderFlip();
        else if (stage === 'debrief') this._renderDebrief();
        else if (stage && STAGE_COPY[stage]) this._renderLaunch(stage);
        else this._renderFinished();
    }

    _panel(heading, text) {
        const panel = el('section', 'er-panel');
        const h = el('h2', 'er-heading aw-heading', heading);
        h.tabIndex = -1;
        panel.appendChild(h);
        if (isStr(text)) panel.appendChild(el('p', 'er-text', text));
        this.body.appendChild(panel);
        return panel;
    }

    _button(panel, label, onClick, cls = '') {
        const btn = el('button', `er-button aw-button ${cls}`.trim(), label);
        btn.type = 'button';
        this.addEventListener(btn, 'click', (e) => {
            e.preventDefault?.();
            onClick();
        });
        panel.appendChild(btn);
        return btn;
    }

    _renderBrief() {
        const ep = this.episode;
        const panel = this._panel(ep.brand?.name || this.params.title || 'Brief', this.strings.brief);
        if (isStr(ep.scopeNote)) panel.appendChild(el('p', 'er-scope', ep.scopeNote));
        this._button(panel, 'Start', () => this._complete('brief'), 'er-start');
    }

    _renderLaunch(stage) {
        const copy = STAGE_COPY[stage];
        const panel = this._panel(copy.heading, copy.text);
        this.notice = el('p', 'er-notice');
        this.notice.setAttribute('aria-live', 'polite');
        panel.appendChild(this.notice);
        this._button(panel, copy.button, () => this._launch(stage), 'er-launch');
    }

    _flipMessage() {
        if (!this.state.sent) return null;
        const set = this.defendSet;
        try {
            const out = resolvePlayerSent(flipEntry(this.episode, set), set, this.mailState, this.social,
                { globals: this.globals || {} });
            return out?.message || null;
        } catch (e) {
            console.error('[episode] could not rebuild the sent message:', e);
            return null;
        }
    }

    _renderFlip() {
        this.view = this.deps.renderFlipView(this.body, {
            message: this._flipMessage(),
            strings: this.strings,
            onContinue: () => this._complete('flip')
        });
    }

    _renderDebrief() {
        const stored = this.state.defend || {};
        const result = isObj(this.params.triageResult) ? this.params.triageResult : { ...stored, answers: [] };
        this.view = this.deps.renderDebrief(this.body, {
            result,
            set: this.defendSet,
            strings: this.strings,
            variant: variantOf(this.episode),
            onFinish: () => {
                this._complete('debrief');
                this.close();
            }
        });
    }

    _renderFinished() {
        const panel = this._panel('Finished', FINISHED_TEXT);
        this._button(panel, 'Close', () => this.close(), 'er-finish');
    }

    _complete(stageId, patch = {}) {
        this._saveState(completeStage(this.episode, this._readState(), stageId, patch));
        if (this.gameState.isActive) {
            this._render();
            this._focus();
        }
    }

    // ── child launches (§2.3) ────────────────────────────────────────────────

    _launch(stage) {
        const spec = childLaunch(this.episode, stage);
        if (!spec) return;
        let child = null;
        if (spec.kind === 'osint') {
            child = this.launchChild(spec.sceneType, {
                ...spec.params,
                onComplete: (success, result) => {
                    if (isNormal(success, result)) this._completeWhileAway('osint');
                }
            });
        } else if (spec.kind === 'mail') {
            const target = this.episode.attack?.target ?? null;
            child = this.launchChild(spec.sceneType, {
                ...spec.params,
                onComplete: (success, result) => {
                    if (!isNormal(success, result)) return; // nothing sent: stay on write
                    const rec = findSentRecord(this.mailState, target, result?.sentIds);
                    this._completeWhileAway('write', { sent: sentFromRecord(rec, target) });
                }
            });
        } else if (spec.kind === 'triage') {
            child = this._launchTriage(stage, spec.options);
        }
        if (!child && this.gameState.isActive && this.notice) this.notice.textContent = LAUNCH_FAILED;
    }

    /** A child's onComplete runs after this overlay has closed: save from the stored state. */
    _completeWhileAway(stageId, patch = {}) {
        this._saveState(completeStage(this.episode, this._readState(), stageId, patch));
    }

    /** The params this runner reopens with. */
    _reopenParams(extra = {}) {
        const { suspended, triageResult, resume, ...base } = this.params;
        return { ...base, ...extra, resume: true, suspended: false };
    }

    returnParams() {
        return { resume: true, triageResult: null };
    }

    /**
     * The triage starter opens its own overlay; the runner steps aside as a suspended
     * parent (no onComplete of its own) and reopens itself from the triage onComplete.
     */
    _launchTriage(stage, options) {
        const holder = { launched: null };
        const reopenBase = this._reopenParams();
        const episode = this.episode;
        const set = this.defendSet;
        this.params.suspended = true;
        let launched = null;
        try {
            launched = this.deps.startTriage(null, {
                ...options,
                onComplete: (success, result) => this._triageDone(stage, options, holder, reopenBase, episode, set, success, result)
            });
        } catch (e) {
            console.error('[episode] the triage starter failed:', e);
        }
        holder.launched = launched;
        if (!launched) this.params.suspended = false;
        return launched;
    }

    _triageDone(stage, options, holder, reopenBase, episode, set, success, result) {
        if (!isNormal(success, result)) return; // closed mid-round: the stage stays
        const readOnly = holder.launched?.readOnly === true || result?.reopened === true;
        if (!readOnly) {
            try {
                this.deps.measure(result, measurementCtx(episode, set, options.stage || null, this.deps.now()));
            } catch (e) {
                console.error('[episode] recording the round failed:', e);
            }
        }
        const state = completeStage(episode, this._readState(), stage, { defend: defendSummary(result) });
        this._saveState(state);
        if (!state.stage) return; // a check mission ends with the triage result screen
        const fw = win().MinigameFramework;
        if (!fw?.startMinigame) return;
        fw.startMinigame('episode-runner', null, { ...reopenBase, triageResult: result });
    }

    // ── exit and test bridge ─────────────────────────────────────────────────

    closeResult() {
        return { episodeId: this.episode.id ?? null, stage: this.state?.stage ?? null, done: [...(this.state?.done || [])] };
    }

    getTestState() {
        const s = this.state || this._readState();
        return {
            ...super.getTestState(),
            episode: {
                id: this.episode.id ?? null,
                variant: variantOf(this.episode),
                stage: s.stage,
                done: [...s.done],
                sentHeld: !!s.sent
            }
        };
    }
}

function isNormal(success, result) {
    return success === true && !(result && result.aborted === true);
}

export default EpisodeRunnerMinigame;
