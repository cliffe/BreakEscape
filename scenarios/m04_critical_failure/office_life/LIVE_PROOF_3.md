# m04 office life: live proof 3

Keyless server :3097, headless, 20 fps fixed step, fresh game per check from `new-game.rb` (no `--set`). Scripts `lp3_*.mjs` are in the session scratchpad, not committed. Partial run: checks 1, 2, 7 done; check 3 started and inconclusive; checks 4 and 5 not run (context limit reached).

## L1: both seated behind the briefing; guard's challenge. PASS (one caveat)
Games 7810, 7815. At load the briefing is the open person-chat; Ibrahim body (215, 250) and Joanne (239, 250), both frame `sit_south_frame_000`, needs `idle`. Screenshot `screenshots/lp3_l1_load.png` shows the briefing only (sofa not visible behind it).
Guard: `player_spotted:security_guard` fired at load (while the briefing was open) and no challenge chat appeared. After walking out of his sight (86, 266) and back (168, 122) after 22 s, the challenge opened ("Still need you at the desk first, my lover. Badge.") with both newcomers seated (7815). Screenshot `screenshots/lp3_l1_guard_challenge.png`. Caveat: no HEAD-without-newcomers baseline run, so "as before" rests on the engine's documented rule (a sighting during a conversation is not re-fired until the player leaves and returns).

## L2 + L7: cooler trip. PASS
Games 7825 (plain), 7829 (chat). Enter reception from the ops office: Joanne `goto_target` about 2.9 s after entry (stood at 1.2 s, left post 2.0 s after entry), `using` at body (269.1, 211.1) / (268.1, 211.9), 90 px from the guard, 12.0 s use, returned and sat at (239, 250) frame `sit_south_frame_000`. `checkpoint_passed` true after the ops office entry; guard `player_spotted` fires as before (7829, 0.3 s after Joanne left; Joanne's chat took the screen first). Screenshot `screenshots/lp3_l2_cooler_using.png` (Joanne at the cooler beside the planter, Ibrahim seated, guard at the desk; reads fine).
Chat while she walks (7829): one line ("Hiya, duck. I've a dozen inductions at six..."), player room `main_entrance`, background is the reception wall (logo, board, defibrillator, cooler) `screenshots/lp3_l2_chat_walking.png`. Her needs mode `frozen` during the chat, `goto_target` after; the trip resumed, `using` 14.9 s later, returned and sat.
Probe note: a first run (7819) with the player parked beside her stalled and she turned to `returning` without using the cooler (player at 24 px, in her lane). Not repeated with the player clear; in 7829 the player moved away after the chat and she completed. Possible artefact of the parked player, not proven either way.

## L6 phone evacuation, both seated. INCONCLUSIVE
Game 7856. Ally and keycard reached by play (first meeting, "something you need to know", truth route, "I'll need into the halls"), anomaly by the Hall 1 dial (scada, battery_hall_1), call to Vance via phone item then "The night crew in Hall 2" then "Sound it". `crew_warned`, `aes_staff_off`, `aes_staff_evacuated`, `ops_kettle_off` all true. Both newcomers still visible and seated at that point (expected, hide fires on next room entry). The follow-on room changes failed (`enterRoom` returned `blocking-ui`, then `no-doorway` from battery_hall_1), so no room entry happened and no hidden-state or sofa screenshot was taken. Bark not seen in the DOM in the 2.5 s window. Needs a re-run: dismiss the call overlay and bark, enterRoom scada, ops, reception, then shoot the sofa (`lp3_g.mjs` is ready, change the post-call steps to dismiss the phone first).
hydrogen_alarm without evacuation: not run. It needs `attack_mechanism_known` (all four VM flags) plus the 14 minute timer, or `crew_warned_early`; not cheap.

## Checks 4 (attack probe, M1 Joanne KO then crew_warned) and 5 (credits): NOT RUN.

## Bugs
None confirmed. Observation: possible stall when the player stands in Joanne's lane while she walks to the cooler (7819), unconfirmed.

## Games and strays
7809, 7810, 7815, 7819, 7825, 7829, 7830, 7833, 7835, 7841, 7848, 7856 (mine). Stray: one probe run (`lp3_f.mjs`) pointed at game 7820 by mistake (not mine): moved its player to the ops office and closed minigames; no row edited. New games from `new-game.rb` also left untracked `tools/playtest/*-flags-game78xx.xml` files.
