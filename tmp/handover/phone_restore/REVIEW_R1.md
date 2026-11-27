# Phone reopen fix: review R1

Commit reviewed: 56240a20b on 69d8bf05a (`git diff 69d8bf05a 56240a20b`).
Counts: B0 M3 m4.

Method: read the diff and the callers (phone-chat-minigame.js 660-710 and 1030-1060, previewReopen, resetToHome, _resetAfterRingerCall, npc-manager resume mappings); static survey of every mission/lab phone ink for choices inside stitches and for each `start` knot; old-versus-new simulation of reopen on the real compiled inks (harness copies the old and new phone-chat-conversation.js, restores a saved state, changes one global, calls reopenWithCurrentGlobals); mutation runs against the new test and the 14 related phone suites.

Survey result: m02_phone_agent0x99, m04_phone_agent0x99, m05_phone_patricia, m10_phone_agent0x99, lab_social_engineering and lab_physical_pentest ruth_phone have no stitches at all, so only the start fallback can change them. m10_ghost_phone has one stitch (kept_code, line 66) with no choices. Stitch-held choices exist only in m09_phone_agent0x99, m09_phone_recruiter, m10_elena_phone, m10_vance_phone, m10_victoria_line and lab_tesseract_trials phone_ghost.

## M1. m10 Elena and Vance: the knot-top guard that ends the call is now skipped

Evidence: scenarios/m10_full_disclosure/ink/m10_elena_phone.ink:31-35, 52-56, 69-73 (and m10_vance_phone.ink:30-34, 47-51, 64-68). The authors wrote "Alignment R10-m2: a reopened step re-runs this knot, so a shutter cut meanwhile ends the call." The menus are stitches (cut_0_menu etc.), so the fix now re-runs the stitch, not the knot top.

Failure scenario (simulated on the compiled ink): player answers "Give me a minute." at cut_0, cuts the shutter by another route (gallery_shutter_cut true, cut_step not 3, so the cut_done mapping does not fire), then opens Elena's thread. Old code: "The shutter's already dead. You don't need me for this one." and the close choice. New code: no new line, stale ["I'm at it.", "Give me a minute."]; the start fallback does not help because `start` is silent (line 8-11). Self-heals one click later (cut_1's own guard), so no soft-lock.

Suggested fix: choose the entry by its BASELINE, not by the path shape. Dry-run the knot top under the old globals first; if that baseline lands on the saved choice set (same texts, or same choice container in sourcePath), re-run from the knot top (its guards stay live). Only when it does not (m09 identity_scene, whose top goes to `opening`) use the stitch. Add a fixture knot whose top guard diverts and whose menu is a stitch.

## M2. Saved choice after a gather inside a stitch: the re-run rewinds the player to the stitch's first question

Evidence: phone-chat-conversation.js `_reopenEntryPath` (diff +582-592) takes `parts[1]` from any sourcePath, including `knot.stitch.0.g-0.N`. Re-running the stitch from its top stops at the stitch's FIRST choice set.

Simulated on m09_phone_agent0x99.json:
- flag1_read.ask (ink 240-262), resting on "Got it." (`flag1_read.ask.0.g-0.24`, read-out finished, flag1_read_done true). Old: knot top `{flag1_read_done: -> support_hub}` (line 226), the hub, as the M3 R2 m1 comment (223-225) designs. New: back to "Ledger or stacks first?" / "She's shredding Series R?" / "Something else." A player who taps one hears the answer again and re-runs the read-out's tail. Worse than old.
- hour_read.body (632-676), resting on "Who gets it first?" (`hour_read.body.0.g-0.5`). Old: the hub (read lost). New: rewinds to "Isn't it?". Both wrong; new keeps progress but repeats a question.
- ledger_read.ask (282 onward), resting on "What else is on the entry?": old and new both rewind to the first two questions (pre-existing, unchanged).

sameChoices is false in all three, so the start fallback never runs and the rewind is shown as the real result.

Suggested fix: the same baseline rule as M1 closes this: if neither the knot top nor the stitch reproduces the saved choice set under the OLD globals, do not renavigate (keep the saved choices; optionally still try the start fallback for new output). This also stops the pre-existing ledger_read rewind.

## M3. Tests do not pin the headline change

