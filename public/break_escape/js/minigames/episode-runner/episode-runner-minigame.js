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
//   guess    (E9, ENG-02) opens 'password-guesser' with episode.guess: an authored guess list stepped
//            through for one colleague. The scene writes guess.landedGlobal when an account opens; the
//            flip shows the victim's seat (flipAftermath) only when that global is true
//   mistake  (consequence episodes, ENG-04) opens 'consequence-sandbox' with episode.mistake; the
//            beat choices are held in the state for the montage flip (flip.mode "montage")
//   flip     drawn here with renderFlipView (P7-B): the sent email, the built page (E5) or the
//            call (E3); flipMissed when something went but did not land. Continue clears the
//            held ids
//   defend   opens the triage starter with the defend set (role-swap calls merged in, 11 N15)
//            and the awareness skin; its onComplete records the round. The panel line is
//            strings.defendIntro, else a default; the heading and button fit the set
//            (messages, pages, calls, phone or voice)
//   check    (check missions) the same, with defend.stage ('pre' or 'post')
//   debrief  drawn here with renderDebrief (P7-B); Finish shows the "Episode finished" panel, and the kiosk X closes the runner
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
// Step-away panel (EC1, living office), when episode.stepAway is true on a full episode:
//   - the triage reopen carries stepAwayAfter: 'defend' (memory only, like pauseAfter), and the
//     runner shows the panel in place of the debrief: Look up closes the runner and emits
//     episode_step_away once; Carry on renders the debrief. Each stores stepAwayPicked (one
//     boolean, once), so until one is picked a reopen or a reload shows the panel again, and
//     after that it resumes at the debrief; the stage still says debrief either way;
//   - Look up is enabled only while kit_defend_done is true (read at render, then on its change
//     event), so after a failed save only Carry on can be used;
//   - a facilitated run shows Look up on the pause after the defend stage instead;
//   - closing the debrief by any route marks it seen (debriefSeen, once), which releases the
//     success screen's hold (systems/episode-starter.js).
//
// Test seams: params.deps may replace renderStepStrip, renderFlipView, renderDebrief,
// measure (recordTriageResult), startTriage, reemitDone (reemitTriageComplete), write (writeGlobal), now, schedule and
// clearScheduled (the call watcher's timer).

import { SocialOverlayScene, socialOverlayParams } from '../framework/social-overlay.js';
import { writeGlobal } from '../../systems/global-writer.js';
import { recordTriageResult } from '../../systems/awareness-measure.js';
import { resolvePlayerSent, plainSentMessage, buildTriageMessages } from '../inbox-triage/triage-messages.js';
import { scoreTriage, bandFor } from '../inbox-triage/triage-scoring.js';
import { awarenessWeakestLineFor } from '../inbox-triage/triage-kinds.js';
import { renderStepStrip, applyBrand } from './step-strip.js';
import { renderFlipView } from './flip-view.js';
import { renderDebrief } from './debrief-view.js';
import { episodeDefendSet } from './role-swap.js';
import {
    stagesFor, stateKey, readState, completeStage, childLaunch, variantOf,
    sentFromRecord, findSentRecord, flipEntry, measurementCtx, defendSummary,
    writeKind, worldFor, sentFromCall, callOutcomeKey, flipPage, flipCall, CALL_LANDED,
    awarenessSettings, reportRouteFor, flipAftermathFor, isMontage, montageProps, guessLanded, sandboxRecap,
    drillPending, drillLaunchCopy, drillLaunchParams, drillRecord,
    concernPending, concernLaunchCopy, concernLaunchParams, concernRecord, concernRecap,
    privacyPending, privacyLaunchCopy, privacyLaunchParams, privacyRecord,
    stepAwayOn, STEP_AWAY_READY_GLOBAL, STEP_AWAY_EVENT, defendPrefix,
    stepAwayBeats, postDefendBeat, stageFollowing, RESUME_GRACE_MS
} from './episode-model.js';

/**
 * A pretext call that did not land (reported or walked away) means the attacker never got
 * the password, so the MFA-fatigue stage ("You have the password…") must not follow it
 * (E3-1). When the write stage just closed on such a call and the next stage is mfa, mark
 * mfa done too so the runner moves straight to the flip, which shows the missed attempt.
 */
