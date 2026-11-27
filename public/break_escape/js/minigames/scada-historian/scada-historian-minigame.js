/**
 * ScadaHistorianMinigame — VM-01 sis02_energy
 *
 * Interactive SCADA historian trend analyser. Renders SVG time-series charts
 * for up to 4 racks. Detects Modbus register injection via flat-line anomaly.
 *
 * All data generated client-side from scenarioData rack parameters:
 *   normalBase, noisePeriodMinutes, noiseAmplitude → organic pre-injection trace
 *   injectionTimestamp, injectedValue              → perfect flat post-injection trace
 *
 * Completion (D167: the player makes the finding, the viewer does not hand it over):
 *   1. The chart draws raw readings only. The player marks the moment the data stops
 *      behaving like a real sensor (click, tap, or Enter on the keyboard cursor);
 *      judgeMark accepts a mark near the first falsified reading, else a gentle retry.
 *   2. ANNOTATE FINDING opens the report, which asks what the data shows. A wrong
 *      choice gets a reason from the data; the right one reveals the finding, the
 *      injection line and the anomaly tooltips, and the confirm button fires
 *      completionActions → complete(true).
 *
 * Times, values, deltas and durations in the tooltip, banner and report all come
 * from scada-historian-data.js, which reads minigameData and the drawn points.
 */

import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';
import {
    TIME_RANGES, DEFAULT_HINT, parseHistorianConfig, buildRackTrend, findAnomaly,
    tooltipText, compareBannerText, compareNeutralText, compareValuesText, reportContent,
    judgeMark, judgeFinding, FINDING_QUESTION, FINDING_CHOICES, fmtFull,
} from './scada-historian-data.js';

// Rack colour palette: A1 bright amber, A2 gold, A3 yellow, A4 pale amber
const RACK_COLOURS = ['#f5a623', '#d4a017', '#e8d44d', '#f0c87a'];
// Post-injection trace colour (brighter, visually distinct)
const INJECT_COLOUR = '#ffcc44';
// dZ/dt trace
const DZDT_COLOUR = '#00c5cd';
// Injection transition line (drawn only once the player has made the finding)
const INJECT_LINE_COLOUR = '#ff4040';
// The player's accepted mark and the keyboard cursor
const MARK_LINE_COLOUR = '#aabbdd';
const CURSOR_COLOUR = '#556688';
// Wait this long after the last cursor move before a screen reader is told the reading
export const SR_DEBOUNCE_MS = 250;

// Y-axis fixed domain per spec (prevents cherry-picking)
const Y_MIN = 24;
const Y_MAX = 42;

export class ScadaHistorianMinigame extends MinigameScene {
    // Draws in the shared console window (UI decision X8): title bar and X come from there
    static consoleWindow = true;
    static consoleWindowFill = true;

    constructor(container, params = {}) {
        const sd = params.sprite?.scenarioData?.minigameData || {};

        super(container, {
            ...params,
            title:      sd.title || 'SCADA HISTORIAN',
            showCancel: true,
            cancelText: 'Close',
        });

        this._sd                = sd;
        this._title             = sd.title    || 'ALBION ENERGY STORAGE: SCADA HISTORIAN';
        this._subtitle          = sd.subtitle || 'Battery Hall 1: Temperature (°C)';
        this._cfg               = parseHistorianConfig(sd);
        this._racksConfig       = this._cfg.racks;
        this._injectionTs       = this._cfg.injectionTs;
        this._histEndTs         = this._cfg.histEndTs;
        this._defaultRangeHours = this._cfg.defaultRangeHours;
        this._hintText          = sd.hintText || DEFAULT_HINT;
        this._completionActions = sd.completionActions   || [];
        this._progressActions   = sd.progressActions     || [];

        // UI state
        this._selectedRacks   = new Set([this._racksConfig[0].id]);
        this._focusRackId     = this._racksConfig[0].id; // rack the tooltip and report describe
        this._compareMode     = false;
        this._dzDtActive      = false;
        this._timeRangeHours  = this._defaultRangeHours;
        this._annotateUnlocked = false;
        this._revealed        = false; // the player has chosen the right finding in the report
        this._markTs          = null;  // the reading the player marked, once accepted
        this._cursorIdx       = null;  // keyboard cursor, an index into this._visible
        this._visible         = [];    // the primary rack's points in the current window
        this._plot            = null;  // geometry of the last chart render
        this._completionFired = false;
        // Already confirmed in an earlier visit: start with the finding made (D167 R1 m5)
        // The key comes from the scenario's completion actions (R2 m3); the first set_global with value true decides
        const doneKey = this._completionActions.find(a => a && a.type === 'set_global' && a.value === true)?.key;
        if (doneKey && window.gameState?.globalVariables?.[doneKey]) this._revealed = true;
        this._srTimer         = null;  // debounce for the screen-reader reading announcement
        this._progressFired   = new Set();
        this._trendData       = new Map(); // rackId → [{ts, value, dzdt, isInjected, isTransition}]

        // DOM refs set in start()
        this._chartSvg   = null;
        this._dzdtSvg    = null;
        this._tooltip    = null;
        this._annotateBtn = null;
        this._bannerEl   = null;
        this._infoBanner = null;
        this._hintEl     = null;
        this._hintText2  = null;
    }

    // ── Lifecycle ──────────────────────────────────────────────────────────

    start() {
        super.start();
        this._buildTrendData();
        console.log('[ScadaHistorian] trendData built, racks:', this._trendData.size, 'first rack points:', this._trendData.values().next().value?.length);
        this._renderLayout();
        // Defer chart render until after the DOM has been laid out by the browser
        requestAnimationFrame(() => this._renderChart());
    }

    cleanup() {
        if (this._srTimer) { clearTimeout(this._srTimer); this._srTimer = null; }
        super.cleanup();
    }

    // ── Data generation ────────────────────────────────────────────────────

    _buildTrendData() {
        for (const rack of this._racksConfig) {
            this._trendData.set(rack.id, buildRackTrend(rack, this._cfg));
        }
    }

