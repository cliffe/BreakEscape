# m04 Critical Failure: pass-4 final confirmation playtest

Question answered: plumbing + reading the words (question 1), with a wander-off check (flags submitted before any evidence read, question 2). Keyless server :3001, headless, fast. Game 1423. Log: `tools/playtest/m04-pass4-final-session.jsonl`. Screenshots: session scratchpad `m04-final/`.

## Findings log (written as I go)

- Briefing: plays in full; "Right. What else should I know?" now answered by HaX "Ask. Quickly." (fixed hub-return). No empty bubbles.
- Step 2 (after cloning Vance, HaX "I need guidance" -> "What should I be doing right now?"): PASS. HaX: "The engineering workshop, off Battery Hall 1. That's where they got onto the SCADA network. It wants a Level 2 card." / "Relay carries one. She walks Hall 2, and Hall 2 opens on Vance's card." (Log seq approx 150-175.)
- Vance conversation (cover route, "Just doing the job" -> staff records -> lean-in clone): reads cleanly; his close "Anything else, I'm at the ops desk. Watching the screens." replaced the old "people depend on it" line.
- Cipher talked out: "He says it too fast." reads cleanly. No awkward line.
- Relay clone: "...Was that what I think it was?" then "That was my card. Run, then." reads as an answer to nothing odd; fine. "Card's yours" text still arrives after the biometric-door text (known, not changed).
- Step 3 (thermometer, 61 call): PASS. HaX opens by itself ~3 s after reading: "Nightshade's got your reading. Sixty-one degrees on the Hall 1 battery thermometer, against twenty-eight on the screens." / "His words: those cells are past safe, and they won't wait for 0800, trigger or no trigger." / "The screens lie because ENTROPY feed them. That dial isn't on their network." (s01_thermo.png). Small snag: "their network" is ambiguous (ENTROPY's or the screens'), reads fine in context.
- Step 1 dead end, part a: submitted all four stand-in flags without reading work orders, access log, camera log, reader export. HaX text arrived on the last flag: "Flags are in, but grid control won't move without the break-in on paper. Vance's work orders, the workshop access log or the camera log. Any one." PASS (names the missing evidence; no locations given).
- Step 4 part a: HaX hub after all flags in no longer offers "I'm on the OT network. What am I looking at?" (hub shows only the guide offers, "I need guidance", "Nothing right now"). PASS so far; the "SCADA backup server" wording check is below.
- Step 1 part c: "I need guidance" -> "What should I be doing right now?" with flags in, evidence unread: "Your flags are in. Grid control still wants the break-in on paper." / "Vance's work orders, the workshop access log, or the camera log in the security office. Read any one." PASS. Only the camera log carries a location ("in the security office"); work orders (operations office) and access log (this room) do not, but the player is standing in the workshop. Minor.
- Fingerprint kit text (HaX, tool case): "The crew's own fingerprint kit. It's how they beat the plant reader. Their reference cards are in the lid, with our file prints of the cell. Lift Vance's print now." Reads plainly; no "nothing's counting down".
- Print lift: Duty panel, silver powder, 72% Fair; loop; picked "Robert Vance" by eye from two near-identical cards (cards are visually hard to tell apart, 50/50 by sight; the job card "R.V." line points to Vance). Plant door opened, no hit from Relay (she was at x 1450-1760, I crossed when she was east).
- Step 1 part b: ESD refusal in the plant room, flags in, no evidence read: "NOT ARMED. GRID PERMISSIVE NOT RECEIVED. Grid control has the hazard and the attack, not the break-in. They want it on paper: Vance's work orders, the workshop access log or the camera log." PASS (s06_esd_refusal.png).
- Step 5: Voltage opens with a face. Bust is a man in his forties, white shirt sleeves rolled, loose black tie (s07_voltage_open.png). In the plant room the world sprite is a man in a white shirt and black trousers, clearly different from Static's red hood (s08_plant_room.png). PASS.
- Voltage openers seen: "And not one of my people saw you come." / "But you're late. This place has no security worth the name, and we've had three days in it." (the first line "So they sent someone." was already past by the time my driver read the chat, so not verified on screen). "It's over, Voltage. Stand down." -> "One keystroke and it's now, not eight o'clock. The racks go critical, the hall burns, and the grid drops." / "Your move." No "noon", no repeated keystroke line. Reads clean.
- WARNING from my own error: I chose "I'm taking you down. Now." with Static standing (a fight choice, not the let-him-run one) and the harness's command latency let Static and Voltage take me from 100 HP to 4 HP in about ten real seconds before I could debugKO them. Fight pace is the player's problem only if a human is as slow; not a dialogue finding. Both KO'd by debugKO (assisted, combat not played).
- Step 1 part d: read the Workshop Access Log (the only evidence document I touched). `evidence_access_logs_found` and `attack_mechanism_known` set within about 6 s; HaX: "He's out of the way, the sixty-one degrees in Hall 1 is on record, and so is the attack. Grid control's standing by. The ESD is live. Press it." (Voltage was already KO'd, which is why "he's out of the way".) PASS.
- Reload (once, after the ESD armed): `location.reload()` after sync. No briefing or intro replay; the title and Mission Brief panels came back and were closed via bootstrap. Player respawned at main_entrance (not in the plant room), HP back to 100, inventory kept, doors that had been open shut again (plant door stayed unlocked), Cipher still gone, `attack_mechanism_known` still set, ESD still armed ("Flip guard to arm ESD control."). Same respawn-at-entrance behaviour as the earlier round; not new.
- Vance after the reload: late reveal ("I'm not an auditor. Your Hall 1 dial reads 61. Your screen says 28.") plays clean; he no longer asks and answers "What do you need from me?". Phone opens "It's Vance. I'm on the ops desk with the historian up, and on comms if you're moving..." then "Agent. What do you need?" (no doubled ops desk). His "I'm in the workshop" and "What should I be doing right now?" answers are plain ("You know what they did. Now get to the shutdown and press it.").
- Step 4: no "SCADA backup server" anywhere on screen (HaX hub, HaX guidance, Vance phone) and none left in the ink or scenario source (grep: only the review note mentions it).
- Debrief (step 7): the run of HaX bubbles is now 3 / beat / 5 / beat / 6 / choice, longest 6 (was 15). Beats seen as single-option player choices ("What did we get out of there?", "And how did they get in? How did I?"). No "But...", no "Approved." / "Decision recorded."; disclosure reaction is "Full transparency. The attack, the holes it came through, ENTROPY. All of it." ... "Done." Credits came up (`missionEnd.creditsShowing: true`).

## New awkward lines
1. Debrief, HaX: "Voltage is in a room now. So far he's given us one thing: the number." Same "the number" problem as the old "A court can have the number too" (which number?). It follows "Zero Day supplies, Critical Mass executes", so a reader may take it to be the attack date. Worth a noun.
2. HaX (61 call): "That dial isn't on their network." "their" can read as the screens' or ENTROPY's; fine in context, minor.
3. HaX pointer after the flags: only the camera log has a location ("in the security office"); work orders (operations office) and the access log do not. A player in the workshop already sees the log; a player elsewhere has to search the work orders. Minor.
4. Vance, plant-room refusal branch when you pick "The plant room's on a fingerprint reader." first: "It's an HV room, and you're an auditor." is a reply to a statement about a fingerprint reader; it works (he stonewalls) but doesn't acknowledge the reader. Minor.
5. Hall 1 entry text order: "Card's yours..." still arrives after "And that plant-room door is biometric..." (known, unchanged by design).
6. HaX hub: choosing "I need guidance" via the bridge's `choose` once reported ok but posted nothing; clicking the same control by label worked. Harness quirk, not game.
7. Not verified on screen: "So they sent someone." (Voltage's first line scrolled past before my driver read it), "Look at my hand. Then look at the clock." (the "You're not burning..." branch), the let-him-run and arrest branches ("Nobody left to stop you. All right.", "Let them read the casualty model. I signed it.") and the Relay reaction beats on a hostile entry. Source check only (`m04_npc_voltage.ink` lines 85, 137-139, 155, 259, 299, 323): they read as the DIALOGUE_REVIEW says. I took the "I'm taking you down. Now." branch by mistake and then used `debugKO`, so the fight text after it was not read either.

## Run header

Question answered: plumbing + reading the words, plus a wander-off check (all four flags submitted with no evidence read). Not a solvability pass: flags are stand-ins.

Game 1423, session log `tools/playtest/m04-pass4-final-session.jsonl` (1533 commands; seq ranges in the findings above are not cited line by line, search the log for `<flag:` for the flag submissions and `debugKO` for the assisted KOs). Screenshots in the session scratchpad `m04-final/` (s01_thermo, s04_compare, s05_cand, s06_esd_refusal, s07_voltage_open, s08_plant_room, s09_esd_armed).

Verification (`verify-run.rb 1423`, after `{"cmd":"sync"}` and `session-stop.sh`):
```
game            1423  (mission 48)
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
unlocked objs   1: optigrid_tool_case
inventory       8: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad, Fingerprint Kit, OptiGrid Job Card #4782 (back page), Workshop Access Log
flags submitted 4 (stand-ins)
globals set     39 (incl. all_flags_in, attack_mechanism_known, evidence_access_logs_found, esd_authorized, mission_complete)
VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Vance Level 1 card | cloned | Vance, "Lean in..." + cloner read | early | yes |
| Relay Workshop Card Level 2 | cloned | Relay, "(Keep her talking...)" + cloner read | Hall 2 | yes |
| Tool case padlock | `completeLockpick` | Lock Pick Kit (briefing) | workshop | **no, assisted (dexterity)** |
| Vance's print | lift 72% | Hall 1 panel, kit from the case, job card "R.V." | after case | lift yes; identification a visual 50/50 guess between two similar cards ("Robert Vance" was right) |
| `bms_jump_server:flag_1..4` | `<flag:1>`..`<flag:4>` | needs the VM work | - | **no, exercised, not earned**. ESD arming, debrief and credits are exercised, not tested for solvability |
| Evidence (workshop access log) | read | Workshop Access Log, workshop | after flags | yes |
| Fights (Static, Voltage) | `debugKO` | n/a | plant room | **no, assisted** |

## Step table

| # | Check | Result |
|---|---|---|
| 1a | Four flags in, no evidence read: HaX text names the evidence | PASS: "Flags are in, but grid control won't move without the break-in on paper. Vance's work orders, the workshop access log or the camera log. Any one." |
| 1b | ESD refusal names it | PASS: "...Grid control has the hazard and the attack, not the break-in. They want it on paper: Vance's work orders, the workshop access log or the camera log." |
| 1c | HaX "What should I be doing right now?" names it | PASS: "Your flags are in. Grid control still wants the break-in on paper. / Vance's work orders, the workshop access log, or the camera log in the security office. Read any one." |
| 1d | Read one: ESD arms | PASS: `attack_mechanism_known` set, armed text "Grid control's standing by. The ESD is live. Press it.", ESD panel "Flip guard to arm ESD control.", pressed through to debrief |
| 2 | After Vance clone, guidance names Level 2 card | PASS: "It wants a Level 2 card. / Relay carries one. She walks Hall 2, and Hall 2 opens on Vance's card." |
| 3 | 61 call: sixty-one degrees on the Hall 1 battery thermometer and why screens lie | PASS: "Sixty-one degrees on the Hall 1 battery thermometer, against twenty-eight on the screens." / "The screens lie because ENTROPY feed them. That dial isn't on their network." |
| 4 | OT-network option gone with all flags in; no "SCADA backup server" | PASS (hub on screen; source grep clean) |
| 5 | Voltage has a face (male_office_worker_v2), differs from Static | PASS: shirt-and-loose-tie man bust, white-shirt world sprite vs Static's red hood |
| 6 | Previously flagged worst lines | PASS on screen: Cipher "He says it too fast.", Relay "That was my card. Run, then.", kit text, Voltage "...not eight o'clock", Vance no longer self-answers, no doubled "ops desk", debrief without "But..."/"Approved.". Source-only: Voltage "already moving", "Look at my hand...", arrest lines (see item 7 above) |
| 7 | Debrief HaX run broken by player beats | PASS: longest HaX run 6 (was 15) |
| - | One reload | done; behaviour as before (respawn at entrance, state kept) |

Dead end verdict: the dead end is now signposted in all three places, and reading a single document armed the ESD. Combat note: a fight started by my mis-click took me from 100 to 4 HP in about ten real seconds with the harness pausing between commands (not a dialogue finding).
