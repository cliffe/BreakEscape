# m03 Ghost in the Machine: script editor's notes on the dialogue pass

Fresh review, 2 October 2026. Read-only apart from this file.

Baseline: the writer's snapshot `<scratchpad>/m03-dialogue/ink-before/` (ink) and `scenario-before.json.erb`. The current files were compared against it line by line. Line numbers are the **current** files unless marked "before". References: `docs/agents/PASS4_BRIEF.md`, the dialogue style guide, the voice bible, the humanizer rules, `DIALOGUE_REVIEW.md`, and the m07 samples and editor's notes as the bar.

The short version: a sound pass. The 77 folds are clean and lose almost nothing, the lint is clear, and the logic is untouched apart from Danny's three deliberate choices, which work. What's left is in two places. First, Victoria's night scene: two of the twelve "set-piece" `You:` lines are plain echoes of the choice the player has just clicked, and most of the rest work better as choices. Second, the folds made two old slips visible in the menu, where the player quotes a line nobody has said yet. Danny's protect beat also lost the antecedent of his best reply. Verdict at the end: **revise** (light).

## 1. Logic safety (mechanical checks)

All run by me in this session; output in `<scratchpad>/m03-scripted/`.

| Check | Result |
|---|---|
| `tagdiff.mjs --old <before> <after>`, each of the 8 ink files | **STRUCTURE UNCHANGED** in 7. `m03_danny_choice.ink`: 6 differences, exactly the 3 intended one-option `+` choices (`:75`, `:88`, `:101`) and their choice counts. `You:` lines 77+ → 12 (all in Victoria; see section 4). |
| Compiled JSON in step with the ink | Recompiled all 8 with `bin/inklecate` into scratch; every JSON is identical to the committed one. |
| `dialoguelint.mjs` | 0 errors. One warning: `not-x-but-y` at Victoria `:461` ("That isn't cruelty. It's arithmetic."), her permitted villain line. **banned-word = 0** (the "Foster" fix works). Medians: guard 8, Danny 11, Victoria 12, receptionist 12, briefing 14, phone 15 (max 25), debrief 17 (max 30); timed texts max 30. |
| `reopencheck.mjs … m03_ghost_in_the_machine` | **0 problems**. |
| `loopcheck.js` | 25 runs: Danny from `start` with fate "", evidence-seen, protected, exposed, left, ko; Victoria day, receptionist-KO, night-on-call, night confrontation (plain, with drive, with KO + guard told), arrested, ko; guard day/night/lockpick; receptionist day/night; phone hub and revelation call; briefing; debrief (two fate mixes); night transition. **All clean**, no runtime errors or runaways. |
| `inkcheck.js` on Danny | paths clean, runaway 0, failing 0. |

**Danny's three one-option choices (EXTRA 2).** No loop risk. Each sits in a knot entered once from `the_question`, is sticky (`+`), so it can't starve, and fires the fate tags then `-> after_choice`, whose conditions cover every `danny_fate` value. One behaviour change to know about: before, the fate was set the instant the player answered "What happens now?". Now there's a second click, so a player who closes the chat at that one-option choice comes back with `danny_fate` still empty and can choose again. That's harmless, arguably right, and needs no change. How they read is in section 4.

Nothing here blocks. The pass changed words, not logic, apart from the one deliberate structural change.

## 2. Information: what the player needs, and where it is now

Walked the critical path and each optional branch against the before-copy. Directions were checked against `connections` (conference west of the main hallway, server room north, executive wing east, Sterling's office north and Danny's south of the wing hallway); every "left", "right", "east" and "south" in the ink agrees.