Mutants run against test/js/phone-reopen-stitch.test.mjs and 14 related phone suites (minigame-title-escape, phone-call-notes-paths, phone-chat-hub-residuals, phone-reopen-and-persistence, phone-call-rows-not-conversation, phone-intro-once-and-notepad-raw, phone-player-lines, social-ink-vars, social-pretext-first-menu, phone-voicemail-hold, phone-voicemail-run, phone-callback-dom, phone-call-persistence):
- `const entry = knot` (knot top instead of stitch): survives everywhere. The fixture's `scene` top is `-> albion`, so knot and stitch runs are identical; the two tests that fail on old code fail because of the start fallback, not the stitch entry.
- drop `sameChoices` from the fallback condition: survives.
- drop `chosen.fresh === 0` from the fallback condition: survives.
- always fall back to start: killed (tests 3, 5). Never fall back: killed (tests 1, 2). Ignore `viaStart.fresh > 0`: killed (test 5). Observer not detached in dryRun: killed by phone-reopen-and-persistence.

Suggested fix: give the fixture a knot top that prints or offers something else (as m09 identity_scene does), a test where fresh output appears in the stitch with the same choices (start must not run), a test where choices change but nothing prints, the M1 guard case and the M2 gather case.

## m1. The start fallback hard-codes `start`

phone-chat-conversation.js diff +693-700: `knot !== 'start'` and `dryRun('start')`. A contact whose entry or home knot is not `start` (npc.currentKnot/homeKnot) gets the wrong comparison, and an ink with no `start` logs "Could not re-navigate to start" on every qualifying reopen. Suggest passing the NPC's entry knot in opts (the minigame knows it) and checking `namedContent.has` before the dry run.

## m2. m09: the fallback now runs start's guards on a reopen

m09_phone_agent0x99.ink:128-142. When the resting knot shows nothing new and the same choices, the real run of `start` can now print "One moment. Something's come in." with #exit_conversation (closing the phone at once while a voiced scene is pending), or "Her call first..." with [Right.]. It can also set dock_heard (line 141). These are the same writes and tags a fresh open makes and only happen when start prints something new, so I judge them acceptable; dock_heard set via `~` inside the REPLAYED (unchanged) part of start is also written by the real run, as for any knot re-run before this fix. Worth a sentence in the doc comment, since a reopen can now close the phone.

## m3. Fallback depends on whether the change touched the choices

The fallback needs `sameChoices`. m10_phone_agent0x99.ink:42-50: `start` diverts to jammed/after_ending/line_dead. If the jam also hides a hub choice (hub lines 78 onward guard on `not hax_jammed`), sameChoices is false and the player gets the trimmed hub without the jammed text; if it hides none, the fallback shows the jammed knot. Old code never showed it, so not a regression, only inconsistent. Possible fix: also try start when the re-run's choices are a subset of the saved ones and nothing new printed. Low priority.

## m4. Cost: up to seven story runs per reopen

Up to three dry runs (entry, knot on error, start), each two runs, plus the real run; the synced pass of the chosen path now runs twice (dry, then real). Externals bound on phone stories are pure getters (phone-chat-conversation.js 139-178: player_name, current_mission_id, npc_location, mission_phase, operational_stress_level, equipment_status); pretext_say/pretext_ask/se_influence sit only in choice bodies in dev_service_desk.ink (59-72) and se_influence goes through ledgerCall (social-influence.js:780-792), which returns the stored result for a repeat in the same turn. So no double-firing found. The observer detach is correct for this inkjs build (changes are recorded for the batch only while variableChangedEvent is non-null). Note only.

## Interaction with the phone-call work

- Ended story (DONE): reopen still needs current choices (line 637), so `_showRestoredThread` still restarts after an end (phone-chat-minigame.js 1036-1047). Unchanged. The fallback can now END a thread (m2), which then takes this path on the next open, as any normal exit does.
- Reload mid-call (cb357c252): `resetToHome` leaves the thread on the home knot, usually `start`, where the fallback is skipped. Unchanged.
- Ringer calls reset to home at end (`_resetAfterRingerCall`, 1542-1558), so they never rest inside a call stitch. Legacy voiced mappings with `resume: true` (npc-manager.js 1994-1997) keep their saved story and DO reach reopen, which is where M1 lands (m10 Elena and Vance).
- Voicemail hold (a2f44896c): not read in depth this round; the voicemail-hold and voicemail-run suites pass under the fix and under all mutants.
- Pretext force path: forced re-bake changes the choice texts, so sameChoices is false and start (dev_service_desk.ink:43-54, which resets team_checked/team_repaired) never runs. Safe.

## Live spot-checks before train

Needed: m10 (Elena or Vance by-hand cut: "Give me a minute.", set gallery_shutter_cut true without cut_step 3, reopen the thread; expect the "already dead" line) and m09 (flag1_read: close on "Got it.", change any synced global, reopen; expect the hub, not the questions). After a fix, re-run m09 games 7868/7869 cases. m02 and m04 have no stitches; only the fallback reaches them, and their `start` knots (m02_phone_agent0x99.ink:92-99, m04_phone_agent0x99.ink:120-143) print nothing once first_contact/greeted are spent, so a quick reopen with a changed global is enough there.
