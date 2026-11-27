# Access model slice 9.3 (networks): adversarial design review, round 2

Reviewed: `docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md` as rewritten after round 1, against the
working tree of branch `claude/break-escape-access-design-090sjx` on 2026-11-10. Read-only: no code
or plan was edited, nothing was committed and nothing was run against a server.

**Counts.**

- Round 1 items: the blocker and all 10 majors are resolved in the plan as written (2 of them with
  a residue that is raised again below as a new finding).
- New findings: **0 blockers, 2 majors, 22 minors.** Section 5 adds 6 ungraded notes on 9.3b.

**Verdict: 9.3a can be built after one short revision of the plan text. Nothing found needs a
change of design.** The server design holds: no path was found by which a network's names, a
share's contents or a host's desktop reaches a browser that holds no foothold and no session, and
every step that matters ends in a password the server compares or an item the server holds. The two
majors are both gaps in the client's and the build's instructions, not in the model:

- how the player gets back to the network view from the screens opened from it is not specified,
  and the obvious framework feature does not do it (N1);
- the contract with the engine feedback plan (shared files, the capture log, the tray) is wrong in
  several rows and out of step with that plan's current text (N2).

**Which streams can start first.** Stream S (server, steps 1 to 4) can start now: none of the
findings changes its design, and minors 1, 2, 5, 7 and 8 are small corrections its builder can take
from this review. Stream T (validator, tooling) can start when step 1 is committed, taking minors 6
and 9. Stream C1 can start on `network-links.js`, `api-client.js`, `core/game.js` and
`objectives-manager.js` at once, but must not touch `inventory.js` or `interactions.js` until N2 has
fixed which of C1 and the engine plan's E3 goes first. Stream C2 can build the view's rows against
section 6, and must wait for N1 before it wires sign-in, the desktop and shares. Stream F waits for
step 2 as well as for T (minor 18). Stream L waits for section 10.4, as the plan says.

**The sibling plans were moving.** `ACCESS_MODEL_SLICE_9_2_PLAN.md` and
`PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md` had uncommitted edits in the working tree during this
review. They were read in that working-tree state; N2 and minor 21 quote their line numbers as read
and should be rechecked against whatever is committed.

References: `P:n` is a line of the plan under review. Code lines are from the working tree and will
move; method names are given with them.

---

## 1. Round 1 blocker and majors: are they resolved?

Each was checked against the new text and against the code, not against the plan's own summary.

