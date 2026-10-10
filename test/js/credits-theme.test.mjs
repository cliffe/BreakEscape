// Credits visualiser themes: "safetynet" (campaign default) and "cyber" (generic
// incident review for standalone exercises such as the SIS games), 2026-10-05.
// Run with: node --test test/js/credits-theme.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const T = await import(pathToFileURL(join(here, '../../public/break_escape/js/music/credits-theme.js')).href);

test('theme selection: creditsTheme picks a theme, anything else gets safetynet', () => {
    assert.equal(T.resolveCreditsTheme({ creditsTheme: 'cyber' }), 'cyber');
    assert.equal(T.resolveCreditsTheme({ creditsTheme: 'safetynet' }), 'safetynet');
    assert.equal(T.resolveCreditsTheme({}), 'safetynet');
    assert.equal(T.resolveCreditsTheme(null), 'safetynet');
    assert.equal(T.resolveCreditsTheme({ disableAttacks: true }), 'safetynet'); // opt-in only
    assert.equal(T.resolveCreditsTheme({ creditsTheme: 'bogus' }), 'safetynet');
    assert.equal(T.resolveCreditsTheme({ creditsTheme: 'toString' }), 'safetynet');
});

test('per-theme mode lists: safetynet has every mode, cyber drops the threat map', () => {
    assert.deepEqual(T.CREDITS_THEMES.safetynet.modes, T.ALL_VIS_MODES);
    const cyber = T.CREDITS_THEMES.cyber.modes;
    assert.ok(!cyber.includes('cybermap'));
    assert.ok(cyber.includes('siem') && cyber.includes('matrix') && cyber.includes('wave'));
    for (const [name, def] of Object.entries(T.CREDITS_THEMES)) {
        assert.ok(def.modes.length > 0, name);
        assert.ok(def.modes.every(m => T.ALL_VIS_MODES.includes(m)), `${name} lists an unknown mode`);
    }
});

test('safetynet keeps the overlay as built and names the track', () => {
    const sn = T.CREDITS_THEMES.safetynet;
    assert.equal(sn.overlay({ missionName: 'First Contact', credits: [] }), null);
    assert.match(sn.matrixChars, /SAFETYNET/);
    assert.equal(sn.centreLabel, 'S/N');
    const t = T.trackInfoLabel('safetynet', { trackTitle: 'Safetynet in the Smoke', playlistName: 'Victory' });
    assert.equal(t.label, 'INTEL:');
    assert.match(t.detail, /SAFETYNET IN THE SMOKE/);
});

test('cyber theme uses the mission name and credits setting, with no spy framing', () => {
    const credits = [
        { text: 'INCIDENT CONTAINED', style: 'title' },
        { text: 'ALBION ENERGY STORAGE, SATURDAY 21 MARCH 2026', style: 'subtitle' },
        { text: 'Jump server cable pulled', style: 'entry' },
    ];
    const def = T.CREDITS_THEMES.cyber;
    const o = def.overlay({ missionName: 'Albion Battery Hall: Code Red', credits });
    assert.equal(o.heading, 'INCIDENT REVIEW');
    assert.equal(o.subheading, 'ALBION BATTERY HALL: CODE RED');
    assert.deepEqual(o.rows, [['SCENARIO', 'Albion Battery Hall: Code Red'], ['SETTING', 'ALBION ENERGY STORAGE, SATURDAY 21 MARCH 2026']]);
    assert.match(o.ticker, /ALBION ENERGY STORAGE/);
    const spy = /SAFETYNET|ENTROPY|CLASSIFIED|AGENCY|OPERATIVE|AUDIO INTEL|MISSION COMPLETE|AGENT|ATTACK:/;
    assert.doesNotMatch(JSON.stringify(o), spy);
    assert.doesNotMatch(def.matrixChars, /SAFETYNET|ENTROPY/);
    assert.doesNotMatch(JSON.stringify(def.logMessages), spy);
    assert.deepEqual(o.phase, ['PHASE:', 'REVIEW']); // no audio-driven THREAT row under INCIDENT CONTAINED
    assert.equal(T.CREDITS_THEMES.safetynet.overlay({}), null); // safetynet keeps its THREAT row
    assert.equal(def.stamp, false);
    assert.notEqual(def.logo, 'shield');
    const t = T.trackInfoLabel('cyber', { trackTitle: 'Safetynet in the Smoke', playlistName: 'Victory' });
    assert.doesNotMatch(t.label + t.detail, /SAFETYNET|VICTORY|INTEL/i);
});

test('cyber theme copes with no credits and no mission name', () => {
    const o = T.CREDITS_THEMES.cyber.overlay({});
    assert.equal(o.subheading, 'BREAK ESCAPE');
    assert.deepEqual(o.rows, [['SCENARIO', 'BREAK ESCAPE']]);
});

test('schema enum lists exactly the themes in the table', () => {
    const schema = JSON.parse(readFileSync(join(here, '../../scripts/scenario-schema.json'), 'utf8'));
    assert.deepEqual([...schema.properties.creditsTheme.enum].sort(), Object.keys(T.CREDITS_THEMES).sort());
});
