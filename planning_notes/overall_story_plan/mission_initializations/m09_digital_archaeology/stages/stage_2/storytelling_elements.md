# m09 Digital Archaeology: Stage 2, storytelling elements

Stage 2. Author: stages 1–2 author (Opus), 2026-10-21. Status: round 4 fixes folded in (outcomes in story arc §15–18).

Inputs: `../stage_1/story_arc.md` (beats are cited as "Beat 2.4" and so on), `../stage_0_initialization.md`, `../../../finale/FINALE_ARC.md` (§2 rows, §5 cast), `story_dev_prompts/02_storytelling_elements.md`, `story_design/universe_bible/04_characters/voice_bible.md` (it wins on every returning voice), `README_ink_best_practices.md`, the `npc-dialog-review` skill. The 02 prompt asks for three files (characters, atmosphere, dialogue); this finale keeps them as one document, as the stage layout gives one file per stage.

Sample lines show each voice. They are not the script: full ink is stage 7, and every sample is a candidate, not a commitment.

## 1. Rules for every line in m09

- **TV spy thriller.** People talk past each other, hold things back and say the short version. Nobody explains a concept to the player in dialogue; the VM and the field guides teach (FINALE_BRIEF). HaX states costs and lets them sit.
- **Fixed strings only in voiced lines.** Every branch is a whole sentence chosen by a condition, never a printed variable (FINALE_BRIEF; voice bible). That includes the wall's cards, the Recruiter's three openings and every Reading entry.
- **One non-HaX voice per scene** (story arc §11). No call lands on top of another speaker.
- **UTC only.** No line gives a local time or mentions dawn (FINALE_ARC §8 r8). Locals say "at this hour", not a clock time.
- **Violence brief, TV level.** A knock-out is a line; nobody describes an injury.
- **Players' lines** are first person, calm and short (voice bible, Agent 0x00). By m09 the player can push back on HaX and Netherton, and choice text can be blunt.
- **No exposition dumps.** The briefing is the only place with a run of facts, and it is a hub so the player picks the order. Anywhere else, if a line explains something the player can find, cut it.
- **The user's style rules** apply to dialogue too: no stock filler, no summing-up line at the end of a scene, no "it's not X, it's Y".

## 2. Returning characters

Voices follow the voice bible; this section says what each wants tonight, what they are hiding, and how m09 moves them. HaX has her own section (§4).

### Director Magnus Netherton

- **In m09:** the briefing (in person), the identity scene (on the line from the aircraft's forward cabin, door shut, where WREN can't hear), the debrief (in person, Helena).
- **Wants:** a name he can say in court, and to take four agents into Montana without telling one of them he knows.
- **Hiding:** from the moment flag 2 goes in, that all four of his team are under suspicion, and he has known every one of them for years. On the `owned` branch of m08 he is still carrying Nightshade's file and means to sign beside it.
- **Arc in m09:** the man who promised not to say a name, keeping the promise and then saying it, and then listening while HaX says what the delay cost. He says nothing to that; the silence is his m08 confession heard from the other side. His control cracks once, at the debrief: "He reads the first name off the card. He doesn't look down for the second."
- **Voice:** formal, few contractions, short declaratives, then a verdict. Dry about the institution once a mission at most. He does not mention the m08 knock-out (he said it would not be discussed).

> Director Magnus Netherton: Agent. Your leave is cancelled. I am sorry about that. I am not sorry enough to change it.
>
> Director Magnus Netherton: We read it. Then we let it go on. If it hadn't arrived, he would know.
>
> Director Magnus Netherton: I will not say the name in this room until we can prove it.
>
> Director Magnus Netherton: I said we wouldn't name him until we could prove it. We can. Dr Adrian Tesseract. *(row 125, fixed)*
>
> Director Magnus Netherton: He was our chief strategist until seven years ago. He trained half my field officers. *(he stops there; HaX says the rest)*
>
> Director Magnus Netherton: You sent it without asking me. I would have said yes. I would have taken a week to say it.
>
> Director Magnus Netherton: Then I sign for him too. *(at the pen; "About Albion, yes.")* / Good. Then he can make that argument in court, and lose it. *("No.")*
>
> Director Magnus Netherton: Warmer, next time. She notices. *(debrief, `sleeper_named`, after a flat reply to Kowalczyk)*

### The Recruiter (phone only)

- **Voice:** her m05 voice block, copied exactly (voice bible: Gacrux, en-US, educated DC; warm, patient, ruthless; people as placements).
- **Wants:** her file gone before SAFETYNET can read it, and something back from the Architect, who has taken WREN's tasking from her and is burning her records office.
- **Hiding:** how much she minds. She prices the loss and never says it is personal; the player hears it in the word "back".
- **Arc in m09:** one call. She arrives as the most composed voice in the mission and leaves having sold one of her own people, or having been refused by an agent she thought had a price. On `double_crossed` she learns later that 0x00 took the name and the file.
- **On the call:** she knows the player's designation, their kit, and (on the sold-and-lied branch) what they did in the spring. She never raises her voice and never threatens; she prices.

> The Recruiter: Agent 0x00. You're standing in my filing system. I thought it polite to ring. *(cold start)*
>
> The Recruiter: Last time I said the next one would cost me more. This is the next one. *(m05 finished without her deal: refused, or never offered terms; S-11)*
>
> The Recruiter: Forty-seven names, and nothing points at you. Does your handler know? I'd like to give you one more name, and I'd like you to keep this one too. *(sold and lied)*
>
> The Recruiter: Eleven years of placements, written off in a night for his schedule. I'd like something back on the books.
>
> The Recruiter: One of your four is mine. Was mine. He took her for Montana and didn't ask. I'll give you her name tonight, and all it costs you is a tape you've never heard of.
>
> The Recruiter: Take my name, and if anything else comes off that deck, I'll know before your plane does. Half my people will have moved by morning. *(the double-cross priced, before the choice; covers the deal only, R3-03)*
>
> The Recruiter: Then I'll tidy my own desk. *(refused: she wipes her file first and drops off, sure it's gone)*
>
> The Recruiter: Halina Kowalczyk. Her mother's care home has had my cheque every month for eleven years. She gave you something at the briefing, I expect. She's generous. It's how we hired her.
>
> The Recruiter: Then we'll both lose something tonight. I've had more practice. *(refused)*

### Agent 0x47 "Nightshade" (phone, triple-agent branch only)