| # | Round 1 finding | Status | Evidence in the new plan, and what was checked |
|---|---|---|---|
| B1 | An implant hands over the owner's session with nothing the server checks | **Resolved** (moved to 9.3b and redesigned) | P:1198-1223: an implant gives a foothold and no session, needs `needsDropped`, answers `already: true`, and the validator errors on one under `flagRewards` or `eventMappings`. 9.3a's validator refuses `grant_foothold` (P:155-157). One note for 9.3b: the drop record it relies on is not durable today (section 5, note 4) |
| M1 | Switch user and the 403 fallback on a remote desktop go to the physical sign-in path | **Resolved** | P:347-361 defines the remote lockable and says every function that receives it behaves remotely; P:949-951 names both call sites, which are where the code has them (`container-minigame.js:564-568` and `:221-226`); tests at P:960-965; beat P6. Residue: where the player lands when these screens close is still unspecified (N1), and a 403 `unreachable` on a remote desktop has no client rule (minor 4) |
| M2 | "No route" cannot be reached from the view; the rule depended on door order | **Resolved** | Outages moved to 9.3b with rows kept for held sessions (P:1146-1153). The door-order fault is fixed in 9.3a: a desktop request is judged by its `foothold` parameter alone (P:389-397), with the test at P:771-775. Checked against `render_login_desktop` (`games_controller.rb:1862-1874`): the two branches are implementable as written |
| M3 | The share rule refused an open share mapped on a local desktop | **Resolved** | The rule is written once (P:409-416) with a named helper in which a missing list admits everyone; `Game.acl_admits?` does return false for a missing list (`game.rb:1160-1161`), so the new helper is needed. Tests at P:776-780 include "opens from a local desktop with no foothold" |
| M4 | A planted device could come back and be planted twice | **Resolved for room objects** | P:256-266 and the tests at P:722-726. Checked against `apply_room_state_changes!` (`game.rb:1064-1067`) and the inventory add (`games_controller.rb:1013-1023`). Residue: a device whose home is a container is still listed there while planted (minor 5), and a droppable device can be in two places (minor 6) |
| M5 | Generic lookups: contradictory instruction, no negative tests, a small oracle | **Resolved** | P:433-447 names exactly which lookups walk `resources`, gives the resource record its own scope, and answers a refusal like an unknown id; negative tests at P:535-539 and P:781-783. Checked: every caller of `find_scenario_object` and `find_object_in_scenario` runs `unlock_scope_refused?` or `validate_unlock` first (`game.rb:1658-1661`, `:2084`, `:2184`, `:2196`; `games_controller.rb:895`, `:937`). The status codes the plan quotes for "an unknown id" are wrong for two routes (minor 2) |
| M6 | Networks never chain to networks | **Resolved by decision** | 9.3a says plainly that a foothold reaches its own network and nothing else (P:153-154, P:40-42); 9.3b designs the pivot through a session, which ends in a password the server checks (P:1109-1134, decision 3). See section 5, notes 2 and 5, for two things the 9.3b design should settle |
| M7 | In the lab, the payoff did not need the drop box | **Resolved** | The payoff is a headless door controller that admits only Chris (P:1027, P:1032-1038); the server refuses a sign-in there with no foothold (P:489). The validator's "reachable without a foothold" lines exist (P:608-611). The feature scenario's expected lines for that check are wrong (minor 9) |
| M8 | The lab recipe collided with four other plans | **Resolved in this plan**, with a stated precondition | Section 10 now names the content plan, keeps its scope rule (the records share has no `contents`, P:1024), keeps `hot_desk_pc`, the Remote Session item and every global and task id, and starts only when the content plan has been revised (P:1064-1073). Every content-plan id the recipe uses exists in that plan (`dropbox_console`, `door_admin_page`, `kp_dropbox_viewed`, `kp_door_admin`, `opt_dropbox_view`, `opt_door_admin`, `hot_desk_pc`, H5.3, H5.4). The content plan itself still says network reach is "Not built" (its line 163): that is the precondition, not a contradiction |
| M9 | Streams collided on `inventory.js`; cross-plan file lists incomplete | **Resolved inside the slice; not across plans** | `inventory.js` belongs to C1 with two named exports (P:830-835, P:1326-1327). The cross-plan table was added (P:1335-1351) but has wrong and missing rows against the engine plan as it now stands (N2), and two files this slice must edit are in no stream (minor 3) |
| M10 | The slice was three times what the drop box needs | **Resolved** | Split into 9.3a and 9.3b (decision 1); the lab is step 9 of 9.3a |

Round 1's 22 minors were spot-checked: each is taken, moved to 9.3b with its fix (12.2, 12.3), or
declined with a reason in section 17. None is reopened here except where a new finding says so.

---

## 2. New majors

### N1. Getting back to the network view is promised in four places and specified in none; the framework's own return feature does not fit

- **What the plan says.** "Closing a desktop or a share that was opened from the view returns to
  the view, not to the world" and the view refetches "when the player returns to it from a sign-in
  screen, a desktop or a share" (P:341-343). Switch user on a remote desktop returns to the desktop
  (P:357-358). `network-links.js` has `open(footholdId, { returnTo })` (P:838). Step 8 says only
  "closing returns to the view when it was opened from there" (P:953-954).
- **What the code does.** One minigame runs at a time: starting one ends the one that is open
  (`minigame-manager.js:57-70`). The framework has a parameter called `returnTo`, but it reopens the
  parent only on a normal exit, `success === true` (`minigame-manager.js:315-322`). The desktop's
  Close button calls `this.complete(false)` (`container-minigame.js:552-555`), and leaving the
  sign-in screen without signing in is a failure close whose `onComplete` reopens the desktop only
  when a session is held (`unlock-system.js:314-319`). So a builder who reads `returnTo` at P:838 and
  reaches for the framework feature of the same name gets a view that never comes back on Close,
  which is the common case.
