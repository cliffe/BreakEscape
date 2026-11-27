Counts: 0 blockers, 2 majors, 3 minors, 7 nits.

# README slice 9.3b network fields: docs review, round 1

Commit reviewed: b409415ea (README_scenario_design.md, the 9.3b additions under "Networks: jacks, footholds, hosts and shares" and the resource `downIf` line). Every claim was checked against the code in this worktree, not against `ACCESS_MODEL_SLICE_9_3B_PLAN.md`. Line numbers are README_scenario_design.md unless a file is named.

Checked and correct (no finding): the fields table rows for `networkLinks`, network `downIf`, `wifi`, `portSecurity`, `wifiAp`; the withholding sentence (`NetworkAccess::WITHHELD_SCENARIO_KEYS` and `WITHHELD_OBJECT_FIELDS`, network_access.rb:18-21); the link and pivot rules, sign-out pruning and share mapping across up links (network_access.rb `reach_walk_uncached`, `prune_unreachable_sessions!`, `mapped_shares`, `networks_reachable_from`); NPC routes (`NetworkModel.reach_conditions`); `truthy?` (network_model.rb:309); the Wi-Fi join flow, reach test, `wifi_<networkId>` foothold, link item name and sprite, second access point answer, no unplug (network_access.rb `join_network!`, `unplug_device!` via `find_jack`); port security order, default text and event (network_access.rb:80, `plant_device!`, network-links.js:420-426); the implant shapes, preconditions, `implant_<pcId>`, sprite, no session, the off-PC text (network_access.rb `implant_foothold!`, `implant_source_off?`, network-view-minigame.js:45); every validator error, warning and info line listed for links, outages, Wi-Fi, port security and implants (validate_network.rb:69-86, 192-322, 540-645, 659-684); the dungeon graph paragraph (generate_dungeon_graph.rb:612-632, 676-692, 860-1058, 1961-1984). The test scenario validates with 0 failures.

Secret check: nothing in the README tells an author to put a secret in a field that reaches the browser. The Wi-Fi key, SSID, links and network ids stay server-side as stated; `portSecurityMessage` and a `grant_foothold` `name` do reach the browser and the README says so. The one place where more reaches the browser than the README says is E3 below (rows of a down own network).

## README findings

### M1 (major): the objective advice for Wi-Fi and implant beats contradicts the rule just before it

- README line 928: "complete those beats from an `eventMappings` entry on `network_joined` or `network_foothold_gained`, as `test_access_networks` does."
- Code: a mapping can only complete a `custom` task (test_access_networks n8, n9, n11, n12 are all `"type": "custom"`, scenario.json.erb:176-180), and `complete_task!` checks nothing for `custom` (game.rb:3172-3173). The same paragraph says "An objective that must not be skippable is an `unlock_object` task ... not a task a mapping completes." So the advice makes the Wi-Fi join and the implant client-trusted beats, with no warning. It also does not warn about the trap in E1: an `unlock_object` task on an access point, or on a PC an implant targets, shows the player an "Objective Blocked" alert.
- Fix: after E1 lands, rewrite the last two sentences to: an `unlock_object` task on an access point is met once the player has joined there (a second access point of a joined network included); an implant beat has no server-checked task, so a task a mapping completes on `network_foothold_gained` is skippable, and a beat that must not be skipped should rest on what the implant reaches (a remote sign-in at a host on that network). If E1 does not land, say plainly that neither beat can be made skip-proof and that an `unlock_object` task on an access point or an implant's PC raises a refusal.

### m1 (minor): the SSID is never shown to the player

- README lines 905 and 941 to 949: `wifi` is `{ ssid, psk }`, and the example names an SSID, with no word on where it appears.
- Code: no client or server file reads `ssid` outside the validator and the dungeon graph (grep over app, lib and public/break_escape/js). The join prompt's header is "Join Wi-Fi: <the access point object's name>" (password-minigame.js:237, network-links.js `_promptWifiKey`, which passes `data.name`).
- Fix: add one sentence: "`ssid` is required but only the dungeon graph shows it; the join prompt names the access point object, so put the network name in the object's `name` or on a note."

### n1 (nit): `completionActions` is a server-run path too

- README line 963: "a `timers` entry, an object's `triggerOnInteract`, `onInteract.actions`, `conditionalActions`, or a `confirm_action`'s `onConfirm`".
- Code: `DeclaredGrants.executed?` also accepts `completionActions` (declared_grants.rb:102), so both the server (`NetworkModel.grant_foothold_actions`) and the validator (validate_network.rb:540-592) honour a `grant_foothold` there. The validator's own error text omits it too.
- Fix: add "a minigame's `completionActions`" to the list (and to the validator message at validate_network.rb:592).

