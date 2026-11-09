# Access model plan: review, round 4

Reviewed: `docs/achitechture/ACCESS_MODEL_PLAN.md` as rewritten after round 3. Read-only adversarial
review by a fresh reviewer, checked against the working tree on 2026-11-09. Line numbers are the
current tree's. The plan's section 2 decisions (the user's and the orchestrator's) are not
relitigated.

## 1. Verdict

**Revise once more (round 5 is the last), then build the first slice.** Counts: 0 blockers,
1 major, 8 minor.

The round 3 rewrite is the clearest version yet. The server routes table (section 6) is the right
shape, the later slices sit after the first slice, and the plan is self-contained: no finding ids,
change notes or review references. Nearly every file:line it cites checks out (section 4). Of the
round 3 findings, M1 (locked folders on the take path), M2 (`access` on rfid objects), m1 (the
`/unlock` guard), m2 (`pc_id`), m4 (`/capture_secrets`), m6, m7 and m9 are closed.

One thing would still fail as written:

- The "owner present" test checks only that the needs system tracks the owner, that they are at
  their post and that they are not knocked out. An owner removed from the scene, hidden, or turned
  hostile at the desk keeps `atPost: true` in the needs system, so their PC reads "<name> is using
  this PC" for the rest of the mission and cannot be signed into, password or not. This is the
  round 3 B1 failure by a narrower route (M1).

The minors are mostly plumbing the first slice will trip over: where the sign-in events are
emitted, the `/clone_card` object source, identity uniqueness, `acceptsUIDOnly` on the client, and
a few build-order and wording slips.

## 2. Severity table

| Severity | Count | Items |
|---|---|---|
| Blocker | 0 | |
| Major | 1 | M1 a removed, hidden or hostile owner leaves their PC "in use" for ever |
| Minor | 8 | m1 the claim's server checks and the client's presence rules disagree, m2 `attemptsLeft` and lockout answers give accounts away or mislead, m3 client sign-in plumbing in step 4, m4 `/clone_card` sources and the copier, m5 `acceptsUIDOnly` never reaches the client, m6 identity by value needs uniqueness rules, m7 build order and reset wording, m8 small inaccuracies |

## 3. Findings

### Major

**M1. A removed, hidden or hostile owner leaves their PC "in use" for ever.**

*Issue.* Plan 5.4 defines the owner as present when `npcNeedsSystem.getState(ownerId)` is not
null, that state has `atPost: true`, and `npcHostileSystem.isNPCKO` is false. `onInteract` then
returns `attended` and the client opens nothing. Three common ways for an owner to leave the desk
change none of those three values:

- **Removed from the scene** (the `#remove_npc` ink tag, `chat-helpers.js:255-273`):
  `removeNpcFromScene` destroys the sprite and records the removal on the server
  (`npc-game-bridge.js:764-776`). It does not tell the needs system. `npcPos` then returns null
  (`npc-needs.js:1510-1514`), so `_tickNpc` only decays needs and returns
  (`npc-needs.js:559-560`): `atPost` stays `true`, `getState` stays non-null, and no
  `npc_left_post` is emitted.
- **Hidden** (`setNPCVisible(false)`, the `setVisible` mapping, `npc-manager.js:1179-1184`, or an
  NPC that starts hidden for a delayed appearance): the needs system marks it blocked
  (`npc-needs.js:563-571`, `hidden: !b?.sprite?.body?.enable` at `:1517-1524`) but leaves `atPost`
  as it was. An NPC registers with `atPost: true` (`npc-needs.js:264`), so an owner who starts
  hidden reads as at the desk from the first frame.
- **Hostile** (the `#hostile` tag, `chat-helpers.js:276-300`): the same block, the same unchanged
  `atPost`. The PC says "Jake is using this PC" while Jake is chasing the player round the office.

In each case `onInteract` returns `attended` and the plan's rule stops the interaction, so the
player can never reach the sign-in screen at that PC. The away record is never set either, so the
lighting indicator (`lighting.js:116-122`) shows the desk as occupied too.

