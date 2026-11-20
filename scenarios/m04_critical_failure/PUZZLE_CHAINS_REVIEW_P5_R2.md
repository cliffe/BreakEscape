# m04 Critical Failure: puzzle chains review, pass 5 round 2

Read-only review (Opus). Kind of game: SAFETYNET campaign mission, a TV spy thriller. Measured against m01_first_contact and m02_ransomed_trust with the `mission-puzzle-chains` skill. Everything is cited against `scenario.json.erb` (erb), the ink and the engine at commit cb180ef2. The SecGen XML and the four exploit field guides were not opened. VM claims are judged against the brief's "The VM side, at a high level" section (`docs/agents/M04_PASS_BRIEF.md:11-22`); anything finer is marked **needs checking against SecGen by the user**.

## Checks run

- Route driver, all 13 routes in `scripts/ink_runtime_check/m04_routes/`: **13/13 "all expectations met"**.
- Validator `--skip-ink --no-graph`: schema passed, geometry and doors OK, 13 objective-wiring warnings (the same `agent_0x99` duplicate-mapping set as round 1, F5), 15 issues and suggestions (two intentional sight-challenge cutscenes without `onceOnly`, the operatives' legacy `hacker-red` sheet), 2 missing recommended fields (the hidden Netherton and Nightshade seed NPCs).
- `room_depth.py`: 9 rooms, 0 empty, 6 `lockType` declarations, depths unchanged from round 1.
- A scratch probe route (scratchpad `m04-puzzlechains-r2/probe_flags_first_no_dial.json`, not in the repo): 2 FAILs, which are finding R2-2.
- Engine reads: objectives-manager.js (aim reveal and completion), game.rb `objectives_state_for_client`, scenario-timer-dispatcher.js, game.js:1709, biometric-lock.js, biometrics.js, combat-config.js, game-over-screen.js, interactions.js (how readable objects are displayed).
- No browser session (static reviewer).

## Severity table

0 blockers, 2 majors, 5 minors.

| # | Sev. | Finding | File:line | Concrete fix |
|---|---|---|---|---|
| R2-1 | major | **The paper-evidence gate no longer exists, but two texts still send the player for it, with the clock running.** Since engine commit 657f6158 (3 Oct, a day after m04's pass-4 design e7cfc940), a locked aim is shown as soon as one of its tasks completes (`revealAimForTask`, objectives-manager.js:725-738). `checkAimCompletion` only defers for story-gated (`globalVariable`) aims (:843), and every m04 aim uses `aimCompleted`. So `reach_the_workshop` completes on its own two tasks and `map_the_attack` on its four flags, whether or not `confirm_the_lie` (dial plus evidence) is done. The server agrees (game.rb:1394-1404). `objective_aim_completed:map_the_attack` then sets `attack_mechanism_known` and `clock_started` (erb:1123-1127), which starts the 8- and 14-minute clocks. The design comment at erb:1128-1134 describes the old dead end, which can no longer happen. What remains is: (a) HaX's text "Flags are in, but grid control won't move without the break-in on paper. Work orders in the ops office…" (erb:1143), which fires on `all_flags_in` when no evidence has been read. It sends the player back to the ops or security office for something nothing needs, while the clocks run. That's the one red herring here that costs real time. (b) The hub's "Your flags are in. Grid control still wants the break-in on paper" (phone ink:821-823) is now unreachable, because it sits under `not attack_mechanism_known`. (c) The ESD refusal variant naming the missing break-in (erb:2173) is unreachable too | erb:1128-1134, 1143, 2173; m04_phone_agent0x99.ink:819-823; objectives-manager.js:725-738, 838-848; game.rb:1394-1404 | **Recommended: retire the gate**, since four sources exist, one beside the VM (erb:1543), and the ESD's own wording asks only for "the hazard confirmed…, the attack proven" (erb:2170) and "the hazard and the cause" (erb:1461). Add `&& globalVars.attack_mechanism_known !== true` to erb:1143's condition, or delete the mapping. `attack_mechanism_known` is set inside `checkAimCompletion` before `objective_task_completed` is emitted (objectives-manager.js:432-440), so the guard holds; check it in the browser. Delete the erb:2173 variant and the ink:821-823 branch, and rewrite the erb:1128-1134 comment. The alternative, if the orchestrator wants the break-in to count: set `attack_mechanism_known` with three mappings, as `esd_authorized` does (aim done and any evidence; each evidence global and aim done), and keep the texts |
| R2-2 | major | **"Where do I stand?" stops naming the dial once the flags are in, and at the climax says "Stay by the button" when the dial is what's missing.** In `report_progress` the only post-workshop dial line is inside `- not attack_mechanism_known:` (ink:819-834). R2-1 means that branch is skipped as soon as the four flags land. With the dial unread, the hub says "You know how they did it. The plant room's off Hall 2…" (ink:833-834) and, once Voltage is dealt with, "Grid control's nearly there. Stay by the button." (ink:840-841). The probe route reproduces both lines. Two things soften it: the one-shot HaX text at erb:1144, and the ESD's first refusal variant "Check the racks on an instrument that isn't on the bus" (erb:2172). The separate pull hint "How do I prove the screens are lying?" is also still in the menu. But this hub is the always-on fallback for a struggling player, and it gives a wrong instruction under a running clock | m04_phone_agent0x99.ink:819-841; erb:1144, 2172 | Insert a branch after the `not attack_mechanism_known` block, before `- not plant_room_entered:`: `- not anomaly_detected:` → "Your flags are in. Grid control still wants a real reading off the racks. The dial thermometer on the Rack Bank C wall in Hall 1. It isn't on their network." (the existing ink:825-826 lines, moved). Then drop the dead `all_flags_in and not anomaly_detected` sub-branch. Add route `r14_flags_first_dial_last.json` to `m04_routes/`: set the four flags plus `attack_mechanism_known` with no evidence and no dial, talk to the phone hub's "Where do I stand", then `said: ["dial"]`, before and after `voltage_neutralised` (the scratch probe is a ready template) |
| R2-3 | minor | HaX's reply to the dial reading says the dial "was the last piece" whenever the workshop has been reached. It is gated on `server_room_reached` (ink:444-447), so a player who enters the workshop before reading the dial (a common order: Hall 2 for Relay's card, then the workshop) hears "It was. Grid control can see the difference now." with no flags in and Voltage still up | m04_phone_agent0x99.ink:439-447 | Gate the "last piece" choice on `attack_mechanism_known and voltage_neutralised`. Otherwise offer a neutral reply such as "[Then it's the workshop and Voltage.]" / "It is. Grid control has the hazard now; get them the cause." Dialogue phase can word it |
| R2-4 | minor | **The dial deduction is solvable without F4's line, but it's still pushed at the player before they can infer it.** The in-world clue F4 kept, the SCADA HMI's "If that feed is lying, only a standalone instrument in the hall would show it." (erb:1443), does reach the screen: a readable object's `observations` print above its `text` (interactions.js:1330-1332, 1461). It sits in the control room (depth 2), on the only route to Hall 1 (depth 3), so it is always seen before the dial is needed. But the work-order text fires in the ops office at depth 1, before the HMI, and says "Check the racks against the physical dial in Battery Hall 1" (erb:1198). Vance's unprompted 20 s text names the dial too (erb:1239). So at least two pushed messages hand over the answer the player was meant to work out | erb:1198, 1239, 1443 | Trim erb:1198 to "That work order was never authorised. There's your evidence. Don't take the SCADA screens on trust." and leave the dial to the HMI, the H2 panel (erb:1822) and the pull hints (phone ink:153, 290-294; Vance's priority line, ink:440). Keep Vance's 20 s text: it comes from a character with a motive, and only after he has turned ally. Dialogue phase decides |
| R2-5 | minor | The aim-complete text credits the four flags with more than the VM shows. "That's the attack mechanism confirmed: falsified thermals, ESD interlocks disabled, overcharge armed for 0800." (erb:1149). The brief's VM summary has the flags proving the scan, the leaked FTP material, the distcc foothold and root, where "the charge-ceiling override on every bank was pushed from" (brief:17-20). The falsified feed and the bypass are shown by physical evidence instead: the bypass module (erb:1991) and the command laptop (erb:2195). After F2 softened the root line, this is the one text left that makes the old claim | erb:1149 | "That's their route in, proven. They pushed the charge-ceiling override from that box, and the bypass modules in the cabinets hide what it's doing. Overcharge armed for 0800. The trigger is in the plant room. Get there, and get to the ESD." (HaX text, not voiced yet) |
| R2-6 | minor | **VM text finer than the brief: needs checking against SecGen by the user.** (a) The scan-flag text offers the ProFTPD **backdoor** guide, "Same backdoored build you met at St Catherine's" (erb:978; phone ink:242 "Same backdoor as St Catherine's"). The brief describes flag 2 only as "material on an FTP service… weakly protected services leak" (brief:18). If the VM's FTP is not the backdoored build, the guide is a red herring that costs time. And if it is, a shell from the backdoor makes the "distcc foothold" (flag 3) a second foothold in story terms. (b) Flag 1's task title is "Submit the flag from the fake rack status page" (erb:311) and HaX says "status page" (erb:930). The brief says only "map the OT network and find which services are exposed". (c) Still open from round 1 (m17): the flag strings (erb:1503-1508) and whether root shows the charge-ceiling override. The flag numbering inside the game is consistent: distcc task → flag4, privesc → flag3, and the rewards array is in the same order (erb:346, 357, 1515-1540) | erb:311, 930, 978, 1503-1508; m04_phone_agent0x99.ink:242 | User checks against SecGen. If flag 2 is plain FTP leakage, drop the ProFTPD offer from erb:978 and the guide from HaX's `itemsHeld` (erb:700-708), and make the text "That FTP service is talking to anyone. See what it's holding." If it is the backdoor, keep it and say so in the brief's summary |
| R2-7 | minor | Eleven globals are declared and never read or written anywhere in the erb or ink: `scada_anomalies_identified`, `infiltration_confirmed`, `esd_activated`, `optional_objectives_completed`, `combat_encounters_won`, `stealth_takedowns`, `facility_access_granted`, `vance_knows_truth`, `mission_started`, `agent_0x99_contacted`. A further one, `remote_trigger_disabled`, is written (erb:2185) but never read. The skill's bug sweep asks for these to go | erb:2454-2551 | Delete the ten unused declarations. Either drop `remote_trigger_disabled` from the ESD's `completionActions` and the globals, or leave it as a harmless marker. Tidy only |

