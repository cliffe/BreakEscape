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
 * Completion: player hovers a falsified point for 3 s (a progress bar shows under
 *             the chart), hovers the injection-start point, or clicks any falsified
 *             point → ANNOTATE FINDING unlocks → modal confirm → completionActions
 *             fired → complete(true)
 *
 * Times, values, deltas and durations in the tooltip, banner and report all come
 * from scada-historian-data.js, which reads minigameData and the drawn points.
 */

import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';
import {
    TIME_RANGES, DEFAULT_HINT, parseHistorianConfig, buildRackTrend, findAnomaly,
    tooltipText, compareBannerText, reportContent, fmtClock,
} from './scada-historian-data.js';

// Rack colour palette: A1 bright amber, A2 gold, A3 yellow, A4 pale amber
const RACK_COLOURS = ['#f5a623', '#d4a017', '#e8d44d', '#f0c87a'];
// Post-injection trace colour (brighter, visually distinct)
const INJECT_COLOUR = '#ffcc44';
// dZ/dt trace
const DZDT_COLOUR = '#00c5cd';
// Injection transition line
const INJECT_LINE_COLOUR = '#ff4040';

// Y-axis fixed domain per spec (prevents cherry-picking)
const Y_MIN = 24;
const Y_MAX = 42;

// How long a falsified point must be inspected before the finding unlocks
const INSPECT_MS = 3000;

export class ScadaHistorianMinigame extends MinigameScene {

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
        this._completionFired = false;
        this._progressFired   = new Set();
        this._hoverTimer      = null;
        this._leaveTimer      = null;
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
        this._progressEl = null;
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
        this._cancelInspect();
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

    // ── Layout ─────────────────────────────────────────────────────────────

