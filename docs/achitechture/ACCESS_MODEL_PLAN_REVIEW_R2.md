# Access model plan: review, round 2

Reviewed: `docs/achitechture/ACCESS_MODEL_PLAN.md` as rewritten after round 1. Read-only adversarial
review by a fresh reviewer, checked against the working tree on 2026-11-09. Line numbers are the
current tree's. The plan's section 2 decisions (the user's and the orchestrator's) are not
relitigated; where a decision has a cost I say so and propose how to meet it within the decision.

## 1. Verdict

**Revise once more, then build the first slice.** Counts: 1 blocker, 3 major, 9 minor.

The rewrite is a real improvement and reads as a complete, self-contained plan: no finding ids,
change notes or review references inside it. Most of its statements about the current code check
out at the cited lines (section 4 below). The session gate, the own `/login` route kept out of
`UNLOCK_METHODS_BY_LOCK_TYPE`, the reset allow list, the room-path withholding and the
server-composed account tiles are all sound.

What is still wrong is mostly in the paths the plan names but did not trace:

- Taking a file from a login PC or a profile, the slice's main payoff, is refused by the
  existing inventory add path in both cases, and nothing tells the server whether the player
  chose Copy or Move (B1). The planner flagged this as untraced; it does not work as written.
- The client cannot tell that a door has an `access` list, because the bootstrap and the door
  properties drop the field, so the role-only finance door in the proof scenario would still
  refuse with "Requires RFID keycard" (M1, the round 1 M1 failure by another route).
- Extending `/capture_secrets` to cred-bearing NPCs turns it into a password lookup that a
  modified client can drive for any NPC, and an inline `addCapture.secret` in an NPC's
  `eventMappings` ships the password in room data today (M2).
- Slice 1 relies on the `locksScreen` habit and on the workstation layer, but habits are a later
  slice and a login PC is not a workstation unless flagged (M3).

## 2. Severity table

| Severity | Count | Items |
|---|---|---|
| Blocker | 1 | B1 taking files from a login PC or profile is refused, and Copy is never signalled |
| Major | 3 | M1 the client cannot see a door's `access`, M2 the capture route becomes a password lookup and `addCapture.secret` ships, M3 slice 1 depends on `locksScreen` and workstation state it does not define |
| Minor | 9 | m1 container lookup needs `contents`, m2 card copies from keycard objects and mixed doors, m3 gate doors, m4 creds outside room NPCs reach the bootstrap, m5 nested containers inside login PCs and profiles, m6 card-only NPCs and the derived `rfidCard`, m7 sticky note is a later-slice habit and clashes with the no-password test, m8 the `known` picker's data sources, m9 small inaccuracies |

## 3. Findings

### Blockers

**B1. Taking a file from a login PC or an account profile is refused by the server, and the server
is never told Copy from Move.**
*Issue.* Plan 5.3 says the add "requires the session to admit it; the implementer confirms the add
path's source lookup before building", and 5.1 says Copy records the id in
`player_state.copiedItems`. Traced:
- The add goes `inventory` → `validate_item_collectible` → `find_accessible_item`
  (`games_controller.rb:954-994, 1811-1934, 1993-2082`).
- **A profile item is never found.** `find_accessible_item` searches `room_states` additions, the
  giving NPC, room objects, one level of room object `contents`, flag stations and NPC
  `itemsHeld` (`games_controller.rb:2000-2079`). `accountProfiles` sits outside rooms, so the add
  fails with "Item not found in scenario" (`:1863-1867`).
- **A login PC's own file is found but refused.** It resolves to
  `{ type: 'container', container_id: <pc id> }` (`:2050-2054`), and the container branch then
  requires `unlockedObjects.include?(container_id)` (`:1884-1890`). Login deliberately never
  writes `unlockedObjects` (plan 5.3), so this always fails with "Container not unlocked".
- **Copy cannot be recorded.** The add request carries only `action_type`, `item` and
  `source_npc_id` (client `inventory.js:455-459`, server `:960-966`). No parameter says Copy, and
  no route is named that writes `copiedItems`.
- Files more than one level deep (a folder inside a PC) are not searched at all (`:2050`), so a
  nested profile folder needs the same walk.

