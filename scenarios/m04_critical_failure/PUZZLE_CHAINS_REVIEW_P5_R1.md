# m04 Critical Failure — Puzzle chains review, Pass 5 round 1

Read-only review. Kind of game: SAFETYNET campaign mission, a TV spy thriller. Measured against m01_first_contact and m02_ransomed_trust, and the `mission-puzzle-chains` skill.

Everything below is cited against `scenario.json.erb` and the ink as they stand, not the older `PUZZLE_CHAINS_PLAN.md`. Phase-1 alignment has closed; this is the first puzzle-chains round.

## Scope covered / not covered

- Covered: room depth and lock order; the full lock/key chain; cumulative kit (lockpick m01, RFID cloner m03, fingerprint kit m04→m05); whether the mission's choices/puzzles are required; red herrings; whether an answer is handed over by a task title / toast / NPC; the silent-failure engine bug classes; the six new alignment mechanics as puzzles; the engine code behind biometrics, RFID, combat, the ESD gate and the timers.
- Static checks run: `room_depth.py`, the route driver over **all 13** routes in `scripts/ink_runtime_check/m04_routes/` (all pass), the validator (`--skip-ink --no-graph`), and `dialoguelint.mjs`.
- **Not completed (safety stop):** the VM-flag cross-check against the published field guides was interrupted at the distcc guide (a safety classifier stopped the turn on its exploit text). I did not reopen the exploit guides and did not open the SecGen XML. VM-content claims that need the XML are listed as "needs checking against SecGen by the user". I also did not run a browser session (reviewer is static).

## Headline numbers

| | m04 | m02 (gold) |
|---|---|---|
| Rooms | 9 | 15 |
| Empty rooms (`npcs:[]`+`objects:[]`) | 0/9 | 6/15 |
| `lockType` declarations | 6 | — |
| Critical-path room hops (entrance→ESD) | ~11 (incl. two back-tracks) | — |

Nine rooms, none empty. The critical path threads the whole site and doubles back twice (into Hall 2 for Relay's card, back through Hall 1 for Vance's print). That is good density for a mission this size.

## Puzzle dependency chain

```
START main_entrance (d0)
  guard sight-challenge (los.challengeOnSight) — talk past / slip past / KO
  |
  v  south
operations_office (d1)  Robert Vance
  * clone Vance's Level 1 prox card (rfid_cloner, m03)      --> facility_keycard_level1
  * evidence #1: Maintenance Work Orders -> evidence_maintenance_logs_found
  |
  +-- south --> security_office (d2)
  |      * [lockpick] equipment locker -> SPARE Level 1 card (redundant), IR guide
  |      * evidence #2: Camera System Logs -> evidence_camera_tampering_found
  |      * evidence #3: Access Control Export (reader spoof) -> evidence_reader_spoof_found
  |
  +-- east --> scada_control_room (d2)
         SCADA HMI: "28C NORMAL ... feed = BMS sensor bus -> historian"   [the lie]
         |
         v  east
       battery_hall_1 (d3)  Cipher (patrol, optional)
         * analogue thermometer reads 61C   -> anomaly_detected  [the truth / deduction]
         * Duty Round Panel: Vance's fingerprint (print surface)        --> plant_room key
         |
         +-- [rfid: server_room_keycard / Level 2] --> engineering_workshop (d4)  SEEN HERE, key is deeper
         |        VM: BMS jump server; flag-station (4 flags)  --> attack_mechanism_known
         |        * [lockpick] OptiGrid tool case -> FINGERPRINT KIT (m04 grant) + job card
         |
         +-- [rfid: facility_keycard_level1] east --> battery_hall_2 (d4)  Relay (patrol)
                  * clone / drop Relay's Level 2 card           --> server_room_keycard (opens workshop)
                  * evidence #4: Workshop Access Log -> evidence_access_logs_found
                  * BMS bypass module: Voltage's print (optional evidence)
                  |
                  +-- [biometric: Robert Vance] south --> plant_room (d5)  Voltage + Static
                           Static: talk past / fight ; Voltage: fight / arrest / let-run
                           ESD pushbutton  [authVar esd_authorized]
                           needs anomaly_detected + attack_mechanism_known + voltage_neutralised
                           |
                           v  east
                        loading_dock (d6)
                           * [lockpick] go-bag -> Base64 safehouse card (optional lore)
```

