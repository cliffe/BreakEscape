# m07 The Architect's Gambit: alignment review, pass 5, cycle 3 (light confirmation)

Stage 2, `mission-alignment-plan` rubric. Fresh reviewer, read-only. 2026-10-14.
The task had two parts. First, confirm every round-2 fix (`IMPROVEMENT_LOOP_LOG.md`, "Stage 2 alignment, round 2") against `scenario.json.erb` (cited `erb:N`) and the ink (`ink/<file>:N`). Second, look for new problems in the states the round-2 latches create: `revision_before_commit`, `decode_read_open`, `revision_found_open`, `logged_in_before_door`, `cascade_armed` and `team_redirected`.
The working tree matches HEAD 0a761060 for m07. I opened no SecGen XML and none of the four restricted field guides. I started no browser session; a Sonnet browser check is running at the same time.

## Checks run (outputs in the session scratchpad, `m07-align-c3-reviewer/`)

- **Route driver.** r1-r12 all pass ("all expectations met"). The longest run without a choice is still the debrief read-out (55-63 lines), which belongs to the dialogue stage.
- **Probe routes.** I wrote six probes for states the twelve routes don't cover. They stay in scratch and are not added to the repo. All six run clean, so the problems they show are in the text, not the plumbing.
  - `q1_informed_commit_open_not_declined`: shows C1.
  - `q2_decode_read_then_trojan_undeduced`: shows C2.
  - `q3_decode_uncommitted_login_commit_then_deduce`: shows C2.
  - `q4_redirect_before_t20`: shows C3.
  - `q5_trojan_direct_deduce_after_timeshut`: clean.
  - `q6_decode_open_t10_then_login_before_door`: the order line, the A2 lines and the credits are all correct; it also shows C4.
- **dialoguelint.** 0 errors. The style notes haven't changed since round 1: transition 1, not-x-but-y 1, you-after-choice 2, blank-reentry 6.
- **Validator** (`--skip-ink --no-graph`). Schema, geometry and doors pass. It gives 4 warnings, all for the repeatable person-chats (Hollis's sight chat and Park's entry chat, deliberate), and 3 credits-fallback suggestions. The 11 duplicate-mapping notes that the fixer logged appear only in a full run. None needs action.
- **Engine facts checked for the latches.**
  - A condition that fails does not use up a `onceOnly` handler (`js/systems/npc-manager.js:597-628`).
  - Every inventory read emits `global_variable_changed` again (`js/systems/interactions.js:1393-1406`). So `decode_read_open` latches on a re-read inside the window, as its comment says.
  - A page reload restores synced globals and ink variables but not ink visit counts. Only `npcInkVariables` is saved (`js/state-sync.js:13`, `:126`). This matters for C5.

## Severity table

| # | Sev | Rubric row | Finding (short) |
|---|-----|-----------|-----------------|
| C1 | minor | 5 | A player who made the deduction and then committed the team elsewhere with the window open hears that the team "was not moved" / "did not move", not that they chose |
| C2 | minor | 5 | A decode read before the commit isn't latched. Trojan chosen without the deduction hears "You had no way to know". Commit after a login, then the deduction, hears "The timing was his, not yours" |
| C3 | minor | 4 | T-20 after an early redirect treats Austin as the first pick ("Almost nobody picks the one with no bodies in the brief") |
| C4 | minor | 4 | An unheard T-20 plays straight after T-10 in the same call, twenty minutes stale and in reverse order |
| C5 | minor | 7 | Park's third-visit threat counts ink visits, so a page reload between visits replays "Second time" and puts off the swing by one visit |
| C6 | minor | 4 | HaX tells a player who committed after a login, a minute earlier and with the correction in hand, that "The team's on the ground on a live objective" |

**Counts:** 0 blockers, 0 majors, 6 minors. Every round-2 finding is confirmed closed (table below).

---

## Minor findings

