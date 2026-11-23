# S3 step 11 security review, round 1

Reviewed: commit `a756be26e` on `ops-build` (the one commit that changes existing access checks).
Reviewer is read-only; all file:line pointers are at `a756be26e` unless a line says otherwise.
Spec: `docs/achitechture/OPS_CORE_PLAN.md` (sections 0, 2, 5.4, 10, 11.2, 12.1 step 11, 14).

Status: COMPLETE (all ten checks done). Method: static reading of the files at the commit
(`git show a756be26e:<path>`), every caller found with `git grep` at the commit and read at its
line. No test was run by this reviewer; test facts below are from reading the test files, and
the pass counts are the builder's claim (HANDOVER_core_11.md), not re-run.

Short names: NA = `app/models/break_escape/network_access.rb`, NO = `.../network_ops.rb`,
GM = `app/models/break_escape/game.rb`, GC = `app/controllers/break_escape/games_controller.rb`,
NF = `app/models/break_escape/npc_frustration.rb`, BH = `test/controllers/break_escape/network_technique_blocked_host_test.rb`,
ST = `.../network_technique_session_test.rb`. Plan = `docs/achitechture/OPS_CORE_PLAN.md`.

Note: `settle_session_at_keyboard!` is in NA (:1580), not `game.rb` as the review prompt said.

## Summary