*Evidence.* As above. Round 3 B1 recommended "a needs NPC currently at its post (not knocked out,
hidden or removed)"; the plan kept only the knock-out.

*Why it matters.* `remove_npc` is how missions send a character home after a confrontation
(`m01_derek_confrontation.ink`, `m04_npc_voltage.ink`), and hidden-until-revealed NPCs are
common. Any such NPC who owns a sign-in PC locks it for the rest of the mission, silently: no
error and no validator warning.

*Recommended change.* In 5.4 and step 4:

- Present means: `getState(ownerId)` is not null, `atPost` is true, **and the needs system's own
  availability test passes**: the sprite exists (`npcPos` not null) and `npcStatus` reports not
  `ko`, not `hostile`, not `hidden` (`npc-needs.js:1517-1524`, the test `_tickNpc` already applies
  at `:563`). Reuse that test rather than adding a second one; the workstation env gains one
  function, for example `ownerPresent(id)`, that calls it.
- When the owner is not present and has no away record, `onInteract` returns a distinct value
  (for example `signin`) and emits nothing. Returning `locked` would emit
  `workstation_locked_attempt` (`workstation-state.js:175-177`) every time the player opens a PC
  whose owner simply is not tracked, and scenarios map that event to "she locked it while she was
  away" hints.
- Step 4: name the client tests in `test/js/workstation-state.test.mjs` (unowned PC, owner at the
  desk, owner away with screen open and locked, owner knocked out, owner removed, owner hidden,
  owner untracked). Step 4 lists no client tests at present.

### Minor

**m1. The claim's server checks and the client's presence rules disagree.**

- 5.4 says an owner with no `needs` leaves the screen locked and "offers no claim", and the step 5
  warning says no unlocked session is ever possible there. But 5.4 also has the workstation layer
  treat `npc_ko:<id>` as leaving, and `onLeft` runs for any NPC id (`workstation-state.js:141-151`),
  so knocking out an untracked owner sets the away record, rolls the screen, and can return
  `accessed`. Decide which rule wins and word the warning to match.
- Section 6's claim checks never ask whether the owner has `needs` (or can be knocked out), so the
  server honours a claim at a PC where the scenario makes none possible, against the decision in
  section 2 ("honoured only where the scenario makes one possible"). Add the check that matches
  the rule chosen above.
- `npc_ko` on an owner who is already away calls `onLeft` again, which increments `leaves` and
  re-rolls `decideLocked` (`workstation-state.js:143-148`), so knocking out an owner on a
  `lockChance: 0.5` PC can flip a locked screen to open. Treat a knock-out as leaving only when the
  owner is not already away.

**m2. `attemptsLeft` and the lockout answers give accounts away or mislead.**

- Section 6 says an unknown username "reports the policy's full allowance, so it reads the same
  as a known one". It does not: after one wrong try a known account answers `maxAttempts - 1` and
  an unknown one answers `maxAttempts`, every time, so the count tells the player which usernames
  exist. Count failures per `pcId|username` for any typed username (lock out only real accounts,
  or both; locking a username nobody has harms nothing).
- Check 3 (lockout) fails inside "2 to 5", so every attempt on an already locked account, after
  the one that locked it, answers "Incorrect username or password". A player who reopens the
  screen and types the right password is told it is wrong. Answer `lockedOut: true` on every
  attempt at a locked account.
- Check 5 (`access`) refuses a correct password with the same "Incorrect username or password",
  so a player holding Jake's real password at a PC Jake may not use learns that the password is
  wrong and may never try it elsewhere. **USER DECISION (small):** keep the uniform message, or
  answer "This account may not sign in to this PC" after a correct password, which teaches the
  access list directly.

**m3. Client sign-in plumbing in step 4.**

- Step 4 has `password-minigame.js` emit `pc_signed_in` and `pc_signed_out`, but a claim is sent
  by `workstation-state.js` (5.4) and sign-outs come from the desktop header, the owner's return
  and the `autoLockMin` timer. Emit both events from the one client place every sign-in and
  sign-out passes through (the `api-client.js` calls or a small sessions module), so `via: "claim"`
  and the `unlock_object` task work for claims.
