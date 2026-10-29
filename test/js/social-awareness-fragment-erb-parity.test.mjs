// Guard against the fragment <-> full-episode drift DIALOGUE_REVIEW_C3 (C3-1) found: the
// learner-facing copy for each awareness episode lives twice over -- once in the planning
// fragment (`planning_notes/.../awareness/e<N>/defend.json`, the source of record that the
// defend-only / check shells are generated from) and once hand-mirrored into the shipped full
// episode (`scenarios/awareness_e<N>_*/scenario.json.erb`). Rounds 5-6 edited only one side in
// places, so the two told different stories (E7's fragment still described the retired
// voicemail-script design). This test fails, listing every mismatched key, if the shared copy
// drifts again.
//
// The awareness erbs carry no ERB tags, so they parse as plain JSON.
//
// What is compared (the keys meant to be shared):
//   - awarenessEpisode.strings (brief, flip* lines, noBlameLine, defendOnly, mondayCard, ...)
//   - awarenessEpisode.debrief
//   - the full-episode triage set (id == awarenessEpisode.defend.setId): every message's content
//     and truth block, and the set-level copy (factorStrings, channelTells, outcome, ...)
//
// Allow-listed intentional differences (each with a one-line reason):
//   - keys beginning with "_" are fragment-only authoring notes (_attack, _worked, _reusedFrom,
//     _prefix, _order, _calls, _audio), never learner-facing -- stripped before comparison.
//   - strings.defendIntro VALUE may differ: the full erb keeps a richer scene-set and the red-team
//     -> defend transition ("Now you're ..."); the fragment's trimmed value feeds the standalone
//     defend-only shell, which has no prior phase (DIALOG_LOG cycle 1 MINOR-5).
//   - strings keys present only in the erb are full-episode-only UI panels not needed in the
//     fragment / defend-only shell: conceptPanel, flipCallIntro, flipPageIntro, voicePanel,
//     defendIntro (E6/E7 carry it only in the erb).
//   - strings.flipDefenderLineByChoice (aw2) is erb-only: the per-pretext flip defender line needs
//     the attack's pretext choice (state.sent.templateId), which only a full episode makes; the
//     defend-only shell has no write/flip stage, and the generator pops the flip strings there.
//   - the triage set's erb-only "playerSentAuth" is the full episode's record of what the learner
//     sent on the red-team side; the fragment set (also feeding defend-only, which has no send) omits it.
//
// Run with: node --test test/js/social-awareness-fragment-erb-parity.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const EPISODES = [
  { n: 1, dir: 'awareness_e1_invoice_fraud' },
  { n: 2, dir: 'awareness_e2_cv_lures' },
  { n: 3, dir: 'awareness_e3_helpdesk_reset' },
  { n: 4, dir: 'awareness_e4_exec_whaling' },
  { n: 5, dir: 'awareness_e5_signin_pages' },
  { n: 6, dir: 'awareness_e6_texts_and_qr' },
  { n: 7, dir: 'awareness_e7_voice_ceo' },
];

// strings keys whose VALUE is allowed to differ between fragment and erb.
//   - conceptPanel (E3, P6 m-4): the full episode's learner just ran the attack ("Why the call and
//     the prompts worked"), while the defend-only learner only defended, so the fragment carries a
//     defender-framed version ("Why these are hard to catch"). Both are present and intentionally differ.
const STRINGS_VALUE_EXEMPT = new Set(['defendIntro', 'conceptPanel']);
// strings keys allowed to exist only in the erb (full-episode-only panels).
//   - flipMontageByChoice, flipMontageIntro, sandbox (ENG-04): the montage flip's lines and the sandbox's wording exist only in a full consequence episode; the
//     defend-only shell has no mistake or flip stage, so its generated fragment never carries them (like
//     flipDefenderLineByChoice).
const STRINGS_ERB_ONLY_OK = new Set(['conceptPanel', 'flipCallIntro', 'flipPageIntro', 'voicePanel', 'defendIntro', 'flipDefenderLineByChoice', 'flipMontageByChoice', 'flipMontageIntro', 'sandbox']);
// triage-set-level keys allowed to exist only in the erb.
const SET_ERB_ONLY_OK = new Set(['playerSentAuth']);

const readJson = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const fragPath = (n) => `planning_notes/phishing_and_social_engineering/awareness/e${n}/defend.json`;
const erbPath = (dir) => `scenarios/${dir}/scenario.json.erb`;

