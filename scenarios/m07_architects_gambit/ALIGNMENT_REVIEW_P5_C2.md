# m07 The Architect's Gambit: alignment review, pass 5, cycle 2

Stage 2, `mission-alignment-plan` rubric. Fresh reviewer, read-only. 2026-10-14.
I judged the mission against the aim in `docs/agents/M07_PASS_BRIEF.md`: a TV spy thriller where the four-crisis choice costs something real and is paid off honestly, the deduction belongs to the player, and the VM flags are required and woven into the story.
Evidence comes from the working tree, which matches HEAD 345813af for m07: `scenario.json.erb` (cited `erb:N`) and the ink (`ink/<file>:N`). I opened no SecGen XML and none of the four restricted field guides. I started no browser session.

## Checks run (outputs in the session scratchpad, `m07-align-c2-reviewer/`)

- **Route driver.** r1-r5 all pass ("all expectations met"). The longest run without a choice is the debrief read-out (55-63 lines). That predates this cycle and belongs to the dialogue stage.
- **Probe routes.** I wrote three probes for this review. They live in scratch only and are not added to the repo:
  - `p1_t10_late_open`: proves A1.
  - `p2_decode_read_not_deduced`: proves A2.
  - `p3_informed_trojan`: proves m1.
- **dialoguelint.** 0 errors. The remaining flags are style notes and blank-reentry checks that predate round 1: transition 1, not-x-but-y 1, you-after-choice 2, blank-reentry 6.
- **Validator** (`--skip-ink --no-graph`). Schema, geometry and doors pass. There are 10 duplicate-mapping warnings, 4 warnings for the repeatable person-chats (Hollis's sight chat and Park's entry chat, deliberate as in m04) and 3 credits-fallback suggestions. Round 1 left the same set. None needs action.

## Severity table

| # | Sev | Rubric row | Finding (short) |
|---|-----|-----------|-----------------|
| A1 | major | 5, 10 | A T-10 call opened after the 40-minute window shut tells a player who never logged in "You logged in. The door closed behind you." |
| A2 | major | 5 | New since round 1: the debrief and credits say the correction was "never read" to a player who read the decode but didn't state the deduction |
| m1 | minor | 5 | A player who learnt the correction before committing, then chose Trojan Horse, is told "You had no way to know" |
| m2 | minor | 5 | A player who learnt the correction before committing, then committed elsewhere after a login, is told they found it "after the window had closed" |
| m3 | minor | 5 | Decode read with the window open, deduction stated after the login: "The timing was his, not yours" lets the player off |
| m4 | minor | 5 | The deduction can be brute-forced, and its right answers spell out the discrepancy |
| m5 | minor | 2 | The orchestrator's U5 decision (drop "(Optional)", make two tasks required) is not applied |
| m6 | minor | 4, 7 | Hollis's re-sighting line says he can't see the player, though he has just spotted them |
| m7 | minor | 7 | Park's "There isn't a third" has no consequence on the third visit |
| m8 | minor | 4 | Elena's team lines and HaX's verdict text misread Trojan-direct, redirected and uncommitted players |
| m9 | minor | 4 | Tidy-ups: T-20 dead branches, T-10 branch order for a redirected player, Elena's unused `EXTERNAL` |

**Counts:** 0 blockers, 2 majors, 9 minors.

## Fresh review against the aim

- **Does the four-crisis choice cost something real, and is it paid off honestly?** Yes, on the main paths.
  - Every ending reads out two operations (three if the team was never committed), by name and by number (`ink/m07_closing_debrief.ink:253-279`).
  - The redirect costs the operation the team is pulled from. That operation is read out as fully dark (`:264-272`), as HaX's cost speech promised (`ink/m07_phone_agent_0x99.ink:399-412`).
  - The redirected Trojan Horse is a real partial result: 30 per cent, with fourteen million systems hit (`:166-173`).
  - The gaps are at the edges of the timing logic (A1, A2, m1-m3).