function skipMfaIfUnlanded(episode, state, outcome) {
    if (outcome === CALL_LANDED || state.stage !== 'mfa') return state;
    return completeStage(episode, state, 'mfa');
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;

// UI chrome for the stages that open another tool. Learner-facing episode lines
// (brief, flip, debrief) come from episode.strings.
const STAGE_COPY = Object.freeze({
    osint: { heading: 'Look around', text: 'Open the browser and find out what you can about the people involved. Close it when you have what you need.', button: 'Open the browser' },
    build: { heading: 'Build', text: 'Build the page your message will link to. Close the builder when the page is ready.', button: 'Open the page builder' },
    write: { heading: 'Write', text: 'Write one message using what you found. The meter gives you hints before you send. Your first Send is final.', button: 'Open the mail client' },
    mfa: { heading: 'Sign-in prompts', text: 'You have the password, but the account still wants a tap on the target\u2019s phone. Choose when to fire the sign-in prompts and how many, then see what happens. Close it when you have seen enough.', button: 'Open the phone' },
    guess: { heading: 'Guess list', text: 'Step a made-up guesser through one colleague\u2019s guess list, built from what you found. Nothing real is typed and nothing here is a real password.', button: 'Open the guesser' },
    mistake: { heading: 'Everyday choices', text: 'Work through a few ordinary choices from a normal day. They are not scored, but the debrief comes back to any worth a second look, so choose what you would really do.', button: 'Make the choices' },
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
// The defend stage when the round is mostly texts, QR notices and sign-in prompts on a work phone (E6).
const PHONE_COPY = Object.freeze({ heading: 'Defend', text: 'Now it lands on your phone. Go through the texts and notices and decide what to do with each one.', button: 'Open the phone' });
const PHONE_DEFEND_ONLY_COPY = Object.freeze({ heading: 'Defend', text: 'Go through the phone and decide what to do with each text and notice. Take your time: there is no trick to it, just the habits that catch these.', button: 'Open the phone' });
// The defend stage when the round is mostly voicemails (E7).
const VOICE_COPY = Object.freeze({ heading: 'Defend', text: 'Now you are the one picking up the messages. Go through the voicemails and decide what to do with each one.', button: 'Open the voicemail' });
const VOICE_DEFEND_ONLY_COPY = Object.freeze({ heading: 'Defend', text: 'Go through the voicemails and decide what to do with each one. Take your time: there is no trick to it, just the habits that catch these.', button: 'Open the voicemail' });
// Message kinds read as a work phone (11 E6; push is the authenticator prompt).
const PHONE_KINDS = new Set(['sms', 'qr', 'push']);
const FINISHED_TEXT = 'You have finished this exercise. You can close this window.';
// batch-13 item 4 (E17 C4 N1): a short send-off under the "Episode finished" panel, shown only
// straight after the debrief's Finish (not on a reopen). strings.sendOff replaces it; '' drops it.
const SEND_OFF_TEXT = 'Thanks for working through this one. Take the habit with you: if something seems off, stop and check before you act.';
// ENG-10: the once-per-learner finished line (strings.alreadySeen), and the multi-card brief's
// button defaults (strings.briefDone). Card copy and the done global are data.
const ALREADY_SEEN_TEXT = 'You have seen this already. You can close this window.';
// D263: the kiosk's close hint beside the X (strings.closeHint; '' drops it), and the finished
// panel's "read the debrief again" button (strings.rereadLink).
const CLOSE_HINT_TEXT = 'Close with X';
const REREAD_TEXT = 'Read the debrief again';
const BRIEF_COPY = Object.freeze({ next: 'Next', back: 'Back', done: 'Got it' });
const CALL_WAIT_MS = 300;                 // how often the call watcher looks for the chat closing
const CALL_WAIT_LIMIT = 4 * 60 * 60 * 1000 / CALL_WAIT_MS; // gives up after four hours (a reopen still resumes)
const LAUNCH_FAILED = 'That did not open. Close this window and try the kiosk again.';
// EC1: the step-away panel's chrome. strings.stepAway / strings.stepAwayHeading replace the
// heading and line (the end-to-end shells give their own time).
const STEP_AWAY_COPY = Object.freeze({
    heading: 'Before the debrief',
    text: 'Look up from the kiosk to see how a case like this plays out here. It takes about 20 seconds, and your place is saved.',
    lookUp: 'Look up',
    carryOn: 'Carry on',
    wait: 'Look up is ready once your result has saved.'
});
// E3: copy for a beat that is not the post-defend one (strings.<prefix>, <prefix>Heading and <prefix>Waiting replace it).
const BEAT_COPY = Object.freeze({
    heading: 'Look up from the kiosk',
    text: 'Something is happening in the room that you can see for yourself. Look up, or carry on here. Your place is saved.',
    waiting: 'Still out there. Carry on whenever you like.',
    carryOn: 'Carry on'
});
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
 * What the defend round is: 'calls', 'pages', 'phone', 'voice' or 'messages' (the default).
 * An episode with defend.calls is the role swap, so 'calls' whatever else the set holds.
 * Otherwise the most common group in the set: call; page; phone (sms, qr, push); voice
 * (voicemail); everything else (email, playerSent) as messages. A tie is read as 'messages', unless
 * the set holds no email or playerSent at all: then the first tied non-email group wins.
 */
export function defendSetKind(set, episode) {
    if (Array.isArray(episode?.defend?.calls) && episode.defend.calls.length) return 'calls';
    const list = Array.isArray(set?.messages) ? set.messages.filter(isObj) : [];
    const n = { calls: 0, pages: 0, phone: 0, voice: 0, messages: 0 };
    for (const m of list) {
        if (m.kind === 'call') n.calls++;
        else if (m.kind === 'page') n.pages++;
        else if (PHONE_KINDS.has(m.kind)) n.phone++;
        else if (m.kind === 'voicemail') n.voice++;
        else n.messages++;
    }
    const top = ['calls', 'pages', 'phone', 'voice'].find((k) => Object.keys(n).every((o) => o === k || n[k] > n[o]));
    if (top) return top;
    // A tie among the non-email groups, with no email in the set, takes the first of them
    // (calls, pages, phone, voice) rather than reading as the inbox.
    if (n.messages === 0) {
        const keys = ['calls', 'pages', 'phone', 'voice'];
        const max = Math.max(...keys.map((k) => n[k]));
        if (max > 0) return keys.find((k) => n[k] === max);
    }
    return 'messages';
}

const DEFEND_COPY = Object.freeze({
    calls: [ROLE_SWAP_COPY, ROLE_SWAP_DEFEND_ONLY_COPY],
    pages: [PAGES_COPY, PAGES_DEFEND_ONLY_COPY],
    phone: [PHONE_COPY, PHONE_DEFEND_ONLY_COPY],
    voice: [VOICE_COPY, VOICE_DEFEND_ONLY_COPY],
    messages: [STAGE_COPY.defend, DEFEND_ONLY_COPY]
});

/**
 * The defend stage's panel copy. The heading and button always follow the set's kind
 * (messages, pages, calls, phone or voice); the line is strings.defendIntro when the episode
 * sets it, else the default for the set and variant.
 */
export function defendCopy(episode, set) {
    const defendOnly = variantOf(episode) === 'defendOnly';
    const copy = DEFEND_COPY[defendSetKind(set, episode)][defendOnly ? 1 : 0];
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

// Gate B D2: episode ids whose defend complete event this page has re-emitted (once per page).
const REEMITTED = new Set();
/** Test seam: forget the re-emits of this page. */
export function _resetDefendReemitsForTests() { REEMITTED.clear(); }

export class EpisodeRunnerMinigame extends SocialOverlayScene {
    constructor(container, params) {
        super(container, { title: 'Exercise', ...(params || {}) });
        this.deps = {
            renderStepStrip, renderFlipView, renderDebrief,
            measure: recordTriageResult,
            startTriage: (lockable, options) => win().startInboxTriageMinigame?.(lockable, options) ?? null,
            // Gate B D2: triage-starter.js reemitTriageComplete, on window like startTriage.
            reemitDone: (ctx) => win().reemitTriageComplete?.(ctx) ?? null,
            write: writeGlobal,
            now: () => Date.now(),
            schedule: (fn, ms) => setTimeout(fn, ms),
            clearScheduled: (h) => clearTimeout(h),
            // World-play (ENG-05a): loaded on first use so a runner without `world` never touches them.
            enterWorld: (world) => import('../../utils/world-play.js').then((m) => m.enterWorld(world)),
            leaveWorld: (world) => import('../../utils/world-play.js').then((m) => m.leaveWorld(world)),
            // E3 (resumeOnDone): the step-away spot, kept in world-play apart from the call's origin.
            rememberSpot: (spot) => import('../../utils/world-play.js').then((m) => m.setStepAwaySpot(spot)),
            clearSpot: () => import('../../utils/world-play.js').then((m) => m.clearStepAwaySpot()),
            returnToSpot: () => import('../../utils/world-play.js').then((m) => m.returnToStepAwaySpot()),
            ...(isObj(this.params.deps) ? this.params.deps : {})
        };
        this.strip = null;
        this.view = null;
        this.state = null;
        this.pauseAfter = null;
        this.stepAwayPanel = false;
        this._steppedAways = new Set(); // E3: beat ids Look up was picked on, in this runner
        this._beatPanel = null;         // E3: { beat, mode: 'choose' | 'waiting' } for a beat that is not post-defend
        this._debriefShown = false;
        this._readyOff = null;
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
        this._writeDone(state);
        win().stateSync?.sync?.();
    }

    /**
     * ENG-10: awarenessEpisode.doneGlobal is set true once, when the last stage ends (state.stage
     * is null). An episode without the key writes nothing new.
     */
    _writeDone(state) {
        const name = this.episode.doneGlobal;
        if (!isStr(name) || state.stage) return;
        const g = this.globals;
        if (g && g[name] === true) return;
        try {
            this.deps.write(name, true, { openChat: false });
        } catch (e) {
            console.error('[episode] could not write the done global:', e);
        }
    }

    /** ENG-10: oncePerLearner, with the done global already true when the runner opens. */
    _seenAlready() {
        const name = this.episode.doneGlobal;
        if (this.episode.oncePerLearner !== true || !isStr(name)) return false;
        const g = this.globals;
        return !!g && g[name] === true;
    }

    // ── lifecycle ────────────────────────────────────────────────────────────

    init() {
        super.init();
        if (this.headerElement) this.headerElement.style.display = 'none';
        const root = el('div', 'epr-root');
        root.setAttribute('role', 'region');
        root.setAttribute('aria-label', 'Exercise');
        applyBrand(root, this.episode.brand);
        const kiosk = !this.facilitated;
        if (this.facilitated) root.classList.add('epr-facilitated');
        // C-ER1 (user pick B): in normal play the episode is a diegetic awareness kiosk - a
        // CSS-drawn bezel (the PC monitor's look: flat case, 2px borders, stepped corners) with
        // the X in its top strip. The screen wraps the content and scrolls inside, so the step
        // strip is never squeezed to a fixed aspect. A facilitated (shared-screen) run skips the
        // bezel and stays full-bleed for projection.
        this.container?.classList?.toggle?.('epr-kiosk', kiosk);
        this.root = root;

        const bar = el('div', 'epr-bar');
        this.stripHost = el('div', 'epr-strip');
        bar.appendChild(this.stripHost);
        root.appendChild(bar);

        this.body = el('div', 'epr-body');
        root.appendChild(this.body);

        if (kiosk) {
            const bezel = el('div', 'epr-kiosk-bezel');
            const top = el('div', 'epr-kiosk-top');
            const cap = el('div', 'epr-kiosk-cap');
            cap.textContent = 'Security Awareness';
            top.appendChild(cap);
            // D263: gate players did not know how to leave the kiosk. A short pixel-font hint sits
            // beside the X (strings.closeHint overrides it; '' drops it).
            const hint = isStr(this.strings.closeHint) ? this.strings.closeHint
                : (this.strings.closeHint === '' ? '' : CLOSE_HINT_TEXT);
            if (hint) top.appendChild(el('span', 'epr-kiosk-hint', hint));
            // R2 m2 (a): a kiosk is a diegetic device like the PC monitor, so it closes with the
            // themed steel X (the PC monitor's close look); the bar's SE overlay X has the same skin since D216.
            this.mountThemedCloseControl(top, 'Close', 'epr-kiosk-close');
            const screen = el('div', 'epr-kiosk-screen');
            screen.appendChild(root);
            bezel.appendChild(top);
            bezel.appendChild(screen);
            // K13 (D-batch4): the old chin (card slot, LED, READY label) was an empty strip; the bezel now wraps the screen.
            this.gameContainer.appendChild(bezel);
        } else {
            this.mountCloseControl(bar, 'Close');
            this.gameContainer.appendChild(root);
        }

        this.state = this._readState();
        this._reemitDefendDone();
        this.alreadySeen = this._seenAlready();
        this._settleCall();
        this._settleWorld();
        this._settleStepAwayWatch();
        // A pause carried back by a child's return or the triage reopen; only for a stage
        // that is done, and never once the episode has finished.
        const after = this.params.pauseAfter;
        this.pauseAfter = this.facilitated && isStr(after) && this.state.stage && this.state.done.includes(after)
            ? after : null;
        // EC1: the step-away panel, carried by the triage reopen only (memory, never stored).
        // The prompt shows until the player picks Look up or Carry on (stepAwayPicked, stored once), so
        // a close at the prompt and a reopen or reload shows it again. A debrief already seen or
        // finished never brings it back.
        this.stepAwayPanel = !this.facilitated && !this.alreadySeen && stepAwayOn(this.episode)
            && this.state.done.includes('defend') && this.state.stage === 'debrief'
            && this.state[this._defendBeat().pickedKey] !== true && this.state.debriefSeen !== true;
        this._beatPanel = this._pendingBeat();
        this._markResumed();
        this.strip = this.deps.renderStepStrip(this.stripHost, {
            stages: stagesFor(this.episode), current: this.state.stage, done: this.state.done,
            skipped: this._skippedStages(), labels: this._stripLabels(), brand: this.episode.brand
        });
        this._render();
    }

    start() {
        super.start();
        this._focus();
    }

    cleanup() {
        const fromDebrief = this._debriefShown;
        this._destroyView();
        if (fromDebrief) this._markDebriefSeen();
        this.strip?.destroy?.();
        this.strip = null;
        super.cleanup();
    }

    _destroyView() {
        try { this.view?.destroy?.(); } catch (e) { console.warn('[episode] view destroy failed:', e); }
        this.view = null;
        this._debriefShown = false;
        this._unwatchReady();
        if (this.body) this.body.textContent = '';
    }

    _focus() {
        const target = this.body?.querySelector?.('.aw-band, h2, .aw-heading, button');
        try { target?.focus?.(); } catch (e) { /* focus is a nicety */ }
    }

    // ── stages ───────────────────────────────────────────────────────────────

    _render() {
        this._destroyView();
        const stage = this.state.stage;
        this.strip?.update?.({ current: stage, done: this.state.done, skipped: this._skippedStages() });
        if (this.rereading && this._canReread()) this._renderDebrief();
        else if (this.alreadySeen) this._renderFinished();
        else if (this.pauseAfter && stage) this._renderPause();
        else if (this.stepAwayPanel && stage === 'debrief') this._renderStepAway();
        else if (this._beatPanel && stage) this._renderBeat();
        else if (stage === 'brief') this._renderBrief();
        else if (stage === 'flip') this._renderFlip();
        else if (stage === 'debrief') this._renderDebrief();
        else if (stage && STAGE_COPY[stage]) this._renderLaunch(stage);
        else this._renderFinished();
    }

    _panel(heading, text) {
        const panel = el('section', 'epr-panel');
        const h = el('h2', 'epr-heading aw-heading', heading);
        h.tabIndex = -1;
        panel.appendChild(h);
        if (isStr(text)) panel.appendChild(el('p', 'epr-text', text));
        this.body.appendChild(panel);
        return panel;
    }

    /** The facilitator's prompt for a stage, as an aside, in facilitated mode only. */
    _groupPrompt(host, stage) {
        if (!this.facilitated || !host) return null;
        const prompt = facilitatorPrompt(this.strings, stage);
        if (!prompt) return null;
        const aside = el('aside', 'epr-facilitator');
        aside.setAttribute('aria-label', 'Prompt for the group');
        aside.append(el('span', 'epr-facilitator-label', PAUSE_COPY.prompt), el('span', 'epr-facilitator-text', prompt));
        return aside;
    }

    _renderPause() {
        const after = this.pauseAfter;
        const panel = this._panel(PAUSE_COPY.heading, facilitatorPrompt(this.strings, 'pause') || PAUSE_COPY.text);
        panel.classList.add('epr-pause');
        const prompt = this._groupPrompt(panel, after);
        if (prompt) panel.appendChild(prompt);
        this._button(panel, PAUSE_COPY.next, () => {
            this.pauseAfter = null;
            this._render();
            this._focus();
        }, 'epr-resume');
        // EC1 (e): in an opted-in shell, the pause after the defend stage also offers Look up.
        if (after === 'defend' && stepAwayOn(this.episode) && this.state.done.includes('defend')) this._lookUpButton(panel);
    }

    // ── the step-away panel (EC1) ────────────────────────────────────────────

    _renderStepAway() {
        const s = this.strings;
        const beat = this._defendBeat();
        const panel = this._panel(isStr(s.stepAwayHeading) ? s.stepAwayHeading : STEP_AWAY_COPY.heading,
            isStr(s.stepAway) ? s.stepAway : STEP_AWAY_COPY.text);
        panel.classList.add('epr-step-away');
        this._lookUpButton(panel, beat);
        this._button(panel, STEP_AWAY_COPY.carryOn, () => this._carryOn(beat), 'epr-carry-on aw-button-secondary');
    }

    /** E3: the step-away beat that follows defend (the legacy `stepAway: true` is this beat), or null. */
    _defendBeat() {
        return postDefendBeat(this.episode);
    }

    /**
     * E3: the panel of a beat that follows some other stage, shown in place of that stage's next
     * stage: "choose" (Look up and Carry on) until the beat is picked, then "waiting" (Carry on
     * only) on a reopen while its done global is set and still false. Null when none applies.
     * Facilitated runs skip a beat whose `facilitated` is false. Read from saved state, so a
     * reload before a pick shows the panel again.
     */
    _pendingBeat() {
        const state = this.state;
        if (this.alreadySeen || !state?.stage) return null;
        for (const beat of stepAwayBeats(this.episode)) {
            if (beat.after === 'defend') continue;
            if (this.facilitated && !beat.facilitated) continue;
            if (!state.done.includes(beat.after) || state.stage !== stageFollowing(this.episode, beat.after)) continue;
            if (this._steppedAways.has(beat.id)) continue;
            if (state[beat.pickedKey] !== true) return { beat, mode: 'choose' };
            const g = this.globals;
            if (beat.doneGlobal && state[`${beat.pickedKey}Via`] !== 'carry' && !(g && g[beat.doneGlobal] === true)) {
                return { beat, mode: 'waiting' };
            }
        }
        return null;
    }

    _renderBeat() {
        const { beat, mode } = this._beatPanel;
        const s = this.strings;
        const p = beat.strings;
        const heading = isStr(s[`${p}Heading`]) ? s[`${p}Heading`] : BEAT_COPY.heading;
        const text = mode === 'waiting'
            ? (isStr(s[`${p}Waiting`]) ? s[`${p}Waiting`] : BEAT_COPY.waiting)
            : (isStr(s[p]) ? s[p] : BEAT_COPY.text);
        const panel = this._panel(heading, text);
        panel.classList.add('epr-step-away', 'epr-world-beat');
        if (mode === 'choose') this._lookUpButton(panel, beat);
        this._button(panel, BEAT_COPY.carryOn, () => this._carryOn(beat), 'epr-carry-on aw-button-secondary');
    }

    /**
     * Carry on: store the beat as picked (one boolean; a resumeOnDone beat also stores its Via),
     * write the beat's done global true once when it has one, and move on to the next stage.
     */
    _carryOn(beat) {
        this._markStepAwayPicked(beat, beat.resumeOnDone ? 'carry' : null);
        const g = this.globals;
        if (beat.doneGlobal && !(g && g[beat.doneGlobal] === true)) {
            try {
                this.deps.write(beat.doneGlobal, true, { openChat: false });
                win().stateSync?.sync?.();
            } catch (e) {
                console.error('[episode] could not write the beat done global:', e);
            }
        }
        this.stepAwayPanel = false;
        this._beatPanel = null;
        this._render();
        this._focus();
    }

    /** Whether the beat's Look up is enabled: no ready global, or it is true. The legacy default is kit_defend_done. */
    _stepAwayReady(beat = this._defendBeat()) {
        const name = beat ? beat.readyGlobal : STEP_AWAY_READY_GLOBAL;
        if (!name) return true;
        const g = this.globals;
        return !!g && g[name] === true;
    }

    /** Look up, disabled until the beat's ready global is true (read now, then on its change event). */
    _lookUpButton(panel, beat = this._defendBeat()) {
        const btn = this._button(panel, STEP_AWAY_COPY.lookUp, () => this._lookUp(beat), 'epr-look-up');
        const note = el('p', 'epr-step-away-note', STEP_AWAY_COPY.wait);
        note.setAttribute('aria-live', 'polite');
        panel.appendChild(note);
        const sync = () => {
            const ready = this._stepAwayReady(beat);
            btn.disabled = !ready;
            note.hidden = ready;
        };
        sync();
        this._watchReady(sync, beat ? beat.readyGlobal : STEP_AWAY_READY_GLOBAL);
        return btn;
    }

    _watchReady(fn, global = STEP_AWAY_READY_GLOBAL) {
        this._unwatchReady();
        const events = win().eventDispatcher;
        if (!global || typeof events?.on !== 'function') return;
        const name = `global_variable_changed:${global}`;
        const handler = () => { try { fn(); } catch (e) { /* the panel may be gone */ } };
        events.on(name, handler);
        this._readyOff = () => { try { events.off?.(name, handler); } catch (e) { /* no dispatcher */ } };
    }

    _unwatchReady() {
        const off = this._readyOff;
        this._readyOff = null;
        off?.();
    }

    /**
     * Look up: close the runner, then emit the beat's event once. A resumeOnDone beat first records
     * where the learner stands and starts the watcher that brings them back. The state is not
     * otherwise written (a post-defend beat's state already says debrief, so the success screen's
     * hold stays and a reopen lands on the debrief).
     */
    _lookUp(beat = this._defendBeat()) {
        if (!beat) return;
        if (this._steppedAways.has(beat.id) || !this._stepAwayReady(beat)) return;
        this._steppedAways.add(beat.id);
        this._markStepAwayPicked(beat, beat.resumeOnDone ? 'lookup' : null);
        this.stepAwayPanel = false;
        this._beatPanel = null;
        this.pauseAfter = null;
        const episodeId = this.episode.id ?? null;
        if (beat.resumeOnDone && !this.facilitated) this._startResumeWatch(beat);
        if (this.gameState.isActive) this.close();
        try {
            const payload = beat.event === STEP_AWAY_EVENT ? { episodeId } : { episodeId, beatId: beat.id };
            win().eventDispatcher?.emit?.(beat.event, payload);
        } catch (e) {
            console.error('[episode] could not emit the step-away event:', e);
        }
    }

    /** E3: record the spot the learner stands on and start the watcher for a resumeOnDone beat. */
    _startResumeWatch(beat) {
        const id = this.episode.id;
        const p = this.params.player ?? win().player;
        const spot = p && Number.isFinite(p.x) && Number.isFinite(p.y) ? { x: p.x, y: p.y } : null;
        spotHeld.add(id);
        try {
            Promise.resolve(this.deps.rememberSpot(spot)).catch((e) => console.error('[episode] could not record the step-away spot:', e));
        } catch (e) {
            console.error('[episode] could not record the step-away spot:', e);
        }
        watchStepAway({
            episode: this.episode, beat, reopen: this._reopenParams(), opener: this,
            globals: () => this.params.globals || win().gameState?.globalVariables || null,
            now: () => this.deps.now(),
            returnToSpot: () => { spotHeld.delete(id); return this.deps.returnToSpot(); },
            schedule: this.deps.schedule, clearScheduled: this.deps.clearScheduled
        });
    }

    /**
     * E3: any open of the runner other than the watcher's own ends a running watcher and forgets
     * the spot without a move: the learner is at the kiosk already and this open resumes at the next
     * stage anyway. Only touches world-play when a spot was actually recorded.
     */
    _settleStepAwayWatch() {
        const id = this.episode.id;
        stopStepAwayWatch(id);
        if (!spotHeld.delete(id)) return;
        try {
            Promise.resolve(this.deps.clearSpot()).catch((e) => console.error('[episode] could not clear the step-away spot:', e));
        } catch (e) {
            console.error('[episode] could not clear the step-away spot:', e);
        }
    }

    /**
     * E3: the first open at a resumeOnDone beat's next stage (watcher, kiosk click or reload)
     * turns its Via "lookup" into "resumed", once, so a later reload does not start the watcher.
     */
    _markResumed() {
        if (this.facilitated) return;
        const s = this.state;
        for (const beat of stepAwayBeats(this.episode)) {
            if (!beat.resumeOnDone || s[`${beat.pickedKey}Via`] !== 'lookup') continue;
            if (this._beatPanel?.beat.id === beat.id) continue; // still waiting
            this._markStepAwayPicked(beat, 'resumed');
        }
    }

    /**
     * Gate B D2: a step-away episode whose defend round reached the server with no event (every
     * confirmed-save retry failed, the pagehide keepalive flush landed) has <defendPrefix>complete
     * true and kit_defend_done false for good. On each open, re-emit the complete event once a sync
     * confirms (triage-starter.js reemitTriageComplete), so the shell's mapping sets
     * kit_defend_done. In the normal case kit_defend_done is already true and nothing is sent; a
     * successful re-emit is not repeated in this page even if no mapping sets the global.
     */
    _reemitDefendDone() {
        const g = this.globals;
        const id = this.episode.id;
        if (!g || !id || !stepAwayOn(this.episode) || REEMITTED.has(id)) return;
        const prefix = defendPrefix(id);
        if (g[`${prefix}complete`] !== true || g[STEP_AWAY_READY_GLOBAL] === true) return;
        // The set only adds outcome.messageGlobals; a set that cannot be read still re-emits complete
        let set = null;
        try { set = this.defendSet || null; } catch (e) { console.warn('[episode] could not read the defend set:', e); }
        let run = null;
        try {
            run = this.deps.reemitDone({ prefix, set, stillNeeded: () => this.globals?.[STEP_AWAY_READY_GLOBAL] !== true });
        } catch (e) {
            console.error('[episode] could not re-emit the defend round:', e);
            return;
        }
        Promise.resolve(run).then((r) => {
            if (Array.isArray(r?.emitted) && r.emitted.length) REEMITTED.add(id);
        }).catch((e) => console.error('[episode] re-emitting the defend round failed:', e));
    }

    /**
     * A step-away beat was answered: store its picked flag (one boolean) and, for a resumeOnDone beat,
     * its Via ("lookup", "carry" or "resumed"; one short string), each only when it changes, so a
     * reopen or reload skips the prompt. A facilitated run stores nothing.
     */
    _markStepAwayPicked(beat = this._defendBeat(), via = null) {
        if (this.facilitated || !beat) return;
        const s = this._readState();
        const viaKey = `${beat.pickedKey}Via`;
        const wantVia = beat.resumeOnDone && via ? via : null;
        if (s[beat.pickedKey] === true && (!wantVia || s[viaKey] === wantVia)) return;
        const next = { ...s, [beat.pickedKey]: true };
        if (wantVia) next[viaKey] = wantVia;
        this._saveState(next);
        this.state = this._readState();
    }

    /** EC1 (d): the debrief view closed (Finish or the kiosk's X): release the success screen once. */
    _markDebriefSeen() {
        if (!stepAwayOn(this.episode)) return;
        const s = this._readState();
        if (s.debriefSeen === true || s.done.includes('debrief')) return;
        this._saveState({ ...s, debriefSeen: true });
    }

    _button(panel, label, onClick, cls = '') {
        const btn = el('button', `epr-button aw-button ${cls}`.trim(), label);
        btn.type = 'button';
        this.addEventListener(btn, 'click', (e) => {
            e.preventDefault?.();
            onClick();
        });
        panel.appendChild(btn);
        return btn;
    }

    _briefCards() {
        const cards = this.strings.briefCards;
        if (!Array.isArray(cards)) return [];
        return cards.filter((c) => isObj(c) && isStr(c.text) && c.text.trim());
    }

    /**
     * ENG-10: strings.briefCards, one card at a time with Back, Next and "Card n of m"; the last
     * card's button is strings.briefDone ("Got it") and completes the brief stage. Plain text, a
     * blank line starts a paragraph.
     */
    _renderBriefCards(cards) {
        const ep = this.episode;
        const last = cards.length - 1;
        const index = Math.min(Math.max(this.briefIndex || 0, 0), last);
        this.briefIndex = index;
        const card = cards[index];
        const panel = this._panel(isStr(card.heading) ? card.heading : (ep.brand?.name || this.params.title || 'Brief'));
        panel.classList.add('epr-brief-card');
        for (const para of card.text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)) {
            panel.appendChild(el('p', 'epr-text', para));
        }
        if (index === 0 && isStr(ep.scopeNote)) panel.appendChild(el('p', 'epr-scope se-notice', ep.scopeNote));
        const count = el('p', 'epr-card-count', `Card ${index + 1} of ${cards.length}`);
        count.setAttribute('aria-live', 'polite');
        panel.appendChild(count);
        const prompt = this._groupPrompt(panel, 'brief');
        if (prompt) panel.appendChild(prompt);
        const go = (to) => {
            this.briefIndex = to;
            this._render();
            this._focus();
        };
        if (index > 0) this._button(panel, BRIEF_COPY.back, () => go(index - 1), 'epr-back aw-button-secondary');
        if (index < last) this._button(panel, BRIEF_COPY.next, () => go(index + 1), 'epr-next');
        else this._button(panel, isStr(this.strings.briefDone) ? this.strings.briefDone : BRIEF_COPY.done, () => this._complete('brief'), 'epr-start epr-done');
    }

    _renderBrief() {
        const ep = this.episode;
        const cards = this._briefCards();
        if (cards.length) return this._renderBriefCards(cards);
        const panel = this._panel(ep.brand?.name || this.params.title || 'Brief', this.strings.brief);
        if (isStr(ep.scopeNote)) panel.appendChild(el('p', 'epr-scope se-notice', ep.scopeNote));
        const prompt = this._groupPrompt(panel, 'brief');
        if (prompt) panel.appendChild(prompt);
        this._button(panel, 'Start', () => this._complete('brief'), 'epr-start');
    }

    /** The panel copy for a stage that opens another tool. */
    _stageCopy(stage) {
        // ENG-11: with a sort drill still to do, the defend panel opens the drill, not the inbox.
        if (stage === 'defend' && drillPending(this.episode, this.state)) return drillLaunchCopy(this.episode);
        // ENG-12: then the concern form, if the episode has one.
        if (stage === 'defend' && concernPending(this.episode, this.state)) return concernLaunchCopy(this.episode);
        // ENG-13: then the privacy panel, if there is one.
        if (stage === 'defend' && privacyPending(this.episode, this.state)) return privacyLaunchCopy(this.episode);
        const copy = this._baseStageCopy(stage);
        // strings.stages.<stageId> { heading, text, button } replaces any of the three lines.
        const own = isObj(this.strings.stages) && isObj(this.strings.stages[stage]) ? this.strings.stages[stage] : null;
        if (!own || !copy) return copy;
        return { heading: isStr(own.heading) ? own.heading : copy.heading,
            text: isStr(own.text) ? own.text : copy.text,
            button: isStr(own.button) ? own.button : copy.button };
    }

    _baseStageCopy(stage) {
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
        this.notice = el('p', 'epr-notice');
        this.notice.setAttribute('aria-live', 'polite');
        panel.appendChild(this.notice);
        // E14 F11: the compose draft is not kept across a close or reload, so a reopen starts the
        // message again. Say so on the launch panel, as the sort drill and concern form do.
        // strings.writeReloadNote: '' suppresses it; a compose write stage only (not a call).
        if (stage === 'write' && writeKind(this.episode) !== 'call') {
            const note = this.strings.writeReloadNote === '' ? ''
                : (isStr(this.strings.writeReloadNote) ? this.strings.writeReloadNote
                    : 'If you close or reload before you send, your draft starts again.');
            if (note) panel.appendChild(el('p', 'epr-reload-note se-notice', note));
        }
        this._button(panel, copy.button, () => this._launch(stage), 'epr-launch');
        // From the write stage, always offer a way back to research. A learner who closed the
        // browser without noting a contact or a fact the message needs is otherwise stuck with
        // Send disabled and no route back — the one restart-or-nothing dead end (P1 B1 blocker,
        // E5-2). Research reopens as a child; closing it leaves the write stage where it was.
        if (stage === 'write' && stagesFor(this.episode).includes('osint')) {
            // It opens on the first site, where a fresh visit starts, not on the last page seen:
            // a learner coming back for something they missed needs every source in reach
            // (E1-E4 P4-10: index-based clicks landed on Friendface or Events after a return).
            this._button(panel, 'Back to research', () => this._launch('osint', { home: true }), 'epr-back-research');
        }
    }

    /**
     * Step-strip label overrides. On a pretext-call episode (E3) the flip replays the call, not an
     * email, so the 'flip' step reads "The call" rather than the default "Your message" (E3-6).
     */
    _stripLabels() {
        // strings.stepLabels is the built home; ENG-01 adds episode.stepLabels, which wins.
        const own = isObj(this.strings.stepLabels) ? this.strings.stepLabels : null;
        const top = isObj(this.episode.stepLabels) ? this.episode.stepLabels : null;
        let base = writeKind(this.episode) === 'call' ? { flip: 'The call' } : undefined;
        // A consequence episode's flip is the montage of where the choices led (ENG-04).
        if (isMontage(this.episode)) base = { ...base, flip: 'Where it led' };
        return own || top ? { ...base, ...own, ...top } : base;
    }

    /**
     * Stages shown as skipped rather than done. A pretext call that did not land skips the
     * MFA-fatigue demo (there is no captured password to replay), yet the runner marks it done so
     * it can advance; the strip must show that step as skipped, not completed (E3-6, E3 N1).
     */
    _skippedStages() {
        const out = [];
        if (writeKind(this.episode) === 'call' && stagesFor(this.episode).includes('mfa')
            && (this.state?.done || []).includes('mfa')) {
            const outcome = this._callOutcome();
            if (outcome && outcome !== CALL_LANDED) out.push('mfa');
        }
        return out;
    }

    /** True when strings.flipDefenderLineByChoice has a non-empty line for this pretext template id. */
    _hasChoiceLine(templateId) {
        const by = this.strings?.flipDefenderLineByChoice;
        return isObj(by) && isStr(templateId) && isStr(by[templateId]);
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
        // flip.mode "montage" (ENG-04): every beat, with where the learner's choice led.
        if (isMontage(this.episode)) return montageProps(this.episode, this.state.mistakeChoices ?? null);
        const sent = this.state.sent;
        const globals = this.globals || {};
        // ENG-02: a guess stage has no message, page or call to replay. It landed when the guesser wrote
        // its landed global; the flip then shows the victim's seat, else the did-not-land view.
        if (sent?.kind === 'guess') {
            const landed = guessLanded(this.episode, globals);
            const aftermath = landed ? flipAftermathFor(this.episode, { landed }) : null;
            // The spray needs the staff list. When the episode names a sprayedGlobal and the run never
            // set it, the flip must not say a spray opened accounts (only the stolen list did).
            const sprayName = isObj(this.episode?.guess) ? this.episode.guess.sprayedGlobal : null;
            const noSpray = landed && typeof sprayName === 'string' && !!sprayName && globals[sprayName] !== true;
            return { message: null, page: null, call: null, guess: landed, ...(noSpray ? { noSpray } : {}), missed: !landed, ...(aftermath ? { aftermath } : {}) };
        }
        if (sent?.kind === 'call') {
            const call = flipCall(this.episode, this.social, sent, globals);
            return { message: null, page: null, call, missed: !call };
        }
        // The flip must follow the send's actual outcome. A mail send that did not land has
        // nothing to replay from the other side — the "they opened it and typed their password"
        // narrative would be false — so show the did-not-land view, as a failed call does (N2).
        const rec = sent?.recordId ? findSentRecord(this.mailState, sent.targetId ?? null, [sent.recordId]) : null;
        if (rec && rec.landed === false) return { message: null, page: null, call: null, missed: true };
        let message = this._flipMessage();
        // aw-ux2: a landed message with no scored tell is replayed (tells list empty) instead of the
        // "nothing to replay" view, but only when the episode authors a defender line for the pretext
        // the learner chose (strings.flipDefenderLineByChoice[templateId]); otherwise unchanged.
        if (!message && rec?.landed === true && this._hasChoiceLine(sent?.templateId)) {
            message = plainSentMessage(rec, flipEntry(this.episode, this.defendSet));
        }
        let page = null;
        try { page = flipPage(this.episode, this.social, globals); } catch (e) { console.error('[episode] could not rebuild the page:', e); }
        // Something went but there is nothing to replay. When the record says it landed (a careful
        // message with no tells), that is not a miss and gets its own line (flipLandedNoTells,
        // falling back to flipMissed); a record that cannot be found reads as a miss, as before.
        const nothing = !message && !page && !!sent?.recordId;
        const landedNoTells = nothing && rec?.landed === true;
        const out = { message, page, call: null, missed: nothing && !landedNoTells, landedNoTells };
        // ENG-01: the victim's seat, only for a landed mail or page (rec.landed === false returned above).
        const aftermath = (message || page) ? flipAftermathFor(this.episode, { landed: rec?.landed !== false }) : null;
        if (aftermath) out.aftermath = aftermath;
        return out;
    }

    _renderFlip() {
        this.view = this.deps.renderFlipView(this.body, {
            ...this._flipProps(),
            strings: this.strings,
            // aw2: the pretext the learner chose, so the flip can quote back a per-choice defender
            // line (strings.flipDefenderLineByChoice). A call has no pretext template; null there.
            templateId: this.state.sent?.templateId ?? null,
            globals: this.globals,
            onContinue: () => this._flipContinue()
        });
        this._prependPrompt('flip');
    }

    /**
     * The flip's Continue. When the episode authors an assistant block (ENG-06, E13), Continue
     * opens the authored assistant overlay in the flip region; on its normal close the runner
     * reopens (returnTo) and the stage advances to defend. Without the key, Continue completes
     * the flip exactly as before, so every built episode is unchanged.
     */
    _flipContinue() {
        const config = this.episode.assistant;
        if (!isObj(config)) { this._complete('flip'); return; }
        this._launching = 'flip';
        const child = this.launchChild('assistant-chat', socialOverlayParams({
            config,
            episodeId: this.episode.id ?? null,
            // E13 MA3: the sent pretext, so the summarise mode surfaces the branch the learner wrote.
            sentTemplateId: this.state.sent?.templateId ?? null,
            // batch 11 (E13 B2 finding 11): the assistant window hands back a recap of the wrong
            // outcomes (password left in, figures sent unchecked). It is kept in the state so the
            // debrief looks back at the assistant stage, not only the inbox. Absent/empty → no key.
            onComplete: (success, result) => { if (isNormal(success, result)) this._completeWhileAway('flip', { assistant: result?.recap ?? [] }); }
        }));
        this._launching = null;
        if (!child) this._complete('flip'); // the scene did not open: do not strand the learner
    }

    /**
     * Gate B D1: the debrief's result rebuilt from the stored verdicts (a step-away reopen), scored
     * by scoreTriage over the same built messages the triage round scored, so the cards and the
     * summary equal the live debrief's. Answers carry score and isPhish as the live result's do
     * (inbox-triage-minigame.js _buildResult). Null with no stored verdicts or no defend set.
     */
    _rescoreDefend(kept) {
        if (!Array.isArray(kept) || !kept.length) return null;
        try {
            const set = this.defendSet;
            if (!isObj(set)) return null;
            const { messages } = buildTriageMessages(set, { mailState: this.mailState, social: this.social, globals: this.globals || {} });
            const s = scoreTriage({
                messages, answers: kept, profile: set.scoringProfile === 'analyst' ? 'analyst' : 'awareness',
                bands: set.bands, scoring: set.scoring || null
            });
            const byId = new Map(kept.map((a) => [a.id, a]));
            const { perMessage, ...rest } = s;
            return {
                ...rest,
                answers: perMessage.map((pm) => {
                    const a = byId.get(pm.id) || {};
                    const out = { id: pm.id, verdict: pm.verdict, flags: a.flags || [], score: pm.score, ms: a.ms ?? 0, isPhish: pm.isPhish === true };
                    if (a.action) out.action = a.action;
                    if (a.none === true) out.none = true;
                    if (a.sheetless === true) out.sheetless = true;
                    return out;
                })
            };
        } catch (e) {
            console.warn('[episode] could not score the stored defend answers:', e);
            return null;
        }
    }

    /** Above a P7-B view, the stage's group prompt (facilitated mode). */
    _prependPrompt(stage) {
        const prompt = this._groupPrompt(this.body, stage);
        if (prompt) this.body.insertBefore(prompt, this.body.firstChild);
    }

    /** D263: a finished episode that ran a debrief can show it again (read only, memory only). */
    _canReread() {
        return !this.state.stage && this.state.done.includes('debrief') && stagesFor(this.episode).includes('debrief');
    }

    /** D286: the host option id the learner built the fake-check page on, read from the stored landing record (null if none). */
    _chosenHostId() {
        try { return flipPage(this.episode, this.social, this.globals)?.hostId ?? null; } catch (e) { return null; }
    }

    _renderDebrief() {
        const reread = this.rereading === true;
        const stored = this.state.defend || {};
        // EC1 (c): a step-away episode keeps the defend answers in the state, so the per-item
        // cards survive a look-up and a reload; every other episode passes an empty list as before.
        const kept = debriefAfter(this.episode, 'defend') && Array.isArray(this.state.defendProgress) ? this.state.defendProgress : [];
        // Gate B D1: the stored list keeps verdicts only (no score, no isPhish), so a reopen scores
        // it again with the live round's scorer; the stored figures win where both have one.
        let raw = this.params.triageResult;
        if (!isObj(raw)) {
            const rescored = this._rescoreDefend(kept);
            raw = rescored ? { ...rescored, ...stored, answers: rescored.answers } : { ...stored, answers: kept };
        }
        // aw1, aw4, aw6: the deployment's report route, shared rule of thumb and team size
        // (social.awareness, with the host page's breakEscapeConfig.awareness winning).
        const config = win().breakEscapeConfig;
        const settings = awarenessSettings(this.social, config);
        // Hide the per-learner score in facilitated mode (shared screen) and when the host hides
        // results (show_result false). hideScore strips the stored figures; showScore also drops the
        // report-rate percentage, which the stored result keeps. The item counts stay either way.
        const showScore = !this.facilitated && settings.showResult !== false;
        const result = showScore ? raw : hideScore(raw);
        // D227 A1: the round's result card was folded into the debrief, so the debrief opens with
        // the set's own band headline (shown even when the host hides the score, as the card did)
        // and, when scores show, the score in large type.
        const folded = foldsResult(this.episode, 'defend') && isObj(this.defendSet);
        const bandHeadline = folded ? foldedHeadline(raw, this.defendSet) : null;
        // A re-read changes nothing: no seen-mark on close, no Finish, no new write.
        this._debriefShown = !reread;
        this.view = this.deps.renderDebrief(this.body, {
            readOnly: reread,
            result,
            showScore,
            folded,
            bandHeadline,
            weakestNudge: folded ? (several) => foldedWeakestNudge(this.defendSet, several) : null,
            set: this.defendSet,
            strings: this.strings,
            globals: this.globals,
            hostId: this._chosenHostId(),
            variant: variantOf(this.episode),
            reportRoute: reportRouteFor(this.episode, this.social, config),
            ruleOfThumb: settings.ruleOfThumb,
            teamSize: settings.teamSize,
            // E17 B2 finding: recap the scored sort-drill cards the learner put in the wrong bin.
            drillRecap: Array.isArray(this.state.drill?.recap) ? this.state.drill.recap : [],
            // batch 11: recap the sandbox choices and the assistant window outcomes the learner got
            // wrong, so the debrief is not only about the inbox. Empty (and so not rendered) for a
            // defend-only variant, which runs neither stage.
            sandboxRecap: Array.isArray(this.state.sandbox) ? this.state.sandbox : [],
            assistantRecap: Array.isArray(this.state.assistant) ? this.state.assistant : [],
            // batch 13: look back at the concern form's report (facts filed, required ones left
            // out, any conclusion left in). Null, and so not drawn, without a form record.
            concernRecap: concernRecap(this.episode, this.state.concern),
            onFinish: () => {
                // E15/E17 B2 finding: Finish must not drop the learner straight back to the world
                // (two toasts and a narration line were the only end signal). Completing the last
                // stage renders the clear "Episode finished" panel; the bar's Close then closes it.
                this._sendOffDue = true; // the send-off shows under this fresh finish only
                this._complete('debrief');
                if (!this.gameState.isActive) this.close();
            }
        });
        this._prependPrompt('debrief');
    }

    /** The bar's Close is the only Close: the panel says it is finished and nothing more. */
    _renderFinished() {
        const seen = this.alreadySeen;
        // E15/E17 B2 finding: the end of the episode must be unmistakable. A fresh finish reads
        // "Episode finished"; a reopen after it was seen keeps the quieter "Finished".
        const heading = seen ? 'Finished' : (isStr(this.strings.finishedHeading) ? this.strings.finishedHeading : 'Episode finished');
        const panel = this._panel(heading, seen && isStr(this.strings.alreadySeen) ? this.strings.alreadySeen
            : (seen ? ALREADY_SEEN_TEXT : (isStr(this.strings.finished) ? this.strings.finished : FINISHED_TEXT)));
        panel.classList.add('epr-finished');
        // batch-13 item 4: the send-off, once, right after Finish. A reopen of a finished episode
        // (or a once-per-learner "seen already") shows the panel without it.
        const due = this._sendOffDue === true && !seen;
        this._sendOffDue = false;
        const sendOff = typeof this.strings.sendOff === 'string' ? this.strings.sendOff : SEND_OFF_TEXT;
        if (due && sendOff.trim()) panel.appendChild(el('p', 'epr-send-off', sendOff));
        // D263: the debrief cannot be re-read from the bare panel, so offer it (shell strings.rereadLink).
        if (this._canReread() && this.strings.rereadLink !== '') {
            this._button(panel, isStr(this.strings.rereadLink) ? this.strings.rereadLink : REREAD_TEXT, () => {
                this.rereading = true;
                this._render();
                this._focus();
            }, 'epr-reread aw-button-secondary');
        }
    }

    _complete(stageId, patch = {}) {
        this._saveState(completeStage(this.episode, this._readState(), stageId, patch));
        this.pauseAfter = this.facilitated && this.state.stage ? stageId : null;
        this._beatPanel = this._pendingBeat();
        if (this.gameState.isActive) {
            this._render();
            this._focus();
        }
    }

    // ── child launches (§2.3) ────────────────────────────────────────────────

    _launch(stage, opts = {}) {
        const spec = childLaunch(this.episode, stage);
        if (!spec) return;
        if (spec.kind === 'osint' && opts.home) spec.params = { ...spec.params, start: '@home' };
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
                    if (!isNormal(success, result)) return; // aborted: stay on write
                    // An episode child now closes normally even with nothing sent, so returnTo
                    // reopens us on write (P1 m6/E5-11). Advance only when a message actually went.
                    const ids = Array.isArray(result?.sentIds) ? result.sentIds : [];
                    if (!ids.length) return;
                    const rec = findSentRecord(this.mailState, target, ids);
                    const sent = sentFromRecord(rec, target);
                    if (!sent) return; // no matching sent record: do not advance past write
                    this._completeWhileAway('write', { sent });
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
        } else if (spec.kind === 'guess') {
            child = this.launchChild(spec.sceneType, socialOverlayParams({
                ...spec.params,
                onComplete: (success, result) => {
                    // Advance only once the rig has been switched off after every guess; closing
                    // part-way stays on the stage. The scene has already written the landed global.
                    if (isNormal(success, result) && result?.finished === true) {
                        this._completeWhileAway('guess', { sent: { kind: 'guess' } });
                    }
                }
            }));
        } else if (spec.kind === 'mistake') {
            child = this.launchChild(spec.sceneType, socialOverlayParams({
                ...spec.params,
                onComplete: (success, result) => {
                    // Advance only once every beat is answered; closing part-way stays on the stage.
                    if (isNormal(success, result) && result?.finished === true) {
                        const choices = result.mistakeChoices ?? {};
                        // batch 11 (E11 B2 finding 5): keep a recap of the wrong choices so the
                        // debrief can look back at them (mistakeChoices itself is cleared at the flip).
                        this._completeWhileAway('mistake', { mistakeChoices: choices, sandbox: sandboxRecap(this.episode, choices) });
                    }
                }
            }));
        } else if (spec.kind === 'call') {
            const world = worldFor(this.episode);
            // A world-play call places the learner first, so the launch is a promise (truthy);
            // it reports its own failure.
            child = world ? this._launchWorldCall(spec.params, world) : this._launchCall(spec.params);
        } else if (spec.kind === 'triage' && stage === 'defend' && drillPending(this.episode, this._readState())) {
            // ENG-11: the sort drill comes first in the defend stage. Its record is kept in the
            // state, so the panel then opens the inbox. A drill closed part-way keeps nothing.
            child = this.launchChild('sort-drill', socialOverlayParams(drillLaunchParams(this.episode, this._drillOverrides(), {
                onComplete: (success, result) => {
                    if (!isNormal(success, result)) return;
                    this._saveState({ ...this._readState(), drill: drillRecord(result) });
                }
            })));
        } else if (spec.kind === 'triage' && stage === 'defend' && concernPending(this.episode, this._readState())) {
            // ENG-12: the concern form follows any drill and comes before the inbox. Its record
            // is kept in the state, so the panel then opens the inbox. Closed part-way keeps nothing.
            child = this.launchChild('concern-form', socialOverlayParams(concernLaunchParams(this.episode, {
                onComplete: (success, result) => {
                    if (!isNormal(success, result)) return;
                    this._saveState({ ...this._readState(), concern: concernRecord(result) });
                }
            })));
        } else if (spec.kind === 'triage' && stage === 'defend' && privacyPending(this.episode, this._readState())) {
            // ENG-13: the privacy panel comes after the drill and before the inbox. Its record is
            // kept in the state. The panel reads the board's found facts and changes none of them.
            child = this.launchChild('privacy-panel', socialOverlayParams(privacyLaunchParams(this.episode, {
                social: this.social,
                globals: this.globals,
                onComplete: (success, result) => {
                    if (!isNormal(success, result)) return;
                    this._saveState({ ...this._readState(), privacy: privacyRecord(result) });
                }
            })));
        } else if (spec.kind === 'triage') {
            child = this._launchTriage(stage, spec.options);
        }
        this._launching = null;
        if (!child && this.gameState.isActive && this.notice) this.notice.textContent = isStr(this.strings.launchFailed) ? this.strings.launchFailed : LAUNCH_FAILED;
    }

    /** A deployment's per-card changes to the drill bank (breakEscapeConfig.awareness.sortDrillCards), or null. */
    _drillOverrides() {
        const o = win().breakEscapeConfig?.awareness?.sortDrillCards;
        return isObj(o) ? o : null;
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

    /**
     * E2: end a world hold. Writes the hold global true (a delta, once; a no-op when it already
     * is) so the mappings gated on it disarm, whatever ended the hold.
     */
    _writeHold(name) {
        if (!isStr(name) || this.globals?.[name]) return;
        this.deps.write(name, true, { openChat: false });
        win().stateSync?.sync?.();
    }

    /** On a reopen at the call's write stage with its outcome set, the call is over: move on. */
    _settleCall() {
        if (this.state.stage !== 'write' || !this._callId) return;
        const outcome = this._callOutcome();
        if (!outcome) return;
        stopCallWatch(this.episode.id);
        // E2: a reload or early reopen while held settles the hold here (the stage state does
        // not yet record the call), so the flip opens with the global true.
        const hu = worldFor(this.episode)?.holdUntil;
        if (hu) this._writeHold(hu);
        const written = completeStage(this.episode, this.state, 'write', { sent: sentFromCall(this._callId, outcome) });
        this._saveState(skipMfaIfUnlanded(this.episode, written, outcome));
        this.pauseAfter = null;
    }

    /**
     * The osint-browser launch the prep card uses for its "Back to research" button (item 5): the
     * same scene and site list the write panel's Back-to-research opens, starting on the first site.
     * null when the episode has no research stage, so the prep shows no button.
     */
    _researchLaunch() {
        if (!stagesFor(this.episode).includes('osint')) return null;
        const spec = childLaunch(this.episode, 'osint');
        if (!spec || spec.kind !== 'osint') return null;
        return { scene: spec.sceneType, params: { ...spec.params, start: '@home' } };
    }

    /**
     * Open pretext-prep for the episode's call. A Close on the prep card returns here with the
     * stage unchanged. Begin replaces the prep with the phone chat, which has no way back, so
     * a watcher waits for the outcome global and for every overlay to close, then holds the
     * call for the flip and reopens the runner.
     */
    _launchCall(params, handBack = null, world = null) {
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
        const child = this.launchChild('pretext-prep', socialOverlayParams({ callId, character, npcId,
            // batch-12 item 5: when the episode has a research stage, hand the prep card a way back
            // to it. The prep opens research as its own child (so the player keeps their place and,
            // in a world-play call, their spot in the lobby) and returns to the card with the fact
            // now held. Without a research stage the field is absent and no button shows (E12 F1).
            researchLaunch: this._researchLaunch() }));
        if (child) {
            watchCall({
                episode: this.episode, callId, before, reopen, handBack,
                hold: world?.holdUntil ? { until: world.holdUntil, maxMs: world.holdMaxMs } : null,
                now: () => this.deps.now(),
                writeHold: (name) => this._writeHold(name),
                globals: () => this.params.globals || win().gameState?.globalVariables || null,
                save: (state) => { this.deps.write(stateKey(this.episode.id), state, { openChat: false }); win().stateSync?.sync?.(); },
                schedule: this.deps.schedule, clearScheduled: this.deps.clearScheduled
            });
        }
        return child;
    }

    /**
     * World-play (ENG-05a): move the learner into the lobby in the costume, then open the same
     * pretext-prep card as any call. The watcher puts them back before the runner reopens for the
     * flip. If the lobby cannot be entered nothing is launched and the learner stays at the kiosk.
     */
    async _launchWorldCall(params, world) {
        const id = this.episode.id;
        const back = async () => {
            worldAway.delete(id);
            try { await this.deps.leaveWorld(world); } catch (e) { console.error('[episode] world hand-back failed:', e); }
        };
        const fail = async () => {
            await back();
            if (this.gameState.isActive && this.notice) this.notice.textContent = isStr(this.strings.launchFailed) ? this.strings.launchFailed : LAUNCH_FAILED;
            return null;
        };
        worldAway.add(id);
        let placed = false;
        try { placed = await this.deps.enterWorld(world); } catch (e) { console.error('[episode] world entry failed:', e); }
        if (!placed) return fail();
        this._launching = 'write'; // read by returnParams() while launchChild builds returnTo
        const child = this._launchCall(params, back, world);
        this._launching = null;
        return child || fail();
    }

    /**
     * A reopen with the learner still away (the prep card was closed, so no call ran): bring them
     * back. A no-op unless this module sent them away, so it costs nothing without `world`.
     */
    _settleWorld() {
        const world = worldFor(this.episode);
        if (!world || !worldAway.has(this.episode.id)) return;
        worldAway.delete(this.episode.id);
        // E2: a reopen inside the hold (the kiosk reached during the grace) ends it here.
        if (world.holdUntil && this._callOutcome()) this._writeHold(world.holdUntil);
        Promise.resolve(this.deps.leaveWorld(world)).catch((e) => console.error('[episode] world hand-back failed:', e));
    }

    /** A child's onComplete runs after this overlay has closed: save from the stored state. */
    _completeWhileAway(stageId, patch = {}) {
        this._saveState(completeStage(this.episode, this._readState(), stageId, patch));
    }

    /** The params this runner reopens with. */
    _reopenParams(extra = {}) {
        const { suspended, triageResult, resume, pauseAfter, stepAwayAfter, ...base } = this.params;
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
                // A debrief later in this episode carries the real-items cost and why lines, so the
                // triage result names the items only (disc_visible). A check ends on the result.
                debriefFollows: debriefAfter(episode, stage),
                // D227 A2/A3: compact tell rows and no sheet after a Trust (the triage minigame
                // applies them to a scored, immediate-feedback round only, never a check). A1: a
                // self-paced run folds the result card into the debrief; a facilitated run keeps it.
                episodeTrims: true,
                foldResult: foldsResult(episode, stage),
                // item 8 (E12 B2 finding 3): save each locked verdict so a reload mid-round resumes
                // where the learner was, and restore them when the round reopens. The triage
                // minigame uses these only when present, so every other scenario is unchanged.
                restoreAnswers: Array.isArray(this.state.defendProgress) ? this.state.defendProgress : null,
                onProgress: (answers) => this._saveTriageProgress(answers),
                onComplete: (success, result) => this._triageDone(stage, options, holder, reopenBase, episode, set, success, result)
            });
        } catch (e) {
            console.error('[episode] the triage starter failed:', e);
        }
        holder.launched = launched;
        if (!launched) this.params.suspended = false;
        return launched;
    }

    /** item 8: persist the in-progress triage verdicts without advancing the stage. */
    _saveTriageProgress(answers) {
        try {
            this._saveState({ ...this._readState(), defendProgress: Array.isArray(answers) ? answers : [] });
        } catch (e) {
            console.error('[episode] saving triage progress failed:', e);
        }
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
        // EC1 (c): a step-away episode keeps the round's verdicts (the result's list, cleaned).
        const keep = debriefAfter(episode, 'defend') && stage === 'defend' && Array.isArray(result?.answers) && result.answers.length
            ? { defendProgress: result.answers } : {};
        const state = completeStage(episode, this._readState(), stage, { defend: defendSummary(result), ...keep });
        this._saveState(state);
        if (!state.stage) return; // a check mission ends with the triage result screen
        const fw = win().MinigameFramework;
        if (!fw?.startMinigame) return;
        const facilitated = episode.facilitated === true;
        fw.startMinigame('episode-runner', null, {
            ...reopenBase, triageResult: result, pauseAfter: facilitated ? stage : null,
            // EC1 (a): the step-away panel, for an opted-in, non-facilitated run.
            stepAwayAfter: !facilitated && stepAwayOn(episode) && stage === 'defend' ? stage : null
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
                mistakeHeld: !!s.mistakeChoices,
                facilitated: this.facilitated,
                paused: !!(this.pauseAfter && s.stage),
                stepAwayPanel: !!(this.stepAwayPanel && s.stage === 'debrief'),
                stepAwayReady: this._stepAwayReady(),
                beatPanel: this._beatPanel ? { id: this._beatPanel.beat.id, mode: this._beatPanel.mode } : null,
                debriefSeen: s.debriefSeen === true
            }
        };
    }
}

