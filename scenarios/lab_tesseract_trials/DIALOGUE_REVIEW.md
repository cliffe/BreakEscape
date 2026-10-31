# The Keyholder Trials: dialogue review

Reviewer: dialogue review (npc-dialog-review skill, plus teaching, fun, real-academic and TTS checks). Read-only apart from this file. Build reviewed: commit 64acb9c6 (build pass).

Tags: **blocker** (breaks play or must not ship), **major** (fix before the playtest or ship), **minor** (polish). Line numbers are for the files as committed.

## 1. Compile, validator, lint, runtime

- **Compile:** all nine `.ink` files compile with `bin/inklecate`, written to the scratch folder so the committed `.json` files were left alone. No errors and no "apparent loose end" warnings.
- **Validator (dialogue-facing only):** "All ink files valid". No unresolved speaker prefixes, no `//` or stray `*` hazards, no `#give_item` mismatches, and `narrator` has a voice block. One phone warning: the Keyholder device has no `currentKnot`. That's deliberate (build rule 5, engine item E1), so it isn't a finding. The rest of the 38 warnings are about the graph and layout and belong to scenario-design-review.
- **dialoguelint:** "No dialogue lint findings". **But the lint counted 0 lines for `npc_cliffe`, `npc_jordan`, `npc_megan`, `npc_sidhu` and `npc_tom`**, because none of their lines carries a `Name:` prefix. Line length, AI tells and `you-after-choice` were never checked for the five person-chat NPCs. I read every one of those lines by hand for this review (see M5).
- **loopcheck:** 15 entry and state combinations, all clean: every NPC's `currentKnot`; Ghost at `start` and `the_offer_call`; HaX in the offer and refused states; the debrief on the sent and double routes.
- **reopencheck** (`missions.json`, `lab_tesseract_trials`): 0 problems. The HaX hub and Ghost's `waiting`, `the_offer_again` and `closed` each print a line on re-entry.
- **State wiring:** every `#set_global` (`decision_made`, `ending`, `ghost_greeted`, `ghost_offer_made`, `megan_choice`, `megan_choice_made`, `refusal_reported`, `report_read_claimed`, `start_debrief_cutscene`) is declared in `globalVariables` and read somewhere. One read is in the wrong place: `late_warning` (M2).
- **Speaker attribution in person-chat:** `person-chat-minigame.js` gets one ink line per `continue()` and builds blocks per result. An unprefixed line therefore falls back to the conversation's NPC and does **not** run on in a preceding `Narrator:` block. So Cliffe's "Reckon that's enough of a preview." (`npc_cliffe.ink:42`) and Megan's "They wrote that down?" (`npc_megan.ink:60`) are attributed correctly at runtime. The risk in M5 is to process, not to play.

## 2. Structure and wiring (skill sections 2a-2i)

**2a Attribution and narration: CONCERN (M5).** `Agent HaX:` in the briefing and debrief resolves to the hidden NPCs' `displayName`. The five person-chat NPC files have no prefixes at all (see section 1). The house standard ("person-chat inks keep prefixes", PASS4_DIALOGUE_WRITER_PROMPT) exists so the lint can see the lines and so a later edit can't silently change who is speaking. Narrator use is light and well split (Cliffe closing the lid, Megan going quiet, Sidhu checking the signature).

**2a-bis Supported by the scenario: mostly OK.**
- Geography is right: the teaching lab is west of the foyer (`opening_briefing.ink:52`) and the workshop is north of the corridor (erb `"Brass... The workshop's north."`).
- Cliffe's map exists as `cliffe_laptop` and the workshop smartscreen. Nobody claims to move.
- **CONCERN (M4):** the debrief tells every player "Hand in the device... It sat next to theirs all day" (`closing_debrief.ink:82`). A player who left the Keyholder device in the lockbox (`ghost_greeted` false) never had it, and Ghost's offer already branches on that (`phone_ghost.ink:126-132`).
- **CONCERN (minor):** `cliffe_schreuders` and `cliffe_workshop` are two NPCs with separate ink state. So `asked_build` from the common room never reaches the workshop, and "Same thing as before. Bit further along." (`npc_cliffe.ink:89`) asserts a visit the player may not have made.

