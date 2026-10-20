# m09 Digital Archaeology: Stage 1, narrative structure

Stage 1. Author: stages 1–2 author (Opus), 2026-10-21. Status: draft, round 0.

Inputs: `../stage_0_initialization.md`; `../../../finale/FINALE_ARC.md` §1–9 and §13 (the shared source of truth; row numbers below are its §2 rows); `story_dev_prompts/01_narrative_structure.md`; the `mission-alignment-plan` and `npc-dialog-review` skills; `README_ink_best_practices.md`; the shipped m01, m02 and m08 briefings, debriefs and HaX phone ink. Characters, voices and sample lines are in `../stage_2/storytelling_elements.md`. VM flags appear only by story meaning (FINALE_ARC §6.1).

## 1. Premise and what m09 owes

**One line.** On day eleven the leave is cut short: SAFETYNET has intercepted an order to "burn Helena before the Publication", and Agent 0x00 has one night inside a Montana records archive to prove who the Architect is, find out what the Publication is, and bring back the way into his bunker, while the archive's own director shreds the evidence behind a steel mesh.

**Where the player stands.** m08 ended with the Global Threat Database gone to Tomb Gamma, Nightshade dealt with, and HaX's text, "Same classroom, 0x00. Don't ask me whose yet." Nobody has said Tesseract's name aloud as fact. The player has been on leave for a day.

**What m09 owes the player** (FINALE_ARC §1.3, stage 0 §1):

1. The name, said aloud and proved from two directions: the credential on Tomb Beta's server (flag 3) and the handwriting on Nightshade's recruitment file. Netherton says it; HaX confesses what she knew.
2. The ledger, which tells every player that one of the four people they met at the briefing is a plant (flag 2).
3. The defences of Tomb Gamma, on paper (the construction file) and on the server (flag 4).
4. The Publication's hour, 06:00 UTC on day 13, and what the Publication is.
5. Proof that Tesseract's case against SAFETYNET is partly true: a flaw SAFETYNET catalogued nine years ago and kept, which Critical Mass later came through at Albion, with his memo arguing it should be reported and the vendor notice he never sent.
6. The player's own file, the Reading: what the man who wrote it thinks they will do.

**The night's shape in one paragraph.** The player gets in, sets up a drop terminal and opens the catalogue (flag 1). The catalogue says the restricted series is in the cage where Sorensen is feeding the shredder. The player talks to her through the mesh, saves one bin, and gets into the cage. Nightshade's file is in a plan chest; the ledger is on the shelf (flag 2) and names WREN on the raid team. The Recruiter rings with an offer, and as she hangs up she wipes a tape deck: the player saves one tape. HaX, in a quiet stretch, says what "Let it hurt afterwards, not during" means to her. In Sorensen's office the player opens the safe with the cracker a raid-team member gave them that morning, and finds where the Reading is filed. The tape room holds Tomb Beta's last server. Flag 3 brings the name; flag 4 brings the hour, the defences, and Tesseract's own casualty sheet, and shows that the one machine the purge order left alone is the one that tells SAFETYNET when and where to come. Tesseract rings HaX. Netherton signs the Montana order.

**The surprise the night builds to.** The purge order protects the cells: it burns the Initiative's placements, its letters and its recruits, and whatever of his old paper happens to be filed beside them. It does not mention the tape room's rack. The server that holds his credential, his Albion memo, the hour and the defences is left running on purpose. He wants to be known, he wants SAFETYNET to read what it kept, and he wants them to come (FINALE_ARC §1.2). The player works this out at flag 4, and his call to HaX confirms it.

## 2. Structure at a glance

| Part | What happens | Rooms | Flags | Minutes |
|---|---|---|---|---|
| Briefing (cutscene) | The wall of cards, the intercepted order, the raid team, the cracker | Task Force Null's room (cutscene background) | – | 5 |
| Act 1: Get in | Loading dock, the guard, the clerk, the drop terminal, the catalogue; the shredder heard through the wall | loading dock, front desk, reading room | 1 | 15 |
| Act 2: The stacks | The cage and the bins, Nightshade's file, the ledger and WREN, the Recruiter's call and the deck; optional: the cross-reference, Tran; the quiet stretch | restricted stacks (the cage), open stacks, server closet, reading room | 2 | 30 |
| Act 3: The name and the hour | The safe and the Reading, the tape room, Tomb Beta's server, the identity scene, the Albion papers, the hour, Tesseract's call | Sorensen's office, open stacks, tape room, salvage cage, reading room | 3, 4 | 21 |
| Debrief | Netherton reads the two names and signs the Montana order | airfield hangar (cutscene background) | – | 4 |
| **Total** | | nine rooms (stage 0 §6) | 4 | **75** |

**Budget notes.**

- Against m08 (70 minutes, one building, four flags): m09 adds about five minutes, which is the purge's two choices and the Recruiter's call.
- Act 2 is the long act and the mission's centre. If playtests run long, the cuts come in this order: the cross-reference (it is optional and the Recruiter's offer gives the same name), Tran's server closet (optional), the Alpha tapes' decode (optional). Nothing on the critical path is cut.
- Each VM stage is budgeted inside its act at about 6–8 minutes for a player using the field guides. The purge moves on story events, so a slow VM stage stretches its act without costing anything in the story.
- Three moments are allowed to run longer than their minute count because they are the mission's payoffs: the Recruiter's call (about 3 minutes), the identity scene (about 3), and Tesseract's call (about 1, mostly silence).

**Tension curve.** Unease (briefing) → a steady build under the shredder (Act 1) → first spike at the cage, when Sorensen quotes the player's own file back at them → the floor drops at flag 2 (one of the team) → the Recruiter's call, the mission's sharpest exchange → a deliberate quiet stretch (HaX and the line) → the Reading, read alone in the stacks → the identity scene, held → flag 4's casualty sheet, the worst number in the season → the call → release in the debrief, with the dread carried forward.

## 3. Opening briefing

A cutscene in Task Force Null's room at the Citadel, on the morning of day 11 (UTC), with `skipIfGlobal: briefing_played`. Netherton runs it and hands the wall to HaX; the four raid-team officers are in the room. About five minutes: a spine of roughly twenty lines, a short question hub, and the team. The m02 shape: cold open and stakes, then a hub so nobody misses a thread, then the job.

### 3.1 Beats in order

