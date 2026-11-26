# ca12 and ca12b trailer script, round r3 (Visitors and tailgating)

Status: outline and script, round 3, 26 Nov 2026. No edit list, no take scripts, no new TTS yet. Replaces the pilots r2 cuts (`tools/video/edits/ca12_trailer_r4.json` = ca12, `ca12_trailer_r4b.json` = ca12b) once AC0 signs it off. The owner has approved both shapes. **ca12b leads**; ca12 is the fallback.

Owner's verdict on pilots r2 (25 Nov, via AC0): "Rethink: Needs updating with the new content."

## 1. What changed from r2, and why

**What ca12 and ca12b were in r2.** Two cuts of one trailer. ca12 (71.96 s) had no physical entry: the call landed and "You're in." played over the flip. ca12b (74.96 s) was the same cut with a 3 s clip from the physical pen test lab spliced in after the call. Both had a silent bed.

**Why they no longer work.** The owner asked for a real disguise and slip-past-the-guard mechanic inside ca12, with the trailer rebuilt on ca12's own footage. That content now exists in the scenario or is being built (E1, E4):
- Jo Fairweather (`ca12_jo`, Northlight Security) leads the red team. The brief frames the run as a booked test signed off by the partners, with a letter in Jo's kit bag. Jo is an offscreen voiced NPC (Leda, Glaswegian).
- Jo's kit bag in the studio holds the authorisation letter and a courier's hi-vis the learner puts on (the sprite changes).
- After the call the learner stays in the lobby. The studio door becomes a side-door gate (E1) with a badge reader, and Yusuf Demir, the building's security officer, patrols beside it.
- Two ways through. **Desk pass**: Delphine says yes, walks round and holds the door, and Yusuf waves the courier on. **Tailgate**: skip the desk, wait for Jun Watanabe to badge through, and follow him in while the door holds; Yusuf waves the courier through and Jo comes in over the earpiece.
- Delphine says yes on the partner's name and the hurry; the hi-vis plays no part in her answer. The hi-vis is what Yusuf checks: with it he waves the learner on, without it he challenges at the reader.
- At hand-back the hi-vis comes off (E4 `take_off`).
- The flip names what happened (E5, `flipDefenderLineByGlobal`).
- NPCs walk in and out of rooms, so Camila's appearance becomes a walk-in from the lobby, through the gate, to the studio.

**So r3** drops the lab clip, adds two attack beats (the kit and the door), and turns the old A/B question into a question about routes: **ca12 = the desk pass**, **ca12b = the tailgate**.

## 2. Shape

