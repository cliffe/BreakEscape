# Closing check: awareness course and lab

Run at HEAD b84b94aef (72ee99843 and its ancestors included). Keyless server on :3001 restarted by PID 855641 (its start at 17:34:59 predated engine commit d0710ebf2 at 17:46:20); the new server is PID 1638478. :3000 untouched. No game files edited.

## Result

| # | Item | Result |
| - | ---- | ------ |
| 1 | `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs` | **PASS**: 1850 tests, 1850 pass, 0 fail |
| 2 | `validate_scenario.rb --strict-social --no-graph --skip-ink` on 38 awareness shells and `lab_social_engineering` | **PASS**: 38 of 38 and the lab exit 0, each ending "Validation complete!" |
| 3 | Awareness and lab bridges, one at a time, scored with check-bridge.mjs | **PASS**: 12 of 12 bridges passed on the first attempt, no retries used (table below) |
| 4a | E5 full: send Hana's email with no page attached | **NOT CONFIRMED**: see below |
| 4b | E6 defend-only: "Real texts and notices", no title ends with "..." | **PASS** (one caveat on preview lines, see below) |
| 4c | Lab: triage, trust one phish, result card reads "You trusted this phish" | **NOT CONFIRMED**: the replay did not reach triage |

## Item 3: bridge results

Each bridge ran in a fresh game from new-game.rb. Counts are eval assertions passed over expected.

| Bridge | Scenario | Game | Evals | Result |
| ------ | -------- | ---- | ----- | ------ |
| e1-full | awareness_e1_invoice_fraud | 4620 | 13/13 | PASS |
| e2-full | awareness_e2_cv_lures | 4621 | 14/14 | PASS |
| e3-full | awareness_e3_helpdesk_reset | 4622 | 22/22 | PASS |
| e4-full | awareness_e4_exec_whaling | 4623 | 14/14 | PASS |
| e5-full | awareness_e5_signin_pages | 4624 | 18/18 | PASS |
| e6-full | awareness_e6_texts_and_qr | 4625 | 15/15 | PASS |
| e7-full | awareness_e7_voice_ceo | 4626 | 13/13 | PASS |
| p7-channels | test_social_p7_channels | 4627 | 18/18 | PASS |
| 6 | lab_social_engineering | 4628 | 36/36 | PASS |
| r4-door | lab_social_engineering | 4629 | 3/3 | PASS |
| 5 | test_social_slice | 4630 | 29/29 | PASS |
| 5-600 (600 px viewport) | test_social_slice | 4631 | 9/9 | PASS |

Bridges 5 and 5-600 run on `test_social_slice`, not on the lab. They are listed here because they were in the requested set. `bridge-p7-channels` ran as `p7-channels`.

## Item 4: spot checks

**4a. E5 full, no page (NOT CONFIRMED).** Three fresh games (4633, 4636, 4638) were played through brief, OSINT and a build walked out without building a page. The composer sent Hana's email with the sign-in link set to the kit. The send did go out: the composer eval returned `false`, which means the send ran and the phish did not land. Hana's reply was not found on screen. The probe polled `document.body` and the mail client for up to 60 seconds and found nothing. The mail client closes after the send, and reopening it did not reach Hana's thread in the one attempt that tried. The reply text in the scenario is `missNoPage` ("There was nothing to sign in to behind that link, so I just closed it."), so the engine has it. The harness did not show it on screen. This is a gap in my probe, not a confirmed game defect. A reader needs to open the mail thread by hand, or a probe must target the thread element directly.

**4b. E6 defend-only (PASS).** Game 4634. The defend-only episode ran the six-item triage and reached the result card. The card reads:

> "Real texts and notices handled right 2 of 2"

and includes "Score 98 percent. Sharp: you caught the phish and knew why". No mail row title ends with "...". Caveat: several row preview lines do end in "...", for example "Thursday's Halifax run now starts at...". These are message previews cut short by the list, not titles. Decide whether that counts as a finding.

**4c. Lab triage (NOT CONFIRMED).** Game 4635. No shortcut is documented in R20.md, so the route was replayed from R20's own recorded session (`2133f16a.../scratchpad/lab-r20/session-4570.jsonl`, 409 input commands up to the triage Result click). The replay diverged early, before triage was reached. The first failing command was:

> `{"ok":false,"reason":"no-control-matching:Add to notes"}`

The final objectives read "Land a message on Melanie Pierce ○" and "Prepare for Sofia ◆", so the run never reached triage. `triageStep` was `null` at the end. The result-card wording is therefore unverified in live play. The unit test `test/js/social-engine-r4-triage.test.mjs` asserts `You trusted this phish: ‘…’`, but that is a helper test, not live proof. A fresh route with fixed timing is needed. The earlier L5 log stops at the report workstation and cannot be used for triage.

## Scratch

Scripts, logs and outputs: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/closing-check/`
