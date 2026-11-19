# Gate B: results (wave 1A)

Branch `feat/ca-living-office-build`. It lands after `fix/ec1-reopen-hold` (d135c9527, merged here as 671455f1b), which AC0 has queued for the first train after T242. Evidence lives in session scratch folders; the verdicts and game ids are copied here.

## Proofs

| Proof | Verdict | Notes |
|---|---|---|
| 2: EC1 step-away on the kit | PASS after fixes | D1-D3 were fixed on fix/ec1-reopen-hold. Opus 5.5 review clean. Live proof games 10349-10357. Non-stepAway mission 169 behaves the same before and after (10362 pre-fix, 10361 post-fix). |
| 8: no answers leak | PASS | The SecretLeaks value-match found 0 answer matches in test_ca01_panel. |
| 9: partner and use-cell | PASS (scope) | Partner and use-cell cases, the ca06/ca15/ca16 items and timing move to gate C/D. |
| 10: request stays live | PASS | An unanswered request staying live is accepted. |
| 12: looks | PASS except the 0 s look | A variant look that isn't preloaded loads cold (rooms.js:737-743). Gate C must preload ca12's break-reminder look. |

## ca01 (tier O, observed)

- **Fallback shell** (scenarios/ca01_invoice_fraud) and **panel build** (scenarios/test_ca01_panel):
  - the quiet guard holds through the triage;
  - Look up runs the chain in about 5 s, and the panel copy says "a few seconds";
  - Carry on leaves the chain untouched.
- **Fallback X close:** leaves kit_quiet on and shows no overlay. This matches the shipped course, which completes on Finish, and debriefSeen is stepAway-only by design. Not a defect.
- **Dialogue:** five rounds (Haiku scan, Opus 4.8 edit, Sonnet reviews R2-R5; log in CA01_DIALOGUE_EDITS.md).
  - The ICO claim is removed.
  - One staff-time cost, "a fortnight".
  - The host branches three ways, on kit_key_caught and kit_caught.
  - The colleague stubs branch on kit_key_caught.
- **Persona playtests** (Dana on the panel, Marcus on the fallback) found:
  - the host told a learner who missed it that they had caught it;
  - the board notice contradicted the catch run;
  - the notice was a floor placeholder.

  All three are fixed (rounds 3 and 4, the new engine option, and the notice moved to a taped paper `notes6` between the RANGE board and the sign).
- **New engine option** `outcome.messageGlobals` (161c39646 + 29db0863e):
  - one caught boolean per listed message, written before `<prefix>complete`;
  - sets without the option are unchanged;
  - Opus 5.5 review clean; `bin/test-js` 887/888 (only m01-decode-task fails, a Bundler environment issue);
  - test scenario `test_triage_message_globals`.
- **Final three-outcome live replay at d199a1760:** PASS, 0 FAIL in 32 checks. See "Final replay".

## Final replay (d199a1760)

| Run | Game | kit_key_caught | kit_caught | Score | Lines | Result |
|---|---|---|---|---|---|---|
| Fallback CATCH | 10381 | true | true | 98 | catch host, shared close, praise stubs | PASS |
| Fallback PARTIAL (Ravinder phish trusted) | 10382 | true | false | 66 | partial host, shared close, praise stubs | PASS |
| Fallback MISS | 10383 | false | false | 68 | miss host, own close, neutral stubs | PASS |
| Panel CATCH with Look up | 10384 | true | true | 98 | catch host; Agnieszka bark at 1.2 s, Adaeze bark at 5.2 s, kit_ca01_done at 5.2 s | PASS |

The notice is visible on the back wall (x 129, y 22) in all four runs.

## Minors carried

- messageGlobals:
  - a listed name can clash with the set's own result names, which would emit twice;
  - messages from `defend.calls` can't be listed.
- EC1 D2 race (pass / inbox_triage_completed share a slot): on AC0's post-release list.
- Fixture `test_ca_office_kit` / `_defend` sets `kit_key_caught` from the percent (e1_stub has no messageGlobals). That is fixture-only.
- The debrief "kept N phish away" line is engine text. It is truthful (it counts actual reports), so it stays.

## Still open

- Voicing: the new and reworded ca01 lines need the owner's yes via AC0.
- test_ca01_panel has no DB row. Register it at the owner's next db:seed. Until then, live checks overwrite test_ca_office_kit in a throwaway worktree.
- The time budget is measured in the pilot. Trim only if it's over the baseline (TIMING_BASELINE.md).
