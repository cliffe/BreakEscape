# m10 Full Disclosure: scenario design review, round 2

2026-10-22. Fresh reviewer (Opus, read-only on game files). Phase 3 of the AGENTS.md five-phase loop, round 2. Tree at 87dbe9db (dialogue R1, educational R1 and scenario design R1 fixes); the only m10 change since is the untracked `PUZZLE_CHAINS_PLAN.md`. Dialogue round 2 and a puzzle-chain reviewer are reading m10 in parallel, so I've left wording to them unless it changes what the player can do or know.

**Method.**
- **Validator.** `ruby scripts/validate_scenario.rb scenarios/m10_full_disclosure/scenario.json.erb --no-graph`, exit 0. Output in the session scratchpad under `m10_sdr2/validator.txt`.
- **Reading.** The commit's ERB and ink diff in full. Tesseract (lines 1-720), HaX's phone hub, topics, whodunit, console and cut call. The Netherton briefing, aside and tether. Nightshade's table branches. The power room, the core, the phone contacts, the objectives and the field-guide, isolator, T-59 and T-60 mappings.
- **Engine.** Two paths. Contact filtering is in `phone-chat-ui.js:387-412`: anything in `npcIds`, plus any NPC with conversation history. Bark dispatch is in `npc-manager.js:1198-1224`, and it doesn't check whether the barking NPC is visible.
- **Not opened.** No VM plan, SecGen file or field guide. I did no browser run.

**Counts: 0 blockers, 1 major, 4 minors, 4 nits.**

**Verdict.** R1's five findings are closed, and the ending now has a clean exit. The new major is in that same fix: HaX's single loose-end line checks WREN and the sheet but not the open backdoor. The backdoor is the one loose end that puts a loss in the credits ("Seattle's first batch went out through the backdoor…"). The four minors:
- a text that fires during the briefing on m09 "taken" saves;
- the alibi task ticking at the table, before 02:10 has happened;
- Wendell barking from a room he isn't in;
- the cold start's first decision, which needs a second talk with Netherton straight after he has stopped talking.

---

## Part 1: R1's findings

| R1 | Fix | Verdict |
|---|---|---|
| **M1** ending warning | `m10_tesseract.ink:228-248` | **Closed, but the fix has a gap (M1 below).** The warning plays once (`tess_warned`). "[Not yet. I want to finish something.]" sets `tess_quiet`, exits to `parked` and writes no story global. A re-talk goes `parked` → `core_router` → `case` and replays "All four. Good." without the warning, with the three buttons again. Nothing pulls the player back: the flag-4 mapping fires once on the change (erb:4013), `room_entered:core` needs `!core_greeted`, and the closing scenes need `ending !== ''` (erb:2332, 2373). Every door behind them is open, so the player really can walk back to the hall, the workshop or the office. HaX's hub still shows "[I know who WREN is.]" until `wren_at_core`, and `accuse_right` handles a naming at the core (Quintero holds her, or "You'll meet her there."). Reading the sheet after "Not yet" changes exchange 1's slot 2, so going back for it pays off. |
| **m1** field guides offered silently | erb:1625-1628 | **Closed.** One HaX text per guide, with skips on given and submitted. Guide 1 waits 20 s. The split line and Arakawa's call add up to about seven lines, so 20 s may still overlap the call (toast timing; out of scope, browser check 3). |
| **m2** contacts empty all night | erb:1305 `"npcIds": ["agent_0x99"]` | **Closed on reading.** The handset's mapping opens Ghost's call by id (erb:2259), so it doesn't depend on the list, and the lines it plays write history (`phone-chat-minigame.js:830`), which puts Ghost in the list afterwards. The same holds for Victoria's, Vance's and Elena's rings. Browser check still owed. |
| **m3** isolator click | erb:1704, 2294, 2312, 3243, 3304 | **Closed for the by-hand and escaped branches. New bug on the captured branch (m3 below).** |
| **m4** sheet-gated rebuttal | `m10_tesseract.ink:509-527` | **Closed.** A reader gets the correction rebuttal, a decoder gets Asante's form, and a non-reader gets the decoy "[Nobody can know a number like that.]" → miss. Exchanges 2 and 3 still give a non-reader two rebuttals they can land. |
| n1 power-room repeat | phone.ink:228-231 | Closed; validator warning 42 has gone. |
| n2 console and vault topics | phone.ink:78-79 | Closed (`not flag4_heard`). |
| n3 "Report at the forward post" | erb:1453 | Closed, but the aim description beside it still says "Then the forward post at six." (n3 below). |
| n4 hall and workshop cones | erb:3095, 3475 | Closed. The duty guard's cone is still hidden (n4 below). |

