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
import { buildEndSequence, replayEndingEntry } from './closing-sequence.js';
import { playEndingMusic, whenEndingAudible } from './ending-audio.js';
import { MUSIC_CONFIG } from './music-config.js';

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
 * Options for the credits screen on reload of a concluded game: the same card and
 * credits the live ending showed, rebuilt from the saved globals. No music or
 * forced-close options, since nothing is playing. Null when the scenario has none.
 * @param {object} scenario - window.gameScenario
 * @param {object} [globals] - defaults to window.gameState.globalVariables
 */
export function endingReplayOptions(scenario, globals) {
    const found = replayEndingEntry(
        scenario?.music?.events,
        globals || window.gameState?.globalVariables || {},
        (cond, data) => evaluateCondition(cond, data)
    );
    if (!found) return null;
    return { credits: found.sequence, headerText: found.entry.headerText, statusText: found.entry.statusText };
}
if (typeof window !== 'undefined') window.endingReplayOptions = endingReplayOptions;

/**
 * The global that records which song the live ending played, so a reload of the
 * concluded game plays the same one (a shuffled playlist would pick another). It is
 * not declared in any scenario, so it stays out of the inks; it is saved to the
 * server with the other globals, so it holds on any device.
 */
export const ENDING_TRACK_GLOBAL = 'ending_track_heard';

/** Set a global the way the game's own setters do, and save it. */
function setEndingTrackGlobal(title, syncNow) {
    const globals = window.gameState?.globalVariables;
    if (!globals || !title) return;
    const oldValue = globals[ENDING_TRACK_GLOBAL];
    if (oldValue === title) return;
    globals[ENDING_TRACK_GLOBAL] = title;
    window.npcConversationStateManager?.broadcastGlobalVariableChange?.(ENDING_TRACK_GLOBAL, title, null);
    window.eventDispatcher?.emit?.(`global_variable_changed:${ENDING_TRACK_GLOBAL}`,
        { name: ENDING_TRACK_GLOBAL, value: title, oldValue });
    console.log(`${TAG} Ending track recorded: '${title}'`);
    if (syncNow) window.stateSync?.sync?.();
}

/**
 * Record the song an ending entry is playing. Call right after asking
 * MusicController for it: the leader has chosen the track by then (the conclude
 * request's sync then carries it); otherwise wait for its trackchange and save then.
 */
function rememberEndingTrack(entry) {
    if (!entry?.playlist) return;
    const st = MusicController.getState?.();
    if (MusicController.isLeader && st?.playlist === entry.playlist && st.trackTitle) {
        setEndingTrackGlobal(st.trackTitle, false);
        return;
    }
    const onTrack = (e) => {
        if (e?.detail?.playlist !== entry.playlist) return;
        window.removeEventListener('musiccontroller:trackchange', onTrack);
        setEndingTrackGlobal(e.detail.title, true);
    };
    window.addEventListener('musiccontroller:trackchange', onTrack);
}

// Once an ending's credits are up, the ending owns the music: no later event (a
// game_loaded mood on reload, a global set after the credits) plays under or after it.
let _endingOwnsMusic = false;
export function endingOwnsMusic() { return _endingOwnsMusic; }
export function _resetEndingMusicLock() { _endingOwnsMusic = false; }

/**
 * Reload of a concluded game: play the track the live ending played with these
 * credits (the same entry endingReplayOptions rebuilds them from). On a fresh page
 * the browser may hold audio until the first click or key; the returned options
 * make the visualiser hold the credits until the track sounds.
 * @param {object} scenario - window.gameScenario
 * @param {object} [globals]
 * @param {object} [deps] - passed to playEndingMusic (tests)
 * @returns {{creditsAfter: Promise, autoStop?: boolean}|null}
 */