**2a-ter Voices: CONCERN (M6).** Every speaking NPC has a voice, the names are all distinct within the mission, and each accent is named. HaX's three style strings (erb:378, 399, 481) don't carry the voice bible's identity part word for word ("Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch."), which the bible says must be the same in every mission.

**2b Choices as spoken words: OK, with three phrasing slips.**
- `opening_briefing.ink:14` `[Read it. Go on.]` sounds like the player is telling HaX to read it. Use `[Got it. Go on.]`.
- `npc_tom.ink:49` `[Can you go over the board again?]` says "again" on the first ask. Use `[Walk me through the board?]`.
- `npc_sidhu.ink:40` `[I had something signed. I made a choice about it.]` is stiff. Use `[That signed report. I've made my choice.]`.

No `You:` echoes. The non-verbal `[Close the device.]` is fine.

**2c Hubs: OK.** Every hub has a sticky exit with a one-line reply, and no hard `END`. Two exits don't match what the player said:
- `npc_tom.ink:31` `[Thanks. I'll get on.]` doesn't exit: it lands on "Owt else?" and the hub. Either add `#exit_conversation` with "Go on then." or reword the choice to `[Right. What else should I know?]`.
- `closing_debrief.ink:104-119`: both questions are sticky and re-askable forever. "That's classified." lands once; on the third ask it's a loop. Make them `*`, with `[That's everything.]` kept sticky.

**2c-bis Starved knots: OK.** loopcheck and reopencheck are clean.

**2d Choices that matter: OK overall, and the climax is good.**
- Megan's three-way choice (warn, ask HaX, do nothing) is paid off by Ghost's offer (`phone_ghost.ink:133-135,148-152`), Ghost's bursary text (erb:463), the debrief (`closing_debrief.ink:86-95`) and the credits.
- `report_read_claimed` goes to the credits. The ending choice reaches Cliffe, the debrief and the credits.
- Ghost's offer hub is legitimate stance-convergence: info choices that loop back.
- **CONCERN (M2):** the late warning is broken (section 8).

**2e Cross-file state: one break (M2).** `late_warning` is set only when `ending == 'sent'` (erb:432) but read only inside `opening_double` (`closing_debrief.ink:48-50`), where it can never be true. The send-then-warn player gets a debrief that ignores their flag and then asks "Did you read it?", although they plainly did.

**2f Influence: N/A.** No influence tracks. That's acceptable for a short lab with no rapport gates.

**2g Syntax: OK.**

**2h KO: N/A** (`disableAttacks: true`).

**2i Pass-4 recurring bugs:**
- **Stale hub greeting.** After `asked_terminal`, Tom opens every visit for the rest of the game with "Go on then. Tell me how you got into it." (`npc_tom.ink:40-41`), even long after the terminal is open. Branch on `guest_terminal_open`: "You got into it, then. Good. I'm still not ordering one."
- **Hub greeting repeats after every topic.** Jordan's "Any questions? I get a referral bonus, so ask away." (`npc_jordan.ink:20`) and Cliffe's "Still here. Coffee's still terrible." (`npc_cliffe.ink:24`) print after each answer. The second one lands straight after he has shut the laptop on you. Vary them with `{&...|...}` or a quiet flag.
- **The same fact twice:**
  - `opening_briefing.ink:22` → `:29`: the player says "Ghost's people" and HaX then explains who Ghost is.
  - `phone_agent_0x99.ink:168` "Received." is followed 1.5 s later by the text "Received. Opening it now." (erb:433). Change the ink line to "Copy."
- **Stale state line.** Megan, warned, says "I'm still thinking about what you said. Proper thinking." (`npc_megan.ink:27`) after she has said "I'm out." (`:63`).
- **First contact opened late.** Ghost's intro says "There are seven more Trials." (`phone_ghost.ink:57`) even when the device is first opened after Trial III or IV.
- **Debrief against every route:** see M2 and M4. The "clean no" line (`closing_debrief.ink:79-81`) also runs on `blown`, which was not a clean no.

## 3. Voices: HaX and Ghost against m01/m02

**HaX: close, slightly too thin.** The voice-bible habits are there: short lines, fact first, clipped acknowledgements ("Copy.", "Sent."), and care shown by acts (the Comms note on line one, "Not on this line. Leave it with me."). The best lines are hers: "CryptoSecure is Ransomware Incorporated with a logo." (`opening_briefing.ink:21`), "We moved me, and two others, before midnight. Nobody's hurt." (`closing_debrief.ink:33`), "Then you'll have your reasons, and one day you'll tell me them. Not today." (`:41`).

Where she drifts:
- The field-note acknowledgements ("AES. Sent.", "Public keys. Sent.", "Hashes. Sent.", `phone_agent_0x99.ink:105-113`) are terser than m02's HaX, who gives a reason after the fact ("Forty-seven on generators, twelve hours of fuel, and a board vote in four."). One clause of why each would help. For example: "AES. Same key both ends. Sent." and "Public keys. Yours is the one that opens. Sent."
- "mind" (`closing_debrief.ink:62`, "You were right about the report, mind.") is a northern tag, not her RP register. Cut it.
- She never says "Agent" or the player's name at the top of a serious line in the debrief. "Sit down." would land harder as "Sit down, Agent."

**Ghost: the offer is in voice; the device lines aren't.**
- The video call earns its length and sounds like m02. "I switched off the recorders, not the cameras. I watched you all night." (`phone_ghost.ink:111`), "You still walk like you're expecting a door to be locked." (`:112`), "A recruit has to be smuggled in. A double agent is already inside." (`:122`) and "The relay closes when you leave the building. I don't." (`:157`) are precise and unhurried.
- The numbers-as-weapons habit lives mostly in the erb texts ("Two hundred and twelve candidates picked up a card. Forty opened the locker.").
- The device's own ink lines are flatter than m02's Ghost, who is wordy, wry and formal ("rather", "I'd thank you", "Sit with that"):
  - "A key word, then a key pair. Keep going." (`:71`) is encouragement. Ghost doesn't cheer. Use "A key word, then a key pair. Fewer than twenty of you will see the second."
  - "Still watching." (`:77`) is fine once. It's the default for most of Act 1, so it will be read many times.
  - The refusal (`:184`) closes on a stock villain line: "It won't be the last thing you regret saying no to." In m02 Ghost answers a refusal with "Noted." and a precise, slightly amused observation. Use: "Noted. Two hundred and twelve picked up a card and you're the first to say no to me. I'll put you in the column for it." This echoes m02's "I've a column for it."
  - "You took your time collecting this. I didn't take mine watching you." (`:55`) is hard to parse. Use: "You left this in my box for three Trials. I watched all three."

**Canon (M1).** "At St Catherine's you never asked my name. Most people do. It's Ghost." (`phone_ghost.ink:113`) contradicts m02 in three ways:
- In m02, Ghost refused a name on this exact kind of call ("No name tonight, no face.", `m02_phone_ghost.ink:544`).
- The m02 device printed "CONTACT: GHOST".
- HaX has just named Ghost in the briefing (`opening_briefing.ink:29`).

The reveal this scenario needs is that the Keyholder *is* Ghost, not Ghost's name. Suggested rewrite: "I told you at St Catherine's: no name. That hasn't changed. You can keep calling me what your handler does." It's in voice, it's true to m02, and the player says the name in their head. If a spoken name is wanted for players who skipped m02: "...what your handler does. Ghost."

Also "Your monitors said no signal. Mine didn't." (`:112`) can read as the patient monitors from m02's ward. Use "Your CCTV screens said no signal. Mine didn't."

Pronoun "they" is used correctly throughout. Ghost never appears in person.

## 4. Teaching and technical accuracy

**Does it teach a true beginner?** Yes, and briefly. The build-up is short and in the right order: the Byte Wall plaque, the powers-of-two poster, the ASCII chart, the paper tape, FN1-FN3 and Tom's board. It covers what a bit and a byte are, place values, what a character encoding is, and hex as four bits a digit, all before the first lock asks for a decode.
- Later notes build on earlier ones, as the brief asked: Base64 as 6-bit groups with a worked "Hi!", Caesar as "your first key", Vigenère as a key word, AES then the key-distribution problem, then RSA as the answer, then signatures.
- Megan teaches the Trial II trap by example (`npc_megan.ink:47-49`), which is the best teaching in the game: a character's mistake, with no lecture.
- Tom's three lines on the board and Sidhu's three on hashing are the longest explanations in dialogue, and both stay under four lines.
- There are no quizzes and no graded content questions. The debrief's "You can read Base64 now." is the right size.

**Claims checked (all correct):**
- Bytes and bases: 01001101 = 77 = 0x4D = "M"; "Hi" = 72 105 = 0x48 0x69; ASCII "4" = 52; printable codes are 2-3 decimal digits; digits are ASCII 48-57; and digits read as hex give capital letters.
- Base64: "Hi!" → 010010 000110 100100 100001 → 18 6 36 33 → "SGkh"; the alphabet is "A-Z, a-z" (the lab sheet's "a-Z" error is not repeated); output length is a multiple of 4; `.pem` files are Base64.
- Caesar: 25 keys. CyberChef 10.19.4's ROT13 does accept a negative Amount (I read the bundled source: `s<0&&(s=26-Math.abs(s)%26)`), and `tr 'G-ZA-Fg-za-f' 'A-Za-z'` undoes a shift of 6.
- DES: 2^56 (the lab sheet's "256" error is not repeated).
- AES: 128/192/256-bit keys, 16-byte blocks, CBC chaining from an IV, the IV not secret, and the `openssl enc -K -iv` line.
- RSA: "as with symmetric keys" is fixed. OAEP is shown in `pkeyutl`, and the generator uses `PKCS1_OAEP_PADDING`.
- Hashes: SHA-256 is 256 bits = 64 hex digits, and CyberChef's SHA2 does default to 512 (bundled source checked). The `printf` vs `echo` new-line warning is correct.
- Signatures: hash-then-sign; RSA Verify on the Base64-decoded signature returns "Verified OK" (bundled source); and the report really is signed over its Base64 text (erb:124), which matches FN10's "check exactly what was signed".
- EBCDIC: "A" is 0xC1; "Decode text" IBM037; and `iconv -f IBM037`.
- Tracking pixels: a one-pixel remote image; fetching it tells the server when, and roughly where (by IP), the message was opened; turning remote images off stops it.

**Findings:**
- **M3 (major), erb:136, punched tape.** The hole pictures contradict their own binary. Row 1 is drawn `● ○ ○ ● ○ ○ ○ ○` (10010000), but the text says 01001000. Row 2 is drawn `● ○ ○ ● ○ ○ ● ●` (10010011), but the text says 01001001. A beginner who checks the picture against the numbers will think they've misunderstood. Fix the rows to `○ ● ○ ○ ● ○ ○ ○` and `○ ● ○ ○ ● ○ ○ ●`.
- **M7 (major), `npc_sidhu.ink:68`.** "It verifies. That tells you who wrote it, and that nobody has changed it." The report's text says `FROM: Agent 0x00` (erb:115), but it's signed with the Keyholder's key. A signature tells you which key signed it, not who the text claims wrote it. Here that gap is the whole plot, and Sidhu is the one person who would catch it. Rewrite: "It verifies against the Keyholder's key. So the Keyholder signed it, whatever the FROM line says, and nobody has touched it since." Then keep "It does not tell you whether you should send it." That's more accurate, and it's a better scene.
- **minor, erb:142 (FN6), "a stray extra line throws the key out of step".** The bundled Vigenère Decode skips non-letters without advancing the key, so a stray new line does nothing. Extra *letters* before the ciphertext (a heading, a label) are what break it. Rewrite: "Copy only the ciphertext: any letters before it, such as a heading, knock the key out of step."
- **minor, erb:142 (FN6), "The same letter encrypts differently each time".** It can encrypt the same way when the key letter repeats. Use: "The same letter can encrypt differently each time, so counting letters stops working."
- **minor, `npc_sidhu.ink:63`, "That is how good systems store passwords."** Plain hashing is how bad systems do it. Use: "That is the start of how good systems store passwords. They add salt and a slow hash, but that is another lecture." It stays in his voice and stays true.
- **minor, erb:145 (FN9), "The public key... only locks."** FN10 then has the public key checking signatures. Use: "For encryption, the public key only locks."
- **minor, erb:464 (Ghost), "It's how forty of our invoices opened last year."** This muddles the lesson: hybrid encryption is how the files were *locked*. Use: "Hybrid encryption. Nine candidates got this far. It's how we locked forty companies last year."

## 5. Fun

**What works:**
- The reveal is genuinely good. "Keyholder" turning out to be the hood from St Catherine's, with the recorders-not-cameras line, rewards m02 players and still makes sense to new ones.
- Ghost prices every route in their own currency, so the choice pulls both ways.
- Megan gives the player someone to lose.
- Cliffe's "Good luck with it, Agent. ... Student. Sorry. Long week." is the best small beat in the script. His post-decision lines ("Interesting choice of channel.", "Phones. Never trusted them.") make him feel present at the climax without saying anything.
- Jordan's dramatic irony ("Companies get hit by ransomware, CryptoSecure gets them back up. Very busy, apparently.") is quick and funny.
- Tom's "Half a mind to break into it myself. Go on then. You first." gives the player permission and character in one line.

**What's missing:**
- **M8 (major), the double-agent debrief has no pay-off line.** The design's "Congratulations. You now work for both of us. Only one of us knows." (DESIGN section 8) was dropped. `opening_double` (`closing_debrief.ink:44-51`) is three practical lines, so the hardest ending feels like the plainest. Add it after "Thank you for the flag.", then keep the "something we can't fake" cost line in `why_you`.
- **The sent ending names no personal cost to 0x00** (part of M8). The design says SAFETYNET can't know whether 0x00 is Ghost's now, "so HaX can't either", and that line never made it in. Add one after the "Did you read it?" exchange: "Ghost thinks you're theirs now. I'm meant to wonder too. I'm trying not to."
- **M2 (major)** also costs fun: the player who did the hard thing late gets no acknowledgement. Add to `opening_sent`, with `VAR late_warning` and `warned_out_of_band` declared: `{ late_warning or warned_out_of_band: Agent HaX: Your flag reached me after the report did. You tried. It was already open. }`. Delete the dead line at `closing_debrief.ink:48-50`.
- **The refusal route** ends on Ghost's weakest line (section 3). The `blown` route shares `why_you`'s "A clean no is worth something", which isn't what happened. Give `blown` its own line: "Next time, the scoreboard. It's why it's there."
- Ghost's device lines between Trials are the main source of tension in Acts 1-2, and in ink they're mostly flat. The erb texts carry the threat. Two or three of the `waiting` variants in m02's register (section 3) would keep the hood in the player's pocket.

## 6. The real academics

All three portrayals are warm, competent and on the student's side, or (for Cliffe) intriguing. Nothing in the dialogue would embarrass any of them in front of a lecture theatre. A few things to check with the user:

**Dr Z. Cliffe Schreuders: flattering and recognisable. Watch the accent density.** He builds learning tools ("A game where you learn by getting caught."), he's hard to pin down, and he knows more than he says. The slip, the scoreboard line and the four ending lines carry the "leader / story NPC, not a helper" brief well. He never helps with a puzzle.
- **minor:** across about 14 short lines he has "G'day", "No worries", "Reckon" twice and "mate". That's dense enough to tip from word choice into stock Australian in front of students. Drop "G'day" (`npc_cliffe.ink:27`: "Don't mind me. I'm hiding from a committee.") and one "Reckon" (`:42`: "That's enough of a preview.").
- **minor, check with the user:** the coffee-station sign "Wash your mug. This means you, Cliffe." (erb:666) is affectionate, but it's a jab at a real person on screen. "Hiding from a committee" is self-deprecating, which is safer.

**Dr Tom Shaw: warm and practical, true to "practical hacking challenges".**
- **minor, check:** "Tom Shaw, I run the first-year induction." (`npc_tom.ink:24`) states a real person's job. If that isn't his role, use "Tom Shaw. I look after the first-years this week."
- **minor:** "Go on then" opens three of his lines (`npc_tom.ink:41,53,59`). It's a nice Yorkshire tic once or twice. Change the exit to "Right. Off you go." and the stale greeting as in 2i.
- His Huddersfield comes through "Right then", "owt" and "nowt", "flogging" and "mind" without phonetic spelling. Good.

**Dr Sidhu Selvarajan: courteous, exact, recognisably an editor and blockchain lecturer.**
- "Let us be exact about the difference, because people confuse them." and "I like to watch a signature check out." are both in character and flattering.
- The Indian English is carried by register only ("Come in, come in", "Do check everything twice"). It's respectful, and the brief's ban on stock markers is honoured.
- **optional:** one line could use his reviewing and editing for recognition, e.g. in `hash_for`: "I see it in every second paper I review."
- M7 makes his climax line both more accurate and more his. His scene is the moment a hash and signature expert sees what the signature is really saying.
- **minor:** `npc_sidhu.ink:28` "Take these. One on hashes, one on signatures." is said even when he hands over only FN10 (because `fn07_had` is already true). Branch the line: `{ fn07_had: Take this. It is on signatures. - else: Take these. ... }`.

## 7. TTS

Scope: phone messages are voiced only when prefixed `voice:` (`phone-chat-ui.js:570`). So the HaX phone hints, field-note replies and all timed texts are text only. That keeps "IV", "Trial VII", "ROT13" and the hex strings out of the TTS. The spoken material is the person-chat files, the briefing, the debrief and Ghost's video call.

- **No generated secret is in any spoken line.** The ink interpolates no ERB values. The token, PINs, passwords and the key fingerprint appear only in item text and observations.
- **minor, `opening_briefing.ink:43`, "Dr Z. Cliffe Schreuders".** The "Z." risks "zee" (US) or a sentence-break pause after the full stop. "Schreuders" is likely to come out as "SHROO-ders". In speech, use "Dr Cliffe Schreuders" (the displayName can keep the Z.), and have the user listen to the cached line once for the surname.
- **minor, `phone_ghost.ink:111,113,114`, "St Catherine's".** Gemini usually reads "St" as "Saint" before a name, but not always. m02 uses "St." too, so leave it if m02's audio was fine. Otherwise spell "Saint Catherine's" in spoken lines only.
- **OK:**
  - "G'day" (if kept), "owt", "nowt", "Oyelaran", "Selvarajan", "Rotterdam", "Hacktivity", "CyberChef", "Base64" and "Miskatonic" should all read cleanly.
  - Tom's numbers are written as words ("seventy-two, a hundred and five", "four-eight, six-nine"), which is exactly right for TTS.
- **Accents.** Every person-chat line reads aloud in its accent without phonetic spelling. Megan's "our mam", "dead good", "done my head in" and "proper" sit naturally in Leda's Manchester style. Jordan's "mind" (`npc_jordan.ink:25`) is northern, not Estuary. Use "to be fair".

## 8. Findings by severity

**Blockers: none.** Everything compiles, every conversation survives loopcheck and reopencheck, and no consequence choice can soft-lock the player.

**Majors**

| # | Where | Finding | Suggested fix |
|---|---|---|---|
| M1 | `phone_ghost.ink:113` | "At St Catherine's you never asked my name. Most people do. It's Ghost." contradicts m02: "No name tonight, no face.", the device's "CONTACT: GHOST", and HaX's briefing. | "I told you at St Catherine's: no name. That hasn't changed. You can keep calling me what your handler does." (optionally add "Ghost.") |
| M2 | `closing_debrief.ink:30-51`; erb:432 | `late_warning` is only ever true on `ending == "sent"`, but it's read only in `opening_double`. The send-then-warn player is ignored and then asked whether they read the report. | Declare `VAR late_warning`; in `opening_sent`, before the question: `{ late_warning: Agent HaX: Your flag reached me after the report did. You tried. It was already open. }`; skip "Did you read it?" when `late_warning` is true (they did). Delete `:48-50`. |
| M3 | erb:136 | The paper-tape hole rows contradict the binary printed under them. | Row 1 `○ ● ○ ○ ● ○ ○ ○`, row 2 `○ ● ○ ○ ● ○ ○ ●`. |
| M4 | `closing_debrief.ink:82` | "Hand in the device... It sat next to theirs all day." is false if the device was never taken (`ghost_greeted` false; Ghost's offer already branches on this). | Declare `VAR ghost_greeted`; `{ ghost_greeted: (current line) - else: Agent HaX: We're replacing your phone anyway. Ghost had the building's network all week. }` |
| M5 | `npc_cliffe/jordan/megan/sidhu/tom.ink` | No `Name:` prefixes in person-chat. dialoguelint saw 0 lines in five files, so length, AI-tell and you-after-choice checks never ran. This is against the house standard. | Prefix every spoken line with the exact `displayName` (`Dr Z. Cliffe Schreuders:`, `Jordan Pike:`, `Megan Oyelaran:`, `Dr Sidhu Selvarajan:`, `Dr Tom Shaw:`), then re-run the lint. |
| M6 | erb:378, 399, 481 | HaX's style strings lack the voice bible's identity part, which must be word for word: "Speak with a consistent British Received Pronunciation accent throughout — do not shift to any other accent. Use a steady, mid-range pitch." | Put the identity part first, then keep the scene sentence ("Brisk, dry, short sentences."). Do it before any audio is cached. |
| M7 | `npc_sidhu.ink:68` | "That tells you who wrote it": the report says FROM: Agent 0x00 but is signed with the Keyholder's key. A signature identifies the key, not the claimed author. | "It verifies against the Keyholder's key. So the Keyholder signed it, whatever the FROM line says, and nobody has touched it since." |
| M8 | `closing_debrief.ink:44-51, 30-42` | The double ending lost its pay-off line, and the sent ending names no cost to 0x00. | After `:47`: "Agent HaX: Congratulations. You now work for both of us. Only one of us knows." In `opening_sent`, after the read/unread reply: "Agent HaX: Ghost thinks you're theirs now. I'm meant to wonder too. I'm trying not to." |
| M9 | `phone_ghost.ink:55,71,184` | The device lines and the refusal fall below m02's Ghost: a cheerleading "Keep going.", an unparseable intro line, and a stock villain sign-off. | See section 3: "You left this in my box for three Trials. I watched all three." / "A key word, then a key pair. Fewer than twenty of you will see the second." / "Noted. Two hundred and twelve picked up a card and you're the first to say no to me. I'll put you in the column for it." |

**Minors** (detail and rewrites in the sections cited)

- Choices: `opening_briefing.ink:14` "[Read it. Go on.]" → "[Got it. Go on.]"; `npc_tom.ink:49` "again"; `npc_sidhu.ink:40` (2b).
- `opening_briefing.ink:12`: "That's classified too." comes before anything else has been classified. Use "That's classified. Next." The running gag then starts here.
- `opening_briefing.ink:22→29`: same fact twice. Give the `[Ghost's people.]` branch "Yes. Ghost's." and skip the explanation line.
- `npc_tom.ink:31`: "I'll get on" doesn't exit. `npc_tom.ink:40-41`: stale greeting. "Go on then" ×3.
- `npc_jordan.ink:20` and `npc_cliffe.ink:24`: greeting repeats after every topic. Jordan's "mind" → "to be fair".
- `npc_megan.ink:27`: "still thinking" after "I'm out". Use "Binned the leaflet. Still skint, mind. Worth it." `npc_megan.ink:53`: "My mam's care home is two months behind." → "My mam's care-home fees are two months behind."
- `npc_cliffe.ink:89`: "Same thing as before" assumes a common-room visit (separate NPC state). Use "The building. Bit further along than this morning." Accent density (section 6). Coffee sign (check with the user).
- `npc_sidhu.ink:28`: "Take these" when handing one note. `:63`: password-hashing claim.
- `phone_ghost.ink:57`: "seven more Trials" is stale when the device is opened late. Use "You opened a box most of your year walked past. The rest get harder." `:112`: "monitors" → "CCTV screens".
- `phone_agent_0x99.ink:168`: "Received." duplicates the timed text. Use "Copy." `:105-113`: add a clause of why to the bare "X. Sent." acknowledgements.
- `closing_debrief.ink:62`: "mind" is off-register for HaX. `:79-81`: "clean no" on `blown`. `:104-119`: re-askable questions; make them once-only.
- FN6 Vigenère stray-line claim and "each time". FN9 "only locks". Ghost's "invoices opened" text (section 4).
- TTS: "Dr Z." in speech; listen once for "Schreuders" and "St" (section 7).

## 9. Ten weakest lines

1. `phone_ghost.ink:113`: "At St Catherine's you never asked my name. Most people do. It's Ghost." Breaks m02 canon at the reveal (M1).
2. `phone_ghost.ink:184`: "It won't be the last thing you regret saying no to." Stock villain sign-off on the refusal ending (M9).
3. `npc_sidhu.ink:68`: "That tells you who wrote it, and that nobody has changed it." Inaccurate, and it misses the plot point (M7).
4. `closing_debrief.ink:49`: "Even if it came a little late to be any use." Unreachable, and contradicts the route it sits in (M2).
5. `phone_ghost.ink:55`: "You took your time collecting this. I didn't take mine watching you." Hard to parse (M9).
6. `closing_debrief.ink:82`: "Hand in the device. ... It sat next to theirs all day." False when the device was never taken (M4).
7. `phone_ghost.ink:71`: "A key word, then a key pair. Keep going." Ghost cheering the player on (M9).
8. `npc_megan.ink:27`: "I'm still thinking about what you said. Proper thinking." Said after she has quit.
9. `npc_tom.ink:41`: "Go on then. Tell me how you got into it." Stays as his greeting for the rest of the game.
10. `opening_briefing.ink:12`: "That's classified too. Next." "Too" before anything has been classified, so the running gag starts on the wrong foot.

## 10. Verdict

**Revise.** No blockers. The script is short, mostly sharp and well wired: the climax, Megan, Cliffe's slip and Jordan's irony all work, and the teaching is accurate apart from the tape picture and Sidhu's signature line. The nine majors are small text edits plus two conditionals in the debrief (M2, M4) and the prefix pass (M5). They should go in before the timed blind playtest, because M1, M3 and M7 put wrong canon or wrong teaching in front of students, and M5 leaves five files unlinted. After that, re-run dialoguelint (it will see the person-chat files for the first time), loopcheck on the debrief with `ending=sent late_warning=true` and `ghost_greeted=false`, and tagdiff on each file.