- **Two return mechanisms already sit under the desktop.** Reading a file or opening a folder on a
  desktop closes the desktop, stores `window.pendingContainerReturn` and hands a stand-in sprite to
  `handleObjectInteraction` (`container-minigame.js:739-757`, `:785-802`); the reader then reopens
  the desktop. A "return to the view on close" that does not know about this will reopen the view
  over the file the player just opened. Switch user, Sign out, "The link dropped" and a 403 each
  close the same desktop for a different reason and need a different landing place.
- **The engine plan makes it worse.** Its capture log reopens itself with "a one-shot listener on
  the view's close" (engine plan line 696). The view closes every time the player opens a host from
  it, so that listener fires on the first hop and puts the log over the sign-in screen.
- **Fix.** Add a short subsection to 4.3 and to step 8:
  1. `network-links.js` owns the return: it keeps the foothold id of the view the player is "in"
     and exposes `resume()` (reopen that view and refetch) and `leave()` (forget it). The framework's
     `returnTo` and `suspended` are not used. Rename the option at P:838 to avoid the clash, for
     example `open(footholdId, { then })`.
  2. A table of landings: remote sign-in closed with no session, the view; signed in, the desktop;
     desktop Close, the view; a file or folder opened from the desktop, the desktop (never the
     view: `resume()` is skipped while `window.pendingContainerReturn` is set); Switch user
     cancelled, the desktop; Sign out, the view; "The link dropped" and a displaced session, the
     world; a share opened from the view and closed, the view; the view's own Close, the world, and
     that alone emits `network_view_closed`.
  3. Tell the engine plan to listen for `network_view_closed`, not for the minigame's close.
  4. Client tests for each row of the table, and in the scripted runs: P5 reads the handover note
     and returns to Lena's desktop, then closes to the view.

### N2. The contract with the engine feedback plan is wrong in several rows, and section 13.4 describes a capture log that plan no longer designs

The plan says the engine streams "may run at the same time" (P:1332-1333), so this table is what
stops two builders overwriting each other. Checked against
`PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md` as it stands:

| Subject | This plan | The engine plan | Consequence |
|---|---|---|---|
| `tools/playtest/lib/access_leak_scanner.rb` | "Engine E4's edit is to `access-leak-check.rb` only; stream T edits the two library files" (P:1348) | E4 owns both files, "the device's DOM" (line 1009), and its shared table gives the order 9.3 T, E4, 9.1 E (line 1030) | Two builders believe they alone edit the library |
| `Game#attempt_login!` | "This slice does not edit either engine method" (P:1344); step 4 rewrites the method to take `foothold:` (P:741) | E4 adds a `pcSessionsEver` line inside `attempt_login!` (lines 754, 1009) | The one method both plans rewrite is not in the table |
| `games_controller.rb` | Shared with 9.1 and 9.2 only (P:1345) | E3 edits `CLIENT_ITEM_FORBIDDEN_FIELDS` and `item_add_params` (line 1008) | Missing row |
| `minigames/index.js`, `core/game.js` | No engine stream named (P:1341-1342) | E4 adds a registration line; E2 adds two preload lines (lines 1009, 1024, 1031) | Missing rows |
| `inventory.js`, `interactions.js` | C1 owns both; E3 first if it has started (P:1337-1338) | Names the streams as "9.3 C2" and "9.3 C1" and says 9.3 goes first (lines 1021-1022, 1039) | Same intent, different stream names and a different default. Pick one order before either starts |
| How a link item is filed | By a `storeIn` copied from the jack's `linkStoreIn` (P:179, P:281, P:1286-1288) | By type: the holder lists `holds.types: ["network_link"]`, because a server-made item "can carry no authored field" (lines 655, 667-669), and `storeIn` joins the fields a client item may not carry (line 592) | Two mechanisms for one job. `linkStoreIn` is a schema field, a room-data deletion, a link-item field and a test that nothing needs |
| The inventory menu | A `network_link` has one entry, "Open" (P:1298-1299) | No menu at all for a link item: its click acts (lines 543, 548-550) | Same result; this plan's wording is out of date |
| Opening from the log, and coming back | `open(footholdId, { returnTo })`, and `openSession(pcId)` for remote sessions listed from `pcSessions.list()` (P:1294-1303) | Every row runs the item's ordinary click on its tray element; the return is a close listener (lines 691-698). It lists link items, not sessions | See N1; and `openSession` has no caller in that design |
| The lab's Remote Session item | Left as it is (P:1040-1043) | "With 9.3's implant step the lab's hand-written session item is deleted and Sofia's desktop is a real session" (lines 636-637, 716-719) | The engine plan describes round 1's implant, which no longer exists |

