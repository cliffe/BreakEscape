# m04 Critical Failure: puzzle chains review, pass 5 round 4

This is a read-only review (Opus). Kind of game: a SAFETYNET campaign mission, a TV spy thriller. It is measured against m01_first_contact and m02_ransomed_trust using the `mission-puzzle-chains` skill. Every citation is against `scenario.json.erb` (erb), the ink and the engine at commit e1f1a317 (the round-3 fixes). I did not open the SecGen XML or the four exploit field guides. VM claims are judged against the brief's "The VM side, at a high level" (`docs/agents/M04_PASS_BRIEF.md:11-22`).

## Checks run

- **Route driver, all 15 routes** (`node scripts/ink_runtime_check/m04_routes/route.js <file>`): **15/15 "all expectations met"**.
- **The stricter driver.** Every offered choice now counts towards `said` and `notSaid` (route.js:216). The risk is a `said` check that passes only because a choice's text contains the word, for example "dial" in "[Then the dial was the last piece.]". I ran all 15 routes through a temporary copy of the driver that ignores choice lines for `said`. Only one check then fails: r6's `said: "(No answer.)"`. That one is meant to match a choice, because the unanswered Vance phone is a choice-only knot. No other `said` check depends on a choice. Every `notSaid` check still passes under the stricter rule. **No regression.**
- **Validator** `--skip-ink --no-graph`: schema passed, geometry and doors OK. It reports 12 objective-wiring warnings, the known `agent_0x99` set (F5); `map_the_attack` now has three handlers, by design. It also reports 15 issues and suggestions (unchanged) and 2 missing recommended fields (the hidden Netherton and Nightshade seed NPCs).
- **dialoguelint**: 0 errors, and 5 blank-reentry checks (Cipher L130, Vance L614, guard L98, Voltage L388 and L422), the same set as before.
- **reopencheck**: 0 problems. `missions.json` has both new globals.
- **Probe routes** (scratchpad `m04-puzzlechains-r4/`, not in the repo): HaX's first phone open at the gate (R4-1), the operative-down reply after the workshop (R4-2), and the reader hint with the print already lifted (R4-3). Each reproduces its finding.
- **Engine reads**:
  - container-minigame.js `takeItem` (:677-692) builds a temporary sprite and calls `addToInventory`;
  - inventory.js `applyPickupAction` (:301-315, called at :623) emits `global_variable_changed`;
  - state-sync.js:76 sends `globalVariables` to the server, so `level1_card_held` survives a reload;
  - unlock-system.js:461 matches a keycard on `card_id || opens_lock`, so the spare's new `id` doesn't change which door it opens.
