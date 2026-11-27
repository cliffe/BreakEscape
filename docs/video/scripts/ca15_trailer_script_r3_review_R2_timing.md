# ca15 trailer script r3: silent read and timing review, round R2 (26 Nov)

Reviewer: Sonnet (silent viewing, timing, integer scale). Scope: `ca15_trailer_script_r3.md` at 895849ad7 (revision 2, 75.78 s), the R1 timing review, `takes_ca15.md`, `GUIDELINES.md`, the `video-edit` skill, `tools/video/capture/launch.mjs` (HUD flags), the ca15 scenario (`useSeconds`, session note, mappings). Takes on disk measured with `ffprobe`/`silencedetect`/frames; no machine use, no renders. The script is not edited.

Result: **0 B, 4 M, 9 m.** R1's B1 and M1 to M7 are resolved on paper. The new problems are a take-flag clash that would hide the payoff (M1), a table that is off the beat grid (M2), a word the cut never introduces (M3) and a mark definition that would stretch the Fatima beat (M4).

## R1 resolution

| R1 | Status | Check |
|---|---|---|
| B1 panels clipped | resolved | Beats 3, 5, 6, 13, 15 at `1 / 0.5625 / 1`. Beat 13's R1 punch-in is gone (see m2). |
| M1 no fallback hook | resolved | t07 exists, 17.37 s. In 4.66, out 8.86 verified (below). Beats 8 to 11 still have no usable stand-in (m7). |
| M2 hook 3.6 s | resolved | 4.20 s; line est. 0.6 to 3.6, 0.6 s clear of the seam. |
| M3 v19 | resolved | "Next door, work carries on." 5 words, 27 characters, 0.75 s margin. |
| M4 find_use | resolved | Arrival only, in at `use_started` - 2.2. The scenario gives the PC `useSeconds: 6`, so the line (at `use_started`) and the note (`used` + 0.3 s) are about 6 s apart. They cannot overlap, and beat 11 has 3.7 s of live footage before the return. |
| M5 Fatima | resolved with a caveat | 6.70 s, window after `bark_end`. See M4 below for how the marks are defined. |
| M6 Nilesh line | resolved | 5.86 s, caption in three lines, measure after TTS. See m4 for the spare. |
| M7 seat label | resolved | Red THE SHORTCUT tab on beats 5 to 13, room in the chip. |
| m1 to m8 | resolved | Except m7 (no caption on v1/v11), kept as the house pattern. |

## Narrator pace and margins

Cached clips measured; new lines estimated at 2.33 words per second (mean of the 17 cached Sulafat clips; range 1.49 to 3.05). Lead 0.2 s (v1c 0.1 s). Margin is to the cut or seam.

| line | words | window s | w/s on window | audible s | cue ends | margin | verdict |
|---|---|---|---|---|---|---|---|
| v1 | 9 | 5.70 | 1.58 | 5.112 (measured) | 5.31 | 0.39 | ok |
| v1c | 4 | 3.20 | 1.25 | 2.688 (measured) | 2.79 | 0.41 | ok |
| v2 | 6 | 3.40 | 1.76 | 2.58 | 2.78 | 0.62 | ok |
| v16 | 7 | 3.54 | 1.98 | 3.00 | 3.20 | 0.34 | thin (m5) |
| v18 | 5 | 2.70 | 1.85 | 2.15 | 2.35 | 0.35 | thin (m5) |
| v19 | 5 | 3.10 | 1.61 | 2.15 | 2.35 | 0.75 | ok |
| v20 | 6 | 3.20 | 1.88 | 2.58 | 2.78 | 0.42 | ok |
| v21 | 4 | 2.40 | 1.67 | 1.72 | 1.92 | 0.48 | ok |
| v17 | 9 | 4.60 | 1.96 | 3.86 | 4.06 | 0.54 | ok before snap, 0.23 after (M2) |
| v15 | 4 | 3.00 | 1.33 | 1.72 | 1.92 | 1.08 | ok |
| v9 | 11 | 5.50 | 2.00 | 4.824 (measured) | 5.02 | 0.48 | ok |
| v10 | 4 | 0.2 to 2.1 | 2.11 | 1.680 (measured) | 1.88 | 0.30 to the ask | ok |
| v11 | 10 | 6.58 | 1.52 | 5.760 (measured) | 5.96 | 0.62 | ok |

