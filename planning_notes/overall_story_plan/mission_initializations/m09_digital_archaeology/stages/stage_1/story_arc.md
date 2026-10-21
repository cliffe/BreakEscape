# m09 Digital Archaeology: Stage 1, narrative structure

Stage 1. Author: stages 1–2 author (Opus), 2026-10-21. Status: round 3 fixes folded in (§15 round 1, §16 round 2, §17 round 3).

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

**The night's shape in one paragraph.** The player gets in, sets up a drop terminal and opens the catalogue (flag 1). The catalogue says the restricted series is in the cage where Sorensen is feeding the shredder. The player talks to her at the cage's hatch, saves one bin, and gets into the cage. Nightshade's file is in a plan chest, and the hand on it matches the margin notes in HaX's old training notebook. The ledger (flag 2) names WREN on the raid team. As soon as the player is out of the cage the Recruiter rings with an offer, and as she hangs up she wipes a tape deck: the player saves one tape. HaX says three words about a line she was taught. In Sorensen's office the player opens the safe with the cracker a raid-team member gave them at the briefing; the Reading is inside. In the tape room is Tomb Beta's last server. Flag 3 brings the name, with HaX and Netherton on the phone; flag 4 brings the hour, the defences, the key, and Tesseract's own casualty sheet. Tesseract rings HaX. Netherton signs the Montana order.

**The surprise the night builds to.** The purge order comes with a destruction schedule. It protects the cells: it lists the Initiative's placements, its letters and its recruits by series, and whatever of his old paper is filed beside them. Sorensen has ticked each room of the building down its margin as its series are reached; the tape room's line has no series and no tick, and she has pencilled one query: "Reading (safe): not listed. Keep?" The master copy is in her safe, so every player holds it (R2-S03). The server that holds his credential, his Albion memo, the hour and the defences is left running on purpose. He wants to be known, he wants SAFETYNET to read what it kept, and he wants them to come (FINALE_ARC §1.2). A player who read the schedule says it first, at flag 4; for everyone else HaX states the fact from the job's side, once; his call to HaX is the only confirmation.

## 2. Structure at a glance

| Part | What happens | Rooms | Flags | Minutes |
|---|---|---|---|---|
| Briefing (cutscene) | The order, the wall of cards, the raid team, the cracker | Task Force Null's room (cutscene background) | – | 4 |
| Act 1: Get in | Loading dock, the guard, the clerk, the drop terminal, the catalogue; the shredder heard through the wall | loading dock, front desk, reading room | 1 | 15 |
| Act 2: The stacks | The cage and the bins, Nightshade's file, the ledger and WREN, the Recruiter's call and the deck; optional: the cross-reference, Tran | restricted stacks (the cage), open stacks, server closet, reading room | 2 | 31 |
| Act 3: The name and the hour | The safe and the Reading, the schedule, the tape room, Tomb Beta's server, the identity scene by phone, the Albion papers, the hour and the key, Tesseract's call | Sorensen's office, tape room, salvage cage | 3, 4 | 31 |
| Debrief | Kowalczyk's question; Netherton reads the two names and signs the Montana order | airfield hangar (cutscene background) | – | 4 |
| **Total** | | nine rooms (stage 0 §6) | 4 | **85** |

**Budget notes** (rebuilt in rounds 1–2, S-01, R2-S04). **About 85 minutes with the field guides; 95–100 without.** Stage 8's playtests set the published figure. Each act's minutes are the sum of its beats.

- Each VM stage is budgeted at 7 minutes for a player following the field guides, an assumption, not a measurement (no shipped mission records time per VM stage): flag 1 inside Act 1, flag 2 inside Act 2, flags 3 and 4 inside Act 3. The purge moves on story events, so a slow VM stage stretches its act without costing anything in the story.
- Act 3 lost its two walk-backs: the Reading is in the office safe (no trip into the open stacks), and flag 3 is submitted in the tape room with HaX and Netherton on the phone (no trip to the reading room and back). Together they save about seven minutes (§14 change 12).
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
5. **The wall** (row 57). HaX walks it in about sixty seconds: one short line per card, m01 to m08, in the player's own outcomes or the never-played sentence (§10.1). The last two cards carry a name each and no outcome: Agent 0x19 Callum Fraser and Agent 0x6B Ana Lúcia Ferreira, the two dead from the unanswered m07 sites. HaX does not read them. Netherton: "I will read those two myself. Later." (row 100.)
6. **The suspect, without the name.** At the "-- A." pinned above the wall, Netherton: "ENTROPY's planner. Every card on this wall has his initial on it somewhere." (S-21.) Then: SAFETYNET has a suspect; he was one of theirs; "I will not say the name in this room until we can prove it." (W-17: no "Tonight we can.") On `m06_architect_identity_found`, HaX to the player alone: "You heard me say it after HashChain. I called it his guess." and a look; the admission waits for the tape room (S-10, R2-S06). The name lands in the identity scene (Beat 3.3) for every player, cold starts included (§14 change 1).
7. **The stakes** (HaX, fact first, three short lines):
   - Nobody knows what the Publication is. They know what it would be made of: the database, "every weakness we have ever catalogued". One entry, said plainly: an infusion-pump flaw in a hundred and forty hospitals.
   - Analysis's guess, labelled as one: hundreds dead in the first month if the cells get it. "They're guessing. I'd like to find out they guessed high." Flag 4 replaces the guess with his own figure.
   - On `m07_completed` with Austin uncovered (row 83): "Day eleven. Eleven counties." Austin covered: no line (the wall's m07 card says it). On Meltdown uncovered (row 85), the wall's card carries the hospital line instead.
8. **The question hub** (§3.2). Three topics.
9. **The raid team** (§3.3), including Quintero's answer to "why one agent".
10. **The cracker.** Kowalczyk hands it over; HaX: "The long way is over." (row 118); Kowalczyk's reply (§3.4).
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

Since m08 every PIN cracker Nightshade ever signed for is quarantined in stores, which is why the player has gone without since St. Catherine's (m08's ATHENA: "still signed out to Agent 0x47"). Kowalczyk's is her own breaching kit: "This one's mine. Never been through stores, never been near him." That line is true. It came to her from Tomb Gamma's bench through the Initiative, logged "to WREN" with a serial (m10's third clue, FINALE_ARC §4.4). She gives it because she wants to be liked by the agent she will go into the bunker with, and because helping 0x00 reach Montana is what the Architect wants (FINALE_ARC §1.2). In m09 it opens Sorensen's safe (Beat 3.1), and HaX's "The long way is over" is the line the player remembers when m10's bench gives the serial back.

Default for the canon question (row 29): not every SAFETYNET cracker comes from the bench. The ones Nightshade procured and signed out did, and so did WREN's. Stage 6 writes that into the Citadel's incident file.

## 4. Act 1: Get in

About 15 minutes. Aim 1: "Get in and set up the drop terminal". Aim 2 opens at flag 1. The purge is already running when the player arrives (FINALE_ARC §6.1): the first thing they hear inside is the shredder.

### Beat 1.1: The loading dock (2 minutes)

Night, sodium light on a grain warehouse with the archive's name stencilled over an older one. HaX's first line on the ground is short and gives the player the clock: "That noise is a cross-cut shredder. It's been running since before you landed." The dock door is locked (picks). Cody Old Coyote's torch moves along the fence on his round; he is the player's first lesson in the building's rhythm, and he is innocent (HaX: "Night guard. Twenty-four. Not ours, not theirs. Don't hurt him.").

HaX gives the building's people here, where they matter, in three short lines (moved from the briefing hub, S-22): the director, Margaret Sorensen, county clerk for twenty years before this; a clerk on tonight; and the IT contractor, Jesse Tran, with the m01 warning by branch (row 6): on `m01_completed and not m01_maya_ko`, "Maya's list has a Tran on it."; on `m01_maya_ko`, "Maya Chen would have flagged him. We don't have Maya's names."; never played m01, "Viral Dynamics' staff files have a Tran in them." On the briefing's raid-team answer, one line if the player backed Quintero: "Quintero's going to hate that she was right if this goes badly. Let's not."

On `m01_maya_ko`, Tran also makes one move on the main path (S-13): after flag 1 he radios Old Coyote to "check the reading room", and the guard's round passes the drop terminal once. Avoidable as any patrol is.

### Beat 1.2: The front desk and Noor (3 minutes)

Noor Haddad is at the front desk at an hour clerks are not, loading archive boxes onto trolleys from a printed list. Sorensen called her in "for a scheduled destruction run", and in a records archive that is a normal night's work, which is why Noor has not asked. The trolleys go to the cage. The player can talk to her as whoever they choose to be (a contractor, the auditor, or SAFETYNET), and what she offers depends on m05 (row 62):

- **Warned in time** (`m05_found_pipeline_list and not m05_recruiter_deal_accepted`): SAFETYNET reached her weeks ago, and she knows what the player is the moment they say a name. She gives the warning ("Peg's been in the cage since before I got here. She never feeds the shredder herself, and tonight she's sent me home twice.") and the door (her card for the open stacks' side door, which keeps the player off Old Coyote's route).
- **Warned late** (`m05_found_pipeline_list and m05_recruiter_deal_accepted and m05_recruiter_deal_confessed`): someone from SAFETYNET rang her last week. She gives the warning, not the card: "I don't know you. I'm not losing this job for a phone call."
- **Not warned** (every other case, cold starts included): a wary bystander. The player can tell her she is on a recruiting list and that Sorensen's "after-hours filing" bonus last month was the first approach. That choice (§8) is hers to react to.

Noor's trolley list is the player's first look at what is being burned: a copy of the destruction schedule, series numbers, no titles. "Series R" appears on every line.

### Beat 1.3: The reading room and the drop terminal (3 minutes)

