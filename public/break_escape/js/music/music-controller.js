/**
 * MusicController — Web Audio API singleton with cross-tab leader election.
 *
 * Architecture:
 *   AudioBufferSourceNode → trackGainNode ─┐
 *                                          ├─→ musicGainNode ─┐
 *   (crossfade src) → nextTrackGainNode ──┘                  ├─→ masterGainNode → destination
 *   Phaser masterVolumeNode → sfxGainNode ────────────────────┤
 *   TTS (MediaElementSource) → analyser → voiceGainNode ──────┘
 *
 *   Phaser's AudioContext is shared (audio: { context: this.context }); after boot,
 *   phaser-audio-bus.js repatches Phaser's masterVolumeNode into sfxGain so the SFX
 *   slider affects game sounds. TTS routes through voiceGain (see tts-manager.js).
 *
 * Cross-tab:
 *   BroadcastChannel 'break-escape-music' carries state broadcasts and
 *   commands (skip, set-volume, switch-playlist, step-down).
 *   Web Locks API ensures exactly one tab is the "leader" at a time.
 *   When the leader tab closes the next queued tab automatically becomes leader.
 *
 * Usage (game code):
 *   window.MusicController.switchPlaylist('threat');
 *   window.MusicController.skip();
 *   window.MusicController.setMusicVolume(0.4);
 *   window.MusicController.setVoiceVolume(0.8);
 *
 * Events dispatched on window:
 *   musiccontroller:trackchange    → { detail: { title, playlist, index, total } }
 *   musiccontroller:playlistchange → { detail: { playlist } }
 *   musiccontroller:statechange    → { detail: { ...fullState } }
 *   musiccontroller:leaderchange   → { detail: { isLeader } }
 */

import { MUSIC_CONFIG } from './music-config.js';

const CHANNEL_NAME = 'break-escape-music';
const LOCK_NAME    = 'break-escape-music-leader';

class MusicController {
    constructor() {
        if (window.MusicController) return window.MusicController;

        // ── Audio graph ──────────────────────────────────────────────────────
        this.context      = new AudioContext();
        this.masterGain   = this.context.createGain();
        this.musicGain    = this.context.createGain();
        this.sfxGain      = this.context.createGain();
        this.voiceGain    = this.context.createGain();

        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.voiceGain.connect(this.masterGain);
        this.masterGain.connect(this.context.destination);

        // ── Analyser tap (read-only branch from musicGain) ───────────────────
        // The bond visualiser reads from this. It is a tap — does not connect
        // onwards, so it does not affect the audio output.
        this.analyser = this.context.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.75;
        this.musicGain.connect(this.analyser);

        // ── Volumes ──────────────────────────────────────────────────────────
        this.musicGain.gain.value   = MUSIC_CONFIG.defaultMusicVolume;
        this.sfxGain.gain.value     = MUSIC_CONFIG.defaultSFXVolume;
        this.voiceGain.gain.value   = MUSIC_CONFIG.defaultVoiceVolume;
        this.masterGain.gain.value  = MUSIC_CONFIG.defaultMasterVolume;

        // Plain-JS volume mirrors — used by getState() so reads are never subject to
        // Web Audio AudioParam timing (gain.value lags one render quantum after setValueAtTime).
        this._vol = {
            music:  MUSIC_CONFIG.defaultMusicVolume,
            sfx:    MUSIC_CONFIG.defaultSFXVolume,
            voice:  MUSIC_CONFIG.defaultVoiceVolume,
            master: MUSIC_CONFIG.defaultMasterVolume,
        };

        // ── Playback state ───────────────────────────────────────────────────
        this._currentPlaylistKey = null;
        this._playlist           = null;   // resolved playlist object
        this._queue              = [];     // shuffled / sequential indices
        this._queuePos           = 0;
        this._currentTrackIndex  = -1;
        this._currentSource      = null;   // AudioBufferSourceNode
        this._currentTrackGain   = null;   // GainNode for current track (used in crossfade)
        this._bufferCache        = new Map(); // url → AudioBuffer (insertion order = LRU recency)
        this._pinnedUrls         = new Set(); // urls that must not be evicted (current + next prefetch + dying crossfade)
        this._paused             = false;
        this._pausedAt           = 0;      // context time offset when paused
        this._trackStartTime     = 0;      // context.currentTime when track started
        this._loadingAbortCtrl   = null;
        this._prefetchAbortCtrl  = null;   // separate from _loadingAbortCtrl so prefetch aborts don't cancel current load
        this._prefetchUrl        = null;   // url currently being prefetched (pinned until play or superseded)
        this._fadeTimer          = null;
        this._stopAfterTrack     = false;  // if true, stop playback after current track ends

        // ── Cross-tab ────────────────────────────────────────────────────────
        this.isLeader   = false;
        this._channel   = null;
        this._lockReleaseFn = null; // call to release leader lock (step down)

        // ── Public API bound ─────────────────────────────────────────────────
        this._bindMethods();
    }

