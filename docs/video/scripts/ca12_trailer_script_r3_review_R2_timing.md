# ca12 / ca12b trailer script r3: review R2, silent viewing and timing (26 Nov)

Reviewer: Sonnet 5.5 (silent read and timing). Scope: `ca12_trailer_script_r3.md` as of 8af8f3b73 (round 2 rewrite), the R1 timing review, `takes_ca12.md`, `GUIDELINES.md`, the scenario (`scenario.json.erb`), the engine's bark and hold code, the music analysis, and the takes in `~/video-takes-local/ca12/takes/`. Review only; the script is not edited.

Result: **1 B, 7 M, 6 m.** All beat tables sum to their stated totals (ca12b 77.02 s, ca12 78.98 s). Cards, music and the integer-scale table pass. The failures sit where the new attacker beats meet the engine as it stands today: Jo is cut off by the hand-back timer, the flip and the door beats carry more text than a silent viewer can read, and the two retakes that the script depends on are not specified well enough to record.

How it was measured: ffprobe and silencedetect (-40 dB) on `t06_the_call.trimmed.mkv`, frames pulled at 11.5, 12.3, 13.2 to 13.33 and 14.0 to 15.3 s; ffprobe on the Sulafat_v2 trims; the take marks; `silencedetect` at -45 dB over 80 s of Gently Decaying from 85.397; the edit lists' music starts; `bark-lifetime.js`, `npc-barks.js`, `episode-starter.js` and the scenario timers. Takes t16 to t21 do not exist, so those beats are budgets.

## R1 status

| R1 | Status | Note |
|---|---|---|
| B1 reader collision | resolved | the reader bark is out of both cuts; v5b has 3.0 s and nothing under it |
| B2 tailgate / Jo | **not resolved**, see B1 | 9.09 s and Jun's earlier approach are fine; the hand-back timer still lands inside Jo's line, and `barkDelay` is still 1800 in the scenario |
| B3 flip 3 s | partly, see M1 | now 5.45 / 5.0 s, still short for the text on the panel |
| M1 t06 points | resolved | 11.55 to 13.25 matches the take (checked below); fallback needs a small nudge (m5) |
| M2 hook / topic | partly, see M7 | hook now has room (8.18 s); the one-take plan needs two cameras |
| M3 ca12 door | partly, see M4 | toast display time stated, but it is longer than the beat gives it |
| M4 Jo caption | resolved | `lines[]` entry "Jo (earpiece)" in all aspects |
| M5 estimates | resolved except v10b, see M5 | |
| M6 insets | partly, see M2 and M6 | talk menu and kit panel are not covered |
| m1 to m7 | resolved except gap v3 to v4 (m3) and the music-table arithmetic (m4) | |

## Checked and clear

