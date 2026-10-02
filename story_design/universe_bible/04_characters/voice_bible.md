# Voice bible

How Break Escape's characters talk, written down so they sound like the same people in every mission.

Read a character's entry before you write or edit a line for them. The craft rules that apply to everyone (line length, choices, subtext, words to avoid) are in the [dialogue style guide](../09_scenario_design/dialogue_style.md). The character files in this folder hold background and history; where their speech notes disagree with this bible, this bible wins, because it is based on what the game actually says.

Sources: the ink in `scenarios/m01_*` to `m08_*`, the `voice` blocks in each `scenario.json.erb` (as of 2 October 2026), the character files in this folder, and the pass-3 voice audit (`docs/agents/PASS3_VOICE_AUDIT.md`). Where a character has drifted between missions, the entry says what changed and which version this bible adopts. The rule of thumb is m01 and m02, which are the most finished; m01's audio is cached, and m02's is regenerated after pass 4.

Recurring characters covered: Agent HaX, Director Netherton, Nightshade, the Architect, the Narrator and the player. Dr Chen, Agent 0x42 and the other ENTROPY masterminds have canon files but don't yet speak in m01–m08; they have a short section of their own.

## How voices are set

Each speaking NPC has a `voice` block in its scenario: `name` (a Gemini prebuilt voice), `style` (a free-text prompt the TTS acts on) and `language`. A few NPCs also have `fx` (a Web Audio effect such as `voice-distortion`). See `README_scenario_design.md`, "Casting Voices".

A recurring character's `style` has two parts:

- **Identity**: the accent guard, pitch and core manner. This must be word for word the same in every mission, so the character sounds like one person.
- **Scene**: a sentence or two about the situation in this mission ("speaking over a secure phone line", "tonight the dryness keeps slipping"). This may change.

Costs: the TTS cache key is the line's text plus name, style and language. Changing any of those for a character discards every cached line for that character in that mission. m01 has a large cache, so its voice blocks are frozen. For m02–m08, audio is generated after pass 4, so voice blocks can still be fixed (m02's were left as they are).

Two rules from the pass-3 audit:

- Don't give two characters who appear in the same mission the same Gemini voice name. (Netherton's Charon is shared with Gary Whitlock in m02 and Nightshade's Enceladus with Graham Reeves in m02; neither pair shares a scene.)
- Every speaking NPC gets a voice block. One without is silent while everyone else talks, which reads as a bug.

The full voice settings for each recurring character are listed in their entry, copied from the scenario files.

## Agent HaX (Agent 0x99, "Haxolottle")

**Who she is.** The player's handler: a former field agent, about fifteen years in SAFETYNET, late thirties to early forties, who runs the player from an ops room by phone and meets them in person for briefings and debriefs. Speaker prefix `Agent HaX`. Ids: `agent_0x99` / `agent_0x99_handler` (phone), plus a briefing and a debrief NPC in most missions. Canon: `safetynet/agent_0x99_haxolottle.md`. The game uses "she" (m02 debrief stage direction; m04–m08 voice styles); the canon file avoids pronouns, and this bible adopts "she".

**How she talks.**

- **Diction:** plain, current British English. Concrete nouns, short verbs. Field slang used lightly ("op", "go dark", "the wire"). Technical terms only where the player needs them, then straight back to plain speech.
- **Sentence length:** short. Her m01 lines are typically about 13 words. Fragments are normal: "Copy that.", "Go.", "Sent."
- **Rhythm:** fact first, then the reason, then (sometimes) the human bit. A long line is usually followed by a very short one.
- **Register:** professional and warm, without saying she's warm. She shows care by what she does (sends the guide, notices the cost), not by telling the player she cares.
- **Verbal habits:** uses the player's name or "Agent" at the top of a serious line ("{player_name}, listen carefully."). Clipped acknowledgements before the content ("Copy.", "Right."). Says "Christ." or "God." once in a mission at most, when something is genuinely bad. Ends calls fast: "Copy that. Call anytime."
- **Humour:** dry understatement, usually one line, usually after the danger has passed. "Well. That's one way to end a job interview." (m03). "We just... made sure we got the contract." (m01).
- **The axolotl.** The canon file gives her a habit of axolotl metaphors and catchphrases. The game has never used them in a spoken line. m01 signs some timed texts with a lizard emoji. This bible adopts the game: no spoken axolotl metaphors, no catchphrases from the canon file; the emoji is optional on good-news texts and is never used on bad news or in a spoken line.
- **She never says:** "Great job!", "Excellent work" on its own, "Let's do this", "Trust your training", "Like an axolotl...", corporate objective-speak ("Your cooperation will be valuable", "Identify compromised systems, enumerate services"), exclamation marks, a moral summing up the scene. She never lectures the player on ethics; she states the cost and lets it sit.

**Under pressure.** She gets shorter and drier, never louder. The worse it is, the fewer words: "...Say that again." / "Operation Shatter. Christ." (m01). When the news is about her own people (m07, m08) the dryness slips. She admits it in a line and gets back to work: "Don't say anything kind, I'll come apart." (m08). In a debrief after a bad outcome she uses silence: "..." / "I see." (m01).

