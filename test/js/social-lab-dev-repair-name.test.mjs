// Lab Dev service desk, repair_team naming (lab post-release M1, R2).
//
// A team-only Accounts player (holds old_org_chart, which provides team=accounts, but NOT
// lord_intern, the only intern-name source) takes the team-only opener, hears the "folded
// Accounts into Finance" line, then picks the candour repair "Sorry, my mistake. She's in
// Finance." Before the R2 fix Dev replied "Finance, right you are. New intern, that'll be
// Sofia then." — naming an intern the player never gave. The fix gates the Sofia half on
// pretext_intern_name != "" and falls to the already-voiced "Right, bear with me a sec."
// The judge's +20 and the on-screen "Corrected" tell are unchanged (person-chat-pretext),
// so the candour correction still lands; only Dev's spoken line changes.
//
// Drives the compiled dev_service_desk.json the way person-chat-pretext does: set the blank
// VARs the pretext card would have filled, ChoosePathString('start'), then walk the choices.
//
// Run with: node --test test/js/social-lab-dev-repair-name.test.mjs

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const inkPath = join(root, 'scenarios/lab_social_engineering/ink/dev_service_desk.json');
const vendor = join(root, 'public/break_escape/assets/vendor/ink.js');
const skip = !existsSync(vendor) && 'vendored ink.js not found';
const require = createRequire(import.meta.url);
const inkjs = skip ? null : require(vendor);
const Story = inkjs && (inkjs.Story || inkjs.default?.Story);
const json = skip ? null : readFileSync(inkPath, 'utf8');

// Build a story with the blanks the pretext card would have carried, and the real
// pretext_say / pretext_ask bound to a plain band-0 ("wary, not refusing") reply, which is
// what an un-judged dry run returns. band 0 routes straight to the said-specific branch.
function story(blanks) {
    const s = new Story(json);
    s.BindExternalFunction('pretext_say', () => 0);
    s.BindExternalFunction('pretext_ask', () => 0);
    for (const [k, v] of Object.entries(blanks)) {
        if (s.variablesState.GlobalVariableExistsWithName(k)) s.variablesState[k] = v;
    }
    return s;
}
function drain(s) {
    let t = '';
    while (s.canContinue) t += s.Continue();
    return t;
}
function pick(s, re) {
    const idx = s.currentChoices.findIndex((c) => re.test(c.text));
    assert.ok(idx >= 0, `expected a choice matching ${re}; saw: ${s.currentChoices.map((c) => c.text).join(' | ')}`);
    s.ChooseChoiceIndex(idx);
    return drain(s);
}

// Team-only Accounts player: team blank carried, intern blank empty.
const teamOnlyAccounts = {
    pretext_intern_name: '', pretext_intern_value: '',
    pretext_team_name: 'Accounts', pretext_team_value: 'accounts',
};
// Both facts, team still the stale Accounts value: intern blank carried too.
const bothAccounts = {
    pretext_intern_name: 'Sofia Lord', pretext_intern_value: 'sofia_lord',
    pretext_team_name: 'Accounts', pretext_team_value: 'accounts',
};

test('team-only Accounts repair: Dev does NOT name Sofia when the player never gave a name (R2 M1)', { skip }, () => {
    const s = story(teamOnlyAccounts);
    s.ChoosePathString('start');
    drain(s);
    // The team-only opener (no name) — then Dev's "folded Accounts into Finance" reply.
    const opener = pick(s, /helping a new starter in your Accounts team/);
    assert.match(opener, /folded Accounts into Finance/, 'Dev flags the stale team');
    // The candour repair.
    const repaired = pick(s, /my mistake\. She's in Finance/);
    assert.doesNotMatch(repaired, /Sofia/, 'Dev never supplies a name the player did not give');
    assert.match(repaired, /bear with me a sec/, 'falls to the already-voiced generic line');
});

test('control: with the intern name stated, the repair still names Sofia (fix stays narrow)', { skip }, () => {
    const s = story(bothAccounts);
    s.ChoosePathString('start');
    drain(s);
    // With both facts the opener states them both; team is still the stale Accounts value.
    pick(s, /helping Sofia Lord, your new starter in Accounts/);
    const repaired = pick(s, /my mistake\. She's in Finance/);
    assert.match(repaired, /Finance, right you are\. New intern, that'll be Sofia then/,
        'a player who stated the name still gets the full acknowledgement');
});
