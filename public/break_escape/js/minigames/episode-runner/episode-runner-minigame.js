// Awareness episode runner (SE design 11 N1; PHASE7_PACKETS §2.1 to §2.5, packet P7-A).
//
// The scene 'episode-runner', opened by a kiosk through systems/episode-starter.js. It
// reads social.awarenessEpisode, shows the step strip and runs the stages in order:
//
//   brief    drawn here: the brief and the scope note, then Start
//   osint    opens 'osint-browser' with the episode's siteIds (launchChild, returnTo here)
//   build    (E5) opens 'landing-page-builder' with attack.landingPageId and attack.target
//   write    mail: opens 'mail-client' with accountIds, defaultAccount, maxSends: 1 (returnTo
//            here); on a normal close the sent record's ids are held in the state for the flip.
//            call (E3, attack.callId set): opens 'pretext-prep' with the callId. Its Begin hands
//            over to the phone chat, which never returns here, so the runner watches for the
//            call's outcome global (pretext_<callId>_outcome), holds { kind: 'call', callId,
//            outcome } for the flip and reopens itself once the chat has closed. A reopen
//            from the kiosk after a reload finds the outcome set and moves on the same way.
//   mfa      (E3) opens 'authenticator' with episode.mfa { pushes, approvesAt, mode }
//   flip     drawn here with renderFlipView (P7-B): the sent email, the built page (E5) or the
//            call (E3); flipMissed when something went but did not land. Continue clears the
//            held ids
//   defend   opens the triage starter with the defend set (role-swap calls merged in, 11 N15)
//            and the awareness skin; its onComplete records the round. The panel line is
//            strings.defendIntro, else a default that fits the set (messages, pages or calls)
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
// Facilitated mode (11 N5, §5.3; packet P7-I), when episode.facilitated is true:
//   - each stage panel shows the group prompt strings.facilitator[<stage id>];
//   - the debrief on the shared screen hides the per-learner score (the round percent, the
//     headline and each card's score); the triage round itself is done individually;
//   - after each stage but the last, a pause panel (strings.facilitator.pause, then the
//     finished stage's prompt again) waits for Continue before the next stage. The pause
//     is held in memory only (a child's return or the triage reopen carries pauseAfter),
//     so a reopen from the kiosk goes straight to the stage.
//
// Test seams: params.deps may replace renderStepStrip, renderFlipView, renderDebrief,
// measure (recordTriageResult), startTriage, write (writeGlobal), now, schedule and
// clearScheduled (the call watcher's timer).

import { SocialOverlayScene, socialOverlayParams } from '../framework/social-overlay.js';
import { writeGlobal } from '../../systems/global-writer.js';
import { recordTriageResult } from '../../systems/awareness-measure.js';
import { resolvePlayerSent } from '../inbox-triage/triage-messages.js';
import { renderStepStrip, applyBrand } from './step-strip.js';
import { renderFlipView } from './flip-view.js';
import { renderDebrief } from './debrief-view.js';
import { episodeDefendSet } from './role-swap.js';
import {
    stagesFor, stateKey, readState, completeStage, childLaunch, variantOf,
    sentFromRecord, findSentRecord, flipEntry, measurementCtx, defendSummary,
    writeKind, sentFromCall, callOutcomeKey, flipPage, flipCall
} from './episode-model.js';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;

