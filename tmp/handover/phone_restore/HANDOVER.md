# Phone reopen: R1 fix handover

Branch fix/phone-restore-stitch. Fix commit eae5f561a (on top of review eb16d9c7c).

## Done
- phone-chat-conversation.js reopenWithCurrentGlobals: entries tried are the knot top, then the owning stitch; the first whose OLD-globals baseline lands on the saved choices (texts and first sourcePath) is re-run under the new globals. If neither matches, saved choices stay, unless the knot top now diverts to another knot or ends (keeps m09 flag1_read going to the hub). Home-knot fallback uses opts.homeKnot (minigame passes npc.homeKnot||'start'), skipped silently via _hasKnot when absent; doc comment notes it runs the home knot's guards.
- Tests: test/js/phone-reopen-stitch.test.mjs tests 6-13 and fixture knots guarded, ident, note, gath, gath2, lobby. Mutants killed (by hand): knot-top-only (7), stitch-only (6,10), drop sameChoices (8), drop fresh===0 (9), hard-coded start (12), no keep-saved rule (10), always-take-top (11).
- bin/test-js: 761 passed, 0 failed (after the fix, before commit).
- Live (server pid in tmp/p3095.pid, port 3095, keyless; stop with kill <pid>):
  - m10 Elena, game 7967: "Give me a minute." then gallery_shutter_cut true (cut_step 0), reopen shows "The shutter's already dead..." via cut_0 (M1 pass).
  - m09, game 7974: flag1_read closed on "Got it.", memo_read changed, reopen shows the hub (M2 pass).

## Not done
- m09 identity_scene.albion "Understood." then flag 4: hour_read plays once (original bug); normal path; hour_read.body and ledger_read reopen checks; m02 and m04 changed-global reopen. Need a fresh game each (never reuse 7967/7974).
- Recipe: tools/playtest/new-game.rb (RBENV_VERSION=2.7.8, BUNDLE_PATH=<main>/vendor/bundle, BREAK_ESCAPE_STANDALONE=true), tools/playtest/session-start.sh --url http://127.0.0.1:3095/break_escape/games/<id> --headless, cmd.sh bootstrap with autoBrief, then eval via scratchpad e.py style; emit window.eventDispatcher events to fire legacy voiced mappings (not phoneRinger.offer, which resets to home). Open phone via .inventory-item[data-type=phone] mouse events, then mg clickText on the contact. Set setFPS(20) in page.
- Expected expectations: hour_read.body and ledger_read keep the old hub/rewind behaviour or keep saved choices; report what is seen.
- Stop the server: kill $(cat tmp/p3095.pid).

# R2 fix (commit f6a49bfb9)
- M1/m1: reopenWithCurrentGlobals applies the knot-top override after entry choice (also over a stitch entry) only when top's OLD baseline stayed in the knot with choices and the NEW run leaves the knot (nowLeaves) or ends (nowEnds). flag1_read "Got it." is kept; hour_read mid read-out and Ghost first menu are kept. m09 ink comment updated (json unchanged). m2 noted in the code comment. m4 not yet confirmed: npc.homeKnot as first_call for m01/m02 HaX (read npc-manager.js ~322) and no live m02 reopen done.
- Tests: phone-reopen-stitch tests 10-18 (fixtures gathn, readout, ghostlike, recruit, twin, bumper). Mutants A,B,C,E killed by tests 16,17,14,18; the other phone suites never failed under any mutant. The "2 unexplained failures": every test/js/*phone* suite passes unmutated in the worktree, so not reproducible (scratch-copy path artefacts).
- bin/test-js: 761 passed, 0 failed. scripts/ink_runtime_check/reopencheck.mjs "problems" went 168 (HEAD before) to 480; it compares against the old rewind behaviour, which this work intentionally changes (m02 ghost, m09 hax), so expected, not checked in further.
- Live (port 3086, helper scripts in /tmp/claude-1000: start.sh ev.sh mg.sh setg.sh openphone.sh closephone.sh reopenhax.sh hook.sh lg.sh; server and Xvfb :86 now stopped):
  - m10 Elena game 8034 (imports m07_elena_outcome turned): "Give me a minute.", gallery_shutter_cut true, reopen shows "The shutter's already dead..." PASS.
  - m09 game 8030: flag1_read at "Got it.", close, change memo_read, reopen keeps "Got it." (no re-ask); no-change reopen also keeps it. PASS.
  - Games 8029?, 8031 unused m10/m09 games from my runs.
- Not done: m09 hour_read mid read-out, hour_read.body/ledger_read, identity_scene.albion "Understood." then flag4 (hour_read once), m02 Ghost first menu and a m02 HaX home-knot reopen, m10 Vance (import m04_vance_is_ally true), m04 one phone contact. Recipe: new game with new-game.rb (--imports=<json> for carry-over), setg.sh to emit globals, mapping text messages arrive after delay then open phone and click the contact.

# R3 fix (this commit)
- M1: m07 phone ink people_topics, vault_finds, stuck_topics choices moved into a `= menu` stitch (guard and `submenu_from_hub = false` stay at the knot top, then `-> menu`). Comment updated. Spoken text unchanged: every `^` string in the compiled json is identical as a multiset before and after (300 and 300). build/ol-m07 does not touch m07_phone_agent_0x99.ink or json.
- M2: the home-knot fallback wins only when the fresh steps contain a visible line (phoneStepLines).
- m1: documented as a known gap in a code comment next to the home fallback (Ghost later intro menus after ransom_decision_made jump to the ending; first menu kept).
- m2: dropped `baselineKey !== '[]'`; N3 check is exact (split('.')[0] === knot, test pins it); N5 pinned by a fixture. m3: comments corrected.
- Tests: phone-reopen-stitch tests 22-26 (R3 M2 x2, N3, N5, M1) with fixtures in phone_reopen_stitch.ink; mutants for M2, N3, N5 each fail one test.
- Sweep (own copy of reopencheck with a replay yardstick for the three m07 submenus; reviewer's copy not on disk): m07 HaX submenu reopens stale 24 of 316 before, 0 of 317 after. m02 HaX home-fallback-without-visible-line rows 10 before, 0 after.
- Live: port 3085 only (3086 belongs to the checker).
- bin/test-js: 762 passed, 0 failed (R3 commit e21a8cc45).
- Live R3 (port 3085, Xvfb :85, both stopped by PID):
  - m07 game 8101: HaX "I'm stuck on something." showed "I've got a username and a password. Now what?"; closed, flag3_submitted emitted, reopened: re-ran stuck_topics.menu, choices "I'm in as their operator. How do I stop the cascade?" / "Send me a field guide." / "Never mind." Stale choice gone. PASS.
  - m02 game 8110: HaX "Where do I start?" resting on "What about Gary Whitlock?" / "Understood"; dr_kim_met emitted; reopen kept both choices (re-ran hint_start, no hub). PASS.
  - Unused game 8100 (m07, from the first new-game run).
