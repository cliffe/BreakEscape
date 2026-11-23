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

## Outcomes (fixer, 2026-11-23)

| Item | Outcome | Evidence |
|---|---|---|
| PL1, kind A: `via: "technique"` in the `session` of `GET /container/<pc>` (vault01, desk01; 11 answers) | Scanner was wrong. The server sends it on purpose: `login_session_answer` (`game.rb:4643`) always sent `via`, and the container route has returned `session_for_client` since before S3 (`games_controller.rb:3304`, main `:3262`). Plan section 7: "A technique session's `via`: on the host row, in the session answer and in the reloaded sessions, once granted". The grant was earned (`session:vault01`); the rule could not tell which host, because a session answer has no `id`, only the `host` label. | Capture `responses-29-2.jsonl` lines 78, 83, 102, 108, 109, 114, 151, 156, 161, 163, 167 |
| PL1, kind B: `via` in the repeat (`already: true`) technique answer's `session` (2 answers) | Scanner was wrong. `ops_technique_repeat_answer` (`network_ops.rb:606`) builds the same session answer; section 5.4's answer carries `session`. A repeat earns no new step and the owner came only from a fresh grant. | lines 82, 160 |
| PL1, kind C: `access: "admin"` in the container answer after the admin grant (1 answer) | Scanner was wrong. `game.rb:4652` adds `access: "admin"` when the level is admin; plan section 0 ("the session answer ... carry `access: "admin"` when the level is admin") and section 7. `admin:vault01` had been earned at line 113. | line 114 |
| PL1, fix | `ops_session_owner` in `tools/playtest/lib/access_leak_scanner.rb`: a hash with `via` or `access` takes its host from its `host` label when one PC carries that label (`@ops_host_by_label`), else the host of the grant answer being judged, else nothing (fails closed). The rules are unchanged: `via: technique` before `session:<pc>`, `access` other than `"admin"` or before `admin:<pc>`, any `technique` key, `openHere` by foothold. No engine change; no server fault found. | commit 1acac5791; `test/unit/access_leak_scanner_ops_session_answers_test.rb` (7 runs) over the 19 real answers in `test/fixtures/files/access_leak/ops_access_session_answers.jsonl` and the real `test_ops_access` scenario |
| PL1, rerun | `access-leak-check.rb 29` over `responses-29.jsonl`, `responses-29-kbd.jsonl`, `responses-29-2.jsonl`: "VERDICT: no leaks found." (was 14 findings) | rerun by the fixer |
| PL2 | Done. A player locks a session by Start, then `#pc-start-lock`, offered only for a password session or a credential session over a foothold (`pc-sessions.js:176` `sessionLockable`, `pc-taskbar.js:187`). A technique session is not lockable by design (plan 5.4, readers table and "How a technique session differs"), so beat 13 now opens the `vault01` remote view's Start panel and shows Sign out with no Lock and no Switch user; the lock request itself stays in `network_technique_session_test.rb`. | `PLAYTEST.md` beat 13 |
| PL3 | Done, each checked: plant_lan's pivot is whichever held session the server ranks first (`via_for`, lowest seq then host id), all four hosts being on `office_lan`; Start-menu ids are `#pc-start-lock`, `#pc-start-switch`, `#pc-start-signout` (`pc-taskbar.js:284`); the saved connection connects through the "Connect with ..." button (`.signin-cred`), the plain Sign in asks for a typed password; Unplug has no prompt (the script's text was already right; now says so and names the toast); a replant opens no view (`interact` `office_port`); the keyring has no screen in this scenario (no capture log item), so the step is the find toast plus the sign-in control's list; a container take raises no toast, only `.container-message` "Added <name> to inventory" for 3 s (`container-minigame.js` `takeItem`, `showMessage`), which the beat now reads; beat 3's session need label is the host label "VAULT01". | `PLAYTEST.md` |
| PL4, PL5 | Not touched (a later tester's). | |

## Second live-proof run (orchestrator, 2026-11-23)

Game 35, port 3011; results `/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/s3-playtest-2/`
(`RESULTS.md`; captures in `test_ops_access/`: `responses-35.jsonl`, `-2`, `-3`). The tester
stopped at its context budget after item 5. Seen: the planted jack (ok); the held PC tinted
red; blue while the player stands near and red again after stepping away; no tint or mark
after the unplug; the host row's bolt (14 x 22 px) and "admin" tag; the technique session's
Start panel offering Sign out only; the saved connection in the sign-in list; the container
message on a card pickup; Sign out from a world-opened remote view landing in the world; a
double click after a reload opening one desktop with one `GET /network` and one container
request. `verify-run` OK. Items:

- **PL6 (major, client).** The bolt mark on the held PC in the world is NOT visible: the
  sprite is tinted but the scene's bolt object reports `visible: false` (tester's note O2).
  The plan's marker is the tint AND the bolt (section 5.4, "The compromised marker in the
  world"). The node tests pass, so they do not model whatever hides it.