// recursively drop "_"-prefixed authoring-note keys, so only shippable content is compared.
function stripNotes(v) {
  if (Array.isArray(v)) return v.map(stripNotes);
  if (v && typeof v === 'object') {
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      if (k.startsWith('_')) continue;
      out[k] = stripNotes(val);
    }
    return out;
  }
  return v;
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

for (const { n, dir } of EPISODES) {
  test(`E${n}: fragment and full erb share the same learner-facing copy`, () => {
    const frag = readJson(fragPath(n));
    const erb = readJson(erbPath(dir));
    const fe = frag.awarenessEpisode;
    const ee = erb?.social?.awarenessEpisode;
    assert.ok(fe, `E${n}: fragment has no awarenessEpisode`);
    assert.ok(ee, `E${n}: erb has no social.awarenessEpisode`);

    const mismatches = [];

    // --- strings ---
    const fs = fe.strings || {};
    const es = ee.strings || {};
    const keys = new Set([...Object.keys(fs), ...Object.keys(es)].filter((k) => !k.startsWith('_')));
    for (const k of keys) {
      const inF = k in fs;
      const inE = k in es;
      if (inF && inE) {
        if (STRINGS_VALUE_EXEMPT.has(k)) continue;
        if (!eq(stripNotes(fs[k]), stripNotes(es[k]))) {
          mismatches.push(`strings.${k} differs:\n    frag: ${JSON.stringify(fs[k])}\n    erb : ${JSON.stringify(es[k])}`);
        }
      } else if (inE && !inF) {
        if (!STRINGS_ERB_ONLY_OK.has(k)) mismatches.push(`strings.${k} present only in the erb (not allow-listed)`);
      } else if (inF && !inE) {
        mismatches.push(`strings.${k} present only in the fragment (not allow-listed)`);
      }
    }

    // --- debrief ---
    if (!eq(stripNotes(fe.debrief), stripNotes(ee.debrief))) {
      mismatches.push(`debrief differs:\n    frag: ${JSON.stringify(stripNotes(fe.debrief))}\n    erb : ${JSON.stringify(stripNotes(ee.debrief))}`);
    }

    // --- the shared full-episode triage set ---
    const setId = fe.defend?.setId;
    const fset = (frag.triageSets || []).find((t) => t.id === setId);
    const eset = (erb.social.triageSets || []).find((t) => t.id === setId);
    assert.ok(fset, `E${n}: fragment has no triage set ${setId}`);
    assert.ok(eset, `E${n}: erb has no triage set ${setId}`);

    // set-level keys (excluding messages)
    const fsetKeys = new Set(Object.keys(fset).filter((k) => !k.startsWith('_') && k !== 'messages'));
    const esetKeys = new Set(Object.keys(eset).filter((k) => !k.startsWith('_') && k !== 'messages'));
    for (const k of new Set([...fsetKeys, ...esetKeys])) {
      const inF = fsetKeys.has(k);
      const inE = esetKeys.has(k);
      if (inF && inE) {
        if (!eq(stripNotes(fset[k]), stripNotes(eset[k]))) mismatches.push(`set[${setId}].${k} differs`);
      } else if (inE && !inF) {
        if (!SET_ERB_ONLY_OK.has(k)) mismatches.push(`set[${setId}].${k} present only in the erb (not allow-listed)`);
      } else if (inF && !inE) {
        mismatches.push(`set[${setId}].${k} present only in the fragment (not allow-listed)`);
      }
    }

    // messages, matched by id
    const fm = new Map((fset.messages || []).map((m) => [m.id, m]));
    const em = new Map((eset.messages || []).map((m) => [m.id, m]));
    for (const id of fm.keys()) {
      if (!em.has(id)) { mismatches.push(`message ${id} present only in the fragment`); continue; }
      if (!eq(stripNotes(fm.get(id)), stripNotes(em.get(id)))) mismatches.push(`message ${id} content/truth differs`);
    }
    for (const id of em.keys()) if (!fm.has(id)) mismatches.push(`message ${id} present only in the erb`);

    assert.equal(mismatches.length, 0,
      `E${n}: fragment (${fragPath(n)}) and full erb (${erbPath(dir)}) have drifted:\n  - ${mismatches.join('\n  - ')}`);
  });
}