- **Narrator pace.** Every window is at or under 3.0 w/s (highest v5 2.94, v4 2.91, v6b 2.76, v5b and v4b 2.67). Existing clips fit their windows to within 0.05 s (v1 5.112, v1b 2.016, v1c 3.240, v2 2.400, v3 2.880, v4 2.424, v5 1.584, v6 0.744, v8a 3.072, v8b 3.288, v9 1.848, v10 4.776, v11 4.968, measured).
- **Gaps between narrator cues** are 0.25 s or more everywhere except v3 to v4 (m3).
- **Narrator over character lines.** None. Camila's line ends about 7.9 s at worst against v1 at 8.28; Lorna and the queue are clear; v6 (47.00) is 0.31 s after Yusuf's pass bark ends (+7.81 relative, 46.69 absolute).
- **Integer scale.** Every zoom in section 5 is 1, 2 or 3 (16:9, 1:1) and 0.5625, 1.125 or 1.6875 (9:16). Chats use 1 / 1.125 / 1; panels wider than 540 px (research 1090, build 630, talk menu 571, flip panel 745, queue 960) are at 1x in the narrow cuts. No pushins. The two exceptions to check are the kit panel (M6) and the topic map shot, which is already conditional.
- **Cards.** No line over 28 characters. The longest is "Scope: the desk and the door" at exactly 28. The stacked tagline lines are 15 and 16.
- **Music.** GD @85.397 has 101.8 s left in the 187.224 s track, so it covers ca12b (77.02 s) and ca12 (78.98 s) with 22 s spare; no gap over 0.3 s below -45 dB in 80 s (silencedetect found none). The other GD starts in the edit lists are 28.151, 39.055, 66.314 and 104.478 (6.069, 52.667, 64.356 and 91.43 belong to other tracks or are not GD in this set): the nearest are 19.08 s either side, so the start may move anywhere from 81.314 to 89.478 and stay 15 s clear. The hits at 19.08, 20.45, 21.81, 29.98, 31.34 and 32.71 exist in the analysis, so the red card bullets and the sprite change land on real hits.
- **t06 points.** In 11.55: Delphine's previous line ends 11.29 (audio) and the subtitle bar stays up, so nothing changes at the cut. Out 13.25: the last frame is 13.233; frame 13.267 is still clean and frame 13.30 shows the "playtest" name bar and the player's line. That is a margin of one to two frames (m5).
- **Lines to voice** (section 8.3), each against its slot:
  - v4b: 8 words, 2.6 to 3.0 s in a 3.00 s window, 0.8 s before v5. Fits.
  - v5b: 8 words, window 3.00 s, nothing in the beat but the walk. Fits.
  - v6b: 8 words, window 2.90 s; fits, but starts 0.26 s after Delphine's bark (m2).
  - v7: about 1.0 to 1.3 s in a 2.35 s window. Fits.
  - **v10b: likely over, see M5.**
  - **Delphine D1: likely over its 3.4 s beat, see m1.**
  - Camila: new clip about 4.7 s from 3.15 ends about 7.9 s, 0.4 s before v1. Fits.
  - Jun: "Morning, Yusuf." about 0.85 s at +0.35. Fits.

## Findings

### B1. The 5 s hand-back grace lands inside Jo's line, and the take cannot show the end of the hero beat

Arithmetic from the script's own numbers (section 4.1 and 8.2), relative to the learner entering the studio: Jo's `barkDelay` 2600 puts her bark at +2.6 s, and her audible length is 4.23 s, so she ends at +6.83 s. `ca12_t_grace` fires 5000 ms after `ca12_entered`, which is set by the same `room_entered:training_room` event, so `ca12_world_done` is written at +5.0 s. The hold on the episode world (`holdUntil: ca12_world_done`) is released there and the runner reopens the kiosk (`episode-starter.js` `settleHeldWorld`, runner line 1460). That is 1.83 s before Jo finishes. Whether the kiosk open also stops the audio does not matter for the trailer: the kiosk panel and the hand-back fall in the last 2.1 s of the tailgate beat (beat +7.0 to +9.09) and Jo's payoff sentence ("A uniform and a held door beat both.") plays under them. The script defers this to "check in t20"; the arithmetic already shows the collision, and t20 cannot be shot without a decision.

Fix, before t20 is recorded:
1. Raise `ca12_t_grace` `delayMs` to **7500** now (scenario.json.erb:206). Hand-back falls at +7.5 s after entry, 0.67 s after Jo ends, and beyond the beat's end (+9.09 is 7.09 s after entry, so the take never shows it).
2. Land the `barkDelay` 2600 change in the same commit (the file still says 1800).
3. Give the tailgate beat 9.15 s, not 9.09 s: Jo ends 0.26 s before the cut today and the tight-cut rule is 0.3 s.
4. The ca12 desk pass is unaffected: the learner enters at about +6.5 s and the hand-back at +14.0 s lies beyond the beat.

### M1. Flip text cannot be read in the time given (both cuts)

