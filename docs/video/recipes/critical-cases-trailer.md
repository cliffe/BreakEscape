# Recipe: Critical Cases trailer (60 s)

**Incident Simulations: Critical Cases only** (`collection: cybok_sis`: sis01_healthcare, sis02_energy, sis03_cyber_insurance). Adapted from `mission-trailer.md` (the shape: a story with a clock and stakes) for a separate product line (`GUIDELINES.md`, "Product lines"). Owner, D318: "It's a different category, but also create trailers for them." House rules (pixels, joins, captions, loudness) stay as in `GUIDELINES.md` and `README.md`; this file only says what differs.

Status: pilot draft from sis01 (23 Nov 2026), round 1 after the Opus sell and truth and Sonnet timing reviews. Every open choice is marked PLACEHOLDER (owner question) with a recommendation.

## Purpose

Sell one case to a player who knows nothing: the place, the people, what the attack is doing to patients or the site right now, the decisions the player has to make and the clock. Then "Play now". These are story missions, not courses: no "you play the attacker" structure and no teaching narration.

Each cut is judged against these five:
1. the human stakes (patient safety in sis01, site safety in sis02, the claim and the client in sis03);
2. the investigation (the minigames);
3. the competing obligations (who has to sign, who has to be told);
4. the clock;
5. the case's own mechanic: the rule or device that shapes the player's decisions and can be shown without spoiling. When the case's signature device is the mid-case discovery (sis01: the drug library), card the obligation instead (sis01: two signatures). The scout names the mechanic candidate in its headline, picked from the case's own minigames and ink (sis02 and sis03 included).

## Brand

- On screen: "Incident Simulations: Critical Cases" and the case name. **Never** SAFETYNET, HaX, ENTROPY, Cyber Aware or "Break Escape".
- PLACEHOLDER (owner question) A, the skin: a neutral corporate skin, as for CA but its own (slate background, one accent, Press Start 2P text, no glitch reflection, no keyhole, no red hex curtain). The joins are a pixel dissolve by default, with glitch kept for the hook-to-title join only. Recommendation: build a theme proposal page first (title, one content card, end card, music), as `GUIDELINES.md` requires for a new line, before any cut. The case accent comes from the scenario (sis01: clinical blue; sis02: hazard amber; sis03: insurer green).
- PLACEHOLDER (owner question) B, the music: the game's own sets only. Recommendation: `CutScene` under the hook and title (the cases play it during their opening cutscenes), then `Noir` for the investigation. No SpyAction: it is the SAFETYNET sound.

## Beat sheet (about 60 s, cap 65 s)