**Arc.** m01: a handler meeting a new agent; more explaining. m02–m06: trusts the player, explains less, jokes a little more. m07: running four crises with one agent, strained. m08: investigating friends; the mask slips. The voice stays the same throughout and only the pressure on it changes.

**Example lines.**

> Agent HaX: ...Say that again. (`m01_phone_agent0x99.ink:348`)

> Agent HaX: Forty-five didn't. I'm not going to dress either of those numbers up for you. (`m02_closing_debrief.ink:252`, after "Two people died in the night.")

> Agent HaX: Well. That's one way to end a job interview. (`m03_phone_agent0x99.ink:314`)

**Voice settings.** Gemini voice `Aoede`, language `en-GB`. Identity part, word for word (m01 canonical): "Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch." Current settings in every mission:

| Mission | id | Voice | Lang | Style |
|---|---|---|---|---|
| m01 | `briefing_cutscene` | Aoede | en-GB | Professional intelligence handler giving a mission briefing. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. Speak quickly with a sense of urgency, as if time is short. |
| m01 | `agent_0x99` | Aoede | en-GB | Intelligence handler speaking over a secure phone line. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. Speak quickly with urgency, as if time is short. |
| m01 | `closing_debrief_person` | Aoede | en-GB | Professional intelligence handler in debrief. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. Speak quickly with urgency, as if reviewing critical information under time pressure. |
| m02 | `opening_briefing_cutscene` | Aoede | en-GB | Intelligence handler giving a mission briefing. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. Speak quickly with a sense of urgency, as if time is short. |
| m02 | `agent_0x99` | Aoede | en-GB | Intelligence handler speaking over a secure phone line. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. Speak quickly with urgency, as if time is short. |
| m02 | `closing_debrief_trigger` | Aoede | en-GB | Intelligence handler giving a mission debrief in person. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. Speak quickly with urgency, as if time is short. |
| m03 | `briefing_cutscene` | Aoede | en-GB | Intelligence handler giving a mission briefing. Speak with a consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Use a steady, mid-range pitch. Speak quickly with a sense of urgency, as if time is short. |
| m03 | `agent_0x99` | Aoede | en-GB | Intelligence handler speaking over a secure phone line. Speak with a consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Use a steady, mid-range pitch. Speak quickly with urgency, as if time is short. |
| m03 | `closing_debrief` | Aoede | en-GB | Intelligence handler giving a mission debrief in person. Speak with a consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Use a steady, mid-range pitch. Measured now the job is done. |
| m04 | `opening_briefing_cutscene` | Aoede | en-GB | Intelligence handler giving a mission briefing. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. Speak quickly with a sense of urgency, as if time is short. |
| m04 | `agent_0x99` | Aoede | en-GB | Intelligence handler speaking over a secure phone line. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. Speak quickly with urgency, as if time is short. |
| m04 | `agent_0x99_debrief` | Aoede | en-GB | Professional intelligence handler in debrief. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. Unhurried — the emergency is over and she is choosing her words carefully. |
| m05 | `opening_briefing` | Aoede | en-GB | Intelligence handler giving a mission briefing. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. Speak quickly with a sense of urgency, as if time is short. |
| m05 | `agent_0x99_handler` | Aoede | en-GB | Intelligence handler speaking over a secure phone line. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. Speak quickly with urgency, as if time is short. |
| m05 | `closing_debrief_trigger` | Aoede | en-GB | Intelligence handler giving a mission debrief in person. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. Unhurried; the night is over and she is choosing her words carefully. |
| m06 | `opening_briefing_npc` | Aoede | en-GB | Professional intelligence handler delivering a mission briefing. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Steady, mid-range pitch, brisk and purposeful. |
| m06 | `agent_0x99_handler` | Aoede | en-GB | Intelligence handler speaking over a secure phone line. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch. Quick, warm, slightly wry. |
| m06 | `closing_debrief_person` | Aoede | en-GB | Professional intelligence handler in debrief. Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Steady, mid-range pitch, reviewing critical information under time pressure. |
| m07 | `agent_0x99` | Aoede | en-GB | Intelligence handler on a secure line, running four crises at once with one agent in range. Speak with a consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Use a steady, mid-range pitch. Quick, dry, clipped. Fond of the agent and audibly under strain, which she handles by getting drier rather than louder. |
| m08 | `agent_0x99` | Aoede | en-GB | Intelligence handler on a secure line, investigating people she has trusted for years. Speak with a consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Use a steady, mid-range pitch. Normally quick and dry; tonight the dryness keeps slipping, because one of the three names is a friend and she does not yet know which. |
| m08 | `agent_0x99_person` | Aoede | en-GB | The player's handler, in person, off duty, hurting. Speak with a consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Use a steady, mid-range pitch. Normally the quick dry voice on the phone; here, quieter and tired, trying not to show how much this one costs her. |

## Director Magnus Netherton

