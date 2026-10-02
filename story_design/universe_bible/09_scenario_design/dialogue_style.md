# Dialogue style guide

How Break Escape characters should talk. Use it when you write or edit any ink script.

Three documents work together:

- `README_ink_best_practices.md` covers the mechanics: speaker prefixes, hubs, sticky choices, tags, `#exit_conversation`, consequence wiring. If this guide and that file disagree on a mechanical point, that file wins.
- `story_design/universe_bible/04_characters/voice_bible.md` says how each recurring character sounds. Read their entry before you write a line for them.
- This guide covers the craft: what to say, in what order, at what length, and what to cut.

The target is a British spy thriller on television, played as a game. Scenes start late and end early. People say less than they mean. The player can always find out what to do next.

m01 (`scenarios/m01_first_contact/ink/`) is the house example and is not edited (its audio is cached). m02 is the most finished later mission. Where they differ, follow m01 for economy and m02 for texture.

## 1. Every line has a job

Every spoken line has to do at least one of four jobs:

1. **Information.** It tells the player something they need: what to do, where, what it's for, what it costs.
2. **Character.** It shows who this person is, through what they notice, what they avoid, how they phrase it.
3. **Tension.** It raises the stakes, starts a clock, or opens a question the player wants answered.
4. **Humour.** It gets a laugh, or at least a breath out. Dry is the house flavour.

The best lines do two at once. Kevin in m01 delivers a puzzle hint and a whole personality in one breath:

> Kevin Park: Oh hey! You found the IT room. I'm Kevin—IT manager, sole IT department, and professional worrier.

A line that does none of the four goes. The usual offenders:

- **Throat-clearing.** "Okay, so.", "Right, listen.", "Let me tell you something." Start on the content.
- **Restating.** Saying again what the player just read, chose or did. If they picked "I found the password list", the NPC doesn't say "So you found the password list."
- **Acknowledgement padding.** "Good.", "Understood.", "Copy that." are fine as one-word answers before a real line. As a whole line they are a wasted click.
- **Sign-off sermons.** A last line that sums up the scene's moral ("Remember, trust is the real vulnerability."). End on the last thing that matters.
- **Repeated stakes.** The player heard "people will die" in the briefing. Every NPC who says it again makes it smaller.

Test: read the conversation aloud with the line deleted. If nothing is lost, leave it deleted.

## 2. What m01 gets right

m01's spoken lines have a median length of 12 words; nine in ten are 18 words or fewer. (m02 runs to 15 and 32, m07 to 19 and 35.) Most of what makes m01 work follows from that.

**Directions come early and plainly.** Sarah hands over the badge and key, then says where to go next:

> Sarah O'Brien: Kevin should be in the IT room. It's through the main office, on the east side. (`m01_npc_sarah.ink:58`)

Asked again, she adds the obstacle and the way round it in three short lines: keypad lock, Kevin knows the code, there's a maintenance checklist in the main office (`:89-91`).

**Hints come as gossip.** Sarah never says "search the manager's office". She says Patricia was fired for asking about Derek, and "Her briefcase is still in there. They escorted her out so fast she couldn't take everything." (`:173`). The player gets a lead and the receptionist gets a point of view.

**Humour from character.** "I'm Kevin—IT manager, sole IT department, and professional worrier." (`m01_npc_kevin.ink:40`). "We just... made sure we got the contract." (`m01_opening_briefing.ink:119`).

**Short reactions to big news.** When the player reports Operation Shatter, HaX says "...Say that again." then "Operation Shatter. Christ." (`m01_phone_agent0x99.ink:348,356`). Kevin, told he is being framed, says "Say that again." and then just "*quietly* Patricia." (`m01_npc_kevin.ink:244`). Shock is shown by how little they say.

**Debrief lines that hold back.** If the player let the attack run, HaX opens with "I'm going to assume Derek triggered a failsafe before you reached him." followed by "I'm not prepared to consider that yet." (`m01_closing_debrief.ink:59-61`). If they confess, she says only "..." and "I see." She never lectures.

**Clocks stated as facts.** "Sunday. 6 AM. That's when the messages go out." / "You have three days to stop it." (`m01_npc_maya.ink:106-107`).