1. **Cold open** (Narrator). A room with no windows. One wall of index cards, one per operation, with a photocopy of the m07 decode pinned above them, its sign-off "-- A." circled in red. Four officers in kit nobody has unpacked. Netherton has not sat down. The narrator gives the player one fact: their leave was meant to run three days, and it ran one.
2. **Netherton's line on m08's knock-out**, if any, before anything else (row 110): `m08_netherton_ko` or `m08_netherton_hostile`. One line, flat, never for a laugh.
3. **Netherton opens.** Leave cancelled, and why in one sentence: "Last night we took an order off a courier bound for Helena, Montana." Then the cold open of row 55, Calder Wharf, by branch: found (`m04_lore_safehouse_address_found`), "Your card from Albion. Task Force Null went in yesterday. It held one thing worth having: a courier account." Not found: "Somebody cleaned Calder Wharf out a week before we got there." Then he hands over: "HaX. The wall."
4. **HaX's first line**, by m08 branch (rows 108, 111): her last text was "Same classroom. Don't ask me whose yet", so on every branch where she sent it she picks it up ("Keep not asking. By morning you won't need to."). `m08_hax_ko` adds "You put me on the floor at the Citadel. I'm still running you." first. On the knock-out-before-fate branch she sent no text, and Netherton's no-coordinate line comes here instead (beat 7). A player who never played m08 gets a plain opening (§10.2).
5. **The wall** (row 57). HaX walks it in about sixty seconds: one short line per card, m01 to m08, in the player's own outcomes, or the never-played sentence (§10). The last two cards carry a name each and no outcome: Agent 0x19 Callum Fraser and Agent 0x6B Ana Lúcia Ferreira, the two dead from the unanswered m07 sites. HaX does not read them. Netherton: "I will read those two myself. Later." He reads them at the debrief (row 100).
6. **The suspect, without the name.** Netherton, at the circled "-- A.": SAFETYNET has a suspect; he was one of theirs; "I will not say the name in this room until we can prove it. Tonight we can." On `m06_architect_identity_found`, HaX adds one line to the player alone: "You heard me say it in Satoshi's office. Keep it in your head for one more night." This is the "who is the suspect" beat. The name and the one sentence on who he was land in the identity scene (Beat 3.4), so the reveal is kept for every player, cold starts included.
7. **The order.** On the screen, a photograph of one typed sheet: "Burn Helena before the Publication. Every series. Tonight. -- A." The courier label gives the address and the company: Mountain States Records & Retention, a commercial archive on the edge of Helena. Netherton says how it was caught, by the first branch that applies: the Calder Wharf courier account (found); else the tagged payments, because the courier was paid from a wallet the player tagged at HashChain (`m06_monitoring_enabled`: "Your tags lit up last night"); else the default, that Nightshade's go-bag held a one-way ticket to Helena (row 116) and SAFETYNET has been reading Helena's couriers since. On the no-coordinate branch (`m08_completed and not m08_tomb_gamma_location_known`), Netherton: "We have Helena. Not the bunker. Not yet." and the deed becomes the night's first concern.
8. **The stakes** (HaX, short lines, fact first):
   - Nobody knows what the Publication is. They know what it would be made of: the database, "every weakness we have ever catalogued". One entry, said plainly: an infusion-pump flaw in a hundred and forty hospitals, "and that's one line of forty thousand".
   - Analysis's guess, labelled as a guess: hundreds dead in the first month if the cells get it. ("They're guessing. I'd like to be the one who finds out they guessed low.") Flag 4 replaces the guess with his own figure.
   - Dispatch, on `m07_completed` with Austin uncovered (row 83): "Day eleven. Eleven counties." Covered: dispatch still answering, one line. On Meltdown uncovered (row 85), one line about hospitals in California still doing surgery on paper.
   - The purge has started already, or will by the time the player lands: "Whatever Helena holds is ash before the team can get there, unless you're in it tonight."
9. **The question hub** (§3.2). Each topic once; the player can leave at any time; nothing here gates the mission.
10. **The raid team** (§3.3). Netherton names them in one line each. Each gets a beat, and one gives the player something.
11. **The cracker.** Halina Kowalczyk hands the player a PIN cracker. HaX: "The long way is over." (row 118). Kowalczyk's line about where it came from (§3.3).
12. **Close.** Netherton: the plane leaves in ninety minutes; the team follows tonight; "Bring me a name I can say in court." HaX: "Line's open from wheels down." `briefing_played` is set on the first line; the scene ends on Netherton.

### 3.2 The question hub

A question hub rather than lossy openers (`README_ink_best_practices.md`): each topic is a different piece of information, which is the right kind of briefing choice.

| Topic (player's words) | Answer, in short | Branch lines (at most two per answer) |
|---|---|---|
| "Why that building?" | It is a commercial archive: county deeds, law firms' dead files, closed companies' records. Nobody reads them; nobody checks the night staff. The courier label names it. | By priority: `m03_victoria_fate == "arrested"` (her keys opened Zero Day's client list in the spring, and the company was on it) or `"ko"` (her seized devices, same list, "she still hasn't said a word"); `m05_torres_turned` ("Torres gave us this address in the spring. It was a line in a list."); `m06_minder_walked` (the tip that confirmed Helena came from Kemal Aydin, "the minder who walked out over a casualty figure"); default: the label alone |
| "What's the Publication?" | "We don't know. That's the problem with being told the name of something before you're told what it is." What they can guess (the database) and what they can't (when, how). | – |
| "Who's in the building at night?" | A director who works late, a night guard on rounds, an IT contractor on call, a clerk. HaX has names for two: Margaret Sorensen, the director, county clerk for twenty years before this; and the contractor, Jesse Tran. On `m01_completed and not m01_maya_ko`, "Maya's list has a Tran on it." On `m01_maya_ko`, "Maya Chen would have flagged him. We don't have Maya's names." Never played m01: "Viral Dynamics' staff files have a Tran in them." | (row 6) |
| "When do we go at the Architect directly?" | "Now." The question the player asked in m03 (row 43), phrased so it holds for everyone: "Somebody always asks me that. Now." | – |
| "Why me alone, tonight?" | Because the team cannot be seen in Helena the day before Montana, and because the player is already burned: "They know your face. There's nothing left for you to lose by being seen." Quintero answers this one too (§3.3). | On `m03_victoria_fate == "arrested"`, Netherton: her case is what let the Americans say yes to tonight (row 34) |
| "Let's go." | Ends the hub; goes to the team. | – |

### 3.3 The raid team

Netherton introduces Task Force Null's four in one breath ("Quintero leads on the ground. Kowalczyk breaches. Malhotra runs comms. Arakawa talks to the Americans."), then each gets a short beat. Every beat is ordinary in the room and reads differently once the ledger says one of them is WREN. One each, never a wink (the rule the voice bible sets for Nightshade's seeding lines). This settles FINALE_ARC §13 item 4 for m09.

| Officer | The beat | Why it can look bad later |
|---|---|---|
| Marisol Quintero, "Anchor" | She argued against tonight and lost before the player came in, and says so: one agent, no cover, in a building that is burning paper; "If it goes wrong, I go into Montana a day later and one short." Netherton: "Noted, again." | She wanted Helena left alone, and Helena is where the ledger is. |
| Halina Kowalczyk, "Lantern" | Easy to like. Hands over the cracker (§3.4), makes the one joke in the room, and asks the player to bring back the bunker's door specification: "Breachers like paper." | She asked what the player would find. (She is WREN.) |
| Dev Malhotra | Asks to run the Helena line himself: "If something goes wrong in there, I'd like to hear it go wrong." HaX: "I run 0x00." He lets it go at once. | He wanted to listen to the operation. |
| Kenji Arakawa | Has asked Helena's police to keep their cars off the archive's side of town tonight: "Nobody asked who for. Nobody will." | He cleared the street, and the player cannot know for whom. |

The player can answer one of them (a single choice after the four beats): back Quintero ("She's right. Send me anyway."), thank Kowalczyk, or say nothing. It sets nothing the story reads except one HaX line at the loading dock; it is the player's first look at the four, which is the point.

### 3.4 The cracker (FINALE_ARC §13 item 3, m09 side)

Since m08 every PIN cracker Nightshade ever signed for is quarantined in stores, which is why the player has gone without since St. Catherine's (m08's ATHENA: "still signed out to Agent 0x47"). Kowalczyk's is her own breaching kit: "This one's mine. Never been through stores, never been near him." That line is true. It came to her from Tomb Gamma's bench through the Initiative, logged "to WREN" with a serial (m10's third clue, FINALE_ARC §4.4). She gives it because she wants to be liked by the agent she will go into the bunker with, and because helping 0x00 reach Montana is what the Architect wants (FINALE_ARC §1.2). In m09 it opens Sorensen's safe (Beat 3.1), and HaX's "The long way is over" is the line the player remembers when m10's bench gives the serial back.

Default for the canon question (row 29): not every SAFETYNET cracker comes from the bench. The ones Nightshade procured and signed out did, and so did WREN's. Stage 6 writes that into the Citadel's incident file.

## 4. Act 1: Get in

About 15 minutes. Aim 1: "Get in and set up the drop terminal". Aim 2 opens at flag 1. The purge is already running when the player arrives (FINALE_ARC §6.1): the first thing they hear inside is the shredder.

### Beat 1.1: The loading dock (2 minutes)

