# Access model slice 9.2, sub-slice H: code review round 1, server

Branch `build/9-2-h` at `ccc465f7d`, reviewed against `main` (`git diff main...build/9-2-h`).
Scope: controllers, models, `lib/`, validator scripts, the leak scanner and `verify-run`, Ruby
tests and `scenarios/test_access_work`. Read against plan sections 6.4, 6.5, 9 and 12 "Sub-slice H",
and the H sections of the build log.

## What was run

Ruby 2.7.8, single files, no lock:

| File | Result |
|---|---|
| `test/controllers/break_escape/npc_workaround_h_test.rb` | 18 runs, 130 assertions, 0 failures |
| `test/controllers/break_escape/npc_workaround_test.rb` | 29 runs, 180 assertions, 0 failures |
| `test/controllers/break_escape/npc_frustration_test.rb` | 38 runs, 236 assertions, 0 failures |
| `test/controllers/break_escape/capture_proofs_test.rb` | 26 runs, 151 assertions, 0 failures |
| `test/controllers/break_escape/capture_secret_endpoint_test.rb` | 3 runs, 7 assertions, 0 failures |
| `test/unit/access_leak_scanner_test.rb` | 28 runs, 214 assertions, 0 failures |

`ruby -wc` under 2.7.8 on every changed Ruby file: clean (one old unused-variable warning in
`games_controller.rb:2683`, not from this branch). Nothing newer than 2.7 is used (`filter_map`
is 2.7; `Hash#except` comes from ActiveSupport). The validator on `test_access_work` gives the same
warnings as after B, plus the three H workaround info lines.

## What holds

- A guest record is written only by a spent "done" for a borrow the server handed over, after the
  borrowed PC's use time less 3 s (`npc_frustration.rb:297`). A forged hand, a spent hand or a hand
  not yet made is a 403; an early one a 425. The claim (`game.rb:1608`) runs plan 9.1's checks 1
  to 7 in order, and every refusal is "Sign in required".
- A careful guest is read with no PC field on the saved, expanded record, so no habit is careful;
  `leavesOpen: false` rides in `run` and in `pending` alike, and its "done" writes no guest record.
- A heard share counts only for `heard` true or `"true"`, and a `room_id` that is the colleague's
  room or one of its `needsRooms` and is open; `currentRoom` is never read. The answer is composed
  from the scenario, and a resend is answered from `lastSpent.heard`, so an unheard hand cannot be
  turned heard by resending.
- `/capture_secrets` serves the sharer only after a heard "done", with E4's proof rule in force.
  The H test proves this: removing either `shared ||` in `account_capture_passwords` or the
  `declared |=` line fails it.
- `guestSessions` is cleared on `GET /scenario` under the row lock, after claims; `sharedLogins`,
  `turn` and `lastSpent` survive a reload; neither new key is in `preserved_keys`, and every reader
  treats a missing key as empty. `sync_state` cannot write either key.
- Turn order, "handed and waiting is not handed again" and "never settled with a repeating
  workaround" are each tested so that dropping the code fails the test.

On the accepted residual (build log, "Observations"): **it holds as a floor.** An owner claim
(`game.rb:1572`) needs no server evidence at all that the owner is away; it trusts the client's
globals and only logs them. A guest claim needs a server-side record of a borrow the server handed
over and timed. So a guest record that outlives the client's auto lock until the next reload is no
weaker than an owner claim. The server could do better cheaply, though (m1).

## Blocker

None.

## Major

### M1. Signing out of a guest session does not end it, and a password sign-in at the hot desk does not either

`game.rb:1646` (`logout_session!`) and `game.rb:2057` (`start_login_session!`) never touch
`guestSessions`; the only places that clear it are `GET /scenario` (`npc_frustration.rb:218`) and
the next borrow's "done" (`npc_frustration.rb:305`).

