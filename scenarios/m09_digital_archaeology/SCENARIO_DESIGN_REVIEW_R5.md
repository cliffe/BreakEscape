# m09 Digital Archaeology: scenario design review, round 5

2026-10-22. Fresh reviewer (Opus, read-only on game files). This is phase 3 of the AGENTS.md five-phase loop, round 5. Part 1 checks R4's findings and the fixes for them. Part 2 runs `.claude/skills/scenario-design-review/SKILL.md` again on the whole mission. I didn't reopen rulings settled in CONTRACT.md or earlier rounds. From this round on, the user's rule applies: a round with no blockers and no majors closes the phase. So I graded a finding minor only if a player would notice it, and anything smaller is a nit.

**Commits.** R4's fixes are e86f0583. Dialogue round 3's fixes landed while I worked, as 13b46379 ("Netherton's send reply, texts that show not tell, Albion line, schedule not rota, plan cabinet, nits"). I read its diff before it was committed and checked the commit again afterwards. Its edits replace lines one for one, so line numbers below are the same at both commits. Where it changed a line this review discusses, I say so. The working tree was clean for m09 when I finished, apart from this file.

**Method.** I ran the validator in full with the graph (the graph files came out unchanged; 0 INVALID at both commits), `dialoguelint`, and a recompile with `bin/inklecate`, written to my scratch folder, of every ink either commit touched in the areas I reviewed (HaX, the Recruiter, Tran, the debrief). All four match the committed JSON at 13b46379. I read the R4 diff, the whole HaX ink, the Recruiter, Tran, Torres, the debrief's notice, WREN and Recruiter sections, every ERB mapping, the objectives and the credits. I also read `npc-manager.js` `_scheduleDelayedMapping` and `_mappingWouldFire`, which decide how the new ring (c) delay behaves. I opened no VM plan, SecGen file or field guide, and ran no browser.

**Counts: 0 blockers, 0 majors, 1 minor, 2 nits.** All five R4 minors and all four R4 nits are resolved. The one new minor comes from the R4 m3 fix: with ring (b) gone, one status row is now reachable from the wrong room.

**Verdict.** The R4 fixes work. The Recruiter's offer now lands after the player has taken a few steps, on both orders, and HaX's pointer to the H&L boxes now leads into the call. On the stacks-first route a player who reads the placing sheet in those 15 seconds hears the new coin-toss line, so the R4 m4 fix pays off more often than R4 expected. What's left is one stale status line and two small wording points.

---

## Part 1: R4 findings

| R4 | Status | Evidence (e86f0583; unchanged lines at 13b46379) |
|---|---|---|
| m1 "inquiry" on routes without one | **Resolved** | phone:697-702, split as the `albion` stitch (`full or m04_crew_lost`); debrief:136-141 already split the same way |
| m2 chart rule reads as the code | **Resolved** | erb:2243 "each keypad's code is keyed to its own bay's word"; agrees with keypad tier 1 "Archives key things to the shelves" and tier 2 "The key is the salvage bay's word" |
| m3 three calls back to back | **Resolved** (one consequence, see m1 below) | ring (b) removed; ring (c) `delayMs` 15000 (erb:409-410) |
| m4 offer ignores the shortlist | **Resolved** | recruiter:135-137, :219-224; phone:351-356; B1 and A1 strings identical |
| m5 nobody says what's on the tapes | **Resolved** | phone:843; console erb:1461-1463; credit erb:564 |
| n1 guard's log | **Resolved** | erb:1085 "NOT ON THE ROTA" (dialogue R3 made it "NOT ON THE SCHEDULE", which also works) |
| n2 "money" in A3-38 | **Resolved** | erb:362 |
| n3 A3-37 and the guide text 2 s apart | **Resolved** | erb:281: delay 2000 plus `msg_delay` 6000, so A3-37 lands about 8 s after the gate opens and about 6 s after the guide text on entry |
| n4 Tomb Beta not named when sent | **Resolved** | phone:960 |

### The inquiry gate

