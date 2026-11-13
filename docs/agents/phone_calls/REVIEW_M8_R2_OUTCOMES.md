# M8 round 2 outcomes (m01 first ring and bring-in)

Fixer: Sonnet, 2026-11-12. Proofs in `proofs/M8_r2/`, route `tools/phone_calls/routes/m08r1_live.sh` (new cases `quick_cb`, `order_answer|decline|miss`, `caption`) plus `m08_live.sh bring_keep|bring_end`. Config, ink tag and lab sheet only; no engine file touched.

| Finding | Outcome |
|---|---|
| M1 tutorial hold has no limit | Left alone: engine work, owned by the parallel sweep (log item 9). |
| m1 reload mid-tutorial missed call | Left alone: engine sweep. |
| m2 tour text mid-callback | Fixed in config. The tour is folded into the 1.5 s decline/missed follow-up ("Texting from here, then. Now get a feel for the place. ... Start broad."), which also sets `m01_tour_sent`. The two 5 s mappings are gone. The folded text dropped "before you go deep" to stay under the 30-word text cap (the validator errors at 33). The answered path still gets the full tour after the call. |
| m3 lab sheet line 387 | Fixed, HacktivityLabSheets `560d7fa`: "...message Agent HaX to report Operation Shatter. You call her in later to be debriefed." |
| n1 stale `_comment` | Updated. |
| n2 "You're in." after a long hold | Left: no cheap fix that avoids re-keying a voiced line. |
| n3 bring-in caption | Contact-level `callLabel: "SAFETYNET secure line"` on `agent_0x99`. |
| Rule change: bring-in `#ending_check` | `+ [On my way. #ending_check]` in `closing_debrief`, as m03 to m06. The README's "A player choice starts it" soft-lock note does not apply: the choice sets nothing before the tag, and the global is set after it. README not edited (outside my paths); its bracket bullet (line 2298) is the matching rule. |

## Checks
- Ink recompiled. Key diff against `keys_baseline_a1`: m01 +11 / -0, the same 11 keys as before (the tag move changes none).
- `validate_scenario.rb` and `validate_phone_calls.rb`: no errors or warnings. `dialoguelint`: no errors, no `ending-check-after-bracket`. `tts_mission_lines_test.rb`: 5 runs, 0 failures.

## Live proof (keyless :3026, headless, server stopped; own pid file because another server's pid file sat in the worktree)
- `quick_cb_fast.txt`: declined, call back clicked 2.7 s later. The tour row was already in the thread (it landed at about 1.5 s); no tour text during the call; the thread reads Texting-from-here+tour, "You rang back", the opener, nothing after. Tour count 1. `quick_cb.txt` is the slower (4.9 s) variant, same result.
- Tour count is 1 in each order: `order_answer` (tour after the call), `order_decline`, `order_miss` (banner gone after about 20 s; the follow-up text carries the tour).
- `bring_keep`: Keep going leaves the call open on "1. On my way."; End from the thread later returns to the hub; no debrief. `bring_end`: End the mission now closes the call and `start_debrief_cutscene` is true; the person-chat debrief opens.
- `caption.txt`: the bring-in call placed from her hub shows `call-caption` = "SAFETYNET secure line".