**Choices are the player's own words, and there are no echoes.** No m01 NPC file follows a choice with a `You:` line repeating it.

m01 is not perfect, and these weaknesses are not to be copied:

- Some handler hub choices are menu labels, not speech: `[Lockpicking guidance]`, `[SSH brute force help]` (`m01_phone_agent0x99.ink:118,120`). Write `[How do I get through this lock?]` instead.
- The briefing calls Maya "the journalist" (`m01_opening_briefing.ink:207`). She is a content analyst everywhere else. Check facts across files.
- Derek's monologue runs to 42-word lines and makes the same argument in four beats. A villain gets room (section 6), but each beat must move.
- The Derek endings script the player's speech in `Player:` lines after the choice. Put those words in the choice (section 7).

## 3. Gameplay information comes first

A player who closes a conversation without knowing their next move has been let down by the writer, however good the banter was.

**Lead with it.** If an exchange carries something the player must act on (a place, a code, a name, an item, a deadline), it goes in the first or second line of that exchange. Colour comes after. Players skim and click through; the end of a long exchange is where information gets lost.

**Be concrete.** Say the room, the object and the person. "East side of the main office" beats "somewhere nearby". "The briefcase in Patricia's office" beats "something she left behind".

**One fact per line.** If a line carries a location and a code and a warning, split it, or cut the warning.

**Keep it apart from banter.** A joke that wraps around a directive hides it. Put the joke before or after, never round it.

Before (`m04_phone_agent0x99.ink:359`), an objective read out from a task list:

> Identify compromised systems, enumerate services, find their attack mechanism.

After, it says what to do first and where:

> Agent HaX: Start with the backup server on the workshop terminal. Find out what's listening on it.

Before (`m07_phone_agent_0x99.ink:504`), correct but buried, with a tacked-on fragment at the end:

> Agent HaX: The name from the share, the password from the listener. Check port 22 answers, ssh in with that one account, then look in its home directory. One username, one password: no guessing.

After:

> Agent HaX: You've got a name from the share and a password from the listener. That's one login. Use it on port 22 and look in the home directory.

**Make it findable again.** Anything on the critical path has to survive the player missing it once. At least one of these must hold:

- the handler hub can repeat it (section 4);
- it's written on an object in the world (a note, a whiteboard, a file);
- the objective or task text names it.

Don't make a one-time, non-sticky line the only place a code or location is given.

**Don't contradict the map.** Directions go stale when rooms move. After any layout change, re-read every "north of", "past the" and "through the" against the scenario's `connections`.

**Security content stays at citation level.** Where a line touches a technique, point at the field guide or lab sheet ("The sudo route's in the guide I've sent") rather than spelling out steps in dialogue.

## 4. Hubs, repeat visits and the handler

The player comes back to the same NPC many times, often just to check something. Write the second visit as carefully as the first.

**First visit and later visits are different scenes.** The first meeting introduces. Later visits skip straight to business. m01's Sarah: first time, "Hi! You must be the IT contractor. I'm Sarah, the receptionist."; afterwards, "Hey, need anything else?" (`m01_npc_sarah.ink:22,27`). Never replay an introduction.

**Return greetings: short, varied, in character.** One line, ideally with a sequence so it doesn't repeat word for word: `{&What do you want to know?|What else?|Ask.}` (m02 debrief). A return greeting can also reflect what has changed: a nervous NPC more nervous after an alarm, a guard more suspicious after a lockpick.

**Hub choices are a menu the player reads every visit.** Keep each one short (under about ten words), first person, and different in intent at a glance. Three to five topics plus a way out.

**Retire spent topics, keep repeatable facts.** Gossip and backstory can disappear once heard (`+ {not asked_x}`). A fact the player may need again (a code, a location, who holds a key) stays available as a sticky choice, or is repeated in a shorter form on the second ask.

**The handler hub is a progress hub.** The phone handler's choices should follow where the player is in the mission, as m01 and m02 do: a question appears when the player meets the obstacle and goes when they're past it. Guidelines:

