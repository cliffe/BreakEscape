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
