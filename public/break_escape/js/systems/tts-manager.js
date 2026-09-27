/**
 * TTS Manager - Text-to-Speech audio playback for person-chat conversations
 *
 * Fetches server-generated MP3 audio for NPC dialog lines and plays via HTML5 Audio.
 * Supports preloading next line while current plays. Gracefully degrades if TTS
 * is unavailable (no API key, network error, etc.).
 *
 * Audio is routed through MusicController (shared AudioContext): the HTMLMediaElement
 * feeds an AnalyserNode (mouth animation) then MusicController.voiceGain so the
 * Voice / Master sliders in the music widget affect TTS level.
 */

import { ApiClient } from '../api-client.js';
import MusicController from '../music/music-controller.js';

class TTSManager {
    constructor() {
        this.audio = new Audio();
        this.enabled = true;
        this.volume = 0.8;
        this.preloadCache = new Map(); // "npcId|text" -> objectURL
        this.onEndedCallback = null;
        this.playing = false;
        this._hasSrc = false; // Whether audio.src has been set to a real URL
        this.currentText = null; // Line now playing — read by portraits for lip-sync

        // Web Audio: one MediaElementSource per <audio> element, shared context
        this._mediaElementSource = null;
        this._analyser = null;
        this._amplitudeBuffer = null;
        this._ttsAudioRouted = false;

        // Per-speaker voice FX (distortion / filtering). Keyed by npcId → profile object or preset name.
        // The active profile is inserted into the graph as: source → [FX] → analyser → voiceGain.
        this._fxProfiles = new Map();
        this._activeFXProfile = null; // resolved profile object currently wired into the graph
        this._fxChain = null;         // { input, output, nodes, oscs } of the live FX chain

        this.audio.volume = 1;
        this.audio.addEventListener('ended', () => {
            this.playing = false;
            if (this.onEndedCallback) {
                this.onEndedCallback();
            }
        });

        this.audio.addEventListener('error', () => {
            this.playing = false;
        });
    }

    /**
     * Play TTS audio for a dialogue line
     * @param {string} npcId - NPC identifier
     * @param {string} text - Clean dialogue text (no "Speaker: " prefix)
     * @returns {Promise<number|null>} Audio duration in ms, or null if unavailable
     */
    async play(npcId, text) {
        if (!this.enabled || !text || !text.trim()) return null;

        // Stop any current playback
        this.stop();

        // Select the FX profile for this speaker (clean for narrator/player/unregistered NPCs).
        // Done before routing so the graph is built with the right chain the first time.
        this._setActiveFXProfile(this._resolveFXProfile(npcId));

        // Shared graph: MediaElement → [FX] → analyser → voiceGain (requires user gesture for ctx)
        this._ensureAudioContext();

        try {
            const key = this._cacheKey(npcId, text);

            // Check preload cache first
            let audioUrl = this.preloadCache.get(key);

            if (audioUrl) {
                // Consume from preload cache
                this.preloadCache.delete(key);
            } else {
                // Fetch from server
                const blob = await ApiClient.getTTS(npcId, text);
                if (!blob) return null;
                audioUrl = URL.createObjectURL(blob);
            }

            this.audio.src = audioUrl;
            this._hasSrc = true;

            // Wait for metadata to get duration
            const duration = await new Promise((resolve, reject) => {
                const onLoaded = () => {
                    cleanup();
                    resolve(Math.ceil(this.audio.duration * 1000));
                };
                const onError = () => {
                    cleanup();
                    reject(new Error('Audio load failed'));
                };
                const timeout = setTimeout(() => {
                    cleanup();
                    reject(new Error('Audio load timeout'));
                }, 10000);

                const cleanup = () => {
                    this.audio.removeEventListener('loadedmetadata', onLoaded);
                    this.audio.removeEventListener('error', onError);
                    clearTimeout(timeout);
                };

                this.audio.addEventListener('loadedmetadata', onLoaded);
                this.audio.addEventListener('error', onError);
            });

            this.currentText = text;
            this.playing = true;

            // Resume shared context if suspended (autoplay policy)
            if (MusicController.context?.state === 'suspended') {
                MusicController.context.resume().catch(() => {});
            }

            await this.audio.play();

            console.log(`[TTS] Playing for ${npcId}: "${text.substring(0, 40)}..." (${duration}ms)`);
            return duration;
        } catch (error) {
            this.playing = false;
            console.warn('[TTS] Play failed:', error.message);
            return null;
        }
    }

