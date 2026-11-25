# Recipe: SAFETYNET: Licence to Hack game trailer (VID2)

Status: plan (25 Nov 2026). Nothing recorded, rendered or voiced. Script and announcer text: `docs/video/scripts/lth-game-trailer-script.md`. This recipe replaces the beat sheet in `game-trailer.md` for this trailer; the house rules in `README.md` still apply.

## Purpose

One trailer for the whole game, m01 to m10, that sells six things in this order of weight:

1. A spy thriller with stakes and a cast.
2. Puzzles and gadgets: every minigame we have footage of.
3. Encoding and encryption challenges.
4. Real VMs and real hacking, inside the story.
5. Help so nobody stays stuck: NPC hints, the phone handler, field guides, walkthroughs.
6. The USP, stated plainly: no other game puts real VMs and CTF challenges inside a game narrative. This is the owner's claim, used as he worded it, with no superlatives added.

## Versions

| Version | Spoken audio | Cards |
|---|---|---|
| V1 announcer | A big film-trailer announcer (Gemini TTS, voice picked from three candidates on the review page) in the spaces between the character lines. The announcer never talks over a character line. | Same cards as V2 |
| V2 episode-style | No narrator. In-game character lines from the takes, as the m01 to m10 episode trailers do | Cards carry the six beats |

Both versions use the same picture timeline, shot for shot; only the audio and the burned announcer captions differ. Both: Emerald Trigger from 0:00, cuts on its hits, 30 fps, 16:9, 9:16 and 1:1, -14 LUFS, true peak under -1 dBTP, `.srt` for every version. Character lines are burned in on 9:16 and 1:1; V1's announcer captions are burned in on all three aspects.

Main cut: 104.768 s (3143 frames). A 30 s cut is planned below; a 60 s cut is left to the owner (Q10).

## Decisions

- **Music.** `game-trailer.md` says the game trailer must not reuse a mission track, and an m01 trailer version tried Emerald Trigger (owner: "not right" for that window). The owner has asked for Emerald Trigger "from its start" for this trailer, and his request wins. Add the row to the music table in `README.md` when the edit is final, with this note.
- **Narration.** `README.md` says narration is Agent HaX's TTS voice. V1 uses an announcer because the owner asked for one. New TTS for it is pre-approved; the voice pick goes to the owner via AC0.
- **Missions.** `game-trailer.md` says m01 to m08; the owner says m01 to m10. The m09 shots carry "if the m09 review keeps it" (Q4). m10 has no shot in this timeline (see coverage).
- **Title length.** The `safetynet-open` preset is 6.0 s; the first big impact is at 5.759 s. Override the preset to 173 frames (5.767 s). The keyhole reveal (frames 72 to 102) is untouched.
- **Six beats, not one beat per mission.** The old recipe's "one beat per mission" gives way to the owner's six beats.
- **No pre-laps.** Every character line sits wholly inside its own shot. The burned captions show a line only while its shot is on screen, so a line that starts under the previous shot would lose its opening words. For this reason the Recruiter and the Architect each get one sentence, not two.
- **One middle story line.** Victoria Sterling (m03) is the only character between the stakes and the help beat. No other voiced line in the takes suits that slot. She is reading the player's cover CV ("Freelance pen testing. Some CTF work. Competent."), which points at the CTF side of the game, and the m03 briefing names her openly as the front's CEO, so nothing is revealed.
- **ATHENA's leak line (m08) is not used.** In a whole-game cut it has no context.
- **An m10 briefing line was considered for the stakes slot and not used:** spoiler risk, and the slot is taken.
- **No flags card.** "Every flag moves the story" is spoken in V1 (VO6) and offered as an alternative card pair for the USP (Q2). In V2 the flag-accepted shot (S30) carries it in picture.
- **Answer risk.** The m10 console clip (its note lists what stops the threat) and the m10 power-room phone hint (it names the breaker) are not used. Agent HaX's phone help is shown as text: no other voiced HaX phone line exists in the takes.
- **Montage.** The password panel and the key select are out of the montage, making room for a conversation with the player's choices on screen (S16): talking your way through is part of play. The key select survives as an option for the second crescendo flash.
- **Codes.** The m09 password-hint screen is not used (its hint text is too close to an answer). Each decoding shot is framed tight on the input and output panes and held where the output reads as English.
- **Console.** Five quick clips with different looks; at most one shows a scan. No tool, exploit or technique is named anywhere.
- **End.** The music ends on the 104.768 s drop with a 0.6 s fade, a button end. The 1.6 s fade is the alternative render.
- **No "Your Mission" card**; no "Break Escape"; "Play now"; hard cuts between gameplay; glitch only into and out of cards and the title.

