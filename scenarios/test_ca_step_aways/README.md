# test_ca_step_aways (E3: step-away beats as a list)

Start room: `ep_room` (kiosk, Host). East door leads to `side_room` with the Courier. Stub content; all lines are test text.
`stepAways` has two beats: `world_beat` (after `write`, `doneGlobal` `tcs_beat_done`, `resumeOnDone` true, `readyGlobal` null) and `post_defend` (after `defend`, ready on `kit_defend_done`).

What to click:

1. Kiosk: Begin the brief, the osint stage (close the browser), then the write stage: send the one email with the default pretext.
2. Expected: a panel "Test beat" with Look up and Carry on shows on the stage advance, inside the open runner, before the flip. Look up is enabled straight away (no readyGlobal).
3. Look up path: click Look up. The runner closes, the Host barks "World beat: the courier is through the east door." Walk through the east door and click the Courier, then "Done here." Expected: `tcs_beat_done` goes true and about 4 s later the learner is moved back to where they stood at the kiosk and the runner reopens at the flip.
4. Waiting panel: after Look up, click the kiosk again before finishing with the Courier. Expected: "Test text. Still out there. Carry on whenever you like." with Carry on. Carry on writes `tcs_beat_done` true and goes to the flip.
5. Carry on path: in a fresh game click Carry on on the first panel. Expected: straight to the flip, `tcs_beat_done` true, no return move.
6. After the flip, the defend triage runs as in `test_ca_step_away`; when it saves, the second panel (post-defend beat, Look up or Carry on) shows. Look up there makes the Host bark "Post-defend beat: the step-away fired." and the success screen stays held until that beat has run.
7. Reload between Look up and the courier conversation: the watcher restarts from saved state and the runner reopens after the global turns true.

The legacy `stepAway: true` form is in `scenarios/test_ca_step_aways_legacy` (one beat, after defend).

Status: validated only (0 errors). Not yet run in a browser.
