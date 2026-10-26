/**
 * Pause menu: Esc, or the menu button in the top-right HUD corner.
 *
 * Pages: Character (opens the existing player preferences modal), Audio (the
 * music widget's panel, moved in while the menu is open so it keeps its own
 * wiring), Display (theme, HUD size, game zoom) and Controls.
 *
 * Esc opens the menu only when nothing else is on screen. Whether it may open
 * is decided in the capture phase, before any minigame or dialog handles the
 * same Esc and closes itself, so closing a minigame with Esc never also opens
 * the menu.
 */

import MusicController from '../music/music-controller.js';
import { setHudLabel, clearHudLabel } from './info-label.js';
import { attacksDisabled } from '../systems/player-combat.js';
import { isDesktopApp, DESKTOP_APP_HOME } from '../utils/desktop-app.js';
import {
    UI_THEMES, SIZE_STEPS, HEALTH_STYLES, getDisplaySettings, updateDisplaySettings, missionTheme,
} from './display-settings.js';

const PAGES = [
    { id: 'audio', label: 'Audio' },
    { id: 'display', label: 'Display' },
    { id: 'controls', label: 'Controls' },
];

// Items a host game shell asks for (breakEscapeConfig.walkthroughUrl and
// shellMenuUrl): the mission's walkthrough in a new tab, and quitting back to
// the shell. Without a shell, the desktop app still gets "Back to missions".
// Either way leaving waits for a confirmed save (see _leave).
export function shellItems(cfg = window.breakEscapeConfig || {}, w = window) {
    let html = '';
    if (cfg.walkthroughUrl) {
        html += '<button type="button" class="game-menu-item" data-action="walkthrough">Walkthrough</button>';
    }
    const exit = leaveTarget(cfg, w);
    if (exit) {
        html += `<button type="button" class="game-menu-item game-menu-leave" data-action="leave">${exit.label}</button>`;
    }
    return html;
}

// Where the pause menu's leave item goes: the host shell's menu, else the desktop app's home.
export function leaveTarget(cfg = window.breakEscapeConfig || {}, w = window) {
    const url = cfg.shellMenuUrl || cfg.shellReturnUrl;
    if (url) return { url, label: 'Save and quit to menu' };
    if (isDesktopApp(w)) return { url: DESKTOP_APP_HOME, label: 'Back to missions' };
    return null;
}

export function openWalkthrough(cfg = window.breakEscapeConfig || {}, open = (url) => window.open(url, '_blank', 'noopener')) {
    if (cfg.walkthroughUrl) open(cfg.walkthroughUrl);
}

export function quitToShell(cfg = window.breakEscapeConfig || {}, navigate = (url) => { window.location.href = url; }) {
    const url = cfg.shellMenuUrl || cfg.shellReturnUrl;
    if (url) navigate(url);
}

function optionList(items, selected) {
    return items.map(({ value, label }) =>
        `<option value="${value}"${String(value) === String(selected) ? ' selected' : ''}>${label}</option>`).join('');
}

export class GameMenu {
    constructor() {
        this.isOpen = false;
        this.page = 'audio';
        this._pausedScene = null;
        this._escMayOpen = false;
        this._musicPanelHome = null;

        this._createButton();
        this._createOverlay();
        this._bindKeys();
    }

    // ── DOM ─────────────────────────────────────────────────────────────────

    _createButton() {
        const btn = document.createElement('div');
        btn.id = 'hud-menu-button';
        btn.setAttribute('role', 'button');
        btn.setAttribute('aria-label', 'Menu');
        btn.innerHTML = '<span class="hud-menu-icon" aria-hidden="true"><i></i><i></i><i></i></span>';
        btn.addEventListener('mouseenter', () => setHudLabel('Menu (Esc)'));
        btn.addEventListener('mouseleave', () => clearHudLabel());
        btn.addEventListener('click', e => { e.stopPropagation(); this.toggle(); });
        this.button = btn;

        const mount = () => {
            const anchor = document.getElementById('music-widget-btn-anchor');
            if (anchor) anchor.appendChild(btn);
            else setTimeout(mount, 150);
        };
        mount();
    }