## The music grid (Emerald Trigger)

Track: `public/break_escape/assets/music/SpyAction/Emerald Trigger.mp3`, 162.72 s, 150.01 BPM (beat 0.400 s, bar 1.600 s). The stored analysis (`tools/video/edits/music/emerald_trigger_60.json`) gives beat offset 0.375 s, but the measured onsets fall about 0.36 s after that grid; the working grid is **beat = 0.335 + 0.39996 k s**, bars from 0.775 s. Onsets and per-bar energy for 0 to 130 s: scratch `.../scratchpad/vid2/planner/emerald_trigger_0_130_hits.json` (numpy spectral flux, made for this plan; librosa venvs on this machine were broken). Every cut below sits on a measured onset or a bar line.

| Track time (s) | What the music does | Used for |
|---|---|---|
| 0.0 to 5.6 | Near-silent intro (bars 0 to 2) | Title, VO1 |
| 5.759 | First bass impact | Cut out of the title |
| 6.362, 6.978 | Two stabs | Lights, lights, then Netherton |
| 7.175 to 13.06 | Drop, then a light lift at 10.374 | Netherton's threat line |
| 13.061 | Light onset (0.26) | The ransom screen |
| 13.851 to 17.392 | Stab run (13.851, 16.080, 16.684, 17.392) | Card 1, two location flashes |
| 17.392 to 24.32 | Build; lifts at 21.525 and 24.323 | Two stakes lines |
| 24.323 to 37.57 | Dense hits (26.331, 27.133, 27.934, 28.735, 29.536, 30.232 [0.82], 31.533, 32.729, 34.238, 35.132, 35.933 [0.84]) | Card 2, minigame montage |
| 37.573 | One-bar dip (bar) | Card 3 |
| 39.532, 40.728, 42.133 | Bass impacts | Decoding cuts |
| 43.932 to 51.97 | Hit run (43.932 [0.81], 46.533, 47.531 [0.86], 48.530 [0.81], 49.528, 50.329), with a bar at 45.572 | Card 4, VM and console cuts |
| 51.972 to 59.93 | Five smooth bars, few onsets (56.738) | Victoria, flag accepted |
| 59.931 to 74.33 | Steady hits (62.334, 63.936, 65.736, 71.529) | Help movement |
| 74.327, **75.929** | Lead-in hit, then the strongest hit in the track (1.00) | Villain calls, Card 6 |
| 77.531 to 85.57 | Hits (79.931, 82.129) | Voltage, the Recruiter |
| 85.569 to 91.34 | Breakdown (energy halves); onset 88.735 | USP cards, VO9 |
| 91.336, 91.928 | Onsets | Two crescendo flashes |
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
| 5.759 to 13.851 | The threat: lights fail, Netherton, a ransom screen | 1 Spy thriller |
| 13.851 to 17.392 | Ten missions: card, two locations | 1 |
| 17.392 to 24.323 | The stakes: HaX, Netherton | 1 |
| 24.323 to 37.573 | Gadgets, locks and talk: montage | 2 Puzzles and minigames |
| 37.573 to 43.932 | Decode and decrypt | 3 Encoding and encryption |
| 43.932 to 51.972 | Real VMs, real hacking | 4 Real VMs |
| 51.972 to 59.931 | Victoria reads the cover CV; a flag goes in and the story reacts | 4, 6 (flags in the story) |
| 59.931 to 74.327 | Stuck? The phone, a field guide, an NPC hint, a walkthrough | 5 Help |
| 74.327 to 85.569 | Meet ENTROPY: calls, Voltage, the Recruiter | 1 |
| 85.569 to 91.336 | The USP, plainly | 6 USP |
| 91.336 to 96.769 | Two flashes, the Architect, a lone agent | 1, 2 |
| 96.769 to 104.768 | Close: "Play now", red hex curtain, Hacktivity Games | Brand |