Boss-lock: the ESD (`esd_pushbutton`, erb:2138) converges three independent threads (the dial read, the four VM flags, and dealing with Voltage) plus `concludeRequires` on the four flag tasks (erb:417-424). This is the honest convergence primitive the skill endorses, done well.

## Boss-key audit

| Lock | File:line | Seen at | Key available at | Verdict |
|---|---|---|---|---|
| `engineering_workshop` (rfid, Level 2) | erb:1464-1466 | d3 (Hall 1 south door) | d4 — Relay's card in Hall 2 | ✅ boss-key (fail at the door, go find the card in Hall 2, return) |
| `battery_hall_2` (rfid, Level 1) | erb:1858-1860 | d3 (Hall 1 east door) | d1 — Vance's card cloned | ⚠️ key-before-lock, but acceptable: the Level 1 card is the facility-access currency and is earned by using the m03 cloner |
| `plant_room` (biometric, Vance) | erb:2002-2004 | d4 (Hall 2 south door; HaX bark erb:766-778) | print liftable at d3 (Hall 1 panel) only after the kit at d4 | ✅ boss-key (see the reader, learn picks/cloner won't touch it, fetch the kit, back-track for the print) |
| `optigrid_tool_case` (key/lockpick) | erb:1556-1558 | d4 | lockpick carried from m01 | ✅ by design (capability spend) |
| `security_equipment_locker` (key/lockpick) | erb:1626-1628 | d2 | lockpick from m01 | ✅ by design |
| `extraction_gobag` (key/lockpick) | erb:2260-2262 | d6 | lockpick from m01 | ✅ by design (optional lore) |

The plant-room chain is the strongest piece of design in the mission: the player is told at the Hall 2 door that picks and the cloner won't open it, then has to source the crew's own kit from the workshop and back-track through Hall 1 for a surface Vance touches every round. That is the three beats (encounter → hunt → return) done properly, and it is the wall the m04 grant answers.

## Cumulative kit

| Tool | Introduced | m04 use | Carried to m05? |
|---|---|---|---|
| lockpick | m01 | tool case, locker, go-bag | yes (m05 erb:503) |
| rfid_cloner | m03 | clone Vance L1, clone Relay L2 | yes (m05 erb:511) |
| fingerprint_kit | **m04** (tool case, erb:1564) | lift Vance's print for the plant reader | yes (m05 erb:519, "the kit you took off the OptiGrid crew at Albion") |
| pin-cracker | m02 only | — (correctly absent) | rationed, correct |

Kit progression is clean. The fingerprint kit is granted where the player first feels its absence (the plant reader seen one step before the kit is reachable), and m05 carries it on with an explicit callback. Nothing arrives too early or too late.

## Are the mission's choices required?

The mission-conclusion aim `stop_the_runaway` (erb:406-454) gates the ending correctly:
- `concludeRequires` = the four VM flags (erb:417-424), so the technical work cannot be skipped.
- `esd_authorized` (erb:1155-1175) requires the dial read **and** the flags **and** Voltage dealt with, so none of the three threads is optional for the climax.

The moral choices carry score/credits rather than gates, which is the right call per the skill: Voltage fight/arrest/let-run, the night-crew warning, keeping or dropping the cover with Vance, and the disclosure choice all branch the debrief and credits (erb:172-208). These are consequential, not decorative — a clear improvement over m02's skippable insider thread.

## Findings — severity table

| # | Sev | Finding | File:line | Fix |
|---|---|---|---|---|
| F1 | major | The fingerprint **compare/identify** step is not required to open the plant door. `recordLift` stamps `owner` from `fingerprintOwner` ("Robert Vance") onto every lift regardless of whether the player identifies it, and `evaluateBiometricLock` matches on `owner` (not on `identified`). So a lift logged "unidentified" still opens the plant reader. The signposted "name the pattern, pick the owner from owner+decoy" deduction gates nothing on the critical path — it only earns the optional bypass-module evidence (`fingerprint_identified:voltage`). | biometrics.js:62-96; biometric-lock.js:50-63; reader needs `requires: "Robert Vance"` erb:2004 | Decision for the user (below). Simplest: accept and document — the lift itself is required and the identify is a forensic flourish that still gates the optional evidence. Alternative: have the plant reader require an **identified** matching lift (engine change), making the compare load-bearing. Given the "fun, not hard" rule I recommend accept. |
| F2 | major | VM narrative claims can't be verified from the game text alone. HaX's root beat asserts root reveals "their calibration override: that box rewrites every rack temperature before SCADA gets it" (erb:964), and the flag-reward descriptions say the same (erb:1526). The in-game SCADA Parameter Change Log only shows "charge ceiling RAISED (override)" (erb:1447) — not a temperature-rewrite file. Whether the `bms_jump_server` VM actually exposes such a mechanism as root, and whether the four flag names (`flag{network_scan_complete}`, `flag{ftp_intel_gathered}`, `flag{privesc_complete}`, `flag{distcc_exploit_complete}`, erb:1497-1502) match SecGen, **needs checking against SecGen by the user.** This is the deferred item **m17**. | erb:964, 1497-1502, 1526; `scenarios/m04_critical_failure/secgen/m04_critical_failure.xml` (not opened) | User verifies against SecGen. If the VM has no temperature-rewrite artefact reachable as root, either soften HaX's line to "charge-ceiling override" (matches the SCADA log) or add the artefact to the VM. |
| F3 | minor | Over-redundancy on two keys. `find_infiltration_evidence` has **four** sources, any one of which completes it (work order erb:1399, camera log erb:1608, reader export erb:1619, workshop access log erb:1543). The Level 1 card has **three** sources (clone of Vance, locker spare erb:1633, KO-drop + `relayed_workshop_keycard` fallback erb:704). The skill flags five-source redundancy in m02 as a tell. | as cited | Keep the softlock backstops (clone/drop/relay for the card), but consider demoting the locker spare to flavour, and the four evidence docs are fine as long as each reads as a distinct in-world artefact (they do). Low priority. |
| F4 | minor | The dial deduction is slightly over-signposted. The digital `rack_status_panel` in the same hall ends with "The mechanical dial on this same wall is not on the bus" (erb:1800), and the thermometer's own observation names the SCADA figure. The player is told the answer rather than inferring the contrast. | erb:1800, 1776-1786 | Optional: drop the "dial is not on the bus" sentence from the digital panel so the player makes the jump from the HMI's "feed = BMS sensor bus" line themselves. The deduction still works without it. |
| F5 | minor | 13 validator objective-wiring warnings, all the "multiple `onceOnly` handlers on the same event pair" class on `agent_0x99` (e.g. `item_picked_up:fingerprint_kit` x3, the flag-task handlers x4). They are intentional (disjoint conditions or independent side-effects), but they are noise on every validate. | erb eventMappings on `agent_0x99` | Optional: declare the paired globals in a top-level `mutuallyExclusiveGlobals`, or leave as-is and treat as known. Not a bug. |
| F6 | minor | Two Voltage resting knots park without a re-entry line (dialoguelint blank-reentry: `voltage_captured_end` and `voltage_escape_success`). A re-talk re-enters and prints nothing before its choices. | `m04_npc_voltage.ink` ~L388, ~L422 | Already owned by the dialogue phase; noting so it isn't lost. Add an `m03 hub_quiet`-style re-entry line. |
| F7 | minor | Legacy sprites on four speaking characters (`hacker` on the opening-briefing HaX; `hacker-red` on Cipher, Relay, Static), so the three operatives share one faceless bust. | erb:522-523, 1674, 1880, 2081 | Already deferred to the character stage (log R-M1, R-E2). Noted for completeness. |

No blockers. The route driver passes all 13 routes, the validator schema passes, door alignment and geometry are OK, and I found no soft-lock or dead-end on the critical path.

## The six alignment mechanics, as puzzles

1. **Dial-versus-screen deduction.** Works. The SCADA HMI (control room, d2) states its feed is the BMS sensor bus; the analogue thermometer (Hall 1, d3) is explicitly off-network and reads 61C. `anomaly_detected` is set by interacting the dial (erb:1787-1790). Genuine: the player must physically go and read an instrument the attacker couldn't reach. Only caveat is F4 (over-signposting).
2. **Cipher's patrol timing.** A real stealth-timing beat. Waypoints up the rack gap at x=12, a look east to (13,3) and west to (10,3), then back to the panel facing south with a 4 s dwell; `los` range 150, angle 120, `visualize:true` (erb:1691-1723). The east look at (13,3) sits ~176 px from where players stop at the Hall 2 door, so a waiting player is safe (round-4 fix, confirmed in the comment). Optional (the fight is optional, erb:384-389). O4 (standing still east of him is permanently safe) is already accepted. Fine.
3. **Fingerprint lift and compare.** The dusting minigame is required (you must lift a sample); on easy the compare shows owner + one fixed decoy sharing the pattern (`dusting-model.js:102`, candidates 2, decoySamePattern 'one'), so the compare is a light but real deduction. **But** the compare is not load-bearing for the plant door — see F1. The reader matching (owner, quality threshold) is correct: `requires: "Robert Vance"` matches `fingerprintOwner` (erb:1844, biometric-lock.js:50).
4. **Plant-door reader.** Boss-key, strongest chain in the mission (see audit). Correct.
5. **ESD arms only once the attack is proven.** Correct and robust. `esd_authorized` needs `anomaly_detected && attack_mechanism_known && voltage_neutralised`, set by three mappings each firing on one prerequisite and checking the other two, so order doesn't matter (erb:1155-1175). `attack_mechanism_known` is set on `map_the_attack` aim completion (all four flags), not on the last flag, so a VM-first player with no evidence read still can't arm it; the graded `unauthorizedTextVariants` (erb:2165-2170) name exactly what's missing. The dead-end the comment at erb:1122 describes (flags in, no evidence) is handled by both the HaX "break-in on paper" bark (erb:1137) and the ESD variant text. Good.
6. **The trigger race.** `trigger_race` (erb:2329-2353) starts on `voltage_fight_started` (turning Voltage hostile, including a first punch), 25 s, cancelled by `voltage_neutralised`; placed first in the timers array so the HUD shows it. A reload during the race forfeits it by design (Voltage's ink holds the after-state). Fair and legible.

## Answers handed over by title / toast / NPC

Checked against the m02/sis01 lesson. No task title, toast or NPC names a code or spoils a lock:
- Task titles are objectives, not answers ("Take a workshop card off the cell", "Get into the plant room").
- There is no insider/whodunnit deduction here (unlike m02/m05), so the usual risk is absent.
- The dial deduction is pointed at by HaX and by observations, but that is guidance toward an action, not a leaked code. F4 is the only over-signposting, and it's minor.
- The Base64 safehouse card is encoded by the antagonist with an in-world motive ("Burn this after reading", erb:2271) — passes the skill's "author with a motive" test, and the decode is optional lore.

## Silent-failure bug sweep

All clear on the recurring classes:
- `item_picked_up` keyed on **type** not id: the fingerprint-kit mappings key on `item_picked_up:fingerprint_kit` (type) ✓; the Level 1 card mapping keys on `item_picked_up:keycard` with `condition: data.itemId === 'vance_level1_keycard'` ✓ (erb:1030-1035).
- `card_cloned` carries `cardName` only — both clone mappings use `data.cardName` ✓ (erb:812, 1039).
- `globalVarOnKO` does not emit `global_variable_changed` — handled throughout via `npc_ko:<id>` mappings (the `operatives_defeated` counter erb:991-1013, `voltage_neutralised` erb:1089-1094). This was a past soft-lock on the ESD and is correctly guarded.
- No player-visible author notes (`[LORE:]`/`[NOTE:]`) found in `text`/`observations` during the read; `puzzle_graph_*` keys are metadata and not shown.
- Technical identifiers: CVE-2004-2687 for distcc matches the published guide's citation. The "calibration override" claim is the one unverified assertion — F2.

## Decisions that need the user

1. **F1 — fingerprint compare.** Accept the identify step as an optional forensic flourish (my recommendation, consistent with "fun, not hard" and it still gates the optional bypass-module evidence), or make the plant reader require an *identified* matching lift (an engine change) so the deduction is load-bearing.
2. **F2 / m17 — VM claims.** Verify against SecGen (I can't open the XML): does `bms_jump_server` expose a temperature-rewrite "calibration override" reachable as root, and do the four flag names match? If not, soften HaX's root line to "charge-ceiling override" (which the in-game SCADA log supports) or add the artefact. **Needs checking against SecGen by the user.**
3. **F3 — redundancy.** Keep the Level 1 card's clone/drop/relay backstops (they prevent soft-locks); decide whether the locker spare and four evidence sources are worth trimming for tidiness. My recommendation: leave the backstops, keep the four evidence docs (each is a distinct in-world artefact), it's low priority.

---

Measured against m01_first_contact and m02_ransomed_trust. Reviewed: round 1 (static; interrupted by a safety classifier on the distcc field-guide exploit text — VM-content cross-check incomplete, routed to the user as F2/m17). Route driver: 13/13 pass. Validator: schema pass, geometry/doors OK, 13 intentional objective-wiring warnings.