The reading room is the archive's public face: long tables, green lamps, a microfiche reader, a terminal that only shows the public catalogue. The player sets up the SAFETYNET drop terminal (the field laptop) on a reading desk, and HaX is live on it. On `m06_monitoring_enabled`, the tagged payments are an object on the terminal from the start (row 71): one line of money from the fund to a lease, which HaX reads once ("Your tags, from HashChain. Someone's paying rent on a building in Montana that isn't this one.") and which, on the no-coordinate branch, points at the bunker before the deed does.

HaX gives the VM job in story terms: the public catalogue hides a series; the catalogue server does not. The drop terminal also carries her case file: the order's photograph, the wall's cards, and one item she does not mention, a scanned notebook labelled only with a course code (Beat 2.2).

### Beat 1.4: Flag 1, the catalogue (7 minutes)

**VM flag 1** (a foothold on the catalogue server): the index of every box, tape and shelf, including the restricted series. Submitted at the drop terminal. HaX says what it bought: the shelf marks for Series R, which sit in the restricted cage, and "the boxes on Noor's trolleys are the ones on this list". **Lock (R2-S01):** flag 1's reward opens the restricted stacks' outer door, so the cage cannot come before flag 1. It also gives the first clue to the tape room's code: one catalogue entry for the tape room is written in an old archive encoding (decoded later, Beat 3.2).

On `m08_nightshade_triple_agent`, **Nightshade rings** here (row 104), from a SAFETYNET room, on the player's handset, competing with HaX for the line. He names which database entries the archive's restricted cage was built against (the reader that takes a lifted print; the badge reader that takes a clone), and he is right. HaX lets him talk and says nothing until he has gone: "He's right. I hate that he's right." This is his whole m09 presence until his file (Beat 2.2).

**Act 1 ends** with the shelf marks on the screen and the shredder still going: Series R is behind the mesh, in Sorensen's hands. Aim 2 opens: "Find the restricted series before it burns".

## 5. Act 2: The stacks

About 31 minutes. Aims 2 and 3. The purge's first two events happen here, in FINALE_ARC §6.1's one order: the cage, the ledger shelf, flag 2, the Recruiter's call, the tape deck.

### Beat 2.1: The cage (8 minutes)

The restricted stacks are a steel mesh cage inside the warehouse, floor to roof. Sorensen is inside, at a cross-cut shredder and a degausser, feeding them from Noor's trolleys.

**Staging** (S-09, for stage 5). The design needs the player to talk to Sorensen, clone her card and lift her print while she is behind the mesh. The intended staging: the cage's front is a counter with a document hatch, and Sorensen works at the counter, on a tile the player can reach for conversation and the cloner, with the locked cage door beside it. If the engine cannot hold that, the fallback keeps the beat: she comes to the hatch counter when the player rings its bell. Stage 5 checks both against m08's clone-while-talking build before placing anything.

