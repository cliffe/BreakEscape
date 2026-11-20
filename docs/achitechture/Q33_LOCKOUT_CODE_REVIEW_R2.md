# q33 lockout: code review round 2

Branch `build/q33-lockout` at 43aff000b, reviewed as `git diff main...build/q33-lockout` (merge base fea96124c). Fresh read: no earlier review file was opened.

Counts: 0 blockers, 0 majors, 5 minors, 5 nits.

## What holds

- Server authority on `POST /feed_post`. A forged `object_id` (another NPC's station, an unhanded hot desk, an object in a room not in `unlockedRooms`, `""`) is refused because `frustration_places` holds only the NPC's own station, non-desk sources and handed-over borrow PCs in opened rooms. A wrong type (number, object, array, `true`, `false`) becomes `false` in the controller and is refused. An omitted or null `object_id` is the phone, refused for `"phone": false`. A sign-in PC where `loginLockouts` holds the NPC's username is refused, and nothing is written for any refusal.
- `PUT /sync_state` writes only `currentRoom`, `unlockedRooms`, `notes`, `scenarioBriefShown` and the grow-only sections. It never touches `loginLockouts`, `npcFrustration` or `feedRevealed`, so a sync cannot clear a lockout. `reset_player_state!` clears lockouts and frustration together.
- Discovery (9.2 L): a social_media fail naming `locked_out` is refused until a `check` has recorded the lockout, and an ease at the station is refused only once it is recorded (`owned_causes` reads the record). At the station a feed refusal says no more than a `check` would answer, since `check_report!` answers the same question under the same room gate.
- Frustration: a phone NPC never fails social_media (`can_fail?` is false), and its use that reaches a flagged station is dropped unjudged with no report. A `"phone": false` NPC with a non-desk source passes the station over. With no other source, the attempt fails with `locked_out` and counts.
- Honest client: `npc_used` carries `objectId` (npc-needs.js:3165), `npc_used_phone` sends null, retries keep the source, and a `refused` answer carries no `retryAfter`, so it is not asked again.

## Validator, all test_access_* and lab_* scenarios

Branch compared with extracted copies of the merge base and of main (17b9ff236), using `LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb <file> --no-graph`. Door alignment, sprite-sheet and UNMODELLED lines differ only because those checks could not run in the extracted copies, so they are left out of the comparison below.

| Scenario | ❌ branch / base | ⚠️ branch / base (like for like) |
|---|---|---|
| test_access_doors, habits, networks, sessions, signin, work | 0 / 0 | same lines |
| test_access_social | 0 / 0 | +1: `priya_pc` under maxAttempts 3 (the new F9 beat, expected) |
| lab_exploitation | 13 / 13 | same |
| lab_feeling_blu | 10 / 10 | same |
| lab_post_exploitation | 12 / 12 | same |
| lab_vulnerabilities | 3 / 3 | same |
| lab_vulnerability_analysis | 9 / 9 | same |
| lab_malware_metasploit | 1 / 1 | same |
| the other six labs | 0 / 0 | same |

No new error lines, and no false positives from the two new warnings (the station_fail lockout warning and the hot desk partial-needs warning fire nowhere).

## Tests run

- `test/controllers/break_escape/social_lockout_q33_test.rb`: 11 runs, 62 assertions, 0 failures
- `test/controllers/break_escape/npc_lockout_l_test.rb`: 18 runs, 106 assertions, 0 failures
- `test/controllers/break_escape/feed_post_test.rb`: 15 runs, 139 assertions, 0 failures
- `test/controllers/break_escape/access_model_no_password_test.rb`: 15 runs, 606 assertions, 0 failures
- `test/unit/access_leak_scanner_feed_test.rb`: 21 runs, 58 assertions, 0 failures
- `bin/test-js` on the q33, social-feed, npc-reports, lockout and validator-social/access files: 187 files passed, 0 failed (validator-access-social 17 pass, validator-access-work 36 pass, none skipped)

## Minors

**m1. An ease at a locked-out borrowed PC is accepted while the post there is refused.** `app/models/break_escape/npc_frustration.rb:611-617` accepts an ease at any handed-over borrow PC; only the station is checked against `owned_causes`. `app/models/break_escape/social_feed.rb:103-108` refuses the feed post at the same PC when the NPC's username is locked out there. The server is therefore of two minds about one use: the frustration falls while the post is withheld. This conflicts with q33's "a lockout stops every use of that PC".
Fix: in `ease_report!`, for `need == 'social_media'`, return `refused` when `object_id` is in `handed_borrow_pcs(npc, need)`, is a sign-in PC, and `AccessWork.locked_out_at?(npc, pc, lockout_keys)` holds. Leave work at a borrowed PC as sub-slice L documents. Add a test beside "R1 m4: a borrowed PC posts only once handed over" that the ease there is refused once the lockout stands.

**m2. At a borrowed PC the feed answers a lockout question that `check` never answers, and the docstring says otherwise.** `social_feed.rb:31` says the refusal "says no more than a `check` answer would". `check_report!` (`npc_frustration.rb:651`) answers only for the NPC's own station. A tampered client can send `feed_post` with `object_id` set to a handed-over hot desk and learn whether that NPC's username is locked out there. The refusal at `social_feed.rb:44` comes before the pace floor, so the probe costs nothing: no post is spent and the answer is `refused` against `tooSoon`. What leaks is the link between a username the player locked out and an NPC.
Fix: move the `feed_source_ok?` line below the pace-floor block (`social_feed.rb:47` onward), so that a probe inside the floor gets `tooSoon` and a probe outside it spends a post when the PC is not locked. Then correct the docstring to name the borrowed-PC case, and list it in plan 9.3's residuals next to the backlog entry for the client-side gap. Add a test that a refused source inside the pace floor answers `tooSoon`.

**m3. The source check stops at lockouts.** `social_feed.rb:103-108` accepts the NPC's station as a feed source when its policy sets `social: "blocked"` or its `offWhen` holds. No honest client ever posts from there: the use is the failing attempt (README "5, its own workstation under social: blocked"). A tampered client can post a `"phone": false` NPC's feed from the blocked station. This gap predates q33, but q33 is the change that makes the endpoint judge the source, so it should cover every station cause the server owns.
Fix: in `feed_source_ok?`, when `source` is the station, also refuse when `AccessWork.social_blocked?(scenario_data, npc)` holds or `frustration_cause_holds?(npc, 'social_media', { 'id' => source, 'why' => 'off' })` holds. Add two cases to the "tampered client" test.

**m4. A station the NPC does not own can stall its feed in silence.** `feed_source_ok?` refuses any sign-in PC where the NPC's username is locked out. `check_report!` refuses unless `lockout_station?`, which is false when `screenOwner` names someone else (`lib/break_escape/access_work.rb:522-532`). An NPC whose `needsHome` is a PC owned by another NPC, where the player locked out its username, never learns of the lockout. It keeps sitting there for social media, and every post is refused for the rest of the mission. None of the current scenarios has this shape (screenOwner is used four times, none on a feed NPC's needsHome), so it is latent.
Fix: either add a validator warning (a feed NPC whose `needsHome` has a different `screenOwner` under a policy with `maxAttempts`), or in `feed_source_ok?` apply the lockout to the station only when `AccessWork.lockout_station?` holds, which keeps the server in step with what the honest client can learn.