Highest pace against a window is v9 at 2.00 words per second. Against the cue itself (window minus lead minus 0.3 s) the highest is v17 at 2.2 and v16 at 2.3. Nothing is near 3.0.

Cast-line overlaps: no narrator line sits over a character line. Beats 1, 7, 10 and 12 carry no narration. Beat 16: v10 ends 1.88 s into the shot and the ask starts no earlier than 2.18 s (0.30 s). Beat 8's kettle chatter is the only untracked cast audio (m9).

## Hook fallback (checked on disk)

`~/video-takes-local/ca15/takes/t07_stick_beat.trimmed.mkv` exists (17.369 s). Marks: `look_up` 3.78, `bubble-start` 5.36, `bark_start` 5.42, bubble 2 and `ask_start` 9.95 to 9.97, end 16.90. `silencedetect` (-40 dB) puts the audible bark at **5.66 to 8.22**, not the 3.22 s of the cached clip, so the window 4.66 to 8.86 gives a 1.00 s lead and a 0.64 s tail. Both are over the 0.3 s rule. Frames at 4.7, 5.0, 5.4, 8.7 and 9.1 show the room (panel closed), Fatima turning to the stick, then her bubble, with the learner in frame. The fallback exists and its in and out points are valid. Two notes in m6.

## Findings

### M1. `--hide-hud` hides the toast and the inventory, which beats 9 and 11 need

`tools/video/capture/launch.mjs` `HUD_CSS` hides `#notification-container` (toasts) and `#inventory-container` (inventory bar). The ca15 recipe in `takes_ca15.md` runs every take with `--hide-hud --zoom-step 1`. The script plans beat 9 as "inventory open, the stick, Drop here" and beat 11 as "pickup toast or inventory icon, whichever the take shows". With the standard flags neither exists: beat 11 would show Joanne sitting at a desk with nothing to say what arrived, and beat 9 has no menu to film. Beat 11 is the payoff (A1/O1) and v21 has nothing under it. The script's own text also left the same check open for option C ("a check that the toast survives `--hide-hud`"); it does not.

Fix: say in section 5 that t11 records without `--hide-hud`, or with an override injected after it that restores `#notification-container` and `#inventory-container` and keeps the rest hidden (objectives, hearts, buttons, info label). Add "check the toast and slot at 1x in all three crops" to the beat 9 and 11 rows, and a fallback: if the toast is too small at scale 2, use `1 / 0.5625 / 1` as beat 9 already allows. Beat 16's "!" cue is a world sprite, not HUD, so it is unaffected.

### M2. The table is off the beat grid, and snap will eat three margins

The edit's `snap: true` puts every cut on the 0.6316 s grid (half a frame). The script's cut times are not on it except 22.74 (beat 36) and 75.78 (beat 120). Distance from each cut to the nearest beat (window starts on a bar):

| cut after | time | nearest beat | shift |
|---|---|---|---|
| hook | 4.20 | 4.42 | +0.22 |
| open | 9.90 | 10.11 | +0.21 |
| topic | 13.10 | 13.26 | +0.16 |
| red card | 16.50 | 16.42 | -0.08 |
| pick | 20.04 | 20.21 | +0.17 |
| lookup | 22.74 | 22.74 | 0 |
| nilesh_give | 28.60 | 28.42 | **-0.18** |
| walk | 31.70 | 31.58 | -0.12 |
| drop | 34.90 | 34.74 | -0.16 |
| find_use | 40.50 | 40.42 | -0.08 |
| payoff | 42.90 | 42.95 | +0.05 |
| nilesh_kind | 49.40 | 49.26 | **-0.14** |
| led_email | 54.00 | 53.69 | **-0.31** |
| blue card | 57.00 | 56.84 | -0.16 |
| inbox | 62.50 | 62.53 | +0.03 |
| fatima | 69.20 | 69.48 | **+0.28** |
| close | 75.78 | 75.79 | 0 |

Three of those break a stated margin: beat 13 ends 0.31 s early, so v17's 0.54 s margin becomes 0.23 (under 0.3); beat 7 loses 0.18 s from the 5.86 s that is already sized to the line plus 0.45 s; beat 16 gains 0.28 s that comes out of the close, where v11 plus the 0.5 s end hold is already tight (0.62 s). "Snap outward" cannot hold for both sides of a shared cut.

