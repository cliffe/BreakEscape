# m09 Digital Archaeology: Stage 1, narrative structure

Stage 1. Author: stages 1–2 author (Opus), 2026-10-21. Status: round 1 fixes folded in (§15).

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

**The night's shape in one paragraph.** The player gets in, sets up a drop terminal and opens the catalogue (flag 1). The catalogue says the restricted series is in the cage where Sorensen is feeding the shredder. The player talks to her at the cage's hatch, saves one bin, and gets into the cage. Nightshade's file is in a plan chest, and the hand on it matches the margin notes in HaX's old training notebook. The ledger (flag 2) names WREN on the raid team. As soon as the player is out of the cage the Recruiter rings with an offer, and as she hangs up she wipes a tape deck: the player saves one tape. HaX says three words about a line she was taught. In Sorensen's office the player opens the safe with the cracker a raid-team member gave them that morning; the Reading is inside. In the tape room is Tomb Beta's last server. Flag 3 brings the name, with HaX and Netherton on the phone; flag 4 brings the hour, the defences, the key, and Tesseract's own casualty sheet. Tesseract rings HaX. Netherton signs the Montana order.

**The surprise the night builds to.** The purge order comes with a destruction schedule. It protects the cells: it lists the Initiative's placements, its letters and its recruits by series, and whatever of his old paper is filed beside them. It does not list the tape room's rack, or the box that holds the Reading. The server that holds his credential, his Albion memo, the hour and the defences is left running on purpose. He wants to be known, he wants SAFETYNET to read what it kept, and he wants them to come (FINALE_ARC §1.2). The player sees it first, at flag 4, as a line of their own; his call to HaX is the only confirmation.

## 2. Structure at a glance

| Part | What happens | Rooms | Flags | Minutes |
|---|---|---|---|---|
| Briefing (cutscene) | The order, the wall of cards, the raid team, the cracker | Task Force Null's room (cutscene background) | – | 4 |
| Act 1: Get in | Loading dock, the guard, the clerk, the drop terminal, the catalogue; the shredder heard through the wall | loading dock, front desk, reading room | 1 | 16 |
| Act 2: The stacks | The cage and the bins, Nightshade's file, the ledger and WREN, the Recruiter's call and the deck; optional: the cross-reference, Tran | restricted stacks (the cage), open stacks, server closet, reading room | 2 | 31 |
| Act 3: The name and the hour | The safe and the Reading, the schedule, the tape room, Tomb Beta's server, the identity scene by phone, the Albion papers, the hour and the key, Tesseract's call | Sorensen's office, tape room, salvage cage | 3, 4 | 30 |
| Debrief | Kowalczyk's question; Netherton reads the two names and signs the Montana order | airfield hangar (cutscene background) | – | 4 |
| **Total** | | nine rooms (stage 0 §6) | 4 | **85** |

**Budget notes** (rebuilt in round 1, S-01; ceiling 85 minutes by orchestrator ruling).

- Each VM stage is budgeted at 7 minutes for a player using the field guides: flag 1 inside Act 1, flag 2 inside Act 2, flags 3 and 4 inside Act 3. The purge moves on story events, so a slow VM stage stretches its act without costing anything in the story.
- Act 3 lost its two walk-backs: the Reading is in the office safe (no trip into the open stacks), and flag 3 is submitted in the tape room with HaX and Netherton on the phone (no trip to the reading room and back). Together they save about seven minutes (§14 change 12).
- Act 2 holds the optional content and is the first place to cut if playtests run long, in this order: the cross-reference (the Recruiter's offer is the certain route to the name), Tran's server closet, the Alpha tapes' decode. Nothing on the critical path is cut.
- The briefing's spine is about twelve lines before the wall (S-22, W-09); with the wall, the team and a three-topic hub, about four minutes.
- Three payoffs may run past their beat's minute count: the Recruiter's call (about 3 minutes), the identity scene (about 3), Tesseract's call (about 1).

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
6. **The suspect, without the name.** At the "-- A." pinned above the wall, Netherton: "ENTROPY's planner. Every card on this wall has his initial on it somewhere." (S-21.) Then: SAFETYNET has a suspect; he was one of theirs; "I will not say the name in this room until we can prove it." (W-17: no "Tonight we can.") On `m06_architect_identity_found`, HaX to the player alone: "You heard me say it after HashChain. I called it his guess. It wasn't only his." (S-10; m06's debrief gave the name as Satoshi's guess.) The name lands in the identity scene (Beat 3.3) for every player, cold starts included (§14 change 1).
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

The player can answer one of them: back Quintero ("She's right. Send me anyway."), thank Kowalczyk, or say nothing. It is recorded locally and paid back where it can hurt (W-19): on "thanked Kowalczyk", when the Recruiter names her, HaX says "You thanked her this morning. Keep doing it."; on "backed Quintero", when the Harwick & Lowe file puts Quintero on the shortlist, HaX says "You took her side this morning. Don't stop now. Don't start trusting her either."

### 3.4 The cracker (FINALE_ARC §13 item 3, m09 side)

Since m08 every PIN cracker Nightshade ever signed for is quarantined in stores, which is why the player has gone without since St. Catherine's (m08's ATHENA: "still signed out to Agent 0x47"). Kowalczyk's is her own breaching kit: "This one's mine. Never been through stores, never been near him." That line is true. It came to her from Tomb Gamma's bench through the Initiative, logged "to WREN" with a serial (m10's third clue, FINALE_ARC §4.4). She gives it because she wants to be liked by the agent she will go into the bunker with, and because helping 0x00 reach Montana is what the Architect wants (FINALE_ARC §1.2). In m09 it opens Sorensen's safe (Beat 3.1), and HaX's "The long way is over" is the line the player remembers when m10's bench gives the serial back.

Default for the canon question (row 29): not every SAFETYNET cracker comes from the bench. The ones Nightshade procured and signed out did, and so did WREN's. Stage 6 writes that into the Citadel's incident file.

## 4. Act 1: Get in

About 15 minutes. Aim 1: "Get in and set up the drop terminal". Aim 2 opens at flag 1. The purge is already running when the player arrives (FINALE_ARC §6.1): the first thing they hear inside is the shredder.

### Beat 1.1: The loading dock (2 minutes)

Night, sodium light on a grain warehouse with the archive's name stencilled over an older one. HaX's first line on the ground is short and gives the player the clock: "That noise is a cross-cut shredder. It's been running since before you landed." The dock door is locked (picks). Cody Old Coyote's torch moves along the fence on his round; he is the player's first lesson in the building's rhythm, and he is innocent (HaX: "Night guard. Twenty-four. Not ours, not theirs. Don't hurt him.").