**Who he is.** SAFETYNET's Director of Field Operations, late fifties, ex-military intelligence, formal and exacting, protective of his agents in ways he won't admit. Speaker prefix `Director Magnus Netherton`; id `director_netherton` (plus the briefing and debrief NPCs in m07 and m08, which he runs). Canon: `safetynet/director_netherton.md`. Appears in every mission from m02: a two-to-four-line cameo in the m02–m06 briefings, the lead in m07 and m08.

**How he talks.**

- **Diction:** formal standard English, exact numbers, full words. "Eight point four million", "two hundred and forty to three hundred and eighty-five". No slang, no jargon he'd have to explain.
- **Contractions:** few. He says "I am not going to" and "do not" where weight matters, and lets an occasional "I'll" or "that's" through in quick exchanges. Full forms are his default.
- **Sentence length:** short declaratives in a sequence, like a report read aloud. Then a single blunt verdict. "I am not going to qualify that. You did the thing. It is done." (m07)
- **Register:** command. He states, he doesn't ask permission. He hands over cleanly: "HaX. Go." (m04), "HaX -- it's yours." (m02).
- **Verbal habits:** opens with the agent's designation or name ("Agent 0x00." / "{player_name}."). Lists places or facts as clipped fragments: "Washington. Austin. San Francisco." Gives orders with a reason attached.
- **Humour:** very dry, at the institution's expense, rare. The handbook is a source of it, used sparingly: "The handbook has eleven pages on delegation of force. Not one of them tells you which lot of people to leave." (m07).
- **Care:** never stated as feeling. It comes out as procedure or as a single plain sentence of respect: "You had no way to know what you were choosing. I would like it noted that you chose it anyway." (m07)
- **He never says:** "I'm proud of you", "great work", "awesome", anything matey or American; he never raises his voice, never swears, never softens a casualty figure, never speculates out loud without labelling it as a guess.

**Under pressure.** Slower and colder, never louder. He reads the bad numbers in full and refuses to soften them. In m08, with a mole in his own building, the control holds but the anger shows through precision: "I have run field operations for five years. I have never had to say the next sentence." He also starts to admit error, in one line, without self-pity.

**Drift.** The canon file makes "By the book, Agent. Specifically, page [n]..." his catchphrase and gives him passive, bureaucratic phrasing. The game has never used the catchphrase; it uses the handbook twice in m07, both times as dry wit, and his phrasing is active and direct. Contractions appear in m04–m06 cameos ("I've brought Nightshade in", "Nightshade's read the control systems") and rarely in m02/m03. Line length has grown: median 22 words in m07 and 29 in m08. This bible adopts the m02 voice (formal, few contractions, short sentences, hands over fast) with m07's dry handbook humour allowed once per mission at most. Bring m07/m08 lines back towards 20 words.

**Example lines.**

> Director Magnus Netherton: Agent 0x00. Magnus Netherton -- I run this shop. I would rather we had met under better circumstances, but circumstances are rather the point tonight. (`m02_opening_briefing.ink:31`)

> Director Magnus Netherton: I am not going to qualify that. You did the thing. It is done. (`m07_closing_debrief.ink:84`)

> Director Magnus Netherton: ...Interview all three as if none of them is guilty. Get onto our own systems and bring me proof I can act on. A hunch is not proof. (`m08_director_netherton.ink:96`)

**Voice settings.** Gemini voice `Charon`, language `en-GB`. Identity part (m02 canonical): "SAFETYNET's director. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Low, deliberate, unhurried". Current settings:

| Mission | id | Voice | Lang | Style |
|---|---|---|---|---|
| m02 | `director_netherton` | Charon | en-GB | SAFETYNET's director. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Low, deliberate, unhurried; hands off quickly and lets his handler run the detail. |
| m03 | `director_netherton` | Charon | en-GB | SAFETYNET's director. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Low, deliberate, unhurried; sets the stakes then lets his people run the detail. |
| m04 | `director_netherton` | Charon | en-GB | SAFETYNET's director. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Low, deliberate, unhurried; sets the stakes then lets his people run the detail. |
| m05 | `director_netherton` | Charon | en-GB | SAFETYNET's director. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Low, deliberate, unhurried; sets the stakes then lets his people run the detail. |
| m06 | `director_netherton` | Charon | en-GB | SAFETYNET's director. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Low, deliberate, unhurried; sets the stakes then lets his people run the detail. |
| m07 | `opening_briefing_cutscene` | Charon | en-GB | SAFETYNET director reading a night that has already happened. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Low, deliberate, unhurried even under a countdown. He does not raise his voice and he does not soften anything. |
| m07 | `closing_debrief` | Charon | en-GB | SAFETYNET director reading a night that has already happened. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Low, deliberate, unhurried even under a countdown. He does not raise his voice and he does not soften anything. |
| m08 | `closing_debrief` | Charon | en-GB | Cinematic thriller. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Low, deliberate, unhurried. SAFETYNET's director, whose own briefing was turned into a weapon; he does not raise his voice and he does not soften anything, and under the control is a cold fury that this came from inside his house. |
| m08 | `director_netherton` | Charon | en-GB | Cinematic thriller. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Low, deliberate, unhurried. SAFETYNET's director, whose own briefing was turned into a weapon; he does not raise his voice and he does not soften anything, and under the control is a cold fury that this came from inside his house. |