- **PL7 (leak check, 776 findings; investigate).** Over the three capture files the leak check
  reported 776 `ops_string` findings, all on `GET /network` (399 with finding owners, 57 each
  for service, host and technique owners). The first run's game was clean after the scanner
  fixes. Either the files were judged in the wrong order or not together, or a session
  resumed after a reload loses its earned steps in a way the documented use does not cover,
  or the per-thing change regressed something. Not judged by the tester.
- **PL8 (investigate: ours or older).** After a page reload and resume, interacting with the
  office port where the drop box was ALREADY planted asked "Plug the drop box into the office
  port?" with "Plug it in" / "Leave it"; choosing "Leave it" sent `POST /network/unplug` and
  returned the box to the tray (tester's note O1). A "Leave it" that unplugs is wrong
  whoever's it is; find whether stage S3's client changes cause it or it pre-dates this build
  (compare with `main`).
- **PL5 still not run:** beat 19 (the older network playtests' first beats) and the
  phone-width Techniques panel.

## Outcomes (second run)

| Item | Outcome |
| --- | --- |
| PL7 | Explained by how the check was run (cause 1): the three files were given in glob order (-2, -3, then the first), so the later answers were judged before the earlier sweeps, scans and checks. Rerun in time order (35, 35-2, 35-3): no leaks; in the glob order: exactly 776 (399 finding, 228 service, 92 technique, 57 host owners). Scanner not changed, per-thing earning and the resume rules hold; no server fault. Fix: `access-leak-check.rb` exits 2 when the files are not oldest first by their first row time (`AccessLeakScanner.file_order_problem`, two tests, mutation-proved on both sides of the comparison); PLAYTEST.md names the files one by one. Game 35 in order and game 29 in time order (29, 29-kbd, 29-2): no leaks found. |
| PL6 | Fixed (client). Cause: `compromise-marks.js` `_place` copied the sprite's `visible` into the bolt once, when the bolt was made; a room's sprites are made hidden (`core/rooms.js` `sprite.setVisible(false)`) and shown later by `revealRoom`, and `syncRoom` runs between the two, so a mark for a PC in a room entered after the grant got a bolt with `visible: false` that nothing updated (a jack in the current room was marked after the reveal, so it showed). Reproduced in a browser (game 36): desk01 sprite visible and tinted, bolt `visible: false`, depth 153.5, in the display list, same texture and position as intended. Fix: `_followVisibility` wraps the sprite instance's `visible` accessor so the bolt shows and hides with it (no timer; removed on unmark). Bolt as drawn: 7 x 11 at scale 1, origin top right at the sprite's top right, one depth above. Browser proof after the fix: desk01 bolt visible, held PC red, blue near, red after stepping away, planted jack bolt, no tint or bolt after unplug. Node tests: two new in `compromise-marks.test.mjs` (Phaser-like prototype accessor, hidden at syncRoom, shown by setVisible), both fail on the old code. Clips in `/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/s3-bolt-fix/`. |
| PL8 | Not S3's: a tester mistake, no code change. In the second run's browser 2 the focus walk (Tab) reached the network view's Unplug button and `realKey Enter` pressed it (`POST /network/unplug` at cmdSeq 178, 21:13:04); the tester's "Leave it" came 19 s later (seq 200) and sent no request (the next request was the replant at 21:13:41). With the box then in the tray, `interactJack` correctly asked "Plug the drop box into the office port?" (Plug it in first, Leave it second; Leave it returns `cancelled`, no request). `interactJack` and the plant/unplug path are unchanged from `main`. Reload and resume with the jack planted, reproduced on game 36: the click opens the box's network view with Unplug inside, no prompt. |
