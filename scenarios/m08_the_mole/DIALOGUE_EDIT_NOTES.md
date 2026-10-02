# m08 The Mole — script editor's notes on the dialogue pass

Fresh review, 2 October 2026. Read-only apart from this file.

Baseline: the writer's snapshot `<scratchpad>/m08-dialogue/ink-before/` (ink) and
`m08-dialogue/scenario-before.json.erb`. The current files were compared against it line by line. Line numbers
below are the **current** files unless marked "before". References: `docs/agents/PASS4_BRIEF.md`, the dialogue
style guide, the voice bible, the humanizer rules, `DIALOGUE_REVIEW.md`, and the m07 bar
(`m07_architects_gambit/DIALOGUE_SAMPLES.md`, `DIALOGUE_EDIT_NOTES.md`).

The short version: a sound pass. Every line is under the caps, the scripted player lines are gone, the phone
reads like a phone, and nothing a player needs was cut. The finale lost some pace in the process. The
confrontation now opens with eleven to sixteen lines before the player says a word, and Nightshade recites
the evidence twice in that run. Two smaller slips: one HaX text blurs the twist, and Nightshade's job title
still needs aligning with the voice bible. Verdict at the end: **revise** (light).

## 1. Logic safety (mechanical checks)

All run by me in this session; output in `<scratchpad>/m08-scripted/`.

