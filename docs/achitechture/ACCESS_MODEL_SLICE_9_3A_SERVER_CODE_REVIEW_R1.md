# Access model slice 9.3a (networks): server code review, round 1

Scope: the server side of steps 1 to 4, commits `eab97afaa` (step 1), `f01172778` (step 2),
`6a319d68a` (step 3) and `9904e0746` (step 4) on `claude/break-escape-access-design-090sjx`,
reviewed against `docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md` sections 3 to 9 as committed.
At review time the working tree held no change to the 9.3 plan (only the 9.1 plan was modified), so
there is no difference between the committed plan and a revision in progress to report.

Method: read the four diffs and the code they call into; ran the network tests (80 runs, green) and
the whole Rails suite (1179 runs, 0 failures, 1 skip); wrote throwaway probe tests in the scratchpad
(not in the repo) for every route the brief lists.

## Counts

| Severity | Count | Notes |
|---|---|---|
| Blocker | 1 | Pre-existing, not introduced by these commits, but on a route the brief lists and it voids the slice's password gate |
| Major | 2 | Both test quality: the tests would not catch a regression in a secrecy check and in the lock list |
| Minor | 9 | Five code, four test |

Verdict on secrecy, apart from B1: no route I tried leaks a network name, a link name, a resource's
name, host, observations or contents, a headless host's desktop, or a password to a browser with no
foothold and no session. The refusal bodies for a share id on `GET /container`, `POST /unlock` and
`POST /inventory` match an invented id's, including with a PIN cracker held (no `feedback`).

## Blocker

### B1. A forged capture entry makes `GET /capture_secrets` serve an account password (pre-existing)

- Where: `app/models/break_escape/game.rb:915-956` (`capture_secrets_for_client`, the
  `by_username` pass at `:954` and the single-secret fallback), fed by `se_captures` in
  `globalVariables`, which `PUT /sync_state` writes with no check (`game.rb:279-297`,
  `merge_global_variables!`; reached from `games_controller.rb:1657-1658`).