    _bindMethods() {
        ['switchPlaylist','skip','pause','resume',
         'setMusicVolume','setSFXVolume','setVoiceVolume','setMasterVolume','getState',
         'stepDown','requestLeadership','playTrack','stopAfterCurrentTrack'].forEach(m => { this[m] = this[m].bind(this); });
    }

    // ════════════════════════════════════════════════════════════════════════
    // Initialisation
    // ════════════════════════════════════════════════════════════════════════

    init() {
        if (this._initialized) return;
        this._initialized = true;

        // Resume AudioContext on first user interaction (browsers require it)
        const resume = () => {
            if (this.context.state === 'suspended') this.context.resume();
        };
        document.addEventListener('click', resume, { once: true });
        document.addEventListener('keydown', resume, { once: true });

        // Set up cross-tab channel
        this._channel = new BroadcastChannel(CHANNEL_NAME);
        this._channel.addEventListener('message', e => this._onChannelMessage(e.data));

        // Leader election via Web Locks
        this._electLeader();

        // Restore saved volumes from localStorage
        this._loadVolumes();

        console.log('[MusicController] Initialized');
    }

    async _electLeader() {
        // Each tab queues up for the exclusive lock. The holder is the leader.
        // A never-resolving inner promise holds the lock until the tab closes
        // OR stepDown() is called (which resolves it).
        await navigator.locks.request(LOCK_NAME, async () => {
            this.isLeader = true;
            this._dispatchEvent('leaderchange', { isLeader: true });
            console.log('[MusicController] Became leader');

            // Resume whichever playlist was already playing (learnt from broadcast
            // state while a follower).  If nothing is known yet, do NOT fall back to
            // the default — the scenario's game_loaded event (or startDefault()) will
            // pick the right playlist once the game has finished loading.
            if (this._currentPlaylistKey) {
                this._startPlaylist(this._currentPlaylistKey, false);
            }

            // Hold lock until stepDown() resolves _lockReleaseResolve
            await new Promise(resolve => { this._lockReleaseResolve = resolve; });

            // Tidy up after stepping down
            this.isLeader = false;
            this._stopCurrent(false);
            this._abortPrefetch();
            this._clearCache();
            this._dispatchEvent('leaderchange', { isLeader: false });
            console.log('[MusicController] Stepped down as leader');

            // Re-queue for leadership
            this._electLeader();
        });
    }

    // ════════════════════════════════════════════════════════════════════════
    // Public API
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Switch to a named playlist (defined in music-config.js).
     * Crossfades from current track by default.
     * Can be called from any tab — non-leaders broadcast a command instead.
     */
    switchPlaylist(name, fade = true) {
        if (!this.isLeader) {
            this._sendCommand('switch-playlist', { name, fade });
            return;
        }
        this._startPlaylist(name, fade);
    }

