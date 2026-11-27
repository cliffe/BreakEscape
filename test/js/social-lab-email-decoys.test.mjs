// lab5 (fun-and-learning): each email picker surfaces a live wrong option, on the model of
// Sofia's Xero trap — a held, plausible, wrong fact the student must reason past at compose time.
// Confirms, from the live scenario, that the decoys are reliably present on the normal route:
//   - Lord's portal blank offers Xero (wrong, the finance tool) beside LedgerPay (right);
//   - Pierce's document blank offers the CV (wrong) beside the Q3 balance sheet (right);
//   - Hampshire's pretext picker offers the enquiry wording (wrong for a careers inbox) beside apply.
// The CV, Xero and apply/enquiry facts are all held by compose time via ordinary recon (readiness).
// Run with: node --test test/js/social-lab-email-decoys.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-lab-email-decoys-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['minigames/mail-client/mail-composer.js', 'systems/phish-rules.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}
const { optionsForSlot, heldProvides, heldFactIds } =
    await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-composer.js')));

const erb = readFileSync(join(here, '../../scenarios/lab_social_engineering/scenario.json.erb'), 'utf8');
const scenario = JSON.parse(erb.replace(/<%#[\s\S]*?%>/g, ''));
const social = scenario.social;
const held = (...ids) => Object.fromEntries(ids.map((id) => [`se_intel_${id}`, true]));

function offered(slot, ...factIds) {
    const entries = heldProvides(heldFactIds(social.intelFacts, held(...factIds)), social.intelFacts);
    return optionsForSlot(slot, { entries, people: social.people }).map((o) => o.value);
}

test('Lord: the portal blank offers Xero (wrong) beside LedgerPay (right)', () => {
    const values = offered({ type: 'portal', about: null }, 'tech_stack', 'lord_portal_name');
    assert.ok(values.includes('xero'), 'the finance tool Xero is a live wrong option');
    assert.ok(values.includes('staff_portal_name'), 'the real portal name is offered');
});

test('Pierce: the document blank offers the CV (wrong) beside the balance sheet (right)', () => {
    const values = offered({ type: 'document', about: null }, 'careers_attachment', 'pierce_expects_balance_sheet');
    assert.ok(values.includes('cv'), 'the CV (a held but wrong file) is a live wrong option');
    assert.ok(values.includes('balance_sheet'), 'the Q3 balance sheet is offered');
});

test('Hampshire: the pretext picker offers the enquiry wording beside the application', () => {
    const hampshire = social.phishTargets.find((t) => t.id === 'hampshire');
    const pretexts = hampshire.templateSets.pretext;
    assert.ok(pretexts.includes('pretext_apply'), 'the right wording (apply) is offered');
    assert.ok(pretexts.includes('pretext_enquiry'), 'the wrong wording (enquiry to a careers inbox) is a live option');
    assert.ok(pretexts.length >= 2, 'the pretext is a real choice, not a single tile');
});
