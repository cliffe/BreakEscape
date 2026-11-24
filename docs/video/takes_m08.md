# m08 (The Mole) trailer takes (keyless set): scripts written, NOT yet run

Written 23 Nov 2026 on branch `video/trailers-m01-m02-spies` while another session held the capture rig. Nothing was run (no server, game, browser or ffmpeg), only `node --check`. Scripts: `tools/video/takes/m08/t10`..`t27`, shared `_c8.mjs`, digit checker `check_digits.rb`. Run through `scratchpad/run.sh` with `MISSION=m08`. Ids, rooms, globals and choice texts checked against a rendered copy of `scenarios/m08_the_mole/scenario.json.erb` (structure dump) and the ink by grep. No PIN, password, code or flag value is in any script (the one PAD is 3 digits wrong on every PIN lock).

Superseded, not deleted: `t01_vm_approach.mjs`, `t02_hax_phone.mjs`, `_live.mjs` (LIVE-mode scripts for the keyed server, game 85). `_live.mjs` `goRoom` is reused by `_c8.mjs`. t26 replaces t02 for the keyless set.

Gate: the briefing gate is `briefing_played` (timedConversation skipIfGlobal/setGlobalOnStart). Mid-mission starts seed `briefing_played`; the interview objective is brief-gated, so `brief_taken` is seeded too (Netherton's talk sets it). Rooms: main_lobby (start) with director_office N, operations_floor E, cryptography_lab W; ops floor has intel_analysis N, server_room E (rfid), security_archives S (password); crypto lab has break_room W and interrogation_room S (pin, never filmed).

| id | avatar | flags (new-game; record) | what it films | expected window | status |
|---|---|---|---|---|---|
| t10_athena_hook | ngozi_adeyemi | `--imports=none`; rec "" | one ATHENA clip, hook ("The leak came from inside this building.", first ~2.8 s) and stakes (rest, "Director Netherton has three names...") | the `hook-stakes` line window (8.9 s) | script written, not yet run |
| t11_lobby_athena | lucia_moreno | `--imports=none --set briefing_played=true`; `--hide-hud --zoom-step 1` | straight walk toward the receptionist ATHENA hologram, 1 s hold | about 2.5 s | script written, not yet run |
| t12_nightshade | harjit_singh | `--imports=none --start-room cryptography_lab --set briefing_played=true --set brief_taken=true`; same rec | walk, "There you are. I wondered when they'd send you." (3.34 s) | line window | script written, not yet run |
| t13_vector_audit | marcus_hale | `--imports=none --start-room operations_floor --set briefing_played=true --set brief_taken=true --set vector_interviewed=true --set found_badge_audit=true`; same rec | hub > [The door audit has you in the Crypto Lab that morning.] > "Eight minutes. I went in for a hardware token..." (5.33 s) | line window, picture out before the menu | script written, not yet run |
| t14_phantom_accuse | frank_callahan | `--imports=none --start-room intel_analysis --set briefing_played=true --set brief_taken=true --set phantom_interviewed=true`; same rec | accuse choice, "Bold. On what?..." (fallback), "I've been hunting this leak longer... Accuse me properly..." (7.7 s, keep second sentence), strike, 1.8 s chase | line + strike | script written, not yet run |
| t15_netherton_ending | vivian_ashby | `--imports=none --start-room director_office --set briefing_played=true`; same rec | whole ending line (9.02 s); wide and 3x close-up are edit crops | line window | script written, not yet run |
| t16_archives_pickup | mei_lin_chow | `--imports=none --unlock security_archives --start-room operations_floor --set briefing_played=true --set brief_taken=true`; same rec | walk into archives (lights strike), pick up the badge audit printout, panel closed within 0.4 s | to the `pickup` mark | script written, not yet run |
| t17_locker_pick | daniel_seo | `--imports=none --start-room break_room --set briefing_played=true --set brief_taken=true --set offduty_agent_hostile=true`; same rec | real lockpick of Phantom's locker; Off-Duty Agent face flash | pick about 8 s; face 1.8 s | script written, not yet run |
| t18_locker_key | lucia_moreno | as t17 minus the hostile flag, plus `--give vector_locker_key` | key lock on Vector's locker: select key, turn | last 0.5 s of insertion | script written, not yet run |
| t19_lobby_pad_notice | vivian_ashby | `--imports=none --set briefing_played=true`; `--hide-hud --zoom-step 1` | badge printer PIN pad (3 wrong digits, no ENTER); `security_notice` clean note | pad about 4 s; note 2.5 s | script written, not yet run |
| t20_director_closeups | ngozi_adeyemi | `--imports=none --start-room director_office --set briefing_played=true`; same rec | Director safe PIN pad (wrong digits); RFID cloner on Netherton (blurred, Save) | pad about 4 s; cloner about 8 s | script written, not yet run |
| t21_ops_closeups | harjit_singh | `--imports=none --start-room operations_floor --set briefing_played=true --set brief_taken=true`; same rec | archives door password screen (z q x, no ENTER); `operations_board` clean note | panel 2 s; board 2.5 s | script written, not yet run |
| t22_ops_faces | mei_lin_chow | t16 flags; same rec | Junior Analyst, Julian Sallow, Agnieszka Duda face flashes (setup picks up the real printout off camera so the pair appears) | about 1 s each | script written, not yet run |
| t23_cyberchef | daniel_seo | `--imports=none --start-room cryptography_lab --set briefing_played=true --set brief_taken=true`; same rec | CyberChef overlay, neutral ROT13 sentence | panes ~2.5 s | script written, not yet run |
| t24_server_walk_flag | lucia_moreno | `--imports=none --unlock server_room --start-room operations_floor --set briefing_played=true --set brief_taken=true`; same rec | walk into server_room (motion lights), to the VM launcher without opening it; flag station empty | walk about 1.5 s; station 2.6 s | script written, not yet run |
| t25_rfid_reader | marcus_hale | `--imports=none --start-room director_office --set briefing_played=true`; same rec | off camera: clone Netherton's card; on camera: reader on the server-room door, Emulate | about 5 s | script written, not yet run |
| t26_phone_hax | marcus_hale | `--imports=none --set briefing_played=true`; rec "" | phone, Agent HaX thread, early hub choices shown, nothing picked | about 8 s | script written, not yet run |
| t27_walk_ops | harjit_singh | as t21 flags | straight walk across the ops floor past the cooler | about 1.5 s | script written, not yet run |

Digit check (`ruby tools/video/takes/m08/check_digits.rb`): the PAD is 3 digits, not a prefix of any PIN and sharing no digit by position with any PIN (3 PIN locks found: badge printer, Director's safe, interrogation suite). First pad tried (7,4,9) failed the position check and was replaced.

## Risks to check on the first run
- t10: the line is one ink line with both sentences; the take only marks it. The subtitle bar shows the whole line on a trimmed clip (unverified). runDialogue skips earlier lines after 450 ms (partly audible).
- t12-t15, makeBeat offsets are the m05 Patricia ones (start [70,90], stop [30,45]); read SETUP and adjust per room (Nightshade 5.45,5.8; Vector 5.2,4.8; Phantom 5.2,3.95; Netherton 6.8,6.2 tiles). Nightshade has no sight challenge; Phantom's is skipped by the seeded `phantom_interviewed` (his `start` then jumps to the hub, so no opener).
- t13: the hub re-entry line plays first (Vector voiced, unused). `found_badge_audit` is seeded as a global for the ink; Julian/Agnieszka may appear near Vector. The picks' `:82`/`:83` variants differ only on `asked_alibi`; the regex matches both.
- t14: the take must record the line before the strike (hostility never clears). Strike is `window.playerCombat.attack` after a 60 ms facing pulse; unverified under headless physics (throttleFps 20 set). Phantom hits for 4: stop before KO (1.8 s hold). Listen to the delivery of the "hunting this leak" line; fallback is the "Bold" line, then the line-free strike.
- t16: the pick-up probably opens the text panel at once; the take closes it after 0.35 s and the edit must cut at `pickup`. Check frames for any text. Whether `found_badge_audit` is set on pick-up or on read is unknown (t22 relies on the event firing after a panel close).
- t17: the Off-Duty Agent's 360 degree sight catches a lockpick unless `offduty_agent_hostile` is set (seeded; the mapping's condition then fails). If the catch still fires the take throws at the minigame wait. Never Nightshade's locker (go-bag). Keep the sticky note (password and PIN) off every crop: it is in this room.
- t18: key label match is a guess (/vector|0x23|locker/), falls back to the first key. `--give` of an NPC-held key marks Vector as met.
- t19-t21: the safe may open a biometric screen before the PIN pad; the pad is opened by `openMg` without a name check. Open question: wrong digits on a pad never submit. t21 password screen is empty plus z q x.
- t20/t25: the clone is normally offered after all three suspects are interviewed; the take calls `startRFIDMinigame` directly (m05/m06/m07 way), server acceptance unverified. The card is MIFARE custom keys, so cloneAndSave has to press the crack steps (m03 style); allow a longer window. `meetNetherton` sits through the opening (about 30 s) off camera.
- t22: Julian and Agnieszka are `initiallyHidden` until the found_badge_audit event; the setup route should trigger it. If they never show, moveToNear throws; fall back to the analyst alone.
- t23: the overlay stops the music context; the take resumes audio after closing, as m03/m04.
- t24: `moveToNear` is used for the launcher approach (a visible walk, may show a click marker; m07 used key legs from `nearby`). Check; replace with keyLegs if a marker shows.
- All: Mission Brief notes closed by clearScreen on head-start games; the player's own avatar sprites are never used.

## Not done (next agent)
- Run every script (serial, free rig): lengths, drop %, A/V offsets, frame notes; check marks against frames.
- Not written: Netherton face flash (he has lines), Vector/Phantom/Nightshade faces (lines), HaX in person (break room; her first lines unread), the Interview/Hunt card shots (cards need no footage), the lobby ATHENA second walk, a lights-strike-only fallback take, the interrogation suite and the debrief (left out by the picks).
- Not checked: the delivery of Phantom's line (by ear), the cut points (hook 2.8 s, stakes, Phantom second sentence from 3.4 s, Netherton first sentence 2.7 s), cached audio for Netherton `:94`, Phantom `:138`, Vector "I left it out...".
- Open: the lockers' contents after opening (not read; edit cuts before them).

## Round-2 line: which script films it (24 Nov)
Ending line "There is a mole in SAFETYNET. I am reasonably certain they are within a hundred metres of where you are standing." (`m08_director_netherton.ink:97`, knot `start`, 9.02 s) is filmed by t15_netherton_ending (first talk, no choices; regex matches `There is a mole in SAFETYNET\. I am reasonably certain`). Changed: linger after the line 300 ms to 700 ms so the tail of the 9.02 s clip is not clipped. The picks file already names this line; nothing overridden.
Risks to check on the first run (round 2):
- The opening runs once per game (`met`); a re-run needs a fresh game. If the Mission Brief notes are open at start, close them (setup clears the screen).
- The line is the second-to-last of the opening; "Ask me what you need..." follows at once, so cut by the mark.

## Run 1 (24 Nov, takes agent): results, marks checked against frames
All through `scratchpad/run.sh` with `MISSION=m08`, :3025, display :113. Avatar before and after: female_hacker_hood_v2. Times are trimmed-clip seconds. "playtest" in a frame = the player's portrait name (keep out of windows).

| id | avatar | result | len / drop / A/V (ms) | marks and frame notes | window |
|---|---|---|---|---|---|
| t10_athena_hook | ngozi_adeyemi | PASS | 17.3 / 0.86 / -140,-160 | hook+stakes line 7.10 to 15.84 (8.74 s vs 8.9 scout); earlier briefing lines skipped but partly audible (0.67 to 6.0). Subtitle bar shows the WHOLE line on every frame (hook and stakes words together), so cut by crop or caption. ATHENA portrait cyan, no player name | 7.0 to 15.9 |
| t15_netherton_ending | vivian_ashby | PASS | 70.9 / 0.14 / -93,-115 | round-2 line (ink :97, text matches the cache sidecar) 60.31 to 69.37 (9.06 s). Frames 60.5 to 69 show Netherton portrait + bar with the whole line, no player name. Fallback stakes line "Two of ours are dead..." 47.99 to 52.97. Opening is 60 s of narrator and lines before it | 60.2 to 69.5 |
| t12_nightshade | harjit_singh | PASS | 36.1 / 0.09 / -67,-63 | line 31.58 to 34.92 (3.34 s). Walk 1.5 to 2.4 is 2 tiles, rec flags "" so HUD and objectives visible and the room is small; interact retried at 10.4. Re-record with `--hide-hud --zoom-step 1` for a clean walk if wanted | 31.5 to 35.0 (walk: re-take) |
| t13_vector_audit | marcus_hale | PASS | 25.84 / 0.36 / -117,-130 | line 19.39 to 24.71 (5.32 s). Frame 13.5 shows the choice echo with the name "playtest": avoid 12 to 14.5. Narrator beat 15 to 18.2 shows the player portrait without a name | 19.3 to 24.8 |
| t14_phantom_accuse | frank_callahan | PASS | 30.94 / 0.30 / -93,-72 | "Bold..." 12.22 to 18.32 (6.1 s); second line "I've been hunting this leak... Accuse me properly..." 18.59 to 26.33 (7.74 s), subtitle shows both sentences; strike 28.6 (damage numbers 10 and 4, red hit flash by 30.4), chase held to 30.46. Delivery not heard by ear. An HaX toast shows at 28 to 30 | 18.5 to 26.4, strike 28.4 to 30.5 |
| t11_lobby_athena | lucia_moreno | PASS (3rd run) | 5.04 / 0.48 / -82,-102 | v2 script (committed): walks UP toward ATHENA 1.65 to 2.5, held to 4.0. Runs 1 and 2 failed drop 1.69 and 1.51 (short clip; first script walked away from her). Camera still panning to 2.5; ATHENA flickers (faint at about 2.0, bright 3.0) | 2.6 to 4.0 settled; 1.7 to 4.0 with the walk |
| t16_archives_pickup | mei_lin_chow | PASS | 13.17 / 0.65 / -117,-118 | archives lights strike 6.0 to 6.5 (dark then lit). The text panel (Badge Audit text, names and times: spoiler) opens at about 10.1, BEFORE the `pickup` mark 11.08. Cut out by 10.0 | 5.8 to 10.0 |
| t17_locker_pick | daniel_seo | PASS (2nd run) | 24.4 / 0.38 / -98,-145 | Phantom's locker. Pins set 6.0, 8.4, 10.1, 11.7; open 15.24 ("Lock picked successfully" 15.6). Container contents (named items) show at 16.5: cut before 15.8. Off-duty agent face 20.25 to 22.7 with narration "He doesn't look up from the magazine." Run 1 failed: the container opened over the chat (fixed, committed) | pick 3.0 to 15.5; face 20.3 to 22.6 |
| t18_locker_key | lucia_moreno | PASS (2nd run) | 10.14 / 0.82 / -52,-115 | Vector's locker, label "Vector's Locker Key". Key select 4.4 to 5.8, insertion 6.5 to 7.4 (pins turn green), open in the room at 8.0. Green sight cones visible in the room frames | 5.8 to 7.6 |
| t19_lobby_pad_notice | vivian_ashby | PASS (frames not yet viewed) | 17.44 / 0.51 / -73,-112 | pad-open 3.42, typed 6.86, closed 8.93, notice 13.59 to 16.13. Check digits and the note on a contact sheet before use | to check |

## Not done (run 1 stopped at the context limit)
- t20_director_closeups: run failed (my 290 s timeout killed it; no trimmed file). Re-run without the shell timeout; it takes over 3 min.
- Not run: t21_ops_closeups, t22_ops_faces, t23_cyberchef, t24_server_walk_flag, t25_rfid_reader, t26_phone_hax, t27_walk_ops.
- t19 frames not checked. t12 optional re-take with hide-hud.
- Real hacking: not filmed (covered by `m08_console_recon_clip.mp4`). VM shots need VM.
- Run commands: scripts' headers have them; flags per the table above (t21/t27 as t21 flags, t22 as t16 flags).
- Gotchas: a >140 s take needs run.sh in the background (the Bash tool backgrounds at 180 s; do not wrap in `timeout 290`); `scratchpad/marks8.sh <take>` prints m08 marks, `scratchpad/fr8.sh <take> t1 t2..` makes a frame grid.
