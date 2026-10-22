// lab1 (fun-and-learning): the stale 2019 org chart makes the wrong-team opener reachable, and
// the candour repair is credited. Proves the two data edits in scenario.json.erb wire up:
//   - old_org_chart's team value is offered in Dev's team blank beside the live Finance, so a
//     student who read the stale chart can open with "Accounts";
//   - repair_team names the right team value, so pretext-judge credits the repair (claim + candour)
//     and clears the mismatch (a repair with no right-valued claim earns nothing since 5e0bf9934).
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
const { optionsForFact } = await import(pathToFileURL(join(dir, 'minigames/pretext-prep/pretext-card.js')));
const { judgeUtterance } = await import(pathToFileURL(join(dir, 'systems/pretext-judge.js')));

// The live lab scenario (only <%# %> comment tags, so strip them and parse).
const erb = readFileSync(join(here, '../../scenarios/lab_social_engineering/scenario.json.erb'), 'utf8');
const scenario = JSON.parse(erb.replace(/<%#[\s\S]*?%>/g, ''));
const social = scenario.social;
const devSpec = social.pretextNpcs.find((c) => c.callId === 'service_desk_call');

const held = (...ids) => {
    const g = {};
    for (const id of ids) g[`se_intel_${id}`] = true;
    return g;
};

test('the team blank offers only Finance when the stale org chart was not read', () => {
    const opts = optionsForFact('team', devSpec, social, held('pierce_role', 'lord_intern'));
    const values = opts.map((o) => o.value);
    assert.ok(values.includes('finance'), 'the live Finance value is offered');
    assert.ok(!values.includes('accounts'), 'no stale Accounts value without the org chart');
});

test('reading the stale 2019 org chart adds Accounts as a wrong-team decoy in Dev\'s team blank', () => {
    const opts = optionsForFact('team', devSpec, social, held('pierce_role', 'lord_intern', 'old_org_chart'));
    const values = opts.map((o) => o.value);
    assert.ok(values.includes('finance'), 'the right Finance option is still offered');
    assert.ok(values.includes('accounts'), 'the stale Accounts option is now offered (the temptation)');
    const accounts = opts.find((o) => o.value === 'accounts');
    assert.equal(accounts.kind, 'stale', 'the Accounts option is marked as an older detail');
});

test('repair_team is credited: the claim names the right team, so the mismatch closes for +20', () => {
    const session = { openMismatches: ['team'], refusals: 0, pendingVerification: [], verified: {}, provenFacts: ['intern'] };
    const r = judgeUtterance(devSpec, session, 'repair_team', {}, -20);
    assert.deepEqual(r.repairs, ['team'], 'the team mismatch is repaired');
    const total = r.entries.reduce((s, e) => s + e.delta, 0);
    assert.equal(total, 20, 'claim credit (+10) plus the candour modifier (+10)');
    assert.equal(r.influenceAfter, 0, 'influence climbs back from -20 to 0');
});