// ── the call watcher (module level: the runner is closed while the call runs) ─────

const callWatches = new Map(); // episode id -> { stop }
const worldAway = new Set();   // episode ids whose learner this module has moved into the world room (ENG-05a)
const stepAwayWatches = new Map(); // E3: episode id -> { stop }, the resumeOnDone watcher
const spotHeld = new Set();        // E3: episode ids with a step-away spot recorded in world-play

export function stopCallWatch(episodeId) {
    callWatches.get(episodeId)?.stop?.();
    callWatches.delete(episodeId);
}

/**
 * Wait for the pretext call to end. Heard: the outcome global changed (the change event) or
 * holds a value it did not hold at launch. Then, once no overlay is open (the chat and its
 * debrief have closed), write the write stage done with the call held, and reopen the runner.
 * If the runner is open again first (the prep card was closed), the watch ends. `handBack`
 * (optional, ENG-05a) runs before the reopen and when the watch gives up. Exposed for the tests.
 *
 * E2, the hold: `hold` is `{ until, maxMs }` (a global name and a cap). The outcome then no
 * longer hands back at once. The clock starts when the outcome is first seen; the watch waits
 * until the global `until` is truthy or `maxMs` has passed, and, as before, until no overlay is
 * open (a chat still open at the cap is waited out). When the hold ends on the cap, `writeHold`
 * writes the global true, so scenario mappings gated on it disarm; hand-back and reopen then
 * run once, on the next tick, after any overlay those mappings opened has closed. The four-hour
 * give-up writes the global only when a call outcome was heard. Without `hold` nothing here changes.
 */
