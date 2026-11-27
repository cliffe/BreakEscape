// Cyber Aware regate content fixes (blind persona playtests). Text-level checks on the shells.
// Run with: node --test test/js/ca-regate-content.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const erb = (n) => readFileSync(join(root, 'scenarios', n, 'scenario.json.erb'), 'utf8');

test('ca11: only data-rights, disputes, complaints and breaches go to the DPO; contact updates are ordinary work', () => {
  for (const n of ['ca11_misdirected_data', 'ca11_misdirected_data_defend']) {
    const t = erb(n);
    assert.ok(!/see, correct or delete/.test(t), `${n}: still says correct goes to the DPO`);
    assert.match(t, /routine update, (such as|like) a new contact number, is ordinary work/);
    assert.match(t, /Correcting a contact detail on a claim is ordinary work/);
  }
});

test('ca11: teamLine has no fixed bracket about a deleted item', () => {
  for (const n of ['ca11_misdirected_data', 'ca11_misdirected_data_defend']) {
    const t = erb(n);
    assert.ok(!/one you deleted counts/.test(t), n);
    const m = t.match(/"teamLine": "([^"]*)"/);
    assert.ok(m && m[1].includes('{n}'), n);
  }
});

test('ca10: the supplier is Fernside everywhere, no Hatherby', () => {
  assert.ok(!/Hatherby/.test(erb('ca10_downloads_and_fake_checks')));
  const kit = readFileSync(join(root, 'planning_notes/phishing_and_social_engineering/awareness/office_kits/quayholt_insurance.json'), 'utf8');
  assert.ok(!/Hatherby/.test(kit));
});

test('ca02: the careers page lists the HGV driver role the genuine application names', () => {
  const t = erb('ca02_cv_lures');
  assert.match(t, /"id": "blk_vacancy_driver"/);
  assert.match(t, /Also hiring: HGV driver \(Class 1\)/);
  assert.match(t, /the Class 1 driver job on your website/);
});

