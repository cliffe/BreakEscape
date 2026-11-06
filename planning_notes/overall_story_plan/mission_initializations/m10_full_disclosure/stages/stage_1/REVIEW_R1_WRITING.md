# m10 Full Disclosure: stages 1–2, review round 1 (writing and drama)

## Scope and lens

Fresh read-only reviewer, 2026-10-21. Read: `docs/agents/FINALE_BRIEF.md`, `.claude/skills/npc-dialog-review/SKILL.md`, `README_ink_best_practices.md`, story_dev_prompts `01` and `02`, then `stage_1/story_arc.md` ("arc") and `stage_2/storytelling_elements.md` ("SE"). Compared against shipped ink: m07 `m07_architect_comms.ink` and `m07_closing_debrief.ink`, m02 `m02_phone_ghost.ink`, m08's Netherton "signature" and Nightshade lines, and the m01 briefing. No VM or SecGen material was opened.

The lens is the writing and the drama: is this the last episode of a TV spy thriller? Structural solvability, globals and wiring belong to other reviewers and appear here only where they hurt the drama. Line references are `file:line`.

## What works

These are worth protecting through revision.

- **The offer.** "It has to be one of you. If I press it, it's a crime. If you press it, it's a confession." (SE:99). This is the best line in either file. It states his motive, the trap and the Join ending in eleven words.
- **"Not you, Halina. You're mine."** (SE:187). It is the right idea: the one time the player hears his motive from his own mouth. Its logic needs one fix (W6).
- **The gallery.** HaX jammed, no music, the top of a grey head through a slit window, and "EARLY ACCESS: RELEASED" crossing a screen with no voice to read it (arc:323–325). This is the strongest staging in the plan.
- **06:00 with nothing happening** (arc:393). Watching the hour arrive under floodlights is a good final image, and better than "first light".
- **Silent Nightshade: "Door."** (arc:223). A scene in one word, paid off at the blast door.
- **The miss lines** (SE:48–51), especially "That answers a question I didn't ask." They are dry and never humiliating, and they tell the player the answer was aimed wrong.
- **HaX's surrender last word:** "He asked who taught you. I said I did." (SE:293). It is earned and short, and it is about the player.
- **Netherton,** throughout: "Noted, Agent Quintero. Twice now. The record also says six o'clock."; "He did not burn you. Note that, someone."; the one-page handbook chapter on raids by invitation; "That is why you are suspended and I am not." He sounds like the m07/m08 Netherton.
- **The default technicians.** Imran and Wendell are real people. Wendell is the innocent the player wants to protect ("They paid better this time."), and Imran gives protected Gary someone to save.
- **Arakawa's peel-off line:** "Service side. She always takes the door nobody's watching." (SE:362). It reads one way on the night and another afterwards, which is exactly its job.
- **"In memory"** for Callum Fraser and Ana Lúcia Ferreira (arc:476). It is the most moving item in the close.

## Findings

0 blocker, 16 major, 19 minor (35 in all).

### Tesseract and the talk-down

