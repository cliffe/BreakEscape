# S3 playtest and live proof: results and items (orchestrator, 2026-11-23)

The Haiku run of `scenarios/test_ops_access/PLAYTEST.md` (the text before the R2 fix pass):
game 29, port 3011, every view and world action by a real click, and select-then-Use by a
real keyboard (beat 3a: Tab to the finding's select, Enter; Tab to the card, Enter; Tab to
Use, Enter: each control reachable and activated). Beats passed: 1, 2, 3, 3a, 4, 5, 5a, 6, 7,
9, 10, 10a, 11, 12, 14, 15, 16, 17, 17a, 18. None failed. Beat 13 stuck (the desktop has no
lock control and the script's fallback was a hand-built request, refused by the session's
permission classifier, not retried). Beat 8 skipped by policy (a hand-built sign-in request).
Not run: beat 19 (the first beats of three older network playtests) and the phone-width
Techniques panel. `verify-run --access` and `--ops-log` are OK. **The leak check reported 14
findings.** Results, captures and screenshots:
`/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/s3-playtest/`
(`RESULTS.md`; `test_ops_access/leak-check-game29.txt`; 37 screenshots in `test_ops_access/`).

Refusal texts seen, exactly: "That finding has not been confirmed yet." / "That finding
turned out to be false." / "That technique does not work on this kind of weakness." / "That
technique does not work on this version." / "Something this needs is still missing. Missing:
Printer manual" / "That finding gives nothing to use." / "That weakness has been fixed."

The orchestrator looked at `06-finding-and-card-selected-use-offered.png` (findings with
selectable alias buttons; cards wrap and align at the top),
`23-desk01-remote-view-frame-from-world-click.png` (the red frame, the bolt line "Remote
view: Ian Okafor through Drop box: Lobby, Office wall port", the Remote chip, no sign-in
screen) and `22-world-desk01-tinted-bolt.png` (the held PC in the world: at this zoom the tint
and bolt cannot be judged). Items:

- **PL1 (leak check, 14 findings; investigate, decide by the plan).** All are `ops_string`
  with owner `ops:key:via` (13) or `ops:key:access` (1), on `GET /container` answers for
  `vault01` and `desk01` and on `POST /network/technique` answers. Either the scanner's S3
  structural rule is wrong about where `via` and `access` may appear, or the server sends a
  session field where the plan says it does not. Decide from plan section 0 (lines 58-92),
  section 7 (about 1267-1312) and what existing session answers already carried before S3
  (`login_session_answer` has always sent `via`). If the scanner is wrong, fix the scanner
  with tests in the server's real shapes and rerun the leak check over the three capture
  files in order. If the server is wrong, do NOT change the engine: report the answer, the
  field and the plan line.
- **PL2 (script).** Beat 13's lock step: say how the player really locks a session in this
  build (or that a technique session cannot be locked, per the plan's table of readers) and
  write the beat for that; no hand-built request.
- **PL3 (script, from the tester's notes).** The `plant_lan` block's header reads "through
  DESK01" where the script says vault01: which is right for the scenario? The Start-menu ids
  are `#pc-start-signout` and `#pc-start-switch` (the script's `#desktop-*` do not exist). A
  saved connection's plain Sign in asks for a typed password; "Connect with Saved connection"
  is the control. Unplug shows no prompt. A replant does not open the view by itself. Add a
  keyring screenshot step that opens the keyring.
- **PL4 (to see).** The marked sprite in the world: a close screenshot is needed to judge the
  tint and the bolt's size and place (a clip around the PC at a higher device scale).
- **PL5 (not run).** Beat 19 and the phone-width Techniques panel.