    _anomalyFor(rackId) {
        const points = this._trendData.get(rackId);
        return points ? findAnomaly(points, this._cfg) : null;
    }

    consoleTitle() { return this._title; }
    consoleSubtitle() { return this._subtitle; }

    // ── Layout ─────────────────────────────────────────────────────────────

    _renderLayout() {
        const gc = this.gameContainer;
        gc.innerHTML = '';
        gc.style.cssText = 'padding:0;display:flex;flex-direction:column;height:100%;overflow:hidden;';

        const wrap = this._el('div', 'sh-wrapper');

        // The title and subtitle are in the shared console bar (consoleTitle / consoleSubtitle);
        // no [CLOSE] of its own: the shared X and Esc close the console

        // Body
        const body = this._el('div', 'sh-body');

        // Left panel
        const left = this._el('div', 'sh-left-panel');
        const rackTitle = this._el('div', 'sh-panel-section-title');
        rackTitle.textContent = 'RACK SELECTOR';
        left.appendChild(rackTitle);
        for (const rack of this._racksConfig) {
            const label = this._el('div', 'sh-rack-label');
            label.dataset.rackId = rack.id;
            if (this._selectedRacks.has(rack.id)) label.classList.add('active');
            const cb = this._el('span', 'sh-rack-checkbox');
            cb.dataset.rackId = rack.id;
            if (this._selectedRacks.has(rack.id)) cb.classList.add('checked');
            cb.textContent = '';   // a filled square marks a ticked rack (CSS), no tick glyph (slice 7 R1 m4)
            const lbl = document.createTextNode(displayDashes(rack.label || rack.id));
            label.appendChild(cb);
            label.appendChild(lbl);
            label.addEventListener('click', () => this._toggleRack(rack.id));
            left.appendChild(label);
        }
        const div1 = this._el('hr', 'sh-divider');
        left.appendChild(div1);
        const analysisTitle = this._el('div', 'sh-panel-section-title');
        analysisTitle.textContent = 'ANALYSIS';
        left.appendChild(analysisTitle);
        this._annotateBtn = this._el('button', 'sh-annotate-btn');
        this._annotateBtn.textContent = '[ANNOTATE FINDING]';
        this._annotateBtn.disabled = true;
        this._annotateBtn.style.pointerEvents = 'none';
        this._annotateBtn.addEventListener('click', () => {
            if (this._annotateUnlocked) this._openAnnotateModal();
        });
        left.appendChild(this._annotateBtn);
        this._annotateNote = this._el('div', 'sh-annotate-note');
        this._annotateNote.textContent = 'Mark the moment on the chart first.';
        left.appendChild(this._annotateNote);
        body.appendChild(left);

        // Right panel
        const right = this._el('div', 'sh-right-panel');

        // Toolbar
        const toolbar = this._el('div', 'sh-toolbar');
        // Time range buttons
        const rangeGroup = this._el('div', 'sh-toolbar-group');
        const rangeLabel = this._el('span', 'sh-toolbar-label');
        rangeLabel.textContent = 'TIME RANGE:';
        rangeGroup.appendChild(rangeLabel);
        for (const h of TIME_RANGES) {
            const btn = this._el('button', 'sh-range-btn');
            btn.dataset.hours = h;
            btn.textContent = h + 'h';
            if (h === this._timeRangeHours) btn.classList.add('active');
            btn.addEventListener('click', () => this._setTimeRange(h));
            rangeGroup.appendChild(btn);
        }
        toolbar.appendChild(rangeGroup);

        // dZ/dt toggle
        const overlayGroup = this._el('div', 'sh-toolbar-group');
        const dzBtn = this._el('button', 'sh-toggle-btn');
        dzBtn.id = 'sh-dzdt-toggle';
        dzBtn.textContent = 'dZ/dt OFF';
        dzBtn.addEventListener('click', () => this._toggleDzDt());
        overlayGroup.appendChild(dzBtn);
        toolbar.appendChild(overlayGroup);

        // Compare Racks toggle
        const compareGroup = this._el('div', 'sh-toolbar-group');
        const compareBtn = this._el('button', 'sh-toggle-btn');
        compareBtn.id = 'sh-compare-toggle';
        compareBtn.textContent = 'COMPARE RACKS';
        compareBtn.addEventListener('click', () => this._toggleCompare());
        compareGroup.appendChild(compareBtn);
        toolbar.appendChild(compareGroup);

        right.appendChild(toolbar);

        // Charts area
        const charts = this._el('div', 'sh-charts pixel-scroll');

        // Hint line at the top of the chart (the framework's Close button covers the bottom);
        // it carries the retry hints, so screen readers hear them
        this._hintEl = this._el('div', 'sh-hint');
        this._hintEl.setAttribute?.('aria-live', 'polite');
        this._hintText2 = this._el('span', 'sh-hint-text');
        this._hintText2.textContent = displayDashes(this._hintText);
        this._hintEl.appendChild(this._hintText2);
        charts.appendChild(this._hintEl);

        // Info banner (hidden until dZ/dt first enabled)
        this._infoBanner = this._el('div', 'sh-info-banner');
        this._infoBanner.style.display = 'none';
        this._infoBanner.textContent = 'Rate of Change (dZ/dt): How much the temperature changes per minute. Real sensors always show nonzero variance. A dZ/dt of exactly 0.000 across multiple consecutive readings is physically impossible without data manipulation.';
        charts.appendChild(this._infoBanner);

        // Banner (hidden until compare mode)
        this._bannerEl = this._el('div', 'sh-banner');
        this._bannerEl.style.display = 'none';
        charts.appendChild(this._bannerEl);

        // Main chart
        const chartArea = this._el('div', 'sh-chart-area');
        chartArea.id = 'sh-chart-area';
        // Keyboard: Left/Right move a reading cursor, Enter or Space marks it
        chartArea.tabIndex = 0;
        chartArea.setAttribute?.('role', 'application');
        chartArea.setAttribute?.('aria-label', 'Temperature trend. Left and Right arrows step through readings; Enter marks one.');
        chartArea.addEventListener('keydown', (e) => this._onChartKey(e));
        this._tooltip = this._el('div', 'sh-tooltip');
        this._tooltip.style.display = 'none';
        chartArea.appendChild(this._tooltip);
        // The cursor's time and value for screen readers (the visual tooltip is not a live region)
        this._srEl = this._el('div', 'sh-sr-only');
        this._srEl.setAttribute?.('aria-live', 'polite');
        this._srEl.setAttribute?.('aria-atomic', 'true');
        chartArea.appendChild(this._srEl);
        charts.appendChild(chartArea);

        // dZ/dt panel
        const dzdtPanel = this._el('div', 'sh-dzdt-panel');
        dzdtPanel.id = 'sh-dzdt-panel';
        charts.appendChild(dzdtPanel);

        right.appendChild(charts);
        body.appendChild(right);
        wrap.appendChild(body);
        gc.appendChild(wrap);
        if (this._revealed) {
            this._unlockAnnotate();
            this._hintText2.textContent = 'Finding already confirmed. [ANNOTATE FINDING] opens the report again.';
        }
    }