| id | sev | location | problem | fix |
|---|---|---|---|---|
| W1 | major | arc:350–360; SE:104–148 | **The three exchanges are three separate quizzes, not one argument.** Claims 2 and 3 open the same way whether the player landed or missed the previous point, so nothing the player says moves him. A real argument shifts ground: a man who has just conceded the price falls back on the principle. | Give each of claims 2 and 3 two fixed openers, one for a landed previous point and one for a miss. Landed: "Then the number was wrong. The reason isn't." Missed: "You've no answer to the price. Then hear why I'll pay it." This costs two strings per exchange, and he becomes someone the player is pushing. |
| W2 | major | SE:120, 133, 148; arc:350 | **The stock decoys are strawmen.** "You're going to kill people. That's all there is to say." and "It's over. Stop talking and stop it." are obviously wrong. A cold-start player sees two buttons per exchange, one right and one silly, so the climax is a coin flip with the coin's faces labelled. The arc's own rule ("at least one that sounds strong and answers a different question", arc:350) is met only in exchange 2 ("Then why steal it?", which is good). | Write each stock decoy as a true, strong line aimed at the wrong claim. Ex 1: "[Hospitals can't patch in a week. Half of them can't patch in a year.]" (true, but about mechanism, not price; reply: "That's an argument about speed. I asked about a price."). Ex 3: "[You're not clean. You stole the database.]" (reply: "I'll answer for the theft. I asked who should answer for the rest."). |
| W3 | major | SE:142, 266–268; arc:356 | **Exchange 3 is won by defining an aphorism.** The rebuttal tells him what his own line "really" means and adds a clause the line never had ("you never hand it to strangers"). He then agrees ("That is what it means. Yes."). It is the weakest kind of argument at the most important moment, and the player states the theme aloud, which SE:11 says nobody does. HaX's speaker version says the same thing again. | Ground exchange 3 in his offer, which the player has just heard. His claim is "clean hands", and he needs a SAFETYNET hand on the key precisely so that his own stay clean. Rebuttal: "[Clean hands? You need mine on the key so yours stay clean. You're handing the hurt to me, like you hand it to everyone.]" He concedes: "*pause* Yes. That's why it had to be you." HaX's speaker lines then keep their personal half (the back of her hand, the room with no windows) and drop the restated thesis. |
| W4 | major | SE:122–125; arc:370 | **His case against hoarding has no concrete victim.** "Retain, retain, retain. Operational value." is vivid but abstract. Meanwhile the plan's best concrete example sits unused in the database choice: the infusion-pump flaw in 140 hospitals, "still live next year if we do this" (SE:278). | Give that entry to him in claim 2: "Infusion pumps. A hundred and forty hospitals. Your service has known for three years and called it an asset." When HaX reads the same entry before Secure, the database choice becomes the player's answer to him, and his case lands because it is partly true. |
| W5 | major | arc:341; SE:159 | **The paused clock takes the threat out of the core.** If he can pause the Publication, a viewer asks why the player can't leave it paused, and the core has no live danger until the switch at step 5. | Add one line saying the pause is his to lift: "It starts again when I take my hand off it. Or when you leave." Then show his hand resting on the console through the talk. The threat stays in the room, and it sets up the switch at step 5 (see W8). |
| W6 | major | SE:187; arc:365 | **"It has to be one of theirs": Kowalczyk *is* one of theirs.** She has carried a SAFETYNET badge for eleven years. As written, his refusal has a hole in its logic, and it is his one stated motive. | Make the reason explicit in one line: "Not you, Halina. When they find out what you are, it proves nothing. It has to be one of theirs." The hole closes, and the line explains why he needs 0x00 in particular. |
| W7 | major | arc:365; SE:320 | **WREN's aim at the core is muddled.** She "goes for the key" (she wants it published), and then, refused, turns "to wreck the disarm and take the copy for the Initiative" (she wants it hoarded). Those are opposite goals. SE:320 calls her a true believer in exposure, which fits the key and not the copy. | Pick one. Recommended: she believes in the Publication, goes for the key, is refused, and tries anyway. Drop "take the copy for the Initiative". If the Initiative angle has to stay, she goes for the copy from the start and never for the key, and his "Not you" changes to suit. |
| W8 | major | arc:377; SE:202–206; arc:427 | **A dead-man switch fires when its holder lets go.** As written, shooting him is what would trigger it, yet the lethal branch has nothing happen and only "hold fire" needs HaX to kill the feed. Anyone who knows the trope will notice. Scorched Earth's purge is also called "his own dead-man". | Call it what it does: "a switch under the console that re-arms the fallback". On lethal force, HaX kills the feed too, a second late, which makes the shot the costlier way and is better drama: "Feed's dead. You didn't need to." Keep "dead-man" only for the Scorched Earth purge, which is triggered by the wipe. |
| W9 | major | arc:345; SE:57–88 | **His three record lines come first, before the Publication.** "You told them the truth…", "You read him his rights…", "'I'd make it again.'": three "you did X" lines in a row from one speaker break SE:532's own rule (no two carry-overs back to back by the same speaker). Coming first, they read as a recap. | Move them to after the offer, as his evidence for "My file says it will be you": "You pressed it once, on your first day. You told Albion half. You said you'd make Austin's choice again. I read files for a living." Then they are the argument, and the player feels watched instead of reminded. Keep two at most on screen together. |

### The five full scenes

