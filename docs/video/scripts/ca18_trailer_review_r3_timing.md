# ca18 trailer script: silent read and timing review, round 3 (25 Nov)

Reviewer: Sonnet (silent read and timing). Scope: `ca18_trailer_script.md` as of commit 86377d08e (after the round 2 sell and truth fixes), `takes_ca18.md`, `CA_MOVEMENT_B4.md`, `recipes/course-trailer.md`. Review only; the script is not edited.

Result: **0 B, 1 M, 5 m.** Total 71.5 s holds (the table sums, and the row times agree). Nothing has to go.

How the fit was measured: `ffprobe` on the trimmed levelled clips in `~/video-takes-local/ca18/vo/Sulafat_v2/trim/` (audible lengths). The two changed lines have no clip yet; their lengths are estimates from the nearest voiced lines. Fit rule: 0.2 s lead + audible + 0.15 s tail, 0.25 s between cues.

## Narrator fit

| line | text | audible s | need s | slot s | spare s |
|---|---|---|---|---|---|
| v1 | Hacktivity Cyber Aware: Security awareness training you can play. | 5.02 (new text; 5.11 levelled) | 5.02 placed at card start | 5.1 | 0.08 |
| v1b + v1c | This practice lists its staff online. / This episode: password guessing at scale. | 2.64 + 3.02 | 0.2 + 2.64 + 0.25 + 3.02 + 0.15 = 6.26 | 7.0 | 0.74 |
| v2 | First, you play the attacker. | 2.40 | 2.75 | 3.0 | 0.25 |
| v3 | Their website gives the staff and the address pattern. | 3.79 | 4.14 | 5.0 | 0.86 |
| v3b | Then the words the practice uses. | 2.26 | 2.61 | 4.0 | 1.39 |
| v4 | Turn them into a staff list and a word list. | 3.14 | 3.49 | 5.5 | 2.0 |
| v5 + v6 | Try one password on every account, so nothing locks. / Some of them open. | 4.27 + 1.15 | 6.02 | 7.0 | 0.98 (see M1) |
| v7 (new) | Defend the practice. | about 1.4 est (v8b, 4 words, 1.25; v2, 5 words with a comma, 2.40) | 1.75 | 2.4 | 0.65 |
| v8a | Six alerts have landed in your inbox. | 2.42 | 2.77 | 4.0 (list hold) | 1.23 |
| v8b | Is this one real? | 1.25 | 1.6 | 5.0 (card hold) | 3.4 |
| v10 (new) | At Lorna's desk. | about 1.3 est ("Then, at Lorna's desk." measured 1.73, minus "Then," and its stop) | 1.65 | see m1 | |
| v11 | Play the attack, learn to stop it, on Hacktivity.co.uk. | 4.97 | 5.32 | 5.5 | 0.18 |

The script's fit paragraph overstates some reads (v4 "about 4.0 real", v3b 2.96, v8a 3.40) but never understates one; no line fails.

## Findings

### M1. spray: the shot window is not pinned to marks, and v6 needs the result row inside 5.5 s (shot `spray`)

v5 runs 0.2 to 4.47 s, then v6 (1.15 s) goes at the `result` mark plus 0.2 s and must end by 6.85 s, so the result mark must fall between 4.52 s and about 5.5 s into the shot. The take plan has four passes stepped "one by one" at about 1.6 s each in the throttled dry run (`takes_ca18.md`, "Left unverified"), which puts the result row at about 6.4 to 6.6 s if the shot opens on pass 1, and v6 would end near 7.8 s, 0.8 s over the slot and into the flip. The script gives the shot a fixed 7.0 s and a mark rule for v6 only; it does not say where the shot opens or what happens if the passes run slow. The throttled timing is an estimate and may be faster unthrottled, which is why this is M and not B.