- Failure: a browser with no foothold, no session and no phish sends
  `PUT /sync_state { globalVariables: { se_captures: { x: { kind: "credential", address: "lfox" } } } }`,
  then `GET /capture_secrets` answers `{"secrets":{"x":"Fox-Ledger-8812"}}`: Lena's password,
  verified with the network fixture. Any other address gets the landing-page secret through the
  single-secret fallback. In a scenario with `revealSecret: true` and an account holder with a
  capture route, the password check that section 4.7 calls the gate of every chain ("ends ... in a
  password the server compares") is gone: remote sign-in turns that password into every host on
  the network that admits the account, from the drop box, with no keyboard visit.
- Not introduced here: the method and the write path are unchanged by the four commits. It is
  reported because the brief asks whether any password can reach a browser through
  `/capture_secrets`, and because this slice raises the stakes.
- Fix: stop trusting client writes to `se_captures`. Either make it a server-owned key in
  `merge_global_variables!` (ignored like an imported global) and record a capture through a route
  that checks the landing page and the target, or land the engine feedback plan's capture proofs
  before any networked scenario uses `revealSecret` with account-holder capture routes. Add a test
  to `capture_secret_endpoint_test.rb`: a `se_captures` entry written through `PUT /sync_state`
  with no phish earns no secret.
- The `accounts` map shares the root cause (m1).

## Majors

### M1. The claim-over-the-network and headless-claim tests cannot fail

- Where: `test/controllers/break_escape/network_remote_signin_test.rb:114-124` ("a claim with a
  foothold is refused, owner or invented") and `:126-140` (the headless claim); fixture
  `test/support/network_model_scenario.rb` (no `screenOwner`, no `needsHome`, no NPC with tracked
  needs).
- Failure: every claim in the fixture is refused with "Sign in required" for "no owner" before the
  foothold or headless check matters. Deleting the foothold refusal in the controller
  (`games_controller.rb:1102`) and in `claim_login_session!` (`game.rb:1493`), or the headless
  refusal (`game.rb:1497`), leaves the suite green. A probe with an owner (Sam with tracked needs,
  `screenOwner: "sam"` on `sam_pc`, `locksScreenOnLeave: false`) shows the claim succeeds with no
  foothold, so the property is real and unguarded. A regression here hands a password-free desktop
  over the network, which is a secrecy property.
- Fix: give the fixture one owned PC on `office_lan` (and an owned headless variant, or a scenario
  tweak in the test). Assert the claim succeeds with no foothold (the control), is refused with a
  foothold, and is refused on the headless host with its room open; assert no session is written.

### M2. Nothing guards the lock on `container`, `network_plant` and `network_unplug`

- Where: `games_controller.rb:89-90` (the `with_game_lock` list) and the new comment above
  `container` ("MUST STAY LOCKED"); `test/controllers/break_escape/game_state_locking_test.rb:25-43`
  (`STATE_WRITERS`) and `:76-99`.
- Failure: the locking test finds writers by scanning each action's body for `@game.<writer>`.
  `plant_device!`, `unplug_device!` and `settle_session_at_keyboard!` are not in `STATE_WRITERS`, and
  the container's write sits in the private `render_login_desktop`. Removing `:container`,
  `:network_plant` or `:network_unplug` from the list passes the whole suite. Without the lock, a
  keyboard desktop fetch that clears a session's `foothold` can race an unplug of that foothold:
  each loads `player_state`, and the later save writes back either the session with its gone
  foothold or a duplicated device. The step 4 "concurrent" test
  (`network_remote_signin_test.rb:229-242`) runs the two requests one after the other, so it cannot
  see this.
- Fix: add the three writers (and `attempt_login!`, `claim_login_session!`) to `STATE_WRITERS`, and
  add a named guard beside "inventory and room are locked" for `container`, `network_plant` and
  `network_unplug`, saying why each writes.

## Minors

### m1. `accounts` is a free username oracle (same root as B1)

- Where: `app/models/break_escape/network_access.rb:540-556`; `games_controller.rb:1217`.
- Failure: a forged `se_captures` entry, written as in B1, comes back in `accounts` exactly when its
  address is the username of an account holder with a capture route, with `revealSecret` off too.
  The first slice made an unknown username and a wrong password answer alike; this lets a browser
  test usernames at no cost and with no attempt counted, then guess passwords on the remote screen.
  It reveals no password, so minor.
- Fix: the B1 fix covers it. Until then, say in the plan (4.4) that `accounts` is only as good as
  `se_captures`.

### m2. A sign-in object inside a share answers 403, not the invented-id 404

- Where: `games_controller.rb:539-540`, before the resource branch at `:541`; `render_login_desktop`
  at `:1935-1938`.
- Failure: a `lockType: "login"` object in a resource's `contents` matches the sign-in branch first.
  `find_login_pc` refuses it (its scope is not nil), and the answer is 403
  `{"error":"PC not reachable: share_vm","reason":"unreachable"}` where an invented id gets 404
  (probe). A browser with no foothold can tell that the id exists. Needs an author to put a sign-in
  object in a share, which nothing forbids yet.
- Fix: test the resource scope before the sign-in branch (or skip the sign-in branch when
  `located[:scope]` is a resource), and have step 5's validator refuse `lockType: "login"` in a
  resource's contents.

### m3. A keyboard fetch makes a remote session local without telling the client

- Where: `network_access.rb:395-401`, called at `games_controller.rb:1948`.
- Failure: the server clears `foothold`, but the desktop answer does not say so. The client's
  `pcSessions` copy keeps `remote: true` and `footholdId` until a reload. Any client code that
  decides from its own copy (closing desktops "through" a foothold on unplug, the capture log's
  session list, the view's row) disagrees with the server. Any client path that refetches a remote
  desktop without `foothold` (a reader closing, a refresh) silently moves the session to the
  keyboard, and the next unplug no longer ends it.
- Fix: add the session summary (`remote`, `footholdId`) to the desktop answer, or a `settled: true`
  flag; tell the step 8 builder that every remote refetch must carry `foothold` and that the client
  must take `endedPcIds` as the truth.

### m4. `hide_planted_devices!` edits `player_state` in place

- Where: `network_access.rb:152-158`, over `room['objects']` that `apply_room_state_changes!`
  filled with references from `objects_added` (`game.rb:1038`, a `concat` with no copy).
- Failure: a planted device inside a container that sits in `objects_added` is removed from the
  stored `objects_added` entry, and a locked action that saves afterwards (`room` is locked and may
  save) persists the removal. The filter step after it has the same habit already, so this widens
  an existing hazard rather than opening one.
- Fix: `deep_dup` `objects_added` in `apply_room_state_changes!` as `npcs_added` is (`game.rb`, the
  comment there says why), or filter into new arrays.

### m5. A task on a jack whose network is undefined falls back to `unlockedObjects`

- Where: `game.rb:2545-2550` (`complete_task!`), `network_access.rb:95-103` (`find_jack` returns nil
  when the network is not defined).
- Failure: for such a jack the task branch falls through to `object_unlocked?`, which a
  `POST /unlock` with `method: "unlocked"` on the (unlocked) jack satisfies, so the "must not be
  skippable" task completes with no plant. Needs a malformed scenario that step 5 will refuse.
- Fix: decide the branch with `NetworkModel.jack?` on the found object, whatever its network, and
  refuse until `gainedFootholds` holds it.

### m6. The planted-device check on an add matches a client hash by type alone

- Where: `games_controller.rb:1017`, through `ItemIdentity.held_in?`'s last branch.
- Failure: an add whose client hash has no `id` and no `name` and the device's `type` is refused as
  "already in use" while any device is planted. Every scenario item has a stamped id, so this hits
  only client-built items (a notepad, a decor cup) of a type a rogue device shares. Unlikely.
- Fix: check the item the add resolves to (after `validate_item_collectible`) against the
  footholds, or require an id or name before matching.

### m7. Test: no test that a resource with no `network` is never reached or listed

- Where: `resource_admits_player?` (`network_access.rb:419-420`) has the guard; no controller test
  covers it.
- Fix: add one resource with no `network` and an open access list; assert 404 from
  `GET /container` with a foothold and a session held, and no row in `GET /network`.

### m8. Test: the no-exposure test reads `/capture_secrets` only with no captures

- Where: `network_no_exposure_test.rb:31-33`.
- Failure: with an empty `se_captures` the route cannot leak anything, so the test cannot catch B1,
  m1 or a later change that adds a network string to the answer.
- Fix: add a forged entry (through `PUT /sync_state`) and assert no password and no exposed string;
  it will fail until B1 is fixed, which is the point.

### m9. Test: tests pin the jsonb key order

- Where: `network_shares_test.rb:80` (`%w[lena_local scanned_inbox ledger_archive]`),
  `network_remote_signin_test.rb:151` (`%w[door_codes scanned_inbox]`) and the view test at
  `network_footholds_test.rb:250-257`, which compares against the model's own order rather than a
  written one.
- Failure: the expected order is jsonb's (shorter keys first), which no author can predict; a sort
  (D3) will break them, and the view test would pass whatever order the model chose.
- Fix: with the sort in place, write the expected order out in each test.

## The builder's stated deviations

D1. **`accounts` only when the scenario defines networks** (`games_controller.rb:1217`). Agreed.
The remote screen is the only reader, it narrows the oracle (m1) to networked scenarios, and the
first slice's exact answers stay unchanged. The plan (5, `GET /capture_secrets`) should say so,
and the step 8 client must read a missing `accounts` as `{}`.

D2. **`remote`, `footholdId` and `host` only on remote sessions** (`game.rb:1937-1948`). Acceptable:
it keeps the first slice's exact local answers and tests. Two follow-ups: the plan (4.4) reads as
if every entry gains `remote`, so amend it to "absent means local"; and `GET /network`'s
`session` object always carries `remote` (`network_access.rb:335-336`), so the two shapes differ.
Pick one: either document both, or add `remote: false` nowhere and drop it from the view's local
rows too. See also m3.

D3. **Order follows jsonb storage order; you intend to sort hosts and resources by id.** That is
right. jsonb keeps object keys sorted by length then bytes, so "scenario order" (plan 4.3, step 3
tests) is not achievable for `rooms` and `resources`, and the present order is stable but means
nothing to an author. Do the sort in `NetworkModel.sign_in_objects_on` and `resources_on`, not in
the concern, so `mapped_shares` (desktop stub order), the view, the validator's information lines
and the dungeon graph share it; keep hosts before resources; and note that `network_viewed`'s
`hostList` inherits this order, so a mapping condition on it is author-predictable. Amend the plan
(4.3, 7.2 and step 3's tests) to "sorted by id" and update the tests (m9).

D4. **Resource matched by id only** (`network_access.rb:460-471`). Agreed, and it matches the
plan's wording for the record ("for the resource's own id"). It is the safer choice: matching the
record's name would let a request by display name find it. Items inside a share still match on id
or name through `locate_object_in`, as profile items do, and `find_scenario_object` walks the same
items in the same order, so `/unlock`'s scope check and its object lookup agree. Step 5's rule
against a resource id or content id equal to a room object's or profile item's id or name is
still needed, because rooms and profiles are searched first.

D5. **Planted device refused on inventory add with 422** (`games_controller.rb:1016-1020`).
Agreed: 422 is the route's status for a refusal the player caused, the check runs before the
"already held" shortcut and before every source, and the message names nothing secret. See m6
for the one false positive.

## What I checked and found sound

- Bootstrap: `networks`, `networkLinks` and `resources` deleted; rooms are a field whitelist, so no
  room `network` ships. Room data: `network`, `linkName` and `linkStoreIn` deleted from every
  object (also in `GET /container` listings, which run the same filter; a jack inside a container
  shows no `linkName`); headless hosts keep `host`, `headless` and `observations`, get no tiles and
  no `contents`.
- `GET /network`: empty with no foothold; with one, only that network; no username unless a
  password session is held there, none under a blocked policy or for a claim.
- Shares: refused share ids answer `/container` 404, `/unlock` 422 "Invalid attempt" with no
  `feedback` even with a PIN cracker held, and `/inventory` 422 "Item not found in scenario: <type>",
  identical to an invented id; `/unlock` with `method: "unlocked"` never records a share.
- Remote sign-in: checks in plan order; remote-blocked counts nothing; the lockout counter is
  shared; a PC named by its name resolves as `/login` already did.
- Plant and unplug: check order as section 5; one device across all five homes; the device returns
  once; sessions through the foothold end; reset clears both keys; a game from before the slice
  defaults everything.
- Concurrency: both writers and `container` hold the row lock and reload under it (M2 is about
  keeping it that way); `GET /network` and `/capture_secrets` only read.