// UI chrome for the stages that open another tool. Learner-facing episode lines
// (brief, flip, debrief) come from episode.strings.
const STAGE_COPY = Object.freeze({
    osint: { heading: 'Look around', text: 'Open the browser and find out what you can about the people involved. Close it when you have what you need.', button: 'Open the browser' },
    build: { heading: 'Build', text: 'Build the page your message will link to. Close the builder when the page is ready.', button: 'Open the page builder' },
    write: { heading: 'Write', text: 'Write one message using what you found. The meter gives you hints before you send. Your first Send is final.', button: 'Open the mail client' },
    mfa: { heading: 'Sign-in prompts', text: 'You have the password. Watch what happens on the target\u2019s phone when the sign-in prompts keep coming. Close it when you have seen enough.', button: 'Open the phone' },
    defend: { heading: 'Defend', text: 'Now you are on the receiving end. Go through the inbox and decide what to do with each message.', button: 'Open the inbox' },
    check: { heading: 'Check', text: 'Go through these messages and decide what to do with each one. Your answers are recorded.', button: 'Start' }
});
// The write stage when the attack is a pretext call (E3).
const CALL_COPY = Object.freeze({ heading: 'Make the call', text: 'Prepare your call using what you found, then ring through. Once you hang up, you come back here.', button: 'Prepare the call' });
// The defend stage of a defendOnly run: there was no attack stage to turn round from.
const DEFEND_ONLY_COPY = Object.freeze({ heading: 'Defend', text: 'Go through the inbox and decide what to do with each message. Take your time: there is no trick to it, just the habits that catch these.', button: 'Open the inbox' });
// The defend stage when the round is calls the learner takes (11 N15, the role swap).
const ROLE_SWAP_COPY = Object.freeze({ heading: 'Take the calls', text: 'Now you are in the seat you just called. Take each call and decide what to do with it.', button: 'Open the queue' });
const ROLE_SWAP_DEFEND_ONLY_COPY = Object.freeze({ heading: 'Take the calls', text: 'You are on the service desk. Take each call and decide what to do with it.', button: 'Open the queue' });
// The defend stage when the round is mostly sign-in pages (E5).
const PAGES_COPY = Object.freeze({ heading: 'Defend', text: 'Now you are the one following the links. Look at each page and decide what to do with it.', button: 'Open the pages' });
const PAGES_DEFEND_ONLY_COPY = Object.freeze({ heading: 'Defend', text: 'Look at each page and decide what to do with it. Take your time: there is no trick to it, just the habits that catch these.', button: 'Open the pages' });
const FINISHED_TEXT = 'You have finished this exercise. You can close this window.';
const CALL_WAIT_MS = 300;                 // how often the call watcher looks for the chat closing
const CALL_WAIT_LIMIT = 4 * 60 * 60 * 1000 / CALL_WAIT_MS; // gives up after four hours (a reopen still resumes)
const LAUNCH_FAILED = 'That did not open. Close this window and try the kiosk again.';
const PAUSE_COPY = Object.freeze({
    heading: 'Pause',
    text: 'Stop here and talk it over as a group before the next step.',
    prompt: 'For the group:',
    next: 'Next step'
});

/** The facilitator's prompt for a stage (strings.facilitator[stage]), or null. */
export function facilitatorPrompt(strings, key) {
    const f = isObj(strings?.facilitator) ? strings.facilitator : null;
    return f && isStr(f[key]) ? f[key] : null;
}

/**
 * What the defend round is: 'calls', 'pages' or 'messages' (the default). An episode with
 * defend.calls is the role swap, so 'calls' whatever else the set holds. Otherwise the most
 * common of call, page and everything else in the set, with a tie read as 'messages'.
 */
export function defendSetKind(set, episode) {
    if (Array.isArray(episode?.defend?.calls) && episode.defend.calls.length) return 'calls';
    const list = Array.isArray(set?.messages) ? set.messages.filter(isObj) : [];
    let calls = 0, pages = 0;
    for (const m of list) {
        if (m.kind === 'call') calls++;
        else if (m.kind === 'page') pages++;
    }
    const other = list.length - calls - pages;
    if (calls > pages && calls > other) return 'calls';
    if (pages > calls && pages > other) return 'pages';
    return 'messages';
}

/**
 * The defend stage's panel copy. The heading and button fit the set; the line is
 * strings.defendIntro when the episode sets it, else the default for the set and variant.
 */
export function defendCopy(episode, set) {
    const defendOnly = variantOf(episode) === 'defendOnly';
    const kind = defendSetKind(set, episode);
    let copy;
    if (kind === 'calls') copy = defendOnly ? ROLE_SWAP_DEFEND_ONLY_COPY : ROLE_SWAP_COPY;
    else if (kind === 'pages') copy = defendOnly ? PAGES_DEFEND_ONLY_COPY : PAGES_COPY;
    else copy = defendOnly ? DEFEND_ONLY_COPY : STAGE_COPY.defend;
    const intro = isObj(episode?.strings) ? episode.strings.defendIntro : null;
    return isStr(intro) ? { ...copy, text: intro } : copy;
}

