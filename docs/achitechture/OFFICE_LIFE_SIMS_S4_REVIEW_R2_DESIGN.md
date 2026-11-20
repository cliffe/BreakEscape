# SIMS-4 review, round 2: design and engine view, with live proof

Branch `build/ol-sims` at 3f4068967. Keyless server :3093 from the p-ol-sims worktree, headless
chromium (the lighting run with SwiftShader WebGL flags so `window.lightingSystem` exists). Every
game is a fresh `new-game.rb test_needs_sims` game. No need level was set and no trigger event was
emitted: every break came from the scenario's own mappings, doors walked through with
`__test.enterRoom`, and conversations opened, picked and closed in their UI.

| Game | What I ran |
|---|---|
| 4614 | `needs-sims-staff-room.mjs job_beat` (the proof tool as committed) |
| 4615 | `needs-sims-staff-room.mjs boiler_cross` (the proof tool as committed) |
| 4638 | `probe.mjs`: first visit by the boiler with the faulty panel sampled; Keith and Jodie exited and reopened through the UI; settle more than 120 s; Neil's light report and close; the job-called exchange; Jodie's light choice; the panel sampled after `job_cleared`; a private-office crossing to the cooler |

4623 and 4629 were probe setup failures (my helper dropped its arguments, then picked choices
before they were shown); not counted. Scripts, reports and screenshots are in scratchpad
`officelife-sims/s4-review-r2-design/` (`probe.mjs`, `probe-4638.json`, `r2-4638-*.png`,
`report-sr-*-4614.json`, `report-sr-*-4615.json`, `sr-*-4614.png`, `sr-*-4615.png`). I did not
rerun the speech-lock beat or touch game 4570.

Counts: 0 blockers, 2 major, 4 minor.

## Round 1 findings

| R1 | State | Evidence |
|---|---|---|
| B1 (counts measured the first visit) | Closed for the start; the line half is reopened as M1 below | `needs-sims-staff-room.mjs:161-205` settles and then closes Neil. 4614: settle gap 127.3 s, close 155.75 s, Keith's start 2.0 s later, no `firstVisit` entry in the window, `exchange_job_called` complete with 3 of 3 lines heard. 4615: close 154.5 s, Keith's start 2.0 s later. 4638 (my probe): close 159.25 s, Keith 161.0 s, Jodie 163.5 s. |
| M1 (goodbye as greeting) | Closed | `keith.ink:26-30`, `jodie.ink:59-63`. 4638: Jodie reopened three times after an exit, each fresh at "Hiya. Jodie, maintenance." (`r2-4638-b4-jodie-reopen1.png`, `-b5-jodie-reopen2.png`, `-d4-jodie-reopen.png`); Keith reopened after an exit at "Evening. Keith, night security." (`r2-4638-b2-keith-reopen2.png`). |
| M2 (plan node tests missing) | Closed, one weak case (m4) | `test/js/npc-needs.test.mjs:1667-1800`, `test/js/npc-needs-sims-validator.test.mjs:205-240`; `bin/test-js` on both: 2 of 2 files pass. |
| M3 (the light did not flicker) | Closed in data and live; README line missing (m1) | `scenario.json.erb:1091`. 4638: at entry `variantIdx -1`, one faulty panel of six, a dip to 0.55 in the sampled series; after Jodie's choice `variantIdx 0`, no faulty panel, 40 samples all 1.0. |
| m1 (light choice stays, comes early) | Closed; the dialogue contradiction remains (M2) | `jodie.ink:49-54`. 4638: the choice appears only after `heard_exchange_job_called`; picked, the hub comes back with three choices and it is gone in the same chat. |
| m2 (speech-lock sample, doors) | Tool closed; README not corrected (m2) | Tool `:265-273` opens every door. README:951 still says the doors-open office beats ran in 4369. The rerun itself is out of scope here. |
| m3 (step 1 did less than the plan) | Closed (read, not rerun) | `sims4-step1.mjs:45-61` (`findWorldPath` from both homes), `:119-136` (jitter). |
| m4 (cooler spacing) | Closed | `settleStaff` `:161-174`, used by `cooler_cross` `:210-211`. |
| m5 (doc and data nits) | Closed | README:124; `scenario.json.erb:1201` (`fireOnlyWhenLoaded`). |
| Server m1/m2 (reload replay) | Closed in docs | README:147, plan 5.4 Sync. |

## What holds

- **The three exchanges and their gates, live in one game.** 4638: `exchange_waiting` on the first
  visit; `exchange_job_called` after the Neil close (163.5 to 177.25 s, 3 of 3 overheard, then two
  pool lines heard and a picture); `exchange_job_cleared` on the cooler break started by the private
  office (244.25 to 257.75 s, 3 of 3 overheard). `heard_exchange_job_cleared` ends true. This is the
  first live proof of the cleared exchange; round 1 and the builder had it only by reading.