    // ── Chart rendering ────────────────────────────────────────────────────

    _renderChart() {
        const chartArea = document.getElementById('sh-chart-area');
        if (!chartArea) return;

        // Remove old SVG
        const oldSvg = chartArea.querySelector('svg');
        if (oldSvg) oldSvg.remove();

        // Use a fixed coordinate space — SVG is 100%x100% of container,
        // scaled via viewBox. This avoids clientWidth/clientHeight = 0 when
        // the flex chain has no resolved pixel height from the framework.
        // Drawn at the area's own pixel size when it has one, so the axis labels are
        // 16px and the lines 2px on screen, not scaled down with the chart (slice 7 R1 m5)
        const W = Math.round(chartArea.clientWidth) || 800;
        const H = Math.round(chartArea.clientHeight) || 400;
        const PAD = { top: 14, right: 16, bottom: 28, left: 46 };
        const plotW = W - PAD.left - PAD.right;
        const plotH = H - PAD.top  - PAD.bottom;

        console.log('[ScadaHistorian] _renderChart W/H:', W, H, 'racks:', [...this._trendData.keys()], 'A1 pts:', this._trendData.get('A1')?.length);

        // Time window
        const endTs    = this._histEndTs;
        const startTs  = endTs - this._timeRangeHours * 3600000;
        const tsRange  = endTs - startTs;

        const svg = this._makeSvg(W, H);

        // Grid lines
        const gridG = this._svgEl('g');
        // Y grid (every 4°C)
        for (let t = Y_MIN; t <= Y_MAX; t += 4) {
            const y = PAD.top + plotH - ((t - Y_MIN) / (Y_MAX - Y_MIN)) * plotH;
            const line = this._svgEl('line');
            line.setAttribute('x1', PAD.left); line.setAttribute('x2', PAD.left + plotW);
            line.setAttribute('y1', y); line.setAttribute('y2', y);
            line.setAttribute('stroke', '#0d1a2e'); line.setAttribute('stroke-width', '2');
            gridG.appendChild(line);
        }
        svg.appendChild(gridG);

        // Y axis ticks + labels
        const yAxisG = this._svgEl('g');
        for (let t = Y_MIN; t <= Y_MAX; t += 4) {
            const y = PAD.top + plotH - ((t - Y_MIN) / (Y_MAX - Y_MIN)) * plotH;
            const tick = this._svgEl('line');
            tick.setAttribute('x1', PAD.left - 4); tick.setAttribute('x2', PAD.left);
            tick.setAttribute('y1', y); tick.setAttribute('y2', y);
            tick.setAttribute('stroke', '#445566'); tick.setAttribute('stroke-width', '2');
            yAxisG.appendChild(tick);
            const lbl = this._svgEl('text');
            lbl.setAttribute('x', PAD.left - 6); lbl.setAttribute('y', y + 4);
            lbl.setAttribute('text-anchor', 'end');
            lbl.setAttribute('fill', '#556688'); lbl.setAttribute('font-size', '16');
            lbl.setAttribute('font-family', 'VT323, monospace');
            lbl.textContent = t + '°C';
            yAxisG.appendChild(lbl);
        }
        svg.appendChild(yAxisG);

        // X axis ticks
        const xAxisG = this._svgEl('g');
        const tickIntervalMs = this._xTickInterval();
        let tickTs = Math.ceil(startTs / tickIntervalMs) * tickIntervalMs;
        while (tickTs <= endTs) {
            const x = PAD.left + ((tickTs - startTs) / tsRange) * plotW;
            const tick = this._svgEl('line');
            tick.setAttribute('x1', x); tick.setAttribute('x2', x);
            tick.setAttribute('y1', PAD.top + plotH); tick.setAttribute('y2', PAD.top + plotH + 4);
            tick.setAttribute('stroke', '#445566'); tick.setAttribute('stroke-width', '2');
            xAxisG.appendChild(tick);
            const lbl = this._svgEl('text');
            lbl.setAttribute('x', x); lbl.setAttribute('y', PAD.top + plotH + 14);
            lbl.setAttribute('text-anchor', 'middle');
            lbl.setAttribute('fill', '#556688'); lbl.setAttribute('font-size', '16');
            lbl.setAttribute('font-family', 'VT323, monospace');
            lbl.textContent = this._fmtTime(new Date(tickTs));
            xAxisG.appendChild(lbl);
            tickTs += tickIntervalMs;
        }
        svg.appendChild(xAxisG);

        // Axes
        const axisG = this._svgEl('g');
        const yAxis = this._svgEl('line');
        yAxis.setAttribute('x1', PAD.left); yAxis.setAttribute('x2', PAD.left);
        yAxis.setAttribute('y1', PAD.top); yAxis.setAttribute('y2', PAD.top + plotH);
        yAxis.setAttribute('stroke', '#445566'); yAxis.setAttribute('stroke-width', '2');
        axisG.appendChild(yAxis);
        const xAxis = this._svgEl('line');
        xAxis.setAttribute('x1', PAD.left); xAxis.setAttribute('x2', PAD.left + plotW);
        xAxis.setAttribute('y1', PAD.top + plotH); xAxis.setAttribute('y2', PAD.top + plotH);
        xAxis.setAttribute('stroke', '#445566'); xAxis.setAttribute('stroke-width', '2');
        axisG.appendChild(xAxis);
        svg.appendChild(axisG);

        // Injection vertical line: only once the player has made the finding (D167)
        if (this._revealed && this._injectionTs >= startTs && this._injectionTs <= endTs) {
            const x = PAD.left + ((this._injectionTs - startTs) / tsRange) * plotW;
            const injLine = this._svgEl('line');
            injLine.setAttribute('x1', x); injLine.setAttribute('x2', x);
            injLine.setAttribute('y1', PAD.top); injLine.setAttribute('y2', PAD.top + plotH);
            injLine.setAttribute('stroke', INJECT_LINE_COLOUR);
            injLine.setAttribute('stroke-width', '2');
            injLine.setAttribute('stroke-dasharray', '4,3');
            svg.appendChild(injLine);
        }

        // Determine which racks to render
        const racksToRender = this._compareMode
            ? this._racksConfig.map(r => r.id)
            : [...this._selectedRacks];

        // Data traces
        const tracesG = this._svgEl('g');
        racksToRender.forEach((rackId, idx) => {
            const points = this._trendData.get(rackId);
            if (!points) return;
            const colour = RACK_COLOURS[idx % RACK_COLOURS.length];
            const visible = points.filter(p => p.ts >= startTs && p.ts <= endTs);
            if (visible.length < 2) return;

            // Split into pre-injection and post-injection segments
            const prePoints  = visible.filter(p => !p.isInjected);
            const postPoints = visible.filter(p => p.isInjected);

            const toXY = p => {
                const x = PAD.left + ((p.ts - startTs) / tsRange) * plotW;
                const y = PAD.top  + plotH - ((p.value - Y_MIN) / (Y_MAX - Y_MIN)) * plotH;
                return [x, y];
            };

            if (prePoints.length >= 2) {
                const poly = this._svgEl('polyline');
                poly.setAttribute('points', prePoints.map(p => toXY(p).join(',')).join(' '));
                poly.setAttribute('fill', 'none');
                poly.setAttribute('stroke', colour);
                poly.setAttribute('stroke-width', '2');
                tracesG.appendChild(poly);
            }
            if (postPoints.length >= 2) {
                const poly = this._svgEl('polyline');
                poly.setAttribute('points', postPoints.map(p => toXY(p).join(',')).join(' '));
                poly.setAttribute('fill', 'none');
                // Same colour as the real readings until the finding is made
                poly.setAttribute('stroke', this._revealed ? INJECT_COLOUR : colour);
                poly.setAttribute('stroke-width', '2');
                tracesG.appendChild(poly);
            }
        });
        svg.appendChild(tracesG);
        const firstPoly = tracesG.querySelector('polyline');
        console.log('[ScadaHistorian] polyline sample:', firstPoly?.getAttribute('points')?.substring(0, 80) || 'NONE - no polylines created');

        // Hit targets for hover (use first selected rack)
        const hitsG = this._svgEl('g');
        const primaryRack = racksToRender[0];
        const primaryPoints = primaryRack ? this._trendData.get(primaryRack) : null;
        if (primaryPoints) {
            const visible = primaryPoints.filter(p => p.ts >= startTs && p.ts <= endTs);
            this._visible = visible;
            if (this._cursorIdx !== null) this._cursorIdx = Math.min(this._cursorIdx, visible.length - 1);
            let startHit = null;
            visible.forEach((p, i) => {
                const x = PAD.left + ((p.ts - startTs) / tsRange) * plotW;
                const hit = this._svgEl('rect');
                const hitW = i + 1 < visible.length
                    ? (PAD.left + ((visible[i+1].ts - startTs) / tsRange) * plotW) - x
                    : 8;
                // The injection-start point sits a second after the last real one, so give
                // it a wider target, drawn last (on top), centred on the injection line.
                const w = p.isInjectionStart ? 6 : Math.max(hitW, 4);
                hit.setAttribute('x', p.isInjectionStart ? x - 3 : x - 2); hit.setAttribute('y', PAD.top);
                hit.setAttribute('width', w);
                hit.setAttribute('height', plotH);
                hit.setAttribute('fill', 'transparent');
                hit.style.cursor = 'crosshair';
                hit.addEventListener('mouseenter', (e) => this._onPointHover(e, p, primaryRack, chartArea));
                hit.addEventListener('mouseleave', () => this._onPointLeave());
                hit.addEventListener('click', (e) => this._onPointSelect(e, p, primaryRack, chartArea));
                if (p.isInjectionStart) startHit = hit; else hitsG.appendChild(hit);
            });
            if (startHit) hitsG.appendChild(startHit);
        }
        svg.appendChild(hitsG);

        this._plot = { startTs, endTs, tsRange, PAD, plotW, plotH, W, H };
        // The player's accepted mark, and the keyboard cursor (under the hit targets' events: no fill)
        const xAt = (t) => PAD.left + ((t - startTs) / tsRange) * plotW;
        const vLine = (x, colour, dash) => {
            const l = this._svgEl('line');
            l.setAttribute('x1', x); l.setAttribute('x2', x);
            l.setAttribute('y1', PAD.top); l.setAttribute('y2', PAD.top + plotH);
            l.setAttribute('stroke', colour); l.setAttribute('stroke-width', '2');
            if (dash) l.setAttribute('stroke-dasharray', dash);
            l.setAttribute('pointer-events', 'none');
            svg.appendChild(l);
            return l;
        };
        if (this._markTs !== null && this._markTs >= startTs && this._markTs <= endTs) {
            vLine(xAt(this._markTs), MARK_LINE_COLOUR).classList?.add('sh-mark-line');
        }
        const cur = this._cursorIdx !== null ? this._visible[this._cursorIdx] : null;
        if (cur) vLine(xAt(cur.ts), CURSOR_COLOUR, '2,2').classList?.add('sh-cursor-line');

        chartArea.insertBefore(svg, this._tooltip);
        this._chartSvg = svg;

        // dZ/dt panel
        if (this._dzDtActive) this._renderDzDt(startTs, endTs, tsRange, PAD, plotW);
    }