The game's own reading allowance is 300 ms a word (`bark-lifetime.js`). ca12b: heading "In behind a member of staff" (5 words) plus the E5 line (17 words) is 22 to 23 words, 6.6 to 6.9 s; the flip holds 5.45 s. ca12: the default heading "Now you're the one on the desk" (6 words) plus the L3 line (15 words) is 21 words, 6.3 s; the flip holds 5.0 s. `flipIntro` ("This is how your approach looked from Delphine's side of the counter. The lines picked out below are what got the door open.", 22 words) sits between them unless hidden; with the replay list masked in ca12 its second sentence points at nothing. At 9:16, 1x and a 2x inset, only the inset text is readable, so the inset has to hold the same time.

Fix: hide `flipIntro` with the same injected CSS the take scripts use for `.pretext-tells` (visibility hidden), so the panel reads heading then line; hold the flip for **6.8 s (five half-bars of 1.363 s)** in ca12b and **6.3 s** in ca12 (shorter if the heading is changed: "Through a held door", 4 words, saves 0.6 s). The extra 1.35 and 1.3 s are covered by the script's own trims (drop v1c and shorten `topic` to 2.5 s, -3.2 s). Re-solve the card starts to the 1.363 s hit grid at edit time; the music start can move by up to 4.1 s earlier or later without breaking the 15 s rule.

### M2. The talk menu cannot be read, and its highlighted choice is the wrong one for ca12b

