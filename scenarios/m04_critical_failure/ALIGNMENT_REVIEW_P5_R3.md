# m04 pass 5: alignment review, round 3

2026-10-13. Opus reviewer, read-only, static only (no browser session). Scope: confirm the round-1 and round-2 findings against commit 74c3b367, look for regressions caused by the round-2 fixes, run the checks, and do a fresh pass with `mission-alignment-plan`. Nothing in the SecGen XML was opened.

## Checks run

- **Route driver, all 11 routes** (`node scripts/ink_runtime_check/m04_routes/route.js <route>.json`): 11 of 11 pass, 114 assertions, 0 failures. Per route: r1 18, r2 11, r3 8, r4 9, r5 14, r6 14, r7 8, r8 7, r9 7, r10 6, r11 12. The script takes the route file's path, not a bare name; a bare name fails with a path error.
- **Validator** (`--skip-ink --no-graph`):
  - ERB, JSON, schema and unknown fields: clean. Geometry and door alignment: OK.
  - 13 wiring warnings, all on `agent_0x99` duplicate event pairs. This is the same set round 2 reviewed and accepted.
  - 17 issues. Two are the repeatable sight-challenge chats; the rest are sprite suggestions and good-practice notes. 2 missing-behaviour notes for the seed NPCs. Nothing new.
- **dialoguelint**: 0 errors, 6 blank-reentry checks (the same six as before).
- **reopencheck**: 0 problems overall. m04 HaX: 1800 reopens, 0 problems. m04 Vance phone: 1800 reopens, 0 problems.
- **`check_door_alignment.py`**: all doors OK.
- **Ink JSON freshness**: no compiled JSON is older than its ink.

**Counts: 0 blockers, 2 majors, 8 minors.**

## Severity table