*Evidence.* As above; client add awaits the server and treats a refusal as a failed pick-up
(`inventory.js:445-470`).
*Why it matters.* The proof scenario's personal profile ("Jake's files", a takeable Q3 budget) is
the slice's per-account payoff, and both Copy and Move fail on the server. The design is fine; the
path is simply missing from section 10.
*Recommended change.* Specify it in 5.1 and 5.3 and add it to step 3's file list:
- The add takes `source_pc_id` and `transfer: "copy" | "move"`.
- `find_accessible_item` gains a login source: a PC's own contents (walked recursively) give
  location `{ type: 'login_pc', pc_id }`, and profile contents give `{ type: 'profile', profile_id }`.
- `validate_item_collectible` accepts these only when `sessions[source_pc_id]` is set, the PC is
  `lockType: login`, the item is in that PC's own contents or in a profile whose `for` admits the
  session identity, and the item's `transfer` allows the choice.
- On `copy`, add the id to `copiedItems` in the same locked request.
- Add tests: Copy and Move from a profile file and from a PC-local file, each logged in and logged
  out (refused); and Move refused where `transfer: "copy"`.

### Major

**M1. The client cannot see that a door has an `access` list, so an `access`-only door still
refuses before asking the server.**
*Issue.* Plan 4.1 says "For a door with `access`, the client offers every held `card_id` ... in one
unlock request". The client only knows a door's lock from three fixed lists, and `access` is in
none of them:
- The bootstrap keeps an allow list of room fields, and `access` is not on it
  (`game.rb:819-821`). Doors are set up from these bootstrap fields before the far room loads.
- `doorSprite.doorProperties` copies a fixed set of fields (`doors.js:518-544`).
- `getLockRequirementsForDoor` returns `locked`, `lockType`, `requires`, `keyPins` and
  `difficulty` only (`unlock-system.js:602-615`).

So at the `rfid` branch (`unlock-system.js:502-593`) an `access`-only door has no `requires`, and
falls through to "Requires RFID keycard" or opens an empty cloner, exactly as before.
*Evidence.* As above.
*Why it matters.* The proof scenario's finance door is role-only. This is the same silent refusal
the plan set out to fix, reached through the door's data rather than the match.
*Recommended change.* In 4.1 and steps 2 to 4, name the plumbing:
- Add `access` to the bootstrap allow list. It is not secret: it is roles and NPC ids.
- Copy it into `doorProperties` from the door definition or the connected room.
- Return it from `getLockRequirementsForDoor`.

Or, simpler and robust: for any `rfid` door where no local card matches `requires`, send every
held `card_id` to the server and act on its answer. Say which in the plan.

**M2. The capture route becomes a password lookup for every cred-bearing NPC, and an inline
`addCapture.secret` ships the password in room data.**
*Issue.* Three related problems:
- **The lookup.** Plan 5.6 extends `capture_secrets_for_client` to "answer for a `creds` NPC from
  the server's earned `se_captures` record". That record is not server-established: it lives in
  `globalVariables.se_captures` (`game.rb:876`), which the client writes through the global sync,
  as the method's own comment says ("trusts the server's persisted record of the client-computed
  verdict", `game.rb:863-868`). A modified client can write a credential capture for any address
  (usernames arrive in the account tiles) and read back that NPC's password from
  `GET /capture_secrets`. Today the same route can only return landing-page secrets.
- **The wrong advice.** Plan 4.3 therefore misleads when it names "a capture earned" as "a fact the
  server established independently".
- **The extra home for the password.** `lab_physical_pentest`, where the plan adds its first real
  beat, already writes the password inline in an NPC's `eventMappings[].addCapture.secret`
  (`scenarios/lab_physical_pentest/scenario.json.erb:835`). `eventMappings` ride on the NPC in
  room data. Plan 5.6 withholds only `usePayload.secret`, so this copy would ship.

