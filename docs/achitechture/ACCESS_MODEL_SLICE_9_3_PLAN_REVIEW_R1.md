# Access model slice 9.3 (networks): adversarial design review, round 1

Reviewed: `docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md` as it stood on 2026-11-10, against the
working tree of branch `claude/break-escape-access-design-090sjx`. Read-only: no code or plan was
edited and nothing was run against a server.

**Counts: 1 blocker, 10 majors, 22 minors.** Sibling mismatches are listed separately in section 5
(7 with slice 9.1, 12 with slice 9.2, 8 with the engine feedback plan, 9 with the lab's content
feedback plan); the ones that need a change to this plan are also counted above.

**The sibling plans moved during this review.** Slice 9.1 was rewritten at 11:28 and is read here
in that version. Slice 9.2 was being rewritten when this review closed (200 lines of the new
draft existed at 11:34); section 5.2 is against the complete draft of 11:18 and marks what the
new opening already settles. `PHYSICAL_PENTEST_FEEDBACK_PLAN_CONTENT.md`, which the plan under
review never names, holds the lab's own design for the drop box and is the most important of the
four (M8, section 5.4).

**Verdict: revise before build.** Steps 1 to 8 are sound in outline and the claims about existing
code are almost all right (section 6 lists what was checked). The blocker is confined to step 9
(implants). The majors are a handful of rules that will not behave as written (remote desktop
paths, "no route", open shares, the planted device), one design gap against the user's chaining
principle (networks never chain to networks), and the lab recipe, which today collides with four
other plans and does not need the drop box for its payoff.

References: `P:n` is a line of the plan under review. Code lines are from the working tree and
will move; method names are given with them.

---

## 1. Blocker

### B1. An implant hands a modified client the owner's whole session with nothing the server checks

- **Evidence.** `POST /network/implant` checks only that the scenario declares a `grant_foothold`
  for that PC, with "No reachability check" (P:451). The claim that follows opens the owner's
  session with no password, with the owner at the desk, kept across reloads (P:366-370, P:454).
  The plan grades this "Client-claimed, exactly like a declared grant" (P:422). It is not the same
  strength in effect. A declared grant today yields the item's own hand-written contents
  (`games_controller.rb:2007-2016`, `Game#held_grant_items`). An implant yields a foothold, the
  view of every host on that network, the owner's desktop, every profile the owner is admitted to
  and every mapped share. In the lab recipe that is Sofia's finance session and the records share
  (P:956-960), whose proposed content is the archive safe's combination (P:948-950). A client that
  sends two requests at game start gets all of it. The first slice's nearest equivalent, the
  claimed session, at least requires the PC's room to be open on the server
  (`Game#claim_login_session!`, `game.rb:1452-1454`) and ends on reload.
- **It breaks the plan's own rule.** "A puzzle that must not be skipped therefore ends in a
  password or key the server checks" (P:425-426). The BadUSB chain as written has no such step.
- **Fix (pick one, state it in 4.8 and section 5).**
  1. Give `grant_foothold` a server-side precondition the route checks: `"needsDropped": "<item
     id>"`, true when the server's own record shows that item left the inventory through a drop
     (`add_item_to_room!` already accepts a drop only of a held droppable item), and optionally
     that the PC's room is unlocked or never locked. The validator errors on an implant with no
     precondition.
  2. Or keep the client claim but give it only the foothold (the view), never a session: the
     owner's desktop then still needs the owner's password through the ordinary remote sign-in,
     which the server checks. The lab's BadUSB beat becomes "the stick gives you the network; the
     keylogger or the phish gives you the account", which is also a better chain.
  3. Or cut step 9 from this slice (see decision 4 in section 4).
