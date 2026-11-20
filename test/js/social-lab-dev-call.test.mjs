// lab1 (fun-and-learning): the stale 2019 org chart makes the wrong-team opener reachable, and
// the candour repair is credited. R13 F1 showed the first version failed in the live game: the
// scenario is stored as jsonb, which reorders intelFacts keys by (length, then bytewise), so the
// live order has `lord_intern` (about "intern") before `pierce_role` (about "recipient"), and
// blankSlot() then tags Dev's team slot "intern" — filtering out a recipient-only Accounts value.
// These tests reproduce the jsonb order (not the ERB order) so they fail without the fix, and the
// fix is: old_org_chart provides "Accounts" under BOTH abouts, so the decoy survives either slot.
// Run with: node --test test/js/social-lab-dev-call.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-lab-dev-call-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['minigames/pretext-prep/pretext-card.js', 'minigames/mail-client/mail-composer.js',
    'systems/phish-rules.js', 'systems/pretext-judge.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}
const { optionsForFact, blankSlot } = await import(pathToFileURL(join(dir, 'minigames/pretext-prep/pretext-card.js')));
const { judgeUtterance } = await import(pathToFileURL(join(dir, 'systems/pretext-judge.js')));

// The live lab scenario (only <%# %> comment tags, so strip them and parse).
const erb = readFileSync(join(here, '../../scenarios/lab_social_engineering/scenario.json.erb'), 'utf8');
const scenario = JSON.parse(erb.replace(/<%#[\s\S]*?%>/g, ''));

// Postgres jsonb reorders object keys by length, then bytewise — this is the order the live game
// sees (not the ERB source order). Rebuild intelFacts that way so these tests exercise the live path.
function jsonbOrder(obj) {
    const keys = Object.keys(obj).sort((a, b) => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0));
    const out = {};
    for (const k of keys) out[k] = obj[k];
    return out;
}
const social = { ...scenario.social, intelFacts: jsonbOrder(scenario.social.intelFacts) };
const devSpec = social.pretextNpcs.find((c) => c.callId === 'service_desk_call');

const held = (...ids) => Object.fromEntries(ids.map((id) => [`se_intel_${id}`, true]));

test('the live jsonb order tags Dev\'s team slot "intern" (lord_intern wins over pierce_role)', () => {
    // This is the root cause R13 found: in the live key order the slot is "intern", not "recipient".
    assert.equal(Object.keys(social.intelFacts).indexOf('lord_intern') < Object.keys(social.intelFacts).indexOf('pierce_role'), true);
    const slot = blankSlot('team', devSpec, social.intelFacts);
    assert.equal(slot.about, 'intern', 'the live slot resolves to "intern", so a recipient-only Accounts value is filtered out');
});

test('the team blank offers only Finance when the stale org chart was not read', () => {
    const opts = optionsForFact('team', devSpec, social, held('pierce_role', 'lord_intern'));
    const values = opts.map((o) => o.value);
    assert.ok(values.includes('finance'), 'the live Finance value is offered');
    assert.ok(!values.includes('accounts'), 'no stale Accounts value without the org chart');
});

test('reading the stale 2019 org chart offers Accounts in Dev\'s team blank — in the LIVE jsonb order', () => {
    const opts = optionsForFact('team', devSpec, social, held('pierce_role', 'lord_intern', 'old_org_chart'));
    const values = opts.map((o) => o.value);
    assert.ok(values.includes('finance'), 'the right Finance option is still offered');
    assert.ok(values.includes('accounts'), 'the stale Accounts decoy is offered despite the "intern"-tagged slot');
    assert.equal(opts.find((o) => o.value === 'accounts').kind, 'stale');
});

test('control: a recipient-ONLY Accounts value (the R13 F1 bug) is filtered out in the live order', () => {
    // Prove the fix is load-bearing: strip the intern-tagged Accounts entry and the decoy vanishes.
    const broken = JSON.parse(JSON.stringify(social));
    broken.intelFacts.old_org_chart.provides = broken.intelFacts.old_org_chart.provides
        .filter((p) => !(p.type === 'team' && p.about === 'intern'));
    const opts = optionsForFact('team', devSpec, broken, held('pierce_role', 'lord_intern', 'old_org_chart'));
    assert.ok(!opts.map((o) => o.value).includes('accounts'), 'recipient-only Accounts does not survive the intern-tagged live slot');
});

test('repair_team is credited: the claim names the right team, so the mismatch closes for +20', () => {
    const session = { openMismatches: ['team'], refusals: 0, pendingVerification: [], verified: {}, provenFacts: ['intern'] };
    const r = judgeUtterance(devSpec, session, 'repair_team', {}, -20);
    assert.deepEqual(r.repairs, ['team'], 'the team mismatch is repaired');
    const total = r.entries.reduce((s, e) => s + e.delta, 0);
    assert.equal(total, 20, 'claim credit (+10) plus the candour modifier (+10)');
    assert.equal(r.influenceAfter, 0, 'influence climbs back from -20 to 0');
});