### C1. Informed commit elsewhere with the window open reads as passivity
- **Evidence.** Probe q1 plays it: no commit in the briefing, flag 1, the decode read, the deduction with no team, then Fracture committed on the hub. All three latches set: `revision_found_open` (erb:900-905), `revision_before_commit` (erb:906-912) and `decode_read_open` (erb:920-926). The player didn't ask about a redirect.
  - The debrief takes the `revision_found_open` branch first: "The team was not moved on it." (`ink/m07_closing_debrief.ink:236`). HaX follows with "The team not moving is a separate sentence." `dark_trojan` adds "You knew. You found it and it did not move." (`:333-335`).
  - The credits print "CORRECTION FOUND WITH THE WINDOW OPEN: the team was not moved" (erb:197). The more accurate line, "CORRECTION IN HAND BEFORE THE CALL" (erb:200), is excluded by `!revision_found_open`.
  - Each line is literally true. But the player didn't leave a team where the brief put it: they chose Fracture over Austin with the nine days in hand. The same choice made after a login gets "You had it before you made the call, and sent the team elsewhere." (`:246`, route r10). Two players with the same knowledge at the commit are judged in different words, and the one with more time is told they were passive.
- **Fix.** Make it a branch, not a let-off; the cost stays.
  - In `revision_payoff`, under `- revision_found_open:` (`:232-239`), test `revision_before_commit and not redirect_declined` before the existing `redirect_declined` test. Netherton: "You had it before you made the call, and sent the team elsewhere. The window stayed open after that." The two HaX lines stay.
  - In `dark_trojan` (`:333`), put `revision_found_open and revision_before_commit` first. HaX: "You knew before you sent them, and you sent them somewhere else. That's the sentence I'm writing."
  - Credits: add `&& !globalVars.revision_before_commit` to erb:197. Widen erb:200 to `revision_before_commit && !redirect_declined && team_assigned && team_assignment !== 'trojan_horse' && !team_redirected` (drop `!revision_found_open`).
  - Leave N1's praise gate as it is. "Next time it moves the team" still fits this player.
  - Add q1 as a route.

### C2. A decode read before the commit isn't latched
- **Evidence.** `decode_read_open` needs a committed team or a commit with the window open (erb:913-926, both `!redirect_window_closed && team_assignment !== 'trojan_horse'`). That is right for "the window was open". But a decode read while the team was still uncommitted counts for nothing if the player then commits without making the deduction.
  - Probe q2 (decode read, never deduced, then Trojan Horse chosen on the hub): "You had no way to know what you were choosing. I would like it noted that you chose it anyway." (`ink/m07_closing_debrief.ink:174`). Their schedule was in the player's kit when they chose. This is the same family as the round-2 A2 fix.
  - Probe q3 (decode read with no team, the flag 3 login, Fracture committed afterwards, then the deduction): "You found it after the window had closed… The timing was his, not yours." (`:254-255`), with credits "CORRECTION FOUND AFTER THE WINDOW SHUT". The player held the decode and left the team uncommitted through the login. The timing was the player's. `deduce_right`'s "found, not ignored" (`ink/m07_phone_agent_0x99.ink:393`) says the same.
  - Both paths are rare: the briefing must be closed without a commit.
- **Fix.** Add one latch, `decode_before_commit`.
  - Mapping: `global_variable_changed:team_assigned` with `value === true && globalVars.found_coordination_traffic === true && !globalVars.projection_revised`, onceOnly, on `agent_0x99`. Declare it in `globalVariables`, the debrief, and the m07 entry of `missions.json`.
  - `covered_trojan_direct` (`:170-176`): add a middle branch. "Their schedule was in your kit when you made the call. Whatever you read in it, you sent them to Austin."
  - Found-late block (`:248-256`): before `- else:`, add `- decode_before_commit:`. Netherton: "Their schedule was in your hands before you sent the team anywhere. You put it against the brief afterwards." HaX: "Late is still found. It goes in the report as late."
  - Optionally, give `deduce_right`'s window-shut branch (`ink/m07_phone_agent_0x99.ink:390-393`) the same "late" wording under this latch.
  - Credits: erb:202 gains `&& !globalVars.decode_before_commit`. Extend erb:201's condition to `(decode_read_open || decode_before_commit)`. Its text says "with the window open", so give it a neutral variant: "CORRECTION FOUND LATE: their schedule was read before the brief was put against it".
  - Add q2 and q3 as routes.

### C3. T-20 after an early redirect
- **Evidence.** A redirect needs flag 1 and the deduction. A fast player can do both before minute 10 (probe q4: redirect at minute 3, T-20 at minute 11). `taunt_t20` reads `team_assignment` only. The redirected player hears "The update pipeline. Interesting. Almost nobody picks the one with no bodies in the brief." (`ink/m07_architect_comms.ink:138`). He watches the board, and he knows the team was moved; his T-10 and sign-off both say so (`:185`, sign-off `team_redirected`).
- **Fix.** In `taunt_t20` (`:131-148`), add a first branch. "You moved them already. You read the column nobody reads. So Washington goes dark after all, and San Francisco was always going to." (He names the operation left behind.) `VAR team_redirected` is declared at `:20`.