- **Fix.**
  1. Correct the five file rows in P:1335-1351 and add the missing ones. For `attempt_login!`:
     this slice first; E4 then adds its one line (or reuses `signedInPcs`, which already records the
     same fact, `game.rb:1885-1886`).
  2. Decide the `inventory.js` and `interactions.js` order once and write the same sentence in both
     plans. Recommended: C1 first, because its two exports are small and E3 rebuilds the tray around
     them; E3's `refreshInventoryTray()` is then called at the end of `syncInventoryFromServer`.
  3. Drop `linkStoreIn` and the link item's `storeIn` from 9.3a and say in 13.4 that the holder
     claims link items by type. That removes a field from sections 3.3, 4.1, 6, 7.1 and 10.1 and a
     test from step 3.
  4. Rewrite 13.4 items 2, 4, 5 and 6 to the engine plan's current design, and ask that plan's
     owner to bring its lines 636-637, 716-719, 1021-1022 and 1039 into line (the implant, the
     stream names) and to use the signal in N1.

---

## 3. New minors

### Wrong claims about code

1. **The server does set scenario globals today.** P:78 says "Today the server never sets a
   scenario global itself". `apply_task_set_globals!` writes every declared global in a task's
   `onComplete.setGlobal` when the server completes the task (`game.rb:3755-3780`, called from
   `complete_task!`). Round 1 recorded the claim as right; it is not. This helps the plan: a global
   set this way follows a check the server made. Fix: correct P:78 and P:1267, and use it in the
   lab (minor 10).
2. **"As for an unknown id" is not 404 on two of the three routes.** `POST /unlock` answers an
   unknown object 422 "Invalid attempt" (`games_controller.rb:897-913`, `game.rb:2168-2169`), and
   `POST /inventory` answers an unknown item 422 with "Item not found in scenario: <type>"
   (`:1013-1018`, `:2022-2025`), yet P:493-494 say 404. Only `GET /container` is a 404
   (`:551`). The no-exposure test's wording, "exactly as it answers an invented id" (P:535), is the
   right rule. Also unstated: the status of each refusal of `POST /network/unplug` and of check 1
   and 2 of `POST /network/plant` (P:486-487). Fix: replace the three "404" cells with "the same
   status and body as an invented id on that route" and give the plant and unplug codes.
3. **Two files the slice must edit are in no stream, and the routes need action names.** Every
   action calls `authorize @game`, Pundit is a hard dependency of the gem, and
   `app/policies/break_escape/game_policy.rb` has one method per action (`login?`, `container?`,
   `capture_secrets?` at `:53-95`). Three new actions with no policy method raise on every request.
   Step 3 lists the routes as `post 'network/plant'` (P:705) with no `to:`; inside the member block
   the existing nested paths all name their action (`config/routes.rb:46-49`). And every minigame
   stylesheet is a `<link>` in `app/views/break_escape/games/show.html.erb` (`:25-47`), which step
   8's "and its stylesheet" (P:933) does not mention; the engine plan's E2b and E4 edit that file
   too. Fix: name the actions (`network`, `network_plant`, `network_unplug`), add `game_policy.rb`
   to stream S and `show.html.erb` to stream C2 and to the shared-file table.