t06 holds the menu for 1.1 s (the take script's `sleep(1100)`; menu up from about 12.1 s, pick at 13.233). Five options at about 14 px text are on screen for 1.1 s, and the frame at 13.2 shows no highlight. The truth check for v5b ("the choice is on screen in the talk beat's menu") is true only for a viewer who can read option 5, "Not to worry, I'll leave it at the desk. Cheers.", in 1.1 s. The shot picks option 4 ("buzz me through"), which is the ca12 route; ca12b has no take that shows its own choice. The only inset named for this beat is the INFLUENCE meter.

Fix: in the retakes (M3) hold the menu 2.2 s and add a 2x inset in 9:16 and 1:1 of the single option that carries the route (option 5 about 360 px wide in ca12b, option 4 in ca12; the full menu is 571 px and will not take a 2x inset in a 1080 frame). Talk becomes 2.6 s in ca12b and ca12. The extra 0.9 s is in the same budget as M1.

### M3. The t06r recapture is not scripted clearly enough to record, and ca12b needs a t06w

Section 5 says "as t06" and gives the in and out as "D1 line-start -0.15 s, speech end +0.25 s". Measured on t06: the subtitle switches from the player's line to Delphine's D1 at about 14.82 s (frame 14.80 still shows the player's line "Any chance you can buzz me through to the", frame 14.85 shows Delphine's), the voice watcher's `line-start` mark is 15.013 and the audio starts 15.138; `line-end` is 19.394 but the audio ends 19.100. So the marker-based in point (14.863) is one frame after the "playtest" name bar goes, and the end by marker is 0.29 s late.

Record spec to add to the script:
- Run: `t06_the_call.mjs` unchanged except two edits: the choice dwell 1100 to 2200 ms, and two new marks, `frame:d1-subtitle-up` (first frame where the dialogue speaker reads Delphine after the player's line) and `d1-speech-end` (from the voice watcher's end, not `line-end`). Entry state as t06: `run-take.sh ca12_visitor_tailgater t06r_the_call "" "--hide-hud --zoom-step 1"`, after the ink recompile (L1) and the D1 re-voice are in the served build.
- Variant `t06w_the_call` for ca12b: same script, second pick `/leave it at the desk/` (option 5) in `STEPS`; stop before the pick's own result; same 2.2 s dwell; marks as above.
- Points: lands in = `frame:d1-subtitle-up` + 0.10 s, out = measured speech end (silencedetect, -40 dB) + 0.25 s. Talk (both) in = the previous line's end mark, out = the pick mark - 0.02 s (the "playtest" name bar appears 0.07 s after the pick).
- Spoiler masks as t06: hide `.pretext-tells` (already in `setup()`); keep the meter's "Last change" line in the 16:9 frame only if the label reads as the technique, not the outcome.

### M4. The door beats carry more text than a silent viewer can read

ca12 door (38.88 to 47.98, 9.1 s): Delphine's bubble (5 words), the burned v6b caption (8), Jo's door toast (20), Yusuf's bubble (4), v6 caption (2): 39 words, about 4.3 w/s against the 3.3 w/s the game allows. ca12b tailgate (9.09 s): Jun (3), the door toast (20), Yusuf (5), Jo's toast and caption (10): 38 words, 4.2 w/s, and Jo's own toast (bark text in the toast lane, 5 s minimum) overlaps the earlier door toast for about 1.8 s. The toast in ca12 is on screen about 5.1 s (+4.0 to the flip cut) against the 6.0 s the script itself says it needs for 20 words, so the last sentence is cut. Yusuf's and Jun's lines are world-space bubbles at 1x in the 16:9 and 1:1 cuts, and only Jo has a `lines[]` caption.

Fix:
- ca12b: drop the door toast (Lorna 9). v5b ("skip the desk, and watch the door") sets up the two layers and Jo's "A uniform and a held door beat both." pays them off; the toast says it a third time.
- ca12: keep the toast but cut it to "The desk is layer one. The door is layer two." (9 words, 2.7 s at 300 ms a word) so the whole thing shows inside its 5.1 s, or drop v6b and keep the toast. Pick one "two layers" statement per cut.
- Add `lines[]` caption entries (speaker label, all three aspects) for Jun, Yusuf and Delphine in the door beats, as for Jo.

### M5. v10b is likely to overrun its 4.78 s window

Estimate in the script: 4.2 to 4.8 s. Measured analogues: v10 ("Check the list. Escort them. Badge in. Lock your screen.", 11 syllables, four sentences) is 4.776 s; v11 is 4.968 s for about 17 syllables. v10b is 15 syllables in three sentences, so about 4.8 to 5.4 s. At 5.2 s it ends at 68.0 s, against Lorna's beat at 67.62 and her speech at 67.88: about 0.1 s of overlap, which breaks the rule. The stated fallback (use v10) drops the tailgating answer that gives ca12b its O3 score.

Fix: change v10b now, before voicing, to "Check the list. Escort them. Don't let anyone follow." (9 words, 12 syllables, about 4.0 to 4.5 s). If it still runs over 4.78 s, drop "Check the list." and keep "Escort them. Don't let anyone follow you in."

### M6. The kit panel is wider than the narrow windows and the sprite change is in another view

The container minigame's `max-width` is 880 px (`container-minigame.css:25`), so the panel is likely wider than the 540 px window that 1.125 (9:16) and 2 (1:1) give, and the script sets the kit beat at 2 / 1.125 / 2. The letter inset is fine at 2x, but the panel itself clips. The beat then ends on the world-space sprite change (32.71), which at 1x in the narrow cuts is a 32 px figure in a 1080 px frame.

Fix: measure the panel's width in the t17 take (it is a DOM rect; add a mark). If it is over 540 px: panel at 1x in 9:16 and 1:1 (16:9 may stay 2x only if it also fits 960 x 540), with the letter inset in the free space. Split the beat into two shots with a hard cut (gameplay to gameplay is allowed): panel 29.78 to 32.40 at 1x, then the world at 2 / 1.125 / 2 from 32.40 to 33.78 for the sprite change on the 32.71 hit.

### M7. The "same take" for hook and topic needs two cameras

The hook uses t16 with a follow-cam on Camila (crossing, gate, arrival at the studio desks). The topic beat uses "the same take, after she is through", which is the lobby seen after she has gone: gate swinging shut, Yusuf returning, Delphine at the desk. Game-time order is lobby (gate shuts, about +3.5 s) then arrival at the desks (about +6 s), and one camera cannot be on both. A follow-cam leaves the lobby as soon as she is through.

Fix: say in the take list that t16 has two cameras in one run: follow-cam from the start, then at `door_gate_closed` the take script switches to a static lobby view held for 6 s (the `topic` window), and the arrival at the desks is recorded in a second run (t16b) with the same start state and the same Yusuf loop offset. Or take the arrival as the studio's own view from t02 and keep t16 to the lobby only. The hook's first 3.0 s (the walk) is unchanged either way.

## Minor findings

### m1. ca12 `lands` is probably about 0.3 s short

D1 after L1 is 11 words. Old D1: "Go on then," 15.138 to 15.92, gap 0.45 s, "Studio's up the stairs on your left." 17.34 to 19.10 (1.76 s for 7 words). The new second sentence has 8 words: about 2.0 s. Audible total about 3.2 s; with the in point 0.15 s ahead of `line-start` (so about 0.28 s ahead of the audio) and out 0.25 s after the speech, about 3.7 s against a 3.4 s beat. The burned caption (11 words, 3.3 s) also needs the whole beat. Fix: budget `lands` at 3.7 s (+0.3 s, so ca12 totals about 79.3 s before the other changes) and re-time from the marks when t06r exists.

### m2. v6b starts 0.26 s after Delphine's bark ends

Delphine "I'll get the door for you." is audible +0.10 to +1.16 of the door beat (38.98 to 40.04); v6b starts 40.30, a margin of 0.26 s (the rule is 0.3 s, and section 4.1 says 0.3). Fix: start v6b at 40.40 (ends 43.30, still 2.1 s before Yusuf's bark at 45.40). If Delphine's walk starts late, v6b moves with it.

### m3. v3 to v4 gap is 0.17 s

v3 ends 26.76 (23.88 + 2.880) and v4 starts 26.93. The script's own minimum is 0.25 s. Fix: v4 at 27.01; its clip (2.424 s) then ends 29.43, still 0.55 s before v4b.

### m4. Music table: the ca12 blue card is 1.54 s, not 1.04 s, from the lift

The lift at 54.52 is 1.54 s after the ca12 blue card starts (52.98). The table says 1.04 s, and says "under v7"; v7 (53.13) does start 1.39 s before the lift, so the placement is fine, only the figure is wrong. Also, the red card heading (19.28) lands 0.20 s after the hit at 19.08, because v1c's clip ends 19.19; accepted, but say so.

### m5. t06 fallback and out point sit one frame from the "playtest" name

Fallback `lands` in 14.85: the subtitle switches at about 14.82, so the first frame is one frame from the name bar. Use 14.95 (fallback length 1.05 s, still holds "Go on then," whose audio is 15.138 to 15.92) and keep the caption burned. For the talk out, use 13.23 rather than 13.25 (the first bad frame is at 13.30, so the margin is 2 frames now).

### m6. Scenario still says 1800 and the old strings

`barkDelay` is still 1800 and none of L1 to L8 are in the scenario yet. The script says so (section 8 and the dependency codes). Not a defect; the take list needs a line saying t20 is not to be shot until the B1 fixes and `barkDelay` 2600 are on the branch, because the fallback (a cached clip placed in the edit) is the only thing that works until then.

## Summary of changes to the plan

- Scenario: `ca12_t_grace` 5000 to 7500, `barkDelay` 1800 to 2600 (B1).
- Beats: tailgate 9.15 s (B1); flip 6.8 s / 6.3 s (M1); talk 2.6 s (M2); lands 3.7 s (m1). Net about +2.6 s on both cuts, offset by the script's own -3.2 s trims, so ca12b lands near 76.4 s and ca12 near 78.4 s. The music window needs 80 s of track from the start (101.8 s available).
- Script: t06r / t06w spec (M3), t16 cameras (M7), kit panel measure and split (M6), caption entries for Jun, Yusuf and Delphine (M4), v10b line (M5), v4 and v6b starts (m2, m3).