| id | sev | location | problem | fix |
|---|---|---|---|---|
| W10 | major | arc:233–245 | **Talk-round always wins.** In the workshop (Imran with Gary, or alone) and with Wendell, talking someone round gives the door, a clue pointer and a witness at no cost, while "take him in" gains nothing. README_ink_best_practices "The flat-choice anti-pattern" applies. These are the scenes the user asked to have "its own drama, decision and payoff". | Give the kind option a risk the player can see. Imran, talked round and left free on the floor, can still make a call; the player decides whether to trust him with his phone. Wendell, told, wants to warn his old colleague on the next shift; letting him do so costs a guard alert. Taking Imran in should give something talk-round doesn't: his phone, with the supplier's contact. |
| W11 | minor | arc:243 | Captured Voltage, "his hands": "the shutter drops a step earlier", but the clock moves on beats (arc:11), so faster means nothing, and "Neither is wrong" means neither matters. | Make it a trust moment with something visible at stake. On the panel next to the shutter is a feed he could throw to blind the gallery, and he says so: "I could. I won't. Watch me not." The inquiry line is the payoff. |
| W12 | minor | arc:221 | Kept but not shown, Nightshade: checking the payment "finds the wrong entry; he smiles", and then "the board is already tipped; the door still locks". Catching a traitor in a lie earns the player nothing. | A check made before he leaves the table should stop the tip-off: WREN is not warned and peels off at the usual place, while the door still locks. It also needs one line on how a man in cuffs tips anyone off (a pre-arranged silence on a channel, say). |
| W13 | minor | arc:254 | Escaped Victoria with the threat: "I said I'd do it myself. I still might." The plan never says what "it" is. A stand-off with a pistol needs a stated stake. | Name the m03 threat in one line so the stand-off has an object: whom she would shoot, or what she would do with the head start. |
| W14 | minor | SE:409–412; arc:265–268 | Ghost's branches have strong openers. The broken and stranger branches ask the player to "talk Ghost out of the sale" with no argument named, and m02's Ghost is a sharp debater. | Stage 3 should give the winning argument one concrete hook from Ghost's secret (the sale is a leaving fee): "You're getting out. Do you want to leave on a hospital's worst day?" |

### The whodunit

| id | sev | location | problem | fix |
|---|---|---|---|---|
| W15 | major | arc:289–291; SE (HaX nudges) | **Clue 3 is a smoking gun, and HaX's nudges do the deduction.** After clue 2, HaX says "Quintero or Kowalczyk". After clue 3, she names Kowalczyk and quotes her tell back. The bench serial matching the cracker in your hand solves the case alone, so clues 1 and 2 are scenery and the player never makes the jump. | HaX's nudges stop at what she sees: "The log says Malhotra. Malhotra was with me." and "That's a bench serial. Where did yours come from?" The player makes the connection. Clue 3 could then point at "the tunnel pair's kit" (a serial range issued at the kit check) rather than one named unit, so it needs clue 2 to finish it. |
| W16 | major | SE:331–334; arc:307 | **The accusation scene is one line.** She doesn't run, asks "Was it the cracker?", and is held. A TV accusation needs a denial the player has to break, and a reaction from the people who liked her. SE:322 builds the setup for exactly this (every line she says before it is true) and then never cashes it in. | Three beats. First, she lies for the first time, lightly: "Malhotra's badge, Malhotra's door. Ask him." Second, the player lays down what they hold (log, alibi, serial), and each card she can't answer is one line shorter. Third, the crack ("It was a good cracker."), and Arakawa, who laughed with her at the kit check, looks away. This is where the kit-check laugh pays off. |
| W17 | minor | arc:283, 308; SE:363 | Arakawa's suspicion (the unlogged 02:10 call) is cleared by the player's own eyes before it can be raised, so he is never a suspect to the player. "Ask my daughter where I was." is an odd answer to someone who stood next to him. | Make his suspicious act something the player didn't see: he went back to the vans for two minutes before 02:10 and won't say why (it was to buy the telescope online). Wrong-accusation line: "You were stood next to me. Think." |
| W18 | minor | arc:299 | Nightshade's skip-clue line ends "And look at what they gave you", which hands over clue 3 as well. | Cut the last sentence. |
| W19 | minor | SE:358 | Arakawa's secret, "tonight is meant to be his last raid" before a desk job and his daughter's birthday, is the "two days from retirement" trope, which tells a TV audience he will die. He doesn't, and nothing uses it. | Cut the transfer, or use it: he is the one hurt at the core, not Quintero. Keep the telescope and the bedtime, which are good. |