- Also add to the route: an `already: true` answer for a repeat (the plan says a second grant "is
  harmless", P:960-961, but the route table has no such check), and a validator error for a
  `grant_foothold` under `flagRewards` (the flag station runs `applyActions` on the client, while
  `DeclaredGrants::SKIPPED_KEYS` keeps that path off the server's list,
  `lib/break_escape/declared_grants.rb:32`).

---

## 2. Majors

### M1. A remote desktop's Switch user, and its 403 fallback, go to the physical sign-in path and strand the player

- **Evidence.** The plan says everything a local session allows, Switch user included, "works the
  same way" (P:344-347), and keeps `/login_accounts` on its physical check "so tiles are never
  served over the network" (P:463-464). The desktop's Switch user button calls
  `window.openLoginSignIn(this.containerItem, { switching: true })`
  (`container-minigame.js:568`), which first calls `GET /login_accounts` and, on a 403 or 404,
  shows "This PC can't be reached" and returns (`unlock-system.js:275-286`). For Lena's PC in the
  locked `finance_office` (beat N5) that is always a 403 (`games_controller.rb:1109-1111`). The
  same function is the fallback when a desktop fetch answers 403
  (`container-minigame.js:221-226`). Step 8's file list for the container minigame covers the
  header line, shares and the two closes (P:855-858), not these two call sites.
- **Fix.** State in 4.4 and step 8: a lockable built by `openRemoteSignIn` carries `remote: {
  footholdId }`, and `openLoginSignIn` (or one wrapper both call sites use) routes a remote
  lockable to the remote screen with no `/login_accounts` request. Add client tests: Switch user on
  a remote desktop opens the remote screen; a 403 `no_session` on a remote desktop returns to the
  network view, not to the physical sign-in screen. Add a suite beat: N5 then Switch user to Sam
  (refused), still on Lena's desktop afterwards.

### M2. "No route" for a held remote session cannot be reached from the view, and beat N9 contradicts the view rule

- **Evidence.** A linked network that is down is "one greyed line ... with no rows" (P:313-316,
  P:477). A remote session whose route is down "is kept but answers 403 ... the client ... shows
  'No route to <host>'" (P:361-364). With no rows there is no **Open** to click, yet N9 says "The
  view shows 'Servers: no route'. **Open** on `HB-SRV-01` answers 'No route to HB-SRV-01'" (P:821).
  The only way to see that answer is a desktop already open or a stale view.
- **Second fault in the same rule.** `session_usable?` is "physically reachable, or the foothold
  route" (P:354-359). The test scenario gives each remote-only room a PIN door "so ... a run can
  look at the PC afterwards" (P:806-809). Once a run has opened `server_room`, `HB-SRV-01` is
  physically reachable, so the server serves its desktop with the network down and N9's expected
  403 never comes. The beat's result depends on door order.
- **Fix.** (a) Under a "no route" line, keep a greyed row for each host with a session held
  through this foothold, whose click shows "No route to <host>"; say so in 4.3 and section 6.
  (b) Decide whether a session carries how it is being opened: the simplest honest rule is that a
  request naming a foothold (`GET /container/:id?foothold=`) is judged on the route alone, and a
  request without one on the physical rule alone. Then N9 is stable whatever doors are open. (c)
  Rewrite N9 to match and add the server test "route down, room unlocked".

### M3. The rule for who may open a share refuses an open share mapped on a local desktop

- **Evidence.** A desktop maps every share "whose `access` admits the session's identity (or that
  has no `access`)" (P:379-383). The gate on its contents, `resource_admits_player?`, is true when
  "the share is open and some held foothold reaches it, or some usable session's identity is
  admitted and that session's PC reaches it" (P:389-393). A player with a local session and no
  foothold sees the open share's folder and gets a 403 on opening it: the first half needs a
  foothold, and the second half asks whether an identity is admitted by an access list that does
  not exist. The existing helper answers false for that (`Game.acl_admits?` returns false unless
  the list is a hash, `game.rb:1160-1161`; only `pc_admits_account?` treats nil as "everyone",
  `game.rb:1389-1393`). Step 4's test "an open share opens with a foothold and not without"
  (P:715) would then lock the wrong behaviour in.
- **Fix.** Write the rule once, in 4.5: the resource and its network are up, and some source
  reaches it (a held foothold, or the PC of a usable session), and either the share has no
  `access` or that source is a session whose identity the list admits. Name the helper
  (`resource_acl_admits?(resource, npc)`, nil list admits) so nobody reuses `acl_admits?`. Tests:
  open share from a local desktop with no foothold opens; open share with neither foothold nor
  session is refused; the same pair for Copy.

### M4. The server never marks a planted device as taken, so it can come back and be planted twice

- **Evidence.** The plant removes the device from the inventory and keeps a copy in the foothold
  (P:448). Nothing records that the item has left its room for good. Two existing paths then give
  a second device:
  1. The inventory add for a room item checks only that the room is open and the item is takeable
     (`validate_item_collectible`, `games_controller.rb:2048-2055`; `find_accessible_item`,
     `:2234-2243`). It never asks whether the item was already taken. After a plant, `POST
     /inventory` add for the same item succeeds again.
  2. Room data hides a collected item by `objects_removed`, with the inventory as the fallback
     "even when objects_removed was never written (e.g. StateSync beat removeItemFromRoom)"
     (`Game#apply_room_state_changes!`, `game.rb:1059-1066`). When that removal was lost, the
     fallback has kept the item hidden so far because it is in the inventory. A planted device is
     not, so an honest player sees the drop box back on the briefing table after a reload.
- **Why it matters.** The plan rests two claims on one device being one device: "As strong as a
  keycard pickup" (P:420) and the one box, two jacks reasoning (P:285-287, decision 5).
- **Fix.** In `plant_device!`, add the device's id to `objects_removed` of the room it was
  defined in (when it is a room object). In the inventory add and in `apply_room_state_changes!`,
  treat any `footholds.*.device` as held. Tests: after a plant the device is not in its room's
  data and a second add is refused; after an unplug it is in the inventory once.

### M5. The generic lookups: one contradictory instruction, and no negative tests on the routes that return item text

- **Evidence.** Section 5 says the generic inventory search "skips `resources` as it skips
  profiles" (P:457). Step 4 says "`find_object_in_scenario` and `find_accessible_item` walk
  `resources` (the generic search skips them)" (P:700-701). `find_accessible_item` is the generic
  search (`games_controller.rb:2191`). Built as the first half of that sentence reads, a plain
  `POST /inventory` add naming a share item's id is found, passes (a share has no room and no
  locked container, so no branch refuses it) and the answer returns the stored item, text
  included (`:1032`). `find_object_in_scenario` is what `POST /unlock` uses to return an opened
  object's `contents` (`:937-949`).