The notice topic now says "inquiry" only on `m04_disclosure_choice == "full" or m04_crew_lost`, the same condition the `albion` stitch (phone:512-545) and the debrief use. At e86f0583 the other arm (phone:701) read "What you said about Albion was about what happened." On the quiet route HaX has already said "You kept Albion quiet", so "what you said" jarred a little. Dialogue R3 (13b46379) replaced it with "Albion's report was about what happened.", which is true on the partial and the quiet routes (the briefing's m04 card: "The report said maintenance fault"). Nothing more to do.

### The chart rule

"House rule: each keypad's code is keyed to its own bay's word." This no longer invites typing BONEYARD. "Keyed" is the word HaX's tier 1 and Gary use, and A3-37 ("She hung the key beside the lock") now pays off something the chart actually says. The office keypad doesn't follow the rule (its code is written nowhere), but the player is told to leave that door and never types into it.

### The Recruiter's ring pacing

I checked how the engine handles the delay before judging the routes. `_scheduleDelayedMapping` (npc-manager.js:610-630) checks the condition when the event fires, so nothing is scheduled unless the ledger is read, the cage is open and the player is outside it. It doesn't use up `onceOnly` until the call actually fires. It ignores repeat events while a call is pending. When the delay is up while any minigame is open (a call, a lock, the VM), it waits. When it fires it checks the condition again. If the player has stepped into the cage in those 15 s, `!in_cage` fails, nothing is used up, and ring (a) takes over on the way out.

**Stacks first (the order HaX recommends: cage before flag 2).** Flag 2 is submitted at the drop terminal. The ledger read rings 2.5 s after the VM closes. Six seconds after its first line, HaX texts "Harwick & Lowe's boxes are in the open stacks, by their bay label. The lid takes that file number." (erb:392-393). That text can't be skipped on this route, because the file number only exists after flag 2. The player walks into the open stacks, which schedules ring (c), and the Recruiter rings 15 s later, usually at the H&L bay. If they're typing the lid's file number, the call waits for the lock to close. If they read the placing sheet first, they hear the new coin-toss line. That's a good moment: they have just been handed a clue, walked to it, and the offer meets them there. `afterwards` still follows 2.5 s after the deck choice, but the player is now on their feet, and the loss lines right after the choice are the right place for them. The problem on this route is the gap before the walk (m1).

**Flag 2 first (cage after flag 2).** I took the brief's "tape-first" to mean this order. Ring (c) can't schedule before `cage_opened`. The gate opens while the player is still in the restricted stacks, and that raises no `room_entered`. Their next entry is the cage, which ring (c) skips. Ring (a) fires 3 s after they walk out. That's unchanged from R4, which said this order already played well. Victoria's route opens the gate remotely, so a player who then walks somewhere other than the cage gets ring (c) 15 s after that room entry. Either way the call doesn't land inside the cage.

**Reloads.** A reload fires `room_entered`, so ring (c) schedules 15 s after load. `in_cage` is cleared on `game_loaded` and set again on a cage entry. No soft lock: if the player never leaves a room the call never rings, but nothing else is waiting on it, and walking is enough to trigger it.

### The shortlist-aware lines

Both strings are right on every route that reaches them. The H&L sheet names "H. Kowalczyk; M. Quintero" with a parent in a nursing home each, and the printed ledger says only "care fees, next of kin". So "a coin toss" is accurate. Nothing in the game tells the two apart without the Recruiter's name, which is the point of her offer. On the her-file branch, "WREN's still one of the two on that firm's sheet." follows "First name on it is a handler in Baltimore." and reads correctly. Dialogue R3 (13b46379) moved the coin-toss line to after "I can't see which tape you pull…", so the Recruiter finishes her terms before HaX speaks. That's a better order. `sleeper_shortlist` is declared in the Recruiter ink (recruiter:15) and is a scenario global (erb:2477).

### The tapes line and the console

"Those reels are her recruiting interviews. The legacy names, in their own voices, saying yes." sits under the `tran_topic_heard` guard, so it's said once, with the first ask. The console's "legacy recruitment interviews" in both variants agrees with Tran's "Interviews. Old ones, on reels." and with the stage 3 source ("the Initiative's legacy recruitment interviews… never the deck"). The credit "The tape side: 97 of 212 reels kept. Analysis is listening." now tells the player what they saved. One small wording point remains (n2).

### The four nits

All are as described in the table. The status row at phone:960 now names both reasons for the office in one line.

---

## Part 2: the skill, run again

### Step 1: validator

**❌ INVALID.** None.

**⚠️ WARNING.** All known or ruled on: 13 onceOnly-overlap warnings on `agent_0x99` and one on `recruiter` (`room_exited`, ring (a) beside the `in_cage` setter, intended); the biometric `unlock_object`; four cutscenes without `onceOnly`, all deliberate; the salvage AND gate (the known `puzzle_graph_and_with` false positive); the office's missing `puzzle_graph_unlocks` (HaX's `unlockDoor`); two no-credential locks (`stacks_release`, opened by HaX; `beta_crate`, picks only). There's one fewer `recruiter` overlap than before, because ring (b) has gone. Dialogue lint: 5 `not-x-but-y` and 1 `you-after-choice`, all previously allowed. Phone lines max 25 words.