- A hint choice is phrased as the question a stuck player would ask: `[Any tips for getting into the server room?]`, not `[Server room help]`.
- The answer opens with the next action. Encouragement, if any, comes after.
- When a hint retires after one use, make sure the same information is somewhere the player can find it again (an object, a task's text, or a general "What should I be doing?" choice that answers from current progress).
- Give field guides on request, one per choice, worded as an ask: `[Can you send me the SSH field guide?]`.
- The exit is one line: `[I'm good for now]` → "Copy that. Call anytime." (`m01_phone_agent0x99.ink:132-134`).

**Exits are one or two lines.** The player is trying to leave. "Be careful. Derek's paranoid." is enough.

**Barks are fragments.** A bark is something overheard: under ten words, no greeting, no exposition, and it should still make sense on the fifth hearing. Write it as the middle of a thought ("Third time this week the reader's dropped me."), not the start of a speech.

## 5. Subtext and exposition

In a spy thriller almost everyone is hiding something: an informant from her boss, a mole from his colleagues, a handler from her own fear. People rarely say exactly what they feel. They say something next to it.

**Let the line point at the feeling.** Before:

> Agent HaX: I'm really worried about you and I'm upset that one of my friends could be the traitor.

After (`m08_agent_0x99.ink:21`):

> Agent HaX: Don't say anything kind, I'll come apart.

**Use what people do and don't say.** Kevin's whole reaction to being framed is "*quietly* Patricia." Maya opens every later visit with "*glances at door* Is it safe to talk?" That tells you she's frightened without her saying so.

**Exposition must have a reason to be spoken.** Ask of every explanatory line: why would this person say this, to this person, now? Good reasons are that the listener doesn't know it, the speaker wants something, or the speaker is under pressure. "As you know..." lines, where two people tell each other what both already know for the player's benefit, fail every time.

**Hand exposition to the person who would have it.** The receptionist knows who works late. The IT manager knows whose password is weak. The handler knows the cell's history. A receptionist explaining Zero Day Syndicate's business model is a writer talking.

**Put background in the world.** Ledgers, emails, whiteboards and letters can carry detail that would choke a conversation. The NPC points at it: "Read what they left on Kim's screen." (m02 text message).

**Let conflict carry facts.** Information delivered in an argument, a negotiation or a confession is remembered. The same information in a polite Q&A is skipped. Ghost's numbers in m02 land because Ghost is using them as a weapon: "I showed my working. They didn't." (`m02_phone_ghost.ink:98`).

**Trust the player.** If they've read the casualty projections, the NPC doesn't need to recite them. Refer to them. If the player has worked something out, let the NPC notice ("You've already worked it out. So have I.") rather than explain it.

**Subtext never hides gameplay information.** People may be evasive about their feelings, never about the door code they're giving you. Section 3 always wins.

## 6. Briefings, debriefs and villains

### Briefings

A briefing answers four questions, in roughly this order: what's happened, why it's ours, what you're doing, and how you get in. Everything else is optional, and goes behind a question the player can choose to ask.

- **Open on the situation, not the greeting.** m02: "St. Catherine's Regional went dark at 02:47 this morning." is the second line. Netherton's welcome is two lines and hands over: "HaX -- it's yours."
- **Stakes once, concretely.** A number, a clock, a place. "Forty-seven people are on life support in there right now... Twelve hours of power." Don't restate it later in the scene.
- **Objectives as a short list in speech**, not bullet points: "Three things, then." followed by one line per thing (m02).
- **Optional depth goes in a question hub.** The cell's history, the target's background and the cover story's details are questions the player can ask or skip. Every route must still reach the objectives.
- **End on the first action**, not a pep talk. m01's briefing closes by pointing the player at Maya: "Talk to Maya. She's your best lead."
- **Netherton and Nightshade cameos** (m02–m06) are two to four lines each. Netherton frames the stakes in a sentence and hands over. Nightshade gives one technical image the player will remember. Then HaX runs the detail.

### Debriefs

A debrief is where choices pay off. Keep briefing material out of it.

- **Lead with the outcome the player most wants to know**, in one or two lines, then the cost.
- **Reflect the player's choices by name.** "You told Kim to hold the line..." is worth more than a paragraph of general praise. Every `#set_global` the mission sets should be read here or somewhere else.
- **Don't grade the player in adjectives.** "Excellent work" says nothing. Saying what their work made possible ("Derek's signature on the death calculations. The Architect's approval.") is the praise.
- **Bad outcomes get restraint.** The quieter HaX is, the worse it was. "I see." beats a speech.
- **One hook to the next mission, at the end.** Then stop.

### Villain monologues

A villain gets more room than anyone else, and has to earn every line of it. The rules:

- **The villain wants something from the player in this scene**: to be understood, to recruit them, to make them doubt, to buy time. A monologue with no goal is a lecture.
- **Every beat adds a new idea or a new fact.** Derek's m01 speech makes the same "trust is a lie" point in four beats. Two would hit harder.
- **Give the player a way out of the speech at each beat.** m01 does this well: every monologue knot offers an exit such as `[Stop talking. This is over.]` alongside the options that engage.
- **Let the villain be specific and calm.** Numbers, names, details the player recognises. Ghost (m02) and the Architect (m07) frighten because they are precise and unhurried. Neither of them rants.
- **Give them one line that's hard to answer.** Ghost: "I showed my working. They didn't." Nightshade (m08): "I'm not asking you to forgive the sum. I'm telling you I did it with my eyes open."
- **Keep lines to the length limits in section 9.** Write a long speech as many short lines.
- **Villains may use rhetorical contrast** ("That's not murder. That's optimization.") because it's how ideologues talk. Once per scene, as a character habit. Heroes and narration don't.

## 7. Player choices

The mechanics (brackets, `+` and `*`, `#set_global` wiring) are in `README_ink_best_practices.md`. This section is about the words.

**A choice is what the player says out loud, in the first person.**

| Avoid | Write |
|---|---|
| `[Ask about security]` | `[What's security like here?]` |
| `[Sympathise with Marcus]` | `[You warned them. That's not on you.]` |
| `[Express readiness]` | `[I'm ready. What's the mission?]` |
| `[SSH brute force help]` | `[How do I get into that SSH login?]` |

**No `You:` echo lines.** The engine already shows the chosen text as the player's line. Don't follow a choice with a `You:` line that repeats it or says the "real" version. Before (`m05_npc_lisa_park.ink:43-46`):

```ink
+ [I'm interested in David Torres.]
    You: Can you tell me about David Torres?
    Lisa Park: David? Oh, poor David.
```

After:

```ink
+ [Can you tell me about David Torres?]
    Lisa Park: David? Oh, poor David.
```

**No scripted player speeches either.** A short bracket followed by `You:` lines that carry on talking (m03's Danny scene, m01's Derek endings) puts words in the player's mouth they didn't choose. Put the full speech in the bracket. If the player needs to say more after the NPC answers, offer a one-option choice so the player clicks to say it:

```ink
Danny Foster: *shakily* You'd do that.
+ [Sterling goes down for what she did. You don't have to go down with her.]
    Danny Foster: Everything. Yes. God, yes.
```

**The one exception is non-verbal.** `[Say nothing.]`, `[Walk away.]` or `[...]` may be followed by a `You:` or `Narrator:` line describing the silence or the action.

**Distinct intents.** Each option in a set should be a different move. Three phrasings of one move are one choice. A useful default is Jon Ingold's three: **accept** (go along with the topic, answer, cooperate), **push** (his "reject": challenge, accuse, press harder) and **deflect** (change the subject, joke, stall). Two options feel binary; five dilute the choice.

Before, three choices that all mean "go on":

```ink
+ [Tell me more.]
+ [Go on.]
+ [What else?]
```

After, three different moves:

```ink
+ [Who else knows about this?]
+ [You're telling me this now? Why not last week?]
+ [Let's start with what you need from me.]
```

**Choices that matter.** Somewhere the story should notice the choice: a different line, a remembered stance, an item, a debrief callback. Information choices in a briefing are fine as they are, since what the player learns is the consequence. Stance choices in front of an immovable character are fine if a variable records the stance. A choice that changes nothing and records nothing is decoration; cut it to one option or wire it up.

**Keep choices short.** Under about 15 words, so the player can scan the set in a second. A long, loaded choice is right for a big moment (an accusation, the final confrontation), and m01's `[I have everything. The archive. The network map. The Architect's letter. It's over, Derek — what happens next is up to you.]` earns its length. Most choices should not.

**The player character's voice.** Agent 0x00 is competent, polite with civilians, direct with villains, and never smug. Give every set at least one option a professional would say. Avoid making the cold option cartoonish ("These people are expendable.") so that it's an obvious trap; make it the efficient choice that costs something.

**Don't promise what the branch doesn't deliver.** If the choice says `[I'll make sure you're protected]`, something later in the mission should either honour that or call out that it didn't.

## 8. Texts, calls and face-to-face

Break Escape has three channels, and each has its own length and manner.

**Timed texts** (`sendTimedMessage`, `timedMessages`) arrive while the player is doing something else, and they're one-way.

- One to three short sentences, under about 30 words in total. Lead with the fact.
- Write them as a text: fragments are fine, no greeting, no sign-off.
- If a text needs a paragraph, it should be a call the player can choose to make. Offer it: "Call me when you've read it."
- m01's texts set the standard: "That door's locked. A lockpick or a spare key would get you in." Several m02 texts run past 50 words; trim those.

Before (m02 text, 58 words):

> Reminder on the doors in there. Nobody can badge you through anything -- the access control server is encrypted with the rest of it. That leaves you two ways past a lock: get a human to open it, or open it yourself. You're carrying a pick kit for the second one. Want the field guide on pin-tumbler work? Just ask.

After (25 words):

> No badge opens anything tonight. Get someone to open a door for you, or pick it. People first. Ask if you want the lockpicking guide.

**Phone calls** (a phone NPC's ink, via the handler hub). Spoken by TTS, one line at a time, in the phone UI.

- Shorter than face-to-face: aim for 8–15 words per line, at most three lines before the next choice.
- Calls are working conversations. Answer the question in the first line.
- No stage directions about faces or rooms; it's a voice on a line. Use delivery cues (`*quietly*`, `*a breath*`) sparingly.

**Face-to-face** (person NPCs, briefings, debriefs, confrontations). Portrait, speech bubble, voice.

- The most room, and the only place for set pieces: a confession, a monologue, a debrief.
- Physical business goes in a `Narrator:` line only when it matters to the scene (an item handed over, a door blocked). Small delivery cues ride on the spoken line (see `README_ink_best_practices.md`, "Emotes vs. Narration").

**Narrator lines** are camera directions. Present tense, short, concrete: "Derek sets down the launch device." No moralising, no telling the player what they feel.

## 9. Line length and the TTS

Each line is one speech bubble and one TTS clip, and the player clicks to move on. Long lines read as walls of text, take longer to voice, and cost more to generate.

| Where | Typical line | Hard limit | Lines before a choice |
|---|---|---|---|
| Face-to-face | 8–18 words | 30 words | 4 (a set piece may run longer) |
| Phone call | 8–15 words | 25 words | 3 |
| Timed text | one to three sentences | 30 words in total | n/a |
| Bark | 3–8 words | 10 words | n/a |
| Choice | 3–12 words | 15 (a big moment may run longer) | n/a |
| Exit line | one line | two lines | n/a |

m01's median is 12 words per line. Aim for that.

**Rhythm.** Vary sentence length on purpose. A run of medium sentences sounds generated. Put a short line after a long one when you want it to land: "Forty-five didn't. I'm not going to dress either of those numbers up for you." (m02 debrief).

**Writing for the TTS.**

- Write numbers as they should be said when it matters: "Forty-two to eighty-five", "half past eight". Figures are fine for codes and times the player must type ("PIN 0419", "02:47").
- Spell out symbols in speech: "per cent", not "%"; "dollars" after the number where a voice would say it.
- Keep acronyms the character would really say aloud (SSH, ENTROPY, SCADA). Expand ones nobody says.
- A delivery cue in asterisks (`*quietly*`, `*dry*`) steers the voice. One per line at most, and only where the delivery isn't obvious from the words.
- Use `...` for a real pause and `--` for a cut-off. Don't use either for decoration.
- No emoji in spoken lines. (m01 texts sign some messages with a lizard emoji; see the voice bible's HaX entry.)
- Avoid lists in speech (the engine shows each item as its own click). Turn them into a sentence.

## 10. Words and habits to cut

These are the habits that make dialogue sound machine-written. They come from the humanizer rules (`~/.claude/skills/humanizer/SKILL.md`) and the project's writing rules. Apply them to every line, choice, text and narrator beat.

**Banned words.** Don't use: delve, intricate, tapestry, pivotal, underscore, landscape (as an abstract noun), foster, enhance, crucial, breathtaking, captivate, profound, steadfast, robust, testament, vibrant, showcase, garner, interplay, leverage (as a verb), navigate (for anything that isn't a route), "key" as an adjective ("a key role"), "valuable" as praise, "Additionally". Exception: where one is the precise technical term ("threat landscape" in a security report prop).

**Inflated framing.** No "a pivotal moment", "stands as a", "a testament to", "marks a turning point", "lasting legacy", "plays a significant role", "deeply rooted". Say what happened.

**"It's not X, it's Y."** The commonest tell. A rough search finds about seventy in m01–m08, 23 of them in m02. Before (`m07_phone_agent_0x99.ink:311`):

> That's not a failure of nerve, it's arithmetic, and ENTROPY built the arithmetic on purpose.

After:

> There was one team and three fires. ENTROPY built that arithmetic on purpose.

Its cousins go too: "Not just X, but Y", "This isn't about X. It's about Y.", and the two-line version where one line sets something up and the next pivots with "But". Villains may use it once per scene as a habit of speech (section 6).

**Tidy summary lines.** Cut the last line of an exchange if it restates the exchange: "That's the job.", "And that matters.", "That's what makes you better at this." The m01 debrief uses variants of that last one three times (`m01_closing_debrief.ink:334,337,383`); once would do.

**Fake transitions.** "Moreover", "Furthermore", "However", "On the other hand", "That said". People in a hurry don't signpost.

**Tacked-on -ing clauses and fragments.** "...ensuring nobody gets hurt", "...highlighting the risk". Also clipped tailing negations: "One username, one password: no guessing." Write a real sentence or cut it.

**Rule of three.** "Cold. Methodical. Precise." Three adjectives in a row, or three parallel clauses, is a reflex. Use two, or one good one.

**Fake ranges.** "From hospitals to power grids" when you mean "hospitals and power grids".

**Filler openers.** "It's important to note", "It's worth mentioning", "The thing is", "Here's the thing". Start on the point.

**Chatbot manners.** No "Great question!", "Absolutely!", "I hope that helps", "Let me know if you need anything else" in an NPC's mouth, unless the character is a customer-service AI and it's the joke (ATHENA in m08).

**Em dashes.** Not banned in dialogue (the existing scripts use `--` for interruptions), but each should be a real interruption or aside. If a comma or a full stop works, use that.

**UK English.** Colour, organise, defence, licence (noun), programme (TV, scheme), travelling, sceptical, "per cent", "Mum". Dates as "17 May". Times as "half past eight" or "20:30". **"Cyber Security"** is two words with a space. American characters (m05's Recruiter, m06's Satoshi, m07's American cast) keep American idiom in their own lines ("gotten", "parking lot") but the narration, choices and British characters stay British.

## 11. Checklist for each ink file

Run this on each ink file after editing. It assumes the mechanical checks (compile, validator, tagdiff, reopencheck) are done separately as `AGENTS.md` and the pass brief describe.

**Voice**
- [ ] Every recurring character matches their voice bible entry (diction, register, what they never say).
- [ ] Each one-mission character sounds different from the others in the mission: cover the names and you can still tell who's talking.

**Information**
- [ ] Every critical-path fact (where, what, who has it, the deadline) comes in the first or second line of its exchange.
- [ ] Each critical-path fact can be found again: sticky hub choice, object in the world, or task text.
- [ ] Directions match the scenario's current `connections`.
- [ ] Facts agree with the scenario and other files (names, roles, numbers, times).

**Economy**
- [ ] Every line does a job (information, character, tension, humour). Read it aloud without the line; if nothing's lost, cut it.
- [ ] No line restates what the player just chose, read or did.
- [ ] Stakes stated once per scene, not in every conversation.
- [ ] Face-to-face lines under 30 words, phone lines under 25, texts under 30 in total, barks under 10. Median near 12.
- [ ] Exits are one or two lines.
- [ ] Return visits skip the introduction.

**Choices**
- [ ] Every choice is first-person speech, or a clearly non-verbal action.
- [ ] No `You:`/`Player:` line after a choice, except after a non-verbal one.
- [ ] Options in a set differ in intent (accept / push / deflect is a good default).
- [ ] Each choice is noticed somewhere (a different reply, a variable read later, a callback) or is an information choice in a briefing.

**Thriller craft**
- [ ] No "as you know" exposition. Each explanation has a reason to be spoken by this person, now.
- [ ] At least one moment where a character says less than they feel.
- [ ] Villain speeches: a goal, a new idea per beat, an exit choice at each beat.

**AI tells and house style**
- [ ] Search for: `not just`, `isn't about`, `it's not`, `that's not`, `delve`, `crucial`, `pivotal`, `landscape`, `foster`, `enhance`, `robust`, `testament`, `valuable`, `ensuring`, `highlighting`, `Moreover`, `Furthermore`, `However`. Fix each hit or justify it (a villain's habit, a technical term).
- [ ] No tidy moral at the end of an exchange.
- [ ] No three-adjective runs.
- [ ] Sentence lengths vary.
- [ ] UK spelling. "Cyber Security" with a space.
- [ ] No emoji in spoken lines.

**Mechanics that the writing can break**
- [ ] Every speaker prefix matches an `id` or `displayName` exactly.
- [ ] No line starts with `*` (emotes go after the prefix).
- [ ] Tags, knot names, variables and choice conditions unchanged unless the change is logged.

Quick length check for a file:

```sh
grep -E '^\s*[A-Z][^:]{1,40}: ' FILE.ink | grep -v Narrator | sed -E 's/^\s*[^:]+: //' | awk '{print NF}' | sort -n | awk '{a[NR]=$1} END{print "median",a[int(NR/2)],"p90",a[int(NR*0.9)],"max",a[NR]}'
```

## Sources

Outside sources this guide draws on (checked October 2026):

- David Mamet, memo to the writers of *The Unit*: every scene asks who wants what, what happens if they don't get it, and why now; "as you know" exposition. Reprinted at [No Film School](https://nofilmschool.com/2010/10/david-mamet-drama-a-memo-the-unit-writers) and [SlashFilm](https://www.slashfilm.com/508254/a-letter-from-david-mamet-to-the-writers-of-the-unit/).
- "Enter late, exit early": Scott Myers, [Go Into The Story](https://gointothestory.blcklst.com/screenwriting-mantra-enter-late-exit-early-5b06e1e70bf3); [No Film School's list of screenwriting maxims](https://nofilmschool.com/screenwriting-maxims).
- Subtext and avoiding "As you know, Bob": [Helping Writers Become Authors](https://www.helpingwritersbecomeauthors.com/as-you-know-bob/); [Writing Excuses 15.19](https://writingexcuses.com/15-19-as-you-know-this-episode-is-about-exposition/).
- Jon Ingold (inkle, the makers of ink), "Sparkling Dialogue", AdventureX 2018: accept / reject / deflect choices, three options, loops and trapdoors, branching as characterisation. Notes by Robert Yang at [Radiator Blog](https://www.blog.radiator.debacle.us/2018/11/notes-on-sparking-dialogue-great.html).
- Emily Short, [Information Flow and Gradual Characterization](https://emshort.blog/2009/02/21/information-flow-and-characterization/): players need context to choose and feedback after; NPCs should say what they noticed about the player's earlier choices.
- Nessa Cannon, "Branching on a Budget", GDC 2024: choices that carry consequence, theme or character insight. Reported in [Game Developer](https://www.gamedeveloper.com/design/how-to-build-branching-narrative-when-you-don-t-have-a-big-budget-).
- [8 Key Principles of Writing Effective Game Dialogue](https://www.gamedeveloper.com/game-platforms/8-key-principles-of-writing-effective-game-dialogue), Game Developer: concision, optional lore, barks.
- On barks: [Sarah Beaulieu](https://sarah-beaulieu.com/en/writing-barks-for-video-games) and [The Narrative Department](https://www.thenarrativedept.com/blog/barks).
- AI-writing patterns: the humanizer skill (`~/.claude/skills/humanizer/SKILL.md`), based on Wikipedia's "Signs of AI writing".

In-house: `README_ink_best_practices.md`, `README_scenario_design.md`, `tools/pass2/PASS2_LESSONS.md`, `docs/agents/PASS4_BRIEF.md`, and the m01 scripts.