### n2 (nit): `network_viewed` skips down blocks

- README line 928: "once more per further network block".
- Code: network-view-minigame.js:160 returns early for `block.route === 'down'`.
- Fix: "once more per further network block that is up".

### n3 (nit): the USB refusal line is the engine's, not an authored one

- README line 961: "refuses the implant with the policy's line".
- Code: the text comes from the fixed `USB_REFUSAL_LINES` keyed on the policy's `usb` value (network_access.rb:365-366), the same two lines as pc-policy.js:18-19.
- Fix: "with the USB refusal line for that policy ("USB storage is disabled on this PC." or "USB devices are disabled on this PC.")".

### n4 (nit): `name` on `grant_foothold` is optional

- README line 915: "`pc`, `name`, and `needsDropped` or `needsSession` with `needsHeld`".
- Code: no validator check requires it, and the link item falls back to "Implant: <host>" (network_access.rb `implant_link_item`, :494-509).
- Fix: "`pc`, optional `name` (default "Implant: <host>"), and ...".

### n5 (nit): a session-shape implant on a headless PC is not a validator finding

- README line 961: "A headless host takes no keyboard session, so it can only take the dropped shape."
- Code: validate_network.rb raises nothing for it; only the graph marks "(unusable: headless)" (generate_dungeon_graph.rb:1018).
- Fix: add "the validator does not flag this; the dungeon graph marks the implant unusable". Optionally add a warning to the validator later.

### n6 (nit, code): stale reserved-fields comment and dead loops (author's item 5)

- Code: validate_network.rb:17-20 says "The implant work keeps the 'grant_foothold' action reserved", but nothing is reserved: both lists at :21-22 are empty and `grant_foothold` is checked in full at :540-645. The loops at :57-67 run over empty lists.
- Fix: replace the comment with "No 9.3b field is reserved any more; the lists stay empty so a later slice can reserve fields." or delete the lists and the loops. Either is a two-line change with no behaviour change.

### n7 (nit, plan): `path` does not select an implant action (author's item 1)

- README line 963 is right: one action per PC and shape.
- Code: `grant_foothold_action_for` (network_access.rb:385-392) matches on `[pc, shape]` and uses `path` only when the request carries one; apply-actions.js:453 sends `action.path || null`, and scenario actions carry no `path`, so it is always null in practice. The validator errors on two actions with the same PC and shape (validate_network.rb:607-612).
- Verdict: README right as written, plan wrong. Plan 5.5 precondition 1 and the section 6 row for `POST /network/implant` still say the action is picked "at `path`"; correct them to "the one action for this PC and shape".

### Author's item 2: a resource's `downIf` type (no finding)

- validate_access_work.rb:420-423 only checks that the global is declared, but the schema types `resources.<id>.downIf` as a string (scenario-schema.json:239) and the schema runs by default. A probe copy of test_access_networks with `"downIf": 5` on a resource fails with "The property '#/resources/backup_vault/downIf' of type integer did not match ... string". The README makes no claim about it, so no change is needed. If wanted, line 939 could add "(a resource's `downIf` is type-checked by the schema)".

## Engine findings

### E1 (major, small): `unlock_object` on an access point is never met, and an implant fires a false task attempt on its PC (author's item 4)

- What happens now. `complete_task!` judges `unlock_object` as "foothold gained" only for a jack and "signed in" for a sign-in PC; anything else falls to `object_unlocked?` (game.rb:3140-3158). The client, however, treats every `network_foothold_gained` as an object unlock of its `sourceId` (objectives-manager.js:333-335) and reconciles on load with `networkLinks.wasGained(targetObject)` (objectives-manager.js:265), and `gained` holds access point ids and implant PC ids as well as jacks (network-links.js:169-187). So:
  - an `unlock_object` task on an access point: the join fires the client attempt, the server refuses "Object not unlocked", the player sees "Objective Blocked" (objectives-manager.js `completeTask`), and the same refusal repeats on every reload;
  - an `unlock_object` task on a PC that a dropped-shape implant targets (an ordinary "sign in to the door controller" task, written for the sign-in, not the implant): the implant fires the attempt, the server refuses "Not signed in to this PC", and the alert repeats on every reload until the player signs in.