- No browser session (I'm a static reviewer).

## Severity table

0 blockers, 0 majors, 5 minors.

| # | Sev. | Finding | File:line | Concrete fix |
|---|---|---|---|---|
| R4-1 | minor | **HaX's first call assumes the player is already inside, and offers "Met Robert Vance" before they've met him.** `start` plays `first_call` on the first open unless the dial has been read, the workshop reached or the shutdown pressed (phone ink:101-108). Whether the player is past the gate isn't checked. The most likely first open happens at the gate, because HaX's "Gate first…" text arrives 3 s after the briefing (erb:731-736). The player is then asked "Are you inside the facility?" and all three answers say yes (ink:471-479). The first, "I'm inside. Met Robert Vance, the facility manager.", is offered whatever `vance_met` says. The reply then sends them to the dial in Hall 1 (ink:558) while they're still outside. Because `greeted` is spent, the moment can't be replayed. It's the same bug class as the earlier rounds: a branch keyed on the wrong state. Probe: with only `briefing_played` set, the phone prints the status check and the three "inside" choices | phone ink:101-108, 471-479, 556-560; erb:730-736 | Add a fourth choice to `first_call_choices`: `* {not guard_admitted and not security_guard_ko and not checkpoint_passed} [Not yet. I'm at the gate.]` → "Then the badge. Routine audit, came early. Call me once you're past him." → `-> support_hub`. Gate the three "inside" choices on `(guard_admitted or security_guard_ko or checkpoint_passed)`, and the "Met Robert Vance" one on `vance_met` as well. All the VARs are already declared in this file. Extend r15 with a gate-state first open: `said: ["at the gate"]`, `notSaid: ["Met Robert Vance"]`. The new HaX line is voiced, but no audio exists yet |
| R4-2 | minor | **"I've put one of their people down" still points at Relay's card when the player already has it.** In the one-down, Cipher branch, HaX says "Check what he dropped. Relay's the one carrying a workshop card." (ink:263). It doesn't check `relay_card_cloned` or `server_room_reached`. The choice stays open until the attack talk (`not voltage_priority_discussed`, ink:151). A common order is to clone Relay, work the VM, and knock Cipher down on the way back to the Hall 1 duty panel for the print. That player is sent after a card they've been using. The reply branches on *which* operative is down, not on *whether* the workshop card is held. Probe: Relay cloned, workshop reached, Cipher down; the line prints | phone ink:151, 251-266 | `One down. Check what he dropped.` then `{not relay_card_cloned and not server_room_reached: Relay's the one carrying a workshop card.}`. Both VARs are declared (ink:35, 9) |
| R4-3 | minor | **The plant-reader hint ignores a print that's already lifted.** `hint_reader` branches only on `fingerprint_kit_found` (ink:305-314). A player who has the kit and Vance's print, and asks because the door still puzzles them, is told "Now you need Vance's print… The duty panel in Hall 1", which is a walk back for something they hold. `vance_print_lifted` is a declared global (erb:2611), set on every lift (erb:932-936), but HaX's ink doesn't declare it. Probe: kit and print set, hint asked; the duty-panel line prints | phone ink:305-314; erb:932-936, 2611 | Declare `VAR vance_print_lifted = false` in HaX's ink and add a first branch: `- vance_print_lifted: You've got his print. Use it on the reader. It can't tell a lift from a living thumb.` (the second sentence repeats HaX's own lift text, erb:936). Optional: the same one-line branch in `report_progress`'s `not plant_room_entered` step (ink:845-849) |
| R4-4 | minor | **The new credits line names three documents whenever any one of the four was read.** The text "THE BREAK-IN: on paper — the OptiGrid work order, the camera gaps, the spoofed reader" shows on `evidence_maintenance_logs_found \|\| evidence_camera_tampering_found \|\| evidence_reader_spoof_found \|\| evidence_access_logs_found` (erb:201). Route r1 reads only the work order, but its credits list the camera gaps and the spoofed reader too (driver output). The fourth source, the workshop access log, is never named, so a player who read only that one sees three things they never found | erb:200-201 | Make it generic: `"THE BREAK-IN: traced on paper to the OptiGrid crew"`, with the same condition. Or use four lines, one per document, each on its own global. It's an unvoiced credits line, so the change costs nothing |
| R4-5 | minor | **Two VM texts assume the flags arrive in task order.** The FTP-flag text says "There's a legacy distccd on that box too… Prove it works." (erb:957-963) with no skip, so a player who submitted the distcc flag first is told to prove what they've already proved. The scan-flag text offers the FTP angle ("That FTP service…", erb:991-997) even when the FTP flag is already in. Both branch on which event fired, not on whether the step is done. This one is less likely than R4-1 to R4-3, because the scan has to come first, but distcc before FTP is a plausible order for a student who gets stuck on the FTP service | erb:990-997, 957-963 | Add `"skipIfGlobal": "flag_distcc_exploit_submitted"` to the FTP text's `sendTimedMessage`, and `"skipIfGlobal": "flag_ftp_intel_submitted"` to the scan text's. Each global is set by its own flag mapping (erb:1160-1161), on an earlier event, so it holds at delivery. The guide offers (`setGlobal`) stay as they are |

**Carried, not counted:** R2-6 stays open and **needs checking against SecGen by the user** (with m17). It covers the ProFTPD backdoor guide offered on the scan flag (erb:710-718, 996), "the fake rack status page", the flag strings, and whether root shows the charge-ceiling override.