    _renderDzDt(startTs, endTs, tsRange, PAD, plotW) {
        const panel = document.getElementById('sh-dzdt-panel');
        if (!panel) return;
        const oldSvg = panel.querySelector('svg');
        if (oldSvg) oldSvg.remove();

        const W = PAD.left + plotW + PAD.right;   // the main chart's width, so the axes line up
        const H = Math.round(panel.clientHeight) || 120;
        const pPAD = { top: 10, right: 16, bottom: 22, left: 46 };
        const plotH = H - pPAD.top - pPAD.bottom;

        const svg = this._makeSvg(W, H);

        // Y domain: -0.5 to +0.5 °C/min
        const DZ_MIN = -0.5; const DZ_MAX = 0.5;
        const toY = v => pPAD.top + plotH - ((v - DZ_MIN) / (DZ_MAX - DZ_MIN)) * plotH;

        // Zero line
        const zeroLine = this._svgEl('line');
        zeroLine.setAttribute('x1', pPAD.left); zeroLine.setAttribute('x2', pPAD.left + plotW);
        const zy = toY(0);
        zeroLine.setAttribute('y1', zy); zeroLine.setAttribute('y2', zy);
        zeroLine.setAttribute('stroke', '#334466'); zeroLine.setAttribute('stroke-width', '2');
        svg.appendChild(zeroLine);

        // Y axis label
        const yLbl = this._svgEl('text');
        yLbl.setAttribute('x', 4); yLbl.setAttribute('y', pPAD.top + plotH / 2);
        yLbl.setAttribute('fill', '#445566'); yLbl.setAttribute('font-size', '16');
        yLbl.setAttribute('font-family', 'VT323, monospace');
        yLbl.setAttribute('writing-mode', 'tb');
        yLbl.textContent = 'dZ/dt';
        svg.appendChild(yLbl);

        // Injection line, once the finding is made
        if (this._revealed && this._injectionTs >= startTs && this._injectionTs <= endTs) {
            const x = pPAD.left + ((this._injectionTs - startTs) / tsRange) * plotW;
            const injLine = this._svgEl('line');
            injLine.setAttribute('x1', x); injLine.setAttribute('x2', x);
            injLine.setAttribute('y1', pPAD.top); injLine.setAttribute('y2', pPAD.top + plotH);
            injLine.setAttribute('stroke', INJECT_LINE_COLOUR);
            injLine.setAttribute('stroke-width', '2');
            injLine.setAttribute('stroke-dasharray', '4,3');
            svg.appendChild(injLine);
        }

        // Trace (first selected rack)
        const rackId = [...this._selectedRacks][0] || (this._racksConfig[0] && this._racksConfig[0].id);
        const points = rackId ? this._trendData.get(rackId) : null;
        if (points) {
            const visible = points.filter(p => p.ts >= startTs && p.ts <= endTs);
            const prePoints  = visible.filter(p => !p.isInjected);
            const postPoints = visible.filter(p => p.isInjected);

            const toXY = p => {
                const x = pPAD.left + ((p.ts - startTs) / tsRange) * plotW;
                const clamp = Math.max(DZ_MIN, Math.min(DZ_MAX, p.dzdt));
                const y = toY(clamp);
                return [x, y];
            };

            if (prePoints.length >= 2) {
                const poly = this._svgEl('polyline');
                poly.setAttribute('points', prePoints.map(p => toXY(p).join(',')).join(' '));
                poly.setAttribute('fill', 'none');
                poly.setAttribute('stroke', DZDT_COLOUR);
                poly.setAttribute('stroke-width', '2');
                svg.appendChild(poly);
            }
            // Post-injection: thick zero line with subtle glow once revealed, plain before
            if (postPoints.length >= 2 && this._revealed) {
                const glowPoly = this._svgEl('polyline');
                glowPoly.setAttribute('points', postPoints.map(p => toXY(p).join(',')).join(' '));
                glowPoly.setAttribute('fill', 'none');
                glowPoly.setAttribute('stroke', DZDT_COLOUR);
                glowPoly.setAttribute('stroke-width', '4');
                glowPoly.setAttribute('stroke-opacity', '0.25');
                svg.appendChild(glowPoly);
            }
            if (postPoints.length >= 2) {
                const solidPoly = this._svgEl('polyline');
                solidPoly.setAttribute('points', postPoints.map(p => toXY(p).join(',')).join(' '));
                solidPoly.setAttribute('fill', 'none');
                solidPoly.setAttribute('stroke', DZDT_COLOUR);
                solidPoly.setAttribute('stroke-width', '2');
                svg.appendChild(solidPoly);
            }
        }

        panel.appendChild(svg);
    }