- **Ids are not withheld.** The plan's own lab recipe puts `network_share_opened:lw_records` and
  `network_viewed:office_lan` in event mappings (P:952-954), which ship in NPC room data, so a
  resource id is knowable before any foothold.
- **Tests missing.** The no-exposure test covers "`/scenario`, `/room/:id`, a door `/unlock`,
  `/login_accounts`, `/capture_secrets` or `/network`" (P:486-492). It does not cover an object
  `/unlock`, `/inventory` or `/container` against resource ids with no foothold. Step 4's share
  tests cover only "a locked folder in a share" (P:716-719).
- **A small oracle.** `/container` on a resource answers 403 `unreachable` or `no_session`
  (P:456), and an unknown id answers 404, so a client with no foothold can tell that a resource
  exists and whether it is down.
- **Fix.** Correct step 4: only `login_scope_of`, `find_scenario_object` and the controller's
  `find_object_in_scenario` walk `resources`, and each is reached only after the scope check.
  State that `login_scope_of` returns the resource record itself with the `resource` scope (a
  sign-in PC is returned with no scope and guarded by a special case, `game.rb:1755`; a builder
  copying that pattern would leave the share open to `method: "unlocked"`). Answer 404 for every
  resource id while the player holds no foothold and no session. Add to the no-exposure test, with
  no foothold: `/unlock` (`method: "unlocked"` and a wrong PIN) on a resource id, on an unlocked
  item in it and on a locked folder in it; `/inventory` add with no source and with
  `source_resource_id`; `/container` on the resource and on a folder; all refuse alike and carry
  no share string.

### M6. Networks never chain to networks: a link is free, and the only gate between two networks is a client-written global

- **Evidence.** The plan's step 4 is "the next network is one link further on" (P:28-29). But a
  link gives reach at once (P:120-124), so a linked network is not a step, and an unlinked network
  needs a second physical foothold. The one thing that can stand between two linked networks is an
  outage, which the plan itself rates "None" for strength: "display and pacing, not protection"
  (P:406-408, P:423). Pivoting through a PC that sits on two networks is left out, with the note
  that "the hook is cheap" (P:1170-1171).
- **Why it is a major.** The user's principle is that captured access chains into further access.
  For networks the natural form is: a session on a PC is a place to stand. That step ends in a
  password the server checks, which is exactly what 4.8 asks of any puzzle that must not be
  skipped, and it teaches segmentation properly (the server network is reached through the
  finance PC, not from the wall port). Without it the feature scenario's N7 to N8 chain is gated
  only by a global a modified client can clear.
- **Fix.** Bring the pivot in, small: a sign-in PC may list `networks` (or `alsoOn`), and
  `reach` for a foothold adds the networks of every PC with a usable session through that
  foothold. The view shows them as "through HB-FIN-02". Keep outages for pacing and for 9.2. If
  the user prefers to keep it out, say plainly in section 1 and the README that networks do not
  chain in this slice, and drop step 4's wording.

### M7. In the lab recipe, the payoff does not need the drop box

- **Evidence.** The proposed chain is plant, see, sign in remotely as `m.pierce`, find the mapped
  records share on her desktop (P:944-951). Shares map on any desktop "local or remote" (P:379).
  Melanie never locks her screen (`scenario.json.erb:1165`, `locksScreenOnLeave: false`) and her
  PC is in the open accounts room, so the player already claims her session by sitting down while
  she is at the coffee station, and that desktop carries the same records share. The box, the view
  and the captured password are all optional flavour on the way to the same folder.
- **Fix (for the lab plan, but this plan should say it).** Put the payoff behind something only
  the network gives: a sign-in host in a room the player cannot enter, admitted to an account
  whose password is captured elsewhere. The lab's content feedback plan already has exactly that
  step, built by hand: the door controller admin page at LW-DOOR01, which "needs the drop box and
  a captured password" and is gated today on two client globals because remote sign-in "is not
  built" (content plan lines 163-164, 218-224). Make LW-DOOR01 a sign-in host on the office LAN
  that admits Chris's account: the box and the keylogger capture are then both required, the
  server checks the password, and the hand-built gate goes. Add a validator information line for
  any share or host content that is "reachable without a foothold".

### M8. The lab recipe collides with four other plans, and contradicts the lab's own scope rule

Section 10 never mentions `PHYSICAL_PENTEST_FEEDBACK_PLAN_CONTENT.md`, which is the plan that owns
"the lab's story text, rules of engagement, Ruth's lines, objectives and debrief" (P:909-912) and
which has already designed the drop box beat a different way. Each row is a direct contradiction
that would produce conflicting edits to `scenarios/lab_physical_pentest/scenario.json.erb`.

