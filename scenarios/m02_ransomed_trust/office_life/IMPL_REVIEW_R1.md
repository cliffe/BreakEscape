# m02 office life: implementation review, round 1

Scope: stage 4 of the m02 office-life pilot, `git diff 340c93122 6cb872ff3` on `build/ol-m02` (tip `6cb872ff3`), read against PLAN.md draft 8, HANDOVER.md (top section), BASELINE.md, SPOKEN_LINES.md and the engine that reads each field. Static review only: no server, no browser. The live checks (PLAN 10.2 to 10.4) are another agent's work and are not judged here.

Kind of game: SAFETYNET campaign mission, a TV spy thriller. Test: the hospital feels lived-in at night, the night staff have small agendas of their own, and locks, keys, the critical path and cheat resistance are untouched.

## Severity table

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 2 |
| Minor | 8 |

## Checks run

| Check | Result |
|---|---|
| `ruby scripts/validate_scenario.rb ... --no-graph` (this worktree) | 0 errors, 31 warnings (base 28; the 3 new are V4 on Gary, Ernesto, Hodan, expected until E1) |
| `--office-summary` (V1) against `v1_summary_base.txt` | exactly three lines change: Gary (`post=gary_mug leash=rooms=it_department needs=caffeine`), Ernesto and Hodan added; NPC count 17 to 19 |
| V9 `ruby scripts/lock_key_diff.rb <current> baseline_locks.json` | `lock and key diff: empty`, exit 0 |
| V9 on the pre-stage-4 scenario (`git archive 340c93122`) against the same baseline | empty: the baseline is the base state, not the edited file |
| V2, V3, V5, V7 | nothing reported |
| V8 | heard 3/8, reveal 1/6, office-life onceOnly 2/10, items 1/4, small keys 6/64 |
| Office presets (validator info lines) | exactly the four planned: `it_photocopier` copier, `staff_boiler` kettle, `staff_cooler` cooler, `staff_microwave` microwave; the IT kettle and Boardroom cooler are opted out |
| Ink recompiled with `inklecate` into scratch | both `.json` files identical to the committed ones |
| V10, full validator from the sims worktree on m02's file | exit 1 with 3 errors, all `knot ... is not in scenarios/m02_ransomed_trust/ink/m02_npc_hodan_warsame.json`: that run resolves `storyPath` against the sims worktree, which has no Hodan story. A path assumption, not a fault in m02. No V10 line printed |
| V10, `ValidateOfficeLife.check` from the sims worktree on m02's rendered JSON | **0 issues**. Mutation check: with Hodan removed it reports both of Ernesto's pools as dead, so the check is live |
| Gate globals | `cover_burned`, `cover_restored`, `gary_ko`, `dr_kim_ko`, `patient_bed4_deceased`, `attacked_guard`, `guard_knocked_out` and the seven new globals are all declared `false` |

## 1. Plan against implementation, slice by slice