## Shot list

Takes live in `~/video-takes-local/<mission>/takes/` (trimmed `.mkv`); console clips in `~/video-takes-local/<mission>/clips/`; the m03 VM approach is in `~/safetynet-footage/m03/takes/`. "From" names the shot in that mission's `tools/video/edits/<mission>_trailer60.json` whose framing, spoiler block and caption flags to copy ("new" means no source framing). All times are seconds. "Lands on" is the cut-in point with its onset strength in brackets, or "bar". "Line" is the spoken line's window on the trailer clock; every line sits wholly inside its shot. Frames are at 30 fps. One cut (S36) is off the grid and needs `snap:false` in the edit list. Console shots are described by what is on screen, in neutral terms; the clips are cut and frame-checked (`docs/video/logs/CONSOLE_CLIPS.md`, "Varied console beats").

| # | Id | In | Out | Frames | Lands on | Mission, take | Source in to out | Line (trailer clock) | From | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 0 | title | 0.000 | 5.767 | 173 | start | preset `safetynet-open` |  |  |  | duration override 173 frames |
| S01 | lights_hospital | 5.759 | 6.362 | 18 | 5.759 (0.39) | m02 t02_lights | 2.910 to 3.513 |  | m02 m_lights | lights strike |
| S02 | lights_plant | 6.362 | 6.978 | 18 | 6.362 (0.76) | m04 t02_drop | 3.400 to 4.016 |  | m04 drop_lights |  |
| S03 | netherton_threat | 6.978 | 13.061 | 183 | 6.978 (0.70) | m04 t01c_briefing | 4.750 to 10.833 | 7.066 to 12.506 | m04 hook_netherton | frame-check the picture from 4.75; the next line (sped up) starts after the out point |
| S04 | ransom | 13.061 | 13.851 | 24 | 13.061 (0.26) | m02 t04_ransom | 2.300 to 3.090 |  | m02 m_ransom | the ransom screen answers "can't live without" |
| C1 | card_missions | 13.851 | 16.080 | 66 | 13.851 (0.62) | card |  |  |  |  |
| S05 | loc_night_hall | 16.080 | 16.684 | 19 | 16.080 (0.59) | m03 t02_hall_lights | 3.300 to 3.904 |  | m03 m_lights |  |
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
| S15 | g_keypad | 31.533 | 32.729 | 36 | 31.533 (0.54) | m02 t06_keypad | 4.700 to 5.896 |  | m02 cr_keypad | frame-check: three digits at most, never the whole code |
| S16 | g_conversation | 32.729 | 34.238 | 45 | 32.729 (0.57) | m02 t09_val (or m06 t15_kemal from 31.500) | 10.500 to 12.009 |  | new | a conversation with the player's choices on screen; frame-check that choices show, no suspect is named and no decision screen appears; take audio muted |
| S17 | g_tracer | 34.238 | 35.132 | 27 | 34.238 (0.53) | m06 t14_tracer | 12.900 to 13.794 |  | m06 tracer |  |
| S18 | g_pinpad | 35.132 | 35.933 | 24 | 35.132 (0.70) | m06 t23_pin_door | 6.900 to 7.701 |  | m06 cr_pinpad | wider than m06's window: frame-check the digits |
| S19 | g_chase | 35.933 | 37.573 | 49 | 35.933 (0.84) | m03 t17b_guard | 100.900 to 102.540 |  | m03 t17b_chase | a guard gives chase |
| C3 | card_codes | 37.573 | 39.532 | 59 | 37.573 bar | card |  |  |  |  |
| S20 | c_base64 | 39.532 | 40.728 | 36 | 39.532 (0.38) | m01 t14_cyberchef | 6.970 to 8.166 |  | m01 m_cyberchef | framed tight on the input and output panes (zoom 2.5 to 3); hold where the output reads as plain English |
| S21 | c_vigenere | 40.728 | 42.133 | 42 | 40.728 (0.35) | m09 t16_cyberchef_vigenere | 8.500 to 9.905 |  | m09 cyberchef | as S20; silent take |
| S22 | c_rot13 | 42.133 | 43.932 | 54 | 42.133 (0.47) | m02 t08_cyberchef | 7.633 to 9.432 |  | m02 m_cyberchef | as S20; 1.8 s hold so the output can be read |
| C4 | card_real | 43.932 | 45.572 | 49 | 43.932 (0.81) | card |  |  |  |  |
| S23 | vm_in_game | 45.572 | 46.533 | 29 | 45.572 bar | m03 t02_vm_approach (safetynet-footage) | 7.744 to 8.705 |  | new | the VM panel opens inside the game and the desktop draws in; frame-check for login text |
| S24 | con_script_read | 46.533 | 47.531 | 30 | 46.533 (0.47) | m05 console clip | 0.200 to 1.198 |  | m05 real_hacking | an attack script is read out |
| S25 | con_settings | 47.531 | 48.530 | 30 | 47.531 (0.86) | m03 console clip | 0.900 to 1.899 |  | m03 real_hacking | commands entered and settings made |
| S26 | con_run | 48.530 | 49.528 | 30 | 48.530 (0.81) | m09 console clip | 0.800 to 1.798 |  | m09 real_hacking | a run starts and reports back |
| S27 | con_script_list | 49.528 | 50.329 | 24 | 49.528 (0.79) | m07 console clip | 0.600 to 1.401 |  | m07 real_hacking | a script listed on screen |
| S28 | con_session | 50.329 | 51.972 | 49 | 50.329 (0.72) | m08 console clip | 0.400 to 2.043 |  | m08 real_hacking | a session on the target answers; the output lands 0.9 s into the shot |
| S29 | victoria | 51.972 | 56.738 | 143 | 51.972 bar | m03 t19_victoria_pitch | 18.132 to 22.898 | 52.100 to 56.530 | new | she reads the player's cover CV; two pauses inside the line |
| S30 | flag_accepted | 56.738 | 59.931 | 96 | 56.738 (0.36) | GAP-3 |  |  |  | required: the flag station accepts a masked value, then the story reacts on screen |
| C5 | card_help | 59.931 | 62.334 | 72 | 59.931 (0.50) | card |  |  |  |  |
| S31 | phone_ask | 62.334 | 63.936 | 48 | 62.334 (0.61) | GAP-2 (fallback m03 t05_phone 4.200 to 5.802) |  |  |  | the phone choice "Send me a field guide" |
| S32 | field_guide | 63.936 | 65.736 | 54 | 63.936 (0.53) | GAP-2 |  |  |  | the field guide opens, title readable |
| S33 | irina | 65.736 | 71.529 | 174 | 65.736 (0.66) | m06 t12_irina_badges | 23.900 to 29.693 | 65.973 to 71.393 | m06 irina | an NPC drops a hint; "Exactly backwards." (source 30.26) falls after the out point |
| S34 | walkthrough | 71.529 | 74.327 | 84 | 71.529 (0.62) | GAP-1 |  |  |  | the m01 walkthrough in Hacktivity |
| S35 | v_ghost | 74.327 | 74.995 | 20 | 74.327 (0.67) | m02 t17_ghost_call | 2.700 to 3.368 |  | m02 ghost_reveal |  |
| S36 | v_withheld | 74.995 | 75.929 | 28 | 74.995 off-grid, snap:false | m07 t13c_architect_call | 10.300 to 11.234 |  | m07 call_ring | withheld-number call |
| C6 | card_entropy | 75.929 | 77.531 | 48 | 75.929 (1.00) | card |  |  |  | on the strongest hit in the track |
| S37 | voltage_wide | 77.531 | 79.931 | 72 | 77.531 (0.71) | m04 t04_voltage | 64.840 to 67.240 | 77.731 to 79.721 | m04 voltage_wide |  |
| S38 | voltage_close | 79.931 | 82.129 | 66 | 79.931 (0.55) | m04 t04_voltage | 67.240 to 69.438 | 80.141 to 81.611 | m04 voltage_close | hit glitch as in m04 |
| S39 | recruiter | 82.129 | 85.569 | 103 | 82.129 (0.37) | m05 t10_recruiter_call | 146.500 to 149.940 | 82.459 to 85.019 | m05 recruiter_close | one shot, close framing; frame-check the picture from 146.5 to 148.55, not used before |
| C7a | card_usp1 | 85.569 | 88.735 | 95 | 85.569 bar | card |  |  |  |  |
| C7b | card_usp2 | 88.735 | 91.336 | 78 | 88.735 (0.59) | card |  |  |  |  |
| F1 | f_briefcase | 91.336 | 91.928 | 18 | 91.336 (0.44) | m01 t19_minigames | 2.900 to 3.492 |  | m01 cr_briefcase |  |
| F2 | f_rack | 91.928 | 92.334 | 12 | 91.928 (0.55) | m04 t13_rack_dial (or m01 t19_minigames key select from 23.600) | 5.000 to 5.406 |  | m04 puzzle_panel | panel only, never the dial |
| S40 | architect | 92.334 | 95.933 | 108 | 92.334 (0.54) | m07 t13c_architect_call_fx | 37.400 to 40.999 | 92.459 to 95.692 | m07 ending_close | whole line inside the shot; frame-check the picture from 37.4 |
| S41 | lone_agent | 95.933 | 96.769 | 25 | 95.933 (0.60) | m05 t11b_night_corridor | 79.400 to 80.236 |  | new | a lone agent in a dark corridor, silent; take audio muted (a voice plays there); reads as "only one of you" |
| 99 | close | 96.769 | 104.768 | 240 | 96.769 bar | preset `hacktivity-close` |  |  |  | "Play now", red hex curtain; music fade 0.6 s, 104.168 to 104.768 |