export function watchCall({ episode, callId, before = null, reopen = {}, handBack = null, hold = null, now = Date.now, writeHold = null, globals, save, schedule, clearScheduled }) {
    stopCallWatch(episode.id);
    const w = win();
    const key = callOutcomeKey(callId);
    const eventName = `global_variable_changed:${key}`;
    let heard = false;
    let timer = null;
    let ticks = 0;
    let endedAt = null; // E2: when the outcome was first seen
    let holdWritten = false; // E2: the cap write has been made; hand back on a later tick
    const holdOpen = (g) => !!hold && !g[hold.until];
    const endHold = (g) => { if (hold && !g[hold.until]) { try { writeHold?.(hold.until); } catch (e) { console.error('[episode] hold write failed:', e); } } };
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
        if (ended && hold && endedAt === null) endedAt = now();
        // Held: not over until the global is true or the cap has passed (and no overlay is open).
        const held = ended && holdOpen(g) && now() - endedAt < hold.maxMs;
        if (ended && !current && !held) {
            // The cap write fires the hold global's mappings, which may open an overlay. Give them
            // one tick, then hand back once nothing is open (a failed write is not waited on twice).
            if (hold && !g[hold.until] && !holdWritten) {
                holdWritten = true;
                endHold(g);
                timer = schedule(tick, CALL_WAIT_MS);
                return;
            }
            stopCallWatch(episode.id);
            const finish = () => {
                const written = completeStage(episode, readState(episode, g[stateKey(episode.id)]), 'write',
                    { sent: sentFromCall(callId, outcome) });
                const state = skipMfaIfUnlanded(episode, written, outcome);
                save(state);
                fw?.startMinigame?.('episode-runner', null, {
                    ...reopen,
                    pauseAfter: episode.facilitated === true ? 'write' : null
                });
            };
            // World-play (ENG-05a): the learner comes back to the kiosk room, and the costume
            // comes off, before the flip. Whatever the outcome, and even if the hand-back fails.
            if (typeof handBack === 'function') {
                Promise.resolve().then(handBack).catch((e) => console.error('[episode] world hand-back failed:', e)).then(finish);
            } else {
                finish();
            }
            return;
        }
        if (++ticks > CALL_WAIT_LIMIT) {
            stopCallWatch(episode.id);
            // Only a heard call ends the hold: a learner who never finished the chat can retry and hold then.
            if (isStr(g[key]) && (heard || g[key] !== before)) endHold(g);
            if (typeof handBack === 'function') Promise.resolve().then(handBack).catch(() => {});
            return;
        }
        timer = schedule(tick, CALL_WAIT_MS);
    };
    callWatches.set(episode.id, { stop, tick });
    timer = schedule(tick, CALL_WAIT_MS);
    return { stop: () => stopCallWatch(episode.id), tick };
}

