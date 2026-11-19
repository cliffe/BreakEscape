// m02: Val's "You were right" choice ticks tell_val_findings like "I said I'd tell you",
// and the two choices no longer both stay in the menu once she has been told.
// Run with: node --test test/js/m02-val-findings.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const inkjs = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));
const src = readFileSync(join(root, 'scenarios/m02_ransomed_trust/ink/m02_npc_security_guard.json'), 'utf8');

function run(knot, vars) {
    const s = new inkjs.Story(src);
    s.BindExternalFunction('player_name', () => 'Agent', false);
    for (const [k, v] of Object.entries(vars)) s.variablesState[k] = v;
    s.ChoosePathString(knot);
    const tags = [];
    while (s.canContinue) { s.Continue(); tags.push(...s.currentTags); }
    return { s, tags };
}

test('vindicated beat ticks tell_val_findings once cover is restored', () => {
    const { s, tags } = run('reeves_vindicated', { cover_restored: true, insider_identified: true, talked_about_reeves: true });
    assert.ok(tags.includes('complete_task:tell_val_findings'), 'task tag missing: ' + JSON.stringify(tags));
    assert.ok(s.variablesState['val_reported_back'] === true, 'val_reported_back not set');
});

test('vindicated beat leaves the locked task alone before cover is restored', () => {
    const { s, tags } = run('reeves_vindicated', { cover_restored: false, insider_identified: true, talked_about_reeves: true });
    assert.ok(!tags.includes('complete_task:tell_val_findings'), 'task ticked while locked');
    assert.ok(s.variablesState['val_reported_back'] === false, 'val_reported_back set early');
});

test('after the vindicated beat the report-back choice is gone from the hub', () => {
    const { s } = run('reeves_vindicated', { cover_restored: true, insider_identified: true, talked_about_reeves: true, backdoor_fully_exploited: true });
    s.ChooseChoiceIndex(0);
    while (s.canContinue) s.Continue();
    assert.ok(s.currentChoices.length > 3, 'hub not reached: ' + JSON.stringify(s.currentChoices.map((c) => c.text)));
    const labels = s.currentChoices.map((c) => c.text);
    assert.ok(!labels.some((t) => t.includes("I said I'd tell you")), 'report_back still offered: ' + JSON.stringify(labels));
});