## Agent 0x47 "Nightshade"

**Who he is.** A senior SAFETYNET technical analyst with a flawless record, trusted by everyone, and (revealed in m08) ENTROPY's sleeper inside SAFETYNET for fifteen years. Speaker prefix `Agent 0x47 'Nightshade'`; ids `agent_nightshade`, and `nightshade_confrontation` in m08. Canon: `../03_entropy_cells/insider_threat_initiative.md` ("Agent 0x47 'Nightshade'"); he has no file in this folder yet. Appears in the m02–m06 briefings or debriefs (one to three lines each) and carries m08.

**How he talks.**

- **Diction:** precise, educated, technical, but he reaches for an image rather than jargon. "Mastermind, in silicon." "Money's just another protocol, and this one leaks."
- **Sentence length:** a medium line followed by a short, quotable one. He's the most fluent speaker in SAFETYNET and sounds like it.
- **Register:** collegial, relaxed, quietly pleased by a clever device. "Lovely piece of kit you brought me." (m02).
- **Verbal habits:** calls the player "Agent 0x00" or "0x00". Turns a technical point into a general truth in his last line. Says "genuinely" and "I'd encourage it" when being helpful (m08).
- **Humour:** wry, gentle, sometimes at his own expense. In m08 it becomes dark: "You put me on the floor of my own lab. I've had worse from people I liked less."
- **Seeding the mole (m02–m06).** His cameo lines are allowed to be double-edged, so that they read differently after m08: "The physics doesn't lie and neither do I" (m04); "the calm of someone who's decided the rules don't apply to them" (m05). One such line per mission at most, never a wink.
- **He never says:** anything flustered, anything crude; he never shouts, never begs, never apologises for the act itself (m08), never sounds villainous before m08.

**Under pressure.** He doesn't show it. That's his tell in m08: "in a building full of frightened people, he is serene" (the m08 voice style). Unmasked, he becomes more eloquent, longer and more lyrical, and argues his case as if he's rehearsed it for years. That's the one place his lines may run long.

**Drift.**