    // ── Hover / tooltip ────────────────────────────────────────────────────

    _showTooltip(e, point, rackId, chartArea) {
        if (!this._tooltip) return;
        this._focusRackId = rackId;
        let kind = 'normal', text;
        if (this._compareMode && !(this._revealed && point.isInjected)) {
            text = compareValuesText(point.ts, this._racksConfig, this._trendData);
        } else {
            ({ kind, text } = tooltipText(point, this._anomalyFor(rackId), this._revealed));
        }
        this._tooltip.className = kind === 'injection' ? 'sh-tooltip sh-tooltip-injection'
                                : kind === 'anomaly'   ? 'sh-tooltip sh-tooltip-anomaly'
                                : 'sh-tooltip';
        this._tooltip.textContent = text;
        this._tooltip.style.display = 'block';

        // Position using real mouse coords (SVG x/y are viewBox units, not CSS px)
        const tooltipW = this._tooltip.offsetWidth  || 180;
        const tooltipH = this._tooltip.offsetHeight || 80;
        const containerRect = chartArea.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;
        const left = (mouseX + tooltipW + 10 > containerRect.width)
            ? mouseX - tooltipW - 10
            : mouseX + 10;
        const top = (mouseY + tooltipH + 10 > containerRect.height)
            ? mouseY - tooltipH - 10
            : mouseY + 10;
        this._tooltip.style.left = Math.max(0, left) + 'px';
        this._tooltip.style.top  = Math.max(0, top)  + 'px';
    }

