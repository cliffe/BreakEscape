/**
 * Awareness episode starter (SE design 11 N1; PHASE7_PACKETS §2.3, packet P7-A).
 *
 * startEpisodeRunner(lockable, options) opens the 'episode-runner' overlay for the
 * kiosk's episode. The kiosk carries only minigameData.episodeId; it must equal
 * social.awarenessEpisode.id, or the player gets a gameAlert and nothing opens.
 * P7-H puts this on window (minigame-starters.js) and registers the scene.
 *
 * Returns the params the runner was started with, or null.
 */

import { stateKey, readState, stepAwayHeld, worldFor, writeKind, callOutcomeKey } from '../minigames/episode-runner/episode-model.js';
import { writeGlobal } from './global-writer.js';

const win = () => (typeof window !== 'undefined' ? window : {});

export const EPISODE_MISSING = 'This kiosk has no exercise to run.';
export const STEP_AWAY_HOLD = 'episode-step-away';

/**
 * EC1 (d): the success screen's step-away hold. Read live from the saved episode state on each of
 * the screen's idle polls, so it is in place from boot and after a reload with no write of its
 * own: it holds while a stepAway episode has its defend round complete (the stage done, or the
 * round's done global true while the stage still reads defend) and its debrief neither finished
 * nor closed. Registered on window.successScreenHolds (the success screen's registry) without
 * importing that module.
 */
export function stepAwayHoldNow(w = win()) {
    const episode = w.gameScenario?.social?.awarenessEpisode;
    if (!episode || typeof episode !== 'object' || !episode.id) return false;
    const globals = w.gameState?.globalVariables;
    return stepAwayHeld(episode, globals?.[stateKey(episode.id)], globals);
}

export function installStepAwayHold(w = win()) {
    if (!w || typeof w !== 'object') return;
    if (!(w.successScreenHolds instanceof Map)) w.successScreenHolds = new Map();
    w.successScreenHolds.set(STEP_AWAY_HOLD, () => stepAwayHoldNow(w));
}

if (typeof window !== 'undefined') installStepAwayHold(window);

/**
 * E2: settle a world hold left open by a reload. The hold's cap clock and watcher live in page
 * memory, so after a reload nothing would end it until the learner opened the kiosk, and the
 * beat's window mappings gated on the hold global would stay armed. On game load this writes the
 * hold global true (one delta, then a sync) when the episode has a hold, its call's outcome is
 * set, the learner is at the write stage and the hold global is falsy. It does not touch the stage
 * state or open anything: the runner's own open completes the stage and flips. Returns true when
 * it wrote. `write` is a test seam.
 */
export function settleHeldWorld(w = win(), write = writeGlobal) {
    const episode = w.gameScenario?.social?.awarenessEpisode;
    if (!episode || typeof episode !== 'object' || !episode.id) return false;
    const hold = worldFor(episode)?.holdUntil;
    if (!hold || writeKind(episode) !== 'call') return false;
    const globals = w.gameState?.globalVariables;
    if (!globals || globals[hold]) return false;
    const outcome = globals[callOutcomeKey(episode.attack.callId)];
    if (typeof outcome !== 'string' || !outcome) return false;
    // the runner's own test (_settleCall): only a learner already at the write stage has made the call
    if (readState(episode, globals[stateKey(episode.id)]).stage !== 'write') return false;
    write(hold, true, { openChat: false });
    w.stateSync?.sync?.();
    return true;
}

if (typeof window !== 'undefined') window.settleHeldWorld = () => settleHeldWorld(window);

export function startEpisodeRunner(lockable, options = {}) {
    const w = win();
    const episodeId = lockable?.scenarioData?.minigameData?.episodeId;
    const episode = w.gameScenario?.social?.awarenessEpisode;
    if (!episode || typeof episode !== 'object' || !episodeId || episode.id !== episodeId) {
        console.error(`[episode] Kiosk episodeId "${episodeId}" does not match social.awarenessEpisode`,
            episode?.id ?? null);
        w.gameAlert?.(EPISODE_MISSING, 'error', 'Error', 3000);
        return null;
    }
    if (!w.MinigameFramework) {
        console.error('MinigameFramework not available');
        w.gameAlert?.('Kiosk unavailable.', 'error', 'Error', 3000);
        return null;
    }
    if (!w.MinigameFramework.mainGameScene) {
        w.MinigameFramework.init(w.game);
    }
    const state = readState(episode, w.gameState?.globalVariables?.[stateKey(episode.id)]);
    const params = {
        title: lockable?.scenarioData?.name || episode.brand?.name || 'Exercise',
        lockable,
        episode,
        state,
        requiresKeyboardInput: true, // socialOverlayParams' two keys, without its import chain
        disableClose: true,
        ...options
    };
    w.MinigameFramework.startMinigame('episode-runner', null, params);
    return params;
}

export default startEpisodeRunner;