| Check | Result |
|---|---|
| `tagdiff.mjs --old <before> <after>`, each of the 12 ink files | **structure: unchanged** in all 12. Prose only. `You:` lines 4 → 0 (confrontation 3, briefing 1). |
| Compiled JSON in step with the ink | Recompiled all 12 with `bin/inklecate` into scratch; every JSON equals the committed one. |
| `dialoguelint.mjs` | Totals by rule: **none**. Medians: confrontation 15 (max 24), Netherton 18 (29), debrief 17 (30), HaX phone 12 (24), HaX in person 15 (23), suspects 15–17. Timed texts median 28, max 30. |
| `reopencheck.mjs … m08_the_mole` | agent_0x99: 1800 reopens, **0 problems**. (The person-chat scenes aren't in its scope.) |
| inkcheck + loopcheck, the writer's 59-state matrix | **118/118 clean**, identical to the writer's run apart from timings. |
| `validate_scenario.rb` | 0 errors; the same two structural warnings as before the pass (debrief `brief_taken` handlers; cutscene without `onceOnly`). |

The erb diff touches only `message` and `description` strings (15 texts, one task description).

Nothing here blocks. The pass changed words, not logic.

## 2. Information: what the player needs, and where it is now

Walked the critical path and each optional branch against the before-copy.

| Step | Where it's delivered now | Findable again? |
|---|---|---|
| Go to the Director, north of the lobby | ATHENA `m08_opening_briefing.ink:28`; HaX text erb `:614`; task `:285` | Yes |
| Kit: picks, cloner, print kit; PIN cracker still with 0x47 | ATHENA `m08_opening_briefing.ink:15-16` | Inventory |
| Stakes: two dead, a mole within a hundred metres, stay quiet | Netherton `m08_director_netherton.ink:70-74`, rules `:112-115`; ATHENA `:22-26` | Aftermath board (erb `:1241`) |
| Where the three suspects sit | Netherton `:94`, `:99`, `:104`; `access_request` `:134-143` (sticky, repeats per suspect); tasks `:315-327` | Yes |
| Server room: clone Netherton after the three interviews, or the reception printer | `access_offer` `:148-150`; `clone_debrief` `:167-169`; HaX hub `m08_phone_agent_0x99.ink:57-66`; texts `:740`, `:748`, `:780` | Yes (sticky hub) |
| Printer PIN and archives passphrase: post-it by the kettle | ATHENA `m08_receptionist_ai.ink:15-16`; HaX `:94`; KO text `:685` | Object (post-it) |
| Door logs in the Security Archives, south of the ops floor | HaX `:93-95`; timeline object "Get the door logs" | Yes |
| The door-audit check | Netherton `:217-343` (section 4d) | Sticky choice `:121` |
| Suite code: Director's safe, PIN = his service number on the ops-floor printout | ATHENA `m08_receptionist_ai.ink:19-21`; HaX `:83-91`; Netherton `told_him` `:197`, `audit_right` `:341`, `repeat_code` `:346` | Yes (three sources) |
| VM stages | HaX texts erb `:622`, `:630`, `:638`, `:650-651`, `:798`, `:812`; hub `:68-80`; guides `:115-145` | Yes |
| Locker key, after the audit or Okafor | Nightshade `m08_suspect_nightshade.ink:94-97` | Sticky until given |
| Interrogation room, south of the Crypto Lab; all four flags first | HaX `:84`, `:88`, `:97-99`; texts `:665`, `:672`, `:678` | Yes |
| The twist: the four attacks covered the database theft | Confrontation `:126-132` (optional topic); flag-4 text erb `:650-651`; debrief `:133-137` | **Blurred in the text**, see M3 |
| Tomb Gamma coordinates | Confrontation `:139` or `aftermath` `:182` | Debrief `:144-148` |

Losses and blurs, by severity:

- **M3.** The flag-4 text (erb `:650`, `:651`) now says "The root file says that night covered our threat
  database." "Covered" reads as "included" or "reported on". Before, it said what the night was *for*
  (before: "says what the four-site night was really for: our threat database"). This is the one place a
  player who skips Nightshade's database topic learns the twist before the debrief. Fix in section 6.
- **S6 (pre-existing).** `aftermath` `:181-183` (the `gamma_volunteered` path) says "You never asked where it
  all went" and "The database went there". That path runs when the player never asked about The Architect,
  which includes a player who never asked about the database either. For them "it" and "the database" have
  no antecedent at the moment of the series' biggest reveal.
- **S7.** `audit_right` `:341-342`: "The code is {suite_code}." then "The card with the code is in my safe,
  with Okafor's evaluation. Read that before you face him." "That" can be the card or the evaluation. The code
  itself is safe (sticky `repeat_code`), so this is clarity only.

Everything else the cuts removed was colour, or was already on paper (the timeline, the aftermath board, the
case file, the Deep State brief). The suite-code answer keeps every step and is better than before: "in the
ops-floor tray" (`:90`) is more exact than the old "on the ops floor". Directions match the `connections`
block (erb `:37-39`).

## 3. Character

**Netherton.** Back near the voice bible: formal, short declaratives, one blunt verdict per speech, median 18
(was 29). "I have never had to say the next sentence" has its own line (`m08_director_netherton.ink:73`), and
the debrief's Okafor confession now lands on "Two of ours are dead in the space between what I knew and what
I did." (`m08_closing_debrief.ink:45`). The sermons are gone. The contractions have crept back in the debrief
("It's done, then." `:42`, "I'll carry it" `:52`, "you've kept him" `:110`). The bible allows a few in quick
exchanges, but `:42` is the one that matters:

- **Optional.** `:42` "It is done, then. Agent 0x47. Nightshade." It echoes his m07 verdict "It is done."
  and puts the full form where the weight is.

**HaX.** Right. Phone lines are short and unprefixed (median 12), and the in-person scene says less than she
feels: "I'll sit here and un-know a friend. I'll manage." (`m08_agent_0x99.ink:51`), "He carried me two miles
once." (`m08_phone_agent_0x99.ink:103`). One "God." in the mission (`m08_agent_0x99.ink:37`). Two notes:

- **Optional.** "Of course" twice in one scene (`m08_agent_0x99.ink:45`, `:50`). Make `:45` "Course he did.
  Yours has picks in it. His had a passport."
- **Optional (text).** The flag-4 text (erb `:650`) dropped "I'm sorry." Her "I trained with him." on its own
  is the better line, so leave it; just fix the stake (M3).

**Nightshade.** The best-served voice in the pass. Collegial and helpful in the interview, unhurried and
lyrical in the room, and the confrontation now has menace as well as grief: "I chose what you went in
without." (`m08_nightshade_confrontation.ink:118`), "I doubt I was the only tired one they found." (`:112`),
"for exactly as long as it suits me" (`:162`). "Genuinely" and "I'd genuinely encourage it" are his habit per
the bible; the repeat of the second (`m08_suspect_nightshade.ink:47`, `:97`) is a deliberate callback and
works. Two points:

- **S5.** "They've always cleaned up after me." (`m08_nightshade_confrontation.ink:80`) works against his own
  premise two lines earlier: he chose to leave his traces (`:50`). It's also the first of four "always" in the
  scene (`:80`, `:83`, `:95`, `:101`). Cut it; the line ends on "was mine."
- **S4.** He says "I did." to "you taught me" twice. The interview choice was changed to "[You taught me that.
  …]" (`m08_suspect_nightshade.ink:64`, reply "I did." `:67`) and the confrontation choice is "[You stood in
  a briefing and taught me how to catch an insider.]" (`:120`, reply "I did." `:122`). The interview line also
  already delivers the confrontation's turn ("Watch the person who teaches you what to look for", `:69`), so
  the second scene feels like a replay. Replace:
  - interview choice `:64`: `[Your insider briefing. "The calm of someone who's decided the rules don't apply."]`
    (13 words; the before-copy's version was 17);
  - confrontation choice `:120`: `[Netherton told me to learn mole-catching from you.]` (m05's own words:
    "catching a mole is precisely his trade -- learn from him", `m05_insider_trading_opening.ink:28`);
  - reply `:122`: "He did. Every word I taught you was true." (`:123-124` unchanged).

**Cipher, Phantom.** Distinct with the names covered: Cipher over-explains and keeps returning to his face
("You've decided on my face", "not on my face", "My face has never once done me a favour"), which is a good
motif; Phantom is blunt and pleased with himself. The account/badge fix to Cipher's alibi (`:57`) is right.

- **Optional.** Both accused men offer "sorry or cuffs" (`m08_suspect_cipher.ink:115`, `m08_suspect_phantom.ink:110`),
  both pre-existing. Phantom's "Not both." is the better joke, so give Cipher something of his own: "Go and
  check. Please. Then come back and say sorry, or don't come back. Just don't leave it hanging."

**ATHENA.** Funny and unnerving, and the timing now works because each joke has its own line.

- **Optional.** Two mind-reads in a row (`m08_opening_briefing.ink:16` "The PIN device you are thinking of",
  `:18` "You are wondering what happened here"). The second blunts the first. `:18`: "What happened here is
  Portland. Four sites in one night, and one team to send."

**Narrator.** Camera directions now, apart from the confrontation's last beat (`:194`, "a moment longer than
you mean to"), which earns its interpretation: it is the only reaction the teacher line gets (section 4c).

## 4. Craft

### 4a. Pacing in the confrontation

Clicks are lines plus choices, counted by hand from `m08_nightshade_confrontation.ink`.

| Path | Before | Now | With the fixes below |
|---|---|---|---|
| Straight to the fate (no topics, arrest, Gamma volunteered) | 15 | 23 | 21–22 |
| Every topic but the go-bag, then arrest (the usual thorough player) | 33 | 52 | 47–48 |
| Lines before the player's first choice (suspected path, no extra reactions) | 6 | 11 | 9 |
| Same, with every reaction block (KO, door log, accusation, print) | 10 | 16 | 14 |

The hub isn't the problem. Each topic is something the player chose to ask, two to six lines long, and every
one now carries one new idea per line. The candle speech in three lines (`:82-84`) reads better than the old
single bubble.

The drag is the opening. In the series' last scene the player clicks through eleven to sixteen lines
before saying anything, and in that run Nightshade recites the evidence twice: "The repository, the
credentials, the logs with my account all over them." (`:49`) and then "Forty-seven minutes on the Portland
plan… My account, my terminal, my mail." (`:79`). He also raises "why" twice in eight lines ("You're wondering
why I didn't." `:50`, "You came for the why." `:81`). The before-copy broke this run with the player's
scripted case recital; the writer rightly removed that, and nothing replaced it.

- **M1 (must-fix, prose only).** One recital, at the top, then the "why":
  - `:49` → "You found it. Forty-seven minutes on the Portland plan, two days before you deployed. My
    account, my terminal, my mail." (20 words)
  - new line after it, moved from `:80` with S5's cut → "The name they stripped off that intercept in the
    cable vault was mine." (13)
  - `:50` unchanged.
  - `the_case`: delete `:79`, `:80` and `:81`. The knot opens on the candle (`:82-84`, unchanged).
  The scene keeps every fact and every line the brief protects; the opening loses two clicks and the double
  recital.
- **S1 (structural; log it).** Give the player one line before the candle. A one-option choice at the top of
  `the_case`: `+ [It's over, Nightshade. Tell me why.]`, then `:82-84`. This is the style guide's own fix for
  a removed scripted line (section 7). It adds a choice, so rerun loopcheck on the confrontation states; a
  reload mid-scene would land on `the_case` and re-offer it, which is harmless.
- **S2.** The "what you actually did" topic (`:88-96`) is six lines, and its end is odd: he voices the
  player's accusation and then answers it himself ("You're thinking I dress murder up…" / "Perhaps."). Cut
  the narrator `:90` ("He answers evenly."; the voice style already says it) and merge `:94-95` into one line
  that concedes rather than imputes: "You'd call it dressing murder up as physics. Perhaps. You always were
  better than me at the part I decided to skip." (22 words). The topic goes from six lines to four.
- **S3.** The recruitment topic (`:108-112`), five lines. Phantom has already made the money point ("There's
  no money trail. So it's belief.", `m08_suspect_phantom.ink:59`), so `:109-110` can be one line that
  confirms him: "Not with money, {player_name}. Money buys a coward. They look for the ones who've started to
  suspect it's all a delaying action." (22 words)
- **Optional.** `:137-138` → "You want the workshop. Tomb Gamma. I'll give it to you freely. I'd like, just
  once, to be the one who tips the board over." (25). `:162-163` → "I'll be your ghost inside their machine,
  for exactly as long as it suits me. Never forget I told you that part." (21). Take these only if a
  read-through on screen still feels long after M1–S3; both splits give the second sentence a beat.

Kept, as the brief asked: "Order is a candle in a hurricane" (`:82`), "I'm not asking you to forgive the sum.
I'm telling you I did it with my eyes open." (`:93`, his one rhetorical contrast for the scene) and the
closing "Let it hurt afterwards, not during." (`:193`). None of the fixes touches them.

### 4b. Payoffs from earlier missions

| Plant | Where planted | Where it lands in m08 | Verdict |
|---|---|---|---|
| "One day it'll be our badge somebody clones." | `m03_opening_briefing.ink:171` | HaX's clone text, erb `:748` | Lands. Quoted near word for word, at the moment the player clones the Director. |
| Insider tradecraft; "catching a mole is precisely his trade -- learn from him" | `m05_insider_trading_opening.ink:28-30` | Interview `m08_suspect_nightshade.ink:64-69`; confrontation `:120-124` | Lands, but twice with the same shape. S4. |
| PIN cracker kept "on his bench" since St. Catherine's | `m02_closing_debrief.ink:131`; `m03_opening_briefing.ink:173` | ATHENA `m08_opening_briefing.ink:16`; confrontation `:115-118` | The best change in the pass. "I chose what you went in without." turns a running kit joke into five missions of quiet sabotage, and ATHENA plants it in the first minute. Keep. |
| The m07 intercept | `m07_architects_gambit/scenario.json.erb:1795-1801` (From: `[REDACTED]@safetynet.gov`, found in the cable vault); `m07_closing_debrief.ink:404`, `:468` ("the name stripped before it reached us") | Confrontation `:80`; HaX text erb `:638`; case file erb `:1537-1538` | Consistent. m07 has the sender's name stripped "before it reached us", so by ENTROPY's side; the intercept was printed in the cable vault; m08's text and case file call it "the sender stripped off the Portland intercept". "The name they stripped… was mine" agrees with all three. The 09:50 mail on deployment day and his 47 minutes two days earlier are separate events, and the timeline (erb `:1629`) keeps them apart. A player who missed the intercept in m07 still has it from m08's own brief (erb `:110`). Only S5's half-line needs to go. |
| Fifteen years; taught the player's intake | Voice bible (pass-4 settlement) | Netherton `:104`; printout erb `:1168`; dossier erb `:1043`; confrontation `:53`, `:64`, `:108`, `:111`, `:140`, `:161`; debrief `:129`, `:158`; HaX `m08_agent_0x99.ink:55`, `m08_phone_agent_0x99.ink:103` | Consistent everywhere. Recruited at twenty-three in his own training, waited fifteen years, taught the player's intake later ("the barracks you slept in years later"), trained alongside HaX. Nothing says he was in the player's cohort. |
| "No bodies in the brief" / the leak through Netherton's briefings | m07 | Netherton `:105` "He has stood beside me at most of your briefings." | Lands; he was in the room for m02–m06. |

### 4c. The teacher line

Nightshade's last words on every path: "And 0x00. Let it hurt afterwards, not during." (`:193`).

It's **unexplained**: nobody comments, the debrief never mentions it, and the only reaction is the narrator's
"You hold his eye a moment longer than you mean to." It's **earned** for a player who has played m07, where
HaX says it in a text before the ops floor (`m07/scenario.json.erb:736`, `:743`), the Architect says it on the
handset with "I expect you've been told that." (`m07_architect_comms.ink:116`), and HaX hears her teacher in
it.

It **fits the Tesseract canon** (`the_architect.md:38-41`; `agent_0x99_haxolottle.md:245`). The line is
Tesseract's, and he trained half the field until seven years ago. Nightshade was turned during his own
training fifteen years ago, by "the man who put me here" (`:140`). So the line suggests, without saying it,
that the man who taught him to cope and the man who recruited him are the same person. That builds on the
lead without confirming it, as the canon allows for m08. It also keeps the canon's other rule: no ENTROPY
character names him. It doesn't break "ENTROPY doesn't know who the Architect is", since a recruit meeting
his recruiter at twenty-three is not the same as knowing his name.

One risk: HaX has said the line "to every agent she has run", so a player might hear Nightshade borrowing a
handler's mantra. That ambiguity does no harm, and either reading pays off at M9. Keep it, word for word,
and don't add "I expect you've been told that": that tag belongs to the Architect.

### 4d. The door-audit check

Still clear, and still the best teaching in the mission. The writer didn't touch the questions, the four
answers per step or the ten corrections (`m08_director_netherton.ink:236-325`). I checked them against the
printout (erb `:1364`): Nightshade 10:15–11:43, Cipher 10:24–10:32, plan 10:38–11:25; "twenty-three minutes
before… eighteen minutes after" (`:338`) is right. The splits help. The gate (`:229-230`) is now two short
instructions, and `audit_right` puts "That is a door, not an account. A man may sit in his own lab." (`:339`)
on its own line. That is the lesson, so it stays despite its shape. The debrief pays it off by name ("You
read the clock, not the face.", `m08_closing_debrief.ink:71`), and so does Nightshade ("You've proved I keep
long hours… Bring me the account.", `m08_suspect_nightshade.ink:92`). Only S7's "Read that" needs a word.

### 4e. Nightshade's job title (orchestrator decision: follow the voice bible)

Every place in m08 that names his post. Voice styles already read "cryptographic-hardware analyst" (erb
`:1398`, `:1493`) and need nothing.

| File:line | Now | Change to |
|---|---|---|
| `ink/m08_director_netherton.ink:104` | "Agent 0x47. Operations specialist, in the Crypto Lab. Planning access, like the other two. He taught your intake." | "Agent 0x47. Cryptographic-hardware analyst, in the Crypto Lab. Planning access, like the other two. He taught your intake." (19 words; recompile) |
| `scenario.json.erb:1043` (Persons of Interest dossier) | `Agent 0x47 'NIGHTSHADE' -- Operations Specialist` | `Agent 0x47 'NIGHTSHADE' -- Cryptographic-Hardware Analyst (seconded to mission planning)`; the Access line can stay |
| `scenario.json.erb:1168` (personnel printout) | `Agent 0x47 'Nightshade' -- Operations Specialist` | `Agent 0x47 'Nightshade' -- Cryptographic-Hardware Analyst` |
| `mission.json:147` | `"role": "Operations Specialist / ENTROPY Mole"` | `"role": "Cryptographic-Hardware Analyst / ENTROPY Mole"` |

No spoken line besides `:104` needs to change. "The best planner I had" (debrief `:44`), "He helps write the
plans" (`:105`) and Okafor's "Exceptional planner" (erb `:1083`) all fit an analyst lent to planning; the
"seconded" note in the dossier makes that explicit. The task title "Interview the cryptography lab's duty
officer" (erb `:327`) is spoiler-safe and fine. `DIALOGUE_REVIEW.md:267` should be updated to say the
documents were aligned.

### 4f. Choices and debrief payoffs

Choices are the player's words throughout, and the four scripted `You:` lines are gone without new choices
being needed. The fate choices are 15 and 14 words, down from 28 and 31, and still read as the big moment.
"[The four attacks were cover for something else. Weren't they?]" fixes the old "wasn't about" shape.

The debrief still reads every choice-setting global by name: the accusations, `named_on_evidence` and
`audit_misread`, `audit_closed`, the first theory, the instinct, the fate, the KO and the stance. Netherton's
"with my eyes open" (`m08_closing_debrief.ink:111`, triple-agent branch) echoes Nightshade's line just as
the Director signs a man who trades lives. That's a good, quiet rhyme. Keep.

- **S8 (structural; log it, pre-existing).** The series hook (Tomb Gamma, "Then we go to Montana", `:144-153`)
  sits behind the optional "[Then what now.]". A player who picks "[Nothing more, sir.]" ends the season
  without hearing it. The style guide wants one hook at the end. Either divert `close` through `the_next`
  when `not asked_next`, or add one conditional line to `close` before "Go home": "Montana in seventy-two
  hours, Agent." (with `tomb_gamma_location_known`).
- **Optional (pre-existing).** "those two names" (fate choice `:149`) points at names the game never gives.
  Either name the two agents once (the aftermath board, erb `:1241`, is the cheap place) or say "those two
  agents".

## 5. AI tells and UK English

A hand search for the banned words, the transitions, "not just", "isn't about" and the "not X, Y" shapes
finds nothing the lint missed beyond what's below. Spelling is British throughout (no -ize, -or, "gotten",
"defense" in any ink or text).

- **Contrast shapes.** The remaining "X, not Y" lines are Netherton's door-audit corrections (`:315`, `:317`,
  `:322`, `:339`) and the debrief's "You read the clock, not the face." (`:71`). They are the lesson, so they
  stay. The player's debrief choice "He's the crime, not you." (`m08_closing_debrief.ink:50`) is a hero
  contrast. **Optional:** "[You had a warning and no proof, in a war. The crime is his.]"
- **Rhythm.** Better than m07's pass: the splits gave Nightshade a range (9 to 25 words) and he doesn't fall
  into Netherton's three-short-sentences cadence. The timed texts do: median 28 words against a cap of 30, so
  nearly every text is packed to the limit and they all scan alike. **Optional:** take three or four down to
  one or two sentences, as m01 does. The Phantom-KO text (erb `:703`) can lose "off the books"; the
  Cipher-KO text (`:697`) can end at "he is not your mole."
- **Tidy endings.** Mostly gone. One left: "That was the night's real work." (`m08_nightshade_confrontation.ink:131`)
  sums up the line before it and steps on "The dead were…" that follows. **Optional:** cut the sentence.
- **Repeated stakes.** "Two of ours are dead" is said by Netherton (`:71`), Phantom (`m08_suspect_phantom.ink:43`)
  and Netherton again (debrief `:45`, "Two of ours are dead in the space…"). It's the mission's refrain and the
  debrief use is the strongest; Phantom's is the one to vary. **Optional:** "We lost two people, and the
  official investigation is three men staring at each other across a corridor."
- **Small fact.** The Junior Analyst's observations say she has read the feed "four times" (erb `:1155`), her
  line says "six times" (`m08_background_analyst.ink:6`). Pre-existing; make the erb say six.

## 6. Findings list

**Must-fix**

- **M1. Confrontation opening** (`m08_nightshade_confrontation.ink:49-50`, `:79-81`). One evidence recital, then
  the "why"; prose only (section 4a):
  - `:49` "You found it. Forty-seven minutes on the Portland plan, two days before you deployed. My account,
    my terminal, my mail."
  - new line after `:49`: "The name they stripped off that intercept in the cable vault was mine."
  - delete `:79`, `:80`, `:81`; `the_case` opens on the candle.
- **M2. Nightshade's title** (orchestrator's decision). `m08_director_netherton.ink:104` → "Agent 0x47.
  Cryptographic-hardware analyst, in the Crypto Lab. Planning access, like the other two. He taught your
  intake."; erb `:1043` → "-- Cryptographic-Hardware Analyst (seconded to mission planning)"; erb `:1168`
  → "-- Cryptographic-Hardware Analyst"; `mission.json:147` → "Cryptographic-Hardware Analyst / ENTROPY Mole".
