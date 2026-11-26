# Showcase review, round 2: clarity and coverage fixes

Reviewer: re-review of the fixes for the four ops showcases. Date: 2026-11-26. Tree: `/data/be-ops-follow`, branch `ops-showcase-review` (from main 1.0.27). Commits reviewed: 414fd31dd (recon), 49cc4d8ff (terminal), efd789848 (passwords), e72ea08cc and 1213a838a (second step).

Inputs: `docs/agents/ops_core_build/reviews/SHOWCASE_COVERAGE_REVIEW.md`, the four `scenarios/*/planning/SHOWCASE_CLARITY_REVIEW.md`, and `git diff main..HEAD` of each scenario's ink and `scenario.json.erb`. Each B and M was checked in the game text (ink, barks, board, task titles, item text), not in PLAYTEST.md.

## Verdict

**Not ready to merge: B 1, M 1, m 6.** The text work is good: nearly every finding is closed in the game, the new lines are accurate, plain and free of exploit detail, and the audio is complete. One blocker remains: the recon fix inserted an eventMapping in the middle of Ama's list, which breaks the mapping-drift test. One second-step major is only half done. Both fixes are small.

## Checks run

| Check | Result |
|---|---|
| Rails, the four `test/controllers/break_escape/demo_ops_*_scenario_test.rb` (under flock) | 141 runs, 1 failure: `DemoOpsPasswordsScenarioTest#test_mapping_indexes_have_not_drifted` reports MAPDRIFT in `demo_ops_recon` (see B1) |
| Validator, all four | 0 errors. One new warning in recon: `fixedIf` is the only thing before the `factory_login` grant (see m6) |
| Dialogue lint, all four | No findings apart from the known `crowded-hub` warning in passwords |
| `tts:wasted`, all four | 0 unrequested, and clips equal lines expected: recon 308, terminal 92, passwords 317, second step 363. Every voiced line has a clip |
| Voiced-line rules | No printed variables and no stage directions in any new line |
| Exploit content | None |
| eventMappings | Terminal and second step changed bark text only. Passwords appended one entry at the end. **Recon inserted one entry mid-list (B1)** |
| Server answers, access checks, secrets | No secret changed. Two intended rule changes, both asked for by the coverage review: recon `fixedIf: "printer_fixed"` on `factory_login` (coverage M2), and the passwords `it_desk` policy with `maxAttempts: 3` on `graham_pc` (coverage M5). `it_desk` matches `desk` except for `maxAttempts`, and the lockout is per PC and account, so the route is not affected |

## Findings closed

- **recon:** clarity B1, B2, M1-M4 and M6-M10, plus m2-m6, m8 and m10. Coverage M1, M2 and M4, plus m1-m3, m5 and m10. M5 is half done (see m1 below).
- **terminal:** clarity M1-M9 and m1-m9. Coverage M1, M3 (one pointer line, as agreed), M4 and m4. Clarity m10 was skipped on purpose (see m5).
- **passwords:** clarity B1, B2, M1-M9 and m1-m10. Coverage M5, M6, M8, m8 and m9.
- **second step:** clarity M1-M6, M8 and m1-m12. Coverage M1, M6, M7, M9 (a recap line only, accepted), m7 and m11. M7 is half done (see M1 below).

## Blocker

### B1. recon: new eventMapping inserted mid-list, so the drift test fails
- Where: `scenarios/demo_ops_recon/scenario.json.erb`, Ama's `eventMappings`. The new `network_service_checked` entry (the "Fixed." bark for coverage M2) sits before `global_variable_changed:printer_off`.
- Why it matters: fired onceOnly handlers are saved under `npcId:eventPattern:index` (`npc-manager.js` `exportTriggeredEvents`). Every later entry moves along by one, so a saved game can mark the wrong handler as fired, for example the two `pc_signed_in:file_server` barks. It also breaks the project rule (append only) and `test_mapping_indexes_have_not_drifted`, which is the one failure the passwords fixer reported.
- Fix: move that entry, unchanged, to the end of Ama's list, after the `use_card_done` / "The false one won't take that card" entry. Re-run the recon and passwords scenario tests. No audio changes.

## Major

### M1. second step: still no closing pointer when the last task ticks (clarity M7, half done)
- Where: `scenarios/demo_ops_second_step/scenario.json.erb`, Ama's eventMappings. The suggested `global_variable_changed:read_log_done` bark was not added.
- Problem: the last task ticks at the approvals log in the IT room, away from Ama. The new "Ask me for the short version" line plays only if the player walks back and asks "What's next?". This was the main problem M7 raised. The added short-version lines and the real-names choice are good.
- Fix: append, at the end of Ama's list: `{ "eventPattern": "global_variable_changed:read_log_done", "condition": "data.value === true && data.oldValue !== true", "onceOnly": true, "cooldown": 0, "bark": "That's the day done. Come back to reception and ask me for the short version." }`. Then top up the audio (one bark) and update the pinned bark test if there is one.

## Minor

- **m1. recon clarity M5, second half.** The pointer now names the Panels and Terminal switch, but the hub choice "I looked at the file server in the Terminal." still appears after a Panels scan, so a player can tick the task without opening the Terminal. Downgraded to minor now that the switch is named. Fix: change the choice text to "I've scanned the file server.", or offer it only after a scan in the Terminal.
- **m2. recon clarity m1, m7 and m9 not done:** the cake is never explained, the camera's decoy report has no pointer, and the drop box is not described as a small computer (A:46). These are optional polish lines.
- **m3. Lock and Sign out wording.** Both are in the Start panel (`pc-taskbar.js`). The second-step bark says "pressed Lock on the taskbar … sign out from Start", and passwords says "use Sign out on the taskbar". Suggest "from Start" in both, at the next audio top-up.
- **m4. passwords, the cake line at the end of the day.** "Put it out and watch who wanders over" plays once the evening log is done, when most staff have gone home. Move it to the free-play block before `act_evening`, or drop it. Check live too: when Graham is locked out of his own PC (coverage M5), his work need may show as frustration during free play.
- **m5. terminal:** clarity m10 (barks held while the view is open) was skipped and still needs a live check. The notice board still says "while it is fresh" for the token, where the ink now says six minutes.
- **m6. recon validator warning:** `fixedIf` is the only condition before the `factory_login` grant. This is not a security change: the grant needed no more than this before, and `fixedIf` can only refuse. Accept it and record the reason, or add a short note in PLAYTEST.md.

## What a fixer should touch

B1: one move inside recon `scenario.json.erb`. M1: one appended bark in second-step `scenario.json.erb`, plus one clip. The minors are optional. No server, access or secret change is needed for any of them.