    _renderLayout() {
        const gc = this.gameContainer;
        gc.innerHTML = '';
        gc.style.cssText = 'padding:0;display:flex;flex-direction:column;height:100%;overflow:hidden;';

        const wrap = this._el('div', 'sh-wrapper');

        // Header
        const header = this._el('div', 'sh-header');
        const titleGroup = this._el('div', '');
        titleGroup.style.display = 'flex';
        titleGroup.style.alignItems = 'baseline';
        titleGroup.style.gap = '0';
        titleGroup.style.flexWrap = 'wrap';
        const titleEl = this._el('span', 'sh-header-title');
        titleEl.textContent = displayDashes(this._title);
        const subtitleEl = this._el('span', 'sh-header-subtitle');
        subtitleEl.textContent = displayDashes(this._subtitle);
        titleGroup.appendChild(titleEl);
        titleGroup.appendChild(subtitleEl);
        const closeBtn = this._el('button', 'sh-close-btn');
        closeBtn.textContent = '[CLOSE]';
        closeBtn.addEventListener('click', () => this.complete(false));
        header.appendChild(titleGroup);
        header.appendChild(closeBtn);
        wrap.appendChild(header);

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
            cb.textContent = this._selectedRacks.has(rack.id) ? '✓' : '';
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
        this._openedAt = Date.now();
        left.appendChild(this._annotateBtn);
        this._annotateNote = this._el('div', 'sh-annotate-note');
        this._annotateNote.textContent = 'Inspect the chart to find something to annotate.';
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
        const charts = this._el('div', 'sh-charts');

        // Hint line at the top of the chart (the framework's Close button covers the bottom),
        // with a progress bar while a falsified point is inspected
        this._hintEl = this._el('div', 'sh-hint');
        this._hintText2 = this._el('span', 'sh-hint-text');
        this._hintText2.textContent = displayDashes(this._hintText);
        const bar = this._el('span', 'sh-hint-progress');
        this._progressEl = this._el('span', 'sh-hint-progress-fill');
        bar.appendChild(this._progressEl);
        this._hintEl.appendChild(this._hintText2);
        this._hintEl.appendChild(bar);
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
        this._tooltip = this._el('div', 'sh-tooltip');
        this._tooltip.style.display = 'none';
        chartArea.appendChild(this._tooltip);
        charts.appendChild(chartArea);

        // dZ/dt panel
        const dzdtPanel = this._el('div', 'sh-dzdt-panel');
        dzdtPanel.id = 'sh-dzdt-panel';
        charts.appendChild(dzdtPanel);

        right.appendChild(charts);
        body.appendChild(right);
        wrap.appendChild(body);
        gc.appendChild(wrap);
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
        const W = 800;
        const H = 400;
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
            line.setAttribute('stroke', '#0d1a2e'); line.setAttribute('stroke-width', '1');
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
            tick.setAttribute('stroke', '#445566'); tick.setAttribute('stroke-width', '1');
            yAxisG.appendChild(tick);
            const lbl = this._svgEl('text');
            lbl.setAttribute('x', PAD.left - 6); lbl.setAttribute('y', y + 4);
            lbl.setAttribute('text-anchor', 'end');
            lbl.setAttribute('fill', '#556688'); lbl.setAttribute('font-size', '10');
            lbl.setAttribute('font-family', 'Courier New, monospace');
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
            tick.setAttribute('stroke', '#445566'); tick.setAttribute('stroke-width', '1');
            xAxisG.appendChild(tick);
            const lbl = this._svgEl('text');
            lbl.setAttribute('x', x); lbl.setAttribute('y', PAD.top + plotH + 14);
            lbl.setAttribute('text-anchor', 'middle');
            lbl.setAttribute('fill', '#556688'); lbl.setAttribute('font-size', '10');
            lbl.setAttribute('font-family', 'Courier New, monospace');
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
        yAxis.setAttribute('stroke', '#445566'); yAxis.setAttribute('stroke-width', '1');
        axisG.appendChild(yAxis);
        const xAxis = this._svgEl('line');
        xAxis.setAttribute('x1', PAD.left); xAxis.setAttribute('x2', PAD.left + plotW);
        xAxis.setAttribute('y1', PAD.top + plotH); xAxis.setAttribute('y2', PAD.top + plotH);
        xAxis.setAttribute('stroke', '#445566'); xAxis.setAttribute('stroke-width', '1');
        axisG.appendChild(xAxis);
        svg.appendChild(axisG);

        // Injection vertical line
        if (this._injectionTs >= startTs && this._injectionTs <= endTs) {
            const x = PAD.left + ((this._injectionTs - startTs) / tsRange) * plotW;
            const injLine = this._svgEl('line');
            injLine.setAttribute('x1', x); injLine.setAttribute('x2', x);
            injLine.setAttribute('y1', PAD.top); injLine.setAttribute('y2', PAD.top + plotH);
            injLine.setAttribute('stroke', INJECT_LINE_COLOUR);
            injLine.setAttribute('stroke-width', '1');
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
                poly.setAttribute('stroke-width', '1.5');
                tracesG.appendChild(poly);
            }
            if (postPoints.length >= 2) {
                const poly = this._svgEl('polyline');
                poly.setAttribute('points', postPoints.map(p => toXY(p).join(',')).join(' '));
                poly.setAttribute('fill', 'none');
                poly.setAttribute('stroke', INJECT_COLOUR);
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

        const W = 800;
        const H = 120;
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
        zeroLine.setAttribute('stroke', '#334466'); zeroLine.setAttribute('stroke-width', '1');
        svg.appendChild(zeroLine);

        // Y axis label
        const yLbl = this._svgEl('text');
        yLbl.setAttribute('x', 4); yLbl.setAttribute('y', pPAD.top + plotH / 2);
        yLbl.setAttribute('fill', '#445566'); yLbl.setAttribute('font-size', '9');
        yLbl.setAttribute('font-family', 'Courier New, monospace');
        yLbl.setAttribute('writing-mode', 'tb');
        yLbl.textContent = 'dZ/dt';
        svg.appendChild(yLbl);

        // Injection line
        if (this._injectionTs >= startTs && this._injectionTs <= endTs) {
            const x = pPAD.left + ((this._injectionTs - startTs) / tsRange) * plotW;
            const injLine = this._svgEl('line');
            injLine.setAttribute('x1', x); injLine.setAttribute('x2', x);
            injLine.setAttribute('y1', pPAD.top); injLine.setAttribute('y2', pPAD.top + plotH);
            injLine.setAttribute('stroke', INJECT_LINE_COLOUR);
            injLine.setAttribute('stroke-width', '1');
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
                poly.setAttribute('stroke-width', '1');
                svg.appendChild(poly);
            }
            // Post-injection: thick zero line with subtle glow
            if (postPoints.length >= 2) {
                const glowPoly = this._svgEl('polyline');
                glowPoly.setAttribute('points', postPoints.map(p => toXY(p).join(',')).join(' '));
                glowPoly.setAttribute('fill', 'none');
                glowPoly.setAttribute('stroke', DZDT_COLOUR);
                glowPoly.setAttribute('stroke-width', '4');
                glowPoly.setAttribute('stroke-opacity', '0.25');
                svg.appendChild(glowPoly);
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
        const { kind, text } = tooltipText(point, this._anomalyFor(rackId));
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

    _onPointHover(e, point, rackId, chartArea) {
        this._showTooltip(e, point, rackId, chartArea);
        if (this._annotateUnlocked) return;
        if (!point.isInjected) { this._cancelInspect(); return; }
        if (point.isInjectionStart) { this._unlockAnnotate(); return; }
        // Moving along the flat line keeps the same inspection going
        if (this._leaveTimer) { clearTimeout(this._leaveTimer); this._leaveTimer = null; }
        if (!this._hoverTimer) {
            this._hoverTimer = setTimeout(() => { this._hoverTimer = null; this._unlockAnnotate(); }, INSPECT_MS);
            this._setProgress(true);
        }
    }

    _onPointLeave() {
        if (this._tooltip) this._tooltip.style.display = 'none';
        if (this._hoverTimer && !this._leaveTimer) {
            // A short grace so stepping to the next point doesn't restart the count
            this._leaveTimer = setTimeout(() => this._cancelInspect(), 300);
        }
    }

    /** Click (or tap) a point: an alternative to hovering for three seconds. */
    _onPointSelect(e, point, rackId, chartArea) {
        this._showTooltip(e, point, rackId, chartArea);
        if (point.isInjected) {
            this._unlockAnnotate(true);
        } else if (!this._annotateUnlocked && this._hintText2) {
            this._hintText2.textContent = `${fmtClock(point.ts)}: ${point.value.toFixed(1)}\u00b0C. `
                + 'Still moving like a real sensor reading. Keep looking.';
        }
    }

    _cancelInspect() {
        if (this._hoverTimer) { clearTimeout(this._hoverTimer); this._hoverTimer = null; }
        if (this._leaveTimer) { clearTimeout(this._leaveTimer); this._leaveTimer = null; }
        this._setProgress(false);
    }

    _setProgress(running) {
        const fill = this._progressEl;
        if (!fill) return;
        if (running) {
            fill.style.transition = 'none';
            fill.style.width = '0%';
            void fill.offsetWidth; // restart the transition
            fill.style.transition = `width ${INSPECT_MS}ms linear`;
            fill.style.width = '100%';
            if (this._hintText2) this._hintText2.textContent = 'Inspecting this reading...';
        } else if (!this._annotateUnlocked) {
            fill.style.transition = 'none';
            fill.style.width = '0%';
            if (this._hintText2 && this._hintText2.textContent === 'Inspecting this reading...') {
                this._hintText2.textContent = displayDashes(this._hintText);
            }
        }
    }

    _unlockAnnotate(force = false) {
        if (this._annotateUnlocked) return;
        // Guard: ignore spurious hover events fired during initial render (<1s after open)
        if (!force && this._openedAt && Date.now() - this._openedAt < 1000) return;
        this._annotateUnlocked = true;
        if (this._hoverTimer) { clearTimeout(this._hoverTimer); this._hoverTimer = null; }
        if (this._leaveTimer) { clearTimeout(this._leaveTimer); this._leaveTimer = null; }
        if (this._progressEl) { this._progressEl.style.transition = 'none'; this._progressEl.style.width = '100%'; }
        if (this._hintEl) this._hintEl.classList.add('found');
        if (this._hintText2) this._hintText2.textContent = 'Finding ready: press [ANNOTATE FINDING] on the left.';
        if (this._annotateNote) this._annotateNote.textContent = 'Ready to annotate.';
        if (this._annotateBtn) {
            this._annotateBtn.disabled = false;
            this._annotateBtn.style.pointerEvents = '';
            this._annotateBtn.classList.add('active');
            this._annotateBtn.textContent = '[ANNOTATE FINDING \u25ba]';
        }
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
            cb.textContent = sel ? '\u2713' : '';
        }
    }

    _setTimeRange(hours) {
        this._timeRangeHours = hours;
        const btns = document.querySelectorAll('.sh-range-btn');
        btns.forEach(b => b.classList.toggle('active', +b.dataset.hours === hours));
        this._renderChart();
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
        const warn = this._el('span', 'sh-banner-warn');
        warn.textContent = '\u26a0 SYSTEMATIC INJECTION DETECTED';
        this._bannerEl.appendChild(warn);
        this._bannerEl.appendChild(document.createTextNode('\n  ' +
            compareBannerText(this._anomalyFor(this._focusRackId), this._racksConfig.length)));
        this._bannerEl.style.display = 'block';
        this._unlockAnnotate(true);
    }

    // ── Annotate modal ─────────────────────────────────────────────────────

    _openAnnotateModal() {
        const charts = document.querySelector('.sh-charts');
        if (!charts) return;
        const overlay = this._el('div', 'sh-modal-overlay');
        const modal   = this._el('div', 'sh-modal');

        const title = this._el('div', 'sh-modal-title');
        title.textContent = 'HISTORIAN ANOMALY REPORT';
        modal.appendChild(title);

        const rack = this._racksConfig.find(r => r.id === this._focusRackId) || this._racksConfig[0];
        const { rows, confirmLabel } = reportContent(this._anomalyFor(rack.id), this._cfg, this._sd, rack);
        for (const [k, v] of rows) {
            const row = this._el('div', 'sh-modal-row');
            const key = this._el('div', 'sh-modal-key'); key.textContent = k;
            const val = this._el('div', 'sh-modal-val'); val.style.whiteSpace = 'pre-wrap'; val.textContent = displayDashes(v);
            row.appendChild(key); row.appendChild(val);
            modal.appendChild(row);
        }

        const buttons = this._el('div', 'sh-modal-buttons');
        const confirmBtn = this._el('button', 'sh-modal-confirm-btn');
        confirmBtn.textContent = confirmLabel;
        confirmBtn.addEventListener('click', () => { overlay.remove(); this._onComplete(); });
        const cancelBtn = this._el('button', 'sh-modal-cancel-btn');
        cancelBtn.textContent = '[CANCEL]';
        cancelBtn.addEventListener('click', () => overlay.remove());
        buttons.appendChild(confirmBtn);
        buttons.appendChild(cancelBtn);
        modal.appendChild(buttons);

        overlay.appendChild(modal);
        charts.appendChild(overlay);
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