    /** Skip to the next track in the current playlist. */
    skip() {
        if (!this.isLeader) { this._sendCommand('skip'); return; }
        this._nextTrack(true);
    }

    pause() {
        if (!this.isLeader) { this._sendCommand('pause'); return; }
        if (this._paused || !this._currentSource) return;
        this._paused = true;
        this._pausedAt = this.context.currentTime - this._trackStartTime;
        const url = this._currentSource._cachedUrl;
        try { this._currentSource.stop(); } catch(_) {}
        try { this._currentTrackGain?.disconnect(); } catch(_) {}
        if (url) this._pinnedUrls.delete(url);
        this._currentSource = null;
        this._currentTrackGain = null;
        this._broadcastState();
        this._evictIfNeeded();
    }

    resume() {
        if (!this.isLeader) { this._sendCommand('resume'); return; }
        if (!this._paused) return;
        this._paused = false;
        this._playTrack(this._currentTrackIndex, this._pausedAt);
    }

    /** 0.0 – 1.0 */
    setMusicVolume(v) {
        v = Math.max(0, Math.min(1, v));
        this.musicGain.gain.value = v;
        this._vol.music = v;
        this._saveVolumes();
        if (!this.isLeader) this._sendCommand('set-volume', { music: v });
        else this._broadcastState();
    }

    setSFXVolume(v) {
        v = Math.max(0, Math.min(1, v));
        this.sfxGain.gain.value = v;
        this._vol.sfx = v;
        this._saveVolumes();
        if (!this.isLeader) this._sendCommand('set-volume', { sfx: v });
        else this._broadcastState();
    }

    setVoiceVolume(v) {
        v = Math.max(0, Math.min(1, v));
        this.voiceGain.gain.value = v;
        this._vol.voice = v;
        this._saveVolumes();
        if (!this.isLeader) this._sendCommand('set-volume', { voice: v });
        else this._broadcastState();
    }

    /** Phaser WebAudioSoundManager.masterVolumeNode should connect here (not to destination). */
    getPhaserSfxInput() {
        return this.sfxGain;
    }

    setMasterVolume(v) {
        v = Math.max(0, Math.min(1, v));
        this.masterGain.gain.value = v;
        this._vol.master = v;
        this._saveVolumes();
        if (!this.isLeader) this._sendCommand('set-volume', { master: v });
        else this._broadcastState();
    }

    /** Release leadership so another tab can take over. */
    /**
     * Start the configured default playlist if nothing is currently playing.
     * Called by initScenarioMusicEvents for scenarios that have no game_loaded
     * music trigger (so they still get background music at game start).
     */
    startDefault(fade = false) {
        if (!this._currentPlaylistKey) {
            this._startPlaylist(MUSIC_CONFIG.defaultPlaylist, fade);
        }
    }

    stepDown() {
        if (this._lockReleaseResolve) this._lockReleaseResolve();
    }

    /**
     * Request that this tab becomes the audio leader.
     * Tells the current leader to step down via BroadcastChannel; this tab
     * (and any others waiting) will then race for the Web Lock — the active
     * tab almost always wins immediately.
     * No-op if already the leader.
     */
    requestLeadership() {
        if (this.isLeader) return;
        this._sendCommand('step-down');
    }

    /**
     * Play a specific track by title within a named playlist.
     * Crossfades from the current track when fade=true.
     * Sets the queue so the specific track plays first; afterwards the
     * playlist resumes normally (unless stopAfterCurrentTrack was called).
     */
    playTrack(title, playlistKey, fade = true) {
        if (!this.isLeader) {
            this._sendCommand('play-track', { title, playlistKey, fade });
            return;
        }
        const key = playlistKey || this._currentPlaylistKey;
        const playlist = MUSIC_CONFIG.playlists[key];
        if (!playlist) {
            console.warn(`[MusicController] Unknown playlist for playTrack: ${key}`);
            return;
        }
        const idx = playlist.tracks.findIndex(t => t.title === title);
        if (idx < 0) {
            console.warn(`[MusicController] Track not found in '${key}': ${title}`);
            return;
        }

        const changing = key !== this._currentPlaylistKey;
        this._currentPlaylistKey = key;
        this._playlist = playlist;
        // Queue the specific track at the front so it plays first
        this._queue = [idx];
        this._queuePos = 0;

        if (changing) {
            this._dispatchEvent('playlistchange', { playlist: key });
        }

        if (fade && this._currentSource) {
            this._crossfadeTo(idx);
        } else {
            this._stopCurrent(false);
            this._playTrack(idx, 0, false);
        }
    }

