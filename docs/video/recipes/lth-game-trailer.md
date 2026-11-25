# Recipe: SAFETYNET: Licence to Hack game trailer (VID2, R1 plan)

Status: plan, round 1 (25 Nov 2026). Nothing recorded, rendered or voiced. Script and VO text: `docs/video/scripts/lth-game-trailer-script.md`. Supersedes the beat sheet in `game-trailer.md` for this trailer; the house rules in `README.md` still apply.

## Purpose

One trailer for the whole game, m01 to m10, that sells six things in this order of weight: a spy thriller with stakes and a cast; puzzles and gadgets (every minigame we have footage of); encoding and encryption challenges; real VMs and real hacking, inside the story; help so nobody stays stuck (NPC hints, the phone handler, field notes, walkthroughs); and the USP, stated plainly: no other game puts real VMs and CTF challenges inside a game narrative (the owner's claim, used as he worded it, with no further superlatives).

## Versions

| Version | Spoken audio | Cards |
|---|---|---|
| V1 announcer | A big trailer announcer (Gemini TTS, voice picked from 3 candidates on the review page) in the gaps, plus the character lines below. The announcer never talks over a character line. | Same cards as V2 |
| V2 episode-style | No narrator. In-game character lines from the takes (Agent HaX on the phone included), as the m01 to m10 episode trailers do | Cards carry the six beats |

Both share one picture timeline. They differ in one slot only (65.736 to 71.529 s, see S36). Both: Emerald Trigger from 0:00, cuts on its hits, 30 fps, 16:9, 9:16 and 1:1, -14 LUFS, true peak under -1 dBTP, `.srt`, burned captions on 9:16 and 1:1.

Cut-downs (proposal, not planned here): a 60 s cut that keeps the music from 0:00 and ends the picture at the 51.972 s bar, with the help and USP beats folded into the Codes and Real VMs movements and the close preset over 51.972 to 59.97 s (the smooth bars); and a 30 s social cut (title, Real VMs card and two console cuts, "Stuck? Call HaX.", the USP card, close). The owner decides whether both follow (Q11).

## Rule decisions recorded

- **Music.** `game-trailer.md` says the game trailer must not reuse a mission track, and m01 v13 tried Emerald Trigger (owner: "not right" for that window). The owner has now asked for Emerald Trigger "from its start" for this trailer. His request wins; add the row to the music table in `README.md` when the edit is final, with this note.
- **Narration.** `README.md` says narration is Agent HaX's TTS voice. V1 is an announcer because the owner asked for one. New TTS for it is pre-approved (memory, 22 Nov); the voice pick goes to the owner via AC0.
- **Missions.** `game-trailer.md` says m01 to m08; the owner says m01 to m10. Shots from m09 and m10 are in, but their own trailers are not signed off yet, so every m09 and m10 shot below carries "if the m09/m10 review keeps it" (Q4).
- **Title length.** The `safetynet-open` preset is 6.0 s; the first big impact is at 5.759 s. Override the preset to 173 frames (5.767 s). The keyhole reveal (frames 72 to 102) is untouched.
- **"One beat per mission"** (old recipe) gives way to the owner's six beats. Every mission still appears at least once (coverage table below).
- **No "Your Mission" card**; no "Break Escape"; "Play now"; hard cuts between gameplay; glitch only into and out of cards and the title.

## The music grid (Emerald Trigger)

Track: `public/break_escape/assets/music/SpyAction/Emerald Trigger.mp3`, 162.72 s, 150.01 BPM (beat 0.400 s, bar 1.600 s). The stored analysis (`tools/video/edits/music/emerald_trigger_60.json`) gives beat offset 0.375 s, but the measured onsets fall about 0.36 s after that grid; the working grid is **beat = 0.335 + 0.39996 k s**, bars from 0.775 s. Onsets and per-bar energy for 0 to 130 s: scratch `.../scratchpad/vid2/planner/emerald_trigger_0_130_hits.json` (numpy spectral flux, made for this plan; librosa venvs on this machine were broken). Every cut below sits on a measured onset or a bar line.

| Track time (s) | What the music does | Used for |
|---|---|---|
| 0.0 to 5.6 | Near-silent intro (bars 0 to 2) | Title, VO1 |
| 5.759 | First bass impact (bar 3 lift, ratio 12) | Cut out of the title |
| 6.362, 6.978 | Two stabs | Lights, lights |
| 7.175 to 13.57 | Drop, then a light lift at 10.374 | Two briefing lines |
| 13.85 to 17.69 | Stab run (14.466, 15.070, 15.464, 16.080, 16.684, 17.392) | Card 1, three flashes |
| 18.374 to 24.77 | Build; lifts at 23.174 and 24.773 | Two stakes lines |
| 24.77 to 37.57 | Dense hits (26.331, 27.133, 27.934, 28.735, 29.536, 30.232 [0.82], 31.533, 32.729, 33.135, 34.238, 35.132, 35.933 [0.84]) | Card 2, minigame montage |
| 37.573 | One-bar dip | Card 3 |
| 39.532, 40.136, 42.736 | Bass impacts | Codes cuts |
| 43.932 to 51.13 | Hit run (43.932 [0.81], 44.733, 45.128, 46.533, 47.531 [0.86], 48.530 [0.81], 49.528, 50.329) | Card 4, VM and console cuts |
| 51.972 to 59.93 | Five smooth bars, few onsets | Console hold, flag station, Card 5 |
| 59.931 to 74.33 | Steady hits (61.533, 62.334, 65.736, 66.932, 68.928, 71.529, 72.737) | Help movement |
| 74.327, **75.929** | Lead-in hit, then the strongest hit in the track (1.00) | Villain reveal, Card 7 |
| 77.53 to 85.57 | Hits (79.935, 82.338) | Two villain lines |
| 85.569 to 90.37 | Breakdown (energy halves) | USP cards, VO9 |
| 90.369 | Lift | Crescendo flashes on the beat (0.4 s) |
| 92.334 | Onset | Closing line |
| 96.769 | Lift | Close preset |
| 101.568 | Loudest bar before the end | Curtain and logo |
| 104.768 | Drop (bar 65) | **End.** Music fades from 103.168 |

**Main cut: 104.77 s (3143 frames), ending on the drop at 104.768 s.** A cut to 120 s would need the 112.768 to 120.767 bars for the close and 15 more seconds of montage; 104.77 s keeps the pace.

## Beat sheet

| Trailer time (s) | Movement | Beat carried |
|---|---|---|
| 0.000 to 5.759 | Title | Brand |
| 5.759 to 14.466 | The threat (lights strike, Netherton, HaX) | 1 Spy thriller |
| 14.466 to 18.374 | Ten missions (card, three locations) | 1 |
| 18.374 to 24.773 | The stakes (ATHENA, Netherton) | 1 |
| 24.773 to 37.573 | Gadgets and locks montage | 2 Puzzles and minigames |
| 37.573 to 43.932 | Decode, decrypt | 3 Encoding and encryption |
| 43.932 to 59.931 | Real VMs, real hacking, flags | 4 Real VMs; 6 USP (flags in the story) |
| 59.931 to 74.327 | Stuck? Call HaX | 5 Help |
| 74.327 to 85.569 | Meet ENTROPY (villains) | 1 |
| 85.569 to 90.369 | The USP, plainly | 6 USP |
| 90.369 to 96.769 | Crescendo, closing line | 1, 2 |
| 96.769 to 104.768 | Close: "Play now", red hex curtain, Hacktivity Games | Brand |

## Shot list

Takes live in `~/video-takes-local/<mission>/takes/` (trimmed `.mkv`); console clips in `~/video-takes-local/<mission>/clips/`; the m03 VM approach is in `~/safetynet-footage/m03/takes/`. "From" names the shot in that mission's `tools/video/edits/<mission>_trailer60.json` whose framing, spoiler block and caption flags to copy. Times are seconds; "Lands on" is the onset the cut-in sits on. Console shots are described by what is on screen in neutral terms; the clip files are the ones each mission trailer already uses (frame-checked, `docs/video/logs/CONSOLE_CLIPS.md`).

| # | Id | In | Out | Dur | Lands on | Mission, take | Source in to out | From | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 0 | title | 0.000 | 5.767 | 5.767 | start | preset `safetynet-open` | | | duration override 173 frames |
| S01 | lights_hospital | 5.759 | 6.362 | 0.603 | 5.759 impact | m02 t02_lights | 2.910 to 3.513 | m02 m_lights | lights strike |
| S02 | lights_plant | 6.362 | 6.978 | 0.616 | 6.362 | m04 t02_drop | 3.400 to 4.016 | m04 drop_lights | |
| S03 | netherton_threat | 6.978 | 11.478 | 4.500 | 6.978 | m04 t01c_briefing | 5.938 to 10.438 | m04 hook_netherton | line |
| S04 | hax_ward | 11.478 | 14.466 | 2.988 | (line end) | m02 t01_hax_hook | 12.720 to 15.708 | m02 hax_hook | 0.155 s longer tail than m02: check it is clean |
| C1 | card_missions | 14.466 | 16.080 | 1.614 | 14.466 stab | card | | | text below |
| S05 | loc_night_hall | 16.080 | 16.684 | 0.604 | 16.080 | m03 t02_hall_lights | 3.300 to 3.904 | m03 m_lights | |
| S06 | loc_checkpoint | 16.684 | 17.392 | 0.708 | 16.684 | m06 t11_checkpoint_walk | 1.600 to 2.308 | m06 walk_checkpoint | |
| S07 | loc_archive | 17.392 | 18.374 | 0.982 | 17.392 | m09 t21_drop_staff_passage | 4.600 to 5.582 | m09 drop_lights | m09 condition |
| S08 | athena_leak | 18.374 | 22.041 | 3.667 | 18.374 bar | m08 t10_athena_hook | 6.250 to 9.917 | m08 hook_athena | line |
| S09 | netherton_millions | 22.041 | 24.773 | 2.732 | (line end) | m07 t10_briefing | 30.035 to 32.767 | m07 stakes_netherton | head trimmed 0.035 s: check the line starts after it |
| C2 | card_gadgets | 24.773 | 26.331 | 1.558 | 24.773 lift | card | | | |
| S10 | g_lockpick | 26.331 | 27.133 | 0.802 | 26.331 | m01 t04_lockpick | 6.400 to 7.202 | m01 m_lockpick | |
| S11 | g_rfid_read | 27.133 | 27.934 | 0.801 | 27.133 | m03 t04_rfid_clone | 2.600 to 3.401 | m03 rfid_read | UID blurred as in m03 |
| S12 | g_rfid_emulate | 27.934 | 28.735 | 0.801 | 27.934 | m03 t20_rfid_emulate | 5.900 to 6.701 | m03 rfid_granted | |
| S13 | g_dust_brush | 28.735 | 29.536 | 0.801 | 28.735 | m04 t14_dust_print | 15.000 to 15.801 | m04 dust_brush | |
| S14 | g_dust_match | 29.536 | 30.232 | 0.696 | 29.536 | m04 t14_dust_print | 35.600 to 36.296 | m04 dust_match | the name in the panel text must stay unreadable, as in m04 |
| S15 | g_biometric | 30.232 | 31.533 | 1.301 | 30.232 (0.82) | m04 t16_biometric_door | 5.000 to 6.301 | m04 bio_reader | |
| S16 | g_keypad | 31.533 | 32.729 | 1.196 | 31.533 | m02 t06_keypad | 4.700 to 5.896 | m02 cr_keypad | frame-check: three digits only, not the code |
| S17 | g_password | 32.729 | 33.135 | 0.406 | 32.729 | m05 t17_password_panel | 5.000 to 5.406 | m05 cr_password | |
| S18 | g_tracer | 33.135 | 34.238 | 1.103 | 33.135 | m06 t14_tracer | 12.900 to 14.003 | m06 tracer | blockchain tracing |
| S19 | g_key | 34.238 | 35.132 | 0.894 | 34.238 | m01 t19_minigames | 23.600 to 24.494 | m01 cr_key | wider than m01's 0.5 s: frame-check |
| S20 | g_pinpad | 35.132 | 35.933 | 0.801 | 35.132 | m06 t23_pin_door | 6.900 to 7.701 | m06 cr_pinpad | wider than m06's: frame-check digits |
| S21 | g_chase | 35.933 | 37.573 | 1.640 | 35.933 (0.84) | m03 t17b_guard | 100.900 to 102.540 | m03 t17b_chase | stealth, a guard gives chase |
| C3 | card_codes | 37.573 | 39.532 | 1.959 | 37.573 dip | card | | | |
| S22 | c_base64 | 39.532 | 40.136 | 0.604 | 39.532 bass | m01 t14_cyberchef | 6.970 to 7.574 | m01 m_cyberchef | encoding (Base64), neutral sentence |
| S23 | c_vigenere | 40.136 | 41.529 | 1.393 | 40.136 bass | m09 t16_cyberchef_vigenere | 8.500 to 9.893 | m09 cyberchef | textbook example, silent take; m09 condition |
| S24 | c_vig_hint | 41.529 | 42.736 | 1.207 | 41.529 | m09 t15_vigenere_chart | 9.900 to 11.107 | m09 vig_password | password screen with its hint; never the chart; m09 condition |
| S25 | c_rot13 | 42.736 | 43.932 | 1.196 | 42.736 bass | m02 t08_cyberchef | 7.633 to 8.829 | m02 m_cyberchef | neutral sentence |
| C4 | card_real | 43.932 | 45.128 | 1.196 | 43.932 (0.81) | card | | | |
| S26 | vm_in_game | 45.128 | 46.533 | 1.405 | 45.128 | m03 t02_vm_approach (safetynet-footage) | 7.300 to 8.705 | new | VM panel opens in the game, the desktop login draws in; catalogue spoiler none, no mask flag; frame-check for any login text |
| S27 | con_a | 46.533 | 47.531 | 0.998 | 46.533 | m04 console clip | 1.000 to 1.998 | m04 real_hacking | command typed, output arrives |
| S28 | con_b | 47.531 | 48.530 | 0.999 | 47.531 (0.86) | m08 console clip | 1.000 to 1.999 | m08 real_hacking | a session comes back live |
| S29 | con_c | 48.530 | 49.528 | 0.998 | 48.530 (0.81) | m09 console clip | 1.200 to 2.198 | m09 real_hacking | a run starts and reports back; m09 condition |
| S30 | con_d | 49.528 | 50.329 | 0.801 | 49.528 | m10 console clip | 0.800 to 1.601 | m10 real_hacking | a file is read out on the console; m10 condition |
| S31 | con_e | 50.329 | 51.972 | 1.643 | 50.329 | m07 console clip | 0.600 to 2.243 | m07 real_hacking | a script listed on screen |
| S32 | con_hold | 51.972 | 54.572 | 2.600 | 51.972 bar | m01 console clip (current build, unused so far) | 0.000 to 2.600 | new | command typed, results arrive; frame-checked in CONSOLE_CLIPS.md |
| S33 | flag_station | 54.572 | 56.771 | 2.199 | (bar) | m02 t14b_flag_station | 2.250 to 4.449 | m02 cr_flag | the station reads "Enter captured CTF flags below", "No flags submitted yet"; use the m02 crop note |
| C5 | card_flags | 56.771 | 59.931 | 3.160 | 56.771 bar | card | | | |
| C6 | card_help | 59.931 | 61.533 | 1.602 | 59.931 | card | | | |
| S34 | help_phone | 61.533 | 62.334 | 0.801 | 61.533 | m03 t05_phone | 4.200 to 5.001 | m03 cr_phone | HaX chat, choices incl. "Send me a field guide" |
| S35 | hax_call | 62.334 | 65.736 | 3.402 | 62.334 | m10 t12_power_room | 12.250 to 15.652 | m10 hax_call | HaX phones in a hint, voiced; m10 condition; Q6 |
| S36 V2 | npc_hint | 65.736 | 71.529 | 5.793 | 65.736 | m06 t12_irina_badges | 23.900 to 29.693 | m06 irina | an NPC drops a hint; 0.19 s longer than m06: check |
| S36a V1 | help_reply | 65.736 | 68.928 | 3.192 | 65.736 | m03 t05_phone | 6.500 to 9.692 | new | HaX's text reply on the phone (RFID how-to); frame-check |
| S36b V1 | help_ask | 68.928 | 71.529 | 2.601 | 68.928 | m02 t05_phone | 9.400 to 12.001 | new | hub choices "What should I know" |
| S37 | field_notes | 71.529 | 72.737 | 1.208 | 71.529 | m10 t21_post_props (conditional) | 6.000 to 7.208 | new | toast "Note Added ... to your notes"; HUD visible. Frame-check; if unsuitable, GAP-2 |
| S38 | walkthrough | 72.737 | 74.327 | 1.590 | 72.737 | GAP-1 | | | walkthrough page |
| S39 | v_ghost | 74.327 | 74.995 | 0.668 | 74.327 | m02 t17_ghost_call | 2.700 to 3.368 | m02 ghost_reveal | |
| S40 | v_withheld | 74.995 | 75.929 | 0.934 | (beat) | m07 t13c_architect_call | 10.300 to 11.234 | m07 call_ring | |
| C7 | card_entropy | 75.929 | 77.531 | 1.602 | **75.929 (1.00)** | card | | | |
| S41 | voltage_wide | 77.531 | 79.931 | 2.400 | 77.531 | m04 t04_voltage | 64.840 to 67.240 | m04 voltage_wide | line |
| S42 | voltage_close | 79.931 | 82.338 | 2.407 | 79.935 | m04 t04_voltage | 67.240 to 69.647 | m04 voltage_close | line; hit glitch as m04 |
| S43 | recruiter_wide | 82.338 | 83.369 | 1.031 | 82.338 | m05 t10_recruiter_call | 148.719 to 149.750 | m05 recruiter_wide | head trimmed 0.17 s: check the line |
| S44 | recruiter_close | 83.369 | 85.569 | 2.200 | (line) | m05 t10_recruiter_call | 149.750 to 151.950 | m05 recruiter_close | line |
| C8a | card_usp1 | 85.569 | 87.934 | 2.365 | 85.569 drop | card | | | |
| C8b | card_usp2 | 87.934 | 90.369 | 2.435 | 87.934 | card | | | |
| F1 | f_briefcase | 90.369 | 90.733 | 0.364 | 90.369 lift | m01 t19_minigames | 2.900 to 3.264 | m01 cr_briefcase | |
| F2 | f_rack | 90.733 | 91.133 | 0.400 | beat | m04 t13_rack_dial | 5.000 to 5.400 | m04 puzzle_panel | panel only, never the dial |
| F3 | f_alarm | 91.133 | 91.533 | 0.400 | beat | m10 t17_security_office | 6.000 to 6.400 | m10 cr_alarm | m10 condition |
| F4 | f_wipe | 91.533 | 91.928 | 0.395 | beat | m09 t13_wipe_running | 3.200 to 3.595 | m09 wipe_running | m09 condition |
| F5 | f_ransom | 91.928 | 92.334 | 0.406 | 91.928 | m02 t04_ransom | 2.300 to 2.706 | m02 m_ransom | |
| S45 | architect_wide | 92.334 | 93.334 | 1.000 | 92.334 | m07 t13c_architect_call_fx | 40.000 to 41.000 | m07 ending_wide | line, keep m07's J-cut pre |
| S46 | architect_close | 93.334 | 96.769 | 3.435 | (line) | m07 t13c_architect_call_fx | 41.000 to 44.435 | m07 ending_close | 0.335 s longer hold than m07: check |
| 99 | cta | 96.769 | 104.768 | 7.999 | 96.769 lift | preset `hacktivity-close` | | | "Play now", curtain; music fade 103.168 to 104.768 |

Count: V2 has 51 gameplay shots, 9 cards and 2 presets (62); V1 has 52 gameplay shots (S36 splits in two).

Mission coverage: m01 S10 S19 S22 S32 F1; m02 S01 S04 S16 S25 S33 S39 F5; m03 S05 S11 S12 S21 S26 S34; m04 S02 S03 S13 S14 S15 S27 S41 S42 F2; m05 S17 S43 S44; m06 S06 S18 S20 S36; m07 S09 S31 S40 S45 S46; m08 S08 S28; m09 S07 S23 S24 S29 F4; m10 S30 S35 S37 F3.

Minigames and features shown: lockpick, RFID read and emulate, fingerprint dusting and match, biometric door, keypad, password screen, blockchain tracer, key selection, PIN pad, guards and chase, CyberChef (Base64, ROT13, Vigenère), VM panel in the game, console (five different beats), flag station, phone handler (text and voiced), NPC hint, notes, walkthrough, briefcase, rack panel, alarm panel, wipe screen, ransom screen. Not shown, no footage: Bluetooth scanner (not claimed anywhere in the trailer).

Spoiler watch: no culprit or twist character. Excluded on purpose: m10 "WREN Is on the Team" and the sleeper line; m08 mole identity; m05 insider identity (no Owen or Halloran lines); m09 moral choice and Sorensen ending; m01 Derek (his identity is the m01 reveal; Q5); every debrief, choice screen and ending.

## Cards

White Press Start 2P on the navy-to-purple gradient, glitch in and out (`effects.cardJoin` switches to dissolve for the alternative render). Same text in V1 and V2.

| Card | Text |
|---|---|
| C1 | Ten Missions / One Enemy |
| C2 | Pick. Clone. / Dust. Crack. |
| C3 | Decode. / Decrypt. |
| C4 | Real VMs. / Real Hacking. |
| C5 | Every Flag / Moves the Story |
| C6 | Stuck? / Call HaX. |
| C7 | Meet / ENTROPY |
| C8a | Real VMs and CTF / Inside a Spy Story |
| C8b | No Other Game / Does This |

C5 rests on the rule that VM flags are required and diegetic (memory, VM rules). C8b is the owner's claim in short form; Q2 asks him to confirm the wording. Line lengths stay at or under 17 characters, the longest the mission trailers have used.

## How the console footage is used

Six console shots, all from clips already cut and frame-checked for the mission trailers (no flag, password, hash, login or token in any frame), and one VM-in-game shot. The order varies the look: command and output, a session coming back, a run reporting, a file read out, a script on screen, then the longer hold. The five quick shots land on the 46.5 to 51.1 s hit run; the hold sits in the smooth bars, so the viewer can read that it is a real terminal. In 9:16 and 1:1 use the mission trailers' framings (left-anchored, cx 0.28, for the narrow clips; centred for the wide m07 clip). Nothing here or in the script names a tool or technique. The m01 trailer's older footage is not used; the current-build m01 clip replaces it (Q7).

## Captions

- `.srt` for every version, from character `lines[]` and, in V1, the `vo[]` cues.
- Character lines: burned on 9:16 and 1:1, not on 16:9 where the game's own subtitle bar shows (the m04 to m10 pattern).
- V1 announcer: `vo[].caption` (the CA field) burned on 9:16 and 1:1. Check that the SAFETYNET edit path renders `vo[].caption`; it has only been used on CA edits (tooling gap 6 in `README.md`).
- Cards are text already; no caption.

## Aspect ratios

- Cards, title and close: per-aspect layouts from the presets and card renderer.
- Dialogue shots: copy each "From" shot's framing (9:16 speaker portrait near cx 0.70).
- Minigames: copy framing from the source shot; S19, S20 and S36 are wider windows than their sources, so recheck their 9:16 crops.
- S26 (VM in the game) and S37 (notes) have no source framing: 16:9 full frame; 9:16 and 1:1 centred on the panel.
- GAP-1 is captured at 1920x1080 with the page heading in the centre third so the 9:16 crop keeps it readable.

## Tooling notes for the edit stage

- A cross-mission edit needs per-shot take folders. `render.sh` reads one takes dir; build one folder of symlinks named `<mission>__<file>` and set `BE_TAKES_DIR` and `BE_CLIPS_DIR` to it (the README gap 1 note: take ids must carry the mission prefix).
- New edit list: `tools/video/edits/lth_game_trailer_v1.json` and `lth_game_trailer_v2.json`, `length` 104.767, music start 0, `fade_out` 1.6.

## Gaps (new takes needed)

| Gap | Mission and place | What the shot shows | Why no existing take works | Spoiler level |
|---|---|---|---|---|
| GAP-1 | none (Hacktivity page, browser capture) | The m01 walkthrough page as players see it: the heading "Walkthrough", the first stage, one visible nudge, the collapsed "Nudge" and "Recipe" boxes unopened; a slow scroll, 4 s | No footage of walkthroughs or lab sheets exists | None if only the m01 getting-started stage is on screen and nothing is expanded |
| GAP-2 (only if S37 fails its frame check) | any mission with neutral notes, e.g. m01 | The player's notes view open with one or two neutral entries, then closed; 3 s, HUD hidden | m10 t21 shows only a toast with the HUD visible; the notes text there was never read | Low; no code or clue text on screen |
| GAP-3 (optional) | a test scenario, not a mission | The flag station accepting a submission: the "accepted" moment, value field masked; 3 s | Every flag-station take shows the empty station only | None with the value masked; use a test scenario so no real flag is typed |

No new console footage is needed.

## Review questions for the owner

1. Verdict per version: ship, revise or rethink? Which of V1 and V2 leads?
2. USP cards: are "Real VMs and CTF / Inside a Spy Story" and "No Other Game / Does This" worded as you want the claim made?
3. Announcer voice: pick one of the three candidates on the page.
4. m09 and m10 shots: keep them before those trailers are signed off?
5. Derek (m01) is left out because naming him was an m01-only call. Keep him out?
6. S35: HaX's power-room hint names which breaker to use. Is that too much of an answer for a trailer?
7. Console: the current-build m01 clip instead of the older footage the m01 trailer uses. Agreed?
8. Help claims: may the trailer say every mission has a walkthrough (V1 VO8)? It is true only if all ten are published.
9. Pace: where does it sag? (The 85 to 90 s breakdown is cards only.)
10. Anything on screen you would not want a viewer to see?
11. Cut-downs: make the 60 s and 30 s versions after the main cut is signed off?
