# m04 office life: live proof 5

Keyless server :3097, headless, 20 fps fixed step, a fresh game per run from `new-game.rb` through the scratchpad wrapper (no `--set`, no row edits, no globals set in the page, no `needs.set`). Every id was checked against the newest `tools/playtest/*-flags-game*.xml`. HEAD includes the kettle `useFrom` fix. Scripts are `lp5_*.mjs` in the session scratchpad, not committed. Strikes use the real punch path (`window.playerCombat.attack({x,y})`).

Summary: checks 1, 2, 3, 4 and 6 PASS. Check 5 not run. The LIVE_PROOF_4 stuck claims are both probe artefacts (verdicts below). No scenario bugs found.

## Verdict on the LIVE_PROOF_4 stuck claims

**2b, "attack returns false after `moveToNear` on a walking newcomer": probe artefact, not a bug.** `moveToNear` finishes with a click on the NPC sprite. If the NPC is not yet hostile, that click is a normal interaction and opens `person-chat` (`interactions.js:923`). `attack()` returns false while any minigame is open (`fightingPaused()`, `player-combat.js:79`). Direct evidence, game 7932: right after `moveToNear` the first call returned `move-interrupted-by-game-event`, and the pre-swing diagnostic read `fp: true`, `mg: true`, `PersonChatMinigame`; every later `moveToNear` returned `minigame-active` and every `attack` returned false while Joanne walked on to the cooler (so a walking NPC was never the cause). In games 7927, 7938 and 7950 the chat did not open, and the very first swing at the walking Joanne returned true and made her hostile (distance 8 to 19 px). A moving hitbox does not defeat the attack. The fix in the probe is to close any chat before each swing; a player using F or right-click never goes through the click.

**"Joanne stalled beside the player for 7.5 s" (7903, 7908): not reproduced.** In 7932, with the chat open, Joanne kept walking: (221,229), (162,221), (269,181), then `using` at the cooler and `returning`, home by the end.

**3, "six punches did not KO a seated Joanne": the threshold is higher.** In game 7971 she took ten punches to KO (hostile after the first). LIVE_PROOF_1 check 3 used a loop up to 25. Six was simply too few.

## 1. Attack Joanne while she walks to the cooler. PASS

Route: Vance's card cloned in play (kettle opens), ops office, wait 22 s, enter reception, Joanne in `goto_target` to `reception_cooler`.

Game 7950 (clean run, chat closed before each swing): one swing at 8 px.
- Before: `aes_staff_off` false, `ops_kettle_off` false, nobody hostile, Joanne at (239,219) walking.
- After: `aes_staff_off` true, `ops_kettle_off` true. Joanne `hostile` true, not KO, mode `idle`, not walking to the cooler. Ibrahim `hostile` true too (not KO): Joanne walked past his seat and the punch arc caught him at 8 px. That is a bystander effect of the probe distance, as in LIVE_PROOF_1 check 3.
- Player went to the ops office through the real doorway (`door:main_entrance->operations_office`, 48,288). With the player gone, Joanne stood at sprite (236,236), mode `idle`, for 16 s; her home is the sofa cell (239,250 body, sofa sprite place 239,227). So she ends at her last needs stop (the sofa; she never reached the cooler) and stands hostile. Ibrahim stood at (208,229), idle, 7 px off his seat. Neither has `patrolOverride` (read from the behaviour config, false in every reading).
- Player HP fell 100 to 52 while still in reception (chased and hit by the hostile, as designed); it stayed 52 in the ops office.
- Back in reception: both at the same cells, hostile.
- Screenshots `screenshots/lp5_c1_after.png`, `screenshots/lp5_c1_back_reception.png`.

Other games: 7927 and 7938 (first swing true, Joanne hostile, `aes_staff_off` true; Joanne ended at (216,231) and (191,230) while the player was still in reception, chasing it), 7932 and 7944 (chat opened, see the verdict; 7944 swing landed but the chat then held the player and the leave call returned `minigame-active`).

## 2. Strike the guard with Joanne at the cooler. PASS

Game 7958. Joanne `using` at `reception_cooler` (body 269,180 sprite) when the player reached the guard. The first `moveToNear` opened a chat (swing returned false, `mg` true); closing it and swinging again returned true.
- After the strike: `security_guard` hostile, not KO; `aes_staff_off` true, `ops_kettle_off` true. Joanne was still `using` for 4 s (she finishes), then `returning`, then idle at the sofa (239,227) from the 12 s reading on. Ibrahim never moved (215,228), not hostile.
- Guard's own outcomes: hostile and chasing (player HP 100 to 20 over 40 s), `security_guard_ko` false, no `patrolOverride` (globals were not diffed in this check).
- Screenshot `screenshots/lp5_c2_guard_hit.png`, `screenshots/lp5_c2_after.png`.

