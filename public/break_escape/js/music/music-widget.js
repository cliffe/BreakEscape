/**
 * MusicWidget — HUD button + popup panel for the music controller.
 *
 * Attaches a speaker button to #player-hud-buttons (the inventory bar).
 * Clicking it toggles a panel with:
 *   - Current track title & playlist
 *   - Skip / Pause-Resume buttons
 *   - Playlist selector dropdown
 *   - Music, SFX, Voice, and Master volume sliders (Phaser → SFX bus; TTS → Voice bus)
 *
 * Works on all tabs: non-leader tabs show controls but send commands to the
 * leader tab via BroadcastChannel (handled inside MusicController).
 */

import { MUSIC_CONFIG } from './music-config.js';
import { setHudLabel, clearHudLabel } from '../ui/info-label.js';
import MusicController from './music-controller.js';
import { BondVisualiser } from './bond-visualiser.js';

export class MusicWidget {
    constructor() {
        this._panelOpen  = false;
        this._currentState = MusicController.getState();
        /** While non-null, that volume range is being dragged — skip _setSlider overwrites (matches thumb + % to input events). */
        this._activeVolSliderId = null;
    }

    // ── Mount ────────────────────────────────────────────────────────────────

    mount() {
        // Inject CSS if not already present (fallback for standalone HTML; ERB templates link it statically)
        if (!document.getElementById('music-widget-css')) {
            const link = document.createElement('link');
            link.id   = 'music-widget-css';
            link.rel  = 'stylesheet';
            // Allow host app to override; default mirrors the Rails engine public path
            link.href = window.breakEscapeConfig?.musicWidgetCSSPath || '/break_escape/css/music-widget.css';
            document.head.appendChild(link);
        }

        this._createButton();
        this._createPanel();
        this._bindEvents();
        this._blockExtensionInjections();
        this._updateUI(MusicController.getState());
        this._loadUiSound();
    }

    // ── UI sound (volume-slider release feedback) ─────────────────────────────

    _loadUiSound() {
        this._uiSoundBuffer = null;
        const url = window.breakEscapeConfig?.uiAlertSoundPath
                  || '/break_escape/assets/sounds/GASP_UI_Alert_1.mp3';
        fetch(url)
            .then(r => r.arrayBuffer())
            .then(ab => MusicController.context.decodeAudioData(ab))
            .then(buf => { this._uiSoundBuffer = buf; })
            .catch(() => { /* sound is optional; silently skip if missing */ });
    }

    /**
     * Play the UI alert sound through the gain node that corresponds to the slider
     * just released, so the user immediately hears the channel at its new level.
     *
     * Channel mapping (music and master sliders are intentionally excluded):
     *   mw-vol-sfx   → sfxGain   (sfx bus   → master → destination)
     *   mw-vol-voice → voiceGain (voice bus → master → destination)
     */
    _playUiSound(sliderId) {
        if (!this._uiSoundBuffer) return;
        const ctx = MusicController.context;
        if (!ctx) return;

        const busMap = {
            'mw-vol-sfx':   MusicController.sfxGain,
            'mw-vol-voice': MusicController.voiceGain,
        };
        const bus = busMap[sliderId];
        if (!bus) return;

        const source = ctx.createBufferSource();
        source.buffer = this._uiSoundBuffer;
        source.connect(bus);
        source.start(0);
        source.onended = () => source.disconnect();
    }

