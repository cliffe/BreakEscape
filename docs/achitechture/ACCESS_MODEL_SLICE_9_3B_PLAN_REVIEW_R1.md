# Access model slice 9.3b plan: adversarial review, round 1

Reviewed: `docs/achitechture/ACCESS_MODEL_SLICE_9_3B_PLAN.md` at commit `29e8b38cf` (the second
draft, 667 lines, sections 1 to 13), checked against the code in this worktree, the 9.3 plan
(sections 12 and 13) and the 9.2 plan (sections 5.6, 13 and 15).

**Which version.** The plan was rewritten while this review ran. The first draft (`9dfb9a0f5`, 786
lines) had sections 10.1 (lab adoption), 12.4 (files shared with 9.2 L and C) and 14 (open
questions); the second draft folds them into 10, 12 and 13. Findings cite the second draft. Where
the first draft had a different problem, it is noted as "(v1)". A builder should work from one
committed version only; the working copy must not be left half-rewritten again.

**What section 2 gets right.** Checked and correct: `NetworkModel`'s helpers and
`reach_conditions(data, station_network, resource)` (it ignores `data`, answers `[[]]` or `[]`,
`network_model.rb:174`); the foothold record and `foothold_id_for`; `ACCESS_STATE_DEFAULTS` holding
`footholds`, `gainedFootholds` and `droppedItems` (`game.rb:1180`); `host_reachable_through?`,
`desktop_request_allowed?`, `resource_admits_player?`, `mapped_shares`, `network_view`,
`network_rows`; `attempt_login!` (:1521) and `claim_login_session!` (:1563) refusing a claim with a
foothold; `add_item_to_room!` writing `droppedItems` on a `player_drop` (:460); the reserved-field
errors (`validate_network.rb:15-72`) and schema stubs (:209, :212, :220, :5288-5290); the resource
`downIf` at :238; `network-links.js`'s methods and `LANDINGS`; `hostAction`/`resourceAction` and
the row data attributes; `networkLinks` already in `WITHHELD_SCENARIO_KEYS`. The exceptions are
below.

## Blockers

**B1. `player_reach` as written lets a rogue device reach every linked network (5.1).** It starts
with `reach_from(the foothold's own network)`, and `reach_from` is defined as the walk "following
links through up networks". So a jack on `office_lan` linked to `server_net` reaches `server_net`
with no pivot, which breaks 4.1 ("a rogue device's foothold is not a member"), beat N1 and the
no-exposure case in section 7. Fix: `player_reach` starts with `{ own network }` (when up), and only
a session at a host on a network already in the set adds `reach_from(host network)`. Add a unit test
that a foothold with no session never lists a linked network.

**B2. The session-shape implant (`needsSession` + `needsHeld`) has no trigger (5.5, 9.2, N12).**
The validator (9.2) requires the implant's `pc` to be a sign-in object, and a sign-in PC never runs
`triggerOnInteract` or the `requiresItem`/`consumesItem` plant branch: `interactions.js:919-933`
returns into `interactLoginPc` first ("It never runs the generic flow below"), and the 9.2 plan
(line 1081) relies on the same early return. The plan says only "the implant case in
`apply-actions.js` and the trigger path". There is no path that fires `grant_foothold` when the
player "plugs the BadUSB in" at a sign-in PC. The plan must name one, for example a desktop item or
an action-menu entry offered while the player holds a session there and holds `needsHeld`, a
`requiresItem` branch for sign-in PCs ahead of `interactLoginPc`, or a separate object (a USB hub)
on the PC's desk. It must also name which file that lives in and who owns it (see M9). If the
`requiresItem`/`consumesItem` branch is reused, its client-side `removeFromInventory` and
`sendInventoryRemove` race the implant route's own "inventory holds `needsHeld`" check. The plan
must say which side removes the device.

**B3. The Wi-Fi key prompt rests on a password-minigame "key mode" that does not exist (5.3, 12 C
row).** `password-minigame.js` has two modes: the plain password form, which posts
`POST /unlock(targetType, targetId, attempt, 'password')` through `validatePasswordWithServer`
(:619-643), and sign-in mode (`params.signIn`). Neither posts anywhere else. The plain form also
keeps a client attempt counter (`maxAttempts`, default 3, :137, :604), which contradicts "a wrong
key is not counted". The 12 table's "(Wi-Fi key mode, already present for keys)" is wrong against
the code. The plan must design the new mode: params, a post to `POST /network/join` through a new
`ApiClient` method, no attempt limit, the 422 `wrong_key` handling and the test-bridge state. It
must also put that work in stream C's steps.