- **The light report.** Neil offers "The staff room light's flickering." only after
  `staff_room_seen`, and the choice leaves the hub once picked (4638 `C.neil_light`).
- **The flicker holds steady after `job_cleared`** without a reload: the variant re-resolves within
  `RESOLVE_MS` (`lighting.js:716-718`).
- **Both return and sit.** 4614, 4615, 4638: `npc_returned_post` for Keith and Jodie after every
  break; no setup failure flagged.

## Major

### M1. The crossing counts measure the deferred first-visit exchange, not what a player hears on a crossing

- **Tool:** `tools/playtest/needs-sims-staff-room.mjs:178` and `:210` (the first visit is `enterRoom`
  plus 1.5 s; the player never stands within earshot), `:70-85` (`analyse` counts every
  `npc_chatted` since load, office NPCs included), `:202` and `:232` (boiler and cooler use starts
  since load, first visit included).
- **Docs:** README:943-944 (boiler "pair 10/10, line 9/10", cooler "line 10/10"), README:110 (tour
  step 3, "you hear a line or two"), README:143, build log :299.

**Evidence.** An exchange starts only with an audience (`npc-needs.js:4017`). In the settle beats the
player stands by the west door during the first visit, so `exchange_waiting` never starts there and
is still unplayed when the crossing comes. It then plays on the crossing, at the boiler or the
cooler. The builder's own reports show it:

- All ten cooler reports (4490 to 4537): `exchange_waiting` 5 of 5 heard, pool lines 5 total and 5
  unheard. Not one pool line was heard on any cooler crossing; "line 10/10" is the waiting exchange
  every time.
- Nine boiler reports: `exchange_waiting` 5 of 5 heard; 4570 (no break on the crossing) has no
  exchange and 0 heard. My 4615 screenshot at the crossing (`sr-boiler_cross-01-in-staff-room-4615.png`)
  shows "Jodie Kerr: Long shift when it's this slow." over the pair at 160 s, a waiting line.
- The pool counts include office lines (`tom` "I'm starving already." at 63 s in 4614 and 4615), and
  "pair 10/10" counts 4570, whose only boiler starts were the first visit at 16.5 s and 19 s.

A player following the tour heard `exchange_waiting` in step 1, so on steps 3 and 4 there is no
exchange left (or, after step 2, only the job ones). What they hear is pool lines, and those were
never measured on a crossing; the cooler data suggests the answer may be none, since E7 spends the
pairing line before the player is through the door (4638: "Keeps you sharp, water." at 240 s, the
moment of entry, `overheard: false`). The plan's step 3 rule allows "a pool or exchange line", so
the letter is met, but the setup is not the game the README describes.

**Suggested fix.** In `job_beat`, `boiler_cross` and `cooler_cross`, stand by the boiler on the
first visit until `npc_exchange_heard:exchange_waiting` (as tour step 1 does). Scope `analyse` and
the use-start lists to events at or after the close or office entry, and to speakers `keith` and
`jodie`. Report pool lines heard and spent unheard on the crossing alone, and "pair" as both use
starts after the close. Rerun 10 boiler and 10 cooler crossings; correct README:943-944, :110, :143
and the build log. If pool lines heard on a crossing come out near zero, say so in the tour (the
crossing shows the pair meeting; voiced lines come from the exchanges) rather than promise a line.

### M2. The job-cleared beat says what the player can see did not happen

- **Ink:** `jodie.ink:49-54` (choice and reply), `:79-83` (`exchange_job_called`), `:86-90`
  (`exchange_job_cleared`).

**Evidence (4638, as a player sees it).** The light has flickered the whole visit. Jodie, the
on-call maintenance assistant ("Fix whatever Keith's radio turns up. Lights, locks, leaks."), asks
Keith whether the light is still flickering; Keith tells her "Someone'll be up soon, Jodie." She
then sits at her table. The player asks "Did that light get sorted?" and she answers "Aye, I swapped
the tube." while seated, and the flicker stops at that moment (`D.light_after_clear` 2.5 s after the
choice). On the next break Keith says "They sorted that flickering light." and Jodie replies "About
time. Hurt my eyes, that did." about her own repair. Round 1 m1 moved the "soon" line to Keith, but
telling the maintenance worker that someone will come still has her waiting on herself. The
showcase's aim is that the player sees what the story says; here the light visibly changes on a
dialogue click and three lines contradict who did the job.

**Suggested fix.** Make the repair something the room shows, with no engine line:
1. `exchange_job_called` ends on Jodie taking the job, for example `Keith: That'll be one for you, Jodie.`
   and `Jodie: After this brew, aye.` (voiceable, under 40 characters).
