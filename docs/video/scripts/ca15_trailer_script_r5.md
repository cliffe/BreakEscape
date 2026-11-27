# ca15 trailer script, owner round r2, r5 rev R1 (Shadow IT): cause, shortcut, cost, the attacker's side, fix

File r5, revised after review round R1. `ca15_trailer_script_r4.md` stays as it is; this file replaces its structure and reuses its measured windows, masks and clip lengths wherever a shot survives.

Owner's verdict on the r1 cut (27 Nov): "Two relevant points -- emailing business info to personal email, and USB/device caution -- both are Shadow IT, but this trailer presents a very confusing train of half-concepts. Made even more confusing by the use of unusual terms like 'pack'. Restructure this to explicitly mention shadow IT, and the short cuts staff take -- including use of untrusted devices on business networks, even USB sticks can be a danger." The owner picked option (a): the episode text and the trailer tell the same story. The episode fixes are in on this branch only: cf31e6c5d, the dialogue review 8dabd5955, the consequence and brief wording 36378d2a7, voiced at c784c780a, and the kettle hook line a5ff69226.

Status: script, 27 Nov, revised after R1 (dispositions in section 12). No edit list for this script exists. The edit list will be `tools/video/edits/ca15_trailer_r6.json`, id `ca15_trailer_r6`; the file `ca15_trailer_r5.json` on disk is built from the r3 script and must not be rendered as this cut. Target 73.263 s (116 beats, 29 bars), the r3 music window unchanged.

House rules in force:

- Narrator VO (Sulafat, the ca15 style) at most 3.0 words a second; every line ends at least 0.3 s before its cut; no em or en dashes in VO. No narrator over a character line and none while verdict buttons are on screen. The two-option choice cards in beats 5 and 7 are unscored choices, not verdict buttons, and are narrated (for the integrator to confirm as the reading of the rule).
- Cards and burned captions at most 28 characters a line. UK English, "Cyber Security" as two words. No "Break Escape" on screen. Close plate "Learn on Hacktivity.co.uk".
- No answers, tells, tallies, scores or verdicts on screen or in VO. The one stated lesson is Nilesh's own line in beat 12 (owner question 3).
- No in-game terms in VO, cards, chips or tabs. Banned: "pack", "flip", "red-team", "tracker", "session note", "Swap Shop", "Look up", "Carry on", "TL-OPS", "drop" as a noun.
- Whole-number output scale on every gameplay shot, no pushins: 16:9 and 1:1 at 1, 2 or 3; 9:16 at 0.5625, 1.125 or 1.6875. Lower zoom on NPC chats. Crop centres on whole source pixels (source 1920 x 1080).
- Every cut on the beat grid (b = 60 / 95 = 0.6316 s).
- The term in the title is defined in the topic shot in 12 words or fewer; one stated lesson; two picks, both cases of the same idea; the defend half opens a trick the first half showed.

## 1. The line of thought

r4 named Shadow IT, then listed three shortcuts with no consequence beside any of them, then spent five shots on a planted stick. The email's cost arrived 26 seconds after the email. This cut is one thread, in order:

1. **Cause.** Two staff at the kettle: "The file share's crawling again." (Joanne's kettle chatter, added for this hook at a5ff69226).
2. **Name and definition, together.** "Shadow IT: the shortcuts staff take that IT doesn't know about."
3. **The response.** Red card "Take the shortcut"; "So staff take a shortcut."
4. **Shortcut one, then its cost.** The client files go to a personal inbox. That inbox gets broken into, and IT never knew the copy existed.
5. **Shortcut two, then its cost.** An unknown device in a work laptop, even a USB stick (the visiting surveyor's own). Its program copied the folders it could reach.
6. **The attacker's side, two short shots.** "Attackers leave sticks to be found." The learner leaves an unlabelled stick by the kettle in the authorised test, and a colleague finds it: "Someone's dropped a memory stick. Whose is this?", played whole.
7. **Your turn.** Two more of the same kind arrive in the inbox: a free upload site and a stick in the post.
8. **The fix, in a cast member's words.** Nilesh: "That's shadow IT for you. If the official way's slow, tell us rather than building your own way round."
9. Close and CTA.

Cut from r4: Joanne's plug-in, Nilesh's "She was being kind", the free-app card, Fatima's found stick, v22 to v28, v18b, v15b. Joanne's found-stick line, which was r4's hook, moves to step 6, after the term is defined, so the trailer no longer opens on a stick nobody has explained. The planted stick is two shots (7.0 s) where r4 had five.

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
| 9a | 69-75 | 43.58-47.37 | 3.79 | attacker: the learner leaves an unlabelled stick by the kettle | `ATTACKER` / `YOUR AUTHORISED TEST` | **retake t11b** |
| 9b | 75-80 | 47.37-50.53 | 3.16 | found: Joanne picks it up, "Someone's dropped a memory stick. Whose is this?" | `ATTACKER` / `YOUR AUTHORISED TEST` | **retake t11b** (same take, later window) |
| 10 | 80-84 | 50.53-53.05 | 2.53 | blue card "Now it's your turn" | card | card text change |
| 11 | 84-94 | 53.05-59.37 | 6.32 | inbox: the list, then the posted-stick offer opened briefly; verbs and counter hidden | `YOUR TURN` / `YOUR INBOX` | **new take t06b** |
| 12 | 94-106 | 59.37-66.95 | 7.58 | Nilesh: "That's shadow IT for you. If the official way's slow, tell us rather than building your own way round." | `YOUR TURN` / `IT SERVICE DESK` | **retake t09c** |
| 13 | 106-116 | 66.95-73.26 | 6.32 | close | card | as r4 |

Total 116 beats = 73.263 s: 7 + 10 + 11 + 5 + 8 + 10 + 10 + 8 + 6 + 5 + 4 + 10 + 12 + 10. Every cut is on a whole beat and the end is on a bar. The music drop (b28, 17.684 s) is the cut into the red card, so "Take the shortcut" lands on it; beats 1 to 3 are untouched and every beat moved for 9b comes from after the drop (one each from beats 5, 11 and 13).

Joins: seam into and out of every card; hard cuts elsewhere, including 9a to 9b (the crop changes from the learner to Joanne, so it does not read as a jump cut). No glitch join.

Balance: first half (beats 4 to 9b) 32.8 s, your turn (10 to 12) 16.4 s. The email thread (red card, pick, cost) is 23 beats, 14.5 s. The stick thread (pick, cost, 9a, 9b) is 29 beats, 18.3 s: it comes last and is now the longer of the two, which is the price of showing the attack land (owner question 1).

## 3. Narrator VO

Estimate: clip = words / 2.33 + 0.15 s; ends = lead + clip. Gate = window - lead - 0.3, the longest clip that still clears the cut. Slow read = words x 0.495 s (the rate of the slowest cached clip, v17), with its slack against the gate. "Hacktivity.co.uk" counts as one word.

| id | Beat | Line | Words | Window (s) | w/s | Lead | Est. clip (s) | Ends (est.) | Margin | Gate | Slow read (slack) | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| v1 | 2 open | "Hacktivity Cyber Aware: Security awareness training you can play." | 9 | 6.32 | 1.42 | 0.2 | 5.112 (measured) | 5.31 | 1.01 | 5.82 | measured | cached (`Sulafat_v2/trim/v1.mp3`) |
| v30 | 3 topic | "Shadow IT: the shortcuts staff take that IT doesn't know about." | 11 | 6.95 | 1.58 | 0.2 | 4.87 | 5.07 | 1.88 | 6.45 | 5.45 (1.00) | **new** |
| v31 | 4 red card | "So staff take a shortcut." | 5 | 3.16 | 1.58 | 0.1 | 2.30 | 2.40 | 0.76 | 2.76 | 2.48 (0.28) | **new** |
| v32 | 5 email | "The client files go to a personal inbox." | 8 | 5.05 | 1.58 | 0.2 | 3.58 | 3.78 | 1.27 | 4.55 | 3.96 (0.59) | **new** |
| v33 | 6 email cost | "That inbox gets broken into. IT never knew the copy existed." | 11 | 6.32 | 1.74 | 0.2 | 4.87 | 5.07 | 1.25 | 5.82 | 5.45 (0.37) | **new** |
| v34 | 7 device | "An unknown device in a work laptop. Even a USB stick." | 11 | 6.32 | 1.74 | 0.2 | 4.87 | 5.07 | 1.25 | 5.82 | 5.45 (0.37) | **new** |
| v35 | 8 device cost | "Its program copied the folders it could reach." | 8 | 5.05 | 1.58 | 0.2 | 3.58 | 3.78 | 1.27 | 4.55 | 3.96 (0.59) | **new** |
| v36c | 9a attacker | "Attackers leave sticks to be found." | 6 | 3.79 | 1.58 | 0.1 | 2.73 | 2.83 | 0.96 | 3.39 | 2.97 (0.42) | **new** |
| v37 | 10 blue card | "Now it's your turn." | 4 | 2.53 | 1.58 | 0.1 | 1.87 | 1.97 | 0.56 | 2.13 | 1.98 (0.15) | **new** |
| v38 | 11 inbox | "A free upload site. A stick in the post. Your call." | 11 | 6.32 | 1.74 | 0.2 | 4.87 | 5.07 | 1.25 | 5.82 | 5.45 (0.37) | **new** |
| v11b | 13 close | "Take the shortcut here. See where it leads. Learn on Hacktivity.co.uk." | 11 | 6.32 | 1.74 | 0.2 | 4.87 | 5.07 | 1.25 | 5.82 | 5.45 (0.37) | **new** (v11 cached as the alternative, owner question 4) |

95 narrator words: 9 + 11 + 5 + 8 + 11 + 11 + 8 + 6 + 4 + 11 + 11. Every line clears its gate on the slow read. Beats 1, 9b and 12 carry no narration (cast lines).

Word counts, checked by hand for the lines that changed: v31 So / staff / take / a / shortcut (5); v32 The / client / files / go / to / a / personal / inbox (8); v33 That / inbox / gets / broken / into (5) + IT / never / knew / the / copy / existed (6) = 11; v35 Its / program / copied / the / folders / it / could / reach (8); v36c Attackers / leave / sticks / to / be / found (6).

Thin slack: v37 (0.15) and v31 (0.28). Cached clips of the same voice and shape run 1.42 to 1.73 s for 4 words (v15, v18, v21) and 2.47 s for 7 (v16), so both should fit; the one slow 4-word clip (v1c, 2.69 s) has a colon pause. Voice both at normal pace with no pause and measure before the edit list. If v37 measures over 2.13 s, drop it: the blue card already says the words.

Ids. No narrator clip exists for any id from v30 up (the cached set is v1 to v21, v1b, v1c, v5b, v2_r3), so v31, v32, v33 and v35 keep their ids with the revised texts and no id on disk carries two texts. The 6-word attacker line takes a new id, v36c, because v36 stays in use for Variant A's longer line (section 8). v11b keeps r4's id and text.

Cached clips reused: v1 only. Kept on disk and not used: v1c "This episode: Shadow IT." (2.688 s; owner question 5), v10, v11 (5.760 s, the series tagline), v15 to v21, v2_r3.

Voicing notes. v30: a short pause after "Shadow IT", then level. v31 flat, a shrug, no pause. v32 plain statement. v33 and v35 are the costs: plain, no menace. v34: a pause before "Even". v36c level, stress on "found". v37 no pause. v38: three short items, "Your call" as a hand-over.

Truth checks, against the episode at 36378d2a7:

- **v30:** the brief (erb :657) and Nilesh (ink :68) say shadow IT is work on "devices, apps, accounts or services that IT doesn't know about or hasn't approved, usually as a shortcut". The scope note (erb :560) says "the shortcuts staff take round IT". The definition part is 9 words.
- **v31:** follows the hook's "The file share's crawling again." (erb :1583) and card 1, "The share has crawled to a halt" (erb :578). It states the response; the cause is the hook.
- **v32:** card 1, `send_personal`: "Send the client files to your personal email to finish at home" (erb :588).
- **v33:** "Months on, the personal inbox was broken into. The client files were still in its sent items, and IT had never known the copy was there, so nobody could protect it or take it back." (erb :691). The page and the line now say the same thing.
- **v34:** card 3, "Plug the visitor's USB stick into your work laptop" (erb :616). "Unknown device" is the episode's term (erb :55, :1671; ink :85). "Untrusted" and "on the work network" appear nowhere in the episode (owner question 6).
- **v35:** "It carried a program that ran on yours and copied the folders it could reach" (erb :699). The line uses the page's own "the folders".
- **v36c:** the concept panel, "Whoever leaves a stick to be found gets a way onto a work machine" (erb :671) and "A stick left to be found is often set to run the second it's plugged in" (erb :675). "Leave" is the episode's verb throughout. The line describes the picture under it and makes no claim about the visitor's stick, which nobody planted (it "had been in three other firms' laptops first", erb :699).
- **v38:** inbox items "Too big for email? Upload it here, free" (erb :360) and the Benmoor stick, "we've posted you a branded USB stick" (erb :408). It names two kinds of item and says nothing about which are safe. Both named items happen to be the risky kind and neither safe row is named; that is a judged exception, kept at pattern level, and not to be reopened.
- **v11b:** "here" puts the shortcut inside the game.

Burned captions (28 or fewer a line):

- Hook, 9:16 only: "The file share's / crawling again." (16 / 15; the line is 32 characters, so it takes two)
- v30 "Shadow IT: the shortcuts / staff take that IT / doesn't know about." (24 / 18 / 19), held for the whole of the line
- v31 "So staff take a shortcut." (25)
- v32 "The client files go / to a personal inbox." (19 / 20)
- v33 A: "That inbox gets broken into." (28). B: "IT never knew the copy / existed." (22 / 8)
- v34 A: "An unknown device / in a work laptop." (17 / 17). B: "Even a USB stick." (17)
- v35 "Its program copied the / folders it could reach." (22 / 23)
- v36c "Attackers leave sticks / to be found." (22 / 12)
- 9b, 9:16 only: "Someone's dropped a memory / stick. Whose is this?" (26 / 21)
- v38 A: "A free upload site." B: "A stick in the post." C: "Your call."
- No burned caption for v1, v37 and v11b: the open, blue and close cards carry the words.

In 9:16 and 1:1 the panel text in beats 3, 5, 6, 7, 8 and 11 is 18 px or smaller on a 1080-wide frame, so in those formats the burned caption carries the beat and the panel is texture.

Cards: red "Take the shortcut" (17); blue "Now it's your turn" (18); close "Take the shortcut here ·" (24) over "See where it leads", plate "Learn on Hacktivity.co.uk" (series tagline card "Take the shortcut ·" if question 4 keeps v11).

Chips: `THE OFFICE`, `WHAT IS SHADOW IT?` (18), `PERSONAL EMAIL`, `SIX MONTHS LATER`, `A VISITOR'S USB STICK` (21), `YOUR AUTHORISED TEST` (20), `YOUR INBOX`, `IT SERVICE DESK`. Tabs `SHORTCUT`, `ATTACKER`, `YOUR TURN`. The "YOUR" on the attacker chip keeps the point that the learner is the one leaving the stick, now that the VO no longer says "Here, you do."

## 4. Character lines

| Beat | Speaker | Line | Caption | Source | Audio |
|---|---|---|---|---|---|
| 1 hook | Joanne (kettle chatter) | "The file share's crawling again." | 16:9 and 1:1: her bubble carries it. 9:16: burned, as above | erb :1583, third line of Joanne's `ca15_kettle` pool (a5ff69226, dialogue-reviewed) | cached, `tts_cache/ca15_shadow_it/feba2d607d58151d92fde440a24a6968.mp3`, 1.872 s. Lay the clip in at the bubble's first frame (1.0 s into the shot, ending 2.87 s in, 1.55 s before the cut), take audio muted |
| 9b found | Joanne | "Someone's dropped a memory stick. Whose is this?" | 16:9 and 1:1: her bubble carries it, whole. 9:16: burned, as above | erb :1596, bark on `npc_picked_up:ca15_red_stick` | cached, `tts_cache/ca15_shadow_it/570745991c46ff0775faec32350e5944.mp3`: 3.144 s, speech 0.00 to 1.64 and 2.15 to 2.78 (silencedetect -40 dB, re-measured 27 Nov) |
| 12 nilesh | Nilesh | "That's shadow IT for you. If the official way's slow, tell us rather than building your own way round." | A: "That's shadow IT for you." (25). B: "If the official way's slow, / tell us rather than building / your own way round." (27 / 28 / 19) | ink :65, after the sort is complete | voiced at c784c780a; length to be measured on t09c. The old 17-word line on t09b ran 5.748 s (0.338 s a word), so expect 6.4 to 6.7 s for 19 |

**Beat 9b timing, measured.** On `t11_red_drop_run` the found-stick bubble is up from 42.824 to 45.525 by the marks (2.70 s), and it ends only because Joanne's PC line replaces it. The cached clip's last word ends 2.78 s after its start, so the line cannot finish under its own bubble on that take; t11b holds Joanne's next action so the bubble stays. In the shot: in = `find_bubble` - 0.05, take audio muted, cached clip laid in at 0.05 s (the bubble's first frame). Speech runs 0.05 to 1.69 and 2.20 to 2.83; the cut is at 3.16, so the line ends 0.33 s before it. These are measured figures, not estimates. The bubble (47 characters) is on screen for 3.11 s.

**Beat 12 timing.** W = 7.58 s (12 beats). In = `line_start` - 0.2. On t09b Nilesh's next line ("And nobody gets told off for asking.") starts 0.723 s after this one ends, so a fixed out point would catch its first syllable whenever the line runs under 6.66 s. Rule:

> out = min(`line_start` + W - 0.2, `line_end` + 0.65), then hold the last frame (mouth closed, portrait up, no subtitle of the next line) to the cut.

The freeze is at most about 0.5 s on a still portrait. The line must end 0.3 s before the cut, so it fits 12 beats up to L = 7.08 s. For reference, the length L each window takes without a freeze:

| Beats | W | L without a freeze | With the freeze rule |
|---|---|---|---|
| 11 | 6.95 | 6.03 to 6.45 | up to 6.45 |
| 12 (scripted) | 7.58 | 6.66 to 7.08 | up to 7.08 |

If L measures over 7.08 s: lead 0.1 covers up to 7.18. Beyond that, beat 12 takes a beat from beat 11 (9 beats, 5.68 s), and v38 gives way to v38f "Free uploads, sticks by post. Your call." (7 words, est. clip 3.15, gate 5.18, slow read 3.47).

## 5. Shot list and framing

Takes live in `~/video-takes-local/ca15/takes/`. Retakes run with the standard ca15 flags (`--hide-hud --zoom-step 1`) **from this branch** (cf31e6c5d, 8dabd5955 and 36378d2a7 are not on main). Zoom is 16:9 / 9:16 / 1:1; cx and cy are fractions of the 1920 x 1080 source with the pixel in brackets. Crop sizes: 16:9 zoom 2 is 960 x 540, zoom 3 is 640 x 360; 9:16 at 1.125 is 960 wide, at 1.6875 640 wide; 1:1 zoom 2 is 540 square, zoom 1 is 1080 square.

| # | Shot | Take and window | Zoom and crop | On-screen text to check |
|---|---|---|---|---|
| 1 | hook | **t19_kettle_hook** (new): ops room, no stick dropped, Joanne and Niamh at the kettle, Joanne's pool line forced to "The file share's crawling again." Mark `share_bubble` on its first frame; in = mark - 1.0, out + 4.42 (out = mark + 3.42, inside the 3.8 s bubble life measured for a kettle line on t11). No footage fallback for the final cut. Stand-in for review renders only: t11_red_drop_run in 37.20, out 41.62 (bubble "Printer's jammed again." up from about 37.60 to 41.40, last frame clean), clip laid in at 0.4 s | t19: 2 / 1.6875 / 2, crop centred on the pair and the whole bubble, measured on the take. Stand-in: 1 / 0.5625 / 1, 1:1 cx 0.5729 (1100) | No other bubble in the 1.0 s before the mark or in the window ("Printer's jammed again.", "Is the Shipley run late again?", "Kettle's on, want one?" and "Who's nicked the big mug?" all fire in this room). The stand-in shows the printer line, the learner and the dropped stick at her feet, which is why it is not a fallback |
| 2 | open | card | none | none |
| 3 | topic | **t17_brief** (new): kiosk opened on the Brief. Mark `brief_shown`; in = mark + 0.1, out + 6.95; the take holds 8.0 s. No fallback: the only existing panel take (t03b) shows the Everyday choices intro, which has no definition and a "Make the choices" button | 2 / 1.125 / 1 if the Brief panel, frame included, is 540 px tall or less on t17, cx 0.50 (960), cy 0.50 (540); otherwise 1 / 1.125 / 1. Write the measured height and the choice into the edit list notes. 9:16 cx 0.5 | The brief reads "...shadow IT: staff using devices, apps, accounts or services that IT doesn't know about or hasn't approved, usually as a shortcut." and ends "Only the inbox is scored": not a score, keep. The panel and v30's caption give two true wordings of one definition; if frames look crowded at zoom 2, use zoom 1 and let the caption lead. Assert the text contains "shadow IT" and no `\bpack\b` |
| 4 | red card | card "Take the shortcut" | none | none |
| 5 | email | **t16_shortcuts**: card 1, `send_personal` picked. In = `c1_pick` - 2.6; out + 5.05. The card reads for 2.6 s, the click falls under "to a personal inbox" (the phrase starts near 2.4 s), and the picked option holds 2.45 s | 1 / 1.125 / 1, 9:16 cx 0.5 (the 716 x 632 px panel does not fit a zoom 2 crop) | Card 1 says "client files" and "The share has crawled to a halt". "Choice N of 4" header hidden. No "Your call" tag, mark or verdict colour after the pick |
| 6 | email cost | t16_shortcuts: "Six months later" with card 1's consequence only. In = `reveal_email`; out + 6.32 | 2 / 1.125 / 1; 16:9 cx 0.50 (960), cy 0.50 (540), **only if the page still fits**: on t03c the 754 x 508 px page fitted a 540 px crop with 16 px spare, and the consequence text is now about 20 words longer. Measure the page on t16; if it is over 540 px tall use 1 / 1.125 / 1 | Per-choice labels and tags hidden with `hideText`. The body must read "IT had never known the copy was there" and must not read "reused password" (take assert) |
| 7 | device | t16_shortcuts: card 3, `plug_visitor` picked. In = `c3_pick` - 3.2; out + 6.32. The click falls under "Even a USB stick" | 1 / 1.125 / 1, 9:16 cx 0.5 | The option reads "Plug the visitor's USB stick into your work laptop". Header hidden; checks as beat 5 |
| 8 | device cost | t16_shortcuts: "Six months later" with card 3's consequence only. In = `reveal_stick`; out + 5.05 | as beat 6, measured on t16 | Body as erb :699 |
| 9a | attacker | **t11b_drop**: in = `drop_land` - 2.40, out + 3.79. On t11's timings that is 1.5 s of walking, the menu for 0.7 s, the stick landing 2.40 s in and 1.39 s after it. Fallback, existing: t11_red_drop_run in 30.88, out 34.67 (`menu_open` 32.42, `drop_click` 33.12, `drop_land` 33.275) | t11b: 2 / 1.6875 / 2, cx 0.50 (960) in all three, cy 0.5704 (616) in 16:9 and 1:1, rechecked on the take; in 9:16 check frames for the inventory bar and the top void and mask or drop to 1.125 if either shows. t11 fallback: a chatter bubble ("Who's nicked the big mug?", x 1152 to 1552, y 440 to 497) is up from 33.50, the last 1.17 s of the window, and a crop at cx 960 cuts it in half. Use 16:9 zoom 2 cx 0.6458 (1240), crop 760 to 1720; 9:16 at 1.6875 cx 1240, crop 920 to 1560 (if the stick touches the left edge, cx 1230); 1:1 zoom 2 cx 0.4531 (870), crop 600 to 1140, cy 616 (if Joanne's sleeve shows at the right edge, cx 860) | t11b: the menu header reads "Unlabelled USB stick", plain, no mask; no bubble in the window (take assert). t11 fallback: the header reads RED-TEAM STICK; flat box `{x:920,y:765,w:115,h:30}` from take 32.35 to 33.20, unchanged by the new centres; frames 34.42 to 34.67 carry no toast, panel or item name |
| 9b | found | **t11b_drop**, later window: in = `find_bubble` - 0.05, out + 3.16. Take audio muted; cached clip at 0.05 s (section 4). Fallback, existing: t11_red_drop_run in 42.19, out 45.35 (bubble up at 42.82, 0.63 s in, and whole to the cut), with the clip laid in at 0.08 s so the line ends 0.30 s before the cut. In the fallback the voice leads the bubble by 0.55 s; Joanne is already at the stick. Retake preferred | t11b: 2 / 1.6875 / 2 centred on Joanne and the whole bubble, whole-pixel centre measured on the take, valid only because the take holds her in place. If the hold cannot be scripted she walks about 740 px in 2.4 s: use 1 / 0.5625 / 1. t11 fallback: 1 / 0.5625 / 1, 1:1 cx 0.4792 (920), as r4's hook window, which contains this one; about 11 percent black on the right in 16:9 (owner question 7) | Bubble text whole in every format's crop. No toast, objectives panel or item name ("Picked up..." toasts name the kit on t11 after 45.68, outside the window). The next bark ("I'll just plug it in...") must not replace the bubble before the cut |
| 10 | blue card | card "Now it's your turn" | none | none |
| 11 | inbox | **t06b_inbox_list** (new): in = `list_shown` + 0.10; out + 6.32. The list holds for 4.5 s of the shot, then the Benmoor message opens (`row_usb`) for the last 1.82 s. "A free upload site." and "A stick in the post." both fall over the list, where both subjects can be read; "Your call." falls as the message opens. Fallback, existing: t06 in 2.20, out 6.62, the list only (7 beats, 4.42 s); the close takes the other 3 beats, and v38 is replaced by v38f (7 words, gate 3.92, slow read 3.47, slack 0.45) | 1 / 1.125 / 1, 9:16 cx 0.5 (the panel is 480 to 1436 px of a 480 to 1440 crop) | Hidden by the take: the verb row, the advice text, the "0 of 6 sorted" counter and bar. Expected and fine: the header strip "Shadow IT: the shortcuts" with tabs "1 Brief, 2 Sort, 3 Review, 4 Result", and the sender "Benmoor Packaging". The opened message is the lure in full; it is on screen for 1.82 s, long enough to register as a message and too short to read through. Frame check at `row_usb` + 0.5 for anything that reads as a tell. t06 fallback: box the counter `{x:430,y:100,w:440,h:62}` for the whole shot; its fileshare row is the stale "Mo...", truncated, usable; the reading pane says "Select a message to read it." |
| 12 | nilesh | **t09c_nilesh_tell_it** (retake of t09b on this branch, same seeding: sort complete, then talk). In = `line_start` - 0.2; out and freeze by the rule in section 4. Stand-in for review renders only: t09b in 9.03, out 15.35 at 10 beats; its first words are the old "That's the lot." | 1 / 1.125 / 1. 9:16 cx 0.6396 (1228); 1:1 cx 0.6448 (1238), as r4's Nilesh shot, rechecked on t09c | Portrait and burned captions. Masks in all three formats: the subtitle bar (y 850 to 1080, the part inside each crop), which covers "Skip", and in 16:9 `{x:1860,y:0,w:60,h:60}`. If the 1:1 or 9:16 crop is later moved so the bar falls outside it, say so in the edit list. The next line's subtitle, audio and mouth movement must not appear before the cut |
| 13 | close | card: Shadow IT / "Take the shortcut here ·" over "See where it leads" / plate "Learn on Hacktivity.co.uk" | none | none |

Never on screen: choice verdicts, "Your call" tags, inbox verbs, advice text, tallies ("0 of 6 sorted"), scores, the debrief, the Monday card, the habit line as kiosk text, the session note, the item name "Red-team stick".

## 6. Takes

All on this branch.

**Required (six scripts):**

| Take | Covers | Must show | Marks |
|---|---|---|---|
| t19_kettle_hook | beat 1 | Ops room, nothing dropped, the learner out of the crop. Force the line: before the kettle pair forms, prime `window.npcNeedsSystem._bags` key `ca15_joanne_pell|ca15_kettle` with order `[2]` (the line is index 2 of her pool; `_bagNext`, npc-needs.js :2930). Which of the pair speaks first is a seeded roll, so prime Niamh's bag as well if the framing needs a set order, and retry the seed if Niamh speaks first. Assert the bubble text equals erb :1583 and the speaker is Joanne; no other bubble from 1.0 s before the mark to 3.5 s after it; hold 4.0 s after the bubble starts | `share_bubble` |
| t17_brief | beat 3 | Kiosk open on the Brief, static, 8.0 s. Assert "shadow IT" present and no `\bpack\b`. Record the panel's height in the take notes | `brief_shown` |
| t16_shortcuts | beats 5 to 8 | Fresh game. Kiosk, Everyday choices, header "Choice N of 4" hidden from the first card. Card 1: hold 2.8 s, pick `send_personal`, hold 4.0 s. Card 2: either, off window. Card 3: hold 3.4 s, pick `plug_visitor`, hold 3.5 s. Card 4: either, off window. "See where they led"; dismiss the step-away panel off camera (as `t03c_flip_one.mjs`). Show card 1's consequence only (others hidden by `data-beat`), hold 7.0 s; then card 3's only, hold 6.0 s. Asserts, any failure fails the take: card 1 contains "client files"; card 3 contains "USB stick"; card 1's consequence contains "never known the copy was there" and does not contain "reused password"; no text matches `\bpack\b`; no verdict tag or colour shows while a card holds. Record the consequence page's height for each of the two reveals | `c1_pick`, `c3_pick`, `reveal_email`, `reveal_stick` |
| t11b_drop | beats 9a and 9b | The t11 opening, then the find, in one take. Kettle-pair chatter suppressed from `menu_open` until the find; assert no bubble element between `menu_open` and `drop_land` + 2.0. Menu header reads "Unlabelled USB stick" (assert). After Joanne picks the stick up, hold her where she stands and delay her PC use until `find_bubble` + 3.6, so the found-stick bubble is not replaced and does not travel; assert the bubble text equals the erb :1596 bark, is on screen for at least 3.4 s from its first frame, and no other bubble shows from `find_bubble` - 0.5 to + 3.4. No toast or objectives panel in either window. If the bubble's own life is under 3.2 s, stop and report | `menu_open`, `drop_click`, `drop_land`, `find_bubble`, `find_bubble_end` |
| t06b_inbox_list | beat 11 | The t06 script with the verb row, advice text and counter hidden by CSS before the list appears; list held 4.6 s; Benmoor row opened, held 2.5 s. Assert none of the hidden parts shows from `list_shown` to + 7.1 and that the intro page has gone. Assert the fileshare row's subject contains "Client files for Monday". Assert no `\bpack\b` in any row's subject or preview text (not the sender column: "Benmoor Packaging" is a sender and must not trip it). Save a frame at `row_usb` + 0.5 for the tell check | `list_shown`, `row_usb` |
| t09c_nilesh_tell_it | beat 12 | t09b's seeding; the new first line, whole; menu hidden. Assert the line text equals ink :65. Hold at least 8.0 s after `line_start` | `line_start`, `line_end`, `next_line_start` |

**Fallbacks on existing takes (no new recording):**

| Beat | Existing take and window | What it costs |
|---|---|---|
| 9a | t11_red_drop_run 30.88 to 34.67, mask box, crops cx 1240 / 1240 / 870 | stale menu header under a mask; a chatter bubble in the last 1.17 s |
| 9b | t11_red_drop_run 42.19 to 45.35, zoom 1 | the voice leads the bubble by 0.55 s; black edge in 16:9 |
| 11 | t06_inbox_list 2.20 to 6.62, counter boxed, v38f | list only, 7 beats; the close grows to 13 |

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
| O1 attacker method | 2 | The learner drops the stick, it lands, and someone picks it up |
| O2 attacker reasoning | 3 | "Attackers leave sticks to be found", then Joanne's helpful "Whose is this?": the kindness the concept panel names |
| O4 tone | 3 | "staff", a slow file share as the cause, Nilesh's "tell us"; no blame |
| P1 practice | 2 | The inbox, with two more of the same kind; answers off screen |
| A1 accuracy (gate) | pass | Reordered for clarity: each cost follows its pick, and the attacker's side moves from before the reveal to after it. In the game all four costs share one page |
| A2 safe takeaway (gate) | pass | Pattern level; authorised test on the chip; the lesson is "tell IT" |

17 of 21. Scored against this script as written; the scores for O1, O2 and F4 depend on 9b.

**Variant A (one attacker shot), the alternative for owner question 1.** Beat 9 is a single 8-beat shot (5.05 s) of the drop: t11b in = `drop_land` - 3.28, out + 5.05, with v36 "Attackers leave sticks to be found. Here, you do." (9 words, lead 0.1, est. clip 4.01, ends 4.11, margin 0.94, gate 4.65, slow read 4.46, slack 0.19). Captions A "Attackers leave sticks / to be found." B "Here, you do." (13). Beats 5, 11 and 13 go back to 9, 11 and 11 beats: 7 + 10 + 11 + 5 + 9 + 10 + 10 + 8 + 8 + 4 + 11 + 12 + 11 = 116. v32, v38 and v11b keep their texts with wider windows (5.68, 6.95, 6.95 s); the opened Benmoor message then holds 2.45 s. The chip reverts to `AUTHORISED TEST`. Nobody finds the stick: O1 2 to 1, O2 3 to 2, F4 3 to 2, total 14. The stick thread is 26 beats against the email's 24. Narrator total 98 words.

**Variant B (found-stick hook), the literal reading of the owner's note, not recommended.** Open on Joanne's line as r4 did and pay it off with her at her PC. It opens the trailer on a planted stick before the term is named, which is the confusion the owner described.

## 9. Episode text changes requested

Scenario and ink files are untouched by this script.

| # | File:line | Old | New | State |
|---|---|---|---|---|
| 1 | `scenarios/ca15_shadow_it/scenario.json.erb:691` (`send_personal` consequence) | "...broken into with a reused password; the client files sat in its sent items..." | "Months on, the personal inbox was broken into. The client files were still in its sent items, and IT had never known the copy was there, so nobody could protect it or take it back. The client got a convincing fake invoice built from them." | **made**, 36378d2a7 |
| 2 | same file `:692` (`ask_nilesh`) | "...broken into with a reused password and the files were copied." | "...that inbox was broken into, and IT never knew a copy was there to protect." | **made**, 36378d2a7 |
| 3 | same file `:5` and `:657` (the two briefs) | `:5` ended "Only the sort is scored." | both end "Only the inbox is scored." | **made**, 36378d2a7 |
| 4 | same file `:1580-1584`, Joanne's `ca15_kettle` chatter pool (the defend-only twin has no kettle pool, so no mirror) | lines: "Kettle's on, want one?", "Who's nicked the big mug?" | third line added: "The file share's crawling again." | **made**, a5ff69226 (dialogue-reviewed, voiced). The hook, v31 and the 9:16 hook caption are written on it |

Row 1 made the consequence about 20 words longer; beats 6 and 8 re-measure the page before fixing the zoom (section 5). If the page no longer fits a 540 px crop and zoom 2 matters, the clause "so nobody could protect it or take it back" could go without hurting v33; that would be a further episode change and is not requested here.

No change is needed for v34: it uses "unknown device" and "work laptop", both in the episode.

## 10. Open questions for the owner (via AC0)

1. **The attacker's side and the found-stick line: C or A.** The owner's note on the r1 hook was "extend the opening bubble to the whole line". Default here (C): Joanne's line plays whole, as the payoff of the attacker's side at 47 s, after the term has been defined; the hook is the slow-share grumble. Alternative (A, section 8): one shot of the drop with "Here, you do." and no find, which keeps the stick thread shorter than the email's and scores 14 against 17. Recommended: C. Variant B (the line as the hook again) is the literal reading of the note and is not recommended.
2. **Keep the attacker's side at all.** Default: keep. It is the course's selling point and the only place the learner acts as the attacker. Cutting it would hand 11 beats to beats 11 and 12.
3. **Nilesh's closing line as the stated lesson.** "If the official way's slow, tell us rather than building your own way round" is advice. The house rule keeps advisory lines off screen; this is the one exception. Suggested wording for the rule: "One stated lesson, spoken by a cast member in the episode's own words, never by the narrator and never as kiosk text." Confirm.
4. **The close tagline (carried from r4 Q4).** Default v11b "Take the shortcut here. See where it leads." Straight after Nilesh says to tell IT, the series tagline v11 "Take the shortcut, see where it leads." (cached, 5.760 s; in the 10-beat close it ends 5.96 with lead 0.2, margin 0.36) reads as the opposite advice.
5. **v1c retired.** "This episode: Shadow IT." (cached) is replaced by v30, which names and defines in one sentence; the open card has already shown the title.
6. **"Unknown device in a work laptop" for the owner's "untrusted devices on business networks".** The episode says "unknown device" and never says "untrusted" or "network", and the picture shows a laptop. Default: the episode's words in VO. If the owner wants "untrusted" seen, the chip can say it with no episode change: `AN UNTRUSTED USB STICK` (22) in place of `A VISITOR'S USB STICK`.
7. **Black edge in 16:9 (carried from r4 Q5).** Applies only if 9b falls back to the existing t11 window at zoom 1.
8. **The opened lure in beat 11.** The Benmoor message is a whole worked lure. It is on screen for 1.82 s at zoom 1, which is not long enough to read through. If the owner would rather it never opened, beat 11 holds the list for all 10 beats on the same take.

For the integrator, not the owner: the defend-only twin (`ca15_shadow_it_defend`) has no "tell us" line in Nilesh's ink and no kettle pool. If this trailer also fronts the twin on a course page, beats 1, 9 and 12 show things that variant does not contain.

## 11. Lines to voice

Narrator, 10 new: v30, v31, v32, v33, v34, v35, v36c, v37, v38, v11b, after the script review rounds and the `npc-dialog-review` wording check. Voice with `tools/video/scripts/narrate.rb`, trim with `trim_vo.py` and the `LINES_v2.md` gain pass, then measure each against its gate. Variant A adds v36; the beat 11 fallback and the beat 12 reserve add v38f. Cast: nothing to voice.

## 12. R1 dispositions

"Sell" is `ca15_trailer_script_r5_review_R1_sell.md` (03d39567c); "Timing" is `ca15_trailer_script_r5_review_R1_timing.md` (36eca5f3d).

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

## Sources

NCSC "Shadow IT" guidance (read 26 Nov, as r3 section 7) for the definition and for the cause: staff struggling with sanctioned tools. Review B (`tmp/handover/ac0/ca_trailer_script_review_B.md`, ca15 section and recurring patterns 1 to 4 and 7) for the structure. The R3 timing review of r4 for the beat 9 mask rectangle and the stale-take list. Measurements made for this revision: the cached bark clip (ffprobe and silencedetect) and the bubble marks in `t11_red_drop_run.trimmed.markers.json`. Frame measurements on existing takes are the timing reviewer's, not re-pulled here.