### HaX, Netherton, the raid team

| id | sev | location | problem | fix |
|---|---|---|---|---|
| W20 | major | SE:256–274; arc:409 | **HaX never speaks to Tesseract on most branches.** She answers him only on `same_in_your_place` (the speaker). On a cold start, `should_have_told` (one line, about him rather than to him) or arrest, the season's handler and her teacher never exchange a word. Her silence at "Ninety-nine. You've done well with them." is strong once, but across a whole finale it reads as a missing scene. | Give every success branch one line from her to him, late, after the end is decided. On arrest, at the van window, after his nod: "You'll want a lawyer, Adrian. Get a good one. I'm testifying." On hold fire, after his "Ninety-nine.": "Agent HaX. It's been HaX for seven years." The speaker branch keeps its bigger moment. |
| W21 | minor | arc:409; SE:298–314 | **Netherton and Tesseract never meet.** Netherton ran SAFETYNET while Tesseract was its chief strategist, and the plan gives them no beat. | One line at 06:00, through the van window on arrest or surrender: "Adrian." / "Magnus. You kept the chapter on raids by invitation, I see." It is cheap and lands both men. |
| W22 | minor | arc:365; arc:335 | Quintero stands behind the player through the talk-down. "The gallery is the first room the player is alone in" (arc:37) is undercut at the core, which is the room that needs it most. A lead officer would also simply arrest him. | Tesseract asks for 0x00 alone and Quintero holds the outer lock: "He wants you on your own. I'll be on this side of it." She comes in at the noise when WREN breaks through. |
| W23 | minor | arc:234 | HaX's m02 line "Don't be the fifth person tonight to walk in and treat him as one" is quoted as if said in m10. "Tonight" was m02's night. | Recast it as a memory: "At St. Catherine's I asked you not to be the fifth person to treat him as a suspect. He's had a few more since." |
| W24 | minor | SE:244 | HaX's mid-raid joke about Finance, five hundred pounds and a guard in London is a name-check in the middle of a siege. It is a nice line in the wrong place. | Move it to the 06:00 walkabout, or cut it. |

### Carry-overs and the close

| id | sev | location | problem | fix |
|---|---|---|---|---|
| W25 | major | arc:92–99 | **The briefing is a roll-call.** Netherton reads out, back to back, Vector declined, Phantom busy, Voltage in the van, Mr Whitlock consulting, Ms Sterling's telephone, Dr Mercer's statement and the Council's numbers. That breaks SE:532 and the user's "not a list of name-checks". Each of these lands better in its own room. | Keep at most one helper in the briefing, seen rather than announced (Voltage visible in the second van, saying nothing). Move the rest to the moment they matter: Gary is there when the player opens the workshop door, the Mercer drawing comes up when the server-hall map loads. Keep Vector's and Phantom's declines (they are short, and absence is felt best early), but split them by a beat. |
| W26 | major | arc:391–447, 451–478 | **The ending pays the carry-overs four times:** the 06:00 walkabout (up to ten people with a line each), the five numbered beats in Netherton and HaX's scene (database, head start, partial release, media, last word), the closing card (six categories, "fifteen lines or more", arc:462), and "In this operation" in the credits. The user asked whether the card and credits are moving or a list. As specified, the card is a list and arrives after the scenes have already said everything on it. | Keep the walkabout and the credits list; those are the TV-shaped pair. Cut the card to five lines at most: the Architect, the database, the head start, one line for the cells together, and one human line chosen by the player's heaviest choice (Elena Torres treated, dispatch restored after N days, or the forty-seven). Drop the 12-line pagination machinery. In Netherton's scene, fold beats 2–4 into two lines of his with numbers, then HaX's last word. |
| W27 | minor | SE:88 | The m07 default, "Two of yours died the night you saved Austin", tells a never-played player about a choice they didn't make (SE:532). | "Two of yours died at the sites nobody covered. I've read their names." |
| W28 | minor | arc:157–161; SE:239–244 | The security office stacks the photo, the budget memo, Hollis's photo and his children, Kowalczyk's reaction, the door log, Ghost's call and Vector's door. Several are HaX one-liners in a row, which risks the back-to-back rule. | Stage 7 should space them: the memo and Hollis are props with no line unless clicked; Ghost interrupts whatever is playing. |

