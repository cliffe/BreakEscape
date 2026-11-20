# Dialogue tighten: the defend-only twins (ca*_defend)

Tree: `.claude/worktrees/b-ca-lo-build`, branch `feat/ca-living-office-build`.
Scope: spoken/host ink in the `_defend` twins only. No debrief/triageSets/strings,
no choice labels, knots, variables, tags or logic. Twin ink is GENERATED, so the
edits are made to the generator template strings (the per-twin `LINES` literals) and
the ink regenerated into a scratch folder, except `ca13_ai_assistant_defend`, which
is hand-kept and edited directly in its ink.

Source leads: `SCAN_HAIKU.md` (`_defend` rows). House conventions and already-tightened
full-episode wording: `REVIEW2_CA00_CA10.md`, `REVIEW2_CA11_CA20.md`, `EDITS_CA00_CA10.md`,
`EDITS_CA11_CA20.md` (in `b-ca-dialogue` / `p-ca-living-office`).

These lines have cached TTS. Audio was not touched; re-voicing is a separate owner-gated step.

## Generator lines changed

Each twin's complete/welcome lines are string literals in the generator's `LINES` table
(key `('eN','defend')`, tuple `(welcome, complete, choice, reply)`). The pinned check
shells (`ca_pre_*`/`ca_post_*`) and the annual shell use separate keys/literals, so none
of these edits touches a pinned file (verified by regen diff and the pin test).

| Generator | Key | Field | Shell |
|---|---|---|---|
| `gen_e2_e4_shells.py` | `('e2','defend')` | complete | ca02 |
| `gen_e2_e4_shells.py` | `('e4','defend')` | complete | ca04 |
| `gen_e6_e7_shells.py` | `('e7','defend')` | complete | ca07 |
| `gen_e8_e17_shells.py` | `('e8','defend')` | complete | ca08 |
| `gen_e8_e17_shells.py` | `('e9','defend')` | complete | ca09 |
| `gen_e8_e17_shells.py` | `('e10','defend')` | complete | ca10 |
| `gen_e8_e17_shells.py` | `('e14','defend')` | complete | ca14 |
| `gen_e8_e17_shells.py` | `('e15','defend')` | complete | ca15 |

`ca13_ai_assistant_defend` is edited directly in `scenarios/ca13_ai_assistant_defend/ink/gwen_pritchard.ink`
(the generator skips it). The generator's stale `('e13','defend')` reference literal was
left unchanged (it already drifts from the hand-kept demo knots); the ink is the source of truth.

## Changed spoken lines

All lines are the hub `..._defend_complete` closing line unless noted. Line numbers are the
twin ink file line.