**✅ GOOD PRACTICE.** Event-driven cutscenes, `globalVarOnKO`, `skipIfGlobal`, music by phase, configured hostiles, puzzle-graph metadata.

**💡 SUGGESTION.** None apply.

**Graph.** Puzzle 64/71, Story 6/5, Integrated 70/86, Rooms 11/11. Critical path: Get In → Read The Initiative's Ledger → Take Tomb Beta's Server → Report To Netherton. Geometry OK.

### Step 2: design review

**2a Solvability: OK.** R4's commit changes no lock, gate or required task. The Recruiter's call still can't be missed: ring (c) waits for a room entry outside the cage, ring (a) catches a player leaving the cage, the re-rings and `deck_resume` are unchanged, and `answer_the_offer` still unlocks on the call's first line. The win condition is still four flags plus HaX's button, and no knock-out can block it.

**2b Clues: OK.** The salvage chain is now clean from end to end: the coded line at flag 1, A3-42 at the tape room, the chart's "keyed to its own bay's word", the three keypad tiers, and A3-37 afterwards. The H&L cross-reference has a pointer on every route (the text, the hub's "[WREN.]", Torres on the turned branch, the confirm), and it now pays off inside the Recruiter's call.

**2c Education: OK.** The tapes line gives the optional Tran fight a stake. The coin-toss line turns the insider-threat lesson (pick people with someone to lose, read the next of kin) into a decision: the player can see what the Recruiter's name is worth before deciding. The notice topic now keeps incident disclosure (m04) and vulnerability disclosure apart on every m04 route.

**2c′ Field guides: OK.** Placeholder `labUrl`s until the lab-sheet stage, as ruled.

**2d Narrative: OK.** Every act transition has a spoken handoff. The Act 2 turn now gives the player a walk between the ledger and the offer.

**2d′ Ink conventions: OK.** **2d″ Patrol: OK.** **2e Graph: OK.** **2f Rooms: OK.** All unchanged.

### 2g Scaffolding

| Aim | Required tasks | With an in-world pointer | Dead-zone risk | Call or text at the transition |
|---|---|---|---|---|
| Get In And Set Up The Drop Terminal | 3 | 3 by voice | none | `flag1_read` |
| Find The Restricted Series | 5 | 5 | none | alongside |
| Read The Initiative's Ledger | 2 | 2 | **low, stacks first only** (m1) | ledger read, the H&L text, then the Recruiter after a walk |
| Search The Director's Office | 5 | 5 | none | the Recruiter's close, `afterwards` |
| Take Tomb Beta's Server | 6 | 6 (Tomb Beta named at flag 1, in the safe status row and at the tape room) | none | identity scene, hour read, Tesseract's call |
| Report To Netherton | 1 | 1 | none | `bring_in_confirm`, then the debrief |

Between the ledger read and the Recruiter's call, the objectives panel shows no required task: `answer_the_offer` is still locked, and the only open task is the optional cross-reference. That's by design (the call is a surprise), and the H&L text gives the player somewhere to go. The handler's status answer should agree with it, and on one route it doesn't (m1).

### 2h KO: OK

Unchanged from R1's table.

### 2i Recurring bugs