## Round 1: confirmation

| R1 # | Decision | Status now | Evidence |
|---|---|---|---|
| F1 compare step not required | Accepted | **Rightly accepted, closed.** The reader still matches on the lift's `owner` (biometric-lock.js:44-63). No text claims identifying the print opens the door: the kit, print and reader texts ask only for the lift (erb:806, 812, 918; Vance ink:484-489). The walkthrough says the compare is a flourish (TESTING_WALKTHROUGH.md:90). The lift can't softlock: print surfaces are never cleared (no write to `hasFingerprint` anywhere in js/), so a poor lift can be redone, and the plant door has no `biometricMatchThreshold`, so the default 0.4 applies (biometric-lock.js:10) | as cited |
| F2 calibration-override claim | Softened | **Fixed.** HaX's privesc text (erb:970), the reward description (erb:1532) and the sudo guide line (phone ink:236) name the charge-ceiling override. That matches the SCADA log (erb:1453) and the brief's flag-4 summary (brief:20). No "calibration" left in the erb or ink. One related overclaim remains in erb:1149 (R2-5). The root artefact itself is still m17, needs checking against SecGen by the user | grep "calibration": 0 hits |
| F3 redundancy | Kept | **Rightly kept.** The Level 1 card's clone, Vance's KO drop and the locker spare are the backstops for a failed clone or a KO'd Vance. The four evidence documents are distinct in-world artefacts. Since R2-1 none of them gates anything, so their redundancy no longer matters for solvability | erb:1374-1386, 1637-1644, 1036-1049 |
| F4 dial over-signposted | Toned down | **Fixed as decided.** The rack panel ends at "Feed source: BMS sensor bus." (erb:1806). The one remaining in-world clue (erb:1443) is enough and reachable before it is needed (R2-4). The pushed texts still give the answer away (R2-4, minor) | erb:1806, 1443 |
| F5 duplicate-mapping warnings | Known noise | Unchanged: the same 13 warnings | validator |
| F6 Voltage re-entry lines | Dialogue phase | Still open, correctly deferred | log line 316 |
| F7 legacy sprites | Briefing HaX now; operatives to the character stage | **Briefing HaX fixed** (erb:522-529, `agent_hax` sheet, talk, visemes, headshot). The validator no longer lists the hacker-sheet suggestions for her. Cipher, Relay and Static are still `hacker-red` (validator suggestions 12-15), deferred | erb:525-529 |

