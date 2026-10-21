# m09 Digital Archaeology: Stage 1, narrative structure

Stage 1. Author: stages 1–2 author (Opus), 2026-10-21. Status: round 4 fixes folded in (§15–§18); stage 3 (`../stage_3/moral_choices.md` §11 changes 11–22, with its round 1–3 outcomes) folded in 2026-10-21 (§19); stages 0–3 milestone fixes applied 2026-10-21 (§20); stages 4–5 (`../stage_4/objectives_tasks.md` §14 P1–P20, `../stage_5/room_layout.md` §12 P21–P23, with their round 1–3 outcomes) folded in 2026-10-21 (§21). Where this document and stages 3–5 still differ, the later stage wins. Stages 4–5 hold the build detail (tasks, globals, mappings, rooms); this document keeps the story and points there.

Inputs: `../stage_0_initialization.md`; `../../../finale/FINALE_ARC.md` §1–9 and §13 (the shared source of truth; row numbers below are its §2 rows); `story_dev_prompts/01_narrative_structure.md`; the `mission-alignment-plan` and `npc-dialog-review` skills; `README_ink_best_practices.md`; the shipped m01, m02 and m08 briefings, debriefs and HaX phone ink. Characters, voices and sample lines are in `../stage_2/storytelling_elements.md`. VM flags appear only by story meaning (FINALE_ARC §6.1).

## 1. Premise and what m09 owes

**One line.** On day eleven the leave is cut short: SAFETYNET has read an order to "burn Helena before the Publication" and let it go on so as not to tip its sender, and Agent 0x00 has one night inside a Montana records archive to prove who the Architect is, find out what the Publication is, and bring back the way into his bunker, while the archive's own director shreds the evidence behind a steel mesh.

**Where the player stands.** m08 ended with the Global Threat Database gone to Tomb Gamma, Nightshade dealt with, and HaX's text, "Same classroom, 0x00. Don't ask me whose yet." Nobody has said Tesseract's name aloud as fact. The player has been on leave for a day.

**What m09 owes the player** (FINALE_ARC §1.3, stage 0 §1):

1. The name, said aloud and proved from two directions: the credential on Tomb Beta's server (flag 3) and the handwriting on Nightshade's recruitment file. Netherton says it; HaX confesses what she knew.
2. The ledger, which tells every player that one of the four people they met at the briefing is a plant (flag 2).
3. The defences of Tomb Gamma, on paper (the construction file) and on the server (flag 4).
4. The Publication's hour, 06:00 UTC on day 13, and what the Publication is.
5. Proof that Tesseract's case against SAFETYNET is partly true: a flaw SAFETYNET catalogued nine years ago and kept, which Critical Mass later came through at Albion, with his memo arguing it should be reported and the vendor notice he never sent.
6. The player's own file, the Reading: what the man who wrote it thinks they will do.

**The night's shape in one paragraph.** The player gets in, sets up a drop terminal and opens the catalogue (flag 1). The catalogue says the restricted series is in the cage where Sorensen is feeding the shredder. The player talks to her across the hatch counter, saves one bin, clones her card, lifts her print, and gets into the cage. Nightshade's file is in a plan cabinet that takes her print, and the hand on it matches the margin notes in HaX's old training notebook. The ledger (flag 2) names WREN on the raid team. As soon as the player is out of the cage the Recruiter rings with an offer, and the price is a tape deck: take her name and the whole deck is wiped; refuse, and the player saves one tape before her wipe reaches it. HaX says three words about a line she was taught. In Sorensen's office the player opens the safe with the cracker a raid-team member gave them at the briefing; the Reading is inside, with the tape room's key card. Behind the tape room, in a salvage cage whose keypad takes a code the player decodes, is Tomb Beta's last server. Flag 3 brings the name, with HaX and Netherton on the phone; flag 4 brings the hour, the defences, the key, and Tesseract's own casualty sheet. Tesseract rings HaX. Netherton signs the Montana order.

**The surprise the night builds to.** The purge order comes with a destruction schedule. It protects the cells: it lists the Initiative's placements, its letters and its recruits by series, and whatever of his old paper is filed beside them. Down its margin is Sorensen's planning pass from before the night, each room's series checked against the order and ticked as covered; the salvage cage's line has no series and no tick, and she has pencilled one query: "Reading (safe); plan chest: not listed. Keep?" The master copy is in her safe, so every player holds it (R2-S03). The server that holds his credential, his Albion memo, the hour and the defences is left running on purpose. He wants to be known, he wants SAFETYNET to read what it kept, and he wants them to come (FINALE_ARC §1.2). A player who read the schedule says it first, at flag 4; for everyone else HaX states the fact from the job's side, once; his call to HaX is the only confirmation.

## 2. Structure at a glance

| Part | What happens | Rooms | Flags | Minutes |
|---|---|---|---|---|
| Briefing (cutscene) | The order, the wall of cards, the raid team, the cracker | Task Force Null's room (cutscene background) | – | 4 |
| Act 1: Get in | Loading dock, the guard, the clerk, the drop terminal, the catalogue; the shredder heard through the wall | loading dock, front desk or open stacks (two routes), reading room | 1 | 15 |
| Act 2: The stacks | The hatch and the bins, the cage, Nightshade's file, the ledger and WREN, the Recruiter's call and the deck; optional: the cross-reference, Tran | restricted stacks (the hatch), restricted cage, reading room; optional: open stacks, server closet | 2 | 31 |
| Act 3: The name and the hour | The safe and the Reading, the schedule, the tape room, the salvage cage and Tomb Beta's server, the identity scene by phone, the Albion papers, the hour and the key, Tesseract's call | Sorensen's office, tape room, salvage cage | 3, 4 | 31 |
| Debrief | Kowalczyk's question; Netherton reads the two names and signs the Montana order | airfield hangar (cutscene background) | – | 4 |
| **Total** | | ten rooms (stage 5 §2) | 4 | **85** (about 76 on the critical path, stage 4 §11) |

**Budget notes** (rebuilt in rounds 1–2, S-01, R2-S04). **About 85 minutes with the field guides; 95–100 without.** Stage 8's playtests set the published figure. Each act's minutes are the sum of its beats.

