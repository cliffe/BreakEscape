// Gate engine minors: the credits THREAT row reflects the end state, and the toast hold
// covers the phone on purpose (history: 43f9940c3 "conversations, locks, the phone").
// Run with: node --max-old-space-size=2048 test/js/gate-engine-minors.test.mjs
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import * as T from '../../public/break_escape/js/music/credits-theme.js';
import { buildEndSequence, replayEndingEntry, expandCredits } from '../../public/break_escape/js/music/closing-sequence.js';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const vis = readFileSync(join(js, 'music/bond-visualiser.js'), 'utf8');
const schema = readFileSync(join(here, '../../scripts/scenario-schema.json'), 'utf8');
const root = join(here, '../..');
// scenario-music-events.js in a temp tree, with the audio and art modules stubbed.
globalThis.window = {};
const tree = mkdtempSync(join(tmpdir(), 'gate-minors-'));
// Teardown: remove this file's own temp tree (and nothing else) once every test has run.
after(() => rmSync(tree, { recursive: true, force: true }));
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
    assert.ok(/creditsThreat\(\{[^}]*threatTone: _threatTone[^}]*outcome: _outcome/.test(vis), 'update loop passes threatTone and outcome');
    assert.ok(/_threatTone = nextCreditsText\(_threatTone, opts, 'threatTone'\)/.test(vis), 'threatTone kept across open({})');
    assert.ok(/_outcome = nextCreditsText\(_outcome, opts, 'outcome'\)/.test(vis), 'outcome kept across open({})');
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

