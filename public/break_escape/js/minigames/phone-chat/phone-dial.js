/**
 * Outgoing calls: the dialling timeline and the ring-back tone (phone calls plan 2.5).
 *
 * The call screen shows "Calling..." for DIAL_MS. If the entry's `when` holds (or it is a callback)
 * the call then connects; if not it keeps ringing for RING_OUT_MS, shows "No answer" for
 * NO_ANSWER_BEAT_MS and ends. The ring-back is the UK tone (400 Hz + 450 Hz, 0.4 s on, 0.2 s off,
 * 0.4 s on, 2 s off) made with Web Audio, its gain the sound manager's master volume times its
 * notifications volume.
 *
 * No imports, so node tests load it on its own.
 */

export const DIAL_MS = 2500;
export const RING_OUT_MS = 6000;
export const NO_ANSWER_BEAT_MS = 1000;

/** UK ring-back cadence, in seconds: on, off, on, off (one 3 s cycle). */
export const RINGBACK_CADENCE = Object.freeze([0.4, 0.2, 0.4, 2.0]);
export const RINGBACK_FREQUENCIES = Object.freeze([400, 450]);
/** The tone's own level before the volume settings (it is a background beep, not a ringtone). */
const RINGBACK_BASE_GAIN = 0.2;

/** The gain for the tone from the sound manager's volumes: master * notifications. */
export function ringbackGain(soundManager) {
    const master = Number.isFinite(soundManager?.masterVolume) ? soundManager.masterVolume : 1;
    const notif = Number.isFinite(soundManager?.volumeSettings?.notifications) ? soundManager.volumeSettings.notifications : 0.6;
    if (soundManager && soundManager.enabled === false) return 0;
    return Math.max(0, Math.min(1, master * notif)) * RINGBACK_BASE_GAIN;
}

/**
 * Start the ring-back. Returns `{ stop }`; a missing or failing audio context gives a no-op tone.
 * @param {Object} [win] - window (for tests): AudioContext, musicController, soundManager
 */
export function startRingback(win = (typeof window !== 'undefined' ? window : null)) {
    const none = { stop() {}, gain: 0 };
    if (!win) return none;
    let ctx = null;
    let ownsCtx = false;
    try {
        ctx = win.musicController?.context || null;
        if (!ctx) {
            const Ctor = win.AudioContext || win.webkitAudioContext;
            if (!Ctor) return none;
            ctx = new Ctor();
            ownsCtx = true;
        }
        const level = ringbackGain(win.soundManager);
        if (level <= 0) return none;
        if (ctx.state === 'suspended') ctx.resume?.();
        const gain = ctx.createGain();
        gain.gain.value = 0;
        gain.connect(ctx.destination);
        const oscs = RINGBACK_FREQUENCIES.map((f) => {
            const o = ctx.createOscillator();
            o.type = 'sine';
            o.frequency.value = f;
            o.connect(gain);
            o.start();
            return o;
        });
        // Schedule a minute of cadence in one go; stop() cancels what is left
        const t0 = ctx.currentTime + 0.05;
        let t = t0;
        const cycle = RINGBACK_CADENCE.reduce((a, b) => a + b, 0);
        for (let i = 0; i < 20; i++) {
            let at = t;
            RINGBACK_CADENCE.forEach((len, step) => {
                gain.gain.setValueAtTime(step % 2 === 0 ? level : 0, at);
                at += len;
            });
            t += cycle;
        }
        let stopped = false;
        return {
            gain: level,
            stop() {
                if (stopped) return;
                stopped = true;
                try {
                    gain.gain.cancelScheduledValues(ctx.currentTime);
                    gain.gain.setValueAtTime(0, ctx.currentTime);
                    oscs.forEach((o) => { try { o.stop(); } catch (e) { /* already stopped */ } });
                    gain.disconnect();
                    if (ownsCtx) ctx.close?.();
                } catch (e) { /* the tone is only a sound */ }
            },
        };
    } catch (e) {
        return none;
    }
}