### C4. T-10 and an unheard T-20 play back to back, in reverse order
- **Evidence.** Probe q6: the player ignores the T-20 bark at minute 10 (busy on the VM) and opens the Architect's call at minute 31. `start` checks T-10 before T-20 (`ink/m07_architect_comms.ink:54-62`). T-10 plays ("Ten minutes, and your team is too committed to move… The call ends mid-syllable."). Its exit diverts to `parked`. `parked` sees `architect_t20_played and not heard_t20` (`:392`) and goes straight on into "You've sent your team. San Francisco. Of course…" in the same continuation, twenty minutes stale.
  - The same happens after T-5 for a player who committed after logging in, because T-20 has no `architect_t5_played` guard.
  - This predates round 2. It became reachable when T-10 got its own timer in round 1, and the redirect-window warning in T-10 is the line that matters.
- **Fix.** A later transmission supersedes T-20.
  - Set `~ heard_t20 = true` at the top of `taunt_t10` and `taunt_t5`, next to their own `heard_` lines.
  - Add `and not architect_t10_played and not architect_t5_played` to the T-20 test in `start` (`:60`), `parked` (`:392`) and `dead_air_choices` (`:371`).
  - Add `&& !globalVars.architect_t10_played && !globalVars.architect_t5_played` to the T-20 bark row (erb:1310-1313) for completeness.
  - The names-what-was-left content is repeated in T-5, so nothing is lost.

### C5. Park's third visit counts ink visits
- **Evidence.** `back_at_it` branches on its own visit count (`ink/m07_npc_thomas_park.ink:122`). After a page reload the engine restores ink variables but not visit counts (`js/state-sync.js:13`, `:126`; the route driver models this as `"reload": "page"`). A player who backs off twice with a reload in between hears "Second time. There isn't a third." twice, and Park swings only on the fourth visit. The threat holds, one visit late. Reloads are common in this mission, because the VM work runs long.
- **Fix.** Add a counter `VAR park_returns = 0`. Increment it at the top of `back_at_it`, and branch on `park_returns == 1`. It is an ink variable, so `npcInkVariables` carries it over a reload. Add a route step: evade, re-enter, `"reload": "page"`, re-enter, and expect the swing.

### C6. "On the ground" to a team committed a minute ago
- **Evidence.** Route r10: the player commits Fracture after the login, knowing the correction. The hub at once offers "Can I still move the team to Trojan Horse?" (`ink/m07_phone_agent_0x99.ink:218`). HaX answers "The team's on the ground on a live objective. Pull them now and we strand two operations instead of one." (`:452`). The team left Denver seconds ago. The refusal is right, because the login fixed things, but the reason given is false.
- **Fix.** Declare `VAR revision_before_commit = false` in the phone ink. In `redirect_closed`, branch: "You made that call after you'd logged in, with the numbers in hand. It stands." Otherwise keep the current line. Or hide the hub option when `revision_before_commit`. The first keeps the player's question answerable.

---

## Confirmation of round-2 findings (checked in the files, not the log)

