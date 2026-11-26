# ca12 / ca12b trailer script r3: review R1, silent viewing and timing (26 Nov)

Reviewer: Sonnet 5.5 (silent read and timing). Scope: `ca12_trailer_script_r3.md` as of f7dc98be4, `takes_ca12.md`, `GUIDELINES.md`, `video-edit/SKILL.md`, `CA_THEME_TWO_SEATS.md`, the r4b edit list, the cached TTS clips and the take files in `~/video-takes-local/ca12/`. Review only; the script is not edited.

Result: **3 B, 6 M, 7 m.** Both totals hold (the beat tables sum to 71.6 s and 70.6 s). The narrator words-per-second rule holds on every window. The failures are all in the new attacker beats: they are short of room for the audio they are meant to carry, and the flip text cannot be read in 3 s.

How it was measured: `ffprobe` on the trimmed narrator clips in `~/video-takes-local/ca12/vo/Sulafat_v2/trim/`; `ffprobe` and `silencedetect` (-40 dB) on the cached character clips in `tts_cache/ca12_visitor_tailgater/`; `silencedetect` and frames on `t06_the_call.trimmed.mkv`; the music analysis `gently_decaying_75.json` plus a -45 dB gap check on the track itself. New takes (t16 to t21) do not exist, so beats built on them are budgets, not measurements.

## Narrator fit (measured clips, r3 windows)

| cue | words | window s | clip s | w/s (window) | spare s |
|---|---|---|---|---|---|
| v1 | 9 | 5.11 | 5.112 | 1.76 | -0.00 |
| v1b | 4 | 2.04 | 2.016 | 1.96 | 0.02 |
| v1c | 5 | 3.19 | 3.240 | 1.57 | -0.05 |
| v2 | 5 | 2.40 | 2.400 | 2.08 | 0.00 |
| v3 | 7 | 2.88 | 2.880 | 2.43 | 0.00 |
| v4 | 8 | 2.80 | 2.424 | 2.86 | 0.38 |
| v5 | 5 | 1.80 | 1.584 | 2.78 | 0.22 |
| v6 | 2 | 0.80 | 0.744 | 2.50 | 0.06 |
| v8a | 6 | 3.07 | 3.072 | 1.95 | -0.00 |
| v8b | 8 | 3.29 | 3.288 | 2.43 | 0.00 |
| v9 | 5 | 1.82 | 1.848 | 2.75 | -0.03 |
| v10 | 10 | 4.78 | 4.776 | 2.09 | 0.00 |
| v11 | 9 | 4.97 | 4.968 | 1.81 | 0.00 |
| v4b (new) | 8 | 3.00 | not made | 2.67 | see M5 |
| v6b (new) | 7 | 2.90 | not made | 2.41 | see M5 |
| v5b (new) | 7 | 3.00 | not made | 2.33 | see M5 |

All 16 cues are at or under 3.0 w/s on their windows (highest v4 at 2.86). No cue is over 90 characters. No two cues overlap. Each existing window equals its clip to within 0.05 s, so the windows were cut from the clip lengths and carry no slack.

Totals: ca12 71.6 s, ca12b 70.6 s, both within a couple of seconds of 70. See m6 for where they land after the fixes below.

Music: Gently Decaying is 187.224 s. 85.397 + 71.6 = 157.0 s, so the window ends 30 s inside the track. No gap over 0.3 s below -45 dB in the 72 s from 85.397. Distance to the used starts 66.314 and 104.478 is 19.08 s on both sides. Against the analysis (times relative to the start): loud 0 to 16.35, dip 16.35 to 24.5, loud 24.5 to 46.34, drop 46.34 to 54.5, lift 54.52. That suits the script: the dip sits under the red card and v2 to v4, the lift at 24.53 lands on the kit beat start (24.50), and the loud run covers kit to flip. The one miss is the drop (m2).

## Findings

### B1. ca12b `reader` (30.80-37.30): v5b and Yusuf's bark collide, and the beat cannot hold both

v5b "Or walk away, and watch the door." runs 30.95-33.95. The beat opens as the learner walks up to the reader and Yusuf's sight bark fires ("Sorry, can I help you there? Deliveries go via the desk.", cached clip 3.864 s, audible about 3.8 s). The bark fires on approach, so it will start inside the VO window. If it is held until the VO ends (33.65 allowing the 0.3 s rule), it runs to about 37.45, past the beat end at 37.30 and into Jun's tap. Add the walk to the reader (unmeasured, at least 2 s) and the step back (1 s): the beat needs about 7.3 s of content in 6.5 s.

