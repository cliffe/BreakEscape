# ca15 trailer script, owner round r2, r5 rev R4 (Shadow IT): cause, shortcut, cost, the attacker's side, fix

File r5, revised after review rounds R1 and R2. `ca15_trailer_script_r4.md` stays as it is; this file replaces its structure and reuses its measured windows, masks and clip lengths wherever a shot survives.

Owner's verdict on the r1 cut (27 Nov): "Two relevant points -- emailing business info to personal email, and USB/device caution -- both are Shadow IT, but this trailer presents a very confusing train of half-concepts. Made even more confusing by the use of unusual terms like 'pack'. Restructure this to explicitly mention shadow IT, and the short cuts staff take -- including use of untrusted devices on business networks, even USB sticks can be a danger." The owner picked option (a): the episode text and the trailer tell the same story. The episode fixes are in on this branch only: cf31e6c5d, the dialogue review 8dabd5955, the consequence and brief wording 36378d2a7, voiced at c784c780a, and the kettle hook line a5ff69226.

Status: script, 27 Nov, revised after R1, R2, R3 and R4, R5 minors applied (dispositions in sections 12, 13a, 13 and 14). No edit list for this script exists. The edit list will be `tools/video/edits/ca15_trailer_r6.json`, id `ca15_trailer_r6`; the file `ca15_trailer_r5.json` on disk is built from the r3 script and must not be rendered as this cut. Target 73.263 s (116 beats, 29 bars), the r3 music window unchanged.

House rules in force:

- Narrator VO (Sulafat, the ca15 style) at most 3.0 words a second; every line ends at least 0.3 s before its cut; no em or en dashes in VO. No narrator over a character line and none while verdict buttons are on screen. The two-option choice cards in beats 5 and 7 are unscored choices, not verdict buttons, and are narrated (the R2 sell review checked this against `consequence-sandbox.js` :15 and `mistake.scored`, which is false).
- Cards and burned captions at most 28 characters a line. UK English, "Cyber Security" as two words. No "Break Escape" on screen. Close plate "Learn on Hacktivity.co.uk".
- No answers, tells, tallies, scores or verdicts on screen or in VO. The one stated lesson is Nilesh's own line in beat 12 (owner question 3). The 9b chip is attacker reasoning in Nilesh's words and is put to the owner as a possible exception (owner question 9).
- No in-game terms in VO, cards, chips, tabs or captions. Banned: "pack", "flip", "red-team", "tracker", "session note", "Swap Shop", "Look up", "Carry on", "TL-OPS", "drop" as a noun, "Your call" (the game's own verdict tag).
- Whole-number output scale on every gameplay shot, no pushins: 16:9 and 1:1 at 1, 2 or 3; 9:16 at 0.5625, 1.125 or 1.6875. Lower zoom on NPC chats. Crop centres on whole source pixels (source 1920 x 1080).
- Every cut on the beat grid (b = 60 / 95 = 0.6316 s).
- The term in the title is defined in the topic shot in 12 words or fewer; one stated lesson; two picks, both cases of the same idea; the defend half opens a trick the first half showed.

## 1. The line of thought

r4 named Shadow IT, then listed three shortcuts with no consequence beside any of them, then spent five shots on a planted stick. The email's cost arrived 26 seconds after the email. This cut is one thread, in order:

1. **Cause.** Two staff at the kettle: "The file share's crawling again." (Joanne's kettle chatter, added for this hook at a5ff69226).
2. **Name and definition, together.** "Shadow IT: the shortcuts staff take that IT doesn't know about."
3. **The response.** Red card "Take the shortcut"; "The official way's slow."
4. **Shortcut one, then its cost.** Client files go to a personal inbox. Then it's broken into, and IT never knew the copy existed.
5. **Shortcut two, then its cost.** Unknown devices plugged into work laptops, even a USB stick (the visiting surveyor's own). Its program copies every folder in reach.
6. **The attacker's side, two short shots.** "Attackers leave sticks to be found." The chip says the learner is trying it; a colleague finds the stick ("Someone's dropped a memory stick. Whose is this?", played whole), and the chip gives the reason it works.
7. **Your turn.** Two more of the same kind arrive in the inbox: a stick in the post, first because the viewer has just watched one, and a free upload site.
8. **The fix, in a cast member's words.** Nilesh: "That's shadow IT for you. If the official way's slow, tell us rather than building your own way round."
9. Close and CTA.

Cut from r4: Joanne's plug-in, Nilesh's "She was being kind", the free-app card, Fatima's found stick, v22 to v28, v18b, v15b. Joanne's found-stick line, which was r4's hook, moves to step 6, after the term is defined, so the trailer no longer opens on a stick nobody has explained. The planted stick is two shots (6.9 s) where r4 had five.

The email's cost in VO and on the page is lost visibility: IT never knew the copy existed. The consequence page says so since 36378d2a7.

## 2. Shape

Seat tabs: `SHORTCUT` (red, beats 5 to 8), `ATTACKER` (red, beats 9a and 9b), `YOUR TURN` (blue, beats 11 and 12). Purple stripe `#6b4c9a` on every seat label.

| # | Beats | Time (s) | Dur | Beat | Seat / chip | Footage |
|---|---|---|---|---|---|---|
| 1 | 0-7 | 0.00-4.42 | 4.42 | hook: two staff at the kettle, Joanne: "The file share's crawling again." | full / `THE OFFICE` | **new take t19** |
| 2 | 7-17 | 4.42-10.74 | 6.32 | open: Shadow IT / Tarrowby Logistics | card | exists |
| 3 | 17-28 | 10.74-17.68 | 6.95 | topic: the kiosk brief, whose text defines shadow IT | full / `WHAT IS SHADOW IT?` | **new take t17** |
| 4 | 28-33 | 17.68-20.84 | 3.16 | red card "Take the shortcut", on the music drop (b28) | card | exists |
| 5 | 33-41 | 20.84-25.89 | 5.05 | email: card 1, the personal-email option picked | `SHORTCUT` / `PERSONAL EMAIL` | **retake** (t16) |
| 6 | 41-51 | 25.89-32.21 | 6.32 | email cost: "Six months later", card 1's consequence only | `SHORTCUT` / `SIX MONTHS LATER` | **retake** (t16) |
| 7 | 51-61 | 32.21-38.53 | 6.32 | device: card 3, the visitor's USB stick option picked | `SHORTCUT` / `A VISITOR'S USB STICK` | **retake** (t16) |
| 8 | 61-69 | 38.53-43.58 | 5.05 | device cost: "Six months later", card 3's consequence only | `SHORTCUT` / `SIX MONTHS LATER` | **retake** (t16) |
| 9a | 69-75 | 43.58-47.37 | 3.79 | attacker: the learner leaves an unlabelled stick by the kettle | `ATTACKER` / `YOU TRY IT: AUTHORISED TEST` | **retake t11b** |
| 9b | 75-80 | 47.37-50.53 | 3.16 | found: Joanne picks it up, "Someone's dropped a memory stick. Whose is this?" | `ATTACKER` / `KINDNESS DOES THE WORK` | **retake t11b** (same take, later window) |
| 10 | 80-84 | 50.53-53.05 | 2.53 | blue card "Now it's your turn" | card | card text change |
| 11 | 84-93 | 53.05-58.74 | 5.68 | inbox: the list, held for the whole shot; no message opened; verbs and counter hidden | `YOUR TURN` / `YOUR INBOX` | **new take t06b** |
| 12 | 93-105 | 58.74-66.32 | 7.58 | Nilesh: "That's shadow IT for you. If the official way's slow, tell us rather than building your own way round." | `YOUR TURN` / `IT SERVICE DESK` | **retake t09c** |
| 13 | 105-116 | 66.32-73.26 | 6.95 | close | card | as r4 |

Total 116 beats = 73.263 s: 7 + 10 + 11 + 5 + 8 + 10 + 10 + 8 + 6 + 5 + 4 + 9 + 12 + 11. Cut points: b7, b17, b28, b33, b41, b51, b61, b69, b75, b80, b84, b93, b105, b116. Every cut is on a whole beat and the end is on a bar. The music drop (b28, 17.684 s) is the cut into the red card, so "Take the shortcut" lands on it. Beats 1 to 3 are untouched, and the three beats 9b needed all come from after the drop: one from beat 5 and two from beat 11. The close is back to 11 beats.

Joins: seam into and out of every card; hard cuts elsewhere, including 9a to 9b (the crop changes from the learner to Joanne, so it does not read as a jump cut). No glitch join.

Balance: red card 3.2 s; email pick and cost 18 beats, 11.4 s; device pick and cost 18 beats, 11.4 s; the attacker's side 11 beats, 6.9 s; your turn (beats 10 to 12) 25 beats, 15.8 s; close 6.9 s. The two shortcuts are the same length. The attacker's side is under a tenth of the trailer and should not give up another beat.

## 3. Narrator VO

**The gate, and the two reads every line must clear.** Gate = window - lead - 0.3: the longest clip that still ends 0.3 s before its cut. A line is scripted only if both of these are at or under its gate:

- **Stops read** = words x 0.495 s + 0.3 s for each internal stop (a full stop, colon, question mark or comma inside the line; the final full stop does not count). 0.495 s a word is the rate of the slowest cached plain clip, v17.
- **Rate read** = words x 0.57 s, the measured rate of the two cached clips closest in shape to the long lines here: v1 (9 words, one colon, 5.112 s, 0.568 s a word) and v11 (10 words, a comma and a full stop, 5.760 s, 0.576 s a word). Those clips contain their own pauses, so no stop allowance is added.

"Worst" is the larger of the two; slack = gate - worst. "Hacktivity.co.uk" counts as one word, which the rate read allows for because v11 ends on it. The old estimate (words / 2.33 + 0.15) is withdrawn: it gave 4.0 s for v1 against 5.112 s measured.

**Which read governs (R3).** The measured rates include their own pauses (v1 has 0.61 s of silence inside its 5.112 s, v11 0.73 s inside its 5.760 s), so no stop allowance goes on the rate read. The stops read under-predicts any line with a colon or the URL (v1 by 0.36 s, v1c 0.41, v8 0.25, v11 0.21), so it is never used alone for v30 or v11b: the rate read governs there. The rate read overstates plain lines of 3 to 8 words by 30 to 45 percent (cached plain clips run 0.33 to 0.43 s a word), so for v31, v32, v35, v36c, v37 and v38 the closest cached analogue is the better forecast (v31 and v37 1.2 to 1.8 s, v32 and v35 about 3.0 s, v36c 2.0 to 2.7 s, v38 2.6 to 3.0 s) and the slack figures in the table are a floor, not a forecast. The voicing step still measures every clip.

| id | Beat | Line | Words | Stops | Window (s) | w/s | Lead | Gate | Stops read | Rate read | Worst | Slack | Ends (worst) | Margin to cut | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| v1 | 2 open | "Hacktivity Cyber Aware: Security awareness training you can play." | 9 | 1 | 6.32 | 1.42 | 0.2 | 5.82 | n/a | n/a | 5.112 (measured) | 0.70 | 5.31 | 1.00 | cached (`Sulafat_v2/trim/v1.mp3`) |
| v30 | 3 topic | "Shadow IT: the shortcuts staff take that IT doesn't know about." | 11 | 1 | 6.95 | 1.58 | 0.1 | 6.55 | 5.75 | 6.27 | 6.27 | 0.28 | 6.37 | 0.58 | **new** |
| v31 | 4 red card | "The official way's slow." | 4 | 0 | 3.16 | 1.27 | 0.1 | 2.76 | 1.98 | 2.28 | 2.28 | 0.48 | 2.38 | 0.78 | **new** |
| v32 | 5 email | "Client files go to a personal inbox." | 7 | 0 | 5.05 | 1.39 | 0.2 | 4.55 | 3.47 | 3.99 | 3.99 | 0.56 | 4.19 | 0.86 | **new** |
| v33 | 6 email cost | "Then it's broken into. IT never knew the copy existed." | 10 | 1 | 6.32 | 1.58 | 0.1 | 5.92 | 5.25 | 5.70 | 5.70 | 0.22 | 5.80 | 0.52 | **new** |
| v34 | 7 device | "Unknown devices plugged into work laptops. Even a USB stick." | 10 | 1 | 6.32 | 1.58 | 0.2 | 5.82 | 5.25 | 5.70 | 5.70 | 0.12 | 5.90 | 0.42 | **new** |
| v35 | 8 device cost | "Its program copies every folder in reach." | 7 | 0 | 5.05 | 1.39 | 0.2 | 4.55 | 3.47 | 3.99 | 3.99 | 0.56 | 4.19 | 0.86 | **new** |
| v36c | 9a attacker | "Attackers leave sticks to be found." | 6 | 0 | 3.79 | 1.58 | 0.1 to 0.5, set from `drop_land` | 2.99 to 3.39 | 2.97 | 3.42 | 3.42 (2.78 on the analogue worst case) | 0.07 at lead 0.0; 0.21 on the analogue case at lead 0.5 | about 2.7 | about 1.1 | **new** |
| v37 | 10 blue card | "Your turn." | 2 | 0 | 2.53 | 0.79 | 0.1 | 2.13 | 0.99 | 1.14 | 1.14 | 0.99 | 1.24 | 1.29 | **new** |
| v38 | 11 inbox | "A stick in the post. A free upload site." | 9 | 1 | 5.68 | 1.58 | 0.1 | 5.28 | 4.76 | 5.13 | 5.13 | 0.15 | 5.23 | 0.45 | **new** |
| v11b | 13 close | "Take the shortcut here, see where it leads. Learn on Hacktivity.co.uk." | 11 | 2 | 6.95 | 1.58 | 0.1 | 6.55 | 6.05 | 6.27 | 6.33 (v11 + one word) | 0.22 | 6.43 | 0.52 | **new** |

86 narrator words: 9 + 11 + 4 + 7 + 10 + 10 + 7 + 6 + 2 + 9 + 11 (v34 gains a word and v37 loses one). Beats 1, 9b and 12 carry no narration (cast lines).

**What clears, and by how much.** Nine of the ten new lines clear both reads, and those nine still clear with the rate read at v11's own 0.576 s a word (v34 is the tightest: 5.76 against 5.82). v36c clears both reads only at lead 0.0 and is set from its landing instead (below). Six are thin: v36c (0.07), v34 (0.12), v38 (0.15), v33 and v11b (0.22), v30 (0.28). The rate read is harsh on short lines with no pause (cached 4-word clips v15, v18 and v21 run 1.42 to 1.73 s, and the 7-word v16 runs 2.47 s), so v36c is expected near 2.5 s. A short line with a pause can run slow all the same: v1c "This episode: Shadow IT." is 2.688 s for 4 words. For that reason v31 and v37 have no internal stop.

v11b's worst figure is the cached v11 (5.760 s, the same line without "here") plus one word at 0.57 s. v11's call to action alone runs 2.96 s (2.80 to 5.76 by silence detection), so there is no room for a full stop after "here": the comma stays.

**v36c lead (R3).** The lead is not fixed at 0.0. The clip is expected to run 2.0 to 2.7 s (cached analogues), against a stick landing 2.40 s into the shot. After voicing, place the clip so that "found" starts 0.1 s before `drop_land` (2.30 s into the shot): lead = 2.30 minus the measured onset of "found", expected 0.1 to 0.5 s, recorded in the edit list. The line then ends about 0.4 s after the landing (the tail of "found", to be measured), about 2.7 s in and about 1.1 s before the cut, whatever the clip's length, so the gate holds for any lead up to 0.5 (gate 2.99). The test is the clip's end, not the lead (R4 m8): with "found" placed 0.1 s before `drop_land`, the line is fine if it ends by 3.49 s into the shot (gate 3.79 less the 0.3 s margin), and the end stays about 2.7 s in whatever the lead, so a short clip (2.0 s, "found" at about 1.6 s, lead 0.7) still passes with about 1.1 s to spare. Use v36d only if the measured end is later than 3.49 s into the shot, or if "found" cannot reach 2.30 s without a lead above about 1.0 s.

**After voicing.** Order of checks: measure each clip, compare it with its gate (window - lead - 0.3), and only then choose between the line and its reserve; the choice is never made first. A clip over its gate is replaced by its reserve line; a line is rewritten, never trimmed or sped up. If v11b measures over 6.35 s take v11c; if v30 measures over 6.55 s, lead 0.0 lifts its gate to 6.65. All of this happens before the edit list is written. Reserves, voiced in the same run:

| For | Reserve | Words | Worst at the same lead | Slack |
|---|---|---|---|---|
| v36c | v36d "Attackers leave sticks on purpose." | 5 | 2.85 | 0.64 |
| v34 | v34r "Unknown devices get plugged in. Even a USB stick." | 9 | 5.13 | 0.69 (the old v34 figures) |
| v38 | v38f "Sticks by post, free uploads." | 5 | 2.85 | 2.43 |
| v33 | v33s "Someone breaks in. IT never knew the copy existed." | 9 | 5.13 | 0.79 |
| v11b | v11c "Take the shortcut here. Learn on Hacktivity.co.uk." | 7 | about 4.8 (v11's 2.96 s call to action plus a 4-word sentence and a pause) | about 1.7 |
| v30 | no reserve line: lead 0.0 lifts the gate to 6.65 | | | 0.38 |

With v11c, "See where it leads" is carried by the close card alone; "Learn on Hacktivity.co.uk" stays spoken either way.

Word counts, by hand, for the lines that changed: v31 The / official / way's / slow (4); v32 Client / files / go / to / a / personal / inbox (7); v33 Then / it's / broken / into (4) + IT / never / knew / the / copy / existed (6) = 10; v34 Unknown / devices / plugged / into / work / laptops (6) + Even / a / USB / stick (4) = 10; v35 Its / program / copies / every / folder / in / reach (7); v37 Your / turn (2); v38 A / stick / in / the / post (5) + A / free / upload / site (4) = 9; v11b Take / the / shortcut / here (4) + see / where / it / leads (4) + Learn / on / Hacktivity.co.uk (3) = 11.

Ids. No narrator clip exists for v11b or for any id from v30 up (`Sulafat_v2/trim/` holds v1 to v13, v1b, v1b_r3, v1c and v5b), so the revised texts keep their ids and no id on disk carries two texts. v36c is the 6-word attacker line; v36 stays reserved for Variant A's longer line (section 8).

Cached clips reused: v1 only. Kept on disk and not used: v1c "This episode: Shadow IT." (2.688 s; owner question 5), v10, v11 (5.760 s, the series tagline), v2_r3 and the r4 lines.

Voicing notes. v30: a short pause after "Shadow IT", then level. v31: level, no pause, stress on "slow". v32 plain statement. v33 and v35 are the costs: plain, no menace, present tense throughout. v33 only: a clear break between the two sentences and stress on "I.T." in the second, because spoken "it" and "IT" sound the same and a viewer listening without watching could hear the second as the inbox; no wording change, since the gate leaves no room for another word. v34: a pause before "Even". v36c level, stress on "found". v37 no pause, a level hand-over. v38: two items, even weight, nothing after them. v11b: a light comma after "here", one clear break before "Learn".

Truth checks, against the episode at 36378d2a7:

- **v30:** the brief (erb :657) and Nilesh (ink :68) say shadow IT is work on "devices, apps, accounts or services that IT doesn't know about or hasn't approved, usually as a shortcut". The scope note (erb :560) says "the shortcuts staff take round IT". The definition part is 9 words.
- **v31:** the episode's own phrase: `habitLine` (erb :664, "When the official way is too slow, tell IT rather than build your own way round it") and Nilesh's "If the official way's slow" (ink :65), which beat 12 repeats, so the trailer's cause and its fix use the same words. It answers the hook, "The file share's crawling again." (erb :1583), and card 1, "The share has crawled to a halt" (erb :578), without needing the noun "share" to have been read in the hook. The red card says "Take the shortcut" under it. (The R3 sell review cited `habitLine` as erb :661; at this commit :661 is `noBlameLine` and `habitLine` is :664.)
- **v32:** card 1, `send_personal`: "Send the client files to your personal email to finish at home" (erb :588).
- **v33:** "Months on, the personal inbox was broken into. The client files were still in its sent items, and IT had never known the copy was there, so nobody could protect it or take it back." (erb :691). The line uses the episode's own words, "broken into", so narration, caption and the page under it agree; "it" is the personal inbox, the last noun of v32, and the chip `SIX MONTHS LATER` gives "then" its time.
- **v34:** card 3, "Plug the visitor's USB stick into your work laptop" (erb :616). "Unknown device" is the episode's term (erb :55, :1671; ink :87 and :48). "Untrusted" and "on the work network" appear nowhere in the episode (owner question 6). The plural names the kind of shortcut; the picture and the chip show the one case. "Plugged into" gives the line a verb, so "devices in laptops" cannot be heard as parts inside the machine; card 3 says "Plug the visitor's USB stick into your work laptop".
- **v35:** "It carried a program that ran on yours and copied the folders it could reach" (erb :699). "Every folder in reach" is the same set of folders.
- **v36c:** the concept panel, "Whoever leaves a stick to be found gets a way onto a work machine" (erb :671) and "A stick left to be found is often set to run the second it's plugged in" (erb :675). "Leave" is the episode's verb throughout. The line describes the picture under it and makes no claim about the visitor's stick, which nobody planted (it "had been in three other firms' laptops first", erb :699).
- **Chip `YOU TRY IT: AUTHORISED TEST`:** the brief's "authorised exercise", the aim text "Nilesh's test", ink :86 to :89.
- **Chip `KINDNESS DOES THE WORK`:** Nilesh, ink :92, "Kindness does the attacker's work." The same idea is in post-verdict feedback: the giveaway stick's `reportReply` (erb :433), "Kindness and curiosity are why people plug these in, so the kind move is to hand it in rather than plug it in", and the concept panel (erb :671). The scored flag on the stick rows is `found_media`, so kindness is why a person plugs a stick in and not what marks an item as risky.
- **v38:** the inbox's first row is the posted stick, "A padded envelope came in for you, marked from the client" (erb :317), and the Benmoor stick, "we've posted you a branded USB stick" (erb :408); the upload row is "Too big for email? Upload it here, free" (erb :360). The line names two kinds of item and says nothing about which are safe. Both named items are the risky kind and neither safe row is named, and after beats 7 to 9 the viewer knows which way a stick in the post goes, so the line does lean on a scored item. It is kept at pattern level because the episode's own brief says as much; the judgement is the owner's to see (owner question 10). Also: ink :61, Nilesh after the sort, says "A stick in the post is a found stick, whatever the note says", so v38's first sentence is the subject of an answer line. The inbox has six rows, four risky (erb :339, :383, :424, :468) and two safe (:511, :538); the two kinds named cover three of the four risky rows and neither safe one.
- **v11b:** the series tagline with "here", which puts the shortcut inside the game.

Burned captions (28 or fewer a line):

- Hook, 9:16 only: "The file share's\ncrawling again." (16 / 15; the line is 32 characters, so it takes two)
- v30 "Shadow IT:\nthe shortcuts staff take\nthat IT doesn't know about." (10 / 24 / 27), held for the whole of the line
- v31 "The official way's slow." (24)
- v32 "Client files go\nto a personal inbox." (15 / 20)
- v33 A: "Then it's broken into." (22). B: "IT never knew\nthe copy existed." (13 / 17)
- v34 A: "Unknown devices\nplugged into work laptops." (15 / 26). B: "Even a USB stick." (17)
- v35 "Its program copies\nevery folder in reach." (18 / 22)
- v36c "Attackers leave sticks\nto be found." (22 / 12)
- 9b, 9:16 only: "Someone's dropped\na memory stick.\nWhose is this?" (17 / 15 / 14)
- v38 A: "A stick in the post." (20). B: "A free upload site." (19)
- No burned caption for v1, v37 and v11b: the open, blue and close cards are text already. The blue card reads "Now it's your turn" and the narrator says "Your turn."; the .srt carries the spoken words.

**Forced line breaks.** Cast-line captions and narrator captions take their breaks in different fields. A cast-line caption (the 9:16 hook, 9b in 9:16, and the two Nilesh captions in beat 12) is a `lines[]` entry on a gameplay shot: write `\n` in `lines[].text` and set `"caption_breaks": true` on that shot (commit 048d15134); without the flag the `\n` collapses to a space and the line runs past 28 characters. A narrator caption (v30, v32, v33 B, v34 A, v35, v36c; beats 3, 5, 6, 7, 8 and 9a) is a cue in `vo[]` and does not use the flag: keep `text` as the plain spoken line (it feeds the voicing and the .srt) and put the same words with `\n` in the cue's `caption` field, as `ca00_trailer_r1_narrow.json` does (`CaVo` sets `pre-line` whenever `caption` is present). The lint checks the 28-character limit only for the cast-line captions, so the counts in sections 3 and 4 are the check for the narrator ones. The cards, including the close card's two lines, are card text and not captions. For v1, v37 and v11b, which have no burned caption, set `"caption": false` on the cue (the audio and the .srt stay). **Cast-line shots carry no `speaker` (R4 m2).** The three shots that use the cast-line caption (the 9:16 hook, 9b and beat 12) set `"caption_breaks": true` and give each `lines[]` entry no `speaker` key, as ca16 does: the lint adds the speaker prefix ("Nilesh: ", 8 characters) to line 1 on the plain skin, and that would put Nilesh A (25 + 8 = 33), Nilesh B line 1 (27 + 8 = 35) and the old 9b line 1 (26 + "Joanne: " = 34) over the 28 limit. The new 9b split would pass with a prefix (17 + 8 = 25), but the rule is kept for all three. The chip `IT SERVICE DESK` names Nilesh and the bubble in the footage names Joanne, so the speaker is not lost. Edit-list caption text is written in the `\n` form shown in this section and section 4.

In 9:16 and 1:1 the panel text in beats 3, 5, 6, 7, 8 and 11 is 18 px or smaller on a 1080-wide frame, so in those formats the burned caption carries the beat and the panel is texture.

Cards: red "Take the shortcut" (17); blue "Now it's your turn" (18); close "Take the shortcut here ·" (24) over "See where it leads" (18), plate "Learn on Hacktivity.co.uk" (series tagline card "Take the shortcut ·" if question 4 keeps v11).

Chips: `THE OFFICE`, `WHAT IS SHADOW IT?` (18), `PERSONAL EMAIL`, `SIX MONTHS LATER`, `A VISITOR'S USB STICK` (21), `YOU TRY IT: AUTHORISED TEST` (27), `KINDNESS DOES THE WORK` (22), `YOUR INBOX`, `IT SERVICE DESK`. Tabs `SHORTCUT`, `ATTACKER`, `YOUR TURN`. The 9a chip has a verb where rev R1 had a possessive, so the shot reads as the learner doing it and not as an illustration of what attackers do. The 9b chip puts the reason the trick works on screen; without it nothing in the cut says why Joanne's question matters.

## 4. Character lines

| Beat | Speaker | Line | Caption | Source | Audio |
|---|---|---|---|---|---|
| 1 hook | Joanne (kettle chatter) | "The file share's crawling again." | 16:9 and 1:1: her bubble carries it. 9:16: burned, as above | erb :1583, third line of Joanne's `ca15_kettle` pool (a5ff69226, dialogue-reviewed) | cached, `tts_cache/ca15_shadow_it/feba2d607d58151d92fde440a24a6968.mp3`, 1.872 s (speech 0 to 1.63). Lay the clip in at the bubble's first frame (1.0 s into the shot, ending 2.87 s in, 1.55 s before the cut), take audio muted |
| 9b found | Joanne | "Someone's dropped a memory stick. Whose is this?" | 16:9 and 1:1: her bubble carries it, whole. 9:16: burned, as above | erb :1596, bark on `npc_picked_up:ca15_red_stick` | cached, `tts_cache/ca15_shadow_it/570745991c46ff0775faec32350e5944.mp3`: 3.144 s, speech 0.00 to 1.64 and 2.15 to 2.78 (silencedetect -40 dB, confirmed by the R2 timing review) |
| 12 nilesh | Nilesh | "That's shadow IT for you. If the official way's slow, tell us rather than building your own way round." | A: "That's shadow IT for you." (25). B: "If the official way's slow,\ntell us rather than building\nyour own way round." (27 / 28 / 19) | ink :65, after the sort is complete | voiced at c784c780a; the voiced clip (`tts_cache/ca15_shadow_it/f64426aacb79ea3a3f5a4e43833cd38c.mp3`) measures 7.368 s with speech from 0.176 to 6.943 s (6.77 s of speech, 0.356 s a word); expect L 6.8 to 6.9 s on t09c, to be confirmed there |

**Beat 9b timing, measured.** On `t11_red_drop_run` the found-stick bubble is up from 42.824 to 45.525 by the marks (2.70 s), and it ends only because Joanne's PC line replaces it. The cached clip's last word ends 2.78 s after its start, so the line cannot finish under its own bubble on that take; t11b holds Joanne's next action so the bubble stays. In the shot: in = `find_bubble` - 0.05, take audio muted, cached clip laid in at 0.05 s (the bubble's first frame). Speech runs 0.05 to 1.69 and 2.20 to 2.83; the cut is at 3.16, so the line ends 0.33 s before it. These are measured figures, not estimates. The bubble (47 characters) is on screen for 3.11 s.

**Beat 12 timing.** W = 7.58 s (12 beats, b93 to b105). In = `line_start` - 0.2. On t09b Nilesh's next line ("And nobody gets told off for asking.") starts 0.723 s after this one ends, so a fixed out point would catch its first syllable whenever the line runs short. Rule:

> out = min(`line_start` + W - 0.2, `line_end` + 0.55), then hold that last frame (mouth closed, eyes open, portrait up, no subtitle of the next line) to the cut.

`line_end` + 0.55 leaves 0.17 s clear of the next line and 0.55 s of tail after the last word. If the frame at `line_end` + 0.55 is mid-blink on t09c, freeze the `line_end` + 0.4 frame. On the measured clip (L 6.8 to 6.9 s) `line_end` + 0.55 falls at `line_start` + 7.3 to 7.5 and the window ends at `line_start` + 7.38, so the freeze runs 0.06 s at most: in practice none, and the mid-blink check is moot. The shot runs from `line_start` - 0.2 to `line_start` + 7.38 and the line ends 0.44 to 0.61 s before the cut; `line_start` - 0.2 stays, do not move the in point later. The line must end 0.3 s before the cut, so it fits 12 beats up to L = 7.08 s. For reference, the length L each window takes without a freeze:

| Beats | W | L without a freeze | With the freeze rule |
|---|---|---|---|
| 11 | 6.95 | 6.20 to 6.45 | up to 6.45 |
| 12 (scripted) | 7.58 | 6.83 to 7.08 | up to 7.08 (measured L 6.8 to 6.9 s is inside it) |

If L measures over 7.08 s: lead 0.1 covers up to 7.18. Beyond that, beat 12 takes a beat from beat 11 (8 beats, 5.05 s), and v38 gives way to v38f (gate 4.65 at lead 0.1, worst 2.85).

## 5. Shot list and framing

Takes live in `~/video-takes-local/ca15/takes/`. Retakes run with the standard ca15 flags (`--hide-hud --zoom-step 1`) **from this branch** (cf31e6c5d, 8dabd5955 and 36378d2a7 are not on main). Zoom is 16:9 / 9:16 / 1:1; cx and cy are fractions of the 1920 x 1080 source with the pixel in brackets. Crop sizes: 16:9 zoom 2 is 960 x 540, zoom 3 is 640 x 360; 9:16 at 1.125 is 960 wide, at 1.6875 640 wide; 1:1 zoom 2 is 540 square, zoom 1 is 1080 square.

| # | Shot | Take and window | Zoom and crop | On-screen text to check |
|---|---|---|---|---|
| 1 | hook | **t19_kettle_hook** (new): ops room, no stick dropped, Joanne and Niamh at the kettle, the player sprite hidden and the player stood 100 to 150 px from Joanne, outside her 96 px face-the-player distance and with a clear line (so the line is heard and the bubble is full alpha), Joanne's pool line forced to "The file share's crawling again." Mark `share_bubble` on its first frame; in = mark - 1.0, out + 4.42 (out = mark + 3.42; the take asserts the bubble lives at least 3.5 s). No footage fallback for the final cut. Stand-in for review renders only: t11_red_drop_run in 37.20, out 41.62 (bubble "Printer's jammed again." up from about 37.60 to 41.40, last frame clean), clip laid in at 0.4 s | t19: 2 / 1.6875 / 2, crop centred on the pair and the whole bubble, measured on the take. Stand-in: 1 / 0.5625 / 1, 1:1 cx 0.5729 (1100) | No other bubble in the 1.0 s before the mark or in the window ("Printer's jammed again.", "Is the Shipley run late again?", "Kettle's on, want one?" and "Who's nicked the big mug?" all fire in this room). The stand-in shows the printer line, the learner and the dropped stick at her feet, which is why it is not a fallback. The stand-in's bubble is a faint line (about 230 px away, alpha 0.6); t19's is full alpha, so the final will read brighter |
| 2 | open | card | none | none |
| 3 | topic | **t17_brief** (new): kiosk opened on the Brief. Mark `brief_shown`; in = mark + 0.1, out + 6.95; the take holds 8.0 s. No fallback: the only existing panel take (t03b) shows the Everyday choices intro, which has no definition and a "Make the choices" button | 2 / 1.125 / 1 if the Brief panel, frame included, is 540 px tall or less on t17, cx 0.50 (960), cy 0.50 (540); otherwise 1 / 1.125 / 1. Write the measured height and the choice into the edit list notes. 9:16 cx 0.5 | The brief reads "...shadow IT: staff using devices, apps, accounts or services that IT doesn't know about or hasn't approved, usually as a shortcut." and ends "Only the inbox is scored": not a score, keep. Cursor hidden; any start button ("Make the choices" or the like) hidden; the step tab strip is expected if it only names steps. Frame check at `brief_shown` + 0.5 for anything but the brief text and the strip. The panel and v30's caption give two true wordings of one definition; if frames look crowded at zoom 2, use zoom 1 and let the caption lead. Assert the text contains "shadow IT" and no `\bpack\b` |
| 4 | red card | card "Take the shortcut" | none | none |
| 5 | email | **t16_shortcuts**: card 1, `send_personal` picked. In = `c1_pick` - 2.6; out + 5.05. The card reads for 2.6 s, the click falls under "to a personal inbox" (the phrase starts 1.5 to 1.9 s in and runs past 3.3), and the picked option holds 2.45 s | 1 / 1.125 / 1, 9:16 cx 0.5 (the 716 x 632 px panel does not fit a zoom 2 crop) | Card 1 says "client files" and "The share has crawled to a halt". "Choice N of 4" header hidden. No verdict tag, mark or verdict colour after the pick |
| 6 | email cost | t16_shortcuts: "Six months later" with card 1's consequence only. In = `reveal_email`; out + 6.32 | 2 / 1.125 / 1; 16:9 cx 0.50 (960), cy 0.50 (540), **only if the page still fits**: on t03c the 754 x 508 px page fitted a 540 px crop with 16 px spare, and the consequence text is now about 20 words longer. Measure the page on t16; if it is over 540 px tall use 1 / 1.125 / 1 | Per-choice labels and tags hidden with `hideText`; the item's warn-colour left border set to the neutral panel border (`awareness-skin.css` :224 colours it for a taken, unsafe item). The body must read "IT had never known the copy was there" and must not read "reused password" (take assert) |
| 7 | device | t16_shortcuts: card 3, `plug_visitor` picked. In = `c3_pick` - 3.9; out + 6.32. With the 10-word v34 "Even" starts about 3.2 to 3.6 s in and the line ends by about 5.9, so the click at 3.9 s falls inside "Even a USB stick" at either pace. Set the final in point from the measured clip so the click sits 0.3 s after the onset of "Even", no earlier than `c3_pick` - 3.9 (the script's own floor). The picked option holds 2.42 s | 1 / 1.125 / 1, 9:16 cx 0.5 | The option reads "Plug the visitor's USB stick into your work laptop". Header hidden; checks as beat 5 |
| 8 | device cost | t16_shortcuts: "Six months later" with card 3's consequence only. In = `reveal_stick`; out + 5.05 | as beat 6, measured on t16 | Body as erb :699; border and tags as beat 6 |
| 9a | attacker | **t11b_drop**: in = `drop_land` - 2.40, out + 3.79. On t11's timings that is 1.5 s of walking, the menu for 0.7 s, the stick landing 2.40 s in and 1.39 s after it; v36c is placed so that "found" starts 0.1 s before `drop_land` (2.30 s in), at a lead of 0.1 to 0.5 s from the measured clip (section 3). Fallback, existing: t11_red_drop_run in 30.88, out 34.67 (`menu_open` 32.42, `drop_click` 33.12, `drop_land` 33.275) | t11b: 2 / 1.6875 / 2, cx 0.50 (960) in all three, cy 0.5704 (616) in 16:9 and 1:1, rechecked on the take; in 9:16 check frames for the inventory bar and the top void and mask or drop to 1.125 if either shows. t11 fallback: a chatter bubble ("Who's nicked the big mug?", x 1152 to 1552, y 440 to 497) is up from 33.50, the last 1.17 s of the window. Use 16:9 zoom 2 cx 0.6354 (1220), crop 740 to 1700, which stays inside the room frame (it ends at x 1703; cx 1240 showed a 17 px black sliver); 9:16 at 1.6875 cx 1240, crop 920 to 1560 (if the stick touches the left edge, cx 1230); 1:1 zoom 2 cx 0.4531 (870), crop 600 to 1140, cy 616 (if Joanne's sleeve shows at the right edge, cx 860) | t11b: the menu header reads "Unlabelled USB stick", plain, no mask; no bubble, click-path line or ring marker in the window, camera settled (take asserts). t11 fallback: the header reads RED-TEAM STICK; flat box `{x:920,y:765,w:115,h:30}` from take 32.35 to 33.20, unchanged by the new centres; frames 34.42 to 34.67 carry no toast, panel or item name. In the fallback's first 0.7 s the camera is still panning (the kettle pair moves about 500 px) and a click-path line and ring show; in 9:16 about 215 px of void sits at the top with the inventory slots at the foot. None is a spoiler; all of it is why the retake is preferred |
| 9b | found | **t11b_drop**, later window: in = `find_bubble` - 0.05, out + 3.16. Take audio muted; cached clip at 0.05 s (section 4). Fallback, existing, for review renders only unless the owner accepts it (question 7): t11_red_drop_run in 42.19, out 45.35 (bubble up at 42.82, 0.63 s in, and whole to the cut), with the clip laid in at 0.08 s so the line ends 0.30 s before the cut. In the fallback the voice leads the bubble by 0.55 s, which cannot be reduced; Joanne is already at the stick | t11b: 2 / 1.6875 / 2 centred on Joanne and the whole bubble, whole-pixel centre measured on the take, valid only because the take holds her in place. If the hold cannot be scripted she walks about 700 px in 2.4 s: use 1 / 0.5625 / 1. t11 fallback: 1 / 0.5625 / 1; 1:1 cx 0.4896 (940), crop 400 to 1480, which keeps the bubble text whole at both ends of her walk (cx 920 clipped the last letter of "memory" for 0.3 s). In 16:9 the room frame ends at x 1703, so 217 px (11 percent) on the right is void, the room's own edge, also present in the 9:16 frame | Bubble text whole in every format's crop. No toast, objectives panel or item name ("Picked up..." toasts name the kit on t11 after 45.68, outside the window). The next bark ("I'll just plug it in...") must not replace the bubble before the cut |
| 10 | blue card | card "Now it's your turn" | none | none |
| 11 | inbox | **t06b_inbox_list** (new): in = `list_shown` + 0.10; out + 5.68. The list is held for the whole shot and no message is opened: both named subjects (the posted stick rows and "Too big for email? Upload it here, free") can be read for 5.68 s, captions off. Fallback, existing: t06 in 2.20, out 6.62, the list only (7 beats, 4.42 s); the close takes the other 2 beats (13), and v38 is replaced by v38f (gate 3.92 at lead 0.2, worst 2.85, slack 1.07) | 1 / 1.125 / 1, 9:16 cx 0.5 (the panel is 480 to 1436 px of a 480 to 1440 crop) | Hidden by the take: the verb row, the advice text, the "0 of 6 sorted" counter and bar. Expected and fine: the header strip "Shadow IT: the shortcuts" with tabs "1 Brief, 2 Sort, 3 Review, 4 Result", the sender "Benmoor Packaging", and the reading pane's "Select a message to read it." t06 fallback: box the counter `{x:430,y:100,w:440,h:62}` for the whole shot; its fileshare row is the stale "Mo...", truncated, usable |
| 12 | nilesh | **t09c_nilesh_tell_it** (retake of t09b on this branch, same seeding: sort complete, then talk). In = `line_start` - 0.2; out and freeze by the rule in section 4. Stand-in for review renders only: t09b in 9.03, out 15.35 at 10 beats; its first words are the old "That's the lot." | 1 / 1.125 / 1. 9:16 cx 0.6396 (1228); 1:1 cx 0.6448 (1238), as r4's Nilesh shot, rechecked on t09c | Portrait and burned captions. Masks in all three formats: the subtitle bar (y 850 to 1080, the part inside each crop), which covers "Skip", and in 16:9 `{x:1860,y:0,w:60,h:60}`. If the 1:1 or 9:16 crop is later moved so the bar falls outside it, say so in the edit list. The next line's subtitle, audio and mouth movement must not appear before the cut |
| 13 | close | card: Shadow IT / "Take the shortcut here ·" over "See where it leads" / plate "Learn on Hacktivity.co.uk" | none | none |

Never on screen: choice verdicts, the game's "Your call" tags, inbox verbs, advice text, tallies ("0 of 6 sorted"), scores, the debrief, the Monday card, the habit line as kiosk text, the session note, the item name "Red-team stick", an opened inbox message.

## 6. Takes

All on this branch.

**Required (six scripts):**

| Take | Covers | Must show | Marks |
|---|---|---|---|
| t19_kettle_hook | beat 1 | Ops room, nothing dropped, the player sprite hidden (`setVisible(false)` or alpha 0) and the player stood 100 to 150 px from Joanne and at least 96 px from Niamh (R5 m3: either can turn to face the player inside 96 px), outside Joanne's 96 px `facePlayerDistance` (`npc-behavior.js` :709, :1242, where an idle NPC turns to face the player, hidden or not) and inside the 160 px full-alpha radius, with a clear line to her (`playerHears` needs `canSeePlayerToFace` clear, `npc-needs.js` :5757 to :5760). A visible learner out of the crop is 480 px or more away, where the chat turn becomes a picture bubble; 160 to 480 px gives a faint, 0.6 alpha line; within 160 px the line is heard at full alpha (`npc-needs.js` :4663 to :4690, `OVERHEAR_RADIUS`). Force the line: before the kettle pair forms, call `window.npcNeedsSystem._bags.set('ca15_joanne_pell|ca15_kettle', { sig: <the live chatterPool's lines joined with "\n">, order: [2], round: 1, last: -1 })` (`_bags` is a `Map`, npc-needs.js :524, :2937 to :2938; assigning a property on it, `_bags[key] = ...`, has no effect) (the line is index 2 of her pool; `_bagNext` resets any bag whose `sig` differs, :2933 to :2937, so a bag without `sig` is ignored silently; `_bagPeek` skips an echo of a line said lately within 320 px). Which of the pair speaks first is a seeded roll, so prime Niamh's bag as well if the framing needs a set order, and retry the seed if Niamh speaks first. Assert the bubble text equals erb :1583 and the speaker is Joanne, that the line is heard (`talking.faint` false and `npcNeedsSystem.world.playerHears('ca15_joanne_pell', 160).overheard` true; `npcNeedsSystem.playerHears()` itself returns a boolean, R5 m2) and the bubble alpha is 1; a frame check at `share_bubble` + 0.5 that both NPCs face the kettle and not the player; assert the bubble stays up at least 3.5 s from its first frame (the 3.8 s life on t11 was measured for a 23-character line; this one has 32), and stop and report if it does not; no other bubble from 1.0 s before the mark to 3.5 s after it; hold 4.0 s after the bubble starts | `share_bubble` |
| t17_brief | beat 3 | Kiosk open on the Brief, static, 8.0 s. Cursor hidden; any start button hidden. Assert "shadow IT" present and no `\bpack\b`. Save a frame at `brief_shown` + 0.5 and check it for anything but the brief text and the step strip. Record the panel's height in the take notes | `brief_shown` |
| t16_shortcuts | beats 5 to 8 | Fresh game. Kiosk, Everyday choices, header "Choice N of 4" hidden from the first card. Card 1: hold 2.8 s, pick `send_personal`, hold 4.0 s. Card 2: either, off window. Card 3: hold 4.5 s, pick `plug_visitor`, hold 3.5 s. Card 4: either, off window. "See where they led"; dismiss the step-away panel off camera (as `t03c_flip_one.mjs`). Before each reveal set the shown item's `border-left-color` to the neutral panel border. Show card 1's consequence only (others hidden by `data-beat`), hold 7.0 s; then card 3's only, hold 6.0 s. Asserts, any failure fails the take: card 1 contains "client files"; card 3 contains "USB stick"; card 1's consequence contains "never known the copy was there" and does not contain "reused password"; no text matches `\bpack\b`; no verdict tag or colour shows while a card holds; no `.aw-montage-tag` is visible during either reveal. Record the consequence page's height for each of the two reveals | `c1_pick`, `c3_pick`, `reveal_email`, `reveal_stick` |
| t11b_drop | beats 9a and 9b | The t11 opening, then the find, in one take. Kettle-pair chatter suppressed from the start of the take until `find_bubble` - 0.5 by setting `chattiness` 0 on both NPCs (`npc-needs.js` :4660, so no bark and no picture bubble; `chatter: false` still allows picture bubbles, which the no-bubble assert would catch), restored then. A pair left silent is dropped for good: each silent turn counts on the chat, the gap is `CHAT_GAP_MS` 500 ms, and a chat past 40 turns is deleted (npc-needs.js :4684), so about 20 s of `chattiness` 0 ends the kettle chat and restoring the value does not bring it back. That is acceptable: nothing in 9a or 9b depends on the chat resuming (9b is the `npc_picked_up` event bark, not chatter). Set `chattiness` on the NPC objects from `npcManager.getNPC(id)` (the record `world.getNpc` returns, npc-needs.js :4662; documented at `NPC_NEEDS_SYSTEM.md` :592) and keep the no-bubble assert; Joanne's 9b line is an event bark on `npc_picked_up`, so it is unaffected (the 9b window is the only place a bubble is wanted). Assert no bubble element from `drop_land` - 2.5 to `drop_land` + 2.0. The learner walks in from a spot where the camera has already settled: no camera movement from `drop_land` - 3.8 (which also covers Variant A's longer window), and the click-to-move path line and ring marker hidden. Menu header reads "Unlabelled USB stick" (assert). After Joanne picks the stick up, hold her where she stands and delay her PC use until `find_bubble` + 3.6, so the found-stick bubble is not replaced and does not travel; assert the bubble text equals the erb :1596 bark, is on screen for at least 3.4 s from its first frame, and no other bubble shows from `find_bubble` - 0.5 to + 3.4. No toast or objectives panel in either window. If the bubble's own life is under 3.2 s, stop and report | `menu_open`, `drop_click`, `drop_land`, `find_bubble`, `find_bubble_end` |
| t06b_inbox_list | beat 11 | The t06 script with the verb row, advice text and counter hidden by CSS before the list appears; list held 6.2 s; no row opened. Assert none of the hidden parts shows from `list_shown` to + 6.2, that the intro page has gone, and that the reading pane stays on "Select a message to read it." Assert the fileshare row's subject contains "Client files for Monday". Assert no `\bpack\b` in any row's subject or preview text (not the sender column: "Benmoor Packaging" is a sender and must not trip it) | `list_shown` |
| t09c_nilesh_tell_it | beat 12 | t09b's seeding; the new first line, whole; menu hidden. Assert the line text equals ink :65. Hold at least 8.0 s after `line_start`. Save the frames at `line_end` + 0.4 and + 0.55 in case the freeze fires (on the measured 7.368 s clip it should not) | `line_start`, `line_end`, `next_line_start` |

**Fallbacks on existing takes (no new recording):**

| Beat | Existing take and window | What it costs |
|---|---|---|
| 9a | t11_red_drop_run 30.88 to 34.67, mask box, crops cx 1220 / 1240 / 870 | stale menu header under a mask; a chatter bubble in the last 1.17 s; a camera pan and a click marker in the first 0.7 s |
| 9b | t11_red_drop_run 42.19 to 45.35, zoom 1, 1:1 cx 940 | the voice leads the bubble by 0.55 s; 11 percent void on the right in 16:9. Review renders only unless question 7 says otherwise |
| 11 | t06_inbox_list 2.20 to 6.62, counter boxed, v38f | 7 beats; the close grows to 13 |

Stand-ins for review renders only, never the final: beat 1 on t11 37.20 to 41.62 (printer line), beat 12 on t09b 9.03 to 15.35 (old first words). Beats 3 and 5 to 8 have no fallback: every one shows text that changed.

Nothing needs TTS before recording: Joanne's kettle line is voiced (a5ff69226) and Nilesh's ink :65 line was voiced at c784c780a.

**Existing takes that show outdated episode text:**

| Take | Stale text | Use here |
|---|---|---|
| t03_choices_reveal | card 1 "the pack" (situation and option); card 3 "Plug the visitor's stick into your laptop" (now "USB stick", "work laptop") | none |
| t03b_choices_hold | not stale, but shows the Everyday choices intro, not the Brief | none |
| t03c_flip_one | card 1 "pack"; consequence "the pack sat in its sent items" | geometry reference only |
| t06_inbox_list | row "Monday pack, final" (now "Client files for Monday, final"), truncated to "Mo..." in the list window | beat 11 fallback, usable |
| t08, t08b | Nilesh's old welcome (no definition of shadow IT) | none |
| t09, t09b | "That's the lot." (now "That's shadow IT for you.") | beat 12 stand-in only |
| t10_worldbeat_panel | heading "One from the red-team kit" (now "Try the attacker's side") | none |
| t11_red_drop_run | item menu header "Red-team stick" (now "Unlabelled USB stick"); Nilesh's hand-over lines ("red-team kit", "safe tracker, booked in with IT"); the session note; toasts naming the kit after 45.68 | beat 9a and 9b fallbacks, beat 1 stand-in. The stale lines and toasts are outside all three windows |

Not stale and not used: t14, t15, t07.

## 7. Music

Unchanged: PeaceFolk "Guitar Motif" from 37.442 s, 73.263 s (29 bars), grid `guitar_motif_75.json` (95 BPM). The drop at b28 (17.684 s) is the cut into the red card.

## 8. Rubric (CA fun and USP, trailer-observable, 0 to 3)

| Item | Score | Evidence |
|---|---|---|
| F1 hook | 2 | An office grumble everyone knows, and it names the cause the story then uses (the slow share) |
| F3 agency | 2 | Two picks, each with its outcome; the learner leaves the stick |
| F4 living world | 3 | Kettle chatter, a colleague finding the stick and asking whose it is, Nilesh at the desk |
| O1 attacker method | 2 | The learner leaves the stick and a colleague picks it up; the plug-in is left as the cliffhanger |
| O2 attacker reasoning | 3 | "Attackers leave sticks to be found", Joanne's helpful "Whose is this?", and the chip `KINDNESS DOES THE WORK` naming why it works. Without the chip (owner question 9) this is 2 |
| O4 tone | 3 | "staff", a slow file share as the cause, Nilesh's "tell us"; no blame |
| P1 practice | 2 | The inbox, with two more of the same kind; answers off screen |
| A1 accuracy (gate) | pass | Reordered for clarity: each cost follows its pick, and the attacker's side moves from before the reveal to after it. In the game all four costs share one page |
| A2 safe takeaway (gate) | pass | Pattern level; "authorised test" on the 9a chip; the lesson is "tell IT" |

17 of 21 (16 if the 9b chip goes). Scored against this script as written; the scores for O1, O2 and F4 depend on 9b.

**Variant A (one attacker shot), the alternative for owner question 1.** Beat 9 is a single 9-beat shot (5.68 s) of the drop: t11b in = `drop_land` - 3.6, out + 5.68, with v36 "Attackers leave sticks to be found. You do." (8 words, one stop, lead 0.1, gate 5.28, stops read 4.26, rate read 4.56, slack 0.72). Captions A "Attackers leave sticks\nto be found." B "You do." (7). The chip is `YOU TRY IT: AUTHORISED TEST`, as in the default, so "you" is both said and shown; `KINDNESS DOES THE WORK` has no shot to sit on and goes. The two beats freed go to beats 5 and 11: 7 + 10 + 11 + 5 + 9 + 10 + 10 + 8 + 9 + 4 + 10 + 12 + 11 = 116, with the drop still at b28. v32 and v38 keep their texts with wider windows (5.68 and 6.32 s). Nobody finds the stick: O1 2 to 1, O2 3 to 2, F4 3 to 2, total 14. Narrator total 88 words.

**Variant B (found-stick hook), the literal reading of the owner's note, not recommended.** Open on Joanne's line as r4 did and pay it off with her at her PC. It opens the trailer on a planted stick before the term is named, which is the confusion the owner described.

## 9. Episode text changes requested

Scenario and ink files are untouched by this script.

| # | File:line | Old | New | State |
|---|---|---|---|---|
| 1 | `scenarios/ca15_shadow_it/scenario.json.erb:691` (`send_personal` consequence) | "...broken into with a reused password; the client files sat in its sent items..." | "Months on, the personal inbox was broken into. The client files were still in its sent items, and IT had never known the copy was there, so nobody could protect it or take it back. The client got a convincing fake invoice built from them." | **made**, 36378d2a7 |
| 2 | same file `:692` (`ask_nilesh`) | "...broken into with a reused password and the files were copied." | "...that inbox was broken into, and IT never knew a copy was there to protect." | **made**, 36378d2a7 |
| 3 | same file `:5` and `:657` (the two briefs) | `:5` ended "Only the sort is scored." | both end "Only the inbox is scored." | **made**, 36378d2a7 |
| 4 | same file `:1580-1584`, Joanne's `ca15_kettle` chatter pool (the defend-only twin has no kettle pool, so no mirror) | lines: "Kettle's on, want one?", "Who's nicked the big mug?" | third line added: "The file share's crawling again." | **made**, a5ff69226 (dialogue-reviewed, voiced). The hook, v31 and the 9:16 hook caption are written on it |
| 5 | `scenarios/ca15_shadow_it/mission.json:3` (the description, shown on the course page beside the trailer) | "...Only the sort is scored, and reporting when you're unsure is always fine..." | "Only the inbox is scored, and reporting when you're unsure is always fine and never marked down." | **requested**, not made. Only the full episode's `scenarios/ca15_shadow_it/mission.json` :3 needs the change: the defend twin's description has no "Only the sort is scored" wording (checked in R3). The course page shows this description beside the trailer, so it should land before the trailer is published |

Row 1 made the consequence about 20 words longer; beats 6 and 8 re-measure the page before fixing the zoom (section 5). If the page no longer fits a 540 px crop and zoom 2 matters, the clause "so nobody could protect it or take it back" could go without hurting v33; that would be a further episode change and is not requested here.

No change is needed for v34: it uses "unknown device" and "work laptop", both in the episode.

## 10. Open questions for the owner (via AC0)

Each carries the default and what the two R2 reviewers recommended.

1. **The attacker's side and the found-stick line: C or A.** The owner's note on the r1 hook was "extend the opening bubble to the whole line". Default (C): Joanne's line plays whole, as the payoff of the attacker's side at 47 s, after the term has been defined; the hook is the slow-share grumble. Alternative (A, section 8): one shot of the drop with "You do." and no find, scoring 14 against 17. Reviewers: C, with the new chips; A drops the one shot where the office reacts. Variant B (the line as the hook again) is the literal reading of the note and is not recommended.
2. **Keep the attacker's side at all.** Default: keep. It is 6.9 s, the course's selling point and the only place the learner acts as the attacker. Reviewer: keep; no other awareness trailer has it.
3. **Nilesh's closing line as the stated lesson.** "If the official way's slow, tell us rather than building your own way round" is advice. The house rule keeps advisory lines off screen; this is the one exception. Suggested wording for the rule, with the reviewer's addition: "One stated lesson, spoken and captioned, by a cast member in the episode's own words, never by the narrator and never as kiosk text." Confirm.
4. **The close tagline (carried from r4 Q4).** Default v11b "Take the shortcut here, see where it leads. Learn on Hacktivity.co.uk." in an 11-beat close. Straight after Nilesh says to tell IT, the cached series tagline v11 "Take the shortcut, see where it leads." reads as the opposite advice; "here" fixes that. Reviewer: v11b. If v11b measures over its gate, the narrator says "Take the shortcut here. Learn on Hacktivity.co.uk." and the card alone carries "See where it leads".
5. **v1c retired.** "This episode: Shadow IT." (cached) is replaced by v30, which names and defines in one sentence; the open card has already shown the title. Reviewer: yes.
6. **"Unknown devices plugged into work laptops" for the owner's "untrusted devices on business networks".** The episode says "unknown device" and never says "untrusted" or "network", and the picture shows a laptop. Default: the episode's words in VO, and the chip `A VISITOR'S USB STICK`. Reviewer: keep both; the chip tells the viewer whose stick it is, and "Even a USB stick" already answers the owner's note. Option if the owner wants "untrusted" seen: chip `AN UNTRUSTED USB STICK` (22), no episode change.
7. **The 9b fallback and its void edge in 16:9 (carried from r4 Q5).** Applies only if t11b cannot be recorded. The existing t11 window at zoom 1 has 11 percent void on the right in 16:9 (the room's own edge, also present in the 9:16 frame), and the voice leads the bubble by 0.55 s. Default, as the sell reviewer recommends: do not ship it; use it for review renders only. The timing reviewer would accept it as a fallback.
8. **Beat 11 never opens a message.** Rev R1 opened the Benmoor message for 1.82 s. Both reviewers said to drop it: at 1.82 s it is neither read nor understood, and a paused frame would be a readable worked lure. Default now: the list for the whole 5.68 s. If the owner wants a message opened, it needs at least 2.5 s and a beat from the close.
9. **The 9b chip `KINDNESS DOES THE WORK`.** New in this revision, from the sell review: it puts the attacker's reasoning on screen in Nilesh's words (ink :92, "Kindness does the attacker's work."), and without it nothing in the cut says why Joanne's question matters. The reviewer reads it as attacker reasoning at pattern level, "not a tell of any inbox item and not advice". It could also be read as a tell, or as advice by implication (be less kind with found sticks), under the rule that keeps tells and advisory lines off screen. Default: keep. If the owner reads it as a tell, 9b takes the chip `SOMEONE FINDS IT` (16; the 9a chip would put `YOU TRY IT` over a shot of Joanne) and rubric O2 drops to 2. The same idea is in the episode's post-verdict feedback: the giveaway stick's `reportReply` (erb :433) and the concept panel (erb :671); the scored flag on the stick rows is `found_media`, so kindness is why a person plugs a stick in and not what marks an item risky.
10. **v38 names two risky inbox items.** "A stick in the post. A free upload site." names two of the scored inbox rows, both of the risky kind, straight after the cut has shown what a stick can do. It gives no verdict and the episode's own brief is as specific. Default: keep. Recorded here so the judgement is the owner's, at the sell reviewer's request. Two more facts for it: ink :61 (Nilesh after the sort) says "A stick in the post is a found stick, whatever the note says", so v38's first sentence is the subject of an answer line; and the inbox has six rows, four risky and two safe, with the two named kinds covering three of the four risky rows and neither safe one. If the owner reads v38 as an answer, the replacement at the same gate is "Sticks that turned up. Quicker ways. You sort them." (9 words, two stops: stops read 5.06, rate read 5.13, gate 5.28), the brief's own public wording (erb :657), which covers safe and risky rows alike.

**R3 sell reviewer's recommendations on 1 to 10 (folded in).** 1: C; the found-stick line, whole, is the one shot where the office reacts to the learner. 2: keep, 6.9 s and the course's selling point. 3: confirm, with the rule wording as given in question 3; with v31 the line also pays off the red card's VO. 4: v11b; v11 without "here" contradicts Nilesh. 5: yes, retire v1c. 6: keep the episode's word, now with a verb; keep the chip `A VISITOR'S USB STICK`, which says whose stick; "Even a USB stick" answers the owner's note. 7: review renders only; a voice ahead of the bubble on the payoff line is not shippable. 8: list only. 9: keep; it is not a tell (no inbox item is given away) and not advice in form (it says why the trick works, from the attacker's side), but it shares its idea with one item's post-verdict reply, so the owner decides knowing that; if no, `SOMEONE FINDS IT`. 10: keep; the brief and the mission description already say the inbox holds sticks that turned up and quicker-way messages, and the line gives no verdict; if no, the replacement above.

For the integrator, not the owner: the defend-only twin (`ca15_shadow_it_defend`) has no "tell us" line in Nilesh's ink, no kettle pool and no stick to leave. If this trailer also fronts the twin on a course page, beats 1, 9 and 12 show things that variant does not contain.

## 11. Lines to voice

Narrator, 10 new: v30, v31, v32, v33, v34, v35, v36c, v37, v38, v11b, after the script review rounds and the `npc-dialog-review` wording check. Five reserves in the same run: v36d, v33s, v38f, v11c, v34r (texts in section 3). Variant A adds v36. Voice with `tools/video/scripts/narrate.rb`, trim with `trim_vo.py` and the `LINES_v2.md` gain pass, then measure each clip against its gate first and choose between the line and its reserve second (section 3); a clip over its gate is swapped for its reserve, not trimmed. Cast: nothing to voice.

| id | Text |
|---|---|
| v30 | Shadow IT: the shortcuts staff take that IT doesn't know about. |
| v31 | The official way's slow. |
| v32 | Client files go to a personal inbox. |
| v33 | Then it's broken into. IT never knew the copy existed. |
| v34 | Unknown devices plugged into work laptops. Even a USB stick. |
| v35 | Its program copies every folder in reach. |
| v36c | Attackers leave sticks to be found. |
| v37 | Your turn. |
| v38 | A stick in the post. A free upload site. |
| v11b | Take the shortcut here, see where it leads. Learn on Hacktivity.co.uk. |
| v36d (reserve) | Attackers leave sticks on purpose. |
| v33s (reserve) | Someone breaks in. IT never knew the copy existed. |
| v38f (reserve) | Sticks by post, free uploads. |
| v11c (reserve) | Take the shortcut here. Learn on Hacktivity.co.uk. |
| v34r (reserve) | Unknown devices get plugged in. Even a USB stick. |
| v36 (Variant A only) | Attackers leave sticks to be found. You do. |

## 12. R1 dispositions

"Sell" is `ca15_trailer_script_r5_review_R1_sell.md` (03d39567c); "Timing" is `ca15_trailer_script_r5_review_R1_timing.md` (36eca5f3d). This table is the record of rev R1; where sections 13a, 13 and 14 differ (the close's length, beat 11, the VO wordings and gates, the chips), the newest round stands: 13a (R4) over 13 (R3) over 14 (R2) over 12 (R1). File order is not date order, since section 14 is the R2 round and comes after section 13.

| id | Action | Reason |
|---|---|---|
| Sell M1 | Applied, the episode-change route | Hook is "The file share's crawling again.", Joanne's line as it landed at a5ff69226 (the reviewer proposed "The share's crawling again." for Niamh), forced in t19 by priming her chatter bag; the 9:16 caption takes two lines; v31 "So staff take a shortcut."; v32 drops "So". Both clear their gates |
| Sell M2 | Applied in Variant A; adapted in the default | "Attackers leave sticks to be found. Here, you do." needs an 8-beat shot (slack 0.19 at lead 0.1). With 9b in the grid only 6 beats are free for 9a, so the default carries the first sentence as v36c and the chip `YOUR AUTHORISED TEST` carries "you" |
| Sell M3 | Applied: Variant C is the default | 9a 6 beats, 9b 5 beats. The reviewer's 5-beat 9a failed its slow read, so 9a has 6. The three beats come from beats 5, 11 and 13, all after the drop. Bark measured from the cached clip and the t11 marks; t11b must hold the bubble, since on t11 it is replaced after 2.70 s |
| Sell M4 | Applied | t16 asserts "never known the copy was there" present and "reused password" absent; section 9 rows 1 to 3 marked made (36378d2a7); page height re-measured before zoom 2. The reviewer's trim of the consequence is noted as a possible later change, not requested |
| Sell M5 | Applied, adapted | t06b holds the list 4.6 s and the message 2.5 s. In the 10-beat shot the message shows for 1.82 s, not 2.45, because beat 11 gave a beat to 9b. Owner question 8 records the choice |
| Sell m1 | Applied | v35 "the folders"; caption line 2 counts 23, not 24 |
| Sell m2 | Not applied | The 12-word v34 misses its gate on the slow read and no beat is free |
| Sell m3 | Applied | A1 evidence reworded |
| Sell m4 | Applied | "two more of the same kind" |
| Sell m5 | Applied | Recorded as a judged exception under v38's truth check |
| Sell m6 | Applied | Caption held for the whole of v30; zoom 1 if the panel crowds the frame |
| Sell m7 | No action | As the reviewer says |
| Sell m8 | Applied | No fallback for beat 1; the t11 window is a stand-in for review renders only |
| Sell m9 | Noted | Passed to the integrator in section 10; the twin also lacks the kettle pool |
| Sell Q6 | Applied | Chip option `AN UNTRUSTED USB STICK` added to owner question 6 |
| Timing M1 | Applied | t11b is the source, with the no-bubble assert and marks; fallback crops cx 1240 (16:9, 9:16) and 870 (1:1), window re-cut to 30.88 to 34.67 for the shorter shot, which shows the bubble for 1.17 s instead of 1.55 |
| Timing M2 | Applied | out = min(start + W - 0.2, line_end + 0.65) with a frozen last frame; subtitle bar masked in all three formats; t09c asserts the line text and marks the next line. The over-7.08 reserve now needs v38f, because beat 11 is already at 10 beats |
| Timing M3 | Applied | v33 "IT never knew the copy existed." (11 words). Narrator total recounted: 95 |
| Timing m1 | Applied | Stand-in window 37.20 to 41.62, 1:1 cx 1100; t19 forces the line and asserts no other bubble |
| Timing m2 | Applied | Section 9 and the v33 truth check updated |
| Timing m3 | Applied | v31 lead 0.1; v37 dropped if it measures over 2.13 s |
| Timing m4 | Applied | t03b fallback removed |
| Timing m5 | Applied | Tab strip noted; `\bpack\b` on subject and preview only; subject assert added |
| Timing m6 | Applied | 9a: the stick lands 2.40 s in and 1.39 s follow; rubric O1 reworded |
| Timing m7 | Applied in part | Card 1 held 2.6 s before the pick (the 8-beat window still leaves 2.45 s after it); captions stated as carrying 9:16 and 1:1. The zoom 2 crop of the option block is not adopted: it is unmeasured and would cut the situation line that names the slow share |
| Timing m8 | Applied | t19, t17 and t11b specs filled in |
| Timing m9 | Applied | Edit id `ca15_trailer_r6` |

## 13a. R4 dispositions

Review R4 is `ca15_trailer_script_r5_review_R4_delta.md` (bca810b72), a delta review of rev R3 (60a02986a): 0 Blocker, 0 Major, 9 Minor. All nine are applied; no narration line changes. This section is the newest and wins over 13, 14 and 12 wherever they differ.

| id | Action | Reason |
|---|---|---|
| m1 | Applied | t19 priming is `window.npcNeedsSystem._bags.set('ca15_joanne_pell\|ca15_kettle', { sig, order: [2], round: 1, last: -1 })`: `_bags` is a `Map` (npc-needs.js :524), so a property assignment did nothing |
| m2 | Applied | The three cast-line shots (hook, 9b, beat 12) take `caption_breaks` and no `speaker`, as ca16 does; the lint adds the speaker prefix to line 1 on the plain skin and Nilesh A, Nilesh B and the old 9b line 1 were 33, 35 and 34. Noted in the `caption_breaks` paragraph in section 3 |
| m3 | Applied | t19 stands the player 100 to 150 px from Joanne (outside her 96 px `facePlayerDistance`, inside 160) with a clear line, adds a frame check at `share_bubble` + 0.5 that both NPCs face the kettle, and asserts `playerHears(joanne).overheard` as well as `talking.faint` false. Section 5 row 1 matches |
| m4 | Applied | The four phrase-keeping splits, wording unchanged: v33 B "IT never knew\nthe copy existed." (13 / 17); v34 A "Unknown devices\nplugged into work laptops." (15 / 26); 9b three lines "Someone's dropped\na memory stick.\nWhose is this?" (17 / 15 / 14), the 9:16 box grows as for v30; v30 three lines "Shadow IT:\nthe shortcuts staff take\nthat IT doesn't know about." (10 / 24 / 27) |
| m5 | Applied | t11b: `chattiness` 0 drops the kettle chat for good after about 20 s (500 ms gap, dropped past 40 turns, npc-needs.js :4684); restoring it does not bring it back, nothing in 9a or 9b depends on it, and the no-bubble assert stays |
| m6 | Applied | The section 12 tie-break now reads "the newest round stands: 13a (R4) over 13 (R3) over 14 (R2) over 12 (R1)". The R4 table is numbered 13a so no reference to sections 13 or 14 moves |
| m7 | Applied | v34 truth check cites ink :87 and :48; :85 is the knot header |
| m8 | Applied | The v36c rule is judged by the clip's end: fine if the line ends by 3.49 s into the shot with "found" 0.1 s before `drop_land`; v36d only if the end is later than that or "found" needs a lead above about 1.0 s |
| m9 | Applied | v33 voicing note: a clear break between the sentences and stress on "I.T." in the second; no wording change |
| Captions | Converted | Every " / " caption in sections 3 to 5 and Variant A is now in the `\n` form with the per-shot `"caption_breaks": true` syntax of commit 048d15134. Rows in earlier dispositions keep their old wording as the record |
| Lint | Run | A throwaway edit holding every `caption_breaks` caption shot was run through `lint-edit.mjs`; 0 caption errors across the ten captions (hook, v30, v32, v33 B, v34 A, v35, v36c, 9b, Nilesh A and B, no `speaker`); the throwaway's only errors were the two structural ones (no ca_open or ca_close shot), plus take-missing and 9:16 scale warnings from the demo fixture's shot. The narrator captions were linted as shot lines, which is not the path they take in the edit list (they are `vo[].caption` cues; R5 m1) |

## 13. R3 dispositions

"Sell" is `ca15_trailer_script_r5_review_R3_sell.md` (50c79c7c7); "Timing" is `ca15_trailer_script_r5_review_R3_timing.md` (b11d68f37). Both reviews counted 0 Blocker; the timing review had one Major. The orchestrator's calls decided every wording.

| id | Action | Reason |
|---|---|---|
| Sell m1 | Applied | v31 "The official way's slow." (4 words, no stop, same reads as before: gate 2.76, worst 2.28, slack 0.48); caption (24); section 1 step 3 and the v31 truth check cite `habitLine`. The review cited it as erb :661; at this commit :661 is `noBlameLine` and `habitLine` is :664, so the script cites :664 |
| Sell m2 | Applied | v33 "Then it's broken into. IT never knew the copy existed." (10 words, same reads: slack 0.22); caption A (22); the line, caption and page now use the episode's "broken into". Reserve v33s unchanged |
| Sell m3 | Applied | v37 "Your turn." (2 words, gate 2.13, worst 1.14, slack 0.99); the card is unchanged; narrator total stays 86 (v34 +1, v37 -1) |
| Sell m4 | Applied, the 10-word line | v34 "Unknown devices plugged into work laptops. Even a USB stick." Slack 0.12 on the rate read at 0.57 s a word, accepted: the R3 timing review confirmed the measured rate includes its pauses and plain lines run 0.33 to 0.43 s a word; at v11's 0.576 it still clears (5.76 against 5.82). t16 holds card 3 for 4.5 s before the pick (was 4.0) and beat 7 starts at `c3_pick` - 3.9 (was 3.7). The picked option then holds 2.42 s, from the 6.32 s window less 3.9 s; the review said about 2.1 s, which I could not reproduce. Reserve v34r "Unknown devices get plugged in. Even a USB stick." (9 words, the old v34 figures). Caption A "Unknown devices plugged / into work laptops." (23 / 18) |
| Sell m5 | Applied | Ink :61 and the six-row split (four risky, two safe) added to the v38 truth check and to question 10, with the review's replacement for the owner to choose; v38 unchanged |
| Sell m6 | Applied | erb :433 and :671 added to the chip's truth check and to question 9; the question 9 fallback chip is `SOMEONE FINDS IT` (16) |
| Sell m7 | Applied, not edited | Section 9 row 5 states that only the full episode's `mission.json` :3 needs the change; the defend twin has no such wording. The episode file is not edited here |
| Sell owner-question recommendations | Folded in | One paragraph after question 10 carries the review's recommendation on each of 1 to 10, and questions 6, 9 and 10 carry the new facts |
| Timing M1 | Applied | t19 hides the player sprite and keeps the player within 160 px of Joanne, so the chat turn is heard and not faint; the take asserts `talking.faint` false and bubble alpha 1. The stand-in's bubble is faint (alpha 0.6), so the final hook will look brighter than review renders of the stand-in |
| Timing m1 | Applied | A "Which read governs" paragraph in section 3: pauses are inside the rate read; the stops read is not a bound for colon or URL lines; the table slacks are a floor and short plain lines are judged against cached analogues. v36c is the one line that now clears the two reads only at lead 0.0 and is judged on its analogues; this is stated in the table row and below it |
| Timing m2 | Applied | v36c lead is set from `drop_land`: "found" starts 0.1 s before the landing, lead 0.1 to 0.5 s, recorded in the edit list; beat 9a's wording changed to match |
| Timing m3 | Applied | Nilesh's clip measures 7.368 s (speech 0.176 to 6.943); expected L 6.8 to 6.9 s; the freeze runs 0.06 s at most, so it does not fire in practice; the in point stays `line_start` - 0.2; the reserve path is not triggered |
| Timing m4 | Applied | t19 bag priming carries `sig` (the pool lines joined with a newline), `order: [2]`, `round: 1`, `last: -1`, with the `_bagPeek` echo note; t11b sets `chattiness` 0 on both NPCs until `find_bubble` - 0.5, since `chatter: false` still allows picture bubbles |
| Timing m5 | Applied | Section 3 "After voicing" and section 11 give the order: measure each clip against its gate first, choose between line and reserve second; v11b over 6.35 s takes v11c, v30 over 6.55 s takes lead 0.0 |
| Brief note | Applied | Every caption with a forced line break needs the per-shot `caption_breaks` flag on CaCaption (hook 9:16, v30, v32, v33 B, v34 A, v35, v36c, 9b 9:16, Nilesh B); noted in section 3 |

## 14. R2 dispositions

"Sell" is `ca15_trailer_script_r5_review_R2_sell.md` (5cebea928); "Timing" is `ca15_trailer_script_r5_review_R2_timing.md` (e2e2f27f5). Where the two disagreed the orchestrator's calls decided: the stricter gate (stops counted, and the measured 0.57 s a word), an 11-beat close with the URL spoken, Sell M3's wording for beat 11, and the list only.

| id | Action | Reason |
|---|---|---|
| Sell M1 | Applied | 9a chip `YOU TRY IT: AUTHORISED TEST` (27), 9b chip `KINDNESS DOES THE WORK` (22); v36c unchanged; O1 evidence reworded, O2 3 only with the 9b chip. The 9b chip goes to the owner as question 9 because it can be read as a tell or as advice |
| Sell M2 | Applied | Close 11 beats (b105 to b116), the beat taken from beat 11; v11b with a comma. It clears at the measured rate (worst 6.33 against a gate of 6.55 at lead 0.1), so "see where it leads" stays spoken; reserve v11c drops it to the card. The word-count estimator is withdrawn in place of a URL correction |
| Sell M3 | Applied | v38 "A stick in the post. A free upload site."; "Your call" out of VO and captions and onto the banned list; beat 11 is the list only for 9 beats; v38f becomes "Sticks by post, free uploads." Lead moved to 0.1 because the rate read leaves 0.05 at lead 0.2 |
| Sell m1 | Applied, different wording | The reviewer's "Slow share? Take the shortcut." (5 words, one stop) has 0.01 s of slack on the rate read even at lead 0, and v1c shows a short line with a pause running slow. v31 is "Slow share means shortcuts." (4 words, no stop, slack 0.48): it restates the cause, and the red card says "Take the shortcut" under it |
| Sell m2 | Applied, shorter | Present tense, as asked. "Its program copies the folders it can reach." (8 words) misses the gate on the rate read by 0.01, so v35 is "Its program copies every folder in reach." (7) |
| Sell m3 | Applied | t16 neutralises the left border before each reveal and asserts no `.aw-montage-tag` is visible |
| Sell m4 | Applied | "not to be reopened" removed; the judgement is stated in the v38 truth check and put to the owner as question 10 |
| Sell m5 | Applied | Balance paragraph rewritten: red card 3.2, email 11.4, device 11.4, attacker's side 6.9 |
| Sell m6 | Applied | Variant A re-summed on the new default (its shot is 9 beats, beats 5 and 11 take the other two) and carries the 9a chip |
| Sell m7 | Listed, not made | Section 9 row 5, `mission.json` :3, as an episode text change requested. This script edits no episode file |
| Sell m8 | Applied | Section 1 step 6 reworded; "Your call" added to the banned list |
| Sell owner-question recommendations | Folded in | Section 10 states each reviewer recommendation beside its default; question 3 takes "spoken and captioned"; question 7's default is now "review renders only" |
| Timing M1 | Applied, with the orchestrator's calls | Section 3 defines both reads, adds the stops column and withdraws "every line clears its gate". v33 10 words, in the present tense to match Sell m2 ("That inbox gets hacked." for the reviewer's "Someone broke into it."), lead 0.1. v34 9 words, keeping the episode's "work" ("Unknown devices in work laptops." for the reviewer's "in your laptop"). Variant A v36 is the reviewer's 8-word line. Not taken: the 8-word v11b without the URL (the URL stays spoken) and the v38 wording with "Your call" (Sell M3 decided). The same check caught four lines neither review listed, since each failed only on the rate read: v31, v32 ("The" dropped, 7 words), v35 and v37 ("Over to you.", 3 words, for the 4-word "Now it's your turn.", which misses a 4-beat card by 0.15); v36c moves to lead 0.0 |
| Timing M2 | Applied | t11b: no bubble from `drop_land` - 2.5 to + 2.0; chatter suppressed from the start of the take to `find_bubble` - 0.5; camera settled; path line and ring hidden |
| Timing M3 | Applied, further than asked | List only, and `row_usb` is removed from the take, not kept as an option: a paused frame of the open message would be a readable lure (Sell question 8). The shot is 9 beats, not 10, because the close took one |
| Timing m1 | Applied | With M1 |
| Timing m2 | Applied | 9b fallback 1:1 cx 940 (400 to 1480); the void described as the room's own edge, also in 9:16. The reviewers differ on shipping it; question 7 takes the stricter default |
| Timing m3 | Applied | 9a fallback 16:9 cx 1220 (740 to 1700); the pan, marker and 9:16 void in the first 0.7 s noted; t11b spec covers them |
| Timing m4 | Applied | Beat 7 in = `c3_pick` - 3.7, card 3 held 4.0 s before the pick. With the 9-word v34 the click still falls inside "Even a USB stick" at either pace; the edit sets the final in point from the measured clip |
| Timing m5 | Applied | t19 asserts the bubble lives at least 3.5 s, stop and report otherwise |
| Timing m6 | Applied | Freeze at `line_end` + 0.55; mouth closed and eyes open, with the `line_end` + 0.4 frame as the alternative; no-freeze bands recomputed (6.83 to 7.08; 6.20 to 6.45 at 11 beats) |
| Timing m7 | Applied | Section 3 claims rewritten with v1 and v11's measured rates and the withdrawn estimator's miss on v1; t17 hide list and frame check added |

## Sources

NCSC "Shadow IT" guidance (read 26 Nov, as r3 section 7) for the definition and for the cause: staff struggling with sanctioned tools. Review B (`tmp/handover/ac0/ca_trailer_script_review_B.md`, ca15 section and recurring patterns 1 to 4 and 7) for the structure. The R3 timing review of r4 for the beat 9 mask rectangle and the stale-take list. Measurements: the cached bark clip (ffprobe and silencedetect) and the bubble marks in `t11_red_drop_run.trimmed.markers.json`, made for rev R1; the v1 and v11 clip lengths, the kettle clip's speech window and every frame measurement on existing takes are the R2 reviewers' and were not re-pulled for this revision. Checked for rev R2: the contents of `Sulafat_v2/trim/`, `mission.json` :3 and ink :92.