- **M3. Flag-4 text** (erb `:650-651`). Put the twist back:
  - `"!=="`: "Root. Crypto Lab terminal, two days before Portland, plan open forty-seven minutes. The root
    file says what that night was for: our threat database. It's Nightshade. I trained with him." (30 words)
  - `"==="`: "Root. Logs agree with your door audit: Crypto Lab terminal, forty-seven minutes. The root file says
    what that night was for: our threat database. It's Nightshade. You had him first." (30 words)

**Should-fix** (replacement lines in sections 2–4)

- **S1** (structural, log it). One-option choice at the top of `the_case`: `+ [It's over, Nightshade. Tell me
  why.]`. Rerun loopcheck on the confrontation states.
- **S2.** Cut `:90` "He answers evenly."; merge `:94-95`: "You'd call it dressing murder up as physics. Perhaps.
  You always were better than me at the part I decided to skip."
- **S3.** Merge `:109-110`: "Not with money, {player_name}. Money buys a coward. They look for the ones who've
  started to suspect it's all a delaying action."
- **S4.** Interview choice `m08_suspect_nightshade.ink:64` → `[Your insider briefing. "The calm of someone
  who's decided the rules don't apply."]`; confrontation choice `:120` → `[Netherton told me to learn
  mole-catching from you.]`; reply `:122` → "He did. Every word I taught you was true."
