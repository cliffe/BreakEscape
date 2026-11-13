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

import { stateKey, readState } from '../minigames/episode-runner/episode-model.js';

const win = () => (typeof window !== 'undefined' ? window : {});

export const EPISODE_MISSING = 'This kiosk has no exercise to run.';

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