- Blockers: 0. Majors: 1 (F1, not in the commit's own files, fails closed). Minors: 7 (F2 to F8).
- No way was found for a player or a forged request to be served a desktop, folder, row or
  field the plan says is unearned. Every changed line either asks for `via == 'technique'` on
  the server's own record or narrows what was served before.
- Verdict: **safe to keep** `a756be26e`. Before S3 lands: fix F1 (`record_borrow_done!`) and add
  the missing tests in the list at the end (T1 to T12).

## The six changed methods: condition before, after, verdict

### 1. `technique_session_through?(session, foothold_id)` (NA:1567-1570, new)

```
session.is_a?(Hash) && session['via'] == 'technique' && foothold_id.present? &&
  session['foothold'].to_s == foothold_id.to_s
```

Word for word the plan's predicate (plan 1029-1034). Callers: NA:1043 (`desktop_refusal`),
NA:1061 (`host_row`), NA:1527 (`desktop_request_allowed?`). No other caller.

Fields trusted: `via` and `foothold` of `player_state['sessions'][pcId]`, nothing from the
request except the foothold id it is compared with.

- Who writes `sessions`: every write of `player_state['sessions']` at the commit is server code:
  GM:3719-3720 (logout), GM:3756 (claims ended), GM:3827/3831 (dry run, restored), GM:3914-3915
  (lock flag), GM:4574-4607 (`start_login_session!`), NA:411-413 (`end_sessions_through!`),
  NA:1484 (prune), NA:1589 (settle), NF:394 (borrow done), `credential_keyring.rb:229` (except).
  None copies a client value in. GC has no write of `player_state['sessions']` at all (grep), and
  no dynamic `player_state[<client key>] =` exists in `app` or `lib` (the one dynamic write,
  GM:1985-1987, is the avatar-unlock key constant). So `PUT /sync_state` cannot write it; BH:142
  proves it for two body shapes.
- `via: 'technique'` has one writer: `start_login_session!` called from NO:595
  (`ops_technique_grant!`, reached only from `use_technique!` NO:494 after all its checks). The
  other three callers pass the literals `'password'` (GM:3552), `'claim'` (GM:3625, GM:3709) and
  `'credential'` (`credential_login.rb:87`).
- `foothold` on that record is the `foothold` param of `POST /network/technique`, which GC:1867-1875
  admits only as a non-empty String of at most 200 characters (`ops_ids_well_formed?`) and which
  `ops_finding_reach` has matched to a held foothold that lists the host. So it is always a String
  equal to a `footholds` key.
- Record with no `foothold`, nil or empty: `nil.to_s` is `""`; the request side must be
  `present?`, so `""` never equals it: false. Request foothold nil, empty or whitespace: false by
  `present?` (and such a request never reaches the foothold branch, see check 6).
- Array or hash foothold param: GC:3284 reads `params[:foothold].presence&.to_s`, so
  `foothold[]=jack_a` becomes the string `["jack_a"]` and `foothold[a]=b` the string of a
  Parameters object. Neither is a `footholds` key, so `host_reachable_through?` (NA:1493-1499)
  is false before the predicate matters, and neither equals the record's plain string.
- Comparison: value-exact after `to_s` on both sides. The `to_s` is looser than a typed `==`, but
  both sides are Strings on every reachable path (above), so nothing rides on it.
  `end_sessions_through!` (NA:412) and `ops_technique_repeat` (NO:568) compare with a strict `==`
  and agree because the record's value is a String.

Verdict: sound. BH:225-236 is a unit test of it (T9 below asks for the two missing record
shapes).

### 2. `desktop_request_allowed?(info, route)` (NA:1511-1535), foothold branch only

Before:
```
host_reachable_through?(route[:foothold], pc) && !remote_blocked?(pc) && !host_service_off?(pc) &&
  !(session.is_a?(Hash) && session['via'] == 'claim') && !remote_route_session?(session)
```
After (NA:1526-1528):
```
host_reachable_through?(route[:foothold], pc) && !host_service_off?(pc) &&
  (!remote_blocked?(pc) || technique_session_through?(session, route[:foothold])) &&
  !(session.is_a?(Hash) && session['via'] == 'claim') && !remote_route_session?(session)
```
The terms were reordered (host-off before the blocked term) but all are side-effect free, so the
value is the plan's (plan 1018-1027). The first line of the method (expired token, NA:1516), the
relay branch, the `from` branch and the keyboard branch are byte-identical to the parent.

Callers and what each now gets:
- NA:1020 `desktop_refusal` (so GC:3221 `render_login_desktop`, reached only after
  `session_identity` is non-nil, GC:3216-3217): a technique session through its own foothold on a
  blocked host now passes.
- GC:3270 `folder_route_allowed?` with a named route: the same.
- GC:3266 (new) with `nil`: the keyboard branch, unchanged code.

The questions asked:
- Foothold no longer held (unplugged): `unplug_device!` (NA:302-315) deletes the foothold and
  `end_sessions_through!` (NA:410-415) ends every record whose `foothold` is it, technique ones
  included, in the same request. Were the record somehow left, `host_reachable_through?` needs
  `network_footholds[foothold_id]` to be a Hash (NA:1494-1495), so it is false. The only delete of
  a foothold in the code base is NA:303.
- Foothold that does not reach the host: `host_reachable_through?` asks
  `player_reach(foothold_id).include?(network)`; still the first term.
- ANOTHER held foothold that reaches the host: blocked term false, predicate false: refused
  (BH:153-171). On a host that allows remote sign-in it is served, as before and as the plan says
  (plan 1077-1079; BH:354-365).
- A non-technique session: the only new way to make the blocked term true is the predicate, which
  needs `via == 'technique'`. Password, claim, credential, relay and token records never have it.
  So for them the expression equals the old one in every case.
- Technique session replaced by a password sign-in: on a blocked host a password sign-in is
  possible only at the keyboard (`POST /login` with a foothold answers `remoteBlocked`, BH:89-98);
  `start_login_session!` builds a fresh record (GM:4583-4591) with `via: 'password'`, no
  `foothold`, no `access`, no `technique`. The predicate is false, the old rule applies. The
  reverse (a password session, then a card use) writes a fresh technique record with the
  request's foothold; that is the plan's "one slot per PC" (plan 769-776).
- Claim, relay, `from`: still excluded by the last two terms; a technique record has no `from` or
  `relay` (GM:4583-4590 writes them only from keywords `use_technique!` does not pass).
- Locked: `session_identity` (GM:3288-3294) answers nil for a locked record before this method is
  asked; a technique record cannot be locked (`session_lockable?`, GM:3884-3890; ST:53).

Verdict: sound; matches plan 1015-1047.

### 3. `desktop_refusal(info, route)` (NA:1018-1050), foothold branch only

Before: `return 'not_responding' if host_reachable_through?(foothold_id, pc) && !remote_blocked?(pc) && host_service_off?(pc)`
After (NA:1042-1045):
```
if host_reachable_through?(foothold_id, pc) && host_service_off?(pc) &&
   (!remote_blocked?(pc) || technique_session_through?(access_sessions[pc['id'].to_s], foothold_id))
  return 'not_responding'
```
One caller, GC:3221, reached only when a session is held and not locked.

Answers on a blocked host that is off, through a held foothold that reaches it:
| Player holds at the PC | Before | After |
|---|---|---|
| no session | `no_session` (GC:3217, before this method) | the same |
| password (keyboard), claim, credential | `unreachable` | `unreachable` (BH:336-342) |
| technique session, request names its foothold | (could not exist) | `not_responding` (BH:320-334) |
| technique session, request names another held foothold | (could not exist) | `unreachable` |

So the power state of a blocked host is told only to the holder of a technique session through
that foothold, who already reads it on the row (`responding: false`, `heldAs`). Nothing new is
told to anyone else. Plan 1085-1087. Verdict: sound. (The fourth row has no test: T1.)

### 4. `host_row(pc, foothold_id = nil)` (NA:1054-1091)

Before: session listed when `remote && session.is_a?(Hash) && via != 'claim' && !relay && !expired`.
After: `open_here = !remote && technique_session_through?(session, foothold_id)`; listed when
`(remote || open_here) && ...` the same four terms; inside the `held` hash, after `locked`:
`held['access'] = 'admin' if client_access_level(pc['id']) == 'admin'` and
`held['openHere'] = true if open_here`.

Callers and the foothold each passes:
- NA:879 `network_rows(network_id, foothold_id)`: the view's foothold (from `network_view` /
  `network_blocks`).
