// SCADA historian (sis02): every value the tooltip, banner and anomaly report
// show comes from minigameData and the drawn trend, so they agree (2026-10-05
// playtest: the report said 2025-01-15 and 36.2°C while the tooltip said 36.5°C).
// Run with: node --test test/js/scada-historian-data.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
// The game modules are ESM but public/ has no package.json "type": "module", so Node would load
// a plain import as CommonJS and fail on `export`. Import the source as an ES module via a data URL.
const H = await import('data:text/javascript;base64,' + readFileSync(join(here, '../../public/break_escape/js/minigames/scada-historian/scada-historian-data.js')).toString('base64'));

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

// D167 (post-release): the viewer must not name the anomaly before the player finds it.
test('before the finding, tooltips show the raw reading only; after it, the anomaly text', () => {
    const { points, anomaly } = setup(SD);
    const flat = points[points.length - 1];
    for (const p of [flat, anomaly.firstInjected]) {
        const before = H.tooltipText(p, anomaly, false);
        assert.equal(before.kind, 'normal');
        assert.doesNotMatch(before.text, /ANOMALY|INJECTION|DISCONTINUITY|Flat since|impossible/);
        assert.match(before.text, /Temperature: 28\.0°C/);
    }
    assert.equal(H.tooltipText(flat, anomaly, true).kind, 'anomaly');
    assert.equal(H.tooltipText(anomaly.firstInjected, anomaly, true).kind, 'injection');
});

test('a mark is accepted near the first flat reading, with a gentle retry too early or too late', () => {
    const { points, anomaly } = setup(SD);
    const at = (clock) => points.find(p => H.fmtClock(p.ts) === clock);
    assert.equal(H.judgeMark(at('22:00:00'), anomaly).kind, 'early');
    assert.match(H.judgeMark(at('22:00:00'), anomaly).message, /^22:00:00: \d+\.\d°C\. Still moving like a real sensor reading\./);
    assert.equal(H.judgeMark(at('23:09:00'), anomaly).kind, 'early');
    for (const c of ['23:11:00', '23:12:06', '23:12:07', '23:20:00', '23:22:00']) {
        assert.ok(H.judgeMark(at(c), anomaly).ok, `${c} accepted`);
    }
    const late = H.judgeMark(at('23:23:00'), anomaly);
    assert.equal(late.kind, 'late');
    assert.match(late.message, /Find where it starts/);
    assert.equal(H.judgeMark(at('04:00:00'), anomaly).kind, 'late');
    assert.equal(H.judgeMark(points[0], null).ok, false);
});

test('the finding choices: one right, and each wrong one gets a reason from the data', () => {
    const { anomaly } = setup(SD);
    assert.deepEqual(H.FINDING_CHOICES.map(c => c.id).sort(), ['cooling', 'dropout', 'written']);
    assert.ok(H.judgeFinding('written', anomaly).ok);
    const drop = H.judgeFinding('dropout', anomaly);
    assert.equal(drop.ok, false);
    assert.match(drop.message, new RegExp(`last real reading, ${anomaly.lastReal.value.toFixed(1)}°C.*28\\.0°C`));
    const cool = H.judgeFinding('cooling', anomaly);
    assert.equal(cool.ok, false);
    assert.match(cool.message, new RegExp(`cool by ${Math.abs(anomaly.delta).toFixed(1)}°C in 1 second, and a real sensor never reads exactly the same`));
});

test('every choice is a plain claim of the same shape; none quotes a figure the chart shows (R1 m1)', () => {
    for (const c of H.FINDING_CHOICES) {
        assert.match(c.label, /^[A-Z][a-z ]+: [^:]+\.$/, c.id);
        assert.doesNotMatch(c.label, /\d|—/, `${c.id} has no figures or em dashes`);
    }
    const lens = H.FINDING_CHOICES.map(c => c.label.length);
    assert.ok(Math.max(...lens) - Math.min(...lens) < 20, 'similar length, so length gives nothing away');
});

