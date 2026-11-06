# m09 Digital Archaeology: scenario design review, round 4

2026-10-22. Fresh reviewer (Opus, read-only on game files). Phase 3 of the AGENTS.md five-phase loop, round 4. Part 1 checks R3's findings and the fixes for them. Part 2 runs `.claude/skills/scenario-design-review/SKILL.md` again, aimed at what earlier rounds covered least: the loop in each room, dead time, how optional content is signposted, whether the player knows why the next thing matters, and whether the educational additions read as part of the world. I didn't reopen rulings settled in CONTRACT.md or earlier rounds.

**Commits.** R3's fixes landed in e20cb0b0 ("educational round 1 and scenario design round 3 fixes"). A dialogue round 2 commit, fc26a4bb, landed four minutes later and rewords some of the same lines (the first-job line, the Tomb Beta line, the leaver line, the safe text). I reviewed HEAD at fc26a4bb, and line numbers below are from that commit. The working tree was clean for m09 when I finished.

**Method.** Validator (full, with graph; the graph files came out unchanged), `dialoguelint`, `reopencheck` on m09, and a recompile with `bin/inklecate` of every ink touched by either commit (HaX, briefing, debrief, Gary, the hatch, the door, Tran, Old Coyote). Each recompiled file matches the committed JSON. I read both diffs, the whole HaX ink, the Recruiter, Noor, the hatch, the cage, the door, Tran, Old Coyote, Nightshade, Torres, the Alpha clip, the briefing, the debrief, the credits text, and the ERB's mappings, objectives and every room. I opened no VM plan, SecGen file or field guide, and ran no browser. Scratch is in the session scratchpad under `r4_m09/`.

**Counts: 0 blockers, 0 majors, 5 minors, 4 nits.** All five R3 findings are resolved. Two of the new minors were introduced by this round's educational fixes (m1, m2).

**Verdict.** The structure holds, and R3's two gaps are closed: HaX now names the first job at the dock and names Tomb Beta when she hands over the salvage line. What's left is pacing and stakes. On the route HaX recommends, the ledger read, the Recruiter's call and HaX's `afterwards` call run back to back at the drop terminal. The Recruiter's offer arrives seconds after the player first hears WREN exists, and it doesn't notice when the player already has the two names. Tran's tape wipe is an optional objective, but nobody ever says what's on the tapes. Two of the educational lines need small corrections: one says "inquiry" on m04 routes that never had one, and the new chart wording reads as if the bay word is the code.

---

## Part 1: R3 findings

| R3 | Status | Evidence (HEAD fc26a4bb) |
|---|---|---|
| m1 no voice names the first job | **Resolved** | `m09_phone_agent0x99.ink:180, 184, 188`, one line in each m01 arm, after the Tran sentence and before "[On my way.]" |
| m2 Tomb Beta introduced only by an aim | **Resolved** | phone:217 in `flag1_read`; the tape-room text A3-42 at erb:273 |
| n1 Victoria status row shadowed | **Resolved** | phone:955, now above both flag-2 rows that lack `cage_opened` |
| n2 m08 Sun River arm unsourced | **Resolved** | `m09_closing_debrief.ink:267` |
| n3 "Quintero's right" names an unlabelled speaker | **Resolved** | `m09_briefing.ink:310` "This one didn't, Quintero. Noted." |
| (R3, confirm on commit) "Mrs Sorensen's" in the Sun River arms | **Confirmed** | debrief:265, :269 |

**The first-job line.** "Once you're in, set the laptop up in the reading room and get me into their catalogue. It's how we find out what Sorensen's burning." Dialogue R2 changed "she's" to "Sorensen's", which reads better because the line is several bubbles away from her name. `#set_global:dock_done:true` still rides the Tran line above it, so a reload re-ring still ends at the same place. The line matches the status ladder's opening row (phone:976) and the aim description (erb:656). No new problem.

**The Tomb Beta line.** "The catalogue calls what's in there Tomb Beta. It's still drawing power, and nobody's scheduled it for anything." Dialogue R2's wording agrees with the master schedule's "Salvage cage, no series, no tick" (erb:2071) better than R3's "isn't on her schedule" did, since the player hasn't seen her schedule at flag 1. The identity scene's "Tomb Beta's owner." now names something the player has heard. A3-42 ("The salvage cage is through there. Tomb Beta's server. Still running.") arrives 5 s after tape-room entry, clear of the Recruiter's double-cross text on the same event. On the double-cross route HaX's logistics line follows straight after the Recruiter's threat about the plane. It reads a little flat there, but that's tone, not a fault. One gap remains: the moment the player is *sent* towards the tape room still gives no reason (n4).