test('negation fallback: wider negators, a short gap, plurals, NON- and UN- prefixes', () => {
    const read = (t) => T.creditsThreat({ over: true, credits: [{ text: t, style: 'title' }] }).text;
    for (const t of ['NO FAILURES', 'NEVER FAILED TO DELIVER', 'NOTHING COMPROMISED', 'NOBODY FAILED', 'NO SYSTEMS COMPROMISED',
        'NOT YET COMPROMISED', 'NOT A FAILURE', 'NON-COMPROMISED', 'NOT-COMPROMISED', 'UN-COMPROMISED', 'NEVER  COMPROMISED', 'NOT\nFAILED']) {
        assert.ok(read(t) === 'CONTAINED', JSON.stringify(t) + ' reads CONTAINED, got ' + read(t));
    }
    for (const t of ['UNCONTAINED', 'NEVER CONTAINED', 'NOT CONTAINED', 'MISSION FAILURES', 'CONTAINMENT FAILED',
        'NO FAILURE, BUT COMPROMISED', 'NOT FAILED BUT COMPROMISED', 'NOT COMPROMISED COMPROMISED']) {
        assert.ok(read(t) === 'ACTIVE', JSON.stringify(t) + ' reads ACTIVE, got ' + read(t));
    }
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

test('expandCredits carries outcome from a clause, a person, a section and a line', () => {
    const always = () => true;
    const credits = [
        { section: 'A', outcome: 'active', lines: [{ text: 'l1' }, { text: 'l2', outcome: 'contained' }] },
        { section: 'B', people: [
            { name: 'P1', outcome: 'active', clauses: [{ text: 'c1' }] },
            { name: 'P2', outcome: 'active', clauses: [{ text: 'c2', outcome: 'contained' }] },
            { name: 'P3', clauses: [{ text: 'c3' }] }] },
        { text: 'plain' }];
    const out = expandCredits(credits, always);
    const of = (frag) => out.find(l => l.text.includes(frag));
    assert.ok(of('l1').outcome === 'active', 'section outcome reaches a line without its own');
    assert.ok(of('l2').outcome === 'contained', 'a line keeps its own outcome over the section');
    assert.ok(of('P1').outcome === 'active', 'person outcome carried when the clause sets none');
    assert.ok(of('P2').outcome === 'contained', 'clause outcome beats the person');
    assert.ok(of('P3').outcome === undefined, 'no outcome anywhere: no key');
    assert.ok(of('plain').outcome === undefined, 'a plain line is unchanged');
    assert.ok(T.creditsThreat({ over: true, credits: expandCredits([{ section: 'S', outcome: 'active', people: [{ name: 'N', clauses: [{ text: 'fine' }] }] }], always) }).text === 'ACTIVE', 'a section outcome reaches the THREAT row');
});

// The live path: a credits ending fires playEntry, which hands the entry's outcome and
// threatTone to BondVisualiser.open. A fake visualiser records the options.
async function openedWith(entry) {
    const { initScenarioMusicEvents, _resetEndingMusicLock } = await import(pathToFileURL(join(tree, 'music/scenario-music-events.js')).href);
    _resetEndingMusicLock(); // the first ending latches the music; each case starts fresh
    const seen = [];
    let fire = null;
    globalThis.window = {
        eventDispatcher: { on: (name, cb) => { if (name === 'done') fire = cb; }, off() {} },
        gameState: { globalVariables: {} },
        BondVisualiser: { open: (o) => seen.push(o), setAutoOpenSuppressed() {} }
    };
    initScenarioMusicEvents({ music: { events: [{ trigger: 'done', ...entry }] } });
    assert.ok(typeof fire === 'function', 'the ending trigger is registered');
    fire({});
    await new Promise((r) => setTimeout(r, 50));
    assert.ok(seen.length === 1, 'BondVisualiser.open called once, got ' + seen.length);
    return seen[0];
}

test('the live ending hands outcome and threatTone to BondVisualiser.open, and a disagreeing outcome decides the row', async () => {
    const o = await openedWith({ credits: [{ text: 'MISSION COMPLETE', style: 'title' }], outcome: 'active', threatText: 'STANDING DOWN', threatTone: 'red' });
    assert.ok(o.outcome === 'active', 'outcome reaches open(): ' + o.outcome);
    assert.ok(o.threatTone === 'red', 'threatTone reaches open(): ' + o.threatTone);
    const plain = await openedWith({ credits: [{ text: 'MISSION COMPLETE', style: 'title' }], outcome: 'active' });
    const row = T.creditsThreat({ over: true, threatText: plain.threatText, threatTone: plain.threatTone, outcome: plain.outcome,
        headerText: plain.headerText, statusText: plain.statusText, credits: plain.credits });
    assert.ok(row.text === 'ACTIVE' && row.tone === 'bad', 'a MISSION COMPLETE title with outcome active reads ACTIVE: ' + row.text);
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
// Locally a missing or broken Ruby skips the real-ending tests, loudly. Under CI they run
// anyway and fail, so a pipeline without Ruby cannot pass without checking the real data.
const rubyBroken = ruby.status !== 0;
const skipRuby = rubyBroken && !process.env.CI ? 'ruby missing or broken: real ending data NOT checked' : false;
if (rubyBroken) console.warn(process.env.CI
    ? 'gate-engine-minors: Ruby is missing or broken under CI; the real-ending tests will FAIL.'
    : 'gate-engine-minors: Ruby is missing or broken, so the real m01/m03/m10 ending tests are SKIPPED (set CI=1 to make them fail).');
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

test('the validator rejects mistyped outcome and threatTone, and warns on FAILED wording with no outcome', { skip: skipRuby }, () => {
    const sc = (extra) => ({ scenario_brief: 'x', startRoom: 'r', rooms: { r: { type: 'room_office', connections: {} } },
        music: { events: [{ trigger: 'game_loaded', ...extra }] } });
    const run = (name, json) => {
        const f = join(tree, name + '.json');
        writeFileSync(f, JSON.stringify(json));
        const r = spawnSync('ruby', [join(root, 'scripts/validate_scenario.rb'), f], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, cwd: root });
        return (r.stdout || '') + (r.stderr || '');
    };
    const nudge = /sets no "outcome"/;
    assert.ok(nudge.test(run('warn', sc({ credits: [{ text: 'MISSION FAILED', style: 'title' }] }))), 'FAILED title with no outcome warns');
    assert.ok(nudge.test(run('warn2', sc({ credits: [{ text: 'END', style: 'title' }], statusText: 'COMPROMISED' }))), 'COMPROMISED status warns');
    assert.ok(!nudge.test(run('quiet', sc({ credits: [{ text: 'MISSION FAILED', style: 'title', outcome: 'active' }] }))), 'a line outcome silences it');
    assert.ok(!nudge.test(run('quiet2', sc({ credits: [{ text: 'MISSION FAILED', style: 'title' }], outcome: 'active' }))), 'an entry outcome silences it');
    assert.ok(/outcome "failed"/.test(run('badline', sc({ credits: [{ text: 'X', outcome: 'failed' }] }))), 'a mistyped line outcome is an error');
    assert.ok(/ERROR: '[^']*credits' has outcome/.test(run('case', sc({ credits: [{ section: 'S', outcome: 'Active', lines: [{ text: 'a' }] }] }))), 'outcome is lowercase-only, matching the entry enum');
    assert.ok(!/ERROR: '[^']*credits' has outcome/.test(run('ok', sc({ credits: [{ section: 'S', outcome: 'active', lines: [{ text: 'a' }] }] }))), 'lowercase outcome accepted');
    assert.ok(/outcome/.test(run('badentry', sc({ credits: [{ text: 'X' }], outcome: 'failed' }))), 'a mistyped entry outcome is rejected by the schema');
    assert.ok(/threatTone/.test(run('badtone', sc({ credits: [{ text: 'X' }], threatTone: 'purple' }))), 'a mistyped threatTone is rejected by the schema');
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