    /** Hover shows the reading only; it no longer unlocks anything (D167). */
    _onPointHover(e, point, rackId, chartArea) {
        this._showTooltip(e, point, rackId, chartArea);
    }

    _onPointLeave() {
        if (this._tooltip) this._tooltip.style.display = 'none';
    }

    /** Click, tap or Enter on a reading: mark it as the moment the data stops being real. */
    _onPointSelect(e, point, rackId, chartArea) {
        this._showTooltip(e, point, rackId, chartArea);
        this._markReading(point, rackId);
    }

    _markReading(point, rackId) {
        if (this._annotateUnlocked) return; // a mark is already accepted
        const plot = this._plot;
        const verdict = judgeMark(point, this._anomalyFor(rackId), {
            pxPerMs: plot ? plot.plotW / plot.tsRange : 0,
            rangeStartTs: plot ? plot.startTs : NaN,
        });
        if (this._hintText2) this._hintText2.textContent = verdict.message;
        if (this._hintEl) this._hintEl.classList.toggle('retry', !verdict.ok);
        if (!verdict.ok) return;
        this._markTs = point.ts;
        this._unlockAnnotate();
        this._renderChart();
    }

    _unlockAnnotate() {
        if (this._annotateUnlocked) return;
        this._annotateUnlocked = true;
        if (this._hintEl) { this._hintEl.classList.remove('retry'); this._hintEl.classList.add('found'); }
        if (this._annotateNote) this._annotateNote.textContent = 'Ready to annotate.';
        if (this._annotateBtn) {
            this._annotateBtn.disabled = false;
            this._annotateBtn.style.pointerEvents = '';
            this._annotateBtn.classList.add('active');
            this._annotateBtn.textContent = '[ANNOTATE FINDING >]';
        }
    }

    // ── Keyboard cursor on the chart ────────────────────────────────────────

