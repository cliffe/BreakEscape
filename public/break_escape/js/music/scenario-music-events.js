/**
 * scenario-music-events.js
 *
 * Data-driven music event wiring for Break Escape.
 * Reads the `music.events` array from the loaded scenario JSON and registers
 * the appropriate listeners on window.eventDispatcher so that gameplay events
 * automatically switch the active music playlist via MusicController.
 *
 * Supported trigger formats:
 *   "game_loaded"                          — fires once when the game is ready
 *   "conversation_closed:<npcId>"          — NPC conversation window closes
 *   "npc_hostile_state_changed"            — any NPC's hostile flag changes
 *   "global_variable_changed:<varName>"    — a global game variable changes
 *   "all_hostiles_ko"                      — special: all currently hostile NPCs are KO'd
 *
 * Optional per-event fields:
 *   condition  — JS expression string evaluated against event data (e.g. "isHostile === true")
 *   fade       — boolean, defaults to true
 */

import MusicController from './music-controller.js';

const TAG = '[ScenarioMusic]';

/**
 * Safely evaluate a condition string against an event data object.
 * Returns true if no condition is specified.
 * Isolates eval so unknown properties don't throw.
 *
 * @param {string|undefined} condition - JS expression string
 * @param {object} data               - event data object
 * @returns {boolean}
 */
function evaluateCondition(condition, data) {
    if (!condition) return true;
    try {
        // Build a local scope from the event data keys so the expression can
        // reference them directly (e.g. "isHostile === true" or "value === true").
        // Also expose globalVars (window.gameState.globalVariables) so conditions
        // can check persistent state like "!globalVars.briefing_played".
        const scope = Object.assign(
            { globalVars: window.gameState?.globalVariables || {} },
            data || {}
        );
        const keys = Object.keys(scope);
        const values = keys.map(k => scope[k]);
        // eslint-disable-next-line no-new-func
        const fn = new Function(...keys, `return (${condition});`);
        return !!fn(...values);
    } catch (err) {
        console.warn(`${TAG} Failed to evaluate condition "${condition}":`, err);
        return false;
    }
}

/**
 * Check whether any still-alive hostile NPC exists.
 * Returns true if at least one NPC is hostile AND not KO'd.
 *
 * @returns {boolean}
 */
function anyHostilesAlive() {
    if (!window.npcManager || !window.npcHostileSystem) return false;

    const npcs = window.npcManager.getAllNPCs(); // Array of NPC objects
    for (const npc of npcs) {
        const npcId = npc.id;
        if (
            window.npcHostileSystem.isNPCHostile(npcId) &&
            !window.npcHostileSystem.isNPCKO(npcId)
        ) {
            return true;
        }
    }
    return false;
}

/**
 * Handle a music event entry — switch playlist or play a specific track,
 * optionally stopping after one track and/or displaying a credits scroll.
 *
 * Supported entry fields (in addition to trigger/condition/fade):
 *   track          — title of a specific track to play (requires playlist)
 *   playlist       — playlist key to switch to
 *   stopAfterTrack — if true, stop playback when the current track ends
 *   credits        — array of { text, style?, condition? } lines for the
 *                    BondVisualiser credits scroll; conditions are evaluated
 *                    against globalVars at trigger time
 *
 * @param {object} entry - music event config entry
 * @param {object} data  - event payload
 */
function switchIfConditionMet(entry, data) {
    if (!evaluateCondition(entry.condition, data)) return;

    const fade = entry.fade !== false; // default true

    // An entry carrying credits owns the visualiser itself, gated on the server
    // agreeing the mission concluded. Suppress the auto-open that would
    // otherwise fire from bond-visualiser.js the instant the playlist below
    // switches to 'victory' -- that happens synchronously, long before the
    // server answers, and on a refusal it put a fullscreen end-of-mission
    // screen in front of a player who was simultaneously being told they were
    // not finished.
    const ownsVisualiser = !!entry.credits?.length;
    if (ownsVisualiser && window.BondVisualiser?.setAutoOpenSuppressed) {
        window.BondVisualiser.setAutoOpenSuppressed(true);
    }

    // ── Music playback ────────────────────────────────────────────────────────
    if (entry.track && entry.playlist) {
        console.log(`${TAG} Trigger '${entry.trigger}' → track '${entry.track}' in '${entry.playlist}' (fade=${fade})`);
        MusicController.playTrack(entry.track, entry.playlist, fade);
    } else if (entry.playlist) {
        console.log(`${TAG} Trigger '${entry.trigger}' → playlist '${entry.playlist}' (fade=${fade})`);
        MusicController.switchPlaylist(entry.playlist, fade);
    }

    // ── Stop-after-one-track flag ─────────────────────────────────────────────
    // stopAfterTrack: stop music + auto-close visualiser (legacy)
    // autoStop:       stop music but keep visualiser open
    if (entry.stopAfterTrack || entry.autoStop) {
        MusicController.stopAfterCurrentTrack();
    }

    // ── Credits scroll ────────────────────────────────────────────────────────
    if (entry.credits?.length && window.BondVisualiser) {
        const filteredLines = entry.credits
            .filter(item => evaluateCondition(item.condition, data))
            .map(item => ({ text: item.text ?? '', style: item.style ?? '' }));

        // Credits mean the story is over, so this is also the moment the
        // mission concludes. The client is trusted to decide the story ended;
        // the server still gates on the scenario's concludeRequires (see
        // Game#conclude_mission!). Credits therefore open only once the server
        // has agreed, so MISSION COMPLETE can no longer print over a game the
        // server still calls in_progress -- which is exactly what used to
        // happen here, because this path opened the visualiser and never asked.
        const openCredits = () => window.BondVisualiser.open({
            credits:      filteredLines,
            autoClose:    !!entry.stopAfterTrack,  // legacy: close when track ends
            autoStop:     !!entry.autoStop,         // new: stop music, keep vis open
            disableClose: !!entry.disableClose,
        });

        concludeMission().then((result) => {
            // Decision made: restore normal auto-open behaviour for any later
            // victory playlist change.
            window.BondVisualiser?.setAutoOpenSuppressed?.(false);

            if (result.concluded) {
                openCredits();
                return;
            }
            // Refused: the scenario declared technical work that is not done.
            // Say what is outstanding rather than rolling credits.
            console.warn(`${TAG} Conclusion refused; missing:`, result.missing);
            if (window.gameAlert) {
                window.gameAlert(
                    'Not finished yet -- there is outstanding work on their network before this is over.',
                    'warning',
                    'Not Yet',
                    4000
                );
            }
        });
    }
}

