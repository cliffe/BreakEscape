// scripts/validate_scenario.rb check_mission_result: mission.json "resultGlobal",
// "stage" and "endingCheck" (read by BreakEscape::Mission#result_global,
// #result_stage and #ending_check?).
// Run with: node --test test/js/validator-mission-result.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function issues(mission, scenario = null) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      input = JSON.parse(STDIN.read)
      puts JSON.generate(check_mission_result(input['mission'], input['scenario']))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify({ mission, scenario }), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

const declares = { globalVariables: { triage_pre_percent: 0, triage_pre_done: false, name: 'x' } };

test('a mission with none of the keys is fine', { skip }, () => {
    assert.deepEqual(issues({}), []);
    assert.deepEqual(issues({}, declares), []);
});

test('a declared numeric resultGlobal with a stage is fine', { skip }, () => {
    assert.deepEqual(issues({ resultGlobal: 'triage_pre_percent', stage: 'pre' }, declares), []);
    assert.deepEqual(issues({ resultGlobal: 'triage_pre_percent', stage: 'pre' }), []);
});

test('resultGlobal must be a plain *_percent name', { skip }, () => {
    for (const bad of ['triage pre percent', 'percent', 'triage_pre_done', 5, '', null]) {
        const out = issues({ resultGlobal: bad, stage: 'pre' });
        assert.equal(out.length, 1, JSON.stringify(bad));
        assert.match(out[0], /INVALID: mission\.json 'resultGlobal'/);
    }
});

test('resultGlobal must be declared in globalVariables, as a number', { skip }, () => {
    const missing = issues({ resultGlobal: 'triage_post_percent', stage: 'post' }, declares);
    assert.equal(missing.length, 1);
    assert.match(missing[0], /does not declare in globalVariables/);

    const notNumber = issues({ resultGlobal: 'triage_pre_percent', stage: 'pre' }, { globalVariables: { triage_pre_percent: 'high' } });
    assert.equal(notNumber.length, 1);
    assert.match(notNumber[0], /must be a number/);
});

test('stage must be pre, post or episode, and is wanted beside resultGlobal', { skip }, () => {
    const bad = issues({ resultGlobal: 'triage_pre_percent', stage: 'during' }, declares);
    assert.equal(bad.length, 1);
    assert.match(bad[0], /INVALID: mission\.json 'stage' is "during"/);

    const none = issues({ resultGlobal: 'triage_pre_percent' }, declares);
    assert.equal(none.length, 1);
    assert.match(none[0], /WARNING: mission\.json has 'resultGlobal' but no 'stage'/);
});

test('endingCheck must be a boolean', { skip }, () => {
    assert.deepEqual(issues({ endingCheck: false }), []);
    assert.deepEqual(issues({ endingCheck: true }), []);
    for (const bad of ['no', 0, null]) {
        const out = issues({ endingCheck: bad });
        assert.equal(out.length, 1, JSON.stringify(bad));
        assert.match(out[0], /INVALID: mission\.json 'endingCheck'/);
    }
});

// --- check_mission_ending_check: the route that cannot be intercepted after the fact -----------

function endingIssues(mission, scenario, inkFiles = {}) {
    const dir = mkdtempSync(join(tmpdir(), 'ending-check-validator-'));
    mkdirSync(join(dir, 'ink'));
    for (const [name, text] of Object.entries(inkFiles)) writeFileSync(join(dir, 'ink', name), text);
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      input = JSON.parse(STDIN.read)
      puts JSON.generate(check_mission_ending_check(input['mission'], input['scenario'], ${JSON.stringify(dir)}))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify({ mission, scenario }), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

const withOptional = { objectives: [
    { aimId: 'a', tasks: [{ taskId: 'x' }, { taskId: 'y', optional: true }] },
    { aimId: 'end', missionConclusion: true, tasks: [{ taskId: 'z' }] }] };
const noOptional = { objectives: [{ aimId: 'end', missionConclusion: true, tasks: [{ taskId: 'z' }] }] };
const noConclusion = { objectives: [{ aimId: 'a', tasks: [{ taskId: 'y', optional: true }] }] };

test('ending check: warns when optional tasks, a conclusion aim and neither route used', { skip }, () => {
    const out = endingIssues({}, withOptional, { 'x.ink': '+ [Debrief]\n  #set_global:start:true\n' });
    assert.equal(out.length, 1);
    assert.match(out[0], /WARNING: .* neither uses #ending_check .* nor carries "endingCheck": true/);
});

const withEndingCheckMapping = { objectives: withOptional.objectives, rooms: [
    { id: 'r', npcs: [{ id: 'hax', eventMappings: [
        { eventPattern: 'global_variable_changed:mission_complete', conversationMode: 'person-chat', endingCheck: true }] }] }] };

// A compiled .json carrying the tag ("^ending_check" is how inklecate stores a #ending_check tag).
const compiledWithTag = '{"inkVersion":21,"root":[["^A line.","#","^ending_check","/#","done",null],"done",null],"listDefs":{}}';
const compiledNoTag = '{"inkVersion":21,"root":[["^A line.","done",null],"done",null],"listDefs":{}}';

test('ending check: quiet with the tag in the compiled json, with an endingCheck mapping, the opt-out, or no optional/conclusion', { skip }, () => {
    assert.deepEqual(endingIssues({}, withOptional,
        { 'x.ink': '+ [Debrief]\n  #ending_check\n  #set_global:start:true\n', 'x.json': compiledWithTag }), []);
    assert.deepEqual(endingIssues({}, withEndingCheckMapping), []);
    assert.deepEqual(endingIssues({ endingCheck: false }, withOptional), []);
    assert.deepEqual(endingIssues({}, noOptional), []);
    assert.deepEqual(endingIssues({}, noConclusion), []);
});

test('ending check: a stale compile (tag in the ink, not in the sibling .json) is flagged, not accepted', { skip }, () => {
    // no compiled json at all
    const noJson = endingIssues({}, withOptional, { 'x.ink': '+ [Debrief]\n  #ending_check\n' });
    assert.equal(noJson.length, 1);
    assert.match(noJson[0], /stale compile/);
    assert.match(noJson[0], /x\.ink/);
    assert.doesNotMatch(noJson[0], /neither uses #ending_check/, 'the stale-compile message, not the generic one');

    // a compiled json that does not carry the tag
    const staleJson = endingIssues({}, withOptional,
        { 'x.ink': '+ [Debrief]\n  #ending_check\n', 'x.json': compiledNoTag });
    assert.equal(staleJson.length, 1);
    assert.match(staleJson[0], /stale compile/);
});

test('ending check: the tag is accepted on the compiled json even if the ink source is absent', { skip }, () => {
    // only the compiled json carries the tag (the live engine reads it); no .ink stale-check fires
    assert.deepEqual(endingIssues({}, withOptional, { 'x.json': compiledWithTag }), []);
});
