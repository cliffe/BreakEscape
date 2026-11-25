# CA pilot mechanics plan: design review, round 3 (delta)

Reviewed: `CA_PILOT_MECHANICS_PLAN.md` as committed at fad7e9947 (551 lines; unchanged at HEAD), the diff from 0ed4a2465, against R2 (`CA_PILOT_MECHANICS_REVIEW_R2_DESIGN.md`), with five targeted code reads. Paths are relative to the worktree root; engine paths are under `public/break_escape/js/`. VID1's walk-in/out fix is not reviewed, only this plan's use of it.

Counts: 0 BLOCKER, 2 MAJOR, 9 MINOR (new). R2: 14 of 14 resolved (N-m8 resolved subject to the server check the plan already lists).

Verdict: the rewrite answers every R2 finding, and the answers are sound: the `activeIf` window, the list-aware `stepAwayHeld`, Carry on writing the done global, `resumeOnDone`, E5 and E4 hold up against the code. Two things are left that would show in live proof. `resumeOnDone` brings the kiosk back but leaves the learner standing in the open-plan, which puts Fatima's found-stick set piece out of their sight. And the plan's E4 action records use field names the engine does not read, so the hint toasts and the stick take-back would silently do nothing.

---

## Part A. R2 findings

| R2 | Status | Where in the plan | Note |
|---|---|---|---|
| N-B1 permanent gate bars the learner | Resolved | 0 (gate rule), 1.1 step 4, 1.5 E1 "Live window", 1.7 gate block, 3 E1 test, `test_side_door_gate`, live (i)(j), 5 risk | `activeIf` reads `ca12_world_on && !ca12_world_done`; inert gate opens on the learner's click from either side through `exitOpen`, never turns an opener back. The risk entry (studio open to anyone outside the window) is reasoned and fine. |
| N-M1 success-screen hold lost | Resolved | 2.5 "The other readers", 3 E3 (c)(d), 5 | `stepAwayOn`, `stepAwayHeld` and the post-defend panel read the normalised list; `found_stick` keeps `stepAwayBeatLive`; post-`mistake` panel shown on the stage advance. |
| N-M2 Carry on leaves the drop armed | Resolved in design | 2.5 "Carry on closes the beat", 2.6 Nilesh 3/4/6/7, Joanne 1/2, routes, live (d) | The take-back mapping as written does not run (N3-M2). |
| N-M3 no way back to the kiosk | Resolved for the runner | 2.1 step 6, 2.5 `resumeOnDone`, 3 E3 (f), live (a)(b)(b2) | The runner comes back, the learner's position does not (N3-M1). |
| N-M4 flip line has no reader | Resolved | 1.5 E5, 1.7 strings and fallback, Lorna 4/5 | `ca12_tailgated` only when outcome is not `got_it`. ca12 has no `ByChoice`/`ByHost` strings (`scenario.json.erb:632` is the only flip line), so the fallback is reached on a timeout. Wording of one ending: N3-m6. |
| N-m1 Yusuf `reported` walk-over | Resolved | 1.3 Yusuf, 1.7 Yusuf 4, 5, 8 | |
| N-m2 Delphine loop | Resolved | 1.3, 1.7 Delphine 1-3 (`ca12_delphine_at_door`) | |
| N-m3 "not yet walked" | Resolved | 2.6 Nilesh 2 (`onceOnly`) | |
| N-m4 `ca12_gate_open` all episode | Resolved | 1.7 Lorna 7, 8, 11 | |
| N-m5 hold end with a chat or kiosk open | Resolved | 1.5 E2 "An open minigame", 3 E2 | |
| N-m6 Jun in `got_it` | Resolved | 1.1 step 4, 1.7 Lorna 2, 6 | Decision recorded. |
| N-m7 re-drop clock | Resolved | 2.1 step 5, 2.6 timer note | |
| N-m8 unfound stick window | Resolved | 1.5 E4 `remove_world_item`, 2.6 | Server acceptance of the room-state removal stays a listed check. |
| N-m9 test gaps | Resolved | 3 | New gaps in N3-m9. |

---

## Part B. New findings

### MAJOR