**m5. One lockout counts twice for an NPC with both a work plan and a `"phone": false` social need (question for the user).** `npc_frustration.rb:601` keeps `failAt` per need, so a lockout at the shared station brings in a work fail and a social_media fail, each on its own park floor. The level climbs about twice as fast as for a work-only owner, and workarounds arrive sooner. `off` already behaved like this before q33, so this may be intended.
Fix, if not intended: in `fail_too_soon?`, when every cause in `missing` is `locked_out`, use the latest `failAt` of either `LOCKOUT_NEEDS` need as `last`. Otherwise, add one sentence to README "Lockout as a cause" saying that each need counts.

## Nits

**n1.** `scripts/validate_access_work.rb:670` adds "and its feed post is refused" whenever social_media is lacking, even for an NPC with no feed. Guard the suffix with `AW.feeds?(npc)`.

**n2.** `scripts/validate_access_work.rb:658` falls back to every need the NPC has when none can fail. The new warning at 667-671 then says "which X can also fail" about needs that cannot. Compute `have`/`lacking` from the `can_fail?` list only, and skip the warning when that list is empty.

**n3.** No warning covers the lockout version of the Review C R1 M2 case (`validate_access_work.rb:1138`): `"phone": false`, the own station is the only source, it is a `lockout_station?`, and there is no `borrow_session`. Once the player locks the owner out, the need is never met again. A lockout is the player's doing, so a suggestion-level line ("after a lockout the need is never met; a borrow_session gives the owner somewhere to go") is enough.

**n4.** Test gaps: no test that a refused source and the pace floor interact as intended (see m2), and none that an ease at a locked-out borrowed PC is refused (see m1). `test/js/npc-social-lockout-q33.test.mjs` could also assert that the dropped use at the station sends no `ease` report.

**n5.** A browser still running pre-q33 JS sends no `object_id`, so every post by a `"phone": false` NPC is refused (treated as the phone) until the page reloads. Only `test_access_social` has such an NPC, so no change is needed. A line in the build log's upgrade notes would save a confused playtest.
