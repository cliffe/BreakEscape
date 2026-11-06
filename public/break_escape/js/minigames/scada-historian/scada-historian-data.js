/**
 * Pure data and text helpers for the SCADA historian minigame (no DOM).
 *
 * Everything the minigame says about the falsification (times, values, deltas,
 * durations) is worked out here from the scenario's minigameData and from the
 * same trend points the chart draws, so the tooltip, the compare banner and the
 * anomaly report always agree with each other and with the chart.
 *
 * Timestamps in minigameData are local ISO strings ("2026-03-20T23:12:07", no
 * zone): they are parsed and formatted in the same local zone, so the clock
 * times shown are the ones written in the scenario.
 */

export const TIME_RANGES = [1, 3, 6, 12, 24];

// Used only when minigameData leaves a value out. Self-consistent: the fallback
// trend rises from 20:00 so the last real reading sits well above the flat line.
export const HISTORIAN_FALLBACK = {
    racks:                 [{ id: 'A1', label: 'Rack A1', normalBase: 30.2, noisePeriodMinutes: 3, noiseAmplitude: 0.4 }],
    injectionTimestamp:    '2026-03-20T23:12:07',
    injectedValue:         28.0,
    thermalTrendStartTime: '2026-03-20T20:00:00',
    thermalTrendRate:      0.033,
    historianStartTime:    '2026-03-20T18:00:00',
    historianEndTime:      '2026-03-21T06:30:00',
    sampleIntervalMinutes: 1,
};

export const DEFAULT_HINT =
    'Hover over a point, or click it, to inspect it. Mark the moment the data stops behaving like a real sensor.';

const ts = (s) => (s ? new Date(s).getTime() : NaN);

/** Normalise minigameData into numbers, filling gaps from HISTORIAN_FALLBACK. */
export function parseHistorianConfig(sd = {}) {
    const pick = (k) => (sd[k] !== undefined && sd[k] !== null && sd[k] !== '' ? sd[k] : HISTORIAN_FALLBACK[k]);
    const racks = Array.isArray(sd.racks) && sd.racks.length ? sd.racks : HISTORIAN_FALLBACK.racks;
    const cfg = {
        racks,
        injectionTs:   ts(pick('injectionTimestamp')),
        injectedValue: Number(pick('injectedValue')),
        lastRealTs:    sd.lastRealTimestamp ? ts(sd.lastRealTimestamp) : NaN,
        trendStartTs:  ts(pick('thermalTrendStartTime')),
        trendRate:     Number(pick('thermalTrendRate')),
        histStartTs:   ts(pick('historianStartTime')),
        histEndTs:     ts(pick('historianEndTime')),
        sampleMs:      Number(pick('sampleIntervalMinutes')) * 60000,
    };
    // A broken or reversed window would draw nothing: fall back as a whole.
    if (!(cfg.histEndTs > cfg.histStartTs) || !(cfg.sampleMs > 0) || !Number.isFinite(cfg.injectionTs)) {
        cfg.injectionTs = ts(HISTORIAN_FALLBACK.injectionTimestamp);
        cfg.histStartTs = ts(HISTORIAN_FALLBACK.historianStartTime);
        cfg.histEndTs   = ts(HISTORIAN_FALLBACK.historianEndTime);
        cfg.sampleMs    = HISTORIAN_FALLBACK.sampleIntervalMinutes * 60000;
    }
    if (!(cfg.lastRealTs < cfg.injectionTs)) cfg.lastRealTs = NaN;
    cfg.defaultRangeHours = sd.defaultTimeRangeHours || defaultRangeFor(cfg);
    return cfg;
}

/** Smallest range that shows the injection with at least 30 minutes of real data before it. */
export function defaultRangeFor(cfg, ranges = TIME_RANGES) {
    const needMs = cfg.histEndTs - cfg.injectionTs + 30 * 60000;
    return ranges.find(h => h * 3600000 >= needMs) || ranges[ranges.length - 1];
}

/** Real (pre-injection) value for a rack at time t: base + thermal trend + organic noise. */
export function realValue(rack, t, cfg) {
    let value = rack.normalBase;
    if (Number.isFinite(cfg.trendStartTs) && t >= cfg.trendStartTs) {
        value += ((t - cfg.trendStartTs) / 60000) * cfg.trendRate;
    }
    const amp = rack.noiseAmplitude || 0.3;
    const period = (rack.noisePeriodMinutes || 4) * 60000;
    const phase = rack.id ? rack.id.charCodeAt(0) + (rack.id.charCodeAt(1) || 0) : 0;
    // Measured from the window start, not the epoch, so the trace (and every value
    // the report quotes) is the same whatever time zone the browser is in.
    const tt = t - cfg.histStartTs;
    value += amp * Math.sin((tt / period) * 2 * Math.PI + phase)
           + (amp * 0.4) * Math.sin((tt / (period * 0.7)) * 2 * Math.PI + phase * 1.3);
    return value;
}

/**
 * The points the chart draws for one rack. Samples sit on the sampling grid,
 * plus the exact last real reading and first falsified reading when those fall
 * between samples, so the moment of injection is a real, hoverable point.
 */