    /**
     * Password-manager extensions (LastPass, etc.) inject icon-root divs into any
     * <input> they recognise — including range sliders near labels like "Voice".
     * Their injected nodes carry inline display:initial !important which beats CSS.
     * A MutationObserver removes them as soon as they land.
     */
    _blockExtensionInjections() {
        if (!this._panel) return;
        const observer = new MutationObserver(mutations => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType === 1 && (
                        node.hasAttribute('data-lastpass-icon-root') ||
                        node.hasAttribute('data-dashlane-rid') ||
                        node.hasAttribute('data-1p-ignore')
                    )) {
                        node.remove();
                    }
                }
            }
        });
        observer.observe(this._panel, { childList: true, subtree: true });
        this._extensionObserver = observer;
    }

    // ── Build DOM ────────────────────────────────────────────────────────────

    _createButton() {
        const btn = document.createElement('div');
        btn.id        = 'music-widget-btn';
        btn.addEventListener('mouseenter', () => setHudLabel('Music Controls'));
        btn.addEventListener('mouseleave', () => clearHudLabel());
        const iconPath = window.breakEscapeConfig?.assetBase || '/break_escape';
        btn.innerHTML = `
            <img class="music-btn-icon" src="${iconPath}/assets/icons/speaker.png" alt="Music" width="32" height="32">
        `;
        btn.addEventListener('click', e => { e.stopPropagation(); this._togglePanel(); });
        this._btn = btn;

        // Mount into the fixed anchor in the top-right corner
        const anchor = document.getElementById('music-widget-btn-anchor');
        if (anchor) {
            anchor.appendChild(btn);
        } else {
            // Fallback: retry until anchor is ready (e.g. standalone HTML)
            const retry = () => {
                const a = document.getElementById('music-widget-btn-anchor');
                if (a) { a.appendChild(btn); }
                else   { setTimeout(retry, 150); }
            };
            retry();
        }
    }

    _createPanel() {
        const playlists = MUSIC_CONFIG.playlists;

        // Build playlist options
        const playlistOptions = Object.entries(playlists)
            .map(([key, pl]) => `<option value="${key}">${pl.displayName}</option>`)
            .join('');

        const panel = document.createElement('div');
        panel.id = 'music-widget-panel';
        panel.innerHTML = `
            <div class="mw-header">
                <span class="mw-header-title">&#9834; Music</span>
                <button class="mw-close-btn" id="mw-close-btn">✕</button>
            </div>

            <div class="mw-passive-notice" id="mw-passive-notice" style="display:none">
                <span class="mw-passiv-text">Controlled from another tab</span>
                <button class="mw-takeover-btn" id="mw-takeover-btn">Take control</button>
            </div>

            <div class="mw-now-playing">
                <div class="mw-np-label">Now playing</div>
                <div class="mw-track-title" id="mw-track-title">–</div>
                <div class="mw-track-count" id="mw-track-count"></div>
                <div class="mw-status-pill" id="mw-status-pill">Playing</div>
            </div>

            <div class="mw-controls">
                <button class="mw-btn" id="mw-skip-btn">&#9654;&#9654; Skip</button>
                <button class="mw-btn" id="mw-pause-btn">&#9646;&#9646; Pause</button>
                <button class="mw-btn" id="mw-vis-btn">&#128250; Visualiser</button>
            </div>

            <div class="mw-section">
                <div class="mw-section-label">Playlist</div>
                <select class="mw-select" id="mw-playlist-select">
                    ${playlistOptions}
                </select>
            </div>

            <div class="mw-volumes">
                <div class="mw-vol-row">
                    <span class="mw-vol-label" title="Background playlist">Music</span>
                    <input type="range" class="mw-vol-slider" id="mw-vol-music"
                           min="0" max="1" step="0.01" data-lpignore="true">
                    <span class="mw-vol-value" id="mw-vol-music-val">30%</span>
                </div>
                <div class="mw-vol-row">
                    <span class="mw-vol-label" title="Phaser game sounds">SFX</span>
                    <input type="range" class="mw-vol-slider" id="mw-vol-sfx"
                           min="0" max="1" step="0.01" data-lpignore="true">
                    <span class="mw-vol-value" id="mw-vol-sfx-val">100%</span>
                </div>
                <div class="mw-vol-row">
                    <span class="mw-vol-label" title="NPC TTS / voice lines">Voice</span>
                    <input type="range" class="mw-vol-slider" id="mw-vol-voice"
                           min="0" max="1" step="0.01" data-lpignore="true">
                    <span class="mw-vol-value" id="mw-vol-voice-val">100%</span>
                </div>
                <div class="mw-vol-row">
                    <span class="mw-vol-label" title="All buses">Master</span>
                    <input type="range" class="mw-vol-slider" id="mw-vol-master"
                           min="0" max="1" step="0.01" data-lpignore="true">
                    <span class="mw-vol-value" id="mw-vol-master-val">100%</span>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
        this._panel = panel;
    }

    // ── Events ───────────────────────────────────────────────────────────────

    _bindEvents() {
        // Panel controls
        document.getElementById('mw-close-btn').addEventListener('click',
            () => this._hidePanel());

        document.getElementById('mw-skip-btn').addEventListener('click',
            () => MusicController.skip());

        document.getElementById('mw-pause-btn').addEventListener('click', () => {
            if (this._currentState?.paused) MusicController.resume();
            else                            MusicController.pause();
        });

        document.getElementById('mw-vis-btn').addEventListener('click', () => {
            BondVisualiser.toggle();
            this._hidePanel();
        });

        document.getElementById('mw-takeover-btn').addEventListener('click', () => {
            MusicController.stepDown(); // tell current leader to release
            // After a brief moment, current tab will win the lock election
        });

        // Playlist selector
        document.getElementById('mw-playlist-select').addEventListener('change', e => {
            MusicController.switchPlaylist(e.target.value, true);
        });

        // Volume sliders — update in real time, notify controller on input
        const volMusic  = document.getElementById('mw-vol-music');
        const volSFX    = document.getElementById('mw-vol-sfx');
        const volVoice  = document.getElementById('mw-vol-voice');
        const volMaster = document.getElementById('mw-vol-master');

        volMusic.addEventListener('input', e => {
            const v = parseFloat(e.target.value);
            document.getElementById('mw-vol-music-val').textContent = Math.round(v * 100) + '%';
            MusicController.setMusicVolume(v);
        });

        volSFX.addEventListener('input', e => {
            const v = parseFloat(e.target.value);
            document.getElementById('mw-vol-sfx-val').textContent = Math.round(v * 100) + '%';
            MusicController.setSFXVolume(v);
        });

        volVoice.addEventListener('input', e => {
            const v = parseFloat(e.target.value);
            document.getElementById('mw-vol-voice-val').textContent = Math.round(v * 100) + '%';
            MusicController.setVoiceVolume(v);
        });

        volMaster.addEventListener('input', e => {
            const v = parseFloat(e.target.value);
            document.getElementById('mw-vol-master-val').textContent = Math.round(v * 100) + '%';
            MusicController.setMasterVolume(v);
        });

        // While any volume slider is being dragged, suppress all _setSlider updates so the
        // synchronous statechange emitted by the controller can't snap other sliders.
        // On drag end, immediately resync every slider/label from actual gain state.
        const volSliderIds = ['mw-vol-music', 'mw-vol-sfx', 'mw-vol-voice', 'mw-vol-master'];
        for (const id of volSliderIds) {
            const el = document.getElementById(id);
            if (!el) continue;
            el.addEventListener('pointerdown', () => { this._activeVolSliderId = id; }, { passive: true });
        }
        const endVolDrag = () => {
            if (this._activeVolSliderId === null) return;
            const justDragged = this._activeVolSliderId;
            this._activeVolSliderId = null;
            this._playUiSound(justDragged);
            // Resync every slider EXCEPT the one just released — its thumb is already at the
            // correct position (the browser placed it there during the drag) and its label was
            // updated live by the input handler.  Touching it here would snap it back to whatever
            // gain.value returns, which may lag by one audio-render quantum.
            const state = MusicController.getState();
            for (const [id, valId] of [
                ['mw-vol-music',  'mw-vol-music-val'],
                ['mw-vol-sfx',    'mw-vol-sfx-val'],
                ['mw-vol-voice',  'mw-vol-voice-val'],
                ['mw-vol-master', 'mw-vol-master-val'],
            ]) {
                if (id !== justDragged) {
                    const key = id === 'mw-vol-music'  ? 'musicVolume'
                              : id === 'mw-vol-sfx'    ? 'sfxVolume'
                              : id === 'mw-vol-voice'  ? 'voiceVolume'
                              :                          'masterVolume';
                    this._setSlider(id, valId, state[key]);
                }
            }
        };
        window.addEventListener('pointerup',     endVolDrag, { passive: true });
        window.addEventListener('pointercancel', endVolDrag, { passive: true });

        // Close panel on outside click
        document.addEventListener('click', e => {
            if (this._panelOpen && !this._panel.contains(e.target) && e.target !== this._btn) {
                this._hidePanel();
            }
        });

        // Controller events
        window.addEventListener('musiccontroller:statechange',
            e => this._updateUI(e.detail));
        window.addEventListener('musiccontroller:trackchange',
            e => this._updateUI(MusicController.getState()));
        window.addEventListener('musiccontroller:leaderchange',
            e => this._updateUI(MusicController.getState()));
    }

    // ── Panel toggle ─────────────────────────────────────────────────────────

    _togglePanel() {
        if (this._panelOpen) this._hidePanel();
        else                 this._showPanel();
    }

    _showPanel() {
        this._panelOpen = true;
        this._panel.classList.add('visible');
        this._btn.classList.add('panel-open');
        this._updateUI(MusicController.getState());
    }

    _hidePanel() {
        this._panelOpen = false;
        this._panel.classList.remove('visible');
        this._btn.classList.remove('panel-open');
    }

    // ── UI update ─────────────────────────────────────────────────────────────

    _updateUI(state) {
        if (!state) return;
        this._currentState = state;

        // Track info
        const titleEl = document.getElementById('mw-track-title');
        const countEl = document.getElementById('mw-track-count');
        const pillEl  = document.getElementById('mw-status-pill');

        if (titleEl) {
            titleEl.textContent = state.trackTitle || '–';
            titleEl.title       = state.trackTitle || '';
        }
        if (countEl && state.totalTracks > 0) {
            const pos = (state.trackIndex ?? -1) + 1;
            countEl.textContent = `${state.playlistName || ''} · ${pos}/${state.totalTracks}`;
        }

        // Pause / Resume button label
        const pauseBtn = document.getElementById('mw-pause-btn');
        if (pauseBtn) {
            pauseBtn.innerHTML = state.paused
                ? '&#9654; Resume'
                : '&#9646;&#9646; Pause';
        }

        // Status pill
        if (pillEl) {
            if (!state.isLeader) {
                pillEl.textContent = state.paused ? 'Paused (remote)' : 'Playing (remote)';
                pillEl.classList.add('passive');
            } else {
                pillEl.textContent = state.paused ? 'Paused' : 'Playing';
                pillEl.classList.remove('passive');
            }
        }

        // Non-leader notice
        const notice = document.getElementById('mw-passive-notice');
        if (notice) {
            notice.style.display = state.isLeader ? 'none' : 'flex';
        }

        // Playlist selector
        const sel = document.getElementById('mw-playlist-select');
        if (sel && state.playlist) {
            sel.value = state.playlist;
        }

        // Volume sliders (only update if user isn't actively dragging)
        this._setSlider('mw-vol-music',   'mw-vol-music-val',   state.musicVolume);
        this._setSlider('mw-vol-sfx',     'mw-vol-sfx-val',     state.sfxVolume);
        this._setSlider('mw-vol-voice',   'mw-vol-voice-val',   state.voiceVolume);
        this._setSlider('mw-vol-master',  'mw-vol-master-val',  state.masterVolume);

        // Speaker icon reflects muted state
        const icon = this._btn?.querySelector('.music-btn-icon');
        if (icon) {
            const muted = (state.masterVolume ?? 1) < 0.01 || (state.musicVolume ?? 1) < 0.01;
            icon.textContent = muted ? '🔇' : state.paused ? '🔈' : '🔊';
        }
    }

    _setSlider(sliderId, valId, value) {
        if (value == null || typeof value !== 'number' || Number.isNaN(value)) return;
        // While ANY slider is being dragged, skip all programmatic slider/label updates.
        // The active slider's input handler updates its own label directly; every other
        // slider is left alone so the pointer-tracking position isn't disturbed.
        // endVolDrag() resyncs every slider except the one just released.
        if (this._activeVolSliderId !== null) return;
        const slider = document.getElementById(sliderId);
        const label  = document.getElementById(valId);
        if (slider) slider.value = String(value);
        if (label)  label.textContent = Math.round(value * 100) + '%';
    }
}

// ── Convenience factory ────────────────────────────────────────────────────────
export function createMusicWidget() {
    const widget = new MusicWidget();
    widget.mount();
    return widget;
}
