# m10 Full Disclosure: Stage 2, storytelling elements

## 1. Status and how to use this

Stage 2, draft 1. Author: stages 1–2 author (Opus), 2026-10-21. Not yet reviewed.

Companion to `../stage_1/story_arc.md` (cited as "arc §n"), which has the structure, order and branches. This file has the people: voice, wants, secret and arc for each, sample lines, and the feel of the night (atmosphere, music, pacing, how carry-overs land). FINALE_ARC is cited as "FA §n" and its thread rows as "row n"; a bare "§n" is a section of this file.

**Sample lines are samples.** They fix a voice and a beat; stage 7 writes the ink. Speaker prefixes are the displayName stage 9 will give each NPC; a returning character keeps the prefix and voice of their own mission (voice bible). Lines follow the user's style rules and `README_ink_best_practices.md`: player choices are first-person spoken words in brackets; no printed variables in voiced lines (each branch is its own fixed string); one asterisk cue per thirty-odd lines at most, never on a line with a number in it; no "Not X. Y." except one per villain scene.

**The house style for the finale.** A TV spy thriller's last episode. People say less than they mean. Nobody explains the theme. The player's history is said *to* them by someone with a reason to say it, at the moment it matters, in a line or two, never as a list. Villains are calm. Violence is a line.

## 2. Dr Adrian Tesseract

Speaker prefix `Dr Adrian Tesseract` (stage 9 confirms; the m07 handset used `The Architect`, and the name change is the reveal paying off). Sprite `adrian_tesseract`, new; his look is the user's call (FA §8 risk 9). A man in his sixties, origin unplaced (A15). Voice: Sadaltager, as in m07, **without** the distortion; stage 2's proposed style is in §4.

**Who he is.** SAFETYNET's chief strategist for most of a career. He trained half the field, HaX among them. He walked out seven years ago over a real disagreement (the Cyber Security arms race speeds up the collapse it claims to prevent), and the walk-out was also cover: he had been recruiting for ENTROPY's ends since before Nightshade's intake fifteen years ago (FA §8 risk 17). Since then he has been the Architect: the letters, the directives, the four-site night, the theft of the database.

**What he wants tonight.** To be proved right by the people he left. A SAFETYNET hand on the key, so that the service that hoarded the map gives it away with its own hand. Not any hand: the agent his old student runs, whose file he has read (the Reading, m09), and who he believes will press it. He also wants to be argued with. He stopped the clock because a teacher who has been alone for seven years wants one more good student in the room. He would never say so.

**His secrets** (each one the player can touch):

1. **He lost the argument once and didn't finish it.** Nine years ago he argued that the Albion flaw should go to the vendor, lost, drafted the notice and never sent it (m09). The Publication is that notice sent to everyone, with interest. He has made his own failure of nerve into a doctrine. The second rebuttal is aimed here, and it is the one that hurts.
2. **He signed a figure he knew was low.** His own systems lead corrected the casualty sheet, he initialled the correction, and signed the old number (arc §6.1). The first rebuttal.
3. **He taught the line the other way round.** "Let it hurt afterwards, not during" was his. He meant: carry it so you can work. He has spent seven years doing the opposite, handing the hurt to strangers so that he never has to carry it. HaX worked out what it meant on her own. The third rebuttal.
4. **He doesn't want Kowalczyk to press it.** She is his, so it proves nothing. That is the one moment the player hears his motive from his own mouth (arc §9.4).