export function buildRackTrend(rack, cfg) {
    const times = new Set();
    for (let t = cfg.histStartTs; t <= cfg.histEndTs; t += cfg.sampleMs) times.add(t);
    const inWindow = (t) => Number.isFinite(t) && t >= cfg.histStartTs && t <= cfg.histEndTs;
    if (inWindow(cfg.injectionTs)) times.add(cfg.injectionTs);
    if (inWindow(cfg.lastRealTs)) times.add(cfg.lastRealTs);
    const sorted = [...times].sort((a, b) => a - b);

    const points = [];
    let prev = null;
    for (const t of sorted) {
        const isInjected = t >= cfg.injectionTs;
        const raw = isInjected ? cfg.injectedValue : realValue(rack, t, cfg);
        const value = +raw.toFixed(1);
        const dzdt = prev ? (value - prev.value) / ((t - prev.ts) / 60000) : 0;
        points.push({ ts: t, value, dzdt: +dzdt.toFixed(3), isInjected, isInjectionStart: t === cfg.injectionTs });
        prev = { ts: t, value };
    }
    // The first falsified point is the injection start even when injectionTs was off-window.
    const first = points.find(p => p.isInjected);
    if (first) first.isInjectionStart = true;
    return points;
}

/** Facts about the falsification in one rack's trend, read from the drawn points. */
export function findAnomaly(points, cfg) {
    const firstIdx = points.findIndex(p => p.isInjected);
    if (firstIdx <= 0) return null;
    const lastReal = points[firstIdx - 1];
    const firstInjected = points[firstIdx];
    return {
        lastReal,
        firstInjected,
        delta:          +(firstInjected.value - lastReal.value).toFixed(1),
        gapMs:          firstInjected.ts - lastReal.ts,
        flatDurationMs: cfg.histEndTs - firstInjected.ts,
        endTs:          cfg.histEndTs,
    };
}

// ── Formatting ───────────────────────────────────────────────────────────

const p2 = (n) => String(n).padStart(2, '0');
export const fmtClock = (t) => { const d = new Date(t); return `${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`; };
export const fmtHM    = (t) => { const d = new Date(t); return `${p2(d.getHours())}:${p2(d.getMinutes())}`; };
export const fmtFull  = (t) => { const d = new Date(t); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${fmtClock(t)}`; };
export const fmtSigned = (v) => (v < 0 ? '−' : '+') + Math.abs(v).toFixed(1);
export function fmtDuration(ms) {
    const mins = Math.floor(ms / 60000);
    const h = Math.floor(mins / 60);
    return h > 0 ? `${h}h ${mins % 60}m` : `${mins}m`;
}
export function fmtGap(ms) {
    const s = Math.round(ms / 1000);
    if (s < 120) return `${s} second${s === 1 ? '' : 's'}`;
    return fmtDuration(ms);
}

// ── Text shown to the player ─────────────────────────────────────────────

export function tooltipText(point, anomaly) {
    const head = `${fmtFull(point.ts)}${point.isInjectionStart ? ' ← INJECTION START' : ''}\n`
               + `Temperature: ${point.value.toFixed(1)}°C\n`
               + `dZ/dt: ${point.dzdt.toFixed(3)} °C/min`;
    if (!point.isInjected || !anomaly) return { kind: 'normal', text: head };
    const { lastReal, delta, gapMs } = anomaly;
    if (point.isInjectionStart) {
        return {
            kind: 'injection',
            text: head + `\n\nDISCONTINUITY: Temperature changed ${fmtSigned(delta)}°C in ${fmtGap(gapMs)}.\n`
                + `This is the first falsified data point.\n`
                + `Consistent with a Modbus register overwrite\n(FC16, Write Multiple Registers).`,
        };
    }
    return {
        kind: 'anomaly',
        text: head + `\n\n▲ ANOMALY: This reading has zero variance.\n`
            + `  Flat since ${fmtClock(anomaly.firstInjected.ts)}.\n`
            + `  Last natural reading: ${lastReal.value.toFixed(1)}°C at ${fmtClock(lastReal.ts)}\n`
            + `  Δ = ${fmtSigned(delta)}°C in ${fmtGap(gapMs)}:\n`
            + `  a physically impossible cooling rate.`,
    };
}

export function compareBannerText(anomaly, rackCount) {
    const when = anomaly ? fmtClock(anomaly.firstInjected.ts) : '?';
    const which = rackCount === 1 ? 'The rack reports' : `All ${rackCount} racks report`;
    return `${which} identical values from ${when}.\n`
         + '  Probability of natural coincidence: negligible.\n'
         + '  Consistent with automated Modbus register injection across all PLC-BMS inputs.';
}

/** Rows for the HISTORIAN ANOMALY REPORT, plus the confirm button label. */
export function reportContent(anomaly, cfg, sd = {}, rack = null) {
    const ids = cfg.racks.map(r => r.id);
    const variable = sd.reportVariable
        || `Cell temperature, ${ids.length === 1 ? 'rack ' + ids[0] : 'racks ' + ids.join(', ')}`;
    if (!anomaly) {
        return { rows: [['Variable:', variable], ['Finding:', 'No falsified readings in this trend.']], confirmLabel: '[CONFIRM]' };
    }
    const { lastReal, firstInjected, delta, gapMs, flatDurationMs, endTs } = anomaly;
    const rackName = rack ? ` (${rack.label || rack.id})` : '';
    return {
        rows: [
            ['Variable:', variable],
            ['Time window:', `${fmtFull(firstInjected.ts)} to ${fmtFull(endTs)}\n${fmtDuration(flatDurationMs)}, up to now`],
            ['Finding:', `Zero-variance flat line at ${firstInjected.value.toFixed(1)}°C\n`
                + `Last natural reading${rackName}: ${lastReal.value.toFixed(1)}°C at ${fmtClock(lastReal.ts)}\n`
                + `Δ = ${fmtSigned(delta)}°C in ${fmtGap(gapMs)} (physically impossible)`],
            ['Interpretation:', `Sensor data falsification via PLC register\ninjection. Injection timestamp: ${fmtClock(firstInjected.ts)}.`],
        ],
        confirmLabel: `[CONFIRM: MARK AS INJECTION EVENT AT ${fmtHM(firstInjected.ts)}]`,
    };
}
