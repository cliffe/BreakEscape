# ca12 and ca12b trailer script, round r3 (Visitors and tailgating)

Status: outline and script, round 2, 26 Nov 2026. No edit list, no take scripts, no new TTS yet. Replaces the pilots r2 cuts (`tools/video/edits/ca12_trailer_r4.json` = ca12, `ca12_trailer_r4b.json` = ca12b) once AC0 signs it off. The owner has approved both shapes, and **ca12b leads**; ca12 is the fallback.

Owner's verdict on pilots r2 (25 Nov, via AC0): "Rethink: Needs updating with the new content."

## 1. What changed from r2, and why

**What ca12 and ca12b were in r2.** Two cuts of one trailer. ca12 (71.96 s) had no physical entry: the call landed and "You're in." played over the flip. ca12b (74.96 s) was the same cut with a 3 s clip from the physical pen test lab spliced in after the call. Both had a silent bed.

**Why they no longer work.** The owner asked for a real disguise and slip-past-the-guard mechanic inside ca12, with the trailer rebuilt on ca12's own footage. That content now exists in the scenario or is being built (E1, E4):
- Jo Fairweather (`ca12_jo`, Northlight Security) leads the red team. The brief frames the run as a booked test signed off by the partners, with a letter in Jo's kit bag. Jo is an offscreen voiced NPC (Leda, Glaswegian).
- Jo's kit bag in the studio holds the authorisation letter and a courier's hi-vis the learner puts on (the sprite changes).
- After the call the learner stays in the lobby. The studio door becomes a side-door gate (E1) with a badge reader, and Yusuf Demir, the building's security officer, patrols beside it.
- Two ways through. **Desk pass**: Delphine says yes, walks round and holds the door, and Yusuf waves you on. **Tailgate**: skip the desk, wait for Jun Watanabe to badge through, and follow him in while the door holds; Yusuf waves the courier through and Jo comes in over the earpiece.
- At hand-back the hi-vis comes off (E4 `take_off`).
- The flip names what happened (E5, `flipDefenderLineByGlobal`).
- NPCs walk in and out of rooms, so Camila's appearance becomes a walk-in from the lobby, through the gate, to the studio.

**So r3** drops the lab clip, adds two attack beats (the kit and the door), and turns the old A/B question into a question about routes: **ca12 = the desk pass**, **ca12b = the tailgate**.

## 2. Shape

