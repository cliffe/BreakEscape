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
import {
    UI_THEMES, SIZE_STEPS, HEALTH_STYLES, getDisplaySettings, updateDisplaySettings, missionTheme,
} from './display-settings.js';

const PAGES = [
    { id: 'audio', label: 'Audio' },
    { id: 'display', label: 'Display' },
    { id: 'controls', label: 'Controls' },
];

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