    /**
     * Preload audio for an upcoming line (fetch but don't play)
     * @param {string} npcId - NPC identifier
     * @param {string} text - Dialogue text
     */
    async preload(npcId, text) {
        if (!this.enabled || !text || !text.trim()) return;

        const key = this._cacheKey(npcId, text);
        if (this.preloadCache.has(key)) return;

        try {
            const blob = await ApiClient.getTTS(npcId, text);
            if (blob) {
                this.preloadCache.set(key, URL.createObjectURL(blob));
                console.log(`[TTS] Preloaded: "${text.substring(0, 40)}..."`);
            }
        } catch (error) {
            // Silently fail — preloading is best-effort
        }
    }

    /**
     * Stop current playback
     */
    stop() {
        this.currentText = null;
        if (this.playing) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.playing = false;
        }
        // Use removeAttribute instead of src = '' to avoid the
        // "Invalid URI. Load of media resource failed." browser error
        // that fires whenever an empty string is assigned to audio.src.
        if (this._hasSrc) {
            if (this.audio.src.startsWith('blob:')) {
                URL.revokeObjectURL(this.audio.src);
            }
            this.audio.removeAttribute('src');
            this._hasSrc = false;
        }
    }

    /**
     * Check if audio is currently playing
     * @returns {boolean}
     */
    isPlaying() {
        return this.playing;
    }

    /**
     * Set callback for when audio finishes playing
     * @param {Function} callback
     */
    onEnded(callback) {
        this.onEndedCallback = callback;
    }

    /**
     * Set volume (0.0 - 1.0) — drives MusicController voice bus (same as music widget Voice slider).
     * @param {number} vol
     */
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        MusicController.setVoiceVolume(this.volume);
        this.audio.volume = 1;
    }

    /**
     * Enable/disable TTS
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) this.stop();
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.stop();
        for (const url of this.preloadCache.values()) {
            URL.revokeObjectURL(url);
        }
        this.preloadCache.clear();
        this.onEndedCallback = null;

        this._disposeFXChain();
        try { this._mediaElementSource?.disconnect(); } catch (_) {}
        try { this._analyser?.disconnect(); } catch (_) {}
        this._mediaElementSource = null;
        this._analyser = null;
        this._amplitudeBuffer = null;
        this._ttsAudioRouted = false;
        this._activeFXProfile = null;
    }

    /**
     * Get current RMS amplitude of TTS audio (0.0 – 1.0).
     * Returns 0 when not playing or Web Audio API is unavailable.
     */
    getAmplitude() {
        if (!this._analyser || !this.playing) return 0;
        this._analyser.getByteTimeDomainData(this._amplitudeBuffer);
        let sum = 0;
        const len = this._amplitudeBuffer.length;
        for (let i = 0; i < len; i++) {
            const v = (this._amplitudeBuffer[i] - 128) / 128;
            sum += v * v;
        }
        return Math.sqrt(sum / len); // RMS amplitude
    }

    /**
     * Returns true when TTS audio is above the noise-gate threshold.
     * Only reflects TTS audio – game SFX routed through Phaser are unaffected.
     * @param {number} threshold - Amplitude threshold (default 0.02)
     */
    isSpeaking(threshold = 0.02) {
        return this.getAmplitude() > threshold;
    }

    /**
     * Register a voice-FX profile for a speaker (an NPC id). The FX is applied whenever TTS plays
     * for that speaker. Pass null to clear. Profile may be a preset name (see VOICE_FX_PRESETS) or
     * an object: { highpass, lowpass, drive, ringMod:{frequency,mix}, makeup }.
     * @param {string} speakerId
     * @param {string|Object|null} profile
     */
    setVoiceFX(speakerId, profile) {
        if (!speakerId) return;
        if (profile) this._fxProfiles.set(speakerId, profile);
        else this._fxProfiles.delete(speakerId);
    }

    /**
     * Resolve a registered profile (preset name or object) to a concrete FX profile object.
     * @private
     */
    _resolveFXProfile(npcId) {
        const raw = this._fxProfiles.get(npcId);
        if (!raw) return null;
        if (typeof raw === 'string') return TTSManager.VOICE_FX_PRESETS[raw] || null;
        return raw;
    }

    /**
     * Switch the active FX profile, rebuilding the graph if it changed and the graph is live.
     * @private
     */
    _setActiveFXProfile(profile) {
        if (profile === this._activeFXProfile) return;
        this._activeFXProfile = profile || null;
        if (this._ttsAudioRouted) this._connectGraph();
    }

    /** @private */
    _ensureAudioContext() {
        if (this._ttsAudioRouted) return;
        const ctx = MusicController?.context;
        if (!ctx) {
            console.warn('[TTS] MusicController.context unavailable; TTS uses element volume only');
            this.audio.volume = this.volume;
            return;
        }
        try {
            if (!this._mediaElementSource) {
                this._mediaElementSource = ctx.createMediaElementSource(this.audio);
            }
            if (!this._analyser) {
                this._analyser = ctx.createAnalyser();
                this._analyser.fftSize = 256;
                this._analyser.smoothingTimeConstant = 0.2;
                this._amplitudeBuffer = new Uint8Array(this._analyser.frequencyBinCount);
            }
            this._connectGraph();
            this.audio.volume = 1;
            this._ttsAudioRouted = true;
        } catch (e) {
            console.warn('[TTS] Web Audio routing unavailable, mouth animation may be disabled:', e.message);
            // Do NOT null _mediaElementSource here: a MediaElementSource can only be created ONCE
            // per <audio> element. If a later node constructor threw, the source is already bound —
            // clearing the reference would make the next _ensureAudioContext() call
            // createMediaElementSource() again → InvalidStateError, permanently killing routing.
            // Keep the source; only reset the retryable analyser bits.
            this._analyser = null;
            this._amplitudeBuffer = null;
            this.audio.volume = this.volume;
        }
    }

    /**
     * (Re)wire the shared graph: source → [FX chain, if any] → analyser → voiceGain.
     * Safe to call repeatedly; disconnects existing links and rebuilds the FX chain each time.
     * @private
     */
    _connectGraph() {
        const ctx = MusicController?.context;
        if (!ctx || !this._mediaElementSource || !this._analyser) return;

        try { this._mediaElementSource.disconnect(); } catch (_) {}
        try { this._analyser.disconnect(); } catch (_) {}
        this._disposeFXChain();

        let tail = this._mediaElementSource;
        if (this._activeFXProfile) {
            this._fxChain = this._buildFXChain(ctx, this._activeFXProfile);
            if (this._fxChain) {
                tail.connect(this._fxChain.input);
                tail = this._fxChain.output;
            }
        }
        tail.connect(this._analyser);
        this._analyser.connect(MusicController.voiceGain);
    }

    /**
     * Build an FX chain from a profile. Returns { input, output, nodes, oscs } or null.
     * Chain order: input → highpass → lowpass → waveshaper(drive) → ringMod(dry/wet) → makeup → output.
     * Every stage is optional; the whole thing degrades to a passthrough gain.
     * @private
     */
    _buildFXChain(ctx, p) {
        const nodes = [];
        const oscs = [];
        const push = n => { nodes.push(n); return n; };

        const input = push(ctx.createGain());
        let node = input;

        if (p.highpass) {
            const hp = push(ctx.createBiquadFilter());
            hp.type = 'highpass'; hp.frequency.value = p.highpass; hp.Q.value = 0.707;
            node.connect(hp); node = hp;
        }
        if (p.lowpass) {
            const lp = push(ctx.createBiquadFilter());
            lp.type = 'lowpass'; lp.frequency.value = p.lowpass; lp.Q.value = 0.707;
            node.connect(lp); node = lp;
        }
        if (p.drive) {
            const ws = push(ctx.createWaveShaper());
            ws.curve = this._makeDistortionCurve(p.drive);
            ws.oversample = '2x';
            node.connect(ws); node = ws;
        }
        if (p.ringMod && p.ringMod.mix > 0) {
            const freq = p.ringMod.frequency ?? 80;
            const mix = Math.min(1, p.ringMod.mix);
            const dry = push(ctx.createGain()); dry.gain.value = 1 - mix;
            const ringIn = push(ctx.createGain()); ringIn.gain.value = 0; // baseline; oscillator swings it -1..1
            const wet = push(ctx.createGain()); wet.gain.value = mix;
            const sum = push(ctx.createGain());
            const osc = ctx.createOscillator();
            osc.type = 'sine'; osc.frequency.value = freq;
            osc.connect(ringIn.gain); osc.start(); oscs.push(osc);
            node.connect(dry); dry.connect(sum);
            node.connect(ringIn); ringIn.connect(wet); wet.connect(sum);
            node = sum;
        }

        const makeup = push(ctx.createGain());
        makeup.gain.value = p.makeup ?? 1;
        node.connect(makeup); node = makeup;

        return { input, output: node, nodes, oscs };
    }

    /** @private */
    _disposeFXChain() {
        if (!this._fxChain) return;
        for (const o of this._fxChain.oscs || []) {
            try { o.stop(); } catch (_) {}
            try { o.disconnect(); } catch (_) {}
        }
        for (const n of this._fxChain.nodes || []) {
            try { n.disconnect(); } catch (_) {}
        }
        this._fxChain = null;
    }

    /**
     * Standard waveshaper distortion curve. `amount` ~ 0 (clean) to ~50 (heavy).
     * @private
     */
    _makeDistortionCurve(amount) {
        const k = typeof amount === 'number' ? amount : 0;
        const n = 44100;
        const curve = new Float32Array(n);
        const deg = Math.PI / 180;
        for (let i = 0; i < n; i++) {
            const x = (i * 2) / n - 1;
            curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }

    /** @private */
    _cacheKey(npcId, text) {
        return `${npcId}|${text}`;
    }
}