4. **A host row has three states and the plan lists them as alternatives without an order; a 403
   `unreachable` on a remote desktop has no client rule.** After beat P7 the kiosk is both "remote
   sign-in off" and "a session is held" (P:333-336). If the row shows **Open**, the server answers
   403 `unreachable` (P:492), and step 8 defines only the `no_session` case (P:359-360, P:950).
   Today's code treats any 403 as "no session", drops the client's copy and opens the sign-in
   screen (`container-minigame.js:221-226`). Fix: "remote sign-in off" wins and the row carries no
   session; a 403 `unreachable` on a remote lockable keeps the client's session, closes the desktop
   and returns to the view with a one-line reason. Add both to the view test.

### Secrets, trust and refusals

5. **A planted device is still listed in its container.** The device may be defined in a
   container's `contents` (P:173-176). While it is planted it is in no inventory, and
   `filter_container_contents` hides only what the inventory holds
   (`games_controller.rb:1885-1911`), so the box reappears in its crate; the add is refused, but an
   honest player sees a second box they cannot take. Fix: `filter_container_contents` also drops a
   `planted_device?` item; step 3's "five homes" test asserts, for each home, that the device is not
   offered again while planted.
6. **A rogue device that is `droppable` can be dropped and planted.** A player drop writes the item
   into the room and does not take it out of the server's inventory
   (`Game#add_item_to_room!`, `game.rb:426-452`). The same goes for a device another object consumes
   with `consumesItem`: the device is gone and the chain cannot be started. Fix: validator errors
   for `rogueDevice` with `droppable`, and for a `rogueDevice` named by an object with
   `requiresItem` and `consumesItem`. While there, add: `networkJack` on a takeable object (error);
   a sign-in host on a network whose `contents` hold physical items such as a key or a keycard
   (warning: they would be taken over the wire).
7. **`accounts` and `revealSecret`.** `capture_secrets_for_client` returns nothing at all unless
   `social.captures.revealSecret` is true (`game.rb:911-912`), and its single-secret fallback can
   answer an entry the account pass did not (`:948`). P:365-370 and P:496 do not say whether
   `accounts` is gated the same way. If it is, "fills the username always and the password only
   when `secrets` has it" (P:969) can never differ. Fix: state that `accounts` is every capture
   entry whose address is an account's username and that has a capture route, whatever
   `revealSecret` says, computed apart from the fallback; it carries only what the browser wrote.
8. **The `container` action is described in the code as a read that could lose its lock.** Its
   comment says it "never writes player_state" and is "a candidate to simply drop the lock"
   (`games_controller.rb:515-525`). After this slice it clears a session's `foothold` (P:394-397).
   Fix: step 4 rewrites the comment, and a test asserts the write survives a concurrent unplug.
9. **The feature scenario's expected validator lines do not match the validator's own rule.**
   P:918-920 expects "reachable without a foothold" lines for `sam_pc`, `kiosk_pc` and
   "Scanned-Inbox". By P:608-611 the line is for shares **with** an access list and for hosts, so
   an open share is not on it. And "Ledger-Archive" should be: every NPC with creds has the implicit
   `staff` role (`Game.identity_roles`, `game.rb:1150-1157`), so Lena signs in at `sam_pc` and at
   `kiosk_pc`, both in open rooms, and her desktop there maps it. The chain still needs the box at
   `door_box`, so the scenario is sound; the expected output is not. Fix: correct the list, and say
   in the scenario notes that Lena and Ian are also `staff`. Two more gaps in the same scenario: the
   starter letter must give Lena's username as well as her password (the remote screen has no
   tiles, P:363-365), and task titles ship in the bootstrap, so they must not contain a network,
   host or share name or the leak check will report them.
10. **In the lab, the two objectives still rest on globals the browser sets.** The pages are
    server-enforced, but `kp_dropbox_viewed` and `kp_door_admin` are set by client mappings and the
    tasks completed from them (P:1028-1029), and `opt_netdrop` by `completeTask` on a client event
    (P:1013). The plan's own rule is that a step that must not be skipped ends in something the
    server checks (P:54-57). Fix, for the content plan's owner to accept: make `opt_netdrop` an
    `unlock_object` task on `network_port` and `opt_door_admin` an `unlock_object` task on
    `door_controller` (the server checks `gainedFootholds` and `signedInPcs`, P:495), each with
    `onComplete.setGlobal` for the global Ruth's ink reads, which the server then sets itself
    (minor 1). `opt_dropbox_view` can stay a mapping: looking is not a gate.