| Step | Where it's delivered now | Findable again? |
|---|---|---|
| Clone the receptionist's badge at her desk; it opens the conference door | Briefing `m03_opening_briefing.ink:167`; phone `hint_rfid` `:176-177`, RFID guide `:100`; receptionist hub `:121`, narrator `:225` | Yes |
| Sterling's card at the whiteboard: custom keys, Darkside, about 30 seconds, keep her talking | Briefing `:168-169`; phone `:101`, `:178-179`; Victoria narrator `:280`, `:379`; minigame button | Yes, but **blurred**: see S3 |
| Server room needs the emulated executive card | Phone `:181`; receptionist `:205`, `:215`; guard `:307` | Yes |
| Sterling's office is keyed: pick it when the guard's back is turned | erb text `:650`; phone `hint_lockpicking` `:187-189`; guard `:420` | Yes; one dangling pronoun, S4 |
| Computer password: house default plus founding year from the plaque | Phone `hint_password` `:196-197`; receptionist `:70`, `:182-183`; plaque object | Yes |
| Wall-safe code mailed to the night team | Phone `:198`, `:257`; the draft on her machine (erb `:1320`) | Yes |
| VM: recon, services, distcc; submit at the drop-site | erb text `:656`; phone `hint_network` `:214-216`; briefing `:182-185`; guides | Yes |
| The drive: Base64 over ROT13 | Phone `hint_encoding` `:207`, `directive_later` `:343` | Yes |
| Danny's office (executive wing, south door), before Sterling | Receptionist `:170`; erb texts `:808`, `:851`, `:858`, `:864`; phone `report_progress` `:227` | Yes |
| Sterling waiting in the conference room at night | erb texts as above; phone `:227`; `hint_confrontation` `:84-89` | Yes |
| The deal needs the drive | Phone `:89`, `:229`; Victoria `recruit_declined` `:494` | Yes |
| Guard rounds every fifteen minutes; double shift | Guard `:281-287`, `:66`; briefing `:198` | Yes |

**What the 77 folded echoes lost (EXTRA 3).** Almost nothing. In nearly every case the old `You:` line just restated the bracket at greater length, and the reply still answers the new bracket. The exceptions:

- **Danny, protect** (before `:75`): "But you have to come in, and you have to tell them everything." Danny's reply "Everything. Yes. God, yes." (`:76`) answered that line, and now answers nothing. **M3.**
- **Danny, expose** (before `:87`, `:89`): "Deceived at the start, complicit by the end" and "Prosecutors decide the charge, not me." The first now lives on as HaX's own verdict in the debrief (`m03_closing_debrief.ink:272`), so nothing is lost. It just isn't a callback any more. Danny's "say I didn't know at the start" still reads. Fine.
- **The briefing's RFID line** (before `:174-175`) lost "dictionary attack" and "Darkside". The phone did the same at `:101` and `:178`. See S3.
- **Phone `hint_lockpicking`** (before `:184`) lost "Watch the guard's loop", so "his back's turned" at `:188` has no antecedent. S4.
- **Guard, "persuade with more lies"** (before `:177`): the bracket now leads with "The fault…", but the only route into `suspicious_path` is the "I work here" story (`:106`, `:112`), so there is no fault yet. S5.
- **Two folds made a pre-existing slip visible in the menu.** The player now *reads* a line that quotes something nobody has said:
  - briefing `:113` "[You said Phase 2. What is it?]", but HaX hasn't said "Phase 2" in that scene before this menu (the first mention is the sibling reply at `:106`). **M4.**
  - Victoria `:192` "["Not our concern"? That's wilful ignorance…]" quotes the line she says only in the *other* branch (`:187`). **M5.**
- **Debrief callback** `:274` "Everyone who armed that attack answers for it. You were consistent about that." quotes the old briefing bracket (before `:283`), which the player no longer sees; the bracket is now "[If he did the recon, he's part of it.]". S6.

The timed-text trims are right. The VM text (erb `:656`) dropped the list of guides and the ProFTPD aside. Both are still on the phone (sticky guide requests and `hint_network` `:215`). The two all-flags pairs are still identical in each pair, as the erb comment requires.

## 3. Character

**Netherton.** Right. The 49-word opener is now four short declaratives, formal, with few contractions ("You are going in."), and he hands over in one line (`:33`). One problem with sense:

- **S8.** `m03_opening_briefing.ink:27` "Zero Day Syndicate have stopped selling exploits. Now they arm the cells that use them." They haven't stopped selling: arming the cells *is* the selling, and HaX says so five lines later (`:52`, "They arm the cells that do"). The before-line was about escalation ("started deploying them through the people they sell to"), and HaX's "And they're escalating" (`:41`) depends on it. Replace: "Zero Day Syndicate used to sell exploits to whoever paid. Now they choose the targets first." (16 words.) This also stops "arm the cells" turning up twice in a minute.

**Nightshade.** Three lines, medium then short, with an image ("we copy it, we wear it"). The m08 plant (`:171`, "One day it'll be our badge somebody clones. Remember how easy it was.") is subtle. It sits between two ordinary lines and works as advice on first hearing. Keep it where it is; moving it to the end of his turn would make it a wink.