- **S5.** Cut "They've always cleaned up after me." (`:80`; folded into M1).
- **S6** (pre-existing). `:181` → "You never asked about The Architect. I'll tell you anyway. I'd like, just
  once, to be the one who tips the board over."; `:183` → "An old Cold War bunker in Montana. Everything
  they took from us went there, and so will you."
- **S7.** `m08_director_netherton.ink:342` → "The code card is in my safe, with Dr Okafor's evaluation. Read
  her evaluation before you face him."
- **S8** (structural, log it; pre-existing). The Tomb Gamma hook is optional in the debrief; route `close`
  through `the_next` when `not asked_next`, or add "Montana in seventy-two hours, Agent." to `close` on
  `tomb_gamma_location_known`.

**Optional**

Netherton debrief `:42` "It is done, then."; HaX `m08_agent_0x99.ink:45` "Course he did."; Cipher's "cuffs"
line (`m08_suspect_cipher.ink:115`); ATHENA `m08_opening_briefing.ink:18`; the two further confrontation merges
(`:137-138`, `:162-163`); "That was the night's real work." (`:131`); the debrief choice "He's the crime, not
you."; Phantom's "Two of ours are dead" (`m08_suspect_phantom.ink:43`); trimming three or four timed texts;
"those two names" (`:149`); the Junior Analyst's "four times" (erb `:1155`).