---

## Part 2: the skill, run again

### Step 1: validator

- **❌ INVALID:** none. The ERB, JSON, schema and inks all pass, the room layout has no overlaps, and the doors line up.
- **⚠️ WARNING:** the same known set as R1, minus the power-room text repeat:
  - 2 objective-wiring overlaps (`aside_done`, and `room_entered:blast_tunnel`, which is exclusive by `mutuallyExclusiveGlobals`);
  - 19 cutscenes guarded by done-globals;
  - the gallery AND gate (a false positive);
  - 5 story doors or lockpick-only locks;
  - the 2 door-log text repeats (the topic shows only to a player who missed the texts);
  - the `lock_guard` false positive;
  - the false positive on the tunnel's 2 s texts;
  - 31 import conditions, each with a default on a cold start;
  - 4 hidden prefix speakers.
- **Dialogue lint, 9:** 5 blank-reentry on the disableClose closing scenes, 2 crowded-hub (on paper), 1 "gray" in Elena's lines, and 1 not-x-but-y (`m10_tesseract.ink:462`). These belong to the dialogue round.
- **💡 SUGGESTION:** the two unlocked VM rooms are by design, and the override and code-card onPickup suggestions are intended, as in R1.

### 2a. Solvability: OK

R1's cold-start trace still holds. The commit's new mappings add no gate. "Not yet" writes nothing, the isolator mappings only open existing calls, and `npcIds` affects only the list. No lock's key sits behind its own lock, and every required story task still has its `game_loaded` catch-up (erb:1781-1786).

### 2b. Clues: OK

The commit's additions sit where the player meets the thing they explain:
- "A door log proves a card was there. Not who held it." is on the door log.
- The 24 orders are on the dusted plate.
- The Base64 rung comes 30 s after the sheet is read.
- Badge reissue is in the Citadel file.
- The supply-chain line follows Kowalczyk's bench answer.

T-59 is the exception (m1).

### 2c. Educational coverage: OK

The definition of full disclosure, the equities schedule, hoard, coordinate or burn, the casualty sheet that counts recovery twice, and now what a badge read proves and the PIN keyspace. The two concept steers (`monitor_topic`, `box_topic`) name the class of weakness and nothing more. The CyBOK block passes the checker.

### 2c′. Field guides: OK (labUrl still owed, as R1 said)

### 2d. Narrative: CONCERN (M1, m4)

**The opening ten minutes.** Briefing → aside → the table or the van → gate console → split → Arakawa → flag 1 → breach.
- It's dialogue-heavy, which a finale can carry. Every choice there writes a stance that pays off later: Quintero's objection, the tether, Nightshade in or out.
- On the cold start, the commonest save for a student meeting the mission alone, there's one stumble (m4).

**The split.** Two lines, then Arakawa's thirty seconds. It's short and well placed, because it's the evidence: the player watches two of the suspects walk into the tunnel, then stands beside the third while he calls his daughter.