| Time | Dur | Beat | Content | Join in |
|---|---|---|---|---|
| 0.0 | 4 to 5 | Hook | a real cast line on the stakes, cut at a measured sentence end; it starts inside the first 5 s | cut |
| ~5 | 2 to 3 | Set piece | what the line points at (sis01: the ransom note on the ward monitoring station), with the line's next sentence carried over the cut | cut |
| ~8 | 4.5 | Title card | "Incident Simulations" / "Critical Cases", then the case name (two phases, one card) | glitch (hook only) |
| ~12 | 6 to 8 | Who it hurts | the named person at risk and the evidence on screen (sis01: Mr Ahmed and the Bed 4 monitor) | dissolve |
| ~20 | 1.5 | Card | story card in the case's own words | dissolve |
| ~21 | 4 | Montage A | the first-room minigames, hard cuts of 1 to 2 s | dissolve, then cut |
| ~25 | 5 | Responder line | the first person who asks the player to decide | cut |
| ~30 | 1.5 | Card | the investigation | dissolve |
| ~31 | 4 | Montage B | the investigation tools, answers cropped | dissolve, then cut |
| ~35 | 1.67 | Card | **names the case's mechanic or obligation** (sis01: `Two / Signatures`). The shot or line straight after it must show or say the mechanic (sis01: Ravi, "I can't sign that alone.") | dissolve |
| ~36 | 1.9 | Mechanic line | the line or shot that pays the card off | cut |
| ~38 | 9 | Two voices | two lines that pull one decision in opposite directions (contain now against keep the wards running, pay against restore), not two job titles; one line each, about 4.5 s each, hard cut between them. Name plates (a burned overlay, Press Start 2P, 1.5 s from each speaker's first frame) are a new device for this line: mission trailers use the game's own bar. Show one on the theme proposal page | dissolve, then cut |
| ~46 | 1.5 | Card | the clock | dissolve |
| ~48 | 3 to 3.5 | Crescendo | a quick cut of every minigame in the case, plus a face flash for each NPC who has no line, accelerating (2 x 0.5 s, 4 x 0.25 s, then 4-frame cuts) | dissolve, then cut |
| ~51 | 3 to 4.5 | End line | the most interesting line in the case, about the cost of the player's decisions | cut |
| ~55 | 5 | End card | the case name; "Incident Simulations: Critical Cases"; "Play now on Hacktivity.co.uk" | dissolve |

Cards are 50 frames at 30 fps (1.67 s), short lines (about 12 characters). Story cards use the case's own words. The mechanic card names the mechanic. All shot lengths are whole frames at 30 fps, and the script states the total in frames. Cast windows: in = speech start minus 0.2 s, out = speech end plus 0.15 s. Montage shots carry a small burned label ("Infusion pump", "Remote access log") so the silent read works.

PLACEHOLDER (owner question) C, the end card. It shows the case name, then "Incident Simulations: Critical Cases", then "Play now on Hacktivity.co.uk". Recommendation: those three lines, with the Hacktivity Games logo assembled as in the SAFETYNET close but on the neutral plate and without the curtain. The house CTA is "Play now".

## VO

- PLACEHOLDER (owner question) D, narrator VO. Recommendation: **none in sis01 and sis02**. The cast carry it, and the cases have their own cached cutscene narrator (sis01: Schedar, `narrator` sidecars), which counts as a cast line. If the owner wants narration, it is Sulafat (calm, warm British presenter) at 2.3 words a second plus 0.3 s per internal stop, a 0.2 s lead and 0.15 s tail per shot, and 0.2 s clear of every cast line. Its use is capped at the title ("Incident Simulations: Critical Cases.") and the end card ("Play now, on Hacktivity.co.uk."). sis03 may need it more (fewer short lines).
- Cast lines must be cached: a sidecar in `tts_cache/<scenario>/*.json` with matching text, and the line still in the current ink (grep it). Measure every clip at `nice -n 19` with ffprobe and `silencedetect=noise=-35dB:d=0.15`, then cut at a sentence end found in the silences, never inside a word. A pause inside a sentence is not a cut point.
- A long line can be split over two pictures at its sentence break: the audio runs on and the picture cuts on the pause (sis01 hook).
- New lines are allowed (`mission-trailer.md`, "Write a better line"), with the same gates: the owner's pick, `npc-dialog-review`, then a yes for TTS.

## Spoilers and truth

- Off, even for 3 frames: spoken answers, codes, passwords, flags, the correct dose or rate, the anomalous log row, solution steps, choice screens and their consequence panels, verdicts, grades, the debrief, credits and outcome barks (deaths, "crash call"). Crop or hide these in the take with CSS; drop the shot if no crop removes them.
- Stakes are welcome (a patient at risk, a site at risk), without gore and without real people. Use NHS-style naming only as the scenario does. Show no real organisation's branding, and nothing that implies a real incident.
- Name each person (caption name plate or an earlier line) before a line depends on them. Gloss jargon on screen or avoid it (ICO, SIEM, CIO). Nothing is pointed at ("that screen") before it is shown. Every claim must be true to the game.
- PLACEHOLDER (owner question) E, the mid-case discovery (sis01: the tampered drug library). Recommendation: hint at it (the pump, a scan running) but never show the failing row, the diff or the line that says it was changed. "Hint, never show" needs both crops in place: the pump framed on the keypad and entry row only, with the `LIBRARY RANGE` row and the prescription panel cropped out in the edit (they are canvas text, so CSS cannot reach them); and the drug library checker framed on the title, the status bar and rows 1 to 5, never the MORPHINE row (the table is drawn in full from the first frame, so a cut before the fail is not enough).
- **sis03 is VM-backed.** Use in-game footage only. Never open SecGen XML or the exploit field guides, and never script or describe VM steps. A console shot, if wanted, is a placeholder card reading "VM console footage (owner question)".

- PLACEHOLDER (owner question) F, real public bodies on screen. The ICO (HUD and tablet), NCSC and NHS England (ink) and "NHS Trust" (pump header, ransom note) appear as text. Recommendation: name them only as the scenario does, as text, and never show their logos or any branding. Also never show the scenario's real-world-looking ransom details (wallet, group name, onion address): mosaic them.

## Speech display and engine facts

- The person-chat bar and bark bubbles print the whole ink line. Crop the bar and the choice buttons (portrait at x about 0.70, speaker in the upper two thirds) and burn a Press Start 2P caption for just the sentences used, timed by silencedetect. Check that no hub choice or item-received toast is on screen. Canvas panels (Phaser text, such as the infusion pump and the drug library checker) cannot be hidden with CSS: crop them in the edit, in every aspect. Faces in a crescendo are chat portraits with the bar cropped, never walking sprites. Hide bark bubbles in a take with the HIDE_BUBBLES patch (Phaser containers) and mute the bark audio.
- Two NPCs' barks overlap; one NPC's barks queue. A bark's audio is cut when a chat opens. `--set` does not fire events (timers, `setVisible`, patrol overrides). Cooler chatter needs two NPCs pairing: don't rely on it.
- Fresh game per take; `__test.throttleFps(20)`; never `fixedStep=false`.

## 9:16 and 1:1

Every wide panel (EHR and desk phone included) gets a narrowed-panel take (`max-width: 560px` on the panel root, one extra run), named `tNNb_<shot>_narrow`. Portrait shots and room shots are framing checks (the speaker in the upper two thirds). Burned captions on both; `.srt` always. Render 16:9 first.

## Stage skills, in order

1. `video-scout`: `docs/video/scout/<sis>_scout.md` (shots, entry states, measured lines, spoiler calls), then `docs/video/scripts/<sis>_trailer_script.md`. Script review rounds per `trailer-script-rounds` (Opus sell and truth, Sonnet timing).
2. The theme proposal page (question A) via `video-review`, before any edit.
3. `video-takes`: one script per shot in `tools/video/takes/<sis>/`.
4. `video-edit`: selects, beat grid, the edit list, lint, renders.
5. `video-stills` in parallel if wanted.
6. `video-review`: one page per round at the same link.

## Review questions (put these on the review page)

1. Verdict: ship, revise or rethink?
2. Does the hook land in the first 5 s, and is it the right line?
3. The title and end cards: right series name, case name and "Play now on Hacktivity.co.uk"?
4. Does the skin read as its own line, clearly not SAFETYNET or Cyber Aware?
5. Who it hurts: are the stakes clear without being grim?
6. The two-voices beat: do both sides of the trade-off come across?
7. The cards: right words, and does the mechanic card name the mechanic?
8. The crescendo: every minigame there, every NPC without a line seen?
9. Is anything on screen an answer, a verdict, an outcome or a spoiler you can see?
10. Narrator VO: none, title and close only, or more?
11. Music: right sets?
12. The end line: is it the most interesting line in the case?
