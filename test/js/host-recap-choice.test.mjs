// Host recap praise keys on the recorded choice, not on `not moved` (ca10 live proof M1, 21 Nov 2026).
// A reload with the colleague's knot open leaves the choice "asked"/"silent" and `moved` false; the host must
// not praise a right answer the player never gave. Runs the real compiled ink through inkjs.
// Run with: node --test test/js/host-recap-choice.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const { Story } = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));

// ep, ink path, choice global, right value, wrong value, praise text (caught), not-caught text
const HOSTS = [
  ['ca10', 'ca10_downloads_and_fake_checks/ink/niamh_doherty.json', 'kit_ca10_check_choice', 'close', 'paste', 'You closed that page instead', 'Follow a page like that'],
  ['ca07', 'ca07_voice_ceo/ink/agnieszka_duda.json', 'kit_ca07_call_choice', 'ringback', 'pay', "You didn't release that payment", 'When a payment goes out on a voice alone'],
  ['ca18', 'ca18_credential_attacks_at_scale/ink/ama_owusu.json', 'kit_ca18_reset_choice', 'words', 'save', 'You read the page before you signed in', 'The alert looked like us', 'You stopped the one that mattered'],
  ['ca05', 'ca05_signin_pages/ink/niamh_doherty.json', 'kit_ca05_prompt_choice', 'stop', 'approve', "You read the address and didn't type", 'Your password went into the copy'],
  ['ca13', 'ca13_ai_assistant/ink/gwen_pritchard.json', 'kit_ca13_send_choice', 'ring', 'send', 'You stopped the request that rode', 'The assistant sounded certain'],
  ['ca14', 'ca14_social_media/ink/julian_sallow.json', 'kit_ca14_photo_choice', 'crop', 'post', 'You checked the new contact', 'It knew real details'],
  ['ca02', 'ca02_cv_lures/ink/fatima_begum.json', 'kit_ca02_cv_choice', 'report', 'enable', 'You spotted the one that wanted', 'A CV that wants content switched on'],
];

function recap(file, vars) {
  const s = new Story(readFileSync(join(root, 'scenarios', file), 'utf8').replace(/^﻿/, ''));
  s.variablesState['kit_defend_done'] = true;
  for (const [k, v] of Object.entries(vars)) s.variablesState[k] = v;
  s.ChoosePathString('start');
  let t = '';
  while (s.canContinue) t += s.Continue();
  return t;
}

// praiseOut: the praise line when the room ran (out true); defaults to praise
for (const [ep, file, choiceVar, right, wrong, praise, notCaught, praiseOut = praise] of HOSTS) {
  const base = { [`kit_${ep}_out`]: true, [`kit_${ep}_done`]: true };
  test(`${ep} host: right answer recorded, key caught -> caught praise`, () => {
    for (const caught of [true, false]) {
      const t = recap(file, { ...base, kit_key_caught: true, kit_caught: caught, [choiceVar]: right });
      if (caught) assert.ok(t.includes(praiseOut), `${ep}: praise missing: ${t}`);
      assert.ok(!t.includes(notCaught), `${ep}: not-caught text on a right answer: ${t}`);
    }
  });
  test(`${ep} host: no knot ran (choice empty), key caught -> caught praise stays`, () => {
    const t = recap(file, { [`kit_${ep}_out`]: false, kit_key_caught: true, kit_caught: true, [choiceVar]: '' });
    assert.ok(t.includes(praise), `${ep}: praise missing: ${t}`);
  });
  for (const stuck of ['asked', 'silent']) {
    test(`${ep} host: reload leaves choice "${stuck}", moved false -> no praise of the right answer`, () => {
      const t = recap(file, { ...base, kit_key_caught: true, kit_caught: true, [choiceVar]: stuck });
      assert.ok(!t.includes(praise) && !t.includes(praiseOut), `${ep}: praised a choice never made: ${t}`);
    });
  }
  test(`${ep} host: wrong answer -> the not-caught pair`, () => {
    const t = recap(file, { ...base, kit_key_caught: false, kit_caught: false, [choiceVar]: wrong });
    assert.ok(t.includes(notCaught), `${ep}: not-caught text missing: ${t}`);
    assert.ok(!t.includes(praise) && !t.includes(praiseOut), `${ep}: praise on a wrong answer: ${t}`);
  });
}