**The Victoria row.** It now sits above `flag2_submitted and hatch_talked and not cage_opened` and `flag2_submitted`. On the recruited route it now beats the hatch rows even when the player has already cloned the card. Both routes open the gate, so pointing at the code isn't wrong. No row above it can be true while it is: every higher row needs `cage_opened` or comes later.

**The Sun River and Quintero lines.** Both are true on every route that reaches them, and both are voiced. m09 has no audio yet, so they cost nothing (the commit records 2 clips reworded, no count change).

---

## Part 2: the skill, run again

### Step 1: validator

**❌ INVALID.** None.

**⚠️ WARNING.** Unchanged from R1–R3, all known or ruled on: 13 onceOnly-overlap warnings on `agent_0x99` and `recruiter` (one new pair, `room_entered:tape_room`, is A3-42 beside the `tape_room_entered` latch, which is intended); the biometric `unlock_object`; four cutscenes without `onceOnly`, all deliberate; the salvage AND gate (the known `puzzle_graph_and_with` false positive); three no-credential locks (`stacks_release` and the office, both opened by HaX's `unlockDoor`; `beta_crate`, picks only). Dialogue lint: 5 `not-x-but-y` and 1 `you-after-choice` (allowed). Phone lines max 25 words.

**✅ GOOD PRACTICE.** Event-driven cutscenes, `globalVarOnKO`, `skipIfGlobal`, music by phase, configured hostiles, puzzle-graph metadata.

**💡 SUGGESTION.** As before. None apply.

**Graph.** Puzzle 64/71, Story 6/5, Integrated 70/86, Rooms 11. Critical path: Get In → Read The Initiative's Ledger → Take Tomb Beta's Server → Report To Netherton. Geometry OK. `reopencheck`: `agent_0x99` 1606 reopens, 0 problems. The four "problems" are the one-choice home stubs on the other phone contacts, intended since alignment R1.

### Step 2: design review

**2a Solvability: OK.** Neither commit touches a lock, a gate or a required task. The win condition is still four flags plus HaX's button, and no knock-out can block it.

**2b Clues: OK, with one wording problem.** The salvage chain (coded line at flag 1, the chart beside the keypad, CyberChef) is still the best puzzle in the finale. This round's change to the chart's house rule now points at the wrong action. See m2.

**2c Education: CONCERN (m1, n1, n2).** The educational additions mostly sit well in the world. HaX's "She never wrote a code down. She hung the key beside the lock. A cipher is only as safe as its key." comes as the cage opens, the moment the player has just used the key. "Every service that finds a hole makes this call…" is said by someone who made that call. The Noor text ("A kindness, then a need they already knew about.") lands as she leaves, on the thing the player just saw. Three are slightly off. The notice line says "inquiry" on routes that had none (m1). The guard's log records nothing a reader would call a warning (n1). The motives text lists "money", which isn't in the column it tells the player to read (n2). Most of the new teaching is optional: tier 2–3 of the keypad topic, "[About the name.]", "[Not yet.]", the legacy box and telling Noor. The parts every player meets are the full-disclosure definition (the single "[Isn't it?]" choice), A3-37, and the identity scene's "Never revoked." That spread is reasonable for a finale.

**2c′ Field guides: OK.** Placeholder `labUrl`s until the lab-sheet stage, as ruled.

**2d Narrative: OK.** The opening now gives the immediate objective by voice, and the act transitions all have a spoken handoff. The pacing at the Act 2 to Act 3 turn is covered under 2g (m3).

**2d′ Ink conventions: OK.**

**2d″ Patrol: OK.** Unchanged.

**2e Graph: OK.** Unchanged.

**2f Rooms: OK.** The staff passage is an empty 2×1 connector on route A. That's acceptable for a corridor the player only walks through.

### The loop in each room

I walked each room as a player and asked what they do from moment to moment and whether there's dead time.

| Room | What the player does | Dead time or gap |
|---|---|---|
| Dock | Briefing, dock call (route choice, now the first job), the guard's log | None. The log's payoff text is off (n1) |
| Front desk | Pick the door, choose a cover for Noor, lean in to clone her card, optionally tell her | None. Telling her pays off at the hatch (dialogue R2) and in the credits |
| Open stacks | Time the guard or talk past him; later the H&L box | None |
| Server closet | Tran: talk with the letters or fight | The objective has no stated stake (m5) |
| Reading room | VM flags 1 and 2, case file, notebook | After flag 2, three calls in a row on the common route (m3) |
| Restricted stacks | The hatch: recognition, the bin choice, the clone, the stamp | None. This is the best-built scene in Act 2 |
| Cage | The gate, Sorensen at the feed, the legacy box's clock, the print on the cabinet, the printed ledger | None |
| Office | HaX's door; the safe by cracker or lease date; the Reading; six documents with m02/m03/m06 payoffs | Reading-heavy, but every page pays off an earlier mission |
| Tape room | Card; chart and keypad (Vigenère); the Alpha deck on that route | None |
| Salvage cage | Flags 3 and 4, property label, folder, mirror job, the BETA crate | None. The identity scene, the read and Tesseract's call run back to back here, which is right for the climax |