**Lines this would touch.** Must-fix and should-fix together: about 14 spoken lines (8 rewritten or merged,
6 deleted), 3 choice texts, 2 timed texts, 2 document strings and one `mission.json` field. m08 audio isn't
generated yet, so no cost. Only S1 and S8 change structure, and they go to the log first.

## 7. Verdict

**Revise** (light). The structure is unchanged, every runtime check is clean, and the pass should stand: m08
is now readable at the series' pace, Netherton and HaX sound like themselves again, and Nightshade finally has
menace to go with the grief. The PIN-cracker line and the teacher line are the two best things in it.

Fix M1–M3 before it ships. M1 because the finale's first beat makes the player sit through Nightshade saying
the same evidence twice; M2 because it's the orchestrator's decision and three documents and a spoken line
still carry the old title; M3 because a player who skips the database topic now reads the twist as
"covered". Take S2–S7 in the same edit; they're one-line swaps. S1 and S8 are small structural changes for
the log: S1 is the one that would most improve the confrontation's feel.

After the edit: recompile, rerun tagdiff against the same snapshot (expect STRUCTURE UNCHANGED unless S1/S8
are taken), dialoguelint, reopencheck and the 59-state matrix, then the validator for the erb. A read-through
of the confrontation on screen, one thorough path and one straight to the fate, would confirm the pace; no
full playtest is needed for prose of this size.

Scratch output: `<scratchpad>/m08-scripted/` (`tagdiff.txt`, `lint.txt`, `reopen.txt`, `matrix.txt`,
`validate.txt`, `json/`).
