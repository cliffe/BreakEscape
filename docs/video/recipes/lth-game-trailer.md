# Recipe: SAFETYNET: Licence to Hack game trailer (VID2)

Status: plan (25 Nov 2026). Nothing recorded, rendered or voiced. Script and announcer text: `docs/video/scripts/lth-game-trailer-script.md`. This recipe replaces the beat sheet in `game-trailer.md` for this trailer; the house rules in `README.md` still apply.

## Purpose

One trailer for the whole game, m01 to m10, that sells six things in this order of weight:

1. A spy thriller with stakes and a cast.
2. Puzzles and gadgets: the minigames we have footage of, as many as the cut holds (the few left out are listed under the shot list).
3. Encoding and encryption challenges.
4. Real VMs and real hacking, inside the story.
5. Help so nobody stays stuck: NPC hints, the phone handler, field guides, walkthroughs.
6. The USP, stated plainly in the owner's words: no other game puts real VMs and CTF challenges inside a game narrative like this. No superlatives added.

## Versions

| Version | Spoken audio | Cards |
|---|---|---|
| V1 announcer | A big film-trailer announcer (Gemini TTS, voice picked from three candidates on the review page) in the spaces between the character lines. The announcer never talks over a character line. | Same cards as V2 |
| V2 episode-style | No narrator. In-game character lines from the takes, as the m01 to m10 episode trailers do | Cards carry the six beats |

Both versions use the same picture timeline, shot for shot; only the audio and the burned announcer captions differ. Both: Emerald Trigger from 0:00, cuts on its hits, 30 fps, 16:9, 9:16 and 1:1, -14 LUFS, true peak under -1 dBTP, `.srt` for every version. Character lines are burned in on all three aspects, except three 16:9 shots framed so the game's own subtitle bar shows the line (see Captions). V1's announcer captions are burned in on all three aspects, except where a card or the close already shows the words. The close carries the game's name as a burned line in both versions.

Main cut: 104.768 s (3143 frames). A 30 s cut is planned below; a 60 s cut is left to the owner (Q10).

## Decisions

- **Music.** `game-trailer.md` says the game trailer must not reuse a mission track, and an m01 trailer version tried Emerald Trigger (owner: "not right" for that window). The owner has asked for Emerald Trigger "from its start" for this trailer, and his request wins. Add the row to the music table in `README.md` when the edit is final, with this note.
- **Narration.** `README.md` says narration is Agent HaX's TTS voice. V1 uses an announcer because the owner asked for one. New TTS for it is pre-approved; the voice pick goes to the owner via AC0.
- **Missions.** `game-trailer.md` says m01 to m08; the owner says m01 to m10. Every mission has at least one shot. The m09 shots carry "if the m09 review keeps it" (Q4). m10 appears once, as its forward post at night under "Ten Missions", a map with no text and nothing from its story.
- **Title length.** The `safetynet-open` preset is 6.0 s; the first big impact is at 5.759 s. Override the preset to 173 frames (5.767 s). The keyhole reveal (frames 72 to 102) is untouched.
- **Six beats, not one beat per mission.** The old recipe's "one beat per mission" gives way to the owner's six beats.
- **No pre-laps.** Every character line sits wholly inside its own shot. The burned captions show a line only while its shot is on screen, so a line that starts under the previous shot would lose its opening words. For this reason the Recruiter and the Architect each get one sentence, not two.
- **Two middle story lines.** Between the stakes and the help beat, two characters speak:
  - Kemal Aydin (m06) ends the montage with "Then come and move me.", a minder who has just pocketed his watch and blocks the player's way. It is the trailer's one confrontation, it follows V1's "Don't get caught", and it breaks up the stretch of montage with no voice in V2. The take and window are the ones the m06 trailer used. Terry Mott's "Picks. Right. We're done talking." (m03) was the other candidate. It needs a 3.3 s slot, which would cost the blockchain tracer as well as the PIN pad and the chase, and its picture is a guard talking, not the chase itself. Kemal's 2.4 s line costs only the PIN pad (the keypad shows that kind of lock already) and a 1.6 s chase, and it makes sense without its scene.
  - Victoria Sterling (m03) reads the player's cover CV ("Freelance pen testing. Some CTF work. Competent."), which points at the CTF side of the game. The m03 briefing names her openly as the front's CEO, so nothing is revealed.