    _createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'game-menu-overlay';
        overlay.className = 'game-menu-overlay';
        overlay.innerHTML = `
            <div class="game-menu-panel" role="dialog" aria-modal="true" aria-labelledby="game-menu-title">
                <div class="game-menu-header">
                    <div>
                        <h2 id="game-menu-title">Paused</h2>
                        <div class="game-menu-mission"></div>
                    </div>
                    <button class="game-menu-close" type="button" aria-label="Close menu">✕</button>
                </div>
                <div class="game-menu-body">
                    <nav class="game-menu-nav">
                        <button type="button" class="game-menu-item game-menu-resume" data-action="resume">Resume</button>
                        <button type="button" class="game-menu-item" data-action="character">Character</button>
                        ${PAGES.map(p => `<button type="button" class="game-menu-item" data-page="${p.id}">${p.label}</button>`).join('')}
                        ${shellItems()}
                    </nav>
                    <div class="game-menu-pages">
                        <section class="game-menu-page" data-page="audio"></section>
                        <section class="game-menu-page" data-page="display"></section>
                        <section class="game-menu-page" data-page="controls"></section>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        this.overlay = overlay;

        overlay.querySelector('.game-menu-mission').textContent =
            window.breakEscapeConfig?.missionDisplayName || '';

        overlay.addEventListener('click', e => {
            if (e.target === overlay) { this.close(); return; }
            const item = e.target.closest('.game-menu-item');
            if (!item) return;
            if (item.dataset.page) this.showPage(item.dataset.page);
            else if (item.dataset.action === 'resume') this.close();
            else if (item.dataset.action === 'character') this._openCharacter();
            else if (item.dataset.action === 'walkthrough') openWalkthrough();
            else if (item.dataset.action === 'leave') this._askLeave();
        });
        overlay.querySelector('.game-menu-close').addEventListener('click', () => this.close());

        this._renderControls();
    }

    _renderDisplay() {
        const s = getDisplaySettings();
        const missionLabel = UI_THEMES.find(t => t.id === missionTheme())?.label || 'General';
        const themeOptions = [{ value: '', label: `Mission default (${missionLabel})` }]
            .concat(UI_THEMES.map(t => ({ value: t.id, label: t.label })));
        const page = this.overlay.querySelector('.game-menu-page[data-page="display"]');
        page.innerHTML = `
            <h3>Display</h3>
            <label class="game-menu-field">
                <span>Interface theme</span>
                <select data-setting="theme">${optionList(themeOptions, s.theme || '')}</select>
            </label>
            <label class="game-menu-field">
                <span>Player health</span>
                <select data-setting="healthStyle">${optionList(HEALTH_STYLES, s.healthStyle)}</select>
            </label>
            <label class="game-menu-field">
                <span>HUD size</span>
                <select data-setting="hudStep">${optionList(SIZE_STEPS, s.hudStep)}</select>
            </label>
            <label class="game-menu-field">
                <span>Game zoom</span>
                <select data-setting="zoomStep">${optionList(SIZE_STEPS, s.zoomStep)}</select>
            </label>
            <p class="game-menu-note">Saved in this browser. Auto sizes follow the window.</p>
            <button type="button" class="game-menu-reset">Reset to defaults</button>
        `;
        page.querySelectorAll('select[data-setting]').forEach(sel => {
            sel.addEventListener('change', () => {
                const key = sel.dataset.setting;
                const value = key === 'theme' ? (sel.value || null)
                    : key === 'healthStyle' ? sel.value
                    : parseInt(sel.value, 10);
                updateDisplaySettings({ [key]: value });
            });
        });
        page.querySelector('.game-menu-reset').addEventListener('click', () => {
            updateDisplaySettings({ theme: null, hudStep: 0, zoomStep: 0, healthStyle: 'hearts' });
            this._renderDisplay();
        });
    }

    _renderControls() {
        const rows = [
            ['W A S D / arrows', 'Move'],
            ['Shift', 'Run'],
            ['Space', 'Jump'],
            ['E or click', 'Interact'],
        ];
        if (!attacksDisabled()) rows.push(['Q', 'Switch interact / punch']);
        rows.push(['Esc', 'Menu, or close a window']);
        const page = this.overlay.querySelector('.game-menu-page[data-page="controls"]');
        page.innerHTML = `
            <h3>Controls</h3>
            <dl class="game-menu-keys">
                ${rows.map(([k, v]) => `<dt><kbd>${k}</kbd></dt><dd>${v}</dd>`).join('')}
            </dl>
        `;
    }

    // ── Pages ───────────────────────────────────────────────────────────────

    showPage(id) {
        this.page = id;
        this.overlay.querySelectorAll('.game-menu-item[data-page]').forEach(b =>
            b.classList.toggle('active', b.dataset.page === id));
        this.overlay.querySelectorAll('.game-menu-page').forEach(p =>
            p.classList.toggle('active', p.dataset.page === id));
        if (id === 'display') this._renderDisplay();
        if (id === 'audio') this._borrowMusicPanel();
    }

    _borrowMusicPanel() {
        const panel = document.getElementById('music-widget-panel');
        const page = this.overlay.querySelector('.game-menu-page[data-page="audio"]');
        if (!panel) {
            page.innerHTML = '<h3>Audio</h3><p class="game-menu-note">Audio controls are still loading.</p>';
            return;
        }
        if (panel.parentElement !== page) {
            this._musicPanelHome = panel.parentElement;
            page.innerHTML = '<h3>Audio</h3>';
            page.appendChild(panel);
        }
        window.musicWidget?._hidePanel?.();
        try { window.musicWidget?._updateUI?.(MusicController.getState()); } catch (e) { /* not ready */ }
    }

    _returnMusicPanel() {
        const panel = document.getElementById('music-widget-panel');
        if (panel && this._musicPanelHome && panel.parentElement !== this._musicPanelHome) {
            this._musicPanelHome.appendChild(panel);
        }
    }

    // Desktop app only: the window has no tabs or address bar, so the menu is the way out.
    // Asks in the menu's own panel (no confirm() dialog), then saves and goes to the host's
    // root, which sends the app to its game's event page.
    _askLeave() {
        const page = this.overlay.querySelector('.game-menu-page[data-page="leave"]') || (() => {
            const section = document.createElement('section');
            section.className = 'game-menu-page';
            section.dataset.page = 'leave';
            this.overlay.querySelector('.game-menu-pages').appendChild(section);
            return section;
        })();
        page.innerHTML = `
            <h3>${(leaveTarget() || {}).label || 'Back to missions'}</h3>
            <p class="game-menu-note">Your progress is saved, and you can carry on from the mission list. A puzzle or conversation you haven't finished starts again when you come back.</p>
            <p class="game-menu-note game-menu-leave-error" role="alert" hidden>Couldn't save just now. Check your connection and try again.</p>
            <button type="button" class="game-menu-reset" data-leave="yes">Leave the game</button>
            <button type="button" class="game-menu-reset" data-leave="no">Stay</button>
        `;
        page.querySelector('[data-leave="no"]').addEventListener('click', () => this.showPage('audio'));
        const yes = page.querySelector('[data-leave="yes"]');
        yes.addEventListener('click', () => this._leave(yes.dataset.force === 'yes'));
        this.showPage('leave');
    }

    // Saves and waits for the server to confirm before leaving. If the save fails the player
    // stays, with the error shown and "Leave anyway" offered (the pagehide flush still tries).
    async _leave(force = false) {
        const button = this.overlay.querySelector('[data-leave="yes"]');
        const error = this.overlay.querySelector('.game-menu-leave-error');
        if (!force) {
            if (button) button.disabled = true;
            let saved = true;
            try {
                const sync = window.stateSync;
                if (sync?.syncConfirmed) saved = await sync.syncConfirmed();
            } catch (e) { saved = false; }
            if (button) button.disabled = false;
            if (!saved) {
                if (error) error.hidden = false;
                if (button) {
                    button.textContent = 'Leave anyway';
                    button.dataset.force = 'yes';
                }
                return;
            }
        }
        const target = leaveTarget() || { url: DESKTOP_APP_HOME };
        (this._navigate || ((url) => { window.location.href = url; }))(target.url);
    }

    _openCharacter() {
        this.close();
        window.playerHUD?.openPlayerPreferences?.();
    }

    // ── Open / close ────────────────────────────────────────────────────────

    open() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.overlay.classList.add('visible');
        this.button.classList.add('panel-open');
        clearHudLabel();
        this.showPage(this.page);

        window.pauseKeyboardInput?.();
        const scene = window.playerHUD?.scene;
        if (scene?.scene && !scene.scene.isPaused()) {
            scene.scene.pause();
            this._pausedScene = scene;
        }
        this.overlay.querySelector('.game-menu-resume')?.focus();
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        if (this.page === 'leave') this.page = 'audio'; // never reopen on the confirmation
        this.overlay.classList.remove('visible');
        this.button.classList.remove('panel-open');
        this._returnMusicPanel();

        window.resumeKeyboardInput?.();
        if (this._pausedScene?.scene?.isPaused()) this._pausedScene.scene.resume();
        this._pausedScene = null;
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }

    // ── Esc ─────────────────────────────────────────────────────────────────

    _somethingElseOpen() {
        if (window.MinigameFramework?.currentMinigame) return true;
        const prefs = document.getElementById('player-preferences-modal');
        if (prefs && prefs.style.display && prefs.style.display !== 'none') return true;
        const active = document.activeElement;
        if (active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)) return true;

        // Anything covering the middle of the game (dialogs, tutorial, overlays)
        const canvas = window.game?.canvas;
        if (canvas && document.elementsFromPoint) {
            const r = canvas.getBoundingClientRect();
            const top = document.elementsFromPoint(innerWidth / 2, innerHeight / 2)[0];
            if (top && top !== canvas && r.width > 0) return true;
        }
        return false;
    }

    _bindKeys() {
        window.addEventListener('keydown', e => {
            if (e.key === 'Escape') this._escMayOpen = !this.isOpen && !this._somethingElseOpen();
        }, true);

        window.addEventListener('keydown', e => {
            if (e.key !== 'Escape' || e.repeat) return;
            if (this.isOpen) {
                e.preventDefault();
                this.close();
            } else if (this._escMayOpen) {
                e.preventDefault();
                this.open();
            }
        });
    }
}

export function createGameMenu() {
    return new GameMenu();
}