11. **"Host label" is used for two things with opposite rules.** Section 6 says the rule protects
    "host labels" (P:510-511) and the no-exposure test asserts that no room answer contains a "host
    label" (P:532-534), while room data ships `host` on every sign-in object (P:516) and 3.2 calls
    it not secret (P:165-166). Fix: say "a resource's `host`" wherever the protected one is meant.
    In the lab the share is named "records" (P:1024), a word that is in public text all over the
    scenario, so the leak scanner skips it by its own rule (P:806-808); give it a name the scanner
    can check.

### Reload, soft locks and the session slot

12. **`<jackId>_planted` can stay true after a lost sync.** The plan restores it from `jackPlanted`
    in room data (P:640-642), which arrives only when the jack's room loads. An unplug followed by
    a crash before the 30 second sync leaves the saved global true, so variants and
    `revealOnGlobal` in other rooms show the planted state. Fix: on load, `network-links.js` sets
    `<id>_planted` for every id in `gainedFootholds` from the `footholds` list in the scenario
    response, before any room loads.
13. **A remote sign-in replaces a local session in the one slot, and the unplug then deletes it.**
    P:384-387 keeps one session per PC. A player signed in at `sam_pc` at the keyboard who signs in
    there again from the view now holds a session with a `foothold`; unplugging ends it, and the
    PC asks for a password at the keyboard too. Acceptable, but nothing says so and no test covers
    it. Fix: one sentence in 4.4 and a case in the remote sign-in tests. Say also what the view
    does with a claimed session (P:335 shows **Open** for any session; section 5 refuses a claim
    over a foothold): recommended, a claimed session is not offered over the network.
14. **The unplug prompt is the only thing a click on a planted jack does.** A player who clicks
    their box to use it is asked to remove it. `window.gameConfirm` takes button labels
    (`notifications.js:264`), which P:82 and P:1400-1402 overlook. Fix: "Your drop box is plugged in
    here. Open it from your inventory." with the buttons "Unplug it" and "Leave it".
15. **`device_id` and the default hint are left to the builder.** P:486 says "the one named by
    `device_id`, else the first": say whether a named device that is not held falls back or is
    refused (recommended: refused, `no_device`). P:300 uses "the jack's resolved
    `requiresItemHint`" and gives no default for a jack that sets none.

### Tests, tooling and steps a builder would guess

16. **How a share stub opens, and what else changes for `source_resource_id`.** Left to the
    existing path, a click on an unlocked container inside a desktop goes through
    `handleObjectInteraction` to `POST /unlock` with `method: "unlocked"`, which succeeds for an
    admitted share and writes the resource id into `unlockedObjects` (`game.rb:2097-2106`,
    `games_controller.rb:934-949`). P:952 wants a `GET /container` fetch; say that the stub has its
    own branch and never takes the unlock path. Then name the four places that today test
    `source_pc_id` and need the new source as well: `offersTransfer` and `takeItem`
    (`container-minigame.js:577-579`, `:893-900`), the stand-in sprites that carry `sourcePcId`
    into a nested folder (`:751`, `:796`), the "already held" shortcut and the Copy record on the
    server (`games_controller.rb:1009`, `:1030`).
17. **The scripted runs have nothing to drive the view with.** Step 6 adds two read-only bridge
    calls (P:815-817). The runs must click a host row, a share row, a captured sign-in and the
    jack's confirm. Fix: give the rows stable attributes (`data-host-id`, `data-resource-id`,
    `data-action`) in step 8, document them in `docs/test-bridge.md`, and say which bridge call
    answers a `gameConfirm`.
18. **Stream F can author the scenario before the withholding exists.** Step 2 is "before any
    scenario is authored with a network" (P:689), because a new top-level key ships as authored
    until the bootstrap deletes it (P:77). Stream F starts "when stream T's validator is committed"
    (P:1323), which can be before step 2. Fix: F starts when step 2 and T's validator are both in.