Night, sodium light on a grain warehouse with the archive's name stencilled over an older one. HaX's first line on the ground is short and gives the player the clock: "That noise is a cross-cut shredder. It's been running since before you landed." The dock door is locked (picks). Cody Old Coyote's torch moves along the fence on his round; he is the player's first lesson in the building's rhythm, and he is innocent (HaX: "Night guard. Twenty-four. Not ours, not theirs. Don't hurt him.").

### Beat 1.2: The front desk and Noor (4 minutes)

Noor Haddad is at the front desk at an hour clerks are not, loading archive boxes onto trolleys from a printed list. Sorensen called her in "for a scheduled destruction run", and in a records archive that is a normal night's work, which is why Noor has not asked. The trolleys go to the cage. The player can talk to her as whoever they choose to be (a contractor, the auditor, or SAFETYNET), and what she offers depends on m05 (row 62):

- **Warned in time** (`m05_found_pipeline_list and not m05_recruiter_deal_accepted`): SAFETYNET reached her weeks ago, and she knows what the player is the moment they say a name. She gives the warning ("Peg's been in the cage since before I got here. She doesn't feed the shredder herself. Ever. Tonight she's sent me home twice.") and the door (her card for the open stacks' side door, which keeps the player off Old Coyote's route).
- **Warned late** (`m05_found_pipeline_list and m05_recruiter_deal_accepted and m05_recruiter_deal_confessed`): someone from SAFETYNET rang her last week. She gives the warning, not the card: "I don't know you. I'm not losing this job for a phone call."
- **Not warned** (every other case, cold starts included): a wary bystander. The player can tell her she is on a recruiting list and that Sorensen's "after-hours filing" bonus last month was the first approach. That choice (§8) is hers to react to.

Noor's trolley list is also the player's first look at what is being burned: series numbers, no titles. "Series R" appears on every line.

### Beat 1.3: The reading room and the drop terminal (3 minutes)

The reading room is the archive's public face: long tables, green lamps, a microfiche reader, a terminal that only shows the public catalogue. The player sets up the SAFETYNET drop terminal (the field laptop) on a reading desk, and HaX is live on it. On `m06_monitoring_enabled`, the tagged payments are an object on the terminal from the start (row 71): one line of money from the fund to a lease, which HaX reads once ("Your tags, from HashChain. Someone's paying rent on a building in Montana that isn't this one.") and which, on the no-coordinate branch, points at the bunker before the deed does.

HaX gives the VM job in story terms: the public catalogue hides a series; the catalogue server does not.

### Beat 1.4: Flag 1, the catalogue (6 minutes)

**VM flag 1** (a foothold on the catalogue server): the index of every box, tape and shelf, including the restricted series. Submitted at the drop terminal. HaX says what it bought: the shelf marks for Series R, which sit in the restricted cage, and "the boxes on Noor's trolleys are the ones on this list". It also gives the first clue to the tape room's code: one catalogue entry for the tape room is written in an old archive encoding (decoded later, Beat 3.3).

On `m08_nightshade_triple_agent`, **Nightshade rings** here (row 104), from a SAFETYNET room, on the player's handset, competing with HaX for the line. He names which database entries the archive's restricted cage was built against (the reader that takes a lifted print; the badge reader that takes a clone), and he is right. HaX lets him talk and says nothing until he has gone: "He's right. I hate that he's right." This is his whole m09 presence until his file (Beat 2.2).

**Act 1 ends** with the shelf marks on the screen and the shredder still going: Series R is behind the mesh, in Sorensen's hands. Aim 2 opens: "Find the restricted series before it burns".

## 5. Act 2: The stacks

About 30 minutes. Aims 2 and 3. The purge's first two events happen here, in FINALE_ARC §6.1's one order: the cage, the ledger shelf, flag 2, the Recruiter's call, the tape deck.

### Beat 2.1: The cage (8 minutes)

The restricted stacks are a steel mesh cage inside the warehouse, floor to roof. Sorensen is inside, at a cross-cut shredder and a degausser, feeding them from Noor's trolleys. She is reachable only by talk, through the document hatch in the mesh, until the cage is open.

