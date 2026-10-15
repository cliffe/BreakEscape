/**
 * VmControlsWidget — HUD button that opens the VM set control panel in an overlay iframe.
 *
 * Only mounts when window.breakEscapeConfig.vmSetPanelUrl is non-empty (VM-backed missions).
 * The button uses the vm-launcher sprite and shows a green border when the VM set is
 * activated, red when not. Activation state is seeded from breakEscapeConfig.vmSetActivated
 * and updated live via postMessage from the embedded Hacktivity vm_set page.
 */

import { setHudLabel, clearHudLabel } from './info-label.js';

export class VmControlsWidget {
    constructor() {
        this._overlayOpen    = false;
        this._url            = window.breakEscapeConfig?.vmSetPanelUrl || '';
        this._activated      = window.breakEscapeConfig?.vmSetActivated ?? false;
        this._activatedUntil = window.breakEscapeConfig?.vmSetActivatedUntil
                                 ? new Date(window.breakEscapeConfig.vmSetActivatedUntil)
                                 : null;
        this._btn              = null;
        this._overlay          = null;
        this._iframe           = null;
        this._countdownEl      = null;
        this._countdownInterval = null;
    }

    mount() {
        if (!this._url) return;

        this._createButton();
        this._createOverlay();
        this._bindEvents();
        this._applyActivationState();
        this._scheduleCountdown();
    }

    // ── Build DOM ─────────────────────────────────────────────────────────────

    _createButton() {
        const btn = document.createElement('div');
        btn.id        = 'vm-controls-btn';
        btn.className = 'vm-controls-hud-btn';

        btn.addEventListener('mouseenter', () => setHudLabel(this._activated ? 'VM Controls (Active)' : 'VM Controls (Inactive)'));
        btn.addEventListener('mouseleave', () => clearHudLabel());

        const assetsPath = window.breakEscapeConfig?.assetsPath || '/break_escape/assets';
        btn.innerHTML = `
            <img class="vm-controls-btn-icon" src="${assetsPath}/objects/vm-launcher.png" alt="VM Controls">
            <span class="vm-countdown"></span>
        `;
        btn.addEventListener('click', e => { e.stopPropagation(); this._toggleOverlay(); });
        this._btn        = btn;
        this._countdownEl = btn.querySelector('.vm-countdown');

        // Insert into the top-right anchor alongside the music button.
        const tryMount = () => {
            const anchor = document.getElementById('music-widget-btn-anchor');
            if (anchor) {
                anchor.insertBefore(btn, anchor.firstChild);
            } else {
                setTimeout(tryMount, 150);
            }
        };
        tryMount();
    }

    _createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'vm-controls-overlay';
        overlay.innerHTML = `
            <div id="vm-controls-modal">
                <div id="vm-controls-modal-header">
                    <span id="vm-controls-modal-title">&#9881; VM Controls</span>
                    <button id="vm-controls-close-btn" title="Close">&#10005;</button>
                </div>
                <iframe id="vm-controls-iframe" src="" title="VM Controls" frameborder="0" allowfullscreen></iframe>
            </div>
        `;
        document.body.appendChild(overlay);
        this._overlay = overlay;
        this._iframe  = overlay.querySelector('#vm-controls-iframe');
    }

    // ── Events ────────────────────────────────────────────────────────────────

    _bindEvents() {
        this._overlay.querySelector('#vm-controls-close-btn').addEventListener('click', () => {
            this._hideOverlay();
        });

        // Backdrop click closes.
        this._overlay.addEventListener('click', e => {
            if (e.target === this._overlay) this._hideOverlay();
        });

        // Escape key closes.
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && this._overlayOpen) this._hideOverlay();
        });

        // Receive activation state updates from the embedded Hacktivity iframe.
        window.addEventListener('message', e => {
            if (e.data?.type === 'vmSetState' && typeof e.data.activated === 'boolean') {
                this.setActivated(e.data.activated, e.data.activatedUntil ?? null);
            }
        });
    }

    // ── Activation state ──────────────────────────────────────────────────────

    setActivated(activated, activatedUntil = null) {
        this._activated      = activated;
        this._activatedUntil = activatedUntil ? new Date(activatedUntil) : null;
        this._applyActivationState();
        this._scheduleCountdown();
    }

    _applyActivationState() {
        if (!this._btn) return;
        this._btn.classList.toggle('vm-activated',   this._activated);
        this._btn.classList.toggle('vm-deactivated', !this._activated);
    }

    // ── Shutdown countdown ────────────────────────────────────────────────────

    _scheduleCountdown() {
        if (this._countdownInterval) {
            clearInterval(this._countdownInterval);
            this._countdownInterval = null;
        }
        if (!this._activatedUntil) {
            this._setCountdownText(this._activated ? '' : 'VMs Down');
            return;
        }
        this._tickCountdown();
        this._countdownInterval = setInterval(() => this._tickCountdown(), 1000);
    }

    _tickCountdown() {
        const remaining = this._activatedUntil - Date.now();
        if (remaining <= 0) {
            clearInterval(this._countdownInterval);
            this._countdownInterval = null;
            this._activated = false;
            this._applyActivationState();
            this._setCountdownText('VMs Down');
            return;
        }
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        const text = h > 0 || m >= 10
            ? `${h > 0 ? h + 'h ' : ''}${m}m`
            : `${m}m ${s}s`;
        this._setCountdownText(text);
    }

    _setCountdownText(text) {
        if (!this._countdownEl) return;
        this._countdownEl.textContent = text;
        this._btn?.classList.toggle('has-countdown', text !== '');
    }

    // ── Show / hide ───────────────────────────────────────────────────────────

    _toggleOverlay() {
        if (this._overlayOpen) this._hideOverlay();
        else                   this._showOverlay();
    }

    _showOverlay() {
        if (!this._iframe.src || this._iframe.src === window.location.href) {
            this._iframe.src = this._url;
        }
        this._overlay.classList.add('visible');
        this._btn.classList.add('panel-open');
        this._overlayOpen = true;
    }

    _hideOverlay() {
        this._overlay.classList.remove('visible');
        this._btn.classList.remove('panel-open');
        // Clear src so each open gets a fresh load (picks up any VM state changes).
        this._iframe.src = '';
        this._overlayOpen = false;
    }
}

// ── Convenience factory ────────────────────────────────────────────────────────
export function createVmControlsWidget() {
    const widget = new VmControlsWidget();
    widget.mount();
    return widget;
}