19. **"A step is done when" omits a check `AGENTS.md` requires of engine changes.** The phone reopen
    check (`node scripts/ink_runtime_check/reopencheck.mjs ...`, `AGENTS.md` line 182) is not in
    P:660-662. Step 7's objectives test has no file name (P:866); the pattern is
    `test/js/objectives-signin-pc.test.mjs`.
20. **`headless` already means two other things here.** The server has `headless_npc_records` and
    `headless_email_npc?` for NPCs with no room (`game.rb:2348`, `:2394`), and every run in this
    plan is a "headless" browser. A third meaning on a scenario field will be misread in logs,
    tests and reviews. Fix: consider `networkOnly` or `noConsole`; if the name stays, say so in the
    README section.

### Sibling plans

21. **Slices 9.1 and 9.2 are not quite "no disagreement".** P:1235-1253 says both were re-read and
    agree. 9.1's section 14.5 still ends "The first slice plan's order stands (9.1, then 9.2, then
    9.3)". 9.2 adds its station-down lines to "9.3's `network_view` and `session_usable?`" (its
    lines 791 and 1501); `session_usable?` no longer exists and the helper is
    `desktop_request_allowed?` (P:749, P:1261). Neither blocks 9.3a. Fix: list both in 13.1 and
    13.2 as text for the siblings to correct.
22. **`NetworkModel.reach_conditions(station_network, resource)` takes no scenario data.** In 9.3a
    two arguments are enough (P:322-325, P:669-670). In 9.3b the answer needs the links and each
    network's `downIf` (P:1164-1167), and slice 9.2 will already be calling the two-argument form.
    Fix: give it the scenario data now, `reach_conditions(data, station_network, resource)`, as
    every other function in the module has (P:667-669).

---

## 4. The mechanic: fun, simple, true

**Simple enough.** One device, one click to plant, a list in the desktop frame, the sign-in screen
the player already knows. Opening the view by itself after the first plant (decision 10) answers the
user's request directly. The view has three row kinds, which is the most a list should carry;
9.3b should add to it sparingly.

**It chains.** The feature scenario's chain is five links, each a server check: a sticky note, an
open share, a remote sign-in behind a locked door, a share that follows the account, a device with
no screen. That is the user's principle, and `headless` is the field that makes it hold: without it
every payoff can also be reached by walking (decision 9 is right).

**What it teaches, and whether it is true.**

- An unused live port is a foothold on the whole segment: true.
- A captured password works from anywhere on the network, and guessing remotely locks the real
  user out: true, and the shared lockout is a good consequence to show.
- A share with no access list is open to any device: true (the guest share).
- Shares follow the account: true. The padlock's text, "It opens from that account's desktop", is
  a simplification (a real attacker would authenticate to the share from the box), and it is a fair
  one for one mechanic. Keep the wording as "needs an account with access".
- A policy can turn remote sign-in off, and the player sees the control: true and well placed.
- Taking the kit back ends what depended on it: true, and it removes the soft lock.

**Risks to fun.** Typing a username and password with no tiles is right for a remote screen but is
the slowest moment in the loop; the captured list covers captures only, so a password read from a
note is typed in full. Consider letting the list also offer usernames the player has already
signed in with. The unplug prompt on the jack (minor 14). And the navigation in N1: if a close ever
drops the player to the world mid-chain, the feature will feel broken however sound the server is.

---

## 5. 9.3b: will the reserved fields box it in?

Not reviewed in depth. The reserved names (`networkLinks`, `downIf` and `wifi` on a network,
`wifiAp`, `portSecurity`, `portSecurityMessage`, `grant_foothold`) and the generic foothold record
(`via`, `network`, `source`, `device`, `seq`) leave room for all five parts. Six notes, ungraded:

1. `reach_conditions` needs the scenario data from the start (minor 22).
2. **A host has one `network`.** The pivot in 12.1 crosses `networkLinks` between whole networks,
   so every PC on the office LAN is a way to the servers. The usual real control is the opposite:
   only named jump hosts reach the server network. A dual-homed or allow-listed host needs either a
   list on the object or a per-host link. Keep `network_of` returning one id in 9.3a, but do not
   let the schema forbid a list later, and write `NetworkModel` callers against "the networks of an
   object".
