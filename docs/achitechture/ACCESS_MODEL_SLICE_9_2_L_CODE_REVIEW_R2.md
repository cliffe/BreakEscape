# Slice 9.2 sub-slice L, code review round 2 (server and client)

Branch `build/9-2-l` at `cebf88fc2`, reviewed as `git diff main...build/9-2-l`, with the focus on the
round 1 fixes `cd9c13722` (server and leak scanner) and `8d5a26428` (client). Spec: plan 6.6, 9.1,
9.2 and 9.3; build log "L review round 1 outcomes"; the two round 1 reviews.

## Tests run (alone, Ruby 2.7.8 for Rails)

| File | Result |
|---|---|
| `test/controllers/break_escape/npc_lockout_l_test.rb` | 18 runs, 105 assertions, 0 failures |
| `test/unit/access_leak_scanner_test.rb` | 35 runs, 230 assertions, 0 failures (first run: 1 error, not reproduced in five reruns; likely the shared test database under another worktree's run) |
| `test/controllers/break_escape/access_model_login_test.rb` | 29 runs, 443 assertions, 0 failures |
| `test/controllers/break_escape/npc_frustration_test.rb` | 38 runs, 236 assertions, 0 failures |
| `test/js/npc-lockout.test.mjs` | 21 of 21 |
| `test/js/npc-reports.test.mjs` | 9 of 9 |
| `test/js/test-bridge-access.test.mjs` | 11 of 11 |
| `test/js/playtest-verify-run-access.test.mjs` | 14 of 14 |
| `test/js/validator-access-work.test.mjs` | 35 of 35 |

## What holds

- **`lockoutPcs` tells the browser nothing new.** `Game#lockout_pcs_for_client` (`game.rb:1628`)
  reads `loginLockouts` without writing a default, keeps the PC half of each key, and keeps only
  ids `find_login_pc` accepts (a room-level sign-in PC). The only writer of `loginLockouts` is
  `record_login_failure!` via `attempt_login!`, which runs only on a player's POST /login (at the
  keyboard or through a foothold) and answers `lockedOut: true` at that moment, so every id in the
  list is a PC where the player caused and was shown a lockout. No NPC, scenario or other route
  writes it. A trimmed non-account entry drops out of the list too. Usernames never appear; the
  M1 test checks five strings, including a key for a PC that does not exist.
- **The scanner rule for it is tight enough.** `$.lockoutPcs` is allowed only on GET /scenario and
  only as an array of strings with no `|`, each a PC the game holds a lockout at; anywhere else it
  is reported. Without a game, a key-shaped entry is still reported.
- **The hot-desk guest.** `record_borrow_done!` (`npc_frustration.rb:354`) writes no guest record for
  a borrower locked out at that PC, and the `done` answer then says `guest: false`
  (`npc_frustration.rb:429` reads the record), so the client emits no `npc_guest_left`. The claim
  refusal (`game.rb:1669`) covers a lockout caused after the `done`. Both use the same key as
  `attempt_login!`.
- **`locked_out` is work only.** `AccessWork.owned_causes` adds it only for `work`; `fail_report!`
  refuses it on any other need before `frustration_cause_holds?` (which would otherwise accept
  it, since that branch does not look at the need). Matches `npc-needs.js` (work only, station
  only).
- **The check needs a work plan.** `check_report!` refuses unless `AccessWork.work_plan?`, before
  anything is recorded.
- **The widened scanner gives no false positives on legitimate answers that I could find.** The
  only route that answers a boolean `lockedOut` is POST /login (`login_locked_out_answer`), plus the
  check answers on POST /npc_frustration; no scenario JSON or other controller carries the field.
  No route sends a `pcId|username` string: the only `#{...}|#{...}` builders in `app` and `lib` are
  the login keys themselves and the TTS cache keys, which never reach a game response.
- **The client mark.** `installNpcReports` seeds the mark in the same task as the needs install,
  after `window.gameScenario` is set (`core/game.js:2002`). A `false` answer clears it only when the
  server answered that NPC, did not refuse, and no lockout answer came at that PC since the check
  was queued; refused, lost and malformed answers keep it. `_mark` is stripped from the wire.
- **The lapse never freezes an NPC.** The skip path in `_completeJob` (`npc-needs.js:2992-3006`) ends
  the job exactly as a completed use does (`stayPut`, `s.job = null`, `_clearBackoffs`, `_goHome`)
  but restores nothing and emits no `npc_used`, so nothing can tick a task as met. A late answer
  still flags (test added).
- **H.** The owner claim and the guest claim share `account_locked_out_at?`. H's last-done-wins
  rule is kept: a locked-out borrower's `done` removes an earlier guest's record, which matches the
  client, whose `npc_sat_at` had already displaced that session.
- **Tests fail without each fix (by reading).** m1 (borrow): `assert_nil guestSessions.hot_desk`
  fails; m1 (claim): 422 becomes 200; m2: the social `locked_out` fail is answered rather than refused
  (cause and record both hold) and the social ease is refused; m3: Nell's check is answered `lockedOut: true` and recorded; n3: the
  record-outlives test relies on `lockout_recorded?` re-reading `loginLockouts`; n4: the stored
  `leo_pc` and `7` come back; M1: no `lockoutPcs` key. Client: the seed test, the "no clears the
  mark" test, the keep-the-mark tests and the three-layer order test each assert behaviour that is
  absent without its line.

## Blocker

None.

## Major

None.

## Minor

**m1. A borrower locked out at the hot desk still works there; the README reads as if the lockout
stopped them.**
`npc-needs.js` (the `locked_out` branch in `_completeJob`, station only, "never at a borrowed PC"),
`npc_frustration.rb:354`, `README_scenario_design.md:1089`.