- **Is the Trojan Horse deduction now the player's, and is it fair?** It is the player's, and it is fair.
  - The decode no longer sets `projection_revised` (`erb:1636`).
  - Neither the nudge nor the follow-up text names Austin or a conclusion (`erb:816`, `erb:823`).
  - The hub choice is gated on reading the decode, not on how the player got there (`ink/m07_phone_agent_0x99.ink:237`).
  - The decode carries what the player needs. Its T+9 and EHR/CAD lines sit against the summary's 90 days and "NONE PROJECTED" (`erb:1635`, `erb:296`).
  - It is easy to pass without reading (m4), but nothing hands it over.
  - Elena's route stays a witness route that the player has to ask for (`ink/m07_npc_elena_rodriguez.ink:112`, `:196`). That is acceptable as the second source.
- **Is the redirect window visible?** Yes.
  - The HUD timer (`erb:652-661`) shows only once the correction is in hand. The HUD hides a timer whose condition fails (`ui/scenario-timer.js:190-196`). At minute 40 the close timer fires first in array order and the display timer is then skipped, as the probe's clock log shows.
  - Warnings before the login are in five places: the aim (`erb:510`), the cost speech (`:412`), `vm_hint_3` (`:617-619`), the flag-2 text (`erb:875-881`) and the T-10 bark (`erb:1289-1293`).
- **Is the debrief's blame fair in all three splits?** Mostly.
  - Window open: "You knew…", and "weighed, and held" for a player who declined.
  - Found after the window shut: "found, not ignored".
  - Never committed: its own lines.
  - The splits are right for the routes r1-r5 drive. They go wrong for three uncovered states: decode read but no deduction made (A2), correction known before the commit (m1, m2), and decode read with the window open but deduction stated late (m3).
- **Do the sight challenges work in the story?**
  - Hollis works. The cone is live and skipped once he is dealt with (`erb:1230-1240`; `npc-sight-challenge.js:67-72` takes the list). His first challenge can't be avoided, because the player spawns in his cone (round 1 browser check). That suits a checkpoint. One line is off (m6).
  - Park speaking first on every entry works (`erb:1869-1874`). His third-visit threat is empty (m7).
- **Giveaways, contradictions, unreachable branches.**
  - Timers and flags: one contradiction (A1). The other interactions check out:
    - The 30-minute T-10 against a login at minute 22. T-5 lands at minute 32, so T-10 still plays its closed branch.
    - A login before minute 20 means T-5 plays first and T-10 is skipped, by `!architect_t5_played`.
    - A commit after a login: the timers start at the commit, `redirect_window_close` re-sets a global that is already true, and nothing listens for that.
    - The window-close timer and the display timer firing in the same tick.
    - Reload: no setGlobal on the display timer, and the T-10 and close timers are skipped at init once their global is set (`ui/scenario-timer-dispatcher.js:71-79`).
  - The `revision_found_open` latch on `team_assigned` reads `team_assignment` correctly, because every commit sets it on the line before `team_assigned` (`ink/m07_opening_briefing.ink:260-261`, `ink/m07_phone_agent_0x99.ink:162-163`).
  - Unreachable branches: T-20's uncommitted branches (m9).

---

## Major findings

### A1. A late-opened T-10 call says "You logged in" to a player who never did
- **Evidence.** The bark fires at minute 30 (`erb:631-640`) and the call can be opened any time until T-5 plays (`ink/m07_architect_comms.ink:57`). T-5 needs a login (`erb:667`), so a player who hasn't logged in can open the call at minute 41. By then the 40-minute timer has set `redirect_window_closed` (`erb:648`). `taunt_t10` tests that flag first and says "You logged in. The door closed behind you." (`:184-186`).
  - Probe `p1_t10_late_open`: commit Fracture, advance 31 minutes, ignore the bark, advance 10, then open the call. Result: `cascade_armed=false`, `flag3_submitted=false`, and the line plays.
  - This path is likely, because minutes 30-40 are when most players are in the Kali box. It is the same family as round 1's M4.
  - A redirected player who then logged in before minute 30 also hears "You logged in" in place of "You moved them", because the branch order puts the login first.