| Subject | This plan | The other plan |
|---|---|---|
| What the drop box shows | A real network view from `networks` and `resources` (P:933-943) | The content plan grants a hand-written inventory item, `dropbox_console`, from a timer on `kp_netdrop_planted`, because network reach is "not built", and says "nothing has to be added to the engine" (content plan lines 163, 166, 211-216) |
| Reading the records share | A task "Reach the records share" on `network_share_opened:lw_records`, with the safe combination suggested as its content (P:948-954) | The content plan keeps client records out of scope as the lesson: the share's folder names may be listed, "reading it ... is a data breach of its own" (content plan lines 142, 205, 214). Opening the share as an objective teaches the opposite |
| Where captured passwords sign in | Remotely at `staff_pc_2`, perhaps widening its `access` to `{ roles: ["finance"] }` (P:945-948) | The content plan adds an unowned `hot_desk_pc` admitting three named people and says "Melanie's PC keeps its claim-only list" (content plan lines 185-198, 248) |
| The chained step | Remote sign-in, then the mapped share (P:944-951) | The door controller page, needing the box and Chris's password (content plan lines 218-224). This is the better chain (M7) and the plan under review does not know it exists |
| The Remote Session item (`scenario.json.erb:291-318`) | Replaced by `grant_foothold`; the hand-written container goes (P:956-960) | The content plan keeps it and renames a file in it (content plan lines 71-73); the engine feedback plan keeps it and adds `storeIn: "capture_log"` (engine plan lines 533-535) |
| `network_port_planted` | Deleted (P:924-926) | The content plan rewrites its text to point at the console (content plan line 250); the engine plan recommends it stays, "the device you planted should be visible where you planted it" (engine plan lines 618-621) |
| `usb_target_pc` | Becomes a sign-in PC owned by Sofia (P:956-960) | The content plan gives it a second affordance and keeps it a plain PC (content plan lines 455-461); slice 9.1 asks for a probe before any sign-in PC is relied on to take an NPC's deliveries (9.1 plan, "What habits offer the lab's feedback pass") |
| Globals and tasks | `network_viewed:office_lan`, `pc_signed_in:staff_pc_2` with `data.remote`, three new tasks (P:952-954) | The content plan adds `kp_dropbox_viewed`, `kp_signed_in`, `kp_door_admin` and the tasks `opt_dropbox_view` and `opt_door_admin`, read by Ruth's ink and the debrief (content plan lines 256-272, 291-308) |
| When the lab file may be edited | Step 10, after step 8 (P:903-905) | Slice 9.1's lab step "never runs alongside another edit of that file" and follows the feedback pass (9.1 plan, section 12, "When"); the content plan's own build edits the same objects |

- **Fix.** Reduce section 10 to two parts. First, what this slice gives the lab with no content
  decision: one network, the jack fields on `network_port`, `rogueDevice` on `kit_dropbox`, and
  Ruth's trigger. Second, a mapping from the content plan's hand-built pieces to this slice's
  fields, for that plan's owner to accept or refuse: `dropbox_console` becomes the link item and
  the view; its three host notes become two service rows and one share whose contents are the
  folder names only; LW-DOOR01 becomes a remote sign-in host; `kp_dropbox_viewed` is set by a
  mapping on `network_viewed:office_lan`; `kp_door_admin` by `pc_signed_in` on the door host. The
  records share's files stay out of reach or carry the content plan's out-of-scope cost. Step 10
  starts only when the content plan has been revised to say which of the two designs it uses, and
  the lab file has one editor at a time.

### M9. Build streams collide on `inventory.js`, and the cross-plan file lists are incomplete

- **Inside this plan.** Stream C1 (footholds) must show a link item "from the route's answer
  without a second request, the way a reload restores `playerInventory`" (P:265-266, P:762-766),
  remove the device on a plant and restore both on an unplug. The reload path uses
  `createInventorySprite`, which is not exported, and the private flag `_restoredFromSave`
  (`inventory.js:251`, `:171-173`, `:485`). So C1 has to add an export to `systems/inventory.js`,
  which the table gives to C2 (P:1137), and both streams start "at once" (P:1136-1137). The plan
  names only `password-minigame.js` as shared (P:1142).
- **Across plans** (9.2 as its draft of 11:18 stood). Section 12.3 lists `game.rb`, `validate_scenario.rb` and
  `scenario-schema.json` as the files shared with 9.2 (P:1085-1088), and 12.2 claims no contact
  with 9.1 beyond three notes (P:1023-1032). The sibling plans' own stream tables also take:
  `games_controller.rb` and `config/routes.rb` (9.2 server stream; 9.1 stream A edits
  `login_accounts`); the `login` action's claim dispatch (9.2 adds `claim: "guest"`, this plan
  `claim: "implant"` and `foothold`, `games_controller.rb:1078-1087`); `pc-sessions.js`,
  `unlock-system.js` and `api-client.js` (9.1 stream A, 9.2 stream B4); `core/game.js` and
  `systems/interactions.js` (9.2 surfaces stream, the `requiresItem` branch);
  `generate_dungeon_graph.rb`; `tools/playtest/lib/access_leak_scanner.rb` and `verify-run.rb`
  (9.1 stream E, 9.2 tooling); `docs/test-bridge.md`; `README_scenario_design.md`; the
  no-password test; and `lab_physical_pentest_secrets_test.rb`.
- **Fix.** Give `inventory.js` to C1 for a named export (`showServerItem(itemData)` and
  `syncInventoryFromServer(inventory)`), with C2's one-parameter edit after it. Replace 12.2 and
  12.3's file lists with the full list above and a single rule: one slice at a time holds each of
  those files, in the order the user picks under decision 1.

### M10. The slice is three times what the lab's drop box needs, and nothing reaches the lab until step 10