### Endings

| id | sev | location | problem | fix |
|---|---|---|---|---|
| W29 | major | SE:216–219; arc:435 | **Join is close to chilling, but his line gloats.** "*quietly* There. I was right about you." breaks his own rule (SE:39: never triumphant) and makes him a Bond villain at the worst moment. The steps also say "turn" a key (SE:216) where the object is pressed (arc:385). | Make him courteous, which is colder: "*quietly* Thank you, Agent." Then nothing. Keep the display running city by city and HaX's unanswered designation, which are right. Settle on "press". |
| W30 | minor | SE:295; arc:430 | HaX's Scorched Earth last word, "He's one man with a memory now, not a map.", is about him and not about the player, who has just been suspended, and it uses the "X, not Y" shape. | "He still knows where every one of them is. Now he's the only one who does." Or make it about the player: "They'll ask me if I'd have stopped you. I'll tell them I wasn't asked." |
| W31 | minor | arc:377 | Lethal force is reachable only by losing the argument (D-11). A player who has argued well cannot choose it, and a player who wants it has to throw the debate. That is defensible, but the brief lists lethal force as one of the player's choices. | Leave D-11 alone, but note it for the user in FINALE_DECISIONS_PENDING so it is a known choice and not an accident. |
| W32 | minor | SE:210 | "They'll know who you are by Thursday" (surrender) is a threat, and SE:38 says he never threatens. It is a good sting. | Keep the line and change the rule to "never threatens anyone but the player, and then only once", or soften it: "They'll have worked out who you are by Thursday. Be careful." |

### Writing and design prose

| id | sev | location | problem | fix |
|---|---|---|---|---|
| W33 | minor | SE:432–433; arc:299 and others | Small leaks: "Put me on speaker" (arc:356) against the button text "[Put her on. She can tell you.]" (SE:143). Nightshade's line has two versions (arc:220 "wrote off… I read it in his hand"; SE:378 "wrote… I learned to write like it"). | Pick one of each. SE:378 is the better Nightshade line. |
| W34 | minor | SE:166 | "Ninety-nine always said you were thorough" implies HaX has been reporting to him. In a finale where WREN is the traitor, that is a red herring nobody wants. | "Your reports say thorough. I didn't believe them." |
| W35 | minor | arc:393; SE:525, 500 | The design prose has some of the user's tells: "as people standing in the cold, not a roll-call" (negative parallelism), "the season's most earned moment" (self-praise), "which is the horror". | Plain statements: "the carry-overs pay as people standing in the cold"; "the player hands their handler the floor against her teacher". |

## Worst ten lines, with rewrites

| # | Where | Line as drafted | Problem | Rewrite |
|---|---|---|---|---|
| 1 | SE:348 (Quintero, blast door) | "That's not a welcome mat. That's a leash." | The "not X, it's Y" AI signature, on the act's first chill. | "I don't like doors that know your name." |
| 2 | SE:118 (Tesseract, bed four) | "You don't believe in acceptable costs. *pause* Neither did I, once." | The stock "I was like you once" villain line, and it doesn't concede what was proved. | "*pause* I had him as rounding. He wasn't." |
| 3 | SE:129 (player, exchange 2) | "…This isn't a shock. It's you not finishing." | Negative parallelism, and "you not finishing" is limp at the season's key rebuttal. | "…You lost that argument nine years ago, and tonight strangers pay for it." |
| 4 | SE:111 (Tesseract, claim 1) | "It's the cheapest the last arms race will ever be. Every year we wait, it costs more." | Tangled first sentence; the claim is unclear on first hearing. | "That's the cheapest it will ever be. Wait a year and the number goes up." |
| 5 | SE:218 (Tesseract, join) | "*quietly* There. I was right about you." | Gloats, against his own rule, at the moment he should be coldest. | "*quietly* Thank you, Agent." |
| 6 | SE:262 (HaX, at the core) | "No. This one's yours. If I help you with it, it's mine, and I'm not owed it." | "I'm not owed it" is murky; the line needs a reason the player believes. | "No. This one's yours. If I choose, I'll choose for the wrong reasons." |
| 7 | SE:119 (Tesseract, clean first day) | "One agent. Not a policy. *pause* But not nothing." | Two "not" constructions in nine words; it reads as written, not said. | "One agent is an anecdote. *pause* Eight missions is a habit." |
| 8 | SE:131 (Tesseract, Albion notice) | "Nine years late. *pause* Still earlier than they would have." | Ungrammatical ("than they would have" what?), and it hides the concession. | "Nine years late. *pause* Sooner than I managed." |
| 9 | SE:338 (Kowalczyk, 06:00) | "I'd have taken it back off you at the lock. I liked you. It doesn't change anything." | "It" is unclear (the cracker? the copy?), and the third sentence explains the second. | "I liked you. I'd still have taken it off you at the lock." |
| 10 | SE:76 (Tesseract, m01 recruit) | "You asked Derek to turn. He laughed, I'm told. You'd have got nothing from him. He knew nothing." | Four sentences where he says one; flabby for a man who "never says more than he must". | "You asked Derek to turn. He had nothing to turn with. I saw to that." |

