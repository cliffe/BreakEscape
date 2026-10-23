# m09 Digital Archaeology: puzzle-chains plan (phase 2, round 1, with reviewer rounds 1–3)

2026-10-22. Phase 2 of the AGENTS.md five-phase loop, run with `.claude/skills/mission-puzzle-chains/SKILL.md` on the tree at commit e9e5179e ("Finale m09: alignment R8 clean, phase 1 complete"). Plan only. No unambiguous factual bug turned up, so nothing in the mission was edited.

**Kind of game and aim.** A SAFETYNET campaign mission (Licence to Hack, Season 1, penultimate), so a TV spy thriller. The user's test for this phase: is it fun, engaging and educational, and do the player's m01–m08 choices matter?

**Method.** I worked from `scenario.json.erb`, the ink, the engine under `public/break_escape/js/` and `app/models/break_escape/game.rb`, `room_depth.py`, and the validator (`--skip-ink --no-graph`, so no `dungeon_graph.*` rewrite). I read CONTRACT.md and ALIGNMENT_REVIEW_F_R8.md for what is settled, and the stage 3 moral-choices doc for the legacy-box ruling. I opened no VM plan, SecGen file or field guide. VM flags are black-box submissions at their stations.

**Counts, all rounds: 0 blockers, 1 major, 9 minors** (F2 major; minors F1, F3, F4, F5, F6, F7, plus three corrections to the plan's own proposals: R2 on P1's contract scope, r2 M2 on P4's wording, r3 M-1 on P5's wording). My draft found two minors (F1, F2). Round 1 made F2 a major and added R2–R6. Round 2 added F7 (M1) and M2. Round 3 confirmed every earlier finding closed and added M-1. **All are now folded in; none is open.** Review log in §13.

---

## 1. Summary: what to do, in order

| # | Item | Severity | Kind | Depends on |
|---|---|---|---|---|
| P1 | HaX's keypad topic: three hint tiers, so the chart is found in the room and Gary's call stays worth something | minor (F1) | ink, unvoiced; contract §2.1 row 5 | nothing |
| P2 | Torres rings after the H&L lid opens, not across it; his pointer has an arm for each case | **major** (F2, reviewer R1) | ERB: one HaX latch, one new Torres ring, one condition; ink, unvoiced; one new global | nothing |
| P3 | Two lines that name the wrong room when the identity scene or the hour read plays in the cage | minor (F3, R3) | ink: one voiced line (one TTS clip), one unvoiced choice | nothing |
| P4 | HaX's Tran topic gets an `m08_nightshade_tidied` arm: no paper lever exists on that branch | minor (F4, R4) | ink, unvoiced | nothing |
| P5 | Gary's call knows when the door is already open | minor (F5, R5) | ink, unvoiced; one synced VAR | nothing |
| P6 | HaX text when route A's staff door refuses after Noor has gone home with her card | minor (F6, R6) | ERB, one text mapping | nothing |
| P7 | Torres' fallback ring moves off `reading_found` (it can shut the safe mid-read) onto leaving the office | minor (F7, r2 M1) | ERB, one mapping; Torres ink header comment | P2 (shares the else arm) |

All seven are mission-local. Only P3 touches a voiced line (one clip; audio is generated last, so likely no regeneration cost yet). P2 adds one global (`hl_box_opened`), two mappings and a synced VAR in Torres' ink. P5 adds a synced VAR to Gary's ink (`salvage_opened`, already declared at erb:2469). P6 adds one mapping. P7 replaces one mapping. tagdiff for P2 and P5 will show those VAR additions as well as text. No knot is renamed. After each: recompile the ink, run `tagdiff.mjs` against HEAD (expect only text and one ink-local VAR), then `dialoguelint` and `reopencheck` for `agent_0x99`.

Bug fixes made during this round: **none.** The candidates checked and cleared are in §4.6.

---

## 2. Headline numbers

From `room_depth.py` and the validator (2026-10-22). m01/m02 figures as in m08's plan §2.