Count: 43 gameplay shots (41 shots and 2 flashes), 8 cards and 2 presets, 53 rows. V1 and V2 use the same rows. Four shots depend on new takes: S30 (GAP-3), S31 and S32 (GAP-2) and S34 (GAP-1); S31 has a fallback in an existing take.

Mission coverage:

| Mission | Shots |
|---|---|
| m01 | S09, S20, F1 (and the m01 walkthrough in S34) |
| m02 | S01, S04, S07, S15, S16 (if the m02 take passes its check; else m06), S22, S35 |
| m03 | S05, S10, S11, S19, S23, S25, S29 |
| m04 | S02, S03, S12, S13, S14, S37, S38, F2 |
| m05 | S24, S39, S41 |
| m06 | S06, S17, S18, S33 |
| m07 | S08, S27, S36, S40 |
| m08 | S28 |
| m09 | S21, S26 (if the m09 review keeps them) |
| m10 | none |

m10 has no shot: its usable console clip and its voiced phone hint both carry answers. If the owner wants m10 in (Q4), the simplest swap is F2 for m10's alarm panel (`m10 t17_security_office` 6.000 to 6.406, framing from m10 cr_alarm), or GAP-3 can be recorded in m10 if its story reaction gives nothing away.

Minigames and features shown: lockpick, RFID read and emulate, fingerprint dusting and match, biometric door, keypad, a conversation with choices, blockchain tracer, PIN pad, guards and a chase, three decoding screens, the VM panel in the game, the console (five different looks), the flag station accepting a flag, the phone handler, a field guide, an NPC hint, a walkthrough, briefcase, rack panel, ransom screen. Not shown: the Bluetooth scanner (no footage; not claimed anywhere in the trailer).