- NA:820 `down_blocks(foothold_id, ...)`: the view's foothold; the row is stripped of `session`
  and keeps `heldAs` from `full.dig('session','displayName') || full['heldAs']` (NA:821-822).
- NO:647 `ops_host_row(record, foothold_id)` from NO:135 (`scan_host!`): the request's foothold,
  which `ops_listed_host` has already matched to a held foothold listing the host.
- NO:710 `ops_held_session_rows(network_id, foothold_id)`: the view's foothold.
No caller passes a client string that has not first been matched to a held foothold, and a
default-nil call lists nothing new (`present?` fails).

Results:
- Blocked host, the session's own foothold's view: `remoteSignIn: false`, `session` with
  `via: 'technique'`, `remote: true`, `openHere: true`, and `access: 'admin'` only when the stored
  level is admin (BH:173-185, BH:197-205).
- Blocked host, any other foothold's view: no `session`, no `heldAs` (BH:181-184), and when the
  host is off no `heldAs` either (the off branch reads `held`, which is nil). The account, the
  session and `access` are not shown there.
- Allowed host: `open_here` is false by `!remote`, so no row carries `openHere` (BH:187-195); the
  session is listed in every view, as a password session is.
- `access`: `client_access_level` (GM:4657-4660) answers `admin` only for a stored
  `access == 'admin'`, which only `start_login_session!` from `use_technique!` writes. The key is
  set only inside `held`, so it never appears without a listed session, and the off branch
  (`heldAs` only) carries none; that is what the removed NO wrapper did (`row['session']` Hash and
  admin), with the key in the same position (last before `openHere`).
- Existing scenario: no record has `via: 'technique'` or `access`, so `open_here` is false,
  neither key is added and the hash is built in the same order as the parent: byte-identical.

Verdict: sound; matches plan 1049-1087.

### 5. `settle_session_at_keyboard!(pc_id)` (NA:1580-1591)

Before: return unless the record has `foothold` or `from`; return if `via == 'credential'`; then
`sessions[pc] = session.except('foothold', 'from')` and `save!`.
After: one more `return if session['via'] == 'technique'` before the write.

One caller, GC:3236, only when the request named no route and the desktop was allowed.
After the point of return the method does exactly two things: the `except` write and `save!`.
It touches no lock state and no `signedInPcs` (that list is written at the grant, GM:4601-4604),
so a technique session skips only the drop of `foothold`, which is the plan's one line
(plan 876-883, reader table row at 792). The record therefore keeps `foothold` after a keyboard
fetch; BH:271-285 proves it and that the unplug still ends it; ST:76-83 the same.