- Against the plan: 5.3 says the second access point's id is recorded "so a task or mapping on either access point completes", and beat N9 says the second join "still completes a task on that AP". The server records the ids (`join_network!`, `record_gained_ap!`) but `complete_task!` never reads them for an access point. This is a bug against 5.3, not an acceptable gap: the README's workaround gives up the skip-proof check the plan designed, and the implant half hits authors who never asked for an implant task.
- Fix:
  1. game.rb, in the `unlock_object` branch before the `target_pc` test: when `find_wifi_ap(task['targetObject'])` finds an access point, require `gained_footholds.include?(ap_id)` ("Not joined here"). About 5 lines.
  2. objectives-manager.js:333-335: skip `data.via === 'implant'` (an implant meets no task on its PC). network-links.js `wasGained(id)`: return false when the held foothold at that id is an implant (`this.heldAt(id)?.via === 'implant'`), so the load reconcile no longer fires for it. About 3 lines.
  3. Tests: a Rails test in network_footholds_test or a Wi-Fi test file (task on the first access point met by a join; on the second met by an `already` join; refused before any join), and a node test for the two client changes. Then switch n8 and n9 in test_access_networks to `unlock_object` on `guest_ap` and `guest_ap2` so the feature scenario proves it, and update README line 928 (M1).
- Size: small, about half a day with tests. State: no new synced state; `gainedFootholds` already holds the ids and is bounded by the number of jacks, access points and PCs in the scenario.
- Implants keep no server-checked task. Making an implant meet `unlock_object` on its PC would let a dropped stick satisfy a sign-in task, which is wrong. If authors need one later, it wants its own rule (for example a task on the prop or a new task type), which is a design question for the user, not part of this fix.

### E2 (minor, small): `<apId>_planted` appears only after a reload (author's item 3)

- What happens now. `join()` never calls `_publishPlanted` (network-links.js:599-629), while `implant()` publishes `<pcId>_planted` (:518) and `plant()` publishes `<jackId>_planted` (:442). On a reload, `load()` writes `<id>_planted` for every id in `gainedFootholds`, access points included, as `heldAt(id) !== null` (:183-186). So within one session `<apId>_planted` is never set; after a reload it is true for the access point the network was first joined at and false for a second one. A variant or `revealOnGlobal` keyed on it changes look only after a reload, and a `global_variable_changed:<apId>_planted` mapping never fires (load writes straight into the globals with no event). Plan section 7 (the "Events and globals" row) promises the display global "for a Wi-Fi AP and an implant".
- Would an author trip over it? Only one who guesses the name from the jack pattern, since the README names only jacks and implants. That is likely enough (the jack pattern is the documented one, and test_access_networks uses `comms_port_planted` in a variant), so it is a bug, though not a serious one.
- Fix: in `join()`, after a successful answer (both `joined` and `already`), call `this._publishPlanted(apId, this.heldAt(apId) !== null)`. That matches `load()` exactly, so the live and reloaded states agree. One line plus a node test in test/js/network-links.test.mjs (join publishes the global; a second access point publishes false, as after a reload). Then README line 928 adds "and `<apId>_planted` for the access point a network was first joined at; for any access point use `network_joined:<apId>`". Making every joined access point read true would need the server to send all access point ids per Wi-Fi foothold, which is larger and not worth it for display state.
- Size: small, under an hour. State: one extra global per access point, bounded by the scenario, written once per join.

### E3 (minor, small): a foothold on a network that is down still lists that network's hosts and resources

- README line 939: "While a network is down its hosts and resources leave every view".
- Code: `network_view` sends the flat `hosts` rows from `network_rows(own network)` with no `network_up?` test (network_access.rb:608), and the view renders the own network's rows from that array (network-view-minigame.js:171-173, render). `player_reach` is empty for a down own network (`reach_walk_uncached`, :923-930), so every **Sign in** and **Open** on those rows is refused, but the rows, host names and any resource `observations` still reach the browser and show, and `network_viewed` fires with those host ids. This arises whenever a jack, access point or implant sits on a network with a `downIf` (the validator allows it; test_access_networks puts `downIf` only on `server_net`, which has no jack, so no test covers it). Plan 5.2 says a down network's hosts "drop out of the view".
- Fix: in `network_view`, send `'hosts' => network_up?(own) ? network_rows(own) : []` (and keep the implant-off branch as it is). Add a Rails test with a jack on a network whose `downIf` is true. Optionally a validator info line for a jack, access point or implant on a network with a `downIf`. Until then, README line 939 is wrong for a foothold's own network.
- Size: small, about an hour with the test. State: none.

## Sync size

No README claim adds synced state. E1 adds none. E2 adds at most one boolean global per access point. `footholds` and `gainedFootholds` are server-side records bounded by the scenario's jacks, access points and PCs, and the client does not send them back.
