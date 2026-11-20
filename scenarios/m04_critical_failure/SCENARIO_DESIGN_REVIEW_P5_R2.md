# m04 Critical Failure: scenario design review, pass 5, round 2

Reviewer: fresh Opus agent, read-only (2026-10-13). Skill: `scenario-design-review`. Static review, with no browser session. Sources: `scenario.json.erb` and the ink at f5baf890 (the working tree is clean for m04), plus the engine where a fix depends on it. I didn't open the SecGen XML or the four listed field guides. The "(Optional)" title prefixes are a known stopgap and aren't reported.

## Tools

- **Routes:** 18 of 18 report `[result] all expectations met`, each with exit code 0 (each file path passed to `route.js`).
- **Validator** (`--skip-ink --no-graph`): the schema passed, geometry and doors are OK, and there are 16 warnings. They are the round-1 set (the handler-count notes, the two sight-challenge cutscenes, the two hidden briefing co-speakers) plus the intended "2 items point to engineering_workshop" note. Nothing is new.
- **dialoguelint:** 0 errors and the same 5 `blank-reentry` checks, already deferred to the dialogue phase.

## Severity table

| # | Sev. | Finding | Evidence | Fix |
|---|---|---|---|---|
| n1 | minor | **Round-1 fix m1 can't fire in the case it was written for.** The cloner is a start item (`startItemsInInventory`, erb 487). With no matching card, an RFID door with a cloner in the inventory opens the RFID minigame (`unlock-system.js:515-541`, priority 2). With no keycards and no saved clones, the minigame shows "No keycards in inventory" and never calls `onRefused` (`rfid-ui.js:180-184`; `onRefused` fires only from `_showDenial`, `rfid-minigame.js:153`). So `door_unlock_failed:battery_hall_2` is never emitted for a player with no card, and the stuck point from round 1 still has no prompt on screen. | erb 808-813 | Key the text on `door_unlock_attempt` instead (the m05 pattern, m05 erb 976-981). It fires before the outcome is known (`unlock-system.js:112-123`), and the existing condition already excludes card holders: `"eventPattern": "door_unlock_attempt", "condition": "data.connectedRoom === 'battery_hall_2' && globalVars.vance_provided_keycard !== true && globalVars.level1_card_held !== true"`, onceOnly, same text. |
| n2 | minor | **The what-failed count is now wrong.** After M1's three network lines, HaX still opens with "Three things let them in. Two of them let you in too." It then lists six weaknesses, and the player used all three network ones (flags 2-4) as well as the cards and the print. | `m04_closing_debrief.ink:213` | "Before you write it up. Here's what let them in. Nearly all of it let you in too." (spoken line; no m04 audio yet). |
| n3 | minor | **Static vanishes in front of the player with no line.** On the m3 route (Static stood aside, Voltage punched down), the new mapping sets `static_left`, and the `setVisible:false` mapping removes him at once, usually in view, since the fight is in the plant room. Nothing says he went. On the escape route Voltage's ink narrates it (`m04_npc_voltage.ink:406`). Here only the credits do. | erb 2199-2206, 2207-2211 | Add a HaX mapping on `global_variable_changed:static_left_alone` (value true, onceOnly) with a short text, for example "Static's gone out the dock door. Let him go. The button's what matters." (delay about 2 s, `skipIfGlobal: attack_prevented`). |
| n4 | minor | **A player who talks to Vance but leaves before the end of the meeting is "never met".** `vance_met` is set only on the meeting's three exits (`m04_npc_robert_vance.ink:335`, `:348`, `:625`). A player who clones his card mid-meeting (`vance_clone_cover`) and then closes the chat has spoken to him and copied his card. They still get the not-met debrief ("why nobody told him", no Vance lines) and the credit "ROBERT VANCE: never met — you went round him". The task `meet_robert_vance` is already complete at `:65`. | debrief `:234-237`, `:365`, `:495-506`; erb 194-195 | Add `#set_global:vance_spoken:true` beside `#complete_task:meet_robert_vance` (`:65`), declare `vance_spoken` in `globalVariables` and as a VAR in the debrief, and use it in place of `vance_met` in the debrief's not-met conditions and the two credits. Leave `vance_met` alone, since it routes re-talk to the hub. |
| n5 | minor | **Stale graph metadata after M-2.** Vance's `puzzle_graph_actions` still says `"unlocks_aim": "confirm_the_lie"`. The aim now opens when Get Inside completes on entering the ops office, without Vance. | erb 1432 | Drop `unlocks_aim` from that action (or point the action at the Level 1 card, `battery_hall_2`). |

**Counts: 0 blockers, 0 majors, 5 minors.** No new items need checking against SecGen. S1-S7 from round 1 still stand.

## Round-1 findings: confirmation