**His arc tonight.** He begins certain and courteous, a host. Each landed point takes a little of the certainty, never the courtesy. Where it ends depends on the player: argued down far enough to stand up empty-handed and offer his cooperation (the teacher conceding to his student's student); arrested, unmoved, with a trial to look forward to; dead by the console, reaching; gone in the dark, with a card that says "Afterwards, then."; or vindicated, walking out with the agent his file said would press it.

### 2.1 How he speaks, and how he takes an argument

**In person he is the m07 voice with the distortion gone**, and a little more of him. Still short, exact and unhurried. The difference is that he finishes his thoughts now, as a teacher does with a student he rates. Most lines under fifteen words; his case may run to twenty-five in a line, never more. No thermodynamics, no jargon. One image per scene at most.

- **He grades.** He answers the player's points the way he once marked papers: "Better." / "That's a slogan." / "Closer." It is the habit of a man who has been right in front of rooms for forty years.
- **He asks questions he knows the answer to.** "What do you think a vendor does with a notice nobody sends?"
- **He uses numbers exactly and never rounds in his own favour aloud.** "Eleven hundred to twenty-six hundred." He did round on paper; that is the point.
- **He calls the player "Agent" or "0x00", and HaX "Ninety-nine"**, the way an instructor uses a number. Nobody else in the game calls her that. It tells the player who she was to him without anyone explaining.
- **He is courteous to the end.** He never interrupts, never raises his voice, never threatens, never gloats. When he concedes he does it exactly: he gives up the precise thing that was proved, no more.
- **He never says:** "you don't understand", "join me" (the offer is plainer than that), anything triumphant, his own motive in a speech (the player hears it once, when he refuses Kowalczyk), an apology.

**A landed point** (two of three for surrender; arc §9.4 step 2). He stops. He looks at the console, not at the player. A beat of silence. Then a short concession, exact and unhappy, which gives up the thing proved and nothing else. He never says "you're right". The narrator marks the turn in one line, the first time only ("He looks at the console for a long moment."); after that the pause alone does it, with a `*pause*` cue on his next line.

> Dr Adrian Tesseract: ...She did. I initialled it.
> Dr Adrian Tesseract: I rounded in my favour. That's fair.

**A miss.** He answers at once, dry, without looking away, and moves on. It is visibly a miss and never a humiliation; the player can tell which answer would have met the claim. He has a small range of dismissals so the same one never plays twice in a run:

> Dr Adrian Tesseract: That answers a question I didn't ask.
> Dr Adrian Tesseract: That's a slogan. I asked about a price.
> Dr Adrian Tesseract: True, and beside the point.
> Dr Adrian Tesseract: You're arguing with someone else.

**When he answers from his ledger** (`m04_crew_lost`, `m02_patient_bed4_deceased`, `m06_satoshi_stance`, `m09_recruiter_secret`), he reads the player's own record back first, quietly, before he reacts. It is a sting, and it doesn't decide anything: an answer under the right claim still lands after it, an answer under the wrong one still misses. "A harder conversation, not a harder level" (row 47).

> Dr Adrian Tesseract: Nine of the night crew at Albion. I've read the inquiry. *pause* Go on. You were saying nobody died for the truth.

### 2.2 His case: the three record lines

He opens when the player walks over to him, seated, after flag 4 (arc §9.4 step 1). At most three lines from the player's record, in this order (D-08), one fixed string per value. Each has a default for a player who never played that mission; the default is written to stand on its own.

**First: m04 `disclosure_choice`** (Albion).

| Value | Line |
|---|---|
| `full` | "You told them the truth, and they audited every site. That was my lesson, delivered by you." |
| `partial` | "You told them half. Half is how we got here." |
| `quiet` | "You buried it. You understand me better than you admit." |
| default | "Albion. A plant left open because someone decided the hole was worth more than the fix. You'll have read my memo." (with `m09_completed`) / "Albion. A plant left open because someone decided the hole was worth more than the fix. I argued against that, once." (cold start) |

**Second: m01 `final_choice`** (Derek Lawson). `""` with `m01_completed` reads as arrest; never played reads as the canon arrest (FA §3).

| Value | Line |
|---|---|
| `fight` | "You beat a marketing manager and called it a war." |
| `arrest` | "You read him his rights. He kept his promise to me and said nothing." |
| `recruit` | "You asked Derek to turn. He laughed, I'm told. You'd have got nothing from him. He knew nothing." |
| `expose` | "You put Derek in the papers. The papers did my recruiting for a month." |
| `surrender` | "Derek gave himself up because I told him to. You were meant to wonder why." |

**Third: m07 `debrief_stance`** (the four sites).

| Value | Line |
|---|---|
| `defended` | "'I'd make it again.' You would. I counted on it." |
| `owned` | "You said it was yours. You'll carry this too." |
| `refused` | "'Don't ask me to rank them.' I ranked them for you." |
| `hardened` | "You asked your Council for the numbers. They're on the desk outside. Did you look?" |
| default | "Two of yours died the night you saved Austin. I've read their names. So have you." |

**Then the Publication, plainly.** No more than six lines: the hour; the fallback, city by city; the head start (released or stopped, arc §9.4); his figure, from memory; why it ends the arms race.

> Dr Adrian Tesseract: At six, everything SAFETYNET ever found goes to everyone. Free. With working detail.
> Dr Adrian Tesseract: Eleven hundred to twenty-six hundred, the first month. Hospitals, dispatch, water. People who never had the skill before.
> Dr Adrian Tesseract: Then it stops. Because every vendor on earth patches at once, and nobody can hoard what everybody has.
> Dr Adrian Tesseract: Every year your service keeps its map, it costs more than that. Nobody counts it. I did.

**Then the offer, which every player hears** (D-21). It is plain, and it is not a recruitment pitch; he is asking for one action.

> Dr Adrian Tesseract: It has to be one of you. If I press it, it's a crime. If you press it, it's a confession.
> Dr Adrian Tesseract: My file says you will. I'd like to see whether I'm right.

Warmer on `m01_player_launched_attack` ("You pressed it once, on your first day. You know what it costs, and you know you could."); warmer on `m06_satoshi_stance = wondered` ("You told a man in handcuffs that you sometimes wonder whether we're right. I liked that."); colder on `rejected` ("You told him no without thinking. Think now."). The signposting of Join is unchanged by any of them (FA §4.3).

### 2.3 The three exchanges

Each exchange: he makes the claim in two or three lines; the player sees three or four answers in brackets (the mission's rebuttal, up to two from their record that fit, at least one decoy). Only an answer that meets the claim lands. Order of the answers on screen is shuffled per exchange at stage 7, so the mission's rebuttal is never always first.

**Exchange 1. "The cost is acceptable."**

> Dr Adrian Tesseract: You've seen the sheet. You think the number's obscene.
> Dr Adrian Tesseract: It's the cheapest the last arms race will ever be. Every year we wait, it costs more.

| Answer (player's words) | Kind | His response |
|---|---|---|
| [Your own systems lead corrected that sheet. You initialled it, and signed the low number.] | mission rebuttal | lands: "*pause* She did. I initialled it." / "I rounded in my favour. That's fair." |
| [Asante's correction. Her initials, then yours, then the same number. You knew.] | sharper rebuttal (margin note decoded) | lands harder: "*pause* I knew." He says nothing else. |
| [Your Council's curve is outside. It doesn't stop after a month.] (`m07_debrief_stance = hardened`) | record | lands: "*pause* No. It wouldn't, would it." |
| [I squeezed a bag for an hour to keep one man breathing. Your sheet has him as rounding.] (`m02_bed4_manually_stabilised`) | record | lands: "You don't believe in acceptable costs. *pause* Neither did I, once." |
| [Eight missions. I've never hurt someone who wasn't in the fight. It can be done.] (clean first day, row 6 condition) | record | lands: "One agent. Not a policy. *pause* But not nothing." |
| [You're going to kill people. That's all there is to say.] | decoy | "That's a slogan. I asked about a price." |

**Exchange 2. "Services like yours hoard. Only a shock fixes it."**

> Dr Adrian Tesseract: I sat in those meetings for twenty years. Retain, retain, retain. Operational value.
> Dr Adrian Tesseract: Nobody fixes anything until it hurts everyone at once.

| Answer | Kind | His response |
|---|---|---|
| [Nine years ago you argued Albion should go to the vendor. You lost, and you never sent the notice. This isn't a shock. It's you not finishing.] | mission rebuttal | lands (his worst): a long silence, no cue. "No. I didn't send it." |
| [I told Albion's public the truth. They audited every site. Nobody died for it.] (`m04_disclosure_choice = full`) | record | lands: "*pause* No. Nobody did." On `m04_crew_lost` his sting comes first (§2.1). |
| [I sent your notice. Tonight, from Helena.] (`m09_albion_notified`) | record | lands: "Nine years late. *pause* Still earlier than they would have." |
| [I published St. Catherine's cover-up. Forty hospitals fixed their networks. Nobody had to die.] (`m02_exposed_hospital`) | record | lands: "Ghost's lesson, done properly. *pause* Yes." |
| [Then why steal it? You could have gone to the press.] | decoy | "That answers a question I didn't ask." |

**Exchange 3. "Someone has to make it hurt. Better me, with clean hands."**

> Dr Adrian Tesseract: I taught a room of twenty, once. Let it hurt afterwards, not during. I expect you've been told that.
> Dr Adrian Tesseract: Somebody has to be the during. I'd rather it was someone who can do the sums.

| Answer | Kind | His response |
|---|---|---|
| [It means you keep your own hurt for afterwards so you can do the job. You never hand it to strangers. You taught it, and you've done the opposite for seven years.] | mission rebuttal | lands: "*pause* That is what it means. Yes." |
| [Put her on. She can tell you.] (`m09_hax_confession_answer = same_in_your_place`) | record: "Put me on speaker" | HaX makes the argument (§3.1); lands: "Ninety-nine." He says only her number. |
| [She learned that from you.] (`should_have_told`, after HaX's unasked line) | record | lands: "*pause* She learned everything else from me. Not that." |
| [Your file says I press it. Watch me.] (`m09_reading_finished`) | record | lands: "A reading is a guess with handwriting. *pause* I'd hoped mine were better." |
| [Voltage checked your sums tonight and stood down. Your own people are stopping.] (Voltage stood down or talked) | record | lands: "*pause* He always did check." |
| [A man who warned them seven times opened a door for me tonight. Somebody listened. That's the fix.] (Gary or Imran talked round) | record | lands: "*pause* Listening. Yes. It's slower." |
| [It's over. Stop talking and stop it.] | decoy | "You're arguing with someone else." |

The sharper rebuttal in exchange 1 replaces the plain one when the margin note is decoded; it doesn't add a fifth button.

**Decoys from the record.** A record answer placed under the wrong claim is a decoy: the full-disclosure answer under exchange 1 ("True, and beside the point. I asked what it costs."), the bed-four answer under exchange 2, the Reading answer under exchange 1. Each shows only when the player has the record, so a rich save has more decoys as well as more answers. That keeps the talk-down "easy, but you have to listen" (FA §4.1).

### 2.4 His other lines

**Arrival** (arc §9.4 step 0). The bark as the player enters is a teaser, and the chat opens on a different line (ink bug 8):

> (bark) Dr Adrian Tesseract: There you are.
> Dr Adrian Tesseract: Take your time. I've paused it. I'd rather it was you.

To HaX, on the player's handset, once, before she can speak: "Ninety-nine. You've done well with them." She doesn't answer him (§3.1).

**Idle lines during flag 4**, one per VM sub-step, never on a timer (FA §13 item 18):

> Dr Adrian Tesseract: The long way. It's also the right one.
> Dr Adrian Tesseract: Ninety-nine always said you were thorough. I didn't believe her.
> Dr Adrian Tesseract: Nearly there. You'll want to sit down for what comes after. You won't, I expect.

**The cells** (optional; arc §9.4 step 0):

> (released) Dr Adrian Tesseract: Two hours for people who'll waste it. They were always scenery.
> (stopped) Dr Adrian Tesseract: Good. I never liked paying them.

**His leverage on `m09_recruiter_secret = kept`**, said to HaX on the open line, not to the player:

> Dr Adrian Tesseract: Forty-seven names, Ninety-nine. Your agent sold them in the spring and hasn't told you.

**Stop it** (arc §9.4 step 3):

> Dr Adrian Tesseract: Then we do it the slow way. In court. I've a lot to say.
> (`m09_reading_finished`) Dr Adrian Tesseract: Then I was wrong about one thing.
> (`m07_countdown_expired`, backdoor open) Dr Adrian Tesseract: Seattle first. As scheduled.

**Refusing Kowalczyk** (WREN free):

> Narrator: The service door opens. Kowalczyk comes through it fast and goes for the key.
> Dr Adrian Tesseract: Not you, Halina. You're mine. It has to be one of theirs.

**WREN caught:**

> Narrator: He glances at the service door. Nobody comes through it.
> Dr Adrian Tesseract: You found her. I wondered whether you would.

**Step 5, two or more points:**

> Narrator: He stands, slowly, and holds his hands out from his sides. They're empty.
> Dr Adrian Tesseract: Ask me, then.

**Step 5, fewer than two:**

> Dr Adrian Tesseract: Arrest me, then.
> Narrator: As you move, his hand goes under the console.

**Lethal force** (the only line; nothing after it on screen):

> Narrator: His hand finds the switch. You fire. He falls against the console, and the console goes on humming.

**Hold fire** (HaX kills the feed): he takes his hand away and looks at it. "Ninety-nine." Then he holds out his wrists.

**Surrender, at the terminal:** he types the cells' contact protocol himself, without hurrying, and says while he does it: "They never knew who I was. They'll know who you are by Thursday."

**Scorched Earth**, the card on the console: "Afterwards, then." (His hand. No voice; the player reads it in the dark.)

**Join**, the three steps (FA §4.3). Narration carries the cost; he says little:

> (Show me how it works) Dr Adrian Tesseract: It's a key. You turn it. Everything I've told you happens.
> Narrator: Pressing it publishes the database to everyone, now. Eleven hundred to twenty-six hundred people, the first month, by his own figure. You can still step back.
> (Give me the key) Dr Adrian Tesseract: *quietly* There. I was right about you.
> Narrator: If you press it, the mission ends here, and you work for ENTROPY. Step away, or press it.

## 3. The rest of the cast

### 3.1 Agent HaX, to the end

`Agent HaX` (`agent_0x99` on the phone; a briefing NPC and a debrief NPC in person). Aoede, RP. Voice bible: short lines, fact then reason then the human bit; drier, never louder, under pressure; care shown by what she does.

**Wants.** To get her agent out alive and to see her teacher stopped, in that order, and to not be the one who decides what happens to him. **Secret** (by m10, mostly out): she knew his name since m06 and sat on it (m09's confession). What is left is smaller and worse: part of her wants him to win the argument, because he taught her everything else, and she is afraid of what she'll feel if he loses it badly. She never says this. It shows once, in the gap after his "Ninety-nine."

**Arc to the end.** m08 left her close to coming apart; m09 made her say the name and confess; m10 is the night she watches her agent do what she can't. She is in person at the forward post, then on the line all night. She knows the bunker's tricks because she knows his ("He always puts the real door behind the one you're looking at."). Tesseract's jam takes her for the gallery, which is the first time in the season the player has walked a room without her. At the core she refuses to decide for the player, and says so; on the right branch she argues with him herself; on a failed talk-down she is the one who kills the switch's feed. In every success ending she has the last word before the card.

**The briefing: "How are you?"** By `m09_hax_confession_answer`:

> (`same_in_your_place`) Agent HaX: Better for having told you. Ask me again at six.
> (`should_have_told`) Agent HaX: You were right, in Helena. I'm still deciding what to do about it. Not tonight.
> (`""`, cold start) Agent HaX: I'm going to watch someone I used to admire be arrested. I'll manage.

**On the way down** (samples; one each, at the beat in arc §5–6):

> Agent HaX: Two posts empty. That's your freeze. He couldn't make payroll.
> Agent HaX: The readers take our badges. He loaded every SAFETYNET credential he stole. That door was told to want yours.
> Agent HaX: Whoever's in the power room runs your lights.
> Agent HaX: Your tags, from HashChain. One line, all the way from the fund to his lease.
> Agent HaX: Reeves. From the hospital. He's theirs full time now.
> Agent HaX: Finance have just asked me about five hundred pounds and a security guard in London. I've never been so pleased to fill in a form.

**After flag 2**, reading the schedule:

> Agent HaX: Infusion pumps, a hospital group. Dispatch software, a whole county. A water utility's controllers.
> Agent HaX: That's enough of that. You've got the rest on screen.

**Her last line before the jam.** Her doubt first, where it applies, then the next door, then nothing:

> (recruited Victoria) Agent HaX: Sterling's in the gallery. Trust her as far as the gallery, and check her against the order before you do.
> Agent HaX: Up the stair, along the walkway, the lock's at the far end. He's jamming me. You're on your own for one room. I'll be at the door.

**At the core.** First, a cracked line as the door opens: "...0x00." Then, when he greets her through the handset, she doesn't answer him. To the player:

> Agent HaX: Get on his box. He'll keep.

When the player asks her what to do (the hub offers it once the choices open):

> Agent HaX: No. This one's yours. If I help you with it, it's mine, and I'm not owed it.

**"Put me on speaker"** (`same_in_your_place`; the third exchange). The longest thing she says all season. Three lines, no more:

> Agent HaX: You said it to twenty of us in a room with no windows. I wrote it on the back of my hand.
> Agent HaX: Seven years of agents. I've told every one of them: carry it so you can work. Never hand it to someone who didn't choose it.
> Agent HaX: You taught me that. You just never did it.

**Unasked, on `should_have_told`** (once, before the third claim, FA §5.4):

> Agent HaX: My agent told me I sat on it. They were right. You never told me anything.

**On `m09_recruiter_secret = kept`**, after his leverage line: "I'll deal with that afterwards." She does, in the epilogue, in a line that is neither forgiving nor not: "Afterwards, then. The forty-seven. Tell me properly, and then it's done."

**The database costs** (her share of stage 3's wording; Netherton has the operations):

> (secure) Agent HaX: One entry, so you know what you're keeping. Infusion pumps in a hundred and forty hospitals. Still live next year if we do this.

**On the Join path**, at "Give me the key": her designation for the player, and one request, without pleading:

> Agent HaX: 0x00. Don't.

**Killing the switch's feed** (fewer than two points; hold fire):

> Agent HaX: Got it. Feed's dead. Hold, hold. *breath* He's done.

**Her last word, by ending** (the line before the card):

| Ending | Last word |
|---|---|
| Arrest | "He taught me to keep it for afterwards. It's afterwards." |
| Surrender | Back from the van, after the minute she won't talk about: "He asked who taught you. I said I did." |
| Lethal force | On the line at the core, after a long silence: "Log it. I'll sign under you." At 06:00: "Afterwards is going to be long. I'll be in it." |
| Scorched Earth | At the hearing: "He still knows. He's one man with a memory now, not a map." |
| Join | A message, unanswered: the player's designation, and nothing else. |

### 3.2 Director Netherton

`Director Magnus Netherton`. Charon, RP. Formal, few contractions, exact numbers, short declaratives then a verdict; dry handbook humour once per mission at most.

**Wants.** To bring the database back and his people home, and to be the one who signs for whatever the night costs. **Secret:** none left that the player doesn't know; m08 took his. What he carries is the two dead agents and Nightshade's file, and he does not mention either tonight unless the player does. **Arc.** He commands from the forward post and never goes below ground. His m08 line, "If he burns you, it is on my signature", comes due at the door either way (arc §7.1). He names the cost of disclosure and signs anyway. He suspends the player on Scorched Earth, and means the reason he gives.

Samples:

> Director Magnus Netherton: Agent 0x00. He has invited us. We are going in anyway, because the alternative is six o'clock.
> Director Magnus Netherton: Noted, Agent Quintero. Twice now. The record also says six o'clock.
> (Vector declined) Director Magnus Netherton: Vector declined. He said you would know why.
> (kept Nightshade, shown) Director Magnus Netherton: He did not burn you. Note that, someone.
> (kept, not shown) Director Magnus Netherton: It is on my signature. I know.
> (recall after a wrong accusation) Director Magnus Netherton: Officer Malhotra. You are cleared. Come back, and leave the face at the van.
> (disclose) Director Magnus Netherton: Two operations go dark if you do this. The tap on Zero Day's brokers, and the watch on Ghost's buyers. I will sign it.
> (Scorched Earth) Director Magnus Netherton: I would have wanted to do the same. That is why you are suspended and I am not.
> (the handbook, once) Director Magnus Netherton: The handbook has a chapter on raids by invitation. It is one page long. It says don't.

### 3.3 Halina Kowalczyk (WREN)

`Agent 0x5E 'Lantern'` in the raid team's prefix form (stage 9 confirms against Vector's and Phantom's); 47, Polish-British, grew up in Ealing in a Polish family. Task Force Null's breaching lead. Voice: Pulcherrima, light West London with a Polish family's vowels; warm, quick, a laugh in it.

**Wants.** To walk out of the core's service door with the stolen copy for the Initiative, and to be the one who did it. **Secret.** She is WREN: placed in SAFETYNET eleven years ago through Harwick & Lowe, a search firm long since closed. She came in for the money and stayed because she believes it: eleven years of breaching doors SAFETYNET had decided the public shouldn't see behind. She is a true believer with a sense of humour, which is why everyone likes her. **Arc.** Easy to like at the briefing (and in m09, where she hands over the cracker); always one room ahead, breaching, which is why her badge is on every door; peels off at the server hall; caught, or comes through the service door at the core and is refused by the man she works for. Being refused by him is the only moment she loses her composure.

**She never says** anything that is a lie the player can check, until the accusation. Every line she says before it is true, which is how she has lasted eleven years.

Samples:

> (handing over the cracker, cold start; m09's line) Agent 0x5E 'Lantern': This one's mine. Never been through stores, never been near him.
> (the security office, the player's photo) Agent 0x5E 'Lantern': Nice photo. They've got your good side. You don't have a good side.
> (if asked about the door end at 02:10) Agent 0x5E 'Lantern': Door end. Service door's real. Steel, a reader, a camera that doesn't move.
> (the peel-off) Agent 0x5E 'Lantern': I'll take the service side and meet you at the lock.

**At the accusation, right.** She doesn't run. She asks one question, and the player's answer is what she says something to at 06:00:

> Agent 0x5E 'Lantern': Was it the cracker? *almost laughs* It was a good cracker.
> + [It was the cracker.] / [It was everything. You were always one door ahead.] / [Say nothing.]

**At the core, refused** (WREN free): no words to the player. To him, one, before she turns on the disarm: "Adrian." It is the only time anyone in the season says his first name to his face.

**At 06:00** (caught), in the van: "I'd have taken it back off you at the lock. I liked you. It doesn't change anything." Knocked out and never named: she says nothing, and HaX has the line (arc §10.1).

### 3.4 The rest of the raid team

Every one of them must read as possibly WREN until a clue clears them, and as a person the player would miss if they were wrongly sent back. Each wrong-accusation line is also a hint (arc §8.4).

**Agent 0x2D "Anchor", Marisol Quintero.** 52, Mexican-American, from El Paso; twenty-odd years in, the last six running Task Force Null on the ground. Voice: Sulafat (en-US), West Texas, low and dry, unhurried. **Wants:** everyone home. **Secret:** for m07 she asked the Council for a second team and was refused; two people died at the sites nobody covered. That is why she wants "twice the people" tonight, and she doesn't say it unless the player asks her at the lock. **Arc:** the objection at the briefing; the drain at 02:10; placed in each main-path room as the player enters it (except the gallery); catches up at the outer lock; wounded at the core stopping WREN, and talking on the stretcher.

> Agent 0x2D 'Anchor': For the record, I'd go in at noon tomorrow with twice the people. You don't walk through a door a man's kept for you.
> Agent 0x2D 'Anchor': I took the drain, she took the door end.
> (blast door) Agent 0x2D 'Anchor': That's not a welcome mat. That's a leash.
> (wrongly accused) Agent 0x2D 'Anchor': I took the drain. Ask her what she took.
> (stretcher) Agent 0x2D 'Anchor': Shoulder. I've had worse from a door.

**Officer Dev Malhotra.** 33, British-Indian, from Hounslow; eleven years in, a graduate hire into comms. Voice: Achird, West London, quick and precise, defensive at the edges. **Wants:** to be trusted. **Secret:** the screening after m08 flagged him on a paperwork error and he spent a week re-vetted; nobody on the team knows. It's why he bristles. **Arc:** the comms check with HaX; logging Arakawa off the net at 02:10; his badge on the door log; stays at the forward post all night.

> Officer Dev Malhotra: Arakawa, you're off the net.
> (asked about the door log) Officer Dev Malhotra: It's my badge. It isn't my hand. I was talking to her at ten past. Ask her.
> (wrongly accused) Officer Dev Malhotra: Eleven years. Check the log again.

**Officer Kenji Arakawa.** 41, Japanese-American, raised in Seattle, lives in Billings; a lateral hire from a federal agency, the team's US liaison. Voice: Zubenelgenubi (en-US), Pacific Northwest, soft, slow, warm. **Wants:** to be home for his daughter's birthday on Saturday. **Secret:** he has put in for a transfer to a desk; tonight is meant to be his last raid. **Arc:** the fence wait and the call; placed one room ahead with Kowalczyk; the line as she peels off.

> Officer Kenji Arakawa: It's ten past eight here. She goes to bed at quarter past. Thirty seconds.
> (the player asks about her) Officer Kenji Arakawa: Nine on Saturday. She wants a telescope. I've told her it's a raid tonight. She thinks that's a type of party.
> (Kowalczyk peels off) Officer Kenji Arakawa: Service side. She always takes the door nobody's watching.
> (wrongly accused) Officer Kenji Arakawa: Ask my daughter where I was.

**Agent 0x23 'Vector' and Agent 0x88 'Phantom'** (present with `m08_completed` and not wronged). Their m08 voices: Vector, Iapetus, educated Glaswegian, fast, over-explains; Phantom, Fenrir, light educated Ghanaian English, charming, running his own errand. Each has one beat: Vector's annex badge on the sealed door; Phantom's list. **Wants:** Vector, to be useful after being suspected; Phantom, to finish the hunt he started in m08. **Secret:** none tonight. Their presence is the reward, and the player should feel it.

> Agent 0x23 'Vector': Annex standard. They copied our lock and kept our master. Give me two seconds. One.
> Agent 0x88 'Phantom': My list. I made it after Portland, for the screening. On this team it has two names. I'd rather it had none.
> (Vector, wrongly accused) Agent 0x23 'Vector': You've done this to me once. Check it properly and then say sorry properly.
> (Phantom, wrongly accused) Agent 0x88 'Phantom': My list had a name on it. It wasn't mine.

### 3.5 The five returning scenes

Each keeps their own mission's voice and sprite. What changes is what they want tonight, which the player's history decided.

**Agent 0x47 "Nightshade"** (the door). Enceladus, RP; lyrical and serene, a medium line then a short quotable one. **Wants**, by branch: shown his file, to see Tesseract's face when he works out that his own handwriting turned his best recruit; not shown, whatever suits him; arrested, a sentence he can survive; silent, nothing he will say. **Secret:** he still admires the man who wrote him off, and hates that he does. **Arc:** fifteen years in place, unmasked, and tonight one last payment.

> (shown) Agent 0x47 'Nightshade': He wrote fifteen years of me as a line item. In his hand. I'd know it anywhere. I learned to write like it.
> (shown) Agent 0x47 'Nightshade': That one's wrong. He gave it to me to give to you. Here's the right one, and here's the thing I was keeping.
> (not shown) Agent 0x47 'Nightshade': All of it, as promised. Every door, and where he got the idea.
> (arrested) Agent 0x47 'Nightshade': You said no deals. Netherton says otherwise tonight. I'd like to hear what you say.
> (silent) Agent 0x47 'Nightshade': Door.

**Gary Whitlock** (the workshop). Charon, Birmingham / Black Country; flat, tired, bitter jokes. **Protected:** grateful, and awkward about it; wants Imran not to end up the way Gary nearly did. **Unprotected:** recruited after St. Catherine's sacked him; wants, for once, to be listened to. **Secret** (unprotected): he hasn't built anything for them yet. He has been "testing" for three weeks and shipping nothing.

> (protected) Gary Whitlock: You saved my career. I'm Director of something now. They gave me a lanyard.
> (protected, seeing Imran) Gary Whitlock: I trained him. He was the only one who read my emails.
> (unprotected) Gary Whitlock: Seven warnings, nobody listened. You're listening now?
> (unprotected, talked round) Gary Whitlock: Three weeks I've been here. I've not shipped a thing. Call it a work-to-rule.

**Voltage, and Static** (the power room). Voltage: Alnilam, Johannesburg; low, flat, certain. Static: Umbriel, Polish-accented English, very few words. **Voltage wants** (captured) his sums checked and the inquiry to record that he did this with his own hands; (escaped) to be right. **Secret:** he has checked Tesseract's casualty sheet himself and found the same error Asante did, and said nothing.

> (captured) Voltage: You checked my sums. Now check this.
> (captured, own hands) Voltage: One thing for the inquiry. Write down that I did it myself.
> (escaped, the print) Voltage: My print. *flatly* I'm not going to argue with my own thumb.
> (then HaX, who said it in m04's debrief) Agent HaX: I said it'd be waiting. It was.
> (escaped, the sheet) Voltage: I know my figure to one decimal place. This one's wrong by a thousand. *flatly* I know.

**Victoria Sterling** (the gallery). Despina, RP; cool, reasonable, guilty. **Recruited:** wants to come out of tonight on whichever side wins, and says so. **Escaped:** wants to walk out with something. **Arrested:** wants Vos to lose more than she wants her sentence cut. **Secret** (recruited): she has already told Zero Day she'll be at the lock, and hasn't decided what she'll do there.

> (recruited, confronted) Victoria Sterling: Then you know I'm hedging. So is everyone.
> (escaped, threat) Victoria Sterling: I said I'd do it myself. I still might.
> (escaped, no threat) Victoria Sterling: St. Catherine's was a proof of concept. This is the rest.
> (escaped, the trade) Victoria Sterling: I walk out. Zero Day's order goes away, and I'll tell you which of these two has the lock card. Call it a refund.
> (arrested, the line) Victoria Sterling: He took my desk by Monday. He's been selling my clients twice since Tuesday. I'd rather he lost than I won.

**Ghost** (the network). Iapetus with the m02 effect; trained-out, unplaceable English; "they"; numbers as weapons. **Wants:** the lesson, still, and to leave the board clean. **Secret:** the sale is Ghost's leaving fee. Ghost is getting out of ENTROPY after tonight, and the head start is the last thing worth selling. That is why the refused branch ends with Ghost gone for good, and why a player who finds the right argument can make Ghost leave without it.

> (kept) Ghost: You kept your word. I keep mine. The east door's open. One question. Did the board ever thank you?
> (broken) Ghost: We said we'd be watching. We were.
> (refused) Ghost: I hope it's you leading it. You turned me down. Why?
> (stranger) Ghost: You don't know me. That's rather the point. Two hours' head start, five buyers, one of them a hospital's worst day.

### 3.6 The bunker's people

**Dr Abena Asante** (server hall; media room on the Mercer branch). 45, Ghanaian-British, from Peckham; a systems engineer who wrote the release pipeline. Voice: Autonoe, South London, crisp, proud of good work. **ENTROPY, a true believer** of the engineer's kind: she thinks the Publication is the most honest piece of software ever shipped. **Wants:** it to run cleanly. **Secret:** she corrected his casualty sheet upwards and he signed the old number; she told herself that was his business. **Monologue beat** (talked into showing the schedule):

> Dr Abena Asante: I wrote it. I'd write it again.
> Dr Abena Asante: Every vendor patches in a week, because they have to. You lot have been asking nicely for thirty years.
> (the sheet) Dr Abena Asante: I corrected his sums. He thanked me. *pause* That's between him and the sums.

**Dr James Mercer** (server hall, at large; m07's Blackout). Iapetus (en-US), professorial. One line, then hostile:

> Dr James Mercer: When the fourth submission is declined, agent, somebody does this.

**Pieter Vos** (gallery). 50s, Dutch, from Rotterdam; Zero Day's broker, who took Victoria's desk "by Monday". Voice: Sadachbia, Dutch-accented English, flat, courteous, bored by ideology. **Wants:** delivery. **Secret** (from Victoria, arrested branch): he has been reselling Zero Day's early access to a second buyer and skimming the difference.

> Pieter Vos: I don't do philosophy. I do delivery dates.
> (KO branch) Pieter Vos: You put Sterling in hospital. I sent flowers. Business is business.
> (Victoria's secret used) Pieter Vos: *pause* Who told you that. No. Don't. I'm leaving. The order goes with me.

**Imran Siddiqui** (workshop). 26, British-Pakistani, from Sparkhill, Birmingham. Voice: Puck, Birmingham; quick, bitter, young. **Not a true believer:** a recruit with a grievance, found by the Initiative six months after St. Catherine's board blamed IT. **Wants:** someone to admit the board was wrong. **Secret:** he has noticed the bench ships some units "to people, not stores" and kept it to himself.

> Imran Siddiqui: They sacked the whole team and kept the board. You'd have taken this job too.
> (Gary there) Imran Siddiqui: *quietly* You weren't supposed to be here, Gary.
> (talked round) Imran Siddiqui: Half the bench goes to a supplier. Some go to people. Names, not stores. Look at the log.

**Wendell Briggs** (power room). 63, white Montanan, from Great Falls; kept the bunker's plant running for the government in the eighties. Voice: Algieba (en-US), rural Montana, slow and laconic. **Innocent.** He thinks the servers belong to a data company. **Wants:** the week's pay. The player should feel protective of him.

> Wendell Briggs: Kept this plant alive for Uncle Sam all through the eighties. They paid better this time.
> (told what the servers are for) Wendell Briggs: *pause* Well. Which switch do you want, son. Or ma'am. Whichever.
> (06:00) Wendell Briggs: Do I still get paid for the week?

**Guards and technicians.** The cells' people, hired muscle and contractors, mixed ages and backgrounds; generic sprites varied per room (stage 5). They were told to let 0x00 through to the core and not told why, so they fight. Two or three barks each, plain, and never gendering the player: "That's the one off the wall." / "Nobody said let them through armed."

**Social Fabric's media crew** (media room, Fracture uncovered). Two or three, young, fast-talking, a lead voiced by Laomedeia (en-US). Their story is already written; they are only pressing send.

> Media lead: It writes itself. Rogue agency, private land, bodies. We just picked the photo.

## 4. Cast at a glance: age, background, voice

Cast diversity rule: vary ethnicity, age and look across the mission's cast; recurring characters keep their own sprite key and voice. New voices are proposals for the `tts-audio` stage; each new style names its accent and says "consistent throughout".

| Character | Age, background | Side | Voice (Gemini) | New? |
|---|---|---|---|---|
| Dr Adrian Tesseract | 60s, origin unplaced | ENTROPY | Sadaltager, no fx: "ENTROPY's planner, a man in his sixties, in person at last, seated, with nothing left to hide but his reasons. Deliberately unplaceable, an educated, faintly mid-Atlantic English with every regional marker sanded off; keep it consistent throughout. Low pitch that never lifts; quiet, slow, a lecturer's precision; courteous. When a point lands against him he slows further and gives up exactly what was proved." | sprite new |
| Agent HaX | late 30s–early 40s, British | SAFETYNET | Aoede, RP | – |
| Director Netherton | late 50s, British | SAFETYNET | Charon, RP | – |
| Marisol Quintero | 52, Mexican-American, El Paso | SAFETYNET | Sulafat (en-US), West Texas | new |
| Halina Kowalczyk | 47, Polish-British, Ealing | WREN | Pulcherrima, West London with Polish family vowels | new |
| Dev Malhotra | 33, British-Indian, Hounslow | SAFETYNET | Achird, West London | new |
| Kenji Arakawa | 41, Japanese-American, Seattle / Billings | SAFETYNET | Zubenelgenubi (en-US), Pacific Northwest | new |
| Vector | m08 | SAFETYNET | Iapetus, educated Glaswegian | – |
| Phantom | m08 | SAFETYNET | Fenrir, light educated Ghanaian English | – |
| Nightshade | 38, British (m08) | ENTROPY, caught | Enceladus, RP | – |
| Gary Whitlock | m02 | by branch | Charon, Birmingham / Black Country | – |
| Imran Siddiqui | 26, British-Pakistani, Birmingham | Initiative recruit | Puck, Birmingham | new |
| Voltage; Static | m04 | Critical Mass | Alnilam, Johannesburg; Umbriel, Polish-accented | – |
| Wendell Briggs | 63, white Montanan | bystander | Algieba (en-US), rural Montana | new |
| Robert Vance (phone) | m04 | ally | Orus, Teesside | – |
| Elena Rodriguez (phone) | m07 | turned | Leda (en-US), Californian | – |
| Dr Abena Asante | 45, Ghanaian-British, Peckham | ENTROPY | Autonoe, South London | new |
| Dr James Mercer | m07 | ENTROPY | Iapetus (en-US), General American | – |
| Victoria Sterling (in person or phone) | m03 | by branch | Despina, RP | – |
| Pieter Vos | 50s, Dutch, Rotterdam | Zero Day | Sadachbia, Dutch-accented English | new |
| Ghost (phone) | unplaceable | Ransomware Inc. | Iapetus + fx | – |
| Social Fabric media lead | 20s, American | ENTROPY | Laomedeia (en-US) | new |
| Guards | mixed | ENTROPY's hire | Schedar, Rasalgethi, Kore, Vindemiatrix, varied | – |

Nightshade's age above is a placeholder from his m08 file (23 at recruitment, fifteen years in); stage 6 checks it.

**Voice clashes to settle at the audio stage** (the rule: no `voice.name` reused by two characters who appear together):

- **Charon** is Netherton's and Gary's. They never share a room until 06:00; stage 7 keeps Gary's 06:00 line out of Netherton's scene.
- **Iapetus** is Ghost's (with an effect), Vector's and Mercer's. Ghost is phone-only with the m02 effect; Vector and Mercer can't meet (Vector is never in the server hall when Mercer is there, by staging). If that can't hold, Mercer's one line moves to a different voice and the audio stage notes it.
- **Algieba** was Derek Lawson's (m01). Derek is never voiced in m10 (Tesseract quotes him), so Wendell may use it.

## 5. Atmosphere, act by act

The bunker was built in the 1960s to outlast a war and refitted last year with ENTROPY's money. Every room shows both: Cold War concrete, steel doors with wheel locks, painted stencils (FALLOUT SHELTER, NO SMOKING, a civil-defence yellow), and on top of it new cable trays, new readers, new screens, all slightly too clean. Stage 5 tries m04's `room_aes_*` plant, workshop and security tiles and m07's `room_pnw_*` first (stage 0 §4). Lighting is for the lighting skill; the notes below say what each room should feel like.

**Act 1: outside, then the first room below.**

- **The forward post.** Night, cold, open sky, wind on the fence. Two vans with their side doors open and the inside lights on, a folding table, a screen with two times on it. The gate at the far end under one sodium lamp. Everyone talks a little quieter than they need to. The only warm thing is the vans' light.
- **The blast door and the tunnel.** The door grinds. The tunnel is long, damp, lit every ten metres by caged bulbs; the guard post is a desk, a kettle, a rota sheet. Sound carries.
- **The security office.** Fluorescent, low ceiling, a wall of monitors and a duty board, the player's own photo pinned among the shift notes. It should feel like walking into a room where people were talking about you a minute ago.

**Act 2: the floors. Busy, hot, loud.**

- **The workshop floor.** Benches, solder fumes, racks of half-built crackers, a whiteboard of part numbers. The casualty sheet pinned above the bench where the people who build his tools can see it. It looks like any small electronics firm, which is the horror.
- **The power room.** The oldest room: Bakelite switches, dials with needles, a battery room behind mesh, a hum the player feels. The new feed bolted onto the old plant with cable ties.
- **The server hall.** The old command room. The 1960s plotting board still on the wall, a map of a war that never came; racks where the map tables were; the schedule on the console. The sealed section's hatch in one corner, painted over and then opened.
- **The media room.** Dark, or lit only by the crew's screens and a story running. On the dark branch, one desk lamp on the drafted story and the player's face.

**Act 3: quiet.**

- **The gallery.** A walkway above the core's roof, narrow, with slit windows down into it. No HaX, no music, the guards' footsteps on steel. Through the slits, the top of a grey head at a console.
- **The core.** Plain concrete, one console, one terminal, one chair he is sitting in and one he isn't. Nothing on the walls. The clock frozen on the display. The quietest room in the game.
- **06:00 at the forward post.** Floodlights now, engines running, people sitting on bumpers. The display on the table reaching six and doing nothing.

## 6. How each carry-over feels when it lands

The user's test: the player should feel their earlier choices in who turns up, who helps, who betrays, what's possible and what's said to them, and never as a roll-call. The rule that delivers it: **every carry-over lands as an event in a room, said by someone with a reason to say it, at the moment it matters** (FA §3 rule). Below, the feeling each one is built to produce, so stage 7 can check a line against it.

| Carry-over | Where it lands | The feeling |
|---|---|---|
| Nightshade's fate, and whether the player sent him his file (m08, m09) | the door, first thing | **Consequence, immediately.** The first person the player meets tonight is someone their choices put there, and what he gives them depends on a choice made two missions ago. Shown his file: vindication, a little chilling. Not shown: unease that turns into a locked door. Silent: a single word that sticks. |
| Ghost (m02) | the security office handset | **Being remembered by an enemy.** Kept deal: a debt honoured, almost warm. Broken: "We said we'd be watching." The player feels watched. Refused: respect between opponents. Stranger: a cold new voice, so a m02 player knows what they missed. |
| Gary (m02) | the workshop | **A good deed coming back**, or a bad one. Protected: gratitude from someone the player saved, and a chance to save someone else the same way. Unprotected: the man they left behind is working for the enemy, and still right. |
| Voltage (m04) | the power room | **An enemy made useful, or an enemy waiting.** Captured: the strange trust of letting him near the switchgear. Escaped with the print: the small, hard pleasure of a proof that holds. |
| Victoria (m03) | the server hall line, the gallery | **Loyalty tested.** Recruited: the player decides whether she is theirs, in the one room where HaX can't help. Arrested: an enemy offering an enemy, and the player choosing whether to profit. Escaped: a trade between justice and harm. |
| Disclosure at Albion (m04) | his first line; the second exchange | **The season's argument arriving.** A full-disclosure player hears their own choice called his lesson, and then gets to use it against him. A quiet player hears "You understand me better than you admit." and has to sit with it. |
| m07's team and stance | the backdoor, the media room, his third line, the projection desk | **Old arithmetic.** Austin uncovered: the cost of a choice made under a countdown, still running ("Day thirteen. Eleven counties."). Hardened: the numbers the player demanded, on a desk, usable. |
| m01's day one | his second line; the clean-first-day answer | **How far back he has been watching.** A small shock: he knows what the player did on their first day. |
| The Reading and the confession (m09) | the third exchange; HaX at the core | **The handler's trust paying off.** "Put me on speaker" is the season's most earned moment: the player hands their handler the floor against her teacher. |
| Vector and Phantom (m08) | the briefing; the team | **Being forgiven, or not.** Present: people the player once suspected, standing beside them, and useful. Absent: Netherton's one line about why, and an empty place in the van. |
| WREN (m09 named) | the briefing's cold open | **A job already done.** The player watches the arrest they made possible, and gets to skip the hunt. |
| The freeze (m06) | the fence; his line at the core | **Small, satisfying cause and effect.** Two empty posts and a gap in the fence, named the moment the player sees them. Later he admits it cost him. |
| Props: Reeves, Hollis, Static's kit | rota sheet, duty board, bench | **The world keeps its loose ends.** A name the player knows, on a sheet, and one line from HaX. Never a scene. |
| The closing card and the credits | the end | **The season seen whole, once**, after the scenes have done the work. |

**What must never happen.** A line that tells the player about a choice they didn't make (every at-large or penalising default also needs `completed`, FA §3); two carry-overs announced back to back by the same speaker; HaX listing the player's history.

## 7. Pacing and tension

**The shape.** A slow cold open, then a long rising siege, then a sudden drop into quiet, then a conversation that is the climax. The finale's biggest risk is spending its tension in Act 2 and arriving at the core tired. The quiet gallery is there to reset the player before the most important ten minutes of the season.

| Stretch | Tension | What carries it |
|---|---|---|
| Briefing and the door | low, rising | the two times on the screen; the invitation; Quintero's objection; the first returning face |
| The fence, 02:10 | held | a small human beat (Arakawa's call) while two people walk into the dark; the player doesn't know yet that they are watching the crime |
| Flag 1 and the blast door | rising | the door opening for the player by name is the act's first chill |
| Security office | high | the photo on the wall; guards; Ghost's call; clue 1 |
| Workshop, power room | high, varied | two full scenes; each is a pause inside the noise, a conversation in a room full of hostiles |
| Server hall | peak | the schedule read aloud, then HaX stops reading; the head start's warning; the peel-off; the countdown at its loudest |
| Gallery | drop to silence | HaX gone, no music, one room, one door, one person (Victoria or Vos), footsteps |
| The core: arrival and flag 4 | quiet, intent | the clock stopped; his idle lines; the player working while he watches |
| His case, the exchanges | the climax, very quiet | each landed point removes a little sound; a miss changes nothing |
| The console, WREN, the database, the end | sharp spikes inside the quiet | WREN's entrance is the only loud moment at the core; the dead-man switch is the only fast one |
| 06:00 | release | the hour arriving with nothing published |

**Pacing rules for stage 7.**

- **Full scenes are two or three minutes.** Hubs, not monologues: the player chooses what to ask and when to leave, with a sticky exit.
- **One returning face per room.** Never two full scenes in one room.
- **The clock is said, never shown as a threat the player can lose to.** People say "ninety minutes", "under an hour", "fifteen minutes to their head start" at the beats in arc §2. Nothing ends the mission on time.
- **The countdown display steps on beats**, so the player feels the night move as they make progress, not as they stall.
- **Tesseract's case is short.** Three record lines, six on the Publication, two on the offer. The exchanges carry the weight.
- **After a big moment, a short line.** HaX's habit (a long line, then a very short one) is the mission's rhythm too: the blast door opens, and Quintero says one sentence.

## 8. Music cues

The engine's music block switches between whole playlists on events (`scenario.json.erb` `"music"`, as m01, m02 and m07 do). The playlists that exist today (`public/break_escape/js/music/music-config.js`): `noir`, `threat`, `spy-action`, `cutscene`, `vocals`, `end`, `victory`. There is no layer control, no volume step and no "silence" playlist. The cues below use what exists where it can, and mark what needs new work **[new]** for stage 4 and stage 9 to cost (the user may prefer a simpler version).

| Beat | Cue | Trigger (story event, never time) |
|---|---|---|
| Briefing (cutscene) | `cutscene` | `game_loaded` before the briefing is done |
| Forward post, the door, the fence wait | `noir` | the briefing's end |
| The breach: flag 1 and the blast door | `spy-action` | flag 1's global |
| Any hostile sees the player | `threat`, back to `spy-action` when clear | the engine's usual hostile cue |
| Ghost's call, a full scene in progress | no change | a conversation doesn't move the music, so the scenes feel inside the raid |
| Server hall, flags 2 and 3 | `spy-action` stays | – |
| HaX's last line before the jam | fade to silence **[new: a silent playlist or a stop event]** | the gallery door's open event; fallback: `noir` at its quietest track |
| The gallery | silence | – |
| The core: arrival | a held, low cue **[new: a `core` playlist of one long quiet track]**; fallback `noir` | entering the core |
| He stops the clock | the countdown display's tick cuts dead (sound effect, not music) **[new SFX]** | the arrival line |
| Each landed point | one step quieter: first point, `core` to a sparser track; second point, silence **[new: two `core` variants]**; fallback: one switch to silence on the second point | `points_landed` changing |
| WREN comes through the service door | `threat`, a few seconds, then back to whatever the core was playing | her entrance event |
| The database choice, the end for him | whatever the core is playing; no new cue | – |
| Lethal force | silence, held | the line |
| Scorched Earth: the purge in the dark | `threat`, cut when the lights come back | the purge event |
| 06:00, success endings | `victory`, starting as the display reaches six | the 06:00 beat |
| 06:00, Scorched Earth; the Join close at the Citadel | `end` (the cold close) | the ending's global |
| Credits | `end`, or `victory` on a success (stage 9 chooses one) | the credits |

The core is the one place where music is part of the gameplay: it is how the player knows a point landed. If the new playlists are cut, the narrator's first-time line and Tesseract's pause still carry it, and the second landed point drops to silence with the existing tools.

## 9. Notes for stage 7

- **Speakers.** Each prefix is the NPC's exact displayName. Tesseract's is new (`Dr Adrian Tesseract`); the m07 handset's `The Architect` is not reused for him in person. Phone inks take no prefix for the contact (ink bug 4).
- **Fixed strings only.** Every record line and every per-branch line is its own string; nothing prints a variable aloud.
- **No pronoun for WREN** before the accusation, anywhere the player can read or hear it (arc §4). Nobody genders the player.
- **Tesseract calls HaX "Ninety-nine"**, and nobody else does. He says "Halina" once. Kowalczyk says "Adrian" once.
- **The line** ("Let it hurt afterwards, not during") is said by him once, in the third exchange, and by HaX on the speaker branch in her own words. Nobody else says it in m10. Voice bible: once per mission.
- **One villain "Not X. Y." per scene at most**; none from anyone else.
- **Asterisk cues** at m01's density (about one per 37 lines), never on a line with a number. Tesseract's `*pause*` on a landed point is the one repeated cue, and it is the point.
- **Each scene's KO case is written**: a downed Victoria, Voltage, Gary, Imran, Wendell, Asante, Vos or raid member leaves a line or a prop that admits it (`globalVarOnKO`), never a line that assumes them standing.
- **Status answers branch to the step.** HaX's "where are we" and the countdown lines are read at every beat in arc §2 (ink bug 11).
- **Read the cold start cold.** The m10 briefing for a player who never played m09 (or anything) is read by a reviewer with no other mission in mind (FA §13 item 16).
- **Stage 1 dependency.** The globals listed in arc §13 are proposals; stage 3 may rename them, and this file's samples follow whatever it settles.
