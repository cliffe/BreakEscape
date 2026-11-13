# Review M7 round 1 (m03: revelation call, fallback ring, bring-in)

Reviewer: Opus 5.5, 2026-11-12. Commits 74525b367 (config and ink), e557d48bf (proofs, route, log); HacktivityLabSheets b03dfbb.

**Verdict: accept with fixes. 0 B, 1 M, 2 m, 3 n.**

## What I checked and how

- Merge: the m03 ink on `build/phone-calls` is byte-identical to `build/phone-calls-writing` HEAD (writer R3 sign-offs included: "Copy. Go carefully, {player_name()}.", "Good. Back to it."). The ERB differs from the writing branch only by the `call` list, the distcc text losing `targetKnot`, the two ring mappings and the two `extract_offer` comments. Everything under "Config the implementer must add (M7)" in `WRITER_HAX_CALLS.md` is there, and plan 7.2 row m03 is met.
- Key dump of the working tree (`dump_tts_keys.rb` with labels, then `compare_tts_keys.rb` against `keys_baseline/`): m03 0 removed, 22 added, the same 22 hashes as `proofs/M7/keys_added_m03.txt`. None of the 22 appears in any other scenario's current dump or baseline. The bring-in lines also have no whole-line match in any other mission's ink.
- `tts_mission_lines_test.rb`, six runs under the suite lock with random seeds: 6 × (5 runs, 0 failures).
- Live, keyless :3029, headless (my route in the scratchpad sources `tools/phone_calls/routes/m07_live.sh`): game 2083 `decline_reload` and game 2086 `keep_wait`. Server stopped afterwards. I also read the implementer's six proof logs.

## Findings

### M1. A declined fallback ring rings again after every reload, and clears the waiting Call back

Live, game 2083: distcc flag in; the ring arrives at 120 s; Decline gives a "Missed call" row and a "Call back" header button (callback `m2_revelation_call`). After a reload the callback is restored. 131 s after the load she rings again: the new offer clears the callback (`phone-ringer.js:368`, rows 1 and 7), and a second Decline leaves two "Missed call" rows. This happens on every reload until the player rings her.

The log calls this "by plan" (note 3). The plan's M7 row does not mention a latch, but the plan says the opposite of this outcome in 2.3 row 27: "Its trigger was persisted at offer (2.7), so a `room_entered` or `game_loaded` mapping can't offer the same call again on top of the callback." The `game_loaded` twin escapes that rule because it has no `onceOnly`, and it needs none, since it has to fire on every load while the delay is still pending. The persisted trigger belongs to the first mapping and does not cover the twin.

A player who declined and has a Call back waiting has already made a choice. Ringing again after a reload repeats a call they turned down, adds a second missed row and swaps their callback (whose opener is "Knew you'd get back to me") for a fresh ring. The revelation is never lost without the second ring: the Call back button, the plain Call button (`when` still holds) and the hub topic all stay.

Fix (config only): latch on the offer.
- Declare `"revelation_ring_offered": false` in `globalVariables`.
- Add `"setGlobal": { "revelation_ring_offered": true }` to both ring mappings. A ring mapping's side effects run when the call is offered (plan 3.1), so a reload inside the two minutes still re-arms.
- Add `&& !globalVars.revelation_ring_offered` to the twin's condition, and to the first mapping's for symmetry.

Then re-prove `reload_ring` (reload at 20 s still rings) and `decline_reload` (decline, reload, no second ring within 150 s, Call back still there and opening on "Knew you'd get back to me…"). Correct log note 3 in the same commit.

### m1. Lab sheet: "she calls you" is wrong for the bring-in

`m03_ghost_in_the_machine.md:87`: "When you are ready to leave, choose **[I'm done in here. Bring me in.]** and she calls you". The hub choice places an outgoing call (`#place_call:extract_call`): the screen shows "Calling…", the player's call. Suggested: "…choose **[I'm done in here. Bring me in.]** and the phone rings her: …".

The rest of the bullet is right: the "wants a call" text, Call button or topic, the two-minute ring, call back after a miss, Not yet ends the call. So is `:457` (Bring me in, On my way, the ending question, Keep going leaves the call open and you hang up), which matches what I saw live. No VM companion was opened or touched.

### m2. Bring-ins do not all behave the same on Keep going: m01 is the odd one out (cross-mission, for the orchestrator)

