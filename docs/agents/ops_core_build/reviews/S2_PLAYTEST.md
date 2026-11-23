# S2 playtest and live proof: results and items (orchestrator, 2026-11-23)

The Haiku run of `scenarios/test_ops_findings/PLAYTEST.md` (the text before the R2 fix pass):
games 22 (run A) and 24 (run B), port 3011, Sweep / Scan / Check / Confirm by real clicks.
Beats 1 to 11 and 8a passed; none failed; **8b stuck**. `verify-run --access` and
`--ops-log` match and are OK for both games. **The leak check reported findings in both
runs.** Results and screenshots:
`/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/s2-playtest/`
(`RESULTS.md`). The orchestrator looked at `11-backup-two-findings-needs.png` and
`16-phone-390x844-findings-confirmed-needs.png`: the findings panel reads well at both sizes
(alias, class, severity, Confirmed and Fixed chips, summary, a need with its cross, text
wrapping inside its card; client finding m8 from R1 is settled: the phone layout holds and
the tick and cross glyphs draw). Items:

- **PT1 (leak check finding; ruled).** The lobby room's answer carries the authored
  `maint_log` line that begins "Camera recorder: ...", which is the exact `name` of the
  `hosts` device `camrec01`, before any sweep. A scenario may leave an in-world clue about a
  device, but not in the device's exact listed name on an unswept discovery network. Ruling:
  reword the clue in `scenarios/test_ops_findings/` so it does not contain the host's exact
  name (it stays a clue), regenerate what depends on it, and keep the scanner strict. The
  validator could warn about this for authors: say in the report whether an existing rule
  already does and, if not, propose one (do not build it in this pass).
- **PT2 (leak check finding; investigate).** Four later captures of game 22, made after the
  session was resumed in a new browser, flag `files01`'s product string on `GET /network`;
  run A's own capture does not. Probably the scanner earns `scan:<host>` only from a scan
  request inside the same capture file, so a resumed session, whose scan happened in an
  earlier file, looks like a leak. Find the cause. If that is it, make the documented way of
  judging a resumed session correct (the caller's `ops_steps`, or seeding earned steps from
  the earlier capture files of the same game), with a test, and say so in `PLAYTEST.md`. If
  it is anything else, report it with evidence: it would be a real leak.
- **PT3 (beat 8b; for the user).** The beat sends a forged `PUT /sync_state` from the
  browser. The session's permission classifier refused it twice and the tester rightly did
  not look for another way. The same check is made by the Rails tests
  (`network_ops_state_delta_test`, the hostile tests). Remove the beat from the browser
  script and point to those tests instead; do not retry it.
- **PT4 (minor, client CSS).** In a row of cards where one card is tall (findings open), the
  short card is stretched to the same height with its content centred in the middle
  (screenshot 11: DESK01). Align card content to the top; cards in a row may differ in
  height or stretch, but content starts at the top.
- **PT5 (script).** Beat 1 says five rows; the view lists four (the scenario's real count).
  Beat 7's switch hint text was not captured. Already in the R2 findings as N10; check the
  corrected script against these.