- **Fix.** In `taunt_t10` (`:184-195`), branch on the login, not on the window, and add the time-shut case:
  ```
  {
  - team_redirected:
      You moved them. I had wondered whether you would.
  - cascade_armed:
      You logged in. The door closed behind you.
  - redirect_window_closed:
      Forty minutes. Your team is committed now, wherever you left it.
  - team_assignment == "trojan_horse":
      ...
  - projection_revised:
      ...
  - else:
      ...
  }
  ```
  `cascade_armed` is already declared at `:31`, and `t10_close` (`:211`) can stay. For robustness, key the third bark row (`erb:1302-1305`) on `globalVars.cascade_armed === true` rather than `redirect_window_closed`. At minute 30 the two are the same, but the bark then can't drift from the ink. Add a route step for the late open, modelled on the p1 probe.

### A2. The debrief says the correction was never read to a player who read it (new since round 1)
- **Evidence.** Round 1's M2 fix made `projection_revised` a stated deduction, not a read (`erb:1636`). Flag 1 is required (`erb:557`) and puts the decode in every player's inventory. A player who reads it and never calls HaX now hears "The evidence was in that building tonight. Two copies. Nobody read them." (`ink/m07_closing_debrief.ink:234-237`). The credits say "PROJECTION UNCHALLENGED: Two copies of the correction were in the building; neither was read" (`erb:199`).
  - Probe `p2_decode_read_not_deduced`, with `found_coordination_traffic` true and `projection_revised` false: both lines play.
  - This blames the player for something they did do, on what is probably the most common path for a player who doesn't make the deduction.
- **Fix.** Declare `VAR found_coordination_traffic = false` in the debrief. In `revision_payoff`'s last block (`:234-237`), keep the analysis line, then branch:
  - Read: "Their own schedule was in your hands tonight. The Austin row said nine days. Nobody put it next to the brief."
  - Not read: the current "Two copies. Nobody read them."

  Optionally, add a HaX line in `dark_trojan` (`:299-307`) under `found_coordination_traffic and not projection_revised`: "It was in your hands. Nine days, in their own table."

  Split the credits line at `erb:199`:
  - `!globalVars.projection_revised && !globalVars.found_coordination_traffic && globalVars.team_assignment !== 'trojan_horse'`: keep the current text.
  - `!globalVars.projection_revised && globalVars.found_coordination_traffic === true && globalVars.team_assignment !== 'trojan_horse'`: "PROJECTION UNCHALLENGED: Their schedule was read; the Austin row was never put against the brief".

  Add the p2 state as a route.

---

## Minor findings

