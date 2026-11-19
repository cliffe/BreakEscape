# OPS_PRIVILEGE_ACCOUNTS_PLAN: delta review R8 (commit f93251a49)

Scope: the R7 fixes, `git diff 02d623ef4 f93251a49 -- docs/achitechture/OPS_PRIVILEGE_ACCOUNTS_PLAN.md`,
checked against the code in this worktree. PP below is the plan at f93251a49.

Counts: 0 blocker, 0 major, 4 minor, 4 nit.

R7 closure: M1 (the `remove_item` path), M2 (the needs-session walk keyed on the grant's PC), m1
(new Q2), m2 (section 14 request to the core plan), m3 (real mirror fields), m4 (in-flight guard,
failure rule), n1, n2 and n3 are all closed. The `needs_console` change in `test_access_networks`
and `demo_access_tour` is Q2 for the user and is not graded here.

## Minor

**m1. A remove the server did process but whose answer was lost: the retry works, but the plan
neither says so nor tests it, and a reload before the retry loses the item's actions.**
PP:452-458, PP:485-491. When a gated remove's answer is lost after the server removed the item and
recorded the plant, the client keeps the item and shows "That did not go through. Try again." The
retry heals the state, because of three things the plan does not state:
- `sendInventoryRemove` already retries once on a network error or 5xx (`apply-actions.js:42-63`),
  so a single lost answer is covered before the player sees anything;
- a remove of an item the server no longer holds answers `{ success: true }`
  (`games_controller.rb:1454-1460`; `remove_inventory_item!` is a `reject!`, `game.rb:845-850`);
- `record_planted_item!` returns false for an item not held (`capture_proofs.rb:43`), so a retry
  records nothing twice.
The new `plant_policy_refusal` must keep "not held" as a nil case. PP:453-454 lists the early
returns (hideable, client-forged, object does not take the item) but not this one. An implementer
writing a fresh check could easily refuse a remove of an item that is not held. The retry would
then fail forever and the tray would never catch up. What is left is a reload (or a server-driven
tray reconcile) before the retry. The item is then gone from the server, the plant may be recorded,
and the object's `triggerOnInteract` (a `set_global`, a `grant_foothold`) never ran, so a progress
global can be lost. Today's order fails the other way: the actions run and the item comes back on
reload.
Judgement: this matters only a little. It needs two lost requests in a row and then a reload before
the retry. No new state is justified for it.
*Fix (smallest, no new player_state):* in PP:453-454 add "an item the server no longer holds (the
retry of a remove it already did)" to the nil cases, and state that a retried gated remove answers
success and records nothing more. Add a server test to `admin_usb_test.rb`: two identical gated
removes under admin, where the second answers 200, removes nothing and leaves one `plantedItems`
entry. Add a JS test: both attempts fail, the item stays, the next try succeeds and fires
`triggerOnInteract` once. In section 10 (or beside PP:491), name the reload-before-retry case as an
accepted limit.

**m2. `plantsInFlight` is keyed on the object, but the double spend is per item.** PP:492-494.
While a gated remove is in flight the item stays in the tray, so another object that takes the same
item (a second governed port, or any ungoverned `consumesItem` or `remove_item` object) can start
its own remove of the same item id. On the server the first remove takes the item, and the second
finds it gone and answers success (see m1). The client then runs both objects' actions for one item:
one server plant, two client plants. Proximity makes this rare, but the guard is meant to make
in-flight state consistent.
*Fix:* also put the item id in the in-flight set (or keep a sibling set of item ids), and leave that
item out of `requiresItem` matching (`interactions.js:1050-1053`) and out of the `remove_item` pick
until the answer arrives. Add a JS test: a second object asking for the same item while it is in
flight sees the "not held" path, and nothing is sent.