Close behind: HaX's arrest last word, "He taught me to keep it for afterwards. It's afterwards." (SE:292), explains the callback. "It's afterwards." alone, after his nod through the van window, does the same work. Also "Then we do it the slow way. In court. I've a lot to say." is fine and should stay.

## Length and over-specification

About 24.5k words across the two files (arc 14.1k, SE 10.4k). For stages 1–2 that is roughly 5–6k too many. The prose is plain and mostly free of padding; the excess is material that belongs to later stages, plus duplication between the two files.

**Belongs later (move or cut to a pointer):**

- Arc §13 globals table with enum values (arc:498–515): stage 3/4. Keep the list of decisions; drop the value sets.
- Arc §2 minute-by-minute budget and countdown display steps (arc:41–78): keep the cut order (it protects the drama); the per-beat minutes and display times are stage 4's.
- Arc §11.1 card pagination ("over twelve… a second card", arc:462) and §11.3 engine-order check (arc:470): stage 9.
- SE §4 Gemini voice names and full style prompts, and the voice-clash notes (SE:454–486): the tts-audio stage. Keep accent and register in one phrase per person.
- SE §8 music table with playlist names and **[new]** engine work (SE:563–586): stage 4/9. Keep the one paragraph that matters dramatically (SE:586: the core's music is how a landed point shows).

**Duplicated between files:** Nightshade, Ghost, Victoria, Voltage and Quintero lines appear in both arc §7 and SE §3.5; the "Ninety-nine" and "no WREN pronoun" rules are stated three times each (arc §4, arc §14, SE §9). Arc §12 and §14 restate decisions already made in the body; they could be pointer tables of one line per row.

**Not bloated:** the Tesseract section (SE §2) and the five-scene tables (arc §7). Those carry the drama and are the right size for stage 2.

## Verdict

**Revise and re-review (R2).** The bones are a satisfying finale: a villain with a clear, signed body count and a comprehensible grievance, the offer as a trap, a whodunit with a fair three-clue chain, a silent gallery before a quiet climax, and an epilogue built on watching 06:00 arrive with nothing published. The returning faces mostly land as events in rooms, as the brief asks.

What keeps it from working yet is concentrated at the climax and the close:

1. **The argument isn't one yet** (W1–W4). The exchanges don't move with the player's answers, the decoys are strawmen, and the deciding exchange is won by defining an aphorism. Fix those four and Tesseract's case lands, and losing to him becomes possible for a reason.
2. **Three logic holes at the core** (W5–W8): the paused clock, "one of theirs", WREN's goal, and the dead-man switch. Each is a one-line fix, and each would be the first thing a viewer picks at.
3. **The whodunit solves itself** (W15–W16): HaX names the suspect, and the accusation has no confrontation.
4. **HaX and her teacher never speak** on most branches (W20), which is the season's relationship.
5. **The briefing and the close are roll-calls** (W25–W26), against the user's explicit "not a list of name-checks".

Join ENTROPY is chilling apart from one gloating line (W29). Scorched Earth and lethal force are at the right TV level: one narrated line, a silence, a signature. With the majors folded in, this should pass on a second round.