    /**
     * Signal that playback should stop after the current track ends,
     * rather than advancing to the next track.
     * Fires a musiccontroller:trackended event when the track finishes.
     */
    stopAfterCurrentTrack() {
        if (!this.isLeader) {
            this._sendCommand('stop-after-track');
            return;
        }
        this._stopAfterTrack = true;
    }

    getState() {
        const playlist = this._playlist;
        const trackIndex = this._currentTrackIndex;
        const track = (playlist && trackIndex >= 0) ? playlist.tracks[trackIndex] : null;
        return {
            isLeader:      this.isLeader,
            paused:        this._paused,
            playlist:      this._currentPlaylistKey,
            playlistName:  playlist ? playlist.displayName : null,
            trackIndex,
            trackTitle:    track ? track.title : null,
            totalTracks:   playlist ? playlist.tracks.length : 0,
            musicVolume:   this._vol.music,
            sfxVolume:     this._vol.sfx,
            voiceVolume:   this._vol.voice,
            masterVolume:  this._vol.master,
        };
    }

    // ════════════════════════════════════════════════════════════════════════
    // Internal – Playback
    // ════════════════════════════════════════════════════════════════════════

    _startPlaylist(key, fade) {
        const playlist = MUSIC_CONFIG.playlists[key];
        if (!playlist) {
            console.warn(`[MusicController] Unknown playlist: ${key}`);
            return;
        }
        this._abortPrefetch();
        const changing = key !== this._currentPlaylistKey;
        this._currentPlaylistKey = key;
        this._playlist = playlist;
        this._buildQueue();

        if (changing) {
            this._dispatchEvent('playlistchange', { playlist: key });
        }

        this._nextTrack(fade);
    }