| Plan item | Implementation | Judgement |
|---|---|---|
| 2.1 Gary: `needsHome: "gary_mug"`, caffeine 60/4/35, `needsRooms`, `swivel: false`, print mapping appended last (`scenario.json.erb:2116` to `:2134`) | as planned; spawn (6.3, 5.8) unchanged | matches |
| 2.1 `gary_mug` (`:2342` to `:2346`) | as planned. It claims IT's conditional `dirty_mugs1` table item and moves it to (5.6, 4.2) (`core/rooms.js:2419` to `:2464`), which is what the prototype measured, and leaves no hole because that sprite is hidden unless claimed | matches |
| 2.1 IT kettle `affordance: false`; 3 Boardroom cooler `affordance: false` | done | matches |
| 2.2, 2.11 Ernesto and Hodan (`:3479` to `:3555`) | every field of the skeleton, values and positions as planned; `behavior.hostile.leash: true` read at `npc-behavior.js:508` and enforced by `npc-chase-leash.js` `hostileMayChase` | matches |
| 2.2 stand-in sprites | `male_telecom_v2`, `female_telecom_v2`, plus `spriteTalk` and `spriteVisemes` from the `male_telecom` and `female_telecom` sheets (not in the skeleton); all assets exist. Stand-in note present in the scenario comment (`:3473` to `:3476`) and in HANDOVER.md "Sprite stand-ins" | improvement (talk and visemes work in the stand-in builds) |
| 2.2 credits (`:230` to `:232`) | the three lines, in the planned place | matches |
| 2.11 HaX mappings (`:1380` to `:1406`) | the five mappings, appended at the true end of HaX's list (rendered indices 83 to 87 of 88), texts as drafted | matches |
| 2.6 mappings 1 to 4, 2.7 couplings | all six on Ernesto, two on Hodan, exactly as written | matches |
| 3 boiler, cooler, microwave (`:3621` to `:3635`) | boiler as planned. Cooler has **no `useFrom`** (plan: hand-written in stage 4). Microwave `useFrom { dx: 0.5, dy: 1.5 }`, an estimate | slip, tracked as open (M1, m1) |
| 3 `it_photocopier`, `it_copier_page` (`:2347` to `:2357`) | as planned; page declared last with an explicit position (6.45, 6.55), an estimate on the copier top. IT's three `notes` sprites are claimed by objects 2 to 4, so the page finds none, as the plan says | matches; position open (m1) |
| 3 dressing checks and "slice 5's lighting loop" | not done and not on the handover's open list, which says every slice is in | slip (M2) |
| 3 atmosphere: `officePresets`, `roomTone`, `roomToneTypes` (`:621` to `:625`) | done; `kitchen` and `quiet_office` exist in `data/room-tones.json`; room types match | matches; ordering note (m2) |
| 3.1 printout text | verbatim | matches |
| 6 pools | the 16 lines verbatim, all 40 characters or fewer | matches |
| 6 exchanges | the three knots verbatim in Hodan's ink with full-name prefixes; gates verbatim | matches |
| 6 conversations | Ernesto 16 lines, Hodan 12 (plan: about 14 and 12); every required beat is present (paper night, wary greeting, "Ward radios want nurses, not me.", radio shrug gated on `heard_night_watch_burned`) | matches |
| 7 globals | the seven, declared `false` | matches |
| New object and NPC `observations` (boiler, cooler, microwave, copier, page, Ernesto, Hodan) | not drafted in the plan; shown, never voiced | acceptable addition, wording notes in m4 |
| Gary's observation "Four" to "Two dead terminals" (`:2102`) | outside the plan's "existing lines changed: none", but it fixes a contradiction with the voiced ink (`ink/m02_npc_gary_whitlock.ink:80`) and the room's two PCs, is shown only, and is logged in SPOKEN_LINES.md | improvement |
| 0 preconditions: V1 to V10 on the branch before stage 4 | V10 is still only on `build/ol-sims`; covered now by the external run above | slip, closed by this review's run (m8) |

## 2. Engine fit