**Between the flags.** Flag 1 is at the gate. Then comes the long physical run: tunnel, office, workshop, power room. Flags 2 and 3 are in the same hall, and flag 4 is at the core. The run between 1 and 2 has the most texture (Ghost, the sheet, the bench log, the shutter). 2 and 3 back to back is a VM pacing question for the user (R1 VM item 4), not a design fault.

**The ending.** It now has its warning and its exit. What's left is what the warning says (M1).

### 2d′. Ink conventions: OK

### 2d″. Patrols: OK, one nit (n4)

### 2e. Graph metadata: OK, unchanged

### 2f. Rooms: OK

The walk back after "Not yet" is open the whole way. That's core → gallery → stair → hall for the backdoor console, and further back to the workshop for the sheet.

### 2g. Scaffolding

R1's table stands. The changes:
- `close_the_night` is now titled "Close the night".
- End It's description still promises the forward post (n3).
- Find The Sleeper's "Work out who nobody could see at ten past two" can tick before ten past two (m2).

### 2h. Knock-out resilience: OK, unchanged

### 2i. Recurring classes

- **Credits against every route.** The backdoor's credit line is reachable without a warning at the last decision point (M1).
- **A text that arrives before its context.** T-59 on taken saves (m1).
- **Whodunit fairness.** It's still fair, and it can't be skipped or forced. Four clues reach one answer, Kowalczyk is neither first nor last in the menu, and a wrong name costs an officer without blocking anything. One weakness: on every save where Nightshade talks (shown, unshown or arrested) or m09 left a shortlist, HaX never lays out the alibi. Her "[Who was where at ten past?]" needs `not clue_alibi`, and Nightshade's general hint has already set it (m2). The evidence is still there, because the player witnessed the split, and Malhotra and Kowalczyk both say "ten past". But the clearest narrowing step is missing on those saves.
- **A late first contact.** With only HaX listed, every other contact first appears by ringing. That's fine.

---

## Findings

### Major

