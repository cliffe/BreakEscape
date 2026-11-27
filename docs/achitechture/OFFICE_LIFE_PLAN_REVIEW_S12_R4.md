# Office Life plan, section 12: adversarial review, round 4

Reviewed: `docs/achitechture/OFFICE_LIFE_PLAN.md` sections 12, 13, 13b and 13c as revised in beeb69587,
against the working tree at that commit. Read-only; no code or plan edits. Paths are relative to
`public/break_escape/js/` unless they start with `scenarios/`, `scripts/`, `test/` or `docs/`. Finding ids
are new to this round; section 4 maps round 3's ids to an outcome.

**Count: 0 blockers, 3 major, 19 minor.**

## 1. Verdict

**Slices 21, 16, 18a, 18b-i and 18b-ii can be built as written, with the minors below added to their
briefs. Slice 17 is ready once M2 is in its text (two conditions on one call and two tests). Slice 19
needs M1, and slice 20 needs M3.** None of the three majors changes the design. Each is a rule the text
leaves out, and in each case building the text literally gives wrong events or silence.

Round 3's M1 is fixed where it matters most. `job.errand` is set only by the print errand, so Sofia's
footholds and Amara's deliveries keep today's path, and `GOLDEN_SIMS_DAY` cannot move: the sims fixture is
a hand-copied stub (`test/js/fixtures/needs-sims-world.mjs` 1-7), so showcase edits do not reach it, and
Amara's `amara_pc` hook is a `setGlobal`, which the need-use rule leaves alone (fixture 103). The
mechanism, though, calls `_checkCaught` without the guard that today sits at its call site (M2). Round 3's
M2 (no selection during a call) is fixed. M3 is fixed for owned prints, but the showcase text now claims
that recycling protects Sanjay's prints, which are unowned and are never recycled (m1). The coffee hint as
a state-worded trigger action is acceptable, apart from the alert's default title (m7).

A fifth full round is not needed. A check of the three majors' text after they are folded in is enough.

How this was checked: every round 3 fix was read against the functions it names (`_tickNpc`,
`_advanceJob`, `_completeJob`, `_goHome`, `_checkCaught`, `needsStop`, `fadeAmbientTo`,
`recalculateAmbientVolume`, the adapter's `revealOutput` and `describe`, `applyActions`' `hint`, the
mapping fields). The authored ambient rooms of m01, m04, m09, sis01 and sis02 were listed with their door
neighbours and order in `gameScenario.rooms`, to see what "own room first", "unknown key is no bed" and the
crossfade change in shipped missions.

## 2. Major findings

### M1. A colleague frozen on the way still answers after the phone has rung out (12.5, slice 19)

Round 3's m3 fix adds: "A colleague frozen on the way does not keep the phone ringing." It does not say
what happens to her job. A player chat freezes her with `mode` saved in `prevMode` and the job kept
(`npc-needs.js` 659-668). The phone rings out and emits `desk_phone_unanswered`. When the chat closes, the
unfreeze restores `job` mode and calls `_moveForPhase` (671-680), so she walks on to the phone, starts
`using` with the call chosen at her claim, voices half a call on a line that has already rung out, and
emits `desk_phone_answered`. One ring then fires both events, and the showcase's "Tom misses a call" and
"Ring Tom while he is out and see who answers" objectives can both complete from it. This is the lever's
own path: the player rings from the spare phone and talks to Amara as she walks past.

**Fix.** On ring-out, end every answerer job on that phone with a new turn-back reason, `rang_out`
(no `mindChanged`, no grumble, no fallback select, straight home, the same row as `answered`), and drop the
call chosen at the claim. A frozen answerer has its job cleared and `prevMode` set to `returning`, so the
unfreeze runs `_goHome` (682-683). Add `rang_out` to the 18a turn-back table. Node test: a colleague
frozen on the way, the phone rings out, the chat ends, and she goes home, with one
`desk_phone_unanswered`, no `desk_phone_answered` and no call lines.

### M2. The errand's `_checkCaught` call has no once-per-return guard and runs on the outbound leg (12.3, slice 17)

12.3 says "`_advanceJob` calls `_checkCaught` while `job.errand` holds and the NPC is in its home room".
Two things go wrong if that is built as written.