## Major

**M1. Signing out of the pivot host leaves the onward sessions behind (5.1, 6, N4).** N4's server
record is "No `server_net` session", and the 9.3 sketch (12.1) said "ends the onward session". But
section 6 does not change `POST /logout` (`logout_session!` deletes one key). The onward session
keeps its `foothold`, its network drops out of `player_reach`, and the view no longer lists it.
Because that network is out of reach and not down, it gets no greyed row, so the session goes
silently missing (5.2 says that must never happen). The same happens when a reload ends a
**claimed** pivot session (`end_claimed_sessions!`): pivots may rest on claims (5.1), and claims
end on every reload. The plan must define a cascade: when a session ends, end every session whose
route now needs it (recompute `player_reach` for each foothold and end the sessions on networks no
longer reached), report them as `endedPcIds` the way an unplug does, and handle them in
`pc-sessions.js`. It must also say what happens to onward desktops when a reload ends a claimed
pivot.

**M2. The scoped-request route test trusts a foothold the browser sends (5.2, 6).** Today every
remote session already stores its route server-side (`sessions[pc]['foothold']`,
`start_login_session!`). The plan asks the client to send `foothold` on scoped requests and
re-judges only when it does. A request that leaves it out is judged "a session exists", as today.
Derive the route from the session record instead: a session with a `foothold` is re-judged on
`player_reach`; one without (a local session) is judged as today. The gate "only in a scenario
with any network `downIf`" is also too narrow once links exist, because a pivot can go away with no
outage (M1). Gate on "the session has a foothold and the scenario has links or a network `downIf`".