export function stopStepAwayWatch(episodeId) {
    stepAwayWatches.get(episodeId)?.stop?.();
    stepAwayWatches.delete(episodeId);
}

/**
 * E3 (resumeOnDone): after Look up on a beat with a done global, wait for that global to turn
 * true. Then, once no minigame is open for the grace (RESUME_GRACE_MS, so a closing bark finishes;
 * a chat that opens restarts the grace), move the learner to the recorded spot (`returnToSpot`,
 * which also forgets it) and reopen the runner at the next stage. Another open of the runner
 * (anything but `opener`, which is still closing) ends the watch with no move. Started by Look up
 * and, on a reload, by systems/episode-starter.js from the saved state. Gives up after four hours.
 * Exposed for the tests.
 */
export function watchStepAway({ episode, beat, reopen = {}, opener = null, globals, now = Date.now, returnToSpot = null, schedule, clearScheduled, graceMs = RESUME_GRACE_MS }) {
    stopStepAwayWatch(episode.id);
    const w = win();
    let timer = null;
    let ticks = 0;
    let graceAt = null;
    const stop = () => {
        if (timer !== null) clearScheduled?.(timer);
        timer = null;
    };
    const end = () => { stopStepAwayWatch(episode.id); };
    const tick = () => {
        timer = null;
        const fw = w.MinigameFramework;
        const current = fw?.currentMinigame || null;
        if (current && current._sceneType === 'episode-runner' && current !== opener) {
            // Another open: the learner is at the kiosk and that open resumes at the next stage. A runner
            // that Look up is still closing is not "another open".
            end();
            return;
        }
        const g = globals() || {};
        const done = g[beat.doneGlobal] === true;
        if (done && !current) {
            if (graceAt === null) graceAt = now();
            if (now() - graceAt >= graceMs) {
                end();
                const reopenNow = () => { fw?.startMinigame?.('episode-runner', null, { ...reopen }); };
                Promise.resolve().then(() => (typeof returnToSpot === 'function' ? returnToSpot() : null))
                    .catch((e) => console.error('[episode] step-away return failed:', e))
                    .then(reopenNow);
                return;
            }
        } else {
            graceAt = null;
        }
        if (++ticks > CALL_WAIT_LIMIT) { end(); return; }
        timer = schedule(tick, CALL_WAIT_MS);
    };
    stepAwayWatches.set(episode.id, { stop, tick });
    timer = schedule(tick, CALL_WAIT_MS);
    return { stop: () => stopStepAwayWatch(episode.id), tick };
}