HaX gives the building's people here, where they matter, in three short lines (moved from the briefing hub, S-22): the director, Margaret Sorensen, county clerk for twenty years before this; a clerk on tonight; and the IT contractor, Jesse Tran, with the m01 warning by branch (row 6): on `m01_completed and not m01_maya_ko`, "Maya's list has a Tran on it."; on `m01_maya_ko`, "Maya Chen would have flagged him. We don't have Maya's names."; never played m01, "Viral Dynamics' staff files have a Tran in them." On the briefing's raid-team answer, one line if the player backed Quintero: "Quintero's going to hate that she was right if this goes badly. Let's not."

On `m01_maya_ko`, Tran also makes one move on the main path (S-13): after flag 1 he radios Old Coyote to "check the reading room", and the guard's round passes the drop terminal once. Avoidable as any patrol is.

### Beat 1.2: The front desk and Noor (4 minutes)

Noor Haddad is at the front desk at an hour clerks are not, loading archive boxes onto trolleys from a printed list. Sorensen called her in "for a scheduled destruction run", and in a records archive that is a normal night's work, which is why Noor has not asked. The trolleys go to the cage. The player can talk to her as whoever they choose to be (a contractor, the auditor, or SAFETYNET), and what she offers depends on m05 (row 62):

- **Warned in time** (`m05_found_pipeline_list and not m05_recruiter_deal_accepted`): SAFETYNET reached her weeks ago, and she knows what the player is the moment they say a name. She gives the warning ("Peg's been in the cage since before I got here. She never feeds the shredder herself, and tonight she's sent me home twice.") and the door (her card for the open stacks' side door, which keeps the player off Old Coyote's route).
- **Warned late** (`m05_found_pipeline_list and m05_recruiter_deal_accepted and m05_recruiter_deal_confessed`): someone from SAFETYNET rang her last week. She gives the warning, not the card: "I don't know you. I'm not losing this job for a phone call."
- **Not warned** (every other case, cold starts included): a wary bystander. The player can tell her she is on a recruiting list and that Sorensen's "after-hours filing" bonus last month was the first approach. That choice (§8) is hers to react to.

Noor's trolley list is the player's first look at what is being burned: a copy of the destruction schedule, series numbers, no titles. "Series R" appears on every line.

### Beat 1.3: The reading room and the drop terminal (3 minutes)

The reading room is the archive's public face: long tables, green lamps, a microfiche reader, a terminal that only shows the public catalogue. The player sets up the SAFETYNET drop terminal (the field laptop) on a reading desk, and HaX is live on it. On `m06_monitoring_enabled`, the tagged payments are an object on the terminal from the start (row 71): one line of money from the fund to a lease, which HaX reads once ("Your tags, from HashChain. Someone's paying rent on a building in Montana that isn't this one.") and which, on the no-coordinate branch, points at the bunker before the deed does.

HaX gives the VM job in story terms: the public catalogue hides a series; the catalogue server does not. The drop terminal also carries her case file: the order's photograph, the wall's cards, and one item she does not mention, a scanned notebook labelled only with a course code (Beat 2.2).

### Beat 1.4: Flag 1, the catalogue (6 minutes)

**VM flag 1** (a foothold on the catalogue server): the index of every box, tape and shelf, including the restricted series. Submitted at the drop terminal. HaX says what it bought: the shelf marks for Series R, which sit in the restricted cage, and "the boxes on Noor's trolleys are the ones on this list". It also gives the first clue to the tape room's code: one catalogue entry for the tape room is written in an old archive encoding (decoded later, Beat 3.2).

On `m08_nightshade_triple_agent`, **Nightshade rings** here (row 104), from a SAFETYNET room, on the player's handset, competing with HaX for the line. He names which database entries the archive's restricted cage was built against (the reader that takes a lifted print; the badge reader that takes a clone), and he is right. HaX lets him talk and says nothing until he has gone: "He's right. I hate that he's right." This is his whole m09 presence until his file (Beat 2.2).

**Act 1 ends** with the shelf marks on the screen and the shredder still going: Series R is behind the mesh, in Sorensen's hands. Aim 2 opens: "Find the restricted series before it burns".

## 5. Act 2: The stacks

About 31 minutes. Aims 2 and 3. The purge's first two events happen here, in FINALE_ARC §6.1's one order: the cage, the ledger shelf, flag 2, the Recruiter's call, the tape deck.

### Beat 2.1: The cage (8 minutes)

The restricted stacks are a steel mesh cage inside the warehouse, floor to roof. Sorensen is inside, at a cross-cut shredder and a degausser, feeding them from Noor's trolleys.

**Staging** (S-09, for stage 5). The design needs the player to talk to Sorensen, clone her card and lift her print while she is behind the mesh. The intended staging: the cage's front is a counter with a document hatch, and Sorensen works at the counter, on a tile the player can reach for conversation and the cloner, with the locked cage door beside it. If the engine cannot hold that, the fallback keeps the beat: she comes to the hatch counter when the player rings its bell. Stage 5 checks both against m08's clone-while-talking build before placing anything.

1. **The bluff.** The player can be the auditor the lease-holder sent (stage 0 §5). Sorensen is polite, precise and in no hurry; auditors are a thing she knows how to handle. She stamps each box "destroyed" with a rubber stamp she sets down on the hatch shelf between boxes, and her master card hangs on a reel at her hip. The player lifts her print off the stamp and clones the card while she talks (the m08 technique). On `m03_victoria_fate == "recruited"`, Victoria's protocols read the archive's internal mail, and Sorensen's mail holds the cage's maintenance code: a second way in that replaces the print and the card (row 32). On that route, the recognition and the bins play at the cage door instead (S-16).
2. **HaX names the bins and what each buys** (W-12, S-08). Two bins wait by the shredder's mouth, and HaX gives each one line:
   - **By the hatch: Derek Lawson's file**, from the restricted series, written before Viral Dynamics hired him, costing his fall (rows 1, 9). It is the Architect's own hand on the player's first case, with his standing order to Derek and a page of costing notes. What it buys: a second sample of his hand for the identity proof (Beat 2.2), and Derek's file read back in the debrief.
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