Failure scenario: an author puts the hot desk under `strict` to let the player finish the denial of
service. The player locks out `jbrooks` at `jake_pc`, then at `hot_desk_2`. Jake borrows the hot
desk anyway: `npc_sat_at`, a met verdict, the server eases his frustration, and the hot-desk screen
shows him seated and signed in while he uses it. Only the session he would leave behind is denied.
The README's "(unless they are locked out there too, when they leave no session open)" is true but
suggests the lockout matters there, and the author's beat ("lock him out everywhere and he gives
up") silently never happens. Not a security issue: nothing is revealed and nothing can be claimed.

Fix (smallest): say so in plan 6.6 and the README: "A lockout at a borrowed PC stops only the
session left open there; the borrower still works at it (a later slice may make it a failure)."
Optionally a validator warning when a `borrow_session` PC is under a policy with `maxAttempts`.
The full fix (a borrowed use that fails `locked_out`) needs the client to learn the lockout at the
hot desk, which is a new check route and a new decision 14 exposure; not for this round.

**m2. The wait has no end only because the report queue's request has no timeout; bound the
request rather than the wait.**
`npc-reports.js:150` (`await this.deps.send(...)`, a plain `fetch` in `api-client.js:32` with no
abort), `npc-needs.js:2992-3006`.

On the question asked: skipping the use and waiting again is the right shape. It keeps plan 6.6's
"never one use through as met", it cannot freeze the NPC, and retrying or giving up inside the
needs system would not help. A retry just queues behind the same hung request, because `flush`
sends one batch at a time (`sending` stays true). Giving up means inventing an answer. The gap is
upstream. A request that never settles (a half-open connection after a laptop sleeps or the wifi
changes, or a server that accepts and stalls) holds `sending` true, so every NPC's fails and eases
stop reaching the server. That part predates L. With L, the checked owner also sits at the desk
taking a skipped use about every 35 s with no mutter, no frustration and no hot-desking, so a
lockout chain the player started does nothing, with no sign why, until the connection errors or the
page reloads.

Failure scenario: a student's laptop sleeps between Jake's locked return and the answer; on wake
the TCP connection is half-open and Chrome waits on it. Jake never fails, the frustration icons of
every NPC stop moving, and the student concludes the lockout did not work.

Fix: time the send out in `NpcReports.flush` (a `Promise.race` with `deps.setTimer`, about 20 s) and
treat a timeout as a lost request. The existing rules then apply unchanged: a lost check is sent
once more, then answered "no" (the mark is kept, so the next locked return checks again, and a
check that did reach the server has recorded its yes for the reload). A lost fail or ease loses
one step, as documented. Add one test: a `send` that never resolves gives the needs system a check
answer within two timeouts and the queue sends the next batch. If this is out of L's scope, add a
line to plan 6.6 saying the wait is bounded by the request, not by the needs clock.

## Nit

**n1. A "no" clears the mark for the PC, not for the owner.** `npc-reports.js:181`. Two NPCs can
share an unowned `needsHome` sign-in PC (`lockout_station?` accepts any NPC when `screenOwner` is
absent; the validator does not forbid it; no current scenario does it). Owner A's "no" clears the
mark, so owner B, whose username is the one locked out, is not checked until a reload or a new
lockout answer. Fix: remember the "no" per `pcId|ownerId` and skip the check only for that owner;
or have the validator warn on a shared sign-in `needsHome`.

**n2. The guest-lockout refusal leaves the record in place.** `game.rb:1669`. The timed-out branch
just below ends the guest session (review R2 n3, so verify-run reads no stale guest); the lockout
branch returns first and keeps `guestSessions[pc]`, which can never be claimed again. Fix:
`end_guest_session_at!(pc['id']); save!` before that refusal, as the timeout branch does.

**n3. The lockout key rule reads values only, and checks against the end-of-run state.**
`access_leak_scanner.rb:513-521` (`each_string` does not visit hash keys), `:703`, `:661`. A key such
as `"jake_pc|jbrooks"` used as a hash key under another name (`{ "attempts": { "jake_pc|jbrooks": 2 } }`)
is not reported, which was half of R1 m4's case (b). Separately, `lockout_pc_ids` and
`lockout_key_strings` come from the game at scan time, so a response that listed a PC before the
player locked it out passes if the lockout came later in the run. Fix: also test hash keys against
the key strings; note the second limit in the header comment.

**n4. A blank username makes a short key.** `normalise_username('')` is `''`, and the controller
accepts a blank username, so a scripted run can record `"jake_pc|"` in `loginFailures`; the rule
then reports any string containing `jake_pc|`. No such string exists today. Fix: skip keys whose
username part is empty, or refuse a blank username in `attempt_login!` (it can never match).

**n5. The guest claim is a third route to the same answer.** The refusal at `game.rb:1669` tells a
player who locked out a guessed username at the hot desk whether it was the guest's. It is moot
(a successful guest claim names the guest's username anyway), but plan 9.3's residual list names
only the check and the owner claim. One line there.

## Verdict

No blockers or majors. Each round 1 fix is in, is correct and has a test that fails without it.
`lockoutPcs` carries only PC ids where the player caused and was shown a lockout, and the scanner
allows nothing more. The guest path, the work-only cause and the work-plan check are each one
refusal in the right place. The widened scanner raised no false positives on any legitimate
answer I could find. The builder's lapse choice is acceptable. Bound the request (m2) rather than
the wait, in this sub-slice or recorded as a known gap in plan 6.6. m1 is a wording fix. The nits
can go with them or later. Ready to merge once m1 and m2 are fixed or explicitly deferred.