| Shell | File:line | Speaker | Old | New | Reason / finding |
|---|---|---|---|---|---|
| ca02 | fatima_begum.ink:22 | Fatima Begum | ...A real CV opens fine in the viewer, so anything that asks for more than that gets a second look from me. | ...A real CV just opens in the viewer. Anything that asks for more than that gets a second look from me. | B05: broke the rule-as-one-clause into two plain sentences; matches the full-episode tightening (EDITS_CA00_CA10 ca02). |
| ca04 | thandiwe_moyo.ink:22 | Thandiwe Moyo | ...When it's money and it's in a hurry, ring her on the number you already have, or ask Yasmin. | ...Money, in a hurry: ring her on the number you already have, or ask Yasmin. | B13: fronted the signals, cut "When it's money and it's in a hurry" wordiness; matches full ca04 fronting. |
| ca07 | agnieszka_duda.ink:22 | Agnieszka Duda | ...Whoever's voice it is, ringing back on the number we already hold settles it. | ...Whoever's voice it is, ring back on the number we already hold and that settles it. | B21: imperative reads as speech, not a maxim; matches full ca07 (EDITS_CA00_CA10). |
| ca08 | anjali_rao.ink:22 | Anjali Rao | ...The one move that works for every real sign is the same: report it and let the team act. | ...Whatever the sign, the move is the same: report it and let the team act. | B25: shorter opener; matches full ca08 opener ("Whatever the sign, the move is the same"). |
| ca09 | nilesh_solanki.ink:22 | Nilesh Solanki | ...A different password for every account, kept in a manager, and deny what you didn't start: that's the whole of it. | ...A different password for every account, kept in a manager, and deny anything you didn't start. | B29: dropped the "that's the whole of it" filler tail; "what"→"anything" aligns with full ca09. |
| ca10 | niamh_doherty.ink:22 | Niamh Doherty | ...The rule holds every time: no honest web page ever needs you to paste, run, install or call. | ...No honest web page ever needs you to paste, run, install or call. | B34: dropped the "The rule holds every time:" filler opener; keeps the thesis. |
| ca13 | gwen_pritchard.ink:26 | Gwen Pritchard | ...Check another way, on a number you already hold: that always works. | ...Check another way, on a number you already hold. | B53: cut the salesy "that always works" tag; the callback rule is kept (hand-edited ink). |
| ca13 | gwen_pritchard.ink:65 | Gwen Pritchard | Same face, same voice, on our own meeting tool. None of that proved who was asking. | And that was on our own meeting tool. None of it proved who was asking. | B54: drops the third "same face, same voice" restatement in one demo run (stated at :32 and :59); matches full ca13 L91 fix. |
| ca13 | gwen_pritchard.ink:66 | Gwen Pritchard | When a call wants a code, money or data, pause. End it, ring back on a number you already hold, or ask someone. Then report it. | When a call wants a code, money or data, end it. Ring back on a number you already hold, or ask someone, then report it. | Matches the full ca13 L92 tightening (merges "pause. End it"); scan did not separately flag the twin instance, applied under the "match the tightened full line" rule. |
| ca14 | julian_sallow.ink:22 | Julian Sallow | ...The tell is always what they ask for, not how friendly they are. Report anything that asks about our systems. | ...The tell is always what they ask for, no matter how friendly they seem. Report anything that asks about our systems. | B60: removed the "not X" negative parallelism; kept the thesis. (First tried "however"; the dialogue lint flags it as a fake transition, so reworded to "no matter how".) |
| ca15 | nilesh_solanki.ink:22 | Nilesh Solanki | ...If the official way's ever slow, tell us and we'll fix it, we can't mend what we don't know about. | ...If the official way's ever slow, tell us and we'll fix it. | B63: the second clause restated the first; cut it (not present in this twin's welcome line, so nothing lost). |

Total: 11 spoken lines across 9 twins (ca13 has 3; ca02, ca04, ca07, ca08, ca09, ca10, ca14, ca15 one each).

## Findings rejected, with reason

Done-vs-welcome and nudge-vs-welcome lines are mutually exclusive in one visit (established
house convention, REVIEW2 files): those "repeats" are reinforcement across completion, not
repeats heard in one play.

- **B18 (ca06 complete)** — "If a text or a notice wants a code scanned or a short link tapped, open the app yourself instead." Already concise, natural, the episode's point; kept (matches the keep-strong-thesis convention).
- **B30 (ca09 welcome, "Nothing you type here is real")** — safe-exercise reassurance so the learner types freely in the password exercise; deliberate (per B28 ruling).
- **B31 (ca09 complete vs welcome, "deny ... didn't start")** — complete/welcome are mutually exclusive in a visit; not a one-play repeat.
- **B37 (ca11 complete, DPO remit list)** — "a request, a breach or a complaint" is a concise, voiceable list of concrete examples of a data matter (parallels B74, kept). Not needlessly wordy. Left; ca11 twin untouched.
- **B44 (ca12 complete, "The move that works for every pushy visitor...")** — the episode thesis (check the list, escort, report); matches the full-episode lorna treatment (needs nothing). Left.
- **B45 (ca12 complete vs welcome, "report anyone who won't be checked")** — complete/welcome mutually exclusive; not a one-play repeat.
- **B55 (ca13 :33, "nothing is scored")** — reassurance for the optional unscored demo; deliberate (matches full B49). Left.
- **B56 (ca13 :68, "You don't need to spot a deepfake. You need to check another way.")** — the episode thesis and a strong existing line; the brief keeps strong thesis lines and bans only *writing new* "not X, it's Y" (matches full B51). Left.
- **B61 (ca14 welcome, "You're on an authorised exercise")** — safe-exercise framing convention (parallels B59/B43). Left.
- **B64 (ca15 welcome, "Found sticks, 'quicker way' messages...")** — terse kiosk task-setup, within the 30-word dialoguelint cap; rewording to flow more naturally risks the cap. Left.
- **B69 (ca16 complete, "...as facts, never a verdict on anyone")** — "never a verdict on anyone" is a deliberate no-blame teaching line for insider risk (a concern is not an accusation); the no-blame refrain is kept by house convention (parallels B66). Left; ca16 twin untouched.
- **B70, B71, B72 (ca17 defend-only)** — "ask first" recurring is the episode's intended mnemonic (acceptable use = when in doubt, ask first), and "Every rule here has a 'because'" is a warm framing line, not needlessly wordy. Within the word cap. Left; ca17 twin untouched.
- **B77 (ca18 complete vs welcome, "Report the fakes...")** — complete/welcome mutually exclusive; not a one-play repeat. Left; ca18 twin untouched.
- **B80 (ca19 complete vs welcome, "if you didn't start it... report it")** — complete/welcome mutually exclusive. Left; ca19 twin untouched.
- **B85 (ca20 complete vs welcome, Wi-Fi password fake/trap)** — complete/welcome mutually exclusive. Left.
- **B86 (ca20 welcome, "Nothing's real")** — safe-exercise reassurance convention (parallels B83). Left; ca20 twin untouched.

Twins with no scan findings and left untouched: ca01, ca03, ca05 defend.

## Lines shared with the pinned check shells

None. The twin complete/welcome lines are per-twin `LINES` literals, separate from the
`ca_pre_*`/`ca_post_*`/`ca_annual_*` literals. The regen diff showed no pinned
`scenario.json.erb`, `mission.json` or ink changed, and the pin test passes. No in-scope
edit had to be dropped for being shared with a check shell.

## Checks

- Pin test `test/js/social-awareness-office-kit.test.mjs`: 3/3 pass (pinned set byte-identical).
- Regen diff against HEAD: only the 8 generator-driven twin ink files differ, one line each;
  no `ca_pre_*`/`ca_post_*`/`ca_annual_*` file differs. (The known whitespace-only reformat of
  ca14/ca16/ca18 `_defend` `scenario.json.erb` was not copied in; only ink was touched.)
- Ink compiled via `scripts/compile-ink.sh <shell>` for all 9 touched twins: 0 failures.
- `ruby scripts/validate_scenario.rb <erb> --strict-social --no-graph` on all 9 touched twins: 0 errors, 0 warnings each (ca14 dialoguelint warning on the first "however" draft was fixed by rewording).
- `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs` (excluding the flaky mail-ink-runner): 2730/2730 pass. `social-mail-ink-runner.test.mjs` alone: 23/23 pass.
- AW python tests (`test_apply_training_room.py`): 10/10 pass.

## Not done / notes

- Audio: cached TTS for the 11 changed lines now mismatches the text; re-voicing is owner-gated
  (separate step), not done here.
- ca13's generator reference literal (`('e13','defend')` in `gen_e8_e17_shells.py`) still reads
  the old complete line; left as-is because the generator skips ca13 and the ink is hand-kept
  (the demo knots already live only in the ink). The ink is authoritative.