export function startEndingReplayMusic(scenario, globals, deps) {
    const saved = globals || window.gameState?.globalVariables || {};
    const found = replayEndingEntry(
        scenario?.music?.events,
        saved,
        (cond, data) => evaluateCondition(cond, data)
    );
    if (!found) return null;
    _endingOwnsMusic = true;
    // A shuffled playlist (m10 arrest, m09 victory) picked a song at the live ending;
    // play that one again, when it is still in the entry's playlist.
    const heard = saved[ENDING_TRACK_GLOBAL];
    const inPlaylist = typeof heard === 'string' &&
        !!MUSIC_CONFIG.playlists[found.entry.playlist]?.tracks?.some(t => t.title === heard);
    const entry = inPlaylist ? { ...found.entry, track: heard } : found.entry;
    const { ready } = playEndingMusic(entry, { mc: MusicController, ...deps });
    const opts = { creditsAfter: ready };
    if (found.entry.autoStop) opts.autoStop = true;
    return opts;
}
if (typeof window !== 'undefined') window.startEndingReplayMusic = startEndingReplayMusic;

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
 *                    against globalVars at trigger time. A { section, people,
 *                    lines } item is a block (closing-sequence.js)
 *   closingCard    — { lines, teaser } shown before the credits (closing-sequence.js)
 *   headerText     — visualiser header for this ending (default MISSION COMPLETE // AUDIO INTEL)
 *   statusText     — visualiser STATUS row for this ending (default MONITORING)
 *
 * @param {object} entry - music event config entry
 * @param {object} data  - event payload
 */
function switchIfConditionMet(entry, data) {
    if (!evaluateCondition(entry.condition, data)) return;

    // The credits are up (or were, on a concluded game): leave the ending's music alone.
    if (_endingOwnsMusic) {
        console.log(`${TAG} Trigger '${entry.trigger}' ignored: the ending owns the music`);
        return;
    }

    const fade = entry.fade !== false; // default true

    // An entry carrying credits owns the visualiser itself, gated on the server
    // agreeing the mission concluded. Suppress the auto-open that would
    // otherwise fire from bond-visualiser.js the instant the playlist below
    // switches to 'victory' -- that happens synchronously, long before the
    // server answers, and on a refusal it put a fullscreen end-of-mission
    // screen in front of a player who was simultaneously being told they were
    // not finished.
    const hasEnding = !!(entry.credits?.length || entry.closingCard);
    const ownsVisualiser = hasEnding;
    if (ownsVisualiser && window.BondVisualiser?.setAutoOpenSuppressed) {
        window.BondVisualiser.setAutoOpenSuppressed(true);
    }

    // An ending can fire before the player has clicked or pressed a key on this page
    // (m10's catch-up on load), while the browser still holds audio: the credits then
    // wait for the first gesture and the track, rather than scrolling past unheard.
    // Watching starts before the track is asked for, so its trackchange is seen.
    const audible = hasEnding ? whenEndingAudible(entry.track || entry.playlist, { mc: MusicController }) : null;

    // ── Music playback ────────────────────────────────────────────────────────
    if (entry.track && entry.playlist) {
        console.log(`${TAG} Trigger '${entry.trigger}' → track '${entry.track}' in '${entry.playlist}' (fade=${fade})`);
        MusicController.playTrack(entry.track, entry.playlist, fade);
    } else if (entry.playlist) {
        console.log(`${TAG} Trigger '${entry.trigger}' → playlist '${entry.playlist}' (fade=${fade})`);
        MusicController.switchPlaylist(entry.playlist, fade);
    }

    if (hasEnding) rememberEndingTrack(entry);

    // ── Stop-after-one-track flag ─────────────────────────────────────────────
    // stopAfterTrack: stop music + auto-close visualiser (legacy)
    // autoStop:       stop music but keep visualiser open
    if (entry.stopAfterTrack || entry.autoStop) {
        MusicController.stopAfterCurrentTrack();
    }

    // ── Credits scroll ────────────────────────────────────────────────────────
    if (hasEnding && window.BondVisualiser) {
        // closingCard (card + teaser) first, then the credits with sections and
        // per-person clauses resolved (closing-sequence.js). Chosen now, at the
        // trigger, as the plain conditioned lines always were.
        const filteredLines = buildEndSequence(
            entry,
            window.gameState?.globalVariables || {},
            condition => evaluateCondition(condition, data)
        );

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
            headerText:   entry.headerText,             // optional, e.g. "MISSION FAILED // AUDIO INTEL"
            statusText:   entry.statusText,             // optional, e.g. "COMPROMISED"
            creditsAfter: MusicController.context?.state === 'suspended' ? audible?.ready : undefined,
        });

        concludeMission().then((result) => {
            // Decision made: restore normal auto-open behaviour for any later
            // victory playlist change.
            window.BondVisualiser?.setAutoOpenSuppressed?.(false);

            if (result.concluded) {
                _endingOwnsMusic = true;
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

    // Save first: the server checks concludeRequires against stored state, and a
    // global set moments ago (sis01's debrief_complete) only reaches it with the
    // 30 s sync. Without this the server refuses an ending the player has earned.
    await window.stateSync?.sync?.();
    // Once more: a no-op when the first was saved, a resend when it was answered
    // stale or failed. The conclude also snapshots the story globals that later
    // missions import (CARRY_OVER_PLAN.md), so the debrief's last choices matter.
    await window.stateSync?.sync?.();

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
