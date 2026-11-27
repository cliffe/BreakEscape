# SIMS-4 review, round 1: design and engine view, with live proof

Branch `build/ol-sims` at 5118f584d (the merge of SIMS-4, `build/ol-sims-2` up to 80d0318a5, into
the SIMS-1 to SIMS-3 branch). Keyless server :3095 from the p-ol-sims worktree, headless chromium.
Every game is a fresh `new-game.rb test_needs_sims` game. No need level was set and no trigger event
was emitted: every break below came from the scenario's own mappings, doors walked through and
conversations opened and closed in their UI.

| Game | What I ran |
|---|---|
| 4439 | `probe.mjs`: Neil talked to and closed before the staff room ever loaded (what the count beats do); then the first visit at the boiler (screenshots); a step out of the west door and back in; a wait of more than two minutes after the last break; Neil through his UI (flickering light, ask, ready, exit); straight into the staff room (the real Neil-close start); Jodie's light choice; Jodie and Keith reopened; Neil reopened |
| 4439 (reloaded) | `tone.mjs`: the staff room's room tone after entry |
| 4440 | `speechlock-variant.mjs` (the builder's speech-lock beat plus one change: the kitchen and lounge doors opened before parking in the office), 8 minutes |

Scripts, reports and screenshots are in scratchpad `officelife-sims/s4-review-r1-design/`
(`report-4439.json`, `run-4439.out`, `r-4439-*.png`, `report-sr-speechlock-4440.json`). I did not
touch game 4434 (the orchestrator's schedule rerun on :3093).

Counts: 1 blocker, 3 major, 5 minor.

## What holds

- **First visit.** 4439: entry at 22.5 s of needs clock, Keith's boiler use at 25.3 s, Jodie's at
  27.8 s; `exchange_waiting` played with every line `overheard: true`; both back home and seated by
  70 s. `r-4439-b2.png` shows the pair side by side at the counter with "Quiet on the radio tonight."
  over them; `r-4439-c-seated.png` shows Jodie on the north chair facing north and Keith on the south
  chair facing south.
- **Step out and back in** (not in the builder's counts). 4439: out to IT at 71.8 s and back at
  75.0 s, `room_entered:staff_room` with `firstVisit: false`, no staff-room use start in the next
  12 s, both NPCs idle at home. The `firstVisit` condition does its job.
- **The real Neil-close start.** 4439, with the staff room loaded and 135 s after the last break:
  Neil closed at 195.5 s, Keith's boiler use at 197.5 s, Jodie's at 200.0 s, and the first line of
  `exchange_job_called` ("That light in here still flickering?") heard at 200.0 s as the player came
  through the door (`r-4439-e1.png`). The mechanism works; see B1 for why the counts do not show it.
- **Neil's merged conversation.** 4439: the first chat offers six choices with "The staff room
  light's flickering." fifth; once picked the hub comes back with five and the choice gone
  (`r-4439-d2-neil-after-flicker.png`). The ask then swaps for "Is that change log ready?", which
  gives the honest not-yet line ("Have a look on the copier tray, pet. It'll be there if it's come
  through."), and the exit closes the chat. Reopened later, Neil starts fresh with his greeting, the
  ready choice and no light choice (`r-4439-g-neil.png`). SIMS-3's ask/ready/exit rework survived the
  merge.
- **Room tone.** 4439 reloaded: `officeRoomTone.profileFor('staff_room')` is `kitchen`, and the log
  shows `started staff_room kitchen_tone` on entry.
- **The "no engine or server line" claim.** `git diff --stat b2285b4d8 80d0318a5` (merge base to the
  SIMS-4 tip) touches only `scenarios/test_needs_sims/*`, `test/js/validator-office-presets.test.mjs`,
  two proof tools and docs. Nothing under `public/break_escape/js/` or `app/`. The claim holds for
  test_needs_leash, lab_physical_pentest and test_access_work. It does not cover the part of the
  standard live set that runs in this scenario (see m2); game 4440 fills that gap.
- **`cooler_chats: 0` in 4369 is a probe artefact.** The speech-lock beat walks IT, the staff room, IT
  and the office, and never opens the kitchen or the lounge, so `water_cooler` was never loaded and
  Rosa never existed. With those two doors opened first (4440), the same beat recorded
  `cooler_chats: 3`, `see_chat`, `see_rest`, `see_meal` and `see_drink` ticked, Neil moved 1 px and no
  office chat turn was blocked. Not a regression.

## Blocker

### B1. The job-beat and boiler-crossing counts measure the first visit, not the Neil-close start

- **Tool:** `tools/playtest/needs-sims-staff-room.mjs:108` (enters `it_room` only), `:160-162`
  (`job_beat`: talk to Neil, then `enterRoom('staff_room')`), `:178` (`boiler_cross`: the same without
  the report). Driver `officelife-sims/s4/finish/driver.sh` makes a fresh game for every run.
- **Docs that claim the start:** README:936-937 (steps 2 and 3, 5/5 and 10/10 PASS), README:952
  ("Game 4346: the Neil close ... starts Keith's boiler break (the `conversation_closed:neil` mapping,
  21.3 s)"), build log SIMS-4 counts paragraph.

**Evidence.** In a fresh game the staff room has not loaded when the player talks to Neil, so Keith
is not registered and his `conversation_closed:neil` mapping does not exist yet. 4439, step A:
`npcNeedsSystem.getState('keith')` is `null` before and after a Neil close, with `window.rooms`
holding only `office` and `it_room`. The walk that follows is the player's first entry, so the break
comes from the first-visit mapping (2 s delay), not the Neil close. The builder's own reports agree:

- `report-sr-boiler_cross-4384.json`: the only staff starts are at 22.8 s and 25.3 s (the
  first-visit timing), the exchange heard is `exchange_waiting`, and `hear_waiting` ticked. All ten
  boiler "crossings" are first visits, so "a line heard 10/10" counts first-visit exchange lines,
  not pool lines on a crossing.
- `report-sr-job_beat-4376.json` (and 4346): starts at 23.8 s and 26.3 s. `exchange_job_called` plays
  because `job_called` is set and its knot sorts first on Jodie's list, on a first-visit break.

So plan 5.4 steps 2 and 3 ("each more than two minutes after the first visit" / "after the last
start") have no valid run, and "breaks started by leaving a conversation" has no count. The README's
line that a player should expect "a voiced line or two on a crossing and picture chat for the rest"
(README:143) is also unmeasured, since no crossing in the counts was a crossing.

**Suggested fix.** In `job_beat` and `boiler_cross`, enter the staff room first, wait until both NPCs
are back home and more than 120 s have passed since the last `npc_use_started:staff_*`, then talk to
Neil and walk in (the order in `probe.mjs` step D, which passed once on 4439). Assert that the first
staff start comes within 5 s after `conversation_closed:neil` and that no `room_entered:staff_room`
with `firstVisit: true` falls in the window. Rerun 5 job beats and 10 boiler crossings, record pool
lines heard and unheard on each crossing, and correct README:936-937, :952 and the build log.

## Major

### M1. Keith and Jodie open every later chat with their goodbye

- **Ink:** `scenarios/test_needs_sims/ink/keith.ink:26-29`, `scenarios/test_needs_sims/ink/jodie.ink:56-59`
  (`#exit_conversation` on the choice, then `-> hub`).

**Evidence.** 4439: Jodie reopened after an exit starts with "Nae bother. Away you go." above her hub
(`r-4439-f3-jodie-reopen.png`); Keith reopened starts with "Right you are. Mind how you go."
(`r-4439-f4-keith-reopen.png`). This is the stale farewell SIMS-3 R2 fixed for Neil in e580a4d17
(`neil.ink:48-52`: the farewell, then `# exit_conversation`, then `-> END`). The validator's dialogue
lint flags both lines (`jodie.ink:27`, `keith.ink:26`). The tour sends the player back to Jodie for
the light, so every player who follows it sees the goodbye as a greeting.

**Suggested fix.** Copy Neil's exit in both files: the farewell line under `# speaker:npc`, then
`# exit_conversation`, then `-> END`. Recompile and reopen each twice through the UI.

### M2. The node tests plan 5.4 names were not written

- **Plan:** 5.4 "Node tests": `test/js/npc-needs.test.mjs` (the use-start coupling sets the partner's
  need only for the named `npcId`; a microwave trip and the partner's own start set nothing; a use
  started straight from another job still brings the partner; `chatterCooldownMin: 0.25` allows a
  pool line 15 s after the last; a `needs.set` from a `room_entered` mapping on an NPC whose room is
  not loaded does nothing; Jodie's exchange order and gates) and `test/js/npc-needs-sims-validator.test.mjs`
  (the new lines).
- **Build:** the SIMS-4 diff changes only `test/js/validator-office-presets.test.mjs`; `grep` finds no
  `keith`, `jodie`, `staff_` or `exchange_job` in either named file.

The build log lists what was updated and does not claim these, but the plan made them part of the
slice. Two of them pin exactly the behaviours B1 shows the live counts missed (the unloaded-room
`needs.set` and the exchange gates), and `exchange_job_cleared` never playing before
`heard_exchange_job_called` has no proof at all, live or in node.

**Suggested fix.** Add the six cases to `npc-needs.test.mjs` with the stub world and the sims lines
to `npc-needs-sims-validator.test.mjs`; run `bin/test-js` on both and note the counts in the build log.

### M3. The flickering light the player reports does not flicker

- **Data:** `scenarios/test_needs_sims/scenario.json.erb:1082-1087` (`staff_room` has no `lighting`
  block; the scenario's top level at :12 is `{ "enabled": true, "defaultMode": "on" }`).
- **Where the flicker is named:** task `hear_job_called` (:172), Neil's choice (`neil.ink:42-46`),
  `exchange_job_called` (`jodie.ink:75-79`), Jodie's "No more flickering" (`jodie.ink:49`).

**Evidence.** 4439: `gameScenario.rooms.staff_room.lighting` is `null`, and every staff-room
screenshot shows a steady room, including `r-4439-e1.png` where Jodie asks "That light in here still
flickering?". The showcase's purpose is that the player sees what the story says. The lighting system
already supports a faulty panel that a global switches off (`systems/lighting.js:17`, `flicker: true`,
and the per-room `variants` at :33-35, merged by `resolveRoomLighting` :388), so this needs no engine
line, and m02's own fault can then copy it.

**Suggested fix.** Give `staff_room` `"lighting": { "flicker": true, "variants": [{ "condition":
"globalVars.job_cleared === true", "flicker": false }] }`, render it once before and once after the
global, and add a README tour line: the room flickers until Jodie says she swapped the tube.

## Minor

### m1. Jodie's light choice stays on screen after it is picked, and comes too early

- **Ink:** `jodie.ink:47-51` (`#set_global:job_cleared:true` with no `~ job_cleared = true`).

4439: after "Did that light get sorted?" the hub comes back with the same four choices, the light one
still second (`r-4439-f2-jodie-after.png`); it only goes on reopen (the global syncs on load). Neil's
choice has the in-story `~` assignment for this reason (merge commit 5118f584d). The choice also
appears in the same visit, seconds after `exchange_job_called` where Jodie herself says "Someone'll
be up to fix it soon", so she claims to have swapped the tube while she has been at the boiler the
whole time. Plan 3.4 calls this "a later visit".

**Suggested fix.** Add `~ job_cleared = true` after the tag. Gate the choice on
`heard_exchange_job_called` as well (declare the VAR), so it follows the exchange. Consider giving the
"soon" line to Keith ("Someone'll be up soon, Jodie.") so the maintenance worker is not waiting on
herself.

### m2. The speech-lock check has too small a sample, and its doors were not all open

- **Tool:** `needs-sims-staff-room.mjs:224-227` (opens IT and the staff room only).
- **Docs:** README:941 ("0 of 6"), README:945 ("The office beats with every door open ran inside game
  4369"), build log lines 263-265.

4369 counted 6 office chat turns in 15 minutes and my 4440 (all doors open) counted 5 in 8 minutes.
One blocked turn in either would read as more than 1 in 20, so neither run can decide whether the
owner engine item is needed. README:945 is also wrong: 4369 never opened the kitchen or the lounge
(see "What holds"). 4440 now covers the doors-open office beats (17 office tasks ticked, Neil still,
three cooler chats).

**Suggested fix.** Make the speech-lock beat open every door, as `speechlock-variant.mjs` does, and
drive office chats with the scenario's own levers (the Activity Board and the Kitchen Rota, read
through the interaction path) until at least 40 office turns are counted. Correct README:945 and the
build log's "open for review" note.

### m3. Step 1 did less than plan 5.4 step 1 asks, and two cells sit half a tile apart

`sims4-step1.mjs` (report `s4/step1-report-4340.json`) checks that each approach cell is walkable but
does not run the path search from both homes to each second-user cell, and does not log Keith's and
Jodie's jittered values at load or on each restore. The "computed" schedule in README:114-122 is read
back from the 4360 run, so step 6's pass compares the rerun with an earlier run (a determinism check)
and the values at thirst 90 ("about 9:54", "about 17:40") are predictions until game 4434 reports. The
microwave's approach cell (540, -140) is 16 px from the boiler's second-user cell (524, -132): not the
same cell, so the plan's rule does not fire, but the two bodies would overlap if a microwave trip met
a boiler break.

**Suggested fix.** Add the two path searches and the jitter log to `sims4-step1.mjs`; label the README
times at 90 as expected until 4434 confirms them; move the microwave `useFrom` to `dx: 1` if the
overlap ever shows.

### m4. The cooler crossings do not honour the two-minute spacing

`needs-sims-staff-room.mjs:182-183`: first visit, a 45 s wait, then the private-office crossing. In
`report-sr-cooler_cross-4402.json` the boiler break starts at 17.8 s and the cooler at 68 s, about 20 s
after the boiler break ended. The start is genuine (the `room_entered:manager_office` mapping, no
other start nearby), so the count stands, but plan 5.4 step 4 asks for more than two minutes after the
last start. **Suggested fix:** wait 120 s after the boiler break's last use start before the crossing
when the beat is rerun with B1's fix.

### m5. Small doc and data nits

- README:124 and :128 say the cooler cell is "one tile west of the preset's"; the data is
  `{ "dx": -1, "dy": 1.5 }` against the preset's `{ "dx": 0, "dy": 1 }` (`data/office-presets.json`),
  so it is also half a tile south. Say so.
- The validator suggests `"fireOnlyWhenLoaded": true` on Jodie's `room_entered:manager_office` mapping
  (`scenario.json.erb:1197`). That states the intent (the effect only matters once the staff room is
  loaded) and clears the relay warning.
- Jodie's chat portrait is the heavily upscaled headshot (`r-4439-f3-jodie-reopen.png`), as the
  handover expects; it stays on the art-request list (plan 6.4). Not counted.

## Transfer to m02

The patterns transfer as built: claim-by-base-type objects with preset fill, tile homes beside static
seats, couplings on the use start with an `npcId` condition, the first-visit start with a delay, the
gated exchange list on the lower id, and the room-tone map. The two things m02 should not copy are the
exit pattern in M1 and the count method in B1: m02's burn and Kim's-office starts are conversation
closes in rooms loaded long before, which is exactly the case the counts did not exercise.
