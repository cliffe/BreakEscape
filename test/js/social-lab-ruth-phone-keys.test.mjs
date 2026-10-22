// Lab Ruth phone hub: each stage's opener names the next key to collect from Ruth, so a
// student stuck at a locked door is pointed back to her (fix round F, F17). Also checks the
// stage-4 "Dev flagged that last call" line stops once the call has actually succeeded.
//
// Drives the compiled ruth_phone.json the way phone-chat does: set the globals, then
// ChoosePathString('start'), which routes the hub to the current stage and prints its opener.
//
// Run with: bundle exec node --test test/js/social-lab-ruth-phone-keys.test.mjs

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const inkPath = join(root, 'scenarios/lab_social_engineering/ink/ruth_phone.json');
const vendor = join(root, 'public/break_escape/assets/vendor/ink.js');
const skip = !existsSync(vendor) && 'vendored ink.js not found';
const require = createRequire(import.meta.url);
const inkjs = skip ? null : require(vendor);
const Story = inkjs && (inkjs.Story || inkjs.default?.Story);
const json = skip ? null : readFileSync(inkPath, 'utf8');

// Route the hub with these globals and return the text printed before the choices (the opener).
function opener(globals) {
    const s = new Story(json);
    for (const [k, v] of Object.entries(globals)) {
        if (s.variablesState.GlobalVariableExistsWithName(k)) s.variablesState[k] = v;
    }
    s.ChoosePathString('start');
    let text = '';
    while (s.canContinue) text += s.Continue();
    return text;
}

const base = {
    roe_signed: false, plan_done: false, osint_done: false, se_intel_username_convention: false,
    se_intel_email_pattern: false, se_intel_hampshire_cv_backlog: false, phish_hampshire_landed: false,
    phish_pierce_landed: false, acct_freemail: false, landing_payroll_login_built: false,
    pretext_call_done: false, pretext_call_reported: false, se_intel_lord_payslip_date: false,
    phish_lord_landed: false, report_filed: false, triage_pass: false, profile_done: false
};

test('stage 2 (Recon) opener points the student to Ruth for the key, not "you already have it"', { skip }, () => {
    const t = opener({ ...base, roe_signed: true, plan_done: true });
    assert.match(t, /key/i, 'names the key');
    assert.match(t, /come and see me|I've got the key/i, 'points back to Ruth');
    assert.doesNotMatch(t, /you've the key already/i, 'does not assume the key is held');
});

test('stage 3 (Operations) opener points the student to Ruth for the key', { skip }, () => {
    const t = opener({ ...base, roe_signed: true, plan_done: true, osint_done: true, se_intel_username_convention: true });
    assert.match(t, /key/i);
    assert.match(t, /come and see me|I've got the key/i, 'points back to Ruth');
});

test('stage 7 (Blue Team) opener names the key and Ruth', { skip }, () => {
    const t = opener({ ...base,
        roe_signed: true, plan_done: true, osint_done: true, se_intel_username_convention: true,
        phish_pierce_landed: true, landing_payroll_login_built: true, pretext_call_done: true,
        phish_lord_landed: true, report_filed: true });
    assert.match(t, /key/i, 'names the key');
    assert.match(t, /come and see me|I've got the key/i, 'points back to Ruth');
});

test('stage 4: the "Dev flagged" line shows while the call is still unmade, and stops once it succeeds', { skip }, () => {
    // Reported, call not yet successfully made (page not built): the flagged line shows.
    const stuck = opener({ ...base,
        roe_signed: true, plan_done: true, osint_done: true, se_intel_username_convention: true,
        phish_pierce_landed: true, pretext_call_reported: true, pretext_call_done: false,
        landing_payroll_login_built: false });
    assert.match(stuck, /flagged that last call/i, 'flagged line shows while the call is unmade');

    // A clean call-back succeeded (pretext_call_done) but the page is not built yet, so stage 4
    // is still current: the flagged line must be gone (R2 F6-c).
    const recovered = opener({ ...base,
        roe_signed: true, plan_done: true, osint_done: true, se_intel_username_convention: true,
        phish_pierce_landed: true, pretext_call_reported: true, pretext_call_done: true,
        landing_payroll_login_built: false });
    assert.doesNotMatch(recovered, /flagged that last call/i, 'flagged line clears after a clean second call');
});