## The improvement pass

### 1. The dependency chain after alignment

```
main_entrance (d0)  guard sight challenge: talk / slip past (20 s cooldown) / KO       [never a hard block: the S door is unlocked]
  └ operations_office (d1)  Vance: clone L1 card | KO drop | (locker spare, d2)        work-order text names the dial (R2-4)
      ├ security_office (d2)  [lockpick] locker, camera log, reader export
      └ scada_control_room (d2)  HMI: "only a standalone instrument in the hall would show it"
          └ battery_hall_1 (d3)  Cipher patrol + sight challenge → talk (walks) / fight / dodge
              │  dial → anomaly_detected → (unlocks Vance's crew offer; one ESD condition)
              │  round panel: Vance's print (needs kit from d4)
              ├ [L1] battery_hall_2 (d4)  Relay entry challenge → clone L2 | KO drop + relayed copy
              │     plant reader seen (HaX text) ─────────────────────────────┐
              │     └ [print] plant_room (d5)  Static challenge → talk past / fight         │
              │           Voltage: fight (25 s race) / arrest / let run → voltage_neutralised│
              │           ESD [esd_authorized = dial ∧ attack_mechanism_known ∧ voltage]     │
              │             └ attack_prevented → sweep → phone "Bring me in" → debrief       │
              │           └ loading_dock (d6)  [lockpick] go-bag, optional                   │
              └ [L2] engineering_workshop (d4)  VM: 4 flags → map_the_attack → attack_mechanism_known + clocks
                    [lockpick] tool case → fingerprint kit ─────────────────────────────────┘
Clocks: attack_mechanism_known → H2 advisory 8 min, vent 14 min.  Early alarm (crew_warned before mapping, Voltage up) → 24 / 30 min, in parallel; first to fire wins.
```

