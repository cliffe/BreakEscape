# L2a client R1 fix: handover

Done: every finding of reviews/L2a_client_R1.md (F1-F5, m1-m12) except m10 (needs the integrator) and m3
(accepted per the review's own option). Outcomes table is at the end of that file.

Open: none for R2 to fix; R2 delta review pending. m10: expect two rewritten `sourceExtras()` returns in
`container-minigame.js` and the `lighting.js` regex entry when merging with the core stream; `routeExtra()` gained
a folder branch using `folderRouteQuery`.

Gotchas
- m3: a reopen draws cached rows until the server answers (then NO ACCESS if refused). Accepted.
- The test scenario's `minigameData.title` was removed (schema no longer allows it, m12); `scenarios/test_ops_logs/scenario.json.erb` is the scenario builder's file, one token edited.
- The viewer test's FakeEl resets `scrollTop` on `textContent =` (as a browser does) so scroll-restore is testable;
  `document.activeElement` is `globalThis.__focused`.
- `realMethod()` in the test slices real methods from `container-minigame.js` by name; a renamed method breaks it loudly.
- F1 probe and screenshots: scratchpad `l2a-client-fix/` (gen.sh, measure-old.txt, measure-new.txt, probe-new.png).
