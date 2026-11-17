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