What changed since round 1 is all on the story layer. The aim order (`confirm_the_lie` → `reach_the_workshop` → `map_the_attack`) shows in the HUD, but the engine doesn't enforce it (R2-1). The real convergence points are the ones the skill names: `esd_authorized` (three mappings, any order, erb:1161-1181) and `concludeRequires` on the four flags (erb:417-424). Both hold. Every gate still sits behind something the player meets first, so the round-1 boss-key audit stands unchanged: the plant reader is seen at d4 before the kit (d4, behind the L2 door) and the print (d3, back-track).

### 2. Does every route reach the ESD and the call-in?

| Route variable | ESD reachable? | Call-in reachable? |
|---|---|---|
| Vance cloned / KO'd / never told | Yes: L1 from the clone, the KO drop (`itemsHeld`, erb:1374) or the locker | Yes |
| Relay cloned / KO'd / dodged | L2 from the clone (erb:817-824) or the KO drop plus the relayed copy (erb:709-717, 1024-1029). Dodging her without the card leaves the workshop shut, and HaX's hub names Relay (ink:812-817) | Yes |
| Cipher talked off / KO'd / dodged | Optional; no item needed from him | Yes |
| Static talked past / fought | Yes; Static's challenge is skipped once he is engaged, stood aside, down, or the ESD is in (erb:2105) | Yes |
| Voltage fought / arrested / let run | All three set `voltage_neutralised` (erb:1095-1112) | Yes |
| Flags before dial / evidence | Yes. The ESD names the missing dial (erb:2172). The hub misdirects (R2-2) | Yes |
| Bank vented (clock or race) | Yes. The vent never ends the run (erb:2410-2412) | Yes |

The call-in depends only on `attack_prevented` (HaX mapping erb:898-904; hub choice ink:125 `{attack_prevented and not mission_complete}`). The debrief has two reload backstops (erb:1256-1263, 1298-1305), which route r10 exercises. No route is left without an ending.

### 3. Softlocks after KOs and reloads

- **Player KO** opens the game-over screen; Restart reloads the page with saved progress (game-over-screen.js:157-174). Health comes back at 100, and hostile NPCs are restored hostile.
- **Trigger race on a reload or KO:** the timer resumes from its saved running time (scenario-timer-dispatcher.js:83-92), so it usually fires. That's forfeit by design (erb:2329-2334). Voltage stays hostile and has to be KO'd for `voltage_neutralised`. That's always winnable: Voltage has 100 HP (combat-config.js:44), a jab does 10 every 0.5 s (:16-17), so about 5 s of contact; Voltage does 12 per ~2.5 s and Static 4 per 2 s. No KO loop.
- **Vance KO'd before the clone:** the card drops, the locker has a spare, and the print is on a panel, not on Vance. `taskOnKO` completes `meet_robert_vance` (erb:1365). There's no crew-warning route without Vance (both of his crew choices need `vance_is_ally`), and the credits account for that.
- **Relay KO'd:** a physical drop plus the phone copy (erb:1024-1029). With Relay hostile after a clone, the plant reader sits outside her 96 px aggro range for most of her loop (erb:1892-1900).
- **A reload mid-conversation:** the Relay, Static and anomaly chats replay because `onceOnly` is persisted on close (erb:1923-1927). Cipher's `cipher_engaged` / `cipher_walked` persist as globals.