- Nothing in step 4 reads `sessions` from the scenario response on load (5.3 "Reload"). Name the
  file (where `savedGlobalVariables` is restored) and where the client keeps its session list.
- Say that a sign-in never calls `unlockTarget` and never sets the PC's `locked` to false on the
  client. Otherwise the next click finds no lock, sends `method: "unlocked"`, and `/unlock`
  refuses it (check 1).
- On `accessed` at a sign-in PC the claim is a server round trip, but today the interaction runs
  straight on (`interactions.js:788-796`) into the `login` case. Say the interaction waits for the
  claim's answer and then opens the desktop or the sign-in screen.
- `sessions` records no `via`, so after a reload a claimed session cannot be told from a password
  one and the end rules (owner returns, `autoLockMin`) no longer apply to it; the away map also
  resets on reload (`workstation-state.js:94-116`). Record `via` and either drop claimed sessions
  when the scenario is fetched or ship `via` with `sessions`.
- The objectives manager's load-time reconcile completes `unlock_object` tasks from
  `unlockedObjects` only (`objectives-manager.js:247-252`). Ship `signedInPcs` (or reuse
  `sessions`) so a sign-in PC task whose completion request was lost before a reload still
  reconciles.

**m4. `/clone_card` sources and the copier.**

- The keycard object path the plan names (`interactions.js:870-896`) runs only for a keycard
  with `takeable: false`, which the code comments as "already in inventory". The usual source is
  therefore a held keycard, often one an NPC handed over to borrow and give back. The `/clone_card`
  object check ("in a room that is unlocked or never locked") refuses that card, because it sits
  in the server inventory or in an NPC's `itemsHeld`, not a room. Accept an object source that the
  server inventory holds, or that sits in a reachable room or unlocked container.
- In the minigame's unlock mode the player can read a held keycard (`availableCards`) and save it;
  that save names no source. Pass the card's object id there too.
- `#clone_keycard:<card_id>` names a card, and when it is not the conversation NPC's own card the
  client saves the named card anyway (`chat-helpers.js:343, 376-395`). The server records the
  NPC's own card, so the copy the player sees and the copy the server holds differ, and the copy
  never opens an `access` lock. Validator error: a `clone_keycard` tag whose card is not the
  speaking NPC's `creds.card` when that card is used by an `access` lock (or always).
- Section 6 counts a key of `serverClones` as held even after the player has lost or handed over
  the card copier. Require an `rfid_cloner` in the server inventory for a `serverClones` card to
  count, as `/clone_card` already does for recording one.

**m5. `acceptsUIDOnly` never reaches the client.** The `rfid` branch reads
`lockRequirements.acceptsUIDOnly` (`unlock-system.js:514`) and the minigame honours it
(`rfid-minigame.js:42, 197`), but neither requirement builder returns it
(`unlock-system.js:602-615, 681-691`), `doorProperties` does not copy it (`doors.js:518-544`) and
the bootstrap allow list drops it (`game.rb:819-821`). No scenario sets it today. The plan adds it
as a lock field checked on the server for the `access` path only, so on a mixed lock whose
`requires` names a DESFire card, `acceptsUIDOnly: true` still has no effect: step 1 of the client
order takes the minigame, which refuses the UID-only copy. Plumb it through the same four places
as `access` (steps 2 and 4).

**m6. Identity by value needs uniqueness rules.** Section 3 resolves a card by `card_id` and a
sign-in by `username`, but no validator check keeps either unique.

- Two NPCs with one `username` make `/login` check 2 and 4 ambiguous. Validator error.
- Shared cards already exist: in `m10_full_disclosure` two NPCs carry the `tg_power_room_card`
  `card_id` (the power room card of Imran Siddiqui and of Gary Whitlock). Once `rfidCard` is read
  as `creds.card` that card has two identities. Section 6's "an NPC whose identity passes" reads
  as "any of them", which works, but the keycard `"identity"` check, the dungeon graph's key node
  and step 5's identity reach need the rule stated: either a shared card carries every holder's
  identity, or the validator errors on a shared `card_id` used by an `access` lock.