/**
 * Named voice-FX presets. Reference by name from a scenario NPC's voice config
 * (e.g. "voice": { ..., "fx": "voice-distortion" }) or pass a custom object.
 *
 * Tuning knobs per profile:
 *   highpass / lowpass — band-limit the voice (a tight band = telephone/radio feel)
 *   drive              — waveshaper saturation (grit). ~0 clean, ~6 subtle, ~20 heavy
 *   ringMod            — { frequency, mix }. Metallic/masked edge. mix is the most
 *                        aggressive knob — lower it (or delete ringMod) to soften.
 *   makeup             — output gain to compensate for level lost to filtering/drive
 */
TTSManager.VOICE_FX_PRESETS = {
    // Anonymised, encrypted-comms voice: band-limited with a light metallic edge. Deliberately
    // masked but still intelligible. Used for Ghost (ENTROPY) — a disguised/obscured speaker.
    'voice-distortion': { highpass: 220, lowpass: 3400, drive: 6, ringMod: { frequency: 75, mix: 0.10 }, makeup: 1.6 },
    // Clean radio/handset band with light grit, no ring mod.
    'radio': { highpass: 500, lowpass: 3000, drive: 10, makeup: 1.5 },
    // Heavier robotic/vocoder-ish edge.
    'robot': { highpass: 150, lowpass: 3800, drive: 4, ringMod: { frequency: 50, mix: 0.35 }, makeup: 1.5 }
};

export default TTSManager;