| # | Status | Checked at |
|---|---|---|
| M1 | Confirmed. Three network lines and one fix line at the brief's level; the intelligence `else` credits the FTP drop. The count in the opening line is now off (n2). | debrief 186-193, 224-230 |
| m1 | **In place but ineffective** (n1) | erb 808-813 |
| m2 | Confirmed. A 6 s text with `targetKnot` (same shape as m03 erb 920); the hub re-offer is gated on `anomaly_call_heard`, set at the top of the knot. `anomaly_call_heard` is ink-local, so the re-offer can return after a reload. That's harmless (it replays the call). | erb 772-777; phone 134-135, 451 |
| m3 | Confirmed (mapping, new global, twin credit, r18). Presentation gap: n3. | erb 2199-2206, 199-200, 2662 |
| m4 / M-3 | Confirmed: every Vance line, "Vance needs to hear it too", both farewells and the credits are gated; `debrief_end_not_met` added; r17 passes. Edge case: n4. | debrief 234-237, 365-506, 530-535; erb 193-195 |
| m5 | Confirmed ("brought in — ran the desk…") | erb 193 |
| m6 | Confirmed (`#set_global:blackout_named:true` on the captured line; credits run after the debrief closes) | debrief 144 |
| m7 | Confirmed. Set at the top of `voltage_negotiation_attempt`, where the "six cities" line is unconditional; declared in `globalVariables`; the debrief branches on it. | voltage 187-191; debrief 273-279; erb 2663 |
| m8 | Confirmed (choice and orphan knot removed; two once-only choices remain, reached once per session) | phone 527-537 |
| m9 | Confirmed. No "under arrest" left in m04's spoken lines or choices. "arrest" survives only in comments, knot names, a graph label (not player-facing) and Voltage's own line about the police (`voltage:262`). | voltage 310, 454; phone 339-341 |
| m10 | Confirmed (all three alarm texts at 8000 ms) | erb 896, 903, 914 |
| m11 | Confirmed (titles; stopgap not reported) | erb 275, 403 |
| m12 | Confirmed | phone 846 |
| m13 | Confirmed (three comments corrected, no logic change) | erb 1026-1035, 1125-1131, 2405-2411 |
| m14 | Confirmed (`npcIds` lists only `agent_0x99`, `robert_vance_phone`) | erb 483 |
| m15 | Confirmed (spare key metadata; cloner unlocks both rooms) | erb 492, 1705-1707 |
| m16 | Confirmed (item name matches the sheet title) | erb 722 |
| m17 | Accepted in round 1 (m03 pattern); unchanged | — |
| M-1 | Confirmed. With the dial unread the aim-complete text omits "Get to the ESD", and the 2.5 s dial text follows it. The three map-the-attack texts are disjoint. | erb 1188-1209 |
| M-2 | Confirmed (`meet_robert_vance` optional; aim completion skips optional tasks on client and server, `objectives-manager.js:847`, `game.rb:2136`) | erb 245-251 |

### Regression checks

- **Aim order without Vance.** Entering the ops office completes Get Inside and unlocks Confirm the Lie at once. Vance stands in that same room (erb 1389-1403), so a player sees the aim tick and "Verify the rack temperatures independently" appear while he's in front of them. His optional task stays listed under the completed aim and still completes on talking (or `taskOnKO`). The order reads fine: no text keys on `objective_aim_completed:get_inside`, and the next aims chain from Confirm the Lie as before. The only leftover is the graph metadata (n5).
- **Dial call by text.** No auto-opened chat remains on `anomaly_detected`. With the dial read last and everything else done, the ESD-live text (1.2 s) comes before "Call me when you're clear of it" (6 s). That order is acceptable, and the call's choices fit that state (`[Then the dial was the last piece.]`).
- **`static_left_alone`.** It is declared, set only with `static_left`, and the two Static credits are disjoint. The debrief's crew line doesn't count Static as down, which is correct. The vanish has no line (n3).
- **`voltage_six_cities`.** Correct on every path into the negotiation knot. "Three cities" (Social Fabric's disinformation, debrief 249) and "six cities" (the Architect's attacks) are separate claims and don't clash.
- **Never-met debrief and credits.** Right for the slip-past/spare route (r17). Wrong only for the walk-off-mid-meeting case (n4). A KO'd-without-meeting Vance gets the KO lines and credit, which is correct.
- **Detain-and-hand-over wording.** Consistent across Voltage, HaX's hint, the debrief ("in custody") and the credits.

## Fresh pass (skill sections 2a-2h)

About five cycles in total: the solvability trace, KO and reload resilience, the debrief and credits matrix, the objective scaffolding and the graph metadata. Nothing new beyond n1-n5. The solvability trace from round 1 still holds: no blockers, no soft-locks, the VM wiring is unchanged, and every ESD condition has a setter on each Voltage outcome.

## Verdict

Round 1 landed. Seventeen findings are confirmed, plus the three browser minors, and m17 stays accepted. The exception is m1: its text is wired to an event the engine never emits for a player with no card, because that player always holds the cloner. Fix it with the m05 `door_unlock_attempt` pattern (n1). The other four are small: a stale count in the debrief, Static vanishing without a line, an edge case in the never-met check, and one stale graph field. None blocks or soft-locks.

**Counts: 0 blockers, 0 majors, 5 minors.** Recommendation: fix n1-n5, then close the scenario design phase with a short targeted browser check. That check covers the round-1 items still open in the log (the dial text and hub re-offer, Static slipping out, the aims without Vance) plus n1 (the Hall 2 text with no card in hand). A third static round shouldn't be needed.