Fix: shorten v5b to "Or walk away." (3 words, about 1.2 s, 30.95-32.15, over the walk). Start the bark at 32.4 or later, ending about 36.2; the step back fills 36.2-37.3. The "watch the door" half of the line is lost, but the picture carries it. If the bark has to stay as it is, extend the beat by 0.6 s and take it from the `talk` hold.

### B2. ca12b `tailgate` (37.30-45.80, the hero beat): 8.5 s holds about 12 s of audio and Jo is cut by the flip

Cached lengths: Yusuf "Delivery? Studio's straight through." 2.57 s (audible to 2.27, with a 0.67 s pause after "Delivery?"), Jo "Nobody checked. A uniform and a held door beat both." 4.56 s (audible to 4.23). Jo's `barkDelay` is 1800 ms from `ca12_tailgated`. If the event fires with Yusuf's pass bark, Yusuf ends at +2.27 s and Jo starts at +1.8 s, so the two overlap by 0.47 s (over the 0.3 s allowance). Jo then ends at +6.0 s. For Jo to finish before the flip at 45.80 the event must fire by 39.8, which is 2.5 s into the beat, and Jun's walk, the tap, the door hold and the learner's follow all have to fit in that 2.5 s. The script gives no such timing, and the Jun loop is not written. At the budgeted 8.5 s with a normal approach (Jun tap at about +2.0, event at about +3.5) Jo would end at about 47, cut off by the flip and talking over the E5 panel.

