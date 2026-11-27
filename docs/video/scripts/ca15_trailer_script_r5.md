# ca15 trailer script, owner round r2, r5 restructure (Shadow IT): cause, shortcut, cost, fix

File r5. `ca15_trailer_script_r4.md` stays as it is; this file replaces its structure and reuses its measured windows, masks and clip lengths wherever a shot survives.

Owner's verdict on the r1 cut (27 Nov): "Two relevant points -- emailing business info to personal email, and USB/device caution -- both are Shadow IT, but this trailer presents a very confusing train of half-concepts. Made even more confusing by the use of unusual terms like 'pack'. Restructure this to explicitly mention shadow IT, and the short cuts staff take -- including use of untrusted devices on business networks, even USB sticks can be a danger." The owner picked option (a): the episode text and the trailer tell the same story. The episode fix is in (cf31e6c5d, then the dialogue review 8dabd5955), on this branch only.

Status: script, 27 Nov, not yet reviewed. No edit list. Target 73.263 s (116 beats, 29 bars), the r3 music window unchanged.

House rules in force:

- Narrator VO (Sulafat, the ca15 style) at most 3.0 words a second; every line ends at least 0.3 s before its cut; no em or en dashes in VO. No narrator over a character line and none while verdict buttons are on screen.
- Cards and burned captions at most 28 characters a line. UK English, "Cyber Security" as two words. No "Break Escape" on screen. Close plate "Learn on Hacktivity.co.uk".
- No answers, tells, tallies, scores or verdicts on screen or in VO. The one stated lesson is Nilesh's own line in beat 12 (owner question 3).
- No in-game terms in VO, cards, chips or tabs. Banned: "pack", "flip", "red-team", "tracker", "session note", "Swap Shop", "Look up", "Carry on", "TL-OPS", "drop" as a noun.
- Whole-number output scale on every gameplay shot, no pushins: 16:9 and 1:1 at 1, 2 or 3; 9:16 at 0.5625, 1.125 or 1.6875. Lower zoom on NPC chats. Crop centres on whole source pixels (source 1920 x 1080).
- Every cut on the beat grid (b = 60 / 95 = 0.6316 s).
- The term in the title is defined in the topic shot in 12 words or fewer; one stated lesson; two picks, both cases of the same idea; the defend half opens a trick the first half showed.

## 1. What changed from r4, and why

r4 named Shadow IT, then listed three shortcuts with no consequence beside any of them, then spent five shots (the hook, the found stick, the plug-in, the drop, Nilesh on kindness) on a planted stick. The email's cost arrived 26 seconds after the email. r5 is one line of thought, in order:

1. **Cause.** An office where the kit is slow ("Printer's jammed again.", then "The file share is slow.").
2. **Name and definition, together.** "Shadow IT: the shortcuts staff take that IT doesn't know about."
3. **Shortcut one, then its cost.** The client files go to a personal inbox. That inbox gets broken into, and IT never knew the copy was there.
4. **Shortcut two, then its cost.** An unknown device in a work laptop, even a USB stick (the visiting surveyor's own). Its program copied every folder it could reach.
5. **The attacker's side, one shot, one line.** "Attackers count on that. Here, you plant one." The learner leaves an unlabelled stick in the authorised test.
6. **Your turn.** The same two tricks arrive in the inbox: a free upload site and a stick in the post.
7. **The fix, in a cast member's words.** Nilesh: "That's shadow IT for you. If the official way's slow, tell us rather than building your own way round."
8. Close and CTA.

Cut from r4: the Joanne hook and her plug-in (beats 1 and 9), the found-stick shot (8), Nilesh's "She was being kind" (11), the free-app card (6), Fatima's found stick (15), v22 to v28, v18b, v15b. The planted stick is down from five shots to one, and it is framed as the same habit seen from the other side. The visitor's stick (pick and cost) runs 11.4 s against 15.2 s for the email thread (red card, pick, cost), and comes after it.

The lost-visibility point replaces the reused password as the email's cost in VO. The consequence page still names the password; section 9 asks for an episode text change so the picture says the same.

## 2. Shape

Seat tabs: `SHORTCUT` (red, beats 5 to 8), `ATTACKER` (red, beat 9), `YOUR TURN` (blue, beats 11 and 12). Purple stripe `#6b4c9a` on every seat label.

| # | Beats | Time (s) | Dur | Beat | Seat / chip | Footage |
|---|---|---|---|---|---|---|
| 1 | 0-7 | 0.00-4.42 | 4.42 | hook: two staff at the kettle, "Printer's jammed again." | full / `THE OFFICE` | new take t19 preferred; existing t11 window as fallback |
| 2 | 7-17 | 4.42-10.74 | 6.32 | open: Shadow IT / Tarrowby Logistics | card | exists |
| 3 | 17-28 | 10.74-17.68 | 6.95 | topic: the kiosk brief, whose text now defines shadow IT | full / `WHAT IS SHADOW IT?` | **new take t17** |
| 4 | 28-33 | 17.68-20.84 | 3.16 | red card "Take the shortcut", on the music drop (b28) | card | exists |
| 5 | 33-42 | 20.84-26.53 | 5.68 | email: card 1, the personal-email option picked | `SHORTCUT` / `PERSONAL EMAIL` | **retake** (t16) |
| 6 | 42-52 | 26.53-32.84 | 6.32 | email cost: "Six months later", card 1's consequence only | `SHORTCUT` / `SIX MONTHS LATER` | **retake** (t16) |
| 7 | 52-62 | 32.84-39.16 | 6.32 | device: card 3, the visitor's USB stick option picked | `SHORTCUT` / `A VISITOR'S USB STICK` | **retake** (t16) |
| 8 | 62-70 | 39.16-44.21 | 5.05 | device cost: "Six months later", card 3's consequence only | `SHORTCUT` / `SIX MONTHS LATER` | **retake** (t16) |
| 9 | 70-78 | 44.21-49.26 | 5.05 | attacker: the learner leaves an unlabelled stick by the kettle | `ATTACKER` / `AUTHORISED TEST` | retake t11b preferred; existing t11 with a mask as fallback |
| 10 | 78-82 | 49.26-51.79 | 2.53 | blue card "Now it's your turn" | card | card text change |
| 11 | 82-93 | 51.79-58.74 | 6.95 | inbox: the list, then the posted-stick offer opened; verbs and counter hidden | `YOUR TURN` / `YOUR INBOX` | **new take t06b** |
| 12 | 93-105 | 58.74-66.32 | 7.58 | Nilesh: "That's shadow IT for you. If the official way's slow, tell us rather than building your own way round." | `YOUR TURN` / `IT SERVICE DESK` | **retake t09c** |
| 13 | 105-116 | 66.32-73.26 | 6.95 | close | card | as r4 |

Total 116 beats = 73.263 s: 7 + 10 + 11 + 5 + 9 + 10 + 10 + 8 + 8 + 4 + 11 + 12 + 11. Every cut is on a whole beat and the end is on a bar. The music drop (b28, 17.684 s) is the cut into the red card, so "Take the shortcut" lands on it.

Joins: seam into and out of every card; hard cuts elsewhere. No glitch join (r4's reveal is gone).

Balance: first half (beats 4 to 9) 31.6 s, your turn (10 to 12) 17.1 s. The email thread is 24 beats, the visitor's stick 18, the attacker's side 8.

## 3. Narrator VO

Estimate: clip = words / 2.33 + 0.15 s; ends = lead + clip; lead 0.2 s unless stated. Gate = window - lead - 0.3, the longest clip that still clears the cut. Slow read = words x 0.495 s (the rate of the slowest cached clip, v17), with its slack against the gate. "Hacktivity.co.uk" counts as one word.

| id | Beat | Line | Words | Window (s) | w/s | Est. clip (s) | Ends (est.) | Margin | Gate | Slow read (slack) | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| v1 | 2 open | "Hacktivity Cyber Aware: Security awareness training you can play." | 9 | 6.32 | 1.42 | 5.112 | 5.31 | 1.01 | measured | measured | cached (`Sulafat_v2/trim/v1.mp3`) |
| v30 | 3 topic | "Shadow IT: the shortcuts staff take that IT doesn't know about." | 11 | 6.95 | 1.58 | 4.87 | 5.07 | 1.88 | 6.45 | 5.45 (1.00) | **new** |
| v31 | 4 red card | "The file share is slow." | 5 | 3.16 | 1.58 | 2.30 | 2.50 | 0.66 | 2.66 | 2.48 (0.18) | **new** |
| v32 | 5 email | "So the client files go to a personal inbox." | 9 | 5.68 | 1.58 | 4.01 | 4.21 | 1.47 | 5.18 | 4.46 (0.72) | **new** |
| v33 | 6 email cost | "That inbox gets broken into. IT never knew the copy was there." | 11 | 6.32 | 1.74 | 4.87 | 5.07 | 1.25 | 5.82 | 5.45 (0.37) | **new** |
| v34 | 7 device | "An unknown device in a work laptop. Even a USB stick." | 11 | 6.32 | 1.74 | 4.87 | 5.07 | 1.25 | 5.82 | 5.45 (0.37) | **new** |
| v35 | 8 device cost | "Its program copied every folder it could reach." | 8 | 5.05 | 1.58 | 3.58 | 3.78 | 1.27 | 4.55 | 3.96 (0.59) | **new** |
| v36 | 9 attacker | "Attackers count on that. Here, you plant one." | 8 | 5.05 | 1.58 | 3.58 | 3.68 (lead 0.1) | 1.37 | 4.65 | 3.96 (0.69) | **new** |
| v37 | 10 blue card | "Now it's your turn." | 4 | 2.53 | 1.58 | 1.87 | 1.97 (lead 0.1) | 0.56 | 2.13 | 1.98 (0.15) | **new** |
| v38 | 11 inbox | "A free upload site. A stick in the post. Your call." | 11 | 6.95 | 1.58 | 4.87 | 5.07 | 1.88 | 6.45 | 5.45 (1.00) | **new** |
| v11b | 13 close | "Take the shortcut here. See where it leads. Learn on Hacktivity.co.uk." | 11 | 6.95 | 1.58 | 4.87 | 5.07 | 1.88 | 6.45 | 5.45 (1.00) | **new** (v11 cached as the alternative, owner question 4) |

98 narrator words. Every line clears its gate on the slow read. Beats 1 and 12 carry no narration (cast lines).

Cached clips reused: v1 only. Kept on disk and not used in the default: v1c "This episode: Shadow IT." (2.688 s; v30 names and defines in one sentence, owner question 5), v10, v11 (5.760 s, the series tagline), v15 to v21, v2_r3. All new texts take new ids (v30 to v38); none of r4's unvoiced ids (v22 to v28, v18b, v15b) is reused, so no id ever carries two texts. v11b keeps r4's id and text.

Voicing notes. v30: a short pause after "Shadow IT", then level. v31 flat, a shrug. v32 picks up from v31 ("So"). v33 and v35 are the costs: plain, no menace. v34: a pause before "Even". v36 is the turn: lighter, a small pause after "that". v38: three short items, "Your call" as a hand-over.

Truth checks, against the episode at 8dabd5955:

- **v30:** the brief (erb :657) and Nilesh (ink :68) say shadow IT is work on "devices, apps, accounts or services that IT doesn't know about or hasn't approved, usually as a shortcut". The scope note (erb :560) says "the shortcuts staff take round IT". The definition part is 9 words.
- **v31:** card 1, "The share has crawled to a halt" (erb :578); the brief, "the file share has slowed to a crawl".
- **v32:** card 1, `send_personal`: "Send the client files to your personal email to finish at home" (erb :588).
- **v33:** "Months on, the personal inbox was broken into with a reused password; the client files sat in its sent items" (erb :691). A personal inbox is an account IT doesn't know about by the episode's own definition, and the concept panel says such copies are ones "nobody can account for" (erb :671). The page does not yet say in so many words that IT did not know; section 9 asks for that.
- **v34:** card 3, "Plug the visitor's USB stick into your work laptop" (erb :616). "Unknown device" is the episode's term (erb :55, :1670; ink :85). "Untrusted" and "on the work network" appear nowhere in the fixed episode, so the owner's phrase is said in the episode's words (owner question 6).
- **v35:** "It carried a program that ran on yours and copied the folders it could reach" (erb :699).
- **v36:** the objective "Try the attacker's side: the USB drop ... see who plugs an unknown device into a work PC" (erb :54-55); the concept panel, "To a real attacker, the shortcut and the kindness are both openings." "That" is someone plugging in a stick they do not know. The chip `AUTHORISED TEST` matches the brief.
- **v38:** inbox items "Too big for email? Upload it here, free" (erb :360) and the Benmoor stick, "we've posted you a branded USB stick" (erb :408). It names two kinds of item and says nothing about which are safe. "A free upload site" falls over the list; "A stick in the post" falls as the Benmoor message opens.
- **v11b:** "here" puts the shortcut inside the game.

Burned captions (28 or fewer a line):

- Hook, 9:16 only: "Printer's jammed again." (23)
- v30 "Shadow IT: the shortcuts / staff take that IT / doesn't know about." (24 / 18 / 19)
- v31 "The file share is slow." (23)
- v32 "So the client files go / to a personal inbox." (22 / 20)
- v33 A: "That inbox gets broken into." (28). B: "IT never knew the copy / was there." (22 / 10)
- v34 A: "An unknown device / in a work laptop." (17 / 17). B: "Even a USB stick." (17)
- v35 "Its program copied every / folder it could reach." (24 / 22)
- v36 A: "Attackers count on that." (24). B: "Here, you plant one." (20)
- v38 A: "A free upload site." B: "A stick in the post." C: "Your call."
- No burned caption for v1, v37 and v11b: the open, blue and close cards carry the words.

Cards: red "Take the shortcut" (17); blue "Now it's your turn" (18); close "Take the shortcut here ·" (24) over "See where it leads", plate "Learn on Hacktivity.co.uk" (series tagline card "Take the shortcut ·" if question 4 keeps v11).

Chips: `THE OFFICE`, `WHAT IS SHADOW IT?` (18), `PERSONAL EMAIL`, `SIX MONTHS LATER`, `A VISITOR'S USB STICK` (21), `AUTHORISED TEST`, `YOUR INBOX`, `IT SERVICE DESK`. Tabs `SHORTCUT`, `ATTACKER`, `YOUR TURN`.

## 4. Character lines

| Beat | Speaker | Line | Caption | Source | Audio |
|---|---|---|---|---|---|
| 1 hook | Niamh (kettle chatter) | "Printer's jammed again." | 16:9 and 1:1: her bubble carries it. 9:16: burned, as above | erb :1649, chatter pool `ca15_kettle` | cached (`tts_cache/ca15_shadow_it/7e82b6b66cc74265cd6fff97490c22bf`); lay the clip in at the bubble's first frame, take audio muted |
| 12 nilesh | Nilesh | "That's shadow IT for you. If the official way's slow, tell us rather than building your own way round." | A: "That's shadow IT for you." (25). B: "If the official way's slow, / tell us rather than building / your own way round." (27 / 28 / 19) | ink :65, after the sort is complete | **new line since cf31e6c5d**: needs the ca15 TTS top-up before t09c. The old line ("That's the lot. If the official way's slow...", t09b) ran 5.75 s for 17 words, so expect about 6.4 s for 19 |

Beat 12 timing: in = line start - 0.2; the line should end near 6.6 s, about 1.0 s before the cut. Gate for the line: 7.08 s. If it runs longer, beat 12 takes a beat from beat 11 (v38's gate becomes 5.82, slack 0.37).

## 5. Shot list and framing

Takes live in `~/video-takes-local/ca15/takes/`. Retakes run with the standard ca15 flags (`--hide-hud --zoom-step 1`) **from this branch** (cf31e6c5d and 8dabd5955 are not on main). Zoom is 16:9 / 9:16 / 1:1; cx and cy are fractions of the 1920 x 1080 source with the pixel in brackets. Crop sizes: 16:9 zoom 2 is 960 x 540, zoom 3 is 640 x 360; 9:16 at 1.125 is 960 wide, at 1.6875 640 wide; 1:1 zoom 2 is 540 square.

| # | Shot | Take and window | Zoom and crop | On-screen text to check |
|---|---|---|---|---|
| 1 | hook | **t19_kettle_hook** (new): ops room, no stick dropped, Joanne and Niamh at the kettle. Mark `printer_bubble` on the first frame of "Printer's jammed again."; in = mark - 1.0, out + 4.42. Fallback, existing: t11_red_drop_run, in about 37.90, out 42.32 (the bubble is up at 38.8 and 40.4 and gone by 42.0; Joanne's stick line starts at 42.82). Set the in point on frames | t19: 2 / 1.6875 / 2, crop centred on the pair and the whole bubble, measured on the take. t11 fallback: 1 / 0.5625 / 1 (the camera drifts in this window, so no zoom 2 crop is safe unmeasured); about 11 percent black on the right in 16:9, as r4 accepted (owner question 7) | The other chatter line in the pool ("Is the Shipley run late again?") is plain. In the t11 fallback the dropped stick lies at the learner's feet, about 8 px at zoom 1; nothing names it |
| 2 | open | card | none | none |
| 3 | topic | **t17_brief** (new): kiosk opened on the Brief. Mark `brief_shown`; in = mark + 0.1, out + 6.95; the take holds 8.0 s. Fallback, existing: t03b_choices_hold in 5.61, out 9.55, last frame frozen to fill 6.95 s (a static panel; t03b's text is not stale) but it shows no definition | 2 / 1.125 / 1 if the Brief panel fits a 960 x 540 crop, cx 0.50 (960), cy 0.50 (540); otherwise 1 / 1.125 / 1. 9:16 cx 0.5. In 9:16 and 1:1 the body is small and v30's caption carries the beat | The brief reads "...shadow IT: staff using devices, apps, accounts or services that IT doesn't know about or hasn't approved, usually as a shortcut." It ends "Only the inbox is scored": not a score, keep. Assert the text contains "shadow IT" and no `\bpack\b` |
| 4 | red card | card "Take the shortcut" | none | none |
| 5 | email | **t16_shortcuts**: card 1, `send_personal` picked. In = `c1_pick` - 2.0; out + 5.68. The card reads for 2.0 s, then the click falls under "go to a personal inbox" | 1 / 1.125 / 1, 9:16 cx 0.5 (the 716 x 632 px panel does not fit a zoom 2 crop) | Card 1 now says "client files". "Choice N of 4" header hidden. No "Your call" tag, mark or verdict colour after the pick |
| 6 | email cost | t16_shortcuts: "Six months later" with card 1's consequence only. In = `reveal_email`; out + 6.32 | 2 / 1.125 / 1; 16:9 cx 0.50 (960), cy 0.50 (540): on t03c the 754 x 508 px page (y 286 to 794) fits with 16 px spare; recheck on t16 | Per-choice labels and tags hidden with `hideText`. The body names "a reused password" until the change in section 9 lands |
| 7 | device | t16_shortcuts: card 3, `plug_visitor` picked. In = `c3_pick` - 3.2; out + 6.32. The click falls under "Even a USB stick" | 1 / 1.125 / 1, 9:16 cx 0.5 | The option reads "Plug the visitor's USB stick into your work laptop". Header hidden; checks as beat 5 |
| 8 | device cost | t16_shortcuts: "Six months later" with card 3's consequence only. In = `reveal_stick`; out + 5.05 | as beat 6 | Body as erb :699 after 8dabd5955 |
| 9 | attacker | **t11b_drop** (retake of the t11 opening on this branch, ending 2.0 s after the stick lands): in = `drop_land` - 3.28, out + 5.05. Fallback, existing: t11_red_drop_run in 30.00, out 35.05 (`menu_open` 32.42, `drop_click` 33.12, `drop_land` 33.275); check frames 34.42 to 35.05, which r4 did not use, for the HUD change at 34.13 | 2 / 1.6875 / 2, cx 0.50 (960) in all three, cy 0.5704 (616) in 16:9 and 1:1. The static crop keeps the inventory bar and the top void out in 16:9 and 1:1 only; in 9:16 check the frames and mask or shorten if either shows | t11b: the menu header reads "Unlabelled USB stick", plain, no mask. Existing t11: the header reads RED-TEAM STICK; flat box `{x:920,y:765,w:115,h:30}` from take 32.35 to 33.20; box the whole menu if a second entry names the kit |
| 10 | blue card | card "Now it's your turn" | none | none |
| 11 | inbox | **t06b_inbox_list** (new): in = `list_shown` + 0.10; out + 6.95. The list holds 1.9 s of the shot, then the Benmoor message opens (`row_usb`) and holds 5.05 s. Fallback, existing: t06 in 2.20, out 6.62 with the list only (the row and its verbs arrive at 6.77), which is 7 beats; the close takes the other 4, and v38 is replaced by v38f "Free uploads, sticks by post. Your call." (7 words, est. 3.15, gate 3.92, slow read 3.47, slack 0.45) | 1 / 1.125 / 1, 9:16 cx 0.5 (the panel is 480 to 1436 px of a 480 to 1440 crop) | Hidden by the take: the verb row, the advice text, the "0 of 6 sorted" counter and bar. Frame check on the open message for anything that reads as a tell; the body is the lure and fine to show. t06 fallback: box the counter `{x:430,y:100,w:440,h:62}` for the whole shot; its fileshare row is truncated to "Mo..." (now "Cl..."), usable |
| 12 | nilesh | **t09c_nilesh_tell_it** (retake of t09b on this branch, same seeding: sort complete, then talk). In = line start - 0.2; out + 7.58. Stand-in only, existing: t09b in 9.03, out 15.35 at 10 beats (the next line starts at 15.70), spare beats to the close; its first words are the old "That's the lot." | 1 / 1.125 / 1. 9:16 cx 0.6396 (1228); 1:1 cx 0.6448 (1238), as r4's Nilesh shot, rechecked on t09c | Portrait and burned captions. Masks in 16:9 as r4: the subtitle bar (y 850 to 1080), which covers "Skip", and `{x:1860,y:0,w:60,h:60}`. The window ends before "And nobody gets told off for asking." |
| 13 | close | card: Shadow IT / "Take the shortcut here ·" over "See where it leads" / plate "Learn on Hacktivity.co.uk" | none | none |

Never on screen: choice verdicts, "Your call" tags, inbox verbs, advice text, tallies ("0 of 6 sorted"), scores, the debrief, the Monday card, the habit line as kiosk text, the session note, the item name "Red-team stick".

## 6. Takes

**New or retaken (five scripts, all on this branch):**

| Take | Covers | Must show | Marks |
|---|---|---|---|
| t16_shortcuts | beats 5 to 8 | Fresh game. Kiosk, Everyday choices, header "Choice N of 4" hidden from the first card. Card 1: hold 2.2 s, pick `send_personal`, hold 4.0 s. Card 2: either, off window. Card 3: hold 3.4 s, pick `plug_visitor`, hold 3.5 s. Card 4: either, off window. "See where they led"; dismiss the step-away panel off camera (as `t03c_flip_one.mjs`). Show card 1's consequence only (others hidden by `data-beat`), hold 7.0 s; then card 3's only, hold 6.0 s. Assert card 1 contains "client files", card 3 contains "USB stick", no text matches `\bpack\b` (the sender "Benmoor Packaging" must not trip it), and no verdict tag or colour shows while a card holds | `c1_pick`, `c3_pick`, `reveal_email`, `reveal_stick` |
| t17_brief | beat 3 | Kiosk open on the Brief, static, 8.0 s. Assert "shadow IT" present | `brief_shown` |
| t06b_inbox_list | beat 11 | The t06 script with the verb row, advice text and counter hidden by CSS before the list appears; list held 2.0 s; Benmoor row opened, held 5.5 s. Assert none of the hidden parts shows from `list_shown` to + 7.1 and that the intro page has gone. Save frames at `row_usb` + 0.5 and + 4.0 for the tell check | `list_shown`, `row_usb` |
| t09c_nilesh_tell_it | beat 12 | t09b's seeding; the new first line, whole; menu hidden | `line_start`, `line_end` |
| t19_kettle_hook | beat 1 | Ops room, nothing dropped, the learner out of the crop; wait for "Printer's jammed again."; hold 4.0 s after it starts | `printer_bubble` |

Optional sixth: **t11b_drop** for beat 9, so the menu shows the new item name and needs no mask.

Needs TTS before t09c: Nilesh's ink :65 line (new text). Everything else the cast says here is cached.

**Existing takes that now show outdated episode text:**

| Take | Stale text | Use in r5 |
|---|---|---|
| t03_choices_reveal | card 1 "the pack" (situation and option); card 3 "Plug the visitor's stick into your laptop" (now "USB stick", "work laptop") | none |
| t03c_flip_one | card 1 "pack"; consequence "the pack sat in its sent items" | geometry reference only |
| t06_inbox_list | row "Monday pack, final" (now "Client files for Monday, final"), truncated to "Mo..." in the list window | beat 11 fallback, usable |
| t08, t08b | Nilesh's old welcome (no definition of shadow IT) | none |
| t09, t09b | "That's the lot." (now "That's shadow IT for you.") | beat 12 stand-in only |
| t10_worldbeat_panel | heading "One from the red-team kit" (now "Try the attacker's side") | none |
| t11_red_drop_run | item menu header "Red-team stick" (now "Unlabelled USB stick"); Nilesh's hand-over lines ("red-team kit", "safe tracker, booked in with IT"); the session note | beat 9 fallback with the mask; beat 1 fallback. The stale lines are outside both windows |

Not stale: t03b, t14, t15 (its first line is unchanged), t07. r5 uses none of t14, t15 or t07.

## 7. Music

Unchanged: PeaceFolk "Guitar Motif" from 37.442 s, 73.263 s (29 bars), grid `guitar_motif_75.json` (95 BPM). The drop at b28 (17.684 s) is the cut into the red card.

## 8. Rubric (CA fun and USP, trailer-observable, 0 to 3)

| Item | Score | Evidence |
|---|---|---|
| F1 hook | 2 | An office grumble everyone knows, and it is the cause of the whole story. Less of a question than r4's found stick (owner question 1) |
| F3 agency | 2 | Two picks, each with its outcome; the learner plants the stick |
| F4 living world | 2 | Kettle chatter, staff around the planted stick, Nilesh at the desk. Fewer room shots than r4 |
| O1 attacker method | 2 | One shot: the unlabelled stick left where people stop. The landing is not shown |
| O2 attacker reasoning | 2 | "Attackers count on that", straight after the visitor's stick has copied the folders |
| O4 tone | 3 | "staff", a slow file share as the cause, Nilesh's "tell us"; no blame |
| P1 practice | 2 | The inbox, with the same two tricks; answers off screen |
| A1 accuracy (gate) | pass | Game order kept (choices, where they led, the attacker's side, the inbox, Nilesh's closing line). The two consequences are shown one at a time; in the game they share a page |
| A2 safe takeaway (gate) | pass | Pattern level; authorised test on the chip; the lesson is "tell IT" |

15 of 21 against r4's 19. The points given up are the price of one thread: the planted stick was where r4 scored O1, O2, F1 and F4, and it was also what the owner found confusing. Variant B below buys some back.

**Variant B (bookend), if the owner prefers the found-stick hook.** Same grid. Beat 1 is r4's hook (t11 in 40.93, out 45.35, cached clip, L-cut, 9:16 caption "Someone's dropped a memory / stick. Whose is this?", 1:1 cx 0.4792 (920)); v1 then starts 0.82 s into the open card (ends 5.93, margin 0.39). Beat 9 becomes Joanne at her work PC (t11 in 45.55, out 50.60; her cached line "I'll just plug it in and see whose it is." laid in at 0.0, speech ends 1.93), chip `UNKNOWN DEVICE · WORK PC` (24), with v36b "Attackers count on that." (4 words, est. 1.87) starting 2.4 s into the shot (gate 2.35, slow read 1.98). The drop is not shown. Cost: the trailer opens on the planted stick before the term is named, and three shots in thirteen are about a stick.

## 9. Episode text changes requested

Not made here; scenario and ink files are untouched.

| # | File:line | Old | New | Reason |
|---|---|---|---|---|
| 1 | `scenarios/ca15_shadow_it/scenario.json.erb:691` (`flipMontageByChoice.personal_email.send_personal`; mirror in `planning_notes/phishing_and_social_engineering/awareness/e15/`) | "Months on, the personal inbox was broken into with a reused password; the client files sat in its sent items, and the client got a convincing fake invoice built from it." | "Months on, the personal inbox was broken into. The client files were still in its sent items, and IT had never known the copy was there, so nobody could protect it or take it back. The client got a convincing fake invoice built from them." | Beat 6 shows this text under v33. The shadow IT point is lost visibility; "a reused password" makes it read as a password lesson (review B, M3). Also "built from it" should be "them" |
| 2 | same file `:692` (`ask_nilesh`) | "...In the version where they went to a personal inbox, that inbox was broken into with a reused password and the files were copied." | "...In the version where they went to a personal inbox, that inbox was broken into, and IT never knew a copy was there to protect." | Keeps the two branches telling one story |
| 3 | same file `:5` (`scenario_brief`) and `:657` (`strings.brief`) | `:5` ends "Only the sort is scored."; `:657` ends "Only the inbox is scored." | one wording in both (suggest "Only the inbox is scored.") | Beat 3 shows `:657`; the two briefs contradict each other (review B, E2) |

No change is needed for v34: it uses "unknown device" and "work laptop", both already in the episode. Nilesh's ink :65 line is used as written; if the dialogue review rewords it, t09c and the beat 12 captions follow the new text.

## 10. Open questions for the owner (via AC0)

1. **The hook.** Default: "Printer's jammed again." at the kettle, so the trailer opens on the cause and no stick appears before the term is defined. This sets aside the owner's note on the r1 hook ("extend the opening bubble to the whole line"), because that hook is the planted stick. Variant B (section 8) keeps the found-stick hook, whole, and pays it off with Joanne at her PC.
2. **The attacker's side (beat 9).** Default: one shot, one line, framed by the chip as an authorised test. Alternative: cut it, give 4 beats each to beats 11 and 12, and let the two costs carry the attacker's view. The course's selling point argues for keeping it.
3. **Nilesh's closing line as the stated lesson.** "If the official way's slow, tell us rather than building your own way round" is advice, said by a character in a chat, once. The house rule keeps advisory lines off screen; this is the one exception, taken on the integrator's direction. Confirm.
4. **The close tagline (carried from r4 Q4).** Default v11b "Take the shortcut here. See where it leads." Straight after Nilesh says to tell IT, the series tagline v11 "Take the shortcut, see where it leads." (cached, 5.760 s, ends 5.96, margin 0.99) reads more like advice for work than it did in r4, so v11b is the stronger default now.
5. **v1c retired.** "This episode: Shadow IT." (cached) is replaced by v30, which names and defines in one sentence. To keep the series opener, the topic shot needs 13 beats (v1c, then "The shortcuts staff take that IT doesn't know about."), taken from beats 11 and 12.
6. **"Unknown device in a work laptop" for the owner's "untrusted devices on business networks".** The fixed episode says "unknown device" and never says "untrusted" or "network". Default: the episode's words. If the owner wants their phrase, the episode needs it too.
7. **Black edge on the 16:9 hook (carried from r4 Q5).** Applies only if beat 1 falls back to the t11 window at zoom 1; t19 is framed to avoid it.

Dropped from r4: Q1 (the hook's L-cut, now only in Variant B), Q2 and Q6 (the free-app card and "a leaver's account" are cut), Q3 (stand-ins: every shot that shows card or page text needs its retake).

## 11. Lines to voice

Narrator, 10 new: v30, v31, v32, v33, v34, v35, v36, v37, v38, v11b, after the script review rounds and the `npc-dialog-review` wording check. Voice with `tools/video/scripts/narrate.rb`, trim with `trim_vo.py` and the `LINES_v2.md` gain pass, then measure each against its gate. Cast: Nilesh's ink :65 line through the ca15 TTS top-up. Variant B adds v36b.

## Sources

NCSC "Shadow IT" guidance (read 26 Nov, as r3 section 7) for the definition and for the cause: staff struggling with sanctioned tools. Review B (`tmp/handover/ac0/ca_trailer_script_review_B.md`, ca15 section and recurring patterns 1 to 4 and 7) for the structure. The R3 timing review of r4 for the beat 9 mask rectangle, the 9:16 caveat on that crop, the `\bpack\b` assert and the stale-take list.