- **No guard.** `_checkCaught` does not check `caughtEmitted`; it only sets it (`npc-needs.js` 1393-1404).
  The once-per-return rule lives at today's call site: `s.mode === 'returning' && !s.atPost &&
  !s.caughtEmitted` (691). Called every tick from `_advanceJob`, it logs `caught_at_post` and emits
  `npc_caught_at_post:tom` four times a second while the player is at the desk. The showcase mapping's
  30 s cooldown (`scenarios/test_needs_sims/scenario.json.erb` 384) hides the bark, but not the log rows
  or the events.
- **Wrong leg.** The errand holds `job.errand` from its start, and the showcase copier is in Tom's home
  room (`office_copier` and `tom_pc` are both in `office`, scenario 93-216). From idle at his post,
  `_leavePost` resets `caughtEmitted` (1304), so a player standing within 1.5 tiles of Tom's desk
  triggers "Er, that's my desk. Can I help you?" and `completeTask: "see_caught"` as Tom gets up to fetch
  his print, before he has been away at all.

The listed test only checks the positive case (an emit on the way back).

**Fix.** Call it only while `job.errand && job.carrying && !s.atPost && !s.caughtEmitted`. Tests: a player
at the desk during the outbound leg gives no `npc_caught_at_post`; one errand gives at most one; an
errand started from `returning` (no `_leavePost`, so `caughtEmitted` keeps its value from this return)
emits at most once across the walk and the errand.

### M3. A crossfade that turns back mid-fade silences the room it returns to (12.6, slice 20)

12.6 says `fadeAmbientTo` "keeps the outgoing sound and fades it to 0 over the same duration". Today's
method holds one tween, `_ambientTween`, and a call for a key that is already playing does not restart it:
it stops `_ambientTween` and tweens the sound from its current volume (`systems/sound-manager.js` 360-404).
The obvious crossfade gives the outgoing sound its own tween whose `onComplete` stops it, as the fade to 0
does (374-389). Step A, to B, and back to A within 400 ms: the call for A finds A still `isPlaying`, does
not restart it, and stops B's tween, not A's fade-out. A's fade-out finishes and stops A. The room the
player is standing in is silent until the next room change or door event.

This is reachable wherever two loaded keys meet at a door: the showcase's office and kitchen (east-west)
once the beds are approved, and in a shipped mission without `roomTone`, sis01's `major_incident_room`
(`office_ambient`) and `it_security_office` (`server_room_ventilation`) once `office_ambient` is loaded
(`scenarios/sis01_healthcare/scenario.json.erb` 1681, 2133). A player who steps back through a doorway is
the normal case, not a corner one.

**Fix.** Keep the outgoing sound and its tween in their own fields. When `fadeAmbientTo` is asked for the
outgoing key, cancel its fade-out and tween it up from its current volume, and fade the other sound out.
Node test (with the tween stub the sound-manager tests use, or a fake scene): A to B to A inside the fade
leaves A playing at its level and B stopped; A to B to C leaves only C.

## 3. Minor findings

**Slice 17**

- **m1. Recycling does not protect Sanjay's beat, though 12.3 says it does.** The showcase text reads:
  "The extra slots do not by themselves protect Sanjay's beat; recycling the oldest forgotten slot does."
  The recycling rule applies only "when an **owned** print finds no free slot" (12.3, "A full pool"), and
  Sanjay's prints are unowned. Once Tom's forgotten prints hold all five slots, Sanjay's prints become
  cosmetic copies and Amara has nothing to deliver. At about one forgotten print per 37 minutes plus the
  note lever's one, that takes a long session, but the claim is false as written. **Fix:** any print,
  owned or not, recycles the oldest forgotten slot of that producer; test it with an unowned print.
- **m2. "The printer owns the printout" is unconditional.** 12.3 stamps every slot with the NPC that printed
  it and reserves every owned slot; the showcase says "Sanjay has no `printHabit`, so his prints stay
  unowned". Built from the design bullet, Amara never sees Sanjay's prints again. The existing slot tests
  would catch it, but the brief should not leave it to them. **Fix:** stamp an owner only when the printer
  has a `printHabit` or the print comes from a `print` command.
- **m3. `pickable` "by viewer" has no viewer.** `describe` sets `pickable` with no viewer (`npc-needs.js`
  2117), and `_advanceJob` reads `world.getObject(itemId).pickable` (1455). If the reservation makes a slot
  not `pickable`, the owner's own errand aborts with `item_gone` on its first tick. **Fix:** leave
  `pickable` as it is and filter the reservation in `_carryCandidate` (1239: skip `o.printedBy &&
  o.printedBy !== s.npcId`) and in the errand candidate.
- **m4. The errand's arrival and estimate.** "Placed with no PC dwell" does not say whether the job passes
  through `using`. If it does, `needsStop` returns the post stop for one tick (`seating.js` 1073-1075), the
  chair fetch may start, and slice 20's `npc_use_started` fires for a use that never happens. **Fix:**
  complete on arrival without entering `using`. Also, `_expectedAwayMs` adds the target's `useSeconds`
  (1376-1377), so an errand's estimate is 10 s too long for the lock habit (12.2); drop the dwell when
  `job.errand` holds.
- **m5. "Two seeded rolls on the print's id" needs a defined id.** If the id is the slot id, a recycled or
  re-used slot repeats its fate every time. **Fix:** roll on `<ownerId>:<printCount>`.
- **m6. The note lever's `onceOnly` loses the quick beat on a reload.** `onceOnly` persists to the server
  (`npc-manager.js` 1007), and a reload files the forgotten print (12.3). A reload within 150 s of reading
  the note leaves "A printout sits uncollected" waiting on Tom's natural forgets. With recycling in place,
  extra note reads no longer exhaust the pool. **Fix:** a 60 s cooldown instead of `onceOnly`, or
  `maxTriggers: 3`.

**Slices 18a and 18b**

- **m7. The hint action's default title is "Intelligence Received".** `applyActions`' `hint` calls
  `gameAlert(message, 'info', action.title || 'Intelligence Received')` (`systems/apply-actions.js`
  168-171). The socket's "The coffee machine is switched off at the wall." and the spare phone's "You dial
  Tom's extension." would pop up under a spy title in the neutral showcase. Otherwise the state-worded
  hint is an acceptable substitute for the `onceOnly` mapping: it reads correctly on every click, and
  `set_global` with the same value changes nothing because the wake compares values. **Fix:** give both
  examples a `"title"` ("Wall socket", "Desk phone") and have the validator warn on a `hint` with no title
  in a scenario with no security story, or simply in `test_needs_sims`.
- **m8. A magnet can be left on show with no servings after a reload.** Servings are saved when taken, at
  `using` start; the finish (hide, reveal global false, `magnet_finished`) waits for the last eater. A reload
  in that window restores 0 servings with the reveal global still true. Nobody uses the magnet, so the
  finish never runs, and the refill needs the global to *turn* true, so it never runs either. The empty
  boxes stay, and "The pizza runs out" never completes. **Fix:** on install, and whenever no NPC is using
  it, a shown magnet at 0 servings finishes; test with a fresh system, servings 0, global true.
- **m9. The sight check and the tick-cost bound.** "Checked each tick against `npcPos(id).roomId`" per NPC
  per magnet must read the per-tick object cache or a magnet list, or `objectScans <= ticks + 40`
  (`test/js/npc-needs-tick-cost.test.mjs` 95) fails. Only slice 20 says to re-run that test. **Fix:** name
  the cache in 18b-i and re-run the tick-cost test there.
- **m10. `grumble_off` with the `avoid` icon.** `PICTURE_CHATTER.grumble` is `['avoid']`
  (`npc-needs.js` 69-74), so "the grumble icon" for `grumble_off` and `grumble_gone` is the avoidance
  picture, which reads as avoiding a person. `_grumble` also logs `topic: 'grumble'` whatever was chosen
  (1108, 1114). **Fix:** `grumble_off` and `grumble_gone` use the need's own icon (`npc-caffeine`,
  `npc-hunger`), falling back to `avoid`; log the chosen topic.

**Slice 19**

- **m11. A ring during a call on the same phone.** Only "ringing while already ringing" is ignored. The
  spare phone has no cooldown, so a second ring mid-call starts a ring on a busy line, and an owner who
  arrives then "answers on arrival" while Amara is still talking. **Fix:** a ring while the phone is ringing
  or in a call is ignored; test.
- **m12. Calls and the other ways an NPC stops.** The answerer filter takes "idle at its post" but not
  "not on its own call" (an NPC who owns a phone and answers others). The call runner ends a call on a
  player chat, but not when the speaker turns KO, hostile or hidden, or is script-suspended: the blocked
  branch aborts a job (644-651) but would leave `s.call` set. **Fix:** exclude NPCs with `s.call` from
  answering; end the call (lines dropped, lock released, `desk_phone_hung_up` with `reason: "unavailable"`)
  in both cases.
- **m13. Call lines must go through `_speak` for 20's duck.** 20 ducks for "a needs line that the player
  hears" because `_speak` passes `overheard`. 12.5 voices calls through `npcChatterVoice.say`. Unless the
  runner's lines go through `_speak` with `overheard`, the bed does not dip under a call. **Fix:** say so in
  12.5 and add calls to 20's duck test.

**Slice 20**

- **m14. "Own room first" changes levels in four shipped missions; the live check is on the one that does
  not change.** In rooms order, an earlier adjacent ambient room wins today, so these rooms play a
  neighbour's 0.125 or 0.01 instead of their own level, and will play their own after the fix:
  m04 `battery_hall_2` (0.6; `battery_hall_1` is listed first), m09 `server_closet` (0.4), `restricted_cage`
  (0.5), `tape_room` (0.35) and `salvage_cage` (0.6), and sis01 `it_security_office` (0.25), which is silent
  today because `ward_7`'s unloaded `hospital_ambient` comes first and cuts the loop. `ward_7` itself goes
  from silence to the ventilation's 0.125 bleed. m01 has one ambient room and none of these changes, yet it
  is the only shipped mission in 20's live proof. These are the authored levels, so the change is right,
  but a fivefold jump in m04's battery hall was never heard in a playtest. **Fix:** list the rooms in 12.8's
  behaviour changes and on the slice report for the user; add m04 `battery_hall_2` and sis01
  `it_security_office` to the live check (local copies; m01 stays untouched).
- **m15. Step 3 with two authored neighbours is unspecified.** sis02 `scada_control_room` touches
  `battery_hall_1` (0.7) and `engineering_workshop` (0.4); m09 `reading_room`, `restricted_stacks` and
  `tape_room` have two each. Today the first in rooms order wins even with its door shut and the other's
  open. **Fix:** prefer a neighbour with an open door, then rooms order; test.
- **m16. Approving `office_ambient` changes sis01 with `roomTone` off.** sis01's `major_incident_room` (a
  `room_hospital_meeting`, not a meeting room as 12.8 and 13c call it) authors `office_ambient` at 0.15 and
  will play it as soon as the file is loaded. That is the intent, but the approval page should say that
  approving the bed changes a shipped mission.
- **m17. The cosmetic copy's `outputSound` skips the gate.** 12.6 has "the adapter also plays
  `outputSound` when it makes one", while the `roomTone` and `ownRoomOnly` gates live in the office visuals.
  **Fix:** the adapter emits (for example `object_revealed:<producerId>` with `cosmetic: true`) and the
  visuals play it under the same gates.
- **m18. Files missing from 20's brief.** "Seating publishes the count" of typists, but `seating.js` is not
  in 20's file list or size; and the place where `office-room-tone.js` is installed is not named. **Fix:**
  add `seating.js` (about 5 lines) and the install site.

**All slices**

- **m19. Sizes and stale text.** The total is 60 + 210 + 80 + 180 + 235 + 125 + 335 + 235 = **1,460**, not
  1,475. 16's parts sum to 205 (65 + 5 + 35 + 60 + 25 + 15), not 210. 19's `npc-needs.js` parts sum to 220
  (50 + 40 + 40 + 10 + 10 + 60 + 5 + 5), not "about 200", though the slice total of 335 holds. 12.9's
  header still says "Revised after review round 1". 12.6 says "Eight files from Freesound", while 12.8 says
  seven downloads and one ffmpeg derivative. 12.5's "When every knot is heard, calls use the `phone` bark
  pool" leaves out the colleagues' `phone_message`, which OQ38 and the paragraph's own end include.

## 4. Round 3 findings

| R3 | Outcome | Notes |
|---|---|---|
| M1 return leg reaches the lab and the golden | **Fixed**, mechanism needs M2 | `job.errand` scope keeps Sofia's 6 s plug-in (lab 732, 987) and Amara's 10 s dwell; the golden fixture is a copied stub and unaffected. Job mode on the last leg is safe for `_select` (job mode returns before selection, `_tickNpc` 714-717), seating (null stop while walking, post stop after `npc_returned_post`) and the unlock. Unguarded `_checkCaught` (M2); arrival through `using` (m4) |
| M2 an owner on a call starts a job | **Fixed** | Return before selection, after decay and the return path; own-desk use still advances; OQ55 and tests. Answerer filter and other stops (m12) |
| M3 owned prints and a full pool | **Partly fixed** | Recycling, `print_no_slot`, the start-time check and `onceOnly` are in. The Sanjay claim is false for unowned prints (m1); ownership stamping is unconditional (m2); `onceOnly` and reloads (m6) |
| m1 grumble fallback through `_pickBark` | Fixed | Topic chosen by lines; lab keeps spoken grumbles. Icon and log topic (m10) |
| m2 `_turnBack` reason table | Fixed | Needs a `rang_out` row (M1) |
| m3 hang-up line and remainder | Fixed | Introduced M1 (frozen answerer's job after ring-out) |
| m4 call chosen at the claim | Fixed | |
| m5 trigger observations, gated hint | Fixed, remedy replaced | The state-worded trigger hint is acceptable; title default (m7) |
| m6 bed order with authored neighbours | Fixed | Two authored neighbours unspecified (m15) |
| m7 unknown keys cut the loop | Fixed | Effects on shipped missions checked: sis01 gains `it_security_office` and a bleed in `ward_7` (m14); approval changes sis01 (m16) |
| m8 `server_room_ventilation` MP3 | Fixed | |
| m9 start and output sounds behind `roomTone` | Fixed | The cosmetic copy's sound skips the gate (m17) |
| m10 two files the preset changes touch | Fixed | Listed under 19 and 20 |
| m11 quiet look, starved needs, back-off | Fixed | |
| m12 late-discovered station cue | Fixed | |
| m13 swivel during pairing | Fixed | `_talking` (1824) and `_chatPartner` (1838) exist |
| m14 alpha pulse only | Fixed | |
| m15 phone approach cell and chair spot | Fixed | |
| m16 sizes | **Partly fixed** | 18b split and per-slice sums mostly right; total and 16 still off (m19) |
| m17 stale text | Fixed | New stale header in 12.9 (m19) |

## 5. Cross-slice interactions and reloads checked this round

| Case | Result |
|---|---|
| Errand last leg and a call ring | Owner not at its post, so it misses; no gap |
| Errand last leg and 14's recheck, 18a's `off`, 18b's `gone` | None applies to a job with no need; no gap |
| Errand from `returning` (lever while Tom walks back) | No wind-up and no `caughtEmitted` reset; covered once M2's guard is in |
| Errand timeout on the last leg | `_failJob` stows the slot and `_goHome` gives the normal return; no gap |
| Colleague frozen while walking to a phone | M1 |
| Ring during a call; KO or script suspension mid-call | m11, m12 |
| Call lines and the bed's duck | m13 |
| Crossfade reversal at a door | M3 |
| Magnet reload between the last serving and the last eater | m8 |
| Note lever and reload | m6 |
| 16 auto-lock while a colleague stands at the owner's phone | No interaction: only `workstation_accessed` restarts the clock |
| Sims golden after slice 17 | Unchanged: the fixture is a copy, Amara's own hook is `setGlobal`, Sanjay's PC accepts nothing |

## 6. Buildability

- **21, 16, 18a**: can be handed over as written; m7 and m10 go in 18a's brief.
- **17**: after M2; m1 to m6 in the brief. The live proofs are capturable; the note lever's proof should
  avoid a reload (m6).
- **18b-i, 18b-ii**: as written, with m8 and m9 in 18b-i. The announce proof is the `/tts` request on
  keyless :3001.
- **19**: after M1; m11 to m13 in the brief. "A chat opened with Tom mid-call" is capturable through
  `window.__test`; add "a chat with Amara on the way, then ring-out" to the live list.
- **20**: after M3; m14 to m18 in the brief. Before approval, the north-south proof through the m01 copy
  works as 12.6 says: `it_room` has no loaded bed, so step 3 plays the server room's loop at 0.125 and the
  fade calls show no gap.

## 7. Open questions 27-56 and the approval table

Consistent with the text apart from: **OQ37** (add "an answerer still on the way when the phone rings out
goes home", M1); **OQ56** (say whether unowned prints recycle, m1); **OQ54** (the picture icon for
`grumble_off`, m10). The 12.9 header is stale (m19). The approval table matches 12.6, OQ42 and OQ46 in
items; 12.6's "Eight files from Freesound" contradicts its "seven downloads and one derivative" (m19), and
the `office_ambient` row should note the sis01 change on approval (m16).