    _onChartKey(e) {
        const steps = { ArrowLeft: -1, ArrowRight: 1, PageUp: -60, PageDown: 60 };
        if (e.key in steps && this._cursorIdx === null) {
            this._moveCursor(0, true); // the first arrow press puts the cursor on the first reading
        } else if (e.key in steps) {
            this._moveCursor(steps[e.key] * (e.shiftKey && Math.abs(steps[e.key]) === 1 ? 10 : 1));
        } else if (e.key === 'Home' || e.key === 'End') {
            this._moveCursor(0, true, e.key === 'End');
        } else if (e.key === 'Enter' || e.key === ' ') {
            const p = this._cursorIdx !== null ? this._visible[this._cursorIdx] : null;
            if (p) this._markReading(p, this._primaryRackId());
        } else {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
    }

    _primaryRackId() {
        return this._compareMode ? this._racksConfig[0].id : [...this._selectedRacks][0];
    }

    /** Move the keyboard cursor by delta readings (or to the start/end), redraw, show its tooltip. */
    _moveCursor(delta, absolute = false, toEnd = false) {
        const n = this._visible.length;
        if (!n) return;
        if (absolute) this._cursorIdx = toEnd ? n - 1 : 0;
        else this._cursorIdx = Math.max(0, Math.min(n - 1, (this._cursorIdx ?? 0) + delta));
        // Move the cursor line in place. Rebuilding the chart here put new hit targets under a
        // resting mouse pointer, whose mouseenter then overwrote the cursor's tooltip.
        this._drawCursor();
        const chartArea = document.getElementById('sh-chart-area');
        const p = this._visible[this._cursorIdx];
        if (!chartArea || !p || !this._plot) return;
        const { startTs, tsRange, PAD, plotW, plotH, W, H } = this._plot;
        const rect = chartArea.getBoundingClientRect();
        const x = PAD.left + ((p.ts - startTs) / tsRange) * plotW;
        const y = PAD.top + plotH - ((p.value - Y_MIN) / (Y_MAX - Y_MIN)) * plotH;
        const at = { clientX: rect.left + x * (rect.width / W), clientY: rect.top + y * (rect.height / H) };
        this._showTooltip(at, p, this._primaryRackId(), chartArea);
        this._announce(this._tooltip ? this._tooltip.textContent : '');
    }

    /** Draw or move the keyboard cursor line without rebuilding the chart. */
    _drawCursor() {
        const svg = this._chartSvg;
        const p = this._cursorIdx !== null ? this._visible[this._cursorIdx] : null;
        if (!svg || !p || !this._plot) { this._renderChart(); return; }
        const { startTs, tsRange, PAD, plotW, plotH } = this._plot;
        const x = PAD.left + ((p.ts - startTs) / tsRange) * plotW;
        let line = svg.querySelector('.sh-cursor-line');
        if (!line) {
            line = this._svgEl('line');
            line.setAttribute('y1', PAD.top); line.setAttribute('y2', PAD.top + plotH);
            line.setAttribute('stroke', CURSOR_COLOUR); line.setAttribute('stroke-width', '2');
            line.setAttribute('stroke-dasharray', '2,2');
            line.setAttribute('pointer-events', 'none');
            line.classList?.add('sh-cursor-line');
            svg.appendChild(line);
        }
        line.setAttribute('x1', x); line.setAttribute('x2', x);
    }

    /** Debounced polite announcement of the cursor's reading, so holding an arrow key does not flood a screen reader. */
    _announce(text) {
        if (!this._srEl) return;
        if (this._srTimer) clearTimeout(this._srTimer);
        this._srTimer = setTimeout(() => {
            this._srTimer = null;
            if (this._srEl) this._srEl.textContent = displayDashes(String(text).replace(/\n+/g, '. '));
        }, SR_DEBOUNCE_MS);
    }

    // ── Toolbar interactions ────────────────────────────────────────────────

    _toggleRack(rackId) {
        if (this._compareMode) return;
        if (this._selectedRacks.has(rackId)) {
            if (this._selectedRacks.size === 1) return; // keep at least one
            this._selectedRacks.delete(rackId);
        } else {
            this._selectedRacks.add(rackId);
        }
        this._updateRackUI();
        this._renderChart();
    }

    _updateRackUI() {
        for (const rack of this._racksConfig) {
            const label = document.querySelector(`.sh-rack-label[data-rack-id="${rack.id}"]`);
            const cb    = document.querySelector(`.sh-rack-checkbox[data-rack-id="${rack.id}"]`);
            if (!label || !cb) continue;
            const sel = this._compareMode || this._selectedRacks.has(rack.id);
            label.classList.toggle('active', sel);
            cb.classList.toggle('checked', sel);
            cb.textContent = '';
        }
    }

    _setTimeRange(hours) {
        // The keyboard cursor stays on the same time, not the same index (D167 R1 m6)
        const cursorTs = this._cursorIdx !== null ? this._visible[this._cursorIdx]?.ts : null;
        this._timeRangeHours = hours;
        const btns = document.querySelectorAll('.sh-range-btn');
        btns.forEach(b => b.classList.toggle('active', +b.dataset.hours === hours));
        this._cursorIdx = null;
        this._renderChart();
        if (cursorTs != null) {
            const i = this._visible.findIndex(p => p.ts === cursorTs);
            if (i >= 0) { this._cursorIdx = i; this._renderChart(); }
        }
    }

    _toggleDzDt() {
        this._dzDtActive = !this._dzDtActive;
        const btn   = document.getElementById('sh-dzdt-toggle');
        const panel = document.getElementById('sh-dzdt-panel');
        if (btn)   { btn.classList.toggle('active', this._dzDtActive); btn.textContent = this._dzDtActive ? 'dZ/dt ON' : 'dZ/dt OFF'; }
        if (panel) { panel.classList.toggle('visible', this._dzDtActive); }
        if (this._dzDtActive) {
            // Show info banner once
            if (this._infoBanner) this._infoBanner.style.display = 'block';
            this._fireProgressAction('overlay_enabled');
        } else {
            if (this._infoBanner) this._infoBanner.style.display = 'none';
        }
        this._renderChart();
    }

    _toggleCompare() {
        this._compareMode = !this._compareMode;
        const btn = document.getElementById('sh-compare-toggle');
        if (btn) btn.classList.toggle('compare-active', this._compareMode);
        this._updateRackUI();
        if (this._compareMode) {
            this._fireProgressAction('compare_racks_opened');
            this._showCompareBanner();
        } else {
            if (this._bannerEl) this._bannerEl.style.display = 'none';
        }
        this._renderChart();
    }

    _showCompareBanner() {
        if (!this._bannerEl) return;
        this._bannerEl.innerHTML = '';
        if (!this._revealed) {
            // Before the finding the banner says what the view is, not what it shows (D167)
            this._bannerEl.textContent = compareNeutralText(this._racksConfig.length);
            this._bannerEl.style.display = 'block';
            return;
        }
        const warn = this._el('span', 'sh-banner-warn');
        warn.textContent = '! SYSTEMATIC INJECTION DETECTED';
        this._bannerEl.appendChild(warn);
        this._bannerEl.appendChild(document.createTextNode('\n  ' +
            compareBannerText(this._anomalyFor(this._focusRackId), this._racksConfig.length)));
        this._bannerEl.style.display = 'block';
    }

    // ── Annotate modal ─────────────────────────────────────────────────────

    _openAnnotateModal() {
        // A second ANNOTATE press while the report is open would stack a report Cancel cannot clear (consoles R4 M1)
        if (this._annotateOverlay) return;
        const charts = document.querySelector('.sh-charts');
        if (!charts) return;
        const overlay = this._el('div', 'sh-modal-overlay pixel-scroll');
        const modal   = this._el('div', 'sh-modal');

        const title = this._el('div', 'sh-modal-title');
        title.textContent = 'HISTORIAN ANOMALY REPORT';
        modal.appendChild(title);

        const rack = this._racksConfig.find(r => r.id === this._focusRackId) || this._racksConfig[0];
        const anomaly = this._anomalyFor(rack.id);
        const { rows, confirmLabel } = reportContent(anomaly, this._cfg, this._sd, rack);
        const addRow = (k, v) => {
            const row = this._el('div', 'sh-modal-row');
            const key = this._el('div', 'sh-modal-key'); key.textContent = k;
            const val = this._el('div', 'sh-modal-val'); val.style.whiteSpace = 'pre-wrap'; val.textContent = displayDashes(v);
            row.appendChild(key); row.appendChild(val);
            modal.appendChild(row);
        };
        // Until the player picks the right finding, only the variable and their own mark show;
        // the written finding and the confirm button come after (D167)
        const asking = !!anomaly && !this._revealed;
        if (asking) {
            // The question is not a confirm, so it has no named Cancel: the one scene X closes it (closeByPlayer)
        }
        if (asking) {
            addRow(rows[0][0], rows[0][1]);
            if (this._markTs !== null) addRow('Marked:', fmtFull(this._markTs));
        } else {
            for (const [k, v] of rows) addRow(k, v);
        }

        let firstFocus = null;
        if (asking) {
            const q = this._el('div', 'sh-modal-question');
            q.textContent = FINDING_QUESTION;
            modal.appendChild(q);
            const feedback = this._el('div', 'sh-choice-feedback');
            feedback.setAttribute?.('aria-live', 'polite');
            for (const choice of FINDING_CHOICES) {
                const btn = this._el('button', 'sh-choice-btn');
                btn.dataset.choice = choice.id;
                btn.textContent = choice.label;
                btn.dataset.label = choice.label;
                btn.addEventListener('click', () => this._chooseFinding(choice.id, btn, feedback, anomaly));
                modal.appendChild(btn);
                firstFocus = firstFocus || btn;
            }
            modal.appendChild(feedback);
        }

        const buttons = this._el('div', 'sh-modal-buttons');
        if (!asking) {
            const confirmBtn = this._el('button', 'sh-modal-confirm-btn');
            confirmBtn.textContent = confirmLabel;
            confirmBtn.addEventListener('click', () => { this._closeAnnotateModal(false); this._onComplete(); });
            buttons.appendChild(confirmBtn);
            firstFocus = confirmBtn;
        }
        // One X closes the report (closeByPlayer), the scene X stays on screen: no Cancel beside it
        if (!asking) modal.appendChild(buttons);
        this._modalFirstFocus = firstFocus;

        overlay.appendChild(modal);
        charts.appendChild(overlay);
        charts.classList?.add('report-open');   // phones: the chart column grows so the whole report fits
        this._annotateOverlay = overlay;
        this._modalFirstFocus?.focus?.();
        // On a phone the report sits in a short column: bring it to the top of view
        overlay.scrollTop = 0;
        overlay.scrollIntoView?.({ block: 'nearest' });
    }

    /** A choice in the report: a wrong one explains itself; the right one reveals the finding. */
    _chooseFinding(choiceId, btn, feedback, anomaly) {
        const verdict = judgeFinding(choiceId, anomaly);
        if (!verdict.ok) {
            btn.classList.add('wrong');
            btn.setAttribute?.('aria-disabled', 'true');
            btn.textContent = `${btn.dataset.label} (ruled out)`;
            feedback.textContent = displayDashes(verdict.message);
            feedback.scrollIntoView?.({ block: 'nearest' });
            return;
        }
        this._reveal();
        // Reopen the report with the finding written in and the confirm button
        this._closeAnnotateModal(false);
        this._openAnnotateModal();
    }

    /** The player has made the finding: the chart may now name it. */
    _reveal() {
        if (this._revealed) return;
        this._revealed = true;
        if (this._compareMode) this._showCompareBanner();
        this._renderChart();
    }

    _closeAnnotateModal(returnFocus = true) {
        if (this._annotateOverlay) this._annotateOverlay.remove();
        this._annotateOverlay = null;
        const charts = document.querySelector?.('.sh-charts');
        const wasOpen = !!charts?.classList?.contains?.('report-open');
        charts?.classList?.remove('report-open');
        // The column shrinks back, so redraw at the restored size or the axis labels stay squashed
        if (wasOpen) this._renderChart();
        this._hideSceneX(false);
        // Keyboard players land back on the button that opened the report, or on the chart
        if (returnFocus) {
            const target = this._annotateUnlocked ? this._annotateBtn : document.getElementById('sh-chart-area');
            target?.focus?.();
        }
    }

    // Kept for the callers that restore the X; the report no longer hides it
    _hideSceneX(hidden) {
        const x = this.container?.querySelector?.('#minigame-close');
        if (x) x.style.visibility = hidden ? 'hidden' : '';
    }

    // The scene X closes the topmost layer: the report first (the mark is kept), then the viewer
    closeByPlayer() {
        if (this._annotateOverlay) { this._closeAnnotateModal(); return; }
        super.closeByPlayer();
    }

    // Esc is Cancel while the report is open; with none open it closes the scene
    handleEscapeKey() {
        if (!this._annotateOverlay) return false;
        this._closeAnnotateModal();
        return true;
    }

    // ── Completion ─────────────────────────────────────────────────────────

    _onComplete() {
        if (this._completionFired) return;
        this._completionFired = true;
        this._executeActions(this._completionActions);
        setTimeout(() => this.complete(true), 800);
    }

    _executeActions(actions) {
        for (const action of (actions || [])) {
            if (action.type === 'set_global') {
                this._setGlobalAndNotify(action.key, action.value);
            } else if (action.type === 'complete_task') {
                window.objectivesManager?.completeTask(action.taskId);
            }
        }
    }

    _setGlobalAndNotify(name, value) {
        const nm = window.npcManager;
        if (nm && typeof nm.setGlobalVariable === 'function') {
            nm.setGlobalVariable(name, value);
        } else {
            const gs = window.gameState;
            if (gs) {
                if (!gs.globalVariables) gs.globalVariables = {};
                gs.globalVariables[name] = value;
                if (typeof gs.broadcastGlobalVariableChange === 'function') {
                    gs.broadcastGlobalVariableChange(name, value);
                }
            }
            window.eventDispatcher?.emit('global_variable_changed:' + name, { value });
        }
    }

    _fireProgressAction(trigger) {
        if (this._progressFired.has(trigger)) return;
        this._progressFired.add(trigger);
        const matching = (this._progressActions || []).filter(a => a.trigger === trigger);
        this._executeActions(matching);
    }

    // ── DOM helpers ────────────────────────────────────────────────────────

    _el(tag, cls) {
        const el = document.createElement(tag);
        if (cls) el.className = cls;
        return el;
    }

    _makeSvg(w, h) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        svg.setAttribute('preserveAspectRatio', 'none');
        return svg;
    }

    _svgEl(tag) {
        return document.createElementNS('http://www.w3.org/2000/svg', tag);
    }

    _xTickInterval() {
        if (this._timeRangeHours <= 1)  return 10 * 60000;   // 10 min
        if (this._timeRangeHours <= 3)  return 30 * 60000;   // 30 min
        if (this._timeRangeHours <= 6)  return 60 * 60000;   // 1 hr
        if (this._timeRangeHours <= 12) return 120 * 60000;  // 2 hr
        return 360 * 60000;                                   // 6 hr
    }

    _fmtTime(date) {
        return date.getHours().toString().padStart(2, '0') + ':'
             + date.getMinutes().toString().padStart(2, '0');
    }
}