- The attack half has six beats: research, build, **kit**, talk, then **lands + door** (ca12) or **watch + tailgate** (ca12b).
- The cut opens on movement: Camila walks past the guard and through the door in the first 3 s, then says her line.
- The red chapter card carries three bullets that make the authorisation visible with the sound off.
- The talk menu holds 2.2 s, and a 2× inset in the narrow cuts shows the option that picks the route.
- Each cut makes the "two layers" point once: Jo's spoken line in ca12b, the flip line in ca12. Lorna's door toast (mapping 9) is kept out of both cuts, and in ca12b Jo's own earpiece toast is hidden so the burned caption carries her line.
- The flip shows only its heading and the E5 line (15 words, 4.5 s at the game's 300 ms a word) and holds 5.45 s. It is silent. The blue card is voiced.
- Lorna's flip line is cut from both cuts.
- ca12b drops the defend-side tailgater card (the tailgate has just been shown from the attacker's seat). ca12 keeps it: it is the only tailgating that cut shows.
- Music: PeaceFolk "Gently Decaying" from 88.123 s (bar 32). Cards sit on its bars and hits where the beats allow.
- Unchanged from r2: Camila's hook line (cached, "straight up"), the ca-open tagline, the red and blue chapter cards, the defend queue, Lorna's no-blame line and the close.

Lengths: **ca12b 75.66 s**, **ca12 77.91 s**. Against the untrimmed cut (77.03 s for ca12b), v1c is cut and topic is one bar shorter (the topic beat goes from 5.70 s to 2.97 s, −2.73 s; v1c's 3.24 s clip was inside that window). The talk menu (+0.90 s), Jo's clearance (+0.06 s) and the watch beat (+0.40 s, so the flip lands on a half-bar) add back 1.36 s: 77.03 − 2.73 + 1.36 = 75.66 s. ca12 is ca12b plus 2.25 s: it swaps the watch (4.90 s) and tailgate (9.15 s) for `lands` (3.70 s) and the door (9.10 s), and adds the tailgater card (3.50 s), giving 77.91 s.

Existing takes are measured (section 5.2). New takes (t06r, t06w, t16 to t21) are budgets; the retime happens from their marks.

### ca12b, the tailgate (75.66 s, lead)

| # | Time (s) | Beat | Seat | Content |
|---|---|---|---|---|
| 1 | 0.00-8.18 | hook | full | Camila crosses the lobby while Yusuf is at the far end of his loop; the gate opens for her and she steps through (0.00-3.00). Hard cut to her arrival at the studio desks; her line from 3.15 |
| 2 | 8.18-13.58 | open | neutral | ca-open: Visitors and tailgating / Merrin & Sallow Architects, stripe #6b4c9a |
| 3 | 13.58-16.55 | topic | full | static lobby view just after she is through: the gate swings shut, Yusuf walks back towards the reader, Delphine at the desk |
| 4 | 16.55-21.05 | red_card | attack | "You play the attacker". Bullets: "A booked test, signed off" (16.55) / "Scope: the desk and the door" (17.72) / "Challenged? Step back" (19.08) |
| 5 | 21.05-24.05 | research | attack | OSINT note, chip OPEN-SOURCE RESEARCH |
| 6 | 24.05-27.05 | build | attack | pretext card filling, chip COVER STORY |
| 7 | 27.05-31.05 | kit | attack | Jo's kit bag, chip KIT BAG. Shot a (27.05-29.67): open the hook 0.4 s, letter inset (tab AUTHORISATION plus the "Signed, Julian Sallow, Partner" crop) 1.3 s, take the hi-vis and confirm Wear 0.9 s; if the take cannot fit, hard-cut inside shot a (gameplay to gameplay) rather than shortening the inset. Hard cut to shot b (29.67-31.05): the world, the sprite changes on the 29.98 hit |
| 8 | 31.05-33.65 | talk | attack | t06w: Delphine's portrait, the choice menu up 2.2 s, the menu alone until the last 1.2 s, then the inset of "Not to worry, I'll leave it at the desk. Cheers." (so the picture follows v5, not leads it), chip FRONT DESK; out before the player's own line |
| 9b | 33.65-38.55 | watch | attack, full frame | the learner turns from the counter and walks to the street window, clear of Yusuf; Jun comes into frame heading for the reader in the last 1.5 s |
| 10b | 38.55-47.70 | tailgate (hero) | attack, full frame | Jun taps the reader ("Morning, Yusuf.") and goes through; the learner follows him in while the gate holds; Yusuf waves the courier on; Jo in the earpiece |
| 11b | 47.70-53.16 | flip | flip join | the flip panel: heading "In behind a member of staff" and the E5 line, silent |
| 12b | 53.16-55.66 | blue_card | defend | "You run the front desk" |
| 13b | 55.66-66.26 | queue | defend | visitor queue: courier, colleague back from leave, hover over the four buttons, nothing pressed |
| 14b | 66.26-70.16 | lorna_noblame | defend | Lorna L5 |
| 15b | 70.16-75.66 | close | neutral | ca-close, tagline stacked "Play the attack" / "Learn to stop it", plate "Learn on Hacktivity.co.uk" |

Exact starts for the edit list: 0, 8.18, 13.58, 16.554, 21.054, 24.054, 27.054 (kit b 29.674), 31.054, 33.654, 38.554, 47.704, 53.156, 55.656, 66.256, 70.156, end 75.656.

### ca12, the desk pass (77.91 s, fallback)

Beats 1 to 7 as ca12b (0.00-31.05). Then:

| # | Time (s) | Beat | Seat | Content |
|---|---|---|---|---|
| 8 | 31.05-33.65 | talk | attack | t06r: as ca12b, with the inset on "Any chance you can buzz me through..." (the ask that lands) |
| 9 | 33.65-37.35 | lands | attack | Delphine says yes (D1, re-voiced, L1); caption burned |
| 10 | 37.35-46.45 | door | attack, full frame | Delphine leaves the desk ("I'll get the door for you.") and walks round; she holds the gate; the learner walks through past Yusuf ("Morning. Mind the step.") |
| 11 | 46.45-51.91 | flip | flip join | the flip panel: heading "Now you're the one on the desk" and the E5 line, silent |
| 12 | 51.91-54.41 | blue_card | defend | "You run the front desk" |
| 13 | 54.41-57.91 | tailgater | defend | Unknown visitor 09:12 card |
| 14 | 57.91-68.51 | queue | defend | as ca12b beat 13b |
| 15 | 68.51-72.41 | lorna_noblame | defend | Lorna L5 |
| 16 | 72.41-77.91 | close | neutral | as ca12b |

Exact starts: 31.054, 33.654, 37.354, 46.454, 51.906, 54.406, 57.906, 68.506, 72.406, end 77.906. If t06r's marks allow `lands` at 3.59 s, take it: ca12's flip and blue card then land on the drop and lift at 49.07 and 54.52 (music time).

## 3. Narrator VO (Sulafat_v2)

Rules: at most 3.0 words per second over the cue window, UK English, no em or en dashes, no narrator line over a character line, at least 0.25 s between cues. Every cue is also a burned caption. Clip lengths are measured from `~/video-takes-local/ca12/vo/Sulafat_v2/trim/`; new cues are estimates and are re-timed when voiced.

| Cue | Cut | Window (s) | Line | Words | w/s | Clip |
|---|---|---|---|---|---|---|
| v1 | both | 8.28-13.39 | Hacktivity Cyber Aware: Security awareness training you can play. | 9 | 1.76 | 5.112 s |
| v1b | both | 13.68-15.70 | Nobody checks she's expected. | 4 | 1.98 | 2.016 s |
| v2 | both | 16.65-19.05 | First, you play the attacker. | 5 | 2.08 | 2.400 s |
| v3 | both | 21.10-23.98 | Dig into what staff post in public. | 7 | 2.43 | 2.880 s |
| v4 | both | 24.28-26.98 | Build a cover story from what you found. | 8 | 2.96 | 2.424 s, caption held to 26.98 |
| **v4b** | both | 27.25-30.25 | Booked. Now dress the part. | 5 | 1.67 | **voiced 26 Nov**, 2.640 s (trimmed form; the full line ran 3.408 s) |
| v5 | both | 31.07-33.55 | Then talk your way in. | 5 | 2.02 | 1.584 s |
| **v5b** | ca12b | 33.80-36.80 | Or skip the desk, and watch the door. | 8 | 2.67 | **voiced 26 Nov**, 2.520 s |
| **v6b** | ca12 | 38.87-41.77 | Name a partner, and she holds the door. | 8 | 2.76 | **voiced 26 Nov**, 2.712 s |
| v6 | ca12 | 45.37-46.12 | You're in. | 2 | 2.67 | 0.744 s, 0.34 s clear of the flip cut |
| **v7** | both | 53.31-55.56 / 52.06-54.31 | Now swap seats. | 3 | 1.33 | **voiced 26 Nov**, 1.632 s |
| v8a | ca12 | 54.56-57.63 | Tailgating: slipping in behind a badge-holder. | 6 | 1.95 | 3.072 s |
| v8b | both | 55.81-59.09 / 58.06-61.34 | Decide who gets in, and who gets checked. | 8 | 2.43 | 3.288 s |
| v9 | both | 59.34-61.19 / 61.59-63.44 | You've used these tricks yourself. | 5 | 2.70 | 1.848 s |
| v10 | ca12 | 63.69-68.47 | Check the list. Escort them. Badge in. Lock your screen. | 10 | 2.09 | 4.776 s |
| **v10b** | ca12b | 61.44-66.22 | Check the list. Don't let anyone follow you in. | 9 | 1.88 | **voiced 26 Nov**, 3.480 s |
| v11 | both | 70.36-75.32 / 72.61-77.57 | Play the attack, learn to stop it, on Hacktivity.co.uk. | 9 | 1.81 | 4.968 s |

Where two windows are given, the first is ca12b and the second ca12. Tightest gaps: v3 to v4 0.30 s; v10 to Lorna's speech (68.77) 0.30 s; v6 starts 0.31 s after Yusuf's bark.

Truth checks:
- v1b: Camila is on the gate's `openFor`, and the take times her crossing for Yusuf at the street-window end of his loop, so nobody on screen checks her.
- v4b: the brief says "This is a booked test, signed off by the partners"; the letter reads "Merrin & Sallow has engaged the bearer to test physical entry at the studio door today. Signed, Julian Sallow, Partner."
- v5b: the tailgate route runs only on the `walked_away` outcome, which the learner gets by leaving the desk ("Not to worry, I'll leave it at the desk. Cheers."). That option is on screen for 2.2 s in the talk beat, with a 2× inset in the narrow cuts.
- v6b: on `got_it` Delphine holds the door whatever the learner wears (her mapping on `pretext_merrin_front_desk_outcome`, scenario.json.erb:2046, has no hi-vis condition). She says yes on the partner's name and the hurry (`tells.ask.accepted`). The hi-vis is what gets Yusuf's "Morning. Mind the step." (:2184); without it he challenges at the reader (:2143).
- v7: the hand-back moves the learner from the attacker's seat to the desk.
- v10b: matches the defend half's held-door lesson and the scenario's factor text on tailgating.

## 4. Character lines

"Cached" means a sidecar in `tts_cache/ca12_visitor_tailgater/` with this exact text (checked 26 Nov). Lengths are the cached clip.

| Beat | Speaker | Line | Source | Cached |
|---|---|---|---|---|
| hook | Camila Ospina | Hi, I'm Camila, here for Yasmin Chaudhry. She said to come straight up. | `_office_kit/ink/camila_ospina_ca12.ink:33` and the kit mapping bark (scenario.json.erb:1642) | yes, 4.584 s. "Straight up" means "straight to her", and the episode's lesson quotes it (:739) |
| lands (ca12) | Delphine Arvanitis | Go on then. Studio's through the side door on your left. | `delphine_reception.ink`, `ask_reaction` result 1 (:107) | **no: re-voice** (L1) |
| door (ca12) | Delphine | I'll get the door for you. | Delphine eventMapping (got_it), bark (:2050) | yes, 1.344 s |
| door (ca12) | Yusuf Demir | Morning. Mind the step. | Yusuf pass bark, got_it (:2187) | yes, 1.68 s |
| tailgate (b) | Jun Watanabe | Morning, Yusuf. | Jun reader bark (not in the shell yet) | **no: new (Puck)** |
| tailgate (b) | Yusuf | Delivery? Studio's straight through. | Yusuf pass bark, not got_it (:2194) | yes, 2.57 s, audible 2.27 s |
| tailgate (b) | Jo Fairweather (offscreen, earpiece) | Nobody checked. A uniform and a held door beat both. | `ca12_jo` eventMapping on `ca12_tailgated` (:1818) | yes (Leda, Glaswegian), 4.56 s, audible 4.23 s |
| lorna_noblame | Lorna Easton | Nobody's in trouble for slowing a pushy visitor down. | `lorna_easton.ink`, `hub`, defend-complete branch (:49) | yes |

Every character line in the attack beats gets a `lines[]` entry with a burned caption and speaker label in all three aspects ("Camila", "Delphine", "Yusuf", "Jun", "Jo (earpiece)"). The world-space bubbles are too small at 1× to read, and Jo has no bubble at all.

Not used:
- Jo's door toast (Lorna mapping 9, "The desk is the first layer. The door is the second. Watch how long it stays open, and for whom."). It stays in the game as the learner's clue for the tailgate. In the trailer it would be a third statement of the two layers, and at 20 words it cannot be read in either door beat. Takes t18, t19 and t20 hide it (section 5.1). Jo's own earpiece line also shows as a bark toast in the game; t20 hides that toast too, so each aspect shows the line once, as the burned caption.
- Yusuf's reader bark ("Sorry, can I help you there? Deliveries go via the desk."). In a 75 s trailer, the same guard sending the courier to the desk and then waving them in seconds later reads as the guard forgetting. The watch beat keeps the learner out of his sight radius instead.
- Lorna's L1 and "Camila's one of Jo's, by the way." (a link line for a later cut).

### 4.1 Text on screen in the door beats

At the game's 300 ms a word:
- ca12b tailgate (9.15 s): Jun 2 words, Yusuf 4, Jo 10. 16 words, 4.8 s of reading, never two at once.
- ca12 door (9.10 s): Delphine 6, v6b 8, Yusuf 4, v6 2. 20 words, 6.0 s of reading. v6b's caption and Delphine's caption do not overlap (0.36 s apart).

### 4.2 Audio placement in the new attacker beats

**ca12b tailgate (38.55-47.70)**, relative to the beat start:
- +0.30 Jun taps the reader; "Morning, Yusuf." about +0.35 to +1.2.
- +0.40 the gate opens.
- +2.00 the learner enters the studio (`room_entered:training_room`): Yusuf's pass bark +2.00 to +4.27 audible; `ca12_tailgated` and `ca12_entered` are set.
- +4.60 Jo's line (`barkDelay` 2600, section 8.2) to +8.83 audible; the beat ends at +9.15, 0.32 s after her.
- +9.50 the hand-back (grace 7500 ms after entry, section 8.2): 0.35 s after the cut, so the take never shows it.
- The event must fire by +2.0 s. Jun starts his approach in the watch beat's last 1.5 s so it does. If the take runs long, trim the learner's walk with a hard cut, never Jo's line.

**ca12 door (37.35-46.45)**, relative to the beat start:
- +0.10 Delphine stands and starts round; "I'll get the door for you." +0.10 to +1.16 audible.
- +1.52 v6b to +4.42.
- about +4.0 the gate opens and Delphine holds it.
- +6.40 or earlier: the learner enters the studio: Yusuf +6.42 to +7.71. Hand-back at +14.0, outside the beat.
- +8.02 v6 "You're in." to +8.76, 0.34 s before the cut at +9.10.
- If Delphine's walk starts late, v6b moves with it and keeps 0.36 s clear of her bark; Yusuf's bark must end 0.3 s before v6, and v6 must end at least 0.3 s before the flip cut: if the learner enters late, trim the walk with a hard cut, keep the beat at 9.10 s so the flip stays on the half-bar.

## 5. Shot list

Zoom rules (integer output scale only, no pushins):
- 16:9 and 1:1 take 1, 2 or 3; 9:16 takes 0.5625, 1.125 or 1.6875 (scale 1, 2, 3).
- NPC chats take the lower integer: 1 / 1.125 / 1, speaker centred, the game's subtitle bar out of the narrow crops and a burned caption instead.
- A panel wider than 540 source px goes to 1× in 9:16 and 1:1 (0.5625 and 1), with bars, plus a 2× inset of its key part where that part is 540 px wide or less.
- Insets of panel text are 2× crops of the source, placed in the empty area of the frame.
- Map shots take 2 / 1.125 / 2 unless the beat needs the whole lobby.

Dependency codes: **now** exists today; **E1** side-door gate (uncommitted in this tree); **E4** mapping actions (engine 76956ae9d; shell mappings not yet written), including `resume_patrol`, being fixed now; **SF** a scenario follow-up (section 8); **CW** the Camila walk-in conversion; **VO** needs a voice line.

| Beat | Take | Entry state | Zoom 16:9 / 9:16 / 1:1 | Depends on |
|---|---|---|---|---|
| hook | new `t16_camila_walkin`: follow-cam on Camila from the lobby, through the gate, to her arrival at the studio desks | kit_defend_done, step-away forced (as t09), BE_SPRITE avatar | 2 / 1.125 / 2 | CW; E1 (gate `openFor` Camila, gate wins over the walk-in's door fade); **E4 `resume_patrol`** (on `ca12_world_done` Yusuf is sent to his post by the door at (1.5, 3.5); without the patrol restarting, the cold open shows a stranger walking past a guard who stands at the door); time her crossing for Yusuf at the street-window end of his loop |
| topic | new `t16b_lobby`: a second run, same start state and Yusuf loop offset, static lobby camera; use the 2.97 s from the gate swinging shut behind her | as hook | 2 / 1.125 / 2 if the desk, gate and reader fit 960 × 540 source px after the dressing pass, else 1 / 0.5625 / 1 | CW, E1, E4 `resume_patrol`; SF lobby dressing pass |
| red_card | card, three bullets | none | n/a | now |
| research | t04_osint_note 4.90-7.90 | existing | 1 / 0.5625 / 1, plus a 2× inset of the OSINT line ("On site all week again...") in 9:16 and 1:1 | now |
| build | t05_pretext_card 5.30-8.30 | existing | 1 / 0.5625 / 1 (card about 630 × 600 source px), plus a 2× inset of the "What you found" lines in 9:16 and 1:1 | now |
| kit | new `t17_kit_bag`, two shots | studio, after brief and OSINT (`--set` done brief, osint) | shot a (panel): 1 / 0.5625 / 1 if the panel is over 540 px wide (likely: `container-minigame.css:25` sets `max-width` 880), 16:9 at 2 only if it fits 960 × 540; letter inset 2×. Shot b (world): 2 / 1.125 / 2 | now in data; SF kit bag position (8.25, 0.875) unmeasured, dressing pass first |
| talk (ca12b) | new `t06w_the_call` (section 5.1) | as t06 | 1 / 0.5625 / 1 (the menu is 571 source px); 2× inset of option 5 (about 360 px) in 9:16 and 1:1 | now |
| talk (ca12) | new `t06r_the_call` (section 5.1) | as t06 | as above, inset of option 4 | L1, VO (D1) |
| lands (ca12) | t06r | as t06 | 1 / 1.125 / 1 | L1, VO (D1). Fallback in 5.2 |
| door (ca12) | new `t18_desk_pass`, got_it with the hi-vis worn | lobby world-play after a got_it call | 1 / 1.125 / 1: the whole lobby in 16:9 and 1:1, follow-cam on the learner in 9:16 | E1 (gate block, open animation, `activeIf`); E4 (Lorna 9 exists, so it is hidden); SF dressing |
| watch (ca12b) | new `t19_watch`: walked_away, hi-vis on, the learner turns from the counter and walks to the street window, out of Yusuf's sight radius | lobby after a walked_away call | 2 / 1.125 / 2, follow-cam | E4 `start_patrol` and the SF Jun loop (Jun heading for the reader by the beat's last 1.5 s); SF dressing |
| tailgate (ca12b) | new `t20_tailgate`, same run as t19 | continues t19 | 1 / 1.125 / 1: the gate, Yusuf and the learner in 16:9 and 1:1; follow-cam on the learner in 9:16 | E1; E4 `start_patrol`; SF Jun loop and reader bark; **SF grace 7500 and `barkDelay` 2600 on the branch before recording**; VO (Jun) |
| flip | new `t21_flip_r3`, one per cut (section 5.1) | after each door take, or seeded `ca12_desk_pass` / `ca12_tailgated` | 1 / 0.5625 / 1 with bars; 2× inset of the heading and E5 line if their block is 540 px wide or less, else the E5 line as a burned caption in 9:16 and 1:1 | E5 now; SF (L3, L3b) |
| blue_card | card | none | n/a | now |
| tailgater (ca12) | new `t12r_tailgater_card` after the card string changes (same script as t12); until then t12 5.90-9.40 | as t12 | 1 / 0.5625 / 1, plus a 2× inset of the card text in 9:16 and 1:1 | SF (L5 to L7) |
| queue | t11_defend_queue 5.08-15.68 | existing | 1 / 0.5625 / 1 (panel about 960 px), plus 2× insets of the heading and the four buttons in 9:16 and 1:1; masks as CA12_T11_MASKS.md | now |
| lorna_noblame | t14_lorna_noblame 16.32-20.22 (24 Nov recapture) | existing | 1 / 1.125 / 1 | now |
| close | ca-close | none | n/a | now |

**Hook fallback** if E4 `resume_patrol` has not landed when t16 is shot: frame the hook tight on Camila (2 / 1.125 / 2, follow-cam) with Yusuf and the reader out of frame, and show the lobby only in topic, after she is through. v1b stays true either way.

The hook cuts from the walk to her arrival at the desks, and topic then shows the lobby a few seconds earlier in game time. After the open card that reads as "meanwhile, at the door", which is fine for a trailer; one camera cannot be on both.

### 5.1 Specs for the new takes

**t06r_the_call and t06w_the_call** (talk and lands). New files in `tools/video/takes/ca12/`, copied from `t06_the_call.mjs` with these changes:
- Entry state as t06, from a fresh game: `run-take.sh ca12_visitor_tailgater t06r_the_call "" "--hide-hud --zoom-step 1"` (t06w the same with its own name). `setup()` unchanged: `toCall(... { stopBeforeApproach: true })` and the `.pretext-tells` hide.
- t06r needs L1 recompiled into `delphine_reception.json` and the D1 re-voice in the served `tts_cache` before recording. t06w needs neither.
- Choice dwell `sleep(1100)` to `sleep(2200)`.
- New mark `frame:menu-up:N` on the first poll where `dialogue.awaitingChoice` is true for choice N, and with it `route-option-rect` (the DOM rect of the option that matches `STEPS[1]`, for the inset).
- t06r: `STEPS = [/sample box for Catherine/, /buzz me through/]`; the third awaited line is `/side door on your left/` (the old `/buzz you through/` no longer exists after L1). New mark `frame:d1-subtitle-up` on the first poll after `choose:2` where the speaker is Delphine and the text matches `/side door/`. Keep `line-start` and `line-end`, then the existing `d1-done` marks.
- t06w: `STEPS = [/sample box for Catherine/, /leave it at the desk/]`. After `choose:2`, wait 800 ms, mark `frame:end-of-take` and stop; no third line is awaited. The route-option inset runs only in the last 1.2 s of the talk beat; the menu shows alone before it.
- Points, both takes: talk in = `frame:menu-up:2` − 0.35 s, out = `choose:2` − 0.02 s (the "playtest" name bar appears about 0.07 s after the pick). Expected 2.55-2.6 s; the menu is on screen at least 2.2 s of it.
- Points, t06r: lands in = `frame:d1-subtitle-up` + 0.10 s, out = speech end + 0.25 s, with the speech end from silencedetect (−40 dB) on the take, not from `line-end` (on t06 that mark ran 0.29 s late). Budget 3.7 s.
- The talk beat out and the lands beat in are two cuts on the same take: the player's own line between them is skipped.

**t16_camila_walkin and t16b_lobby** (hook and topic). Two runs, same start state and the same Yusuf loop offset. t16: follow-cam on Camila from the start; marks `door_gate_opened`, `door_gate_closed`, `room_entered` (Camila), `line-start`/`line-end` (her bark). t16b: static lobby camera, marks the same gate events; topic is in = `door_gate_closed` − 0.5 s for 2.97 s.

**t17_kit_bag**. Mark `kit-panel-rect` (the container minigame's DOM rect) when the panel opens, and `frame:wear-confirmed` and `frame:sprite-changed`. Shot a ends 0.31 s before the sprite change; shot b starts there.

**t18_desk_pass, t19_watch, t20_tailgate**. Each take script removes Jo's door toast (Lorna 9) with a MutationObserver that hides any toast whose text matches `/first layer/`. Jo's spoken line in t20 uses the bark lane and is not matched, but her own bark toast is hidden by a second match on `/held door beat both/`, so the burned caption is the only text. t18: the learner enters the studio at +6.40 s of the beat or earlier (trim the first part of the walk to get there). t19: the in point is after the conversation closes and Delphine's reply ("Right you are, leave it with me and I'll let them know.") has ended (mark `conversation-closed`), or its tail is cut hard, so no character speech runs under v5b. Marks: `door_gate_opened`, `room_entered:training_room`, `line-start`/`line-end` for every bark, and Jun's `useObject` on the reader. t20 is not recorded until the grace and `barkDelay` changes (section 8.2) are on the branch.

**t21_flip_r3**, one per cut. Inject CSS before the hand-back: `.aw-flip .aw-lead, .aw-flip .aw-flip-call, .aw-flip .aw-call-notes, .aw-flip .aw-tells { display: none !important }`, so the panel shows only the heading, the E5 line and the Continue button (on a got_it run this hides the call intro, the replayed lines and the notes; on walked_away the panel already has only the heading and line, `flip-view.js` `missed` branch). Marks: `frame:flip-up` (first frame with the panel fully drawn), and the rects of `.aw-heading` and `.aw-defender-line`. Points: in = `frame:flip-up`, out = in + 5.452 s. The panel is on screen for the whole beat; the join is a glitch into it.

### 5.2 Measured in and out points (takes on disk, 26 Nov)

Measured by ffprobe, the trimmed marker files and silencedetect at −40 dB on `~/video-takes-local/ca12/takes/`.

| Take | Length | In-Out | What the measure shows |
|---|---|---|---|
| t04_osint_note | 11.03 s | 4.90-7.90 | unchanged, inside the take |
| t05_pretext_card | 9.84 s | 5.30-8.30 | unchanged |
| t06_the_call (recorded 23 Nov 00:08) | 21.97 s | talk 11.55-13.23 | the choice menu is up from about 12.1 and holds 1.1 s, too short to read: replaced by t06r and t06w. The first frame with the "playtest" name bar is 13.30 |
| t06_the_call | | D1 (old) | the subtitle switches to Delphine at about 14.82; line-start 15.013; "Go on then," 15.14-15.92; the old line's end 19.10 (audio), 19.394 (marker) |
| t11_defend_queue | 15.97 s | 5.08-15.68 | the frame at 15.66 is the same queue with "Check first" hovered, nothing pressed |
| t12_tailgater_card | 18.30 s | 5.90-9.40 | card open from 5.63 |
| t14_lorna_noblame (24 Nov) | 21.80 s | 16.32-20.22 | L5 speech 16.58-19.43; chat closed 20.30 |

**`lands` fallback** if t06r is not shot before the edit: t06 14.95-16.00 ("Go on then," only, 1.05 s), mask the subtitle bar and burn the caption "Go on then," in all three aspects. `lands` becomes 1.05 s and the door beat takes the other 2.65 s (its internal cues are retimed from the marks). If D1 voices over 3.3 s of speech, `lands` takes the extra and the flip loses a half-bar of door lead-in, not the hold. The talk beat then also falls back to t06 11.55-13.23 (menu 1.1 s), which fails the 2 s rule: t06r is the preferred path.

Capture notes:
- t16 to t21 wait for E1 and E4 (with `resume_patrol`) on this branch, the Jun and Lorna shell mappings, CW and the lobby dressing pass. t17 can be shot after the dressing pass alone.
- Record t19 and t20 as one run.
- t06w can be shot now. t06r needs L1 and the D1 re-voice. t12r needs L5 to L7.

## 6. Music

**PeaceFolk "Gently Decaying" from 88.123 s** (bar 32 downbeat, 88.04 BPM, bar 2.726 s, half-bar 1.363 s). It starts one bar later than r2's 85.397, so the cut of v1c and one bar of topic keeps every later hit in the same place against the picture. The window ends at 163.8 s (ca12b) and 166.0 s (ca12) of the 187.2 s track, gain −5 dB, 2.5 s fade out. The nearest used starts are 66.314 (21.8 s away) and 104.478 (16.4 s away). The −45 dB gap check covered 85.4 to 165.4 s; re-run it to 166.1 s at edit time.

Music time = cut time + 2.726 s. Where the cuts land:

| Music (s) | Cut (s) | Change | ca12b | ca12 |
|---|---|---|---|---|
| 10.90 | 8.18 | bar | open card starts | same |
| 16.35 | 13.62 | drop | 0.04 s into topic | same |
| 19.08 | 16.35 | drop and hit | 0.20 s before the red card (16.55); accepted, the card follows v1b's gap | same |
| 20.45, 21.81 | 17.72, 19.08 | hits | bullets 2 and 3 | same |
| 24.53 | 21.80 | lift | 0.75 s into research | same |
| 29.98-32.71 | 27.25-29.98 | hits | kit; v4b on 27.25; the sprite changes on 29.98 | same |
| 46.34 | 43.61 | drop | under Jo's line (+5.06 into tailgate) | 6.26 s into the door beat, before Yusuf |
| 49.07 | 46.34 | drop | 1.36 s before the flip | 0.11 s before the flip |
| 50.43 | 47.70 | half-bar hit | **flip starts** | in the flip |
| 54.52 | 51.79 | lift | in the flip | 0.11 s before the blue card |
| 55.88 | 53.16 | half-bar hit | **blue card starts** | under v7 |
| 57.24 | 54.51 | lift | 1.36 s into the blue card, under v7 | 0.11 s into the tailgater card |

Alternative if GD fails against the render: "Gently Decaying Again" from 85.419 s (r2's 82.693 plus 2.726 s; confirm it is a downbeat in that track's analysis). Its starts in the edit lists are 6.069, 35.541, 64.356 and 102.341: 21.1 s from 64.356 and 16.9 s from 102.341.

## 7. Rubric (CA fun/USP, trailer-observable items)

Scored on the script and planned footage; re-score on the render.

| Item | ca12b | ca12 | Evidence |
|---|---|---|---|
| F1 hook | 3 | 3 | the first 3 s are movement past a guard and through a door; Camila's line follows. Holds with E4 `resume_patrol` or the tight fallback framing |
| F3 agency | 2 | 1 | ca12b: "leave it at the desk" readable for 2.2 s with an inset, the walk-away, and a flip heading that names the route; ca12 shows one route |
| F4 living world | 3 | 3 | walk-in, Yusuf's patrol, Delphine leaving her desk, Jun's badge tap, Jo in the earpiece |
| O1 attacker's steps shown | 3 | 3 | research, cover story, costume, call, door, each narrated in attacker terms |
| O2 attacker reasoning | 3 | 3 | ca12b: v5b sets up "the desk" and "the door", and Jo's "A uniform and a held door beat both." pays it off; ca12: "Name a partner, and she holds the door." closes the research, name, door loop, and the flip names both layers |
| O3 transfer | 3 | 2 | ca12b: v10b answers the held door; ca12: v10's four actions, none about following someone in |
| O4 tone | 3 | 3 | Yusuf polite, never sent back and forth, never standing by while a stranger walks past; Lorna's no-blame line |
| A1 accuracy | 3 | 3 | once L1, L3, L3b and L5 to L7 land; 2 until then |
| A2 safe takeaway | 3 | 3 | pattern level only; the authorisation is on screen (red-card bullets, letter inset) |
| P1 practice or outcome | 2 | 2 | defend queue with no verdicts, and the flip naming the outcome of the learner's own run |

Totals on these 10 items: **ca12b 28/30, ca12 26/30**. F2, F5 and F6 are about play time and replay and are not scored on a trailer.

## 8. Ink and scenario changes

For the follow-up agent. None are applied in this commit. After the ink edits, recompile the .json and run every ca12 route before sending a hash.

### 8.1 In-game line changes (before → after)

| # | File and place | Before | After | Voiced? |
|---|---|---|---|---|
| L1 | `scenarios/ca12_visitor_tailgater/ink/delphine_reception.ink:107`, `ask_reaction` result 1 (keep `# unlock_door:training_room`; recompile the .json) | Go on then, I'll buzz you through. Studio's through the side door on your left. | Go on then. Studio's through the side door on your left. | yes: re-voice Delphine |
| L3 | `scenario.json.erb:705`, `flipDefenderLineByGlobal` `ca12_desk_pass` `line` | The desk said yes on the phone, then opened the door for you. One call got you past both layers. | One conversation got you past desk and door. | no, shown |
| L3b | `scenario.json.erb:700`, `flipDefenderLineByGlobal` `ca12_tailgated` `line` (keep `heading` "In behind a member of staff") | You walked in behind a member of staff while the door held. Nobody had to say yes. | The door held, so nobody had to say yes. | no, shown |
| L4 | `scenario.json.erb:696`, `flipDefenderLine` fallback (not in the trailer, same "call" framing) | The call landed. What happened at the door is above; ... | Your approach landed. What happened at the door is above; ... | no, shown |
| L5 | `scenario.json.erb:365`, 09:12 visitor card transcript; also `ca12_visitor_tailgater_defend:238` and `test_ca12_fallback:245` | (slips in behind a badge-holder at the gate and heads for the stairs) | (slips in behind a badge-holder at the gate and heads into the studio) | no, shown |
| L5b | `scenario.json.erb:376`, the same card's `perFlagNote.no_escort`; also `_defend:249` and `test_ca12_fallback:256` | Heading up alone, with nobody signing for them. | Into the studio alone, with nobody signing for them. | no, shown |
| L6 | `scenario.json.erb:379`, `reportReply` and `reportReplyByVerdict.report` (same two other shells) | Thanks, we caught them on the stairs; they weren't expected. | Thanks, we caught them in the studio; they weren't expected. | check: shown text in the defend card; confirm it has no TTS sidecar |
| L7 | `scenario.json.erb:375`, `perFlagNote.tailgating` (same two other shells) | They badged in on someone else's card, which is exactly what a wedge or a held door lets happen. | They came in behind someone else's badge, which is exactly what a wedge or a held door lets happen. | no, shown |
| L8 | Jun's reader bark (new, SF) | (none) | Morning, Yusuf. | yes: new, Puck |
| L9 | `scenario.json.erb:994`, `outcomeLabels.got_it` (pretext debrief panel, `person-chat-pretext.js:574`; not in the trailer, fixes the same "buzzed" in game) | You got buzzed through the door. | The desk said yes. | no, shown |

Camila's line is unchanged: she keeps "straight up", because the lesson quotes it (:739, and `test_ca12_fallback:588`). The OSINT page's "buzzes expected visitors and couriers through" stays: in-world it reads as "lets through". Delphine's refusal lines that mention buzzing are not in the trailer and stay.

Flip reading time after L3 and L3b: ca12 heading "Now you're the one on the desk" (7 words) plus L3 (8) = 15 words, 4.5 s; ca12b heading (6) plus L3b (9) = 15 words, 4.5 s. Both hold 5.45 s.

### 8.2 Data changes (no new lines)

Both of these land in one commit, before t20 is recorded:
- **Hand-back grace.** It is a scenario timer, not an engine option. `scenario.json.erb:203-210`, timer `ca12_t_grace` (`startOnGlobal: ca12_entered`): `"delayMs": 5000` → `"delayMs": 7500`. Hand-back then falls 0.67 s after Jo ends, and on the desk pass 7.5 s after entry (Yusuf's bark ends at +1.3). Update the plan's note to match (`planning_notes/phishing_and_social_engineering/awareness/CA_PILOT_MECHANICS_PLAN.md` lines 55 and 182, "5 s").
- **Jo's delay.** `scenario.json.erb:1817`, `ca12_jo` mapping on `global_variable_changed:ca12_tailgated`: `"barkDelay": 1800` → `"barkDelay": 2600`, so Jo starts 0.33 s after Yusuf's pass bark ends (both fire on the same `room_entered:training_room`). Update the plan's line 205 to match.

Also needed before the new takes:
- Jun's loop mappings (start on `ca12_runner_go`, stop on `ca12_world_done`, `useObject` on the reader) and the reader bark (L8).
- Lorna mappings 9 (Jo's door toast, stays in the game, hidden in the takes) and 11 (`take_off`), E4.
- E4 `resume_patrol` for Yusuf after `ca12_world_done` (hook and topic).

### 8.3 Lines to voice

| # | Speaker | Voice | Line | Where | Status |
|---|---|---|---|---|---|
| 1 | Narrator | Sulafat_v2 | Booked. Now dress the part. | v4b, both | new, trimmed form |
| 2 | Narrator | Sulafat_v2 | Or skip the desk, and watch the door. | v5b, ca12b | new |
| 3 | Narrator | Sulafat_v2 | Name a partner, and she holds the door. | v6b, ca12 | new |
| 4 | Narrator | Sulafat_v2 | Now swap seats. | v7, both | new |
| 5 | Narrator | Sulafat_v2 | Check the list. Don't let anyone follow you in. | v10b, ca12b | new |
| 6 | Delphine Arvanitis | her scenario voice | Go on then. Studio's through the side door on your left. | L1, ca12 lands | changed |
| 7 | Jun Watanabe | Puck | Morning, Yusuf. | L8, ca12b tailgate | new |

Seven lines. Jo's and Camila's lines are cached and unchanged. After voicing, run the dialogue review on lines 6 and 7 and measure 1 to 5 against their windows. Trim order if long: v6b to "Name a partner. She holds the door.", v5b to "Or skip the desk.", v4b to "Booked. Now dress the part.", v10b to "Don't let anyone follow you in."

### 8.4 Cards (28 characters or fewer per line)

"You play the attacker" 21; bullets "A booked test, signed off" 25, "Scope: the desk and the door" 28, "Challenged? Step back" 21; "You run the front desk" 22; "Visitors and tailgating" 23; "Merrin & Sallow Architects" 26; chips "OPEN-SOURCE RESEARCH" 20, "COVER STORY" 11, "KIT BAG" 7, "FRONT DESK" 10; inset tab "AUTHORISATION" 13; caption labels "Camila" 6, "Delphine" 8, "Yusuf" 5, "Jun" 3, "Jo (earpiece)" 13; close tagline stacked in all three aspects, "Play the attack" 15 / "Learn to stop it" 16; plate "Learn on Hacktivity.co.uk" 25.

## 9. Open for AC0

1. Length: 75.66 s (ca12b) and 77.91 s (ca12). The next cut, if wanted: ca12b's watch beat to 4.5 s (−0.4 s, the flip then sits off the half-bar).
2. Balance: in ca12b the attack half (research to tailgate) runs about 26.7 s and the defend gameplay (queue and Lorna) about 14.5 s. Keep that, or give the queue more time? Default: keep, since the owner asked for the disguise and door mechanic.
3. Voicing: the seven lines in 8.3.
4. Scenario follow-ups that block takes: CW; E4 `resume_patrol`; Jun's loop and reader bark; Lorna 9 and 11; the lobby dressing pass; L1, L3, L3b, L5 to L7; the grace and `barkDelay` pair.

## Changelog

Round 3 (26 Nov), folding in the R2 sell and truth review (0 B, 4 M, 1 m) and the R2 silent viewing and timing review (1 B, 7 M, 6 m):
- Timing B1: grace 5000 → 7500 and `barkDelay` 2600 as one scenario change before t20 (8.2); tailgate 9.15 s, Jo ends 0.32 s before the cut, hand-back 0.35 s after it.
- Sell M1: v6b "Name a partner, and she holds the door."; truth note rewritten (Delphine ignores the hi-vis, Yusuf checks it).
- Sell M2: E4 `resume_patrol` listed for hook and topic, with a tight-framing fallback.
- Sell M3: L2 dropped; Camila keeps the cached "straight up".
- Sell M4 / timing M1 budget: v1c cut, topic one bar shorter, music one bar later; ca12's tailgater card kept; balance question to AC0.
- Timing M1: flip text cut to 15 words in both cuts (L3, L3b), held 5.45 s; CSS hides the call intro, replay and notes. `flipIntro` does not render on a call flip, so there was nothing to hide there.
- Timing M2: menu dwell 2.2 s, talk 2.6 s, 2× inset of the route option; ca12b uses its own take, t06w.
- Timing M3: t06r and t06w specified (5.1).
- Timing M4: Jo's door toast hidden in both cuts (one two-layer statement per cut); captions for every attack-beat speaker; on-screen text at 16 and 20 words.
- Timing M5: v10b "Check the list. Don't let anyone follow you in." (keeps the held-door answer; "Escort them" stays in ca12's v10).
- Timing M6: kit split into panel at 1× and world at 2×, with a panel-width mark.
- Timing M7: t16 and t16b, two runs.
- Minors taken: sell m5 (L5b, L9); timing m1 (lands 3.7 s), m2 (v6b +0.36 s after Delphine), m3 (v3 to v4 0.30 s), m4 (music table redone), m5 (out 13.23, fallback in 14.95), m6 (t20 waits for 8.2).
- Taken differently: timing M4's 9-word toast for ca12 (the in-game toast keeps its clue sentence; the flip carries the layers instead); timing M1's 6.8 s / 6.3 s hold (text cut instead, per AC0); the INFLUENCE inset in talk (the route option takes the inset).

R4 fold (26 Nov), from the delta review of this script (0 B, 1 M, 7 m). All eight findings taken, none declined:
- M1: ca12 door beat retimed so the learner enters at +6.40 s or earlier; v6 now 45.37-46.12, 0.34 s before the flip cut (sections 3, 4.2, 5.1).
- m1: length arithmetic corrected to the real topic trim (−2.73 s); both lengths unchanged (75.66 s, 77.91 s).
- m2: alternative music distances refreshed (21.1 s and 16.9 s).
- m3: t19 in point set after Delphine's reply ends.
- m4: kit shot a sub-timings (0.4 / 1.3 / 0.9 s).
- m5: talk beat inset moved to the last 1.2 s; music table row corrected to 1.36 s before the flip.
- m6: Jo's own toast hidden in t20.
- m7: `lands` slack stated; fallback is 1.05 s throughout.
- No narrator wording changed.