| # | Outcome claimed | Verified at | Status |
|---|---|---|---|
| A1 | T-10 branches on redirect, then the login, then the time-shut window; bark row 3 keys on `cascade_armed`, rows 1-2 exclude it | `ink/m07_architect_comms.ink:183-196` (`:185`, `:187`, `:189`); erb:1323-1340; routes r6, r7 | Closed |
| A2 | Reader / non-reader split in the debrief and credits | debrief VAR `:41`; `:262-270` (`:266`); `dark_trojan` `:343-344`; erb:203-204; r8, q6 | Closed (C2 is a neighbouring gap at the commit) |
| m1 | Informed Trojan commit | latch erb:906-912; debrief `:171-175` (`:172`), `:214-218` (`:215`); r9 | Closed |
| m2 | Correction held, commit elsewhere after a login | debrief `:245-247` (`:246`), `dark_trojan` `:339-340`; credits erb:200, erb:202 exclusion; r10 | Closed (C1 is the window-open twin) |
| m3 | Decode read open, deduced late | latches erb:913-926; debrief `:250-252`; phone `:390-391`; credit erb:201; r11 | Closed (C2 covers a read before the commit) |
| m4 | Field names only in the second menu | phone `:353-366` ("The dormancy." `:357`, "The site." `:363`); decode vs summary rows erb:1669, erb:301 (840 and Austin/TechForge in both, so key count and site are rightly wrong) | Closed |
| m5 | U5 applied | erb:432-455: title has no "(Optional)", no `optional` on either task, comment rewritten | Closed in the files; the browser look is with the concurrent check |
| m6 | Hollis's re-sighting line | `ink/m07_npc_ray_hollis.ink:235`, `:237` | Closed |
| m7 | Park's third visit turns him hostile | `ink/m07_npc_thomas_park.ink:119-131`, `= swing` `:102-109`; r2 | Closed (C5: the counter doesn't survive a reload) |
| m8 | Elena's team lines; HaX's Elena verdict rows | Elena `:248-256` (`:255`); erb:830 (`team_assigned === true`), erb:838 (uncommitted row) | Closed |
| m9 | T-20 dead branches removed; Elena's `EXTERNAL` removed | architect `:141-145`, `:160-162`; Elena `:23` (comment only) | Closed |
| N1 | Stance praise and "Above expectations" gated on the window state | debrief `:604-608`, `:621` | Closed |
| N2 | Mercer credit | erb:209 "Left before the cordon closed — no trace" | Closed |

## Latch state space covered

| State | Covered by | Every debrief/credit line true? |
|---|---|---|
| Deduced with the window open, redirected | r1, r7 | yes |
| Deduced with the window open, held, no redirect asked | r12 | yes |
| Elena before the commit, commit elsewhere, redirect declined | r4 | yes |
| Deduced before the commit, commit elsewhere with the window open, no redirect asked | q1 | **no: C1** |
| Deduced before the commit, commit elsewhere after a login | r10 | yes (C6 on the phone) |
| Deduced before the commit, Trojan | r9 | yes |
| Decode read before the commit, not deduced, Trojan | q2 | **no: C2** |
| Decode read before the commit, login, commit, deduced late | q3 | **no: C2** |
| Decode read with the window open, deduced after a time shut | r11 | yes |
| Decode read with the window open, never deduced, login before the door | q6 | yes (C4 on the Architect's line) |
| Decode read, never deduced, team committed in the briefing | r8 | yes |
| Trojan direct, deduced after a time shut | q5 | yes |
| Trojan direct, early login | r3 | yes |
| Never committed | r5 | yes |
| T-10 opened late, no login | r6 | yes |
| Redirect before T-20 | q4 | **no: C3** |

## Needs checking against SecGen by the user (U3, unchanged)

I opened none of these files. Still open:
- the debrief's three-doors line (`ink/m07_closing_debrief.ink:106`) and the ATTACK HOST credit (erb:184);
- the one-host wording;
- the CyBOK NS/OSV keywords;
- whether flag 4 can be reached before flag 3. If it can, `cascade_armed` never arms, the window never closes on a login, and `logged_in_before_door` never sets.

## Spoken lines these fixes would touch

No m07 audio exists yet; listed for the record.
- C1: one Netherton line and one HaX line.
- C2: one Netherton line in `covered_trojan_direct`, one Netherton line and one HaX line in the found-late block, and optionally one HaX phone line.
- C3: one Architect line.
- C4: none.
- C5: none.
- C6: one HaX phone line.

## Can alignment close?

**Yes.** Nothing is above minor.
- Every round-2 fix is in the files and holds on the routes.
- The structure meets the aim. The deduction is the player's. The window is visible and its close is warned five times. The two or three operations left unanswered are always read out. The blame splits are right for every state the twelve routes drive.
- The six new findings are edge wording. Each sits on a path that needs the briefing closed without a commit, an unusually fast redirect, an ignored bark, or a reload between Park visits.
  - C1 is the most likely of them and the one I'd fix first.
  - C1 and C2 together are about four latch-and-branch edits. They can go to the dialogue stage, or into a short fix round before puzzle chains starts if the orchestrator prefers.
  - C3-C6 belong in the dialogue stage.
- Closing still depends on the concurrent Sonnet browser check confirming the round-2 items owed from the browser:
  - the U5 aim no longer folding on the generator hall;
  - Park's third visit going hostile;
  - the late T-10 open;
  - the field-name deduction menu;
  - the new debrief branches.

If that check finds nothing above minor, move to `mission-puzzle-chains`. If the C1/C2 fixes are folded in first, add q1-q3 as routes r13-r15.