- **Job title.** m02's voice style calls him a "cryptographic-hardware analyst"; m03–m06 styles say "technical analyst"; m08 ink calls him an "operations specialist, cryptography lab". His brief also moves each mission (hardware in m02, control systems in m04, insider threats in m05, money flows in m06). This bible adopts **cryptographic-hardware analyst who is lent to whichever technical problem is hardest** (m02's title). The m03–m06 voice styles could be aligned to m02's identity text when their audio is regenerated.
- **Voice.** m02 is a cheerful gadget-lover; m03–m06 lean towards aphorism; m08 is lyrical and fatalistic. These fit together if the fatalism is seeded. Keep m02's warmth as the base, let one tired or fatalistic line through per mission in m03–m06, and save the full lyrical register for m08.
- **Continuity.** Settled in pass 4: Nightshade has fifteen years' service and **taught the player's intake** (Netherton: "He taught your intake", `m08_director_netherton.ink`). He did not train in the player's cohort, which fits m01's new agent ("First mission complete.", `m01_closing_debrief.ink:886`). HaX did train with him.
- **Voice name.** Enceladus. m08 used Charon (Netherton's voice) for him until pass 3 fixed it; `scenarios/m08_the_mole/CONTRACT.md` reads Enceladus.

**Example lines.**

> Agent 0x47 'Nightshade': Agent 0x00. Lovely piece of kit you brought me. It's a keypad oracle -- brute-force with a brain. (`m02_closing_debrief.ink:125`, trimmed)

> Agent 0x47 'Nightshade': Money's just another protocol, and this one leaks. (`m06_opening_briefing.ink:29`, first sentence)

> Agent 0x47 'Nightshade': I'm not asking you to forgive the sum. I'm telling you I did it with my eyes open. (`m08_nightshade_confrontation.ink:75`, end of line)

**Voice settings.** Gemini voice `Enceladus`, language `en-GB`. Identity part (m02 canonical): "SAFETYNET's cryptographic-hardware analyst. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Calm, precise, technically fluent". Current settings:

| Mission | id | Voice | Lang | Style |
|---|---|---|---|---|
| m02 | `agent_nightshade` | Enceladus | en-GB | SAFETYNET's cryptographic-hardware analyst. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Calm, precise, technically fluent, quietly pleased by an interesting device; a colleague you trust. |
| m03 | `agent_nightshade` | Enceladus | en-GB | SAFETYNET's technical analyst. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Calm, precise, technically fluent; a colleague you trust. |
| m04 | `agent_nightshade` | Enceladus | en-GB | SAFETYNET's technical analyst. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Calm, precise, technically fluent; a colleague you trust. |
| m05 | `agent_nightshade` | Enceladus | en-GB | SAFETYNET's technical analyst. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Calm, precise, technically fluent; a colleague you trust. |
| m06 | `agent_nightshade` | Enceladus | en-GB | SAFETYNET's technical analyst. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Calm, precise, technically fluent; a colleague you trust. |
| m08 | `agent_nightshade` | Enceladus | en-GB | SAFETYNET's cryptographic-hardware analyst. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Calm, precise, technically fluent; a colleague you trust. Tonight he is the mole, not yet unmasked, being interviewed by an agent he once taught: warm, unhurried, helpful to a fault. The only tell is that nothing rattles him -- in a building full of frightened people, he is serene. |
| m08 | `nightshade_confrontation` | Enceladus | en-GB | SAFETYNET's cryptographic-hardware analyst. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Calm, precise, technically fluent; a colleague you trust. Tonight he is the mole, unmasked, across an interrogation table from an agent he taught, with nothing left to lose and no intention of apologising: rueful, articulate and completely unrepentant -- he argues his case like a man who has rehearsed it alone for years. |

## The Architect

**Who he is.** ENTROPY's strategist, who coordinates the cells and supplies their philosophy. Never seen. Present in every mission through letters, sign-offs and other people's references; speaks to the player once, in m07, on a handset in the building. Speaker prefix `The Architect`; id `the_architect` (m07). Canon: `entropy/masterminds/the_architect.md`.

**Two registers.**

- **Written** (letters, directives, sign-offs on documents; m01, m02 and later). Formal, measured, aphoristic, addressed to followers. Ends on a line his followers repeat: "Entropy is inevitable. We merely accelerate the lesson." (the Architect's letter, `m01_first_contact/scenario.json.erb`). Derek repeats it to the player in m01 ("Entropy is inevitable. Trust is a lie."), which is how the player learns who taught him.
- **Spoken** (m07). Short, quiet, unhurried, faintly amused. He doesn't argue; he observes. Every line is under control and most are under 15 words. He talks about the player's choice and keeps his plan to himself. "There is a decision in front of you tonight. Make it however you like. I only want to see it made."

**How he talks (spoken).**

- **Diction:** educated, exact, unplaceable. No slang, no technical terms unless he's quoting the player's own operation back to them.
- **Habits:** answers a question with a statement. States outcomes as if they've already happened. Uses the player's choices and numbers against them, without raising the temperature: "San Francisco. Of course. The number was largest and it was tonight."
- **The teacher (season-one canon, pass 4).** SAFETYNET suspects he is Dr. Adrian Tesseract, its former chief strategist, who trained HaX (m06). Now and then he says something SAFETYNET's own people were taught, in the words they were taught it, and leaves it there: "Let it hurt afterwards, not during. I expect you've been told that." (m07, `t30_close`). Once per mission at most. He never explains it, never mentions SAFETYNET's past, and never names himself.
- **Humour:** bone-dry, at the player's expense or the universe's. "Doors close. It's the one thing they reliably do."
- **He never says:** anything angry, triumphant or pleading; never threatens directly; never explains his whole plan; never says "Mwahaha" or anything like it; never gives his name or a personal fact.

**Under pressure.** There's no visible pressure. Losing doesn't move him: "The beauty of entropy is that it doesn't require me to win." That calm is the point.

**Drift.** The canon file says the Architect is "never directly encountered", communicates only by text, writes in long multi-clause sentences with thermodynamic vocabulary, and has unknown sex and identity ("they"). The game speaks to the player in m07, uses a man's voice (the m07 voice style: "a man in his sixties"), and Nightshade calls him "the man who's been reading your mail" (m08). The spoken lines in m07 are short and plain, with no thermodynamics. This bible adopts the game: male, voiced only remotely and never seen, short spoken lines; the formal, aphoristic register is kept for his writing. The canon file's long thermodynamic speeches belong in documents; spoken aloud they would run far past the line limits.

**Example lines.**

> The Architect: Agent 0x00. Don't look for the trace. It isn't there. (`m07_architect_comms.ink:92`)

> The Architect: There is a decision in front of you tonight. Make it however you like. I only want to see it made. (`m07_architect_comms.ink:108`)

> The Architect: Doors close. It's the one thing they reliably do. (`m07_architect_comms.ink:198`)

**Voice settings.** Only voiced in m07:

| Mission | id | Voice | Lang | Style |
|---|---|---|---|---|
| m07 | `the_architect` | Sadaltager (fx: voice-distortion) | en-GB | ENTROPY's planner, a man in his sixties, on a handset he took without being invited. Deliberately unplaceable -- an educated, faintly mid-Atlantic English with every regional marker sanded off, which could be Western European or North American; keep it consistent throughout. Low pitch that never lifts; quiet, slow, deliberate pace with a lecturer's precision. Faintly amused. Nothing that happens tonight surprises him, including losing. |

## The Narrator

**What it is.** The `Narrator:` lines: stage directions shown in italics and voiced. Top-level `narrator` block in each scenario.

**How it talks.** Present tense, second person for the player ("You call in SAFETYNET backup."), third person for everyone else. Short and concrete: what happens, what can be seen. It never comments, moralises or tells the player what they feel. m01 uses the narrator sparingly (eight lines, all in the Derek confrontation). m02 uses 121; many of those can be cut or folded into a delivery cue on the spoken line (see "Emotes vs. Narration" in `README_ink_best_practices.md`).

**Example lines.**

> Narrator: Derek sets down the launch device. (`m01_derek_confrontation.ink:445`)

> Narrator: Derek's hands are empty. SAFETYNET backup is called. The launch device is yours. (`m01_derek_confrontation.ink:460`)

**Drift.** All missions use `Algenib` and `en-GB`. m01, m03, m04, m05 and m06 use "Cinematic noir detective voice over narrator."; m02 uses a hospital-thriller style; m07 and m08 add an explicit RP accent guard and a scene sentence. The pass-3 audit judged this acceptable (same voice, tone set per mission) and advised against changing m01/m02. This bible adopts that.

**Voice settings.**

| Mission | id | Voice | Lang | Style |
|---|---|---|---|---|
| m01 | `narrator` | Algenib | en-GB | Cinematic noir detective voice over narrator. |
| m02 | `narrator` | Algenib | en-GB | Cinematic, tense clinical thriller narrator. Measured and grave -- a hospital in crisis. |
| m03 | `narrator` | Algenib | en-GB | Cinematic noir detective voice over narrator. |
| m04 | `narrator` | Algenib | en-GB | Cinematic noir detective voice over narrator. |
| m05 | `narrator` | Algenib | en-GB | Cinematic noir detective voice over narrator. |
| m06 | `narrator` | Algenib | en-GB | Cinematic noir detective voice over narrator. |
| m07 | `narrator` | Algenib | en-GB | Cinematic thriller narrator. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Low, unhurried, grave. A building full of machinery that is about to be used against people. |
| m08 | `narrator` | Algenib | en-GB | Cinematic thriller narrator. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Low, unhurried, careful. A building full of people who have stopped trusting each other, and one of them is guilty. |

## Agent 0x00 (the player)

**Who.** Agent 0x00, the player character. Canon: `safetynet/agent_0x00.md`. The player's words appear only as the choice text they pick; there is no player voice block, so player lines aren't voiced.

**How the player talks (choice text).**

- First person, spoken words, as in the dialogue style guide, section 7.
- Competent and calm. Polite with civilians, direct with suspects, curt with villains when the player chooses to be.
- British English, plain. No swearing in the default options; a hard option may be blunt ("You're a monster.").
- Never smug, never a quip machine. One dry option in a set is fine; a set of three jokes isn't.
- Speaks to HaX as a colleague (`[Copy. On it.]`, `[What am I walking into?]`), to Netherton with a little more formality (`[Understood, Director.]`).

**Early and late.** In m01 the player is new and asks more questions. By m07–m08 the choice text can be shorter and more decisive, and can push back on HaX and Netherton.

## Canon characters not yet voiced

These have canon files but say nothing in m01–m08. If a mission gives one of them lines, write their entry here first, using the canon file and the dialogue style guide, and pick a Gemini voice that no one else in that mission uses.

- **Dr Lyra "Loop" Chen** (`safetynet/dr_chen.md`): SAFETYNET's chief technical analyst, early thirties, fast, enthusiastic, self-interrupting. The canon file's catchphrases ("Have you tried turning it off and on again?", PEBKAC) are dated; keep the speed and the enthusiasm, drop the stock jokes. Not to be confused with Maya Chen (m01) or Ms Chen (m02).
- **Agent 0x42** (`safetynet/agent_0x42.md`): the cryptic veteran. Very few words.
- **Null Cipher** and **Mx. Entropy** (`entropy/masterminds/`): ENTROPY masterminds. Written communications only so far.
- **The Recruiter** (`../03_entropy_cells/insider_threat_initiative.md`) speaks only in m05 and is listed with that mission below. If she returns, copy her m05 voice block exactly.

## One-mission characters

One line each, so that writers can keep a mission's cast distinct and don't reuse a voice or a manner by accident. The full voice block is in each scenario file. "Talks like" is the manner the ink and the voice style agree on.

### m01 First Contact (frozen, audio cached)

| Character (id) | Voice | Accent | Talks like |
|---|---|---|---|
| Sarah O'Brien (`sarah_martinez`) | Kore | Irish (Dublin) | Friendly receptionist; chatty gossip that hides hints. |
| Kevin Park (`kevin_park`) | Charon | Australian | Overworked, self-deprecating IT manager; quick, anxious, funny. |
| Maya Chen (`maya_chen`) | Leda (en-US) | Chinese-American (California) | Frightened informant; short, hushed, checks the door. |
| Derek Lawson (`derek_lawson`) | Algieba | RP | Smooth zealot; long, calm justifications, "education" not murder. |

### m02 Ransomed Trust (dialogue revised in pass 4; audio regenerated after it)

| Character (id) | Voice | Accent | Talks like |
|---|---|---|---|
| Bernie Nwosu (`receptionist`) | Despina | South London / MLE | Eleven years on the desk; warm, quick, dry, misses nothing. |
| Ghost (`ghost`) | Iapetus + fx | Trained-out, unplaceable English | Ransomware Inc. operative; precise, unhurried, uses numbers as weapons. "They". |
| Sister Doyle (`ward_nurse`) | Kore | Belfast | Ward sister; exhausted, unsentimental except about patients. |
| Nurse Raval (`roaming_ward_nurse`) | Erinome | West Yorkshire (Bradford) | Brisk to the point of curt; no time. |
| Mr Pryce (`patient_bed4`) | Rasalgethi | South London | On a ventilator; four or five words at a time. |
| Mrs Hargreaves (`patient_bed2`) | Sulafat | Lancashire | On ECMO; fragments, matter-of-fact. |
| Ms Chen (`patient_bed5`) | Autonoe | Scottish (Edinburgh) | Retired teacher; alert, precise, quietly furious. |
| Gary Whitlock (`gary_whitlock`) | Charon | Birmingham / Black Country | IT admin who was right for six months; flat, tired, bitter jokes. |
| Dr Sarah Kim (`dr_sarah_kim`) | Achernar | RP | CTO; controlled surface, guilt underneath. |
| Graham Reeves (`night_security_supervisor`) | Enceladus | Estuary | Soothing, courteous supervisor (and ENTROPY's asset); cold when cornered. |
| Val Okonkwo (`security_guard_patrol`) | Leda | Scouse | Jokey until she isn't; immovable about the rules. |

### m03 Ghost in the Machine

| Character (id) | Voice | Accent | Talks like |
|---|---|---|---|
| Receptionist (`receptionist_npc`) | Kore | South Wales (Cardiff) | Bright, chatty front desk. |
| Victoria Sterling (`victoria_sterling`) | Despina | RP | Polished CEO and conference speaker; cool, reasonable, guilty. |
| Security Guard (`night_guard`) | Algieba | Estuary (Essex) | Tired, dry, procedural. |
| Danny Foster (`danny_foster`) | Iapetus | East Midlands (Nottingham) | Frightened consultant; voice tightens under stress. |

### m04 Critical Failure

| Character (id) | Voice | Accent | Talks like |
|---|---|---|---|
| Security Guard (`security_guard`) | Schedar | West Country (Bristol) | Polite, grumpy about the hour. |
| Robert Vance (`robert_vance`, `robert_vance_phone`) | Orus | North-East (Teesside) | Operations manager; brisk, clipped, engineer's facts. |
| Operative 'Cipher' (`operative_cipher`) | Fenrir | Dutch-accented English | Fake contractor; clipped, nervy. |
| Operative 'Relay' (`operative_relay`) | Pulcherrima | Scottish (Edinburgh) | Cool, almost friendly; has costed it. |
| Voltage (`voltage`) | Alnilam | South African (Johannesburg) | Ex-grid engineer turned cell lieutenant; low, flat, certain. |
| Operative 'Static' (`operative_static`) | Umbriel | Polish-accented English | Very few words. |

### m05 Insider Trading

| Character (id) | Voice | Accent | Talks like |
|---|---|---|---|
| The Recruiter (`recruiter`) | Gacrux (en-US) | Educated American (DC) | Former talent spotter; warm, patient, ruthless; talks about people as placements. |
| Patricia Morgan (`patricia_morgan`, `patricia_phone`) | Kore | South Wales (Cardiff) | Ex-military CSO; direct, dry, economical. |
| Lisa Park (`lisa_park`) | Laomedeia | South-west London | Bright, chatty marketing coordinator who notices things. |
| Owen Gallagher (`owen_gallagher`) | Puck | Manchester | Frazzled, sardonic sysadmin. |
| Dr Ruth Halloran (`dr_halloran`) | Erinome | Irish (Dublin) | Sharp, protective research lead. |
| David Torres (`david_torres`) | Schedar | Light Castilian Spanish | Soft, slow; a decent man who did a terrible thing. |

### m06 Follow the Money

| Character (id) | Voice | Accent | Talks like |
|---|---|---|---|
| Checkpoint Guard (`checkpoint_guard`) | Alnilam | South London | Goes by his list and nothing else. |
| Dr Irina Volkova (`irina_volkova`) | Kore | Light Russian | Guarded, precise cryptographer with doubts. |
| Dani Okonkwo (`trader_npc`) | Puck | South-east London (Peckham) | Jittery young trader; over-explains. "They". |
| Priya Raghavan (`blockchain_analyst`) | Leda | Northern English (Leeds) | Enthusiastic forensics analyst who hasn't seen what her graph proves. |
| Satoshi Nakamoto II (`satoshi_nakamoto`) | Umbriel (en-US) | US West Coast (San Francisco) | Charismatic ideologue; calm, amused, unrepentant. |

### m07 Architect's Gambit

| Character (id) | Voice | Accent | Talks like |
|---|---|---|---|
| Ray Hollis (`ray_hollis`) | Puck (en-US) | Pacific Northwest working class | Guard taking money he can't explain; low, flat, defensive. |
| Elena Rodriguez (`elena_rodriguez`) | Leda (en-US) | Californian, Mexican-American | Engineer who has just realised what her survey was for. |
| Dr James Mercer (`james_mercer`) | Iapetus (en-US) | General American (PNW) | Professorial; costed the deaths and signed. |
| Thomas Park (`thomas_park`) | Rasalgethi (en-US) | Korean-American (PNW) | Maintenance tech; short sentences, shame. |

### m08 The Mole

| Character (id) | Voice | Accent | Talks like |
|---|---|---|---|
| ATHENA (`opening_briefing_cutscene`, `receptionist_ai`) | Kore | RP | Building AI; corporate-calm, unnervingly helpful. |
| Agent 0x23 'Cipher' (`agent_cipher`) | Iapetus | Educated Glaswegian | Brilliant, anxious cryptographer; fast, over-explains. |
| Agent 0x88 'Phantom' (`agent_phantom`) | Fenrir | Light educated Ghanaian English | Charming field coordinator running his own errand. |
| Junior Analyst (`background_analyst`) | Vindemiatrix | East Midlands (Leicester) | Hasn't slept; soft, worried. |
| Off-Duty Agent (`background_agent`) | Puck | Geordie | Eavesdropping gossip. |

**Name clashes to watch.** Different people share names across missions: Patricia Wells (m01, mentioned) and Patricia Morgan (m05); ENTROPY's 'Cipher' (m04) and SAFETYNET's Agent 0x23 'Cipher' (m08); Okonkwo (Val, m02; Dani, m06); Park (Kevin m01, Lisa m05, Thomas m07); Chen (Maya m01, Ms Chen m02, the canon's Dr Chen). Don't let a line imply they're related unless that's intended.

## Drift found in pass 4

What this bible adopts is in each entry. Items marked **decide** need the user, because they touch canon or frozen missions.

| Character | Where | What differs | Adopted |
|---|---|---|---|
| HaX | canon file vs m01–m08 | Canon gives her axolotl metaphors and catchphrases ("patience is a virtue, but backdoors are better"); no spoken line in the game uses them. | Game voice. No spoken axolotl lines. |
| HaX | m01 vs m02–m08 | m01 signs 25 timed texts with a lizard emoji; no later mission does. | Optional, good-news texts only. |
| HaX | canon vs game | Canon avoids pronouns; the game says "she". | She. |
| HaX | m04, m06 phone | m04's phone ink is mostly unprefixed objective-speak ("Perfect. Use it to scan the SCADA network topology.", "Vance's cooperation will be valuable"); m06 has similar flat lines ("Irina is brilliant but conflicted."). | Rewrite to m01/m02 voice in pass 4. |
| HaX | m01 → m08 | Median line length 13 words (m01) → 18 (m02) → 23 (m07) → 29 (m08). | Bring back towards m01. Long lines only for m08's personal scenes. |
| HaX | m06 voice styles | The briefing and debrief identity text reads "Steady, mid-range pitch, ..." where the others say "Use a steady, mid-range pitch." | Align to the canonical sentence when m06 audio is regenerated. |
| Netherton | canon vs game | Canon: "By the book... page [n]" catchphrase, passive bureaucratic phrasing. Game: active, terse, handbook used twice in m07 as dry wit. | Game (m02) voice; handbook joke at most once per mission. |
| Netherton | m02/m03 vs m04–m06 | Contractions appear in the m04–m06 cameos. | Few contractions. |
| Netherton | m07/m08 | Median line 22 (m07) and 29 (m08) words. | Shorter, nearer 20. |
| Netherton | canon vs m08 | Canon: appointed Director about five years ago. m08 said "I have run this agency for eleven years." | **Closed (pass 4):** m08 now says "I have run field operations for five years." |
| Nightshade | m02 vs m03–m06 vs m08 | Job title: "cryptographic-hardware analyst" (m02 voice style), "technical analyst" (m03–m06 styles), "operations specialist, cryptography lab" (m08 ink and personnel file). | m02's title. |
| Nightshade | m01 vs m08 | m08 said he trained in the player's cohort fifteen years ago; m01 treats the player as on their first mission. | **Closed (pass 4):** he has fifteen years' service and taught the player's intake; m08's lines, dossier, printout and voice styles changed. |
| Nightshade | m08 docs | Reported that `scenarios/m08_the_mole/CONTRACT.md` lists his voice as Charon. | **Closed (pass 4):** CONTRACT.md reads Enceladus. |
| The Architect | canon vs m07/m08 | Canon: never encountered, text only, sex unknown, long thermodynamic sentences. Game: speaks by handset in m07 in a man's voice; m08 calls him "the man"; short plain lines. | Game. Formal register kept for his writing. |
| Narrator | m01–m08 | Same voice, different style text per mission (noir in m01/m03–m06, hospital thriller in m02, RP guard in m07/m08). | Accepted, as in the pass-3 audit. |

Factual slips noticed along the way (not voice, but writers should know): m01's briefing calls Maya Chen "the journalist" (`m01_opening_briefing.ink:207`) and the m01 debrief refers to "her journalism" while she's a content analyst everywhere else; m01 is frozen, so later missions should call her a content analyst if they mention her.