### 2g Scaffolding

| Aim | Required tasks | With an in-world pointer | Dead-zone risk | Call or text at the transition |
|---|---|---|---|---|
| Get In And Set Up The Drop Terminal | 3 | 3 by voice (dock call now names the laptop and catalogue) | none | `flag1_read` |
| Find The Restricted Series | 5 | 5 | none | alongside |
| Read The Initiative's Ledger | 2 | 2 | none, but see m3 on pacing | ledger read, then the Recruiter |
| Search The Director's Office | 5 | 5 | none | `afterwards`, HaX on the door |
| Take Tomb Beta's Server | 6 | 6 (Tomb Beta named at flag 1 and at the tape room; not when sent there, n4) | low | identity scene, hour read, Tesseract's call |
| Report To Netherton | 1 | 1 | none | `bring_in_confirm`, then the debrief |

**Optional content and its signposts.**
- The H&L cross-reference: HaX's text when the ledger read opens (erb:392), the "[WREN.]" hub topic, Torres on the turned branch, and the bring-in confirm. Well signposted.
- Victoria's maintenance code: A3-36 and the status row. Good.
- The legacy box: HaX's two texts at the cage, and the hub topic naming the clock. Good.
- The Alpha clip: "I know whose voice that is. After." then "His tapes are on the bench in the tape room. When you want them." Good.
- Tran: named in the dock call, the hub topic gives the lever, and the objective is in the panel. What he's wiping is never said (m5).
- The BETA crate: no pointer and no reply when read. That's fine for the one optional lock in the last room; the "Ask properly." echo pays off by itself.

**Does the player know why the next thing matters?** Yes at every step through Act 2. At the office the reason is "her card for the tape room". The tape room's reason, Tomb Beta, was given at flag 1, which may be twenty minutes earlier by then, and is given again once the player is inside (n4).

### 2h KO: OK

Unchanged from R1's table.

### 2i Recurring bugs

- **Status answers.** I walked the ladder at each stage with both commits applied. Every row is right at its stage, and the Victoria row is no longer shadowed. Dialogue R2's rewording at phone:958 ("The gate beside her hatch takes her card. If you haven't cloned it, lean on her counter again.") echoes the hatch choice's own wording, which helps.
- **Credits and debrief against every route.** Unchanged and true. The tape-side credit line exists, but the stake behind it is never said in play (m5).
- **Spoilers in names.** None new.
- **Hub ordering.** The "[His notice.]" topic now has three lines before its buttons. Dialogue R2 put the cue line last, so it sits above the buttons. Fine.
- **Look-alikes.** None.

---

## Findings

### Minor

**m1. The new notice line says "Albion's inquiry" on m04 routes where there was no inquiry.** `m09_phone_agent0x99.ink:691-693`.

The educational E-m3 fix added "Albion's inquiry was about what happened. This is about the hole itself, and who else has it." on `m04_disclosure_choice != ""`. Stage 8 (SC 6, BP F-06) took "inquiry" out of every m04 route that never had one: partial without crew lost is "You told the public half…" and quiet is "The report said maintenance fault…" (briefing, the m04 card). The `albion` stitch (phone:530) and the debrief (debrief:137) both keep inquiry lines to `m04_disclosure_choice == "full" or m04_crew_lost`. A player who kept Albion quiet in m04 and asks about the notice now hears about an inquiry the briefing said didn't happen. It's the player's own earlier choice coming back wrong.

**Fix (unvoiced).** Split the condition the way the stitch does:
```
{
- m04_disclosure_choice == "full" or m04_crew_lost:
    Albion's inquiry was about what happened. This is about the hole itself, and who else has it.
- m04_disclosure_choice != "":
    What you said about Albion was about what happened. This is about the hole itself, and who else has it.
}
```
Update CONTRACT §15's E-m3 note.

**m2. The chart's new house rule reads as if the bay word is the code.** `scenario.json.erb:2242`: "House rule: each keypad takes its own bay's word."