- **Evidence.** The lab adoption needs one network, a jack, a device, the view, remote sign-in and
  shares (P:916-951). It does not use Wi-Fi, `networkLinks`, outages, port security or implants.
  The build order puts all of those, a thirteen-beat feature scenario and nine steps ahead of the
  lab (P:599-905), while decision 1's case for building first is that "the lab's drop box beat is
  waiting on it" (P:1156).
- **Fix.** Split the slice. **9.3a:** networks and membership, the jack and rogue device, unplug,
  the link item, the view, remote sign-in, shares, withholding, validator and tooling for those,
  beats N2 to N6, N8 (with the pivot of M6 if taken), N11 and N13, then the lab. **9.3b:** Wi-Fi,
  links and outages, port security, and implants once B1 is settled. 9.3b's schema fields can be
  reserved in 9.3a so no scenario changes shape later. This also shortens the time three plans
  spend in the same files (M9).

---

## 3. Minors

1. **A second access point never joins `gainedFootholds`.** Joining through one access point
   answers `already: true` for the next "and writes nothing" (P:450, P:678-679), so an
   `unlock_object` task or a `network_joined` mapping on the second can never complete (P:213-214).
   Fix: on `already`, still add the access point's id to `gainedFootholds` and emit the event.
2. **A Wi-Fi key can be guessed at request speed.** "Failures are not counted and nothing locks
   out" (P:450). Fine for a player; a script tries a word list in seconds. Fix: a small server
   pause after, say, ten wrong keys per access point per minute, or state it in 4.8 with the
   other strengths.
3. **A desktop fetch does not sync first.** The client syncs before `/network`, a plant and a
   remote sign-in (P:325-327) but not before `GET /container`, so a local desktop's mapped shares
   lag an outage by up to the 30 second sync. Fix: sync before any desktop or share fetch when
   the scenario response carried `footholds` or the last desktop held a `network_share`.
4. **Refetch on any global change is noisy.** The needs and workstation layers publish globals
   continually (`<id>_screen_locked`, `<id>_owner_away`); each change would trigger a sync and a
   `/network` request while the view is open (P:323-325). Fix: the `/network` answer carries a
   count or hash of the outage state the client can compare, or the view refetches on a timer of
   a few seconds only while open.
5. **"Truthy" differs between Ruby and JavaScript.** The server decides `downIf` in Ruby (P:298),
   and slice 9.2's `reaches` and this plan's `routes` decide it in the browser (P:1052-1056). `0`
   and `""` are truthy in Ruby and falsy in JavaScript. Fix: define `NetworkModel.truthy?` to match
   JavaScript, use it everywhere, and test `0`, `""`, `"false"` and a missing key.
6. **The withholding claims overreach.** "No ... `downIf` wiring ships" (P:474) and "the names of
   `downIf` globals" are withheld (P:477), but the validator forces every `downIf` global into
   `globalVariables` (P:522), which ships in the bootstrap with its default, and requested change
   1 ships those names in every NPC's `work` plan (P:1052-1056). Resource and network ids ship in
   event mapping patterns and task titles (P:952-954). Fix: say that ids and global names are not
   secret and that names, hosts and contents are; scope the test and scanner to that.
7. **Captured sign-ins has no username to read and can burn lockout attempts.** A capture entry
   has `address`, not a username (`captures.js:21`); for a landing-page capture the address is
   not an account username and the secret is a portal password
   (`Game#capture_secrets_for_client`, `game.rb:917-949`). Offering those fills a wrong pair and
   counts a failure on a budget that "lasts the mission" (`validate_scenario.rb:6101`). Fix:
   `/capture_secrets` marks which entries are account passwords, and the list shows only those.