- The attack half has six beats: research, build, **kit**, talk, then **lands + door** (ca12) or **watch + tailgate** (ca12b).
- The cut opens on movement: Camila walks past the guard and through the door in the first 3 s, then says her line.
- The red chapter card carries three bullets that make the authorisation visible with the sound off.
- The flip holds long enough to read (5.0 s ca12, 5.45 s ca12b) and is silent. The blue card is voiced.
- Lorna's flip line is cut from both cuts; the door beat and the E5 flip line carry the turn.
- ca12b drops the defend-side tailgater card (the tailgate has just been shown from the attacker's seat).
- Music: PeaceFolk "Gently Decaying" from 85.397 s (section 6). Cards sit on its bars where the beats allow.
- Unchanged: Camila's hook line (re-voiced, section 4), the ca-open tagline, the red and blue chapter cards, the defend queue, Lorna's no-blame line and the close.

Lengths: **ca12b 77.0 s**, **ca12 79.0 s**. Both run past r2 because the flip needs reading time and the hero beat needs room for three voices. The cheapest cuts if AC0 wants about 74 s: drop v1c and shorten `topic` to 2.5 s (−3.2 s, the open card already shows the title), and in ca12 drop the tailgater card (−3.5 s).

Existing takes are measured (section 5.1). New takes (t16 to t21) are budgets; the retime happens from their marks.

### ca12b, the tailgate (77.0 s, lead)

| # | Time (s) | Beat | Seat | Content |
|---|---|---|---|---|
| 1 | 0.00-8.18 | hook | full | Camila crosses the lobby while Yusuf is at the far end of his loop; the gate opens for her and she steps through (0.00-3.00). Hard cut to her arrival at the studio desks; her line from 3.15 |
| 2 | 8.18-13.58 | open | neutral | ca-open: Visitors and tailgating / Merrin & Sallow Architects, stripe #6b4c9a |
| 3 | 13.58-19.28 | topic | full | the same take, after she is through: the gate swings shut, Yusuf walks back towards the reader, Delphine at the desk. The lobby's two layers in one frame |
| 4 | 19.28-23.78 | red_card | attack | "You play the attacker", bullets build on the music hits: "A booked test, signed off" (19.28) / "Scope: the desk and the door" (20.45) / "Challenged? Step back" (21.81) |
| 5 | 23.78-26.78 | research | attack | OSINT note, chip OPEN-SOURCE RESEARCH |
| 6 | 26.78-29.78 | build | attack | pretext card filling, chip COVER STORY |
| 7 | 29.78-33.78 | kit | attack | Jo's kit bag, chip KIT BAG: open the hook (29.78-30.20), letter inset with tab AUTHORISATION (30.20-31.50), take the hi-vis, confirm Wear, the sprite changes on the 32.71 hit, hold to 33.78 |
| 8 | 33.78-35.48 | talk | attack | the call: Delphine's portrait, the choice menu, the INFLUENCE meter, chip FRONT DESK; out before the player's own line |
| 9b | 35.48-39.98 | watch | attack, full frame | the learner turns from the counter and walks to the street window, clear of Yusuf; Jun comes into frame heading for the reader in the last 1.5 s |
| 10b | 39.98-49.07 | tailgate (hero) | attack, full frame | Jun taps the reader ("Morning, Yusuf.") and goes through; Jo's door toast appears as the gate opens; the learner follows him in while it holds; Yusuf waves the courier on; Jo in the earpiece |
| 11b | 49.07-54.52 | flip | flip join | hand-back; the kiosk flips to Defend; heading "In behind a member of staff" and the E5 line, silent |
| 12b | 54.52-57.02 | blue_card | defend | "You run the front desk" |
| 13b | 57.02-67.62 | queue | defend | visitor queue: courier, colleague back from leave, hover over the four buttons, nothing pressed |
| 14b | 67.62-71.52 | lorna_noblame | defend | Lorna L5 |
| 15b | 71.52-77.02 | close | neutral | ca-close, tagline stacked "Play the attack" / "Learn to stop it", plate "Learn on Hacktivity.co.uk" |

### ca12, the desk pass (79.0 s, fallback)

Beats 1-8 as ca12b (0.00-35.48). Then:

| # | Time (s) | Beat | Seat | Content |
|---|---|---|---|---|
| 9 | 35.48-38.88 | lands | attack | Delphine says yes (D1, re-voiced; section 4) |
| 10 | 38.88-47.98 | door | attack, full frame | Delphine leaves the desk ("I'll get the door for you.") and walks round; she holds the gate; Jo's door toast appears; the learner walks through past Yusuf ("Morning. Mind the step.") |
| 11 | 47.98-52.98 | flip | flip join | hand-back; the kiosk flips to Defend; heading and the E5 line only (the replay list masked), silent |
| 12 | 52.98-55.48 | blue_card | defend | "You run the front desk" |
| 13 | 55.48-58.98 | tailgater | defend | Unknown visitor 09:12 card |
| 14 | 58.98-69.58 | queue | defend | as ca12b beat 13b |
| 15 | 69.58-73.48 | lorna_noblame | defend | Lorna L5 |
| 16 | 73.48-78.98 | close | neutral | as ca12b |

## 3. Narrator VO (Sulafat_v2)

Rules: at most 3.0 words per second over the cue window, UK English, no em or en dashes, no narrator line over a character line, at least 0.25 s between cues where a card allows. Every cue is also a burned caption. Clip lengths are measured from `~/video-takes-local/ca12/vo/Sulafat_v2/trim/`; new cues are estimates and are re-timed when voiced.

| Cue | Cut | Window (s) | Line | Words | w/s | Clip |
|---|---|---|---|---|---|---|
| v1 | both | 8.28-13.39 | Hacktivity Cyber Aware: Security awareness training you can play. | 9 | 1.76 | 5.112 s |
| v1b | both | 13.68-15.70 | Nobody checks she's expected. | 4 | 1.98 | 2.016 s |
| v1c | both | 15.95-19.19 | This episode: visitors and tailgating. | 5 | 1.54 | 3.240 s |
| v2 | both | 19.48-21.88 | First, you play the attacker. | 5 | 2.08 | 2.400 s |
| v3 | both | 23.88-26.76 | Dig into what staff post in public. | 7 | 2.43 | 2.880 s |
| v4 | both | 26.93-29.68 | Build a cover story from what you found. | 8 | 2.91 | 2.424 s, caption held to 29.68 |
| **v4b** | both | 29.98-32.98 | Booked and signed off. Now dress the part. | 8 | 2.67 | **new**, est. 2.6-3.0 s |
| v5 | both | 33.78-35.48 | Then talk your way in. | 5 | 2.94 | 1.584 s, audio 33.80-35.38 |
| **v5b** | ca12b | 35.63-38.63 | Or skip the desk, and watch the door. | 8 | 2.67 | **new**, est. 2.7-3.0 s |
| **v6b** | ca12 | 40.30-43.20 | Look the part, and she holds the door. | 8 | 2.76 | **new**, est. 2.5-2.9 s |
| v6 | ca12 | 47.00-47.80 | You're in. | 2 | 2.50 | 0.744 s |
| **v7** | both | 54.67-57.02 / 53.13-55.48 | Now swap seats. | 3 | 1.28 / 1.28 | **new**, est. 1.0-1.3 s |
| v8a | ca12 | 55.63-58.70 | Tailgating: slipping in behind a badge-holder. | 6 | 1.95 | 3.072 s |
| v8b | both | 57.17-60.46 / 59.13-62.42 | Decide who gets in, and who gets checked. | 8 | 2.43 | 3.288 s |
| v9 | both | 60.71-62.56 / 62.67-64.52 | You've used these tricks yourself. | 5 | 2.70 | 1.848 s |
| v10 | ca12 | 64.77-69.55 | Check the list. Escort them. Badge in. Lock your screen. | 10 | 2.09 | 4.776 s |
| **v10b** | ca12b | 62.81-67.59 | Check the list. Escort them. Don't let anyone follow you in. | 11 | 2.30 | **new**, est. 4.2-4.8 s; if it runs over 4.78 s, use v10 |
| v11 | both | 71.72-76.69 / 73.68-78.65 | Play the attack, learn to stop it, on Hacktivity.co.uk. | 9 | 1.81 | 4.968 s |

Where two windows are given, the first is ca12b and the second ca12.

Truth checks:
- v1b: Camila is on the gate's `openFor`, and the take times her crossing for when Yusuf is at the street-window end of his loop, so nobody on screen checks her.
- v4b: the brief says "This is a booked test, signed off by the partners"; the letter reads "Merrin & Sallow has engaged the bearer to test physical entry at the studio door today. Signed, Julian Sallow, Partner."
- v5b: the tailgate route runs only on the `walked_away` outcome, which the learner gets by leaving the desk ("Not to worry, I'll leave it at the desk."). The choice is on screen in the talk beat's menu.
- v6b: on `got_it` Delphine holds the door only when the hi-vis is worn; without it she turns the learner back.
- v7: the hand-back moves the learner from the attacker's seat to the desk.
- v10b: matches the defend half's held-door lesson and the scenario's factor text on tailgating.

## 4. Character lines

"Cached" means a sidecar in `tts_cache/ca12_visitor_tailgater/` with this exact text (checked 26 Nov). Lengths are the cached clip.

| Beat | Speaker | Line | Source | Cached |
|---|---|---|---|---|
| hook | Camila Ospina | Hi, I'm Camila, here for Yasmin Chaudhry. She said to come straight through. | `_office_kit/ink/camila_ospina_ca12.ink:33` and the kit mapping bark (scenario.json.erb:1642) | **no: re-voice** (the cached clip, 4.584 s, says "straight up") |
| lands (ca12) | Delphine Arvanitis | Go on then. Studio's through the side door on your left. | `delphine_reception.ink`, `ask_reaction` result 1 (:107) | **no: re-voice** |
| door (ca12) | Delphine | I'll get the door for you. | Delphine eventMapping (got_it), bark (:2050) | yes, 1.344 s |
| door (ca12) | Yusuf Demir | Morning. Mind the step. | Yusuf pass bark, got_it (:2187) | yes, 1.68 s |
| door (both) | Jo (shown toast, not voiced) | The desk is the first layer. The door is the second. Watch how long it stays open, and for whom. | Lorna mapping 9 `hint` action (E4, not written yet); on screen 6.0 s (300 ms a word) | n/a |
| tailgate (b) | Jun Watanabe | Morning, Yusuf. | Jun reader bark (not in the shell yet) | **no: new (Puck)** |
| tailgate (b) | Yusuf | Delivery? Studio's straight through. | Yusuf pass bark, not got_it (:2194) | yes, 2.57 s, audible 2.27 s |
| tailgate (b) | Jo Fairweather (offscreen, earpiece) | Nobody checked. A uniform and a held door beat both. | `ca12_jo` eventMapping on `ca12_tailgated` (:1818) | yes (Leda, Glaswegian), 4.56 s, audible 4.23 s |
| lorna_noblame | Lorna Easton | Nobody's in trouble for slowing a pushy visitor down. | `lorna_easton.ink`, `hub`, defend-complete branch (:49) | yes |

Yusuf's reader bark ("Sorry, can I help you there? Deliveries go via the desk.") is not in either cut. In the episode it fires when a lone courier walks up to the reader; in a 77 s trailer, the same guard sending the courier to the desk and then waving them in eight seconds later reads as the guard forgetting. The watch beat keeps the learner out of his sight radius instead.

Not used: Lorna's L1 (cut for time; on a tailgate run it falls to a line about a held door that does not fit) and "Camila's one of Jo's, by the way." (a link line for a later cut).

### 4.1 Audio placement in the new attacker beats

**ca12b tailgate (39.98-49.07)**, relative to the beat start:
- +0.30 Jun taps the reader; "Morning, Yusuf." about +0.35 to +1.2.
- +0.40 the gate opens and Jo's toast appears (6.0 s on screen). In 9:16 the toast is in frame only if it sits inside the follow-cam window; Jo's spoken line carries the point either way.
- +2.00 the learner enters the studio (`room_entered:training_room`): Yusuf's pass bark +2.00 to +4.27 audible, and `ca12_tailgated` is set.
- +4.60 Jo's line (with `barkDelay` 2600, section 8) to +8.83 audible; the beat ends at +9.09.
- The event must fire by +2.0 s. Jun starts his approach in the watch beat's last 1.5 s so it does. If the take runs long, trim the learner's walk with a hard cut, never Jo's line.
- If the `barkDelay` change has not landed when t20 is shot, the take's own audio overlaps Yusuf and Jo by 0.47 s. Then place Jo's cached clip in the edit as its own audio cue 0.33 s after Yusuf's audible end and mute the take audio from her start.
- Jo has no portrait or bubble, so the shot gets a `lines[]` entry for her, speaker label "Jo (earpiece)", with a burned caption in all three aspects (in 16:9 too, unless the voiced toast's text is on screen and readable for the whole line).

**ca12 door (38.88-47.98)**, relative to the beat start:
- +0.10 Delphine stands and starts round; "I'll get the door for you." +0.10 to +1.16 audible.
- +1.42 v6b to +4.32.
- about +4.0 the gate opens and the toast appears; on screen to the flip cut (about 5.1 s, enough for the first two sentences).
- about +6.5 the learner enters the studio: Yusuf +6.52 to +7.81.
- +8.12 v6 "You're in." to +8.86.
- If Delphine's walk starts late, v6b moves with it and keeps 0.3 s clear of her bark; Yusuf's bark must end 0.3 s before v6.

## 5. Shot list

Zoom rules (integer output scale only, no pushins):
- 16:9 and 1:1 take 1, 2 or 3; 9:16 takes 0.5625, 1.125 or 1.6875 (scale 1, 2, 3).
- NPC chats take the lower integer: 1 / 1.125 / 1, speaker centred, the game's subtitle bar out of the narrow crops and a burned caption instead.
- A panel wider than 540 source px goes to 1× in 9:16 and 1:1 (0.5625 and 1).
- Insets of panel text are 2× crops of the source, placed in the empty area of the frame.
- Map shots take 2 / 1.125 / 2 unless the beat needs the whole lobby.

Dependency codes: **now** exists today; **E1** side-door gate (uncommitted in this tree); **E4** mapping actions (engine 76956ae9d; shell mappings not yet written); **SF** a scenario follow-up (section 8); **CW** the Camila walk-in conversion; **VO** needs a re-voice.

| Beat | Take | Entry state | Zoom 16:9 / 9:16 / 1:1 | Depends on |
|---|---|---|---|---|
| hook | new `t16_camila_walkin`: the walk across the lobby and through the gate, then her arrival at the desks | kit_defend_done, step-away forced (as t09), BE_SPRITE avatar | 2 / 1.125 / 2, follow-cam on Camila | CW; E1 (gate `openFor` Camila, gate wins over the walk-in's door fade); time her crossing for Yusuf at the street-window end of his loop, reader framed out or small; VO (Camila's line) |
| topic | same take, after she is through | as hook | 2 / 1.125 / 2 if the lobby's desk, gate and reader fit 960 × 540 source px after the dressing pass, else 1 / 0.5625 / 1 | CW, E1; Yusuf patrolling needs E4 `resume_patrol` (else he stands at his post); SF lobby dressing pass |
| red_card | card, three bullets | none | n/a | now |
| research | t04_osint_note 4.90-7.90 | existing | 1 / 0.5625 / 1, plus a 2× inset of the OSINT line ("On site all week again...") in 9:16 and 1:1 | now |
| build | t05_pretext_card 5.30-8.30 | existing | 1 / 0.5625 / 1 (the card is about 630 × 600 source px), plus a 2× inset of the "What you found" lines in 9:16 and 1:1 | now |
| kit | new `t17_kit_bag` | studio, after brief and OSINT (`--set` done brief, osint) | 2 / 1.125 / 2; letter inset 2× | now in data; SF kit bag position (8.25, 0.875) unmeasured, dressing pass first |
| talk | t06_the_call 11.55-13.25 | existing | 1 / 0.5625 / 1 (the choice menu is about 576 source px wide); INFLUENCE inset 2× in 9:16 and 1:1 | now |
| lands (ca12) | new `t06r_the_call` after the D1 re-voice; in = D1 line-start −0.15 s, out = speech end +0.25 s | as t06 | 1 / 1.125 / 1 | VO (D1). Fallback below |
| door (ca12) | new `t18_desk_pass`, got_it with the hi-vis worn | lobby world-play after a got_it call | 1 / 1.125 / 1: the whole lobby in 16:9 and 1:1, follow-cam on the learner in 9:16 | E1 (gate block, open animation, `activeIf`); E4 for Jo's toast (Lorna 9); SF dressing |
| watch (ca12b) | new `t19_watch`: walked_away, hi-vis on, the learner turns from the counter and walks to the street window, staying out of Yusuf's sight radius | lobby after a walked_away call | 2 / 1.125 / 2, follow-cam | E4 `start_patrol` and the SF Jun loop (Jun must be heading for the reader by the beat's last 1.5 s); SF dressing |
| tailgate (ca12b) | new `t20_tailgate`, same run as t19 | continues t19 | 1 / 1.125 / 1: the gate, Yusuf and the learner in 16:9 and 1:1; follow-cam on the learner in 9:16 | E1; E4 `start_patrol`; SF Jun loop and reader bark; SF `barkDelay`; VO (Jun); keep Jo's toast in frame at least 2 s and do not mask it |
| flip | new `t21_flip_r3`, one per cut: hand-back with the learner in their own clothes, then the flip panel | after each door take, or seeded `ca12_desk_pass` / `ca12_tailgated` | 1 / 0.5625 / 1, plus a 2× inset of the heading and E5 line in 9:16 and 1:1. ca12 (got_it): frame the heading and E5 line only, mask the replayed lines list. ca12b (walked_away): no replay list, full panel safe | E5 now; SF (ca12's E5 line); hi-vis off at hand-back needs E4 `take_off` (Lorna 11), else frame the panel only |
| blue_card | card | none | n/a | now |
| tailgater (ca12) | new `t12r_tailgater_card` after the stairs strings change (same script as t12); until then t12 5.90-9.40 | as t12 | 1 / 0.5625 / 1, plus a 2× inset of the card text in 9:16 and 1:1 | SF (card strings) |
| queue | t11_defend_queue 5.08-15.68 | existing | 1 / 0.5625 / 1 (panel about 960 px), plus 2× insets of the heading and the four buttons in 9:16 and 1:1; masks as CA12_T11_MASKS.md | now |
| lorna_noblame | t14_lorna_noblame 16.32-20.22 (24 Nov recapture) | existing | 1 / 1.125 / 1 | now |
| close | ca-close | none | n/a | now |

### 5.1 Measured in and out points (takes on disk, 26 Nov)

Measured by ffprobe, the trimmed marker files and silencedetect at −40 dB on `~/video-takes-local/ca12/takes/`.

| Take | Length | In-Out | What the measure shows |
|---|---|---|---|
| t04_osint_note | 11.03 s | 4.90-7.90 | unchanged, inside the take |
| t05_pretext_card | 9.84 s | 5.30-8.30 | unchanged |
| t06_the_call (recorded 23 Nov 00:08) | 21.97 s | talk 11.55-13.25 | Delphine's previous line ends 11.29 (audio), 11.56 (marker); the choice menu slides in from about 12.1; the pick is at 13.233; the player's own portrait (hi-vis courier, name bar "playtest") is up by 13.30. Out at 13.25 keeps the test-account name off screen |
| t06_the_call | | D1 (old) | line-start 15.01; "Go on then," 15.14-15.92; "I'll buzz you through." 16.11-16.89; "Studio's up the stairs on your left." 17.34-19.10; line-end 19.39. The subtitle bar shows the whole old line from 15.01. Not usable for `lands` once D1 changes |
| t11_defend_queue | 15.97 s | 5.08-15.68 | the frame at 15.66 is the same queue with "Check first" hovered, nothing pressed |
| t12_tailgater_card | 18.30 s | 5.90-9.40 | card open from 5.63 |
| t14_lorna_noblame (24 Nov) | 21.80 s | 16.32-20.22 | L5 speech 16.58-19.43; chat closed 20.30 |

**`lands` fallback** if t06r is not shot before the edit: t06 14.85-16.00 ("Go on then," only, 1.15 s), mask the subtitle bar and burn the caption "Go on then," in all three aspects. `lands` becomes 1.30 s and the door beat takes the other 2.10 s.

Capture notes:
- t16 to t21 wait for E1 and E4 on this branch, the Jun and Lorna shell mappings, CW and the lobby dressing pass. t17 can be shot after the dressing pass alone.
- Record t19 and t20 as one run.
- t06r and t12r need only the line and string changes in section 8 (and the D1 re-voice for t06r).

## 6. Music

**PeaceFolk "Gently Decaying" from 85.397 s** (bar 31 downbeat, 88.04 BPM, bar 2.726 s). The window ends at 162.4 s (ca12b) and 164.4 s (ca12) of the 187.2 s track, gain −5 dB, 2.5 s fade out. No gap over 0.3 s below −45 dB in the 80 s from 85.397 (checked 26 Nov). The nearest used starts are 66.314 and 104.478, both 19.08 s away.

Sections relative to the start, and where the cuts land:

| Music (s) | Change | ca12b | ca12 |
|---|---|---|---|
| 8.18 | bar | open card starts | same |
| 16.35 / 19.08 | drop | under topic and the red card | same |
| 19.08, 20.45, 21.81 | hits | red card heading near 19.28; bullets 2 and 3 on 20.45 and 21.81 | same |
| 24.53 | lift | 0.75 s into research | same |
| 29.98-32.71 | hits | kit beat; the hi-vis goes on on 32.71 | same |
| 46.34 | drop | under Jo's line | under the door hold |
| 49.07 | drop | **flip starts** | 1.09 s into the flip |
| 54.52 | lift | **blue card starts** | 1.04 s into the blue card, under v7 |
| 57.24 | lift | queue starts 0.22 s earlier | 1.76 s into the tailgater card |

Alternative if GD fails against the render: "Gently Decaying Again" from 82.693 s (18.34 s and 19.65 s from the nearest used starts).

## 7. Rubric (CA fun/USP, trailer-observable items)

Scored on the script and planned footage; re-score on the render.

| Item | ca12b | ca12 | Evidence |
|---|---|---|---|
| F1 hook | 3 | 3 | the first 3 s are movement past a guard and through a door; Camila's line follows |
| F3 agency | 2 | 1 | ca12b shows the menu with "leave it at the desk", the walk-away, and the flip naming the route; ca12 shows one route |
| F4 living world | 3 | 3 | walk-in, Yusuf's patrol, Delphine leaving her desk, Jun's badge tap, Jo in the earpiece |
| O1 attacker's steps shown | 3 | 3 | research, cover story, costume, call, door, each narrated in attacker terms |
| O2 attacker reasoning | 3 | 3 | ca12b: v5b sets up "the desk" and "the door", and Jo's "A uniform and a held door beat both." pays it off; ca12: "Look the part, and she holds the door." |
| O3 transfer | 3 | 2 | ca12b: v10b answers the held door; ca12: v10's four actions, none about the follow-in |
| O4 tone | 3 | 3 | Yusuf is polite and never made the punchline; Lorna's no-blame line; no fear lines |
| A1 accuracy | 3 | 3 | once the section 8 line changes land; 2 until then (the old D1, "straight up", "on the phone", "the stairs") |
| A2 safe takeaway | 3 | 3 | pattern level only; the authorisation is on screen (red-card bullets, letter inset) |
| P1 practice or outcome | 2 | 2 | defend queue with no verdicts, and the flip naming the outcome of the learner's own run |

Totals on these 10 items: **ca12b 28/30, ca12 26/30**. F2, F5 and F6 are about play time and replay and are not scored on a trailer.

## 8. Changes needed outside the edit

### 8.1 In-game line changes (before → after)

| # | File and place | Before | After | Voiced? |
|---|---|---|---|---|
| L1 | `scenarios/ca12_visitor_tailgater/ink/delphine_reception.ink:107`, `ask_reaction` result 1 (keep `# unlock_door:training_room`; recompile the .json) | Go on then, I'll buzz you through. Studio's through the side door on your left. | Go on then. Studio's through the side door on your left. | yes: re-voice Delphine |
| L2 | `scenarios/_office_kit/ink/camila_ospina_ca12.ink:33` and `scenario.json.erb:1642` (kit bark); the two must match | Hi, I'm Camila, here for Yasmin Chaudhry. She said to come straight up. | Hi, I'm Camila, here for Yasmin Chaudhry. She said to come straight through. | yes: re-voice Camila |
| L3 | `scenario.json.erb:705`, `flipDefenderLineByGlobal` `ca12_desk_pass` | The desk said yes on the phone, then opened the door for you. One call got you past both layers. | The desk said yes and held the door. One conversation got you past both layers. | no, shown |
| L4 | `scenario.json.erb:696`, `flipDefenderLine` fallback (not in the trailer, same "call" framing) | The call landed. What happened at the door is above; ... | Your approach landed. What happened at the door is above; ... | no, shown |
| L5 | `scenario.json.erb:365`, 09:12 visitor card transcript; also `ca12_visitor_tailgater_defend` and `test_ca12_fallback` | (slips in behind a badge-holder at the gate and heads for the stairs) | (slips in behind a badge-holder at the gate and heads into the studio) | no, shown |
| L6 | `scenario.json.erb:379`, `reportReply` and `reportReplyByVerdict.report` (same two other shells) | Thanks, we caught them on the stairs; they weren't expected. | Thanks, we caught them in the studio; they weren't expected. | check: shown text in the defend card; confirm it has no TTS sidecar |
| L7 | `scenario.json.erb:375`, `perFlagNote.tailgating` (same two other shells) | They badged in on someone else's card, which is exactly what a wedge or a held door lets happen. | They came in behind someone else's badge, which is exactly what a wedge or a held door lets happen. | no, shown |
| L8 | Jun's reader bark (new, SF) | (none) | Morning, Yusuf. | yes: new, Puck |

The OSINT page's "buzzes expected visitors and couriers through from the reception desk" stays: in-world it reads as "lets through". Delphine's refusal lines that mention buzzing are not in the trailer and stay.

### 8.2 Data changes (no new lines)

- `ca12_jo` mapping (`scenario.json.erb:1817`): `barkDelay` 1800 → 2600, so Jo starts 0.33 s after Yusuf's pass bark ends (both fire on the same `room_entered:training_room`). Update the plan's note ("after Yusuf's pass bark") to match.
- Hand-back grace (`scenario.json.erb:206`, timer on `ca12_entered`, `delayMs` 5000): Jo's line ends about 7.2 s after the learner enters. Check in t20 whether the hand-back cuts or covers her audio; if it does, raise it to 7500.
- Jun's loop mappings (start on `ca12_runner_go`, stop on `ca12_world_done`, `useObject` on the reader) and the reader bark (L8).
- Lorna mappings 9 (Jo's door toast) and 11 (`take_off`), E4.

### 8.3 Lines to voice

| # | Speaker | Voice | Line | Where | Status |
|---|---|---|---|---|---|
| 1 | Narrator | Sulafat_v2 | Booked and signed off. Now dress the part. | v4b, both | new |
| 2 | Narrator | Sulafat_v2 | Or skip the desk, and watch the door. | v5b, ca12b | new |
| 3 | Narrator | Sulafat_v2 | Look the part, and she holds the door. | v6b, ca12 | new |
| 4 | Narrator | Sulafat_v2 | Now swap seats. | v7, both | new |
| 5 | Narrator | Sulafat_v2 | Check the list. Escort them. Don't let anyone follow you in. | v10b, ca12b | new |
| 6 | Delphine Arvanitis | her scenario voice | Go on then. Studio's through the side door on your left. | L1, ca12 lands | changed |
| 7 | Camila Ospina | her scenario voice | Hi, I'm Camila, here for Yasmin Chaudhry. She said to come straight through. | L2, both hooks | changed |
| 8 | Jun Watanabe | Puck | Morning, Yusuf. | L8, ca12b tailgate | new |

Jo's line ("Nobody checked. A uniform and a held door beat both.", Leda, Glaswegian) is cached and unchanged; it needs no re-voice. After voicing, run the dialogue review on lines 6 to 8 and measure 1 to 5 against their windows (trim order if long: v6b to "Look the part. She holds the door.", v5b to "Or skip the desk.", v4b to "Booked. Now dress the part.").

### 8.4 Cards (28 characters or fewer per line)

"You play the attacker" 21; bullets "A booked test, signed off" 25, "Scope: the desk and the door" 28, "Challenged? Step back" 21; "You run the front desk" 22; "Visitors and tailgating" 23; "Merrin & Sallow Architects" 26; chips "OPEN-SOURCE RESEARCH" 20, "COVER STORY" 11, "KIT BAG" 7, "FRONT DESK" 10; inset tab "AUTHORISATION" 13; caption label "Jo (earpiece)" 13; close tagline stacked in all three aspects, "Play the attack" 15 / "Learn to stop it" 16 (the edit list sets the stacked form for 16:9 too); plate "Learn on Hacktivity.co.uk" 25.

## 9. Open for AC0

1. Length: 77.0 s (ca12b) and 79.0 s (ca12). The trims in section 2 bring them to about 74 s and 72 s.
2. Voicing: the eight lines in 8.3.
3. Scenario follow-ups that block takes: CW; Jun's loop and reader bark; Lorna 9 and 11; the lobby dressing pass; L1 to L7; `barkDelay`.

## Changelog

Round 2 (26 Nov), folding in the R1 sell and truth review (0 B, 7 M, 9 m) and the R1 silent viewing and timing review (3 B, 6 M, 7 m):
- Timing B1 / sell M4: Yusuf's reader bark cut from ca12b; the reader beat becomes the watch beat (learner out of his sight), v5b keeps its full length with no collision.
- Timing B2: tailgate beat 9.09 s with Jun's approach moved into the watch beat; `barkDelay` 2600 (fallback: Jo's clip placed in the edit); Jo finishes 0.26 s before the flip. New: the 5 s hand-back grace check.
- Timing B3: flip 5.45 s (ca12b) and 5.0 s (ca12), silent, with 2× insets in the narrow cuts; ca12's E5 line shortened to 15 words.
- Sell M1: ca12 E5 line no longer says "on the phone" (L3); L4 fixes the fallback's "call".
- Sell M2: D1 drops "I'll buzz you through" (L1), building on 42548d552's side-door line.
- Sell M3 / timing M2: the hook opens on the walk-in, the topic beat is the lobby after she is through, so she arrives once; Camila's "straight up" becomes "straight through" (L2).
- Sell M5: red card bullets and a letter inset with tab AUTHORISATION.
- Sell M6: v7 "Now swap seats." voices the blue card in both cuts.
- Sell M7: ca12 flip masks the replayed lines list.
- Timing M1: t06 re-measured (talk 11.55-13.25; old D1 unusable; t06r or a masked "Go on then," fallback); the "24 Nov recapture" label for t06 removed (the file is 23 Nov).
- Timing M3: one "two layers" statement (Jo's toast, 6.0 s on screen); v6b rewritten; door audio placed in 4.1.
- Timing M4: Jo gets a `lines[]` caption in all aspects.
- Timing M5: new-line estimates widened, windows kept at or under 3.0 w/s, trim order given.
- Timing M6: build and research at 1×, named 2× insets for research, build, talk, tailgater, queue and flip.
- Minors taken: sell m8 (v4b), m9 (v6b), m10 (v5b), m11 (toast kept in t20, and v5b supplies "both"), m12 (Camila's crossing timed to Yusuf's loop), m13 (L5 to L7, t12r), m14 (v10b in ca12b), m15 (re-scored); timing m1 (walk-away on screen), m2 (flip and blue card on 49.07 and 54.52 in ca12b), m3 (1× for the whole-lobby beats), m4 (tagline stacked everywhere), m5 (0.25 s gaps), m6 (totals stated), m7 (kit timing, KIT BAG chip).
- Minor skipped: sell m16 (the course-trailer recipe's stale "No URL" line) is a recipe edit outside this script's commit; it goes to AC0.
- Music unchanged (GD @85.397); gap check extended to 80 s.
