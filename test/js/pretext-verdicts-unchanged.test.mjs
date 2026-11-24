// Ops core plan (docs/achitechture/OPS_CORE_PLAN.md) section 10, part 5: the pretext verdicts must not
// change. It runs systems/pretext-judge.js over every line and ask of every pretext call in the six
// scenarios that write a pretext block (core plan section 4.3: ca03_helpdesk_reset,
// ca12_visitor_tailgater, lab_social_engineering, test_dm_social, test_social_m5_channels,
// test_social_slice) and compares the verdict and reason keys with
// test/js/fixtures/ops_unchanged/pretext_verdicts.json, recorded on main before any ops-core edit.
//
// What the fixture holds: for each call, the merged spec the judge reads (the call plus its character's
// thresholds and influence, as person-chat-pretext.js mergeSpec builds it) copied from the scenario at
// record time, and one row per case: each line with every blank filled right, with an accepted
// alternative, wrong, or left empty; a fresh session, one with every fact an open mismatch, one with
// every verification fact pending; at the character's start influence and at 0. Each ask at a spread of
// influences, fresh, already verified, and with its facts proven. A row is the band, the report flag
// and reason, the lock flag, the resulting influence, and each entry as reason:delta (the authored tell
// prose is not recorded, so a wording edit does not matter). Because the specs are inside the fixture, an
// edit to a scenario's pretext lines does not break this test; only a change to pretext-judge.js
// does. (Part 2's validator lines for the same six scenarios show a scenario-side change.)
//
// RE-RECORDING (only when pretext-judge.js is changed on purpose, e.g. by the MFA plan, or a pretext line
// is added or edited and should join the snapshot; never from a tree whose judge edit it would hide):
//   OPS_UNCHANGED_RECORD=1 node test/js/pretext-verdicts-unchanged.test.mjs
// It reads the scenarios through ruby (ScenarioBinding) and rewrites the fixture.
//
// Run with: PATH=<node 22>:$PATH bin/test-js test/js/pretext-verdicts-unchanged.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURE = join(root, 'test/js/fixtures/ops_unchanged/pretext_verdicts.json');
const SCENARIOS = ['ca03_helpdesk_reset', 'ca12_visitor_tailgater', 'lab_social_engineering', 'test_dm_social',
    'test_social_m5_channels', 'test_social_slice'];

const tmp = mkdtempSync(join(tmpdir(), 'pretext-verdicts-'));
writeFileSync(join(tmp, 'pretext-judge.mjs'), readFileSync(join(root, 'public/break_escape/js/systems/pretext-judge.js'), 'utf8'));
const { judgeUtterance, judgeAsk } = await import(pathToFileURL(join(tmp, 'pretext-judge.mjs')).href);

const WRONG = '__wrong_value__';
const arr = v => (Array.isArray(v) ? v : []);

// The blank names of a line and the fact each fills (the claim whose `from` is blank:<name>).
function blanksOf(spec, line) {
    const out = {};
    for (const claim of arr(line.claims)) {
        if (typeof claim.from === 'string' && claim.from.startsWith('blank:')) {
            const name = claim.from.slice('blank:'.length);
            if (!(name in out)) out[name] = claim.fact;
        }
    }
    return out;
}

// Every way to fill the blanks: right, an accepted alternative, wrong, or empty (key absent).
function blankCombos(spec, line) {
    const names = Object.entries(blanksOf(spec, line));
    let combos = [{}];
    for (const [name, fact] of names) {
        const known = spec.knows && spec.knows[fact];
        const options = [['right', known ? known.value : WRONG]];
        if (known && arr(known.accept).length) options.push(['accept', known.accept[0]]);
        options.push(['wrong', WRONG], ['empty', undefined]);
        combos = combos.flatMap(c => options.map(([tag, value]) => {
            const next = { ...c, tags: [...(c.tags || []), `${name}=${tag}`] };
            if (value !== undefined) next.blanks = { ...(c.blanks || {}), [name]: value };
            return next;
        }));
    }
    return combos.map(c => ({ blanks: c.blanks || {}, tag: (c.tags || []).join(',') || 'fixed' }));
}

const entriesText = r => r.entries.map(e => `${e.reason}:${e.delta}`).join(' ');

function sessionsFor(spec) {
    const facts = Object.keys(spec.knows || {});
    const verification = [...new Set(Object.values(spec.asks || {}).flatMap(a => arr(a.verification)))];
    return [
        ['fresh', {}],
        ['open_all', { openMismatches: facts }],
        ['pending_all', { pendingVerification: verification }]
    ];
}