test('ca13: the "your brief" debrief names the contact list the brief asked for, not a payment', () => {
  const t = erb('ca13_ai_assistant');
  assert.ok(!/small payment banked/.test(t));
  assert.ok(!/small invoice is paid/.test(t));
  assert.match(t, /the brief you handed the assistant is Brightwell's site contact list/);
});

test('ca18: the brief asks for the staff list and address pattern; the debrief and flip follow whether the spray ran', () => {
  const t = erb('ca18_credential_attacks_at_scale');
  assert.ok(!/not individual staff/.test(t), 'brief still steers away from the staff pins');
  assert.match(t, /The team list and the address pattern are what the spray needs/);
  assert.match(t, /"sprayedGlobal": "guess_e18_sprayed"/);
  assert.match(t, /"guess_e18_sprayed": false/);
  assert.match(t, /"flipGuessIntroNoSpray": "The spray needs both the staff names/);
  assert.match(t, /"flipDefenderLineNoSpray"/);
  // the "you built and sprayed" claim sits only under the sprayed condition
  const panels = [...t.matchAll(/\{\s*"heading": "([^"]+)",\s*"text": "((?:[^"\\]|\\.)*)"(?:,\s*"condition": "([^"]*)")?/g)];
  const claim = panels.filter((m) => /you built and sprayed/.test(m[2]));
  assert.equal(claim.length, 1);
  assert.equal(claim[0][3], 'globalVars.guess_e18_sprayed');
  const noSpray = panels.find((m) => m[1] === 'What a spray would have needed');
  assert.equal(noSpray[3], 'globalVars.guess_e18_landed && !globalVars.guess_e18_sprayed');
  assert.match(noSpray[2], /needs both the staff names and the address pattern, and you did not note both, so it never ran/);
  assert.equal(panels.find((m) => m[1] === 'What the campaign would have needed')[3], '!globalVars.guess_e18_landed');
  assert.ok(!/sprayed and stuffed from its public pages/.test(t));
});

test('ca18: the no-spray text is true for names-only and pattern-only runs (it names both halves, never "no staff list")', () => {
  const t = erb('ca18_credential_attacks_at_scale');
  assert.ok(!/You built no staff list/.test(t), 'claims no staff list although the names may be pinned');
  for (const key of ['flipGuessIntroNoSpray', 'flipDefenderLineNoSpray']) {
    const m = t.match(new RegExp('"' + key + '": "((?:[^"\\\\]|\\\\.)*)"'));
    assert.ok(m, key);
    assert.match(m[1], /both the staff names and the address pattern/, key);
  }
  assert.ok(!/morning's spray/.test(t), 'the morning attack wording must hold on the no-spray path');
});

test('ca07: the debrief tells one payment story, and the opening card makes no claim about a released payment', () => {
  const t = erb('ca07_voice_ceo');
  const panels = [...t.matchAll(/"heading": "(When the voice wins|Ringing back|What the call bought)",\s*"text": "((?:[^"\\]|\\.)*)"(?:,\s*"condition": "([^"]*)")?/g)];
  assert.equal(panels.length, 3);
  const opening = panels.find((m) => m[1] === 'When the voice wins')[2];
  assert.ok(!/The payment released here/.test(opening));
  assert.ok(!/18,400/.test(opening), 'the Leeds deposit is the attacker-side pretext, not a second debrief payment');
  assert.match(opening, /can be moved on before anyone looks/);
  // the Ashcarr payment appears once as paid (pay or silent) and once as never leaving (ringback)
  assert.match(panels.find((m) => m[1] === 'What the call bought')[3], /pay.*silent/);
  assert.equal(panels.find((m) => m[1] === 'Ringing back')[3], "globalVars.kit_ca07_call_choice === 'ringback'");
  assert.match(panels.find((m) => m[1] === 'Ringing back')[2], /a payment that never left/);
});

test('ca07: the "When the voice wins" card points at no card that may not show, and the call is the call-taker\'s (no ambient name in an unconditioned card)', () => {
  const t = erb('ca07_voice_ceo');
  assert.ok(!/is in the next card/.test(t), 'a pointer to a conditional card');
  assert.ok(!/in your own seat/.test(t.match(/"heading": "When the voice wins"[\s\S]*?"condition"/)[0]));
  assert.match(t, /Whether the payment left depended on the person who took the call/);
});

test('ca11: teamLine has a comma after "alone"; only see/correct/delete are called legal rights, a dispute or complaint goes to the DPO too', () => {
  for (const n of ['ca11_misdirected_data', 'ca11_misdirected_data_defend']) {
    const t = erb(n);
    assert.match(t, /rather than handling them alone, you got/, n);
    assert.match(t, /A request to see or delete the personal data held about someone is a legal right with a deadline/, n);
    assert.match(t, /A dispute about whether the data is right, or a complaint about how it was used, goes to the DPO too/, n);
    assert.ok(!/a complaint about how it was used, is a legal right/.test(t), n);
  }
});

test('ca11: the choice-2 verdict agrees with the inbox breach and the debrief, for both picks', () => {
  const t = erb('ca11_misdirected_data');
  const safe = t.match(/"check_then_send": "([^"]*)"/)[1];
  const unsafe = t.match(/"send_wrong_sam": "([^"]*)"/)[1];
  const panel = t.match(/"conceptPanel": \{[^}]*?"text": "([^"]*)"/)[1];
  // Safe pick: the learner's sheet stayed in; the inbox sheet is named as someone else's send.
  assert.match(safe, /your sheet stayed inside/);
  assert.match(safe, /different send, by someone else/);
  // Unsafe pick: no "three days unnoticed" claim, since the inbox has Sam writing in at once.
  assert.ok(!/three days/.test(unsafe), 'unsafe line still says three days');
  assert.match(unsafe, /today's inbox/);
  // Debrief does not say details never leave, against the inbox breach.
  assert.ok(!/never leave the building/.test(panel), 'debrief still says details never leave');
  assert.match(panel, /slips out anyway/);
  // The inbox item and Yusuf still treat the sheet as already sent outside.
  assert.match(t, /"id": "e11_wrong_sam_breach"/);
  const ink = readFileSync(join(root, 'scenarios/_office_kit/ink/yusuf_demir_ambient.ink'), 'utf8');
  assert.match(ink, /had already gone outside Carrholme/);
});

test('ca07 D287: the brief before the calls says caller ID can be faked, and voicemail 1 feedback says a matching number is not proof', () => {
  for (const n of ['ca07_voice_ceo', 'ca07_voice_ceo_defend']) {
    const t = erb(n);
    assert.match(t, /Nobody will ask whether a voice sounded real: what counts is what each message asks you to do\. Caller ID can be faked, so the number on the screen alone doesn't prove who is calling\./, n);
    assert.match(t, /"default": "The number matched, but that alone doesn't prove it\. It asks you to do nothing/, n);
  }
  const frag = readFileSync(join(root, 'planning_notes/phishing_and_social_engineering/awareness/e7/defend.json'), 'utf8');
  assert.match(frag, /Caller ID can be faked/);
  assert.match(frag, /The number matched, but that alone doesn't prove it\./);
});

test('ca10 D286: the shell has a debrief line per host and the schema knows the key', () => {
  const t = erb('ca10_downloads_and_fake_checks');
  const b = t.match(/"debriefHostLineByHost": \{([^}]*)\}/)[1];
  for (const h of ['genuine', 'lookalike', 'unrelated']) assert.match(b, new RegExp('"' + h + '": "'));
  assert.match(readFileSync(join(root, 'scripts/scenario-schema.json'), 'utf8'), /"debriefHostLineByHost"/);
});
