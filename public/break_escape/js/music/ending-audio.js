/**
 * Ending audio: what plays under the end credits.
 *
 * 1. silenceBackgroundForEnding(): when the credits roll, every looping game sound
 *    (room ambience, footsteps, the low-health heartbeat, any other Phaser loop) fades
 *    out and stops, and room ambience stays off for the rest of the page: the game is
 *    over, so closing the credits does not bring the server-room hum back. The Phaser
 *    scene is paused under the visualiser, so the fade runs on timers, not scene tweens.
 *
 * 2. playEndingMusic(entry): the music an ending's music-event entry plays (its track
 *    in its playlist, or the playlist), with its autoStop / stopAfterTrack. Used on
 *    reload of a concluded game (F22), where nothing re-fires the event. Returns a
 *    promise that resolves once the track is actually sounding: the AudioContext is
 *    running (browsers keep it suspended until the first click or key on a fresh
 *    page) and MusicController has started a track. The credits wait on it, so they
 *    cannot run out before the music starts.
 *
 * Takes its dependencies as arguments (defaulting to the globals) so node tests can
 * drive it with fakes.
 */

const TAG = '[EndingAudio]';
const GESTURES = ['pointerdown', 'mousedown', 'keydown', 'touchstart', 'click'];

/** Shown on the credits layer while the ending waits for the first click or key. */
export const AUDIO_HOLD_TEXT = 'CLICK OR PRESS ANY KEY TO PLAY THE ENDING';

/** How long the credits wait for a track that never reports starting (load failure). */
export const TRACK_START_TIMEOUT_MS = 12000;

let _silenced = false;

/** True once an ending has silenced the game for this page. */
export function endingSilenced() { return _silenced; }

/** Test hook: forget a previous ending. */
export function _resetEndingAudio() { _silenced = false; }

/** Fade one Phaser sound to nothing on timers, then stop it. */
function fadeOutAndStop(sound, fadeMs, timers) {
    const from = typeof sound.volume === 'number' ? sound.volume : 1;
    if (!fadeMs || fadeMs <= 0 || from <= 0) {
        try { sound.stop(); } catch (_) { /* already gone */ }
        return;
    }
    const steps = 8;
    let i = 0;
    const iv = timers.setInterval(() => {
        i++;
        try { sound.setVolume?.(from * Math.max(0, 1 - i / steps)); } catch (_) { /* destroyed */ }
        if (i >= steps) {
            timers.clearInterval(iv);
            try { sound.stop(); } catch (_) { /* already gone */ }
        }
    }, Math.max(10, Math.round(fadeMs / steps)));
}

/**
 * Stop everything under the ending except the ending's own music (MusicController,
 * which is not a Phaser sound) and speech (TTS, also not a Phaser sound).
 * @returns {string[]} keys of the sounds it stopped
 */
export function silenceBackgroundForEnding({ win = globalThis.window, fadeMs = 800, timers = globalThis } = {}) {
    _silenced = true;
    const sm = win?.soundManager;
    // Ambience off for good: no room change after the credits starts it again.
    sm?.suppressAmbience?.(true);

    const stopped = [];
    const seen = new Set();
    const consider = (sound) => {
        if (!sound || seen.has(sound)) return;
        seen.add(sound);
        if (!sound.isPlaying) return;
        const looping = !!(sound.loop || sound.currentConfig?.loop || sound.config?.loop);
        const ambient = sm && sound.key && sound.key === sm._suppressedAmbientKey;
        if (!looping && !ambient) return;
        stopped.push(sound.key);
        fadeOutAndStop(sound, fadeMs, timers);
    };
    for (const s of win?.game?.sound?.sounds || []) consider(s);
    for (const s of Object.values(sm?.sounds || {})) consider(s);

    console.log(`${TAG} credits: background stopped`, stopped);
    return stopped;
}

/**
 * Resolve once the ending's music is audible: the AudioContext is running and
 * MusicController has started a track since this call. While the browser holds
 * audio (no click or key on this page yet), the first gesture resumes the context.
 * Call it before asking MusicController for the track, so its trackchange is seen.
 * @param {string} label - for the log
 * @param {object} [deps] - { mc, win, doc, timeoutMs, timers }
 * @returns {{ ready: Promise<string>, waitingForGesture: boolean, cleanups: Function[] }}
 *   ready resolves with 'started' or 'timeout' (a track that never reports starting)
 */