1. **The bluff.** The player can be the auditor the lease-holder sent (stage 0 §5, from Option 2). Sorensen is polite, precise and in no hurry; auditors are a thing she knows how to handle. While she talks, she stamps each box as destroyed with a rubber stamp she sets down on the hatch shelf between boxes, and her master card hangs on a reel at her hip, close to the mesh. The player lifts her print off the stamp (fingerprint kit) and clones the card through the mesh (the m08 technique). On `m03_victoria_fate == "recruited"`, Victoria's protocols read the archive's internal mail, and Sorensen's mail holds the cage's maintenance code: a second way in that replaces the print and the card (row 32).
2. **HaX names the bins.** Two bins wait by the shredder's mouth. The one nearer the hatch holds Derek Lawson's file from the restricted series, written before Viral Dynamics hired him, costing his fall (row 1, row 9). The other holds, on `m08_nightshade_tidied`, the copy Nightshade sent ahead before the arrest ("So that's what he had time to clear", row 113), or by default the Initiative's letters to Social Fabric (stage 0 §3's inter-cell trail). HaX says what is in each in one line and does not choose.
3. **The recognition.** Before the player can act, Sorensen stops the bluff herself. She quotes one entry from the Reading at them, from memory, because she filed it (FINALE_ARC §2 intro, row 101; which entry: Beat 3.2). The player has not read it yet. She says it kindly. "You're not from the lease-holder. You're the reader's agent. I keep your file." HaX: "...She's got a file on you." This is the act's first spike.
4. **The choice** (every player): pull one bin through the hatch. Sorensen tips the other into the shredder as the player does, without hurrying. If the player skips the hatch and opens the cage, the bin by the hatch (Derek's) survives and the other is gone. Either way, by the time the cage opens one bin is ash.
5. **The cage opens.** Sorensen turns hostile, and she has nothing to fight with but the building: she tries to keep feeding the shredder and the ledger shelf is next. The player can arrest her, knock her out, or leave her shredding (stage 3 decides whether talk can stop her; §8). A downed or arrested Sorensen stops the rest of the paper purge: everything she had not reached survives (FINALE_ARC §6.1). Her card drops when she is down; her print stays on the stamp.

### Beat 2.2: Nightshade's file (3 minutes)

In a locked plan chest at the back of the cage, never on a trolley: Nightshade's recruitment file from fifteen years ago, when he was 23 and in the intake SAFETYNET's chief strategist was teaching (row 106). Every annotation is in one hand. The player has seen that hand: in the m07 decode pinned above Task Force Null's wall, a copy of which is in the drop terminal's case file. The correlation is document work the player does (stage 0 §2.2), and the salvage cage's Tomb Alpha and Tomb Beta files confirm it in Act 3 (Beat 3.3). HaX, when the player says it is the same hand, is quiet for a moment and then asks for the server: "Hold that. I want it from two directions before anyone says a word."

On `m08_nightshade_triple_agent`, the player can send Nightshade his own file from the drop terminal (now or any time before the debrief; `nightshade_shown_file`). If they do, he sends one text back and nothing more (stage 2 §2). The choice pays off at m10's door (row 105).

### Beat 2.3: The ledger and flag 2 (8 minutes)

The ledger shelf holds the Initiative's printed ledger in a locked binder, codenames only, unreadable without the key that the live copy on the catalogue server carries.

**VM flag 2** (the Insider Threat Initiative's live ledger): submitted at the drop terminal. HaX reads it aloud in story terms: twenty-three placements, forty-seven candidates, and a legacy section older than any list m05 found. One legacy entry, under the codename WREN, was updated yesterday, in Sorensen's hand: "assigned TF Null, Montana operation".

- HaX: "Montana operation. Yesterday. That's one of the four you met this morning." Then the practical part: she has told Netherton; he will say nothing to the team; "and neither will you."
- The printed ledger at the shelf is now readable. Once the player has read it, Sorensen shreds it if she is still free; nothing is lost, because the flag holds it.
- **What m05 changed** (rows 63, 64, 64a), one line on the page and at most one from HaX: on `public_exposure` the twenty-three are marked "blown"; on `turn_double_agent` Torres' own entry still reads as a live placement, because the Initiative never learned he turned; on `combat_lethal` his entry reads "closed placement" in Sorensen's hand and HaX says nothing for a beat; on `arrest`, `combat_nonlethal`, or never played, "lost".
- On `m07_found_tomb_gamma` (row 95): "You bagged the dossier. 'Including the people.' This is the people."
- On Reeves in custody (`m02_reeves_fate` in `arrested`, `ko`, `flagged`, or the read rule on `m02_insider_asset_arrested`; rows 21–22), his handler's contact sheet is clipped inside the binder. HaX: "Reeves' handler, from the hospital."
- Noor is on the candidates' page under a codename. A player who told her she is on a list can show her the line (§8).

**The floor drops here.** From this point the player knows the raid team has a plant in it and that the Initiative knows about Montana. The optional cross-reference opens (Beat 2.5). HaX's hub gains the WREN topic.

### Beat 2.4: The Recruiter's call (4 minutes)

She rings the player's handset once they have read the ledger (row 60). Phone only, no face, as in m05. HaX stays on the line. Every player hears her offer, and the call ends in the second purge choice. The call has three openings and one spine.

**Openings** (row 61):

- **Sold and lied** (`m05_recruiter_deal_accepted and not m05_recruiter_deal_confessed`): she opens with the receipt and the offer in the same breath: "Forty-seven names, and nothing points at you. Does your handler know? I'd like to give you one more name, and I'd like you to keep this one too." The player chooses there and then: tell HaX, on the open line (`recruiter_secret = told`), or hang up on her (`kept`). Hanging up ends the call before the player answers the offer, which records as `refused`; the deck wipe still starts, and HaX, who heard the receipt, asks once and lets it lie.
- **Sold and confessed** (`m05_recruiter_deal_accepted and m05_recruiter_deal_confessed`): HaX cuts in before she can use it: "We've talked about that. She has nothing on you." The Recruiter's leverage dies on the line, and she goes straight to the offer (`recruiter_secret = confessed`).
- **Never sold**, or never played m05: she introduces herself. A player who refused her in m05 gets her old line back at them: last time was free, "the next one might cost me more", and this is the next one. A cold-start player gets a stranger who already knows their designation and their kit.

**The spine** (every player):

1. **Why she is calling.** The Architect has taken WREN off the Initiative's books for his own use, and his order is burning her records office to protect the cells. She is a cell leader with her own interests, and she takes the purge personally: "He's burning my archive to save his schedule."
2. **The offer.** WREN's name, now, and always right (trusting her is never a trap). The price: the player lets her file go. Her file is a tape on a deck in the archive, and she is about to wipe the deck herself.
3. **HaX names what is on the deck** before the player answers: the Recruiter's file, a tape with her handler list (by m05: the handlers for the twenty-three; on `public_exposure` her handlers and the forty-seven; on `turn_double_agent` the names Torres could not give), and Tomb Alpha's tapes, the Architect's early annotations. The player can save one, by telling HaX, who pulls it through the drop terminal while the call is still open (§14 change 4).
4. **The answer.** Take the offer: she says "Halina Kowalczyk" and one more sentence about the cracker that morning, then hangs up and fires the wipe; the player pulls the Alpha tapes (`taken`) or pulls her file anyway (`double_crossed`). Refuse: she hangs up and fires the wipe; the player pulls her file (`named`), the Alpha tapes or nothing (`refused`). The tape not pulled is wiped. `sleeper_named` is set on any branch where she said the name.
5. **After she hangs up.** On `double_crossed`, HaX: "She'll know inside the hour." The Recruiter's own answer to it waits for the m10 epilogue ("I'll remember the shape of you", row 60).

This is Act 2's climax and the mission's sharpest exchange. Stage 3 owns the choice's wording; stage 2 §2 has her voice.

### Beat 2.5: The cross-reference, optional (3 minutes)

The legacy entry for WREN carries a placing agent's file number. The archive holds the dead files of Harwick & Lowe, an executive search firm closed years ago, deposited for retention in the open stacks like any other client's boxes. The number leads to one placement file: a lateral hire from the private sector, eleven years ago, to "a government client", and a name. That is `sleeper_named` the long way, and on a branch where the Recruiter already said the name it confirms she was right.

On `m05_torres_turned`, **Torres rings** from his desk inside the Initiative as the player opens the Harwick & Lowe boxes (row 64; the call moves here from the ledger, §14 change 6). He knows the legacy filing scheme, which takes one step off the search, and he says the one thing only he would know about the forty-seven: "They pick people with someone to lose. Look for the ones with a sick parent." It also tells the player something about Noor.

### Beat 2.6: Tran and the tape side, optional (2–4 minutes)

Jesse Tran runs the rest of the tape side's wipe from the server closet: the Initiative's legacy recruitment interviews, optional lore. He is Social Fabric's agent on the staff (row 6). HaX warns the player before they reach the closet, by m01 branch (§3.2's lines). On `m01_maya_ko` he is a surprise instead: if he sees the player first, he calls in a second guard (avoidable). Stopping him (talk, knock-out, or arrest) saves whatever of the tape side is still unwiped. It never saves the deck, which the Recruiter wiped herself.

### Beat 2.7: The quiet stretch (2 minutes)

After the deck, with the player moving again (leaving the reading room or the cage), HaX rings unprompted, once. Two things, in this order:

1. **What the purge cost**, said once and plainly: which bin and which tape are gone (FINALE_ARC §6.1: "HaX names what was lost, once").
2. **What the line means to her** (FINALE_ARC §5.4). "Let it hurt afterwards, not during." She was taught it as a field rule, and she has used it with every agent she has run: you keep your own hurt for afterwards so you can do the job, and you never hand it to strangers. This is the version the player can use against him in m10 (row 120). On `m07_architect_echo_heard` she adds that she heard him say it to the player and has not slept properly since.

She does not say whose line it is. That comes at flag 3. This beat also lives in her hub, gated on the deck choice, for a player who closed the call early.

**Act 2 ends** with the player holding WREN (or knowing they could), the purge's two losses named, and HaX's version of the line. Aim 4 opens: "Search the director's office".

## 6. Act 3: The name and the hour

About 21 minutes. Aims 4 and 5. Two flags, two documents that change how the player sees the night, and one phone call they hear only half of.

### Beat 3.1: Sorensen's office (4 minutes)

A county clerk's office moved forty miles: a wall of binders, a kettle, a framed certificate for twenty years' service to Lewis and Clark County. The safe opens with Kowalczyk's cracker, or the long way (the PIN is on her desk for a player who looks). HaX: "Kowalczyk's toy. Tell her it worked." On `sleeper_named`, the same moment reads: "Her cracker. Use it anyway." The safe holds the Reading's shelf mark and the tape room's key card.

The office files are where the money and the lease are, two objects and at most one line each:

- **The lease file** for the bunker's land and buildings, held for the lease-holder: Zero Day's front company (m03), paid from the Crypto Anarchists' account (m06). It holds Tomb Gamma's deed and its construction file (the paper half of the defences, and on the no-coordinate branch the bunker itself: "There it is. Tomb Gamma has an address." Elsewhere: "Same coordinate Nightshade gave us. Now it has a lease."). Lines by branch: `m06_irina_recruited`, "Irina's account. We're using it. Tell her." (row 74); the m03 Danny line by `m03_danny_fate` (row 36), because Zero Day's front company file holds its note on him.
- **The refit ledger**: what the bunker's refit cost and who paid. On `m02_paid_ransom`, St. Catherine's ransom is a line in it, and HaX reads the date (row 17).

### Beat 3.2: The Reading (4 minutes)

The shelf mark leads back into the open stacks, to a box catalogued as a county drainage survey. Inside is a thin file: the Architect's reading of Agent 0x00 (row 101), four entries and a last page, in his written register (stage 2 §5). The player reads it alone; HaX says nothing while it is open. Afterwards she asks once whether the player wants to tell her what it says, and the player can tell her or not (a stance that colours one line of her confession). Reading to the last page sets `reading_finished`.

**The four entries** (row 101; FINALE_ARC D-06): m01 `final_choice`, the innocents line, m04 `disclosure_choice`, m07 `debrief_stance`, each with a never-played form. Wording and every branch: stage 2 §5. **The last page** predicts that when the hour comes 0x00 will be in the room, the key will be in reach, and 0x00 will press it, because they will have read this far and found nothing untrue (FINALE_ARC §1.2).

**Which entry Sorensen quoted at the cage** (Beat 2.1): the first entry in the Reading's order whose source mission the player finished, in her words, short. A cold-start player hears entry 1's never-played form. Finding it on the page, in his words, is the second half of that spike.

### Beat 3.3: The tape room (3 minutes)

The tape room needs the key card from the safe and a door code. The code is the catalogue entry flag 1 turned up, written in an old archive encoding; the player decodes it at the CyberChef workstation. On `m02_gary_protected`, **Gary Whitlock rings** when the player first tries the keypad (row 23): he audited a hospital that ran the same tape library and remembers how its codes were written down, which is the decode hint. Without Gary the player works it out from the catalogue's own legend (the long way, no harder, one more read).

Inside: tape racks to the roof, cold air, and among them Tomb Beta's last server, still racked, still running, its fans the only warm thing in the building. Through a second mesh door, the salvage cage holds what came out of Tomb Alpha and Tomb Beta when they closed: crates, a bench, a door controller with its wires cut, and Tomb Beta's enrolment binders, annotated in the same hand as Nightshade's file (the second half of the correlation). On the Alpha-tapes branch, a reader for the tapes the player saved sits on the bench, and the optional decode of the annotations gives, in his hand, the line HaX recognises (stage 0 §2.2; FINALE_ARC §13 item 25 is stage 3's).