**Noted, not counted** (checked and judged acceptable):
- The "Find Robert Vance" step is skipped for a player who holds a Level 1 card without having met him (ink:820), but the HUD task "Find the OT engineer on shift" stays open. That's acceptable. The hub names the next critical step, and the HUD lists the rest. When the night-crew choice opens, `hint_crew` sends a player who hasn't met Vance to him ("He'd have to trust you first", ink:348-349). `enter_facility` completes on room entry (erb:235-239), so the gate task is already outcome-based.
- Vance's clone safety net (`not vance_provided_keycard`, Vance ink:384-388) and "I'll need into the halls." (Vance ink:617) are still offered to a player holding the locker spare. They're harmless: the clone still works, and a second card does no damage.
- `report_progress` says "Hall 2 opens on Vance's card" (ink:831) to a player holding the spare. It's the same Level 1 card, so the wording is true enough.
- Vance's cover drop by evidence is still keyed to the work order alone (Vance ink:421). That's intended, because the line quotes his own email.

## Round 3: confirmation

| # | Decision | Status now | Evidence |
|---|---|---|---|
| R3-1 locker spare | Fixed | **Confirmed.** The spare has `id: security_spare_keycard_l1` and `onPickup.setVariable.level1_card_held` (erb:1675-1683). A container take goes `takeItem` → `addToInventory` → `applyPickupAction`, with no `_restoredFromSave` on the temporary sprite, so the latch fires and emits `global_variable_changed`. state-sync sends it to the server. The card step (ink:822), the Vance step (ink:820) and the card-reader hint (ink:157) all read it. `vance_provided_keycard` isn't set from the spare, so the RFID-guide text (erb:741-746) and Vance's clone choices behave as before. The door still opens: the match is on `opens_lock` (unlock-system.js:461). r15 part 1 passes | as cited |
| R3-2 slip past the guard | Fixed | **Confirmed.** `room_entered:operations_office` sets `checkpoint_passed` (erb:921-928). The gate step (ink:818), the gate hint (ink:160) and the card-reader and dial hint gates (ink:154, 157) read it. `guard_admitted` is untouched, so the guard's greetings are unchanged. r15 parts 1 and 3 pass | as cited |
| R3-3 break-in credits line | Fixed | **Confirmed, but see R4-4 for the wording.** The line is present (erb:201). It appears in r1, r2, r3, r5, r6 and r8 (evidence read) and not in r4 (none read). Both erb comments now say what the documents earn (erb:258-264, 1153-1158). The debrief reads no evidence global and says nothing that contradicts a no-evidence run (its "paper" lines are Voltage's operation log, m04_closing_debrief.ink:157-184) | driver output |
| R3-4 dead `all_flags_in` branches | Fixed | **Confirmed.** Both branches and their VARs are gone (Vance ink:453-461; phone Vance ink:221-229) | as cited |
| R3-5 root beat with Voltage down | Fixed | **Confirmed.** The disjoint twin on `voltage_neutralised === true`, 1.5 s (erb:1174-1182), lands ahead of the 2.5 s ESD-live text (erb:1206-1212). Together with the existing mapping (erb:1168-1173) every state is covered once | as cited |
| R3-6 leftovers | Fixed | **Confirmed.** `flags_submitted` and `objectives_completed` are gone from the globals and from HaX's VARs. r1 no longer sets `remote_trigger_disabled`. The evidence comment lists four sources (erb:1214-1220). Vance phone's `vance_provided_keycard` VAR is gone | grep |
| Sweep: Vance step | Fixed | **Confirmed.** It skips on `vance_provided_keycard`, `level1_card_held` or `plant_reader_seen` (ink:820). `plant_reader_seen` is set only by Relay's chat closing or a Hall 2 entry with Relay down (erb:778-793), and both need a Level 1 card, so it's a sound proxy for "Hall 2 is open". r15 part 2 passes | as cited |
| Sweep: dial hint | Fixed | **Confirmed.** It opens on `vance_met or robert_vance_ko or checkpoint_passed` (ink:154) | as cited |
| R2-6 VM detail | User's SecGen list | Open, carried | above |
| F6 Voltage re-entry, F7 sprites | Deferred | Unchanged: dialogue phase and character stage. The character stage is under way (new portraits untracked in the working tree) | `git status` |

## My sweep: "how, not whether"

I walked every branch and gate listed below and asked one question: does it test whether the player is past a step, or how they got past it?

**HaX's hub (`support_hub`, `report_progress`, every hint knot).**
- `report_progress` (ink:812-855): every step is now outcome-based.
- The race, Voltage, crew, mechanism, workshop, reader and Relay gates are all outcome-based.
- `hint_voltage`'s arrest line keys on `operative_static_defeated`. That's correct, because Voltage's arrest choices need exactly that (Voltage ink:305, 449), not `static_stood_aside`.
- `hint_crew` handles a knocked-out Vance and a Vance who isn't an ally.
- Two knots still key on the wrong thing: `operative_down_advice` (R4-2) and `hint_reader` (R4-3).
- One root-level branch outside the hub keys on the wrong thing too: `first_call` (R4-1).

**Vance's hub, face to face and by phone.**
- `vance_priority` (Vance ink:434-448) and `priority_guidance` (phone Vance ink:197-215) test `anomaly_detected`, then `server_room_reached` or either Level 2 route (clone or KO, the only two), then `attack_mechanism_known`. All of these are outcomes.
- The crew offer and its cost lines key on `voltage_neutralised` and `attack_mechanism_known`. Both are outcomes.
- Nothing in either hub is masked.

**Every automatic text** (HaX's 60-odd mappings, Vance's phone texts, the Relay, Static and Cipher mappings, the ESD refusals).
- Most keys are set however the player got there: `skipIfGlobal: anomaly_detected`, `vance_print_lifted`, `fingerprint_kit_found`, `voltage_neutralised` and `attack_prevented`.
- The hydrogen-alarm and crew-warned texts are disjoint across `vance_is_ally`, `robert_vance_ko` and `crew_warned`.
- The ESD refusals check dial, then cause, then Voltage, which are all outcomes (erb:2210-2214).
- The RFID-guide offer has a fallback for players who never cloned Vance (erb:767-773, 787-793).
- Only the two flag texts in R4-5 key on event order.

**Round 4 found three how-not-whether spots, and none of them cost solvability.** Each is a single text or reply, not a hub step that sticks for the rest of the mission. The class is close to used up.

## The improvement pass

1. **Boss-key audit and chain depth:** unchanged since round 1. Round 3 added an id, one latch, one mapping and hub conditions; no layout, lock or key moved. The plant reader is seen at depth 4 before the kit (depth 4, behind Level 2) and the print (depth 3, a back-track). The workshop door is seen at depth 3 before Relay's card (depth 4).
2. **Choices required (3a):** unchanged. The paper thread now earns its task tick, the work-order text, the cover-drop route and a credits line (R4-4 fixes the wording). The night-crew choice and Voltage's three outcomes all carry credits and debrief consequences.
3. **Softlocks (S1/S2):** none. The new latches only add states to the hub and never remove a route. `checkpoint_passed` is onceOnly on a room every player has to cross. `level1_card_held` is skipped when an item is restored from a save, but the saved global is what counts there.
4. **Capability arc:** unchanged. The lockpick and cloner are spent, and the fingerprint kit is granted and felt at the plant reader.
5. **Pacing:** unchanged. Nothing in round 3 added a crossing.

## Verdict

**Close the phase.** Round 4 finds no blockers and no majors. All five minors are mission-local, cost at most one line or condition each, and the fixer can apply them without another review round:
- R4-1: one new choice and three conditions;
- R4-2 and R4-3: a condition, and one VAR plus a branch;
- R4-4: one credits string;
- R4-5: two `skipIfGlobal`s.

The orchestrator can check the fixes with grep, the route driver (extend r15 for R4-1) and dialoguelint. That makes this the fourth review cycle. A fifth would be confirmation only, and I don't think it's needed: the rounds have narrowed from design questions (R1) to one engine-caused root cause (R2), then one hub pattern (R3), and now leftovers of that pattern in single texts (R4).

**Before or alongside closing:** none of round 3's browser checks has been run yet (the round-3 log says "static; no browser session"). Round 3's checks 1 and 2 (the locker-spare latch in a real container take, and walking off the guard's challenge) prove the two latches in the real engine. They're worth one short Sonnet run on :3001, or they can go into the first playtest round of phase 5. Static reading says both work (the evidence is in the confirmation table).

---

Measured against m01_first_contact and m02_ransomed_trust. Reviewed: round 4 (static). Route driver 15/15 pass, and no `said` check is satisfied only by a choice except r6's intended one. Validator: schema pass, geometry and doors OK, 12 wiring warnings (known), 15 issues and suggestions, 2 missing recommended fields. dialoguelint: 0 errors, 5 blank-reentry checks. reopencheck: 0. SecGen XML and the exploit field guides not opened.