Fix: reissue the table in beats (120 in all) with every margin recomputed on the snapped times, before the edit list. Suggested starting point: beat 13 ends at 54.32 (beat 86, +0.32 s), beat 14 ends at 56.84 (beat 90; 2.52 s, v15 still has 0.58 s), beat 15 ends at 62.53. For beat 16, 69.48 leaves the close 6.31 s, with v11 ending 0.35 s before the end hold; 68.84 gives beat 16 6.31 s and the ask 0.15 s less tail (0.39 s, still over the 0.3 s rule). Choose one on the page, not in the build.

### M3. "The tracker" has no antecedent anywhere in the cut

v21 says "The tracker reports home." and the toast says "Session note: TL-OPS-04". The only place the cut says the stick is a tracker is Nilesh's line 85 ("It's a safe tracker, booked in with IT"), which the script plays in the take and cuts out (beat 7 is line 87 only). Silent or not, a viewer meets "the tracker" for the first time at beat 11, and in beat 7 "Leave it next door" has no visible "it": the stick first shows at beat 9. The RED TEAM chip says the exercise is booked with IT but not what the stick does.

Fix: put the word where the viewer has no sound to rely on. Cheapest: the chip on beats 6 and 7 becomes `TRACKER STICK · BOOKED IN` (25 characters, under 28), replacing `RED TEAM · BOOKED WITH IT`. The panel title "One from the red-team kit" on beat 6 already carries the red-team half. Alternatively give v18 "Now the attacker's side: a tracked stick." (two lines, 7 words, too long for 2.70 s; not recommended).

### M4. Beat 16's `ask_end` is defined on the bubble, not the audio, which makes the shot 9.6 s

The window rule is "`ask_start` no earlier than 2.18 s into the shot; out = `ask_end` + 0.54". In the existing take the marks are bubble marks: `ask_start` 9.965, `ask_end` 16.899 (take end). The audible ask is 10.18 to 13.41 (3.23 s; the cached clip is 3.98 s with silent tails); the bubble stays up until 16.87. Following the rule on t14 if it is marked the same way gives 2.18 + 6.93 + 0.54 = 9.65 s against a 6.70 s slot. The same rule cannot be met on the t07 stand-in at all (`ask_end` + 0.54 = 17.44, past the 16.90 s take).

Fix: define the t14 marks from the audio (`ask_audio_start`, `ask_audio_end` from `silencedetect`, or the voice watcher's own times), and write the window as in = `ask_audio_start` - 2.18, out = `ask_audio_start` + 4.52 (3.98 + 0.54), so it is 6.70 s whatever the bubble does. Check the bubble still shows whole (it does at 16.87 on t07).

### m1. One caption line is 29 characters

Nilesh's kindness line (beat 12) breaks as 26 / 23 / 29: "that's what a drop relies on." is one over the 28 limit. Fix: four lines, "Nobody was careless there." / "She was being kind, and" / "that's what a drop" / "relies on." (26 / 23 / 18 / 10, no single-word last line). Every other caption line, card string and chip is 28 or fewer (longest: v17 line 1 and the hook's second line, both 28). The close tagline stacks at 19 / 18 in every aspect.

### m2. Beat 13 shows all four consequences, including the stick

The r2 take's "Six months later" page (t03, `reveal` 22.91 on) holds four cards: personal email, the drivers' group chat, the surveyor's stick ("Tarrowby had to tell two clients") and the free-app rota. At `1 / 0.5625 / 1` the whole page is in frame. The story at this point is one pick (v17 names card 1), and card 3 is the stick consequence, which competes with the drop the viewer has just watched. R1 recommended a 2x crop on card 1 in 16:9; revision 2 dropped it as a "punch-in". A static 2x crop is not a pushin, and a 960 x 540 window holds card 1 (the page is about 760 px wide). Fix: 16:9 at zoom 2 on card 1 (cy about 0.31, check on frame); 9:16 and 1:1 stay 1x (the 760 px page is over 540). Or record t03c with the one pick the game now makes before the flip, which also removes the stage strip's "Defend" and "Debrief" labels.

### m3. Beat 15 has no in and out

