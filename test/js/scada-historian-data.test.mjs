// SCADA historian (sis02): every value the tooltip, banner and anomaly report
// show comes from minigameData and the drawn trend, so they agree (2026-10-05
// playtest: the report said 2025-01-15 and 36.2°C while the tooltip said 36.5°C).
// Run with: node --test test/js/scada-historian-data.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const H = await import(pathToFileURL(join(here, '../../public/break_escape/js/minigames/scada-historian/scada-historian-data.js')).href);

// Fixture shaped like sis02's historian_trend_viewer minigameData
const SD = {
    racks: [
        { id: 'A1', label: 'Rack A1', normalBase: 30.2, noisePeriodMinutes: 3, noiseAmplitude: 0.4 },
        { id: 'A2', label: 'Rack A2', normalBase: 29.9, noisePeriodMinutes: 4, noiseAmplitude: 0.3 },
    ],
    injectionTimestamp: '2026-03-20T23:12:07',
    injectedValue: 28.0,
    lastRealTimestamp: '2026-03-20T23:12:06',
    thermalTrendStartTime: '2026-03-20T20:00:00',
    thermalTrendRate: 0.03,
    historianStartTime: '2026-03-20T18:00:00',
    historianEndTime: '2026-03-21T06:30:00',
    sampleIntervalMinutes: 1,
};

function setup(sd) {
    const cfg = H.parseHistorianConfig(sd);
    const rack = cfg.racks[0];
    const points = H.buildRackTrend(rack, cfg);
    return { cfg, rack, points, anomaly: H.findAnomaly(points, cfg) };
}

test('the last real and first falsified readings are the drawn points either side of the injection', () => {
    const { points, anomaly } = setup(SD);
    const i = points.findIndex(p => p.isInjected);
    assert.equal(anomaly.lastReal, points[i - 1]);
    assert.equal(anomaly.firstInjected, points[i]);
    assert.equal(H.fmtFull(anomaly.lastReal.ts), '2026-03-20 23:12:06');
    assert.equal(H.fmtFull(anomaly.firstInjected.ts), '2026-03-20 23:12:07');
    assert.equal(anomaly.firstInjected.value, 28.0);
    assert.ok(anomaly.firstInjected.isInjectionStart);
    assert.equal(anomaly.delta, +(28.0 - anomaly.lastReal.value).toFixed(1));
    assert.equal(anomaly.gapMs, 1000);
    // Everything after the injection is flat
    assert.ok(points.slice(i).every(p => p.value === 28.0));
    assert.ok(points.slice(i + 1).every(p => p.dzdt === 0));
});

test('tooltip and report quote the same values, and those are the chart values', () => {
    const { cfg, rack, points, anomaly } = setup(SD);
    const last = anomaly.lastReal.value.toFixed(1);
    const delta = H.fmtSigned(anomaly.delta);
    const flat = H.tooltipText(points[points.length - 1], anomaly).text;
    const start = H.tooltipText(anomaly.firstInjected, anomaly).text;
    const { rows, confirmLabel } = H.reportContent(anomaly, cfg, SD, rack);
    const report = rows.map(r => r.join(' ')).join('\n');

    assert.match(flat, new RegExp(`Last natural reading: ${last}°C at 23:12:06`));
    assert.match(flat, new RegExp(`Δ = ${delta}°C in 1 second`));
    assert.match(start, /INJECTION START/);
    assert.match(start, new RegExp(`changed ${delta}°C in 1 second`));
    assert.match(report, new RegExp(`Last natural reading \\(Rack A1\\): ${last}°C at 23:12:06`));
    assert.match(report, new RegExp(`Δ = ${delta}°C in 1 second`));
    assert.match(report, /flat line at 28\.0°C/);
    assert.match(report, /2026-03-20 23:12:07 to 2026-03-21 06:30:00\n7h 17m, up to now/);
    assert.match(report, /Injection timestamp: 23:12:07\./);
    assert.equal(confirmLabel, '[CONFIRM: MARK AS INJECTION EVENT AT 23:12]');
    assert.doesNotMatch(report, /2025|36\.2|8\.1/);
    // sis02 story: about 36°C real at 23:12
    assert.ok(Math.abs(anomaly.lastReal.value - 36) < 1, `last real ${last}`);
});

test('the compare banner names the rack count and injection time', () => {
    const { anomaly } = setup(SD);
    assert.match(H.compareBannerText(anomaly, 2), /^All 2 racks report identical values from 23:12:07\./);
});

test('reportVariable from minigameData is used, else a plain default', () => {
    const { cfg, anomaly } = setup(SD);
    assert.equal(H.reportContent(anomaly, cfg, {}).rows[0][1], 'Cell temperature, racks A1, A2');
    assert.equal(H.reportContent(anomaly, cfg, { reportVariable: 'Battery Hall 1' }).rows[0][1], 'Battery Hall 1');
});

test('the default range shows the injection unless minigameData sets one', () => {
    assert.equal(H.parseHistorianConfig(SD).defaultRangeHours, 12); // 7h18m + 30 min of real data
    assert.equal(H.parseHistorianConfig({ ...SD, defaultTimeRangeHours: 6 }).defaultRangeHours, 6);
});

test('an off-grid injection time becomes a real point; without lastRealTimestamp the previous sample is used', () => {
    const { points, anomaly } = setup({ ...SD, lastRealTimestamp: undefined });
    assert.ok(points.some(p => H.fmtClock(p.ts) === '23:12:07'));
    assert.equal(H.fmtClock(anomaly.lastReal.ts), '23:12:00');
    assert.equal(anomaly.gapMs, 7000);
    assert.match(H.tooltipText(anomaly.firstInjected, anomaly).text, /in 7 seconds/);
});

test('fallback without minigameData still gives a coherent trend and report', () => {
    const { cfg, points, anomaly } = setup({});
    assert.ok(points.length > 100);
    assert.ok(anomaly, 'fallback trend has an injection');
    assert.ok(anomaly.lastReal.value > anomaly.firstInjected.value);
    const report = H.reportContent(anomaly, cfg, {}).rows.map(r => r[1]).join('\n');
    assert.match(report, new RegExp(`${anomaly.lastReal.value.toFixed(1)}°C at ${H.fmtClock(anomaly.lastReal.ts)}`));
    assert.match(report, new RegExp(`Δ = ${H.fmtSigned(anomaly.delta)}`));
    assert.doesNotMatch(report, /NaN|undefined|Invalid/);
});

test('values do not depend on the browser time zone', () => {
    const saved = process.env.TZ;
    const read = () => { const { anomaly } = setup(SD); return [anomaly.lastReal.value, H.fmtClock(anomaly.lastReal.ts)]; };
    try {
        process.env.TZ = 'Europe/London'; const a = read();
        process.env.TZ = 'America/New_York'; const b = read();
        process.env.TZ = 'Asia/Tokyo'; const c = read();
        assert.deepEqual(a, b); assert.deepEqual(a, c);
    } finally { if (saved === undefined) delete process.env.TZ; else process.env.TZ = saved; }
});
