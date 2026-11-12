# Handover: A2c (hold, popups, damage, ending)

Stopped at the call budget. Branch `build/phone-calls`. Server :3025 stopped.

## Done (commits)
- `134dfa91b` engine: `phone-ringer-dom.js` lifts the any-minigame block (only conversations, a scripted scene, queued beats and a knockout block ringing), `minigameOpen()` (pill, "Answer puts them on hold" status), `putAside()`/`reopen()` for CyberChef and the lab sheet (lab `src` property saved; the ringer's own close does not nudge it), `lastHitAt()`. `player-damage-interrupt.js`: `lastPlayerHitAt()`, `playerHitWithin()` (performance clock, stamped before the close, on window). Row 28: `ending-check.js` (End now, held ending run) and `scenario-music-events.js` (credits start) call `phoneRinger.close()`. Tests: new `phone-ring-hold.test.mjs` (19: rows 11-18, 22, 26, 28 on the live adapter) plus changes to `phone-ring-layer`, `ending-check`, `player-damage-interrupt` tests and the harness.
- `9c840c3eb` tooling: A2b R5 m1/m2 (`mktemp` scratch dir, `PC_PORT` required).
- `5f1623d32` scenario: `test_phone_calls` gains keypad safe, lockpick case, open container with a note, CyberChef and lab workstations, `guard` (patrol, `player_in_view:guard` person-chat), hostile `brute` (calm until `npcHostileSystem.setNPCHostile`), `caller_hold` (8 s delayed ring), `caller_forced`, `caller_popup` (8 s), levers.
- With this note: `guard_off` global (`skipIfGlobal` on the guard's challenge), `tools/phone_calls/routes/a2c_live.sh`, `proofs/A2c/`.
- `bin/test-js -j 3`: 507 passed, 0 failed (before the `guard_off` scenario tweak; no JS changed since).

## Live proofs done
`a2c_live.sh hold` (game 1654): ring over the keypad (status line shows, no control covered), Answer shows the hold pill, closing the keypad opens the call. Banner and pill over a lockpick (`banners_*_pick_case.png`). All in `proofs/A2c/`.

## Open
1. `banners`: the second object (`open_case`) opened the keypad (moveToNear picked the nearest; space objects apart) and the second hold ring gate failed. Fix, shoot the container.
2. `popup`: a person-chat was open when the first popup shot was due (cause not found; not the guard once `guard_off` is set; check `debrief_host` or whether `open_obj cyberchef_ws` lands on an NPC). Needed: banner over CyberChef and the lab popup, Answer hides the popup, it returns after End (unit-proved only).
3. No terminal object in the scenario: banner-over-terminal shot still to do.
4. Not run: `forced` (written), real hit during a connected call vs the `m09_recruiter_guard_hit.sh` baseline, guard dropped challenge live, brief over ring (`timed_caller` into `caller_basic`, `--set skip_timed=false`), hold variants 14-18 live (unit-proved on the live adapter), `caller_queue`-style routes.
5. Lab SE Dev proof (`routes/se_dev.sh`, compare `sha256_noseed` with `proofs/A2b_r3/live/se_dev/`) and the regression set not rerun. `TEST_SCENARIOS_README.md` row for the new contacts.

## Gotchas
- The shell env does not persist: prefix `PC_PORT=3025` on every route call. Never `pkill -f` a pattern that appears in your own command line (it killed the shell); kill by pid.
- The guard challenges the player at once: routes call `calm_guard`.
- `a2b_lever` with a caller re-pulls the lever; with a timed ring mixed in, pass no caller.
- Hit: `window.npcHostileSystem.setNPCHostile('brute', true)` (disable LOS first), calm it afterwards.