test('a mark within MARK_TOUCH_PX of the cliff counts at phone scale; one just outside does not (R1 M1)', () => {
    const { points, anomaly } = setup(SD);
    const at = (clock) => points.find(p => H.fmtClock(p.ts) === clock);
    const pxPerMs = 276 / (12 * 3600000); // the 390px plot over a 12-hour window
    assert.ok(30 * 0.383 < H.MARK_TOUCH_PX, '30 minutes is 11.5px at 390px, inside the band');
    // 23:42 is 30 min late: time window says late, pixels say near
    assert.equal(H.judgeMark(at('23:42:00'), anomaly).kind, 'late');
    assert.ok(H.judgeMark(at('23:42:00'), anomaly, { pxPerMs }).ok, 'late but within 14px');
    // 22:40 is 32 min early: 12px, but the early radius is 4px (R2 m2)
    assert.equal(H.judgeMark(at('22:40:00'), anomaly, { pxPerMs }).kind, 'early');
    assert.ok(H.judgeMark(at('23:05:00'), anomaly, { pxPerMs }).ok, '7 minutes early is within the 2 minute window or 4px');
    assert.equal(H.MARK_EARLY_PX, 4);
    // 00:00 is 48 min late: 18px, outside
    assert.equal(H.judgeMark(at('00:00:00'), anomaly, { pxPerMs }).kind, 'late');
    assert.equal(H.judgeMark(at('21:00:00'), anomaly, { pxPerMs }).kind, 'early');
    // at desktop scale the band is about the same size in pixels, so far readings stay rejected
    assert.equal(H.judgeMark(at('23:50:00'), anomaly, { pxPerMs: 968 / (12 * 3600000) }).kind, 'late');
});

test('a late mark when the cliff is left of the time range says to widen the range (R1 M2)', () => {
    const { points, anomaly, cfg } = setup(SD);
    const at = (clock) => points.find(p => H.fmtClock(p.ts) === clock);
    const oneHourStart = cfg.histEndTs - 3600000; // 05:30: the 23:12 cliff is not in view
    const off = H.judgeMark(at('05:40:00'), anomaly, { rangeStartTs: oneHourStart });
    assert.equal(off.kind, 'late');
    assert.match(off.message, /widen the range/);
    assert.doesNotMatch(off.message, /Find where it starts/);
    const inView = H.judgeMark(at('04:00:00'), anomaly, { rangeStartTs: cfg.histEndTs - 12 * 3600000 });
    assert.match(inView.message, /Find where it starts/);
});

test('the hint no longer says tap inspects (R1 m3)', () => {
    assert.doesNotMatch(H.DEFAULT_HINT, /tap a reading to inspect|Hover or tap/);
    assert.match(H.DEFAULT_HINT, /Click or tap it \(or press Enter\)/);
    assert.doesNotMatch(H.compareNeutralText(4), /Hover or tap/);
});

test('compare mode reads every rack at one time, and the neutral banner names no time', () => {
    const { cfg } = setup(SD);
    const trend = new Map(cfg.racks.map(r => [r.id, H.buildRackTrend(r, cfg)]));
    const after = trend.get('A1').find(p => H.fmtClock(p.ts) === '23:30:00');
    assert.match(H.compareValuesText(after.ts, cfg.racks, trend), /Rack A1: 28\.0°C\nRack A2: 28\.0°C$/);
    const before = trend.get('A1').find(p => H.fmtClock(p.ts) === '22:00:00');
    const txt = H.compareValuesText(before.ts, cfg.racks, trend);
    assert.notEqual(txt.match(/A1: ([\d.]+)/)[1], txt.match(/A2: ([\d.]+)/)[1]);
    assert.doesNotMatch(H.compareNeutralText(4), /\d\d:\d\d|INJECTION|identical/);
});
