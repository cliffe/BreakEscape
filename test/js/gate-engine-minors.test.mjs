// Gate engine minors: the credits THREAT row reflects the end state, and the toast hold
// covers the phone on purpose (history: 43f9940c3 "conversations, locks, the phone").
// Run with: node --max-old-space-size=2048 test/js/gate-engine-minors.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import * as T from '../../public/break_escape/js/music/credits-theme.js';
import { buildEndSequence, replayEndingEntry } from '../../public/break_escape/js/music/closing-sequence.js';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const vis = readFileSync(join(js, 'music/bond-visualiser.js'), 'utf8');
const schema = readFileSync(join(here, '../../scripts/scenario-schema.json'), 'utf8');
const root = join(here, '../..');
// scenario-music-events.js in a temp tree, with the audio and art modules stubbed.
globalThis.window = {};
const tree = mkdtempSync(join(tmpdir(), 'gate-minors-'));
writeFileSync(join(tree, 'package.json'), '{"type":"module"}\n');
for (const sub of ['music', 'ui', 'utils']) mkdirSync(join(tree, sub));
const real = (p) => readFileSync(join(js, p), 'utf8');
for (const p of ['music/closing-sequence.js', 'music/conclude-mission.js', 'music/scenario-music-events.js', 'utils/display-dashes.js']) writeFileSync(join(tree, p), real(p));
writeFileSync(join(tree, 'music/music-controller.js'), 'export default new Proxy({}, { get: () => () => false });');
writeFileSync(join(tree, 'music/ending-audio.js'), 'export const playEndingMusic = () => null; export const whenEndingAudible = () => ({ ready: Promise.resolve() });');
writeFileSync(join(tree, 'music/music-config.js'), 'export const MUSIC_CONFIG = {};');
writeFileSync(join(tree, 'ui/success-screen.js'), 'export const returnToMissions = () => {};');
writeFileSync(join(tree, 'config.js'), 'export const ASSETS_PATH = "/assets";');
const { endingReplayOptions } = await import(pathToFileURL(join(tree, 'music/scenario-music-events.js')).href);
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

const winCredits = [{ text: 'MISSION COMPLETE', style: 'title' }, { text: 'FIRST CONTACT', style: 'subtitle' }];
const failCredits = [{ text: 'MISSION FAILED', style: 'title' }];

test('creditsThreat is a function and the audio-driven row stays live before the credits', () => {
    assert.ok(typeof T.creditsThreat === 'function', 'creditsThreat exported');
    assert.ok(T.creditsThreat({ over: false, credits: winCredits }) === null, 'no credits: audio-driven');
    assert.ok(T.creditsThreat({}) === null, 'empty options: audio-driven');
});

test('a win never shows an alarm value', () => {
    const r = T.creditsThreat({ over: true, credits: winCredits });
    assert.ok(r.text === 'CONTAINED', 'win text ' + r.text);
    assert.ok(r.tone === 'good', 'win tone');
    assert.ok(!/CRITICAL|BREACH|HIGH/.test(r.text), 'no audio level word');
});

test('a failed ending shows ACTIVE (title, header or status)', () => {
    assert.ok(T.creditsThreat({ over: true, credits: failCredits }).text === 'ACTIVE', 'title FAILED');
    assert.ok(T.creditsThreat({ over: true, headerText: 'MISSION FAILED // AUDIO INTEL' }).text === 'ACTIVE', 'header');
    assert.ok(T.creditsThreat({ over: true, statusText: 'COMPROMISED' }).text === 'ACTIVE', 'status');
    assert.ok(T.creditsThreat({ over: true, credits: failCredits }).tone === 'bad', 'bad tone');
});

test('a scenario threatText wins, and a pending sync says PENDING', () => {
    assert.ok(T.creditsThreat({ over: true, threatText: ' STANDING DOWN ', credits: failCredits }).text === 'STANDING DOWN', 'override');
    assert.ok(T.creditsThreat({ over: true, statusText: 'PENDING SYNC' }).text === 'PENDING', 'pending');
});