Failure: Ian borrows the hot desk and leaves it open. The player claims his session, reads
`Cabinet.txt` and presses Sign out to be tidy. `POST /logout` removes `sessions.hot_desk`, but
`guestSessions.hot_desk` still says `ian`. The next click at the hot desk is a guest claim again and
the server grants it, until the auto lock or a reload. This happens with an honest client too:
`workstation-state.js` keeps its `guests` entry on `pc_signed_out` (it has no listener for it), so
the click is routed to a claim. Worse, while that record lasts the player cannot reach the sign-in
screen at the hot desk at all, so H4's step (sign in as Sam at the hot desk with the overheard
password) works only when no guest record is there. This is not the "one screen holds one session"
rule that plan 6.4 argues for, and for a student it teaches that signing out does not sign out.

Plan 6.4 lists three end events (auto lock, the next person to sit, reload) and does not name the
player's own sign-out, so this is partly a plan gap; the orchestrator may want to record a
decision.

Fix: in `logout_session!`, delete `guestSessions[key]` when the session being ended was a claim
(`via: "claim"`) at that PC; in `start_login_session!`, delete `guestSessions[pc_id]` for any
session that is not the guest claim itself (password, owner claim, remote). The client mirrors this:
`workstation-state.js` drops `guests[pcId]` on `pc_signed_out` for that PC. Tests: claim, logout,
claim again is 422; a password sign-in then logout, then a guest claim is 422.

## Minor

### m1. The server has what it needs to time a guest out itself, and does not

`npc_frustration.rb:305` (`record_borrow_done!`) and `game.rb:1608` (`claim_guest_session!`).

The server knows the moment it records the "done" (server time) and the hot desk's
`effective_policy(pc)['autoLockMin']`. Unlike an owner's leave, which the server never sees, a
guest's leave is a server event. Today a tampered client (or a second tab) can claim the guest
session at any time until the next `GET /scenario`, for example half an hour after the screen
locked in the honest page.

