# m04 office life: live proof 4

Keyless server :3097, headless, 20 fps fixed step, fresh game per check from `new-game.rb` through the scratchpad wrapper (no `--set`, no row edits). Scripts are `lp4_*.mjs` in the session scratchpad, not committed. Game ids were checked against the newest `tools/playtest/*-flags-game*.xml` each time.

Summary: check 1 PASS. Check 2a recorded (attack on a seated newcomer registers). Check 2b stuck after three tries. Check 2c not run. Check 3 not met (no KO). Check 4 not run.

## Stray game

- 7885: created by mistake (a `lp3_ng.sh` run with no arguments, output discarded). Not probed, no row edited.

## 1. L6 phone evacuation, both newcomers seated. PASS

Game 7895 (evacuation route, sofa shot); game 7888 (same route, first run, reload check; see note).

Steps: enter Hall 1 by play (ally, keycard, anomaly by the dial), call Vance by phone, "The night crew in Hall 2", "Sound it". Then close the phone minigame and dismiss barks, then enter `scada_control_room`, `operations_office`, `main_entrance` by room change, then sync and reload.

Observed (7895):
- `crew_warned`, `aes_staff_off`, `aes_staff_evacuated`, `ops_kettle_off` all true.
- Before the first room change both newcomers were visible and seated at (215, 228) and (239, 227).
- After scada: both `visible: false`, alpha 0. Still hidden in ops and reception.
- Sofa shot in reception (player at (48, 210), no walk): sofa empty, no leftover sprite. Screenshot `scenarios/m04_critical_failure/office_life/screenshots/lp4_sofa_after_evac.png`. An Agent HaX incoming-call banner sits at the top; it is a notification, not a blocking overlay.
- After `stateSync.sync()` and a page reload, both still hidden (`visible: false`). Alpha reads 1 after reload with visible false, so they are not drawn. Screenshot `screenshots/lp4_c1_after_reload.png`.
- No page errors.

Correction (17 November 2026, build review R2 m4): the line above says the sofa shot was taken with the player in reception at (48, 210). `screenshots/lp4_sofa_after_evac.png` does not show that. The frame is centred on the SCADA control room with an examine box open; reception's sofa is at the top-left edge, half covered by the objectives panel, and the visible half is empty. It agrees with the text but is not the sofa render check. A re-shoot with the player in reception and the objectives panel collapsed is still open.

Replaced (18 November 2026): the re-shoot is `screenshots/sofa_after_evac_reshoot.png` (LIVE_PROOF_7.md check C). Player in reception at (107.5, 218.5), objectives panel collapsed, no toasts, the sofa empty and the guard at his desk. `lp4_sofa_after_evac.png` is superseded.

Note (7888): the first sofa shot walked the player to (150, 200) and the guard's "Still need you at the desk first, my lover. Badge." challenge covered the frame. Not usable as the sofa shot, kept as `screenshots/lp4_c1_7888_guard_overlay_not_used.png`. Reload result on 7888 was the same as 7895.

## 2a. Attack Ibrahim while seated. Recorded

Game 7902. Two punches at Ibrahim seated at (215, 228).

- Before: `aes_staff_off` false, `ops_kettle_off` true (true by design until Vance is met and the card is held), both seated, no hostiles.
- After the first punch: `aes_staff_off` true. Ibrahim `hostile: true`, `ko: false`, standing at (217, 219). Player at (209, 236).
- Joanne stayed seated at (239, 227), mode idle, needs unchanged across the three readings.
- `patrolOverride`: none on either newcomer (config flag false; m04 scenario sets none).
- Screenshot `screenshots/lp4_c2a_after_attack_seated.png`.

Pass or fail: the attack registers and the staff turn off. The brief's test was "record", so this is recorded, not scored.

## 2b. Attack Joanne while she walks to the cooler. STUCK

Joanne's walk to `reception_cooler` is the cooler trip: the trigger is entering reception from the ops office, and it does not depend on the kettle. The kettle opens only after `vance_met` and the card; `cloneCard` sets both (the ally route alone does not set `vance_met`).

Three tries, each with the card route and the reception entry:
- 7903 (ally route only, kettle closed): not a valid precondition. Joanne reached `goto_target` at (196, 228) and stopped there while the player stood beside her. One punch, no hostile.
- 7908 (card route, two punches): Joanne at (221, 229), `goto_target`, not hostile after two punches, stopped for the 7.5 s readings.
- 7916 (card route, four swings with `moveToNear`): `window.playerCombat.attack` returned false on all four swings, `canPunch` true, not punching, Joanne at (206, 229), still not hostile.

Last state: Joanne in `job/goto_target` to `reception_cooler`, stalled beside the player for at least 7.5 s, `aes_staff_off` false, `ops_kettle_off` false.

Diagnosis from direct calls on 7916 (after reception entry, no `moveToNear`): `attack()` with no argument, and `attack({x,y})` at Joanne's sprite, both return true and start a punch. So the false return comes from the `moveToNear` step before the swing, not from a gate (no minigame, no KO, not blocking, `disableAttacks` unset). Not diagnosed further; no code was changed.

## 2c. Strike the guard with Joanne at the cooler. NOT RUN

Blocked by 2b (the walking attack did not land, so the cooler-stall state was not reached in a useful way). Not attempted in a fourth game.

## 3. M1: KO Joanne, then crew_warned by Vance's phone. NOT MET

Game 7923. Six punches at seated Joanne, each with `moveToNear`.

- After six punches: Joanne `hostile: true`, `ko: false`, `aes_staff_off` true. She moved from (239, 227) to (258, 227) during the punches.
- Did not reach KO, so the M1 condition was not met. The phone call then ran and `crew_warned` fired (`evac`, `kettle_off` true).
- Bark check after the warning: `window.__ev` shows no Joanne events after the warning (her three events are the hostile change, the attack, and a stand to the sofa, all before the call). No DOM text starting with "Joanne" on screen.
- Expected outcome (no bark) is consistent with the data, but the run did not KO her, so this is not the M1 proof. Screenshot `screenshots/lp4_c3_joanne_hostile_not_ko.png`.

## 4. Credits after a newcomer KO. NOT RUN

No newcomer was KO'd, so the credits route was not started.

## Bugs and observations

- `attack()` after `moveToNear` returned false against a walking newcomer (2b). Reproduced on 7916; direct calls work. Cause not found.
- Joanne did not move from the player's side for 7.5 s while the player stood next to her (2b, 7903 and 7908). Same as the earlier LIVE_3 note.
- Punching seated Joanne six times did not KO her (3). Needs a check on the KO threshold before M1 can be tested.
- Other: none. No page errors in any run.

## Games

7888, 7895 (check 1); 7902 (2a); 7903, 7908, 7916 (2b); 7923 (3). Stray: 7885.