The plan also does not say how the server maps a capture entry to an NPC ("keyed by capture
target"). The record is keyed by `targetId` (`hampshire`), not by NPC id.
*Evidence.* As above; `captures.js:17-21` (the closed key set, client-written);
`npc-manager.js:1169-1177` (a capture is the mapping's template overlaid with the NPC's
`usePayload`).
*Why it matters.* It quietly undercuts the user's decision that a login PC's contents are sent only
after a correct password, and it misleads authors about what is safe to rest a puzzle on.
*Recommended change.*
- Serve a `creds` NPC's password from `/capture_secrets` only when the scenario declares a capture
  route for that NPC: an `eventMappings[].addCapture` on that NPC, or a `usePayload` the loader
  filled from `creds`. Match the entry by its `address` equalling `creds.username`. Every other
  NPC is never served.
- State in 4.3 and 5.6 that captures are client-reported (like landing-page captures), and drop
  "a capture earned" from the server-established examples.
- In the NPC withholding, delete `secret` from every `addCapture` in a `creds` NPC's
  `eventMappings`, and have the validator error on an authored `addCapture.secret` for a `creds`
  NPC (the loader fills nothing there).
- Add `eventMappings` to the no-password test's scenario.

**M3. Slice 1 depends on the `locksScreen` habit and on workstation state that slice 1 does not
define.**
*Issue.* Section 10 defers "awareness presets and habits (section 6)" to a later slice, and step 1's
schema list adds no `awareness` or `habits`. Yet slice 1 uses `locksScreen` in three places:
- the claim refusals (5.4: "the owner's effective `locksScreen` is `always`");
- step 4 ("`workstation-state.js` (honour `autoLockMin` and `locksScreen`...)");
- the step 5 validator warning on `locksScreen: "sometimes"`.

Separately, the workstation layer only tracks objects that `isWorkstation` accepts: `workstation:
true`, `locksScreenOnLeave` or `lockChance` (`workstation-state.js:46-49`). The plan's PC example
(5.2) has none of these, so its away and screen-locked globals are never published, and the
client has nothing on which to base an unlocked-session claim.
*Evidence.* As above; the validator's NPC field list has no `habits` (`validate_scenario.rb:412-419`),
so authoring it in slice 1 warns as unknown.
*Why it matters.* The slice's unlocked-session feature cannot be built or tested as specified, and
the proof scenario's `autoLockMin: 5` PC would never lock or unlock.
*Recommended change.* Pick one and write it into 5.4 and steps 1, 4 and 5:
- Bring just `habits.locksScreen` (no presets) into slice 1.
- Or define slice 1's rules on the PC's existing `lockChance` / `locksScreenOnLeave`, and let the
  habit feed them later.

Either way, state that a `lockType: login` PC with an owner is a workstation by default (extend
`isWorkstation`), and that the validator warns when a login PC with an owner has no
`lockChance` / `locksScreenOnLeave` / habit (it would lock every time).

### Minor

**m1. The `container` lookup requires `contents`, so a login PC holding only profiles returns 404
before the login branch runs.** `find_container_in_scenario` only returns an object whose
`contents` is present (`games_controller.rb:1676-1677, 1719`), and `container` looks the object up
before anything else (`:522-523`). Plan 5.2 makes local `contents` optional. Look the PC up with
`find_object_in_scenario` (`:1688`) for the login branch. When the room filter strips a login PC's
contents, set a `login: true` / `hasContents` marker so the client routes it as a container
(`interactions.js:1526`).

**m2. Card copies come from keycard objects too, through one save point; and a copied `requires`
card fails on a mixed door.**
- Plan 4.3 defines `POST /clone_card` with `npc_id` only, called by "both the `clone_keycard` ink
  action and the RFID minigame's copy step". But the ink action just opens the minigame
  (`chat-helpers.js:398-405`), and the only save is `rfid-minigame.js:292` → `saveCardToCloner`
  (`rfid-data.js:286`). So "both" would double-call.
- The minigame also clones a room keycard object with no NPC (`interactions.js:889-896`,
  `cardToClone: sprite.scenarioData`).
- On a door with both `requires` and `access`, step 1 of the 4.1 check rejects a `requires` card
  held only as a client-saved copy, though the same copy opens a `requires`-only door.

Fix: make the single call from the save point, taking `npc_id` **or** `object_id`. For an object,
check it is a keycard in a room the player has unlocked. Then say whether, on a mixed door, a
`requires` card keeps today's client-trusted rule.

**m3. Gate doors.** The gate clone-as-entry path also decides from `requires` alone
(`doors.js:664`, `playerHoldsRfidCredentialFor`). Either say slice 1 does not support `access` on
gate doors (validator warning) or add the same server round trip there. Add `doors.js` to step 4.

**m4. Creds written outside room NPCs reach the bootstrap.** The bootstrap reduces only `rooms`
(`game.rb:806-847`). Top-level `npcs` and `phoneNPCs` (known top-level keys,
`validate_scenario.rb:390-394`) and `social.characters.*.emailRecord` / `social.mailClient.contacts[].emailRecord`
(headless records, `game.rb:1476-1530`) ship as authored, apart from capture secrets. Headless
records also count as NPCs for `find_npc_in_scenario` (`game.rb:1442-1468`). State in section 3
that `role` and `creds` are allowed only on room NPCs. Add a validator error elsewhere, so the 5.6
claim that none of this relies on the author holds.

**m5. Nested containers inside a login PC or a profile bypass the session.**
- A folder nested in a login PC's `contents` is found by `find_scenario_object`
  (`game.rb:1340-1354`). If it is not locked, `/unlock` with `method: 'unlocked'` succeeds
  (`game.rb:1199-1203`), records it in `unlockedObjects` and returns its contents
  (`games_controller.rb:899-913`), with no session. Stamped ids are predictable
  (`<pc>_content_<n>`, `game.rb:3070`).
- For a nested item inside a profile, the reverse holds: `find_scenario_object` does not walk
  profiles, so a locked archive in a profile cannot be unlocked at all.

Add to 5.3: `/unlock` and `container` refuse any object whose ancestor is a login PC or a profile,
unless the current session admits it; and `find_scenario_object` walks `accountProfiles` (add it
to the lookups named in 5.1).

**m6. Card-only NPCs and the derived `rfidCard`.**
- Reading an existing `rfidCard` as `creds.card` gives card-only NPCs (guards, existing missions)
  `creds`, and so the implicit `staff` role and a place in the 5.3 rule "a tile for every account
  the PC's `access` admits". Define an account as `creds.username` present: tiles, login and the
  "can log in to its `needsHome` PC" check apply only to those.
- The derived client `rfidCard` is "card id and protocol only", but the clone flow reads
  `rfidCard.name` (`chat-helpers.js:373`, `npc-conversation-state.js:679`). Keep `name`.

**m7. The sticky note is a later-slice habit, and it clashes with the no-password test.** 5.6
and step 4 put the `writesDown` fill (password into the PC's `postitNote`) in slice 1, but
`writesDown` is a section 6 habit, which is later. When on, it deliberately puts the password in
`/room/:id`, which the 5.6 test says must never contain it. Move the fill to the habits slice, or
scope the test to a scenario without `writesDown`. Separately, the ink check reads "any compiled
ink file" in 5.6 but "an NPC's compiled ink" in step 5. Use the 5.6 wording: Jake's password
in Sarah's ink should also be caught. (Objects already read their own `postitNote`:
`unlock-system.js:341`.)

**m8. The `known` picker's sources.**
- `encounteredNPCs` is filled for every NPC in a room once the room loads
  (`games_controller.rb:1608-1650`), not when the player talks to one. Say so: `known` means
  "whose room you have entered".
- Intel facts are client globals `se_intel_<id>` (`social-intel.js:8, 19`), with no link from a
  fact to a username. Name the link (for example `social.intelFacts[].reveals: { username }`) or
  drop the intel-fact half for slice 1.
- "portrait" is not a field NPCs have. Name the source: `avatar`, or the talk sprite.

**m9. Small inaccuracies.**
- There is no "NPC branch" in `filter_requires_and_contents_recursive`. The function is generic,
  and NPCs are reached by the `obj['npcs']&.each` loop (`game.rb:3011`). Strip there (or by a
  helper called on each NPC), so a non-NPC hash with a `role` key is untouched.
- Of the four `copiedItems` sites in 5.1:
  - The inventory short-cut (`games_controller.rb:973`) hides nothing: it returns success, and
    `add_inventory_item!` dedupes anyway (`game.rb:165-176`). Skipping it for a copied id does
    nothing useful.
  - The room overlay (`game.rb:976-978`) only filters top-level room objects, which a profile or
    PC file never is once the validator forbids shared ids.

  The two that matter are `filter_container_contents` and the session compose step.
- "the bootstrap already drops NPCs" holds for room NPCs only (see m4).

## 4. What checked out

- Reset keeps only an allow list, so new `player_state` keys are dropped:
  `reset_player_state!` `game.rb:89-107`; new keys need defaults in `initialize_player_state`
  (`game.rb:3076-3122`).
- Container gate is `unlockedObjects` only: `check_container_unlocked` `games_controller.rb:1727-1734`;
  `unlock_object!` on object unlock `:901`; `container` at `:513`, 403 when not unlocked `:527-531`.
  A session-based branch is the right design.
- `login` is absent from `UNLOCK_METHODS_BY_LOCK_TYPE` (`game.rb:1035-1044`), and a locked object
  whose lock type has no entry refuses every client-named method (`game.rb:1229-1232`). So a
  `lockType: login` PC cannot be opened through `/unlock`, as 5.3 says.
- Room data withholding point: `filtered_room_data` `game.rb:909-921` overlays `room_states`
  (including `npcs_added`, `:957-960`, stored as full scenario NPC records by
  `move_npc_to_room!` `:578-583`) **before** `filter_requires_and_contents_recursive`, so stripping
  in the NPC recursion covers moved NPCs. The client cannot write NPC fields back:
  `npc_state_params` permits only `isKO`, `currentHP`, `isVisible` (`games_controller.rb:2314-2320`).
- Bootstrap reduces rooms to an allow list with no NPCs (`game.rb:806-847`), and strips flags and
  capture secrets (`:849-864`).
- `GET /ink` serves compiled ink (`games_controller.rb:547`); `GET /capture_secrets`
  (`:1043`); `capture_secrets_for_client` (`game.rb:869`).
- RFID is trusted from the client with no card sent: `game.rb:1156-1161, 1245-1248`;
  `unlock-system.js:38`. Client matching is `requires`-only: `unlock-system.js:69-94, 502-593`.
- `saved_cards` is client-written: `rfid-data.js:363-370`, `games_controller.rb:997-1003`,
  `game.rb:1825`. A server-recorded copy list is the right tightening.
- Profile id stamping point: `stamp_scenario_object_ids!` `game.rb:3059-3074` walks rooms only.
- `filter_container_contents` rejects held items: `games_controller.rb:1736-1762`.
- Workstation layer: `ownerOf` `workstation-state.js:52-58`, `decideLocked` `:65-74`.
- `text_file` always opens in place: `container-minigame.js:453-456`.
- Validator field lists at the cited lines: top level `validate_scenario.rb:390-394`, rooms
  `:405-409`, NPCs `:412-419`, items `:484-510`.
- Section 10's order (schema, then withholding, then server, then client, then validator, then
  graph, then proof scenario) is sound. Each step can be tested before the next once B1, M1 and
  M3 add their missing pieces.