    _buildQueue() {
        const playlist = this._playlist;
        const count = playlist.tracks.length;
        const indices = [...Array(count).keys()];

        if (playlist.shuffle === 'shuffle') {
            // Fisher-Yates
            for (let i = count - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
        }
        this._queue = indices;
        this._queuePos = 0;
    }

    _nextTrack(fade) {
        if (!this._queue.length) this._buildQueue();

        const trackIndex = this._queue[this._queuePos];
        this._queuePos = (this._queuePos + 1) % this._queue.length;

        // Reshuffle when we lap around (for shuffle mode)
        if (this._queuePos === 0 && this._playlist?.shuffle === 'shuffle') {
            this._buildQueue();
        }

        if (fade && this._currentSource) {
            this._crossfadeTo(trackIndex);
        } else {
            this._stopCurrent(false);
            this._playTrack(trackIndex, 0, false);
        }
    }

    async _playTrack(trackIndex, offsetSeconds = 0, fadeIn = false) {
        const playlist = this._playlist;
        if (!playlist) return;

        const track = playlist.tracks[trackIndex];
        if (!track) return;

        this._currentTrackIndex = trackIndex;
        this._paused = false;

        // Abort any in-flight fetch for a previous track
        if (this._loadingAbortCtrl) this._loadingAbortCtrl.abort();
        this._loadingAbortCtrl = new AbortController();

        const cachedUrl = `${MUSIC_CONFIG.baseURL}/${track.file}`;
        // If the same URL is being prefetched, abort that fetch so we don't decode twice.
        // Keep the pin (prefetch already added it); _pinnedUrls.add below is a no-op for Sets.
        if (this._prefetchUrl === cachedUrl && this._prefetchAbortCtrl) {
            this._prefetchAbortCtrl.abort();
            this._prefetchAbortCtrl = null;
        }
        if (this._prefetchUrl === cachedUrl) this._prefetchUrl = null;

        let buffer;
        try {
            buffer = await this._loadBuffer(track.file, this._loadingAbortCtrl.signal);
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.warn(`[MusicController] Failed to load ${track.file}:`, err);
                // Try the next track rather than stalling
                setTimeout(() => this._nextTrack(false), 500);
            }
            return;
        }

        this._pinnedUrls.add(cachedUrl);

        // Create a dedicated gain for this source (used during crossfade)
        const trackGain = this.context.createGain();
        trackGain.gain.value = 1.0;
        trackGain.connect(this.musicGain);

        const source = this.context.createBufferSource();
        source.buffer = buffer;
        source._cachedUrl = cachedUrl;
        source.connect(trackGain);
        source.start(0, offsetSeconds);
        source.onended = () => {
            if (source !== this._currentSource || this._paused) return;
            if (this._stopAfterTrack) {
                this._stopAfterTrack = false;
                if (source._cachedUrl) this._pinnedUrls.delete(source._cachedUrl);
                this._currentSource    = null;
                this._currentTrackGain = null;
                this._dispatchEvent('trackended', {
                    title:    track.title,
                    playlist: this._currentPlaylistKey,
                });
                this._evictIfNeeded();
            } else {
                this._nextTrack(false);
            }
        };

        this._currentSource    = source;
        this._currentTrackGain = trackGain;
        this._trackStartTime   = this.context.currentTime - offsetSeconds;

        // Fade in if requested (used during crossfade)
        if (fadeIn) {
            const fadeSec = (MUSIC_CONFIG.fadeDuration || 2500) / 1000;
            const now = this.context.currentTime;
            trackGain.gain.setValueAtTime(0, now);
            trackGain.gain.linearRampToValueAtTime(1, now + fadeSec);
        }

        this._dispatchEvent('trackchange', {
            title:    track.title,
            playlist: this._currentPlaylistKey,
            index:    trackIndex,
            total:    playlist.tracks.length,
        });
        this._broadcastState();
        this._prefetchNext();
    }

    _prefetchNext() {
        if (!this.isLeader || !this._playlist?.tracks?.length || !this._queue.length) return;
        const nextIdx = this._queue[this._queuePos];
        const nextTrk = this._playlist.tracks[nextIdx];
        if (!nextTrk) return;
        const url = `${MUSIC_CONFIG.baseURL}/${nextTrk.file}`;
        if (this._bufferCache.has(url)) return;

        if (this._prefetchAbortCtrl) this._prefetchAbortCtrl.abort();
        if (this._prefetchUrl) {
            this._pinnedUrls.delete(this._prefetchUrl);
            this._prefetchUrl = null;
        }
        this._prefetchAbortCtrl = new AbortController();
        this._pinnedUrls.add(url);
        this._prefetchUrl = url;
        this._loadBuffer(nextTrk.file, this._prefetchAbortCtrl.signal)
            .catch(err => {
                if (err.name === 'AbortError') {
                    if (this._prefetchUrl === url) this._prefetchUrl = null;
                    // Do not unpin on AbortError — _playTrack may have taken over this URL.
                    return;
                }
                console.warn('[MusicController] Prefetch failed:', err);
                if (this._prefetchUrl === url) {
                    this._pinnedUrls.delete(url);
                    this._prefetchUrl = null;
                }
                this._evictIfNeeded();
            });
    }

    _abortPrefetch() {
        if (this._prefetchAbortCtrl) {
            this._prefetchAbortCtrl.abort();
            this._prefetchAbortCtrl = null;
        }
        if (this._prefetchUrl) {
            this._pinnedUrls.delete(this._prefetchUrl);
            this._prefetchUrl = null;
        }
    }