export function whenEndingAudible(label, {
    mc = globalThis.window?.MusicController,
    win = globalThis.window,
    doc = globalThis.document,
    timeoutMs = TRACK_START_TIMEOUT_MS,
    timers = globalThis,
} = {}) {
    if (!mc) return { ready: Promise.resolve('none'), waitingForGesture: false, cleanups: [] };
    let trackStarted = false;
    let resolveReady;
    const ready = new Promise(r => { resolveReady = r; });
    let done = false;
    let timeoutId = null;
    const cleanups = [];
    const finish = (why) => {
        if (done) return;
        done = true;
        cleanups.forEach(fn => fn());
        if (timeoutId) timers.clearTimeout(timeoutId);
        console.log(`${TAG} ending music ${why}: '${label}'`);
        resolveReady(why);
    };
    const running = () => mc.context?.state !== 'suspended';
    const check = () => { if (trackStarted && running()) finish('started'); };

    const onTrack = () => { trackStarted = true; check(); };
    win?.addEventListener?.('musiccontroller:trackchange', onTrack);
    cleanups.push(() => win?.removeEventListener?.('musiccontroller:trackchange', onTrack));

    const startTimeout = () => {
        if (timeoutId || done) return;
        timeoutId = timers.setTimeout(() => finish('timeout'), timeoutMs);
        timeoutId?.unref?.(); // node tests: do not hold the process open
    };

    const waitingForGesture = !running();
    if (waitingForGesture) {
        console.log(`${TAG} audio locked until the first click or key; credits held`);
        const onGesture = () => {
            GESTURES.forEach(t => doc?.removeEventListener?.(t, onGesture, true));
            const p = mc.context?.resume?.();
            Promise.resolve(p).catch(() => {}).then(() => { check(); startTimeout(); });
        };
        GESTURES.forEach(t => doc?.addEventListener?.(t, onGesture, true));
        cleanups.push(() => GESTURES.forEach(t => doc?.removeEventListener?.(t, onGesture, true)));
    } else {
        startTimeout();
    }
    return { ready, waitingForGesture, cleanups };
}

/**
 * Play an ending entry's music (reload of a concluded game) and resolve when it is
 * audible (whenEndingAudible).
 * @param {object} entry - the music event entry that carries the credits
 * @param {object} [deps] - { mc, win, doc, timeoutMs, timers }
 * @returns {{ ready: Promise<string>, waitingForGesture: boolean }}
 */
export function playEndingMusic(entry, deps = {}) {
    const mc = deps.mc ?? globalThis.window?.MusicController;
    const win = deps.win ?? globalThis.window;
    if (!entry || !mc || !(entry.playlist || entry.track)) {
        return { ready: Promise.resolve('none'), waitingForGesture: false };
    }
    const audible = whenEndingAudible(entry.track || entry.playlist, { ...deps, mc, win });

    const play = () => {
        // The victory playlist auto-opens a bare visualiser; this one is already open.
        win?.BondVisualiser?.setAutoOpenSuppressed?.(true);
        try {
            if (entry.track && entry.playlist) mc.playTrack(entry.track, entry.playlist, false);
            else mc.switchPlaylist(entry.playlist, false);
            if (entry.autoStop || entry.stopAfterTrack) mc.stopAfterCurrentTrack();
        } finally {
            win?.BondVisualiser?.setAutoOpenSuppressed?.(false);
        }
        console.log(`${TAG} ending music requested: '${entry.track || '(playlist)'}' in '${entry.playlist}'`);
    };

    // A follower tab's commands go nowhere on a fresh page; wait to lead.
    if (mc.isLeader === false) {
        const onLeader = (e) => {
            if (!e?.detail?.isLeader) return;
            win?.removeEventListener?.('musiccontroller:leaderchange', onLeader);
            play();
        };
        win?.addEventListener?.('musiccontroller:leaderchange', onLeader);
        audible.cleanups.push(() => win?.removeEventListener?.('musiccontroller:leaderchange', onLeader));
        mc.requestLeadership?.();
    } else {
        play();
    }
    return { ready: audible.ready, waitingForGesture: audible.waitingForGesture };
}