/**
 * Ask the server to conclude the mission. Resolves { concluded, missing }.
 *
 * A network failure resolves as concluded:true. The player has reached the end
 * of the story and a dropped request must not cost them the ending; the server
 * record reconciles on the next sync either way.
 */
async function concludeMission() {
    const gameId = window.breakEscapeConfig?.gameId;
    if (!gameId) return { concluded: true, missing: [] };

    let response;
    try {
        response = await fetch(`/break_escape/games/${gameId}/conclude`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || '',
            },
        });
    } catch (err) {
        // The request never arrived (offline, navigation, connection dropped).
        // Fail open: the player reached the end of the story and must not lose
        // the ending to a dropped packet.
        console.warn(`${TAG} conclude request did not reach the server; showing credits anyway`, err);
        return { concluded: true, missing: [] };
    }

    // A broken endpoint must be loud. This used to be swallowed by the catch
    // above -- response.json() throws on a 500's HTML body -- so a server that
    // never concluded the mission still rolled the credits, and the only trace
    // was a game record stuck in in_progress that nothing pointed at. Credits
    // still show (that is the fail-open choice, and it is the player's ending),
    // but the failure is now stated rather than disguised as success.
    if (!response.ok) {
        console.error(
            `${TAG} conclude endpoint returned HTTP ${response.status}. ` +
            'Showing credits, but the server has NOT recorded this mission as concluded — ' +
            'the game record will still say in_progress. This is a bug, not a player action.'
        );
        return { concluded: true, missing: [] };
    }

    try {
        const json = await response.json();
        return {
            concluded: !!(json.success || json.alreadyConcluded),
            missing: json.missing || [],
        };
    } catch (err) {
        console.error(`${TAG} conclude endpoint returned a 200 that is not JSON; showing credits anyway`, err);
        return { concluded: true, missing: [] };
    }
}

/**
 * Wire up all music event listeners declared in the scenario.
 * Safe to call multiple times — cleans up previous listeners first.
 *
 * @param {object} scenario - window.gameScenario
 */
let _cleanupFns = [];

export function initScenarioMusicEvents(scenario) {
    // Remove any previously registered listeners from a prior call
    _cleanupFns.forEach(fn => fn());
    _cleanupFns = [];

    const musicConfig = scenario?.music;
    if (!musicConfig?.events?.length) {
        console.log(`${TAG} No music events configured in scenario — starting default playlist.`);
        MusicController.startDefault();
        return;
    }

    if (!window.eventDispatcher) {
        console.warn(`${TAG} window.eventDispatcher not available — music events will not fire.`);
        return;
    }

    console.log(`${TAG} Initialising ${musicConfig.events.length} music event(s) from scenario.`);

    for (const entry of musicConfig.events) {
        const { trigger } = entry;

        if (trigger === 'all_hostiles_ko') {
            // Special virtual trigger: listen to every npc_ko and check remaining hostiles
            const handler = (data) => {
                if (anyHostilesAlive()) return; // still fighting
                switchIfConditionMet(entry, data);
            };
            window.eventDispatcher.on('npc_ko', handler);
            _cleanupFns.push(() => window.eventDispatcher.off('npc_ko', handler));
            console.log(`${TAG} Registered 'all_hostiles_ko' (via npc_ko) → '${entry.track || entry.playlist}'`);

        } else {
            const handler = (data) => switchIfConditionMet(entry, data);
            window.eventDispatcher.on(trigger, handler);
            _cleanupFns.push(() => window.eventDispatcher.off(trigger, handler));
            console.log(`${TAG} Registered '${trigger}' → '${entry.track || entry.playlist}'`);
        }
    }

    // If no game_loaded trigger was registered, nothing will start music at load time.
    // Fall back to the default playlist so background music still plays.
    const hasGameLoadedTrigger = musicConfig.events.some(e => e.trigger === 'game_loaded');
    if (!hasGameLoadedTrigger) {
        console.log(`${TAG} No game_loaded trigger — starting default playlist.`);
        MusicController.startDefault();
    }
}
