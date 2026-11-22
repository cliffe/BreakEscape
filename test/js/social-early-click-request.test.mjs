// Early click on a step-away colleague (fix/ca-early-click). After Look up the colleague's request
// bark lands several seconds later. A click before it used to open the ambient debrief reaction
// ("Good shout...") with only "See you later", and the request was never offered again.
// The kit `start` knot now opens the request knot whenever the beat is out and not done.
//
// Run with: node --test test/js/social-early-click-request.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const inkjs = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));
const Story = inkjs.Story || (inkjs.default && inkjs.default.Story);

const SHELLS = [
  { ep: 'ca14', stub: 'lorna_easton', choice: 'kit_ca14_photo_choice', knot: 'ca14_photo', right: 'crop', wrong: 'post' },
  { ep: 'ca13', stub: 'graham_whitfield', choice: 'kit_ca13_send_choice', knot: 'ca13_send', right: 'ring', wrong: 'send' },
  { ep: 'ca05', stub: 'darren_price', choice: 'kit_ca05_prompt_choice', knot: 'ca05_prompt', right: 'stop', wrong: 'approve' },
  { ep: 'ca02', stub: 'chidi_okeke', choice: 'kit_ca02_cv_choice', knot: 'ca02_cv', right: 'report', wrong: 'enable' },
  { ep: 'ca15', stub: 'fatima_begum', choice: 'kit_ca15_stick_choice', knot: 'ca15_stick', right: 'handin', wrong: 'lost' },
  { ep: 'ca16', stub: 'niamh_doherty', choice: 'kit_ca16_signin_choice', knot: 'ca16_signin', right: 'desk', wrong: 'lend' },
  { ep: 'ca06', stub: 'zainab_hussain', choice: 'kit_ca06_notice_choice', knot: 'ca06_notice', right: 'check', wrong: 'fine' },
  { ep: 'ca10', stub: 'darren_price', choice: 'kit_ca10_check_choice', knot: 'ca10_check', right: 'close', wrong: 'paste' },
  { ep: 'ca07', stub: 'graham_whitfield', choice: 'kit_ca07_call_choice', knot: 'ca07_call', right: 'ringback', wrong: 'pay' },
  { ep: 'ca18', stub: 'lorna_easton', choice: 'kit_ca18_reset_choice', knot: 'ca18_reset', right: 'words', wrong: 'save' }
];

// Open the colleague the way person-chat does: story at `start`, globals synced in, then continue.
function open(s, globals) {
  const json = readFileSync(join(root, 'scenarios/_office_kit/ink', `${s.stub}_ambient.json`), 'utf8').replace(/^﻿/, '');
  const story = new Story(json);
  story.ChoosePathString('start');
  for (const [k, v] of Object.entries(globals)) {
    if (story.variablesState.GlobalVariableExistsWithName(k)) story.variablesState[k] = v;
  }
  const lines = [];
  while (story.canContinue) lines.push(story.Continue().trim());
  return { story, lines, choices: story.currentChoices.map((c) => c.text) };
}

for (const s of SHELLS) {
  const base = { kit_defend_done: true, kit_ep: s.ep, [`kit_${s.ep}_out`]: true, [`kit_${s.ep}_asked`]: false, [`kit_${s.ep}_done`]: false, [`kit_${s.ep}_moved`]: false, [s.choice]: '' };

  test(`${s.ep}: a click after Look up but before the request lands opens the request`, () => {
    const { lines, choices } = open(s, base);
    assert.ok(lines.some((l) => l.includes('?')), 'the request is asked');
    assert.ok(choices.length >= 3, 'the request has its choices, not just See you later');
    assert.ok(!choices.includes('See you later.'), 'not the stub');
  });

  test(`${s.ep}: the request is the same line the bark carries (asked flag set)`, () => {
    const early = open(s, base);
    const late = open(s, { ...base, [`kit_${s.ep}_asked`]: true });
    assert.deepEqual(early.lines, late.lines);
    assert.deepEqual(early.choices, late.choices);
  });

  test(`${s.ep}: before Look up the colleague stays ambient`, () => {
    const { choices } = open(s, { ...base, [`kit_${s.ep}_out`]: false });
    assert.deepEqual(choices, ['See you later.']);
  });

  test(`${s.ep}: once the beat is done a click gets the stub, not the request`, () => {
    const { choices } = open(s, { ...base, [`kit_${s.ep}_done`]: true, [s.choice]: s.wrong });
    assert.deepEqual(choices, ['See you later.']);
  });

  test(`${s.ep}: an early click can still answer right or wrong`, () => {
    for (const [i, want] of [[0, s.right], [1, s.wrong]]) {
      // ca14's crop option needs the board looked at first (kit_ca14_seen), as designed.
      const { story } = open(s, { ...base, kit_ca14_seen: true });
      story.ChooseChoiceIndex(i);
      while (story.canContinue) story.Continue();
      assert.equal(story.variablesState[s.choice], want);
    }
  });
}
