# A2c review round 1: outcomes

Fixes in `e41dfdc64` (engine and tests) and `e29461e69` (scenario and routes). Live proofs in `proofs/A2c/`.

| Finding | Outcome |
|---|---|
| M1 credits hook closed the ringer before the conclude | Fixed. `scenario-music-events.js` closes it only in the two `result.concluded` branches (live and offline), just before `openCredits`. `ending-check.js` no longer closes for `reason: 'credits'` (confirm and held ending); `aim` and `mapping` endings still close at "End the mission now". Tests (failed first against the old code): `ending-check.test.mjs` "R1 M1" x2, including a source test that a refusal branch holds no close. Not run live: needs a scenario whose `concludeRequires` refuses. |
| M2 tests survive removal of the wirings | Two of three fixed: `phone-ring-hold.test.mjs` "what blocks ringing" (voiced, forced, person-chat, video-call mode queue; text thread and notes ring and hold) fails without the `voiced`/`disableClose` term; "real player-damage-interrupt publishes window.lastPlayerHitAt" fails without that line (both checked by mutation). The third, the `settingAside` guard, has no observable effect today (a nudge on a connecting call does nothing), so it is kept as defensive code with a comment, and the two overstated test messages were corrected (n1). |
| m1 objects on NPC tiles | Fixed: `open_case` to (5,5), guard patrol to y 8 between x 4 and 7, `Instructions` note off `cyberchef_ws`. |
| m2 `lab_ws` on `about:blank` | Fixed: `labUrl` is `/break_escape/test-assets.html`. Live: scrollY 288 before the call and after End, `src` property absolute and unchanged, no reload. |
| m3 no `minigame_completed` mapping | Added to `legacy_voiced` (`globalVars.legacy_on`). Row 15 live: route `v15`. |
| n1 | Messages fixed, see M2. |
| n2 `'video-call'` scene type | Dropped from `isConversation`; comment says a video call is a person-chat. The table test covers a video-call-mode person-chat. |
| Plan row 28 note (reviewer asked) | Still to add to the plan: a refused conclude does not close the ringer, and "End the mission now" on a credits ending does not close it either (the conclude decides). |