"Can a technique record keep a foothold it should lose?" The plan says it never loses it
(plan 83-85). The only code that removes `foothold` from a record is NA:1589, now skipped. A
record keeping the foothold of an unplugged link cannot arise: NA:312 ends it with the link.

Verdict: sound.

### 6. `folder_route_allowed?(pc_id)` (GC:3256-3271)

Before, no-route branch: `return !@game.relay_session?(session)`.
After: first `return @game.desktop_request_allowed?(info, nil) if session.is_a?(Hash) && session['via'] == 'technique'`.

One caller, GC:664, after `session_admits?(scope) && path_unlocked?` (GC:657) has passed.

- The new line can only turn a `true` into a `false` (a technique record is never a relay, so the
  old answer for it was always `true`). So no crafted request can gain from reaching it.
- What it serves: `desktop_request_allowed?(info, nil)` is the keyboard branch: not an expired
  token, not a relay, `login_pc_reachable?(info) && !headless && !host_service_off?`. That is
  the exact method the keyboard desktop is judged by, so a no-route folder is served only where
  the keyboard desktop is (and, by GC:657, only while the session's route is up as well). BH:241-259
  (away, then beside), BH:261-269 (headless).
- "No route" in the params (GC:3276-3290): `relay` absent or blank; `from` absent or the empty
  string; `foothold` absent, empty or whitespace only (`.presence`). Everything else is a route or
  a conflict: a bare `?from` (nil) or an array or hash `from` is `:conflict` (refused); `relay=0`
  is `:conflict`; two routes are `:conflict`; an array or hash `foothold` becomes a string that is
  no held foothold and is refused in the foothold branch.
- A whitespace `foothold` (`?foothold=%20`) is read as no route, unlike a whitespace `from`
  (refused). That was so before this commit, and it only selects the keyboard rule, which the
  request must still pass. See F6.

Verdict: sound; matches plan 885-891 and 1089-1092.

## Check 7: the readers in the plan's table (plan 777-792, 991-1010)

| Reader | Code at the commit | With a technique session | As the plan says? |
|---|---|---|---|
| Pivot | `reach_session_hosts` NA:1416-1431: any record that is not a relay or expired token | pivots | yes; no test (T7) |
| Share mapping, profiles | `session_admits?` GM:3305-3329, `session_identity` GM:3288-3294 | served as the named account while `session_route_up?` | yes; no test (T7) |
| Implant `needsSession` | `implant_foothold!` NA:494-501: needs `session['foothold'].blank?` and not `from`/relay | refused `not_ready`; never met, because the record now never loses `foothold` | yes; ST:105-125 |
| Unplug | `unplug_device!` NA:302-315, `end_sessions_through!` NA:410-415 (`session['foothold'] == foothold_id`) | ended in the same request; next desktop request answers `no_session` (GC:3217) | yes; BH:307-318, BH:271-285, ST:165-171 |
| Prune (pivot lost) | `prune_unreachable_sessions!` NA:1462-1489: a record with a foothold whose PC network is in no held foothold's structural reach | pruned by the same loop | yes by reading; no test (T6). Note: the loop asks ANY held foothold's reach, so a technique session whose own foothold has lost the pivot stays while another held foothold structurally reaches the network; its desktop is then refused through both (own: not reachable; other: not its foothold). Fails closed; the same existing rule a password session has |
| Outage, host off | `session_route_up?` NA:1174-1203, `host_service_off?`, the `!host_service_off?` term | kept; refused while off (`not_responding` by foothold, `off` at keyboard); served again | host off yes (BH:320-334, ST:127-141). A network outage has no test (T5); and see F4 for the keyboard desktop during an outage |
| Lock | `lock_session!` GM:3896-3916, `session_lockable?` GM:3884-3890 | refused 422, record unchanged | yes; ST:53-61 |
| NPC finishes a borrow | `record_borrow_done!` NF:391-410 | DELETED, not kept | **no: F1** |
| `from` source | `from_route_refusal` (unchanged) | valid source | yes; ST:85-92 |
| Guest session ended by the grant | `start_login_session!` GM:4573 | ended | yes; ST:94-103 |

## Check 8: `WITHHELD_SCENARIO_KEYS` gains `techniques`

- `withhold_network_keys!` (NA:23-26) has one caller, GM:2523, in the bootstrap filter; it deletes
  the top-level key only. Room answers are built from one room and never carried top-level keys.
  `network_technique_test.rb:412-417` (step 10, unmodified) refutes `techniques` and the registry
  strings in the bootstrap JSON, so the list entry is pinned by a test now that the NO override is
  gone.
- Seven existing scenarios contain a key named `techniques` (`ca03_helpdesk_reset`,
  `ca12_visitor_tailgater`, `lab_social_engineering`, `test_ca12_fallback`, `test_dm_social`,
  `test_social_m5_channels`, `test_social_slice`). All are NESTED (`tells.techniques` of a pretext
  spec, read by `pretext-judge.js:207` and `pretext-chrome.js:61`), not top level, so the
  top-level delete does not touch them. No scenario at the commit has a top-level `techniques`.
- Was it ever exposed? The schema and helpers arrived in step 9 (`a6f04bf8b`), the NO override in
  step 10 (`73c9cd798`), and this commit moved it. Between `a6f04bf8b` and `73c9cd798` a scenario
  with a top-level `techniques` would have shipped it in the bootstrap, but no scenario file had
  one then (fixtures are built in test code), so no dev game was exposed.
- Removed wrappers: `withhold_network_keys!` override: same delete, now by the list. `host_row`
  wrapper: `access: 'admin'` on a listed session when admin, no key otherwise, nothing on a
  `heldAs` row: the same in the folded form (check 4). Preserved in full.

## Check 10: the repeat answers `already: true` on a finding since fixed

It is the plan's order. Plan 5.4's numbered checks put the repeat at step 4, before status (5),
`no_grant` (6) and `fixed` (7) (plan 688-696), and "A repeat" (plan 728-735) says it is tested
after the finding, the reach and the card have passed and "never answers more than a first use
would". `use_technique!` (NO:494-525) does exactly that: two 404s, host off, then the repeat
(NO:508-510), then the rest. The repeat answer (NO:574-588) changes no state beyond a limited log
row and returns the live session answer the player already holds (or `keyringChanged: false`).
It grants nothing and reveals nothing: the session is already the player's, and the fixed state
is not in the answer. A use of the same fixed finding through ANOTHER foothold is not a repeat
(`session['foothold'] == foothold_id` fails) and is refused `fixed`; that case has no test (T11).
One side note for 10b's reviewer, not this commit: the repeat does not run the match, so its
`technique_used` row records whichever held card the request named (NO:575), even one that would
not fit (F8).

## Findings

### F1 (major; plan departure, fails closed, not an exposure) `record_borrow_done!` still deletes a remote session
- Where: NF:391-394 at `a756be26e`, unchanged at the worktree HEAD when this was written:
  `player_state['sessions'] = access_sessions.except(pc_id)`.
- Plan: 5.4 reader table (plan 786), "An NPC at the PC" second bullet (plan 906-910), the
  differences table rows "An NPC finishes a borrow" (plan 1002), section 10's row for
  `pcSessions.displaced()`, `record_borrow_done!` (plan 1506), and 11.2's
  `network_technique_session_test.rb` row.
- What the plan requires, exactly: delete the player's record at that PC only when it has neither
  `foothold` nor `from` (a keyboard session: a keyboard password session, a claim). A record with
  `foothold` (a technique session, a password or credential session still held through a
  foothold) or `from` stays; `prune_unreachable_sessions!` still runs and then finds nothing new
  to end through it; the guest record (`guest_sessions`, `guest_sessions_at`) is written exactly as
  today, so the two sit side by side. The answer's ended ids must not name the kept PC.
- State that shows it: hold a technique session at a PC an NPC can borrow (a `borrow_session`
  workaround on it); the client reports the borrow done (the workaround route, NF:207). After it,
  `sessions[<pc>]` is gone; `GET /container/<pc>?foothold=<its foothold>` answers 403 `no_session`.
  The prune at NF:397 then also ends any `from` session sourced from that PC and any session
  reached only through it as a pivot.
- What goes wrong without it: server and client disagree. Step 12's `displaced()` keeps a remote
  copy and sends no logout, so the network view still offers Open, the world click still starts
  the remote view and the compromise mark stays, while the server refuses each with `no_session`;
  onward `from` and pivot sessions vanish with no notice to a client that believes the source is
  held; and a mission step that needs the technique session can be undone by an NPC's routine.
  Security direction: it only removes access, so it is not a reason to revert this commit.
- Fix: in `record_borrow_done!`, read the record first and delete it only when
  `!(session.is_a?(Hash) && (session['foothold'].present? || session['from'].present?))`; leave
  the prune call and the guest lines as they are. Add the test T8. It is nobody's row in 12.1
  (the builder says so); the orchestrator must assign it before S3 lands.

### F2 (minor) Missing negative tests for the changed check
The list T1 to T12 below. None hides a defect found by reading, but several rules of the plan's
"stays refused" table and reader table would not fail a test if broken (most of all T1, T2, T3).

### F3 (minor) BH:108 title claims more than the test does
- Where: BH:108-119, "a password session made at the keyboard is refused through a foothold, and
  the technique card changes nothing for it".
- The body never uses a card. And a card used there DOES change it: by "one slot per PC"
  (plan 769-772) it replaces the password session with a technique session.
- Fix: retitle to what is tested, or add the card use and assert the plan's result (the record
  becomes `via: 'technique'` with the request's foothold, and only then the foothold opens it).

### F4 (minor; plan-conformant, needs a ruling) Keyboard desktop of a technique session ignores the route, its folders do not
- Where: NA:1529-1533 (keyboard branch, unchanged) with GC:657 and GC:3266.
- A no-route desktop request beside the PC is served for a technique session whatever the state of
  its route (an outage on the foothold's network, a pivot down but not pruned), because the
  keyboard branch never asks `session_route_up?`. The plan chose this ("No refusal is added",
  plan 870-876), but its differences table says of an outage "kept, refused while down" (plan 1007)
  and of the keyboard desktop "It stays a remote session the whole time" (plan 796-798). The
  no-route folder under it IS refused while the route is down (`session_admits?` at GC:657 asks
  `session_route_up?`), with the 403 "Container not unlocked", so a stale or hand-sent keyboard
  request gets a desktop whose folders will not open.
- State that shows it: technique session at a walk-up PC, its network's outage global true,
  `GET /container/<pc>` with no route: 200 with the desktop; `GET /container/<folder>` with no
  route: 403.
- Not an exposure the plan forbids (the player is at a PC they hold a session on), and the
  ordinary client never sends it. Suggested: either accept and add one sentence to plan 5.4, or
  make the keyboard branch for a technique record also require `session_route_up?(pc['id'])`
  (one term, technique-only, so existing scenarios do not see it). Orchestrator's call.

### F5 (minor; observation) The other scoped requests under a PC are not judged by the folder line
- Where: `unlock_scope_refused?` GM:4361-4367 (and the inventory and unlock paths that call it,
  GM:4196, GM:4253, GM:4888, GM:4994) ask `session_admits?` only; `folder_route_allowed?` is
  called only from `GET /container` (GC:664).
- So an unlock or take of an object under a PC holding a technique session, sent with no route
  from anywhere, passes on `session_admits?` alone. This gives nothing the foothold route does not
  give: `session_route_up?` (NA:1174-1203) requires the host on, the record's own foothold held and
  the PC's network in that foothold's `player_reach`, which are the terms of the foothold branch
  for a technique session through its own foothold. Plan 889-890 ("would open the folders of a
  blocked host ... from anywhere") describes the same reach the remote view has. No change asked;
  recorded so that S5a's collect action is not assumed to be covered by the folder line for
  non-GET requests ("by no other route", plan 1043-1047, holds for `desktop_request_allowed?`
  itself, not for `session_admits?` callers).

### F6 (minor; existing behaviour) A whitespace `foothold` is read as no route
- Where: GC:3284 `params[:foothold].presence&.to_s`.
- `?foothold=%20` selects the keyboard rule, where a whitespace `from` is refused (GC:3280-3281).
  It only reaches the keyboard branch, which the request must still pass, and the new line can only
  refuse. Not from this commit. Suggested (low priority): treat a present, blank `foothold` as a
  named route that fails, as `from` is.

### F7 (minor) BH:344 "a lost route refuses a technique session as for any session" is a second unplug test
- Where: BH:344-350. It unplugs and expects `no_session`, which BH:307 already does. No test
  covers a route lost without the session ending (an outage) or a lost pivot (T5, T6).
- Fix: replace its body with T5.

### F8 (minor; step 10b's code, noted here) A repeat's log row names whichever held card was sent
- Where: NO:508-510 with NO:574-577. The repeat runs before the match, so a repeat sent with a
  different held card that would not fit writes `technique_used` with that card's key.
- Plan 728-735 allows the order; the row is bounded by `save_limit`. Grants and reveals nothing.
  Suggested: accept, or log the record's own granting card if the plan wants the row exact.

## Missing tests, precisely

- T1 Host off, blocked, technique session through OFFICE, two footholds: `desktop(foothold: SECOND)`
  answers 403 `unreachable` (not `not_responding`), and `sam_row(SECOND)` has no `heldAs` and no
  `session` while off. (Pins the predicate's foothold argument in `desktop_refusal` and the off
  branch of `host_row`; today only the on state is tested, where `heldAs` is nil anyway.)
- T2 A technique record whose foothold is not held or does not reach the host: seed
  `{ id, via: 'technique', foothold: 'jack_gone' }` and request `foothold=jack_gone`: 403
  `unreachable`; and with a real technique session through OFFICE, a request naming an invented
  foothold id: 403 `unreachable`. (Pins that `host_reachable_through?` still applies to a
  technique session; no test would fail today if the predicate short-circuited it.)
- T3 Technique session on a blocked host replaced by a typed sign-in at the keyboard: the record
  is `via: 'password'` with no `foothold`, `access` or `technique`; `desktop(foothold: OFFICE)`
  answers 403 `unreachable`; `sam_row` has no `session`, no `openHere`, no `access`. And the
  reverse: a keyboard password session, then the card, then the foothold opens it (see F3).
- T4 A relay route at a technique session: `GET /container/sam_pc?relay=1` answers 403 (the plan's
  table row "by a `from` or relay route"; only `from` is tested, BH:134, and it asserts no reason).
- T5 A network outage over the technique session's route on a blocked host: session kept,
  `desktop(foothold: OFFICE)` refused, folder refused, row in a down block with `heldAs` in
  OFFICE's view only; all served again when the outage ends. (Plan 1007; only host-off is tested.)
- T6 A technique session reached over a pivot: ending the pivot session prunes it (plan 1006).
- T7 Pivot THROUGH a technique session to a second network, and a share mapped on its desktop
  (plan 1004; 11.2's session-test row). Needs a fixture host beyond `sam_pc`.
- T8 `record_borrow_done!` (after F1): a technique session, a password session through a foothold
  and a `from` session each kept with their route key, the guest record written beside, nothing
  pruned and no ended id for that PC; a keyboard password session and a claim still deleted; a
  repeat use after the borrow answers `already: true` (11.2's session-test row).
- T9 Predicate unit cases missing from BH:225-236: a technique record with no `foothold` key, with
  `foothold: nil` and with `foothold: ''`, each against a real foothold id and against `''`/nil.
- T10 Folder and desktop param edges at a technique session away from the PC, each refused with no
  contents: `foothold=` (empty), `foothold=%20`, `foothold[]=<own foothold>`,
  `foothold[a]=b`, bare `?from`, `relay=0`, and `foothold=<own>&from=<pc>` (conflict). And the
  same `foothold[]=<own foothold>` for the desktop on a blocked host.
- T11 After `fixedIf` turns true, a use of the same finding through a SECOND foothold answers 422
  `fixed` and leaves the record on the first foothold (the plan's "A new use is refused",
  plan 1008; today only the exact repeat is tested, ST:143-153).
- T12 Host rows through the scan answer: `POST /network/scan` with `host_id` on a blocked host
  holding a technique session answers `host.session.openHere` only when the request's foothold is
  the session's, and no `session` through the second foothold (NO:135, NO:646-648).

Present and adequate (would fail if the rule broke): another held foothold refused for desktop and
folder (BH:153); non-technique records on a blocked host refused, three kinds (BH:121) plus a real
keyboard password session (BH:108); after unplug `no_session` (BH:307, BH:271, ST:165); forged
record through sync ignored (BH:142); `openHere` in one view only (BH:173); none on an allowed
host (BH:187); headless admin through own foothold only (BH:207); no-route folder away, beside,
headless (BH:241, BH:261); settle skipped and the old settle kept for a password session (BH:271,
BH:295); host off (BH:320, BH:336, ST:127); lock (ST:53); `needsSession` (ST:105); bootstrap
without the registry (`network_technique_test.rb:412`).

## Severity count and verdict

| Severity | Count | Ids |
|---|---|---|
| blocker | 0 | |
| major | 1 | F1 |
| minor | 7 | F2, F3, F4, F5, F6, F7, F8 |

**Verdict: safe to keep.** Commit `a756be26e` does what plan 5.4 says and nothing more; no
request or state was found that serves an unearned desktop, folder, row or field. Before S3
lands: (1) F1, change `record_borrow_done!` as the plan requires and add T8; (2) add T1, T2, T3
at least, then the rest of the list as fixtures allow; (3) a ruling on F4.

Checks not completed: none. Not done: no test was run (the pass counts are the builder's).

## R1 outcomes (fixer, 2026-11-23)

Tests are in `network_technique_blocked_host_test.rb` (BH) and `network_technique_session_test.rb` (ST); the new fixture method is `NetworkOpsScenario.pivot_techniques_scenario`. Commits: F1 with T8 `8639775d1`; the rest `c37b04c3a`.

| Id | Outcome |
|---|---|
| F1 | Fixed. `record_borrow_done!` (`npc_frustration.rb:394-395`) deletes the player's record only when it has neither `foothold` nor `from`; prune and guest lines unchanged. Existing borrow tests pass unmodified (270 runs); `bin/ops-golden-compare` passes. |
| F2 | The test list below, all written. |
| F3 | Retitled (BH: "a password session made at the keyboard is refused through a foothold"); the card half is the T3 reverse test. |
| F4, F5, F6, F8 | Left by ruling; nothing changed. F4 goes to the user. |
| F7 | The "lost route" test now covers a network outage (session kept, desktop and folder refused, served again after); the down-block row is a second test. |
| T1 | BH "T1 ..." (host off, other foothold: `unreachable`, no `heldAs`/`session`/`openHere`; own foothold `not_responding`). |
| T2 | BH "T2 ..." (unheld foothold record, invented ids for a real session). |
| T3 | BH two tests: typed sign-in replaces the technique record; reverse order opens through the foothold. |
| T4 | BH "T4 ..." (relay route, desktop and folder, with and without a foothold). |
| T5 | BH outage test (replaces F7's body) and the down-block row test. |
| T6 | ST two tests over a pivot to `sv_fs02`: pruned when the pivot session logs out, ended when the foothold is unplugged. |
| T7 | ST "T7 ..." (pivot block to server_net from a technique session; desktop share served as Sam; finance and IT shares answer as a missing one). |
| T8 | ST four tests (technique, password-through-foothold and `from` kept; keyboard password and claim still ended; `from` sourced from a kept record stays; repeat use after the borrow answers `already: true`). Drives `record_borrow_done!` directly: sam_pc has an owner, so the borrow route's `performable?` refuses it. |
| T9 | BH "T9 ..." (no, nil, empty and blank foothold; wrong `via` case). |
| T10 | BH two tests: odd route parameters away from the PC (a bare `from` answers 400 "malformed", all others 403, none with contents); `foothold[]` beside a blocked PC. |
| T11 | ST "T11 ..." (`fixed` through a second foothold; record stays on the first). |
| T12 | BH "T12 ..." (scan answer has `openHere` only through the session's foothold). |

Mutation proofs (weakened locally, failure seen, exact text restored; `git diff --stat app/` showed only another stream's `network_ops.rb`): F1 condition removed (3 failures, T8); `desktop_refusal` foothold term (NA:1043) (T1, plus one older); foothold-reach term at NA:1526 skipped (T2 and 6 older); predicate `via` check dropped (T9 and two older); `host_row` `open_here` fed the record's own foothold (T12, T1, T2 and two older); `start_login_session!` merging the previous record (T3).
No engine fault found.