**HaX.** Clipped and fact-first on the phone (median 15, max 25). "Well. That's one way to end a job interview." (`m03_phone_agent0x99.ink:357`), the voice bible's own example, is intact. The revelation call reacts and doesn't lecture. A handful of stock phrases the voice bible rules out slipped through, or were already there:

- Briefing `:235` "Trust your instincts" (the bible's "Trust your training" cousin), `:287` "You've got this.", `:251` "Make this count.", `:256` "That's what I wanted to hear. Stay safe."; debrief `:156` "Well done.", `:354` "Good work." Replacements in section 6 (optional, except where noted).
- Phone `:84` "Listen carefully." is filler before a real line. The bible gives her the player's name at the top of a serious line instead: "{player_name()}. You've got the logs."

**Victoria.** At night she's the best voice in the mission: calm, specific, and her goal is clear (leave, and make the player choose fast). "I read every obituary. I can recite them in order." and "I sleep perfectly. That's the part people like you can never forgive." are the hard-to-answer lines the style guide asks for. In the afternoon she's a lecture. That suits a recruiter's pitch, but she uses the contrast shape three times there and twice more at night (section 5). "toward" (`:146`) should be "towards" for an RP CEO.

**The one-mission cast.** With the names covered they're still distinct. The guard is flat and Essex ("Oi.", "Course she did.", "didn't want telling twice"). Danny is fragile and self-accusing in long, broken lines. The receptionist is bright and full of exclamation marks, with one Welsh-ish "mind" (`:171`). Two Americanisms break her: "Zero Day training programs" (`m03_npc_receptionist.ink:73`) and "her car still in the lot when I leave at 6" (`:145`). Use "programmes" and "in the car park when I leave at six" (S11).

## 4. Craft

### 4a. The twelve `You:` lines left in Victoria (EXTRA 1)

The writer kept these as "authored set-piece speech". The style guide (§7) allows a scripted player line only after a non-verbal choice. Judged one by one:

| # | Line | Verdict | Replacement |
|---|---|---|---|
| 1 | `:518` arrest: "You're not going anywhere. Put the bag down. Hands where I can see them." | **Echo** of the bracket at `:486` "[You're not walking out of here. Bag down.]". **M1.** | Delete `:518`. If the hands are wanted, put them in the bracket: `[You're not walking out of here. Bag down, hands where I can see them.]` (13 words) |
| 2 | `:535` escape: "Go. I've got everything I need off your servers. You're just the signature on it now." | **Echo** of `:488` "[Go. I've already got what I need off your servers.]". **M2.** | Delete `:535`. Fold the new half: `[Go. I've got what I need off your servers. You're just the signature now.]` (14) |
| 3 | `:500` recruit: "Then be useful. The Architect's channels, the payment rails, Phase 2 — all of it. Do that and I'll fight for a deal. Not immunity. A deal." | Choice. The pass cut the bracket to "…and I'll deal", which is weaker and ambiguous, and Victoria's reply ("Not immunity. At least you're honest.") hangs on words the player didn't pick. She names the channels and rails herself at `:504`. | Bracket `:482`: `[I have your Phase 2 directive. Give me the Architect and I'll fight for a deal. Not immunity.]` (17, a big moment). Delete `:500`. |
| 4 | `:505` "When." | Neither: let her carry it. A one-word prompt is a wasted click. | Delete `:505`; `:506` becomes "Victoria Sterling: The window opens in weeks. The assets are already moving into position." |
| 5 | `:460` St Catherine's: "You charged a healthcare premium. Forty per cent. You priced the bodies in." | **One-option choice.** It's the player's sharpest line in the mission, and her best reply (`:461`) answers it word for word ("I priced the urgency in"). The player should click to say it. | After `:459`, add `+ [Forty per cent extra for a hospital. You priced the bodies in.]` (12) and indent `:461` and the divert under it. Structural (one choice); log it. If no structural change is wanted, fold instead: bracket `:458` `[St. Catherine's. People died, and you charged a hospital premium for it.]`, delete `:459-460`, keep `:461`. |
| 6 | `:473` the_reckoning: "That's the story you tell yourself so you can sleep." | **One-option choice.** She has six lines in a row here, and her best line (`:474`) answers this one. The villain rule asks for a player beat. | After `:472`, `+ [That's the story you tell yourself so you can sleep.]`, then `:474-477` and `-> confrontation_decision` indented under it. Structural; log it. |
| 7 | `:521` arrest: "Then I'll take whoever sits at it next, too." | Cut, with the reply. Her answer (`:522`, "That very nearly had a body count of its own") is opaque. It reads as if the player had threatened violence, and it delays her real exit line. | Delete `:521-522`. `:520` → `:523` reads straight through: "…They'll have it filled by Monday." / "The evidence is real…". |
| 8 | `:274` "This network diagram - is this your training lab architecture?" | Choice. The hub bracket `:156` "[Move closer to examine the whiteboard]" is an action label, and the spoken line is the cover question. | Hub `:156` bracket: `[Is that your training lab on the whiteboard?]`. Delete `:274`. `:273` → "Narrator: You get up and go to the board, close to Victoria." |
| 9, 10 | `:293`, `:296` eager_recruit (two versions by `receptionist_ko`) | Choice. The hub bracket `:162` "[Play the eager recruit again]" is a stage direction. | Hub `:162` bracket with inline text: `[{receptionist_ko:The desk was empty when I came in. I signed myself in.|I came in swinging earlier. Freelance habit. Your story holds up.}]`. Delete `:293` and `:296`. The knot stays choice-free, as its comment requires. I checked that this form compiles with `bin/inklecate` and renders the right text in the game's `ink.js`. |
| 11 | `:368` "This training lab must have taken significant investment." after "[Stay focused on the whiteboard]" + Narrator | Choice. "significant investment" is stiff too. | `:366` `* [This lab can't have been cheap to build.]`; `:367` "Narrator: Your eyes stay on the network diagram."; delete `:368`. |
| 12 | `:373` "And the certifications - do you offer any formal credentials?" after "[Just a few more seconds...]" + "Narrator: Keep her talking." | Choice; move the clock cue in front of the menu so the tension survives. | Add after `:360`: "Narrator: Nearly there. Keep her talking." `:371` `* [Do you offer any formal certifications?]`; delete `:372-373`. |

So: two must-fix echoes, two one-option choices (the Danny pattern, worth the two structural changes), one cut, and seven folds. After this Victoria has no `You:` lines left.

### 4b. Danny's one-option choices (EXTRA 2)

The pattern is right and the scene reads better for it. The player chooses the stance, Danny reacts, and the player clicks to land it. Two of the three need a word fixed:

- **M3, protect `:75`.** "[Sterling goes down for what she did with your work. You don't have to.]" "You don't have to" is elliptical (have to what?), and Danny's "Everything. Yes. God, yes." now answers nothing. The style guide's own sample has the same flaw, so the writer copied it faithfully. Replace: `[Sterling goes down for her part. You don't have to go down with her -- but you tell them everything.]` (18; a big moment). That restores the "everything" his reply depends on.
- **S7, leave `:101`.** "[It's the only one that'll hold. Make it.]" After Danny's "a decision made for me isn't mine", "It" reads as the decision made for him. Replace: `[Yours is the only one that'll hold. Make it.]`
- Expose `:88` reads well. The list ("recon, emails, the raise") is evidence, and Danny's "say I didn't know at the start" still follows.

### 4c. Choices that are still menu labels

The pass folded every echo, but the hubs that never had echoes kept their labels. Style guide §4 and §7 say hub choices are the player's speech. Prose-only swaps (S9):

- **Guard hub** `m03_npc_guard.ink:258-266`. `[Ask about the guard's shift]` → `[Long night ahead of you?]`. `[Ask about building layout]` → `[Big place to cover on your own.]`. `[Ask about Victoria Sterling]` → `[What's Sterling like to work for?]`. **`[Offer a bribe]` → `[Maybe we can work something out.]`**: this one matters, because `offer_bribe` now opens on "Are you trying to bribe me?" (`:172`), which only works if the player has just said something. `[Leave conversation]` → `[I'll let you get on.]`.
- **Receptionist hub** `m03_npc_receptionist.ink:113-123`. `[Ask about Victoria Sterling]` → `[What's Ms. Sterling like?]`. `[Ask about other employees]` → `[Who else works here?]`. `[Ask about company history]` → `[How long has WhiteHat been going?]`. `[Ask about the building layout]` → `[How's the building laid out?]`. `[End conversation]` → `[Thanks. I'll head through.]`. In `badge_process`, `:45` `[Thank you - sign in]` → `[Thanks. Where do I sign?]`.
- **Victoria hub** `:152`, `:154`, `:166`. `[Ask about Zero Day's mission]` → `[What is Zero Day actually for?]`. `[Question the ethics]` → `[Can I ask about the ethics of it?]` (her "Let me guess" still answers it). `[End the conversation]` → `[Thank you. I've taken enough of your time.]`.
- **Phone hint menu** `m03_phone_agent0x99.ink:74`, `:160-168`. `[I need a hint]` → `[I'm stuck. Can you help?]`. `[Cloning the keycards]` → `[How do I clone these keycards?]`. `[The locked doors and cabinets]` → `[How do I get past the locked doors?]`. `[Sterling's computer password]` → `[How do I get into Sterling's computer?]`. `[Decoding what I've found]` → `[How do I read what I've found?]`. `[The training network]` → `[Where do I start on their network?]`. The guide requests (`:58-68`) are fine as orders; optionally add "Can you send me…".

### 4d. The two visible quote slips

- **M4.** Briefing `:113`: `[You said Phase 2. What is it?]` → `[What else are they planning?]`, and its reply `:114` → "Agent HaX: There's a Phase 2. That's the other thing you're going in to find." The objectives line at `:121` then makes sense to every player.
- **M5.** Victoria `:192`: `["Not our concern"? That's wilful ignorance of the consequences.]` → `[And you don't care what the buyers do? That's wilful ignorance.]` (11)

### 4e. Debrief payoffs

Every choice-setting global is still read back by name: the guard (detected, KO, talked past, told, bribed), the receptionist KO, `called_it_murder` (`:98`, which matches the folded bracket exactly), `knows_m2_connection`, the four Victoria fates, the five Danny fates, the paper trail, the directive decoded or not, and `player_approach` in each branch. Two slips:

- **S6.** `:274` "Everyone who armed that attack answers for it. You were consistent about that." Besides quoting a bracket the player no longer sees, `player_approach == "aggressive"` is also set by "[I move fast, grab the objectives, get out.]", so "consistent" may refer to nothing. Replace: "You said from the start that the recon made him part of it. You held to that." If the aggressive flag came from the speed choice instead, a neutral form works: "You went in hard and stayed hard. I won't argue with it."
- **S10.** `:397` "You put an arms dealer's books on the record tonight." The debrief is "the morning after" (`:49`). Use "last night".

Smaller debrief items (S10): `:158` the folded bracket "[It happened on what she sold. This is the answer for St. Catherine's.]" is clumsy → `[People died on what she sold. This is for St. Catherine's.]`. `:248` "You didn't just close a case. You handed us the shape of the thing." is the "not just X" tell in HaX's mouth → "You handed us the shape of the thing." `:392` "A marathon, not a sprint. But every cell we weaken is lives we keep." is an idiom, a contrast and a moral in two sentences → "They are. And every one of them bought from Zero Day."

### 4f. Subtext and exposition

Mostly good. The revelation call reacts ("There it is."), Danny's guilt shows in what he remembers ("I could tell you the ward layout from memory because I drew it."), and Victoria never apologises. Two narrator lines interpret rather than show: Victoria `:534` "What you don't have is a reason to bleed for the collar." tells the player what they think, and `:519` "She measures the distance, the odds" is fine. Optional: cut the second sentence of `:534`.

## 5. AI tells and UK English

The lint is clean. A hand search finds what it can't see:

- **Victoria's contrasts.** The style guide allows a villain one "not X, Y" per scene. She has more:
  - Afternoon: `:147` "The question isn't whether systems will fail. It's who benefits…" (keep: it's her thesis), `:187` "security professionals, not moralists", `:211` "Our choice isn't between exploit sales happening or not happening. They already happen." Fix `:211-212` (S2): "Exploit sales happen with or without us." / "The only question is whether researchers get paid for the work, or only criminals profit."
  - Night: `:461` "That isn't cruelty. It's arithmetic." (keep: the lint's permitted one), `:507` "I'm not doing it because you moved me. I'm doing it because you're a better bet than a shallow grave.", `:537` "the dead at St. Catherine's were never the point. They were the proof of concept." On the recruit or escape path she uses two or three in one scene. Fix (S2): `:507` → "Understand what this is, {player_name()}. You didn't move me. You're simply a better bet than a shallow grave." `:537` → "For what little it's worth -- St. Catherine's was a proof of concept. You'll see the rest."
- **Hero contrasts the lint missed.** Debrief `:248` "You didn't just close a case…" and `:392` "A marathon, not a sprint" (S10). Briefing `:207` "Obfuscation, not security." is a tailing negation (optional: "None of it is security.").
- **Stock phrases.** HaX: "You've got this", "Trust your instincts", "Make this count", "Good work", "Well done", "one step closer to the Architect" (`:381`, `:383`). Debrief `:351` "Don't lose it." and `:397` "That reaches a lot further than one building." are tidy last lines. All optional; the first two are the ones a listener will notice.
- **Rhythm.** Better than m07. The cast doesn't share one cadence: the guard's lines are short (median 8), Danny's run long and break, and Victoria varies hers. HaX's triads ("If she delivers. If she isn't burned. If the Architect doesn't smell it.", `:130`) are deliberate and land. Briefing `:63` "Healthcare systems. Grid control. The things that hurt people when they fail." is a rule of three. Fine once.
- **Repetition.** "crossed the threshold" appears at Victoria `:475` and debrief `:188`, and "every fifteen minutes or so" twice in two guard lines (`:285`, `:287`). Cut the second from `:287`. The phone bracket `:277` "They priced the harm in" blunts Victoria's "You priced the bodies in" for players who said both. Optional: phone `:277` → `[They charged extra to hit a hospital. That's intent, on an invoice.]`.
- **UK English (S11).** Receptionist `:73` "programs" → "programmes"; `:145` "in the lot when I leave at 6" → "in the car park when I leave at six"; Victoria `:146` and narrator `:273` "toward" → "towards". "Cyber Security" is correct everywhere. Unicode em dashes (`—`) sit beside `--` in the same files (receptionist `:52`, `:64`, `:121`, `:225`; briefing `:167`, `:168`, `:173`; Victoria `:475`, `:476`, `:500`, `:537`). The TTS doesn't care, but standardise on `--` when those lines are touched.

## 6. Findings list

**Must-fix**

- **M1.** Victoria `:518`: delete the echo. Optionally bracket `:486` → `[You're not walking out of here. Bag down, hands where I can see them.]`
- **M2.** Victoria `:535`: delete the echo; bracket `:488` → `[Go. I've got what I need off your servers. You're just the signature now.]`
- **M3.** Danny `:75` → `[Sterling goes down for her part. You don't have to go down with her -- but you tell them everything.]`
- **M4.** Briefing `:113` → `[What else are they planning?]`; `:114` → "Agent HaX: There's a Phase 2. That's the other thing you're going in to find."
- **M5.** Victoria `:192` → `[And you don't care what the buyers do? That's wilful ignorance.]`

**Should-fix**

- **S1.** The other ten Victoria `You:` lines, as in the table in 4a: fold `:274`, `:293`/`:296`, `:368`, `:373`, `:500`; let her carry `:505`; cut `:521-522`; make `:460` and `:473` one-option `+` choices. Those two are structural, so log them as Danny's were. The no-structure fold for `:460` is in the table.
- **S2.** Victoria's extra contrasts: `:211-212`, `:507`, `:537` (replacements in section 5).
- **S3.** Name the button the player will see (`rfid-ui.js:477`, "Darkside Attack (~30 sec)"). The narration in Victoria's scene says Darkside, but HaX now says "the recovery attack", which matches nothing on screen. Briefing `:168` → "Then Sterling's executive card in the meeting. Custom keys, so it's Darkside -- about half a minute." Phone `:101` → "Sterling's is custom keys. Read it, then run Darkside. About half a minute." Phone `:178` → "Then Sterling's executive card in the meeting. Custom keys -- read it, then Darkside, half a minute." A button label isn't attack detail, so citation level isn't at stake.
- **S4.** Phone `:188` → "It takes time and it exposes you. Work the lock only when the guard's back is turned."
- **S5.** Guard `:160` → `[There's an HVAC fault upstairs. If it trips overnight, this floor cooks.]`
- **S6.** Debrief `:274` callback (section 4e).
- **S7.** Danny `:101` → `[Yours is the only one that'll hold. Make it.]`
- **S8.** Netherton `:27` → "Zero Day Syndicate used to sell exploits to whoever paid. Now they choose the targets first."
- **S9.** Menu-label hub choices in the guard, receptionist, Victoria and phone hint hubs (section 4c). The guard's `[Offer a bribe]` matters most.
- **S10.** Debrief `:158`, `:248`, `:392`, and "tonight" at `:397` (section 4e).
- **S11.** UK English: receptionist `:73`, `:145`; Victoria `:146`, `:273`.

**Optional**

HaX stock lines: briefing `:235` → "That's why you're good at this. Call if you need me."; `:287` → "Good luck."; `:251` end at "…on the back of what Zero Day sold."; debrief `:354` → "Clean enough. Get some rest; we'll need you soon." and drop "Get some rest" from `:397`; phone `:84` → "{player_name()}. You've got the logs. …". Briefing `:207` tailing negation; guard `:287` repeated "fifteen minutes"; phone `:277` "priced the harm in"; Victoria narrator `:534` second sentence; the em-dash style. Pre-existing and not dialogue-pass work, but worth a look: the receptionist's "Ms. Sterling usually authorises visitors herself, so just head over when you're ready" (`:52`) sends the player at a door that needs the cloned badge. HaX's briefing and texts make the badge clear, so this is only a mild mislead. Also, briefing `:119` calls Sterling "the operational lead of the cell" while `:149` says "0day leads the cell".

**Lines this would touch.** About 30 spoken lines, plus around 40 choice brackets once the hub labels (S9) are included, across 7 ink files. No erb text changes. m03 audio isn't generated yet, so there's no TTS cost. All of it is prose inside existing lines and brackets except two items, which are structural and go in the log: the two one-option choices in Victoria (S1 rows 5 and 6). No tag, knot, variable, condition or divert changes.

## 7. Verdict

**Revise** (light). Every runtime check is clean and the structure is unchanged except for Danny's three deliberate choices, which loop safely and improve the scene. The folds kept the information, and the lint is clear (banned-word 0). Fix M1–M5 before it ships. M1 and M2 are the echoes the pass set out to remove. M3 leaves Danny answering a line nobody said. M4 and M5 show the player quoting words they haven't heard, on paths nearly everyone takes. Take S1–S11 in the same edit; all except the two Victoria one-option choices are one-line swaps. Afterwards, rerun tagdiff against the same snapshot (expect +2 choices in Victoria, logged), dialoguelint, reopencheck, and loopcheck on Victoria's night states (`night_confrontation_ready` with and without `usb_seen`; `receptionist_ko`; `guard_told_safetynet`). No new playtest is needed for prose this size, but read the night confrontation once on screen to check the pace with the two new clicks.

Scratch output: `<scratchpad>/m03-scripted/` (`tagdiff.txt`, `lint.txt`, `reopen.txt`, `loop.txt`, `json/`).

## Pass 5 (2026-10-04)

Writer pass on the round-1 dialogue review (`m03-dialogue-r1-review/REVIEW.md`, P4-1..P4-42), full set taken: m03 has no generated audio yet, so voiced rewrites cost no cached clips. Snapshot of the ink before editing: Phase 3 close, 3726cf4.

What changed and why:
- **Victoria's afternoon** (P4-1, P4-2, P4-3, P4-10, P4-11, P4-42): one argument per beat. Cut the four stock analogies down to one per run, the slide-deck mission lines, the "most people" tic (kept the best three) and the two lines that spent her night payoff early ("I sleep fine", "Vulnerabilities are facts"). Choice labels are now things a recruit would say.
- **Victoria at night** (P4-9, P4-12): left alone apart from the echo of the player's choice and three narrator lines that repeated or editorialised.
- **One owner per moral** (P4-4, P4-5): the hospital premium is Victoria's (HaX's briefing echo and the debrief's restatement cut); "encoding isn't encryption" stays in the field guide, the runbook and HaX's workstation texts, and is cut from the debrief and the price-list text.
- **Briefing** (P4-6, P4-7, P4-18, P4-19, P4-20): the learning-outcomes topic is gone; the second reaction to the approach choice is gone; the clone directions say "talk to her"; Nightshade says "Morning." and loses his moral; the opening narration fits the cap.
- **Receptionist** (P4-8, P4-39, P4-32): a warm Cardiff voice instead of a brochure; her greeting no longer duplicates Victoria's; distinct return greeting; the night goodbye answers what was said.
- **Guard** (P4-13..P4-17): one police threat per route, no contradiction; the bribe no longer promises an hour nothing enforces; geography matches the wing; his view of Sterling is his own; missing influence tag added.
- **Debrief** (P4-24..P4-31): one "now we have the proof" line instead of three; the aftermath no longer re-reads Victoria's fate; the recruited branch no longer contradicts itself; Command timing matches the phone.
- **HaX phone** (text only): stale status, UI-speak, a third "rehearsal" line, the bribe "hour", a five-line hint trimmed.

Structure changes (tagdiff vs the snapshot), each deliberate:
- `m03_opening_briefing.ink`: removed `topic_learn` knot, its hub choice and `asked_learn` (P4-6); the three-line `final_instructions` reaction block (P4-7); the `knows_m2_connection` premium line (P4-4); the dead `handler_trust < 50` branch (P4-21); `mission_priority` and its three writes (P4-22); three dead early `player_approach` writes (P4-23; the stance of record is `mission_approach` and `last_advice`'s "aggressive").
- `m03_npc_victoria.ink`: removed the cover line's `player_approach = "diplomatic"` overwrite and the now-unused VAR (P4-23).
- `m03_npc_guard.ink`: added the missing `# influence_increased` tag (P4-17).
- `m03_closing_debrief.ink`: removed the `knows_m2_connection` block and VAR (P4-24), the encoding block (P4-5), the duplicate drive line (P4-28), the dead `handler_trust < 50` branch (P4-21) and the four aftermath fate lines (P4-29).
- `scenario.json.erb`: five dead globals removed (`victoria_trust`, `danny_innocence_confirmed`, `danny_warned`, `danny_protected`, `danny_exposed`; P4-22), and from the m03 block of `missions.json`.

Lint after: 0 errors; 4 warnings, each justified. `choice-len` victoria:483 is the confrontation's offer and earns its 18 words. `not-x-but-y` victoria:462 is the villain's one "That isn't cruelty. It's arithmetic." in the night scene. `stage-cue-density` guard (7/85) and Victoria (12/94): the four cues the words already carried are cut (P4-38); the rest steer delivery on lines that would read flat.

### Pass 5, round 2 (script editor's notes, P4-43..P4-64)

- **Restored** (not new): Nightshade's "One day it'll be our badge somebody clones. Remember how easy it was." in its old place between his two technique lines (P4-43). m08 quotes it; it is the one double-edged Nightshade line this mission is allowed. Round 1's cut was wrong.
- Replies now answer the line before them: Victoria's "Neither." for the either/or question (P4-44), "Do you." for "I test every client's story" (P4-58); the receptionist's re-entry and goodbye no longer assume where the player is in the day (P4-45, P4-46).
- Repeats removed: Victoria's name twice on the arrest branch (P4-47), "That's refreshing." before "Good." (P4-51), the player's label parroting her (P4-49), "supply" three times (P4-56), "rest" twice (P4-59), "Get out. Now." before the warning (P4-60), the receptionist's brochure restatement (P4-53).
- Facts: the receptionist names Danny as an evening worker (P4-52); the guard knows the wing holds one consultant, Mr Foster (P4-55); the briefing says whose badge opens the conference area (P4-64); the lawyers quote her own phrase (P4-63); the bribe label no longer promises an hour (P4-62).
- Structure: one condition (P4-48): "You left some of the paper behind." plays only when the history or the catalogue is missing, so it always names something.
- Receptionist: voice kept as it is; no further dialect.

### Pass 5, round 3 touch-up (P4-65..P4-72)

Round 3 closed Phase 4; these are its one-line follow-ups, all taken. Five voiced lines reworded (Victoria ×2, debrief ×4 counting the two "stayed" lines, receptionist, guard; see the loop log for old → new), no cuts beyond Victoria's "Real targets, not textbook ones." tail. Dead ink-local VARs removed after checking none is a scenario global or read anywhere: debrief `whiteboard_seen` (declaration only; the global stays and the phone still reads it), danny `player_choice_made`, guard `player_has_excuse`, receptionist `clone_reception_badge_done`, victoria `topic_free_market`, with their writes. tagdiff shows only those var/assign removals.