**M1. The ending warning names WREN and the sheet, but not the open backdoor, which is the one loose end that costs lives.** Files and lines:
- `m10_tesseract.ink:234-239` (HaX's loose-end line);
- `:894-901` (`console_stop` sets `partial_release` "small" or "large" when `backdoor_channel_live and not backdoor_closed`);
- `scenario.json.erb:809-810` (the credit lines "Seattle's first batch went out through the backdoor, into fourteen/forty-seven million systems.").

On every m07 save except trojan_horse, the backdoor channel is live (erb:1568-1569). Closing it takes one free action at the release console (phone.ink:613-631). The player gets three pointers:
- an optional task;
- HaX's "What's still live?" topic;
- the console's own "His backdoor's still open."

A player who killed or traced a share and pressed "[Leave it for now.]" reaches the core with it still open. The new warning then says "We still haven't named WREN" or "You never read his sheet". Both are cheaper than the backdoor, and neither changes the death toll. After "Stop it", the batch goes out and the credits record it. This is the case the ending rule exists for: the last chance to see to something, and the line that should name it names something else. It hits exactly the player the user's priority cares about, the one whose m07 decision should land.

There's a smaller gap in the same line: "We still haven't named WREN." fires without `clue_door_log`, but HaX's "[I know who WREN is.]" needs `clue_door_log` (phone.ink:89). A player who never read the door log is told to name someone and offered no way to do it.

**Fix (one HaX line, first that holds; still at most one):**
1. `backdoor_channel_live and not backdoor_closed` → "His backdoor's still open. The console in the hall closes it."
2. The WREN condition as now, and `clue_door_log` → "We still haven't named WREN."
3. The WREN condition, and `not clue_door_log` → "We never read the office's door log."
4. `not casualty_sheet_read` → the sheet line (see n2 for its wording).

Voiced delta: HaX +2. Browser check: on an m07 save, leave the backdoor open, then "Not yet", walk to the hall, close it, re-talk, and "Stop it" sets `partial_release` to "none".

### Minor

**m1. T-59 fires during the briefing on m09 "taken" saves.** `scenario.json.erb:1824`, with erb:1563.

On a taken save, `game_loaded` sets `sleeper_caught` (erb:1563). T-59 listens for that change, with only `!outer_lock_open && !hax_jammed`. So about 6 s after load, while the disableClose briefing is running, the player gets "Her cracker came off his bench. I wouldn't trust it at his door. The keys' wear and the rota will get you in." At that point there's no bench, no door, no keypad and no rota in the player's world. The lesson lands an hour too early and reads as a stray.

**Fix:** require the context. Add `&& globalVars.workshop_entered === true` (the bench is where "his bench" means something) and a twin mapping on `room_entered:server_hall` with `sleeper_caught && !outer_lock_open && !hax_jammed`, onceOnly, so a taken save hears it before the gallery jam. It's unvoiced.

**m2. "Work out who nobody could see at ten past two" ticks at the table at a quarter to two, and HaX's alibi breakdown never shows on those saves.** Files and lines:
- `m10_nightshade.ink:84, 163, 275`, all set `clue_alibi`;
- `scenario.json.erb:1576` (the m09 shortlist sets it too) and `:1797` (`clue_alibi` completes `check_the_alibis`);
- `m10_phone_agent0x99.ink:97` (the "[Who was where at ten past?]" topic needs `not clue_alibi`).

Nightshade's line ("They always borrow a badge… Look for whoever went where nobody watches.") is a method, not an alibi. On the shown, unshown and arrested branches it ticks the alibi task before the split has happened. A player would see the objective tick at the table and wonder what they had worked out. The same flag also hides the HaX topic that lays the night out ("Arakawa was at the gate with you… I had Malhotra… So who wasn't where somebody could see them?"). On those saves, the third clue rests on the player remembering the split line and placing Arakawa's call at 02:10, and no line in the call gives the time.

**Fix:**
- Give Nightshade's line its own global (`ns_borrow_hint`) and keep `clue_alibi` for HaX's topic.
- Gate that topic on `clue_door_log and door_log_given and not clue_alibi` as now, which then shows on every branch.
- Keep `clue_alibi` on the m09 shortlist (erb:1576) if the stage-8 ruling wants it, but move the task completion there to fire only once `clue_door_log` is also true.
- The recalls' `clue_alibi` gates stay.
- Optional: add a `Narrator:` "Ten past two." line to Arakawa's call (`m10_arakawa.ink:80`), which costs one narrator clip.

**m3. On the captured-Voltage branch, clicking the isolator gets a bark from Wendell, who isn't there.** `scenario.json.erb:3243`.

The bark's condition is `!m04_voltage_escaped && …`, which includes `m04_voltage_captured`. On that branch Wendell stays hidden (his reveal needs `!m04_voltage_captured`, erb:3245), and the shutter is captured Voltage's to cut. Barks don't check visibility (`npc-manager.js:1198-1224`). So the player gets a toast reading "Wendell Briggs: Hands off my panel. Ask, if you want a breaker." from someone who isn't there, then looks for him.

**Fix:**
- Add `&& !globalVars.m04_voltage_captured` to that bark.
- Optionally give `voltage_power_captured` its own isolator bark, from an existing line if one fits (for example, his "talk to me" pointer), so the click still answers. It's unvoiced if you reuse a line.

**m4. On the cold start, the first decision needs a second talk with Netherton straight after he stops talking.** `m10_director_netherton.ink:288-295` (`aside_end`, silent branch); `:46-47` (the router sends a re-talk to `tether`).

On the silent branch (every save without m08's triple agent, which includes the cold start), the aside ends with HaX saying "Nightshade's in the van. Netherton has a question about him." Then the conversation exits. Netherton has the question but doesn't ask it. The player has to close the chat and click Netherton again. There's no bark or text telling them to (the 8 s text, erb:1615, points to the gate console instead). This is the first minute of play, and a student is likely to walk off to the console and only reach the tether when the blast door barks "Netherton won't call it till the table's settled."

**Fix:** on `door_branch() == "silent"`, have `aside_end` divert straight to `tether` instead of exiting. The tether already offers both answers, and the menu can take a third, "[Let me think about it.]", exiting to `hub`, for a player who wants the console first. Then change HaX's line to "Nightshade's in the van." No new voiced lines, unless the third button gets a reply (Netherton +1).

### Nits

- **n1. "I'll keep." twice in a row.** `m10_tesseract.ink:233` ends "…go. I'll keep.", and the "Not yet" reply at `:245` is "I'll keep." again, so on the first pass they come back to back. **Fix:** a different reply, for example "Dr Adrian Tesseract: Go on. I'm not going anywhere." (Dialogue R2 may own this.)
- **n2. "It's on the bench upstairs" points the wrong way.** `m10_tesseract.ink:238`. The workshops are on the lower level (erb:226-227, "Stair B down"), and the core is past the gallery stair. **Fix:** "It's on the workshop bench."
- **n3. End It's description still promises the forward post.** `scenario.json.erb:1441`: "…Then the forward post at six." That's wrong on Join (the Citadel) and on the hearing ending. R1 n3 fixed only the task title. **Fix:** cut the last sentence, or "Then the night closes."
- **n4. The duty guard's cone is hidden.** `scenario.json.erb:2755` (`visualize: false`). His eye is the fitter's locker's designed risk (`lockpick_used_in_view`, erb:2760), and the player can't see when they're in it. The other guards' cones were made visible under R1 n4. **Fix:** `visualize: true`.

---

## Prioritised action list

**Must fix:** none.

**Should fix**
1. M1: HaX's loose-end line checks the backdoor first, and the WREN line checks the door log.
2. m1: T-59 waits until the bench has been seen.
3. m2: Nightshade's hint gets its own global; the alibi task and HaX's topic follow the door log.
4. m3: Wendell's isolator bark excludes the captured branch.
5. m4: the silent branch's aside runs straight into the tether.

**Worth considering:** n1 to n4.

## Top five

1. **M1.** The ending warning skips the open backdoor. That's the one loose end with a credit line of 14 or 47 million systems, and it can still be fixed after "Not yet".
2. **m2.** On every save where Nightshade talks, the alibi objective ticks at the table before 02:10, and HaX's alibi breakdown never shows.
3. **m4.** On the cold start, the tether question needs a second unprompted talk with Netherton straight after he has stopped talking.
4. **m1.** T-59 ("Her cracker came off his bench…") arrives during the briefing on m09 taken saves.
5. **m3.** Captured-Voltage saves get a "Hands off my panel" bark from an absent Wendell.

## For the user

- R1's VM questions 1, 2 and 4 still stand (early reach to later hosts, flag 3's in-world effect, timing). Question 3 is answered in the ink: the notice lines no longer claim it's on his box.
- The closing card's teaser is still off (`teaser_enabled: false`). That's yours to rule on (F11).

## Out of scope (engine timing; uncounted)

- Guide 1's 20 s text and other toasts may land over a forced call (timing).

## Browser checks owed (not findings)

1. "Not yet" exits cleanly. A re-talk resumes at "All four." with no warning. Naming WREN on the phone after "Not yet" gives the held-WREN beat. Reading the sheet after "Not yet" changes slot 2.
2. On a cold start, the duty handset opens Ghost's call with only HaX listed, and Ghost stays in the list afterwards. The same for Vance, Elena and Victoria on their saves.
3. Guide 1's text against the split and Arakawa's call.
4. The isolator: Wendell's bark (default branch), Voltage's bark (escaped), the cut call (by hand), and nothing from Wendell on captured.
5. After the M1 fix: close the backdoor after "Not yet", and "Stop it" gives `partial_release` "none" with no Seattle credit line.