function rowsFor(spec) {
    const rows = {};
    const start = spec.influence && typeof spec.influence.start === 'number' ? spec.influence.start : 0;
    const influences = [...new Set([start, 0])];
    for (const [lineId, line] of Object.entries(spec.lines || {})) {
        for (const [sessionTag, extra] of sessionsFor(spec)) {
            for (const { blanks, tag } of blankCombos(spec, line)) {
                for (const influence of influences) {
                    const session = { openMismatches: [], refusals: 0, pendingVerification: [], verified: {}, ...extra };
                    const r = judgeUtterance(spec, session, lineId, blanks, influence);
                    rows[`line ${lineId} | ${sessionTag} | ${tag} | at ${influence}`] =
                        `band ${r.band} | reported ${r.reported} ${r.reportReason} | locked ${r.locked} | after ${r.influenceAfter} | ${entriesText(r)}` +
                        ` | opens ${r.opens.join(',')} | repairs ${r.repairs.join(',')} | cleared ${r.verificationCleared.join(',')}`;
                }
            }
        }
    }
    const min = spec.influence && typeof spec.influence.min === 'number' ? spec.influence.min : -100;
    const max = spec.influence && typeof spec.influence.max === 'number' ? spec.influence.max : 100;
    for (const [askId, ask] of Object.entries(spec.asks || {})) {
        const facts = arr(ask.verification);
        const sessions = [['fresh', {}], ['verified', { verified: { [askId]: true } }], ['facts_proven', { provenFacts: facts }],
            ['one_refusal_short', { refusals: (spec.tuning && spec.tuning.maxRefusals ? spec.tuning.maxRefusals : 2) - 1 }]];
        for (const [sessionTag, extra] of sessions) {
            for (const influence of [...new Set([min, start, 0, max])]) {
                const session = { openMismatches: [], refusals: 0, pendingVerification: [], verified: {}, ...extra };
                const r = judgeAsk(spec, session, askId, influence);
                rows[`ask ${askId} | ${sessionTag} | at ${influence}`] =
                    `${r.result} ${r.inkResult} | band ${r.band} | reported ${r.reported} ${r.reportReason} | after ${r.influenceAfter}` +
                    ` | floor ${r.floorUsed} | verification ${r.verificationNeeded} | ${entriesText(r)}`;
            }
        }
    }
    return rows;
}

// ---- record mode: read the six scenarios through ruby and rewrite the fixture ----
if (process.env.OPS_UNCHANGED_RECORD === '1') {
    const script = `require 'json'
      $LOAD_PATH.unshift ${JSON.stringify(join(root, 'lib'))}
      require ${JSON.stringify(join(root, 'lib/break_escape/scenario_binding'))}
      out = {}
      ${JSON.stringify(SCENARIOS)}.each do |name|
        s = JSON.parse(BreakEscape::ScenarioBinding.render(File.read(File.join(${JSON.stringify(join(root, 'scenarios'))}, name, 'scenario.json.erb'), encoding: 'UTF-8')))
        social = s['social'] || {}
        out[name] = Array(social['pretextNpcs']).to_h do |call|
          char = (social['characters'] || {})[call['character']] || {}
          inf = char['influence'] || {}
          spec = call.merge('thresholds' => char['thresholds'] || [],
                            'influence' => { 'min' => inf['min'], 'max' => inf['max'], 'start' => inf['start'], 'rearmMargin' => inf['rearmMargin'] }.compact)
          [call['callId'], spec]
        end
      end
      puts JSON.generate(out)`;
    const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }, maxBuffer: 64 * 1024 * 1024 });
    assert.equal(r.status, 0, r.stderr);
    const specs = JSON.parse(r.stdout.trim().split('\n').pop());
    const out = {
        description: 'Merged pretext call specs and the pretext-judge.js verdict rows over them, recorded before any ops-core edit. Re-record only as test/js/pretext-verdicts-unchanged.test.mjs says.',
        scenarios: {}
    };
    for (const name of SCENARIOS) {
        out.scenarios[name] = {};
        for (const [callId, spec] of Object.entries(specs[name])) out.scenarios[name][callId] = { spec, rows: rowsFor(spec) };
    }
    writeFileSync(FIXTURE, `${JSON.stringify(out, null, 1)}\n`);
    console.log(`recorded ${SCENARIOS.length} scenarios to ${FIXTURE}`);
}

const fixture = existsSync(FIXTURE) ? JSON.parse(readFileSync(FIXTURE, 'utf8')) : { scenarios: {} };

test('the fixture holds the six pretext scenarios of core plan 4.3 and at least one call each', () => {
    assert.deepEqual(Object.keys(fixture.scenarios).sort(), [...SCENARIOS].sort());
    for (const name of SCENARIOS) assert.ok(Object.keys(fixture.scenarios[name]).length > 0, `${name} has no recorded call`);
});

for (const name of SCENARIOS) {
    for (const [callId, recorded] of Object.entries(fixture.scenarios[name] || {})) {
        test(`${name} / ${callId}: pretext-judge verdicts are unchanged`, () => {
            const now = rowsFor(recorded.spec);
            const keys = new Set([...Object.keys(recorded.rows), ...Object.keys(now)]);
            const diffs = [];
            for (const key of keys) {
                if (recorded.rows[key] !== now[key]) diffs.push(`${key}\n   recorded: ${recorded.rows[key]}\n   now:      ${now[key]}`);
            }
            assert.ok(Object.keys(recorded.rows).length > 0, 'no rows recorded');
            assert.equal(diffs.length, 0, `${diffs.length} verdict row(s) changed (pretext-judge.js behaviour changed; do not re-record to silence it). First:\n${diffs.slice(0, 5).join('\n')}`);
        });
    }
}