    _crossfadeTo(nextTrackIndex) {
        const fadeSec = (MUSIC_CONFIG.fadeDuration || 2500) / 1000;
        const now = this.context.currentTime;

        // Fade out current
        if (this._currentTrackGain) {
            this._currentTrackGain.gain.setValueAtTime(this._currentTrackGain.gain.value, now);
            this._currentTrackGain.gain.linearRampToValueAtTime(0, now + fadeSec);
            const dyingGain   = this._currentTrackGain;
            const dyingSource = this._currentSource;
            const dyingUrl    = dyingSource?._cachedUrl;
            setTimeout(() => {
                try { dyingSource?.stop(); dyingGain?.disconnect(); } catch(_) {}
                if (dyingUrl) this._pinnedUrls.delete(dyingUrl);
                this._evictIfNeeded();
            }, fadeSec * 1000 + 100);
        }

        this._currentSource    = null;
        this._currentTrackGain = null;
        this._playTrack(nextTrackIndex, 0, true); // fadeIn=true handled inside _playTrack
    }

    _stopCurrent(fade) {
        if (!this._currentSource) return;
        const url = this._currentSource._cachedUrl;
        if (fade) {
            const fadeSec = (MUSIC_CONFIG.fadeDuration || 2500) / 1000;
            const now = this.context.currentTime;
            this._currentTrackGain?.gain.setValueAtTime(this._currentTrackGain.gain.value, now);
            this._currentTrackGain?.gain.linearRampToValueAtTime(0, now + fadeSec);
            const s = this._currentSource, g = this._currentTrackGain;
            setTimeout(() => {
                try { s?.stop(); g?.disconnect(); } catch(_) {}
                if (url) this._pinnedUrls.delete(url);
                this._evictIfNeeded();
            }, fadeSec * 1000 + 100);
        } else {
            try { this._currentSource.stop(); } catch(_) {}
            try { this._currentTrackGain?.disconnect(); } catch(_) {}
            if (url) this._pinnedUrls.delete(url);
            this._evictIfNeeded();
        }
        this._currentSource    = null;
        this._currentTrackGain = null;
    }

    // ── LRU buffer cache helpers ─────────────────────────────────────────────
    // _bufferCache is a Map; insertion order is treated as recency. Pinned URLs
    // are never evicted (current track, next prefetch, dying crossfade source).
    // Dropping a Map entry releases the AudioBuffer reference; the browser then
    // reclaims the underlying decoded PCM. There is no explicit dispose API.

    _cacheGet(url) {
        const buf = this._bufferCache.get(url);
        if (buf) {
            // Bump to most-recently-used by re-inserting at the tail
            this._bufferCache.delete(url);
            this._bufferCache.set(url, buf);
        }
        return buf;
    }

    _cacheSet(url, buf) {
        if (this._bufferCache.has(url)) this._bufferCache.delete(url);
        this._bufferCache.set(url, buf);
        this._evictIfNeeded();
    }

    _evictIfNeeded() {
        const cap = Math.max(2, MUSIC_CONFIG.bufferCacheSize ?? 3);
        // Iterate oldest-first; skip pinned entries
        for (const url of this._bufferCache.keys()) {
            if (this._bufferCache.size <= cap) break;
            if (this._pinnedUrls.has(url)) continue;
            this._bufferCache.delete(url);
        }
    }

    _clearCache() {
        this._bufferCache.clear();
        this._pinnedUrls.clear();
    }