Spoiler watch: no culprit or twist character. Left out on purpose: m10 "WREN Is on the Team" and the sleeper line; the m08 mole; the m05 insider (no Owen or Halloran lines); the m09 moral choice and Sorensen ending; Derek in m01 (his identity is the m01 reveal; Q5); every debrief, decision screen and ending.

## Cards

White Press Start 2P on the navy-to-purple gradient, glitch in and out (`effects.cardJoin` switches to dissolve for the alternative render). Same text in V1 and V2.

| Card | In | Out | Seconds | Text | Longest line (characters) |
|---|---|---|---|---|---|
| C1 | 13.851 | 16.080 | 2.229 | Ten Missions / One Enemy | 12 |
| C2 | 24.323 | 26.331 | 2.008 | Pick. Clone. / Crack. | 12 |
| C3 | 37.573 | 39.532 | 1.959 | Encoding & / Encryption | 10 |
| C4 | 43.932 | 45.572 | 1.640 | Real VMs. / Real Hacking. | 13 |
| C5 | 59.931 | 62.334 | 2.403 | Stuck? / Hints. Guides. / Walkthroughs. | 14 |
| C6 | 75.929 | 77.531 | 1.602 | Meet / ENTROPY | 7 |
| C7a | 85.569 | 88.735 | 3.166 | Real VMs and CTF / In a Spy Story | 16 |
| C7b | 88.735 | 91.336 | 2.601 | No Other Game / Does This | 13 |