- **Field names and shapes.** `needs` entries, `jitterPct`, `needsRooms`, `needsCompany.groups`, `chatterCooldownMin`, `chatter` as topic to array (`normalisePool`, `npc-needs.js:228`), `exchanges[].with` as a plain id (`_exchangeWith`, `:2685`), `requireGlobal` as an object (`requiredGlobalsHold`, `:266`, strict equality), `affordance.overhearRadius` (read only from the affordance, `:3906`, `:4535`), `affordance.chatter`, `queue: false`, `useFrom`, `seat: "stand"`, `swivel: false` (`seating.js:1295`). No retired name anywhere; no new key inside an ERB loop.
- **Object-level `offWhen`.** On all three staff-room objects, beside `officeType`, never inside `affordance`. The live world copies `sd.offWhen` (`npc-needs.js:4716`); the pick paths copy it onto the job (`:1626`, `:1639`, `:2860`) and a walker or queuer turns back when it holds (`:3160` to `:3165`). The string form reads the global as truthy (`offWhenNames`, `_isOff`, `:688`). Correct.
- **Hostile leash.** `leash: true` with no `chaseAcrossRooms`, the m01 shape (`scenarios/m01_first_contact/scenario.json.erb:601` to `:608`). The chase stops when the player leaves the room the chase began in. Every other hostile field takes the defaults (chase speed 145, damage 10), as for any m02 NPC the player hits.
- **KO globals and the attack global.** `npc_attacked:<id>` is emitted only by a punch that turns a friendly NPC hostile (`player-combat.js:452` to `:462`), so `night_staff_attacked` is set on the first punch; no other in-game path knocks a friendly NPC out without it (the debug and test-bridge helpers are the only other callers of `damageNPC`). A knock-out therefore always implies `night_staff_attacked`, which is why the exchanges need not name the two KO globals.
- **Reveal global.** `it_copier_page_shown` is engine-owned and not monotonic: `_revealOutput` sets it true, and the reload filer sets it back to `false` (`npc-needs.js:4790` to `:4791`). The only readers are the room's reveal visibility (`core/rooms.js:3040` to `:3078`, `:3126`) and the needs use filter (`npc-needs.js:767` to `:770`); no server code reads it (no hit for it in `app` or `lib`). A race can at worst mis-show the tray page for one load. Acceptable, as plan section 7 says.
- **Print command.** `{ print: { producer, forget: true } }` always prints as owned with `viaCommand` and `forget` winning (`npc-needs.js:966` to `:982`, `_reserve` `:3646` to `:3670`), so Gary never fetches the page. The server side lets Gary's slot move through `OwnerClaim` (`print_command?`, `lib/break_escape/owner_claim.rb:157`).
- **Exchange gates and order.** `_findExchange` reads the lower id's list first (`ernesto_bautista` has none, so Hodan's), skips heard knots, and returns `gated` while a gate is closed, so a meeting keeps looking (`npc-needs.js:2702` to `:2719`). Lines come from a separate story instance (`npc-needs-chatter.js` header, `exchangeLinesFromStory`), so the exchanges never touch Hodan's conversation state. `heard_<knot>` is written through the shared global writer as a boolean `true`, which the `night_watch_cleared` gate's strict `true` matches.
- **Ink.** Both stories declare `night_staff_attacked` and `heard_night_watch_burned`, synced in at call-open as Bernie's story does. The `hub_quiet` and `#exit_conversation` then `-> hub` pattern is the m02 house pattern (`ink/m02_npc_receptionist.ink:31` to `:35`, `:309` to `:312`). No printed variable in any line.

## 3. Mission safety