/** The triage result as the shared screen shows it in facilitated mode: no per-learner score. */
export function hideScore(result) {
    if (!isObj(result)) return result;
    const { percent, headline, pass, ...rest } = result;
    if (Array.isArray(rest.answers)) {
        rest.answers = rest.answers.map((a) => {
            if (!isObj(a)) return a;
            const { score, ...keep } = a;
            return keep;
        });
    }
    return rest;
}

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
            schedule: (fn, ms) => setTimeout(fn, ms),
            clearScheduled: (h) => clearTimeout(h),
            ...(isObj(this.params.deps) ? this.params.deps : {})
        };
        this.strip = null;
        this.view = null;
        this.state = null;
        this.pauseAfter = null;
        this._launching = null;
    }

    /** 11 N5: a facilitated (workshop) run. */
    get facilitated() {
        return this.episode.facilitated === true;
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

    /** The defend set, with the role swap's calls (defend.calls) merged in first (11 N15). */
    get defendSet() {
        return episodeDefendSet(this.episode, this.social);
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
        if (this.facilitated) root.classList.add('er-facilitated');
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
        this._settleCall();
        // A pause carried back by a child's return or the triage reopen; only for a stage
        // that is done, and never once the episode has finished.
        const after = this.params.pauseAfter;
        this.pauseAfter = this.facilitated && isStr(after) && this.state.stage && this.state.done.includes(after)
            ? after : null;
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
        if (this.pauseAfter && stage) this._renderPause();
        else if (stage === 'brief') this._renderBrief();
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

    /** The facilitator's prompt for a stage, as an aside, in facilitated mode only. */
    _groupPrompt(host, stage) {
        if (!this.facilitated || !host) return null;
        const prompt = facilitatorPrompt(this.strings, stage);
        if (!prompt) return null;
        const aside = el('aside', 'er-facilitator');
        aside.setAttribute('aria-label', 'Prompt for the group');
        aside.append(el('span', 'er-facilitator-label', PAUSE_COPY.prompt), el('span', 'er-facilitator-text', prompt));
        return aside;
    }

    _renderPause() {
        const after = this.pauseAfter;
        const panel = this._panel(PAUSE_COPY.heading, facilitatorPrompt(this.strings, 'pause') || PAUSE_COPY.text);
        panel.classList.add('er-pause');
        const prompt = this._groupPrompt(panel, after);
        if (prompt) panel.appendChild(prompt);
        this._button(panel, PAUSE_COPY.next, () => {
            this.pauseAfter = null;
            this._render();
            this._focus();
        }, 'er-resume');
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
        const prompt = this._groupPrompt(panel, 'brief');
        if (prompt) panel.appendChild(prompt);
        this._button(panel, 'Start', () => this._complete('brief'), 'er-start');
    }

    /** The panel copy for a stage that opens another tool. */
    _stageCopy(stage) {
        if (stage === 'write' && writeKind(this.episode) === 'call') return CALL_COPY;
        if (stage === 'defend') {
            let set = null;
            try { set = this.defendSet; } catch (e) { console.warn('[episode] could not read the defend set:', e); }
            return defendCopy(this.episode, set);
        }
        return STAGE_COPY[stage];
    }

    _renderLaunch(stage) {
        const copy = this._stageCopy(stage);
        const panel = this._panel(copy.heading, copy.text);
        const prompt = this._groupPrompt(panel, stage);
        if (prompt) panel.appendChild(prompt);
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

    /**
     * What the flip shows: the sent email, the built page (E5) and the call (E3). `missed`
     * is true when something went but there is nothing to replay: a mail record with no
     * tells, or a call that did not land.
     */
    _flipProps() {
        const sent = this.state.sent;
        const globals = this.globals || {};
        if (sent?.kind === 'call') {
            const call = flipCall(this.episode, this.social, sent, globals);
            return { message: null, page: null, call, missed: !call };
        }
        const message = this._flipMessage();
        let page = null;
        try { page = flipPage(this.episode, this.social, globals); } catch (e) { console.error('[episode] could not rebuild the page:', e); }
        const missed = !message && !page && !!sent?.recordId;
        return { message, page, call: null, missed };
    }

    _renderFlip() {
        this.view = this.deps.renderFlipView(this.body, {
            ...this._flipProps(),
            strings: this.strings,
            onContinue: () => this._complete('flip')
        });
        this._prependPrompt('flip');
    }

    /** Above a P7-B view, the stage's group prompt (facilitated mode). */
    _prependPrompt(stage) {
        const prompt = this._groupPrompt(this.body, stage);
        if (prompt) this.body.insertBefore(prompt, this.body.firstChild);
    }

    _renderDebrief() {
        const stored = this.state.defend || {};
        const raw = isObj(this.params.triageResult) ? this.params.triageResult : { ...stored, answers: [] };
        const result = this.facilitated ? hideScore(raw) : raw;
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
        this._prependPrompt('debrief');
    }

    /** The bar's Close is the only Close: the panel says it is finished and nothing more. */
    _renderFinished() {
        const panel = this._panel('Finished', FINISHED_TEXT);
        panel.classList.add('er-finished');
    }

    _complete(stageId, patch = {}) {
        this._saveState(completeStage(this.episode, this._readState(), stageId, patch));
        this.pauseAfter = this.facilitated && this.state.stage ? stageId : null;
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
        this._launching = stage; // read by returnParams() while launchChild builds returnTo
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
        } else if (spec.kind === 'build') {
            child = this.launchChild(spec.sceneType, socialOverlayParams({
                ...spec.params,
                onComplete: (success, result) => {
                    if (isNormal(success, result)) this._completeWhileAway('build');
                }
            }));
        } else if (spec.kind === 'mfa') {
            child = this.launchChild(spec.sceneType, socialOverlayParams({
                ...spec.params,
                onComplete: (success, result) => {
                    if (isNormal(success, result)) this._completeWhileAway('mfa');
                }
            }));
        } else if (spec.kind === 'call') {
            child = this._launchCall(spec.params);
        } else if (spec.kind === 'triage') {
            child = this._launchTriage(stage, spec.options);
        }
        this._launching = null;
        if (!child && this.gameState.isActive && this.notice) this.notice.textContent = LAUNCH_FAILED;
    }

    // ── the pretext call (E3) ────────────────────────────────────────────────

    get _callId() {
        return writeKind(this.episode) === 'call' ? this.episode.attack.callId : null;
    }

    _callOutcome() {
        const id = this._callId;
        const v = id ? this.globals?.[callOutcomeKey(id)] : null;
        return isStr(v) ? v : null;
    }

    /** On a reopen at the call's write stage with its outcome set, the call is over: move on. */
    _settleCall() {
        if (this.state.stage !== 'write' || !this._callId) return;
        const outcome = this._callOutcome();
        if (!outcome) return;
        stopCallWatch(this.episode.id);
        const next = completeStage(this.episode, this.state, 'write', { sent: sentFromCall(this._callId, outcome) });
        this._saveState(next);
        this.pauseAfter = null;
    }

    /**
     * Open pretext-prep for the episode's call. A Close on the prep card returns here with the
     * stage unchanged. Begin replaces the prep with the phone chat, which has no way back, so
     * a watcher waits for the outcome global and for every overlay to close, then holds the
     * call for the flip and reopens the runner.
     */
    _launchCall(params) {
        const callId = params.callId;
        const spec = (Array.isArray(this.social.pretextNpcs) ? this.social.pretextNpcs : [])
            .find((c) => isObj(c) && c.callId === callId) || null;
        if (!spec) {
            console.error(`[episode] attack.callId "${callId}" is not a social.pretextNpcs callId`);
            return null;
        }
        const character = spec.character ?? null;
        const svc = win().socialInfluence;
        const cfg = svc?.getCharacterConfig?.(character) || this.social.characters?.[character] || {};
        const npcId = cfg?.channels?.phone || cfg?.channels?.person || null;
        const before = this._callOutcome();
        const reopen = this._reopenParams();
        const child = this.launchChild('pretext-prep', socialOverlayParams({ callId, character, npcId }));
        if (child) {
            watchCall({
                episode: this.episode, callId, before, reopen,
                globals: () => this.params.globals || win().gameState?.globalVariables || null,
                save: (state) => { this.deps.write(stateKey(this.episode.id), state, { openChat: false }); win().stateSync?.sync?.(); },
                schedule: this.deps.schedule, clearScheduled: this.deps.clearScheduled
            });
        }
        return child;
    }

    /** A child's onComplete runs after this overlay has closed: save from the stored state. */
    _completeWhileAway(stageId, patch = {}) {
        this._saveState(completeStage(this.episode, this._readState(), stageId, patch));
    }

    /** The params this runner reopens with. */
    _reopenParams(extra = {}) {
        const { suspended, triageResult, resume, pauseAfter, ...base } = this.params;
        return { ...base, ...extra, resume: true, suspended: false };
    }

    /** A child's return is a normal exit, so its stage is done: pause after it when facilitated. */
    returnParams() {
        return { resume: true, triageResult: null, pauseAfter: this.facilitated ? this._launching : null };
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
                // The merged set (11 N15) and the awareness skin (the Report animation)
                ...(set ? { set } : {}),
                skin: 'awareness',
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
        fw.startMinigame('episode-runner', null, {
            ...reopenBase, triageResult: result, pauseAfter: episode.facilitated === true ? stage : null
        });
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
                sentHeld: !!s.sent,
                facilitated: this.facilitated,
                paused: !!(this.pauseAfter && s.stage)
            }
        };
    }
}

