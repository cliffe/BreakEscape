# P7 playtest, part B: E5, E6, E7 and the check pairs (confirming the P6 fixes)

Date: 2026-10-27. HEAD at start: 2951963f6. Server: keyless :3001 only (no TTS), headless Playwright, fresh game per run, real UI only (clicks, `mg select` on the visible compose selects, `eval` reads of `document.body.innerText`, screenshots). No game files edited, :3000 untouched, no servers started or stopped. Scratch and session logs: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw-p7b/`. Screenshots are in `P7_screenshots/` with the prefix `p7b_`.

Earned-secrets table: empty. These scenarios have no codes, PINs or flags; every research fact was clicked from the in-game browser before use.

## Bridges (check-bridge.mjs, one at a time, :3001)

| Bridge | Scenario | Game | Assertions | Result | Approx. time (create to check) |
| ------ | -------- | ---- | ---------- | ------ | ------------------------------ |
| e5-full | awareness_e5_signin_pages | 4575 | 18/18 | PASS first try | 45 s |
| e6-full | awareness_e6_texts_and_qr | 4577 | 15/15 | PASS first try | 31 s |
| e7-full | awareness_e7_voice_ceo | 4578 | 13/13 | PASS first try | 31 s |
| p7-channels | test_social_p7_channels | 4579 | 18/18 | PASS first try | 24 s |

No step needed "bridge needs updating": the E5 `{portal}` blank change did not break `bridge-e5-full`.

## Real-play runs

| Game | Scenario | Route | Notes |
| ---- | -------- | ----- | ----- |
| 4580 (e5a) | awareness_e5_signin_pages | full: Quayholt + quayholt-sso + padlock, calm pretext, calm Ask, landed; defend with look-alike ticks only (padlock and secrecy ticks skipped) | grade, POV, meter |
| 4582 (e5n) | same | research only, no page attached, Send | no-page cause |
| 4584, 4585, 4587 | same | DocShare pages (three attempts, see P7-1/P7-3) | wrong-service cause |
| 4589 (e5w) | same | Quayholt + quaybolt + no padlock | wrong-address cause |
| 4591 (e6a) | awareness_e6_texts_and_qr | full, calm pretext and Ask, barrier notice ticked for pressure | result, notes, POV |
| 4592 (e7a) | awareness_e7_voice_ceo | full, landed, then trusted all five (both phish) | two-critical line, label, POV |
| 4593 (e7d) | awareness_e7_voice_ceo_defend | defend-only, reload mid-round, then trusted only the cloned voicemail | one-critical line |
| 4595 / 4599 | awareness_pre_finance_ba / awareness_post_finance_ba | host Joanne Pell, careful, 100% Sharp; reload after completion | check pair |
| 4600 | awareness_pre_executive_ba | careful, one phish trusted on purpose (slot 3) | 77% Getting there, critical line |

Timings (driver clock, loaded machine, includes my reading): game creation and bootstrap 15 to 20 s each (e7d 18 s, finance post 16 s); each scripted 10-item check 15 to 16 s; E5 full about 6 min; E6 full about 3 min; E7 full about 3 min; E7 defend-only round about 1 min.

Reload: finance pre BA after the check was complete. Reload to title screen took about 8 s, `bootstrap` (without `resume`) settled in 2 s, about 14 s in all. State held: tasks done, `triage_pre_done` and `triage_pre_pass` set, and Joanne said "Done, and saved. There's a second check after the training, so you can see what changed." (`p7b_fm_pre_after_reload.png`). A second reload mid-defend in E7 defend-only (game 4593): the game came back in the training room with objective "Cover the finance line" intact and the round restarted from the kiosk, as the brief says. Harness only: `bootstrap` with `"resume":"resume"` looped on "close title-screen" for 66 s and returned TIMEOUT (the game was fine afterwards). Without `resume` it takes 2 s. Not a game finding.

Verifier: e5a, e6a, e7a `2 tasks completed`; exa `1 task completed`.

## PASS / FAIL

| Item | Result | Evidence |
| ---- | ------ | -------- |
| E5 pretext reads "We are moving the Quayholt SSO to a new provider..." | PASS | `p7b_e5_compose_calm.png`. The `{portal}` blank offers only "Quayholt SSO" (the migration value is gone). Both pretexts read cleanly. |
| E5 meter pressure text is generic, no "before the end of the day" | PASS, with a caveat | Urgent pretext with a calm Ask: "This pushes you to sign in quickly, before you stop to check the address in the bar." (`p7b_e5_meter_urgentpretext_calmask.png`). With the calm pretext and a calm Ask there is no pressure line at all (1 flag), and a calm pretext with the urgent Ask also shows none (2 flags). So the exact "calm Ask and calm pretext" case never shows pressure text; see P7-5. The old quote does not appear in any combination. |
| E5 Hana miss reply differs by cause | **FAIL** | No page attached: "That link didn't take me to Quayholt's own sign-in, so I didn't put my password in. I'll go to the portal the normal way." (the generic `missed`), not `missNoPage`. DocShare page that missed (docshore, no padlock, 50/100): the same generic line, not "That's a DocShare page, and I don't use DocShare...". Wrong address: not reachable, see P7-3. Cause: see P7-1. |
| E5 episode result grade | **FAIL** (P6-4 still open) | 92% "Sharp: you caught the phish and knew why" with "Padlock myth: caught 0 of 1" and "Secrecy: caught 0 of 1" (`p7b_e5_result.png`). Checks cap two zero skills at "Getting there"; the episode does not. |
| E6 result reads "Real texts and notices" | PASS | "Real texts and notices handled right 2 of 2" (`p7b_e6_result.png`). |
| E6 QR barrier notice tickable for pressure, scored, note shown | PASS | Tick list for the barrier notice: "It's pushing me to hurry", "A QR code where...", "Link or sender domain...", "Nothing looks wrong" (`p7b_e6_barrier_ticks.png`). Feedback: "Caught: Unexpected urgency or pressure to act fast ('Vehicles not set up may be clamped', from Monday, is there to make you scan now rather than stop to check where the code goes)" (`p7b_e6_barrier_feedback.png`). Result grid: "Pressure: caught 2 of 2" (barrier notice and the IT email). |
| E6 result titles have no trailing dots | PASS for the result | "You trusted the real ones: 'Shauna Lofthouse (Transport)' and 'Printed on the table cards in the canteen'." The per-message feedback header still truncates ("Parceline: we couldn't deliver your parcel. A..."), see P7-7. |
| E7 trusting the cloned-voice voicemail is a critical miss | PASS | Trusting only that item: "One answer let an attacker straight in (acting on a spoofed voicemail). That costs 15 points off the round" (62%, `p7b_e7d_result_one_critical.png`). |
| E7 two phish trusted: "2 answers" and "acting on a spoofed voicemail" | PASS | "2 answers let an attacker straight in (acting on a spoofed voicemail, or trusting a phish email). That costs 15 points each" (30%, `p7b_e7_result_two_critical.png`). |
| E7 compose label "sender's name" | PASS | `p7b_e7_compose_label.png`: "sender's name: choose..." and "the address it comes from: choose...". |
| POV: Quayholt (E5) behind the host | PASS | Niamh Doherty over the purple QUAYHOLT INSURANCE plate, queue board, kiosk (`p7b_e5_host_pov.png`). |
| POV: Tarrowby (E6) behind the host | PASS | Chidi Okeke over the TARROWBY LOGISTICS plate, route map, kiosk (`p7b_e6_host_pov.png`). |
| POV: Brightwell (E7) behind the host | PASS | Agnieszka Duda over the green BRIGHTWELL FOODS plate, whiteboard (`p7b_e7_host_pov.png`). |
| Checks: finance BA with Joanne Pell | PASS | Pre: Joanne's opening line, 100% Sharp, all 10 right. Post (fresh game): "Hi again. Ten new messages on the kiosk for the last check...", 100% Sharp, "No baseline" with the "stands on its own" line. "You trusted the real ones: 'A', 'B', 'C' and 3 more." Skill grid correct. |
| Checks: executive BA (second role) | PASS | Phish trusted on purpose: 77% "Getting there", "One answer let an attacker straight in (trusting a phish email)", the skill grid and "Weakest skill" line correct (`p7b_check_exec_result.png`). |
| Reload | PASS | See Real-play runs. |

## New findings

Severity: blocker 0, major 0, minor 4, trivial 3.

| # | Sev | Where | Finding | Evidence | Fix |
| - | --- | ----- | ------- | -------- | --- |
| P7-1 | minor | E5 Hana's reply, live path | The per-cause replies (`missNoPage`, `missWrongService`, `missWrongAddress`) wired in db44cc919 / 08b78d09c never reach the player. The live path is `mail-bridge.js` `dataOnlyText()` (lines 481 to 491), which returns `replies.missed` and never reads `result.linkCause`; only `phish-rules.js` `dataOnlyReply()` has the per-cause branch, and nothing calls it on this path. Unit tests on the helper pass while the live reply is the generic line (the "helper tests pass, live path breaks" pattern). P5-8 (name the service) therefore stays open in play. | No page: generic reply (`p7b_e5_miss_nopage.png`). DocShare miss: generic reply (`p7b_e5_miss_docshare.png`). | In `dataOnlyText`, before `replies.missed`, return `replies[MISS_KEY[result.linkCause]]` when `result.firstFail === 'linkCredible'` (export the key map), and add a live-path test through `dataOnlyText`. |
| P7-2 | minor | E5 episode result | P6-4 still open: "Sharp" at 92% with two zero skills (padlock myth, secrecy). The checks cap this at "Getting there". | `p7b_e5_result.png` | Apply the check cap to the episode result headline. |
| P7-3 | minor | E5 builder and landing | A page that Hana "doesn't use" still lands. The builder says "FAIL Brand: Hana doesn't use that service" yet "Close enough to pass a quick look", and a DocShare page (docshore, padlock, 60/100) lands with the card line "The sign-in link looked like her own" and Hana's reply "Thanks, I'll sign in through that link." Only DocShare with no padlock on docshore.example (50/100) misses. The wrong-address cause is unreachable: Quayholt with quaybolt.example and no padlock scores 65 and lands. So two of the three per-cause replies are close to unreachable even once P7-1 is fixed. Possibly by design (`brandGate` off for this target), but then the builder's "FAIL" row and the "doesn't use that service" miss reply contradict the landing. | Games 4585 (DocShare lands at 60), 4587 (75, 62 and 50 scores), 4589 (quaybolt lands at 65) | Decide the intent. Either turn the brand gate on for `sso_staff` (a wrong service misses with the wrongService reply) and raise the look-alike threshold so tier-1 typos miss, or reword the builder row and landing card so a wrong service reads as a weaker, not failed, page. |
| P7-4 | minor | E5 compose, no page attached | P6-2's other half is unchanged: Send is enabled with no page, and the meter still lists "Link destination doesn't match the real site (look-alike domain)" when there is no link at all. The miss card says "There's no page behind that link." | Game 4582 | Disable Send or add a "no link attached" meter line when no page is attached. |
| P7-5 | trivial | E5 compose meter | The pressure line fires only from the high-urgency pretext. A calm pretext (urgency medium) with either Ask shows no pressure flag, and a medium Ask on its own never does. The brief's "calm Ask and calm pretext names the cause generically" case shows no pressure text. Consistent with the P6 data log ("flag a medium pretext") only if "medium" is meant to be silent; worth confirming the threshold. | Meter reads in game 4580 | Confirm intent; if the Ask should count, `e5_ask` ("before the end of the day") is the one that should raise it. |
| P7-6 | trivial | E5 host art | Niamh Doherty, the host at Quayholt Insurance, wears an orange hi-vis vest over a white blouse, which reads as a warehouse or depot worker, not an insurance office. (Chidi at Tarrowby and Agnieszka at Brightwell fit their rooms.) | `p7b_e5_host_pov.png` | Check the Niamh portrait against the Quayholt cast brief. |
| P7-7 | trivial | E6 per-message feedback | The header line under each verdict still prints a truncated title with dots ("Parceline: we couldn't deliver your parcel. A..."). The result page and debrief use clean titles. | E6 item 1 feedback | Use the clean short title here as well. |

Harness-only notes, not game findings: the player speaker label in the host chat reads `demo_player`; `mg select` index 3 is the pretext and 4 the Ask in E5, E6 and E7; "Attach to email" in the kiosk builder saves the page and leaves the compose to attach it ("Attach Sign-in page"); the `bootstrap` `resume` loop above.

## Behaviours confirmed good

- E5 landed flip and debrief read cleanly; E5 real pages show "You trusted the real ones" with clean titles; reporting rows say "A report warns everyone else."
- E5 tally "Phish caught 3 of 3, Reported rather than just deleted 3 of 3"; the real items scored 100 each.
- E6 flip and result: "Text messages", "QR codes", "Pressure: caught 2 of 2" now include the barrier notice.
- E7 landing advisory and the flip card read correctly; the three flags on the cloned voicemail (callback pressure, secrecy, borrowed authority) are named in the debrief card.
- Check pairs: Joanne's opening and post lines, "No baseline" copy, critical-miss line and skill grids all read correctly; no regression against P6.
- No stalls: every episode and check finished.