C3's alternative is "Encoding. / Encryption.", if the ampersand renders badly in Press Start 2P. C5 is the only three-line card; check it on the 9:16 layout. C7b is the owner's claim in his own words; Q2 puts it beside the softer "No Other Game / Does It Like This" (17 characters) and the claim-free pair "Every Flag / Moves the Story". Every line stays at or under 17 characters, the longest the mission trailers have used.

## How the console footage is used

The game's own VM panel (S23) comes first, so the viewer sees the machine open inside the game. Then five quick console shots run on the 46.5 to 51.9 s hit run, each from a 2.6 s clip already cut and frame-checked for the mission trailers (no flag, password, hash, login or token in any frame):

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
- Character lines: burned on 9:16 and 1:1, not on 16:9, where the game's own subtitle bar shows (the m04 to m10 pattern). `Caption.tsx` shows a line only while its shot is on screen; every line here sits wholly inside its shot, so each caption shows the whole line.
- V1 announcer: burned on all three aspects, so the 16:9 cut also works with the sound off.
- Cards are text already. VO3 and VO4 start over a card; their captions stay hidden while the card is up (`onCard: "hide"`) and appear when it cuts away. VO2 and VO9 sit almost wholly over cards that carry the same idea, so they get no burned caption at all (they stay in the `.srt`); otherwise a caption would flash for a fraction of a second after the card.

Renderer change needed before the V1 render (small, in `tools/video/remotion`): `CaVo.tsx` already burns `vo[]` captions in every aspect and reads `cue.text`, but it draws the Cyber Aware skin (light plate, VT323) at 6% from the bottom. Add a SAFETYNET skin that matches the character captions (dark box, Press Start 2P), sit it at least 0.2 of the frame height from the bottom in 9:16 and 1:1 so it clears the platform UI, and add the `onCard` option. Pick the skin from the edit list, so CA edits are unchanged.

## Aspect ratios

- Cards, title and close: per-aspect layouts from the presets and card renderer.
- Dialogue shots: copy each "From" shot's framing (9:16 speaker portrait near cx 0.70).
- The Recruiter (S39) is a single shot in close framing; S29 (Victoria) and S16 (conversation) have no source framing: speaker portrait near cx 0.70 in 9:16, as the other dialogue shots.
- Minigames: copy framing from the source shot; S18 is a wider window than its source, so recheck its 9:16 crop.
- Decoding shots (S20 to S22): one tight crop on the input and output panes at 2.5 to 3 times, used for all three aspects, so the output is readable on a phone. If a crop softens the text too much, use GAP-4.
- S23 (VM in the game), S30 (flag accepted), S31 and S32 (phone and field guide) and S41 (lone agent): 16:9 full frame; 9:16 and 1:1 centred on the panel or the agent.
- GAP-1 is captured at 1920x1080 with the heading in the centre third, so the 9:16 crop keeps it readable.