8. **There is no two-choice prompt to reuse.** The planted jack offers **Open** or **Unplug**
   (P:276-277); `window.gameConfirm` is OK or Cancel only (`notifications.js:285-287`). Fix: name
   the component (the engine feedback plan's inventory menu panel would do) or specify a small
   one with its test.
9. **Host rows give the synthetic lockable no picture.** A PC host is `{ id, kind, name, host,
   remoteSignIn, session }` (P:477); the container and sign-in screens read `scenarioData` fields
   a room sprite would have. Fix: add `sprite` or `type` to the row, or state the default image.
10. **`pc-sessions.js` maps every 422 that is not locked-out or not-permitted to `wrong`**
    (`pc-sessions.js` `signIn`). A `remoteBlocked` answer (P:453) would emit `pc_signin_failed`
    with reason `wrong`. Fix: add `remote_blocked` to step 8's list and to the event's reasons.
11. **The view does not open by itself.** After a plant the player gets an inventory item and a
    changed sprite (P:281-283). The user's ask is to "see what's been exposed". Fix: open the view
    on the first foothold of each source, and say so in N2.
12. **`network_viewed.first` is per page session** (P:226), so it is true again after every
    reload and a mapping without `onceOnly` fires again. Fix: derive `first` from a saved list, or
    document that mappings must be `onceOnly`.
13. **The phone picture for a Wi-Fi link** (P:263, decision 7) puts two identical phone icons in
    the tray, one opening the phone and one the network view. Fix: a distinct icon before any
    scenario with Wi-Fi ships, even a tinted copy.
14. **Where a rogue device's definition may live is not stated.** "A scenario item definition
    with `rogueDevice: true`" (P:442-444) must be found in room objects, container contents,
    `startItemsInInventory`, NPC `itemsHeld` and declared grants. Fix: list them and test each, or
    read the flag from the server's own stored copy, which `canonical_inventory_item` already
    builds from the scenario and never from the client (`games_controller.rb:1944-1962`).
15. **`login_scope_of` matches on name as well as id** (`game.rb:1774-1777`), and rooms are
    searched first. A room object or profile file whose name equals a resource id shadows the
    share. The validator's new check compares ids only (P:523-525). Fix: compare resource ids
    against names too.
16. **Leak scanner rule is under-specified.** The scanner ignores strings shorter than six
    characters and matches short ones only as whole strings (`access_leak_scanner.rb:43`,
    `:391-393`), so the fixture's share name "Scans" would never be checked and "Servers" would
    match a door sign with the same word. Fix: state the matching rule for names, exclude public
    strings as the scanner does now, and choose fixture names of six or more characters that
    appear nowhere else.
17. **Feature scenario gaps a builder must guess.** `secure_port` has no network named (a jack
    without one is a validator error, P:518); where the PIN codes of `finance_office` and
    `server_room` appear is "later in the chain" (P:806-809); `kiosk_pc`'s `access` is not given.
18. **Two homes for the new state keys.** This plan fills them in `initialize_player_state`
    (P:241-242, P:628-629); slice 9.2 adds its keys to `ACCESS_STATE_DEFAULTS`
    (`game.rb:1123-1126`). Fix: use the constant, as the first slice does.
19. **Section 11 misstates one change.** "`session_usable?` replaces the bare 'PC reachable'
    test" in the inventory add and the scope checks (P:354-355, P:990), but neither has such a
    test today (`validate_login_item_collectible`, `games_controller.rb:2092-2097`;
    `Game#session_admits?`, `game.rb:1288-1305`). It is an added check. Harmless, since rooms do
    not relock, but the first slice's suites should assert it.
20. **Unplug ends a session the player may be using at the keyboard.** A remote sign-in fills
    the one slot (P:349-352); if the player then walks to that PC and uses it, an unplug still
    deletes it (P:449). And a local session is not shown as **Open** in the view (P:317-318)
    although the server would serve it. Fix: on a local use, clear the session's `foothold`; show
    **Open** for any held session.
21. **A remote-only PC with `maxAttempts` is a soft lock.** The lockout is shared and lasts the
    mission (P:339-341). Fix: a validator warning for a PC that is reachable only remotely, under
    a policy with `maxAttempts`, and sits on the only route to something needed.
22. **Tests to add.** Reset with a device planted (the device is back in its room, no link item);
    a controller run against a `player_state` with neither new key; `reach_conditions` on a
    cyclic link graph (the plan asks for "the routes", P:619-621, which is exponential as simple
    paths; say whether the station's and the resource's own network globals are on a route).

---

## 4. The ten decisions

| # | Plan's recommendation | Judgement |
|---|---|---|
| 1 | Build before 9.1 and 9.2 | **Agree, as 9.3a only (M10).** It needs nothing from them. The new opening of 9.2 expects 9.3, then 9.1, then 9.2; 9.1 still says the parent order stands. All of them and the two lab feedback plans take the same files (M9), so the user is really choosing one order for five plans; put that to them as one question |
| 2 | Remote sign-in on by default | **Agree,** with one change: print "doors skipped" as a warning, not an information line, until the author acknowledges it on the PC (`"remote": "allowed"` written out, or a policy). A room default `network` otherwise opens every sign-in PC in the room without the author seeing it |
| 3 | A protected share opens from a desktop only | **Agree.** One mechanic, and it is the lesson. Fix M3 first |
| 4 | Build implants, last | **Disagree as designed (B1).** Either add a server precondition, or reduce an implant to a foothold with no session, or defer it to 9.3b. Its lab use also collides with the two lab feedback plans (M8) |
| 5 | The device can be unplugged | **Agree.** Fix M4, or the reasoning does not hold |
| 6 | Wi-Fi needs no device and no range | **Agree,** and move Wi-Fi to 9.3b: the lab does not use it |
| 7 | Reuse art now | **Agree for the jack and the box; not for the phone image** (minor 13) |
| 8 | Full chain in the lab as optional objectives | **Agree in aim, not in the recipe.** As written the payoff needs no box (M7) and opening the records share is what the lab's content plan forbids (M8). Offer the door controller chain instead |
| 9 | Show a down network as "no route" | **Agree,** and keep rows for held sessions under it (M2). Note it is a name sent for a network the foothold does not reach, so section 6's rule needs the exception written in |
| 10 | Accept resource names in NPC room data | **Agree.** A bark says as much. But the same answer must cover the `downIf` names this plan itself asks 9.2 to ship (minor 6) |

**Fun, simplicity, teaching.** The core loop (plant, see, sign in, read, chain) is easy to grasp
and suits a list view in the existing desktop frame; no new art style is needed. It teaches four
real things with almost no text: an open port is a foothold, a captured password works from
anywhere on the network, shares follow the account, and a policy can turn remote sign-in off. The
risks to fun are discoverability (minor 11), a tray full of link items until the capture log
exists, and thirteen event names for authors to learn. The risk to the teaching is M6: without a
pivot, segmentation is shown only as "linked or not", and the one gate between segments is not a
real control.

---

## 5. Mismatches with the sibling plans

### 5.1 Slice 9.1 (`ACCESS_MODEL_SLICE_9_1_PLAN.md`, the version of 11:28)

That version has read this plan and says "No disagreement" (9.1 section 14.3). The Wi-Fi key's
home is now agreed (`networks.<id>.wifi.psk`, with whichever lands second adding it to
`NpcHabits::Clues.secret_homes`), so P:1027-1030 is out of date: it still says 9.1 expects
`wifi_ap.psk`. What remains:

1. **Build order.** 9.1 section 14.5 says the first slice plan's order stands (9.1, 9.2, 9.3);
   this plan's decision 1 says 9.3 first.
2. **The "key appears nowhere" warning** (P:540-541): 9.1 offers `Clues.readable_texts` and
   `Clues.parts` so both slices agree on what the player can read. This plan does not take the
   offer or say why not.
3. **The lab file.** 9.1's lab step moves `locksScreenOnLeave` off `staff_pc` and `staff_pc_2`
   onto their owners, edits `lab_physical_pentest_secrets_test.rb`, and must not run alongside
   another edit. This plan's step 10 edits both (P:967-969) and names no order.
4. **The probe.** 9.1 asks for a probe that a sign-in PC with `affordance.accepts` still takes
   an NPC's deliveries. This plan converts `usb_target_pc` without it (P:956-960).
5. **The sticky note.** 9.1 serves it only in `GET /login_accounts` for the owner's own
   physically reachable PC; this plan's remote screen skips that route (P:845-847). The two
   agree, but neither says in words that a written-down password is never shown on a remote
   sign-in screen. Add the sentence to 12.2.
6. **Shared files not listed in 12.2.** 9.1's stream A edits `games_controller.rb`
   (`login_accounts`), `unlock-system.js`, `pc-sessions.js`, `api-client.js`, `core/game.js` and
   `core/rooms.js`; its stream E the leak scanner and `verify-run.rb`; its stream B the validator
   and the dungeon graph. 9.1's own 14.5 lists three shared files and this plan's 12.2 none (M9).
7. **Room data on a sign-in PC.** 9.1 adds `hasPostit` in `attach_login_accounts!`; this plan
   adds `host` and calls `attach_network_state!` from the same method (P:645-649). Different
   keys, same few lines of `filtered_room_data`.

### 5.2 Slice 9.2 (`ACCESS_MODEL_SLICE_9_2_PLAN.md`)

Against the complete draft of 11:18 (1147 lines), which is the one section 12.3 of this plan
describes. The rewrite in progress at 11:34 already says, in its first 200 lines: the expected
order is 9.3, then 9.1, then 9.2; reach for an NPC's work "is composed on the server" because
9.3 "never sends networks to the browser"; and 9.3 owns `network`, `host`, `contents` and
`observations` on a resource. That settles items 1 and 2 below in intent and makes P:1047-1058
partly out of date. One new point from the rewrite: a workaround may carry `setGlobal`, "a
declared global the server sets true". That contradicts section 2 here ("The server never sets a
scenario global itself", P:53) once 9.2 is built, and it is the mechanism an outage would need to
be more than client-written (4.6). Every item below must be rechecked when the rewrite is done.

1. Reach: decided in the browser by `reaches(stationId, resource)` in 9.2 (9.2 line 191), on the
   server here. Noted at P:1047-1058.
2. 9.2 ships each resource's `network` id in the NPC `work` plan (9.2 lines 209, 593,
   1104-1106); this plan withholds every network id from room data (P:475).