"The list from 2.77 (about 3 s), then the row open from 6.77" can be read three ways, and the list runs 2.77 to 6.77 (4 s) before the click. For 5.50 s with 3.0 s of list and 2.5 s of open row: in 3.77, out 9.27 (row open 6.77, verb buttons held to 11.87). v9's second sentence ("Found sticks go to IT") then lands on the open "USB catalogue" row. Write the numbers in the table, as beats 5 and 13 have.

### m4. The shared "spare" for Nilesh's two lines is smaller than stated

Beat 7 and beat 12 both say "take the extra from beat 8" (0.7 s spare); beat 12 also names "the open card's spare". Beat 8's margin of 0.75 s is to the cut; the 0.3 s rule leaves 0.45 s usable, and the open card has 0.09 s (v1 margin 0.39). Worst-case need at Nilesh's slowest cached rate (12.7 characters per second): beat 7 5.51 s line against 5.41 s capacity (0.10 s over), beat 12 6.30 s against 6.05 s (0.25 s over), 0.35 s together. That fits in 0.45 s, so the plan holds, but say "0.45 s from beat 8, shared" and drop the open card. At his cached average (14 characters per second) neither line overruns (5.0 s and 5.7 s).

### m5. v16 and v18 sit on the 0.3 s rule on an estimate

Margins 0.34 and 0.35 at 2.33 words per second; at the slowest cached short-sentence rate (v8, 1.77) v16 would overrun the cut. Both lines are plain words like the cached v3 (2.63 words per second). Fix: set their lead to 0.1 s (as v1c) so the margins become 0.44 and 0.45, and re-measure both on voicing before the edit is retimed.

### m6. Hook fallback details

(a) Burned caption and the game's own bubble both show Fatima's line in the take (the main hook hides the bubble; the fallback does not say). In 9:16 at 1.125 the bubble (about 256 to 692 source px) just fits a window centred near x 490, so it is not clipped there, but two copies of the line is texture. Hide it with a take CSS or accept it and say so. (b) If t14 is not recaptured and t07 stands in for beat 16 as well, the stand-in must open at 8.2 to 8.6 (v10 lead 0.1 s keeps its 0.26 s overlap with the ask under 0.3 s), which repeats about 0.3 s of source frames already in the hook. Harmless, but say it.

### m7. The lab stand-in for beats 8 to 11 is not a plan

Q1's stand-in (the lab drop, `lab_t10_usb_drop`, 22.74 s, drop 1.73, pickup 9.94, plug 19.04) has no windows, different people (Sofia and a lab colleague), a bubble line "Ooh, someone's lost a USB stick. I'll just plug it in and see whose..." and a remote-session foothold, not a tracker. v21 "The tracker reports home." would not be true over it. Fix: either give windows and recut lines (14.3 s: drop 1.1 to 4.3, pickup, plug 19.0 to 22.3) or say the stand-in needs its own script round and is only a fallback if the owner agrees to it.

### m8. Voice ids collide with cached clips

New text under `v2` overwrites `Sulafat/v2.mp3` ("First, take the shortcuts anyone would.") that r2 to r4 still use; `narrate.rb` re-voices a changed text under the same id. `v15` to `v21` are free. Use `v2_r3` (as `v1b_r3`), and run the new clips through the same trim and gain pass that built `Sulafat_v2/` (`LINES_v2.md`).

### m9. Kettle chatter bed

"Mute the take audio under v19 if still uncached" implies that cached chatter plays over v19. Mute it under v19 in every case (the duck is only -10 dB), and keep it out of the 14 lines to voice.

## Integer scale

16:9 and 1:1 use 1, 2 or 3; 9:16 uses 0.5625, 1.125 or 1.6875; no pushins anywhere (section 5 says so and the zoom column agrees).