## Tooling notes for the edit stage

- A cross-mission edit needs per-shot take folders. `render.sh` reads one takes dir; build one folder of symlinks named `<mission>__<file>` and set `BE_TAKES_DIR` and `BE_CLIPS_DIR` to it (take ids must carry the mission prefix, as the README notes).
- New edit lists: `tools/video/edits/lth_game_trailer_v1.json` and `lth_game_trailer_v2.json`, `length` 104.767, music start 0, `fade_out` 0.6 (1.6 for the alternative render).
- `snap: false` on the S36 cut-in at 74.995 s, the one cut off the grid. Every other cut sits on an onset or a bar.
- Take audio: S08 fades its last 0.1 s; S16 and S41 are muted (voices play in those takes); S30, S31, S32 and S34 have no dialogue.
- Mix: announcer at full, music ducked 10 dB under each cue, as the dialogue duck. Take audio is also ducked 10 dB under a cue (`mix-audio.mjs`), which is why no cue overlaps a character line.

## 30 s cut

For autoplay feeds, where most people see only the first seconds with the sound off. It reuses the main cut's shots, cards and takes; the music window and exact cuts are set at the edit stage on the same grid (the 43.932 to 74.327 s stretch of the track, hit run, smooth bars and steady hits, is the first candidate). The USP is on screen inside the first 10 s.

| Order | Seconds (about) | Content |
|---|---|---|
| 1 | 2.0 | Short title: the keyhole only |
| 2 | 5.0 | C7a "Real VMs and CTF / In a Spy Story", then C7b (wording as Q2 settles), over one gameplay flash each |
| 3 | 1.6 | C4 "Real VMs. / Real Hacking." |
| 4 | 3.0 | S23 VM panel in the game, then two console shots (S24, S28) |
| 5 | 3.2 | S30 flag accepted, the story reacts |
| 6 | 4.0 | S31 and S32: "Send me a field guide", the guide opens |
| 7 | 2.8 | S34 walkthrough |
| 8 | 0.8 | S41 lone agent |
| 9 | 7.6 | Close preset, "Play now" |

V1 announcer for the 30 s cut, if it is made with one: VO9, VO5 and VO10, re-placed on the new clock with the same fit rule.

## Gaps (new takes needed)

| Gap | Mission and place | What the shot shows | Why no existing take works | Spoiler level |
|---|---|---|---|---|
| GAP-1 (S34, 2.8 s used) | none (Hacktivity, browser capture) | The m01 walkthrough inside Hacktivity's Walkthrough view, no browser URL bar: the heading, the getting-started stage, one visible nudge, the collapsed "Nudge" and "Recipe" boxes unopened; a slow scroll. Capture 4 s | No footage of walkthroughs exists | None if only the m01 getting-started stage shows and nothing is expanded |
| GAP-2 (S31 1.6 s, S32 1.8 s) | m05 or m07, whose phone handler offers the choice | The phone conversation with the choice "Send me a field guide" on screen, then the field guide opening at the workstation with its title readable. Show only the lockpicking, RFID or encoding guide; never a guide about attacking a service | No take shows a field guide. Fallback for the phone half only: `m03 t05_phone` 4.200 to 5.802 (frame-check) | Low with those three titles |
| GAP-3 (S30, 3.2 s, **required**) | a real mission with seeded flags (`new-game.rb` FLAGS_XML plus `session-start.sh --flags`); pick one where the reaction gives nothing away, such as m01 or m02 | A flag goes into the flag station, the value masked; the station accepts it; then the story reacts on screen (a handler message, a door opening or an objective ticking) | Every flag-station take shows the empty station only. Without this shot, "every flag moves the story" has no picture | None with the value masked and an early, neutral reaction |
| GAP-4 (optional) | m01, m02, m09 decoding screens | One take of each decoding screen at 200% browser zoom | Only if the 2.5 to 3 times crops of S20 to S22 are not sharp enough to read | None (same screens) |