### Beat 3.4: Flag 3 and the identity scene (5 minutes)

**VM flag 3** (the owner of Tomb Beta's server): the credential text beside the flag is a SAFETYNET staff credential issued to Dr Adrian Tesseract before he left seven years ago, never revoked. Submitted at the drop terminal in the reading room, so the player walks back from the tape room to say it where HaX can see it.

The scene runs when flag 3 is in and the player holds Nightshade's file (which is on the critical path before the tape room; stage 5 places it). If the file is somehow not held, HaX asks for it and the scene starts when it is picked up. This settles FINALE_ARC §13 item 9: the scene carries the proof, the name, one sentence on who he was, HaX's confession and the player's answer, and nothing else. The vendor notice moves to Beat 3.5, and the meaning of the line was already given in Beat 2.7.

1. **The proof.** HaX reads the credential's first line aloud and stops before the name.
2. **Netherton.** He is on the line from the aircraft taking Task Force Null to Montana (§14 change 7). Row 125's line, unchanged: "I said we wouldn't name him until we could prove it. We can. Dr Adrian Tesseract." Then one sentence for every player, cold starts included: chief strategist until seven years ago; he trained half the field, HaX among them. Then, by branch, at most one extra line from HaX or Netherton: `m07_architect_echo_heard` ("You heard him say it. My line. His line.", row 97) or, if not, `m03_directive_decoded` ("You've read his hand before. Sterling's drive.", row 37). Netherton: "HaX. Take a minute. I am staying on the line." He does not speak again in the scene.
3. **HaX's confession.** Four forms (row 70, row 98, FINALE_ARC §5.4), chosen by `m06_architect_identity_found` and `m07_teacher_discussed`:
   - **Safe opened, teacher discussed:** "I told you on the handset he taught me." She said the name in m06 as Satoshi's guess; now she says it as fact, and it costs her. Her confession: she sat on it because he was hers. She goes further, faster.
   - **Safe opened, teacher not discussed:** as above, starting a little further back: she said a name in m06 and called it a guess, and she has been hoping since that it was one.
   - **Safe shut, teacher discussed:** "I told you somebody taught me that line. I didn't say who." She has known since the fund's file in m06; "keep it out of your notes" in m07 was her hiding it from the player.
   - **Neither** (cold starts included): she starts furthest back. There was a file on a crypto fund, a name at eighty-seven per cent, and she put it in a drawer.
4. **The player's answer** (every player; `hax_confession_answer`). Safe shut: "You should have told me." (`should_have_told`) or "I'd have done the same in your place." (`same_in_your_place`). Safe opened: "You should have pushed." or "I'd have sat on it too.", exported as the same two values. Neither is wrong (FINALE_ARC §5.4). HaX answers each in one or two lines and gets back to work. A player who told her what the Reading said hears one extra word in her reply.
5. **Back to work.** HaX: there is more on his box, a memo and a draft; "Read them. Then tell me what you want to do."

### Beat 3.5: The Albion papers and the notice (2 minutes, plus the optional send)

Flag 3's files hold three documents (FINALE_ARC §1.3): the catalogue entry for a flaw in the control equipment at Albion's plant, marked "retain: operational value" nine years ago; Tesseract's memo from the same month arguing it should go to the vendor; and the vendor notice he drafted and never sent. Critical Mass came through that hole at Albion.

HaX lands the m04 choice (rows 48, 57), one line by `m04_disclosure_choice`: on `full`, the player told Albion's inquiry everything and SAFETYNET told the vendor nothing for nine years; on `partial`, the player told half and SAFETYNET told less; on `quiet`, the player kept Albion quiet and so did SAFETYNET; never played or unset, the plain fact that Critical Mass came through this hole. The player learns his case is partly true before he makes it.

**The notice** (optional, `albion_notified`): the player can send the vendor notice now, from the drop terminal, at any time before the debrief. HaX does not tell them to: "It isn't my call. It isn't yours either. If you're going to, don't ask me first." It is nine years late. Netherton answers it at the debrief.

### Beat 3.6: Flag 4, the hour (2 minutes)

**VM flag 4** (full control of Tomb Beta's server), submitted in the tape room beside the machine: the job that still mirrors to Tomb Gamma. In story terms it carries:

- **What the Publication is.** At 06:00 UTC on day 13 Tomb Gamma releases the whole stolen database to everyone at once, free, every entry with working detail. HaX: "He isn't selling it. He's giving it away. To everyone, at the same time."
- **The head start**: the cells get it two hours early, at 04:00.
- **The fallback**: if nobody presses the key, it releases itself, city by city.
- **The defences**: the list of Tomb Gamma's defences, each built from an entry in the stolen database.
- **His casualty sheet**, signed: 1,100 to 2,600 dead in the first month, as hospitals, grids and dispatch centres are hit by people who never had the skill before. "An acceptable price for the last arms race." This replaces the briefing's guess, and it is the worst number in the season. HaX reads the range once and does not round it.

Then the realisation, which the player can reach before HaX says it: the purge order lists every series in the building and not the tape room's rack. Sorensen was never told to touch it. HaX: "He burned the people. He left us this. He wants us to come."

### Beat 3.7: Tesseract rings HaX (1 minute)

He rings HaX, not the player (FINALE_ARC §5.4, D-log). The player's line stays open and they hear her side only: short answers, a refusal of a name he still calls her by, and at the end, "I'll bring them." His voice is never heard in m09; the narrator gives one line for it ("A man's voice on her end, too low to make out."). Then she tells the player what he said, in three sentences: the blast door will open for 0x00 by name; take your time getting there; and he asked whether they had found his notes.

Music is silence under the call (stage 2 §6). The mission's conclusion aim opens: report to Netherton. `concludeRequires`: the four flags only.

## 7. Closing debrief

A cutscene in a hangar at Helena's airfield, where Task Force Null's aircraft landed while the player was in the archive. Netherton is there in person; HaX is on the line from the Citadel and on the next plane. About four minutes. Triggered by the conclusion aim; `debrief_played` on the first line, the conclusion task completed on the last line, then `bond_visualiser` and credits (the m08 shape, lessons 42 and 46).

The m02 shape: a stance beat, a question hub so nothing is skipped, and a spine every player hears.

### 7.1 Beats in order

1. **Cold open** (Narrator). Floodlights, an aircraft with its ramp down, the team unloading cases. Kowalczyk is carrying a crate. On `sleeper_named`, one more narrator line: Quintero has not let her out of her sight, and has not been told why.
2. **Netherton opens with the hour**, plainly, as the thing that has changed: "Oh-six-hundred, day thirteen. Twenty hours. He has given us every one of them." Then the name, once, as a fact he can now say in a hangar.
3. **Stance** (every player). Netherton: "He was one of ours. Say what you think of that." Two options, recorded locally and paid back in his last line: "We trained him, sir. We kept the flaw he warned us about." / "He chose this. Nobody made him." Neither is wrong. (Stage 3 may widen this; it is not exported.)
4. **The question hub.** Each topic once; the spine follows whatever the player asks.

| Topic | What Netherton says, by branch |
|---|---|
| "The archive, sir." | What the purge cost and what the player stopped, one line each and no list: the bin saved (Derek's file, Nightshade's copy, or the Social Fabric letters); the tape saved (her file, the Alpha tapes, or nothing); Sorensen (arrested: "she has asked for a lawyer and a pencil"; knocked out; or left at the shredder, and she finished the job); Tran (stopped, or not, and on `m01_maya_ko` the guard he called); Noor (helped, warned, told she is on the list, or none); Old Coyote (talked past, or knocked out: "He wants to climb power lines for a living. He will. Not this week."). |
| "WREN." | Named: "Halina Kowalczyk", how the player got there (the cross-reference, the Recruiter, or both), and on `double_crossed`, the twelve and the rest warned. Not named: "One of four. You met them. I have known all four of them for years, and it does not help." |
| "The Recruiter." | By `recruiter_offer`: `named`, her handler list is with Analysis and the arrests start tonight; `double_crossed`, the same, "and she knows it was you"; `taken`, she is at large and her network with her, "you bought a name with it, and it was the right name"; `refused`, she is at large, "and you did not let her set the price". On `recruiter_secret == "told"`: "HaX tells me you told her something on that call. I do not need to hear it twice." |
| "The notice." (only on `albion_notified`) | "You sent it without asking me. I would have said yes. I would have taken a week to say it." |
| "Montana, sir." | Goes to the spine. |

5. **The spine** (every player):
   - **The two names** (row 100). Netherton reads them before he signs, in full: "Agent 0x19, Callum Fraser. Agent 0x6B, Ana Lúcia Ferreira." No comment after.
   - **The order.** He signs the Montana order in front of the player. On `m08_debrief_stance == "owned"`, his own name goes beside Nightshade's on the file, and he says so (row 109). On `defended`, one thank-you he does not explain.
   - **Why the team goes in together** (row 117). Not named: "If I bench four agents tonight, WREN knows we know. They come. You watch them." Named: "We take her at the briefing, in front of the others, where there is nowhere to go. Until then she sees nothing in my face. Nor in yours."
   - **HaX, last.** One line on the open line, by `hax_confession_answer`: a player who said she should have told them hears her say she is telling them everything from now on, starting with the bunker; a player who said they would have done the same hears her say thank you and that she will not ask them to do it again.
   - **Netherton's last line**, by the stance in beat 3: "We trained him" gets "Then we finish what we started."; "He chose this" gets "Then he can answer for it." Then: "Sleep. That is an order, and the only one tonight I expect to be ignored."
6. **Conclusion**: `mission_complete`, the conclusion task, `bond_visualiser`, credits reading back the night's choices (stage 4 writes the credit lines).

### 7.2 What the debrief must not do

- It must not list every carry-over again. The wall did the "previously on"; the night's own choices are what the debrief reads.
- It must not judge the confession answer or the Recruiter's deal as right or wrong. It states what each bought.
- Netherton never softens the casualty range and never names the Publication's hour in local time (FINALE_ARC §8 r8).

## 8. Mid-mission choices

Stage 3 owns the wording, the costs and the "does it matter" test; this is where each choice sits in the story and what it sets. Every player meets the first four. Variable names are working names; stage 4 fixes them, and the seven exports keep FINALE_ARC §3.4's names.

| # | Choice | Who meets it | When | Options | Sets | Paid back |
|---|---|---|---|---|---|---|
| 1 | The cage bin | every player | Beat 2.1 | Derek's file / the other bin (Nightshade's copy or the Social Fabric letters) / open the cage without the hatch (Derek's survives) | `cage_bin_saved` | HaX's cost line (2.7); the debrief; Derek's file is read by m10's Tesseract only through `m01_final_choice`, so the bin is an m09 payoff |
| 2 | The Recruiter's offer and the deck | every player | Beat 2.4 | take / refuse / take, then pull her file anyway; and which tape to pull | `recruiter_offer`, `sleeper_named`, `deck_pulled` | m10 briefing (WREN detained), m10 closing card (her network); the debrief |
| 3 | The answer to HaX's confession | every player | Beat 3.4 | "should have told / pushed" / "same in your place / sat on it too" | `hax_confession_answer` | the debrief's HaX line; m10's core (FINALE_ARC §5.4) |
| 4 | The stance on Tesseract | every player | debrief beat 3 | "We trained him" / "He chose this" | local | Netherton's last line |
| 5 | Tell HaX about the m05 deal | `m05_recruiter_deal_accepted and not m05_recruiter_deal_confessed` | Beat 2.4 | tell her on the open line / hang up | `recruiter_secret` (`told` / `kept`) | m10: Tesseract's leverage line and HaX's reply |
| 6 | Send Nightshade his file | `m08_nightshade_triple_agent` | Beat 2.2 onwards | send / keep | `nightshade_shown_file` | m10's door (row 105) |
| 7 | Send the vendor notice | every player can; nobody is pushed | Beat 3.5 onwards | send / don't | `albion_notified` | the debrief; m10's talk-down and his answer |
| 8 | Read the Reading to the end | every player can | Beat 3.2 | read on / put it down | `reading_finished` | m10's talk-down option |
| 9 | Tell HaX what the Reading said | readers of the Reading | Beat 3.2 | tell / don't | local | one word in her confession reply |
| 10 | Noor | every player | Beat 1.2, and the ledger page | tell her she is on a list / show her the line / leave her be | `noor_told` | Noor's own reaction; the debrief |
| 11 | Sorensen | every player | after the cage opens | arrest / knock out / leave her shredding (stage 3: whether talk can stop her) | `sorensen_fate` | what of the paper side survives; the debrief |
| 12 | Tran | players who go to the server closet | Beat 2.6 | stop him (talk, knock-out, arrest) / leave him | `tran_stopped` | what of the tape side survives; the debrief |
| 13 | Old Coyote | every player who meets him | Act 1 | talk past / sneak past / knock out | `old_coyote_ko` | one debrief line |
| 14 | The raid team | every player | briefing | back Quintero / thank Kowalczyk / say nothing | local | one HaX line at the loading dock; a first look at the four |

Choices 1 and 2 are forced by events (the cage opening, the call ending), so stopping Sorensen or Tran first cannot skip them (stage 0 §7). Nothing on this list gates `concludeRequires` or the critical path.

## 9. Climax and the hook into m10

**The climax is two documents and a phone call.** m09 is the investigation half of the finale, and its climax should feel like the floor giving way under a reader:

1. The identity scene (Beat 3.4): the name said by the man who promised not to say it, and the handler admitting what she sat on.
2. The casualty sheet (Beat 3.6): 1,100 to 2,600, signed. The "moment of horror" the 02 prompt asks for, found in play, worse than the briefing guessed.
3. The realisation that the server was left for them, and the call that confirms it (Beats 3.6–3.7). The player has spent the night racing a purge, and learns the man behind it wanted them to win this part.

Light combat stays where stage 0 put it (Tran's guard, Sorensen if pushed). A fight at the end would shrink the reveal.

**The hook** carries five things into m10, each said once:

- **The hour and the door.** 06:00 UTC on day 13; the blast door that opens for 0x00 by name; "take your time" (Tesseract via HaX). m10 opens on that countdown.
- **WREN.** Either a name the player holds and Netherton will act on at m10's briefing, or one of four faces the player will watch all night. "They come. You watch them." is the line that ends the mission's plot.
- **His case, already half-answered.** The Albion papers, and on `albion_notified` the notice already sent. The player walks into m10 knowing his argument and holding one answer to it.
- **The Reading's prediction.** A player who read to the last page knows he expects them to press the key. m10's "Your file says I press it. Watch me." depends on it.
- **HaX's state.** She has said the name, been answered, and taken his call. In m10 she is on the line all night with a man she trained under on the other end of it.

The last image is Netherton's pen and the hangar's floodlights. The music goes to the closing track as he says "Sleep."

**What m10 imports from m09** (FINALE_ARC §3.4): `nightshade_shown_file`, `sleeper_named`, `recruiter_offer`, `albion_notified`, `hax_confession_answer`, `recruiter_secret`, `reading_finished`, plus `m09_completed`. Every one is set at a moment named above (§8). Stage 4 also needs `deck_pulled == "alpha_tapes"` to be readable if stage 3 adopts §13 item 25 (`alpha_tapes_saved`).

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
| The suspect | "One of ours, once. No name until we can prove it." Nothing more until flag 3. |
| Noor | A wary bystander. |
| Tran | HaX's neutral warning ("Viral Dynamics' staff files have a Tran in them."). |
| Nightshade | No call. His file in the plan chest is still the proof, and still in his teacher's hand. |
| The ledger | Torres' entry reads "lost". |
| The Recruiter | A stranger who knows their designation. The offer is the same. |
| The tape room | No Gary; the long way. |
| The identity scene | The fourth form: HaX starts furthest back (the fund's file, eighty-seven per cent, a drawer). Netherton's sentence on who Tesseract was is the "who is Tesseract" beat for this player. |
| The Reading | The never-played form of all four entries (stage 2 §5), which read as the Architect's notes on an agent whose record he had and the player never lived. |
| The debrief | The same spine. |

A stage 2 reviewer reads this path with no other mission in mind (stage 0 §6). The test: does a player who has never heard of Derek, Ghost or Nightshade still understand, by the end of the briefing, who the enemy is, what was stolen, why tonight, and who is in the room? The wall, the order and the stakes beats are written to pass it.

## 11. Beats against rooms and flags

The nine rooms are stage 0 §6's; placement and lock order are stage 5's (FINALE_ARC §13 item 31). One non-HaX voice per scene: no two of Sorensen, Noor, Tran, Old Coyote, Nightshade, Torres, Gary, the Recruiter and Netherton speak in the same scene (§14 change 6).

| Beat | Room | Non-HaX voice | Flag | Purge event | Aim |
|---|---|---|---|---|---|
| Briefing | cutscene (Task Force Null's room) | Netherton, the team | – | – | – |
| 1.1 | loading dock | Old Coyote (if met) | – | the shredder audible | 1 |
| 1.2 | front desk | Noor | – | the trolleys | 1 |
| 1.3–1.4 | reading room | Nightshade by phone (triple agent) | 1 | – | 1 → 2 |
| 2.1 | restricted stacks (the cage) | Sorensen | – | **the cage**: one bin lost | 2 |
| 2.2 | restricted stacks (plan chest); the comparison at the drop terminal's case file | – | – | – | 2 |
| 2.3 | restricted stacks (ledger shelf); flag at the reading room | – | 2 | the printed ledger shredded once read, if Sorensen is free | 3 |
| 2.4 | wherever the player is (by phone) | the Recruiter | – | **the deck**: one tape lost | 3 |
| 2.5 | open stacks (Harwick & Lowe boxes) | Torres by phone (turned) | – | – | 3 (optional task) |
| 2.6 | server closet | Tran | – | the rest of the tape side, until he is stopped | optional |
| 2.7 | moving (by phone) | – | – | – | 3 → 4 |
| 3.1 | Sorensen's office | – | – | – | 4 |
| 3.2 | open stacks (the drainage-survey box) | – | – | – | 4 |
| 3.3 | tape room; salvage cage | Gary by phone (protected) | – | – | 5 |
| 3.4–3.5 | reading room (drop terminal) | Netherton by phone | 3 | – | 5 |
| 3.6 | tape room | – | 4 | – | 5 |
| 3.7 | tape room (by phone) | none heard (Tesseract to HaX) | – | – | conclusion |
| Debrief | cutscene (hangar) | Netherton | – | – | conclusion |

**Aims**, as stage 0 §6 sets them, with the beats that open and close each: 1 Get in and set up the drop terminal (1.1–1.3). 2 Find the restricted series before it burns (1.4–2.2). 3 Read the Initiative's ledger (2.3–2.5; optional: identify WREN). 4 Search the director's office (3.1–3.2). 5 Take Tomb Beta's server (3.3–3.6). Optional: stop Sorensen; stop the tape wipe; send the vendor notice. Conclusion: report to Netherton.

## 12. Handover items settled (FINALE_ARC §13)

Items owned by stage 1 or 2 that concern m09. The m10 scenes in the same list (items 2, 5, 19, 24, 32, and the m10 half of 11) are the m10 author's.

| # | Item | Settled here | Where |
|---|---|---|---|
| 3 | What Kowalczyk's cracker is for; whether every SAFETYNET cracker comes from the bench | m09 side: stores quarantined every cracker Nightshade signed for after m08; Kowalczyk gives the player her own ("never been through stores"), which is true and is the one logged "to WREN" at the bench. She gives it to be liked and because getting 0x00 to Montana is what the Architect wants. In m09 it opens Sorensen's safe. Canon default kept: Nightshade's crackers and WREN's came from the bench, not every SAFETYNET cracker. Canon note for stage 6. | §3.4, Beat 3.1 |
| 4 | A beat and a reason for suspicion for Quintero, Malhotra and Arakawa | m09 briefing: Quintero argued against tonight's job (the archive where the ledger is); Malhotra asked to run the Helena line himself; Arakawa kept Helena's police off the archive's side of town tonight, "nobody asked who for". Kowalczyk's is the cracker and a request for the bunker's door spec. All true, all innocent except hers, one each. m10 can call back to any of them. | §3.3 |
| 8 | The default source of the archive's company name | The courier label on the intercepted purge order. How the order was caught: the Calder Wharf courier account (m04 found), else the HashChain tags (m06), else the Helena ticket in Nightshade's go-bag (every player). Branch confirmations of the company, at most two in the briefing hub: Victoria's keys or devices (m03), Torres' list (m05), Kemal's tip (m06). | §3.1 beat 7, §3.2 |
| 9 | The identity scene's load; whether the notice moves | The scene carries the proof, Netherton's name and one sentence on who Tesseract was, at most one extra recognition line (echo heard, else directive decoded), HaX's confession and the player's answer. The handwriting is done earlier, at the plan chest (2.2), and confirmed in the salvage cage (3.3). The meaning of the line comes before, in the quiet stretch (2.7). The notice moves out of the scene to its own beat (3.5) and stays available until the debrief. | Beats 2.7, 3.4, 3.5 |
| 10 | Nine years | Used throughout. | – |
| 11 | One non-HaX voice per room | Applied to m09 per scene (calls follow the player); Nightshade's call placed in the reading room, Torres' at the Harwick & Lowe boxes, Gary's at the tape-room keypad. The m10 slots are the m10 author's. | §11, §14 change 6 |
| 16 | The "who is Tesseract" sentence (m10's cold start) | Not m09's. m09's equivalent is Netherton's one sentence in the identity scene, which serves the m09 cold start; the briefing holds the name back (§14 change 1). | Beat 3.4 |

**Handed on, not settled here:** item 7 (the Recruiter's choice wording) and 25 (a later use for the Alpha tapes: Beat 3.3 gives the m09 end of it) to stage 3; item 1 (the night's UTC steps; the debrief's "twenty hours" depends on it) to stage 4; item 31 (lock order and placement) to stage 5.

## 13. Notes for later stages

**Stage 3 (moral choices).**
- Whether talk can stop Sorensen once the cage is open. Suggested lever: her vocation. She is a records keeper ordered to destroy records, and she does it because she believes in the man who ordered it. Showing her that his own server was left off the order (after flag 4) or that Torres is "closed" in her own hand might make her stop; it must not turn her (02 prompt: true believers don't flip). Stopping is not cooperation.
- The debrief's stance beat (§7.1 beat 3) is local. If stage 3 wants it in m10, it needs an export and a FINALE_ARC change.
- The briefing's raid-team answer (§8 #14) is deliberately light. Keep it light.

**Stage 4 (objectives and events).**
- Event triggers this arc needs: Nightshade's call on flag 1 (triple agent); the Recruiter's call on flag 2 plus the printed ledger read; HaX's quiet-stretch call on the deck choice plus leaving the room; Torres on opening the Harwick & Lowe boxes; Gary on the first keypad attempt; the identity scene on flag 3 plus Nightshade's file held; Tesseract's call on flag 4.
- The deck pull happens inside the Recruiter's call ink (HaX pulls it through the drop terminal); the ink sets `deck_pulled` and `recruiter_offer` with `#set_global`. No terminal walk-back.
- The debrief's "twenty hours" needs the night's UTC time fixed (§13 item 1).
- Music needs a cue that fades to near-silence for Tesseract's call; check the engine can do it with the existing playlists (`cutscene`, `noir`, `threat`, `spy-action`, `victory`, `end`) or needs a new one.

**Stage 5 (rooms).**
- Nightshade's plan chest must sit on the path before the tape room, so the identity scene's second condition is always met.
- The Reading lives in the open stacks under a dull label, so reading it takes the player back out of the office into the stacks: a breather between the safe and the tape room.
- The salvage cage opens off the tape room; Tomb Beta's enrolment binders are in it.
- The stamp sits on the hatch shelf; the card reel hangs within cloner range of the mesh.
- The Harwick & Lowe boxes are in the open stacks, findable without the cross-reference (they are just another client's boxes) and readable only with the file number.

**Stage 6 (lore).** New canon this arc assumes, each to be written up: stores' quarantine of Nightshade's crackers; Harwick & Lowe's dead files deposited at the archive; the purge order's omission of the tape room's rack; the Recruiter's grievance (the Architect took WREN off her books and burned her office); Sorensen's twenty years as a county clerk; the archive as a former grain warehouse.

**Stage 7 (ink).**
- The briefing spine is about twenty lines before the hub; the wall is eight short lines. Keep both tight (m08's briefing is nine lines; m02's spine is about twelve).
- The Reading is document text, unvoiced (stage 0 §6's "narrator voice or unvoiced": unvoiced chosen, because a document read aloud by the narrator would run long and every entry has branches).
- Tesseract is not voiced in m09. HaX's half of the call is voiced.
- Every branch line is a fixed string; no printed variables in voiced lines (FINALE_BRIEF).

## 14. Proposed FINALE_ARC changes

Not made: FINALE_ARC is shared with the m10 author. Each is a proposal for the orchestrator, with the place it would go and why.

1. **The briefing holds the name back** (row 57, §5.5 m09). Row 57's "who is Tesseract" beat becomes a "who is the suspect" beat: one of ours, once; no name until it can be proved (§3.1 beat 6). The name, and the one sentence on who he was (chief strategist, HaX's teacher, walked out seven years ago), land in the identity scene through Netherton (Beat 3.4). Why: saying the name in the first five minutes spends the reveal the mission is built to earn, for cold starts most of all, and it breaks Netherton's own pledge (row 125). m10's cold start (§4.0) is unaffected.
2. **Tomb Beta's server is left off the purge on purpose** (§1.2, §6.1). Add to §6.1: the purge order lists every series in the building except the tape room's rack, because the Architect wants SAFETYNET to read his credential, his Albion memo, the hour and the defences, and to come (§1.2's motive). Flag 4's HaX line says so, and his call confirms it. Why: it explains why the one machine holding the hour and the defences survives a purge he ordered, and it shows the player his motive before m10 states it.
3. **The Recruiter's opening on the sold-and-lied branch carries the offer** (row 61). She makes the receipt and the offer in one breath, so a player who hangs up has still heard it. Why: keeps "every player gets her offer" (row 60, D-09) true on the one branch where the player can end the call first.
4. **The deck pull is made inside the call** (row 60, §6.1 item 3). "The player can pull one from the drop terminal" becomes: the player tells HaX which tape, and she pulls it through the drop terminal while the call is still open. Why: the call can land anywhere in the building; one decision should not need a walk back to the reading room, and the choice stays forced by the call ending.
5. **Flag 4 carries the casualty sheet** (§6.1 flag 4 row; §1.2). Add "and his signed casualty projection, 1,100–2,600 in the first month" to what flag 4 yields. The briefing gives Analysis's lower guess, labelled as a guess. Why: stage 0 says the figure is "found tonight" but nothing in FINALE_ARC places it; flag 4 is where the Publication is explained, and it makes the 02 prompt's "moment of horror" a find.
6. **Phone voices in m09: one non-HaX voice per scene, and Torres moves** (row 64, §3.4 `sleeper_named`, §5.1 Torres). R3-01's one-voice rule is applied in m09 per scene, because calls follow the player. Torres rings when the player opens Harwick & Lowe's boxes (the cross-reference), not when they reach the ledger, so his call is not stacked on the ledger's reveal or the Recruiter's call. `sleeper_named`'s "a SAFETYNET personnel record in the archive" becomes "Harwick & Lowe's placement file, deposited in the archive's open stacks". Why: a commercial archive would not hold a SAFETYNET personnel record; it would hold a closed search firm's dead files, which also explains how the Initiative's front stayed hidden.
7. **Netherton is on the aircraft, and the debrief is in Helena** (row 125, §5.5 m09). He is on the line from the aircraft taking Task Force Null to Montana, not from the Citadel, and the debrief is in person in a hangar at Helena's airfield, with HaX on the line from the Citadel. Why: row 109 and §5.5 have him sign the Montana order in front of the player at the end of the same night.
8. **The Recruiter's reason** (row 60). Add: the Architect has taken WREN off the Initiative's books for his own use, and his purge order burns the Initiative's records office to protect the cells; she sells WREN out of grievance as much as for her file. Why: a cell leader selling a cell's plant needs a motive, and it shows ENTROPY's cells pulling against each other the night before the finale.
9. **The order names the Publication** (§1.3). The intercepted order reads "Burn Helena before the Publication"; nobody at SAFETYNET knows what that is until flag 4. Why: it gives the briefing a named threat (the 01 prompt's "name the operation") without explaining the plan before the mission finds it.
10. **The cracker** (rows 29, 118; §13 item 3). Add: after m08 stores quarantined every cracker Nightshade ever signed for; Kowalczyk's own is "never been through stores", which is true. Why: it gives the issue a reason in m09 and makes m10's serial clue land on a line the player heard.
11. **The raid team's suspicion beats** (§5.2 rows for Quintero, Malhotra, Arakawa; §13 item 4). One line each in their §5.2 rows, from §3.3 here, so the m10 author can call back to them. Why: R3-13 asked for them; they must agree in both missions.