- **Wants:** to be useful enough to stay out of a cell, and to know what the man who recruited him really thought of him.
- **Hiding:** that he is still deciding which way to tip (m10's door). He doesn't know about his own file yet.
- **Arc in m09:** a voice that competes with HaX for the line after flag 1, right about the cage, then silence until the player chooses whether to send him his file. If they do, one text back. If the player also saved the copy he sent ahead, the text knows it.
- **Voice:** collegial, precise, an image instead of jargon, the last line turned into a general truth. Serene. Since m08, a little more tired.

> Agent 0x47 'Nightshade': Agent 0x00. I'd ask how the leave was, but HaX would tell me to get off her line.
>
> Agent 0x47 'Nightshade': The cage reader takes a lifted print and thanks you for it. The badge reader is older. You know what to do with old.
>
> *(text, after the file)* Thank you. I'd rather not have known. No. That isn't true.
>
> *(text, after the file, with his copy saved)* You found what I cleared, too. Then you know I kept his letters. I'd have burned anything else.

### David Torres (phone, turned branch only)

- **Wants:** to finish his time as a live placement and see his wife's treatment through.
- **Hiding:** how frightened he is that the Initiative will read its own ledger more carefully than SAFETYNET has.
- **Arc in m09:** one call, at the Harwick & Lowe boxes, or on the walk to the office if the player never opens them. He is still in place, still a "live" line in Sorensen's book.
- **Voice:** soft, slow, light Castilian Spanish (voice bible, m05). A decent man who did a terrible thing.

> David Torres: I gave you this address in the spring. It was a line in a list.
>
> David Torres: I am still a live placement. Every morning I wake up and I am still a line in her book.
>
> David Torres: They pick people with someone to lose. Look for the ones with a sick parent. *(row 64, fixed)*

### Gary Whitlock (phone, protected branch only)

- **Wants:** to be useful to the agent who saved his career, and not to sound grateful while he does it.
- **Hiding:** nothing. He has a new title and has not got used to it.
- **Arc in m09:** one call at the tape room's keypad. The man who wrote seven warnings "for the archive" rings an agent standing in one.
- **Voice:** Birmingham and the Black Country, flat, tired, bitter jokes (voice bible, m02). Slightly less bitter now.

> Gary Whitlock: Director of Cyber Security, me. They gave me a lanyard with my name spelt right. That's how you know it's serious.
>
> Gary Whitlock: I audited a trust that ran that tape library. Their codes were in the shelf scheme. Read it like a shelf mark, not a number.
>
> Gary Whitlock: Seven warnings, I wrote. For the archive. Funny where you end up.

### The Architect (written register only)

He does not speak in m09. Tesseract's voice on the call to HaX is never heard (story arc Beat 3.6); she says afterwards that he called her "Ninety-nine". He is present in documents in two registers (§5): the formal, aphoristic hand of the Reading, the order and the casualty sheet; and, nine years younger, the plain civil-service prose of the Albion memo and his margin notes in HaX's training notebook. The Alpha tapes hold his teaching, in his voice; whether the player can play them is stage 3's decision (item 25, R2-S15), and no line promises they will hear him tonight.

### Derek Lawson (file only)

His file, in a bin at the cage. Written before Viral Dynamics hired him, it costs his fall in advance: "Expected loss of asset: total. Expected yield: one demonstration, and the agency's attention." On `surrender`, a standing order: if taken, put the device down and wait. On `expose`, a margin note that the coverage would do the recruiting. Saved, it is a second sample of the Architect's hand.

### Mentioned, not heard

Victoria Sterling (her protocols, or her keys on the lease file), Kemal Aydin (a line at the casualty sheet), Irina Volkova (an account that bought the deed), Danny Foster (a note in Zero Day's file), Graham Reeves (his handler's sheet, unvoiced), Voltage (a card). Each lands at the moment it helps or is found (§7).

## 3. New characters

Ages, backgrounds and names are FINALE_ARC §5.2's. The cast across m09 runs from 24 to 66, four women and four men among the new faces, white, Arab-American, Vietnamese-American, Crow, Mexican-American, Polish-British, British-Indian and Japanese-American. Accents below are suggestions for stage 9's voice picks; each must be checked against the voice bible so no two speakers in m09 share a Gemini voice.

### Margaret "Peg" Sorensen: the villain on site

66, white Montanan of Norwegian family, county clerk for Lewis and Clark County for twenty years, then director of Mountain States Records & Retention. Keeper of the Insider Threat Initiative's records.

- **Role in the cell:** the Initiative's archivist. She does not recruit and does not handle; she keeps the ledger true, costs each placement, and files what the Architect sends her, the Reading included. She wrote WREN's day-10 update herself.
- **Philosophy:** "People are records. I keep them." A record outlasts the person and can't lie about them; keeping it accurate is the only honest work there is. The world is decaying, and the decent thing is to write it down properly while it does. The Architect told her that once.
- **What she has calculated:** the cost of every placement and its yield. Torres: one hospital bill, and within an afternoon of the dispatch keys (S-19; m05's figure is Elena's $380,000 trial). WREN: eleven years' salary and a lateral hire's fees, expected yield one raid. She has never read the casualty sheet and would not flinch at it.
- **Wants tonight:** to finish the order. It is the first time in her life she has destroyed a record, and she is doing it properly, box by box, stamping each one "destroyed", against the schedule she annotated by room.
- **Secret:** she knows who WREN is, and is proud of the placement. She will not say the name: "I keep records. I don't read them aloud." The Recruiter will.
- **Voice:** Western American, unhurried, kind in tone, exact in content. Full sentences. Calls the player "dear" once, when she is being most dangerous. Never swears, never raises her voice, never hurries the shredder.
- **Arc:** the serene keeper at the hatch, the clerk who recognises the player from a file she filed, the woman who keeps shredding while the cage opens. Arrested, she asks for a pencil so she can write down what she destroyed, accurately. That request is the character; stage 7 adds no speech to her.

> Margaret Sorensen: The lease-holder's auditor. Of course. There's a chair on your side.
>
> Margaret Sorensen: You're not from the lease-holder. You're the one he writes about.
>
> Margaret Sorensen: Take the print if you like. By the time it matters, the shredder will have caught up.
>
> Margaret Sorensen: It's paper, dear. The people are where they've always been, at their desks, doing what they were placed to do. *(the confrontation, after the cage opens)*
>
> Margaret Sorensen: Paper was the only thing that could ever have hurt them. So the paper goes.
>
> Margaret Sorensen: Torres cost us one hospital bill, and he got us within an afternoon of a nation's dispatch keys. I'd call that good value. So would you, if you were honest.
>
> Margaret Sorensen: You'll want to know what I shredded. Give me a pencil. I'll write it down for you, accurately. *(arrested)*

**Her quote from the Reading at the hatch** (story arc Beat 2.1; W-10), one line per value of entry 1, in her words, said kindly:

| Entry 1 value | Sorensen |
|---|---|
| fight | Viral Dynamics. You put a man on the floor after you'd already won. I filed that in the spring. |
| arrest, or `""` with `m01_completed` | Viral Dynamics. You read Mr Lawson his rights, and he kept his promise and said nothing. He was always good about promises. |
| recruit | You offered Mr Lawson a job. It's in your file, you know. "A recruiter's instinct." |
| expose | You put Mr Lawson's figures in every newspaper. We had a very good month afterwards. |
| surrender | Mr Lawson put the device down for you. You still think you talked him into it. |
| never played m01 (cold start; uses entry 2's never-played form) | Your first days aren't in your file. Somebody at SAFETYNET is careful with you. |

**Evidence the player finds:** her hand on the ledger (WREN's update; Torres "closed" or "lost"); her destruction stamps on every empty box; her costing columns; her annotated schedule. Her guilt is on paper, which is the only kind she would accept.

### Noor Haddad: the clerk on the list

34, Lebanese-American, grew up in Dearborn, Michigan. Records clerk. One of the forty-seven, on a recruiting list she has never seen.

- **Wants:** to keep the job that pays for her father's dialysis back in Dearborn.
- **Secret:** last month Sorensen offered her an "after-hours filing bonus", cash, no paperwork, and she took it. She has wondered since how her boss knew about her father.
- **Voice:** quick, Midwestern, guarded, sardonic under pressure. Answers questions with questions when she is scared.
- **Arc:** by m05 (row 62). Warned in time: she has been waiting for SAFETYNET to turn up and is half relieved. Warned late: she gives the warning and keeps her card. Not warned: a wary bystander, until the player tells her what the bonus was. Shown her own line in the ledger, she asks the one question the scene is for.

> Noor Haddad: I file deeds for dead ranchers. Nobody recruits a records clerk.
>
> Noor Haddad: Peg's been in the cage since before I got here. She never feeds the shredder herself, and tonight she's sent me home twice.
>
> Noor Haddad: My dad's on dialysis in Dearborn. I never told her that. How did she know that?
>
> Noor Haddad: Was I going to say yes? Don't answer. I know I was.

### Jesse Tran: Social Fabric's man on the staff

29, Vietnamese-American, grew up in Seattle, the archive's IT contractor. Social Fabric's plant: the name Maya Chen's list would have flagged (row 6).

- **Role:** placed by Social Fabric to watch the Initiative's records, because ENTROPY's cells spy on each other. Tonight he runs the tape side's wipe for Sorensen.
- **Philosophy:** Social Fabric's: attention is the only currency and everyone has already sold theirs. Paper is for people who expect to be believed.
- **Secret:** he has been copying the Initiative's tapes for Social Fabric before wiping them. The letters in the cage's second bin are his trade route; a player holding them can talk him off the wipe.
- **Voice:** fast, ironic, contemptuous, very online. Talks to the player as a tourist, until they show him the letters.
- **Arc:** a smirk at a console, then a call for a guard (if he sees the player first), then a contractor asking for a lawyer, or a man doing sums about Social Fabric.

> Jesse Tran: Paper. You people break into buildings at night for paper.
>
> Jesse Tran: Derek wrote things down. Look how that went. I don't write things down. *(N-15: holds on every m01 value)*
>
> Jesse Tran: *(shown the letters)* ...Those weren't supposed to be on a trolley. Fine. It's off. I want that in writing.

### Cody Old Coyote: the guard

24, Apsáalooke (Crow), from Lodge Grass, Montana. Night guard, working nights to pay for a lineman's course in the spring. Innocent.

- **Wants:** a quiet shift, and to start the course: climbing power poles in weather for a living.
- **Secret:** for a week he has logged the shredder running at night in his incident book, and nobody has read it. The book is a find on his desk at the dock (the Gary rhyme: warnings written for nobody).
- **Voice:** easy, dry, a little bored, sharp when someone treats him as furniture. An ordinary young man; no mystic, no stoic. He has his sister on speaker for half the round.
- **Arc:** a torch on the fence. Talked past, he is a line in the debrief and nothing worse. Told the truth, he says he'll be in the truck with the heater on and didn't see anything. Knocked out, Netherton reads the cost.

> Cody Old Coyote: I'm paid to walk the fence. Nobody pays me to look in the cage.
>
> Cody Old Coyote: Lineman's course. Climbing poles in a blizzard. Poles don't make that noise all night.
>
> Cody Old Coyote: You're not the auditor. Auditors bring coffee. I'll be in the truck.

### The raid team (briefing, and the debrief)

Four officers the player meets once in m09 and goes into the bunker with in m10. Each is likeable for a different reason and gets one beat that looks bad later (story arc §3.3). The m10 author owns their m10 arcs.

**Agent 0x2D "Anchor", Marisol Quintero.** 52, Mexican-American, from El Paso. Raid leader on the ground. Steady, dry, few words, unsentimental about her people and fierce about them. Came to SAFETYNET eleven years ago as a lateral hire through Harwick & Lowe, as an honest candidate the firm placed for cover; her father is in residential care in El Paso. **Wants:** to bring everyone home from Montana. **Secret:** she doesn't trust the intercept. An order that falls into SAFETYNET's lap the night before the raid feels to her like something meant to be read, and she is half right. That is why she argued against tonight. On the shortlist, everything about her fits WREN except the truth.

> Agent 0x2D 'Anchor': One agent, no cover, in a building that's burning paper. If it goes wrong, I go into Montana a day late and one short.
>
> Agent 0x2D 'Anchor': Orders don't fall off couriers, Director.

**Agent 0x5E "Lantern", Halina Kowalczyk.** 47, Polish-British, grew up in Ealing. Breaching lead. Warm, funny, practical, the one joke in a tense room. **Wants (as WREN):** one thing, the key: to be the hand on it at the core (m10's design). She still reports to the Initiative and draws its money; since day 10 her orders come from the Architect. **Why** (W-08): her mother has been in residential care for eleven years, and the Initiative has paid for it for eleven years; one dull line on her Harwick & Lowe sheet says so ("Next of kin: mother, residential care"). m10 gets her reason without a speech. **Secret:** she is WREN. **Rule:** one double-edged line in m09, the cracker; everything she says is true.

> Agent 0x5E 'Lantern': Stores froze everything Nightshade ever signed for. This one's mine. Never been through stores, never been near him.
>
> Agent 0x5E 'Lantern': The long way's for people who get paid by the hour. *(after HaX's "The long way is over")*
>
> Agent 0x5E 'Lantern': Well? Did my toy earn its keep? *(the hangar, to the player's face; W-07)*

**Officer Dev Malhotra.** 33, British-Indian, from Hounslow. Comms officer. Precise and a little anxious about any gap in coverage; jokes only about kit. **Wants:** every line covered. **Secret:** none tonight. (His badge is cloned in m10.)

> Officer Dev Malhotra: If something goes wrong in there, I'd like to hear it go wrong.

**Officer Kenji Arakawa.** 41, Japanese-American, from Sacramento; the team's US liaison. Courteous, laconic, a fixer. **Wants:** no American agency asking awkward questions until it's over. **Secret:** none tonight.

> Officer Kenji Arakawa: I've asked Helena PD to keep their cars off that side of town tonight. Nobody asked who for. Nobody will.

### Agent 0x19 Callum Fraser and Agent 0x6B Ana Lúcia Ferreira

Named only: 31, Scottish, and 38, Brazilian; killed at the two m07 sites the one team could not reach. Their cards are on the wall with photographs and no outcome. HaX names them in her confession (she had the name the night they died), and Netherton reads them before he signs the Montana order. Never seen, and voiced only by those two.

## 4. HaX in m09

### 4.1 Where she starts

m08 left her close to coming apart: a friend unmasked as the mole, and a text sent after midnight, "Same classroom, 0x00. Don't ask me whose yet." She has had one day off and did not take it. She knows the name, has known since m06, and has told nobody she is certain. She also knows what m08's debrief taught everyone to count: two agents died at Portland while the name was in her drawer.

**Her want:** to be wrong. Failing that, to be the one who proves it, so nobody else has to tell her.
**Her secret:** she has known since the fund's file (or since she gave the player his name after HashChain and called it Satoshi's guess), and she kept it because he was hers. Her old training notebook, with his margin notes, is in the case file she built for tonight.
**Her rule tonight:** be very professional. It holds until flag 3, with two cracks she closes at once: "That's his pen." at the plan chest, and three words after the deck.

### 4.2 Her state, act by act

| Part | State | How it shows |
|---|---|---|
| Briefing | Composed, in person, clipped. Avoids Netherton's eye at the "-- A." | Picks up the "Same classroom" text and goes no further. Walks the wall fast, like someone who has rehearsed it. |
| Act 1 | Working. Dry, quick, the m01–m07 handler. | Fact-first lines, one joke at most. |
| Act 2, the cage | Unsettled by Sorensen's file on the player, steadier for having something to be angry about. | "...She's got a file on you." Then short, practical help. |
| Act 2, the plan chest | The first crack. | "Those are my notes. That's his pen." Then "Hold that." and nothing more. |
| Act 2, flag 2 | Cold. One of four people she has worked beside is WREN. | Says it once, then the rule: "neither will you." |
| Act 2, the call | Sharp and protective. On the sold-and-lied branch, hurt, and holding it. | Cuts the Recruiter off on the confessed branch; on the lied branch asks once, later, and lets it lie. Names the tapes' stakes, including the one that is personal to her ("His voice. Teaching."). |
| Act 2, after the deck | The second crack, three words long. | "Afterwards. Not during." and one sentence; then, unasked, "The rest when this is over." |
| Act 3, the Reading | Silent while it is open. | Asks once afterwards. Doesn't push. |
| Act 3, flag 3 | The one time she opens up. | Reads the credential's first line and stops. Lets Netherton say the name. Then the confession, and the two dead, with Netherton listening. The longest thing she says all season. |
| Act 3, flag 4 | Back at work, because the number demands it. | Reads the casualty range in full and doesn't round it. Asks the question nobody answers: "Then why build a key at all?" |
| The call | Her teacher on the line. | Short answers, one refusal of "Ninety-nine" ("It's HaX. It has been for seven years."), "I'll bring them." Then she reports it like any intercept, and her voice gives on the last sentence. |
| Debrief | On the line from the Citadel, already packing. | One line by the player's answer to her confession. |

### 4.3 Sample lines

Briefing and Act 1:

> Agent HaX: Keep not asking. By morning you won't need to. *(m08 played, text sent)*
>
> Agent HaX: You put me on the floor at the Citadel. I'm still running you. *(m08 `hax_ko`)*
>
> Agent HaX: You heard me say it after HashChain. I called it his guess. *(m06 name found; the admission waits for the tape room, R2-S06)*
>
> Agent HaX: That noise is a cross-cut shredder. It's been running since before you landed.
>
> Agent HaX: Night guard. Twenty-four. Not ours, not theirs. Don't hurt him.

Act 2:

> Agent HaX: Bin by the hatch is Derek Lawson's file, and it isn't Derek's handwriting on it. It's the only place anyone wrote down why he did what he did. The other's the Social Fabric letters, Tran's whole trade. One of them's ash in a minute.
>
> Agent HaX: ...She's got a file on you.
>
> Agent HaX: Those are my notes. That's his pen. *(beat)* Hold that. I want it from two directions before anyone says a word.
>
> Agent HaX: Montana operation. Day ten. That's one of the four you met at the briefing.
>
> Agent HaX: I've told the Director. He'll say nothing to them. Neither will you.
>
> Agent HaX: We've talked about that. She has nothing on you. *(m05 sold and confessed)*
>
> Agent HaX: Her file is her network, all of it. The Alpha tapes are him teaching, recorded. He teaches what he'll do. If he built the bunker the way he taught it, it's on there.
>
> Agent HaX: She thinks it's gone. Let her. *(refused or hung up, pulling her file a second ahead of the wipe; R4-06)*
>
> Agent HaX: She fired it from Peg's office. I'm on the door. *(after the deck choice; the office opens)*
>
> Agent HaX: Take her name and her file, and she warns them. We'd get half. *(if the player asks about both)*

After the deck (Beat 2.7; W-03):

> Agent HaX: Derek's file is gone. So is her list. *(by what was lost; one line, fixed strings)*
>
> Agent HaX: Afterwards. Not during.
>
> Agent HaX: It's yours to carry. Nobody else signed for it.
>
> Agent HaX: The rest when this is over. Her office is past the binders. *(said unasked, Beat 2.7's last line; R3-06)*

The confession (Beat 3.3), the opening of each form, then the line every form reaches:

> Agent HaX: I told you on the handset he taught me. I gave you his name after HashChain and called it Satoshi's guess. It was mine as well. *(m06 name found, teacher discussed)*
>
> Agent HaX: I gave you his name after HashChain and called it Satoshi's guess. I've been hoping ever since that it was only his. *(m06 name found)*
>
> Agent HaX: I told you somebody taught me that line. I didn't say who. "Keep it out of your notes" was me keeping it out of mine. *(m06 name not found, teacher discussed)*
>
> Agent HaX: There was a file on a crypto fund, with his name in it at eighty-seven per cent. I put it in a drawer. He trained me. I wanted the other thirteen. *(neither)*
>
> Agent HaX: You heard him say it in Portland. My line. His line. *(before her form's first sentence, never in place of it, on `m07_architect_echo_heard`; else "You've read him before. Sterling's drive." on `m03_directive_decoded`; R3-05)*
>
> Agent HaX: Two cards on that wall. I had his name the night they died. I don't know if saying it would have saved them. I didn't say it. *(every form; Netherton says nothing)*

Her replies to the player's answer:

> Agent HaX: Yes. I should have. You get all of it from now on. His box first. *(should have told / taken it to Netherton)*
>
> Agent HaX: Don't be kind about it. *(beat)* Thank you. Once. *(same in your place / sat on it too)*
>
> Agent HaX: ...That's mine. You don't get to use it on me. *(beat)* Thank you. *("Afterwards. Not during."; `afterwards`)*

If the player told her the Reading's line about her (N-05):

> Agent HaX: He wrote that I'd cover for you. He'd know. He taught me. *(should have told)*
>
> Agent HaX: He says I'll cover for you. Tonight it went the other way. *(same in your place)*
>
> Agent HaX: He says I'll cover for you. We'll find out afterwards which of us needed it. *(afterwards)*

Act 3:

> Agent HaX: One thousand one hundred to two thousand six hundred. The first month. He's signed it.
>
> Agent HaX: He's giving it away. At six it starts going out, city by city. Turn that key and it goes everywhere in the same minute.
>
> Agent HaX: Then why build a key at all?
>
> Agent HaX: His file first. Then the rest of his box. *(flag 4 in before the identity scene is done; R3-08)*
>
> Agent HaX: Finish with me first. Then his box. *(the same, to a player who already holds the file; R4-04)*
>
> Agent HaX: No. It isn't. He shredded everyone but himself. *(on `schedule_read`, after "Her schedule. This room isn't on it.")*
>
> Agent HaX: Nobody's wiping this box. Not her, not him. *(without `schedule_read`)*

The call, her side only (Beat 3.6; W-11):

> Agent HaX: ...Yes. *(beat)* I know it's you. *(beat)* Nobody's called me that since the course. It's HaX. It has been for seven years. *(long beat)* ...I'll bring them.
>
> Agent HaX: He called me Ninety-nine. He says the door will open for you by name. He says take your time getting there. *(beat)* And he asked if we'd liked his notes.

### 4.4 Her hub tonight

A `support_hub` in the phone ink (the m02 and m08 pattern), newest topics first, each gated on a progress global and asked once, with field-guide offers gated `_guide_offered` / `_hint_given` per VM stage (stage 0 §6). Topics in story order: the building's people and Tran (Act 1, by m01 branch); the restricted series (after flag 1); the bins (at the cage, once); WREN and the cross-reference nudge (after flag 2), with the Torres line on `m05_torres_turned`; the Recruiter's file and the tapes, before the player answers her; the Recruiter, after the call; "Afterwards" (after the deck, for a player who closed the call early); the name (after flag 3); the notice (after flag 3, once: "It's on his box. It isn't my call."); what the purge cost (once, after the deck).

No topic lectures. Every answer is the next thing to do, or the cost of a thing, said once.

## 5. The documents' voices

m09 is a mission the player reads. The documents carry the reveals, so each needs its own voice. All are object text; none is voiced, except where a character reads a line aloud.

### 5.1 The Architect's hand, now

Formal, short, aphoristic, third person about the agent ("they"). No thermodynamics read aloud; the formula sign-off is allowed on paper. Signed "-- A.".

**The purge order** (the briefing):

> Burn Helena before the Publication. Schedule attached. -- A.

SAFETYNET read it and let it go on (story arc §3.1). The schedule is §5.3's.

**The Reading** (Beat 3.1). A thin file. Each entry is a heading (the operation) and one or two sentences. Fixed strings by value; the never-played form is first-class writing, not a placeholder.

| Entry | Value | Text (draft) |
|---|---|---|
| 1. Viral Dynamics (`m01_final_choice`) | fight | They put Lawson on the floor when the argument was already won. Force first. Noted. |
| | arrest, or `""` with `m01_completed` | They read Lawson his rights. He kept his promise to me and said nothing. |
| | recruit | They offered Lawson a deal. A recruiter's instinct. They should be careful whom they show it to. |
| | expose | They put Lawson's figures on every front page, and did a month of my recruiting for me. |
| | surrender | Lawson put the device down for them, as instructed. They believe they persuaded him. |
| | never played | Lawson was arrested and kept his promise to me. Their file does not say who arrested him. |
| 2. The innocents (first match wins: `m02_patient_assaulted`; then a first-day KO with `m01_completed`; then clean with `m01_completed`; else never played) | a first-day KO (`m01_kevin_ko`, `m01_sarah_ko` or `m01_maya_ko`) | On their first day they put a bystander on the floor. They will have told themselves it was necessary. |
| | `m02_patient_assaulted` | They struck a patient on a ward. I have read the ward's notes. So, I expect, have they. |
| | clean | Not one bystander hurt on their first day. Rare. It will not last. |
| | never played m01 | Their first days are not in my file. Someone at SAFETYNET is careful with them. |
| 3. Albion (`m04_disclosure_choice`) | full | They told the inquiry everything, and every site was audited. My lesson, delivered by them. They do not know it yet. |
| | partial | They told half. Half is how we arrived here. |
| | quiet | They buried it. They understand me better than they admit. |
| | `""` or never played | Their report went upstairs and no further. I will not guess what it said. |
| 4. Portland (`m07_debrief_stance`) | defended | "I'd make it again." They would. I have counted on it. |
| | owned | They said it was theirs. They will carry this too. |
| | refused | "Don't ask me to rank them." I ranked them for them. |
| | hardened | They asked for the numbers. Good. I keep numbers. |
| | `""` or never played | One team, four sites. They sent it where they were told. Obedience or trust. I will learn which. |

(Entries 1, 3 and 4 echo the lines Tesseract says aloud in m10, rows 1, 48 and 99, so a player who read the file hears it in his mouth. Stage 7 keeps the echo and avoids word-for-word repeats.)

**The last page:**

> When the hour comes, they will be in the room and the key will be in reach. They will press it. I will not need to ask. They will have read this far and found nothing here that is untrue.

**On the same page, below** (W-13), one line about HaX, which the player can pass on to her before her confession or keep:

> Their handler will cover for them. She was taught to.

**The casualty sheet** (flag 4's files):

> Projected deaths attributable to the Publication, first thirty days. Release by key, all cities: 1,100 to 2,600. Fallback by city: fewer, later. Principal causes: hospital systems (dispatch, infusion, records); grid control; water treatment. Assumes the cells move first. An acceptable price for the last arms race. -- A.

(R3-12: the sheet prices the key, so "Then why build a key at all?" points at a choice he made on paper.)

This is his original sheet; the correction that shows his model double-counts is m10's (FINALE_ARC §4.1).

**The release key** (flag 4's mirror job), one line of the job's configuration, rendered plainly as object text:

> Release: manual, at console. Single key. Requires an operator present. Fallback: 06:00, staged by city.

### 5.2 The Architect's hand, nine years ago

The Albion papers (Beat 3.4) are the first time the player hears the man before ENTROPY. Plain civil-service prose, first person, reasonable and humane. The contrast is the point: he was right, and he lost.

**The catalogue entry:** a vulnerability in the control equipment at Albion's plant; a reference number; "Disposition: retain. Operational value." Initialled by the board, not by him.

**His memo** (to the disposition board, nine years ago):

> We are holding a flaw in the control equipment of a grid battery site because it may one day be useful to us. It will certainly one day be useful to someone else.
>
> I recommend notification to the vendor within thirty days. I have drafted the notice. I would rather send it than explain later why we didn't.

**The notice** (drafted, never sent): a standard coordinated-disclosure letter to the vendor, with a ninety-day date. Plain and courteous. The only personal touch is the sign-off, which is his name and title, typed. Sending it in m09 sends this text unchanged, nine years late.

### 5.3 Other people's paper

| Document | Voice | Sample |
|---|---|---|
| The ledger (flag 2; the printed binder) | Sorensen's columns: codename, source, placed, status, cost, notes. Her hand on the updates. | WREN. Legacy (H&L). Placed eleven years. Status: live. Day 10: assigned TF Null, Montana operation. M.S. |
| Nightshade's recruitment file | Tesseract's hand, fifteen years ago, kind and clinical in the same sentence. | Twenty-three. Idealistic, tired already. Will wait if asked properly. Ask properly. |
| Derek Lawson's file | The same hand, before Viral Dynamics. | Expected loss of asset: total. Expected yield: one demonstration, and the agency's attention. |
| Harwick & Lowe placing sheet | An executive search firm's file, dull on purpose. Two candidates, same quarter, same client. | Candidates: H. Kowalczyk; M. Quintero. Lateral, private sector. Client: government (UK). Both placed. Next of kin: mother, residential care (Kowalczyk); father, residential care (Quintero). |
| The master destruction schedule (Sorensen's safe) | The order's attachment: series by number, and her planning pass down the margin from before the night, a room per line, its series checked against the order and ticked as covered (R3-07). | Dock ✓. Front desk ✓. Reading room ✓. Open stacks ✓. Cage ✓. Closet ✓. Office ✓. Tape room (no series, no tick). In the margin: "Reading (safe); plan chest: not listed. Keep?" Reading the page sets `schedule_read`. |
| HaX's training notebook (scanned, case file) | A student's notes, fifteen-odd years old, in her hand; his margin notes in another. | Her: "Disclosure: who does it serve?" His, beside it: "Ask who it hurts first. Then ask again afterwards." |
| Tomb Alpha's tapes (if pulled) | Recordings of his teaching at the first workshop, with typed annotation sheets in his hand. | The decode of one sheet gives the line HaX recognises. What the recordings are used for is stage 3's (item 25). |
| Old Coyote's incident book | Block capitals, short entries, unanswered. | SHREDDER RUNNING AGAIN. MRS S SAYS SCHEDULED. NOTED. |
| The refit ledger | An accountant's. | One line on `m02_paid_ransom`: a receipt dated the day St. Catherine's paid. |
| Noor's trolley list | A destruction schedule, series numbers only. | R-114 through R-161. Destroy. Certificate to follow. |

## 6. Atmosphere and music

### 6.1 The building

Mountain States Records & Retention: a grain warehouse on the edge of Helena, converted forty years ago, with the old elevator's bones still in the roof. Cold, dry air for the paper. Sodium light outside, motion-sensor strips in the stacks that come on one bay at a time as the player walks, so the dark is always just ahead. The cage is lit hard white, like a shop counter. The reading room is the only warm room: green-shaded lamps and a radiator that knocks. Sorensen's office smells of a kettle. The tape room is blue standby LEDs and the hiss of a server's fans, the only machine in the building that is warm.

**The shredder is the night's heartbeat.** It is heard from the loading dock, louder in the open stacks, and deafening at the cage. When Sorensen is stopped, it stops, and the silence is the player's reward. When the deck wipe runs, the tape side has its own sound: the whine of a degausser. Stage 9 checks whether the engine can play a room's ambient sound on an event; if not, the narrator carries it in one line per act and HaX mentions it once.

The player's own file is in the building, and the building should feel like it: rows of other people's lives in boxes, labelled and costed.

Lighting is for the room-lighting skill after dressing; these notes are its brief.

### 6.2 Music by act

The existing playlists are `cutscene`, `noir`, `threat`, `spy-action`, `victory` and `end` (from the shipped missions' `music` blocks). Event-driven, as m01, m02 and m08 do it.

| Moment | Playlist | Why |
|---|---|---|
| Briefing | `cutscene` | The usual handover into a mission. |
| Act 1, from the loading dock | `noir` | A tense investigation, under the shredder. |
| Any hostile (Tran's guard; Tran himself if fought) | `threat` | As in every mission. Sorensen is non-combat and never triggers it. |
| Back to the search after a hostile is down | `noir` | |
| The Recruiter's call | `noir`, faded low | Her voice should be the loudest thing in the room. |
| "Afterwards. Not during." (Beat 2.7) | `noir`, low | Three words and a breath. |
| The Reading, while open | music held low, or silence | The player reads alone. |
| The identity scene | `cutscene` | A held cue: the scene stops the night. |
| Flag 4, the casualty sheet and the key | `noir`, dropped low (S-23) | `threat` means a hostile in every shipped mission; here the threat is a number. |
| Tesseract's call to HaX | fade to near-silence | Only her side and the server fans. |
| The debrief | `cutscene`, then `victory` on the pen | The release, with the dread carried forward. |

If the engine can't hold silence, stage 4 proposes either a new near-silent playlist or a long fade, and asks the user before adding a track.

### 6.3 What each act should feel like

- **Briefing:** a room of people who know something is wrong and aren't saying it. The wall is a montage of the player's own season.
- **Act 1:** a burglary in a library. Quiet, careful, the clock audible through the wall.
- **Act 2:** a race against someone who isn't hurrying. Sorensen's calm is the threat; the Recruiter's warmth is worse. Flag 2 puts the enemy in the briefing room.
- **Act 3:** a reader finding their own name in the margins. Slower, colder, then the worst number of the season and a phone call the player only half hears.
- **Debrief:** floodlights and a signature. Relief that the night is over, and the knowledge that it's the smaller of the two.

## 7. How each carry-over lands

The user's rule: the player should feel earlier choices as things happening (who turns up, who helps, what's said to them), never as a debrief roll-call. Each of FINALE_ARC §3.1's 43 imports is placed below at the moment it lands, with what it should feel like there. Most land once. Where several could land in one scene, the scene takes at most two (the briefing hub, the identity scene) and the rest move to the moment they help.

### 7.1 Tier 1: imports that change a room or a scene

| Import | Moment | What happens | How it should feel |
|---|---|---|---|
| `m06_architect_identity_found` | briefing; identity scene | HaX's aside at the "-- A." card; which confession form plays | A secret between the player and HaX, kept one more night, then paid for. |
| `m07_teacher_discussed` | identity scene | where HaX's confession starts | The player was nearer the truth than they knew; she admits she steered them off it. |
| `m07_architect_echo_heard` | identity scene | HaX's first line: "You heard him say it in Portland. My line. His line." | The voice on the m07 handset gets a face. |
| `m08_nightshade_triple_agent` | Act 1 (flag 1); plan chest | Nightshade on the line, right about the cage; the choice to send him his file | Uneasy usefulness: the player kept him in play, and here he is, helping, and competing with HaX. |
| `m08_nightshade_arrested` | the m08 wall card | Netherton's visit: "He said you'd know where to find him. He meant the door." | A promise of a scene to come. |
| `m08_nightshade_ko_before_fate` | briefing | HaX sent no text, so her opening is plain; on the no-coordinate branch (`m08_completed and not m08_tomb_gamma_location_known`), Netherton: "We have Helena. Not the bunker. Not yet." | The cost of the knock-out: a missing coordinate, said plainly. |
| `m08_tomb_gamma_location_known` | briefing; the lease file | the deed confirms the coordinate, or (no-coordinate branch) finds the bunker | Confirmation, or the relief of finding the address the player cost them. |
| `m05_recruiter_deal_accepted` | the Recruiter's call | her opening with the receipt and the offer; own it or hang up (the deck pull survives a hang-up) | The spring's secret ringing the player's phone with their handler listening. |
| `m05_recruiter_deal_confessed` | the call; Noor | HaX cuts the Recruiter off; Noor's late warning | The confession bought something: the leverage dies on the line. |
| `m05_found_pipeline_list` | Noor, front desk | warned in time: the warning and her card | SAFETYNET reached her first because the player kept the list. A stranger's job saved. |
| `m05_torres_turned` | Harwick & Lowe boxes, or the walk to the office | Torres rings from his desk; one step off the search; the sick-parent line; "I gave you this address in the spring." | The man the player turned is still in there, and still frightened. |
| `m05_final_choice` | ledger (flag 2); wall card | Torres' entry: live, "lost", or "closed placement" in Sorensen's hand | On `combat_lethal`, HaX's silence does the work. |
| `m03_victoria_fate` | the cage; the lease file | recruited: her protocols read Sorensen's mail, a second way into the cage; arrested or KO: her keys (or seized devices) opened Zero Day's client list, and this lease was on it | The asset the player turned is used, at last, on screen. |
| `m02_gary_protected` | tape-room keypad | Gary rings with the decode hint | The man who wrote warnings "for the archive" rings an agent standing in one. A small, warm call in a cold room. |
| `m01_maya_ko` | loading dock; the main-path radio after flag 1; server closet | HaX's Tran warning (or its absence), Tran radioing Old Coyote toward the reading room, an extra guard at the closet | Day one's cost arrives eight missions late, as a surprise in a doorway. |
| `m06_monitoring_enabled` | briefing (how the order was caught, unless Calder Wharf was); drop terminal | "Your tags lit up last night"; the tagged payments object | The player's tags did the catching. |
| `m02_insider_asset_arrested` / `m02_reeves_fate` | ledger shelf | in custody (`arrested`, `ko`, `flagged`, or the read rule): his handler's contact sheet clipped in the binder, an object with no voiced line (W-23) | A loose end from St. Catherine's pulled tight in passing. At large: nothing in m09 (he is on m10's rota). |
| `m08_nightshade_tidied` | the cage | the second bin holds what he cleared from his locker | "So that's what he had time to clear." A small, satisfying find, and the price of saving it is Derek's file. |

### 7.2 Tier 2: lines

| Import | Moment | The line or text |
|---|---|---|
| `m01_final_choice` | wall card; Derek's bin; the Reading entry 1 | his outcome; his file's margin by value; the entry |
| `m01_kevin_ko`, `m01_sarah_ko` | the Reading entry 2 | the first-day line |
| `m02_patient_assaulted` | the Reading entry 2 | "They struck a patient on a ward." |
| `m02_exposed_hospital`, `m02_ghost_deal_accepted` | wall card | the hospital's cover-up and the deal, in one line |
| `m02_paid_ransom` | the refit ledger | "St. Catherine's money. It bought the blast door." |
| `m03_danny_fate`, `m03_danny_ko` | the lease file (Zero Day's note on him) | by row 36: "Danny's statement just became evidence." / "loose end, resolved", then relief that he is alive / Danny's unanswered question on the two branches / nothing on KO |
| `m03_directive_decoded` | identity scene | HaX: "You've read him before. Sterling's drive." (style, not handwriting; only if `m07_architect_echo_heard` is false) |
| `m04_disclosure_choice` | wall card; the Reading entry 3; the Albion papers | the choice lands twice in one night: his reading of it, then SAFETYNET's own nine years of silence |
| `m04_voltage_captured`, `m04_voltage_escaped` | wall card | Voltage in custody, or gone |
| `m04_lore_safehouse_address_found` | briefing, how the order was caught | "Your card from Albion. Task Force Null went in yesterday. It held a courier account, and this was on it." |
| `m06_irina_recruited` | the lease file | "Irina's account paid for this. Tell her it bought us the deed." |
| `m06_minder_walked` | the casualty sheet (flag 4) | "Kemal Aydin walked out on a smaller number than this." |
| `m07_team_assignment`, `m07_team_redirected` | wall card; briefing stakes | where the team went; "Day eleven. Eleven counties."; the Meltdown hospital line |
| `m07_debrief_stance` | the Reading entry 4 | the player's own words quoted back |
| `m07_found_tomb_gamma` | ledger (flag 2) | "'Including the people.' This is the people." |
| `m08_debrief_stance` | debrief | his name beside Nightshade's, or a thank-you he doesn't explain |
| `m08_netherton_ko`, `m08_netherton_hostile` | briefing, cold open | Narrator: Netherton takes the chair furthest from yours. Nobody mentions why. (W-15: he said in m08 it would not be discussed.) |
| `m08_hax_ko` | briefing | "You put me on the floor at the Citadel. I'm still running you." |

### 7.3 The `completed` imports

`m01_completed` … `m08_completed` decide between a played line and the never-played line on every card and every at-large or penalising value (FINALE_ARC §3). The never-played line is never "you didn't play this"; it is the canon, said as history.

### 7.4 What stays out of m09

m10's slot people (Ghost, Voltage in person, Vance, Elena, Mercer, Hollis, Vector, Phantom) do not appear in m09 beyond a wall card. Their payoffs are m10's, and pre-empting them would thin the bunker.

## 8. Pacing and tension

**Two kinds of pressure, alternating.** The purge is outside pressure: visible, audible, moving on story events. The reveals are inside pressure: the player's own file, WREN on the team, a handler's secret. The mission alternates them: the cage (outside) → Sorensen's quote (inside) → the hand on Nightshade's file (inside) → flag 2 (inside) → the deck (outside) → three words from HaX (rest) → the Reading (inside) → the tape room (outside, a lock) → the name and its cost (inside) → the casualty sheet and the key (both).

**The purge must feel like a clock without being one.** It never moves on minutes (FINALE_ARC §8 r7). It feels like a clock because the shredder is always audible, Noor's trolleys empty as the night goes on, HaX names what is in each bin and what it buys before the choice, and names what was lost once, afterwards. A slow player loses nothing they didn't choose.

**Rests.** Two deliberate ones: the reading room after flag 1 (setting up, Nightshade if present), and the walk to Sorensen's office after the deck, which carries HaX's three words. Each is short. Act 3 has no walk-backs now (story arc §2), so its rest is the Reading itself, read in a quiet office.

**HaX opens up once** (W-03). Her two cracks before flag 3 ("That's his pen." and "Afterwards. Not during.") are each closed in the same breath. The confession is the only place she says more than a few lines about herself, and it is where the two dead and Netherton's silence land. Nothing she says earlier may pre-empt it.

**Spikes, and how each is built.**

| Spike | Built by | Released by |
|---|---|---|
| Sorensen quotes the Reading | the auditor bluff going well; her kindness | the bin choice: the player gets to act |
| "That's his pen." | the scanned notebook nobody mentioned (Beat 1.3) | "Hold that." The release is withheld until flag 3 |
| WREN on the raid team | the briefing's four faces, each given a line | HaX's rule ("neither will you"), then the Recruiter ringing, which turns dread into a decision |
| The Recruiter's offer | her warmth and her grievance; HaX pricing both tapes, one of them personal to her | the wipe: if the player makes no choice, nothing is pulled |
| The name | the hand on Nightshade's file and HaX's notebook; HaX stopping before the name | Netherton saying it, then his silence while HaX says what it cost |
| The casualty sheet and the key | the briefing's lower guess | none inside m09: "Then why build a key at all?" is carried into m10 |
| The call | silence | HaX's report of it, cracking on the last sentence |
| Kowalczyk in the hangar | the player knowing, or half knowing | none: she grins and goes back to the ramp |

**Choices under pressure, not in a menu.** Both purge choices are forced by an event and priced by HaX first. The confession answer comes at the highest emotional point of the mission, which is why it has few answers and none is wrong.

**Don't flatten the end.** After flag 4 the player has done everything. The call and the debrief are about five minutes together; nothing new to do, only the weight of what they found. Resist adding a last task.

## 9. Notes for stage 7

- **Speaker prefixes.** New: `Margaret Sorensen`, `Noor Haddad`, `Jesse Tran`, `Cody Old Coyote`, `Agent 0x2D 'Anchor'`, `Agent 0x5E 'Lantern'`, `Officer Dev Malhotra`, `Officer Kenji Arakawa`. Returning prefixes exactly as the voice bible gives them (`Agent HaX`, `Director Magnus Netherton`, `Agent 0x47 'Nightshade'`, `The Recruiter`, `David Torres`, `Gary Whitlock`). Each must match an NPC `id` or `displayName` (`README_ink_best_practices.md`).
- **Voice bible entries first.** Add an m09 table to the voice bible's one-mission section before any line is voiced: Sorensen, Noor, Tran, Old Coyote, and the four raid officers (who return in m10, so they may belong under "canon characters" instead; the orchestrator decides with the m10 author).
- **HaX's phone texts** carry no prefix (the m08 hub pattern); her calls and in-person lines do.
- **The Recruiter's call** is the mission's most important ink. Write the three openings and the spine as one knot structure with the offer reachable on every branch, including the hang-up (story arc Beat 2.4; §14 change 3).
- **The confession** has four openings, one shared line that reaches the wall (the two dead, Netherton silent), and three answers. Keep each form to about six lines before the choice. Her reply is two lines at most.
- **The wall** is eight cards, one fixed line per value, plus never-played lines. It is the one place a list of carry-overs is allowed, because it is a "previously on" and the player is watching a montage.
- **`npc-dialog-review` checks to plan for now:** the Recruiter's offer must change something the player can see (it does: `sleeper_named`, the debrief, m10); the raid-team answer pays back where it hurts (the Recruiter's name, the shortlist); the debrief's stance beat is paid back in Netherton's reply; the two purge choices each buy something later in m09; every knock-out leaves a scene coherent (Sorensen, Noor, Tran, Old Coyote).
- **Never in a voiced line:** a local time, a printed variable, the word "plant" for WREN (FINALE_ARC R3-10), a description of an injury.