- The capture route matches an earned entry's `address` to `creds.username` (5.6). The Pierce
  capture's authored address is `m.pierce` (`lab_physical_pentest/scenario.json.erb:829, 835`) and
  `workstation_accessed` carries no payload to overlay it, so step 7 must give Pierce
  `username: "m.pierce"`, and the validator should error when an account holder's
  `usePayload.address` or `addCapture.address` differs from `creds.username`. Otherwise the
  capture silently never answers.

**m7. Build order and reset wording.**

- Step 2's tests include "the no-password test (section 6)", which calls `/login_accounts`, a
  route step 3 adds. Run that part of the test in step 3.
- Step 3 says "`initialize_player_state` and the reset allow list: the six new keys". The reset's
  allow list is `preserved_keys` (`game.rb:95-97`): keys on it survive a reset. The new keys must
  stay off it (5.3 says the reset drops them); only `initialize_player_state` gains them.
- Step 1 does not say where the loader runs. The normal place is `generate_scenario_data`, beside
  `stamp_scenario_object_ids!` (`game.rb:3059`), so the result is persisted once. Games already in
  progress keep scenario data with `rfidCard` and no `creds`, so the server should read
  `creds.card || rfidCard`, and the withholding should derive `rfidCard` only when `creds.card` is
  present, never delete an existing one.

**m8. Small inaccuracies.**

- Section 2, "Copied cards", points to "section 4.3"; copying is section 4.2.
- 5.6 cites `game.rb:863-876` for "the client writes it into globals and the server persists it";
  that range is the comment and head of `capture_secrets_for_client`. The write is
  `sync_state` merging `globalVariables` (`games_controller.rb:1485-1486`).
- A door unlock also returns room data, through `filtered_room_data` (`games_controller.rb:888`).
  Section 6 lists the sign-in PC's `loginAccounts` only under `GET /room/:id`; compose the tiles in
  `filtered_room_data` (as the withholding is) so the door response carries them, and say so in
  the table's `/unlock` row.

## 4. What checked out

- Owner tracking: `getState` with `atPost` (`npc-needs.js:1346-1352`), `isNPCKO`
  (`npc-hostile.js:90`), `npc_ko` and `npc_ko:<id>` (`npc-hostile.js:350-354`), script moves
  clearing `atPost` without `npc_left_post` (`npc-needs.js:333-344`), `onInteract` and `ownerOf`
  (`workstation-state.js:52-58, 166-182`). An unowned PC is no longer a workstation, so it goes
  straight to sign-in. Lighting already adds screen indicators to any owned workstation
  (`lighting.js:116`), so owned sign-in PCs gain them for free.
- `/unlock`: the "already unlocked" return (`game.rb:1186-1189`), `method: "unlocked"`
  (`:1199-1208`), `npc` (`:1210-1213`) and `flag_reward` (`:1223-1227`) all run before the lock
  type check, so the guard has to come first, as section 6 now says. Only `/unlock` writes
  `unlockedObjects` (`games_controller.rb:901`, `game.rb:137-139`); flag-station `unlock_object`
  rewards are forwarded to the client (`games_controller.rb:2398-2400`) and come back through
  `/unlock`, so they meet the guard too.
- `path_unlocked?` covers the take, `container` and `/unlock`; the take today checks one level
  (`games_controller.rb:1884-1890`), so the new check is needed and placed correctly.
- `access` on objects: `getLockRequirementsForItem` (`unlock-system.js:681-691`, chosen at
  `:115-117`) is now named. An `access`-only lock reaches step 2 because
  `evaluateRfidCredential(undefined)` matches nothing (`unlock-system.js:69-94`).