Fix, three parts:
1. Start the take with Jun already walking to the reader (move his loop start into the reader beat's tail), so the event fires by about +1.5 s.
2. Delay Yusuf's pass bark by 0.3 s or raise Jo's `barkDelay` to 2600 ms so they do not overlap. Scenario follow-up, not blocking the take, since either can also be fixed with a take trim.
3. Cut the 1.8 s silence out of the take with a hard cut (gameplay to gameplay is allowed). Then the whole run is: approach 1.5, event bark 2.3, Jo 4.3 starting 0.3 s later = about 8.4 s. It fits, but only just. Give the beat 9.0 s (see m2: it also puts the flip start on the music drop at 46.34).

### B3. `flip` (both cuts, 3.0 s): the E5 line cannot be read in the time

ca12: "The desk said yes on the phone, then opened the door for you. One call got you past both layers." is 19 words. ca12b: "You walked in behind a member of staff while the door held. Nobody had to say yes." is 17 words. At a silent reading speed of about 3.3 words per second plus 0.5 s to land on the panel, that is 5.6 to 6.3 s. At 3.0 s a viewer gets one sentence at best. At 9:16 and 0.5625 zoom (1x) the panel text is about 8 to 9 px tall in a 1080 px frame, which a phone will not render legibly. This is the line that carries the "what happened" turn now that Lorna's flip line is cut, and it has no narrator over it.

Fix: give the flip 4.5 s. Show the second sentence only if the panel allows it (ca12: "One call got you past both layers." 7 words; ca12b: "Nobody had to say yes." 5 words). If the panel shows both sentences, hold 5.5 s. In 9:16 add a burned caption of the line text, or a `src` inset of the panel at scale 2.6 as the queue shot does. Funding for ca12 (+1.5 s): door 9.0 to 8.0 (the 5 s grace hold can be jump-cut) and tailgater card 4.0 to 3.5 (v8a is 3.07 s and fits). Funding for ca12b: nothing to take, so let the cut run to about 72.6 s (see m6).

### M1. ca12 `lands`: the in and out points in the script do not match the take on disk, and the game subtitle still shows "up the stairs"

The script says "t06 16.6 to about 19.6" for D1. On the file in `~/video-takes-local/ca12/takes/t06_the_call.trimmed.mkv` (21.97 s) D1 starts at 15.01 (marker `line-start`) and "Go on then, I'll buzz you through." ends at 16.89 by silencedetect; there is a 0.45 s pause, then "Studio's up the stairs on your left." runs 17.34 to 19.08. In at 16.6 starts in the tail of "through" and out at 19.6 includes the stairs sentence the script means to cut. Usable good audio is in 14.85 to 17.20, which is 2.35 s, not the 3.0 s the beat has. The `talk` window 12.2 to 14.5 has the same problem: frames on this file show the choice menu at 12.2 but the player's own line (portrait with the label "playtest") from about 13.4, so 12.2-14.5 includes about 1.1 s of the test-account name. The script and r4b comments say the player line is at 14.54, which is true only for an older cut of the take. The r4b json and the script cite "24 Nov recapture" for t06 but the file's time stamp is 23 Nov 00:08 and takes_ca12.md lists 24 Nov only for t13 and t14.

Fix: re-read the marker file and set `talk` 12.2-13.35 (menu, then pick, out before the player portrait; or accept the player line and crop the name bar). `lands` in 14.85, out 17.20, hold the last frame 0.65 s for the 3.0 s beat or shorten the beat to 2.4 s. Also: in 16:9 the game's own subtitle bar shows the whole D1 text from line start, "Studio's up the stairs on your left" included, while the audio stops. A silent viewer reads the stairs text. Crop the bar out or accept the A1 mismatch; fix the ink line (script section 8) or burn the trimmed text in 16:9 as well.

### M2. `hook` and `topic`: tight on the audio, and the viewer sees Camila arrive twice

Hook is 4.60 s. Camila's cached clip is 4.584 s with speech from 0.30 to 4.12 (audible 3.83 s). In the take the bubble starts 0.4 s after the in-point and r4b placed the line at 0.8 s, so it ends at about 4.6 to 4.7: right at the hook cut and at v1 (4.70). r4b gave the hook 4.9 s; r3 took 0.3 s off. The new t16 take is not recorded, so there is no margin to measure.

Second problem: the hook is "Camila arrives at the studio desks after walking in" and `topic` (10.00-15.50) is her whole walk from the lobby edge, "through the gate (it opens for her), into the studio". A silent viewer sees her enter the studio at 0-4 s, then again at 14-15 s.

Fix: hook 4.9 s again (take 0.3 s from `open`, which has 5.4 s for v1 at 5.11); audio start at least 0.25 s into the hook; end the topic shot as the gate opens for her and she steps through, not on her arrival at the desks. Or make the hook the lobby bark if the kit mapping allows it.

### M3. ca12 `door` (33.80-42.80): five text and audio streams in 9 s, and the same point three times

In the beat: Delphine "I'll get the door for you." (cached, 1.34 s, audible to 1.06), Yusuf "Morning. Mind the step." (1.68 s, audible to 1.29), Jo's toast (20 words, text only: "The desk is the first layer. The door is the second. Watch how long it stays open, and for whom."), v6b "Two layers: the desk, then the door." (35.50-38.40) and v6 "You're in." (41.60-42.40). Then the flip line says "past both layers". Narrator, toast and flip all say "two layers". Timing risks:
- Delphine's bark fires at her walk start (about 34 to 35). That leaves 0.5 s before v6b at 35.50, or overlaps it if her walk starts late. Unmeasured.
- The toast needs about 6 s on screen to read 20 words. It fires on the door pass (about 38 to 40) and so lasts into the flip, or is cut. Nothing in the script says how long E4 shows it.
- Yusuf's pass bark lands on or just before v6 at 41.60 (0.3 s rule).
- At 9:16 and 1.125 zoom the toast sits in or out of a 540 px source window depending on its screen position.

Fix: drop the toast from ca12 (keep it for the hero ca12b, where it is voiced) or drop v6b; keep one "two layers" statement. If both stay, put v6b on the walk-round (34.2-37.1) before the pass and fire Yusuf's bark after 37.4. State the toast's display time in the script and confirm its position against the 540 px window.

### M4. ca12b: Jo's earpiece line has no caption in 9:16 or 1:1

Jo has no portrait or bubble: her line is a voiced toast whose live playback is "not yet proven" (script section 4). The CA caption rules burn a line caption only from `lines[]` on a dialogue shot, and she is offscreen. In 9:16, where the game subtitle bar is cropped out, a silent viewer gets the toast text if the toast is in the crop window and lasts the 4.2 s of the line, and nothing otherwise. This is the payoff line of the hero cut ("A uniform and a held door beat both.").

Fix: give the tailgate shot a `lines[]` entry for Jo with the speaker label "Jo (earpiece)" and `caption` true for 9:16 and 1:1; check the toast position against each crop. VO is clear of her: the nearest narrator cue in ca12b is v5b (ends 33.95) and then v8b (starts 50.95), 17 s apart.

### M5. The three new narrator lines are timed from an estimate that runs fast

The script estimates new speech at 2.35 w/s. Sulafat_v2 clips run from 2.1 to 3.3 w/s in audible time: v10 (10 words) 2.09, v3 (7 words) 2.43, v8a (6 words, colon) 1.95, v4 (8 words) 3.30 and v5 (5 words) 3.16. A clause with a colon and a comma runs slow (v8a). Estimates: v6b (7 words, colon) 2.9 to 3.1 s against a 2.90 s window; v5b 2.8 to 3.0 against 3.00; v4b (8 words, one comma) 2.4 to 3.0 against 3.00. v6b is the likely overrun. v4b and v6b both have to stay clear of the neighbouring cue starts and, for v6b, of Delphine's bark.

Fix: when the lines are voiced (needs a yes, three lines) measure, then trim in this order: v6b to "Two layers: desk, then door." (5 words), v5b as in B1, v4b to "It's a booked test. Dress the part." (7 words, a full stop speeds the read).

### M6. Panel shots: the integer scales are valid but three choices do not fit the panel, and small text is not insetted

Scale check (16:9 and 1:1 scale = zoom; 9:16 scale = 1.778 x zoom, so 0.5625, 1.125, 1.6875 are 1, 2, 3): every zoom in the script section 5 table is on the allowed list, and the NPC-chat rule is followed (1 / 1.125 / 1 for talk, lands, lorna_noblame). What does not fit:
- `build` "2 / 1.125 / 2 if the card fits": the pretext card in t05 is about 630 px wide and 600 px tall at source. At 2x the 16:9 window is 960 x 540 (too short), the 9:16 window is 540 px wide (too narrow) and the 1:1 window is 540 x 540. It does not fit in any aspect. Use 1 / 0.5625 / 1 with bars in narrow, plus an inset on the "What you found" lines.
- `research` at 1 / 0.5625 / 1: the browser panel is about 1090 px wide, which is 10 px more than the 1080 px 9:16 and 1:1 window, so the borders clip by about 5 px each side (acceptable, or accept a 2 px sliver of the game behind). The page text is about 8 to 9 px at 1x; the OSINT line ("On site all week again, so the sample boxes are stacking up at reception") is the point of the shot and is too small in 9:16. Add an inset on the note, or the shot is a 3 s picture of a page.
- `tailgater`, `queue`, `flip`: the script says "inset if needed". The queue panel is about 960 px wide, which suits 0.5625, but its text is about 8 px high in a 1080 px frame. The inset is not optional for 9:16 and 1:1; name it in the script so the beat's point (the four buttons, the heading "A visitor at the gate, no badge") is readable.

### m1. ca12b `reader`: "walk away" is never shown

v5b says "walk away" over a shot that opens on the learner already walking up to the reader. The previous beat ends on the call menu. A silent viewer has no walking-away to attach to the narrator caption. Fix: open the reader beat 0.6 s earlier on the learner leaving the kiosk, or add 1 s of the learner turning from the call at the end of `talk`.

### m2. Music: the drop at 46.34 lands 0.54 s into the ca12 blue card and the ca12b flip

The only section change in the loud run is the drop at 46.34 (relative to the start). ca12: blue card at 45.80, so the music drops 0.54 s into it. ca12b: flip 45.80-48.80, so the drop is 0.54 s into the join. The script plans to "move the flip onto the nearest strong hit"; there is no strong hit near 42.8 to 46.3, only the drop. Fix: with B2 and B3 applied, set the blue card (ca12) and the flip start (ca12b) on 46.34 by giving the door and tailgate beats the extra 0.54 s. The lift at 54.52 then falls 2.7 s into the ca12 queue and 3.7 s into the ca12b queue, both under v8b, which is where the first narrator line of the defend half wants it.

### m3. ca12 `door` and ca12b `tailgate`: "wide" at 2x

"Wide on the lobby side gate" and "low wide on the gate" are listed at 2 / 1.125 / 2. A 2x window is 960 x 540 (16:9), 540 x 960 (9:16), 540 x 540 (1:1) in source pixels. The door beat needs the desk, Delphine's route, the gate, Yusuf and the learner in one frame; 9:16 and 1:1 will not hold that at 540 px. Unmeasured until the dressing pass places Yusuf, the reader and Delphine's tile. Fix: say follow-cam for 9:16 and 1:1, or use 1x where the whole lobby is needed and drop the 2x map-shot rule for these two beats.

### m4. Close card: "Play the attack · Learn to stop it" is 34 characters

Cards are all within 28 except this: "You play the attacker" 21, "You run the front desk" 22, "Visitors and tailgating" 23, "Merrin & Sallow Architects" 26, "Learn on Hacktivity.co.uk" 25, chips "OPEN-SOURCE RESEARCH" 20, "COVER STORY" 11, "FRONT DESK" 10. The tagline is 34 characters on one line; the theme file says stacked, the tagline splits at the dot, which makes 15 and 16. Fix: record in the script that it stacks in 9:16 and 1:1 and is two lines of 15 and 16 characters.

### m5. Narrator gaps are tighter than in r4b

r4b had 0.25 s between cues. r3 retimed to the new cards and the gaps between actual clip ends and the next start are v1b to v1c 0.13 s, v1c to v2 0.16 s, v3 to v4 0.12 s, v8b to v9 0.16 s, v9 to v10 0.15 s (and v1c's clip, 3.24 s, runs 0.04 s into the red card at 15.50). The windows are built from clip lengths, so any gap is a gap of spoken sentences. Fix: not blocking; re-time with the clip lengths at edit time and put 0.25 s between cues where a card allows. Candidates: v1b to 10.10 and v1c to 12.45, v4 to 21.55.

### m6. Totals after the fixes

B3 adds 1.5 s to ca12 (funded in the fix) and about 2 s to ca12b; B2 adds 0.5 s. ca12 stays 71.6 s, ca12b goes to about 73 s. The defend half cannot give time back: the queue is 10.4 s and v8b, v9, v10 fill it with no spare. If 73 s is too long, the cheapest 2 s in ca12b is the `reader` bark (B1 option with "Sorry, can I help you there?", the 1.73 s clip already cached, but it is not the mapping's text).

### m7. `kit` (24.50-28.50): the sprite change should land on "part"

v4b runs 24.70-27.70 and "dress the part" is the last 1.0 s. The sequence is open the hook, take both items, confirm Wear, the sprite changes. Budget: open 0.5 s, show the letter and hi-vis 1.0 s, confirm 0.5 s, so the sprite change at about 27.5 on "part", then a 1.0 s hold to 28.5. The letter is what makes "booked test" true on screen; show it at 25.2 to 26.2. The kit beat has no seat chip in the script (the other attacker beats do): add one of 28 characters or fewer, for example "KIT BAG". The bag's position is unmeasured and the dressing pass comes first.

## Checked and clear

- **Words per second:** all 16 narrator cues at or under 3.0 on their windows.
- **Character lines against VO:** ca12 hook, lands, queue and Lorna have no VO over them. v1c ends at the red card, v2 starts 0.2 s later. Lorna L5 (clip 3.288 s, audible to 2.93): ca12 at 62.39 to 65.3, v10 ends 62.15 (0.24 s clear), v11 at 66.30. ca12b the same minus 1 s (v10 ends 61.15, L5 from 61.39). `lorna_noblame` in = 16.32 on the 24 Nov t14 (L5 starts 16.51, chat closed 20.30): correct for the recapture.
- **Jo's line against VO (ca12b):** clear by 17 s either side.
- **Music window:** 157.0 s of 187.2 s, no gap, 19.08 s from the nearest used starts, lift on the kit start.
- **Cards at 28 characters or fewer:** all but the close tagline (m4).
- **Beat sums:** both tables add to their totals; `lorna_noblame` (3.9 s) and `queue` (10.4 s) come from clips with room (take 21.8 s and 15.97 s).
- **Existing takes:** t04 (4.9-7.9, take 11.03 s), t05 (5.3-8.3, 9.84 s), t12 (5.9-9.9, card open from 5.63 s, take 18.3 s) and t11 (5.08-15.48, 15.97 s) all have the footage; the rest of ca12's footage is unrecorded.
