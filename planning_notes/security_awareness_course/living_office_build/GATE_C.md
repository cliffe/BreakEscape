# Gate C: results (wave 1B, ca12)

Branch `feat/ca-living-office-1b`. The spec is `CA12_BUILD.md`. The live evidence is in session scratch, and the verdicts and game ids are copied here. The panel runs used the `test_ca_office_kit` DB row, overwritten in a throwaway worktree, because ca12 has no row of its own yet. Camila used the stand-in sprite `female_blowse`.

## Offline

- `test_office_kit.py`: 59 OK.
- `social-awareness-office-kit.test.mjs`: 17/17. `dialoguelint-wordcap-exempt`: 7/7.
- `bin/test-js` at cac57fa97: 916/917 (only m01-decode-task fails, a Bundler environment issue).
- Validator: 0 `^ +ERROR` lines on ca12_visitor_tailgater, ca12_visitor_tailgater_defend and test_ca12_fallback.
- `--kit` regeneration: the shells come back byte-identical, and the hand-written A7 and kiosk variant survive.
- Reviews:
  - Build review (Opus 5.5): 0 blockers, 0 majors, 7 minors. m1-m6 fixed; m7 waits on the owner.
  - Dialogue check as built: 0 blockers, 0 majors, 5 minors, all applied. All 14 lines and 5 labels match the appendix.

## Live route matrix

| Route | Result | Games |
|---|---|---|
| 1. Report, Look up, mention, reception (lobby loaded) | PASS | 10586 |
| 2. Look up, silent, let in | PASS after fix 6248d5486 (Lorna first and Camila first) | 10609, 10612 (fail 10592) |
| 3. Look up, no screen answer, say nothing | PASS | 10598 |
| 4. Look up, mention, no door answer (timers) | PASS | 10605 |
| 5. Camila's question opened and closed unanswered (silent) | PASS | 10591 |
| 6. Carry on | PASS (no chain, Lorna recap with no visitor; `done` stays unset by design) | 10607 |
| 7. Kiosk reopened, debrief closed before C1 | PASS (visitor still arrives; no barks once kit_quiet is off, by design) | 10611 |
| 8. Reload mid-beat, click Camila | PASS (question reopens, ends normally) | 10613 |
| 9. Fallback build, catch and miss | PASS (100% and 81%; no chain globals change) | 10603, 10604 |

Lorna's recap matched the appendix word for word on every route. Barks were still showing 2.5 s and 3.5 s after they started. The stale-caption report was not reproduced.

## Fixed during the gate

- Walk targets: the engine counts a walk as arrived within 1 tile (npc-behavior.js:1432-1445). Camila's step-in tile moved to (6.5, 4.5) and Julian's J2 to (7.0, 5.5).
- A7 only registers once the lobby room has loaded (lazy NPC registration). The proof visits the lobby first.
- Let-in hide: a bump between Lorna and Camila added an avoidance waypoint, and reaching it emitted `npc_arrived` early (npc-behavior.js:1458-1466). The data workaround:
  - Lorna's walk back is delayed 3 s;
  - V11 is gated on position;
  - V11r re-issues the walk.

  AC0 fixed the engine bug on `fix/npc-arrive-sidestep`, which is now on main. With it in, route 2 ran clean 9 times without the workaround: 3 Lorna first, 3 Camila first and 3 forced bumps (games 10702-10712; control 3/3, games 10669, 10695, 10700). Camila was hidden at raw x 240-249 every time. The whole workaround is dropped.

## Accepted

- Camila disappears about 1 tile short of the door (0.92-1.1 tile, measured by the engine guard).
- Closing the debrief raises the course's success screen. This is the shipped ending, as in ca01, and the chain carries on under it.
- A click on Thandiwe after the beat can offer the screen choice again (harmless).

## Still open

- Proof 7's look, the visitor persona playtests and the fallback holding-tile look, now that Camila has her own sprite (c8958a2aa: bust b01, talk t02, visemes, walk with the stock six and seated frames).
- Voicing still to do: Camila's 3 door replies (D209, after their dialogue review) and the sofa pool lines for Thandiwe, Lorna and Delphine (D210, 9 clips). Done: groups A and B (27 clips, a92a80aa7) and the Zephyr sample (a86ad1f8f).
- DB rows for `ca12_visitor_tailgater` and `test_ca12_fallback` at the next seed.

## Settled with the owner

- D195: the course shell is Form A (panel).
- D203, D207, D208: the twin's host line is split into catch and miss (2 clips each). It says "gate", matching the voiced panel lines and the call card, and stays unvoiced like the ca01 twin (57bb05bed).
- D209: Camila's voice is Zephyr, en-GB, mid 40s.