Both claims are true. They describe different ink forms, as README `README_scenario_design.md:2018` documents:
- **m03, m04, m05, m06** put `#ending_check` in the brackets (`[On my way. #ending_check]`). Keep going takes nothing and the call stays on `[On my way.]`. Live, game 2086: the call was still open on that one choice 2, 5, 10, 20 and 30 s after Keep going. `victoria_choice_made` stayed false and no last line was requested. The implementer's `bring_optional` proof agrees.
- **m01** puts `#ending_check` on a line inside the choice body (`m01_phone_agent0x99.ink:990-995`). The choice is taken, Keep going drops the line and its tags, the story runs out and the call ends by itself about 2 s later. That is what M8 R1 saw.
- **m07** has no bracket check (`bring_me_in` is choice-free and the mapping carries `endingCheck: true`), so its Keep going holds the ending through the objectives panel.

For one behaviour across the bring-ins, move m01 to the bracket form: `+ [On my way. #ending_check]`, then `#set_global:start_debrief_cutscene:true`, the last line, `#exit_conversation`. m01 has no call-in task, so none of the C33 task-placement concern applies. That change is outside M7; it belongs in an M8 follow-up. m07's different form is by design (it has no "On my way" choice) and needs nothing.

### n1. Not flaky: the first `tts_mission_lines_test.rb` failure came from the shared tree moving

Six reruns all pass. The test has no randomness: it reads every m01–m10 ERB and compiled ink JSON from the working tree. Between M7's first run and its rerun, M8 committed 035051e34 (18:39), which narrowed the test to call, video-call and voicemail knots and put the `{player_name()}` text lines back in m01. Running the pre-035051e34 test against today's tree fails in the same "1 failure" way, on those 13 m01 text lines. So the one failure was this race in the shared tree, not M7's lines: no voiced m03 key prints a variable.

### n2. `proofs/M7/dbg/` is committed

Three debug files (`dbg_game_id.txt`, `dbg_session.jsonl`, `dbg_tts.jsonl`) from a scratch run went in with e557d48bf. They are harmless but not referenced by the log or route. Remove them or mention them in the log.

### n3. Proofs note: `tasks()` in the route reports `copy_staff_badge`, not the call-in task

`m07_live.sh` prints `task now: $(tasks | jq -c '.[0]')`, which is the first task in aim order (`copy_staff_badge`), so the "task now" lines in `bring_*.log` do not show `call_in_after_sweep`. The completion is still proven, by the logged `objective_task_completed:call_in_after_sweep` event (also in my `keep_wait` run, before the overlay). Filter the task by id next time.

## Checks that passed

- **`m2_revelation_call` `when` and `unavailable: "hidden"`.** Before the flag the header shows no button. While she is waiting the header shows "Call" (`call_button.log`). After the call the header is null and the hub topic is gone (`revelation_heard`). `extract_call` (`button: false`) never shows a button. `call_button` also shows no ring 125 s after a completed call (row 31 drop, and the mapping's re-check of `!globalVars.revelation_heard`).
- **Call knots.** Every knot in both calls is marked `// lint: call-knot`. None diverts to `hub` or `start`. The ending lines use `#exit_conversation` then `-> DONE`, the guard included. Choices are `+`, so a redial never runs out of choices.
- **Bring-in task rule.** `#complete_task:call_in_after_sweep` is on the `[Bring me in.]` reply, before `[On my way. #ending_check]`. The `#set_global`/`~ victoria_choice_made` pair stays in `extract_go`. Live: the task completed at Bring me in, and the overlay listed only Danny's task.
- **The 22 voiced lines.** All read as spoken on a call: "Logs are up on my side", "Thought I'd lost you", "Knew you'd get back to me", "Side door, two minutes. Don't use the lobby." None prints a variable (both `{player_name()}` uses were removed from call knots; the two that remain are text-hub lines). None has an inline stage direction. The redial opener "Still in there…" depends on the `extract_choices` visit count and works live.
- **Validator warning.** The duplicate-event warning on `global_variable_changed:flag_distcc_submitted` is harmless: the ring and the night-confrontation mapping are unrelated.
- **e557d48bf and the shared log.** The log diff is a pure 9-line append (the M7 section) after the M5 block, which had already been committed (7c0be1ba6). No other agent's line was added, removed or reworded. The rest of the commit is `proofs/M7/*` and `tools/phone_calls/routes/m07_live.sh` only.