- **m1. Informed Trojan commit.** A player can get the correction before committing: Elena while uncommitted (r4's opening), or the deduction with no team (r5). If they then choose Trojan Horse they hear "You had no way to know what you were choosing. I would like it noted that you chose it anyway." (`ink/m07_closing_debrief.ink:163`) and "You found out what you had chosen while they were stopping it." (`:202`). Probe `p3_informed_trojan` confirms both. The player who did the most careful work is misread.
  - **Fix.** Add a latch `revision_before_commit`: an `agent_0x99` mapping on `global_variable_changed:team_assigned` with `value === true && globalVars.projection_revised === true`, onceOnly, declared in `globalVariables` and the debrief.
  - In `covered_trojan_direct`, gate `:163`. When the latch is set: "You read their schedule before you made the call, and sent the team where the brief said nothing would happen. I would like that noted."
  - In the Trojan block of `revision_payoff` (`:202`), when the latch is set: "You found it before you chose, and you chose Austin."
- **m2. Committed elsewhere after a login, with the correction known.** An uncommitted player's login closes the window (`erb:921`), and the hub still lets them commit (`ink/m07_phone_agent_0x99.ink:209`). If they already held the correction and commit to Fracture or Meltdown, `revision_found_open` stays false, because its commit mapping needs the window open (`erb:892`). The debrief then says "You found it after the window had closed" (`ink/m07_closing_debrief.ink:228`), and the credits say "CORRECTION FOUND AFTER THE WINDOW SHUT" (`erb:198`). Neither is true.
  - **Fix.** Reuse m1's `revision_before_commit`.
    - Debrief: add a branch at the top of the `- else:` at `:227`: "You had it before you made the call, and sent the team elsewhere."
    - Credits: add `&& !globalVars.revision_before_commit` to `erb:198`, plus a line "CORRECTION IN HAND BEFORE THE CALL: the team went elsewhere" (warning) on `revision_before_commit && !revision_found_open && team_assignment !== 'trojan_horse'`.
- **m3. Decode read with the window open, deduction stated late.** The player reads the decode at minute 20 and gets "call me and say which" (`erb:823`). They log in at minute 30 without calling, then make the deduction. They are told "You found it after the window had closed… The timing was his, not yours." (`ink/m07_closing_debrief.ink:228-229`) and "You found it after the window shut" (`:306`). They had the evidence with time on it. The line lets them off.
  - **Fix.** Add a latch `decode_read_open`: a mapping on `global_variable_changed:found_coordination_traffic` with `value === true && globalVars.team_assigned === true && !globalVars.redirect_window_closed && globalVars.team_assignment !== 'trojan_horse'`, onceOnly. In the found-late branch, when the latch is set:
    - Netherton: "Their schedule was in your hands with the window open. You put it against the brief after it shut."
    - HaX: "Late is still found. It goes in the report as late."

    Otherwise use the current lines. Also tighten `erb:198` with `!decode_read_open`, or give the credits a separate line for it.
- **m4. The deduction can be brute-forced and spells out its answers.** The menu has three operations, and Trojan Horse is the obvious suspect, since the summary says "NONE PROJECTED". Then come three faults, two of them right (`ink/m07_phone_agent_0x99.ink:336-360`). A wrong pick costs nothing, and the right choices state the values: "Theirs says nine days. Ours says ninety." / "EHR and CAD: health records and dispatch." A player who skimmed can pass on recognition alone.
  - **Fix.** Keep "costs nothing", because minigames should be fun, not hard. Make the second menu name fields, not values: "The dormancy." / "The manifest." / "The key count." / "The site." Key count and site are wrong: both documents say 840 and Austin/TechForge. `deduce_right` already states the values in HaX's reply (`:378`), so the confirmation still lands. This is wording for the dialogue stage, and none of it is voiced.
- **m5. U5 is not applied.** `DECISIONS_PENDING.md` records the orchestrator's choice (2026-10-14): drop "(Optional)" from the aim title and make its two tasks required again. The file still has the old state:
  - the title "Trace How They Got In (Optional)" at `erb:428`;
  - `"optional": true` on `secure_generator_room` and `recover_vault_pin` at `erb:445` and `erb:453`;
  - the comment at `erb:434-438` still points at the pending item.

  **Fix.** Make exactly those three edits and rewrite the comment: "U5 (orchestrator, 2026-10-14): required again so the aim doesn't complete on the generator hall; it gates nothing." The aim's description still invites "before the abort or after it", which is fine. Browser check: the aim no longer folds on entering the generator hall.
- **m6. Hollis's re-sighting line.** The sight challenge fires because he can see the player (`erb:1186`). The chat then opens with "Something's in here. I know something's in here." (`ink/m07_npc_ray_hollis.ink:233-235`). That is a man who can't see anyone, and it comes straight after the evade text, which ends with him finding nothing (`:220-222`).
  - **Fix.** Change `wary_again` to:
    - Narrator: "He is jumpier now. The flashlight comes up fast, and this time it finds you."
    - Ray Hollis: "There you are. I knew something was in here."

    That is one voiced line changed and one narration line.
- **m7. Park's third visit.** "Second time. There isn't a third." (`ink/m07_npc_thomas_park.ink:121`) is followed on the third visit by "I said there wasn't a third." and the same hub (`:124-126`). The threat is empty. This is the one place the entry chat could carry a cost.
  - **Fix (recommended).** On a third visit, after the line, go to `goes_loud`: he comes up swinging, `park_resolved: ko`, hostile. The debrief and credits already cover it (`ink/m07_closing_debrief.ink:415-417`, `erb:226`). That makes backing away twice a real choice.
  - **Alternative.** Soften the second visit's line to something like "Don't make me stop," so nothing is promised.
- **m8. Team-state lines that misread the player.**
  - Elena's `revision_beat` (`ink/m07_npc_elena_rodriguez.ink:246-251`) says "you sent them on those numbers" to a Trojan-direct player while the window is open, and "I'm sorry" to a Trojan-direct or redirected player once it has shut. **Fix:** add `team_assignment != "trojan_horse"` to both conditions, and add a Trojan line: "If your people are in Austin, they're in the right place. Tell them about dispatch."
  - HaX's first Elena verdict (`erb:828`) also fires for an uncommitted player: "If the team's in the wrong place…". **Fix:** add `&& globalVars.team_assigned === true` to that row, and add a disjoint row for `!globalVars.team_assigned && !globalVars.redirect_window_closed`: "One frightened engineer, but it fits. When you call the team, that's where it goes."
- **m9. Tidy-ups.**
  - T-20 only starts on a commit (`erb:624`), so `taunt_t20`'s "Or you haven't" (`ink/m07_architect_comms.ink:144-146`) and `t20_close`'s "Choose slowly" (`:164-165`) can't play. Remove them, or leave them with a comment.
  - The T-10 branch order for a redirected player is covered by A1.
  - Elena still declares `EXTERNAL player_name()` (`ink/m07_npc_elena_rodriguez.ink:23`) and never calls it. Remove it.

---

## Confirmation of cycle-1 findings (checked in the files, not the log)

| # | Outcome claimed | Verified at | Status |
|---|---|---|---|
| M1 | VM chain in the debrief and credits | `ink/m07_closing_debrief.ink:104-120`; `erb:181-187`; latch `erb:896-907` | Closed |
| M2 | Deduction moved to the hub | `erb:816`, `erb:823`, `erb:1636`; `ink/m07_phone_agent_0x99.ink:237-238`, `:328-393`; Elena `:112`, `:196` | Closed (new side effect A2; wording m4) |
| M3 | Window visible, blame split | latch `erb:882-895`; HUD `erb:652-661`; warnings `erb:510`, `erb:875-881`, phone `:412`, `:617-619`, `:387`; debrief `:215-230`, `:299-307`; credits `erb:196-199` | Closed for r1-r5 states; A2, m2 and m3 cover three more |
| M4 | T-10 on its own timer, three bark rows | `erb:631-640`, `erb:648`, `erb:1289-1306`; `ink/m07_architect_comms.ink:184-195` | Open branches now play. Late-open contradiction is A1 |
| M5 | Hollis sight challenge; Park speaks first | `erb:1185-1190`, `erb:1230-1240`; Park `erb:1869-1874`; `ink/m07_npc_thomas_park.ink:116-126` | Closed (m6 and m7 are polish) |
| M6 | m07/m08 timeline line | `ink/m07_opening_briefing.ink:70` | Closed |
| m1 | Redirect contradictions | phone `:110`; `erb:339` | Closed |
| m2 | `{player_name()}` in voiced HaX lines | phone `:106`, `:148`; no `player_name` left in the phone ink | Closed |
| m3 | Mole intercept observation | `erb:1929` | Closed |
| m4 | Park talk-down text on a return only | `erb:964-970` | Closed |
| m5 | Post-abort music guards | `erb:141-158` | Closed |
| m6 | "not long after the abort" | debrief `:78` | Closed |
| m7 | "Above expectations" gated | debrief `:574-578` | Closed |
| m8 | Health records in the redirect debrief | debrief `:169` | Closed |
| m9 | One host in the recon guide | phone `:698` | Closed (host count is U3) |
| m10 | Elena's eighteen months | Elena `:149-151` | Closed |
| m11 | CyBOK | `mission.json`: AB/Models, SS/Categories added, CPS trimmed | Closed (NS/OSV keywords are U3) |
| m12 | RFID cloner use | `erb:266-276` (still "Neither is needed") | Deferred to puzzle chains, as planned |
| m13 | m06 fate-neutral line | briefing `:29` | Closed |
| m14 | Stale comments | `erb:1140`, `erb:1221-1229`, `erb:1886-1888`, `erb:607-611` | Closed |
| m15 | Park's unused VAR | none in `ink/m07_npc_thomas_park.ink` | Closed |
| m16 | T-1 line | architect `:276` | Closed |
| R M-2 | Netherton and HaX busts | `erb:731-734`, `erb:764-766`, `erb:1350-1353` | Wired; still owes a browser look |
| R M-3 | Required `*` in the optional aim | `erb:440-454` | Superseded by U5, not yet applied (m5) |
| R m-6, m-8 | Elena's page forty; rule, not digits | Elena `:155` (page forty, after `q_why`); `erb:861-874` corroboration | Closed |

## Items for the user

1. **U5 implementation (m5).** The orchestrator decided this on 2026-10-14, and the file doesn't have it yet. This is mission-local, so it is for the fixer, not the user, unless the user wants the engine route.
2. **SecGen checks (U3, unchanged).** None of this was opened. These need checking against SecGen by the user:
   - the debrief's three-doors line (`ink/m07_closing_debrief.ink:106`): an open share, a listener that gives out the operator password, and an account that can make itself root;
   - the ATTACK HOST credit (`erb:184`);
   - one target host;
   - the CyBOK NS/OSV keywords;
   - whether flag 4 can be reached before flag 3. If it can, `cascade_armed` never arms and the window never closes on a login (`erb:911`). The mission still finishes, but the clock beats are skipped.
3. **NFS guide URL (U4, unchanged).**
4. **No engine changes needed.** Every fix above uses latches, conditions and ink branches the mission already uses.

## Browser checks still owed (from round 1, still open)

- Park's entry chat when he is hostile, talked down and evaded, plus m7's third visit if adopted.
- The T-10 bark at minute 30 with the window open, and a late open after minute 40 once A1 is fixed.
- The HUD redirect timer appearing after the deduction and clearing on flag 3.
- The deduction menus on the phone.
- The debrief branches, and the busts for HaX and Netherton.
- The U5 aim no longer folding on the generator hall.

## Spoken lines these fixes would touch

No m07 audio exists yet; listed for the record.
- A1: one new Architect line.
- A2: one or two new Netherton lines and one optional HaX line.
- m1-m3: about four new Netherton/HaX lines.
- m6: one Hollis line and one narration line.
- m7: none new if a third visit diverts to `goes_loud`.
- m8: one Elena line and one HaX text.

## Can the stage move on?

**Not on this round's result alone: it has two majors.** Both are small, mission-local condition and text fixes, and probe routes already reproduce them.
1. Fix A1, A2 and m5 (U5). Ideally fold in m1-m3 at the same time, since they share one or two latches.
2. Add the p1 and p2 states to the route driver.
3. Run the browser checks above.

After that, a light cycle-3 confirmation is enough. The structure is sound: the deduction is the player's, the window is visible, and the costs are honest. Puzzle chains can follow straight after.