| # | Sev. | Finding | Where | Fix |
|---|---|---|---|---|
| M1 | major | **The HUD can overstate the time left by up to 16 minutes after an early alarm, and the case is easy to reach.** The HUD shows the first pending countdown in array order (`scenario-timer.js:171-207`), so `h2_advisory_alarm` (alarm + 24 min) stays on screen even after mapping the attack has started `h2_advisory` (mapping + 8). The comment calls this the unusual case. It's the common one for anyone who warns late in the VM stage. A player with all four flags in but no paper evidence still has `attack_mechanism_known` false (map_the_attack waits on confirm_the_lie, erb:1113-1118). They sound the alarm, read one document two minutes later, and the HUD says about 22 minutes while the advisory comes in 8 and the vent in 14. The clock is the stated cost of the choice, and the HUD is the only way the player can see it | erb:2337-2344 (`h2_advisory_alarm`), comment erb:2292-2296 | Add `&& !globalVars.attack_mechanism_known` to `h2_advisory_alarm`'s `condition`. The HUD evaluates the condition each tick, so after mapping it falls through to `h2_advisory`, the true next event. The alarm's own advisory then never fires once the attack is mapped, but `racks_vent_alarm` still does, so the cost stays at min(alarm + 30, mapping + 14). Remaining edge: if mapping comes 16 to 24 minutes after the alarm, the advisory arrives later than it would have, and at mapping + 22 or more the vent comes first. Both are acceptable, because the HUD then never shows a figure later than the real advisory. Rewrite the comment to match, and add a route (see m8) |
| M2 | major | **An early alarm starts "his clock" even when Voltage is already down.** If Voltage is fought before the attack is mapped and the player wins the race (r11's opening, then a KO, which sets `voltage_neutralised` and `voltage_captured`, erb:1084), a later warning still costs the player. Vance says "He won't wait for eight. You'll have half an hour", HaX texts "Voltage heard it too, and he won't wait for eight now", the mapping starts the 30-minute alarm pair, and a vent from it gets the debrief line "Your alarm started his clock." Voltage is unconscious or in cuffs. The fiction of the cost is that he fires early, so with him down the alarm should cost nothing | erb:858-861; vance.ink:432-440; phone_vance.ink:220-225; phone_hax.ink:354-360; debrief.ink:301-304 | Make the early mapping `value === true && globalVars.attack_mechanism_known !== true && globalVars.voltage_neutralised !== true`. Widen the late mapping (erb:863-868) to `attack_mechanism_known === true \|\| voltage_neutralised === true`, with its own text when he's down: "That's the evacuation. Nine out of Hall 2. Nobody left in the plant room to hear it." In Vance's two cost branches and HaX's hint, add a first branch `voltage_neutralised`: "Whoever was in my plant room isn't listening any more. It costs you nothing." `vented_by_alarm_clock` then can't arise with Voltage down, so the debrief needs no change. Add a route (m8) |
| m1 | minor | "Your workshop job isn't done" is false when all four flags are in and only the paper evidence or the dial is missing. That state still counts as "before the mapping" | vance.ink:439; phone_vance.ink:224 | Branch on `all_flags_in` (import it into both inks): "You'll have half an hour, maybe." with no workshop clause |
| m2 | minor | Cipher's opening narration is from before the patrol: "He is crouched at the end of the rack row with a panel open". It now fires mostly while he walks the gap or looks along the door aisle (erb:1677-1692) | cipher.ink:39 | "He's halfway up the rack row, a handset already half out of its clip." It fits both the walk and the dwell |
| m3 | minor | **The guard's sight challenge fires on the spawn tile for almost every player** (browser 1a and 1c: 47 px, on the first frame after the briefing). So `on_sighted` ("out of his chair before you reach the inner door", "(Keep walking.)") is now everyone's first meeting with him, though the player hasn't moved. His friendlier opener, "Morning. Bit early for visitors.", is reachable only by walking up outside his cone. Round-2 m19 fixed the wording for a player who was spotted walking past, which is the rare case | guard.ink:35-46, 51-53; erb:581, 596-602 | Rewrite `on_sighted` to fit a player standing at the door as well as one walking past: "The guard's already on his feet as you come through the door." / "Morning. Desk first, if you don't mind. Who are you, then?" Keep "(Keep walking.)". Or turn him so the spawn tile is outside his cone, but that's a dressing change |
| m4 | minor | Static's "Critical Mass Coordination Log" (Loom, Phase 3, the cross-cell timing) is an `itemsHeld` drop, so a talk-past player never sees it. Since round 2 it leaves with him on the button route. His ink comment still says "nothing is lost". The debrief's proof line still fires on Voltage's log alone, so nothing breaks | erb:2122-2131; static.ink:9-12 | Either leave it on the bench when he goes (a plant-room object made visible on `static_left`, with the same `onPickup`), or accept the loss and correct the comment. Recommended: the bench drop, which also gives the sweep one more thing to find |
| m5 | minor | The debrief's second opener, "Voltage is in custody / out through the dock", goes straight to `debrief_voltage_status`. It skips `debrief_attack_stopped` and so loses three lines: "Vance lost nine of his crew tonight", the Vance KO line and the guard KO line (debrief.ink:101-116). After a crew loss, that route instead plays "Lives over one operative, every time", which jars | debrief.ink:89, 129-142 | End `debrief_voltage_status` with a divert into a shared stitch that holds the Vance and KO lines (move lines 101-116 into it, and call it from both knots). Gate line 139 on `not crew_lost` |
| m6 | minor | Vance's phone "How do I shut this down safely?" is still offered after the shutdown, and then says "Get to it and press it. That's the mission." plus "And be quick. I'm watching bank B climb" (`urgency_stage` stays at 3 or 4). Round 2 fixed four other knots for `attack_prevented` but missed this one | phone_vance.ink:113, 177-189 | Gate the choice on `not attack_prevented`, or add an `attack_prevented` branch at the top of the knot: "You've done it. That was the only safe way, and you took it." |
| m7 | minor | The debrief's lesson, "The one honest instrument in the place was a dial nobody had wired to anything", now contradicts two other sources. The Hall 1 hydrogen monitor says it is "NOT connected to SCADA" and contradicts the HMI (erb:1804). Since round 2, Vance also watches an off-network hydrogen readout. The fix line, "A gauge in every hall that isn't on the bus", describes something the site already has | debrief.ink:205-206 | "And the control room believed its own sensors. The honest instruments were the ones nobody had wired to the bus: a dial, and a gas monitor nobody read." / "…and a temperature gauge in every hall that isn't on the bus." Then the dial stays the proof without being the only honest instrument |
| m8 | minor | The route driver has no route for two round-2 paths: (a) an early alarm followed by quick mapping, where the normal clock wins and the debrief's `else` branch plays with `crew_warned_early` true (M1); (b) a warning with Voltage already down (M2) | `scripts/ink_runtime_check/m04_routes/` | Add r12: three flags in, warn, map 2 min later, advance 8 min (the advisory fires from `h2_advisory`), then 6 more (the vent). Assert no `vented_by_alarm_clock`, no "Your alarm started his clock", and "Hall 2 was empty when it went". Add r13: win the race, KO Voltage, dial, warn. Assert no `crew_warned_early`, no "half an hour", no alarm timers started |

## Confirmation: round 1

| # | R1 outcome | Round 3 |
|---|---|---|
| A1 | Fixed | **Holds.** The button stance needs `attack_mechanism_known and anomaly_detected` (voltage.ink:283-311), and back-off returns to the stances (:83-98, 315-320) |
| A2 | Fixed | **Holds.** Phase conditions on `game_loaded` and `all_hostiles_ko` (erb:92-108, 151-154) |
| A3 | Fixed in part (round 2 finished Cipher) | **Guard and Static hold** (erb:596-602, 2084-2091). Cipher's patrol is configured (erb:1677-1692) but not yet seen in a browser (open checks below). The guard's sight wording: see m3 |
| A4 | Fixed | **Holds.** The ESD unlocks the call-in (erb:883-889), the hub's first choice is "Bring me in" (phone_hax.ink:125-126) and `extract_offer` names what's unread (:371-380). r10 passes |
| A5 | Fixed | **Holds.** Gated hub, root divert, "Where do I stand?" (phone_hax.ink:94-178, 795-846) |
| A6 | Fixed | **Holds.** No "leader" anywhere in the erb or the ink |
| m1-m12 (R1 minors) | Fixed, withdrawn or deferred as logged | **All hold.** Blackout's credit is gated (erb:206). No `player_approach`, `{player_name()}` or `{operatives_defeated}` in the ink. "Ghost in the Wire" is gone; "Safetynet in the Smoke" is used (erb:167). The `skipIfGlobal` set and the privesc wiring are as round 2 found. m12 (Task Force Null in m05) is deferred to the m05 pass |
| R-M2, R-M3, F1-F4 | Fixed | **Hold** (round 2 confirmed them; nothing in 74c3b367 touches them) |

## Confirmation: round 2

| # | R2 outcome | Round 3 |
|---|---|---|
| M1 | Fixed (option b) | **Mostly holds.** `crew_warned_early` starts its own pair (erb:2337-2344, 2391-2397). The normal pair starts on `attack_mechanism_known` (erb:2363-2369, 2409-2415). Every fire condition guards on `racks_vented` / `hydrogen_alarm`, and `attack_prevented` cancels all four. Reload: both pairs resume from saved running time, and the init skip-by-setGlobal can't wrongly fire either vent (`vented_by_alarm_clock` separates the two). The cost is stated in both places and in HaX's hint. The debrief links the vent to the alarm (debrief.ink:301-304). r1, r4, r5 and r7 exercise all of this. **Two regressions: M1 (HUD) and M2 (Voltage down).** Wording: m1 |
| M2 | Fixed | **Holds.** No "historian" in any m04 ink; the only one left is the HMI's "Feed source: BMS sensor bus → SCADA historian" (erb:1429), which is right. The phone's timed text points at the dial with `skipIfGlobal: anomaly_detected` (erb:1222-1228). Knock-on: m7 |
| M3 | Fixed | **Configured, not verified.** It is a five-waypoint beat, `pauseForPlayer: false`, and `los.visualize`. Patrol targets go through `findNearestWalkableWorldCell` / `findWorldPath`, a 16 px grid built from the trimmed physics bodies (npc-behavior.js, the chooseNewPatrolTarget block; npc-pathfinding.js:590-640). That matters because the legacy per-room tile grid marks tiles (10,3), (14,3) and column 12 rows 0-6 as rack (npc-pathfinding.js:216-219 against room_battery_hall.json). So the waypoints will snap, and the walk and the facings need the browser check the log already lists. With `pauseForPlayer: false` he never turns to face a player who walks up behind him; talking to him still works |
| m1 | Fixed | **Holds** (debrief.ink:317-322) |
| m2 | Fixed | **Holds** for the greeting, "How bad", the goodbye and `priority_guidance` (phone_vance.ink:85-86, 197-198, 243-244, 264). One knot missed: m6 |
| m3 | Fixed | **Holds** (phone_hax.ink:352-361). See M2 for the Voltage-down branch |
| m4 | Fixed | **Holds** (vance.ink:436-445) |
| m5 | Fixed | **Holds.** Three disjoint hydrogen texts plus the warned one (erb:824-847) |
| m6 | Fixed | **Holds** (voltage.ink:129-131, 408-412) |
| m7 | Fixed | **Holds** (debrief.ink:103-104, 441-442) |
| m8 | Fixed | **Holds.** `static_left` mapping, `setVisible`, re-hide, narration and credit (erb:2104-2119, voltage.ink:401-403, erb:198). Ink variable writes emit `global_variable_changed` (npc-conversation-state.js:468-494), so the mapping fires in the browser as well as in the driver. Knock-on: m4 |
| m9 | Accepted | Agreed; no mapping action turns an NPC hostile |
| m10 | Fixed | **Holds** (phone_hax.ink:544) |
| m11 | Fixed | **Holds** (erb:908, 914) |
| m12 | Deferred (characters) | Agreed; the validator still lists it (issues 12, 16) |
| m13 / N1 | Fixed | **Holds.** Both hostile rules skip `restored` and anything after the shutdown, and the clock twin keeps `spy-action` (erb:142-155). `restored: true` is emitted at npc-hostile.js:107. Conditions are evaluated with `new Function` (scenario-music-events.js:34-52), so `typeof` is safe |
| m14 | Deferred (dressing) | Agreed. Hall 1 is still declared 18x12 against the 20x10 template (erb:1645) |
| m15 | Fixed | **Holds** (erb:2280-2282) |
| m16 | Deferred (lighting) | Agreed |
| m17 | Deferred (puzzle chains) | Agreed |
| m18 | Withdrawn | **Withdrawal stands** (static.ink:42-55: two of the three have their own reply) |
| m19 | Fixed | **The wording holds, but for the rare case:** see m3 |
| m20 | Deferred (backlog) | Agreed |
| N2 | Fixed with M3 | As M3 |
| N3 | Fixed, with a documented limit | **Holds** (erb:800, 806, 902) |
| N4 | Needs an engine change | Agreed. It stays with the orchestrator |
| N5, O3 | Deferred (characters) | Agreed |
| O1 | Fixed | **Holds** (voltage.ink:292-299; r11 asserts it) |
| O2 | Open | Still needs a human playtest |

### Debrief and credits, every warned / vented / KO combination

Traced against debrief.ink:290-323 and erb:172-200. They agree in every case.

| Warned | Vented by | KO | Credits | Debrief |
|---|---|---|---|---|
| no | — | none | MISSION COMPLETE, ALL ELEVEN WALKED OUT | "Eleven people walked out" |
| no | — | guard or Vance | MISSION COMPLETE, EVERYONE… not on their own feet | "not all of them on their own feet" |
| early | — | either | as above, plus NIGHT CREW | as above, plus "It started your clock early" |
| late | — | either | as above, plus NIGHT CREW | as above, plus "had the night crew out before the button" |
| early | alarm clock | none | COSTLY SUCCESS, ALL ELEVEN, NIGHT CREW, BANK B LOST (A and C isolated), CASUALTIES: two on the feed | "Your alarm started his clock… Nine people in Hall 2 are what it bought" |
| early | alarm clock | guard or Vance | the same, with EVERYONE… instead of ALL ELEVEN | the same; the KO lines only on the first opener (m5) |
| early, then quick mapping | normal clock | either | as for alarm clock | the `else` line: "Hall 2 was empty… won't be eleven either". This is right, because the alarm cost nothing here, but no route covers it (m8) |
| late | normal clock | either | as above | the `else` line |
| any warned | trigger race | either | BANK B LOST (he reached the laptop), CASUALTIES: two on the feed | "he got to the laptop", then the `else` line |
| no | normal clock or trigger | either | COSTLY SUCCESS, no ALL ELEVEN or EVERYONE line, CASUALTIES: the night crew | "Nine on the night crew… won't be zero"; Vance: "Nine of mine" |

The round-2 nit stands: on a night with no warning and no vent, "ALL ELEVEN ON SITE WALKED OUT" is said of a crew who never left Hall 2. It's harmless.

### Music

Every phase, reload and fight path is consistent (see m13 / N1 above). An early alarm moves the music to `spy-action` through the VM stage, which is the intended "you're racing now". If M2's fix lands, a warning after Voltage is down will still set `clock_started` (spy-action) with nothing running. That's acceptable; to avoid it, have the Voltage-down late mapping leave `clock_started` alone.

## Fresh pass (skill rubric)

- **1, canon and stakes:** consistent. Voltage is "field lead", Blackout signs, the Architect directive is m03's. No change.
- **2, aims:** unchanged and sound. The "flags in, paper missing" state is now covered by HaX's `report_progress` (phone_hax.ink:817-823). It also counts as "before mapping" for the alarm, which feeds M1 and m1.
- **3, HaX hub:** to standard. M2 adds one branch to `hint_crew`.
- **4, dialogue:** new issues are m2, m3 and m6. Otherwise clean, and no voiced line prints a variable.
- **5, choices:** the crew choice is now a real trade with a stated cost, apart from M1 (the HUD) and M2 (the Voltage-down route). Static's log (m4) makes fighting rather than talking past him worth a little more, which is fine as long as it's a choice.
- **6, music:** sound.
- **7, rooms:** no change beyond the open Cipher check and m14.
- **8, mechanics:** the timer design is right apart from the HUD selection (M1).
- **9, KO resilience:** Vance KO'd (r6) and the guard KO'd (r3) both play through. Voltage KO'd early is where M2 comes from.
- **10, bookends:** the debrief opener route loses lines (m5).

## Still needing a browser check (carried over, not new findings)

- Cipher's beat: walkable, the cone at the three dwells, the crossing window, and where he lands when snapped.
- The guard's `on_sighted` knot, read as a new player sees it (see m3).
- The alarm HUD order, before and after mapping (after the M1 fix, the HUD should switch to `h2_advisory` at mapping).
- Static leaving with Voltage, and the plant-room re-hide after a reload.
- The music after a reload with Relay hostile (N1).

## Verdict

**The phase can't close yet.** Round 3 found two majors. AGENTS.md says to keep going while majors turn up. Both are regressions from round 2's clock and are small, mission-local edits:
- M1 is one condition and a comment.
- M2 is one mapping condition and a first branch in three cost lines.

Neither changes the design the orchestrator chose (option b). Everything from rounds 1 and 2 is closed, rightly withdrawn or rightly deferred. All four checks are clean.

**Recommendation:** a round-4 fix pass for M1, M2 and the eight minors, with routes r12 and r13 added. Then a short round-4 confirmation: the routes, a static re-check of the two timer edits, and one Sonnet browser run of 10-15 minutes. That run should cover the five open browser checks and, if possible, the HUD switch after a late mapping. If round 4 finds nothing above minor, close the phase there.
