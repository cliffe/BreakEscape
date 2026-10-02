import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';

/**
 * Alarm Panel Minigame
 *
 * Fully scenario-driven. All Albion-specific values come from scenarioData
 * (passed as params via startAlarmPanelMinigame).
 *
 * Required params:
 *   lamps[]      — lamp row definitions (see below)
 *
 * Optional params:
 *   panelTitle   — header text, supports <br> (default: 'FACILITY ALARM PANEL')
 *   footer       — footer line (default: 'STATE-REACTIVE LAMP DISPLAY — READ ONLY')
 *
 * Lamp schema (standard two-state):
 *   { label, variable, offClass, offStatus, onClass, onStatus, flash }
 *
 * Lamp schema (multi-state):
 *   { label, multiState: true, variables: [], states: [{ variable, cssClass, statusText, flash }] }
 *   States are evaluated in order; first whose variable is truthy wins.
 *   The final state should have no variable (acts as default).
 */

export class AlarmPanelMinigame extends MinigameScene {
    constructor(container, params = {}) {
        const md = params.lockable?.scenarioData?.minigameData || {};
        super(container, { ...params, showCancel: true, cancelText: 'Close Panel', title: 'Facility Alarm Panel' });
        this._lamps      = md.lamps      || [];
        this._panelTitle = md.panelTitle;
        this._footer     = md.footer;
        this._eventSubs  = [];
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    init() {
        super.init();
        if (this.headerElement) this.headerElement.style.display = 'none';
        this.container.classList.add('ap-minigame-container');
        this.gameContainer.classList.add('ap-game-container');
        this._renderLayout();
    }

    start() {
        super.start();
        this._updateAllLamps();
        this._subscribeEvents();
    }

    // ── Layout ────────────────────────────────────────────────────────────────

    _renderLayout() {
        const CX    = 40;
        const R     = 14;
        const ROW_H = 68;
        const SVG_W = 420;
        const SVG_H = 30 + this._lamps.length * ROW_H + 20;

        const panelTitle = displayDashes(this._panelTitle || 'FACILITY ALARM PANEL');
        const footer     = displayDashes(this._footer     || 'STATE-REACTIVE LAMP DISPLAY — READ ONLY');

        const rows = this._lamps.map((lamp, i) => {
            const cy   = 30 + i * ROW_H + ROW_H / 2;
            const sepY = cy + ROW_H / 2;
            const initialStatus = lamp.multiState
                ? (lamp.states?.[lamp.states.length - 1]?.statusText || '')
                : (lamp.offStatus || '');
            return `
  <g class="ap-lamp-row" data-index="${i}">
    <circle id="ap-lamp-${i}" cx="${CX}" cy="${cy}" r="${R}" class="ap-off"/>
    <text class="ap-label"  x="${CX + R + 14}" y="${cy - 7}">${displayDashes(lamp.label)}</text>
    <text class="ap-status" id="ap-status-${i}" x="${CX + R + 14}" y="${cy + 11}">${displayDashes(initialStatus)}</text>
    <line class="ap-row-sep" x1="0" y1="${sepY}" x2="${SVG_W}" y2="${sepY}"/>
  </g>`;
        }).join('');

        this.gameContainer.innerHTML = `
<div class="ap-panel-wrap">
  <div class="ap-panel-header">
    <span class="ap-panel-title">${panelTitle}</span>
    <span class="ap-live-dot" title="Live — updates on global variable changes"></span>
  </div>
  <svg class="ap-svg" viewBox="0 0 ${SVG_W} ${SVG_H}" xmlns="http://www.w3.org/2000/svg">
    ${rows}
  </svg>
  <div class="ap-footer">${footer}</div>
</div>`;
    }

    // ── Lamp update ───────────────────────────────────────────────────────────

    _updateAllLamps() {
        this._lamps.forEach((_, i) => this._updateLamp(i));
    }

    _updateLamp(index) {
        const lamp     = this._lamps[index];
        const circle   = this.gameContainer.querySelector(`#ap-lamp-${index}`);
        const statusEl = this.gameContainer.querySelector(`#ap-status-${index}`);
        if (!circle || !statusEl) return;

        if (lamp.multiState) {
            const globals = window.gameState?.globalVariables || {};
            const active  = lamp.states.find(s => !s.variable || !!globals[s.variable]);
            circle.className.baseVal = active.flash ? `${active.cssClass} ap-flash` : active.cssClass;
            statusEl.textContent     = displayDashes(active.statusText);
            statusEl.style.fill      = this._colourFor(active.cssClass);
            return;
        }

        const isOn = !!window.gameState?.globalVariables?.[lamp.variable];
        circle.className.baseVal = isOn
            ? (lamp.flash ? `${lamp.onClass} ap-flash` : lamp.onClass)
            : lamp.offClass;
        statusEl.textContent = displayDashes(isOn ? lamp.onStatus : lamp.offStatus);
        statusEl.style.fill  = this._colourFor(isOn ? lamp.onClass : lamp.offClass);
    }

    _colourFor(cls) {
        if (cls === 'ap-green') return '#00c853';
        if (cls === 'ap-amber') return '#f59e0b';
        if (cls === 'ap-red')   return '#ef4444';
        return '#3a4a60';
    }

    // ── Event subscription ────────────────────────────────────────────────────

    _subscribeEvents() {
        this._lamps.forEach((lamp, i) => {
            const varNames = lamp.multiState ? lamp.variables : [lamp.variable];
            varNames.forEach(varName => {
                const eventName = `global_variable_changed:${varName}`;
                const handler   = () => this._updateLamp(i);
                window.eventDispatcher?.on(eventName, handler);
                this._eventSubs.push({ event: eventName, handler });
            });
        });
    }

    cleanup() {
        this._eventSubs.forEach(sub => window.eventDispatcher?.off(sub.event, sub.handler));
        this._eventSubs = [];
        super.cleanup();
    }
}
