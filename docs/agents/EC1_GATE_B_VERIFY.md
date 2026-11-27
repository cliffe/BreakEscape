# Gate B verify (worktree x-gateb-p2 at e9ca45939, keyless server :3003, mission 278 test_ca_office_kit)
Games created through the POST form: 10324 (not driven), 10325 (1 look-up), 10326 (1 carry-on), 10327-10330 (2), 10331 (3), 10334 (5). Files in this folder.
Harness: copy of the playtest driver in driver/ (adds page.route, an in-page fetch blocker, reloadPage); init.js counts emits in sessionStorage (gb_ev).

## 1. Debrief cards after Look up: DEFECT (differs from Carry on)
- Element: article.aw-card (debrief-view.js:197), one per *reviewed* item only (:432 filter, :495-496). Perfect round = 0 cards by design, so the Haiku "0" was correct for a clean round.
- Run with 2 wrong answers (bank trust, laptop report), 5 items: Carry on (game 10326) = 1 card (ep_bank), summary "Phish caught: 1 of 2 (1 reported)". Look up + reopen (game 10325) = 2 cards (ep_bank, ep_laptop), summary "Reported 50% of the phish". Not the same.
- Cause: reopen rebuilds from stored defendProgress (episode-runner-minigame.js:831-835). cleanAnswerList keeps only id, verdict, flags, ms, action (episode-model.js:246-259), dropping score/isPhish; defendSummary keeps numbers only (:888). reviewNeeded then uses the verdict fallback (debrief-view.js:163-176), which treats "report" on a genuine item as wrong, while live scoring gives it 100.
- Smallest fix: in _renderDebrief, when there is no live triageResult, rebuild with scoreTriage({messages: set.messages, answers: kept, profile, scoring}) (it returns score, phishTotal, phishCaught, perFactor); or store score/isPhish in cleanAnswerList and phishTotal/phishCaught in defend.
- Screenshots: c1-lookup-debrief.png, c1-carryon-debrief.png.

## 2. Failed defend save: reachable, behaves as required
- Source: state-sync.js syncConfirmed retries 6 runs, back-off 250 ms doubling to 4 s (:882-896); 403 stops at once. triage-starter.js saveRound: confirm() false -> onSaving('failed'), returns before emitGlobals (:~250-262), so global_variable_changed:kit_defend_done never fires. inbox-triage-minigame.js:1785-1793 shows "We couldn't save your result yet". The runner still advances (_triageDone, runner :1190-1207).
- Persistent in-page fetch wrapper (init.js, sessionStorage flag) rejecting every PUT /sync_state containing episode_e1_stub_defend_complete:true, game 10330: panel shows, Look up disabled at render and on click (no step-away event, runner stays open), Carry on works (debrief, 100%), kit_defend_done false throughout. After reload: server holds stage defend, defend_complete false, kit_defend_done false, kit_e1 not out; reopen shows the Defend stage again. Unblocking without redoing the round changes nothing (needs the round redone).
- Route interception only (game 10328, route.abort): the pagehide keepalive flush bypasses page.route and landed, so after reload defend_complete was true on the server but kit_defend_done stayed false for good (no emit is replayed). Edge defect: double fault only; the panel does not return after reload anyway, but anything keyed on kit_defend_done never fires. Suggest re-emitting the done globals on reopen when defend_complete is true and kit_defend_done is not (triage-starter already does this for an open conclusion task).
- CDP setBlockedURLs did not block with page.route active (game 10329, clean run, ignore).

## 3. kit_defend_done across a reload at the triage result: counted once, but overlay NOT held (DEFECT)
Game 10331. Payload of global_variable_changed is {name, value, oldValue?} (npc-workarounds.js:487, npc-game-bridge.js:36, triage-starter.js:194). Counter (init.js) read 1 at the result screen, still 1 after reload and reopen attempt: exactly once. Screenshot c3-result-screen.png.
However: at the result screen defend_complete is already saved, mission_concluded has fired (count 1), and the episode state is still defend (done has no defend). After reload mission_concluded replays (count 2), the hold (episode-starter stepAwayHoldNow, reads saved state) is false because defend is not in done, and the success overlay is shown at once, blocking the kiosk (interact: blocking-ui), so the debrief cannot be reached. Overlay is held only once the defend stage is saved as done (Finish pressed). Not run further (context limit): debrief read and close after this reload.
Smallest fix: make the hold true while defend_complete is true and the episode has not finished (stage defend or debrief with debrief not done and not debriefSeen), not only after defend is in done.