- **ATHENA's leak line (m08) is not used.** In a whole-game cut it has no context.
- **m10 briefing lines are not used:** they name WREN, whose place on the team is the m10 twist.
- **No flags card.** "Every flag moves the story" is spoken in V1 (VO6) and offered as an alternative card pair for the USP (Q2). In V2 the flag-accepted shot (S30) carries it in picture.
- **Answer risk.** The m10 console clip (its note lists what stops the threat) and the m10 power-room phone hint (it names the breaker) are not used. Agent HaX's phone help is shown as text: no other voiced HaX phone line exists in the takes.
- **No credentials on screen.** Any frame with a readable login, password, flag value or code is masked or not used. The in-game VM panel take has a sticky note with a login on it; it is masked in every aspect (S23).
- **Montage.** The password panel, the key select, the PIN pad, the rack panel and the chase are out, making room for a conversation with the player's choices on screen (S16) and Kemal's line (S18): talking your way through, and being stopped, are part of play.
- **Codes.** The m09 password-hint screen is not used (its hint text is too close to an answer). The decoding shots come from GAP-4, the same in-game screens at 200% browser zoom with short neutral strings, so input and output read together in every aspect. The existing takes are the fallback (Aspect ratios gives the crops).
- **Console.** Five quick clips with different looks; at most one shows a scan. No tool, exploit or technique is named anywhere.
- **USP wording.** The default is the owner's sentence as he wrote it, ending "like this". The bolder "does this" and a claim-free pair are the alternatives in Q2.
- **Announcer cue lengths.** Each cue sits on its measured clip length where one exists, otherwise on an estimate at the announcer's pace (script, fit rule). At that pace the gap between the Recruiter and the Architect holds about seven words, so VO9 is the claim alone and C7a carries what the claim is about. The gap between Netherton and HaX holds about four words, so VO2 stays "Ten missions. One enemy.", the same words as C1; the voice and the card say the scope line together, and VO2 has no burned caption.
- **Grid.** Cuts sit on measured onsets, which drift from a constant beat grid, so the edit list turns snapping off for the whole edit. Three cuts are deliberate holds off any onset: S23 at 45.772, S32 at 64.236 and C7b at 88.935.
- **End.** The music ends on the 104.768 s drop with a 0.6 s fade, a button end. The 1.6 s fade is the alternative render.
- **No "Your Mission" card**; no "Break Escape"; "Play now"; hard cuts between gameplay; glitch only into and out of cards and the title.

## The music grid (Emerald Trigger)

Track: `public/break_escape/assets/music/SpyAction/Emerald Trigger.mp3`, 162.72 s, 150.01 BPM (beat 0.400 s, bar 1.600 s). The stored analysis (`tools/video/edits/music/emerald_trigger_60.json`) gives beat offset 0.375 s, but the measured onsets fall about 0.36 s after that grid; the working grid is **beat = 0.335 + 0.39996 k s**, bars from 0.775 s. Onsets and per-bar energy for 0 to 130 s: scratch `.../scratchpad/vid2/planner/emerald_trigger_0_130_hits.json` (numpy spectral flux, made for this plan; librosa venvs on this machine were broken). Every cut below sits on a measured onset or a bar line, apart from the three holds listed under Decisions.

| Track time (s) | What the music does | Used for |
|---|---|---|
| 0.0 to 5.6 | Near-silent intro (bars 0 to 2) | Title, VO1 |
| 5.759 | First bass impact | Cut out of the title |
| 6.362, 6.978 | Two stabs | Lights, lights, then Netherton |
| 7.175 to 13.06 | Drop, then a light lift at 10.374 | Netherton's threat line |
| 13.061 | Light onset (0.26) | The ransom screen |
| 13.851 to 17.392 | Stab run (13.851, 16.080, 16.684, 17.392) | Card 1, two location flashes |
| 17.392 to 24.32 | Build; lifts at 21.525 and 24.323 | Two stakes lines |
| 24.323 to 37.57 | Dense hits (26.331, 27.133, 27.934, 28.735, 29.536, 30.232 [0.82], 31.533, 32.729, 34.238, 35.132, 35.933 [0.84]) | Card 2, minigame montage, Kemal |
| 37.573 | One-bar dip (bar) | Card 3 |
| 39.532, 40.728, 42.133 | Bass impacts | Decoding cuts |
| 43.932 to 51.97 | Hit run (43.932 [0.81], 46.533, 47.531 [0.86], 48.530 [0.81], 49.528, 50.329), with a bar at 45.572 | Card 4, VM and console cuts |
| 51.972 to 59.93 | Five smooth bars, few onsets (56.738) | Victoria, flag accepted |
| 59.931 to 74.33 | Steady hits (62.334, 63.936, 65.736, 71.529) | Help movement |
| 74.327, **75.929** | Lead-in hit, then the strongest hit in the track (1.00) | Villain calls, Card 6 |
| 77.531 to 85.57 | Hits (79.931, 82.129) | Voltage, the Recruiter |
| 85.569 to 91.34 | Breakdown (energy halves); onset 88.735 | USP cards (C7b cuts in 0.2 s after the onset, to give C7a its reading time), VO9 |
| 91.336, 91.928 | Onsets | C7b holds through 91.336; one crescendo flash on 91.928 |
| 92.334 | Onset | The Architect's line |
| 95.933 | Onset (0.60) | Lone agent |
| 96.769 | Lift (bar) | Close preset |
| 101.568 | Loudest bar before the end | Curtain and logo |
| 104.768 | Drop (bar 65) | **End.** 0.6 s fade from 104.168 |

**Main cut: 104.768 s (3143 frames), ending on the drop.** A cut to 120 s would need the 112.768 to 120.767 bars for the close and 15 more seconds of montage; 104.768 s keeps the pace.

## Beat sheet

| Trailer time (s) | Movement | Beat carried |
|---|---|---|
| 0.000 to 5.759 | Title | Brand |
| 5.759 to 13.851 | The threat: lights strike at a hospital, a plant in the dark, Netherton, a ransom screen | 1 Spy thriller |
| 13.851 to 17.392 | Ten missions: card, two locations | 1 |
| 17.392 to 24.323 | The stakes: HaX, Netherton | 1 |
| 24.323 to 37.573 | Gadgets, locks and talk: montage, ending on Kemal blocking the way | 2 Puzzles and minigames, 1 |
| 37.573 to 43.932 | Decode and decrypt | 3 Encoding and encryption |
| 43.932 to 51.972 | Real VMs, real hacking | 4 Real VMs |
| 51.972 to 59.931 | Victoria reads the cover CV; a flag goes in and the story reacts | 4, 6 (flags in the story) |
| 59.931 to 74.327 | Stuck? The phone, a field guide, an NPC hint, a walkthrough | 5 Help |
| 74.327 to 85.569 | Meet ENTROPY: calls, Voltage, the Recruiter | 1 |
| 85.569 to 91.928 | The USP, plainly | 6 USP |
| 91.928 to 96.769 | A flash, the Architect, a lone agent | 1, 2 |
| 96.769 to 104.768 | Close: "Play now", red hex curtain, Hacktivity Games | Brand |