2. Set `job_cleared` from Jodie's next return home after the exchange: an eventMapping on Jodie
   `npc_returned_post:jodie` with `condition` `globalVars.heard_exchange_job_called === true`,
   `onceOnly`, `setGlobal { job_cleared: true }`. Since a bare `setGlobal` does not sync, pair it with
   a `completeTask` (for example a new optional `see_light_fixed`) so it persists. The light then
   steadies when she sits back down from the break, out of the player's choice.
3. Gate the hub choice on `job_cleared` and keep its reply ("Aye, I swapped the tube. No more
   flickering."), or drop the `#set_global` from it.
4. Rewrite the cleared exchange so Jodie owns the fix, for example `Keith: Light's behaving now.`,
   `Jodie: New tube. Should last a while.`, `Keith: Peace and quiet again. Lovely.`

## Minor

### m1. The tour does not show the light or the cleared beat

README:104-112 (the break tour) still ends at the microwave. Nothing tells the player that the staff
room light flickers, that Jodie can be asked about it after the job-called exchange, that the light
then holds steady, or that a later break plays the cleared exchange. Round 1 M3 asked for the tour
line. `exchange_job_cleared` also has no task, so a player has no prompt to wait for it.
**Suggested fix:** add a tour step after step 2 (ask Jodie, or with M2's fix, wait for her next
break; the light holds steady; the next break plays "the light's sorted" exchange) and, if wanted, an
optional task on `npc_exchange_heard:exchange_job_cleared`.

### m2. Stale README rows the round-1 fixes left in place

- README:970: "Game 4346: the Neil close ... starts Keith's boiler break (the
  `conversation_closed:neil` mapping, 21.3 s)". Round 1 B1 showed this was the first-visit start;
  the table at :942 supersedes it, but the row still claims it.
- README:951: "The office beats with every door open ran inside game 4369". 4369 never opened the
  kitchen or the lounge (round 1 m2).
- README:969-975 (the "representative" table) predates the R1 fixes; :971's game 4347 cooler start
  is genuine but the table reads as current.
**Suggested fix:** mark the :967-975 table as round-0 history or delete the superseded rows, and
correct :951.

### m3. The flicker is real but hard to see, and no frame shows it

`lighting.js:1071-1077`: the faulty panel dips to 0.55 for 90 ms, once or twice every 2.5 to 8.5 s,
in one of the room's six panel pools, picked at random on each load (`:706`); reduced motion turns
it off. In 4638 one sample in 40 caught a dip. I could not catch a dip in a screenshot
(`r2-4638-c2-still-flickering.png` and `-d2-steady.png` look the same), and the R1 fix's evidence is
level numbers, not a frame. Dips of this length are kept short for WCAG 2.3.1, so the remedy is
guidance, not a stronger flicker. **Suggested fix:** capture one frame at a dip (wait in-page on the
faulty panel's level, then screenshot the canvas in the same frame) to show the effect is visible,
and name in the tour where to look ("one ceiling pool blinks every few seconds").

### m4. One node case tests its own lambda

`test/js/npc-needs.test.mjs:1738`: the coupling test builds the coupling as a hand-written function
and asserts that function's effect, so it does not exercise the scenario's eventMapping path or its
`data.npcId` condition. `:1748-1761` ("a use started straight from another job") does not assert that
Keith did not return home between the two starts, which is the case the plan names. **Suggested
fix:** drive the coupling through the npc-manager mapping path with the scenario's own mapping
object, and assert no `npc_returned_post:keith` between the boiler and microwave starts.

## Not yet checked

- Keith did not open on two `interact` calls made straight after a chat closed (4638 `B.keith_open2`,
  `B.keith_open4_after_x`); a later call opened him fresh at the greeting. Probably an interaction
  cooldown after a close, not this slice; the X-close reopen of Keith is therefore not shown.
- The speech-lock rerun and game 4570 (another agent's).
- A reload after `job_cleared` (the variant should resolve on load from the synced global).

## Verdict

The round-1 blocker's start half is fixed and proved: breaks the player walks into now come from the
Neil close and the private office, and all three exchanges, the light report, the flicker and its
end play live in one fresh game. Two majors remain: the crossing counts still measure a beat the
tour player never gets (the deferred waiting exchange), and the job-cleared beat shows the light
changing on a dialogue click while the lines contradict who fixed it. Not ready to sign off; one more
round after M1 and M2.

| Severity | Count | Items |
|---|---|---|
| Blocker | 0 | |
| Major | 2 | M1 crossing counts measure the deferred first-visit exchange; M2 the job-cleared beat contradicts what the player sees |
| Minor | 4 | m1 tour lacks the light and cleared beat; m2 stale README rows; m3 flicker hard to see, no frame; m4 node coupling test tests its own lambda |