No new console footage is needed.

Frame checks on existing takes before the edit is locked:

| Shot | Check |
|---|---|
| S03 | The picture from source 4.75 s (the shot starts earlier than in the m04 trailer) |
| S15, S18 | Digits: never a whole code |
| S16 | Choices on screen, no suspect named, no decision screen (try `m02 t09_val` after 10.5 s, else `m06 t15_kemal` after 31.5 s) |
| S20 to S22 | The output reads as English for the whole window; slide the in point if not |
| S23 | No login text readable |
| S31 fallback | `m03 t05_phone` 4.2 to 5.8 s shows the choice cleanly |
| S39 | The Recruiter's picture from 146.5 to 148.55 s, not used before |
| S40 | The Architect's picture from 37.4 s, not used before |
| S41 | A dark stretch of `m05 t11b_night_corridor` near 79.0 to 80.6 s with the agent alone in frame; else another lone walk |

## Review questions for the owner

1. **Verdict.** For each version: ship, revise or rethink? Which of V1 (announcer) and V2 (character lines only) leads?
2. **The USP claim.** Default, in your words from the brief: C7a "Real VMs and CTF / In a Spy Story", C7b "No Other Game / Does This", and V1's VO9 "Inside a spy story. No other game does this." Two public products come close enough that a viewer may object:
   - TryHackMe's Advent of Cyber: a yearly story event with recurring characters, where each day deploys real VMs and asks for flags.
   - SANS Holiday Hack Challenge: an explorable game world with characters and a story, with terminal challenges in real Linux shells and CTF-style objectives.

   What neither has, as far as is publicly known, is a ten-mission spy campaign with full VMs (an attack box and target servers) inside the game world, where every flag is a story key. Options: (a) keep your wording; (b) the softer C7b "No Other Game / Does It Like This" (17 characters), with VO9 "Inside a spy story. No other game does it like this." (11 words, fit 6.15 s; placed 86.00 to 92.15 it still clears the Architect by 0.31 s, and "No other game" lands 0.24 s before C7b); (c) a claim-free pair, C7b "Every Flag / Moves the Story", with VO9 "Real machines. Real flags. Inside a spy story." (fits) and VO6 cut to keep the words from repeating.
3. **Announcer voice.** Pick one of the three candidates on the page (Alnilam, Gacrux, Algenib). Each reads VO9 and VO10, so you also hear how it says "SAFETYNET".
4. **m09 and m10.** The m09 shots (S21 decoding, S26 console) are in, though the m09 trailer is not signed off: keep them? m10 has no shot, because its usable console clip and its voiced phone hint both give answers away. Should m10 appear? The simplest way in is its alarm panel as the second crescendo flash (F2).
5. **Derek.** Derek Lawson (m01) is left out: who he is, is the m01 reveal. Keep him out?
6. **"Field notes".** The brief says "feildnotes". The game's help feature is the SAFETYNET Field Guide, which the phone handler sends on request ("Send me a field guide") and which opens at the workstation; the notepad only collects clues. The plan reads your word as field guides (C5 "Guides", VO7 "Read the field guide", GAP-2). Is that what you meant?
7. **Release day.** C1 says "Ten Missions", VO5 says "Real machines" and VO8 says "Walkthroughs for every mission". Will all ten missions, each with its VMs, be live on the day the trailer goes out? (All ten walkthroughs are published and linked already.)
8. **Pace.** Where does it sag? Watch the smooth bars (51.97 to 59.93 s: Victoria, then the flag accepted) and the USP breakdown (85.57 to 91.34 s: cards only). The end is a 0.6 s button; a 1.6 s fade is the alternative render.
9. **Anything on screen** you would not want a viewer to see?
10. **Cut-downs.** Make the 30 s cut (see "30 s cut") once the main cut is signed off? And a 60 s cut as well?