**VM flag 2** (the Insider Threat Initiative's live ledger): submitted at the drop terminal in the reading room. HaX reads it aloud in story terms: twenty-three placements, forty-seven candidates, and a legacy section older than any list m05 found. One legacy entry, under the codename WREN, was updated yesterday in Sorensen's hand: "assigned TF Null, Montana operation".

- HaX: "Montana operation. Yesterday. That's one of the four you met this morning." Then the rule: she has told Netherton; he will say nothing to the team; "and neither will you."
- **What m05 changed** (rows 63, 64, 64a), one line on the page and at most one from HaX: on `public_exposure` the twenty-three are marked "blown"; on `turn_double_agent` Torres' entry still reads "live", because the Initiative never learned he turned; on `combat_lethal` it reads "closed placement" in Sorensen's hand and HaX says nothing for a beat; on `arrest`, `combat_nonlethal`, or never played, "lost".
- On `m07_found_tomb_gamma` (row 95): "You bagged the dossier. 'Including the people.' This is the people."
- WREN's legacy entry carries a source code, "H&L", and a file number, which opens the optional cross-reference (Beat 2.5).
- The printed ledger at the shelf becomes readable: optional, for the player who wants the page in their hand. It holds two small finds: on Reeves in custody (`m02_reeves_fate` in `arrested`, `ko`, `flagged`, or the read rule on `m02_insider_asset_arrested`; rows 21–22), his handler's contact sheet, clipped inside, as an object with no voiced line (W-23); and Noor's codename on the candidates' page, which a player who told her she is on a list can show her (§8). If Sorensen is still free, she shreds the binder once it has been read; nothing is lost, because the flag holds it.

### Beat 2.4: The Recruiter's call (4 minutes)

**When** (S-03, S-04). The call fires on flag 2 itself, after a short delay, once the player is out of the cage and not in another conversation. Flag 2 is submitted in the reading room, so in normal play it rings there, a few seconds after HaX's WREN line. Every player gets it, and Sorensen is never in the same scene. Aim 4 opens only when the call's deck choice is made, so `recruiter_offer` is always set before the mission can conclude.

Phone only, no face, as in m05. HaX stays on the line. The call has three openings and one spine, and it ends in the second purge choice.

**Openings** (row 61):

- **Sold and lied** (`m05_recruiter_deal_accepted and not m05_recruiter_deal_confessed`): the receipt and the offer in one breath: "Forty-seven names, and nothing points at you. Does your handler know? I'd like to give you one more name, and I'd like you to keep this one too." HaX has heard it. The player's choice (W-24; stage 3 owns the wording): own it on the open line ("She's right. I took her money in the spring.", `recruiter_secret = told`), or hang up (`kept`). A hang-up ends her half of the call; HaX stays on, says the wipe has started, and asks which tape (S-02). Her file → `named`; the Alpha tapes or nothing → `refused`, as FINALE_ARC §3.4 has it. HaX asks about the spring once, later, and lets it lie.
- **Sold and confessed** (`m05_recruiter_deal_accepted and m05_recruiter_deal_confessed`): HaX cuts in first: "We've talked about that. She has nothing on you." The leverage dies on the line, and the Recruiter goes straight to the offer (`recruiter_secret = confessed`).
- **No deal in m05, or never played:** she introduces herself. A player who finished m05 without taking her deal (refused, or never offered terms) hears a line that fits both (S-11): "Last time I said the next one would cost me more. This is the next one." A cold-start player gets a stranger who already knows their designation and their kit.

**The spine** (every player):

1. **Her grievance, as accounting** (S-18, W-18). The Architect has taken WREN's tasking for Montana: she still sits on Sorensen's books and draws the Initiative's money, and she no longer answers to the Recruiter. And his order is burning her records office. "Eleven years of placements, written off in a night for his schedule. I'd like something back on the books."
2. **The offer.** WREN's name, now, and always right (trusting her is never a trap). The price: the player lets her file go. Her file is a tape on a deck in the archive, and she is about to wipe the deck herself.
3. **HaX names what is on the deck, and what each is worth**, before the player answers (W-04): the Recruiter's file, a tape with her handler list (by m05: the handlers for the twenty-three; on `public_exposure` her handlers and the forty-seven; on `turn_double_agent` the names Torres could not give), "her whole network, if we're quick"; and Tomb Alpha's tapes, his teaching sessions from the first workshop, recorded, in his voice: "His voice. Teaching. It's the only place you'll hear him tonight." (Stage 3 decides their m10 use, item 25.)
4. **The answer.** Take the offer: "Halina Kowalczyk." and one line more ("She gave you something this morning, I expect. She's generous. It's how we hired her."); she hangs up and fires the wipe; the player has HaX pull the Alpha tapes (`taken`) or her file anyway (`double_crossed`). Refuse: she hangs up and fires the wipe; the player has HaX pull her file (`named`), or the Alpha tapes, or nothing (`refused`). The tape not pulled is wiped. `sleeper_named` is set only when she has said the name. On "thanked Kowalczyk" in the briefing, HaX: "You thanked her this morning. Keep doing it." (W-19.)
5. **After she hangs up.** On `double_crossed`, HaX: "She'll know inside the hour." The Recruiter's answer waits for the m10 epilogue ("I'll remember the shape of you", row 60).

**Why it is a dilemma for every player** (W-04). The Recruiter is the only certain route to the name. The cross-reference narrows WREN to two people and stops there (Beat 2.5). So: taking the deal buys certainty about the woman who will be beside the player in the bunker, and costs the Recruiter's network; refusing and pulling her file costs the certainty and keeps her network; double-crossing gets both and loses the Alpha tapes and half the network, and makes an enemy. Every option loses something the player has just heard named.

### Beat 2.5: The cross-reference, optional (3 minutes)

WREN's entry points at Harwick & Lowe, an executive search firm closed years ago, whose dead files are deposited for retention in the open stacks like any other client's boxes. The file number leads to a placing sheet, not a name: two lateral hires placed with "a government client" in the same quarter eleven years ago, both still at SAFETYNET, both on Task Force Null. H. Kowalczyk and M. Quintero. Harwick & Lowe placed real candidates as cover, and Quintero is one of them. Each sheet lists next of kin in the same dull type, and both list a parent in residential care (W-08): for Kowalczyk, her mother, which is the human fact under WREN's eleven years; for Quintero, her father, which is a coincidence that the file cannot tell apart. This sets `sleeper_shortlist` (a new export, §14 change 6). On "backed Quintero" in the briefing, HaX: "You took her side this morning. Don't stop now. Don't start trusting her either."

On `m05_torres_turned`, **Torres rings** from his desk inside the Initiative as the player opens the boxes, or, if they never do, once on the walk to Sorensen's office (S-12). He knows the legacy filing scheme (one step off the search) and says the line only he would know about the forty-seven: "They pick people with someone to lose. Look for the ones with a sick parent." On the shortlist it lands on both women, and on Noor. It does not decide between them. He also says, once: "I gave you this address in the spring. It was a line in a list."

### Beat 2.6: Tran and the tape side, optional (2–4 minutes)

Jesse Tran runs the rest of the tape side's wipe from the server closet: the Initiative's legacy recruitment interviews, optional lore. He is Social Fabric's agent on the staff (row 6). On `m01_maya_ko`, if he sees the player first, he calls in a second guard (avoidable). Stopping him (talk, knock-out or arrest) saves whatever of the tape side is still unwiped; with the Social Fabric letters in hand, the talk works without a fight ("You can explain those to Social Fabric, or to me."). It never saves the deck, which the Recruiter wiped herself.

### Beat 2.7: Afterwards (under a minute)

After the deck, once the player is moving again, HaX rings unprompted, once (W-03, orchestrator ruling). She names what the purge cost, once and plainly: which bin and which tape are gone. A pause. Then three words, and one sentence that is new:

> Agent HaX: Afterwards. Not during.
>
> Agent HaX: It's your own hurt. You don't hand it to people who never signed up for it.

When the player asks more, she promises the rest "when this is over" (§14 change 15; m10 pays it). She does not say whose line it is. On `m07_architect_echo_heard` the player already knows who said it to them, and she knows they know; she doesn't add a word. This also lives in her hub, once, for a player who closed the call early.

**Act 2 ends** with WREN named, or narrowed to two faces, or one of four; the purge's two losses named; and three words from HaX. Aim 4 opens: "Search the director's office".

## 6. Act 3: The name and the hour

About 30 minutes, two VM stages included. Aims 4 and 5. Two rooms on the critical path (Sorensen's office, the tape room), no walk-backs (S-01).

### Beat 3.1: Sorensen's office, the safe and the Reading (8 minutes)

A county clerk's office moved forty miles: a wall of binders, a kettle, a framed certificate for twenty years' service to Lewis and Clark County. The safe opens with Kowalczyk's cracker, or the long way (the PIN is on her desk for a player who looks). HaX: "Kowalczyk's toy. Tell her it worked." On `sleeper_named`: "Her cracker. Use it anyway."

**The safe** holds the tape room's key card and the Reading (S-01, S-17): a thin file, the Architect's reading of Agent 0x00 (row 101), four entries and a last page, in his written register (stage 2 §5). Finding it is an aim-4 task; reading to the last page is optional and sets `reading_finished`. The player reads it alone; HaX says nothing while it is open. The Reading also has one line about her (W-13): "Their handler will cover for them. She was taught to." Afterwards HaX asks once whether the player wants to tell her what it says. Telling her includes that line, and she hears it just before her confession; not telling her keeps it from her.

**The four entries** (row 101; FINALE_ARC D-06): m01 `final_choice`, the innocents line, m04 `disclosure_choice`, m07 `debrief_stance`, each with a never-played form; wording in stage 2 §5. **The last page** predicts that when the hour comes 0x00 will be in the room with the key in reach, and will press it (FINALE_ARC §1.2). Finding it on the page in his words is the second half of the cage's spike.

**The destruction schedule** (S-07). On her desk, Sorensen's working copy of the schedule that came with the order, annotated by room in her hand: every series, every shelf, the server closet's tapes. Two places are not on it: the tape room's rack, and the box that held the Reading. The player can notice it here; the game doesn't point at it until flag 4.

**The office files**, two objects, at most one line each (W-23):

- **The lease file** for the bunker's land and buildings, held for the lease-holder, Zero Day's front company (m03), paid from the Crypto Anarchists' account (m06). It holds Tomb Gamma's deed and construction file: the paper half of the defences, and on the no-coordinate branch the bunker itself ("There it is. Tomb Gamma has an address." Elsewhere: "Same coordinate Nightshade gave us. Now it has a lease."). One line by branch, in priority order: on `m03_victoria_fate` `arrested` or `ko`, Victoria's keys (or seized devices) opened Zero Day's client list in the spring, and this lease was on it; else on `m06_irina_recruited`, "Irina's account paid for this. Tell her it bought us the deed."; else the Danny line by `m03_danny_fate` (row 36), from Zero Day's note on him in the same file.
- **The refit ledger**: what the bunker's refit cost and who paid. On `m02_paid_ransom`: "St. Catherine's money. It bought the blast door." (row 17).

### Beat 3.2: The tape room (4 minutes)

The tape room needs the key card from the safe and a door code. The code is the catalogue entry flag 1 turned up, written in an old archive encoding; the player decodes it at the CyberChef workstation. On `m02_gary_protected`, **Gary Whitlock rings** when the player first tries the keypad (row 23) with the decode hint. Without Gary, the catalogue's own legend does it the long way.

Inside: tape racks to the roof, cold air, and among them Tomb Beta's last server, still racked, still running, its fans the only warm thing in the building. Through a second mesh door, the salvage cage holds what came out of Tomb Alpha and Tomb Beta when they closed: crates, a bench, a door controller with its wires cut, and Tomb Beta's enrolment binders, annotated in the same hand as Nightshade's file and HaX's notebook. On the Alpha-tapes branch, the tapes HaX pulled are on the drop terminal; the optional decode of their annotation sheets, at a terminal (S-15), gives the line HaX recognises in his hand.

### Beat 3.3: Flag 3 and the identity scene (10 minutes, 7 of them VM)

**VM flag 3** (the owner of Tomb Beta's server): the credential text beside the flag is a SAFETYNET staff credential issued to Dr Adrian Tesseract before he left seven years ago, never revoked. Submitted in the tape room, beside the machine, through the field kit's link to the drop terminal (§14 change 12). The identity scene plays there, by phone, with the server's fans as the only sound in the room.

The scene runs when flag 3 is in and the player holds Nightshade's file (on the critical path before the tape room; stage 5 places it). If the file is somehow not held, HaX asks for it and the scene starts when it is picked up. It carries the proof, the name, one sentence on who he was, at most one recognition line, HaX's confession with its cost, and the player's answer (FINALE_ARC §13 item 9).

1. **The proof.** HaX reads the credential's first line aloud and stops before the name.
2. **Netherton**, on the line from the aircraft taking Task Force Null to Montana (§14 change 7). Row 125's line, unchanged: "I said we wouldn't name him until we could prove it. We can. Dr Adrian Tesseract." Then one sentence, for every player and cold starts most of all: "He was our chief strategist until seven years ago. He trained half my field officers." He stops there (W-02). At most one recognition line: `m07_architect_echo_heard` ("You heard him say it. My line. His line.", row 97), else `m03_directive_decoded` ("You've read him before. Sterling's drive.", row 37; style, not handwriting, S-05). Then: "HaX." Nothing else. He stays on the line.
3. **HaX's confession** (rows 70, 98; FINALE_ARC §5.4). She says the rest herself: he trained her; she was his. Four openings, chosen by `m06_architect_identity_found` and `m07_teacher_discussed`:
   - **Safe opened, teacher discussed:** "I told you on the handset he taught me." She gave the player the name after HashChain as Satoshi's guess; it was hers too.
   - **Safe opened, teacher not discussed:** the same, from a little further back: she called it Satoshi's guess, and has hoped since that it was only his.
   - **Safe shut, teacher discussed:** "I told you somebody taught me that line. I didn't say who." She has known since the fund's file in m06; "keep it out of your notes" in m07 was her keeping it out of hers.
   - **Neither** (cold starts included): a file on a crypto fund, a name at eighty-seven per cent, and a drawer.

   **Every form then reaches the wall** (W-01, orchestrator ruling). She had the name the night Fraser and Ferreira died in m07, and Netherton is listening: "Two cards on that wall. I had his name the night they died. I've done the sum, and I don't know the answer." Netherton says nothing. His silence is the season's rhyme: in m08 he told the player "Two of ours are dead in the space between what I knew and what I did."
4. **The player's answer** (every player; `hax_confession_answer`). Safe shut: "You should have told me." (`should_have_told`) or "I'd have done the same in your place." (`same_in_your_place`). Safe opened: "You should have taken it to Netherton." (said with him listening; `should_have_told`) or "I'd have sat on it too." (`same_in_your_place`). On every form, a third answer, her own line back to her: "Afterwards. Not during." (W-14), recorded as `same_in_your_place`, with its own reply. Neither answer is wrong. HaX replies in one or two lines; if the player told her the Reading's line about her, her reply knows it. Then she gets back to work.
5. **Back to work.** "There's more on his box. A memo and a draft. Read them."

### Beat 3.4: The Albion papers and the notice (2 minutes, plus the optional send)

Flag 3's files hold three documents (FINALE_ARC §1.3): the catalogue entry for a flaw in the control equipment at Albion's site, marked "retain: operational value" nine years ago; Tesseract's memo from the same month arguing it should go to the vendor; and the vendor notice he drafted and never sent. Critical Mass came through that hole at Albion.

HaX lands the m04 choice (rows 48, 57), one line by `m04_disclosure_choice`: `full`, the player told Albion's inquiry everything and SAFETYNET told the vendor nothing for nine years; `partial`, the player told half and SAFETYNET told less; `quiet`, the player kept Albion quiet, and so did SAFETYNET; never played or unset, the plain fact that Critical Mass came through this hole. The player learns his case is partly true before he makes it.

**The notice** (optional, `albion_notified`): the player can send it at any time before the debrief; HaX pushes it through the drop terminal on their word, as she did the tape. She does not tell them to: "It isn't my call. It isn't yours either. If you're going to, don't ask me first." Netherton answers it at the debrief.

### Beat 3.5: Flag 4, the hour and the key (8 minutes, 7 of them VM)

**VM flag 4** (full control of Tomb Beta's server), submitted beside the machine: the job that still mirrors to Tomb Gamma. In story terms it carries:

- **What the Publication is.** At 06:00 UTC on day 13 Tomb Gamma releases the whole stolen database to everyone at once, free, every entry with working detail. HaX: "He's giving it away. Free, to everyone, in the same minute."
- **The key** (W-06). The job has a manual release: a key at Tomb Gamma's console that sends everything at once, and it needs a hand on it. **The fallback**: if nobody presses it, the database goes anyway, city by city, from 06:00. HaX: "Then why build a key at all?" Nobody answers it in m09.
- **The head start**: the cells get it two hours early, at 04:00.
- **The defences**: the list of Tomb Gamma's defences, each built from an entry in the stolen database.
- **His casualty sheet**, signed, his original (the correction is m10's, FINALE_ARC §4.1): 1,100 to 2,600 dead in the first month. "An acceptable price for the last arms race." It replaces the briefing's guess. HaX reads the range once and does not round it. On `m06_minder_walked`: "Kemal Aydin walked out on a smaller number than this." (row 77, moved here from the briefing, W-09.)

**The realisation, once, as the player's line** (W-05, orchestrator ruling). A player choice at the end of HaX's read: "The tape room isn't on the schedule." HaX: "No. It isn't. He shredded everyone but himself." If the player found the schedule in the office, the line reads "Her schedule left this room off." The arc states it nowhere else; the call confirms it.

### Beat 3.6: Tesseract rings HaX (1 minute)

He rings HaX, not the player. The player's line stays open and they hear her side only. His voice is never heard in m09; the narrator gives one line ("A man's voice on her end, too low to make out."). Her side (W-11):

> Agent HaX: ...Yes. *(beat)* I know it's you. *(beat)* Nobody's called me that since the course. *(beat)* No. *(long beat)* ...I'll bring them.

He called her "Ninety-nine" (shared with the m10 author, §14 change 13). Then she reports it in three sentences, as if it were any intercept, and her voice goes on the last: the blast door will open for 0x00 by name; take your time getting there; and he asked whether they had liked his notes.

Music under the call is near-silence (stage 2 §6). The conclusion aim opens: report to Netherton. `concludeRequires`: the four flags only.

## 7. Closing debrief

A cutscene in a hangar at Helena's airfield, where Task Force Null's aircraft landed while the player was in the archive. Netherton is there in person; HaX is on the line from the Citadel and on the next plane. About four minutes. Triggered by the conclusion aim; `debrief_played` on the first line, the conclusion task completed on the last line, then `bond_visualiser` and credits (the m08 shape, lessons 42 and 46). Cutscenes are exempt from the one-voice rule (S-24), which is what lets Kowalczyk speak here.

The m02 shape: a face-to-face moment, a stance beat, a question hub so nothing is skipped, and a spine every player hears. It ends on the pen, not on m08's "Sleep" (W-16).

### 7.1 Beats in order

1. **Cold open** (Narrator). Floodlights, an aircraft with its ramp down, the team unloading cases.
2. **Kowalczyk** (W-07). Before Netherton reaches the player, she does, with a crate on her hip: "Well? Did my toy earn its keep?" Two short replies: warm ("It opened the safe. Thank you.") or flat ("It did the job."). She grins either way and goes back to the ramp. On a player who doesn't know, it is nothing. On `sleeper_named`, it is the scene: the player is thanking, or not thanking, WREN to her face, with Netherton walking up behind her. On `sleeper_shortlist`, it is half of it. (S-20: no line about Quintero watching her.)
3. **Netherton opens with the hour**, as the thing that has changed: "Oh-six-hundred, day thirteen. Twenty hours. He has given us every one of them." Then the name, once, as a fact he can now say in a hangar.
4. **Stance** (every player; W-16). He has read the memo on the flight. "You've read his memo. Was he right?" Two answers, recorded locally and paid back at the end: "About Albion, yes." / "No. Not about any of it." Neither is wrong.
5. **The question hub.** Each topic once; the spine follows whatever the player asks.

| Topic | What Netherton says, by branch |
|---|---|
| "The archive, sir." | What the purge cost and what the player stopped, one line each and no list: the bin saved (Derek's file, now with Analysis beside his statement; the Social Fabric letters, and Tran's handler is being watched; or Nightshade's copy, read); the tape saved (her file, the Alpha tapes, or nothing); Sorensen (arrested: "she has asked for a lawyer and a pencil"; knocked out; or left at the shredder, and she finished the job); Tran; Noor (helped, warned, told she is on the list, or none); Old Coyote (talked past, or knocked out: "He wants to climb power lines for a living. He will. Not this week."). |
| "WREN." | `sleeper_named`: "Halina Kowalczyk." On `double_crossed`, the twelve, and the rest warned. `sleeper_shortlist` without the name: "Two names. I have worked with both for eleven years. One of them is lying to me tonight." Neither: "One of four. I have known all four of them for years, and it does not help." |
| "The Recruiter." | By `recruiter_offer`: `named`, her handler list is with Analysis and the arrests start tonight; `double_crossed`, the same, "and she knows it was you"; `taken`, she is at large and her network with her, "you bought a name, and it was the right name"; `refused`, she is at large, "and you did not let her set the price". On `recruiter_secret == "told"`: "HaX tells me you said something on that call. I do not need to hear it twice." |
| "The notice." (only on `albion_notified`) | "You sent it without asking me. I would have said yes. I would have taken a week to say it." |
| "Montana, sir." | Goes to the spine. |

6. **The spine** (every player):
   - **The two names** (row 100). He reads them before he signs, in full: "Agent 0x19, Callum Fraser. Agent 0x6B, Ana Lúcia Ferreira." He gets her middle name right, and it costs him (W-22: the narrator gives that pause one line). No comment after.
   - **The order.** He signs the Montana order in front of the player. On `m08_debrief_stance == "owned"`, his own name goes beside Nightshade's on the file, and he says so (row 109). On `defended`, one thank-you he does not explain.
   - **HaX, last on the line**, by `hax_confession_answer`: on `should_have_told`, she is telling the player everything from now on, starting with the bunker; on `same_in_your_place`, a thank-you, and she will not ask them to do it again. Either way, "the rest" she promised in the archive is still owed (§14 change 15).
   - **Netherton's reply to the stance** (W-16, worst-ten #7): "About Albion, yes" gets "Then I sign for him too."; "No" gets "Good. He can tell a court so."
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
| 2 | The Recruiter's offer and the deck | every player | Beat 2.4 | take / refuse / take, then pull her file anyway; which tape HaX pulls (also after a hang-up) | `recruiter_offer`, `sleeper_named`, `deck_pulled` | m10 briefing (WREN detained), m10 closing card (her network); the debrief |
| 3 | The answer to HaX's confession | every player | Beat 3.3 | "should have told me / taken it to Netherton" / "same in your place / sat on it too" / "Afterwards. Not during." | `hax_confession_answer` (the third answer records as `same_in_your_place`) | the debrief's HaX line; m10's core (FINALE_ARC §5.4) |
| 4 | The stance on Tesseract | every player | debrief beat 4 | "About Albion, yes." / "No. Not about any of it." | local | Netherton's reply in the spine |
| 5 | Own the m05 deal, or hang up | `m05_recruiter_deal_accepted and not m05_recruiter_deal_confessed` | Beat 2.4 | own it on the open line / hang up | `recruiter_secret` (`told` / `kept`) | m10: Tesseract's leverage line and HaX's reply (note S-25 for the m10 author) |
| 6 | Send Nightshade his file | `m08_nightshade_triple_agent` | Beat 2.2 onwards | send / keep | `nightshade_shown_file` | m10's door (row 105) |
| 7 | Send the vendor notice | every player can; nobody is pushed | Beat 3.4 onwards | send / don't | `albion_notified` | the debrief; m10's talk-down and his answer |
| 8 | Read the Reading to the end | every player who opens the safe | Beat 3.1 | read on / put it down | `reading_finished` | m10's talk-down option |
| 9 | Tell HaX what the Reading said | readers of the Reading | Beat 3.1 | tell (including its line about her) / don't | local | her confession reply knows the line (W-13) |
| 10 | Noor | every player | Beat 1.2, and the ledger page | tell her she is on a list / show her the line / leave her be | `noor_told` | Noor's own reaction; the debrief |
| 11 | Sorensen | every player | after the cage opens | arrest / knock out / leave her shredding (stage 3: whether talk can stop her) | `sorensen_fate` | what of the paper side survives; the debrief |
| 12 | Tran | players who go to the server closet | Beat 2.6 | talk him off it (needs the letters) / knock out / arrest / leave him | `tran_stopped` | what of the tape side survives; the debrief |
| 13 | Old Coyote | every player who meets him | Act 1 | talk past / sneak past / knock out | `old_coyote_ko` | one debrief line |
| 14 | The raid team | every player | briefing | back Quintero / thank Kowalczyk / say nothing | local | HaX at the moment it hurts: the Recruiter naming Kowalczyk, or the shortlist naming Quintero (W-19) |
| 15 | Kowalczyk in the hangar | every player | debrief beat 2 | warm / flat | local | none; the moment is the payoff (W-07) |

Choices 1 and 2 are forced by events (the cage opening, the call ending), so stopping Sorensen or Tran first cannot skip them (stage 0 §7). Nothing on this list gates `concludeRequires` or the critical path. **Handed to stage 3:** W-26's optional fifth note in the Reading, written before tonight, predicting which bin the player saves (fixed strings by `cage_bin_saved`). Kept out of stage 1 because it stretches D-06's four-entry cap.

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
- **The key.** "Then why build a key at all?" is left open; with the Reading's last page it is the question m10 answers.
- **HaX's promise.** "The rest, when this is over." m10 pays it (§14 change 15).

The last image is Netherton capping his pen. The music goes to the closing track on the pen.

**What m10 imports from m09** (FINALE_ARC §3.4): `nightshade_shown_file`, `sleeper_named`, `recruiter_offer`, `albion_notified`, `hax_confession_answer`, `recruiter_secret`, `reading_finished`, plus `m09_completed`, and `sleeper_shortlist` if §14 change 6 is taken. Stage 4 also keeps `deck_pulled` readable for stage 3's decision on the Alpha tapes (item 25).

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
| 3.1 | Sorensen's office (safe, Reading, schedule, files) | – | – | – | 4 |
| 3.2 | tape room; salvage cage | Gary by phone (protected) | – | – | 5 |
| 3.3–3.4 | tape room | Netherton by phone | 3 | – | 5 |
| 3.5 | tape room | – | 4 | – | 5 |
| 3.6 | tape room (by phone) | none heard (Tesseract to HaX) | – | – | conclusion |
| Debrief | cutscene (hangar) | Kowalczyk, Netherton (exempt) | – | – | conclusion |

**Aims**, as stage 0 §6 sets them, with the beats that open and close each: 1 Get in and set up the drop terminal (1.1–1.3). 2 Find the restricted series before it burns (1.4–2.2). 3 Read the Initiative's ledger (2.3–2.5; optional: the cross-reference). Aim 3 completes on the deck choice, which is forced on flag 2 (S-03). 4 Search the director's office (3.1: the safe and the Reading are tasks; reading to the end is not). 5 Take Tomb Beta's server (3.2–3.5). Optional: stop Sorensen; stop the tape wipe; send the vendor notice. Conclusion: report to Netherton.

**Engine checks this arc depends on** (from the structure review's E-1 to E-10, for stages 4, 5 and 9): talking to and cloning from an NPC at the cage counter (E-1, S-09); Sorensen's non-combat "keeps shredding" state (E-2); calls conditioned on "not in a conversation" and re-checked after their delay (E-3); the identity scene on two globals (E-4); removing the unchosen bin and tape (E-5); object text readable after a flag (E-6); Tran's sight trigger (E-7); five NPCs in the briefing and a hangar background (E-8); ambient sound on an event and near-silence (E-9); two speakers in one phone conversation (E-10).

## 12. Handover items settled (FINALE_ARC §13)

Items owned by stage 1 or 2 that concern m09. The m10 scenes in the same list (items 2, 5, 19, 24, 32, and the m10 half of 11) are the m10 author's.

| # | Item | Settled here | Where |
|---|---|---|---|
| 3 | What Kowalczyk's cracker is for; whether every SAFETYNET cracker comes from the bench | m09 side: stores quarantined every cracker Nightshade signed for after m08; Kowalczyk gives the player her own ("never been through stores"), which is true and is the one logged "to WREN" at the bench. She gives it to be liked and because getting 0x00 to Montana is what the Architect wants. In m09 it opens Sorensen's safe, and she asks about it in the hangar. Canon default kept: Nightshade's crackers and WREN's came from the bench, not every SAFETYNET cracker. Canon note for stage 6. m10 must issue it again (S-26). | §3.4, Beat 3.1, §7.1 |
| 4 | A beat and a reason for suspicion for Quintero, Malhotra and Arakawa | m09 briefing: Quintero argued against tonight's job (the archive where the ledger is) and doubts the courier; Malhotra asked to run the Helena line himself; Arakawa kept Helena's police off the archive's side of town tonight. Kowalczyk's is the cracker. All true, all innocent except hers. Round 1 adds a second, harder one for Quintero: she is the other Harwick & Lowe hire on the shortlist. | §3.3, Beat 2.5 |
| 8 | The default source of the archive's company name | The courier label on the order, which SAFETYNET read and let go on. How it was caught, one reason by priority: the Calder Wharf courier account (m04 found), else the HashChain tags (m06), else the Helena ticket in Nightshade's go-bag. The other confirmations move out of the briefing (W-09): Victoria's keys to the lease file, Torres' address line to his call, Kemal's tip to the casualty sheet. | §3.1 beat 2, Beats 2.5, 3.1, 3.5 |
| 9 | The identity scene's load; whether the notice moves | The scene carries the proof, Netherton's name and one sentence (he stops before HaX), at most one recognition line, HaX's confession with its cost (the two dead, Netherton listening) and the player's answer. The handwriting is matched earlier against HaX's notebook (2.2) and confirmed in the salvage cage (3.2). The line's meaning is cut to three words and one sentence (2.7). The notice has its own beat (3.4). | Beats 2.2, 2.7, 3.3, 3.4 |
| 10 | Nine years | Used throughout. | – |
| 11 | One non-HaX voice per room | Applied to m09 per scene during play; cutscenes exempt. The Recruiter's call now fires outside the cage, so Sorensen is never in its scene (S-04). | §11, §14 change 6 |
| 16 | The "who is Tesseract" sentence (m10's cold start) | Not m09's. m09's equivalent is Netherton's sentence in the identity scene; the briefing gives who the Architect is (S-21) and holds the name back (§14 change 1). | §3.1 beat 6, Beat 3.3 |

**Handed on:** item 7 (the Recruiter's wording) and 25 (a later use for the Alpha tapes; their m09 stake is now "His voice. Teaching.") to stage 3; item 1 (the night's UTC steps; the debrief's "twenty hours") to stage 4; item 31 (lock order and placement, and the cage staging S-09) to stage 5.

## 13. Notes for later stages

**Stage 3 (moral choices).**
- Whether talk can stop Sorensen once the cage is open. Suggested lever: her vocation (a records keeper ordered to destroy records), or her own schedule leaving his rack off. It must not turn her; stopping is not cooperation.
- The two purge choices now each buy something in m09 (§8 #1, #2). Stage 3 tests whether the player can value them at the moment of choosing, and decides any m10 echo.
- W-26: an optional note in the Reading, written before tonight, predicting the player's bin (§8).
- The confession's third answer, "Afterwards. Not during.", records as `same_in_your_place`. If stage 3 wants it distinct in m10, that is a FINALE_ARC change.

**Stage 4 (objectives and events).**
- Triggers: Nightshade's call on flag 1 (triple agent); Tran's radio to Old Coyote after flag 1 (`m01_maya_ko`); the Recruiter's call on flag 2, delayed, outside the cage, not in a conversation; aim 3 completes and aim 4 opens on the deck choice; HaX's "Afterwards" call on the deck choice plus leaving the room; Torres on opening the boxes, or on the walk to the office; Gary on the first keypad attempt; the identity scene on flag 3 plus Nightshade's file held; Tesseract's call on flag 4.
- The deck pull is inside the call ink, including after a hang-up (HaX's half); the ink sets `deck_pulled` and `recruiter_offer`.
- The debrief's "twenty hours" needs the night's UTC time fixed.
- Music: near-silence for Tesseract's call; ask the user before adding a track.

**Stage 5 (rooms).**
- The cage staging (S-09, E-1): Sorensen at a hatch counter the player can reach, or the bell fallback. Check m08's clone-while-talking first.
- Nightshade's plan chest sits before the tape room.
- The safe holds the Reading and the key card. The schedule is on Sorensen's desk.
- The salvage cage opens off the tape room.
- The Harwick & Lowe boxes are in the open stacks, findable without the file number and readable only with it.

**Stage 6 (lore).** New canon: stores' quarantine of Nightshade's crackers; the order read and let go on; the destruction schedule leaving off the rack and the Reading; Harwick & Lowe's dead files at the archive, and Quintero as an innocent H&L hire; WREN's mother in residential care; the Architect taking WREN's tasking; HaX's training notebook; the Alpha tapes as his recorded teaching; "Ninety-nine"; Sorensen's twenty years as a county clerk.

**Stage 7 (ink).**
- Briefing spine about twelve lines before the wall; wall eight short lines; hub three topics.
- The Reading is document text, unvoiced.
- Tesseract is not voiced in m09.
- Every branch line is a fixed string.

**For the m10 author** (from the structure review): on `recruiter_secret == "kept"`, HaX already heard the receipt in m09, so Tesseract's line is that the player never explained (S-25); the cracker must be issued again at m10's briefing as "the one Kowalczyk gave you" (S-26); "Ninety-nine"; the m09 casualty sheet is his original; on `sleeper_shortlist` the alibi clue (FINALE_ARC §4.4 clue 2) leaves the same two names; HaX owes the player "the rest".

## 14. Proposed FINALE_ARC changes

Not made: FINALE_ARC is shared with the m10 author, and an arc-keeper applies these later. Verdicts are the structure reviewer's (REVIEW_R1_STRUCTURE.md), with the orchestrator's round 1 rulings folded in.

1. **The briefing holds the name back** (accepted, with a sweep). Row 57's "who is Tesseract" beat becomes "who is the suspect": ENTROPY's planner, one of ours once, no name until it can be proved. The name and one sentence (chief strategist, trained half the field) land in the identity scene through Netherton; HaX says the rest. Sweep: row 57, D-15, §8 r2, §5.5 m09, stage 0 §6 "Next steps" and "Design notes".
2. **The order is read and let go on, and its schedule leaves the rack off** (modified). Netherton: "We read it. Then we let it go on. If it hadn't arrived, he would know." The order reads "Burn Helena before the Publication. Schedule attached. -- A." The destruction schedule (Sorensen's annotated copy, in her office) lists every series and leaves off the tape room's rack and the Reading's box, because he wants SAFETYNET to read his server and his file, and to come (§1.2). The player says it at flag 4; his call confirms it. Goes in §1.3, §1.5 (day 11 "intercepts" → "reads"), §6.1.
3. **The sold-and-lied opening carries the offer, and a hang-up keeps the deck pull** (modified). After a hang-up HaX stays on, says the wipe has started, and asks which tape; her file → `named`, the Alpha tapes or nothing → `refused`, as §3.4 already says. Row 61.
4. **The deck pull is made inside the call by HaX** (accepted). Row 60, §6.1 item 3. The saved tape is data on the drop terminal, so the Alpha decode is at a terminal.
5. **Flag 4 carries the casualty sheet, his original** (accepted). §6.1 flag 4 row, §1.2. The correction stays m10's (§4.1). The briefing gives Analysis's lower guess.
6. **One non-HaX voice per scene during play; Torres moves; the cross-reference narrows to two; a new export** (accepted with tweaks, plus the orchestrator's dilemma ruling). Cutscenes are exempt. Torres rings at the Harwick & Lowe boxes, or on the walk to the office if the player never opens them. The H&L file narrows WREN to two lateral hires, Kowalczyk and Quintero (Quintero an innocent H&L placement; both list a parent in residential care). `sleeper_named` is set only by the Recruiter's name. **New export `sleeper_shortlist`** (`true` when the player read the H&L placing sheet without the name): m10 reads "two faces" (a HaX line; the alibi clue confirms the same pair). Goes in row 64, rows 117 and §4.4, §3.4, §5.1 Torres, §5.2 Quintero.
7. **Netherton is on the aircraft, and the debrief is in Helena** (accepted, with a sweep). Row 125 ("from the Citadel"), §5.5 m09, stage 0 §6 "Opening and closing".
8. **The Recruiter's reason** (modified). The Architect has taken WREN's *tasking* for Montana: she stays on Sorensen's books and draws the Initiative's money but answers to him, not the Recruiter, and his order burns her records office. The Recruiter sells what she can no longer use. In m10, WREN plays both ends (his hand on the key if he lets her; the copy for the Initiative when he won't); the m10 author confirms. Row 60, §4.4.
9. **The order names the Publication** (accepted). §1.3.
10. **The cracker** (accepted). Rows 29, 118. m10 issues it again to every player at its briefing (S-26).
11. **The raid team's suspicion beats in §5.2** (accepted). Quintero's "Orders don't fall off couriers" is answered by Netherton ("This one didn't.") so it agrees with change 2. Kowalczyk's door-spec line is cut (W-20); her beat is the cracker.
12. **Flag 3 is submitted in the tape room** (new, orchestrator ruling). §6.1's "Flags 1–3 are submitted at the drop terminal" becomes flags 1–2; flag 3 is submitted beside Tomb Beta's server through the field kit's link, and the identity scene plays there by phone with HaX and Netherton. Saves the walk back to the reading room and the return trip.
13. **"Ninety-nine"** (new, shared with the m10 author). Tesseract calls HaX "Ninety-nine", as he did on the course; nobody else has since. §5.4.
14. **m09 runs about 85 minutes** (new, orchestrator ruling, S-01). §1.3 ("About 75 minutes"), §8 r6, stage 0 §1.
15. **HaX's promise** (new). In m09 she gives the line's meaning in three words and one sentence and promises "the rest, when this is over"; m10 pays it (§5.4). Her confession carries its cost: she had the name the night Fraser and Ferreira died, and Netherton hears it. §5.4 m09.
16. **The Alpha tapes are his recorded teaching** (new, for stage 3's item 25). Tomb Alpha's tapes hold his teaching sessions from the first workshop, in his voice, with annotation sheets in his hand. That is their stake when the player chooses. Row 60, §6.1 item 3.
17. **The m06 name came in the m06 debrief, as Satoshi's guess** (new, wording; S-10). Any line that has HaX saying the name "in Satoshi's office" is wrong; row 70's wording ("said the name in the m06 debrief as Satoshi's 87% guess") already matches.

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
| W-14 | minor | Fixed: "Afterwards. Not during." as a third answer, recorded as `same_in_your_place` | Beat 3.3 |
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