**m3. `applyActions` has no object data, so the `remove_item` pick and `gatedRemove` have no input.**
PP:469-484. `gatedRemove(item, objectData, scenario)` and the pick "under the same `admin` value as
`plantRefusal`" need the object's data and the admin value (`sessionAdmin(objectId)`, or
`keyboardAdmin(sessionGrantPc(objectData))`). `applyActions` receives only `source`, `gameId` and
`objectId` (`apply-actions.js:133`), and `confirm_action` passes only those three on to `onConfirm`
(`:425`). The client has no lookup from a scenario id to object data (the only one is the test
bridge's `findSpriteById`, `test-bridge/index.js:468`). The admin rule also now sits in two callers,
`interactions.js` and `apply-actions.js`, and the two can drift.
*Fix:* pass `objectData` in the opts from both `interactions.js` calls (`:1080`, `:1095`) and thread
it through `confirm_action` at `:425`. Put the admin choice in one helper, for example
`plantAdmin(objectData)` in `pc-sessions.js` (`keyboardAdmin(sessionGrantPc(d))` when a grant is
found, else `sessionAdmin(d.id)`), and have both callers use it. List it in section 12 and add a JS
test that both callers give the same answer for a `sam_dock`-shaped object.

**m4. The new validator warning has no test.** PP:880-883. Section 11 lists no validator test for
this check, and the feature scenario (PP:1065) puts the governed `remove_item` first, so nothing
ever triggers the warning. (Section 9's other checks are also untested in section 11. That gap
predates this round, but it is worth closing at the same time.)
*Fix:* add `test/js/validator-privilege.test.mjs`, following the existing `validator-*.test.mjs`
files. It should cover a governed object with `remove_item` second in an `onConfirm` (warn), the
same object with it first (no warning), and an ungoverned object with it second (no warning).
Ideally it also has one row for each section 9 error.

## Nit

**n1.** PP:181-183, the S5a build row, still says the override applies at "the three places the
policy is read (implant path, plant proof, client `plantRefusal`)". The inventory `remove` check
(`plant_policy_refusal`) and the `remove_item` pick now read it too. Say five, or list them.

**n2.** PP:485-491. The inventory route's other refusals carry `message`, not `error`, and its
`rescue` answers 500 with `message: "Inventory error: #{e.message}"` (`games_controller.rb`, after
the `when` branches). Say that the client reads only `error`, so raw exception text never reaches a
toast, and that a 5xx after its retry counts as a network failure (the generic line), not as "a
refusal that has one".

**n3.** PP:413-415. "The first such grant's `pc`" agrees on both sides only if both walks use the
same order. State it: depth-first, in list order. Also say whether a grant with a `condition` counts.
The client skips an action whose condition is false (`apply-actions.js:142-145`), while
`removes_item?` ignores conditions. Following `removes_item?` and ignoring the condition is fine,
but write it down. Optionally, make the validator warn on one object whose `needsSession` grants
name two different PCs.

**n4.** PP:480-481. `applyActions(rest, opts)` starts a new call, so `give_item` promises from the
resumed list never reach the original caller's returned `gives` (`apply-actions.js:138`, `:463`).
Only the timer dispatcher reads them (`scenario-timer-dispatcher.js:238`, `:292`), and a timer
passes no `objectId`, so it never makes a gated remove. One clause saying so is enough.

## Checked and sound

- **Server authority.** `plant_policy_refusal` runs in the remove branch before
  `record_planted_item!` and `remove_inventory_item!`, and it reads the server's inventory copy and
  scenario data. `gatedRemove` only decides whether the client waits. It uses the same rule as the
  server (`usbPolicyFor` and `usbRefused`, mirrored by `usb_governed?` and `plant_refused?` on the
  same object), so an honest client never sends a remove the server refuses without waiting for the
  answer.
- **Forged or replayed requests.** A forged remove naming a refused item without an admin session
  gets 422 and keeps the item. A replay of a successful remove finds the item gone: it removes
  nothing and records nothing (`capture_proofs.rb:43`). Nothing on this path adds an item, so no
  request can copy one. The room-unlocked and client-forged guards stay in `record_planted_item!`.
- **Two matching items.** The client picks the accepted item (`plantRefusal` for `consumesItem`;
  the new pick for `remove_item`), sends its id, and the server judges that id. A tampered client
  that sends the refused id gets 422 with nothing spent. (`remove_inventory_item!` drops every entry
  with the id. That predates this plan and only matters if two held items share an id.)
- **Double click on one object.** The object-keyed guard and `gameConfirmOpen`
  (`apply-actions.js:417-420`) stop a second send. Cross-object use of the same item is m2.
- **The needs-session walk.** `session_grant_pc` and `sessionGrantPc` both recurse into
  `confirm_action` `onConfirm`, exactly where `removes_item?` does (`capture_model.rb:399-414`), and
  look only at `triggerOnInteract`, as `object_takes_item?` does (`:435`). The shipped shapes match
  the plan: `sam_dock` (`test_access_networks/scenario.json.erb:770-787`) and `implant_socket`
  (`demo_access_tour/scenario.json.erb:455-475`) each have one grant inside a confirm, naming
  another PC, with no `policy` and no workstation fields.
- **Keyboard only.** The implant path still needs a blank `foothold` and a session that is not a
  `remote_route_session?` at the grant's PC (`network_access.rb:495-501`, `:1544-1546`). The
  override for a `needsSession` object is `keyboard_admin?` and `keyboardAdmin` of that same PC on
  the server, in the plant proof and in the client, which agrees with the standing ruling.
- **`keyboardAdmin` fields.** These match the code. The server session record holds `foothold`,
  `relay` and `from` (`credential_login.rb:73-77`). The client mirror holds `remote`, `footholdId`,
  `relay` and `fromPcId`, and `remote: true` is set exactly when `foothold` or `from` is set
  (`game.rb:4448-4460`, `pc-sessions.js:188-194`, `:245-256`). The plan's client test (no `remote`,
  `footholdId`, `relay` or `fromPcId`) is therefore the same test as the server's (blank `foothold`,
  not relay or `from`).
- **Validator placement.** The new warning sits in section 9 under `scripts/validate_privilege.rb`
  (PP:834-835, PP:1122), the plan's own file.
- **Unchanged scenarios.** The only shipped objects that take an item through `consumesItem` or
  `remove_item` are in `test_capture_log`, `test_remove_item`, `test_wearable` and
  `lab_physical_pentest` (`staff_pc`, `consumesItem`, not in the plan's list). None of these
  scenarios has an item with `usbClass`, so no remove in them can be gated, and PP:496-499 and
  PP:910-913 hold. Apart from Q2, shipped behaviour does not change.
- **Citations.** `apply-actions.js:271-293` (`remove_item`), `capture_model.rb:419-439`
  (`object_takes_item?`), `network_access.rb:507-512` (the implant path reads the grant's PC
  policy), `network-links.js:483-487` (`usb_refused`) and `:498-501` (the quiet path) all match.
  Section 12 lists `capture_model.rb`, `pc-policy.js` (`sessionGrantPc`, `gatedRemove`) and
  `apply-actions.js` (the pick and the wait).
- **Delta sync.** `plantsInFlight` lives only in client memory and the gated remove adds no
  `player_state` key, so nothing is re-sent.