**M3. The greyed "no route" block cannot be computed from the functions as defined, and it
contradicts section 7 (5.2, 6, 7, N5).** `reach_from` and `player_reach` skip down networks, so a
down network that would be reached through a pivot is never in the foothold's set. Nothing then
says it exists, let alone draws it greyed. A second walk is needed ("reached if every network were
up", from `reach_paths`), and the plan must say which one the view uses. The greyed line is
"<name>: no route" in 5.2, but section 7 says a down route shows "no new name". N5 (a network down
from the start that has never been reached) then shows "Its block shows 'no route'". Decide whether
a never-reached down network is named, unnamed ("A network: no route") or not shown at all, and
make 5.2, 6, 7, N5 and the no-exposure test agree.

**M4. Slice 9.2's USB policy is already on `main` (2, 5.5, 12).** Section 2 says 9.2's sub-slice U
"is not assumed present in `main`", and 12 says "whichever lands second adds `usb_refused?`". In
this worktree (from `main`), `systems/pc-policy.js` (`usbRefused`, `plantRefusal`),
`AccessWork.usb_policy_for`/`plant_refused?` (`access_work.rb:324-339`) and the `plantRefusal` call
in `interactions.js:985` are all present. This slice lands second, so it builds `usb_refused?(pc,
item)` beside `effective_policy` (reading `AccessWork.plant_refused?`), the implant's call and the
validator warning now, unconditionally. As written, section 6's implant route also answers every
failed precondition with `not_ready`, which loses the USB refusal line 5.5 asks for. Keep a distinct
`reason: "usb_refused"` with the line from `pcPolicy`'s table.

**M5. The declared-grant walk only finds `give_item` (4.5, 5.5, 6).** `DeclaredGrants.collect`
records only `identified_give_item?` nodes (`declared_grants.rb:120-134`). "The scenario declares a
matching `grant_foothold`" therefore needs a new collector that reuses `executed?`. That means an
edit to `lib/break_escape/declared_grants.rb`, which no stream owns (M9). 4.5's path list is also
wrong. It names "an NPC `eventMapping` that runs actions", but eventMappings never run actions:
they are `NEVER_RUN_KEYS` in `declared_grants.rb:32`, and no client code applies a mapping's
`actions`. It also leaves out `triggerOnInteract`, `onInteract.actions`, `completionActions` and
`conditionalActions[k].actions`. Copy the path list from `DeclaredGrants`' header.

**M6. A Wi-Fi or implant foothold can never be ended, and its link item is built wrong (6, 8).**
`unplug_device!(jack_id)` resolves through `find_jack`, which requires `networkJack: true`, so
`POST /network/unplug` answers 404 for an access point or a PC. The client's only unplug control is
the jack click (`interactJack` → `unplug`). A link item's click opens the view
(`interactions.js:941-946`), and `networkLinks.leave` only ends the screen trip. Sections 6 and 8
of the second draft do not mention leaving at all. The first draft (v1 6, 8) claimed "`POST
/network/unplug` of a Wi-Fi foothold ... no route change is needed", which is wrong against the
code. Separately, `link_item_for` reads the name, sprite and `linkStoreIn` from `find_jack(source)`
and the device, so a Wi-Fi foothold gets the name "Device: guest_ap" and a nil sprite. Decide
whether Wi-Fi can be left and an implant removed (and from where), extend `unplug` or add a route,
and give `link_item_for` a branch per `via` (the AP's sprite and name, and for an implant the
action's `name`, which the foothold record must then store).

**M7. The browser cannot tell an open network from a keyed one (5.3, 7).** "`psk` absent: the
click joins with no key prompt" needs the client to know whether a key exists. Only `wifiAp` ships,
and the `wifi` block is withheld whole. Either ship a non-secret flag on the AP object (for example
`wifiOpen: true`, set by the server from the withheld block), or make the first click post with no
key and have the server answer 422 `needs_key` for a keyed network. Pick one and add it to section
7's table and the no-exposure test.

**M8. `reach_conditions` contradicts itself on the station's own network (5.1, 10).** 5.1 says
each route is "the `downIf` globals of the networks on its path (the station's and every
intermediate and the resource's network)" and, in the next sentence, "A resource on the station's
own network is still `[[]]`". With a `downIf` on the station's network, the first rule gives
`[[that_global]]` and the second `[[]]`. The second means an NPC never notices an outage on its own
network, which is the commonest case. This is the one function 9.2 reads. State it once:
same-network routes are `[[station network downIf]]` when there is one, and `[[]]` only with no
network `downIf`. Add a test.

**M9. Stream ownership has gaps, and the parallel-build recommendation is wrong (12, 13 Q1).**
- `systems/apply-actions.js` holds the implant's client case (5.5, I), but no stream lists it and
  the shared-files table leaves it out. 9.2's table (its section 13) orders it "engine E4, then
  9.3b".
- `systems/interactions.js` needs the access point's click branch (a `type: "pc"` object with
  `wifiAp` must be routed before the generic flow, beside the `networkJack` branch at :941) and
  probably the B2 trigger. No stream owns it, and engine E3/E4 and 9.2 U-2 edit it.
- `lib/break_escape/declared_grants.rb` (M5) and `systems/pc-sessions.js` (M1's cascaded ends) are
  owned by no stream.
- Q1 recommends "W, P and I can build in parallel with later 9.2 work because they touch different
  code". They do not. They edit `game.rb`, `games_controller.rb`, `config/routes.rb` and
  `game_policy.rb`, which 9.2 C-1 holds ("as A's"), and `api-client.js`, which 9.2 C-4 holds now
  (`build/9-2-c`). `tools/playtest/` and `systems/test-bridge/access.js` are 9.2 C-5's, and
  `generate_dungeon_graph.rb` is 9.2 B-2's.
- The shared-files table is headed "Sequence" but gives none for `api-client.js`, `core/game.js` or
  the schema. 9.2's section 13 fixes the order as engine, 9.3a, 9.1, 9.2, and this slice comes
  after 9.2. Say "9.2 L and C first, then this slice" on every shared row.

**M10. The 9.2 hand-off "a station that is down, seen from the network" is dropped (5.2, 6, 11).**
9.2's section 15 table (line 2428) says 9.3b builds it: a sign-in host whose `affordance.offWhen`
holds is listed "not responding" in `network_view` and refused in `desktop_request_allowed?`. The
first draft (v1 13.1) promised it. The second draft has no behaviour, route check, row field or
beat for it. Add it to sub-slice O with a beat, or record it as left out with 9.2's agreement.

**M11. The implant route is underspecified (5.5, 6).**
- Parameters "`pc_id`, `shape`, the action's own fields" do not pick one action when a scenario
  declares two `grant_foothold`s for the same PC and shape (two dropped devices). Name the action by
  its declared path, or by `pc_id` + `needsDropped`/`needsHeld`, and reject a duplicate in the
  validator.
- Check 4 ("already held") runs after the preconditions. A repeated session-shape implant, whose
  device the first call consumed, answers `not_ready`, not `already`. Move "already" to just after
  check 1.
- A timer that fires is saved as fired (`scenario-timer-dispatcher.js:57-60`) and does not run
  again after a reload. `give_item` has a retry path (:284), but the implant gets none, so one failed
  `POST /network/implant` loses the foothold for good. Await it with one retry, as
  `sendInventoryRemove` does.
- The dropped shape checks only that `droppedItems` holds the id. It is grow-only and holds no
  room, so a drop anywhere, at any time, followed by a forged POST is enough. 5.5 accepts that the
  NPC's use cannot be checked. It should also say the drop's room is not checked, or record the room
  so the server can check it.

**M12. The lab option names the wrong implant shape and leaves out the conversion it needs (10;
v1 10.1).** The lab's real beat is the **dropped** shape. The player drops `kit_deviceB` (BadUSB,
`droppable`, `needsTag: tag_deviceB`) on `open_plan`. Sofia (`lord`, `needsHome: usb_target_pc`)
plugs it into `usb_target_pc`, whose `affordance.accepts` includes `tag_deviceB`. The
`npc_used:usb_target_pc` mapping (data.tag `tag_deviceB`) sets `kp_usb_foothold`, and the timer
`grant_remote_session` (startOnGlobal `kp_usb_foothold`) gives `records_remote_session`. The second
draft describes the lab option as "an implant at an unattended PC the player has claimed", which is
the session shape and a different beat. The first draft used the ids `sofia_pc` and `kit_badusb`,
which do not exist (they are `usb_target_pc` and `kit_deviceB`). Renaming `usb_target_pc` would
break `needsHome`, the affordance and four `npc_used` mappings. Whichever draft is followed, the
plan must also say:
- `usb_target_pc` is a plain workstation: no `lockType`, no `network`, and `open_plan` has no room
  network. The validator rule "`pc` must be a sign-in object" forces a conversion to a login PC.
  That re-opens the probe 9.3a avoided (9.3 plan :1543: does a sign-in PC with `affordance.accepts`
  still take an NPC's deliveries?) and changes the claim and screen-lock behaviour at Sofia's desk.
  Either drop the sign-in requirement for the dropped shape (any PC on a network is enough, since
  the implant gives no session), or list the conversion and the probe as part of the option.
- Replacing the grant removes `ENGAGEMENT_NOTE.txt` and `records_share.txt` and makes the task
  title (line 300, "a remote session lands in your inventory") and Ruth's debrief line (598, "a
  remote-desktop foothold") wrong. Both would need rewording, and possibly re-voicing.
- The parallel beats (the plain stick, the QR card and the cable, tags `dev_usb`, `dev_qr`,
  `dev_cable`) share the `npc_used:usb_target_pc` mappings, so the edit must stay inside the
  `tag_deviceB` branch.

## Minor

**m1. K depends on O's code (3, 5.1).** K's `reach_from` calls `network_up?`, which reads `downIf`
through `truthy?` (both O). Section 3 says "O adds the runtime 'is this route up' test that K's
reach uses", which is a backward dependency. Either K builds `network_up?` and `truthy?` (with
`downIf` still refused by the validator until O), or K's walk treats every network as up and O
replaces it.

**m2. Un-reserving must be per field, not per block (9.1, 3).** `NETWORK_RESERVED_OBJECT_FIELDS`
holds `wifiAp` beside `portSecurity` and `portSecurityMessage`, and `NETWORK_RESERVED_NETWORK_FIELDS`
holds `downIf` beside `wifi`. In the order K, O, W, P, I, each sub-slice must remove only its own
names, or a field becomes accepted before it does anything. "Removes the five refusals" also
miscounts: there are four code blocks guarding seven field names.

**m3. Port-security check placement (5.4, 6).** Placing it before "device held" means a player
with no rogue device gets the port-security message, while the client checks for a device first
(`network-links.js`, "only then asks the server"). Pick one order and test it. The refusal body uses
`message`, while every 9.3a plant refusal uses `error`; keep one key.

**m4. Pivots on claims (1, 5.1).** Section 1 says the pivot "rests on a password the server
checked", but 5.1 accepts a claim (an unlocked screen, judged on scenario rules). Claims also end
on every reload (M1). Say so in section 1, or limit pivots to password sessions. This is a design
choice the user may want to make (m9).

**m5. Polling and open desktops (5.2, N7).** Awaiting `stateSync.sync()` before every five-second
`GET /network` sends a `sync_state` request every five seconds while the view is open. Sync only
when globals are dirty. N7 says "the desktop closes to a greyed 'no route' row", but only the view
polls. An open remote desktop has no refresh, so nothing closes it. Say what notices: a poll in the
desktop, or the next scoped request answering 403 `unreachable` and the client closing to the view.

**m6. Validator gaps (9.2).** No check that the dropped shape's `needsDropped` names an item that
exists and is `droppable` (otherwise it can never be in `droppedItems`). No rule for joining an
access point whose network is down. No check for two `grant_foothold`s with the same PC and shape
(M11). The view's `via`, when one network is reached through two pivot hosts, needs a fixed rule
(the lowest `seq`, or by id) so the answer stays deterministic.

**m7. Schema detail (9.1).** There is no single actions schema. `grant_foothold` must join the
`triggerOnInteract` type enum (`scenario-schema.json:5168`). `timers[].items` is
`additionalProperties: true`, and `onConfirm` items are plain objects. "Adds `network/join` and
`network/implant` to the routes list where the schema tracks them": the schema tracks no routes.

**m8. Section 4's example timer uses `"triggerEvent"`.** Timers start on `startOnGlobal`
(`scenario-timer-dispatcher.js:36`); there is no `triggerEvent` key.

**m9. Open questions (13).** Q3 (foothold id names) and Q6 (the eight-path cap) are engineering
calls that AGENTS.md lets the planner make. Decide them in the text. The questions worth the user's
time that are missing: whether a pivot may rest on a claimed screen (m4); whether a down network
the player has never reached is named (M3); and, for the lab, whether Sofia's PC may become a
sign-in PC (M12). Q1's recommendation rests on a false premise (M9). Q2's recommendation (port
security on a spare comms-cupboard port, hold the BadUSB) is sound.

**m10. The implant's link-item name has no home (5.5, 8).** The link item takes "its name the
action's `name`", but the foothold record stores no name, and `link_item_for` rebuilds the item from
the record on every bootstrap. Store `name` (and the sprite source) on the record.

**m11. A route with a cycle (5.1).** `reach_paths` caps at eight simple paths "shortest first",
but the order between equal-length paths is not fixed. Sort ties by the joined id list, so 9.2's
`routes` and the tests are stable.

## Nit

- **n1.** `state-sync.js` is at `public/break_escape/js/state-sync.js`, not `systems/`. The 12
  table's "`app/models/break_escape/npc-needs.js`" is `public/break_escape/js/systems/npc-needs.js`.
- **n2.** Section 10's table says `check_network_model` "returns early when the scenario has no
  networks". It returns early only for a non-Hash (`validate_network.rb:25`). It has to keep
  checking, or a stray `networkLinks` with no `networks` would pass.
- **n3.** 5.3 says "section 13 records the strength" of uncounted keys; it does not.
- **n4.** Join check 3 says the server "emit[s] `network_joined`". Events are emitted by the
  client from the answer, as 9.3a's plant does.
- **n5.** `NetworkModel.truthy?` should be specified as matching `npc-work.js`'s `truthy` (false
  for `undefined`, `null`, `false`, `0`, `""`), not JavaScript in general, which also treats `NaN`
  as false.
- **n6.** `NpcHabits::Clues.secret_homes` already lists `networks.<id>.wifi.psk`
  (`npc_habits/clues.rb:306-311`). The first draft (v1 13.2) said this slice adds it; no edit is
  needed.
- **n7.** Section 2's view row lists `{ id, via, name, network, hosts }`; `foothold_for_client`
  also sends `itemId` and `sourceId`.
- **n8.** Section 7's events row names `network_foothold_gained` and "the `<id>_planted`-style
  display global" for Wi-Fi and implants, but no section gives those globals' names.

## Verdict

Not build-ready. B1 to B3 must be fixed and M1 to M12 answered before a second round.

Counts: 3 Blocker, 12 Major, 11 Minor, 8 Nit.
