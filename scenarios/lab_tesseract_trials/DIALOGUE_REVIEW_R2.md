# The Keyholder Trials: dialogue review, round 2 (spoken dialogue)

Reviewer: fresh npc-dialog-review (skill in full), with SIS_IMPROVEMENT_PLAYBOOK phase 8 as this round's focus: natural spoken dialogue for TTS in each NPC's accent. Read-only apart from this file. Reviewed against the alignment-round commit 116850b3, and line numbers are for that text. A backgrounds round was editing in parallel while I wrote this (uncommitted at the time). It adds a 5-line header comment and a `campus` knot to `opening_briefing.ink`, so in the working tree every briefing line number below is **+5** (e.g. `:47` is now `:52`). Its four new Narrator lines are reviewed in §6 and counted in §9. Its other changes (hq4/hq5 backgrounds, a header comment in the debrief) touch no spoken text.

Tags: **blocker** (breaks play or must not ship), **major** (fix before audio is generated), **minor** (polish). Settled decisions are not re-raised: Cliffe's Australian idiom stays, Tom "looks after the first-years this week", canon per D7-D9.

## 1. Checks run

- **Compile:** all nine `.ink` files compile with `bin/inklecate` into the scratch folder. No errors, no "apparent loose end" warnings, and each committed `.json` matches a fresh compile, so the JSON is in step with the ink.
- **Validator** (`--skip-ink --no-graph`, so no files are rewritten): schema passes, 0 errors. None of the 41 warnings and suggestions is about dialogue. They cover graph metadata, the deliberate debrief `onceOnly` and Keyholder `currentKnot` choices, VM/RFID/hostile suggestions that don't apply, and two foyer spacing warnings that belong to room dressing.
- **dialoguelint:** "Totals by rule: none". This time it saw all five person-chat files, because the prefixes are in now (round-1 M5). The longest spoken line is 30 words (Tom's tab line).
- **loopcheck:** 19 entry and state combinations, all clean. They cover every person NPC's `currentKnot`; Megan with the file read; Cliffe's workshop before and after the decision; Sidhu at the climax and after it; the debrief on sent with and without `late_warning`, double with the device, blown with the warning, and refused with Megan protected; Ghost at `start` and on the call with Megan warned; HaX with the H1/H2 topics open and at the climax.
- **reopencheck** (`lab_tesseract_trials`): 0 problems.
- **Speaker attribution:** every prefix is the exact `displayName`. `parseDialogueLine` splits on the first colon, so Ghost's colon lines on the call ("I told you at St Catherine's: no name.") fall back to Ghost correctly, and the TTS prefix-stripper doesn't fire on them.
- **What is voiced:** the person-chat files, the briefing and the debrief, plus Ghost's video call. The call opens in `video-call` mode through the person-chat minigame, so `the_offer`, `offer_terms`, `offer_hub` and `refuse` play in Iapetus with the distortion FX. The Keyholder device, HaX's phone hub, the field notes and every timed text are text only (`phone-chat-ui.js:568` voices only `voice:`-prefixed lines, and there are none). Choices are never voiced (`person-chat-minigame.js:1364`).

## 2. Round-1 findings: closed?

I checked every round-1 major against the current text. All nine are closed:

| R1 | Now |
|---|---|
| M1 Ghost's name | `phone_ghost.ink:132` "I told you at St Catherine's: no name." (C1 below is about polish only) |
| M2 late warning | `closing_debrief.ink:39-43` in `opening_sent`; the dead read is gone |
| M3 tape picture | erb `kh_txt[:tape]` rows now match 01001000 / 01001001 |
| M4 device never taken | `closing_debrief.ink:99-103` |
| M5 prefixes | all person-chat lines prefixed; the lint sees them |
| M6 HaX identity string | erb:386, 407, 494 carry it word for word |
| M7 Sidhu's signature line | `npc_sidhu.ink:75` |
| M8 double pay-off, sent cost | rewritten under D7 (`closing_debrief.ink:55-63`) |
| M9 Ghost device lines | `phone_ghost.ink:65-67, 85, 211-215` |

The round-1 minors I spot-checked are closed too: the briefing choice and "classified too", Tom's exit and stale greeting, Jordan's and Cliffe's varied greetings, Megan's stale "still thinking", Sidhu's "Take these", the HaX field-note reasons, "Copy." for "Received.", the once-only debrief questions, "CCTV screens", FN6 and FN9. "Dr Z." is gone from speech (`opening_briefing.ink:47`).

## 3. Structure and wiring (skill 2a-2i)

- **2a Attribution and narration: OK.** Narrator use is light: 9 person-chat beats plus 2 on the call. Each is an event (handing over the laptop, closing the lid, checking the signature), not a delivery cue.
- **2a-bis Supported by the scenario: OK.** Nobody claims to move. The workshop is north, the teaching lab west. Cliffe's map, the soldering iron, Sidhu's whiteboard and Tom's board all exist as objects. One small assertion: Sidhu's "You were looking at my whiteboard." (`npc_sidhu.ink:24`) is said even if the player walked straight up to him (m15).
- **2a-ter Voices: OK.** Every speaker has a distinct Gemini voice with its accent named "consistent ... throughout". HaX carries the bible's identity part in all three blocks, and Ghost's style string is m02's word for word (`m02_ransomed_trust/scenario.json.erb:1256`).
- **2b Choices: OK.** All choices are first person, with no `You:` echoes. One clunky phrase is text only (m22).
- **2c Hubs: OK.** Every hub has a sticky exit with a one-line reply.
- **2c-bis Starved knots: OK** (loopcheck and reopencheck).
- **2d Choices that matter: OK.** The ending, Megan, the late warning and the device all pay off in the debrief, the credits, Cliffe's workshop line and Ghost's texts. H1/H2 are information topics, gated once each, and steer no ending.
- **2e Cross-file state: OK.** `ghost_greeted` is now declared in the HaX ink (H1) and read there. `device_discussed` and `assessments_discussed` are ink-local, which is right for the HaX ink (nothing else reads them, H3 not built).
- **2f Influence, 2h KO: N/A** (no rapport gates; `disableAttacks`).
- **2g Syntax: OK.**
- **2i Recurring bugs: one class is still live. It is the main finding of this round (M1).** A hub greeting reprints after every topic, and in four places it steps straight on the line the scene was built to end on:

| File:line (topic ends) | Then the hub prints | Effect |
|---|---|---|
| `npc_sidhu.ink:76` "It does not tell you whether you should send it." | `:41` "What can I do for you?" | His climax beat is followed by a receptionist's greeting |
| `npc_megan.ink:70` "I'm out. They can find another charity case." | `:27` "Binned the leaflet. Still skint, mind. Worth it." | She has binned it and made peace with it one second after deciding |
| `npc_tom.ink:66` "Go on then. You first." | `:46` "Well? Got into that terminal yet?" | He asks for a result one second after the dare |
| `npc_megan.ink:53` (Trial II trap explained) | `:35` "Locker four's done my head in." | The same fact twice |
| `npc_cliffe.ink:43` Narrator: "He closes the lid." | `:24` "Still here. Coffee's still terrible." | A return greeting mid-conversation |
| `npc_cliffe.ink:93` (map beat) | `:68-78` the ending or scoreboard line again | His one key line repeats |
| `npc_sidhu.ink:34` (first meeting) | `:41` "What can I do for you?" | Mild, but it can go in the same fix |

Fix (the m03 `hub_quiet` pattern; small structural change, list it in tagdiff): give each of the four person-chat inks an ink-local `VAR quiet = false`. Put `~ quiet = true` as the last line of every topic knot that returns to the hub: Tom `magic`, `terminal`, `cryptosecure`, `board`; Megan `trial_two`, `why`, `warn_her`; Cliffe `build`, `leaflets`, `workshop_build`; Sidhu's `start`, `ledger`, `hash_for`, `signed_now`, `signed_after`. Make the first branch of each hub greeting `- quiet:` followed by `~ quiet = false`. In Tom's hub it must come **after** `- not told_keys:`, so the key-pair line still plays after `magic` on the first visit. Cliffe's `common_room` is both the entry knot and the hub. That's fine: the flag is spent on the same pass, so a reopened conversation still greets. Jordan's `{&...}` prompt ("Anything else?") reads as a follow-up question, so leave it alone.

After the change, re-run loopcheck on all four, reopencheck, and dialoguelint's `blank-reentry`. The re-entry knots still print a line. Spoken cost: 0. Nothing is added, and fewer lines play.

## 4. Spoken dialogue, character by character

I read every voiced line as the character would say it, in the voice style on their erb block.

### Agent HaX (Aoede, RP): briefing and debrief

HaX is in voice: fact first, short, dry, and care shown by acts. The best lines are "CryptoSecure is Ransomware Incorporated with a logo.", "I'm meant to wonder whose side you're on. I'm trying not to." and "Today, take that as a compliment." Against m01/m02 she is a little more explanatory in the briefing, which suits a lab that has to set up a new world. Problems:

- **m12, `opening_briefing.ink:34` then `:41`:** "a hood on a screen" twice in a row (the line, the choice, then the reply). Rewrite `:41`: "Ghost never saw your face. You never saw theirs."
- **m6, `closing_debrief.ink:55` and `:63`:** "Ghost withdrew the studentship this morning." The player watched the withdrawal arrive on the device about 14 seconds after sending (erb, Ghost mapping on `decision_made`, "Opened. Thank you, Candidate…"). The debrief is the next morning ("At four, someone went through…"), so Ghost withdrew it **last night**. Change both to "last night".
- **m9, `closing_debrief.ink:38`:** "At four, someone went through the field HQ. The kit we couldn't carry, the cover it took years to build. All of it." Heard aloud, the list hangs off "went through", and you can't go through a cover. Rewrite: "At four, someone went through the field HQ. Everything we couldn't carry is theirs now. We won't be going back." The credits keep "Kit and cover lost."
- **m8, `closing_debrief.ink:94`:** "The phone call was one call too many." Nobody made a call: the blown route is a message on HaX's phone line (`warn_in_band`). Rewrite: "The scoreboard was enough. The message on your phone was one too many."
- **m7, `closing_debrief.ink:130`:** "[Was Ghost really reading my phone?]" gets "We're replacing it. That's all the answer you get." HaX said "We're replacing your phone" a few lines earlier (`:100`/`:102`). Rewrite: "Assume they were. That's all the answer you get."
- **m10, `closing_debrief.ink:144`:** "You never know who's watching." is a stock close. It also undercuts Cliffe's map, which actually *is* watching. Rewrite: "Term starts Monday. Go to your lectures. Dr Shaw takes a register." It's dry, and it gives Tom a warm last mention.
- **m11 (optional), `closing_debrief.ink:113`:** "You could have." is unclear when heard: could have what? Use "You could have warned her." It states the cost without moralising.

### Ghost (Iapetus + distortion): the video call

The call earns its length. "It's signed, so nobody improves it on the way.", "Your handler's location is a number I can check." and "I'll put you in the column for it." are m02's Ghost: precise, numerical and dry. The lab Ghost is terser than m02's, whose lines run longer with "rather", "I'd thank you" and "Sit with that" (`m02_phone_ghost.ink:47,58,169`). The voice bible lets a villain keep a few longer lines, and here one would help:

- **M2 (major), `phone_ghost.ink:156`:** "Say no and you're the candidate who walked away. So is Miss Oyelaran. I don't keep one without the other." Heard aloud, "So is Miss Oyelaran" says Megan has *already* walked away, which is the warned route's fact, not this route's threat. This is the price on the default route, and the design rests on Ghost pricing every route (logged R2B-M8, REVIEW_IMPL M3). Rewrite: "Say no and you walk away, and Miss Oyelaran walks with you. I don't keep one without the other."
- **M2 (same item), `phone_ghost.ink:153`:** "It cost me a candidate, so it costs you nothing. Yet." The "so" is a non sequitur when spoken. Rewrite in Ghost's currency: "You warned the Oyelaran girl. Sentimental. One candidate in two hundred and twelve, so I'll let it pass." Then `:154` can lose the repeated name: "Say no to me and you'll be the second this week." The refusal at `:211` still pays it off ("Noted. The second this week."), and Megan is then named twice on this route, not three times.
- **m1, `phone_ghost.ink:130-131`:** the CCTV sentence belongs with the cameras, but it comes after the walk. Spoken, it jumps from cameras to walk and back to screens. Reorder, same two lines: `:130` "St Catherine's had forty-one cameras. I switched off the recorders, not the cameras. Your screens said no signal. Mine didn't." `:131` "I watched you all night. You still walk like you're expecting a door to be locked."
- **m4, `phone_ghost.ink:129`:** "Congratulations." is a game-show opener, and Ghost doesn't cheer (round-1 M9 made the same point about "Keep going."). Rewrite: "You passed. All of them. I'd rather hoped you would." That brings back m02's "rather".
- **m5, `phone_ghost.ink:222`:** "CONTACT CLOSED." is voiced on the call when the player refuses there. Ghost saying "Contact closed." works as a sign-off, but all caps can make Gemini spell a word out. Listen to it once; if it's wrong, write it in sentence case (the device shows it either way).

### Dr Tom Shaw (Fenrir, Huddersfield)

Warm, quick and practical. "No rocket science, just base two.", "It'll do nowt once there's a key. That's the bit they're paying for." and "I'm still not ordering one." all sound like a lecturer who enjoys his students. His teaching lines (the board, `:78-80`) are explanations of his own board when asked, with numbers written as words. That's right for TTS and not lecture-speak.

- **m13, `npc_tom.ink:74`:** "Turn remote images off. Everyone should." The same moral is delivered to everyone in the debrief (`closing_debrief.ink:83`: "…unless you turn remote images off."). One person should deliver each moral, and the debrief is the one every player hears. Cut `:74`; Tom's knot ends well on "…roughly where." Saves one voiced line.
- **m17, voice clash:** "Go on" opens lines for Tom (`:66`), Megan (`:37`, her default greeting) and Jordan (`:21`), and "mind" is a tag for Tom (`:82`) and twice for Megan (`:27`, `:52`). Tom keeps both, since they're his Huddersfield markers in the design. Change Megan's: `:37` "Go on, then." becomes "Alright?" (a Manchester greeting), and `:52` "…come back, mind." becomes "…come back, though."

### Dr Sidhu Selvarajan (Enceladus, Indian English)

Courteous and exact, with lines that suit a reviewer and editor: "You have the look of someone holding a document.", "Somebody has been reading my board very closely this week.", "It verified, I expect. That was never the question." His climax line is accurate and is the best teaching beat in the game.

- **m14, `npc_sidhu.ink:66-69`, lecture-speak.** "What's a hash actually for?" gets four lines that repeat FN7 almost word for word ("Same input, same hash. One byte different, even a new line you cannot see…" against FN7's "Same input, same hash. Change one byte, even an invisible new line…"). The note teaches; he should talk. A three-line rewrite tied to his board:
  - "For noticing change. Any input, a short fingerprint out, and you cannot run it backwards."
  - "Change one byte, even a new line you can't see, and you get a different fingerprint entirely. That's all my ledger is doing."
  - "Good systems store passwords that way too, with salt and a slow hash. But that is another lecture."
- **m15, contractions.** Sidhu uses none in 18 lines ("It is", "That is", "you cannot", "Let us"). One or two give his formality weight, as with "Let us be exact", his signature. All of them together read as a textbook, and in TTS every line comes out stiff, which tips from register into a stock "foreign formal" voice. Keep "Let us be exact" and "It does not tell you whether you should send it." (the uncontracted "does not" lands harder there). Contract a few of the casual lines:
  - `:24` "That's my whiteboard. It's from my blockchain lecture. A toy ledger, four blocks." This also drops "You were looking at…", which assumes the player looked.
  - `:58` "That's the chain."
  - and the two in m14.

### Dr Z. Cliffe Schreuders (Orus, Australian)

Idiom stays as decided. He's laconic, amused and hard to pin down, and the slip ("Good luck with it, Agent. … Student. Sorry. Long week.") is still the best small beat in the script.

- **m20, `npc_cliffe.ink:24`:** "Mm?" is one of three greeting variants. A bare "Mm?" often comes out of TTS as a hum, a spelled "M M" or nothing at all. Use "Yeah?", which is still laconic and Australian.

### Megan Oyelaran (Leda, Manchester)

Bright, proud and skint, with word choices ("our mam", "dead good", "done my head in", "skint") that sit naturally in a Manchester voice. "Right. Glad I know. Doesn't pay the care home, does it." is the best line in the person-chat files. The new voicemail line (`:29`) is in voice, and her assuming bad news is good dramatic irony.

- **m16, `npc_megan.ink:31`:** "Still on Trial III." TTS may read the numeral as "Trial eye eye eye". Rewrite: "Still on the third one. Don't tell me how. I want to get it myself."
- m17 above ("Go on, then.", "mind").

### Jordan Pike (Puck, Estuary)

Fast and salesy ("Honestly, no pressure", "literally free money", "Nice one"), with the right dramatic irony ("Very busy, apparently.").

- **m18, `npc_jordan.ink:34`:** "Nice one. Lockbox is right there." is said on every exit, including long after the lockbox is open. Rewrite with no state needed: "Nice one. Tell your mates."
- **m19 (optional), `npc_jordan.ink:15`:** "Here, leaflet. It's in your notepad now." is UI in a person's mouth. "Here, have a leaflet. Pop it in your notepad." keeps the pointer and sounds like someone on a stand.

### Narrator (Algenib)

Eleven short beats, all events. Fine.

## 5. TTS: names and strings

No generated secret, hex string, "0x00", "Dr Z." or "HaX" appears in any voiced line. "Agent HaX" is only ever a prefix, which is stripped before TTS. Numbers are written as words. Here is every risky string that is voiced:

| String | Where it's voiced | Risk | Action |
|---|---|---|---|
| **Schreuders** | `opening_briefing.ink:47` (HaX), `phone_ghost.ink:135` (Narrator) | High: Dutch spelling, likely "SHROO-ders" or "SHRAY-ders". A real colleague's name, said in front of his students | **M3.** Generate these two lines first and listen. Dr Schreuders can check his own name. If it's wrong, add a pronunciation note to the scene sentence of the briefing and narrator `style` strings (after HaX's identity part, which stays word for word). Nothing is cached yet (D6), so restyling costs nothing extra. Fallback for the Narrator: "Behind you, the man at the bench keeps soldering." |
| **Selvarajan** | `npc_sidhu.ink:23` ("Sidhu Selvarajan."), in his own voice | Medium: a real colleague mispronouncing his own surname would be the worst version of this | **M3.** Use "Come in, come in. I'm Sidhu. You must be one of the new first-years." It's warmer, the full name stays on the name plate (`displayName`), and the risk is gone at no cost. |
| **Oyelaran** | Ghost `:153, 154, 156, 211`; HaX debrief `:109-115` (one per route) | Medium (fictional, Yoruba) | Listen once. M2 already drops one of Ghost's four. |
| **St Catherine's** | Briefing `:23/:30`, debrief `:87`, Ghost `:130, :132` | Low: Gemini usually reads "St" before a name as "Saint" | Listen to one line. Keep the spelling (UK style, withdrawn as a spelling point in the alignment review). |
| **Trial III** | Megan `:31` | Medium: Roman numeral | m16 |
| **Mm?** | Cliffe `:24` | Medium | m20 |
| **CONTACT CLOSED.** | Ghost `:222` on the call | Low | m5 |
| README, Base64, CyberChef, Hacktivity, Miskatonic, Rotterdam, G'day, owt, nowt | Tom, HaX, Cliffe | Low | none |

## 6. Alignment-round lines

- **The sent debrief's burn and fallback site** (`closing_debrief.ink:35-38`, credits erb:335-336): it works. "Sit down, Agent. Anywhere. This is the fallback site, and nothing in it is ours yet." opens on a place and a loss without saying "loss". "Eleven minutes past six… twelve minutes past" uses numbers well. Fix m9's list at `:38` and m6's "this morning". The site is never named, which follows the rule against naming HQ sites (DESIGN §9, Canon status 5; the backgrounds round is moving them to hq4/hq5).
- **The withdrawal** (Ghost texts, erb mapping on `decision_made`; debrief `:55`, `:63`): "anyone a handler can send, a handler can recall" is Ghost at their best, and it closes D7 cleanly on every route. Only the debrief's timing is off (m6). "They had what they wanted, and it was never you." (`:55`) is the sharpest line HaX has in this mission.
- **Megan's voicemail** (`npc_megan.ink:29`): in voice, earns its place, and matches Ghost's bursary text and the debrief's "donor she'll never meet". On a protected route it is also her greeting on every later visit; M1's quiet flag keeps it to once per visit.
- **H1** (`phone_agent_0x99.ink:79, 158-162`; text only): the reply's first line is good. The second, "Whoever's on the other end wanted you to find it. That tells me they're patient.", is a weak inference. Rewrite (m21): "Whoever's on the other end put it where a first-year would find it. They've done this before." This ties back to "two earlier Keyholders" and doesn't name Ghost. The choice text "The black box from the lockbox talks." chimes on box/lockbox (m22): "That black device from the lockbox talks. It calls itself the Keyholder."
- **H2** (`:81, 164-168`; text only): "One of those files is probably you. I can't tell which, and that's the point." is good, and nameless before the reveal as the plan required.
- **The campus transition** (backgrounds round, uncommitted; `opening_briefing.ink` knot `campus`, 4 Narrator lines): good. "…a thousand new students trying to look as if they know where they're going." and "Nobody looks at you twice." are concrete and a little wry. The second sets up Cliffe ("He'll know what you are within a minute") without saying so. One nit: "Miskatonic University. Freshers' week." repeats HaX's opening line from a minute earlier (`:18`, "Freshers' week at Miskatonic University."). As a title card it's acceptable. If you want it to do more, use "Miskatonic University. Monday morning." That is undated, so it fits D8, and it echoes the debrief's "Term starts Monday". Optional, m25.
- **Ghost's device line** at `phone_ghost.ink:85` (text only) says "Fewer than twenty of you will see the second" while Ghost's text after the same Trial says "Fourteen left". Ghost uses exact numbers: "Fourteen of you. Fewer will see the second." (m23).

## 7. C1, C2, H3 (left to this review)

- **C1, `phone_ghost.ink:132`: take it, reworded (m2).** "You can call me what your handler does: Ghost." suggests SAFETYNET coined the name, but m02's own device announced "CONTACT: GHOST" (`m02_phone_ghost.ink:41`), so the handle is Ghost's. Spoken, the two colons in one line also make two pauses. Rewrite: "No name at St Catherine's, and no name now. The handle is Ghost. It's all you get." That's true to m02's "No name tonight, no face." (`:544`), says the name for players new to m02, and has no colons. Ghost: 1 changed.
- **C2, `phone_ghost.ink:133`: take it, with a number (m3).** "There was a ward in the next room" puts the ward in the wrong place: in m02 it was two rooms from the server room. Rewrite: "The last time I made you an offer, there was a ward forty feet away. This one's simpler." "Forty feet" comes from m02: it's a player choice there ("There is a woman on ECMO forty feet from where I'm stood.", `m02_phone_ghost.ink:62`), which Ghost picks up ("Forty feet. That's a very precise number", `:89`). Players who chose it hear Ghost hand it back; to everyone else it reads as plain fact. Ghost: 1 changed.
- **H3: don't build it.** The call already pays off H1 at no cost. A player who reported the device and was told "Keep it on you." then hears "That device has been in the same pocket as your phone… Everything you've said to your handler since, I've read." (`:146-147`), and their own report is part of what Ghost read. H3 would add a voiced line and a new global, and its "They let you keep me. Think about that." casts doubt on HaX at the moment of choice. That leans the player towards distrusting the scoreboard route the design wants to keep attractive (DECISIONS_LOG, "rejected hinting that the scoreboard is unsafe"), and it blurs the one open question the mission wants to leave, which is Cliffe, not HaX.

## 8. The real academics

None of the three portrayals would embarrass its subject in front of a lecture theatre. All three are warm or intriguing, competent and on the student's side. The coffee sign is neutral now, and the credits are kind ("Reported the stand to the department.", "Still checks everything twice.").

- **Dr Cliffe Schreuders:** recognisable as someone who builds learning tools and CTFs ("A game where you learn by getting caught.", the Hacktivity scoreboard), hard to pin down, and present at the climax without a word. "Hope that was worth it." on the sent route is cool but deserved. The only risk is his surname in TTS (M3).
- **Dr Tom Shaw:** the most natural voice in the cast. He is practical, a good teacher and mildly suspicious of CryptoSecure. "I look after the first-years this week" is in. Tightening m13 and adding m10's register callback in the debrief add warmth and cost nothing.
- **Dr Sidhu Selvarajan:** exact and courteous, and his climax line is accurate and his. The one weakness is that he is the character most likely to sound like a handout read aloud (m14, m15). With three lines contracted and the hash answer tied to his ledger, he sounds like a colleague talking. Drop his surname from speech (M3).

## 9. Spoken-line inventory

These are distinct voiced strings in the current text, i.e. what a full TTS generation would have to produce. Each `{&a|b|c}` alternative and each conditional variant counts once, and identical text counts once (the cache is keyed on text plus voice). Words are approximate. "Per play" is roughly what one player hears on one route.

| Character (voice) | Distinct voiced strings | Words | Per play (approx.) |
|---|---|---|---|
| Agent HaX, briefing (Aoede) | 20 | 247 | 11-16 |
| Agent HaX, debrief (Aoede) | 41 (40 distinct: the token line is shared by refused and blown) | 538 | 16-22 |
| Ghost, video call (Iapetus + FX) | 26 + "CONTACT CLOSED." = 27 | ~395 | 14-20 |
| Dr Tom Shaw (Fenrir) | 21 | 303 | 6-21 |
| Dr Z. Cliffe Schreuders (Orus) | 19 | 122 | 2-12 |
| Dr Sidhu Selvarajan (Enceladus) | 18 | 280 | 4-15 |
| Megan Oyelaran (Leda) | 17 | 194 | 3-12 |
| Jordan Pike (Puck) | 10 | 113 | 4-7 |
| Narrator (Algenib) | 11 (9 person-chat, 2 on the call), +4 from the backgrounds round's campus knot = 15 | 132 + 54 = ~186 | 7-12 |
| **Total** | **~187** | **~2,375** | **~75-125** |

Not voiced (no cost): HaX's phone hub, hints and field-note replies; the Keyholder device's text; every timed text; the notes; the credits; all player choices.

**Lines I'd cut to save cost without losing anything:**

1. `npc_tom.ink:74` "Turn remote images off. Everyone should." The debrief delivers the same moral to every player (m13). −1
2. `npc_sidhu.ink:66-69` hash answer, 4 lines → 3 (m14). −1
3. `npc_tom.ink:81-83` "You're past all that now, mind. Good." It only plays if the player re-asks the board after Trial IV, and it adds nothing. Remove the conditional block (small structural change). −1
4. `phone_ghost.ink:153-154`: not a cut. M2 shortens `:154` and drops a repeated name.

Everything else earns its line. HaX's debrief is the longest block, but each route plays only about half of it, and every line pays off a choice. The edits in this review change about 30 strings, add none and cut 3. Since nothing has been generated yet (D6), applying them now costs nothing extra.

## 10. Findings by severity

**Blockers: none.** Everything compiles, loopcheck and reopencheck are clean, the lint is empty, and every round-1 major is closed.

**Majors**

| # | Where | Finding | Suggested fix | Spoken cost |
|---|---|---|---|---|
| M1 | `npc_sidhu.ink:37-42`, `npc_megan.ink:24-38`, `npc_tom.ink:40-51`, `npc_cliffe.ink:22-28, 65-79` | Hub greetings reprint after every topic and step on the scene's last line: Sidhu's "It does not tell you whether you should send it." → "What can I do for you?"; Megan's "I'm out." → "Binned the leaflet…"; Tom's "You first." → "Got into that terminal yet?" (table in section 3) | `VAR quiet` per file, set at the end of each topic knot, checked first in the hub greeting (after Tom's `not told_keys`); the m03 `hub_quiet` pattern | 0 (fewer lines play) |
| M2 | `phone_ghost.ink:153-154, 156` | The default route's price doesn't parse when heard ("you're the candidate who walked away. So is Miss Oyelaran."), and the warned route's "It cost me a candidate, so it costs you nothing" is a non sequitur | `:156` "Say no and you walk away, and Miss Oyelaran walks with you. I don't keep one without the other." `:153` "You warned the Oyelaran girl. Sentimental. One candidate in two hundred and twelve, so I'll let it pass." `:154` "Say no to me and you'll be the second this week." | Ghost: 3 changed |
| M3 | `opening_briefing.ink:47`, `phone_ghost.ink:135`, `npc_sidhu.ink:23` | Real colleagues' surnames in TTS (Schreuders ×2, Selvarajan in his own voice) | Sidhu: "Come in, come in. I'm Sidhu. You must be one of the new first-years." Schreuders: generate those two lines first and have Dr Schreuders listen; if wrong, add a pronunciation note to the scene part of the briefing and narrator style strings (fallback for the Narrator: "the man at the bench") | Sidhu: 1 changed; HaX/Narrator: 0-2 |

**Minors** (detail and rewrites in the sections cited)

| # | Where | Fix |
|---|---|---|
| m1 | `phone_ghost.ink:130-131` | Reorder: cameras + screens, then "I watched you all night. You still walk like…" (§4) |
| m2 | `phone_ghost.ink:132` | C1: "No name at St Catherine's, and no name now. The handle is Ghost. It's all you get." (§7) |
| m3 | `phone_ghost.ink:133` | C2: "…there was a ward forty feet away. This one's simpler." (§7) |
| m4 | `phone_ghost.ink:129` | "You passed. All of them. I'd rather hoped you would." |
| m5 | `phone_ghost.ink:222` | Listen to "CONTACT CLOSED." on the call; sentence case if spelled out |
| m6 | `closing_debrief.ink:55, 63` | "this morning" → "last night" |
| m7 | `closing_debrief.ink:130` | "Assume they were. That's all the answer you get." |
| m8 | `closing_debrief.ink:94` | "The scoreboard was enough. The message on your phone was one too many." |
| m9 | `closing_debrief.ink:38` | "At four, someone went through the field HQ. Everything we couldn't carry is theirs now. We won't be going back." |
| m10 | `closing_debrief.ink:144` | "Term starts Monday. Go to your lectures. Dr Shaw takes a register." |
| m11 | `closing_debrief.ink:113` | optional: "You could have warned her." |
| m12 | `opening_briefing.ink:41` | "Ghost never saw your face. You never saw theirs." |
| m13 | `npc_tom.ink:74` | Cut (repeated moral) |
| m14 | `npc_sidhu.ink:66-69` | Three-line conversational rewrite (§4) |
| m15 | `npc_sidhu.ink:24, 58` | A few contractions; drop "You were looking at" (§4) |
| m16 | `npc_megan.ink:31` | "Still on the third one. Don't tell me how. I want to get it myself." |
| m17 | `npc_megan.ink:37, 52` | "Alright?"; "…come back, though." |
| m18 | `npc_jordan.ink:34` | "Nice one. Tell your mates." |
| m19 | `npc_jordan.ink:15` | optional: "Here, have a leaflet. Pop it in your notepad." |
| m20 | `npc_cliffe.ink:24` | "Mm?" → "Yeah?" |
| m21 | `phone_agent_0x99.ink:161` (text) | "Whoever's on the other end put it where a first-year would find it. They've done this before." |
| m22 | `phone_agent_0x99.ink:79` (text) | "[That black device from the lockbox talks. It calls itself the Keyholder.]" |
| m23 | `phone_ghost.ink:85` (text) | "Fourteen of you. Fewer will see the second." |
| m24 | `npc_tom.ink:81-83` | optional cost cut (§9) |
| m25 | `opening_briefing.ink` `campus` (uncommitted) | optional: "Miskatonic University. Monday morning." (§6) |

After the edits: run tagdiff per file (M1 and m24 are the only structural changes), loopcheck on the four person-chat files, reopencheck, dialoguelint, and a kstates run on Ghost's offer with `megan_choice` warned and unset. Update the quoted lines in DESIGN.md §8/§9, SOLUTION_GUIDE.md and TESTING_WALKTHROUGH.md (V1 practice), and add every changed spoken line to the fix-notes list D6 relies on.

## 11. Withdrawn

- **Cliffe's accent density** ("G'day", "No worries", "Reckon" ×2, "mate"): settled by the user (keep). Not re-raised. m20 only swaps "Mm?", which is a TTS issue, not an idiom one.
- **"Nobody applies / you're found" said three times** (HaX, Jordan, the sign-up laptop): looked like a repeated moral, but it is CryptoSecure's slogan, repeated in-world on purpose.
- **"Two hundred and twelve" repeated by Ghost** (timed text, device, refusal): the numbers-as-weapons motif, and the refusal is a deliberate callback.
- **"Send it and you start Monday." contradicts D7:** withdrawn. Ghost withdraws the offer only after the report is opened, so this is the lie that D7 then exposes.
- **"CONTACT CLOSED." voiced on the call as a blocker:** downgraded to m5. Ghost saying it is in character; only the capitals are a risk.
- **"St Catherine's" spelling:** not re-raised (the alignment reviewer withdrew it); listen-check only (§5).
- **Tom's board lines as lecture-speak:** withdrawn. He's explaining his own board when asked, in three short lines with numbers as words, and FN1-FN3 don't duplicate the wording.
- **Megan's voicemail said to a stranger** (the protected route is reachable without ever meeting her): looked odd, but on a first meeting it follows "Our mam thinks I'm doing something sensible." and reads as a natural overshare.

## 12. Ten weakest lines

1. `phone_ghost.ink:156` "Say no and you're the candidate who walked away. So is Miss Oyelaran." The climax price, and it says the wrong thing when heard (M2).
2. `npc_sidhu.ink:41` "What can I do for you?", straight after "It does not tell you whether you should send it." (M1).
3. `npc_megan.ink:27` "Binned the leaflet. Still skint, mind. Worth it.", one beat after "I'm out." (M1).
4. `npc_tom.ink:46` "Well? Got into that terminal yet?", one beat after "Go on then. You first." (M1).
5. `phone_ghost.ink:153` "It cost me a candidate, so it costs you nothing. Yet." (M2).
6. `npc_sidhu.ink:66-67` "A hash is a fingerprint… Same input, same hash…": FN7 read aloud (m14).
7. `closing_debrief.ink:94` "The phone call was one call too many." There was no call (m8).
8. `closing_debrief.ink:55` "Ghost withdrew the studentship this morning." The player watched it happen last night (m6).
9. `closing_debrief.ink:130` "We're replacing it. That's all the answer you get." Repeats the line HaX said a moment before (m7).
10. `closing_debrief.ink:144` "You never know who's watching." A stock close (m10).

## 13. Verdict

**Revise (light), then generate audio.** No blockers, and every round-1 major is closed. The alignment-round lines are among the best in the script, and HaX, Ghost and the three academics are all recognisably themselves. The three majors are cheap. M1 is a single flag pattern across four files and adds no spoken lines. M2 is three Ghost lines. M3 is one Sidhu line plus a listen-check on two lines before batch generation. All three should land before any TTS is generated, because the cache is keyed on the text. The minors are one-line text swaps. No re-review is needed after the fix: a tagdiff, the runtime checks in §10 and an orchestrator read of the changed lines are enough.