Fix: pin the shot to marks. In = `pass-1` start minus 0.3 s; out = `result` plus 1.5 s (v6 plus tail), and state that the passes must reach `result` within 5.5 s of the in-point (set the take's pass pace to about 1.0 to 1.1 s; the script already sets the passes by hand, so this is a constant). If the real take is slower, the slot grows to a maximum of 7.5 s by taking 0.5 s from `build` (it has 2.0 s of unused VO time) rather than cutting v6. Report the measured `result` offset in the takes table once recorded.

### m1. v10 sits on the panel, not on the desk (shot `lorna_end`, v10)

The shot opens on the Look up panel (heading and button) from `press` minus 0.8 s; Lorna's room appears at `press`. v10 "At Lorna's desk." is placed at in + 0.2 s, which is `press` minus 0.6 s: it is spoken over 0.6 s of panel and the room only appears on "desk". With a silent viewer the caption "At Lorna's desk." reads against a text panel. Fix: place v10 at in + 0.7 s (`press` minus 0.1 s). At about 1.3 s it ends near `press` + 1.15 s, which is 0.4 s clear of the earliest L1 audio start (`press` + 1.56 s), still above the 0.2 s rule and above the 0.14 s fallback threshold in the notes. Keep the check "L1 audio start minus v10 end at least 0.2 s" in the dry run. The shot length does not change: 0.8 + about 1.62 + 3.40 = about 5.8 s (L1 audio start measured 1.56 to 1.68 s, so 5.76 to 5.88 s).

### m2. v1 fit note stale; clip not yet in the ca18 folder (shot `open`)

The note says v1 is "4.70 s real ... place at card start plus 0.2 s and trim the mp3 to its audible ends (0.05 s spare)". That was the old line. The new text trims to 5.02 s with its 0.08 s preroll in the file; at +0.2 s it ends 0.12 s past the 5.1 s card and about 0.08 s from v1b at topic + 0.2 s. Fix: "place at card start, no offset (5.02 s, 0.08 s spare); do not trim the preroll". The files in `~/video-takes-local/ca18/vo/Sulafat/` and `/trim/` are still the old-text clip (md5 unchanged from ca02); copy ca12's new v1 across before rendering. Caption break: "Hacktivity Cyber Aware: Security" / "awareness training you can play." (32 / 32).

### m3. Hook crop leaves the chat close button in frame (shot `hook`)

`takes_ca18.md`: the portrait view's close "x" sits at about (1890, 30); the picture area is given as y 20 to 940, so the "x" is inside the crop. Fix: crop from y 60 (or mask the corner) so no UI chrome shows in a cold open that is 3.6 s long. The cut itself is sound: in = line 2 audio start minus 0.15 s sits 0.45 s after line 1 ends (0.6 s gap); out = speech end + 0.2 s is inside the 3.41 s clip (speech 0.29 to 3.06), hold the last frame 0.2 s as the script says.

### m4. ama_flip: confirm no menu or A5 text on the first and last frames (shot `ama_flip`)

In = A6 audio start minus 0.15 s is 0.35 s clear of A5's end (A6 starts 0.5 s after it), so the audio is clean. The last frame is A6 audio start + 6.05 s, 0.12 s past the clip end (5.93 s, speech ends 5.58); the doc closes the chat "before the menu" but gives no delay, so a menu could flash in that 0.12 s. Fix: add to the take checks: frame at A6 end + 0.12 s shows no menu, and the first frame shows no leftover A5 caption in the portrait bar (the bar is cropped for the edit, but the burned caption must start with A6's words, from 0.23 + 0.15 s).

### m5. topic: a static page for 7.0 s (shot `topic`)

The People page is held 7.0 s with nothing noted, the longest shot with no change on screen; the VO (6.26 s) justifies the time. Silent read: the viewer sees a staff list and two captions and nothing moves. Fix: let the take scroll the list slowly through the 7 s (a camera move on the page, not a click, so nothing is pressed or noted), or hover each name in turn; the narration ("This practice lists its staff online.") then lands on names being passed over. If the take cannot do it, cut the shot to 6.5 s and keep the VO, which leaves 0.24 s spare. The `research` shot then opens on the click that notes the team line, as the script says.

## Checked and clear

- **Windows and hazards.** Hook: Ama line 2, speech 0.29 to 3.06 of 3.41 s; the cut sits in the file tail. `ama_flip`: A6 speech 0.23 to 5.58 of 5.93 s; the shot is audio start minus 0.15 s to plus 6.05 s; the two timed caption entries split at 2.83 to 3.08 s (the 3.74 to 3.92 s pause is mid-clause and not used). `alerts`: genuine 08:54 Fenlow card framed on subject, From, To, Time and "Hello," only, verdict buttons below the crop, cursor off the 09:06 row, advisory and brief paragraphs and the badge out of frame; nothing pressed. `lorna_end`: mark-driven (in = `press` minus 0.8 s, out = L1 audio start + 3.40 s; L1 speech 0.21 to 3.20 s of 3.58 s, so the cut is 0.2 s after speech); L2 starts about 7.0 s after the press, so it is never heard; the bubble is hidden and L1 is burned in.
- **No cut inside an NPC's own bark.** A2, A6 and L1 each end 0.2 s after speech, inside the cached clip.
- **No narrator over a cast line.** Hook and flip carry no VO; v7 starts 0.2 s into the blue card, 0.67 s after A6's speech ends; v10 ends well before L1 (m1).
- **Caption lengths** (two lines of at most 32, no one-word last line): v7 "Defend the practice." 20, v10 "At Lorna's desk." 16, both one line; the others are listed in the script.
- **Sound off.** The hook is captioned; the title card names the episode; the staff list and "Noted" lines show the research; the guesser fills; the result row reads "3 of 5 accounts opened" without the VO; the flip heading says "Now it's your inbox."; Ama's captions carry the turn; the blue card names the job; the Fenlow card sets up Lorna's line, which is captioned. The VO and the picture agree on every shot. The flip (2.4 s) is silent but its heading is the line.
- **Total.** 3.6 + 5.1 + 7.0 + 3.0 + 5.0 + 4.0 + 5.5 + 7.0 + 2.4 + 6.2 + 2.4 + 9.0 + 5.8 + 5.5 = 71.5 s and the row times agree. M1 can move up to 0.5 s between `spray` and `build`, so the total does not change.

## What should go

Nothing. The slack is in `build` (2.0 s of unused VO time, needed to show the fills) and `topic` (0.74 s); neither is worth cutting for 1 to 1.5 s. 71.5 s sits inside the 70 to 75 s brief.

## Voicing list: estimated lengths

| new line | est audible | slot | note |
|---|---|---|---|
| v7 "Defend the practice." | 1.4 s | 2.4 s blue card | 0.65 s spare; starts 0.67 s after A6's speech ends |
| v10 "At Lorna's desk." | 1.3 s | placed at in + 0.7 s (m1) | ends about `press` + 1.15 s, 0.4 s before L1 |

Measure both after voicing and replace the estimates in the fit paragraph.