No softlock found.

### 4. The dial deduction after F4

It's solvable, and the remaining in-world clue is enough. Taken alone, the HMI line (erb:1443) states the inference ("only a standalone instrument in the hall would show it"). The Hall 1 H2 panel adds "NOT connected to SCADA… The SCADA HMI claims everything is nominal. It is not." (erb:1822). The thermometer's own observation draws the contrast once the player finds it (erb:1782). The clue is shown before it's needed: d2 comes before d3 on the only path, and nothing needs `anomaly_detected` until the ESD (or Vance's crew offer). The problem is the opposite of the one in the question: two pushed texts give the answer away before the player can infer it (R2-4). The pull hints (HaX ink:153, 290-294; Vance ink:440) are the right shape for a stuck player and should stay.

### 5. The time puzzles at a realistic VM pace

All timers run on wall-clock time (`Date.now()`, game.js:1709). They keep counting while the player is in the VM tab and don't pause for conversations.

- **The normal clock (8 / 14 min from the last flag):** fair. Neither starts until the VM work is finished (erb:2388, 2434). After the last flag, the worst-case critical path is: the dial, if unread (Hall 1, next door); the kit (same room as the VM, usually already taken); the print (Hall 1, one dusting run); Hall 2 past Relay; the plant door; Static; Voltage; the ESD. For a struggling player that's about 5-8 minutes, including reading. Fourteen minutes leaves slack; eight makes the advisory a pressure beat, not a fail state. The one thing that wastes this time is R2-1's evidence errand.
- **The early-alarm clock (24 / 30 min from the alarm):** fair as a stated trade, harsh in practice. Vance gives the cost before the choice: "half an hour, maybe, and your workshop job isn't done" (Vance ink:457-464; phone ink:224-233). Four flags at a student's pace (a scan, an FTP finding, an old-daemon exploit, a sudo escalation) will often take more than 30 minutes, so an early alarm usually costs bank B and the two feed casualties (erb:188). That's honest. There's also an answer an attentive player can find: "Not yet" (Vance ink:470-472), map the attack, then sound it for free ("costs you nothing now but surprise", Vance ink:459). The dilemma is about *when*, which suits a thriller. No change proposed.
- **Trigger race (25 s):** fair (numbers in section 3). HaX telegraphs it ("He's going for the laptop. Drop him.", erb:1071) and the HUD shows it, first in array order (erb:2329-2335).
- **Observation, engine (approval log, not a mission finding):** time while the page is closed doesn't count. On reload a started timer resumes from its saved running time (scenario-timer-dispatcher.js:83-92). A player who sounds the early alarm, closes the game tab and works the VM elsewhere stops the clock, but one who leaves the tab open doesn't. The leniency is harmless, but the clock behaves differently depending on whether the tab was closed.

### 6. Red herrings that cost nothing

Most of the side content is cheap and pays something back: the H2 panel (a second off-bus instrument), the rack manifest (it seeds the crew dilemma, erb:1973), the go-bag (optional Base64 lore with an in-world author, erb:2277), the locker (redundant card plus a lockpick beat, F3), and the pc objects with only observations (camera wall, network monitor, Vance's terminal), which each add one line of story. Two cost real time:
- the "break-in on paper" errand, which runs while the clocks are counting (R2-1);
- possibly the ProFTPD backdoor guide, if flag 2 isn't the backdoor (R2-6, needs checking against SecGen by the user).

## Verdict

**The phase can close once R2-1 and R2-2 are fixed.** Both are small mission-local edits to one mapping, one ESD variant and one hub knot, plus a route. A short round 3 should confirm them, ideally with one browser check that the erb:1143 guard holds in the real event order. Nothing blocks solvability: every route reaches the ESD and the call-in, KOs and reloads leave no softlock, and the timers are fair at a realistic pace. R2-3 to R2-5 can go to the dialogue phase. R2-6 is for the user's SecGen check (it joins m17). R2-7 is a tidy-up.

Late-round narrowing: round 1 found design questions; round 2 found one root cause. An engine change after the design (early aim reveal) quietly dissolved a gate the texts still describe. That's convergence, not new structural problems.

---

Measured against m01_first_contact and m02_ransomed_trust. Reviewed: round 2 (static). Route driver 13/13 pass; validator schema pass, geometry and doors OK, 13 wiring warnings (known), 15 issues and suggestions, 2 missing recommended fields. SecGen XML and the exploit field guides not opened.
