# OPS_PRIVILEGE_ACCOUNTS_PLAN: delta review R7 (commit 68382fce1)

Scope: the R6 fixes in commit 68382fce1, checked against the code in this worktree. PP below is
`docs/achitechture/OPS_PRIVILEGE_ACCOUNTS_PLAN.md` at that commit. The core plan was read from the
working-tree copy of `docs/achitechture/OPS_CORE_PLAN.md` (uncommitted edits present).

Counts: 0 blocker, 2 major, 4 minor, 3 nit.

R6 closure: B1 (crack recipe), M1 (string proof), M3 (item kept on the consumesItem path), m1 to m4
and the nits are closed. M2 is closed in intent (keyboard only, a visible `needs_console`), but the
way the plan finds a "device that needs a session" does not match how every shipped BadUSB is built
(major 2 below). M3's fix misses one of the two client paths that send a plant remove (major 1).

## Major

**M1. The `remove_item` action sends a plant remove too, and it neither waits nor keeps the item.**
The plan's wait covers only the `consumesItem` branch of `interactions.js` (PP:441-449, PP:617-621).
There is a second client sender of `used_on`: the `remove_item` action
(`apply-actions.js:271-293`) removes the item from the tray first (`:283`), then calls
`sendInventoryRemove(id, { usedOn: objectId, gameId })` (`:290`) and ignores the result. The server
counts that as a plant: `CaptureModel.object_takes_item?` accepts an object whose
`triggerOnInteract` removes the item (`capture_model.rb:436-438`, `removes_item?`), and that is the
documented way to consume only once a `confirm_action` is confirmed (`apply-actions.js:245-251`).
With the new `plant_policy_refusal` check, a lapsed-override plant through `remove_item` gets 422
`usb_refused`; the server keeps the item while the client has already dropped it from the tray, and
the rest of the `onConfirm` list (a `set_global`, a `grant_foothold`) has already run. The tray and
the server disagree until a reload, and the player gets no line. The plan's claim that the new
refusal is "reachable only where an honest client never goes" (PP:848-850) is also wrong for this
path in an existing scenario: when the player holds two items that match `requiresItem`, one
refused and one accepted, `plantRefusal` passes on the accepted one (`pc-policy.js:67-75`) but
`remove_item` removes the first held match by its own list (`apply-actions.js:276-279`), which can
be the refused one. Today the server removes it silently; after S5a the server keeps it and the
client does not.
*Fix:* make `remove_item` await `sendInventoryRemove(..., { withBody: true })` before
`removeFromInventory`, keep the item and show the server's line on `usb_refused` (the same rule as
the consumesItem branch), and list `apply-actions.js` `remove_item` beside `interactions.js` in
sections 5, 11 (a JS test: lapsed override through a confirm's `remove_item` keeps the item) and 12.
Alternatively make `plant_policy_refusal` refuse only when the client marked the request as an
override plant, but the first fix also mends the two-item case. Say in section 10 which of these
an existing scenario can now meet.

**M2. "An object that needs a session" is keyed on the wrong object and the wrong nesting level.**
PP:405-410 and PP:606-608 define it as an object whose `triggerOnInteract` holds a `grant_foothold`
with `needsSession`, and pass `keyboardAdmin(objectId)` / `keyboard_admin?(found[:object]['id'])`
for it. Every shipped BadUSB is a separate socket object whose grant is nested in a
`confirm_action`'s `onConfirm` and names a different PC: `sam_dock` → `"pc": "sam_pc"`
(`scenarios/test_access_networks/scenario.json.erb:770-787`), the kiosk socket → `kiosk_pc`
(`:885-901`), the front desk socket → `reception_pc` (`scenarios/demo_access_tour/scenario.json.erb:455-475`).
Consequences:
- A socket has no session mirror entry, so `keyboardAdmin(socketId)` is always false, and a socket
  given a `policy` refuses a keyboard admin at the PC in the client, while the server's implant path
  reads the PC's policy with `keyboard_admin?(pc_id)` (`network_access.rb:507-512`) and would allow it.
- These sockets carry no `policy` and no workstation fields, so `usb_governed?` is false
  (`access_work.rb:1181-1187`) and `plantRefusal` never refuses them (`pc-policy.js:71`). A player
  holding only remote admin on a blocked PC therefore does not see the USB refusal line in the
  client; the confirm opens and the server answers `needs_console`. PP:608-610 ("still sees the
  authored USB refusal line for a BadUSB, as today, and never meets the server's `needs_console`
  refusal on an honest client") and Q1(a) at PP:1199-1200 are false for the shipped shape, and they
  contradict section 10 (PP:851-853), which correctly says an honest player now sees
  "Nobody is signed in at this keyboard."
- The S5a playtest step "try a BadUSB there under the same remote admin session and see the USB
  refusal line" (PP:995-996) and the JS test at PP:963-964 only hold for a BadUSB whose target is
  the governed PC itself, a shape no scenario uses.
- A top-level-only search misses the `confirm_action` nesting. The server already has a walker that
  finds nested grants (`NetworkModel.grant_foothold_actions`, `network_model.rb:256-271`).
*Fix:* for a `needsSession` object, take the PC from the grant's `pc` (found with the same nested
walk on both sides; the client has the scenario) and pass `keyboardAdmin(grant.pc)` /
`keyboard_admin?(grant.pc)`. State plainly that the server's `needs_console` toast is the normal
feedback for a remote-only player at an ungoverned socket, and rewrite PP:608-610, Q1(a), the
playtest step and the JS test to match (the playtest should expect "Nobody is signed in at this
keyboard." at `sam_dock`-style sockets). Decide, and say, whether the client should read the
policy of the grant's PC rather than the socket's for a `needsSession` object, so the client and
the implant path judge the same object.

## Minor

**m1. `needs_console` changes two shipped scenarios, and Q1 does not ask the user about it.**
PP:851-856 accepts a visible change in existing scenarios (a toast where today nothing happens).
The standing rule is that a scenario without the new fields behaves exactly as before (brief section
3). The affected shipped scenarios are `test_access_networks` and `demo_access_tour` (the only two
with a `needsSession` grant besides `test_author_notes`). It is a sensible fix of a silent failure,
but it is a rule exception.
*Fix:* name the scenarios in section 10 and add the exception to Q1 (or a new question) with a
recommendation, so the user approves it rather than finding it in section 10.

**m2. The core plan's S3 test pins the old reason.** The core plan's `network_technique_session_test`
asserts "`needsSession` for an implant refused for a technique session" (`OPS_CORE_PLAN.md:1324`);
at S3 that answer is `not_ready`, and S5a changes it to `needs_console` (PP:905). The plan's
unchanged-scenario note (PP:854-855) speaks only of its own test.
*Fix:* in section 11 or 12, list the core test's expectation as one S5a changes, or ask the core
plan (section 14) to assert only "refused, device still held" and leave the reason to S5a.

**m3. `keyboardAdmin` names client fields the mirror does not have.** PP:608-609 says the entry is a
keyboard session when it has "no `foothold`, `relay` or `from` on it". The mirror entry carries
`remote`, `footholdId`, `relay` and `fromPcId` (`pc-sessions.js:8`, `:20`, `:30`, `:183`, `:256`); a
technique copy carries `remote` and `footholdId` (`OPS_CORE_PLAN.md:634`). Read literally, the
check passes every remote and technique entry.
*Fix:* define `keyboardAdmin` as `sessionAdmin` and none of `remote === true`, a non-empty
`footholdId`, `relay === true` or a non-empty `fromPcId`. Add a technique entry to the JS test at
PP:963.

**m4. The waiting plant has no re-entry guard and no rule for a failed request.** PP:443-446 covers
success and `usb_refused`. While the request is in flight the player can interact again: the
second remove finds no held item, `plant_policy_refusal` answers nil, the server answers success,
and the client fires `triggerOnInteract` twice. `sendInventoryRemove` also resolves `false` after
two network failures or on any other refusal (`apply-actions.js:54-62`), and the plan does not say
what the tray does then.
*Fix:* mark the object busy until the answer (ignore further interacts), and on any answer other
than success keep the item and say so (the server's line when there is one, else a short generic
line). Add both to the JS tests.

## Nit

**n1.** PP:609 and PP:1199 call the USB refusal line "authored". It is engine text
(`USB_REFUSAL_LINES`, `network_access.rb:425`, and its copy in `pc-policy.js`). Say "the USB
refusal line".

**n2.** PP:1183-1184 "now comes from any admin session ... not only a keyboard one" reads as a note
about an earlier draft. State the rule as it is.

**n3.** PP:436-438 says `plant_policy_refusal` finds the held item and target "as
`record_planted_item!` does". Say that includes its early returns (a hideable item, a client-forged
item, `capture_proofs.rb:32`, `:39`), so the check never refuses a remove that the plant proof
would not have judged.

## Checked and sound

- `crack.password` is a class (`guessable`, `reused`, `strong`), not a password; the account's
  password stays on `creds.password`, as the habit check reads it (`validate_npc_habits.rb:261`).
  The `credentials` registry, `crack` included, is deleted from the bootstrap (`game.rb:2479-2482`)
  and reaches the client only through GET /keyring per proven entry, so no new value needs the log
  plan's secret registry. `passwordPattern` names an object id, as shipped habits already do
  (`test_access_social` "it_poster", `test_access_habits` "password_memo"), and carries no tool detail.
- The string proof form `{ "harvested": "<pcId>" }` is read by `proof_kind`
  (`credential_model.rb:62-67`); schema and file lists name it.
- The remove branch is the only server site that removes for a plant (`games_controller.rb:1454-1460`);
  `hide` has its own branch, the API controller's remove takes no `used_on`
  (`api/games_controller.rb:45-47`), and drops do not pass through it. The check runs only with
  `used_on`, so ordinary removes are untouched. Existing scenarios never reach the wait (no admin,
  so no plant passes `plantRefusal` only through the override).
- The implant path removes the device server-side only after the session check
  (`network_access.rb:495-515`), and the shipped sockets have no `consumesItem`, so a
  `needs_console` refusal does keep the device.
- "Nobody is signed in at this keyboard." is a system toast through `network-links.js`, beside the
  engine's existing USB refusal lines; it is UI text, not a spoken NPC line, so engine text is
  correct.
- The core plan (working copy) now says a technique session does not satisfy `needsSession`
  (`OPS_CORE_PLAN.md:777`), and its keyboard-served technique desktop keeps `foothold`
  (`:667`, `:708-712`), so `keyboard_admin?` (blank `foothold`) is false for it, as the privilege
  plan says.
- Username in the collect answer, the 64-entry registry cap as the only pair cap, lowercase ids,
  and the standalone wording ("by design, the comment at `:502`") are fine.