- Dropping `pc_id`: `notifyServerUnlock` (`unlock-system.js:20-48`) and the password minigame
  send only the target, and "any current session admits the scope" needs nothing more.
- Sign-in tasks: `complete_task!`'s `unlock_object` reads `unlockedObjects`
  (`game.rb:1565-1568`) and the client completes on `item_unlocked`
  (`objectives-manager.js:303-306, 489-503`), so the `signedInPcs` and `pc_signed_in` additions
  are the right hooks (emission point in m3).
- `/capture_secrets`: the early return is at `game.rb:896`; the `social` and `revealSecret`
  returns above it stay, and `lab_physical_pentest` sets `revealSecret` (`:48`).
- Card copies: one save point (`rfid-minigame.js:280-300` to `rfid-data.js:286`); DESFire
  `masterKeyKnown` is only ever false (`rfid-data.js:63`, no other writer), so recording DESFire
  copies as UID-only matches the minigame (`rfid-minigame.js:192-214`).
- `with_game_lock` list at `games_controller.rb:84`; `container`, `unlock`, `inventory`,
  `complete_task` and `room` are on it already.
- `sync_state` writes only named sections (`games_controller.rb:1475-1571`), so the client cannot
  write `sessions`, `serverClones` or the other new keys; `update_room` cannot set `contents`,
  `locked` or `lockType` (`games_controller.rb:2306-2312`).
- `scenario_map` (`games_controller.rb:390-429`) ships no objects or NPC fields, so it needs no
  withholding.
- Portraits: `_resolveTalkImageSrc` and `_isTalkSheet` (`person-chat-portraits.js:375-387,
  523-528`); NPCs carry `avatar` (`npc-manager.js:1501`).
- Validator field lists at `validate_scenario.rb:390-394, 405-409, 412-419, 484-510`.
- The routes table is complete apart from the door response in m8, and its check order is right
  apart from m2. Steps 1 to 7 are buildable in order apart from m7.
- The plan is self-contained: no finding ids, change notes or review references.

## 5. Earlier findings: closed or not

| Finding | Round 4 check |
|---|---|
| R3 B1 unowned or never-leaving owner reads "in use" for ever | **Closed** for unowned PCs, untracked owners, script-moved owners and knocked-out owners. **Not closed** for removed, hidden or hostile owners (M1). |
| R3 M1 take path skips locked folders | Closed. |
| R3 M2 `access` on rfid objects | Closed. |
| R3 m1 `/unlock` guard placement | Closed. |
| R3 m2 where `pc_id` is sent | Closed. |
| R3 m3 sign-in event and task hook | Closed in design; the emission point and reload reconcile are in m3. |
| R3 m4 `/capture_secrets` early return | Closed; the address match is in m6. |
| R3 m5 copies and the copier's rules | Closed for whose card is recorded and UID-only copies. The withdrawal of the 50-card concern is right: `serverClones` is keyed by cards the scenario defines, so it is bounded, and an honest client sends only the cards still on its list. Object sources, the tag's card id and the copier still being held are in m4; `acceptsUIDOnly` on the client in m5. |
| R3 m6 lockout and the minigame's own limit | Closed; the answers after a lockout are in m2. |
| R3 m7 `/clone_card` lock, claim room check | Closed. |
| R3 m8 portrait images | Closed. |
| R3 m9 hard to follow | Closed. |
| R2 B1, M1, M2, M3, m2, m5, m8 (marked fixed in the R3 response) | Closed. |
| R1 M1 role-ACL RFID on the client | Closed for doors and objects. |
| R1 m4 skip check needs lock-order data (deferred) | Deferral justified. The validator has room reachability (`reachable_without`, `validate_scenario.rb:3831`) but no intended order of locks, so "opens a lock earlier than intended" cannot be computed yet; listing each identity's reach is the right first-slice scope. |

## 6. Open questions for the user

One small one, in m2: whether a correct password at a PC the account may not use answers with the
uniform "Incorrect username or password" or with "This account may not sign in to this PC".
Everything else has an engineering fix within the decisions in plan section 2.