## Shot list

Takes live in `~/video-takes-local/<mission>/takes/` (trimmed `.mkv`); console clips in `~/video-takes-local/<mission>/clips/`; the m03 VM approach is in `~/safetynet-footage/m03/takes/`. "From" names the shot in that mission's `tools/video/edits/<mission>_trailer60.json` whose framing, spoiler block and caption flags to copy ("new" means no source framing). All times are seconds. "Lands on" is the cut-in point with its onset strength in brackets, or "bar". "Line" is the spoken line's window on the trailer clock; every line sits wholly inside its shot. Frames are at 30 fps. Ids are fixed labels for the edit list; S19 and F2 are not assigned. Console shots are described by what is on screen, in neutral terms; the clips are cut and frame-checked (`docs/video/logs/CONSOLE_CLIPS.md`, "Varied console beats").

| # | Id | In | Out | Frames | Lands on | Mission, take | Source in to out | Line (trailer clock) | From | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 0 | title | 0.000 | 5.767 | 173 | start | preset `safetynet-open` |  |  |  | duration override 173 frames |
| S01 | lights_hospital | 5.759 | 6.362 | 18 | 5.759 (0.39) | m02 t02_lights | 4.150 to 4.753 |  | m02 m_lights | the corridor relights inside the window (the light change runs 4.1 to 4.9 s in the take) |
| S02 | lights_plant | 6.362 | 6.978 | 18 | 6.362 (0.76) | m04 t02_drop | 3.400 to 4.016 |  | m04 drop_lights | frame-check: slide the window onto the strike if one falls near it; else it plays as a dark office |
| S03 | netherton_threat | 6.978 | 13.061 | 183 | 6.978 (0.70) | m04 t01c_briefing | 4.750 to 10.833 | 7.066 to 12.506 | m04 hook_netherton | frame-check the picture from 4.75; the next line (sped up) starts after the out point |
| S04 | ransom | 13.061 | 13.851 | 24 | 13.061 (0.26) | m02 t04_ransom | 2.300 to 3.090 |  | m02 m_ransom | the ransom screen answers "can't live without" |
| C1 | card_missions | 13.851 | 16.080 | 66 | 13.851 (0.62) | card |  |  |  |  |
| S05 | loc_forward_post | 16.080 | 16.684 | 19 | 16.080 (0.59) | m10 t26_walk_tunnel | 0.300 to 0.904 |  | new | m10's forward post at night: the top-down map with two vans, the folding table and the team under the lamps. No dialogue, name bar or text; take audio muted. 9:16 and 1:1 centred on the vans (cx about 0.35). Frame-check for duplicated team sprites (another m10 take showed copies of the team on this map) |
| S06 | loc_checkpoint | 16.684 | 17.392 | 21 | 16.684 (0.68) | m06 t11_checkpoint_walk | 1.600 to 2.308 |  | m06 walk_checkpoint |  |
| S07 | hax_ward | 17.392 | 21.525 | 124 | 17.392 (0.58) | m02 t01_hax_hook | 11.850 to 15.983 | 17.512 to 21.292 | m02 hax_hook |  |
| S08 | netherton_millions | 21.525 | 24.323 | 84 | 21.525 (0.29) | m07 t10_briefing | 30.020 to 32.818 | 21.725 to 24.185 | m07 stakes_netherton | fade the last 0.1 s; the next sentence starts at source 32.884, after the out point |
| C2 | card_gadgets | 24.323 | 26.331 | 60 | 24.323 (0.47) | card |  |  |  |  |
| S09 | g_lockpick | 26.331 | 27.133 | 24 | 26.331 (0.74) | m01 t04_lockpick | 6.400 to 7.202 |  | m01 m_lockpick |  |
| S10 | g_rfid_read | 27.133 | 27.934 | 24 | 27.133 (0.78) | m03 t04_rfid_clone | 2.600 to 3.401 |  | m03 rfid_read | card number blurred as in m03 |
| S11 | g_rfid_emulate | 27.934 | 28.735 | 24 | 27.934 (0.74) | m03 t20_rfid_emulate | 5.900 to 6.701 |  | m03 rfid_granted |  |
| S12 | g_dust_brush | 28.735 | 29.536 | 24 | 28.735 (0.72) | m04 t14_dust_print | 15.000 to 15.801 |  | m04 dust_brush |  |
| S13 | g_dust_match | 29.536 | 30.232 | 21 | 29.536 (0.68) | m04 t14_dust_print | 35.600 to 36.296 |  | m04 dust_match | the name in the panel stays unreadable, as in m04 |
| S14 | g_biometric | 30.232 | 31.533 | 39 | 30.232 (0.82) | m04 t16_biometric_door | 5.000 to 6.301 |  | m04 bio_reader |  |
| S15 | g_keypad | 31.533 | 32.729 | 36 | 31.533 (0.54) | m02 t06_keypad | 4.700 to 5.896 |  | m02 cr_keypad | a digit goes in during the window (slide it if the display does not change); three digits at most, never the whole code |
| S16 | g_conversation | 32.729 | 34.238 | 45 | 32.729 (0.57) | m02 t09_val (fallback m06 t15_kemal from 31.500, which sets up S18 as his answer) | 10.500 to 12.009 |  | new | a conversation with the player's choices on screen; frame-check that choices show, no suspect is named and no decision screen appears; take audio muted |
| S17 | g_tracer | 34.238 | 35.132 | 27 | 34.238 (0.53) | m06 t14_tracer | 13.600 to 14.494 |  | m06 tracer | the deposit is picked inside the window (at 14.0 in the take) |
| S18 | kemal | 35.132 | 37.573 | 73 | 35.132 (0.70) | m06 t29_kemal_picks | 42.000 to 44.441 | 35.162 to 37.562 | m06 kemal_move | Kemal blocks the way: "Then come and move me." The player portrait and the narrator end before the in point; the out point is before the "turns on you" toast. 16:9 at zoom 1, so the game's bar shows the line |
| C3 | card_codes | 37.573 | 39.532 | 59 | 37.573 bar | card |  |  |  |  |
| S20 | c_base64 | 39.532 | 40.728 | 36 | 39.532 (0.38) | GAP-4 (fallback m01 t14_cyberchef 6.970 to 8.166) |  |  | m01 m_cyberchef | Base64 decoded: a short input and its plain-English output in one frame |
| S21 | c_vigenere | 40.728 | 42.133 | 42 | 40.728 (0.35) | GAP-4 (fallback m09 t16_cyberchef_vigenere 8.500 to 9.905) |  |  | m09 cyberchef | a Vigenère decode, as S20; silent take |
| S22 | c_rot13 | 42.133 | 43.932 | 54 | 42.133 (0.47) | GAP-4 (fallback m02 t08_cyberchef 7.633 to 9.432) |  |  | m02 m_cyberchef | a ROT13 decode, as S20; one short output line, 1.8 s hold |
| C4 | card_real | 43.932 | 45.772 | 55 | 43.932 (0.81) | card |  |  |  |  |
| S23 | vm_in_game | 45.772 | 46.533 | 23 | 45.772 (hold) | m03 t02_vm_approach (safetynet-footage) | window after the desktop draws, 0.761 s |  | new | the VM panel open inside the game with its desktop showing; the sticky note with a login is masked in every aspect (solid box, as the S10 card number). If no window shows the desktop, GAP-5 |
| S24 | con_script_read | 46.533 | 47.531 | 30 | 46.533 (0.47) | m05 console clip | 0.200 to 1.198 |  | m05 real_hacking | an attack script is read out |
| S25 | con_settings | 47.531 | 48.530 | 30 | 47.531 (0.86) | m03 console clip | 0.900 to 1.899 |  | m03 real_hacking | commands entered and settings made |
| S26 | con_run | 48.530 | 49.528 | 30 | 48.530 (0.81) | m09 console clip | 0.800 to 1.798 |  | m09 real_hacking | a run starts and reports back |
| S27 | con_script_list | 49.528 | 50.329 | 24 | 49.528 (0.79) | m07 console clip | 0.600 to 1.401 |  | m07 real_hacking | a script listed on screen |
| S28 | con_session | 50.329 | 51.972 | 49 | 50.329 (0.72) | m08 console clip | 0.400 to 2.043 |  | m08 real_hacking | a session on the target answers; the output lands 0.9 s into the shot |
| S29 | victoria | 51.972 | 56.738 | 143 | 51.972 bar | m03 t19_victoria_pitch | 18.132 to 22.898 | 52.100 to 56.530 | new | she reads the player's cover CV; two pauses inside the line. 16:9 full frame (zoom 1), so the game's bar shows the line |
| S30 | flag_accepted | 56.738 | 59.931 | 96 | 56.738 (0.36) | GAP-3 (m01) |  |  |  | required: the m01 flag station accepts the flag (input and history list masked), about 1.4 s, then a cut to Agent HaX's message as it lands, about 1.8 s |
| C5 | card_help | 59.931 | 62.334 | 72 | 59.931 (0.50) | card |  |  |  |  |
| S31 | phone_ask | 62.334 | 64.236 | 57 | 62.334 (0.61) | GAP-2 (fallback m03 t05_phone, a 1.9 s window from 4.200) |  |  |  | the phone choice "Send me a field guide", then the guide picked from the list |
| S32 | field_guide | 64.236 | 65.736 | 45 | 64.236 (hold) | GAP-2 |  |  |  | the field guide open at the workstation, title readable |
| S33 | irina | 65.736 | 71.529 | 174 | 65.736 (0.66) | m06 t12_irina_badges | 23.900 to 29.693 | 65.973 to 71.393 | m06 irina | an NPC drops a hint; "Exactly backwards." (source 30.26) falls after the out point |
| S34 | walkthrough | 71.529 | 74.327 | 84 | 71.529 (0.62) | GAP-1 |  |  |  | the m01 walkthrough in Hacktivity |
| S35 | v_ghost | 74.327 | 74.995 | 20 | 74.327 (0.67) | m02 t17_ghost_call | 2.700 to 3.368 |  | m02 ghost_reveal |  |
| S36 | v_withheld | 74.995 | 75.929 | 28 | 74.995 (0.67) | m07 t13c_architect_call | 10.300 to 11.234 |  | m07 call_ring | withheld-number call |
| C6 | card_entropy | 75.929 | 77.531 | 48 | 75.929 (1.00) | card |  |  |  | on the strongest hit in the track |
| S37 | voltage_wide | 77.531 | 79.931 | 72 | 77.531 (0.71) | m04 t04_voltage | 64.840 to 67.240 | 77.731 to 79.721 | m04 voltage_wide |  |
| S38 | voltage_close | 79.931 | 82.129 | 66 | 79.931 (0.55) | m04 t04_voltage | 67.240 to 69.438 | 80.141 to 81.611 | m04 voltage_close | hit glitch as in m04 |
| S39 | recruiter | 82.129 | 85.569 | 103 | 82.129 (0.37) | m05 t10_recruiter_call | 146.500 to 149.940 | 82.459 to 85.019 | m05 recruiter_close | one shot, close framing; frame-check the picture from 146.5 to 148.55, not used before |
| C7a | card_usp1 | 85.569 | 88.935 | 101 | 85.569 bar | card |  |  |  |  |
| C7b | card_usp2 | 88.935 | 91.928 | 90 | 88.935 (hold, 0.2 s after the 88.735 onset) | card |  |  |  |  |
| F1 | f_briefcase | 91.928 | 92.334 | 12 | 91.928 (0.55) | m01 t19_minigames | 2.900 to 3.306 |  | m01 cr_briefcase | the one crescendo flash (Q4 offers m10's alarm panel instead) |
| S40 | architect | 92.334 | 95.933 | 108 | 92.334 (0.54) | m07 t13c_architect_call_fx | 37.400 to 40.999 | 92.459 to 95.692 | m07 ending_close | whole line inside the shot; frame-check the picture from 37.4 |
| S41 | lone_agent | 95.933 | 96.769 | 25 | 95.933 (0.60) | m05 t11b_night_corridor | 79.400 to 80.236 |  | new | a lone agent in a dark corridor, silent; take audio muted (a voice plays there); reads as "only one of you" |
| 99 | close | 96.769 | 104.768 | 240 | 96.769 bar | preset `hacktivity-close` |  |  |  | "Play now", red hex curtain; music fade 0.6 s, 104.168 to 104.768 |

Count: 41 gameplay shots (40 shots and 1 flash), 8 cards and 2 presets, 51 rows. V1 and V2 use the same rows. Seven shots depend on new takes: S30 (GAP-3), S31 and S32 (GAP-2), S34 (GAP-1) and S20 to S22 (GAP-4); S31 and S20 to S22 have fallbacks in existing takes, and S23 needs GAP-5 only if its frame check fails.

Mission coverage:

| Mission | Shots |
|---|---|
| m01 | S09, S20, S30, F1 (and the m01 walkthrough in S34) |
| m02 | S01, S04, S07, S15, S16 (if the m02 take passes its check; else m06), S22, S35 |
| m03 | S10, S11, S23, S25, S29 |
| m04 | S02, S03, S12, S13, S14, S37, S38 |
| m05 | S24, S39, S41 |
| m06 | S06, S17, S18, S33 |
| m07 | S08, S27, S36, S40 |
| m08 | S28 |
| m09 | S21, S26 (if the m09 review keeps them) |
| m10 | S05 |

m10's console clip and its voiced phone hint both carry answers, and its briefing lines name the twist, so its one shot is the forward-post map. A second m10 shot is offered in Q4: its alarm panel (`m10 t17_security_office` 6.000 to 6.406, framing from m10 cr_alarm, the red FORCED lamp) in place of the F1 briefcase. Not used from m10: the briefing lines, t14 (story content) and t28 (its decoding input is unreadable at any crop).

Minigames and features shown: lockpick, RFID read and emulate, fingerprint dusting and match, biometric door, keypad, a conversation with choices, blockchain tracer, a minder blocking the way, three decoding screens, the VM panel in the game, the console (five different looks), the flag station accepting a flag, the phone handler, a field guide, an NPC hint, a walkthrough, briefcase, ransom screen. Not shown: the PIN pad (the keypad shows that kind of lock), the rack panel and the guard chase (no room once Kemal's line is in), and the Bluetooth scanner (no footage). None of them is claimed anywhere in the trailer.

Spoiler watch: no culprit or twist character. Left out on purpose: m10 "WREN Is on the Team" and the sleeper line; the m08 mole; the m05 insider (no Owen or Halloran lines); the m09 moral choice and Sorensen ending; Derek in m01 (his identity is the m01 reveal; Q5); every debrief, decision screen and ending.

## Cards

White Press Start 2P on the navy-to-purple gradient, glitch in and out (`effects.cardJoin` switches to dissolve for the alternative render). Same text in V1 and V2.

| Card | In | Out | Seconds | Text | Longest line (characters) |
|---|---|---|---|---|---|
| C1 | 13.851 | 16.080 | 2.229 | Ten Missions / One Enemy | 12 |
| C2 | 24.323 | 26.331 | 2.008 | Pick. Clone. / Crack. | 12 |
| C3 | 37.573 | 39.532 | 1.959 | Encoding & / Encryption | 10 |
| C4 | 43.932 | 45.772 | 1.840 | Real VMs. / Real Hacking. | 13 |
| C5 | 59.931 | 62.334 | 2.403 | Stuck? / Hints. Guides. / Walkthroughs. | 14 |
| C6 | 75.929 | 77.531 | 1.602 | Meet / ENTROPY | 7 |
| C7a | 85.569 | 88.935 | 3.366 | Real VMs and CTF / In a Spy Story | 16 |
| C7b | 88.935 | 91.928 | 2.993 | No Other Game / Does It Like This | 17 |

Reading time: about 0.34 s a word plus 0.5 s (C4, 4 words, needs 1.83 s; C7a, 8 words, 3.17 s; C7b, 7 words, 2.84 s). A glitch join takes up to 5 frames of card on each side. C7a to C7b is a plain cut (same background, only the text changes), so each USP card loses one join only: C7a keeps about 3.20 s clean and C7b about 2.83 s, both at their need. C4 keeps about 1.61 s clean between its two joins, just under its need; if it reads short on the page, take S23 down to 0.6 s and give C4 the difference. C3's alternative is "Encoding. / Encryption.", if the ampersand renders badly in Press Start 2P. C5 is the only three-line card; check it on the 9:16 layout. C7b is the owner's claim in his own words; Q2 puts it beside the bolder "No Other Game / Does This" and the claim-free pair "Every Flag / Moves the Story". Every line stays at or under 17 characters, the longest the mission trailers have used.

## How the console footage is used

The game's own VM panel (S23) comes first, so the viewer sees the machine open inside the game, its desktop showing and the login note masked. Then five quick console shots run on the 46.5 to 51.9 s hit run, each from a 2.6 s clip already cut and frame-checked for the mission trailers (no flag, password, hash, login or token in any frame):

| Shot | Clip | Window in the clip | What the viewer sees |
|---|---|---|---|
| S24 | m05 | 0.200 to 1.198 | An attack script is read out, line by line |
| S25 | m03 | 0.900 to 1.899 | Commands are entered and settings made |
| S26 | m09 | 0.800 to 1.798 | A run starts and reports back |
| S27 | m07 | 0.600 to 1.401 | A script is listed on screen |
| S28 | m08 | 0.400 to 2.043 | A session on the target answers; the output lands 0.9 s into the shot |

No two neighbours look alike, and none is a scan. If a slot ever needs filling, one m06 scan clip may be used; the m01 and m04 scan clips stay out. The m10 file-read clip is not used: the note it shows lists what stops the threat. In 9:16 and 1:1 use the mission trailers' framings (left-anchored, cx 0.28, for the narrow clips; centred for the wide m07 clip). Nothing in the plan, script or captions names a tool, exploit or technique.

## Captions

- `.srt` for every version, from the character `lines[]` and, in V1, the `vo[]` cues.
- Character lines: burned on all three aspects (caption `16:9: true` on each dialogue shot), because the close framings of S03, S08, S33, S37, S38, S39 and S40 crop the game's subtitle bar. The exceptions are S07, S18 and S29 in 16:9, framed at zoom 1 so the game's own bar shows the line; they keep `16:9: false`. Where a burned shot shows a sliver of the bar at the bottom, move the crop until none of it shows. `Caption.tsx` shows a line only while its shot is on screen; every line sits wholly inside its shot, so each caption shows the whole line. S03's caption leaves out "Agent 0x00.", which is spoken before the shot.
- Caption pace: two lines run over 3 words a second, so their captions hold longer than the speech: S07's to the shot's end (21.525) and S38's from the shot's start (79.931).
- 9:16 position: lift `Caption.tsx` to start at 0.60 of the frame height (from 0.70), so a two-line caption ends above the platform UI.
- V1 announcer: burned on all three aspects, in the same skin and position as the character captions (announcer and character lines never overlap, so one caption place serves both). The script's cue table gives each cue's caption state:
  - VO3, VO4, VO5 and VO7 start over a card; their captions stay hidden while the card is up (`onCard: "hide"`) and appear when it cuts away.
  - VO6 shows over S30 and hides when C5 comes up.
  - VO2 and VO9 sit over cards that show the same words, and VO10 over the close, which shows the game's name and "Play now"; none of the three is burned (all stay in the `.srt`).
  - VO1 is burned over the title; frame-check that it clears the keyhole art in each aspect.
- Close: a burned line "SAFETYNET: Licence to Hack" over the close preset from 96.769 to 101.568 (before the curtain covers), Press Start 2P, upper third, in both versions. The 30 s cut carries the same line on its close.

Renderer changes needed before the render (small, in `tools/video/remotion`): `CaVo.tsx` already burns `vo[]` captions in every aspect, reads `cue.text` and supports `onCard: "hide"` and per-cue `caption`. What is missing: a SAFETYNET skin (dark box, Press Start 2P) at the same per-aspect position as `Caption.tsx`, picked from the edit list so Cyber Aware edits are unchanged; the 9:16 lift in `Caption.tsx`; and a text overlay for the close line, if the close preset has no text slot.

## Aspect ratios

- Cards, title and close: per-aspect layouts from the presets and card renderer.
- Dialogue shots: copy each "From" shot's framing (9:16 speaker portrait near cx 0.70).
- The Recruiter (S39) is a single shot in close framing; S29 (Victoria) and S16 (conversation) have no source framing: 16:9 full frame; speaker portrait near cx 0.70 in 9:16, as the other dialogue shots. S18 (Kemal) copies m06 kemal_move.
- Minigames: copy framing from the source shot; S17's window is later than its source, so recheck its 9:16 crop.
- S05 (m10 forward post): 16:9 full frame; 9:16 and 1:1 centred on the vans (cx about 0.35).
- Decoding shots (S20 to S22) from GAP-4: input and output sit close together at 200% zoom, so one crop on the input-to-output span serves all three aspects. Fallback from the existing takes: 2.0 times on the input-to-output span for 16:9 and 1:1 (input and output sit about 464 px apart at 1080p, so no tighter crop holds both); in 9:16 a stacked pan inside each shot, input first, then output. The m02 ROT13 output in the existing take is three long lines and cannot be read in 9:16 at any crop, which is why GAP-4 is required.
- S23 (VM in the game), S30 (flag accepted), S31 and S32 (phone and field guide) and S41 (lone agent): 16:9 full frame; 9:16 and 1:1 centred on the panel or the agent. S23's mask follows the note in every aspect.
- GAP-1 is captured at 1920x1080 with the heading in the centre third, so the 9:16 crop keeps it readable.

## Tooling notes for the edit stage

- A cross-mission edit needs per-shot take folders. `render.sh` reads one takes dir; build one folder of symlinks named `<mission>__<file>` and set `BE_TAKES_DIR` and `BE_CLIPS_DIR` to it (take ids must carry the mission prefix, as the README notes).
- New edit lists: `tools/video/edits/lth_game_trailer_v1.json` and `lth_game_trailer_v2.json`, `length` 104.767, music start 0, `fade_out` 0.6 (1.6 for the alternative render).
- Snapping off for the whole edit (`beat.snap` false, or `snap: false` on every shot), so `lint-edit.mjs` does not error on cuts that sit on measured onsets rather than the constant grid. The three holds (S23, S32, C7b) are deliberate.
- Take audio: S08 fades its last 0.1 s; S18 keeps Kemal's line; S05, S16 and S41 are muted (voices play in S16 and S41); S20 to S22, S30, S31, S32 and S34 have no dialogue.
- Mix: announcer at full, music ducked 10 dB under each cue, as the dialogue duck. Take audio is also ducked 10 dB under a cue (`mix-audio.mjs`), which is why no cue overlaps a character line.

## 30 s cut

For autoplay feeds, where most people see only the first seconds with the sound off. It reuses the main cut's shots, cards and takes. Music: Emerald Trigger from its start, as the owner asked, so the first 30 s of the track; exact cuts are set at the edit stage on its measured onsets (the 0 to 30 s rows of the music grid). The title runs whole, so the game's name is on screen (the preset reveals it at 2.4 to 3.4 s), and the USP is on screen inside the first 10 s.

| Order | Seconds (about) | Content |
|---|---|---|
| 1 | 5.8 | Title, as the main cut (173 frames), out on the 5.759 impact |
| 2 | 5.2 | C7a "Real VMs and CTF / In a Spy Story", then C7b (wording as Q2 settles) |
| 3 | 3.0 | S23 VM panel in the game, then two console shots (S24, S28) |
| 4 | 3.2 | S30 flag accepted, the story reacts |
| 5 | 2.8 | S31 and S32: "Send me a field guide", the guide opens |
| 6 | 2.0 | S34 walkthrough |
| 7 | 8.0 | Close preset at its full 240 frames, with the burned name line, "Play now" |

C4 and the lone agent are left out: C7a already says "Real VMs", and the close needs its full length because the preset's key press and curtain are fixed in frames.

V1 announcer for the 30 s cut, if it is made with one: VO9 and VO10, re-placed on the new clock on their measured lengths, with the same clearances.

## Gaps (new takes needed)

| Gap | Mission and place | What the shot shows | Why no existing take works | Spoiler level |
|---|---|---|---|---|
| GAP-1 (S34, 2.8 s used) | none (Hacktivity, browser capture) | The m01 walkthrough inside Hacktivity's Walkthrough view, no browser URL bar: the heading, the getting-started stage, one visible nudge, the collapsed "Nudge" and "Recipe" boxes unopened; a slow scroll. Capture 4 s | No footage of walkthroughs exists | None if only the m01 getting-started stage shows and nothing is expanded |
| GAP-2 (S31 1.9 s, S32 1.5 s) | m05 or m07, whose phone handler offers the choice | Three frames in one take: the phone conversation with the choice "Send me a field guide" on screen; the guide picked from the list that follows; the field guide open at the workstation with its title readable. Pick only the lockpicking, RFID or encoding guide; never a guide about attacking a service. Capture 5 s | No take shows a field guide. Fallback for the phone half only: `m03 t05_phone` from 4.200 (frame-check) | Low with those three titles |
| GAP-3 (S30, 3.2 s, **required**) | m01, with only one flag seeded (`new-game.rb` FLAGS_XML plus `session-start.sh --flags`): the server flag whose reaction confirms the archive key and sends the player to the server room (the reaction near line 1003 of m01's `scenario.json.erb`). Submit it first; no other flag | The flag station accepts the flag, about 1.4 s; then a cut to Agent HaX's message as it lands (it arrives about 6 s after the submit), about 1.8 s. Mask the input box and the station's history list (it lists every accepted value). Capture 10 s from the submit | Every flag-station take shows the empty station only. The other m01 flag reactions name a character whose identity is the m01 reveal, and m02's name a tool and give part of an answer | None with both masks, and the objectives panel showing no technique name (frame-check) |
| GAP-4 (S20 to S22, **required**) | m01, m09 and m02 decoding screens, in the game | One take of each screen at 200% browser zoom: a short input and its decoded output (Base64, Vigenère, ROT13), each a short neutral phrase chosen at capture, never a mission's message, key or answer. Output one line. Capture 3 s each | The existing takes put input and output too far apart for one crop in 9:16, and the m02 output is three long lines | None |
| GAP-5 (S23, only if its frame check fails) | m03, the in-game VM panel | The VM panel open in the game with the desktop drawn in, the login note out of frame or masked. Capture 3 s | The existing take may show only a dark panel in the usable window | None with the note masked |

No new console footage is needed. Take queue order: GAP-3, GAP-2, GAP-1, GAP-4, then GAP-5 if needed. The silent version's beats 5 and 6 depend on the first three.

Frame checks on existing takes before the edit is locked:

| Shot | Check |
|---|---|
| S01 | The corridor relights inside 4.15 to 4.75 s |
| S02 | Whether a light strike falls near 3.4 to 4.0 s; slide onto it if so |
| S03 | The picture from source 4.75 s (the shot starts earlier than in the m04 trailer); no sliver of the game bar in the burned framings |
| S05 | m10 forward post: no duplicated team sprites, no text, no name bar |
| S15 | A digit goes in during the window; never a whole code |
| S16 | Choices on screen, no suspect named, no decision screen (try `m02 t09_val` after 10.5 s, else `m06 t15_kemal` after 31.5 s) |
| S17 | The deposit is picked inside 13.6 to 14.5 s |
| S18 | The game bar shows only Kemal's line, and no toast appears before the out point |
| S20 to S22 fallback | The output reads as English for the whole window; slide the in point if not. The m09 key and text shown are not the key or text of an m09 puzzle |
| S23 | **Likely to fail.** A window where the desktop has drawn in (the first second of the panel is a dark rectangle); the login note masked in every aspect. If no window shows the desktop, GAP-5 |
| S30 | The objectives panel names no technique; both masks hold for every frame |
| S31 fallback | `m03 t05_phone` from 4.2 s shows the choice cleanly for 1.9 s |
| S39 | The Recruiter's picture from 146.5 to 148.55 s, not used before |
| S40 | The Architect's picture from 37.4 s, not used before |
| S41 | A dark stretch of `m05 t11b_night_corridor` near 79.0 to 80.6 s with the agent alone in frame; else another lone walk |

## Review questions for the owner

1. **Verdict.** For each version: ship, revise or rethink? Which of V1 (announcer) and V2 (character lines only) leads?
2. **The USP claim.** Three options:
   - (a) Default, your sentence as you wrote it, with "like this": C7a "Real VMs and CTF / In a Spy Story", C7b "No Other Game / Does It Like This", and V1's VO9 "No other game does it like this."
   - (b) Bolder: C7b "No Other Game / Does This", VO9 "Real hacking. No other game does this." (the same length on the clock). This is a stronger claim than your sentence, and two public products come close enough that a viewer may object:
     - TryHackMe's Advent of Cyber: a yearly story event with recurring characters, where each day deploys real VMs and asks for flags.
     - SANS Holiday Hack Challenge: an explorable game world with characters and a story, with terminal challenges in real Linux shells and CTF-style objectives.

     What neither has, as far as is publicly known, is a ten-mission spy campaign with full VMs (an attack box and target servers) inside the game world, where every flag is a story key. "Like this" points at that difference; "does this" does not.
   - (c) Claim-free: C7b "Every Flag / Moves the Story", VO9 "Real flags. Inside a spy story.", and VO6 cut so the words do not repeat.
3. **Announcer.** Pick a voice from the auditions on the page (Alnilam, Gacrux, Algenib, in the epic style; Alnilam also in a hushed, urgent style for VO1). Every cue is timed on Alnilam's lengths; the other two also fit if VO5 starts 0.5 s earlier. And the last line: keep VO10 "SAFETYNET: Licence to Hack. Play now.", or end on "SAFETYNET: Licence to Hack. Your mission starts now." (it fits before the music ends; "Play now" stays on the close either way)?
4. **m09 and m10.** The m09 shots (S21 decoding, S26 console) are in, though the m09 trailer is not signed off: keep them? If m09 goes, the only cipher shown beyond encoding is ROT13, so S21 is the shot that backs "Break the ciphers". m10 appears once, as the forward-post map under "Ten Missions" (nothing from its story): keep it, and add its alarm panel (a red FORCED lamp) as the crescendo flash in place of the m01 briefcase?
5. **Derek.** Derek Lawson (m01) is left out: who he is, is the m01 reveal. Keep him out?
6. **"Field notes".** The brief says "feildnotes". The game's help feature is the SAFETYNET Field Guide, which the phone handler sends on request ("Send me a field guide") and which opens at the workstation; the notepad only collects clues. The plan reads your word as field guides (C5 "Guides", and the phone sending one in S31 and S32). Is that what you meant?
7. **Release day.** C1 says "Ten Missions", VO5 says "Real machines" and VO8 says "Walkthroughs for every mission". Will all ten missions, each with its VMs, be live on the day the trailer goes out? (All ten walkthroughs are published and linked already.)
8. **Pace.** Where does it sag? Watch the smooth bars (51.97 to 59.93 s: Victoria, then the flag accepted) and the USP breakdown (85.57 to 91.93 s: cards only). If the first sags, Victoria's shot can be split across the two pauses in her line with an insert of the CV page between. The end is a 0.6 s button; a 1.6 s fade is the alternative render.
9. **Anything on screen** you would not want a viewer to see?
10. **Cut-downs.** Make the 30 s cut (see "30 s cut") once the main cut is signed off? And a 60 s cut as well?