3. 9.2 ships `downIf` global names in `work`; this plan lists them as withheld (P:477) and then
   asks 9.2 to ship them as `routes` (minor 6).
4. Resource `id`, `name` and `kind` in room data before any foothold (9.2 line 593) against the
   no-exposure test (P:486-492). Noted, decision 10.
5. Validator severity: an undeclared `downIf` global is a warning in 9.2 (section 10, warnings)
   and an error here (P:522).
6. 9.2 warns on "a resource no NPC needs"; every share built for the player here trips it. 9.2
   should exempt a resource with `network` or `contents`.
7. Validator layout: 9.2 puts its checks in `scripts/validate_access_work.rb`; this plan adds a
   function inside `validate_scenario.rb` (P:509-512). Both edit the known-field lists.
8. State keys: `ACCESS_STATE_DEFAULTS` in 9.2, `initialize_player_state` here (minor 18).
9. `POST /login`: 9.2 adds `claim: "guest"`, this plan `claim: "implant"` and `foothold`. This
   plan refuses `claim: "owner"` with a foothold (P:455) and should say the same for `guest`.
   Both rewrite `games_controller.rb:1078-1087`.
10. Lockout: 9.2 decision 5 makes a locked-out account a cause of failed work and a hot-desk
    chain. With the shared counter here, the player can cause that from the drop box. A good
    chain, but neither plan mentions it; decide and write it in both.
11. Workstation `downIf` (9.2) and the view's "not responding" row: noted at P:1070-1073, with
    no owner or test named.