- The plan is self-contained: no finding ids, change notes or review references in it.

## 5. Round 1 findings: closed or not

| R1 finding | R1 outcome | Round 2 check |
|---|---|---|
| B1 login content gate | fixed | **Closed** for the gate itself (5.3). The lookup in front of it needs m1. The take path it implies is B1 here. |
| B2 password via room endpoint | fixed | **Closed** for the room path and moved NPCs. Gaps elsewhere: M2 (capture lookup, inline `addCapture.secret`) and m4 (creds outside room NPCs). |
| M1 role-ACL RFID on the client | fixed | **Not closed.** The send-every-card rule is right, but the client never learns the door has `access` (M1 here). |
| M2 copied-card identity | fixed (orchestrator decision) | **Closed** as a decision, stated honestly. But the keycard-object copy path is missing (m2), and 4.3's "a capture earned" is wrong (M2). |
| M3 profile item ids | fixed | **Mostly closed.** The add lookup (`find_accessible_item`, B1) and `find_scenario_object` (m5) also need profile walks. |
| M4 account picker data | fixed (orchestrator decision) | **Closed.** Source details in m6 and m8. |
| M5 Copy and the held filters | fixed | **Not closed.** Nothing records a Copy (B1), and two of the four listed sites are not real (m9). |
| m1 login plumbing | fixed | Closed. |
| m2 name overlap | fixed | Closed. |
| m3 lockout state | fixed | Closed. |
| m4 skip check ordering | deferred | Deferral justified: the validator has no per-lock order. |
| m5 unlocked-session trust | fixed | Closed in intent. Its validator warning keys on `locksScreen`, which slice 1 lacks (M3). |
| m6 two homes for a password | fixed | **Not fully closed.** `addCapture.secret` inline in `eventMappings` is a third home, and the proof mission already uses it (M2). |
| m7 sticky note reaches the login prompt | fixed | Closed for the client (`unlock-system.js:341` already reads the object's note). Slice placement and the test clash are in m7. |

## 6. Open questions for the user

None. Every finding has an engineering fix within the decisions in plan section 2.

## 7. Planner response

The plan was rewritten as a complete document. Round 2 findings, then the round 1 findings this
review found not closed or partly closed.

| Finding | Outcome | What was done or why |
|---|---|---|
| B1 taking files from a sign-in PC or profile | fixed | Plan 5.1 "The take request": the add sends `source_pc_id` and `transfer`; `find_accessible_item` gains `login_pc` and `profile` locations (recursive) and skips them otherwise; `validate_item_collectible` checks the session, scope, takeable and `transfer`; Copy writes `copiedItems` in the same request; tests in step 3. |
| M1 client cannot see a door's `access` | fixed | Plan 4.1: `access` (not secret) added to the bootstrap allow list, `doorProperties` and `getLockRequirementsForDoor`; client order is `requires` match, then send `card_ids` for an `access` lock, then today's flow; server refuses a no-`card_ids` claim on an `access`-only lock. Files in steps 2 and 4. |
| M2 capture route as password lookup, inline `addCapture.secret` | fixed | Plan 5.6 "Captures": served only for an account holder with a declared capture route, matched by `address` = `creds.username`, under `revealSecret`; single-secret fallback limited to landing pages; captures stated as client-reported (4.3 no longer cites them as server facts); `addCapture.secret` withheld and a validator error; test covers forged entries. |
| M3 slice 1 relies on `locksScreen` and workstation state | fixed | Plan 5.4: slice 1 drives sessions from the PC's existing `lockChance` / `locksScreenOnLeave` (no field: always locks, the safe default); `isWorkstation` accepts `lockType: "login"`; claim refusals and the validator warning key on `lockChance`; the later habit only fills `lockChance` (6.2). No "would lock every time" warning, since that default is safe. |
| m1 `container` lookup needs `contents` | fixed | Plan 5.3 "Content": the sign-in branch looks up with `find_object_in_scenario`; room data marks a sign-in PC `hasContents: true` so the client routes it as a container. |
| m2 card copies from keycard objects, mixed doors | fixed | Plan 4.3: one call from the save point with `npc_id` or `object_id`, object checks named; 4.1 states a `requires` card keeps today's client-trusted rule on a mixed door. |
| m3 gate doors | fixed | Plan 4.1: `access` not supported on gate doors in slice 1; validator error (step 5). |
| m4 creds outside room NPCs | fixed | Plan 3 and 5.6: `role` and `creds` allowed on room NPCs only; validator error elsewhere. |
| m5 nested containers bypass the session | fixed | Plan 5.1 lookups and 5.3 "Session scope": `login_scope_of` / `session_admits?` guard `container`, `/unlock` (even `method: "unlocked"`) and the take; `find_scenario_object` walks profiles; tests in step 3. |
| m6 card-only NPCs and derived `rfidCard` | fixed | Plan 3: an account means `creds.username`; tiles, sign-in and the `needsHome` check apply only to accounts; the client `rfidCard` is the card as authored, `name` included. |
| m7 sticky note slice and test clash; ink wording | fixed | `writesDown` fill moved to the habits slice (6.2, 5.6 "Deliberate clues"); the no-password test excludes an authored note; step 5 uses "any compiled ink file". |
| m8 `known` picker sources | fixed | Plan 5.3: `known` means "whose room you have entered"; the intel-fact half dropped, with **Other user** typing in every mode; `portrait` sourced from `spriteTalk`, the derived portrait, else `avatar`. |
| m9 small inaccuracies | fixed | Plan 5.6 names the `obj['npcs']` loop and a `withhold_npc_secrets!` helper; `copiedItems` sites cut to `filter_container_contents` and the compose step; bootstrap wording says "room NPCs". |
| R1 B1 login content gate (lookup) | fixed | Closed with m1 above. |
| R1 B2 password via room endpoint (gaps) | fixed | Closed with M2 and m4 above. |
| R1 M1 role-ACL RFID on the client | fixed | Closed with M1 above. |
| R1 M2 copied-card identity (gaps) | fixed | Closed with m2 and M2 above. |
| R1 M3 profile item ids (lookups) | fixed | Closed with B1 and m5 above. |
| R1 M5 Copy and the held filters | fixed | Closed with B1 and m9 above. |
| R1 m5 unlocked-session trust (warning key) | fixed | Closed with M3 above. |
| R1 m6 two homes for a password (`addCapture.secret`) | fixed | Closed with M2 above; the proof beat in `lab_physical_pentest` removes both inline secrets (step 7). |
| R1 m7 sticky note | fixed | Closed with m7 above. |
