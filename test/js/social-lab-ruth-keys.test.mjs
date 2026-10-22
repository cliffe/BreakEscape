// Lab Ruth key hand-over across hub reopens (lab fix round L, B1).
//
// The engine resumes a reopened person-chat at the knot that held the last choices,
// which for Ruth is `hub`. The fix runs the key hand-over (and the backup task
// recheck) as tunnels at the top of `hub`, so a reopen that lands at `hub` still
// gives any key now due. This drives the compiled ruth.json the way the loader does
// (ChoosePathString to the choice knot on each reopen) and asserts each of the three
// keys is handed over exactly once and never re-given after a reload.
//
// Run with: bundle exec node --test test/js/social-lab-ruth-keys.test.mjs

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const inkPath = join(root, 'scenarios/lab_social_engineering/ink/ruth.json');
const vendor = join(root, 'public/break_escape/assets/vendor/ink.js');
const skip = !existsSync(vendor) && 'vendored ink.js not found';
const require = createRequire(import.meta.url);
const inkjs = skip ? null : require(vendor);
const Story = inkjs && (inkjs.Story || inkjs.default?.Story);
const json = skip ? null : readFileSync(inkPath, 'utf8');

// Continue to the next rest point, collecting the give_item tags seen on the way.
function drain(story) {
    const tags = [];
    while (story.canContinue) {
        story.Continue();
        for (const t of story.currentTags) tags.push(t);
    }
    return tags.filter((t) => t.startsWith('give_item'));
}

// A reopen the way person-chat-minigame.js does it: restore the saved state, sync the
// current globals, then ChoosePathString the knot that owns the current choices (hub).
function reopen(saved, globalsToSet) {
    const s = new Story(json);
    s.state.LoadJson(saved);
    for (const [k, v] of Object.entries(globalsToSet)) {
        if (s.variablesState.GlobalVariableExistsWithName(k)) s.variablesState[k] = v;
    }
    const first = s.currentChoices[0];
    const src = first && (first.sourcePath || (first._sourcePath && first._sourcePath.toString()));
    const knot = src ? src.split('.')[0] : 'hub';
    s.ChoosePathString(knot);
    const gives = drain(s);
    return { gives, saved: s.state.ToJson() };
}

test('Ruth hands over each key once on a hub reopen and never re-gives it after a reload', { skip }, () => {
    // Fresh open: play the briefing through to the hub. No key is due yet.
    const s = new Story(json);
    s.ChoosePathString('start');
    const opening = drain(s);
    assert.deepEqual(opening, [], 'no key before the plan is done');
    let saved = s.state.ToJson();

    // plan_done -> the Recon key is handed over on the next open, exactly once.
    const plan = { roe_signed: true, roe_scope_done: true, roe_stoprule_done: true,
        plan_objective_done: true, plan_measures_done: true, plan_done: true };
    let r = reopen(saved, plan);
    assert.deepEqual(r.gives, ['give_item:key:recon_key'], 'Recon key given on the hub reopen');
    saved = r.saved;

    // Reopen again with the same globals: the once-flag means it is not re-given.
    r = reopen(saved, plan);
    assert.deepEqual(r.gives, [], 'Recon key not handed over a second time');
    saved = r.saved;

    // osint_done + username convention -> the Operations key, once.
    const ops = { ...plan, osint_done: true, se_intel_username_convention: true };
    r = reopen(saved, ops);
    assert.deepEqual(r.gives, ['give_item:key:operations_key'], 'Operations key given');
    saved = r.saved;
    r = reopen(saved, ops);
    assert.deepEqual(r.gives, [], 'Operations key not re-given');
    saved = r.saved;

    // report_filed -> the Blue Team key, once.
    const blue = { ...ops, report_filed: true };
    r = reopen(saved, blue);
    assert.deepEqual(r.gives, ['give_item:key:blue_team_key'], 'Blue Team key given');
    saved = r.saved;
    r = reopen(saved, blue);
    assert.deepEqual(r.gives, [], 'Blue Team key not re-given');
});

test('stop_rule completes only once Gareth has signed, not when the sheet alone is done (R6 F5)', { skip }, () => {
    // Get past the opening briefing to the hub once, then reuse that saved state.
    const s = new Story(json);
    s.ChoosePathString('start');
    while (s.canContinue) s.Continue();          // briefing, stops on Gareth's question
    if (s.currentChoices.length) s.ChooseChoiceIndex(0);
    while (s.canContinue) s.Continue();          // brief_close -> hub
    const atHub = s.state.ToJson();

    const stopRuleCompletes = (globalsToSet) => {
        const g = new Story(json);
        g.state.LoadJson(atHub);
        for (const [k, v] of Object.entries(globalsToSet)) {
            if (g.variablesState.GlobalVariableExistsWithName(k)) g.variablesState[k] = v;
        }
        g.ChoosePathString('hub');               // re-runs the recheck tunnel
        const tags = [];
        while (g.canContinue) { g.Continue(); for (const t of g.currentTags) tags.push(t); }
        return tags.includes('complete_task:stop_rule');
    };

    // Sheet finished (both steps answered) but Gareth has not signed: stop_rule stays open,
    // so the authorise aim does not complete and the sign scene cannot be skipped.
    assert.equal(stopRuleCompletes({ roe_signed: true, roe_scope_done: true, roe_stoprule_done: true }), false,
        'stop_rule stays open until the signature');
    // Gareth signs (fairbairn_condition_heard): stop_rule completes.
    assert.equal(stopRuleCompletes({ roe_signed: true, roe_scope_done: true, roe_stoprule_done: true, fairbairn_condition_heard: true }), true,
        'stop_rule completes on the signature');
});