    async _loadBuffer(file, signal) {
        const url = `${MUSIC_CONFIG.baseURL}/${file}`;
        const cached = this._cacheGet(url);
        if (cached) return cached;

        const resp = await fetch(url, { signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
        const arrayBuf = await resp.arrayBuffer();
        const audioBuf = await this.context.decodeAudioData(arrayBuf);
        this._cacheSet(url, audioBuf);
        return audioBuf;
    }

    // ════════════════════════════════════════════════════════════════════════
    // Internal – Cross-tab
    // ════════════════════════════════════════════════════════════════════════

    _sendCommand(cmd, payload = {}) {
        this._channel?.postMessage({ type: 'command', cmd, ...payload });
    }

    _broadcastState() {
        const state = this.getState();
        this._channel?.postMessage({ type: 'state', state });
        this._dispatchEvent('statechange', state);
    }

    _onChannelMessage(data) {
        if (data.type === 'state') {
            // Non-leader tabs update their displayed state from broadcasts
            if (!this.isLeader) {
                this._currentPlaylistKey = data.state.playlist;
                this._currentTrackIndex  = data.state.trackIndex;
                this._playlist           = data.state.playlist ? MUSIC_CONFIG.playlists[data.state.playlist] : null;
                // Apply volumes locally so slider positions stay in sync
                this.musicGain.gain.value  = data.state.musicVolume;  this._vol.music  = data.state.musicVolume;
                this.sfxGain.gain.value    = data.state.sfxVolume;    this._vol.sfx    = data.state.sfxVolume;
                if (data.state.voiceVolume !== undefined) {
                    this.voiceGain.gain.value = data.state.voiceVolume; this._vol.voice = data.state.voiceVolume;
                }
                this.masterGain.gain.value = data.state.masterVolume; this._vol.master = data.state.masterVolume;
                this._dispatchEvent('statechange', data.state);
            }
            return;
        }

        if (data.type === 'command' && this.isLeader) {
            switch (data.cmd) {
                case 'skip':            this._nextTrack(true); break;
                case 'pause':           this.pause(); break;
                case 'resume':          this.resume(); break;
                case 'switch-playlist': this._startPlaylist(data.name, data.fade ?? true); break;
                case 'play-track':      this.playTrack(data.title, data.playlistKey, data.fade ?? true); break;
                case 'stop-after-track': this._stopAfterTrack = true; break;
                case 'step-down':       this.stepDown(); break;
                case 'set-volume':
                    if (data.music   !== undefined) this.setMusicVolume(data.music);
                    if (data.sfx     !== undefined) this.setSFXVolume(data.sfx);
                    if (data.voice   !== undefined) this.setVoiceVolume(data.voice);
                    if (data.master  !== undefined) this.setMasterVolume(data.master);
                    break;
            }
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // Internal – Helpers
    // ════════════════════════════════════════════════════════════════════════

    _dispatchEvent(name, detail) {
        window.dispatchEvent(new CustomEvent(`musiccontroller:${name}`, { detail }));
    }

    _saveVolumes() {
        try {
            localStorage.setItem('be_music_vol',  this._vol.music);
            localStorage.setItem('be_sfx_vol',    this._vol.sfx);
            localStorage.setItem('be_voice_vol',  this._vol.voice);
            localStorage.setItem('be_master_vol', this._vol.master);
        } catch(_) {}
    }

    _loadVolumes() {
        try {
            const m  = parseFloat(localStorage.getItem('be_music_vol'));
            const s  = parseFloat(localStorage.getItem('be_sfx_vol'));
            const v  = parseFloat(localStorage.getItem('be_voice_vol'));
            const ms = parseFloat(localStorage.getItem('be_master_vol'));
            if (!isNaN(m))  { this.musicGain.gain.value  = m;  this._vol.music  = m;  }
            if (!isNaN(s))  { this.sfxGain.gain.value    = s;  this._vol.sfx    = s;  }
            if (!isNaN(v))  { this.voiceGain.gain.value  = v;  this._vol.voice  = v;  }
            if (!isNaN(ms)) { this.masterGain.gain.value = ms; this._vol.master = ms; }
        } catch(_) {}
    }
}

// ── Singleton ─────────────────────────────────────────────────────────────────
const controller = new MusicController();
window.MusicController = controller;
export default controller;