- **Locks, keys, critical path.** V9 empty against the committed baseline, and the baseline matches the pre-stage-4 scenario. No new lock, key, door, gate, task or `concludeRequires`. The dungeon graph changed only in the room-contents diagram (renumbered nodes for the new objects and NPCs); the handover's puzzle-graph figures (105 nodes, 126 edges, 4-hop aim chain) were not re-derived here because the validator was run with `--no-graph`, as briefed.
- **Cheat resistance.** None of the new globals is read by a task, objective, lock, `concludeRequires` or any server code. The page is a declared item, so a pickup is stored from the server's own scenario copy; a tampered client could at most take an empty form early or replay an exchange, neither of which the policy requires the server to stop.
- **Sync budget.** Hand count of new `onceOnly` mappings: 7 (Gary's print, Ernesto's burn break, HaX's five), matching plan section 7. Seven new globals, six monotonic, the seventh the engine-owned reveal global above. Coupling and break-start mappings are not `onceOnly` and write nothing. Nothing grows with play time. m02 now has 131 `onceOnly` mappings in its rendered rooms, far below the 2000-key `triggeredEvents` cap.

## 4. Spoken lines

All new spoken lines are scenario data: 16 pool lines in NPC JSON, 11 exchange lines and 28 conversation lines in ink, with exact displayName prefixes that `speakerFor` resolves (`npc-needs-chatter.js:40`). No printed variable. HaX's texts and the credits are text only. SPOKEN_LINES.md lists them all (55 clips) with 0 changed and 0 removed. The stand-in sprite note is present.

## Findings

### M1 (major): the staff-room cooler has no hand-written `useFrom`

`scenario.json.erb:3626` to `:3630`. The plan (section 3 table and dressing checks) makes the cooler's approach cell a stage 4 measurement, with the rule that neither user's cell is within one tile of the south doorway. With none written, the cooler preset's default `useFrom { dx: 0, dy: 1 }` applies (`js/data/office-presets.json`, `cooler`). The drawn `water_cooler1` spans about x 270 to 294 px, y 185 to 232 px of a 320 px room (`room_hospital_staff.json`), so the default cell lies in the south-east corner, against the east wall and towards the south door, the door the player uses from the corridor on the critical path.

Failure scenario: on a mapping-4 break (`:3511`, fired exactly as the player walks in from the ward), Ernesto and Hodan walk to cells by the south doorway with needs walks that do not yield (`yieldToPlayer: false`); either the player is stopped or pushed in that doorway on the main route, or the second-user cell has no path and the job fails with `no_beside_cell`, so the 8 cooler pool lines (already budgeted for voicing) are never heard. V10 passes statically because it does not model cell geometry. The handover lists this as open item 2; it must be measured and set before any stage 5 playtest or voicing decision.

### M2 (major): the dressing checks and the staff-room lighting loop are untracked, and the handover says every slice is in

`HANDOVER.md:3`, `:13`, `:36`; PLAN.md section 3 "Dressing checks (stage 4)" and "Slice 5's lighting loop runs on the staff room"; `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md:216` to `:224` (slice 5 is dressing and lighting, slice 6 room tone). The handover numbers its slices differently (its slice 5 is "levers"), declares every slice of draft 8 done, and lists only the cooler, the microwave, the page position, the `offWhen` readback and Gary's drift as open. Not on any list: the doorway check for queue, approach and second-user cells; `playerHears` from every floor cell and each doorway's first floor cell; second-user reachability from both posts at both objects; the three free cups clickable with both NPCs seated and with the porter hostile; `room-snapshot.mjs` before and after; the clues (handover board, estates snag list, noticeboard, laptop, lanyard) reachable with both NPCs at the counter; and the lighting loop for a staff room that is now lit from load.

Failure scenario: the next agent works from the handover's six open items, stage 5 starts, and a clue such as the estates snag list (whose reading completes `gather_pin_clues`) turns out to be unclickable with Hodan standing at the boiler's second-user cell under the noticeboard, which the plan names as the risk; or the lit-from-load staff room ships without the review the plan requires. Fix: add the full section 3 dressing list and the lighting loop to the handover's open list, and correct the "every slice is in" claim.

### m1 (minor): two positions are still estimates

`scenario.json.erb:2354` (page at 6.45, 6.55, from the copier's Tiled bottom edge 7.88 less its 46 px height) and `:3634` (microwave `useFrom { dx: 0.5, dy: 1.5 }`, aimed one tile east of the boiler's second-user cell). Both are on the handover's open list. Failure scenario: the page lands off the copier top and reads as a stray paper on the floor, or Ernesto's microwave cell coincides with Hodan's boiler cell and he waits or fails. Measure live.

### m2 (minor): room tone went in at slice 2, before dressing

`scenario.json.erb:624` to `:625`. The missions plan puts room tone last because it follows the final layout and dressing. Harmless now, since only the profile mapping is set, but the tone listen in PLAN 10.2 should run after the dressing loop, not before.

### m3 (minor): V8's figures differ from the plan's expectation and the handover does not reconcile them

PLAN 10.6 expects "V8 14 keys ... `onceOnly` 7 of 10"; V8 prints `office-life onceOnly mappings 2/10` and `small keys 6/64`, because it counts only office-life mappings (Gary's print and Ernesto's burn break) and not HaX's five attack and KO mappings. The hand count is 7, as planned, and every total is far under its cap. Record the difference in the handover so the rollout's later missions do not read 2/10 as the whole cost.

### m4 (minor): wording of the new observations (shown, not voiced)

`scenario.json.erb:3515`: Ernesto's "a stack of empty specimen boxes by his feet" describes a prop the room does not draw. `:3553`: Hodan's "a bed list written on the back of something else" gives away the paper exchange's "My bed list's on the back of a menu" before the player hears it. `:2356`: the page is "warm from the copier" for the rest of the mission. For the dialogue review, not a blocker.

### m5 (minor): the struck-only credits line hides a second victim

`scenario.json.erb:232`. If one of the pair is knocked out and the other only struck, the credits show the knock-out line and nothing for the struck one, because the attack line requires neither KO global. That is the plan's wording (2.2) and a user-decided text-only consequence, so it is accepted; noted for the rollout, where a larger cast makes it more likely.

### m6 (minor): HaX's attack and KO texts can arrive close together

`scenario.json.erb:1390` to `:1406`. Both are `delay: 2000` after their own global. A player who lands the four punches a knock-out needs (25 per punch against 100) inside about four seconds gets "You just hit one of the night staff..." and "The night porter is down..." as stacked toasts. Live check 10.4 step 2 should record the gap; if they stack, lengthen the KO text's delay.

### m7 (minor): the cleared exchange's Boardroom gate is still undecided

PLAN 6 gate notes leave to the dialogue review whether `insider_asset_arrested` or `night_security_supervisor_ko` should also close `night_watch_cleared` ("Fuss over nothing" next door to a Boardroom arrest or a knocked-out supervisor). The implementation gates neither (`:3542`). Make sure the dialogue review decides it.

### m8 (minor, tooling): V10 is not on this branch, and the full sims run gives false errors

V10 lives only on `build/ol-sims`; the plan's precondition was V1 to V10 on main before stage 4. Run directly, V10 reports 0 issues for m02 (above). The full validator from the sims worktree reports 3 false knot errors because it resolves `storyPath` against its own tree. Separately, for the V10 owner rather than m02: a mutation that moves Hodan's `needsRooms` to `["it_department"]` while she stays in the staff room is not reported, although her leash would then keep her from the boiler and cooler and leave Ernesto's pools without a partner.

## Verdict

Revise before stage 5, not before the live checks. The implementation follows draft 8 closely: every field, value, line, gate, global and mapping position matches the plan, the engine reads each field where the plan says it does, the lock and key diff is empty against a baseline that matches the base state, nothing server-side reads the new globals, the sync cost is as budgeted, and V10 passes. No blocker. The two majors are unfinished stage 4 work rather than errors in what was written: set and measure the cooler's `useFrom` (M1), and put the plan's full dressing checklist and the staff-room lighting loop on the open list with the "every slice is in" claim corrected (M2). The minors can go with the live-check fixes and the dialogue review.

## Outcomes (stage 4 round 1 fixer, 2026-11-15)

| Finding | Outcome |
|---|---|
| M1 | Fixed. The live run (`STAGE4_LIVE.md` 5) found no doorway problem: the default cell is (276, -12) and the second-user cell (244, -12), 224 and 192 px from the south doorway's first floor cell and 160 px or more from every other doorway, and both used the cooler together on 4 of 4 mapped breaks with no `no_beside_cell`. So the measured default is now written explicitly, `useFrom { dx: 0, dy: 1 }`, with the measured cells in the ERB comment. The finding's failure scenario did not occur. |
| M2 | Fixed. The static dressing checks were run (results in HANDOVER.md, "Dressing checks"); the rest and the staff-room lighting loop are now on the handover's open list, and the "every slice is in" claim is corrected. |
| m1 | Partly fixed. Page: the live screenshot put it at the copier's top-left corner, 15 px left of centre; x moved 6.45 to 6.92 to centre it (needs a live screenshot, on the open list). Microwave: the cell was measured at (228, -132), a tile east of the boiler's second user, as intended; a run with microwave and boiler in use together is still open. |
| m2 | Deferred to the open list: the room-tone listen runs after the dressing and lighting loop. Nothing to change in the data. |
| m3 | Fixed: the handover records that V8's 2/10 counts office-life mappings only and the hand count is 7. |
| m4 | Ernesto's and the page's wording fixed (dialogue review m8, m10). Hodan's "on the back of something else" kept: the dialogue review reads it as a set-up for her exchange line, not a spoiler, and an observation is optional text. Withdrawn for that part. |
| m5 | Accepted as written (user-decided text-only consequence); noted for the rollout in the handover. |
| m6 | Deferred to live check 10.4 step 2. The one live knock-out took 10 punches, so the two texts were well apart there; the delay changes only if a measured gap shows stacking. |
| m7 | Fixed: the cleared exchange now also needs `insider_asset_arrested` and `night_security_supervisor_ko` false. |
| m8 | Deferred (tooling, outside m02): V10 stays on `build/ol-sims`; the false knot errors and the `needsRooms` mutation gap go to the V10 owner. On the handover. |

Live finding (mapping 2 never fires if the staff room has not loaded): engine reason is that NPCs, and so their `eventMappings`, register room by room as each room loads (`npc-lazy-loader.js` `loadNPCsForRoom` then `npcManager.registerNPC`); `fireOnlyWhenLoaded` is a validator opt-out only and changes nothing in the engine. No data change is needed: IT's only connection is the staff room (`connections.west`), so in play the staff room has always loaded before the keycard conversation, and only a harness that starts inside IT can skip it. If it ever were skipped, mapping 1 on the next staff-room entry starts a boiler break and the burn exchange, first in Hodan's list, plays then. Recorded in an ERB comment on Ernesto's mappings. Not an owner item.