- **Status answers.** I walked the ladder at each stage on both orders. Every row is right except `flag2_submitted and cage_opened` on the stacks-first route (m1).
- **Credits and debrief against every route.** True on all routes, including the new tape-side clause and the WREN lines on the her-file branch with and without the shortlist.
- **Spoilers in names.** None new. The coin-toss line names no one.
- **Hub ordering.** Unchanged and fine.
- **Late first contact.** Unchanged.

---

## Findings

### Minor

**m1. With ring (b) gone, the stacks-first player in the reading room is told to "Step out of the cage."** `m09_phone_agent0x99.ink:961-962` (status row `flag2_submitted and cage_opened`).

Before R4, ring (b) rang the Recruiter as the ledger read closed, so on the stacks-first route this row could hardly be seen. Now the call waits for a room entry outside the cage. Between the ledger read and the player's first step out of the reading room, the panel shows no required task, so "Where do I stand?" is where a player goes to find out what's next. HaX answers "Step out of the cage. Someone's been waiting for you to come up for air." The player is standing at the drop terminal, nowhere near the cage. A player who follows the advice walks to the cage, and once they're in it the 15 s ring is held back. The call then comes on the way out by ring (a), so this costs time and trust rather than progress. On the other order the line is right (the player really is in the cage), and that's the only case it was written for.

**Fix (unvoiced, one row).** Declare `VAR in_cage = false` in the HaX ink (it's already a scenario global, erb:2507) and split the line:
```
- flag2_submitted and cage_opened:
    {in_cage:
        Step out of the cage. Someone's been waiting for you to come up for air.
    - else:
        Keep moving. Someone's been waiting for you to come up for air.
    }
```
"Keep moving" is true on the stacks-first route, because any room entry outside the cage starts the 15 s. Update the ink comment at phone:228 at the same time (n1).

### Nits

**n1. Ring (b) is still described in two places.** The HaX ink comment at phone:228 ("the Recruiter's ring (b) and the room-entry backstop key on it") and S4 §4 row 3 and its §5 globals row (`planning_notes/.../m09_digital_archaeology/stages/stage_4/objectives_tasks.md:161, :207`) still describe ring (b), and ring (c) with no delay. CONTRACT §6.2 was updated, and R4 asked for S4 §6.1's ring list too. **Fix:** in the phone:228 comment, write "ring (a) and ring (c)". In S4 row 3, drop (b), give (c) "`delayMs: 15000` (scenario design R4 m3)", and in the `in_cage` row change "(a), (b) and (c)" to "(a) and (c)".

**n2. "Her recruiting interviews" has no "her" to point at.** phone:843. In the topic, the line follows the Tran warning and "He's wiping tapes from the server closet…". A player who asks after the Recruiter's call has just heard about "my tape deck" and "her file", so "her" reads as the Recruiter. Then the two wipes, Tran's reels and her deck, run together, and the credits keep them apart ("The tape side" and "The deck"). **Fix (unvoiced):** "Those reels are the Initiative's recruiting interviews. The legacy names, in their own voices, saying yes." That matches the stage 3 source word for word.

---

## Prioritised action list

**Must fix:** none.

**Should fix**
1. m1: split the `flag2_submitted and cage_opened` status row on `in_cage` (phone:961-962).

**Worth considering:** n1 (stale ring (b) references), n2 ("the Initiative's").

## Top five

There are only three findings this round.

1. **m1.** With ring (b) gone, the stacks-first player in the reading room asks "Where do I stand?" and is told to step out of a cage they aren't in.
2. **n2.** "Her recruiting interviews" reads as the Recruiter's, which blurs Tran's reels into her deck.
3. **n1.** The ink comment and S4's ring list still describe ring (b).

## Browser checks owed (carried, not findings)

1. The Alpha deck host's name and portrait before the identity scene (R1 check 1).
2. The confirm knot: both buttons, a close with the confirm showing, a reload on it, and the four-line maximum on a phone-width screen.
3. Sorensen's auto-open on a first meeting with the file in hand.
4. R4 check 4, made specific: on the stacks-first route, the Recruiter rings about 15 s after the player enters the open stacks; if they're in the H&L lid's password lock, she rings after it closes; with the sheet read, the coin-toss line plays.

## Out of scope (engine track; uncounted)

- Delayed calls queue behind any open minigame, and the reload order of `in_cage` is still on the engine track (R3).

Verdict: phase closes