test('the visualiser holds the value instead of following the audio after the credits', () => {
    // Source pins: the DOM-bound update loop cannot run under node. The behaviour of the
    // value itself is covered by the creditsThreat tests above.
    assert.ok(/creditsThreat\(\{[^}]*threatText: _threatText/.test(vis), 'update loop asks creditsThreat');
    assert.ok(/over: _missionOver \|\| !!_lastCredits\?\.length/.test(vis), 'held once credits roll or mission over');
    assert.ok(/tl && held/.test(vis), 'held value written before the audio branches');
});

test('endingReplayOptions carries threatText, threatTone and outcome from the ending entry', () => {
    const scenario = { music: { events: [{ trigger: 'global_variable_changed:done',
        credits: [{ text: 'MISSION COMPLETE', style: 'title' }],
        threatText: 'STANDING DOWN', threatTone: 'green', outcome: 'active' }] } };
    const o = endingReplayOptions(scenario, { done: true }, null);
    assert.ok(o.threatText === 'STANDING DOWN', 'threatText ' + o.threatText);
    assert.ok(o.threatTone === 'green', 'threatTone');
    assert.ok(o.outcome === 'active', 'outcome');
    const plain = endingReplayOptions({ music: { events: [{ trigger: 'global_variable_changed:done',
        credits: [{ text: 'MISSION COMPLETE', style: 'title' }] }] } }, { done: true }, null);
    assert.ok(plain.threatText === undefined, 'no threatText when the entry sets none');
});

test('the schema declares threatText, threatTone and outcome', () => {
    const entry = JSON.parse(schema).properties.music.properties.events.items.properties;
    assert.ok(entry.threatText?.type === 'string', 'threatText');
    assert.ok(entry.threatTone?.enum?.join() === 'red,green,cyan', 'threatTone enum');
    assert.ok(entry.outcome?.enum?.join() === 'contained,active', 'outcome enum');
});

test('word boundaries and negation: FAILSAFE and UNCOMPROMISED are neutral, NOT CONTAINED is a failure', () => {
    const read = (t) => T.creditsThreat({ over: true, credits: [{ text: t, style: 'title' }] }).text;
    assert.ok(read('FAILSAFE HELD') === 'CONTAINED', 'FAILSAFE');
    assert.ok(read('UNCOMPROMISED') === 'CONTAINED', 'UNCOMPROMISED');
    assert.ok(read('NOT COMPROMISED') === 'CONTAINED', 'negated COMPROMISED');
    assert.ok(read('NO FAILURE') === 'CONTAINED', 'negated FAILURE');
    assert.ok(read('INCIDENT NOT CONTAINED') === 'ACTIVE', 'NOT CONTAINED');
    assert.ok(read('MISSION 4: CRITICAL FAILURE') === 'ACTIVE', 'FAILURE');
    assert.ok(read('Mission failed') === 'ACTIVE', 'FAILED, any case');
    assert.ok(read('COMPROMISED') === 'ACTIVE', 'COMPROMISED');
});

test('an explicit outcome beats sniffing; threatText beats an outcome', () => {
    const calm = [{ text: 'MISSION FAILED', style: 'title', outcome: 'contained' }];
    assert.ok(T.creditsThreat({ over: true, credits: calm }).text === 'CONTAINED', 'line outcome over a FAILED title');
    assert.ok(T.creditsThreat({ over: true, outcome: 'contained', headerText: 'MISSION FAILED' }).text === 'CONTAINED', 'entry outcome over the header');
    const loud = [{ text: 'MISSION COMPLETE', style: 'title', outcome: 'active' }];
    assert.ok(T.creditsThreat({ over: true, credits: loud }).text === 'ACTIVE', 'line outcome active');
    assert.ok(T.creditsThreat({ over: true, outcome: 'active' }).tone === 'bad', 'entry outcome active, bad tone');
    assert.ok(T.creditsThreat({ over: true, outcome: 'active', credits: calm.concat(loud) }).text === 'ACTIVE', 'active wins over contained');
    assert.ok(T.creditsThreat({ over: true, outcome: 'active', threatText: 'SECURE' }).text === 'SECURE', 'threatText first');
    assert.ok(T.creditsThreat({ over: true, outcome: 'bogus', credits: failCredits }).text === 'ACTIVE', 'an unknown outcome falls back to sniffing');
});

test('threatText tone: known words pick it, threatTone overrides', () => {
    const tone = (o) => T.creditsThreat({ over: true, ...o }).tone;
    for (const w of ['ACTIVE', 'CRITICAL', 'BREACH']) assert.ok(tone({ threatText: w }) === 'bad', w + ' red');
    for (const w of ['CONTAINED', 'SECURE', 'CLEAR']) assert.ok(tone({ threatText: w }) === 'good', w + ' green');
    assert.ok(tone({ threatText: 'STANDING DOWN' }) === 'custom', 'unknown words stay cyan');
    assert.ok(tone({ threatText: 'STANDING DOWN', threatTone: 'red' }) === 'bad', 'threatTone red');
    assert.ok(tone({ threatText: 'ACTIVE', threatTone: 'green' }) === 'good', 'threatTone beats the word');
    assert.ok(tone({ threatText: 'ACTIVE', threatTone: 'cyan' }) === 'custom', 'threatTone cyan');
    assert.ok(tone({ threatText: 'ACTIVE', threatTone: 'purple' }) === 'bad', 'unknown threatTone ignored');
});

// Real ending data: render each scenario through the same ERB binding the server uses,
// build the credits the way the live ending does, and read the THREAT row.
const ruby = spawnSync('ruby', ['--version']);
const skipRuby = ruby.status !== 0 && 'ruby not found';
function endingEntries(mission) {
    const rb = `require 'json'; require ARGV[0]; f = File.join(ARGV[1], 'scenarios', ARGV[2], 'scenario.json.erb');
j = JSON.parse(BreakEscape::ScenarioBinding.render(File.read(f), {}));
puts JSON.generate((j.dig('music','events') || []).select { |e| e.is_a?(Hash) && (e['credits'] || e['closingCard']) })`;
    const r = spawnSync('ruby', ['-e', rb, join(root, 'lib/break_escape/scenario_binding'), root, mission], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    assert.ok(r.status === 0, 'ruby render of ' + mission + ': ' + (r.stderr || '').slice(0, 200));
    return JSON.parse(r.stdout);
}
// the same evaluator the credits use: an expression over globalVars and the event data
const evalIn = (globals, data) => (cond) => {
    // eslint-disable-next-line no-new-func
    try { return !!new Function('globalVars', 'value', 'name', `return (${cond});`)(globals, data?.value, data?.name); } catch { return false; }
};
function threatFor(mission, globals) {
    const entries = endingEntries(mission);
    const found = replayEndingEntry(entries, globals, (cond, data) => evalIn(globals, data)(cond));
    assert.ok(found, mission + ': an ending entry holds for ' + JSON.stringify(globals));
    return T.creditsThreat({ over: true, threatText: found.entry.threatText, threatTone: found.entry.threatTone,
        outcome: found.entry.outcome, headerText: found.entry.headerText, statusText: found.entry.statusText,
        credits: found.sequence });
}

test('m01 win reads CONTAINED although a credit line says "Identity compromised"', { skip: skipRuby }, () => {
    const globals = { all_tasks_complete: true, closing_debrief_done: true, maya_identity_protected: false };
    const found = replayEndingEntry(endingEntries('m01_first_contact'), globals, (c, d) => evalIn(globals, d)(c));
    const lines = found.sequence;
    assert.ok(lines.some(l => /Identity compromised/.test(l.text) && l.style === 'entry'), 'the real win credits carry the compromised entry line');
    const r = threatFor('m01_first_contact', globals);
    assert.ok(r.text === 'CONTAINED' && r.tone === 'good', 'm01 win ' + r.text);
});

test('m01 launch ending reads ACTIVE through the outcome on its MISSION FAILED title', { skip: skipRuby }, () => {
    const r = threatFor('m01_first_contact', { player_launched_attack: true });
    assert.ok(r.text === 'ACTIVE' && r.tone === 'bad', 'm01 failure ' + r.text);
    const entry = endingEntries('m01_first_contact').find(e => (e.credits || []).some(l => l.text === 'MISSION FAILED'));
    const failedLine = entry.credits.find(l => l.text === 'MISSION FAILED');
    assert.ok(failedLine.outcome === 'active', 'the scenario marks the failed title with outcome active');
});

test('m03 recruited win reads CONTAINED although a credit line says COMPROMISED', { skip: skipRuby }, () => {
    const globals = { victoria_fate: 'recruited' };
    const entries = endingEntries('m03_ghost_in_the_machine');
    const found = entries.map(e => buildEndSequence(e, globals, evalIn(globals, {}))).find(seq => seq.some(l => /COMPROMISED, from the inside/.test(l.text)));
    assert.ok(found, 'the real recruited credits carry the COMPROMISED entry line');
    const r = threatFor('m03_ghost_in_the_machine', globals);
    assert.ok(r.text === 'CONTAINED' && r.tone === 'good', 'm03 recruited win ' + r.text);
});

test('m10 joined ending reads ACTIVE, the other endings CONTAINED', { skip: skipRuby }, () => {
    const joined = threatFor('m10_full_disclosure', { night_closed: true, ending: 'joined' });
    assert.ok(joined.text === 'ACTIVE' && joined.tone === 'bad', 'joined ' + joined.text);
    const entry = endingEntries('m10_full_disclosure').find(e => e.headerText);
    assert.ok(entry.outcome === 'active', 'the joined entry declares outcome active');
    for (const ending of ['arrest', 'surrender', 'lethal', 'executed', 'scorched']) {
        const r = threatFor('m10_full_disclosure', { night_closed: true, ending });
        assert.ok(r.text === 'CONTAINED', ending + ' ' + r.text);
    }
});

test('the title-only fallback matters: scanning entry lines would turn the m01 win red', { skip: skipRuby }, () => {
    // Guards the fallback itself, with no outcome field to rescue it: the same real m01 win
    // credits, the explicit outcomes removed, must still read CONTAINED.
    const globals = { maya_identity_protected: false };
    const found = replayEndingEntry(endingEntries('m01_first_contact'), globals, (c, d) => evalIn(globals, d)(c));
    const bare = found.sequence.map(({ outcome, ...rest }) => rest);
    assert.ok(T.creditsThreat({ over: true, credits: bare }).text === 'CONTAINED', 'entry-line "compromised" is not a failure');
});

// Item B: the toast hold covers the phone on purpose (43f9940c3, overlay-open.js header).
// Behavioural: a task-complete toast raised with the phone open is held, then shown once on close.
const overlaySrc = readFileSync(join(js, 'utils/overlay-open.js'), 'utf8');
globalThis.window = {};
const notifSrc = readFileSync(join(js, 'systems/notifications.js'), 'utf8')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split("'../ui/modal-stack.js'").join(`'${dataUrl('export const registerModal = () => () => {};')}'`)
    .split("'../utils/overlay-open.js'").join(`'${dataUrl(overlaySrc)}'`);
const { showNotification } = await import(dataUrl(notifSrc));

test('a task toast raised with the phone open is held, then shown once when it closes', async () => {
    const appended = [];
    const el = () => ({
        classList: { add() {}, remove() {} }, style: {}, set innerHTML(v) { this.html = v; },
        querySelector: () => ({ style: {}, addEventListener() {}, appendChild() {} })
    });
    globalThis.document = {
        getElementById: (id) => (id === 'notification-container' ? { appendChild: (n) => appended.push(n) } : null),
        createElement: el, createTextNode: (text) => ({ text })
    };
    window.MinigameFramework = { currentMinigame: { _sceneType: 'phone-chat' } };
    assert.ok(showNotification('Task done', 'success', 'Task Complete', 0) === null, 'held, not rendered');
    assert.ok(appended.length === 0, 'nothing on screen while the phone is open');
    window.MinigameFramework.currentMinigame = null;
    await new Promise((r) => setTimeout(r, 400));
    assert.ok(appended.length === 1, 'shown once after the phone closes, got ' + appended.length);
    assert.ok(appended[0]._toast.title === 'Task Complete', 'it is the task toast');
});