- Each VM stage is budgeted at 7 minutes for a player following the field guides, an assumption, not a measurement (no shipped mission records time per VM stage): flag 1 inside Act 1, flag 2 inside Act 2, flags 3 and 4 inside Act 3. Stage 4 kept it as an assumption (S4 §11); real per-flag times from m07/m08 play data or one timed VM run replace it before stage 8 sets the published length (milestone M-14; still open). At 10 minutes a flag the total is about 97. The purge moves on story events, so a slow VM stage stretches its act without costing anything in the story.
- Act 3 lost its two walk-backs: the Reading is in the office safe (no trip into the open stacks), and flags 3–4 are submitted in the salvage cage beside the server, with a second launcher there, and HaX and Netherton on the phone (no trip to the reading room and back). The salvage code's key hangs beside its keypad, and the coded line is already in the notepad, so the decode needs no walk either (stage 4 §11). Together they save about seven minutes (§14 change 12; stage 4 P1).
- Act 2 holds the optional content and is the first place to cut if playtests run long, in this order: the cross-reference (the Recruiter's offer is the certain route to the name), Tran's server closet, the Alpha tapes' decode. Nothing on the critical path is cut.
- The briefing's spine is about twelve lines before the wall (S-22, W-09); with the wall, the team and a three-topic hub, about four minutes.
- The payoff scenes are counted inside their beats: the Recruiter's call is about 3 of Beat 2.4's 5 minutes, the identity scene about 3 of Beat 3.3's 10, Tesseract's call about 1.

**Tension curve.** Unease (briefing) → a steady build under the shredder (Act 1) → first spike at the cage, when Sorensen quotes the player's own file at them → flag 2: one of the team → the Recruiter's call → three words from HaX and a breath → the Reading, in a quiet office → the identity scene and what it cost → flag 4: the worst number in the season, and a key → the call → the debrief, with Kowalczyk smiling at the player and the dread carried forward.

## 3. Opening briefing

A cutscene in Task Force Null's room at the Citadel, on the morning of day 11 (UTC), with `skipIfGlobal: briefing_played`. Netherton runs it and hands the wall to HaX; the four raid-team officers are in the room. About four minutes: a spine of about twelve lines before the wall, the wall, the team, a three-topic hub. The m02 shape, opened on the hook (W-09, S-22).

Carry-overs in the briefing are held to the ones the player feels: the wall (a montage of their season, the one place a list is allowed), how the order was caught (one reason, the player's own if they earned it), and the m08 openings. The rest move to the moment they help (§7 of stage 2).

### 3.1 Beats in order

1. **Cold open on the order** (Narrator). A room with no windows. On the screen, a photograph of one typed sheet: "Burn Helena before the Publication. Schedule attached. -- A." Four officers in kit nobody has unpacked. The player's leave was meant to run three days, and it ran one. On `m08_netherton_ko` or `m08_netherton_hostile`, one more narrator line: Netherton takes the chair furthest from the player's, and nobody mentions why (W-15; he said in m08 it would not be discussed, and it isn't).
2. **Netherton opens on the order.** "Last night a courier in Helena, Montana, carried this to a records archive. We read it. Then we let it go on. If it hadn't arrived, he would know." (S-06.) Then how it was caught, one reason, the first that applies: on `m04_lore_safehouse_address_found`, Calder Wharf ("Your card from Albion. Task Force Null went in yesterday. It held a courier account, and this was on it."); else on `m06_monitoring_enabled`, the courier was paid from a wallet the player tagged ("Your tags lit up last night."); else Nightshade's go-bag held a one-way ticket to Helena (row 116), and SAFETYNET has read Helena's couriers since. The courier label names the company: Mountain States Records & Retention, a commercial archive on the edge of Helena.
3. **The no-coordinate line**, on `m08_completed and not m08_tomb_gamma_location_known`: "We have Helena. Not the bunker. Not yet." The deed becomes the night's first concern.
4. **HaX's first line**, by m08 branch (rows 108, 111): where she sent "Same classroom. Don't ask me whose yet", she picks it up ("Keep not asking. By morning you won't need to."). `m08_hax_ko` first: "You put me on the floor at the Citadel. I'm still running you." Knock-out-before-fate and never played m08: a plain opening (§10.2). On `m08_nightshade_arrested` the wall's m08 card carries the branch (S-14; FINALE_ARC's "which briefing opening plays" is met there).
5. **The wall** (row 57). HaX walks it in about sixty seconds: one short line per card, m01 to m08, in the player's own outcomes or the never-played sentence (§10.1). When most cards are unplayed, only the four the night leans on (m04, m05, m07, m08) get their never-played sentence and the rest share one line (milestone M-11, §10.1). The last two cards carry a name each and no outcome: Agent 0x19 Callum Fraser and Agent 0x6B Ana Lúcia Ferreira, the two dead from the unanswered m07 sites. HaX does not read them. Netherton: "I will read those two myself. Later." (row 100.)
6. **The suspect, without the name.** At the "-- A." pinned above the wall, Netherton: "ENTROPY's planner. Every card on this wall has his initial on it somewhere." (S-21.) Then: SAFETYNET has a suspect; he was one of theirs; "I will not say the name in this room until we can prove it." (W-17: no "Tonight we can.") On `m06_architect_identity_found`, HaX to the player alone: "You heard me say it after HashChain. I called it his guess." and a look; the admission waits for the salvage cage (S-10, R2-S06). The name lands in the identity scene (Beat 3.3) for every player, cold starts included (§14 change 1).
7. **The stakes** (HaX, fact first, three short lines):
   - Nobody knows what the Publication is. They know what it would be made of: the database, "every weakness we have ever catalogued". One entry, said plainly: an infusion-pump flaw in a hundred and forty hospitals.
   - Analysis's guess, labelled as one: hundreds dead in the first month if the cells get it. "They're guessing. I'd like to find out they guessed high." Flag 4 replaces the guess with his own figure.
   - On `m07_completed` with Austin uncovered (row 83): "Day eleven. Eleven counties." Austin covered: no line (the wall's m07 card says it). On Meltdown uncovered (row 85), the wall's card carries the hospital line instead.
8. **The question hub** (§3.2). Three topics.
9. **The raid team** (§3.3), including Quintero's answer to "why one agent".
10. **The cracker.** Kowalczyk hands it over; HaX: "The long way is over." (row 118); Kowalczyk's reply (§3.4). The handover is narrated: the cracker is in the player's start kit, not given from inside the briefing, because a give from a cutscene comes from the cutscene's host, not from her (stage 4 P15).
11. **Close.** Netherton: the plane leaves in ninety minutes; the team follows tonight; "Bring me a name I can say in court." HaX: "Line's open from wheels down." `briefing_played` is set on the first line.

### 3.2 The question hub

Three topics, each a different piece of information (a question hub rather than lossy openers, `README_ink_best_practices.md`). Each is asked once; "Let's go" is always there. The building's people (Sorensen, Tran) move to HaX at the loading dock (Beat 1.1), and "why me alone" moves into Quintero's beat (S-22).

| Topic (player's words) | Answer, in short |
|---|---|
| "What's the Publication?" | "We don't know. That's what tonight is for." What they can guess (the database) and what they can't (when, how). |
| "Schedule attached. Of what?" | The order came with a destruction schedule: series numbers, nothing else. "Every box on that list is ash by the time the team lands. Be in the building first." (It sets up the schedule the player finds in Act 3, Beat 3.1.) |
| "When do we go at the Architect directly?" | "Now." (Row 43; asked in m03, phrased so it holds for everyone: "Somebody always asks me that. Now.") |
| "Let's go." | Ends the hub; goes to the team. |

### 3.3 The raid team

Netherton introduces Task Force Null's four in one breath ("Quintero leads on the ground. Kowalczyk breaches. Malhotra runs comms. Arakawa talks to the Americans."), then each gets one short beat. Every beat is ordinary in the room and reads differently once the ledger says one of them is WREN. One each, never a wink. This settles FINALE_ARC §13 item 4 for m09.

| Officer | The beat | Why it can look bad later |
|---|---|---|
| Marisol Quintero, "Anchor" | She argued against tonight and lost before the player came in, and answers the question the player hasn't asked yet: why one agent. "One agent, no cover, in a building that's burning paper. If it goes wrong, I go into Montana a day late and one short." Then, to Netherton: "Orders don't fall off couriers." Netherton: "This one didn't. Noted, again." | She wanted Helena left alone, and Helena is where the ledger is. (Her line about the courier is also right, S-06.) |
| Halina Kowalczyk, "Lantern" | Easy to like. Hands over the cracker (§3.4) and makes the one joke in the room. Her single double-edged line is the cracker's; nothing else she says is pointed (W-20). | The cracker. (She is WREN.) |
| Dev Malhotra | Asks to run the Helena line himself: "If something goes wrong in there, I'd like to hear it go wrong." HaX: "I run 0x00." He lets it go at once. | He wanted to listen to the operation. |
| Kenji Arakawa | Has asked Helena's police to keep their cars off the archive's side of town tonight: "Nobody asked who for. Nobody will." | He cleared the street, and the player cannot know for whom. |

The player can answer one of them: back Quintero ("She's right. Send me anyway."), thank Kowalczyk, or say nothing. It is recorded locally and paid back where it can hurt (W-19): on "thanked Kowalczyk", when the Recruiter names her, HaX says "You thanked her at the briefing. Keep doing it."; on "backed Quintero", when the Harwick & Lowe file puts Quintero on the shortlist, HaX says "You took her side at the briefing. Keep it. Don't take her word." (N-16; "at the briefing", not "this morning", because the archive night is the next UTC day, R2-S07.)

### 3.4 The cracker (FINALE_ARC §13 item 3, m09 side)

Since m08 every PIN cracker Nightshade ever signed for is quarantined in stores, which is why the player has gone without since St. Catherine's (m08's ATHENA: "still signed out to Agent 0x47"). Kowalczyk's is her own breaching kit: "This one's mine. Never been through stores, never been near him." That line is true. Nothing in m09 ties the cracker or its serial to WREN, and m09 claims nothing about where it was made: m10's whodunit relies on no single clue naming her, so how the bench figures is m10's (m10 REVIEW_R3 R3-06). She gives it because she wants to be liked by the agent she will go into the bunker with, and because helping 0x00 reach Montana is what the Architect wants (FINALE_ARC §1.2). In m09 it opens Sorensen's safe (Beat 3.1), the mission's only PIN lock; every other keypad is a code lock the cracker can't touch, so it skips nothing. HaX's "The long way is over" is a line m10 can call back to.

Default for the canon question (row 29): not every SAFETYNET cracker comes from the bench; the ones Nightshade procured and signed out did. Whether Kowalczyk's did, and what m10's bench shows, is m10's to decide. Stage 6 writes the m09 side into the Citadel's incident file, but no m09 object carries that file yet: stage 6 names the document it lives in, or drops it (stages 4–5 milestone; FINALE_ARC §13).

## 4. Act 1: Get in

About 15 minutes. Aim 1: "Get in and set up the drop terminal". Aim 2 opens at flag 1. The purge is already running when the player arrives (FINALE_ARC §6.1): the first thing they hear inside is the shredder.

### Beat 1.1: The loading dock (2 minutes)

Night, sodium light on a grain warehouse with the archive's name stencilled over an older one. HaX's first line on the ground is short and gives the player the clock: "That noise is a cross-cut shredder. It's been running since before you landed." The dock has two ways in, and HaX names both: "Shutter's his round. The office door's quieter." The office door into the front desk is locked (picks; route A, past Noor). The roller shutter into the open stacks is open, and the guard's round crosses the far end of the warehouse floor between it and the reading room (route B). Cody Old Coyote's torch moves along the fence on his round; he is the player's first lesson in the building's rhythm, and he is innocent (HaX: "Night guard. Twenty-four. Not ours, not theirs. Don't hurt him.").

HaX gives the building's people here, where they matter, in three short lines (moved from the briefing hub, S-22): the director, Margaret Sorensen, county clerk for twenty years before this; a clerk on tonight; and the IT contractor, Jesse Tran, with the m01 warning by branch (row 6): on `m01_completed and not m01_maya_ko`, "Maya's list has a Tran on it."; on `m01_maya_ko`, "Maya Chen would have flagged him. We don't have Maya's names."; never played m01, "Viral Dynamics' staff files have a Tran in them." On the briefing's raid-team answer, one line if the player backed Quintero: "Quintero's going to hate that she was right if this goes badly. Let's not."

On `m01_maya_ko`, Tran also makes one move on the main path (S-13): after flag 1 he radios Old Coyote to "check the reading room", and the guard takes up a post in the open stacks beside the reading room's door (beside it, never on it, so route B stays open; stage 4 P6). HaX: "Tran's just sent the guard to your door." Avoidable as any patrol is.

### Beat 1.2: The front desk and Noor (3 minutes)

Noor Haddad is at the front desk at an hour clerks are not, on the floor by her trolleys, loading archive boxes from a printed list. The staff door behind her opens into the reading room on her card. Sorensen called her in "for a scheduled destruction run", and in a records archive that is a normal night's work, which is why Noor has not asked. The trolleys go to the cage. The player can talk to her as whoever they choose to be (a contractor, the auditor, or SAFETYNET), and what she offers depends on m05 (row 62):

- **Warned in time** (`m05_found_pipeline_list and not m05_recruiter_deal_accepted`): SAFETYNET reached her weeks ago, and she knows what the player is the moment they say a name. She gives the warning ("Peg's been in the cage since before I got here. She never feeds the shredder herself, and tonight she's sent me home twice.") and the door: she hands over her card for the staff door into the reading room, which keeps the player off Old Coyote's route. She has also held back the last box of the night's run, which she was meant to take to the cage: "I didn't send the last one. It's under the desk." It is the legacy placement files (Beat 2.1), saved as a reward for m05, with no choice (`legacy_files_saved = true` at `cage_opened`).
- **Warned late** (`m05_found_pipeline_list and m05_recruiter_deal_accepted and m05_recruiter_deal_confessed`): someone from SAFETYNET rang her last week. She gives the warning, not the card: "I don't know you. I'm not losing this job for a phone call." The choice below is still open.
- **Not warned** (every other case, cold starts included): a wary bystander, and the choice below.

**Her card, on every branch** (stage 4 P5). Route A must work without knocking out an innocent clerk, so every player can clone her card while talking to her: a choice that reads as standing close while she checks her list. It is an easy card, the cloner's first use of the night before Sorensen's harder one. Warned in time, she hands it over instead.

**The choice** (stage 3 §4.2; `noor_told`): Noor and her father, nothing else. Her job is not the cost (by morning the archive is a crime scene on every route), and nothing in the mission rides on it. HaX signposts it the first time the player can tell her: "Tell her and she's a witness. She goes tonight, and she doesn't ring her dad for a while." **[Tell her what the bonus was.]**, or, once the player has read the printed ledger, **[Show her the page.]** (the same choice with proof; the printed ledger is a readable on a shelf in the restricted cage, stage 5 §3.7, not an item, so the choice is gated on `printed_ledger_read`, and the page survives the shredding as something the player has read; stage 4 §5). Told, she asks the one question the scene is for ("My dad's on dialysis in Dearborn. I never told her that. How did she know that?"; shown, "Was I going to say yes? Don't answer. I know I was."), then reaches for her phone to ring him. HaX, in the player's ear: "Don't let her ring from here." The player: **[Not tonight. Not from here.]** She puts it down and goes out with Arakawa's people; her desk is empty for the rest of the night. Left be, she keeps loading, goes home at the end of the run and rings her father as she does every night, still on a recruiter's list.

**Knocked out** (`noor_ko`, local; milestone M-02). Any NPC can be. She stays down at the front desk until Arakawa's people collect her; a box she held back (warned in time) stays under the desk, so `legacy_files_saved` is unchanged; her card for the staff door drops beside her. It gets one debrief line in "The archive" (§7.1), checked before her told and left lines. Whether m10 gives it an "Elsewhere" clause needs an export (§20).

Noor's trolley list is the player's first look at what is being burned: a copy of the destruction schedule, series numbers, no titles. "Series R" appears on every line. The trolleys and the list empty in three steps as the night goes on (flag 1, flag 2, the cage opening), so the purge is visible from the front desk (stage 4 §4).

### Beat 1.3: The reading room and the drop terminal (3 minutes)

The reading room is the archive's public face: long tables, green lamps, a microfiche reader, a terminal that only shows the public catalogue. The player sets up the field laptop on a reading desk beside the SAFETYNET drop terminal (where flags 1–2 are submitted), and HaX is live on it. Beside them lies her case file: the order's photograph, the wall's cards, the raid team, and one item she does not mention, a scanned notebook labelled only with a course code, kept as its own sheet two tiles along (Beat 2.2). On `m06_monitoring_enabled`, the case file carries a page of tagged payments (row 71; a page of the file, since nothing can appear on a desk mid-mission, stage 4 P9): one line of money from the fund to a lease, which HaX reads once ("Your tags, from HashChain. Someone's paying rent on a building in Montana that isn't this one.") and which, on the no-coordinate branch, points at the bunker before the deed does.

HaX gives the VM job in story terms: the public catalogue hides a series; the catalogue server does not. Her one VM steer, if asked: "The catalogue's the index. Find the part that isn't public." (stage 4 §7.1).

### Beat 1.4: Flag 1, the catalogue (7 minutes)

**VM flag 1** (a foothold on the catalogue server): the index of every box, tape and shelf, including the restricted series. Submitted at the drop terminal. HaX says what it bought: the shelf marks for Series R, which sit behind the cage mesh in the restricted stacks, and "the boxes on Noor's trolleys are the ones on this list". She sets the order without forcing it: "The ledger keeps. Her shredder doesn't. Stacks first." And she gives the kit its cue: "Her card's on a reel at her hip. You've done this before." **Lock (R2-S01; stage 4 P7):** the restricted stacks' outer door opens when HaX unlocks it on flag 1 (a persistent unlock from her mapping, F19, not the flag's own reward), so the cage cannot come before flag 1. Before it, the reader refuses and HaX says why: "That reader's on the catalogue server. Get me in there and I'll open it." Flag 1 also turns up the salvage cage's code: one catalogue entry, "salvage cage: access", is written in an old archive encoding. HaX sends it to the player as a notes item ("I've sent you the odd one. Salvage cage, their own code."), and every view of the drop terminal's screen from flag 1 on repeats it, so no player can lose it (decoded later, Beat 3.2).

On `m08_nightshade_triple_agent`, **Nightshade rings** here (row 104), from a SAFETYNET room, on the player's handset, competing with HaX for the line. He names which database entries the archive's restricted cage was built against (the reader that takes a lifted print; the badge reader that takes a clone), and he is right. HaX lets him talk and says nothing until he has gone: "He's right. I hate that he's right." This is his whole m09 presence until his file (Beat 2.2).

**Act 1 ends** with the shelf marks on the screen and the shredder still going: Series R is behind the mesh, in Sorensen's hands. Aim 2 opens: "Find the restricted series before it burns".

## 5. Act 2: The stacks

About 31 minutes. Aims 2 and 3. The purge's first two events happen here, in FINALE_ARC §6.1's one order: the cage, the ledger shelf, flag 2, the Recruiter's call, the tape deck.

### Beat 2.1: The cage (8 minutes)

The restricted stacks are a room behind the reading room, and the hub of the back of the building: Sorensen's office opens off its west wall, the tape room off its north, and on its east wall, behind a steel mesh floor to roof, is the restricted cage, with a gate at the top of the wall and a hatch counter below it. Sorensen is behind the mesh, at a cross-cut shredder and a degausser, feeding them from Noor's trolleys. The cage is its own room (stage 4 P4), so walking out of it is an event the building can see.

**Staging** (S-09, settled by stage 5 §3.6, P3). Sorensen is three records in the build, one person in the story. At the hatch she stands in a sealed strip behind the counter, as a fixed figure whose body reaches the counter's edge, so the player can talk to her, clone her card and lift her print across it; she can't be knocked down through the mesh. In the cage she is a second record at the shredder's feed, who can be knocked down and holds only her card. A third, hidden, hosts the door scene on Victoria's route and holds the two files, so a knock-out can never undo the bin choice. If the browser check at stage 9 shows the counter out of reach, the fallback keeps the beat: a bell on the counter, and she comes to it when rung.

1. **The bluff.** The player can be the auditor the lease-holder sent (stage 0 §5). Sorensen is polite, precise and in no hurry; auditors are a thing she knows how to handle. She stamps each box "destroyed" with a rubber stamp she sets down on the hatch shelf, on the player's side, between boxes, and her stacks card hangs on a reel at her hip. **The card opens the cage gate; the print opens the plan cabinet at the back of the cage** (stage 4 P2: one lock per door, and the cabinet puts the print kit inside the cage). Her office is on its own keypad, off the card system. The player clones the card while she talks (the m08 technique, on a harder card than Noor's); the clone is offered on every branch of her conversation and as a repeatable choice ("[Lean on the counter while she stamps.]"), because nothing else can clone it. The print comes off the stamp. After flag 2 the stamp is still warm: "Her stamp's warm. She's three boxes from the bins." On `m03_victoria_fate == "recruited"`, Victoria's protocols read the archive's internal mail, and Sorensen's mail holds the cage's maintenance code: a second way through the gate that replaces the card, not the print (row 32). HaX gives it from her hub once the player has seen the gate, and adds: "The cabinet in there takes her print. It's on the stamp on her shelf." On that route the recognition plays at the cage door, as the gate opens, and the bin choice is made there: HaX names the two files, the player takes one, and Sorensen tips the other. If the player takes neither and walks past, Derek's survives, as at the hatch (S-16, R2-S10, R3-11).
2. **HaX names the bins and what each buys** (W-12, S-08). Two bins wait by the shredder's mouth in the strip behind her, out of reach, and HaX gives each one line (the player chooses on her lines, not by examining the bins):
   - **By the hatch: Derek Lawson's file**, from the restricted series, written before Viral Dynamics hired him, costing his fall (rows 1, 9). It is the Architect's own hand on the player's first case, with his standing order to Derek and a page of costing notes. HaX names the stake that matters (R2-S09, N-14): "Bin by the hatch is Derek Lawson's file, and it isn't Derek's handwriting on it. It's the only place anyone wrote down why he did what he did." What it buys: the one answer m09 gives m01 (on `surrender`, why he put the device down; on every value, his fall costed in advance, "Expected loss of asset: total."), and a second sample of the hand (Beat 2.2: "Two samples. One pen."). In m10 it is a record answer under Tesseract's first claim (stage 3 §3.1). It is the default: a player who presses neither keeps it.
   - **The other bin:** by default **the Initiative's letters to Social Fabric**. They are Jesse Tran's trade route, with his drop and his handler in them, and the last letter is Social Fabric's next job, briefed to the Initiative: Teresa Villanueva, 41, a union rep at the Butte copper mine, about to be ruined by a fabricated affair and a leaked medical file. The brief quotes her: "She says 'we' when she means the men on the night shift." HaX: "The other's the Social Fabric letters. Last one's about a union rep in Butte they're about to bury. One of them's ash in a minute." What they buy: Villanueva warned (HaX, on taking them: "Arakawa's ringing Butte. She'll hear it from us first."; confirmed in Beat 2.7), and a lever on Tran (Beat 2.6). On `m01_maya_ko` the letters give back what Maya's names would have given (HaX: "That's the warning we didn't have."). Villanueva is named only in documents and HaX's lines; she never appears. On `m08_nightshade_tidied` this bin instead holds **the copy Nightshade sent ahead** (row 113): what he cleared from his locker, in his words ("So that's what he had time to clear."). HaX: "The other's what Nightshade cleared from his locker. His own words on what he took. One of them's ash in a minute." It changes his reply to his file on the triple-agent branch (stage 2 §2). What he kept is "his notes" (the Architect's notes to him), never "letters".
   - Buttons at the hatch: **[Pull Derek's file through.]** / **[Pull the letters through.]** (or **[Pull Nightshade's copy through.]**); on Victoria's route, **[Take Derek's file.]** / **[Take the letters.]** (or **[Take Nightshade's copy.]**). Each button gives the file by id (`derek_file`, `letters`, `nightshade_copy`) from the record that hosts it, `sorensen_hatch` or `sorensen_door`, both of which hold all three (stage 5 §3.6–3.7). `cage_bin` (`derek_file` / `letters` / `nightshade_copy`, exported; `cage_opened` writes `derek_file` if the player took neither). The debrief does not read the bin back (§7.1); HaX names the loss once in Beat 2.7.
3. **The recognition.** Before the player can act, Sorensen ends the bluff herself. She quotes the player's file at them from memory, because she filed it (row 101): one line per value of the Reading's first entry, in her words (stage 2 §3 has every line). A cold-start player hears the second entry's never-played form ("Your first days aren't in your file. Somebody at SAFETYNET is careful with you.", W-10). Then: "You're not from the lease-holder. You're the one he writes about." HaX: "...She's got a file on you." This is the act's first spike.
4. **Why she lets the player carry on** (W-25). She keeps stamping and keeps the reel on her hip. If the player is plainly cloning or lifting: "Take the print if you like. By the time it matters, the shredder will have caught up."
5. **The choice** (every player): pull one bin through the hatch; she passes the file across. Sorensen tips the other into the shredder as the player does, without hurrying. If the player skips the hatch and opens the cage, the bin by the hatch (Derek's) survives and the other is gone. Either way, by the time the cage opens one bin is ash.
6. **The cage opens.** The player goes through the gate, and Sorensen is at the shredder's feed inside. HaX, as the player enters: "That cabinet takes a print. She stamps everything." Sorensen keeps feeding the shredder and does not fight (a non-combat "keeps shredding" state for stage 5; E-2). An arrest alone doesn't stop her; she answers it without looking up: "When I've finished, dear. You'll want the list to be complete." (stage 3 §4.3.)
   - **What she has left: the legacy files.** The last box of the night's run is the Initiative's legacy placement files outside SAFETYNET, in her own hand, the work she is proudest of. The SAFETYNET placements are not in it: when the Architect took WREN's tasking, those files went onto the Recruiter's tape, by codename only; the key from codename to person was the Recruiter's alone, which is why her name is worth buying (milestone D-01). The box never names WREN; HaX, on reading it: "Nobody of ours in here. Ours are on her tape, by codename." It is open on the shredder's feed table, behind her, with the feed running, so taking it means going through her.
   - **The clock, named.** As the cage opens, if the box is on the feed table, HaX: "That box behind her is the last of the night. The legacy files. She gets to it the moment you go past her to the cabinet, or walk out of this cage. She won't stop for asking." (The cage is its own room, stage 4 P4, so "walk out of this cage" is the line; "cabinet" as FINALE_ARC §6.1 has it.) If Noor held it back (warned in time, Beat 1.2): "The legacy files are under Noor's desk. Let her shred the rest." It goes under the shredder at the first of the player taking Nightshade's file from the plan cabinet or first leaving the opened cage (the same event the Recruiter's call waits on).
   - **Her options** (`sorensen_fate`: `ko` / `talked` / `left`, default `left`). Knock her out: the shredder stops; HaX, once: "She's sixty-six."; before the clock runs out, the legacy files are the player's to read (`legacy_files_saved = true`, exported); after, HaX: "She's done with that box." Talk her down, after the plan cabinet, with Nightshade's file in hand (her own pencilled query says it was kept off her schedule): **[He kept his own papers off your list. Only yours burn.]** She sets down the stamp, and the shredder stops: "Then I'll keep what's left. Give me a pencil. I'll write down what I've destroyed, accurately." It stops her without turning her, and the legacy files are gone if they were at risk. Leave her: the shredder runs all night. She will not say WREN's name, now or later ("I keep records. I don't read them aloud."). A knock-out after `talked` keeps `talked`. "Still free" (the printed-binder rule, Beat 2.3) means `sorensen_fate == "left"`. Her card drops when she is down; her print stays on the stamp. Before the player reaches the hatch, after flag 2, HaX texts once: "She's still feeding it."

### Beat 2.2: Nightshade's file and the hand (3 minutes)

In a locked plan cabinet in the cage's far corner, so the walk from the gate runs past Sorensen and her feed table, never on a trolley: Nightshade's recruitment file from fifteen years ago, when he was 23 and in the intake SAFETYNET's chief strategist was teaching (row 106). Every annotation is in one hand.

**The exemplar** (S-05). The scanned notebook beside HaX's case file (Beat 1.3) is her own notebook from that course, with her teacher's margin notes in it. The player compares the hands; it is document work the player does (stage 0 §2.2). On a saved Derek file, his costing page is a second sample ("Two samples. One pen.").

**The comparison, made honest** (stage 4 P17). When the player picks up the file, HaX texts: "Hold his file next to the notebook scan in my case file. Then tell me what you see." Her hub then asks the question, and if the player hasn't read the scan she sends them to it first. Three answers: **[Same hand.]** completes it; **[Different hands.]** gets "Look at the loop on the g. Then look again."; **[I can't tell.]** gets "Put the scan beside it. Same pen pressure, same crossed sevens." A wrong answer costs a line, nothing more. On "Same hand.", HaX, after a moment: "Those are my notes. That's his pen." Then, before the player can ask: "Hold that. I want it from two directions before anyone says a word." She says nothing more until flag 3. A player who never answers has it closed inside the identity scene, where HaX says it for them (Beat 3.3), so it can't hang open. The salvage cage's Tomb Beta binders confirm the hand again in Act 3 (Beat 3.2). The m03 and m07 echoes are style, not handwriting ("You've read him before").

On `m08_nightshade_triple_agent`, HaX asks once, from her hub once the file is in hand, and names both sides (stage 3 §4.1): "He doesn't know this exists. Send it, and he stops being theirs. He stops being much use to us after, too." / "Keep it, and he stays useful. He never finds out what his teacher wrote about him." **[Send it to him.]** (`nightshade_shown_file = true`) / **[Hold it.]** (the default; the send stays in HaX's hub, reachable from any room, until the debrief; stage 4 P8). Sent, he texts back once (stage 2 §2), and in m10 he picks a side out loud at the door, so his channel is spent. Held, he never finds out, and his channel survives the raid (row 105).

### Beat 2.3: The ledger and flag 2 (7 minutes)

The ledger shelf in the cage holds the Initiative's printed ledger in a locked binder, codenames only, unreadable without the key the live copy carries.

**VM flag 2** (the Insider Threat Initiative's live ledger): submitted at the drop terminal in the reading room, one door from the restricted stacks. It can come before or after the cage. HaX's one VM steer, if asked, is a story-level line (stage 4 §7.1). HaX reads it aloud in story terms: twenty-three placements, forty-seven candidates, and a legacy section older than any list m05 found. One legacy entry, under the codename WREN, was updated on day 10 in Sorensen's hand: "assigned TF Null, Montana operation".

- HaX: "Montana operation. Day ten. That's one of the four you met at the briefing." (R2-S07: UTC.) Then the rule: she has told Netherton; he will say nothing to the team; "and neither will you."
- **What m05 changed** (rows 63, 64, 64a), one line on the page and at most one from HaX: on `public_exposure` the twenty-three are marked "blown"; on `turn_double_agent` Torres' entry still reads "live", because the Initiative never learned he turned; on `combat_lethal` it reads "closed placement" in Sorensen's hand and HaX says nothing for a beat; on `arrest`, `combat_nonlethal`, or never played, "lost".
- On `m07_found_tomb_gamma` (row 95): "You bagged the dossier. 'Including the people.' This is the people."
- WREN's legacy entry carries a source code, "H&L", and a file number, which opens the optional cross-reference (Beat 2.5). The number is on the drop terminal's screen from flag 2 on, and in HaX's read.
- The printed ledger at the shelf becomes readable: optional, for the player who wants the page in their hand. It holds two small finds: on Reeves in custody (`m02_reeves_fate` in `arrested`, `ko`, `flagged`, or the read rule on `m02_insider_asset_arrested`; rows 21–22), his handler's contact sheet, clipped inside, as an object with no voiced line (W-23); and Noor's codename on the candidates' page, which the player can show her (Beat 1.2). If Sorensen is still free (`sorensen_fate == "left"`), she shreds the binder once it has been read; nothing is lost, because the flag holds it.

### Beat 2.4: The Recruiter's call (5 minutes)

**When, and what guarantees it** (S-03, S-04, R2-S01, R2-S02; each is a stage 4–5 lock or condition):

- The call fires once **flag 2 is in, HaX has read the ledger, and the cage has been opened** (`cage_opened`), after a short delay, when the player is out of the cage and not in another conversation. It never rings inside the cage, and a room-entry backstop rings it after a reload (stage 4 §4 row 3). A player who submits flag 2 before the cage hears HaX read the ledger then; the call holds until they leave the opened cage. So the cage, the bins and the hand always come before the call.
- **The call's first line sets the defaults** (R2-S02, R3-02; stage 3 S3-09): `recruiter_offer = "refused"` with `deck_pulled = "alpha_tapes"` (nothing reads `deck_pulled` before `deck_choice_made`), and `recruiter_secret` by branch (`kept` on sold-and-lied, `confessed` on sold-and-confessed, `""` otherwise). Every button writes a complete legal pair: `taken` + `none`, `double_crossed` + `her_file`, `named` + `her_file`, `refused` + `alpha_tapes`. `sleeper_named` is set on her naming line, never on the button. Its done-flag, `deck_choice_made`, is set on its last choice. If the call is closed before that (a hit, or a reload; Escape does nothing on a forced call), it rings again on leaving the room and resumes at the last unanswered choice, so the spring is never skipped. §11 gives the same rule to every forced phone scene. Two resume points after a "yes" (stage 3 R2-03): closed between "yes" and the name, the Recruiter re-rings and says it ("You hung up on the part you paid for. Halina Kowalczyk.", which sets `sleeper_named`); closed after the name, she has gone, so HaX re-rings with one line that holds the wipe in the fiction ("I've paused the deck. It won't hold long."), then the unanswered choice.
- **Sorensen's office opens on `deck_choice_made`** (Beat 3.1; R3-01): the Recruiter fires the wipe from the deck's controller in Sorensen's office, and HaX follows the connection back to the room's door. With the office holding the tape room's key card, flags 3 and 4 always come after the deck choice. Sorensen's mail stays the recruited-Victoria route's alone.

Phone only, no face, as in m05. HaX stays on the line. The call is voiced, the Recruiter and HaX each in their own voice (`voiced: true`, F17; about 29 lines, stage 4 §6.7), and has no narrator line, since narration in a phone thread isn't voiced (stage 4 P12). The call has three openings and one spine, and it ends in the second purge choice.

**Openings** (row 61):

- **Sold and lied** (`m05_recruiter_deal_accepted and not m05_recruiter_deal_confessed`): the receipt and the offer in one breath: "Forty-seven names, and nothing points at you. Does your handler know? I'd like to give you one more name, and I'd like you to keep this one too." HaX has heard it. In m05 the player let the forty-seven go to her courier in return for a clean report, and never told anyone; no money changed hands (stage 3 S3-02). The player's choice (stage 3 §3.3), the call's first: **[She's right. I let her courier have the list in the spring.]** (`recruiter_secret = told`); **[She's fishing. I never dealt with her.]** (`denied`); or **[Hang up.]** (`kept`, the first-line default on this branch).
  - Own it: HaX, after a beat, "Noted. Later."; at Beat 2.7, "Last spring I'd have kept that between us. Not tonight."; then the offer, all routes open. HaX tells Netherton.
  - Deny it: the Recruiter, amused, "Of course. Shall we do business anyway?" HaX says nothing. The offer, all routes open: a liar can still buy the name.
  - Hang up: her half of the call ends there, so the deal is off and it plays as a refusal, in its own form with no Recruiter line (stage 3 R3-01). HaX, as an aside (it was a narrator line; stage 4 P12): "Her counter's running." Then: "She's wiping it. She thinks it's gone." Then HaX's file/tapes line (spine step 4), "One of them. Now." and **[Her file.]** (`named`, `her_file`) / **[The Alpha tapes.]** (`refused`, `alpha_tapes`). HaX asks about the spring once, later, and lets it lie.
- **Sold and confessed** (`m05_recruiter_deal_accepted and m05_recruiter_deal_confessed`): HaX cuts in first: "We've talked about that. She has nothing on you." The leverage dies on the line, and the Recruiter goes straight to the offer (`recruiter_secret = confessed`).
- **No deal in m05, or never played:** she introduces herself. A player who finished m05 without taking her deal (refused, or never offered terms) hears a line that fits both (S-11): "Last time I said the next one would cost me more. This is the next one." A cold-start player gets a stranger who already knows their designation and their kit.

**The spine** (every player):

1. **Her grievance, as accounting** (S-18, W-18). The Architect has taken WREN's tasking for Montana: WREN still reports to the Initiative and draws its money, but her orders now come from him, not from the Recruiter. And his order is burning her records office. "Eleven years of placements, written off in a night for his schedule. I'd like something back on the books."
2. **The offer, and its price: the whole deck** (stage 3 §3.2). Every cost is said aloud on the call, before the answer; nothing rests on an unvoiced text. No pronoun for WREN before the name: the Architect is named, and WREN is "my placement" and "them".

   > The Recruiter: One of your four is mine. Was mine. Your Architect took my placement for Montana and didn't ask. I'll give you the name tonight. The price is the deck. All of it goes.
   >
   > The Recruiter: Say no and I wipe it myself. Same deck, no name.
3. **The price of a double-cross, said before the choice**:

   > The Recruiter: I can't see which tape you pull. I can see that you pulled one. Pull anything after you've had the name, and I'll ring my placement and tell them they've been sold. You'll have bought nothing, and half my people will have moved by morning.
4. **HaX names what is on the deck, and what each is worth**, on the open line, before the player answers (W-04, N-01): the Recruiter's file, a tape with her handler list (by m05: the handlers for the twenty-three; on `public_exposure` her handlers and the forty-seven; on `turn_double_agent` the names Torres could not give; the SAFETYNET placements on it by codename only, D-01), and Tomb Alpha's tapes, his teaching sessions from the first workshop, recorded, with annotation sheets in his hand: "Her file is her network, all of it. The Alpha tapes are him teaching, recorded. He teaches what he'll do. If he built the bunker the way he taught it, it's on there." Then her boast, said where the Recruiter hears it: "I can beat that wipe." The Recruiter: "Nobody has." (Which is why, on a refusal, she wipes her own file first and drops off sure it's gone.) Then the invoice, priced as a moral cost: "Buy from her and SAFETYNET goes in an ENTROPY ledger. The Architect's orders are in that ledger already. He'll read the sale, and he'll quote it at you." ("Already" points at WREN's day-10 entry, written in Sorensen's hand on his orders.)
5. **The answer:** **[Give me the name. Let the deck go.]** or **[No. Keep your name.]**
   - **After a yes**, she names her: "Halina Kowalczyk. Her mother's care home has had my cheque every month for eleven years. She gave you something at the briefing, I expect. She's generous. It's how we hired her." (N-09: WREN's reason, said as an expense; `sleeper_named` is set on this line.) On "thanked Kowalczyk" at the briefing, HaX: "You thanked her at the briefing. Keep doing it." (W-19.) She hangs up and fires the wipe. HaX: "She's watching the deck. Pull her file and we get half her people. She warns the rest, and Kowalczyk runs." Then **[Leave it. Let it wipe.]** (`taken`, `deck_pulled = none`: both tapes go under the degausser's whine) or **[Pull her file anyway.]** (`double_crossed`, `her_file`). Buying from her leaves **an invoice in the Initiative's books** (R3-04, R4-08): on `taken` or `double_crossed`, once the player has been in Sorensen's office for a little while (held there so the seam after "Afterwards" stays quiet; stage 4 §6.6), the drop terminal's ledger view gains a line in Sorensen's columns, and HaX texts it: "Sale. WREN. To Agent 0x00. Consideration, one deck. Booked." / "She's booked you. You're in her ledger now." m10's Tesseract quotes it (§14 change 30).
   - **After a no**: "Then I'll tidy my own desk. *(beat)* Gone. Goodnight, agent." She wipes her own file first and drops off, sure it's gone. HaX: "She watched the counter. Not the copy. One of them. Now." Then **[Her file.]** (`named`, `her_file`; HaX reads the first handler off the tape, and "One of four. Two, if that firm's boxes say so.") or **[The Alpha tapes.]** (`refused`, `alpha_tapes`). Because she believes her file was wiped, she warns nobody, and the whole network can be rolled up. The tape not pulled is wiped.
   - **After a hang-up** (sold-and-lied only): the hang-up form above.
   - There is no "pull nothing" button. `taken` means nothing is pulled; refusing always saves one tape.
6. **The call's last lines**, every route: HaX, "She fired it from Peg's office. I'm on the door." and "Her card for the tape room will be in that office." Aims 4 and 5 open together.
7. **After the deck, on `double_crossed`**: HaX reads the first handler off her file ("First name on it is a handler in Baltimore."). When the player first enters the tape room, a text from her, unvoiced: "You took the name and something off my deck. I said I'd know before your plane landed. It's still in the air." She knows something was pulled, not what. She rings WREN aboard the aircraft, as she said she would; in the hangar Kowalczyk isn't there (§7.1). The Recruiter's answer waits for the m10 epilogue ("I'll remember the shape of you", row 60).

**Why it is a dilemma for every player** (stage 3 §3.2, which replaces stage 1's six routes). Each route gets one thing and loses one the player has just heard priced:

| Route | Felt in m09 | Loses | m10 |
|---|---|---|---|
| **Take** (`taken`, `none`) | the name, and every face from the briefing changes; both tapes go under the degausser; the ledger line booking the sale; in the hangar, thanking WREN to her face | her network, both tapes, a clean record | Kowalczyk cuffed at the briefing; no whodunit; his ledger sting on the invoice; an "Elsewhere" clause in the credits: "The Recruiter: at large, her people at their desks." (milestone MS-04; m10 stage 7) |
| **Double-cross** (`double_crossed`, `her_file`) | the name, then her file (the first handler read off it); the invoice line; her text at the tape room; Kowalczyk gone from the hangar | both tapes, half her network (warned), a clean record, the player's word, and the name's use: WREN is warned and gone | WREN off the team and not detained: a known face beside Tesseract at the core, taken as she moves, nobody wounded; no whodunit; the invoice sting; "About half of them. She warned the rest." |
| **Refuse, her file** (`named`, `her_file`) | no name; her file saved, the first handler read; no invoice | certainty about WREN, the tapes | the whodunit runs; the clean-record answer; her network rolled up from 06:00 (arrests held so WREN hears nothing, D-01); "Elsewhere": "The Recruiter's network: rolled up." unless the cells ledger already took it |
| **Refuse, the Alpha tapes** (`refused`, `alpha_tapes`) | no name; after the identity scene a short voiced clip of his teaching from the reel deck in the tape room (F12, Beat 3.2), and the decode; no invoice | certainty about WREN, her network | the whodunit runs; the clean-record answer and the Tomb Alpha record answer; HaX's service-door warning at the core, so Quintero takes WREN unhurt after Tesseract has refused her; "Elsewhere": "The Recruiter: at large, her people at their desks." |

Take against double-cross: take keeps WREN in custody from the start and the player's word; the double-cross trades both for half a network, and the core still goes cleanly. Double-cross against refuse-her-file: half a network and a WREN the player can see coming, against the whole network, a clean record and a hidden WREN with a whodunit that can go wrong. The tapes are the only route that hears him, and the only refusal that spares Quintero at the core.

### Beat 2.5: The cross-reference, optional (4 minutes)

WREN's entry points at Harwick & Lowe, an executive search firm closed years ago, whose dead files are deposited for retention in the open stacks like any other client's boxes. A bay label makes the boxes findable from Act 1 ("HARWICK & LOWE, EXEC SEARCH (CLOSED). RETENTION 25 YRS."); the box takes the file number on a keypad, so neither the picks nor the cracker opens it early (stage 4 P10). The file number leads to a placing sheet, not a name: two lateral hires placed with "a government client" in the same quarter eleven years ago, both still at SAFETYNET, both on Task Force Null. H. Kowalczyk and M. Quintero. Harwick & Lowe placed real candidates as cover, and Quintero is one of them. Each sheet lists next of kin in the same dull type, and both list a parent in residential care (W-08): for Kowalczyk, her mother, which is the human fact under WREN's eleven years; for Quintero, her father, which is a coincidence that the file cannot tell apart. Reading the sheet sets `sleeper_shortlist` (a new export, §14 change 6), whatever the order: m10 reads `sleeper_named` first (R2-S13). On "backed Quintero" at the briefing, HaX: "You took her side at the briefing. Keep it. Don't take her word."

The question a player of m05 will ask, answered once by HaX at the sheet (R2-S08): "After Quantum Dynamics we checked everyone TalentStack ever touched. Harwick & Lowe shut before TalentStack opened."

On `m05_torres_turned`, **Torres rings** from his desk inside the Initiative as the player opens the boxes after flag 2, or, if they never do, once a little after they take the Reading from Sorensen's safe (S-12, R3-10: never before WREN exists; stage 4 §6.6 moved the fallback past the Act 2–3 seam). He knows the legacy filing scheme (one step off the search) and says the line only he would know about the forty-seven: "They pick people with someone to lose. Look for the ones with a sick parent." On the shortlist it lands on both women, and on Noor. It does not decide between them. He also says, once: "I gave you this address in the spring. It was a line in a list."

### Beat 2.6: Tran and the tape side, optional (3 minutes)

Jesse Tran runs the rest of the tape side's wipe from the server closet, a small room off the open stacks' east end: the Initiative's legacy recruitment interviews, optional lore. He is Social Fabric's agent on the staff (row 6). On `m01_maya_ko`, if he sees the player first at the closet door, he calls in a second guard (avoidable), who appears by the shutter in the open stacks. The guard is a new face and needs a name and a sprite (stage 4 P14; stage 2 §3). HaX's hub tells the player where Tran is and what talking him off needs: "He's wiping tapes from the server closet off the open stacks. You'd need something he wants to talk him off it. Otherwise it's a fight." Stopping him saves whatever of the tape side is still unwiped; it never saves the deck, which the Recruiter wiped herself. Three options (stage 3 §4.4; `tran_outcome`: `talked` / `ko` / `left`, default `left`; there is no separate arrest):

- **Talk him off it** (needs the letters from the cage): **[You can explain these to Social Fabric, or to me.]** He states his price before the player agrees: "Fine. It's off. I walk out that door, and I make a phone call on the way." **[Go.]** (`talked`: no fight, the tape side saved, and Social Fabric knows SAFETYNET has its letters by morning) / **[No deal.]** (back to the other options).
- **Knock him out** (`ko`): a fight, and on `m01_maya_ko` the guard he called; the tape side saved; he is held and says nothing.
- **Leave him** (`left`): the tape side is wiped. No risk.

### Beat 2.7: Afterwards (1 minute)

After the deck, once the player is moving again, HaX rings unprompted, once (W-03, orchestrator ruling). She names what the purge cost, once and plainly: which bin and which tape are gone (on `taken`, both tapes). On `cage_bin == "letters"`: "Arakawa got Villanueva. She wanted to know who'd bother." On `recruiter_secret == "told"`: "Last spring I'd have kept that between us. Not tonight." A pause. Then three words, and one sentence that is new:

> Agent HaX: Afterwards. Not during.
>
> Agent HaX: It's yours to carry. Nobody else signed for it.

Then, unasked, the beat's last line: "The rest when this is over. Her office is past the binders." (R3-06; §14 change 15.) m09 never says what the rest is; m10 pays it at 06:00 (agreed with the m10 author, whose confession-promise wording matches this one). She does not say whose line it is. On `m07_architect_echo_heard` the player already knows who said it to them, and she knows they know; she doesn't add a word. This also lives in her hub, once, for a player who closed the call early. It rings a few seconds after the Recruiter's call closes, while the player is still on the move (stage 4 §6.6); Torres' fallback now waits for the safe (Beat 2.5), so the two no longer meet on one walk.

**Act 2 ends** with WREN named, or narrowed to two faces, or one of four; the purge's two losses named; and three words from HaX. Aims 4 and 5 open together on the deck choice: "Search the director's office" and "Take Tomb Beta's server", so the player sees at once that the tape room needs something from the office.

## 6. Act 3: The name and the hour

About 31 minutes, two VM stages included. Aims 4 and 5. Three rooms on the critical path (Sorensen's office and the tape room, each one door off the restricted stacks, and the salvage cage one door past the tape room), no walk-backs (S-01).

### Beat 3.1: Sorensen's office, the safe and the Reading (6 minutes)

**Getting in** (R2-S01, R3-01; stage 4 P7, P11): the office door, on the west wall of the restricted stacks and in view all through Act 2, has a keypad off the card system that takes a code nobody has (so the cracker, which works only on PIN locks, can't open it early). Before the deck HaX says: "Her keypad's off the card system. Leave it for now." On `deck_choice_made` HaX unlocks it from her side (F19). The Recruiter fired the wipe from the deck's controller in this office, and HaX traced it: "She fired it from Peg's office. I'm on the door." So the office (and the tape room's key card) always comes after the deck choice.

A county clerk's office, moved across town: a wall of binders, a kettle, a framed certificate for twenty years' service to Lewis and Clark County, and the deck's controller the Recruiter fired the wipe from. The floor safe opens with Kowalczyk's cracker, or the long way: every page of the rent book on her desk is headed with the lease's start date, which is the PIN, for a player who reads rather than picks (stage 4 P16; the old desk-drawer note is gone). HaX: "Kowalczyk's toy. Tell her it worked." On `sleeper_named`: "Her cracker. Use it anyway."

**The safe** holds the tape room's key card, the master destruction schedule, and the Reading (S-01, S-17, R2-S03): a thin file, the Architect's reading of Agent 0x00 (row 101), four entries and a last page, in his written register (stage 2 §5). Finding it is an aim-4 task ("Take the file Sorensen quoted from"); reading to the last page is optional and sets `reading_finished` (the last page is its own sheet in the safe). The player reads it alone; HaX says nothing while it is open. The Reading also has one line about her (W-13): "Their handler will cover for them. She was taught to." Afterwards HaX asks once whether the player wants to tell her what it says. Telling her includes that line, and she hears it just before her confession; not telling her keeps it from her.

**The four entries** (row 101; FINALE_ARC D-06): m01 `final_choice`, the innocents line, m04 `disclosure_choice`, m07 `debrief_stance`, each with a never-played form; wording in stage 2 §5. **The last page** predicts that when the hour comes 0x00 will be in the room with the key in reach, and will press it (FINALE_ARC §1.2). Finding it on the page in his words is the second half of the cage's spike.

**The bin note** (W-26, settled by stage 3 §4.6). One pencilled line in his hand in the last page's margin, written before tonight, the same for every player, outside the four entries: "They will save Lawson's file. They will want to know why he did it." It sets nothing. On `cage_bin == "derek_file"` (the default too) he guessed them right; otherwise the player has seen him be wrong before m10 asks them to prove it (m10: "Then I was wrong about two things." on `m09_reading_finished and m09_cage_bin != "derek_file"`).

**The destruction schedule** (S-07, R2-S03). The master copy that came with the order, in the safe, so every player holds it. Down the margin is Sorensen's planning pass from before the night: each room of the building, its series checked against the order, ticked as covered: dock, front desk, reading room, open stacks, closet, stacks, cage, office, tape room. The salvage cage's line is there with no series against it and no tick (the server stands in the salvage cage, stage 4 P1). On the same page, her one query: "Reading (safe); plan chest: not listed. Keep?" (R3-07: two of his own things, kept off the order.) Reading the page sets `schedule_read`. The game doesn't point at the gap until flag 4.

**The office files**, four objects, each with its own carry-over line and none excluding another (the lease file is the aim-4 task "Find Tomb Gamma's deed and construction file"; the others are finds with no task) (W-23; milestone D-07, which split the lease file's old priority list so a careful player hears every payoff they earned):

- **The lease file** for the bunker's land and buildings, held for the lease-holder, Zero Day's front company (m03). It holds Tomb Gamma's deed and construction file: the paper half of the defences, and on the no-coordinate branch the bunker itself ("There it is. Tomb Gamma has an address." Elsewhere: "Same coordinate Nightshade gave us. Now it has a lease."). Its carry-over line: on `m03_victoria_fate` `arrested` or `ko`, Victoria's keys (or seized devices) opened Zero Day's client list in the spring, and this lease was on it.
- **The rent book**: the lease's payments, every one from the Crypto Anarchists' account (m06), each page headed with the lease's start date (the safe's PIN, above). On `m06_irina_recruited`: "Irina's account paid for this. Tell her it bought us the deed." (row 74.)
- **Zero Day's note on Danny Foster**, one sheet in the lease-holder's correspondence: its line by `m03_danny_fate` (row 36), whatever Victoria's fate.
- **The refit ledger**: what the bunker's refit cost and who paid. On `m02_paid_ransom`: "St. Catherine's money. It bought the blast door." (row 17).

### Beat 3.2: The tape room and the salvage cage (5 minutes)

Two doors, two locks (stage 4 P1: a door has one lock, and a flag station ignores a lock on itself, so the card and the code need a door each). **The tape room**, off the restricted stacks' north wall, takes the key card from the safe. Before it, the reader refuses and HaX says: "That reader wants a real card. Hers will be somewhere she trusts." Inside: tape racks to the roof, blue standby LEDs and cold air (stage 5 P22). Framed on the north wall, beside the keypad of the mesh door at the back, hangs the archive's shelf-code legend.

**The salvage cage**, through that mesh door, takes a code. The code is the catalogue line flag 1 turned up, already in the player's notepad; the legend on the wall is its key, and the player runs the line through the CyberChef workstation (stage 4 P20: stage 6 picks an encoding CyberChef performs in one or two operations with a key the legend supplies). On `m02_gary_protected`, **Gary Whitlock rings** when the player first tries the keypad (row 23) and names the operation. Without Gary, HaX's hub quotes the line and says: "The chart on the wall beside you is their key. Run it through the workstation." Code and key are both at hand in the tape room, so there is no walk back.

The salvage cage is a small mesh pen, and in it, among what came out of Tomb Alpha and Tomb Beta when they closed, is Tomb Beta's last server, still racked, still running, its fans and status lights the only warm thing in the building (P22). Beside it: its flag station, the only one that takes Tomb Beta's flags, and a second link to the field kit so nobody walks back four doors to type; a door controller with its wires cut; crates stencilled ALPHA and BETA; a printer tray that is empty until flag 3; and, in a crate the picks open, Tomb Beta's enrolment binders, annotated in the same hand as Nightshade's file and HaX's notebook (optional). The rest of Act 3 happens here: the identity scene, flag 4's read and Tesseract's call are phone scenes heard in the salvage cage.

On the Alpha-tapes branch (`deck_pulled == "alpha_tapes"`), the tapes HaX pulled play from a reel deck on a bench in the tape room (stage 3 §9 item 25; F12), only after the identity scene; before it HaX holds them: "I know whose voice that is. After." On the other routes the deck holds empty spools: "Empty spools. Degaussed." One clip, about fifteen seconds, his m07 voice fifteen years younger, treated as an old lecture-room recording, built as an ink conversation opened from the deck and voiced by TTS, with HaX's line spoken in her own voice (a typed transcript is the fallback):

> Dr Adrian Tesseract *(tape)*: The best lock there is opens for the right name. Nobody fights a door that's expecting them.
>
> Dr Adrian Tesseract *(tape)*: And build your own way out first. Always. Then let them build their way in.

HaX says nothing while it plays, then: "Tape two. He gave that lecture every year." The optional decode of their annotation sheets, on the CyberChef workstation from the start kit (S-15; stage 6 picks the encoding, the legend's operation or a different one), gives his first draft of the line, in his hand: "Carry it yourself. Let it hurt afterwards." HaX: "That's the version he taught us."

### Beat 3.3: Flag 3 and the identity scene (10 minutes, 7 of them VM)

**VM flag 3** (the owner of Tomb Beta's server): the credential text beside the flag is a SAFETYNET staff credential issued to Dr Adrian Tesseract before he left seven years ago, never revoked. Submitted in the salvage cage, at the station beside the machine (§14 change 12; stage 4 P1). The identity scene plays there, by phone, with the server's fans as the only sound in the room. It is voiced (F17): HaX and Netherton each in their own voice, about 29 lines in all (stage 4 §6.7), with Netherton's lines drawn under his name in HaX's thread.

**The trigger** (R2-S02, a stage 4 condition): the scene fires on flag 3 alone. If Nightshade's file is not held, HaX holds the name back: "Bring me his file. Then we say it." and the scene resumes when it is picked up. `identity_scene_done` is set on the player's answer, the scene's last choice; closed before that, the scene re-rings and resumes at the unanswered choice, on leaving the room or on flag 4's submission, whichever comes first (§11, R4-04). Flag 4's read waits on it, Tesseract's call waits on the read, and the conclusion waits on the call (R4-01), so nobody can ring HaX, or read the hour, before the name has been said, and `hax_confession_answer` is never empty. The scene carries the proof, the name, one sentence on who he was, at most one recognition line, HaX's confession with its cost, and the player's answer (FINALE_ARC §13 item 9).

1. **The proof.** HaX reads the credential's first line aloud and stops before the name. If the player never answered her about the hand (Beat 2.2), she closes it first: "You never told me about the hand on his file. I looked while you were busy. It's his." (stage 4 P17.)
2. **Netherton**, on the line from the aircraft taking Task Force Null to Montana, in its forward cabin with the door shut, where WREN can't hear (§14 change 7, R3-14). Row 125's line, unchanged: "I said we wouldn't name him until we could prove it. We can. Dr Adrian Tesseract." Then one sentence, for every player and cold starts most of all: "He was our chief strategist until seven years ago. He trained half my field officers." Then: "HaX." Nothing else (W-02, R2-S05). He stays on the line.
3. **HaX's confession** (rows 70, 98; FINALE_ARC §5.4). She says the rest herself: he trained her; she was his.
   - **Her first line is the recognition line, if any** (R2-S05, N-03; row 97 gives it to her): on `m07_architect_echo_heard`, "You heard him say it in Portland. My line. His line."; else on `m03_directive_decoded`, "You've read him before. Sterling's drive." (style, not handwriting, S-05). It comes before her form's first sentence, never in place of it (R3-05).
   - **Four openings** (N-12: labelled by import, since "the safe" in m09 is Sorensen's), chosen by `m06_architect_identity_found` and `m07_teacher_discussed`:
     - **m06 name found, teacher discussed:** "I told you on the handset he taught me." She gave the player the name after HashChain as Satoshi's guess; it was hers too.
     - **m06 name found, teacher not discussed:** the same, from a little further back: she called it Satoshi's guess, and has hoped since that it was only his.
     - **m06 name not found, teacher discussed:** "I told you somebody taught me that line. I didn't say who." She has known since the fund's file in m06; "keep it out of your notes" in m07 was her keeping it out of hers.
     - **Neither** (cold starts included): "There was a file on a crypto fund, with his name in it at eighty-seven per cent. I put it in a drawer. He trained me. I wanted the other thirteen." (N-04.)
   - **Every form then reaches the wall** (W-01, N-04). She had the name the night Fraser and Ferreira died in m07, and Netherton is listening: "Two cards on that wall. I had his name the night they died. I don't know if saying it would have saved them. I didn't say it." Netherton says nothing. His silence is the season's rhyme: in m08 he told the player "Two of ours are dead in the space between what I knew and what I did."
4. **The player's answer** (every player; `hax_confession_answer`). m06 name not found: "You should have told me." (`should_have_told`) or "I'd have done the same in your place." (`same_in_your_place`). m06 name found: "You should have taken it to Netherton." (said with him listening; `should_have_told`) or "I'd have sat on it too." (`same_in_your_place`). On every form, a third answer, her own line back to her: "Afterwards. Not during." (W-14), recorded as a third value, `afterwards` (N-17; §14 change 24). No answer is wrong. HaX replies in one or two lines (stage 2 §4.3); if the player told her the Reading's line about her, her reply knows it (N-05, drafted in stage 2). Then she gets back to work.
5. **Back to work.** "Seven years, and nobody turned it off. There's more on his box. A memo and a draft. Read them." (Milestone M-05: the leaver credential named once, in her voice; flag 3's field-guide offer can point at the leaver control. No lecture.) Then the Albion lines (Beat 3.4), and on the Alpha-tapes route: "His tapes are on the bench next door. When you want them." The scene ends there and hangs up; it never runs on into her hub.

### Beat 3.4: The Albion papers and the notice (1 minute, plus the optional send)

Flag 3's files hold three documents (FINALE_ARC §1.3): the catalogue entry for a flaw in the control equipment at Albion's site, marked "retain: operational value" nine years ago; Tesseract's memo from the same month arguing it should go to the vendor; and the vendor notice he drafted and never sent. Critical Mass came through that hole at Albion. They come off the box as one printed folder in the salvage cage's printer tray, and HaX summarises them in the identity scene's last lines (stage 4 P19: one object, not three, to keep Act 3's reading down).

HaX lands the m04 choice (rows 48, 57), one line by `m04_disclosure_choice`: `full`, the player told Albion's inquiry everything and SAFETYNET told the vendor nothing for nine years; `partial`, the player told half and SAFETYNET told less; `quiet`, the player kept Albion quiet, and so did SAFETYNET; never played or unset, the plain fact that Critical Mass came through this hole. The player learns his case is partly true before he makes it.

**What is still exposed, and what sending costs** (stage 3 §3.5). Shipped m04: Albion fixed its own site on every branch; on `full` every battery storage site was audited and its settings fixed. The flaw is in the vendor's controller, which also runs in water works and substations, outside that audit, and the vendor was never told. SAFETYNET's watch on Critical Mass runs on those sites. HaX, by branch:

> Agent HaX: Albion fixed its own plant. The flaw's in the controller, and that controller runs in water works and substations too. Four hundred sites, give or take, and every one still open. *(every branch except `full`)*
>
> Agent HaX: You told them how they got in. They audited every battery site and fixed the settings. The flaw's in the controller, and that's in water works and substations too. Four hundred of them. Nobody told the vendor. *(`m04_disclosure_choice == "full"`)*
>
> Agent HaX: That's where our watch is. If Voltage's people try that kit again, we see them. *(`m04_voltage_escaped`)* / If what's left of his crew tries it again, we see them. *(`m04_voltage_captured`)* / If Critical Mass tries it again, we see them. *(otherwise, cold starts included)*
>
> Agent HaX: Send it and the vendor starts on a fix for four hundred sites, and we pull the watch. They'll be crawling over that kit, and we can't be in it when they look. *(on `full` or `m04_crew_lost`:)* And Albion's inquiry gets to ask when we knew.
>
> Agent HaX: It isn't my call. It isn't yours either. If you're going to, don't ask me first.

The inquiry line plays only where m04 left a public inquiry (`full`, or any branch with `m04_crew_lost`, a new m09 Tier 2 import). **How disclosure actually runs** (the teaching point; stage 3 R2-04): a notice starts a clock and closes nothing tonight. The vendor acknowledges within hours, works to the usual deadline of about ninety days for a fix, and the fix takes a year or more to reach industrial sites, some of which never apply it. The watch goes dark at once only because SAFETYNET chooses to pull it: once the vendor is investigating that controller, SAFETYNET's own access would be found.

**The notice** (optional here, `albion_notified`): **[Send his notice.]** / **[Not yet.]** in HaX's hub, from any room, any time before the debrief (stage 4 P8); HaX pushes it through on the player's word. Before the player leaves the archive, she reminds them once if it is unsent: "The notice is still on his box. Netherton will ask." Sent: "Gone." A beat later: "Vendor's acknowledged. They're saying ninety days for a fix. Getting it onto four hundred sites will take a year." / "Analysis is pulling the watch. It's dark by morning." Unsent at the debrief, Netherton hands it to the player (§7.1), so every player decides.

### Beat 3.5: Flag 4, the hour and the key (8 minutes, 7 of them VM)

**VM flag 4** (full control of Tomb Beta's server), submitted beside the machine in the salvage cage: the job that still mirrors to Tomb Gamma. HaX's read is a text scene, not voiced (stage 4 P12; the user may still ask for it voiced, about 15 more lines). If flag 4 goes in before the identity scene is done, HaX holds the read: "His file first. Then the rest of his box." to a player without the file; to one who holds it but hasn't submitted flag 3, a line asking for the owner first (stage 7 words it); and a scene already started and not finished simply rings again (R3-08, R4-04; stage 4 §4 row 10, which cut "Finish with me first. Then his box."). The read is a forced phone scene under §11's rule: its done-flag, `hour_read_done`, is set on its last line, after the realisation (R4-01). In story terms it carries:

- **What the Publication is, and what the key does** (W-06, N-02). The whole stolen database goes out free, every entry with working detail. By default it goes **city by city, starting at 06:00 UTC on day 13**. There is also a key at Tomb Gamma's console that sends **everything, everywhere, in the same minute**, and it needs a hand on it. HaX: "He's giving it away. At six it starts going out, city by city. Turn that key and it goes everywhere in the same minute." Then: "Then why build a key at all?" Nobody answers it in m09. The question points at something real: the key makes it worse, faster, and needs someone to press it.
- **What it is not** (milestone D-02; the one line in m09 that draws it). HaX, once, straight after the two modes: "He'll call it full disclosure. Full disclosure is one researcher publishing one flaw after the vendor stops answering. His notice was the coordinated kind: vendor first, time to fix it. This is every weapon we hold, handed out at once." The player meets the coordinated kind in Beat 3.4's notice; this line keeps a student from leaving with the idea that the security community's full-disclosure practice is the villain's. m10 has its own line.
- **The head start**: the cells get it two hours early, at 04:00.
- **The defences**: the list of Tomb Gamma's defences, each built from an entry in the stolen database.
- **His casualty sheet**, signed, his original (the correction is m10's, FINALE_ARC §4.1): 1,100 to 2,600 dead in the first month, and the sheet says which release it prices (R3-12): "Release by key, all cities: 1,100 to 2,600. Fallback by city: fewer, later." "An acceptable price for the last arms race." It replaces the briefing's guess. HaX reads the range once and does not round it. On `m06_minder_walked`: "Kemal Aydin walked out on a smaller number than this." (row 77, moved here from the briefing, W-09.)

**The realisation, stated once** (W-05, R2-S03, N-06). At the end of HaX's read:

- On `schedule_read`, the player has two options: "Her schedule. This room isn't on it." or "Read me the defences." The first gets HaX: "No. It isn't. He shredded everyone but himself." The second skips it; the call still confirms.
- Without `schedule_read`, HaX states the fact from the job's side, once: "Nobody's wiping this box. Not her, not him."

The arc states it nowhere else; the call confirms it.

### Beat 3.6: Tesseract rings HaX (1 minute)

**The trigger** (R2-S02, R4-01): `hour_read_done`, so the hour, the key and the sheet always come before "take your time getting there". Its done-flag, `tesseract_call_done`, is set on HaX's last line of the report; the call has no choice, so closed early it re-rings and restarts from its first line (§11). He rings HaX, not the player. The player's line stays open and they hear her side only, voiced (F17; about 8 lines). His voice is never heard live in m09 (the Alpha-tapes clip, Beat 3.2, is fifteen years old). There is no narrator line, since narration in a phone thread isn't voiced; HaX opens her report with an aside of her own instead (draft: "He kept his voice down. He always did."; stage 7 words it; stage 4 P12). He calls her "Ninety-nine", as he did on the course, and she refuses it (agreed with the m10 author, §14 change 13). Her side (W-11):

> Agent HaX: ...Yes. *(beat)* I know it's you. *(beat)* Nobody's called me that since the course. It's HaX. It has been for seven years. *(long beat)* ...I'll bring them.

Then she reports it in four short sentences, as if it were any other call log, and her voice goes on the last: he called her Ninety-nine; the blast door will open for 0x00 by name; take your time getting there; and he asked whether they had liked his notes.

Music under the call is the `silence` playlist (F10; stage 2 §6). Her report ends: "Netherton's on the ground at Helena. Tell me when you're ready to come in." The conclusion aim opens on `tesseract_call_done`: report to Netherton (R4-01). The debrief starts when the player says so in her hub ("[Bring me in.]"), so an optional thread can still be finished first. `concludeRequires` stays the four flags only.

## 7. Closing debrief

A cutscene in a hangar at Helena's airfield, where Task Force Null's aircraft landed while the player was in the archive. Netherton is there in person; HaX is on the line from the Citadel and on the next plane. About four minutes. Opened from HaX's hub ("[Bring me in.]") once Tesseract's call is over, and reopened after a reload until its last line has played (stage 4 §6.5); `debrief_played` on the first line, the conclusion task completed on the last line, then `bond_visualiser` and credits (the m08 shape, lessons 42 and 46). Cutscenes are exempt from the one-voice rule (S-24), which is what lets Kowalczyk speak here.

The m02 shape: a face-to-face moment, a stance beat, a question hub so nothing is skipped, and a spine every player hears. It ends on the pen, not on m08's "Sleep" (W-16).

### 7.1 Beats in order

1. **Cold open** (Narrator). Floodlights, an aircraft with its ramp down, the team unloading cases.
2. **Kowalczyk** (W-07). Before Netherton reaches the player, she does, with a crate on her hip: "Well? Did my toy earn its keep?" Two short replies: warm ("It opened the safe. Thank you.") or flat ("It did the job."). She grins either way and goes back to the ramp. On a player who doesn't know, it is nothing. On `sleeper_named`, it is the scene: the player is thanking, or not thanking, WREN to her face, with Netherton walking up behind her. On `sleeper_shortlist`, it is half of it. (S-20: no line about Quintero watching her.) On `sleeper_named` with the flat reply, the narrator, as Netherton arrives: "He watches her go back to the ramp, and says nothing." (Stage 3 §4.7 replaces N-08's "Warmer, next time. She notices.", which promised an effect nothing delivers. `kowalczyk_reply`, local.) **On `double_crossed`** (checked before `sleeper_named`): no choice, because she isn't there. Her crate sits on the ramp with nobody to lift it, and Netherton reaches the player first: "Kowalczyk took a phone call when we landed and walked off the apron. Her phone was in a bin by the fuel bowser."
3. **Netherton opens with the hour**, as the thing that has changed: "Oh-six-hundred, day thirteen. Twenty hours. He has given us every one of them." Then the name, once, as a fact he can now say in a hangar.
4. **Stance** (every player; W-16). He has read the memo on the flight. "You've read his memo. Was he right?" Two answers, recorded locally (`memo_stance`) and paid back at the pen: "About Albion, yes." / "No. Not about any of it." Neither is wrong.
5. **The notice, if unsent** (stage 3 §3.5; forced). Whether it was sent in the archive is read from `debrief_notice_before`, which HaX's "[Bring me in.]" knot copies from `albion_notified` before the debrief opens, never from a value taken on the debrief's own first line (the debrief restarts at its knot after a reload; stage 4 §6.5). Unsent, Netherton hands it to the player straight after the stance, before the hub:

   > Director Magnus Netherton: His notice is still on that box. Send it, and the vendor starts on a fix for four hundred sites and the Critical Mass watch comes down tonight. *(on `full` or `m04_crew_lost`:)* The inquiry will ask when we knew. Hold it, and he can call us hoarders, and be right. You read it. You decide. I'll sign whichever.

   **[Send it.]** ("Then I sign it.") / **[Hold it.]** ("Then it waits behind Montana, with everything else."). A player can say he was right and still hold the letter, or say he was wrong and send it anyway.
6. **The question hub.** Each topic once; the spine follows whatever the player asks.

| Topic | What Netherton says, by branch |
|---|---|
| "The archive, sir." | At most two lines, the first two that apply in this order (stage 3 §8): Sorensen talked down ("She wrote down every box she destroyed. She even got the numbers right."); Sorensen knocked down ("Mrs Sorensen has a concussion and a lawyer. She has not said a word."); the legacy files saved ("Eleven names. None of them ours. Tonight that is the best news I have."); Noor knocked out, checked before her other two (`noor_ko`, milestone M-02: "Miss Haddad woke up at her own desk with a headache and two of Arakawa's people. She has asked who hit her. I have not told her."), else told ("Miss Haddad is in a hotel in Great Falls with two of Arakawa's people. She has not been allowed to ring her father. She asked twice.") or left ("Miss Haddad went home and rang her father. She is still on a list, and she doesn't know it."); Old Coyote knocked out ("He wants to climb power lines for a living. He will. Not this week."); Tran talked ("Tran left on foot. His handler is being watched, and knows it.") or knocked out ("Tran is in custody, and has asked for a lawyer and a phone charger."). Sorensen's and Tran's "left", and lost files, get no line. The bin and the tape are not repeated: HaX named them in Beat 2.7. |
| "WREN." | `sleeper_named`: "Halina Kowalczyk." (R3-13: the double-cross's network line lives in the Recruiter topic only.) `sleeper_shortlist` without the name: "Two names. I have worked with both for eleven years. One of them is lying to me tonight." Neither: "One of four. I have known all four of them for years, and it does not help." |
| "The Recruiter." | By `recruiter_offer`: `named`, "Her handler list is with Analysis. Ours are on it by codename only; she kept the key to the names. The arrests start at oh-six-hundred, day thirteen. Not before. WREN would hear." (milestone D-01: no arrest before m10's raid, so WREN goes into m10 unwarned); `double_crossed`, "About half of her network. She warned the rest, and she warned Kowalczyk."; `taken`, she is at large and her network with her, "You bought a name, and it was the right name. She'll sell the invoice." (R3-04, R4-08); `refused`, "She is at large, and you did not let her set the price." On `recruiter_secret == "told"`: "HaX tells me you said something on that call. I do not need to hear it twice." |
| "The notice." (only when sent in the archive; the debrief question covers the rest) | "You sent it without asking me. I would have said yes. I would have taken a week to say it." |
| "Montana, sir." | Goes to the spine. |

7. **The spine** (every player):
   - **The two names** (row 100). He reads them before he signs, in full: "Agent 0x19, Callum Fraser. Agent 0x6B, Ana Lúcia Ferreira." Narrator (W-22, N-10): "He reads the first name off the card. He doesn't look down for the second." No comment after.
   - **The order, and his reply to the stance** (N-07: the reply sits at the pen). "About Albion, yes" gets "Then I sign for him too." as he signs; "No" gets "Good. Then he can make that argument in court, and lose it." and he signs. On `m08_debrief_stance == "owned"`, his own name goes beside Nightshade's on the file, and he says so (row 109). On `defended`, one thank-you he does not explain.
   - **HaX, last on the line**, by `hax_confession_answer`: on `should_have_told`, she is telling the player everything from now on, starting with the bunker; on `same_in_your_place`, a thank-you, once; on `afterwards`, "You said afterwards. I'm holding you to it." On every answer, "the rest" she promised in the archive is still owed (§14 change 15).
   - **Why the team goes in together** (row 117), the last spoken line. `double_crossed` is checked first (stage 3 R2-02): "She knows we know. She'll be where he is. So will we." Not named: "If I bench four agents tonight, WREN knows we know. They come. You watch them." Named: "We take her at the briefing, in front of the others, where there is nowhere to go. Until then she sees nothing in my face. Nor in yours."
   - **The last image** (Narrator): he caps the pen. On `double_crossed`, no wave: "He caps the pen. Her crate is still on the ramp." On `sleeper_named` otherwise, across the hangar, Kowalczyk waves.
8. **Conclusion**: the last line completes `report_to_netherton` (the conclusion task) and sets `report_done`; then `bond_visualiser`, a five-line closing card and credits reading back the night's choices (drafted in stage 4 §9; stage 7 owns the wording).

### 7.2 What the debrief must not do

- List every carry-over again. The wall did the "previously on"; the debrief reads the night's own choices.
- Judge the confession answer or the Recruiter's deal. It says what each bought.
- Soften the casualty range, or give the Publication's hour in local time (FINALE_ARC §8 r8).

## 8. Mid-mission choices

Stage 3 owns the wording, the costs and the "does it matter" test: `../stage_3/moral_choices.md` §2 is the one table of the night's choices (letters A–N), §3–4 the costs and payoffs, §10 the state table. This section says where each sits in the story. Stage 4 kept stage 3's variable names and added the machinery globals (S4 §5). Stage 1's earlier numbering maps as below.

| Stage 1 # | Stage 3 | Choice | Where in this document | Sets | Forced by |
|---|---|---|---|---|---|
| 14 | A | The raid team | §3.3 | `raid_team_answer` | not forced |
| 10 | B | Noor (tell, show, leave; or knock out) | Beat 1.2 | `noor_told`, `noor_ko` | not forced |
| 13 | C | Old Coyote (talk past, tell him the truth, sneak, knock out) | Beat 1.1 | `old_coyote_told`, `old_coyote_ko` | not forced |
| 1 | D | The cage bin | Beat 2.1 | `cage_bin` (exported) | the cage opening |
| 11 | E | Sorensen (force, talk with Nightshade's file, or leave) | Beat 2.1 step 6 | `sorensen_fate`, `legacy_files_saved` (exported) | not forced |
| 6 | F | Nightshade's file | Beat 2.2 | `nightshade_shown_file` (exported) | not forced; HaX asks with two buttons |
| 2 | G | The Recruiter's offer and the deck | Beat 2.4 | `recruiter_offer`, `deck_pulled`, `sleeper_named` (all exported) | `deck_choice_made` opens the office |
| 5 | H | Own the spring, deny it, or hang up | Beat 2.4 | `recruiter_secret` (exported; adds `denied`) | the call's first choice |
| 12 | I | Tran (talk, knock out, leave) | Beat 2.6 | `tran_outcome` | not forced |
| 8, 9 | J | Read the Reading to the end; tell HaX its line about her | Beat 3.1 | `reading_finished` (exported), `reading_told_hax` | not forced |
| 3 | K | The answer to HaX's confession | Beat 3.3 | `hax_confession_answer` (exported) | flag 4's read waits on `identity_scene_done` |
| 7 | L | The notice | Beat 3.4; debrief beat 5 | `albion_notified` (exported) | the debrief's spine, if unsent |
| 4 | M | The memo stance | debrief beat 4 | `memo_stance` | the debrief's spine |
| 15 | N | Kowalczyk in the hangar | debrief beat 2 | `kowalczyk_reply` | the debrief's spine |

Renames from stage 1 (stage 3 S3-12): `cage_bin_saved` → `cage_bin`; `tran_stopped` → `tran_outcome`. Stage 1's separate "arrest" options for Sorensen and Tran are gone: an arrest doesn't stop Sorensen, and Tran is talked, knocked out or left. W-26 is settled: the bin note is a margin line on the Reading's last page (Beat 3.1). Nothing on this list, and no import, gates `concludeRequires` or the critical path.

## 9. Climax and the hook into m10

**The climax is two documents and a phone call.** m09 is the investigation half of the finale, and its climax should feel like the floor giving way under a reader:

1. The identity scene (Beat 3.3): the name said by the man who promised not to say it, and the handler admitting what she sat on and what it cost, with him listening.
2. The casualty sheet and the key (Beat 3.5): 1,100 to 2,600, signed, and a key that needs a hand. The "moment of horror" the 02 prompt asks for, found in play, worse than the briefing guessed.
3. The player's own realisation that the server was left for them, and the call that confirms it (Beats 3.5–3.6). The player has spent the night racing a purge, and learns the man behind it wanted them to win this part.

Light combat stays where stage 0 put it (Tran's guard, Sorensen if pushed). A fight at the end would shrink the reveal.

**The hook** carries five things into m10, each said once:

- **The hour and the door.** 06:00 UTC on day 13; the blast door that opens for 0x00 by name; "take your time" (Tesseract via HaX). m10 opens on that countdown.
- **WREN.** A name the player holds and Netherton will act on at m10's briefing; on a double-cross, a name that walked off the apron and will be standing beside Tesseract at the core; or two faces from a closed firm's file; or one of four. "They come. You watch them." (or, on the double-cross, "She'll be where he is. So will we.") is the line that ends the mission's plot.
- **His case, already half-answered.** The Albion papers, and on `albion_notified` the notice already sent.
- **The key.** At 06:00 it goes out city by city; the key sends it everywhere in the same minute, and needs a hand. "Then why build a key at all?" is left open; with the Reading's last page it is the question m10 answers.
- **HaX's promise.** "The rest, when this is over." m09 never says what it is; m10 pays it at 06:00 (§14 change 15).

The last image is Netherton capping his pen. The music goes to the closing track on the pen.

**What m10 imports from m09** (FINALE_ARC §3.4; stage 3 §10): `nightshade_shown_file`, `sleeper_named`, `sleeper_shortlist`, `recruiter_offer`, `deck_pulled`, `albion_notified`, `hax_confession_answer`, `recruiter_secret`, `reading_finished`, `cage_bin` and `legacy_files_saved`: eleven exports in all, plus `m09_completed`. In m10, `m09_deck_pulled` is Tier 1 (the service-door warning); `m09_cage_bin` and `m09_legacy_files_saved` are Tier 2; m10's import count is 90 (Tier 1 40, Tier 2 50; FINALE_ARC §3.2, was 67 at stage 3). `deck_pulled` replaces FINALE_ARC §13 item 25's working name `alpha_tapes_saved` (R2-S13). m09 also adds `m04_crew_lost` to its own Tier 2 imports (the notice's inquiry line).

## 10. Cold start ("previously on")

Hacktivity can hand a player m09 first (FINALE_ARC §8 r2). That player is Agent 0x00 with the never-played canon of every earlier mission (FINALE_ARC §3) as their history. Every scene is written default-first, so this path is the base and every branch is an addition.

### 10.1 The wall of cards

One card per mission. HaX says one line per card, about eight seconds each. The played lines are gists here (stage 7 writes them, one fixed string per value); the never-played sentence is the canon (FINALE_ARC §3), with just enough of what happened for a player who has no history at all; it stays under about fifteen words.

**When most cards are unplayed** (milestone M-11: eight sentences about strangers in sixty seconds is too many). If five or more of m01–m08 are unplayed, the unplayed cards among m04, m05, m07 and m08 (the four the night leans on: Albion's flaw, the forty-seven and the Recruiter, the two dead and Austin, Nightshade and the database) keep their never-played sentence, and the other unplayed cards share one line from HaX: "The rest are files you can read on the plane." Played cards always get their own line. Stage 7 confirms the threshold against the timing.

| Card | Import(s) | Played (gist, one line per value) | Never played |
|---|---|---|---|
| m01 Viral Dynamics | `m01_final_choice` | fight: Derek Lawson put on the floor; arrest (or `""` with `m01_completed`): arrested, silent since; recruit: offered a deal, chose to be a martyr; expose: his projections on every front page; surrender: put the device down, still hasn't said why | "Viral Dynamics. Derek Lawson's cell planned a panic that would kill people. Arrested. He hasn't said a word since." |
| m02 St. Catherine's | `m02_exposed_hospital`, `m02_ghost_deal_accepted` | the board's cover-up published, or not; a deal with Ghost, kept or not; in every case, Ghost walked | "St. Catherine's, a hospital held to ransom. It recovered. Ghost, who did it, was never caught." |
| m03 Zero Day | `m03_victoria_fate` | recruited: Victoria Sterling turned and never used; arrested: in custody, with a CPS case; escaped: gone; ko: in custody and silent | "Zero Day, ENTROPY's exploit shop. Their Cardiff broker was never identified, and they kept trading." (Cardiff, as shipped m03; milestone MS-01) |
| m04 Albion | `m04_voltage_captured`, `m04_voltage_escaped`, `m04_disclosure_choice` | Voltage taken or gone; the report full, half or quiet | "Albion, a grid battery site. Critical Mass got in. Voltage, who led it, disappeared after." |
| m05 Quantum Dynamics | `m05_final_choice` | Torres turned, arrested, exposed or dead | "Quantum Dynamics. David Torres, recruited to steal the national dispatch network's keys. Arrested." |
| m06 The fund | `m06_monitoring_enabled` | the fund watched (HashChain tags), or found and lost | "ENTROPY's fund. Found, then lost." |
| m07 Portland | `m07_team_assignment`, `m07_team_redirected` | where the one team went, and whether Austin was reached | "Portland. One team, four sites. Austin was reached in time. Two of ours died at the others." |
| m08 The Mole | `m08_nightshade_arrested`, `m08_nightshade_triple_agent`, `m08_nightshade_ko_before_fate` | arrested (with Netherton's visit: "He said you'd know where to find him. He meant the door.", row 107); triple agent, at his desk and ours; knocked down, then handed over | "Nightshade, fifteen years one of ours, sent the threat database to Montana. He's in custody and saying nothing." (The canon sentence plus the one fact the stakes beat needs.) Netherton adds the visit line here too, as row 107 gives it to the never-played branch. |
| The two names | none | Fraser and Ferreira; not read (§3.1 beat 5) | the same |
| "-- A." | none | the suspect beat (§3.1 beat 6) | the same, without HaX's m06 aside |

### 10.2 The cold-start path through the night

| Moment | What the cold-start player gets |
|---|---|
| Briefing opening | HaX has sent them no "Same classroom" text, so her first line is plain: the leave is over, and she will explain on the way. Netherton's courier line uses the default (the Helena ticket). |
| The wall | Four never-played cards (m04, m05, m07, m08) and one shared line for the rest (§10.1, M-11). |
| The suspect | "ENTROPY's planner. Every card on this wall has his initial on it somewhere." Then: one of ours, once; no name until we can prove it. Nothing more until flag 3. |
| The cage | Sorensen quotes the Reading's second entry in its never-played form ("Your first days aren't in your file. Somebody at SAFETYNET is careful with you."). |
| Noor | A wary bystander whose card can still be cloned, and the choice to tell her (Beat 1.2). |
| Tran | HaX's neutral warning ("Viral Dynamics' staff files have a Tran in them."). |
| Nightshade | No call. His file in the plan cabinet is still the proof, and still in his teacher's hand. |
| The ledger | Torres' entry reads "lost". |
| The Recruiter | A stranger who knows their designation. The offer and its price are the same; HaX prices her file as the handlers for the twenty-three. |
| The notice | The generic Critical Mass watch; no inquiry line. Netherton asks at the debrief if it is unsent. |
| The salvage cage's keypad | No Gary; the legend on the tape room wall and HaX's hub line are enough. |
| The identity scene | The fourth form: HaX starts furthest back (the fund's file, eighty-seven per cent, a drawer), then reaches the wall like every form (the two dead, Netherton silent). Netherton's sentence on who Tesseract was is the "who is Tesseract" beat for this player. |
| The Reading | The never-played form of all four entries (stage 2 §5), which read as the Architect's notes on an agent whose record he had and the player never lived. |
| The debrief | The same spine. |

A stage 2 reviewer reads this path with no other mission in mind (stage 0 §6). The test: does a player who has never heard of Derek, Ghost or Nightshade still understand, by the end of the briefing, who the enemy is, what was stolen, why tonight, and who is in the room? The wall, the order and the stakes beats are written to pass it.

## 11. Beats against rooms and flags

The ten rooms are stage 5's (§2 there, P21: the restricted stacks and the restricted cage are separate rooms); placement and lock order are stage 5's, and the concrete conditions stage 4's §4 (FINALE_ARC §13 item 31). **One non-HaX voice per scene during play** (S-24): no two of Sorensen, Noor, Tran, Old Coyote, Nightshade, Torres, Gary, the Recruiter and Netherton speak in the same scene. Cutscenes (the briefing, the debrief) are exempt.

| Beat | Room | Non-HaX voice | Flag | Purge event | Aim |
|---|---|---|---|---|---|
| Briefing | cutscene (Task Force Null's room) | Netherton, the team (exempt) | – | – | – |
| 1.1 | loading dock; open stacks (route B) | Old Coyote (if met) | – | the shredder audible | 1 |
| 1.2 | front desk (route A) | Noor | – | the trolleys, emptying in three steps | 1 |
| 1.3–1.4 | reading room | Nightshade by phone (triple agent) | 1 | – | 1 → 2 and 3 |
| 2.1 | restricted stacks (the hatch counter); restricted cage (through the gate) | Sorensen | – | **the cage**: one bin lost; then the legacy box on her feed table, until the plan cabinet or the first exit | 2 |
| 2.2 | restricted cage (plan cabinet); the comparison against HaX's notebook scan, answered in her hub | – | – | – | 2 |
| 2.3 | restricted cage (ledger shelf, optional); flag at the reading room | – | 2 | the printed binder shredded once read, if Sorensen is free | 3 |
| 2.4 | any room outside the cage, by phone (voiced) | the Recruiter (HaX alone on the hang-up form and the post-name resume) | – | **the deck**: wiped whole on a deal; one tape saved on a refusal | 3 |
| 2.5 | open stacks (Harwick & Lowe boxes) | Torres by phone (turned; or after the safe) | – | – | 3 (optional task) |
| 2.6 | server closet | Tran | – | the rest of the tape side, until he is stopped | optional (in aim 2) |
| 2.7 | moving (by phone) | – | – | – | 3 → 4 and 5 |
| 3.1 | Sorensen's office (opens after the deck; safe, Reading, schedule, files) | – | – | – | 4 |
| 3.2 | tape room (legend, Alpha deck); salvage cage (keypad) | Gary by phone (protected, at the keypad); the Alpha-tapes clip after the identity scene (a recording, its own scene) | – | – | 5 |
| 3.3–3.4 | salvage cage | Netherton by phone (voiced) | 3 | – | 5 |
| 3.5 | salvage cage | – | 4 | – | 5 |
| 3.6 | salvage cage (by phone, voiced) | none heard (Tesseract to HaX) | – | – | 5 → conclusion |
| Debrief | cutscene (hangar) | Kowalczyk, Netherton (exempt) | – | – | conclusion |

**Aims**, as stage 4 §2–§3 builds them, with the beats that open and close each: 1 Get in and set up the drop terminal (1.1–1.4; closes on flag 1). 2 Find the restricted series before it burns (2.1–2.2: the stacks, the hatch, the gate, the cabinet, the hand). 3 Read the Initiative's ledger (2.3–2.5; optional: the cross-reference). Aims 2 and 3 open together on flag 1, so the cage and the ledger can come in either order. Aim 3 completes on the deck choice, which is forced on flag 2 and the open cage (S-03). 4 Search the director's office (3.1: the office, the safe, the Reading, the key card and the deed are tasks; reading to the end is not). 5 Take Tomb Beta's server (3.2–3.6: the tape room, the salvage keypad, flag 3 and the identity scene, flag 4 and the read; it closes on Tesseract's call). Aims 4 and 5 open together on the deck choice. Optional tasks inside the aims: talk to the clerk; stop Sorensen; stop the tape wipe; find WREN's file; send the vendor notice (asked at the debrief if unsent). Conclusion: report to Netherton. Tasks that would spoil a scene (the Recruiter's offer, the identity scene, the hour) arrive locked and are opened by the scene's own first line.

**What enforces the night's order** (R2-S01, R2-S02, R3-01, R3-02). Aims gate nothing and the server concludes on `concludeRequires` alone, so each step of FINALE_ARC §6.1's one order is held by a lock or a condition. Stages 4–5 build them; stage 1 states them:

| Step | Held by |
|---|---|
| flag 1 → the cage | HaX unlocks the restricted stacks' outer door on flag 1 (F19 `unlockDoor`, with a retry at the door and a backstop on load; Beat 1.4; stage 4 P7) |
| the hatch → the cage | the gate takes Sorensen's card, cloned at the hatch (or, on Victoria's route, HaX's `unlockDoor` on the maintenance code); the plan cabinet takes her print (Beat 2.1; stage 4 P2) |
| the cage → the call | the call waits on HaX's ledger read **and** `cage_opened`, and rings only outside the cage (Beat 2.4) |
| the call → the deck choice | the call's first line sets the defaults; `deck_choice_made` is set on its last choice; a closed call re-rings and resumes (Beat 2.4; the rule below) |
| the deck → the office | HaX unlocks the office's keypad door on `deck_choice_made`, traced from the deck's controller in the office (Beat 3.1; stage 4 P7, P11). Sorensen's mail is the recruited-Victoria route's alone |
| the office → the tape room | the tape room's key card is in the safe (Beat 3.1) |
| the tape room → the salvage cage | the salvage keypad takes the decoded catalogue code; the coded line is in the notepad and the legend hangs beside the keypad (Beat 3.2; stage 4 P1, P20) |
| flags 3–4 only in the salvage cage | the salvage cage's station is the only one that accepts Tomb Beta's VM; the reading room's accepts only the catalogue server's (R3-09) |
| flag 3 → the identity scene | the scene fires on flag 3; without Nightshade's file HaX holds the name until it is picked up (Beat 3.3) |
| the scene → flag 4's read | flag 4's read waits on `identity_scene_done`, set on the confession answer; an unfinished scene re-rings on flag 4's submission (Beats 3.3, 3.5) |
| flag 4's read → Tesseract's call | the call waits on `hour_read_done`, set on the read's last line (Beats 3.5, 3.6; R4-01) |
| the call → the conclusion | the conclusion aim waits on `tesseract_call_done`, set on HaX's last line of her report (Beat 3.6; R4-01) |
| the notice → the pen | asked after the memo stance if unsent; the conclusion task is completed on the debrief's last line, after it (§7.1 beat 5; stage 3 S3-15) |

**One rule for every forced phone scene** (R3-02, R4-01): the Recruiter's call, the identity scene, flag 4's read and Tesseract's call. Each sets its defaults on its first line (by branch, where an export depends on it), and its done-flag (`deck_choice_made`, `identity_scene_done`, `hour_read_done`, `tesseract_call_done`) on its last choice, or its last line if it has no choice, never on opening or closing. Closed before that (a hit, or a reload; Escape does nothing on a forced call), it re-rings when the player leaves the room, or on reload, and resumes at its last unanswered choice; **a scene with no choice restarts from its first line**. HaX's scenes re-ring to a guarded knot of their own that picks up at the unanswered choice (not the engine's `resume`, which restores whatever her thread last saved), and also when her thread is closed, so an answer can't be given outside the call (stage 4 §6). Every first ring also has a backstop on room entry, which fires on load too, so a reload inside a ring's delay can't lose a scene (stage 4 §5). Nothing downstream keys on a conversation closing.

**Voicing** (user decisions F17, F20; stage 4 P12). The Recruiter's call, the identity scene and Tesseract's call are voiced (`voiced: true` on every ring and re-ring); flag 4's read and HaX's hub and texts stay text. F20 is committed (`docs/agents/FINALE_ENGINE_VOICED_CALLS.md` §8): a voiced call voices its start knots (the `targetKnot` every voiced mapping names) and every knot they reach, never entering the contact's home knot (its `currentKnot`), so each voiced knot ends `#exit_conversation` and never diverts into the hub. Narration in a phone thread isn't voiced, so none of those scenes has a narrator line; each became an aside of HaX's. About 66 lines in all (Recruiter 14, HaX 49, Netherton 3), plus the two-line clip (stage 4 §6.7).

**Engine checks** (REVIEW_R2_STRUCTURE.md's engine list, items 1–14, carries R1's E-1 to E-10 forward, plus one): locks opened by a flag reward and by an ink global (1); flag 2 on its own station, if stage 5 takes that option (2); a call that survives being closed (3); a second speaker in a phone thread, shown and voiced as themselves (4); two calls due on one walk (5); the cage counter (6); Sorensen non-combat (7); item removal and spawn on a global (8); calls held while in a conversation (9); object text that changes on a global (10); Tran's sight trigger and Old Coyote's re-routed round (11); drop-terminal actions reachable from the tape room (12); the multi-speaker briefing and the hangar (13); ambient sound and near-silence (14); **reload mid-call**: does an event-fired call re-fire after a reload, and resume at the right choice? (15, stage 5; R3-02)

**Engine checks from stage 3** (its §11 changes 30–42, the structure review's items 16–29 as amended; 16 and 23 withdrawn): (17) the Recruiter's call with two resume points after a "yes", crossing speakers (closed before her naming line, she re-rings and says the name; closed after it, HaX re-rings at the unanswered choice with "I've paused the deck. It won't hold long."), the same after a reload; (18) the ledger line at the drop terminal about a minute after `deck_choice_made` on `taken` / `double_crossed`; (19, 20) the legacy box: one object on the feed table, removed at the first of Nightshade's file picked up (an `onPickup` `setVariable` or a unique item type, never an id) and the first exit from the opened cage, unless Sorensen is down; the exit needs an event the engine sees (the cage as its own room, or "leave the stacks"), and the Recruiter's "out of the cage" condition uses the same event; under Noor's desk on warned in time; persisting across reload; (21) a knock-out on Sorensen that does not overwrite `talked`; (22) a conditional choice in Sorensen's conversation on holding Nightshade's file; (24) Noor leaving on `noor_told` and Old Coyote on `old_coyote_told` (`setVisible`), their desks' objects left in place; (25) the Alpha-tapes clip as an ink conversation from the station object, voiced by TTS with a recording style (no object-audio path needed); (26) the double-cross text on first entry to the tape room; (27) a choice inserted into the debrief cutscene between the stance and the hub, and resume if closed; (28) the drop terminal's send actions (notice, Nightshade's file) reachable from the tape room until the debrief; (29) the cage bins: one object removed on `cage_opened` by which was taken.

**Stage 5's verdicts on items 1–29** (stage 5 §10, P13; where the two lists above still describe an option stage 5 didn't take, such as flag 2's own station, the invoice "a minute after" the deck, "or leave the stacks", or the clip "from the station object", these verdicts and Beats 1.4–3.6 win; "works" as is, "pattern" with the scenario pattern named, "engine" needs engine work). Works: 3 (a forced call that survives closing, F14), 4 (a second speaker shown and voiced, F17/F20), 5 and 9 (calls wait for an open minigame or conversation), 7, 10, 13, 18, 22, 24, 26, 27 (the debrief restarts at its knot after a reload and replays safely). Works with F19: 1 (doors open on HaX's `unlockDoor` mappings; a flag carries one reward, and the reward's `unlock_door` opened the wrong room, fixed as F18). Pattern: 6 (Sorensen at the hatch as a fixed figure whose body reaches the counter; bell fallback), 8 and 29 (nothing appears or vanishes on a global; object variants do it), 11 (Tran's sight trigger works; Old Coyote takes a post in his own room), 12 and 28 (the send actions live in HaX's hub), 15 (every forced scene re-rings on load), 17 (three disjoint re-rings), 19–20 (the legacy box: the cage as its own room gives the exit event), 21, 25 (the clip opens from the deck's interaction). Not used: 2 (flag 2 keeps the reading room's station). Engine, optional and not needed for m09: 14's ambient sound on an event (the shredder can't fall silent; `silence` for the call works, F10), music volume, and a state sync straight after flag rewards. Browser checks at stage 9: 6, 15, 17, 25, 27.

**Playtest covering set** (stage 3 change 43; named in stage 4 §12): twelve routes (R1–R12) covering every export value and cross-link once, the three extra routes (double-cross with the call closed between "yes" and the name; `denied` then take; `full` with `m04_crew_lost`, the notice held in the archive and sent at the debrief), a reload in each forced scene and inside each first ring's delay, from eight seeded segment starts (S0–S7).

## 12. Handover items settled (FINALE_ARC §13)

Items owned by stage 1 or 2 that concern m09. The m10 scenes in the same list (items 2, 5, 19, 24, 32, and the m10 half of 11) are the m10 author's.

| # | Item | Settled here | Where |
|---|---|---|---|
| 3 | What Kowalczyk's cracker is for; whether every SAFETYNET cracker comes from the bench | m09 side: stores quarantined every cracker Nightshade signed for after m08; Kowalczyk gives the player her own ("Never been through stores, never been near him."), which is true; nothing in m09 ties its serial to WREN (m10 REVIEW_R3 R3-06). She gives it to be liked and because getting 0x00 to Montana is what the Architect wants. In m09 it opens Sorensen's safe, and she asks about it in the hangar. Canon default: Nightshade's crackers came from the bench, not every SAFETYNET cracker; the bench's link to Kowalczyk's is m10's. Canon note for stage 6. m10 must issue it again (S-26). | §3.4, Beat 3.1, §7.1 |
| 4 | A beat and a reason for suspicion for Quintero, Malhotra and Arakawa | m09 briefing: Quintero argued against tonight's job (the archive where the ledger is) and doubts the courier, and she is the other name on the Harwick & Lowe sheet; Malhotra asked to run the Helena line himself; Arakawa kept Helena's police off the archive's side of town tonight. Kowalczyk's is the cracker. All true, all innocent except hers. Round 1 adds a second, harder one for Quintero: she is the other Harwick & Lowe hire on the shortlist. | §3.3, Beat 2.5 |
| 8 | The default source of the archive's company name | The courier label on the order, which SAFETYNET read and let go on. How it was caught, one reason by priority: the Calder Wharf courier account (m04 found), else the HashChain tags (m06), else the Helena ticket in Nightshade's go-bag. The other confirmations move out of the briefing (W-09): Victoria's keys to the lease file, Torres' address line to his call, Kemal's tip to the casualty sheet. | §3.1 beat 2, Beats 2.5, 3.1, 3.5 |
| 9 | The identity scene's load; whether the notice moves | The scene carries the proof, Netherton's name and one sentence (he stops before HaX), at most one recognition line, HaX's confession with its cost (the two dead, Netherton listening) and the player's answer. The handwriting is matched earlier against HaX's notebook (2.2) and confirmed in the salvage cage (3.2). The line's meaning is cut to three words and one sentence (2.7). The notice has its own beat (3.4). | Beats 2.2, 2.7, 3.3, 3.4 |
| 10 | Nine years | Used throughout. | – |
| 11 | One non-HaX voice per room | Applied to m09 per scene during play; cutscenes exempt. The Recruiter's call now fires outside the cage, so Sorensen is never in its scene (S-04). | §11, §14 change 6 |
| 16 | The "who is Tesseract" sentence (m10's cold start) | Not m09's. m09's equivalent is Netherton's sentence in the identity scene; the briefing gives who the Architect is (S-21) and holds the name back (§14 change 1). | §3.1 beat 6, Beat 3.3 |

**Handed on:** items 7 (the Recruiter's wording), 25 (the Alpha tapes' later use and playback), 33 and 38 to stage 3, which settled them (`../stage_3/moral_choices.md` §9; folded in here, §19); item 1 (the night's UTC steps; the debrief's "twenty hours") to stage 4; item 31 (lock order and placement, and the cage staging S-09) to stage 5, which settled it (`../stage_5/room_layout.md` §2–§4, §3.6; folded in here, §21).

## 13. Notes for later stages

**Stage 3 (moral choices). Settled** (`../stage_3/moral_choices.md`, closed 2026-10-21; folded in, §19): talk stops Sorensen with Nightshade's file as the lever, without turning her (Beat 2.1); the purge choices and the Recruiter's routes are priced aloud before the choice, with m10 echoes for each bin (Beats 2.1, 2.4); the Alpha tapes play one voiced clip from the reel deck in the tape room after the identity scene (F12, Beat 3.2); W-26 is a margin line on the Reading's last page (Beat 3.1).

**Stage 4 (objectives and events). Settled** (`../stage_4/objectives_tasks.md`, closed 2026-10-21; folded in, §21): six aims, thirteen concrete conditions, the forced scenes' wiring, the playtest set and segment starts, the closing card and credits, music cues. Two items stay open: the night's UTC wording (below) and M-14's real VM times. The notes below are the brief stage 4 worked from, kept as the record:
- Triggers: Nightshade's call on flag 1 (triple agent); Tran's radio to Old Coyote after flag 1 (`m01_maya_ko`); the Recruiter's call on flag 2 **and** `cage_opened`, delayed, not in a conversation; the office door on `deck_choice_made`; HaX's "Afterwards" call on the deck choice plus leaving the room, then Torres' fallback after a delay; Torres at the boxes only after flag 2; Gary on the first keypad attempt; the identity scene on flag 3 (held for Nightshade's file if needed); flag 4's read on `identity_scene_done` (an unfinished identity scene re-rings on flag 4's submission); Tesseract's call on `hour_read_done`; the conclusion aim on `tesseract_call_done`. Every forced phone scene follows §11's one rule (defaults on the first line, done-flag on the last choice, re-ring and resume).
- The deck pull is inside the call ink, including after a hang-up (HaX's half, with no Recruiter line); the call's first line sets the defaults (`refused` + `alpha_tapes`); every button writes a legal pair.
- The playtest covering set in §11 (about twelve routes plus three, and a reload in each forced phone scene).
- The night's UTC steps: the archive night is local night on day 11, early day 12 UTC (R2-S07); the debrief's "twenty hours" follows from it, and FINALE_ARC §1.5's row needs the same wording.
- Music: near-silence for Tesseract's call; ask the user before adding a track.

**Stage 5 (rooms). Settled** (`../stage_5/room_layout.md`, closed 2026-10-21; folded in, §21). Each brief item, and how it landed:
- The cage staging (S-09): Sorensen at the hatch counter as a fixed figure whose body reaches it, bell fallback; on Victoria's route the bin choice is a door scene hosted by a hidden record that holds the files (P3).
- The restricted stacks' outer door opens on HaX's `unlockDoor` on flag 1, not the flag's reward (P7). The office door, a keypad no code opens, opens on HaX's `unlockDoor` on `deck_choice_made` (P11).
- Nightshade's plan cabinet sits in the cage, before the tape room on the critical path.
- The safe holds the key card, the master schedule and the Reading.
- The salvage cage opens off the tape room, and holds Tomb Beta's server and its station (P1).
- The Harwick & Lowe boxes are in the open stacks, findable by their bay label, and opened only with the file number on a keypad (P10).
- Flag 2's own station: declined (one station per machine keeps each flag's submission point unique).

**Stage 6 (lore).** From stages 4–5 (P20): the salvage code's encoding is one CyberChef performs in one or two operations with a key the tape room's shelf-code legend supplies, in the archive's terms; the coded string contains none of `|`, `#`, `//`, `{`, `}` (it is quoted in ink). The guard Tran calls in needs a name and a look different from Old Coyote's and Tran's (P14). New canon: stores' quarantine of Nightshade's crackers; the order read and let go on; the master schedule's ticked rooms and her query about the Reading; Harwick & Lowe's dead files at the archive, and Quintero as an innocent H&L hire (SAFETYNET recruits internationally; "Client: government (UK)" for an American hire is ordinary, R2-S08); H&L shut before TalentStack opened; WREN's mother in residential care, paid by the Initiative; the Architect taking WREN's tasking; HaX's training notebook; the Alpha tapes as his recorded teaching (milestone MS-20, still open: say whether the Tomb Alpha lecture is the same one he gave on SAFETYNET's course, which HaX's "He gave that lecture every year." and m10's "You told them to carry it" both lean on; suggested: he gave the same lecture at both, and HaX recognises it); "Ninety-nine", refused; Sorensen's twenty years as a county clerk.

**Stage 7 (ink).**
- Briefing spine about twelve lines before the wall; wall eight short lines; hub three topics.
- The Reading is document text, unvoiced.
- The three voiced calls (Beat 2.4, 3.3, 3.6) have no narrator lines and end by hanging up, never diverting into HaX's hub; HaX's asides replace the old narrator lines (P12). Stage 7 checks the voiced knots against F20's committed rule (start knots and all they reach, never the home knot; HaX's home knot is `start`, which diverts to `support_hub`, stage 4 §6).
- Tesseract is never voiced live in m09. On `deck_pulled == "alpha_tapes"` his two-line tape clip is voiced (F12): a "Dr Adrian Tesseract (recording)" speaker in an ink conversation opened from the reel deck in the tape room, his m07 voice (Sadaltager) with a recording style the user hears before it ships; a typed transcript is the fallback.
- Every branch line is a fixed string; the forms of the confession are wired to imports, not to "the safe".

**Stage 0 fixes** (applied by the arc-keeper's sweep; kept as the record, R2-S11): §1 and §7 "about 75 minutes" → "about 85 with the field guides, 95–100 without"; §2.1 and §2.3 flag 3 at the drop terminal → in the tape room, with the identity scene there by phone; §2.2 and §2.3 "intercepts" → read and let go on; §6 design notes' "who is Tesseract" beat → the suspect without the name; §6 "Opening and closing": the debrief in a Helena hangar. Listed again in §14 changes 14 and 27.

**For the m10 author** (agreed or to agree): taking or double-crossing the Recruiter leaves an invoice in the Initiative's books that Tesseract reads (one ledger line in m10, §14 change 30), and refusing her (`named`, `refused`) earns a clean record that m10 pays once (R4-08; stage 3 §9 item 33, as m10 MC §6.2–6.3 settled it: an exchange 2 answer in slot 4's pool after `m09_albion_notified`, worded "[Your Recruiter offered me a name. I wouldn't buy it from her.]", with his answer by value; where the pool hides it, he says it himself in the Recruiter beat); on `recruiter_secret == "kept"`, HaX already heard the receipt in m09, so Tesseract's line is that the player never explained (S-25); the cracker must be issued again at m10's briefing (S-26); HaX refuses "Ninety-nine" on the m09 call with "It's HaX. It has been for seven years."; the m09 casualty sheet is his original; on `sleeper_shortlist` the alibi clue leaves the same two names; HaX's promise of "the rest" is made after the deck, in Beat 2.7, not in the confession, and m10 pays it at 06:00; WREN has one goal, the key; a third `hax_confession_answer` value, `afterwards`, and the `deck_pulled` export need m10 handling (§14 changes 24, 25).

## 14. Proposed FINALE_ARC changes

Not made: FINALE_ARC and stage 0 are shared, and an arc-keeper applies these later. Verdicts are the round 2 structure reviewer's (REVIEW_R2_STRUCTURE.md) and the round 3 reviewer's word changes (REVIEW_R3.md), with the orchestrator's rulings folded in. 30 changes: 17 from round 1 as revised, 18–23 the round 2 reviewer's wording additions, 24–27 new in round 2, 28–30 new in round 3.

1. **The briefing holds the name back** (accepted). Row 57's "who is Tesseract" beat becomes "who is the suspect": ENTROPY's planner, one of ours once, no name until it can be proved. The name and one sentence land in the identity scene through Netherton; HaX says the rest. HaX's briefing aside loses "It wasn't only his." (R2-S06). Sweep: row 57, D-15, §8 r2, §5.5 m09, stage 0 §6.
2. **The order is read and let go on, and its schedule shows the gap** (modified, R2-S03). Netherton: "We read it. Then we let it go on. If it hadn't arrived, he would know." The order reads "Burn Helena before the Publication. Schedule attached. -- A." The master schedule is in Sorensen's safe, with her planning pass down the margin (each room's series checked against the order before the night and ticked as covered), the tape room's line unticked, and her query "Reading (safe); plan chest: not listed. Keep?" (R3-07) The flag-4 line is offered only to a player who read it; otherwise HaX states the fact from the job's side. Goes in §1.3, §1.5, §6.1.
3. **The sold-and-lied opening carries the offer, and a hang-up keeps the deck pull** (accepted). Row 61; values as §3.4. *(Stage 3 §3.3 adds a denial, `denied`, and gives the hang-up its own form with no Recruiter line.)*
4. **The deck pull is made inside the call by HaX, with defaults and a re-ring** (modified, R2-S02, R2-S13). The call's first line sets `recruiter_offer = "refused"` and nothing pulled; a closed call rings again on leaving the room and resumes at the last unanswered choice; take + nothing records `taken`. The double-cross's price ("about half") is said before the choice. The call waits on flag 2 and the cage opened. Row 60, §6.1 item 3 ("The player can pull one from the drop terminal"). Round 3 (R3-02, R3-03): the call also sets `recruiter_secret` by branch on its first line (`kept` / `confessed` / `""`); its done-flag `deck_choice_made` is set on its last choice and the office opens on it, never on the call closing. Her threat covers the deal only; on refuse she wipes her own file first and drops off, sure it's gone, so pulling it rolls up the whole network. Sweep row 60's and §4.6's "Twelve. She warned the rest." → "About half of them. She warned the rest." *(Superseded in part by stage 3 §3.2: the first line sets `refused` + `alpha_tapes`; the price is the whole deck, so take means nothing pulled and there is no "nothing" on a refusal; the double-cross voids the name.)*
5. **Flag 4 carries his original casualty sheet** (accepted). §6.1 flag 4 row, §1.2; the correction stays m10's.
6. **One voice per scene in m09; Torres moves; the cross-reference narrows to two; `sleeper_shortlist`** (accepted, with tweaks). Per-scene is m09's rule; FA's per-room R3-01 stays for m10. Torres rings at the boxes, or on the walk to the office. The H&L sheet names Kowalczyk and Quintero (Quintero an honest H&L hire; both list a parent in care), and HaX says why nobody checked: "Harwick & Lowe shut before TalentStack opened." `sleeper_named` comes only from the Recruiter. `sleeper_shortlist` is set on reading the sheet, whatever the order. Rows 64, 117, §4.4, §3.4, §5.1 Torres, §5.2 Quintero; the m10 import is change 23.
7. **Netherton on the aircraft; the debrief in Helena** (accepted). Row 125, §5.5 m09, stage 0 §6. He takes the identity scene in the aircraft's forward cabin, door shut, where WREN can't hear (R3-14).
8. **The Recruiter's reason, and WREN's one goal** (accepted, revised by orchestrator ruling). The Architect has taken WREN's *tasking* for Montana: she still reports to the Initiative and draws its money, but her orders now come from him. The Recruiter sells what she can no longer use. WREN has one goal, the key (m10's design); "plays both ends" is withdrawn everywhere. Row 60, §4.4. Also sweep §4.0's "for her own exit with the stolen copy" → her own way back to the key at the core.
9. **The order names the Publication** (accepted). §1.3.
10. **The cracker** (accepted; revised in round 4 to match m10, m10 REVIEW_R3 R3-06). Stores quarantined every cracker Nightshade signed for after m08; Kowalczyk hands over her own ("Never been through stores, never been near him."). Nothing in m09 ties its serial to WREN, so no single clue names her in m10. Rows 29, 118 (and FINALE_ARC §4.4 clue 3's "issued 'to WREN', with a serial" follows m10's version); m10 reissues it.
11. **The raid team's suspicion beats in §5.2** (accepted). Quintero's "Orders don't fall off couriers" is answered by "This one didn't."; Kowalczyk's beat is the cracker.
12. **Flag 3 submitted in the tape room** (accepted, with sweep). §6.1's header and flag 3 row, stage 0 §2.1 and §2.3. The identity scene fires on flag 3 (HaX holds the name for Nightshade's file if needed), and Tesseract's call and the conclusion wait on it (R2-S02). The tape room's station is the only one that accepts Tomb Beta's VM; the reading room's accepts only the catalogue server's (R3-09). Flag 4's read also waits on the identity scene (R3-08).
13. **"Ninety-nine", refused** (accepted, synced with m10). Tesseract calls HaX "Ninety-nine" on his m09 call; she refuses it: "It's HaX. It has been for seven years." m10 calls back to that refusal. §5.4.
14. **m09 runs about 85 minutes with the field guides, 95–100 without** (modified, R2-S04). §1.3, §8 r6, stage 0 §1 and §7; stage 8 sets the published figure.
15. **HaX's promise, and the confession's cost** (accepted, with content). Her confession carries the two dead with Netherton listening. After the deck she gives "Afterwards. Not during." and one sentence, and promises "the rest, when this is over". The promise is made in Beat 2.7, not in the confession (R2-S14). What the rest is belongs to m10, which pays it at 06:00 (agreed with the m10 author); m09 never states it. §5.4. Round 3 (R3-06): the promise is said unasked, as Beat 2.7's last line, since m10 pays it to every played-m09 player.
16. **The Alpha tapes are his recorded teaching** (accepted, conditional). They hold his teaching at the first workshop, in his voice, with annotation sheets in his hand, and a practical stake: "He teaches what he'll do. If he built the bunker the way he taught it, it's on there." Stage 3 decides playback before stage 7 (R2-S15). Row 60, §6.1 item 3, §13 item 25. *(Settled by stage 3: one voiced clip, F12; Beat 3.2.)*
17. **The m06 name came in the m06 debrief, as Satoshi's guess** (accepted). Row 70 already matches; see change 20 for row 37.
18. **Sorensen in §5.2** (wording, R2-S12). "Holds … the Reading's shelf mark" → holds the Reading in her safe; "Hostile once the cage is open" → keeps shredding, non-combat; arrest or knock-out.
19. **`hax_confession_answer` in §5.4 and §3.4** (wording, R2-S12). The m06-name-found answers are "You should have taken it to Netherton." / "I'd have sat on it too." (replacing "You should have pushed."); with change 24's third value. Also relabel the confession forms in §3.4 and §5.4 by import ("m06 name found / not found", not "Safe opened / Safe shut", N-12).
20. **Row 37** (wording, R2-S12). "You've read his hand before" → "You've read him before. Sterling's drive." (style, not handwriting), and the line is HaX's, as row 97's is.
21. **§6.1 flag 2 and the one-order line** (wording, R2-S12). The printed ledger is optional (the flag holds it, and Sorensen shreds it if free); "The Recruiter rings next" → she rings once flag 2 is in and the cage has been opened.
22. **§6.1 header** (wording, R2-S12). "Flags 1–3 are submitted at the drop terminal" → flags 1–2; flag 3 and the identity scene in the tape room (with change 12).
23. **§3.2: m10 imports `m09_sleeper_shortlist`** (wording, R2-S12). Tier 1, H; Tier 1 becomes 38. Also add `m09_deck_pulled` (change 25), in Tier 2. *(Superseded by stage 3 §10: `m09_deck_pulled` is Tier 1; `m09_cage_bin` and `m09_legacy_files_saved` join Tier 2; m10 imports 67.)*
24. **A third `hax_confession_answer` value, `afterwards`** (new, N-17). The player throws her own line back at her; it defers the judgement, so it is neither blame nor absolution. §3.4 gains the value; m10 decides its core beat (suggestion: it reads as `same_in_your_place` for "Put me on speaker", and HaX's debrief line is "You said afterwards. I'm holding you to it.").
25. **`deck_pulled` exported** (new, R2-S13, decided here). Values `her_file` / `alpha_tapes` / `none`. `recruiter_offer` can't say whether the Alpha tapes were saved (`taken` and `refused` both include "nothing"), so stage 3's use of them in m10 needs it. Replaces §13 item 25's `alpha_tapes_saved`. Nine m09 exports in all. *(Superseded by stage 3: `taken` always pairs with `none` and `refused` with `alpha_tapes`; eleven exports with `cage_bin` and `legacy_files_saved`; §9.)*
26. **The night in UTC** (new, R2-S07). §1.5 day 11: the archive is the local night of day 11, early day 12 UTC; in-game lines say "on day ten" for WREN's update and "at the briefing" for the morning's events.
27. **Stage 0 sweep** (new, R2-S11). Stage 0 §1 and §7 (75 minutes), §2.1 and §2.3 (flag 3 and the identity scene at the drop terminal; the order "intercepted"), §6 (the "who is Tesseract" beat; the debrief's place). See §13 "Stage 0 fixes".

28. **The Publication's two modes in §1.2** (new, R3, N-02). §1.2's first sentence: at 06:00 the database goes out city by city; the key at the console sends it everywhere in the same minute and needs a hand. His casualty sheet prices the key ("Release by key, all cities: 1,100 to 2,600. Fallback by city: fewer, later."). m10's premise line follows.
29. **Row 32: Victoria's mail route stays hers** (new, R3-01). Victoria's protocols are the only way into Sorensen's mail; the office opens on `deck_choice_made`, traced from the deck's controller, on every route.
30. **The Recruiter's invoice** (new, R3-04, orchestrator ruling; renamed in round 4, R4-08, so it is never confused with m05's receipt for the sale). Taking her deal (`taken`, `double_crossed`) leaves an invoice in the Initiative's books; m10's Tesseract reads them, and one ledger line in m10 says so (suggested: "You bought WREN from my Recruiter. You understand costing."). The m09 debrief's `taken` line notes it ("She'll sell the invoice."). Refusing (`named`, `refused`) buys a clean record, which m10 pays once (suggested: a talk-down answer, "I wouldn't buy a name from her."; stage 3 and the m10 author decide). *(Settled by stage 3 §9 item 33: "[Your Recruiter offered me a name. I wouldn't buy it from her.]", ranked last under the second claim (ranking since superseded by m10's slot pools, m10 MC P22); the invoice is shown in m09 as a ledger line and priced by HaX as a moral cost.)* Row 60, §3.4 (`recruiter_offer`'s m10 use), §4.1 (his ledger and the talk-down).

## 15. Review round 1 outcomes

Reviews: `REVIEW_R1_WRITING.md` (W-01 to W-27: 12 majors, 15 minors) and `REVIEW_R1_STRUCTURE.md` (S-01 to S-26: 9 majors, 17 minors). Orchestrator rulings applied as given. "SE" is `../stage_2/storytelling_elements.md`.

### Writing review

| ID | Sev | Outcome | Where |
|---|---|---|---|
| W-01 | major | Fixed: every confession form reaches the wall ("Two cards on that wall. I had his name the night they died."), with Netherton listening and silent; the safe-opened "should have" answer is "You should have taken it to Netherton." | Beat 3.3; SE §4.3 |
| W-02 | major | Fixed: Netherton stops at "He trained half my field officers."; HaX says the rest | Beat 3.3; SE §2 |
| W-03 | major | Fixed: the quiet stretch is now the cost, "Afterwards. Not during.", and one new sentence; "the rest" promised for after; the confession is her one opening-up | Beat 2.7; SE §4 |
| W-04 | major | Fixed: the cross-reference narrows to two names, so only the Recruiter is certain; the Alpha tapes get a stake HaX names ("His voice. Teaching.") | Beats 2.4, 2.5; §14 change 6, 16 |
| W-05 | major | Fixed: the realisation is a player line at flag 4, stated once; HaX's "He wants us to come" cut; "burned" → "shredded everyone but himself" | Beat 3.5 |
| W-06 | major | Fixed: flag 4 says what the key does and that it needs a hand; HaX: "Then why build a key at all?", left open | Beat 3.5; §9 |
| W-07 | major | Fixed: Kowalczyk's "Well? Did my toy earn its keep?" to the player's face, with two replies; cutscenes exempt from the voice rule | §7.1 beat 2 |
| W-08 | major | Fixed: "next of kin: mother, residential care" on her H&L sheet; Quintero's sheet has a father in care, so it narrows nothing further | Beat 2.5; SE §3 |
| W-09 | major | Fixed: open on the order; one reason it was caught; hub cut to three topics with no company-name branches; Kemal, Victoria and Torres moved to where they help; spine about twelve lines | §3; SE §7 |
| W-10 | major | Fixed: Sorensen's quote drafted per entry-1 value (SE §3); cold starts get entry 2's never-played form; "the reader's agent" → "You're the one he writes about." | Beat 2.1; SE §3 |
| W-11 | major | Fixed: "Nobody's called me that since the course."; "liked his notes" in both files | Beat 3.6; SE §4.3 |
| W-12 | major | Fixed: HaX says what each bin buys; Derek = a second sample of the hand; the letters = a lever on Tran (and Maya's warning on `m01_maya_ko`) | Beat 2.1 |
| W-13 | minor | Fixed: the Reading has a line about HaX; telling her hands her that line before her confession | Beat 3.1; SE §5.1 |
| W-14 | minor | Fixed: "Afterwards. Not during." as a third answer, recorded as `same_in_your_place` (superseded in round 2 by N-17: its own value, `afterwards`) | Beat 3.3 |
| W-15 | minor | Fixed: Netherton's m08 line replaced by a narrator line (the chair furthest away) | §3.1 beat 1; SE §7.2 |
| W-16 | minor | Fixed: stance becomes "Was he right?"; replies rewritten; the debrief ends on the pen, not "Sleep" | §7.1 |
| W-17 | minor | Fixed: "Tonight we can." cut | §3.1 beat 6 |
| W-18 | minor | Fixed: grievance as accounting ("I'd like something back on the books") | Beat 2.4; SE §2 |
| W-19 | minor | Fixed: the raid-team answer pays off when the Recruiter names Kowalczyk or the shortlist names Quintero | §3.3, Beats 2.4, 2.5 |
| W-20 | minor | Fixed: Kowalczyk's door-spec line cut | §3.3; SE §3 |
| W-21 | minor | Fixed: Noor's line kept whole ("She never feeds the shredder herself, and tonight she's sent me home twice.") | Beat 1.2; SE §3 |
| W-22 | minor | Fixed: he gets Ferreira's middle name right, and the narrator gives the pause one line | §7.1; SE §2 |
| W-23 | minor | Fixed: ransom → "It bought the blast door."; Irina's line says what her account bought; Reeves' sheet is an object with no voiced line | Beats 2.3, 3.1; SE §7 |
| W-24 | minor | Fixed: options worded as own it ("She's right. I took her money in the spring.") or hang up; wording stays stage 3's *(superseded by stage 3 S3-02: no money changed hands in m05; "[She's right. I let her courier have the list in the spring.]", plus a denial)* | Beat 2.4 |
| W-25 | minor | Fixed: "Take the print if you like. By the time it matters, the shredder will have caught up." | Beat 2.1 |
| W-26 | minor | Handed to stage 3 (it stretches the Reading's four-entry cap, D-06) | §8, §13 |
| W-27 | minor | Fixed: repeated phrases ("the floor drops", "sharpest exchange", "the mask comes off") said once or cut | throughout |
| Worst ten and extras | – | All ten rewritten as suggested (SE §2–5); "giving it away" and "Silence." and Old Coyote's pole line also fixed | SE |

### Structure review

| ID | Sev | Outcome | Where |
|---|---|---|---|
| S-01 | major | Fixed: budget rebuilt at 7 minutes per VM stage, 85 minutes total (orchestrator ceiling); the Reading in the safe and flag 3 in the tape room remove Act 3's walk-backs | §2, §6; §14 changes 12, 14 |
| S-02 | major | Fixed: after a hang-up HaX asks which tape and pulls it; values as FINALE_ARC §3.4 | Beat 2.4; §14 change 3 |
| S-03 | major | Fixed: the call fires on flag 2 alone (delayed, outside the cage, not in a conversation); the printed ledger is optional; aim 4 opens on the deck choice, so `recruiter_offer` is always set | Beats 2.3, 2.4; §11 |
| S-04 | major | Fixed: the call fires outside the cage, so Sorensen is never in its scene; Sorensen's cage state is non-combat | Beats 2.1, 2.4 |
| S-05 | major | Fixed: HaX's training notebook with his margin notes is the exemplar; Derek's file a second; the m03/m07 echoes are style only | Beats 1.3, 2.2, 3.3 |
| S-06 | major | Fixed: SAFETYNET read the order and let it go on | §1, §3.1 beat 2 |
| S-07 | major | Fixed: "Schedule attached"; Sorensen's annotated schedule in her office leaves off the rack and the Reading's box; the player says it at flag 4 | Beats 3.1, 3.5; §14 change 2 |
| S-08 | major | Fixed: each bin buys something later in m09 (the hand, the Tran lever, Nightshade's reply); m10 echo left to stage 3 | Beat 2.1; §8 |
| S-09 | major | Flagged for stage 5 with a staging and a fallback (hatch counter, or the bell); check m08's clone-while-talking first | Beat 2.1; §11, §13 |
| S-10 | minor | Fixed: "after HashChain… I called it his guess" (the m06 debrief) | §3.1 beat 6, Beat 3.3; SE §4.3; §14 change 17 |
| S-11 | minor | Fixed: "Last time I said the next one would cost me more. This is the next one." for every no-deal m05 ending | Beat 2.4; SE §2 |
| S-12 | minor | Fixed: Torres also rings on the walk to the office | Beat 2.5 |
| S-13 | minor | Fixed: on `m01_maya_ko` Tran radios Old Coyote toward the reading room after flag 1 | Beat 1.1 |
| S-14 | minor | Fixed by note: the arrested branch's L+ is met by the wall's m08 card | §3.1 beat 4 |
| S-15 | minor | Fixed: the Alpha decode is at a terminal; the bench reader is gone | Beat 3.2 |
| S-16 | minor | Fixed: on Victoria's route the quote and the bins play at the cage door | Beat 2.1 |
| S-17 | minor | Fixed: the Reading's box is off the schedule on purpose; finding it is an aim-4 task, reading to the end optional | Beat 3.1; §11 |
| S-18 | minor | Fixed: he took WREN's tasking, not her entry | Beat 2.4; §14 change 8 |
| S-19 | minor | Fixed: "Torres cost us one hospital bill" | SE §3 |
| S-20 | minor | Fixed: the Quintero narrator line in the hangar is gone | §7.1 |
| S-21 | minor | Fixed: "ENTROPY's planner. Every card on this wall has his initial on it somewhere." | §3.1 beat 6; §10.2 |
| S-22 | minor | Fixed: hub capped at three topics; the building's people move to the loading dock, "why me alone" to Quintero; four minutes | §3, Beat 1.1 |
| S-23 | minor | Fixed: flag 4 stays on `noir`, low, not `threat` | SE §6.2 |
| S-24 | minor | Fixed: the rule covers play; cutscenes exempt | §11 |
| S-25 | minor | Passed to the m10 author | §13 |
| S-26 | minor | Passed to the m10 author; in §14 change 10 | §13, §14 |

**Counts:** 53 findings (21 major, 32 minor). 49 fixed, 1 flagged for stage 5 with a staging decided here (S-09), 1 handed to stage 3 (W-26), 2 passed to the m10 author (S-25, S-26). None withdrawn.

## 16. Review round 2 outcomes

Reviews: `REVIEW_R2_WRITING.md` (N-01 to N-17: 2 majors, 15 minors) and `REVIEW_R2_STRUCTURE.md` (R2-S01 to R2-S15: 3 majors, 12 minors; verdicts on §14, additions 18–23; an engine list for stages 4–5). Orchestrator rulings applied as given. "SE" is `../stage_2/storytelling_elements.md`.

### Writing review

| ID | Sev | Outcome | Where |
|---|---|---|---|
| N-01 | major | Fixed: the double-cross is priced aloud before the choice (the Recruiter: "About half of them will be gone by morning"; HaX: "We'd get half"); the debrief says "about half" in both topics and "the twelve" is dropped; the Alpha tapes gain a practical stake ("He teaches what he'll do. If he built the bunker the way he taught it, it's on that tape."); a route table shows every option losing something | Beat 2.4, §7.1; SE §2, §4.3 |
| N-02 | major | Fixed: by default it goes city by city from 06:00; the key sends it everywhere in the same minute and needs a hand; then "Then why build a key at all?" | Beat 3.5, §9; SE §4.3 |
| N-03 | minor | Fixed: "You heard him say it in Portland. My line. His line." is HaX's first line on that branch; Netherton stops at "HaX." | Beat 3.3; SE §4.3, §7.1 |
| N-04 | minor | Fixed: "I don't know if saying it would have saved them. I didn't say it."; cold-start form ends "I wanted the other thirteen." | Beat 3.3; SE §4.3 |
| N-05 | minor | Fixed: a Reading-aware reply drafted for each of the three answers | SE §4.3 |
| N-06 | minor | Fixed: the realisation is offered beside "Read me the defences." and only on `schedule_read`; the line is "Her schedule. This room isn't on it." | Beat 3.5 |
| N-07 | minor | Fixed: the reply sits at the pen; "No" gets "Good. Then he can make that argument in court, and lose it." | §7.1; SE §2 |
| N-08 | minor | Fixed: "Warmer, next time. She notices." on `sleeper_named` with the flat reply *(superseded by stage 3 §4.7: replaced by a narrator line)* | §7.1, §8 #15; SE §2 |
| N-09 | minor | Fixed: the Recruiter's naming carries the reason as an expense ("Her mother's care home has had my cheque every month for eleven years.") | Beat 2.4; SE §2 |
| N-10 | minor | Fixed: "He reads the first name off the card. He doesn't look down for the second." | §7.1; SE §2 |
| N-11 | minor | Fixed: stage 2 swept (the quiet-stretch row, "victory on the pen", the Portland half-line, the no-coordinate line, `m01_maya_ko`'s places, "read him before", Beat numbers, Sorensen and `threat`); the call report is four sentences in both files | SE §4, §5, §6, §7; Beat 3.6 |
| N-12 | minor | Fixed: forms labelled by import ("m06 name found / not found") | Beat 3.3; SE §4.3 |
| N-13 | minor | Fixed: "It's yours to carry. Nobody else signed for it." | Beat 2.7; SE §4.3 |
| N-14 | minor | Fixed: Sorensen's recruit line is "It's in your file, you know."; the bin line says it isn't Derek's handwriting | Beat 2.1; SE §3, §4.3 |
| N-15 | minor | Fixed: "Derek wrote things down. Look how that went." | SE §3 |
| N-16 | minor | Fixed: "You took her side at the briefing. Keep it. Don't take her word." | §3.3, Beat 2.5 |
| N-17 | minor | Fixed by proposal: a third value, `afterwards`, with its own debrief line | Beat 3.3, §7.1, §8; §14 change 24 |

### Structure review

| ID | Sev | Outcome | Where |
|---|---|---|---|
| R2-S01 | major | Fixed (orchestrator ruling): flag 1's reward opens the restricted stacks; the call waits on flag 2 and `cage_opened`; the office opens on a code from Sorensen's mail after the deck choice; §11 now says which lock holds each step. Stage 5 may give flag 2 its own station at the shelf | Beats 1.4, 2.4, 3.1; §11, §13 |
| R2-S02 | major | Fixed: the call's first line sets `recruiter_offer = "refused"`; a closed call rings again and resumes; the identity scene fires on flag 3 (HaX holds the name for the file); Tesseract's call and the conclusion aim wait on `identity_scene_done` | Beats 2.4, 3.3, 3.6; §8, §11 |
| R2-S03 | major | Fixed: the master schedule is in the safe with each room ticked and the tape room unticked, plus her query about the Reading; `schedule_read` gates the player's line; otherwise HaX states it from the job's side | §1, Beats 3.1, 3.5; SE §5.3; §14 change 2 |
| R2-S04 | minor | Fixed: "about 85 with the field guides, 95–100 without"; act minutes are the sums of their beats (4 + 15 + 31 + 31 + 4); 7 minutes per VM stage marked as an assumption | §2, beat headings |
| R2-S05 | minor | Fixed with N-03 | Beat 3.3 |
| R2-S06 | minor | Fixed: "It wasn't only his." cut from the briefing | §3.1 beat 6; SE §4.3 |
| R2-S07 | minor | Fixed: "on day ten" and "at the briefing" in voiced lines; stage 4 and FINALE_ARC §1.5 get the UTC wording | Beats 2.3, 2.4, 2.5, §3.3; §13; §14 change 26 |
| R2-S08 | minor | Fixed: HaX at the sheet, "After Quantum Dynamics we checked everyone TalentStack ever touched. Harwick & Lowe shut before TalentStack opened."; the international-hire note goes to stage 6 | Beat 2.5; §13 |
| R2-S09 | minor | Fixed: HaX names Derek's stake ("the only place anyone wrote down why he did what he did"); the m10 echo is stage 3's | Beat 2.1; SE §4.3 |
| R2-S10 | minor | Fixed: on Victoria's route the bins are two objects inside the door | Beat 2.1 |
| R2-S11 | minor | Fixed in SE; stage 0's stale lines listed as proposed fixes (not edited) | SE; §13 "Stage 0 fixes"; §14 change 27 |
| R2-S12 | minor | Fixed: changes 18–23 added | §14 |
| R2-S13 | minor | Fixed: `sleeper_shortlist` on reading the sheet, whatever the order; take + nothing records `taken`; `deck_pulled` exported (decided here) | Beats 2.4, 2.5; §8, §9; §14 change 25 |
| R2-S14 | minor | Fixed, synced with m10: HaX refuses "Ninety-nine" ("It's HaX. It has been for seven years."); the promise is made after the deck, not in the confession; its content is m10's, paid at 06:00, never stated in m09 | Beats 2.7, 3.6; §13, §14 changes 13, 15 |
| R2-S15 | minor | Wording fixed (no promise the player hears him tonight); playback handed to stage 3, to decide before stage 7 | Beat 2.4; SE §2, §4.3; §13 |
| Orchestrator: WREN's goal | – | Fixed: WREN has one goal, the key; she reports to the Initiative but her tasking is his; "plays both ends" withdrawn | Beat 2.4; SE §3; §14 change 8 |

**Counts:** 32 findings (5 major, 27 minor). 31 fixed (N-17, R2-S11's stage-0 part and R2-S12 by proposals for the arc-keeper), 1 split (R2-S15: wording fixed here, playback to stage 3). None withdrawn. §14 now holds 27 proposed changes.

## 17. Review round 3 outcomes

Review: `REVIEW_R3.md` (R3-01 to R3-15: 4 majors, 11 minors; five worst lines; word changes to §14 changes 2, 4, 7, 8, 12, 15, 19; new changes 28, 29). Orchestrator rulings applied as given. "SE" is `../stage_2/storytelling_elements.md`.

| ID | Sev | Outcome | Where |
|---|---|---|---|
| R3-01 | major | Fixed: the Recruiter fires the wipe from the deck's controller in Sorensen's office; HaX traces it ("She fired it from Peg's office. I'm on the door."); the office opens on `deck_choice_made`; Sorensen's mail stays the recruited-Victoria route's alone | Beats 2.4, 3.1; §11; SE §4.3; §14 change 29 |
| R3-02 | major | Fixed: one rule for every forced phone scene in §11 (defaults on the first line, by branch; done-flag on the last choice; a closed call re-rings and resumes at the unanswered choice); `recruiter_secret` defaults to `kept` / `confessed` by branch; `identity_scene_done` is set on the answer; nothing keys on a call closing; "reload mid-call" added to the engine checks (item 15) | Beats 2.4, 3.3, 3.6; §8, §11, §13 |
| R3-03 | major | Fixed: her threat covers the deal only ("Take my name, and if anything else comes off that deck…"); on refuse she wipes her own file first and drops off, sure it's gone; HaX pulls it a second ahead ("She thinks it's gone. Let her."), so the whole network can be rolled up | Beat 2.4; SE §2, §4.3 |
| R3-04 | major | Fixed (orchestrator ruling): taking her deal leaves a receipt in the Initiative's books that m10's Tesseract reads; the debrief's `taken` line says "She'll sell the receipt."; the route table's take rows lose it and the refuse rows gain a clean record | Beat 2.4, §7.1, §8; §14 change 30 |
| R3-05 | minor | Fixed: the recognition line comes before the form's first sentence | Beat 3.3; SE §4.3 |
| R3-06 | minor | Fixed: "The rest when this is over." is said unasked as Beat 2.7's last line | Beat 2.7; SE §4.2, §4.3; §14 change 15 |
| R3-07 | minor | Fixed: the ticks are her planning pass from before the night; her query adds the plan chest | Beat 3.1; SE §5.3; §14 change 2 |
| R3-08 | minor | Fixed: flag 4's read waits on `identity_scene_done` ("His file first. Then the rest of his box.") | Beat 3.5; §11; SE §4.3 |
| R3-09 | minor | Fixed: only the tape room's station accepts Tomb Beta's VM | §11; §14 change 12 |
| R3-10 | minor | Fixed: Torres rings at the boxes only after flag 2 | Beat 2.5; §13 |
| R3-11 | minor | Fixed: on Victoria's route, walking past the bins tips the far one and Derek's survives | Beat 2.1 |
| R3-12 | minor | Fixed: the sheet prices the key ("Release by key, all cities: 1,100 to 2,600. Fallback by city: fewer, later.") | Beat 3.5; SE §5.1; §14 change 28 |
| R3-13 | minor | Fixed: the double-cross's network line lives in the Recruiter topic only | §7.1 |
| R3-14 | minor | Fixed (orchestrator ruling): Netherton takes the identity scene in the aircraft's forward cabin, door shut, where WREN can't hear | Beat 3.3; SE §2; §14 change 7 |
| R3-15 | minor | Fixed in this author's files ("at the briefing" in §1; Act 3's 31 minutes; the payoff note in §2; W-14's row marked superseded; "On every answer"); the FINALE_ARC and m10 copies are listed below | §1, §2, §6, §7.1, §15 |
| Worst lines 1–5 | – | All five rewritten as suggested | SE §2, §4.3; Beats 2.4, 2.7 |
| §14 word changes | – | Changes 2, 4, 7, 8, 12, 15 and 19 amended; 28 and 29 added; 30 (the receipt) added for R3-04 | §14 |

**Counts:** 15 findings (4 major, 11 minor), all 15 fixed, none withdrawn. §14 now holds 30 proposed changes.

### For the arc-keeper and m10

Not edited here; each is a line a round 1–3 fix changed and an earlier copy kept.

**FINALE_ARC (arc-keeper):**
- Row 60 (FA:171) and §4.6 (FA:614): "Twelve. She warned the rest." → "About half of them. She warned the rest." (with §14 change 4).
- §1.2's first sentence (FA:24): "to everyone at once" → city by city from 06:00, everywhere in the same minute by key (§14 change 28).
- §4.0 (FA:489): WREN propped the service door "for her own exit with the stolen copy" → her own way back to the key (§14 change 8).
- §3.4 (FA:469) and §5.4 (FA:697): "Safe opened / Safe shut" → "m06 name found / not found" (§14 change 19).
- Row 32: Victoria's mail route stays hers (§14 change 29); row 60 and §4.1: the invoice (§14 change 30).

**m10 (m10 author):**
- m10 SA:18: the Publication "to everyone at once" → the two modes (as change 28).
- m10 SA:514 (change 27): m09's change 8 no longer says "plays both ends"; the two now agree.
- m10 SA:508 (change 21): the promise is made after the deck (Beat 2.7), unasked, not in the confession.
- m10 SA:518, SA:544: `alpha_tapes_saved` → `m09_deck_pulled == "alpha_tapes"`.
- m10: one ledger line for Tesseract on `m09_recruiter_offer` in `taken` / `double_crossed` (the invoice, change 30), and one payoff for refusing's clean record on `named` / `refused` (R4-08); the casualty sheet m10's narrator quotes prices the key, as m09's now says.

## 18. Review round 4 outcomes

Review: `REVIEW_R4.md` (R4-01: 1 major; R4-02 to R4-09: 8 minors). Orchestrator rulings applied as given. Earlier outcome tables (§15–17) are a record and keep the wording of their round.

| ID | Sev | Outcome | Where |
|---|---|---|---|
| R4-01 | major | Fixed: flag 4's read is a fourth forced phone scene with its own done-flag, `hour_read_done`, set on its last line; Tesseract's call keys to `hour_read_done`; the conclusion aim keys to `tesseract_call_done`; §11 says a scene with no choice restarts from its first line | Beats 3.3, 3.5, 3.6; §8 note; §11 locks table and rule; §13 stage 4 |
| R4-02 | minor | Fixed: §13 stage 5's office line reads `deck_choice_made` | §13 |
| R4-03 | minor | Fixed: §1's planning-pass ticks and widened query; §8's "the call's last choice"; change 4's "last unanswered choice"; change 16's "it's on there" | §1, §8, §14 |
| R4-04 | minor | Fixed: an unfinished identity scene also re-rings on flag 4's submission; a second hold line for a player who holds the file ("Finish with me first. Then his box.") (cut at the stages 4–5 milestone: no state reached it; stage 4 §4 row 10) | Beats 3.3, 3.5; SE §4.3 |
| R4-05 | minor | Fixed: one `double_crossed` line ("About half of her network. She warned the rest, and she knows it was you.") | §7.1 |
| R4-06 | minor | Fixed: on a hang-up she wipes her own file first and drops off, as on a refusal; HaX: "She thinks it's gone. Let her." | Beat 2.4; SE §4.3 |
| R4-07 | minor | Fixed, decided: take + nothing gets the name only (`taken`, `deck_pulled = none`; the tapes are wiped with the rest) and has its own row; "she leaves the Alpha tapes for HaX to pull, and watches the deck" | Beat 2.4 |
| R4-08 | minor | Fixed: m09's purchase is "an invoice" (m05's sale keeps "receipt"); the debrief says "She'll sell the invoice."; refusing's clean record gets one suggested m10 payoff (a talk-down answer, "I wouldn't buy a name from her."), listed for stage 3 and the m10 author | Beat 2.4, §7.1, §13; §14 change 30; §17 list |
| R4-09 | minor | Fixed: Sorensen's card is her stacks card (the cage and the shredder line); the office is on its own keypad, off the card system | Beat 2.1; §13 |
| m10 R3-06 (coordinator) | – | Fixed: m09 no longer says the bench logged Kowalczyk's cracker "to WREN" with a serial; nothing in m09 ties its serial to her, matching m10. The m09 promise at Beat 2.7 is confirmed fine by m10 | §3.4, §12 item 3, §14 change 10 |

**Counts:** 9 findings (1 major, 8 minor), all fixed, none withdrawn; plus the coordinator's m10 R3-06 sync, fixed. §14 still holds 30 proposed changes (change 30 renamed "the invoice"; changes 4 and 16 re-worded). The R4 reviewer's condition is met: with R4-01 fixed, stages 1–2 are ready for stage 3.

**Added to the "For the arc-keeper and m10" list (§17):** the invoice rename in change 30 and row 60, and one m10 payoff for refusing's clean record on `named` / `refused`.

## 19. Stage 3 folded in

Applied 2026-10-21 from `../stage_3/moral_choices.md` §11, with its round 1–3 outcomes (§13–§15); stage 3's final wording wins. Changes 1–10 (FINALE_ARC) and 25–29 (m10) belong to the arc-keeper and the m10 author and are not applied here.

| Stage 3 change | Where applied |
|---|---|
| 11 (the Recruiter's call) | Beat 2.4: first-line defaults as legal pairs, `sleeper_named` on her naming line, two resume points; the m05 deal as the courier and the report (no money); own it / deny it / hang up; the hang-up's own HaX-only tape choice; her price, refusal and threat lines with no pronoun for WREN; HaX's boast, "Nobody has.", the invoice line; the four-route table; the ledger line; the double-cross text and Kowalczyk walking off at Helena; §1's one-paragraph shape. SA:600 (W-24 row) marked superseded |
| 12 (Noor) | Beat 1.2: truth against her father's nightly call; HaX's signpost; the phone and "[Not tonight. Not from here.]"; warned in time, the held box |
| 13 (Sorensen, Tran, renames) | Beat 2.1 step 6 (arrest alone doesn't stop her; the legacy box, clock and HaX's line; the talk lever; KO after `talked`; "free" means `left`); Beat 2.3 (`left`); Beat 2.6 (talk with his price, KO, leave; no arrest); §7.1 "The archive"; §8 renames |
| 14 (Nightshade's file) | Beat 2.2: HaX's two-button question and its price |
| 15 (loss line) | Beat 2.7: both tapes on `taken` |
| 16 (bin note, W-26) | Beat 3.1 |
| 17 (the clip; Beat 2.7 lines; "never heard live") | Beat 3.2 (clip at the tape room's station after the identity scene, the two lines, "Tape two.", the decode); Beat 3.6 ("never heard live"); Beat 2.7 (Villanueva, "Last spring…") |
| 18 (Beat 3.4) | Beat 3.4: the controller in water works and substations, four hundred sites, the `full` line, the watch by m04 branch, the inquiry only on `full` or `m04_crew_lost`, the realistic timescale, "Gone.", the acknowledgement, the watch pulled, "[Send his notice.]" / "[Not yet.]" |
| 19 (debrief, §11 lock row) | §7.1 beats 2, 5–7 (narrator line for the flat reply; `double_crossed` absence, last line and last image, checked first; the notice after the stance; "The archive" capped at two lines; "The notice." topic on an archive send only); §11 new lock row |
| 20 (§8) | §8 rewritten as a pointer to stage 3 §2 with the old→new numbering and the renames |
| 21 (§13 "Stage 3") | §13 marked settled; §12 "Handed on" updated |
| 22 (§11 engine list) | §11 "Engine checks from stage 3" (stage 3 changes 31–42; 30 and 36 withdrawn there) |
| 23 (stage 2) | `../stage_2/storytelling_elements.md` §2 (Netherton, Recruiter, Nightshade, the Architect), §3 (Sorensen, Noor, Tran, Kowalczyk), §4.2–4.4 (HaX), §5.1 (bin note), §5.3 (sale line, legacy files, letters, tapes), §7 (m05 rows, `m04_crew_lost`), §8, §9 |
| 24 (stage 0) | `../stage_0_initialization.md` §2.2 "Choices for every player"; the notice added to the every-player choices |
| 43 (playtest set) | §11 and §13 stage 4 |

**Stale copies swept** (beyond the change list): §1's tape line; §9's export list (nine → eleven, with tiers and 67) and the WREN hook (double-cross); §10.2 (Noor, the Recruiter's price, the notice); §11 beat table (2.1, 2.4, 3.2) and aims; §13 stage 4 and stage 7 notes and the m10 clean-record wording; §14 changes 3, 4, 16, 23, 25 and 30 marked superseded where stage 3 changed them; N-08's record row marked. Stage 0: the purge row (deck price, legacy box, Tran), social engineering, the kept-flaw row (controller, four hundred sites, debrief question, timescale), the workflow, stage 3 next steps, HaX's hub, spoken lines, the export count. Stage 2: "He took her for Montana … a tape you've never heard of", "kept his letters", Sorensen's arrested pencil line, Tran's "I want that in writing", "Warmer, next time", "Take her name and her file … We'd get half", the hang-up/refusal "She thinks it's gone. Let her.", the pull-nothing spike release, and the hang-up offer note in §9.

**Not applied, and why.**
- The Recruiter's old refusal line "Then we'll both lose something tonight. I've had more practice." is dropped from stage 2 rather than kept: stage 3's refusal is "Then I'll tidy my own desk. Gone. Goodnight, agent." and she drops off at once, so a second refusal line has no place.
- Review-round outcome tables (§15–§18) keep their round's wording, as §18 says; only the rows stage 3 names (W-24) or that would mislead (N-08) carry a superseded note.
- Noor's debrief line keeps "a hotel in Great Falls" as stage 3 §4.2 has it: Great Falls is where she is held, not where Kowalczyk walks off (that is Helena everywhere).
- The flat-reply alternative (exporting `kowalczyk_reply` for an m10 line) is listed in stage 3 as an option, not recommended, and is not added.

## 20. Milestone fixes (stages 0–3)

Applied 2026-10-21 from `../../../finale/MILESTONE_S0-3_CONSISTENCY.md` (MS-), `../../../finale/MILESTONE_S0-3_DELIVERY.md` (D-, M-) and the orchestrator's rulings in `scenarios/FINALE_DEV_LOG.md`. Only m09's four stage documents were edited. "s0" is `../stage_0_initialization.md`, "SE" `../stage_2/storytelling_elements.md`, "MC" `../stage_3/moral_choices.md`. Review records (§14–§18 here, MC §11–§15) keep their round's wording; two of them carry a superseded note.

| Finding | Fix | Where |
|---|---|---|
| D-01 (major) | The Recruiter's tape lists SAFETYNET placements by codename only; the key from codename to person was hers alone. On `named`, Netherton: "Ours are on it by codename only; she kept the key to the names. The arrests start at oh-six-hundred, day thirteen. Not before. WREN would hear." | Beat 2.1 step 6, Beat 2.4 step 4 and route table, §7.1 "The Recruiter."; SE §2 Netherton, §4.3 HaX, §5.3 legacy files; MC §3.2 `named` row, §4.3; s0 §2.2 |
| D-02 (major) | One HaX line at flag 4's read: real full disclosure (one researcher, one flaw, after the vendor stops answering) and the coordinated notice, set apart from the Publication's mass release | Beat 3.5; SE §4.3 Act 3; MC §3.5 dominance; s0 §2.2 kept-flaw row |
| D-07 (major) | The lease file's priority list split into four objects, none excluding another: lease (Victoria), rent book (Irina), Zero Day's note on Danny (its own sheet, whatever Victoria's fate), refit ledger | Beat 3.1; SE §2 "Mentioned", §5.3, §7.2 |
| M-02 | `noor_ko` (local): she stays at her desk, a held-back box stays under it, one debrief line checked first | Beat 1.2, §7.1, §8; SE §3 Noor; MC §2, §4.2, §5, §8, §10; s0 §6 KO resilience |
| M-05 | "Seven years, and nobody turned it off." opens HaX's back-to-work line after the confession | Beat 3.3 step 5; SE §4.3 |
| M-11 | Cold-start wall: with five or more unplayed cards, only m04, m05, m07, m08 keep their never-played sentence; the rest share one line | §3.1 beat 5, §10.1, §10.2; SE §9 |
| M-14 | Marked open: real per-flag times before stage 4 | §2 budget notes |
| MS-01 (major) | m03's never-played card: "Their Cardiff broker" (shipped m03, `m03_opening_briefing.ink:293`). Victoria's threat line ("My associates offered to deal with you.", `m03_npc_victoria.ink:737`) is not quoted in any m09 file | §10.1; SE §9 |
| MS-04 (major) | Stale "closing card" lines for the Recruiter replaced by "Elsewhere" clauses per value (`taken` / `refused` "The Recruiter: at large, her people at their desks."; `named` "The Recruiter's network: rolled up."; `double_crossed` "About half of them. She warned the rest.") | Beat 2.4 route table; MC §3.2 table (four rows), §6 `m05_final_choice`, §10 `recruiter_offer` |
| MS-06 | Arakawa "from Sacramento, lives in Billings" | SE §3 |
| MS-08 | "Haiku VM plan" → the VM plan (`finale/FINALE_VM_PLAN.md`) | s0 §6 next steps |
| MS-10 | Quintero "doesn't trust the order"; the two "like any intercept" call-report lines → "any other call log" | SE §3, §4.2; Beat 3.6 |
| MS-11 | "This is the same, bigger." → "This is that letter, a thousand times."; "ranked last" → m10's slot pools (slot 4 after `m09_albion_notified`; else he says it in the Recruiter beat) | MC §3.5, §9 item 33, §11 change 3 (note); §13 m10 note, §14 change 30 (note) |
| MS-12 | "proposed" labels dropped in MC §3–§10 (fifteen places); MC status says §11 is applied; s0 "Proposed title" → "Title"; §13 "Stage 0 fixes (proposed" → applied | MC; s0 §1; §13 |
| MS-14 | Nothing to fix: m09 never reads `satoshi_stance` | – |
| MS-19 | Margin notes "older still" than the Albion memo | SE §2 The Architect |
| MS-20 | Open, for stage 6: whose lecture the Alpha tapes hold. Suggested settlement noted | §13 stage 6 |
| MS-21 | Malhotra's secret: one he keeps till m10 (m10 SE §3.4) | SE §3 |
| MS-22 | "moved forty miles" dropped | Beat 3.1 |
| MS-23 (m09 part) | "double-counts" → "credits the hospitals' recovery twice, so it understates the dead" | SE §5.1 |
| MS-03 (guard note) | m10 keys the briefing arrest on `recruiter_offer == "taken"`, never `sleeper_named` alone | MC §10 `sleeper_named` |
| Ruling: media room cut | m09's letters payoff no longer names the media room; m10 places Tran's handler line (since the stages 4–5 milestone: HaX's line at the server-hall prop, m10's) | MC §3.1, §10 `cage_bin`, §11 change 28 (note) |

**Counts:** 22 findings or rulings touched m09's files: 19 fixed (5 major: D-01, D-02, D-07, MS-01, MS-04), 2 recorded as open (M-14, MS-20), 1 not applicable (MS-14).

**For the orchestrator** (not fixable in m09's files):
- **`noor_ko` export** (M-02): the reviewer suggests an m10 "Elsewhere" clause. That needs `noor_ko` exported (a twelfth export), FA §3.4 and m10's import count changed. Left local until ruled.
- **FINALE_ARC copies of m09 changes**: row 63 and §6.1 (placements on her tape by codename only, arrests from 06:00 day 13; D-01); rows 36 and 74 (Danny's sheet and the rent book replace "the lease file"; D-07); §6.1 flag 3 (HaX's "Seven years, and nobody turned it off."; M-05); §1.2 (D-02's m09 line); §4.6 (the Recruiter's "Elsewhere" clauses by value; MS-04); row 60 (MS-20, at stage 6).
- **m10**: the aside's named form and the whodunit must assume WREN is unwarned on `named` because arrests wait for 06:00 (D-01); m10's own D-02 line at the briefing; the Recruiter "Elsewhere" clauses at stage 7 (MS-04); m10 SE's Arakawa to "from Sacramento, lives in Billings" (MS-06); MS-03's guard.
- **D-06 (KO pattern)**: per F16 it is read in m10; nothing in m09 reads it. If m09's Reading should also note the habit, that is a ruling for the orchestrator.
- **M-14**: real per-flag VM times before stage 4.

## 21. Stages 4–5 folded in

Applied 2026-10-21 from `../stage_4/objectives_tasks.md` §14 (P1–P20) and `../stage_5/room_layout.md` §12 (P21–P23), with their round 1–3 outcomes (S4 §16–§18, S5 §14–§16) and the orchestrator's acceptance of P1–P23. Only m09's four stage 0–3 documents were edited. "s0" is `../stage_0_initialization.md`, "SE" `../stage_2/storytelling_elements.md`, "MC" `../stage_3/moral_choices.md`; "SA" is this document. The FINALE_ARC parts of each change belong to the arc-keeper and are not applied here.

| Change | Where applied |
|---|---|
| P1 Tomb Beta's server, its station and a second launcher in the salvage cage behind the tape room; flags 3–4 and the identity scene, flag 4's read and Tesseract's call there; Gary at the salvage keypad; the legend and the Alpha deck in the tape room | s0 §2.1, §2.2 (encoding, social), §2.3, §6 aims; SA §1, §2 table and budget, §3.1 beat 6 aside, Beat 3.2 (rewritten), 3.3, 3.5, §10.2, §11 beat table and lock rows, §13 stage 5; SE §2 Gary, §4.3 (m06 aside), §6.1, §7.1 Gary; MC §3.4 |
| P2 The card opens the cage gate, the print opens the plan cabinet; Victoria's code replaces the card only | s0 §2.2 RFID and fingerprint rows; SA §1, Beat 2.1 step 1, Beat 2.2, §11 lock row; SE §2 Nightshade's line, §7.1 Victoria; MC §6 |
| P3 Sorensen as three records (hatch figure that can't be knocked down, cage figure holding only her card, hidden door-scene record holding the files) | SA Beat 2.1 staging (S-09 settled), §13 stage 5; MC §3.1 who and when, §6 Victoria row |
| P4 The cage is its own room; "…or walk out of this cage" | SA Beat 2.1 intro and step 6; MC §4.3 clock and signposting (R2-09's alternative retired) |
| P5 Noor's card opens the staff door into the reading room; cloneable on every branch; handed over when warned in time | s0 §2.2 RFID row, §2.3; SA Beat 1.2 (new paragraph; side door → staff door, twice), §10.2; SE §3 Noor, §7.1; MC §4.2, §5, §6 |
| P6 Old Coyote to a post beside the reading room's door | SA Beat 1.1; SE §7.1 `m01_maya_ko`; SE §4.3 new line |
| P7 Doors on story events open on HaX's F19 `unlockDoor` | s0 §6 design notes (new bullet); SA Beat 1.4, Beat 3.1, §11 lock rows, §13 stage 5 |
| P8 The notice and Nightshade's file are sent from HaX's hub | s0 §2.2 kept-flaw row, §2.3; SA Beat 2.2, Beat 3.4; SE §4.4, §7.1; MC §2 row F, §3.5, §4.1 |
| P9 The tagged payments are a page of HaX's case file | SA Beat 1.3; SE §7.1 `m06_monitoring_enabled` |
| P10 The Harwick & Lowe box takes the file number on a keypad | SA Beat 2.5 (with the bay label); SE §5.3 bay label row |
| P11 Sorensen's office keypad takes a code nobody has; HaX opens it on the deck | SA Beat 3.1, §11, §13 stage 5 |
| P12 Three voiced calls (`voiced: true`, F17), only their knots (F20, in progress at the time; committed since, §11); flag 4's read and the hub stay text; narration in those calls becomes HaX's asides ("Her counter's running."; Tesseract's call opens on her aside) | s0 §2.3, §6 forced phone scenes and spoken lines; SA Beat 2.4 (two places), 3.3, 3.5, 3.6, §11 voicing paragraph, §13 stage 7; SE §1 (new rule), §4.2, §4.3 (two lines), §9; MC §3.2 (two places), §3.4 |
| P13 Stage 5's verdicts on the engine list | SA §11 "Stage 5's verdicts on items 1–29" (new paragraph, which wins over the two older lists above it) |
| P14 The called guard needs a name and a sprite | SA Beat 2.6, §13 stage 6; SE §3 (new entry "The called guard"), §9; s0 §2.2 patrolling guard row |
| P15 The PIN cracker is in the start kit; the briefing narrates the handover | s0 §2.2 cracker row, §2.3, §6 opening; SA §3.1 beat 10, §3.4 |
| P16 The safe's long way is the lease date heading every page of the rent book; the desk note is gone | s0 §2.2 cracker row, §2.3; SA Beat 3.1 (two places); SE §5.3 rent book; MC §5 |
| P17 The hand comparison is an honest three-way answer to HaX, prompted by her text, closed in the identity scene if never answered | s0 §2.2 correlation row; SA Beat 2.2 (new paragraph), Beat 3.3 step 1; SE §4.2, §4.3 new lines, §4.4; MC §3.1 and §8 ("the hand comparison" for "the plan chest") |
| P18 HaX's new lines | SE §4.3 "New at stages 4–5" block (eighteen entries); SA Beats 1.1, 1.4, 2.1, 2.2, 2.4 step 6, 2.6, 3.1, 3.2, 3.3, 3.4, 3.6 in place |
| P19 The Albion papers are one folder, summarised by HaX | s0 §2.2 kept-flaw row, §2.3; SA Beat 3.2, 3.4; SE §5.3 (new row) |
| P20 Stage 6 requirement: a CyberChef encoding keyed by the legend; no `\|`, `#`, `//`, `{`, `}` in the coded string | s0 §2.2 encoding row; SA Beat 3.2, §13 stage 6; SE §5.3 (coded line and legend rows) |
| P21 Ten rooms: the restricted stacks distinct from the restricted cage | s0 §6 next steps, §7 checklist, §4 option 1 setting; SA §2 table, §11 |
| P22 The tape room keeps the LEDs and the cold; the salvage cage gets the warm server fans | SA Beat 3.2; SE §6.1 |
| P23 Room sizes: the open stacks a 4×2 warehouse floor, the salvage cage a 2×1 mesh pen | s0 §6 next steps; SE §6.1 |

**Also swept** (stale copies of things stages 4–5 changed, beyond the P list):
- Aims 2–3 and 4–5 open in pairs; locked reveal tasks; the aims paragraph rebuilt from S4 §2–§3 (s0 §6 aims; SA §11 aims, Beat 2.7 end, Beat 2.4 step 6).
- The Recruiter's call waits on HaX's ledger read and never rings in the cage (SA Beat 2.4; MC §3.2); three disjoint re-rings replace "a stage 5 engine check" (MC §3.2).
- First-ring backstops on room entry and the reload rule for every forced scene (s0 §6; SA §11).
- The invoice line lands once the player is in Sorensen's office, as HaX's text, not "a minute after the deck" (SA Beat 2.4; SE §4.3, §5.3; MC §1, §3.2).
- Torres' fallback waits for the safe, not the walk to the office, so Beat 2.7 and his call no longer meet (SA Beats 2.5, 2.7; SE §2 Torres, §7.1).
- The visible purge: trolleys and list in three steps, the warm stamp, "She's still feeding it." (s0 §2.2 purge row; SA Beats 1.2, 2.1; SE §5.3, §8).
- The debrief opens from HaX's "[Bring me in.]" and reopens until its last line (s0 §6; SA Beat 3.6, §7); the closing card and credits drafted in S4 §9 (SA §7.1 beat 8; MC §8).
- Music: Tesseract's call on the `silence` playlist (F10); "low" stays plain `noir` (no volume on music events) (s0 §6; SA Beat 3.6; SE §6.2). The shredder can't fall silent on an event (SE §6.1).
- HaX's hub rebuilt to S4 §7.1 (s0 §6; SE §4.4).
- The Alpha clip plays from the reel deck in the tape room, not "the tape room's station", with HaX in her own voice (s0 §6; SA Beat 2.4 table, 3.2, §13; SE §2, §5.3; MC §3.2 table, §9 item 25).
- **Derived from P1:** the master schedule's unticked line is now the salvage cage's, not the tape room's, so "Her schedule. This room isn't on it." still holds where it is said (in the salvage cage); the ticked list gains the stacks and the tape room (SA §1, Beat 3.1; SE §5.3).
- "Plan chest" → "plan cabinet" for the object (s0, SA, SE, MC), and in HaX's spoken clock line, "go past her to the cabinet", as FINALE_ARC §6.1 now has it (SA Beat 2.1; SE §4.3; MC §4.3). Sorensen's pencilled query keeps "plan chest: not listed. Keep?": it is her own word, P2 quotes it that way, and FINALE_ARC doesn't quote it.
- Talked-down Sorensen writes at the feed table in the cage, not at the hatch counter (MC §4.3), since the hatch record hides once the cage opens.
- The printed ledger's shelf is in the cage, so "Show her the page" no longer waits on stage 5 (SA Beat 1.2; MC §4.2; SE §7.1).
- The m06 admission now "waits for the salvage cage" (SA §3.1 beat 6; SE §4.3).
- Budget: about 76 on the critical path; M-14 still open (SA §2; s0 §7).

**Not applied, and why.**
- FINALE_ARC copies of P1, P2, P3, P4, P5, P6, P7, P8, P9, P11, P13, P14 (FA §1.3, §1.4, §3.1, §3.4, §5.2, §6.1, §8, §13): the arc-keeper's, not these files'.
- P18's VM steers for flags 2–4: only flag 1's line exists. S4 §7.1 leaves the other steers to the VM plan (opus48) at game-design level, so none is written here.
- P14's name and sprite: not chosen. Stage 6 or 7 casts the called guard.
- P20 is a brief for stage 6; the requirement is recorded, not carried out (no encoding or coded string chosen).
- Review-round tables (§15–§20 here, MC §11–§15) and the stage 4 and stage 5 brief notes in §13 keep their wording as the record; the two older engine lists in §11 stay, with the new verdict paragraph marked as winning.
- Narrator lines in the briefing and the debrief stay: P12 applies to phone threads only, and those are person-chat cutscenes.
- Flag 4's read stays text, as S4 §15 item 1 leaves open for the user (about 15 more lines if voiced).
- Checked against FINALE_ARC §1.3, §6.1 and §18 after its own stages 4–5 fold: the salvage cage (server, station, the three phone scenes), the plan cabinet and HaX's "…to the cabinet" line now match. One FINALE_ARC sentence was not taken: §6.1 purge item 1 still says that on Victoria's route "the bins are two objects inside the cage door, taken as it opens". These files follow stage 5 §3.7 and P3 (a hidden Sorensen record hosts the door scene and holds both files); that sentence is for the arc-keeper.
- SE §2's Gary sample gains a stage-direction note naming his hint's content (the operation, the legend); the exact wording waits for stage 6's encoding.

**Counts:** 23 P-changes; 23 applied to stages 0–3 (P14, P18 and P20 in part, as above). 17 further stale copies swept, plus HaX's clock line aligned to FINALE_ARC. FINALE_ARC parts left to the arc-keeper.