3. **The reason given for "a rogue device is not a member" is not generally true.** A firewall
   between two segments filters by address, and a box on the office LAN has an office address
   (P:1113-1115). The rule is still good design; teach it as "the servers accept connections only
   from managed machines", which is true where it is done, or as the jump host of note 2.
4. **`needsDropped` has no durable record to read.** A drop is an entry in the room's
   `objects_added`, which goes when the item is picked up (`game.rb:444-452`). The engine plan's
   grow-only `droppedItems` list (its line 753) is what 12.5 needs; name the dependency.
5. **Sitting down at a pivot host would cut the pivot.** 9.3a clears a session's `foothold` when
   its desktop is served at the keyboard (P:394-397); 12.1 extends reach through "a session whose
   `foothold` is this one" (P:1124-1126). Define the pivot as any session at a host the foothold
   reaches, so 9.3a's rule stays harmless.
6. **An outage need not be client-written.** A task's `onComplete.setGlobal` is set by the server
   (minor 1), so a `downIf` global tied to a server-checked task is stronger than 12.2's "pacing,
   never protection" allows for. Also say in 13.2 that until 9.3b is built a scenario cannot author
   a network `downIf` (9.3a's validator refuses it), so slice 9.2's `routes` are always `[[]]` or
   `[]` in between.

---

## 6. Claims checked and found right

Recorded so the next round need not repeat them.

- Section 2's rows for sign-in, sessions, scoped objects, access lists, the sign-in screen,
  captures, the lab's drop box and Remote Session, the bootstrap, positions, the inventory (server
  and client) and the click order: all as the code has them (`game.rb:824-898`, `:907-952`,
  `:1234-1328`, `:1416-1441`, `:1752-1758`; `games_controller.rb:526-570`, `:987-1061`,
  `:1862-1874`, `:1964-2127`; `unlock-system.js:268-322`; `interactions.js:797-866`;
  `inventory.js:171-176`, `:251`, `:485`). The one wrong row is globals (minor 1).
- No scenario has `networks`, `resources`, `networkJack`, `rogueDevice`, `headless`, or `network`
  or `host` on an object; the existing `host` keys are inside `usePayload`, `addCapture` and a
  minigame's data, where the room filter does not descend. Deleting `network` in
  `filter_requires_and_contents_recursive` touches nothing today.
- `PUT /sync_state` writes only its named sections (`games_controller.rb:1580-1680`), so a browser
  cannot write `footholds`, `sessions` or `gainedFootholds`.
- The forged-device case is closed: a client item with no scenario source is stored only as a
  notepad or a decor cup type (`games_controller.rb:1944-1948`, `:1979-1988`), which no rogue
  device's type will match.
- The lab recipe's logic holds against the lab file in this repository: `kit_dropbox` is a
  takeable item with an id; `network_port` has the three fields the recipe removes; the only
  readers of `kp_netdrop_planted` are Ruth's mapping and the removed object; Chris has creds and a
  capture route; `social.captures.revealSecret` is true, so the captured list can fill his
  password; `store_room` is behind a pick lock and `store_shelf`'s text places the controller
  there.
- Every file, helper and test the plan extends exists: `ACCESS_STATE_DEFAULTS`,
  `stamp_scenario_object_ids!`, `check_access_model`, `create_access_game`,
  `test/support/access_model_scenario.rb`, the leak scanner and its test, `test-bridge/access.js`,
  `validator-access-model.test.mjs`, `dungeon-graph-identities.test.mjs`,
  `password-signin-mode.test.mjs`, `pc-sessions.test.mjs`, the concerns `CarryOver` and
  `ScoreBreakdown`, and the sprites `drop_box1`, `pi_cluster1`, `network_rack1` and `pc_desktop`.
- The run plans A, B and C are each completable in the order given, and the server records in the
  beat table follow from the rules in sections 4 and 5.