1. **The bluff.** The player can be the auditor the lease-holder sent (stage 0 §5). Sorensen is polite, precise and in no hurry; auditors are a thing she knows how to handle. She stamps each box "destroyed" with a rubber stamp she sets down on the hatch shelf between boxes, and her master card hangs on a reel at her hip. The player lifts her print off the stamp and clones the card while she talks (the m08 technique). On `m03_victoria_fate == "recruited"`, Victoria's protocols read the archive's internal mail, and Sorensen's mail holds the cage's maintenance code: a second way in that replaces the print and the card (row 32). On that route the recognition plays at the cage door, and the bins are two objects just inside it: HaX names them as the door opens, the player takes one, and Sorensen tips the other. If the player takes neither and walks past, she tips the far one and Derek's, nearer the door, survives, as at the hatch (S-16, R2-S10, R3-11).
2. **HaX names the bins and what each buys** (W-12, S-08). Two bins wait by the shredder's mouth, and HaX gives each one line:
   - **By the hatch: Derek Lawson's file**, from the restricted series, written before Viral Dynamics hired him, costing his fall (rows 1, 9). It is the Architect's own hand on the player's first case, with his standing order to Derek and a page of costing notes. HaX names the stake that matters (R2-S09, N-14): "Bin by the hatch is Derek Lawson's file, and it isn't Derek's handwriting on it. It's the only place anyone wrote down why he did what he did." What it buys: the one answer m09 gives m01 (on `surrender`, why he put the device down; on every value, his fall costed in advance), a second sample of the hand (Beat 2.2), and Derek's file read back in the debrief. Stage 3 decides an m10 echo (for example, his standing order as a record answer under Tesseract's first claim).
   - **The other bin:** by default **the Initiative's letters to Social Fabric**. They are Jesse Tran's trade route, with his drop and his handler in them. What they buy: a lever on Tran (Beat 2.6). Holding them, the player can talk him off the wipe, which saves the tape side without a fight; on `m01_maya_ko` the letters give back what Maya's names would have given (HaX: "That's the warning we didn't have."). On `m08_nightshade_tidied` this bin instead holds **the copy Nightshade sent ahead** (row 113): what he cleared from his locker. It buys his own words on what he took, which changes his reply to his file on the triple-agent branch (stage 2 §2) and is read back in the debrief.
3. **The recognition.** Before the player can act, Sorensen ends the bluff herself. She quotes the player's file at them from memory, because she filed it (row 101): one line per value of the Reading's first entry, in her words (stage 2 §3 has every line). A cold-start player hears the second entry's never-played form ("Your first days aren't in your file. Somebody at SAFETYNET is careful with you.", W-10). Then: "You're not from the lease-holder. You're the one he writes about." HaX: "...She's got a file on you." This is the act's first spike.
4. **Why she lets the player carry on** (W-25). She keeps stamping and keeps the reel on her hip. If the player is plainly cloning or lifting: "Take the print if you like. By the time it matters, the shredder will have caught up."
5. **The choice** (every player): pull one bin through the hatch. Sorensen tips the other into the shredder as the player does, without hurrying. If the player skips the hatch and opens the cage, the bin by the hatch (Derek's) survives and the other is gone. Either way, by the time the cage opens one bin is ash.
6. **The cage opens.** Sorensen keeps feeding the shredder and does not fight (a non-combat "keeps shredding" state for stage 5; E-2). The player can arrest her, knock her out, or leave her at it (stage 3 decides whether talk can stop her). A downed or arrested Sorensen stops the rest of the paper purge: everything she had not reached survives (FINALE_ARC §6.1). Her card drops when she is down; her print stays on the stamp.

### Beat 2.2: Nightshade's file and the hand (3 minutes)

In a locked plan chest at the back of the cage, never on a trolley: Nightshade's recruitment file from fifteen years ago, when he was 23 and in the intake SAFETYNET's chief strategist was teaching (row 106). Every annotation is in one hand.

**The exemplar** (S-05). The scanned notebook in HaX's case file (Beat 1.3) is her own notebook from that course, with her teacher's margin notes in it. The player compares the hands; it is document work the player does (stage 0 §2.2). On a saved Derek file, his costing page is a second sample. When the player says they match, HaX, after a moment: "Those are my notes. That's his pen." Then, before the player can ask: "Hold that. I want it from two directions before anyone says a word." She says nothing more until flag 3. The salvage cage's Tomb Beta binders confirm the hand again in Act 3 (Beat 3.2). The m03 and m07 echoes are style, not handwriting ("You've read him before").

On `m08_nightshade_triple_agent`, the player can send Nightshade his own file from the drop terminal (now or any time before the debrief; `nightshade_shown_file`). If they do, he sends one text back (stage 2 §2). The choice pays off at m10's door (row 105).

### Beat 2.3: The ledger and flag 2 (7 minutes)

The ledger shelf holds the Initiative's printed ledger in a locked binder, codenames only, unreadable without the key the live copy carries.

**VM flag 2** (the Insider Threat Initiative's live ledger): submitted at the drop terminal in the reading room. HaX reads it aloud in story terms: twenty-three placements, forty-seven candidates, and a legacy section older than any list m05 found. One legacy entry, under the codename WREN, was updated on day 10 in Sorensen's hand: "assigned TF Null, Montana operation".

- HaX: "Montana operation. Day ten. That's one of the four you met at the briefing." (R2-S07: UTC.) Then the rule: she has told Netherton; he will say nothing to the team; "and neither will you."
- **What m05 changed** (rows 63, 64, 64a), one line on the page and at most one from HaX: on `public_exposure` the twenty-three are marked "blown"; on `turn_double_agent` Torres' entry still reads "live", because the Initiative never learned he turned; on `combat_lethal` it reads "closed placement" in Sorensen's hand and HaX says nothing for a beat; on `arrest`, `combat_nonlethal`, or never played, "lost".
- On `m07_found_tomb_gamma` (row 95): "You bagged the dossier. 'Including the people.' This is the people."
- WREN's legacy entry carries a source code, "H&L", and a file number, which opens the optional cross-reference (Beat 2.5).
- The printed ledger at the shelf becomes readable: optional, for the player who wants the page in their hand. It holds two small finds: on Reeves in custody (`m02_reeves_fate` in `arrested`, `ko`, `flagged`, or the read rule on `m02_insider_asset_arrested`; rows 21–22), his handler's contact sheet, clipped inside, as an object with no voiced line (W-23); and Noor's codename on the candidates' page, which a player who told her she is on a list can show her (§8). If Sorensen is still free, she shreds the binder once it has been read; nothing is lost, because the flag holds it.

### Beat 2.4: The Recruiter's call (5 minutes)

**When, and what guarantees it** (S-03, S-04, R2-S01, R2-S02; each is a stage 4–5 lock or condition):

- The call fires once **flag 2 is in and the cage has been opened** (`cage_opened`), after a short delay, when the player is out of the cage and not in another conversation. A player who submits flag 2 before the cage hears HaX read the ledger then; the call holds until they leave the opened cage. So the cage, the bins and the hand always come before the call.
- **The call's first line sets the defaults** (R2-S02, R3-02): `recruiter_offer = "refused"`, the deck to nothing pulled, and `recruiter_secret` by branch (`kept` on sold-and-lied, `confessed` on sold-and-confessed, `""` otherwise). The choices overwrite them. Its done-flag, `deck_choice_made`, is set on its last choice. If the player closes the call before that (Escape, damage), it rings again on leaving the room and resumes at the last unanswered choice, so own-it-or-hang-up is never skipped. §11 gives the same rule to every forced phone scene.
- **Sorensen's office opens on `deck_choice_made`** (Beat 3.1; R3-01): the Recruiter fires the wipe from the deck's controller in Sorensen's office, and HaX follows the connection back to the room's door. With the office holding the tape room's key card, flags 3 and 4 always come after the deck choice. Sorensen's mail stays the recruited-Victoria route's alone.

Phone only, no face, as in m05. HaX stays on the line. The call has three openings and one spine, and it ends in the second purge choice.

**Openings** (row 61):

- **Sold and lied** (`m05_recruiter_deal_accepted and not m05_recruiter_deal_confessed`): the receipt and the offer in one breath: "Forty-seven names, and nothing points at you. Does your handler know? I'd like to give you one more name, and I'd like you to keep this one too." HaX has heard it. The player's choice (W-24; stage 3 owns the wording): own it on the open line ("She's right. I took her money in the spring.", `recruiter_secret = told`), or hang up (`kept`). A hang-up ends her half of the call; HaX stays on, says the wipe has started, prices the two tapes, and asks which (S-02). Her file → `named`; the Alpha tapes or nothing → `refused`, as FINALE_ARC §3.4 has it. HaX asks about the spring once, later, and lets it lie.
- **Sold and confessed** (`m05_recruiter_deal_accepted and m05_recruiter_deal_confessed`): HaX cuts in first: "We've talked about that. She has nothing on you." The leverage dies on the line, and the Recruiter goes straight to the offer (`recruiter_secret = confessed`).
- **No deal in m05, or never played:** she introduces herself. A player who finished m05 without taking her deal (refused, or never offered terms) hears a line that fits both (S-11): "Last time I said the next one would cost me more. This is the next one." A cold-start player gets a stranger who already knows their designation and their kit.

**The spine** (every player):

1. **Her grievance, as accounting** (S-18, W-18). The Architect has taken WREN's tasking for Montana: WREN still reports to the Initiative and draws its money, but her orders now come from him, not from the Recruiter. And his order is burning her records office. "Eleven years of placements, written off in a night for his schedule. I'd like something back on the books."
2. **The offer.** WREN's name, now, and always right (trusting her is never a trap). The price: the player lets her file go. Her file is a tape on a deck in the archive, and she is about to wipe the deck herself.
3. **The price of a double-cross, said before the choice** (N-01, R3-03). The threat covers the deal only: "Take my name, and if anything else comes off that deck, I'll know before your plane does. Half my people will have moved by morning."
4. **HaX names what is on the deck, and what each is worth**, before the player answers (W-04, N-01): the Recruiter's file, a tape with her handler list (by m05: the handlers for the twenty-three; on `public_exposure` her handlers and the forty-seven; on `turn_double_agent` the names Torres could not give), and Tomb Alpha's tapes, his teaching sessions from the first workshop, recorded, with annotation sheets in his hand: "Her file is her network, all of it. The Alpha tapes are him teaching, recorded. He teaches what he'll do. If he built the bunker the way he taught it, it's on there." No promise that the player hears it tonight; playback is stage 3's call (R2-S15).
5. **The answer.** Take the offer: "Halina Kowalczyk. Her mother's care home has had my cheque every month for eleven years. She gave you something at the briefing, I expect. She's generous. It's how we hired her." (N-09: WREN's reason, said as an expense.) On a deal she leaves the Alpha tapes running for the player and watches the deck to see it kept. She hangs up and fires the wipe; the player has HaX pull the Alpha tapes (`taken`), her file anyway (`double_crossed`), or nothing (`taken`, R2-S13). Buying from her leaves **a receipt in the Initiative's books** (R3-04): m10's Tesseract reads those books (§14 change 30). Refuse: she fires the wipe at her own file first, burns the line and drops off, sure it's gone (R3-03). HaX has the drop terminal on the deck a second ahead of it; the player has her pull the file (`named`; HaX: "She thinks it's gone. Let her."), the Alpha tapes or nothing (`refused`). Because she believes her file was wiped, she warns nobody, and the whole network can be rolled up. The tape not pulled is wiped. `sleeper_named` is set only when she has said the name; `deck_pulled` records which tape (§14 change 25). On "thanked Kowalczyk" at the briefing, HaX: "You thanked her at the briefing. Keep doing it." (W-19.)
6. **After she hangs up.** On `double_crossed`, HaX: "She'll know inside the hour. About half of them, then." The Recruiter's answer waits for the m10 epilogue ("I'll remember the shape of you", row 60).

**Why it is a dilemma for every player** (W-04, N-01). Each route gets one thing and loses one the player has just heard priced:

| Route | Gets | Loses |
|---|---|---|
| Take, pull the tapes (or nothing) | certainty about WREN; his teaching, and what it may say about the bunker | her network; a receipt in her books that the Architect reads |
| Double-cross | certainty about WREN; about half her network | the tapes; the other half, warned; a receipt; an enemy who knows the player's shape |
| Refuse, pull her file | her whole network (she thinks it was wiped, and warns nobody); a clean record | certainty (two faces at best, from the optional cross-reference); his teaching |
| Refuse, pull the tapes | his teaching; a clean record | her network and certainty |
| Refuse, pull nothing | a principle | everything on the deck |

### Beat 2.5: The cross-reference, optional (4 minutes)

WREN's entry points at Harwick & Lowe, an executive search firm closed years ago, whose dead files are deposited for retention in the open stacks like any other client's boxes. The file number leads to a placing sheet, not a name: two lateral hires placed with "a government client" in the same quarter eleven years ago, both still at SAFETYNET, both on Task Force Null. H. Kowalczyk and M. Quintero. Harwick & Lowe placed real candidates as cover, and Quintero is one of them. Each sheet lists next of kin in the same dull type, and both list a parent in residential care (W-08): for Kowalczyk, her mother, which is the human fact under WREN's eleven years; for Quintero, her father, which is a coincidence that the file cannot tell apart. Reading the sheet sets `sleeper_shortlist` (a new export, §14 change 6), whatever the order: m10 reads `sleeper_named` first (R2-S13). On "backed Quintero" at the briefing, HaX: "You took her side at the briefing. Keep it. Don't take her word."

The question a player of m05 will ask, answered once by HaX at the sheet (R2-S08): "After Quantum Dynamics we checked everyone TalentStack ever touched. Harwick & Lowe shut before TalentStack opened."

On `m05_torres_turned`, **Torres rings** from his desk inside the Initiative as the player opens the boxes after flag 2, or, if they never do, once on the walk to Sorensen's office (S-12, R3-10: never before WREN exists). He knows the legacy filing scheme (one step off the search) and says the line only he would know about the forty-seven: "They pick people with someone to lose. Look for the ones with a sick parent." On the shortlist it lands on both women, and on Noor. It does not decide between them. He also says, once: "I gave you this address in the spring. It was a line in a list."

### Beat 2.6: Tran and the tape side, optional (3 minutes)

Jesse Tran runs the rest of the tape side's wipe from the server closet: the Initiative's legacy recruitment interviews, optional lore. He is Social Fabric's agent on the staff (row 6). On `m01_maya_ko`, if he sees the player first, he calls in a second guard (avoidable). Stopping him (talk, knock-out or arrest) saves whatever of the tape side is still unwiped; with the Social Fabric letters in hand, the talk works without a fight ("You can explain those to Social Fabric, or to me."). It never saves the deck, which the Recruiter wiped herself.

### Beat 2.7: Afterwards (1 minute)

After the deck, once the player is moving again, HaX rings unprompted, once (W-03, orchestrator ruling). She names what the purge cost, once and plainly: which bin and which tape are gone. A pause. Then three words, and one sentence that is new:

> Agent HaX: Afterwards. Not during.
>
> Agent HaX: It's yours to carry. Nobody else signed for it.

Then, unasked, the beat's last line: "The rest when this is over. Her office is past the binders." (R3-06; §14 change 15.) m09 never says what the rest is; m10 pays it at 06:00 (agreed with the m10 author, whose confession-promise wording matches this one). She does not say whose line it is. On `m07_architect_echo_heard` the player already knows who said it to them, and she knows they know; she doesn't add a word. This also lives in her hub, once, for a player who closed the call early. If Torres' fallback call is due on the same walk, HaX's comes first and his follows after a delay (engine item 5).

**Act 2 ends** with WREN named, or narrowed to two faces, or one of four; the purge's two losses named; and three words from HaX. Aim 4 opens: "Search the director's office".

## 6. Act 3: The name and the hour

About 31 minutes, two VM stages included. Aims 4 and 5. Two rooms on the critical path (Sorensen's office, the tape room), no walk-backs (S-01).

### Beat 3.1: Sorensen's office, the safe and the Reading (6 minutes)

**Getting in** (R2-S01, R3-01; a stage 4–5 lock): the office door opens on `deck_choice_made`. The Recruiter fired the wipe from the deck's controller in this office, and HaX traced it: "She fired it from Peg's office. I'm on the door." So the office (and the tape room's key card) always comes after the deck choice.

A county clerk's office moved forty miles: a wall of binders, a kettle, a framed certificate for twenty years' service to Lewis and Clark County. The safe opens with Kowalczyk's cracker, or the long way (the PIN is on her desk for a player who looks). HaX: "Kowalczyk's toy. Tell her it worked." On `sleeper_named`: "Her cracker. Use it anyway."

**The safe** holds the tape room's key card, the master destruction schedule, and the Reading (S-01, S-17, R2-S03): a thin file, the Architect's reading of Agent 0x00 (row 101), four entries and a last page, in his written register (stage 2 §5). Finding it is an aim-4 task; reading to the last page is optional and sets `reading_finished`. The player reads it alone; HaX says nothing while it is open. The Reading also has one line about her (W-13): "Their handler will cover for them. She was taught to." Afterwards HaX asks once whether the player wants to tell her what it says. Telling her includes that line, and she hears it just before her confession; not telling her keeps it from her.

**The four entries** (row 101; FINALE_ARC D-06): m01 `final_choice`, the innocents line, m04 `disclosure_choice`, m07 `debrief_stance`, each with a never-played form; wording in stage 2 §5. **The last page** predicts that when the hour comes 0x00 will be in the room with the key in reach, and will press it (FINALE_ARC §1.2). Finding it on the page in his words is the second half of the cage's spike.

**The destruction schedule** (S-07, R2-S03). The master copy that came with the order, in the safe, so every player holds it. Down the margin is Sorensen's planning pass from before the night: each room of the building, its series checked against the order, ticked as covered: dock, front desk, reading room, open stacks, cage, closet, office. The tape room's line is there with no series against it and no tick. On the same page, her one query: "Reading (safe); plan chest: not listed. Keep?" (R3-07: two of his own things, kept off the order.) Reading the page sets `schedule_read`. The game doesn't point at the gap until flag 4.

**The office files**, two objects, at most one line each (W-23):

- **The lease file** for the bunker's land and buildings, held for the lease-holder, Zero Day's front company (m03), paid from the Crypto Anarchists' account (m06). It holds Tomb Gamma's deed and construction file: the paper half of the defences, and on the no-coordinate branch the bunker itself ("There it is. Tomb Gamma has an address." Elsewhere: "Same coordinate Nightshade gave us. Now it has a lease."). One line by branch, in priority order: on `m03_victoria_fate` `arrested` or `ko`, Victoria's keys (or seized devices) opened Zero Day's client list in the spring, and this lease was on it; else on `m06_irina_recruited`, "Irina's account paid for this. Tell her it bought us the deed."; else the Danny line by `m03_danny_fate` (row 36), from Zero Day's note on him in the same file.
- **The refit ledger**: what the bunker's refit cost and who paid. On `m02_paid_ransom`: "St. Catherine's money. It bought the blast door." (row 17).

### Beat 3.2: The tape room (4 minutes)

The tape room needs the key card from the safe and a door code. The code is the catalogue entry flag 1 turned up, written in an old archive encoding; the player decodes it at the CyberChef workstation. On `m02_gary_protected`, **Gary Whitlock rings** when the player first tries the keypad (row 23) with the decode hint. Without Gary, the catalogue's own legend does it the long way.

Inside: tape racks to the roof, cold air, and among them Tomb Beta's last server, still racked, still running, its fans the only warm thing in the building. Through a second mesh door, the salvage cage holds what came out of Tomb Alpha and Tomb Beta when they closed: crates, a bench, a door controller with its wires cut, and Tomb Beta's enrolment binders, annotated in the same hand as Nightshade's file and HaX's notebook. On the Alpha-tapes branch, the tapes HaX pulled are on the drop terminal; the optional decode of their annotation sheets, at a terminal (S-15), gives the line HaX recognises in his hand.

### Beat 3.3: Flag 3 and the identity scene (10 minutes, 7 of them VM)

**VM flag 3** (the owner of Tomb Beta's server): the credential text beside the flag is a SAFETYNET staff credential issued to Dr Adrian Tesseract before he left seven years ago, never revoked. Submitted in the tape room, beside the machine, through the field kit's link to the drop terminal (§14 change 12). The identity scene plays there, by phone, with the server's fans as the only sound in the room.

**The trigger** (R2-S02, a stage 4 condition): the scene fires on flag 3 alone. If Nightshade's file is not held, HaX holds the name back: "Bring me his file. Then we say it." and the scene resumes when it is picked up. `identity_scene_done` is set on the player's answer, the scene's last choice; closed before that, the scene re-rings and resumes at the unanswered choice (§11). Tesseract's call, the conclusion aim and flag 4's read all wait on it, so nobody can ring HaX, or read the hour, before the name has been said, and `hax_confession_answer` is never empty. The scene carries the proof, the name, one sentence on who he was, at most one recognition line, HaX's confession with its cost, and the player's answer (FINALE_ARC §13 item 9).

1. **The proof.** HaX reads the credential's first line aloud and stops before the name.
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
5. **Back to work.** "There's more on his box. A memo and a draft. Read them."

### Beat 3.4: The Albion papers and the notice (2 minutes, plus the optional send)

Flag 3's files hold three documents (FINALE_ARC §1.3): the catalogue entry for a flaw in the control equipment at Albion's site, marked "retain: operational value" nine years ago; Tesseract's memo from the same month arguing it should go to the vendor; and the vendor notice he drafted and never sent. Critical Mass came through that hole at Albion.

HaX lands the m04 choice (rows 48, 57), one line by `m04_disclosure_choice`: `full`, the player told Albion's inquiry everything and SAFETYNET told the vendor nothing for nine years; `partial`, the player told half and SAFETYNET told less; `quiet`, the player kept Albion quiet, and so did SAFETYNET; never played or unset, the plain fact that Critical Mass came through this hole. The player learns his case is partly true before he makes it.

**The notice** (optional, `albion_notified`): the player can send it at any time before the debrief; HaX pushes it through the drop terminal on their word, as she did the tape. She does not tell them to: "It isn't my call. It isn't yours either. If you're going to, don't ask me first." Netherton answers it at the debrief.

### Beat 3.5: Flag 4, the hour and the key (8 minutes, 7 of them VM)

**VM flag 4** (full control of Tomb Beta's server), submitted beside the machine: the job that still mirrors to Tomb Gamma. If flag 4 goes in before the identity scene is done, HaX holds the read: "His file first. Then the rest of his box." (R3-08.) In story terms it carries:

- **What the Publication is, and what the key does** (W-06, N-02). The whole stolen database goes out free, every entry with working detail. By default it goes **city by city, starting at 06:00 UTC on day 13**. There is also a key at Tomb Gamma's console that sends **everything, everywhere, in the same minute**, and it needs a hand on it. HaX: "He's giving it away. At six it starts going out, city by city. Turn that key and it goes everywhere in the same minute." Then: "Then why build a key at all?" Nobody answers it in m09. The question points at something real: the key makes it worse, faster, and needs someone to press it.
- **The head start**: the cells get it two hours early, at 04:00.
- **The defences**: the list of Tomb Gamma's defences, each built from an entry in the stolen database.
- **His casualty sheet**, signed, his original (the correction is m10's, FINALE_ARC §4.1): 1,100 to 2,600 dead in the first month, and the sheet says which release it prices (R3-12): "Release by key, all cities: 1,100 to 2,600. Fallback by city: fewer, later." "An acceptable price for the last arms race." It replaces the briefing's guess. HaX reads the range once and does not round it. On `m06_minder_walked`: "Kemal Aydin walked out on a smaller number than this." (row 77, moved here from the briefing, W-09.)

**The realisation, stated once** (W-05, R2-S03, N-06). At the end of HaX's read:

- On `schedule_read`, the player has two options: "Her schedule. This room isn't on it." or "Read me the defences." The first gets HaX: "No. It isn't. He shredded everyone but himself." The second skips it; the call still confirms.
- Without `schedule_read`, HaX states the fact from the job's side, once: "Nobody's wiping this box. Not her, not him."

The arc states it nowhere else; the call confirms it.

### Beat 3.6: Tesseract rings HaX (1 minute)

**The trigger** (R2-S02): flag 4 and `identity_scene_done`. Its done-flag is set on HaX's last line of the report; closed early, it re-rings and resumes (§11). He rings HaX, not the player. The player's line stays open and they hear her side only. His voice is never heard in m09; the narrator gives one line ("A man's voice on her end, too low to make out."). He calls her "Ninety-nine", as he did on the course, and she refuses it (agreed with the m10 author, §14 change 13). Her side (W-11):

> Agent HaX: ...Yes. *(beat)* I know it's you. *(beat)* Nobody's called me that since the course. It's HaX. It has been for seven years. *(long beat)* ...I'll bring them.

Then she reports it in four short sentences, as if it were any intercept, and her voice goes on the last: he called her Ninety-nine; the blast door will open for 0x00 by name; take your time getting there; and he asked whether they had liked his notes.

Music under the call is near-silence (stage 2 §6). The conclusion aim opens: report to Netherton. It waits on `identity_scene_done` as well as the call; `concludeRequires` stays the four flags only.

## 7. Closing debrief

A cutscene in a hangar at Helena's airfield, where Task Force Null's aircraft landed while the player was in the archive. Netherton is there in person; HaX is on the line from the Citadel and on the next plane. About four minutes. Triggered by the conclusion aim; `debrief_played` on the first line, the conclusion task completed on the last line, then `bond_visualiser` and credits (the m08 shape, lessons 42 and 46). Cutscenes are exempt from the one-voice rule (S-24), which is what lets Kowalczyk speak here.

The m02 shape: a face-to-face moment, a stance beat, a question hub so nothing is skipped, and a spine every player hears. It ends on the pen, not on m08's "Sleep" (W-16).

### 7.1 Beats in order

1. **Cold open** (Narrator). Floodlights, an aircraft with its ramp down, the team unloading cases.
2. **Kowalczyk** (W-07). Before Netherton reaches the player, she does, with a crate on her hip: "Well? Did my toy earn its keep?" Two short replies: warm ("It opened the safe. Thank you.") or flat ("It did the job."). She grins either way and goes back to the ramp. On a player who doesn't know, it is nothing. On `sleeper_named`, it is the scene: the player is thanking, or not thanking, WREN to her face, with Netherton walking up behind her. On `sleeper_shortlist`, it is half of it. (S-20: no line about Quintero watching her.) On `sleeper_named` with the flat reply, Netherton, as he arrives after she has gone: "Warmer, next time. She notices." (N-08, local only.)
3. **Netherton opens with the hour**, as the thing that has changed: "Oh-six-hundred, day thirteen. Twenty hours. He has given us every one of them." Then the name, once, as a fact he can now say in a hangar.
4. **Stance** (every player; W-16). He has read the memo on the flight. "You've read his memo. Was he right?" Two answers, recorded locally and paid back at the pen: "About Albion, yes." / "No. Not about any of it." Neither is wrong.
5. **The question hub.** Each topic once; the spine follows whatever the player asks.

| Topic | What Netherton says, by branch |
|---|---|
| "The archive, sir." | What the purge cost and what the player stopped, one line each and no list: the bin saved (Derek's file, now with Analysis beside his statement; the Social Fabric letters, and Tran's handler is being watched; or Nightshade's copy, read); the tape saved (her file, the Alpha tapes, or nothing); Sorensen (arrested: "she has asked for a lawyer and a pencil"; knocked out; or left at the shredder, and she finished the job); Tran; Noor (helped, warned, told she is on the list, or none); Old Coyote (talked past, or knocked out: "He wants to climb power lines for a living. He will. Not this week."). |
| "WREN." | `sleeper_named`: "Halina Kowalczyk." (R3-13: the double-cross's network line lives in the Recruiter topic only.) `sleeper_shortlist` without the name: "Two names. I have worked with both for eleven years. One of them is lying to me tonight." Neither: "One of four. I have known all four of them for years, and it does not help." |
| "The Recruiter." | By `recruiter_offer`: `named`, her handler list is with Analysis and the arrests start tonight; `double_crossed`, about half of it, "and she knows it was you"; `double_crossed` adds "About half of her network. She warned the rest."; `taken`, she is at large and her network with her, "You bought a name, and it was the right name. She'll sell the receipt." (R3-04); `refused`, she is at large, "and you did not let her set the price". On `recruiter_secret == "told"`: "HaX tells me you said something on that call. I do not need to hear it twice." |
| "The notice." (only on `albion_notified`) | "You sent it without asking me. I would have said yes. I would have taken a week to say it." |
| "Montana, sir." | Goes to the spine. |

6. **The spine** (every player):
   - **The two names** (row 100). He reads them before he signs, in full: "Agent 0x19, Callum Fraser. Agent 0x6B, Ana Lúcia Ferreira." Narrator (W-22, N-10): "He reads the first name off the card. He doesn't look down for the second." No comment after.
   - **The order, and his reply to the stance** (N-07: the reply sits at the pen). "About Albion, yes" gets "Then I sign for him too." as he signs; "No" gets "Good. Then he can make that argument in court, and lose it." and he signs. On `m08_debrief_stance == "owned"`, his own name goes beside Nightshade's on the file, and he says so (row 109). On `defended`, one thank-you he does not explain.
   - **HaX, last on the line**, by `hax_confession_answer`: on `should_have_told`, she is telling the player everything from now on, starting with the bunker; on `same_in_your_place`, a thank-you, once; on `afterwards`, "You said afterwards. I'm holding you to it." On every answer, "the rest" she promised in the archive is still owed (§14 change 15).
   - **Why the team goes in together** (row 117), the last spoken line. Not named: "If I bench four agents tonight, WREN knows we know. They come. You watch them." Named: "We take her at the briefing, in front of the others, where there is nowhere to go. Until then she sees nothing in my face. Nor in yours."
   - **The last image** (Narrator): he caps the pen. On `sleeper_named`, across the hangar, Kowalczyk waves.
7. **Conclusion**: `mission_complete`, the conclusion task, `bond_visualiser`, credits reading back the night's choices (stage 4 writes the credit lines).

### 7.2 What the debrief must not do

- List every carry-over again. The wall did the "previously on"; the debrief reads the night's own choices.
- Judge the confession answer or the Recruiter's deal. It says what each bought.
- Soften the casualty range, or give the Publication's hour in local time (FINALE_ARC §8 r8).

## 8. Mid-mission choices

Stage 3 owns the wording, the costs and the "does it matter" test; this is where each choice sits in the story and what it sets. Every player meets the first four. Variable names are working names; stage 4 fixes them. The exports keep FINALE_ARC §3.4's names, plus `sleeper_shortlist` if §14 change 6 is taken.

| # | Choice | Who meets it | When | Options | Sets | Paid back |
|---|---|---|---|---|---|---|
| 1 | The cage bin | every player | Beat 2.1 | Derek's file / the other bin (the Social Fabric letters, or Nightshade's copy) / open the cage without the hatch (Derek's survives) | `cage_bin_saved` | in m09 (S-08, W-12): Derek's file is a second sample of the hand (Beat 2.2); the letters are a talk-down lever on Tran (Beat 2.6) and, on `m01_maya_ko`, Maya's missing warning; Nightshade's copy changes his reply to his file. The debrief reads each. Stage 3 may add an m10 echo. |
| 2 | The Recruiter's offer and the deck | every player (the call is guaranteed, Beat 2.4) | Beat 2.4 | take / refuse / take, then pull her file anyway (priced aloud first); which tape HaX pulls (also after a hang-up); take + nothing records `taken` | `recruiter_offer` (defaults to `refused` on the call's first line), `sleeper_named`, `deck_pulled` (`her_file` / `alpha_tapes` / `none`), `deck_choice_made` (local done-flag) | m10 briefing (WREN detained), m10 closing card (her network, half on `double_crossed`), m10's ledger line on the receipt (`taken`, `double_crossed`; §14 change 30), m10's use of the Alpha tapes (stage 3); the debrief |
| 3 | The answer to HaX's confession | every player | Beat 3.3 | "should have told me / taken it to Netherton" / "same in your place / sat on it too" / "Afterwards. Not during." | `hax_confession_answer`: `should_have_told` / `same_in_your_place` / `afterwards` (N-17; §14 change 24) | the debrief's HaX line; m10's core (FINALE_ARC §5.4) |
| 4 | The stance on Tesseract | every player | debrief beat 4 | "About Albion, yes." / "No. Not about any of it." | local | Netherton's reply in the spine |
| 5 | Own the m05 deal, or hang up | `m05_recruiter_deal_accepted and not m05_recruiter_deal_confessed` | Beat 2.4 | own it on the open line / hang up | `recruiter_secret` (defaults to `kept` on this branch on the call's first line; `told` overwrites it) | m10: Tesseract's leverage line and HaX's reply (note S-25 for the m10 author) |
| 6 | Send Nightshade his file | `m08_nightshade_triple_agent` | Beat 2.2 onwards | send / keep | `nightshade_shown_file` | m10's door (row 105) |
| 7 | Send the vendor notice | every player can; nobody is pushed | Beat 3.4 onwards | send / don't | `albion_notified` | the debrief; m10's talk-down and his answer |
| 8 | Read the Reading to the end | every player who opens the safe | Beat 3.1 | read on / put it down | `reading_finished` | m10's talk-down option |
| 9 | Tell HaX what the Reading said | readers of the Reading | Beat 3.1 | tell (including its line about her) / don't | local | her confession reply knows the line (W-13) |
| 10 | Noor | every player | Beat 1.2, and the ledger page | tell her she is on a list / show her the line / leave her be | `noor_told` | Noor's own reaction; the debrief |
| 11 | Sorensen | every player | after the cage opens | arrest / knock out / leave her shredding (stage 3: whether talk can stop her) | `sorensen_fate` | what of the paper side survives; the debrief |
| 12 | Tran | players who go to the server closet | Beat 2.6 | talk him off it (needs the letters) / knock out / arrest / leave him | `tran_stopped` | what of the tape side survives; the debrief |
| 13 | Old Coyote | every player who meets him | Act 1 | talk past / sneak past / knock out | `old_coyote_ko` | one debrief line |
| 14 | The raid team | every player | briefing | back Quintero / thank Kowalczyk / say nothing | local | HaX at the moment it hurts: the Recruiter naming Kowalczyk, or the shortlist naming Quintero (W-19) |
| 15 | Kowalczyk in the hangar | every player | debrief beat 2 | warm / flat | local | on `sleeper_named` and flat, Netherton: "Warmer, next time. She notices." (N-08) |

Choices 1 and 2 are forced by events (the cage opening, the call ending), so stopping Sorensen or Tran first cannot skip them (stage 0 §7); choice 3 is forced because Tesseract's call and the conclusion aim wait on the identity scene (Beat 3.3). Nothing on this list gates `concludeRequires` or the critical path. **Handed to stage 3:** W-26's optional fifth note in the Reading, written before tonight, predicting which bin the player saves (fixed strings by `cage_bin_saved`). Kept out of stage 1 because it stretches D-06's four-entry cap.

## 9. Climax and the hook into m10

**The climax is two documents and a phone call.** m09 is the investigation half of the finale, and its climax should feel like the floor giving way under a reader:

1. The identity scene (Beat 3.3): the name said by the man who promised not to say it, and the handler admitting what she sat on and what it cost, with him listening.
2. The casualty sheet and the key (Beat 3.5): 1,100 to 2,600, signed, and a key that needs a hand. The "moment of horror" the 02 prompt asks for, found in play, worse than the briefing guessed.
3. The player's own realisation that the server was left for them, and the call that confirms it (Beats 3.5–3.6). The player has spent the night racing a purge, and learns the man behind it wanted them to win this part.

Light combat stays where stage 0 put it (Tran's guard, Sorensen if pushed). A fight at the end would shrink the reveal.

**The hook** carries five things into m10, each said once:

- **The hour and the door.** 06:00 UTC on day 13; the blast door that opens for 0x00 by name; "take your time" (Tesseract via HaX). m10 opens on that countdown.
- **WREN.** A name the player holds and Netherton will act on at m10's briefing; or two faces from a closed firm's file; or one of four. "They come. You watch them." is the line that ends the mission's plot.
- **His case, already half-answered.** The Albion papers, and on `albion_notified` the notice already sent.
- **The key.** At 06:00 it goes out city by city; the key sends it everywhere in the same minute, and needs a hand. "Then why build a key at all?" is left open; with the Reading's last page it is the question m10 answers.
- **HaX's promise.** "The rest, when this is over." m09 never says what it is; m10 pays it at 06:00 (§14 change 15).

The last image is Netherton capping his pen. The music goes to the closing track on the pen.

**What m10 imports from m09** (FINALE_ARC §3.4): `nightshade_shown_file`, `sleeper_named`, `recruiter_offer`, `albion_notified`, `hax_confession_answer`, `recruiter_secret`, `reading_finished`, plus `m09_completed`; and, if §14 changes 6 and 25 are taken, `sleeper_shortlist` and `deck_pulled`: nine exports in all. `deck_pulled` replaces FINALE_ARC §13 item 25's working name `alpha_tapes_saved` (R2-S13: decided here, because `recruiter_offer` alone can't tell whether the Alpha tapes were saved).

## 10. Cold start ("previously on")

Hacktivity can hand a player m09 first (FINALE_ARC §8 r2). That player is Agent 0x00 with the never-played canon of every earlier mission (FINALE_ARC §3) as their history. Every scene is written default-first, so this path is the base and every branch is an addition.

### 10.1 The wall of cards

One card per mission. HaX says one line per card, about eight seconds each. The played lines are gists here (stage 7 writes them, one fixed string per value); the never-played sentence is the canon (FINALE_ARC §3), with just enough of what happened for a player who has no history at all; it stays under about fifteen words.

| Card | Import(s) | Played (gist, one line per value) | Never played |
|---|---|---|---|
| m01 Viral Dynamics | `m01_final_choice` | fight: Derek Lawson put on the floor; arrest (or `""` with `m01_completed`): arrested, silent since; recruit: offered a deal, chose to be a martyr; expose: his projections on every front page; surrender: put the device down, still hasn't said why | "Viral Dynamics. Derek Lawson's cell planned a panic that would kill people. Arrested. He hasn't said a word since." |
| m02 St. Catherine's | `m02_exposed_hospital`, `m02_ghost_deal_accepted` | the board's cover-up published, or not; a deal with Ghost, kept or not; in every case, Ghost walked | "St. Catherine's, a hospital held to ransom. It recovered. Ghost, who did it, was never caught." |
| m03 Zero Day | `m03_victoria_fate` | recruited: Victoria Sterling turned and never used; arrested: in custody, with a CPS case; escaped: gone; ko: in custody and silent | "Zero Day, ENTROPY's exploit shop. Their London broker was never identified, and they kept trading." |
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
| The suspect | "ENTROPY's planner. Every card on this wall has his initial on it somewhere." Then: one of ours, once; no name until we can prove it. Nothing more until flag 3. |
| The cage | Sorensen quotes the Reading's second entry in its never-played form ("Your first days aren't in your file. Somebody at SAFETYNET is careful with you."). |
| Noor | A wary bystander. |
| Tran | HaX's neutral warning ("Viral Dynamics' staff files have a Tran in them."). |
| Nightshade | No call. His file in the plan chest is still the proof, and still in his teacher's hand. |
| The ledger | Torres' entry reads "lost". |
| The Recruiter | A stranger who knows their designation. The offer is the same. |
| The tape room | No Gary; the long way. |
| The identity scene | The fourth form: HaX starts furthest back (the fund's file, eighty-seven per cent, a drawer), then reaches the wall like every form (the two dead, Netherton silent). Netherton's sentence on who Tesseract was is the "who is Tesseract" beat for this player. |
| The Reading | The never-played form of all four entries (stage 2 §5), which read as the Architect's notes on an agent whose record he had and the player never lived. |
| The debrief | The same spine. |

A stage 2 reviewer reads this path with no other mission in mind (stage 0 §6). The test: does a player who has never heard of Derek, Ghost or Nightshade still understand, by the end of the briefing, who the enemy is, what was stolen, why tonight, and who is in the room? The wall, the order and the stakes beats are written to pass it.

## 11. Beats against rooms and flags

The nine rooms are stage 0 §6's; placement and lock order are stage 5's (FINALE_ARC §13 item 31). **One non-HaX voice per scene during play** (S-24): no two of Sorensen, Noor, Tran, Old Coyote, Nightshade, Torres, Gary, the Recruiter and Netherton speak in the same scene. Cutscenes (the briefing, the debrief) are exempt.

| Beat | Room | Non-HaX voice | Flag | Purge event | Aim |
|---|---|---|---|---|---|
| Briefing | cutscene (Task Force Null's room) | Netherton, the team (exempt) | – | – | – |
| 1.1 | loading dock | Old Coyote (if met) | – | the shredder audible | 1 |
| 1.2 | front desk | Noor | – | the trolleys | 1 |
| 1.3–1.4 | reading room | Nightshade by phone (triple agent) | 1 | – | 1 → 2 |
| 2.1 | restricted stacks (the cage's hatch counter) | Sorensen | – | **the cage**: one bin lost | 2 |
| 2.2 | restricted stacks (plan chest); the comparison against HaX's notebook in the case file | – | – | – | 2 |
| 2.3 | restricted stacks (ledger shelf, optional); flag at the reading room | – | 2 | the printed binder shredded once read, if Sorensen is free | 3 |
| 2.4 | reading room, by phone, after leaving the cage | the Recruiter | – | **the deck**: one tape lost | 3 |
| 2.5 | open stacks (Harwick & Lowe boxes) | Torres by phone (turned; or on the walk to the office) | – | – | 3 (optional task) |
| 2.6 | server closet | Tran | – | the rest of the tape side, until he is stopped | optional |
| 2.7 | moving (by phone) | – | – | – | 3 → 4 |
| 3.1 | Sorensen's office (opens after the deck; safe, Reading, schedule, files) | – | – | – | 4 |
| 3.2 | tape room; salvage cage | Gary by phone (protected) | – | – | 5 |
| 3.3–3.4 | tape room | Netherton by phone | 3 | – | 5 |
| 3.5 | tape room | – | 4 | – | 5 |
| 3.6 | tape room (by phone) | none heard (Tesseract to HaX) | – | – | conclusion |
| Debrief | cutscene (hangar) | Kowalczyk, Netherton (exempt) | – | – | conclusion |

**Aims**, as stage 0 §6 sets them, with the beats that open and close each: 1 Get in and set up the drop terminal (1.1–1.3). 2 Find the restricted series before it burns (1.4–2.2). 3 Read the Initiative's ledger (2.3–2.5; optional: the cross-reference). Aim 3 completes on the deck choice, which is forced on flag 2 (S-03). 4 Search the director's office (3.1: the safe and the Reading are tasks; reading to the end is not). 5 Take Tomb Beta's server (3.2–3.5). Optional: stop Sorensen; stop the tape wipe; send the vendor notice. Conclusion: report to Netherton.

**What enforces the night's order** (R2-S01, R2-S02, R3-01, R3-02). Aims gate nothing and the server concludes on `concludeRequires` alone, so each step of FINALE_ARC §6.1's one order is held by a lock or a condition. Stages 4–5 build them; stage 1 states them:

| Step | Held by |
|---|---|
| flag 1 → the cage | flag 1's reward opens the restricted stacks' outer door (Beat 1.4) |
| the cage → the call | the call waits on flag 2 **and** `cage_opened` (Beat 2.4) |
| the call → the deck choice | the call's first line sets the defaults; `deck_choice_made` is set on its last choice; a closed call re-rings and resumes (Beat 2.4; the rule below) |
| the deck → the office | the office door opens on `deck_choice_made`, traced from the deck's controller in the office (Beat 3.1). Sorensen's mail is the recruited-Victoria route's alone |
| the office → the tape room | the tape room's key card is in the safe (Beat 3.1) |
| flags 3–4 only in the tape room | the tape room's station is the only one that accepts Tomb Beta's VM; the reading room's accepts only the catalogue server's (R3-09) |
| flag 3 → the identity scene | the scene fires on flag 3; without Nightshade's file HaX holds the name until it is picked up (Beat 3.3) |
| the scene → flag 4's read → the call → the conclusion | flag 4's read, Tesseract's call and the conclusion aim wait on `identity_scene_done`, set on the confession answer (Beats 3.3, 3.5, 3.6) |

**One rule for every forced phone scene** (R3-02): the Recruiter's call, the identity scene and Tesseract's call. Each sets its defaults on its first line (by branch, where an export depends on it), and its done-flag (`deck_choice_made`, `identity_scene_done`, `tesseract_call_done`) on its last choice, never on opening or closing. Closed before that (Escape, damage), it re-rings when the player leaves the room and resumes at its last unanswered choice. Nothing downstream keys on a conversation closing.

**Engine checks** (REVIEW_R2_STRUCTURE.md's engine list, items 1–14, carries R1's E-1 to E-10 forward, plus one): locks opened by a flag reward and by an ink global (1); flag 2 on its own station, if stage 5 takes that option (2); a call that survives being closed (3); a second speaker in a phone thread, shown and voiced as themselves (4); two calls due on one walk (5); the cage counter (6); Sorensen non-combat (7); item removal and spawn on a global (8); calls held while in a conversation (9); object text that changes on a global (10); Tran's sight trigger and Old Coyote's re-routed round (11); drop-terminal actions reachable from the tape room (12); the multi-speaker briefing and the hangar (13); ambient sound and near-silence (14); **reload mid-call**: does an event-fired call re-fire after a reload, and resume at the right choice? (15, stage 5; R3-02)

## 12. Handover items settled (FINALE_ARC §13)

Items owned by stage 1 or 2 that concern m09. The m10 scenes in the same list (items 2, 5, 19, 24, 32, and the m10 half of 11) are the m10 author's.

| # | Item | Settled here | Where |
|---|---|---|---|
| 3 | What Kowalczyk's cracker is for; whether every SAFETYNET cracker comes from the bench | m09 side: stores quarantined every cracker Nightshade signed for after m08; Kowalczyk gives the player her own ("never been through stores"), which is true and is the one logged "to WREN" at the bench. She gives it to be liked and because getting 0x00 to Montana is what the Architect wants. In m09 it opens Sorensen's safe, and she asks about it in the hangar. Canon default kept: Nightshade's crackers and WREN's came from the bench, not every SAFETYNET cracker. Canon note for stage 6. m10 must issue it again (S-26). | §3.4, Beat 3.1, §7.1 |
| 4 | A beat and a reason for suspicion for Quintero, Malhotra and Arakawa | m09 briefing: Quintero argued against tonight's job (the archive where the ledger is) and doubts the courier, and she is the other name on the Harwick & Lowe sheet; Malhotra asked to run the Helena line himself; Arakawa kept Helena's police off the archive's side of town tonight. Kowalczyk's is the cracker. All true, all innocent except hers. Round 1 adds a second, harder one for Quintero: she is the other Harwick & Lowe hire on the shortlist. | §3.3, Beat 2.5 |
| 8 | The default source of the archive's company name | The courier label on the order, which SAFETYNET read and let go on. How it was caught, one reason by priority: the Calder Wharf courier account (m04 found), else the HashChain tags (m06), else the Helena ticket in Nightshade's go-bag. The other confirmations move out of the briefing (W-09): Victoria's keys to the lease file, Torres' address line to his call, Kemal's tip to the casualty sheet. | §3.1 beat 2, Beats 2.5, 3.1, 3.5 |
| 9 | The identity scene's load; whether the notice moves | The scene carries the proof, Netherton's name and one sentence (he stops before HaX), at most one recognition line, HaX's confession with its cost (the two dead, Netherton listening) and the player's answer. The handwriting is matched earlier against HaX's notebook (2.2) and confirmed in the salvage cage (3.2). The line's meaning is cut to three words and one sentence (2.7). The notice has its own beat (3.4). | Beats 2.2, 2.7, 3.3, 3.4 |
| 10 | Nine years | Used throughout. | – |
| 11 | One non-HaX voice per room | Applied to m09 per scene during play; cutscenes exempt. The Recruiter's call now fires outside the cage, so Sorensen is never in its scene (S-04). | §11, §14 change 6 |
| 16 | The "who is Tesseract" sentence (m10's cold start) | Not m09's. m09's equivalent is Netherton's sentence in the identity scene; the briefing gives who the Architect is (S-21) and holds the name back (§14 change 1). | §3.1 beat 6, Beat 3.3 |

**Handed on:** item 7 (the Recruiter's wording) and 25 (a later use for the Alpha tapes; their m09 stake is now "He teaches what he'll do", and the export is `deck_pulled`; stage 3 also decides playback, R2-S15) to stage 3; item 1 (the night's UTC steps; the debrief's "twenty hours") to stage 4; item 31 (lock order and placement, and the cage staging S-09) to stage 5.

## 13. Notes for later stages

**Stage 3 (moral choices).**
- Whether talk can stop Sorensen once the cage is open. Suggested lever: her vocation (a records keeper ordered to destroy records), or her own schedule leaving his rack off. It must not turn her; stopping is not cooperation.
- The two purge choices each buy something in m09 (§8 #1, #2), and the Recruiter's routes are now priced before the choice (Beat 2.4's table). Stage 3 tests whether the player can value them at the moment of choosing, and decides any m10 echo (Derek's standing order is the obvious one).
- **Decide the Alpha tapes early, before stage 7** (R2-S15): playable (a short clip at the drop terminal, a new voiced asset for Tesseract that the user approves) or not. HaX's line is worded so it doesn't promise the player hears him tonight. Their practical use in m10 (how he built the bunker, as he taught it) is item 25.
- W-26: an optional note in the Reading, written before tonight, predicting the player's bin (§8).

**Stage 4 (objectives and events)**, with the locks in §11's order table:
- Triggers: Nightshade's call on flag 1 (triple agent); Tran's radio to Old Coyote after flag 1 (`m01_maya_ko`); the Recruiter's call on flag 2 **and** `cage_opened`, delayed, not in a conversation; the office door on `deck_choice_made`; HaX's "Afterwards" call on the deck choice plus leaving the room, then Torres' fallback after a delay; Torres at the boxes only after flag 2; Gary on the first keypad attempt; the identity scene on flag 3 (held for Nightshade's file if needed); flag 4's read, Tesseract's call and the conclusion aim on `identity_scene_done`. Every forced phone scene follows §11's one rule (defaults on the first line, done-flag on the last choice, re-ring and resume).
- The deck pull is inside the call ink, including after a hang-up (HaX's half); the call's first line sets the defaults.
- The night's UTC steps: the archive night is local night on day 11, early day 12 UTC (R2-S07); the debrief's "twenty hours" follows from it, and FINALE_ARC §1.5's row needs the same wording.
- Music: near-silence for Tesseract's call; ask the user before adding a track.

**Stage 5 (rooms).**
- The cage staging (S-09): Sorensen at a hatch counter the player can reach, or the bell fallback; on Victoria's route the bins are two objects inside the door. Check m08's clone-while-talking first.
- Flag 1's reward opens the restricted stacks' outer door. The office door takes the code HaX reads from the mail.
- Nightshade's plan chest sits before the tape room.
- The safe holds the key card, the master schedule and the Reading.
- The salvage cage opens off the tape room.
- The Harwick & Lowe boxes are in the open stacks, findable without the file number and readable only with it.
- Option for stage 5 (R2-S01): give flag 2 its own station at the ledger shelf, which also gives the shelf a job.

**Stage 6 (lore).** New canon: stores' quarantine of Nightshade's crackers; the order read and let go on; the master schedule's ticked rooms and her query about the Reading; Harwick & Lowe's dead files at the archive, and Quintero as an innocent H&L hire (SAFETYNET recruits internationally; "Client: government (UK)" for an American hire is ordinary, R2-S08); H&L shut before TalentStack opened; WREN's mother in residential care, paid by the Initiative; the Architect taking WREN's tasking; HaX's training notebook; the Alpha tapes as his recorded teaching; "Ninety-nine", refused; Sorensen's twenty years as a county clerk.

**Stage 7 (ink).**
- Briefing spine about twelve lines before the wall; wall eight short lines; hub three topics.
- The Reading is document text, unvoiced.
- Tesseract is not voiced in m09 (unless stage 3 makes the Alpha tapes playable).
- Every branch line is a fixed string; the forms of the confession are wired to imports, not to "the safe".

**Stage 0 fixes** (proposed; this stage does not edit stage 0, R2-S11): §1 and §7 "about 75 minutes" → "about 85 with the field guides, 95–100 without"; §2.1 and §2.3 flag 3 at the drop terminal → in the tape room, with the identity scene there by phone; §2.2 and §2.3 "intercepts" → read and let go on; §6 design notes' "who is Tesseract" beat → the suspect without the name; §6 "Opening and closing": the debrief in a Helena hangar. Listed again in §14 changes 14 and 27.

**For the m10 author** (agreed or to agree): taking or double-crossing the Recruiter leaves a receipt in the Initiative's books that Tesseract reads (one ledger line in m10, §14 change 30); on `recruiter_secret == "kept"`, HaX already heard the receipt in m09, so Tesseract's line is that the player never explained (S-25); the cracker must be issued again at m10's briefing (S-26); HaX refuses "Ninety-nine" on the m09 call with "It's HaX. It has been for seven years."; the m09 casualty sheet is his original; on `sleeper_shortlist` the alibi clue leaves the same two names; HaX's promise of "the rest" is made after the deck, in Beat 2.7, not in the confession, and m10 pays it at 06:00; WREN has one goal, the key; a third `hax_confession_answer` value, `afterwards`, and the `deck_pulled` export need m10 handling (§14 changes 24, 25).

## 14. Proposed FINALE_ARC changes

Not made: FINALE_ARC and stage 0 are shared, and an arc-keeper applies these later. Verdicts are the round 2 structure reviewer's (REVIEW_R2_STRUCTURE.md) and the round 3 reviewer's word changes (REVIEW_R3.md), with the orchestrator's rulings folded in. 30 changes: 17 from round 1 as revised, 18–23 the round 2 reviewer's wording additions, 24–27 new in round 2, 28–30 new in round 3.

1. **The briefing holds the name back** (accepted). Row 57's "who is Tesseract" beat becomes "who is the suspect": ENTROPY's planner, one of ours once, no name until it can be proved. The name and one sentence land in the identity scene through Netherton; HaX says the rest. HaX's briefing aside loses "It wasn't only his." (R2-S06). Sweep: row 57, D-15, §8 r2, §5.5 m09, stage 0 §6.
2. **The order is read and let go on, and its schedule shows the gap** (modified, R2-S03). Netherton: "We read it. Then we let it go on. If it hadn't arrived, he would know." The order reads "Burn Helena before the Publication. Schedule attached. -- A." The master schedule is in Sorensen's safe, with her planning pass down the margin (each room's series checked against the order before the night and ticked as covered), the tape room's line unticked, and her query "Reading (safe); plan chest: not listed. Keep?" (R3-07) The flag-4 line is offered only to a player who read it; otherwise HaX states the fact from the job's side. Goes in §1.3, §1.5, §6.1.
3. **The sold-and-lied opening carries the offer, and a hang-up keeps the deck pull** (accepted). Row 61; values as §3.4.
4. **The deck pull is made inside the call by HaX, with defaults and a re-ring** (modified, R2-S02, R2-S13). The call's first line sets `recruiter_offer = "refused"` and nothing pulled; a closed call rings again on leaving the room and resumes at the offer; take + nothing records `taken`. The double-cross's price ("about half") is said before the choice. The call waits on flag 2 and the cage opened. Row 60, §6.1 item 3 ("The player can pull one from the drop terminal"). Round 3 (R3-02, R3-03): the call also sets `recruiter_secret` by branch on its first line (`kept` / `confessed` / `""`); its done-flag `deck_choice_made` is set on its last choice and the office opens on it, never on the call closing. Her threat covers the deal only; on refuse she wipes her own file first and drops off, sure it's gone, so pulling it rolls up the whole network. Sweep row 60's and §4.6's "Twelve. She warned the rest." → "About half of them. She warned the rest."
5. **Flag 4 carries his original casualty sheet** (accepted). §6.1 flag 4 row, §1.2; the correction stays m10's.
6. **One voice per scene in m09; Torres moves; the cross-reference narrows to two; `sleeper_shortlist`** (accepted, with tweaks). Per-scene is m09's rule; FA's per-room R3-01 stays for m10. Torres rings at the boxes, or on the walk to the office. The H&L sheet names Kowalczyk and Quintero (Quintero an honest H&L hire; both list a parent in care), and HaX says why nobody checked: "Harwick & Lowe shut before TalentStack opened." `sleeper_named` comes only from the Recruiter. `sleeper_shortlist` is set on reading the sheet, whatever the order. Rows 64, 117, §4.4, §3.4, §5.1 Torres, §5.2 Quintero; the m10 import is change 23.
7. **Netherton on the aircraft; the debrief in Helena** (accepted). Row 125, §5.5 m09, stage 0 §6. He takes the identity scene in the aircraft's forward cabin, door shut, where WREN can't hear (R3-14).
8. **The Recruiter's reason, and WREN's one goal** (accepted, revised by orchestrator ruling). The Architect has taken WREN's *tasking* for Montana: she still reports to the Initiative and draws its money, but her orders now come from him. The Recruiter sells what she can no longer use. WREN has one goal, the key (m10's design); "plays both ends" is withdrawn everywhere. Row 60, §4.4. Also sweep §4.0's "for her own exit with the stolen copy" → her own way back to the key at the core.
9. **The order names the Publication** (accepted). §1.3.
10. **The cracker** (accepted). Rows 29, 118; m10 reissues it.
11. **The raid team's suspicion beats in §5.2** (accepted). Quintero's "Orders don't fall off couriers" is answered by "This one didn't."; Kowalczyk's beat is the cracker.
12. **Flag 3 submitted in the tape room** (accepted, with sweep). §6.1's header and flag 3 row, stage 0 §2.1 and §2.3. The identity scene fires on flag 3 (HaX holds the name for Nightshade's file if needed), and Tesseract's call and the conclusion wait on it (R2-S02). The tape room's station is the only one that accepts Tomb Beta's VM; the reading room's accepts only the catalogue server's (R3-09). Flag 4's read also waits on the identity scene (R3-08).
13. **"Ninety-nine", refused** (accepted, synced with m10). Tesseract calls HaX "Ninety-nine" on his m09 call; she refuses it: "It's HaX. It has been for seven years." m10 calls back to that refusal. §5.4.
14. **m09 runs about 85 minutes with the field guides, 95–100 without** (modified, R2-S04). §1.3, §8 r6, stage 0 §1 and §7; stage 8 sets the published figure.
15. **HaX's promise, and the confession's cost** (accepted, with content). Her confession carries the two dead with Netherton listening. After the deck she gives "Afterwards. Not during." and one sentence, and promises "the rest, when this is over". The promise is made in Beat 2.7, not in the confession (R2-S14). What the rest is belongs to m10, which pays it at 06:00 (agreed with the m10 author); m09 never states it. §5.4. Round 3 (R3-06): the promise is said unasked, as Beat 2.7's last line, since m10 pays it to every played-m09 player.
16. **The Alpha tapes are his recorded teaching** (accepted, conditional). They hold his teaching at the first workshop, in his voice, with annotation sheets in his hand, and a practical stake: "He teaches what he'll do. If he built the bunker the way he taught it, it's on that tape." Stage 3 decides playback before stage 7 (R2-S15). Row 60, §6.1 item 3, §13 item 25.
17. **The m06 name came in the m06 debrief, as Satoshi's guess** (accepted). Row 70 already matches; see change 20 for row 37.
18. **Sorensen in §5.2** (wording, R2-S12). "Holds … the Reading's shelf mark" → holds the Reading in her safe; "Hostile once the cage is open" → keeps shredding, non-combat; arrest or knock-out.
19. **`hax_confession_answer` in §5.4 and §3.4** (wording, R2-S12). The m06-name-found answers are "You should have taken it to Netherton." / "I'd have sat on it too." (replacing "You should have pushed."); with change 24's third value. Also relabel the confession forms in §3.4 and §5.4 by import ("m06 name found / not found", not "Safe opened / Safe shut", N-12).
20. **Row 37** (wording, R2-S12). "You've read his hand before" → "You've read him before. Sterling's drive." (style, not handwriting), and the line is HaX's, as row 97's is.
21. **§6.1 flag 2 and the one-order line** (wording, R2-S12). The printed ledger is optional (the flag holds it, and Sorensen shreds it if free); "The Recruiter rings next" → she rings once flag 2 is in and the cage has been opened.
22. **§6.1 header** (wording, R2-S12). "Flags 1–3 are submitted at the drop terminal" → flags 1–2; flag 3 and the identity scene in the tape room (with change 12).
23. **§3.2: m10 imports `m09_sleeper_shortlist`** (wording, R2-S12). Tier 1, H; Tier 1 becomes 38. Add `m09_deck_pulled` if change 25 is taken.
24. **A third `hax_confession_answer` value, `afterwards`** (new, N-17). The player throws her own line back at her; it defers the judgement, so it is neither blame nor absolution. §3.4 gains the value; m10 decides its core beat (suggestion: it reads as `same_in_your_place` for "Put me on speaker", and HaX's debrief line is "You said afterwards. I'm holding you to it.").
25. **`deck_pulled` exported** (new, R2-S13, decided here). Values `her_file` / `alpha_tapes` / `none`. `recruiter_offer` can't say whether the Alpha tapes were saved (`taken` and `refused` both include "nothing"), so stage 3's use of them in m10 needs it. Replaces §13 item 25's `alpha_tapes_saved`. Nine m09 exports in all.
26. **The night in UTC** (new, R2-S07). §1.5 day 11: the archive is the local night of day 11, early day 12 UTC; in-game lines say "on day ten" for WREN's update and "at the briefing" for the morning's events.
27. **Stage 0 sweep** (new, R2-S11). Stage 0 §1 and §7 (75 minutes), §2.1 and §2.3 (flag 3 and the identity scene at the drop terminal; the order "intercepted"), §6 (the "who is Tesseract" beat; the debrief's place). See §13 "Stage 0 fixes".

28. **The Publication's two modes in §1.2** (new, R3, N-02). §1.2's first sentence: at 06:00 the database goes out city by city; the key at the console sends it everywhere in the same minute and needs a hand. His casualty sheet prices the key ("Release by key, all cities: 1,100 to 2,600. Fallback by city: fewer, later."). m10's premise line follows.
29. **Row 32: Victoria's mail route stays hers** (new, R3-01). Victoria's protocols are the only way into Sorensen's mail; the office opens on `deck_choice_made`, traced from the deck's controller, on every route.
30. **The Recruiter's receipt** (new, R3-04, orchestrator ruling). Taking her deal (`taken`, `double_crossed`) leaves a receipt in the Initiative's books; m10's Tesseract reads them, and one ledger line in m10 says so (suggested: "You bought WREN from my Recruiter. You understand costing."). The m09 debrief's `taken` line notes it ("She'll sell the receipt."). Refusing buys a clean record. Row 60, §3.4 (`recruiter_offer`'s m10 use), §4.1 (his ledger).

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
| W-24 | minor | Fixed: options worded as own it ("She's right. I took her money in the spring.") or hang up; wording stays stage 3's | Beat 2.4 |
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
| N-08 | minor | Fixed: "Warmer, next time. She notices." on `sleeper_named` with the flat reply | §7.1, §8 #15; SE §2 |
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
- Row 32: Victoria's mail route stays hers (§14 change 29); row 60 and §4.1: the receipt (§14 change 30).

**m10 (m10 author):**
- m10 SA:18: the Publication "to everyone at once" → the two modes (as change 28).
- m10 SA:514 (change 27): m09's change 8 no longer says "plays both ends"; the two now agree.
- m10 SA:508 (change 21): the promise is made after the deck (Beat 2.7), unasked, not in the confession.
- m10 SA:518, SA:544: `alpha_tapes_saved` → `m09_deck_pulled == "alpha_tapes"`.
- m10: one ledger line for Tesseract on `m09_recruiter_offer` in `taken` / `double_crossed` (the receipt, change 30); the casualty sheet m10's narrator quotes prices the key, as m09's now says.