Fix: keep the done time beside the record (a parallel `guestSessionsAt: { pcId: time }` keeps plan
9.4's `{ pcId: npcId }` shape), and refuse the claim once `autoLockMin x 60` seconds of server time
have passed since the done, less the usual 3 s allowance in the client's favour. Test with
`travel_to`. This is a choice for the orchestrator: the build log took the plan's line, and the
plan has no server lock time for guests.

### m2. The remote screen's "Captured sign-ins" list ignores a heard share

`network_access.rb:563` (`account_capture_usernames`) uses `declared_capture_target_ids` alone,
while `capture_secrets_for_client` adds `sharedLogins` at `game.rb:977`. The comment at
`game.rb:1013` says both readers inherit the account pass, which is true for the password map but
not for the declared set.

Failure: in a scenario with networks, Sam (no `addCapture`, no `usePayload`) shares his login and
the player hears it. `/capture_secrets` serves `secrets.sam` (with `revealSecret` on), but
`accounts` has no `sam`, so the remote sign-in screen does not list `sokafor` under Captured
sign-ins, though the player holds the capture.

Fix: fold `sharedLogins` into `declared_capture_target_ids` (`capture_proofs.rb:109`) and drop the
local union at `game.rb:977`, so both readers use one set. Test: `GET /capture_secrets` in a
network fixture after a heard share lists `accounts.sam`.

### m3. The capture's note carries the password, so the `revealSecret` gate does nothing for a share

`npc_frustration.rb:371` (`shared_login_body`) puts the same `note` (with `username / password`) in
`capture.note`. The client records it through `recordSECapture`, which stores `note` in the
`se_captures` global (`captures.js:57`). From there the password is in every later `PUT
/sync_state`, in `globalVariables` of every `GET /scenario`, and in the capture log row
(`capture-rows.js:49`), whatever `social.captures.revealSecret` says. Plan 6.5 says the terminal
shows the password "where `social.captures.revealSecret` is on, through `/capture_secrets`"; the
`/capture_secrets` route was built for exactly this, so the secret is not stored in `se_captures`.
The leak scanner was widened to allow it (`access_leak_scanner.rb`, `.se_captures`), which hides
the effect in runs.

The plan's own example note ("... his login out loud: jbrooks / ...") is ambiguous, so this needs a
decision rather than a straight fix.

Fix (suggested): `capture.note` without the password ("Sam Okafor told Ruth Adeyemi their login out
loud"); the evidence note (`note`) and `line` keep it, since those are the player's own notes. Then
drop the scanner's `.se_captures` allowance, so a regression shows up again.

### m4. A share can be claimed heard in a never-locked room the player cannot have reached

`npc_frustration.rb:318` (`share_heard_in?`): "open to the player" is `locked != true ||
room_unlocked?`. A never-locked room behind a locked one passes before the player has opened the
way in. Plan 9.1 check 5 says exactly this, so it is to the plan, but it is wider than needed.

Failure: Ruth's room is not locked and sits behind a locked vault; Sam's room is the open office. A
tampered client claims a heard share with `room_id` set to Ruth's room and reads Sam's login, though
the player has never been near Ruth's room.

Fix: also require the colleague (`with`) in `encounteredNPCs`. An honest client always meets it,
since the visit needs the colleague's sprite, so the room has loaded. Test: the colleague not
encountered is taken as not heard.

### m5. Test gaps

`test/controllers/break_escape/npc_workaround_h_test.rb`. None of these would fail if the code
they cover were removed:

- the guest claim's foothold refusal and headless refusal (`game.rb:1616`, `:1620`);
- a `dropped` borrow writes no guest record and leaves a held session alone (the early return in
  `complete_npc_workaround!` is right, but unpinned);
- `handed_borrow_pcs`' need filter (a borrowed PC that satisfies `work` is not a place for
  `social_media`);
- `accounts` in `/capture_secrets` after a heard share (m2);
- the no-exposure test after a heard share checks three routes by hand. Plan 9.2 asks for "every
  route", including the `/npc_frustration` answers and `pending` in `GET /scenario` after the
  share, and a run where `se_captures` was synced (m3) is not covered.

## Nit

- **n1.** `npc_frustration.rb:278` resolves the borrow PC through `find_login_pc` (id or name),
  but `record_borrow_done!` (`:305`), `borrow_dwell` (`:297`) and `handed_borrow_pcs` (`:237`) use
  the raw `w['pc']`. A PC named by its `name` would be performable, but its guest record would be
  keyed by the name and never found by the claim, which looks up `pc['id']`. The validator errors on
  an unknown id, so this is defensive only: store `find_login_pc(w['pc'])[:object]['id']`.
- **n2.** Two borrowers at one hot desk (Ian and Rosa in `test_access_work`): if Ian's "done" is
  lost and resent after Rosa's lands, the server's guest is Ian while the client shows Rosa, and the
  claim opens Ian's desktop. Rare (needs a lost request). Keep the record with the later leave, for
  example by not overwriting a guest record written after this hand-over was made.
- **n3.** `AccessWork.use_floor` (`access_work.rb:445`) still takes `u` from `AccessWork.places`,
  without the handed-over hot desk, while plan 9.1 says `u` is the shortest over the NPC's places,
  which now include it. The floor is stricter, not looser, and honest eases are spaced by the need's
  period, so nothing is refused in practice. Either include it or say in a comment that it is
  left out on purpose.
- **n4.** `end_guest_sessions!` (`npc_frustration.rb:218`) checks the in-memory copy before taking
  the lock, as `end_claimed_sessions!` does, so a "done" committed between the load and the check is
  not cleared on that reload. Same pattern as the claims; the next reload clears it.

## Verdict

No blocker. The authority model is sound and the "same trust as owner-away" acceptance holds: a
guest claim needs a server-timed borrow, which is more than an owner claim needs. M1 should be fixed
(or recorded as a decision) before merge, because it shows up in honest play: a signed-out
guest session comes back, and the hot desk's sign-in screen is unreachable while it lasts. m2 and m3
are small and worth doing in this round; m1 and m4 are tightenings for the orchestrator to accept
or decline. Ready to merge once M1 is resolved and m2, m3 and the m5 test gaps are addressed or
declined in the log.