E-n7 changed "cage and keypad codes use the bay word" to remove one doubt (which bay). "Takes" adds another: a keypad that takes a word is a keypad you type that word into. The player is standing at the salvage keypad with BONEYARD on the wall, so BONEYARD is the obvious first try, and it fails. It only costs one wrong try, but the clue seems to lie at the step where the player should be working out that a cipher has a key. A3-37 ("She hung the key beside the lock") then pays off a reading the chart didn't support.

**Fix (no audio).** "House rule: each keypad's code is keyed to its own bay's word. Never write a code down. M.S." This keeps E-n7's "its own bay", matches HaX's tier 1 ("Archives key things to the shelves.") and Gary's "key them to the shelf scheme", and makes "key" the word the chart teaches. Update CONTRACT §15's E-n7 note and S6 §1.9.

**m3. On the route HaX recommends, the ledger read, the Recruiter's call and `afterwards` run back to back at the drop terminal.** `scenario.json.erb:406-407` (ring b); erb:259 (`afterwards`, 2.5 s after the deck choice); erb:76 (a mapping's `delayMs` waits for an open conversation).

HaX says "Stacks first" at flag 1 (phone:209-212), so most players open the cage before flag 2. Then flag 2 brings the ledger read, whose first line sets `ledger_read_heard`. Ring (b) is queued 3 s later and waits for the ledger read to close, so the Recruiter rings the moment it does. Her call is voiced, forced and long, and ends in the deck choice. `afterwards` rings 2.5 s after that. That's about three minutes of phone with no movement. The player hears "WREN's on our team" and is asked to buy WREN's name before they've taken a step. The H&L pointer text (erb:392) arrives in the middle of it, too late to act on before the offer. On the other order (flag 2 before the cage), ring (a) on leaving the cage gives a walk first, which plays better. The Recruiter's offer is the mission's biggest choice, and it works best when the player has had a moment with the dread.

**Fix (mappings only, no ink or audio).** Remove ring (b). Ring (c) (erb:408), "any room entry outside the cage", then fires as the player leaves the reading room. Give it a `delayMs` of about 15000, so the call comes once they're walking, and the condition is checked again before it rings. Ring (a) is unchanged. Optionally, `afterwards` (erb:259) could take a `delayMs` of about 20000, so the player is on the move before the loss lines. If so, make its last line conditional on `office_entered`, because "Her office is the west door off the restricted stacks." would be stale inside the office. Update CONTRACT §6 and S4 §6.1's ring list.

**m4. The Recruiter's offer doesn't notice when the player already has the two names.** `m09_phone_recruiter.ink:131-147` (`offer`), :214; `m09_phone_agent0x99.ink:351` (deck_resume, the same string).

A player who submits flag 2 before the cage (a natural order for anyone stuck on the MIFARE clone) can read the H&L placing sheet before the Recruiter rings. m3's fix makes that more common. Then she says "One of your four is mine" and sells one name, and nobody on the line points out that the player has it down to two. If they refuse and pull her file, HaX says "One of four. Two, if that firm's boxes say so.", which is stale because the player has already read the boxes. The debrief and closing card track `sleeper_shortlist` carefully, so the offer is the one place where this earlier work goes unseen. It also changes what the offer is worth: a coin toss rather than a name.

**Fix (voiced HaX lines; m09 has no audio yet, so free now).** In `offer`, after "One of your four is mine…": `{sleeper_shortlist: Agent HaX: We're down to two off that firm's sheet. She's selling you a coin toss.}`. In `tape_choice` (recruiter:214) and `deck_resume.no_block` (phone:351), keep the two strings identical: `{sleeper_shortlist: One of two, and now her handlers too. | One of four. Two, if that firm's boxes say so.}`. B1 and A1 must still match character for character (CONTRACT §3.1). Add to FINALE_TTS_COUNT.

**m5. Tran's tape wipe is an optional objective, and nobody says what's on the tapes.** `scenario.json.erb:1460` ("WIPE IN PROGRESS. Series LI, legacy interviews: 212 reels."); `m09_jesse_tran.ink:46` ("Interviews. Old ones, on reels."); phone:832 (HaX's Tran topic); credits "The tape side: 97 of 212 reels kept."

FINALE_ARC row 847 says what these are: the Initiative's *legacy recruitment interviews*, the Series L placements in their own voices. In play, the player meets "legacy interviews" and "Old ones", and HaX's topic gives the lever but not the stake. "Stop the tape wipe in the server closet" sits in the panel from the start, and the player who wins it gets a credit line for 97 reels of nothing in particular. The legacy box in the cage, by contrast, is named, timed and read. Given the user's priority (choices that land), a side objective with a cost (a fight, or the letters over Derek's file) should say what it buys.