#### N3-M1. `resumeOnDone` reopens the runner wherever the learner stands, so the post-defend step-away starts in the open-plan, out of sight of Fatima's set piece

Plan section: 2.1 step 6 ("the same way ca12's hand-back ends"), 2.5 `resumeOnDone`, 3 live ca15 (f).

Problem: ca12's hand-back moves the learner back to the kiosk (world-play `handBack`). `resumeOnDone` only reopens the runner overlay. After the find or the timeout the learner is in `open_plan` (they had to be, to watch Joanne), so the flip and the defend triage run with the learner standing there, and the post-defend Look up closes the runner and leaves them in `open_plan`. Fatima's found-stick set piece takes place in the training room: the stick reveals at (1.15, 5.4), she walks to (1.5, 5), and both her ask bark and `kit_ca15_asked` are `whenPerceivable: true`. With the learner next door, the ask waits until they happen to walk back, and the scenario's `kit_ca15_t_done_out` timer (plan 2.6; I did not read its condition) may close the set piece unseen. That is the plan's hard pass condition (f) failing, and the defender's practice beat (P1, O3) going missing in the very run that used the drop.

Evidence: `scenarios/ca15_shadow_it/scenario.json.erb:939-990` (Fatima's `kit_ca15_out` mappings, `patrolOverride` to (1.5, 5), ask bark and `kit_ca15_asked` both `whenPerceivable: true`); `office_kits/tarrowby_logistics.json:668-700` (stick position in the training room); plan 2.5 (`resumeOnDone` says nothing about position), 2.1 step 6.

Fix: give `resumeOnDone` the same return as ca12: before reopening, if the player is not in the kiosk's room, move them to the kiosk's return position through the same helper `handBack` uses (one shared function, so both episodes "end the same way" in fact). If the owner prefers no teleport, the alternative is a toast ("Head back to the kiosk.") and a reopen on `room_entered:<kiosk room>`, but that brings back the dead time R2 N-M3 removed. Add to E3 test (f): the player is in the kiosk room after the automatic return; and to live ca15 (a)/(b): the learner is back at the kiosk, then (f) runs with Fatima's ask heard.

#### N3-M2. The E4 action records use field names the engine does not read

Plan section: 2.6 Nilesh 7, 1.7 Lorna 9, 10 (`actions: [hint]`), 1.5 E4, 2.4.

Problem: in `apply-actions.js`, `hint` reads `action.message` and `remove_item` reads `action.item` (a type, id or name, or a list). Nilesh mapping 7 writes `{ type: "hint", text: ... }` and `{ type: "remove_item", itemId: ... }`. Copied as written, the toast never shows and the stick is never taken back from the inventory: `remove_item` logs "not held, no-op" because `heldMatches([undefined])` finds nothing. N-M2's leak (the attacker's stick carried into the defend half, droppable during Fatima's set piece) returns, and the gating hides it, since nothing fires on the later drop. `take_off` does read `itemId` (`:436-437`), so Lorna 11 is correct. E4's validator rule ("the same action schema as `triggerOnInteract`") only catches this if that schema rejects unknown keys.

Evidence: `systems/apply-actions.js:292-293` (`hint` on `action.message`), `:333-348` (`remove_item` on `action.item`, no-op when not held), `:436-437` (`take_off` on `action.itemId`); lab `scenario.json.erb:1377`.

Fix: write `{ "type": "hint", "message": "Nilesh has his stick back.", "condition": ... }` and `{ "type": "remove_item", "item": "ca15_red_stick" }` in 2.6, and `message` in Lorna 9 and 10. Pick one key for the new `remove_world_item` and say why (`item`, to match `remove_item`, is the least surprising). E4's validator: per action type, a required key is present and unknown keys are an error (a warning at least), with a unit test that `{ type: "hint", text }` is rejected.

### MINOR

#### N3-m1. "Nilesh has his stick back." shows when the learner never had it

Plan 2.6 Nilesh 7, 2.5 Carry on. Carry on from the first panel (no Look up) writes `ca15_drop_done`, so mapping 7 fires, and its hint condition is only `!ca15_drop_found`. Fix: `globalVars.ca15_drop_given && !globalVars.ca15_drop_found`. Add the case to E3 test (e) or the route "Carry on skip from the first panel".

#### N3-m2. A reload between the done global and the reopen loses the automatic return

Plan 2.5 `resumeOnDone`. The load-time watcher starts only when the beat is picked and `doneGlobal` is still false. A reload inside the 3 s grace (or with a chat open when the global landed) finds the global already true, starts nothing, and the learner has to find the kiosk alone, which is the dead time N-M3 removed. Fix: at load, start the watcher when the beat is picked and the episode stage is still the beat's `after` stage, whatever `doneGlobal` says; if it is already true the watcher reopens after the grace. Add to E3 test (f).

#### N3-m3. Closing the `red_stick` chat before the give leaves the beat with no stick and no prompt

Plan 2.1 step 2, 2.6 ink, Nilesh 1 (`onceOnly`). If the learner closes the chat before `#give_item`, `ca15_drop_given` stays false, so the nudge timer never starts and Nilesh mapping 1 will not fire again. Only the kiosk's waiting panel remains, and nothing points to it. Fix: Nilesh's hub routes to `red_stick` when the beat is picked (an ink global the scenario sets on `episode_world_beat`, or test `ca15_drop_given` plus a `ca15_drop_offered` flag) and the stick is not yet given. Add an `inkcheck` case.

#### N3-m4. Joanne's "I'll just plug it in" plays after she has plugged it in, and the reopen can clip it

Plan 2.1 step 4, 2.6 Joanne 2. `npc_used:<target>` fires when the use ends (`npc-needs.js:3768`, after `useSeconds` 6), and the same mapping sets `ca15_drop_done`, so the line plays six seconds late and the runner reopens 3 s later, over the session-note toast and possibly the tail of the bark. Fix: put the bark on `npc_use_started:ca15_ops_pc` (`npc-needs.js:3647`; payload `{ npcId, objectId, need }`, no tag, so condition `data.npcId === "ca15_joanne_pell" && globalVars.ca15_drop_found && !globalVars.ca15_drop_used && !globalVars.ca15_drop_done`, `onceOnly`), and keep the note, task and done global on `npc_used`. Make the grace 4 s, or start it after the bark's audio ends if the bark system reports that. Confirm in the needs code that a carry-use emits `npc_use_started` (the emit sits on the shared use path, but check it is reached for `job.carrying`).

#### N3-m5. `got_it` with the hi-vis: if the learner misses Delphine's hold, about 60 s of nothing

Plan 1.1 step 4, 1.7 Delphine 2, Yusuf 1 (gated off for `got_it`), E2 `holdMaxMs` 75000. Delphine holds the door for 8 s and walks back. Jun does not run in `got_it`, Yusuf's courier bark is gated off, and the no-vest toast does not apply, so a learner who hesitates waits out the rest of the 75 s with no prompt and no way in. Fix, data only: a timer on Delphine's return (`ca12_delphine_back`, about 10 s) that sets `ca12_world_done` when `!ca12_entered`, so the hold ends with the "never got past the lobby" fallback; or a second toast from Jo at her return ("She won't come back. Next time, move while it's open."). Add to the ca12 routes.

#### N3-m6. The `reported` ending gets the "stopped at the door" line

Plan 1.7 `flipDefenderLineByGlobal` 3. In `reported` Yusuf walks to the learner at the desk, so "Yusuf stopped you at the door" misdescribes it, and the desk deserves the credit. Fix: add an entry before `ca12_challenged`: `ca12_guard_alerted`: "The desk didn't buy it and called security. Both layers held." (wording to the dialogue pass). The route for `reported` checks the line.

#### N3-m7. Camila's `walkIn` names "offscreen" but the plan needs her on the lobby side

Plan 1.6 (`walkIn: { from: "offscreen", to: { x: 6.5, y: 4.5 } }` "on the lobby side"). The target tile is in the studio. If VID1 resolves `"offscreen"` relative to the target's room (the nearest studio edge), she never crosses the lobby or the gate, and the trailer's step-away shot is lost. Fix: use the explicit form, `from: { room: "lobby", x, y }` (a lobby edge tile out of the camera's view), or confirm with VID1 which room `"offscreen"` uses. Also confirm with VID1 how its "locked door fades the walker" rule judges the studio doorway (the studio is `locked` with a key in scenario data, though the start room counts as unlocked server-side): a registered `openFor` gate should win over the fade. Live (h) covers both once that is settled.

#### N3-m8. Engine live proofs wait until after TTS

Plan 4, "the full suites and the live proofs run once the scenarios are voiced (steps 13-14)". The two test scenarios and the lab regression need no voice, and E1 and E3 are the risky pieces. An engine bug found at step 14 sends the work back through the shells, dressing and voicing. Fix: run the `test_side_door_gate` live proof and the lab records-door regression right after step 1, and the `test_episode_world_beat` live proof right after step 5, each on its own committed hash; keep the episode live proofs at step 14.

#### N3-m9. Test gaps after this round

Section 3. Add:
- E3 (f): after the automatic return the player is in the kiosk room (N3-M1); the load-time watcher starts when picked and still on the `after` stage with the done global already true (N3-m2).
- E4 validator: a known action with a missing required key or an unknown key (`hint` with `text`, `remove_item` with `itemId`) is rejected (N3-M2).
- ca15 routes: Carry on from the first panel shows no take-back toast (N3-m1); the `red_stick` chat closed early, then the hub offers it again (N3-m3).
- ca12 routes: `got_it` with the hi-vis, learner never moves, the hold ends shortly after Delphine's return (N3-m5); `reported` flip line (N3-m6).
- ca15 live (a): the use bark is heard in full before the runner reopens (N3-m4).

---

## Part C. Checked and fine

- **Gate window and reload.** `_settleWorld` writes `ca12_world_done` on a reload while held, which closes the window and fires Lorna 11 (`take_off` when worn), Yusuf 8 and Jun's return. On a reload after the beat, `ca12_runner_go` does not re-emit, so Jun stays at his desk.
- **Scenario timers survive a reload** (`ui/scenario-timer-dispatcher.js:9`, `:93-115`: a timer whose start global is already set resumes from saved game time). The ca15 90 s, 30 s and 60 s timers keep counting across a reload.
- **No tag clash with the kit.** The kit's found stick `kit_ca15_stick` is a fixed, non-takeable object with no `needsTag`, and no Tarrowby NPC has an interest in `tag_ca15_stick`, so a red stick dropped in the training room is never picked up by Fatima or Chidi.
- **E5 order.** ca12 has no `ByChoice` or `ByHost` strings, so `ByGlobal` then the neutral fallback is the whole choice.
- **Synced state.** One new episode-state boolean per beat; every global scalar; toggling globals (`ca12_wearing_hivis`, `ca12_gate_open` inside the window, `ca12_delphine_at_door`) send one delta per change; E4 removals are one room-state delete and one inventory remove, once. Nothing grows.
- **Mapping order and indices.** Everything appended; Camila's edits in place with mapping 2 turned into a placeholder; mapping 13 kept.
- **Order of implementation.** VID1 first; E4 before E3, which `test_episode_world_beat` needs; E1, E2, E4, E5 all before the ca12 shell. Only the timing of the engine live proofs needs moving (N3-m8).
- **Softlocks.** With the window, Carry on on both panels and the hold always ending with its global set, I found no state with no way forward. N3-m3 and N3-m5 are dead time, not locks.

---

## Part D. Fun and the offensive-perspective USP (brief)

- **ca12.** The watch-wait-follow loop behind Jun is still the best moment in either episode, and E5 now gives each ending its own payoff line, which lifts O1 and O3: the flip says what actually got the learner in. Jo's voiced line in the learner's ear is the attacker's own read of the door. The `got_it` path is the thinnest (Delphine does the work); N3-m5 keeps its miss short. Score: strong.
- **ca15.** The drop is a small deduction puzzle (where do people pause?), and "She was being kind" frames the weakness as human, in the course's own terms. The automatic return makes the ending clean, but only N3-M1 makes the two sticks read as one story told from both sides: as planned, the learner can miss the second stick altogether. With N3-M1 and N3-m4 fixed, the find is the trailer's best shot and the flip lands straight after. Score: good, rising to strong if Joanne's kettle timing tunes well live.