## 4. mission_concluded in the step-away shell
Event counts (init.js) in every run: mission_concluded fires at the defend save (same moment as kit_defend_done), before Look up, at the result screen in game 10331 and before the panel appears. Cause: scenario mapping completeTask finish_episode on global_variable_changed:episode_e1_stub_defend_complete (scenario.json.erb:468-473), aim complete -> conclusion. The overlay is deferred by the hold, not the event. A non-stepAway shell concludes at the same point; the episode runner does not gate it, no stepAway code is involved (objectives-manager conclusion keyed on the task). Not read deeper in source (limit); no line number for the non-stepAway path beyond the mapping above.

## 5. Look up, never reopen, 60 s, reload: PASS (fresh game 10334)
Polls +10 s to +60 s: overlay false, held true, step-away count 1, scene null. After reload: overlay false; episode state stage debrief, done [brief, osint, write, flip, defend], defend {percent 100, reportRate 1, verifyCount 0, teamProtected 2}, defendProgress 5 answers, no debriefSeen, kit_defend_done true, defend_complete true.

## Fix proof steps (for a Haiku live runner, branch fix/ec1-reopen-hold)

Use the same harness as above (keyless server, mission test_ca_office_kit, the driver copy with page.route, the in-page fetch blocker and init.js emit counters in sessionStorage). Create a fresh game per proof through the POST form. Record screenshots and the counts named below; report PASS or FAIL per step.

### D3: reload at the triage result
1. Play to the defend triage and finish the sort so the result screen shows (do not press Continue).
2. Reload the page. Poll the success overlay for 30 s: it must stay hidden (the hold reads `defend_complete` true with the stage still defend). Read the state: stage defend, `episode_e1_stub_defend_complete` true.
3. Open the kiosk. It shows the defend launch. Launch it: the triage shows the result again with the stored answers (no re-sort).
4. Press Continue. The step-away panel shows, with Look up enabled. Press Carry on: the debrief shows. Press Finish and close.
5. PASS when the overlay never showed before Finish or close, and `kit_defend_done` was counted once across the reload.

### D1: Look up then reopen against Carry on
1. Game A: answer 5 items with two wrong (bank trust, laptop report, as in game 10325/10326). At the panel press Look up, wait for the kiosk to close, reopen it (it lands on the debrief).
2. Game B: same answers, at the panel press Carry on.
3. In each debrief count `article.aw-card` and read the `.aw-summary` text. Expect 1 card (ep_bank) and the summary "Phish caught: 1 of 2 (1 reported)" in both. Before the fix game A gave 2 cards and "Reported 50% of the phish".
4. Reload game A and reopen: same cards and summary again. Read the episode state before and after the reopen: no new field (keys unchanged apart from `debriefSeen` after the first close).

### D2: keepalive-only save
1. Install the persistent in-page fetch wrapper (init.js, sessionStorage flag) that rejects every `PUT /sync_state` whose body contains `episode_e1_stub_defend_complete:true`. Play the defend triage to the result. Expect the "We couldn't save your result yet" notice and `kit_defend_done` false.
2. Let the pagehide keepalive through: use route-only interception (page.route, as game 10328) so the keepalive flush bypasses it and lands; do not use the in-page block on the reload. Reload.
3. Check the server state: `defend_complete` true, `kit_defend_done` false before the kiosk opens.
4. Open the kiosk. Expect exactly one `global_variable_changed:episode_e1_stub_defend_complete` in the counter (gb_ev), `kit_defend_done` true after a moment, and the Look up button enabled where the panel shows.
5. Close and reopen the kiosk, then reload and reopen: no second emit on the same page, none when `kit_defend_done` is already true. PASS on count 1 for the first open and no further emits.

### Non-stepAway reopen
1. Use a non-stepAway episode (a plain full shell, or the stub with `stepAway` removed). Finish the defend round, reach the debrief, close without Finish, reopen at the debrief.
2. Expect what it showed before the fix: the stored figures (percent and report rate) with no per-item cards and an empty answer list, no step-away panel, no Look up, and no re-emit of the complete event on open (counter unchanged).
3. PASS when this matches a run on main for the same episode.

