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

## Outcomes (fixer, 2026-11-23)

| Item | Outcome | Commit |
|---|---|---|
| PT1 a, c | The `add_ops_string` public-substring loosening is removed (the rest of `12aea0679` kept). New test `PT1: the old maint_log wording ...` runs the scanner on the real scenario with the OLD clue and reports `camrec01` on the room answer; the reworded clue reports nothing (the real-run test is clean). Mutation: loosening restored locally, the test fails; restored. | f2677efc4 |
| PT1 b | Lobby `maint_log` line now reads "The ceiling cameras: the date their recorder shows is left over from the factory image." No host, product or version string of `office_lan` is in room text. The ink, `mission.json` and `PLAYTEST.md` never held the old line; the graph files do not carry log text (regenerated in the PT2 commit only because they were stale from the need-edges fix). | f2677efc4 |
| PT1 d | `test_ops_scan` has no such clue: no host name, product or version of its discovery network appears in room text (its only match, "File server", is the sign-in PC object's own public name). | none needed |
| PT1 e | No validator rule exists today (`scripts/validate_network_ops.rb` has no check of room text against host names). Proposed: warn when a `hosts` entry's `name`, a service `product` or a `version` of 6 or more characters occurs as a substring of any room object `text`, `observations`, hint or NPC line, unless it equals a room object's own name. Warning only: the author rewords the clue. | not built |
| PT2 | Cause: each later capture was leak-checked ALONE (`access-leak-check.rb 22 responses-22-<x>.jsonl`), so the sweep and scan earned in `responses-22.jsonl` were unknown (12 findings on `GET /network` alone, including `files01`'s product). The tool already reads several files as one log in order; nothing else is wrong. Given `responses-22.jsonl` first, each of the four later files reports only the PT1 finding of the first file (the old clue wording), none on `GET /network`. Two tests added (resumed file alone reports, together clear; a real unscanned leak in the resumed file is still reported). Mutation: earned steps reset at each new file, the first test fails; restored. Docs: script header and `PLAYTEST.md`. | dac206901 |
| PT3 | Beat 8b replaced by one line naming `network_ops_state_delta_test.rb` and `network_technique_hostile_test.rb`; the sync route line removed from the hostile list. Not run. | dac206901 |
| PT4 | Left (client CSS, another builder). | none |
| PT5 | Beat 1 count states the real four and what they are (DESK01, FILES01 by id, camera recorder, printer); beat 5 no longer expects `printer_manual` in `inventory` (it goes to the notes); beat 7 now names the switch hint ("File server switch": "The file server's open share is switched off."). | dac206901 |