**Fix (unvoiced).** In HaX's Tran topic, under the `tran_topic_heard` guard after "He's wiping tapes…": "Those reels are her recruiting interviews. The legacy names, in their own voices, saying yes." Console text: "WIPE IN PROGRESS. Series LI, legacy recruitment interviews: 212 reels." Optionally, the credit "The tape side: 97 of 212 reels kept. Analysis is listening." Update CONTRACT §2.1 topic 17 and C7.

### Nits

**n1. The guard's log records nothing a reader would call a warning, and it puts the shredding five nights before the order arrived.** erb:1084; A3-41 at erb:368. Each night reads "SHREDDER RUNNING, NIGHT. MRS. S SAYS SCHEDULED. NOTED." HaX answers "Five nights of warnings, and nobody read them." The briefing says the order came last night. One word in the log fixes both, by making the earlier nights odd but routine and giving the guard something to flag: "MON. SHREDDER RUNNING, NIGHT. NOT ON THE ROTA. MRS. S SAYS SCHEDULED. NOTED." Then HaX's "warnings" is earned, and "not on the rota" squares with Old Coyote's "It hasn't jammed once all week" without implying the Series R purge started before the order.

**n2. A3-38 tells the player to read the notes column and lists "money", which isn't in it.** erb:362. The Series L notes say Quiet, Asks nothing, Wants out / Remind her of her son, Drinks, Bright. Bored., Grateful, Lonely. Money is the cost column. **Fix:** "Read the notes column. A son, a drink, boredom, a lonely night. That's how she chose them, and how she kept them."

**n3. A3-37 and the salvage guide text land about 2 s apart.** erb:281 (`salvage_opened`, delay 2000) and :285 (`room_entered:salvage_cage`, no delay). The door opens and the player walks in, so the two texts arrive almost together, and the guide offer buries the cipher point. README spacing is 4–6 s. **Fix:** give A3-37 `msg_delay: 6000`, or move the guide text to `msg_delay: 5000`.

**n4. The player is sent to the tape room without the reason being repeated.** `m09_phone_agent0x99.ink:949` (status, `deck_choice_made`); the Recruiter's and `deck_resume`'s "Her card for the tape room will be in that office." (voiced). R3 m2's fix names Tomb Beta at flag 1 and again inside the tape room, which closes R3's finding. The handoff in between still says only "her card for the tape room", and by then the flag-1 line can be twenty minutes old. **Fix (unvoiced, status row):** "Her office. Get the safe open. Her card opens the tape room, and Tomb Beta's server is past it."

---

## Prioritised action list

**Must fix:** none.

**Should fix**
1. m1: put the notice line's "inquiry" behind `full or m04_crew_lost` (phone:691).
2. m2: chart house rule "each keypad's code is keyed to its own bay's word" (erb:2242).
3. m3: drop Recruiter ring (b) and delay ring (c), so the offer comes after a walk (erb:406-408).
4. m4: one HaX line in the offer on `sleeper_shortlist`, and the "Two, if…" line made conditional (recruiter:131, :214; phone:351).
5. m5: say what's on Tran's reels (phone:832, erb:1460).

**Worth considering:** n1 (log wording), n2 ("money"), n3 (text spacing), n4 (status row names Tomb Beta).

## Top five

1. **m3.** On the route HaX recommends, three calls run back to back at the drop terminal, and the Recruiter's offer comes before the player has moved since hearing WREN exists.
2. **m1.** The new notice line says "Albion's inquiry" to m04 players whose route had no inquiry.
3. **m4.** The Recruiter's offer ignores a shortlist the player already holds, and HaX's "Two, if that firm's boxes say so" goes stale.
4. **m5.** Tran's tape wipe is an optional objective whose stake (the legacy recruitment interviews) is never said.
5. **m2.** The new chart wording "each keypad takes its own bay's word" invites typing BONEYARD.

## Browser checks owed (carried, not findings)

1. The Alpha deck host's name and portrait before the identity scene (R1 check 1).
2. The confirm knot: both buttons, a close with the confirm showing, a reload on it, and the four-line maximum on a phone-width screen.
3. Sorensen's auto-open on a first meeting with the file in hand.
4. New: with m3's fix, the Recruiter rings within about 15 s of leaving the reading room, and not inside the cage.

## Out of scope (engine track; uncounted)

- Calls whose `delayMs` waits for an open conversation queue one behind another. m3's pacing depends on that behaviour, and the reload ordering of `in_cage` (R3) is still on the engine track.