| | m01 | m02 | m09 |
|---|---|---|---|
| Rooms | 13 | 13 | 11 |
| Empty rooms | 0 | 2 | 1 (`staff_passage`, by engine necessity; dressed; §7) |
| lockType declarations | 12 | 15 | 11 |
| Max room depth | 3 | 7 | 5 (`salvage_cage`) |
| Critical-path hops (aims) | 9 | 4 | 3 (dungeon_graph.md:22-24) |
| Locks on the critical path (route B) | — | — | 7: stacks (flag 1), cage gate (clone), plan cabinet (print), office (story gate), safe (PIN), tape room (card), salvage keypad (Vigenère) |
| Deductions needed to finish | — | — | 3: the salvage code (an act-1 line + the bay word + Vigenère), the safe (the cracker's Mastermind feedback, or the rent ledger's date), where her print is |
| Optional deductions with a payoff | — | — | 4: the H&L lid (flag 2's file number → shortlist and closing card), the Alpha sheets (key "the series" = ALPHA), Tran (the letters name J.T.), Sorensen talked down (her file, "Not on any schedule") |
| Start-kit tool classes used | 1 | — | 5 of 5: picks, RFID cloner (EM4100 and MIFARE custom keys), fingerprint kit, PIN cracker, CyberChef |
| VM flags | — | — | 4 on two stations, each tied to a beat |

---

## 3. Boss-key audit

Depth is BFS from `loading_dock`. "Seen" is the depth at which the player first meets the lock; "key" is where its key or code first becomes available.

| Lock | Seen | Key from | Key depth | Verdict |
|---|---|---|---|---|
| `front_desk` door, key, picks (erb:1068-1072) | 0 | lockpick (start kit, erb:571-577); or Old Coyote's ring on a knock-out (erb:1211-1223) | 0 | ✅ by design (m01 grant). Route A only |
| `staff_passage`, RFID `reading_staff_door` (erb:1450-1452) | 1 | Noor's EM4100, cloned at her desk (noor.ink:91-98), or handed over warned in time (noor.ink:36) | 1 | ✅ by design (m03 grant). Route A only; route B never meets it (erb:1436-1442) |
| `restricted_stacks`, RFID `stacks_release` (erb:1583-1585) | 2 | flag 1 at the drop terminal, then HaX's `unlockDoor` (erb:166, 170-171) | 2 (VM) | ✅ The refusal text (erb:152) says what to do. The VM opening the physical path, as in m05–m07 |
| `restricted_cage`, RFID `stacks_card` (erb:1697-1699) | 3 | Sorensen's MIFARE custom-keys card, cloned across the hatch (hatch.ink:121-131); or Victoria's maintenance code (phone:781-784) | 3 | ✅ by design: the cloner (m03) spent on the night's hard card. The m03 `recruited` branch skips it, which is the earned shortcut |
| `plan_cabinet`, biometric (erb:1854-1857) | 4 | her print on the stamp at the hatch shelf (erb:1658-1677) | 3 | ✅ boss-key, one room back. HaX's entry text (erb:211) is the inferential nudge ("She stamps everything"); a player who lifted the print early is rewarded, not short-changed |
| `sorensen_office`, password (erb:1917-1919) | 3 | none; HaX opens it on `deck_choice_made` (erb:253-255) | story | ✅ announced story gate. The first try says "There's no code to find for it. Leave it for now." (erb:157-158). See W2 |
| `director_safe`, PIN 060216 (erb:1931-1934) | 4 | Kowalczyk's cracker (start kit, erb:603-611): Mastermind feedback, unlimited tries (pin-minigame.js:42-45; minigame-starters.js:530-545); or the rent ledger's header "Lease start: 06/02/16" (erb:2053) | 0 / 4 | ✅ by design. PASS3_APPROVAL_LOG.md:31 says a mission that issues a cracker must design its PIN locks for it; this one does: the cracker turns the safe into a deduction, and the same-room ledger is the observant player's shortcut |
| `tape_room`, RFID `tape_room_reader` (erb:2141-2143) | 3 | key card in the safe (erb:2029-2039) | 4 | ✅ boss-key. Two refusals cover before and after the deck (erb:159-161) |
| `salvage_cage`, password LEWISANDCLARK (erb:2251-2253) | 4 | the coded line, given at flag 1 (phone:193; erb:789-799; screen erb:1532) + the bay word on the chart beside the keypad (erb:2186-2201) + CyberChef | 2 + 4 | ⚠️ split, kept. The ciphertext is a long-arc clue handed over two acts early and named for its lock ("Salvage cage, their own code.", phone:204), which pays off well. The key is same-room by intent: a shelf-mark chart belongs by the keypad. The real weakness is the hint tier, not the placement: F1 |
| `hl_box`, password HL2015-0477 (erb:1334-1337) | 1 | flag 2's file number (ledger_read, phone:214-240; screen erb:1528-1531) | 2 (VM) | ✅ boss-key, optional. Seen on the way in; opened on a walk back. HaX's A3-35 text points at it (erb:367-368) |
| `enrolment_crate`, key `beta_crate` (erb:2354-2358) | 5 | lockpick | 0 | ✅ by design, optional |

**Reading it.** No lock is a key-before-lock surprise, and no same-room pair collapses a required beat that matters. The two "same-room" cases are the clones, where spending earlier kit is the point, and the safe's ledger, which is the second of two routes. The one place the three beats (encounter, hunt, return) thin out is the salvage keypad, and the fix belongs in the hint, not the room (F1).

---

## 4. Findings

### F1 (minor). HaX's first keypad hint gives the whole method, and gives every player Gary's carry-over help

**Evidence.** The first keypad try sends A3-20, "If the cipher's new to you, there's an archive-code field guide. Ask me." (erb:271-272). Opening HaX, the newest topics sit first, so "[The keypad on the cage.]" (phone:714) is above "[I need a field guide.]". Its first answer (phone:715-724) quotes the line, then: "Just the code, not the label. The key is the salvage bay's word, on the chart in the tape room, by the keypad." The second answer names the CyberChef operation (phone:727). So a player who does what the text asks gets the chart's location and the key rule before looking round the room. The chart is only a few tiles away: `shelf_code_legend`, "beside the salvage keypad" (erb:2195), and it carries the rule itself ("House rule: cage and keypad codes use the bay word.", erb:2196).

**Why it matters.** It hurts on the user's two priorities at once.
- *Fun and teaching.* Vigenère is new to the campaign (no other m01–m10 scenario uses it; `grep -il vigen scenarios/m0*/scenario.json.erb` hits m09 only). This keypad is the one place the player meets it. Spotting the chart and working out that "the bay word" is the key is the step that teaches the cipher. Tier 1 currently does that step for them.
- *Earlier choices.* On `m02_gary_protected`, Gary rings at the keypad (erb:886) with "Vigenère, and the bay's word is the key. There'll be a chart near the keypad." (gary.ink:25-26). That is m02's payoff. Tier 1 of HaX's hub gives every player the same rule and the chart's place, so the protected-Gary player only gets it a little sooner. HaX even concedes it ("Gary told you how.", phone:722).

**Fix: P1.**

### F2 (major; reviewer R1, traced in code, needs browser proof). Torres' ring closes the H&L container on the correct-code path and plays the wrong arm

**Evidence.** Torres rings on `object_interacted` with the box's name after flag 2, `delayMs: 1500` (erb:865). Typing HL2015-0477 takes longer than 1.5 s. When the delay runs out while a minigame is open, the mapping retries every 500 ms (npc-manager.js:611-624; `DELAYED_MAPPING_RETRY_MS = 500`, :125). On the right code, the password minigame ends and `unlockTarget` opens the container only after `setTimeout(..., 500)` (unlock-system.js:715-722). One retry lands in that gap, with no minigame open. The condition still passes, since it doesn't test the shortlist and the sheet hasn't been read. The phone call then opens, and `startMinigame` ends whatever is running (minigame-manager.js:58-70), which is the container that has just opened. Torres plays his `else` arm, "Find the firm's boxes, then the placing sheet." (torres.ink:30), to a player who has just opened them. The wrong-code-then-cancel path reaches the same arm, which my draft's F2 covered.

**Why it matters.** This is m05's turned-Torres payoff, and it misfires on the main path. The reward container flashes and vanishes, and the helper's advice is stale. It isn't a softlock: the box reopens (`isUnlockedButNotCollected`). Torres has never been playtested (PLAYTEST_FULL_1.md:88).

**Fix: P2** (replaces my draft's text-only P2, which left the correct-code path broken).

### F3 (minor; R3). The identity scene and the hour read can play in the cage, where two lines name the wrong room

**Evidence.** Nightshade's file isn't needed for flag 2, the office or the salvage cage, and the game expects late fetches: the status row "Flag three's in. Bring me Nightshade's file from the plan cabinet in the cage." and the text "Bring me his file. Then we say it." (erb:278). On that order the identity scene rings on the file pickup, in the cage (erb:279). On `deck_pulled == "alpha_tapes"` it says "His tapes are on the bench next door." (phone:519-521), but the cage's neighbour is the restricted stacks. If flag 4 is also in, the hour read follows there (erb:287), and the player's choice "[Her schedule. This room isn't on it.]" (phone:603) refers to a room the schedule ticks ("Cage ✓", erb:2026).

### F4 (minor; R4). On `m08_nightshade_tidied`, HaX's Tran topic points at a lever that doesn't exist

**Evidence.** Tran's talk-off needs `cage_bin == "letters"` (tran.ink, the lever choice). On tidied, neither the hatch nor the door scene offers the letters (hatch.ink:100-107; the door scene likewise), and Nightshade's slip says why ("Anything that named anyone else, I burned.", erb:1646). HaX's topic 17 still says "You'd need something he wants to talk him off it. Otherwise it's a fight." (phone:805). A tidied player who wants the non-violent route hunts for something m08 already burned, and the game never says so.

### F5 (minor; R5). Gary's call plays after the door is open

**Evidence.** Gary rings on `door_unlock_attempt` at the salvage keypad, `delayMs: 1500`, with no `salvage_opened` test (erb:886). A player who reads the chart, decodes, and types the right code at the first try then hears "HaX says you're stood at a keypad… There'll be a chart near the keypad." (gary.ink:23-26) on the far side of the door.

### F6 (minor; R6). Telling Noor before cloning her card leaves route A at a dead door with no pointer

**Evidence.** The tell choices need only `noor_asked_peg` or `ledger_page_seen` (noor.ink:108, 111), not a saved clone. They end on `noor_told`, which hides her and her card with her (erb:1119-1120). The staff door then gives the engine's generic refusal (unlock-system.js:525-529). No HaX line covers it; the status ladder's early rows don't either (phone:921-923). Route B still works, so it isn't a softlock. But the player who does the decent thing first is the one left stuck.

### F7 (minor; round 2 M1). Torres' fallback ring can shut the safe while the player is reading it

**Evidence.** Torres' fallback rings 8000 ms after `reading_found` (erb:866), which is set by the first Reading page inside `director_safe`. The safe holds six readable pages and the tape-room card (erb:1939-2040). Each page read closes the safe, and it reopens after 100 ms (notes-minigame.js:802-806; container-minigame.js:882-920). A delayed ring retries every 500 ms while a minigame is open (npc-manager.js:620-628). If a retry lands in one of those 100 ms gaps, the phone opens 500 ms later and ends the reopened safe (npc-manager.js:1166-1186; minigame-manager.js:58-70). This is the same race as F2. For a player who reads every page, the reviewer puts it at about three in four (an estimate, not measured). It hits the turned-Torres players who skipped the H&L box, which are exactly the ones the fallback exists for.

### 4.6 Bug sweep (skill Step 4): clean

| Check | Result |
|---|---|
| Cross-scenario ids hard-coded in shared minigames | None touched by m09's locks (password, PIN, RFID, biometric, key). No `backup_recovery`-style minigame here |
| `item_picked_up:` keyed on id | None. Every one is `item_picked_up:notes` with `data.itemId` in the condition (erb:317-321, 346-349). The payload carries `itemId` (inventory.js:283-289, 627-633; npc-game-bridge.js:40-46) |
| Tasks with no completion route | None. Each traced: `get_inside` (erb:145-146), `set_up_drop_terminal` (erb:147-149, 169), the hatch and gate (erb:188, 194-195), `open_plan_cabinet` (see next row), `stop_the_shredding` (erb:223-224), `stop_the_tape_wipe` (erb:233-234), `cross_reference_wren` (erb:241-242), `hear_the_mirror_job` (erb:302), `send_the_notice` (erb:303), `report_to_netherton` (erb:1021, 1028) |
| Validator warning 1: biometric `unlock_object` may never emit `item_unlocked` | **Withdrawn.** The biometric case calls `unlockTarget` (unlock-system.js:358-365), which emits `item_unlocked` for a container with contents (unlock-system.js:705-713), and `handleObjectUnlock` matches on the id (objectives-manager.js:481-494) |
| Player-visible author notes (`[LORE`, `[NOTE`, TODO) in text, observations or ink | None |
| Observations that state a lock's code | None. The H&L lid says "takes a file number" (erb:1338); the safe says "six-digit keypad" (erb:1935) |
| Rename residue | None. "H. Kowalczyk; M. Quintero" (erb:1348) match Halina and Marisol (erb:933-934; the Recruiter's "Halina Kowalczyk") |
| Stale geography | None found. "It's the west door. That's the front desk" (phone:157; dock `west: front_desk`, erb:741); the shutter "on the north side" (phone:159; dock `north: open_stacks`); "server closet off the open stacks" (phone:805; erb:1188); "the bench next door" from the salvage cage (phone:520; tape room south of it, erb:2256-2258); "a floor safe, in her office" (phone:733) |
| Dead ERB helpers, unused globals | None. Every helper at erb:50-65 is interpolated; every m01–m08 import is read at least once (grep, this round) |
| Technical claims | Vigenère: MSJMQAEGDZNVI with key BONEYARD decodes to LEWISANDCLARK (checked by script). The Alpha line "Clgyy ie nvurdtsf. Lpi pt hfga afetywacsz." with key ALPHA gives "Carry it yourself. Let it hurt afterwards." (checked). EM4100 as the easy clone and MIFARE Classic with custom keys needing a key attack match the engine (rfid-ui.js:761). Magnetic powder on a grained stamp handle (erb:1673-1674) is correct practice. The 90-day embargo in the draft notice and the hour read's split between full and coordinated disclosure are accurate. Carrow Controls and the RM-4 are fictional |
| Password matching | Exact and case-sensitive on the server (game.rb:1063, 1166). The keypad tells the player when only the case is wrong (password-minigame.js:538-546), and HaX's tier-2 line says "Capitals in, capitals out." The pasted CyberChef output has no spaces |

---

## 5. Proposals

### P1. The keypad topic in three tiers ✅ keep (F1)

**Story logic.** HaX doesn't know the archive's scheme better than Gary does; she knows where to look. Tier 1 points at the room, tier 2 gives the rule, tier 3 gives the tool.

**Change** (`m09_phone_agent0x99.ink`, topic 5, phone:711-728). Replace the boolean `keypad_topic_asked` (phone:93) with an ink-local count (`VAR keypad_topic_asks = 0`) and keep the `{salvage_keypad_seen and not salvage_opened}` gate:
- **Ask 1:** the three lines that quote the line as now ("Catalogue line from flag one." / "SALVAGE CAGE ACCESS" / "MSJMQAEGDZNVI"), then "Just the code, not the label. It's their own code. Archives key things to the shelves. Look at the wall by that keypad." Then the existing guide/Gary branch (phone:721-725). On `gary_called`, keep "Gary told you how."; Gary's rule is now a step ahead of tier 1, which is the point.
- **Ask 2:** today's tier-1 sentence: "The key is the salvage bay's word, on the chart by the keypad." Then "It's Vigenère." [r3 N5: otherwise a non-Gary player only hears the cipher's name on the third ask.]
- **Ask 3 and after:** today's tier 2 (phone:727), unchanged.

**Contract and stage docs (reviewer R2).** The tier-1 text also appears in S6 `stage_6/lore_fragments.md:337-338` and S4 `stage_4/objectives_tasks.md:364`. It exists because of stage 6 ruling C-02 (major; `stage_6/REVIEW_R1_CLUES.md:22, 99`). The chart hangs in the tape store, bay 11 (STANDBY), and the house rule says "cage and keypad codes", so WATCHTOWER is a trap too. HaX therefore names *the salvage bay's* word. P1's tier 1 deliberately hands that label-to-row match back to the player. A wrong key decodes to obvious gibberish, so the feedback is cheap and the retry is quick, and tier 2 restores C-02's wording word for word. Update CONTRACT §2.1 row 5 (CONTRACT:105) and record in CONTRACT §15 that S6 §2.3 and S4 §7.1 row 5 are superseded for this topic, so a later pass reading S6 doesn't restore the old line.

**Counter.** Topic 5 is a choice inside `support_hub`, not a knot, so use an ink-local count VAR (or a labelled choice's read count), not a knot visit count.

**Cost.** Unvoiced hub text, about four lines. No global, tag or mapping changes. The hub's choice count doesn't change.

**Dependencies.** None.

### P2. Torres rings after the lid opens ✅ keep (F2) [r1: replaces the text-only draft]

**Change** (scenario.json.erb and `m09_phone_torres.ink`):
1. A HaX mapping `{ "eventPattern": "item_unlocked", "condition": "data.itemId === 'hl_box'", "onceOnly": true, "setGlobal": { "hl_box_opened": true } }`. `item_unlocked` is emitted synchronously inside `unlockTarget` (unlock-system.js:705-713), before the 500 ms gap. Declare `"hl_box_opened": false` in `globalVariables`.
2. Torres' `object_interacted` ring (erb:865) gets `&& !globalVars.hl_box_opened`. The re-check at fire time then cancels the gap ring on the correct-code path. The ring still helps a player who backs out or gets the code wrong.
3. A second Torres ring: `item_unlocked`, `data.itemId === 'hl_box' && globalVars.flag2_submitted && globalVars.m05_torres_turned && !globalVars.torres_called`, `delayMs: 1500`, `onceOnly`, not forced. It waits out the container (the retry loop holds while it is open) and lands after the sheet is normally read, so it plays the shortlist arm.
4. Torres' `- else:` arm (torres.ink:29-32) splits on a synced `VAR hl_box_opened`. Opened, sheet unread: "The old placements are filed under the firm that placed them. Read the placing sheet in the firm's box." Not opened: "The old placements are filed under the firm that placed them. Their boxes take the ledger's file number. Then the placing sheet." Keep the sick-parent line after either.

**Contract.** §5.3 (new global), §6.2 (two mappings), §4.3 (C4) and a §15 line.

**Cost.** Unvoiced (Torres, erb:850). One global, two mappings and one condition.

**Dependencies.** None.

### P3. Room-neutral lines for the cage ✅ keep (F3)

- phone:520: "His tapes are on the bench next door. When you want them." becomes "His tapes are on the bench in the tape room. When you want them." This is a voiced line, so it's one TTS clip; list it for the audio stage.
- phone:603: "[Her schedule. This room isn't on it.]" becomes "[Her schedule. His cage has no tick.]" (unvoiced; r2: the schedule does list it, "Salvage cage, no series, no tick.", erb:2026). HaX's reply ("No. It isn't. He shredded everyone but himself.") still fits.
- §8 below now notes that the name can fire at depth 4.

### P4. Tran topic, tidied arm ✅ keep (F4)

At phone:805, on `m08_nightshade_tidied`, replace the second sentence with "Nothing on him tonight that I can use. It's a fight, or you leave him to it." [r2 M2: the draft's "went in Nightshade's bag" contradicted the game: the locker was cleared and the paper burned (briefing.ink:44; erb:1646), and HaX can't know before the cage that a Tran paper existed]. Leaving him is valid: `stop_the_tape_wipe` is optional (erb:657) Unvoiced. Add `m08_nightshade_tidied` to the topic's reads (it's already an import through `m09_carryover_vars.ink`).

### P5. Gary knows the door is open ✅ keep (F5)

In `m09_phone_gary.ink`, add a synced `VAR salvage_opened = false`. In `call`, branch from gary.ink:23 on (r3 M-1: branching only lines 24-26 left "HaX says you're stood at a keypad" above "HaX says you're through already"). Opened arm, one line: "It's Gary. Whitlock, from St. Catherine's. HaX says you're through that keypad already. Didn't need me, then." Not-opened arm: gary.ink:23-26 as now. `#set_global:gary_called:true` stays above the branch. Keep the "new job" choices: they carry the m02 payoff. Don't gate the ring off, or the cameo is lost. Unvoiced.

### P6. Noor gone, staff door refuses ✅ keep (F6)

Add a HaX text mapping on `door_unlock_failed:staff_passage`, condition `globalVars.noor_told && !globalVars.staff_card_cloned`, once: "She took her card home with her. The shutter's still up." Unvoiced. Full condition (r3 N1): `data.roomId === 'front_desk' && globalVars.noor_told && !globalVars.staff_card_cloned`. `roomId` is the door sprite's own room (unlock-system.js:116-121; doors.js:504-506), so a route-B player trying the door from the reading room doesn't get the shutter line.

### P7. Torres' fallback rings on leaving the office ✅ keep (F7)

Replace erb:866 with `call_map("room_exited", "data.roomId === 'sorensen_office' && globalVars.reading_found && globalVars.m05_torres_turned && !globalVars.torres_called", "call", delay: 1500, forced: false, once: true)`. `room_exited` repeats, so it also covers a reload between the box unlock and P2's ring (S7), and a replaying player who opens the box before flag 2 (P2's rings then never fire). Update the Torres ink header comment ("or the fallback once the Reading is found") and CONTRACT §4.3/§15.

**Engine alternative (backlog, needs approval).** In `_scheduleDelayedMapping`'s `fire`, also wait while a container auto-launch or return is pending. That closes the whole class, including the rare case in §6 of a forced Act 3 call landing as the player picks the BETA crate.

## 6. What could break

- **Solvability.** [r1] No proposal touches a lock. P2 adds one global and two Torres/HaX mappings around an optional box; P6 adds one text. Otherwise: P1 only reorders what HaX says, and every tier still leads to the code within three asks. The status ladder's keypad row (phone:900-901) and the field guide are unchanged.
- **S1 (burnt first-call gate).** Topic 5 is a sticky `+` gated on `not salvage_opened`, so the count can't burn it. Tier 3 repeats on every later ask. P2 sits in a once-only call (`onceOnly`, erb:865-866), and the shortlist arm is unchanged.
- **S2 (order dependence).** P1 has the same gate as now. With P2, a player who reads the placing sheet first still gets the shortlist arm. A player on the fallback trigger who never saw the boxes gets "Their boxes take the ledger's file number", which is true, and HaX's A3-35 text already said where the boxes are (erb:367-368).
- **S5 (sticky over exhausted content).** P1's topic has no sub-choices, so it can't run dry.
- **Reopen.** HaX's hub restarts at `start` (CONTRACT §2.1). The count is an ink-local VAR saved with the story, so a reload keeps the tier. Run reopencheck for `agent_0x99`.
- **KO routes and layout.** Untouched.
- **[r1] P2's new ring.** It's `onceOnly` with `!torres_called`, so the box ring, the unlock ring and the office-exit fallback (P7) can fire at most one call between them. It isn't forced, so it can't trap the player in the container. The validator won't flag it: there is one `item_unlocked` mapping per NPC (r2).
- **[r1] P3/P5.** P3's voiced line is a fixed string, so it stays cacheable. P5's synced VAR follows the pattern in `m09_phone_torres.ink` (`torres_called`).
- **[r2] Other delayed rings checked against containers.** Of every `delayMs` call mapping in the ERB, only Torres' two rings reach a locked container (fixed by P2 and P7). [r3] P2's own `item_unlocked` ring can also land in the 100 ms gap when the placing sheet is read inside the box. That's harmless: the box holds only the sheet, `sleeper_shortlist` is already set, and the shortlist arm plays at the right moment. The forced Act 3 calls (erb:277-298) could close the BETA crate if the player starts picking it within the delay. That's rare, and the crate reopens, so it isn't counted. The engine alternative under P7 would cover it.

---

## 7. Dialogue implications

The changes are text in threads already written to the `README_ink_best_practices.md` rules: phone lines of 25 words or fewer, HaX unprefixed in her own thread, Torres unprefixed in his. P1's tier 1 adds one line, "Archives key things to the shelves.", which echoes Gary's "Archives key them to the shelf scheme." On the Gary branch that is deliberate (HaX picking up his framing). The dialogue phase can retune the wording. Spoken lines changed: **one** [r2], P3's phone:520 (voiced, `identity_scene.albion`): "His tapes are on the bench next door. When you want them." → "His tapes are on the bench in the tape room. When you want them." No m09 audio exists yet (no `tts_cache/m09*`), so it costs nothing now. P1, P2, P4, P5 and P6 are unvoiced (HaX's hub and texts, CONTRACT:96; Torres, erb:850; Gary, erb:871).

---

## 8. Pacing

- **Act breaks against depth.** [r1] The name usually fires at depth 5, but at depth 4 (the cage) for a player who fetches Nightshade's file after flag 3 (F3). Act 1 ends at depth 2 (flag 1, reading room). Act 2's hub is the restricted stacks at depth 3, with its turn (the Recruiter's call) fired on stepping out of the depth-4 cage (erb:379-384). Act 3's turn, the name, fires at depth 5, the deepest room (erb:277-281), and the rest of the act (the read, Tesseract's call, "[Bring me in.]") is calls, so the final act has no traversal. That's the right shape.
- **Returns.** The mission has four real walk-backs, each with a reason: cage → stamp → cage (the print); stacks → open stacks with flag 2's number (the H&L lid, optional); cage → reading room for the notebook scan (the hand, optional, already done by a player who read it in act 1); stacks → closet with the letters (Tran, optional). None is padding.
- **Empty room.** `staff_passage` has no scenario objects or NPCs (erb:1445-1458). It exists because a lock belongs to a room (erb:1436-1442), and dressing gave it a noticeboard, rota and hooks (ROOM_DRESSING.md:53; DRESSING_REVIEW_R4.md:64). It's walked through once, on route A. Not a finding (W5).
- **Act 2 density.** The critical path through act 2 runs through four different minigames (MIFARE key attack, dusting and the biometric reader, the cracker's Mastermind, then the card), plus the act's set piece (the Recruiter). Two of its doors open on story beats (the stacks on flag 1, the office on the deck). Both are announced and both are rewards for a beat the player has just played, so the act reads as earned rather than on rails.

---

## 9. Capability arc

| Mission | Grants | m09's use |
|---|---|---|
| m01 | Lockpicks | The dock office door (route A) and the BETA crate. By design |
| m02 | PIN cracker (rationed) | Re-issued with a story reason: Kowalczyk's own, handed over in the briefing (briefing.ink:317-331), so the night's one PIN lock is opened with WREN's tool ("Her cracker. Use it anyway.", erb:258). The safe is built for it (§3) |
| m03 | RFID cloner | Twice, easy then hard: Noor's EM4100 on route A, Sorensen's MIFARE custom keys at the hatch. Nightshade's call (triple-agent branch) adds the one tip only he can give: crack the keys first |
| m04 | Fingerprint kit | Her print off the stamp's grained handle, for the plan cabinet |
| m05–m08 | Evidence as leverage; the VM opening the physical path; checking a record | The letters on Tran; her file on Sorensen; flag 1 opening the stacks; the master schedule's missing tick against her house rule |
| **m09** | **No new tool class. A new technique: Vigenère**, met once with the key in the room (the salvage keypad) and once with the key to infer (the Alpha sheets, "Key: the series.") | — |

**For m10's planner** (no VM content):
1. The player has now decoded Vigenère with a given key and, on the Alpha-tapes route, with an inferred one. A Vigenère lock in m10 can expect the method and should make the key the hunt.
2. m10 imports `alpha_annotations_read` and `alpha_clip_played` (m10 erb:4130). The decoded line ("Carry it yourself. Let it hurt afterwards.") and the clip ("build your own way out first") are set-ups the m10 author can pay off. Today `alpha_annotations_read` means "read", not "decoded" (erb:314).
3. The PIN cracker is in m10's kit (m10 erb:1303). Its PIN locks (m10 erb:2862, 3934) should be designed knowing that, as m09's safe was.

---

## 10. Withdrawn and considered (don't re-propose)

- **W1. Move the shelf-marks chart away from the salvage keypad.** Considered and dropped. The chart belongs there (a staff reference beside the keypad it serves), and the ciphertext's long arc from flag 1 already supplies the hunt. Moving it would only add a walk. F1 fixes the real problem, which is the hint tier.
- **W2. Give the office door a findable code.** Dropped. The code "clerk-of-the-county" is written nowhere on purpose (erb:51), so the door is a story gate (S4 P11: a password, so the cracker can't skip it). The first try says so honestly (erb:157-158). Inventing a clue would only add a chain to match another mission's pattern (skill Step 3d).
- **W3. Let talking Sorensen down save the legacy box** (the lever needs her file, and picking the file up runs the clock, erb:209-210, sorensen_cage.ink:60-64). Considered and withdrawn as settled: "Only stopping her by force before the clock HaX names runs out saves them; talking her down gets her account of what she destroyed instead" (moral_choices.md:29, :43). HaX says it plainly in play (erb:203-204; phone:774-777).
- **W4. A non-Recruiter route from the shortlist to WREN's name.** Withdrawn as settled. Both names on the placing sheet carry the same tell (a parent in a nursing home, erb:1348; ledger "care fees, next of kin", erb:61) by design: the name is what the Recruiter sells (CONTRACT §3.1), and the closing card has a line for each state (erb:469-472).
- **W5. Put a readable in the empty staff passage** (e.g. the rota). Dropped. The room is a lock carrier forced by the engine, it's dressed, and a readable there would be decoration with no thread. Not a defect.
- **W6. The printed ledger's cipher rows aren't real Vigenère under the cage's bay word.** True (WATCHTOWER and BONEYARD both give noise), but unreachable as a problem. The cipher variant only shows before flag 2 (erb:1892-1899), and the player can't meet the house rule before flag 2, because the tape room sits behind the Recruiter's call, which waits on the ledger read. Nobody can try the rule on the binder in one run.
- **W7. Over-signposting of the print.** Counted: two automatic sources say what and where in turn (Sorensen's "Take the print if you like", hatch.ink:129; HaX's "She stamps everything", erb:211), and the rest are opt-in (hub topic 15, the status ladder, Victoria's topic). That's layered, not redundant.
- **W8. The hand comparison answers itself** (both observations name the looped g and the crossed seven, erb:1563, 1868-1870). It's a recognition beat that stage 8 m-04 scaffolded on purpose, it's optional (the identity scene completes it, phone:374), and it lands the story rather than testing anyone.
- **W9. "Safe's open. Kowalczyk will want to hear about her toy." fires even if the player typed the ledger's date.** Settled (SE R1 ruling 1, debrief.ink:76): the cracker is clamped on either way (its feedback is on by default, pin-minigame.js:229).
- **W10. LEWIS AND CLARK typed with spaces fails.** The CyberChef output has no spaces, and the keypad resets its tries when reopened. Not worth a change.

---

## 11. For the user (VM questions, not reasoned about here)

0. [r2] Can the H&L file number be read anywhere on the VM before flag 2 is submitted? If it can, a first-time player can open the box before flag 2, and P2's rings never fire for them. P7 then catches them.

1. Does any physical clue in the salvage cage (the property label "Issued to: Strategy Directorate", erb:2279; the enrolment binder) feed a VM step for flag 3? The game treats them as story only. If the VM expects the player to bring something from the room, HaX's flag-3 steer (phone:703-708) should say so at story level.
2. F9 (the built box, hostnames and flag values) is still open with you, unchanged from alignment.

---

## 12. Done when

- P1 and P2 are in the ink, compiled, with `tagdiff` showing text plus the VAR changes (P1's count, P2's synced `hl_box_opened` in Torres, P5's synced `salvage_opened` in Gary), the new text mappings and nothing else; dialoguelint clean; reopencheck for `agent_0x99` at 0 problems.
- CONTRACT updated: §2.1 row 5 (P1), §5.4 (P1's count replaces `keypad_topic_asked`), §5.3 and §6.2 (P2's global and mappings), §4.3 (P2, P5, P7), §6.2 (P6), and a §15 line for each; S6 §2.3 and S4 §7.1 row 5 recorded as superseded (P1).
- P2–P7 in place; validator (`--skip-ink --no-graph`) shows no new warning.
- Browser proof of R1 before and after P2 (AGENTS: fix claims need live proof): on `m05_torres_turned`, the right code (the container must stay open and Torres must play the shortlist arm); the wrong code then cancel; and the office-exit fallback (P7) without visiting the boxes. Also Gary with a first-try correct code; the file fetched after flag 3 on the alpha-tapes branch; and tell Noor before cloning, then try the staff door. [r2] On the turned branch with the box skipped, read every page in the safe: Torres must ring only on leaving the office.
- A short phase-5 playtest step: at the salvage keypad, ask HaX three times (tiers 1–3), and at the H&L boxes, open the lid's keypad and cancel with Torres turned (`m05_torres_turned`), checking his line.

Measured against m01_first_contact and m02_ransomed_trust. Reviewed: 3 rounds (see §13). Open at the end of round 3: 0 blockers, 0 majors, 0 minors in the plan. The defects F1–F7 remain in the game until P1–P7 are implemented.

---

## 13. Review log

| Round | Reviewer | Blocker | Major | Minor | Outcome |
|---|---|---|---|---|---|
| 1 | fresh general-purpose (Opus), read-only | 0 | 1 (R1) | 5 (R2–R6) | All accepted. R1's mechanism checked by me in npc-manager.js:611-628 and minigame-manager.js:58-70 (traced, not yet seen in a browser). P2 replaced; P3–P6 added; P1's contract scope corrected (R2). No §10 item reopened |

| 2 | fresh general-purpose (Opus), read-only | 0 | 0 | 2 (M1 → F7/P7; M2 → P4's wording) | Both accepted. M1's gap timing was checked by the reviewer in notes-minigame.js and container-minigame.js; its probability is an estimate. All 7 nits folded in (counts, §7 voiced line, P2/P3/P6 wording, the overlap-warning claim). F2's mechanism re-verified independently, and P2 confirmed on every path |
| 3 | fresh general-purpose (Opus), read-only, confirmation | 0 | 0 | 1 (M-1 → P5's wording) | Every round-1 and round-2 finding confirmed closed. P1–P7 checked for conflicts (none). `room_exited` carries `roomId` (rooms.js:3029-3032), so P7's condition holds. M-1 and nits N1–N5 folded in (P6's full condition, stale counts and wording, contract list, P1's count wording, "It's Vigenère." in ask 2). The reviewer judged a short P5 check enough, not a fourth full round |

The reviewer's nit on "the knot's visit count" was folded into P1's counter note. Its note that "Her office is past the binders" (phone:295) is too vague to call stale is agreed: not counted.