## 3. Attack Vance with the pair at the kettle. PASS

Game 7965. Kettle route as `kettle.mjs` (card cloned, SCADA, back, park at 250,330). Both `using` at `ops_kettle` (Ibrahim body 260.3,372; Joanne 226.6,366.5). One punch at Vance.
- Globals diff before and after: `aes_staff_off` false to true, `ops_kettle_off` false to true, `heard_ex_six_oclock` false to true (the pair's first exchange). Nothing else changed.
- Vance hostile, not KO, no `patrolOverride`; his outcomes are the guard-style chase (player HP 100 to 0 over 18 s, so the player was knocked out before the end of the observation; that is the hostile Vance, not the pair).
- The pair finished the use (about 15 s, `using` until the W5 reading), then both `returning`, and by the W7 reading both idle at their sofa cells (Ibrahim 215,228, Joanne 239,227). Neither hostile.
- Screenshots `screenshots/lp5_c3_pair_before.png`, `screenshots/lp5_c3_vance_hit.png`, `screenshots/lp5_c3_after.png`.

## 4. M1: KO Joanne, then `crew_warned` by Vance's phone record. PASS

Game 7971. Ten punches KO'd seated Joanne (`joanne_ko` true, `aes_staff_off` true, body at (177,224), frame `falling-back-death_south-east_frame_006`). Then the ally route and anomaly (by play), phone call to Vance, "The night crew in Hall 2", "Sound it."
- `crew_warned`, `aes_staff_off`, `aes_staff_evacuated`, `ops_kettle_off` all true.
- Event log after the warning: no Joanne event (her last events are the hostile change, the attack, `npc_stood`, `npc_ko`, `joanne_ko`, all before the call). DOM text starting with "Joanne": none. The line "Coats, now" never appeared on screen, polled for 2.5 s after the call and again at each later screenshot. The condition `!globalVars.joanne_ko` held.
- After a reload: Joanne's body is still at (177,224), KO frame; Ibrahim hidden.
- Probe notes: the later room changes (Hall 1 to SCADA to ops) returned `blocking-ui` on an `npc-bark--phone` overlay and the player stayed in Hall 1, so the pair-hidden-after-room-change half was not repeated here (LIVE_PROOF_4 check 1 covers it).
- Screenshots `screenshots/lp5_c4_joanne_ko.png`, `screenshots/lp5_c4_phone_warned.png`, `screenshots/lp5_c4_after_reload.png`.

## 5. Credits after a newcomer KO. NOT RUN

The credits need `attack_prevented`, which needs the whole mission. Not reachable in reasonable time without setting globals. Static read only: `scenario.json.erb:244` and `:250` carry the entries with `ibrahim_ko || joanne_ko` as planned.

## 6. Q7 strike at the kettle with the new cells. PASS

Game 7979. Both `using` at `ops_kettle`: Ibrahim (254.9,372), Joanne (220.7,372).
- Kettle cell to the reception doorway (48,288): Ibrahim 223.3 px, Joanne 192.0 px.
- One punch at Ibrahim: hostile, not KO; `aes_staff_off` and `ops_kettle_off` true. Joanne not hostile, not struck. In the ops office for 9 s at 47 px from him: he stayed at his cell (254.9,372), player HP 100.
- At the reception doorway (48.2,215.9), 259 px from him body to player: no movement after 3 s.
- Reception points (the player's y clamps near 219 to 225, so the exact 137 px point is not reachable): at 212 px and at 191 px (body to player) he did not move for 6 s each. At 168 px (player 167.8,224.5) he followed within 2 s, walked out of the doorway (54.9,327) and settled at (144.1,265), 47 px from the player, HP 100 at the last reading. Measured from his sprite (about 31 px above the body) the threshold is 167 px no follow, 145 px follow, which matches the 160 px default aggro on sprite coordinates. At about 137 px he is inside that range, so he follows. Joanne stood at her sofa cell (239,250 body) after the strike.
- Screenshots `screenshots/lp5_c6_pair_before.png`, `screenshots/lp5_c6_struck.png`, `screenshots/lp5_c6_doorway.png`, `screenshots/lp5_c6_follow.png`.

## Games

7927, 7932, 7938, 7944, 7950 (check 1); 7958 (2); 7965 (3); 7971 (4); 7979 (6).

## Bugs

None in the scenario or engine. Probe notes: `moveToNear` clicks the sprite and opens a chat with a not-yet-hostile NPC; close chats before every swing. A struck newcomer whose hit lands while another sits within the punch arc also turns the bystander hostile.