// ── the call watcher (module level: the runner is closed while the call runs) ─────

const callWatches = new Map(); // episode id -> { stop }

export function stopCallWatch(episodeId) {
    callWatches.get(episodeId)?.stop?.();
    callWatches.delete(episodeId);
}

/**
 * Wait for the pretext call to end. Heard: the outcome global changed (the change event) or
 * holds a value it did not hold at launch. Then, once no overlay is open (the chat and its
 * debrief have closed), write the write stage done with the call held, and reopen the runner.
 * If the runner is open again first (the prep card was closed), the watch ends. Exposed for
 * the tests.
 */
export function watchCall({ episode, callId, before = null, reopen = {}, globals, save, schedule, clearScheduled }) {
    stopCallWatch(episode.id);
    const w = win();
    const key = callOutcomeKey(callId);
    const eventName = `global_variable_changed:${key}`;
    let heard = false;
    let timer = null;
    let ticks = 0;
    const onEvent = () => { heard = true; };
    const stop = () => {
        if (timer !== null) clearScheduled?.(timer);
        timer = null;
        try { w.eventDispatcher?.off?.(eventName, onEvent); } catch (e) { /* no dispatcher */ }
    };
    try { w.eventDispatcher?.on?.(eventName, onEvent); } catch (e) { /* no dispatcher */ }
    const tick = () => {
        timer = null;
        const fw = w.MinigameFramework;
        const current = fw?.currentMinigame || null;
        if (current && current._sceneType === 'episode-runner') { stopCallWatch(episode.id); return; }
        const g = globals() || {};
        const outcome = isStr(g[key]) ? g[key] : null;
        const ended = outcome && (heard || outcome !== before);
        if (ended && !current) {
            stopCallWatch(episode.id);
            const state = completeStage(episode, readState(episode, g[stateKey(episode.id)]), 'write',
                { sent: sentFromCall(callId, outcome) });
            save(state);
            fw?.startMinigame?.('episode-runner', null, {
                ...reopen,
                pauseAfter: episode.facilitated === true ? 'write' : null
            });
            return;
        }
        if (++ticks > CALL_WAIT_LIMIT) { stopCallWatch(episode.id); return; }
        timer = schedule(tick, CALL_WAIT_MS);
    };
    callWatches.set(episode.id, { stop, tick });
    timer = schedule(tick, CALL_WAIT_MS);
    return { stop: () => stopCallWatch(episode.id), tick };
}

function isNormal(success, result) {
    return success === true && !(result && result.aborted === true);
}

export default EpisodeRunnerMinigame;