/** Whether the episode's debrief comes after `stage` (the triage result is then not the last word). */
export function debriefAfter(episode, stage) {
    const stages = stagesFor(episode);
    const at = stages.indexOf(stage);
    return at >= 0 && stages.indexOf('debrief') > at;
}

/**
 * D227 A1: whether the triage round for `stage` skips its result card, so the debrief opens with
 * the band headline and the score. A self-paced run with a debrief after the round; a facilitated
 * run (a shared screen that hides the per-learner score) keeps its result card as before.
 */
export function foldsResult(episode, stage) {
    return episode?.facilitated !== true && debriefAfter(episode, stage);
}

/** D227 A1: the folded round's band headline: the live result's, else the set's band for its percent. */
export function foldedHeadline(result, set) {
    if (!isObj(result)) return null;
    if (isStr(result.headline)) return result.headline;
    if (!Number.isFinite(result.percent)) return null;
    const band = bandFor(result.percent, Array.isArray(set?.bands) ? set.bands : undefined);
    return isStr(band?.headline) ? band.headline : null;
}

/**
 * D227 A1: the folded card's next step for the weakest skill when the set authors no `nudges` line:
 * the set's resultCopy.weakest ({it} becomes it/them), else the awareness line for its message kinds.
 */
export function foldedWeakestNudge(set, several = false) {
    const it = several ? 'them' : 'it';
    const own = isObj(set?.resultCopy) && isStr(set.resultCopy.weakest) ? set.resultCopy.weakest : null;
    if (own) return own.split('{it}').join(it);
    const kinds = (Array.isArray(set?.messages) ? set.messages : []).filter(isObj).map((m) => (isStr(m.kind) ? m.kind : 'email'));
    return awarenessWeakestLineFor(kinds, it);
}

function isNormal(success, result) {
    return success === true && !(result && result.aborted === true);
}

export default EpisodeRunnerMinigame;