| beat | 16:9 / 9:16 / 1:1 | scales | verdict |
|---|---|---|---|
| 1 hook | 2 / 1.6875 / 2 | 2 / 3 / 2 | ok; scale 3 is a 360 px window, bubble hidden (take) |
| 1F fallback | 2 / 1.125 / 2 | 2 / 2 / 2 | ok (m6a) |
| 3, 5, 6, 13, 15 panels | 1 / 0.5625 / 1 | 1 / 1 / 1 | ok; whole panel with margin (skill rule) |
| 7, 12 chats | 1 / 1.125 / 1 | 1 / 2 / 1 | ok, lower than the world shots; confirm the bust is whole in the 540 px 9:16 window on the crop sheet |
| 8 walk | 2 / 1.125 / 2 | 2 / 2 / 2 | ok; check on the crop sheet once S1 exists |
| 9 drop | 2 / 1.125 / 2 or 1 / 0.5625 / 1 | | ok; the inventory is HUD (M1) |
| 10 find_use | 2 / 1.6875 / 2 | 2 / 3 / 2 | ok |
| 11 payoff | 2 / 1.125 / 2 or 1x | | ok (M1) |
| 16 fatima | 2 / 1.125 / 2 | 2 / 2 / 2 | ok |

No panel wider than 540 px is above 1x in 9:16 or 1:1. Beat 13 at 2x in 16:9 only (m2).

## Music

Guitar Motif start 37.442 (bar 14 of the `guitar_motif_75` analysis, on the 2.526 s bar grid). Other starts on the track in the edit lists: ca01 19.758, ca04 55.126, ca19 75.35, ca13 95.545 (`@27.34`, `@27.337` and `@29.863` are `alternatives`, not starts). Distances: 17.684, 17.684, 37.908, 58.103. All at least 15 s. Window 37.442 to 113.222 s = 75.78 s, ends on bar 44; the file is 174.384 s. `silencedetect` (-45 dB, 0.3 s) over the full 75.78 s: no gap. The drop (55.126) is 17.684 s in, on the beat-5 pick click (t03 `c1_pick` minus in = 1.18 s after 16.50); the lift (60.178) is 22.736 s in, on the cut into Nilesh. The build still needs `guitar_motif_37.json`; ca15 r2 to r4 on Gently Decaying are untouched.

## Lines to voice

14 lines: 8 narrator (v2, v15, v16, v17, v18, v19, v20, v21) and 6 cast (Joanne 2, Nilesh 4). Matches section 3 and section 9. Cached and not in the count: v1, v1c, v9, v10, v11, Fatima's hook and ask. Fit against slots (Nilesh and Joanne are uncached, so estimates):

| line | slot capacity | estimate | verdict |
|---|---|---|---|
| Joanne hook | 4.20 s, line from 0.6 | 2.6 to 3.2 s (Fatima's nine-word bark is 2.56 s audible) | ok |
| Nilesh give (70 chars) | 5.41 s | 4.4 to 5.5 s | at the edge, covered by m4 |
| Joanne find (41 chars, 10 words) | 3.0 s | 2.8 to 3.2 s | at the edge; the in point moves with the measured line |
| Nilesh kind (80 chars) | 6.05 s | 5.1 to 6.3 s | at the edge, covered by m4 |
| narrators | see table above | | all fit on estimate; v16 and v18 thin (m5) |

Lines 13 and 14 (Nilesh 84 and 85) are for the take only and have no slot.

## Silent viewing, read in order

Hook with caption (Joanne, or Fatima as the fallback), open card, "This episode: Shadow IT." over the choices panel, red card, the pick with "The pack goes to a personal inbox.", the red-team panel with "Now try the attacker's side." and the red tab, Nilesh's three-line caption, "Next door, work carries on.", "You leave it by the kettle.", Joanne's caption, "The tracker reports home." with the note's title, Nilesh's kindness caption, the six-months page, the blue card, the inbox, Fatima's ask, the close. Every beat has either a VO caption or a dialogue caption on screen, and the red tab covers beats 5 to 13. The gaps are M1 (the payoff may not show), M3 (the tracker word arrives late) and m2 (four consequences on screen against a one-pick story). Panel text at 1x in 9:16 is about 12 px on a 1080 px frame: texture, carried by the captions.

## Checked and clear

- Table arithmetic: 75.78 s, 17 contiguous rows; in-world 37.56 s (49.6%), panels 19.54 s, cards 18.68 s.
- S1-dependent beats: 18.5 s (24%), as stated.
- Takes on disk: t03, t05, t06, t07, t08b, t09b, `lab_t10_usb_drop`. No t03b, t10, t11, t14, t15 yet, as the script says.
- Pace limit (3.0 words per second), seat tab coverage, 28-character rule (bar m1), 0.3 s overlap rule on the planned cast and VO, music distance, window and silence, line count.