12. File ownership: 9.2's streams own `games_controller.rb`, `config/routes.rb`, `api-client.js`,
    `core/game.js`, `interactions.js`, `pc-sessions.js`, `unlock-system.js`, `tools/playtest/`
    and `docs/test-bridge.md` (9.2 section 13); 12.3 here lists three files (M9). 9.2's decision
    9 also recommends leaving this lab alone.

### 5.3 The engine feedback plan (`PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md`, sections 5 and 6)

1. Filing: the capture log files an item by an authored `storeIn` naming the holder, read "at
   render time from the authored field" (engine lines 541-549, 608-609). This plan expects link
   items to be "filed in the container automatically" by type (P:1095-1098). A link item is
   composed by the server and has no authored `storeIn`. Fix: `link_item_for` copies a `storeIn`
   from the source object (`linkStoreIn`) or from a scenario-level default.
2. Opening: the log's Sessions section lists "stored items with contents; opening one opens the
   container minigame, and closing that returns here" (engine lines 557-559). A link item has no
   contents and opens the network view. The log needs a rule for an item whose own click is its
   opener, and the "returns here" behaviour for the view.
3. Menu: entries are keyed by item kind, and any named item also gets "Examine" (engine lines
   455-463). A link item would get two entries, so every open costs a menu and a second click,
   and `network_link` is not in the kind table. Fix: add the kind, and give it one entry.
4. Remote Session item: kept as `give_item` with `storeIn` there, replaced by `grant_foothold`
   here (M8).
5. `network_port_planted`: kept there, deleted here (M8).
6. Findings: that plan turns `cable_note` and `usb_malware_note` into granted `text_file`
   findings in the log. This plan drops the planted object's finding text and files nothing in
   its place (P:924-926). Decide whether a plant also files a finding.
7. Captures: that plan moves the row renderer to `capture-rows.js` and narrows
   `capture_secrets_for_client`; this plan's Captured sign-ins list reads `readCaptures` and
   `displaySecret` (P:1106-1109, both exist, `captures.js:30`, `:93`). Compatible, but the list
   should use the shared renderer and the narrowed secrets (minor 7).
8. Registration: that plan registers its minigame in `systems/minigame-registry.js`, this one in
   `minigames/index.js` (P:842-843). Both files exist; pick one convention.

### 5.4 The lab's content feedback plan (`PHYSICAL_PENTEST_FEEDBACK_PLAN_CONTENT.md`)

Not named anywhere in the plan under review. The table in M8 gives the contradictions; as a list:

1. The drop box view is a hand-written granted item there and a real view here.
2. That plan states network reach and remote sign-in are not built and gates its chain on two
   client globals; this slice builds both.
3. Client records on the share are out of scope there and an objective here.
4. Captured passwords sign in at a new `hot_desk_pc` there and remotely at `staff_pc_2` here;
   that plan keeps `staff_pc_2`'s list as it is.
5. The chained payoff is the door controller page there and the records share here.
6. The Remote Session item is kept there and replaced here.
7. `network_port_planted` is kept and reworded there and deleted here.
8. Different globals and task ids for the same beats (`kp_dropbox_viewed`, `opt_dropbox_view`
   there; event mappings on `network_viewed` here).
9. Hosts are named LW-FS01, LW-DOOR01 and LW-PRN02 there; this plan invents `lw_scans`,
   `lw_records` and `lw_door_controller` with partly different meanings (a scans share that plan
   does not have; a printer this one does not).

---

## 6. Claims checked and found right

Recorded so the next round need not repeat them.

- Section 2's table: `attempt_login!` order (`game.rb:1416-1441`); sessions and
  `render_login_desktop` (`games_controller.rb:1862-1874`); `login_scope_of`, `session_admits?`,
  `path_unlocked?` (`game.rb:1234-1328`); the bootstrap deep copy and its deletions
  (`game.rb:824-898`; room fields are a whitelist, so a room `network` never ships there);
  globals merged from the client only (`game.rb:278-295`); inventory remove unchecked
  (`games_controller.rb:1034-1036`); click order in `handleObjectInteraction`
  (`interactions.js:797-866`); the lab's drop box, Remote Session and `cable_note` as described.
- No scenario has the new top-level keys or fields (the two `"networks"` hits in
  `ca20_remote_and_mobile_working*` are a nested Wi-Fi list page, unrelated).
- `window.stateSync.sync()` exists and shares an in-flight run (`state-sync.js:411-430`).
- `DeclaredGrants.executed?` and `unexecuted` exist as described; the engine runs actions from
  the listed paths through `applyActions`.
- `with_game_lock` and `set_game` lists, `ACCESS_STATE_DEFAULTS`, reset's `preserved_keys`,
  `end_claimed_sessions!` ending only `via: "claim"`, `complete_task!`'s `unlock_object` branch,
  `objectives-manager.js` and `core/game.js` hooks: all as the plan says.
- Every test file, tool and helper the plan extends exists (`validator-access-model.test.mjs`,
  `dungeon-graph-identities.test.mjs`, `access_leak_scanner.rb`, `verify-run.rb --access`,
  `test-bridge/access.js`, `create_access_game`, the no-password test, the lab secrets test), and
  the sprites `drop_box1`, `pi_cluster1`, `network_rack1` and `phone` exist.
- Event mappings support `setGlobal`, `addCapture`, `completeTask` and `onceOnly` as the Ruth
  change needs (`scenario.json.erb:473`, `:932`).
